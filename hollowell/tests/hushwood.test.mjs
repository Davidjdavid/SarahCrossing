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
   a puffball west of each, and over the door a lamp for each, on a cord to it. Snorelings keep the same rule here as in the
   House: woken, they follow Wren a while, then lie down in the nearest bed they can get to (their own spot, a cradle nobody's
   in, the Bedroll); a cradle with somebody in it lets nobody else in; a puffball's spores put whoever's in reach to sleep
   where they stand. Somebody asleep in each cradle, the door opens */
const ids = ['nuSnoreA', 'nuSnoreB', 'nuSnoreC'];
const cradled = (HW, c) => ids.map(i => HW.G.map.find(i)).find(e => e.tx === hw(c, 0)[0] && e.ty === hw(0, 14)[1]);
const asleepIn = (HW, c) => HW.G.map.ents.some(e => e.type === 'snoreling' && e.alive && e.mode === 'sleep' && e.tx === hw(c, 0)[0] && e.ty === hw(0, 14)[1]);
const north = HW => { const p = HW.player(); go(HW, ...hw(12, 16)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 11)[1] && p.state === 'normal', 120); HW.release(); HW.step(4); };
const south = HW => { const p = HW.player(); go(HW, ...hw(11, 11)); HW.hold('left'); until(HW, () => p.ty >= hw(0, 15)[1] && p.state === 'normal', 120); HW.release(); HW.step(4); go(HW, ...hw(10, 17)); };
/* walk to and fro beside a sleeper (on row y) till it stirs: treading near wakes it */
const stir = (HW, id, y) => { const e = HW.G.map.find(id), x = e.tx - 128; for (let i = 0; i < 30 && e.mode === 'sleep'; i++) go(HW, ...hw(x + (i % 2 ? 1 : -1), y)); return e.mode !== 'sleep'; };
const puff = (HW, c) => { go(HW, ...hw(c - 1, 11)); HW.face('down'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(70); };
const intoSlumber = HW => { go(HW, ...hw(19, 10)); go(HW, ...hw(19, 9)); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); };
export function gardenByBell(HW) {
    /* rung from the north bank by the far cradles, the two nearest wake and come, pressing into the cradles under her (the
       only way toward her over the water); done chasing, each lies down in the bed it's standing in. The third, too far off
       to hear, is woken by treading near it and led round to the first cradle, where it gives up and lies down too */
    north(HW);
    go(HW, ...hw(20, 11));
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10);
    go(HW, ...hw(24, 11));
    assert.ok(until(HW, () => asleepIn(HW, 20) && asleepIn(HW, 24), 900), 'two asleep in the far cradles');
    south(HW);
    assert.ok(stir(HW, 'nuSnoreA', 16), 'the third woken');
    north(HW); go(HW, ...hw(16, 11));
    assert.ok(until(HW, () => asleepIn(HW, 16), 900), 'and asleep in the first');
}
test('the garden: rung awake from across the stream, two come and lie down in the far cradles; the third led to the first; the door opens', () => {
    const HW = inWood();
    const S = HW.global('Signals'), a = HW.G.map;
    gardenByBell(HW);
    assert.ok(['nuA', 'nuB', 'nuC'].every(s => S.get(a, s)), 'three asleep in three cradles');
    assert.ok(ids.every(i => a.find(i).mode === 'sleep'));
    assert.ok(['nuPuffA', 'nuPuffB', 'nuPuffC'].every(i => a.find(i).state === 'ripe'), '(no puffball needed)');
    intoSlumber(HW);
    assert.equal(HW.G.map.id, 'slumber', 'the door open');
    assert.ok(HW.Progress.flag('slumber_open'), 'and open to her from now on');
    noErrors(HW);
});
test('the garden, the other way: woken one at a time by treading near; each led to a free cradle and left to give up there', () => {
    const HW = inWood();
    const S = HW.global('Signals'), a = HW.G.map;
    north(HW);
    /* the first two led round by the moss and along the far bank: each slips into the first free cradle under her */
    for (const [id, c, y] of [['nuSnoreA', 16, 17], ['nuSnoreB', 20, 18]]) {
        south(HW);
        assert.ok(stir(HW, id, y), id + ' woken (from the row behind it: the one asleep in a cradle sleeps on)');
        north(HW); go(HW, ...hw(c, 11));
        assert.ok(until(HW, () => asleepIn(HW, c), 900), id + ' asleep in cradle ' + c);
    }
    /* the third needn't go round: led along this bank to beside the last cradle, it lies down in it when it gives up */
    south(HW); go(HW, ...hw(18, 18));
    assert.ok(stir(HW, 'nuSnoreC', 18), 'the third woken');
    for (let i = 0; i < 12 && !asleepIn(HW, 24); i++) { go(HW, ...hw(26, 17)); go(HW, ...hw(26, 15)); }
    assert.ok(until(HW, () => asleepIn(HW, 24), 900), 'asleep in the last');
    assert.ok(['nuA', 'nuB', 'nuC'].every(s => S.get(a, s)), 'all three');
    go(HW, ...hw(12, 18)); north(HW);
    intoSlumber(HW);
    assert.equal(HW.G.map.id, 'slumber');
    noErrors(HW);
});
test('the garden: the puffballs still put one down where it stands, in a cradle at once, if you would rather not wait', () => {
    const HW = inWood();
    const a = HW.G.map;
    north(HW); go(HW, ...hw(20, 11));
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10);
    go(HW, ...hw(24, 11));
    assert.ok(until(HW, () => { const e = cradled(HW, 24); return e && e.mode !== 'sleep'; }, 400), 'one awake in the far cradle, still after her');
    puff(HW, 24);
    assert.ok(asleepIn(HW, 24), 'asleep there now');
    noErrors(HW);
});
/* (the blind solver's findings, round B: one law everywhere, and the door's link to its cradles seen) */
test("the House's rule in the wood: woken and followed, a Snoreling done chasing lies down in the nearest bed it can get to, a cradle as soon as its own spot", () => {
    const HW = inWood();
    const a = HW.G.map, e = a.find('nuSnoreB'), others = ['nuSnoreA', 'nuSnoreC'].map(i => a.find(i));
    /* (from the road, so the others sleep on) */
    go(HW, ...hw(16, 18));
    assert.ok(stir(HW, 'nuSnoreB', 18), 'woken');
    north(HW); go(HW, ...hw(16, 11));
    assert.ok(until(HW, () => e.mode === 'sleep', 1200), 'it gave up in good time (as quick as the ones in the House)');
    assert.deepEqual([e.tx, e.ty], hw(16, 14), 'in the cradle it was standing in, not back in its own spot');
    assert.ok(['nuPuffA', 'nuPuffB', 'nuPuffC'].every(i => a.find(i).state === 'ripe'), 'no puffball had a hand in it');
    assert.ok(others.every(o => o.mode === 'sleep' && o.tx === o.hx && o.ty === o.hy), '(the others slept through it)');
    /* woken and not led anywhere, it gives up beside its own spot and goes back to that, the nearest bed */
    const c = others[1];
    south(HW); go(HW, ...hw(18, 18));
    assert.ok(stir(HW, 'nuSnoreC', 18), 'another woken');
    go(HW, ...hw(21, 19));
    assert.ok(until(HW, () => c.mode === 'sleep', 1200), 'gave up');
    assert.deepEqual([c.tx, c.ty], [c.hx, c.hy], 'back in its own spot');
    noErrors(HW);
});
test('the road in: one asleep in the road wakes as you pass, follows a while, and lies down in a bed that is not its own', () => {
    const HW = inWood();
    /* (the giant gone, walked in from town along the road, and stopped at the turn up to the moss) */
    HW.warp('hollow', ...hw(0, 20)); HW.step(10);
    const e = HW.G.map.find('hwSnore1');
    assert.ok(HW.G.map.kind(e.tx, e.ty) === HW.G.map.kind(...hw(4, 20)) && e.mode === 'sleep', 'asleep in the road');
    go(HW, ...hw(6, 20)); go(HW, ...hw(12, 19));
    assert.ok(e.mode !== 'sleep', 'it woke as she went by');
    assert.ok(until(HW, () => e.mode === 'sleep', 1200), 'and gave up after a while');
    assert.deepEqual([e.tx, e.ty], hw(13, 21), 'in the cradle by the road');
    /* led on over the moss instead, it's a garden cradle it lies down in (and its lamp lights over the door) */
    const H2 = inWood();
    H2.warp('hollow', ...hw(0, 20)); H2.step(10);
    const e2 = H2.G.map.find('hwSnore1');
    go(H2, ...hw(6, 20)); go(H2, ...hw(12, 19)); north(H2); go(H2, ...hw(19, 10));
    assert.ok(until(H2, () => e2.mode === 'sleep', 1200), 'gave up');
    assert.deepEqual([e2.tx, e2.ty], hw(16, 14), 'in the first garden cradle');
    assert.ok(H2.global('Signals').get(H2.G.map, 'nuA'), 'which counts');
    noErrors(HW); noErrors(H2);
});
test("the door's three lamps: one for each cradle, on a cord to it, lit while somebody's in it", () => {
    const HW = inWood();
    HW.warp('hollow', ...hw(19, 11)); HW.step(30);
    const a = HW.G.map, G = HW.global('Gfx'), Game = HW.global('Game');
    const lamps = () => {
        const lit = [], dark = [], c0 = G.circle;
        G.circle = function (x, y, r, col) { if (r === 3 && col === '#f7e08a') lit.push(x); if (r === 3 && col === '#5a4a8a') dark.push(x); return c0.apply(this, arguments); };
        try { Game.render(); } finally { G.circle = c0; }
        return [lit.length, dark.length];
    };
    assert.deepEqual(lamps(), [0, 3], 'three dark lamps over the shut door');
    const put = (id, c) => { const e = a.find(id); e.x = hw(c, 0)[0] * 16 + 8; e.y = hw(0, 14)[1] * 16 + 10; };
    put('nuSnoreB', 20); HW.step(3);
    assert.deepEqual(lamps(), [1, 2], 'one lit for the cradle with somebody in it');
    put('nuSnoreA', 16); put('nuSnoreC', 24); HW.step(3);
    assert.deepEqual(lamps(), [3, 0], 'all three');
    noErrors(HW);
});
test("nobody gives the step away: Hettie, the Moonwalk's sign and Pillow Fort's say how things are, not what to do", () => {
    const HW = inWood();
    const hettie = String(HW.global('TALK').hettie);
    assert.ok(!/any bed|not fussy/i.test(hettie), "Hettie doesn't say any bed will do");
    HW.warp('slumber', 29, 42); HW.step(10); HW.skipTalk();
    const signs = HW.G.map.ents.filter(e => e.kind === 'sign').map(e => e.text).join(' / ');
    assert.ok(signs.includes('PILLOW FORT') && signs.includes('THE MOONWALK'), 'both signs there');
    assert.ok(!/ANY bed/.test(signs), "Pillow Fort's sign doesn't say any bed");
    assert.ok(!/walked it in time/.test(signs), "the Moonwalk's sign doesn't say walking won't do");
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
test('the little wooden one: with the Crossbar (and the three asleep), walked through the hole into its cradle: thirty buttons', () => {
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
    const b0 = HW.Inv.buttons;
    go(HW, ...hw(13, 10)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.buttons, b0 + 30, 'thirty buttons');
    noErrors(HW);
});
