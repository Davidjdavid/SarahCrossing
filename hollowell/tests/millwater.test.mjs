// Millwater: Heron Rock (the Hookline: a barrel reeled ashore leaves its mark empty on the rock; out of the line, the mark
// is a thing to hook onto), and the lake's shore (one band of shallows, no lone squares).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
const mw = (x, y) => [128 + x, 80 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
function game(pre) { const HW = loadGame(); HW.preset(pre); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 24; return HW; }
const noErr = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function ashore(HW) {
    HW.warp('hollow', ...mw(53, 19)); HW.step(5);
    for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy') HW.G.map.remove(e);
    return HW.G.map.find('heronBarrel');
}

test('Heron Rock: reel the barrel ashore, set it out of the line, hook its empty mark: over to the rock; the post on the shore brings you back', () => {
    const HW = game('afterD2');
    const b = ashore(HW), p = HW.player();
    go(HW, ...mw(51, 18)); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1);
    assert.ok(until(HW, () => b.ty === mw(0, 17)[1] && !b.mv && !b.hookPulled, 200), `reeled ashore (at ${b.tx - 128},${b.ty - 80})`);
    /* it's in the way of its own mark: lift it out of the water and set it down on the bank */
    HW.face('up'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry === b, 'lifted');
    HW.face('left'); HW.press('act', 1); HW.step(40);
    assert.ok(!p.carry && b.tx < mw(51, 0)[0], 'set aside');
    HW.face('up'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.tx === mw(51, 0)[0] && p.ty === mw(0, 14)[1] && p.state === 'normal', 120), `onto its mark on the rock (at ${p.tx - 128},${p.ty - 80})`);
    HW.face('up'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the Heart Patch');
    /* off its mark, and the barrel comes home; then back to the shore by the eel-catcher's post */
    go(HW, ...mw(50, 14));
    assert.ok(until(HW, () => HW.Return.isHome(b) && !b.mv, 900), 'the barrel home on its rock');
    HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.ty === mw(0, 18)[1] && p.state === 'normal', 120), 'back ashore');
    noErr(HW);
});

test('Heron Rock: the barrel reeled ashore and left in the water is in the line; the hook just catches it again', () => {
    const HW = game('afterD2');
    const b = ashore(HW), p = HW.player();
    go(HW, ...mw(51, 18)); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1);
    until(HW, () => b.ty === mw(0, 17)[1] && !b.mv && !b.hookPulled, 200);
    HW.step(10); HW.press('tool', 1); HW.step(60);
    assert.ok(p.ty === mw(0, 18)[1], 'still on the shore');
    assert.equal(HW.walkTo(...mw(51, 14)), false, 'no way over on foot');
    noErr(HW);
});

test("the lake's shore: its shallows run in bands; no square of shallow water stands alone among grass", () => {
    const HW = game('afterD2');
    HW.warp('hollow', ...mw(9, 24)); HW.step(5);
    const a = HW.G.map, wet = (x, y) => a.kind(...mw(x, y)).water;
    const lone = [];
    for (let y = 2; y <= 18; y++) for (let x = 3; x <= 60; x++) {
        if (!a.kind(...mw(x, y)).shallow && a.cell(...mw(x, y)).k !== 'shallow') continue;
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => wet(x + dx, y + dy))) lone.push([x, y]);
    }
    assert.deepEqual(lone, []);
    noErr(HW);
});

/* ---------- the revisits: Wick's Duck Pond (the Crossbar), the Old Mill Pond (the Bedroll), the Gulls' Rock (the Needle) ---------- */
function at(HW, x, y) {
    HW.warp('hollow', ...mw(x, y)); HW.step(20); HW.skipTalk();
    for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy') HW.G.map.remove(e);
    return HW.G.map;
}
const virt = (HW, keys, n) => { HW.global('Input').virt = keys; HW.step(n); HW.global('Input').virt = {}; HW.step(2); };
const talk = (HW, who) => { const n = HW.G.map.ents.find(e => e.who === who), D = HW.global('Dialog'); HW.Script.run(HW.global('Story').talk(n)()); const out = []; for (let i = 0; i < 60; i++) { HW.step(3); if (D.active) { out.push(D.pages.flat().join(' ')); D.page = D.pages.length - 1; D.shown = 9999; HW.press('act', 1); } } return out.join(' '); };
const DUCKS = ['mwDuck1', 'mwDuck2', 'mwDuck3'];

