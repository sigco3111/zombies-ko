// What the menu's information panel says. Pure: no DOM. The perks and weapons come from the game's own
// tables (src/game/tuning/*), and every number in a sentence is read from them. The sentences themselves
// are kept here, keyed by id, so each id in the tables must have one (tests/infoPanel.test.js checks).
import { tuning as defaultTuning } from '../game/tuning.js';
import { formatPoints, CONTROLS } from './format.js';
import { crateAmmoPrice } from '../game/purchases.js';

// The use key as the Controls tab shows it: keyboard, then touch.
const useKeys = () => { const c = CONTROLS.find((x) => x.id === 'interact'); return `키보드는 ${c.key}, 터치는 ${c.touch}` };

const pts = formatPoints;
const pct = (x) => `${Math.round(x * 100)}%`;
const secs = (n) => `${n}초`;

export const TABS = [
  { id: 'controls', label: '조작법' },
  { id: 'how', label: '게임 방법' },
  { id: 'perks', label: '특전' },
  { id: 'weapons', label: '무기' },
];

// ---- perks: one line each on what the machine does, keyed by machine id ----
export const PERK_TEXT = {
  secondHelping: (T) => `체력이 ${T.player.health}에서 ${T.economy.machines.secondHelping.maxHealth}로 늘어납니다.`,
  shortOrder: (T) => `재장전 시간이 ${pct(1 - T.economy.machines.shortOrder.reloadScale)} 짧아집니다.`,
  longHaul: (T) => `걷기와 달리기가 ${pct(T.economy.machines.longHaul.speed - 1)} 빨라집니다.`,
  jumpStart: (T) => {
    const J = T.economy.machines.jumpStart;
    return `치명타를 받으면 대신 체력 ${J.health}가 남고, ${secs(J.invuln)} 동안 무적이 되며 반경 ${J.radius}m 안의 좀비를 밀쳐냅니다. 한 번 살려주면 소모됩니다. 다시 사면 매번 ${pts(J.step)}점씩 더 비싸집니다.`;
  },
};

// ---- power-ups: what each drop does, keyed by power-up id ----
export const POWERUP_TEXT = {
  resupply: () => '모든 탄약과 투척 무기를 채워줍니다.',
  oneTap: (T) => `${secs(T.economy.powerups.seconds.oneTap)} 동안 한 번 맞으면 무조건 처치됩니다.`,
  doubleTime: (T) => `${secs(T.economy.powerups.seconds.doubleTime)} 동안 점수가 두 배입니다.`,
  flashover: (T) => `맵의 좀비들을 불태웁니다. 대부분 즉사하고, 거구는 체력의 ${pct(T.economy.powerups.bruteShare)}를 잃습니다. ${pts(T.economy.powerups.flashoverPoints)}점을 얻습니다.`,
};

// ---- weapons: a one-line character per weapon id, and a heading per class ----
export const WEAPON_TEXT = {
  pistol: () => '시작 무기. 가볍고 정확합니다.',
  revolver: () => '묵직한 여섯 발. 발사도 재장전도 느립니다.',
  pump: () => '넓은 산탄, 근거리에서 강력하고 원거리에서 약합니다. 한 발씩 장전합니다.',
  autoShotgun: () => '빠르게 발사되는 산탄총. 탄약을 빨리 소모합니다.',
  smg: () => '빠르고 조준선을 유지하기 쉽습니다. 근거리에서 강합니다.',
  rifle: () => '사거리가 길고 조준이 안정적인 자동 소총.',
  battleRifle: () => '한 발씩, 묵직하게. 장거리용.',
  lmg: (T) => `커다란 탄띠와 안정된 사격. 재장전이 느리고 이동 속도가 ${pct(1 - T.weapons.table.lmg.moveScale)} 느려집니다.`,
  jumper: (T) => `맞은 좀비에서 가까운 좀비 ${T.weapons.table.jumper.special.extra}마리로 전류가 튑니다.`,
  flare: () => '포물선으로 던져집니다. 화염이 퍼져 그 안의 좀비를 태웁니다.',
};
export const CLASS_LABELS = {
  pistol: '권총', revolver: '리볼버', shotgun: '산탄총', smg: '기관단총', rifle: '소총', lmg: '기관총', special: '특수',
};
const CLASS_ORDER = Object.keys(CLASS_LABELS);

