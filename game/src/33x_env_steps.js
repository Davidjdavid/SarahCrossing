/* ---- 33x_env_steps.js ---- */
/* Footprints in the sand (David, 29 October): walking on the beach, Sarah (and anyone walking near her) leaves a print a
   step, left and right, pressed a little darker into the sand, that fades away after a second or two. One mesh of small
   ovals rewritten as they come and go, in the new look only. */
const EnvSteps = {
    N: 56, LIFE: 2000, FADE: 900,
    build(group) {
        const N = this.N, pos = this.pos = new Float32Array(N * 12), al = this.al = new Float32Array(N * 4), uv = new Float32Array(N * 8), idx = [];
        for (let i = 0; i < N; i++) {
            uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
            idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
        }
        const g = this.geo = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
        g.setAttribute('aA', new THREE.BufferAttribute(al, 1).setUsage(THREE.DynamicDrawUsage));
        g.setIndex(idx);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0x7a5a3a, transparent: true, depthWrite: false }), { key: 'envsteps', noDof: true, noEdge: true, noCloud: true,
            vhead: 'attribute vec2 aUv; attribute float aA; varying vec2 vFUv; varying float vA;\n', vbody: 'vFUv = aUv; vA = aA;',
            fhead: 'varying vec2 vFUv; varying float vA;\n',
            // (an oval, a little wider at the toe than the heel, soft at its rim)
            fpre: 'vec2 q = vFUv * 2.0 - 1.0; q.x *= 1.0 + 0.25 * (1.0 - vFUv.y); gl_FragColor.a *= vA * smoothstep(1.0, 0.55, length(q));' });
        const m = this.mesh = new THREE.Mesh(g, mat);
        m.frustumCulled = false; m.renderOrder = 1; m.userData.live = true;
        group.add(m);
        this.prints = Array.from({ length: N }, () => ({ at: -1 }));
        this.next = 0;
        this.trail = new Map();
        return { meshes: [m], tick: () => this.tick() };
    },
    sand(x, y) {
        const tx = Math.floor(x / TILE), ty = Math.floor((y - 2) / TILE), row = W0.grid[ty];
        return !!row && row[tx] === 's' && overlayAt(tx, ty) === undefined && !(G.area.waterAt && G.area.waterAt(tx, ty));
    },
    /* a print at a spot (world pixels), heading (hx, hy), on the left foot or the right (side -1 or 1) */
    add(x, y, hx, hy, side, now) {
        const i = this.next++ % this.N, P = this.prints[i];
        P.at = now;
        const X = x / TILE, Z = y / TILE * R3_ZS, Y = Env.groundH(x, y) + 0.012;
        let fx = hx, fz = hy * R3_ZS;
        const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l;
        const sx = -fz, sz = fx, cx = X + sx * side * 0.055, cz = Z + sz * side * 0.055, L = 0.075, Wd = 0.042;
        // (heel, then the toe ahead: the oval's narrow end at the heel)
        const c = [[-Wd, -L], [Wd, -L], [Wd, L], [-Wd, L]];
        c.forEach(([a, b], k) => this.pos.set([cx + sx * a + fx * b, Y, cz + sz * a + fz * b], i * 12 + k * 3));
        this.geo.attributes.position.needsUpdate = true;
    },
    tick() {
        const a = G.area;
        if (!this.mesh || !a || a.interior || G.mode !== 'play') { if (this.mesh) this.mesh.visible = false; return; }
        this.mesh.visible = true;
        const now = performance.now(), p = G.player;
        const who = [p].concat(NPCs.here().filter(n => !n.hidden && Math.hypot(n.x - p.x, n.y - p.y) < 14 * TILE));
        for (const e of who) {
            let T = this.trail.get(e);
            if (!T) this.trail.set(e, T = { x: e.x, y: e.y, d: 0, hx: 0, hy: 1, side: 1 });
            const dx = e.x - T.x, dy = e.y - T.y, m = Math.hypot(dx, dy);
            T.x = e.x; T.y = e.y;
            if (m <= 0 || m > 12) continue;                       // (standing still, or a jump: a door, a teleport)
            T.d += m; T.hx = dx / m; T.hy = dy / m;
            // (a step about every third of a tile, alternating feet)
            if (T.d < 5.5) continue;
            T.d = 0; T.side = -T.side;
            if (this.sand(e.x, e.y)) this.add(e.x, e.y, T.hx, T.hy, T.side, now);
        }
        for (let i = 0; i < this.N; i++) {
            const P = this.prints[i], age = P.at < 0 ? 1e9 : now - P.at;
            const v = age >= this.LIFE ? 0 : 0.42 * Math.min(1, (this.LIFE - age) / this.FADE);
            if (v === 0 && P.at >= 0) P.at = -1;
            this.al.fill(v, i * 4, i * 4 + 4);
        }
        this.geo.attributes.aA.needsUpdate = true;
        if (this.trail.size > 40) for (const k of this.trail.keys()) if (!who.includes(k)) this.trail.delete(k);
    },
};
