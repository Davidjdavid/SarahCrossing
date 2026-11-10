// Hushwood (overworld block 2,1): the sleeping giant on the road, the moss over the stream, the Slumberhouse's
// garden (its three cradles open the door), the weir and the channel down to the lake, the far bank's plateau, the
// giant's hollow (S16), Lantern Pond's lanterns (the Needle), the little wooden one's cradle (the Crossbar).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const hw = (x, y) => [128 + x, 40 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
function afterD4() {
    const HW = loadGame();
    HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    HW.Progress.set('festival');
    HW.Inv.maxHp = HW.Inv.hp = 24;
    return HW;
}
function inWood(tools = []) {
    const HW = afterD4();
    HW.Progress.set('giant_awake'); HW.Progress.set('giant_home');
    for (const t of tools) HW.Inv.giveTool(t);
    HW.warp('hollow', ...hw(10, 19)); HW.step(10);
    return HW;
}

test('the sleeping giant blocks the road until the Recall Bell wakes him; he goes home to his own bed', () => {
    const HW = afterD4();
    HW.warp('hollow', 125, 60); HW.step(30); HW.skipTalk();
    assert.equal(HW.walkTo(...hw(8, 20)), false, 'no way past him');
    const g = HW.G.map.find('giant');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.ok(until(HW, () => HW.Progress.flag('giant_awake'), 30), 'he heard');
    for (let i = 0; i < 20 && !HW.Progress.flag('giant_home'); i++) { HW.skipTalk(); HW.step(20); }
    HW.skipTalk(); HW.step(10);
    assert.ok(HW.Progress.flag('giant_home'), 'home to bed');
    assert.deepEqual([g.tx, g.ty], hw(3, 4), 'in his own bed');
    go(HW, ...hw(8, 20));
    assert.ok(HW.G.map.ents.some(e => e.interact && e.tx === hw(3, 16)[0] && e.ty === hw(3, 16)[1]), 'the hollow where he lay');
    noErrors(HW);
});

test('bouncy moss hops Wren over the stream to the Slumberhouse and back (its door shut till the garden sleeps)', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(12, 16)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 11)[1] && p.state === 'normal', 120); HW.release(); HW.step(5);
    assert.equal(p.ty, hw(0, 11)[1], 'over the stream');
    go(HW, ...hw(19, 9)); HW.hold('up'); HW.step(30); HW.release(); HW.step(30);
    assert.equal(HW.G.map.id, 'hollow', 'the door shut');
    HW.Progress.set('slumber_open');
    go(HW, ...hw(19, 10)); go(HW, ...hw(19, 9)); HW.hold('up'); HW.step(30); HW.release(); HW.step(30);
    assert.equal(HW.G.map.id, 'slumber', 'in at the Slumberhouse door');
    HW.warp('hollow', ...hw(10, 10)); HW.step(10);
    HW.hold('down'); until(HW, () => p.ty >= hw(0, 14)[1] && p.state === 'normal', 120); HW.release();
    assert.equal(p.ty, hw(0, 15)[1], 'back over');
    noErrors(HW);
});

/* the garden: Mallow's three Snorelings asleep in the meadow; three cradles in the hedge along the stream's south bank,
   a puffball west of each. They follow Wren; a cradle with somebody in it lets nobody else in; a puffball's spores put
   whoever's in reach to sleep where they stand. All three asleep in the cradles, the door opens */
