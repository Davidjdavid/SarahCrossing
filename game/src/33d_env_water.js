/* ---- 33d_env_water.js ---- */
/* Water for the new 3D look (33a_env.js): the sea, the streams and ponds, and the waterfalls. The surfaces lie flat at their
   level; how deep the water is under each spot (from the ground's heights) picks its color, from clear and sandy at the
   edge through turquoise to deep blue, with foam where it meets the shore, ripples that move (streams run, the sea
   rolls in) and the sun glinting off it. Waterfalls are sheets of falling streaks with spray at the foot. Lily pads on
   the ponds, cattails and stones along the banks. */
const EnvWater = {
    build(group, a) {
        const Wt = W0.w, Ht = W0.h, G = EnvGround, LV = ENV.LV, BASE = ENV.BASE;
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht || W0.grid[y][x] === '~') ? -1 : +W0.height[y][x] || 0;
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && 'orh'.includes(W0.grid[y][x]);
        const surf = (x, y) => wet(x, y) ? BASE + L(x, y) * LV - 0.14 : 0;           // a water tile's surface (the sea's is 0)
        // how deep the water is everywhere (8 pixels a tile): red is depth, green which water (sea or not)
        const P = 8, N = Wt * P, M = Ht * P, d = new Uint8Array(N * M * 4);
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
        // the sea: one big sheet at sea level (beyond the island too)
        const seaGeo = new THREE.PlaneGeometry(Wt + 400, (Ht + 400) * R3_ZS, 1, 1);
        seaGeo.rotateX(-Math.PI / 2);
        const sea = new THREE.Mesh(seaGeo, mat);
        sea.position.set(Wt / 2, 0, Ht / 2 * R3_ZS);
        sea.receiveShadow = true; sea.renderOrder = -1;
        group.add(sea); meshes.push(sea);
        // streams and ponds: a tile-sized sheet over each water tile, reaching a little past it (the banks rise through it)
        const pos = [], idx = [];
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            if (!wet(x, y)) continue;
            const s = surf(x, y), e = 0.45, b = pos.length / 3;
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
        const fp = [], fi = [], fa = [];
        for (const wf of W0.waterfalls || []) {
            // (as wide as the stream, not the tiles it covers: the wall shows either side, as in the concept)
            const xs = wf.tiles.map(t => t[0]), ys = wf.tiles.map(t => t[1]), mx = (Math.min(...xs) + Math.max(...xs) + 1) / 2, hw = Math.min(0.6, (Math.max(...xs) + 1 - Math.min(...xs)) / 2), x0 = mx - hw, x1 = mx + hw, rowTop = Math.min(...ys);
            const top = BASE + wf.level * LV - 0.14, bot = BASE + (L(Math.floor(mx), rowTop + 2) >= 0 ? L(Math.floor(mx), rowTop + 2) : 0) * LV - 0.14, z = (rowTop + 1) * R3_ZS;
            // a lip curving over the edge, then the sheet, bulging out a little as it falls
            const rows = 10;
            for (let j = 0; j <= rows; j++) {
                const t = j / rows, yy = top + 0.06 - (top - bot) * t * t * 0 - (top - bot) * t, zz = z + 0.08 + Math.sin(t * Math.PI * 0.5) * 0.28 - (j === 0 ? 0.35 : 0);
                for (const [xx, u] of [[x0 + 0.05, 0], [x1 - 0.05, 1]]) { fp.push(xx, yy, zz); fa.push(u, t * (top - bot)); }
            }
            const base = fp.length / 3 - (rows + 1) * 2;
            for (let j = 0; j < rows; j++) { const a0 = base + j * 2; fi.push(a0, a0 + 2, a0 + 1, a0 + 1, a0 + 2, a0 + 3); }
            this.spray(group, (x0 + x1) / 2, bot, z + 0.45, x1 - x0, meshes);
        }
        if (fp.length) {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
            g.setAttribute('aFall', new THREE.Float32BufferAttribute(fa, 2));
            g.setIndex(fi);
            const m = new THREE.Mesh(g, fallMat);
            group.add(m); meshes.push(m);
        }
        this.banks(group, a, wet, surf, meshes);
        return { meshes, tick: (r3) => { if (r3.sun) uniforms.uSunDir.value.copy(r3.sun.position).sub(r3.sun.target.position).normalize(); if (r3.hemi) uniforms.uSky.value.copy(r3.hemi.color); if (r3.sea) r3.sea.visible = false; } };
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
                if (by.some(([dx, dy]) => W0.grid[y + dy][x + dx] === 'o') && r() < 0.22) for (let k = 0; k < 3; k++) { const cx = x + 0.3 + r() * 0.4, cz = (y + 0.3 + r() * 0.4) * R3_ZS, h = 0.4 + r() * 0.3; box(reeds, cx - 0.014, yy, cz - 0.014, cx + 0.014, yy + h, cz + 0.014, '#5a8a3a'); box(reeds, cx - 0.032, yy + h - 0.15, cz - 0.032, cx + 0.032, yy + h - 0.02, cz + 0.032, '#7a4a28'); }
                if (r() < 0.6) { const sx = x + r(), sz = (y + r()) * R3_ZS, s = 0.08 + r() * 0.1; box(reeds, sx - s, yy - 0.05, sz - s * 0.8, sx + s, yy + s * 0.7, sz + s * 0.8, ['#9a958c', '#aca69c', '#8d887f'][r() * 3 | 0]); }
            }
        }
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
    float depth = dd.r * 2.55, isSea = dd.g;
    if (depth < 0.004) discard;
    // (streams and ponds are shallow but clear and colored like deeper water, as in the concept)
    if (isSea < 0.5) depth = depth * 1.5 + 0.08;
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
    float foam = smoothstep(isSea > 0.5 ? 0.1 : 0.05, 0.0, depth) * smoothstep(0.35, 0.65, r3n(tp * 5.0 + vec2(uTime * 0.3, 0.0)) + 0.25) * (isSea > 0.5 ? 1.0 : 0.6);
    if (isSea > 0.5) foam += smoothstep(0.06, 0.0, abs(fract(depth * 2.2 - uTime * 0.18) - 0.5) - 0.44) * smoothstep(0.8, 0.1, depth) * 0.7;
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
