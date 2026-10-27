/* ---- 41a_showcase.js ---- */
/* An item's own display (David, 27 October evening): tapping something in the collection opens it on a little turntable,
   its 3D model turning slowly where the new look's models are loaded (its picture, big, where they aren't), with what it
   sells and buys for, where it comes from, when Sarah first found it and how many she has. */
function itemShowcase(id, back) {
    const it = ITEMS[id];
    if (!it) return;
    const P = UI.open({ title: itemName(id), phone: true, back });
    const stage = el('div', 'showcase');
    P.body.appendChild(stage);
    if (!Showcase.show(stage, id)) stage.appendChild(showcasePicture(id));
    const list = el('div', 'list sc-facts');
    const fact = (label, text) => { if (!text) return; const r = el('div', 'row'), t = el('div', 't'); t.appendChild(el('b', null, label)); t.appendChild(el('span', null, text)); r.appendChild(t); list.appendChild(r); };
    fact(ITEM_TYPES[it.type] || 'Item', itemDesc(id));
    if (!unsellable(id) && sellPrice(id)) fact('Sells for', `${fmtNum(sellPrice(id))} sand dollars`);
    const buy = itemBuyWhere(id);
    if (buy) fact('Buys for', buy);
    fact('Where from', itemSource(id));
    if (S.seen && S.seen[id] != null) fact('First found', dayLabel(S.seen[id]));
    const have = pocketCount(id) + ((S.storage && S.storage[id]) || 0);
    fact('You have', have ? `${have} (pocket and storage)` : 'None right now');
    P.body.appendChild(list);
}
/* the picture, big (its HD picture where it has one), when there's no model to turn */
function showcasePicture(id) {
    const icon = itemIcon(id), hd = typeof hdHas === 'function' && hdHas(icon) ? hdNamed(icon, true) : null;
    const c = document.createElement('canvas');
    c.className = 'sc-pic';
    const src = hd && hd.c ? hd.c : iconCanvas(icon, 64);
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0);
    return c;
}
/* where it can be bought, and for how much */
function itemBuyWhere(id) {
    const it = ITEMS[id];
    if (!it || !(it.price > 0) || unsellable(id)) return null;
    if (FURN[id] && !FURN[id].fixture && !FURN[id].prize && !FURN[id].pottery && !FURN[id].art) return `${fmtNum(it.price)} at IslandMart (on the laptop) or Fortune's, when it's in stock`;
    if (it.type === 'wall' || it.type === 'floor') return `${fmtNum(it.price)} at IslandMart or Fortune's, when it's in stock`;
    if (it.type === 'outfit' || it.type === 'acc') return `${fmtNum(it.price)} at Clementine's or IslandMart, when it's in stock`;
    return null;
}
/* where it comes from, in a line */
function itemSource(id) {
    const it = ITEMS[id], t = it.type;
    if (t === 'fish') {
        const f = FISHES.find(x => x.id === id);
        if (!f) return 'Caught on the hook.';
        const where = f.where.split('').map(c => ({ s: 'the sea', r: 'the river', p: 'the ponds' }[c])).join(' or ');
        const hrs = f.hours[1] - f.hours[0] >= 24 ? 'any time of day' : `from ${fmtHour(f.hours[0])} to ${fmtHour(f.hours[1])}`;
        return `Fished from ${where}, ${hrs}.`;
    }
    if (t === 'shell') return 'Washes up on the beaches; a few new ones every morning.';
    if (t === 'fruit') return FRUIT_HINT[id] || 'Grows on the island\'s fruit trees. Shake one!';
    if (t === 'veg') return 'Grown from seeds (Fortune sells them) in Sarah\'s planter boxes or the community garden.';
    if (t === 'flower') {
        if (it.hybrid) return 'Only from cross-breeding: water two flowers of its kind side by side and see what grows. Never from seeds.';
        const wild = (W0.flowers || []).some(f => `flower_${f.kind}_${f.color}` === id);
        return (wild ? 'Grows wild on the island, and from ' : 'From ') + `${it.kind} seeds at Fortune's (any of three colors), or two flowers side by side, watered.`;
    }
    if (t === 'dish') {
        const r = typeof RECIPE !== 'undefined' && RECIPE[id];
        return r ? `Cooked at the kitchenette from ${listWords(Object.keys(r.need).map(k => itemName(k).toLowerCase()), 5)}${S.recipes.includes(id) ? '' : ' (a friend teaches the recipe)'}; Mac's serves it some days.` : 'Cooked, or served at Mac\'s.';
    }
    if (t === 'gem') return 'Turns up on the mountain top, a few a day.';
    if (t === 'material') return id === 'wood' ? 'Chopped from trees with the axe.' : 'Found around the island.';
    if (FURN[id] && FURN[id].pottery) return 'Made by Sarah at Sully\'s pottery studio.';
    if (FURN[id] && FURN[id].prize) return 'A prize: won at the arcade\'s prize counter, a tournament or a contest.';
    if (itemBuyWhere(id)) return 'From the shops, or as a present from a friend.';
    return 'A find: a present, a prize, a favor\'s reward or one of the island\'s secrets.';
}

