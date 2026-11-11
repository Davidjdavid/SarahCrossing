// The Makings' last Little House, Wren's own (src/68c_makings_capstone.js): handed over after the Grand Hall, set out
// from underneath with the Needle, knots and the button's tin, Tuck let in by the lever and graded by the same Ahas;
// every way a run can end; the act ending with it; old saves. And two companions: Ives's Ballroom page saying how Wren
// really tidied it (src/68b_makings_more.js), and the quilt (src/78c_polish.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const tug = HW => { HW.press('act', 1); HW.step(3); };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
/* the Needle from a cord: walk it, and confirm (again: it was stitched before, so say "somewhere new" first) */
const stitch = (HW, moves, again) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); if (again) { HW.skipTalk(0); HW.step(2); } for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
function under(HW, x, y, side = 'down') {
    const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side];
    go(HW, x + dx, y + 11 + dy); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]);
}
/* every line said till it's quiet again, as "who: words" (picking the first choice when asked) */
function talk(HW) {
    const out = [], D = HW.global('Dialog');
    for (let i = 0; i < 8000 && (D.active || HW.global('Script').blocking()); i++) {
        if (D.active && D.shown >= D.pageLen()) { if (D.page === D.pages.length - 1) out.push((D.who || '-') + ': ' + D.pages.flat().join(' ')); if (D.choices) D.sel = 0; HW.press('act', 1); } else HW.step(1);
    }
    return out;
}
/* in her House, eight done (the hand-over seen) */
function house(preset = 'afterD7') {
    const HW = loadGame();
    HW.preset(preset); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = [];
    for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
    HW.Progress.set('cap_given');
    HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
    return HW;
}
const tuck = HW => HW.G.map.find('tuck');
const ahas = HW => [...HW.global('Making').cur.ahas].sort();
const letIn = HW => { go(HW, 7, 19); HW.face('down'); HW.press('act', 1); HW.step(5); };
const tin = (HW, i) => { go(HW, 3, 19); HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk(i); HW.step(5); };
const resetLever = HW => { go(HW, 5, 19); HW.face('down'); HW.press('act', 1); HW.step(5); };
/* the House worth three Ahas: the wooden block just past the north gap, the stone block in the south gap, the button
   under the wooden block */
function setOutWell(HW) {
    under(HW, 7, 2, 'down'); stitch(HW, 'RRR');
    under(HW, 7, 8, 'up'); stitch(HW, 'RR');
    tin(HW, 0);
}

test("after the Grand Hall, Gundry brings an empty one over, to Wren's face; the ninth door opens; the act isn't over", () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (let n = 1; n <= 7; n++) HW.Progress.set('making' + n);
    HW.warp('making8', 56, 16); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog');
    let near = null;
    HW.global('Making').finish(HW.G.map);
    const out = [];
    for (let i = 0; i < 6000 && (D.active || HW.global('Script').blocking() || i < 60); i++) {
        const g = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gundry'), p = HW.player();
        if (D.active && D.who === 'gundry' && g && near === null) near = Math.abs(g.tx - p.tx) + Math.abs(g.ty - p.ty);
        if (D.active && D.shown >= D.pageLen()) { out.push(D.pages.flat().join(' ')); HW.press('act', 1); } else HW.step(1);
    }
    assert.ok(out.some(l => /Your turn\. Make one\./.test(l)), 'Your turn. Make one.');
    assert.ok(near !== null && near <= 2, `Gundry beside Wren when he speaks (${near})`);
    assert.ok(HW.Progress.flag('making8') && !HW.Progress.flag('making9') && !HW.Progress.flag('makings_done'), 'one more to go');
    assert.match(HW.Progress.goal, /Little House of your own/);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'making9'), 'its door open');
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'), 'no Way Down yet');
    noErrors(HW);
});

test('her House as handed over: three things on their marks, the hoop, nobody in it; a cord under each thing', () => {
    const HW = house();
    const a = HW.G.map;
    assert.deepEqual(['capW', 'capP', 'capS'].map(id => [a.find(id).tx, a.find(id).ty]), [[7, 2], [7, 5], [7, 8]]);
    assert.ok(a.ents.some(e => e.kind === 'hoop' && e.little), 'the little hoop');
    assert.ok(!tuck(HW), 'nobody in it yet');
    HW.step(3);
    assert.deepEqual([...a.ents.filter(e => e.kind === 'cord').map(c => c.thing.id + '@' + c.tx + ',' + c.ty).sort()], ['capP@7,16', 'capS@7,19', 'capW@7,13']);
    noErrors(HW);
});

