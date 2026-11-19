// Share a run. The post always links the production site, wherever the game runs. "Share" is a
// real <a target="_blank" rel="noopener"> to the X intent (window.open is unreliable in the artifact
// frame); on a phone with the Web Share API (and not framed) the native sheet is used first. "Copy" puts
// the post and the link on the clipboard from inside the click, with a select-the-text fallback.
import { track } from '../core/analytics.js';

export const SHARE_URL = 'https://sigco3111.github.io/zombies-ko/';
const INTENT = 'https://x.com/intent/post';

const count = (v, min) => (Number.isFinite(Number(v)) ? Math.max(min, Math.floor(Number(v))) : min);

export function shareText({ round, kills } = {}) {
  const n = count(round, 1);
  const k = count(kills, 0);
  return `그레이브야드 시프트(Graveyard Shift)에서 라운드 ${n}까지 생존 — 좀비 ${k}마리 처치. 당신도 해낼 수 있나요? sigco3111.github.io/zombies-ko 원작 @ethanplusai`;
}
export const shareUrl = () => SHARE_URL;
export const intentHref = (run) => `${INTENT}?text=${encodeURIComponent(shareText(run))}&url=${encodeURIComponent(SHARE_URL)}`;
export const copyText = (run) => `${shareText(run)} ${SHARE_URL}`;

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// The Share / Copy pair. `where`: 'end' | 'board' (analytics only). update(run) before it is shown.
export function createShareBar(G, { where }) {
  let run = null;
  const bar = h('div', 'gs-lk-share');
  const share = h('a', 'gs-lk-btn primary', '공유');
  share.target = '_blank';
  share.rel = 'noopener';
  share.href = intentHref({});
  const copy = h('button', 'gs-lk-btn', '복사');
  copy.type = 'button';
  const note = h('span', 'gs-lk-sharenote');
  note.setAttribute('aria-live', 'polite');
  const field = h('input', 'gs-lk-copyfield');
  field.readOnly = true;
  field.hidden = true;
  field.setAttribute('aria-label', '게시 문구');
  bar.append(share, copy, note, field);

  const native = () => {
    const d = G.device || {};
    return (d.phone || d.touch || d.coarse) && !d.inFrame && typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  };

  share.addEventListener('click', (e) => {
    if (native()) {
      try {
        const p = navigator.share({ text: shareText(run || {}), url: SHARE_URL });
        e.preventDefault();
        if (p && p.catch) p.catch(() => {});
        track('share_click', { where, via: 'native' });
        return;
      } catch { /* not allowed here: the link opens the X post instead */ }
    }
    track('share_click', { where, via: 'x' });
  });

  const fallback = (text) => {
    field.hidden = false;
    field.value = text;
    let ok = false;
    try { field.focus({ preventScroll: true }); field.select(); ok = document.execCommand && document.execCommand('copy'); } catch { ok = false; }
    note.textContent = ok ? '복사됨' : '선택해서 복사하세요';
  };
  copy.addEventListener('click', () => {
    const text = copyText(run || {});
    track('share_click', { where, via: 'copy' });
    try {
      const p = navigator.clipboard && navigator.clipboard.writeText(text);
      if (!p || !p.then) { fallback(text); return; }
      p.then(() => { field.hidden = true; note.textContent = '복사됨'; }, () => fallback(text));
    } catch { fallback(text); }
  });

  return {
    el: bar,
    update(next) {
      run = next || null;
      share.href = intentHref(run || {});
      note.textContent = '';
      field.hidden = true;
      bar.hidden = !run;
    },
  };
}
