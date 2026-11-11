// The top of the Great Spool (src/75_greatspool.js, SpoolTop; its look src/75b_spool_art.js): the six great threads in
// three pairs, Gran changing the room after each (the crates; what she throws; the dark); Linnet's bracelet; the end,
// a hand held rather than a choice from a menu; Gran's tally at the top; saves made at every stage, and older ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { slackAndCut, junkAndCut, darkAndCut, holdGransHand } from './legs.mjs';

const TOP = [20, 0], at = (x, y) => [TOP[0] + x, TOP[1] + y];
const HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const settle = HW => { for (let i = 0; i < 12; i++) { HW.step(5); HW.skipTalk(); } };
const post = (HW, h) => HW.G.map.ents.find(e => e.kind === 'greatpost' && e.house === h);
const cut = (HW, ...hs) => hs.every(h => HW.Progress.flag('great:' + h));
const top = HW => HW.global('SpoolTop');
const drum = HW => HW.G.map.find('theSpool');
const junk = HW => HW.G.map.ents.filter(e => e.kind === 'gsjunk');
const go = (HW, x, y) => { for (let k = 0; k < 5 && !HW.walkTo(...at(x, y)); k++) { HW.step(20); HW.skipTalk(); } assert.deepEqual([HW.player().tx, HW.player().ty], at(x, y), `walk to ${x},${y}`); };
/* everything said, from here on */
function listen(HW) { const lines = [], D = HW.Dialog, open0 = D.open; D.open = function (who, t, o) { lines.push({ who, t: String(t), choices: o && o.choices }); return open0.call(this, who, t, o); }; return lines; }
/* up the Climb into the top room, every Knot untied: Gran */
function atTop(o = {}) {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36;
    if (o.tally) Object.assign(HW.Stats.c, o.tally);
    if (o.bracelet) HW.Inv.items.bracelet = 1;
    for (const h of HOUSES) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    for (const f of o.flags || []) HW.Progress.set(f);
    HW.lines = listen(HW);
    HW.warp('greatspool', 29, 11); HW.step(30); HW.skipTalk();
    HW.walkTo(29, 10); HW.hold('up'); HW.step(60); HW.release(); HW.step(10);
    settle(HW);
    return HW;
}
const lowest = HW => { for (const h of ['slumber', 'marionette']) slackAndCut(HW, post(HW, h), TOP); settle(HW); };
const middle = HW => { for (const h of ['mill', 'belfry']) junkAndCut(HW, post(HW, h)); settle(HW); };
/* a save, loaded into a fresh game, and up into the top room */
function reload(HW) {
    const s = JSON.parse(JSON.stringify(HW.Save.snapshot()));
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(s)); H2.step(5);
    H2.lines = listen(H2);
    H2.step(30);
    assert.equal(H2.G.map.id, 'greatspool'); assert.equal(H2.Cam.room.key, '1,0', 'back at the top');
    return H2;
}

