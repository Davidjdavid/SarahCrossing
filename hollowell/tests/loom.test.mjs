// The Loom (House 8): every room's solution: offcuts (strays) into pits, the Shuttle jammed, the old weights cut free
// and dropped through silk, the Larder (a ring, a block, a cut), the Warp Walk (the Needle, the Hookline, a cut), the
// Weaver brought down in three beats; and the Loomwood's gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { th: [20, 33], wh: [20, 22], oy: [0, 22], sr: [20, 11], sp: [0, 11], wr: [40, 22], br: [40, 11], web: [20, 0], hg: [40, 33], lr: [60, 22], ww: [60, 11] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
const snip = HW => { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
function game(shears) {
    const HW = loadGame();
    HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2');
    if (shears) HW.Inv.giveTool('shears');
    HW.Inv.maxHp = HW.Inv.hp = 36;
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('loom', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const pushAt = (HW, room, x, y, dir, n) => { go(HW, room, x, y); HW.push(dir, n); HW.step(25); };
const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
const tool = (HW, t, d) => { if (d) HW.face(d); HW.Inv.equipped = t; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
/* (bound in the Weaver's silk, the first snip frees her: walk in short goes, snipping free between) */
const free = HW => { if (HW.player().pinned === 'silk') { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(2); } };
const wgo = (HW, room, x, y) => { for (let k = 0; k < 40; k++) { free(HW); if (HW.walkTo(...at(room, x, y), 30)) return; } assert.fail(`walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`); };

test('the Loomwood: through the north gate, up the road to the Loom', () => {
    const HW = game();
    HW.warp('hollow', 96, 44); HW.step(10);
    assert.ok(HW.walkTo(95, 10, 30000), 'to the door of the Loom');
    HW.hold('up'); until(HW, () => HW.G.map.id === 'loom', 120); HW.release(); HW.step(20); HW.skipTalk();
    assert.equal(HW.G.map.id, 'loom');
    const H2 = loadGame(); H2.preset('afterReveal2'); H2.step(10); H2.skipTalk();
    H2.warp('hollow', 96, 44); H2.step(10);
    assert.equal(H2.walkTo(96, 30, 30000), false, 'shut until its counterweight is moved');
    noErrors(HW);
});

test('the Threshold: two offcuts into the pit, one on the other, and across', () => {
    const HW = game();
    enter(HW, 'th', 9, 9);
    pushAt(HW, 'th', 5, 8, 'up', 2);
    assert.ok(!HW.G.map.kind(...at('th', 5, 5)).pit, 'one filled');
    pushAt(HW, 'th', 13, 7, 'left', 7);
    pushAt(HW, 'th', 5, 8, 'up', 3);
    assert.ok(!HW.G.map.kind(...at('th', 5, 4)).pit, 'two filled');
    go(HW, 'th', 9, 1);
    noErrors(HW);
});

test('the Offcut Yard: three offcuts up one column of pits to the key', () => {
    const HW = game();
    enter(HW, 'oy', 18, 5);
    pushAt(HW, 'oy', 7, 6, 'left', 4); pushAt(HW, 'oy', 2, 7, 'up', 1);
    pushAt(HW, 'oy', 8, 3, 'down', 2); pushAt(HW, 'oy', 9, 6, 'left', 6); pushAt(HW, 'oy', 2, 7, 'up', 2);
    pushAt(HW, 'oy', 5, 9, 'up', 2); pushAt(HW, 'oy', 6, 6, 'left', 3); pushAt(HW, 'oy', 2, 7, 'up', 3);
    go(HW, 'oy', 1, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('loom'), 1, 'the key');
    noErrors(HW);
});

test('the Shuttle Run: an offcut in its lane jams it; knock it while it is jammed (2x): the Shears', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'sr', 9, 9); HW.skipTalk();
    const s = HW.G.map.ents.find(e => e.kind === 'shuttle');
    assert.notEqual(s.state, 'sleep');
    assert.equal(s.hp, 2, 'two knocks');
    go(HW, 'sr', 8, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    go(HW, 'sr', 9, 8); HW.push('up', 2); HW.step(10);
    let rounds = 0;
    for (let round = 0; round < 3 && s.alive; round++) {
        rounds++;
        assert.ok(until(HW, () => s.state === 'stuck', 600), `round ${round + 1}: jammed`);
        HW.walkTo(...at('sr', (s.x >> 4) - 20, 6)) || HW.walkTo(...at('sr', (s.x >> 4) - 19, 6));
        const hp = s.hp;
        for (let k = 0; k < 6 && s.hp === hp && s.state === 'stuck'; k++) strike(HW, 'up');
        if (!s.alive) break;
        HW.step(20);
        /* the offcut, knocked out of the lane: back in with it */
        const b = HW.G.map.ents.find(e => e.kind === 'block' && !e.removed && HW.G.map.roomAt(e.tx, e.ty) === s.arena);
        if (b.ty === at('sr', 0, 6)[1]) { HW.walkTo(b.tx, b.ty + 1); HW.push('up', 1); }
        else if (b.ty === at('sr', 0, 4)[1]) { HW.walkTo(b.tx, b.ty - 1); HW.push('down', 1); }
        HW.step(10);
    }
    assert.ok(!s.alive, 'the Shuttle splits');
    assert.equal(rounds, 2, 'in two knocks');
    HW.step(30); HW.skipTalk(); HW.step(10);
    go(HW, 'sr', 9, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('shears'), 'the Shears');
    /* and the silk to the west: the Spinner's Room */
    go(HW, 'sr', 1, 5); HW.face('left'); snip(HW);
    go(HW, 'sp', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    noErrors(HW);
});

test('the Weighing Room: cut the old weights free and fill the chasm (key)', () => {
    const HW = game(true);
    enter(HW, 'wh', 17, 5);
    go(HW, 'wh', 18, 5); HW.face('right'); snip(HW);
    go(HW, 'wr', 4, 5); HW.face('right'); snip(HW);
    HW.push('right', 3); HW.step(30);
    assert.ok(!HW.G.map.kind(...at('wr', 8, 5)).pit, 'one');
    go(HW, 'wr', 4, 1); HW.face('down'); snip(HW); HW.push('down', 3); HW.step(30);
    pushAt(HW, 'wr', 3, 5, 'right', 5);
    assert.ok(!HW.G.map.kind(...at('wr', 9, 5)).pit, 'two');
    go(HW, 'wr', 4, 9); HW.face('up'); snip(HW); HW.push('up', 3); HW.step(30);
    pushAt(HW, 'wr', 3, 5, 'right', 6);
    assert.ok(!HW.G.map.kind(...at('wr', 10, 5)).pit, 'three');
    /* the key's down in the Hanging Gallery now */
    go(HW, 'hg', 16, 2); HW.face('right'); HW.press('act', 1); HW.step(2);
    go(HW, 'hg', 12, 3); HW.face('down'); snip(HW);
    go(HW, 'hg', 9, 7); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('loom'), 1, 'the key');
    noErrors(HW);
});

test('the Hanging Gallery: a slack thread slides off; a tight one is cut anywhere and its weight drops into the trench; missed, the lever sets them out again', () => {
    const HW = game(true);
    HW.warp('loom', ...at('hg', 14, 1)); HW.step(20); HW.skipTalk();
    const w1 = thing(HW, 'hgW1'), w2 = thing(HW, 'hgW2');
    /* tied out over the trench: slack, and nothing to hook across by */
    go(HW, 'hg', 12, 3); HW.face('down'); snip(HW);
    assert.ok(w1.ret && w2.ret, 'slack: not cut');
    HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().ty, at('hg', 0, 3)[1], 'the hook finds nothing to pull Wren over by');
    /* let go, and missed: they come home on the far side; the lever pulled back sets them out again */
    go(HW, 'hg', 16, 2); HW.face('right'); HW.press('act', 1);
    until(HW, () => w1.ret.state === 'home' && w2.ret.state === 'home', 900);
    assert.deepEqual([w1.tx, w1.ty], at('hg', 17, 8), 'home on the far side');
    HW.press('act', 1); HW.step(2);
    assert.deepEqual([w1.tx, w1.ty], at('hg', 3, 4), 'set out again');
    /* again, and cut on the way: down it goes, a way over */
    HW.press('act', 1); HW.step(2);
    go(HW, 'hg', 13, 3); HW.face('down');
    until(HW, () => w1.tx >= at('hg', 6, 0)[0], 300); snip(HW);
    assert.ok(w1.removed, 'dropped');
    const x = w1.tx;
    assert.ok(!HW.G.map.kind(x, at('hg', 0, 4)[1]).pit && x < at('hg', 13, 0)[0], 'filled where it hung, not where it was cut');
    assert.ok(HW.walkTo(x, at('hg', 0, 6)[1]), 'over');
    noErrors(HW);
});

test('the Bridge Room (in from the Warp Walk): a weight cut free breaks the silk and fills the gap; the other across onto the plate (the Pattern); its south gate open for good after', () => {
    const HW = game(true);
    enter(HW, 'br', 18, 5);
    assert.ok(!thing(HW, 'brLock').open, 'the way down to the weights shut');
    go(HW, 'br', 12, 5); go(HW, 'br', 6, 5);
    go(HW, 'br', 3, 3); HW.face('right'); snip(HW);
    pushAt(HW, 'br', 4, 2, 'down', 2);
    pushAt(HW, 'br', 3, 5, 'right', 5);
    assert.ok(!HW.G.map.kind(...at('br', 9, 5)).pit, 'the gap filled, for good');
    pushAt(HW, 'br', 4, 8, 'up', 2);
    pushAt(HW, 'br', 3, 5, 'right', 10);
    assert.deepEqual([thing(HW, 'brW2').tx, thing(HW, 'brW2').ty], at('br', 14, 5), 'on the plate');
    HW.step(5);
    go(HW, 'br', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('loom'));
    until(HW, () => thing(HW, 'brW2').ret.state === 'home', 900);
    assert.ok(thing(HW, 'brLock').open, 'the south gate stays open once the plate has been held');
    go(HW, 'wr', 15, 1);
    noErrors(HW);
});

test('the Larder: rung from anywhere, the sleeper goes home over the gap and back (leave, and it lies down again); from the turn of its thread, the post at your back, it waits over the gap, pulled tight: cut, it fills the gap', () => {
    const HW = game(true);
    HW.Inv.keyCount.loom = 1;
    enter(HW, 'wr', 16, 5);
    go(HW, 'wr', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Larder', 'through the east lock (the Hanging Gallery\'s key)');
    const a = HW.G.map, W1 = thing(HW, 'lrW1'), W2 = thing(HW, 'lrW2');
    assert.ok(W1.sleeper && W1.tiedOff && W2.sleeper, 'wrapped, asleep');
    assert.equal(HW.walkTo(...at('lr', 13, 7)), false, 'the gap');
    /* a ring from the middle of the floor: both home in a flash, the one over the gap and back again */
    go(HW, 'lr', 9, 5); tool(HW, 'bell'); HW.step(80);
    assert.deepEqual([W1.tx, W1.ty], at('lr', 13, 1), 'home on the far side');
    assert.ok(a.kind(...at('lr', 11, 7)).pit && a.kind(...at('lr', 11, 3)).pit, 'nothing filled');
    assert.ok(thing(HW, 'lrGate').open, 'the other one home on its plate: the gate opens (and stays)');
    go(HW, 'wr', 17, 5); go(HW, 'lr', 2, 5); HW.step(5);
    assert.ok(W1.sleeper && W1.tiedOff, 'laid down again while you were out');
    assert.deepEqual([W1.tx, W1.ty], at('lr', 14, 7));
    /* the turn of its thread, the warping post behind: it can't shove you, so it waits over the gap */
    go(HW, 'lr', 10, 7); tool(HW, 'bell', 'right'); HW.step(40);
    assert.deepEqual([W1.tx, W1.ty], at('lr', 11, 7), 'waiting over the gap');
    assert.equal(W1.ret.state, 'returning');
    assert.deepEqual([HW.player().tx, HW.player().ty], at('lr', 10, 7), 'not shoved');
    tool(HW, 'shears', 'right');
    assert.ok(W1.removed && !a.kind(...at('lr', 11, 7)).pit, 'cut: it drops where it hangs, and fills the gap');
    go(HW, 'lr', 16, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Warp Walk');
    noErrors(HW);
});

test('the Warp Walk: the hook sets you down in front of the weight, in the gap; given a place further along the walk (the Needle), it lands you on the walk; cut, it fills the last gap', () => {
    const HW = game(true);
    enter(HW, 'ww', 16, 9);
    const a = HW.G.map, W = thing(HW, 'wwW');
    go(HW, 'ww', 9, 5); tool(HW, 'hook', 'left'); HW.step(80); HW.skipTalk(); HW.step(10);
    assert.deepEqual([HW.player().tx, HW.player().ty], at('ww', 16, 9), 'down the gap and back to the doorway');
    /* the Needle reaches over the gap; a new place three along the walk */
    go(HW, 'ww', 9, 5); HW.face('left'); stitch('LLL');
    assert.deepEqual([W.tx, W.ty], at('ww', 4, 5), 'its new place');
    tool(HW, 'hook', 'left'); HW.step(60);
    assert.deepEqual([HW.player().tx, HW.player().ty], at('ww', 5, 5), 'on the walk');
    /* pushed while it still has a place, it only goes home there; cut, it stays where it's pushed, and fills the gap */
    tool(HW, 'shears', 'left');
    assert.ok(!W.ret, 'a stray');
    HW.push('left', 3); HW.step(30);
    assert.ok(!a.kind(...at('ww', 1, 5)).pit, 'the last gap filled');
    go(HW, 'ww', 2, 5); HW.hold('left'); HW.step(40); HW.release(); HW.step(20);
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Bridge Room');
    noErrors(HW);
});

/* the Web's fight, beat by beat (each beat's own rule tested on its own below) */
const webGame = () => { const HW = game(true); HW.Inv.giveTool('hook'); HW.G.cheats.god = true; enter(HW, 'web', 9, 9); HW.skipTalk(); return [HW, HW.G.map.ents.find(e => e.kind === 'weaver')]; };
const beat1 = (HW, w) => {
    for (const [x, y, f] of [[4, 4, 'right'], [4, 7, 'right'], [15, 7, 'left'], [15, 4, 'left']]) { wgo(HW, 'web', x, y); free(HW); HW.face(f); snip(HW); }
    assert.ok(until(HW, () => w.state === 'down', 300), 'down into the well');
    wgo(HW, 'web', 8, 6); for (let k = 0; k < 8 && w.hp === 3; k++) { free(HW); strike(HW, 'right'); }
    assert.equal(w.hp, 2, 'knocked once');
    for (let i = 0; i < 4; i++) { HW.step(10); HW.skipTalk(); }
};
/* (2) it drops on you and climbs home up the well: cut its thread ahead of it while it's over the well */
const beat2 = (HW, w) => {
    wgo(HW, 'web', 8, 7);
    assert.ok(until(HW, () => w.state === 'aim', 900), 'it picks its spot');
    wgo(HW, 'web', 8, 5); HW.face('right');
    assert.ok(until(HW, () => w.state === 'home' && w.x === at('web', 10, 0)[0] * 16 && w.y < 112, 400), 'hauling itself home up the well');
    free(HW); HW.face('right'); snip(HW);
    assert.ok(until(HW, () => w.state === 'down', 120), 'cut over the well: it drops in');
    wgo(HW, 'web', 8, Math.min(8, Math.max(3, w.y >> 4))); for (let k = 0; k < 8 && w.hp === 2; k++) { free(HW); strike(HW, 'right'); }
    assert.equal(w.hp, 1, 'knocked twice');
    for (let i = 0; i < 4; i++) { HW.step(10); HW.skipTalk(); }
};
/* (3) it won't come down: hook it down its well; cut it at the thing while it hangs there */
const beat3 = (HW, w) => {
    wgo(HW, 'web', 9, 9);
    assert.ok(until(HW, () => w.state === 'perch', 600), 'up on the breast-beam');
    free(HW); tool(HW, 'hook', 'up');
    assert.ok(until(HW, () => w.state === 'hung', 120), 'hauled down the well toward you');
    free(HW); HW.face('up'); snip(HW);
    assert.ok(until(HW, () => w.state === 'down', 120), 'cut while it hangs over the well: it drops in');
    for (let k = 0; k < 8 && w.alive; k++) { free(HW); strike(HW, 'up'); }
};

test('the Web: four anchors cut at their posts; then its own thread cut while it climbs home over the well; then hooked down the well and cut: the Weaver', () => {
    const [HW, w] = webGame();
    assert.notEqual(w.state, 'sleep');
    const t0 = HW.G.t;
    beat1(HW, w); beat2(HW, w); beat3(HW, w);
    assert.ok(!w.alive, 'the Weaver');
    assert.ok(HW.G.t - t0 < 60 * 45, 'well under a minute, walking included: ' + (HW.G.t - t0));
    for (let i = 0; i < 20 && !HW.Progress.flag('d8'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('d8'));
    const heart = thing(HW, 'loomHeart');
    assert.ok(heart && !HW.G.map.kind(heart.x >> 4, heart.y >> 4).pit, 'its Heartstitch where it can be picked up');
    /* the place built again: the heap of silk in the well, no Weaver */
    HW.warp('loom', ...at('sr', 9, 5)); HW.step(10); HW.warp('loom', ...at('web', 9, 9)); HW.step(10);
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'weaver') && HW.G.map.ents.some(e => e.kind === 'weaverheap'));
    noErrors(HW);
});

test('the Web, beat 1: caught in its silk while bound, it tightens; the posts cut, it drops into its well (and climbs back and ties in again if left)', () => {
    const [HW, w] = webGame();
    HW.G.cheats.god = false;
    const hp = HW.Inv.hp;
    HW.step(1200);
    assert.ok(HW.Inv.hp < hp, 'standing about in its silk hurts');
    for (const n of w.anchors()) n.onCut();
    assert.ok(until(HW, () => w.state === 'down', 120));
    assert.ok(HW.G.map.kind(w.x >> 4, w.y >> 4).pit, 'in the well');
    assert.ok(until(HW, () => w.state === 'web', 600), 'not knocked: back up into its web');
    assert.ok(w.anchors().every(n => !n.cut), 'tied in again');
    noErrors(HW);
});

test('the Web, beat 2: no anchors now; its thread slides off the blades while it lies slack; cut over the stone it lands on its feet', () => {
    const [HW, w] = webGame();
    beat1(HW, w);
    assert.ok(until(HW, () => w.state === 'perch', 600), 'up on the breast-beam');
    assert.ok(w.anchors().every(n => n.cut), 'the posts stay bare');
    wgo(HW, 'web', 4, 5); HW.face('right'); snip(HW);
    assert.equal(w.hp, 2, 'a bare post: nothing to cut');
    /* it comes down on you; crouched where it landed, its thread lies slack along the floor */
    wgo(HW, 'web', 13, 9);
    assert.ok(until(HW, () => w.state === 'aim', 900)); wgo(HW, 'web', 13, 7);
    assert.ok(until(HW, () => w.state === 'bottom', 200));
    wgo(HW, 'web', 11, 8); HW.face('right'); snip(HW);
    assert.equal(w.state, 'bottom', 'slack: it slides off');
    /* climbing home, pulled tight, but not yet over the well: cut, it lands on its feet and runs back up */
    assert.ok(until(HW, () => w.state === 'home', 200));
    wgo(HW, 'web', 11, 9); HW.face('up');
    assert.ok(w.threadOver(...at('web', 11, 9 - 1)) || w.covers(...at('web', 11, 8)), 'its thread runs over the tile in front');
    free(HW); HW.face('up'); snip(HW);
    assert.ok(['land', 'scurry'].includes(w.state), 'it lands on its feet: ' + w.state);
    assert.ok(until(HW, () => w.state === 'perch', 300), 'and runs straight back up');
    assert.equal(w.hp, 2);
    noErrors(HW);
});

test('the Web, beat 3: it stays up, out of reach; the Hookline hauls it down its own well; left alone, it climbs home', () => {
    const [HW, w] = webGame();
    beat1(HW, w); beat2(HW, w);
    assert.ok(w.well().bare, 'the warp hauled up out of the well');
    wgo(HW, 'web', 9, 9);
    assert.ok(until(HW, () => w.state === 'perch', 600));
    HW.step(400);
    assert.equal(w.state, 'perch', "it won't come down");
    free(HW); tool(HW, 'hook', 'up');
    assert.ok(until(HW, () => w.state === 'hung', 120));
    assert.ok(HW.G.map.kind(w.x >> 4, w.y >> 4).pit, 'hanging low over the well');
    assert.ok(until(HW, () => w.state === 'home', 200), 'it climbs home');
    assert.ok(until(HW, () => w.state === 'perch', 400));
    beat3(HW, w);
    assert.ok(!w.alive);
    noErrors(HW);
});
