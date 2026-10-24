/* ---- 30_render.js ---- */
/* Camera, drawing, lighting and weather */
const Render = {
    canvas: null, ctx: null, lc: null, lctx: null,
    init() {
        this.canvas = $('#game');
        this.ctx = this.canvas.getContext('2d');      // see-through: HD-2D draws under it
        this.lc = document.createElement('canvas');
        this.lctx = this.lc.getContext('2d');
        addEventListener('resize', () => this.resize());
        if (window.visualViewport) visualViewport.addEventListener('resize', () => this.resize());
        this.resize();
    },
    /* whole device pixels per game pixel: the zoom level decides how much island fits on the short side of the screen */
    wantScale() {
        const app = $('#app');
        const dpr = window.devicePixelRatio || 1;
        const short = Math.min(Math.round(app.clientWidth * dpr), Math.round(app.clientHeight * dpr));
        return Math.max(1, Math.floor(short / ZOOM_SIZES[Zoom.level()]));
    },
    resize() {
        const app = $('#app');
        const cw = app.clientWidth, ch = app.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
        const scale = this.wantScale();
        const vw = Math.ceil(pw / scale), vh = Math.ceil(ph / scale);
        this.canvas.width = vw; this.canvas.height = vh;
        this.canvas.style.width = (vw * scale / dpr) + 'px';
        this.canvas.style.height = (vh * scale / dpr) + 'px';
        this.lc.width = vw; this.lc.height = vh;
        G.view = { w: vw, h: vh, scale, dpr, cssScale: scale / dpr };
        this.ctx.imageSmoothingEnabled = false;
    },
};

/* zoom: close, normal, far, farther. Games and the camera stay at normal; rooms never zoom out past normal (they
   already fit). Kept per device. */
const ZOOM_SIZES = [150, 186, 262, 360];
const ZOOM_NAMES = ['Close', 'Normal', 'Far', 'Farthest'];
const Zoom = {
    pref: 1,
    load() { try { const v = +localStorage.getItem('sc_zoom'); if (v >= 0 && v < ZOOM_SIZES.length && localStorage.getItem('sc_zoom') != null) this.pref = v; } catch (e) { /* ignore */ } },
    save() { try { localStorage.setItem('sc_zoom', String(this.pref)); } catch (e) { /* ignore */ } },
    locked() { return typeof Dance !== 'undefined' && (Dance.on || Karaoke.on || Rope.on || Photo.on); },
    level() {
        if (this.locked()) return 1;
        if (typeof Mover !== 'undefined' && Mover.on) return Math.max(this.pref, 2);
        if (G.area && G.area.interior) return Math.min(this.pref, 1);
        return this.pref;
    },
    set(lv, quiet) {
        lv = clamp(lv, 0, ZOOM_SIZES.length - 1);
        // skip steps that look the same on this screen
        const before = Render.wantScale();
        const old = this.pref;
        this.pref = lv;
        const dir = lv - old;
        while (dir && Render.wantScale() === before && this.pref + Math.sign(dir) >= 0 && this.pref + Math.sign(dir) < ZOOM_SIZES.length) this.pref += Math.sign(dir);
        if (Render.wantScale() === before && dir) { this.pref = old; if (!quiet) UI.toast(dir > 0 ? 'That is as far as it goes.' : 'That is as close as it goes.'); return; }
        this.save();
        Render.resize();
        updateCam(true);
        if (!quiet) UI.toast(`Zoom: ${ZOOM_NAMES[this.pref]}`);
        HUD.zoomButtons && HUD.zoomButtons();
    },
    out() { this.set(this.pref + 1); },
    in() { this.set(this.pref - 1); },
    /* keep the canvas at the right scale (zoom locks and unlocks as games start and rooms change) */
    tick() { if (Render.canvas && Render.wantScale() !== G.view.scale) { Render.resize(); updateCam(true); } },
};
function screenOf(x, y, lift) {
    const cs = G.view.cssScale;
    if (R3.active()) { const p = R3.project(x, y, lift || 0); return [p.x * cs, p.y * cs]; }
    return [(x - G.cam.x) * cs, (y - (lift || 0) - G.cam.y) * cs];
}
function updateCam(snap) {
    const a = G.area, v = G.view, p = G.player;
    if (!a || !p) return;
    const mw = a.w * TILE, mh = a.h * TILE;
    let tx = p.x - v.w / 2, ty = p.y - 12 - v.h / 2;
    if (G.camTarget) { tx = G.camTarget[0] - v.w / 2; ty = G.camTarget[1] - v.h / 2; }
    const sh = G.camShift || [0, 0];
    tx = mw <= v.w ? (mw - v.w) / 2 + sh[0] : clamp(tx, 0, mw - v.w);
    ty = mh <= v.h ? (mh - v.h) / 2 - (a.interior ? 6 : 0) + sh[1] : clamp(ty, 0, mh - v.h);
    if (snap || !G.camF) G.camF = [tx, ty];
    else { G.camF[0] += (tx - G.camF[0]) * 0.18; G.camF[1] += (ty - G.camF[1]) * 0.18; }
    G.cam.x = Math.round(G.camF[0]); G.cam.y = Math.round(G.camF[1]);
}