test('set out well (a block he can push past one gap, the stone in the other, the button under the block): three Ahas, and the act ends', () => {
    const HW = house();
    const a = HW.G.map;
    setOutWell(HW);
    const W = a.find('capW'), S = a.find('capS');
    assert.deepEqual([W.tx, W.ty, S.tx, S.ty], [10, 2, 9, 8], 'given their places');
    assert.equal(HW.global('Capstone').button(), 'capW', 'the button under the block');
    letIn(HW);
    const t = tuck(HW);
    assert.ok(t, 'in he comes');
    assert.ok(until(HW, () => t.state === 'sit', 900), 'he sits, stuck');
    assert.deepEqual([t.tx, t.ty], [8, 5], 'as near the hoop as he can get');
    under(HW, 10, 2, 'down'); tug(HW);
    assert.ok(until(HW, () => t.state === 'done', 1500), 'he pushed it out of the gap and on to the hoop');
    assert.deepEqual(ahas(HW), ['cleared', 'found', 'unhurt']);
    const said = talk(HW);
    assert.ok(said.some(l => /Ahas: 3 of 3\. Bumps: 0\./.test(l)), 'graded');
    assert.ok(said.some(l => /^ives: He moved that himself/.test(l)) && said.some(l => /^ambrose: Under the block!/.test(l)), 'the Makers say what happened');
    assert.ok(said.some(l => /^jory: What did I tell you\? On the stage\? I SAID\./.test(l)), 'and Jory, who said so');
    assert.ok(HW.Progress.flag('making9') && HW.Progress.get('making9_ahas') === 3);
    assert.ok(HW.Progress.flag('makings_done'), 'the act is over');
    assert.equal(HW.G.map.id, 'underside');
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'), 'the Way Down');
    assert.match(HW.Progress.goal, /Way Down/);
    noErrors(HW);
});

test('nothing set out: he walks straight through to the hoop; one Aha, and a word about corridors', () => {
    const HW = house();
    letIn(HW);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'done', 2000), 'straight through');
    assert.deepEqual(ahas(HW), ['unhurt']);
    const said = talk(HW);
    assert.ok(said.some(l => /corridor/.test(l)), said.join('\n'));
    assert.ok(said.some(l => /No button\?/.test(l)), 'no button hidden');
    assert.ok(HW.Progress.flag('making9') && HW.Progress.flag('makings_done'), 'any finish completes it');
    noErrors(HW);
});

test("a House he can't get anywhere in still finishes: he sits with nothing moving, says so, and gives up", () => {
    const HW = house();
    const a = HW.G.map;
    /* the stone in the south gap, the wooden block in the north gap and tied there: nothing he can move */
    under(HW, 7, 8, 'up'); stitch(HW, 'RR');
    under(HW, 7, 2, 'down'); stitch(HW, 'RR');
    under(HW, 9, 2, 'down'); knot(HW);
    assert.ok(a.find('capW').knotted);
    tin(HW, 1);
    letIn(HW);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 900));
    const t0 = HW.G.t;
    assert.ok(until(HW, () => HW.global('Capstone').ending, 3000), 'he gives up');
    assert.ok(HW.G.t - t0 >= 1400 && HW.G.t - t0 < 1700, `after twenty-five seconds (${HW.G.t - t0})`);
    const said = talk(HW);
    assert.ok(said.some(l => /^tuck: This one doesn't GO anywhere/.test(l)));
    assert.ok(said.some(l => /never got to the hoop\. Ahas: 0 of 3/.test(l)));
    assert.ok(said.some(l => /Every Maker builds one of those\. Once\./.test(l)));
    assert.ok(said.some(l => /^mallow: .*still under the pot/.test(l)), 'the button never found');
    assert.ok(HW.Progress.flag('making9') && HW.Progress.flag('makings_done'), 'and the act still ends');
    noErrors(HW);
});

