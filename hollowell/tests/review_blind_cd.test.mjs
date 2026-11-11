// Fix round D, part 1 (AI blind solvers C and D, heuristic evaluations, not playtests): the fifth House's way home drawn as
// it's walked and its night-lights joined only by one way home; a bed kept as Wren's mark through a load; Homeward
// straight after a drop; a dreamcatcher on a flight's second tile; the journal inside the House; Snorelings at doors;
// the Bell rung from a doorway; the ninth Little House again; and Options > Grip (hold or toggle), everywhere a grip is.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { slackAndCut, junkAndCut, darkAndCut } from './legs.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const said = HW => (HW.G.pendingToast || '') + ' ' + HW.global('UI').toasts.map(t => t.s).join(' ');

/* ================= the Slumberhouse ================= */
const R = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], loft: [40, 33], landing: [20, 11], moonwalk: [40, 11], kitchen: [40, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
function house({ tools = ['bedroll'], god = true } = {}) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'slumber', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.G.cheats.god = god;
    HW.Progress.set('slumber_matron');
    for (const d of ['lwLockE', 'lwLockN', 'mwLockN']) HW.Progress.setAreaFlag('slumber', 'door:' + d);
    HW.Progress.setAreaFlag('slumber', 'lever:mwChuteLever');
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('slumber', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
/* tile by tile (orthogonal moves), as a careful player walks when it matters where her feet go */
function steps(HW, room, path) {
    const p = HW.player();
    for (const [x, y] of path) {
        const [tx, ty] = at(room, x, y);
        const d = tx > p.tx ? 'right' : tx < p.tx ? 'left' : ty > p.ty ? 'down' : 'up';
        for (let i = 0; i < 80 && (p.tx !== tx || p.ty !== ty); i++) { HW.hold(d); HW.step(1); }
        HW.release(); until(HW, () => !HW.Cam.busy, 60);
        const horiz = d === 'left' || d === 'right';
        for (let i = 0; i < 16; i++) {
            const off = horiz ? p.x - (tx * 16 + 8) : p.y - (ty * 16 + 10);
            if (Math.abs(off) <= 2) break;
            HW.hold(horiz ? (off > 0 ? 'left' : 'right') : (off > 0 ? 'up' : 'down')); HW.step(1);
        }
        HW.release();
        assert.deepEqual([p.tx, p.ty], [tx, ty], `stepped onto ${room} ${x},${y}`);
    }
}
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); const p = HW.player(); until(HW, () => p.state === 'normal', 1500); };
/* every thread drawn in a frame, as [colour, points]; and Wren's own (her red) among them */
function drawn(HW) {
    const Th = HW.global('Threads'), path0 = Th.path, out = [];
    Th.path = function (pts, col, under) { out.push([col, pts.map(q => [q[0], q[1]])]); return path0.call(this, pts, col, under); };
    try { HW.global('Game').render(); } finally { Th.path = path0; }
    return out;
}
const RED = HW => HW.global('THREAD').wren;
/* the milk kitchen dreamt on its own: the Bedroll on its near bank, over the gap on the lower springs, down the hole in its
   far bank into the Moonwalk, and Homeward back up through it */
function milk(HW) {
    enter(HW, 'kitchen', 15, 9); lay(HW);
    const p = HW.player();
    steps(HW, 'kitchen', [[15, 8], [15, 7]]);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    steps(HW, 'kitchen', [[3, 7], [4, 7], [4, 8], [4, 9]]);
}