test("Wick's ducks: walled in, and nothing but their crossbar moves them; before the Crossbar they stay put", () => {
    const HW = game('afterD5');
    const a = at(HW, 13, 20), p = HW.player(), ducks = DUCKS.map(i => a.find(i));
    assert.equal(HW.walkTo(...mw(8, 20)), false, 'the pond is walled all round');
    for (const t of ['hook', 'bell']) { HW.Inv.equipped = t; HW.face('left'); HW.press('tool', 1); HW.step(80); }
    assert.ok(ducks.every((d, i) => d.tx === mw(6 + 2 * i, 0)[0] && d.ty === mw(0, 22)[1]), 'all three still on their stands');
    noErr(HW);
});

test("Wick's ducks: the rack walks all three; the rocks hold one back while the others go on; all three home at once: Wick's lucky float", () => {
    const HW = game('afterD6');
    const a = at(HW, 13, 20), ducks = DUCKS.map(i => a.find(i)), C = HW.global('Crossbar');
    HW.Inv.equipped = 'crossbar'; HW.face('left'); HW.press('tool', 1); HW.step(5);
    assert.ok(C.ctl && C.ctl.puppets.length === 3, 'the rack: all three ducks');
    /* straight up, the three can't spread out to the houses, which are further apart than the ducks */
    const dir = { L: 'left', R: 'right', U: 'up', D: 'down' };
    for (const c of 'UUUU') { HW.press(dir[c], 1); HW.step(16); }
    assert.ok(!HW.Progress.flag('mw_ducksHome'), 'up alone: not all three home');
    HW.press('tool', 1); HW.step(5);
    assert.ok(until(HW, () => ducks.every(d => HW.Return.isHome(d) && !d.mv), 900), 'let go: they swim home');
    HW.press('tool', 1); HW.step(5);
    /* left, up; right, right (the rock by the west wall holds Dot back: the other two spread); up; left (the rock in the
       east holds Dimple: Dash comes back into the middle); up, up */
    for (const c of 'LURRULUU') { HW.press(dir[c], 1); HW.step(16); }
    assert.deepEqual(ducks.map(d => [d.tx - 128, d.ty - 80]), [[5, 18], [8, 18], [11, 18]]);
    HW.step(5);
    assert.ok(HW.Progress.flag('mw_ducksHome'), 'all three flags up');
    HW.press('tool', 1); HW.step(5);
    at(HW, 17, 18);
    assert.match(talk(HW, 'wick'), /lucky float/);
    assert.ok(HW.Inv.items.wickfloat, "Wick's lucky float");
    assert.doesNotMatch(talk(HW, 'wick'), /lucky float/, 'given once');
    noErr(HW);
});

/* on the mill's barrel, paddled into the race's mouth (the current runs it at the grating) */
function intoTheRace(HW) {
    const a = at(HW, 35, 18), b = a.find('millBarrel'), p = HW.player(), I = HW.global('Input');
    const paddleTo = (x, y) => { HW.Inv.equipped = 'paddle'; for (let i = 0; i < 400 && !(b.tx === mw(x, 0)[0] && b.ty === mw(0, y)[1] && !b.mv); i++) { I.virt = { tool: true, [b.tx < mw(x, 0)[0] ? 'right' : b.tx > mw(x, 0)[0] ? 'left' : b.ty < mw(0, y)[1] ? 'down' : 'up']: true }; HW.step(1); } I.virt = {}; HW.step(2); };
    go(HW, ...mw(34, 18)); HW.face('up'); virt(HW, { up: true }, 20);
    assert.ok(p.tx === b.tx && p.ty === b.ty, 'aboard the barrel');
    paddleTo(32, 17); paddleTo(32, 18);
    HW.step(120);
    return { a, b, p, paddleTo };
}

