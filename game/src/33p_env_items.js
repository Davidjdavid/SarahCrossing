/* ---- 33p_env_items.js ---- */
/* Things lying on the island in the new look, as little models instead of their pictures standing up: shells and gems
   (tools/blender/small_things.py, item_<id>), fruit (the trees' own fruit models, fruit_<id>), each lying at its own
   slight turn, popping up a little when it's just been dropped. Anything without a model of its own keeps its picture.
   And the island's little signs of something buried: bubbles rising out of a clam's spot in the sand, a star twinkling
   over a glint in the grass. */
const EnvItems = {
    FRUIT: new Set(['apple', 'cherry', 'orange', 'pear', 'peach', 'mango', 'lychee', 'coconut']),
    list: new Map(), drawn: new Set(),
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        this.list = new Map();
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* the model for an item: by its picture's name (shell_scallop, gem_ruby: item_<picture>), fruit by the trees' */
    model(id) {
        if (typeof EnvModels === 'undefined' || !id) return null;
        if (this.FRUIT.has(id)) return EnvModels.has('fruit_' + id) ? 'fruit_' + id : null;
        const icon = typeof itemIcon === 'function' ? itemIcon(id) : id;
        return EnvModels.has('item_' + icon) ? 'item_' + icon : EnvModels.has('item_' + id) ? 'item_' + id : null;
    },
    takes(e) { return e.kind === 'item' && !!this.model(e.id); },
    make(name) {
        const M = EnvModels.models[name], g = new THREE.Group();
        for (const p of M.parts) {
            const mesh = new THREE.Mesh(p.geometry, p.material);
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
            if (e.kind !== 'item' || e.hidden) continue;
            if (v && (e.x < v.x0 - 48 || e.x > v.x1 + 48 || e.y < v.y0 - 48 || e.y > v.y1 + 96)) continue;
            const name = this.model(e.id);
            if (!name) continue;
            let d = this.list.get(e);
            if (d && d.userData.name !== name) { this.group.remove(d); d = null; }
            if (!d) {
                d = this.make(name); d.userData.name = name;
                // (each lies at its own turn; fruit is bigger, as on the trees)
                const r = mulberry(hash32('it' + Math.round(e.x) + ',' + Math.round(e.y)));
                d.rotation.y = r() * Math.PI * 2;
                d.scale.setScalar(this.FRUIT.has(e.id) ? 1.6 : 1.55);
                this.list.set(e, d);
            }
            seen.add(e);
            const bob = e.fresh ? e.fresh * 0.4 / TILE : 0;
            d.position.set(e.x / TILE, Env.groundH(e.x, e.y - 2) + bob, (e.y - 3) / TILE * R3_ZS);
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
