// The Makings (src/68_makings.js, src/68b_makings_more.js): Tuck's Little Wander, eight Little Houses run from
// underneath. Tuck walks by his own rules; from the sixth on Otto comes too, as the Housekeeper, by his. Wren tugs, ties
// off and stitches from below. Each Little House played through for all three Ahas, and the ways each goes wrong.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const tug = HW => { HW.press('act', 1); HW.step(3); };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
function making(n, preset = 'afterD7') {
    const HW = loadGame();
    HW.preset(preset); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = [];
    for (let i = 1; i < n; i++) HW.Progress.set('making' + i);
    const e = HW.global('MAKINGS')[n - 1].entry || { x: 3, y: 16 };
    HW.warp('making' + n, e.x, e.y); HW.step(10); HW.skipTalk();
    return HW;
}
const tuck = HW => HW.G.map.find('tuck');
const otto = HW => HW.G.map.find('otto');
const ahas = HW => [...HW.global('Making').cur.ahas].sort();
const bumps = HW => HW.global('Making').cur.bumps;
/* stand under a mark (dy 11 below) on the given side, facing it */
function under(HW, x, y, side = 'down') {
    const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side];
    go(HW, x + dx, y + 11 + dy); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]);
}
function finish(HW, n) {
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'done', 2500), `Tuck reaches the hoop (he's at ${t.tx},${t.ty}, ${t.state})`);
    const got = ahas(HW);
    for (let i = 0; i < 20 && HW.G.map.id !== 'underside'; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('making' + n), 'done');
    assert.equal(HW.G.map.id, 'underside', 'back on the Making Floor');
    for (let i = 0; i < 20 && (HW.global('Dialog').active || HW.global('Script').blocking()); i++) { HW.skipTalk(); HW.step(10); }
    return got;
}

/* ================= 1 to 4 ================= */
test('Tuck by himself: goes for the door, and stuck, sits as near it as he can', () => {
    const HW = making(1);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 600));
    assert.deepEqual([t.tx, t.ty], [10, 6], 'by the block in the doorway');
    /* a tug on his own thread: back to the start */
    under(HW, 3, 5, 'down'); HW.press('act', 1); HW.step(5);
    assert.deepEqual([t.tx, t.ty], [3, 5], 'Wheee!');
    noErrors(HW);
});

test('Making 1 (the Little Tidyhouse): the button under the pot; the block out of the doorway; the block onto the plate, tied off', () => {
    const HW = making(1);
    const t = tuck(HW);
    under(HW, 2, 1, 'down'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 400), 'he found the button');
    assert.ok(until(HW, () => t.state === 'sit', 600));
    under(HW, 10, 5, 'down'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('cleared'), 300), 'he cleared his own way');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx > 20, 900), 'and sits by the gate next door');
    const K = HW.G.map.find('m1K');
    under(HW, 28, 6, 'down'); tug(HW);
    assert.ok(until(HW, () => K.ty === 7 && !K.mv, 400), 'he pushed it onto the plate');
    knot(HW);
    assert.ok(K.knotted, 'tied off there');
    assert.deepEqual(finish(HW, 1), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 2 (Mind the Nibbler): tie the biter up; lure him out of the heavy thing\'s way, then let it go home', () => {
    const HW = making(2);
    const t = tuck(HW);
    under(HW, 5, 8, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 400), 'the button in the nook');
    const nib = HW.G.map.find('m2Nib');
    under(HW, 10, 2, 'down'); tug(HW); HW.step(20); knot(HW);
    assert.ok(nib.knotted, 'the nibbler tied up');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 16, 900), 'by the block at the corner');
    under(HW, 16, 5, 'down'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('cleared'), 300), 'he cleared his own way');
    assert.ok(until(HW, () => t.tx >= 20 && t.state === 'sit', 1200), 'past the nest, sitting at the crossing');
    assert.deepEqual([t.tx, t.ty], [29, 5], "right in the heavy block's way");
    under(HW, 23, 3, 'down'); tug(HW);
    assert.ok(until(HW, () => t.tx <= 25, 200), 'off to see the crate');
    under(HW, 29, 9, 'up'); HW.press('act', 1); HW.step(3);
    assert.ok(!HW.G.map.find('m2H').knotted, 'let go');
    assert.deepEqual(finish(HW, 2), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 2: let the heavy thing go while he sits in its way, and he is bowled over (a bump)', () => {
    const HW = making(2);
    const t = tuck(HW);
    under(HW, 10, 2, 'down'); tug(HW); HW.step(20); knot(HW);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 16, 900));
    under(HW, 16, 5, 'down'); tug(HW);
    assert.ok(until(HW, () => t.tx === 29 && t.state === 'sit', 1200));
    under(HW, 29, 9, 'up'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => bumps(HW) === 1, 300), 'Ow!');
    assert.ok(t.tx < 10, 'back at the start');
    noErrors(HW);
});

