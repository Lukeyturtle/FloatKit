import { h } from '../render.js';

// A reusable grid of selectable option cards.
export function optionGrid(options, selectedId, onSelect) {
  return h(
    'div',
    { class: 'option-grid' },
    options.map((o) =>
      h(
        'button',
        {
          class: 'option-card' + (selectedId === o.id ? ' selected' : ''),
          onclick: () => onSelect(o.id),
        },
        [
          h('div', { class: 'option-emoji' }, o.icon),
          h('h3', {}, o.name),
          o.blurb && h('p', {}, o.blurb),
          o.price != null && h('div', { class: 'option-price' }, o.price ? '+ $' + o.price : 'Included'),
        ]
      )
    )
  );
}
