// Opens play.html in Chromium, plays a little, fails on any error, and (with --shots) saves screenshots
// into tests/shots/ for looking at. Extra scenarios can be passed as names: node tests/browser.mjs --shots lab
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'tests', 'shots');
const args = process.argv.slice(2);
const wantShots = args.includes('--shots');
const only = args.filter(a => !a.startsWith('--'));
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

async function open(q = '?debug') {
    await page.goto('file://' + path.join(ROOT, 'play.html') + q);
    await page.waitForFunction(() => window.HW && window.HW.G);
    await page.evaluate(() => { window.HW._paused = true; });
}
async function shot(name) {
    if (!wantShots) return;
    await page.evaluate(() => window.HW.step(1));
    await page.waitForTimeout(60);
    await page.locator('canvas').screenshot({ path: path.join(SHOTS, name + '.png') });
    if (process.env.SHOT_ERRS) console.log(name, errors.length);
}
/* the sound, rendered for real (run in the page): every tune and effect played by the game's own synth into an
   OfflineAudioContext (its unlock() builds the buses there; the frames run as Game.step runs them, Music.tick every
   1/60 s, the notes made just in time) and measured. Loudness is BS.1770 (K-weighted, LUFS, one channel): a tune's
   integrated over a pass, an effect's over its loudest 100 ms; peaks are true peaks (4x oversampled). Every gain the
   synth moves is written down too: none may jump while a sound runs through it (a jump is a click) */
