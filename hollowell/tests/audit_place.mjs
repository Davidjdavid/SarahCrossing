// Polish tool (POLISH.md): every area, at every story stage, built and checked for things placed where they can't be:
// people, creatures and things standing in walls, holes or deep water; two things on one tile; things you need to
// face (signs, chests, levers, people...) with no floor beside them to stand on. Prints what it finds, once each.
import { loadGame } from './harness.mjs';

const STAGES = [null, 'afterD1', 'afterD2', 'afterD3', 'afterD4', 'afterD5', 'afterD6', 'afterD7', 'afterMakings', 'afterReveal2', 'afterD8', 'afterDrift', 'afterEnding'];
const found = new Map();
const note = (key, msg, stage) => { if (!found.has(key)) found.set(key, { msg, stage, n: 0 }); found.get(key).n++; };
const FACE = new Set(['sign', 'chest', 'npc', 'lever', 'chute', 'knotlock', 'winch', 'crank', 'bell']);
for (const stage of STAGES) {
    const HW = loadGame();
    if (stage) HW.preset(stage); else HW.newGame('Wren', { noAutosave: true, skipIntro: true });
    HW.step(2);
    const World = HW.global('World'), AREAS = HW.AREAS;
    for (const id of Object.keys(AREAS)) {
        let a;
        try { a = World.build(id); } catch (e) { note(id + '|build', `${id}: won't build: ${e.message}`, stage); continue; }
        const tiles = new Map();
        const open = (x, y) => { if (!a.inside(x, y)) return false; const k = a.kind(x, y); return !(k.solid && !k.crawl) && !k.pit && !k.deep && !k.fog && !k.void && !k.ledge; };
        for (const e of a.ents) {
            if (e.removed || e.hidden || e.down || e.kind === 'warp' || e.kind === 'door' || e.kind === 'cord') continue;
            const name = `${e.id || e.who || e.kind}`;
            if (e.isGrid) {
                const k = tiles.get(key(e)); if (k) note(`${id}|two|${key(e)}`, `${id}: ${k} and ${name} share ${key(e)}`, stage); else tiles.set(key(e), name);
                const kk = a.kind(e.tx, e.ty);
                const hanging = e.ret && e.ret.state !== 'home';
                if (kk.solid && !kk.low && e.kind !== 'eyelet' && !e.wall && a.staticSolid && !a.staticSolid.has(e.ty * 4096 + e.tx)) note(`${id}|in|${name}|${key(e)}`, `${id}: ${name} (${e.kind}) inside ${a.kindName(e.tx, e.ty)} at ${key(e)}`, stage);
                if ((kk.pit || (kk.deep && !e.floats)) && !hanging && !e.flying) note(`${id}|hole|${name}|${key(e)}`, `${id}: ${name} (${e.kind}) over ${a.kindName(e.tx, e.ty)} at ${key(e)}`, stage);
                if (FACE.has(e.kind) && !e.counter && ![[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => open(e.tx + dx, e.ty + dy))) note(`${id}|reach|${name}|${key(e)}`, `${id}: ${name} (${e.kind}) at ${key(e)} has no floor beside it`, stage);
            } else if ((e.kind === 'critter') && e.x !== undefined) {
                const tx = Math.floor(e.x / 16), ty = Math.floor((e.y - 2) / 16);
                if (!open(tx, ty) && !e.flies) note(`${id}|critter|${name}`, `${id}: ${name} (critter) starts on ${a.kindName(tx, ty)} at ${tx},${ty}`, stage);
            }
        }
        for (const m of a.walkers) {
            const tx = Math.floor(m.x / 16), ty = Math.floor(m.y / 16);
            if (!open(tx, ty) && !m.flies && !(m.D && (m.D.flies || m.D.swims))) note(`${id}|walker|${m.type}|${tx},${ty}`, `${id}: ${m.type} starts on ${a.kindName(tx, ty)} at ${tx},${ty}`, stage);
        }
    }
    process.stdout.write(`${stage || 'new game'} `);
}
function key(e) { return e.tx + ',' + e.ty; }
console.log(`\n${found.size} findings`);
for (const [, v] of [...found].sort()) console.log(`${v.msg}  [first: ${v.stage || 'new game'}]`);