test('while he sits, a tug starts the clock again (the button under the pot by him); and the lever pulled while he is in calls him out', () => {
    const HW = house();
    under(HW, 7, 8, 'up'); stitch(HW, 'RR');
    under(HW, 7, 2, 'down'); stitch(HW, 'RRR');
    tin(HW, 1);
    letIn(HW);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 900));
    HW.step(1200);
    /* the pot by him jumps: he gives it a push, and the clock starts again */
    const P = HW.G.map.find('capP'), C = HW.global('Capstone');
    under(HW, 7, 5, 'down'); tug(HW);
    assert.ok(C.run.quiet < 5, 'a jump counts as something happening');
    assert.ok(until(HW, () => P.ret.state === 'away', 120), 'he pushed it');
    assert.ok(ahas(HW).includes('found'), 'and found the button under it');
    assert.ok(until(HW, () => t.state === 'sit' && !P.mv && P.ret.state === 'home', 900), 'and it came home again');
    HW.step(1200);
    assert.ok(!C.ending, 'not given up yet');
    letIn(HW);
    assert.match(HW.global('Dialog').pages.flat().join(' '), /Call him out\?/);
    const said = talk(HW);
    assert.ok(said.some(l => /^tuck: Is it tea\?/.test(l)) && said.some(l => /called in for his tea/.test(l)));
    assert.ok(said.some(l => /^tess: Under the pot!/.test(l)), said.join('\n'));
    assert.ok(HW.Progress.flag('making9'));
    noErrors(HW);
});

test("he won't come in over something in his doorway; Gundry's lever sets it all back (not while he's in)", () => {
    const HW = house();
    const a = HW.G.map, P = a.find('capP');
    under(HW, 7, 5, 'down'); stitch(HW, 'LLLL');
    under(HW, 3, 5, 'down'); stitch(HW, 'LL', true);
    assert.deepEqual([P.tx, P.ty], [1, 5], 'the pot just inside his door');
    under(HW, 7, 8, 'up'); knot(HW);
    tin(HW, 2);
    letIn(HW);
    assert.ok(!tuck(HW), "he can't get in");
    resetLever(HW);
    assert.deepEqual(['capW', 'capP', 'capS'].map(id => [a.find(id).tx, a.find(id).ty]), [[7, 2], [7, 5], [7, 8]], 'every thing on its mark');
    assert.ok(!a.find('capS').knotted && !a.find('capP').stitched, 'untied, unstitched');
    assert.equal(HW.Inv.stitches.filter(s => s.area === 'making9').length, 0, "the Needle's stitches back");
    assert.equal(HW.global('Capstone').button(), null, 'the button back in its tin');
    assert.ok(!a.ents.some(e => e.kind === 'treasure'));
    letIn(HW);
    assert.ok(tuck(HW), 'in he comes now');
    resetLever(HW);
    assert.match(HW.global('UI').toasts.map(t => t.s).join(' '), /Not while he's in/);
    noErrors(HW);
});

test('her House stays as she left it between goes: places, knots and the button', () => {
    const HW = house();
    setOutWell(HW);
    under(HW, 9, 8, 'up'); knot(HW);
    HW.global('PauseMenu').backToDoor(); HW.step(60);
    assert.equal(HW.G.map.id, 'underside');
    HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
    const a = HW.G.map, W = a.find('capW'), S = a.find('capS');
    assert.deepEqual([W.tx, W.ty, S.tx, S.ty], [10, 2, 9, 8]);
    assert.ok(S.knotted, 'still tied');
    assert.equal(HW.global('Capstone').button(), 'capW');
    const tr = a.ents.find(e => e.kind === 'treasure');
    assert.ok(tr && tr.tx === 10 && tr.ty === 2, 'the button under the block');
    /* and a save in the middle of setting out loads and plays on */
    HW.Save.write(1);
    const H2 = loadGame(); H2.global('Game').load(HW.Save.read(1)); H2.step(30); H2.skipTalk();
    assert.equal(H2.G.map.id, 'making9');
    assert.ok(H2.G.map.find('capS').knotted && H2.G.map.find('capW').tx === 10);
    letIn(H2);
    assert.ok(tuck(H2));
    noErrors(HW); noErrors(H2);
});

test('a bump in her House: a heavy thing let go back along its old way, through him where he sits; the Makers wince, and say so', () => {
    const HW = house();
    const a = HW.G.map, S = a.find('capS');
    /* the pot in the south gap, the wooden block past the north one; the stone given a place up the west room, by way of
       the very tile he'll sit on */
    under(HW, 7, 5, 'down'); stitch(HW, 'DDRD');
    under(HW, 8, 8, 'up'); stitch(HW, 'R', true);
    under(HW, 7, 8, 'up'); stitch(HW, 'RUUU');
    under(HW, 8, 5, 'down'); stitch(HW, 'U', true);
    under(HW, 7, 2, 'down'); stitch(HW, 'RRR');
    assert.deepEqual([S.tx, S.ty, a.find('capP').tx, a.find('capP').ty], [8, 4, 9, 8]);
    letIn(HW);
    const t = tuck(HW);
    assert.ok(until(HW, () => t.state === 'sit', 900));
    assert.deepEqual([t.tx, t.ty], [8, 5], 'on the stone\'s old way');
    /* unpick the stone's stitch: home it goes, the way it came, through him */
    under(HW, 8, 4, 'down'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); HW.skipTalk(1); HW.step(2);
    assert.ok(until(HW, () => HW.global('Making').cur.bumps === 1, 300), 'Ow!');
    assert.ok(a.ents.filter(e => e.kind === 'npc' && ['ives', 'bram', 'tess'].includes(e.who)).every(n => n.bubble === 'bang'), 'the Makers wince');
    assert.ok(until(HW, () => t.state === 'sit', 1200));
    letIn(HW);
    const said = talk(HW);
    assert.ok(said.some(l => /^tess: One bump\./.test(l)), said.join('\n'));
    assert.ok(said.some(l => /Bumps: 1\./.test(l)));
    noErrors(HW);
});

test('S30: three Ahas in all nine, the last in her own, and Tuck draws a picture', () => {
    const HW = house();
    for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n + '_ahas', 3);
    setOutWell(HW);
    letIn(HW);
    const t = tuck(HW);
    until(HW, () => t.state === 'sit', 900);
    under(HW, 10, 2, 'down'); tug(HW);
    assert.ok(until(HW, () => t.state === 'done', 1500));
    talk(HW);
    assert.ok(HW.Progress.flag('s30') && HW.Inv.items.tuckdrawing, 'the drawing');
    noErrors(HW);
});

