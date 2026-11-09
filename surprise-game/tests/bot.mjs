// A small bot that plays through the headless game: walks with a path search,
// swaps by naming the thing, and complains loudly when something isn't as expected.
import assert from 'node:assert/strict';

const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

export function makeBot(A, { log = false } = {}) {
    const G = () => A.G;
    const say = (...a) => { if (log) console.log(...a); };
    const lines = [];
    const run = (a) => {
        A.clearEV();
        const r = A.act(a);
        for (const e of A.EV) if (e.t === 'say') lines.push(...e.lines);
        if (G().dead) throw new Error(`died (${G().dead}) in ${G().room} at ${G().p.x},${G().p.y} doing ${JSON.stringify(a)}`);
        return r;
    };
    const inb = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 11;
    function walkable(x, y) {
        if (!inb(x, y)) return false;
        if (A.tileAt(x, y) === 'M') return false;
        if (!A.groundOk(x, y) || A.blockedByEnt(x, y)) return false;
        if (A.entsAt(x, y).some(e => e.k === 'crack' && !e.broken && A.pv('wt') > A.dval(e.s.hold))) return false;
        return true;
    }
    function bfs(goal) {
        const { x, y } = G().p;
        const prev = new Map([[x + ',' + y, null]]);
        const q = [[x, y]];
        while (q.length) {
            const [cx, cy] = q.shift();
            if (goal(cx, cy)) {
                const path = []; let k = cx + ',' + cy;
                while (prev.get(k)) { const p = prev.get(k); path.unshift(p.d); k = p.from; }
                return path;
            }
            for (const [d, [dx, dy]] of Object.entries(DIRS)) {
                const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
                if (prev.has(k) || !walkable(nx, ny)) continue;
                if (A.T(nx, ny).ledge && d === 'u') continue;
                prev.set(k, { from: cx + ',' + cy, d });
                q.push([nx, ny]);
            }
        }
        return null;
    }
    function move(d) { run({ t: 'move', d }); }
    function goto(x, y) {
        const p = bfs((a, b) => a === x && b === y);
        assert.ok(p, `no path in ${G().room} from ${G().p.x},${G().p.y} to ${x},${y}`);
        const room = G().room;
        for (const d of p) { move(d); if (G().room !== room) break; }
        assert.ok(G().room !== room || (G().p.x === x && G().p.y === y), `didn't reach ${x},${y} in ${room}: at ${G().p.x},${G().p.y}`);
    }
    /* stand next to x,y and face it */
    function adjDir(x, y) {
        const { x: px, y: py } = G().p;
        for (const [d, [dx, dy]] of Object.entries(DIRS)) if (px + dx === x && py + dy === y) return d;
        return null;
    }
    function near(x, y, from = null) {
        const opts = Object.entries(DIRS).map(([d, [dx, dy]]) => [x - dx, y - dy, d]).filter(([a, b, d]) => !from || d === from);
        const p = bfs((a, b) => opts.some(([ox, oy]) => ox === a && oy === b));
        assert.ok(p, `can't get next to ${x},${y} in ${G().room} from ${G().p.x},${G().p.y}`);
        for (const d of p) move(d);
        const d = adjDir(x, y);
        assert.ok(d && (!from || d === from), `not next to ${x},${y} in ${G().room}: at ${G().p.x},${G().p.y}`);
        G().p.dir = d;
        return d;
    }
    function bump(x, y, from) { const d = near(x, y, from); move(d); }
    function ent(id) { const e = A.entById(id); assert.ok(e, `no ${id} in ${G().room}`); return e; }
    function swap(id, key = null, i = 0, pi = null) {
        const tg = id === 'drop' ? { t: 'drop', ...key } : id.startsWith('L') || key === 'loose' ? { t: 'loose', id } : { t: 'slot', id, key, i };
        if (pi === null) pi = tg.t === 'loose' && G().pocket.includes(null) ? G().pocket.indexOf(null) : G().pocket.findIndex(v => v !== null);
        const r = run({ t: 'swap', tg, pi });
        assert.ok(r, `swap with ${id}.${key}[${i}] (pocket ${pi}) refused in ${G().room} at ${G().p.x},${G().p.y}; pocket ${JSON.stringify(G().pocket)}`);
        say('swap', id, key, i, '->', JSON.stringify(G().pocket));
    }
    /* swap a particular pocket digit (by value) into a slot */
    function put(v, id, key, i = 0) {
        const pi = G().pocket.indexOf(v);
        assert.ok(pi >= 0, `no ${v} in pocket ${JSON.stringify(G().pocket)}`);
        swap(id, key, i, pi);
    }
    function pickLoose(v, into = null) {
        const L = A.rs().ents.filter(e => e.k === 'loose' && !e.gone && e.s.v[0] === v && Math.abs(e.x - G().p.x) + Math.abs(e.y - G().p.y) <= 1);
        assert.ok(L.length, `no loose ${v} within reach at ${G().p.x},${G().p.y}`);
        const pi = into !== null ? into : G().pocket.includes(null) ? G().pocket.indexOf(null) : 0;
        const r = run({ t: 'swap', tg: { t: 'loose', id: L[0].id }, pi });
        assert.ok(r, `pick up ${v} failed`);
    }
    function exit(d) {
        const room = G().room;
        const R = A.ROOMS[room];
        const edge = (x, y) => d === 'u' ? y === 0 : d === 'd' ? y === 10 : d === 'l' ? x === 0 : x === 15;
        const p = bfs((x, y) => edge(x, y));
        assert.ok(p, `no way to the ${d} edge of ${room}`);
        for (const s of p) move(s);
        move(d);
        assert.notEqual(G().room, room, `didn't leave ${room} going ${d}`);
    }
    function leave() { /* walk out of an interior through its mat */
        const room = G().room;
        let mat = null;
        for (let y = 0; y < 11; y++) for (let x = 0; x < 16; x++) if (A.tileAt(x, y) === 'M') mat = [x, y];
        assert.ok(mat, `no mat in ${room}`);
        goto(mat[0], mat[1] - 1);
        move('d');
        assert.notEqual(G().room, room, `didn't leave ${room}`);
    }
    function wait(n = 1) { for (let i = 0; i < n; i++) run({ t: 'wait' }); }
    function kill(id) {
        for (let n = 0; n < 80; n++) {
            const e = A.entById(id);
            if (!e || e.gone) return;
            const d = adjDir(e.x, e.y);
            if (d) { move(d); continue; }
            const opts = Object.values(DIRS).map(([dx, dy]) => [e.x - dx, e.y - dy]);
            const p = bfs((a, b) => opts.some(([ox, oy]) => ox === a && oy === b));
            assert.ok(p, `can't reach ${id}`);
            move(p[0]);
        }
        assert.fail(`couldn't defeat ${id}`);
    }
    return { run, goto, near, bump, ent, swap, put, pickLoose, exit, leave, wait, kill, move, lines, bfs, walkable, G, A };
}
