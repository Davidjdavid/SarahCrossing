/* Sound: a little chiptune synthesizer. Two pulse voices, a triangle, noise. Songs are written in a
   tracker shorthand (one token a step: "C4", "-" hold, "." rest; drums "k" kick, "s" snare, "h" hat).
   Sound effects are small recipes. Everything is silent headless and until the first key press. */

const Audio = {
    ctx: null, master: null, music: null, sfx: null, ok: false, muted: false,
    /* the gain staging: the tunes and the effects each have a bus (its gain the Options volume times MUSIC or SFX),
       meeting at the master, which runs through a soft limiter to the speakers. Measured (tests/browser.mjs `audio`):
       at the default volumes a tune plays at about -28 LUFS, each effect over or under it by what it means, and
       nothing reaches the limiter's knee (half of full scale), not even a fight's busiest moment; with both volumes at
       the top a tune's loudest beat only just does. The limiter is a straight line up to the knee, so it changes
       nothing there, and past it bends smoothly toward a ceiling it never crosses; it has no memory, so it can't pump:
       it only rounds off a rare pile-up of sounds that would otherwise clip */
    MUSIC: 1, SFX: 1, KNEE: 0.5, CEIL: 0.944,
    k: 1,       /* the level of the effect being played (Sfx.play sets it for the moment; tone and hit scale by it) */
    /* all sound off or on (a page hosting the game has a button for it) */
    setMuted(m) { this.muted = !!m; if (this.master) this.glide(this.master.gain, this.muted ? 0 : 1); },
    vol: { music: 0.6, sfx: 0.8 },
    waves: {},
    /* a gain moved over a few milliseconds, never in one jump: a jump clicks */
    glide(p, v) { try { p.setTargetAtTime(v, this.ctx.currentTime, 0.015); } catch (e) { p.value = v; } },
    unlock() {
        if (HEADLESS) return;
        if (!this.ctx) {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AC();
                this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1;
                /* (the limiter's curve spans four times full scale, so the signal goes in at a quarter) */
                const trim = this.ctx.createGain(); trim.gain.value = 0.25;
                this.limiter = this.ctx.createWaveShaper(); this.limiter.curve = softLimit(this.KNEE, this.CEIL, 4);
                this.master.connect(trim); trim.connect(this.limiter); this.limiter.connect(this.ctx.destination);
                this.music = this.ctx.createGain(); this.music.connect(this.master);
                this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
                this.setVolumes(true);
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
    setVolumes(now) {
        if (!this.ctx) return;
        const m = this.vol.music * this.MUSIC, s = this.vol.sfx * this.SFX;
        if (now) { this.music.gain.value = m; this.sfx.gain.value = s; }
        else { this.glide(this.music.gain, m); this.glide(this.sfx.gain, s); }
    },
    /* one tone */
    tone(out, t, f, dur, wave = 'p50', v = 0.2, opts = {}) {
        const c = this.ctx;
        v *= this.k;
        const o = c.createOscillator(), g = c.createGain();
        g.gain.value = 0;       /* (silent until its envelope starts: a gain begins at 1, and a start a sample early clicked) */
        if (this.waves[wave]) o.setPeriodicWave(this.waves[wave]); else o.type = wave;
        o.frequency.setValueAtTime(f, t);
        if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
        if (opts.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + dur + 0.05); }
        const a = opts.a || 0.005, rel = opts.r !== undefined ? opts.r : Math.min(0.08, dur * 0.4);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + a);
        /* (settling to the sustain level along a line before the release: set in one jump, it clicked on every note) */
        g.gain.linearRampToValueAtTime(v * (opts.sus || 0.85), t + Math.min(dur - 0.001, Math.max(a + 0.002, dur - rel)));
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + dur + 0.02);
    },
    hit(out, t, dur, v, hp = 1000, lp = 8000) {
        const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), k = this.k;
        v *= k;
        g.gain.value = 0; s.buffer = this.noise; s.loop = true; f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp;
        /* (in over a millisecond and a half, and down to nothing before the noise stops: a jump either way clicks) */
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.0015);
        g.gain.exponentialRampToValueAtTime(0.001 * k, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.01);
        s.connect(f); f.connect(f2); f2.connect(g); g.connect(out);
        s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    },
};
/* the master's soft limiter: a straight line (no change at all) up to the knee, then a smooth bend toward the ceiling,
   never reaching it; the curve covers `span` times full scale, the input coming in at 1/span */
