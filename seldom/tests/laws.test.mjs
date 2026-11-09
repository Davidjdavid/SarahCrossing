// The laws, one at a time, in the real game (Chromium, debug mode), plus saving and loading.
// node seldom/tests/laws.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
let browser, page, errors = [];

before(async () => {
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(String(e.stack || e)));
    await page.goto('file://' + path.join(HERE, '..', 'seldom.html') + '?debug&skip');
    await page.waitForTimeout(200);
});
after(async () => { await browser.close(); });
/* a fresh island for each test */
async function fresh(js) {
    return page.evaluate(`(async () => { try { localStorage.clear(); } catch (e) {} Title.enter(); Game.newGame(); await Bot.talkThrough(); ${js} })()`);
}

test('the page loads with no errors', async () => {
    await fresh('return 1');
    assert.deepEqual(errors, []);
});

test('Still: things out of view do not move', async () => {
    const r = await fresh(`
        const b = ent('ball'); b.x = 47 * TILE; b.y = 38 * TILE; b.z = 30; b.vz = 0; b.vx = 0; b.vy = 0;
        Debug.go(47, 39); await Bot.step(5);
        const seen1 = b.seen;
        Debug.go(80, 60); await Bot.step(1); const z0 = b.z; await Bot.step(60);
        const z1 = b.z;
        Debug.go(47, 39); await Bot.step(60);
        return [seen1, z0 > 0 && z0 === z1, b.z];`);
    assert.equal(r[0], true);
    assert.equal(r[1], true, 'the ball held still in the air while unseen');
    assert.equal(r[2], 0, 'and fell once seen again');
});

test('Return: a pocketed egg comes back when its place is seen anew', async () => {
    const r = await fresh(`
        Debug.go(60, 43); await Bot.step(5); await Bot.face('right'); await Bot.act();
        const n1 = World.inv.egg, e = ent('egg'), g1 = e.gone;
        await Bot.step(30); const g2 = e.gone;
        Debug.go(45, 50); await Bot.step(10);
        Debug.go(60, 43); await Bot.step(10);
        return [n1, g1, g2, e.gone];`);
    assert.deepEqual(r, [1, true, true, false]);
});

test('Hour: the island hour moves only while the Great Clock is seen', async () => {
    const r = await fresh(`
        Debug.go(50, 40); await Bot.step(5); const h0 = World.hour; await Bot.step(300); const h1 = World.hour;
        Debug.go(85, 60); await Bot.step(5); const h2 = World.hour; await Bot.step(300); const h3 = World.hour;
        return [h1 > h0, Math.abs(h3 - h2) < 1e-9];`);
    assert.deepEqual(r, [true, true]);
});

test('Bound: the edge of the view drags a sheep along', async () => {
    const r = await fresh(`
        const s = ent('dolly'); s.x = 80 * TILE; s.y = 50 * TILE; s.st.t = 99;
        Debug.go(80, 49); await Bot.step(10);
        for (let i = 0; i < 25; i++) await Bot.walkTo(80, 49 + Math.min(i, 12), 60);
        return [tileOf(s)[1], s.seen];`);
    assert.ok(r[0] >= 54, 'the sheep was pushed down by the top edge: row ' + r[0]);
    assert.equal(r[1], true);
});

test('Wrap: in the woods, walking out one edge comes in at the other', async () => {
    const r = await fresh(`
        G.flags.spyglass = true; Debug.go(28, 38); await Bot.step(20);
        await Bot.look({ left: true }, 48);
        Bot.keys({ right: true }); await Bot.step(70); Bot.keys();
        return tileOf(World.dot)[0];`);
    assert.ok(r <= 24, 'Dot crossed the tree wall: x ' + r);
});

test('Wrap only happens inside the woods', async () => {
    const r = await fresh(`
        G.flags.spyglass = true; Debug.go(50, 40); await Bot.step(20);
        await Bot.look({ left: true }, 30);
        Bot.keys({ right: true }); await Bot.step(200); Bot.keys();
        return [tileOf(World.dot)[0], Notebook.got.wrap ? 1 : 0];`);
    assert.ok(r[0] > 45 && r[0] < 70, 'Dot stayed in the village: x ' + r[0]);
    assert.equal(r[1], 0);
});

test('Crowd: a fifth figure in a line flickers', async () => {
    const r = await fresh(`
        World.hour = 22; Debug.go(17, 72); await Bot.step(30);
        const g = [0, 1, 2, 3].map(i => ent('faded' + i));
        const before = g.filter(e => e.flick).length;
        Bot.keys({ up: true }); await Bot.step(20); Bot.keys(); await Bot.step(2);
        return [g.every(e => e.seen), before, g.filter(e => e.flick).length + (World.dot.flick ? 1 : 0)];`);
    assert.equal(r[0], true);
    assert.equal(r[1], 0, 'four in a line: nobody flickers');
    assert.ok(r[2] >= 1, 'with Dot in the line, someone flickers');
});

