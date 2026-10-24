/* ---- 31_render3d.js ---- */
/* HD-2D: the same island, drawn as a little 3D world (three.js, where the device has WebGL). The ground (today's
   island picture, paths, rugs...) lies flat; everything that stands (people, trees, houses, furniture) is a card
   standing up on its spot, drawn by its own 2D draw code into a small canvas. A perspective camera looks from the
   south, the world bends away towards a horizon with sky, a sun from the top left casts soft shadows, and a post
   pass adds depth of field, bloom and a warm grade (the same recipe as the art sample David picked).
   The grid is still the grid: the 2D renderer (30_render.js) draws the edit modes (moving buildings, paths,
   decorating), the dance floor, karaoke, jump rope and photos, and every device without WebGL. */
const R3 = {
    ok: false, want: true, drawingCard: false, hdCard: false, hdSeen: false, sig: null, sigN: 0, failed: false,
    renderer: null, scene: null, camera: null, canvas: null,
    sun: null, hemi: null, fill: null, lamps: [], sky: null, sea: null,
    ground: null, wall: null, cards: new Map(), chunks: new Map(), pool: {}, poolUsed: {}, areaId: null, t0: 0, view: null, measured: 0,
    target: { x: 0, z: 0 }, quality: 1, slow: [], stepped: false,
    /* the device can do it and the player hasn't turned it off */
    load() {
        try { const v = localStorage.getItem('sc_gfx'); if (v === 'classic') this.want = false; } catch (e) { /* ignore */ }
    },
    setWant(on) {
        this.want = !!on;
        try { localStorage.setItem('sc_gfx', on ? 'hd' : 'classic'); } catch (e) { /* ignore */ }
        if (on && !this.ok && !this.failed) this.init();
        this.show(this.active());
    },
    available() { return this.ok || (!this.failed && typeof THREE !== 'undefined' && hasWebGL()); },
    /* HD-2D draws ordinary play; the grid-and-tools modes and the minigames on the island use the flat view */
    active() {
        if (!this.ok || !this.want || !G.area || !G.player) return false;
        if (G.mode !== 'play' && G.mode !== 'title') return false;
        if (Decor.on || Mover.on || PathTool.on || IslandEdit.on || Dance.on || Karaoke.on || Rope.on || Photo.on) return false;
        return !G.area.club;
    },
    init() {
        if (this.ok || this.failed) return this.ok;
        if (typeof THREE === 'undefined' || !hasWebGL()) { this.failed = true; return false; }
        try {
            const cv = document.createElement('canvas');
            cv.id = 'game3d';
            cv.setAttribute('aria-hidden', 'true');
            $('#app').insertBefore(cv, $('#game'));
            this.canvas = cv;
            // the weather and the lighthouse beam get a canvas of their own at the screen's resolution (the overlay is in game
            // pixels), under the overlay so fades still cover it
            const wx = document.createElement('canvas');
            wx.id = 'wx3d'; wx.setAttribute('aria-hidden', 'true');
            $('#app').insertBefore(wx, $('#game'));
            this.wx = wx;
            const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' });
            r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
            r.setClearColor(0x3a8fd0, 1);
            this.renderer = r;
            // phones and tablets get the handheld rules: less drawn at once, fewer shadow updates, a lighter picture
            let coarse = false;
            try { coarse = matchMedia('(pointer: coarse)').matches; } catch (e) { /* old browser */ }
            this.phone = coarse || Math.min(screen.width, screen.height) < 600;
            Post3.init(r);
            Object.assign(R3U, { tRefl: { value: null }, uReflMat: { value: new THREE.Matrix4() }, uRefl: { value: 0 } });
            const scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0xcfe2e8, 40, 140);
            this.scene = scene;
            this.camera = new THREE.PerspectiveCamera(R3_CAM.fov, 1, 0.5, 1500);
            const sun = new THREE.DirectionalLight(0xffebc8, 0.78);
            sun.castShadow = true;
            const sm = this.phone ? 1024 : 2048;
            sun.shadow.mapSize.set(sm, sm);
            Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
            sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 2.5;
            scene.add(sun, sun.target);
            this.sun = sun;
            this.hemi = new THREE.HemisphereLight(0xb0caee, 0x8a7c56, 0.46);
            this.fill = new THREE.DirectionalLight(0xffe2c4, 0.14);
            this.fill.position.set(0.2, 0.5, 1);
            scene.add(this.hemi, this.fill);
            // always six lamps (dimmed to nothing by day): changing how many lights there are would recompile every material
        for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffd8a0, 0, 7, 1.6); l.position.set(0, -50, 0); scene.add(l); this.lamps.push(l); }
            this.sky = r3Sky(scene);
            this.sea = r3Sea(scene);
            this.ok = true;
            addEventListener('resize', () => this.resize());
            if (window.visualViewport) visualViewport.addEventListener('resize', () => this.resize());
            this.resize();
            return true;
        } catch (e) {
            console.error('HD-2D could not start (using the classic view)', e);
            this.failed = true; this.ok = false;
            if (this.canvas) this.canvas.remove();
            return false;
        }
    },
    show(on) {
        if (!this.canvas) return;
        this.canvas.style.display = this.wx.style.display = on ? 'block' : 'none';
        /* the HUD and dialogue take the art sample's dark glass while the HD-2D view shows */
        if (this.shown !== on) { this.shown = on; document.body.classList.toggle('hd2d', on); }
    },
    resize() {
        if (!this.ok) return;
        const app = $('#app'), w = app.clientWidth, h = app.clientHeight;
        const maxPx = (this.phone ? 1.9e6 : 3.2e6) * this.quality;
        const p = Math.max(0.5, Math.min(devicePixelRatio || 1, Math.sqrt(maxPx / Math.max(1, w * h))));
        this.renderer.setPixelRatio(p);
        this.renderer.setSize(w, h, false);
        this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
        const wp = Math.min(devicePixelRatio || 1, 2);
        this.wx.width = Math.round(w * wp); this.wx.height = Math.round(h * wp); this.wx.style.width = w + 'px'; this.wx.style.height = h + 'px';
        this.camera.aspect = w / Math.max(1, h);
        this.camera.updateProjectionMatrix();
        Post3.resize(Math.round(w * p), Math.round(h * p));
    },

    /* ---------------------------------------------------------------- the camera and the bend */
    dist() { return R3_CAM.dist * [0.78, 1, 1.32, 1.7][G.area && G.area.interior ? Math.min(Zoom.level(), 1) : Zoom.level()]; },
    pitch() { return (G.area && G.area.interior ? R3_CAM.pitchIn : R3_CAM.pitch) * Math.PI / 180; },
    placeCamera(snap) {
        const a = G.area, p = G.player;
        let tx = p.x, ty = p.y - 10;
        if (G.camTarget) { tx = G.camTarget[0]; ty = G.camTarget[1]; }
        // on an upright phone, look a little ahead (north) so Sarah stands in the lower part of the screen with the world
        // above her, as in the art sample, rather than over a half-screen of ground at her feet
        else if (this.camera.aspect < 1) ty -= (1 - this.camera.aspect) * R3_CAM.lead * TILE;
        if (a.interior) { tx = a.w * TILE / 2; ty = (a.floor.y0 + a.floor.h * 0.55) * TILE; }
        const X = tx / TILE, Z = ty / TILE * R3_ZS, GH = a.interior ? 0 : r3GroundH(tx, ty + 10);
        if (snap || this.areaId !== a.id) { this.target.x = X; this.target.z = Z; this.camH = GH; }
        else {
            // (the same follow however often the screen redraws)
            const f = Math.min(4, (G.frameMs || 1000 / 60) / (1000 / 60)), k = 1 - Math.pow(0.86, f), kh = 1 - Math.pow(0.92, f);
            this.target.x += (X - this.target.x) * k; this.target.z += (Z - this.target.z) * k; this.camH += (GH - (this.camH || 0)) * kh;
        }
        const pr = this.pitch(), d = this.dist(), cam = this.camera;
        // (up on the plateau, the camera rises with her)
        cam.position.set(this.target.x, R3_CAM.ly + d * Math.sin(pr) + (this.camH || 0), this.target.z + d * Math.cos(pr));
        cam.rotation.set(-pr, 0, 0);
        cam.updateMatrixWorld();
        R3U.uBendZ.value = this.target.z - (a.interior ? 999 : R3_CAM.bendStart);
        R3U.uBendK.value = a.interior ? 0 : R3_CAM.bendK;
        const k = d / 13;
        R3U.uDof.value.set(22 * k, 70 * k, 8.5 * k, 5.5 * k);
        // the sun's shadow box follows the camera
        const sd = new THREE.Vector3(-0.55, 0.78, 0.32).normalize();
        this.sun.target.position.set(this.target.x, 0, this.target.z - 4);
        this.sun.position.copy(sd).multiplyScalar(50).add(this.sun.target.position);
        this.sun.target.updateMatrixWorld();
    },
    /* how big an HD pixel is on the screen: below about two screen pixels, nearest-pixel sampling makes uneven pixels
       (some one wide, some two), so the HD cards are smoothed instead */
    texelSize() {
        const p = G.player;
        if (!p) return;
        const q = this.project(p.x, p.y, 0), px = q.s * (G.view.cssScale || 1) * this.renderer.getPixelRatio() / HD_K;
        const lin = px < 2.2;
        if (lin === this.texLinear) return;
        this.texLinear = lin;
        const f = lin ? THREE.LinearFilter : THREE.NearestFilter;
        const all = [...this.cards.values()].concat(...Object.values(this.pool));
        for (const c of all) if (c.res > 1) { c.tex.magFilter = f; c.tex.needsUpdate = true; }
    },
    /* world pixels (x, y, and a height above the ground) -> overlay canvas pixels, and how many of those make one world pixel there */
    project(x, y, lift) {
        const v = G.view;
        const P = this._p || (this._p = new THREE.Vector3()), Q = this._q || (this._q = new THREE.Vector3());
        const Z = y / TILE * R3_ZS, bd = Math.max(0, R3U.uBendZ.value - Z), drop = R3U.uBendK.value * bd * bd, gh = r3GroundH(x, y);
        P.set(x / TILE, (lift || 0) / TILE * R3_VS - drop + gh, Z).project(this.camera);
        Q.set(x / TILE + 1, (lift || 0) / TILE * R3_VS - drop + gh, Z).project(this.camera);
        const sx = (P.x + 1) / 2 * v.w, sy = (1 - P.y) / 2 * v.h;
        return { x: sx, y: sy, s: Math.abs((Q.x - P.x) / 2 * v.w) / TILE, behind: P.z > 1 };
    },
    /* overlay canvas pixels -> world pixels on the (bent) ground */
    unproject(sx, sy, orNull) {
        const v = G.view, cam = this.camera;
        const ndc = new THREE.Vector3(sx / v.w * 2 - 1, 1 - sy / v.h * 2, 0.5).unproject(cam);
        const o = cam.position, dir = ndc.sub(o).normalize();
        // (the ground is bent away towards the horizon, and raised where the island is higher: march along until below it)
        const f = t => { const yy = o.y + dir.y * t, zz = o.z + dir.z * t, bd = Math.max(0, R3U.uBendZ.value - zz); return yy + R3U.uBendK.value * bd * bd - r3GroundH((o.x + dir.x * t) * TILE, zz / R3_ZS * TILE); };
        let lo = 0, hi = 0;
        for (let t = 0.5; t < 600; t += Math.max(0.25, t * 0.04)) { if (f(t) <= 0) { hi = t; break; } lo = t; }
        if (!hi) return orNull ? null : [G.player.x, G.player.y];
        for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
        return [(o.x + dir.x * hi) * TILE, (o.z + dir.z * hi) / R3_ZS * TILE];
    },
    /* draw something written for the flat view (an emote, a splash, the fishing line) where it now stands */
    localTransform(ctx, x, y, lift) {
        const p = this.project(x, y, lift);
        ctx.setTransform(p.s, 0, 0, p.s, p.x - x * p.s, p.y - y * p.s);
        return p;
    },

    /* ---------------------------------------------------------------- a frame */
    render() {
        if (!this.ok) return false;
        const a = G.area;
        try {
            if (this.areaId !== a.id || this.ground === null) this.newArea(a);
            // (drawn more often than the game steps: what's done every few steps is done once for that step)
            const step = this._step !== G.frame;
            this._step = G.frame;
            this.placeCamera(false);
            if (!this.view || (step && G.frame % 4 === 0)) this.updateView();
            if (step && G.frame % 30 === 0) this.texelSize();
            hdWarm();
            this.updateGround(a);
            this.updateTufts(a);
            this.updateLilies(a);
            this.updateLight(a);
            this.updateCards(a);
            R3U.uTime.value = (performance.now() - this.t0) / 1000;
            if (step && G.frame % (this.phone ? 3 : 2) === 0 && this.shadowsOn !== false) this.renderer.shadowMap.needsUpdate = true;
            if (!this.warmed) this.warmPrograms();
            R3Mirror.render(this, a);
            Post3.render(this.scene, this.camera, R3U.uTime.value, this.grade);
            this.overlay();
            this.watchSpeed();
            return true;
        } catch (e) {
            // never leave Sarah looking at a blank screen: fall back to the classic view for this visit
            console.error('HD-2D stopped (using the classic view)', e);
            this.failed = true; this.ok = false; this.show(false);
            return false;
        }
    },
    /* if this device struggles, step down once: a smaller picture */
    watchSpeed() {
        if (this.stepped) return;
        const now = performance.now();
        if (this._last) this.slow.push(now - this._last);
        this._last = now;
        if (this.slow.length < 150) return;
        const avg = this.slow.slice(40).reduce((s, d) => s + d, 0) / (this.slow.length - 40);
        this.stepped = true;
        if (avg > 24) { this.quality = 0.6; this.resize(); }
    },
    /* every kind of card material made once, up front: a material that shows up later in a new way (a tree going
       see-through the first time, a building's sides) would otherwise be compiled in the middle of a walk */
    warmPrograms() {
        this.warmed = true;
        const g = new THREE.PlaneGeometry(0.01, 0.01), cv = document.createElement('canvas');
        cv.width = cv.height = 2;
        const tex = new THREE.CanvasTexture(cv), keep = this._warm = [];
        for (const [faded, at, glow] of [[0, 0.5], [1, 0.05], [0, 0], [1, 0], [0, 0.5, 1], [1, 0.05, 1]]) {
            const m = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: at, side: THREE.DoubleSide, color: 0xdedede }), { key: 'card' });
            if (glow) { m.emissiveMap = tex; m.emissive = new THREE.Color(0xffffff); }
            if (faded) { m.transparent = true; m.opacity = 0.5; m.depthWrite = false; }
            const me = new THREE.Mesh(g, m);
            me.castShadow = me.receiveShadow = true; me.customDepthMaterial = r3Depth(tex); me.frustumCulled = false;
            me.position.set(this.target.x, -50, this.target.z);
            this.scene.add(me); keep.push(me);
        }
        try { this.renderer.compile(this.scene, this.camera); } catch (e) { console.error(e); }
        // (taken out again, the materials kept so their programs stay)
        for (const me of keep) this.scene.remove(me);
    },
    newArea(a) {
        for (const c of this.cards.values()) this.dropCard(c);
        this.cards.clear();
        for (const k of Object.keys(this.pool)) for (const c of this.pool[k]) c.mesh.visible = false;
        if (this.ground && this.ground.mesh) { this.scene.remove(this.ground.mesh); this.ground.mesh.geometry.dispose(); this.ground.mat.dispose(); this.ground.tex.dispose(); }
        this.ground = null;
        if (this.wall) { this.scene.remove(this.wall.mesh); this.wall.mesh.geometry.dispose(); this.wall.mat.dispose(); this.wall.tex.dispose(); this.wall = null; }
        for (const ch of this.chunks.values()) dropChunk(ch);
        this.chunks.clear();
        this.ground = a.interior ? r3Ground(this.scene, a) : { chunked: true, at: null };
        if (a.interior) this.wall = r3Wall(this.scene, a);
        this.sky.visible = !a.interior;
        this.sea.visible = !a.interior;
        this.areaId = a.id;
        this.t0 = this.t0 || performance.now();
        this.placeCamera(true);
        this.ground.at = null;
    },

    /* grass on the island: refilled when the view has moved a couple of tiles, redrawn when the season changes */
    updateTufts(a) {
        let t = this.tufts;
        if (a.interior || a.id !== 'island' || !this.view) { if (t) t.mesh.visible = false; return; }
        const season = a.bgSeason || Clock.season();
        const gk = R3_GRASS[season] || R3_GRASS.summer;
        R3U.uGrass.value.set(gk[0], gk[1], gk[2], 1);
        if (t && t.season !== season) { this.scene.remove(t.mesh); t.geo.dispose(); t.mat.dispose(); t.tex.dispose(); t = this.tufts = null; }
        if (!t) t = this.tufts = r3Tufts(this.scene, season);
        t.mesh.visible = true;
        const V = this.view, cx = (V.x0 + V.x1) / 2, cy = (V.y0 + V.y1) / 2;
        if (!t.at || Math.abs(cx - t.at[0]) > 2 * TILE || Math.abs(cy - t.at[1]) > 2 * TILE || Math.abs(V.x1 - V.x0 - t.at[2]) > 3 * TILE) {
            t.at = [cx, cy, V.x1 - V.x0];
            r3FillTufts(t, a, V);
        }
    },
    /* lily pads on the ponds (not in winter), refilled with the grass */
    updateLilies(a) {
        let l = this.lilies;
        const on = !a.interior && a.id === 'island' && this.view && (a.bgSeason || Clock.season()) !== 'winter';
        if (!on) { if (l) l.mesh.visible = false; return; }
        if (!l) l = this.lilies = r3Lilies(this.scene);
        l.mesh.visible = true;
        const t = this.tufts;
        if (t && t.at && l.at !== t.at) { l.at = t.at; r3FillLilies(l, a, this.view); }
    },

    /* ---------------------------------------------------------------- a room's floor (with three pixels to one for the HD art) */
    updateGround(a) {
        if (!a.interior) return this.updateChunks(a);
        const g = this.ground;
        if (g.at && G.frame % 60 !== 0 && !g.dirty) return;
        g.dirty = false; g.at = [0, 0];
        const k = g.k, ctx = g.ctx, bg = r3RoomBg(a, k);
        // a new wallpaper or floor (decorating): the back wall too
        if (this.wall && this.wall.from !== a.bg) { this.scene.remove(this.wall.mesh); this.wall.mesh.geometry.dispose(); this.wall.mat.dispose(); this.wall.tex.dispose(); this.wall = r3Wall(this.scene, a); }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, g.cv.width, g.cv.height);
        if (bg) {
            // the floor only: the back wall stands up on its own (r3Wall)
            const top = a.floor ? a.floor.y0 * TILE * k : 0;
            ctx.drawImage(bg, 0, top, bg.width, bg.height - top, 0, top, bg.width, bg.height - top);
        }
        ctx.setTransform(k, 0, 0, k, 0, 0);
        // things hung on the back wall (shelves, signs, clocks, mirrors) go on the wall that stands up, not on the floor
        // behind it; the rest lies on the floor
        const w = this.wall, top = w && a.floor ? a.floor.y0 * TILE : -1;
        if (w) {
            w.ctx.setTransform(1, 0, 0, 1, 0, 0);
            w.ctx.clearRect(0, 0, w.cv.width, w.cv.height);
            if (bg) w.ctx.drawImage(bg, 0, 0, w.cv.width, w.cv.height, 0, 0, w.cv.width, w.cv.height);
            w.ctx.setTransform(k, 0, 0, k, 0, 0);
        }
        this.drawingCard = true; this.hdCard = k > 1;
        try {
            if (a.drawUnder) a.drawUnder(ctx);
            for (const d of a.decals) spr(ctx, d.frame, d.x, d.y);
            for (const e of a.ents) if (e.layer === 0 && !e.hidden) drawEnt(e.y < top ? w.ctx : ctx, e);
        } finally { this.drawingCard = false; this.hdCard = false; }
        if (w) w.tex.needsUpdate = true;
        g.mesh.position.set(g.cv.width / k / TILE / 2, 0, g.cv.height / k / TILE / 2 * R3_ZS);
        g.tex.needsUpdate = true;
    },

    /* the island's ground: 16x16-tile pieces, painted when they come into view (and refreshed one at a time, so
       paths and things on the ground show up), dropped when far away */
    updateChunks(a) {
        const V = this.view;
        const cx0 = Math.max(0, Math.floor(V.x0 / R3_CHUNK)), cx1 = Math.min(Math.ceil(a.w * TILE / R3_CHUNK) - 1, Math.floor(V.x1 / R3_CHUNK));
        const cy0 = Math.max(0, Math.floor(V.y0 / R3_CHUNK)), cy1 = Math.min(Math.ceil(a.h * TILE / R3_CHUNK) - 1, Math.floor(V.y1 / R3_CHUNK));
        let made = 0;
        const want = new Set(), order = [], mx = this.target.x * TILE / R3_CHUNK - 0.5, my = this.target.z / R3_ZS * TILE / R3_CHUNK - 0.5;
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) order.push([cx, cy, (cx - mx) * (cx - mx) + (cy - my) * (cy - my)]);
        order.sort((p, q) => p[2] - q[2]);                  // nearest first: after a jump, the ground at Sarah's feet comes first
        for (const [cx, cy] of order) {
            const k = cx + ',' + cy;
            want.add(k);
            let ch = this.chunks.get(k);
            if (!ch) {
                if (made >= (this.phone ? 1 : 3) && this.chunks.size) continue;        // a few new pieces a frame (each one a few ms)
                ch = makeChunk(this.scene, cx, cy);
                this.chunks.set(k, ch);
                paintChunk(ch, a);
                made++;
            }
            ch.mesh.visible = true;
            ch.used = G.frame;
        }
        for (const [k, ch] of this.chunks) if (!want.has(k)) { ch.mesh.visible = false; if (G.frame - ch.used > 600 && this.chunks.size > 40) { dropChunk(ch); this.chunks.delete(k); } }
        // one visible piece repainted every few frames (or all of them after the flat view was used to change things, or
        // the season changed the ground: then two a frame until they're done; and any painted before the ground's pieces
        // under them had arrived, once they have)
        Ground.around(a.bgSeason, (V.x0 + V.x1) / 2, (V.y0 + V.y1) / 2, Math.max(V.x1 - V.x0, V.y1 - V.y0) / 2 + R3_CHUNK);
        if (this.ground.dirty || this._gseason !== a.bgSeason) { for (const ch of this.chunks.values()) ch.stale = true; this.ground.dirty = false; this._gseason = a.bgSeason; this._stale = true; }
        if (this._gver !== Ground.ver) { this._gver = Ground.ver; for (const ch of this.chunks.values()) if (ch.partial) { ch.stale = true; this._stale = true; } }
        if (this._stale) {
            const stale = [...this.chunks.values()].filter(ch => ch.mesh.visible && ch.stale);
            for (const ch of stale.slice(0, this.phone ? 1 : 2)) { paintChunk(ch, a); ch.stale = false; }
            this._stale = stale.length > (this.phone ? 1 : 2);
        } else if ((this._rt = (this._rt || 0) + 1) % 6 === 0) {
            const vis = [...this.chunks.values()].filter(ch => ch.mesh.visible);
            const ch = vis[(this._rr = ((this._rr || 0) + 1)) % Math.max(1, vis.length)];
            if (ch) paintChunk(ch, a);
        }
    },
    /* how far anything is drawn (fog fades things out before it): the handheld games' trick, shorter on phones */
    farTiles() { return (this.phone ? R3_FAR.phone : R3_FAR.full) * this.dist() / 13; },
    /* the part of the world on screen (with some room around it), in world pixels */
    updateView() {
        const v = G.view;
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, missed = false;
        // a few points down the screen: the top ones may look past the horizon (then the far edge is as far as anything shows)
        for (const fy of [0, 0.08, 0.18, 0.32, 0.55, 1]) for (const fx of [0, 0.5, 1]) {
            const w = this.unproject(fx * v.w, fy * v.h, true);
            if (!w) { missed = true; continue; }
            x0 = Math.min(x0, w[0]); x1 = Math.max(x1, w[0]); y0 = Math.min(y0, w[1]); y1 = Math.max(y1, w[1]);
        }
        const tx = this.target.x * TILE, ty = this.target.z / R3_ZS * TILE, far = this.farTiles() * TILE;
        if (missed || y0 > ty - 6 * TILE) y0 = ty - far;
        if (missed) { const half = far * Math.max(0.7, this.camera.aspect) * 0.75; x0 = Math.min(x0, tx - half); x1 = Math.max(x1, tx + half); }
        y0 = Math.max(y0, ty - far);
        x0 = Math.max(x0, tx - far); x1 = Math.min(x1, tx + far);
        const m = 2 * TILE;
        this.view = { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + 3 * TILE };
    },

    /* ---------------------------------------------------------------- the light: the island's hour and weather */
    updateLight(a) {
        const h = Clock.hourF();
        const L = a.interior ? { col: [60, 44, 90], alpha: Math.min(0.42, lightAt(h, 'sunny').alpha * 0.8), gray: 0, lamps: 1 } : lightAt(h, G.weather);
        G.lamps = L.lamps;
        const dark = Math.min(1, L.alpha * 1.65);
        G.lightStrength = dark;
        const tint = new THREE.Color(L.col[0] / 255, L.col[1] / 255, L.col[2] / 255);
        const day = 1 - dark, gray = L.gray;
        this.sun.intensity = a.interior ? 0.32 : (0.72 * day + 0.04) * (1 - gray * 1.6);
        this.sun.color.setRGB(1, 0.92 + 0.04 * day, 0.78 + 0.12 * day).lerp(tint, dark * 0.6);
        // the sun always casts shadows (switching that off at dusk would rebuild every material at once, a long stall): they
        // fade out as the light goes, and by night the shadow map isn't redrawn
        R3U.uShadow.value = a.interior ? 1 : Math.max(0, Math.min(1, (day - 0.1) / 0.2));
        this.shadowsOn = R3U.uShadow.value > 0;
        this.hemi.intensity = 0.38 + 0.08 * day;
        this.hemi.color.setRGB(0.69, 0.79, 0.93).lerp(tint, dark * 0.8);
        this.hemi.groundColor.setRGB(0.54, 0.49, 0.34).lerp(tint, dark * 0.8);
        const fog = new THREE.Color(R3_FOG.col[0], R3_FOG.col[1], R3_FOG.col[2]).lerp(new THREE.Color(0.62, 0.66, 0.7), gray).lerp(tint, dark * 0.85);
        this.scene.fog.color.copy(fog);
        if (a.interior) { this.scene.fog.near = 200; this.scene.fog.far = 400; }
        else { const f = this.farTiles() * R3_ZS, d = this.dist(); this.scene.fog.near = d + f * R3_FOG.near; this.scene.fog.far = d + f * R3_FOG.far; }
        this.renderer.setClearColor(a.interior ? 0x231b2e : fog, 1);
        if (this.sky.material.uniforms) {
            const u = this.sky.material.uniforms;
            // (a snowy day's sky is an even pale white, though the light stays bright)
            const snow = !a.interior && G.weather === 'snow' ? 0.6 * day : 0, pale = new THREE.Color(0.8, 0.85, 0.91);
            u.uZen.value.setRGB(0.25, 0.5, 0.8).lerp(new THREE.Color(0.08, 0.1, 0.25), dark).lerp(new THREE.Color(0.5, 0.55, 0.6), gray).lerp(pale, snow);
            u.uMid.value.setRGB(0.53, 0.74, 0.89).lerp(tint, dark * 0.9).lerp(new THREE.Color(0.66, 0.7, 0.74), gray).lerp(pale, snow);
            u.uHor.value.copy(fog);
            u.uDay.value = day * (1 - gray * 0.4);
        }
        this.grade = { dark, gray };
        // lit windows: from dusk, brighter as it gets darker, until whoever lives there goes to bed (Sarah leaves hers on)
        const glow = a.interior ? 0 : Math.max(0, Math.min(1, (dark - 0.25) / 0.45)) * 0.85;
        const hr = Clock.hourF(), late = hr >= 0 && hr < 5;
        if (glow !== this._glow || (this._glowT = (this._glowT || 0) + 1) % 10 === 0) for (const c of this.cards.values()) {
            // holiday lanterns (jack-o'-lanterns, paper lanterns, heart lamps) glow too
            if (c.e && c.e.holiday && c.e.light && c.mat && c.mat.emissive) { c.mat.emissive.setRGB(0.55, 0.32, 0.12).multiplyScalar(glow * 0.8); continue; }
            if (!c.glow) continue;
            const id = c.e && c.e.id, n = id && id.startsWith('h_') ? NPCs.get(id.slice(2)) : null;
            // (shops until midnight, the club all night)
            c.glow.emissiveIntensity = n ? (n.sleeping ? 0 : glow) : id === 'home' || id === 'club' || !late ? glow : 0;
        }
        this._glow = glow;
        // lamps: the nearest few light up at night
        if (G.frame % 15 !== 0 && this._lampsFor === a.id) return;
        this._lampsFor = a.id;
        const lit = L.lamps > 0.02 ? lightSources(a).map(s => ({ s, d: Math.hypot(s[0] / TILE - this.target.x, s[1] / TILE * R3_ZS - this.target.z) })).sort((p, q) => p.d - q.d).slice(0, this.lamps.length) : [];
        this.lamps.forEach((l, i) => {
            const o = lit[i];
            if (!o) { l.intensity = 0; return; }
            const [x, y, r, c] = o.s;
            l.position.set(x / TILE, 1.4, y / TILE * R3_ZS + 0.3);
            l.distance = Math.max(4, r / TILE * 2.2);
            l.intensity = L.lamps * (a.interior ? 0.9 : 1.2);
            l.color.set(c === 'pink' ? 0xff6ab0 : c === 'fire' ? 0xff9a50 : 0xffd8a0);
        });
    },

    /* ---------------------------------------------------------------- the cards */
    updateCards(a) {
        const nightNow = hourIn(Clock.hourF(), 21, 27);
        const V = this.view, wide = a.interior ? 1e9 : 0;
        // only what's on screen (and a little around it): like the handheld games, a few dozen things at a time
        const near = e => wide || !(e.x < V.x0 - 2 * TILE || e.x > V.x1 + 2 * TILE || e.y < V.y0 || e.y > V.y1 + 4 * TILE);
        const seen = new Set();
        this.measured = 0;
        const tx = G.player.x, ty = G.player.y;
        const todo = [];
        for (const e of a.ents) {
            if (e.hidden || e.layer === 0 || (e.onlyNight && !nightNow) || !near(e)) continue;
            seen.add(e);
            if (!this.cards.has(e)) { todo.push(e); continue; }
            this.staticCard(e, a);
        }
        // new things are measured a few at a time, nearest first, so walking somewhere new never hitches
        if (todo.length) {
            todo.sort((p, q) => Math.abs(p.x - tx) + Math.abs(p.y - ty) - Math.abs(q.x - tx) - Math.abs(q.y - ty));
            for (const e of todo.slice(0, this.phone ? 6 : 12)) this.staticCard(e, a);
        }
        for (const c of this.cards.values()) if (!seen.has(c.e)) { if (++c.away > 120) { this.dropCard(c); this.cards.delete(c.e); } else c.mesh.visible = false; }
        // people, critters and anything that moves: pooled cards, drawn fresh every frame
        for (const k of Object.keys(this.poolUsed)) this.poolUsed[k] = 0;
        const movers = [];
        for (const n of NPCs.here()) if (!n.hidden) movers.push(['p', n]);
        if (G.player && !G.player.hidden) movers.push(['p', G.player]);
        for (const o of Online.here()) movers.push(['p', o]);
        // critters get HD cards (three pixels to one; tall ones for high fliers), and so do boats and dolphins
        if (a.id === 'island') { for (const c of Critters.ents()) movers.push([(c.alt || 0) > 30 ? 'h' : 'c', c]); for (const s of SeaSky.ents()) movers.push([s.alt ? 'f' : 's', s]); for (const b of Flutter.ents()) movers.push([(b.alt || 0) > 30 ? 'h' : 'c', b]); }
        for (const f of G.fx) if (f.sorted) movers.push(['f', f]);
        for (const [k, e] of movers) if (near(e)) this.movingCard(k, e, a);
        for (const k of Object.keys(this.pool)) this.pool[k].forEach((c, i) => { if (i >= this.poolUsed[k]) c.mesh.visible = false; });
    },
    /* a card for something that stays put: its size is measured once, it is redrawn when it changes */
    staticCard(e, a) {
        let c = this.cards.get(e);
        // buildings are real shapes: walls, a roof that slopes back, sides you see in perspective (r3Volume)
        if (e.kind === 'building' && !a.interior && (c ? c.vol : r3VolSpec(e))) {
            if (c && (c.frame !== e.frame || (c.waiting && (c.tries = (c.tries || 0) + 1) % 10 === 0 && hdNamed(e.frame)))) { this.dropCard(c); this.cards.delete(e); c = null; }
            if (!c) { c = r3Volume(e, this.scene); if (!c) return; this.cards.set(e, c); }
            c.away = 0;
            c.mesh.position.set(Math.round(e.x) / TILE, r3GroundH(e.x, e.y - 1), e.y / TILE * R3_ZS);
            c.mesh.visible = true;
            c.setFade(seeThroughRaw(e));
            return;
        }
        const sig = e.draw ? null : `${e.frame}|${e.flip}|${e.shake || 0}`;
        if (!c) {
            const b = measureEnt(e);
            if (!b) return;
            c = makeCard(b.w, b.h, b.ax, b.ay, this.scene, b.hd ? HD_K : 1);
            c.e = e; c.sig = undefined; c.drawn = -999;
            const tall = b.ay - Math.max(0, b.ay - b.h);
            if (tall <= 20 && b.w >= 22) c.mesh.rotation.x = -0.95;
            else if (tall <= 26 && b.w >= 34) c.mesh.rotation.x = -0.6;
            this.cards.set(e, c);
        }
        c.away = 0;
        const key = sig != null ? sig : `${e.frame}|${e.shake || 0}|${e.fresh || 0}|${e.flip}`;
        const every = e.anim || e.kind === 'item' ? 4 : 12;
        const due = sig != null ? sig !== c.sig : (key !== c.sig || (!c.still && G.frame - c.drawn >= every) || G.frame - c.drawn >= 300);
        if (due) {
            R3.hdPending = false;
            drawCard(c, e);
            // its HD picture wasn't ready (this frame's drawing time was spent): draw it again soon
            if (R3.hdPending) { c.sig = '(waiting)'; c.drawn = G.frame; placeCard(c, e, a); c.setFade(seeThroughRaw(e)); return; }
            // a hand-drawn thing whose picture came out the same three times running is treated as still
            if (sig == null) { const h = cardHash(c); c.same = h === c.hash ? (c.same || 0) + 1 : 0; c.hash = h; c.still = c.same >= 3 && !e.anim; }
            c.sig = key; c.drawn = G.frame;
        }
        placeCard(c, e, a);
        // trees and statues go see-through while Sarah is behind them
        const fade = seeThroughRaw(e);
        c.setFade(fade);
    },
    movingCard(k, e, a) {
        const list = this.pool[k] || (this.pool[k] = []);
        const i = this.poolUsed[k] = (this.poolUsed[k] || 0) + 1;
        let c = list[i - 1];
        // people get three canvas pixels to a world pixel, for the HD art (32_hd.js)
        if (!c) {
            c = k === 'p' ? makeCard(48, 72, 24, 62, this.scene, HD_K) : k === 'c' ? makeCard(48, 64, 24, 56, this.scene, HD_K) : k === 'h' ? makeCard(48, 150, 24, 140, this.scene, HD_K)
                : k === 's' ? makeCard(64, 44, 32, 36, this.scene, HD_K) : makeCard(80, 150, 40, 140, this.scene);
            c.pooled = true; list.push(c);
        }
        if (c.lastE !== e || c.lastF !== G.frame) { drawCard(c, e); c.lastE = e; c.lastF = G.frame; }
        placeCard(c, e, a);
        c.setFade(1);
        c.mesh.castShadow = !(e.alt > 6);
    },
    dropCard(c) {
        if (c.dispose) return c.dispose();
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose(); c.mat.dispose(); c.tex.dispose(); if (c.depth) c.depth.dispose();
    },

    /* ---------------------------------------------------------------- what's drawn over the 3D view (in the old canvas) */
    overlay() {
        const ctx = Render.ctx, v = G.view;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, v.w, v.h);
        // things written for the flat view, each drawn where it now stands
        for (const f of G.fx) if (!f.sorted && !f.screen && f.x != null) { this.localTransform(ctx, f.x, f.y || 0, 0); f.draw(ctx); }
        r3SkyThings(ctx);
        r3Overheads(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        r3Sharp();
        if (G.area.id === 'island') r3FlutterLights(ctx);
        for (const f of G.fx) if (f.screen) f.draw(ctx);
        if (G.flash) { ctx.fillStyle = `rgba(255,246,214,${G.flash})`; ctx.fillRect(0, 0, v.w, v.h); }
        if (G.fade) { ctx.fillStyle = `rgba(20,16,40,${G.fade})`; ctx.fillRect(0, 0, v.w, v.h); }
    },
};
/* the camera: a little steeper indoors so the back wall shows; the world bends away after a few tiles */
const R3_CAM = { fov: 46, pitch: 29, pitchIn: 40, dist: 13, ly: 0.6, bendStart: 4, bendK: 0.007, lead: 4, skyDrop: 0.22 };
const R3_FAR = { phone: 17, full: 27 };     // tiles ahead that get drawn (at the normal zoom)
const R3_FOG = { col: [0.6, 0.77, 0.92], near: 0.6, far: 0.98 };     // a clear blue haze far off, like the sky behind it
const R3_ZS = 1.25;         // the flat art is drawn for a steeper view: stretch the ground a little in depth
const R3_VS = 1.12;         // and stand cards a little taller so they don't look squashed from this angle

