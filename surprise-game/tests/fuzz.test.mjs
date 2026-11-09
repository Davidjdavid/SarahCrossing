// Random play everywhere: nothing throws, nothing ends up somewhere impossible,
// and every single action can be undone exactly.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from '../tools/headless.mjs';

const J = v => JSON.parse(JSON.stringify(v));
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];

function checkWorld(A, where) {
    const G = A.G;
    assert.ok(G.p.x >= 0 && G.p.x < 16 && G.p.y >= 0 && G.p.y < 11, `${where}: player out of bounds`);
    assert.ok(A.ROOMS[G.room], `${where}: unknown room ${G.room}`);
    assert.ok(G.pocket.length >= 1 && G.pocket.length <= 3, `${where}: pocket size ${G.pocket.length}`);
    const digit = (d, what) => assert.ok(Number.isInteger(d) && d >= 0 && d <= 10, `${where}: bad digit ${d} in ${what}`);
    G.pocket.forEach(d => d === null || digit(d, 'pocket'));
    for (const [k, ds] of Object.entries(G.p.s)) ds.forEach(d => digit(d, 'player.' + k));
    G.hour.forEach(d => digit(d, 'hour'));
    G.count.forEach(d => digit(d, 'count'));
    assert.ok(Number.isFinite(G.road.p) && Number.isFinite(G.road.e), `${where}: road ${G.road.p},${G.road.e}`);
    assert.ok(!Number.isNaN(G.road.p) && !Number.isNaN(G.road.e), `${where}: road NaN`);
    for (const [id, r] of Object.entries(G.rooms)) for (const e of r.ents) {
        assert.ok(Number.isInteger(e.x) && Number.isInteger(e.y), `${where}: ${id}.${e.id} at ${e.x},${e.y}`);
        if (e.s) for (const [k, ds] of Object.entries(e.s)) ds.forEach(d => digit(d, `${id}.${e.id}.${k}`));
    }
    /* the player never stands inside something solid (unless dead, sunk) */
    if (!G.dead) {
        const solid = A.entsAt(G.p.x, G.p.y).filter(e => A.solidFor(e) && e.k !== 'loose');
        assert.equal(solid.length, 0, `${where}: standing inside ${solid.map(e => e.id)} in ${G.room} at ${G.p.x},${G.p.y}`);
        assert.ok(!A.T(G.p.x, G.p.y).solid, `${where}: standing in a wall in ${G.room} at ${G.p.x},${G.p.y}`);
    }
}

for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    test(`random play, seed ${seed}`, () => {
        const r = rng(seed * 7919);
        const A = load();
        A.newGame();
        const G = () => A.G;
        /* a generous start, so the dice reach everywhere */
        G().pocket = seed % 3 === 0 ? [10, 0, 10] : [0, 9, 5];
        if (seed % 2) { G().items.specs = 1; G().items.watch = 1; }
        const rooms = Object.keys(A.ROOMS);
        for (let step = 0; step < 1500; step++) {
            const where = `seed ${seed} step ${step}`;
            const roll = r();
            if (G().dead) { A.undo(); continue; }
            if (roll < 0.02) {
                /* teleport somewhere standable (not undoable: clear the history) */
                const room = pick(r, rooms);
                G().room = room;
                const spots = [];
                for (let y = 0; y < 11; y++) for (let x = 0; x < 16; x++) if (A.groundOk(x, y) && !A.blockedByEnt(x, y) && A.tileAt(x, y) !== 'M') spots.push([x, y]);
                if (spots.length) [G().p.x, G().p.y] = pick(r, spots);
                A.UNDO.length = 0;
                continue;
            }
            const before = J(G());
            let a;
            if (roll < 0.62) a = { t: 'move', d: pick(r, ['u', 'd', 'l', 'r']) };
            else if (roll < 0.95) {
                const ts = A.swapTargets();
                a = { t: 'swap', tg: pick(r, ts), pi: Math.floor(r() * G().pocket.length) };
            } else a = { t: 'wait' };
            let ok;
            try { A.clearEV(); ok = A.act(a); } catch (e) { throw new Error(`${where}: ${JSON.stringify(a)} threw ${e.stack}`); }
            checkWorld(A, where);
            if (ok && A.UNDO.length) {
                const after = J(G());
                A.undo();
                assert.deepEqual(J(G()), before, `${where}: undo of ${JSON.stringify(a)} in ${before.room} didn't restore`);
                /* and do it again for real */
                A.clearEV();
                A.act(a);
                if (!G().dead) checkWorld(A, where + ' (redo)');
                void after;
            }
        }
    });
}
