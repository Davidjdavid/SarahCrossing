/* drawing basics: the palette, pixel fonts, little icons, and a sprite cache.
   everything is drawn in code at 256x192 and scaled up with sharp pixels */

const PAL = {
    k: '#2a1f33', K: '#4a3a55', d: '#5e4a3a', u: '#8a5c3c', t: '#c08a5a', T: '#e6b98a', w: '#fff6e0', W: '#d8cfc0',
    g: '#9a8f96', G: '#6c6370', r: '#d9534f', R: '#9c3445', o: '#ee8f3e', y: '#f6cf55', Y: '#fff1a8', l: '#a6d65f',
    n: '#6fb048', N: '#3f7f3c', D: '#285736', c: '#8fd3f0', b: '#4f93d6', B: '#2d5aa0', p: '#f2a3b5', P: '#8f5fb3',
    s: '#f5cba7', S: '#d99a76', e: '#5fe0c8', E: '#2f8f86', v: '#c9b8e8', z: '#1a1420', m: '#b07fd0', x: '#3b8f5a',
};
const C = PAL;

function mkCanvas(w, h) {
    if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    return { width: w, height: h, getContext: () => null };
}
const SPR = new Map();
/* a sprite from rows of palette letters ('.' is clear) */
function pix(name, rows, pal = PAL) {
    if (SPR.has(name)) return SPR.get(name);
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const cv = mkCanvas(w, h), g = cv.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        g.fillStyle = pal[ch] || '#f0f';
        g.fillRect(x, y, 1, 1);
    }
    SPR.set(name, cv);
    return cv;
}
/* a sprite drawn by a function into a w x h canvas, cached by name */
function made(name, w, h, fn) {
    if (SPR.has(name)) return SPR.get(name);
    const cv = mkCanvas(w, h), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    fn(g, w, h);
    SPR.set(name, cv);
    return cv;
}
const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const P1 = (g, c, x, y) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
/* a filled shape with a 1px outline, from a mask function */
function blob(g, x0, y0, w, h, fill, line, test) {
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && test(x, y);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!on(x, y)) continue;
        const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
        g.fillStyle = edge ? line : (typeof fill === 'function' ? fill(x, y) : fill);
        g.fillRect(x0 + x, y0 + y, 1, 1);
    }
}
const ellipse = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const roundRect = (w, h, r) => (x, y) => {
    const dx = Math.max(r - x - 0.5, x + 0.5 - (w - r), 0), dy = Math.max(r - y - 0.5, y + 0.5 - (h - r), 0);
    return dx * dx + dy * dy <= r * r;
};

