'use strict';
/* shared constants and helpers. everything is one script, joined in file-name order */
const TS = 16, MW = 16, MH = 11, VW = 256, VH = 192, TOP = 16;
const INF = 10; /* the digit infinity */
const DIR = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };
const clone = o => JSON.parse(JSON.stringify(o));
/* a row of digits as a number (any infinity makes it infinite) */
const dval = ds => ds.some(x => x === INF) ? Infinity : ds.reduce((a, x) => a * 10 + x, 0);
/* a number as n digits, clamped to what n digits can hold */
function vdig(v, n) {
    if (v === Infinity) return Array(n).fill(INF);
    v = Math.max(0, Math.min(Math.floor(v), 10 ** n - 1));
    const out = [];
    for (let i = 0; i < n; i++) { out.unshift(v % 10); v = Math.floor(v / 10); }
    return out;
}
const dstr = ds => ds.map(x => x === INF ? '∞' : String(x)).join('');
/* a tiny seeded random, for decorations that must look the same every visit */
function hash2(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
