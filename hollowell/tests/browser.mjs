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
    async kiln() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 22, y: 95, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('kr_kilndoor');
        await page.evaluate(() => { HW.warp('hollow', 46, 112); HW.step(30); });
        await shot('kr_camp');
        await page.evaluate(() => { HW.warp('hollow', 58, 103); HW.step(30); });
        await shot('kr_canyon');
        await page.evaluate(() => { HW.warp('hollow', 50, 90); HW.step(30); });
        await shot('kr_hawk');
        const rooms = { entrance: [29, 41], hall: [29, 31], sms: [41, 27], doubling: [17, 27], glazer: [56, 20], gallery: [62, 16], bridge: [69, 24], furnace: [29, 20], racks: [17, 17], boss: [38, 5] };
        await page.evaluate(() => { HW.newGame('Wren', { area: 'kiln', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(20); });
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('kiln', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('kiln_' + n);
        }
    },
    async meadow() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 64 + 31, y: 80 + 3, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('meadow_north');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 80 + 14); HW.step(30); });
        await shot('meadow_tidyhouse');
        await page.evaluate(() => { HW.warp('hollow', 64 + 14, 80 + 24); HW.step(30); });
        await shot('meadow_pen');
        await page.evaluate(() => { HW.warp('hollow', 64 + 8, 80 + 23); HW.step(30); });
        await shot('meadow_canyon');
        await page.evaluate(() => { HW.warp('hollow', 64 + 45, 80 + 27); HW.step(30); });
        await shot('meadow_bridge');
    },
    async tidy() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'tidy', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(30); });
        await shot('tidy_foyer');
        const rooms = { kitchen: [10, 38], gallery: [50, 38], hall: [29, 30], pantry: [10, 27], parlor: [50, 27], cons: [70, 27], linen: [56, 20], laundry: [70, 16], ball: [26, 18], library: [10, 16], attic: [9, 8], ante: [49, 9], boss: [38, 5] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('tidy', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('tidy_' + n);
        }
        /* the conservatory with one plate on */
        await page.evaluate(() => { HW.warp('tidy', 60 + 6, 22 + 3); HW.step(4); HW.walkTo(60 + 8, 22 + 3); HW.step(30); });
        await shot('tidy_cons_on');
    },
    async town() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { noAutosave: true }); HW.step(200); });
        await shot('prologue_room');
        await page.evaluate(() => { HW.skipTalk(); HW.step(30); });
        await shot('room_awake');
        await page.evaluate(() => { HW.warp('gran_house', 6, 6); HW.step(10); });
        await shot('gran_house');
        await page.evaluate(() => { HW.Progress.set('talkedGran'); HW.warp('hollow', 64 + 12, 40 + 11, 'down'); HW.step(120); });
        await shot('ceremony');
        await page.evaluate(() => { HW.skipTalk(); HW.step(60); });
        await shot('town_square');
        await page.evaluate(() => { HW.warp('hollow', 64 + 12, 40 + 13, 'down'); HW.step(30); });
        await shot('town_gran');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 40 + 15, 'down'); HW.step(30); });
        await shot('town_inn');
        await page.evaluate(() => { HW.warp('hollow', 64 + 20, 40 + 32, 'down'); HW.step(30); });
        await shot('town_south');
        await page.evaluate(() => { HW.warp('inn', 7, 7); HW.step(10); });
        await shot('inn_inside');
    },
    async extras() {
        await open();
        await page.evaluate(() => { HW.preset('afterD1'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 64 + 36, 40 + 21); HW.step(230); });
        await shot('kids_game');
        await page.evaluate(() => { HW.walkTo(64 + 36, 40 + 17); HW.push('left', 1); HW.walkTo(64 + 35, 40 + 19); HW.step(20); });
        await shot('kids_tsk');
        await page.evaluate(() => { for (let i = 0; i < 12; i++) { HW.step(30); HW.skipTalk(); } });
        await page.evaluate(() => { HW.warp('inn', 7, 6); HW.step(30); });
        await shot('inn_stairs');
        for (const [n, x, y] of [['attic1', 3, 8], ['attic2', 21, 9], ['attic3', 43, 7]]) {
            await page.evaluate(([x, y]) => { HW.Progress.set('trial1'); HW.Progress.set('trial2'); HW.warp('inn_attic', x, y); HW.step(40); }, [x, y]);
            await shot(n);
        }
        await page.evaluate(() => { HW.Progress.set('trial1', false); HW.warp('inn_attic', 3, 7); HW.step(5); HW.walkTo(3, 8); HW.step(60); });
        await shot('attic1_clock');
    },
    async water() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab3', x: 15, y: 3, noAutosave: true }); HW.step(5); HW.walkTo(1, 5); HW.step(60); });
        await shot('water_lab');
        await page.evaluate(() => { HW.hold('right'); HW.step(12); HW.release(); HW.step(200); });
        await shot('water_ride');
    },
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
