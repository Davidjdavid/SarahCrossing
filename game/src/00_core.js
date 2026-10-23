/* ---- 00_core.js ---- */
/* Sarah Crossing - core helpers */
'use strict';
const TILE = 16;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const DEBUG = !!window.__DEBUG;

function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
}
function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const R = mulberry(Date.now() & 0xffffffff);     // unseeded randomness for fx
function rpick(arr, r) { return arr[Math.floor((r || R)() * arr.length)]; }
function rint(a, b, r) { return a + Math.floor((r || R)() * (b - a + 1)); }
function shuffled(arr, r) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((r || R)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function weighted(list, r) {    // [[item, weight], ...]
    let tot = 0;
    for (const [, w] of list) tot += w;
    let x = (r || R)() * tot;
    for (const [it, w] of list) { x -= w; if (x <= 0) return it; }
    return list[list.length - 1][0];
}
function fmtNum(n) { return Math.floor(n).toLocaleString('en-US'); }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }
function aOrAn(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }

/* frame-based waiting for scripted scenes */
const Waiters = [];
function waitFrames(n) { return new Promise(res => Waiters.push({ n, res })); }
function tickWaiters() {
    for (let i = Waiters.length - 1; i >= 0; i--) {
        if (--Waiters[i].n <= 0) { const w = Waiters[i]; Waiters.splice(i, 1); w.res(); }
    }
}

const Bus = {
    h: {},
    on(ev, fn) { (this.h[ev] || (this.h[ev] = [])).push(fn); },
    emit(ev, a, b) { (this.h[ev] || []).forEach(fn => { try { fn(a, b); } catch (e) { console.error(e); } }); },
};

