// Records save states along one whole scripted game (tests/legs.mjs, chained as tests/playthrough.test.mjs plays it:
// a new game played to the credits and after, nothing set up between legs; with Wren's hearts only as the game gives
// them, through tools/qa_legs.mjs). A save is taken whenever a player could
// save (the pause menu could open: nothing being said, no scene running, Wren standing free and empty-handed) and the
// place or the story moved on since the last one: a new room, area or region, a new flag, a new thing in the satchel;
// once it has held still for half a second, as a person's save would (a gate she has just walked through counts her as
// past it a step after she's in the next room: a save in that first step, which no hand could time, would forget it).
//   node tools/qa_record.mjs OUTDIR      writes OUTDIR/caps.jsonl (one line per save: its details and the save itself)
// tools/qa_saves.mjs picks the milestones from it and tests each one.
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from '../tests/harness.mjs';
import { LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9, loadQA } from './qa_legs.mjs';

const out = process.argv[2];
if (!out) { console.error('usage: node tools/qa_record.mjs OUTDIR'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const file = fs.openSync(path.join(out, 'caps.jsonl'), 'w');

/* (hearts only as the game gives them, nothing able to hurt her: tools/qa_legs.mjs) */
const HW = loadQA();
const G = HW.G, Game = HW.global('Game'), UI = HW.global('UI'), Cam = HW.global('Cam'), Progress = HW.Progress, Inv = HW.Inv;

/* the story's moves: every flag set and every thing given bumps a count */
let moves = 0, lastFlags = [];
const set0 = Progress.set.bind(Progress);
Progress.set = function (f, v) { if (!Progress.flags[f]) { moves++; lastFlags.push(f); } return set0(f, v); };
const sa0 = Progress.setAreaFlag.bind(Progress);
Progress.setAreaFlag = function (a, f, v) { if (!Progress.areaFlag(a, f)) { moves++; lastFlags.push(a + '/' + f); } return sa0(a, f, v); };

let leg = 0, n = 0, prev = null, lastOk = '', still = 0, seen = '';
const SETTLE = 30;
const invKey = () => JSON.stringify([Inv.tools, Inv.knots, Inv.items, Inv.maxHp, Inv.patches]);
const quiet = () => {
    const p = G.player;
    return G.scene === 'play' && !UI.menu && !HW.Script.blocking() && !HW.Dialog.active && !Cam.busy && p && p.state === 'normal'
        && !p.carry && !p.grip && !G.winch && !G.credits && !G.hideHud;
};
function after(force) {
    if (!quiet() || !G.map) { still = 0; return; }
    const room = Cam.room, key = room && room.key !== undefined ? room.key : null;
    const inv = invKey();
    const region = G.regionName || null;
    if (!force && prev && prev.area === G.map.id && prev.key === key && prev.region === region && prev.moves === moves && prev.inv === inv) return;
    /* (held still: the same place and story for SETTLE steps in a row) */
    const now = [G.map.id, key, region, moves, inv].join('|');
    if (now !== seen) { seen = now; still = 0; }
    if (++still < SETTLE && !force) return;
    const s = HW.Save.snapshot();
    const cap = {
        i: n++, leg, t: G.t, area: G.map.id, key, roomName: room && room.name || null, region, house: !!G.map.def.house,
        tx: G.player.tx, ty: G.player.ty, flags: lastFlags.slice(), knots: Inv.knots.length, tools: Inv.tools.slice(),
        hp: Inv.hp, maxHp: Inv.maxHp, goal: Progress.goal, lastOk, save: JSON.parse(JSON.stringify(s)),
    };
    fs.writeSync(file, JSON.stringify(cap) + '\n');
    lastFlags = [];
    prev = { area: G.map.id, key, region, moves, inv };
}
const step0 = Game.step.bind(Game);
Game.step = function () { step0(); after(); };

/* each leg after the first starts where the one before had walked to; a save there, always (the play-on tests start a
   leg from it) */
const chain = name => { const H0 = loadGame(); H0.preset(name); const id = H0.G.map.id, p = H0.player(); HW.warp(id, p.tx, p.ty); HW.step(5); HW.skipTalk(); after(true); };
const legs = [LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9];
const t0 = Date.now();
for (let k = 0; k < legs.length; k++) {
    leg = k + 1;
    legs[k](HW, k ? chain : undefined);
    console.log(`leg ${leg} done: ${n} saves so far, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
/* after the end: a little while in the free valley, so the last save is one a player would have */
HW.step(120);
fs.closeSync(file);
console.log(`${n} saves recorded; errors: ${HW.ERRORS.length}${HW.ERRORS.length ? '\n' + HW.ERRORS.join('\n') : ''}`);
process.exit(HW.ERRORS.length ? 1 : 0);
