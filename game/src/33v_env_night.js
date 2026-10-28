/* ---- 33v_env_night.js ---- */
/* More life at night in the new look (David's notes from playing beta, 28 October): moths fluttering round the lit lamps
   near Sarah, and on warm clear nights (late spring to early autumn) fireflies drifting low over the grass, each glowing
   and fading at its own pace. Both are a handful of tiny instanced things kept round wherever Sarah is. */
const EnvNight = {
    MOTHS: 4,           // round each lamp
    LAMPS: 8,           // the nearest lit lamps that get moths
    FLIES: 46,
    build(group) {
        const g = this.group = new THREE.Group();
        group.add(g);
        const mothMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xf4ead8, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), { key: 'envmoth', noDof: true, inst: true });
        const flyMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xd8ff7a, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }), { key: 'envfly', noDof: true, inst: true });
        // (a moth: two little wings in a V; a firefly: a bead of light)
        const wing = new THREE.PlaneGeometry(0.07, 0.05);
        this.moths = new THREE.InstancedMesh(wing, mothMat, this.MOTHS * this.LAMPS * 2);
        this.flies = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), flyMat, this.FLIES);
        for (const m of [this.moths, this.flies]) { m.frustumCulled = false; m.count = 0; m.renderOrder = 4; m.userData.live = true; g.add(m); }
        this.fly = Array.from({ length: this.FLIES }, (_, i) => ({ x: 0, z: 0, y: 0, ph: i * 1.7, sp: 0.6 + (i % 5) * 0.12, set: false }));
        this.mat = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(1, 1, 1); this.e = new THREE.Euler();
        return { meshes: [], tick: () => this.tick() };
    },
    night() { const h = Clock.hourF(); return h >= 19.6 || h < 4.8; },
    warm() { const m = Clock.month(); return m >= 5 && m <= 9 && G.weather !== 'rain' && G.weather !== 'snow' && G.weather !== 'cloudy'; },
    tick() {
        const p = G.player, a = G.area;
        if (!p || !a || a.interior || !this.night()) { this.moths.count = 0; this.flies.count = 0; return; }
        const t = performance.now() / 1000, M = this.mat, q = this.q, v = this.v, s = this.s, px = p.x / TILE, pz = p.y / TILE;
        // moths: round the nearest lit lamps, each on its own wobbling loop near the light, wings beating
        const lamps = a.ents.filter(e => (e.kind === 'lamp' || e.lamp || (e.kind === 'display' && e.light)) && !e.hidden && Math.abs(e.x / TILE - px) < 22 && Math.abs(e.y / TILE - pz) < 16)
            .sort((e1, e2) => Math.hypot(e1.x / TILE - px, e1.y / TILE - pz) - Math.hypot(e2.x / TILE - px, e2.y / TILE - pz)).slice(0, this.LAMPS);
        let n = 0;
        for (const [li, e] of lamps.entries()) {
            const f = Env.tileSpot(e), top = f.y + (e.kind === 'lamp' || e.lamp ? 2.35 : 1.1);
            for (let k = 0; k < this.MOTHS; k++) {
                const ph = li * 3.1 + k * 1.9, r = 0.22 + 0.12 * Math.sin(t * 0.7 + ph), ang = t * (1.6 + k * 0.35) + ph;
                const x = f.x + Math.cos(ang) * r, z = f.z + Math.sin(ang) * r * 0.8, y = top + 0.12 * Math.sin(t * 2.3 + ph * 2) + 0.08 * Math.sin(t * 5.1 + ph);
                const flap = 0.35 + 0.9 * Math.abs(Math.sin(t * 28 + ph * 5));
                for (const side of [-1, 1]) {
                    this.e.set(0, -ang, side * flap);
                    q.setFromEuler(this.e);
                    v.set(x + side * 0.02 * Math.cos(ang), y, z);
                    M.compose(v, q, s);
                    this.moths.setMatrixAt(n++, M);
                }
            }
        }
        this.moths.count = n;
        this.moths.instanceMatrix.needsUpdate = true;
        // fireflies: low over open ground round Sarah, drifting, each glowing and fading; one that's left behind starts again
        // somewhere near her
        if (!this.warm()) { this.flies.count = 0; return; }
        let c = 0;
        for (const F of this.fly) {
            if (!F.set || Math.hypot(F.x - px, F.z - pz) > 16) {
                const ang = Math.random() * Math.PI * 2, d = 3 + Math.random() * 11, tx = Math.floor(px + Math.cos(ang) * d), tz = Math.floor(pz + Math.sin(ang) * d);
                if (a.blockedAt(tx, tz) || a.waterAt(tx, tz) || groundChar(tx, tz) !== 'g') continue;
                F.x = tx + Math.random(); F.z = tz + Math.random(); F.set = true;
                F.y = Env.groundH(F.x * TILE, F.z * TILE) + 0.3 + Math.random() * 0.7;
            }
            F.x += Math.sin(t * 0.4 * F.sp + F.ph) * 0.004; F.z += Math.cos(t * 0.33 * F.sp + F.ph * 1.3) * 0.004;
            const glow = Math.max(0, Math.sin(t * F.sp * 1.4 + F.ph)), k = 0.25 + glow * 1.1;
            if (glow < 0.05) continue;
            v.set(F.x, F.y + Math.sin(t * 0.9 + F.ph) * 0.12, F.z * R3_ZS);
            s.set(k, k, k);
            q.identity();
            M.compose(v, q, s);
            this.flies.setMatrixAt(c++, M);
        }
        s.set(1, 1, 1);
        this.flies.count = c;
        this.flies.instanceMatrix.needsUpdate = true;
    },
};
