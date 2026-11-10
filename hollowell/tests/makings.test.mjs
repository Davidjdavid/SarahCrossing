// The Makings (src/68_makings.js): Tuck's Little Wander, run from underneath. Tuck walks by his own rules; Wren tugs,
// ties off and stitches from below. Each Making played through for all three Ahas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const tug = HW => { HW.press('act', 1); HW.step(3); };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function making(n) {
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (let i = 1; i < n; i++) HW.Progress.set('making' + i);
    HW.warp('making' + n, 3, 16); HW.step(10); HW.skipTalk();
    return HW;
}
const tuck = HW => HW.G.map.find('tuck');
const ahas = HW => [...HW.global('Making').cur.ahas].sort();
/* stand under a mark (dy 11 below) on the given side, facing it */
function under(HW, x, y, side = 'down') {
    const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side];
    go(HW, x + dx, y + 11 + dy); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]);
}
function finish(HW, n) {
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'done', 2500), `Tuck reaches the hoop (he's at ${t.tx},${t.ty}, ${t.state})`);
    const got = ahas(HW);
    for (let i = 0; i < 12 && HW.G.map.id !== 'underside'; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('making' + n), 'done');
    assert.equal(HW.G.map.id, 'underside', 'back on the Making Floor');
    return got;
}

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
    go(HW, 45, 16);
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
    go(HW, 45, 16);
    assert.deepEqual(finish(HW, 2), ['cleared', 'found', 'unhurt']);
    noErrors(HW);
});

test('Making 2: let the heavy thing go while he sits in its way, and he is bowled over (a bump)', () => {
    const HW = making(2);
    const t = tuck(HW);
    const nib = HW.G.map.find('m2Nib');
    under(HW, 10, 2, 'down'); tug(HW); HW.step(20); knot(HW);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 16, 900));
    under(HW, 16, 5, 'down'); tug(HW);
    assert.ok(until(HW, () => t.tx === 29 && t.state === 'sit', 1200));
    under(HW, 29, 9, 'up'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => HW.global('Making').cur.bumps === 1, 300), 'Ow!');
    assert.ok(t.tx < 10, 'back at the start');
    noErrors(HW);
});

test('Making 3 (the Little Wander): a new place for the heavy one; the biter by the plate tied up; the block onto the plate', () => {
    const HW = making(3);
    HW.Inv.stitches = [];
    const t = tuck(HW);
    under(HW, 5, 8, 'up'); tug(HW);
    assert.ok(until(HW, () => ahas(HW).includes('found'), 400), 'the button');
    assert.ok(until(HW, () => t.state === 'sit', 600));
    under(HW, 10, 5, 'down');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); HW.hold('up'); HW.step(2); HW.release(); HW.step(8); HW.press('tool', 1); HW.step(30);
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
    go(HW, 45, 16);
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
    assert.ok(HW.Progress.flag('makings_done'), 'the last of them: the Way Down is next');
    noErrors(HW);
});

test('Making 4: let the far plate\'s heavy one go while he sits in its way, and he is bowled over', () => {
    const HW = making(4);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 900));
    under(HW, 11, 1, 'down'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => t.state === 'sit' && t.tx === 38, 1200), 'on the plate');
    under(HW, 38, 1, 'down'); HW.press('act', 1); HW.step(3);
    assert.ok(until(HW, () => HW.global('Making').cur.bumps === 1, 300), 'Ow!');
    assert.ok(t.tx < 10, 'back at the start');
    noErrors(HW);
});

test('all four Makings, all three Ahas each: S30, the drawing; the Way Down is next', () => {
    const HW = making(4);
    for (const n of [1, 2, 3, 4]) HW.Progress.set('making' + n + '_ahas', 3);
    for (const n of [1, 2, 3]) HW.Progress.set('making' + n);
    HW.global('Making').finish(HW.G.map);
    for (let i = 0; i < 20; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('s30'));
    assert.ok(HW.Inv.items.tuckdrawing);
    assert.ok(HW.Progress.flag('makings_done'));
    noErrors(HW);
});
