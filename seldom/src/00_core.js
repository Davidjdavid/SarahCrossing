'use strict';
/* Seldom: one script, joined in file-name order by build.mjs. Everything is global. */

const TILE = 16;
const VIEW_W = 384, VIEW_H = 216;      /* the view at zoom 1, in world pixels */
const STEP = 1 / 60;                    /* the simulation's fixed step */

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inRect = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* a small deterministic hash, for texture noise and anything that must look random but stay put */
function hash2(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const G = {
    t: 0,              /* seconds the game has run (wall clock of the sim) */
    frame: 0,
    state: 'title',    /* title | play | talk | menu | notebook | ending | credits */
    flags: {},         /* story flags */
    debug: false,
};

const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
function dirOf(dx, dy, prev) {
    if (Math.abs(dx) > Math.abs(dy) + 0.01) return dx < 0 ? 'left' : 'right';
    if (Math.abs(dy) > 0.01) return dy < 0 ? 'up' : 'down';
    if (Math.abs(dx) > 0.01) return dx < 0 ? 'left' : 'right';
    return prev || 'down';
}

function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

const MAP_MAKERS = [];                          /* functions that build each map (areas push theirs) */
const START = { map: 'island', x: 50, y: 70 };  /* where a new game begins */