function softLimit(knee, ceil, span) {
    const n = 8193, c = new Float32Array(n), r = ceil - knee;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1) * 2 - 1) * span, a = Math.abs(x);
        c[i] = Math.sign(x) * (a <= knee ? a : knee + r * Math.tanh((a - knee) / r));
    }
    return c;
}

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
    /* (asked for when the mill pond has run out; it had no sound) */
    chime: (o, t) => { Audio.tone(o, t, 1318, 0.6, 'triangle', 0.12, { r: 0.5 }); Audio.tone(o, t + 0.12, 1760, 0.7, 'triangle', 0.1, { r: 0.6 }); Audio.tone(o, t + 0.12, 2637, 0.4, 'sine', 0.03, { r: 0.35 }); },
};
/* each effect's level (dB, on top of its recipe), filled in by 40e_mix.js from measuring every effect against the
   music: what matters a lot (a find, a Knot) stands a few dB over the tune under it, what happens all the time (a
   letter of talk, a menu) a few under, and nothing is lost under it or shouts over it */
const SFX_LEVEL = {};
const Sfx = {
    last: {},
    /* the sounds of a step solved: music resting through a long stay comes back for them */
    stirs: { door: 1, unlock: 1, appear: 1, chest: 1, item: 1, smallitem: 1, knot: 1, button: 1, save: 1 },
    /* whatever in the world is taking its turn (Game.step sets it while each thing updates; a system moving things of
       its own, its thing): a sound it makes is heard only if it's in sight, or just past the screen's edge. The valley is
       one great place, and a contraption at its far side clicking away was heard all over it; Wren's own sounds and a
       scene's always play */
    src: null,
    heard(s) {
        const x = s.x !== undefined ? s.x : s.tx !== undefined ? s.tx * T : null, y = s.y !== undefined ? s.y : s.ty !== undefined ? s.ty * T : null;
        if (x === null || y === null) return true;
        const m = 40;
        return x > Cam.x - m && x < Cam.x + W + m && y > Cam.y - m && y < Cam.y + H + m;
    },
    /* vol: a caller's own say (0.4 for a quieter repeat), on top of the effect's level */
    play(name, vol = 1) {
        if (this.src && !this.heard(this.src)) return;
        if (this.stirs[name]) Music.stir();
        if (!Audio.ok || !SFX[name]) return;
        const now = Audio.ctx.currentTime;
        if (this.last[name] && now - this.last[name] < 0.03) return;
        this.last[name] = now;
        Audio.k = vol * Math.pow(10, (SFX_LEVEL[name] || 0) / 20);
        try { SFX[name](Audio.sfx, now); } catch (e) { } finally { Audio.k = 1; }
    },
};

/* ---------- music ---------- */
const SONGS = {};
/* each tune's level (dB), from measuring them all (filled in by 40e_mix.js): every tune at about the same loudness,
   the few meant to be quiet a little under */