test('Tiny: the ant bridge exists only up close', async () => {
    const r = await fresh(`
        Cam.zmin = 0.5; Cam.zmax = 3; World.hour = 22; Debug.go(28, 59); await Bot.step(10);
        const t = MAPS.island.find('htwig1'), a = exists(t);
        for (let i = 0; i < 4; i++) await Bot.press('zin'); await Bot.step(30);
        return [a, exists(t), Cam.zoom];`);
    assert.deepEqual(r, [false, true, 3]);
});

test('Seam: across the split, two places are one', async () => {
    const r = await fresh(`
        Object.assign(G.flags, { spyglass: 1, prism: 1 }); Debug.go(66, 19); await Bot.step(20); await Bot.face('right'); await Bot.step(20);
        await Bot.press('split'); await Bot.step(5);
        await Bot.look({ right: true }, 22);
        Bot.keys({ right: true }); await Bot.step(60); Bot.keys();
        return tileOf(World.dot)[0];`);
    assert.ok(r >= 71, 'Dot crossed the gap: x ' + r);
});

test('Saving and loading keep the island as it was', async () => {
    const r = await page.evaluate(async () => {
        try { localStorage.clear(); } catch (e) { }
        Title.enter(); Game.newGame(); await Bot.talkThrough();
        Object.assign(G.flags, { cake: true, bridge: true, spyglass: true, quarryGate: true });
        setTile(MAPS.island, 65, 40, 'b'); World.hour = 14.5; World.inv.egg = 2;
        ent('dolly').x = 70 * TILE; Notebook.got.still = 1; Cam.zmin = 0.5;
        Debug.go(52, 40); await Bot.step(5);
        const ok = Save.write(true);
        Title.enter(); Game.continueGame(); await Bot.step(5);
        return [ok, G.flags.cake && G.flags.spyglass, MAPS.island.t(65, 40), Math.round(World.hour * 10) / 10, World.inv.egg, Math.round(ent('dolly').x / TILE), !!Notebook.got.still, Cam.zmin, tileOf(World.dot).join(',')];
    });
    assert.deepEqual(r, [true, true, 'b', 14.5, 2, 70, true, 0.5, '52,40']);
});

test('A save from the last act resumes as the Eye', async () => {
    const r = await page.evaluate(async () => {
        try { localStorage.clear(); } catch (e) { }
        Title.enter(); Game.newGame(); await Bot.talkThrough();
        Object.assign(G.flags, { festival: 1, spyglass: 1, loupe: 1, wideglass: 1, prism: 1, eye: 1, eyeTold: 1 });
        World.hour = 21; Eye.begin(); await Bot.step(5);
        const a = ent('ansel'); a.st.arrived = true; a.x = 86 * TILE; a.y = 11 * TILE;
        Save.write(true);
        Title.enter(); Game.continueGame(); await Bot.step(5);
        return [Cam.eye, G.state, !!ent('ansel').st.arrived, tileOf(ent('ansel'))[0] >= 84];
    });
    assert.deepEqual(r, [true, 'play', true, true]);
});

test('secrets: the seventh egg is golden', async () => {
    const r = await fresh(`
        for (let i = 0; i < 7; i++) {
            Debug.go(60, 43); await Bot.step(5); await Bot.face('right'); await Bot.act();
            Debug.go(45, 50); await Bot.step(5);
        }
        return [G.flags.eggsPicked, !!G.flags.curio_goldegg];`);
    assert.deepEqual(r, [7, true]);
});

test('secrets: the tower bird at midnight', async () => {
    const r = await fresh(`
        World.hour = 23.9; Debug.go(51, 40); await Bot.step(200);
        const f = MAPS.island.find('feather');
        if (!f) return 'no feather';
        Debug.go(50, 39); await Bot.step(5); await Bot.face('up'); await Bot.act();
        return !!G.flags.curio_feather;`);
    assert.equal(r, true);
});

test('secrets: Leica squeezed into the walled garden', async () => {
    const r = await fresh(`
        G.flags.spyglass = true;
        const l = ent('leica'); l.x = 48 * TILE; l.y = 31 * TILE + 6; l.st.t = 99;
        Debug.go(40, 37); await Bot.step(20);
        const ins = [];
        for (let i = 0; i < 90; i++) { await Bot.look({ left: true }, 2); const [x, y] = tileOf(l); if (x >= 43 && x <= 45 && y >= 31 && y <= 32) { ins.push(i); } }
        await Bot.press('center'); await Bot.step(60); await Bot.talkThrough();
        return [ins.length > 0, !!l.st.dug || !!G.flags.curio_marble, !!G.flags.curio_marble, tileOf(l).join(',')];`);
    assert.equal(r[0], true, 'Leica got into the garden: ' + r[3]);
    assert.equal(r[1], true);
});

test('no page errors along the way', () => { assert.deepEqual(errors, []); });
