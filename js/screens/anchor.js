import { router } from '../router.js';
import { h, wizardNav } from '../render.js';
import { design, save, readOnly } from '../state.js';
import { ANCHORS } from '../catalog.js';

export function render(app) {
  const wrap = h('div', { class: 'screen' }, [
    h('div', { class: 'screen-head' }, [
      h('h2', {}, readOnly ? 'The anchor' : 'Choose your anchor'),
      h('p', { class: 'muted' }, readOnly ? 'How this platform stays put.' : 'This is how your platform stays put. You can change it later.'),
    ]),
    h(
      'div',
      { class: 'option-grid' },
      ANCHORS.map((a) =>
        h(
          'button',
          {
            class: 'option-card' + (design.anchor === a.id ? ' selected' : ''),
            onclick: readOnly
              ? null
              : () => {
                  design.anchor = a.id;
                  save();
                  app.innerHTML = '';
                  render(app);
                },
          },
          [
            h('div', { class: 'option-emoji' }, a.icon),
            h('div', { class: 'option-tag' }, a.tag),
            h('h3', {}, a.name),
            h('p', {}, a.blurb),
            h('div', { class: 'option-price' }, '+ $' + a.price.toLocaleString()),
          ]
        )
      )
    ),
    readOnly
      ? wizardNav({
          onBack: () => router.go('configure'),
          backLabel: '← Back to grid',
          onNext: () => router.go('connect'),
          nextLabel: 'See connections →',
        })
      : wizardNav({
          onBack: () => router.go('landing'),
          backLabel: '← Home',
          onNext: () => router.go('configure'),
          nextLabel: 'Configure squares →',
          nextDisabled: !design.anchor,
        }),
  ]);
  app.append(wrap);
}