test("the fifth House, with the Bedroll laid in it: Wren's thread back to it is drawn as she goes, from the Bedroll to her feet (the way a flight home takes, room to room); a step back onto it cuts it, and the loop that drops out is drawn fading where it lay", () => {
    const HW = house();
    /* (in the linen cupboard's open end: nobody about to take the Bedroll for a bed) */
    enter(HW, 'linen', 14, 9); lay(HW);
    const p = HW.player(), B = HW.global('Bedroll'), Cam = HW.Cam;
    steps(HW, 'linen', [[15, 9], [16, 9], [16, 8]]);
    let red = drawn(HW).filter(([c]) => c === RED(HW));
    assert.equal(red.length, 1, 'her thread, drawn once, with the threads');
    let pts = red[0][1];
    const px = (x, y) => [at('linen', x, y)[0] * 16 + 8 - Cam.x, at('linen', x, y)[1] * 16 + 9 - Cam.y];
    assert.deepEqual(pts[0], px(14, 9), 'from the Bedroll');
    assert.deepEqual(pts[pts.length - 1], [p.x - Cam.x, p.y - Cam.y - 4], 'to her feet');
    assert.ok(pts.some(([x, y]) => x === px(16, 9)[0] && y === px(16, 9)[1]), 'by the way she came (its corner)');
    /* round a little loop and back onto her own steps: cut there, and the loop fades where it lay */
    steps(HW, 'linen', [[15, 8], [15, 9]]);
    assert.deepEqual([...p.trace].map(q => q.join()), [[14, 9], [15, 9]].map(q => at('linen', ...q).join()), 'the thread cut back to where she stepped onto it');
    assert.equal(B.drops.length, 1, 'the loop that dropped out');
    assert.deepEqual([...B.drops[0].pts].map(q => q.join()), [[15, 9], [16, 9], [16, 8], [15, 8], [15, 9]].map(q => at('linen', ...q).join()), 'all of it, round to where it closed');
    const pale = drawn(HW).filter(([c]) => c === '#ffc8d0');
    assert.equal(pale.length, 1, 'drawn, paler');
    HW.step(45);
    assert.equal(B.drops.length, 0, 'and gone');
    /* on through a door: drawn in the next room too, in through the doorway */
    steps(HW, 'linen', [[16, 9], [17, 9], [18, 9], [18, 8], [18, 7], [18, 6], [18, 5], [19, 5]]);
    steps(HW, 'ward', [[0, 5], [1, 5]]);
    red = drawn(HW).filter(([c]) => c === RED(HW));
    assert.equal(red.length, 1, 'in the Long Ward too');
    pts = red[0][1];
    assert.deepEqual(pts[pts.length - 1], [p.x - Cam.x, p.y - Cam.y - 4]);
    /* flying home it's the flight's own red thread instead; rolled up, nothing */
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); until(HW, () => p.state === 'flight', 40);
    assert.equal(drawn(HW).filter(([c]) => c === RED(HW)).length, 0, 'not during the flight');
    HW.release(); until(HW, () => p.state === 'normal', 600);
    assert.deepEqual(here(HW, 'linen'), [14, 9], 'home');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3);
    assert.ok(!HW.Inv.bedroll, 'rolled up');
    HW.step(120);       /* (its straight thread to the doorway, shown a moment as it's rolled up, gone) */
    steps(HW, 'linen', [[15, 9], [16, 9]]);
    assert.equal(drawn(HW).filter(([c]) => c === RED(HW)).length, 0, 'no Bedroll laid: not drawn');
    noErrors(HW);
});

test("not in other places: the Bedroll laid in the lab, her thread isn't drawn", () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab5', x: 5, y: 5, noAutosave: true });
    HW.Inv.giveTool('bedroll'); HW.step(5);
    lay(HW);
    assert.ok(HW.walkTo(9, 6));
    assert.equal(drawn(HW).filter(([c]) => c === RED(HW)).length, 0);
    noErrors(HW);
});

