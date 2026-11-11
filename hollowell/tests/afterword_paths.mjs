// Whole Wanders in miniature, for the last conversation on the bench and the ledger in the cellar (src/80d_after.js):
// the real game a stretch at a time (a preset for where the story has got to, with everything done before carried
// over), each thing done the way a player does it where that's quick (the Bell at the Well, leaning on Gran, walking
// into the fog, the Shears on people and on Wren's own thread, sitting about for hours) and noted as the game itself
// notes it where it isn't (a find, a hold in the Hall, a fall in a House); then the Unwinding, the bench and the cellar,
// with every line that's said.
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

/* everything said while fn runs */
export function listen(HW, fn) {
    const lines = [], D = HW.Dialog, open0 = D.open;
    D.open = function (who, t, o) { lines.push((who ? who + ': ' : '') + HW.Story.fill(t)); return open0.call(this, who, t, o); };
    try { fn(); } finally { D.open = open0; }
    return lines;
}
/* on to a later preset, keeping what was done before (the preset's own flags win where both have one) */
function carry(HW, preset) {
    const c = JSON.parse(JSON.stringify(HW.Stats.c)), f = JSON.parse(JSON.stringify(HW.Progress.flags)), frames = HW.Stats.playFrames;
    HW.preset(preset); HW.step(10); HW.skipTalk();
    /* (a preset starts a new game, which marks what it keeps from then: the Wander carried on keeps its own marks) */
    for (const k of Object.keys(HW.Stats.c)) if ((k.startsWith('aft:') || k === 'tally') && !(k in c)) delete HW.Stats.c[k];
    Object.assign(HW.Stats.c, c); HW.Stats.playFrames += frames;
    for (const [k, v] of Object.entries(f)) if (!(k in HW.Progress.flags)) HW.Progress.flags[k] = v;
}
/* a save and a load, as quitting and coming back would */
function reload(HW) { HW.Save.write(1); const s = HW.Save.read(1); HW.global('Game').load(s); HW.step(10); HW.skipTalk(); }
const add = (HW, k, n) => { HW.Stats.c[k] = (HW.Stats.c[k] || 0) + n; };

/* spec: { kept (default true), old: 'early' | 'late' | 'done' (a save from before this was kept: loaded first in Act II,
   in Act IV after the Shears, or after the end), falls: {place: n}, faints, fog, bell, granLean, budges: {who: n},
   s01, waited, homeward (flights to the Bedroll), idle (frames), tuck, gate, hold, notes, peep, cuts: [who | [who, notYets]], self (not-yets at the fog),
   reloads (a save and load between stretches), after: fn(HW) (in the free valley, before the bench) } */
