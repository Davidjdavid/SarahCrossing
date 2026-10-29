/* ---- 41d_head_icons.js ---- */
/* What shows over people's heads (David, 29 October: "fix the icons above people's heads when they emote or you can
   interact with them"): an emote in a soft rounded bubble, and the little "talk" bubble with its "!", drawn as shapes in
   the phone's hand (41c_phone_icons.js) on a canvas of their own at the screen's resolution (#heads, over the game's
   canvas, under the chat bubbles and the HUD), so they're crisp in every view and at every zoom, and stand right over the
   head: the new look's dolls stand ENV.people taller than the flat views' people. The same drawings are the emotes' icons
   in the screens (uiIcon). Each is drawn on a 100 x 100 square, the bubble's tail at its foot. */
const HEAD_INK = '#5c4152';
/* the bubble: a rounded body, the tail a soft point under its middle */
function headBubblePath(g, x0, y0, x1, y1, r, tail) {
    const m = (x0 + x1) / 2;
    g.beginPath();
    g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.arcTo(x1, y0, x1, y0 + r, r); g.lineTo(x1, y1 - r); g.arcTo(x1, y1, x1 - r, y1, r);
    g.lineTo(m + tail * 0.55, y1); g.quadraticCurveTo(m + tail * 0.2, y1 + tail * 0.6, m, y1 + tail); g.quadraticCurveTo(m - tail * 0.1, y1 + tail * 0.5, m - tail * 0.55, y1);
    g.lineTo(x0 + r, y1); g.arcTo(x0, y1, x0, y1 - r, r); g.lineTo(x0, y0 + r); g.arcTo(x0, y0, x0 + r, y0, r); g.closePath();
}
function headBubble(g, x0, y0, x1, y1, r, tail) {
    // (a soft shadow under it, then the cream paper with its outline)
    g.save(); g.translate(0, 3.5); headBubblePath(g, x0, y0, x1, y1, r, tail); g.fillStyle = 'rgba(60, 34, 40, 0.16)'; g.fill(); g.restore();
    headBubblePath(g, x0, y0, x1, y1, r, tail);
    g.fillStyle = PHONE_PAPER; g.fill();
    g.lineWidth = 5; g.strokeStyle = HEAD_INK; g.stroke();
}
/* a thick line drawn twice: the outline, then its color over it */
function headLine(g, I, fn, col, w) {
    g.beginPath(); fn(); g.lineWidth = w + 9; g.strokeStyle = I.ink; g.stroke();
    g.beginPath(); fn(); g.lineWidth = w; g.strokeStyle = col; g.stroke();
}
function headHeart(g, x, y, s) {
    g.moveTo(x, y + s * 0.95);
    g.bezierCurveTo(x - s * 1.5, y + s * 0.05, x - s * 0.8, y - s * 1.15, x, y - s * 0.38);
    g.bezierCurveTo(x + s * 0.8, y - s * 1.15, x + s * 1.5, y + s * 0.05, x, y + s * 0.95);
    g.closePath();
}
function headFace(g, I, col) {
    piShape(g, I, () => g.arc(50, 43, 25, 0, 7), col, 5);
    g.fillStyle = 'rgba(239, 110, 110, 0.35)'; g.beginPath(); g.ellipse(33, 50, 5, 3.5, 0, 0, 7); g.ellipse(67, 50, 5, 3.5, 0, 0, 7); g.fill();
}
function headStar(g, x, y, r1, r0, n) {
    g.moveTo(x, y - r1);
    for (let i = 1; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r0 : r1; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath();
}
const HEAD_ICONS = {
    heart(g, I) {
        piShape(g, I, () => headHeart(g, 50, 43, 21), '#ef6461', 5);
        g.fillStyle = '#ffc9c4'; g.beginPath(); g.ellipse(39, 35, 4.5, 3, -0.6, 0, 7); g.fill();
    },
    bang(g, I) {
        piShape(g, I, () => { g.moveTo(43, 15); g.lineTo(57, 15); g.lineTo(54, 51); g.quadraticCurveTo(50, 54, 46, 51); g.closePath(); }, '#f07a5a', 5);
        piShape(g, I, () => g.arc(50, 63, 6.5, 0, 7), '#f07a5a', 5);
    },
    q(g, I) {
        headLine(g, I, () => { g.arc(50, 30, 13, Math.PI * 1.05, Math.PI * 2.35); g.lineTo(50, 50); }, '#5aa8e8', 9);
        piShape(g, I, () => g.arc(50, 63, 6.5, 0, 7), '#5aa8e8', 5);
    },
    note(g, I) {
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(40, 25); g.lineTo(40, 56); g.moveTo(66, 19); g.lineTo(66, 50); g.stroke();
        g.fillStyle = I.ink; g.beginPath(); g.moveTo(37, 21); g.lineTo(69, 14); g.lineTo(69, 25); g.lineTo(37, 32); g.closePath(); g.fill();
        piShape(g, I, () => g.ellipse(33, 58, 9.5, 7.5, -0.35, 0, 7), '#a58ae8', 5);
        piShape(g, I, () => g.ellipse(59, 52, 9.5, 7.5, -0.35, 0, 7), '#a58ae8', 5);
    },
    zzz(g, I) {
        const z = (x, y, s) => headLine(g, I, () => { g.moveTo(x, y); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x + s, y + s); }, '#5aa8e8', 2 + s * 0.2);
        z(20, 40, 24); z(50, 27, 16); z(70, 16, 10);
    },
    sweat(g, I) {
        piShape(g, I, () => { g.moveTo(50, 14); g.bezierCurveTo(56, 26, 70, 38, 70, 50); g.arc(50, 50, 20, 0, Math.PI); g.bezierCurveTo(30, 38, 44, 26, 50, 14); g.closePath(); }, '#7cc7ef', 5);
        g.fillStyle = '#e4f6ff'; g.beginPath(); g.ellipse(42, 50, 4, 7, 0.3, 0, 7); g.fill();
    },
    spicy(g, I) {
        piShape(g, I, () => { g.moveTo(50, 68); g.bezierCurveTo(26, 68, 22, 48, 32, 34); g.quadraticCurveTo(34, 44, 40, 44); g.quadraticCurveTo(36, 26, 52, 13); g.quadraticCurveTo(52, 30, 64, 34); g.quadraticCurveTo(66, 28, 64, 22); g.bezierCurveTo(82, 36, 78, 68, 50, 68); g.closePath(); }, '#ef5a3c', 5);
        g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(50, 64); g.bezierCurveTo(36, 64, 36, 50, 44, 42); g.quadraticCurveTo(46, 50, 50, 50); g.quadraticCurveTo(50, 40, 56, 34); g.bezierCurveTo(66, 46, 64, 64, 50, 64); g.fill();
        g.fillStyle = '#ffe48a'; g.beginPath(); g.ellipse(50, 58, 5, 6, 0, 0, 7); g.fill();
    },
    sparkle(g, I) {
        piShape(g, I, () => { g.moveTo(46, 14); g.quadraticCurveTo(49, 38, 72, 42); g.quadraticCurveTo(49, 46, 46, 70); g.quadraticCurveTo(43, 46, 20, 42); g.quadraticCurveTo(43, 38, 46, 14); g.closePath(); }, '#ffd65c', 5);
        piShape(g, I, () => { g.moveTo(72, 14); g.quadraticCurveTo(73, 22, 81, 23); g.quadraticCurveTo(73, 24, 72, 32); g.quadraticCurveTo(71, 24, 63, 23); g.quadraticCurveTo(71, 22, 72, 14); g.closePath(); }, '#fff1b0', 3.5);
        g.fillStyle = '#fff6d2'; g.beginPath(); g.ellipse(42, 36, 3, 5, 0.4, 0, 7); g.fill();
    },
    laugh(g, I) {
        headFace(g, I, '#ffd65c');
        g.lineWidth = 4.5; g.strokeStyle = I.ink;
        for (const x of [39, 61]) { g.beginPath(); g.arc(x, 39, 5.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
        piShape(g, I, () => { g.moveTo(36, 47); g.lineTo(64, 47); g.quadraticCurveTo(62, 63, 50, 63); g.quadraticCurveTo(38, 63, 36, 47); g.closePath(); }, '#d9534f', 4);
    },
    sad(g, I) {
        headFace(g, I, '#a9cdf2');
        g.fillStyle = I.ink; g.beginPath(); g.arc(40, 39, 3.2, 0, 7); g.arc(60, 39, 3.2, 0, 7); g.fill();
        g.lineWidth = 4.5; g.strokeStyle = I.ink; g.beginPath(); g.arc(50, 61, 9, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
        piShape(g, I, () => { g.moveTo(68, 42); g.quadraticCurveTo(74, 50, 72, 54); g.arc(68, 53, 4, 0.2, Math.PI * 0.9); g.quadraticCurveTo(64, 50, 68, 42); g.closePath(); }, '#e8f8ff', 3);
    },
    fish(g, I) {
        piShape(g, I, () => { g.ellipse(44, 42, 21, 13, 0, 0, 7); }, '#7cc0e6', 5);
        piShape(g, I, () => { g.moveTo(62, 42); g.lineTo(80, 29); g.quadraticCurveTo(76, 42, 80, 55); g.closePath(); }, '#5aa8d8', 5);
        g.fillStyle = PHONE_PAPER; g.beginPath(); g.arc(33, 39, 4.5, 0, 7); g.fill();
        g.fillStyle = I.ink; g.beginPath(); g.arc(32, 39, 2.4, 0, 7); g.fill();
        g.lineWidth = 3.5; g.strokeStyle = I.ink; g.beginPath(); g.arc(46, 42, 8, -0.9, 0.9); g.stroke();
    },
    dots(g, I) { for (const x of [28, 50, 72]) piShape(g, I, () => g.arc(x, 43, 6.5, 0, 7), '#8a7a9a', 4); },
    wink(g, I) {
        headFace(g, I, '#ffd65c');
        g.fillStyle = I.ink; g.beginPath(); g.ellipse(40, 39, 3.2, 4, 0, 0, 7); g.fill();
        g.lineWidth = 4.5; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(55, 40); g.quadraticCurveTo(61, 35, 67, 40); g.stroke();
        g.beginPath(); g.arc(50, 47, 10, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    },
    idea(g, I) {
        g.lineWidth = 4.5; g.strokeStyle = '#f2a83a';
        for (const a of [-2.6, -2.1, -1.57, -1.04, -0.54]) { g.beginPath(); g.moveTo(50 + Math.cos(a) * 28, 36 + Math.sin(a) * 28); g.lineTo(50 + Math.cos(a) * 35, 36 + Math.sin(a) * 35); g.stroke(); }
        piShape(g, I, () => { g.arc(50, 34, 16, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(57, 54); g.lineTo(43, 54); g.closePath(); }, '#ffe066', 5);
        piShape(g, I, () => piRR(g, 42, 54, 16, 12, 4), '#c9cbe0', 4.5);
        g.fillStyle = '#fffbe0'; g.beginPath(); g.ellipse(44, 29, 3.5, 5, 0.5, 0, 7); g.fill();
    },
    cool(g, I) {
        headFace(g, I, '#ffd65c');
        g.fillStyle = '#2f2a3a'; g.beginPath(); piRR(g, 28, 33, 20, 12, 5); piRR(g, 52, 33, 20, 12, 5); g.fill();
        g.lineWidth = 4; g.strokeStyle = '#2f2a3a'; g.beginPath(); g.moveTo(26, 36); g.lineTo(74, 36); g.stroke();
        g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.fillRect(31, 35, 6, 3); g.fillRect(55, 35, 6, 3);
        g.lineWidth = 4.5; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(42, 55); g.quadraticCurveTo(52, 60, 60, 52); g.stroke();
    },
    star(g, I) {
        piShape(g, I, () => headStar(g, 50, 44, 26, 11.5, 5), '#ffd65c', 5);
        g.fillStyle = '#fff3c4'; g.beginPath(); g.ellipse(44, 38, 3, 5, 0.5, 0, 7); g.fill();
    },
};
HEAD_ICONS.question = HEAD_ICONS.q;
HEAD_ICONS.surprise = HEAD_ICONS.bang;
/* an emote in its bubble, on the 100 x 100 square (the tail's point at the bottom middle) */
function headIcon(g, kind) {
    const draw = HEAD_ICONS[kind];
    if (!draw) return false;
    headBubble(g, 6, 4, 94, 80, 28, 16);
    g.lineJoin = 'round'; g.lineCap = 'round';
    draw(g, { ink: HEAD_INK });
    return true;
}
/* "you can talk to them" (and, by a door, "you can go in"): a little bubble with an orange "!" */
function headPrompt(g) {
    headBubble(g, 18, 6, 82, 74, 26, 18);
    const I = { ink: HEAD_INK };
    piShape(g, I, () => { g.moveTo(44, 17); g.lineTo(56, 17); g.lineTo(53.5, 48); g.quadraticCurveTo(50, 51, 46.5, 48); g.closePath(); }, '#f2896b', 5);
    piShape(g, I, () => g.arc(50, 60, 6, 0, 7), '#f2896b', 5);
}
/* how high over someone's feet their head is (world pixels), with a little room: the new look's dolls stand taller */
function headLift(e) {
    const h = e.npc ? (e.h || 18) : 24, seat = e.npc && typeof isSeated === 'function' && isSeated(e) ? 4 : 0;
    return (h - seat) * (R3.active() && Env.on ? ENV.people : 1) + 6;
}
const Heads = {
    cv: null, g: null, dirty: false, k: 1,
    /* (made on first use, just over the game's canvas: the chat bubbles and the HUD stay on top) */
    canvas() {
        if (this.cv) return this.cv;
        const c = this.cv = document.createElement('canvas');
        c.id = 'heads';
        c.setAttribute('aria-hidden', 'true');
        $('#app').insertBefore(c, $('#bubbles') || $('#ui'));
        this.g = c.getContext('2d');
        return c;
    },
    /* every frame, before the world's drawn: last frame's icons wiped, the canvas kept the game canvas's size */
    start() {
        const v = G.view;
        if (!v) return;
        const c = this.canvas(), k = Math.min(window.devicePixelRatio || 1, 2), w = v.w * v.cssScale, h = v.h * v.cssScale;
        if (c.width !== Math.round(w * k) || c.height !== Math.round(h * k)) {
            c.width = Math.round(w * k); c.height = Math.round(h * k); c.style.width = w + 'px'; c.style.height = h + 'px';
        } else if (this.dirty) { this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.clearRect(0, 0, c.width, c.height); }
        this.k = k; this.dirty = false;
    },
    /* draw on the square `s` CSS pixels wide whose foot's middle is at (x, y) on the screen */
    put(x, y, s, fn) {
        if (!this.cv || !isFinite(x) || !isFinite(y)) return;
        const g = this.g, k = this.k;
        g.setTransform(k * s / 100, 0, 0, k * s / 100, k * (x - s / 2), k * (y - s * 0.97));
        g.globalAlpha = Math.max(0, 1 - (G.fade || 0));
        g.lineJoin = 'round'; g.lineCap = 'round';
        fn(this.g);
        g.globalAlpha = 1;
        this.dirty = true;
    },
    /* someone's emote, its tail at (x, y) on the screen (CSS pixels), `px` CSS pixels to a world pixel there */
    emote(kind, x, y, px) {
        if (!HEAD_ICONS[kind]) return;
        this.put(x, y, clamp(15 * px, 30, 56), g => headIcon(g, kind));
    },
    prompt(x, y, px) { this.put(x, y, clamp(10.5 * px, 22, 40), headPrompt); },
};
