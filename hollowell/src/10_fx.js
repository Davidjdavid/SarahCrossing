/* Little effects: dust, sparkles, poofs, splashes, rings, floating text. Cheap particles in world space. */

const Fx = {
    list: [],
    clear() { this.list = []; },
    add(p) { if (!HEADLESS) this.list.push(p); return p; },
    dust(x, y) {
        for (let i = 0; i < 4; i++) this.add({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.4, life: 18 + Math.random() * 8, col: 'rgba(240,230,210,0.8)', r: 1.5 });
    },
    sparkle(x, y, col = '#fff6c0') {
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.add({ x, y, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.9, life: 16, col, r: 1, star: true }); }
    },
    poof(x, y) {
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.add({ x, y, vx: Math.cos(a) * 0.7, vy: Math.sin(a) * 0.5, life: 20, col: 'rgba(250,245,235,0.9)', r: 2.5, grow: -0.08 }); }
    },
    splash(x, y) {
        for (let i = 0; i < 8; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 1.8, g: 0.12, life: 24, col: '#bfe8fb', r: 1.2 });
        this.add({ x, y, life: 20, ring: 2, col: '#e4f6ff' });
    },
    ring(x, y, col = '#ffffff') { this.add({ x, y, life: 16, ring: 1, col }); },
    /* where the stick strikes something: a quick white star */
    spark(x, y) { this.add({ x, y, life: 7, spark: true, col: '#ffffff' }); for (let i = 0; i < 4; i++) { const a = (i + 0.5) / 4 * Math.PI * 2; this.add({ x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.1, life: 8, col: '#fff6c0', r: 1 }); } },
    burst(x, y, col) {
        for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 1.4; this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 22, col, r: 1.5, grow: -0.05 }); }
    },
    yarn(x, y, col) {
        for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2; this.add({ x, y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.5, g: 0.05, life: 26, col, r: 1, curl: true }); }
    },
    /* (the same words already floating up right there: they start again rather than a second copy on top) */
    text(x, y, s, col = PAL.white) {
        const same = this.list.find(p => p.text === s && Math.abs(p.x - x) < 16 && Math.abs(p.y - y) < 24);
        if (same) { same.x = x; same.y = y; same.life = 50; return same; }
        return this.add({ x, y, vy: -0.5, life: 50, text: s, col });
    },
    /* a sprite shrinking into a pit */
    fallAt(x, y, im) { if (im) this.add({ x, y, life: 24, im, fall: true }); },
    update() {
        for (const p of this.list) {
            p.life--;
            if (p.vx) p.x += p.vx;
            if (p.vy) p.y += p.vy;
            if (p.g) p.vy += p.g;
            if (p.grow && p.r) p.r = Math.max(0.3, p.r + p.grow);
        }
        this.list = this.list.filter(p => p.life > 0);
    },
    draw(cx, cy) {
        /* seen from underneath (the third act's Little Houses): what happens in the room above shows through the boards,
           where that room is drawn */
        const r = Cam.room, ar = r && r.above && G.map && typeof Layers !== 'undefined' ? Layers.upRoom(G.map, r) : null;
        const ux = ar ? cx + r.above.dx * T : 0, uy = ar ? cy + r.above.dy * T : 0;
        for (const p of this.list) {
            const up = ar && p.x >= ar.x * T && p.x < (ar.x + ar.w) * T && p.y >= ar.y * T && p.y < (ar.y + ar.h) * T;
            const x = p.x - (up ? ux : cx), y = p.y - (up ? uy : cy);
            /* (floating words keep on the screen, clear of the HUD's strip, however near the edge they started) */
            if (p.text) { const hw = Font.width(p.text) / 2; Font.center(p.text, clamp(x, hw + 2, W - hw - 2), Math.max(y, 24), p.col, PAL.ink); continue; }
            if (p.fall) {
                const k = p.life / 24, im = p.im;
                if (HEADLESS || !im) continue;
                const w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
                Gfx.ctx.globalAlpha = k;
                Gfx.ctx.drawImage(im, Math.round(x + (im.width - w) / 2), Math.round(y + (im.height - h) / 2 + (1 - k) * 4), w, h);
                Gfx.ctx.globalAlpha = 1;
                continue;
            }
            if (p.ring) {
                const r = (20 - p.life) * (p.ring === 2 ? 0.6 : 0.9) + 2;
                Gfx.alpha(Math.max(0, p.life / 20));
                for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; Gfx.rect(x + Math.cos(t) * r, y + Math.sin(t) * r * 0.6, 1, 1, p.col); }
                Gfx.alpha(1);
                continue;
            }
            if (p.star) {
                Gfx.rect(x, y, 1, 1, p.col);
                if (p.life > 8) { Gfx.rect(x - 1, y, 3, 1, p.col); Gfx.rect(x, y - 1, 1, 3, p.col); }
                continue;
            }
            if (p.spark) {
                const s = p.life > 4 ? 3 : 2;
                Gfx.rect(x - s, y, s * 2 + 1, 1, p.col); Gfx.rect(x, y - s, 1, s * 2 + 1, p.col);
                if (p.life > 4) { Gfx.rect(x - 1, y - 1, 3, 3, p.col); }
                continue;
            }
            const r = p.r || 1;
            if (r <= 1.2) Gfx.rect(x, y, 1, 1, p.col);
            else Gfx.circle(x, y, Math.round(r), p.col);
        }
    },
};