/* ---------- text: a 5x7 pixel font with lowercase and descenders ---------- */
const GLYPH_SRC = {
    A: '.###./#...#/#...#/#####/#...#/#...#/#...#', B: '####./#...#/####./#...#/#...#/#...#/####.', C: '.###./#...#/#..../#..../#..../#...#/.###.',
    D: '####./#...#/#...#/#...#/#...#/#...#/####.', E: '#####/#..../####./#..../#..../#..../#####', F: '#####/#..../####./#..../#..../#..../#....',
    G: '.###./#...#/#..../#.###/#...#/#...#/.###.', H: '#...#/#...#/#####/#...#/#...#/#...#/#...#', I: '###/.#./.#./.#./.#./.#./###',
    J: '..###/...#./...#./...#./#..#./#..#./.##..', K: '#...#/#..#./###../#..#./#...#/#...#/#...#', L: '#..../#..../#..../#..../#..../#..../#####',
    M: '#...#/##.##/#.#.#/#...#/#...#/#...#/#...#', N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#', O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    P: '####./#...#/#...#/####./#..../#..../#....', Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', R: '####./#...#/#...#/####./#..#./#...#/#...#',
    S: '.###./#...#/#..../.###./....#/#...#/.###.', T: '#####/..#../..#../..#../..#../..#../..#..', U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    V: '#...#/#...#/#...#/#...#/.#.#./.#.#./..#..', W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    Y: '#...#/#...#/.#.#./..#../..#../..#../..#..', Z: '#####/....#/...#./..#../.#.../#..../#####',
    a: '..../..../.##./...#/.###/#..#/.###', b: '#.../#.../###./#..#/#..#/#..#/###.', c: '..../..../.##./#.../#.../#.../.##.',
    d: '...#/...#/.###/#..#/#..#/#..#/.###', e: '..../..../.##./#..#/####/#.../.###', f: '.##/#../###/#../#../#../#..',
    g: '..../..../.###/#..#/#..#/#..#/.###/...#/.##.', h: '#.../#.../###./#..#/#..#/#..#/#..#', i: '#/./#/#/#/#/#',
    j: '.#/../.#/.#/.#/.#/.#/.#/#.', k: '#.../#.../#..#/#.#./##../#.#./#..#', l: '#./#./#./#./#./#./.#',
    m: '...../...../####./#.#.#/#.#.#/#.#.#/#.#.#', n: '..../..../###./#..#/#..#/#..#/#..#', o: '..../..../.##./#..#/#..#/#..#/.##.',
    p: '..../..../###./#..#/#..#/#..#/###./#.../#...', q: '..../..../.###/#..#/#..#/#..#/.###/...#/...#', r: '.../.../#.#/##./#../#../#..',
    s: '..../..../.###/#.../.##./...#/###.', t: '.#./.#./###/.#./.#./.#./..#', u: '..../..../#..#/#..#/#..#/#..#/.###',
    v: '...../...../#...#/#...#/.#.#./.#.#./..#..', w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.', x: '...../...../#...#/.#.#./..#../.#.#./#...#',
    y: '..../..../#..#/#..#/#..#/#..#/.###/...#/.##.', z: '..../..../####/...#/.##./#.../####',
    0: '.##./#..#/#..#/#..#/#..#/#..#/.##.', 1: '.#./##./.#./.#./.#./.#./###', 2: '.##./#..#/...#/..#./.#../#.../####',
    3: '###./...#/...#/.##./...#/...#/###.', 4: '#..#/#..#/#..#/####/...#/...#/...#', 5: '####/#.../#.../###./...#/...#/###.',
    6: '.##./#.../#.../###./#..#/#..#/.##.', 7: '####/...#/...#/..#./.#../.#../.#..', 8: '.##./#..#/#..#/.##./#..#/#..#/.##.',
    9: '.##./#..#/#..#/.###/...#/...#/.##.', '.': './././././.#', ',': '../../../../../.#/.#/#.', '!': '#/#/#/#/#/./#',
    '?': '.##./#..#/...#/..#./.#../..../.#..', "'": '#/#/./././././', '"': '#.#/#.#/.../.../.../.../...', '-': '.../.../.../###/.../.../...',
    ':': './././#/././#', ';': '../../../.#/../../.#/#.', '(': '.#/#./#./#./#./#./.#', ')': '#./.#/.#/.#/.#/.#/#.',
    '/': '...#/...#/..#./.#../.#../#.../#...', '+': '.../.../.#./###/.#./.../...', '=': '..../..../####/..../####/..../....',
    '∞': '...../...../##.##/#.#.#/#.#.#/##.##/.....', '#': '.#.#./#####/.#.#./.#.#./#####/.#.#./.....', '&': '.##../#..#./.##../#.#.#/#..#./#..#./.##.#',
    '*': '...../#.#.#/.###./#####/.###./#.#.#/.....', '>': '#../.#./..#/.#./#../.../...', '<': '..#/.#./#../.#./..#/.../...', '%': '#...#/...#./..#../.#.../#...#/...../.....',
};
const GLYPH = {};
for (const [ch, s] of Object.entries(GLYPH_SRC)) {
    const rows = s.split('/');
    GLYPH[ch] = { w: Math.max(...rows.map(r => r.length)), rows };
}
const FONT_H = 10;
function textW(str) {
    let w = 0;
    for (const ch of str) w += ch === ' ' ? 3 : (GLYPH[ch] ? GLYPH[ch].w + 1 : 4);
    return Math.max(0, w - 1);
}
const glyphCache = new Map();
function glyphImg(ch, col) {
    const key = ch + col;
    if (glyphCache.has(key)) return glyphCache.get(key);
    const gl = GLYPH[ch];
    const cv = mkCanvas(gl.w, gl.rows.length), g = cv.getContext('2d');
    g.fillStyle = col;
    gl.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') g.fillRect(x, y, 1, 1); });
    glyphCache.set(key, cv);
    return cv;
}
function text(g, str, x, y, col = C.k, shadow = null) {
    let cx = x;
    for (const ch of str) {
        if (ch === ' ') { cx += 3; continue; }
        if (!GLYPH[ch]) { cx += 4; continue; }
        if (shadow) g.drawImage(glyphImg(ch, shadow), cx + 1, y + 1);
        g.drawImage(glyphImg(ch, col), cx, y);
        cx += GLYPH[ch].w + 1;
    }
    return cx - x;
}
function textC(g, str, cx, y, col, shadow) { text(g, str, Math.round(cx - textW(str) / 2), y, col, shadow); }
/* wrap to a width in pixels */
function wrap(str, w) {
    const out = [];
    for (const para of str.split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
            const t = line ? line + ' ' + word : word;
            if (textW(t) > w && line) { out.push(line); line = word; } else line = t;
        }
        out.push(line);
    }
    return out;
}