function hasWebGL() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

/* ---------------------------------------------------------------- shared shader bits (bend, cloud shade, depth-of-field amount) */
const R3U = {
    uBendK: { value: 0.0024 }, uBendZ: { value: 0 }, uTime: { value: 0 },
    uDof: { value: new THREE_V4(22, 70, 8.5, 5.5) }, uGrass: { value: new THREE_V4(1, 1, 1, 0) }, uShadow: { value: 1 },
};
function THREE_V4(a, b, c, d) { return typeof THREE !== 'undefined' ? new THREE.Vector4(a, b, c, d) : { x: a, y: b, z: c, w: d, set() {} }; }
const R3_GLSL = `
uniform float uBendK; uniform float uBendZ; uniform float uTime; uniform vec4 uDof; uniform float uShadow;
varying float vDofZ; varying vec3 vWp;
float r3h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float r3n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(r3h(i), r3h(i + vec2(1, 0)), f.x), mix(r3h(i + vec2(0, 1)), r3h(i + vec2(1, 1)), f.x), f.y); }
float cloudShade(vec2 p){ vec2 q = p * 0.045 + vec2(uTime * 0.012, uTime * 0.004);
  float n = r3n(q) * 0.6 + r3n(q * 2.1 + 3.1) * 0.3 + r3n(q * 4.3 + 7.7) * 0.1; return 1.0 - 0.3 * smoothstep(0.56, 0.74, n); }
float dofA(float z){ return clamp(smoothstep(uDof.x, uDof.y, z) + smoothstep(uDof.z, uDof.w, z) * 0.95, 0.0, 1.0); }
`;
/* a built-in material, bent towards the horizon, with cloud shadows and the depth-of-field amount in alpha */
function r3Patch(mat, o) {
    o = o || {};
    mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, R3U, o.uniforms || {});
        sh.vertexShader = R3_GLSL + (o.vhead || '') + sh.vertexShader.replace('#include <project_vertex>', `
            vec4 bw = modelMatrix * vec4(transformed, 1.0);
            vWp = bw.xyz;
            float bd = max(0.0, uBendZ - bw.z); bw.y -= uBendK * bd * bd;
            vec4 mvPosition = viewMatrix * bw;
            vDofZ = -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;`);
        let fs = R3_GLSL + (o.fhead || '') + sh.fragmentShader;
        // (the sun's shadows fade out at dusk: in a Lambert material they darken every light, the lamps' too)
        fs = fs.replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();',
            'reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * mix(1.0, getShadowMask(), uShadow)' + (o.noCloud ? ';' : ' * cloudShade(vWp.xz);'));
        fs = fs.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + (o.fend || '') + (o.dofFixed != null ? `\ngl_FragColor.a = ${o.dofFixed.toFixed(2)};` : '\ngl_FragColor.a = dofA(vDofZ);'));
        sh.fragmentShader = fs;
    };
    mat.customProgramCacheKey = () => (o.key || 'r3') + mat.type;
    return mat;
}
/* the bent world's shadows too (and pushed away from the sun a touch, so a card never shades itself in stripes) */
function r3Depth(tex) {
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    dm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, R3U);
        sh.vertexShader = 'uniform float uBendK; uniform float uBendZ;\n' + sh.vertexShader.replace('#include <project_vertex>', `
            vec4 bw = modelMatrix * vec4(transformed - vec3(-0.16, 0.23, 0.1), 1.0);
            float bd = max(0.0, uBendZ - bw.z); bw.y -= uBendK * bd * bd;
            vec4 mvPosition = viewMatrix * bw;
            gl_Position = projectionMatrix * mvPosition;`);
    };
    dm.customProgramCacheKey = () => 'r3depth';
    return dm;
}

