/* Sound: a little chiptune synthesizer. Two pulse voices, a triangle, noise. Songs are written in a
   tracker shorthand (one token a step: "C4", "-" hold, "." rest; drums "k" kick, "s" snare, "h" hat).
   Sound effects are small recipes. Everything is silent headless and until the first key press. */

const Audio = {
    ctx: null, master: null, music: null, sfx: null, ok: false,
    vol: { music: 0.6, sfx: 0.8 },
    waves: {},
    unlock() {
        if (HEADLESS) return;
        if (!this.ctx) {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AC();
                this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
                this.music = this.ctx.createGain(); this.music.connect(this.master);
                this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
                this.setVolumes();
                /* pulse waves with narrow duty */
                for (const [name, duty] of [['p12', 0.125], ['p25', 0.25], ['p50', 0.5]]) {
                    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
                    for (let i = 1; i < n; i++) im[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
                    this.waves[name] = this.ctx.createPeriodicWave(re, im);
                }
                const len = this.ctx.sampleRate;
                this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
                this.ok = true;
            } catch (e) { this.ok = false; }
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    setVolumes() {
        if (!this.ctx) return;
        this.music.gain.value = this.vol.music * 0.55;
        this.sfx.gain.value = this.vol.sfx * 0.7;
    },
    /* one tone */
    tone(out, t, f, dur, wave = 'p50', v = 0.2, opts = {}) {
        const c = this.ctx;
        const o = c.createOscillator(), g = c.createGain();
        if (this.waves[wave]) o.setPeriodicWave(this.waves[wave]); else o.type = wave;
        o.frequency.setValueAtTime(f, t);
        if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
        if (opts.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + dur + 0.05); }
        const a = opts.a || 0.005, rel = opts.r !== undefined ? opts.r : Math.min(0.08, dur * 0.4);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + a);
        g.gain.setValueAtTime(v * (opts.sus || 0.85), t + Math.max(a, dur - rel));
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + dur + 0.02);
    },
    hit(out, t, dur, v, hp = 1000, lp = 8000) {
        const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter();
        s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp;
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        s.connect(f); f.connect(f2); f2.connect(g); g.connect(out);
        s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    },
};

