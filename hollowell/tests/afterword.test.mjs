// After the end (src/80d_after.js): on the bench by Gran's gate, Gran says a thing or two she felt on Wren's thread, and
// what she couldn't; in the open cellar, her ledger. Trajectories played through the real game (tests/afterword_paths.mjs)
// come out differently; the same play always comes out the same (again, after a save, after idling, in short sittings,
// with more play after the end); older saves say only what they can; every combination keeps its shape and never says
// two things about the same thing; nothing of it shows before the end; the real end notes the evidence; the probe is quiet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { LEG9 } from './legs.mjs';
import { wander, bench, cellar, listen, WANDERS } from './afterword_paths.mjs';

const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* what each trajectory is meant to bring out: the bench's two, and what the ledger keeps */
const EXPECT = {
    straight: ['straight', 'tally'], explorer: ['granlean', 'fogblades'], reviser: ['declined', 'blades'], idler: ['waited', 'nocut'],
    outoforder: ['gate', 'firstcut'], twoways: ['firstcut', 'holdtuck'], neverfell: ['left', 'linnet'],
};
const END = ["gran: After the fog I couldn't feel you at all. So let me look at you.", "gran: ...Your scarf's crooked.", 'linnet: Leave it, Mum.', "gran: I'm leaving it."];
const plain = l => l.replace(/\{(happy|sad|surprised|cross|worried|neutral)\}/g, '');
const LEFTOVER = /undefined|NaN|null|\[object|\{|\}|\d/;
/* the lines said after sitting down, up to the end */
const said = lines => { const i = lines.findIndex(l => l.startsWith('You sit down between them')); return i < 0 ? [] : lines.slice(i + 1).map(plain); };

const RESULTS = {};
for (const [name, spec] of Object.entries(WANDERS)) {
    test(`a Wander played ${name}: what Gran says on the bench, and what her ledger keeps`, () => {
        const HW = wander(spec);
        const b = bench(HW), x = HW.afterword();
        assert.deepEqual(x.bench, EXPECT[name], `${name}: ${x.lines.bench.join(' | ')}`);
        const s = said(b);
        assert.ok(s.length >= END.length + 1, 'something said');
        assert.deepEqual(s.slice(-END.length), END, 'and it ends the same way for everybody');
        assert.ok(s.length - END.length <= 4, 'four lines at most before that');
        for (const l of s) assert.ok(!LEFTOVER.test(l), 'no leftovers: ' + l);
        const c = cellar(HW);
        const page = c.slice(c.findIndex(l => l.startsWith("Down the steps it's cool")));
        assert.ok(page.length >= 3 && /^"Wren at the fog with the Shears\." Under that, nothing/.test(page[page.length - 2]), page.join(' | '));
        assert.match(page[page.length - 1], /Last night she fell out of bed\. Nobody caught her\. She laughed\."$/);
        for (const l of page) assert.ok(!LEFTOVER.test(plain(l)), 'no leftovers: ' + l);
        assert.ok(HW.Progress.flag('aft:sat') && HW.Progress.flag('aft:ledger'));
        RESULTS[name] = { bench: x.bench, ledger: x.ledger, lines: s.slice(0, -END.length).join(' / ') };
        noErrors(HW);
    });
}

test('materially different play, materially different words', () => {
    const names = Object.keys(RESULTS);
    assert.equal(names.length, Object.keys(WANDERS).length, 'every trajectory played');
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const a = RESULTS[names[i]], b = RESULTS[names[j]];
        assert.notEqual(a.lines, b.lines, `${names[i]} and ${names[j]} say the same`);
        assert.ok(a.bench.some(k => !b.bench.includes(k)) || b.bench.some(k => !a.bench.includes(k)), `${names[i]} and ${names[j]} pick the same`);
    }
    /* (the straight way through gets as many words as everything found) */
    for (const n of names) assert.ok(RESULTS[n].bench.length === 2, n + ': two things');
});

test('the same play says the same: again, after a save and load, with more leaning on people after the end; the ledger too', () => {
    const HW = wander(WANDERS.explorer);
    const first = HW.afterword().lines;
    const b = bench(HW);
    assert.deepEqual(said(b), first.bench.map(plain), 'what was said is what it worked out');
    /* sat once: after that, Gran's own new lines, no seat offered */
    const again = bench(HW);
    assert.ok(!again.some(l => l.startsWith('Between them')) && again.length === 1 && again[0].startsWith('gran: '), again.join(' | '));
    /* everyone free now: leaning on them is nobody's thread any more */
    HW.Stats.c['budge:burr'] = 99; HW.Stats.c['budge:gran'] = 0; HW.Progress.set('s32', false);
    assert.deepEqual(HW.afterword().lines, first, 'noted when the threads went slack; nothing after changes it');
    HW.Save.write(1); const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(HW._store.get('hollowell-slot-1')))); H2.step(10);
    assert.deepEqual(H2.afterword().lines, first, 'and loaded elsewhere, the same');
    assert.deepEqual(cellar(HW), cellar(HW), 'the ledger reads the same twice');
    noErrors(HW); noErrors(H2);
});

