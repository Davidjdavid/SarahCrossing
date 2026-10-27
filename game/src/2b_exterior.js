/* ---- 2b_exterior.js ---- */
/* House exteriors. Every house can be drawn in code with the same recipe the art build uses, so Ginger can
   repaint walls, put on a new roof, add a mailbox or flower boxes, and redo the neighbors' houses too.
   S.exteriors[id] holds only what Sarah changed; everything else comes from HOUSE_BASE. */

/* ---------------------------------------------------------------- a tiny pixel canvas (same rules as art/pix.py) */
const PXC = new Map();
function pxHex(c) {
    if (Array.isArray(c)) return c.length === 4 ? c : [c[0], c[1], c[2], 255];
    let v = PXC.get(c);
    if (!v) { const s = c.replace('#', ''); v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), 255]; PXC.set(c, v); }
    return v;
}
function pxMix(a, b, t) { a = pxHex(a); b = pxHex(b); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function pxDark(c, f) { return pxMix(c, '#1a1026', f == null ? 0.2 : f); }
function pxLight(c, f) { return pxMix(c, '#ffffff', f == null ? 0.2 : f); }
function pxCss(c) { c = pxHex(c); return `rgb(${c[0]},${c[1]},${c[2]})`; }
class PixSpr {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    get(x, y) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) return [0, 0, 0, 0];
        const i = (y * this.w + x) * 4, d = this.d;
        return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    }
    a(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
    set(x, y, c) {
        if (c == null) return;
        x = Math.trunc(x); y = Math.trunc(y);
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
        c = pxHex(c);
        const i = (y * this.w + x) * 4, d = this.d;
        if (c[3] === 255 || c[3] === 0 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; return; }
        const t = c[3] / 255;
        d[i] = Math.trunc(d[i] + (c[0] - d[i]) * t); d[i + 1] = Math.trunc(d[i + 1] + (c[1] - d[i + 1]) * t);
        d[i + 2] = Math.trunc(d[i + 2] + (c[2] - d[i + 2]) * t); d[i + 3] = Math.max(d[i + 3], c[3]);
    }
    rect(x, y, w, h, c) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c); return this; }
    frame(x, y, w, h, c) {
        for (let xx = x; xx < x + w; xx++) { this.set(xx, y, c); this.set(xx, y + h - 1, c); }
        for (let yy = y; yy < y + h; yy++) { this.set(x, yy, c); this.set(x + w - 1, yy, c); }
        return this;
    }
    hline(x0, x1, y, c) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c); }
    vline(x, y0, y1, c) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c); }
    line(x0, y0, x1, y1, c) {
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        for (;;) {
            this.set(x0, y0, c);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }
    ellipse(cx, cy, rx, ry, c) {
        for (let y = Math.trunc(cy - ry - 1); y < Math.trunc(cy + ry + 2); y++)
            for (let x = Math.trunc(cx - rx - 1); x < Math.trunc(cx + rx + 2); x++)
                if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.set(x, y, c);
        return this;
    }
    rrect(x, y, w, h, r, c) {
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
            const dx = Math.max(x + r - xx - 0.5, xx + 0.5 - (x + w - r), 0), dy = Math.max(y + r - yy - 0.5, yy + 0.5 - (y + h - r), 0);
            if (dx * dx + dy * dy <= r * r + 0.25) this.set(xx, yy, c);
        }
        return this;
    }
    outline(c) {
        c = pxHex(c);
        const pts = [];
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            if (this.a(x, y)) continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const o = this.get(x + dx, y + dy);
                if (o[3] > 0 && !(o[0] === c[0] && o[1] === c[1] && o[2] === c[2] && o[3] === c[3])) { pts.push([x, y]); break; }
            }
        }
        for (const [x, y] of pts) { const i = (y * this.w + x) * 4; this.d.set(c, i); }
        return this;
    }
    canvas() {
        const cv = document.createElement('canvas');
        cv.width = this.w; cv.height = this.h;
        cv.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
        return cv;
    }
}

