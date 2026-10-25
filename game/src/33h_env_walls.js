/* ---- 33h_env_walls.js ---- */
/* The stone walls where one level of ground meets the next, in the new 3D look, from the wall pieces made in Blender
   (tools/blender/stone_wall.py): along every south, east and west face of higher ground, pieces of 2 and 1 tiles (their
   stone layouts mixed, so a long wall doesn't repeat) standing on the lower ground just in front of the ground's own steep
   face, and a corner piece where a wall turns. Never across a waterfall (its sheet falls there), a stream or a staircase.
   Where the faces are comes from EnvGround's rules: a south face at the far edge of the first row under higher ground, an
   east or west face down the middle of the column beside it. */
const EnvWalls = {
    BACK: 0.14,             // how far behind the ground's face a piece's back plane stands (its stones stand out in front)
    build(group, a) {
        if (typeof EnvModels === 'undefined' || !EnvModels.has('wall2_a')) return { meshes: [] };
        const Wt = W0.w, Ht = W0.h, LV = ENV.LV, BASE = ENV.BASE, ZS = R3_ZS;
        const g = (x, y) => (W0.grid[y] && W0.grid[y][x]) || '~';
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht || EnvGround.waterAt(x, y) === 1) ? -1 : +W0.height[y][x] || 0;
        const ramp = new Set((W0.ramps || []).map(([x, y]) => x + ',' + y));
        const open = (x, y) => ramp.has(x + ',' + y) || 'Wrhow'.includes(g(x, y));
        // the faces, tile by tile: [x, y, low level, levels up]
        const south = new Map(), east = new Map(), west = new Map();
        for (let y = 1; y < Ht - 1; y++) for (let x = 0; x < Wt; x++) {
            const l = L(x, y);
            if (l < 0 || open(x, y) || open(x, y + 1)) continue;
            const up1 = L(x, y - 1);
            if (up1 > l) { south.set(x + ',' + y, [x, y, l, up1 - l]); continue; }
            const lf = L(x - 1, y), rt = L(x + 1, y);
            if (lf > l && !open(x - 1, y)) east.set(x + ',' + y, [x, y, l, lf - l]);
            if (rt > l && !open(x + 1, y)) west.set(x + ',' + y, [x, y, l, rt - l]);
        }
        // runs of faces of the same height, filled with pieces of 2 and 1 tiles (a little shuffled)
        const placed = {}, put = (n, m) => (placed[n] = placed[n] || []).push(m);
        const fill = (len, r, at) => {
            let i = 0;
            while (i < len) {
                const two = len - i >= 2 && r() < 0.8;
                const n = two ? ['wall2_a', 'wall2_b', 'wall2_c'][(r() * 3) | 0] : ['wall1_a', 'wall1_b'][(r() * 2) | 0];
                at(n, i);
                i += two ? 2 : 1;
            }
        };
        const runs = (faces, along) => {
            const out = [], seen = new Set();
            for (const [k, f] of faces) {
                if (seen.has(k)) continue;
                const [x, y, l, d] = f;
                // walk back to the run's start, then forward to its end
                let s = along === 'x' ? x : y;
                while (faces.has(along === 'x' ? (s - 1) + ',' + y : x + ',' + (s - 1)) && faces.get(along === 'x' ? (s - 1) + ',' + y : x + ',' + (s - 1))[2] === l) s--;
                let e = s;
                while (faces.has(along === 'x' ? e + ',' + y : x + ',' + e) && faces.get(along === 'x' ? e + ',' + y : x + ',' + e)[2] === l) { seen.add(along === 'x' ? e + ',' + y : x + ',' + e); e++; }
                out.push({ x, y, s, e, l, d });
            }
            return out;
        };
        for (const R of runs(south, 'x')) {
            const r = mulberry(hash32('ws' + R.s + ',' + R.y)), z = (R.y + 1) * ZS - this.BACK, y0 = BASE + R.l * LV;
            fill(R.e - R.s, r, (n, i) => put(n, EnvModels.mat4(R.s + i, y0, z, 0, 1, R.d, 1)));
            // a corner where the wall turns north at either end
            if (east.has(R.e + ',' + R.y)) put('wall_corner', EnvModels.mat4(R.e - 0.1, y0, z + 0.02, 0, 1, R.d, 1));
            if (west.has((R.s - 1) + ',' + R.y)) put('wall_corner', EnvModels.mat4(R.s - 0.6, y0, z + 0.02, 0, 1, R.d, 1));
            // where the higher ground juts a tile further south just past the run's end (or before its start), the wall
            // turns along the jut's side and meets the next run round a corner, instead of stopping with its end showing
            const z2 = (R.y + 2) * ZS - this.BACK + 0.02;
            if (L(R.e, R.y) > R.l && !open(R.e, R.y)) {
                const d = L(R.e, R.y) - R.l;
                put('wall1_a', EnvModels.mat4(R.e + this.BACK, y0, (R.y + 1) * ZS, -Math.PI / 2, ZS, d, 1));
                put('wall_corner', EnvModels.mat4(R.e - 0.6, y0, z2, 0, 1, d, 1));
            } else if (!east.has(R.e + ',' + R.y)) put('wall_corner', EnvModels.mat4(R.e - 0.35, y0, z + 0.03, 0, 1, R.d, 1));    // (a free end: a post of big stones)
            if (L(R.s - 1, R.y) > R.l && !open(R.s - 1, R.y)) {
                const d = L(R.s - 1, R.y) - R.l;
                put('wall1_b', EnvModels.mat4(R.s - this.BACK, y0, (R.y + 2) * ZS, Math.PI / 2, ZS, d, 1));
                put('wall_corner', EnvModels.mat4(R.s - 0.1, y0, z2, 0, 1, d, 1));
            } else if (!west.has((R.s - 1) + ',' + R.y)) put('wall_corner', EnvModels.mat4(R.s - 0.35, y0, z + 0.03, 0, 1, R.d, 1));
        }
        // (an east face looks east: the piece turned a quarter, its length running north; a west face the other way)
        for (const R of runs(east, 'y')) {
            const r = mulberry(hash32('we' + R.x + ',' + R.s)), x = R.x + 0.5 - this.BACK, y0 = BASE + R.l * LV;
            fill(R.e - R.s, r, (n, i) => put(n, EnvModels.mat4(x, y0, (R.e - i) * ZS, Math.PI / 2, ZS, R.d, 1)));
        }
        for (const R of runs(west, 'y')) {
            const r = mulberry(hash32('ww' + R.x + ',' + R.s)), x = R.x + 0.5 + this.BACK, y0 = BASE + R.l * LV;
            fill(R.e - R.s, r, (n, i) => put(n, EnvModels.mat4(x, y0, (R.s + i) * ZS, -Math.PI / 2, ZS, R.d, 1)));
        }
        const meshes = [];
        for (const [n, list] of Object.entries(placed)) for (const m of EnvModels.instances(group, n, list)) { m.userData.shared = true; meshes.push(m); }
        return { meshes, count: Object.values(placed).reduce((s, l) => s + l.length, 0) };
    },
};