async function audioCheck() {
    const SR = 48000, out = [], VALUE = Object.getOwnPropertyDescriptor(AudioParam.prototype, 'value');
    const DEF = { music: 0.6, sfx: 0.8 }, MAX = { music: 1, sfx: 1 }, REF = -28;
    const QUIET = ['lullaby', 'unfinished', 'loom', 'slumber', 'hush', 'tidy'];
    const db = x => 20 * Math.log10(Math.max(x, 1e-12)), lufs = ms => -0.691 + 10 * Math.log10(Math.max(ms, 1e-20));
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    function begin(seconds, vol) {
        const off = new OfflineAudioContext(1, Math.ceil(seconds * SR), SR), R = { off, now: 0, gains: [], later: [] };
        const ctx = new Proxy(off, { get(t, k) {
            if (k === 'currentTime') return R.now;
            if (k === 'state') return 'running';
            if (k === 'createGain') return () => {
                const g = off.createGain(), p = g.gain, ev = [], c = g.connect.bind(g), r = { g, ev };
                for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime']) { const f = p[m].bind(p); p[m] = (...a) => { ev.push([m, ...a]); return f(...a); }; }
                Object.defineProperty(p, 'value', { get: () => VALUE.get.call(p), set: v => { ev.push(['value', v]); VALUE.set.call(p, v); } });
                g.connect = (d, ...x) => { r.to = d; return c(d, ...x); };
                R.gains.push(r); return g;
            };
            const v = Reflect.get(t, k); return typeof v === 'function' ? v.bind(t) : v;
        } });
        const AC = window.AudioContext, rand = Math.random, st = window.setTimeout;
        window.AudioContext = function () { return ctx; }; Math.random = rnd; window.setTimeout = f => { R.later.push(f); return 0; };
        R.undo = () => { Math.random = rand; window.setTimeout = st; };
        Audio.ctx = null; Audio.ok = false; Audio.muted = false;
        try { Audio.unlock(); } finally { window.AudioContext = AC; }
        Audio.vol.music = vol.music; Audio.vol.sfx = vol.sfx; Audio.setVolumes(true);
        Object.assign(Music, { playing: null, cur: null, bus: null, step: 0, calm: 0, thin: false, waking: false, where: Cam.room });
        R.thin = Music.THIN_AFTER; Music.THIN_AFTER = 1e9; Sfx.last = {};
        return R;
    }
    async function render(R, until, events = []) {
        const run = t => { while (R.now < t) { for (const e of events) if (!e.done && e.t <= R.now) { e.done = true; e.fn(); } if (R.now < until) Music.tick(); R.now += 1 / 60; } };
        const step = 128 * 40 / SR, total = R.off.length / SR;
        run(step);
        for (let k = 1; (k + 1) * step < total; k++) { const t = k * step; R.off.suspend(t).then(() => { run(t + step); R.off.resume(); }); }
        const buf = await R.off.startRendering();
        R.undo(); for (const f of R.later) f();
        Music.cur = null; Music.playing = null; Music.bus = null; Music.THIN_AFTER = R.thin; Audio.ok = false; Audio.ctx = null;
        /* a click: a note's gain set from one value straight to another while it sounds */
        for (const r of R.gains) {
            if (!(r.to === Audio.sfx || (r.to && R.gains.some(q => q.g === r.to && q.to === Audio.music)))) continue;
            let v = 1, sounding = false;
            for (const [m, x] of r.ev) { if (m === 'setValueAtTime' && Math.abs(x - v) > 1e-9 && (sounding || v > 1e-9)) R.click = true; if (m !== 'value') sounding = true; v = x; }
        }
        return buf.getChannelData(0);
    }
    const OS = [1, 2, 3].map(p => { const h = []; let s = 0; for (let k = 0; k < 32; k++) { const x = k - 15 - p / 4, w = 0.42 - 0.5 * Math.cos(2 * Math.PI * (k + p / 4) / 32) + 0.08 * Math.cos(4 * Math.PI * (k + p / 4) / 32); h.push(x ? Math.sin(Math.PI * x * 0.98) / (Math.PI * x * 0.98) * w : w); s += h[k]; } return h.map(v => v / s); });
    function peak(x, a = 0, b = x.length) {
        let sp = 0, at = a; for (let i = a; i < b; i++) if (Math.abs(x[i]) > sp) { sp = Math.abs(x[i]); at = i; }
        let tp = sp;
        for (let i = Math.max(a, 15); i < Math.min(b, x.length - 17); i++) {
            if (Math.abs(x[i]) < sp * 0.7) continue;
            for (const h of OS) { let s = 0; for (let k = 0; k < 32; k++) s += h[k] * x[i - 15 + k]; if (Math.abs(s) > tp) { tp = Math.abs(s); at = i; } }
        }
        return { tp: db(tp), at: at / SR };
    }
    function kw(x) {
        const y = new Float32Array(x.length); let s = x;
        for (const [b0, b1, b2, a1, a2] of [[1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585], [1, -2, 1, -1.99004745483398, 0.99007225036621]]) {
            let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
            for (let i = 0; i < s.length; i++) { const v = s[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; }
            s = y;
        }
        return y;
    }
    function integrated(x) {
        const k = kw(x), hop = SR / 10, n = Math.floor(k.length / hop), c = [];
        for (let i = 0; i < n; i++) { let s = 0; for (let j = i * hop; j < (i + 1) * hop; j++) s += k[j] * k[j]; c.push(s); }
        const m = []; for (let i = 3; i < n; i++) m.push((c[i] + c[i - 1] + c[i - 2] + c[i - 3]) / (4 * hop));
        const a = m.filter(v => lufs(v) > -70), mean = l => l.reduce((p, q) => p + q, 0) / l.length, rel = lufs(mean(a)) - 10;
        return lufs(mean(a.filter(v => lufs(v) > rel)));
    }
    function loudest100(x) {
        const k = kw(x), w = SR / 10, h = SR / 100; let best = 0;
        for (let i = 0; i + w <= k.length; i += h) { let s = 0; for (let j = i; j < i + w; j++) s += k[j] * k[j]; best = Math.max(best, s / w); }
        return lufs(best);
    }
    const UP_M = db(1 / DEF.music), UP_S = db(1 / DEF.sfx), song = {};
    let clicks = 0;
    /* every tune, a pass of it at the default volumes (below the limiter's knee everything is in proportion, so its
       peak with the volume at the top is its peak now, times the volume's step up) */
    for (const id of Object.keys(SONGS)) {
        if (id === 'silence') continue;
        const s = SONGS[id]; s._parsed = false; parseSong(s);
        const loop = s.len * 60 / s.bpm / (s.div || 4), R = begin(loop + 0.6, DEF);
        Music.play(id);
        const x = await render(R, loop + 0.12 - 0.16);
        if (R.click) clicks++, out.push(`${id}: a click (a gain jumps while a note sounds)`);
        const p = peak(x), I = integrated(x.subarray(Math.round(0.12 * SR), Math.round((loop + 0.12) * SR)));
        song[id] = { I, tp: p.tp, at: p.at, max: p.tp + UP_M };
        const quiet = QUIET.includes(id), lo = quiet ? REF - 4 : REF - 1.5, hi = quiet ? REF - 1 : REF + 1.5;
        if (!(I >= lo && I <= hi)) out.push(`${id}: ${I.toFixed(1)} LUFS (it should be ${lo} to ${hi})`);
        if (p.tp + UP_M > -4) out.push(`${id}: peaks at ${(p.tp + UP_M).toFixed(1)} dBTP with the music at the top`);
    }
    const level = Object.entries(song).filter(([id]) => !QUIET.includes(id)).map(([, v]) => v.I);
    if (Math.max(...level) - Math.min(...level) > 3) out.push(`the tunes span ${(Math.max(...level) - Math.min(...level)).toFixed(1)} dB (more than 3)`);
    /* every effect: heard over the music (its loudest 100 ms no more than 15 dB under a tune), never shouting (5 over at
       most, its peak 6 dB under full scale with the sound at the top) */
    for (const name of Object.keys(SFX)) {
        const R = begin(2.6, DEF); R.now = 0.05; Sfx.play(name);
        const x = await render(R, 0);
        if (R.click) clicks++, out.push(`effect ${name}: a click`);
        const F = loudest100(x), p = peak(x);
        if (!(F >= REF - 15 && F <= REF + 5)) out.push(`effect ${name}: ${F.toFixed(1)} LUFS at its loudest (the tunes are at ${REF})`);
        if (p.tp + UP_S > -6) out.push(`effect ${name}: peaks at ${(p.tp + UP_S).toFixed(1)} dBTP with the sound at the top`);
    }
    /* the worst moments, at the top volumes and at the defaults: a pile-up of effects on a fight's loudest moment and on
       the loudest tune's; a crossfade between the two loudest; the end of the Pull with its effects */
    const by = f => Object.keys(song).filter(f).sort((a, b) => song[b].tp - song[a].tp)[0];
    const loudest = by(() => true), next = by(id => id !== loudest && id.startsWith('boss'));
    async function scene(id, t, vol, fx, then) {
        const R = begin(t + 3.4, vol), ev = fx.map(n => ({ t, fn: () => { Sfx.last = {}; Sfx.play(n); } }));
        if (then) ev.push({ t, fn: () => Music.play(then) });
        Music.play(id);
        const x = await render(R, t + 3 - 0.16, ev);
        if (R.click) clicks++, out.push(`${id} with ${fx.join(' ') || then}: a click`);
        return peak(x, Math.round((t - 2) * SR), Math.round((t + 3) * SR)).tp;
    }
    const PILE = ['hitthing', 'enemyhit', 'boss', 'bell', 'item', 'rumble', 'heart', 'hookhit'], FOUR = ['hitthing', 'bell', 'boss', 'heart'];
    const checks = [];
    /* every fight's busiest moment on its own loudest: under the limiter's knee at the defaults (it never works in
       play), and even eight effects at once with everything at the top never reach full scale */
    for (const id of Object.keys(song).filter(id => id.startsWith('boss'))) {
        checks.push([`${id}, a hit, a ring, the boss's attack and a pickup at once, at the default volumes`, await scene(id, song[id].at, DEF, FOUR), -5.5]);
        checks.push([`${id} and eight effects at once, everything at the top`, await scene(id, song[id].at, MAX, PILE), -0.5]);
    }
    checks.push(
        [`${loudest} and eight effects at once, everything at the top`, await scene(loudest, song[loudest].at, MAX, PILE), -0.5],
        [`${loudest} crossfading into ${next}, at the top`, await scene(loudest, song[loudest].at, MAX, [], next), Math.max(song[loudest].max, song[next].max) + 0.5],
        ['the Pull and six effects at once, at the top', await scene('pull', song.pull.at, MAX, ['rumble', 'snip', 'knot', 'twang', 'unclick', 'shatter']), -0.5]);
    for (const [what, tp, lim] of checks) if (tp > lim) out.push(`${what}: peaks at ${tp.toFixed(2)} dBTP (over ${lim.toFixed(1)})`);
    return out;
}
const SCENARIOS = {
    async kiln() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 22, y: 95, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('kr_kilndoor');
        await page.evaluate(() => { HW.warp('hollow', 46, 112); HW.step(30); });
        await shot('kr_camp');
        await page.evaluate(() => { HW.warp('hollow', 58, 103); HW.step(30); });
        await shot('kr_canyon');
        await page.evaluate(() => { HW.warp('hollow', 50, 90); HW.step(30); });
        await shot('kr_hawk');
        const rooms = { entrance: [29, 41], hall: [29, 31], sms: [41, 27], doubling: [17, 27], glazer: [56, 20], gallery: [62, 16], bridge: [69, 24], furnace: [29, 20], racks: [17, 17], boss: [38, 5] };
        await page.evaluate(() => { HW.newGame('Wren', { area: 'kiln', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(20); });
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('kiln', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('kiln_' + n);
        }
    },
    async meadow() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 64 + 31, y: 80 + 3, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('meadow_north');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 80 + 14); HW.step(30); });
        await shot('meadow_tidyhouse');
        await page.evaluate(() => { HW.warp('hollow', 64 + 14, 80 + 24); HW.step(30); });
        await shot('meadow_pen');
        await page.evaluate(() => { HW.warp('hollow', 64 + 8, 80 + 23); HW.step(30); });
        await shot('meadow_canyon');
        await page.evaluate(() => { HW.warp('hollow', 64 + 45, 80 + 27); HW.step(30); });
        await shot('meadow_bridge');
    },
    async tidy() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'tidy', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(30); });
        await shot('tidy_foyer');
        const rooms = { kitchen: [10, 38], gallery: [50, 38], hall: [29, 30], pantry: [10, 27], parlor: [50, 27], cons: [70, 27], linen: [56, 20], laundry: [70, 16], ball: [26, 18], library: [10, 16], attic: [9, 8], ante: [49, 9], boss: [38, 5] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('tidy', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('tidy_' + n);
        }
        /* the conservatory with one plate on */
        await page.evaluate(() => { HW.warp('tidy', 60 + 6, 22 + 3); HW.step(4); HW.walkTo(60 + 8, 22 + 3); HW.step(30); });
        await shot('tidy_cons_on');
    },
    async town() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { noAutosave: true }); HW.step(200); });
        await shot('prologue_room');
        await page.evaluate(() => { HW.skipTalk(); HW.step(30); });
        await shot('room_awake');
        await page.evaluate(() => { HW.warp('gran_house', 6, 6); HW.step(10); });
        await shot('gran_house');
        await page.evaluate(() => { HW.Progress.set('talkedGran'); HW.warp('hollow', 64 + 12, 40 + 11, 'down'); HW.step(120); });
        await shot('ceremony');
        await page.evaluate(() => { HW.skipTalk(); HW.step(60); });
        await shot('town_square');
        await page.evaluate(() => { HW.warp('hollow', 64 + 12, 40 + 13, 'down'); HW.step(30); });
        await shot('town_gran');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 40 + 15, 'down'); HW.step(30); });
        await shot('town_inn');
        await page.evaluate(() => { HW.warp('hollow', 64 + 20, 40 + 32, 'down'); HW.step(30); });
        await shot('town_south');
        await page.evaluate(() => { HW.warp('inn', 7, 7); HW.step(10); });
        await shot('inn_inside');
    },
    async extras() {
        await open();
        await page.evaluate(() => { HW.preset('afterD1'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 64 + 36, 40 + 21); HW.step(230); });
        await shot('kids_game');
        await page.evaluate(() => { HW.walkTo(64 + 36, 40 + 17); HW.push('left', 1); HW.walkTo(64 + 35, 40 + 19); HW.step(20); });
        await shot('kids_tsk');
        await page.evaluate(() => { for (let i = 0; i < 12; i++) { HW.step(30); HW.skipTalk(); } });
        await page.evaluate(() => { HW.warp('inn', 7, 6); HW.step(30); });
        await shot('inn_stairs');
        for (const [n, x, y] of [['attic1', 3, 8], ['attic2', 21, 9], ['attic3', 43, 7]]) {
            await page.evaluate(([x, y]) => { HW.Progress.set('trial1'); HW.Progress.set('trial2'); HW.warp('inn_attic', x, y); HW.step(40); }, [x, y]);
            await shot(n);
        }
        await page.evaluate(() => { HW.Progress.set('trial1', false); HW.warp('inn_attic', 3, 7); HW.step(5); HW.walkTo(3, 8); HW.step(60); });
        await shot('attic1_clock');
    },
    async water() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab3', x: 15, y: 3, noAutosave: true }); HW.step(5); HW.walkTo(1, 5); HW.step(60); });
        await shot('water_lab');
        await page.evaluate(() => { HW.hold('right'); HW.step(12); HW.release(); HW.step(200); });
        await shot('water_ride');
    },
    async mill() {
        await open();
        await page.evaluate(() => { HW.preset('afterD2'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 128 + 8, 80 + 26); HW.step(230); });
        await shot('mw_west');
        for (const [n, x, y] of [['mw_mill', 128 + 29, 80 + 23], ['mw_ferry', 128 + 37, 80 + 27], ['mw_millrace', 128 + 47, 80 + 27], ['mw_falls', 128 + 36, 80 + 33], ['mw_isle', 128 + 13, 80 + 4]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { wheel: [29, 41], ferry: [17, 38], backwash: [41, 38], carousel: [29, 30], shard: [17, 27], snap: [41, 27], upstream: [29, 20], overflow: [17, 16], twowheels: [41, 16], workshop: [4, 8], pond: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('millrace', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('mr_' + n);
        }
    },
    async belfry() {
        await open();
        await page.evaluate(() => { HW.preset('afterD3'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 128 + 39, 80 + 3); HW.step(230); });
        await shot('ht_northshore');
        for (const [n, x, y] of [['ht_t1', 128 + 14, 33], ['ht_bluster', 128 + 30, 22], ['ht_chasm', 128 + 44, 13], ['ht_belfry', 128 + 31, 9]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { porch: [29, 52], draught: [17, 49], windward: [41, 49], stair: [29, 41], weather: [17, 38], rafters: [41, 38], loft: [29, 30], reach: [17, 27], echo: [41, 27], ropes: [29, 19], workshop: [17, 16], bell: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('belfry', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('bf_' + n);
        }
    },
    async hushwood() {
        await open();
        await page.evaluate(() => { HW.preset('afterD4'); HW.step(5); HW.skipTalk(); HW.Progress.set('festival'); HW.warp('hollow', 125, 60); HW.step(60); HW.skipTalk(); });
        await shot('hw_giant');
        await page.evaluate(() => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120); HW.skipTalk(); HW.step(200); HW.skipTalk(); HW.step(30); });
        await shot('hw_road');
        for (const [n, x, y] of [['hw_house', 128 + 19, 40 + 10], ['hw_puffs', 128 + 8, 40 + 26], ['hw_camp', 128 + 6, 40 + 31], ['hw_pond', 128 + 25, 40 + 29], ['hw_bank', 128 + 34, 40 + 15], ['hw_bed', 128 + 6, 40 + 10]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
    },
    async marionette() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'marionette', x: 29, y: 42, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t); HW.step(10); });
        const rooms = { foyer: [29, 40], box: [44, 38], aud: [29, 31], pit: [10, 27], reh: [46, 27], wings: [29, 20], dress: [5, 18], props: [49, 20], shop: [50, 5], stage: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('marionette', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('mh_' + n);
        }
        await page.evaluate(() => { HW.walkTo(29, 8); HW.step(80); HW.skipTalk(); HW.step(40); HW.skipTalk(); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(30); });
        await shot('mh_boss');
    },
    async spoolkit() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab7', x: 2, y: 2, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar', 'needle']) HW.Inv.giveTool(t); HW.step(10); });
        await page.evaluate(() => { HW.walkTo(3, 3); HW.push('right', 1); HW.step(30); });
        await shot('sk_above');
        await page.evaluate(() => { HW.walkTo(2, 7); HW.face('down'); HW.press('act', 1); HW.step(40); HW.walkTo(6, 16); HW.step(5); });
        await shot('sk_below');
        await page.evaluate(() => { HW.walkTo(8, 13); HW.face('down'); HW.hold('act'); HW.step(20); HW.release(); HW.step(5); HW.walkTo(11, 19); HW.face('up'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); HW.hold('left'); HW.step(2); HW.release(); HW.step(8); HW.hold('up'); HW.step(2); HW.release(); HW.step(8); });
        await shot('sk_needle');
    },
    async underside() {
        await open();
        await page.evaluate(() => { HW.preset('afterD6'); HW.step(5); HW.skipTalk(); HW.warp('underside', 29, 19); HW.step(60); HW.skipTalk(); HW.step(5); });
        await shot('us_stairs');
        for (const [n, x, y] of [['us_guild', 29, 6], ['us_workshops', 9, 5], ['us_seamsW', 2, 16], ['us_seamsE', 44, 16]]) {
            await page.evaluate(([x, y]) => { HW.warp('underside', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot(n);
        }
    },
    async spoolworks() {
        await open();
        await page.evaluate(() => { HW.preset('afterD6'); HW.step(5); HW.skipTalk(); HW.Inv.giveTool('needle'); });
        const rooms = { gate: [29, 31], ugate: [29, 64], wind: [29, 20], uwind: [29, 53], store: [12, 20], ustore: [12, 53], kennel: [44, 16], ukennel: [49, 53], practice: [46, 28], upractice: [49, 61], rope: [15, 27], urope: [12, 61], loft: [9, 9], uloft: [9, 42], heart: [26, 7], uheart: [29, 42], bench: [49, 9], ubench: [49, 42] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('spoolworks', x, y); HW.step(40); HW.skipTalk(); HW.step(20); HW.skipTalk(); }, [x, y]);
            await shot('sw_' + n);
        }
    },
    async makings() {
        await open();
        await page.evaluate(() => { HW.preset('afterD7'); HW.step(5); HW.skipTalk(); HW.warp('underside', 49, 5); HW.step(40); HW.skipTalk(); });
        await shot('mk_floor');
        await page.evaluate(() => { HW.warp('making1', 3, 16); HW.step(10); HW.skipTalk(); HW.step(250); HW.walkTo(10, 18); HW.walkTo(11, 17); HW.walkTo(10, 17); HW.walkTo(8, 18); });
        await shot('mk_1a_sit');
        await page.evaluate(() => { HW.walkTo(10, 17); HW.face('up'); });
        await page.evaluate(() => { HW.press('act', 1); HW.step(40); });
        await shot('mk_1a_push');
        await page.evaluate(() => { HW.Progress.set('making1'); HW.warp('making2', 3, 16); HW.step(10); HW.skipTalk(); HW.step(120); HW.walkTo(9, 14); HW.face('up'); });
        await shot('mk_2a_nib');
        await page.evaluate(() => { HW.Progress.set('making2'); HW.warp('making3', 3, 16); HW.step(10); HW.skipTalk(); HW.step(300); HW.walkTo(24, 15); });
        await shot('mk_3b');
        await page.evaluate(() => { HW.Progress.set('making3'); HW.warp('making4', 3, 16); HW.step(10); HW.skipTalk(); HW.step(500); HW.walkTo(9, 14); HW.face('up'); });
        await shot('mk_4a_sulk');
        await page.evaluate(() => { HW.walkTo(11, 13); HW.face('up'); HW.press('act', 1); HW.step(600); HW.walkTo(30, 15); HW.face('up'); });
        await shot('mk_4b_plates');
        /* the second half: the Tidyhouse underneath; Otto the Housekeeper; both of them; the Grand Hall */
        for (const [n, x, y, name] of [[5, 46, 17, 'mk_5_foyer'], [6, 10, 17, 'mk_6_otto'], [7, 9, 17, 'mk_7_junction'], [8, 26, 17, 'mk_8_hall']]) {
            await page.evaluate(([n, x, y]) => {
                for (let i = 1; i < n; i++) HW.Progress.set('making' + i);
                const e = HW.global('MAKINGS')[n - 1].entry || { x: 3, y: 16 };
                HW.warp('making' + n, e.x, e.y); HW.step(10); HW.skipTalk(); HW.step(300);
                if (n === 8) { const t = HW.G.map.find('tuck'); HW.G.map.unplace(t, t.tx, t.ty); t.tx = 21; t.ty = 5; t.x = 21 * 16; t.y = 5 * 16; HW.G.map.place(t, 21, 5); }
                HW.walkTo(x, y); HW.face('up'); HW.step(60);
            }, [n, x, y]);
            await shot(name);
        }
        /* Wren's own (src/68c_makings_capstone.js): set out from underneath, Tuck let in, graded by the Makers */
        await page.evaluate(() => {
            HW.Progress.set('making8'); HW.Progress.set('cap_given'); HW.Inv.stitches = [];
            HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
            const st = (x, y, fy, d, moves) => { HW.walkTo(x, y + 11 + fy); HW.face(d); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(m); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
            st(7, 2, 1, 'up', ['right', 'right', 'right']); st(7, 8, -1, 'down', ['right', 'right']);
            HW.walkTo(3, 19); HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(30);
            HW.walkTo(9, 18); HW.face('up'); HW.step(30);
        });
        await shot('mk_9_setout');
        await page.evaluate(() => { HW.walkTo(7, 19); HW.face('down'); HW.press('act', 1); const t = HW.G.map.find('tuck'); for (let i = 0; i < 900 && t.state !== 'sit'; i++) HW.step(1); HW.walkTo(10, 14); HW.face('up'); HW.step(20); });
        await shot('mk_9_tuck');
        await page.evaluate(() => {
            HW.press('act', 1); HW.step(3); const t = HW.G.map.find('tuck'); for (let i = 0; i < 1500 && t.state !== 'done'; i++) HW.step(1);
            const D = HW.global('Dialog'); for (let i = 0; i < 2000 && !(D.active && D.who === 'ives' && D.shown >= D.pageLen()); i++) { if (D.active && D.shown >= D.pageLen()) HW.press('act', 1); else HW.step(1); }
        });
        await shot('mk_9_graded');
    },
    async reveal2() {
        await open();
        await page.evaluate(() => { HW.preset('afterMakings'); HW.step(5); HW.skipTalk(); HW.warp('deep', 9, 7); HW.step(40); HW.skipTalk(); });
        await shot('r2_store');
        await page.evaluate(() => { HW.warp('deep', 30, 5); HW.step(40); HW.skipTalk(); });
        await shot('r2_hall');
        await page.evaluate(() => { HW.preset('afterReveal2'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 96, 58); HW.step(60); HW.skipTalk(); });
        await shot('r2_town');
    },
    async loom() {
        await open();
        await page.evaluate(() => { HW.preset('afterReveal2'); HW.step(5); HW.skipTalk(); HW.Progress.set('north_gate'); HW.Inv.giveTool('shears'); });
        for (const [n, x, y] of [['lw_gate', 96, 38], ['lw_road', 95, 22], ['lw_edge', 72, 12], ['lw_loom', 95, 12]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { th: [29, 40], wh: [29, 29], oy: [12, 28], sr: [29, 19], sp: [9, 16], wr: [52, 27], br: [52, 16], web: [29, 9], hg: [54, 35] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('loom', x, y); HW.step(40); HW.skipTalk(); HW.step(30); HW.skipTalk(); }, [x, y]);
            await shot('lm_' + n);
        }
        /* the Hanging Gallery's weights let go, on their way home over the trench */
        await page.evaluate(() => { HW.walkTo(56, 35); HW.face('right'); HW.press('act', 1); HW.step(70); });
        await shot('lm_hg_moving');
    },
    async ending() {
        await open();
        await page.evaluate(() => { HW.preset('afterDrift'); HW.step(5); HW.skipTalk(); HW.warp('drift', 56, 18); HW.step(60); HW.skipTalk(); });
        await shot('en_drift');
        await page.evaluate(() => { HW.warp('drift', 18, 24); HW.step(60); HW.skipTalk(); });
        await shot('en_garden');
        await page.evaluate(() => { HW.warp('hollow', 95, 66); HW.step(400); HW.skipTalk(); HW.step(200); HW.skipTalk(); });
        await shot('en_pull');
        const rooms = { foot: [29, 40], tidy: [17, 38], kiln: [41, 38], hub: [29, 30], mill: [18, 27], belfry: [41, 27], climb: [29, 20], slumber: [18, 16], mario: [41, 16] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('greatspool', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('gs_' + n);
        }
        await page.evaluate(() => { for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('untie:' + h); HW.Progress.set('spool_all'); HW.warp('greatspool', 29, 8); HW.step(60); HW.skipTalk(); HW.step(200); });
        await shot('gs_top');
        /* the top's later pairs, as Gran leaves the room: the crates up in the drum and her throwing; then the dark */
        await page.evaluate(() => { for (const h of ['slumber', 'marionette']) HW.Progress.set('great:' + h); HW.Progress.set('gs_s1'); HW.warp('greatspool', 29, 7); HW.step(140); });
        await shot('gs_top_thrown');
        await page.evaluate(() => { for (const h of ['mill', 'belfry']) HW.Progress.set('great:' + h); HW.Progress.set('gs_s2'); HW.warp('greatspool', 29, 7); HW.step(60); });
        await shot('gs_top_dark');
        await page.evaluate(() => { HW.warp('greatspool', 29, 20); HW.step(150); });
        await shot('gs_climb_junk');
        await page.evaluate(() => { HW.G.credits = { pages: [['Wanderer:', '', 'Wren']], i: 0, t: 120 }; HW.step(1); });
        await shot('en_credits');
        await page.evaluate(() => { HW.G.credits = null; HW.preset('afterEnding'); HW.step(5); HW.skipTalk(); HW.step(300); });
        await shot('en_after');
        await page.evaluate(() => { HW.warp('hollow', 77, 53); HW.step(60); });
        await shot('en_gran');
        await page.evaluate(() => { localStorage.setItem('hollowell-ended', '1'); Title.open(); });
        await page.waitForTimeout(300);
        await shot('en_title');
        await page.evaluate(() => localStorage.removeItem('hollowell-ended'));
    },
    async strayhouse() {
        await open();
        await page.evaluate(() => { HW.preset('afterD8'); HW.step(5); HW.skipTalk(); HW.Progress.set('strayhouse_open'); HW.warp('hollow', 72, 8); HW.step(40); HW.skipTalk(); });
        await shot('sh_door');
        const rooms = { porch: [29, 40], parlour: [29, 29], pantry: [17, 27], garden: [41, 27], stair: [29, 18], wash: [17, 16], mend: [41, 16], pile: [29, 9], linnet: [9, 6] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('strayhouse', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('sh_' + n);
        }
        await page.evaluate(() => { HW.step(200); HW.skipTalk(); HW.step(100); });
        await shot('sh_pile2');
    },
    async unfinished() {
        await open();
        await page.evaluate(() => { HW.preset('afterD8'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 120, 47); HW.step(40); HW.skipTalk(); });
        await shot('uf_door');
        const rooms = { front: [29, 40], hall: [29, 29], gap: [17, 27], shelf: [2, 20], bay: [41, 27], gallery: [29, 19] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('unfinished', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('uf_' + n);
        }
        await page.evaluate(() => { HW.warp('unfinished', 29, 39); HW.step(20); HW.skipTalk(); HW.Inv.equipped = 'needle'; HW.face('up'); HW.walkTo(29, 39); HW.face('up'); HW.press('tool', 1); HW.step(20); });
        await shot('uf_sewn');
    },
    async larkspur() {
        await open();
        await page.evaluate(() => { HW.preset('afterD5'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 12, 84); HW.step(40); HW.skipTalk(); });
        await shot('lk_mesa');
        for (const [n, x, y] of [['lk_straw', 12, 74], ['lk_midway', 31, 60], ['lk_hall', 31, 51], ['lk_pen', 53, 52], ['lk_fortune', 11, 53], ['lk_gate', 57, 59]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
    },
    async slumber() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'slumber', x: 29, y: 42, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll']) HW.Inv.giveTool(t); HW.step(10); });
        const rooms = { porch: [29, 42], ward: [29, 31], linen: [17, 27], laundry: [42, 30], study: [64, 30], loft: [49, 34], landing: [29, 20], nursery: [17, 16], moonwalk: [42, 16], fort: [9, 9], boss: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('slumber', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('sl_' + n);
        }
        await page.evaluate(() => { HW.walkTo(29, 6); HW.step(200); HW.skipTalk(); HW.step(60); });
        await shot('sl_boss_fight');
        await page.evaluate(() => { HW.warp('hummock_hollow', 9, 2); HW.step(40); });
        await shot('hw_hollow');
    },
    async bedroll() {
        await open();
        await page.evaluate(() => {
            HW.newGame('Wren', { area: 'lab5', x: 5, y: 5, noAutosave: true }); HW.step(5);
            for (const t of ['gloves', 'hook', 'paddle', 'bedroll']) HW.Inv.giveTool(t); HW.Inv.equipped = 'bedroll';
            HW.walkTo(3, 6); HW.press('tool', 1); HW.step(30);
            HW.walkTo(9, 4); HW.hold('right'); HW.step(60); HW.release(); HW.step(10);
        });
        await shot('br_boards');
        await page.evaluate(() => { HW.walkTo(19, 4); HW.step(20); HW.hold('tool'); HW.step(22); HW.release(); HW.step(14); });
        await shot('br_homeward');
        await page.evaluate(() => { HW.step(120); HW.walkTo(20, 6); HW.step(20); });
        await shot('br_puff');
        await page.evaluate(() => { HW.step(200); HW.walkTo(34, 4); HW.step(10); });
        await shot('br_snoreling');
    },
    /* crisp pixels on scaled screens: the page's canvas is exactly the screen's pixels; the game is drawn at a whole
       number of them per game pixel; and in a real screenshot every game pixel comes out that many screen pixels wide */
    async scaling() {
        for (const [dpr, w, h] of [[1, 960, 540], [1, 1366, 768], [1.25, 1536, 864], [1.5, 1280, 720], [1.5, 1280, 610], [1.75, 1097, 617], [2, 1440, 900]]) {
            const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
            const pg = await ctx.newPage();
            pg.on('pageerror', e => errors.push('scaling: ' + e));
            await pg.goto('file://' + path.join(ROOT, 'play.html') + '?debug');
            await pg.waitForFunction(() => window.HW && window.HW.G);
            await pg.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 95, y: 60, noAutosave: true, skipIntro: true }); HW.step(30); });
            await pg.waitForTimeout(150);
            const g = await pg.evaluate(() => { const s = document.getElementById('game'); return { sw: s.width, sh: s.height, v: HW.global('Gfx').view }; });
            const tag = `scaling ${dpr}x ${w}x${h}`;
            if (Math.abs(g.sw - Math.round(w * dpr)) > 1 || Math.abs(g.sh - Math.round(h * dpr)) > 1) errors.push(`${tag}: canvas ${g.sw}x${g.sh}`);
            const sc = g.v.sc, whole = Math.abs(sc - Math.round(sc)) < 1e-9;
            if (!whole) errors.push(`${tag}: ${sc.toFixed(3)} screen pixels a game pixel`);
            /* a real screenshot, read back: runs of one colour along a row through the game are whole multiples of the scale */
            const png = (await pg.screenshot()).toString('base64');
            const bad = await pg.evaluate(async ({ png, v }) => {
                const im = new Image(); im.src = 'data:image/png;base64,' + png; await im.decode();
                const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
                const x = c.getContext('2d'); x.drawImage(im, 0, 0);
                let odd = 0, runs = 0;
                for (const fy of [0.31, 0.52, 0.77]) {
                    const y = Math.floor(v.y + v.h * fy), d = x.getImageData(v.x, y, v.w, 1).data;
                    let start = 0;
                    for (let i = 1; i <= v.w; i++) {
                        const same = i < v.w && d[i * 4] === d[(i - 1) * 4] && d[i * 4 + 1] === d[(i - 1) * 4 + 1] && d[i * 4 + 2] === d[(i - 1) * 4 + 2];
                        if (!same) { const len = i - start; runs++; if (len % Math.round(v.sc) !== 0 || start % Math.round(v.sc) !== 0) odd++; start = i; }
                    }
                }
                return { odd, runs, w: im.width };
            }, { png, v: g.v });
            if (bad.w !== Math.round(w * dpr) || bad.odd > 0) errors.push(`${tag}: ${bad.odd} of ${bad.runs} pixel runs uneven (screenshot ${bad.w} wide)`);
            if (wantShots) fs.writeFileSync(path.join(SHOTS, `scale_${dpr}_${w}x${h}.png`), Buffer.from(png, 'base64'));
            await ctx.close();
        }
    },
    /* a controller (simulated): name the Wanderer from the letter grid, walk with the stick, change a button in
       Controls, and the game's words name the controller's buttons */
    async gamepad() {
        await page.goto('file://' + path.join(ROOT, 'play.html') + '?debug');
        await page.waitForFunction(() => window.HW && window.HW.G);
        /* (no saves from the scenarios before: the title's first choice is a new game) */
        await page.evaluate(() => { try { localStorage.clear(); } catch { } window.onbeforeunload = null; });
        await page.goto('file://' + path.join(ROOT, 'play.html') + '?debug');
        await page.waitForFunction(() => window.HW && window.HW.G);
        await page.evaluate(() => { try { localStorage.clear(); } catch { } HW.global('Title').slots = HW.Save.list(); });
        await page.evaluate(() => {
            const pad = { id: 'Test Pad (STANDARD GAMEPAD)', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
            window.__pad = pad; navigator.getGamepads = () => [pad];
            window.__press = (i, on) => { pad.buttons[i] = { pressed: on, value: on ? 1 : 0 }; };
            HW._paused = true;
        });
        const tap = async i => { await page.evaluate(i => { __press(i, true); HW.step(2); __press(i, false); HW.step(2); }, i); };
        /* the title: New Wander (A), then the name: B clears, d-pad right x3 to D, A, ... then Start */
        await page.evaluate(() => { HW.global('Title').open(); HW.step(5); });
        for (let k = 0; k < 4 && (await page.evaluate(() => HW.G.scene)) !== 'name'; k++) { await tap(0); await page.evaluate(() => HW.step(20)); }
        const scene = await page.evaluate(() => HW.G.scene);
        if (scene !== 'name') errors.push('gamepad: not at the name screen: ' + scene);
        await tap(1); await tap(1); await tap(1); await tap(1);                 /* (B: takes the default name back, letter by letter) */
        for (const b of [15, 15, 15]) await tap(b); await tap(0);              /* D */
        await tap(13); for (let i = 0; i < 4; i++) await tap(14); await tap(0); /* down a row, left to Q? -> any letter */
        const nm = await page.evaluate(() => HW.global('NameEntry').name);
        if (!/^D[a-z]$/.test(nm)) errors.push('gamepad: name from the grid is ' + JSON.stringify(nm));
        await tap(9); await page.evaluate(() => { HW.step(200); HW.skipTalk(); HW.step(50); HW.skipTalk(); });
        const s2 = await page.evaluate(() => ({ scene: HW.G.scene, name: HW.G.wanderer }));
        if (s2.scene !== 'play' || s2.name !== nm) errors.push('gamepad: Start didn\'t begin the game: ' + JSON.stringify(s2));
        /* walk with the stick */
        const x0 = await page.evaluate(() => HW.player().x);
        await page.evaluate(() => { __pad.axes[0] = 1; HW.step(30); __pad.axes[0] = 0; HW.step(2); });
        const x1 = await page.evaluate(() => HW.player().x);
        if (!(x1 > x0)) errors.push('gamepad: the stick didn\'t move Wren');
        /* the words name the controller's buttons; rebind the tool to RB */
        const lbl = await page.evaluate(() => HW.global('fillKeys')('[tool]'));
        if (lbl !== 'B') errors.push('gamepad: [tool] reads ' + lbl);
        await page.evaluate(() => { const M = HW.global('PauseMenu'); M.open(); M.tab = M.tabs.indexOf('Options'); HW.global('Options').focus = true; const C = HW.global('Controls'); C.start(); C.sel = C.list().indexOf('tool'); HW.step(2); });
        await tap(0); await tap(5);
        const map = await page.evaluate(() => JSON.stringify(HW.global('Input').padmap.tool));
        if (map !== '[5]') errors.push('gamepad: rebinding the tool to RB gave ' + map);
        const lbl2 = await page.evaluate(() => HW.global('fillKeys')('[tool]'));
        if (lbl2 !== 'RB') errors.push('gamepad: after rebinding, [tool] reads ' + lbl2);
        await page.evaluate(() => { HW.global('Controls').close(); HW.global('PauseMenu').close(); });
        if (wantShots) { await page.evaluate(() => HW.step(2)); await page.waitForTimeout(80); await page.screenshot({ path: path.join(SHOTS, 'pad_play.png') }); }
    },
    /* the portraits in the dialogue (src/35b_portraits.js): on a real canvas every face draws, and differs by expression */
    async portraits() {
        await open();
        const bad = await page.evaluate(() => {
            const out = [], pixels = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, s = ''; for (let i = 3; i < d.length; i += 4) { if (d[i]) n++; s += d[i - 3] + ',' + d[i - 2] + ';'; } return [n, s]; };
            for (const id of ['wren', ...Object.keys(PEOPLE_DEF)].filter(w => w === 'wren' || PEOPLE_DEF[w].look)) {
                if (!Portraits.has(id)) { out.push(id + ' has no portrait'); continue; }
                const faces = new Set();
                for (const ex of EXPRESSIONS) {
                    const [n, s] = pixels(Portraits.get(id, ex)), talk = pixels(Portraits.get(id, ex, true))[1], blink = pixels(Portraits.get(id, ex, false, true))[1];
                    if (n < 500) out.push(`${id} ${ex}: only ${n} pixels drawn`);
                    if (talk === s) out.push(`${id} ${ex}: the mouth doesn't open`);
                    if (blink === s && ex !== 'happy') out.push(`${id} ${ex}: the eyes don't shut`);
                    faces.add(s);
                }
                if (faces.size !== EXPRESSIONS.length) out.push(`${id}: ${faces.size} different faces for ${EXPRESSIONS.length} expressions`);
            }
            /* and in the box: the bust in its frame at one end */
            HW.newGame('Wren', { noAutosave: true, skipIntro: true }); HW.step(5); HW.warp('gran_house', 6, 6); HW.step(20); HW.skipTalk();
            Script.run(function* () { yield* say('gran', '{happy}There you are. Let me look at you.'); }); HW.step(60);
            Game.render();
            const x = Dialog.side === 'right' ? 8 + 304 - 5 - 34 : 13, y = Dialog.top ? 18 + 5 : 180 - 50 + 5;
            const d = Gfx.ctx.getImageData(x + 1, y + 1, 32, 32).data; let skin = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i] === 0xf2 && d[i + 1] === 0xc4 && d[i + 2] === 0x9b) skin++;
            if (!Dialog.face || skin < 60) out.push(`no face in the box (${skin} pixels of Gran's skin)`);
            return out;
        });
        errors.push(...bad.map(b => 'portraits: ' + b));
        await shot('portraits_box');
    },
    /* the sound (src/09_audio.js, src/40e_mix.js), rendered and measured: see audioCheck */
    async audio() {
        await open();
        const bad = await page.evaluate(audioCheck);
        errors.push(...bad.map(b => 'audio: ' + b));
    },
    async title() { await open(); await page.evaluate(() => { window.HW._paused = false; }); await page.waitForTimeout(400); await page.evaluate(() => { window.HW._paused = true; }); await shot('title'); },
    async lab() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true }); HW.step(5); });
        await shot('lab_start');
        await page.evaluate(() => { HW.walkTo(2, 3); HW.push('right', 2); HW.walkTo(4, 5); HW.step(20); });
        await shot('lab_pushed');
        await page.evaluate(() => { HW.walkTo(8, 1); HW.face('down'); HW.press('act', 1); HW.walkTo(9, 6); });
        await shot('lab_carry');
        await page.evaluate(() => { HW.face('left'); HW.press('act', 1); HW.step(40); });
        await shot('lab_shards');
        await page.evaluate(() => { HW.walkTo(1, 2); HW.face('up'); HW.press('act', 1); HW.step(30); });
        await shot('lab_sign');
    },
};
for (const [name, fn] of Object.entries(SCENARIOS)) {
    if (only.length && !only.includes(name)) continue;
    try { await fn(); } catch (e) { errors.push(name + ': ' + e.message); }
    const gameErrors = await page.evaluate(() => window.HW ? window.HW.ERRORS.slice() : []).catch(() => []);
    errors.push(...gameErrors.map(e => name + ': ' + e));
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('browser checks passed' + (wantShots ? ' (screenshots in tests/shots/)' : ''));