/* ---------------------------------------------------------------- the ground, the back wall, the sea, the sky */
/* how many canvas pixels to a world pixel a room's floor and wall get (three for the HD art, if the texture fits) */
function r3RoomK(a) { return Math.max(1, Math.min(HD_K, Math.floor(2048 / Math.max(a.w, a.h) / TILE))); }
/* the room's picture (floor, back wall, edges) at that scale, rebuilt when the room's own picture is */
function r3RoomBg(a, k) {
    if (k === 1 || !a.bg) return a.bg;
    if (a.bgHD && a.bgHD.from === a.bg && a.bgHD.k === k) return a.bgHD.c;
    const was = [R3.drawingCard, R3.hdCard];
    R3.drawingCard = true; R3.hdCard = true;
    let c;
    try { c = buildRoomBg(a, k); } finally { R3.drawingCard = was[0]; R3.hdCard = was[1]; }
    a.bgHD = { from: a.bg, k, c };
    return c;
}
function r3Ground(scene, a) {
    const W = Math.min(2048, a.w * TILE), H = Math.min(2048, a.h * TILE), k = r3RoomK(a);
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = H * k;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    const pot = (W & (W - 1)) === 0 && (H & (H - 1)) === 0;
    tex.minFilter = pot ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    tex.generateMipmaps = pot;
    tex.anisotropy = 4;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, transparent: false, alphaTest: 0.02, color: 0xd8d8d8 }), { key: 'ground' });
    const geo = new THREE.PlaneGeometry(W / TILE, H / TILE * R3_ZS, 48, 48);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.renderOrder = -2;
    scene.add(mesh);
    return { cv, ctx, tex, mat, mesh, k, at: null, dirty: true };
}
/* indoors: the back wall stands up behind the floor */
function r3Wall(scene, a) {
    const top = a.floor.y0 * TILE, W = a.w * TILE, k = r3RoomK(a), bg = r3RoomBg(a, k);
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = top * k;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, W * k, top * k, 0, 0, W * k, top * k);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex }), { key: 'wall' });
    const geo = new THREE.PlaneGeometry(W / TILE, top / TILE * R3_VS * 1.6);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(W / TILE / 2, top / TILE * R3_VS * 0.8, top / TILE * R3_ZS - 0.02);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return { cv, ctx, tex, mat, mesh, from: a.bg };
}
function r3Sea(scene) {
    const mat = r3Patch(new THREE.MeshLambertMaterial({ color: 0x2f7fc0 }), { key: 'sea', noCloud: false, fhead: R3_MIRROR_HEAD,
        fend: `float sp = step(0.985, r3n(vWp.xz * 1.7 + vec2(uTime * 0.4, uTime * 0.13))); gl_FragColor.rgb += sp * 0.35;
            vec2 sq = vWp.xz * 1.3 + vec2(uTime * 0.25, uTime * 0.11);
            ${r3MirrorGlsl('gl_FragColor.rgb', 'vec2((r3n(sq) - 0.5) * 0.3, (r3n(sq + 9.0) - 0.5) * 0.15)', '0.3')}` });
    const geo = new THREE.PlaneGeometry(2400, 2400, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, -0.03, 0);
    m.receiveShadow = true;
    m.renderOrder = -3;
    m.frustumCulled = false;
    scene.add(m);
    m.onBeforeRender = () => { m.position.x = R3.target.x; m.position.z = R3.target.z; };
    return m;
}
function r3Sky(scene) {
    const mat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { uZen: { value: new THREE.Color('#3f80cc') }, uMid: { value: new THREE.Color('#86bce4') }, uHor: { value: new THREE.Color('#d2e5ec') }, uTime: R3U.uTime, uDay: { value: 1 } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }',
        fragmentShader: `uniform vec3 uZen, uMid, uHor; uniform float uTime, uDay; varying vec3 vDir;
            float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
            void main(){
              // (the world bends away below the true horizon, so the sky's horizon is lowered to meet it: blue sky and
              // clouds over the island's rolling edge, not haze)
              float y = clamp(vDir.y + ${R3_CAM.skyDrop.toFixed(3)}, -0.2, 1.0);
              vec3 c = mix(uHor, uMid, smoothstep(-0.03, 0.05, y));
              c = mix(c, uZen, smoothstep(0.05, 0.4, y));
              vec2 q = vDir.xz / max(0.08, y + 0.12) * 1.6 + vec2(uTime * 0.01, 0.0);
              float cl = n(q) * 0.6 + n(q * 2.3) * 0.3 + n(q * 5.1) * 0.1;
              // (white by day; by night only a little lighter than the sky)
              c = mix(c, mix(c * 1.35 + 0.04, vec3(1.0), uDay), smoothstep(0.6, 0.78, cl) * smoothstep(0.0, 0.08, y) * 0.75);
              gl_FragColor = vec4(c, 1.0);
            }` });
    const s = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
    s.frustumCulled = false; s.renderOrder = -4;
    s.onBeforeRender = () => { s.position.copy(R3.camera.position); };
    scene.add(s);
    return s;
}