const ids = ['nuSnoreA', 'nuSnoreB', 'nuSnoreC'];
const cradled = (HW, c) => ids.map(i => HW.G.map.find(i)).find(e => e.tx === hw(c, 0)[0] && e.ty === hw(0, 14)[1]);
const north = HW => { const p = HW.player(); go(HW, ...hw(12, 16)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 11)[1] && p.state === 'normal', 120); HW.release(); HW.step(4); };
const south = HW => { const p = HW.player(); go(HW, ...hw(11, 11)); HW.hold('left'); until(HW, () => p.ty >= hw(0, 15)[1] && p.state === 'normal', 120); HW.release(); HW.step(4); };
const puff = (HW, c) => { go(HW, ...hw(c - 1, 11)); HW.face('down'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(70); };
const intoSlumber = HW => { go(HW, ...hw(19, 10)); go(HW, ...hw(19, 9)); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); };
export function gardenByBell(HW) {
    /* rung from the west end of the north bank they all come; walked along to the far cradle, they file in behind, one
       to a cradle; put down from the far end back, each cloud only reaches its own */
    north(HW);
    go(HW, ...hw(13, 11));
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10);
    go(HW, ...hw(24, 11));
    until(HW, () => [16, 20, 24].every(c => cradled(HW, c)), 900);
    for (const c of [24, 20, 16]) puff(HW, c);
}
test('the garden: rung awake from across the stream, they file into the cradles; put down one by one, the door opens', () => {
    const HW = inWood();
    const S = HW.global('Signals'), a = HW.G.map;
    gardenByBell(HW);
    assert.ok(['nuA', 'nuB', 'nuC'].every(s => S.get(a, s)), 'three asleep in three cradles');
    assert.ok(ids.every(i => a.find(i).mode === 'sleep'));
    intoSlumber(HW);
    assert.equal(HW.G.map.id, 'slumber', 'the door open');
    assert.ok(HW.Progress.flag('slumber_open'), 'and open to her from now on');
    noErrors(HW);
});
test('the garden, the other way: woken one at a time by walking near; each into the first free cradle', () => {
    const HW = inWood();
    const S = HW.global('Signals'), a = HW.G.map, sn = i => a.find(i);
    const inCradle = e => [16, 20, 24].includes(e.tx - 128) && e.ty === hw(0, 14)[1];
    const free = () => [16, 20, 24].filter(c => !S.get(a, { 16: 'nuA', 20: 'nuB', 24: 'nuC' }[c]));
    go(HW, ...hw(12, 16)); north(HW);
    for (let round = 0; round < 8 && free().length; round++) {
        if (!ids.some(i => sn(i).mode !== 'sleep')) {
            /* (one asleep anywhere but a cradle: over the stream, and walk about near it till it stirs) */
            const e = ids.map(sn).find(m => !inCradle(m)), x = e.tx - 128, y = Math.max(16, e.ty - 40 + 2);
            south(HW); go(HW, ...hw(10, 17)); go(HW, ...hw(12, 18));
            for (let i = 0; i < 30 && e.mode === 'sleep'; i++) go(HW, ...hw(x + (i % 2 ? 1 : -1), y));
            go(HW, ...hw(12, 17)); north(HW);
        }
        go(HW, ...hw(free()[0], 11));
        const inFree = () => ids.map(sn).find(e => e.mode !== 'sleep' && e.ty === hw(0, 14)[1] && free().includes(e.tx - 128));
        until(HW, () => !!inFree(), 900);
        const e = inFree(); if (e) puff(HW, e.tx - 128);
    }
    assert.ok(['nuA', 'nuB', 'nuC'].every(s => S.get(a, s)), 'all three');
    intoSlumber(HW);
    assert.equal(HW.G.map.id, 'slumber');
    noErrors(HW);
});
test('the garden: a cradle feels whoever is in it, Wren too, and lets nobody else in', () => {
    const HW = inWood();
    HW.warp('hollow', ...hw(16, 15)); HW.step(5);
    const a = HW.G.map, S = HW.global('Signals');
    HW.hold('up'); HW.step(20); HW.release(); HW.step(5);
    assert.deepEqual([HW.player().tx, HW.player().ty], hw(16, 14), 'standing in a cradle');
    assert.ok(S.get(a, 'nuA') && !S.get(a, 'nuB'), 'only her own');
    noErrors(HW);
});

test('Lantern Pond: wind the weir, and the raft runs down the channel into the lake at Millwater', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(25, 30)); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('hush_weir'), 'the weir wound up');
    go(HW, ...hw(25, 29)); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    assert.deepEqual([p.tx, p.ty], hw(26, 29), 'on the raft');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 900 && p.ty < hw(0, 32)[1]; i++) { HW.hold(['tool', p.tx < hw(29, 0)[0] ? 'right' : 'down']); HW.step(1); }
    HW.release();
    assert.ok(until(HW, () => p.ty >= 83, 1500), `carried down to the lake (at ${p.tx},${p.ty})`);
    noErrors(HW);
});

test('from the lake, the channel up to Hushwood is shut by the weir until it is wound from above', () => {
    const HW = loadGame();
    HW.preset('afterD3'); HW.step(10); HW.skipTalk();
    const p = HW.player();
    HW.warp('hollow', 128 + 18, 80 + 17); HW.step(10);
    HW.Inv.equipped = 'paddle';
    HW.walkTo(128 + 18, 80 + 16); HW.hold('up'); HW.step(12); HW.release(); HW.step(2);
    for (let i = 0; i < 2500 && !(p.tx === 128 + 29 && p.ty <= 80 + 3); i++) { HW.hold(['tool', p.ty > 80 + 6 ? 'up' : p.tx < 128 + 29 ? 'right' : 'up']); HW.step(1); }
    for (let i = 0; i < 1500; i++) { HW.hold(['tool', 'up']); HW.step(1); }
    HW.release();
    assert.ok(p.ty > hw(0, 32)[1], `stopped below the weir (at ${p.ty})`);
});

test('the far bank: over the log bridge; the moss hops you up onto the plateau (Heart Patch); the ledge lets you down', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(34, 13)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 9)[1] && p.state === 'normal', 200); HW.release(); HW.step(5);
    assert.equal(p.ty, hw(0, 9)[1], 'up on the plateau');
    go(HW, ...hw(36, 5)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    go(HW, ...hw(33, 9)); HW.hold('down'); HW.step(50); HW.release();
    assert.ok(p.ty >= hw(0, 11)[1], 'down off the ledge');
    noErrors(HW);
});

