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
    /* a flower's petals by its kind and color (flower_<kind>_<0..2>: the names in gamedata) */
    // (3 and 4 are the hybrids: 2ab_hybrids.js)
    PETALS: { daisy: ['#ffffff', '#ffd83a', '#ff9cc8', '#8cbcff', '#be8cf0'], tulip: ['#e8283c', '#ffd03a', '#ff86b4', '#ff8c32', '#5a3060'], cosmos: ['#ff7ab8', '#a86ae8', '#ff9a3a', '#e03040', '#8a4a30'], lily: ['#ffffff', '#ff9a3a', '#ff9cc8', '#e83848', '#6a3060'],
        rose: ['#e0283a', '#ffffff', '#ffd23a', '#ff8ab4', '#7a9cff'] },
    petals(id) { const m = /^flower_([a-z]+)_(\d)$/.exec(id || ''); return m && this.PETALS[m[1]] ? this.PETALS[m[1]][+m[2]] || null : null; },
    /* (how big each lies, against the shells': the big ones a little smaller) */
    SIZE: { item_lobster: 1.1, item_fish: 1.3, item_squid: 1.3, item_fish_boot: 1.25, item_dish: 1.3, item_ic_wood: 1.35, item_ui_present: 1.35, item_ic_package: 1.35 },
    /* (a dish lies as big as the covered one stood: dishes.py makes them all the same size) */
    size(n, d) { return this.SIZE[n] || (/^item_dish_/.test(n) ? this.SIZE.item_dish : d); },
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
            case 'flower': return has('flower_' + id.split('_')[1]) || has('flowers_' + id.split('_')[1]);
            default: return has('item_leaf');
        }
    },
    /* a stand-in's colors: the outfit's own, or the fish's */
    tint(id) {
        const it = ITEMS[id];
        if (!it) return null;
        if (it.type === 'outfit' && typeof hdOutfit === 'function') { const o = hdOutfit(it.wear); return { top: o.top, trim: o.trim }; }
        if (it.type === 'flower') { const p = this.petals(id); return p ? { top: p } : null; }
        const c = it.type === 'fish' && this.FISH[id];
        return c ? { top: c, trim: c } : null;
    },
    // (a wild flower's item is the flower model EnvBuild already shows)
    takes(e) { return (e.kind === 'item' && !e.wildFlower && !!this.model(e.id, e.frame)) || (e.kind === 'vbball' && EnvModels.has('item_vbball')) || (e.kind === 'gflower' && EnvModels.has('plot_sprout'))
        || (e.kind === 'stump' && EnvModels.has('furn_od_stump')); },
    /* what's growing in a garden plot, as a model: the seeds' mound, a sprout, then the flower or the vegetable */
    plant(e) {
        if (typeof EnvModels === 'undefined' || !EnvModels.ready || typeof S === 'undefined') return null;
        const pl = S.plots && S.plots[e.idx], st = plotStage(pl);
        if (!st) return null;
        if (st === 1) return EnvModels.has('plot_seed') ? 'plot_seed' : null;
        if (st === 2) return EnvModels.has('plot_sprout') ? 'plot_sprout' : null;
        const kind = pl.seed.startsWith('flower_') && pl.seed.split('_')[1];
        if (kind && EnvModels.has('flower_' + kind)) return 'flower_' + kind;
        const n = kind ? 'flowers_' + kind : 'veg_' + pl.seed;
        return EnvModels.has(n) ? n : null;
    },
    /* a flower Sarah planted in a dug hole (2a_flowers.js): a sprout the first day, then the plant in its color */
    planted(e) {
        const pl = e.pl;
        if (!pl) return null;
        if (!flowerBloomed(pl)) return EnvModels.has('plot_sprout') ? 'plot_sprout' : null;
        return EnvModels.has('flower_' + pl.kind) ? 'flower_' + pl.kind : null;
    },
    stump(e, seen) {
        if (!EnvModels.has('furn_od_stump')) return;
        let d = this.list.get(e);
        if (!d) {
            d = this.make('furn_od_stump'); d.userData.name = 'stump';
            d.rotation.y = (hash32(String(e.id)) % 628) / 100;
            // (as thick as the trunk it was: the round trees' trunks a hand above the roots, a palm's; David, 29 October)
            d.scale.setScalar(e.frame === 'stump_palm' ? 1.05 : 1.6);
            const x = (e.tx + 0.5) * TILE, y = (e.ty + 0.5) * TILE;
            d.position.set(x / TILE, Env.groundH(x, y), y / TILE * R3_ZS);
            this.list.set(e, d);
        }
        seen.add(e);
    },
    make(name, tint) {
        const M = EnvModels.models[name], g = new THREE.Group();
        for (const p of M.parts) {
            // (a part shaded in greys for painting: *_top, *_trim; never faded see-through like a tree's fruit on the tree:
            // fruit on the ground is small, and Sarah standing behind it hid it)
            let m = EnvModels.solid(p.material);
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
                d.scale.setScalar(this.FRUIT.has(e.id) ? 1.6 : e.frame === 'money_bag_s' ? 0.95 : /^flowers_/.test(name) ? 0.55 : /^flower_/.test(name) ? 0.8 : this.size(name, 1.55));
                // (a picked flower lies on its side)
                if (/^flower_/.test(name)) { d.rotation.order = 'YXZ'; d.rotation.x = 1.45; }
                this.list.set(e, d);
            }
            seen.add(e);
            // (falling out of a shaken tree, or hopping as it's set down: 23_items.js itemLift)
            const bob = itemLift(e) / TILE;
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
        // the garden plots' plants, flowers planted in the ground, the volleyball (bouncing when it's been hit, as its
        // picture did) and a felled tree's stump (the stump seat's model, a palm's smaller)
        for (const e of a.ents) {
            if (e.kind !== 'plot' && e.kind !== 'vbball' && e.kind !== 'gflower' && e.kind !== 'stump') continue;
            if (v && (e.x < v.x0 - 48 || e.x > v.x1 + 48 || e.y < v.y0 - 48 || e.y > v.y1 + 96)) continue;
            if (e.kind === 'stump') { this.stump(e, seen); continue; }
            const name = e.kind === 'plot' ? this.plant(e) : e.kind === 'gflower' ? this.planted(e) : 'item_vbball';
            if (!name || !EnvModels.has(name)) continue;
            // (a plot's flowers in one of their colors, a planted flower in its own)
            const pl = e.kind === 'plot' && S.plots[e.idx];
            const tint = /^flower_/.test(name) ? { top: e.kind === 'gflower' ? this.petals(`flower_${e.pl.kind}_${e.pl.ci}`) : this.petals(pl && pl.seed) || (this.PETALS[name.slice(7)] || [])[e.idx % 3] } : null;
            const key = name + (tint ? tint.top : '');
            let d = this.list.get(e);
            if (d && d.userData.name !== key) { this.group.remove(d); d = null; }
            if (!d) {
                d = this.make(name, tint); d.userData.name = key;
                d.rotation.y = e.kind === 'plot' ? (e.idx * 1.7) % 6.28 : e.kind === 'gflower' ? ((e.tx * 7 + e.ty * 3) % 5 - 2) * 0.2 : 0;
                d.scale.setScalar(e.kind === 'vbball' ? 1.3 : /^flowers_/.test(name) ? 0.8 : 1.4);
                this.list.set(e, d);
            }
            seen.add(e);
            // (in a plot, on the planter box's soil)
            if (e.kind === 'plot' || e.kind === 'gflower') { const f = Env.tileSpot(e); d.position.set(f.x, f.y + (e.kind === 'plot' && !e.c && EnvModels.has('planter_box') ? 0.27 : 0.03), f.z); }
            if (e.kind === 'gflower') this.wetFx(d, watered(e.pl), e.pl, () => breedPartner(e.pl));
            else {
                const b = e.bounce > 0 ? Math.abs(Math.sin(e.bounce-- / 5)) * 8 * (e.bounce / 30) : 0;
                d.position.set(e.x / TILE, Env.groundH(e.x, e.y - 2) + b / TILE * R3_VS, (e.y - 2) / TILE * R3_ZS);
                d.rotation.x = b * 0.2;
            }
        }
        // a wild flower watered today (its model is EnvBuild's, instanced): the damp soil and the glints on their own
        for (const e of a.ents) {
            if (!e.wildFlower || e.hidden || !wildWatered(e.flowerIdx)) continue;
            const f = W0.flowers[e.flowerIdx];
            if (!f || (v && (e.x < v.x0 - 48 || e.x > v.x1 + 48 || e.y < v.y0 - 48 || e.y > v.y1 + 96))) continue;
            let d = this.list.get(e);
            if (!d) { d = new THREE.Group(); const s = Env.tileSpot({ tx: f.x, ty: f.y }); d.position.set(s.x, s.y + 0.03, s.z); this.group.add(d); this.list.set(e, d); }
            seen.add(e);
            this.wetFx(d, true, f, () => false);
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
    /* a flower watered today: the soil round it dark and damp, and its glints (a burst as the water reaches it, then now and
       then; golden with a partner of its kind beside it to cross with: 2a_flowers.js). d is the flower's group, pl has x, y */
    wetFx(d, on, pl, gold) {
        let w = d.userData.wet;
        if (on && !w) {
            w = d.userData.wet = new THREE.Mesh(this.wetGeo || (this.wetGeo = new THREE.CircleGeometry(0.3, 20)), this.wetMat || (this.wetMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0x2e1e10, transparent: true, opacity: 0.38, depthWrite: false }), { key: 'envwet', noDof: true, noEdge: true })));
            w.rotation.x = -Math.PI / 2; w.position.y = 0.012 / d.scale.y; w.scale.setScalar(1 / d.scale.x); w.renderOrder = 1; w.userData.shared = true;
            d.add(w);
        }
        if (w) w.visible = on;
        const k = on ? flowerSparkle(pl) : 0;
        let sp = d.userData.spark;
        if (k && !sp) { sp = d.userData.spark = this.sparkle(); d.add(sp); }
        if (!sp) return;
        sp.visible = k > 0;
        if (!k) return;
        const g = gold();
        sp.children.forEach(c => { c.material = g ? this.goldMat() : this.sparkMat; });
        sp.position.set(0.1 / d.scale.x, 0.42 / d.scale.y, 0.05);
        sp.scale.setScalar((0.15 + 0.4 * k) / d.scale.x);
        sp.rotation.y = G.t / 20;
    },
    goldMat() { return this._gold || (this._gold = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffd04a }), { key: 'envspark' })); },
    sparkle() {
        // (two thin crossed points of light, drawn unlit so they shine)
        const g = new THREE.Group(), m = this.sparkMat || (this.sparkMat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xfff0a0 }), { key: 'envspark' }));
        const geo = this.sparkGeo || (this.sparkGeo = new THREE.OctahedronGeometry(0.1, 0));
        for (const [sx, sy, sz] of [[0.25, 1.6, 0.25], [1.6, 0.25, 0.25]]) { const s = new THREE.Mesh(geo, m); s.scale.set(sx, sy, sz); s.userData.shared = true; g.add(s); }
        return g;
    },
};