/* ---------------------------------------------------------------- the water's mirror */
/* on computers (not phones), the trees, houses and people standing by the sea, the ponds and the river show upside down in
   the water (at sea level: water up on the plateaus doesn't): the scene drawn again from a camera below the surface at a third of the size, every other frame, without the
   ground and the sea; the water looks it up where each point of it would see (the art sample's trick) */
const R3Mirror = {
    rt: null, cam: null, bias: null, n: 0,
    render(r3, a) {
        const on = !r3.phone && !a.interior && a.id === 'island' && !(r3.quality < 1);
        R3U.uRefl.value = on && this.rt ? 1 : 0;
        if (!on || (this.n++ & 1)) return;
        const R = r3.renderer, sz = R.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(1, Math.round(sz.x / 3)), h = Math.max(1, Math.round(sz.y / 3));
        if (!this.rt || this.rt.width !== w || this.rt.height !== h) {
            if (this.rt) this.rt.dispose();
            this.rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
            this.cam = new THREE.PerspectiveCamera();
            this.bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
        }
        const cam = this.cam, main = r3.camera;
        cam.copy(main);
        cam.position.y = -main.position.y;
        cam.rotation.set(-main.rotation.x, 0, 0);
        cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
        R3U.uReflMat.value.copy(this.bias).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
        // (no ground, sea or grass in the mirror; and the world unbent, as the water's own points are looked up)
        const hide = [r3.sea]; for (const ch of r3.chunks.values()) if (ch.mesh.visible) hide.push(ch.mesh);
        if (r3.tufts && r3.tufts.mesh.visible) hide.push(r3.tufts.mesh);
        if (r3.lilies && r3.lilies.mesh.visible) hide.push(r3.lilies.mesh);
        for (const m of hide) m.visible = false;
        const bk = R3U.uBendK.value, was = R.shadowMap.needsUpdate;
        R3U.uBendK.value = 0; R3U.uRefl.value = 0; R.shadowMap.needsUpdate = false;
        R.setRenderTarget(this.rt); R.clear(); R.render(r3.scene, cam); R.setRenderTarget(null);
        R3U.uBendK.value = bk; R3U.uRefl.value = 1; R.shadowMap.needsUpdate = was;
        for (const m of hide) m.visible = true;
        R3U.tRefl.value = this.rt.texture;
    },
};
/* the reflection mixed into water (GLSL: uses vWp, a ripple offset q, and the water color col) */
const R3_MIRROR_HEAD = 'uniform sampler2D tRefl; uniform mat4 uReflMat; uniform float uRefl;\n';
function r3MirrorGlsl(col, ripple, amt) {
    return `if (uRefl > 0.5 && vWp.y < 0.35) {
        vec4 rp = uReflMat * vec4(vWp.x + ${ripple}.x, 0.0, vWp.z + ${ripple}.y, 1.0);
        vec3 rc = texture2D(tRefl, clamp(rp.xy / rp.w, 0.001, 0.999)).rgb;
        ${col} = mix(${col}, rc * vec3(0.86, 0.94, 1.0), ${amt});
    }`;
}

/* ---------------------------------------------------------------- the island's ground, in pieces */
const R3_CHUNK = 240, R3_PAD = 8, R3_CHUNKPX = R3_CHUNK + 2 * R3_PAD;     // world pixels a piece, and its 256-pixel picture with a margin
/* ---------------------------------------------------------------- grass */
/* tufts of grass on the grass near the camera, swaying in the breeze: one instanced mesh (one draw for all of them),
   refilled as the view moves; four shapes of tuft, in the season's colors */
const R3_TUFT_MAX = 6000, R3_TUFT_PHONE = 2600;      // (computers get them denser)
function r3TuftCanvas(season) {
    // drawn blade by blade (darker at the root, lighter at the tip): a shaded outline would turn blades this thin black
    const S = 24, V = 4, cv = document.createElement('canvas');
    cv.width = S * V; cv.height = S;
    const g = cv.getContext('2d'), img = g.createImageData(S * V, S), d = img.data;
    const cols = { spring: ['#4f9a36', '#a6dc72'], summer: ['#3f8a30', '#8fd05e'], fall: ['#557f2c', '#c2c858'], winter: ['#7f9a86', '#dfeae0'] }[season] || ['#3f8a30', '#8fd05e'];
    const A = hdRgb(cols[0]), B = hdRgb(cols[1]);
    const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= S * V || y >= S) return; const i = (y * S * V + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    for (let v = 0; v < V; v++) {
        const R = mulberry(v * 977 + 31), n = 4 + v;
        for (let i = 0; i < n; i++) {
            const bx = v * S + 12 + (R() - 0.5) * 12, len = 7 + R() * 11, lean = (R() - 0.5) * 9, shade = 0.75 + R() * 0.4;
            for (let t = 0; t <= 1.0001; t += 1 / (len * 2)) {
                const x = bx + lean * t * t, y = 23.5 - len * t, k = Math.min(1, t * 1.15) * shade;
                const c = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
                put(x, y, c);
                if (t < 0.45) put(x + 1, y, [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]);       // thicker at the root, shaded side
            }
        }
        // tiny flowers in two of them (white daisies, and the season's own color) but in winter
        if (v >= 2 && season !== 'winter') {
            const f = hdRgb(v === 2 ? '#f6f2ea' : { spring: '#f4a6c8', summer: '#f6e27a', fall: '#c7a4ea' }[season] || '#f6e27a'), mid = v === 2 ? [246, 214, 92] : [255, 255, 255];
            const fx = v * S + (v === 2 ? 9 : 14), fy = v === 2 ? 9 : 7;
            for (let dy = 0; dy < 8; dy++) put(fx, fy + 2 + dy, A);
            for (const [x, y] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) put(fx + x, fy + y, f);
            put(fx, fy, mid);
        }
    }
    g.putImageData(img, 0, 0);
    return cv;
}
function r3Tufts(scene, season) {
    const tex = new THREE.CanvasTexture(r3TuftCanvas(season));
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const geo = new THREE.PlaneGeometry(0.56, 0.56);
    geo.translate(0, 0.27, 0);
    const nrm = geo.attributes.normal;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 0.62, 0.78);                 // lit like the ground they grow in
    const aVar = new THREE.InstancedBufferAttribute(new Float32Array(R3_TUFT_MAX), 1);
    geo.setAttribute('aVar', aVar);
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xd8d8d8 }), { key: 'tuft', vhead: 'attribute float aVar;\n' });
    const ob = mat.onBeforeCompile;
    mat.onBeforeCompile = sh => {
        ob(sh);
        sh.vertexShader = sh.vertexShader
            .replace('#include <uv_vertex>', '#include <uv_vertex>\nvUv.x = (vUv.x + aVar) * 0.25;')
            .replace('vec4 bw = modelMatrix * vec4(transformed, 1.0);', `vec4 bw = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            bw.x += sin(uTime * 1.6 + bw.x * 0.9 + bw.z * 0.7) * 0.07 * uv.y;      // the tips sway, the roots stay put`);
    };
    const mesh = new THREE.InstancedMesh(geo, mat, R3_TUFT_MAX);
    mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false; mesh.count = 0;
    scene.add(mesh);
    return { mesh, geo, mat, tex, aVar, season, at: null };
}
const R3_ROADS = new Set(['p', 'd', 'c', 'b', 'w']);
function r3FillTufts(t, a, V) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const x0 = Math.max(0, Math.floor(V.x0 / TILE) - 1), x1 = Math.min(a.w - 1, Math.ceil(V.x1 / TILE) + 1);
    const y0 = Math.max(0, Math.floor(V.y0 / TILE) - 1), y1 = Math.min(a.h - 1, Math.ceil(V.y1 / TILE) + 2);
    let n = 0;
    const cap = R3.phone ? R3_TUFT_PHONE : R3_TUFT_MAX, dense = !R3.phone;
    // nearest rows first, so if there are more than fit, the far ones (smallest on screen) go without
    for (let ty = y1; ty >= y0 && n < cap; ty--) for (let tx = x0; tx <= x1 && n < cap; tx++) {
        if (W0.grid[ty][tx] !== 'g' || a.blocked[ty * a.w + tx] || isPathish(tx, ty)) continue;
        // (none beside a road either: winding roads and streets are drawn over the edges of the tiles beside them)
        if (R3_ROADS.has(W0.grid[ty - 1] && W0.grid[ty - 1][tx]) || R3_ROADS.has(W0.grid[ty + 1] && W0.grid[ty + 1][tx]) || R3_ROADS.has(W0.grid[ty][tx - 1]) || R3_ROADS.has(W0.grid[ty][tx + 1])) continue;
        const h = hash32(tx + ',' + ty), k = (dense ? [2, 3, 2, 4, 3, 1] : [1, 2, 2, 3, 1, 0])[h % 6];
        for (let i = 0; i < k && n < cap; i++) {
            const hh = hash32(h + ':' + i), fx = (tx + 0.15 + (hh % 70) / 100) * TILE, fy = (ty + 0.2 + ((hh >> 8) % 70) / 100) * TILE, s = 0.75 + ((hh >> 16) % 50) / 100;
            ps.set(fx / TILE, r3GroundH(fx, fy), fy / TILE * R3_ZS);
            sc.set(s, s, 1);                     // (not mirrored: a flipped quad would face away from the sun and go dark)
            m.compose(ps, q, sc);
            t.mesh.setMatrixAt(n, m);
            t.aVar.setX(n, (hh >> 12) % 4);
            n++;
        }
    }
    t.mesh.count = n;
    t.mesh.instanceMatrix.needsUpdate = true;
    t.aVar.needsUpdate = true;
}

