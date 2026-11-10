// The Drift's own puzzles (src/74_drift.js): the old mill, whose wheel winds up the sluice in the dam of the pond below
// only while it turns (a barrel goes down the race once, and that's all: out here nothing comes round twice; the Needle
// gives one a place by the wheel, or a stray boulder dams the race under it); the fair's balloon, come down by the wall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const pos = HW => `${HW.G.map.id} ${HW.player().tx},${HW.player().ty}`;
const walk = (HW, x, y, max = 30000) => assert.ok(HW.walkTo(x, y, max), `walk to ${x},${y} (at ${pos(HW)})`);
const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(40); };
function drift(flags = []) {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = [];
    for (const f of flags) HW.Progress.set(f);
    HW.warp('drift', 50, 6); HW.step(30); HW.skipTalk();
    return HW;
}
const sluice = HW => HW.G.map.ents.find(e => e.kind === 'millsluice');
const drained = HW => HW.Progress.flag('drift_millpond');
/* over the stream on the stray boulder by the track, round to the pond's bed */
const crossOver = HW => { walk(HW, 44, 16); HW.push('left', 3); HW.step(20); };

test('the old mill: a barrel down the race turns the wheel as it goes by; the sluice lifts a little, and sinks back', () => {
    const HW = drift();
    const a = HW.G.map, b = a.find('drBarrel');
    walk(HW, 47, 3); HW.push('left', 2);
    assert.ok(until(HW, () => b.ty === 8 && !b.mv, 1500), 'down the race to the grating under the mill');
    assert.ok(sluice(HW).lift > 0, 'the sluice wound up a little');
    assert.ok(until(HW, () => sluice(HW).lift === 0, 1500), 'and back down');
    assert.ok(!drained(HW) && a.kind(37, 10).water, 'the pond still full');
    HW.step(600);
    assert.equal(b.ty, 8, 'and the barrel never comes back up');
    noErrors(HW);
});

test('the old mill, with the Needle: a barrel given a place by the wheel keeps coming back to it; the pond runs out, and on its bed the old road', () => {
    const HW = drift();
    const a = HW.G.map, b = a.find('drBarrel');
    walk(HW, 47, 3); HW.face('left'); stitch(HW, 'LLDD');
    assert.ok(until(HW, () => b.tx === 44 && b.ty === 5 && b.ret && b.ret.state === 'home', 300), 'its new place, on the race above the wheel');
    let back = 0, was = 'home';
    assert.ok(until(HW, () => { if (b.ret.state === 'home' && was !== 'home') back++; was = b.ret.state; return drained(HW); }, 4000), 'the sluice wound right up, and the pond run out');
    assert.ok(back >= 2, 'round and round: ' + back);
    assert.ok(!a.kind(37, 11).water && !a.kind(41, 10).water, 'the bed is mud');
    assert.ok(a.ents.some(e => e.milestone), 'a milestone on the old road');
    crossOver(HW);
    walk(HW, 41, 11); HW.face('up');
    const b0 = HW.Inv.buttons; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.equal(HW.Inv.buttons, b0 + 50, 'the toll box');
    walk(HW, 37, 11); HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.match(HW.global('Dialog').pages.flat().join(' '), /HOLLOWELL 3/, 'its milestone');
    HW.skipTalk();
    /* Linnet has heard it go */
    walk(HW, 18, 22, 40000); HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.match(HW.global('Dialog').pages.flat().join(' '), /mill/, 'Linnet: the mill going');
    HW.skipTalk();
    /* for good: built again, it's still run out */
    HW.warp('drift', 58, 18); HW.step(10); HW.warp('drift', 34, 11); HW.step(10);
    assert.ok(!HW.G.map.kind(37, 10).water && HW.G.map.ents.some(e => e.milestone), 'still run out');
    noErrors(HW);
});

test('the old mill, dammed: a stray boulder pushed into the race under the wheel, a barrel stops in front of it and the wheel never stops', () => {
    const HW = drift();
    walk(HW, 48, 7); HW.push('left', 3); HW.step(20);
    assert.ok(!HW.G.map.kind(44, 7).water, 'the race filled under the wheel');
    walk(HW, 47, 3); HW.push('left', 2);
    assert.ok(until(HW, () => drained(HW), 3000), 'the pond run out');
    noErrors(HW);
});

test('the old mill: a barrel paddled down in front of the wheel and held there does not turn it (the race has to)', () => {
    const HW = drift();
    const a = HW.G.map, b = a.find('drBarrel'), wheel = a.ents.find(e => e.kind === 'wheel');
    walk(HW, 47, 3); HW.push('left', 2);
    b.driftT = -60;                       /* (the race takes it off in a moment: time to get aboard, for the test) */
    for (let i = 0; i < 40 && HW.player().tx > 44; i++) { HW.hold('left'); HW.step(1); }
    HW.release(); HW.step(2);
    assert.deepEqual([HW.player().tx, HW.player().ty], [44, 3], 'aboard the barrel in the race');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 300 && b.ty < 6; i++) { HW.hold(['tool', 'down']); HW.step(1); }
    HW.hold('tool'); HW.step(90);
    assert.equal(b.ty, 6, 'in front of the wheel');
    assert.ok(!wheel.on && sluice(HW).lift === 0, 'the wheel still');
    HW.release();
    noErrors(HW);
});

test('the balloon: cut loose at the fair, it came down over the fog, in a treetop by the old wall; from its basket, the whole Drift on the map', () => {
    const HW = drift();
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'prop' && e.talkBox && e.tx === 58 && e.ty === 6), 'nothing there unless it was cut');
    HW.Progress.set('balloon_away');
    HW.warp('drift', 58, 8); HW.step(30); HW.skipTalk();
    walk(HW, 58, 7); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5);
    assert.ok(HW.Progress.flag('drift_balloon'), 'in the basket');
    const seen = HW.global('Stats').visited.drift;
    assert.ok(seen['0,0'] && seen['15,9'] && seen['3,6'], 'the whole map drawn');
    /* Linnet has noticed it */
    crossOver(HW);
    walk(HW, 18, 22, 40000); HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.match(HW.global('Dialog').pages.flat().join(' '), /balloon/, 'Linnet saw it come over');
    HW.skipTalk();
    noErrors(HW);
});