function drawWorld() {
    const ctx = Render.ctx, v = G.view, a = G.area, cam = G.cam;
    if (!a) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = a.interior ? '#231b2e' : '#3a8fd0';
    ctx.fillRect(0, 0, v.w, v.h);
    // ground
    if (a.id === 'island') {
        Ground.draw(ctx, a.bgSeason, cam.x, cam.y, v.w, v.h, 0, 0);
        Ground.around(a.bgSeason, cam.x + v.w / 2, cam.y + v.h / 2, Math.max(v.w, v.h) / 2 + 160);
        drawPaths(ctx, a, cam, v);
        drawWaterSparkles(ctx, a, cam, v);
    } else if (a.bg) {
        ctx.drawImage(a.bg, -cam.x, -cam.y);
    }
    ctx.translate(-cam.x, -cam.y);
    if (a.drawUnder) a.drawUnder(ctx);
    // decals
    for (const d of a.decals) {
        if (d.x < cam.x - 16 || d.x > cam.x + v.w + 16 || d.y < cam.y - 8 || d.y > cam.y + v.h + 24) continue;
        spr(ctx, d.frame, d.x, d.y);
    }
    // sorted things
    const list = [];
    const x0 = cam.x - 64, x1 = cam.x + v.w + 64, y0 = cam.y - 16, y1 = cam.y + v.h + 90;
    const nightNow = hourIn(Clock.hourF(), 21, 27);
    for (const e of a.ents) {
        if (e.hidden || (e.onlyNight && !nightNow)) continue;
        if (e.x < x0 || e.x > x1 || e.y < y0 || e.y > y1) continue;
        if (e.layer === 0) { drawEnt(ctx, e); continue; }
        list.push(e);
    }
    for (const n of NPCs.here()) if (!n.hidden) list.push(n);
    if (a.id === 'island') { for (const c of Critters.ents()) list.push(c); for (const s of SeaSky.ents()) list.push(s); for (const b of Flutter.ents()) list.push(b); }
    if (G.player && !G.player.hidden) list.push(G.player);
    for (const o of Online.here()) list.push(o);
    for (const f of G.fx) if (f.sorted) list.push(f);
    list.sort((p, q) => (p.sy != null ? p.sy : p.y) - (q.sy != null ? q.sy : q.y));
    for (const e of list) drawEnt(ctx, e);
    SeaSky.drawSky(ctx);
    // overhead: emotes, prompts, fx
    for (const f of G.fx) if (!f.sorted && !f.screen) f.draw(ctx);
    drawOverheads(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawLighting(ctx, a, cam, v);
    SeaSky.drawLights(ctx);
    Flutter.drawLights(ctx);
    Beam.drawLights(ctx);
    drawWeather(ctx, v);
    for (const f of G.fx) if (f.screen) f.draw(ctx);
    if (G.flash) { ctx.fillStyle = `rgba(255,246,214,${G.flash})`; ctx.fillRect(0, 0, v.w, v.h); }
    if (G.fade) { ctx.fillStyle = `rgba(20,16,40,${G.fade})`; ctx.fillRect(0, 0, v.w, v.h); }
}

function drawEnt(ctx, e) {
    if (e.kind === 'player') return drawPlayer(ctx, e);
    if (e.npc) return drawNPC(ctx, e);
    const fade = seeThrough(e);
    if (fade < 1) ctx.globalAlpha = fade;
    if (e.draw) e.draw(ctx);
    else if (e.frame) {
        const sx = e.shake ? Math.round(Math.sin(e.shake * 1.3) * 1.5) : 0;
        spr(ctx, e.frame, e.x + sx, e.y, e.flip);
    }
    if (e.kind === 'tree') Sparkle.draw(ctx, e);
    if (fade < 1) ctx.globalAlpha = 1;
}
/* trees go see-through when Sarah walks behind them */
function seeThrough(e) {
    if (R3.drawingCard) return 1;          // HD-2D fades the whole card instead
    const p = G.player;
    if (!p || p.hidden || !(e.kind === 'tree' || e.kind === 'fruittree' || e.kind === 'bigtree' || e.kind === 'oldtree' || e.kind === 'statue')) return 1;
    const big = e.kind === 'bigtree' || e.kind === 'oldtree';
    if (p.y >= e.y || p.y < e.y - (big ? 84 : 46) || Math.abs(p.x - e.x) > (big ? 32 : 15)) return 1;
    return 0.55;
}

function drawWaterSparkles(ctx, a, cam, v) {
    const tx0 = Math.max(0, Math.floor(cam.x / TILE)), ty0 = Math.max(0, Math.floor(cam.y / TILE));
    const tx1 = Math.min(a.w - 1, Math.ceil((cam.x + v.w) / TILE)), ty1 = Math.min(a.h - 1, Math.ceil((cam.y + v.h) / TILE));
    const t = G.t;
    for (let ty = ty0; ty <= ty1; ty++) {
        const row = a.water[ty];
        for (let tx = tx0; tx <= tx1; tx++) {
            const c = row[tx];
            if (c === '.') continue;
            const h = (tx * 73856093) ^ (ty * 19349663);
            const ph = (t / 40 + (h & 63) / 9) % 7;
            if (ph > 2.2) continue;
            const x = tx * TILE + (h >>> 3) % 13 - cam.x + 1, y = ty * TILE + (h >>> 7) % 13 - cam.y + 1;
            const k = ph < 1.1 ? ph : 2.2 - ph;
            ctx.fillStyle = c === 'h' ? `rgba(255,255,255,${0.5 * k})` : `rgba(255,255,255,${0.75 * k})`;
            ctx.fillRect(x, y, k > 0.55 ? 3 : 2, 1);
            if (c === 'h' && (h & 3) === 0) {    // hot spring steam
                const sy = (t / 3 + (h & 31)) % 18;
                ctx.fillStyle = `rgba(255,255,255,${0.22 * (1 - sy / 18)})`;
                ctx.fillRect(x + Math.sin((t + h) / 20) * 2, y - sy, 2, 2);
            }
        }
    }
}

function lightSources(a) {
    const out = [];
    for (const e of a.ents) if (e.light) out.push([e.x, e.y + (e.light.y || 0), e.light.r, e.light.c]);
    if (a.id === 'island') {
        for (const e of a.ents) if (e.kind === 'building') {
            const b = e.b;
            out.push([(b.x + b.w / 2) * TILE, (b.y + b.h) * TILE - 18, b.w * 9, e.id === 'club' ? 'pink' : null]);
        }
    }
    return out;
}
function drawLighting(ctx, a, cam, v) {
    let L;
    const h = Clock.hourF();
    if (a.interior) {
        const o = lightAt(h, 'sunny');
        L = { col: [60, 44, 90], alpha: a.club ? 0.3 : Math.min(0.42, o.alpha * 0.8), gray: 0, lamps: 1 };
    } else {
        L = lightAt(h, G.weather);
    }
    G.lamps = L.lamps;
    const strength = Math.min(1, L.alpha * 1.65);
    G.lightStrength = strength;
    if (strength < 0.01 && L.gray < 0.01) return;
    const lc = Render.lc, l = Render.lctx;
    const g = L.gray;
    const mul = [0, 1, 2].map(i => Math.round(lerp(lerp(255, L.col[i], strength), 150, g)));
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = `rgb(${mul[0]},${mul[1]},${mul[2]})`;
    l.fillRect(0, 0, lc.width, lc.height);
    const lights = [];
    if (L.lamps > 0.01) {
        l.globalCompositeOperation = 'lighter';
        for (const [x, y, r, c] of lightSources(a)) {
            const sx = x - cam.x, sy = y - cam.y;
            if (sx < -r || sy < -r || sx > v.w + r || sy > v.h + r) continue;
            const gr = l.createRadialGradient(sx, sy, 2, sx, sy, r);
            const k = L.lamps * (a.interior ? 0.9 : 0.85);
            gr.addColorStop(0, `rgba(255,236,200,${k})`);
            gr.addColorStop(0.5, `rgba(255,220,170,${k * 0.5})`);
            gr.addColorStop(1, 'rgba(255,220,170,0)');
            l.fillStyle = gr;
            l.fillRect(sx - r, sy - r, r * 2, r * 2);
            lights.push([sx, sy, r, c]);
        }
        // Sarah carries a little light at night so she never gets lost
        const p = G.player;
        if (p && !a.interior) {
            const sx = p.x - cam.x, sy = p.y - 10 - cam.y;
            const gr = l.createRadialGradient(sx, sy, 2, sx, sy, 40);
            gr.addColorStop(0, `rgba(255,240,220,${0.45 * L.lamps})`);
            gr.addColorStop(1, 'rgba(255,240,220,0)');
            l.fillStyle = gr;
            l.fillRect(sx - 40, sy - 40, 80, 80);
        }
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lc, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    if (a.club) clubSpots(ctx, a, cam);
    for (const [sx, sy, r, c] of lights) {
        const gr = ctx.createRadialGradient(sx, sy, 1, sx, sy, r * 0.55);
        const col = c === 'pink' ? '255,90,170' : c === 'fire' ? '255,140,60' : '255,190,110';
        gr.addColorStop(0, `rgba(${col},${0.22 * L.lamps})`);
        gr.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
}

/* ---------------------------------------------------------------- weather particles (screen space) */
const Weather = { parts: [], kind: null };
function weatherKind() {
    if (G.area.interior) return null;
    const w = G.weather;
    if (w === 'rain') return 'rain';
    if (w === 'snow') return 'snow';
    const ev = G.events || new Set();
    const s = Clock.season();
    const h = Clock.hourF();
    if (ev.has('blossom')) return 'petals';
    if (s === 'fall') return 'leaves';
    void ev;
    return null;
}
function updateWeather() {
    const k = weatherKind();
    const v = G.view;
    if (k !== Weather.kind) { Weather.kind = k; Weather.parts = []; }
    if (!k) return;
    const target = { rain: 90, snow: 60, petals: 14, leaves: 10, fireflies: 16 }[k];
    while (Weather.parts.length < target) {
        Weather.parts.push({ x: R() * v.w, y: R() * v.h, s: 0.5 + R(), p: R() * 6.28 });
    }
    const dx = G.cam.x - (Weather.cx || G.cam.x), dy = G.cam.y - (Weather.cy || G.cam.y);
    Weather.cx = G.cam.x; Weather.cy = G.cam.y;
    // a jump (a door, a teleport) scatters them again instead of bunching them all at one edge
    const jump = Math.abs(dx) > v.w / 2 || Math.abs(dy) > v.h / 2;
    for (const q of Weather.parts) {
        if (jump) { q.x = R() * v.w; q.y = R() * v.h; } else { q.x -= dx; q.y -= dy; }
        if (k === 'rain') { q.x -= 1.2 * q.s; q.y += 5 * q.s; }
        else if (k === 'snow') { q.x += Math.sin(G.t / 40 + q.p) * 0.3; q.y += 0.45 * q.s; }
        else if (k === 'petals' || k === 'leaves') { q.x += 0.5 * q.s + Math.sin(G.t / 30 + q.p) * 0.4; q.y += 0.35 * q.s; }
        else { q.x += Math.sin(G.t / 60 + q.p) * 0.25; q.y += Math.cos(G.t / 70 + q.p * 2) * 0.2; }
        if (q.y > v.h + 4) { q.y = -4; q.x = R() * v.w; }
        if (q.y < -6) q.y = v.h + 2;
        if (q.x < -6) q.x = v.w + 4; else if (q.x > v.w + 6) q.x = -4;
    }
}
function drawWeather(ctx, v) {
    const k = Weather.kind;
    if (!k) return;
    // drawn after the lighting so rain still shows at night; fireflies make their own light
    ctx.globalAlpha = k === 'fireflies' ? 1 : 1 - 0.5 * (G.lightStrength || 0);
    for (const q of Weather.parts) {
        const x = Math.round(q.x), y = Math.round(q.y);
        if (k === 'rain') { ctx.fillStyle = 'rgba(170,200,240,0.7)'; ctx.fillRect(x, y, 1, 4); }
        else if (k === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x, y, q.s > 1 ? 2 : 1, q.s > 1 ? 2 : 1); }
        else if (k === 'petals') { ctx.fillStyle = q.s > 1 ? '#ffd1e1' : '#f7a8c4'; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + 1, y + 1, 1, 1); }
        else if (k === 'leaves') { ctx.fillStyle = q.s > 1 ? '#e39a3b' : '#c8702d'; ctx.fillRect(x, y, 2, 2); }
        else {
            const a = 0.5 + 0.5 * Math.sin(G.t / 15 + q.p * 3);
            ctx.fillStyle = `rgba(230,255,140,${a})`; ctx.fillRect(x, y, 1, 1);
            ctx.fillStyle = `rgba(230,255,140,${a * 0.25})`; ctx.fillRect(x - 1, y - 1, 3, 3);
        }
    }
    ctx.globalAlpha = 1;
}

/* emote bubbles + the little "you can use this" marker */
function drawOverheads(ctx) {
    const p = G.player;
    const all = NPCs.here().concat(p ? [p] : [], Online.here());
    for (const e of all) {
        if (!e.emote) continue;
        const bx = Math.round(e.x), by = Math.round(e.y) - (e.npc ? (e.h || 18) + 8 : 32);
        spr(ctx, 'emote_' + e.emote, bx, by);
    }
    if (p && !G.busy && !UI.modal && G.showPrompt) {
        const t = frontTarget(p);
        if (t && t.npc) {
            const by = Math.round(t.y) - (t.h || 18) - 6 + Math.round(Math.sin(G.t / 8));
            spr(ctx, 'prompt', Math.round(t.x), by);
        }
    }
    // by a door: a little "!" pops up over Sarah's head (inside, it means the way out)
    if (p && !G.busy && !UI.modal && !UI.dialogOpen && !p.emote && !p.sit && nearDoor(p)) {
        const k = Math.min(1, (G.doorPopT = (G.doorPopT || 0) + 1) / 6);
        const by = Math.round(p.y) - 34 - Math.round(3 * (1 - k)) + Math.round(Math.sin(G.t / 9));
        spr(ctx, 'prompt', Math.round(p.x), by);
    } else G.doorPopT = 0;
}
/* standing at a way out of a room (or right in front of a building's door, facing it) */
function nearDoor(p) {
    const a = G.area;
    if (!a) return false;
    if (a.interior && a.doorTile) {
        const [dx, dy] = a.doorTile;
        return Math.abs(p.x / TILE - (dx + 0.5)) < 1.25 && p.y / TILE > dy - 0.75;
    }
    if (a.id !== 'island' || p.dir !== 'up') return false;
    const tx = p.x / TILE, ty = Math.floor((p.y - 2) / TILE);
    for (const b of Object.values(W0.buildings)) {
        if (ty === b.y + b.h && Math.abs(tx - (b.x + b.door + 0.5)) < 0.9) return true;
    }
    return false;
}

/* club: coloured spotlights sweeping the dance floor (they pulse harder while you dance) */
function clubSpots(ctx, a, cam) {
    const t = G.t / 60;
    const night = hourIn(Clock.hourF(), 21, 28);
    const k = Dance.on ? 0.34 + 0.16 * (Dance.hype || 0) : night ? 0.26 : 0.14;
    const cols = ['255,90,168', '78,195,217', '255,216,74', '140,193,82'];
    for (let i = 0; i < 4; i++) {
        const ph = t * (0.45 + i * 0.13) + i * 1.7;
        const x = (7.5 + Math.sin(ph) * 3.6) * TILE - cam.x;
        const y = (6.3 + Math.cos(ph * 1.3) * 1.5) * TILE - cam.y;
        const g = ctx.createRadialGradient(x, y, 1, x, y, 26);
        g.addColorStop(0, `rgba(${cols[i]},${k})`);
        g.addColorStop(1, `rgba(${cols[i]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - 26, y - 26, 52, 52);
    }
}

