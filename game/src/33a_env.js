/* ---- 33a_env.js ---- */
/* The new 3D look (being built in the test area first: ?lab, scripts/island/plan-lab.mjs). Where the HD-2D view
   (31_render3d.js) stands flat pictures up as cards and lays the painted island on a height grid, this builds the
   world itself: ground with stone walls that stand straight up, a beach that runs down under the water, stream and pond
   beds you can see into (33d_env_water.js), trees with real crowns of leaves (33c_env_trees.js), houses and shops with
   roofs, windows and doors you can see round (33e_env_build.js), grass and flowers (33f_env_grass.js), all lit by the
   same sun, sky and lamps. People (and anything that moves) are still the HD cards. "HD-2D graphics" stays the
   fallback: with the new look off (localStorage sc-env-next = 0) the test area is drawn the old way, for comparing. */
const ENV = {
    LV: 1.5,            // a level's height (world units; a tile is one unit across)
    BASE: 0.25,         // the low ground's height above the sea
    RES: 4,             // height points a tile
    CHUNK: 16,          // tiles a ground piece
    cam: { dist: 12.2, pitch: 34, fov: 44, ahead: 2.0 },
    dof: [25, 62, 7.6, 5.2],   // where the background starts to blur (and fully), where the foreground does (the concept keeps the trees behind the houses sharp)
    people: 1.3,        // how much bigger people stand than in the classic HD-2D view
    items: 0.6,         // and things lying on the ground
};
const Env = {
    on: false, built: null, failed: false,
    want() { return LAB && !this.failed && lsGet('sc-env-next') !== '0'; },
    active(a) { return this.want() && !!a && a.id === 'island' && !a.interior; },
    /* the HD-2D view asks every frame: draw the island the new way? (builds it the first time) */
    update(r3, a) {
        // (built before the Blender models had arrived: build it again with them)
        if (this.built && this.built.noModels && typeof EnvModels !== 'undefined' && EnvModels.ready) this.teardown(r3);
        if (!this.built) {
            try { this.build(r3, a); }
            catch (e) { console.error('the new 3D look could not be built (using the HD-2D view)', e); this.failed = true; this.teardown(r3); return false; }
        }
        this.on = true;
        this.built.group.visible = true;
        for (const f of this.built.tick) f(r3, a);
        return true;
    },
    hide() {
        if (this.on && R3.sea && G.area && !G.area.interior) R3.sea.visible = true;      // (the HD-2D view's own sea back)
        this.on = false;
        if (this.built) this.built.group.visible = false;
    },
    teardown(r3) {
        const b = this.built;
        this.built = null; this.on = false;
        if (!b) return;
        r3.scene.remove(b.group);
        // (the models' geometry and materials are kept for the next build)
        b.group.traverse(o => { if (o.userData.shared) { if (o.userData.ownMat) o.material.dispose(); return; } if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    },
    build(r3, a) {
        const t0 = performance.now();
        const group = new THREE.Group();
        r3.scene.add(group);
        const models = typeof EnvModels !== 'undefined';
        if (models) EnvModels.load();
        this.built = { group, tick: [], parts: {}, noModels: models && !EnvModels.ready && !EnvModels.failed };
        this.ground = EnvGround.build(group);
        this.built.parts.ground = this.ground;
        if (this.ground.tick) this.built.tick.push(this.ground.tick);     // (the season's colors)
        for (const [name, B] of [['water', typeof EnvWater !== 'undefined' && EnvWater], ['trees', typeof EnvTrees !== 'undefined' && EnvTrees],
            ['build', typeof EnvBuild !== 'undefined' && EnvBuild], ['walls', typeof EnvWalls !== 'undefined' && EnvWalls], ['grass', typeof EnvGrass !== 'undefined' && EnvGrass],
            ['contact', typeof EnvContact !== 'undefined' && EnvContact]]) {
            if (!B) continue;
            const p = B.build(group, a);
            this.built.parts[name] = p;
            if (p && p.tick) this.built.tick.push(p.tick);
        }
        console.log(`the new 3D look built in ${Math.round(performance.now() - t0)} ms`);
    },
    /* what the new look draws itself (the HD-2D view leaves these out) */
    takes(e) {
        if (!this.on) return false;
        const k = e.kind;
        if (k === 'tree' || k === 'palm' || k === 'fruittree' || k === 'bigtree' || k === 'oldtree' || k === 'building' || k === 'waterfall' || e.wildFlower) return true;
        if (k === 'bush' || (typeof EnvBuild !== 'undefined' && (EnvBuild.props[k] || EnvBuild.propModel(e)))) return true;
        if (e.holiday && /pumpkin/.test(e.frame || '')) return true;
        return false;
    },
    /* the ground's height under a spot (world pixels), for people and cards standing on it */
    groundH(x, y) { return this.ground ? EnvGround.heightAt(x / TILE, y / TILE) : 0; },
};

/* ---------------------------------------------------------------- the ground */
/* Heights: each tile's level, with the walls put where they look right: a south-facing cliff's two rows of face (the
   game blocks both) become a wall between the first and second row, an east or west face a wall down the middle of its
   column; the sea floor slopes down from the beach; stream and pond beds are dug in. Between two cells far apart in height
   the ground goes straight up (a wall); between near ones it slopes (a beach, a bank). */
const EnvGround = {
    /* half-tile cells: the level each shows (in height units) */
    cells() {
        const Wt = W0.w, Ht = W0.h, CW = Wt * 2, CH = Ht * 2, v = new Float32Array(CW * CH);
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht) ? -1 : W0.grid[y][x] === '~' ? -1 : +W0.height[y][x] || 0;
        const land = (x, y) => L(x, y) >= 0;
        const ramp = new Set((W0.ramps || []).map(([x, y]) => x + ',' + y));
        // how far each sea tile is from land (the sea floor goes down with it)
        const dSea = new Float32Array(Wt * Ht).fill(99), q = [];
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (land(x, y)) { dSea[y * Wt + x] = 0; q.push(y * Wt + x); }
        for (let h = 0; h < q.length; h++) { const k = q[h], x = k % Wt, y = (k / Wt) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= Wt || ny >= Ht) continue; const n = ny * Wt + nx, d = dSea[k] + (dx && dy ? 1.41 : 1); if (d < dSea[n]) { dSea[n] = d; q.push(n); } } }
        // how far each water tile is from its bank (the bed is deeper in the middle)
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && 'orh'.includes(W0.grid[y][x]);
        const dBank = new Float32Array(Wt * Ht);
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (wet(x, y)) {
            let d = 9;
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!wet(x + dx, y + dy) && !(W0.grid[y + dy] && W0.grid[y + dy][x + dx] === 'W')) d = Math.min(d, Math.hypot(dx, dy));
            dBank[y * Wt + x] = d;
        }
        const H = (lv) => ENV.BASE + lv * ENV.LV;
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            const l = L(x, y);
            let a = l < 0 ? -(0.2 + Math.min(1.8, (dSea[y * Wt + x] - 0.5) * 0.55)) : H(l), b = a, c = a, d = a;      // a b / c d: the four halves
            if (l >= 0) {
                const up1 = L(x, y - 1), up2 = L(x, y - 2);
                if (up1 > l) { a = b = c = d = H(up1); }                                  // the first row under a cliff: the top of the wall
                else if (up2 > l && up1 === l) { /* the second row: the foot of the wall */ }
                const lf = L(x - 1, y), rt = L(x + 1, y);
                if (lf > l && !(up1 > l)) { a = c = H(lf); }                              // an east-facing wall down the middle
                if (rt > l && !(up1 > l)) { b = d = H(rt); }
                if (wet(x, y)) { const bed = Math.min(0.9, 0.32 + dBank[y * Wt + x] * 0.32); a -= bed; b -= bed; c -= bed; d -= bed; }
            }
            v[(y * 2) * CW + x * 2] = a; v[(y * 2) * CW + x * 2 + 1] = b; v[(y * 2 + 1) * CW + x * 2] = c; v[(y * 2 + 1) * CW + x * 2 + 1] = d;
        }
        // stairs: a straight slope from the top of the wall to its foot (the steps themselves are drawn over it)
        for (const [x, y] of W0.ramps || []) {
            const top = L(x, y - 1) > L(x, y) ? y : y - 1, hi = H(Math.max(L(x, top - 1), L(x, y))), lo = H(L(x, top + 1));
            for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
                const fy = (y - top) + (j + 0.5) / 2;            // 0..2 across the two rows
                v[(y * 2 + j) * CW + x * 2 + i] = hi + (lo - hi) * Math.min(1, Math.max(0, fy / 2));
            }
        }
        return { v, CW, CH, ramp, H };
    },
    /* the height at a point (tiles): between half-cell centres, straight up across a wall, a slope across a bank */
    sample(C, u, v) {
        const fx = u * 2 - 0.5, fy = v * 2 - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0;
        const at = (i, j) => C.v[Math.max(0, Math.min(C.CH - 1, j)) * C.CW + Math.max(0, Math.min(C.CW - 1, i))];
        const a = at(i0, j0), b = at(i0 + 1, j0), c = at(i0, j0 + 1), d = at(i0 + 1, j0 + 1);
        const range = Math.max(a, b, c, d) - Math.min(a, b, c, d);
        let sx = tx, sy = ty;
        if (range > 0.9) { sx = Math.max(0, Math.min(1, (tx - 0.38) / 0.24)); sy = Math.max(0, Math.min(1, (ty - 0.38) / 0.24)); }
        else { sx = tx * tx * (3 - 2 * tx); sy = ty * ty * (3 - 2 * ty); }
        return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    },
    /* ponds and streams with natural shores: where the water tiles' outline, blurred and pushed about by a noise, crosses
       a half is the waterline (round corners, wobbly edges instead of the tiles' square steps); the bed deepens from it
       and the bank rises gently back to the ground. Only ground at the water's own level is touched (not the walls by a
       waterfall), and only within a few tenths of a tile of the tiles' edges, so where people can walk stays the same. */
    shapeWater(h, W, Hn) {
        const R = ENV.RES, Wt = W0.w, Ht = W0.h, LV = ENV.LV, BASE = ENV.BASE;
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && 'orh'.includes(W0.grid[y][x]);
        const lvl = (x, y) => +W0.height[Math.max(0, Math.min(Ht - 1, y))][Math.max(0, Math.min(Wt - 1, x))] || 0;
        const tileOf = (i, n) => Math.max(0, Math.min(n - 1, Math.floor(i / R - 0.001)));
        const levels = new Set();
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (wet(x, y)) levels.add(lvl(x, y));
        if (!levels.size) return;
        // value noise (two octaves, about a tile and a half and half a tile across)
        const hs = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
        const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
            return (hs(xi, yi) * (1 - u) + hs(xi + 1, yi) * u) * (1 - v) + (hs(xi, yi + 1) * (1 - u) + hs(xi + 1, yi + 1) * u) * v; };
        const blur = (m, r) => {
            const t = new Float32Array(W * Hn);
            for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
                for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
                    let s = 0, c = 0;
                    for (let k = -r; k <= r; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= W || yy >= Hn) continue; s += m[yy * W + xx]; c++; }
                    t[y * W + x] = s / c;
                }
                m.set(t);
            }
        };
        for (const L of levels) {
            const surf = BASE + L * LV - 0.14, m = new Float32Array(W * Hn);
            for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) { const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht); if (wet(tx, ty) && lvl(tx, ty) === L) m[y * W + x] = 1; }
            blur(m, 2);
            for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
                const k = y * W + x, mv = m[k];
                if (mv < 0.02) continue;
                const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht), h0 = h[k];
                if (lvl(tx, ty) !== L || h0 > surf + 0.3 || h0 < surf - 1.2) continue;
                const u = x / R, v = y / R, wv = mv + (vn(u / 1.5, v / 1.5) * 0.65 + vn(u / 0.55 + 17, v / 0.55) * 0.35 - 0.5) * 0.32;
                if (wv > 0.5) h[k] = surf - Math.min(0.75, (wv - 0.5) * 2.2);                     // the bed
                else if (wv > 0.25) { const t = (wv - 0.25) / 0.25; h[k] = Math.min(h0, surf + (h0 - surf) * (1 - t * t * (3 - 2 * t))); }   // the bank
            }
        }
    },
    heightAt(u, v) {
        const g = this.grid;
        if (!g) return 0;
        const fx = Math.max(0, Math.min(g.W - 1.001, u * ENV.RES)), fy = Math.max(0, Math.min(g.Hn - 1.001, v * ENV.RES));
        const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, h = g.h, i = iy * g.W + ix;
        return (h[i] * (1 - tx) + h[i + 1] * tx) * (1 - ty) + (h[i + g.W] * (1 - tx) + h[i + g.W + 1] * tx) * ty;
    },
    /* what kind of ground each spot is: grass, dirt, cobbles, sand (a picture over the whole island, 8 pixels a tile,
       from the same rounded kinds as the HD-2D ground) */
    kinds() {
        const Wt = W0.w, Ht = W0.h, P = 8, N = Wt * P, M = Ht * P, d = new Uint8Array(N * M * 4);
        const K = { t: new Uint8Array((Wt + 4) * (Ht + 4)), wet: new Uint8Array((Wt + 4) * (Ht + 4)), w: Wt + 4, x0: -2, y0: -2 };
        for (let j = 0; j < Ht + 4; j++) for (let i = 0; i < Wt + 4; i++) {
            const tx = i - 2, ty = j - 2, c = r3ClassAt(tx, ty), g = W0.grid[ty] ? W0.grid[ty][tx] : '~', k = j * K.w + i;
            K.t[k] = c; K.wet[k] = c !== R3_MAT.keep ? 0 : g === undefined || '~orhW'.includes(g) ? 1 : 2;
        }
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
            const wx = (x + 0.5) / P * TILE, wy = (y + 0.5) / P * TILE, ty = Math.floor(wy / TILE), tx = Math.floor(wx / TILE);
            let kd = r3KindAt(K, wx, wy, 0, 0, 0) & 15;
            const g = W0.grid[ty] && W0.grid[ty][tx];
            if (kd === R3_MAT.keep && g === '~') kd = R3_MAT.sand;                  // the sea floor is sand
            if (kd === R3_MAT.keep && (g === 'o' || g === 'r' || g === 'h')) kd = 7; // a stream or pond bed
            if (kd === R3_MAT.stairs || kd === R3_MAT.rock) kd = R3_MAT.grass;
            const o = ((M - 1 - y) * N + x) * 4;
            d[o] = kd === 1 ? 255 : 0; d[o + 1] = kd === 2 ? 255 : 0; d[o + 2] = kd === 3 ? 255 : 0; d[o + 3] = kd === 4 ? 255 : kd === 7 ? 128 : 0;
        }
        // soften where grass, dirt and cobbles meet (about a third of a tile each way): the shader cuts the edge with noise
        // there, so paths and the square end raggedly in the grass, as in the concept
        const tmp = new Float32Array(N * M);
        for (let ch = 0; ch < 3; ch++) for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
            const R = 3;
            for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
                let s = 0, c = 0;
                for (let k = -R; k <= R; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= N || yy >= M) continue; s += d[(yy * N + xx) * 4 + ch]; c++; }
                tmp[y * N + x] = s / c;
            }
            for (let i = 0; i < N * M; i++) d[i * 4 + ch] = Math.round(tmp[i]);
        }
        const t = new THREE.DataTexture(d, N, M, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
        return t;
    },
    /* how near each spot is to a pond's or stream's water (8 pixels a tile, softened over about half a tile): the bank
       there is damp, pebbly earth */
    wetTex() {
        const Wt = W0.w, Ht = W0.h, P = 8, N = Wt * P, M = Ht * P, v = new Float32Array(N * M), d = new Uint8Array(N * M * 4);
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) { const g = W0.grid[Math.floor(y / P)][Math.floor(x / P)]; v[y * N + x] = g === 'o' || g === 'r' ? 1 : 0; }
        const tmp = new Float32Array(N * M), R = 5;
        for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
            for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
                let s = 0, c = 0;
                for (let k = -R; k <= R; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= N || yy >= M) continue; s += v[yy * N + xx]; c++; }
                tmp[y * N + x] = s / c;
            }
            v.set(tmp);
        }
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) d[((M - 1 - y) * N + x) * 4] = Math.round(v[y * N + x] * 255);
        this.wet = { v, N, M, P };
        const t = new THREE.DataTexture(d, N, M, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
        return t;
    },
    /* how wet the bank is at a spot (tiles): 0 away from ponds and streams, 1 in them */
    wetAt(x, y) {
        const w = this.wet;
        if (!w) return 0;
        const i = Math.max(0, Math.min(w.N - 1, Math.floor(x * w.P))), j = Math.max(0, Math.min(w.M - 1, Math.floor(y * w.P)));
        return w.v[j * w.N + i];
    },
    build(group) {
        const C = this.cells(), R = ENV.RES, Wt = W0.w, Ht = W0.h, W = Wt * R + 1, Hn = Ht * R + 1, h = new Float32Array(W * Hn);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) h[y * W + x] = this.sample(C, x / R, y / R);
        this.shapeWater(h, W, Hn);
        this.grid = { h, W, Hn };
        // shade where the ground is hemmed in (the foot of a wall, a stream's banks): darker, as the sky reaches it less
        const ao = new Float32Array(W * Hn);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
            const h0 = h[y * W + x];
            let occ = 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, -2], [0, 2], [3, -3], [-3, -3], [0, -4]]) {
                const xx = Math.max(0, Math.min(W - 1, x + dx)), yy = Math.max(0, Math.min(Hn - 1, y + dy)), up = h[yy * W + xx] - h0;
                if (up > 0.05) occ += Math.min(1, up / (Math.hypot(dx, dy) / R * 2.2));
            }
            ao[y * W + x] = Math.max(0.42, 1 - occ * 0.14);
        }
        const T = EnvTex, cob = T.cobble(), wall = T.wall(), grass = T.grass(), dirt = T.dirt(), sand = T.sand();
        const kinds = this.kinds();
        // the surfaces baked in Blender (the concept's flagstones, the path, the lawn) where they've loaded, else our own
        const X = typeof EnvModels !== 'undefined' ? EnvModels.textures : {}, B = (n, k, f) => X[n + '_' + k] || f;
        const flat = this.flatTex || (this.flatTex = Object.assign(new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, THREE.RGBAFormat), { needsUpdate: true }));
        const uniforms = {
            uKinds: { value: kinds }, uMapSz: { value: new THREE.Vector2(Wt, Ht) },
            tGrass: { value: B('lawn', 'col', grass.map) }, tDirt: { value: B('path', 'col', dirt.map) }, tCob: { value: B('flagstones', 'col', cob.map) }, tSand: { value: sand.map }, tWall: { value: wall.map },
            nGrass: { value: B('lawn', 'nrm', grass.normal) }, nDirt: { value: B('path', 'nrm', dirt.normal) }, nCob: { value: B('flagstones', 'nrm', cob.normal) }, nSand: { value: sand.normal }, nWall: { value: wall.normal },
            hCob: { value: B('flagstones', 'hgt', flat) }, hDirt: { value: B('path', 'hgt', flat) },
            uWet: { value: this.wetTex() },
            uSeason: { value: new THREE.Vector4(1, 1, 1, 0) },
        };
        this.uniforms = uniforms;
        this._season = null;                // (new uniforms: the season's colors go in on the first frame)
        const mat = r3Patch(new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0, color: 0xffffff }), {
            key: 'envground', uniforms,
            vhead: 'attribute float aAO; varying float vAO; varying vec3 vNw;\n',
            vbody: 'vAO = aAO; vNw = normal;',
            fhead: EnvGround.FHEAD, fmap: EnvGround.FMAP, fnormal: EnvGround.FNORMAL, derivatives: true,
        });
        // the pieces: R points a tile, normals from the whole island's heights (no seams)
        const CH = ENV.CHUNK, meshes = [];
        for (let cy = 0; cy * CH < Ht; cy++) for (let cx = 0; cx * CH < Wt; cx++) {
            const tw = Math.min(CH, Wt - cx * CH), th = Math.min(CH, Ht - cy * CH), nx = tw * R + 1, ny = th * R + 1;
            const pos = new Float32Array(nx * ny * 3), nrm = new Float32Array(nx * ny * 3), aoA = new Float32Array(nx * ny), idx = [];
            for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
                const gx = cx * CH * R + i, gy = cy * CH * R + j, k = j * nx + i, hh = h[gy * W + gx];
                pos[k * 3] = gx / R; pos[k * 3 + 1] = hh; pos[k * 3 + 2] = gy / R * R3_ZS;
                const hl = h[gy * W + Math.max(0, gx - 1)], hr = h[gy * W + Math.min(W - 1, gx + 1)], hu = h[Math.max(0, gy - 1) * W + gx], hd = h[Math.min(Hn - 1, gy + 1) * W + gx];
                const ex = (hr - hl) / (2 / R), ez = (hd - hu) / (2 / R * R3_ZS), l = Math.hypot(ex, 1, ez);
                nrm[k * 3] = -ex / l; nrm[k * 3 + 1] = 1 / l; nrm[k * 3 + 2] = -ez / l;
                aoA[k] = ao[gy * W + gx];
            }
            for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
                const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
                // split each square along the diagonal that follows the ground (no saw teeth along a wall's top)
                const ha = pos[a * 3 + 1], hb = pos[b * 3 + 1], hc = pos[c * 3 + 1], hd = pos[d * 3 + 1];
                if (Math.abs(ha - hd) < Math.abs(hb - hc)) idx.push(a, c, d, a, d, b); else idx.push(a, c, b, b, c, d);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
            geo.setAttribute('aAO', new THREE.BufferAttribute(aoA, 1));
            geo.setIndex(idx);
            geo.computeBoundingSphere();
            const m = new THREE.Mesh(geo, mat);
            // (the ground takes shadows but doesn't cast them: a height grid shading itself comes out in stripes)
            m.receiveShadow = true; m.castShadow = false;
            m.renderOrder = -2;
            group.add(m);
            meshes.push(m);
        }
        return { meshes, mat, tick: (r3, a) => {
            const s = a.bgSeason || Clock.season();
            if (s !== this._season) { this._season = s; uniforms.uSeason.value.set(...({ spring: [1, 1.04, 0.92], summer: [1, 1, 1], fall: [1.08, 1.0, 0.78], winter: [1.3, 1.32, 1.4] }[s] || [1, 1, 1]), s === 'winter' ? 1 : 0); }
        } };
    },
};
/* the ground's shader (a MeshStandardMaterial's, with the light, shadows and haze it brings): what kind each spot is comes
   from the kinds picture (blended, with ragged edges so grass reaches over paths), each kind from its own surface;
   anything steep is the stone wall, laid in courses across its face */
