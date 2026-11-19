// Loading screen. Bundled on its own by scripts/build.mjs and inlined right after the #boot markup
// in index.html, so it runs before the game bundle is even parsed: it shows the key art (a data URI; the
// blurred 24x14 placeholder is already in the CSS), and rotates one gameplay tip every TIP_MS.
// main.js still owns the boot: it sets #boot-bar's width and #boot-label, and adds #boot.done when the game
// is ready. On .done the screen fades (CSS) and this stops its timer; the title screen under it takes the
// first tap or click as before. Nothing here waits on anything, so the game is never held back.
// No unseeded randomness (the build bans it): the first tip comes from the clock.
import './loading.css';
import './wordmark.css'; // the wordmark's look (its markup is in index.html)
import { FONT_URL } from './wordmark.js';
import art from '../../assets/keyart/keyart-1280.webp';
import { detect } from '../core/device.js';

export const TIP_MS = 4000;

// Each tip: { key, touch? } in the player's words; numbers are the tuning's (economy, world, loot, touch).
export const TIPS = [
  { key: '한 발 맞출 때마다 10점, 처치 60점, 헤드샷 처치 100점. 머리를 노리세요.' },
  { key: '칼로 처치하면 130점. 가까이 오면 V를 누르세요.', touch: '칼로 처치하면 130점. 가까이 오면 칼 버튼을 탭하세요.' },
  { key: '점수로 문을 엽니다. 식당은 750점, 모텔과 차고로 가는 길은 더 비쌉니다.' },
  { key: '전원 스위치는 차고에 있습니다. 전원이 켜져야 특전 기계와 업그레이드 작업대가 작동합니다.' },
  { key: '무기 상자는 950점에 무작위 총 한 자루. 10초 안에 가져가지 않으면 사라집니다.' },
  { key: '자동차나 상자는 F를 길게 눌러 조사하세요. 각각 한 번씩 조사할 수 있습니다.', touch: '자동차나 상자는 조사를 길게 누르세요. 각각 한 번씩 조사할 수 있습니다.' },
  { key: '방호판이 체력보다 먼저 피해를 받습니다. 세 개까지 착용할 수 있습니다.' },
  { key: '전원이 켜지면 업그레이드 작업대에서 4000점에 어떤 총이든 강해집니다.' },
  { key: 'Shift를 누르면 달리지만, 달리는 동안은 쏠 수 없습니다.', touch: '스틱을 끝까지 밀면 달리지만, 달리는 동안은 쏠 수 없습니다.' },
  { key: '부서진 창문에서 F를 길게 눌러 판자를 다시 못 박으세요: 판자 하나에 10점, 라운드당 최대 200점.', touch: '부서진 창문에서 수리를 길게 눌러 판자를 다시 못 박으세요: 판자 하나에 10점, 라운드당 최대 200점.' },
  { key: '앞마당의 탄약 상자는 손에 든 총의 탄약을 채워줍니다. 권총 탄약은 250점, 큰 총은 더 비쌉니다.' },
  { key: '파워업은 바닥에서 25초 동안 빛납니다. 밟고 지나가면 가져갑니다.' },
];

export const tipText = (tip, touch) => (touch && tip.touch) || tip.key;
// The tip shown `step` changes after the page opened at time `now` (ms): starts somewhere new each visit.
export const tipIndex = (now, step, n = TIPS.length) => (Math.floor(now / 1000) + step) % n;

export function isTouch(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return false;
  const nav = win.navigator || {};
  let coarse = false;
  try { coarse = !!(win.matchMedia && win.matchMedia('(pointer: coarse)').matches); } catch { coarse = false; }
  let touchParam = false;
  try { touchParam = new URLSearchParams(win.location.search).get('touch') === '1'; } catch { touchParam = false; }
  return detect({ maxTouchPoints: nav.maxTouchPoints || 0, coarse, params: { touch: touchParam } }).touch;
}

// Wires the screen; returns { stop() } (also called by itself when #boot gets .done).
export function startLoading(doc = document, { now = Date.now(), touch = isTouch() } = {}) {
  const boot = doc.getElementById('boot');
  if (!boot) return { stop() {} };
  const reduced = !!(doc.defaultView && doc.defaultView.matchMedia
    && doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // the wordmark's type, asked for now rather than when the HUD is built (hud.js asks for the same stylesheet,
  // which the browser then has); skipped offline like hud.js does
  const nav = doc.defaultView && doc.defaultView.navigator;
  if (doc.head && !(nav && nav.onLine === false)) {
    const link = doc.createElement('link');
    link.id = 'gs-fonts'; // wordmark.js loadFonts() skips its own request when this id exists: one stylesheet
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    doc.head.appendChild(link);
  }

  const img = boot.querySelector('.ld-art img');
  if (img) {
    img.addEventListener('load', () => img.classList.add('on'), { once: true });
    img.decoding = 'async';
    img.src = art;
  }

  const t = boot.querySelector('.ld-tip .t');
  let step = 0, timer = 0, swap = 0;
  const show = () => { if (t) t.textContent = tipText(TIPS[tipIndex(now, step)], touch); };
  show();
  if (t) {
    timer = setInterval(() => {
      step++;
      if (reduced) { show(); return; }
      t.classList.add('out');
      swap = setTimeout(() => { show(); t.classList.remove('out'); }, 350);
    }, TIP_MS);
  }

  let observer = null;
  const stop = () => {
    clearInterval(timer); clearTimeout(swap);
    if (observer) observer.disconnect();
    observer = null;
  };
  const done = () => boot.classList.contains('done');
  if (typeof MutationObserver === 'function') {
    observer = new MutationObserver(() => { if (done()) stop(); });
    observer.observe(boot, { attributes: true, attributeFilter: ['class'] });
  }
  return { stop };
}

if (typeof document !== 'undefined' && document.getElementById('boot')) {
  // runs before main.js installs window.__errors (which starts it empty), so a failure is only warned:
  // the plain boot bar still works without this
  try { startLoading(document); } catch (e) { console.warn('[loading]', e); }
}
