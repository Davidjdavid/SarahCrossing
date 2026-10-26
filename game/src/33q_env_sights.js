/* ---- 33q_env_sights.js ---- */
/* Things Sarah happens to see at certain times in the new look, never announced (no popups, nothing to collect):
   - a ring of glowing toadstools in the clearing by the old tree, on autumn nights and the night of a rainy day;
   - a rainbow over the falls the morning after a rainy day, when the sun's out;
   - the northern lights low over the north horizon on some clear winter nights (in the sky's own shader: r3Sky);
   - on some summer dawns, sea turtle hatchlings scrambling down the far beach into the sea.
   (The owl at night and the deer are the wildlife's: 6k_wildlife.js.) */
const EnvSights = {
    TURTLE: 2.6,        // how big a hatchling stands (bigger than life, or nobody would see them)
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        this.ring = this.bow = null; this.turtles = [];
        const none = { meshes: [], tick: () => {} };
        if (!a || a.id !== 'island' || LAB || typeof EnvModels === 'undefined') return none;
        this.makeRing(a);
        this.makeBow();
        this.makeTurtles();
        return { meshes: [], tick: (r3, ar) => this.tick(r3, ar) };
    },
    /* 0 by day, 1 through the night (21:00 to 4:00), easing in and out */
    nightK(h) { return h >= 12 ? clamp((h - 20.5) / 0.6, 0, 1) : clamp((4.8 - h) / 0.6, 0, 1); },
    /* (some nights or mornings and not others, the same all day: a sight is a bit of luck) */
    lucky(what, n) { return hash32((S.seed || '') + ':' + what + ':' + Clock.dayNum()) % n === 0; },

    /* ------------------------------------------------ the toadstool ring */
    ringSpot(a) {
        const sp = W0.spots.oldtree;
        if (!sp) return null;
        const ok = (x, y) => W0.grid[y] && W0.grid[y][x] === 'g' && !a.blockedAt(x, y);
        // (the nearest open grass three tiles across, a little north of the tree, with nothing tall on the camera's side of
        // it for a few tiles, where a tree would hide it)
        for (let r = 1; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = sp.x + dx, y = sp.y - 4 + dy;
            let free = true;
            for (let j = -1; j <= 1 && free; j++) for (let i = -1; i <= 1; i++) if (!ok(x + i, y + j)) { free = false; break; }
            for (let j = 2; j <= 5 && free; j++) for (let i = -2; i <= 2; i++) if (a.blockedAt(x + i, y + j)) { free = false; break; }
            if (free) return [x, y];
        }
        return null;
    },
    makeRing(a) {
        const spot = EnvModels.has('fairy_mushroom') && this.ringSpot(a);
        if (!spot) return;
        const [tx, ty] = spot, cx = tx + 0.5, cv = ty + 0.5, R = mulberry(hash32('ring' + tx + ',' + ty));
        const g = new THREE.Group(), y0 = EnvGround.heightAt(cx, cv);
        g.position.set(cx, y0, cv * R3_ZS);
        for (let i = 0; i < 11; i++) {
            const an = i / 11 * Math.PI * 2 + R() * 0.3, rr = 0.9 + R() * 0.22, s = (0.75 + R() * 0.6) * 2.4;
            const u = Math.cos(an) * rr, v = Math.sin(an) * rr;
            for (const m of EnvModels.place(g, 'fairy_mushroom', EnvModels.mat4(u, EnvGround.heightAt(cx + u, cv + v) - y0, v * R3_ZS, R() * 6.28, s))) { m.userData.shared = true; m.castShadow = false; }
        }
        // little lights drifting up from the ring
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xbffff0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), { key: 'envsightmote' });
        const geo = new THREE.IcosahedronGeometry(0.03, 0), motes = [];
        for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(geo, mat); m.userData.seed = R() * 100; g.add(m); motes.push(m); }
        // and their aqua light on the grass round them
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const cg = c.getContext('2d'), grd = cg.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(140,255,235,0.9)'); grd.addColorStop(0.5, 'rgba(90,230,225,0.45)'); grd.addColorStop(1, 'rgba(60,200,220,0)');
        cg.fillStyle = grd; cg.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c); Env.built.textures.push(tex);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4 * R3_ZS), r3Patch(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), { key: 'envsightpool' }));
        pool.rotation.x = -Math.PI / 2; pool.position.y = 0.04; pool.renderOrder = 1;
        g.add(pool);
        g.visible = false;
        this.group.add(g);
        this.ring = { g, motes, mat, pool, glow: (EnvModels.models.fairy_mushroom.parts.find(p => /glow/.test(p.material.name || '')) || {}).material };
    },
    ringTick(h, t) {
        const R = this.ring;
        // (autumn is the toadstools' season; otherwise they come up the night of a rainy day)
        const on = Clock.season() === 'fall' || G.weather === 'rain';
        const k = on ? this.nightK(h) : 0;
        R.g.visible = k > 0.01;
        if (!R.g.visible) return;
        R.g.scale.set(1, Math.max(0.01, k), 1);
        if (R.glow) R.glow.color.setScalar(0.8 + 0.2 * Math.sin(t / 50));
        R.motes.forEach((m, i) => {
            const s = m.userData.seed, life = ((t / 260 + s) % 1);
            const an = s * 5 + t / 400;
            m.position.set(Math.cos(an) * (0.3 + 0.9 * (s % 1)), 0.1 + life * 1.3, Math.sin(an) * (0.3 + 0.9 * (s % 1)) * R3_ZS);
            m.scale.setScalar(0.6 + 0.6 * Math.sin(life * Math.PI));
        });
        R.mat.opacity = 0.85 * k;
        R.pool.material.opacity = k * (0.85 + 0.15 * Math.sin(t / 50));
    },

    /* ------------------------------------------------ the rainbow over the falls */
    makeBow() {
        const sp = W0.spots.waterfall, wfs = W0.waterfalls || [];
        if (!sp || !wfs.length) return;
        const mid = wf => [wf.tiles.reduce((s, t) => s + t[0], 0) / wf.tiles.length + 0.5, Math.min(...wf.tiles.map(t => t[1]))];
        const wf = wfs.slice().sort((p, q) => { const [px, py] = mid(p), [qx, qy] = mid(q); return Math.hypot(px - sp.x, py - sp.y) - Math.hypot(qx - sp.x, qy - sp.y); })[0];
        const [mx, top] = mid(wf);
        // a band of the seven colors, see-through at both edges and fading out where its feet would touch the ground
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        const g2 = c.getContext('2d'), img = g2.createImageData(64, 64);
        const cols = [[148, 80, 220], [70, 90, 240], [60, 170, 240], [70, 210, 90], [250, 230, 60], [250, 150, 40], [240, 60, 50]];
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
            const v = y / 63, u = x / 63, f = v * (cols.length - 1), i0 = Math.floor(f), i1 = Math.min(cols.length - 1, i0 + 1), w = f - i0;
            const edge = Math.sin(Math.PI * v) ** 0.7, ends = Math.min(1, u / 0.18, (1 - u) / 0.18);
            const o = (y * 64 + x) * 4;
            for (let k = 0; k < 3; k++) img.data[o + k] = cols[i0][k] * (1 - w) + cols[i1][k] * w;
            img.data[o + 3] = 255 * edge * Math.max(0, ends);
        }
        g2.putImageData(img, 0, 0);
        const tex = new THREE.CanvasTexture(c);
        const R = 3.4, W = 0.55, seg = 48, pos = [], uv = [], idx = [];
        for (let i = 0; i <= seg; i++) {
            const an = Math.PI * i / seg;
            pos.push(Math.cos(an) * (R - W), Math.sin(an) * (R - W), 0, Math.cos(an) * R, Math.sin(an) * R, 0);
            uv.push(i / seg, 0, i / seg, 1);
        }
        for (let i = 0; i < seg; i++) { const a0 = i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0 }), { key: 'envsightbow', noDof: true });
        const m = new THREE.Mesh(geo, mat);
        // (in the mist at the falls' foot, as a waterfall's rainbow is, leaning back to face the camera)
        m.position.set(mx, EnvGround.heightAt(mx, top + 3) - 0.5, (top + 2.6) * R3_ZS);
        m.rotation.x = -ENV.cam.pitch * Math.PI / 180;
        m.renderOrder = 2; m.visible = false;
        this.group.add(m);
        Env.built.textures.push(tex);
        this.bow = { m, mat };
    },
    bowTick(h) {
        const B = this.bow;
        // the morning after a rainy day, with the sun out: from six till half past ten
        const after = todayWeather(Clock.dayNum() - 1) === 'rain' && G.weather === 'sunny';
        const k = after ? clamp((h - 6) / 0.6, 0, 1) * clamp((10.5 - h) / 0.7, 0, 1) : 0;
        B.m.visible = k > 0.01;
        B.mat.opacity = 0.5 * k;
    },

    /* ------------------------------------------------ the northern lights */
    auroraTick(h) {
        const u = typeof R3 !== 'undefined' && R3.sky && R3.sky.material.uniforms.uAur;
        if (!u) return;
        const m = Clock.month(), winter = m === 12 || m <= 2;
        // (some clear winter nights, one in three)
        const on = winter && G.weather === 'sunny' && this.lucky('aurora', 3);
        u.value = on ? this.nightK(h) * (0.85 + 0.15 * Math.sin(G.t / 90)) : 0;
    },

    /* ------------------------------------------------ the hatchlings on the far beach */
    makeTurtles() {
        const sp = W0.spots.beach_far;
        if (!sp || !EnvModels.has('critter_turtle')) return;
        // (down the beach to where the sea starts)
        let sea = sp.y;
        while (sea < W0.h - 1 && !(W0.water[sea] && W0.water[sea][sp.x] === 's')) sea++;
        this.nest = { x: sp.x + 0.5, y: sp.y + 0.5, sea };
        const R = mulberry(hash32('turtles'));
        for (let i = 0; i < 7; i++) this.turtles.push({ d: null, phase: 'wait', wait: Math.floor(R() * 900), x: 0, y: 0, s: R() * 10, sp: 0.005 + R() * 0.003 });
    },
    turtle() {
        const M = EnvModels.models.critter_turtle, d = { root: new THREE.Group(), fins: [], eyes: [] };
        for (const p of M.parts) {
            const key = p.node.replace(/^turtle_/, ''), kind = /^fin_/.test(key) ? 'fins' : /^eye_/.test(key) ? 'eyes' : null;
            let geo = p.geometry;
            if (kind) { p.local = p.local || p.geometry.clone().translate(-p.at.x, -p.at.y, -p.at.z); geo = p.local; }
            const mesh = new THREE.Mesh(geo, p.material);
            mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.shared = true;
            if (!kind) { d.root.add(mesh); continue; }
            const g = new THREE.Group();
            g.position.copy(p.at); g.add(mesh);
            g.userData.side = /l$/.test(key) ? -1 : 1; g.userData.front = /^fin_f/.test(key);
            d.root.add(g); d[kind].push(g);
        }
        d.root.scale.setScalar(this.TURTLE);
        this.group.add(d.root);
        return d;
    },
    turtleTick(h, t, near) {
        const N = this.nest, m = Clock.month();
        // some summer dawns (every other one, dry): from five till half past seven
        const dawn = m >= 6 && m <= 8 && h >= 5 && h < 7.5 && G.weather !== 'rain' && this.lucky('turtles', 2);
        const show = near(N.x * TILE, (N.y + 3) * TILE);
        for (const q of this.turtles) {
            if (q.phase === 'wait') {
                if (q.d) q.d.root.visible = false;
                if (!dawn || --q.wait > 0) continue;
                // out of the nest: a little scatter, then down to the water
                q.phase = 'crawl'; q.x = N.x + (Math.sin(q.s * 7) * 0.35); q.y = N.y + Math.cos(q.s * 5) * 0.2; q.t = 0;
            }
            q.t++;
            const lurch = 0.55 + 0.45 * Math.abs(Math.sin(q.t * 0.16 + q.s));
            q.y += q.sp * lurch * (q.phase === 'swim' ? 1.6 : 1);
            q.x += Math.sin(q.t * 0.03 + q.s) * 0.0025;
            if (q.phase === 'crawl' && q.y > N.sea - 0.2) q.phase = 'swim';
            if (q.phase === 'swim' && q.y > N.sea + 1.4) { q.phase = 'wait'; q.wait = 200 + Math.floor(Math.random() * 500); continue; }
            if (!show) { if (q.d) q.d.root.visible = false; continue; }
            if (!q.d) q.d = this.turtle();
            const d = q.d, ground = EnvGround.heightAt(q.x, q.y), sink = q.phase === 'swim' ? clamp((q.y - N.sea) / 1.2, 0, 1) : 0;
            d.root.visible = true;
            d.root.position.set(q.x, (q.phase === 'swim' ? Math.max(-0.02, ground) : ground) - sink * 0.2, q.y * R3_ZS);
            d.root.rotation.y = Math.sin(q.t * 0.16 + q.s) * 0.18;
            const row = q.t * 0.16 + q.s;
            for (const f of d.fins) f.rotation.y = f.userData.side * (f.userData.front ? Math.sin(row) * 0.7 : Math.sin(row + Math.PI) * 0.4);
            for (const e of d.eyes) e.scale.y = (q.t + Math.floor(q.s * 40)) % 190 < 6 ? 0.15 : 1;
        }
    },

    tick(r3, a) {
        if (!a || a.id !== 'island') { this.group.visible = false; return; }
        this.group.visible = true;
        const h = Clock.hourF(), t = G.t, v = r3.view;
        const near = (x, y) => !v || (x > v.x0 - 160 && x < v.x1 + 160 && y > v.y0 - 160 && y < v.y1 + 240);
        if (this.ring) this.ringTick(h, t);
        if (this.bow) this.bowTick(h);
        if (this.nest) this.turtleTick(h, t, near);
        this.auroraTick(h);
    },
};
