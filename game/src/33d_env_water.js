/* ---- 33d_env_water.js ---- */
/* Water for the new 3D look (33a_env.js): the sea, the streams and ponds, and the waterfalls. The surfaces lie flat at their
   level; how deep the water is under each spot (from the ground's heights) picks its color, from clear and sandy at the
   edge through turquoise to deep blue, with foam where it meets the shore, ripples that move (streams run, the sea
   rolls in) and the sun glinting off it. Waterfalls are sheets of falling streaks with spray at the foot. Lily pads on
   the ponds, cattails and stones along the banks. */
const EnvWater = {
    lite: { value: 1 },     // (how bright the unlit white water is: falls, foam, spray, steam dim by night)
    build(group, a) {
        const Wt = W0.w, Ht = W0.h, G = EnvGround, LV = ENV.LV, BASE = ENV.BASE;
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht || G.waterAt(x, y) === 1) ? -1 : G.waterAt(x, y) === 2 ? G.waterLevel(x, y) : +W0.height[y][x] || 0;
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && G.waterAt(x, y) === 2;
        const surf = (x, y) => wet(x, y) ? G.surfAt(x, y) : 0;           // a water tile's surface (the sea's is 0)
        // how deep the water is everywhere (8 pixels a tile, so the shore is a smooth line): red is depth, green which water
        // (sea or not), blue how much of it round here is a stream's (which flows) rather than a pond's, alpha the hot spring
        const P = 8, N = Wt * P, M = Ht * P, d = new Uint8Array(N * M * 4);
        const runs = (x, y) => { const c = W0.grid[y] && W0.grid[y][x]; return c === 'r' || c === 'w' || c === 'W'; };
        const hot = (x, y) => W0.grid[y] && W0.grid[y][x] === 'h';
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
            const u = (x + 0.5) / P, v = (y + 0.5) / P, tx = Math.floor(u), ty = Math.floor(v);
            let s = 0, sea = 1, nw = 0, nr = 0, nh = 0, lo = 1e9, hi = -1e9;
            // inland water: the surface of the water tiles round here: the lowest one above the ground (by a waterfall the
            // pool's under the cliff, the stream's on top of it)
            const gh = G.heightAt(u, v);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (wet(tx + dx, ty + dy)) {
                const sf = surf(tx + dx, ty + dy);
                if (sf > gh - 0.05) lo = Math.min(lo, sf);
                hi = Math.max(hi, sf);
                sea = 0; nw++; if (runs(tx + dx, ty + dy)) nr++; if (hot(tx + dx, ty + dy)) nh++;
            }
            if (!sea) s = lo < 1e9 ? lo : hi;
            const depth = s - gh, o = ((M - 1 - y) * N + x) * 4;
            // (alpha: lower where the water is the hot spring's)
            d[o] = Math.max(0, Math.min(255, Math.round(depth * 100))); d[o + 1] = sea ? 255 : 0; d[o + 2] = nw ? Math.round(nr / nw * 255) : 0; d[o + 3] = nw ? 255 - Math.round(nh / nw * 128) : 255;
        }
        const depthTex = new THREE.DataTexture(d, N, M, THREE.RGBAFormat);
        depthTex.magFilter = depthTex.minFilter = THREE.LinearFilter; depthTex.generateMipmaps = false; depthTex.needsUpdate = true;
        const sand = EnvTex.sand(), uniforms = { tDepth: { value: depthTex }, uMapSz: { value: new THREE.Vector2(Wt, Ht) }, tSand: { value: sand.map }, uSunDir: { value: new THREE.Vector3(-0.55, 0.78, 0.32).normalize() }, uSky: { value: new THREE.Color(0.62, 0.8, 0.95) }, uSunCol: { value: new THREE.Color(1, 0.95, 0.85) }, uLite: this.lite, uRain: EnvGround.rain };
        // (see-through at its edges: its color laid over the ground, the ground's own depth of field kept in the alpha)
        const mat = r3Patch(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true }), { key: 'envwater', uniforms, fhead: EnvWater.FHEAD, fpre: EnvWater.FPRE, noDof: true });
        Object.assign(mat, { blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
        const meshes = [];
        // the sea: one big sheet at sea level (beyond the island too), a point every tile over the island and further apart
        // out to sea. (It needs the points: the view bends the world down towards the horizon at each point, and a sheet of
        // four corners bent only there sank under the sand as the camera moved, so the sea came and went.)
        const ax = (n) => { const o = []; for (let v = -20; v <= n + 20; v++) o.push(v); for (let st = 1.3, v = -20; v > -300; st *= 1.3) o.unshift(v -= st); for (let st = 1.3, v = n + 20; v < n + 300; st *= 1.3) o.push(v += st); return o; };
        const xs = ax(Wt), zs = ax(Ht), sp = [], si = [];
        for (const z of zs) for (const x of xs) sp.push(x, 0, z * R3_ZS);
        for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) { const a0 = j * xs.length + i, b0 = a0 + 1, c0 = a0 + xs.length, d0 = c0 + 1; si.push(a0, c0, b0, b0, c0, d0); }
        const seaGeo = new THREE.BufferGeometry();
        seaGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
        seaGeo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(sp.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
        seaGeo.setIndex(si);
        seaGeo.computeBoundingSphere();
        const sea = new THREE.Mesh(seaGeo, mat);
        sea.receiveShadow = true; sea.renderOrder = -1;
        group.add(sea); meshes.push(sea);
        // streams and ponds: a tile-sized sheet over each water tile, reaching a little past it (the banks rise through it)
        const pos = [], idx = [];
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            if (!wet(x, y)) continue;
            // (reaching past the tile's sides into the bank, but not toward water at another level: the stream's sheet
            // ends at a waterfall's lip and the pool's starts at its foot, neither hanging in the air over the drop)
            const s = surf(x, y), b = pos.length / 3, other = (i, j) => (wet(i, j) && Math.abs(surf(i, j) - s) > 0.1) || G.waterAt(i, j) === 1;
            const eW = other(x - 1, y) ? 0 : 0.7, eE = other(x + 1, y) ? 0 : 0.7, eN = other(x, y - 1) ? 0 : 0.7, eS = other(x, y + 1) ? 0 : 0.7;
            pos.push(x - eW, s, (y - eN) * R3_ZS, x + 1 + eE, s, (y - eN) * R3_ZS, x + 1 + eE, s, (y + 1 + eS) * R3_ZS, x - eW, s, (y + 1 + eS) * R3_ZS);
            idx.push(b, b + 3, b + 2, b, b + 2, b + 1);
        }
        if (pos.length) {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
            g.setIndex(idx);
            const m = new THREE.Mesh(g, mat);
            m.receiveShadow = true; m.renderOrder = -1;
            group.add(m); meshes.push(m);
        }
        // waterfalls
        // (see-through at its sides and its foot, which breaks up into the spray)
        const fallMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, depthWrite: false }), { key: 'envfall', uniforms: { uLite: this.lite }, fhead: 'varying vec3 vFall; uniform float uLite;\n', vhead: 'attribute vec3 aFall; varying vec3 vFall;\n', vbody: 'vFall = aFall;', fpre: EnvWater.FALL, noDof: true });
        const fp = [], fi = [], fa = [], falls = [];
        for (const wf of EnvWater.fallsJoined()) {
            // (as wide as the stream that feeds it: the water runs on over the lip at the width it had)
            const xs = wf.tiles.map(t => t[0]), ys = wf.tiles.map(t => t[1]), mx = (Math.min(...xs) + Math.max(...xs) + 1) / 2, hw = (Math.max(...xs) + 1 - Math.min(...xs)) / 2 - 0.14, x0 = mx - hw, x1 = mx + hw, rowTop = Math.min(...ys);
            const top = BASE + wf.level * LV - 0.14, bot = BASE + (L(Math.floor(mx), rowTop + 2) >= 0 ? L(Math.floor(mx), rowTop + 2) : 0) * LV - 0.14, z = (rowTop + 1) * R3_ZS;
            // the stream's own surface running up to the lip (the sheet starts on it, clear, so there's no seam), curling over
            // the edge, then falling, leaning out a little as it goes, down into the pool
            const path = [], rr = 0.16, cz = z - 0.04 - rr, cy = top - rr;
            for (let k = 0; k <= 3; k++) path.push([z - 0.75 + k * (0.75 - 0.04 - rr) / 3, top + 0.004]);
            for (let k = 1; k <= 5; k++) { const an = k / 5 * Math.PI / 2; path.push([cz + rr * Math.sin(an), cy + rr * Math.cos(an)]); }
            for (let k = 1; k <= 10; k++) { const t = k / 10; path.push([cz + rr + 0.16 * t * t, cy - (cy - bot + 0.06) * t]); }
            let along = 0, total = 0;
            path.forEach(([pz, py], j) => { if (j) total += Math.hypot(pz - path[j - 1][0], py - path[j - 1][1]); });
            const cols = 10, b0 = fp.length / 3;
            path.forEach(([pz, py], j) => {
                if (j) along += Math.hypot(pz - path[j - 1][0], py - path[j - 1][1]);
                // (a little wider at the foot, as falling water spreads)
                const spread = 0.08 * Math.max(0, along / total - 0.3);
                for (let i = 0; i <= cols; i++) { const u = i / cols; fp.push(x0 + 0.02 - spread + (x1 - x0 - 0.04 + 2 * spread) * u, py, pz + 0.06 * Math.sin(Math.PI * u)); fa.push(u, along, along / total); }
            });
            for (let j = 0; j < path.length - 1; j++) for (let i = 0; i < cols; i++) { const a0 = b0 + j * (cols + 1) + i; fi.push(a0, a0 + cols + 1, a0 + 1, a0 + 1, a0 + cols + 1, a0 + cols + 2); }
            const foot = path[path.length - 1][0];
            // (on whatever is there: the foot's water or the ground beside it)
            const gh = (x, zz) => Math.max(bot, EnvGround.heightAt(x, zz / R3_ZS));
            this.pool(group, (x0 + x1) / 2, gh((x0 + x1) / 2, foot + 0.5) + 0.02, foot + 0.5, hw + 0.45, meshes);
            for (const [x, zz, sc, rot] of [[x0 - 0.32, foot + 0.1, 0.75, 0.4], [x1 + 0.32, foot + 0.15, 0.65, 2.8], [x0 - 0.18, z - 0.45, 0.45, 1.2], [x1 + 0.2, z - 0.5, 0.4, 4.0]])
                falls.push([x, gh(x, zz) - 0.04, zz, sc, rot]);
            this.spray(group, (x0 + x1) / 2, bot, foot + 0.4, x1 - x0, meshes);
        }
        if (fp.length) {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
            g.setAttribute('aFall', new THREE.Float32BufferAttribute(fa, 3));
            g.setIndex(fi);
            const m = new THREE.Mesh(g, fallMat);
            m.renderOrder = 1;
            group.add(m); meshes.push(m);
        }
        // mossy rocks either side of each fall's foot and on its lip (made in Blender)
        if (falls.length && typeof EnvModels !== 'undefined' && EnvModels.has('falls_rocks'))
            for (const m of EnvModels.instances(group, 'falls_rocks', falls.map(([x, y, z, sc, rot]) => EnvModels.mat4(x, y, z, rot, sc)))) { m.userData.shared = true; meshes.push(m); }
        this.banks(group, a, wet, surf, meshes);
        const springs = [];
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (W0.grid[y][x] === 'h') springs.push([x, surf(x, y), y * R3_ZS]);
        this.steam(group, springs, meshes);
        return { meshes, tick: (r3) => { if (r3.sun) uniforms.uSunDir.value.copy(r3.sun.position).sub(r3.sun.target.position).normalize(); if (r3.hemi) uniforms.uSky.value.copy(r3.hemi.color).multiplyScalar(1 - 0.65 * ((r3.grade && r3.grade.dark) || 0)); this.lite.value = 1 - 0.68 * ((r3.grade && r3.grade.dark) || 0); if (r3.sea) r3.sea.visible = false; } };
    },
    /* where a waterfall lands: a pool of foam on the water, bubbles drifting and rings spreading out from the fall */
    pool(group, x, y, z, rx, meshes) {
        const pos = [], sp = [], idx = [], n = 24;
        pos.push(x, y + 0.02, z); sp.push(0, 0);
        for (let i = 0; i <= n; i++) { const an = i / n * Math.PI * 2; pos.push(x + Math.cos(an) * rx, y + 0.02, z + Math.sin(an) * 0.55); sp.push(Math.cos(an), Math.sin(an)); }
        for (let i = 0; i < n; i++) idx.push(0, i + 2, i + 1);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('aSp', new THREE.Float32BufferAttribute(sp, 2));
        geo.setIndex(idx);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }), {
            key: 'envpool', uniforms: { uLite: this.lite }, vhead: 'attribute vec2 aSp; varying vec2 vSp;\n', vbody: 'vSp = aSp;', fhead: 'varying vec2 vSp; uniform float uLite;\n', noDof: true,
            fpre: `{
                vec2 q = vSp; q.y += 0.55;                       // (the rings start from the fall, at the pool's back)
                float d = length(vec2(vSp.x, (vSp.y + 0.35) * 0.8));
                float rings = smoothstep(0.1, 0.0, abs(fract(length(q) * 2.6 - uTime * 0.55) - 0.5) - 0.36);
                float bub = smoothstep(0.52, 0.74, r3n(vWp.xz * 5.0 + vec2(0.0, uTime * 0.7)) * 0.6 + r3n(vWp.xz * 11.0 - uTime * 0.4) * 0.4);
                float a = (rings * 0.5 + bub * 0.85) * smoothstep(1.0, 0.55, length(vSp)) + smoothstep(0.5, 0.0, d) * 0.8;
                gl_FragColor = vec4(vec3(0.97, 0.99, 1.0) * uLite, clamp(a, 0.0, 0.92));
            }`,
        });
        const m = new THREE.Mesh(geo, mat);
        m.renderOrder = 1;
        group.add(m); meshes.push(m);
    },
    /* a soft white puff, for spray and steam */
    puff() {
        if (this._puff) return this._puff;
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(240,250,255,0.55)'); gr.addColorStop(1, 'rgba(240,250,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return (this._puff = new THREE.CanvasTexture(cv));
    },
    /* puffs as quads facing the camera's way: each [x, y, z, size], with its own moment in the cycle */
    puffGeo(list, r) {
        const pos = [], uv = [], ph = [], ctr = [], idx = [];
        for (const [px, py, pz, s] of list) {
            const b = pos.length / 3, k = r();
            for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(px + cx * s, py + cy * s * 0.8, pz); uv.push((cx + 1) / 2, (cy + 1) / 2); ph.push(k); ctr.push(px, py, pz); }
            idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1));
        geo.setAttribute('aC', new THREE.Float32BufferAttribute(ctr, 3));
        geo.setIndex(idx);
        return geo;
    },
    /* steam off the hot spring: wisps that drift up slowly, swelling and thinning out */
    steam(group, spots, meshes) {
        if (!spots.length) return;
        const r = mulberry(hash32('steam')), list = [];
        for (const [x, y, z] of spots) for (let i = 0; i < 3; i++) list.push([x + 0.2 + r() * 0.6, y + 0.12, z + (0.2 + r() * 0.6) * R3_ZS, 0.2 + r() * 0.16]);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: this.puff(), color: 0xfff8f0, transparent: true, depthWrite: false, opacity: 0.5 }), {
            key: 'envsteam', vhead: 'attribute float aPh; attribute vec3 aC; varying float vPh;\n',
            vbody: 'vPh = aPh; float k = fract(uTime * 0.09 + aPh); transformed = aC + (position - aC) * (1.0 + k * 1.2); transformed.y += k * 1.1; transformed.x += sin(uTime * 0.5 + aPh * 6.3) * 0.08 * k;',
            uniforms: { uLite: this.lite }, fhead: 'varying float vPh; uniform float uLite;\n', fpre: 'gl_FragColor.a *= sin(3.14159 * fract(uTime * 0.09 + vPh)); gl_FragColor.rgb *= uLite;', noDof: true,
        });
        const m = new THREE.Mesh(this.puffGeo(list, r), mat);
        m.renderOrder = 2;
        group.add(m); meshes.push(m);
    },
    /* smoke from the chimneys in the cold months: grey puffs drifting off with the breeze (toward us more than up, or the
       camera, looking down, would lose it above the roof) */
    smoke(group, spots) {
        if (!spots.length) return null;
        const r = mulberry(hash32('smoke')), list = [];
        for (const [x, y, z] of spots) for (let i = 0; i < 5; i++) list.push([x + (r() - 0.5) * 0.1, y + 0.1, z, 0.13 + r() * 0.06]);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: this.puff(), color: 0xccc8c4, transparent: true, depthWrite: false, opacity: 0.62 }), {
            key: 'envsmoke', uniforms: { uLite: this.lite }, vhead: 'attribute float aPh; attribute vec3 aC; varying float vPh;\n',
            vbody: 'vPh = aPh; float k = fract(uTime * 0.07 + aPh); transformed = aC + (position - aC) * (1.0 + k * 2.2); transformed.y += k * 0.95; transformed.z += k * 0.6; transformed.x += k * 0.4 + k * k * 0.6 + sin(uTime * 0.4 + aPh * 6.3) * 0.06 * k;',
            fhead: 'varying float vPh; uniform float uLite;\n', fpre: 'float k = fract(uTime * 0.07 + vPh); gl_FragColor.a *= smoothstep(0.0, 0.1, k) * (1.0 - k); gl_FragColor.rgb *= uLite;', noDof: true,
        });
        const m = new THREE.Mesh(this.puffGeo(list, r), mat);
        m.renderOrder = 2; m.frustumCulled = false;
        group.add(m);
        return m;
    },
    /* spray at a waterfall's foot: a few soft white puffs that rise and fade */
    spray(group, x, y, z, w, meshes) {
        const tex = this.puff();
        const r = mulberry(hash32('spray' + x)), list = [];
        for (let i = 0; i < 18; i++) list.push([x + (r() - 0.5) * w * 1.1, y + 0.15, z + r() * 0.35, 0.16 + r() * 0.22]);
        const geo = this.puffGeo(list, r);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.6 }), {
            key: 'envspray', vhead: 'attribute float aPh; attribute vec3 aC; varying float vPh;\n', vbody: 'vPh = aPh; float k = fract(uTime * 0.3 + aPh); transformed = aC + (position - aC) * (1.0 + k * 0.6); transformed.y += k * 0.45;', fhead: 'varying float vPh; uniform float uLite;\n',
            uniforms: { uLite: this.lite }, fpre: 'float k = fract(uTime * 0.3 + vPh); gl_FragColor.a *= smoothstep(0.0, 0.12, k) * (1.0 - k); gl_FragColor.rgb *= uLite;', noDof: true,
        });
        const m = new THREE.Mesh(geo, mat);
        m.renderOrder = 2;
        group.add(m); meshes.push(m);
    },
    /* lily pads on still water, cattails and stones along the banks */
    banks(group, a, wet, surf, meshes) {
        const r = mulberry(4401), Wt = W0.w, Ht = W0.h, pads = { p: [], c: [], idx: [] }, reeds = { p: [], c: [], idx: [] };
        // (lily pads, cattails and pebbles made in Blender where they've arrived, else boxes)
        const has = n => typeof EnvModels !== 'undefined' && EnvModels.has(n), placed = {};
        const put = (n, x, y, z, rot, s) => { (placed[n] = placed[n] || []).push(EnvModels.mat4(x, y, z, rot, s)); return true; };
        const box = (B, x0, y0, z0, x1, y1, z1, col) => {
            const b = B.p.length / 3, k = EnvTex.hex(col).map(v => v / 255);
            const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
            for (const p of v) { B.p.push(...p); B.c.push(...k); }
            for (const f of [[4, 5, 6, 4, 6, 7], [1, 0, 3, 1, 3, 2], [0, 4, 7, 0, 7, 3], [5, 1, 2, 5, 2, 6], [3, 7, 6, 3, 6, 2], [0, 1, 5, 0, 5, 4]]) for (const i of f) B.idx.push(b + i);
        };
        for (let y = 1; y < Ht - 1; y++) for (let x = 1; x < Wt - 1; x++) {
            const g = W0.grid[y][x];
            // lily pads: on pond tiles away from the edge
            if (g === 'o' && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => W0.grid[y + dy][x + dx] === 'o') && r() < 0.55) {
                const s = surf(x, y) + 0.015, cx = x + 0.2 + r() * 0.6, cz = (y + 0.2 + r() * 0.6) * R3_ZS, rad = 0.2 + r() * 0.12, b = pads.p.length / 3, notch = r() * 6.28;
                if (has('lilypad')) { put(r() < 0.3 && has('lilypad_flower') ? 'lilypad_flower' : 'lilypad', cx, s, cz, notch, rad / 0.26); continue; }
                pads.p.push(cx, s, cz); pads.c.push(0.28, 0.56, 0.24);
                for (let i = 0; i <= 12; i++) { const an = notch + 0.35 + i / 12 * (Math.PI * 2 - 0.7); pads.p.push(cx + Math.cos(an) * rad, s, cz + Math.sin(an) * rad * 0.9); const k = 0.85 + r() * 0.3; pads.c.push(0.33 * k, 0.66 * k, 0.28 * k); }
                for (let i = 0; i < 12; i++) pads.idx.push(b, b + 2 + i, b + 1 + i);
                if (r() < 0.3) { const fx = cx + Math.cos(notch + 3) * rad * 0.3, fz = cz + Math.sin(notch + 3) * rad * 0.3; box(pads, fx - 0.06, s, fz - 0.06, fx + 0.06, s + 0.08, fz + 0.06, '#ffd0e0'); box(pads, fx - 0.025, s + 0.05, fz - 0.025, fx + 0.025, s + 0.1, fz + 0.025, '#ffe060'); }
            }
            // cattails: on the bank beside water
            // (a few clumps, and only by ponds; stones along every bank)
            const by = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            if (!wet(x, y) && W0.grid[y][x] === 'g' && by.some(([dx, dy]) => wet(x + dx, y + dy))) {
                const yy = Env.groundH((x + 0.5) * TILE, (y + 0.5) * TILE);
                if (by.some(([dx, dy]) => W0.grid[y + dy][x + dx] === 'o') && r() < 0.22 && has('reeds')) put('reeds', x + 0.3 + r() * 0.4, yy - 0.02, (y + 0.3 + r() * 0.4) * R3_ZS, r() * 6.28, 0.9 + r() * 0.4);
                else if (by.some(([dx, dy]) => W0.grid[y + dy][x + dx] === 'o') && r() < 0.22) for (let k = 0; k < 3; k++) { const cx = x + 0.3 + r() * 0.4, cz = (y + 0.3 + r() * 0.4) * R3_ZS, h = 0.4 + r() * 0.3; box(reeds, cx - 0.014, yy, cz - 0.014, cx + 0.014, yy + h, cz + 0.014, '#5a8a3a'); box(reeds, cx - 0.032, yy + h - 0.15, cz - 0.032, cx + 0.032, yy + h - 0.02, cz + 0.032, '#7a4a28'); }
                // (each on the ground where it lies: the bank slopes away to the water, so the tile's middle would leave it floating)
                if (r() < 0.6) {
                    const sx = x + 0.15 + r() * 0.7, sy = y + 0.15 + r() * 0.7, sh = Env.groundH(sx * TILE, sy * TILE), sz = sy * R3_ZS;
                    if (has('pebbles')) put('pebbles', sx, sh - 0.03, sz, r() * 6.28, 0.7 + r() * 0.4);
                    else { const s = 0.08 + r() * 0.1; box(reeds, sx - s, sh - 0.05, sz - s * 0.8, sx + s, sh + s * 0.7, sz + s * 0.8, ['#9a958c', '#aca69c', '#8d887f'][r() * 3 | 0]); }
                }
            }
        }
        for (const [n, list] of Object.entries(placed)) for (const m of EnvModels.instances(group, n, list)) { m.userData.shared = true; meshes.push(m); }
        for (const B of [pads, reeds]) {
            if (!B.p.length) continue;
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
            g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
            g.setIndex(B.idx);
            g.computeVertexNormals();
            const m = new THREE.Mesh(g, r3Patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { key: 'envreed' }));
            m.castShadow = true; m.receiveShadow = true;
            group.add(m); meshes.push(m);
        }
    },
};
/* the water's color: deep or shallow (and over sand where it's shallow), ripples moving, foam at the shore, a glint of sun */
EnvWater.FHEAD = `
uniform sampler2D tDepth; uniform vec2 uMapSz; uniform sampler2D tSand; uniform vec3 uSunDir; uniform vec3 uSky; uniform vec3 uSunCol; uniform float uLite; uniform float uRain;
`;
EnvWater.FPRE = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)});
    vec2 duv = vec2(tp.x / uMapSz.x, 1.0 - tp.y / uMapSz.y);
    vec4 dd = (duv.x > 0.0 && duv.x < 1.0 && duv.y > 0.0 && duv.y < 1.0) ? texture2D(tDepth, duv) : vec4(1.0, 1.0, 0.0, 1.0);
    float d0 = dd.r * 2.55, isSea = dd.g, d00 = d0;
    // the edge: see-through over the sand or the bank, the water coming in over its first little depth (no line drawn
    // round it); a stream's along the depth's smooth line, not where the bank's triangles happen to cut the surface
    float edgeA = isSea > 0.5 ? smoothstep(0.0, 0.14, d0) : smoothstep(0.02, 0.1, d0);
    if (edgeA <= 0.0) discard;
    if (isSea < 0.5) d0 = max(0.0, d0 - 0.036);
    // (streams and ponds are shallow but clear and colored like deeper water, as in the concept; clear right at the edge)
    float depth = isSea < 0.5 ? d0 * 1.5 + 0.08 * smoothstep(0.0, 0.12, d0) : d0;
    // ripples: two layers of noise drifting (the sea rolls in from the south; streams run)
    // (the island's streams all run south, so theirs drift that way; a stream's ripples are small, not the sea's swell)
    vec2 fl = isSea > 0.5 ? vec2(0.03, -0.09) : vec2(0.02, 0.25);
    float rs = isSea > 0.5 ? 1.0 : 1.8;
    vec2 q1 = tp * 1.9 * rs + fl * uTime, q2 = tp * 3.7 * rs - fl.yx * uTime * 0.8;
    float h1 = r3n(q1) * 0.6 + r3n(q2) * 0.4;
    vec2 g = vec2(r3n(q1 + vec2(0.05, 0.0)) - r3n(q1 - vec2(0.05, 0.0)), r3n(q1 + vec2(0.0, 0.05)) - r3n(q1 - vec2(0.0, 0.05)));
    vec3 n = normalize(vec3(-g.x * 1.4, 1.0, -g.y * 1.4) * vec3(isSea > 0.5 ? 1.0 : 0.7, 1.0, isSea > 0.5 ? 1.0 : 0.7));
    // color by depth: sand showing through at the edge, then turquoise, then blue (a stream bluer, its bed barely showing)
    vec3 bed = texture2D(tSand, tp * 0.25).rgb * vec3(0.72, 0.86, 0.84);
    vec3 shallow = vec3(0.26, 0.74, 0.74), mid = vec3(0.13, 0.56, 0.68), deep = vec3(0.07, 0.38, 0.6);
    if (isSea < 0.5) { bed = mix(bed, vec3(0.3, 0.62, 0.66), 0.6); shallow = vec3(0.24, 0.66, 0.76); mid = vec3(0.13, 0.5, 0.7); deep = vec3(0.09, 0.4, 0.66); }
    // (the hot spring milky and pale, as mineral water is)
    float hot = clamp((1.0 - dd.a) * 2.0, 0.0, 1.0);
    if (hot > 0.0) { vec3 milk = vec3(0.5, 0.82, 0.84); bed = mix(bed, milk, hot); shallow = mix(shallow, milk, hot); mid = mix(mid, vec3(0.36, 0.72, 0.8), hot); deep = mix(deep, vec3(0.3, 0.64, 0.76), hot); }
    float k1 = smoothstep(0.0, 0.16, depth), k2 = smoothstep(0.3, 1.4, depth);
    vec3 wc = mix(mix(bed, shallow, k1 * 0.9), mix(mid, deep, k2), smoothstep(0.12, 0.7, depth));
    // a stream's current: faint pale streaks drawn out along it, sliding downstream (none on a pond's still water)
    if (isSea < 0.5) {
        float run = r3n(vec2(tp.x * 3.2, tp.y * 0.7 - uTime * 0.42)) * 0.65 + r3n(vec2(tp.x * 7.5 + 5.0, tp.y * 1.6 - uTime * 0.7)) * 0.35;
        wc = mix(wc, vec3(0.78, 0.92, 0.96), smoothstep(0.6, 0.78, run) * 0.32 * dd.b * smoothstep(0.04, 0.2, d0));
    }
    // the light it gets (shadows from the Lambert pass), the sky's reflection at a slant, the sun's glint
    float lit = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)) / 0.9;
    wc *= (0.3 + 0.72 * clamp(lit, 0.0, 1.2)) * (0.55 + 0.45 * uLite);      // (and darker still by night, as the ground is)
    vec3 V = normalize(cameraPosition - vWp);
    float fres = pow(1.0 - max(0.0, dot(n, V)), 3.0);
    wc = mix(wc, uSky * 1.05, fres * 0.38);
    vec3 Rf = reflect(-V, n);
    float sp = pow(max(0.0, dot(Rf, normalize(uSunDir))), 90.0);
    wc += uSunCol * sp * 1.6 * clamp(lit, 0.2, 1.0);
    wc += (h1 - 0.5) * 0.05;
    // (the open sea alive (David, 29 October: "the ocean should have some animations... seeing clouds move by... just
    // ambient things"): long swells rolling in toward the shore, the clouds' reflections drifting over it, the sun
    // winking on it here and there by day, and now and then the rings where a fish came up)
    if (isSea > 0.5) {
        float open = smoothstep(0.25, 1.2, depth), dayK = smoothstep(0.5, 0.95, uLite);
        float sw = sin(dot(tp, vec2(0.22, 0.92)) * 0.85 - uTime * 0.75 + r3n(tp * 0.11) * 4.0);
        wc *= 1.0 + sw * 0.045 * open;
        float cr = r3n(tp * 0.045 + vec2(uTime * 0.016, uTime * 0.005)) * 0.7 + r3n(tp * 0.11 - vec2(uTime * 0.01, 0.0)) * 0.3;
        wc = mix(wc, uSky * 1.18 + 0.1, smoothstep(0.56, 0.8, cr) * 0.16 * open * dayK);
        vec2 sc = floor(tp * 5.0);
        float st = uTime * 0.9 + r3h(sc) * 9.0, sk = r3h(sc + floor(st) * 1.7);
        float spark = step(0.988, sk) * sin(3.14159 * fract(st)) * smoothstep(0.32, 0.0, length(fract(tp * 5.0) - 0.5));
        wc += uSunCol * spark * 0.75 * dayK * open * clamp(lit, 0.3, 1.0);
        vec2 fc = floor(tp / 9.0);
        float ft = uTime / 17.0 + r3h(fc) * 7.0, fi = floor(ft), ff = fract(ft) + step(r3h(fc + fi * 5.1), 0.6);      // (a fish now and then, not in every stretch of sea at once)
        vec2 fp = (fc + 0.15 + 0.7 * vec2(r3h(fc + fi * 1.3), r3h(fc + fi * 2.9 + 4.0))) * 9.0;
        float fd = length((tp - fp) * vec2(1.0, 1.25)), fk = ff / 0.3;
        if (fk < 1.0) wc += vec3(0.9, 0.96, 1.0) * (smoothstep(0.07, 0.0, abs(fd - fk * 1.4)) + smoothstep(0.06, 0.0, abs(fd - fk * 0.8)) * 0.6) * (1.0 - fk) * 0.3 * open * (0.4 + 0.6 * uLite);
    }
    // raindrops: a ring spreading and fading in each little cell of the surface, each at its own moment
    if (uRain > 0.01) {
        vec2 q = tp * 3.0, cell = floor(q);
        float t = fract(uTime * 0.8 + r3h(cell)), rd = length(fract(q) - 0.25 - 0.5 * vec2(r3h(cell + 7.0), r3h(cell + 13.0)));
        wc += smoothstep(0.035, 0.0, abs(rd - t * 0.3)) * (1.0 - t) * 0.3 * uRain * (0.3 + 0.7 * clamp(lit, 0.0, 1.0));
    }
    // surf: on the sea a thin broken line of foam washing up the sand and back, and now and then a faint wave further
    // out; a stream's or pond's edge only a little lighter
    float brk = smoothstep(0.38, 0.72, r3n(tp * 2.6 + vec2(uTime * 0.22, uTime * 0.05)));
    float wash = 0.06 + 0.04 * sin(uTime * 0.55 + tp.x * 0.3 + tp.y * 0.17);
    float foam = isSea > 0.5 ? smoothstep(0.03, 0.0, abs(d0 - wash)) * brk * 0.8 : smoothstep(0.035, 0.0, abs(d00 - 0.06)) * 0.22;
    if (isSea > 0.5) foam += smoothstep(0.05, 0.0, abs(fract(depth * 2.0 - uTime * 0.16) - 0.5) - 0.46) * smoothstep(0.7, 0.25, depth) * 0.35 * brk;
    wc = mix(wc, vec3(0.96, 0.98, 1.0) * (0.3 + 0.7 * clamp(lit, 0.0, 1.0)), clamp(foam, 0.0, 0.9));
    gl_FragColor.rgb = wc;
    gl_FragColor.a = clamp(max(edgeA, foam), 0.0, 1.0);
}`;
/* the island's waterfalls, two side by side over the same lip joined into one sheet (each fades out at its sides, which
   left a see-through strip down the middle where two met: David, 29 October) */
EnvWater.fallsJoined = function () {
    const out = [];
    for (const wf of W0.waterfalls || []) {
        const row = Math.min(...wf.tiles.map(t => t[1]));
        const o = out.find(q => q.level === wf.level && q.row === row && wf.tiles.some(t => q.tiles.some(u => u[1] === t[1] && Math.abs(u[0] - t[0]) <= 1)));
        if (!o) { out.push({ level: wf.level, row, tiles: wf.tiles.slice() }); continue; }
        for (const t of wf.tiles) if (!o.tiles.some(u => u[0] === t[0] && u[1] === t[1])) o.tiles.push(t);
    }
    return out;
};
/* a waterfall's sheet: glassy water over the lip, then streaks rushing down faster as it falls, see-through at its
   sides, its foot breaking up raggedly into the spray */
EnvWater.FALL = `
{
    float t = vFall.y, u = vFall.x, tn = vFall.z;
    // (the first stretch lies on the stream: clear there, coming in as the water speeds toward the lip)
    float lip = 0.3, fallT = clamp((tn - lip) / (1.0 - lip), 0.0, 1.0);
    float sp = t * 1.6 - uTime * (0.8 + 3.0 * fallT);
    float s1 = r3n(vec2(u * 16.0, sp)), s2 = r3n(vec2(u * 37.0 + 3.0, sp * 1.5 - uTime * 0.8));
    float streak = smoothstep(0.38, 0.78, s1 * 0.6 + s2 * 0.4);
    // over the lip it's smooth glassy water, turning white as it falls
    float white = smoothstep(0.05, 0.55, fallT);
    vec3 deep = vec3(0.3, 0.62, 0.78), lite = vec3(0.96, 0.99, 1.0);
    vec3 col = mix(deep, lite, clamp(streak * (0.35 + 0.6 * white) + 0.08 + 0.35 * white, 0.0, 1.0));
    col += vec3(0.14) * smoothstep(0.08, 0.0, abs(tn - lip));       // (the light catching the lip)
    // the sides ragged and thinning, not a cut edge; the foot breaking up into the pool's foam
    float wob = (r3n(vec2(t * 2.5 - uTime * 1.4, u * 3.0)) - 0.5) * 0.14 * fallT;
    float edge = smoothstep(0.0, 0.14, u + wob) * smoothstep(1.0, 0.86, u - wob);
    float foot = 1.0 - smoothstep(0.82, 1.0, tn + (r3n(vec2(u * 9.0, uTime * 1.3)) - 0.5) * 0.14);
    float a = (0.72 + 0.26 * streak) * mix(0.35, 1.0, edge) * foot * edge;
    a *= mix(smoothstep(0.0, lip, tn) * 0.55, 1.0, smoothstep(lip - 0.05, lip + 0.05, tn));
    gl_FragColor = vec4(col * uLite, clamp(a, 0.0, 0.97));
}`;
