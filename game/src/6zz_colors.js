/* ---- 6zz_colors.js ---- */
/* IslandMart's furniture in four colors (David, 27 October: "every piece of furniture in four colors (the model's parts
   painted differently), named like 'Large couch (pink)'"). Each piece IslandMart sells comes in its own colors and three
   more, each an item of its own (<id>@<color>: sofa_pink@mint) with its own name ("Sofa (mint)"). Its pictures and its
   model are the piece's own, repainted where its main color is: the flat view's picture and the icons made when first
   needed (colorSprite), the HD picture likewise (colorHd), and in the new look the model's own colors (colorGeo, from
   EnvRoom.parts). A wooden piece comes in light wood, dark wood and white; a white or grey one in pastels. The week's
   stock shows each piece in one of its four (laptopCatalog); Order again has every color Sarah has had. Registered
   here, before a save loads, so a save with a colored piece keeps it. */
const PAINTS = { red: '#e0405a', pink: '#ff8ec0', orange: '#f7962d', yellow: '#f2c84a', mint: '#8fd6b0', green: '#5aa85a', sky: '#6ac0e8',
    blue: '#4f7ad8', lilac: '#b38cf0', white: '#f4f0e8', black: '#3a3640' };
const WOODS = { 'light wood': '#e2bc88', 'dark wood': '#6a4028', white: '#f4f0e8' };
const PASTELS = ['pink', 'mint', 'sky', 'yellow', 'lilac'];
/* pieces that do something of their own keep their one look */
const NO_COLORS = ['fixture', 'prize', 'pottery', 'art', 'anim', 'arcade', 'special', 'cook', 'wardrobe', 'disco', 'stars', 'easel', 'laptop', 'photo'];
const COLOR_WORDS = /^(pink|red|blue|green|white|black|yellow|orange|purple|lilac|mint|crimson|gold|golden|silver|brown|grey|gray|pastel|wooden)\s+/i;

function hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx];
}
function rgbOf(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [r + m, g + m, b + m];
}
function hueGap(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
/* a piece's main color, from its colors (0..1 each, with how much of each): a hue that most of its colored parts share
   (or wood, if that hue is a brown), or, for a piece with hardly any color, its light parts */
function paintMain(cols, plant) {
    let all = 0, colored = 0;
    const bins = new Array(36).fill(0);
    for (const [r, g, b, w] of cols) {
        const [h, s, v] = hsv(r, g, b);
        all += w;
        // (a plant keeps its leaves: its pot is what's painted)
        if (s < 0.2 || v < 0.15 || (plant && h > 65 && h < 175)) continue;
        colored += w;
        bins[Math.floor(h / 10) % 36] += w * s;
    }
    if (!all || colored < all * 0.15) return { kind: 'plain' };
    let best = 0, bi = 0;
    for (let i = 0; i < 36; i++) { const t = bins[(i + 35) % 36] + bins[i] + bins[(i + 1) % 36]; if (t > best) { best = t; bi = i; } }
    const h0 = bi * 10 + 5;
    let sw = 0, ss = 0, sv = 0;
    for (const [r, g, b, w] of cols) {
        const [h, s, v] = hsv(r, g, b);
        if (s < 0.15 || v < 0.12 || hueGap(h, h0) > 30) continue;
        sw += w; ss += s * w; sv += v * w;
    }
    const s = ss / sw, v = sv / sw;
    return { kind: h0 >= 12 && h0 <= 48 && s < 0.7 && v < 0.82 ? 'wood' : 'color', h: h0, s, v };
}
/* a piece's four colors: its own, then three more (fixed for each piece) */
function paintChoices(id, A) {
    if (A.kind === 'wood') return Object.keys(WOODS);
    const r = mulberry(hash32('paint:' + id));
    const pool = A.kind === 'plain' ? PASTELS.slice() : Object.keys(PAINTS).filter(k => { const [h, s] = hsv(...hexRgb(PAINTS[k])); return s < 0.25 || hueGap(h, A.h) > 40; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, 3);
}
function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
/* one color repainted: in the piece's main color (or its light parts, for a plain one), moved to the new color keeping its
   shading; anything else as it was (null) */
function paintPixel(r, g, b, A, T) {
    const [h, s, v] = hsv(r, g, b), [th, ts, tv] = T;
    if (A.kind === 'plain') {
        if (s > 0.2 || v < 0.5) return null;
        return rgbOf(th, ts * 0.8, Math.min(1, v * (0.55 + tv * 0.45)));
    }
    if (s < (A.kind === 'wood' ? 0.12 : 0.15) || v < 0.12 || hueGap(h, A.h) > 30) return null;
    return rgbOf(th, Math.min(1, s * ts / Math.max(0.15, A.s)), Math.min(1, v * tv / Math.max(0.2, A.v)));
}

/* ---------------------------------------------------------------- the pieces in color */
const PAINT_FOR = {};       // a colored piece's id -> { base, color, hex, wood, frame, A: where its picture is repainted }
function isPlant(d) { return !!d.plant || /plant|cactus|bonsai|herb|sunflower|planter/.test(d.id); }
function paintAnalyzeSprite(frame, plant) {
    const f = Assets.frames[frame];
    if (!f || !Assets.atlas) return null;
    const [sx, sy, w, h] = f, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, cols = [];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) cols.push([d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, 1]);
    return { cv, A: paintMain(cols, plant) };
}
/* each piece's three other colors, fixed once from its picture's colors (paintChoices; 'wood' for a wooden piece) so a
   save's colored pieces always stay what they are; a piece added later gets its colors here (paintTableMissing() works
   them out for whatever IslandMart sells that isn't listed, and a test fails until they're added) */
const PAINT_TABLE = {
    bed_simple: 'blue,pink,mint', table_wood: 'wood', chair_wood: 'wood', lamp_floor: 'wood',
    rug_round: 'white,green,lilac', shelf_book: 'wood', plant_monstera: 'blue,pink,black',
    plant_cactus: 'white,black,blue', sofa_pink: 'blue,mint,black', clock_wall: 'wood',
    window_wall: 'green,yellow,black', hammock: 'wood', surfboard: 'black,yellow,green',
    shell_lamp: 'green,pink,white', driftwood_table: 'wood', beach_umbrella: 'green,blue,black',
    shell_mirror: 'mint,green,black', blackout_curtains: 'pink,green,yellow', moon_lamp: 'blue,black,white',
    cloud_bed: 'black,red,pink', beanbag: 'yellow,green,pink', dnd_sign: 'black,sky,green',
    coffee_maker: 'orange,black,green', sushi_counter: 'wood', paper_lantern: 'white,pink,orange',
    noren: 'red,black,mint', bonsai: 'green,lilac,white', lucky_cat: 'mint,yellow,orange', tatami: 'red,pink,orange',
    takeout_lamp: 'white,orange,red', red_lantern: 'black,sky,lilac', steamer_stack: 'wood',
    chili_lights: 'black,white,mint', spice_rack: 'wood', silk_cushion: 'lilac,black,green',
    cheesecake_case: 'green,mint,blue', cafe_table: 'green,yellow,blue', macaron_stool: 'sky,green,lilac',
    cake_stand: 'black,blue,sky', pastel_rug: 'red,sky,green', study_desk: 'wood', crimson_chair: 'blue,black,mint',
    diploma: 'wood', nameplate: 'wood', chalkboard: 'blue,orange,sky', globe: 'white,lilac,black',
    crimson_rug: 'white,mint,lilac', herb_pot: 'lilac,blue,green', sunflower: 'red,blue,lilac',
    veggie_planter: 'wood', watering_can: 'orange,red,black', dining_table: 'white,green,mint', dining_chair: 'wood',
    table_setting: 'white,pink,red',
};
const PAINT_BY_NAME = {};   // a colored piece's picture's name -> { P, src: its own picture's name }
/* every piece IslandMart sells in its other colors, each its own item with its own name, the price its own */
function registerColors() {
    for (const [id, t] of Object.entries(PAINT_TABLE)) {
        const d = FURN[id], it = ITEMS[id];
        if (!d || !it || d.base) continue;
        const wood = t === 'wood', colors = wood ? Object.keys(WOODS) : t.split(','), plain = String(d.name).replace(COLOR_WORDS, ''), frame = d.frame || 'f_' + id, icon = it.icon || frame;
        for (const c of colors) {
            const vid = id + '@' + c, name = cap(plain) + ` (${c})`;
            const P = PAINT_FOR[vid] = { base: id, color: c, hex: (wood ? WOODS : PAINTS)[c], wood, frame, A: null };
            FURN[vid] = Object.assign({}, d, { id: vid, name, base: id, color: c, frame: frame + '@' + c });
            ITEMS[vid] = Object.assign({}, it, { name, icon: icon + '@' + c, base: id, color: c });
            PAINT_BY_NAME[frame + '@' + c] = { P, src: frame };
            PAINT_BY_NAME[icon + '@' + c] = { P, src: icon };
        }
        d.colors = [null].concat(colors);
    }
}
registerColors();
/* where a colored piece's picture is repainted: worked out from its own picture the first time (a wooden one as wood) */
function paintA(P) {
    if (P.A) return P.A;
    const got = paintAnalyzeSprite(P.frame, isPlant(FURN[P.base]));
    if (!got) return null;
    P.A = P.wood && got.A.kind !== 'wood' ? Object.assign({}, got.A, { kind: 'wood' }) : got.A;
    return P.A;
}
/* the flat view's picture for a piece in color: its own picture repainted (made the first time it's drawn) */
function colorSprite(name) {
    if (Assets.dyn[name]) return Assets.dyn[name];
    const m = PAINT_BY_NAME[name], f = m && Assets.frames[m.src];
    if (!f || !Assets.atlas || !paintA(m.P)) return null;
    const [sx, sy, w, h, ax, ay] = f, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
    paintCanvas(cv, m.P);
    return (Assets.dyn[name] = { c: cv, w, h, ax, ay });
}
function paintCanvas(cv, P) {
    const g = cv.getContext('2d'), img = g.getImageData(0, 0, cv.width, cv.height), d = img.data, T = hsv(...hexRgb(P.hex)), A = paintA(P);
    if (!A) return;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const o = paintPixel(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, A, T);
        if (o) { d[i] = Math.round(o[0] * 255); d[i + 1] = Math.round(o[1] * 255); d[i + 2] = Math.round(o[2] * 255); }
    }
    g.putImageData(img, 0, 0);
}
/* the HD picture for a piece in color: the piece's HD picture repainted, once it has one */
const HD_PAINTED = new Map();
function colorHd(name) {
    const m = PAINT_BY_NAME[name];
    if (!m || typeof HD_SPR === 'undefined' || !HD_SPR[m.src]) return null;
    const hf = hdNamed(m.src);
    if (!hf || !hf.c || !paintA(m.P)) return null;
    const k = name + '|' + hf.c.width;
    if (HD_PAINTED.has(k)) return HD_PAINTED.get(k);
    const cv = document.createElement('canvas');
    cv.width = hf.c.width; cv.height = hf.c.height;
    cv.getContext('2d').drawImage(hf.c, 0, 0);
    paintCanvas(cv, m.P);
    const out = Object.assign({}, hf, { c: cv, key: 'v|' + name });
    HD_PAINTED.set(k, out);
    return out;
}
/* the new look's model for a piece in color: its parts' own colors repainted where the model's main color is (worked out
   from the model's colors, which follow its HD picture) */
