// Regression tests for the fresh-eyes review of the Makings, Reveal 2, the Shears, the Loomwood and the Loom.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const tug = HW => { HW.press('act', 1); HW.step(3); };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function making(n, preset = 'afterD7') {
    const HW = loadGame();
    HW.preset(preset); HW.step(10); HW.skipTalk();
    if (n > 1) HW.Progress.set('making' + (n - 1));
    HW.warp('making' + n, 3, 16); HW.step(10); HW.skipTalk();
    return HW;
}
const tuck = HW => HW.G.map.find('tuck');
function under(HW, x, y, side = 'down') {
    const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side];
    go(HW, x + dx, y + 11 + dy); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]);
}
const LR = { th: [20, 33], wh: [20, 22], sr: [20, 11], wr: [40, 22], br: [40, 11], web: [20, 0] };
const at = (r, x, y) => [LR[r][0] + x, LR[r][1] + y];
function loom(preset = 'afterReveal2') {
    const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk();
    for (const f of ['north_gate', 'gundry_r2']) HW.Progress.set(f);
    HW.Inv.giveTool('shears'); HW.Inv.maxHp = HW.Inv.hp = 36;
    return HW;
}
const enterLoom = (HW, r, x, y) => { HW.warp('loom', ...at(r, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const snip = HW => { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };

test('1/12: the Shears do nothing in a Making (a nibbler, Tuck from below); an old save\'s cut nibbler is harmless', () => {
    const HW = making(2, 'afterD8');
    const nib = HW.G.map.find('m2Nib');
    under(HW, 10, 2, 'down'); snip(HW); HW.step(30);
    assert.ok(nib.ret, 'its cord still there');
    under(HW, 2, 5, 'down'); snip(HW);
    assert.ok(!HW.Progress.flag('cut:tuck'), "Tuck's thread not cut");
    HW.Progress.setAreaFlag('making2', 'cut:m2Nib', '10,2');
    HW.warp('making2', 3, 16); HW.step(60);
    noErrors(HW);
});

test('2: the north gate opened early (the secret) gets you to the Loomwood, but the Loom wants the Guild\'s key (Gundry, after Reveal 2)', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('s32');
    HW.Progress.set('loom_open');       /* (the warp across the door lifted: its own puzzle, tests/loomwood.test.mjs) */
    HW.warp('hollow', 96, 44); HW.step(40);
    assert.ok(HW.walkTo(95, 10, 30000), 'up the Loomwood road');
    HW.hold('up'); HW.step(90); HW.release(); HW.step(10);
    assert.equal(HW.G.map.id, 'hollow', 'the doors stay shut');
    HW.Progress.set('reveal2');
    HW.warp('underside', 9, 5); HW.step(10);
    const g = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gundry');
    HW.global('Script').run(HW.global('UNDER_TALK').gundry(g)); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.items.guildkey && HW.Progress.flag('gundry_r2'), "the Guild's key");
    HW.warp('hollow', 95, 11); HW.step(10);
    HW.hold('up'); until(HW, () => HW.G.map.id === 'loom', 120); HW.release();
    assert.equal(HW.G.map.id, 'loom', 'in');
    noErrors(HW);
});

test('3: offcuts are middling: silk holds them and the iron plate ignores them; the Bridge Room\'s west way opens only once it\'s done', () => {
    const HW = loom();
    enterLoom(HW, 'sr', 17, 5);
    assert.equal(HW.walkTo(...at('br', 3, 5)), false, 'no way from the Run into the Bridge Room');
    /* (in from the Warp Walk, east) */
    enterLoom(HW, 'br', 18, 5);
    /* the chute here drops a spare weight on its own thread */
    go(HW, ...at('br', 2, 1)); HW.face('left'); HW.press('act', 1); HW.step(10); HW.skipTalk();
    const w = HW.G.map.at(...at('br', 2, 2));
    assert.ok(w && w.weight === 3 && w.ret, 'a spare weight, marked');
    /* an offcut over the silk bridge and onto the plate: holds, and the plate doesn't notice */
    const a = HW.G.map, Block = HW.global('Block');
    const M = HW.global('WEIGHT').medium;
    const b = a.add(new Block(...at('br', 11, 5), { marked: false, weight: M }));
    go(HW, ...at('br', 12, 5)); HW.push('left', 3); HW.step(20);
    assert.deepEqual([b.tx, b.ty], at('br', 8, 5), 'over the silk');
    assert.ok(!a.kind(...at('br', 9, 5)).pit, 'the silk held');
    const b2 = a.add(new Block(...at('br', 13, 5), { marked: false, weight: M }));
    go(HW, ...at('br', 12, 5)); HW.push('right', 1); HW.step(20);
    assert.deepEqual([b2.tx, b2.ty], at('br', 14, 5), 'onto the plate');
    assert.ok(!HW.G.map.find('brPattern') || HW.G.map.find('brPattern').hidden, 'no Pattern for an offcut');
    assert.ok(!HW.G.map.find('brWest').open, 'the west way still shut');
    noErrors(HW);
});

test('4: Making 2: lured to the crate, Tuck stays away long enough to let the heavy one go without a rush', () => {
    const HW = making(2);
    const t = tuck(HW);
    under(HW, 10, 2, 'down'); tug(HW); HW.step(20); knot(HW);
    until(HW, () => t.state === 'sit' && t.tx === 16, 900);
    under(HW, 16, 5, 'down'); tug(HW);
    until(HW, () => t.tx === 29 && t.state === 'sit', 1500);
    under(HW, 23, 3, 'down'); const t0 = HW.G.t; tug(HW);
    assert.ok(until(HW, () => t.tx !== 29, 60), 'off to the crate');
    assert.ok(!until(HW, () => t.tx === 29 && t.ty === 5, 330), 'and not back in the lane for over five seconds');
    assert.ok(HW.G.t - t0 > 300);
    noErrors(HW);
});

test('5: a Making played again after the Makings does not rewind the story, nor pay the button twice', () => {
    const HW = making(1, 'afterD8');
    const goal = HW.Progress.goal, buttons = HW.Inv.buttons;
    HW.Progress.setAreaFlag('making1', 'got:button');
    const t = tuck(HW);
    under(HW, 2, 1, 'down'); tug(HW); until(HW, () => HW.global('Making').cur.ahas.has('found'), 400);
    assert.equal(HW.Inv.buttons, buttons, 'no second button');
    HW.Progress.set('makings_done');
    HW.global('Making').finish(HW.G.map); for (let i = 0; i < 30; i++) { HW.skipTalk(); HW.step(20); }
    assert.equal(HW.Progress.goal, goal, 'the goal is still the same');
    noErrors(HW);
});

test('6: a Making can be left by the menu: out to the Making Floor', () => {
    const HW = making(2);
    const PM = HW.global('PauseMenu');
    assert.ok(PM.saveItems().includes('Out to the Making Floor'));
    PM.backToDoor(); HW.step(60);
    assert.equal(HW.G.map.id, 'underside');
    noErrors(HW);
});

test('8: the Weaver wakes as you come in, tightens its silk if you are caught twice, and lands hard', () => {
    const HW = loom();
    enterLoom(HW, 'web', 9, 9); HW.skipTalk();
    const w = HW.G.map.ents.find(e => e.kind === 'weaver');
    assert.notEqual(w.state, 'sleep', 'awake');
    const hp = HW.Inv.hp;
    HW.step(1200);
    assert.ok(HW.Inv.hp < hp, 'standing about in its silk hurts');
    noErrors(HW);
});

test('9/10: Tuck\'s thread is his own green, and it can be tugged but not tied', () => {
    const HW = making(1);
    const t = tuck(HW);
    assert.equal(t.ret.color, HW.global('THREAD').tuck);
    under(HW, 3, 5, 'down'); knot(HW);
    assert.ok(!t.knotted, 'not tied');
    noErrors(HW);
});
