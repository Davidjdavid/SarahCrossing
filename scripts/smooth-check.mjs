// How smooth is moving round the island in the new look? Drives the game loop a frame at a time with a screen's real
// timings (60 Hz with its little wobble, 120, 144, 90, a slow frame now and then; computer and phone), holding the arrow
// keys on a flat clear straight line, and measures on every picture how evenly the view moves, how much Sarah moves
// about on screen and how hard the view lurches setting off and stopping. Drawing itself is skipped (software 3D is too
// slow to time); only where things are is measured.
//   DIST_DIR=/tmp/d node scripts/build.mjs && STATIC_DIR=/tmp/d node scripts/smooth-check.mjs /tmp/smooth
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);
const OUT = process.argv[2] || 'smooth-out'; fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
const { startServer } = await import(path.join(ROOT, 'tests/helpers.mjs'));
const srv = await startServer({ password: '', env: { WORLD_FAKE: '1', STATIC_DIR: process.env.STATIC_DIR } });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
await ctx.addInitScript(() => { window.__DEBUG = true; window.__noAsk = true; for (const k of ['sc-env-island', 'sc-civic', 'sc-style2']) localStorage.setItem(k, '1'); localStorage.setItem('sc-who', 'sarah'); });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
await page.goto(srv.url + '/', { timeout: 900000, waitUntil: 'commit' });
await page.waitForSelector('#title:not([hidden]) #tbtns button', { timeout: 900000 });
await page.evaluate(() => __dbg.quickStart());
await page.waitForFunction(() => G.mode === 'play', null, { timeout: 600000 });
await page.waitForFunction(() => typeof Env !== 'undefined' && Env.on && EnvDolls.dolls && EnvDolls.dolls.get(G.player), null, { timeout: 900000 });
log('in');
await page.evaluate(() => {
    __dbg.setTime(11, 1, 13);
    // the frame clock is ours from here on; drawing the picture itself is skipped (only where things are matters)
    window.__raf = null;
    window.requestAnimationFrame = (cb) => { window.__raf = cb; return 1; };
    const r = R3.renderer || R3.gl;
    if (r && r.render) r.render = () => {};
    if (typeof R3.composer !== 'undefined' && R3.composer && R3.composer.render) R3.composer.render = () => {};
    window.__drive = (dts, phone) => {
        R3.phone = !!phone;
        const out = [], cam = R3.camera, V = new THREE.Vector3();
        let renders = R3.__n || 0;
        if (!R3.__wrapped) { const f = R3.render.bind(R3); R3.render = function () { R3.__n = (R3.__n || 0) + 1; return f(); }; R3.__wrapped = true; }
        let t = lastT;
        for (const dt of dts) {
            t += dt;
            while (!window.__raf) { /* the loop registers itself again each frame */ break; }
            const cb = window.__raf; window.__raf = null;
            if (cb) cb(t);
            const drew = (R3.__n || 0) !== renders; renders = R3.__n || 0;
            const d = EnvDolls.dolls.get(G.player);
            d.root.getWorldPosition(V);
            const wx = V.x, wz = V.z;
            V.project(cam);
            out.push({ dt, drew, cx: cam.position.x, cz: cam.position.z, sx: V.x * 320, sy: -V.y * 200, wx, wz, px: G.player.x, py: G.player.y });
        }
        return out;
    };
});
async function scenario(name, key, dts, phone, run, nominal) {
    const at = await page.evaluate(([run, key, len]) => {
        S.settings = S.settings || {}; S.settings.run = run;
        // (a flat, clear straight line on the island as long as the run: no cliffs, water or doors on the way)
        if (!window.__nodoor) { window.__nodoor = true; afterMove = () => {}; }
        const a = G.areas.island, [dx, dy] = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
        for (let y = 8; y < a.h - 8; y++) for (let x = 8; x < a.w - 8; x++) {
            const h = W0.height[y][x];
            let ok = true;
            for (let i = -2; i <= len + 2 && ok; i++) for (let w = -1; w <= 1 && ok; w++) {
                const tx = x + dx * i + (dy ? w : 0), ty = y + dy * i + (dx ? w : 0);
                if (tx < 1 || ty < 1 || tx >= a.w - 1 || ty >= a.h - 1 || a.blockedAt(tx, ty) || W0.height[ty][tx] !== h) ok = false;
            }
            if (ok) { __dbg.teleport('island', x, y); return [x, y]; }
        }
        return null;
    }, [run, key, Math.ceil((run ? 8.2 : 5.3) * dts.reduce((a, b) => a + b, 0) / 1000) + 2]);
    if (!at) return { name, error: 'no flat line long enough' };
    // settle: the teleport done, the camera put straight there, a second standing still
    await page.evaluate(() => __drive(new Array(30).fill(1000 / 60), false));
    await page.evaluate(() => { R3.placeCamera(true); __drive(new Array(60).fill(1000 / 60), false); });
    await page.keyboard.down(key);
    const rec = await page.evaluate(([dts, phone]) => __drive(dts, phone), [dts, phone]);
    await page.keyboard.up(key);
    const stop = await page.evaluate(([phone]) => __drive(new Array(60).fill(1000 / 60), phone), [phone]);
    fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ rec, stop }));
    return Object.assign(stats(name, rec, nominal), lurch(rec.slice(0, 45), 'start', nominal), lurch(stop, 'stop'));
}
/* how hard the view lurches setting off (or stopping): its peak acceleration, and the biggest jump in acceleration from one
   picture to the next (tiles a second, squared and cubed) */
