/* ---- 33p_env_items.js ---- */
/* Things lying on the island in the new look, as little models instead of their pictures standing up: shells and gems
   (tools/blender/small_things.py), everything else Sarah can carry (pocket_things.py), each item_<its picture>; fruit
   (the trees' own fruit models, fruit_<id>); each lying at its own slight turn, popping up a little when it's just been
   dropped. What has no model of its own gets a stand-in for its kind, as Animal Crossing has them: a leaf for furniture,
   wallpaper, floors and accessories, a folded shirt in the outfit's colors, a fish in the fish's color, a seed packet,
   a sack, a covered dish.
   And the island's little signs of something buried: bubbles rising out of a clam's spot in the sand, a star twinkling
   over a glint in the grass. */
const EnvItems = {
    FRUIT: new Set(['apple', 'cherry', 'orange', 'pear', 'peach', 'mango', 'lychee', 'coconut']),
    /* a stand-in fish painted in its fish's color */
    FISH: { mackerel: '#4a7aa8', seabream: '#e8908a', seabass: '#8a98a8', yellowtail: '#d8c050', tuna: '#3a5a8a', salmon: '#e8907a',
        pufferfish: '#d8c890', moonfish: '#c8d0e8', sunrise: '#f0a050', trout: '#8aa878', ayu: '#a8b098', catfish: '#7a6a5a', eel: '#5a6a4a',
        koi: '#f08040', goldfish: '#f0a020', squid: '#f0d8d0', octopus: '#e07a6a', shrimp: '#f0a088', crawfish: '#c84a3a', lobster: '#d8402a' },
    /* (how big each lies, against the shells': the big ones a little smaller) */
    SIZE: { item_lobster: 1.1, item_fish: 1.3, item_squid: 1.3, item_fish_boot: 1.25, item_dish: 1.3, item_ic_wood: 1.35, item_ui_present: 1.35, item_ic_package: 1.35 },
    list: new Map(), drawn: new Set(), tints: new Map(),
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        this.list = new Map();
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* the model for an item: by its picture's name (shell_scallop, gem_ruby, a money bag's: item_<picture>), fruit by the
       trees', or a stand-in for its kind */
    model(id, frame) {
        if (typeof EnvModels === 'undefined' || !id) return null;
        if (this.FRUIT.has(id)) return EnvModels.has('fruit_' + id) ? 'fruit_' + id : null;
        const has = n => EnvModels.has(n) ? n : null, it = ITEMS[id];
        const icon = frame === 'money_bag_s' ? 'money_bag' : frame || (typeof itemIcon === 'function' ? itemIcon(id) : id);
        const own = has('item_' + icon) || has('item_' + id);
        if (own || !it) return own || has('item_leaf');
        switch (it.type) {
            case 'fish': return has(/^(squid|octopus)$/.test(id) ? 'item_squid' : /^(shrimp|crawfish|lobster)$/.test(id) ? 'item_lobster'
                : id === 'boot' ? 'item_fish_boot' : id === 'clam_live' ? 'item_shell_clam' : 'item_fish');
            case 'outfit': return has('item_shirt');
            case 'seed': return has('item_seedbag');
            case 'staple': return has('item_sack');
            case 'dish': case 'snack': return has('item_dish');
            case 'flower': return has('flowers_' + id.split('_')[1]);
            default: return has('item_leaf');
        }
    },
    /* a stand-in's colors: the outfit's own, or the fish's */
    tint(id) {
        const it = ITEMS[id];
        if (!it) return null;
        if (it.type === 'outfit' && typeof hdOutfit === 'function') { const o = hdOutfit(it.wear); return { top: o.top, trim: o.trim }; }
        const c = it.type === 'fish' && this.FISH[id];
        return c ? { top: c, trim: c } : null;
    },
    // (a wild flower's item is the flower model EnvBuild already shows)
    takes(e) { return (e.kind === 'item' && !e.wildFlower && !!this.model(e.id, e.frame)) || (e.kind === 'vbball' && EnvModels.has('item_vbball')); },
    /* what's growing in a garden plot, as a model: the seeds' mound, a sprout, then the flower or the vegetable */
    plant(e) {
        if (typeof EnvModels === 'undefined' || !EnvModels.ready || typeof S === 'undefined') return null;
        const pl = S.plots && S.plots[e.idx], st = plotStage(pl);
        if (!st) return null;
        if (st === 1) return EnvModels.has('plot_seed') ? 'plot_seed' : null;
        if (st === 2) return EnvModels.has('plot_sprout') ? 'plot_sprout' : null;
        const n = pl.seed.startsWith('flower_') ? 'flowers_' + pl.seed.split('_')[1] : 'veg_' + pl.seed;
        return EnvModels.has(n) ? n : null;
    },
    make(name, tint) {
        const M = EnvModels.models[name], g = new THREE.Group();
        for (const p of M.parts) {
            // (a part shaded in greys for painting: *_top, *_trim)
            let m = p.material;
            const role = tint && /_(top|trim)$/.exec(m.name || '');
            if (role && tint[role[1]]) {
                const k = m.uuid + tint[role[1]];
                if (!this.tints.has(k)) this.tints.set(k, EnvModels.tinted(m, tint[role[1]]));
                m = this.tints.get(k);
            }
            const mesh = new THREE.Mesh(p.geometry, m);
            mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.shared = true;
            g.add(mesh);
        }
        this.group.add(g);
        return g;
    },
    tick(r3, a) {
        if (!a || a.interior) { this.group.visible = false; return; }
        this.group.visible = true;
        const v = r3.view, seen = new Set();
        for (const e of a.ents) {
            if (e.kind !== 'item' || e.hidden || e.wildFlower) continue;
            if (v && (e.x < v.x0 - 48 || e.x > v.x1 + 48 || e.y < v.y0 - 48 || e.y > v.y1 + 96)) continue;
            const name = this.model(e.id, e.frame);
            if (!name) continue;
            let d = this.list.get(e);
            if (d && d.userData.name !== name) { this.group.remove(d); d = null; }
            if (!d) {
                d = this.make(name, this.tint(e.id)); d.userData.name = name;
                // (each lies at its own turn; fruit is bigger, as on the trees; a little bag of sand dollars small)
                const r = mulberry(hash32('it' + Math.round(e.x) + ',' + Math.round(e.y)));
                d.rotation.y = r() * Math.PI * 2;
                d.scale.setScalar(this.FRUIT.has(e.id) ? 1.6 : e.frame === 'money_bag_s' ? 0.95 : /^flowers_/.test(name) ? 0.55 : this.SIZE[name] || 1.55);
                this.list.set(e, d);
            }
            seen.add(e);
            const bob = e.fresh ? e.fresh * 0.4 / TILE : 0;
            d.position.set(e.x / TILE, Env.groundH(e.x, e.y - 2) + bob, (e.y - 3) / TILE * R3_ZS);
            // (something to be found, an egg or a lost thing, twinkles now and then as its picture did)
            if (e.twinkle) {
                let sp = d.userData.spark;
                if (!sp) { sp = d.userData.spark = this.sparkle(); sp.scale.setScalar(0.5 / d.scale.x); d.add(sp); }
                const k = (G.t + e.x) % 90;
                sp.visible = k < 20;
                sp.position.set(0.12 / d.scale.x, (0.3 + k * 0.004) / d.scale.x, 0);
                sp.rotation.y = -d.rotation.y + k / 10;
            }
        }
        // the garden plots' plants, and the volleyball (bouncing when it's been hit, as its picture did)
        for (const e of a.ents) {
            if (e.kind !== 'plot' && e.kind !== 'vbball') continue;
            if (v && (e.x < v.x0 - 48 || e.x > v.x1 + 48 || e.y < v.y0 - 48 || e.y > v.y1 + 96)) continue;
            const name = e.kind === 'plot' ? this.plant(e) : 'item_vbball';
            if (!name || !EnvModels.has(name)) continue;
            let d = this.list.get(e);
            if (d && d.userData.name !== name) { this.group.remove(d); d = null; }
            if (!d) {
                d = this.make(name); d.userData.name = name;
                d.rotation.y = e.kind === 'plot' ? (e.idx * 1.7) % 6.28 : 0;
                d.scale.setScalar(e.kind === 'plot' ? (/^flowers_/.test(name) ? 0.8 : 1.4) : 1.3);
                this.list.set(e, d);
            }
            seen.add(e);
            if (e.kind === 'plot') { const f = Env.tileSpot(e); d.position.set(f.x, f.y, f.z); }
            else {
                const b = e.bounce > 0 ? Math.abs(Math.sin(e.bounce-- / 5)) * 8 * (e.bounce / 30) : 0;
                d.position.set(e.x / TILE, Env.groundH(e.x, e.y - 2) + b / TILE * R3_VS, (e.y - 2) / TILE * R3_ZS);
                d.rotation.x = b * 0.2;
            }
        }
        // clam spots and glints (drawn flat into the ground too; these are what moves)
        const t = G.t;
        for (const e of a.ents) {
            if ((e.kind !== 'clamspot' && e.kind !== 'glow') || e.hidden) continue;
            if (v && (e.x < v.x0 - 32 || e.x > v.x1 + 32 || e.y < v.y0 - 32 || e.y > v.y1 + 64)) continue;
            let d = this.list.get(e);
            if (!d) { d = e.kind === 'clamspot' ? this.bubbles() : this.sparkle(); this.group.add(d); this.list.set(e, d); }
            seen.add(e);
            const gy = Env.groundH(e.x, e.y);
            d.position.set(e.x / TILE, gy, (e.y + 1) / TILE * R3_ZS);
            if (e.kind === 'clamspot') {
                // (a bubble or two now and then, as the picture has them: each rises, swells a little and pops)
                const ph = (t + (e.clamIdx || 0) * 23) % 90;
                d.children.forEach((b, k) => {
                    const q = ph - k * 9;
                    b.visible = q >= 0 && q < 26;
                    if (b.visible) { b.position.set((k ? 0.05 : -0.03), 0.02 + q * 0.007, k * 0.03); b.scale.setScalar(0.6 + q / 40); }
                });
            } else {
                const k = (Math.sin(t / 12) + 1) / 2, on = (t >> 4) % 3 === 0;
                d.position.y = gy + 0.12;
                d.scale.setScalar(on ? 0.6 + 0.6 * k : 0.25 + 0.2 * k);
                d.rotation.y = t / 30;
            }
        }
        for (const [e, d] of this.list) if (!seen.has(e)) { this.group.remove(d); this.list.delete(e); }
    },
    bubbles() {
        const g = new THREE.Group(), m = this.bubbleMat || (this.bubbleMat = r3Patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.85 }), { key: 'envbubble', noDof: true }));
        const geo = this.bubbleGeo || (this.bubbleGeo = new THREE.SphereGeometry(0.035, 8, 6));
        for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(geo, m); b.userData.shared = true; g.add(b); }
        return g;
    },
    sparkle() {
        // (two thin crossed points of light, drawn unlit so they shine)
        const g = new THREE.Group(), m = this.sparkMat || (this.sparkMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xfff0a0 }), { key: 'envspark' }));
        const geo = this.sparkGeo || (this.sparkGeo = new THREE.OctahedronGeometry(0.1, 0));
        for (const [sx, sy, sz] of [[0.25, 1.6, 0.25], [1.6, 0.25, 0.25]]) { const s = new THREE.Mesh(geo, m); s.scale.set(sx, sy, sz); s.userData.shared = true; g.add(s); }
        return g;
    },
};