test("the giant's hollow (S16): only with the Bedroll laid up top; down there, Linnet's note; Homeward brings you back up", () => {
    const HW = inWood();
    go(HW, ...hw(4, 16)); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'no Bedroll: not going down there');
    HW.Inv.giveTool('bedroll');
    HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'not laid: still not');
    go(HW, ...hw(6, 18)); lay(HW);
    go(HW, ...hw(4, 16)); HW.face('left'); HW.press('act', 1); HW.skipTalk(0);
    HW.step(70); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hummock_hollow', 'down the hollow');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5);
    assert.equal(HW.Inv.bedroll.area, 'hollow', "the Bedroll can't be laid down here");
    go(HW, 13, 5);
    const p = HW.player();
    for (const x of [14, 15, 16, 17, 18]) { for (let i = 0; i < 40 && p.tx < x; i++) { HW.hold('right'); HW.step(1); } }
    for (let i = 0; i < 8; i++) { HW.hold('right'); HW.step(1); }
    HW.release();
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('linnet6'), "Linnet's sixth note");
    homeward(HW); HW.step(80);
    assert.equal(HW.G.map.id, 'hollow', 'Homeward, back up top');
    assert.deepEqual([p.tx, p.ty], hw(6, 18));
    noErrors(HW);
});

test("the giant's hollow: the roots can be climbed, the hard way, if there's no other way home", () => {
    const HW = inWood(['bedroll']);
    go(HW, ...hw(6, 18)); lay(HW);
    HW.warp('hummock_hollow', 9, 2); HW.step(10);
    HW.Inv.bedroll = null;
    HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(80); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'out, scraped and filthy');
});

const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(40); };
test("Lantern Pond: four lanterns, four stones, three stitches; the fourth stone pushed on and held; the isle's lantern lights", () => {
    const HW = afterD4(); HW.preset('afterD7'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 40; HW.Inv.stitches = [];
    HW.warp('hollow', ...hw(25, 30)); HW.step(10);
    const a = HW.G.map, S = HW.global('Signals'), lit = () => ['lpN', 'lpE', 'lpS', 'lpW'].filter(s => S.get(a, s));
    const far = (x, y) => assert.ok(HW.walkTo(x, y, 20000), `walk to ${x},${y}`);
    /* pushed on, a stone lights its lantern a moment, then goes home */
    go(HW, ...hw(24, 29)); HW.push('up', 2); HW.step(3);
    assert.deepEqual(lit(), ['lpW'], 'one lit');
    HW.step(260);
    assert.deepEqual(lit(), [], 'and out again: the stone went home');
    /* three stitched onto their stones for good */
    far(...hw(33, 25)); HW.face('left'); stitch(HW, 'LL');
    far(...hw(36, 30)); HW.face('up'); stitch(HW, 'UU');
    far(...hw(35, 32)); HW.face('left'); stitch(HW, 'LL');
    HW.step(200);
    assert.deepEqual(lit(), ['lpN', 'lpE', 'lpS'], 'three lit and staying lit');
    /* the fourth: pushed on and gripped */
    far(...hw(24, 29)); HW.push('up', 2); HW.hold('act'); HW.step(20);
    assert.deepEqual(lit(), ['lpN', 'lpE', 'lpS', 'lpW'], 'all four');
    HW.release(); HW.step(5);
    assert.ok(!a.find('lpIsle').hidden, 'something on the isle');
    /* over on the raft; the chest; the raft hooked back */
    const p = HW.player();
    far(...hw(25, 29)); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 300 && p.tx < hw(29, 0)[0]; i++) { HW.hold(['tool', 'right']); HW.step(1); }
    HW.release(); HW.hold('right'); HW.step(20); HW.release(); HW.step(5);
    assert.deepEqual([p.tx, p.ty], hw(30, 29), 'on the isle');
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    HW.step(200);
    HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    assert.ok(a.find('hwRaft').tx === hw(29, 0)[0], 'the raft hooked over to the isle');
    noErrors(HW);
});
test('on the isle, early: an old loom weight, lying in the moss', () => {
    const HW = afterD4();
    HW.warp('hollow', ...hw(30, 29)); HW.step(10);
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.items.oldweight, 'the loom weight');
    noErrors(HW);
});
test('the little wooden one: with the Crossbar (and the three asleep), walked through the hole into its cradle: a Heart Patch', () => {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.warp('hollow', ...hw(10, 19)); HW.step(10);
    const a = HW.G.map, S = HW.global('Signals');
    gardenByBell(HW);
    assert.ok(['nuA', 'nuB', 'nuC'].every(s => S.get(a, s)), 'three asleep');
    go(HW, ...hw(20, 10)); HW.face('left');
    HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    const doll = a.find('nuDolly');
    for (const d of ['left', 'left', 'left', 'up', 'up', 'up']) { HW.hold(d); until(HW, () => doll.mv, 12); until(HW, () => !doll.mv, 30); HW.release(); HW.step(3); }
    assert.deepEqual([doll.tx, doll.ty], hw(14, 7), 'in its cradle');
    HW.step(5);
    assert.ok(!a.find('nuPatch').hidden, 'all four asleep: a chest');
    HW.press('tool', 1); HW.step(5);
    go(HW, ...hw(13, 10)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    noErrors(HW);
});
