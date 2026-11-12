// The scripted playthrough's legs (tests/legs.mjs) as the QA package's save states need them: hearts only as the game
// gives them. Each leg sets Wren's hearts to a comfortable number at its start, and tops them up in one fight, so that
// a leg run on its own from a preset can't fail on a stray hit; a save taken from them would hold more hearts than the
// game could have given by then. Here those lines are left out, and instead nothing can hurt Wren for the whole run
// (G.cheats.god, which does nothing but stop damage: src/11_player.js), so her hearts are always full and how many she
// has is the game's own count; and each beaten boss's Heartstitch is picked up, as a player would. The legs are
// otherwise exactly as tested.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadGame } from '../tests/harness.mjs';

let src = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'tests', 'legs.mjs'), 'utf8');
const swap = (from, to, n) => {
    const parts = src.split(from);
    if (parts.length - 1 !== n) throw new Error(`tests/legs.mjs has changed: expected ${n} of ${JSON.stringify(from)}, found ${parts.length - 1}`);
    src = parts.join(to);
};
for (const h of [16, 24, 28, 32, 34]) src = src.split(`HW.Inv.maxHp = HW.Inv.hp = ${h};`).join('/* (hearts as the game gives them) */');
if (/HW\.Inv\.maxHp = /.test(src)) throw new Error('tests/legs.mjs sets hearts somewhere new');
swap('HW.Inv.hp = 16;', '', 2);
swap("walk(...s('heart', 9, 5)); HW.step(5);\n    ok(HW.Inv.maxHp === 36, 'a new heart');",
    "const mh0 = HW.Inv.maxHp; walk(...s('heart', 9, 5)); HW.step(5);\n    ok(HW.Inv.maxHp === mh0 + 2, 'a new heart');", 1);
const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hollowell-qa-')), 'legs.mjs');
fs.writeFileSync(file, src);
const M = await import(pathToFileURL(file).href);

export const { hearMakers, climbWatching, slackAndCut, cutPost, junkAndCut, darkAndCut, holdGransHand, spoolTop } = M;
/* each leg as tested, and at its end a Heartstitch still lying in Wren's room picked up (the eighth boss's: the leg ends
   in its room without another step) */
const stitchAfter = leg => (HW, chain) => { const r = leg(HW, chain); if (HW.walkTo.stitches) HW.walkTo.stitches(); return r; };
export const [LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9] = [M.LEG1, M.LEG2, M.LEG3, M.LEG4, M.LEG5, M.LEG6, M.LEG7, M.LEG8, M.LEG9].map(stitchAfter);
/* a game in which nothing can hurt Wren (and the legs' switching it on and off for fights changes nothing) */
export function godAlways(HW) { Object.defineProperty(HW.G.cheats, 'god', { get: () => true, set() { }, configurable: true }); return HW; }
/* a player picks up a beaten boss's Heartstitch before going on; the legs only do where it lies on their way (they set
   the hearts by hand instead). So before each walk, a Heartstitch lying in Wren's room is walked over first */
export function withHeartstitches(HW) {
    const walk0 = HW.walkTo.bind(HW), Cam = HW.global('Cam'), isBoss = HW.global('isBoss');
    const stitches = () => {
        const a = HW.G.map, p = HW.G.player;
        const h = a && p && p.state === 'normal' && Cam.room && a.ents.find(e => e.kind === 'pickup' && e.what === 'heartstitch' && !e.removed && a.roomAt(e.x >> 4, e.y >> 4) === Cam.room);
        if (h && !a.ents.some(e => isBoss(e) && e.alive !== false && !e.removed)) { walk0(h.x >> 4, h.y >> 4); HW.step(10); HW.skipTalk(); }
    };
    HW.walkTo = function (tx, ty, max) { stitches(); return walk0(tx, ty, max); };
    HW.walkTo.stitches = stitches;
    return HW;
}
export const loadQA = () => withHeartstitches(godAlways(loadGame()));