test('the old mill pond: the grating stops a float with somebody on it; the Bedroll laid on it goes in on its own, and Homeward lands you inside; the boat; the gate opens from inside', () => {
    const HW = game('afterD5');
    const { b, p, paddleTo } = intoTheRace(HW);
    assert.deepEqual([b.tx, b.ty], mw(32, 18), 'held at the grating with Wren aboard');
    assert.equal(HW.walkTo(...mw(36, 22)), false, 'no way in on foot');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5);
    assert.ok(HW.global('Bedroll').float === b, 'the Bedroll laid on the barrel');
    HW.face('right'); virt(HW, { right: true }, 20);
    assert.deepEqual([p.tx, p.ty], mw(33, 18), 'stepped off onto the shallows');
    assert.ok(until(HW, () => b.ty === mw(0, 20)[1] && !b.mv, 300), 'on its own it slips under the grating into the pond');
    HW.Inv.equipped = 'bedroll'; virt(HW, { tool: true }, 25);
    assert.ok(until(HW, () => p.state === 'normal' && p.ty === mw(0, 20)[1], 300), 'Homeward: down on the barrel, inside');
    paddleTo(36, 20); HW.face('down'); virt(HW, { down: true }, 20);
    assert.ok(p.ty >= mw(0, 21)[1] && p.tx === mw(36, 0)[0], 'ashore inside');
    go(HW, ...mw(36, 22)); HW.face('left'); const b0 = HW.Inv.buttons; HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('mw_boat') && HW.Inv.buttons === b0 + 30, 'THE TESS, & A., and thirty buttons');
    HW.face('down'); HW.press('act', 1); HW.step(30);
    assert.ok(HW.Progress.flag('mw_pondGate') && HW.walkTo(...mw(36, 25)), 'the gate, unbolted from inside, and out');
    at(HW, 28, 23);
    assert.match(talk(HW, 'ambrose'), /courting/, "Dad's story");
    /* built again, the gate stays open and the boat's where it was */
    at(HW, 36, 25);
    assert.ok(HW.walkTo(...mw(36, 22)), 'in through the gate');
    noErr(HW);
});

test('the old mill pond: without a Bedroll on it the barrel goes in alone, and comes home again; nobody gets in with it', () => {
    const HW = game('afterD5');
    const { b, p } = intoTheRace(HW);
    HW.face('right'); virt(HW, { right: true }, 20);
    assert.ok(until(HW, () => b.ty === mw(0, 20)[1], 300), 'in, alone');
    assert.ok(p.ty <= mw(0, 18)[1] && HW.walkTo(...mw(36, 22)) === false, 'Wren still outside');
    assert.ok(until(HW, () => HW.Return.isHome(b) && !b.mv, 1200), 'and home it comes, under the grating again');
    noErr(HW);
});

