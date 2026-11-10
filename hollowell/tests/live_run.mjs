// The live run (POLISH.md): the whole scripted game in real Chromium, every step drawn on the real canvas and probed
// (src/26_probe.js), with a picture saved at every room entered, every line of dialogue (once it's all shown), every
// notice and banner, and every 30 seconds. Usage: node tests/live_run.mjs OUTDIR [--legs 1-9]
// Writes OUTDIR/NNNN.png (the game's own 320x180 picture), OUTDIR/index.json, OUTDIR/probe.json.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadGame } from './harness.mjs';
import * as LEGS from './legs.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.resolve(process.argv[2] || 'live_out');
const legArg = (process.argv.find(a => /^\d+-\d+$/.test(a)) || '1-9').split('-').map(Number);
fs.mkdirSync(OUT, { recursive: true });

/* where each leg after the first starts (as the leg before left Wren), worked out here and handed to the page */
const CHAIN = {};
for (const name of ['afterD1', 'afterD2', 'afterD3', 'afterD4', 'afterD5', 'afterD6', 'afterD7', 'afterMakings', 'afterReveal2', 'afterD8', 'afterDrift']) {
    try { const H = loadGame(); H.preset(name); CHAIN[name] = { id: H.G.map.id, tx: H.player().tx, ty: H.player().ty }; } catch { }
}
const legSrc = fs.readFileSync(path.join(ROOT, 'tests', 'legs.mjs'), 'utf8')
    .replace(/^import .*$/mg, '').replace(/^export /mg, '');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(ROOT, 'play.html') + '?debug&notitle');
await page.waitForFunction(() => window.HW && window.HW.G);
await page.evaluate(({ legSrc, CHAIN }) => {
    HW._paused = true;
    try { localStorage.clear(); } catch { }
    /* the legs' assertions, in the page */
    const fail = m => { throw new Error(m || 'assertion failed'); };
    window.assert = {
        ok: (c, m) => { if (!c) fail(m); }, equal: (a, b, m) => { if (a !== b) fail((m || '') + ` (${a} !== ${b})`); },
        notEqual: (a, b, m) => { if (a === b) fail(m); }, deepEqual: (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail((m || '') + ` (${JSON.stringify(a)} vs ${JSON.stringify(b)})`); },
        notDeepEqual: (a, b, m) => { if (JSON.stringify(a) === JSON.stringify(b)) fail(m); }, match: (s, re, m) => { if (!re.test(s)) fail((m || '') + ' ' + s); },
    };
    (0, eval)(legSrc + '\nwindow.LEGS = [LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9];');
    window.chainTo = name => { const c = CHAIN[name]; HW.warp(c.id, c.tx, c.ty); HW.step(5); HW.skipTalk(); };
    /* pictures: what changed on screen worth a look */
    const Game = HW.global('Game'), Gfx = HW.global('Gfx'), Dialog = HW.global('Dialog'), UI = HW.global('UI'), Cam = HW.global('Cam');
    window.SNAPS = []; let n = 0, lastRoom = '', roomT = 0, lastDlg = '', lastToast = '', lastBanner = '', lastT = 0;
    const P = HW.probe(true);
    const where = () => { const a = HW.G.map, p = HW.G.player, r = a && p ? a.roomAt(p.tx, p.ty) : null; return { area: a ? a.id : HW.G.scene, room: r && r.name || '', x: p ? p.tx : 0, y: p ? p.ty : 0 }; };
    const snap = (why, text) => { window.SNAPS.push({ n: n++, frame: HW.G.t, why, text: text || '', ...where(), png: Gfx.canvas.toDataURL('image/png') }); };
    if (!Game._step0) Game._step0 = Game.step;
    Game.step = function () {
        Game._step0.call(Game);
        const t0 = performance.now(); Game.render(); P.frame(performance.now() - t0);
        const w = where(), rk = w.area + '|' + w.room;
        if (rk !== lastRoom) { lastRoom = rk; roomT = 24; }
        if (roomT > 0 && --roomT === 0) snap('room', w.room || w.area);
        if (Dialog.active && Dialog.shown >= Dialog.pageLen()) { const k = Dialog.page + '|' + (Dialog.pages[Dialog.page] || []).join(' '); if (k !== lastDlg) { lastDlg = k; snap('dialogue', (Dialog.pages[Dialog.page] || []).join(' ')); } }
        if (!Dialog.active) lastDlg = '';
        const ts = UI.toasts.map(t => t.s).join('|'); if (ts && ts !== lastToast && UI.toasts.some(t => t.t === 12)) { lastToast = ts; snap('notice', ts); }
        if (UI.banner && UI.banner.t === 40 && UI.banner.s !== lastBanner) { lastBanner = UI.banner.s; snap('banner', UI.banner.s); }
        if (HW.G.t - lastT >= 1800) { lastT = HW.G.t; snap('timer'); }
    };
}, { legSrc, CHAIN });

const index = [];
let saved = 0;
for (let i = legArg[0]; i <= legArg[1]; i++) {
    const t0 = Date.now();
    const res = await page.evaluate(i => {
        let err = null;
        try { window.LEGS[i - 1](HW, i > 1 ? window.chainTo : undefined); } catch (e) { err = String(e && e.message || e).split('\n')[0]; }
        const snaps = window.SNAPS; window.SNAPS = [];
        return { err, snaps, errors: HW.ERRORS.slice() };
    }, i);
    for (const s of res.snaps) {
        const file = String(saved).padStart(4, '0') + '.png';
        fs.writeFileSync(path.join(OUT, file), Buffer.from(s.png.split(',')[1], 'base64'));
        index.push({ file, leg: i, why: s.why, area: s.area, room: s.room, x: s.x, y: s.y, frame: s.frame, text: s.text.slice(0, 160) });
        saved++;
    }
    console.log(`leg ${i}: ${res.snaps.length} pictures${res.err ? ', STOPPED: ' + res.err : ''} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
}
const probe = await page.evaluate(() => { const r = HW.Probe.report(); r.errors = HW.ERRORS.slice(); return r; });
probe.pageErrors = errors;
fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(probe, null, 1));
console.log(`${saved} pictures; probe: ${probe.issues.length} kinds of issue; ${probe.errors.length} game errors; ${errors.length} page errors`);
for (const x of probe.issues) console.log(`[${x.kind}] x${x.n} ${x.key} -- ${x.where}`);
console.log('slowest frames (ms):', probe.slowest.slice(0, 8).map(s => s[0].toFixed(1) + ' ' + s[1]).join(' | '));
await browser.close();
