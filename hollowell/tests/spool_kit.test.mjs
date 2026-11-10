// The seventh tool's kit (src/65_spool_kit.js) in its lab room: two layers, cords, tugs, knots, hatches, a
// counterweight; the Needle's stitches (three at a time, a fourth undoes the oldest), unpicking, strays, and
// stitches kept when the place is built afresh.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const UP_ = (x, y) => [x, y], DN = (x, y) => [x, y + 11];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function lab() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab7', x: 2, y: 2, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar', 'needle']) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 20;
    HW.step(5);
    return HW;
}
const thing = (HW, id) => HW.G.map.find(id);
const cordOf = (HW, id) => HW.G.map.ents.find(e => e.kind === 'cord' && e.thing.id === id);
const tug = HW => { HW.press('act', 1); HW.step(3); };
/* by the hatch, up and down (a warp would build the place afresh) */
function down(HW) { go(HW, 2, 7); HW.face('down'); HW.press('act', 1); HW.step(40); assert.equal(HW.player().ty, 18, 'down the hatch'); }
function up(HW) { go(HW, 2, 18); HW.face('down'); HW.press('act', 1); HW.step(40); assert.equal(HW.player().ty, 7, 'up the hatch'); }
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function stitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}

test('down the hatch: up above shows through; a cord hangs under every mark', () => {
    const HW = lab();
    go(HW, ...UP_(2, 7)); HW.face('down'); HW.press('act', 1); HW.step(40);
    assert.deepEqual([HW.player().tx, HW.player().ty], DN(2, 7), 'down below');
    for (const id of ['kA', 'kB', 'kC']) assert.ok(cordOf(HW, id), 'a cord for ' + id);
    assert.equal(cordOf(HW, 'kS'), undefined, 'not for a stray');
    const c = cordOf(HW, 'kA');
    assert.deepEqual([c.tx, c.ty], DN(4, 3), "under the block's mark");
    HW.face('down'); HW.press('act', 1); HW.step(40);
    assert.deepEqual([HW.player().tx, HW.player().ty], [2, 7], 'and up again');
    noErrors(HW);
});

test('a tug on the cord snaps its thing home from wherever it is; at home, it jumps', () => {
    const HW = lab();
    const a = thing(HW, 'kA');
    go(HW, 3, 3); HW.push('right', 1); HW.step(5);
    assert.deepEqual([a.tx, a.ty], [5, 3], 'pushed off its mark');
    a.ret.patience = 9999; a.ret.timer = 9999;    /* (it would wait a while yet) */
    down(HW); go(HW, ...DN(4, 4));
    HW.face('up'); tug(HW);
    until(HW, () => HW.Return.isHome(a), 60);
    assert.deepEqual([a.tx, a.ty], [4, 3], 'home at once');
    tug(HW);
    assert.ok(a.jolt > 0, 'a jolt');
    noErrors(HW);
});

test('hold the cord and it is tied off: up above, the thing holds where it is; undo the knot and it goes home', () => {
    const HW = lab();
    const b = thing(HW, 'kB'), gate = () => HW.global('Signals').get(HW.G.map, 'lp');
    b.ret.timer = 900;    /* (time to get down there) */
    down(HW); go(HW, ...DN(8, 2)); HW.face('down');
    knot(HW);
    assert.ok(b.knotted, 'tied off');
    HW.step(400);
    assert.deepEqual([b.tx, b.ty], [8, 5], 'still on the plate, long after its patience');
    assert.ok(gate(), 'the plate stays down');
    /* up above it won't be budged */
    up(HW); go(HW, 8, 6);
    HW.push('up', 1); HW.step(10);
    assert.deepEqual([b.tx, b.ty], [8, 5], 'no pushing it');
    down(HW); go(HW, ...DN(8, 2)); HW.face('down');
    HW.press('act', 1); HW.step(3);
    assert.ok(!b.knotted, 'untied');
    until(HW, () => HW.Return.isHome(b), 400);
    assert.deepEqual([b.tx, b.ty], [8, 3], 'and home it goes');
    noErrors(HW);
});