test("the night-lights over the doors: lit on different ways home, all three burn but hang apart, and the third says so; dreamt on one way home, a gold thread runs through all three", () => {
    const HW = house();
    for (const r of ['linen', 'laundry']) HW.Progress.setAreaFlag('slumber', 'dream:' + r);
    HW.Progress.set('slumber_dreamt');
    milk(HW);
    const p = HW.player();
    HW.hold('down'); until(HW, () => p.state === 'normal' && p.ty >= at('moonwalk', 0, 4)[1], 300); HW.release(); until(HW, () => !HW.Cam.busy, 60);
    homeward(HW);
    const D = HW.global('Dreams');
    assert.ok(['linen', 'kitchen', 'laundry'].every(r => D.latched(r)), 'all three lit');
    assert.ok(!HW.Progress.flag('slumber_longway'), 'no Pattern');
    assert.match(said(HW), /All three burn now, each on its own\./, 'and it says so');
    /* over the ward's north door (and the big door): no thread between them yet */
    enter(HW, 'ward', 9, 2);
    /* (gold threads drawn on the screen: the lamps of a door off it are drawn too, out of sight) */
    const gold = () => drawn(HW).filter(([c, pts]) => c === '#f7d64a' && pts.every(([x, y]) => x >= 0 && y >= 0 && x < 320 && y < 180));
    assert.equal(gold().length, 0, 'apart');
    HW.Progress.set('slumber_longway');
    assert.equal(gold().length, 1, 'one way home: joined');
    enter(HW, 'landing', 9, 2);
    assert.equal(gold().length, 1, 'over the big door too');
    noErrors(HW);
});

test('a bed she lay down in is still her mark after a save is loaded: a fall comes home to it, unhurt', () => {
    const HW = house({ god: false });
    const p = HW.player();
    assert.ok(HW.walkTo(...at('porch', 4, 6))); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(p.mark.bed, 'bed', 'the bed is her mark');
    HW.Save.write(1);
    const H2 = loadGame();
    H2.newGame('Other', { area: 'slumber', x: 29, y: 42, noAutosave: true }); H2.step(5);
    H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(HW.Save.read(1))))); H2.step(20);
    const q = H2.player();
    assert.equal(H2.G.map.id, 'slumber');
    assert.equal(q.mark.bed, 'bed', 'still the bed, after the load');
    assert.deepEqual([q.mark.tx, q.mark.ty], at('porch', 4, 6));
    /* over the edge of the porch's pit: home to the bed, and no harm done */
    const hp = H2.Inv.hp;
    assert.ok(H2.walkTo(...at('porch', 9, 4)));
    H2.hold('right'); until(H2, () => q.state === 'fall', 120); H2.release();
    assert.equal(q.state, 'fall', 'in');
    until(H2, () => q.state === 'normal', 600);
    assert.deepEqual([q.tx, q.ty], at('porch', 4, 6), 'woke by the bed');
    assert.equal(H2.Inv.hp, hp, 'unhurt');
    noErrors(HW); noErrors(H2);
});

test('Homeward straight after a drop off a ledge: the tool held while she drops (and the view goes on into the next room) takes her home once she is down', () => {
    const HW = house();
    milk(HW);
    const p = HW.player();
    HW.hold('down'); until(HW, () => p.state === 'hop', 60);
    assert.equal(p.state, 'hop', 'over the edge');
    HW.Inv.equipped = 'bedroll'; HW.hold(['down', 'tool']); HW.step(10); HW.hold('tool');
    assert.ok(until(HW, () => p.state === 'flight', 160), 'the flight home starts once she is down');
    HW.release(); until(HW, () => p.state === 'normal', 600);
    assert.deepEqual(here(HW, 'kitchen'), [15, 9], 'home on the Bedroll');
    /* (a tap while she was in the air, let go before she came down, does nothing later) */
    steps(HW, 'kitchen', [[15, 8], [15, 7]]);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    steps(HW, 'kitchen', [[3, 7], [4, 7], [4, 8], [4, 9]]);
    HW.hold('down'); until(HW, () => p.state === 'hop', 60); HW.hold(['down', 'tool']); HW.step(3); HW.release();
    until(HW, () => p.state === 'normal' && !HW.Cam.busy, 200); HW.step(40);
    assert.equal(p.state, 'normal', 'nothing');
    assert.ok(HW.Inv.bedroll && HW.Inv.bedroll.tx === at('kitchen', 15, 9)[0], 'the Bedroll where it was');
    noErrors(HW);
});

