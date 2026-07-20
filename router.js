// Minimal screen router: each "page" of the wizard is a registered render
// function. A stack lets customization sub-flows return to where they started.

import { design, save } from './state.js';

const routes = {};
let stack = [{ id: 'landing', params: {} }];

// Which progress step each screen belongs to (0 = no progress bar).
const STEP_OF = {
  landing: 0,
  anchor: 1,
  configure: 2,
  adventure: 2,
  relax: 2,
  twostory: 2,
  connect: 3,
  summary: 4,
};

export const STEPS = [
  { id: 1, label: 'Anchor' },
  { id: 2, label: 'Configure' },
  { id: 3, label: 'Connect' },
  { id: 4, label: 'Review' },
];

function paint() {
  const { id, params } = stack[stack.length - 1];
  design.lastScreen = id;
  save();
  updateProgress(STEP_OF[id] || 0);
  const app = document.getElementById('app');
  app.innerHTML = '';
  const fn = routes[id];
  if (fn) fn(app, params);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function updateProgress(step) {
  const bar = document.getElementById('progress');
  if (!bar) return;
  bar.style.display = step === 0 ? 'none' : 'flex';
  bar.querySelectorAll('.progress-step').forEach((el) => {
    const s = Number(el.dataset.step);
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });
}

export const router = {
  register(id, fn) {
    routes[id] = fn;
  },
  go(id, params = {}) {
    stack.push({ id, params });
    paint();
  },
  replace(id, params = {}) {
    stack[stack.length - 1] = { id, params };
    paint();
  },
  back() {
    if (stack.length > 1) stack.pop();
    paint();
  },
  // Pop screens until we're back at `id` (used to return from customization).
  popTo(id, params) {
    while (stack.length > 1 && stack[stack.length - 1].id !== id) stack.pop();
    if (params) stack[stack.length - 1].params = params;
    paint();
  },
  reset(id, params = {}) {
    stack = [{ id, params }];
    paint();
  },
  current() {
    return stack[stack.length - 1];
  },
};
