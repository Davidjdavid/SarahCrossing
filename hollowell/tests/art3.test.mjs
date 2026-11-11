// Fix round C, art (POLISH.md findings 42, 47, 50, 52, 53): layering, the find held up, what's drawn where the words
// say, kept fixed. (The threads' contrast is tests/contrast.test.mjs; the pictures are looked at in Chromium.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };

test('a landed glaze puddle lies under Wren; while it falls it is over her', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const Hazard = HW.global('Hazard'), p = HW.player(), a = HW.G.map;
    const h = a.add(new Hazard({ area: a, alive: true }, { shape: 'drop', x: p.x, y: p.y, r: 10, tell: 40, live: 200, dmg: 0, look: () => {}, lookLanded: () => {} }));
    h.t = 25; assert.ok(h.sortY > p.sortY, 'coming down: drawn over her');
    h.t = 45; assert.ok(h.landed && h.sortY < p.sortY, 'landed: a puddle on the floor, under her');
});

test('the warm pie sits on the kitchen table, drawn after it', () => {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'tidy', x: 10, y: 38, noAutosave: true, skipIntro: true }); HW.step(5);
    const a = HW.G.map, ART = HW.ART;
    const pie = a.ents.find(e => e.im === ART.pie || e.im === ART.pie_empty), table = a.ents.find(e => e.im === ART.table && Math.abs(e.ty - pie.ty) <= 1);
    assert.ok(pie && table, 'the pie and its table');
    assert.ok(pie.sortY > table.sortY, `the pie (${pie.sortY}) after the table (${table.sortY})`);
    assert.ok(pie.y + pie.im.height <= table.y + table.im.height - 4, 'and on its top, not in front of its legs');
});

/* every chest in the Houses, opened from the tile below it: she holds the find up away from the chest (a tile back, or
   aside), onto plain floor in the same room; only where there's none is the find held up high over the chest */
test('the find held up: never with the chest sat on her head', () => {
    const HOUSES = [['tidy', null], ['kiln', 'afterD1'], ['millrace', 'afterD2'], ['belfry', 'afterD3'], ['slumber', 'afterD4'], ['marionette', 'afterD5'], ['spoolworks', 'afterD6'], ['loom', 'afterReveal2']];
    let opened = 0, high = 0;
    for (const [id, preset] of HOUSES) {
        const HW = loadGame();
        if (preset) { HW.preset(preset); HW.step(5); HW.skipTalk(); } else { HW.newGame('Wren', { area: id, x: 29, y: 42, noAutosave: true, skipIntro: true }); HW.Inv.items.staff = 1; HW.step(5); }
        HW.warp(id, 1, 1); HW.step(2);
        const chests = HW.G.map.ents.filter(e => e.kind === 'chest' && !e.hidden).map(c => [c.tx, c.ty]);
        for (const [cx, cy] of chests) {
            HW.warp(id, cx, cy + 1, 'up'); HW.step(20); HW.skipTalk(); HW.step(2);
            const a = HW.G.map, p = HW.player(), c = a.ents.find(e => e.kind === 'chest' && e.tx === cx && e.ty === cy);
            if (!c || c.opened || p.tx !== cx || p.ty !== cy + 1 || p.state !== 'normal') continue;
            const room = a.roomAt(p.tx, p.ty);
            p.dir = HW.global('UP');
            c.interact(p);
            assert.ok(until(HW, () => HW.G.holdUp, 30), `${id} ${cx},${cy}: the find held up`);
            opened++;
            const q = HW.player(), k = a.kind(q.tx, q.ty);
            if (HW.G.holdUp.high) { high++; assert.ok(q.tx === cx && q.ty === cy + 1, 'held high only where she stood'); }
            else {
                assert.ok(!(q.tx === cx && q.ty === cy + 1), `${id} ${cx},${cy}: she stepped away from under it`);
                assert.ok(a.roomAt(q.tx, q.ty) === room && !k.solid && !k.pit && !k.water && !k.hurt, `${id} ${cx},${cy}: onto plain floor in the room`);
                assert.ok(!a.ents.some(e => e !== q && !e.removed && e.tx === q.tx && e.ty === q.ty), `${id} ${cx},${cy}: onto nothing at all`);
            }
            HW.skipTalk(); HW.step(5);
            assert.equal(HW.player().state, 'normal', 'and back to normal');
        }
        assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
    }
    assert.ok(opened >= 25, `chests opened (${opened})`);
    assert.ok(high <= Math.ceil(opened / 10), `held high over the chest only now and then (${high} of ${opened})`);
});

test('a readable set piece under the HUD makes it step back (the stove\'s pan of milk under two rows of hearts)', () => {
    const HW = loadGame();
    HW.preset('afterD4'); HW.step(5); HW.skipTalk();
    HW.warp('slumber', 43, 4); HW.step(30); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 38;
    const UI = HW.global('UI'), a = HW.G.map;
    HW.G.onScreen = a.ents.slice();
    while (HW.G.t % 8) HW.step(1);
    HW.G.onScreen = a.ents.slice();
    assert.equal(UI.hudCovers(), true, 'the stove is under the hearts: the HUD steps back');
    /* (and plain scenery doesn't) */
    HW.G.onScreen = a.ents.filter(e => !e.interact && !e.isGrid && e.kind === 'prop');
    UI._hc = undefined;
    assert.equal(UI.hudCovers(), false, 'scenery alone never moves it');
});

