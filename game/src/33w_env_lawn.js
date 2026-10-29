/* ---- 33w_env_lawn.js ---- */
/* What lies on the lawn in the new look (David, 29 October): small tufts of grass scattered over it for a little depth,
   few beside the paths, the square and buildings and more out in the wild (EnvGround.wildAt), and now and then a fallen
   leaf for the season (fall's reds, golds and browns, many under the trees; a stray yellowed one in summer; blossom petals
   by the trees in spring; none under winter's snow). Both are instanced meshes refilled round the view as it moves, at
   places worked out from the tile (the same tuft is always in the same spot), and fade out with distance as the lawn's
   own detail does. */
const EnvLawn = {
    TUFTS: 1400, LEAVES: 700,
    // (how many to a tile: beside trodden ground, and out in the wild)
    TUFT_NEAR: 0.15, TUFT_WILD: 2.2,
    LEAF: { fall: [0.25, 1.6], summer: [0.012, 0.05], spring: [0.0, 0.35], winter: [0, 0] },
    LEAF_COLS: {
        fall: [0xd77a2a, 0xc2482c, 0xe0b23a, 0x9c6a3a, 0xcf9a34, 0xb4562e],
        summer: [0xa8a848, 0x8ea446, 0xc2a64a],
        spring: [0xf3b9c8, 0xf7d0da, 0xf0a8bc],
    },
    build(group, a) {
        const g = this.group = new THREE.Group();
        group.add(g);
        this.tuft = new THREE.InstancedMesh(this.tuftGeo(), r3Patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { key: 'envtuft', inst: true }), this.TUFTS);
        this.leaf = new THREE.InstancedMesh(this.leafGeo(), r3Patch(new THREE.MeshLambertMaterial(), { key: 'envleaf', inst: true }), this.LEAVES);
        this.leaf.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.LEAVES * 3), 3);
        for (const m of [this.tuft, this.leaf]) { m.frustumCulled = false; m.count = 0; m.castShadow = false; m.receiveShadow = true; m.userData.live = true; g.add(m); }
        this.key = null; this.season = null; this.trees = null; this.area = a;
        this.M = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.c = new THREE.Color();
        return { meshes: [], tick: (r3, ar) => this.tick(r3, ar) };
    },
    /* a tuft: seven thin blades from one foot, leaning out a little each its own way, darker at the foot than the tip
       (one unit is a tile; about a fifth of a tile tall) */
    tuftGeo() {
        const P = [], C = [], r = mulberry(91);
        for (let b = 0; b < 7; b++) {
            const ang = b / 7 * Math.PI * 2 + r() * 0.6, lean = 0.25 + r() * 0.35, hgt = 0.12 + r() * 0.1, wd = 0.018 + r() * 0.01;
            const ox = Math.cos(ang) * 0.025, oz = Math.sin(ang) * 0.025, tx = ox + Math.cos(ang) * lean * hgt, tz = oz + Math.sin(ang) * lean * hgt;
            const px = -Math.sin(ang) * wd, pz = Math.cos(ang) * wd;
            // (both ways round, each lit from straight up: seen from behind, a one-sided blade drawn both sides is lit as if
            // it faced down, and came out black)
            P.push(ox - px, 0, oz - pz, ox + px, 0, oz + pz, tx, hgt, tz, ox + px, 0, oz + pz, ox - px, 0, oz - pz, tx, hgt, tz);
            for (let k = 0; k < 2; k++) C.push(0.74, 0.78, 0.72, 0.74, 0.78, 0.72, 1.0, 1.04, 0.96);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        geo.computeVertexNormals();
        // (lit as the lawn under it is, straight up: thin blades lit edge-on would flicker dark and light)
        const n = geo.attributes.normal;
        for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
        return geo;
    },
    /* a leaf lying flat: a pointed oval with a little stalk, about a tenth of a tile long */
    leafGeo() {
        const pts = [[0, -0.06], [0.03, -0.03], [0.034, 0.01], [0.02, 0.04], [0, 0.06], [-0.02, 0.04], [-0.034, 0.01], [-0.03, -0.03]];
        const P = [0, 0.004, 0];
        for (const [x, z] of pts) P.push(x, 0, z);
        const idx = [];
        // (wound to face up: face down, the material lights it from below, and the leaves came out a dark brown)
        for (let i = 0; i < pts.length; i++) idx.push(0, 1 + (i + 1) % pts.length, 1 + i);
        P.push(-0.003, 0, 0.06, 0.003, 0, 0.06, 0, 0.002, 0.085);
        idx.push(pts.length + 1, pts.length + 3, pts.length + 2);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        geo.setIndex(idx);
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(P.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
        return geo;
    },
    /* the tufts take the season's lawn colors (the blades' own shading is in their vertex colors) */
    paint(season) {
        const L = EnvTex.LAWN[season] || EnvTex.LAWN.summer, c = this.c.set(L.light);
        this.tuft.material.color.setRGB(c.r * 1.05, c.g * 1.05, c.b * 1.05);
    },
    /* how close the nearest tree is to a tile: 1 under it, 0 three tiles off (made once an area) */
    treeNear(a) {
        if (this.trees && this.trees.a === a) return this.trees.m;
        const m = new Float32Array(W0.w * W0.h);
        for (const e of a.ents) {
            if (e.kind !== 'tree' && e.kind !== 'fruittree' && e.kind !== 'bigtree') continue;
            const tx = e.tx != null ? e.tx : Math.floor(e.x / TILE), ty = e.ty != null ? e.ty : Math.floor((e.y - 3) / TILE);
            for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
                const x = tx + i, y = ty + j;
                if (x < 0 || y < 0 || x >= W0.w || y >= W0.h) continue;
                const k = Math.max(0, 1 - Math.hypot(i, j) / 3.2);
                if (k > m[y * W0.w + x]) m[y * W0.w + x] = k;
            }
        }
        this.trees = { a, m };
        return m;
    },
    tick(r3, a) {
        if (!a || a.interior || !r3.target) { this.tuft.count = this.leaf.count = 0; return; }
        const season = a.bgSeason || Clock.season();
        if (season !== this.season) { this.season = season; this.paint(season); this.key = null; this.trees = null; }
        // (refilled when the view has moved a couple of tiles, or the ground under it has been made since)
        const cx = Math.round(r3.target.x / 2) * 2, cz = Math.round(r3.target.z / R3_ZS / 2) * 2, made = Env.built ? Env.built.chunks.size : 0;
        const key = cx + ',' + cz + ',' + made + ',' + (Env.built && Env.built.pathsSig || '');
        if (key === this.key && (G.frame % 120)) return;
        this.key = key;
        this.fill(a, season, cx, cz);
    },
    /* the tiles filled round the view's middle, nearest first: 17 to each side, 15 ahead, 8 back toward the camera, each
       with how big what's on it is drawn (shrinking over the last quarter of the way out) */
    order() {
        if (this._order) return this._order;
        const out = [];
        for (let j = -15; j <= 8; j++) for (let i = -17; i <= 17; i++) {
            const e = Math.hypot(i / 17.5, j / (j < 0 ? 15.5 : 8.5));
            if (e < 1) out.push([i, j, Math.min(1, (1 - e) / 0.25), e]);
        }
        return (this._order = out.sort((p, q) => p[3] - q[3]));
    },
    fill(a, season, cx, cz) {
        const M = this.M, q = this.q, e = this.e, v = this.v, s = this.s, c = this.c;
        const near = this.treeNear(a), lf = this.LEAF[season] || [0, 0], cols = this.LEAF_COLS[season] || [];
        // (what stands on a tile already: a plot, a flower, a stump, a hole, something lying there)
        const taken = new Set();
        for (const o of a.ents) {
            if (o.tx != null && o.ty != null) taken.add(o.tx + ',' + o.ty);
            else if (o.kind === 'item') taken.add(Math.floor(o.x / TILE) + ',' + Math.floor((o.y - 2) / TILE));
        }
        let nt = 0, nl = 0;
        // (nearest tiles first, so when there are more than the meshes hold it's the far ones left out; both shrink to
        // nothing toward the edge of what's filled, so nothing ends in a line as the view moves on)
        for (const [i, j, edge] of this.order()) {
            const tx = cx + i, ty = cz + j;
            if (tx < 0 || ty < 0 || tx >= W0.w || ty >= W0.h) continue;
            if (a.blockedAt(tx, ty) || a.waterAt(tx, ty) || taken.has(tx + ',' + ty)) continue;
            const r = mulberry(hash32('lawn' + tx + ',' + ty));
            // tufts, on the lawn only, the wilder the more
            if (season !== 'winter' && nt < this.TUFTS) {
                const wild = EnvGround.wildAt(tx + 0.5, ty + 0.5), want = this.TUFT_NEAR + (this.TUFT_WILD - this.TUFT_NEAR) * wild * wild;
                let k = Math.floor(want) + (r() < want % 1 ? 1 : 0);
                while (k-- > 0 && nt < this.TUFTS) {
                    const x = tx + 0.1 + r() * 0.8, y = ty + 0.1 + r() * 0.8;
                    if (EnvGround.grassAt(x, y) < 0.9) continue;
                    // (smaller further off, gone by the time the lawn's own detail has melted away)
                    const far = Math.hypot(x - cx, (y - cz) * 0.8), sc = (1.0 + r() * 0.7) * Math.max(0, Math.min(1, (16 - far) / 5)) * edge;
                    if (sc <= 0.05) continue;
                    e.set(0, r() * Math.PI * 2, 0); q.setFromEuler(e);
                    M.compose(v.set(x, Env.groundH(x * TILE, y * TILE) - 0.005, y * R3_ZS), q, s.set(sc, sc * (0.85 + wild * 0.35), sc));
                    this.tuft.setMatrixAt(nt++, M);
                }
            }
            // fallen leaves, more under the trees (petals in spring only there)
            if (lf[1] > 0 && cols.length && nl < this.LEAVES) {
                const want = lf[0] + (lf[1] - lf[0]) * near[ty * W0.w + tx];
                let k = Math.floor(want) + (r() < want % 1 ? 1 : 0);
                while (k-- > 0 && nl < this.LEAVES) {
                    const x = tx + r(), y = ty + r(), sc = ((season === 'spring' ? 0.7 : 1.15) + r() * 0.55) * edge;
                    e.set((r() - 0.5) * 0.35, r() * Math.PI * 2, (r() - 0.5) * 0.35); q.setFromEuler(e);
                    M.compose(v.set(x, Env.groundH(x * TILE, y * TILE) + 0.006, y * R3_ZS), q, s.set(sc, sc, sc));
                    this.leaf.setMatrixAt(nl, M);
                    c.setHex(cols[Math.floor(r() * cols.length)]).multiplyScalar(0.92 + r() * 0.16);
                    this.leaf.setColorAt(nl++, c);
                }
            }
        }
        this.tuft.count = nt; this.leaf.count = nl;
        this.tuft.instanceMatrix.needsUpdate = true; this.leaf.instanceMatrix.needsUpdate = true;
        if (this.leaf.instanceColor) this.leaf.instanceColor.needsUpdate = true;
    },
};