/* ---------------------------------------------------------------- lily pads */
/* floating on the ponds as in the art sample: round pads with a notch, a few with a pink flower, bobbing a little */
const R3_LILY_MAX = 400;
function r3LilyCanvas() {
    const S = 32, cv = document.createElement('canvas');
    cv.width = S * 5; cv.height = S;
    const g = cv.getContext('2d');
    // cells 3 and 4: cattails for the banks (stems, leaves, a brown head)
    for (let v = 3; v < 5; v++) {
        const R = mulberry(v * 131 + 7);
        for (let k = 0; k < 5; k++) {
            const x = v * S + 6 + k * 5 + (R() - 0.5) * 3, top = 4 + R() * 10, lean = (R() - 0.5) * 4;
            g.strokeStyle = k % 2 ? '#5f8f3a' : '#4a7a30'; g.lineWidth = 1.4;
            g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x + lean * 0.3, (S + top) / 2, x + lean, top); g.stroke();
            if (k % 2 === 0 || v === 4) { g.fillStyle = '#7a4a26'; g.beginPath(); g.ellipse(x + lean, top + 3, 1.6, 3.6, lean * 0.05, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,220,180,0.35)'; g.fillRect(x + lean - 1, top + 1, 1, 3); }
        }
        for (let k = 0; k < 3; k++) { const x = v * S + 8 + k * 8, lean = (R() - 0.5) * 10; g.strokeStyle = '#6fa045'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x + lean * 0.4, S - 10, x + lean, S - 16 - R() * 6); g.stroke(); }
    }
    for (let v = 0; v < 3; v++) {
        const cx = v * S + S / 2, cy = S / 2, r = S * 0.42, notch = 0.5 + v * 1.7;
        g.save(); g.translate(cx, cy);
        // the pad: a disc with a wedge cut out, darker at the rim, a highlight towards the top left
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, notch + 0.38, notch + Math.PI * 2 - 0.38); g.closePath();
        const gr = g.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r);
        gr.addColorStop(0, '#9fd46a'); gr.addColorStop(0.65, '#5f9e3c'); gr.addColorStop(1, '#3d7030');
        g.fillStyle = gr; g.fill();
        g.strokeStyle = 'rgba(40,80,30,0.8)'; g.lineWidth = 1; g.stroke();
        // veins
        g.strokeStyle = 'rgba(200,240,150,0.35)'; g.lineWidth = 0.8;
        for (let k = 0; k < 6; k++) { const a = notch + 0.6 + k * 0.9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.stroke(); }
        if (v === 2) {
            // a pink water lily on this one
            for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.fillStyle = k % 2 ? '#f7b6cf' : '#f28cb4'; g.beginPath(); g.ellipse(Math.cos(a) * 4, Math.sin(a) * 4 - 1, 4.2, 2.2, a, 0, Math.PI * 2); g.fill(); }
            g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(0, -1, 2.2, 0, Math.PI * 2); g.fill();
        }
        g.restore();
    }
    return cv;
}
function r3Lilies(scene) {
    const tex = new THREE.CanvasTexture(r3LilyCanvas());
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const aVar = new THREE.InstancedBufferAttribute(new Float32Array(R3_LILY_MAX), 1);
    geo.setAttribute('aVar', aVar);
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, color: 0xdedede }), { key: 'lily', vhead: 'attribute float aVar;\n' });
    const ob = mat.onBeforeCompile;
    mat.onBeforeCompile = sh => {
        ob(sh);
        sh.vertexShader = sh.vertexShader
            .replace('#include <uv_vertex>', '#include <uv_vertex>\nvUv.x = (vUv.x + aVar) / 5.0;')
            .replace('vec4 bw = modelMatrix * vec4(transformed, 1.0);', `vec4 bw = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            if (aVar < 2.5) bw.y += sin(uTime * 1.3 + bw.x * 1.7 + bw.z * 1.1) * 0.012;      // a gentle bob on the water
            else bw.x += sin(uTime * 1.4 + bw.x * 0.9 + bw.z * 0.7) * 0.05 * uv.y;              // reeds sway at the top`);
    };
    const mesh = new THREE.InstancedMesh(geo, mat, R3_LILY_MAX);
    mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false; mesh.count = 0;
    scene.add(mesh);
    return { mesh, geo, mat, tex, aVar, at: null };
}
function r3FillLilies(l, a, V) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const x0 = Math.max(1, Math.floor(V.x0 / TILE)), x1 = Math.min(a.w - 2, Math.ceil(V.x1 / TILE));
    const y0 = Math.max(1, Math.floor(V.y0 / TILE)), y1 = Math.min(a.h - 2, Math.ceil(V.y1 / TILE));
    let n = 0;
    for (let ty = y1; ty >= y0 && n < R3_LILY_MAX; ty--) for (let tx = x0; tx <= x1 && n < R3_LILY_MAX; tx++) {
        // pond tiles with water all round (the rim tiles are drawn half as bank), about one in two
        if (a.waterAt(tx, ty) !== 'p') continue;
        const wet = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dy]) => a.waterAt(tx + dx, ty + dy) === 'p').length;
        const h = hash32('lily' + tx + ',' + ty);
        if (wet < 4 || h % 2) continue;
        const fx = (tx + 0.2 + (h >> 4) % 60 / 100) * TILE, fy = (ty + 0.2 + (h >> 10) % 60 / 100) * TILE, s = 0.42 + (h >> 16) % 30 / 100;
        ps.set(fx / TILE, r3GroundH(fx, fy) + 0.03, fy / TILE * R3_ZS);
        q.setFromAxisAngle(up, ((h >> 20) % 628) / 100);
        sc.set(s, 1, s * R3_ZS);
        m.compose(ps, q, sc);
        l.mesh.setMatrixAt(n, m);
        l.aVar.setX(n, (h >> 7) % 7 === 0 ? 2 : (h >> 3) % 2);
        n++;
    }
    // cattails on the grass along the ponds' banks, standing up and facing the camera
    const qs = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    for (let ty = y1; ty >= y0 && n < R3_LILY_MAX; ty--) for (let tx = x0; tx <= x1 && n < R3_LILY_MAX; tx++) {
        if (W0.grid[ty][tx] !== 'g' || a.waterAt(tx, ty) || a.blocked[ty * a.w + tx]) continue;
        const nb = [[-1, 0], [1, 0], [0, -1], [0, 1]].find(([dx, dy]) => a.waterAt(tx + dx, ty + dy) === 'p');
        if (!nb) continue;
        const h = hash32('reed' + tx + ',' + ty);
        if (h % 2) continue;
        // at the side of the tile by the water
        const fx = (tx + 0.5 + nb[0] * 0.32 + ((h >> 4) % 30 - 15) / 100) * TILE, fy = (ty + 0.55 + nb[1] * 0.3) * TILE, s = 0.6 + (h >> 12) % 30 / 100;
        ps.set(fx / TILE, r3GroundH(fx, fy), fy / TILE * R3_ZS);
        sc.set(s, 1, s * 1.1);
        m.compose(ps, qs, sc);
        // (the flat plane stood up: its far edge at the top, the near edge on the ground)
        m.multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
        l.mesh.setMatrixAt(n, m);
        l.aVar.setX(n, 3 + (h >> 9) % 2);
        n++;
    }
    l.mesh.count = n;
    l.mesh.instanceMatrix.needsUpdate = true;
    l.aVar.needsUpdate = true;
}

/* ---------------------------------------------------------------- the island's water */
/* the river, ponds, the spring and the waterfalls move: ripples drifting downstream, light on the crests, sparkles,
   a little foam along the banks, the sea's edge too (the water map: one texel a tile, red = water, green = flowing, blue = falling) */
let R3_WMAP = null;
function r3WaterMap() {
    if (R3_WMAP && R3_WMAP.src === W0.water) return R3_WMAP;
    const Wt = W0.w, Ht = W0.h, d = new Uint8Array(Wt * Ht * 4);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
        const c = W0.water[y] ? W0.water[y][x] : '.', g = W0.grid[y] ? W0.grid[y][x] : '', i = (y * Wt + x) * 4;
        const fall = g === 'W', wet = c === 'r' || c === 'p' || c === 'h' || fall || g === '~';
        d[i] = wet ? 255 : 0; d[i + 1] = c === 'r' || fall ? 255 : 0; d[i + 2] = fall ? 255 : 0; d[i + 3] = 255;
    }
    const t = new THREE.DataTexture(d, Wt, Ht, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
    t.src = W0.water;
    R3_WMAP = t;
    return t;
}
const R3_WATER_HEAD = 'uniform sampler2D uWater; uniform vec2 uWsz; uniform vec4 uGrass;\n' + R3_MIRROR_HEAD;
/* the grass a little deeper and greener than the flat art's (the art sample's lush look; fall's olive turns yellow-green) */
const R3_GRASS = { spring: [0.93, 0.94, 0.9], summer: [0.93, 0.92, 0.88], fall: [0.8, 0.95, 0.86], winter: [1, 1, 1] };
const R3_WATER_GLSL = `
{
    // fine detail over the island picture (one picture pixel is a lot of screen up close): speckles and soft patches
    vec2 dp = vWp.xz;
    gl_FragColor.rgb *= 1.0 + (r3n(dp * 5.3) - 0.5) * 0.11 + (r3n(dp * 13.7 + 7.3) - 0.5) * 0.08 + (r3n(dp * 0.55 + 2.1) - 0.5) * 0.08;
    vec3 al = diffuseColor.rgb;
    float gm = smoothstep(1.3, 1.6, al.g / max(al.b, 0.02)) * step(al.r, al.g * 1.04);
    gl_FragColor.rgb *= mix(vec3(1.0), uGrass.rgb, gm);
    vec4 wm = texture2D(uWater, vec2(vWp.x / uWsz.x, vWp.z / ${R3_ZS.toFixed(3)} / uWsz.y));
    float w = smoothstep(0.45, 0.8, wm.r);
    vec3 col = gl_FragColor.rgb;
    if (w > 0.0) {
        vec2 p = vWp.xz;
        vec2 q = p * 2.1 + vec2(uTime * 0.12, uTime * (0.18 + wm.g * 0.7 + wm.b * 3.0));
        float n = r3n(q) * 0.6 + r3n(q * 2.3 + 5.1) * 0.4, rip = smoothstep(0.55, 0.86, n);
        vec3 wc = mix(col * vec3(0.84, 0.92, 1.03), col, 0.55 + 0.45 * rip) + vec3(0.18, 0.22, 0.24) * rip * 0.45;
        ${r3MirrorGlsl('wc', 'vec2((n - 0.5) * 0.22, (r3n(q * 1.7 + 3.0) - 0.5) * 0.12)', '0.34 * (1.0 - wm.b)')}
        wc += step(0.972, r3n(p * 9.0 + vec2(uTime * 0.7, uTime * 0.35))) * 0.42;
        // falling water: white streaks rushing down
        wc = mix(wc, vec3(0.92, 0.97, 1.0), wm.b * smoothstep(0.45, 0.8, r3n(vec2(p.x * 7.0, p.y * 1.4 - uTime * 2.6))) * 0.75);
        // foam just inside the bank
        float foam = smoothstep(0.42, 0.55, wm.r) * smoothstep(0.78, 0.6, wm.r);
        wc = mix(wc, vec3(0.94, 0.97, 1.0), foam * smoothstep(0.4, 0.85, r3n(p * 5.0 + vec2(0.0, uTime * 0.4))) * 0.6);
        gl_FragColor.rgb = mix(col, wc, w);
    }
}`;

/* ---------------------------------------------------------------- the island's height */
/* the plateau (level 1) and the mountain (level 2) stand up, R3_LEVEL units a level; where a higher level ends going
   south, the two rows painted as a stone face (and the stairs, and the waterfalls) become the cliff, sloping down */
