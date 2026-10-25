/* ---- 33d_env_water.js ---- */
/* Water for the new 3D look (33a_env.js): the sea, the streams and ponds, and the waterfalls. The surfaces lie flat at their
   level; how deep the water is under each spot (from the ground's heights) picks its color, from clear and sandy at the
   edge through turquoise to deep blue, with foam where it meets the shore, ripples that move (streams run, the sea
   rolls in) and the sun glinting off it. Waterfalls are sheets of falling streaks with spray at the foot. Lily pads on
   the ponds, cattails and stones along the banks. */
const EnvWater = {
    build(group, a) {
        const Wt = W0.w, Ht = W0.h, G = EnvGround, LV = ENV.LV, BASE = ENV.BASE;
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht || G.waterAt(x, y) === 1) ? -1 : +W0.height[y][x] || 0;
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && G.waterAt(x, y) === 2;
        const surf = (x, y) => wet(x, y) ? BASE + L(x, y) * LV - 0.14 : 0;           // a water tile's surface (the sea's is 0)
        // how deep the water is everywhere (8 pixels a tile, 4 on a big island): red is depth, green which water (sea or not)
        const P = Wt * Ht > 20000 ? 4 : 8, N = Wt * P, M = Ht * P, d = new Uint8Array(N * M * 4);
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
            const u = (x + 0.5) / P, v = (y + 0.5) / P, tx = Math.floor(u), ty = Math.floor(v);
            let s = 0, sea = 1;
            // inland water: the surface of the nearest water tile round here
            for (let dy = -1; dy <= 1 && sea; dy++) for (let dx = -1; dx <= 1; dx++) if (wet(tx + dx, ty + dy)) { s = surf(tx + dx, ty + dy); sea = 0; break; }
            const depth = s - G.heightAt(u, v), o = ((M - 1 - y) * N + x) * 4;
            d[o] = Math.max(0, Math.min(255, Math.round(depth * 100))); d[o + 1] = sea ? 255 : 0; d[o + 2] = 0; d[o + 3] = 255;
        }
        const depthTex = new THREE.DataTexture(d, N, M, THREE.RGBAFormat);
        depthTex.magFilter = depthTex.minFilter = THREE.LinearFilter; depthTex.generateMipmaps = false; depthTex.needsUpdate = true;
        const sand = EnvTex.sand(), uniforms = { tDepth: { value: depthTex }, uMapSz: { value: new THREE.Vector2(Wt, Ht) }, tSand: { value: sand.map }, uSunDir: { value: new THREE.Vector3(-0.55, 0.78, 0.32).normalize() }, uSky: { value: new THREE.Color(0.62, 0.8, 0.95) }, uSunCol: { value: new THREE.Color(1, 0.95, 0.85) } };
        const mat = r3Patch(new THREE.MeshLambertMaterial({ color: 0xffffff }), { key: 'envwater', uniforms, fhead: EnvWater.FHEAD, fpre: EnvWater.FPRE });
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
            const s = surf(x, y), e = 0.7, b = pos.length / 3;
            pos.push(x - e, s, (y - e) * R3_ZS, x + 1 + e, s, (y - e) * R3_ZS, x + 1 + e, s, (y + 1 + e) * R3_ZS, x - e, s, (y + 1 + e) * R3_ZS);
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
        const fallMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), { key: 'envfall', fhead: 'varying vec2 vFall;\n', vhead: 'attribute vec2 aFall; varying vec2 vFall;\n', vbody: 'vFall = aFall;', fpre: EnvWater.FALL, dofFixed: null });
        const fp = [], fi = [], fa = [], falls = [];
        for (const wf of W0.waterfalls || []) {
            // (as wide as the stream, not the tiles it covers: the wall shows either side, as in the concept)
            const xs = wf.tiles.map(t => t[0]), ys = wf.tiles.map(t => t[1]), mx = (Math.min(...xs) + Math.max(...xs) + 1) / 2, hw = Math.min(0.6, (Math.max(...xs) + 1 - Math.min(...xs)) / 2), x0 = mx - hw, x1 = mx + hw, rowTop = Math.min(...ys);
            const top = BASE + wf.level * LV - 0.14, bot = BASE + (L(Math.floor(mx), rowTop + 2) >= 0 ? L(Math.floor(mx), rowTop + 2) : 0) * LV - 0.14, z = (rowTop + 1) * R3_ZS;
            // the water curls over a rounded lip, then falls, bulging out a little in the middle and leaning out as it goes
            const path = [], cz = z - 0.12, cy = top - 0.1, rr = 0.22;
            for (let k = 0; k <= 5; k++) { const an = k / 5 * Math.PI / 2; path.push([cz - 0.25 * (k === 0 ? 1 : 0) + rr * Math.sin(an), cy + rr * Math.cos(an)]); }
            for (let k = 1; k <= 10; k++) { const t = k / 10; path.push([cz + rr + 0.14 * t * t, cy - (cy - bot) * t]); }
            let along = 0;
            const cols = 8, b0 = fp.length / 3;
            path.forEach(([pz, py], j) => {
                if (j) along += Math.hypot(pz - path[j - 1][0], py - path[j - 1][1]);
                for (let i = 0; i <= cols; i++) { const u = i / cols; fp.push(x0 + 0.04 + (x1 - x0 - 0.08) * u, py, pz + 0.05 * Math.sin(Math.PI * u)); fa.push(u, along); }
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
            g.setAttribute('aFall', new THREE.Float32BufferAttribute(fa, 2));
            g.setIndex(fi);
            const m = new THREE.Mesh(g, fallMat);
            group.add(m); meshes.push(m);
        }
        // mossy rocks either side of each fall's foot and on its lip (made in Blender)
        if (falls.length && typeof EnvModels !== 'undefined' && EnvModels.has('falls_rocks'))
            for (const m of EnvModels.instances(group, 'falls_rocks', falls.map(([x, y, z, sc, rot]) => EnvModels.mat4(x, y, z, rot, sc)))) { m.userData.shared = true; meshes.push(m); }
        this.banks(group, a, wet, surf, meshes);
        return { meshes, tick: (r3) => { if (r3.sun) uniforms.uSunDir.value.copy(r3.sun.position).sub(r3.sun.target.position).normalize(); if (r3.hemi) uniforms.uSky.value.copy(r3.hemi.color); if (r3.sea) r3.sea.visible = false; } };
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
            key: 'envpool', vhead: 'attribute vec2 aSp; varying vec2 vSp;\n', vbody: 'vSp = aSp;', fhead: 'varying vec2 vSp;\n', noDof: true,
            fpre: `{
                vec2 q = vSp; q.y += 0.55;                       // (the rings start from the fall, at the pool's back)
                float d = length(vec2(vSp.x, (vSp.y + 0.35) * 0.8));
                float rings = smoothstep(0.1, 0.0, abs(fract(length(q) * 2.6 - uTime * 0.55) - 0.5) - 0.36);
                float bub = smoothstep(0.52, 0.74, r3n(vWp.xz * 5.0 + vec2(0.0, uTime * 0.7)) * 0.6 + r3n(vWp.xz * 11.0 - uTime * 0.4) * 0.4);
                float a = (rings * 0.5 + bub * 0.85) * smoothstep(1.0, 0.55, length(vSp)) + smoothstep(0.5, 0.0, d) * 0.8;
                gl_FragColor = vec4(vec3(0.97, 0.99, 1.0), clamp(a, 0.0, 0.92));
            }`,
        });
        const m = new THREE.Mesh(geo, mat);
        m.renderOrder = 1;
        group.add(m); meshes.push(m);
    },
    /* spray at a waterfall's foot: a few soft white puffs that rise and fade */
    spray(group, x, y, z, w, meshes) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(240,250,255,0.55)'); gr.addColorStop(1, 'rgba(240,250,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(cv);
        const pos = [], uv = [], ph = [], idx = [], r = mulberry(hash32('spray' + x));
        for (let i = 0; i < 14; i++) {
            const px = x + (r() - 0.5) * w, pz = z + r() * 0.4, s = 0.35 + r() * 0.35, b = pos.length / 3;
            for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(px + cx * s, y + 0.15 + cy * s * 0.8, pz); uv.push((cx + 1) / 2, (cy + 1) / 2); ph.push(r()); }
            idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1));
        geo.setIndex(idx);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 }), {
            key: 'envspray', vhead: 'attribute float aPh; varying float vPh;\n', vbody: 'vPh = aPh; transformed.y += fract(uTime * 0.35 + aPh) * 0.5;', fhead: 'varying float vPh;\n',
            fpre: 'gl_FragColor.a *= 1.0 - fract(uTime * 0.35 + vPh);', noDof: true,
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
                if (r() < 0.6 && has('pebbles')) put('pebbles', x + r(), yy - 0.02, (y + r()) * R3_ZS, r() * 6.28, 0.8 + r() * 0.5);
                else if (r() < 0.6) { const sx = x + r(), sz = (y + r()) * R3_ZS, s = 0.08 + r() * 0.1; box(reeds, sx - s, yy - 0.05, sz - s * 0.8, sx + s, yy + s * 0.7, sz + s * 0.8, ['#9a958c', '#aca69c', '#8d887f'][r() * 3 | 0]); }
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
uniform sampler2D tDepth; uniform vec2 uMapSz; uniform sampler2D tSand; uniform vec3 uSunDir; uniform vec3 uSky; uniform vec3 uSunCol;
`;
EnvWater.FPRE = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)});
    vec2 duv = vec2(tp.x / uMapSz.x, 1.0 - tp.y / uMapSz.y);
    vec4 dd = (duv.x > 0.0 && duv.x < 1.0 && duv.y > 0.0 && duv.y < 1.0) ? texture2D(tDepth, duv) : vec4(1.0, 1.0, 0.0, 1.0);
    float d0 = dd.r * 2.55, isSea = dd.g;
    if (d0 < 0.004) discard;
    // (streams and ponds are shallow but clear and colored like deeper water, as in the concept; clear right at the edge)
    float depth = isSea < 0.5 ? d0 * 1.5 + 0.08 * smoothstep(0.0, 0.12, d0) : d0;
    // ripples: two layers of noise drifting (the sea rolls in from the south; streams run)
    vec2 fl = isSea > 0.5 ? vec2(0.03, -0.09) : vec2(0.02, 0.25);
    vec2 q1 = tp * 1.9 + fl * uTime, q2 = tp * 3.7 - fl.yx * uTime * 0.8;
    float h1 = r3n(q1) * 0.6 + r3n(q2) * 0.4;
    vec2 g = vec2(r3n(q1 + vec2(0.05, 0.0)) - r3n(q1 - vec2(0.05, 0.0)), r3n(q1 + vec2(0.0, 0.05)) - r3n(q1 - vec2(0.0, 0.05)));
    vec3 n = normalize(vec3(-g.x * 2.2, 1.0, -g.y * 2.2));
    // color by depth: sand showing through at the edge, then turquoise, then blue
    vec3 bed = texture2D(tSand, tp * 0.25).rgb * vec3(0.72, 0.86, 0.84);
    vec3 shallow = vec3(0.26, 0.74, 0.74), mid = vec3(0.13, 0.56, 0.68), deep = vec3(0.07, 0.38, 0.6);
    float k1 = smoothstep(0.0, 0.16, depth), k2 = smoothstep(0.3, 1.4, depth);
    vec3 wc = mix(mix(bed, shallow, k1 * 0.9), mix(mid, deep, k2), smoothstep(0.12, 0.7, depth));
    // the light it gets (shadows from the Lambert pass), the sky's reflection at a slant, the sun's glint
    float lit = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)) / 0.9;
    wc *= 0.55 + 0.5 * clamp(lit, 0.0, 1.2);
    vec3 V = normalize(cameraPosition - vWp);
    float fres = pow(1.0 - max(0.0, dot(n, V)), 3.0);
    wc = mix(wc, uSky * 1.05, fres * 0.38);
    vec3 Rf = reflect(-V, n);
    float sp = pow(max(0.0, dot(Rf, normalize(uSunDir))), 90.0);
    wc += uSunCol * sp * 1.6 * clamp(lit, 0.2, 1.0);
    wc += (h1 - 0.5) * 0.08;
    // foam where it meets the shore (and on the sea, waves washing in)
    float foam = smoothstep(isSea > 0.5 ? 0.1 : 0.05, 0.0, d0) * smoothstep(0.35, 0.65, r3n(tp * 5.0 + vec2(uTime * 0.3, 0.0)) + 0.25) * (isSea > 0.5 ? 1.0 : 0.6);
    if (isSea > 0.5) foam += smoothstep(0.06, 0.0, abs(fract(depth * 2.2 - uTime * 0.18) - 0.5) - 0.44) * smoothstep(0.8, 0.1, depth) * 0.7;
    // (a pond's or stream's edge drawn as a clean pale line, as the concept and Animal Crossing outline their water)
    if (isSea < 0.5) foam = max(foam, smoothstep(0.05, 0.015, d0) * (0.7 + 0.3 * r3n(tp * 9.0 + uTime * 0.25)));
    wc = mix(wc, vec3(0.96, 0.98, 1.0), clamp(foam, 0.0, 0.9));
    gl_FragColor.rgb = wc;
}`;
/* a waterfall's sheet: streaks rushing down, lighter at the edges and at the foot */
EnvWater.FALL = `
{
    float t = vFall.y, u = vFall.x;
    float s1 = r3n(vec2(u * 18.0, t * 1.5 - uTime * 3.2)), s2 = r3n(vec2(u * 41.0 + 3.0, t * 2.4 - uTime * 4.1));
    float streak = smoothstep(0.35, 0.75, s1 * 0.6 + s2 * 0.4);
    vec3 col = mix(vec3(0.42, 0.74, 0.86), vec3(0.95, 0.99, 1.0), streak * 0.85 + 0.1);
    float edge = smoothstep(0.0, 0.12, u) * smoothstep(1.0, 0.88, u);
    col = mix(vec3(0.9, 0.96, 1.0), col, edge * 0.8 + 0.2);
    gl_FragColor.rgb = col;
}`;
