// David, playing 1.0.3, in the Slumberhouse: "am i trapped?" He'd gone down the Nursery playpen's little hole (its way out
// for anyone who drops in without the Bedroll laid up top) with the toy block in his arms. The block is too big for the
// hole (it can't be set down or pushed in), but falling, Wren set down what she carried where she stood: the block went
// down and filled the hole for good. The room's toy was lost, and the next time he dropped into the playpen there was no
// hole to get out by. Now what's too big stays up beside the hole, and a game that lost them has them back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const N = [0, 11];                                   /* the Nursery's corner */
const at = (x, y) => [N[0] + x, N[1] + y];
function game() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'slumber', x: 29, y: 42, noAutosave: true });
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll']) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    HW.warp('slumber', ...at(18, 5)); HW.step(30); HW.skipTalk(); HW.step(5);
    return HW;
}
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };

test('carried down the playpen\'s little hole, the toy block stays up beside it: Wren out, the toy in the playpen, the hole a hole', () => {
    const HW = game(), p = HW.player(), a = HW.G.map;
    assert.ok(HW.walkTo(...at(4, 5))); HW.hold('down'); until(HW, () => p.ty === at(0, 7)[1] && p.state === 'normal', 120); HW.release();
    HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(p.carry && p.carry.id === 'nuToy', 'carrying the toy');
    assert.ok(HW.walkTo(...at(7, 9))); HW.hold('right');
    assert.ok(until(HW, () => p.state === 'fall', 120), 'down the hole'); HW.release();
    until(HW, () => p.state === 'normal', 600); HW.step(20); HW.skipTalk();
    assert.ok(p.ty - N[1] <= 5, 'Wren back up top');
    const toy = a.find('nuToy');
    assert.ok(toy && !toy.removed, 'the toy is still there');
    assert.ok(toy.tx - N[0] >= 2 && toy.tx - N[0] <= 9 && toy.ty - N[1] >= 7 && toy.ty - N[1] <= 9, 'in the playpen: ' + [toy.tx - N[0], toy.ty - N[1]]);
    assert.ok(a.kind(...at(8, 9)).pit, 'the hole is still a hole');
    assert.ok(!HW.Progress.areaFlag('slumber', 'fill:8,20') && !HW.Progress.areaFlag('slumber', 'gone:nuToy'), 'nothing filled it, nothing lost');
    /* and down into the playpen again, the hole still lets her out */
    assert.ok(HW.walkTo(...at(4, 5))); HW.hold('down'); until(HW, () => p.ty === at(0, 7)[1] && p.state === 'normal', 120); HW.release();
    assert.ok(HW.walkTo(...at(7, 8)) || HW.walkTo(...at(8, 8))); HW.walkTo(...at(8, 8)); HW.face('down'); HW.hold('down');
    assert.ok(until(HW, () => p.state === 'fall', 120), 'out by the hole again'); HW.release();
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a game that lost the toy down the little hole loads with the toy back in its playpen and the hole open; one that used it up for the gap keeps it used', () => {
    const save = flags => {
        const HW = game();
        for (const f of flags) HW.Progress.setAreaFlag('slumber', f);
        return JSON.parse(JSON.stringify(HW.Save.snapshot()));
    };
    const load = s => { const HW = loadGame(); HW.global('Game').load(HW.Save.migrate(s)); HW.step(5); HW.skipTalk(); return HW; };
    /* lost down the hole (1.0.3) */
    let HW = load(save(['fill:8,20', 'gone:nuToy']));
    HW.warp('slumber', ...at(18, 5)); HW.step(10);
    let toy = HW.G.map.find('nuToy');
    assert.ok(toy && toy.tx - N[0] <= 9 && toy.ty - N[1] >= 7, 'the toy back in its playpen');
    assert.ok(HW.G.map.kind(...at(8, 9)).pit, 'the hole open again');
    /* used for what it's for: filling the gap under the north door, it stays used up */
    HW = load(save(['fill:8,13', 'gone:nuToy']));
    HW.warp('slumber', ...at(18, 5)); HW.step(10);
    assert.ok(!HW.G.map.find('nuToy'), 'used up');
    assert.ok(!HW.G.map.kind(...at(8, 2)).pit, 'and its gap stays filled');
});