EnvGround.FHEAD = `
uniform sampler2D uKinds; uniform vec2 uMapSz; uniform vec4 uSeason;
uniform sampler2D tGrass; uniform sampler2D tDirt; uniform sampler2D tCob; uniform sampler2D tSand; uniform sampler2D tWall;
uniform sampler2D nGrass; uniform sampler2D nDirt; uniform sampler2D nCob; uniform sampler2D nSand; uniform sampler2D nWall;
uniform sampler2D hCob; uniform sampler2D hDirt; uniform sampler2D uWet;
varying float vAO; varying vec3 vNw;
vec4 envW; float envSteep; vec3 envWallN; vec2 envWallUv;
`;
EnvGround.FMAP = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)});
    vec4 k = texture2D(uKinds, vec2(tp.x / uMapSz.x, 1.0 - tp.y / uMapSz.y));
    float bed = step(0.3, k.a) * step(k.a, 0.7);
    float sandW = k.a > 0.7 ? 1.0 : 0.0;
    // ragged edges: grass pushes into the others where a fine noise says so
    float rag = r3n(tp * 1.6 + 11.0) * 0.4 + r3n(tp * 5.3) * 0.36 + r3n(tp * 13.1 + 3.0) * 0.24;
    float tot = k.r + k.g + k.b + sandW * k.a;
    // grass where the softened weight, pushed about by the noise, passes a half: a ragged edge a few pixels soft. Where
    // the square or a path meets the grass, what stands up (the flagstones, the pebbles) keeps longest and the gaps go
    // green first, so the stones straggle out into the lawn as in the concept
    vec2 u4h = tp * 0.25;
    float hard = (k.b * texture2D(hCob, u4h).r + k.g * texture2D(hDirt, u4h).r * 0.8) / max(0.001, k.b + k.g);
    float gw = smoothstep(0.4, 0.6, k.r + (rag - 0.5) * 0.45 - (k.b + k.g > 0.04 ? (hard - 0.42) * 0.55 : 0.0));
    vec4 w = vec4(gw, k.g, k.b, sandW * k.a);
    float o = w.y + w.z + w.w;
    if (o < 0.01) w.x = 1.0; else w.yzw *= (1.0 - gw) / o;
    envW = w;
    vec2 u4 = tp * 0.25;
    vec3 cg = texture2D(tGrass, u4).rgb * uSeason.rgb;
    vec3 cd = texture2D(tDirt, u4).rgb, cc = texture2D(tCob, u4).rgb, cs = texture2D(tSand, u4).rgb;
    vec3 col = cg * w.x + cd * w.y + cc * w.z + cs * w.w;
    // a stream or pond bed: sand and pebbles, darker
    if (bed > 0.5 && tot < 0.05) col = mix(cs, cd, 0.5) * 0.7;
    if (tot < 0.05 && bed < 0.5) col = cs * 0.85;
    // a pond's or stream's bank: damp, pebbly earth between the grass and the water, its edge ragged
    float wetv = texture2D(uWet, vec2(tp.x / uMapSz.x, 1.0 - tp.y / uMapSz.y)).r;
    float bank = smoothstep(0.06, 0.32, wetv + (rag - 0.5) * 0.3) * step(0.05, tot);
    col = mix(col, cd * vec3(0.58, 0.54, 0.48), bank * 0.85);
    // darker where grass meets a path (a little shadow under the overhang)
    col *= 1.0 - 0.18 * w.x * (w.y + w.z) * 4.0;
    // soft patches of lighter and darker over everything
    col *= 0.92 + 0.16 * r3n(tp * 0.21 + 7.0);
    // winter: snow lying over the lawn, thinner on the paths
    col = mix(col, vec3(0.9, 0.93, 0.98) * (0.94 + 0.08 * r3n(tp * 3.1)), uSeason.w * clamp(w.x * 0.9 + (w.y + w.z) * 0.55 + w.w * 0.3, 0.0, 0.92));
    // walls
    vec3 nw = normalize(vNw);
    envSteep = smoothstep(0.4, 0.62, 1.0 - abs(nw.y));
    bool ew = abs(nw.x) > abs(nw.z);
    envWallUv = (ew ? vec2(vWp.z / ${R3_ZS.toFixed(3)}, -vWp.y) : vec2(vWp.x, -vWp.y)) * 0.25;
    vec3 cw = texture2D(tWall, envWallUv).rgb;
    col = mix(col, cw, envSteep);
    diffuseColor.rgb = col * vAO;
}`;
/* (the surfaces' bumps: blended like their colors, turned onto the ground or onto the wall's face) */
EnvGround.FNORMAL = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)}) * 0.25;
    vec3 tn = (texture2D(nGrass, tp).xyz * envW.x + texture2D(nDirt, tp).xyz * envW.y + texture2D(nCob, tp).xyz * envW.z + texture2D(nSand, tp).xyz * envW.w) * 2.0 - 1.0;
    vec3 wn = texture2D(nWall, envWallUv).xyz * 2.0 - 1.0;
    vec3 N = normalize(vNw);
    // on the ground: across is +x, down the picture is +z (the pictures keep the slope going down them in green)
    vec3 gN = normalize(vec3(tn.x, 0.0, -tn.y) + N * max(0.2, tn.z));
    // on a wall: across (x, or z on an east or west face), and up the wall
    bool ew = abs(N.x) > abs(N.z);
    vec3 T = ew ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), B = vec3(0.0, 1.0, 0.0);
    vec3 wN = normalize(T * wn.x + B * wn.y + N * max(0.2, wn.z));
    vec3 nW = normalize(mix(gN, wN, envSteep));
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
}`;
