// Regression tests for the fresh-eyes review of House 5 (the Slumberhouse, the Bedroll): softlocks, cheese, stale state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], study: [60, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'slumber', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('slumber', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx - R[room][0]},${HW.player().ty - R[room][1]})`);
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const ring = HW => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4); };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); };
const landed = HW => until(HW, () => HW.player().state === 'normal', 600);
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function canMove(HW) {
    const p = HW.player(), x0 = p.x, y0 = p.y;
    for (const d of ['left', 'up', 'down', 'right']) { HW.hold(d); HW.step(20); HW.release(); if (Math.abs(p.x - x0) + Math.abs(p.y - y0) > 4) return true; }
    return false;
}
function stepPath(HW, room, path) {
    const p = HW.player();
    for (const [x, y] of path) {
        const [tx, ty] = at(room, x, y);
        const d = tx > p.tx ? 'right' : tx < p.tx ? 'left' : ty > p.ty ? 'down' : 'up';
        for (let i = 0; i < 60 && (p.tx !== tx || p.ty !== ty); i++) { HW.hold(d); HW.step(1); }
        const along = d === 'left' || d === 'right' ? () => Math.abs(p.x - (tx * 16 + 8)) : () => Math.abs(p.y - (ty * 16 + 10));
        for (let i = 0; i < 12 && along() > 2; i++) { HW.hold(d); HW.step(1); }
        HW.release();
    }
}

test('H1: a save loaded with the Bedroll on a block\'s home never leaves Wren inside the block', () => {
    const HW = game(['bedroll']); HW.Progress.set('slumber_matron');
    enter(HW, 'moonwalk', 1, 5);
    go(HW, 'moonwalk', 15, 9); HW.push('right', 1);
    go(HW, 'moonwalk', 16, 9); lay(HW);
    go(HW, 'moonwalk', 10, 5);
    HW.Save.write(1);
    HW.global('Game').load(HW.Save.read(1)); HW.step(40);
    const p = HW.player(), b = thing(HW, 'mwBlock');
    assert.ok(!(p.tx === b.tx && p.ty === b.ty), 'not standing in the block');
    assert.ok(canMove(HW), 'can walk');
    /* and from outside, Homeward lands beside it */
    HW.warp('hollow', 147, 49); HW.step(5);
    homeward(HW); HW.step(80); HW.skipTalk();
    const p2 = HW.player(), b2 = thing(HW, 'mwBlock');
    assert.equal(HW.G.map.id, 'slumber');
    assert.ok(!(p2.tx === b2.tx && p2.ty === b2.ty), 'not inside the block after Homeward');
    assert.ok(canMove(HW));
    noErrors(HW);
});

