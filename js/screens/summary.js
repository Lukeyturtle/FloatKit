import { router } from '../router.js';
import { h, platformPreview, statsPanel, money, downloadPNG, squareLabel, squareDetail, openModal } from '../render.js';
import { design, computeStats, squarePrice, readOnly, remixSharedDesign, roofedSquares } from '../state.js';
import { anchorById, connectorById, squareType, accessoryById, ROOF } from '../catalog.js';
import { generateCode, encodeDesign, buildShareLink, buildPrefillUrl } from '../share.js';
import { formConfigured } from '../config.js';

export function render(app) {
  const stats = computeStats();
  const anchor = anchorById(design.anchor);

  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, 'Your FloatKit platform'),
    h('p', { class: 'muted' }, 'Here’s everything you designed. Download it or tweak any step.'),
  ]);

  const board = h('div', { class: 'board' }, [platformPreview({ showConnectors: true })]);

  // itemized list
  const items = [];
  if (anchor) items.push(lineItem(anchor.icon, anchor.name, anchor.tag, anchor.price));
  for (const sq of design.squares) {
    if (sq.locked) continue; // the centre anchor block isn't a line item
    const t = squareType(sq.type);
    items.push(lineItem(t?.icon || '⬜', squareLabel(sq) + ` (${sq.x + 1},${sq.y + 1})`, squareDetail(sq), squarePrice(sq)));
  }
  for (const c of design.connectors) {
    const info = connectorById(c.type);
    if (!info || c.type === 'direct') continue; // direct is free/implicit
    items.push(lineItem(info.icon, info.name + ' connector', '', info.price));
  }
  // accessories
  const roofs = roofedSquares().length;
  if (roofs) items.push(lineItem(ROOF.icon, `${ROOF.name} × ${roofs}`, '', ROOF.price * roofs));
  for (const [id, count] of Object.entries(design.accessories || {})) {
    const a = accessoryById(id);
    if (!a || !count) continue;
    items.push(lineItem(a.icon, `${a.name} × ${count}`, '', a.price * count));
  }

  const list = h('div', { class: 'invoice card' }, [
    h('h3', {}, 'Build sheet'),
    ...items,
    h('div', { class: 'invoice-total' }, [h('span', {}, 'Total'), h('strong', {}, money(stats.price))]),
  ]);

  const actions = readOnly
    ? h('div', { class: 'summary-actions' }, [
        h('button', { class: 'btn primary', onclick: () => doRemix() }, '✏️ Remix this design'),
        h('button', { class: 'btn', onclick: () => downloadPNG() }, '⬇ Download as image (PNG)'),
      ])
    : h('div', { class: 'summary-actions' }, [
        h('button', { class: 'btn primary', onclick: () => openShareModal() }, '🚀 Request early access & get my code'),
        h('button', { class: 'btn', onclick: () => downloadPNG() }, '⬇ Download my platform (PNG)'),
      ]);

  const side = h('div', { class: 'side' }, [statsPanel(), list, actions]);

  const nav = readOnly
    ? h('div', { class: 'wizard-nav' }, [
        h('button', { class: 'btn ghost', onclick: () => router.go('accessories') }, '← Back to accessories'),
        h('button', { class: 'btn ghost', onclick: () => router.go('configure') }, 'Back to grid'),
      ])
    : h('div', { class: 'wizard-nav' }, [
        h('button', { class: 'btn ghost', onclick: () => router.go('accessories') }, '← Back to accessories'),
        h('button', { class: 'btn ghost', onclick: () => router.go('configure') }, 'Edit squares'),
      ]);

  app.append(h('div', { class: 'screen' }, [head, h('div', { class: 'configure-layout' }, [board, side]), nav]));
}

function lineItem(icon, name, detail, price) {
  return h('div', { class: 'line-item' }, [
    h('span', { class: 'li-icon' }, icon),
    h('div', { class: 'li-body' }, [h('strong', {}, name), detail && h('span', { class: 'li-detail' }, detail)]),
    h('span', { class: 'li-price' }, price ? money(price) : '—'),
  ]);
}

function doRemix() {
  const banner = document.getElementById('sharebanner');
  if (banner) banner.hidden = true;
  remixSharedDesign();
  router.reset('configure');
}

function openShareModal() {
  const code = generateCode();
  const encoded = encodeDesign(design);
  const link = buildShareLink(code, encoded);
  const prefill = buildPrefillUrl(code, encoded);

  const linkInput = h('input', { class: 'share-link', type: 'text', readonly: 'readonly', value: link });
  linkInput.addEventListener('focus', () => linkInput.select());

  const copyBtn = h('button', { class: 'btn', onclick: () => copyText(link, copyBtn) }, 'Copy link');

  const body = h('div', { class: 'share-modal' }, [
    h('p', { class: 'muted' }, 'Your design is ready to share. Your link works instantly. Your 6-digit code works once you submit the early-access form (that’s what saves your design).'),
    h('div', { class: 'code-box' }, [
      h('span', { class: 'code-label' }, 'Your code'),
      h('span', { class: 'code-value' }, code),
    ]),
    h('label', { class: 'field' }, [
      h('span', {}, 'Shareable link'),
      h('div', { class: 'link-row' }, [linkInput, copyBtn]),
    ]),
    prefill
      ? h('a', { class: 'btn primary full', href: prefill, target: '_blank', rel: 'noopener' }, '📝 Open the early-access form →')
      : h('p', { class: 'fine' }, 'Tip: add your Google Form details in js/config.js to collect early-access sign-ups and make bare codes resolvable.'),
  ]);

  openModal(body, { title: '🎉 Your platform is ready' });
}

function copyText(text, btn) {
  const done = () => {
    const old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => (btn.textContent = old), 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch (e) {
    /* ignore */
  }
  ta.remove();
}