// ---- the ammo crate: every price comes from crateAmmoPrice (src/game/purchases.js) ----
// The crate refills the gun in your hand, at that gun's price. An upgraded gun pays crateUpgraded.scale times it, up to crateUpgraded.max.
const WORDS = { 2: '두', 3: '세', 4: '네' };
export const crateStock = (T = defaultTuning) => T.weapons.ids.map((id) => crateAmmoPrice(id, false));
export function crateText(T = defaultTuning) {
  const stock = crateStock(T);
  const lo = Math.min(...stock), hi = Math.max(...stock);
  const U = T.economy.crateUpgraded;
  let t = `탄약 상자는 손에 든 총의 탄약을 채워줍니다. 총마다 가격이 다르며 ${lo === hi ? `${pts(lo)}점` : `${pts(lo)}~${pts(hi)}점`}입니다.`;
  if (U) t += ` 업그레이드한 총은 그 ${WORDS[U.scale] || U.scale} 배 가격에, 최대 ${pts(U.max)}점까지 듭니다.`;
  return t;
}

// ---- how it works ----
// Each entry builds its sentence from the tables; one that needs a table the game no longer has is dropped.
const HOW = [
  { id: 'points', title: '점수', text: (T) => `한 발 맞출 때마다 ${pts(T.economy.points.hit)}점. 처치하면 ${pts(T.economy.points.kill)}점, 헤드샷 처치는 ${pts(T.economy.points.headshotKill)}점, 근접 처치는 ${pts(T.economy.points.meleeKill)}점. 아래 모든 것을 점수로 삽니다.` },
  { id: 'doors', title: '문', text: (T) => {
    const v = Object.values(T.world.doors);
    return `문을 사서 다음 구역을 여세요. 가격은 ${pts(Math.min(...v))}~${pts(Math.max(...v))}점입니다.`;
  } },
  { id: 'power', title: '전원', text: () => '전원 스위치를 찾아 켜세요. 무료입니다. 특전과 업그레이드 작업대는 전원 없이는 작동하지 않습니다.' },
  { id: 'wall', title: '벽 무기', text: () => '벽에 걸린 총을 사세요. 이미 가진 총 앞에 서면 더 싸게 탄약을 살 수 있습니다.' },
  { id: 'box', title: '무기 상자', text: (T) => `가지고 있지 않은 무작위 총 한 자루에 ${pts(T.economy.box.cost)}점. ${secs(T.economy.box.offer)} 안에 가져가지 않으면 사라집니다. 몇 번 쓰면 상자가 자리를 옮깁니다. 전원 없이도 작동합니다.` },
  { id: 'crate', title: '탄약 상자', text: (T) => crateText(T) },
  { id: 'upgrade', title: '업그레이드', text: (T) => `총을 업그레이드 작업대에 가져가세요${T.economy.bench ? ` (${pts(T.economy.bench.cost)}점)` : ''}. 더 강해지고 더 많이 담깁니다. 전원이 필요합니다.` },
  { id: 'armour', title: '방호판', text: (T) => `방호판 하나가 피해 ${T.touch.plate}를 흡수합니다. 최대 ${T.touch.maxPlates}개까지 가질 수 있습니다.` },
  { id: 'search', title: '조사하기', text: (T) => `자동차, 드럼통, 쓰레기통, 상자, 사물함, 옷장, 여행 가방 같은 곳에서 사용 버튼(${useKeys()})을 ${T.loot.hold}초 동안 누르고 있으세요. 게임당 한 번씩 조사할 수 있고 탄약, 점수, 체력, 방호판, 투척 무기, 부착물, 파워업, 희귀한 총 중 하나를 얻거나 꽝일 수도 있습니다.` },
  { id: 'pierce', title: '관통', text: () => '총알은 일렬로 선 좀비를 관통하며 매번 약해집니다. 명중 점수는 첫 번째 좀비만 줍니다.' },
  { id: 'swipe', title: '옆을 지날 때', text: () => '좀비 옆을 달려 지나가도 맞을 수 있습니다.' },
  { id: 'boards', title: '창문', text: (T) => `좀비는 창문의 판자를 뜯고 들어옵니다. 판자 하나를 다시 못 박으면 ${T.world.boards.repairPoints}점을 줍니다.` },
  { id: 'drops', title: '파워업 드롭', text: () => '처치 시 가끔 파워업이 떨어집니다. 사라지기 전에 밟고 지나가세요.', list: true },
  { id: 'rounds', title: '라운드', text: (T) => `라운드마다 좀비가 더 많아지고 더 강한 종류가 나타납니다. 라운드 사이에 ${secs(T.round.lull)}의 숨 돌릴 시간이 있습니다.` },
];

