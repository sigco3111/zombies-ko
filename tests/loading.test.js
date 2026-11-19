import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TIPS, TIP_MS, tipText, tipIndex } from '../src/ui/loading.js';
import { tuning } from '../src/game/tuning.js';

const root = resolve(import.meta.dirname, '..');
const all = (touch) => TIPS.map((t) => tipText(t, touch)).join('\n');

describe('loading screen tips', () => {
  it('has 10 to 12 tips, each a short line, rotating every 4 s', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(10);
    expect(TIPS.length).toBeLessThanOrEqual(12);
    expect(TIP_MS).toBe(4000);
    for (const t of TIPS) {
      expect(typeof t.key).toBe('string');
      expect(t.key.length).toBeLessThanOrEqual(110);
      if (t.touch) expect(t.touch.length).toBeLessThanOrEqual(110);
    }
  });

  it('quotes the tuning, not made-up numbers', () => {
    const e = tuning.economy, w = tuning.world;
    const text = all(false);
    expect(text).toContain(`한 발 맞출 때마다 ${e.points.hit}점, 처치 ${e.points.kill}점, 헤드샷 처치 ${e.points.headshotKill}점`);
    expect(text).toContain(`칼로 처치하면 ${e.points.meleeKill}점`);
    expect(text).toContain(`무기 상자는 ${e.box.cost}점에`);
    expect(text).toContain(`${e.box.offer}초 안에`);
    expect(text).toContain(`${e.bench.cost}점에 어떤 총이든 강해집니다`);
    expect(text).toContain(`식당은 ${w.doors.d1}점`);
    expect(text).toContain(`판자 하나에 ${w.boards.repairPoints}점, 라운드당 최대 ${w.boards.repairCapPerRound}점`);
    expect(text).toContain(`권총 탄약은 ${e.wallAmmo.cost}점`);
    expect(text).toContain(`권총 탄약은 ${e.crateAmmo.pistol}점`);
    expect(text).toMatch(/탄약 상자는 손에 든 총의 탄약을 채워줍니다/);
    expect(text).toContain(`${e.powerups.ttl}초 동안 빛납니다`);
    expect(text).toContain(`${['영', '한', '두', '세', '네'][tuning.touch.maxPlates]} 개까지 착용할 수 있습니다`);
    expect(text).toMatch(/달리는 동안은 쏠 수 없습니다/);
  });

  it('names keys on a keyboard and buttons on touch', () => {
    expect(all(false)).toMatch(/V를 누르세요/);
    expect(all(false)).toMatch(/F를 길게 눌러 조사하세요/);
    expect(all(false)).toMatch(/Shift를 누르면/);
    const touch = all(true);
    expect(touch).not.toMatch(/(V를 누르세요|F를 길게 눌러|Shift)/);
    expect(touch).toMatch(/조사를 길게/);
    expect(touch).toMatch(/수리를 길게/);
    expect(touch).toMatch(/스틱을 끝까지/);
  });

  it('starts from the clock and walks every tip in turn', () => {
    const n = TIPS.length;
    expect(tipIndex(0, 0)).toBe(0);
    expect(tipIndex(5000, 0)).toBe(5 % n);
    const seen = new Set();
    for (let s = 0; s < n; s++) seen.add(tipIndex(123456789, s));
    expect(seen.size).toBe(n);
  });
});

describe('loading screen build inputs', () => {
  it('the inlined art is small enough and the placeholder is tiny', () => {
    const art = readFileSync(resolve(root, 'assets/keyart/keyart-1280.webp'));
    const lqip = readFileSync(resolve(root, 'assets/keyart/keyart-lqip.webp'));
    expect(art.subarray(8, 12).toString()).toBe('WEBP');
    expect(art.length).toBeLessThanOrEqual(150 * 1024);
    expect(lqip.length).toBeLessThanOrEqual(2048);
    const og = readFileSync(resolve(root, 'assets/keyart/og.jpg'));
    expect(og[0]).toBe(0xff); expect(og[1]).toBe(0xd8); // JPEG
    expect(og.length).toBeLessThanOrEqual(300 * 1024);
  });

  it('index.html carries the link-preview meta and the hooks main.js and the build need', () => {
    const html = readFileSync(resolve(root, 'src/index.html'), 'utf8');
    for (const s of [
      'property="og:image" content="https://sigco3111.github.io/zombies-ko/og.jpg"', 'property="og:image:width" content="1200"',
      'property="og:image:height" content="630"', 'name="twitter:card" content="summary_large_image"',
      'property="og:url" content="https://sigco3111.github.io/zombies-ko/"', 'name="theme-color"', 'rel="icon" type="image/svg+xml" href="data:',
      'id="boot"', 'id="boot-bar"', 'id="boot-label"', '<!--LOADING_CSS-->', '<!--LOADING_JS-->', '<!--INLINE_JS-->',
    ]) expect(html).toContain(s);
  });
});
