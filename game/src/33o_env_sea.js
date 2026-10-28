/* ---- 33o_env_sea.js ---- */
/* What sails, swims and flies round the island in the new look, as dollhouse toys from tools/blender/small_things.py
   instead of their pictures: Sarah's sailboat tied up at the pier (bobbing), the boats crossing the sea (SeaSky.boats:
   sailboats, a fishing boat, the ferry, each turned the way it's going, rocking a little), dolphins leaping in an arc,
   and up in the sky the planes and hot air balloons (SeaSky.sky: far off in the strip of sky over the island's far edge,
   not over the island), and the gulls wheeling over the beach (the critters' gull, flapping). It all follows SeaSky's own
   things: where they are, where they're going. */
const EnvSea = {
    GULL_ALT: 2.6,                                         // how high the gulls go (world units over the sea)
    // how tall each looks in the sky, as a share of the screen's height: at most that, and never more than part of the
    // strip of sky it's in
    SKY_SIZE: { sky_jet: 0.05, sky_plane: 0.045, sky_balloon: 0.085 },
    list: new Map(), drawn: new Set(), skyShown: new Set(),
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
    takes(e) { return e.kind === 'sailboat' && typeof EnvModels !== 'undefined' && EnvModels.has('boat_home'); },
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
    /* something up in the sky (David, 27 October: a real plane in the distance, not a toy over the island; 29 October: the
       balloons looked like toys too, "can planes and hot air balloons fly only in the sky?"): far off, just where the haze
       starts, in the strip of sky over the island's far edge (uSkyEdge), crossing the screen as it crosses its path, at a
       height of its own in the strip, steadily however Sarah walks. Whatever stands in front of it (a tree, a roof) hides
       it, and none of it falls on the ground. With no sky in view (looking down from close up) it isn't there */
    skyPlace(r3, d, s, name) {
        const c = r3.camera, life = Math.max(1, s.life - 20), f = Math.min(1, s.t / life);
        if (s.sy == null) s.sy = (Math.abs(s.y) * 0.37) % 1;
        const sx = s.flip ? 1.12 - 1.24 * f : -0.12 + 1.24 * f, D = r3.scene.fog.near * 0.95, e = R3U.uSkyEdge.value;
        // (the strip of sky on the screen: from where the far edge is seen up to the top)
        const lo = new THREE.Vector3(0, e, -Math.sqrt(Math.max(0, 1 - e * e))).multiplyScalar(D).add(c.position).project(c).y, span = 1 - lo;
        if (span < 0.07) { d.visible = false; return false; }
        const hgt = Math.min(this.SKY_SIZE[name] * 2, span * 0.45), y = lo + hgt * 0.6 + (span - hgt * 1.2) * (0.25 + 0.5 * s.sy);
        const P = new THREE.Vector3(sx * 2 - 1, y, 0.5).unproject(c).sub(c.position).normalize().multiplyScalar(D).add(c.position);
        // (the world bends away towards the horizon, and this with it: raised by as much, it stays where it's put)
        const bd = Math.max(0, R3U.uBendZ.value - P.z);
        P.y += R3U.uBendK.value * bd * bd;
        d.position.copy(P);
        // (as tall on the screen as asked: the model's own height, once, against the screen's height at that distance)
        if (d.userData.h == null) { d.scale.setScalar(1); d.rotation.set(0, 0, 0); d.updateMatrixWorld(true); d.userData.h = Math.max(0.05, new THREE.Box3().setFromObject(d).getSize(new THREE.Vector3()).y); }
        d.scale.setScalar(hgt / 2 * 2 * Math.tan(c.fov * Math.PI / 360) * D / d.userData.h);
        if (!d.userData.sky) { d.userData.sky = true; d.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; if (!m.material.transparent) m.material = this.skyMat(m.material); } }); }
        this.skyShown.add(s);
        return true;
    },
    /* a sky thing's own copy of a model's material: only a touch soft, not blurred to a smudge as the depth of field
       blurs everything that far off */
    skyMat(m) {
        const M = this._skyMats || (this._skyMats = new Map());
        if (!M.has(m)) M.set(m, r3Patch(new THREE.MeshStandardMaterial({ map: m.map || null, color: m.color ? m.color.clone() : 0xffffff, vertexColors: !!m.vertexColors, roughness: m.roughness != null ? m.roughness : 0.9, metalness: 0 }), { key: 'envsky' + (m.map ? 'm' : '') + (m.vertexColors ? 'v' : ''), dofFixed: 0.12 }));
        return M.get(m);
    },
    /* the passenger jet's two contrails, fading out behind it */
    trails(d) {
        if (d.userData.trail) return;
        d.userData.trail = true;
        const cv = document.createElement('canvas'); cv.width = 64; cv.height = 4;
        const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0);
        gr.addColorStop(0, '#000'); gr.addColorStop(0.7, '#555'); gr.addColorStop(1, '#ddd');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 4);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, alphaMap: new THREE.CanvasTexture(cv), depthWrite: false }), { key: 'contrail', noDof: true });
        for (const z of [-0.3, 0.3]) {
            const t = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.07), mat);
            t.rotation.x = -Math.PI / 2;
            t.position.set(-0.1 - 2.5, -0.08, z);
            t.userData.shared = false; t.renderOrder = 11;
            d.add(t);
        }
    },
    /* turned the way it's going: a model's nose is +x */
    head(d, vx, vy) { if (Math.abs(vx) + Math.abs(vy) > 1e-4) d.rotation.y = Math.atan2(-vy * R3_ZS, vx); },
    tick(r3, a) {
        this.drawn.clear(); this.skyShown.clear();
        if (!a || a.id !== 'island' || typeof SeaSky === 'undefined') { this.group.visible = false; return; }
        this.group.visible = true;
        const v = r3.view, near = (x, y, m) => !v || (x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m * 2), t = G.t, seen = new Set();
        // the boat Sarah came on, as big as a building, tied up stern-to at the pier's end (its fenders against the
        // pier), bow out to sea, sitting in the water to a third of its hull's height
        const e = this.dock;
        if (e && near(e.x, e.y, 160)) {
            const d = this.show('dock', 'boat_home', seen);
            if (d) {
                const pr = W0.pier, x = pr.x1 + 1 + 2.9, y = pr.y1 - 1.6, w = Env.waterH(x * TILE, y * TILE);
                d.position.set(x, (w != null ? w : 0) - 0.34 + Math.sin(t / 70) * 0.025, y * R3_ZS);
                d.rotation.set(Math.sin(t / 90) * 0.018, 0, Math.sin(t / 70) * 0.008);
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
        // planes and balloons up in the sky (placed by where they are across the screen, not on the map), and the gulls
        for (const s of SeaSky.sky) {
            if (s.kind !== 'plane' && s.kind !== 'balloon') continue;
            const name = s.kind === 'balloon' ? 'sky_balloon' : EnvModels.has('sky_jet') ? 'sky_jet' : 'sky_plane', d = this.show(s, name, seen);
            if (!d || !this.skyPlace(r3, d, s, name)) continue;
            if (name === 'sky_jet') { this.trails(d); d.rotation.set(0, (s.flip ? Math.PI : 0) + 0.22, 0.05); }
            else if (name === 'sky_plane') {
                d.rotation.set(Math.sin(s.t / 90) * 0.08, s.flip ? Math.PI : 0, 0);
                if (d.userData.prop) d.userData.prop.rotation.x = t * 0.9;
            } else {
                d.position.y += Math.sin(s.t / 50) * d.scale.y * 0.05;
                d.rotation.set(0, s.t / 900, 0);
            }
        }
        const f = SeaSky.flock;
        if (f && EnvModels.has('critter_gull')) for (let i = 0; i < f.n; i++) {
            const g = SeaSky.gullAt(i), key = 'gull' + i;
            let d = this.list.get(key);
            if (!d) { d = EnvCritters.make('critter_gull'); this.group.add(d.root); d.userData = { name: 'critter_gull' }; d.visible = true; this.list.set(key, d); }
            seen.add(key);
            d.root.visible = true;
            d.root.position.set(g.x / TILE, this.GULL_ALT + Math.sin(f.t / 40 + i) * 0.15 + g.up * 0.03, g.y / TILE * R3_ZS);
            // (facing the way it goes, head first: the model looks down +z, so the angle is atan2 of the velocity's x over its z;
            // climbing as it flies off, its wings beating faster)
            d.root.rotation.y = Math.atan2(g.vx, g.vy * R3_ZS);
            d.body.rotation.x = g.up ? -0.45 : -0.15;
            for (const w of d.wings) w.rotation.z = w.userData.side * Math.sin((f.t + i * 7) * (g.up ? 0.55 : 0.25)) * 0.85;
        }
        for (const [k, d] of this.list) {
            if (seen.has(k)) continue;
            const o = d.root || d;
            if (o.parent) o.parent.remove(o);
            this.list.delete(k);
        }
    },
};
