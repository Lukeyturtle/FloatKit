// Shared rendering helpers: DOM builder, money format, the platform preview
// (grid + connectors), the live stats panel, a modal, and PNG export.

import {
  GRID_COLS,
  GRID_ROWS,
  squareType,
  connectorById,
  ADVENTURE_OPTIONS,
  RELAX_OPTIONS,
  WALL_TYPES,
} from './catalog.js';
import { design, computeStats, squarePrice, getConnector } from './state.js';

// tiny hyperscript helper
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// The chosen sub-option for a customizable square (adventure/relax), if any.
export function squareOption(sq) {
  const cfg = sq.config || {};
  if (sq.type === 'adventure' && cfg.option) return ADVENTURE_OPTIONS.find((o) => o.id === cfg.option) || null;
  if (sq.type === 'relax' && cfg.option) return RELAX_OPTIONS.find((o) => o.id === cfg.option) || null;
  return null;
}

export function squareGlyph(sq) {
  const opt = squareOption(sq);
  if (opt) return opt.icon; // e.g. a beanbag Relax square shows the 🫘 emoji
  const t = squareType(sq.type);
  return t ? t.icon : '⬜';
}

// Drop a redundant type word from an option name, e.g. "Beanbag relax" -> "Beanbag".
function cleanOptionName(typeName, optName) {
  const cleaned = optName.replace(new RegExp('\\s*' + typeName + '\\s*', 'i'), ' ').trim();
  return cleaned || optName;
}

// Full label — "Relax: Beanbag" when a sub-option is chosen, else the type name.
export function squareLabel(sq) {
  const t = squareType(sq.type);
  const opt = squareOption(sq);
  if (opt && t) return `${t.name}: ${cleanOptionName(t.name, opt.name)}`;
  return t ? t.name : 'Square';
}

// Short label for tight spaces (grid tiles): the option name alone if present.
export function squareShortLabel(sq) {
  const t = squareType(sq.type);
  const opt = squareOption(sq);
  if (opt && t) return cleanOptionName(t.name, opt.name);
  return t ? t.name : 'Square';
}

// A concise description of the *remaining* customization, for build-sheet lists.
// (The chosen adventure/relax option is already shown in squareLabel.)
export function squareDetail(sq) {
  const cfg = sq.config || {};
  const bits = [];
  if (sq.type === 'twostory') {
    if (cfg.bottomType) bits.push('bottom: ' + squareType(cfg.bottomType)?.name);
    if (cfg.top) bits.push('top: ' + cfg.top);
    const walls = cfg.walls || {};
    const wallBits = Object.entries(walls)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${n}× ${WALL_TYPES.find((w) => w.id === id)?.name.toLowerCase() || id}`);
    if (wallBits.length) bits.push(wallBits.join(', '));
  }
  if (cfg.ladder) bits.push('ladder');
  if (cfg.ziplineStation) bits.push('zipline station');
  return bits.join(' · ');
}

// ---- platform preview ----------------------------------------------------
// opts: { interactive, onCellClick, onSquareClick, showConnectors, selectedId }
export function platformPreview(opts = {}) {
  const wrap = h('div', { class: 'preview-wrap' });
  const grid = h('div', { class: 'grid' + (opts.interactive ? ' interactive' : '') });
  grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const sq = design.squares.find((s) => s.x === x && s.y === y);
      const cell = h('div', { class: 'cell' + (sq ? ' filled' : '') });
      if (sq) {
        const t = squareType(sq.type);
        const tile = h(
          'div',
          {
            class: 'tile' + (sq.locked ? ' locked' : ''),
            style: { background: t?.color || '#7fd1e6', color: sq.locked ? '#fff' : '' },
          },
          [
            h('span', { class: 'tile-icon' }, squareGlyph(sq)),
            h('span', { class: 'tile-name' }, squareLabel(sq)),
          ]
        );
        if (opts.selectedId === sq.id) tile.classList.add('selected');
        if (opts.interactive && opts.onSquareClick) {
          tile.addEventListener('click', (e) => {
            e.stopPropagation();
            opts.onSquareClick(sq);
          });
        }
        cell.append(tile);
      } else if (opts.interactive && opts.onCellClick) {
        cell.addEventListener('click', () => opts.onCellClick(x, y));
      }
      grid.append(cell);
    }
  }
  wrap.append(grid);

  if (opts.showConnectors) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'connector-overlay');
    svg.setAttribute('viewBox', `0 0 ${GRID_COLS} ${GRID_ROWS}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    for (const c of design.connectors) {
      const a = design.squares.find((s) => s.id === c.a);
      const b = design.squares.find((s) => s.id === c.b);
      if (!a || !b) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x + 0.5);
      line.setAttribute('y1', a.y + 0.5);
      line.setAttribute('x2', b.x + 0.5);
      line.setAttribute('y2', b.y + 0.5);
      line.setAttribute('class', 'conn conn-' + c.type);
      svg.append(line);
    }
    wrap.append(svg);

    const chips = h('div', { class: 'chip-overlay' });
    for (const c of design.connectors) {
      const a = design.squares.find((s) => s.id === c.a);
      const b = design.squares.find((s) => s.id === c.b);
      if (!a || !b) continue;
      const mx = (a.x + b.x) / 2 + 0.5;
      const my = (a.y + b.y) / 2 + 0.5;
      const chip = h('div', { class: 'conn-chip' }, connectorById(c.type)?.icon || '🔗');
      chip.style.left = (mx / GRID_COLS) * 100 + '%';
      chip.style.top = (my / GRID_ROWS) * 100 + '%';
      chips.append(chip);
    }
    wrap.append(chips);
  }

  return wrap;
}

