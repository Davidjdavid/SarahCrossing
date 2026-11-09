/* art: every picture is drawn in code on a little pixel grid, then outlined, then cached as a canvas.
   One outline color and one warm palette keep it all of a piece. */
const P = {
    ink: '#2a1b2d', white: '#fff8ec', cream: '#f6e7c8', black: '#1a1220',
    skin: '#f6c49b', skinS: '#d7906c', skinD: '#a8684a', skinD2: '#7a4a33', skinL: '#ffd9b8',
    red: '#e2574c', redS: '#a83a3e', orange: '#f08a3c', yellow: '#f6cf4a', yellowS: '#c99a2e',
    green: '#6cbf5a', greenS: '#3f8a4a', greenD: '#2c6440', teal: '#3fb3a8', tealS: '#2a7d7e',
    blue: '#4f7fd6', blueS: '#35539b', navy: '#2a3566', sky: '#9fd3f0', purple: '#8d5cc2', purpleS: '#5e3c8a',
    pink: '#f59ab7', pinkS: '#c9688c', brown: '#9a6239', brownS: '#6b4128', brownD: '#4a2c1d', tan: '#d8a86a', tanS: '#a87b45',
    grey: '#9a9aae', greyS: '#6c6c82', greyD: '#46465a', stone: '#b9b2a6', stoneS: '#8a8378', stoneD: '#5c574f',
    gold: '#ffd25e', goldS: '#d39a2c', ghost: '#e8f0ff', ghostS: '#a9b9e0',
};

