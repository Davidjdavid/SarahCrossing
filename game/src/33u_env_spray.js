/* ---- 33u_env_spray.js ---- */
/* The fountains play in the new look (David's list of things that should act, 28 October: "fountains shoot water"): the
   models' water stands still, so beads of water are thrown up from the top of each fountain near the view and fall back
   into its bowls, as EnvPour's drops fall from the watering can. The flat views draw their own spray (drawFountain). */
const EnvSpray = {
    N: 56,
    /* where each kind's water leaves the top (tiles above the ground) and how far it may fall before it's gone */
    TOPS: { fountain_grand: [2.0, 0.42, 0.95], fountain: [1.16 * 0.8, 0.4 * 0.8, 0.5], dp_fountain: [0.9, 0.3, 0.35] },
    build(group, a) {
        const list = a.ents.filter(e => (e.kind === 'fountain' || e.kind === 'fountain_grand') || (e.kind === 'display' && e.disp === 'dp_fountain'));
        this.fountains = [];
        if (!list.length) return null;
        const geo = new THREE.SphereGeometry(0.03, 6, 4);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.8, depthWrite: false }), { key: 'envspray', noDof: true, noEdge: true });
        for (const e of list) {
            const kind = e.kind === 'display' ? 'dp_fountain' : e.kind, T = this.TOPS[kind];
            let x, y, z;
            if (e.kind === 'display') { const f = EnvBuild.displaySpot(e); x = f.x; y = f.y; z = f.z; }
            else { const P = EnvBuild.PROP_MODELS[e.kind], f = EnvBuild.turned(e, P ? P[2] : 0.5); x = f.x; y = f.y; z = f.z; }
            const g = new THREE.Group();
            group.add(g);
            const drops = Array.from({ length: this.N }, () => { const m = new THREE.Mesh(geo, mat); m.visible = false; m.scale.set(1, 1.5, 1); m.renderOrder = 3; g.add(m); return { m, t: -1, v: new THREE.Vector3() }; });
            this.fountains.push({ x, y, z, top: y + T[0], floor: y + T[1], reach: T[2], drops, next: 0 });
        }
        return { meshes: [], tick: () => this.tick() };
    },
    tick() {
        const p = G.player;
        if (!p || !this.fountains) return;
        const px = p.x / TILE, pz = p.y / TILE * R3_ZS;
        for (const F of this.fountains) {
            const near = Math.hypot(F.x - px, F.z - pz) < 34;
            // (a few new beads a frame from the top, each thrown up and out a little)
            if (near) for (let k = 0; k < 2; k++) {
                const q = F.drops[F.next++ % this.N];
                if (q.t >= 0) continue;
                const a = Math.random() * Math.PI * 2, out = (0.4 + Math.random() * 0.6) * F.reach * 0.012;
                q.t = 0; q.m.visible = true;
                q.m.position.set(F.x, F.top, F.z);
                q.v.set(Math.cos(a) * out, 0.022 + Math.random() * 0.016, Math.sin(a) * out);
            }
            for (const q of F.drops) {
                if (q.t < 0) continue;
                q.t++;
                q.v.y -= 0.0019;
                q.m.position.add(q.v);
                if (!near || q.t > 90 || (q.v.y < 0 && q.m.position.y < F.floor)) { q.t = -1; q.m.visible = false; }
            }
        }
    },
};