/* ---------- digits on tags: chunky 4x6 ---------- */
const DIG_SRC = [
    '.##./#..#/#..#/#..#/#..#/.##.', '.#../##../.#../.#../.#../###.', '.##./#..#/..#./.#../#.../####', '###./...#/.##./...#/...#/###.',
    '#..#/#..#/####/...#/...#/...#', '####/#.../###./...#/...#/###.', '.##./#.../###./#..#/#..#/.##.', '####/...#/..#./.#../.#../.#..',
    '.##./#..#/.##./#..#/#..#/.##.', '.##./#..#/#..#/.###/...#/.##.', '...../##.##/#.#.#/#.#.#/##.##/.....',
];
const DIG = DIG_SRC.map(s => s.split('/'));
const digCache = new Map();
function digitImg(d, col, scale = 1, flip = false) {
    const key = `${d}|${col}|${scale}|${flip}`;
    if (digCache.has(key)) return digCache.get(key);
    const rows = DIG[d] || DIG[0];
    const w = rows[0].length, h = rows.length;
    const cv = mkCanvas(w * scale, h * scale), g = cv.getContext('2d');
    g.fillStyle = col;
    rows.forEach((r, y) => { for (let x = 0; x < w; x++) if (r[x] === '#') { const xx = flip ? w - 1 - x : x, yy = flip ? h - 1 - y : y; g.fillRect(xx * scale, yy * scale, scale, scale); } });
    digCache.set(key, cv);
    return cv;
}
const digitW = d => (DIG[d] || DIG[0])[0].length;

/* ---------- icons for what a number means (5x5) ---------- */
const ICON_SRC = {
    wt: ['.###.', '..#..', '#####', '#####', '.###.'],
    str: ['.##..', '#####', '#####', '.####', '..##.'],
    hp: ['#.#..', '#####', '#####', '.###.', '..#..'],
    age: ['#####', '.###.', '..#..', '.#.#.', '#####'],
    addr: ['..#..', '.###.', '#####', '.#.#.', '.###.'],
    to: ['#####', '##.##', '#.#.#', '#...#', '#####'],
    hour: ['.###.', '#.#.#', '#.###', '#...#', '.###.'],
    w: ['..#..', '.##..', '#####', '.##..', '..#..'],
    e: ['..#..', '..##.', '#####', '..##.', '..#..'],
    price: ['.###.', '#.#.#', '##.##', '#.#.#', '.###.'],
    gold: ['.###.', '#.#.#', '##.##', '#.#.#', '.###.'],
    need: ['#####', '.....', '.###.', '.....', '#####'],
    hold: ['#.#.#', '.#.#.', '#.#.#', '.#.#.', '#.#.#'],
    cnt: ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
    n: ['.###.', '#.#.#', '#####', '#.#.#', '.###.'],
    v: ['..#..', '.#.#.', '#...#', '.#.#.', '..#..'],
    d: ['.....', '#.#.#', '.#.#.', '#.#.#', '.....'],
    lamp: ['.###.', '#####', '.###.', '..#..', '.###.'],
};
const ICON_COL = { wt: C.G, str: C.o, hp: C.r, age: C.N, addr: C.u, to: C.R, hour: C.B, w: C.u, e: C.u, price: C.y, gold: C.y, need: C.G, hold: C.d, cnt: C.P, n: C.t, v: C.b, d: C.B, lamp: C.o };
function iconImg(key, col) {
    const rows = ICON_SRC[key] || ICON_SRC.v;
    return pix('icon_' + key + col, rows.map(r => r.replace(/#/g, 'Q')), Object.assign({}, PAL, { Q: col }));
}
