import { router } from '../router.js';
import { h } from '../render.js';
import { design, resetDesign } from '../state.js';
import { SQUARE_TYPES } from '../catalog.js';

export function render(app) {
  const hasSaved = design.squares.length > 0 || design.anchor;

  const hero = h('section', { class: 'hero' }, [
    h('div', { class: 'hero-water' }),
    h('div', { class: 'hero-inner' }, [
      h('div', { class: 'badge' }, '🌊 Modular floating platforms'),
      h('h1', {}, 'Build your own floating platform.'),
      h('p', { class: 'lede' }, [
        'FloatKit is a set of inflatable squares that snap together on the water. ',
        'Pick an anchor, lay out your squares, customize each one, and connect them — ',
        'design a platform that’s entirely yours.',
      ]),
      h('div', { class: 'hero-cta' }, [
        h(
          'button',
          { class: 'btn primary big', onclick: () => router.go('anchor') },
          hasSaved ? 'Resume designing →' : 'Start designing →'
        ),
        hasSaved &&
          h(
            'button',
            {
              class: 'btn ghost',
              onclick: () => {
                resetDesign();
                router.go('anchor');
              },
            },
            'Start over'
          ),
      ]),
    ]),
  ]);

  const steps = h('section', { class: 'section' }, [
    h('h2', {}, 'How it works'),
    h('div', { class: 'howto' }, [
      howCard('1', '⚓', 'Pick your anchor', 'Pool, portable or permanent — how your platform stays put.'),
      howCard('2', '🧩', 'Snap squares together', 'Lay out squares on the water and customize each one.'),
      howCard('3', '🏝️', 'Float', 'Connect everything with bridges, ziplines and swim ladders.'),
    ]),
  ]);

  const gallery = h('section', { class: 'section' }, [
    h('h2', {}, 'Every square is a different vibe'),
    h(
      'div',
      { class: 'type-gallery' },
      SQUARE_TYPES.map((t) =>
        h('div', { class: 'type-chip', style: { '--c': t.color } }, [
          h('span', { class: 'type-emoji' }, t.icon),
          h('div', {}, [h('strong', {}, t.name), h('p', {}, t.blurb)]),
        ])
      )
    ),
  ]);

  const footer = h('section', { class: 'section center' }, [
    h('button', { class: 'btn primary big', onclick: () => router.go('anchor') }, 'Design yours now →'),
  ]);

  app.append(hero, steps, gallery, footer);
}

function howCard(n, icon, title, body) {
  return h('div', { class: 'how-card' }, [
    h('div', { class: 'how-num' }, n),
    h('div', { class: 'how-icon' }, icon),
    h('h3', {}, title),
    h('p', {}, body),
  ]);
}
