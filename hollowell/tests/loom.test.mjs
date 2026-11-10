// The Loom (House 8): every room's solution: offcuts (strays) into pits, the Shuttle jammed, the old weights cut free
// and dropped through silk, the Weaver brought down; and the Loomwood's gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { th: [20, 33], wh: [20, 22], oy: [0, 22], sr: [20, 11], sp: [0, 11], wr: [40, 22], br: [40, 11], web: [20, 0], hg: [40, 33] };
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

test('the Shuttle Run: an offcut in its lane jams it; knock it while it is jammed (3x): the Shears', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'sr', 9, 9); HW.skipTalk();
    const s = HW.G.map.ents.find(e => e.kind === 'shuttle');
    assert.notEqual(s.state, 'sleep');
    go(HW, 'sr', 8, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    go(HW, 'sr', 9, 8); HW.push('up', 2); HW.step(10);
    for (let round = 0; round < 3 && s.alive; round++) {
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

test('the Bridge Room: a weight cut free breaks the silk and fills the gap; the other across onto the plate (the Pattern)', () => {
    const HW = game(true);
    HW.Inv.keyCount.loom = 1;
    enter(HW, 'wr', 15, 1);
    go(HW, 'wr', 15, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30);
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
    noErrors(HW);
});

test('the Web: cut the four anchors (and the silk that binds you); it drops into its loom; knock it (3x)', () => {
    const HW = game(true);
    HW.G.cheats.god = true;
    enter(HW, 'web', 9, 9); HW.walkTo(...at('web', 9, 7)); HW.step(5); HW.skipTalk();
    const w = HW.G.map.ents.find(e => e.kind === 'weaver');
    assert.equal(w.state, 'aloft');
    const free = () => { if (HW.player().pinned === 'silk') { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(2); } };
    for (let round = 0; round < 3 && w.alive; round++) {
        until(HW, () => w.state === 'aloft', 400);
        for (const [x, y, f] of [[3, 2, 'left'], [16, 2, 'right'], [3, 8, 'left'], [16, 8, 'right']]) {
            for (let k = 0; k < 4; k++) { free(); if (HW.walkTo(...at('web', x, y))) break; HW.step(5); }
            free(); HW.face(f); snip(HW);
        }
        assert.ok(until(HW, () => w.state === 'down', 200), `round ${round + 1}: down it comes`);
        for (let k = 0; k < 6; k++) { free(); if (HW.walkTo(...at('web', 9, 4), 120)) break; }
        const hp = w.hp;
        for (let k = 0; k < 8 && w.hp === hp && w.state === 'down'; k++) { free(); strike(HW, 'down'); }
        HW.step(10);
    }
    assert.ok(!w.alive, 'the Weaver');
    for (let i = 0; i < 20 && !HW.Progress.flag('d8'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('d8'));
    noErrors(HW);
});
