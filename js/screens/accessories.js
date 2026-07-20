import { router } from '../router.js';
import { h, platformPreview, statsPanel, wizardNav, money, openModal, squareLabel, squareDetail, squareGlyph } from '../render.js';
import {
  design,
  readOnly,
  placeAccessory,
  accessoryAllowed,
  accessoryBlockReason,
  tileAccessories,
  tileBlocksAccessories,
  allAccessoryTotals,
} from '../state.js';
import { ACCESSORIES, ROOF, WATERSPORTS_ONLY_IDS, squareType, accessoryById } from '../catalog.js';

const PLACEABLE = [ROOF, ...ACCESSORIES];

let mode = 'build'; // 'build' | 'preview'

const rerender = (app) => {
  app.innerHTML = '';
  render(app);
};

export function render(app) {
  const previewing = readOnly || mode === 'preview';

  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, readOnly ? 'Accessories' : 'Add accessories'),
    h('p', { class: 'muted' }, previewing
      ? 'Click any tile to see what’s on it.'
      : 'Click a tile to add accessories to it. Some items only fit certain tiles.'),
  ]);

  const toolbar = h('div', { class: 'acc-toolbar' }, [
    readOnly ? null : h('div', { class: 'mode-toggle' }, [
      modeBtn(app, 'build', '🔧 Build'),
      modeBtn(app, 'preview', '👁 Preview'),
    ]),
    h('div', { class: 'board-hint' }, previewing ? '👁 Tap a tile to inspect it' : '🔧 Tap a tile to kit it out'),
  ]);

  const board = h('div', { class: 'board' }, [
    toolbar,
    platformPreview({
      interactive: true,
      showConnectors: true,
      onSquareClick: (sq) => (previewing ? openTilePreview(sq) : openTileBuild(sq, app)),
    }),
  ]);

  const side = h('div', { class: 'side' }, [statsPanel(), previewing ? placedSummary() : legendCard()]);

  const nav = wizardNav({
    onBack: () => router.go('connect'),
    backLabel: '← Back to connections',
    onNext: () => router.go('summary'),
    nextLabel: readOnly ? 'See the summary →' : 'Review platform →',
  });

  app.append(h('div', { class: 'screen' }, [head, h('div', { class: 'configure-layout' }, [board, side]), nav]));
}

function modeBtn(app, m, label) {
  return h('button', {
    class: 'mode-btn' + (mode === m ? ' active' : ''),
    onclick: () => { mode = m; rerender(app); },
  }, label);
}

// ---- Build: edit one tile's accessories ---------------------------------
function openTileBuild(sq, app) {
  const container = h('div', { class: 'tile-acc-editor' });
  const redraw = () => {
    container.innerHTML = '';
    if (tileBlocksAccessories(sq)) {
      container.append(h('p', { class: 'muted' }, `No accessories can go on this ${squareType(sq.type)?.name} tile.`));
      return;
    }
    for (const acc of PLACEABLE) {
      const allowed = accessoryAllowed(acc.id, sq);
      const count = tileAccessories(sq)[acc.id] || 0;
      container.append(
        h('div', { class: 'acc-row' + (count ? ' has-count' : '') + (allowed ? '' : ' blocked') }, [
          h('span', { class: 'acc-icon' }, acc.icon),
          h('div', { class: 'acc-body' }, [
            h('strong', {}, acc.name),
            h('span', { class: 'acc-price' }, allowed ? money(acc.price) + ' each' : accessoryBlockReason(acc.id, sq)),
          ]),
          allowed
            ? h('div', { class: 'stepper acc-stepper' }, [
                h('button', { class: 'icon-btn', onclick: () => { placeAccessory(sq.id, acc.id, -1); redraw(); rerender(app); } }, '−'),
                h('strong', {}, String(count)),
                h('button', { class: 'icon-btn', onclick: () => { placeAccessory(sq.id, acc.id, 1); redraw(); rerender(app); } }, '+'),
              ])
            : h('span', { class: 'acc-blocked-tag' }, '🚫'),
        ])
      );
    }
  };
  redraw();
  openModal(container, { title: `${squareGlyph(sq)} ${squareLabel(sq)}` });
}

// ---- Preview: read-only look at one tile --------------------------------
function openTilePreview(sq) {
  const t = squareType(sq.type);
  const entries = Object.entries(tileAccessories(sq)).filter(([, n]) => n > 0);
  const detail = squareDetail(sq);
  const body = h('div', { class: 'tile-acc-editor' }, [
    t?.blurb && h('p', { class: 'muted' }, t.blurb),
    detail && h('p', { class: 'fine' }, 'Setup: ' + detail),
    h('h4', { class: 'tile-acc-head' }, 'On this tile'),
    entries.length
      ? h('div', {}, entries.map(([id, n]) =>
          h('div', { class: 'acc-row has-count' }, [
            h('span', { class: 'acc-icon' }, accessoryById(id)?.icon || '📦'),
            h('div', { class: 'acc-body' }, [h('strong', {}, accessoryById(id)?.name || id)]),
            h('span', { class: 'acc-count-badge' }, '× ' + n),
          ])
        ))
      : h('p', { class: 'muted' }, 'Nothing placed here yet.'),
  ]);
  openModal(body, { title: `${squareGlyph(sq)} ${squareLabel(sq)}` });
}

// ---- side panels ---------------------------------------------------------
function ruleText(id) {
  if (WATERSPORTS_ONLY_IDS.includes(id)) return 'Watersports tiles';
  if (id === 'docking') return 'Open-water side';
  return 'Any tile';
}

function legendCard() {
  return h('div', { class: 'card acc-legend' }, [
    h('h3', {}, 'Accessories'),
    ...PLACEABLE.map((acc) =>
      h('div', { class: 'legend-row' }, [
        h('span', { class: 'acc-icon' }, acc.icon),
        h('div', { class: 'legend-body' }, [
          h('strong', {}, acc.name),
          h('span', { class: 'acc-price' }, money(acc.price) + ' each'),
        ]),
        h('span', { class: 'legend-rule' }, ruleText(acc.id)),
      ])
    ),
  ]);
}

function placedSummary() {
  const totals = allAccessoryTotals();
  const rows = PLACEABLE.filter((a) => totals[a.id]).map((a) =>
    h('div', { class: 'acc-row has-count' }, [
      h('span', { class: 'acc-icon' }, a.icon),
      h('div', { class: 'acc-body' }, [h('strong', {}, a.name), h('span', { class: 'acc-price' }, money(a.price) + ' each')]),
      h('span', { class: 'acc-count-badge' }, '× ' + totals[a.id]),
    ])
  );
  return h('div', { class: 'card acc-list' }, [
    h('h3', {}, 'Accessories placed'),
    rows.length ? h('div', {}, rows) : h('p', { class: 'muted' }, 'No accessories placed yet.'),
  ]);
}