test("the Gulls' Rock: nothing there to catch a hook, and the cleft lets nobody through; the float pulled over onto the rock is no way across", () => {
    const HW = game('afterD6');
    const a = at(HW, 41, 2), f = a.find('gullFloat'), p = HW.player();
    const onRock = () => p.tx >= mw(56, 0)[0] && p.tx <= mw(58, 0)[0] && p.ty >= mw(0, 8)[1] && p.ty <= mw(0, 10)[1];
    /* from the pier: the float's at your feet (there's nowhere nearer to reel it); over the low rocks, nothing to catch */
    for (const x of [56, 57, 58]) {
        go(HW, ...mw(x, 5)); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1);
        for (let i = 0; i < 90; i++) { HW.step(1); assert.ok(!onRock(), 'never on the rock'); }
        assert.deepEqual([p.tx, p.ty], mw(x, 5), 'still on the pier');
    }
    /* reeled off its mooring onto the pier, the float leaves its empty mark out in the water: hooked, in Wren goes, and home */
    go(HW, ...mw(57, 3)); HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => f.ty === mw(0, 4)[1] && !f.mv && !f.hookPulled, 120), 'the float reeled up onto the pier');
    go(HW, ...mw(56, 4)); go(HW, ...mw(56, 5)); go(HW, ...mw(57, 5)); HW.face('down'); HW.press('tool', 1);
    for (let i = 0; i < 300; i++) { HW.step(1); assert.ok(!onRock(), 'never on the rock'); }
    assert.ok(until(HW, () => HW.Return.isHome(f) && !f.mv, 900), 'the float back at its mooring');
    /* the cleft: nobody walks it, no barrel goes through it */
    assert.equal(HW.walkTo(...mw(57, 10)), false, 'no way over on foot');
    const C = a.ents.find(e => e.kind === 'cleft'), bar = a.find('millBarrel');
    assert.ok(C.blocks(...mw(57, 7), p) && C.blocks(...mw(57, 7), bar) && !C.blocks(...mw(57, 7), f), 'too narrow for Wren or a barrel; not for the little float');
    noErr(HW);
});

test("the Gulls' Rock: the Needle gives the float a place on the rock; pulled off it, its empty mark is something to hook onto; the gulls' hoard; off by the eel-catcher's post", () => {
    const HW = game('afterD7');
    const a = at(HW, 41, 2), f = a.find('gullFloat'), p = HW.player();
    go(HW, ...mw(57, 5));
    HW.face('down'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    for (const d of ['down', 'down']) { HW.press(d, 1); HW.step(9); }
    HW.press('tool', 1); HW.step(40);
    assert.ok(HW.Return.isHome(f) && f.ret.mx === mw(57, 0)[0] && f.ret.my === mw(0, 8)[1], 'through the cleft to its new place on the rock');
    HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => f.ty === mw(0, 6)[1] && !f.mv && !f.hookPulled, 200), 'hooked back out through the cleft');
    HW.face('down'); HW.press('act', 1); HW.step(15);
    assert.ok(p.carry === f, 'lifted out of the line');
    HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.state === 'normal' && p.ty === mw(0, 8)[1] && p.tx === mw(57, 0)[0], 200), 'over onto its empty mark, on the rock');
    HW.face('left'); HW.press('act', 1); HW.step(30);
    go(HW, ...mw(57, 10)); HW.face('left'); const b0 = HW.Inv.buttons;
    HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); HW.skipTalk(); HW.step(5); HW.skipTalk();
    assert.ok(HW.Progress.flag('mw_gulls') && HW.Inv.items.mwring && HW.Inv.buttons === b0 + 40, "the gulls' hoard: forty buttons and a ring");
    go(HW, ...mw(58, 8)); HW.face('up'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.state === 'normal' && p.ty === mw(0, 5)[1], 200), "back by the eel-catcher's post on the pier");
    assert.ok(until(HW, () => HW.Return.isHome(f) && !f.mv, 1500), 'the float home on the rock again');
    at(HW, 28, 23);
    assert.match(talk(HW, 'ambrose'), /ring/);
    assert.ok(!HW.Inv.items.mwring && HW.Progress.flag('mw_ringHome'), 'the ring given back');
    noErr(HW);
});

test('the quilt counts the three places by the lake', () => {
    const HW = game('afterD8');
    const row = () => HW.global('Quilt').tally().find(r => /Secrets/.test(r[0]));
    const [, n0, m] = row();
    for (const f of ['mw_ducksHome', 'mw_boat', 'mw_gulls']) HW.Progress.set(f);
    assert.equal(row()[1], n0 + 3); assert.equal(row()[2], m);
    noErr(HW);
});
