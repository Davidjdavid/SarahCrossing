// The sound's gain staging and envelopes (src/09_audio.js, src/40e_mix.js), on a pretend sound card that writes down
// every gain it is asked to move: no note or effect jumps in level while it sounds (a jump is a click), a caller's
// volume is heard, every effect the game asks for exists, a change of music never stacks two tunes louder than one,
// the master's limiter changes nothing below its knee and never reaches full scale, and at the default volumes no
// tune can reach that knee even with every voice peaking at once. (tests/browser.mjs `audio` renders it all for real.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

/* a sound card that only keeps notes: each gain's automation and each source's start and stop */
function fakeCard(HW) {
    const A = HW.global('Audio'), M = HW.global('Music');
    const ctx = { currentTime: 0, sampleRate: 48000, destination: { name: 'out' }, gains: [], sources: [] };
    const param = (v = 1) => {
        const p = { v, ev: [] };
        for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues', 'cancelAndHoldAtTime'])
            p[m] = (x, t, k) => { p.ev.push([m, x, t, k]); };
        Object.defineProperty(p, 'value', { get: () => p.v, set: x => { p.v = x; p.ev.push(['value', x]); } });
        return p;
    };
    const node = extra => Object.assign({ ins: [], connect(d) { this.to = d; if (d && d.ins) d.ins.push(this); return d; }, disconnect() { } }, extra);
    const source = kind => { const s = node({ kind, frequency: param(440), start(t) { s.on = t; }, stop(t) { s.off = t; }, setPeriodicWave() { } }); ctx.sources.push(s); return s; };
    Object.assign(ctx, {
        createGain() { const g = node({ gain: param(1) }); ctx.gains.push(g); return g; },
        createOscillator: () => source('osc'), createBufferSource: () => source('noise'),
        createBiquadFilter: () => node({ frequency: param(350), Q: param(1) }), createWaveShaper: () => node({}),
        createPeriodicWave: () => ({}), createBuffer: () => ({ getChannelData: () => new Float32Array(8) }),
    });
    Object.assign(A, { ctx, ok: true, k: 1, waves: { p12: {}, p25: {}, p50: {} }, noise: {} });
    A.master = ctx.createGain(); A.music = ctx.createGain(); A.sfx = ctx.createGain();
    A.music.connect(A.master); A.sfx.connect(A.master); A.setVolumes(true);
    M.bus = null; M.playing = null; M.cur = null;
    const run = s => { const end = ctx.currentTime + s; while (ctx.currentTime < end) { ctx.currentTime += 1 / 60; M.tick(); } };
    return { A, M, ctx, run };
}
/* a gain's value just before time t, from its automation as Web Audio runs it (ramps from the event before) */
function valueAt(p, t) {
    let v = p.ev.length && p.ev[0][0] === 'value' ? p.ev[0][1] : 1, t0 = 0;
    for (const e of p.ev) {
        const [m, x, et] = e;
        if (m === 'value') { v = x; continue; }
        if (m === 'cancelScheduledValues') continue;
        if (m === 'cancelAndHoldAtTime') { if (x >= t) return valueAt({ ev: p.ev.slice(0, p.ev.indexOf(e)) }, t); v = valueAt({ ev: p.ev.slice(0, p.ev.indexOf(e)) }, x); t0 = x; continue; }
        if (et >= t) {
            if (m === 'linearRampToValueAtTime') return v + (x - v) * Math.max(0, (t - t0) / (et - t0 || 1));
            if (m === 'exponentialRampToValueAtTime') return v * Math.pow(x / v, Math.max(0, (t - t0) / (et - t0 || 1)));
            return v;
        }
        v = x; t0 = et;
    }
    return v;
}
/* every jump in a gain's automation: a value set to something other than what it had just then */
function jumps(p) {
    const out = [];
    p.ev.forEach(([m, x, t], i) => {
        if (m !== 'setValueAtTime') return;
        const before = valueAt({ ev: p.ev.slice(0, i) }, t);
        if (Math.abs(before - x) > 1e-9) out.push({ t, from: before, to: x });
    });
    return out;
}
/* the sources that feed a gain (straight in, or through filters) */
const feeds = (ctx, g) => ctx.sources.filter(s => { for (let n = s, i = 0; n && i < 4; n = n.to, i++) if (n === g) return true; return false; });

test('no note of any tune, and no effect, jumps in level while it sounds (a jump is a click)', () => {
    const HW = loadGame();
    const { A, M, ctx, run } = fakeCard(HW), SONGS = HW.global('SONGS'), SFX = HW.global('SFX'), Sfx = HW.global('Sfx');
    const check = (what, gains) => {
        /* (the gains a note or an effect plays through: into a tune's bus, or the effects' bus) */
        for (const g of gains.filter(g => g.to === A.sfx || (g.to && g.to.to === A.music))) {
            const src = feeds(ctx, g);
            if (!src.length) continue;
            const on = Math.min(...src.map(s => s.on)), off = Math.max(...src.map(s => s.off));
            for (const j of jumps(g.gain)) if (j.t >= on - 1e-9 && j.t <= off) assert.fail(`${what}: a gain jumps from ${j.from.toFixed(3)} to ${j.to.toFixed(3)} at ${j.t.toFixed(3)} s while it sounds`);
            /* and silent again before its sound stops */
            assert.ok(valueAt(g.gain, off) < 1e-6, `${what}: still sounding (${valueAt(g.gain, off).toFixed(4)}) when its source stops`);
        }
    };
    for (const id of Object.keys(SONGS)) {
        if (id === 'silence') continue;
        const n0 = ctx.gains.length;
        M.playing = null; M.play(id);
        const s = SONGS[id];
        run(s.len * 60 / s.bpm / (s.div || 4) + 0.5);
        check(id, ctx.gains.slice(n0));
    }
    for (const name of Object.keys(SFX)) {
        const n0 = ctx.gains.length;
        Sfx.last = {}; ctx.currentTime += 3; Sfx.play(name);
        check('effect ' + name, ctx.gains.slice(n0));
    }
});

