/* ---- 33l_env_room.js ---- */
/* Rooms in the new look (wherever it's on): the people are dolls and the food folks toys, as outside, and the room is a
   little box you look into, as a dollhouse room is: the floor, the back wall and both side walls papered with the room's
   own wallpaper (one tile of the HD picture's paper, repeated), a skirting board along the bottom, the walls' cut tops,
   and a sill across the front with a gap for the doorway. The furniture still stands up as the HD view's pictures
   until its models are made (EnvRoom.takes). */
const EnvRoom = {
    on: false, built: null, rk: 0,
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
        this.furniture(r3, a);
        EnvDolls.attach(this.built.group);
        EnvDolls.tick(r3, a);
        R3U.uSee.value.w = 0;
        return true;
    },
    /* (built again when the room changes size or paper: the house grows, Sarah changes the wallpaper) */
    sig(a) { return [a.id, a.w, a.h, a.club ? 'disco' : a.wallId || S.house.wall, a.club ? 'disco' : a.floorId || S.house.floor].join('|'); },
    /* what the room draws itself: the furniture made in Blender (furniture.py), not what's hung on the wall, a rug, or a
       piece drawn moving (an arcade cabinet's screen, the disco floor) */
    model(e) {
        if (!e.furn || !e.def || e.draw || e.def.kind === 'wall' || e.def.kind === 'rug') return null;
        // (a plush is its folk's own model, small)
        const n = /^plush_/.test(e.item.id) ? 'folk_' + e.item.id.slice(6) : 'furn_' + e.item.id;
        return EnvModels.has(n) ? n : null;
    },
    PLUSH: 0.34,
    /* what hangs on the back wall: drawn here as a piece of its own (EnvRoom.cutout), not painted on the wall's picture */
    hangs(e) { return this.on && !!e.furn && !!e.def && e.def.kind === 'wall' && !e.draw; },
    /* a piece's own picture (its HD art if it has one): the canvas and where its anchor is, in world pixels */
    pic(frame) {
        const hf = typeof hdHas === 'function' && hdHas(frame) ? hdNamed(frame, true) : null;
        if (hf && hf.c) return { c: hf.c, w: hf.w / HD_K, h: hf.h / HD_K, ax: hf.ax / HD_K, ay: hf.ay / HD_K };
        const f = Assets.frames[frame];
        if (!f) return null;
        const [sx, sy, w, h, ax, ay] = f, c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
        return { c, w, h, ax, ay };
    },
    /* a piece with no model of its own, as a thick cut-out of its picture: the picture on the front, the same shape a
       shade darker twice behind it, so it has an edge and stands off the wall (what's hung there) or stands up on its
       own (a thing on a table) the way a dollhouse's little pieces are cut from card */
    cutout(g, e, P, w, h) {
        const B = this.built, key = 'cut|' + e.frame;
        let tex = B.cutTex.get(key);
        if (!tex) {
            tex = new THREE.CanvasTexture(P.c);
            tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
            B.cutTex.set(key, tex); B.textures.push(tex);
        }
        const geo = new THREE.PlaneGeometry(w, h), out = new THREE.Group();
        for (const [z, front] of [[0, true], [-0.018, false], [-0.036, false]]) {
            const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, color: front ? 0xd8d2ca : 0x5a524a, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: front ? 0.32 : 0.06, side: THREE.DoubleSide }), { key: 'envcut' });
            const m = new THREE.Mesh(geo, mat);
            m.position.z = z;
            m.castShadow = false; m.receiveShadow = front;
            out.add(m);
        }
        if (e.flip) out.scale.x = -1;
        g.add(out);
        return out;
    },
    /* (round things keep round: the wall's height stretch shared both ways) */
    ROUND: new Set(['clock_wall', 'shell_mirror', 'disco_ball', 'lh_lifering', 'lh_barometer', 'gear_wall']),
    /* a wall piece's face: its picture across the face's quad, the quad's corners its picture's */
    picUV(geo) {
        if (geo.attributes.uv) return;
        geo.computeBoundingBox();
        const b = geo.boundingBox, pos = geo.attributes.position, uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pos.getX(i) - b.min.x) / (b.max.x - b.min.x || 1); uv[i * 2 + 1] = (pos.getY(i) - b.min.y) / (b.max.y - b.min.y || 1); }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    },
    picMat(frame, P, glow) {
        const B = this.built, key = 'pic|' + frame + (glow ? '|glow' : '');
        B.picMats = B.picMats || new Map();
        if (B.picMats.has(key)) return B.picMats.get(key);
        let tex = B.cutTex.get('cut|' + frame);
        if (!tex) {
            tex = new THREE.CanvasTexture(P.c);
            tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
            B.cutTex.set('cut|' + frame, tex); B.textures.push(tex);
        }
        // (neon glows: unlit; the rest takes the room's light like the furniture, a touch lifted as the pictures are)
        const mat = glow ? r3Patch(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 }), { key: 'envpicglow' })
            : r3Patch(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.85, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 }), { key: 'envpic' });
        B.picMats.set(key, mat);
        return mat;
    },
    takes(e) { return this.on && ((!!this.built && !!this.built.placed && this.built.placed.has(e)) || ((e.kind === 'judge' || e.kind === 'ghost') && EnvDolls.drawn.has(e))); },
    /* where a picture still drawn the HD way stands: a thing on a table that's a model stands on its top */
    place(e) {
        if (!this.on || !e.furn || e.def.kind !== 'top' || e.item.on == null || !this.built) return null;
        const host = this.built.hosts && this.built.hosts.get(e.item.on);
        return host ? { y: host.top, z: host.z } : null;
    },
    /* the furniture: built again whenever it changes (moved, added, the shop's stock of the day) */
    furniture(r3, a) {
        const B = this.built, list = a.ents.filter(e => e.furn && this.model(e));
        // (and what has no model yet: what hangs on the wall, and the little things on tables, as thick cut-outs)
        const cuts = a.ents.filter(e => e.furn && e.def && !e.draw && !this.model(e) && (e.def.kind === 'wall' || e.def.kind === 'top'));
        // (each piece by its own entity: the room makes them afresh when it's rearranged or restocked)
        const sig = list.concat(cuts).map(e => (e._rk || (e._rk = ++this.rk)) + ':' + e.item.id + ',' + e.item.x + ',' + e.item.y + (e.flip ? 'f' : '')).join('|') + '#' + (EnvModels.furnN || 0);
        if (sig === B.furnSig) return;
        B.furnSig = sig;
        if (B.furn) { B.group.remove(B.furn); B.furn.traverse(o => { if (o.userData.shared) return; if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); }); B.furn = null; }
        const g = B.furn = new THREE.Group();
        B.group.add(g);
        B.hosts = new Map();
        B.placed = new Set();
        // (pieces standing on others go after them, so their table's top is known)
        list.sort((p, q) => (p.def.kind === 'top' && p.item.on != null ? 1 : 0) - (q.def.kind === 'top' && q.item.on != null ? 1 : 0));
        for (const e of list) {
            if (e.def.kind === 'wall') continue;
            const n = this.model(e), d = e.def, it = e.item, h = d.kind === 'top' ? 1 : d.h;
            const host = d.kind === 'top' && it.on != null ? B.hosts.get(it.on) : null;
            if (d.kind === 'top' && it.on != null && !host) continue;     // (on a table still drawn as a picture: a picture too)
            const x = it.x + d.w / 2, z = host ? host.z : (it.y + h / 2) * R3_ZS, y = host ? host.top : 0;
            const m = new THREE.Matrix4().makeTranslation(x, y, z);
            if (e.flip) m.multiply(new THREE.Matrix4().makeScale(-1, 1, 1));
            if (/^folk_/.test(n)) m.multiply(new THREE.Matrix4().makeScale(this.PLUSH, this.PLUSH, this.PLUSH));
            for (const mesh of EnvModels.place(g, n, m)) mesh.userData.shared = true;
            B.placed.add(e);
            const top = EnvModels.models[n].anchors.top;
            if (top) B.hosts.set(e.idx, { top: top[0].y, z });
        }
        B.cutTex = B.cutTex || new Map();
        const f = a.floor, wallPx = f.y0 * TILE, H = this.WH, z0 = f.y0 * R3_ZS;
        // what hangs on the wall and has a model (furn_f.py): on the back wall where its picture was, as tall as the
        // picture on the wall's height; a face it carries (a sign's, a poster's, a painting's) wears the picture itself
        const k = H * TILE / wallPx;
        for (const e of list) {
            const P = e.def.kind === 'wall' && this.pic(e.frame);
            if (!P) continue;
            const n = this.model(e), left = e.x - P.ax, top = e.y - P.ay, sq = this.ROUND.has(e.item.id) ? Math.sqrt(k) : 0;
            const m = new THREE.Matrix4().makeTranslation((left + P.w / 2) / TILE, H * (1 - (top + P.h / 2) / wallPx), z0 + 0.01);
            m.multiply(new THREE.Matrix4().makeScale((e.flip ? -1 : 1) * (sq || 1), sq || k, sq || 1));
            for (const p of EnvModels.models[n].parts) {
                const face = /_pic(glow)?$/.exec(p.material.name || '');
                if (face) this.picUV(p.geometry);
                const mesh = new THREE.Mesh(p.geometry, face ? this.picMat(e.frame, P, !!face[1]) : p.material);
                mesh.matrixAutoUpdate = false; mesh.matrix.copy(m);
                mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.shared = true;
                g.add(mesh);
            }
            B.placed.add(e);
        }
        for (const e of cuts) {
            const P = this.pic(e.frame), d = e.def, it = e.item;
            if (!P) continue;
            if (d.kind === 'wall') {
                // where its picture was on the back wall's picture, standing a little off the wall
                const left = e.x - P.ax, top = e.y - P.ay, w = P.w / TILE, h = P.h / wallPx * H;
                const o = this.cutout(g, e, P, w, h);
                o.position.set((left + P.w / 2) / TILE, H * (1 - (top + P.h / 2) / wallPx), z0 + 0.05);
            } else {
                // a thing on a table (or the floor): standing up on its top, its foot where its picture's was
                const host = it.on != null ? B.hosts.get(it.on) : null;
                if (it.on != null && !host) continue;
                const w = P.w / TILE, h = P.h / TILE * R3_VS;
                const o = this.cutout(g, e, P, w, h);
                o.position.set(it.x + d.w / 2 + (P.w / 2 - P.ax) / TILE, (host ? host.top : 0) + h / 2 - (P.h - P.ay) / TILE * R3_VS, (host ? host.z : (it.y + 0.5) * R3_ZS) + 0.02);
            }
            B.placed.add(e);
        }
    },
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
        // (the furniture's geometry and materials are the models', kept for the next room)
        b.group.traverse(o => { if (o.userData.shared) return; if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
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