// ---- live stats panel ----------------------------------------------------
export function statsPanel() {
  const s = computeStats();
  return h('div', { class: 'stats card' }, [
    h('h3', {}, 'Your platform'),
    statRow('Squares', s.count),
    statRow('Footprint', s.footprint + ' m²'),
    statRow('Capacity', '~' + s.capacity + ' people'),
    h('div', { class: 'stat price' }, [
      h('span', {}, 'Est. price'),
      h('strong', {}, money(s.price)),
    ]),
  ]);
}

function statRow(label, value) {
  return h('div', { class: 'stat' }, [h('span', {}, label), h('strong', {}, String(value))]);
}

// ---- modal ---------------------------------------------------------------
export function openModal(node, { title } = {}) {
  const overlay = h('div', { class: 'modal-overlay' });
  const box = h('div', { class: 'modal card' });
  const close = () => overlay.remove();
  const header = h('div', { class: 'modal-header' }, [
    title ? h('h3', {}, title) : h('span', {}),
    h('button', { class: 'icon-btn', onclick: close, 'aria-label': 'Close' }, '✕'),
  ]);
  box.append(header, node);
  overlay.append(box);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.body.append(overlay);
  return { close };
}

// ---- PNG export ----------------------------------------------------------
export function downloadPNG(filename = 'my-floatkit-platform.png') {
  const squares = design.squares;
  const CELL = 96;
  const PAD = 1; // cells of padding
  let minX = 0,
    minY = 0,
    maxX = GRID_COLS - 1,
    maxY = GRID_ROWS - 1;
  if (squares.length) {
    minX = Math.min(...squares.map((s) => s.x)) - PAD;
    minY = Math.min(...squares.map((s) => s.y)) - PAD;
    maxX = Math.max(...squares.map((s) => s.x)) + PAD;
    maxY = Math.max(...squares.map((s) => s.y)) + PAD;
  }
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL + 56;
  const ctx = canvas.getContext('2d');

  // water background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#bfeaf5');
  grad.addColorStop(1, '#7cc7e0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = (x) => (x - minX) * CELL;
  const cy = (y) => (y - minY) * CELL;

  // connectors first (under tiles)
  ctx.lineWidth = 6;
  for (const c of design.connectors) {
    const a = squares.find((s) => s.id === c.a);
    const b = squares.find((s) => s.id === c.b);
    if (!a || !b) continue;
    ctx.strokeStyle =
      c.type === 'zipline' ? '#e8622a' : c.type === 'swim' ? '#1f7fb8' : c.type === 'spaced' ? '#8aa0ab' : '#5a4632';
    ctx.setLineDash(
      c.type === 'bridge' ? [10, 8] : c.type === 'zipline' ? [2, 10] : c.type === 'spaced' ? [3, 14] : []
    );
    ctx.beginPath();
    ctx.moveTo(cx(a.x) + CELL / 2, cy(a.y) + CELL / 2);
    ctx.lineTo(cx(b.x) + CELL / 2, cy(b.y) + CELL / 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // tiles
  for (const sq of squares) {
    const t = squareType(sq.type);
    const x = cx(sq.x) + 6;
    const y = cy(sq.y) + 6;
    const w = CELL - 12;
    roundRect(ctx, x, y, w, w, 16);
    ctx.fillStyle = t?.color || '#7fd1e6';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '34px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(squareGlyph(sq), x + w / 2, y + w / 2 - 6);
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20,40,60,0.85)';
    ctx.fillText(squareShortLabel(sq), x + w / 2, y + w - 14);
  }

  // caption
  const s = computeStats();
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#0d3b4f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `FloatKit · ${s.count} squares · ~${s.capacity} people · ${money(s.price)}`,
    16,
    canvas.height - 28
  );

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A reusable wizard footer with Back / Next buttons.
export function wizardNav({ onBack, backLabel = '← Back', onNext, nextLabel = 'Next →', nextDisabled } = {}) {
  const nav = h('div', { class: 'wizard-nav' });
  if (onBack) nav.append(h('button', { class: 'btn ghost', onclick: onBack }, backLabel));
  else nav.append(h('span'));
  if (onNext) {
    const btn = h('button', { class: 'btn primary', onclick: onNext }, nextLabel);
    if (nextDisabled) btn.disabled = true;
    nav.append(btn);
  }
  return nav;
}
