// The built page in a real browser: it starts, every room draws, the menus and the end draw,
// and nothing goes to the console as an error. Run `npm run e2e` (builds first).
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { ROOT } from '../../tools/headless.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync(`node -e "console.log(require.resolve('playwright'))"`).toString().trim())); }

let browser, page;
const errors = [];
const SHOTS = process.env.SHOTS;
before(async () => {
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    page.on('pageerror', e => errors.push(String(e.stack || e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file://' + path.join(ROOT, 'play.html') + '?debug');
    await page.waitForTimeout(300);
});
after(async () => { await browser.close(); });
const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.locator('#game').screenshot({ path: path.join(SHOTS, name + '.png') }); } };

test('the title screen starts a new game', async () => {
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(900);
    const room = await page.evaluate(() => __dbg.G.room);
    assert.equal(room, 'home');
    assert.deepEqual(errors, []);
});

test('the first swap, by keys', async () => {
    for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown']) { await page.keyboard.press(k); await page.waitForTimeout(140); }
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
    await page.keyboard.press('KeyZ'); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'swap');
    await shot('swap');
    await page.keyboard.press('KeyZ'); await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(() => [...__dbg.G.pocket]), [9]);
    assert.deepEqual(errors, []);
});

test('every room draws, by day, by night and in the hour that isn\'t', async () => {
    const rooms = await page.evaluate(() => Object.keys(__dbg.ROOMS));
    for (const h of [10, 22, 30]) {
        await page.evaluate(h => { __dbg.hour(h); __dbg.G.items.specs = 1; __dbg.G.items.watch = 1; }, h);
        for (const r of rooms) {
            await page.evaluate(r => { const R = __dbg.ROOMS[r]; const e = R.entry || [7, 5]; __dbg.go(r, e[0], e[1]); }, r);
            await page.waitForTimeout(60);
            if (h === 10) await shot('room-' + r);
        }
    }
    assert.deepEqual(errors, []);
});

test('menus: pause, stamps, map', async () => {
    await page.evaluate(() => { __dbg.go('square', 7, 5); __dbg.G.items.map = 1; __dbg.UI.mode = 'play'; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'pause');
    await shot('pause');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyZ'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'album');
    await shot('album');
    await page.keyboard.press('KeyX'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyZ'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'map');
    await shot('map');
    await page.keyboard.press('KeyX'); await page.keyboard.press('KeyX'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'play');
    assert.deepEqual(errors, []);
});

test('the bell at 9999 plays the ending through to the credits', async () => {
    await page.evaluate(() => { __dbg.go('lhtop', 7, 8); __dbg.G.count = [9, 9, 9, 9]; __dbg.hour(10); });
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'ending');
    await page.waitForTimeout(4000);
    await shot('ending-cascade');
    for (let i = 0; i < 60 && await page.evaluate(() => __dbg.UI.mode) !== 'dialog'; i++) await page.waitForTimeout(250);
    await page.waitForTimeout(600);
    await shot('ending-harbor');
    for (let i = 0; i < 16 && await page.evaluate(() => __dbg.UI.mode) !== 'ending'; i++) { await page.keyboard.press('KeyZ'); await page.waitForTimeout(400); }
    await page.waitForTimeout(5500);
    await shot('ending-credits');
    assert.equal(await page.evaluate(() => __dbg.UI.ending && __dbg.UI.ending.phase), 4);
    await page.keyboard.press('KeyZ'); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => __dbg.UI.mode), 'play');
    assert.equal(await page.evaluate(() => __dbg.G.room), 'harbor');
    await shot('after-ending');
    assert.deepEqual(errors, []);
});
