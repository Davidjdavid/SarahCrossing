// A fresh Wander, played from the title onwards: the prologue, the ceremony, the road to the Tidyhouse,
// every room on the way to its Knot, and home again; and so on to the credits (the legs are in tests/legs.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9 } from './legs.mjs';

test('a fresh game: prologue, ceremony, the Tidyhouse to its Knot, and home', () => LEG1(loadGame()));
test('from the first Knot: the canyon road, Kilnridge, the Kiln to its Knot', () => LEG2(loadGame()));
test('from the second Knot: the broken bridge, Millwater, the ferry, the Millrace to its Knot', () => LEG3(loadGame()));
test('from the third Knot: over the lake, up the cliff stair and the Heights, the Belfry to its Knot', () => LEG4(loadGame()));
test('from the fourth Knot: the festival, the giant on the east road, Hushwood and the Slumberhouse to its Knot', () => LEG5(loadGame()));
test('from the fifth Knot: over to Kilnridge, off the high mesa into Larkspur Fair, the Marionette Hall to its Knot (Reveal 1)', () => LEG6(loadGame()));
test('from the sixth Knot: the Staff door, the Underside, Gundry, the Spoolworks to the Tangle (the Needle)', () => LEG7(loadGame()));
test('from the seventh Knot: Gundry\'s job, the eight Makings for Tuck, the Way Down and the Hall of Names, the north gate, the Loomwood, the Loom to the Weaver (the Shears)', () => LEG8(loadGame()));
test('from the eighth Knot: your own thread at the fog, the Drift and Linnet, home on foot into the Pull, down the Well, the Great Spool, the end, and after', () => LEG9(loadGame()));

/* one game, from the title to the credits: each leg carries on from the one before (no presets), only taken to the
   place where the next leg starts, as the one before had walked there */
test('one game, from the title to the credits, nothing set up between', () => {
    const HW = loadGame();
    const chain = name => { const H0 = loadGame(); H0.preset(name); const id = H0.G.map.id, p = H0.player(); HW.warp(id, p.tx, p.ty); HW.step(5); HW.skipTalk(); };
    LEG1(HW); LEG2(HW, chain); LEG3(HW, chain); LEG4(HW, chain); LEG5(HW, chain); LEG6(HW, chain); LEG7(HW, chain); LEG8(HW, chain); LEG9(HW, chain);
    assert.ok(HW.Progress.flag('unwound'), 'the end');
    console.log(`# played: ${(HW.Stats.playFrames / 3600).toFixed(1)} min of game time; ${Object.keys(HW.Stats.rooms).length} rooms seen`);
});