test("H2: the toy block is too big for the playpen's little hole, and it won't leave the Nursery", () => {
    const HW = game(['bedroll']);
    enter(HW, 'nursery', 18, 5);
    const p = HW.player();
    go(HW, 'nursery', 4, 5); HW.hold('down'); until(HW, () => p.ty === at('nursery', 0, 7)[1] && p.state === 'normal', 120); HW.release();
    HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(p.carry, 'carrying the toy');
    go(HW, 'nursery', 7, 9); HW.face('right'); HW.press('act', 1); HW.step(5);
    assert.ok(p.carry, 'still carrying it: it would not go down the hole');
    assert.ok(HW.G.map.kind(...at('nursery', 8, 9)).pit, 'the hole is still there');
    HW.face('up'); HW.press('act', 1); HW.step(5);
    assert.ok(!p.carry, 'set down beside');
    const toy = thing(HW, 'nuToy');
    assert.ok(!HW.G.map.freeForThing(...at('nursery', 8, 9), toy), 'and no pushing it in either');
    /* walked into, the hole takes Wren (and only Wren) out of the playpen */
    HW.hold('right'); until(HW, () => p.state === 'fall', 120); HW.release(); landed(HW);
    assert.notDeepEqual(here(HW, 'nursery'), [8, 9], 'out of the playpen');
    assert.ok(!HW.Progress.areaFlag('slumber', 'fill:8,20'), 'nothing filled the hole');
    /* the toy carried out of the Nursery bounces back */
    lay(HW);
    go(HW, 'nursery', 4, 5); HW.hold('down'); until(HW, () => p.ty === at('nursery', 0, 7)[1] && p.state === 'normal', 120); HW.release();
    HW.walkTo(toy.tx, toy.ty - 1) || HW.walkTo(toy.tx + 1, toy.ty) || HW.walkTo(toy.tx - 1, toy.ty);
    const dir = toy.ty > p.ty ? 'down' : toy.tx > p.tx ? 'right' : 'left';
    HW.face(dir); HW.press('act', 1); HW.step(10);
    assert.ok(p.carry, 'picked it up again');
    homeward(HW); landed(HW); HW.step(3);
    assert.ok(p.carry, 'home with it, still in the Nursery');
    go(HW, 'nursery', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(5);
    assert.ok(!p.carry, 'it wriggled free at the door');
    const t2 = thing(HW, 'nuToy');
    assert.ok(t2.tx < 10 && t2.ty >= at('nursery', 0, 7)[1], 'back in the playpen');
    noErrors(HW);
});

test('H2b: once the toy has filled the gap for good, it does not turn up again', () => {
    const HW = game(['bedroll']);
    HW.Progress.setAreaFlag('slumber', 'fill:8,13');
    enter(HW, 'nursery', 18, 5);
    assert.ok(!thing(HW, 'nuToy'));
});

test('H3: the sleeping barrel rung home without the Bedroll is asleep by the grate again next time', () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 17, 9);
    const br = thing(HW, 'ldBarrel');
    go(HW, 'laundry', 15, 9); ring(HW);
    until(HW, () => HW.Return.isHome(br), 400);
    assert.ok(HW.Return.isHome(br), 'gone home through the grate');
    assert.ok(!HW.Progress.areaFlag('slumber', 'woke:ldBarrel'), 'not woken for good');
    HW.warp('hollow', 147, 49); HW.step(5); enter(HW, 'laundry', 17, 9);
    const br2 = thing(HW, 'ldBarrel');
    assert.deepEqual([br2.tx, br2.ty], at('laundry', 17, 5), 'by the grate');
    assert.ok(HW.Return.asleep(br2), 'asleep');
    noErrors(HW);
});

test('H4/M5: rolling the Bedroll up (even on a float) leaves no bed: the mark is the room\'s door again', () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 1, 5);
    const p = HW.player();
    const doorMark = { tx: p.mark.tx, ty: p.mark.ty };
    go(HW, 'laundry', 2, 8); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    lay(HW);
    assert.ok(HW.Inv.bedroll, 'laid on the basket');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    assert.equal(HW.Inv.bedroll, null, 'rolled up');
    assert.ok(!p.mark.bed, 'no bed any more');
    assert.deepEqual([p.mark.tx, p.mark.ty], [doorMark.tx, doorMark.ty], "back to the room's own mark");
    noErrors(HW);
});

test('H5: a Bedroll on a float goes home with its float; Homeward from outside lands on it, dry', () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 1, 5);
    const p = HW.player(), b = thing(HW, 'ldBasket');
    go(HW, 'laundry', 2, 8); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(20); HW.release();
    until(HW, () => b.ty === at('laundry', 0, 7)[1] && b.tx >= at('laundry', 8, 0)[0] && !b.mv, 1500);
    lay(HW);
    assert.ok(HW.Inv.bedroll && HW.Inv.bedroll.fid, 'laid on the basket, out on the water');
    HW.hold('down'); until(HW, () => p.ty === at('laundry', 0, 8)[1] && !p.ride, 120); HW.step(10); HW.release();
    HW.warp('hollow', 147, 49); HW.step(5);
    const hp = HW.Inv.hp;
    homeward(HW); HW.step(80); HW.skipTalk(); HW.step(30);
    assert.equal(HW.G.map.id, 'slumber');
    assert.equal(HW.player().state, 'normal');
    assert.equal(HW.Inv.hp, hp, 'no sinking');
    const b2 = thing(HW, 'ldBasket'), p2 = HW.player();
    assert.ok(HW.Inv.bedroll, 'the Bedroll is still laid');
    assert.deepEqual([HW.Inv.bedroll.tx, HW.Inv.bedroll.ty], [b2.tx, b2.ty], 'on its basket, back at the dock');
    assert.deepEqual([p2.tx, p2.ty], [b2.tx, b2.ty], 'and Wren on it');
    noErrors(HW);
});