test('a counterweight off its plate down below opens the gate up above, until it goes home', () => {
    const HW = lab();
    const g = thing(HW, 'cwGate'), w = thing(HW, 'cwWeight');
    HW.step(3);
    assert.ok(!g.open, 'shut while the weight sits');
    down(HW); go(HW, ...DN(11, 5));
    HW.push('right', 1); HW.step(10);
    assert.deepEqual([w.tx, w.ty], DN(13, 5));
    HW.step(10);
    assert.ok(g.open, 'open');
    until(HW, () => HW.Return.isHome(w), 600); HW.step(10);
    assert.ok(!g.open, 'shut again');
    noErrors(HW);
});

test('the Needle: a new place, up to four tiles off; it goes there and stays; unpicked, it goes back', () => {
    const HW = lab();
    const c = thing(HW, 'kC');
    go(HW, 10, 7); HW.face('right');
    stitch(HW, 'RRU');
    until(HW, () => HW.Return.isHome(c), 120);
    assert.deepEqual([c.tx, c.ty], [13, 6], 'at its new place');
    assert.deepEqual([c.ret.mx, c.ret.my], [13, 6], 'and that is its mark now');
    assert.equal(HW.Inv.stitches.length, 1);
    /* pushed off, it comes back to the new place */
    go(HW, 12, 6); HW.push('right', 1); HW.step(20); go(HW, 11, 5);
    assert.deepEqual([c.tx, c.ty], [14, 6]);
    until(HW, () => HW.Return.isHome(c), 400);
    assert.deepEqual([c.tx, c.ty], [13, 6]);
    /* and kept when the place is built afresh */
    HW.warp('lab6', 3, 3); HW.step(5); HW.warp('lab7', 2, 2); HW.step(5);
    const c2 = thing(HW, 'kC');
    assert.deepEqual([c2.tx, c2.ty], [13, 6], 'still there after coming back');
    /* unpick: its old place back */
    go(HW, 12, 6); HW.face('right');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    HW.skipTalk(1);    /* "Unpick it" is the second answer */
    until(HW, () => HW.Return.isHome(c2) && c2.tx === 11, 400);
    assert.deepEqual([c2.tx, c2.ty], [11, 7], 'back where it was');
    assert.equal(HW.Inv.stitches.length, 0);
    noErrors(HW);
});

test('the Needle holds three stitches: a fourth undoes the oldest; a stray can be given a place', () => {
    const HW = lab();
    const A = thing(HW, 'kA'), C = thing(HW, 'kC'), S = thing(HW, 'kS');
    go(HW, 4, 4); HW.face('up'); stitch(HW, 'L'); until(HW, () => HW.Return.isHome(A), 60);
    assert.deepEqual([A.tx, A.ty], [3, 3]);
    go(HW, 10, 7); HW.face('right'); stitch(HW, 'D'); until(HW, () => HW.Return.isHome(C), 60);
    go(HW, 4, 8); HW.face('right'); stitch(HW, 'UU');
    until(HW, () => HW.Return.isHome(S), 60);
    assert.ok(S.ret, 'the stray has a mark now');
    assert.deepEqual([S.tx, S.ty], [5, 6]);
    HW.step(30);
    assert.equal(HW.Inv.stitches.length, 3);
    /* the fourth */
    HW.G.map.find('kB').ret.timer = 0; until(HW, () => HW.Return.isHome(HW.G.map.find('kB')), 200);
    go(HW, 9, 3); HW.face('left'); HW.step(2);
    go(HW, 8, 2); HW.face('down'); stitch(HW, 'R');
    assert.equal(HW.Inv.stitches.length, 3, 'still three');
    const said = HW.global('UI').toasts.map(t => t.s).find(s => /oldest/.test(s)) || '';
    assert.match(said, /your oldest lets go: the wooden block here goes back to its old place/, 'it says plainly which thing let go: ' + said);
    until(HW, () => HW.Return.isHome(A) && A.tx === 4, 300);
    assert.deepEqual([A.tx, A.ty], [4, 3], 'the oldest stitch came undone: back to its old place');
    noErrors(HW);
});

test('from underneath, the Needle goes through a cord into the thing above', () => {
    const HW = lab();
    const c = thing(HW, 'kC');
    down(HW); go(HW, ...DN(11, 8)); HW.face('up');
    stitch(HW, 'LL');
    until(HW, () => HW.Return.isHome(c), 120);
    assert.deepEqual([c.tx, c.ty], [9, 7], 'moved up above');
    const cord = HW.G.map.ents.find(e => e.kind === 'cord' && e.thing === c); HW.step(2);
    assert.deepEqual([cord.tx, cord.ty], DN(9, 7), 'and its cord with it');
    noErrors(HW);
});
