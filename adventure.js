import { router } from '../router.js';
import { h, wizardNav } from '../render.js';
import { squareById, updateSquareConfig } from '../state.js';
import { ADVENTURE_OPTIONS } from '../catalog.js';
import { optionGrid } from './_optionPicker.js';

export function render(app, { squareId }) {
  const sq = squareById(squareId);
  if (!sq) return router.popTo('configure');

  const wrap = h('div', { class: 'screen' }, [
    h('div', { class: 'screen-head' }, [
      h('h2', {}, '🤸 Customize your Adventure square'),
      h('p', { class: 'muted' }, 'Pick your thrill.'),
    ]),
    optionGrid(ADVENTURE_OPTIONS, sq.config.option, (id) => {
      updateSquareConfig(squareId, { option: id });
      app.innerHTML = '';
      render(app, { squareId });
    }),
    wizardNav({
      onBack: () => router.popTo('configure'),
      backLabel: '← Back to grid',
      onNext: () => router.popTo('configure'),
      nextLabel: 'Done →',
      nextDisabled: !sq.config.option,
    }),
  ]);
  app.append(wrap);
}
