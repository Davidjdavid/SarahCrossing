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
            const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' });
            r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
            r.setClearColor(0x3a8fd0, 1);
            this.renderer = r;
            // phones and tablets get the handheld rules: less drawn at once, fewer shadow updates, a lighter picture
            let coarse = false;
            try { coarse = matchMedia('(pointer: coarse)').matches; } catch (e) { /* old browser */ }
            this.phone = coarse || Math.min(screen.width, screen.height) < 600;
            Post3.init(r);
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
        this.canvas.style.display = on ? 'block' : 'none';
    },
    resize() {
        if (!this.ok) return;
        const app = $('#app'), w = app.clientWidth, h = app.clientHeight;
        const maxPx = (this.phone ? 1.9e6 : 3.2e6) * this.quality;
        const p = Math.max(0.5, Math.min(devicePixelRatio || 1, Math.sqrt(maxPx / Math.max(1, w * h))));
        this.renderer.setPixelRatio(p);
        this.renderer.setSize(w, h, false);
        this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
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
        if (a.interior) { tx = a.w * TILE / 2; ty = (a.floor.y0 + a.floor.h * 0.55) * TILE; }
        const X = tx / TILE, Z = ty / TILE * R3_ZS;
        if (snap || this.areaId !== a.id) { this.target.x = X; this.target.z = Z; }
        else { this.target.x += (X - this.target.x) * 0.14; this.target.z += (Z - this.target.z) * 0.14; }
        const pr = this.pitch(), d = this.dist(), cam = this.camera;
        cam.position.set(this.target.x, R3_CAM.ly + d * Math.sin(pr), this.target.z + d * Math.cos(pr));
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
        const Z = y / TILE * R3_ZS, bd = Math.max(0, R3U.uBendZ.value - Z), drop = R3U.uBendK.value * bd * bd;
        P.set(x / TILE, (lift || 0) / TILE * R3_VS - drop, Z).project(this.camera);
        Q.set(x / TILE + 1, (lift || 0) / TILE * R3_VS - drop, Z).project(this.camera);
        const sx = (P.x + 1) / 2 * v.w, sy = (1 - P.y) / 2 * v.h;
        return { x: sx, y: sy, s: Math.abs((Q.x - P.x) / 2 * v.w) / TILE, behind: P.z > 1 };
    },
    /* overlay canvas pixels -> world pixels on the (bent) ground */
    unproject(sx, sy, orNull) {
        const v = G.view, cam = this.camera;
        const ndc = new THREE.Vector3(sx / v.w * 2 - 1, 1 - sy / v.h * 2, 0.5).unproject(cam);
        const o = cam.position, dir = ndc.sub(o).normalize();
        const f = t => { const yy = o.y + dir.y * t, zz = o.z + dir.z * t, bd = Math.max(0, R3U.uBendZ.value - zz); return yy + R3U.uBendK.value * bd * bd; };
        let lo = 0, hi = 0;
        for (let t = 0.5; t < 600; t *= 1.25) { if (f(t) <= 0) { hi = t; break; } lo = t; }
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
            this.placeCamera(false);
            if (!this.view || G.frame % 4 === 0) this.updateView();
            if (G.frame % 30 === 0) this.texelSize();
            hdWarm();
            this.updateGround(a);
            this.updateLight(a);
            this.updateCards(a);
            R3U.uTime.value = (performance.now() - this.t0) / 1000;
            if (G.frame % (this.phone ? 3 : 2) === 0) this.renderer.shadowMap.needsUpdate = true;
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
        this.drawingCard = true; this.hdCard = k > 1;
        try {
            if (a.drawUnder) a.drawUnder(ctx);
            for (const d of a.decals) spr(ctx, d.frame, d.x, d.y);
            for (const e of a.ents) if (e.layer === 0 && !e.hidden) drawEnt(ctx, e);
        } finally { this.drawingCard = false; this.hdCard = false; }
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
        const want = new Set();
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
            const k = cx + ',' + cy;
            want.add(k);
            let ch = this.chunks.get(k);
            if (!ch) {
                if (made >= (this.phone ? 2 : 4) && this.chunks.size) continue;        // a few new pieces a frame, nearest first next time
                ch = makeChunk(this.scene, cx, cy);
                this.chunks.set(k, ch);
                paintChunk(ch, a);
                made++;
            }
            ch.mesh.visible = true;
            ch.used = G.frame;
        }
        for (const [k, ch] of this.chunks) if (!want.has(k)) { ch.mesh.visible = false; if (G.frame - ch.used > 600 && this.chunks.size > 40) { dropChunk(ch); this.chunks.delete(k); } }
        // one visible piece repainted every few frames (or all of them after the flat view was used to change things)
        if (this.ground.dirty) { for (const ch of this.chunks.values()) ch.stale = true; this.ground.dirty = false; }
        if (G.frame % 6 === 0) {
            const vis = [...this.chunks.values()].filter(ch => ch.mesh.visible);
            const stale = vis.find(ch => ch.stale);
            const ch = stale || vis[(this._rr = ((this._rr || 0) + 1)) % Math.max(1, vis.length)];
            if (ch) { paintChunk(ch, a); ch.stale = false; }
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
        this.sun.castShadow = a.interior ? true : day > 0.15;
        this.hemi.intensity = 0.38 + 0.08 * day;
        this.hemi.color.setRGB(0.69, 0.79, 0.93).lerp(tint, dark * 0.8);
        this.hemi.groundColor.setRGB(0.54, 0.49, 0.34).lerp(tint, dark * 0.8);
        const fog = new THREE.Color(0.74, 0.86, 0.94).lerp(new THREE.Color(0.62, 0.66, 0.7), gray).lerp(tint, dark * 0.85);
        this.scene.fog.color.copy(fog);
        if (a.interior) { this.scene.fog.near = 200; this.scene.fog.far = 400; }
        else { const f = this.farTiles() * R3_ZS, d = this.dist(); this.scene.fog.near = d + f * 0.45; this.scene.fog.far = d + f * 0.98; }
        this.renderer.setClearColor(a.interior ? 0x231b2e : fog, 1);
        if (this.sky.material.uniforms) {
            const u = this.sky.material.uniforms;
            u.uZen.value.setRGB(0.25, 0.5, 0.8).lerp(new THREE.Color(0.08, 0.1, 0.25), dark).lerp(new THREE.Color(0.5, 0.55, 0.6), gray);
            u.uMid.value.setRGB(0.53, 0.74, 0.89).lerp(tint, dark * 0.9).lerp(new THREE.Color(0.66, 0.7, 0.74), gray);
            u.uHor.value.copy(fog);
        }
        this.grade = { dark, gray };
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
        if (a.id === 'island') { for (const c of Critters.ents()) movers.push(['f', c]); for (const s of SeaSky.ents()) movers.push(['f', s]); for (const b of Flutter.ents()) movers.push(['f', b]); }
        for (const f of G.fx) if (f.sorted) movers.push(['f', f]);
        for (const [k, e] of movers) if (near(e)) this.movingCard(k, e, a);
        for (const k of Object.keys(this.pool)) this.pool[k].forEach((c, i) => { if (i >= this.poolUsed[k]) c.mesh.visible = false; });
    },
    /* a card for something that stays put: its size is measured once, it is redrawn when it changes */
    staticCard(e, a) {
        let c = this.cards.get(e);
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
            drawCard(c, e);
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
        if (!c) { c = k === 'p' ? makeCard(48, 72, 24, 62, this.scene, HD_K) : makeCard(80, 150, 40, 140, this.scene); c.pooled = true; list.push(c); }
        drawCard(c, e);
        placeCard(c, e, a);
        c.setFade(1);
        c.mesh.castShadow = !(e.alt > 6);
    },
    dropCard(c) {
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
        r3Overheads(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawWeather(ctx, v);
        if (G.area.id === 'island') Flutter.drawLights(ctx);
        for (const f of G.fx) if (f.screen) f.draw(ctx);
        if (G.flash) { ctx.fillStyle = `rgba(255,246,214,${G.flash})`; ctx.fillRect(0, 0, v.w, v.h); }
        if (G.fade) { ctx.fillStyle = `rgba(20,16,40,${G.fade})`; ctx.fillRect(0, 0, v.w, v.h); }
    },
};
/* the camera: a little steeper indoors so the back wall shows; the world bends away after a few tiles */
const R3_CAM = { fov: 46, pitch: 25, pitchIn: 40, dist: 13, ly: 0.6, bendStart: 4, bendK: 0.0042 };
const R3_FAR = { phone: 17, full: 27 };     // tiles ahead that get drawn (at the normal zoom)
const R3_ZS = 1.25;         // the flat art is drawn for a steeper view: stretch the ground a little in depth
const R3_VS = 1.12;         // and stand cards a little taller so they don't look squashed from this angle

