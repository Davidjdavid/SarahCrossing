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
    HW.Progress.set('loom_open');                         /* (the warp across its door: tests/loomwood.test.mjs) */
    HW.warp('hollow', 96, 44); HW.step(10);
    assert.ok(HW.walkTo(95, 10, 30000), 'to the door of the Loom');
    HW.hold('up'); until(HW, () => HW.G.map.id === 'loom', 120); HW.release(); HW.step(20); HW.skipTalk();
    assert.equal(HW.G.map.id, 'loom');
    const H2 = loadGame(); H2.preset('afterReveal2'); H2.step(10); H2.skipTalk();
    H2.warp('hollow', 96, 44); H2.step(10);
    assert.equal(H2.walkTo(96, 30, 30000), false, 'shut until its counterweight is moved');
    noErrors(HW);
});

test('the Threshold: every offcut lies across the trench; the Hookline brings one over and it drops into the hole in front of her; the lever by the door drops another across the way; one on the other, and across (the Plan)', () => {
    const HW = game();
    enter(HW, 'th', 9, 9);
    const a = HW.G.map, room = a.roomAt(...at('th', 9, 9));
    assert.ok(!a.ents.some(e => e.isGrid && e.kind === 'block' && !e.removed && a.roomAt(e.tx, e.ty) === room && e.ty > at('th', 0, 5)[1]), 'nothing this side to push');
    assert.ok(['thOff1', 'thOff2'].every(id => thing(HW, id).weight === 2), "middling: a line brings them, it doesn't take her to them");
    /* hooked over: it hangs on the line over the trench, and where the line lets go of it, over the hole, it drops in */
    go(HW, 'th', 4, 6); tool(HW, 'hook', 'up'); HW.step(60);
    assert.ok(!a.kind(...at('th', 4, 5)).pit, 'it dropped into the hole in front of her');
    go(HW, 'th', 4, 5); tool(HW, 'hook', 'up'); HW.step(60);
    assert.ok(a.kind(...at('th', 4, 4)).pit, 'nothing more across in that line');
    /* the lever by the door: another offcut drops from the chute across the way */
    go(HW, 'th', 2, 8); HW.face('up'); HW.press('act', 1); HW.step(20); HW.skipTalk();
    assert.ok(a.at(...at('th', 4, 2)) && !a.at(...at('th', 4, 2)).ret, 'an offcut across the way');
    go(HW, 'th', 4, 5); tool(HW, 'hook', 'up'); HW.step(60);
    assert.ok(!a.kind(...at('th', 4, 4)).pit, 'the next one in, from the first');
    go(HW, 'th', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('loom'), 'the Plan');
    go(HW, 'th', 9, 1);
    noErrors(HW);
});

test('the Snag: an old weight caught on its way home by a strand of silk; whatever falls goes home at once, so pushed round into the hole it pops up on its plate under the peg, and the plate opens the gate to the key (a ring, its empty mark and pulling it about change nothing)', () => {
    const HW = game();
    enter(HW, 'oy', 18, 5);
    const w = thing(HW, 'oyW'), gate = thing(HW, 'oyGate');
    HW.step(200);
    assert.deepEqual([w.tx, w.ty], at('oy', 13, 5), 'caught at the silk');
    assert.ok(w.ret.state === 'returning' && w.ret.strain > 0, 'straining to get by');
    /* rung, it comes on fast till the silk stops it: caught, it waits like the rest (and can still be moved) */
    go(HW, 'oy', 15, 7); tool(HW, 'bell'); HW.step(60);
    assert.ok(!w.ret.snap && w.tx === at('oy', 13, 5)[0], 'caught again');
    /* its empty mark: the line sets her down on the plate, which doesn't feel a girl; off it, she falls back */
    go(HW, 'oy', 9, 6); tool(HW, 'hook', 'up'); HW.step(60);
    assert.deepEqual([HW.player().tx, HW.player().ty], at('oy', 9, 2), 'on the plate');
    assert.ok(!gate.open, 'the gate stays shut');
    HW.hold('down'); HW.step(40); HW.release(); HW.step(60); HW.skipTalk();
    /* pushed off, it only comes back to wait at the silk */
    go(HW, 'oy', 13, 6); HW.push('up', 1);
    assert.ok(until(HW, () => w.tx === at('oy', 13, 5)[0] && w.ty === at('oy', 13, 5)[1] && !w.mv && w.ret.state === 'returning', 400), 'back at the silk');
    /* round to the hole and in: home at once, on its plate */
    go(HW, 'oy', 13, 6); HW.push('up', 1);
    go(HW, 'oy', 14, 4); HW.push('left', 2); HW.step(30);
    assert.deepEqual([w.tx, w.ty], at('oy', 9, 2), 'home');
    assert.ok(until(HW, () => gate.open, 30), 'the gate opens');
    go(HW, 'oy', 2, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('loom'), 1, 'the key');
    noErrors(HW);
});

