/* ---- 33l_env_room.js ---- */
/* Rooms in the new look (wherever it's on): the people are dolls and the food folks toys, as outside, and the room is a
   little box you look into, as a dollhouse room is: the floor, the back wall and both side walls papered with the room's
   own wallpaper (one tile of the HD picture's paper, repeated), a skirting board along the bottom, the walls' cut tops,
   and a sill across the front with a gap for the doorway. The furniture still stands up as the HD view's pictures
   until its models are made (EnvRoom.takes). */
const EnvRoom = {
    on: false, built: null,
    WH: 2.3,            // the walls' height (world units; a tile is one across)
    active(a) { return !!a && a.interior && Env.want() && typeof EnvModels !== 'undefined' && EnvModels.ready; },
    /* the HD-2D view asks every frame indoors: draw this room the new way? */
    update(r3, a) {
        const sig = this.sig(a);
        if (this.built && (this.built.area !== a || this.built.sig !== sig)) this.teardown(r3);
        if (!this.built) {
            try { this.build(r3, a, sig); }
            catch (e) { console.error('the room could not be built the new way (using the HD-2D view)', e); Env.failed = true; this.teardown(r3); return false; }
        }
        this.on = true;
        this.built.group.visible = true;
        if (r3.wall) {
            r3.wall.mesh.visible = false;
            // (the HD view makes its wall picture again when the room is redecorated)
            const B = this.built.back;
            if (B.map !== r3.wall.tex) { B.map = B.emissiveMap = r3.wall.tex; B.needsUpdate = true; }
        }
        EnvDolls.attach(this.built.group);
        EnvDolls.tick(r3, a);
        R3U.uSee.value.w = 0;
        return true;
    },
    /* (built again when the room changes size or paper: the house grows, Sarah changes the wallpaper) */
    sig(a) { return [a.id, a.w, a.h, a.club ? 'disco' : a.wallId || S.house.wall, a.club ? 'disco' : a.floorId || S.house.floor].join('|'); },
    /* what the room draws itself (nothing yet: the furniture's models come next) */
    takes(e) { return false; },
    hide(r3) {
        if (!this.on) return;
        this.on = false;
        if (this.built) this.built.group.visible = false;
        if (r3 && r3.wall) r3.wall.mesh.visible = true;
    },
    teardown(r3) {
        const b = this.built;
        this.built = null; this.on = false;
        if (!b) return;
        if (EnvDolls.group && EnvDolls.group.parent === b.group) b.group.remove(EnvDolls.group);
        r3.scene.remove(b.group);
        b.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        for (const t of b.textures) t.dispose();
    },
    build(r3, a, sig) {
        const group = new THREE.Group(), textures = [];
        r3.scene.add(group);
        this.built = { group, area: a, sig, textures };
        const f = a.floor, k = r3RoomK(a), bg = r3RoomBg(a, k), T = TILE, H = this.WH;
        const x0 = f.x0, x1 = f.x0 + f.w, z0 = f.y0 * R3_ZS, z1 = (f.y0 + f.h) * R3_ZS;
        // the wallpaper: one tile of the back wall's paper (a 16 by 32 strip), repeated along every wall
        const strip = document.createElement('canvas');
        strip.width = T * k; strip.height = f.y0 * T * k;
        const sg = strip.getContext('2d');
        sg.imageSmoothingEnabled = false;
        sg.drawImage(bg, x0 * T * k, 0, T * k, f.y0 * T * k, 0, 0, T * k, f.y0 * T * k);
        const tex = new THREE.CanvasTexture(strip);
        tex.wrapS = THREE.RepeatWrapping; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
        textures.push(tex);
        // (the paper lit evenly: a room's walls never fall into the dark side of the sun)
        const paper = r3Patch(new THREE.MeshLambertMaterial({ map: tex, color: 0xd8d2ca, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32 }), { key: 'envroomwall' });
        // a wall: a plane facing into the room, its paper repeated once a tile along it
        const wall = (len, x, z, ry) => {
            const g = new THREE.PlaneGeometry(len, H);
            const uv = g.attributes.uv;
            for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len);
            const m = new THREE.Mesh(g, paper);
            m.position.set(x, H / 2, z);
            m.rotation.y = ry;
            m.receiveShadow = true;
            group.add(m);
        };
        const depth = z1 - z0;
        // the back wall wears the HD view's own picture of it, with what's hung there (shelves, clocks, signs, windows)
        const back = r3Patch(new THREE.MeshLambertMaterial({ map: r3.wall ? r3.wall.tex : tex, color: 0xd8d2ca, emissive: 0xffffff, emissiveMap: r3.wall ? r3.wall.tex : tex, emissiveIntensity: 0.32 }), { key: 'envroomwall' });
        const bgeo = new THREE.PlaneGeometry(f.w, H), buv = bgeo.attributes.uv;
        for (let i = 0; i < buv.count; i++) buv.setX(i, r3.wall ? (x0 + buv.getX(i) * f.w) / a.w : buv.getX(i) * f.w);
        const bm = new THREE.Mesh(bgeo, back);
        bm.position.set((x0 + x1) / 2, H / 2, z0);
        bm.receiveShadow = true;
        group.add(bm);
        this.built.back = back;
        wall(depth, x0, (z0 + z1) / 2, Math.PI / 2);
        wall(depth, x1, (z0 + z1) / 2, -Math.PI / 2);
        // the skirting board, the cut tops of the walls (dark, as a dollhouse's), the sill across the front
        const wood = r3Patch(new THREE.MeshLambertMaterial({ color: a.club ? 0x3a2a4a : 0x8a5c3c }), { key: 'envroomtrim' });
        const cut = r3Patch(new THREE.MeshLambertMaterial({ color: 0x2e2230 }), { key: 'envroomtrim' });
        const box = (mat, x, y, z, w, h, d) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            m.position.set(x, y, z);
            m.castShadow = false; m.receiveShadow = true;
            group.add(m);
        };
        const t = 0.14, sk = 0.16;
        box(wood, (x0 + x1) / 2, sk / 2, z0 + 0.03, f.w, sk, 0.06);
        box(wood, x0 + 0.03, sk / 2, (z0 + z1) / 2, 0.06, sk, depth);
        box(wood, x1 - 0.03, sk / 2, (z0 + z1) / 2, 0.06, sk, depth);
        box(cut, (x0 + x1) / 2, H + 0.04, z0 - t / 2, f.w + 2 * t, 0.08, t);
        box(cut, x0 - t / 2, H + 0.04, (z0 + z1) / 2, t, 0.08, depth + t);
        box(cut, x1 + t / 2, H + 0.04, (z0 + z1) / 2, t, 0.08, depth + t);
        box(cut, (x0 + x1) / 2, H / 2, z0 - t / 2 - 0.005, f.w + 2 * t, H, t * 0.98);
        box(cut, x0 - t / 2, H / 2, (z0 + z1) / 2, t * 0.98, H, depth + t);
        box(cut, x1 + t / 2, H / 2, (z0 + z1) / 2, t * 0.98, H, depth + t);
        const [dx] = a.doorTile, sill = 0.1;
        box(wood, (x0 - t + dx) / 2, sill / 2, z1 + 0.06, dx - x0 + t, sill, 0.12);
        box(wood, (dx + 1 + x1 + t) / 2, sill / 2, z1 + 0.06, x1 + t - dx - 1, sill, 0.12);
    },
};