function hasWebGL() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

/* ---------------------------------------------------------------- shared shader bits (bend, cloud shade, depth-of-field amount) */
const R3U = {
    uBendK: { value: 0.0024 }, uBendZ: { value: 0 }, uTime: { value: 0 },
    uDof: { value: new THREE_V4(22, 70, 8.5, 5.5) },
};
function THREE_V4(a, b, c, d) { return typeof THREE !== 'undefined' ? new THREE.Vector4(a, b, c, d) : { x: a, y: b, z: c, w: d, set() {} }; }
const R3_GLSL = `
uniform float uBendK; uniform float uBendZ; uniform float uTime; uniform vec4 uDof;
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
        let fs = R3_GLSL + sh.fragmentShader;
        if (!o.noCloud) fs = fs.replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();',
            'reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask() * cloudShade(vWp.xz);');
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
    const mat = r3Patch(new THREE.MeshLambertMaterial({ color: 0x2f7fc0 }), { key: 'sea', noCloud: false,
        fend: 'float sp = step(0.985, r3n(vWp.xz * 1.7 + vec2(uTime * 0.4, uTime * 0.13))); gl_FragColor.rgb += sp * 0.35;' });
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
        uniforms: { uZen: { value: new THREE.Color('#3f80cc') }, uMid: { value: new THREE.Color('#86bce4') }, uHor: { value: new THREE.Color('#d2e5ec') }, uTime: R3U.uTime },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }',
        fragmentShader: `uniform vec3 uZen, uMid, uHor; uniform float uTime; varying vec3 vDir;
            float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
            void main(){
              float y = clamp(vDir.y, -0.2, 1.0);
              vec3 c = mix(uHor, uMid, smoothstep(-0.03, 0.035, y));
              c = mix(c, uZen, smoothstep(0.035, 0.35, y));
              vec2 q = vDir.xz / max(0.08, vDir.y + 0.12) * 1.6 + vec2(uTime * 0.01, 0.0);
              float cl = n(q) * 0.6 + n(q * 2.3) * 0.3 + n(q * 5.1) * 0.1;
              c = mix(c, vec3(1.0), smoothstep(0.6, 0.78, cl) * smoothstep(0.0, 0.08, y) * 0.75);
              gl_FragColor = vec4(c, 1.0);
            }` });
    const s = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
    s.frustumCulled = false; s.renderOrder = -4;
    s.onBeforeRender = () => { s.position.copy(R3.camera.position); };
    scene.add(s);
    return s;
}

/* ---------------------------------------------------------------- the island's ground, in pieces */
const R3_CHUNK = 256;
function makeChunk(scene, cx, cy) {
    const cv = document.createElement('canvas');
    cv.width = R3_CHUNK; cv.height = R3_CHUNK;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.02, color: 0xd8d8d8 }), { key: 'ground' });
    const s = R3_CHUNK / TILE;
    const geo = new THREE.PlaneGeometry(s, s * R3_ZS, 6, 6);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx * s + s / 2, 0, (cy * s + s / 2) * R3_ZS);
    mesh.receiveShadow = true;
    mesh.renderOrder = -2;
    scene.add(mesh);
    return { cx, cy, cv, ctx, tex, mat, mesh, used: G.frame, stale: false };
}
function paintChunk(ch, a) {
    const ctx = ch.ctx, x0 = ch.cx * R3_CHUNK, y0 = ch.cy * R3_CHUNK, N = R3_CHUNK;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, N, N);
    const img = Assets.ground(a.bgSeason);
    if (img) { const w = Math.min(N, img.width - x0), h = Math.min(N, img.height - y0); if (w > 0 && h > 0) ctx.drawImage(img, x0, y0, w, h, 0, 0, w, h); }
    drawPaths(ctx, a, { x: x0, y: y0 }, { w: N, h: N });
    ctx.translate(-x0, -y0);
    R3.drawingCard = true;
    try {
        for (const d of a.decals) if (d.x > x0 - 48 && d.x < x0 + N + 48 && d.y > y0 - 16 && d.y < y0 + N + 48) spr(ctx, d.frame, d.x, d.y);
        for (const e of a.ents) if (e.layer === 0 && !e.hidden && e.x > x0 - 64 && e.x < x0 + N + 64 && e.y > y0 - 32 && e.y < y0 + N + 64) drawEnt(ctx, e);
    } finally { R3.drawingCard = false; }
    ch.tex.needsUpdate = true;
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
    let lift = 0, z = e.y / TILE * R3_ZS;
    // indoors, things on the back wall hang on it
    if (a.interior && a.floor && e.y < a.floor.y0 * TILE + 2) { lift = (a.floor.y0 * TILE - e.y) / TILE * R3_VS * 1.6; z = a.floor.y0 * TILE / TILE * R3_ZS + 0.01; }
    c.mesh.position.set(Math.round(e.x) / TILE, lift, z + 0.001 * ((e.x * 7) % 3));
    c.mesh.visible = true;
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
        if (f) { const sx = 3; return { w: f[2] + sx * 2, h: f[3] + 2, ax: f[4] + sx, ay: f[5] + 1, hd: !!hdNamed(e.frame) }; }
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

/* emotes, "talk" prompts and the little "!" by doors, over the 3D view */
function r3Overheads(ctx) {
    const p = G.player;
    const all = NPCs.here().concat(p ? [p] : [], Online.here());
    for (const e of all) {
        if (!e.emote) continue;
        const lift = e.npc ? (e.h || 18) + 8 : 32;
        const q = R3.project(e.x, e.y, lift);
        ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
        spr(ctx, 'emote_' + e.emote, 0, 0);
    }
    if (p && !G.busy && !UI.modal && G.showPrompt) {
        const t = frontTarget(p);
        if (t && t.npc) {
            const q = R3.project(t.x, t.y, (t.h || 18) + 6 - Math.sin(G.t / 8));
            ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
            spr(ctx, 'prompt', 0, 0);
        }
    }
    if (p && !G.busy && !UI.modal && !UI.dialogOpen && !p.emote && !p.sit && nearDoor(p)) {
        const q = R3.project(p.x, p.y, 34 - Math.sin(G.t / 9));
        ctx.setTransform(q.s, 0, 0, q.s, q.x, q.y);
        spr(ctx, 'prompt', 0, 0);
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
              col = mix(vec3(l), col, 1.06 - gray * 0.25);
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