test("the Loom rebuilt: an older save keeps the holes it filled that are holes still and forgets those that are walls now; one that took the Offcut Yard's key finds the Snag done; the Threshold it crossed stays crossed", () => {
    const HW = game();
    /* what such a save holds: the old Threshold crossed by two offcuts, the old Offcut Yard's pits filled and its key taken */
    for (const [k, v] of [['gone:thStray1', true], ['gone:thStray2', true], [`fill:${at('th', 5, 5).join(',')}`, true], [`fill:${at('th', 5, 4).join(',')}`, true],
        ['gone:oyS1', true], ['gone:oyS2', true], [`fill:${at('oy', 1, 5).join(',')}`, true], [`fill:${at('oy', 1, 4).join(',')}`, true], [`fill:${at('oy', 1, 3).join(',')}`, true], ['chest:oyKey', true]]) HW.Progress.setAreaFlag('loom', k, v);
    HW.Inv.keyCount.loom = 1;
    enter(HW, 'oy', 18, 5);
    const a = HW.G.map;
    assert.equal(a.kindName(...at('oy', 1, 4)), 'wall', 'a wall now: not carved out of it');
    assert.ok(!HW.Progress.areaFlag('loom', `fill:${at('oy', 1, 4).join(',')}`), 'forgotten');
    assert.equal(thing(HW, 'oyW').ret.state, 'home', 'its weight home');
    HW.step(2);
    assert.ok(thing(HW, 'oyGate').open, 'the gate open');
    assert.ok(!a.kind(...at('th', 5, 5)).pit && !a.kind(...at('th', 5, 4)).pit, 'the Threshold still crossed');
    go(HW, 'th', 5, 2); go(HW, 'th', 5, 7);
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

test('the Weighing Room: the old weights hang over the chasm on their threads; pushed in uncut one only goes home; cut, one drops where it hangs and fills the hole under it; one brought out on to the edge, cut and pushed in, and the two hanging in its row cut from it, each from the last: across (then the Hanging Gallery, the key)', () => {
    const HW = game(true);
    enter(HW, 'wh', 17, 5);
    go(HW, 'wh', 18, 5); HW.face('right'); snip(HW);
    const a = HW.G.map, H = n => thing(HW, 'wrH' + n), pit = (x, y) => !!a.kind(...at('wr', x, y)).pit;
    assert.ok([1, 2, 3, 4, 5].every(n => H(n).ret.state === 'home' && a.kind(H(n).tx, H(n).ty).pit), 'hanging at home over the chasm');
    assert.ok(!a.ents.some(e => e.look === 'loomweight' && !e.removed && a.roomAt(e.tx, e.ty) === a.roomAt(...at('wr', 4, 5)) && !a.kind(e.tx, e.ty).pit), 'none on the floor to push in');
    /* pushed in uncut, it falls, and is home at once: hanging where it hung */
    go(HW, 'wr', 7, 2); HW.push('right', 1); HW.step(30);
    assert.deepEqual([H(1).tx, H(1).ty], at('wr', 8, 2), 'home again');
    /* cut where it hangs: it drops, and fills the hole under it */
    const h1 = H(1);
    HW.face('right'); snip(HW);
    assert.ok(h1.removed && !pit(8, 2), 'dropped where it hung');
    /* the row with two: one more brought out of the chasm on to the edge (the Gloves), a step along, cut, and pushed in */
    const h2 = H(2);
    go(HW, 'wr', 7, 6); HW.face('right'); HW.hold('act'); HW.step(4); HW.hold(['act', 'left']);
    until(HW, () => h2.tx === at('wr', 7, 6)[0], 40); until(HW, () => !h2.mv, 30); HW.release(); HW.step(2);
    pushAt(HW, 'wr', 7, 5, 'down', 1);
    go(HW, 'wr', 6, 7); HW.face('right'); snip(HW);
    assert.ok(!h2.ret, 'cut on the edge');
    HW.push('right', 1); HW.step(20);
    assert.ok(!pit(8, 7), 'in');
    go(HW, 'wr', 8, 7); HW.face('right'); snip(HW); HW.step(10);
    go(HW, 'wr', 9, 7); HW.face('right'); snip(HW); HW.step(10);
    assert.ok(!pit(9, 7) && !pit(10, 7), 'each from the last');
    go(HW, 'wr', 12, 7);
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

test('the Bridge Room (in from the Warp Walk): the one weight is wedged in its nook, past a strand of silk; no hand shifts it, and the Needle won\'t set it on the silk; stitched past the strand it tears through, hanging on its thread, and lands across; onto the plate and cut there (the Pattern); its south gate open for good after', () => {
    const HW = game(true);
    HW.Inv.giveTool('needle');
    enter(HW, 'br', 18, 5);
    assert.ok(!thing(HW, 'brLock').open, 'the way down shut');
    const w = thing(HW, 'brW3'), a = HW.G.map;
    /* hands: from the strand itself (silk holds a girl), it won't be pushed or pulled */
    go(HW, 'br', 10, 2); go(HW, 'br', 9, 2); HW.push('left', 1); HW.step(5);
    HW.face('left'); HW.hold('act'); HW.step(4); HW.hold(['act', 'right']); HW.step(30); HW.release(); HW.step(5);
    assert.deepEqual([w.tx, w.ty], at('br', 8, 2), 'wedged');
    /* the Needle won't give iron a place on the silk */
    go(HW, 'br', 11, 2); HW.face('left'); stitch(HW, 'R');
    assert.equal(HW.Inv.stitches.length, 0, 'no stitch onto the silk');
    HW.press('act', 1); HW.step(5);
    /* past it: the strand tears under the weight, which hangs on its thread across and lands */
    go(HW, 'br', 12, 2); HW.face('left'); stitch(HW, 'RRR');
    assert.deepEqual([w.tx, w.ty], at('br', 11, 2), 'across');
    assert.ok(thing(HW, 'brNook').gone && a.kind(...at('br', 9, 2)).pit, 'the strand torn');
    /* onto the plate, and cut there: a stray for good */
    go(HW, 'br', 10, 2); HW.push('right', 1); HW.step(10); go(HW, 'br', 11, 2); HW.face('right'); snip(HW);
    assert.deepEqual([w.tx, w.ty], at('br', 12, 2), 'on the plate');
    assert.ok(!w.ret, 'cut free');
    go(HW, 'br', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('loom'));
    HW.step(600);
    assert.ok(thing(HW, 'brLock').open && thing(HW, 'brWest').open, 'both ways open, for good');
    go(HW, 'wr', 15, 1);
    noErrors(HW);
});

test("the Bridge Room's iron through silk, as it looks: the strand parts the moment the weight comes on to it, the weight hangs there in the gap on its thread a moment (said, once) and then goes on to its place; the sign says what silk does under iron", () => {
    const HW = game(true);
    HW.Inv.giveTool('needle');
    enter(HW, 'br', 18, 5);
    const w = thing(HW, 'brW3'), a = HW.G.map, said = s => HW.global('UI').toasts.some(t => t.s.includes(s));
    const sign = a.ents.find(e => e.kind === 'sign' && a.roomAt(e.tx, e.ty) === a.roomAt(...at('br', 9, 5)));
    assert.match(sign.text, /under iron, it parts/, 'the sign');
    go(HW, 'br', 12, 2); HW.face('left');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (let k = 0; k < 3; k++) { HW.hold('right'); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1);
    assert.ok(until(HW, () => thing(HW, 'brNook').gone, 30), 'the strand parts');
    assert.deepEqual([w.tx, w.ty], at('br', 9, 2), 'as the weight comes on to it');
    HW.step(4);
    assert.ok(a.kind(...at('br', 9, 2)).pit && !w.removed && w.ret && [w.tx, w.ty].join() === at('br', 9, 2).join(), 'hanging there over the gap on its thread');
    assert.ok(said('the silk parts'), 'said what happened');
    HW.step(40);
    assert.deepEqual([w.tx, w.ty], at('br', 11, 2), 'then on to its place');
    noErrors(HW);
});

test('the Bridge Room: the strand cut first, the weight is stranded till an offcut fills the gap; the nook\'s chute only drops a spare into an empty nook', () => {
    const HW = game(true);
    HW.Inv.giveTool('needle');
    enter(HW, 'br', 18, 5);
    const w = thing(HW, 'brW3'), a = HW.G.map;
    go(HW, 'br', 10, 2); HW.face('left'); snip(HW);
    assert.ok(thing(HW, 'brNook').gone, 'the strand cut');
    go(HW, 'br', 12, 2); HW.face('left'); stitch(HW, 'RRR');
    assert.deepEqual([w.tx, w.ty], at('br', 8, 2), 'no stitch over a hole');
    HW.press('act', 1); HW.step(5);
    go(HW, 'br', 14, 1); HW.face('left'); HW.press('act', 1); HW.step(10); HW.skipTalk();
    go(HW, 'br', 14, 2); HW.push('left', 4); HW.step(20);
    assert.ok(!a.kind(...at('br', 9, 2)).pit, 'an offcut fills it');
    go(HW, 'br', 12, 2); HW.face('left'); stitch(HW, 'RRR');
    assert.deepEqual([w.tx, w.ty], at('br', 11, 2), 'stitched over');
    /* over the old crossing, to the chute in the nook's ceiling: the nook is empty now, so a spare drops in, wedged too */
    go(HW, 'br', 7, 1); HW.face('right'); HW.press('act', 1); HW.step(10); HW.skipTalk();
    const sp = a.at(...at('br', 8, 2));
    assert.ok(sp && sp.weight === 3 && sp.noPull, 'a spare, wedged in the nook');
    noErrors(HW);
});

test('the Bridge Room: an older save, made before the room was rebuilt, that had spent its two old weights (one dropped in the gap, one cut and left on the old plate, the Pattern not yet taken) loads into the new room and still finishes it', () => {
    const HW = game(true);
    HW.Inv.giveTool('needle');
    /* what such a save holds: brW1 and brW2 were the room's old weights (gone from it now), the gap at the old crossing filled */
    for (const [k, v] of [['gone:brW1', true], ['cut:brW2', at('br', 14, 5).join(',')], [`fill:${at('br', 9, 5).join(',')}`, true]]) HW.Progress.setAreaFlag('loom', k, v);
    enter(HW, 'br', 18, 5);
    const a = HW.G.map, br = a.roomAt(...at('br', 9, 5));
    assert.ok(!a.find('brW1') && !a.find('brW2'), 'the old weights are nowhere');
    assert.ok(!a.at(...at('br', 14, 5)), 'nothing left on the old plate\'s spot');
    assert.equal(a.ents.filter(e => e.look === 'loomweight' && !e.removed && a.roomAt(e.tx, e.ty) === br).length, 1, 'the one weight: the new, wedged one');
    assert.ok(!a.kind(...at('br', 9, 5)).pit, 'the old crossing stays filled');
    assert.ok(!thing(HW, 'brPattern') || thing(HW, 'brPattern').hidden, 'no Pattern yet');
    go(HW, 'br', 12, 2); HW.face('left'); stitch(HW, 'RRR');
    go(HW, 'br', 10, 2); HW.push('right', 1); HW.step(10); go(HW, 'br', 11, 2); HW.face('right'); snip(HW);
    go(HW, 'br', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('loom'));
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
    assert.deepEqual([W1.tx, W1.ty], at('lr', 15, 1), 'home on the far side');
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
    go(HW, 'lr', 13, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Warp Walk');
    noErrors(HW);
});

test('the Warp Walk: the hook sets you down in front of the weight, in the gap; given a place further along the walk (the Needle), it lands you on the walk; cut, it fills the last gap', () => {
    const HW = game(true);
    enter(HW, 'ww', 13, 9);
    const a = HW.G.map, W = thing(HW, 'wwW');
    go(HW, 'ww', 9, 5); tool(HW, 'hook', 'left'); HW.step(80); HW.skipTalk(); HW.step(10);
    assert.deepEqual([HW.player().tx, HW.player().ty], at('ww', 13, 9), 'down the gap and back to the doorway');
    /* the Needle reaches over the gap; a new place three along the walk */
    go(HW, 'ww', 9, 5); HW.face('left'); stitch(HW, 'LLL');
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
/* (1) one of its anchors, cut its own way: walk up, get free of any silk, do what it wants first, snip (again if the silk
   caught her in between) */
const anchor = (HW, id, x, y, dir, first) => {
    const n = thing(HW, id);
    for (let k = 0; k < 12 && !n.cut; k++) { wgo(HW, 'web', x, y); free(HW); if (first) first(n); free(HW); HW.face(dir); snip(HW); }
    assert.ok(n.cut, id + ' cut');
};
/* the plain one at its post; the cocoon rung awake first; the one up into the loom from the well's rim, where it comes
   down over the well's head; the long one while the Weaver's reared back away from Wren, pulling it tight */
const anchors = (HW, w) => {
    anchor(HW, 'anC', 4, 7, 'right');
    anchor(HW, 'anA', 4, 4, 'right', n => { if (n.sleeping) tool(HW, 'bell'); });
    anchor(HW, 'anB', 8, 3, 'right');
    anchor(HW, 'anD', 15, 7, 'left', n => until(HW, () => n.taut(w) && HW.player().pinned !== 'silk', 300));
};
const beat1 = (HW, w) => {
    anchors(HW, w);
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

test('the Web: four anchors, each cut its own way; then its own thread cut while it climbs home over the well; then hooked down the well and cut: the Weaver', () => {
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
    assert.ok(HW.G.map.ents.filter(e => e.kind === 'anchor').every(n => n.cut && !n.sleeping), 'its anchors left in tatters');
    noErrors(HW);
});

/* its blows, each with its tell, each dodged (or not): the beats reached with them harmless, then real */
const wvBlows = (HW, w) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === w);
test("the Weaver's warp: the column Wren's in lit, a thread thrumming down it, then it snaps; a step to the side and it misses (a heart and a half if not)", () => {
    for (const dodge of [true, false]) {
        const [HW, w] = webGame(); HW.G.cheats.god = false;
        const p = HW.player();
        w.rear = () => { };                         /* (no silk just now: the warp on its own) */
        wgo(HW, 'web', 3, 8); HW.global('calmBlows')(w); w.warpT = 1; w.puff = 0; w.st = 1;
        assert.ok(until(HW, () => wvBlows(HW, w).length > 0, 10), 'a column lit');
        const h = wvBlows(HW, w)[0];
        assert.ok(h.tiles.every(([x]) => x === p.tx) && h.tell >= 24, "Wren's column, with time to move");
        w.shots = [];
        const hp = HW.Inv.hp;
        if (dodge) { free(HW); HW.hold('right'); HW.step(18); HW.release(); assert.ok(!h.covers(p.x, p.y), 'a column over'); }
        assert.ok(until(HW, () => h.removed, 80), 'it snapped'); w.shots = [];
        if (dodge) assert.equal(HW.Inv.hp, hp, 'missed');
        else assert.equal(HW.Inv.hp, hp - 3, 'snapped across her');
        noErrors(HW);
    }
});
test("the Weaver's silk: it rears back, its belly aglow, before it spits; a step aside as it comes (bound again while bound, a heart and a half)", () => {
    for (const dodge of [true, false]) {
        const [HW, w] = webGame(); HW.G.cheats.god = false;
        const p = HW.player();
        /* (from rest: no spit begun nor warp thread lit while she walked over, to go where she was or knock her aside) */
        wgo(HW, 'web', 3, 8); HW.global('calmBlows')(w); w.puff = 0; w.shots = []; w.warpT = 9999; w.st = 19;
        assert.ok(until(HW, () => w.puff > 0, 10), 'it rears back');
        assert.ok(until(HW, () => w.shots.length > 0, 40), 'and spits');
        w.rear = () => { };                         /* (just the one) */
        if (dodge) { HW.hold('right'); HW.step(36); HW.release(); HW.step(70); }
        else { HW.step(110); }
        if (dodge) assert.notEqual(p.pinned, 'silk', 'it flew past');
        else assert.equal(p.pinned, 'silk', 'bound');
        noErrors(HW);
    }
});
test("the Weaver's drop (beat 2): its shadow grows where Wren stands; out from under it, or two hearts", () => {
    for (const dodge of [true, false]) {
        const [HW, w] = webGame();
        beat1(HW, w); HW.G.cheats.god = false;
        const p = HW.player();
        w.rear = () => { };                         /* (no silk just now: the drop on its own) */
        wgo(HW, 'web', 4, 8); w.warpT = 9999;
        assert.ok(until(HW, () => w.state === 'aim', 900), 'it picks its spot');
        free(HW); w.shots = []; w.puff = 0;
        const [gx, gy] = w.target;
        wgo(HW, 'web', (gx >> 4) - R.web[0], (gy >> 4) - R.web[1]);     /* (the shadow's where she stood: she's back on it) */
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold(gx > 160 + R.web[0] * 16 ? 'left' : 'right'); HW.step(30); HW.release(); }
        assert.ok(until(HW, () => w.state === 'bottom', 200), 'it drops');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'missed');
        else assert.equal(HW.Inv.hp, hp - 4, 'landed on her');
        noErrors(HW);
    }
});
test('the Web, beat 3: silk moths shaken down out of the web; beaten like any, and gone when the Weaver is', () => {
    const [HW, w] = webGame();
    beat1(HW, w); beat2(HW, w);
    w.mothT = 1; w.warpT = 9999;
    assert.ok(until(HW, () => HW.G.map.ents.some(e => e.weaverMoth), 200), 'moths');
    beat3(HW, w);
    assert.ok(!w.alive, 'the Weaver');
    assert.ok(!HW.G.map.ents.some(e => e.weaverMoth), 'its moths gone with it');
    noErrors(HW);
});
test("the Shuttle: waiting at its end, its lane is lit wall to wall; out of the lane when it flies (a heart and a half if not)", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        enter(HW, 'sr', 9, 9); HW.skipTalk();
        const s = HW.G.map.ents.find(e => e.kind === 'shuttle'), p = HW.player();
        go(HW, 'sr', 9, 7);
        assert.ok(until(HW, () => s.state === 'wait' && s.st === 2, 300), 'it waits at its end');
        HW.hold('up'); HW.step(24); HW.release();
        const lit = HW.G.map.ents.find(e => e.kind === 'hazard' && e.owner === s);
        assert.ok(lit && lit.covers(p.x, p.y), 'Wren in its lit lane');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(24); HW.release(); assert.ok(!lit.covers(p.x, p.y), 'out of it'); }
        assert.ok(until(HW, () => s.state === 'wait' && s.st === 2, 300), 'it flew the lane');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'missed');
        else assert.equal(HW.Inv.hp, hp - 3, 'struck');
        noErrors(HW);
    }
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
    assert.ok(thing(HW, 'anA').sleeping && !thing(HW, 'anD').taut(w), 'as they were: the cocoon wound up asleep again, the long one slack');
    noErrors(HW);
});

/* (1) each anchor's wrong idea fails and says how the world went; its own way cuts it */
test("the Web, beat 1: four anchors read four ways: the long one slides off till the Weaver rears back away and pulls it tight; the cocoon sleeps till a bell; the one up in the loom is out of reach but where it comes down over the well's head; the plain one cuts at its post", () => {
    const [HW, w] = webGame();
    const A = id => thing(HW, id), said = s => HW.global('UI').toasts.some(t => t.s.includes(s)), p = HW.player();
    const settle = () => until(HW, () => p.pinned !== 'silk' && w.puff === 0 && !A('anD').taut(w), 400);
    assert.equal(w.anchors().map(n => n.way).sort().join(), 'asleep,loom,plain,slack');
    /* the long one: slack, it slides off the blades; rearing back to spit, the Weaver swings away from her and it's pulled tight */
    wgo(HW, 'web', 15, 7); free(HW); settle();
    HW.face('left'); snip(HW);
    assert.ok(!A('anD').cut && said('slides off the blades'), 'slack: it slides off');
    assert.ok(until(HW, () => A('anD').taut(w), 200), 'pulled tight');
    assert.ok(w.puff > 0 && w.sx < 0, "as it rears back, swung away from her (she's to the east)");
    HW.face('left'); snip(HW);
    assert.ok(A('anD').cut, 'cut while it was tight');
    /* the cocoon: asleep, the blades can't find the thread; the stick only says it's asleep; rung from too far off it sleeps on */
    wgo(HW, 'web', 4, 4); free(HW); HW.face('right'); snip(HW);
    assert.ok(!A('anA').cut && said("can't find the thread"), 'asleep: the blades find nothing');
    free(HW); strike(HW, 'right');
    assert.ok(said('fast asleep') && A('anA').sleeping, 'the stick: asleep, and it stays so');
    wgo(HW, 'web', 17, 8); free(HW); tool(HW, 'bell'); HW.step(10);
    assert.ok(A('anA').sleeping, "rung from across the hall, out of a bell's reach: still asleep");
    wgo(HW, 'web', 4, 5); free(HW); tool(HW, 'bell'); HW.step(10);
    assert.ok(!A('anA').sleeping, 'rung within reach: woken, its silk unwound');
    wgo(HW, 'web', 4, 4); free(HW); HW.face('right'); snip(HW);
    assert.ok(A('anA').cut, 'its knot bare: cut');
    /* the one up into the loom: its knot out of reach; where it comes down over the well's head, from the rim, it cuts */
    wgo(HW, 'web', 8, 3); free(HW); HW.face('up'); snip(HW);
    assert.ok(!A('anB').cut && said("out of the blades' reach"), 'tied up on the loom: out of reach');
    free(HW); HW.face('right'); snip(HW);
    assert.ok(A('anB').cut, 'cut over the well, anywhere along it');
    /* the plain one: at its post */
    assert.ok(!['anA', 'anB', 'anD'].some(id => !A(id).cut) && w.state === 'web', 'three cut, still up');
    wgo(HW, 'web', 4, 7); free(HW); HW.face('right'); snip(HW);
    assert.ok(A('anC').cut, 'cut at its post');
    assert.ok(until(HW, () => w.state === 'down', 120) && HW.G.map.kind(w.x >> 4, w.y >> 4).pit, 'down into its well');
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
    wgo(HW, 'web', 13, 7);
    assert.ok(until(HW, () => w.state === 'aim', 900));
    wgo(HW, 'web', 11, 8); HW.face('up');
    assert.ok(until(HW, () => w.state === 'bottom', 200));
    assert.ok(w.threadOver(...at('web', 11, 7)), 'its thread lies along the floor in front of her');
    free(HW); HW.face('up'); snip(HW);
    assert.equal(w.state, 'bottom', 'slack: it slides off');
    /* climbing home, pulled tight, but not yet over the well: cut, it lands on its feet and runs back up */
    assert.ok(until(HW, () => w.state === 'home', 200));
    HW.step(4); free(HW); HW.face('up'); snip(HW);
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

test('old saves: one that spent its key on the Bridge Room\'s old lock keeps that way open; and the Needle won\'t give iron a place on silk', () => {
    const HW = game(true);
    HW.Inv.giveTool('needle');
    HW.Progress.setAreaFlag('loom', 'door:brLock', true);
    enter(HW, 'wr', 16, 5);
    assert.ok(thing(HW, 'brLock').open, 'open, as it was');
    go(HW, 'wr', 15, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Bridge Room');
    /* a weight by the silk bridge: stitched onto the silk, it's refused (the needle stays out, to go somewhere else) */
    const a = HW.G.map, Block = HW.global('Block'), N = HW.global('Needle');
    const w = a.add(new Block(...at('br', 7, 5), { weight: 3, look: 'loomweight', patience: 150, id: 'tW' }));
    go(HW, 'br', 6, 5); HW.face('right'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (let k = 0; k < 2; k++) { HW.hold('right'); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(5);
    assert.equal(HW.Inv.stitches.length, 0, 'no stitch');
    assert.ok(N.st && !thing(HW, 'brBridge').gone, 'still stitching; the silk whole');
    assert.deepEqual([w.tx, w.ty], at('br', 7, 5));
    HW.press('act', 1); HW.step(5);
    assert.ok(!N.st, 'put away');
    noErrors(HW);
});
