// Secrets added late (src/78b_secrets.js): S01 everyone budged, S03 Biscuit's crawlspace, S07 the back window, S08 keys,
// S09/S10 the Bell and the Hookline at the Well, S14 bosses asleep, S25 Biscuit's collar, S31 the far isle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function game(preset = 'afterD8') { const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; return HW; }
const act = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };

test('S01: the last townsperson budged: Arlo\'s line and the Frayed Ribbon', () => {
    const HW = game();
    const B = HW.global('Story').budgeable();
    assert.ok(!B.includes('thimble') && !B.includes('mabel') && B.length >= 20, 'nobody only found behind a counter: ' + B.length);
    for (const w of B.slice(1)) HW.Progress.set('budged:' + w);
    HW.global('Story').budged({ who: B[0] }); HW.step(30); HW.skipTalk();
    assert.ok(HW.Progress.flag('s01') && HW.Inv.items.ribbon);
    noErrors(HW);
});

test('S03: with Biscuit by it, the crawlspace gives up a Heart Patch', () => {
    const HW = game();
    HW.warp('hollow', 106, 67); HW.step(5); HW.skipTalk();
    const cat = HW.G.map.ents.find(e => e.kind === 'critter' && e.who === 'biscuit');
    cat.x = 105 * 16 + 8; cat.y = 66 * 16 + 10; cat.wait = 9999;
    const p0 = HW.Inv.patches;
    act(HW, 'left');
    assert.ok(HW.Progress.flag('s03') && HW.Inv.patches === p0 + 1);
    noErrors(HW);
});

test('S07: the tailor\'s back window after the Kiln; S08: a key tugs home at a House\'s door', () => {
    const HW = game();
    HW.warp('hollow', 102, 43); HW.step(5); HW.skipTalk(); act(HW, 'down');
    assert.ok(HW.Progress.flag('s07'));
    HW.Inv.keyCount.tidy = 1; HW.global('Story').leaveHouse('tidy');
    assert.ok(HW.Progress.flag('s08') && HW.Progress.notes.includes('s08'));
    noErrors(HW);
});

test('S09/S10: the Bell rung at the Well, and the Hookline thrown at it', () => {
    const HW = game();
    HW.warp('hollow', 95, 61); HW.step(5); HW.skipTalk();
    HW.Inv.equipped = 'bell'; HW.face('up'); HW.press('tool', 1); HW.step(40); HW.skipTalk();
    assert.ok(HW.Progress.flag('s09'), 'S09');
    HW.step(60); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(30); HW.skipTalk();
    assert.ok(HW.Progress.flag('s10'), 'S10');
    noErrors(HW);
});

test('S14: a beaten boss asleep in its hall, to be patted', () => {
    const HW = game();
    HW.warp('tidy', 29, 9); HW.step(30); HW.skipTalk();
    const nap = HW.G.map.ents.find(e => e.interact && e.talkBox && HW.G.map.roomAt(e.tx, e.ty) && HW.G.map.roomAt(e.tx, e.ty).key === '1,0' && !e.kind.match(/hoop|pickup/));
    assert.ok(nap, 'there');
    HW.walkTo(nap.tx, nap.ty + 1) || HW.walkTo(nap.tx - 1, nap.ty);
    const p = HW.player(); HW.face(p.ty > nap.ty ? 'up' : 'right'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('s14'));
    noErrors(HW);
});

test('S25: with six of Linnet\'s notes, Biscuit\'s collar; S31: the far isle, by the Long Hook', () => {
    const HW = game();
    for (const n of [1, 2, 3, 4, 5, 6]) HW.Progress.set('linnet' + n);
    HW.global('Script').run(HW.global('CRITTER_TALK').biscuit({})); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('s25'));
    HW.Inv.items.longhook = 1;
    HW.warp('hollow', 128 + 4, 80 + 10); HW.step(10); HW.skipTalk(); HW.step(5);
    /* (whatever swims in the lake would catch the hook first: out of the way) */
    const clear = () => { for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy' && Math.abs(e.y - 90 * 16) < 64) HW.G.map.remove(e); };
    clear();
    HW.Inv.equipped = 'hook'; HW.face('right'); HW.press('tool', 1); HW.step(90);
    assert.deepEqual([HW.player().tx, HW.player().ty], [128 + 13, 80 + 10], 'over to the isle');
    assert.ok(HW.walkTo(128 + 13, 80 + 9)); act(HW, 'right');
    assert.ok(HW.Progress.flag('s31') && HW.Inv.patches >= 1, 'the chest');
    HW.walkTo(128 + 13, 80 + 10);
    clear(); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1); HW.step(90);
    assert.deepEqual([HW.player().tx, HW.player().ty], [128 + 4, 80 + 10], 'and back');
    noErrors(HW);
});

test('S31: no way onto the isle from the north shore; the post there is the way off, thread or no thread', () => {
    for (const pre of ['afterD8', 'afterEnding']) {
        const HW = game(pre);
        HW.warp('hollow', 128 + 14, 80 + 4); HW.step(10); HW.skipTalk();
        HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); HW.step(60);
        assert.equal(HW.player().ty, 80 + 4, 'the chest turns the hook back');
        HW.warp('hollow', 128 + 13, 80 + 9); HW.step(10); HW.skipTalk();
        HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(60);
        assert.deepEqual([HW.player().tx, HW.player().ty], [128 + 13, 80 + 4], 'off by the north post');
        noErrors(HW);
    }
});

test('fog-silk hollows in three early regions: shut until the Shears; the quilt counts them', () => {
    const HW = game();
    /* (Meadowfold's is cut from the side: the sheep pen's fence is above it) */
    for (const [bx, by, x, y, ax, ay, d] of [[1, 2, 11, 36, -2, -1, 'right'], [0, 2, 21, 37, 0, -2, 'down'], [2, 2, 16, 36, 0, -2, 'down']]) {
        const gx = bx * 64 + x, gy = by * 40 + y;
        HW.warp('hollow', gx + ax, gy + ay); HW.step(10); HW.skipTalk();
        assert.equal(HW.walkTo(gx, gy - 1), false, 'shut');
        HW.walkTo(gx + ax, gy + ay); HW.face(d); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(10); HW.skipTalk();
        assert.ok(HW.walkTo(gx, gy - 1), 'cut open');
        HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    }
    const silk = HW.global('Quilt').tally().find(r => /silk/.test(r[0]));
    assert.ok(silk[1] === 3 && silk[2] === 3, 'all three counted');
    noErrors(HW);
});

test('the quilt by Wren\'s bed reads out the tally', () => {
    const HW = game();
    HW.Progress.set('s01'); HW.Progress.set('linnet3');
    HW.warp('gran_room', 7, 4); HW.step(10); HW.skipTalk();
    HW.face('down'); HW.press('act', 1); HW.step(3);
    assert.match(HW.global('Dialog').pages.flat().join(' '), /2 so far/);
    HW.skipTalk();
    noErrors(HW);
});