test('old saves: all eight done but the act never closed (a save from before her House) gets the hand-over on the Making Floor', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (const f of ['gundry_job', 'making1', 'making2', 'making3', 'making4', 'making5', 'making6', 'making7', 'making8']) HW.Progress.set(f);
    HW.warp('underside', 49, 5); HW.step(3);
    const said = talk(HW);
    assert.ok(said.some(l => /Your turn\. Make one\./.test(l)), said.join('\n'));
    assert.ok(HW.Progress.flag('cap_given') && !HW.Progress.flag('makings_done'));
    noErrors(HW);
});

test('old saves: an act already finished (eight Houses and the Way Down) has her House to play, and nothing else changes', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (const f of ['gundry_job', 'making1', 'making2', 'making3', 'making4', 'making5', 'making6', 'making7', 'making8', 'makings_done']) HW.Progress.set(f);
    HW.Progress.setGoal('Somewhere else entirely.');
    HW.warp('underside', 49, 5); HW.step(30);
    assert.ok(!HW.global('Script').blocking(), 'no hand-over now');
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'making9') && HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'));
    HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
    letIn(HW);
    assert.ok(until(HW, () => tuck(HW).state === 'done', 2000));
    talk(HW);
    assert.equal(HW.Progress.goal, 'Somewhere else entirely.', 'the story is where it was');
    assert.ok(HW.Progress.flag('making9'));
    noErrors(HW);
});

test('the afterMakings preset: every Little House done, hers too; the Way Down open', () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    assert.ok(HW.Progress.flag('making9') && HW.Progress.get('making9_ahas') === 3 && HW.Progress.flag('makings_done'));
    assert.ok(HW.G.map.ents.some(e => e.kind === 'warp' && e.to === 'deep'));
    HW.step(60);
    assert.ok(!HW.global('Script').blocking(), 'nothing owed');
    noErrors(HW);
});

