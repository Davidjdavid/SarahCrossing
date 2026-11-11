// Kilnridge: the Kiln's forecourt and its vent (on the road), the Firing Ground, the sleeping vent (the Recall Bell), the clay
// dam (the Needle), the hawk's nest (S20) and Linnet's urn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
const KR = [0, 80], kr = (x, y) => [KR[0] + x, KR[1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const lift = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(10); assert.ok(HW.player().carry, 'lifted'); };
const toss = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(30); };
function game(pre) { const HW = loadGame(); HW.preset(pre); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 24; return HW; }
const noErr = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));

test('the Kiln\'s forecourt: shut till the firing hole by the road is fired; a pot in the vent\'s wet mouth stays, and is thrown', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...kr(20, 20)); HW.step(5);
    assert.equal(HW.walkTo(...kr(22, 14)), false, 'the gate is shut');
    const pot = HW.G.map.find('fgPot1');
    /* set down on plain ground off its place, a pot walks home; in the vent's mouth it sticks */
    go(HW, ...kr(17, 18)); lift(HW, 'down');
    go(HW, ...kr(21, 17)); toss(HW, 'right');
    assert.deepEqual([pot.tx, pot.ty], kr(25, 17), 'landed in the vent\'s mouth, whole');
    HW.step(150);
    assert.ok(until(HW, () => HW.G.map.find('kilnGate').open, 600), 'the vent threw it over the rock into the firing hole: the gate opens');
    go(HW, ...kr(22, 14));
    noErr(HW);
});

/* (the blind solver's findings, round B: that a pot can come down in a vent's wet mouth, and be thrown on from there, is
   shown by the place on the way in, not told) */
test('on the road in, two old vents four steps apart throw a pot back and forth: it comes down whole in the other\'s wet mouth', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...kr(46, 23)); HW.step(5);
    const a = HW.G.map, pot = a.find('krVentPot'), Clay = HW.global('CLAY');
    assert.ok(pot && pot.tx === kr(40, 0)[0] && pot.ty === kr(0, 21)[1], 'a pot sitting in the first vent\'s mouth');
    const seen = [];
    for (let i = 0; i < 900; i++) { HW.step(1); if (!pot.flying) { const k = (pot.tx - kr(0, 0)[0]) + ',' + (pot.ty - kr(0, 0)[1]); if (seen[seen.length - 1] !== k) seen.push(k); } assert.ok(!pot.shattered, 'never broken'); }
    assert.deepEqual(seen.slice(0, 3), ['40,21', '44,21', '40,21'], 'over to the other and back, a vent\'s breath a time');
    until(HW, () => !pot.flying && pot.tx === kr(44, 0)[0], 400);
    assert.equal(pot.heldBy, Clay, 'held in the wet mouth where it came down');
    assert.equal(HW.global('Vents').flights.length, 0, '(and nothing else flying)');
    noErr(HW);
});

test('the Kiln\'s forecourt stays open for anyone who has been inside (an older save)', () => {
    const HW = game('afterD2');
    HW.warp('hollow', ...kr(22, 20)); HW.step(5);
    go(HW, ...kr(22, 14));
    noErr(HW);
});

test('the Firing Ground: the crate held out of the way, a pot in the vent, and Wren on the plate in the far corner when it goes', () => {
    const HW = game('afterD2');
    HW.warp('hollow', ...kr(19, 26)); HW.step(5);
    go(HW, ...kr(19, 30));
    const crate = HW.G.map.find('fgCrate'), pot = HW.G.map.find('fgPot3');
    /* the crate on the vent's line: shoved into the wet clay, it sticks there and doesn't go home */
    go(HW, ...kr(18, 30)); HW.push('down', 1); HW.step(200);
    assert.deepEqual([crate.tx, crate.ty], kr(18, 32), 'the crate sits stuck in the clay');
    /* a pot onto the vent */
    go(HW, ...kr(14, 30)); lift(HW, 'up');
    go(HW, ...kr(18, 31)); toss(HW, 'left');
    assert.deepEqual([pot.tx, pot.ty], kr(14, 31), 'in the vent\'s mouth');
    go(HW, ...kr(12, 33));
    assert.ok(until(HW, () => HW.Progress.areaFlag('hollow', 'charm:fgKiln'), 900), 'thrown through the open gate, under the kiln\'s charm');
    go(HW, ...kr(26, 32)); HW.face('right'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the Heart Patch');
    go(HW, ...kr(24, 32)); HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('brampot'), 'Bram\'s first pot');
    noErr(HW);
});

test('the Firing Ground: not by Wren\'s own throw, nor with the gate shut', () => {
    const HW = game('afterD2');
    HW.warp('hollow', ...kr(19, 30)); HW.step(5);
    const pot = HW.G.map.find('fgPot3');
    go(HW, ...kr(14, 30)); lift(HW, 'up');
    go(HW, ...kr(22, 30)); go(HW, ...kr(22, 31)); toss(HW, 'right');
    assert.ok(!HW.Progress.areaFlag('hollow', 'charm:fgKiln'), 'the gate stopped it');
    until(HW, () => HW.Return.isHome(pot) && !pot.pendingHome, 900);
    HW.G.map.remove(HW.G.map.find('fgCrate'));     /* (the crate aside, not the point here) */
    go(HW, ...kr(14, 30)); lift(HW, 'up'); go(HW, ...kr(18, 30)); go(HW, ...kr(18, 31));
    toss(HW, 'left');
    HW.step(700);
    assert.ok(!HW.Progress.areaFlag('hollow', 'charm:fgKiln'), 'with nobody on the plate the vent throws into a shut gate');
    noErr(HW);
});

