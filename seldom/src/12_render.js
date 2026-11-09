/* drawing: the game fills a 16:9 area of the canvas; each frame of the view is drawn into its part of it */
const R = {
    cv: null, ctx: null, W: 0, H: 0, s: 1, gx: 0, gy: 0, gw: 0, gh: 0,
    init(cv) { this.cv = cv; this.ctx = cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()); },
    resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this.cv.width = Math.floor(innerWidth * dpr); this.cv.height = Math.floor(innerHeight * dpr);
        this.W = this.cv.width; this.H = this.cv.height;
        let s = Math.min(this.W / VIEW_W, this.H / VIEW_H);
        if (s >= 3) s = Math.floor(s * 2) / 2;
        this.s = s; this.gw = Math.round(VIEW_W * s); this.gh = Math.round(VIEW_H * s);
        this.gx = Math.floor((this.W - this.gw) / 2); this.gy = Math.floor((this.H - this.gh) / 2);
    },
    /* the regions of the screen the view's frames fill */
    regions() {
        if (Cam.eye) return null;
        if (!Cam.split) return [[this.gx, this.gy, this.gw, this.gh]];
        const h = Math.round(this.gw / 2);
        return [[this.gx, this.gy, h, this.gh], [this.gx + h, this.gy, this.gw - h, this.gh]];
    },
    draw() {
        const ctx = this.ctx;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
        if (G.state === 'title' || !World.map) { UI.drawTitle(ctx); return; }
        if (Cam.eye) Eye.draw(ctx);
        else {
            const frames = Cam.frames(), regs = this.regions();
            frames.forEach((r, i) => this.drawWorld(r, regs[i][0], regs[i][1], regs[i][2], regs[i][3], i));
            if (Cam.split) this.drawSeam(regs);
            this.drawViewUI(regs);
        }
        UI.draw(ctx);
    },
    /* draw world rect r into the screen rect (sx, sy, sw, sh) */
    drawWorld(r, sx, sy, sw, sh, fi, opts) {
        const ctx = this.ctx, map = World.map, k = sw / r.w;
        const D = Draw.begin(ctx, r, sx, sy, k);
        ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
        ctx.fillStyle = map.def.bg || '#120c18'; ctx.fillRect(sx, sy, sw, sh);
        const tx0 = Math.floor(r.x / TILE) - 1, ty0 = Math.floor(r.y / TILE) - 1;
        const tx1 = Math.ceil((r.x + r.w) / TILE) + 1, ty1 = Math.ceil((r.y + r.h) / TILE) + 3;
        const items = [];
        const wf = Math.floor(G.t * 2.5) % 4;
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
            const ch = map.t(tx, ty), tt = TT[ch];
            if (!tt) continue;
            if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) { if (!map.def.edgeTile) continue; }
            const v = Math.floor(hash2(tx, ty, 1) * (tt.variants || 4));
            const img = tileCanvas(ch, v, tt.frames ? (wf + v) % 4 : 0);
            D.img(img, tx * TILE, ty * TILE, TILE, TILE);
            if (tt.water) this.shore(D, map, tx, ty);
            if (tt.cliff && !TT[map.t(tx, ty - 1)]?.cliff) { ctx.fillStyle = '#5bae4c'; ctx.fillRect(D.X(tx * TILE), D.Y(ty * TILE), TILE * k + 1, 3 * k); ctx.fillStyle = '#3f8a4a'; ctx.fillRect(D.X(tx * TILE), D.Y(ty * TILE + 3), TILE * k + 1, k); }
            if (tt.tree) items.push({ y: (ty + 1) * TILE - 1, draw: () => { const c = treeCanvas(tt.tree, Math.floor(hash2(tx, ty, 2) * 4)); D.img(c, tx * TILE + 8 - c.width / 2, (ty + 1) * TILE + 2 - c.height); } });
        }
        if (map.decals) for (const dc of map.decals) if (overlap(dc, r)) dc.draw(D, dc);
        for (const p of map.props) {
            if (p.gone) continue;
            const pr = { x: p.tx * TILE - 16, y: p.ty * TILE - 120, w: p.tw * TILE + 32, h: p.th * TILE + 140 };
            p.seenNow = overlap(pr, r) || p.seenNow && fi;
            if (!overlap(pr, r)) continue;
            items.push({ y: (p.ty + p.th) * TILE - 1 + (p.sortBias || 0), draw: () => drawProp(D, p) });
        }
        if (!(opts && opts.terrain)) for (const e of map.ents) {
            if (!exists(e)) continue;
            const vb = visBox(e);
            if (!overlap({ x: vb.x - 8, y: vb.y - 8, w: vb.w + 16, h: vb.h + 16 }, r)) continue;
            items.push({ y: e.y + e.h + (e.held ? 20 : 0) + (KINDS[e.kind].flat ? -100 : 0), e, draw: () => drawEnt(D, e, r) });
        }
        items.sort((a, b) => a.y - b.y);
        for (const it of items) it.draw();
        if (!(opts && opts.terrain)) { Fx.draw(D); Light.draw(D, r, sx, sy, sw, sh); }
        if (map.def.overlay) map.def.overlay(D, r);
        ctx.restore();
    },
    shore(D, map, tx, ty) {
        const ctx = D.ctx, k = D.k;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        const land = (x, y) => { const t = TT[map.t(x, y)]; return t && !t.water; };
        if (land(tx, ty - 1)) ctx.fillRect(D.X(tx * TILE), D.Y(ty * TILE), TILE * k + 1, 2 * k);
        if (land(tx, ty + 1)) ctx.fillRect(D.X(tx * TILE), D.Y(ty * TILE + 14), TILE * k + 1, 2 * k);
        if (land(tx - 1, ty)) ctx.fillRect(D.X(tx * TILE), D.Y(ty * TILE), 2 * k, TILE * k + 1);
        if (land(tx + 1, ty)) ctx.fillRect(D.X(tx * TILE + 14), D.Y(ty * TILE), 2 * k, TILE * k + 1);
    },
    drawSeam(regs) {
        const ctx = this.ctx, x = regs[1][0], s = this.s;
        const g = ctx.createLinearGradient(x - 3 * s, 0, x + 3 * s, 0);
        g.addColorStop(0, 'rgba(255,120,200,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 3 * s, this.gy, 6 * s, this.gh);
        for (let i = 0; i < 6; i++) { const y = this.gy + ((G.t * 30 + i * 37) % (this.gh / s)) * s; ctx.fillStyle = ['#ff8ab0', '#ffd25e', '#9fe8ff'][i % 3]; ctx.fillRect(x - s, y, 2 * s, 2 * s); }
    },
    /* the view's own marks: edges that bump, the viewfinder while looking */
    drawViewUI(regs) {
        const ctx = this.ctx, s = this.s;
        const b = Cam.bump, [x, y, w, h] = regs[Cam.home] || regs[0];
        const glow = (a, xx, yy, ww, hh) => { if (a <= 0) return; ctx.fillStyle = `rgba(255,240,200,${a * 0.6})`; ctx.fillRect(xx, yy, ww, hh); };
        glow(b.l, x, y, 2 * s, h); glow(b.r, x + w - 2 * s, y, 2 * s, h); glow(b.t, x, y, w, 2 * s); glow(b.b, x, y + h - 2 * s, w, 2 * s);
        if (G.state !== 'play' && G.state !== 'talk') return;
        const pinned = Cam.mode === 'pinned' || Cam.split;
        if (Cam.looking || pinned) {
            const a = Cam.looking ? 0.95 : 0.45, L = 10 * s, t = Math.max(1, s);
            ctx.fillStyle = `rgba(255,248,236,${a})`;
            for (const [rx, ry, rw, rh] of regs) {
                const m = 4 * s;
                ctx.fillRect(rx + m, ry + m, L, t); ctx.fillRect(rx + m, ry + m, t, L);
                ctx.fillRect(rx + rw - m - L, ry + m, L, t); ctx.fillRect(rx + rw - m - t, ry + m, t, L);
                ctx.fillRect(rx + m, ry + rh - m - t, L, t); ctx.fillRect(rx + m, ry + rh - m - L, t, L);
                ctx.fillRect(rx + rw - m - L, ry + rh - m - t, L, t); ctx.fillRect(rx + rw - m - t, ry + rh - m - L, t, L);
            }
            if (Cam.looking) { ctx.fillStyle = Math.floor(G.t * 2) % 2 ? P.red : '#7a2a2e'; ctx.beginPath(); ctx.arc(this.gx + this.gw - 14 * s, this.gy + 14 * s, 3 * s, 0, 7); ctx.fill(); }
        }
    },
};
const Draw = {
    ctx: null, r: null, sx: 0, sy: 0, k: 1,
    begin(ctx, r, sx, sy, k) { this.ctx = ctx; this.r = r; this.sx = sx; this.sy = sy; this.k = k; return this; },
    X(wx) { return Math.round(this.sx + (wx - this.r.x) * this.k); },
    Y(wy) { return Math.round(this.sy + (wy - this.r.y) * this.k); },
    img(c, wx, wy, w, h) {
        const x = this.X(wx), y = this.Y(wy);
        this.ctx.drawImage(c, x, y, this.X(wx + (w || c.width)) - x, this.Y(wy + (h || c.height)) - y);
    },
    shadow(e, w) {
        const ctx = this.ctx, k = this.k; w = w || e.w;
        ctx.fillStyle = 'rgba(30,20,40,0.28)';
        ctx.beginPath(); ctx.ellipse(this.X(ecx(e)), this.Y(e.y + e.h - 1), (w / 2 + 1) * k, 2.2 * k, 0, 0, 7); ctx.fill();
    },
    person(id, spec, e, f) {
        const c = personFrame(id, spec, e.dir, f);
        this.shadow(e, 10);
        this.img(c, ecx(e) - c.width / 2, e.y + e.h - c.height + 1 - (e.z || 0) + (e.bob || 0));
    },
    thing(e, name, f, flip, o) {
        let c = thing(name, f);
        if (flip) c = spr('flip:' + name + ':' + (f || 0), () => flipCanvas(thing(name, f)));
        if (!o || !o.noShadow) this.shadow(e, Math.min(e.w, c.width - 2));
        if (o && o.alpha != null) this.ctx.globalAlpha *= o.alpha;
        this.img(c, ecx(e) - c.width / 2, e.y + e.h - c.height + 1 - (e.z || 0) + ((o && o.bob) || 0));
        if (o && o.alpha != null) this.ctx.globalAlpha = 1;
    },
    bubble(e, text) {
        const ctx = this.ctx, k = this.k, w = textWidth(text) + 6;
        const x = this.X(ecx(e)) - w * k / 2, y = this.Y(e.y - 30);
        ctx.fillStyle = P.white; roundRect(ctx, x, y, w * k, 11 * k, 3 * k); ctx.fill();
        drawText(ctx, text, x + 3 * k, y + 2 * k, P.ink, k);
    },
    sweat(e) { const ctx = this.ctx, k = this.k; ctx.fillStyle = '#9fe8ff'; ctx.fillRect(this.X(e.x + e.w), this.Y(e.y - 10), 2 * k, 3 * k); },
};
function drawEnt(D, e, r) {
    const K = KINDS[e.kind], ctx = D.ctx;
    if (e.flick) {
        if (G.frame % 6 === 0 && !Settings.calm) return;
        ctx.globalAlpha = 0.45;
        const j = Settings.calm ? 0 : ((G.frame >> 1) % 3 - 1);
        const ox = D.sx; D.sx += j * D.k;
        (K.draw || defaultDraw)(e, D);
        D.sx = ox; ctx.globalAlpha = 1;
        return;
    }
    (K.draw || defaultDraw)(e, D);
    /* in the woods, what's near an edge shows at the other edge too */
    if (e.seen && !e.fixed && inZone(e.map, e, 'wrap') && !Cam.split && r) {
        const cx = ecx(e), cy = ecy(e), m = 20;
        const shifts = [];
        if (cx - r.x < m) shifts.push([r.w, 0]); if (r.x + r.w - cx < m) shifts.push([-r.w, 0]);
        if (cy - r.y < m) shifts.push([0, r.h]); if (r.y + r.h - cy < m) shifts.push([0, -r.h]);
        for (const [dx, dy] of shifts) {
            ctx.globalAlpha = 0.35; const ox = e.x, oy = e.y; e.x += dx; e.y += dy;
            (K.draw || defaultDraw)(e, D); e.x = ox; e.y = oy; ctx.globalAlpha = 1;
        }
    }
}
function defaultDraw(e, D) { if (THINGS[e.kind]) D.thing(e, e.kind); else { D.ctx.fillStyle = '#f0f'; D.ctx.fillRect(D.X(e.x), D.Y(e.y), e.w * D.k, e.h * D.k); } }
function drawProp(D, p) {
    if (p.draw) return p.draw(D, p);
    const c = buildingCanvas(p.id, p.b);
    D.img(c, p.tx * TILE, (p.ty + p.th) * TILE - c.height);
}
const Settings = { calm: false, volume: 0.8, music: 0.7 };