test("a dreamcatcher on a flight home's second tile is flown through, however close to it she stood on the first", () => {
    for (const off of [-5, 0, 3, 5]) {
        const HW = house();
        enter(HW, 'ward', 2, 5); lay(HW);
        steps(HW, 'ward', [[1, 5], [0, 5]]);
        steps(HW, 'linen', [[19, 5], [18, 5], [17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [11, 6], [11, 5], [11, 4], [11, 3], [10, 3], [9, 3]]);
        const p = HW.player(), ring = HW.G.map.find('lcDream');
        p.x = at('linen', 9, 3)[0] * 16 + 8 + off;        /* (the ring hangs over the tile to her right) */
        let lit = false;
        HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release();
        for (let i = 0; i < 600 && p.state !== 'normal'; i++) { HW.step(1); lit = lit || ring.lit > 0; }
        assert.ok(lit, `flown through (standing ${off} px off her tile's middle)`);
        assert.ok(HW.Progress.areaFlag('slumber', 'dream:linen'), 'and dreamt');
        noErrors(HW);
    }
});

test("inside the Slumberhouse the journal's goal isn't to find it any more (a goal from elsewhere is left alone)", () => {
    const HW = house();
    HW.Progress.setGoal('Hushwood: find the Slumberhouse, over the stream.');
    enter(HW, 'ward', 9, 5);
    assert.ok(!/find the Slumberhouse/.test(HW.Progress.goal), HW.Progress.goal);
    assert.match(HW.Progress.goal, /Slumberhouse/);
    HW.Progress.setGoal('Somewhere else entirely.');
    enter(HW, 'ward', 9, 5);
    assert.equal(HW.Progress.goal, 'Somewhere else entirely.');
    noErrors(HW);
});

test("Snorelings keep to their own room: one after Wren stops at the door she goes through, never follows her into the next room or touches her there, and goes back to bed", () => {
    const HW = house({ god: false });
    enter(HW, 'loft', 9, 1);
    const p = HW.player(), a = HW.G.map, s = a.find('dlSnore1'), loft = a.roomAt(...at('loft', 9, 1));
    steps(HW, 'loft', [[8, 1], [7, 1], [6, 1]]);
    s.wake();
    assert.equal(s.mode, 'chase', 'awake, and after her');
    HW.step(20);
    steps(HW, 'loft', [[7, 1], [8, 1], [9, 1], [9, 0]]);
    steps(HW, 'laundry', [[9, 10], [9, 9]]);
    const hp = HW.Inv.hp;
    let out = false, chased = 0;
    for (let i = 0; i < 900; i++) { HW.step(1); if (a.roomAt(s.tx, s.ty) !== loft) out = true; if (s.mode === 'chase') chased = i; }
    assert.ok(!out, 'it never left the loft');
    assert.equal(HW.Inv.hp, hp, 'not a touch in the laundry');
    assert.ok(chased < 120, `it gave up soon (${chased} frames)`);
    assert.ok(s.mode === 'sleep' || s.mode === 'bed' || s.mode === 'home', 'off to bed: ' + s.mode);
    assert.ok(until(HW, () => s.mode === 'sleep', 1500), 'asleep again');
    noErrors(HW);
});

test('the Bell rung standing in a doorway is heard in the room she is standing in, not the next one', () => {
    const HW = house();
    enter(HW, 'loft', 9, 1);
    const p = HW.player(), boulder = HW.G.map.find('dlBoulder');
    assert.ok(boulder.tiedOff, 'the boulder asleep on the island');
    steps(HW, 'loft', [[9, 0]]);
    p.y = at('loft', 9, 0)[1] * 16 + 2;      /* (at the top of the doorway's tile: the bell in her hand is over the next room's) */
    assert.equal(HW.G.map.roomAt(p.tx, p.ty), HW.G.map.roomAt(...at('loft', 9, 1)), 'her feet in the loft');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4);
    assert.ok(!boulder.tiedOff, 'the ring woke it');
    assert.ok(until(HW, () => HW.Return.isHome(boulder), 200), 'and it snapped home');
    noErrors(HW);
});