test('Making 3 (the Little Wander): a new place for the heavy one; the biter by the plate tied up; the block onto the plate', () => {
    const HW = making(3);
    const t = tuck(HW);
    under(HW, 5, 8, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 400), 'the button');
    assert.ok(until(HW, () => t.state === 'sit', 600));
    under(HW, 10, 5, 'down'); stitch(HW, 'U');
    assert.deepEqual([HW.G.map.find('m3H').tx, HW.G.map.find('m3H').ty], [10, 4], 'the heavy one, stitched into the alcove');
    assert.ok(until(HW, () => t.tx >= 14, 400), 'through');
    const nib = HW.G.map.find('m3Nib');
    under(HW, 25, 3, 'down'); tug(HW); HW.step(20); knot(HW);
    assert.ok(nib.knotted);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx > 20, 900));
    const K = HW.G.map.find('m3K');
    under(HW, 28, 6, 'down'); tug(HW);
    assert.ok(until(HW, () => K.ty === 7 && !K.mv, 400), 'onto the plate');
    knot(HW);
    assert.deepEqual(finish(HW, 3), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 4 (the Long Sulk): he sulks on the plate, so the heavy one can go home; he holds one plate while the other\'s heavy one comes home, not over him; the block out of the passage', () => {
    const HW = making(4);
    const t = tuck(HW);
    under(HW, 2, 1, 'down'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 400), 'the button');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    assert.deepEqual([t.tx, t.ty], [10, 5], 'sulking on the plate');
    under(HW, 11, 1, 'down'); HW.press('act', 1); HW.step(3);
    assert.ok(!HW.G.map.find('m4H').knotted, 'let go');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx > 20, 1200), 'and through, to sulk next door');
    assert.deepEqual([t.tx, t.ty], [38, 5], 'on the near plate by the gate (right in the heavy one\'s way)');
    under(HW, 32, 3, 'down'); tug(HW);
    assert.ok(until(HW, () => t.tx <= 34, 300), 'off to see the crate');
    under(HW, 38, 1, 'down'); HW.press('act', 1); HW.step(3);
    const H2 = HW.G.map.find('m4H2');
    assert.ok(until(HW, () => H2.ret.state === 'home', 300), 'home on the far plate');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx > 40, 900), 'through the gate, sitting in the passage');
    under(HW, 46, 5, 'down'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('cleared'), 300), 'he cleared his own way');
    go(HW, 45, 16);
    assert.deepEqual(finish(HW, 4), ['cleared', 'found', 'unhurt']);
    assert.ok(!HW.Progress.flag('makings_done'), 'four more to go');
    noErrors(HW);
});

test('Making 4: let the far plate\'s heavy one go while he sits in its way, and he is bowled over', () => {
    const HW = making(4);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 11, 1, 'down'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 38, 1200), 'on the plate');
    under(HW, 38, 1, 'down'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => bumps(HW) === 1, 300), 'Ow!');
    assert.ok(t.tx < 10, 'back at the start');
    noErrors(HW);
});

test('every run of a Little House starts as the Makers set it out: a heavy thing untied last time is tied off again', () => {
    const HW = making(2);
    under(HW, 29, 9, 'up'); HW.press('act', 1); HW.step(3);
    assert.ok(!HW.G.map.find('m2H').knotted, 'let go');
    HW.global('PauseMenu').backToDoor(); HW.step(60);
    HW.warp('making2', 3, 16); HW.step(10); HW.skipTalk();
    const H = HW.G.map.find('m2H');
    assert.ok(H.knotted && H.ty !== 9, 'set out and tied off again');
    noErrors(HW);
});

