// Regression tests for the fresh-eyes review of House 7 (the Spoolworks, the Underside, the Needle).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], loft: [0, 0], heart: [20, 0], ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], ukennel: [40, 44], uloft: [0, 33], uheart: [20, 33] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function game(tools = []) { const HW = loadGame(); HW.preset('afterD6'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 30; for (const t of tools) HW.Inv.giveTool(t); return HW; }
const enter = (HW, room, x, y) => { HW.warp('spoolworks', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
function hatch(HW, room, x, y, dir) { go(HW, room, x, y); HW.face(dir); HW.press('act', 1); HW.step(40); }
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function stitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}

test('1: each Under room is reached only through its own trapdoor', () => {
    const HW = game();
    enter(HW, 'ugate', 9, 5);
    assert.equal(HW.walkTo(...at('uwind', 9, 5)), false, 'not from under the Gatehouse');
    enter(HW, 'uwind', 9, 5);
    assert.equal(HW.walkTo(...at('ustore', 15, 5)), false, 'not from under the Winding Hall');
});

test('2: the Spool Store: running for the gate is too slow, and the gate never shuts on you once through', () => {
    const HW = game();
    enter(HW, 'store', 17, 5);
    go(HW, 'store', 15, 2); HW.push('down', 3);
    HW.walkTo(...at('store', 5, 2)); HW.hold('left'); HW.step(30); HW.release();
    assert.ok(HW.player().tx >= 4, 'not through');
    noErrors(HW);
});

test('3: the Bobbin Loft: four stitches never hold four bobbins (the fourth lets the first go home), and all four must be down together a moment', () => {
    const HW = game(['needle']);
    enter(HW, 'loft', 9, 9);
    const B = id => thing(HW, id);
    go(HW, 'loft', 6, 5); HW.face('up'); stitch(HW, 'LLLU'); until(HW, () => HW.Return.isHome(B('blB1')), 120);
    go(HW, 'loft', 12, 5); HW.face('up'); stitch(HW, 'RRRU'); until(HW, () => HW.Return.isHome(B('blB2')), 120);
    go(HW, 'loft', 6, 6); HW.face('down'); stitch(HW, 'LLLD'); until(HW, () => HW.Return.isHome(B('blB3')), 120);
    go(HW, 'loft', 12, 6); HW.face('down'); stitch(HW, 'RRRD');
    assert.ok(until(HW, () => HW.Return.isHome(B('blB1')) && B('blB1').tx === at('loft', 6, 4)[0], 400), 'the first stitch let go: home it goes');
    HW.step(400);
    assert.ok(B('blPattern').hidden, 'never all four at once');
    noErrors(HW);
});

test('4: the Tangle pulls a loose bobbin back in; only held ones (stitched, tied off) undo it', () => {
    const HW = game(['needle']);
    HW.G.cheats.god = true;
    enter(HW, 'heart', 9, 9); HW.walkTo(...at('heart', 6, 7)); HW.step(5); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle'), B = id => thing(HW, id);
    go(HW, 'heart', 8, 2); HW.face('right'); stitch(HW, 'UL'); until(HW, () => HW.Return.isHome(B('tbN')), 60);
    go(HW, 'heart', 6, 4); HW.face('down'); stitch(HW, 'LL'); until(HW, () => HW.Return.isHome(B('tbW')), 60);
    go(HW, 'heart', 12, 4); HW.face('down'); stitch(HW, 'RR'); until(HW, () => HW.Return.isHome(B('tbE')), 60);
    go(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(20); go(HW, 'heart', 13, 8);
    assert.ok(!until(HW, () => t.state === 'open', 500), 'never opens');
    assert.deepEqual([B('tbS').tx, B('tbS').ty], at('heart', 9, 8), 'yanked back in');
    noErrors(HW);
});

test('5: Homeward does not fly through the floor between the layers', () => {
    const HW = game(['bedroll']);
    enter(HW, 'wind', 2, 5);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3);
    hatch(HW, 'wind', 17, 7, 'down');
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(40);
    assert.ok(HW.player().ty > 33, 'still below');
    noErrors(HW);
});

test('6/7: a thing with the Needle in it waits; townsfolk will not take the Needle', () => {
    const HW = game(['needle']);
    enter(HW, 'store', 17, 5);
    const b = thing(HW, 'ssBlock');
    go(HW, 'store', 15, 2); HW.push('down', 1); HW.step(10);
    go(HW, 'store', 15, 6); HW.face('up');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(400);
    assert.deepEqual([b.tx, b.ty], at('store', 15, 4), 'held still while stitching');
    HW.press('atk', 1); HW.step(3);
    const H2 = loadGame(); H2.preset('afterD7'); H2.step(10); H2.skipTalk(); H2.Inv.stitches = [];
    H2.warp('underside', 9, 5); H2.step(20); H2.skipTalk();
    H2.walkTo(5, 4); H2.face('down'); H2.Inv.equipped = 'needle'; H2.press('tool', 1); H2.step(3);
    assert.equal(H2.Inv.stitches.length, 0, 'Bram stays where he is');
    noErrors(HW);
});

test('9/10: an untied knot stays untied when the place is built again; a run-down Cog has no cord', () => {
    const HW = game();
    enter(HW, 'gate', 9, 9);
    hatch(HW, 'gate', 16, 7, 'down');
    go(HW, 'ugate', 13, 4); HW.face('up'); HW.press('act', 1); HW.step(3);
    HW.warp('underside', 29, 2); HW.step(10); enter(HW, 'gate', 9, 9);
    const b = thing(HW, 'gaBlock');
    assert.ok(!b.knotted, 'not tied again');
    assert.deepEqual([b.tx, b.ty], at('gate', 13, 3), 'and at home, out of the passage');
    const c = { cordable: true };
    const H2 = game(); H2.Progress.set('spool_cog'); enter(H2, 'ukennel', 9, 5);
    assert.ok(!H2.G.map.ents.some(e => e.kind === 'cord' && e.thing.type === 'cog'), 'no cord for Cog');
    noErrors(HW);
});
