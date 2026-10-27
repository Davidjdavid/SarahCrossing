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
        this.animate(a);
        if (this.built.club) this.clubTick(a);
        EnvDolls.attach(this.built.group);
        EnvDolls.tick(r3, a);
        R3U.uSee.value.w = 0;
        return true;
    },
    /* (built again when the room changes size or paper: the house grows, Sarah changes the wallpaper) */
    sig(a) { return [a.id, a.w, a.h, a.club ? 'disco' + (EnvModels.has('furn_turntables') ? '+' : '') : a.wallId || S.house.wall, a.club ? 'disco' : a.floorId || S.house.floor].join('|'); },
    /* what the room draws itself: the furniture made in Blender (furniture.py), not what's hung on the wall or a rug (a
       piece the 2D view draws moving uses its model too: what moves on it moves here, EnvRoom.animate) */
    model(e) {
        if (!e.furn || !e.def || e.def.kind === 'rug' || e.def.food || e.def.flower) return null;
        // (a plush is its folk's own model, small)
        const n = /^plush_/.test(e.item.id) ? 'folk_' + e.item.id.slice(6) : 'furn_' + e.item.id;
        if (EnvModels.has(n)) return n;
        // (a neighbor's photo stands in the photo frame, wearing its own picture)
        if (/^photo_/.test(e.item.id) && EnvModels.has('furn_photo_frame')) return 'furn_photo_frame';
        // (a painting with no model of its own, a neighbor's art for the museum, hangs in the gilt frame, its picture inside)
        return e.def.kind === 'wall' && e.def.art && EnvModels.has('furn_empty_frame') ? 'furn_empty_frame' : null;
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
    /* a piece's model at a place; a face it carries (*_pic, *_picglow) wears the piece's own picture */
    parts(g, e, n, m, P) {
        const B = this.built;
        for (const p of EnvModels.models[n].parts) {
            const mn = p.material.name || '', face = /_pic(glow)?$/.exec(mn);
            // (the island flag's cloth is the Town Hall's design itself, not its little picture with a pole)
            const fc = face && e.frame === 'f_island_flag' && typeof flagCanvas === 'function' ? flagCanvas(4) : null;
            const pic = face && (fc ? { c: fc } : P || this.pic(e.frame));
            if (face && !pic) continue;
            if (face || /_screen$/.test(mn)) this.picUV(p.geometry);
            const mat = face ? this.picMat(e.frame, pic, !!face[1]) : /_screen$/.test(mn) ? this.screen(e) : p.material;
            const mesh = new THREE.Mesh(p.geometry, mat);
            mesh.matrixAutoUpdate = false; mesh.matrix.copy(m);
            mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.shared = true;
            g.add(mesh);
            // (the claw riding along the top, a conveyor's plates)
            if (/_move$/.test(mn)) B.movers.push({ e, mesh, base: m.clone() });
        }
    },
    /* an arcade cabinet's screen: its game's name and its own little attract animation (the 2D one, blown up), drawn
       on a picture of its own a few times a second */
    screen(e) {
        const B = this.built, c = document.createElement('canvas');
        c.width = 64; c.height = 52;
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        B.textures.push(tex);
        B.screens.push({ e, c, tex });
        const mat = r3Patch(new THREE.MeshBasicMaterial({ map: tex }), { key: 'envscreen' });
        mat.userData.own = true;
        return mat;
    },
    drawScreen(s) {
        const e = s.e, c = s.c, g = c.getContext('2d'), W = c.width, H = c.height, id = e.def.arcade;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#10121e'; g.fillRect(0, 0, W, H);
        if (id === 'broken') return this.brokenScreen(s);
        const game = typeof ARCADE_GAMES !== 'undefined' && (ARCADE_GAMES[id] || ARCADE_GAMES['vs_' + id]);
        g.fillStyle = '#ffe9a8'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        if (game && game.name) g.fillText(String(game.name).toUpperCase(), W / 2, 3, W - 6);
        const x0 = Math.round(e.x) - 8, y0 = Math.round(e.y) - 29, k = 5;
        g.setTransform(k, 0, 0, k, 7 - (x0 + 3) * k, 12 - (y0 + 6) * k);
        drawCabinetScreen(g, e);
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = 'rgba(0,0,0,0.2)';
        for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
        s.tex.needsUpdate = true;
    },
    /* the out-of-order cabinet: a paper sign taped over the dark screen, the game underneath flickering now and then */
    brokenScreen(s) {
        const c = s.c, g = c.getContext('2d'), W = c.width, H = c.height, k = Math.floor(G.t / 10);
        if (s.drawn && k % 23 && s.drawn !== 'flick') return;
        s.drawn = k % 23 === 0 ? 'flick' : 'still';
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#0c0d14'; g.fillRect(0, 0, W, H);
        if (k % 23 === 0) { g.fillStyle = 'rgba(78,195,217,0.5)'; g.fillRect(0, 8 + (k % 5) * 6, W, 3); }
        g.save(); g.translate(W / 2, H / 2); g.rotate(-0.06);
        g.fillStyle = '#f4ecd8'; g.fillRect(-26, -16, 52, 32);
        g.fillStyle = 'rgba(220,210,170,0.8)'; g.fillRect(-30, -19, 12, 5); g.fillRect(18, -19, 12, 5);
        g.fillStyle = '#c0283a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('OUT OF', 0, -6, 48); g.fillText('ORDER', 0, 7, 48);
        g.restore();
        s.tex.needsUpdate = true;
    },
    /* a model's parts as a group of their own (the furniture's geometry and materials, kept for the next room) */
    group(n, x, y, z, s, ry) {
        const o = new THREE.Group();
        o.position.set(x, y, z);
        if (s) o.scale.setScalar(s);
        if (ry) o.rotation.y = ry;
        for (const m of EnvModels.place(o, n, new THREE.Matrix4())) m.userData.shared = true;
        return o;
    },
    /* where a tabletop is: the top of whatever stands on that floor tile */
    topAt(tx, ty) {
        for (const t of this.built.tops) if (tx >= t.x0 && tx < t.x1 && ty >= t.y0 && ty < t.y1) return t;
        return null;
    },
    /* a rug: a soft slab with rounded corners (a round one round), its picture across the top, a shade darker round
       its edge; the light-up dance floor's squares light in turn (EnvRoom.animate) */
    rug(g, e) {
        const B = this.built, d = e.def, it = e.item, P = this.pic(e.frame);
        if (!P) return false;
        const round = /round/.test(d.id), sh = new THREE.Shape();
        if (round) sh.absarc(0.5, 0.5, 0.5, 0, Math.PI * 2, false);
        else {
            const r = 0.05;
            sh.moveTo(r, 0); sh.lineTo(1 - r, 0); sh.quadraticCurveTo(1, 0, 1, r); sh.lineTo(1, 1 - r); sh.quadraticCurveTo(1, 1, 1 - r, 1);
            sh.lineTo(r, 1); sh.quadraticCurveTo(0, 1, 0, 1 - r); sh.lineTo(0, r); sh.quadraticCurveTo(0, 0, r, 0);
        }
        const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2, curveSegments: round ? 40 : 4 });
        let c = P.c;
        if (d.anim) { c = document.createElement('canvas'); c.width = c.height = 128; B.lit = { e, c, P }; }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
        B.textures.push(tex);
        if (B.lit && B.lit.e === e) { B.lit.tex = tex; this.drawLit(); }
        const top = r3Patch(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: d.anim ? 0.5 : 0.1 }), { key: 'envrug' });
        const edge = r3Patch(new THREE.MeshStandardMaterial({ color: this.edgeCol(P.c), roughness: 0.95, metalness: 0 }), { key: 'envrug' });
        top.userData.own = edge.userData.own = true;
        const m = new THREE.Mesh(geo, [top, edge]), w = d.w * 0.94, h = d.h * R3_ZS * 0.94;
        m.rotation.x = -Math.PI / 2;
        m.scale.set(w, h, 1);
        m.position.set(it.x + (d.w - w) / 2, 0.002, (it.y + d.h) * R3_ZS - (d.h * R3_ZS - h) / 2);
        m.receiveShadow = true;
        g.add(m);
        return true;
    },
    /* (a rug's edge: its picture's average color, darker) */
    edgeCol(c) {
        const k = document.createElement('canvas'); k.width = k.height = 1;
        const x = k.getContext('2d'); x.drawImage(c, 0, 0, 1, 1);
        const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
        return new THREE.Color(r / 255 * 0.7, g / 255 * 0.7, b / 255 * 0.7);
    },
    drawLit() {
        const L = this.built.lit, g = L.c.getContext('2d'), P = L.P, cols = ['#ff5aa8', '#4ec3d9', '#ffd84a', '#8cc152'], t = G.t;
        g.drawImage(P.c, 0, 0, 128, 128);
        for (let i = 0; i < 16; i++) { g.fillStyle = cols[(i + (t >> 4)) % 4]; g.fillRect(8 + (i % 4) * 28, 8 + Math.floor(i / 4) * 28, 24, 24); }
        L.tex.needsUpdate = true;
    },
    /* a mannequin in Clementine's: a doll from the kit (no face, no hair, the color of a dress form) wearing the outfit
       it's showing, on its stand */
    mannequin(g, e) {
        const it = ITEMS[e.sale];
        if (!it || !EnvDolls.kitReady() || typeof hdOutfit !== 'function') return false;
        const look = Object.assign({}, LOOK_DEFAULT, { hair: 'bald', skin: '#efe2cc', blush: false, masc: false, freckles: false });
        const d = EnvDolls.make2({ look, clothes: hdOutfit(it.wear), eyes: null, acc: null });
        if (d.face) d.face.visible = false;
        // (facing the shop, its head a dress form's smaller one, its arms a little out from its sides)
        if (d.parts.head) d.parts.head.scale.setScalar(0.62);
        if (d.parts.armL) d.parts.armL.rotation.z = -0.18;
        if (d.parts.armR) d.parts.armR.rotation.z = 0.18;
        const x = e.x / TILE, z = ((e.y + 2) / TILE - 0.5) * R3_ZS;
        d.root.position.set(x, 0.045, z);
        d.root.rotation.y = Math.PI;
        d.root.traverse(o => { if (o.isMesh) o.userData.ownGeo = true; });
        g.add(d.root);
        if (EnvModels.has('furn_mannequin_stand')) g.add(this.group('furn_mannequin_stand', x, 0, z));
        return true;
    },
    /* the accessories for sale lying on the boutique's table, each the piece a doll wears (EnvDolls.extras) */
    accessories(g, e, host) {
        (e.accs || []).slice(0, 3).forEach((id, i, all) => {
            const wear = ITEMS[id] && ITEMS[id].wear;
            if (!wear) return;
            const o = new THREE.Group(), R = 0.2;
            EnvDolls.extras({ R, v2: true, eye: { x: 0.36, y: 0, z: 0.9, r: 0.22 } }, o, EYE_ACCS.has(wear) ? { eyes: wear } : { acc: wear }, LOOK_DEFAULT);
            o.traverse(m => { if (m.isMesh) m.userData.shared = true; });
            const b = new THREE.Box3().setFromObject(o);
            if (b.isEmpty()) return;
            o.position.set(e.item.x + e.def.w / 2 + (i - (all.length - 1) / 2) * 0.55, host.top - b.min.y + 0.005, host.z);
            g.add(o);
        });
    },
    /* the fittings with no furniture of their own (the shop's easel and board, the restaurant's chairs and plates, the
       arcade's back door and crates): what each is, from look3d */
    deco(g, a, e) {
        const L = e.look3d, B = this.built, zOf = (y) => ((y + 2) / TILE - 0.5) * R3_ZS;
        if (L.model && EnvModels.has(L.model)) {
            const o = this.group(L.model, e.x / TILE, 0, zOf(e.y), 0, e.flip ? -Math.PI / 2 : L.face === 'right' ? Math.PI / 2 : 0);
            g.add(o);
            return true;
        }
        if (L.easel && EnvModels.has('furn_shop_easel')) {
            const P = this.pic(L.easel);
            this.parts(g, { frame: L.easel }, 'furn_shop_easel', new THREE.Matrix4().makeTranslation(e.x / TILE, 0, zOf(e.y)), P || undefined);
            return true;
        }
        if (L.board && EnvModels.has('furn_shop_board')) {
            const x = e.x / TILE, z = zOf(e.y), m = new THREE.Matrix4().makeTranslation(x, 0, z);
            this.parts(g, { frame: 'display_board' }, 'furn_shop_board', m);
            const f = EnvModels.models.furn_shop_board.anchors.face, n = 'furn_' + L.board, P = this.pic(L.frame);
            if (f && EnvModels.has(n)) this.parts(g, { frame: L.frame }, n, new THREE.Matrix4().makeTranslation(x + f[0].x, f[0].y, z + f[0].z), P || undefined);
            else if (f && P) { const o = this.cutout(g, { frame: L.frame }, P, P.w / TILE, P.h / TILE); o.position.set(x + f[0].x, f[0].y, z + f[0].z + 0.02); }
            return true;
        }
        if (L.backdoor && EnvModels.has('furn_arcade_backdoor')) {
            g.add(this.group('furn_arcade_backdoor', e.x / TILE, 0, a.floor.y0 * R3_ZS + 0.005));
            return true;
        }
        if (L.dish != null) { B.plates.push({ e, L, mesh: null, dish: undefined }); return true; }
        return false;
    },
    /* what moves in a room: the cabinets' screens, the claw, the conveyor's plates, the light-up floor, the dishes being
       eaten at the restaurant's tables */
    animate(a) {
        const B = this.built, t = G.t;
        if (!B || !B.screens) return;
        if (t - (B.screenT || -99) >= 6) { B.screenT = t; for (const s of B.screens) this.drawScreen(s); }
        for (const mv of B.movers) {
            const id = mv.e.def && mv.e.def.id;
            const dx = id === 'claw_machine' ? -0.55 + (Math.sin(t / 50) + 1) * 0.5 : id === 'sushi_conveyor' ? (t * 0.004) % 0.4 : 0;
            mv.mesh.matrix.copy(mv.base).multiply(new THREE.Matrix4().makeTranslation(dx, 0, 0));
        }
        if (B.lit && (t >> 4) !== B.litStep) { B.litStep = t >> 4; this.drawLit(); }
        for (const pl of B.plates) {
            const dish = typeof seatDish === 'function' ? seatDish(pl.L.dish) : null;
            if (dish === pl.dish) continue;
            pl.dish = dish;
            if (pl.mesh) { B.furn.remove(pl.mesh); pl.mesh = null; }
            const n = dish && typeof EnvItems !== 'undefined' && EnvItems.model(dish, ITEMS[dish] && ITEMS[dish].icon);
            const top = this.topAt(pl.L.tx, pl.L.ty);
            if (!n || !top) continue;
            pl.mesh = this.group(n, pl.e.x / TILE, top.top, (pl.L.ty + 0.5) * R3_ZS, EnvItems.size(n, 1.4) * 0.9);
            B.furn.add(pl.mesh);
        }
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
        B.picMats = B.picMats || new Map(); B.cutTex = B.cutTex || new Map();
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
    takes(e) { return this.on && ((!!this.built && ((!!this.built.placed && this.built.placed.has(e)) || (!!this.built.club && this.built.club.placed.has(e)))) || ((e.kind === 'judge' || e.kind === 'ghost') && EnvDolls.drawn.has(e))); },
    /* where a picture still drawn the HD way stands: a thing on a table that's a model stands on its top */
    place(e) {
        if (!this.on || !e.furn || e.def.kind !== 'top' || e.item.on == null || !this.built) return null;
        const host = this.built.hosts && this.built.hosts.get(e.item.on);
        return host ? { y: host.top, z: host.z } : null;
    },
    /* the furniture: built again whenever it changes (moved, added, the shop's stock of the day) */
    furniture(r3, a) {
        const B = this.built, list = a.ents.filter(e => e.furn && this.model(e));
        // (food and flowers on tables: the things' own models, a vase for the flowers)
        const tops = a.ents.filter(e => e.furn && e.def && (e.def.food || e.def.flower));
        // (and what has no model yet: what hangs on the wall, and the little things on tables, as thick cut-outs)
        const cuts = a.ents.filter(e => e.furn && e.def && !e.draw && !this.model(e) && !e.def.food && !e.def.flower && (e.def.kind === 'wall' || e.def.kind === 'top'));
        // (rugs, the mannequins, and the fittings that aren't furniture: look3d says what they are)
        const rugs = a.ents.filter(e => e.furn && e.def && e.def.kind === 'rug'), mans = a.ents.filter(e => e.kind === 'mannequin' && e.sale), decos = a.ents.filter(e => e.look3d);
        // (each piece by its own entity: the room makes them afresh when it's rearranged or restocked)
        const sig = list.concat(tops, cuts, rugs).map(e => (e._rk || (e._rk = ++this.rk)) + ':' + e.item.id + ',' + e.item.x + ',' + e.item.y + (e.flip ? 'f' : '')).join('|')
            + '|' + mans.concat(decos).map(e => (e._rk || (e._rk = ++this.rk)) + ':' + (e.sale || '')).join('|') + '#' + (EnvModels.furnN || 0) + (EnvDolls.kitReady() ? 'k' : '');
        if (sig === B.furnSig) return;
        B.furnSig = sig;
        if (B.furn) { B.group.remove(B.furn); B.furn.traverse(o => this.dispose(o)); B.furn = null; }
        const g = B.furn = new THREE.Group();
        B.group.add(g);
        B.hosts = new Map();
        B.placed = new Set();
        B.screens = []; B.movers = []; B.plates = []; B.tops = []; B.lit = null;
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
            this.parts(g, e, n, m);
            B.placed.add(e);
            const top = EnvModels.models[n].anchors.top;
            if (top) {
                const H = { top: top[0].y + y, z };
                B.hosts.set(e.idx, H);
                B.tops.push({ x0: it.x, x1: it.x + d.w, y0: it.y, y1: it.y + d.h, top: H.top, z });
                if (e.accs) this.accessories(g, e, H);
            }
        }
        // food and flowers on tables (or on the floor): each thing's own model, the flowers standing in a vase
        for (const e of tops) {
            const it = e.item, d = e.def, host = it.on != null ? B.hosts.get(it.on) : null;
            if (it.on != null && !host) continue;
            const x = it.x + d.w / 2, y = host ? host.top : 0, z = host ? host.z : (it.y + 0.5) * R3_ZS;
            const n = typeof EnvItems !== 'undefined' && EnvItems.model(it.id, d.frame);
            if (!n) continue;
            if (d.flower && EnvModels.has('furn_flower_vase')) {
                g.add(this.group('furn_flower_vase', x, y, z));
                const vt = EnvModels.models.furn_flower_vase.anchors.top;
                g.add(this.group(n, x, y + (vt ? vt[0].y : 0.15), z, 0.42));
            } else g.add(this.group(n, x, y, z, EnvItems.size(n, 1.4) * 0.9));
            B.placed.add(e);
        }
        for (const e of rugs) if (this.rug(g, e)) B.placed.add(e);
        for (const e of mans) if (this.mannequin(g, e)) B.placed.add(e);
        for (const e of decos) if (this.deco(g, a, e)) B.placed.add(e);
        // (a stool behind the counter for a folk who works there: 33kc_doll_stools.js)
        EnvStools.build(g, a);
        B.cutTex = B.cutTex || new Map();
        const f = a.floor, wallPx = f.y0 * TILE, H = this.WH, z0 = f.y0 * R3_ZS;
        // what hangs on the wall and has a model (furn_f.py): on the back wall where its picture was, as tall as the
        // picture on the wall's height; a face it carries (a sign's, a poster's, a painting's) wears the picture itself
        const k = H * TILE / wallPx;
        for (const e of list) {
            const P = e.def.kind === 'wall' && this.pic(e.frame);
            if (!P) continue;
            const n = this.model(e), left = e.x - P.ax, top = e.y - P.ay, sq = this.ROUND.has(e.item.id) ? Math.sqrt(k) : 0;
            // (the gilt frame borrowed by another painting: fitted to that picture)
            const fx = n === 'furn_' + e.item.id ? 1 : P.w / TILE / 2, fy = n === 'furn_' + e.item.id ? 1 : P.h / TILE / 1.625;
            const m = new THREE.Matrix4().makeTranslation((left + P.w / 2) / TILE, H * (1 - (top + P.h / 2) / wallPx), z0 + 0.01);
            m.multiply(new THREE.Matrix4().makeScale((e.flip ? -1 : 1) * (sq || 1) * fx, (sq || k) * fy, sq || 1));
            this.parts(g, e, n, m, P);
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
        b.group.traverse(o => this.dispose(o));
        for (const t of b.textures) t.dispose();
    },
    /* what the room made for itself goes when it's made again or left: never the models' own geometry and materials
       (shared), and only the geometry of a mannequin's doll (its materials are the dolls') */
    dispose(o) {
        if (o.userData.shared) return;
        if (o.geometry) o.geometry.dispose();
        if (o.userData.ownGeo) return;
        if (o.material) [].concat(o.material).forEach(m => m.dispose());
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
        if (a.club) this.built.club = this.club(group, a);
    },

    /* ---------------------------------------------------------------- the club */
    /* Club Wasabi (25_house.js buildClubContents): the DJ booth, the speakers and the disco ball as their models, the dance
       floor's tiles lit from below in turn (faster while someone's dancing), beams of colored light sweeping from the
       corners and the ball's sparkles turning over the floor and the back wall, by night or while dancing */
    CLUB_COLS: ['#ff5aa8', '#4ec3d9', '#ffd84a', '#8cc152', '#b37cf0'],
    club(group, a) {
        const C = { placed: new Set(), g: new THREE.Group() }, H = this.WH, f = a.floor, z0 = f.y0 * R3_ZS;
        group.add(C.g);
        const put = (e, n, x, y, z, s) => {
            if (!EnvModels.has(n)) return null;
            const o = new THREE.Group();
            o.position.set(x, y, z);
            if (s) o.scale.setScalar(s);
            for (const m of EnvModels.place(o, n, new THREE.Matrix4())) m.userData.shared = true;
            C.g.add(o);
            if (e) C.placed.add(e);
            return o;
        };
        for (const e of a.ents) {
            if (e.kind === 'booth' && e.frame === 'f_turntables') put(e, 'furn_turntables', e.x / TILE, 0, 2.5 * R3_ZS);
            else if (e.kind === 'deco' && e.frame === 'f_speaker') put(e, 'furn_speaker', e.x / TILE, 0, 2.5 * R3_ZS);
            else if (e.kind === 'deco' && e.frame === 'f_disco_ball') C.ball = put(e, 'furn_disco_ball', e.x / TILE, H - 0.55, z0 + 1.6);
        }
        // the dance floor: a tile of light in each square, its color changed in turn
        const T = this.CLUB_FLOOR = { x0: 4, x1: 10, y0: 5, y1: 8 }, n = (T.x1 - T.x0 + 1) * (T.y1 - T.y0 + 1);
        const geo = new THREE.BoxGeometry(0.92, 0.03, 0.92 * R3_ZS);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xffffff }), { key: 'envclubfloor', inst: true });
        const tiles = C.tiles = new THREE.InstancedMesh(geo, mat, n);
        let i = 0;
        for (let y = T.y0; y <= T.y1; y++) for (let x = T.x0; x <= T.x1; x++) { tiles.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x + 0.5, 0.016, (y + 0.5) * R3_ZS)); tiles.setColorAt(i, new THREE.Color(0x4a3a5a)); i++; }
        tiles.instanceMatrix.needsUpdate = true;
        tiles.frustumCulled = false;
        C.g.add(tiles);
        C.cols = this.CLUB_COLS.map(c => new THREE.Color(c));
        // beams from the back corners and the front ones, and the ball's sparkles
        const add = (o) => { C.g.add(o); return o; };
        const beamMat = (c) => r3Patch(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), { key: 'envclubbeam', noDof: true });
        const bgeo = new THREE.ConeGeometry(0.55, 3.0, 18, 1, true).translate(0, -1.5, 0);
        C.beams = [[f.x0 + 0.4, z0 + 0.3, '#ff5aa8'], [f.x0 + f.w - 0.4, z0 + 0.3, '#4ec3d9'], [f.x0 + 0.6, z0 + f.h * R3_ZS * 0.7, '#ffd84a'], [f.x0 + f.w - 0.6, z0 + f.h * R3_ZS * 0.7, '#b37cf0']].map(([x, z, c], k) => {
            const m = add(new THREE.Mesh(bgeo, beamMat(c)));
            m.position.set(x, H + 0.2, z); m.userData.k = k; m.renderOrder = 3;
            return m;
        });
        const sp = r3Patch(new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }), { key: 'envclubspark', noDof: true });
        const sgeo = new THREE.CircleGeometry(0.045, 8);
        C.sparks = [];
        for (let k = 0; k < 46; k++) {
            const m = add(new THREE.Mesh(sgeo, sp));
            m.userData.wall = k % 3 === 0; m.userData.a = k * 2.39; m.userData.r = 0.6 + (k * 0.37) % 3.4;
            if (!m.userData.wall) m.rotation.x = -Math.PI / 2;
            m.renderOrder = 3;
            C.sparks.push(m);
        }
        C.sparkMat = sp;
        return C;
    },
    clubTick(a) {
        const C = this.built.club, T = this.CLUB_FLOOR, t = G.t, f = a.floor, z0 = f.y0 * R3_ZS, H = this.WH;
        const dancing = Dance.on || Karaoke.on, lit = dancing || G.lamps > 0.3;
        // (the 2D floor's own rhythm: a step every 8 frames while dancing, every 32 otherwise)
        const step = t >> (dancing ? 3 : 5);
        if (step !== C.step || lit !== C.lit) {
            C.step = step; C.lit = lit;
            let i = 0;
            const dim = new THREE.Color(0x4a3a5a), c = new THREE.Color();
            for (let y = T.y0; y <= T.y1; y++) for (let x = T.x0; x <= T.x1; x++) {
                C.tiles.setColorAt(i++, lit ? c.copy(C.cols[(x + y + step) % C.cols.length]).multiplyScalar(0.85) : dim);
            }
            C.tiles.instanceColor.needsUpdate = true;
        }
        if (C.ball) C.ball.rotation.y = t / 90;
        const cx = (T.x0 + T.x1 + 1) / 2, cz = (T.y0 + T.y1 + 1) / 2 * R3_ZS;
        for (const b of C.beams) {
            b.visible = lit;
            if (!lit) continue;
            const k = b.userData.k, an = t / (dancing ? 50 : 110) + k * 1.6;
            const tx = cx + Math.cos(an) * 2.6, tz = cz + Math.sin(an * 1.3) * 1.2;
            b.lookAt(tx, 0, tz); b.rotateX(-Math.PI / 2);
            b.material.opacity = (dancing ? 0.13 : 0.08) * (0.75 + 0.25 * Math.sin(t / 9 + k));
        }
        const bx = C.ball ? C.ball.position.x : cx;
        for (const m of C.sparks) {
            m.visible = lit;
            if (!lit) continue;
            const an = m.userData.a + t / 160, r = m.userData.r;
            if (m.userData.wall) m.position.set(bx + Math.cos(an) * r * 1.3, 0.5 + ((Math.sin(an) * 0.5 + 0.5) * (H - 0.8)), z0 + 0.02);
            else m.position.set(bx + Math.cos(an) * r, 0.04, cz + Math.sin(an) * r * 0.55 * R3_ZS);
        }
        C.sparkMat.opacity = dancing ? 0.85 : 0.55;
    },
};