/* ================= 5: the Tidyhouse, underneath ================= */
/* the Foyer: Tuck sits by the way west; the block jumps, he pushes it away from himself onto the plate; tied there.
   The Hall of Busts: the button pot; the block jumps, he pushes it into the bust's lane; the bust let go and tugged
   home comes down the lane through it, onto the plate, and stands in its way home. The Ballroom: the hoop. */
function solve5(HW) {
    const t = tuck(HW), a = HW.G.map;
    assert.ok(until(HW, () => t.state === 'sit', 600));
    assert.deepEqual([t.tx, t.ty], [41, 5], 'by the Foyer\'s west door');
    const F = a.find('m5F');
    under(HW, 46, 5); tug(HW);
    assert.ok(until(HW, () => F.tx === 47 && F.ret.state === 'away' && !F.mv, 400), 'he pushed the block east, onto the plate');
    knot(HW);
    assert.ok(F.knotted);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx < 40, 900), 'through, sitting by the Hall\'s west door');
    assert.deepEqual([t.tx, t.ty], [21, 5]);
    under(HW, 22, 1); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 600), 'the button under the pot');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    const K = a.find('m5K'), B = a.find('m5B');
    under(HW, 28, 5); tug(HW);
    assert.ok(until(HW, () => K.tx === 29 && K.ret.state === 'away' && !K.mv, 400), 'into the lane');
    under(HW, 29, 6); HW.press('act', 1); HW.step(3);
    assert.ok(!B.knotted, 'the bust let go');
    tug(HW);
    assert.ok(until(HW, () => B.ret.state === 'home', 200), 'tugged home, down its lane');
    assert.deepEqual([K.tx, K.ty], [29, 7], 'shoving the block before it, onto the plate');
    assert.ok(until(HW, () => t.tx < 20, 900), 'through to the Ballroom');
}
test('Making 5 (the Tidyhouse, Underneath): the Foyer, the Hall of Busts and the Ballroom, from underneath', () => {
    const HW = making(5);
    solve5(HW);
    assert.deepEqual(finish(HW, 5), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 5: made to jump while he walks in, the Foyer\'s block goes the wrong way and comes home; and no Needle in Ives\'s rooms', () => {
    const HW = making(5);
    HW.warp('making5', 46, 17); HW.face('up'); HW.step(2);
    const t = tuck(HW), F = HW.G.map.find('m5F');
    until(HW, () => t.ty <= 6, 300);
    tug(HW);
    assert.ok(until(HW, () => F.ret.state === 'away' && !F.mv, 200));
    assert.deepEqual([F.tx, F.ty], [46, 4], 'he came at it from below and pushed it north');
    assert.ok(until(HW, () => F.ret.state === 'home', 400), 'home again');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    assert.ok(!HW.global('Needle').st, 'the Needle stays on its hook');
    noErrors(HW);
});

test('Making 5: the bust let go before the block is in its lane comes home with nothing to shove; Ives\'s lever sets it out again', () => {
    const HW = making(5);
    const t = tuck(HW), a = HW.G.map, B = a.find('m5B');
    assert.ok(until(HW, () => t.state === 'sit', 600));
    under(HW, 46, 5); tug(HW); until(HW, () => a.find('m5F').tx === 47 && !a.find('m5F').mv, 400); knot(HW);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx < 40, 900));
    under(HW, 29, 6); HW.press('act', 1); HW.step(3); tug(HW);
    assert.ok(until(HW, () => B.ret.state === 'home', 200));
    assert.ok(!a.at(29, 7), 'nothing on the plate');
    go(HW, 32, 20); HW.face('right'); HW.press('act', 1); HW.step(5); HW.skipTalk();
    assert.deepEqual([B.tx, B.ty], [29, 3], 'set out up its lane again');
    assert.ok(B.knotted, 'and tied there');
    noErrors(HW);
});