function lurch(r, tag = 'start', nominal = 1000 / 60) {
    const v = [], a = [];
    let last = r[0], held = 0;
    for (let i = 1; i < r.length; i++) {
        held += Math.max(1, Math.round(r[i].dt / nominal)) * nominal;
        if (r[i].drew === false) continue;
        v.push([Math.hypot(r[i].cx - last.cx, r[i].cz - last.cz) / (held / 1000), held / 1000]);
        last = r[i]; held = 0;
    }
    for (let i = 1; i < v.length; i++) a.push((v[i][0] - v[i - 1][0]) / v[i][1]);
    let jerk = 0;
    for (let i = 1; i < a.length; i++) jerk = Math.max(jerk, Math.abs(a[i] - a[i - 1]) / v[i][1]);
    return { [tag + 'Accel']: +Math.max(0, ...a.map(Math.abs)).toFixed(0), [tag + 'Jerk']: +jerk.toFixed(0) };
}
function stats(name, rec, nominal) {
    // steady part (after the camera has caught up): the second half
    const r = rec.slice(Math.floor(rec.length / 2));
    // the view's speed each refresh (tiles a second), against the median: how uneven the scroll is
    const v = [];
    // (a screen shows each picture at its refresh, however late the callback ran: the time between pictures is a whole
    // number of refreshes; a refresh with nothing new drawn shows the last picture again, and the next picture's move
    // covers both)
    let last = r[0], held = 0, skipped = 0;
    for (let i = 1; i < r.length; i++) {
        held += Math.max(1, Math.round(r[i].dt / nominal)) * nominal;
        if (!r[i].drew) { skipped++; continue; }
        v.push(Math.hypot(r[i].cx - last.cx, r[i].cz - last.cz) / (held / 1000));
        last = r[i]; held = 0;
    }
    const med = v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)] || 1;
    const dev = v.map((x) => Math.abs(x / med - 1));
    const rms = Math.sqrt(dev.reduce((a, b) => a + b * b, 0) / dev.length);
    const bad = dev.filter((x) => x > 0.3).length, still = skipped;
    // Sarah on screen: how much she wobbles about her place each refresh (pixels of a 640x400 screen)
    const sy = r.map((x) => x.sy), sx = r.map((x) => x.sx);
    const jit = (a) => { let s = 0; for (let i = 1; i < a.length - 1; i++) s += Math.abs(a[i + 1] - 2 * a[i] + a[i - 1]); return s / (a.length - 2); };
    const drift = (a) => Math.max(...a) - Math.min(...a);
    // where she stands on screen across the whole run (the lead's slide)
    const all = rec.map((x) => x.sy);
    return { name, frames: rec.length, viewSpeed: +med.toFixed(2), unevenPct: +(rms * 100).toFixed(1), badFrames: bad, notDrawn: still,
        sarahJitterPx: +((jit(sy) + jit(sx)) / 2).toFixed(2), sarahDriftPx: +Math.max(drift(sy), drift(sx)).toFixed(1), sarahScreenY: [+Math.min(...all).toFixed(0), +Math.max(...all).toFixed(0)] };
}
const N = 200, rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const hz60 = () => Array.from({ length: N }, () => 1000 / 60 + (rnd() - 0.5) * 2.4);
const hz120 = () => Array.from({ length: N }, () => 1000 / 120 + (rnd() - 0.5) * 1.2);
const hz144 = () => Array.from({ length: N }, () => 1000 / 144 + (rnd() - 0.5) * 1.0);
const slow = () => Array.from({ length: N }, (_, i) => i % 50 === 25 ? 45 : 1000 / 60 + (rnd() - 0.5) * 2.4);
const res = [];
res.push(await scenario('pc60-run-down', 'ArrowDown', hz60(), false, true, 1000 / 60));
res.push(await scenario('pc60-walk-right', 'ArrowRight', hz60(), false, false, 1000 / 60));
res.push(await scenario('pc120-run-down', 'ArrowDown', hz120(), false, true, 1000 / 120));
res.push(await scenario('pc144-walk-left', 'ArrowLeft', hz144(), false, false, 1000 / 144));
res.push(await scenario('pc60-slowframes-run-right', 'ArrowRight', slow(), false, true, 1000 / 60));
res.push(await scenario('phone60-run-down', 'ArrowDown', hz60(), true, true, 1000 / 60));
res.push(await scenario('phone60-walk-left', 'ArrowLeft', hz60(), true, false, 1000 / 60));
res.push(await scenario('phone120-run-up', 'ArrowUp', hz120(), true, true, 1000 / 120));
const hz90 = () => Array.from({ length: N }, () => 1000 / 90 + (rnd() - 0.5) * 1.0);
res.push(await scenario('phone90-walk-right', 'ArrowRight', hz90(), true, false, 1000 / 90));
console.table(res);
fs.writeFileSync(`${OUT}/summary.json`, JSON.stringify(res, null, 1));
log('problems', JSON.stringify(problems.slice(0, 5)));
await browser.close(); process.exit(0);
