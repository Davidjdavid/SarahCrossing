/* Sprites: pixel grids in the source, compiled once to canvases. A grid is rows of characters; a legend
   maps each character to a colour ('.' is clear). Helpers make walk frames, mirror, recolour, outline. */

const SPR = {};                    /* name -> canvas */
const SPR_SRC = {};                /* name -> { rows, legend } kept for recolouring */

/* the common legend: per sprite a legend can add or override characters */
const LEGEND = {
    k: PAL.ink, K: PAL.ink2, w: PAL.white, W: PAL.cream, g: PAL.grey1, G: PAL.grey2, x: PAL.grey3, X: PAL.grey4,
    s: PAL.skin, S: PAL.skin2, e: PAL.ink, c: PAL.rose,
    r: PAL.red, R: PAL.red2, o: PAL.orange, O: PAL.orange2, y: PAL.yellow, Y: PAL.gold,
    v: PAL.green, V: PAL.green2, n: PAL.green3, N: PAL.green4,
    b: PAL.brown2, B: PAL.brown3, u: PAL.brown, U: PAL.brown4,
    a: PAL.blue, A: PAL.blue2, z: PAL.blue3, Z: PAL.blue4,
    q: PAL.teal, Q: PAL.teal2, m: PAL.purple, M: PAL.purple2, i: PAL.pink, I: PAL.pink2,
};

function compileGrid(rows, legend) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const c = Gfx.makeCanvas(w, h);
    const x = c.getContext('2d');
    for (let y = 0; y < h; y++) {
        const r = rows[y];
        for (let i = 0; i < r.length; i++) {
            const ch = r[i];
            if (ch === '.' || ch === ' ') continue;
            const col = legend[ch] || LEGEND[ch];
            if (!col) continue;
            x.fillStyle = col; x.fillRect(i, y, 1, 1);
        }
    }
    return c;
}

function defSprite(name, rows, legend = {}) {
    if (typeof rows === 'string') rows = rows.trim().split('\n').map(s => s.trim());
    SPR_SRC[name] = { rows, legend };
    SPR[name] = compileGrid(rows, Object.assign({}, LEGEND, legend));
    return SPR[name];
}
function spr(name) { return SPR[name]; }

/* walking: lift one leg (the columns given) by a pixel */
function liftLeg(rows, cols, from) {
    const out = rows.map(r => r.split(''));
    const h = rows.length;
    for (const c of cols) {
        for (let y = from; y < h; y++) out[y][c] = (y + 1 < h) ? rows[y + 1][c] : '.';
    }
    return out.map(r => r.join(''));
}
/* the same grid with some characters swapped (a palette swap at the source) */
function swapChars(rows, map) { return rows.map(r => r.replace(/./g, ch => map[ch] !== undefined ? map[ch] : ch)); }
function shiftRows(rows, dy) {
    const w = rows[0].length, blank = '.'.repeat(w);
    if (dy > 0) return Array(dy).fill(blank).concat(rows.slice(0, rows.length - dy));
    return rows.slice(-dy).concat(Array(-dy).fill(blank));
}

/* a canvas tinted to one colour (for hit flashes and silhouettes) */
const _tintCache = new Map();
function tinted(im, col) {
    if (!im || HEADLESS) return im;
    let m = _tintCache.get(im);
    if (!m) { m = {}; _tintCache.set(im, m); }
    if (m[col]) return m[col];
    const c = Gfx.makeCanvas(im.width, im.height), x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    m[col] = c;
    return c;
}

/* draw a list of filled pixels then outline it automatically (for generated sprites) */
function outlineCanvas(c, col = PAL.ink) {
    if (HEADLESS) return c;
    const x = c.getContext('2d');
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, w = c.width, h = c.height;
    const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && p[(j * w + i) * 4 + 3] > 0;
    const add = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (solid(i, j)) continue;
        if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) add.push([i, j]);
    }
    x.fillStyle = col;
    for (const [i, j] of add) x.fillRect(i, j, 1, 1);
    return c;
}

