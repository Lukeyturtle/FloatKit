import { router } from '../router.js';
import { h, platformPreview, statsPanel, wizardNav, money } from '../render.js';
import { design, setAccessory, toggleRoof, roofedSquares, readOnly } from '../state.js';
import { ACCESSORIES, ROOF } from '../catalog.js';

const rerender = (app) => {
  app.innerHTML = '';
  render(app);
};

export function render(app) {
  if (readOnly) return renderReadOnly(app);

  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, 'Add accessories'),
    h('p', { class: 'muted' }, 'Kit out your platform. Set a quantity for each item — and tap any tile to drop a ⛺ roof on it.'),
  ]);

  const board = h('div', { class: 'board' }, [
    h('div', { class: 'board-hint' }, '⛺ Tap a tile to add or remove a roof'),
    platformPreview({
      interactive: true,
      showConnectors: true,
      onSquareClick: (sq) => {
        toggleRoof(sq.id);
        rerender(app);
      },
    }),
  ]);

  const list = h('div', { class: 'acc-list card' }, [
    h('h3', {}, 'Accessories'),
    roofRow(),
    ...ACCESSORIES.map((a) => accessoryRow(a, app)),
  ]);

  const side = h('div', { class: 'side' }, [statsPanel(), list]);

  const nav = wizardNav({
    onBack: () => router.go('connect'),
    backLabel: '← Back to connections',
    onNext: () => router.go('summary'),
    nextLabel: 'Review platform →',
  });

  app.append(h('div', { class: 'screen' }, [head, h('div', { class: 'configure-layout' }, [board, side]), nav]));
}

function roofRow() {
  const n = roofedSquares().length;
  return h('div', { class: 'acc-row roof-row' }, [
    h('span', { class: 'acc-icon' }, ROOF.icon),
    h('div', { class: 'acc-body' }, [
      h('strong', {}, ROOF.name),
      h('span', { class: 'acc-price' }, `$${ROOF.price} each · tap tiles`),
    ]),
    h('span', { class: 'acc-count-badge' }, `${n} added`),
  ]);
}

function accessoryRow(a, app) {
  const count = design.accessories[a.id] || 0;
  return h('div', { class: 'acc-row' + (count ? ' has-count' : '') }, [
    h('span', { class: 'acc-icon' }, a.icon),
    h('div', { class: 'acc-body' }, [
      h('strong', {}, a.name),
      h('span', { class: 'acc-price' }, `$${a.price} each`),
    ]),
    h('div', { class: 'stepper acc-stepper' }, [
      h('button', { class: 'icon-btn', onclick: () => { setAccessory(a.id, count - 1); rerender(app); } }, '−'),
      h('strong', {}, String(count)),
      h('button', { class: 'icon-btn', onclick: () => { setAccessory(a.id, count + 1); rerender(app); } }, '+'),
    ]),
  ]);
}

// ---- read-only shared view ----------------------------------------------
function renderReadOnly(app) {
  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, 'Accessories'),
    h('p', { class: 'muted' }, 'The gear that comes with this platform.'),
  ]);

  const roofs = roofedSquares().length;
  const rows = ACCESSORIES.filter((a) => (design.accessories[a.id] || 0) > 0).map((a) =>
    h('div', { class: 'acc-row has-count' }, [
      h('span', { class: 'acc-icon' }, a.icon),
      h('div', { class: 'acc-body' }, [h('strong', {}, a.name), h('span', { class: 'acc-price' }, money(a.price) + ' each')]),
      h('span', { class: 'acc-count-badge' }, `× ${design.accessories[a.id]}`),
    ])
  );
  if (roofs) {
    rows.unshift(
      h('div', { class: 'acc-row has-count' }, [
        h('span', { class: 'acc-icon' }, ROOF.icon),
        h('div', { class: 'acc-body' }, [h('strong', {}, ROOF.name), h('span', { class: 'acc-price' }, money(ROOF.price) + ' each')]),
        h('span', { class: 'acc-count-badge' }, `× ${roofs}`),
      ])
    );
  }

  const list = h('div', { class: 'acc-list card' }, [
    h('h3', {}, 'Accessories'),
    rows.length ? h('div', {}, rows) : h('p', { class: 'muted' }, 'No accessories on this build.'),
  ]);

  const board = h('div', { class: 'board' }, [platformPreview({ showConnectors: true })]);
  const side = h('div', { class: 'side' }, [statsPanel(), list]);

  const nav = wizardNav({
    onBack: () => router.go('connect'),
    backLabel: '← Back to connections',
    onNext: () => router.go('summary'),
    nextLabel: 'See the summary →',
  });

  app.append(h('div', { class: 'screen' }, [head, h('div', { class: 'configure-layout' }, [board, side]), nav]));
}