test('Making 5: pushed from the lane\'s side, the block goes west, and he stands in the bust\'s lane: let the bust go then, and he is bowled over', () => {
    const HW = making(5);
    const t = tuck(HW), a = HW.G.map, K = a.find('m5K');
    /* (as if he'd come through the Foyer and stopped beside the block, east of it) */
    under(HW, 28, 5);
    a.unplace(t, t.tx, t.ty); t.mv = null; t.tx = 29; t.ty = 5; t.x = 29 * 16; t.y = 5 * 16; a.place(t, 29, 5); t.wait = 30;
    tug(HW);
    assert.ok(until(HW, () => K.ret.state === 'away' && !K.mv, 300));
    assert.deepEqual([K.tx, K.ty, t.tx, t.ty], [27, 5, 29, 5], 'pushed west, from the lane');
    under(HW, 29, 6); HW.press('act', 1); HW.step(3); tug(HW);
    assert.ok(until(HW, () => bumps(HW) === 1, 200), 'Ow!');
    noErrors(HW);
});

/* ================= 6: the Housekeeper ================= */
function solve6(HW) {
    const t = tuck(HW), o = otto(HW), a = HW.G.map;
    assert.ok(until(HW, () => t.state === 'sit', 600));
    assert.deepEqual([t.tx, t.ty], [9, 5], 'in the passage, the block in its far mouth');
    under(HW, 2, 8, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 500), 'the button');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 9, 900));
    const W = a.find('m6W');
    under(HW, 10, 5); tug(HW); knot(HW);
    assert.ok(until(HW, () => W.ret.state === 'away' && !W.mv, 200) && W.knotted, 'pushed out of the mouth and tied there');
    assert.ok(until(HW, () => o.tsking, 300), 'Otto comes to tidy it, and can only tsk');
    assert.deepEqual([o.tx, o.ty], [11, 4], 'from his side of it');
    assert.ok(until(HW, () => t.tx >= 20, 900), 'Tuck walks on by');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    assert.deepEqual([o.tx, o.ty], [30, 1], 'Otto round the back, on his X in the next room');
    const B = a.find('m6B');
    under(HW, 30, 5); tug(HW);
    assert.ok(until(HW, () => B.ret.state === 'away' && !B.mv, 400), 'pushed off its place');
    assert.deepEqual([B.tx, B.ty], [29, 5], 'west, away from him');
    knot(HW);
    assert.ok(until(HW, () => o.tsking, 300));
    assert.deepEqual([o.tx, o.ty], [29, 4], 'Otto tsking at it from his side: on the doormat');
}
test('Making 6 (the Housekeeper): Otto tidies whatever Tuck clears; held fast, he only tsks at it, from his side (onto the doormat)', () => {
    const HW = making(6);
    solve6(HW);
    assert.deepEqual(finish(HW, 6), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 6: not held, Otto tidies the block straight back into the passage\'s mouth', () => {
    const HW = making(6);
    const t = tuck(HW), o = otto(HW), W = HW.G.map.find('m6W');
    assert.ok(until(HW, () => t.state === 'sit', 600));
    under(HW, 10, 5); tug(HW);
    assert.ok(until(HW, () => W.ret.state === 'away' && !W.mv, 200));
    assert.ok(until(HW, () => o.state === 'watch', 200), 'Tidy!');
    assert.ok(until(HW, () => W.ret.state === 'home', 100), 'back in the mouth');
    HW.step(300);
    assert.ok(t.tx < 10, 'and Tuck never got by');
    noErrors(HW);
});

test('Making 6: the doormat feels only somebody standing on it; and Otto stands where his side is, not where it would help', () => {
    const HW = making(6);
    const t = tuck(HW), o = otto(HW), a = HW.G.map;
    until(HW, () => t.state === 'sit', 600);
    under(HW, 10, 5); tug(HW); knot(HW);
    assert.ok(until(HW, () => t.tx >= 20, 1200));
    const B = a.find('m6B');
    /* the block stitched onto the mat does nothing */
    under(HW, 30, 5); stitch(HW, 'LU');
    assert.deepEqual([B.tx, B.ty], [29, 4]);
    HW.step(30);
    assert.ok(!a.find('m6Gate').open, 'a block is no person');
    noErrors(HW);
});

/* ================= 7: Tidy and Untidy ================= */
function solve7(HW) {
    const t = tuck(HW), o = otto(HW), a = HW.G.map;
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 1, 9, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 500), 'the button');
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 8, 900));
    const W = a.find('m7W');
    /* pushed out of the junction (he clears his own way), tied, and Otto stands in the junction tsking at it; his own
       thread whisks him back to his X, and Tuck's through before he's back */
    under(HW, 9, 5); tug(HW); knot(HW);
    assert.ok(until(HW, () => ahas(HW).includes('cleared'), 200));
    assert.ok(until(HW, () => o.tsking, 300));
    assert.deepEqual([o.tx, o.ty], [9, 5], 'in the junction, in the way');
    under(HW, 9, 6); tug(HW);
    assert.deepEqual([o.tx, o.ty], [9, 6], 'Hey! I was TIDYING!');
    assert.ok(until(HW, () => t.tx >= 20, 1500), 'Tuck slips through and on');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    assert.deepEqual([t.tx, t.ty], [34, 5], 'sitting on the mat by the gate');
    /* Two Mats: the crate draws him west of the block; then the block jumps and he pushes it east; tied, Otto's side
       of it is its own place, the other mat */
    const C = a.find('m7C'), K = a.find('m7K');
    under(HW, 27, 2); tug(HW);
    assert.ok(until(HW, () => C.ret.state !== 'home', 400), 'he went to the crate');
    HW.step(150);
    under(HW, 30, 5); tug(HW);
    assert.ok(until(HW, () => K.ret.state === 'away' && !K.mv, 600));
    assert.deepEqual([K.tx, K.ty], [31, 5], 'pushed east');
    knot(HW);
    assert.ok(until(HW, () => o.tx === 30 && o.ty === 5, 900), 'Otto on the other mat, tsking');
}
test('Making 7 (Tidy and Untidy): a knot in the junction parks Otto in the way (his own thread moves him); Two Mats: Tuck sulks on one, Otto tsks on the other', () => {
    const HW = making(7);
    solve7(HW);
    assert.deepEqual(finish(HW, 7), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 7: a stitch gives the junction\'s block a place of its own out of the way, and Otto leaves it be', () => {
    const HW = making(7);
    const t = tuck(HW), o = otto(HW), W = HW.G.map.find('m7W');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 9, 5); stitch(HW, 'RR');
    assert.deepEqual([W.tx, W.ty, W.ret.state], [11, 5, 'home']);
    assert.ok(until(HW, () => t.tx >= 20, 1200), 'through');
    assert.equal(o.state === 'tidy', false, 'Otto never stirred');
    noErrors(HW);
});

test('Making 7: tied in the junction and left, Otto stands in the way tsking for good; pushed from the gate\'s side, Otto tsks off the mats', () => {
    const HW = making(7);
    const t = tuck(HW), o = otto(HW), W = HW.G.map.find('m7W');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 9, 5); tug(HW); knot(HW);
    assert.ok(until(HW, () => o.tsking, 300));
    HW.step(900);
    assert.ok(t.tx < 10 && o.tx === 9 && o.ty === 5, 'Tuck still stuck behind Otto');
    under(HW, 9, 6); tug(HW);
    assert.ok(until(HW, () => t.tx >= 20 && t.state === 'sit', 1800));
    const K = HW.G.map.find('m7K');
    under(HW, 30, 5); tug(HW);
    assert.ok(until(HW, () => K.ret.state === 'away' && !K.mv, 400));
    assert.deepEqual([K.tx, K.ty], [29, 5], 'pushed west, from the gate\'s side');
    knot(HW);
    assert.ok(until(HW, () => o.tsking, 400));
    assert.deepEqual([o.tx, o.ty], [29, 4], 'his side of it is no mat');
    HW.step(300);
    assert.ok(!HW.G.map.ents.find(e => e.kind === 'door' && e.when === 'm7a&m7b').open, 'the gate stays shut');
    noErrors(HW);
});