test('idling for hours, or playing in short sittings with a save and load between each, changes nothing', () => {
    const idle = wander(WANDERS.idler).afterword(), still = wander(Object.assign({}, WANDERS.idler, { idle: 0 })).afterword();
    assert.deepEqual(idle.bench, still.bench); assert.deepEqual(idle.lines, still.lines, 'time on the clock is never evidence');
    assert.ok(!JSON.stringify(idle.evidence).includes('playFrames') && !idle.candidates.some(c => /minute|hour|time spent/.test(c.why)), 'nor is it looked at');
    const long = wander(WANDERS.reviser).afterword(), short = wander(Object.assign({}, WANDERS.reviser, { reloads: true })).afterword();
    assert.deepEqual(short.lines, long.lines, 'short sittings: the same');
});

test('older saves: only what they can say, with no number that\'s short and no "never" they can\'t back', () => {
    /* first loaded with this in Act II, the Bell already in hand: cuts are kept from then, rings aren't counted */
    const early = wander(Object.assign({}, WANDERS.explorer, { old: 'early' })), e1 = early.afterword();
    assert.ok(!e1.evidence.kept && e1.evidence.keptCuts && !e1.evidence.keptWell);
    assert.ok(!e1.bench.some(k => ['straight', 'tally', 'tally0'].includes(k)), e1.bench.join(','));
    assert.ok(!e1.lines.bench.concat(e1.lines.ledger).some(l => /times you rang|That makes/.test(l)), 'the Bell, with no count');
    assert.match(e1.lines.ledger[e1.lines.ledger.length - 1], /"Caught her every time, this Wander\./, 'and the ledger with no number');
    /* first loaded after the people were cut: who first, and who was left, aren't known */
    const late = wander(Object.assign({}, WANDERS.neverfell, { old: 'late' })), l1 = late.afterword();
    assert.ok(!l1.evidence.keptCuts && !l1.bench.some(k => ['firstcut', 'left', 'declined'].includes(k)), l1.bench.join(','));
    /* a save that had already ended: the evidence noted from what it kept, when first asked */
    const done = wander(Object.assign({}, WANDERS.twoways, { old: 'done' })), d0 = done.Progress.get('aft:snap');
    assert.equal(d0, undefined, 'nothing noted yet');
    const d1 = done.afterword();
    assert.ok(done.Progress.get('aft:snap') && d1.evidence.atSelf === null && !d1.evidence.keptCuts);
    assert.ok(!d1.bench.some(k => ['firstcut', 'left', 'declined', 'nocut', 'straight', 'freeothers', 'tally', 'tally0'].includes(k)), d1.bench.join(','));
    assert.ok(d1.bench.includes('holdtuck'), 'what older saves did keep still counts: ' + d1.bench.join(','));
    const b = bench(done);
    assert.deepEqual(said(b), d1.lines.bench.map(plain));
    /* a save from the first days of the game, already over: nothing kept at all but that it ended */
    const HW = loadGame();
    const old = { game: 'hollowell', v: 1, name: 'Wren', inv: { tools: ['gloves', 'hook', 'shears'] }, progress: { flags: { ceremony: true, talkedGran: true, reveal2: true, cut_self: true, unwound: true } }, stats: { c: { falls: 3 } }, pos: { area: 'hollow', x: 95 * 16 + 8, y: 63 * 16 + 10 } };
    HW.global('Game').load(HW.Save.fromCode('HW1:' + Buffer.from(JSON.stringify(old)).toString('base64'))); HW.step(10);
    const o = HW.afterword();
    assert.deepEqual(o.bench, ['tallyOld'], o.lines.bench.join(' | '));
    assert.equal(said(bench(HW))[0], 'gran: Every time you fell, I wound you home. Every one.');
    for (const H of [early, late, done, HW]) noErrors(H);
});

/* any evidence at all, made up: the shape always holds */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
test('every combination: two things at most, never two about the same thing, a contradiction only second, the same shape, nothing unfilled, and no claim the record can\'t back', () => {
    const HW = loadGame(); HW.preset('afterEnding'); HW.step(5); HW.skipTalk();
    const A = HW.global('After'), town = A.town(), r = rng(20261111), pick = a => a[Math.floor(r() * a.length)], fill = t => HW.Story.fill(t);
    const seen = new Set();
    for (let n = 0; n < 4000; n++) {
        const kept = r() < 0.7, keptCuts = r() < 0.8, keptWell = r() < 0.6, heavy = r() < 0.3;
        const e = {
            v: 1, kept, keptCuts, keptWell, fog: pick([0, 0, 1, 2, 3, 5, 9, 14, 23]), self: pick([0, 0, 0, 1, 2, 3]), atSelf: r() < 0.2 ? null : pick([0, 0, 1, 4, 8, 12, 19]),
            cuts: town.filter(() => r() < (heavy ? 0.9 : 0.25)), no: r() < 0.3 ? [pick(town), 1 + Math.floor(r() * 3)] : null, lean: r() < 0.5 ? [pick(town), 1 + Math.floor(r() * 15)] : null,
            gran: pick([0, 0, 0, 1, 3]), all: r() < 0.15, hold: r() < 0.3, tuck: pick([0, 0, 1, 2, 5]), gate: r() < 0.15, notes: Math.floor(r() * 9),
            bell: r() < 0.4, rings: pick([0, 0, 1, 2, 7]), waited: pick([0, 0, 3, 6, 12]), peep: r() < 0.3,
            home: kept ? pick([0, 1, 2, 13, 41, 120]) : null, top: pick([null, { place: 'The Millrace' }, { place: 'Millwater' }, { faint: true }, { fog: true }]), fell: r() < 0.8,
        };
        const { bench: b, ledger: l } = A.pick(e), ids = b.map(x => x.id), lines = A.benchLines(e), page = A.ledgerLines(e);
        seen.add(ids.join('+'));
        const why = `${n}: ${ids.join('+')} from ${JSON.stringify(e)}`;
        assert.ok(b.length <= 2 && l.length <= 4, why);
        const clash = (x, y) => x.groups.some(g => y.groups.includes(g));
        if (b.length === 2) assert.ok(!clash(b[0], b[1]) && !b[0].contra, 'never two about the same thing; a contradiction second: ' + why);
        for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) assert.ok(!clash(l[i], l[j]) && l[i].ord <= l[j].ord, 'the ledger: ' + why);
        assert.deepEqual(lines.slice(-4).map(([w, t]) => w + ': ' + plain(t)), END, why);
        assert.ok(lines.length - 4 >= 1 && lines.length - 4 <= 4, why);
        assert.equal(lines.length === 5 && !b.length, lines[0][1].startsWith('{happy}I felt every step'), 'the plain line only when there is nothing else: ' + why);
        for (const t of lines.map(([, t]) => fill(t)).concat(page.map(fill))) assert.ok(!LEFTOVER.test(plain(t)) && t.length < 260, `"${t}" (${why})`);
        /* only what the record can back */
        if (!e.kept) assert.ok(!ids.some(k => ['straight', 'tally', 'tally0'].includes(k)), why);
        if (!e.keptCuts) assert.ok(!ids.some(k => ['firstcut', 'left'].includes(k)), why);
        if (e.atSelf === null) assert.ok(!ids.some(k => ['straight', 'nocut', 'freeothers'].includes(k)), why);
        if (!e.keptWell) assert.ok(!lines.some(([, t]) => /times you rang/.test(t)), why);
        /* and the same evidence, the same words */
        assert.deepEqual(A.benchLines(JSON.parse(JSON.stringify(e))), lines, why);
    }
    assert.ok(seen.size >= 40, `a real variety of pairings (${seen.size})`);
    noErrors(HW);
});

