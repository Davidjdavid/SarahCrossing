/* ---- 33r_env_fishing.js ---- */
/* Fishing in the new look, in 3D (David, 27 October: the rod a real one, and the catch reeled up and held over Sarah's
   head): the line from the tip of the rod in Sarah's hand (EnvDolls' rod, d.rodTip) sagging to the bobber, the bobber
   riding the water (flying out on the cast, dipping at a nibble, ripples at the bite), the fish's shadow drifting up to
   it; then the catch flying up out of the water into Sarah's hands (G.reel, Fishing.catch) and held over her head while
   she shows it off (G.held, the holdup pose). The flat views draw all of this in 2D (Fishing.draw). */
const EnvFishing = {
    FLY: 520,           // (how long the catch takes to fly up, ms)
    on() { return typeof Env !== 'undefined' && Env.on && !!Env.built && !!this.group && typeof R3 !== 'undefined' && R3.active() && !!G.area && !G.area.interior; },
    build(group) {
        const g = this.group = new THREE.Group();
        group.add(g);
        // (the line a thin tube, made again each frame along its curve: a GL line is a single pixel and gets lost)
        this.N = 18;
        this.pts = Array.from({ length: this.N }, () => new THREE.Vector3());
        this.line = new THREE.Mesh(new THREE.BufferGeometry(), r3Patch(new THREE.MeshBasicMaterial({ color: 0xf6f4ee }), { key: 'envfishline' }));
        this.line.frustumCulled = false;
        // the bobber: red over white, a little stalk on top
        const b = this.bobber = new THREE.Group(), mat = (c) => r3Patch(new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), { key: 'envfishbob' });
        b.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe0303a)));
        b.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf8f6f0)));
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), mat(0xf8f6f0));
        st.position.y = 0.065;
        b.add(st);
        for (const m of b.children) m.castShadow = true;
        // the ripples round it, and the fish's dark shape under the water
        const soft = (c, o) => r3Patch(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false }), { key: 'envfishsoft', noDof: true, noEdge: true });
        this.rings = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 36), soft(0xffffff, 0.6)); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; return m; });
        this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), soft(0x0b1a22, 0.32));
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.renderOrder = 2;
        g.add(this.line, b, this.shadow, ...this.rings);
        g.visible = false;
        this.held = null;
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* a spot on the island (pixels) in the world: on the water if there's water there */
    at(px, py, out) {
        const w = Env.waterH(px, py);
        return out.set(px / TILE, w != null ? w : Env.groundH(px, py), py / TILE * R3_ZS);
    },
    tip(out) {
        const d = typeof EnvDolls !== 'undefined' && EnvDolls.dolls && EnvDolls.dolls.get(G.player);
        if (d && d.tool === 'rod' && d.rodTip) { d.root.updateMatrixWorld(true); return d.rodTip.getWorldPosition(out); }
        // (no doll yet: from Sarah's hands)
        return out.set(G.player.x / TILE, Env.groundH(G.player.x, G.player.y) + 0.8, (G.player.y - 4) / TILE * R3_ZS);
    },
    tick(r3, a) {
        const s = Fishing.st, g = this.group, show = this.on() && !!s;
        g.visible = show;
        this.tickHeld();
        if (!show) return;
        const T = this._t || (this._t = new THREE.Vector3()), B = this._b || (this._b = new THREE.Vector3()), P = this._p || (this._p = new THREE.Vector3());
        this.tip(T);
        this.at(s.x, s.y, B);
        const t = G.t;
        // the bobber: flying out on the cast, then riding the water, dipping at a nibble and pulled under at the bite
        if (s.phase === 'cast') {
            const k = Math.min(1, s.t / 20);
            B.lerpVectors(T, B, k);
            B.y += Math.sin(k * Math.PI) * 0.7;
        } else B.y += 0.012 + Math.sin(t / 16) * 0.006 - s.dip * 0.007;
        this.bobber.position.copy(B);
        this.bobber.rotation.z = s.phase === 'bite' ? Math.sin(t / 2) * 0.3 : Math.sin(t / 23) * 0.08;
        // the line, sagging from the tip, drawn tight when the fish bites
        const N = this.N, len = T.distanceTo(B);
        const sag = s.phase === 'bite' ? 0.02 : s.phase === 'cast' ? 0.04 : 0.12 * len;
        for (let i = 0; i < N; i++) {
            const k = i / (N - 1), q = this.pts[i];
            q.lerpVectors(T, B, k);
            q.y -= sag * 4 * k * (1 - k);
        }
        this.line.geometry.dispose();
        this.line.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(this.pts), N * 2, 0.007, 4, false);
        // ripples at a nibble and the bite
        const rip = s.phase === 'bite' || (s.phase === 'nibble' && s.dip > 2);
        this.rings.forEach((m, i) => {
            const ph = ((s.t + i * 10) % 20) / 20;
            m.visible = rip;
            if (!rip) return;
            const r = 0.07 + ph * (s.phase === 'bite' ? 0.32 : 0.2);
            m.position.set(B.x, this.at(s.x, s.y, P).y + 0.008, B.z);
            m.scale.set(r, r * 0.8, r);
            m.material.opacity = 0.6 * (1 - ph);
        });
        // the fish's shadow, drifting toward the bobber, longer the bigger the fish
        const sh = s.shadow;
        this.shadow.visible = s.phase !== 'cast' && !!sh;
        if (sh) {
            this.at(sh.x, sh.y, P);
            this.shadow.position.set(P.x, P.y + 0.004, P.z);
            const L = 0.09 + 0.05 * Math.min(5, sh.size);
            this.shadow.scale.set(L, L * 0.45, 1);
            this.shadow.rotation.z = -Math.atan2((s.y - sh.y) * R3_ZS, s.x - sh.x);
        }
    },
    /* the catch: flying up out of the water into Sarah's hands, then held over her head (a fish in its own color, a
       boot, whatever came up) */
    tickHeld() {
        const id = (G.reel && G.reel.id) || G.held, on = !!id && this.on();
        if (!on || (this.held && this.held.userData.id !== id)) { if (this.held) { this.held.parent.remove(this.held); this.held = null; } if (!on) return; }
        if (!this.held) {
            const n = typeof EnvItems !== 'undefined' && EnvItems.group && EnvItems.model(id);
            if (!n) return;
            const m = this.held = new THREE.Group(), src = EnvItems.make(n, EnvItems.tint(id));
            src.parent.remove(src);
            m.add(src);
            // (the pocket things are made to be seen from above, lying down: held up, both sides of each show)
            const two = this._two || (this._two = new Map());
            for (const k of src.children) {
                const M = k.material;
                if (!two.has(M.uuid)) { const c = M.clone(); c.onBeforeCompile = null; c.side = THREE.DoubleSide; two.set(M.uuid, r3Patch(c, Object.assign({}, M._r3o || { key: 'envmodel' }))); }
                k.material = two.get(M.uuid);
            }
            m.userData.id = id;
            m.scale.setScalar(2.1);
            this.group.parent.add(m);
        }
        const H = this._h || (this._h = new THREE.Vector3()), d = EnvDolls.dolls && EnvDolls.dolls.get(G.player);
        // (the head's joint is at the neck: the catch goes a little above the top of the hair, between the hands)
        if (d && d.parts.head) { d.root.updateMatrixWorld(true); d.parts.head.getWorldPosition(H); H.y += 1.2; H.z += 0.12; }
        else H.set(G.player.x / TILE, Env.groundH(G.player.x, G.player.y) + 1.3, G.player.y / TILE * R3_ZS);
        const m = this.held;
        if (G.reel) {
            // (along an arc from where the bobber was, turning over as it comes)
            const k = Math.min(1, (performance.now() - G.reel.t0) / this.FLY), F = this.at(G.reel.x, G.reel.y, this._f || (this._f = new THREE.Vector3()));
            m.position.lerpVectors(F, H, k);
            m.position.y += Math.sin(k * Math.PI) * 0.9;
            m.rotation.set(1.1 * k, k * Math.PI * 2, 0);
        } else {
            // (held up, a little wiggle)
            m.position.copy(H);
            m.rotation.set(1.1, 0, Math.sin(G.t / 7) * 0.12);
        }
    },
};