/* ================= 8: the Grand Hall ================= */
function solve8(HW) {
    const t = tuck(HW), o = otto(HW), a = HW.G.map;
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 44, 7, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 500), 'the button');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    /* the big door's counterweight, underneath */
    const Wt = a.find('m8Weight');
    go(HW, 43, 16); HW.face('left'); HW.push('left', 1); HW.step(5);
    assert.ok(Wt.ret.state === 'away', 'off its plate');
    assert.ok(until(HW, () => t.tx < 40, 600), 'through the big door');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    assert.deepEqual([t.tx, t.ty], [21, 5], 'by the way west, shut');
    const N = a.find('m8Nib'), W = a.find('m8W');
    under(HW, 25, 7); tug(HW); HW.step(20); knot(HW);
    assert.ok(N.knotted, 'the nibbler tied up');
    under(HW, 26, 5); tug(HW);
    assert.ok(until(HW, () => W.ret.state === 'away' && !W.mv, 500));
    assert.deepEqual([W.tx, W.ty], [27, 5], 'pushed east out of its slot, straight away from him');
    knot(HW);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx <= 22, 900), 'Tuck back by the way west');
    assert.ok(until(HW, () => o.tx === 26 && o.ty === 5 && o.tsking, 900), 'and the Housekeeper on its way home, tsking');
    HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => o.state === 'down', 60), 'let go: tidied by his own tidying');
    assert.ok(until(HW, () => t.tx < 20, 600), 'the way west opens');
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 13, 5); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('cleared'), 300), 'the last block, cleared by himself');
}
test('Making 8 (the Grand Hall): the big door\'s weight; the nibbler; the Housekeeper held on a thing\'s way home, then let go', () => {
    const HW = making(8);
    solve8(HW);
    assert.deepEqual(finish(HW, 8), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 8: the nibbler loose, Tuck won\'t go and push; let go too soon, Otto tidies it without falling over', () => {
    const HW = making(8);
    const t = tuck(HW), o = otto(HW), a = HW.G.map, W = a.find('m8W');
    until(HW, () => t.state === 'sit', 900);
    go(HW, 43, 16); HW.face('left'); HW.push('left', 1);
    until(HW, () => t.tx < 40 && t.state === 'sit', 1500);
    under(HW, 26, 5); tug(HW); HW.step(400);
    assert.equal(W.ret.state, 'home', 'never pushed');
    under(HW, 25, 7); tug(HW); HW.step(20); knot(HW);
    under(HW, 26, 5); tug(HW);
    assert.ok(until(HW, () => W.ret.state === 'away' && !W.mv, 500));
    knot(HW); HW.step(30); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => W.ret.state === 'home', 400), 'tidied');
    assert.notEqual(o.state, 'down');
    assert.ok(!a.find('m8Shut').open, 'the way west still shut');
    noErrors(HW);
});

