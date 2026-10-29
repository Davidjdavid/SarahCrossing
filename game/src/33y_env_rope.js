/* ---- 33y_env_rope.js ---- */
/* The jump rope in the new look (David, 29 October: the square's rope was a flat drawing): a real rope between the two
   turners' hands, swinging round in a loop with the game's own beat (Rope.phase: over their heads, then sweeping the
   ground under the jumper's feet), its handles in their hands, the turners' arms going round with it (ropeTurn, read by
   pose2 and poseFolk2). One tube rewritten each frame while the rope is out. */
const EnvRope = {
    SEG: 28, RAD: 6, R: 0.0155,
    build(group) {
        const n = (this.SEG + 1) * this.RAD, idx = [];
        this.pos = new Float32Array(n * 3);
        for (let i = 0; i < this.SEG; i++) for (let j = 0; j < this.RAD; j++) {
            const a = i * this.RAD + j, b = i * this.RAD + (j + 1) % this.RAD, c = a + this.RAD, d = b + this.RAD;
            idx.push(a, c, b, b, c, d);
        }
        const g = this.geo = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
        g.setIndex(idx);
        const m = this.mesh = new THREE.Mesh(g, r3Patch(new THREE.MeshLambertMaterial({ color: 0xff6a9a }), { key: 'envrope' }));
        m.frustumCulled = false; m.castShadow = true; m.visible = false; m.userData.live = true;
        group.add(m);
        // (the wooden handles in their hands)
        const hg = new THREE.CylinderGeometry(0.022, 0.026, 0.13, 8), hm = r3Patch(new THREE.MeshLambertMaterial({ color: 0x8a5a2b }), { key: 'envropeh' });
        this.handles = [0, 1].map(() => { const h = new THREE.Mesh(hg, hm); h.visible = false; h.castShadow = true; group.add(h); return h; });
        return { meshes: [m].concat(this.handles), tick: () => this.tick() };
    },
    hide() { if (this.mesh) { this.mesh.visible = false; for (const h of this.handles) h.visible = false; } },
    tick() {
        const tw = ropeTwins();
        if (!this.mesh || !tw || !G.area || G.area.id !== 'island') { this.hide(); return; }
        const [A, B] = tw, ph = Rope.phase * Math.PI * 2, P = this.pos;
        // each turner's hand, held out toward the other at waist height, going round a little with the rope
        const hand = (e, dir) => {
            const x = e.x / TILE + dir * 0.24, z = e.y / TILE * R3_ZS + 0.06, y = Env.groundH(e.x, e.y) + 0.62 + (e.hop || 0) / TILE;
            return [x, y + 0.05 * Math.cos(ph), z + 0.05 * Math.sin(ph)];
        };
        const a = hand(A, B.x > A.x ? 1 : -1), b = hand(B, A.x > B.x ? 1 : -1);
        // the loop: over their heads at the top, brushing the ground at the bottom, and out toward the camera between
        const low = Math.min(a[1], b[1]) - Env.groundH((A.x + B.x) / 2, (A.y + B.y) / 2) - 0.03, R = Math.max(0.5, low);
        const oy = Math.cos(ph) * (Math.cos(ph) > 0 ? R * 1.25 : R), oz = Math.sin(ph) * R * 0.9;
        const pts = [];
        for (let i = 0; i <= this.SEG; i++) {
            const t = i / this.SEG, k = Math.sin(Math.PI * t);
            pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + oy * k - 0.04 * k, a[2] + (b[2] - a[2]) * t + oz * k]);
        }
        for (let i = 0; i <= this.SEG; i++) {
            const p = pts[i], q = pts[Math.min(this.SEG, i + 1)], o = pts[Math.max(0, i - 1)];
            let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2];
            const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
            // (two directions across the rope: one in the loop's plane, one square to it)
            let ux = 0, uy = 1, uz = 0;
            const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz;
            const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
            const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
            for (let j = 0; j < this.RAD; j++) {
                const an = j / this.RAD * Math.PI * 2, c = Math.cos(an) * this.R, s = Math.sin(an) * this.R, k = (i * this.RAD + j) * 3;
                P[k] = p[0] + ux * c + vx * s; P[k + 1] = p[1] + uy * c + vy * s; P[k + 2] = p[2] + uz * c + vz * s;
            }
        }
        this.geo.attributes.position.needsUpdate = true;
        this.geo.computeVertexNormals();
        this.mesh.visible = true;
        [a, b].forEach((h, i) => { const m = this.handles[i]; m.visible = true; m.position.set(h[0], h[1], h[2]); m.rotation.set(0, 0, Math.PI / 2); });
    },
};
/* the two turning the rope right now (or holding it through a game), once a frame */
function ropeTwins() {
    if (typeof Rope === 'undefined' || !Rope.ent || !G.areas || !G.areas.island || !G.areas.island.ents.includes(Rope.ent)) return null;
    if (ropeTwins.f === G.frame) return ropeTwins.v;
    ropeTwins.f = G.frame;
    return (ropeTwins.v = Rope.turners() || (Rope.on ? Rope.cast : null));
}
/* a turner's arm going round with the rope: { ph } (radians), or null */
function ropeTurn(e) {
    const tw = ropeTwins();
    return tw && tw.includes(e) ? { ph: Rope.phase * Math.PI * 2 } : null;
}