/* ---------------------------------------------------------------- how each house starts out */
const HOUSE_BASE = {
    home: { w: 64, h: 64, wall: '#fbe7d0', roof: '#c8505a', trim: '#ffffff', door: '#b3263a', doorX: 40, boxes: 1, mailbox: 1 },
    h_david: { wall: '#ffd1ea', roof: 'rainbow', trim: '#ffffff', door: '#b37cf0' },
    h_maki: { wall: '#efe4cf', roof: '#34473e', trim: '#5a4633', door: '#6b4a35', sig: 'noren' },
    h_coco: { wall: '#8a5a3c', roof: '#ff9ec0', trim: '#f7d6e6', door: '#5a3322' },
    h_chili: { wall: '#fff1e4', roof: '#e2382b', trim: '#7a1512', door: '#5aa844', sig: 'lights' },
    h_cece: { wall: '#fff4dc', roof: '#f5d68e', trim: '#c98a4b', door: '#ff8aa8', sig: 'bakery' },
    h_clementine: { wall: '#fff6ea', roof: '#f7962d', trim: '#ffffff', door: '#3f8f45', style: 'flat', band: 1 },
    h_basil: { wall: '#e7f2dc', roof: '#4a9a52', trim: '#2f6b36', door: '#c4843f', sig: 'lantern' },
    h_kai: { wall: '#e9d3a8', roof: '#caa55f', trim: '#8a6a3a', door: '#4f86c6', style: 'thatch', sig: 'surfboard' },
    h_cuke: { wall: '#eaf6e0', roof: '#3f8a3a', trim: '#ffffff', door: '#e84a5a', sig: 'sweatband' },
    h_joe: { wall: '#d6dde8', roof: '#3d5a6c', trim: '#fff7e6', door: '#d4a03a', sig: 'joe' },
    h_sully: { wall: '#b0533c', roof: '#4a4450', trim: '#fbf6ee', door: '#2f6b4a', style: 'flat', pattern: 'brick', band: 1, sig: 'sully' },
    h_ginger: { wall: '#b8733d', roof: '#7a4422', trim: '#ffffff', door: '#e0405a', sig: 'ginger' },
    h_brulee: { wall: '#f7e7c4', roof: '#c98a3a', trim: '#8a5a2b', door: '#6b3f2a', sig: 'brulee' },
    h_mac: { wall: '#ffe08a', roof: '#3f6fb8', trim: '#ffffff', door: '#e0405a', sig: 'mac' },
    h_fortune: { wall: '#f4d9a0', roof: '#c8505a', trim: '#fff4dc', door: '#d49a3a', boxes: 1 },
};
const HOUSE_IDS = Object.keys(HOUSE_BASE);
/* the things Ginger can change */
const EXT_WALLS = ['#fbe7d0', '#fbf6ee', '#fff1b8', '#ffd9c0', '#ffd1ea', '#e2d4f7', '#dcf2e6', '#d4ebf7', '#c9dbb8', '#e9d3a8',
    '#f2b880', '#d98a5a', '#b0533c', '#8a95a8', '#8a5a3c', '#4a4450'];
const EXT_ROOFS = ['#c8505a', '#9a2f3a', '#f7962d', '#e9b93b', '#4a9a52', '#34473e', '#3a8a8a', '#4f86c6', '#2c3e66', '#8a5ab8',
    '#ff9ec0', '#7a4422', '#caa55f', '#4a4450', 'rainbow'];
const EXT_DOORS = ['#b3263a', '#e84a5a', '#f7962d', '#ffd84a', '#5aa844', '#3f8f45', '#4f86c6', '#2c3e66', '#b37cf0', '#ff8aa8', '#6b4a35', '#fbf6ee'];
const EXT_TRIMS = ['#ffffff', '#fff4dc', '#c98a4b', '#5a4633', '#2d2230', '#d9b44a'];
const EXT_STYLES = [['gable', 'Gable'], ['peaked', 'Peaked'], ['tiled', 'Tiled'], ['flat', 'Flat'], ['thatch', 'Thatch']];
const EXT_PATTERNS = [['plain', 'Plain'], ['siding', 'Siding'], ['brick', 'Brick'], ['shingle', 'Shingles'], ['stripes', 'Stripes'], ['timber', 'Timber']];
const EXT_ADDONS = [['mailbox', 'Mailbox'], ['boxes', 'Flower boxes'], ['shutters', 'Shutters'], ['lamps', 'Porch lamps'], ['plants', 'Potted plants'],
    ['chimney', 'Chimney'], ['awning', 'Awning'], ['band', 'Trim stripe'], ['wreath', 'Door wreath']];