/* ================= the act ================= */
test("all nine Makings (Wren's own the last), all three Ahas each: S30, the drawing; Gundry comes over from the Guild Hall to say his piece; the Way Down", () => {
    const HW = making(9);
    for (let n = 1; n <= 9; n++) HW.Progress.set('making' + n + '_ahas', 3);
    for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
    const M = HW.global('Making'), D = HW.global('Dialog'), Sc = HW.global('Script');
    let near = null;
    M.finish(HW.G.map);
    for (let i = 0; i < 6000 && (D.active || Sc.blocking() || i < 60); i++) {
        const g = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gundry'), p = HW.player();
        if (D.active && D.who === 'gundry' && g && near === null) near = Math.abs(g.tx - p.tx) + Math.abs(g.ty - p.ty);
        if (D.active && D.shown >= D.pageLen()) HW.press('act', 1); else HW.step(1);
    }
    assert.ok(HW.Progress.flag('s30'));
    assert.ok(HW.Inv.items.tuckdrawing);
    assert.ok(HW.Progress.flag('makings_done'));
    assert.ok(near !== null && near <= 2, `Gundry beside Wren when he speaks (${near})`);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'), 'the Way Down');
    noErrors(HW);
});

test('the Making Floor: a door for each Little House, each open once the one before is done; Otto there once the fifth is', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    const doors = () => [...HW.G.map.ents.filter(e => e.kind === 'warp' && /^making/.test(e.to)).map(e => e.to)].sort();
    HW.warp('underside', 49, 5); HW.step(5);
    assert.deepEqual(doors(), ['making1']);
    for (const n of [1, 2, 3, 4, 5]) HW.Progress.set('making' + n);
    HW.warp('underside', 49, 5); HW.step(5);
    assert.deepEqual(doors(), ['making1', 'making2', 'making3', 'making4', 'making5', 'making6']);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'npc' && e.who === 'otto'), 'Otto on the Making Floor');
    noErrors(HW);
});

