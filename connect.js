import { router } from '../router.js';
import { h, platformPreview, statsPanel, wizardNav, squareLabel } from '../render.js';
import { design, connectablePairs, connectorEligibility, getConnector, setConnector, readOnly } from '../state.js';
import { CONNECTORS } from '../catalog.js';

const rerender = (app) => {
  app.innerHTML = '';
  render(app);
};

export function render(app) {
  const pairs = connectablePairs();

  // Sensible defaults: touching squares clip directly; gapped squares get a bridge.
  // Never in read-only — a shared design's connectors are exactly as authored.
  if (!readOnly) {
    for (const p of pairs) {
      if (!getConnector(p.a.id, p.b.id)) {
        setConnector(p.a.id, p.b.id, p.distance === 1 ? 'direct' : 'bridge');
      }
    }
  }

  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, readOnly ? 'How it connects' : 'Connect your squares'),
    h('p', { class: 'muted' }, readOnly ? 'The links between each pair of squares in this build.' : 'Choose how each neighbouring pair of squares joins together.'),
    !readOnly && h('p', { class: 'fine' }, 'Tip: “Not joined” leaves that pair unfastened — the squares float independently, so use it to split your build into separate mini-platforms or to undo a link.'),
  ]);

  const rows = pairs.length
    ? pairs.map((p) => pairRow(p, app))
    : [
        h('div', { class: 'empty card' }, [
          h('p', {}, 'None of your squares are close enough to connect.'),
          h('p', { class: 'muted' }, 'Go back and place squares next to each other (or one gap apart) to link them.'),
        ]),
      ];

  const board = h('div', { class: 'board' }, [platformPreview({ showConnectors: true })]);
  const side = h('div', { class: 'side' }, [statsPanel(), h('div', { class: 'pair-list' }, rows)]);

  const nav = readOnly
    ? wizardNav({
        onBack: () => router.go('configure'),
        backLabel: '← Back to grid',
        onNext: () => router.go('summary'),
        nextLabel: 'See the summary →',
      })
    : wizardNav({
        onBack: () => router.go('configure'),
        backLabel: '← Back to squares',
        onNext: () => router.go('summary'),
        nextLabel: 'Review platform →',
      });

  app.append(h('div', { class: 'screen' }, [head, h('div', { class: 'configure-layout' }, [board, side]), nav]));
}

function pairRow(p, app) {
  const current = getConnector(p.a.id, p.b.id)?.type || 'none';
  const elig = connectorEligibility(p.a, p.b, p.distance);

  // In read-only, show only the chosen connector as a static chip.
  if (readOnly) {
    const info = current === 'none'
      ? { icon: '⛔', name: 'Not joined' }
      : CONNECTORS.find((c) => c.id === current) || { icon: '🔗', name: current };
    return h('div', { class: 'pair card' }, [
      pairHead(p),
      h('div', { class: 'conn-options' }, [
        h('div', { class: 'conn-btn selected static' }, [h('span', { class: 'cb-icon' }, info.icon), h('span', {}, info.name)]),
      ]),
    ]);
  }

  const buttons = [
    connButton(
      {
        id: 'none',
        name: 'Not joined',
        icon: '⛔',
        blurb: 'These two squares aren’t fastened together — they float on their own.',
      },
      current,
      true,
      '',
      () => {
        setConnector(p.a.id, p.b.id, null);
        rerender(app);
      }
    ),
  ].concat(
    CONNECTORS.map((c) => {
      const e = elig[c.id];
      return connButton(c, current, e.ok, e.hint, () => {
        if (!e.ok) return;
        setConnector(p.a.id, p.b.id, c.id);
        rerender(app);
      });
    })
  );

  return h('div', { class: 'pair card' }, [pairHead(p), h('div', { class: 'conn-options' }, buttons)]);
}

function pairHead(p) {
  return h('div', { class: 'pair-head' }, [
    h('span', { class: 'pair-a' }, `${squareLabel(p.a)} (${p.a.x + 1},${p.a.y + 1})`),
    h('span', { class: 'pair-link' }, p.distance === 1 ? '⟷' : '⋯'),
    h('span', { class: 'pair-b' }, `${squareLabel(p.b)} (${p.b.x + 1},${p.b.y + 1})`),
  ]);
}

function connButton(c, current, ok, hint, onClick) {
  const btn = h(
    'button',
    {
      class: 'conn-btn' + (current === c.id ? ' selected' : '') + (ok ? '' : ' disabled'),
      title: ok ? c.blurb || '' : hint,
      onclick: onClick,
    },
    [h('span', { class: 'cb-icon' }, c.icon), h('span', {}, c.name)]
  );
  if (!ok) btn.disabled = true;
  return btn;
}