const EXT_KEYS = ['wall', 'roof', 'door', 'trim', 'style', 'pattern', 'wallName', 'roofName', 'doorName', 'trimName'].concat(EXT_ADDONS.map(a => a[0]));
const RAINBOW = ['#ff5a6a', '#ffa24a', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0'];

function exteriors() { if (!S.exteriors) S.exteriors = {}; return S.exteriors; }
function houseLook(id, over, bare) {
    const L = Object.assign({ w: 48, h: 56, win: '#9fd8ef', style: 'gable', pattern: 'plain' }, HOUSE_BASE[id], bare ? {} : exteriors()[id] || {}, over || {});
    if (id === 'home') {
        L.level = S.house ? S.house.level : 0;
        if (L.level >= 2) L.h = 78;
    }
    return L;
}
/* only the differences from how the house started (that's all the save keeps) */
function lookDiff(id, L) {
    const B = Object.assign({ style: 'gable', pattern: 'plain' }, HOUSE_BASE[id]);
    const out = {};
    for (const k of EXT_KEYS) {
        const addon = EXT_ADDONS.some(a => a[0] === k);
        const a = addon ? (L[k] ? 1 : 0) : L[k], b = addon ? (B[k] ? 1 : 0) : B[k];
        if (a !== b) out[k] = a;
    }
    return out;
}

/* ---------------------------------------------------------------- drawing a house */
function drawHouse(L) {
    const w = L.w, h = L.h, s = new PixSpr(w, h);
    const wt = Math.floor(h * 0.42);
    const wall = L.wall, trim = L.trim, rainbow = L.roof === 'rainbow';
    const roof = rainbow ? '#ff5a6a' : L.roof;
    const two = L.level >= 2;
    s.rect(2, h - 3, w - 4, 3, [0, 0, 0, 50]);
    s.rect(2, wt, w - 4, h - wt - 3, wall);
    wallPattern(s, L, wt);
    s.rect(2, h - 7, w - 4, 4, pxDark(wall, 0.18));
    s.vline(w - 3, wt, h - 4, pxDark(wall, 0.12));
    // roof
    const r2 = pxDark(roof, 0.22);
    const st = L.style || 'gable';
    if (st === 'gable' || st === 'tiled' || st === 'peaked') {
        for (let y = 0; y < wt + 3; y++) {
            let inset = y < 6 ? Math.max(0, Math.trunc((wt + 3 - y) * 0.35)) : 0;
            if (st === 'peaked') inset = Math.max(0, Math.round((wt - y) * (w / 2 - 3) / wt));
            for (let x = inset; x <= w - 1 - inset; x++) {
                let c = Math.floor(y / 3) % 2 === 0 ? roof : pxDark(roof, 0.08);
                if (st === 'tiled') c = (y % 4 === 3 || (y % 4 === 2 && (x + Math.floor(y / 4) * 2) % 4 === 0)) ? pxDark(roof, 0.16) : (y % 4 === 0 ? pxLight(roof, 0.12) : roof);
                if (y >= wt) c = r2;
                s.set(x, y, c);
            }
        }
        s.hline(0, w - 1, wt + 2, r2);
    } else if (st === 'flat') {
        s.rect(0, wt - 8, w, 11, roof);
        s.rect(0, wt + 1, w, 2, r2);
    } else if (st === 'thatch') {
        for (let y = 0; y < wt + 4; y++) {
            const inset = Math.max(0, Math.floor((wt + 4 - y) / 2) - 4);
            for (let x = inset; x < w - inset; x++) s.set(x, y, (x + y) % 4 ? roof : pxDark(roof, 0.15));
        }
        for (let x = 0; x < w; x += 2) s.set(x, wt + 4, pxDark(roof, 0.25));
    }
    if (rainbow) {
        for (let y = 0; y < wt + 3; y++) { const c = RAINBOW[Math.floor(y / 3) % RAINBOW.length]; for (let x = 0; x < w; x++) if (s.a(x, y)) s.set(x, y, c); }
    }
    if (L.chimney) {
        const cx = w - 15, top = st === 'flat' ? wt - 15 : 1;
        s.rect(cx, top, 6, (st === 'flat' ? wt - 8 : Math.max(8, wt - 12)) - top, pxDark(wall, 0.25));
        s.rect(cx - 1, top, 8, 2, pxDark(wall, 0.4));
        for (let y = top + 3; y < (st === 'flat' ? wt - 8 : wt - 12); y += 3) s.hline(cx, cx + 5, y, pxDark(wall, 0.33));
    }
    if (L.level === 1 || L.level >= 3) dormer(s, L, wt, roof);
    // door
    const dw = 10, dh = 15, dx = (L.doorX != null ? L.doorX : Math.floor(w / 2)) - Math.floor(dw / 2);
    s.rect(dx, h - 3 - dh, dw, dh, L.door);
    s.rect(dx + 1, h - 3 - dh + 1, dw - 2, dh - 1, pxLight(L.door, 0.12));
    s.set(dx + dw - 3, h - 3 - Math.floor(dh / 2), '#ffd35a');
    s.frame(dx - 1, h - 4 - dh, dw + 2, dh + 1, trim);
    // windows
    const wins = [];
    const win = (wx, wy) => {
        if (wy + 10 > h - 4 - dh && wx + 10 > dx - 1 && wx < dx + dw + 1) return;
        s.rect(wx, wy + 1, 10, 8, L.win);
        s.frame(wx - 1, wy, 12, 10, trim);
        s.vline(wx + 5, wy + 1, wy + 8, trim);
        s.set(wx + 1, wy + 2, '#ffffff');
        wins.push([wx, wy]);
    };
    if (two) {
        for (const wx of [6, Math.floor(w / 2) - 5, w - 16]) win(wx, wt + 5);
        s.rect(2, wt + 18, w - 4, 2, trim); s.hline(2, w - 3, wt + 20, pxDark(wall, 0.15));
        for (const wx of [6, w - 16]) win(wx, h - 21);
    } else for (const wx of [6, w - 16]) win(wx, wt + 6);
    if (L.level >= 4) porch(s, L, dx, dw, dh);
    // the owner's own touches
    if (L.sig && HOUSE_SIG[L.sig]) HOUSE_SIG[L.sig](s, wt, L);
    // extras
    if (L.band) s.rect(1, wt + 1, w - 2, 2, trim);
    if (L.awning) awningPx(s, wt, roof === '#fbf6ee' ? '#e0405a' : roof, '#fff4dc');
    if (L.shutters) for (const [wx, wy] of wins) { s.rect(wx - 4, wy, 3, 10, L.door); s.rect(wx + 11, wy, 3, 10, L.door); s.hline(wx - 4, wx - 2, wy + 4, pxDark(L.door, 0.2)); s.hline(wx + 11, wx + 13, wy + 4, pxDark(L.door, 0.2)); }
    if (L.boxes) for (const [wx, wy] of wins) {
        s.rect(wx - 1, wy + 10, 12, 2, '#9a6b45');
        for (let x = wx; x < wx + 10; x += 2) { s.set(x, wy + 9, '#ff9ec0'); s.set(x + 1, wy + 9, '#6cc063'); }
    }
    if (L.lamps) for (const lx of [dx - 5, dx + dw + 2]) {
        s.rect(lx, h - 17, 3, 4, '#ffe7a8'); s.frame(lx - 1, h - 18, 5, 6, '#3f3a4a'); s.set(lx + 1, h - 19, '#3f3a4a');
    }
    if (L.plants) for (const px of [dx - 8, dx + dw + 3]) {
        s.rect(px, h - 9, 5, 5, '#c9703f'); s.rect(px - 1, h - 10, 7, 2, '#a85a30');
        s.ellipse(px + 2.5, h - 12, 3, 2.5, '#5aa844'); s.set(px + 1, h - 13, '#8cd46a'); s.set(px + 3, h - 14, '#ff9ec0');
    }
    if (L.wreath) {
        const cx = dx + Math.floor(dw / 2), cy = h - 3 - dh + 5;
        s.ellipse(cx, cy, 3.5, 3.5, '#3f8a3a'); s.ellipse(cx, cy, 1.6, 1.6, L.door);
        s.set(cx - 2, cy - 2, '#e0405a'); s.set(cx + 2, cy + 1, '#e0405a'); s.rect(cx - 1, cy + 3, 3, 2, '#e0405a');
    }
    s.outline('#2d2230');
    return s;
}
function wallPattern(s, L, wt) {
    const w = s.w, h = s.h, p = L.pattern || 'plain', wall = L.wall;
    if (p === 'siding') { for (let y = wt + 3; y < h - 7; y += 3) s.hline(2, w - 3, y, pxDark(wall, 0.09)); }
    else if (p === 'brick') {
        for (let y = wt + 2; y < h - 7; y += 3) for (let x = 3 + (Math.floor(y / 3) % 2) * 3; x < w - 3; x += 6) s.set(x, y, pxDark(wall, 0.16));
    } else if (p === 'shingle') {
        for (let y = wt + 3; y < h - 7; y += 4) for (let x = 2; x < w - 2; x++) {
            const k = (x + (Math.floor(y / 4) % 2) * 2) % 4;
            s.set(x, y + (k === 0 || k === 3 ? 0 : 1), pxDark(wall, 0.12));
        }
    } else if (p === 'stripes') { for (let x = 4; x < w - 3; x += 5) s.rect(x, wt, 2, h - wt - 7, pxLight(wall, 0.3)); }
    else if (p === 'timber') {
        const beam = pxDark(wall, 0.5), mid = wt + Math.floor((h - 7 - wt) / 2);
        for (const x of [2, Math.floor(w / 3), Math.floor(2 * w / 3), w - 4]) s.rect(x, wt, 2, h - wt - 7, beam);
        s.rect(2, mid, w - 4, 2, beam);
        s.line(3, mid - 1, Math.floor(w / 3) - 1, wt + 3, beam); s.line(w - 4, mid - 1, Math.floor(2 * w / 3) + 2, wt + 3, beam);
    }
}
function dormer(s, L, wt, roof) {
    const cx = Math.floor(s.w / 2) - (L.chimney ? 6 : 0), y0 = Math.max(2, wt - 16);
    for (let y = y0; y < y0 + 5; y++) { const k = y - y0; s.hline(cx - 2 - k, cx + 1 + k, y, pxDark(roof, 0.28)); }
    s.rect(cx - 6, y0 + 5, 12, 9, L.wall); s.frame(cx - 6, y0 + 5, 12, 9, pxDark(L.wall, 0.25));
    s.rect(cx - 3, y0 + 7, 6, 5, L.win); s.frame(cx - 4, y0 + 6, 8, 7, L.trim); s.set(cx - 2, y0 + 8, '#ffffff');
}
function porch(s, L, dx, dw, dh) {
    const h = s.h, y = h - 4 - dh - 4;
    s.rect(dx - 5, y, dw + 10, 3, L.roof === 'rainbow' ? '#b37cf0' : L.roof); s.hline(dx - 5, dx + dw + 4, y + 3, pxDark(L.roof === 'rainbow' ? '#b37cf0' : L.roof, 0.3));
    s.rect(dx - 4, y + 3, 2, dh + 1, L.trim); s.rect(dx + dw + 2, y + 3, 2, dh + 1, L.trim);
}
function awningPx(s, wt, a, b) {
    for (let x = 1; x < s.w - 1; x++) s.rect(x, wt + 1, 1, 5, Math.floor(x / 4) % 2 ? a : b);
    for (let x = 1; x < s.w - 1; x += 4) s.set(x + 1, wt + 6, a);
}
/* each neighbor keeps their own touch whatever the paint job */
const HOUSE_SIG = {
    noren(s, wt) {
        const x0 = Math.floor(s.w / 2) - 7;
        s.rect(x0, wt + 12, 14, 5, '#2c3e66');
        for (let x = x0 + 1; x < x0 + 14; x += 3) s.vline(x, wt + 13, wt + 16, '#f4f1e8');
        s.set(x0 + 6, wt + 14, '#e05a5a');
    },
    lights(s, wt) {
        let i = 0;
        for (let x = 3; x < s.w - 3; x += 4, i++) {
            const y = wt + 2 + Math.trunc(1.5 * Math.sin(i * 0.9));
            s.set(x, y, '#e2382b'); s.set(x, y + 1, '#e2382b'); s.set(x, y - 1, '#5aa844');
        }
    },
    bakery(s, wt) { awningPx(s, wt, '#ff8aa8', '#fff4dc'); },
    lantern(s, wt) {
        for (const x of [6, s.w - 8]) { s.rect(x, wt + 3, 3, 4, '#e0405a'); s.set(x + 1, wt + 2, '#2d2230'); s.set(x + 1, wt + 4, '#ffd35a'); }
    },
    surfboard(s, wt) { s.rect(s.w - 7, wt + 2, 4, 20, '#4ec3d9'); s.vline(s.w - 5, wt + 3, wt + 20, '#ffffff'); },
    sweatband(s, wt) { s.rect(1, wt + 1, s.w - 2, 2, '#e84a5a'); },
    joe(s, wt) {
        const cx = Math.floor(s.w / 2);
        s.rect(cx - 5, wt + 1, 10, 5, '#fff7e6'); s.frame(cx - 6, wt, 12, 7, '#5a4633');
        s.line(cx - 3, wt + 5, cx + 3, wt + 1, '#3a3340'); s.set(cx + 3, wt + 1, '#8a8ea8'); s.set(cx + 2, wt + 2, '#8a8ea8');
        for (const wx of [6, s.w - 16]) { s.rect(wx + 1, wt + 8, 3, 4, '#ffffff'); s.hline(wx + 1, wx + 3, wt + 9, '#b8b0c8'); s.rect(wx + 6, wt + 9, 3, 4, '#fff7e6'); }
        for (const [x, y] of [[4, s.h - 6], [s.w - 8, s.h - 5], [s.w - 6, s.h - 6]]) { s.rect(x, y, 2, 2, '#fbfaf2'); s.set(x, y, '#d8d2c4'); }
    },
    sully(s) {
        s.rect(s.w - 11, s.h - 9, 6, 5, '#c9703f'); s.rect(s.w - 12, s.h - 10, 8, 2, '#a85a30');
        s.set(s.w - 9, s.h - 11, '#6cc063'); s.set(s.w - 8, s.h - 12, '#6cc063');
    },
    ginger(s, top) {
        for (let x = 0; x < s.w; x++) if (s.a(x, top + 2)) s.set(x, top + 2 + (x % 3 === 1 ? 1 : 0), '#ffffff');
        for (const [x, y, c] of [[23, 21, '#8cc152'], [31, 18, '#e0405a'], [8, 18, '#ffd84a'], [22, 9, '#4ec3d9'], [38, 15, '#8cc152'], [22, 7, '#4ec3d9'], [8, 5, '#8cc152']]) {
            if (s.a(x, y)) { s.rect(x, y, 3, 2, c); s.set(x + 1, y - 1, c); }
        }
        for (const wx of [6, s.w - 16]) for (let x = wx - 1; x < wx + 11; x += 2) s.set(x, top + 6, '#ffffff');
        for (const cx of [Math.floor(s.w / 2) - 9, Math.floor(s.w / 2) + 8]) {
            for (let y = s.h - 16; y < s.h - 4; y++) s.set(cx, y, Math.floor(y / 2) % 2 ? '#e0405a' : '#ffffff');
            s.set(cx + 1, s.h - 16, '#e0405a'); s.set(cx + 2, s.h - 15, '#ffffff');
        }
    },
    mac(s, top) {
        for (const wx of [6, s.w - 16]) for (let x = wx; x < wx + 10; x++) {
            s.set(x, top + 8, Math.floor(x / 2) % 2 ? '#e0405a' : '#ffffff'); s.set(x, top + 9, Math.floor(x / 2) % 2 ? '#ffffff' : '#e0405a');
        }
        const cx = s.w - 13;
        s.rect(cx, 2, 6, top - 6, '#8a5a3c'); s.rect(cx - 1, 1, 8, 2, '#6b4225');
        s.ellipse(cx + 3, 0, 4, 2.5, '#ffffff'); s.rect(cx + 1, 1, 5, 2, '#ffffff');
        s.rect(3, s.h - 10, 7, 6, '#8a96a8'); s.hline(2, 10, s.h - 10, '#b8c4d0'); s.set(1, s.h - 8, '#8a96a8'); s.set(10, s.h - 8, '#8a96a8');
        s.set(5, s.h - 12, [255, 255, 255, 160]); s.set(7, s.h - 13, [255, 255, 255, 120]);
    },
    brulee(s, top) {
        for (let x = 4; x < s.w - 4; x += 5) for (let y = 2; y < top; y++) if (s.a(x, y) && (x + y) % 7 === 0) s.set(x, y, '#f2c27a');
        const cx = Math.floor(s.w / 2);
        s.ellipse(cx, top - 4, 4, 4, '#9fd8ef'); s.set(cx - 1, top - 6, '#ffffff');
        const ex = s.w - 9;
        s.line(ex, s.h - 4, ex + 3, s.h - 16, '#8a5a2b'); s.line(ex + 6, s.h - 4, ex + 3, s.h - 16, '#8a5a2b');
        s.rect(ex, s.h - 15, 7, 6, '#ffffff');
        s.set(ex + 2, s.h - 13, '#e0405a'); s.set(ex + 4, s.h - 12, '#4ea8f0'); s.set(ex + 3, s.h - 11, '#8cc152');
    },
};

/* ---------------------------------------------------------------- the houses on the island */
function houseCustom(id) { return id === 'home' || !!(exteriors()[id] && Object.keys(exteriors()[id]).length); }
/* what the island shows of a house: its look, with a wreath on the door while the Winter Lights are up (never saved) */
function holidayWreath() { return typeof G !== 'undefined' && !!G.events && (G.events.has('lights') || G.events.has('winterfest')); }
function shownLook(id) { const L = houseLook(id); if (holidayWreath()) L.wreath = 1; return L; }
function exteriorFrame(id) {
    const b = W0.buildings[id];
    if (!houseCustom(id)) return b.sprite;
    const L = shownLook(id), key = JSON.stringify(L), name = 'hx_' + id, d = Assets.dyn[name];
    if (!d || d.key !== key) {
        const s = drawHouse(L);
        Assets.dyn[name] = { c: s.canvas(), w: s.w, h: s.h, ax: Math.floor(s.w / 2), ay: s.h - 3, key };
    }
    return name;
}
/* repaint the buildings and put the mailboxes where they belong */
function applyExteriors(a) {
    if (!a || a.id !== 'island') return;
    for (const e of a.ents) if (e.kind === 'building' && HOUSE_BASE[e.id]) {
        e.frame = exteriorFrame(e.id);
        const L = houseLook(e.id);
        e.light = L.lamps ? { r: 30, y: -12 } : null;
    }
    // Sarah's mailbox is a real one (it gets her mail); the neighbors' are just for looks
    const home = houseLook('home');
    const mb = a.ents.find(e => e.kind === 'mailbox');
    const spot = W0.props.find(p => p.kind === 'mailbox');
    if (!home.mailbox && mb) { a.remove(mb); a.block(mb.px, mb.py, 0); G.mailbox = null; }
    if (home.mailbox && !mb && spot) {
        const p = G.player;
        if (G.area !== a || !p || Math.floor(p.x / TILE) !== spot.x || Math.floor(p.y / TILE) !== spot.y) addProp(a, spot);
    }
    a.ents = a.ents.filter(e => !e.xMailbox);
    for (const id of HOUSE_IDS) {
        if (id === 'home' || !houseLook(id).mailbox) continue;
        const b = W0.buildings[id];
        if (!b) continue;
        const y = b.y + b.h;
        const x = [b.x, b.x + b.w - 1].find(tx => tx !== b.x + b.door && !a.blockedAt(tx, y) && W0.grid[y][tx] !== '~');
        if (x == null) continue;
        const owner = id.slice(2);
        const e = a.add({ kind: 'xmailbox', xMailbox: true, frame: 'mailbox', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 4, owner });
        e.hit = { x: x * TILE, y: y * TILE - 12, w: TILE, h: TILE + 8 };
        e.interact = () => UI.say(null, rpick([`${NPC_DEFS[owner] ? NPC_DEFS[owner].name : 'Somebody'}'s mailbox. It's none of Sarah's business. (It's empty.)`,
            `A little mailbox. Ginger put it up. ${NPC_DEFS[owner] ? NPC_DEFS[owner].name : 'Its owner'} checks it every day and is always a little disappointed.`]));
    }
}

