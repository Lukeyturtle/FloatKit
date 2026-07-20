import { router } from '../router.js';
import { h, platformPreview, statsPanel, openModal, wizardNav, squareLabel, squareDetail, money } from '../render.js';
import {
  design,
  addSquare,
  removeSquare,
  setSquareType,
  updateSquareConfig,
  squareById,
  ensureCenterAnchor,
  squarePrice,
  readOnly,
  connectablePairs,
  getConnector,
  setConnector,
} from '../state.js';
import { SQUARE_TYPES, squareType } from '../catalog.js';

let activeType = 'normal';

const rerender = (app) => {
  app.innerHTML = '';
  render(app);
};

export function render(app) {
  ensureCenterAnchor(); // the locked ⚓ block always sits in the centre

  if (readOnly) return renderReadOnly(app);

  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, 'Configure your squares'),
    h('p', { class: 'muted' }, 'Build out from the ⚓ anchor block in the centre. Pick a square type, then click the water to place it. Click a placed square to customize or remove it.'),
  ]);

  // palette
  const palette = h(
    'div',
    { class: 'palette card' },
    [h('h3', {}, 'Square types')].concat(
      SQUARE_TYPES.map((t) =>
        h(
          'button',
          {
            class: 'palette-item' + (activeType === t.id ? ' active' : ''),
            style: { '--c': t.color },
            onclick: () => {
              activeType = t.id;
              rerender(app);
            },
          },
          [
            h('span', { class: 'pi-icon' }, t.icon),
            h('span', { class: 'pi-name' }, t.name),
            t.customizable && h('span', { class: 'pi-star', title: 'Customizable' }, '✦'),
          ]
        )
      )
    )
  );

  // interactive grid
  const preview = platformPreview({
    interactive: true,
    showConnectors: false,
    onCellClick: (x, y) => {
      const sq = addSquare(x, y, activeType);
      if (squareType(activeType)?.customizable) {
        openCustomization(sq.id);
      } else {
        rerender(app);
      }
    },
    onSquareClick: (sq) => openSquareEditor(sq, app),
  });

  const board = h('div', { class: 'board' }, [
    h('div', { class: 'board-hint' }, `Active: ${squareType(activeType)?.icon} ${squareType(activeType)?.name}`),
    preview,
  ]);

  const side = h('div', { class: 'side' }, [statsPanel(), palette]);

  const layout = h('div', { class: 'configure-layout' }, [board, side]);

  const userSquares = design.squares.filter((s) => !s.locked).length;

  const back = h('button', { class: 'btn ghost', onclick: () => router.go('anchor') }, '← Anchor');
  const connectBtn = h('button', { class: 'btn', onclick: () => router.go('connect') }, 'Connect squares →');
  const doneBtn = h('button', { class: 'btn primary', onclick: () => finishDesign() }, '✓ Done');
  if (userSquares < 1) {
    connectBtn.disabled = true;
    doneBtn.disabled = true;
    doneBtn.title = 'Add at least one square first';
  }

  const nav = h('div', { class: 'wizard-nav' }, [back, h('div', { class: 'nav-group' }, [connectBtn, doneBtn])]);

  app.append(h('div', { class: 'screen' }, [head, layout, nav]));
}

// Finish the design: apply sensible default connectors (so the platform is
// fully linked even if the user skipped the Connect step) and jump to Review.
function finishDesign() {
  for (const p of connectablePairs()) {
    if (!getConnector(p.a.id, p.b.id)) {
      setConnector(p.a.id, p.b.id, p.distance === 1 ? 'direct' : 'bridge');
    }
  }
  router.go('summary');
}

// ---- read-only shared view ----------------------------------------------
function renderReadOnly(app) {
  const head = h('div', { class: 'screen-head' }, [
    h('h2', {}, 'Explore this platform'),
    h('p', { class: 'muted' }, 'Click any square to see what it is, and step through the build below. Hit “Remix this design” up top to make it your own.'),
  ]);

  const preview = platformPreview({
    interactive: true,
    showConnectors: true,
    onSquareClick: (sq) => openSquareInfo(sq),
  });

  const board = h('div', { class: 'board' }, [preview]);
  const side = h('div', { class: 'side' }, [statsPanel()]);
  const layout = h('div', { class: 'configure-layout' }, [board, side]);

  const nav = wizardNav({
    onBack: () => router.go('anchor'),
    backLabel: '← Anchor',
    onNext: () => router.go('connect'),
    nextLabel: 'See connections →',
  });

  app.append(h('div', { class: 'screen' }, [head, layout, nav]));
}

