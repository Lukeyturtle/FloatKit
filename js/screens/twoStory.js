import { router } from '../router.js';
import { h, wizardNav } from '../render.js';
import { squareById, updateSquareConfig } from '../state.js';
import {
  SQUARE_TYPES,
  squareType,
  TWOSTORY_TOP_OPTIONS,
  WALL_TYPES,
  ADVENTURE_OPTIONS,
  RELAX_OPTIONS,
} from '../catalog.js';
import { optionGrid } from './_optionPicker.js';

const SUB_STEPS = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'top', label: 'Top' },
  { id: 'walls', label: 'Walls' },
];

export function render(app, params) {
  const { squareId, step = 'intro' } = params;
  const sq = squareById(squareId);
  if (!sq) return router.popTo('configure');
  const go = (s) => router.replace('twostory', { squareId, step: s });
  const repaint = () => {
    app.innerHTML = '';
    render(app, params);
  };

  if (step === 'intro') return renderIntro(app, sq, go);
  if (step === 'bottom') return renderBottom(app, sq, go, repaint);
  if (step === 'bottomCustom') return renderBottomCustom(app, sq, go, repaint);
  if (step === 'top') return renderTop(app, sq, go, repaint);
  if (step === 'walls') return renderWalls(app, sq, go, repaint);
}

function subHeader(active) {
  return h(
    'div',
    { class: 'substep' },
    SUB_STEPS.map((s, i) =>
      h('div', { class: 'substep-item' + (s.id === active ? ' active' : '') }, [
        h('span', { class: 'substep-dot' }, String(i + 1)),
        s.label,
      ])
    )
  );
}

function renderIntro(app, sq, go) {
  app.append(
    h('div', { class: 'screen center' }, [
      h('div', { class: 'intro-card card' }, [
        h('div', { class: 'intro-emoji' }, '🏗️'),
        h('h2', {}, "You're customizing your 2-story square"),
        h('p', { class: 'muted' }, [
          'A 2-story square has three parts to set up: the ',
          h('strong', {}, 'bottom'),
          ' level, the ',
          h('strong', {}, 'top'),
          ' level, and the ',
          h('strong', {}, 'walls'),
          '. We’ll walk through each one.',
        ]),
        wizardNav({
          onBack: () => router.popTo('configure'),
          backLabel: '← Back to grid',
          onNext: () => go('bottom'),
          nextLabel: 'Next →',
        }),
      ]),
    ])
  );
}

function renderBottom(app, sq, go, repaint) {
  // "Choose any square" for the bottom (nested 2-story excluded to avoid recursion).
  const choices = SQUARE_TYPES.filter((t) => t.id !== 'twostory').map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    blurb: t.blurb,
    price: t.price,
  }));

  const next = () => {
    if (squareType(sq.config.bottomType)?.customizable) go('bottomCustom');
    else go('top');
  };

  app.append(
    h('div', { class: 'screen' }, [
      subHeader('bottom'),
      h('div', { class: 'screen-head' }, [
        h('h2', {}, 'Bottom level'),
        h('p', { class: 'muted' }, 'Choose any square type for the ground floor.'),
      ]),
      optionGrid(choices, sq.config.bottomType, (id) => {
        updateSquareConfig(sq.id, { bottomType: id, bottomConfig: {} });
        repaint();
      }),
      h('p', { class: 'fine' }, 'Note: a nested 2-story bottom isn’t available in this prototype.'),
      wizardNav({
        onBack: () => go('intro'),
        onNext: next,
        nextDisabled: !sq.config.bottomType,
      }),
    ])
  );
}

function renderBottomCustom(app, sq, go, repaint) {
  const bt = sq.config.bottomType;
  const options = bt === 'adventure' ? ADVENTURE_OPTIONS : RELAX_OPTIONS;
  const cfg = sq.config.bottomConfig || {};
  app.append(
    h('div', { class: 'screen' }, [
      subHeader('bottom'),
      h('div', { class: 'screen-head' }, [
        h('h2', {}, `${squareType(bt)?.icon} Customize the bottom ${squareType(bt)?.name} square`),
        h('p', { class: 'muted' }, 'This bottom level needs a choice of its own.'),
      ]),
      optionGrid(options, cfg.option, (id) => {
        updateSquareConfig(sq.id, { bottomConfig: { option: id } });
        repaint();
      }),
      wizardNav({
        onBack: () => go('bottom'),
        onNext: () => go('top'),
        nextDisabled: !cfg.option,
      }),
    ])
  );
}