test('after a flight home she has her moment\'s grace without blinking out; a hurt still blinks', () => {
    const HW = loadGame();
    HW.preset('afterD2'); HW.step(5); HW.skipTalk();
    HW.warp('millrace', 29, 42); HW.step(20); HW.skipTalk();
    const p = HW.player();
    p.flyHome();
    assert.ok(until(HW, () => p.state === 'normal' && !p.flight, 300), 'landed');
    assert.ok(p.inv > 0, 'safe a moment');
    /* (drawn every frame of it: her sprite goes on the screen each time) */
    const Gfx = HW.global('Gfx'), img0 = Gfx.img;
    let missed = 0;
    try { for (let i = 0; i < 40; i++) { let n = 0; Gfx.img = (...q) => { n++; return img0.apply(Gfx, q); }; p.draw(0, 0); if (!n) missed++; HW.step(1); } } finally { Gfx.img = img0; }
    assert.equal(missed, 0, 'never blinked out after landing');
    p.inv = 0; p.hurt(1, p.x + 10, p.y);
    assert.ok(p.blink, 'hurt: she blinks');
    HW.step(80);
    assert.equal(p.blink, false, 'and stops when the grace is over');
});

test('fainted, or laid out by a scene, she lies flat; sitting to wait she only shuts her eyes', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const p = HW.player(), SPR = HW.global('SPR');
    p.state = 'faint'; assert.equal(p.sprite().im, SPR.wren_lie, 'fainted: lying');
    p.state = 'sleep'; assert.equal(p.sprite().im, SPR.wren_lie, 'laid out in a scene: lying');
    HW.G.waiting = { t: 0 }; assert.equal(p.sprite().im, SPR.wren_sleep, 'waiting: eyes shut');
    HW.G.waiting = null; p.state = 'normal';
});

test('the Kiln\'s heart cracks open into a glowing pit, not the night sky', () => {
    const HW = loadGame();
    const THEMES = HW.global('THEMES'), AREAS = HW.AREAS;
    const heart = AREAS.kiln.themeAt(20 + 9, 0 + 5);
    assert.equal(heart, 'kiln_core', 'the Heart has its own look');
    assert.equal(typeof THEMES[heart].pit, 'function', 'with its own pit');
    assert.equal(THEMES.kilnhouse.pit, undefined, "the rest of the Kiln's pits as they were");
    assert.equal(THEMES.slumberhouse.pit, undefined, 'and every other House\'s');
});

test('the West Gate swings open with the bolt: its tiles free at once, its leaves folding back rather than gone in a puff', () => {
    const HW = loadGame();
    HW.preset('afterD5'); HW.step(5); HW.skipTalk();
    HW.Progress.set('fair_gate', false);
    HW.warp('hollow', 60, 58); HW.step(20); HW.skipTalk();
    const a = HW.G.map, leaves = a.ents.filter(e => e.skey === 'westGateA' || e.skey === 'westGateB');
    assert.equal(leaves.length, 2, 'the two leaves');
    const tiles = leaves.map(e => [e.tx, e.ty]);
    assert.ok(tiles.every(([x, y]) => a.kind(x, y).solid), 'shut: solid');
    const bolt = a.ents.find(e => e.im === HW.ART.bolt);
    bolt.interact(); HW.skipTalk(); HW.step(5);
    assert.ok(HW.Progress.flag('fair_gate'), 'drawn');
    assert.ok(tiles.every(([x, y]) => !a.kind(x, y).solid), 'open: the road free');
    assert.ok(leaves.every(e => a.ents.includes(e) && e.solid.length === 0), 'the leaves still there, swinging, solid nowhere');
});

test('water filled in for good with a stray is remembered as water (drawn as the stone sitting in it)', () => {
    const HW = loadGame();
    HW.preset('afterD8'); HW.step(5); HW.skipTalk();
    HW.warp('drift', 35, 19); HW.step(10); HW.skipTalk();
    const a = HW.G.map, Block = HW.global('Block');
    const [x, y] = [40, 16];
    assert.ok(a.kind(x, y).water, 'the stream');
    const b = a.add(new Block(x, y - 1, { stray: true }));
    a.unplace(b, b.tx, b.ty); b.tx = x; b.ty = y; b.x = x * 16; b.y = y * 16; a.place(b, x, y); b.landed(false);
    assert.ok(!a.kind(x, y).water && HW.Progress.areaFlag('drift', `fill:${x},${y}`), 'filled');
    assert.ok(a.filledFrom && a.filledFrom.get(`${x},${y}`).k === 'water', 'remembered as water');
    HW.warp('drift', 35, 19); HW.step(5);
    assert.ok(HW.G.map.filledFrom && HW.G.map.filledFrom.get(`${x},${y}`).k === 'water', 'and when the place is built again');
});

test("the Well with its cap off from the Great Pull on; the Staff door ajar once it's open", () => {
    const HW = loadGame();
    HW.preset('afterD8'); HW.step(5); HW.skipTalk();
    HW.warp('hollow', 95, 63); HW.step(5); HW.skipTalk();
    const well = HW.G.map.ents.find(e => e.skey === 'well');
    well.draw(0, 0); assert.equal(well.im, HW.ART.well, 'capped');
    HW.Progress.set('great_pull'); well.draw(0, 0); assert.equal(well.im, HW.ART.well_open, 'open');
    HW.warp('inn', 7, 7); HW.step(5); HW.skipTalk();
    const door = HW.G.map.ents.find(e => e.im === HW.ART.staffdoor || e.im === HW.ART.staffdoor_ajar);
    door.draw(0, 0); assert.equal(door.im, HW.Progress.flag('reveal1') ? HW.ART.staffdoor_ajar : HW.ART.staffdoor);
});
