// The Kiln's things on the lab floor: charms rung by shards along the carried path, sequence locks
// (laid in reverse), seals, the Hookline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab() {
    const HW = loadGame();
    HW.newGame('T', { area: 'lab2', x: 2, y: 8, noAutosave: true });
    HW.step(3);
    return HW;
}
const find = (HW, id) => HW.G.map.find(id);

test('a pot carried under a charm and smashed: its shards ring the charm on the way home', () => {
    const HW = lab();
    HW.walkTo(2, 3); HW.face('up'); HW.press('act', 1);
    assert.ok(HW.player().carry);
    HW.walkTo(5, 3);                  // under nothing yet...
    HW.walkTo(4, 3); HW.walkTo(4, 2); HW.walkTo(5, 2);   // ...now under the charm at (4,2)
    HW.face('right'); HW.press('act', 1);
    HW.step(120);
    assert.ok(find(HW, 'c1').on, 'charm rung by the shards');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('walking back over your own path erases it: the shards skip what you doubled back from', () => {
    const HW = lab();
    HW.walkTo(2, 3); HW.face('up'); HW.press('act', 1);
    HW.walkTo(4, 3); HW.walkTo(4, 2); HW.walkTo(4, 3); HW.walkTo(6, 3);   // up under the charm and back
    HW.face('right'); HW.press('act', 1);
    HW.step(120);
    assert.equal(find(HW, 'c1').on, false, 'not rung: that bit of the path was erased');
});

test('a sequence lock: walk under them in reverse so the shards ring them in order', () => {
    const HW = lab();
    HW.walkTo(13, 7); HW.face('down'); HW.press('act', 1);      // pot p2 at (13,8)
    HW.walkTo(7, 7); HW.walkTo(6, 7); HW.walkTo(5, 7); HW.walkTo(4, 7);   // star, moon, sun
    HW.face('left'); HW.press('act', 1);
    HW.step(160);
    assert.ok(HW.Progress.areaFlag('lab2', 'seq:abc'), 'sun, moon, star in order');
});

test('the wrong order resets', () => {
    const HW = lab();
    HW.walkTo(4, 6); HW.walkTo(13, 7); HW.face('down'); HW.press('act', 1);
    HW.walkTo(4, 7); HW.walkTo(8, 7);                            // sun, moon, star walking east: shards ring star first
    HW.face('right'); HW.press('act', 1);
    HW.step(160);
    assert.equal(HW.Progress.areaFlag('lab2', 'seq:abc'), false);
});

test('the Hookline: reels Wren to an eyelet over a pit; pulls a pot across the pit', () => {
    const HW = lab();
    HW.Inv.giveTool('hook');
    HW.walkTo(7, 1); HW.walkTo(7, 4);
    HW.face('right'); HW.press('tool', 1);
    HW.step(60);
    assert.equal(HW.player().tx, 11, 'reeled across the pit to the eyelet');
    HW.walkTo(11, 6);
    HW.face('right'); HW.press('tool', 1); HW.step(40);
    assert.equal(find(HW, 'p3').tx, 12, 'pulled the pot to Wren');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('carrying a pot while reeling over a pit: the shards come home across the pit and ring the charm above it', () => {
    const HW = lab();
    HW.Inv.giveTool('hook');
    HW.walkTo(2, 3); HW.face('up'); HW.press('act', 1);            // pot p1
    HW.walkTo(7, 4);
    HW.face('right'); HW.press('tool', 1); HW.step(60);           // reel over (8..10,4), under the charm at (9,4)
    assert.equal(HW.player().tx, 11);
    HW.walkTo(11, 6); HW.face('down'); HW.press('act', 1);        // throw
    HW.step(200);
    assert.ok(find(HW, 'pitc').on, 'charm over the pit rung');
});

test('a thrown pot breaks a clay seal; the stick does not', () => {
    const HW = lab();
    HW.Inv.items.staff = 1;
    HW.walkTo(15, 2); HW.face('right'); HW.press('atk', 1); HW.step(20);
    assert.ok(find(HW, 'seal1'), 'stick bounced');
    HW.walkTo(13, 7); HW.face('down'); HW.press('act', 1);
    HW.walkTo(13, 2); HW.face('right'); HW.press('act', 1); HW.step(30);
    assert.equal(find(HW, 'seal1'), undefined, 'seal shattered');
});