test('the sleeping vent: the Recall Bell wakes the boulder off it; a pot thrown up into the Kiln Mesa\'s chimney; the cache on the mesa', () => {
    const HW = game('afterD4');
    HW.warp('hollow', ...kr(17, 15)); HW.step(5);
    const b = HW.G.map.find('ventBoulder');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(200);
    assert.ok(HW.Return.isHome(b), 'woken, it rolled home off the vent');
    go(HW, ...kr(16, 16)); lift(HW, 'up');
    go(HW, ...kr(18, 14)); toss(HW, 'left');
    const pot = HW.G.map.find('cvPot1');
    assert.deepEqual([pot.tx, pot.ty], kr(14, 14), 'in the vent\'s mouth');
    assert.ok(until(HW, () => HW.Progress.areaFlag('hollow', 'charm:chimney'), 900), 'thrown up over the face into the chimney');
    go(HW, ...kr(17, 11)); HW.face('up'); const b0 = HW.Inv.buttons; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.buttons > b0, 'the cache on the mesa top');
    noErr(HW);
});

test('the sleeping vent: asleep, it only grumbles; nothing gets up into the chimney by hand', () => {
    const HW = game('afterD3');
    HW.warp('hollow', ...kr(17, 15)); HW.step(5);
    go(HW, ...kr(16, 16)); lift(HW, 'up');
    go(HW, ...kr(14, 16)); toss(HW, 'up'); HW.step(400);
    assert.ok(!HW.Progress.areaFlag('hollow', 'charm:chimney'));
    noErr(HW);
});

test('the clay dam: a pot or two thrown by hand only cracks it, and it settles; a pot given its place in the vent\'s mouth breaks it', () => {
    const HW = game('afterD7');
    const dam = () => HW.G.map.find('clayDam');
    HW.warp('hollow', ...kr(50, 32)); HW.step(5);
    for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy') HW.G.map.remove(e);     /* (crocks wander into the way: not the point here) */
    /* a pot from the potters' camp, thrown into the vent's mouth: thrown once, a crack; then home it goes and the dam settles */
    go(HW, ...kr(50, 32)); lift(HW, 'down');
    const pot = HW.player().carry;
    const vent = HW.G.map.ents.find(e => e.id === 'damVent');
    go(HW, ...kr(56, 20)); until(HW, () => vent.k > 20 && vent.k < 60, 400); toss(HW, 'right');
    assert.deepEqual([pot.tx, pot.ty], kr(60, 20), 'stuck in the vent');
    assert.ok(until(HW, () => dam() && dam().hp < 3, 400), 'one knock');
    until(HW, () => !dam() || dam().hp === 3, 900);
    assert.ok(dam() && dam().hp === 3, 'the clay settled back');
    /* the Needle: the pot thrown into the vent again, stitched a step aside, then stitched back into the vent: its place */
    until(HW, () => HW.Return.isHome(pot) && !pot.pendingHome, 900);
    go(HW, ...kr(50, 32)); lift(HW, 'down');
    go(HW, ...kr(56, 20));
    until(HW, () => vent.k > 20 && vent.k < 60, 400); toss(HW, 'right');
    HW.Inv.equipped = 'needle';
    go(HW, ...kr(57, 20)); HW.face('right'); HW.press('tool', 1); HW.step(2);
    HW.press('left', 1); HW.step(10); HW.press('tool', 1); HW.step(30);
    assert.deepEqual([pot.ret.mx, pot.ret.my], kr(59, 20), 'its place a step aside');
    /* (held in the clay it stays put; the vent throws it, it breaks on the dam, and its pieces come home to its new place) */
    assert.ok(until(HW, () => pot.tx === kr(59, 20)[0] && pot.ty === kr(59, 20)[1] && HW.Return.isHome(pot) && !pot.pendingHome && !pot.shattered, 900), 'at its new place');
    go(HW, ...kr(56, 20)); HW.face('right'); HW.press('tool', 1); HW.step(3); HW.skipTalk(0); HW.step(2);
    HW.press('right', 1); HW.step(10); HW.press('tool', 1); HW.step(30);
    assert.deepEqual([pot.ret.mx, pot.ret.my], kr(60, 20), 'its place in the vent\'s mouth');
    assert.ok(until(HW, () => !dam(), 1500), 'thrown again and again from its own place: the dam breaks');
    go(HW, ...kr(60, 7)); HW.face('up'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the slot\'s Heart Patch');
    noErr(HW);
});

test('S20: a pot carried down past the hawk\'s nest and broken at the bottom knocks the Heart Patch out of it', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...kr(52, 8)); HW.step(5);
    go(HW, ...kr(52, 8)); lift(HW, 'up');
    go(HW, ...kr(48, 13)); go(HW, ...kr(48, 16)); go(HW, ...kr(44, 18)); toss(HW, 'down'); HW.step(120);
    const pk = HW.G.map.ents.find(e => e.kind === 'pickup' && e.what === 'heartpatch');
    assert.ok(pk, 'knocked out of the nest');
    noErr(HW);
});

test('Linnet\'s urn at the end of the crevice: knocked from afar, note 3', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...kr(17, 18)); HW.step(5);
    go(HW, ...kr(17, 18)); lift(HW, 'down');
    go(HW, ...kr(7, 31)); toss(HW, 'left'); HW.step(20);
    go(HW, ...kr(4, 31)); HW.face('left'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('linnet3'));
    noErr(HW);
});