/* ---------------- Wren ---------------- */
const WREN_LEGEND = {
    h: '#a5532a', H: '#743620', l: '#c8743a',
    t: '#e7ad3c', T: '#b67d26',
    p: '#3a5fae', P: '#25407e',
    b: '#7a4a2c',
};
const WREN_DOWN = [
    '.....kkkkkk.....',
    '....khhllhhk....',
    '...khhlhhhhhk...',
    '...khhhhhhhhk...',
    '...khhhhhhhHk...',
    '...khshhhhsHk...',
    '...kssessesSk...',
    '...kscessecSk...',
    '....ksssssSk....',
    '....krrrrrrk....',
    '...ktRrrrrRtk...',
    '...kttrRtttTk...',
    '..kstttrtttTsk..',
    '....kppppPPk....',
    '....kbbkkbbk....',
    '.....kk..kk.....',
];
const WREN_RIGHT = [
    '.....kkkkkk.....',
    '....khhllhhk....',
    '...khhhlhhhhk...',
    '...khhhhhhhhk...',
    '...kHhhhhhhhk...',
    '...kHhhhhhssk...',
    '...kHhhhhssek...',
    '...kHhhhsscek...',
    '....kHhSsssk....',
    '.....krrrrk.....',
    '...kRrrrrttk....',
    '...kRktttttk....',
    '....kTttttsk....',
    '....kppppPk.....',
    '....kbbkbbk.....',
    '.....kk.kk......',
];
const WREN_UP = [
    '.....kkkkkk.....',
    '....khhllhhk....',
    '...khhlhhhhhk...',
    '...khhhhhhhhk...',
    '...khhhhhhhHk...',
    '...khhhhhhhHk...',
    '...kHhhhhhhHk...',
    '...kHHhhhhHHk...',
    '....kHHHHHHk....',
    '....krrRRrrk....',
    '...ktrrRRrrtk...',
    '...kTttRRttTk...',
    '..kstttrrtttsk..',
    '....kppppPPk....',
    '....kbbkkbbk....',
    '.....kk..kk.....',
];
/* arms up (lifting, carrying, holding a found thing up) */
function armsUp(rows, front) {
    const r = rows.slice();
    const set = (y, x, ch) => { r[y] = r[y].slice(0, x) + ch + r[y].slice(x + 1); };
    /* hands beside the head, arms along it */
    set(2, 1, 'k'); set(3, 1, 'k'); set(2, 2, 's'); set(3, 2, 'k');
    set(2, 14, 'k'); set(3, 14, 'k'); set(2, 13, 's'); set(3, 13, 'k');
    for (let y = 4; y <= 11; y++) { set(y, 2, 'k'); set(y, 13, 'k'); }
    for (let y = 4; y <= 10; y++) { set(y, 2, y < 9 ? 'k' : 'k'); }
    if (front) { set(12, 2, '.'); set(12, 3, 'k'); set(12, 12, 'k'); set(12, 13, '.'); }
    return r;
}

function buildPerson(prefix, down, right, up, legend, legCols = { down: [[5, 6], [9, 10]], right: [[5, 6], [8, 9]], up: [[5, 6], [9, 10]] }) {
    const L = legend;
    const make = (dir, rows, cols) => {
        defSprite(`${prefix}_${dir}_0`, rows, L);
        defSprite(`${prefix}_${dir}_1`, liftLeg(rows, cols[0], rows.length - 3), L);
        defSprite(`${prefix}_${dir}_2`, liftLeg(rows, cols[1], rows.length - 3), L);
    };
    make('down', down, legCols.down);
    make('right', right, legCols.right);
    make('up', up, legCols.up);
}

function initWrenSprites() {
    buildPerson('wren', WREN_DOWN, WREN_RIGHT, WREN_UP, WREN_LEGEND);
    defSprite('wren_lift_down', armsUp(WREN_DOWN, true), WREN_LEGEND);
    defSprite('wren_lift_up', armsUp(WREN_UP, true), WREN_LEGEND);
    defSprite('wren_lift_right', armsUp(WREN_RIGHT, false), WREN_LEGEND);
    /* asleep: lying down, eyes shut */
    defSprite('wren_sleep', swapChars(WREN_DOWN, { e: 'S', c: 's' }), WREN_LEGEND);
    defSprite('wren_sleep_head', swapChars(WREN_DOWN, { e: 'S', c: 's' }).slice(0, 9), WREN_LEGEND);
}

/* sprite name for a person facing a direction on a walk frame */
function personFrame(prefix, dir, frame) {
    const d = dir === LEFT ? 'right' : DIR_NAME[dir];
    return SPR[`${prefix}_${d}_${frame}`];
}
