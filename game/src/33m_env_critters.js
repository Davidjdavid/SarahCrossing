/* ---- 33m_env_critters.js ---- */
/* The island's wildlife in the new look: each critter (6k_wildlife.js) and each butterfly round the flowers (Flutter)
   is a little toy from tools/blender/critters.py instead of its picture. Birds peck and fold their wings, then flap off
   when Sarah comes too near; rabbits and frogs hop, ducks bob on the water, the owl blinks, butterflies flutter and
   rest with their wings closed. It all follows the game's own critters: where they are, which way they face, how high
   they fly, fading as they burrow. */
const EnvCritters = {
    SCALE: 1.5,         // bigger than life, as the pictures were (the deer less so)
    list: new Map(), drawn: new Set(),
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        for (const d of this.list.values()) this.drop(d);
        this.list = new Map();
        this.drawn = new Set();
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* (the HD-2D view asks: is this one a toy? then it draws no card; Flutter makes its butterflies afresh each frame) */
    draws(e) { return Env.on && (e.kind === 'bug' ? !!this.bugs : this.drawn.has(e)); },
    name(c) {
        if (c.kind === 'bird') return 'critter_' + c.sub;
        if (c.kind === 'butterfly') return 'critter_butterfly' + (c.sub || 0);
        return 'critter_' + c.kind;
    },
    make(name) {
        const M = EnvModels.models[name], pre = name.replace(/^critter_/, '') + '_';
        const d = { root: new THREE.Group(), body: new THREE.Group(), wings: [], eyes: [] };
        d.root.add(d.body);
        for (const p of M.parts) {
            const key = p.node.startsWith(pre) ? p.node.slice(pre.length) : p.node;
            const kind = /^wing_/.test(key) ? 'wings' : /^eye_/.test(key) ? 'eyes' : null;
            let geo = p.geometry;
            if (kind) { p.local = p.local || p.geometry.clone().translate(-p.at.x, -p.at.y, -p.at.z); geo = p.local; }
            const mesh = new THREE.Mesh(geo, p.material);
            mesh.castShadow = true; mesh.receiveShadow = true;
            mesh.userData.shared = true;
            if (!kind) { d.body.add(mesh); continue; }
            const g = new THREE.Group();
            g.position.copy(p.at);
            g.add(mesh);
            g.userData.side = /_l$/.test(key) ? -1 : 1;
            d.body.add(g);
            d[kind].push(g);
        }
        d.root.scale.setScalar(this.SCALE);
        this.group.add(d.root);
        return d;
    },
    drop(d) { if (d.root.parent) d.root.parent.remove(d.root); },
    tick(r3, a) {
        this.drawn.clear();
        const v = r3.view, near = (x, y) => !v || (x > v.x0 - 48 && x < v.x1 + 48 && y > v.y0 - 48 && y < v.y1 + 96), t = G.t;
        const seen = new Set();
        const show = (key, name, at) => {
            if (!EnvModels.has(name)) return null;
            let d = this.list.get(key);
            if (d && d.name !== name) { this.drop(d); d = null; }
            if (!d) { d = this.make(name); d.name = name; this.list.set(key, d); }
            seen.add(key);
            d.root.visible = true;
            d.root.position.set(at[0], at[1], at[2]);
            return d;
        };
        for (const c of Critters.list) {
            if (!near(c.x, c.y)) continue;
            const def = CRITTER[c.kind], name = this.name(c);
            const water = c.kind === 'duck' ? Env.waterH(c.x, c.y) : null;
            const gy = water != null ? water : Env.groundH(c.x, c.y);
            const d = show(c, name, [c.x / TILE, gy + (c.alt || 0) / TILE + (water != null ? Math.sin(t / 30 + c.home[0]) * 0.01 : 0), c.y / TILE * R3_ZS]);
            if (!d) continue;
            this.drawn.add(c);
            // facing: left or right as the picture does, turned a little toward us
            const run = c.state !== 'idle', flying = def.fly && (run || c.alt > 1);
            let ang = c.flip ? -Math.PI / 2 + 0.45 : Math.PI / 2 - 0.45;
            if (c.kind === 'crab') ang = 0;                                         // (crabs scuttle sideways)
            d.root.rotation.y = ang;
            d.root.scale.setScalar(this.SCALE * (c.kind === 'deer' ? 0.8 : 1) * Math.max(0.05, Math.min(1, c.fade == null ? 1 : c.fade)));
            // pecking, bobbing as it runs, hopping (the game gives the hop's height)
            const peck = !run && (c.kind === 'bird') && Math.floor(c.t / 26) % 2 === 1;
            d.body.rotation.x = peck ? 0.55 : flying ? -0.15 : 0;
            d.body.position.y = run && !def.fly && c.kind !== 'rabbit' && c.kind !== 'frog' && c.kind !== 'duck' ? Math.abs(Math.sin(c.t / 3)) * 0.04 : 0;
            if (c.kind === 'butterfly') this.flap(d, true, c.t);
            else for (const w of d.wings) w.rotation.z = w.userData.side * (flying ? Math.sin(c.t * 0.9) * 0.85 : -1.25);
            const blink = c.kind === 'owl' ? !run && Math.floor(c.t / 26) % 4 === 3 : hdBlinkNow(hdSeed(String(c.home && c.home[0])));
            for (const e of d.eyes) e.scale.y = blink ? 0.1 : 1;
        }
        // the butterflies round the flowers
        this.bugs = Flutter.bugs.length ? Flutter.bugs : null;
        for (const b of Flutter.bugs) {
            const fy = b.home ? b.home.y : b.sy - 2;
            if (!near(b.x, fy)) continue;
            const gy = Env.groundH(b.x, fy);
            const d = show(b, 'critter_butterfly' + (b.sub || 0), [b.x / TILE, gy + Math.max(0.1, (fy - b.y) / TILE), fy / TILE * R3_ZS]);
            if (!d) continue;
            if (Math.abs(b.vx) > 0.05) d.ang = b.vx < 0 ? -Math.PI / 2 + 0.5 : Math.PI / 2 - 0.5;
            d.root.rotation.y = d.ang || 0;
            this.flap(d, b.rest <= 0, b.t);
        }
        for (const [k, d] of this.list) if (!seen.has(k)) { this.drop(d); this.list.delete(k); }
    },
    /* a butterfly's wings: beating while it flies, closed up together while it rests */
    flap(d, flying, t) {
        for (const w of d.wings) w.rotation.z = w.userData.side * (flying ? 0.2 + 1.0 * (0.5 + 0.5 * Math.sin(t * 0.8)) : 1.35);
    },
};