test('the count: Gran says the tally to your face at the top, once (in words; without a number for a save that kept none)', () => {
    const say = HW => HW.lines.filter(l => l.who === 'gran').map(l => l.t).find(t => /brought you home/.test(t));
    const H1 = atTop({ tally: { tally: 1, 'home:fall': 37, faints: 3, 'home:yank': 1 } });
    assert.match(say(H1), /Forty-one times this Wander I brought you home\. I can't now\./);
    const H2 = atTop({ tally: { tally: 1, 'home:yank': 1 } });
    assert.match(say(H2), /Once this Wander I brought you home/);
    const H3 = atTop();
    assert.match(say(H3), /Every time you fell this Wander, I brought you home/);
    assert.ok(!/\d|once|twice| times/i.test(say(H3)), 'no number from a save that can\'t say');
    /* (said once: not again on coming back up) */
    H1.warp('greatspool', ...at(9, 9)); H1.step(30); settle(H1);
    assert.equal(H1.lines.filter(l => /brought you home/.test(l.t)).length, 1, 'once');
    [H1, H2, H3].forEach(noErrors);
});

test('the first pair: the higher four are wound round Gran\'s hands and won\'t give; the lowest two run free, and a crate dragged along one makes it sag: cut', () => {
    const HW = atTop();
    assert.deepEqual(HOUSES.filter(h => post(HW, h).held).sort(), ['belfry', 'kiln', 'mill', 'tidy'], 'four in her hands');
    assert.equal(top(HW).stage(), 0);
    /* a crate thrown onto a held thread lies there and is wound in as anything is; the thread doesn't give */
    const c = HW.G.map.find('gsCrateC');
    go(HW, 4, 8); HW.face('down'); HW.press('act', 1); HW.step(20);
    go(HW, 3, 8); HW.face('up'); HW.press('act', 1); HW.step(30);
    assert.deepEqual([c.tx, c.ty], at(3, 4), 'down on the middle-left thread');
    assert.ok(post(HW, 'mill').under(...at(2, 5)) === false && post(HW, 'mill').tiles.some(([x, y]) => x === c.tx && y === c.ty), 'its line, held');
    assert.ok(until(HW, () => c.ret.state === 'home' && !c.pendingHome, 900), 'wound in and back on its shelf');
    assert.equal(post(HW, 'mill').slack, 0, 'and the thread never gave');
    /* cut a held one: it won't */
    go(HW, 2, 5); HW.face('left'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(!cut(HW, 'mill'), 'held');
    assert.ok(HW.global('UI').toasts.some(t => /wound round her hand/.test(t.s)), 'and why');
    lowest(HW);
    assert.ok(cut(HW, 'slumber', 'marionette'), 'the lowest pair cut');
    noErrors(HW);
});

test('Gran changes the room after the first pair: the crates up into the drum, the middle two free; she throws at where you stand (its shadow first): on you, it knocks you about; off you, it lies a while and she has it back', () => {
    const HW = atTop();
    lowest(HW);
    assert.ok(HW.Progress.flag('gs_s1'), 'changed');
    assert.ok(HW.lines.some(l => l.who === 'gran' && /No more of that/.test(l.t)), 'she says so');
    assert.ok(top(HW).crates(HW.G.map).every(e => e.stowed && e.tx < 0), 'the crates up in the drum');
    assert.deepEqual(HOUSES.filter(h => post(HW, h).held).sort(), ['kiln', 'tidy'], 'the middle pair let go to the drum');
    const p = HW.player(), d = drum(HW);
    go(HW, 9, 7);
    assert.ok(until(HW, () => d.toss, 400), 'a throw coming');
    assert.deepEqual([d.toss.tx, d.toss.ty], [p.tx, p.ty], 'at where she stands');
    const hp = HW.Inv.hp, there = () => junk(HW).filter(e => e.tx === p.tx && e.ty === p.ty).length;
    assert.ok(until(HW, () => !d.toss, 100), 'down');
    assert.ok(p.inv > 0, 'knocked about');
    assert.equal(HW.Inv.hp, hp, 'nothing to unravel');
    assert.equal(there(), 0, 'and it went straight back up');
    /* stepped off as it comes: it lies there */
    HW.step(40); go(HW, 9, 7);
    assert.ok(until(HW, () => d.toss, 400));
    const [tx, ty] = [d.toss.tx, d.toss.ty];
    go(HW, 10, 7);
    assert.ok(until(HW, () => junk(HW).some(e => e.tx === tx && e.ty === ty), 100), 'it landed where she stood');
    const j = junk(HW).find(e => e.tx === tx && e.ty === ty);
    assert.ok(!['mill', 'belfry'].some(h => post(HW, h).slack > 0), 'off the threads, nothing gives');
    assert.ok(until(HW, () => j.removed, 400), 'she has it back');
    noErrors(HW);
});

test('what she throws, come down on a free thread, is dragged along it: it sags; cut. Pushed onto one, the same; on a held one, nothing', () => {
    const HW = atTop();
    lowest(HW);
    junkAndCut(HW, post(HW, 'mill'));
    assert.ok(cut(HW, 'mill'), 'the middle-left cut');
    /* one landed beside the other free thread, pushed onto it (it's only a thing) */
    const d = drum(HW), q = post(HW, 'belfry'), [bx, by] = q.tiles[2], p = HW.player();
    let pushed = false;
    for (let tries = 0; tries < 8 && !pushed; tries++) {
        until(HW, () => !d.toss, 200);
        go(HW, bx - TOP[0], by + 1);
        if (!until(HW, () => d.toss, 400) || d.toss.tx !== bx || d.toss.ty !== by + 1) continue;
        go(HW, bx - TOP[0], by + 2);
        if (!until(HW, () => junk(HW).some(e => e.tx === bx && e.ty === by + 1), 100)) continue;
        /* from below it, push it up onto the thread */
        HW.face('up'); HW.push('up', 1); HW.step(2);
        pushed = junk(HW).some(e => e.tx === bx && e.ty === by) || q.slack > 0;
    }
    assert.ok(pushed, 'pushed onto the thread');
    assert.ok(until(HW, () => q.slack > 0, 100), 'dragged along it: slack');
    noErrors(HW);
});

test('after the second pair: the floor under the last two goes into the dark, the crates come back down, the throwing stops; thrown into the dark a crate is only back on its shelf; wound north over it, one hangs on its thread and drags the great thread: cut from the ledge below the post', () => {
    const HW = atTop();
    lowest(HW); middle(HW);
    assert.ok(cut(HW, 'mill', 'belfry'), 'the middle pair cut');
    assert.ok(HW.Progress.flag('gs_s2'), 'changed again');
    const a = HW.G.map, dark = top(HW).DARK;
    assert.ok(dark.every(([x, y]) => a.kind(...at(x, y)).pit), 'the floor gone under the last two');
    assert.ok(!a.kind(...at(1, 2)).pit && !a.kind(...at(18, 2)).pit && !a.kind(...at(1, 3)).pit, 'but the posts, and a ledge below each');
    assert.ok(top(HW).crates(a).every(e => !e.stowed), 'the crates let down');
    HW.step(120);
    assert.ok(top(HW).crates(a).every(e => e.ret.state === 'home' && e.tx === e.ret.mx && e.ty === e.ret.my), 'on their shelves');
    HW.step(600);
    assert.ok(!drum(HW).toss && !junk(HW).length, 'no more throwing');
    /* thrown into the dark: down, and back on its shelf; nothing gives */
    const c = a.find('gsCrateC');
    go(HW, 4, 8); HW.face('down'); HW.press('act', 1); HW.step(20);
    go(HW, 4, 6); HW.face('up'); HW.press('act', 1); HW.step(30);
    assert.ok(until(HW, () => c.ret.state === 'home' && c.tx === c.ret.mx && c.ty === c.ret.my && !c.pendingHome, 300), 'back on its shelf');
    assert.equal(post(HW, 'tidy').slack, 0, 'the thread never gave');
    /* left off its shelf under the line: wound north, out over the dark on its thread, across the great thread */
    let hung = false;
    const watch = () => { if (c.ty <= 2 && a.kind(c.tx, c.ty).pit && c.ret.state === 'returning') hung = true; return post(HW, 'tidy').slack > 0; };
    go(HW, 4, 8); HW.face('down'); HW.press('act', 1); HW.step(20);
    go(HW, 4, 9); HW.face('up'); HW.press('act', 1);
    assert.ok(until(HW, watch, 600), 'dragged along it: slack');
    assert.ok(hung, 'hanging over the dark on its thread as it went');
    go(HW, 1, 3); HW.face('up'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(cut(HW, 'tidy'), 'cut from the ledge');
    /* (walking into the dark, Wren climbs out where she went in) */
    go(HW, 3, 3); HW.hold('up'); HW.step(60); HW.release(); HW.step(60);
    assert.equal(HW.player().state, 'normal'); assert.ok(!a.kind(HW.player().tx, HW.player().ty).pit, 'out of the dark');
    darkAndCut(HW, post(HW, 'kiln'));
    assert.ok(HOUSES.every(h => cut(HW, h)), 'all six');
    noErrors(HW);
});

test('the end: no menu. Linnet comes and takes one of Gran\'s hands; the other is yours: held (not tapped), Gran tries twice to take it back to the Spool and then lets go; let go first and it waits', () => {
    const HW = atTop();
    lowest(HW); middle(HW);
    for (const h of ['tidy', 'kiln']) darkAndCut(HW, post(HW, h));
    for (let i = 0; i < 4000 && !HW.G.map.climax; i++) { HW.skipTalk(); HW.step(1); }
    const a = HW.G.map, c = a.climax;
    assert.ok(c, 'Linnet has one of her hands');
    const g = a.ents.find(e => e.who === 'gran'), l = c.linnet, p = HW.player();
    assert.equal(Math.abs(l.tx - g.tx) + Math.abs(l.ty - g.ty), 1, 'beside her');
    assert.ok(HW.global('Ending').hands.includes(l) && HW.global('Ending').hands.includes(g), 'hand in hand');
    assert.ok(HW.lines.some(l => l.who === 'linnet' && /Mum\./.test(l.t)), 'Mum.');
    assert.ok(!HW.lines.some(l => l.choices), 'no menu');
    assert.ok(!HW.lines.some(l => /You have to let them choose it|Nobody pulled me/.test(l.t)), 'no speech');
    assert.equal(HW.Progress.goal, "Take Gran's other hand.");
    const s = l.tx < g.tx ? 1 : -1;
    go(HW, g.tx + s - TOP[0], g.ty - TOP[1]); HW.face(s > 0 ? 'left' : 'right'); HW.step(2);
    assert.ok(HW.global('UI').toasts.some(t => /to take her hand/.test(t.s)), 'how');
    /* a tap: nothing said, nothing taken */
    HW.press('act', 1); HW.step(30);
    assert.ok(a.climax && !HW.Dialog.active && !HW.Progress.flag('unwound'), 'a tap does nothing');
    /* held a moment and let go: her hand goes back to the Spool, and it waits (how far the hold got unpicks only slowly:
       tests/review_blind_d.test.mjs) */
    let tugs = 0; const sfx = HW.global('Sfx'), play0 = sfx.play; sfx.play = function (n, ...r) { if (n === 'tug') tugs++; return play0.call(this, n, ...r); };
    HW.hold('act'); HW.step(60);
    assert.equal(p.grip, g, 'her hand in yours');
    assert.ok(HW.global('Ending').hands.includes(p), 'drawn so');
    const h0 = a.climax.h;
    HW.release(); HW.step(30);
    assert.ok(a.climax && a.climax.h > 0 && a.climax.h < h0 && !HW.global('Script').running('finale'), 'let go: it waits');
    assert.ok(!HW.global('Ending').hands.includes(p), 'her hand back to the Spool');
    /* held again: she tries twice in all, then lets go */
    HW.hold('act'); HW.step(200); HW.release();
    assert.equal(tugs, 2, 'she tries twice');
    for (let i = 0; i < 200 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('unwound'), 'she let go: the Unwinding');
    assert.ok(HW.lines.some(l => /She lets go of the Spool/.test(l.t)));
    noErrors(HW);
});

test('Linnet\'s bracelet: shown at the first pair, she lets the middle pair go and the room goes quiet; after the lowest pair, straight to the dark; at the end she walks up the north road with Linnet. Without it, the middle pair is hers to throw at', () => {
    const HW = atTop({ bracelet: true });
    const g = HW.G.map.ents.find(e => e.who === 'gran');
    HW.walkTo(g.tx, g.ty + 1); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); settle(HW);
    assert.ok(HW.Progress.flag('bracelet_top') && cut(HW, 'mill', 'belfry') && !cut(HW, 'slumber') && !cut(HW, 'tidy'), 'the middle pair let go by her');
    assert.ok(HW.lines.some(l => /the room goes quiet/.test(l.t)));
    HW.step(800);
    assert.ok(!drum(HW).junk.some(j => j.high) && !drum(HW).toss, 'quiet: nothing comes off the walls');
    lowest(HW);
    assert.ok(HW.Progress.flag('gs_s2') && !HW.Progress.flag('gs_s1'), 'straight to the dark');
    assert.ok(top(HW).crates(HW.G.map).every(e => !e.stowed), 'the crates never taken');
    for (const h of ['tidy', 'kiln']) darkAndCut(HW, post(HW, h));
    holdGransHand(HW);
    for (let i = 0; i < 300 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    for (let i = 0; i < 300 && !HW.Progress.flag('bracelet_given'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.lines.some(l => /Two people are walking up it/.test(l.t) && /bracelet/.test(l.t)), 'up the north road together');
    assert.ok(!HW.Inv.items.bracelet && HW.Progress.flag('bracelet_given'), 'hers now');
    assert.ok(!HW.lines.some(l => /You give Linnet her bracelet back/.test(l.t)), 'not given again on the bench');
    /* without it: she throws */
    const H2 = atTop();
    lowest(H2);
    assert.ok(until(H2, () => drum(H2).toss, 400), 'the middle pair: she throws');
    [HW, H2].forEach(noErrors);
});

test('saves: each stage comes back as she left it (the crates up in the drum and her throwing; the dark and the crates back); a save from just after a pair, before she changed the room, changes it on the way in', () => {
    const HW = atTop();
    lowest(HW);
    const H1 = reload(HW);
    assert.ok(top(H1).crates(H1.G.map).every(e => e.stowed), 'stage two: the crates up in the drum');
    assert.deepEqual(HOUSES.filter(h => post(H1, h).held).sort(), ['kiln', 'tidy']);
    assert.ok(until(H1, () => drum(H1).toss, 400), 'and she throws');
    middle(HW);
    const H2 = reload(HW);
    assert.ok(top(H2).DARK.every(([x, y]) => H2.G.map.kind(...at(x, y)).pit), 'stage three: the dark');
    assert.ok(top(H2).crates(H2.G.map).every(e => !e.stowed && e.tx === e.ret.mx), 'the crates on their shelves');
    H2.step(600); assert.ok(!drum(H2).toss, 'no throwing');
    for (const h of ['tidy', 'kiln']) darkAndCut(H2, post(H2, h));
    holdGransHand(H2);
    for (let i = 0; i < 200 && !H2.Progress.flag('unwound'); i++) { H2.skipTalk(); H2.step(10); }
    assert.ok(H2.Progress.flag('unwound'), 'and to the end');
    /* saved after the lowest pair's last cut, before the room changed (an autosave there) */
    const H3 = atTop();
    for (const h of ['slumber', 'marionette']) H3.Progress.set('great:' + h);
    const H4 = reload(H3);
    settle(H4);
    assert.ok(H4.Progress.flag('gs_s1') && top(H4).crates(H4.G.map).every(e => e.stowed), 'the room changed on the way in');
    assert.ok(H4.lines.some(l => /No more of that/.test(l.t)));
    [HW, H1, H2, H3, H4].forEach(noErrors);
});

test('older saves: threads cut in any order go on from the lowest pair still standing; one shown the bracelet when it let three go has the middle pair let go too', () => {
    /* the old top room took threads in any order: two of them cut, the top-left and the middle-left */
    const HW = atTop({ flags: ['great:tidy', 'great:mill'] });
    assert.equal(top(HW).stage(), 0);
    assert.ok(post(HW, 'belfry').held && post(HW, 'kiln').held && !post(HW, 'mill').held && !post(HW, 'tidy').held, 'what\'s left of the higher pairs, in her hands');
    lowest(HW);
    junkAndCut(HW, post(HW, 'belfry')); settle(HW);
    assert.ok(HW.Progress.flag('gs_s2'), 'on to the dark');
    darkAndCut(HW, post(HW, 'kiln'));
    holdGransHand(HW);
    for (let i = 0; i < 200 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('unwound'), 'to the end');
    /* the old bracelet let three go (the first three in the Spool's order) */
    const H2 = atTop({ bracelet: true, flags: ['bracelet_top', 'great:tidy', 'great:kiln', 'great:mill'] });
    assert.ok(cut(H2, 'belfry'), 'the rest of the middle pair let go too');
    lowest(H2);
    holdGransHand(H2);
    for (let i = 0; i < 200 && !H2.Progress.flag('unwound'); i++) { H2.skipTalk(); H2.step(10); }
    assert.ok(H2.Progress.flag('unwound'), 'the lowest pair, and the end');
    [HW, H2].forEach(noErrors);
});
