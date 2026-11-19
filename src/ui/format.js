// Pure helpers for the HUD and menus: number and prompt formatting, setting limits. No DOM.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// 4350 -> "4 350" (no-break space), the way a price board groups digits.
export function formatPoints(n) {
  const v = Math.round(Number(n) || 0);
  return String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace(/^/, v < 0 ? '-' : '');
}

const DENY = { points: '점수가 부족합니다', full: '탄약이 가득 찼습니다', locked: '잠겨 있습니다', power: '전원이 필요합니다', owned: '이미 가지고 있습니다', busy: '잠시만 기다리세요' };
export const denyText = (reason) => DENY[reason] || '사용할 수 없습니다';

// The interact prompt, as parts so the HUD can set the key in a cap. Keyboard (unchanged since the
// slice): "Press F — Ammo · 250". Touch names the on-screen button: "Tap BUY: Ammo — 250". A hold
// (searching, boards) says Hold instead. A door that cannot be opened offers no key and no price:
// "Diner — Locked". Price is omitted for free interactables.
export function interactVerb(focus) {
  if (!focus) return '사용';
  if (focus.kind === 'search') return '조사';
  if (focus.kind === 'boards') return '수리';
  if (Number(focus.cost) > 0) return '구매';
  if (focus.kind === 'door') return '열기';
  return '사용';
}
export function promptParts(focus, mode = 'keyboard') {
  if (!focus) return null;
  const label = focus.label || focus.kind || 'Use';
  if (focus.kind === 'lockedDoor') return { key: null, label, cost: null, note: denyText('locked') };
  const cost = Number(focus.cost) > 0 ? formatPoints(focus.cost) : null;
  const hold = Number(focus.hold) > 0;
  if (mode === 'touch') return { pre: '', key: interactVerb(focus), sep: hold ? ' 길게 누르기: ' : ' 탭: ', label, costSep: ' — ', cost };
  return { pre: '', key: 'F', sep: hold ? ' 길게 누르기 — ' : ' 누르기 — ', label, costSep: ' · ', cost };
}
export function promptString(focus, mode = 'keyboard') {
  const p = promptParts(focus, mode);
  if (!p) return '';
  if (!p.key) return `${p.label} — ${p.note}`;
  return `${p.pre}${p.key}${p.sep}${p.label}${p.cost ? `${p.costSep}${p.cost}` : ''}`;
}

// What an action is called on screen: the key on a keyboard, the button on touch.
const KEYS = {
  move: 'WASD', look: '마우스', fire: '클릭', ads: '우클릭', reload: 'R', interact: 'F', jump: 'Space', sprint: 'Shift',
  swap: 'Q', melee: 'V', throw: 'G', pause: 'Esc', hint: 'H',
};
const BUTTONS = {
  move: '스틱', look: '드래그', fire: '발사', ads: '조준', reload: '재장전', interact: '사용', jump: '점프', sprint: '달리기',
  swap: '교체', melee: '근접', throw: '투척', pause: '정지', hint: '힌트',
};
export function keyLabel(action, touch = false, focus = null) {
  if (touch) return action === 'interact' && focus ? interactVerb(focus) : BUTTONS[action] || String(action).toUpperCase();
  return KEYS[action] || String(action).toUpperCase();
}

// The controls card, one row per action. `key` is the keyboard column, `touch` the touch column.
export const CONTROLS = [
  { id: 'move', name: '이동', key: 'W A S D', touch: '왼쪽 엄지' },
  { id: 'look', name: '시점', key: '마우스', touch: '오른쪽 화면 드래그' },
  { id: 'fire', name: '발사', key: '좌클릭', touch: '탭; 자동 무기는 길게' },
  { id: 'ads', name: '조준', key: '우클릭', touch: '조준 버튼 (탭)' },
  { id: 'reload', name: '재장전', key: 'R', touch: '원형 화살표 버튼' },
  { id: 'interact', name: '사용 / 구매', key: 'F 또는 E', touch: '구매 / 조사' },
  { id: 'jump', name: '점프', key: 'Space', touch: '왼쪽 화면 탭, 또는 위쪽 화살표' },
  { id: 'sprint', name: '달리기', key: 'Shift', touch: '스틱을 끝까지 밀기' },
  { id: 'swap', name: '무기 교체', key: 'Q, 휠, 1 / 2', touch: '탄약 옆의 ⇄' },
  { id: 'melee', name: '근접 공격', key: 'V', touch: '칼 버튼' },
  { id: 'throw', name: '투척', key: 'G (3으로 변경)', touch: '수류탄 버튼' },
  { id: 'pause', name: '일시정지', key: 'Esc 또는 P', touch: '위쪽 모서리의 ‖' },
  { id: 'hint', name: '힌트 숨기기', key: 'H', touch: '힌트의 ✕ 탭' },
];

