/* ---- 31_render3d.js ---- */
/* HD-2D: the same island, drawn as a little 3D world (three.js, where the device has WebGL). The ground (today's
   island picture, paths, rugs...) lies flat; everything that stands (people, trees, houses, furniture) is a card
   standing up on its spot, drawn by its own 2D draw code into a small canvas. A perspective camera looks from the
   south, the world bends away towards a horizon with sky, a sun from the top left casts soft shadows, and a post
   pass adds depth of field, bloom and a warm grade (the same recipe as the art sample David picked).
   The grid is still the grid: the 2D renderer (30_render.js) draws the edit modes (moving buildings, paths,
   decorating), the dance floor, karaoke, jump rope and photos, and every device without WebGL. */
const R3 = {
    ok: false, want: true, drawingCard: false, failed: false,
    renderer: null, scene: null, camera: null, canvas: null,
    sun: null, hemi: null, fill: null, lamps: [], sky: null, sea: null,
    ground: null, wall: null, cards: new Map(), pool: {}, poolUsed: {}, areaId: null, t0: 0,
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
            this.phone = Math.min(screen.width, screen.height) < 600;
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
            for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffd8a0, 0, 7, 1.6); l.visible = false; scene.add(l); this.lamps.push(l); }
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
    unproject(sx, sy) {
        const v = G.view, cam = this.camera;
        const ndc = new THREE.Vector3(sx / v.w * 2 - 1, 1 - sy / v.h * 2, 0.5).unproject(cam);
        const o = cam.position, dir = ndc.sub(o).normalize();
        const f = t => { const yy = o.y + dir.y * t, zz = o.z + dir.z * t, bd = Math.max(0, R3U.uBendZ.value - zz); return yy + R3U.uBendK.value * bd * bd; };
        let lo = 0, hi = 0;
        for (let t = 0.5; t < 600; t *= 1.25) { if (f(t) <= 0) { hi = t; break; } lo = t; }
        if (!hi) return [G.player.x, G.player.y];
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
            this.updateGround(a);
            this.updateLight(a);
            this.updateCards(a);
            R3U.uTime.value = (performance.now() - this.t0) / 1000;
            if (G.frame % 2 === 0) this.renderer.shadowMap.needsUpdate = true;
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
        if (this.ground) { this.scene.remove(this.ground.mesh); this.ground.mesh.geometry.dispose(); this.ground.mat.dispose(); this.ground.tex.dispose(); }
        if (this.wall) { this.scene.remove(this.wall.mesh); this.wall.mesh.geometry.dispose(); this.wall.mat.dispose(); this.wall.tex.dispose(); this.wall = null; }
        this.ground = r3Ground(this.scene, a);
        if (a.interior) this.wall = r3Wall(this.scene, a);
        this.sky.visible = !a.interior;
        this.sea.visible = !a.interior;
        this.areaId = a.id;
        this.t0 = this.t0 || performance.now();
        this.placeCamera(true);
        this.ground.at = null;
    },

    /* ---------------------------------------------------------------- the ground: a window of the flat picture, redrawn now and then */
    updateGround(a) {
        const g = this.ground, cx = this.target.x * TILE, cy = this.target.z / R3_ZS * TILE;
        const far = Math.hypot(cx - (g.at ? g.at[0] : 1e9), cy - (g.at ? g.at[1] : 1e9)) > 6 * TILE;
        if (!a.interior && !far && G.frame % 30 !== 0 && !g.dirty) return;
        if (a.interior && g.at && G.frame % 20 !== 0 && !g.dirty) return;
        g.dirty = false;
        const W = g.cv.width, H = g.cv.height;
        // the window sits a little north of the camera's target: more of the far ground shows than the near
        const x0 = a.interior ? 0 : Math.round(cx - W / 2), y0 = a.interior ? 0 : Math.round(cy - H * 0.62);
        g.at = [cx, cy];
        const ctx = g.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const cam = { x: x0, y: y0 }, v = { w: W, h: H };
        if (a.id === 'island') {
            const img = Assets.ground(a.bgSeason);
            if (img) {
                const sx = clamp(x0, 0, img.width), sy = clamp(y0, 0, img.height);
                const w = Math.min(W - (sx - x0), img.width - sx), h = Math.min(H - (sy - y0), img.height - sy);
                if (w > 0 && h > 0) ctx.drawImage(img, sx, sy, w, h, sx - x0, sy - y0, w, h);
            }
            drawPaths(ctx, a, cam, v);
        } else if (a.bg) {
            // the floor only: the back wall stands up on its own (r3Wall)
            const top = a.floor ? a.floor.y0 * TILE : 0;
            ctx.drawImage(a.bg, 0, top, a.bg.width, a.bg.height - top, 0, top, a.bg.width, a.bg.height - top);
        }
        ctx.translate(-x0, -y0);
        this.drawingCard = true;
        try {
            if (a.drawUnder) a.drawUnder(ctx);
            for (const d of a.decals) spr(ctx, d.frame, d.x, d.y);
            for (const e of a.ents) if (e.layer === 0 && !e.hidden) drawEnt(ctx, e);
        } finally { this.drawingCard = false; }
        g.mesh.position.set(x0 / TILE + W / TILE / 2, 0, (y0 / TILE + H / TILE / 2) * R3_ZS);
        g.tex.needsUpdate = true;
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
        if (a.interior) { this.scene.fog.near = 200; this.scene.fog.far = 400; } else { this.scene.fog.near = 40; this.scene.fog.far = 150; }
        this.renderer.setClearColor(a.interior ? 0x231b2e : fog, 1);
        if (this.sky.material.uniforms) {
            const u = this.sky.material.uniforms;
            u.uZen.value.setRGB(0.25, 0.5, 0.8).lerp(new THREE.Color(0.08, 0.1, 0.25), dark).lerp(new THREE.Color(0.5, 0.55, 0.6), gray);
            u.uMid.value.setRGB(0.53, 0.74, 0.89).lerp(tint, dark * 0.9).lerp(new THREE.Color(0.66, 0.7, 0.74), gray);
            u.uHor.value.copy(fog);
        }
        this.grade = { dark, gray };
        // lamps: the nearest few light up at night
        const lit = L.lamps > 0.02 ? lightSources(a).map(s => ({ s, d: Math.hypot(s[0] / TILE - this.target.x, s[1] / TILE * R3_ZS - this.target.z) })).sort((p, q) => p.d - q.d).slice(0, this.lamps.length) : [];
        this.lamps.forEach((l, i) => {
            const o = lit[i];
            l.visible = !!o;
            if (!o) return;
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
        const tx = this.target.x * TILE, ty = this.target.z / R3_ZS * TILE;
        const reach = this.dist() / 13;
        const x0 = tx - 34 * TILE * reach, x1 = tx + 34 * TILE * reach, y0 = ty - 44 * TILE * reach, y1 = ty + 16 * TILE * reach;
        const seen = new Set();
        const near = e => !(e.x < x0 || e.x > x1 || e.y < y0 || e.y > y1);
        for (const e of a.ents) {
            if (e.hidden || e.layer === 0 || (e.onlyNight && !nightNow) || !near(e)) continue;
            seen.add(e);
            this.staticCard(e, a);
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
            c = makeCard(b.w, b.h, b.ax, b.ay, this.scene);
            c.e = e; c.sig = undefined; c.drawn = -999;
            const tall = b.ay - Math.max(0, b.ay - b.h);
            if (tall <= 20 && b.w >= 22) c.mesh.rotation.x = -0.95;
            else if (tall <= 26 && b.w >= 34) c.mesh.rotation.x = -0.6;
            this.cards.set(e, c);
        }
        c.away = 0;
        const due = sig != null ? sig !== c.sig : G.frame - c.drawn >= (e.anim || e.kind === 'item' ? 4 : 12);
        if (due) { drawCard(c, e); c.sig = sig; c.drawn = G.frame; }
        placeCard(c, e, a);
        // trees and statues go see-through while Sarah is behind them
        const fade = seeThroughRaw(e);
        c.setFade(fade);
    },
    movingCard(k, e, a) {
        const list = this.pool[k] || (this.pool[k] = []);
        const i = this.poolUsed[k] = (this.poolUsed[k] || 0) + 1;
        let c = list[i - 1];
        if (!c) { c = k === 'p' ? makeCard(48, 72, 24, 62, this.scene) : makeCard(80, 150, 40, 140, this.scene); list.push(c); }
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
function r3Ground(scene, a) {
    const W = a.interior ? Math.min(2048, a.w * TILE) : 1024, H = a.interior ? Math.min(2048, a.h * TILE) : 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
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
    return { cv, ctx, tex, mat, mesh, at: null, dirty: true };
}
/* indoors: the back wall stands up behind the floor */
function r3Wall(scene, a) {
    const top = a.floor.y0 * TILE, W = a.w * TILE;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = top;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(a.bg, 0, 0, W, top, 0, 0, W, top);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex }), { key: 'wall' });
    const geo = new THREE.PlaneGeometry(W / TILE, top / TILE * R3_VS * 1.6);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(W / TILE / 2, top / TILE * R3_VS * 0.8, top / TILE * R3_ZS - 0.02);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return { cv, ctx, tex, mat, mesh };
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

/* ---------------------------------------------------------------- cards */
function makeCard(w, h, ax, ay, scene) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
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
    const c = { cv, ctx, tex, mat, mesh, depth, w, h, ax, ay, away: 0, fade: 1 };
    c.setFade = f => {
        if (f === c.fade) return;
        c.fade = f;
        mat.transparent = f < 1; mat.opacity = f; mat.depthWrite = f >= 1; mat.alphaTest = f < 1 ? 0.05 : 0.5;
        mat.needsUpdate = true;
    };
    return c;
}
function drawCard(c, e) {
    const ctx = c.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.w, c.h);
    ctx.setTransform(1, 0, 0, 1, c.ax - Math.round(e.x), c.ay - Math.round(e.y));
    R3.drawingCard = true;
    try { drawEnt(ctx, e); if (e.kind === 'player' && G.held) spr(ctx, itemIcon(G.held), e.x, e.y - 28); }
    catch (err) { console.error(err); }
    finally { R3.drawingCard = false; }
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
function measureEnt(e) {
    if (e.frame && !e.draw) {
        const f = Assets.frames[e.frame] || (Assets.dyn[e.frame] && [0, 0, Assets.dyn[e.frame].w, Assets.dyn[e.frame].h, Assets.dyn[e.frame].ax, Assets.dyn[e.frame].ay]);
        if (f) { const sx = 3; return { w: f[2] + sx * 2, h: f[3] + 2, ax: f[4] + sx, ay: f[5] + 1 }; }
    }
    const S0 = R3_SCRATCH;
    if (!S0.cv) { S0.cv = document.createElement('canvas'); S0.cv.width = S0.W; S0.cv.height = S0.H; S0.ctx = S0.cv.getContext('2d', { willReadFrequently: true }); S0.ctx.imageSmoothingEnabled = false; }
    const ctx = S0.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, S0.W, S0.H);
    ctx.setTransform(1, 0, 0, 1, S0.AX - Math.round(e.x), S0.AY - Math.round(e.y));
    R3.drawingCard = true;
    try { drawEnt(ctx, e); } catch (err) { console.error(err); } finally { R3.drawingCard = false; }
    const d = ctx.getImageData(0, 0, S0.W, S0.H).data;
    let x0 = S0.W, y0 = S0.H, x1 = -1, y1 = -1;
    for (let y = 0; y < S0.H; y++) for (let x = 0; x < S0.W; x++) if (d[(y * S0.W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { w: 16, h: 16, ax: 8, ay: 15 };
    // a little room to move (shaking trees, swinging signs)
    x0 = Math.max(0, x0 - 4); x1 = Math.min(S0.W - 1, x1 + 4); y0 = Math.max(0, y0 - 4); y1 = Math.min(S0.H - 1, Math.max(y1, S0.AY) + 1);
    return { w: x1 - x0 + 1, h: y1 - y0 + 1, ax: S0.AX - x0, ay: S0.AY - y0 };
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
        if (ms && R.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) { const t = new THREE.WebGLMultisampleRenderTarget(w, h, o); t.samples = 4; return t; }
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
