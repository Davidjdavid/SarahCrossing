/* ---- 32yc_hd_emotes.js ---- */
/* the speech-bubble emotes over heads and the little "talk" prompt, three times the detail (drawn over the HD-2D view) */
const hdM_ink = '#4a3a58';
function hdM_bubble(s, cx, cy, rx, ry, tail) {
    // a rounded square (a superellipse), nearly flat white like a comic's balloon
    const b = s.add(hdPal(hdM_ink, '#e6e0ee', '#f7f4fa', '#fdfcff', '#ffffff'), { R: 4, grad: 0.08, k: 0.5 });
    const pts = [];
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, c = Math.cos(a), n = Math.sin(a); pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 0.6) * rx, cy + Math.sign(n) * Math.pow(Math.abs(n), 0.6) * ry]); }
    s.poly(b, pts);
    s.poly(b, [[cx - tail, cy + ry - 3], [cx + tail, cy + ry - 3], [cx + 1, cy + ry + tail + 1], [cx - 1, cy + ry + tail + 1]]);
    return b;
}
function hdM_face(s, col, cx, cy) { const f = s.add(col, { layer: 1, R: 5 }); s.ellipse(f, cx, cy, 9, 8.5); return f; }
const hdM_icons = {
    heart(s) { const p = s.add('#e8455f', { layer: 1, R: 4 }); s.ellipse(p, 15.8, 14.5, 6, 6); s.ellipse(p, 26.2, 14.5, 6, 6); s.poly(p, [[10, 16.5], [32, 16.5], [21, 29]]); s.px(14, 11, '#ffd0d8'); s.px(13, 12, '#ffd0d8'); },
    bang(s) { const p = s.add('#e03a4e', { layer: 1, R: 2 }); s.poly(p, [[18.5, 6.5], [23.5, 6.5], [22.5, 21.5], [19.5, 21.5]]); s.ellipse(p, 21, 26, 2.8, 2.8); },
    q(s) {
        const p = s.add('#4f86c6', { layer: 1, R: 2 });
        for (let a = -3.3; a <= 0.9; a += 0.15) s.line(p, 21 + Math.cos(a) * 6, 13 + Math.sin(a) * 5.5, 21 + Math.cos(a + 0.15) * 6, 13 + Math.sin(a + 0.15) * 5.5, 2);
        s.line(p, 25.5, 17, 21, 20, 2); s.line(p, 21, 20, 21, 22.5, 2); s.ellipse(p, 21, 27, 2.6, 2.6);
    },
    note(s) { const p = s.add('#a77ce6', { layer: 1, R: 3 }); s.ellipse(p, 16.5, 24, 4.5, 3.6); s.rect(p, 19, 8, 2.6, 16); s.poly(p, [[19, 7], [28, 9.5], [28, 14], [21.6, 12]]); },
    zzz(s) { const p = s.add('#4f86c6', { layer: 1, R: 2 }); const z = (x, y, k) => { s.line(p, x, y, x + 8 * k, y, 1.3 * k); s.line(p, x + 8 * k, y, x, y + 7 * k, 1.3 * k); s.line(p, x, y + 7 * k, x + 8 * k, y + 7 * k, 1.3 * k); }; z(9, 9, 1); z(21, 17, 0.75); z(29, 23, 0.5); },
    sweat(s) { const p = s.add('#6fc0e6', { layer: 1, R: 5 }); s.ellipse(p, 21, 22, 6.5, 6.5); s.poly(p, [[15, 20.5], [27, 20.5], [21, 6]]); s.px(19, 19, '#e8f8ff'); s.px(19, 20, '#e8f8ff'); },
    spicy(s) {
        const o = s.add('#e2382b', { layer: 1, R: 5 }); s.ellipse(o, 21, 21.5, 7.5, 6.5); s.poly(o, [[14, 20], [28, 20], [26, 11], [23, 15], [21, 6], [18, 14], [16, 10]]);
        const y = s.add('#ff9a2a', { layer: 2, R: 4 }); s.ellipse(y, 21, 23, 4.5, 4); s.poly(y, [[17, 22], [25, 22], [21, 12]]);
        const c = s.add('#ffe066', { layer: 3, R: 2 }); s.ellipse(c, 21, 24.5, 2.2, 2.2);
    },
    sparkle(s) { const p = s.add('#f6c63a', { layer: 1, R: 3, grad: 0 }); s.poly(p, [[21, 5], [23.4, 15.6], [33, 18], [23.4, 20.4], [21, 31], [18.6, 20.4], [9, 18], [18.6, 15.6]]); s.px(20, 16, '#fff8d8'); s.px(21, 15, '#fff8d8'); },
    laugh(s) { hdM_face(s, '#f6c63a', 21, 18); for (const x of [16.5, 25.5]) { s.px(x - 1, 15, '#5a3a1a'); s.px(x, 14, '#5a3a1a'); s.px(x + 1, 15, '#5a3a1a'); } const m = s.add('#8a2a2a', { layer: 2, flat: 1 }); s.poly(m, [[15.5, 19], [26.5, 19], [24, 24], [18, 24]]); for (let x = 17; x <= 25; x++) s.px(x, 19, '#ffffff'); },
    sad(s) { hdM_face(s, '#8ab4e8', 21, 18); for (const x of [17, 25]) { s.px(x, 15, '#2a3a5a'); s.px(x, 16, '#2a3a5a'); } for (const [x, y] of [[17, 23], [18, 22], [19, 21], [20, 21], [21, 21], [22, 21], [23, 22], [24, 23]]) s.px(x, y, '#2a3a5a'); s.px(26, 18, '#e8f8ff'); s.px(26, 19, '#cfefff'); },
    fish(s) { const p = s.add('#4f86c6', { layer: 1, R: 5 }); s.ellipse(p, 19, 18, 8, 5); s.poly(p, [[25, 18], [32, 12.5], [32, 23.5]]); s.px(14, 17, '#ffffff'); s.px(14, 16, '#1e2a40'); s.px(18, 15, '#a8cff0'); s.px(19, 15, '#a8cff0'); },
    dots(s) { const p = s.add('#7a6a8a', { layer: 1, R: 4, k: 0.6 }); for (const x of [12.5, 21, 29.5]) s.ellipse(p, x, 18, 3.4, 3.4); },
    wink(s) { hdM_face(s, '#f6c63a', 21, 18); s.px(16, 15, '#5a3a1a'); s.px(16, 16, '#5a3a1a'); for (const x of [24, 25, 26]) s.px(x, 16, '#5a3a1a'); for (const [x, y] of [[17, 21], [18, 22], [19, 22], [20, 22], [21, 22], [22, 22], [23, 21]]) s.px(x, y, '#5a3a1a'); s.px(13, 19, '#f49a8a'); s.px(28, 19, '#f49a8a'); },
    idea(s) {
        const g = s.add('#ffe066', { layer: 1, R: 6 }); s.ellipse(g, 21, 15, 7, 7); s.poly(g, [[17, 18], [25, 18], [24, 23], [18, 23]]);
        const b = s.add('#9a9aaa', { layer: 2, R: 2 }); s.rect(b, 18, 23, 6, 4); s.px(19, 24, '#d8d8e0'); s.px(19, 26, '#d8d8e0');
        s.px(19, 12, '#fffbe8'); s.px(18, 13, '#fffbe8');
        for (const [x, y] of [[9, 9], [10, 10], [33, 9], [32, 10], [8, 17], [9, 17], [34, 17], [33, 17]]) s.px(x, y, '#f6c63a');
    },
    cool(s) { hdM_face(s, '#f6c63a', 21, 18); const g = s.add('#2a2a36', { layer: 2, R: 2 }); s.rect(g, 12, 14, 18, 2); s.ellipse(g, 17, 17, 4, 2.8); s.ellipse(g, 25, 17, 4, 2.8); s.px(15, 16, '#8a8aa8'); s.px(23, 16, '#8a8aa8'); for (const [x, y] of [[18, 22], [19, 23], [20, 23], [21, 23], [22, 23], [23, 22]]) s.px(x, y, '#5a3a1a'); },
    star(s) { const p = s.add('#f6c63a', { layer: 1, R: 4 }); const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.6 : 10.5; pts.push([21 + Math.cos(a) * r, 19 + Math.sin(a) * r]); } s.poly(p, pts); for (const [x, y] of [[8, 8], [9, 9], [34, 8], [33, 9], [7, 26], [35, 26]]) s.px(x, y, '#f6a63a'); s.px(20, 15, '#fff6c8'); },
};
for (const [k, fn] of Object.entries(hdM_icons)) HD_SPR['emote_' + k] = { w: 42, h: 42, ax: 21, ay: 39, draw(s) { hdM_bubble(s, 21, 18, 20, 16.5, 4); fn(s); } };
/* "talk": a small bubble with an orange "!" */
HD_SPR.prompt = { w: 30, h: 33, ax: 15, ay: 30, draw(s) {
    hdM_bubble(s, 15, 13, 14, 12.5, 3.5);
    const p = s.add('#f2896b', { layer: 1, R: 2 }); s.poly(p, [[13, 5], [17, 5], [16.2, 16], [13.8, 16]]); s.ellipse(p, 15, 20, 2.2, 2.2);
} };
