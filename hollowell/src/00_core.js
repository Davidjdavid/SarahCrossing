'use strict';
/* Hollowell. One script, joined from src/*.js in file-name order. Everything is global: a top-level
   const in one file is used by others. The simulation never touches the page, so the same code runs
   headless in the tests (HEADLESS: no document). */

const HEADLESS = typeof document === 'undefined';
const VERSION = '__VERSION__';
const W = 320, H = 180, T = 16;          /* the screen in pixels, the tile size */
const FPS = 60;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const approach = (v, to, d) => v < to ? Math.min(v + d, to) : Math.max(v - d, to);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const tileOf = px => Math.floor(px / T);
const key2 = (x, y) => x + ',' + y;

/* directions: 0 down, 1 left, 2 right, 3 up (the order sprite sheets use) */
const DOWN = 0, LEFT = 1, RIGHT = 2, UP = 3;
const DX = [0, -1, 1, 0], DY = [1, 0, 0, -1];
const DIR_NAME = ['down', 'left', 'right', 'up'];
const OPP = [UP, RIGHT, LEFT, DOWN];
function dirOf(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? LEFT : dx > 0 ? RIGHT : (dy < 0 ? UP : DOWN);
    return dy < 0 ? UP : DOWN;
}
function dirByName(n) { const i = DIR_NAME.indexOf(n); return i < 0 ? DOWN : i; }

/* a small seeded random: the game's own (G.rng) is reseeded per new game so scripted play replays exactly */
function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
/* a stable hash for decoration: the same tile always gets the same flower */
function hash2(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* G holds the running game: the map, the player, the scene, the frame count */
const G = {
    t: 0,                /* frames since the page started */
    rng: mulberry(1),
    map: null,           /* the current Area */
    player: null,
    scene: null,         /* 'title' | 'play' ... (see 90_main.js) */
    paused: false,
    shake: 0,
    hitstop: 0,
    debug: false,
};

const LOG = [];
function log(...a) { LOG.push(a.join(' ')); if (LOG.length > 200) LOG.shift(); if (G.debug && !HEADLESS) console.log(...a); }

/* every thrown error in a frame is kept so the browser tests can fail on it */
const ERRORS = [];
function reportError(e) {
    ERRORS.push(String(e && e.stack || e));
    if (!HEADLESS) console.error(e);
}

/* content files push their set-up functions here; boot runs them once the art helpers exist */
const CONTENT_INIT = [];