function renderTop(app, sq, go, repaint) {
  app.append(
    h('div', { class: 'screen' }, [
      subHeader('top'),
      h('div', { class: 'screen-head' }, [
        h('h2', {}, 'Top level'),
        h('p', { class: 'muted' }, 'What sits on the upper deck?'),
      ]),
      optionGrid(TWOSTORY_TOP_OPTIONS, sq.config.top, (id) => {
        updateSquareConfig(sq.id, { top: id });
        repaint();
      }),
      wizardNav({
        onBack: () => go('bottom'),
        onNext: () => go('walls'),
        nextDisabled: !sq.config.top,
      }),
    ])
  );
}

function renderWalls(app, sq, go, repaint) {
  // walls is an object { wallTypeId: count }. "No walls" = an empty object.
  // config.walls === undefined means the user hasn't chosen yet.
  const walls = sq.config.walls;
  const chosen = walls !== undefined;
  const noWalls = chosen && Object.keys(walls).length === 0;

  const setWalls = (next) => {
    updateSquareConfig(sq.id, { walls: next });
    repaint();
  };

  const cards = [];

  // "No walls" card (mutually exclusive with the counted walls)
  cards.push(
    h(
      'button',
      {
        class: 'option-card' + (noWalls ? ' selected' : ''),
        onclick: () => setWalls({}),
      },
      [
        h('div', { class: 'option-emoji' }, '⬛'),
        h('h3', {}, 'No walls'),
        h('p', {}, 'Fully open upper deck.'),
        h('div', { class: 'option-price' }, 'Included'),
      ]
    )
  );

  // one card per counted wall type — each can be toggled on independently
  for (const w of WALL_TYPES.filter((x) => x.counted)) {
    const active = (walls && walls[w.id] > 0) || false;
    cards.push(
      h(
        'button',
        {
          class: 'option-card' + (active ? ' selected' : ''),
          onclick: () => {
            const next = { ...(walls || {}) };
            if (active) delete next[w.id];
            else next[w.id] = w.min;
            setWalls(next);
          },
        },
        [
          h('div', { class: 'option-emoji' }, w.icon),
          h('h3', {}, w.name),
          w.blurb && h('p', {}, w.blurb),
          h('div', { class: 'option-price' }, '+ $' + w.price + ' each'),
        ]
      )
    );
  }

  const children = [
    subHeader('walls'),
    h('div', { class: 'screen-head' }, [
      h('h2', {}, 'Walls'),
      h('p', { class: 'muted' }, 'Mix and match — pick any combination of wall types, each with its own count.'),
    ]),
    h('div', { class: 'option-grid' }, cards),
  ];

  // a stepper for every selected counted wall type
  const selected = WALL_TYPES.filter((w) => w.counted && walls && walls[w.id] > 0);
  if (selected.length) {
    children.push(
      h(
        'div',
        { class: 'wall-counts' },
        selected.map((w) =>
          h('div', { class: 'counter card' }, [
            h('span', {}, `${w.icon} ${w.name} (${w.min}–${w.max})`),
            h('div', { class: 'stepper' }, [
              h('button', {
                class: 'icon-btn',
                onclick: () => {
                  const next = { ...walls };
                  next[w.id] = Math.max(w.min, (walls[w.id] || w.min) - 1);
                  setWalls(next);
                },
              }, '−'),
              h('strong', {}, String(walls[w.id])),
              h('button', {
                class: 'icon-btn',
                onclick: () => {
                  const next = { ...walls };
                  next[w.id] = Math.min(w.max, (walls[w.id] || w.min) + 1);
                  setWalls(next);
                },
              }, '+'),
            ]),
          ])
        )
      )
    );
  }

  children.push(
    wizardNav({
      onBack: () => go('top'),
      onNext: () => router.popTo('configure'),
      nextLabel: 'Finish 2-story →',
      nextDisabled: !chosen,
    })
  );

  app.append(h('div', { class: 'screen' }, children));
}
