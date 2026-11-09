/* on a touch screen: a pad and buttons drawn over the game (they press the same named buttons as the keys) */
const Touch = {
    on: false, ids: {}, pad: null,
    init(cv) {
        const start = e => { this.on = true; Audio2.unlock(); if (G.state === 'title') Input.click = true; this.handle(e); e.preventDefault(); };
        cv.addEventListener('touchstart', start, { passive: false });
        cv.addEventListener('touchmove', e => { this.handle(e); e.preventDefault(); }, { passive: false });
        cv.addEventListener('touchend', e => { this.handle(e); e.preventDefault(); }, { passive: false });
        cv.addEventListener('touchcancel', e => { this.handle(e); }, { passive: false });
    },
    /* where the controls sit, in canvas pixels */
    layout() {
        const u = Math.min(R.W, R.H) / 9, m = u * 0.4;
        return {
            u, pad: { x: m + u * 1.4, y: R.H - m - u * 1.4, r: u * 1.3 },
            buttons: [
                { b: 'act', label: 'Z', x: R.W - m - u * 0.8, y: R.H - m - u * 1.3, r: u * 0.75 },
                { b: 'look', label: 'X', x: R.W - m - u * 2.4, y: R.H - m - u * 0.8, r: u * 0.6 },
                { b: 'center', label: 'C', x: R.W - m - u * 2.4, y: R.H - m - u * 2.2, r: u * 0.45 },
                { b: 'zout', label: '-', x: R.W - m - u * 0.5, y: m + u * 1.6, r: u * 0.4 },
                { b: 'zin', label: '+', x: R.W - m - u * 1.5, y: m + u * 1.6, r: u * 0.4 },
                { b: 'split', label: 'Tab', x: R.W - m - u * 2.5, y: m + u * 1.6, r: u * 0.4 },
                { b: 'menu', label: 'Esc', x: m + u * 0.5, y: m + u * 1.6, r: u * 0.4 },
                { b: 'notebook', label: 'N', x: m + u * 1.5, y: m + u * 1.6, r: u * 0.4 },
            ],
        };
    },
    handle(e) {
        const L = this.layout(), rc = R.cv.getBoundingClientRect(), dpr = R.W / (rc.width || innerWidth);
        const held = {};
        for (const t of e.touches) {
            const x = (t.clientX - rc.left) * dpr, y = (t.clientY - rc.top) * dpr;
            const dx = x - L.pad.x, dy = y - L.pad.y;
            if (Math.hypot(dx, dy) < L.pad.r * 1.6) {
                const a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
                if (d > L.pad.r * 0.25) {
                    const s = Math.sin(a), c = Math.cos(a);
                    if (c > 0.38) held.right = true; if (c < -0.38) held.left = true;
                    if (s > 0.38) held.down = true; if (s < -0.38) held.up = true;
                }
                this.pad = [dx, dy];
                continue;
            }
            for (const b of L.buttons) if (Math.hypot(x - b.x, y - b.y) < b.r * 1.25) held[b.b] = true;
        }
        if (!e.touches.length || !Object.keys(held).some(k => ['up', 'down', 'left', 'right'].includes(k))) this.pad = null;
        Input.touch = held;
    },
    draw(ctx) {
        if (!this.on || G.state === 'title') return;
        const L = this.layout();
        ctx.save(); ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.arc(L.pad.x, L.pad.y, L.pad.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.6; ctx.fillStyle = '#2a1b2d';
        const p = this.pad || [0, 0], k = Math.min(1, L.pad.r * 0.6 / (Math.hypot(p[0], p[1]) || 1));
        ctx.beginPath(); ctx.arc(L.pad.x + p[0] * k, L.pad.y + p[1] * k, L.pad.r * 0.4, 0, 7); ctx.fill();
        for (const b of L.buttons) {
            if ((b.b === 'look' || b.b === 'center') && !G.flags.spyglass) continue;
            if ((b.b === 'zin' || b.b === 'zout') && !(Cam.zmin < 1 || Cam.zmax > 1)) continue;
            if (b.b === 'split' && !G.flags.prism) continue;
            ctx.globalAlpha = Input.touch[b.b] ? 0.7 : 0.35; ctx.fillStyle = '#fff8ec';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
            ctx.globalAlpha = 0.9;
            const s = Math.max(1, b.r / (b.label.length > 1 ? 14 : 9));
            drawText(ctx, b.label, b.x - textWidth(b.label) * s / 2, b.y - 4 * s, '#2a1b2d', s);
        }
        ctx.restore();
    },
};
