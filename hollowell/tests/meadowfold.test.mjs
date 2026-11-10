// Meadowfold: sheep that shy from Wren and amble home the way they were driven; the Old Fold's counting stones; Old Tup
// asleep in the bothy door (the Recall Bell); Lucky over the river (the Hookline, then the Needle: S17); the clapper.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
const MF = [64, 80], mf = (x, y) => [MF[0] + x, MF[1] + y], HT = (x, y) => [128 + x, y];
const DX = [0, -1, 1, 0], DY = [1, 0, 0, -1], D = { down: 0, left: 1, right: 2, up: 3 };
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
function game(pre) { const HW = loadGame(); HW.preset(pre); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 24; return HW; }
const noErr = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* drive a sheep a tile at a time: come up on it from straight behind */
function drive(HW, sh, dn, n = 1) {
    const d = D[dn], p = HW.player();
    for (let i = 0; i < n; i++) {
        until(HW, () => !sh.mv, 60);
        const t0 = [sh.tx, sh.ty];
        p.x = (sh.tx - DX[d]) * 16 + 8; p.y = (sh.ty - DY[d]) * 16 + 10;
        until(HW, () => sh.tx !== t0[0] || sh.ty !== t0[1], 60);
        until(HW, () => !sh.mv, 40);
        assert.deepEqual([sh.tx - t0[0], sh.ty - t0[1]], [DX[d], DY[d]], `driven ${dn} (now at ${sh.tx - 64},${sh.ty - 80})`);
    }
    /* and leave her be (out of the fold) */
    p.x = mf(11, 20)[0] * 16 + 8; p.y = mf(11, 20)[1] * 16 + 10; HW.step(1);
}

test('sheep: walking up on one drives it on ahead; left alone it ambles home the way it went', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...mf(6, 12)); HW.step(5);
    const sh = HW.G.map.find('nettle');
    go(HW, ...mf(6, 15));
    assert.ok(!HW.Return.isHome(sh) || sh.mv, 'she shied away');
    HW.walkTo(...mf(13, 12));
    assert.ok(until(HW, () => HW.Return.isHome(sh) && !sh.mv, 900), 'and went home');
    noErr(HW);
});

test('the Old Fold: driven up and round and back down the far side, the ewe counts herself home in order (yan, tan, tethera); the old tally box opens (the clapper)', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...mf(11, 20)); HW.step(5);
    const sh = HW.G.map.find('nettle');
    drive(HW, sh, 'up', 4); drive(HW, sh, 'right', 10); drive(HW, sh, 'down', 4); drive(HW, sh, 'left', 8);
    assert.ok(!HW.Progress.flag('fold_counted'), 'driving her through counts nothing');
    assert.ok(until(HW, () => HW.Progress.flag('fold_counted'), 2500), 'yan, tan, tethera');
    until(HW, () => HW.Return.isHome(sh) && !sh.mv, 900);
    go(HW, ...mf(16, 11)); HW.face('right'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.items.clapper, 'the clapper');
    noErr(HW);
});

test('the Old Fold: driven round the other way she counts herself home backwards, and nothing opens', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...mf(11, 20)); HW.step(5);
    const sh = HW.G.map.find('nettle');
    drive(HW, sh, 'right', 10); drive(HW, sh, 'up', 4); drive(HW, sh, 'left', 10); drive(HW, sh, 'down', 3);
    until(HW, () => HW.Return.isHome(sh) && !sh.mv, 2500);
    assert.ok(HW.Return.isHome(sh), 'home');
    assert.ok(!HW.Progress.flag('fold_counted'), 'not counted');
    assert.ok(!HW.G.map.ents.find(e => e.kind === 'chest' && e.item === 'clapper' && !e.hidden), 'no box');
    noErr(HW);
});

test('Old Tup: asleep in the bothy door till a ring; then home he goes and the bothy\'s open', () => {
    const HW = game('afterD3');
    HW.warp('hollow', ...mf(11, 19)); HW.step(5);
    assert.equal(HW.walkTo(...mf(11, 14)), false, 'he fills the doorway');
    const HW2 = game('afterD4');
    HW2.warp('hollow', ...mf(11, 19)); HW2.step(5);
    HW2.Inv.equipped = 'bell'; HW2.press('tool', 1); HW2.step(150);
    const tup = HW2.G.map.find('oldTup');
    assert.ok(HW2.Return.isHome(tup), 'awake and home');
    go(HW2, ...mf(11, 14)); HW2.face('right'); const p0 = HW2.Inv.patches; HW2.press('act', 1); HW2.step(3); HW2.skipTalk();
    assert.ok(HW2.Inv.patches === p0 + 1 || HW2.Inv.maxHp > 24, 'the bothy\'s Heart Patch');
    noErr(HW2);
});

test('S17, Lucky: reeled over the river she only goes home again; given a place on this side with the Needle, she stays (Pip)', () => {
    const HW = game('afterD7');
    HW.warp('hollow', ...mf(47, 32)); HW.step(5);
    for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy') HW.G.map.remove(e);
    const lucky = HW.G.map.find('lucky');
    until(HW, () => HW.Return.isHome(lucky) && !lucky.mv, 900);
    go(HW, ...mf(48, lucky.ty - 80));
    HW.Inv.equipped = 'hook'; HW.face('right'); HW.press('tool', 1); HW.step(20);
    until(HW, () => lucky.tx <= mf(49, 0)[0] && !lucky.mv, 120);
    assert.ok(lucky.tx <= mf(49, 0)[0], `reeled over (at ${lucky.tx - 64},${lucky.ty - 80})`);
    /* she shies off along the shallows; stand back from her, in line, and give her a place on this bank */
    HW.step(30); until(HW, () => !lucky.mv, 60);
    const lx = lucky.tx, ly = lucky.ty;
    const spot = [[lx, ly - 3, 'down'], [lx, ly + 3, 'up'], [lx - 3, ly, 'right']].find(([x, y]) => HW.walkTo(x, y));
    assert.ok(spot, 'somewhere in line with her');
    HW.face(spot[2]); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    HW.press('left', 1); HW.step(10); HW.press('tool', 1); HW.step(40);
    assert.ok(lucky.ret.mx < mf(49, 0)[0], `her place is on this side (${lucky.ret.mx - 64})`);
    HW.step(400); until(HW, () => HW.Return.isHome(lucky) && !lucky.mv, 600);
    assert.ok(lucky.tx < mf(49, 0)[0] && HW.Return.isHome(lucky), 'and there she stays (grazing her new bank)');
    HW.warp('hollow', ...mf(13, 25)); HW.step(5); HW.face('down'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('s17') && (HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24), 'Pip, and a Heart Patch');
    noErr(HW);
});

test('the clapper from the Old Fold rings the ringers\' old bell on the Heights: the cave\'s boulder wakes, long before the Recall Bell', () => {
    const HW = game('afterD3');
    HW.Inv.items.clapper = 1;
    HW.warp('hollow', ...HT(33, 33)); HW.step(5);
    HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(0);
    HW.face('up'); HW.press('atk', 1); HW.step(120);
    const b = HW.G.map.find('hCaveRock');
    assert.ok(HW.Return.isHome(b), 'woken');
    go(HW, ...HT(30, 28)); HW.face('left'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24);
    noErr(HW);
});
