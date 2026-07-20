import { router } from './router.js';
import { load, design, loadSharedDesign, remixSharedDesign } from './state.js';
import { readShareParams, decodeDesign, fetchDesignByCode } from './share.js';
import { h } from './render.js';

import * as landing from './screens/landing.js';
import * as anchor from './screens/anchor.js';
import * as configure from './screens/configure.js';
import * as adventure from './screens/adventure.js';
import * as relax from './screens/relax.js';
import * as twostory from './screens/twoStory.js';
import * as connect from './screens/connect.js';
import * as summary from './screens/summary.js';

router.register('landing', landing.render);
router.register('anchor', anchor.render);
router.register('configure', configure.render);
router.register('adventure', adventure.render);
router.register('relax', relax.render);
router.register('twostory', twostory.render);
router.register('connect', connect.render);
router.register('summary', summary.render);

const RESUMABLE = new Set(['landing', 'anchor', 'configure', 'connect', 'summary']);

function normalBoot() {
  load();
  const start = RESUMABLE.has(design.lastScreen) ? design.lastScreen : 'landing';
  router.reset(start);
}

function enterSharedView(sharedDesign) {
  loadSharedDesign(sharedDesign);
  showShareBanner();
  router.reset('configure');
}

function showShareBanner() {
  const banner = document.getElementById('sharebanner');
  if (!banner) return;
  banner.hidden = false;
  banner.querySelector('#remix-btn')?.addEventListener('click', () => {
    banner.hidden = true;
    remixSharedDesign();
    router.reset('configure');
  });
}

function showCodeMessage(title, body) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(
    h('div', { class: 'screen center' }, [
      h('div', { class: 'intro-card card' }, [
        h('div', { class: 'intro-emoji' }, '🔍'),
        h('h2', {}, title),
        h('p', { class: 'muted' }, body),
        h('button', { class: 'btn primary', onclick: () => { location.href = location.origin + location.pathname; } }, 'Go to FloatKit →'),
      ]),
    ])
  );
}

// ---- boot ----------------------------------------------------------------
const { code, encoded } = readShareParams();

if (encoded) {
  const d = decodeDesign(encoded);
  if (d) enterSharedView(d);
  else showCodeMessage('That share link looks broken', 'We couldn’t read the design from this link. Double-check you copied the whole thing.');
} else if (code) {
  showCodeMessage('Loading design ' + code + '…', 'Fetching your platform.');
  fetchDesignByCode(code).then((res) => {
    if (res.ok) {
      enterSharedView(res.design);
    } else if (res.reason === 'unconfigured') {
      showCodeMessage('Codes aren’t set up yet', 'This FloatKit isn’t connected to a sheet, so bare codes can’t be looked up. Use a full share link instead.');
    } else if (res.reason === 'notfound') {
      showCodeMessage('Code ' + code + ' isn’t ready', 'New codes can take a few minutes to appear — or use the full share link, which works instantly.');
    } else {
      showCodeMessage('Couldn’t load code ' + code, 'Something went wrong reading the design. Try the full share link instead.');
    }
  });
} else {
  normalBoot();
}

document.getElementById('brand')?.addEventListener('click', () => {
  // in a shared view the URL carries params — a full nav returns to the real app
  if (location.search || location.hash) location.href = location.origin + location.pathname;
  else router.reset('landing');
});