export function wander(spec = {}) {
    const HW = loadGame(), p = () => HW.player(), S = HW.global('Shears');
    /* Act II (after the Festival): the Bell, Gran by the Well, the fog */
    HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    if (spec.kept !== false) HW.Stats.c.tally = 1;
    if (spec.old) { for (const k of Object.keys(HW.Stats.c)) if (k.startsWith('aft:')) delete HW.Stats.c[k]; delete HW.Stats.c.tally; }
    if (spec.old === 'early') reload(HW);
    for (const [place, n] of Object.entries(spec.falls || {})) { add(HW, 'home:fall', n); add(HW, 'home@' + place, n); add(HW, 'falls', n); }
    if (spec.faints) { add(HW, 'faints', spec.faints); HW.Progress.set('faintHome', spec.faints); }
    if (spec.bell) {
        HW.warp('hollow', 95, 60); HW.step(10); HW.skipTalk();
        for (let k = 0; k < spec.bell; k++) { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(60); HW.skipTalk(); HW.step(5); }
        assert.ok(HW.Progress.flag('s09'), 'the Bell rung at the Well');
    }
    if (spec.granLean) {
        HW.warp('hollow', 95, 61); HW.step(10); HW.skipTalk();
        const gran = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gran');
        for (let k = 0; k < spec.granLean; k++) { assert.ok(HW.walkTo(gran.tx - 1, gran.ty), 'beside Gran'); HW.face('right'); HW.push('right', 1); HW.step(220); HW.skipTalk(); }
        assert.ok(HW.Stats.c['budge:gran'] >= spec.granLean, 'leant on Gran');
    }
    for (const [who, n] of Object.entries(spec.budges || {})) { add(HW, 'budge:' + who, n); HW.Progress.set('budged:' + who); }
    if (spec.s01) HW.Progress.set('s01');
    if (spec.fog) {
        HW.warp('hollow', 100, 60); HW.step(10); HW.skipTalk();
        for (let k = 0; k < spec.fog; k++) { HW.Story.fogPull(p()); for (let i = 0; i < 300 && (p().state !== 'normal' || HW.Script.blocking()); i++) { HW.skipTalk(); HW.step(1); } }
    }
    if (spec.waited) add(HW, 'waited', spec.waited);
    if (spec.homeward) add(HW, 'homeward', spec.homeward);
    if (spec.idle) { HW.step(spec.idle); HW.Stats.playFrames += 60 * 60 * 60 * 9; for (const r of Object.values(HW.Stats.rooms)) r.t += 60 * 60 * 40; }
    if (spec.reloads) reload(HW);
    /* Act III, as the game notes it */
    carry(HW, 'afterD8');
    if (spec.tuck) { add(HW, 'tuck:yanked', spec.tuck); HW.Progress.set('tuck_yanked'); }
    if (spec.gate) { HW.Progress.set('s32'); HW.Progress.set('north_gate'); }
    if (spec.hold) { HW.Progress.set('hall_held'); add(HW, 'hall:held', 240); }
    for (let n = 1; n <= (spec.notes || 0); n++) HW.Progress.set('linnet' + n);
    if (spec.peep) HW.Progress.set('peep:53,21');
    if (spec.reloads) reload(HW);
    /* Act IV: the Shears, in town, then at the fog */
    if (spec.cuts) {
        HW.warp('hollow', 95, 66); HW.step(10); HW.skipTalk();
        for (const c of spec.cuts) {
            const [who, no] = Array.isArray(c) ? c : [c, 0];
            const a = HW.G.map; let n = a.ents.find(e => e.kind === 'npc' && e.who === who), made = false;
            /* (someone who lives out of town: a stand-in beside Wren, cut as they'd be cut) */
            if (!n) {
                const [x, y] = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]].map(([dx, dy]) => [p().tx + dx, p().ty + dy]).find(([x, y]) => !a.kind(x, y).solid && !a.at(x, y));
                n = a.add(new (HW.global('NPC'))(x, y, { who, marked: false })); made = true;
            }
            for (let k = 0; k <= no; k++) { HW.Script.run(S.cutPerson(n)); HW.step(2); HW.skipTalk(k < no ? 1 : 0); HW.step(2); }
            assert.ok(HW.Progress.flag('cut:' + who), who + ' cut');
            if (made) a.remove(n);
        }
    }
    if (spec.old === 'late') { for (const k of Object.keys(HW.Stats.c)) if (k.startsWith('aft:')) delete HW.Stats.c[k]; delete HW.Progress.flags['aft:cuts']; reload(HW); }
    HW.warp('hollow', 67, 19); HW.step(10); HW.skipTalk();
    for (let k = 0; k <= (spec.self || 0); k++) { HW.face('left'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(k < (spec.self || 0) ? 1 : 0); HW.step(5); }
    assert.ok(HW.Progress.flag('cut_self'), 'her own thread cut');
    if (spec.reloads) reload(HW);
    /* the Drift, the Pull, the Spool: the end */
    carry(HW, 'afterDrift');
    HW.Script.run(HW.global('Ending').unwinding());
    for (let i = 0; i < 300 && (HW.Script.blocking() || HW.G.credits || HW.G.hideHud); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('unwound') && HW.G.map.id === 'hollow' && !HW.G.hideHud, 'the free valley');
    if (spec.old === 'done') { for (const k of Object.keys(HW.Stats.c)) if (k.startsWith('aft:')) delete HW.Stats.c[k]; for (const k of Object.keys(HW.Progress.flags)) if (k.startsWith('aft:')) delete HW.Progress.flags[k]; reload(HW); }
    if (spec.after) spec.after(HW);
    return HW;
}
/* sit down on the bench (from below Gran), and everything said there */
export function bench(HW, choice = 0) {
    for (let i = 0; i < 8 && !HW.walkTo(78, 54, 3000); i++) HW.step(40);
    assert.equal(`${HW.player().tx},${HW.player().ty}`, '78,54', 'below Gran on the bench');
    return listen(HW, () => { HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(choice); });
}
/* down the cellar steps to the ledger, and everything read there */
export function cellar(HW, choice = 0) {
    HW.warp('gran_house', 2, 6); HW.step(10); HW.skipTalk();
    return listen(HW, () => { HW.face('left'); HW.press('act', 1); HW.step(3); HW.skipTalk(choice); });
}
/* the trajectories the tests (and a person reading them) compare: the straight way through; everything found; changing
   your mind; sitting about; doing things out of turn; play that pulls two ways at once; never falling */
export const WANDERS = {
    straight: { falls: { millrace: 7, 'hollow:millwater': 3, tidy: 2 }, faints: 1, homeward: 41, cuts: [] },
    explorer: { falls: { kiln: 9, slumber: 6, 'hollow:heights': 4 }, faints: 3, fog: 11, bell: 4, granLean: 2, budges: { burr: 6, quill: 3, tuck: 5 }, s01: true, waited: 2,
        homeward: 74, tuck: 5, gate: true, hold: true, notes: 8, peep: true, self: 1,
        cuts: ['arlo', 'quill', 'hob', 'rosa', 'thimble', 'seam', 'mabel', 'burr', 'nell', 'otto', 'bea', 'tuck', 'ives', 'bram', 'ambrose', 'tess', 'mallow', 'jory'] },
    reviser: { falls: { belfry: 5 }, fog: 2, homeward: 26, self: 3, cuts: [['rosa', 2], ['tess', 1], 'arlo'] },
    idler: { falls: { tidy: 8, kiln: 6 }, faints: 2, fog: 1, waited: 9, homeward: 30, idle: 3000, cuts: [] },
    outoforder: { falls: { marionette: 4 }, gate: true, bell: 2, homeward: 19, cuts: ['tess', 'tuck'] },
    twoways: { falls: { slumber: 11 }, tuck: 4, hold: true, budges: { burr: 9 }, fog: 4, homeward: 33, cuts: ['burr'] },
    neverfell: { budges: { bea: 2 }, notes: 6, homeward: 22,
        cuts: ['arlo', 'quill', 'hob', 'rosa', 'thimble', 'seam', 'mabel', 'nell', 'otto', 'bea', 'tuck', 'ives', 'bram', 'ambrose', 'tess', 'mallow', 'gundry'] },
};