function grid(w, h) { return { w, h, p: new Array(w * h).fill(null) }; }
function px(g, x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.p[y * g.w + x] = c; }
function gpx(g, x, y) { return x >= 0 && y >= 0 && x < g.w && y < g.h ? g.p[y * g.w + x] : null; }
function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); }
function ell(g, cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) px(g, x, y, c);
        }
}
function line(g, x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) px(g, Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), c);
}
/* paint every pixel of color a with b (shading a side) where test(x,y) */
function shade(g, from, to, test) { for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.p[y * g.w + x] === from && test(x, y)) g.p[y * g.w + x] = to; }
function outline(g, c) {
    c = c || P.ink;
    const add = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
        if (gpx(g, x, y)) continue;
        if (gpx(g, x - 1, y) || gpx(g, x + 1, y) || gpx(g, x, y - 1) || gpx(g, x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) px(g, x, y, c);
    return g;
}
function toCanvas(g) {
    const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
    const x = c.getContext('2d'); const im = x.createImageData(g.w, g.h);
    for (let i = 0; i < g.p.length; i++) {
        const col = g.p[i]; if (!col) continue;
        const n = parseInt(col.slice(1), 16);
        im.data[i * 4] = n >> 16; im.data[i * 4 + 1] = (n >> 8) & 255; im.data[i * 4 + 2] = n & 255; im.data[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return c;
}
function flipCanvas(src) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
}
function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

const SPR = {};   /* cache: name -> canvas */
function spr(name, make) { return SPR[name] || (SPR[name] = make()); }

/* ---------- people: a paper doll ---------- */
/* spec: { skin, hair, style, top, bottom, shoes, tall, round, hat, extra(g, dir) } ; dir: down|up|right ; f: 0 stand, 1/2 walk */
function personGrid(sp, dir, f) {
    const tall = sp.tall ? 4 : 0, round = sp.round ? 1 : 0;
    const H = 20 + tall, g = grid(16, H);
    const base = H - 1;                     /* feet's bottom row */
    const legH = 2 + (sp.tall ? 2 : 0);
    const torsoTop = base - 2 - legH - 5;   /* torso 6 rows */
    const hy = torsoTop - 4;                /* head center y */
    const lift = f === 1 ? -1 : 0, lift2 = f === 2 ? -1 : 0;
    const top = sp.top, topS = sp.topS || mixHex(sp.top, P.ink, 0.3);
    const bot = sp.bottom, shoes = sp.shoes || P.brownD;
    if (dir === 'right') {
        /* legs, one in front of the other while walking */
        const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
        rect(g, 7 - sw, base - 1 - legH, 2, legH, mixHex(bot, P.ink, 0.25)); rect(g, 7 - sw, base - 1, 3, 2, shoes);
        rect(g, 7 + sw, base - 1 - legH, 2, legH, bot); rect(g, 7 + sw, base - 1, 3, 2, shoes);
        rect(g, 5 - round, torsoTop, 6 + round * 2, 6, top);
        if (sp.skirt) rect(g, 4 - round, torsoTop + 4, 8 + round * 2, 3, sp.skirt);
        /* arm swinging */
        const as = f === 1 ? 1 : f === 2 ? -1 : 0;
        rect(g, 7 + as, torsoTop + 1, 2, 4, topS); px(g, 7 + as, torsoTop + 5, sp.skin); px(g, 8 + as, torsoTop + 5, sp.skin);
        ell(g, 8, hy, 4.6, 4.4, sp.skin);
        px(g, 11, hy + 1, sp.skin); px(g, 12, hy + 1, sp.skin);  /* nose */
        px(g, 10, hy, P.ink);                                       /* eye */
        if (sp.blush) px(g, 9, hy + 2, sp.blush);
        hairGrid(g, sp, 'right', hy);
    } else {
        const up = dir === 'up';
        rect(g, 5, base - 1 - legH + lift, 2, legH, bot); rect(g, 5, base - 1 + lift, 2, 2, shoes);
        rect(g, 9, base - 1 - legH + lift2, 2, legH, bot); rect(g, 9, base - 1 + lift2, 2, 2, shoes);
        rect(g, 4 - round, torsoTop, 8 + round * 2, 6, top);
        if (sp.skirt) rect(g, 3 - round, torsoTop + 4, 10 + round * 2, 3, sp.skirt);
        if (sp.apron && !up) rect(g, 5, torsoTop + 1, 6, 5, sp.apron);
        const a1 = f === 1 ? -1 : 0, a2 = f === 2 ? -1 : 0;
        rect(g, 3 - round, torsoTop + 1 + a1, 1, 4, topS); px(g, 3 - round, torsoTop + 5 + a1, sp.skin);
        rect(g, 12 + round, torsoTop + 1 + a2, 1, 4, topS); px(g, 12 + round, torsoTop + 5 + a2, sp.skin);
        shade(g, top, topS, (x) => x >= 11 + round);
        ell(g, 8, hy, 4.8, 4.4, sp.skin);
        if (!up) {
            const ey = f === 3 ? hy - 1 : hy;
            px(g, 6, ey, P.ink); px(g, 9, ey, P.ink);
            if (f === 3) { px(g, 6, ey - 1, P.white); px(g, 9, ey - 1, P.white); }
            if (sp.blush) { px(g, 5, hy + 2, sp.blush); px(g, 10, hy + 2, sp.blush); }
            if (sp.glasses) { px(g, 5, hy, sp.glasses); px(g, 7, hy, sp.glasses); px(g, 8, hy, sp.glasses); px(g, 10, hy, sp.glasses); }
            if (sp.beard) { rect(g, 5, hy + 2, 6, 3, sp.beard); px(g, 4, hy + 1, sp.beard); px(g, 11, hy + 1, sp.beard); }
            if (sp.mouth) px(g, 7, hy + 2, sp.mouth), px(g, 8, hy + 2, sp.mouth);
        }
        hairGrid(g, sp, up ? 'up' : 'down', hy);
    }
    if (sp.extra) sp.extra(g, dir, f, hy, torsoTop);
    return outline(g);
}
function hairGrid(g, sp, d, hy) {
    const h = sp.hair, hs = mixHex(sp.hair || '#000000', P.ink, 0.3), st = sp.style;
    if (st === 'bald') { if (d === 'up') ell(g, 8, hy - 1, 4, 2, sp.skinS || P.skinS); return; }
    if (st === 'beanie') {           /* Dot: a red beanie with a white pompom */
        const c = sp.hat || P.red, cs = mixHex(c, P.ink, 0.3);
        ell(g, 8, hy - 2, 5, 3.4, c); rect(g, 3, hy - 1, 10, 2, cs);
        if (d === 'right') { ell(g, 6, hy - 6, 1.6, 1.6, P.white); px(g, 4, hy + 1, h); px(g, 4, hy + 2, h); }
        else ell(g, 8, hy - 6, 1.6, 1.6, P.white);
        if (d === 'up') { rect(g, 4, hy + 1, 8, 3, h); }
        else if (d === 'down') { px(g, 4, hy + 1, h); px(g, 11, hy + 1, h); px(g, 4, hy + 2, h); px(g, 11, hy + 2, h); }
        return;
    }
    if (st === 'cap') {
        const c = sp.hat || P.blue;
        ell(g, 8, hy - 2, 4.8, 3, c);
        if (d === 'down') rect(g, 4, hy - 1, 8, 1, mixHex(c, P.ink, 0.3));
        if (d === 'right') rect(g, 9, hy - 1, 5, 1, mixHex(c, P.ink, 0.3));
        if (d === 'up') rect(g, 4, hy, 8, 3, h);
        return;
    }
    if (st === 'wide') {             /* a wide-brimmed hat */
        const c = sp.hat || P.tan;
        rect(g, 1, hy - 2, 14, 2, mixHex(c, P.ink, 0.2)); ell(g, 8, hy - 4, 4, 2.6, c);
        if (d === 'up') rect(g, 4, hy, 8, 3, h);
        return;
    }
    /* hair over the head */
    ell(g, 8, hy - 2, 5, 3, h);
    if (d === 'up') { ell(g, 8, hy, 5, 4, h); }
    if (d === 'down') { px(g, 3, hy, h); px(g, 12, hy, h); rect(g, 5, hy - 2, 6, 1, h); }
    if (d === 'right') { rect(g, 3, hy - 2, 4, 4, h); }
    if (st === 'long') { rect(g, 3, hy, 2, 6, h); rect(g, 11, hy, 2, 6, h); if (d === 'up') rect(g, 3, hy, 10, 6, h); if (d === 'right') rect(g, 3, hy, 4, 6, h); }
    if (st === 'bun') { ell(g, 8, hy - 5, 2.4, 2, h); }
    if (st === 'pigtails') { ell(g, 2, hy + 2, 1.6, 2.4, h); ell(g, 14, hy + 2, 1.6, 2.4, h); }
    if (st === 'spiky') { px(g, 5, hy - 6, h); px(g, 8, hy - 7, h); px(g, 11, hy - 6, h); rect(g, 4, hy - 5, 9, 1, h); }
    if (st === 'bob') { rect(g, 3, hy, 2, 3, h); rect(g, 11, hy, 2, 3, h); if (d === 'up') rect(g, 3, hy, 10, 3, h); }
    if (st === 'curly') { for (let i = 0; i < 6; i++) ell(g, 4 + i * 1.6, hy - 4 + (i % 2), 1.6, 1.6, h); }
    shade(g, h, hs, (x, y) => y >= hy - 1 && d !== 'up' && x > 10);
}

/* a person's frames: SPR['p:<id>:<dir>:<f>'] ; left is right mirrored */
function personFrame(id, sp, dir, f) {
    const d = dir === 'left' ? 'right' : dir;
    const key = 'p:' + id + ':' + d + ':' + f;
    const c = spr(key, () => toCanvas(personGrid(sp, d, f)));
    if (dir !== 'left') return c;
    return spr(key + ':L', () => flipCanvas(c));
}

/* ---------- critters and things ---------- */
const THINGS = {
    sheep(f) {
        const g = grid(18, 14);
        ell(g, 9, 6, 7.5, 5, P.white); ell(g, 5, 5, 3, 3, P.white); ell(g, 13, 4.5, 3, 3, P.white);
        shade(g, P.white, P.cream, (x, y) => y > 8);
        ell(g, 15, 8, 2.5, 2.2, P.greyD); px(g, 16, 7, P.white);
        const l = f ? 1 : 0;
        rect(g, 4, 10 + l, 2, 3 - l, P.greyD); rect(g, 12, 10 + (1 - l), 2, 3 - (1 - l), P.greyD);
        return outline(g);
    },
    chicken(f) {
        const g = grid(12, 12);
        ell(g, 6, 7, 4.5, 3.5, P.white); ell(g, 9, 4, 2.5, 2.5, P.white); px(g, 9, 1, P.red); px(g, 10, 1, P.red); px(g, 9, 2, P.red);
        px(g, 12, 4, P.orange); px(g, 11, 4, P.orange); px(g, 10, 3, P.ink); rect(g, 1, 4, 2, 3, P.white);
        shade(g, P.white, P.cream, (x, y) => y > 8);
        rect(g, 5, 10 + (f ? 1 : 0), 1, 2 - (f ? 1 : 0), P.orange); rect(g, 7, 10, 1, 2, P.orange);
        return outline(g);
    },
    egg() { const g = grid(7, 8); ell(g, 3.5, 4, 2.8, 3.4, P.cream); px(g, 2, 2, P.white); return outline(g); },
    goldegg() { const g = grid(7, 8); ell(g, 3.5, 4, 2.8, 3.4, P.gold); px(g, 2, 2, P.white); return outline(g); },
    apple() { const g = grid(8, 8); ell(g, 4, 4.5, 3, 3, P.red); px(g, 4, 1, P.brownS); px(g, 5, 1, P.green); px(g, 3, 3, P.pink); return outline(g); },
    bread() { const g = grid(12, 8); ell(g, 6, 4.5, 5, 3, P.tan); line(g, 4, 3, 5, 5, P.tanS); line(g, 7, 3, 8, 5, P.tanS); return outline(g); },
    ball() { const g = grid(8, 8); ell(g, 4, 4, 3.2, 3.2, P.red); line(g, 1, 4, 7, 4, P.white); px(g, 3, 2, P.pink); return outline(g); },
    rock() { const g = grid(14, 12); ell(g, 7, 6.5, 6, 5, P.stone); shade(g, P.stone, P.stoneS, (x, y) => y > 7 || x > 10); px(g, 5, 3, P.white); px(g, 4, 4, P.white); return outline(g); },
    boulder() { const g = grid(16, 16); ell(g, 8, 8, 7, 7, P.stoneS); ell(g, 7, 7, 5.5, 5.5, P.stone); px(g, 5, 4, P.white); px(g, 4, 5, P.white); line(g, 9, 9, 12, 11, P.stoneD); return outline(g); },
    crate() { const g = grid(16, 16); rect(g, 1, 2, 14, 13, P.tan); rect(g, 1, 2, 14, 2, P.tanS); line(g, 2, 5, 13, 13, P.tanS); line(g, 13, 5, 2, 13, P.tanS); rect(g, 1, 13, 14, 2, P.brownS); return outline(g); },
    ghost(f) {
        const g = grid(14, 16);
        ell(g, 7, 6, 5.5, 5.5, P.ghost); rect(g, 2, 6, 11, 7, P.ghost);
        for (let i = 0; i < 4; i++) px(g, 2 + i * 3 + (f ? 1 : 0), 13, P.ghost), px(g, 3 + i * 3 + (f ? 1 : 0), 13, P.ghost);
        shade(g, P.ghost, P.ghostS, (x, y) => x > 10 || y > 11);
        px(g, 5, 6, P.ink); px(g, 9, 6, P.ink); rect(g, 6, 9, 3, 1, P.ghostS);
        return outline(g, '#5a6aa0');
    },
    ant(f) { const g = grid(4, 3); px(g, 0, 1, P.ink); px(g, 1, 1, P.ink); px(g, 3, 1, P.ink); px(g, 2, 1, P.ink); px(g, f ? 1 : 2, 0, P.ink); px(g, f ? 2 : 1, 2, P.ink); return g; },
    cat(f) {
        const g = grid(14, 12);
        ell(g, 7, 7, 4.5, 3.4, P.orange); ell(g, 4, 4, 3, 2.8, P.orange); px(g, 2, 1, P.orange); px(g, 5, 1, P.orange);
        px(g, 3, 4, P.ink); px(g, 5, 4, P.ink); line(g, 11, 6, 13, 3 + (f ? 1 : 0), P.orange);
        shade(g, P.orange, '#c56a2a', (x, y) => y > 8);
        return outline(g);
    },
    dog(f) {
        const g = grid(16, 13);
        ell(g, 8, 7, 5.5, 3.5, P.tan); ell(g, 13, 4.5, 3, 2.8, P.tan); rect(g, 11, 3, 2, 4, P.brownS);
        px(g, 15, 5, P.ink); px(g, 14, 4, P.ink); px(g, 7, 6, P.brownS); px(g, 6, 7, P.brownS); px(g, 9, 8, P.brownS);
        line(g, 2, 6, 1, 3 + (f ? 1 : 0), P.tan);
        const l = f ? 1 : 0; rect(g, 4, 10 + l, 2, 2 - l, P.tan); rect(g, 10, 10 + (1 - l), 2, 2 - (1 - l), P.tan);
        return outline(g);
    },
    moth(f) { const g = grid(8, 6); ell(g, 2, 2 + (f ? 0 : 1), 2, 1.6, P.cream); ell(g, 6, 2 + (f ? 0 : 1), 2, 1.6, P.cream); rect(g, 3, 2, 2, 3, P.tanS); return outline(g); },
    fox(f) {
        const g = grid(16, 12);
        ell(g, 8, 7, 5, 3, P.orange); ell(g, 13, 4.5, 2.6, 2.4, P.orange); px(g, 12, 1, P.orange); px(g, 14, 1, P.orange);
        px(g, 14, 4, P.ink); px(g, 15, 6, P.white); ell(g, 2, 6, 2.5, 2, P.orange); px(g, 0, 6, P.white);
        const l = f ? 1 : 0; rect(g, 5, 9 + l, 1, 3 - l, P.brownD); rect(g, 10, 9 + (1 - l), 1, 3 - (1 - l), P.brownD);
        return outline(g);
    },
    star() { const g = grid(9, 9); line(g, 4, 0, 4, 8, P.gold); line(g, 0, 4, 8, 4, P.gold); line(g, 2, 2, 6, 6, P.gold); line(g, 6, 2, 2, 6, P.gold); px(g, 4, 4, P.white); return g; },
    spyglass() { const g = grid(14, 8); rect(g, 1, 3, 4, 3, P.gold); rect(g, 5, 2, 4, 5, P.goldS); rect(g, 9, 1, 4, 6, P.gold); px(g, 12, 3, P.sky); px(g, 12, 4, P.white); return outline(g); },
    loupe() { const g = grid(12, 12); ell(g, 5, 5, 4, 4, P.gold); ell(g, 5, 5, 2.6, 2.6, P.sky); px(g, 4, 3, P.white); line(g, 8, 8, 11, 11, P.brownS); return outline(g); },
    wideglass() { const g = grid(14, 10); ell(g, 7, 5, 6, 4, P.goldS); ell(g, 7, 5, 4.6, 2.8, P.sky); px(g, 5, 4, P.white); px(g, 6, 3, P.white); return outline(g); },
    prism() { const g = grid(12, 12); for (let y = 0; y < 10; y++) { const w = Math.round(y * 0.55); rect(g, 6 - w, y + 1, w * 2 + 1, 1, y < 4 ? P.white : y < 7 ? P.sky : P.purple); } px(g, 6, 3, P.pink); return outline(g); },
    hourglass() { const g = grid(10, 14); rect(g, 1, 0, 8, 2, P.brown); rect(g, 1, 12, 8, 2, P.brown); for (let y = 2; y < 12; y++) { const w = Math.abs(y - 7) * 0.7 + 0.6; rect(g, Math.round(5 - w), y, Math.round(w * 2), 1, P.sky); } return outline(g); },
    lantern() { const g = grid(8, 11); rect(g, 2, 2, 4, 6, P.yellow); rect(g, 1, 1, 6, 1, P.ink); rect(g, 1, 8, 6, 1, P.ink); px(g, 3, 0, P.ink); px(g, 4, 0, P.ink); px(g, 3, 4, P.white); return outline(g); },
    key() { const g = grid(10, 6); ell(g, 2.5, 3, 2, 2, P.gold); rect(g, 4, 2, 5, 2, P.gold); px(g, 7, 4, P.gold); px(g, 8, 4, P.gold); px(g, 2, 3, P.ink); return outline(g); },
    flower(f, c) { const g = grid(8, 9); px(g, 4, 5, P.greenS); px(g, 4, 6, P.greenS); px(g, 4, 7, P.greenS); px(g, 3, 6, P.green); ell(g, 4, 3, 2.4, 2.4, c || P.pink); px(g, 4, 3, P.yellow); return outline(g); },
    note() { const g = grid(10, 12); rect(g, 1, 1, 8, 10, P.cream); for (let i = 0; i < 4; i++) rect(g, 2, 3 + i * 2, 6, 1, P.tanS); return outline(g); },
    drum() { const g = grid(14, 12); ell(g, 7, 3, 6, 2.5, P.white); rect(g, 1, 3, 12, 6, P.red); ell(g, 7, 9, 6, 2.5, P.red); line(g, 1, 4, 6, 9, P.gold); line(g, 13, 4, 8, 9, P.gold); return outline(g); },
    leaf() { const g = grid(8, 6); ell(g, 4, 3, 3.4, 2, P.green); line(g, 1, 3, 7, 3, P.greenS); return outline(g); },
    twig() { const g = grid(16, 6); line(g, 0, 3, 15, 2, P.brown); line(g, 0, 4, 15, 3, P.brownS); px(g, 6, 1, P.brown); return g; },
    cart() { const g = grid(18, 16); rect(g, 1, 3, 16, 9, P.greyS); rect(g, 2, 4, 14, 3, P.greyD); rect(g, 1, 3, 16, 1, P.grey); ell(g, 4, 13, 2.4, 2.4, P.greyD); ell(g, 14, 13, 2.4, 2.4, P.greyD); return outline(g); },
    bell() { const g = grid(12, 12); ell(g, 6, 5, 4.5, 4.5, P.gold); rect(g, 1, 6, 10, 3, P.gold); rect(g, 0, 9, 12, 1, P.goldS); px(g, 6, 10, P.goldS); px(g, 4, 3, P.white); return outline(g); },
    fish() { const g = grid(12, 7); ell(g, 5, 3.5, 4.5, 2.6, P.sky); px(g, 10, 2, P.sky); px(g, 11, 1, P.sky); px(g, 10, 4, P.sky); px(g, 11, 5, P.sky); px(g, 2, 3, P.ink); return outline(g); },
    pie() { const g = grid(14, 9); ell(g, 7, 4.5, 6.5, 3.5, P.tan); ell(g, 7, 4, 5, 2.4, P.red); line(g, 3, 4, 11, 4, P.tan); return outline(g); },
    squirrel(f) { const g = grid(12, 11); ell(g, 5, 7, 3, 2.6, P.brown); ell(g, 7, 4, 2.2, 2.2, P.brown); ell(g, 2, 4, 2, 3.4, P.tan); px(g, 8, 3, P.ink); rect(g, 4, 9, 1, 2 - (f ? 1 : 0), P.brownD); rect(g, 6, 9, 1, 2, P.brownD); return outline(g); },
    candle() { const g = grid(6, 10); rect(g, 1, 4, 4, 6, P.cream); ell(g, 3, 2, 1.4, 2, P.yellow); px(g, 3, 2, P.white); return outline(g); },
};
function thing(name, f, arg) {
    return spr('t:' + name + ':' + (f || 0) + ':' + (arg || ''), () => toCanvas(THINGS[name](f || 0, arg)));
}