/* ================= the ninth Little House ================= */
const goM = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
function talk(HW) {
    const out = [], D = HW.global('Dialog');
    for (let i = 0; i < 8000 && (D.active || HW.global('Script').blocking()); i++) {
        if (D.active && D.shown >= D.pageLen()) { if (D.page === D.pages.length - 1) out.push((D.who || '-') + ': ' + D.pages.flat().join(' ')); if (D.choices) D.sel = 0; HW.press('act', 1); } else HW.step(1);
    }
    return out;
}
const stitchM = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
function littleHouse() {
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = [];
    for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
    HW.Progress.set('cap_given');
    HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
    return HW;
}

test("the ninth Little House after a go: told once, plainly, that it can be set out again; and back in, it can (the levers answer, the Needle moves what it stitches, and no stitch is kept for a thing that didn't go)", () => {
    const HW = littleHouse();
    goM(HW, 7, 19); HW.face('down'); HW.press('act', 1); HW.step(5);
    const t = HW.G.map.find('tuck');
    assert.ok(until(HW, () => t.state === 'done', 2000));
    const lines = talk(HW);
    assert.ok(lines.some(l => /^ives: It's yours now, love, to set out again whenever you like\. Gundry's lever puts it all back/.test(l)), lines.join('\n'));
    assert.equal(HW.G.map.id, 'underside');
    HW.warp('making9', 9, 16); HW.step(10); talk(HW);
    const toasts = () => HW.global('UI').toasts.map(t => t.s).join(' ');
    goM(HW, 5, 19); HW.face('down'); HW.press('act', 1); HW.step(5);
    assert.match(toasts(), /just as Gundry left it/, "Gundry's lever answers");
    goM(HW, 7, 14); HW.face('up'); stitchM(HW, 'RRR');
    const W = HW.G.map.find('capW');
    assert.deepEqual([W.tx, W.ty], [10, 2], 'the Needle moves it');
    assert.deepEqual([...HW.Inv.stitches].map(s => s.area + ':' + s.key + '>' + s.to.join()), ['making9:capW>10,2'], 'and keeps that one stitch');
    goM(HW, 7, 19); HW.face('down'); HW.press('act', 1); HW.step(5);
    assert.ok(HW.G.map.find('tuck'), 'in he comes again');
    /* a second go: the line isn't said again */
    const t2 = HW.G.map.find('tuck');
    assert.ok(until(HW, () => t2.state === 'done', 2500));
    assert.ok(!talk(HW).some(l => /to set out again whenever you like/.test(l)), 'once');
    noErrors(HW);
});