const R3_LEVEL = 2.0, R3_BAND = 2;
let R3_HC = null;
function r3Corners() {
    if (R3_HC && R3_HC.src === W0.height) return R3_HC;
    const Wt = W0.w, Ht = W0.h, Hs = W0.height || [];
    const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht || !Hs[y]) ? 0 : +Hs[y][x] || 0;
    const sea = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && W0.grid[y][x] === '~' && L(x, y) === 0;
    const C = new Float32Array((Wt + 1) * (Ht + 1));
    for (let vy = 0; vy <= Ht; vy++) for (let vx = 0; vx <= Wt; vx++) {
        // a corner is as high as the highest tile touching it (at the coast, the sea's: the land slopes down to the water
        // rather than the sea standing up as a wall)...
        if (sea(vx - 1, vy - 1) || sea(vx, vy - 1) || sea(vx - 1, vy) || sea(vx, vy)) { C[vy * (Wt + 1) + vx] = 0; continue; }
        let h = Math.max(L(vx - 1, vy - 1), L(vx, vy - 1), L(vx - 1, vy), L(vx, vy));
        // ...or, in the band below a cliff edge, part of the way down from it
        const low = Math.max(L(vx - 1, vy), L(vx, vy));
        for (let k = 2; k <= R3_BAND; k++) {
            const u = Math.max(L(vx - 1, vy - k), L(vx, vy - k));
            if (u > low && Math.max(L(vx - 1, vy - k + 1), L(vx, vy - k + 1)) <= low) { h = Math.max(h, low + (u - low) * (1 - (k - 1) / R3_BAND)); break; }
        }
        C[vy * (Wt + 1) + vx] = h;
    }
    R3_HC = { src: W0.height, C, W: Wt + 1, H: Ht + 1 };
    return R3_HC;
}
/* the ground's height (world units) under a spot in world pixels, on the island (rooms are flat) */
function r3GroundH(x, y) {
    if (!G.area || G.area.interior || G.area.id !== 'island' || !W0.height) return 0;
    const g = r3Corners(), fx = Math.max(0, Math.min(g.W - 1.001, x / TILE)), fy = Math.max(0, Math.min(g.H - 1.001, y / TILE));
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, C = g.C, i = iy * g.W + ix;
    return ((C[i] * (1 - tx) + C[i + 1] * tx) * (1 - ty) + (C[i + g.W] * (1 - tx) + C[i + g.W + 1] * tx) * ty) * R3_LEVEL;
}
function makeChunk(scene, cx, cy) {
    const cv = document.createElement('canvas');
    cv.width = R3_CHUNKPX; cv.height = R3_CHUNKPX;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.02, color: 0xd8d8d8 }), { key: 'groundw', uniforms: { uWater: { value: r3WaterMap() }, uWsz: { value: new THREE.Vector2(W0.w, W0.h) } }, fhead: R3_WATER_HEAD, fend: R3_WATER_GLSL });
    const s = R3_CHUNK / TILE;
    const geo = new THREE.PlaneGeometry(s, s * R3_ZS, s, s);
    geo.rotateX(-Math.PI / 2);
    const UV = geo.attributes.uv;
    for (let i = 0; i < UV.count; i++) UV.setXY(i, (R3_PAD + UV.getX(i) * R3_CHUNK) / R3_CHUNKPX, (R3_PAD + UV.getY(i) * R3_CHUNK) / R3_CHUNKPX);
    // raised where the island is higher (one vertex per tile corner)
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) P.setY(i, r3GroundH((cx * s + s / 2 + P.getX(i)) * TILE, (cy * s + s / 2 + P.getZ(i) / R3_ZS) * TILE));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx * s + s / 2, 0, (cy * s + s / 2) * R3_ZS);
    mesh.receiveShadow = true;
    mesh.renderOrder = -2;
    scene.add(mesh);
    return { cx, cy, cv, ctx, tex, mat, mesh, used: G.frame, stale: false };
}
function paintChunk(ch, a) {
    const ctx = ch.ctx, x0 = ch.cx * R3_CHUNK - R3_PAD, y0 = ch.cy * R3_CHUNK - R3_PAD, N = R3_CHUNKPX;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!ch.base || ch.baseOf !== a.bgSeason || ch.partial) { const sg = r3SoftGround(a.bgSeason, x0, y0, N); ch.base = sg.img; ch.partial = !sg.all; ch.baseOf = a.bgSeason; }
    if (ch.base) ctx.putImageData(ch.base, 0, 0); else ctx.clearRect(0, 0, N, N);
    drawPaths(ctx, a, { x: x0, y: y0 }, { w: N, h: N });
    ctx.translate(-x0, -y0);
    R3.drawingCard = true;
    try {
        for (const d of a.decals) if (d.x > x0 - 48 && d.x < x0 + N + 48 && d.y > y0 - 16 && d.y < y0 + N + 48) spr(ctx, d.frame, d.x, d.y);
        for (const e of a.ents) if (e.layer === 0 && !e.hidden && e.x > x0 - 64 && e.x < x0 + N + 64 && e.y > y0 - 32 && e.y < y0 + N + 64) drawEnt(ctx, e);
    } finally { R3.drawingCard = false; }
    ch.tex.needsUpdate = true;
}
/* the island picture's borders between grass, dirt, sand and water drawn wavy instead of in tile steps (the art
   sample's soft paths): each pixel is taken from a spot nudged by a smooth noise field of the world position, except on
   and next to cliffs, stairs and bridges, whose straight lines stay */
const R3_SOFT = { amp: 4, hard: new Set(['c', 'w', 'b', 'x', 'o', 'h', 'W']) };
let R3_SOFTMAP = null, R3_SOFTCV = null;
function r3SoftField() {
    if (R3_SOFTMAP) return R3_SOFTMAP;
    // a 128-pixel repeating field: two octaves of value noise (16 and 5.33 pixel cells), in whole pixels
    const S = 128, ox = new Int8Array(S * S), oy = new Int8Array(S * S), R = mulberry(4242);
    const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = R() * 2 - 1; return a; };
    const L1x = lat(8), L1y = lat(8), L2x = lat(24), L2y = lat(24);
    const smp = (L, n, x, y) => { const c = S / n, fx = x / c, fy = y / c, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
        const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty), at = (i, j) => L[((j % n) * n) + (i % n)];
        return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v; };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        ox[y * S + x] = Math.round((smp(L1x, 8, x, y) * 0.75 + smp(L2x, 24, x, y) * 0.25) * R3_SOFT.amp);
        oy[y * S + x] = Math.round((smp(L1y, 8, x, y) * 0.75 + smp(L2y, 24, x, y) * 0.25) * R3_SOFT.amp);
    }
    return (R3_SOFTMAP = { S, ox, oy });
}
function r3SoftGround(season, x0, y0, N) {
    const M = R3_SOFT.amp, SW = N + 2 * M;
    if (!R3_SOFTCV) { R3_SOFTCV = document.createElement('canvas'); R3_SOFTCV.width = R3_SOFTCV.height = SW; R3_SOFTCV.g = R3_SOFTCV.getContext('2d', { willReadFrequently: true }); }
    const g = R3_SOFTCV.g;
    g.clearRect(0, 0, SW, SW);
    const all = Ground.draw(g, season, x0 - M, y0 - M, SW, SW, 0, 0);
    const src = g.getImageData(0, 0, SW, SW).data, out = new ImageData(N, N), dst = out.data;
    const F = r3SoftField(), FS = F.S, grid = W0.grid;
    const hard = (wx, wy) => { const r = grid[Math.floor(wy / TILE)]; return !r || R3_SOFT.hard.has(r[Math.floor(wx / TILE)]); };
    // which tiles are hard, with their neighbours (so nothing is pulled across a cliff's edge)
    const tx0 = Math.floor((x0 - TILE) / TILE), ty0 = Math.floor((y0 - TILE) / TILE), TW = Math.ceil(N / TILE) + 3;
    const nearHard = new Uint8Array(TW * TW);
    for (let j = 0; j < TW; j++) for (let i = 0; i < TW; i++) {
        let h = 0;
        for (let dj = -1; dj <= 1 && !h; dj++) for (let di = -1; di <= 1 && !h; di++) if (hard((tx0 + i + di) * TILE, (ty0 + j + dj) * TILE)) h = 1;
        nearHard[j * TW + i] = h;
    }
    for (let y = 0; y < N; y++) {
        const wy = y0 + y, fy = ((wy % FS) + FS) % FS, tj = Math.floor(wy / TILE) - ty0;
        for (let x = 0; x < N; x++) {
            const wx = x0 + x, fi = fy * FS + (((wx % FS) + FS) % FS), ti = Math.floor(wx / TILE) - tx0;
            let px = x + M, py = y + M;
            if (!nearHard[tj * TW + ti]) { px += F.ox[fi]; py += F.oy[fi]; }
            const si = (py * SW + px) * 4, di = (y * N + x) * 4;
            dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = src[si + 3];
        }
    }
    return { img: out, all };
}
function dropChunk(ch) { R3.scene.remove(ch.mesh); ch.mesh.geometry.dispose(); ch.mat.dispose(); ch.tex.dispose(); }
/* a quick fingerprint of a card's pixels (every 7th one) */
function cardHash(c) {
    let d;
    try { d = c.ctx.getImageData(0, 0, c.cv.width, c.cv.height).data; } catch (e) { return Math.random(); }
    let h = 0;
    for (let i = 3; i < d.length; i += 28) h = (h * 31 + d[i] + d[i - 1] * 7 + d[i - 3] * 3) | 0;
    return h;
}

/* ---------------------------------------------------------------- cards */
function makeCard(w, h, ax, ay, scene, res) {
    res = res || 1;
    const cv = document.createElement('canvas');
    cv.width = w * res; cv.height = h * res;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = res > 1 && R3.texLinear ? THREE.LinearFilter : THREE.NearestFilter; tex.minFilter = res > 1 ? THREE.LinearFilter : THREE.NearestFilter; tex.generateMipmaps = false;
    const gw = w / TILE, gh = h / TILE * R3_VS;
    const geo = new THREE.PlaneGeometry(gw, gh);
    // the anchor (the spot it stands on) goes to the mesh's origin
    geo.translate(gw / 2 - ax / TILE, (ay / TILE) * R3_VS - gh / 2, 0);
    const nrm = geo.attributes.normal;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 0.62, 0.78);        // lit like the ground it stands on
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xdedede }), { key: 'card' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const depth = r3Depth(tex);
    mesh.customDepthMaterial = depth;
    scene.add(mesh);
    const c = { cv, ctx, tex, mat, mesh, depth, w, h, ax, ay, res, away: 0, fade: 1, rawN: 0, imgN: 0 };
    // count what's drawn by hand (not through spr or hdDraw), so a card whose picture didn't change isn't sent again
    for (const m of ['fillRect', 'strokeRect', 'fill', 'stroke', 'fillText', 'putImageData']) { const f = ctx[m]; ctx[m] = function () { c.rawN++; return f.apply(ctx, arguments); }; }
    const di = ctx.drawImage;
    ctx.drawImage = function () { c.imgN++; return di.apply(ctx, arguments); };
    c.setFade = f => {
        if (f === c.fade) return;
        c.fade = f;
        mat.transparent = f < 1; mat.opacity = f; mat.depthWrite = f >= 1; mat.alphaTest = f < 1 ? 0.05 : 0.5;
        mat.needsUpdate = true;
    };
    return c;
}
function drawCard(c, e) {
    const ctx = c.ctx, r = c.res, ex = Math.round(e.x), ey = Math.round(e.y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.cv.width, c.cv.height);
    ctx.setTransform(r, 0, 0, r, r * (c.ax - ex), r * (c.ay - ey));
    R3.drawingCard = true; R3.hdCard = r > 1;
    if (c.pooled) { R3.sig = [ex, ey]; R3.sigN = 0; c.rawN = 0; c.imgN = 0; }
    try { drawEnt(ctx, e); if (e.kind === 'player' && G.held) spr(ctx, itemIcon(G.held), e.x, e.y - 28); }
    catch (err) { console.error(err); }
    finally { R3.drawingCard = false; R3.hdCard = false; }
    if (c.pooled) {
        // the same pictures in the same places as last time, and nothing drawn by hand: the texture is still right
        const sig = R3.sig.join(','), same = sig === c.lastSig && !c.rawN && c.imgN <= R3.sigN;
        R3.sig = null;
        c.lastSig = c.rawN || c.imgN > R3.sigN ? null : sig;
        if (same) return;
    }
    c.tex.needsUpdate = true;
}
function placeCard(c, e, a) {
    let lift = r3GroundH(e.x, e.y), z = e.y / TILE * R3_ZS;
    // indoors, things on the back wall hang on it
    if (a.interior && a.floor && e.y < a.floor.y0 * TILE + 2) { lift = (a.floor.y0 * TILE - e.y) / TILE * R3_VS * 1.6; z = a.floor.y0 * TILE / TILE * R3_ZS + 0.01; }
    // a shopkeeper at the counter along the back wall stands on a step behind it, so they show over it as in the flat view
    else if (a.interior && e.npc && a.room && a.room.staff === e.id && a.floor && e.y < (a.floor.y0 + 1.5) * TILE) lift += 0.5 * R3_VS;
    c.mesh.position.set(Math.round(e.x) / TILE, lift, z + 0.001 * ((e.x * 7) % 3));
    c.mesh.visible = true;
}
/* ---------------------------------------------------------------- buildings in 3D */
/* where each building's walls end and its roof begins (rows of today's sprite): a roof slopes back over the footprint;
   a flat roof (arcade, club, museum) is a flat top at that row, with anything above it (signs, the pediment) standing
   up at the front */
const R3_VOL = { shop: { roof: 28 }, boutique: { roof: 29 }, salon: { roof: 29 }, studio: { roof: 29 }, builder: { roof: 29 }, restaurant: { roof: 31 },
    displays: { roof: 31 }, barn: { roof: 30 }, arcade: { flat: 12 }, club: { flat: 13 }, museum: { flat: 27 },
    postoffice: { roof: 28 }, bank: { roof: 29 }, townhall: { flat: 27 } };
function r3VolSpec(e) {
    if (e.kind !== 'building' || !e.b) return null;
    if (typeof HOUSE_BASE !== 'undefined' && HOUSE_BASE[e.id]) {
        // houses come from their look (drawHouse): walls from 42% down, the roof above
        const L = houseLook(e.id), wt = Math.floor(L.h * 0.42), st = L.style || 'gable';
        return st === 'flat' ? { flat: wt - 8 } : { roof: st === 'thatch' ? wt + 4 : wt + 3 };
    }
    return R3_VOL[e.frame] || null;
}
/* a building as one mesh wearing its picture: the front wall is the picture's lower part, the roof its upper part tilted
   back to a ridge halfway over the footprint, the side walls and gable ends take the colors at the picture's edges */
