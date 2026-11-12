/* Little effects: dust, sparkles, poofs, splashes, rings, floating text. Cheap particles in world space. */

/* what floating words beside the speaker's face cost against being moved from where they were said (in pixels moved) */
const BESIDE = 16;

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
    /* (by: who says it, when it's somebody: the words keep near their head) */
    text(x, y, s, col = PAL.white, by = null) {
        const same = this.list.find(p => p.text === s && Math.abs(p.x - x) < 16 && Math.abs(p.y - y) < 24);
        if (same) { same.x = x; same.y = y; same.life = 50; if (by) same.by = by; return same; }
        return this.add({ x, y, vy: -0.5, life: 50, text: s, col, by });
    },
    /* floating words (from UI.draw, after the notices): each as near where it was said as it can be, a few pixels inside
       the screen's edges, clear of the HUD, the panels up (notices, the place's name, the box), the little pictures over
       people's heads, people's faces and the words placed before it; on a soft dark backing, so the cords and heads behind
       them don't run through the letters */
    drawText(cx, cy, panels = []) {
        const texts = this.list.filter(p => p.text);
        if (!texts.length) return;
        const fade = 1 - (typeof UI !== 'undefined' ? UI.fadeA : 0);
        if (fade <= 0) return;
        for (const s of this.textSpots(texts, cx, cy, panels)) {
            const a = Math.min(1, s.p.life / 10) * fade;
            Gfx.alpha(0.5 * a); Gfx.rect(s.x - 2, s.y - 2, s.w + 4, 12, PAL.ink); Gfx.rect(s.x - 3, s.y - 1, s.w + 6, 10, PAL.ink);
            Gfx.alpha(a); Font.draw(s.p.text, s.x, s.y, s.p.col, Infinity, PAL.ink); Gfx.alpha(1);
        }
    },
    /* where each goes: { p, x, y (the letters' top left), w }. Kept from where it was said, it goes up (or down, at twice
       the cost) or to one side, whichever's least far; and never nearer someone else's face than the face of who said it
       (pushed up past his bubble to the face of the one standing over him, "Hmph." read as hers) */
    textSpots(texts, cx, cy, panels = []) {
        const at = this.view(cx, cy), heads = this.heads(at), keep = panels.map(r => r.slice()).concat(this.hudBoxes(), this.bubbles(at), heads), out = [];
        const mid = r => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], far = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
        for (const p of texts) {
            const w = Font.width(p.text), [sx, sy] = at(p.x, p.y);
            const x0 = Math.round(clamp(sx - w / 2, 6, W - 6 - w)), y0 = Math.round(clamp(sy, 5, H - 13));
            const free = (x, y) => y >= 5 && y <= H - 13 && !keep.some(r => x - 3 < r[2] && x + w + 3 > r[0] && y - 2 < r[3] && y + 10 > r[1]);
            /* (whose face it was said over: the speaker's when it's known, else the nearest one below where it was said) */
            const mine = p.by && p.by.isGrid ? this.headOf(p.by, at) : null;
            const own = mine ? heads.find(r => r[0] === mine[0] && r[1] === mine[1]) || mine : heads.filter(r => r[1] >= sy).reduce((b, r) => !b || far(mid(r), [sx, sy]) < far(mid(b), [sx, sy]) ? r : b, null);
            let best = null;
            for (let k = 0; k <= 70 && !(best && best.c <= k); k++) for (const dy of k ? [-k, k] : [0]) {
                const cy0 = dy < 0 ? -dy : 2 * dy;
                for (let dx = 0; dx <= 64; dx += 2) for (const sd of dx ? [-1, 1] : [1]) {
                    const x = Math.round(clamp(x0 + sd * dx, 6, W - 6 - w)), y = y0 + dy;
                    let c = cy0 + Math.abs(x - x0);
                    if ((best && c >= best.c) || !free(x, y)) continue;
                    /* (the face it's nearest, if any's near, must be the speaker's) */
                    const m = [x + w / 2, y + 4], near = heads.reduce((b, r) => { const d = far(mid(r), m); return d < 40 && (!b || d < b.d) ? { r, d } : b; }, null);
                    if (own && near && near.r !== own) c += 100;
                    if (!best || c < best.c) best = { x, y, c };
                }
            }
            /* (or just beside the speaker's own face, where anything not right over it reads best as theirs) */
            if (own && own[1] < sy + 24) for (const x of [own[0] - 7 - w, own[2] + 7]) {
                const y = Math.round(mid(own)[1] - 4);
                if (x >= 6 && x <= W - 6 - w && free(x, y) && (!best || BESIDE < best.c)) best = { x, y, c: BESIDE };
            }
            const sp = best || { x: x0, y: y0 };
            out.push({ p, x: sp.x, y: sp.y, w });
            keep.push([sp.x - 3, sp.y - 2, sp.x + w + 3, sp.y + 10]);
        }
        return out;
    },
    /* somebody's face, on the screen (the top of their sprite) */
    headOf(e, at) { const im = e.sprite && e.sprite(), [x, y] = at(e.px, e.py + 14 - (im ? im.height : 24)); return [x + 2, y, x + 14, y + 12]; },
    /* the faces on screen, people's and Wren's (the top of each sprite) */
    heads(at) {
        const a = G.map, out = [];
        if (!a || G.scene !== 'play') return out;
        for (const e of a.ents) {
            if (!e.isGrid || !(e.kind === 'npc' || e.person) || e.hidden || e.removed) continue;
            const r = this.headOf(e, at);
            if (r[2] > 0 && r[0] < W && r[3] > 0 && r[1] < H) out.push(r);
        }
        const p = G.player;
        if (p && !p.hidden && !G.hideWren && p.state !== 'fall') { const [x, y] = at(p.x, p.y - 13 - Math.round(p.z || 0)); out.push([x - 6, y, x + 6, y + 10]); }
        return out;
    },
    /* the HUD's corners (hearts at the left; buttons, the tool in hand, its key and the Needle's stitches at the right) */
    hudBoxes() {
        if (G.hideHud || G.scene !== 'play') return [];
        const n = Math.ceil(Inv.maxHp / 2), rows = n > 10 ? 2 : 1;
        const out = [[0, 0, 20 + 9 * Math.min(n, 10), 6 + 8 * rows], [W - 98, 0, W, Inv.equipped ? 37 : 17]];
        /* (and whatever a place keeps up top of its own: the Little Houses' Aha tally) */
        if (G.map && G.map.def.hudBoxes) out.push(...G.map.def.hudBoxes(G.map));
        return out;
    },
    /* the little pictures over people's heads (a heart, a "!", dots) */
    bubbles(at) {
        const a = G.map, out = [];
        if (a) for (const e of a.ents) if (e.bubble && e.isGrid && !e.hidden && !e.removed) { const [x, y] = at(e.px + 8, e.py - 20); out.push([x - 1, y - 1, x + 10, y + 7]); }
        return out;
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
    /* where a point in the world shows on the screen. Seen from underneath (the third act's Little Houses), what happens in
       the room above shows through the boards, where that room is drawn */
    view(cx, cy) {
        const r = Cam.room, ar = r && r.above && G.map && typeof Layers !== 'undefined' ? Layers.upRoom(G.map, r) : null;
        const ux = ar ? cx + r.above.dx * T : 0, uy = ar ? cy + r.above.dy * T : 0;
        return (x, y) => { const up = ar && x >= ar.x * T && x < (ar.x + ar.w) * T && y >= ar.y * T && y < (ar.y + ar.h) * T; return [x - (up ? ux : cx), y - (up ? uy : cy)]; };
    },
    /* everything but the floating words (those are drawn over the notices: drawText) */
    draw(cx, cy) {
        const at = this.view(cx, cy);
        for (const p of this.list) {
            if (p.text) continue;
            const [x, y] = at(p.x, p.y);
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
