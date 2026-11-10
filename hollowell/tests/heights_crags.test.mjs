// Belfry Heights, off the road: the Crags (the Hookline over a chasm by an eyelet, a mark the gust empties, a sleeper's empty
// mark, a mark you empty yourself) and the Eyrie (the Shears: a crate cut loose fills the crevice for good).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
const HT = [128, 0], ht = (x, y) => [HT[0] + x, HT[1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const hook = (HW, d) => { HW.Inv.equipped = 'hook'; HW.face(d); HW.press('tool', 1); HW.step(50); };
const at = (HW, x, y) => { const p = HW.player(); return p.tx === x && p.ty === y; };
function game(pre = 'afterD3') { const HW = loadGame(); HW.preset(pre); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 24; return HW; }

test('the Crags: an eyelet, a mark the wind empties, a sleeper\'s empty mark, a mark you empty yourself; the stone and the patch', () => {
    const HW = game();
    HW.warp('hollow', ...ht(30, 12)); HW.step(5);
    go(HW, ...ht(25, 12));
    hook(HW, 'left'); assert.ok(at(HW, ...ht(19, 12)), 'over to the eyelet');
    const crate = HW.G.map.find('cragCrate'), g = HW.G.map.find('cragGust');
    /* with the crate at home on its place, the hook only yanks it into the drop (and it pops home) */
    until(HW, () => HW.Return.isHome(crate) && !crate.mv && !crate.pendingHome && !g.on, 900);
    hook(HW, 'down'); HW.step(30);
    assert.ok(at(HW, ...ht(19, 12)), 'still on the eyelet\'s pinnacle');
    until(HW, () => crate.tx === ht(20, 14)[0] && !crate.mv, 800);
    assert.equal(crate.tx, ht(20, 14)[0], 'the wind blew the crate off its place');
    hook(HW, 'down'); assert.ok(at(HW, ...ht(19, 14)), 'onto the crate\'s empty place');
    go(HW, ...ht(19, 15));
    hook(HW, 'left'); assert.ok(at(HW, ...ht(13, 15)), 'onto the sleeping boulder\'s empty place');
    go(HW, ...ht(12, 15));
    hook(HW, 'left'); HW.step(30);
    const pot = HW.G.map.find('cragPot');
    assert.deepEqual([pot.tx, pot.ty], ht(11, 15), 'the pot reeled in off its place, onto the pinnacle');
    HW.face('left'); HW.press('act', 1); HW.step(10); assert.ok(HW.player().carry === pot, 'carrying it');
    hook(HW, 'left'); assert.ok(at(HW, ...ht(8, 15)), 'onto the pot\'s empty place');
    HW.face('right'); HW.press('act', 1); HW.step(60);         /* (the pot: tossed back over the drop, it falls and pops home) */
    assert.ok(!HW.player().carry, 'hands free');
    const p0 = HW.Inv.patches;
    go(HW, ...ht(7, 16)); HW.face('left'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the Heart Patch');
    go(HW, ...ht(7, 15)); HW.face('left'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('crags_carved'), 'carved the stone');
    /* home the quick way: a step off the edge */
    HW.hold('right'); HW.step(5); HW.release(); HW.hold('down'); HW.step(30); HW.release();
    until(HW, () => HW.player().state === 'normal' && HW.player().tx >= ht(25, 0)[0], 400);
    assert.ok(HW.player().tx >= ht(25, 0)[0], `back at the edge (at ${HW.player().tx},${HW.player().ty})`);
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('the Crags: nothing else reaches across; a ring wakes the boulder and its place is no target', () => {
    const HW = game('afterD4');
    HW.warp('hollow', ...ht(30, 12)); HW.step(5);
    for (const y of [11, 13, 14, 15, 16, 17]) { go(HW, ...ht(25, y)); hook(HW, 'left'); assert.ok(at(HW, ...ht(25, y)), 'row ' + y + ': nothing to catch'); }
    go(HW, ...ht(25, 12)); hook(HW, 'left');
    const crate = HW.G.map.find('cragCrate');
    until(HW, () => crate.tx === ht(20, 14)[0] && !crate.mv, 800);
    hook(HW, 'down'); assert.ok(at(HW, ...ht(19, 14))); go(HW, ...ht(19, 15));
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120);
    const b = HW.G.map.find('cragBoulder');
    assert.ok(HW.Return.isHome(b), 'the ring woke it and it went home over the drop');
    hook(HW, 'left');
    assert.ok(HW.player().tx !== ht(13, 15)[0], 'no landing on its place now');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('the Eyrie: the draught blows the crate into the crevice and it pops home; cut loose, it fills the crevice for good', () => {
    const HW = game('afterD8');
    HW.warp('hollow', ...ht(50, 3)); HW.step(5);
    const c = HW.G.map.find('eyrieCrate');
    assert.equal(HW.walkTo(...ht(56, 2)), false, 'cut off');
    let fell = false; for (let i = 0; i < 700 && !fell; i++) { HW.step(1); if (c.pendingHome || (c.mv && c.tx === ht(54, 2)[0])) fell = true; }
    assert.ok(fell, 'blown into the crevice');
    until(HW, () => HW.Return.isHome(c) && !c.pendingHome && !c.mv, 900);
    go(HW, ...ht(50, 2)); HW.Inv.equipped = 'shears'; HW.face('right'); HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(!c.ret, 'a stray now');
    go(HW, ...ht(49, 3));
    until(HW, () => HW.G.map.kind(...ht(54, 2)).pit === false, 900);
    assert.ok(!HW.G.map.kind(...ht(54, 2)).pit, 'the crevice filled');
    go(HW, ...ht(58, 2)); HW.face('right'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the Eyrie\'s Heart Patch');
    /* and it stays filled */
    HW.warp('gran_room', 6, 3); HW.step(3); HW.warp('hollow', ...ht(50, 3)); HW.step(5);
    assert.ok(HW.walkTo(...ht(56, 2)), 'still a way in');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