test('nothing shows before the end: no seat offered, the cellar still locked, nothing in the goal, notes or journal', () => {
    const HW = loadGame(); HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    const gran = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gran');
    HW.warp('hollow', gran.tx, gran.ty + 1); HW.step(10); HW.skipTalk();
    const at = listen(HW, () => { HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); });
    assert.ok(at.length && !at.some(l => /bench|Between them/.test(l)), at.join(' | '));
    HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.warp('gran_house', 2, 6); HW.step(10); HW.skipTalk();
    const door = listen(HW, () => { HW.face('left'); HW.press('act', 1); HW.step(3); HW.skipTalk(); });
    assert.deepEqual(door, ['The cellar door. Locked from the inside now.']);
    /* a whole Wander's worth of what's kept, and none of it anywhere a player reads */
    const W = wander(WANDERS.explorer), x = W.afterword();
    assert.ok(/^after the end/.test(x.stage));
    const shown = JSON.stringify([W.Progress.goal, W.Progress.notes, W.Progress.journal]);
    assert.ok(!/aft:|leant on me|ledger/.test(shown), shown);
    assert.deepEqual(Object.keys(W.Progress.flags).filter(k => k.startsWith('aft:')).sort(), ['aft:cuts', 'aft:sat', 'aft:snap'].filter(k => k in W.Progress.flags).sort(), 'flags of its own: these only');
    assert.ok(Object.keys(W.Stats.c).filter(k => k.startsWith('aft:')).every(k => /^aft:(watch|keptCuts|keptWell|no:.+|cutsAtSelf|well)$/.test(k)), 'counters of its own: these only');
    noErrors(HW); noErrors(W);
});