const SONG_LEVEL = {};
function songLevel(id) { return Math.pow(10, (SONG_LEVEL[id] || 0) / 20); }
const Music = {
    cur: null, next: 0, step: 0, timer: null, fade: 1, playing: null, bus: null,
    /* long stays: a song marked thin: true, once THIN_AFTER seconds have gone by in one room with nothing solved and
       no scene playing, rests its tune for a pass (its first voice, and any marked thin: 'rest'; the drums keep only
       their ticks); the pass after is whole again, and the count starts over. A new room, a scene or a solved step
       (stir) brings it all back at the next beat. Only what's heard: it never touches play */
    THIN_AFTER: 150, calm: 0, thin: false, waking: false, where: null,
    stir() { this.calm = 0; if (this.thin) this.waking = true; },
    /* each song plays through a volume of its own (at the song's level, SONG_LEVEL), so a change of music is a short
       crossfade, never a cut: the old one out and the new one in over the same FADE, so the two together are never
       louder than the louder of them (the old held where it is, not set from a reading, which can lag) */
    FADE: 0.5,
    newBus() {
        const c = Audio.ctx, t = c.currentTime, F = this.FADE;
        if (this.bus) {
            const old = this.bus, p = old.gain;
            try { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } p.linearRampToValueAtTime(0, t + F); } catch (e) { }
            setTimeout(() => { try { old.disconnect(); } catch (e) { } }, F * 1000 + 400);
        }
        const b = c.createGain(); b.gain.value = 0; b.gain.setValueAtTime(0, t); b.gain.linearRampToValueAtTime(songLevel(this.playing), t + F); b.connect(Audio.music);
        this.bus = b;
    },
    play(id) {
        if (this.playing === id) return;
        this.playing = id;
        this.cur = SONGS[id] || null;
        this.step = 0; this.calm = 0; this.thin = this.waking = false;
        if (!Audio.ok) return;
        this.newBus();
        this.next = Audio.ctx.currentTime + 0.12;
        if (this.cur && !this.cur._parsed) parseSong(this.cur);
    },
    stop() { this.playing = null; this.cur = null; if (Audio.ok && this.bus) { this.newBus(); } },
    /* called every frame: schedule what's due in the next 0.15 s */
    tick() {
        if (!Audio.ok || !this.cur) return;
        const s = this.cur;
        if (!s._parsed) parseSong(s);
        const where = typeof Cam !== 'undefined' ? Cam.room : null;
        if (where !== this.where || (typeof Script !== 'undefined' && Script.blocking())) { this.where = where; this.stir(); }
        const stepDur = 60 / s.bpm / (s.div || 4);
        const ctx = Audio.ctx;
        if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
        while (this.next < ctx.currentTime + 0.15) {
            const i = this.step % s.len;
            if (this.thin && (i === 0 || (this.waking && i % (s.div || 4) === 0))) { this.thin = this.waking = false; this.calm = 0; }
            else if (i === 0 && s.thin && this.calm * stepDur >= this.THIN_AFTER) this.thin = true;
            const out = this.bus || Audio.music;
            for (const ch of s._ch) {
                const ev = ch.ev[i % ch.ev.length];
                if (!ev || (this.thin && ch.rests)) continue;
                if (ch.drum) {
                    if (this.thin && ev !== 'h' && ev !== 'H') continue;
                    const o = out;
                    if (ev === 'k') Audio.tone(o, this.next, 150, 0.12, 'triangle', ch.vol * 1.6, { slide: 45 });
                    else if (ev === 's') { Audio.hit(o, this.next, 0.12, ch.vol, 1200, 7000); Audio.tone(o, this.next, 220, 0.05, 'triangle', ch.vol * 0.6); }
                    else if (ev === 'h') Audio.hit(o, this.next, 0.03, ch.vol * 0.5, 6000, 12000);
                    else if (ev === 'H') Audio.hit(o, this.next, 0.12, ch.vol * 0.4, 5000, 12000);
                } else {
                    Audio.tone(out, this.next, ev.f, ev.n * stepDur * (ch.legato || 0.92), ch.wave, ch.vol, { vib: ch.vib && ev.n >= 4, a: ch.attack || 0.006, r: ch.rel });
                }
            }
            this.step++; this.calm++;
            this.next += stepDur;
        }
    },
};
function parseSong(s) {
    /* (in a thin pass the tune rests: the first voice, unless it's marked thin: 'keep', and any marked thin: 'rest') */
    const lead = s.ch.findIndex(c => !c.drum);
    s._ch = s.ch.map((c, k) => {
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
        return Object.assign({}, c, { ev, rests: c.thin === 'rest' || (k === lead && c.thin !== 'keep') });
    });
    s.len = s.len || Math.max(...s._ch.map(c => c.ev.length));
    s._parsed = true;
}
