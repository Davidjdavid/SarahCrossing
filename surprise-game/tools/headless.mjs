// Loads the game's logic (no drawing) into a sandbox for tests and scripted play.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LOGIC_FILES = () => fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^[0-3]\d_.*\.js$/.test(f)).sort();

export function load() {
    const code = LOGIC_FILES().map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
    const ctx = { console, Math, JSON, Date, Object, Array, Set, Map, Number, String, Infinity, NaN, isNaN };
    vm.createContext(ctx);
    vm.runInContext(code + `
;globalThis.API = {
  newGame, act, undo, restartRoom, swapTargets, targetDigit, doSwap,
  get G() { return G; }, set G(v) { G = v; }, get EV() { return EV; }, clearEV() { EV.length = 0; },
  ROOMS, KIND, entById, entsAt, tileAt, slotGet, dval, band, present, solidFor, addrRoom, rs, pv, giveDigit, getItem, UNDO,
  groundOk, blockedByEnt, T, isWater, platformAt, findEnt, weightOf, hourVal, goHome: typeof goHome === 'function' ? goHome : null,
  get entrySnap() { return entrySnap; },
};`, ctx, { filename: 'game-logic.js' });
    return ctx.API;
}