function r3Volume(e, scene) {
    const sp = r3VolSpec(e);
    let f = hdNamed(e.frame), k = HD_K;
    // (its HD picture still on its way: built with today's sprite for now, and again when the picture arrives)
    const waiting = !f && hdHas(e.frame);
    if (!f) {
        // no HD art: today's sprite
        const fr = Assets.frames[e.frame], dy = Assets.dyn[e.frame];
        if (!fr && !dy) return null;
        // (a canvas kept in ordinary memory: its pixels are read just below, and reading one the browser put on the graphics
        // card stalls until the card catches up)
        const cv = document.createElement('canvas'), cg = () => cv.getContext('2d', { willReadFrequently: true });
        if (fr) { cv.width = fr[2]; cv.height = fr[3]; cg().drawImage(Assets.atlas, fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]); f = { c: cv, w: fr[2], h: fr[3], ax: fr[4], ay: fr[5] }; }
        else { cv.width = dy.w; cv.height = dy.h; cg().drawImage(dy.c, 0, 0); f = { c: cv, w: dy.w, h: dy.h, ax: dy.ax, ay: dy.ay }; }
        k = 1;
    }
    const W = f.w, H = f.h, ay = f.ay, px = 1 / k / TILE, py = R3_VS / k / TILE, D = e.b.h * R3_ZS;
    const alpha = f.c.getContext('2d').getImageData(0, 0, W, H).data;
    const edges = row => { row = Math.max(0, Math.min(H - 1, Math.round(row))); let l = -1, r = -1; for (let x = 0; x < W; x++) if (alpha[(row * W + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x; } return [l, r]; };
    const V = row => 1 - row / H, U = x => (x + 0.5) / W, X = x => (x - f.ax) * px;
    const pos = [], uv = [], nrm = [];
    // one flat four-cornered face: corners in order, each [x, y, z, u, v]; n = its normal
    const quad = (c, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(c[i][0], c[i][1], c[i][2]); uv.push(c[i][3], c[i][4]); nrm.push(n[0], n[1], n[2]); } };
    const tri = (c, n) => { for (const i of [0, 1, 2]) { pos.push(c[i][0], c[i][1], c[i][2]); uv.push(c[i][3], c[i][4]); nrm.push(n[0], n[1], n[2]); } };
    const top = sp.roof != null ? sp.roof * k : sp.flat * k;            // where the walls stop (canvas rows)
    const Hw = (ay - top) * py, [l, r] = edges((top + ay) / 2);
    if (l < 0) return null;
    const xL = X(l), xR = X(r + 1), x0 = X(0), x1 = X(W);
    // the sides wear the wall's own color, row by row (the median across the front, so windows, doors and a barber's pole
    // don't streak along them); then the whole wall's color, for the gable ends and the back; then a darker one for the
    // roof's underside, which shows where the roof picture is see-through (a shop's flat roof behind its awning and sign)
    const wh = Math.max(1, ay - top), side = document.createElement('canvas'), SH = wh + 2;
    side.width = 1; side.height = SH;
    const sg = side.getContext('2d'), sd = sg.createImageData(1, SH), all = [[], [], []];
    for (let y = 0; y < wh; y++) {
        const ch = [[], [], []];
        for (let x = l + k; x <= r - k; x++) { const i = ((top + y) * W + x) * 4; if (alpha[i + 3] > 128) for (let q = 0; q < 3; q++) { ch[q].push(alpha[i + q]); all[q].push(alpha[i + q]); } }
        for (let q = 0; q < 3; q++) { ch[q].sort((m, n) => m - n); sd.data[y * 4 + q] = ch[q].length ? ch[q][ch[q].length >> 1] : 128; }
        sd.data[y * 4 + 3] = 255;
    }
    for (let q = 0; q < 3; q++) {
        all[q].sort((m, n) => m - n);
        const m = all[q].length ? all[q][all[q].length >> 1] : 128;
        sd.data[wh * 4 + q] = Math.round(m * 0.92);
        sd.data[(wh + 1) * 4 + q] = Math.round(m * 0.5 + [96, 92, 100][q] * 0.22);
    }
    sd.data[wh * 4 + 3] = sd.data[(wh + 1) * 4 + 3] = 255;
    sg.putImageData(sd, 0, 0);
    const uL = 0.5, uR = 0.5, vWall = 1.5 / SH, vRoof = 0.5 / SH, SV = row => 1 - (Math.max(top, Math.min(ay, row)) - top + 0.5) / SH;
    const sideQuads = [];                                                  // which faces wear the side picture
    const front = [0, 0.4, 0.92];                                         // lit a little like the ground, as the cards are
    if (sp.roof != null) {
        // the front wall, then the roof sloping back to the ridge
        quad([[x0, 0, 0, 0, V(ay)], [x1, 0, 0, 1, V(ay)], [x1, Hw, 0, 1, V(top)], [x0, Hw, 0, 0, V(top)]], front);
        const tanP = Math.tan(R3_CAM.pitch * Math.PI / 180), Vc = top * py;
        let d = D / 2, rise = Vc - d * tanP;
        if (rise < Vc * 0.3) { rise = Vc * 0.3; d = (Vc - rise) / tanP; }
        const rl = Math.hypot(d, rise), rn = [0, d / rl, rise / rl];
        quad([[x0, Hw, 0, 0, V(top)], [x1, Hw, 0, 1, V(top)], [x1, Hw + rise, -d, 1, 1], [x0, Hw + rise, -d, 0, 1]], rn);
        const bd = D - d, bl = Math.hypot(bd, rise);
        quad([[x0, Hw + rise, -d, 0, 1], [x1, Hw + rise, -d, 1, 1], [x1, Hw, -D, 1, V(top)], [x0, Hw, -D, 0, V(top)]], [0, bd / bl, -rise / bl]);
        // gable ends above the side walls
        sideQuads.push(pos.length / 3);
        tri([[xL, Hw, 0, uL, vWall], [xL, Hw, -D, uL, vWall], [xL, Hw + rise, -d, uL, vWall]], [-1, 0, 0]);
        tri([[xR, Hw, 0, uR, vWall], [xR, Hw + rise, -d, uR, vWall], [xR, Hw, -D, uR, vWall]], [1, 0, 0]);
        // the roof's solid underside, just beneath both slopes
        const e1 = 0.03, bn = [0, bd / bl, -rise / bl];
        quad([[xL, Hw - e1, 0, uL, vRoof], [xR, Hw - e1, 0, uR, vRoof], [xR, Hw + rise - e1, -d, uR, vRoof], [xL, Hw + rise - e1, -d, uL, vRoof]], rn);
        quad([[xL, Hw + rise - e1, -d, uL, vRoof], [xR, Hw + rise - e1, -d, uR, vRoof], [xR, Hw - e1, -D, uR, vRoof], [xL, Hw - e1, -D, uL, vRoof]], bn);
    } else {
        // the whole picture stands at the front (a sign or a pediment rises above the roof line); the roof is flat
        quad([[x0, 0, 0, 0, V(ay)], [x1, 0, 0, 1, V(ay)], [x1, ay * py, 0, 1, 1], [x0, ay * py, 0, 0, 1]], front);
        const uc = U((l + r) / 2);
        quad([[xL, Hw, 0, uc, vWall], [xR, Hw, 0, uc, vWall], [xR, Hw, -D, uc, vWall], [xL, Hw, -D, uc, vWall]], [0, 1, 0]);
    }
    // side walls and the back wall
    const s0 = pos.length / 3;
    quad([[xL, 0, -D, uL, SV(ay)], [xL, 0, 0, uL, SV(ay)], [xL, Hw, 0, uL, SV(top)], [xL, Hw, -D, uL, SV(top)]], [-1, 0, 0]);
    quad([[xR, 0, 0, uR, SV(ay)], [xR, 0, -D, uR, SV(ay)], [xR, Hw, -D, uR, SV(top)], [xR, Hw, 0, uR, SV(top)]], [1, 0, 0]);
    quad([[xR, 0, -D, uR, SV(ay)], [xL, 0, -D, uL, SV(ay)], [xL, Hw, -D, uL, SV(top)], [xR, Hw, -D, uR, SV(top)]], [0, 0, -1]);
    // two meshes: the picture (front, roof, a flat top: see-through where the picture is), and the side color (gable ends,
    // side and back walls: solid)
    const pick = (from, to) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos.slice(from * 3, to * 3), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv.slice(from * 2, to * 2), 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm.slice(from * 3, to * 3), 3)); return g; };
    const g0 = sideQuads.length ? sideQuads[0] : s0, geo = pick(0, g0), sgeo = pick(g0, pos.length / 3);
    const tex = new THREE.CanvasTexture(f.c);
    tex.magFilter = k > 1 && R3.texLinear ? THREE.LinearFilter : THREE.NearestFilter; tex.minFilter = k > 1 ? THREE.LinearFilter : THREE.NearestFilter; tex.generateMipmaps = false;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xdedede }), { key: 'card' });
    const stex = new THREE.CanvasTexture(side);
    stex.magFilter = THREE.NearestFilter; stex.minFilter = THREE.NearestFilter; stex.generateMipmaps = false;
    const smat = r3Patch(new THREE.MeshLambertMaterial({ map: stex, side: THREE.DoubleSide, color: 0xdedede }), { key: 'card' });
    const pm = new THREE.Mesh(geo, mat), sm = new THREE.Mesh(sgeo, smat);
    for (const m of [pm, sm]) { m.castShadow = true; m.receiveShadow = true; }
    const depth = r3Depth(tex);
    pm.customDepthMaterial = depth;
    const mesh = new THREE.Group();
    mesh.add(pm, sm);
    scene.add(mesh);
    const c = { vol: true, frame: e.frame, e, mesh, mat, tex, depth, res: k, away: 0, fade: 1, waiting };
    // windows light up at night (a house's where its look put them, a shop's where its picture drew them), glowing warm
    // through the bloom
    const dyn = Assets.dyn[e.frame], L = k < 2 || typeof hdH_winRects !== 'function' ? null : dyn && dyn.key ? JSON.parse(dyn.key)
        : typeof HOUSE_BASE !== 'undefined' && HOUSE_BASE[e.id] ? houseLook(e.id) : null;
    const wins = k < 2 ? null : f.wins && f.wins.length ? f.wins : L && L.w * 3 === W && L.h * 3 === H ? hdH_winRects(L) : null;
    let gtex = null;
    if (wins) {
        const gc = document.createElement('canvas'), gg = gc.getContext('2d');
        gc.width = W; gc.height = H;
        gg.fillStyle = '#000'; gg.fillRect(0, 0, W, H);
        for (const [x, y, w, h] of wins) {
            const gr = gg.createRadialGradient(x + w / 2, y + h * 0.6, 2, x + w / 2, y + h / 2, w * 0.7);
            gr.addColorStop(0, '#fff0b8'); gr.addColorStop(1, '#f2a040');
            gg.fillStyle = gr; gg.fillRect(x + 2, y + 2, w - 4, h - 4);
        }
        gtex = new THREE.CanvasTexture(gc);
        mat.emissiveMap = gtex; mat.emissive = new THREE.Color(0xffffff); mat.emissiveIntensity = 0;
        c.glow = mat;
    }
    c.dispose = () => { scene.remove(mesh); geo.dispose(); sgeo.dispose(); mat.dispose(); smat.dispose(); tex.dispose(); stex.dispose(); depth.dispose(); if (gtex) gtex.dispose(); };
    c.setFade = v => {
        if (v === c.fade) return;
        c.fade = v;
        for (const m of [mat, smat]) { const was = m.transparent; m.transparent = v < 1; m.opacity = v; m.depthWrite = v >= 1; if (was !== m.transparent) m.needsUpdate = true; }
        mat.alphaTest = v < 1 ? 0.05 : 0.5;
    };
    return c;
}

