// The QA kit's save states: picks the milestones from a recording (tools/qa_record.mjs) and tests every one.
//   node tools/qa_saves.mjs CAPSDIR OUTDIR [--quick]
// Each save is a moment of one whole scripted game, played from a new game through the game's own rules (the legs of
// tests/legs.mjs, with hearts only as the game gives them: tools/qa_legs.mjs; the script hops between places instead
// of walking some stretches, and nothing hurts Wren, so her hearts are always full).
// Every save is tested: loaded from its code into a fresh game (no errors, the right place, Wren standing free, the
// menu opens, everything saved comes back the same, she can move); and played on: a save at the start of a leg plays
// that whole leg from the loaded save, and any other save is loaded in the middle of its own leg, in place of the game
// at that moment, and the leg is played on to its end from it. (--quick skips playing on.)
// Writes OUTDIR/save_states.json (the saves, their codes and what each is), OUTDIR/codes/TNN.txt and OUTDIR/results.json.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadGame } from '../tests/harness.mjs';
import * as L from './qa_legs.mjs';

const [capsDir, outDir] = process.argv.slice(2);
const quick = process.argv.includes('--quick');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
/* --tour=DIR: the optional content's saves too (tools/qa_tour.mjs wrote DIR/caps_tour.jsonl) */
const tourDir = (process.argv.find(a => a.startsWith('--tour=')) || '').slice(7);
const tourCaps = tourDir ? fs.readFileSync(path.join(tourDir, 'caps_tour.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
if (!capsDir || !outDir) { console.error('usage: node tools/qa_saves.mjs CAPSDIR OUTDIR [--quick]'); process.exit(1); }
const caps = fs.readFileSync(path.join(capsDir, 'caps.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const LEGS = [null, L.LEG1, L.LEG2, L.LEG3, L.LEG4, L.LEG5, L.LEG6, L.LEG7, L.LEG8, L.LEG9];

/* picking moments out of the recording */
const first = f => caps.find(f);
const legStart = n => first(c => c.leg === n);
const inRoom = (area, key) => first(c => c.area === area && c.key === key);
const before = c => c && caps[c.i - 1];
const preEntry = (area, key) => before(inRoom(area, key));
const flag = f => first(c => c.flags.includes(f));
const tool = t => first(c => c.tools.includes(t));
const region = (r, knots) => first(c => c.area === 'hollow' && c.region === r && c.knots === knots);

/* the milestones: id, part of the game, the moment, what it is (spoilers: this list is for the tester only) */
const PICK = [
    ['T01', 'early', () => legStart(1), 'New game: the first moment Wren can move, in her room at Gran\'s house.'],
    ['T02', 'early', () => flag('ceremony'), 'After the opening ceremony: free in Hollowell\'s town square; the first House ahead.'],
    ['T03', 'early', () => region('Meadowfold', 0), 'Meadowfold, on the way to the first House.'],
    ['T04', 'early', () => inRoom('tidy', '1,3'), 'House 1 (the Tidyhouse): just inside, in the Foyer.'],
    ['T05', 'early', () => inRoom('tidy', '1,2'), 'House 1: entering the Hall of Busts (the race between the busts and the door).'],
    ['T06', 'early', () => tool('gloves'), 'House 1: just after getting its tool, the Gloves.'],
    ['T07', 'early', () => preEntry('tidy', '1,0'), 'House 1: just before the boss room (the Grand Housekeeper).'],
    ['T08', 'early', () => legStart(2), 'After House 1\'s Knot: Meadowfold, outside the Tidyhouse.'],
    ['T09', 'early', () => flag('kilnPass'), 'Kilnridge, through the pass on the canyon road.'],
    ['T10', 'early', () => inRoom('kiln', '1,3'), 'House 2 (the Kiln): just inside, at the Kiln Door.'],
    ['T11', 'early', () => tool('hook'), 'House 2: just after getting its tool, the Hookline.'],
    ['T12', 'early', () => preEntry('kiln', '1,0'), 'House 2: just before the boss room (the Kilnwyrm).'],
    ['T13', 'early', () => legStart(3), 'After House 2\'s Knot: Kilnridge, outside the Kiln.'],
    ['T14', 'early', () => region('Millrace Falls', 2), 'Millwater: at Millrace Falls, outside House 3.'],
    ['T15', 'early', () => inRoom('millrace', '1,3'), 'House 3 (the Millrace): just inside, in the Wheel Hall.'],
    ['T16', 'early', () => tool('paddle'), 'House 3: just after getting its tool, the Paddle.'],
    ['T17', 'early', () => preEntry('millrace', '1,0'), 'House 3: just before the boss room (Old Grindle).'],
    ['T18', 'middle', () => legStart(4), 'After House 3\'s Knot: Millrace Falls.'],
    ['T19', 'middle', () => region('Belfry Heights', 3), 'Belfry Heights, at the top of the Cliff Stair.'],
    ['T20', 'middle', () => inRoom('belfry', '1,4'), 'House 4 (the Belfry): just inside, on the Bell Porch.'],
    ['T21', 'middle', () => tool('bell'), 'House 4: just after getting its tool, the Bell.'],
    ['T22', 'middle', () => preEntry('belfry', '1,0'), 'House 4: just before the boss room (Tollgrim).'],
    ['T23', 'middle', () => legStart(5), 'After House 4\'s Knot: outside the Belfry; the goal line says home for the festival.'],
    ['T24', 'middle', () => flag('giant_home'), 'The east road open: the giant has gone home; Hushwood ahead.'],
    ['T25', 'middle', () => inRoom('slumber', '1,3'), 'House 5 (the Slumberhouse): just inside, on the Night Porch.'],
    ['T26', 'middle', () => tool('bedroll'), 'House 5: just after getting its tool, the Bedroll.'],
    ['T27', 'middle', () => preEntry('slumber', '1,0'), 'House 5: just before the boss room (Mother Sloth).'],
    ['T28', 'middle', () => legStart(6), 'After House 5\'s Knot: outside the Slumberhouse.'],
    ['T29', 'middle', () => flag('leapt'), 'Larkspur Fair: just after the leap down from the high mesa.'],
    ['T30', 'middle', () => inRoom('marionette', '1,3'), 'House 6 (the Marionette Hall): just inside, in the Foyer.'],
    ['T31', 'middle', () => tool('crossbar'), 'House 6: just after getting its tool, the Crossbar.'],
    ['T32', 'middle', () => preEntry('marionette', '1,0'), 'House 6: just before the Great Stage (its boss, then the first big reveal).'],
    ['T33', 'middle', () => legStart(7), 'After House 6 and the first reveal: outside the Marionette Hall.'],
    ['T34', 'middle', () => flag('underside_first'), 'The Underside, the first time down (through the inn\'s Staff door).'],
    ['T35', 'middle', () => inRoom('spoolworks', '1,2'), 'House 7 (the Spoolworks): just inside, in the Gatehouse.'],
    ['T36', 'middle', () => tool('needle'), 'House 7: just after getting its tool, the Needle.'],
    ['T37', 'middle', () => preEntry('spoolworks', '1,0'), 'House 7: just before the boss room (the Tangle).'],
    ['T38', 'late', () => legStart(8), 'After House 7: the Underside, before Gundry\'s job.'],
    ['T39', 'late', () => flag('gundry_job'), 'Gundry has asked for the Makings (Tuck\'s Little Houses); none done yet.'],
    ['T40', 'late', () => flag('making4'), 'The Makings: four of the nine done.'],
    ['T41', 'late', () => flag('making8'), 'The Makings: eight done, the ninth (the capstone) next.'],
    ['T42', 'late', () => flag('makings_done'), 'The Makings all done; the way down next.'],
    ['T43', 'late', () => first(c => c.area === 'deep'), 'The Deep Store, the first time (the second big reveal ahead).'],
    ['T44', 'late', () => flag('gundry_r2'), 'After the second reveal: Gundry has given the Guild\'s key.'],
    ['T45', 'late', () => flag('north_gate_seen'), 'The North Gate open: the Loomwood ahead.'],
    ['T46', 'late', () => inRoom('loom', '1,3'), 'House 8 (the Loom): just inside, at the Threshold.'],
    ['T47', 'late', () => tool('shears'), 'House 8: just after getting its tool, the Shears.'],
    ['T48', 'late', () => preEntry('loom', '1,0'), 'House 8: just before the boss room (the Weaver).'],
    ['T49', 'late', () => legStart(9), 'After House 8: outside the Loom.'],
    ['T50', 'late', () => first(c => c.leg === 9 && c.region === 'The Frayed Edge'), 'The Frayed Edge, the fog ahead: just before Wren cuts her own thread.'],
    ['T51', 'late', () => flag('drift_first'), 'The Drift: the first steps in.'],
    ['T52', 'late', () => flag('great_pull'), 'Linnet found: the Great Pull has begun.'],
    ['T53', 'late', () => flag('pull_seen'), 'Home in the Pull: Hollowell.'],
    ['T54', 'late', () => flag('seed_planted'), 'The seed planted; the Well next.'],
    ['T55', 'late', () => inRoom('greatspool', '1,3'), 'The Great Spool (the last House): the Foot of the Well.'],
    ['T56', 'late', () => inRoom('greatspool', '1,1'), 'The Great Spool: the Climb.'],
    ['T57', 'late', () => preEntry('greatspool', '1,0'), 'The Great Spool: just before the Top (the finale).'],
    ['T58', 'after', () => caps[caps.length - 1], 'After the ending: the free valley.'],
];

const toCode = s => 'HW1:' + Buffer.from(JSON.stringify(s)).toString('base64');
/* what must come back the same through a save and a load: the story, the places' own state, and what Wren carries.
   (Two things a load changes by design: a save from before the last House is marked as made under its present layout
   (the flag gs2: Save.migrate), and the Bedroll laid on a float goes back with the float to the float's own home,
   58_bedroll_kit.js; so the flag gs2 and a floating Bedroll's tile are left out. And a thing cut free goes back to the
   tile it was left on unless someone else now stands there (after the ending a townsperson can), when it stays at its
   own home: 70_shears_kit.js; so only which things were cut free is compared, not their tiles) */
const core = s => {
    const flags = Object.assign({}, s.progress.flags); delete flags.gs2;
    const areaFlags = {};
    for (const [a, fl] of Object.entries(s.progress.areaFlags || {})) { areaFlags[a] = {}; for (const [k, v] of Object.entries(fl)) areaFlags[a][k] = k.startsWith('cut:@') ? true : v; }
    const b = s.inv.bedroll, bed = b && (b.fid ? { area: b.area, fid: b.fid } : b);
    return JSON.stringify({ name: s.name, flags, areaFlags, notes: s.progress.notes, journal: s.progress.journal,
        tools: s.inv.tools, knots: s.inv.knots, items: s.inv.items, keyCount: s.inv.keyCount, maxHp: s.inv.maxHp, patches: s.inv.patches, patchIds: s.inv.patchIds,
        patterns: s.inv.patterns, plans: s.inv.plans, buttons: s.inv.buttons, bed, stitches: s.inv.stitches, equipped: s.inv.equipped });
};
/* how a save is matched in a live run: the story, the places' own state and what Wren carries, less what follows the dice
   or the clock: the hearts, the buttons a pot dropped, the flag gs2 (a load adds it), where a thing cut free happens to
   stand, an offcut's record (its key is the time it dropped: 72_loom.js), and a notice shown the first time something
   is done (a one-time "_first" flag: a replay can do it a moment sooner) */
const storyFlags = s => Object.keys(s.progress.flags).filter(k => k !== 'gs2' && !k.endsWith('_first')).sort();
const storyAreas = s => {
    const out = {};
    for (const [a, fl] of Object.entries(s.progress.areaFlags || {})) {
        const o = {}; for (const [k, v] of Object.entries(fl)) { if (k.startsWith('gone:chute:')) continue; o[k] = k.startsWith('cut:') ? true : v; }
        out[a] = o;
    }
    return out;
};
const story = s => JSON.stringify({ flags: storyFlags(s).map(k => [k, s.progress.flags[k]]), areaFlags: storyAreas(s),
    tools: s.inv.tools, knots: s.inv.knots, items: s.inv.items, maxHp: s.inv.maxHp });

function quietOf(HW) {
    const G = HW.G, UI = HW.global('UI'), Cam = HW.global('Cam'), p = G.player;
    return G.scene === 'play' && !UI.menu && !HW.Script.blocking() && !HW.Dialog.active && !Cam.busy && p && p.state === 'normal' && !p.carry && !p.grip && !G.winch && !G.credits && !G.hideHud;
}

/* load a code the way the playable page's Save code box does */
function loadCode(HW, code) {
    const s = HW.Save.fromCode(code);
    assert.ok(s, 'the code reads');
    HW.global('Game').load(s);
    return s;
}

/* 1: a fresh game, the save loaded from its code */
function basic(pick) {
    const HW = loadGame(), G = HW.G, cap = pick.cap, want = cap.save, out = [];
    const check = (c, m) => { if (!c) out.push(m); };
    loadCode(HW, pick.code);
    HW.step(2);
    check(HW.ERRORS.length === 0, 'errors on load: ' + HW.ERRORS.join(' | '));
    check(G.scene === 'play' && G.map && G.map.id === want.pos.area, `area ${G.map && G.map.id}, wanted ${want.pos.area}`);
    const Cam = HW.global('Cam'), m = want.pos.mark;
    /* in a House a load starts at Wren's mark: the doorway she came into the room by, or the Bedroll or a bed where she laid
       it (which may be in another room) */
    const markRoom = cap.house && m && m.area === want.pos.area && G.map.roomAt(m.tx, m.ty);
    const room = Cam.room, loadRoom = room ? { key: room.key, name: room.name || null } : null;
    check(!cap.house || (room && (room.key === cap.key || (m.bed && markRoom && room === markRoom))), `room ${room && room.key}, wanted ${cap.key}`);
    check(core(HW.Save.snapshot()) === core(want), 'the story or the satchel changed through a save and a load');
    const p = G.player;
    check(p && !G.map.kind(p.tx, p.ty).solid, 'Wren on a solid tile');
    let t = 0; for (; t < 900 && !quietOf(HW); t++) { HW.step(1); if (HW.Dialog.active) HW.skipTalk(); }
    check(quietOf(HW), 'never free to move after loading');
    /* the menu opens and shuts */
    HW.press('menu', 1); HW.step(2);
    check(!!HW.global('UI').menu, 'the pause menu would not open');
    HW.global('PauseMenu').close(); HW.step(2);
    check(!HW.global('UI').menu, 'the pause menu would not shut');
    /* she can move: each way in turn, then back */
    const moved = [];
    for (const d of ['up', 'down', 'left', 'right']) {
        const x0 = G.player.x, y0 = G.player.y, tx = G.player.tx, ty = G.player.ty;
        HW.hold(d); HW.step(20); HW.release(); HW.step(4); HW.skipTalk();
        if (Math.hypot(G.player.x - x0, G.player.y - y0) > 3) moved.push(d);
        if (G.map.id === want.pos.area && G.player.state === 'normal') HW.walkTo(tx, ty, 300);
        HW.skipTalk();
    }
    check(moved.length > 0, 'Wren could not move in any direction');
    HW.step(600); HW.skipTalk(); HW.step(60);
    check(HW.ERRORS.length === 0, 'errors after loading: ' + HW.ERRORS.join(' | '));
    return { ok: out.length === 0, problems: out, moved, quietAfter: t, loadRoom, atMark: m && m.bed ? m.bed : null };
}

/* played on by hand, where the leg's own script can't take over from the loaded save because a load puts the room back
   as it was (the script had done a step before the save that a player does again after loading): each does that step,
   then goes on, and says what it showed */
const TIDY = { hall: [20, 22], parlor: [40, 22], linen: [40, 11], ball: [20, 11] };
const SPOOL = { top: [20, 0], climb: [20, 11] };
const CONT = {
    T06: HW => {
        const at = (r, x, y) => [TIDY[r][0] + x, TIDY[r][1] + y];
        const walk = (r, x, y) => { let ok = HW.walkTo(...at(r, x, y)); for (let i = 0; i < 3 && !ok; i++) { HW.skipTalk(); HW.step(10); ok = HW.walkTo(...at(r, x, y)); } assert.ok(ok, `walk ${r} ${x},${y}`); };
        walk('linen', 9, 9); walk('parlor', 16, 1); walk('parlor', 1, 5);
        assert.ok(!HW.find('hN').open, "the Hall of Busts' north gate shut again after the load (its block went home)");
        walk('hall', 9, 7); HW.push('up', 2); walk('hall', 7, 5); HW.push('right', 1); walk('hall', 6, 7); HW.step(400);
        assert.ok(HW.find('hN').open, "the Hall of Busts' north gate open again");
        walk('hall', 3, 1); walk('ball', 6, 8);
        assert.equal(HW.global('Cam').room.key, '1,1', 'into the Ballroom');
        return "the Hall of Busts' north gate is shut after the load (the room is back as it was); done again, it opens and the way on to the Ballroom is open";
    },
    T57: HW => {
        const at = (r, x, y) => [SPOOL[r][0] + x, SPOOL[r][1] + y];
        let ok = false; for (let i = 0; i < 6 && !ok; i++) { ok = HW.walkTo(...at('climb', 9, 5)); if (!ok) { HW.skipTalk(); HW.step(30); } }
        assert.ok(ok, 'from the Bedroll to the Climb');
        L.climbWatching(HW, SPOOL.climb);
        HW.hold('up'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk(); HW.step(20); HW.skipTalk();
        assert.ok(HW.Progress.flag('spool_met'), 'at the Top of the Spool');
        return 'loaded beside the Bedroll in The Night Ferry; walked back to the Climb, up it, and into the Top of the Spool (its scene played)';
    },
};

/* 2: played on. A leg's first save: load it, then play the leg. Any other: play its leg from the leg's first save, and
   at the moment the save was taken (the same story, the same room, free to move) load the save in place of the game */
function playOn(pick, legFirst) {
    if (CONT[pick.id]) {
        const HW = L.loadQA();
        try { loadCode(HW, pick.code); HW.step(60); HW.skipTalk(); const how = CONT[pick.id](HW); return HW.ERRORS.length ? { ok: false, problem: 'errors: ' + HW.ERRORS.join(' | ') } : { ok: true, how }; }
        catch (e) { return { ok: false, problem: String(e.message || e).split('\n')[0] }; }
    }
    const HW = L.loadQA(), Game = HW.global('Game'), Cam = HW.global('Cam'), cap = pick.cap, leg = cap.leg;
    const target = story(cap.save), nFlags = storyFlags(cap.save).length;
    let swapped = leg > 1 && pick.id === legFirst.id;
    const step0 = Game.step.bind(Game);
    let inside = false;
    if (!swapped) Game.step = function () {
        step0();
        if (swapped || inside || !quietOf(HW) || !HW.G.map || HW.G.map.id !== cap.area) return;
        if ((Cam.room && Cam.room.key !== undefined ? Cam.room.key : null) !== cap.key) return;
        /* (outdoors the story stays the same along a whole walk: the same region, and near the spot it was taken) */
        if (!cap.house && ((HW.G.regionName || null) !== cap.region || Math.abs(HW.G.player.tx - cap.tx) + Math.abs(HW.G.player.ty - cap.ty) > 3)) return;
        if (story(HW.Save.snapshot()) !== target) return;
        inside = true; loadCode(HW, pick.code); swapped = true; inside = false;
    };
    try {
        if (leg > 1) { loadCode(HW, legFirst.code); HW.step(5); HW.skipTalk(); }
        LEGS[leg](HW, leg > 1 ? () => { } : undefined);
        if (!swapped) return { ok: false, problem: 'the moment never came round again in the replay' };
        if (HW.ERRORS.length) return { ok: false, problem: 'errors: ' + HW.ERRORS.join(' | ') };
        return { ok: true };
    } catch (e) {
        return { ok: false, problem: (swapped ? 'after loading: ' : 'before the moment: ') + String(e.message || e).split('\n')[0] };
    }
}

/* a save of the tour (the optional content): its segment played again from the main save it starts from, and at its
   own mark the save loaded in place of the game; the segment then plays on to its end from it */
async function playOnTour(pick) {
    const { SEGMENTS, runSegment } = await import('./qa_tour.mjs');
    const seg = SEGMENTS.find(q => q.id === pick.cap.segment), from = picks.find(q => q.id === (seg && seg.from));
    if (!seg || !from) return { ok: false, problem: 'no segment or starting save' };
    let swapped = false, later = 0, HW = null;
    try {
        HW = runSegment(seg, from.code, (cap, H) => { if (cap.label === pick.id) { loadCode(H, pick.code); H.step(5); H.skipTalk(); swapped = true; } else if (swapped) later++; });
        if (!swapped) return { ok: false, problem: 'the mark never came round again in the replay' };
        if (HW.ERRORS.length) return { ok: false, problem: 'errors: ' + HW.ERRORS.join(' | ') };
        return later ? { ok: true } : { ok: true, how: 'loaded at its mark and its stretch played to its end (it is the last save of that stretch)' };
    } catch (e) { return { ok: false, problem: (swapped ? 'after loading: ' : 'before the moment: ') + String(e.message || e).split('\n')[0] }; }
}

fs.mkdirSync(path.join(outDir, 'codes'), { recursive: true });
const picks = PICK.map(([id, part, f, what]) => {
    const cap = f();
    assert.ok(cap, 'no moment for ' + id);
    return { id, part, what, cap, code: toCode(cap.save) };
});
for (const cap of tourCaps) picks.push({ id: cap.label, part: 'optional', what: cap.what, cap, code: toCode(cap.save) });
/* the same moment twice would be a slip in the list */
const dup = picks.find((p, k) => p.cap.i !== undefined && picks.findIndex(q => q.cap.i === p.cap.i) !== k);
assert.ok(!dup, 'two saves at one moment: ' + (dup && dup.id));

const results = [];
for (const pick of picks) {
    if (only.length && !only.includes(pick.id)) continue;
    const b = basic(pick);
    let on = null;
    if (!quick && pick.cap.segment) on = await playOnTour(pick);
    else if (!quick) {
        const legFirst = picks.find(q => q.cap.leg === pick.cap.leg && q.cap.i === legStart(pick.cap.leg).i) || { id: null, code: toCode(legStart(pick.cap.leg).save) };
        on = playOn(pick, legFirst);
    }
    results.push({ id: pick.id, basic: b, playOn: on });
    console.log(`${pick.id} ${pick.cap.area}${pick.cap.key ? '/' + pick.cap.key : ''} ${pick.cap.region || ''}: load ${b.ok ? 'ok' : 'FAIL ' + b.problems.join('; ')}${on ? ', played on ' + (on.ok ? 'ok' : 'FAIL ' + on.problem) : ''}`);
}

if (!only.length) {
const loadsAt = p => {
    const r = results.find(q => q.id === p.id).basic, c = p.cap;
    if (!c.house) return 'where it was saved';
    if (r.atMark === 'roll') return `beside the Bedroll, where it was laid (${r.loadRoom && r.loadRoom.name || 'room ' + (r.loadRoom && r.loadRoom.key)})`;
    if (r.atMark === 'bed') return `at the bed Wren lay down in (${r.loadRoom && r.loadRoom.name})`;
    return `the doorway Wren came into ${r.loadRoom && r.loadRoom.name || 'this room'} by`;
};
const states = picks.map(p => {
    const c = p.cap, s = c.save;
    fs.writeFileSync(path.join(outDir, 'codes', p.id + '.txt'), p.code + '\n');
    return {
        id: p.id, part: p.part, what: p.what, area: c.area, room: c.roomName, roomKey: c.key, region: c.house ? null : c.region,
        tile: [c.tx, c.ty], knots: c.knots, tools: c.tools, hearts: s.inv.maxHp / 2, goal: c.goal, flags: Object.keys(s.progress.flags).length,
        playMinutes: +(s.stats.playFrames / 3600).toFixed(1), loadsAt: loadsAt(p),
        code: p.code,
    };
});
fs.writeFileSync(path.join(outDir, 'save_states.json'), JSON.stringify(states, null, 1) + '\n');
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1) + '\n');
}
const bad = results.filter(r => !r.basic.ok || (r.playOn && !r.playOn.ok));
console.log(`${picks.length} saves; ${picks.length - bad.length} pass every check${bad.length ? '; failing: ' + bad.map(r => r.id).join(', ') : ''}`);
process.exit(bad.length ? 1 : 0);