/* ================= Options > Grip ================= */
const SR = { heart: [20, 0], uheart: [20, 33] };
const sat = (room, x, y) => [SR[room][0] + x, SR[room][1] + y];
const sgo = (HW, room, x, y) => assert.ok(HW.walkTo(...sat(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const sthing = (HW, id) => HW.G.map.find(id);
const where = (HW, id) => { const e = sthing(HW, id); return [e.tx, e.ty]; };
function spoolGame() {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 30;
    HW.Inv.giveTool('needle');
    return HW;
}
function hatch(HW, room, x, y, dir) { sgo(HW, room, x, y); HW.face(dir); HW.press('act', 1); HW.step(40); }
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function sstitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
const knockCore = HW => { const t = HW.G.map.ents.find(e => e.kind === 'tangle'), hp = t.hp; for (let k = 0; k < 8 && t.alive && t.hp === hp; k++) { strike(HW, 'up'); HW.step(6); } };
function tangleGame() {
    const HW = spoolGame();
    HW.G.cheats.god = true;
    HW.warp('spoolworks', ...sat('heart', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    HW.walkTo(...sat('heart', 6, 7)); HW.step(5); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    assert.equal(t.state, 'whole');
    return [HW, t];
}
/* the Tangle's first two beats, as in tests/spoolworks.test.mjs */
function toLastBeat(HW, t) {
    const B = id => sthing(HW, id);
    until(HW, () => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(B(id)) && !B(id).mv), 300);
    HW.walkTo(...sat('heart', 8, 2)); HW.face('right'); sstitch(HW, 'UL'); until(HW, () => HW.Return.isHome(B('tbN')), 60);
    sgo(HW, 'heart', 6, 4); HW.face('down'); sstitch(HW, 'LL'); until(HW, () => HW.Return.isHome(B('tbW')), 60);
    sgo(HW, 'heart', 12, 4); HW.face('down'); sstitch(HW, 'RR'); until(HW, () => HW.Return.isHome(B('tbE')), 60);
    sgo(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25);
    hatch(HW, 'heart', 2, 7, 'down');
    sgo(HW, 'uheart', 9, 7); HW.face('down'); knot(HW);
    hatch(HW, 'uheart', 2, 7, 'down');
    assert.ok(until(HW, () => t.state === 'open', 300), 'it comes apart');
    sgo(HW, 'heart', 9, 6); knockCore(HW); HW.skipTalk(); HW.step(5);
    hatch(HW, 'heart', 2, 7, 'down');
    sgo(HW, 'uheart', 1, 7); HW.push('up', 1); HW.step(5);
    assert.ok(until(HW, () => t.state === 'down', 120), 'down it comes');
    hatch(HW, 'uheart', 2, 7, 'down');
    sgo(HW, 'heart', 9, 6); knockCore(HW); HW.skipTalk(); HW.step(5);
    assert.equal(t.state, 'haul', 'the last beat');
}
const setGrip = (HW, mode) => { HW.global('Settings').grip = mode; };

test('Options > Grip: hold, as ever, or toggle; kept with the settings', () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab5', x: 5, y: 5, noAutosave: true }); HW.step(5);
    const O = HW.global('Options'), S = HW.global('Settings');
    assert.equal(S.grip, 'hold', 'hold to start with');
    const row = O.rows().find(r => r[0] === 'Grip');
    assert.ok(row, 'a Grip row in Options');
    assert.equal(row[1](), 'hold');
    row[2](1);
    assert.equal(row[1](), 'toggle');
    S.save();
    assert.equal(JSON.parse(HW._store.get('hollowell-settings')).grip, 'toggle', 'saved');
    S.grip = 'hold'; S.load();
    assert.equal(S.grip, 'toggle', 'and loaded again');
    row[2](-1);
    assert.equal(S.grip, 'hold');
    noErrors(HW);
});

test("the grip on toggle: a tap takes hold and Action can be let go; walking back pulls; the Tangle's last beat is a tap, a walk and the Bell, never two buttons at once; a tap lets go", () => {
    const [HW, t] = tangleGame();
    setGrip(HW, 'toggle');
    toLastBeat(HW, t);
    const p = HW.player(), S = sthing(HW, 'tbS');
    until(HW, () => t.haulT === 0 && sthing(HW, 'tbN').ret.state !== 'home', 400);
    sgo(HW, 'heart', 10, 8); HW.face('left');
    HW.press('act', 1); HW.step(20);
    assert.equal(p.grip, S, 'a tap, and a grip that stays with Action let go');
    HW.hold('right'); until(HW, () => p.tx === sat('heart', 11, 8)[0] && !S.mv, 60); HW.release(); HW.step(2);
    assert.deepEqual(where(HW, 'tbS'), sat('heart', 10, 8), 'pulled off its place by walking back, and held');
    assert.equal(p.grip, S);
    until(HW, () => t.haulT === 2, 200);
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.ok(until(HW, () => t.state === 'open', 90), 'the Bell with the grip held: it comes apart');
    assert.equal(p.grip, S, 'still held');
    HW.press('act', 1); HW.step(2);
    assert.equal(p.grip, null, 'a tap lets go');
    HW.step(10);
    assert.equal(p.grip, null, 'and nothing takes hold again by itself');
    noErrors(HW);
});

test("the grip on toggle, the Tangle's cords: one whipped along her line knocks her off her grip (she's struck); one along another line doesn't", () => {
    for (const mine of [false, true]) {
        const [HW, t] = tangleGame();
        setGrip(HW, 'toggle'); HW.G.cheats.god = false;
        t.ballT = 9999; t.lashT = 9999;       /* (only its cords across the hall) */
        const p = HW.player();
        /* the east bobbin from beside it on the Tangle's own row (hers, then), or the south one from off its row and column */
        if (mine) { sgo(HW, 'heart', 11, 5); HW.face('right'); } else { sgo(HW, 'heart', 10, 8); HW.face('left'); }
        until(HW, () => !HW.G.map.ents.some(e => e.kind === 'hazard'), 200);
        HW.press('act', 1); HW.step(2);
        const b = sthing(HW, mine ? 'tbE' : 'tbS');
        assert.equal(p.grip, b, 'held');
        t.sweepT = 1;
        const blows = () => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === t);
        assert.ok(until(HW, () => blows().some(h => h.shape === 'tiles'), 30), 'a cord whipped across the hall');
        const line = blows().find(h => h.shape === 'tiles');
        assert.equal(line.covers(p.x, p.y), mine, mine ? 'along her line' : 'along another');
        const hp = HW.Inv.hp;
        for (let i = 0; i < 120 && !line.removed; i++) { HW.step(1); if (!line.landed && !mine) assert.equal(p.grip, b, 'held while it comes'); }
        if (mine) { assert.ok(HW.Inv.hp < hp, 'struck'); assert.equal(p.grip, null, 'knocked off the grip'); }
        else { assert.equal(HW.Inv.hp, hp, 'untouched'); assert.equal(p.grip, b, 'still held'); }
        noErrors(HW);
    }
});

test('a hold on something not in front to grip, as the grip goes: held while Action is down; on toggle, a tap on and the next tap off, never the tap that closed the last words or just let go of something else', () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab5', x: 5, y: 5, noAutosave: true }); HW.step(5);
    const gs = HW.global('gripSteps'), G = HW.G, I = HW.Input;
    const frame = (btns, fn) => { I.virt = {}; for (const b of btns) I.virt[b] = true; I.update(); G.t++; return fn(); };
    setGrip(HW, 'hold');
    let n = 0;
    for (let i = 0; i < 5; i++) n = frame(['act'], () => gs(n));
    assert.equal(n, 5, 'held: counted');
    n = frame([], () => gs(n));
    assert.equal(n, 0, 'let go');
    setGrip(HW, 'toggle');
    n = 0;
    n = frame(['act'], () => gs(n, true));
    assert.ok(n >= 8, 'a tap: hold at once');
    for (let i = 0; i < 30; i++) n = frame([], () => gs(n, true));
    assert.ok(n > 30, 'held with Action up');
    n = frame([], () => gs(n, true)); n = frame(['act'], () => gs(n, true));
    assert.equal(n, 0, 'the next tap lets go');
    n = frame([], () => gs(n, true)); n = frame(['act'], () => gs(n, false));
    assert.equal(n, 0, 'nothing to hold: a tap takes nothing');
    n = frame([], () => 0); n = frame(['act'], () => gs(0, true, G.t));
    assert.equal(n, 0, 'not the tap on the step it began');
    HW.player().tapSpent = G.t + 2;
    n = frame([], () => 0); n = frame(['act'], () => gs(0, true));
    assert.equal(n, 0, 'nor one that just let go of something');
    noErrors(HW);
});

/* the Hall of Names, with the grip on toggle: down the Way Down from the end of the Makings, Tuck's spool, and the ledger,
   talked through until Gran pulls (as tests/play_clues.test.mjs does) */
function toHall(HW) {
    const D = HW.Dialog;
    const talkUntil = fn => { for (let i = 0; i < 40000 && !fn(); i++) { if (D.active && D.shown >= D.pageLen()) { if (D.choices) D.sel = 0; HW.press('act', 1); } else HW.step(1); } return fn(); };
    assert.ok(HW.walkTo(57, 8)); HW.hold('down'); HW.step(30); HW.release(); HW.step(40); HW.skipTalk();
    assert.equal(HW.G.map.id, 'deep');
    assert.ok(HW.walkTo(9, 7)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.walkTo(37, 4)); HW.face('up'); HW.press('act', 1);
    assert.ok(talkUntil(() => HW.global('Reveal2').taut && !D.active && HW.global('Script').blocking()), 'Gran pulls');
}

test("the grip on toggle in the Hall of Names: the tap that closed the last words doesn't take hold; a tap does, and Action can be let go while Gran waits; the next tap lets go, and she's pulled home", () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    setGrip(HW, 'toggle');
    toHall(HW);
    const p = HW.player(), lect = HW.G.map.ents.find(e => e.kind === 'ledger');
    HW.face('up');       /* (facing the lectern, as she was when she read it) */
    HW.step(10);
    assert.ok(!p.grip && !HW.Progress.flag('hall_held'), 'not held yet');
    HW.press('act', 1); HW.step(600);
    assert.equal(p.grip, lect, 'a tap: holding the lectern, Action let go');
    assert.ok(!HW.Progress.flag('reveal2') && HW.G.map.id === 'deep', 'still in the Hall');
    HW.press('act', 1); HW.step(2);
    assert.ok(!p.grip, 'the next tap lets go');
    for (let i = 0; i < 60 && !HW.Progress.flag('reveal2'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('reveal2'), 'pulled home');
    noErrors(HW);
});

/* the end, at the top of the Great Spool, with the grip on toggle */
const TOP = [20, 0], tat = (x, y) => [TOP[0] + x, TOP[1] + y];
const HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const settle = HW => { for (let i = 0; i < 12; i++) { HW.step(5); HW.skipTalk(); } };
const post = (HW, h) => HW.G.map.ents.find(e => e.kind === 'greatpost' && e.house === h);
function atTop() {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36;
    for (const h of HOUSES) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    HW.warp('greatspool', 29, 11); HW.step(30); HW.skipTalk();
    HW.walkTo(29, 10); HW.hold('up'); HW.step(60); HW.release(); HW.step(10);
    settle(HW);
    return HW;
}
const tgo = (HW, x, y) => { for (let k = 0; k < 5 && !HW.walkTo(...tat(x, y)); k++) { HW.step(20); HW.skipTalk(); } assert.deepEqual([HW.player().tx, HW.player().ty], tat(x, y), `walk to ${x},${y}`); };

test("the grip on toggle at the end: a tap takes Gran's hand (the words say tap), Action can be let go and she's still held; a tap lets go and it waits; held, she tries twice and lets go", () => {
    const HW = atTop();
    setGrip(HW, 'toggle');
    for (const h of ['slumber', 'marionette']) slackAndCut(HW, post(HW, h), TOP); settle(HW);
    for (const h of ['mill', 'belfry']) junkAndCut(HW, post(HW, h)); settle(HW);
    for (const h of ['tidy', 'kiln']) darkAndCut(HW, post(HW, h));
    for (let i = 0; i < 4000 && !HW.G.map.climax; i++) { HW.skipTalk(); HW.step(1); }
    const a = HW.G.map, c = a.climax;
    assert.ok(c, 'Linnet has one of her hands');
    const g = a.ents.find(e => e.who === 'gran'), l = c.linnet, p = HW.player(), s = l.tx < g.tx ? 1 : -1;
    tgo(HW, g.tx + s - TOP[0], g.ty - TOP[1]); HW.face(s > 0 ? 'left' : 'right'); HW.step(2);
    assert.ok(HW.global('UI').toasts.some(t => /^Tap .* to take her hand\./.test(t.s)), 'how: a tap');
    HW.press('act', 1); HW.step(30);
    assert.equal(p.grip, g, 'her hand in yours, Action let go');
    HW.press('act', 1); HW.step(30);
    assert.ok(!p.grip && a.climax && a.climax.h === 0, 'a tap lets go: it waits');
    HW.press('act', 1);
    let tugs = 0; const sfx = HW.global('Sfx'), play0 = sfx.play; sfx.play = function (n, ...r) { if (n === 'tug') tugs++; return play0.call(this, n, ...r); };
    HW.step(200);
    assert.equal(tugs, 2, 'she tries twice');
    for (let i = 0; i < 200 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('unwound'), 'she let go: the Unwinding');
    noErrors(HW);
});