test('an effect played at a caller\'s volume is heard at that volume', () => {
    const HW = loadGame();
    const { ctx } = fakeCard(HW), Sfx = HW.global('Sfx');
    const peakOf = () => Math.max(...ctx.gains.slice(-1)[0].gain.ev.filter(e => e[0] === 'linearRampToValueAtTime').map(e => e[1]));
    for (const name of ['twang', 'hitthing', 'land', 'blip']) {
        Sfx.last = {}; ctx.currentTime += 1; Sfx.play(name); const full = peakOf();
        Sfx.last = {}; ctx.currentTime += 1; Sfx.play(name, 0.4); const soft = peakOf();
        assert.ok(Math.abs(soft / full - 0.4) < 1e-6, `${name} at 0.4: ${(soft / full).toFixed(3)} of full`);
    }
});

test('every effect the game asks for has a sound', () => {
    const HW = loadGame();
    const SFX = HW.global('SFX'), src = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'dist', 'hollowell.js'), 'utf8');
    const asked = new Set([...src.matchAll(/Sfx\.play\('([A-Za-z]+)'/g)].map(m => m[1]));
    assert.ok(asked.size > 40, 'the effects found');
    for (const n of asked) assert.ok(SFX[n], `Sfx.play('${n}') has no sound`);
});

test('a change of music crossfades: the two tunes together are never louder than the louder of them', () => {
    const HW = loadGame();
    const { M, ctx, run } = fakeCard(HW), songLevel = HW.global("typeof songLevel === 'function' ? songLevel : () => 1");
    for (const [a, b] of [['kilnhouse', 'boss_kiln'], ['boss_kiln', 'kilnhouse'], ['tidy', 'boss_tidy'], ['town', 'shop']]) {
        M.playing = null; M.play(a); run(2);
        const old = M.bus, t = ctx.currentTime; M.play(b); const now = M.bus;
        assert.notEqual(old, now, 'a bus of its own');
        const top = Math.max(songLevel(a), songLevel(b));
        for (let x = 0.01; x <= 1; x += 0.01) {
            const s = valueAt(old.gain, t + x) + valueAt(now.gain, t + x);
            assert.ok(s <= top + 1e-6, `${a} to ${b}: ${s.toFixed(3)} at +${x.toFixed(2)} s (the louder alone is ${top.toFixed(3)})`);
        }
        assert.ok(valueAt(old.gain, t + 1) < 1e-6 && Math.abs(valueAt(now.gain, t + 1) - songLevel(b)) < 1e-6, `${a} to ${b}: out and in`);
        run(1);
    }
});

test('the master\'s limiter: a straight line up to its knee, a smooth bend after, never full scale', () => {
    const HW = loadGame();
    const A = HW.global('Audio'), softLimit = HW.global('softLimit');
    const span = 4, c = softLimit(A.KNEE, A.CEIL, span), n = c.length, at = i => (i / (n - 1) * 2 - 1) * span;
    assert.ok(A.KNEE >= 0.5 && A.CEIL < 1, `knee ${A.KNEE}, ceiling ${A.CEIL}`);
    for (let i = 0; i < n; i++) {
        const x = at(i);
        if (Math.abs(x) <= A.KNEE) assert.ok(Math.abs(c[i] - x) < 1e-6, `${x.toFixed(3)} comes out ${c[i]}`);
        assert.ok(Math.abs(c[i]) < A.CEIL && Math.abs(c[i]) < 1, `${x.toFixed(3)} comes out ${c[i]}`);
        if (i) assert.ok(c[i] >= c[i - 1], 'never folds back');
        if (i > 1) assert.ok(c[i] - c[i - 1] <= c[i - 1] - c[i - 2] + 1e-6 || at(i) <= 0, 'bends one way only');
    }
});

test('the gain staging: at the default volumes no tune can reach the limiter\'s knee, even with every voice peaking at once', () => {
    const HW = loadGame();
    const A = HW.global('Audio'), SONGS = HW.global('SONGS'), songLevel = HW.global('songLevel');
    for (const [id, s] of Object.entries(SONGS)) {
        /* a voice peaks at its volume (every wave the synth plays peaks at 1); the drums' loudest is the kick, 1.6 times */
        const sum = s.ch.reduce((a, c) => a + c.vol * (c.drum ? 1.6 : 1), 0);
        const top = sum * songLevel(id) * A.MUSIC * 0.6;
        assert.ok(top < A.KNEE, `${id}: every voice at once comes to ${top.toFixed(3)} at the default volume (the knee is ${A.KNEE})`);
    }
});
