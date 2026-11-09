// Over the lake to the cliff stair, and Belfry Heights: the shrine bell, the Bluster, the chasm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const MW = [128, 80], HT = [128, 0];
const mw = (x, y) => [MW[0] + x, MW[1] + y], ht = (x, y) => [HT[0] + x, HT[1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
/* paddle the float under Wren to a tile, along x then y */
function paddleTo(HW, x, y) {
    const p = HW.player();
    for (let i = 0; i < 2000 && (p.tx !== x || p.ty !== y); i++) {
        const d = p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up';
        HW.hold(['tool', d]); HW.step(1);
    }
    HW.release(); HW.step(2);
    return p.tx === x && p.ty === y;
}
function heights() {
    const HW = loadGame();
    HW.preset('afterD3'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 24;
    return HW;
}

test('the lake: the raft at Wick\'s pier, paddled over to the north shore; it goes home; the other one brings you back', () => {
    const HW = heights();
    HW.warp('hollow', ...mw(18, 17)); HW.step(10);
    HW.Inv.equipped = 'paddle';
    go(HW, ...mw(18, 16)); HW.hold('up'); HW.step(12); HW.release(); HW.step(2);
    assert.equal(HW.player().ty, mw(18, 15)[1], 'aboard');
    assert.ok(paddleTo(HW, ...mw(18, 6)) && paddleTo(HW, ...mw(39, 6)) && paddleTo(HW, ...mw(39, 3)), 'paddled over');
    HW.hold('up'); HW.step(14); HW.release(); HW.step(2);
    assert.equal(HW.player().ty, mw(39, 2)[1], 'on the north shore');
    const r = HW.G.map.find('mwLakeRaft');
    assert.ok(until(HW, () => HW.Return.isHome(r), 1500), 'the raft went home to the pier');
    /* back: the north raft */
    const n = HW.G.map.find('mwNorthRaft');
    go(HW, ...mw(40, 2)); HW.hold('down'); HW.step(12); HW.release(); HW.step(2);
    assert.ok(paddleTo(HW, ...mw(40, 6)) && paddleTo(HW, ...mw(15, 6)) && paddleTo(HW, ...mw(15, 15)), 'back over');
    HW.hold('down'); HW.step(14); HW.release(); HW.step(2);
    assert.equal(HW.player().ty, mw(15, 16)[1], 'ashore on the south side');
    assert.ok(until(HW, () => HW.Return.isHome(n), 2000), 'and it went home too');
    assert.ok(HW.player().ty >= mw(15, 16)[1] && !HW.player().ride, 'still on the south side, not carried back');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('without the Paddle the north shore is out of reach on foot', () => {
    const HW = heights();
    HW.warp('hollow', ...mw(30, 2)); HW.step(10);
    assert.equal(HW.walkTo(...mw(40, 2)), false);
});

test('the cliff stair to the Heights; the shrine bell wakes the boulder asleep on the first stair', () => {
    const HW = heights();
    HW.warp('hollow', ...mw(42, 2)); HW.step(10);
    go(HW, ...mw(43, 0)); go(HW, ...ht(43, 38));
    go(HW, ...ht(12, 30));
    assert.equal(HW.walkTo(...ht(12, 27)), false, 'the boulder blocks the stair');
    go(HW, ...ht(13, 31)); HW.face('right'); HW.press('atk', 1); HW.step(30);
    go(HW, ...ht(12, 26));
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('the Bluster: walk in the lulls, lean into it when it blows; then the chasm on the Hookline and the Belfry door', () => {
    const HW = heights();
    HW.Progress.setAreaFlag('hollow', 'x');
    HW.warp('hollow', ...ht(12, 22)); HW.step(10);
    const g = HW.G.map.find('hGust');
    const p = HW.player();
    for (let i = 0; i < 4000 && p.tx < ht(52, 21)[0]; i++) {
        if (g.on || g.soon) { HW.hold('up'); HW.step(1); }
        else { HW.release(); HW.walkTo(Math.min(p.tx + 3, ht(52, 21)[0]), ht(52, 21)[1]); }
    }
    HW.release();
    assert.ok(p.tx >= ht(52, 21)[0] && p.ty <= ht(52, 22)[1], `along the ledge (at ${p.tx},${p.ty})`);
    go(HW, ...ht(52, 17)); go(HW, ...ht(45, 12));
    HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1); HW.step(60);
    assert.ok(p.tx <= ht(39, 12)[0], 'over the chasm');
    go(HW, ...ht(30, 8)); HW.hold('up'); until(HW, () => HW.G.map.id === 'belfry', 120); HW.release();
    assert.equal(HW.G.map.id, 'belfry');
});

test('caught out in a gust and not leaning, Wren is blown off the ledge down to the first terrace', () => {
    const HW = heights();
    HW.warp('hollow', ...ht(36, 21)); HW.step(10);
    const g = HW.G.map.find('hGust');
    until(HW, () => g.on, 400);
    HW.step(400);
    const p = HW.player();
    assert.equal(p.ty, ht(36, 30)[1], `blown down onto the first terrace, past the rock (at ${p.ty})`);
    assert.ok(!HW.G.map.kind(p.tx, p.ty).solid, 'standing on open ground');
    /* and she can walk off */
    const y0 = p.y; HW.hold('down'); HW.step(20); HW.release();
    assert.ok(p.y > y0, 'not stuck');
});

test('the Bluster ledge above the little cave is rock: no hopping down into it', () => {
    const HW = heights();
    for (const x of [29, 30, 31]) {
        HW.warp('hollow', ...ht(x, 26)); HW.step(5);
        HW.hold('down'); HW.step(60); HW.release(); HW.step(30);
        assert.ok(HW.player().ty <= ht(x, 26)[1], `x ${x}: stays up top (at ${HW.player().ty})`);
    }
});

test('after the Belfry: the Recall Bell wakes the boulder in the little cave (Heart Patch)', () => {
    const HW = heights();
    assert.equal(HW.walkTo(...ht(30, 28)), false, 'stopped up');
    HW.Inv.giveTool('bell'); HW.Inv.equipped = 'bell';
    HW.warp('hollow', ...ht(30, 31)); HW.step(10);
    HW.press('tool', 1); HW.step(40);
    go(HW, ...ht(30, 28)); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1);
});
