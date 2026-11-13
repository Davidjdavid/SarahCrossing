// Fix round I: the debug panel's Noclip did nothing (only the probe read it). On, Wren walks through walls, things and
// shut gates, and over a pit, to the edge of the place; off, they stop her again. The panel opens only with ?debug.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const at = HW => [HW.player().tx, HW.player().ty];
const walk = (HW, d, n) => { HW.hold(d); HW.step(n); HW.release(); HW.step(3); };
/* (held till she's where it says, or long enough to have got there) */
const walkTill = (HW, d, done, max = 400) => { HW.hold(d); for (let i = 0; i < max && !done(); i++) HW.step(1); HW.release(); HW.step(3); return done(); };

test('Noclip, from the debug panel: through walls, things and a shut gate and over a pit while on; stopped again when off', () => {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true, skipIntro: true }); HW.step(5);
    const D = HW.global('Debug'), row = () => D.items().find(([n]) => n.startsWith('Noclip'));
    /* (the lab: a wall along row 6 above her; along row 3 a block, a wooden block, a shut gate, then a pit) */
    walk(HW, 'up', 60);
    assert.deepEqual(at(HW), [2, 7], 'the wall stops her');
    assert.equal(row()[0], 'Noclip: off');
    row()[1]();
    assert.equal(HW.G.cheats.noclip, true); assert.equal(row()[0], 'Noclip: on');
    assert.ok(walkTill(HW, 'up', () => HW.player().ty <= 3, 120), 'through the wall: at ' + at(HW));
    assert.deepEqual(at(HW), [2, 3]);
    const block = HW.at(3, 3), gate = HW.G.map.ents.find(e => e.kind === 'door' && e.tx === 11 && e.ty === 3);
    assert.ok(block && gate && !gate.open, 'a block, and the gate shut');
    assert.ok(walkTill(HW, 'right', () => HW.player().tx >= 17, 300), 'through the blocks and the gate, over the pit: at ' + at(HW));
    assert.equal(HW.player().state, 'normal', "she didn't go down the pit");
    assert.equal(HW.at(3, 3), block, 'the block not pushed');
    /* the edge of the place still holds */
    walk(HW, 'right', 120);
    assert.ok(HW.G.map.inside(HW.player().tx, HW.player().ty));
    /* off: the walls stop her again */
    row()[1]();
    assert.equal(HW.G.cheats.noclip, false);
    HW.warp('lab', 2, 8); HW.step(3);
    walk(HW, 'up', 60);
    assert.deepEqual(at(HW), [2, 7]);
    noErrors(HW);
});

test('the debug panel opens on F1 only with ?debug', () => {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true, skipIntro: true }); HW.step(5);
    const I = HW.global('Input'), D = HW.global('Debug'), f1 = () => { I.keyDown({ code: 'F1', type: 'keydown', repeat: false, preventDefault() { } }); I.keyUp({ code: 'F1', type: 'keyup', preventDefault() { } }); HW.step(2); };
    assert.equal(HW.G.debug, false);
    f1(); assert.equal(D.open, false, 'not without ?debug');
    HW.G.debug = true;
    f1(); assert.equal(D.open, true, 'with it');
    f1(); assert.equal(D.open, false);
    noErrors(HW);
});