/* how big something is, measured once: draw it into a big scratch canvas and find where the pixels are */
const R3_SCRATCH = { cv: null, ctx: null, W: 288, H: 320, AX: 144, AY: 280 };
const R3_SIZES = new Map();
function measureEnt(e) {
    const same = e.frame && e.kind !== 'building' ? `${e.kind}|${e.frame}|${e.draw ? 1 : 0}` : null;
    if (same && R3_SIZES.has(same)) return R3_SIZES.get(same);
    const b = measureEnt0(e);
    if (same && b) R3_SIZES.set(same, b);
    return b;
}
function measureEnt0(e) {
    if (e.frame && !e.draw) {
        const f = Assets.frames[e.frame] || (Assets.dyn[e.frame] && [0, 0, Assets.dyn[e.frame].w, Assets.dyn[e.frame].h, Assets.dyn[e.frame].ax, Assets.dyn[e.frame].ay]);
        if (f) { const sx = 3; return { w: f[2] + sx * 2, h: f[3] + 2, ax: f[4] + sx, ay: f[5] + 1, hd: hdHas(e.frame) }; }
    }
    const S0 = R3_SCRATCH;
    if (!S0.cv) { S0.cv = document.createElement('canvas'); S0.cv.width = S0.W; S0.cv.height = S0.H; S0.ctx = S0.cv.getContext('2d', { willReadFrequently: true }); S0.ctx.imageSmoothingEnabled = false; }
    const ctx = S0.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, S0.W, S0.H);
    ctx.setTransform(1, 0, 0, 1, S0.AX - Math.round(e.x), S0.AY - Math.round(e.y));
    R3.drawingCard = true; R3.hdSeen = false;
    try { drawEnt(ctx, e); } catch (err) { console.error(err); } finally { R3.drawingCard = false; }
    const hd = R3.hdSeen;                     // drew something that has HD art: the card gets three pixels to one
    const d = ctx.getImageData(0, 0, S0.W, S0.H).data;
    let x0 = S0.W, y0 = S0.H, x1 = -1, y1 = -1;
    for (let y = 0; y < S0.H; y++) for (let x = 0; x < S0.W; x++) if (d[(y * S0.W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { w: 16, h: 16, ax: 8, ay: 15, hd };
    // a little room to move (shaking trees, swinging signs)
    x0 = Math.max(0, x0 - 4); x1 = Math.min(S0.W - 1, x1 + 4); y0 = Math.max(0, y0 - 4); y1 = Math.min(S0.H - 1, Math.max(y1, S0.AY) + 1);
    return { w: x1 - x0 + 1, h: y1 - y0 + 1, ax: S0.AX - x0, ay: S0.AY - y0, hd };
}
/* trees and statues: see-through while Sarah walks behind (the classic view does it while drawing) */
function seeThroughRaw(e) { const was = R3.drawingCard; R3.drawingCard = false; try { return seeThrough(e); } finally { R3.drawingCard = was; } }

/* a sprite over the 3D view at the transform's scale: the HD version when there is one (smoothly scaled down a third) */
function r3OverSpr(ctx, name) {
    const f = hdHas(name) ? hdNamed(name) : null;
    if (!f) return spr(ctx, name, 0, 0);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(f.c, -f.ax / HD_K, -f.ay / HD_K, f.w / HD_K, f.h / HD_K);
    ctx.imageSmoothingEnabled = was;
}
/* planes, balloons and the gull flock crossing the sky (the classic view's SeaSky.drawSky), each over where it flies */
function r3SkyThings(ctx) {
    if (!G.area || G.area.id !== 'island' || typeof SeaSky === 'undefined') return;
    const v = G.view, put = (x, y, lift) => { const q = R3.project(x, y, lift); if (q.x < -300 || q.y < -300 || q.x > v.w + 300 || q.y > v.h + 300) return false; ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y); return true; };
    R3.over = true;
    try {
        // (drawn over the lit 3D picture, so darkened by hand at night; a plane's wingtip lights blink)
        const dark = G.lightStrength || 0;
        if (dark > 0.05) ctx.filter = `brightness(${1 - dark * 0.65})`;
        for (const s of SeaSky.sky) {
            if (s.kind === 'plane') {
                if (!put(s.x, s.y, 64)) continue;
                ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2); spr(ctx, 'sky_plane', 0, 0);
                if (dark >= 0.3 && !((s.t >> 4) % 2)) { ctx.filter = 'none'; for (const [lx, ly, col] of [[-15, -2, '#ff4a4a'], [14, -2, '#6aff6a']]) { ctx.fillStyle = col; ctx.fillRect(lx - 1, ly - 1, 2, 2); } ctx.filter = `brightness(${1 - dark * 0.65})`; }
            } else if (s.kind === 'balloon') { if (put(s.x, s.y, 48)) spr(ctx, 'sky_balloon', 0, Math.sin(s.t / 50) * 2); }
        }
        const f = SeaSky.flock;
        if (f) for (let i = 0; i < f.n; i++) {
            const ang = f.t / (80 + i * 9) + i * 2.1, x = f.cx + Math.cos(ang) * (34 + i * 9), y = f.cy + Math.sin(ang) * (12 + i * 3);
            if (put(x, y, 40)) spr(ctx, `cr_gull_fly${Math.floor((f.t + i * 7) / 8) % 2}`, 0, 0, Math.sin(ang) > 0);
        }
    } finally { R3.over = false; ctx.filter = 'none'; ctx.setTransform(1, 0, 0, 1, 0, 0); }
}
/* the lighthouse's beam once its lamp is lit again (the flat view's Beam): two beams turning from the lantern room */
function r3Beam(ctx, sc) {
    const b = W0.buildings.lighthouse, dark = G.lightStrength || 0;
    if (!b || G.area.id !== 'island' || !Quests.lamp() || dark < 0.25) return false;
    const p = R3.project((b.x + b.w / 2) * TILE, (b.y + b.h) * TILE, 100), q = { x: p.x * sc, y: p.y * sc, s: p.s * sc };
    if (p.behind) return false;
    const k = Math.min(1, (dark - 0.25) * 2), ang = (G.t / 170) % (Math.PI * 2), len = 420 * q.s;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const dir of [ang, ang + Math.PI]) {
        const g = ctx.createLinearGradient(q.x, q.y, q.x + Math.cos(dir) * len, q.y + Math.sin(dir) * len * 0.45);
        g.addColorStop(0, `rgba(255,240,170,${0.32 * k})`); g.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x + Math.cos(dir - 0.09) * len, q.y + Math.sin(dir - 0.09) * len * 0.45);
        ctx.lineTo(q.x + Math.cos(dir + 0.09) * len, q.y + Math.sin(dir + 0.09) * len * 0.45);
        ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = k;
    ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
    r3OverSpr(ctx, 'lighthouse_glow');
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return true;
}
/* the lighthouse beam and the weather, drawn sharp on a canvas of their own at the screen's resolution */
function r3Sharp() {
    const cv = R3.wx, ctx = cv.getContext('2d'), sc = cv.width / G.view.w;
    if (R3.wxOn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); R3.wxOn = false; }
    if (r3Beam(ctx, sc)) R3.wxOn = true;
    if (r3Weather(ctx, sc)) R3.wxOn = true;
}
/* rain, snow, petals and leaves (the flat view's Weather.parts, in game pixels on the screen) */
function r3Weather(ctx, s) {
    const k = Weather.kind, t = G.t;
    if (!k || k === 'fireflies' || !Weather.parts.length) return false;
    ctx.globalAlpha = 1 - 0.5 * (G.lightStrength || 0);
    if (k === 'rain') {
        // a streak behind each drop, as long as it falls in a frame or so
        ctx.strokeStyle = 'rgba(205,225,250,0.5)'; ctx.lineWidth = Math.max(1, s * 0.3); ctx.lineCap = 'round';
        ctx.beginPath();
        for (const q of Weather.parts) { const x = q.x * s, y = q.y * s; ctx.moveTo(x, y); ctx.lineTo(x + 1.8 * q.s * s, y - 7.5 * q.s * s); }
        ctx.stroke();
    } else if (k === 'snow') {
        // round flakes, the nearer (faster) ones bigger, each with a faint halo
        for (const [al, m] of [[0.22, 2.1], [0.92, 1]]) {
            ctx.fillStyle = `rgba(255,255,255,${al})`;
            ctx.beginPath();
            for (const q of Weather.parts) { const x = q.x * s, y = q.y * s, r = (0.3 + q.s * 0.45) * s * m; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.283); }
            ctx.fill();
        }
    } else {
        // petals and leaves turn as they fall
        const pet = k === 'petals';
        for (const q of Weather.parts) {
            ctx.setTransform(s, 0, 0, s, q.x * s, q.y * s); ctx.rotate(q.p + Math.sin(t / 30 + q.p) * 1.2);
            ctx.fillStyle = pet ? (q.s > 1 ? '#ffd1e1' : '#f7a8c4') : (q.s > 1 ? '#e39a3b' : '#c8702d');
            ctx.beginPath(); ctx.ellipse(0, 0, pet ? 1.9 : 2.1, (pet ? 1.1 : 1.2) * Math.abs(Math.cos(t / 22 + q.p)) + 0.35, 0, 0, 6.283); ctx.fill();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.globalAlpha = 1;
    return true;
}
/* one firefly's soft light at a projected spot */
function r3Glow(ctx, q, al) {
    const r = q.s * 6.5, g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
    g.addColorStop(0, `rgba(255,250,170,${0.95 * al})`); g.addColorStop(0.35, `rgba(220,255,120,${0.45 * al})`); g.addColorStop(1, 'rgba(200,255,100,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
}
/* the night's fireflies (Flutter.flies, drawn by the flat view as dots on its own camera) where they fly in the 3D world */
function r3FlutterLights(ctx) {
    const v = G.view;
    for (const f of Flutter.flies) {
        const glow = 0.5 + 0.5 * Math.sin(f.ph * 2);
        if (glow < 0.15) continue;
        const q = R3.project(f.x, f.y, 10 + Math.sin(f.ph) * 4);
        if (q.x < 0 || q.y < 0 || q.x > v.w || q.y > v.h) continue;
        r3Glow(ctx, q, glow);
    }
}
/* emotes, "talk" prompts and the little "!" by doors, over the 3D view */
function r3Overheads(ctx) {
    const p = G.player;
    const all = NPCs.here().concat(p ? [p] : [], Online.here());
    for (const e of all) {
        if (!e.emote) continue;
        const lift = e.npc ? (e.h || 18) + 8 : 32;
        const q = R3.project(e.x, e.y, lift);
        ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
        r3OverSpr(ctx, 'emote_' + e.emote);
    }
    if (p && !G.busy && !UI.modal && G.showPrompt) {
        const t = frontTarget(p);
        if (t && t.npc) {
            const q = R3.project(t.x, t.y, (t.h || 18) + 6 - Math.sin(G.t / 8));
            ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
            r3OverSpr(ctx, 'prompt');
        }
    }
    if (p && !G.busy && !UI.modal && !UI.dialogOpen && !p.emote && !p.sit && nearDoor(p)) {
        const q = R3.project(p.x, p.y, 34 - Math.sin(G.t / 9));
        ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
        r3OverSpr(ctx, 'prompt');
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------------------------------------------------------------- post: depth of field from alpha, bloom, a warm grade */
const Post3 = (() => {
    let R, rtScene, A, B, C, D, E, F, quad, ocam, mats = {}, hdr = false, w = 0, h = 0;
    const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const pass = (frag, uni) => new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
    function init(renderer) {
        R = renderer;
        const gl = R.getContext();
        hdr = R.capabilities.isWebGL2 && !!gl.getExtension('EXT_color_buffer_float');
        ocam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
        quad.frustumCulled = false;
        mats.down = pass(`uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
            void main(){ gl_FragColor = (texture2D(t, vUv + px * vec2(-1.0,-1.0)) + texture2D(t, vUv + px * vec2(1.0,-1.0)) + texture2D(t, vUv + px * vec2(-1.0,1.0)) + texture2D(t, vUv + px * vec2(1.0,1.0))) * 0.25; }`,
            { t: { value: null }, px: { value: new THREE.Vector2() } });
        mats.blur = pass(`uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
            void main(){ vec4 c = texture2D(t, vUv) * 0.227027;
              c += (texture2D(t, vUv + dir * 1.3846) + texture2D(t, vUv - dir * 1.3846)) * 0.3162162;
              c += (texture2D(t, vUv + dir * 3.2308) + texture2D(t, vUv - dir * 3.2308)) * 0.0702703; gl_FragColor = c; }`,
            { t: { value: null }, dir: { value: new THREE.Vector2() } });
        mats.bright = pass(`uniform sampler2D t; uniform vec2 px; uniform float th; varying vec2 vUv;
            void main(){ vec3 c = (texture2D(t, vUv + px * vec2(-1.0,-1.0)).rgb + texture2D(t, vUv + px * vec2(1.0,-1.0)).rgb + texture2D(t, vUv + px * vec2(-1.0,1.0)).rgb + texture2D(t, vUv + px * vec2(1.0,1.0)).rgb) * 0.25;
              float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + 0.35, l), 1.0); }`,
            { t: { value: null }, px: { value: new THREE.Vector2() }, th: { value: 0.78 } });
        mats.comp = pass(`uniform sampler2D tS, tA, tC, tE; uniform float time, aspect, bloom, dark, gray; uniform vec2 res; varying vec2 vUv;
            float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            void main(){
              vec4 s = texture2D(tS, vUv);
              vec3 a = texture2D(tA, vUv).rgb, c = texture2D(tC, vUv).rgb;
              float k = s.a;
              vec3 col = mix(s.rgb, a, smoothstep(0.0, 0.45, k));
              col = mix(col, c, smoothstep(0.45, 1.0, k));
              col += texture2D(tE, vUv).rgb * bloom;
              /* soft shafts of sunlight from the top left, by day */
              vec2 p = vec2(vUv.x * aspect, vUv.y);
              float d = dot(p - vec2(-0.2, 1.15), normalize(vec2(0.62, -0.78)));
              float across = dot(p - vec2(-0.2, 1.15), normalize(vec2(0.78, 0.62)));
              float rays = 0.5 + 0.5 * sin(across * 9.0 + sin(across * 3.1 + time * 0.15) * 1.7 + time * 0.05);
              rays = pow(rays, 3.0) * smoothstep(1.6, 0.1, d) * smoothstep(0.0, 0.5, d);
              col += vec3(1.0, 0.86, 0.6) * rays * 0.06 * (1.0 - dark) * (1.0 - gray);
              /* grade: cool lifted shadows, warm highlights, a gentle shoulder */
              float l = dot(col, vec3(0.299, 0.587, 0.114));
              col += (1.0 - smoothstep(0.0, 0.55, l)) * vec3(0.012, 0.022, 0.045);
              col *= mix(vec3(0.97, 0.99, 1.04), vec3(1.035, 1.0, 0.95), smoothstep(0.25, 0.9, l));
              col = mix(vec3(l), col, 1.14 - gray * 0.3);
              col = col / (1.0 + max(col - 0.82, 0.0) * 0.9);
              vec2 q = vUv - 0.5; q.x *= aspect * 0.8;
              col *= mix(1.0, 0.8, smoothstep(0.35, 0.95, length(q)));
              col += (h(vUv * res + fract(time)) - 0.5) / 255.0 * 1.5;
              gl_FragColor = vec4(col, 1.0);
            }`, { tS: { value: null }, tA: { value: null }, tC: { value: null }, tE: { value: null }, time: { value: 0 }, aspect: { value: 1 }, bloom: { value: 0.6 },
                dark: { value: 0 }, gray: { value: 0 }, res: { value: new THREE.Vector2() } });
    }
    function target(w, h, ms) {
        const o = { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: !!ms, stencilBuffer: false };
        if (ms && !R3.phone && R.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) { const t = new THREE.WebGLMultisampleRenderTarget(w, h, o); t.samples = 4; return t; }
        return new THREE.WebGLRenderTarget(w, h, o);
    }
    function resize(W_, H_) {
        if (W_ === w && H_ === h) return;
        w = W_; h = H_;
        [rtScene, A, B, C, D, E, F].forEach(t => t && t.dispose());
        rtScene = target(w, h, true);
        const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1), qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2), ew = Math.max(1, w >> 3), eh = Math.max(1, h >> 3);
        A = target(hw, hh); B = target(hw, hh); C = target(qw, qh); D = target(qw, qh); E = target(ew, eh); F = target(ew, eh);
    }
    function run(m, out) { quad.material = m; R.setRenderTarget(out); R.render(quad, ocam); }
    function render(scene, camera, time, grade) {
        R.setRenderTarget(rtScene); R.clear(); R.render(scene, camera);
        const d = mats.down, b = mats.blur;
        d.uniforms.t.value = rtScene.texture; d.uniforms.px.value.set(0.5 / w, 0.5 / h); run(d, A);
        b.uniforms.t.value = A.texture; b.uniforms.dir.value.set(1 / A.width, 0); run(b, B);
        b.uniforms.t.value = B.texture; b.uniforms.dir.value.set(0, 1 / A.height); run(b, A);
        d.uniforms.t.value = A.texture; d.uniforms.px.value.set(0.5 / A.width, 0.5 / A.height); run(d, C);
        b.uniforms.t.value = C.texture; b.uniforms.dir.value.set(1 / C.width, 0); run(b, D);
        b.uniforms.t.value = D.texture; b.uniforms.dir.value.set(0, 1 / C.height); run(b, C);
        const br = mats.bright; br.uniforms.t.value = C.texture; br.uniforms.px.value.set(0.5 / C.width, 0.5 / C.height); run(br, E);
        b.uniforms.t.value = E.texture; b.uniforms.dir.value.set(1.5 / E.width, 0); run(b, F);
        b.uniforms.t.value = F.texture; b.uniforms.dir.value.set(0, 1.5 / E.height); run(b, E);
        const c = mats.comp.uniforms;
        c.tS.value = rtScene.texture; c.tA.value = A.texture; c.tC.value = C.texture; c.tE.value = E.texture;
        c.time.value = time; c.aspect.value = w / h; c.res.value.set(w, h);
        c.dark.value = grade ? grade.dark : 0; c.gray.value = grade ? grade.gray : 0;
        run(mats.comp, null);
    }
    return { init, resize, render };
})();