// ---- build ----
export function howItems(T = defaultTuning) {
  const out = [];
  for (const e of HOW) {
    let text;
    try { text = e.text(T); } catch { continue; }
    const item = { id: e.id, title: e.title, text };
    if (e.list) {
      item.list = T.economy.powerups.kinds.map((id) => ({
        id, name: T.economy.powerups.names[id] || id, text: POWERUP_TEXT[id] ? POWERUP_TEXT[id](T) : '',
      }));
    }
    out.push(item);
  }
  return out;
}

export function perkItems(T = defaultTuning) {
  const M = T.economy.machines;
  return T.economy.machineKinds.map((id) => ({
    id, name: M[id].name, cost: M[id].cost, text: PERK_TEXT[id] ? PERK_TEXT[id](T) : '',
  }));
}

// Where a weapon comes from, as short labels: the start, the wall (with its price), the box, a rare find in a search.
export function weaponSources(d, T = defaultTuning) {
  const s = [];
  if (d.wall && d.wall.cost == null) s.push({ kind: 'start', text: '기본' });
  else if (d.wall && d.wall.cost > 0) s.push({ kind: 'wall', text: `벽 ${pts(d.wall.cost)}` });
  if (d.box > 0) s.push({ kind: 'box', text: '상자' });
  if (T.loot.weapons.includes(d.id)) s.push({ kind: 'find', text: '희귀 발견' });
  return s;
}

// The three bars. Damage counts every pellet of a hit. Each bar is the square root of the value over the
// table's highest, so a 40 and a 140 are both readable beside a 600; the number is printed next to it.
export function weaponStats(d) {
  return {
    damage: { label: '공격력', value: d.damage * d.pellets, text: d.pellets > 1 ? `${d.damage}×${d.pellets}` : String(d.damage) },
    rate: { label: '연사', value: d.rpm, text: String(d.rpm) },
    mag: { label: '탄창', value: d.mag, text: String(d.mag) },
  };
}

export function weaponGroups(T = defaultTuning) {
  const table = T.weapons.table;
  const ids = T.weapons.ids;
  const max = { damage: 0, rate: 0, mag: 0 };
  for (const id of ids) {
    const st = weaponStats(table[id]);
    for (const k of Object.keys(max)) max[k] = Math.max(max[k], st[k].value);
  }
  const byClass = new Map();
  for (const id of ids) {
    const d = table[id];
    const stats = weaponStats(d);
    for (const k of Object.keys(stats)) stats[k].fraction = max[k] > 0 ? Math.sqrt(stats[k].value / max[k]) : 0;
    const item = {
      id, name: d.name, cls: d.cls, sources: weaponSources(d, T), text: WEAPON_TEXT[id] ? WEAPON_TEXT[id](T) : '',
      upgraded: d.upgraded ? d.upgraded.name : null, stats,
      ammo: { stock: crateAmmoPrice(id, false), upgraded: crateAmmoPrice(id, true) },
    };
    if (!byClass.has(d.cls)) byClass.set(d.cls, []);
    byClass.get(d.cls).push(item);
  }
  const order = [...CLASS_ORDER, ...[...byClass.keys()].filter((c) => !CLASS_ORDER.includes(c))];
  return order.filter((c) => byClass.has(c)).map((c) => ({ cls: c, label: CLASS_LABELS[c] || c, items: byClass.get(c) }));
}

export function infoContent(T = defaultTuning) {
  return { how: howItems(T), perks: perkItems(T), weapons: weaponGroups(T) };
}