function openSquareInfo(sq) {
  const t = squareType(sq.type);
  const detail = squareDetail(sq);
  const body = h('div', { class: 'editor' }, [
    t?.blurb && h('p', { class: 'muted' }, t.blurb),
    detail && h('p', {}, [h('strong', {}, 'Setup: '), detail]),
    !sq.locked && h('p', { class: 'fine' }, 'Price: ' + money(squarePrice(sq))),
    h('p', { class: 'fine' }, `Position: column ${sq.x + 1}, row ${sq.y + 1}`),
  ]);
  openModal(body, { title: `${squareGlyphSafe(sq)} ${squareLabel(sq)}` });
}

function squareGlyphSafe(sq) {
  return squareType(sq.type)?.icon || '⬜';
}

function openCustomization(squareId) {
  const sq = squareById(squareId);
  if (!sq) return;
  if (sq.type === 'adventure') router.go('adventure', { squareId });
  else if (sq.type === 'relax') router.go('relax', { squareId });
  else if (sq.type === 'twostory') router.go('twostory', { squareId, step: 'intro' });
}

function openSquareEditor(sq, app) {
  const t = squareType(sq.type);

  // the locked anchor block can't be edited — just explain it
  if (sq.locked) {
    openModal(
      h('div', { class: 'editor' }, [
        h('p', { class: 'muted' }, t?.blurb || 'This is your anchor block.'),
        h('p', { class: 'fine' }, 'It’s fixed in the centre and can’t be moved, changed or removed — everything else builds around it.'),
      ]),
      { title: `${t?.icon} ${t?.name}` }
    );
    return;
  }

  const body = h('div', { class: 'editor' });

  // change type
  const select = h('select', { class: 'select' });
  for (const tt of SQUARE_TYPES) {
    const opt = h('option', { value: tt.id }, `${tt.icon} ${tt.name}`);
    if (tt.id === sq.type) opt.selected = true;
    select.append(opt);
  }
  select.addEventListener('change', () => {
    setSquareType(sq.id, select.value);
    modal.close();
    if (squareType(select.value)?.customizable) openCustomization(sq.id);
    else rerender(app);
  });

  body.append(h('label', { class: 'field' }, [h('span', {}, 'Change type'), select]));

  // customize button for customizable types
  if (t?.customizable) {
    body.append(
      h(
        'button',
        {
          class: 'btn primary full',
          onclick: () => {
            modal.close();
            openCustomization(sq.id);
          },
        },
        `Customize this ${t.name} square →`
      )
    );
  }

  // add-on toggles
  const addons = h('div', { class: 'addons' });
  if (sq.type !== 'water') {
    addons.append(
      toggle('Ladder into the water', !!sq.config.ladder, (v) => {
        updateSquareConfig(sq.id, { ladder: v });
      })
    );
  }
  if (sq.type === 'normal') {
    addons.append(
      toggle('Zipline station', !!sq.config.ziplineStation, (v) => {
        updateSquareConfig(sq.id, { ziplineStation: v });
      })
    );
  }
  if (addons.children.length) {
    body.append(h('div', { class: 'field' }, [h('span', {}, 'Add-ons'), addons]));
  }

  // delete
  body.append(
    h(
      'button',
      {
        class: 'btn danger full',
        onclick: () => {
          removeSquare(sq.id);
          modal.close();
          rerender(app);
        },
      },
      '🗑 Remove square'
    )
  );

  const modal = openModal(body, { title: `${t?.icon} ${t?.name} square` });
}

function toggle(label, checked, onChange) {
  const input = h('input', { type: 'checkbox' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'toggle' }, [input, h('span', {}, label)]);
}