// The name for a tight space: an upgraded gun's quoted nickname alone ('Ostrander 308 "Iron Vigil"' -> 'Iron Vigil').
export function shortWeaponName(name) {
  const m = /"([^"]+)"/.exec(String(name || ''));
  return m ? m[1] : String(name || '');
}
// True where the readouts should use short names: a touch layout, or a window narrower than 720 px.
export const narrowScreen = (touch) => !!touch || (typeof window !== 'undefined' && window.innerWidth < 720);

// Ammo as shown: numbers, or null for "—" when the weapon module has nothing yet.
export function ammoView(weapon) {
  const a = weapon && weapon.ammo;
  const num = (v) => (Number.isFinite(v) ? v : null);
  return { mag: a ? num(a.mag) : null, reserve: a ? num(a.reserve) : null, name: (weapon && weapon.name) || '권총' };
}

// Rounds left to kill this round (spawned-but-alive plus not yet spawned), or null.
export function remaining(director) {
  if (!director || !Number.isFinite(director.total) || !Number.isFinite(director.spawned)) return null;
  return Math.max(0, director.total - director.spawned + (director.alive || 0));
}

export const SETTING_RANGES = {
  sens: { min: 0.3, max: 2.5, step: 0.05, def: 1 }, // multiplier on the input module's default sensitivity
  fov: { min: 70, max: 100, step: 1, def: 80 },
  volume: { min: 0, max: 1, step: 0.05, def: 1 },
  touchSens: { min: 0.5, max: 2, step: 0.05, def: 1 }, // multiplier on tuning.touch.look
};
export const QUALITIES = ['auto', 'mobile', 'low', 'medium', 'high'];
export const QUALITY_LABELS = { auto: '자동', mobile: '휴대폰', low: '낮음', medium: '보통', high: '높음' };
// The tier in effect, as shown: "Auto (Phone)" when the benchmark picked it, "Phone" when chosen by hand.
// `tier` is G.quality.tier (never G.quality.name, which reads 'low' on the phone tier).
export const qualityLabel = (tier, auto) => (auto ? `자동 (${QUALITY_LABELS[tier] || tier})` : QUALITY_LABELS[tier] || String(tier));
// A phone on Auto or Phone must tap a heavier tier twice: Low, Medium and High are the desktop tiers.
export const needsQualityConfirm = (current, next, touch) => !!touch && (current === 'auto' || current === 'mobile') && (next === 'low' || next === 'medium' || next === 'high');
export const RESOLUTIONS = ['auto', 0.6, 0.8, 1]; // dynamic, or a render scale to start from
export const GORE = ['full', 'reduced'];
export const GORE_LEVEL = { full: 1, reduced: 0.3 }; // what G.fx.gore holds
export const ASSIST_NAMES = ['끔', '약하게', '강하게'];
export const RES_RANGE = { min: 0.6, max: 1 };

// Anything stored or typed goes through here: unknown keys and bad values are dropped, numbers clamped.
export function sanitizeSettings(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  if (QUALITIES.includes(o.quality)) out.quality = o.quality;
  if (GORE.includes(o.gore)) out.gore = o.gore;
  if (typeof o.autoFire === 'boolean') out.autoFire = o.autoFire;
  if (typeof o.lefty === 'boolean') out.lefty = o.lefty;
  const num = (v) => (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  for (const k of Object.keys(SETTING_RANGES)) {
    const n = num(o[k]);
    if (n !== null) out[k] = clamp(n, SETTING_RANGES[k].min, SETTING_RANGES[k].max);
  }
  const a = num(o.assist);
  if (a !== null) out.assist = clamp(Math.round(a), 0, 2);
  if (o.resolution === 'auto') out.resolution = 'auto';
  else { const r = num(o.resolution); if (r !== null) out.resolution = clamp(r, RES_RANGE.min, RES_RANGE.max); }
  return out;
}