test("a House's door is always in the pause menu: back to it from anywhere inside", () => {
    const HW = game(['bedroll']);
    enter(HW, 'loft', 9, 1);
    const PM = HW.global('PauseMenu');
    assert.ok(PM.saveItems().includes("Back to the House's door"));
    PM.backToDoor(); HW.step(60);
    const e = HW.global('AREAS').slumber.entry;
    assert.deepEqual([HW.player().tx, HW.player().ty], [e.x, e.y]);
    HW.warp('hollow', 147, 49); HW.step(5);
    assert.ok(!HW.global('PauseMenu').saveItems().includes("Back to the House's door"), 'not outside');
    noErrors(HW);
});

test('M1: in the Linen Cupboard, the lamps go out when Wren falls home (one walk, every lamp)', () => {
    const HW = game();
    enter(HW, 'ward', 1, 5);
    go(HW, 'linen', 16, 3); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    go(HW, 'linen', 13, 6);
    stepPath(HW, 'linen', [[12, 6], [12, 5]]);
    HW.step(20);
    const lamp = HW.G.map.ents.find(e => e.kind === 'plate' && e.sig === 'lp2');
    assert.ok(lamp.on, 'lit');
    const p = HW.player();
    HW.hold('up'); until(HW, () => p.state === 'fall', 200); HW.release(); landed(HW); HW.step(5);
    assert.ok(!lamp.on, 'out again');
    noErrors(HW);
});

test('M2: a dive that starts under a dreamcatcher, or a Bell snap, does not light it', () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 1, 5);
    const p = HW.player(), lit = id => thing(HW, id).lit > 0;
    go(HW, 'laundry', 17, 1); lay(HW);
    go(HW, 'laundry', 17, 4); HW.hold('left'); until(HW, () => p.state === 'fall', 200); HW.release(); landed(HW);
    assert.ok(!lit('ldRing2'), 'a fall from under it is not a flight through it');
    go(HW, 'laundry', 9, 8); lay(HW);
    HW.Inv.equipped = 'bell';
    go(HW, 'laundry', 9, 1); HW.hold('down'); until(HW, () => p.state === 'flight', 200); HW.release();
    HW.press('tool', 1); landed(HW);
    assert.ok(!lit('ldRing1'), 'snapped home, not flown through');
    noErrors(HW);
});

test('M4: a Snoreling asleep on the Bedroll is forgotten when the place is built afresh', () => {
    const HW = game(['bedroll']);
    const BR = HW.global('Bedroll');
    enter(HW, 'fort', 9, 9);
    go(HW, 'fort', 16, 8); lay(HW);
    BR.sleeper = thing(HW, 'pfSnore2');
    HW.warp('hollow', 147, 49); HW.step(5); enter(HW, 'fort', 9, 9);
    assert.equal(BR.sleeper, null);
    go(HW, 'fort', 16, 9); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    assert.equal(HW.Inv.bedroll, null, 'rolls up');
});

test('L1/L2/L5: levers are no posts for the hook; no Bedroll on stairs; Matron says her piece once', () => {
    const HW = game();
    go(HW, 'porch', 9, 5); HW.Inv.equipped = 'hook'; HW.face('right'); HW.press('tool', 1); HW.step(60);
    assert.deepEqual(here(HW, 'porch'), [9, 5], 'not reeled to the lever');
    const H2 = loadGame();
    H2.preset('afterD5'); H2.step(10); H2.skipTalk();
    const a = H2.G.map;
    let spot = null;
    for (let y = 40; y < 80 && !spot; y++) for (let x = 168; x < 175; x++) if (a.chars[y * a.w + x] === 'H') { spot = [x, y]; break; }
    H2.warp('hollow', ...spot); H2.step(5);
    H2.Inv.equipped = 'bedroll'; H2.Inv.bedroll = null; H2.press('tool', 1); H2.step(2);
    assert.equal(H2.Inv.bedroll, null, 'not on the stairs');
    const H3 = game(['bedroll']);
    H3.G.cheats.god = true;
    enter(H3, 'landing', 9, 9);
    H3.hold('up'); H3.step(10); H3.release(); H3.skipTalk(); H3.step(5);
    assert.ok(H3.Progress.flag('matron_met'));
});