const GEO_PAINTED = new Map(), MODEL_MAIN = new Map();
function colorGeo(n, geo, def) {
    const P = PAINT_FOR[def.id];
    if (!P || !geo.attributes.color) return geo;
    const k = geo.uuid + '|' + def.color;
    if (GEO_PAINTED.has(k)) return GEO_PAINTED.get(k);
    let A = MODEL_MAIN.get(n);
    if (!A) {
        const cols = [];
        for (const p of EnvModels.models[n].parts) {
            const c = p.geometry.attributes.color;
            if (!c || /_(glow|clear|pic|picglow|screen)$/.test(p.material.name || '')) continue;
            const a = c.array, max = a instanceof Uint16Array ? 65535 : a instanceof Uint8Array ? 255 : 1, sz = c.itemSize;
            for (let i = 0; i < c.count; i += 3) cols.push([a[i * sz] / max, a[i * sz + 1] / max, a[i * sz + 2] / max, 1]);
        }
        A = paintMain(cols, isPlant(FURN[P.base]));
        // (a wooden piece stays wood, as its picture is)
        if (P.wood && A.kind !== 'wood') A = Object.assign({}, A, { kind: 'wood' });
        MODEL_MAIN.set(n, A);
    }
    const g = geo.clone(), c = g.attributes.color, a = c.array, max = a instanceof Uint16Array ? 65535 : a instanceof Uint8Array ? 255 : 1, sz = c.itemSize, T = hsv(...hexRgb(P.hex));
    for (let i = 0; i < c.count; i++) {
        const o = paintPixel(a[i * sz] / max, a[i * sz + 1] / max, a[i * sz + 2] / max, A, T);
        if (!o) continue;
        for (let j = 0; j < 3; j++) a[i * sz + j] = max === 1 ? o[j] : Math.round(o[j] * max);
    }
    c.needsUpdate = true;
    GEO_PAINTED.set(k, g);
    return g;
}
/* this week's color of a piece in the shop (its own most weeks) */
function martColor(id, week) {
    const d = FURN[id];
    if (!d || !d.colors) return id;
    const c = d.colors[mulberry(hash32((S.seed || 'x') + ':paint:' + id + ':' + week))() * d.colors.length | 0];
    return c && FURN[id + '@' + c] ? id + '@' + c : id;
}
/* (for a piece added later: its colors for PAINT_TABLE, worked out from its picture) */
function paintTableMissing() {
    const out = {};
    for (const id of Object.keys(FURN)) {
        const d = FURN[id], it = ITEMS[id];
        if (!it || !(it.price > 0) || !(d.price > 0) || d.base || PAINT_TABLE[id] || NO_COLORS.some(k => d[k])) continue;
        const got = paintAnalyzeSprite(d.frame || 'f_' + id, isPlant(d));
        if (got) out[id] = got.A.kind === 'wood' ? 'wood' : paintChoices(id, got.A).join(',');
    }
    return out;
}
