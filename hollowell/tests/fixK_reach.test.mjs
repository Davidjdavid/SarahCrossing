// David, playing 1.0.2, in the Millrace: "how do I get through the room with sign the blocks the way? I really want to go
// over there to see whats up". The UPSTREAM sign stood on the only floor between the room's door and its west half: that
// half, the Overflow and the Workshop beyond it couldn't be reached at all (every test of those rooms began inside them).
// Then the same looked for everywhere (tests/reach_check.mjs), which found two more: the Bell Ropes' sign in front of the
// strip along its top wall, and the Shard Race's Heart Patch, which could be opened from the corridor below it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { fixedCuts } from './reach_check.mjs';

const R = { upstream: [20, 11], overflow: [0, 11], workshop: [0, 0], shard: [0, 22] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function millrace(room, x, y) {
    const HW = loadGame(); HW.preset('afterD2'); HW.step(5); HW.skipTalk();
    HW.warp('millrace', ...at(room, x, y)); HW.step(10); HW.skipTalk();
    return HW;
}

test('the Millrace, Upstream: from the door at the foot of the race, on foot past the sign, into the Overflow and over its stones to the Workshop', () => {
    const HW = millrace('upstream', 9, 9), Cam = HW.global('Cam');
    const go = (room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
    go('upstream', 2, 9);                                        /* past the sign, into the room's west half */
    go('upstream', 1, 5); HW.hold('left'); HW.step(60); HW.release(); HW.step(20);
    assert.equal(Cam.room.name, 'Overflow', 'through the west door');
    /* its own puzzle as ever (tests/millrace.test.mjs): two pale stones into the double race, and across */
    go('overflow', 13, 2); HW.push('left', 4);
    go('overflow', 14, 8); HW.push('up', 5);
    go('overflow', 15, 2); HW.push('left', 6);
    go('overflow', 4, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    assert.equal(Cam.room.name, 'Workshop', 'and up into the Workshop');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('the Millrace, Shard Race: the Heart Patch behind the gate is reached only through the gate, not from the corridor below', () => {
    const HW = millrace('shard', 18, 5), a = HW.G.map, p = HW.player(), c = a.find('srPatch');
    for (const [dx, dy] of [[0, -1], [0, 1], [1, 0]]) assert.ok(p.solidAt(c.tx + dx, c.ty + dy), `walled in at ${dx},${dy}`);
    assert.equal(a.at(c.tx - 1, c.ty), null); assert.equal(a.find('srGate').tx, c.tx - 1, 'the gate beside it');
    /* what used to work: the pot by the door carried up the corridor, thrown away, the chest opened from below */
    HW.face('up'); HW.press('act', 1); HW.step(15);
    assert.ok(p.carry, 'the pot, lifted');
    HW.walkTo(...at('shard', 18, 4)); HW.face('down'); HW.press('act', 1); HW.step(60);
    HW.face('up'); HW.press('act', 1); HW.step(10); HW.skipTalk();
    assert.equal(HW.Inv.patches, 0, 'nothing from below');
});

test('nowhere does a sign, a chest or any other fixed thing stand on the only floor between two stretches of floor', () => {
    for (const stage of [null, 'afterD3', 'afterD6', 'afterEnding']) {
        const HW = loadGame();
        if (stage) HW.preset(stage); else HW.newGame('Wren', { noAutosave: true, skipIntro: true });
        HW.step(2);
        const World = HW.global('World');
        for (const id of Object.keys(HW.AREAS)) {
            let a; try { a = World.build(id); } catch { continue; }
            assert.deepEqual(fixedCuts(HW, a).map(c => c.msg), [], `${stage || 'a new game'}: ${id}`);
        }
    }
});