/* the turntable: a small renderer of its own, the model lit softly and turning; it lets go of everything once its
   panel closes */
const Showcase = {
    model(id) {
        if (typeof EnvModels === 'undefined' || !EnvModels.ready) return null;
        const it = ITEMS[id], f = FURN[id];
        if (f) {
            const n = /^plush_/.test(id) ? 'folk_' + id.slice(6) : 'furn_' + (f.base || id);
            return EnvModels.has(n) ? n : null;
        }
        return typeof EnvItems !== 'undefined' ? EnvItems.model(id, it && it.icon) : null;
    },
    show(host, id) {
        const name = this.model(id);
        if (!name || !hasWebGL()) return false;
        const M = EnvModels.models[name], S2 = 240;
        const cv = document.createElement('canvas');
        cv.className = 'sc-3d'; cv.width = S2 * Math.min(2, devicePixelRatio || 1); cv.height = cv.width;
        let r;
        try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return false; }
        r.setClearColor(0x000000, 0);
        const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100), spin = new THREE.Group();
        scene.add(new THREE.HemisphereLight(0xdfeaff, 0x8a7a60, 0.95));
        const sun = new THREE.DirectionalLight(0xfff1dc, 0.85);
        sun.position.set(-2, 4, 3);
        scene.add(sun);
        // (each part in a plain material of its own: the island's carry the view's bend, haze and fade, none wanted here)
        const tint = typeof EnvItems !== 'undefined' ? EnvItems.tint(id) : null, mats = [];
        for (const p of M.parts) {
            const m = p.material;
            let mat;
            if (m.isMeshBasicMaterial) mat = new THREE.MeshBasicMaterial({ vertexColors: !!m.vertexColors, map: m.map || null });
            else mat = new THREE.MeshStandardMaterial({ map: m.map || null, color: m.map ? 0xffffff : (m.color ? m.color.clone() : 0xffffff), vertexColors: !!m.vertexColors, roughness: 0.8, metalness: 0, transparent: !!m.transparent, opacity: m.opacity == null ? 1 : m.opacity });
            const role = tint && /_(top|trim)$/.exec(m.name || '');
            if (role && tint[role[1]]) mat.color.set(tint[role[1]]);
            // (a piece in another color: the model's own colors repainted, 6zz_colors.js)
            const geo = FURN[id] && FURN[id].color && typeof colorGeo === 'function' ? colorGeo(name, p.geometry, FURN[id]) : p.geometry;
            spin.add(new THREE.Mesh(geo, mat));
            mats.push(mat);
        }
        // fitted to the stage, standing on its foot, seen from a little above
        const box = new THREE.Box3().setFromObject(spin), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
        const R = Math.max(size.x, size.y, size.z, 0.05);
        spin.children.forEach(c => c.position.set(-mid.x, -mid.y, -mid.z));
        scene.add(spin);
        cam.position.set(0, R * 0.9, R * 3.1);
        cam.lookAt(0, 0, 0);
        host.appendChild(cv);
        const t0 = performance.now();
        const frame = () => {
            if (!cv.isConnected) { mats.forEach(m => m.dispose()); r.dispose(); try { r.forceContextLoss(); } catch (e) { /* gone already */ } return; }
            spin.rotation.y = (performance.now() - t0) / 2600 + 0.6;
            r.render(scene, cam);
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        return true;
    },
};