test('the bench: "Not now" leaves it for later; sitting, Wren is drawn in the middle seat and gets up in front of it', () => {
    const HW = loadGame(); HW.preset('afterEnding'); HW.step(10); HW.skipTalk();
    const no = bench(HW, 1);
    assert.ok(no.some(l => l.startsWith('Between them')) && !no.some(l => l.startsWith('You sit down')), no.join(' | '));
    assert.ok(!HW.Progress.flag('aft:sat'), 'not sat yet');
    /* sitting: the seat between them, and her drawn in it */
    for (let i = 0; i < 8 && !HW.walkTo(78, 54, 3000); i++) HW.step(40);
    HW.face('up'); HW.press('act', 1); HW.step(3);
    const D = HW.global('Dialog'), p = HW.player();
    const asked = () => D.active && D.choices && D.page === D.pages.length - 1 && D.shown >= D.pageLen();
    for (let i = 0; i < 600 && !asked(); i++) { if (D.active && D.shown >= D.pageLen()) HW.press('act', 1); else HW.step(1); }
    assert.ok(asked() && /Between them/.test(D.pages.flat().join(' ')), 'the seat offered');
    D.sel = 0; HW.press('act', 1); HW.step(20);
    assert.deepEqual(p.benchSeat, { tx: 79, ty: 53 }, 'in the middle seat');
    assert.equal(`${p.tx},${p.ty}`, '79,54', 'standing, for the game, in front of it');
    const Gfx = HW.global('Gfx'), calls = [], sub0 = Gfx.sub;
    Gfx.sub = (im, sx, sy, sw, sh, x, y) => { calls.push([im, x, y, sh]); return sub0.call(Gfx, im, sx, sy, sw, sh, x, y); };
    try { HW.global('Game').render(); } finally { Gfx.sub = sub0; }
    const wren = HW.global('personFrame')('wren', HW.global('DOWN'), 0), Cam = HW.global('Cam');
    assert.ok(calls.some(([im, x, , sh]) => im === wren && Math.round(x) === Math.round(79 * 16 - Cam.x) && sh === wren.height - 5), 'drawn sitting, to the waist, like Gran and Linnet');
    HW.skipTalk();
    assert.ok(!p.benchSeat && HW.Progress.flag('aft:sat'), 'up again');
    assert.equal(`${p.tx},${p.ty}`, '79,54');
    assert.ok(!HW.G.map.blockers.some(b => b.blocks(79, 54, {})), 'and nothing left keeping the tile');
    /* Linnet's end of the bench offers the seat too, until it's been sat on */
    const H2 = loadGame(); H2.preset('afterEnding'); H2.step(10); H2.skipTalk();
    for (let i = 0; i < 8 && !H2.walkTo(80, 54, 3000); i++) H2.step(40);
    const l = listen(H2, () => { H2.face('up'); H2.press('act', 1); H2.step(3); H2.skipTalk(); });
    assert.ok(l[0].startsWith('linnet: ') && l.some(s => s.startsWith('You sit down')), l.join(' | '));
    noErrors(HW); noErrors(H2);
});

test('the probe, every frame drawn: the bench and the ledger, nothing out of place', () => {
    const HW = wander(WANDERS.explorer);
    const P = HW.probe(true); HW.drawEveryStep(true); P.reset();
    bench(HW); cellar(HW);
    const r = P.report(); HW.drawEveryStep(false); HW.probe(false);
    assert.ok(r.frames > 200, 'drawn');
    const mine = r.issues.filter(x => x.kind !== 'slow');
    assert.equal(mine.length, 0, mine.map(x => `[${x.kind}] ${x.key} -- ${x.where} ${x.detail}`).join('\n'));
    noErrors(HW);
});

test('the real end (LEG9, the Loom to the credits) notes the evidence as the threads go slack, and the bench follows it', () => {
    const HW = loadGame();
    LEG9(HW);
    const snap = HW.Progress.get('aft:snap');
    assert.ok(snap && snap.v === 1, 'noted at the Unwinding');
    assert.ok(HW.Stats.c['aft:cutsAtSelf'] === 0, 'and at the cut: nobody cut loose before her own');
    const b = bench(HW);
    assert.deepEqual(said(b), HW.afterword().lines.bench.map(plain));
    noErrors(HW);
});
