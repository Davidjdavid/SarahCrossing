// Checks the world's data: every map 16x11, exits that line up both ways,
// things standing where they can, doors with somewhere in front of them.
import { load } from './headless.mjs';

const A = load();
A.newGame();
const R = A.ROOMS;
const problems = [];
const W = 16, H = 11;
const solidTile = (id, x, y) => {
    const c = R[id].map[y]?.[x] ?? ' ';
    return [' ', 'W', 'w', '#', '^', 'f', 'o', 'C', 'b', 'B', 'h', 'k', 'n', '!'].includes(c);
};
for (const [id, room] of Object.entries(R)) {
    if (room.map.length !== H) problems.push(`${id}: ${room.map.length} rows`);
    room.map.forEach((row, y) => { if (row.length !== W) problems.push(`${id} row ${y}: ${row.length} wide "${row}"`); });
    for (const e of room.ents || []) {
        if (!A.KIND[e.k]) problems.push(`${id}: unknown kind ${e.k} (${e.id})`);
        if (e.x < 0 || e.y < 0 || e.x + (e.w || 1) > W || e.y + (e.h || 1) > H) problems.push(`${id}: ${e.id} out of bounds`);
        if (e.k === 'house' || e.k === 'lot') {
            const fx = e.x + e.door[0], fy = e.y + e.door[1] + 1;
            if (solidTile(id, fx, fy)) problems.push(`${id}: ${e.id} door front ${fx},${fy} is solid`);
        }
    }
    const ids = new Set();
    for (const e of room.ents || []) { if (ids.has(e.id)) problems.push(`${id}: duplicate id ${e.id}`); ids.add(e.id); }
    if (!room.out) {
        if (!room.entry && !room.map.some(r => r.includes('M')) && !room.bld) problems.push(`${id}: interior with no entry`);
        if (room.entry && solidTile(id, ...room.entry)) problems.push(`${id}: entry is solid`);
        if (room.ret && !R[room.ret.room]) problems.push(`${id}: ret to unknown ${room.ret.room}`);
        if (room.ret && solidTile(room.ret.room, room.ret.x, room.ret.y)) problems.push(`${id}: ret ${room.ret.room} ${room.ret.x},${room.ret.y} solid`);
    }
    for (const [d, to] of Object.entries(room.exits || {})) {
        if (to.startsWith('@')) continue;
        if (!R[to]) { problems.push(`${id}: exit ${d} to unknown ${to}`); continue; }
        const back = { u: 'd', d: 'u', l: 'r', r: 'l' }[d];
        if ((R[to].exits || {})[back] !== id) problems.push(`${id} -> ${to} (${d}) has no way back`);
        for (let i = 0; i < (d === 'u' || d === 'd' ? W : H); i++) {
            const [x, y] = d === 'u' ? [i, 0] : d === 'd' ? [i, H - 1] : d === 'l' ? [0, i] : [W - 1, i];
            const [x2, y2] = d === 'u' ? [i, H - 1] : d === 'd' ? [i, 0] : d === 'l' ? [W - 1, i] : [0, i];
            const a = !solidTile(id, x, y), b = !solidTile(to, x2, y2);
            if (a !== b && !'%~'.includes(R[id].map[y][x]) && !'%~'.includes(R[to].map[y2][x2])) problems.push(`${id} ${d} edge at ${x},${y} (${a ? 'open' : 'shut'}) vs ${to} ${x2},${y2} (${b ? 'open' : 'shut'})`);
        }
    }
    // open edge tiles with no exit
    for (let i = 0; i < W; i++) for (const [x, y, d] of [[i, 0, 'u'], [i, H - 1, 'd']]) if (!solidTile(id, x, y) && room.out && !(room.exits || {})[d] && !'%~'.includes(room.map[y][x])) problems.push(`${id}: open edge ${x},${y} without exit ${d}`);
    for (let i = 0; i < H; i++) for (const [x, y, d] of [[0, i, 'l'], [W - 1, i, 'r']]) if (!solidTile(id, x, y) && room.out && !(room.exits || {})[d] && !'%~'.includes(room.map[y][x])) problems.push(`${id}: open edge ${x},${y} without exit ${d}`);
}
console.log(problems.length ? problems.join('\n') : 'world ok');
process.exitCode = problems.length ? 1 : 0;