/* ================= Ives's Ballroom page: how Wren really did it ================= */
const BR = [20, 11];
const ball = (x, y) => [BR[0] + x, BR[1] + y];
function tidy() {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'tidy', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1; HW.Inv.giveTool('gloves'); HW.step(5);
    HW.warp('tidy', ...ball(6, 8)); HW.face('down'); HW.press('act', 1);
    return HW;
}
test("Ives's Ballroom page: held one back and let the other by", () => {
    const HW = tidy();
    const A = HW.G.map.find('ballA'), B = HW.G.map.find('ballB');
    go(HW, ...ball(5, 7)); HW.face('left');
    let held = false;
    for (let i = 0; i < 600 && !held; i++) { HW.step(1); if (B.tx === BR[0] + 4 && B.ty === BR[1] + 7) { HW.hold(['act']); HW.step(2); held = !!HW.player().grip; } }
    assert.ok(held);
    until(HW, () => HW.Return.isHome(A), 900);
    HW.release(); HW.step(2); go(HW, ...ball(6, 8));
    assert.ok(until(HW, () => HW.Progress.flag('tidy_ballDone'), 1500));
    assert.equal(HW.Stats.c['ball:held'], 1);
    assert.ok(!HW.Stats.c['ball:unjammed']);
    assert.match(HW.global('ballroomMemo')(), /held the one back and let the other by/);
    noErrors(HW);
});
test("Ives's Ballroom page: let them jam, then pulled one back out of the way", () => {
    const HW = tidy();
    const A = HW.G.map.find('ballA'), B = HW.G.map.find('ballB');
    HW.step(500);
    go(HW, B.tx - 1, B.ty);
    HW.face('right'); HW.hold(['act']); HW.step(3); HW.hold(['act', 'left']);
    for (let i = 0; i < 600 && B.tx > BR[0] + 4; i++) HW.step(1);
    HW.release(); HW.step(20);
    go(HW, ...ball(4, 4)); HW.face('down'); HW.hold(['act']); HW.step(3); HW.hold(['act', 'up']);
    for (let i = 0; i < 200 && B.ty > BR[1] + 4; i++) HW.step(1);
    HW.release(); HW.step(2); go(HW, ...ball(1, 2));
    assert.ok(until(HW, () => HW.Progress.flag('tidy_ballDone'), 1500));
    assert.equal(HW.Stats.c['ball:unjammed'], 1);
    assert.ok(!HW.Stats.c['ball:held'], 'counted once, as what it was');
    assert.match(HW.global('ballroomMemo')(), /let them jam nose to nose/);
    noErrors(HW);
});
test("Ives's Ballroom page: a save that can't say how it was done says nothing it can't know", () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(5); HW.skipTalk();
    const page = HW.global('ballroomMemo')();
    assert.doesNotMatch(page, /held|jam/);
    assert.match(page, /one of them had to wait its turn/);
    noErrors(HW);
});

/* ================= the quilt ================= */
const quilt = HW => { HW.warp('gran_room', 7, 4); HW.step(10); HW.skipTalk(); HW.face('down'); HW.press('act', 1); HW.step(2); return talk(HW).join('\n'); };
test('the quilt: the valley\'s secrets without how many there are; what is only seen is not sewn on', () => {
    const HW = loadGame(); HW.preset('afterD8'); HW.step(10); HW.skipTalk();
    const Q = HW.global('Quilt'), row = () => Q.tally().find(r => r[0] === 'Secrets of the valley');
    const n0 = row()[1];
    for (const f of ['s07', 's08', 's09', 's10', 's18', 's33', 's35']) HW.Progress.set(f);
    assert.equal(row()[1], n0, 'the costume, the keys, the Well, the Bell in flight, the faint, the motto: not counted');
    HW.Progress.set('s31');
    assert.equal(row()[1], n0 + 1);
    const read = quilt(HW);
    assert.match(read, /Secrets of the valley: \d+\s/);
    assert.doesNotMatch(read, /Secrets of the valley: \d+ of/);
    assert.match(read, /Linnet's notes: \d+ of 8/, 'the rest keep theirs');
    noErrors(HW);
});
test('the quilt grows while Gran is shut in under the Well, and nobody has been up the stairs', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    assert.doesNotMatch(quilt(HW), /new patch/, 'nothing new yet');
    HW.Progress.set('s31'); HW.Progress.set('fav_kite');
    assert.match(quilt(HW), /Two new patches since Gran shut herself in\. Nobody has been up the stairs\./);
    /* before the Hall of Names, or after the Unwinding: no such line */
    HW.Progress.set('unwound');
    assert.doesNotMatch(quilt(HW), /up the stairs/);
    const H2 = loadGame(); H2.preset('afterMakings'); H2.step(10); H2.skipTalk();
    H2.Progress.set('s31');
    assert.doesNotMatch(quilt(H2), /up the stairs/);
    noErrors(HW); noErrors(H2);
});
test('the quilt, a save from before Gran was counted: no number it can\'t know, only what came since the last look', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('s31');
    const s = HW.Save.snapshot(); delete s.progress.flags.quiltR2;
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(30); H2.skipTalk();
    const first = quilt(H2);
    assert.doesNotMatch(first, /new patch|up the stairs/);
    H2.Progress.set('fav_kite');
    const second = quilt(H2);
    assert.match(second, /New patches since you last looked\. Nobody has been up the stairs\./);
    assert.doesNotMatch(second, /\d+ new patch|One new|Two new/);
    noErrors(H2);
});
