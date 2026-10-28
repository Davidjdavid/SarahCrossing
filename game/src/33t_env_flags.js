/* ---- 33t_env_flags.js ---- */
/* The island flag flying in the new look (David's last list, 27 October: "the flag Sarah draws as a 3D flag flying over
   the Town Hall, and on a little flagpole at the end of the pier"): a white pole with a gold ball on each of the island's
   flagpoles (world.json's `flagpole` props, the plan's `flagpoles`, and any the designer sets down), and on it a cloth in
   the Town Hall's design (flagCanvas: one square a cell, kept sharp), rippling from the pole out in the wind; before
   Sarah has drawn one it flies the design the Town Hall's flag screen starts from. A new design is painted onto the same
   cloth as soon as it's raised. The flat views draw the island flag's picture (d_flag). */
const EnvFlags = {
    H: 3.1,                 // the pole's height (tiles)
    W: 1.3, FH: 0.81,       // the cloth (as wide as FLAG_W, as tall as FLAG_H)
    build(group, a) {
        this.flags = [];
        const poles = a.ents.filter(e => e.kind === 'flagpole');
        if (!poles.length) return null;
        const pole = r3Patch(new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.45, metalness: 0.2 }), { key: 'envflagpole' });
        const gold = r3Patch(new THREE.MeshStandardMaterial({ color: 0xe8b84a, roughness: 0.3, metalness: 0.55 }), { key: 'envflaggold' });
        const stone = r3Patch(new THREE.MeshStandardMaterial({ color: 0xb8b0a2, roughness: 0.95 }), { key: 'envflagstone' });
        const cv = this.canvas = document.createElement('canvas');
        cv.width = FLAG_W * 8; cv.height = FLAG_H * 8;
        const tex = this.tex = new THREE.CanvasTexture(cv);
        tex.magFilter = THREE.NearestFilter; tex.anisotropy = 4;
        Env.built.textures.push(tex);
        this.paint(true);
        const cloth = r3Patch(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide }), { key: 'envflagcloth' });
        const poleGeo = new THREE.CylinderGeometry(0.032, 0.045, this.H, 10), ballGeo = new THREE.SphereGeometry(0.075, 12, 8), footGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.16, 12);
        for (const e of poles) {
            const f = Env.tileSpot(e), g = new THREE.Group();
            g.position.set(f.x, f.y, f.z);
            const m1 = new THREE.Mesh(poleGeo, pole); m1.position.y = this.H / 2 + 0.1; g.add(m1);
            const m2 = new THREE.Mesh(ballGeo, gold); m2.position.y = this.H + 0.15; g.add(m2);
            const m3 = new THREE.Mesh(footGeo, stone); m3.position.y = 0.08; g.add(m3);
            // (the cloth: its left edge on the pole, near the top, out to the east; its own geometry, since each one ripples
            // at its own time)
            const geo = new THREE.PlaneGeometry(this.W, this.FH, 16, 8);
            geo.translate(this.W / 2, 0, 0);
            const m4 = new THREE.Mesh(geo, cloth);
            m4.position.set(0.04, this.H - this.FH / 2 - 0.02, 0);
            m4.castShadow = true;
            g.add(m4);
            for (const m of [m1, m2, m3]) { m.castShadow = true; m.receiveShadow = true; }
            group.add(g);
            this.flags.push({ g, geo, base: Float32Array.from(geo.attributes.position.array), seed: hash32('flag' + e.px + ',' + e.py) % 100 });
        }
        return { meshes: [], tick: () => this.tick() };
    },
    /* the Town Hall's design onto the cloth (or the one its screen starts from), when it changes */
    paint(force) {
        const T = S && S.town, key = (T && T.flag) || '';
        if (!force && key === this.key) return;
        this.key = key;
        const cells = key ? key.split('').map(Number) : Array.from({ length: FLAG_W * FLAG_H }, (_, i) => (Math.floor(i / FLAG_W) >= 7 ? 3 : 4));
        const g = this.canvas.getContext('2d'), k = this.canvas.width / FLAG_W;
        cells.forEach((v, i) => { g.fillStyle = FLAG_PAL[v] || FLAG_PAL[0]; g.fillRect((i % FLAG_W) * k, Math.floor(i / FLAG_W) * k, k, k); });
        this.tex.needsUpdate = true;
    },
    /* the cloth ripples out from the pole: more at the free end, a wave running along it, a little sag (only flags near
       the view are moved) */
    tick() {
        if (!this.flags || !this.flags.length) return;
        if (G.t % 30 === 0) this.paint();
        const t = performance.now() / 1000, p = G.player, wind = G.weather === 'rain' || G.weather === 'snow' ? 1.5 : 1;
        for (const F of this.flags) {
            if (p && Math.hypot(F.g.position.x - p.x / TILE, F.g.position.z - p.y / TILE * R3_ZS) > 48) continue;
            const pos = F.geo.attributes.position, b = F.base;
            for (let i = 0; i < pos.count; i++) {
                const x = b[i * 3], y = b[i * 3 + 1], u = x / this.W;
                const wave = Math.sin(x * 5.2 - t * 4.2 * wind + F.seed) * 0.09 + Math.sin(x * 9.1 - t * 6.3 * wind + y * 3 + F.seed) * 0.03;
                pos.setXYZ(i, x * (1 - 0.04 * u), y - u * u * 0.06 * (2 - wind), wave * u * wind);
            }
            pos.needsUpdate = true;
            F.geo.computeVertexNormals();
        }
    },
};
