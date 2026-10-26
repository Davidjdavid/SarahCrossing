/* ---- 33o_env_sea.js ---- */
/* What sails, swims and flies round the island in the new look, as dollhouse toys from tools/blender/small_things.py
   instead of their pictures: Sarah's sailboat tied up at the pier (bobbing), the boats crossing the sea (SeaSky.boats:
   sailboats, a fishing boat, the ferry, each turned the way it's going, rocking a little), dolphins leaping in an arc,
   and overhead the planes (their propellers spinning) and hot air balloons (SeaSky.sky), and the gulls wheeling over the
   beach (the critters' gull, flapping). It all follows SeaSky's own things: where they are, where they're going. */
const EnvSea = {
    PLANE_ALT: 5.6, BALLOON_ALT: 4.6, GULL_ALT: 2.6,       // how high they go (world units over the sea)
    PLANE_SIZE: 0.55, BALLOON_SIZE: 0.75,                  // (small, as things far up look: a plane full size would seem parked)
    list: new Map(), drawn: new Set(),
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        this.list = new Map();
        this.drawn = new Set();
        this.dock = (a.ents || []).find(e => e.kind === 'sailboat') || null;
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* (R3 asks: is this one a toy here? then it draws no card) */
    draws(e) { return Env.on && this.drawn.has(e); },
    takes(e) { return e.kind === 'sailboat' && typeof EnvModels !== 'undefined' && EnvModels.has('boat_docked'); },
    sky() { return Env.on && typeof EnvModels !== 'undefined' && EnvModels.has('sky_plane'); },
    make(name) {
        const M = EnvModels.models[name], g = new THREE.Group();
        for (const p of M.parts) {
            const mesh = new THREE.Mesh(p.geometry, p.material);
            mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.shared = true;
            g.add(mesh);
        }
        // (the plane's propeller is a model of its own, turned about its nose)
        if (name === 'sky_plane' && EnvModels.models.sky_plane_prop) {
            const P = EnvModels.models.sky_plane_prop, hub = new THREE.Group();
            hub.position.set(0.7, 0, 0);
            for (const p of P.parts) { const m = new THREE.Mesh(p.geometry, p.material); m.position.set(-0.7, 0, 0); m.userData.shared = true; hub.add(m); }
            g.add(hub); g.userData.prop = hub;
        }
        this.group.add(g);
        return g;
    },
    show(key, name, seen) {
        if (!EnvModels.has(name)) return null;
        let d = this.list.get(key);
        if (d && d.userData.name !== name) { this.group.remove(d); d = null; }
        if (!d) { d = this.make(name); d.userData.name = name; this.list.set(key, d); }
        seen.add(key);
        d.visible = true;
        return d;
    },
    /* turned the way it's going: a model's nose is +x */
    head(d, vx, vy) { if (Math.abs(vx) + Math.abs(vy) > 1e-4) d.rotation.y = Math.atan2(-vy * R3_ZS, vx); },
    tick(r3, a) {
        this.drawn.clear();
        if (!a || a.id !== 'island' || typeof SeaSky === 'undefined') { this.group.visible = false; return; }
        this.group.visible = true;
        const v = r3.view, near = (x, y, m) => !v || (x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m * 2), t = G.t, seen = new Set();
        // Sarah's sailboat, tied up stern-to at the pier's end, bow out to sea
        const e = this.dock;
        if (e && near(e.x, e.y, 64)) {
            const d = this.show('dock', 'boat_docked', seen);
            if (d) {
                const pr = W0.pier;
                d.position.set(pr.x1 + 1 + 1.05, Math.sin(t / 55) * 0.03 - 0.02, (pr.y1 - 1.6) * R3_ZS);
                d.rotation.set(Math.sin(t / 70) * 0.03, 0, Math.sin(t / 55) * 0.015);
            }
        }
        // boats crossing the sea
        for (const b of SeaSky.boats) {
            if (!near(b.x, b.y, 96)) continue;
            const d = this.show(b, b.kind, seen);
            if (!d) continue;
            this.drawn.add(b);
            d.position.set(b.x / TILE, Math.sin(t / 40 + b.x * 0.01) * 0.04 - 0.03, b.y / TILE * R3_ZS);
            this.head(d, b.vx, b.vy);
            d.rotation.x = Math.sin(t / 47 + b.y * 0.01) * 0.04;
            d.scale.setScalar(b.kind === 'sea_ferry' ? 1 : 0.9);
        }
        // dolphins: up out of the water and back in, in an arc
        for (const q of SeaSky.dolphins) {
            if (q.t < 0) continue;
            this.drawn.add(q);
            if (q.t > 40 || !near(q.x, q.y, 64)) continue;
            const d = this.show(q, 'sea_dolphin', seen);
            if (!d) continue;
            const s = q.t / 38, dir = q.flip ? -1 : 1;
            d.position.set((q.x + dir * (q.t - 20) * 0.6) / TILE, Math.sin(Math.PI * s) * 0.85 - 0.35, q.y / TILE * R3_ZS);
            d.rotation.set(0, q.flip ? Math.PI : 0, Math.cos(Math.PI * s) * 0.9);
        }
        // planes, balloons and the gulls overhead
        for (const s of SeaSky.sky) {
            if (s.kind === 'cloud' || !near(s.x, s.y, 160)) continue;
            if (s.kind === 'plane') {
                const d = this.show(s, 'sky_plane', seen);
                if (!d) continue;
                d.position.set(s.x / TILE, this.PLANE_ALT, s.y / TILE * R3_ZS);
                d.scale.setScalar(this.PLANE_SIZE);
                this.head(d, s.vx, s.vy);
                d.rotation.x = Math.sin(s.t / 90) * 0.08;
                if (d.userData.prop) d.userData.prop.rotation.x = t * 0.9;
            } else {
                const d = this.show(s, 'sky_balloon', seen);
                if (!d) continue;
                d.position.set(s.x / TILE, this.BALLOON_ALT + Math.sin(s.t / 50) * 0.12, s.y / TILE * R3_ZS);
                d.scale.setScalar(this.BALLOON_SIZE);
                d.rotation.y = s.t / 900;
            }
        }
        const f = SeaSky.flock;
        if (f && EnvModels.has('critter_gull')) for (let i = 0; i < f.n; i++) {
            const ang = f.t / (80 + i * 9) + i * 2.1, x = f.cx + Math.cos(ang) * (34 + i * 9), y = f.cy + Math.sin(ang) * (12 + i * 3);
            const key = 'gull' + i;
            let d = this.list.get(key);
            if (!d) { d = EnvCritters.make('critter_gull'); this.group.add(d.root); d.userData = { name: 'critter_gull' }; d.visible = true; this.list.set(key, d); }
            seen.add(key);
            d.root.visible = true;
            d.root.position.set(x / TILE, this.GULL_ALT + Math.sin(f.t / 40 + i) * 0.15, y / TILE * R3_ZS);
            // (flying round the circle: facing along it)
            d.root.rotation.y = Math.atan2(Math.cos(ang) * (12 + i * 3) * R3_ZS, Math.sin(ang) * (34 + i * 9)) + Math.PI / 2;
            d.body.rotation.x = -0.15;
            for (const w of d.wings) w.rotation.z = w.userData.side * Math.sin((f.t + i * 7) * 0.25) * 0.85;
        }
        for (const [k, d] of this.list) {
            if (seen.has(k)) continue;
            const o = d.root || d;
            if (o.parent) o.parent.remove(o);
            this.list.delete(k);
        }
    },
};