const NOTE_I = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteFreq(tok) {
    const m = /^([A-G][#b]?)(\d)$/.exec(tok);
    if (!m) return 0;
    const n = NOTE_I[m[1]] + (parseInt(m[2]) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
}

/* ---------- sound effects ---------- */
const SFX = {
    push: (o, t) => Audio.hit(o, t, 0.12, 0.18, 200, 900),
    home: (o, t) => { Audio.tone(o, t, 1046, 0.05, 'p25', 0.08); Audio.tone(o, t + 0.05, 1568, 0.08, 'p25', 0.07); },
    pop: (o, t) => Audio.tone(o, t, 300, 0.08, 'triangle', 0.25, { slide: 900 }),
    twang: (o, t) => Audio.tone(o, t, 180, 0.18, 'p25', 0.06, { slide: 140 }),
    click: (o, t) => { Audio.tone(o, t, 220, 0.04, 'p50', 0.12); Audio.hit(o, t, 0.04, 0.12, 2000); },
    unclick: (o, t) => Audio.tone(o, t, 160, 0.04, 'p50', 0.08),
    door: (o, t) => { Audio.hit(o, t, 0.25, 0.12, 300, 1500); Audio.tone(o, t, 110, 0.2, 'triangle', 0.18, { slide: 220 }); },
    doorshut: (o, t) => { Audio.hit(o, t, 0.15, 0.15, 200, 1000); Audio.tone(o, t, 140, 0.12, 'triangle', 0.2, { slide: 70 }); },
    unlock: (o, t) => { Audio.tone(o, t, 660, 0.06, 'p25', 0.1); Audio.tone(o, t + 0.07, 990, 0.1, 'p25', 0.1); SFX.door(o, t + 0.12); },
    chest: (o, t) => { [523, 659, 784, 1046].forEach((f, i) => Audio.tone(o, t + i * 0.06, f, 0.08, 'p25', 0.1)); },
    item: (o, t) => {
        const seq = [[784, 0.1], [988, 0.1], [1175, 0.1], [1568, 0.35]];
        let tt = t; for (const [f, d] of seq) { Audio.tone(o, tt, f, d, 'p25', 0.12, { vib: d > 0.2 }); Audio.tone(o, tt, f / 2, d, 'triangle', 0.15); tt += d; }
    },
    smallitem: (o, t) => { Audio.tone(o, t, 988, 0.07, 'p25', 0.1); Audio.tone(o, t + 0.07, 1318, 0.12, 'p25', 0.1); },
    heart: (o, t) => { Audio.tone(o, t, 880, 0.06, 'p50', 0.08); Audio.tone(o, t + 0.06, 1175, 0.1, 'p50', 0.08); },
    button: (o, t) => { Audio.tone(o, t, 1568, 0.04, 'p12', 0.08); Audio.tone(o, t + 0.04, 2093, 0.08, 'p12', 0.07); },
    swing: (o, t) => Audio.hit(o, t, 0.1, 0.12, 1500, 6000),
    hitthing: (o, t) => { Audio.hit(o, t, 0.06, 0.2, 800, 4000); Audio.tone(o, t, 300, 0.05, 'p50', 0.1, { slide: 150 }); },
    hurt: (o, t) => { Audio.tone(o, t, 440, 0.15, 'p25', 0.16, { slide: 110 }); },
    enemyhit: (o, t) => { Audio.tone(o, t, 600, 0.08, 'p25', 0.14, { slide: 200 }); Audio.hit(o, t, 0.08, 0.12, 1000); },
    unravel: (o, t) => { for (let i = 0; i < 6; i++) Audio.tone(o, t + i * 0.04, 900 - i * 110, 0.05, 'p25', 0.08); },
    fall: (o, t) => Audio.tone(o, t, 700, 0.45, 'triangle', 0.18, { slide: 90 }),
    splash: (o, t) => { Audio.hit(o, t, 0.3, 0.2, 400, 3000); Audio.tone(o, t, 200, 0.1, 'triangle', 0.12, { slide: 80 }); },
    flight: (o, t) => { for (let i = 0; i < 5; i++) Audio.tone(o, t + i * 0.05, 400 + i * 120, 0.06, 'p12', 0.05); },
    land: (o, t) => Audio.hit(o, t, 0.08, 0.15, 150, 700),
    lift: (o, t) => Audio.tone(o, t, 330, 0.08, 'p50', 0.1, { slide: 500 }),
    throw: (o, t) => Audio.hit(o, t, 0.12, 0.12, 900, 5000),
    shatter: (o, t) => { Audio.hit(o, t, 0.2, 0.25, 2500, 9000); for (let i = 0; i < 4; i++) Audio.tone(o, t + i * 0.03, 1800 + i * 400, 0.04, 'p12', 0.05); },
    crystal: (o, t) => { Audio.tone(o, t, 1318, 0.2, 'p25', 0.08); Audio.tone(o, t, 1976, 0.25, 'triangle', 0.08); },
    appear: (o, t) => { [659, 784, 988, 1318].forEach((f, i) => Audio.tone(o, t + i * 0.05, f, 0.1, 'triangle', 0.15)); },
    blip: (o, t) => Audio.tone(o, t, 620, 0.025, 'p50', 0.05),
    blipLow: (o, t) => Audio.tone(o, t, 420, 0.025, 'p50', 0.05),
    menu: (o, t) => Audio.tone(o, t, 880, 0.03, 'p25', 0.07),
    select: (o, t) => { Audio.tone(o, t, 660, 0.04, 'p25', 0.08); Audio.tone(o, t + 0.04, 990, 0.06, 'p25', 0.08); },
    cancel: (o, t) => Audio.tone(o, t, 440, 0.06, 'p25', 0.07, { slide: 330 }),
    bell: (o, t) => { Audio.tone(o, t, 784, 1.2, 'triangle', 0.2, { r: 1.0, sus: 0.6 }); Audio.tone(o, t, 1568, 0.8, 'sine', 0.08, { r: 0.7 }); Audio.tone(o, t, 2350, 0.5, 'sine', 0.04, { r: 0.45 }); },
    knot: (o, t) => { Audio.tone(o, t, 98, 1.8, 'triangle', 0.3, { r: 1.4, sus: 0.6 }); Audio.tone(o, t, 196, 1.6, 'p50', 0.06, { r: 1.2 }); Audio.tone(o, t + 0.2, 392, 1.2, 'sine', 0.06, { r: 1 }); },
    hook: (o, t) => { Audio.tone(o, t, 1200, 0.12, 'p12', 0.06, { slide: 2400 }); },
    hookhit: (o, t) => { Audio.hit(o, t, 0.05, 0.18, 1500); Audio.tone(o, t, 900, 0.05, 'p25', 0.08); },
    step: (o, t) => Audio.hit(o, t, 0.03, 0.04, 400, 1500),
    tug: (o, t) => Audio.tone(o, t, 120, 0.25, 'p25', 0.08, { slide: 260 }),
    save: (o, t) => { [523, 784, 659, 1046].forEach((f, i) => Audio.tone(o, t + i * 0.09, f, 0.12, 'triangle', 0.15)); },
    boss: (o, t) => { Audio.tone(o, t, 82, 0.6, 'p50', 0.12, { slide: 60 }); Audio.hit(o, t, 0.5, 0.2, 100, 600); },
    rumble: (o, t) => Audio.hit(o, t, 0.6, 0.25, 40, 300),
};
const Sfx = {
    last: {},
    play(name, vol = 1) {
        if (!Audio.ok || !SFX[name]) return;
        const now = Audio.ctx.currentTime;
        if (this.last[name] && now - this.last[name] < 0.03) return;
        this.last[name] = now;
        try { SFX[name](Audio.sfx, now); } catch (e) { }
    },
};

/* ---------- music ---------- */
const SONGS = {};
const Music = {
    cur: null, next: 0, step: 0, timer: null, fade: 1, playing: null,
    play(id) {
        if (this.playing === id) return;
        this.playing = id;
        this.cur = SONGS[id] || null;
        this.step = 0;
        if (!Audio.ok) return;
        this.next = Audio.ctx.currentTime + 0.1;
        if (this.cur && !this.cur._parsed) parseSong(this.cur);
    },
    stop() { this.playing = null; this.cur = null; },
    /* called every frame: schedule what's due in the next 0.15 s */
    tick() {
        if (!Audio.ok || !this.cur) return;
        const s = this.cur;
        if (!s._parsed) parseSong(s);
        const stepDur = 60 / s.bpm / (s.div || 4);
        const ctx = Audio.ctx;
        if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
        while (this.next < ctx.currentTime + 0.15) {
            const i = this.step % s.len;
            for (const ch of s._ch) {
                const ev = ch.ev[i % ch.ev.length];
                if (!ev) continue;
                if (ch.drum) {
                    const o = Audio.music;
                    if (ev === 'k') Audio.tone(o, this.next, 150, 0.12, 'triangle', ch.vol * 1.6, { slide: 45 });
                    else if (ev === 's') { Audio.hit(o, this.next, 0.12, ch.vol, 1200, 7000); Audio.tone(o, this.next, 220, 0.05, 'triangle', ch.vol * 0.6); }
                    else if (ev === 'h') Audio.hit(o, this.next, 0.03, ch.vol * 0.5, 6000, 12000);
                    else if (ev === 'H') Audio.hit(o, this.next, 0.12, ch.vol * 0.4, 5000, 12000);
                } else {
                    Audio.tone(Audio.music, this.next, ev.f, ev.n * stepDur * (ch.legato || 0.92), ch.wave, ch.vol, { vib: ch.vib && ev.n >= 4, a: ch.attack || 0.006, r: ch.rel });
                }
            }
            this.step++;
            this.next += stepDur;
        }
    },
};
function parseSong(s) {
    s._ch = s.ch.map(c => {
        const toks = c.n.replace(/\|/g, ' ').trim().split(/\s+/);
        const ev = new Array(toks.length).fill(null);
        if (c.drum) { toks.forEach((t, i) => { if (t !== '.' && t !== '-') ev[i] = t; }); }
        else {
            for (let i = 0; i < toks.length; i++) {
                const t = toks[i];
                if (t === '.' || t === '-') continue;
                let n = 1; while (toks[i + n] === '-') n++;
                const tr = c.tr || 0;
                const f = noteFreq(t) * Math.pow(2, tr / 12);
                if (f) ev[i] = { f, n };
            }
        }
        return Object.assign({}, c, { ev });
    });
    s.len = s.len || Math.max(...s._ch.map(c => c.ev.length));
    s._parsed = true;
}
