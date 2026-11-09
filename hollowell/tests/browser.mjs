// Opens play.html in Chromium, plays a little, fails on any error, and (with --shots) saves screenshots
// into tests/shots/ for looking at. Extra scenarios can be passed as names: node tests/browser.mjs --shots lab
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'tests', 'shots');
const args = process.argv.slice(2);
const wantShots = args.includes('--shots');
const only = args.filter(a => !a.startsWith('--'));
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

async function open(q = '?debug') {
    await page.goto('file://' + path.join(ROOT, 'play.html') + q);
    await page.waitForFunction(() => window.HW && window.HW.G);
    await page.evaluate(() => { window.HW._paused = true; });
}
async function shot(name) {
    if (!wantShots) return;
    await page.evaluate(() => window.HW.step(1));
    await page.waitForTimeout(60);
    await page.locator('canvas').screenshot({ path: path.join(SHOTS, name + '.png') });
}
const SCENARIOS = {
    async title() { await open(); await page.evaluate(() => { window.HW._paused = false; }); await page.waitForTimeout(400); await page.evaluate(() => { window.HW._paused = true; }); await shot('title'); },
    async lab() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true }); HW.step(5); });
        await shot('lab_start');
        await page.evaluate(() => { HW.walkTo(2, 3); HW.push('right', 2); HW.walkTo(4, 5); HW.step(20); });
        await shot('lab_pushed');
        await page.evaluate(() => { HW.walkTo(8, 1); HW.face('down'); HW.press('act', 1); HW.walkTo(9, 6); });
        await shot('lab_carry');
        await page.evaluate(() => { HW.face('left'); HW.press('act', 1); HW.step(40); });
        await shot('lab_shards');
        await page.evaluate(() => { HW.walkTo(1, 2); HW.face('up'); HW.press('act', 1); HW.step(30); });
        await shot('lab_sign');
    },
};
for (const [name, fn] of Object.entries(SCENARIOS)) {
    if (only.length && !only.includes(name)) continue;
    try { await fn(); } catch (e) { errors.push(name + ': ' + e.message); }
    const gameErrors = await page.evaluate(() => window.HW ? window.HW.ERRORS.slice() : []).catch(() => []);
    errors.push(...gameErrors.map(e => name + ': ' + e));
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('browser checks passed' + (wantShots ? ' (screenshots in tests/shots/)' : ''));