test('every Little House has a nudge under each of its rooms but the way out; a nudge fires after a long while stuck', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    const A = HW.global('AREAS');
    for (let n = 1; n <= 8; n++) {
        const rooms = A['making' + n].rooms.filter(r => r.above);
        assert.ok(rooms.length >= 2, `making${n} has rooms underneath`);
        for (const r of rooms) if (!/Ballroom/.test(r.name)) assert.ok(r.nudge && r.nudge.say, `making${n}: ${r.name} has a nudge`);
    }
    HW.global('Settings').hints = true; HW.Progress.set('hintsAsked');
    for (let i = 1; i < 6; i++) HW.Progress.set('making' + i);
    HW.warp('making6', 3, 16); HW.step(5);
    const st = HW.Stats.rooms['making6:' + HW.global('Cam').room.i];
    st.t = 60 * 60 * 3; HW.step(5);
    assert.ok(HW.Progress.areaFlag('making6', 'nudged:0,1'), 'nudged');
    noErrors(HW);
});

test('old saves: partway through the act (three done) the rest open in turn and the act can still end; a save in a room that has gone puts Wren back in one underneath', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (const f of ['gundry_job', 'making1', 'making2', 'making3']) HW.Progress.set(f);
    HW.warp('underside', 49, 5); HW.step(5);
    const doors = () => [...HW.G.map.ents.filter(e => e.kind === 'warp' && /^making/.test(e.to)).map(e => e.to)].sort();
    assert.deepEqual(doors(), ['making1', 'making2', 'making3', 'making4']);
    /* a save made in the old Making 1's hoop room, which is gone */
    HW.warp('making1', 3, 16); HW.step(3);
    const s = HW.Save.snapshot(); s.pos = { area: 'making1', x: 45 * 16 + 8, y: 16 * 16 + 10, dir: 0, mark: { area: 'making1', tx: 40, ty: 16 } };
    HW.global('Game').load(HW.Save.migrate(JSON.parse(JSON.stringify(s)))); HW.step(40);
    const p = HW.player(), r = HW.G.map.roomAt(p.tx, p.ty);
    assert.ok(r && r.above, `in a room underneath (${p.tx},${p.ty})`);
    assert.ok(!HW.G.map.kind(p.tx, p.ty).solid, 'not in a wall');
    /* and the act still ends: the last the Makers built, then Wren's own */
    for (let n = 4; n <= 7; n++) HW.Progress.set('making' + n);
    HW.warp('making8', 56, 16); HW.step(5);
    HW.global('Making').finish(HW.G.map);
    for (let i = 0; i < 60; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(!HW.Progress.flag('makings_done') && HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'making9'), 'her own still to make');
    HW.warp('making9', 9, 16); HW.step(5); HW.skipTalk();
    HW.walkTo(7, 19); HW.face('down'); HW.press('act', 1); HW.step(5);
    until(HW, () => tuck(HW).state === 'done', 2000);
    for (let i = 0; i < 60; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('makings_done'));
    noErrors(HW);
});

test('old saves: an act finished with four leaves the new Little Houses open to play, and nothing else changes', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (const f of ['gundry_job', 'making1', 'making2', 'making3', 'making4', 'makings_done']) HW.Progress.set(f);
    const goal = HW.Progress.goal;
    HW.warp('underside', 49, 5); HW.step(5);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'), 'the Way Down still open');
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'making5'), 'the fifth open');
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'npc' && (e.who === 'tuck' || e.who === 'otto')), 'nobody waiting on the Making Floor');
    HW.warp('making5', 56, 16); HW.step(5);
    HW.global('Making').finish(HW.G.map);
    for (let i = 0; i < 40; i++) { HW.skipTalk(); HW.step(20); }
    assert.equal(HW.Progress.goal, goal, 'the story is where it was');
    noErrors(HW);
});

test('a save in the middle of a Making with Otto loads and plays on', () => {
    const HW = making(6);
    const t = tuck(HW);
    until(HW, () => t.state === 'sit', 600);
    HW.Save.write(1);
    const s = HW.Save.read(1);
    const H2 = loadGame(); H2.global('Game').load(s); H2.step(30);
    assert.equal(H2.G.map.id, 'making6');
    const o = H2.G.map.find('otto');
    assert.ok(o && o.tx === 11 && o.ty === 3, 'Otto on his X');
    H2.step(200);
    noErrors(H2);
});
