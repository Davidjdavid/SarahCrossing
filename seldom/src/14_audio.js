/* sound: a little synthesizer. Music on Seldom comes from things in the world (the band, a music box...):
   each source keeps its own place in its song and only plays while it's seen. */
const Audio2 = {
    ctx: null, master: null, sfx: null, mus: null, ok: false,
    unlock() {
        if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
        try {
            const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
            this.ctx = new AC();
            this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
            this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
            this.mus = this.ctx.createGain(); this.mus.connect(this.master);
            const n = this.ctx.sampleRate; const b = this.ctx.createBuffer(1, n, n); const d = b.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            this.noiseBuf = b; this.ok = true; this.applyVolume();
        } catch (e) { this.ok = false; }
    },
    applyVolume() { if (!this.ok) return; this.sfx.gain.value = Settings.volume * 0.5; this.mus.gain.value = Settings.music * 0.38; },
    now() { return this.ctx ? this.ctx.currentTime : 0; },
    /* one note: wave, frequency, start, length, volume, where to (a gain node) */
    tone(type, f, t, len, vol, out, slide) {
        if (!this.ok) return null;
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        if (type === 'pulse') { o.setPeriodicWave(this.pulse || (this.pulse = pulseWave(c, 0.25))); } else o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + len);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
        g.gain.setValueAtTime(vol, t + Math.max(0.01, len - 0.03)); g.gain.linearRampToValueAtTime(0, t + len);
        o.connect(g); g.connect(out || this.sfx); o.start(t); o.stop(t + len + 0.02);
        return { o, g };
    },
    noise(t, len, vol, out, hp) {
        if (!this.ok) return null;
        const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
        s.buffer = this.noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 1000;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
        s.connect(f); f.connect(g); g.connect(out || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + len + 0.02);
        return { o: s, g };
    },
};
function pulseWave(c, duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) im[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * duty);
    return c.createPeriodicWave(re, im);
}
const NOTE = {};
(function () { const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; for (let o = 1; o < 8; o++) names.forEach((n, i) => { NOTE[n + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12); }); })();

const Sfx = {
    last: {},
    play(name) {
        if (!Audio2.ok) return;
        if (this.last[name] && G.t - this.last[name] < 0.04) return;
        this.last[name] = G.t;
        const t = Audio2.now(), A = Audio2;
        switch (name) {
            case 'zin': A.tone('triangle', 500, t, 0.08, 0.3, null, 900); break;
            case 'zout': A.tone('triangle', 900, t, 0.08, 0.3, null, 500); break;
            case 'nope': A.tone('square', 140, t, 0.08, 0.15); break;
            case 'split': A.tone('sine', 1200, t, 0.25, 0.25, null, 300); A.tone('sine', 1800, t + 0.05, 0.25, 0.15, null, 500); break;
            case 'unsplit': A.tone('sine', 300, t, 0.2, 0.25, null, 1200); break;
            case 'unpin': A.tone('triangle', 700, t, 0.06, 0.2, null, 400); break;
            case 'pin': A.tone('triangle', 400, t, 0.06, 0.2, null, 700); break;
            case 'pop': A.tone('square', 300, t, 0.06, 0.2, null, 900); break;
            case 'wrap': A.tone('sine', 300, t, 0.18, 0.25, null, 1400); break;
            case 'seam': A.tone('sine', 1600, t, 0.3, 0.25, null, 400); A.noise(t, 0.2, 0.1, null, 3000); break;
            case 'thud': A.noise(t, 0.08, 0.25, null, 200); break;
            case 'splash': A.noise(t, 0.3, 0.3, null, 800); break;
            case 'push': A.noise(t, 0.15, 0.2, null, 150); break;
            case 'pick': A.tone('square', 880, t, 0.05, 0.15); A.tone('square', 1320, t + 0.05, 0.08, 0.15); break;
            case 'lift': A.tone('triangle', 300, t, 0.1, 0.3, null, 600); break;
            case 'throw': A.noise(t, 0.12, 0.15, null, 2000); break;
            case 'drop': A.tone('triangle', 400, t, 0.08, 0.3, null, 200); break;
            case 'door': A.noise(t, 0.12, 0.2, null, 400); A.tone('triangle', 200, t, 0.1, 0.2); break;
            case 'tick': A.tone('square', 1200, t, 0.025, 0.08); break;
            case 'next': A.tone('square', 900, t, 0.03, 0.08); break;
            case 'open': A.tone('triangle', 600, t, 0.06, 0.2); A.tone('triangle', 900, t + 0.06, 0.08, 0.2); break;
            case 'close': A.tone('triangle', 900, t, 0.06, 0.2); A.tone('triangle', 600, t + 0.06, 0.08, 0.2); break;
            case 'write': [0, 0.07, 0.14].forEach((d, i) => A.noise(t + d, 0.05, 0.12, null, 4000 + i * 500)); A.tone('triangle', 1046, t + 0.22, 0.2, 0.15); A.tone('triangle', 1568, t + 0.3, 0.3, 0.15); break;
            case 'return': A.tone('sine', 1500, t, 0.15, 0.12, null, 2200); break;
            case 'get': [523, 659, 784, 1046].forEach((f, i) => A.tone('square', f, t + i * 0.09, 0.12, 0.15)); A.tone('triangle', 1046, t + 0.36, 0.5, 0.25); break;
            case 'chime': [1046, 1318, 1568].forEach((f, i) => A.tone('sine', f, t + i * 0.12, 0.6, 0.15)); break;
            case 'bonk': A.tone('square', 90, t, 0.06, 0.15); break;
            case 'tock': A.tone('sine', 1800, t, 0.03, 0.06); break;
            case 'flicker': A.tone('square', 2400 + Math.random() * 400, t, 0.02, 0.03); break;
            case 'step': A.noise(t, 0.03, 0.04, null, 1500); break;
            case 'bell': [523, 1046, 1568].forEach((f, i) => A.tone('sine', f, t, 1.6, 0.18 / (i + 1))); break;
        }
    },
    voice(who) {
        if (!Audio2.ok) return;
        const v = VOICES[who] || { p: 420, w: 'square' };
        const f = v.p * (1 + (Math.random() - 0.5) * (v.wob || 0.12));
        Audio2.tone(v.w || 'square', f, Audio2.now(), 0.045, v.v || 0.07);
    },
};

/* songs: each part a string of notes, one per step ("-" rest, "." hold). bpm, steps of a 16th */
const SONGS = {};
function song(id, o) { SONGS[id] = o; o.parsed = o.parts.map(p => ({ wave: p.wave, vol: p.vol, oct: p.oct || 0, notes: parseNotes(p.notes) })); o.len = Math.max(...o.parsed.map(p => p.notes.length)); }
function parseNotes(s) {
    const out = []; const toks = s.trim().split(/\s+/);
    for (const t of toks) {
        if (t === '.') { for (let j = out.length - 1; j >= 0; j--) if (out[j]) { out[j].len++; break; } out.push(null); continue; }
        if (t === '-') { out.push(null); continue; }
        if (t === 'k' || t === 's' || t === 'h') { out.push({ drum: t, len: 1 }); continue; }
        out.push({ f: NOTE[t], len: 1 });
    }
    return out;
}
const Music = {
    src: null, voices: [], lastStep: -1, quiet: 0,
    mapChanged() { this.cut(); },
    cut() { const t = Audio2.now(); for (const v of this.voices) { try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 0.015); v.o.stop(t + 0.03); } catch (e) { } } this.voices = []; },
    /* called every step: the nearest seen source plays; its own clock moved while it was seen (in its update) */
    update() {
        if (!Audio2.ok || !World.map) return;
        let best = null, bd = 1e9;
        const fr = Cam.homeRect(), cx = fr.x + fr.w / 2, cy = fr.y + fr.h / 2;
        for (const e of World.map.ents) {
            if (!e.song || !e.seen || !exists(e)) continue;
            const d = dist(ecx(e), ecy(e), cx, cy) - (e.loud || 0);
            if (d < bd) { bd = d; best = e; }
        }
        if (Cam.eye && !G.flags.lit) best = this.eyeSrc || (this.eyeSrc = { song: 'eye', st: {}, vol: 1 });
        if (this.eyeSrc && best === this.eyeSrc) this.eyeSrc.st.mpos = (this.eyeSrc.st.mpos || 0) + STEP;
        if (G.state === 'title' || G.state === 'ending' && Ending.phase !== 'credits') best = null;
        if (G.state === 'ending' && Ending.phase === 'credits') { best = this.endSrc || (this.endSrc = { song: 'lullaby', st: {}, vol: 1 }); this.endSrc.st.mpos += STEP; }
        if (best !== this.src) { this.cut(); this.src = best; this.lastStep = -1; }
        if (!best) return;
        const S = SONGS[best.song]; if (!S) return;
        const stepLen = 60 / S.bpm / 4;
        const step = Math.floor((best.st.mpos || 0) / stepLen);
        if (step === this.lastStep) return;
        if (this.lastStep >= 0 && step > this.lastStep + 4) { this.lastStep = step - 1; }
        for (let s = Math.max(this.lastStep + 1, step); s <= step; s++) this.playStep(S, s % S.len, stepLen, best.vol || 1);
        this.lastStep = step;
    },
    playStep(S, i, stepLen, vol) {
        const t = Audio2.now() + 0.01;
        for (const p of S.parsed) {
            const n = p.notes[i % p.notes.length]; if (!n) continue;
            let v;
            if (n.drum) v = Audio2.noise(t, n.drum === 'k' ? 0.12 : n.drum === 's' ? 0.1 : 0.03, (n.drum === 'h' ? 0.05 : 0.18) * p.vol * vol, Audio2.mus, n.drum === 'k' ? 60 : n.drum === 's' ? 1500 : 7000);
            else v = Audio2.tone(p.wave, n.f * Math.pow(2, p.oct), t, n.len * stepLen * 0.95, p.vol * vol, Audio2.mus);
            if (v) this.voices.push(v);
        }
        if (this.voices.length > 40) this.voices.splice(0, this.voices.length - 40);
    },
};
/* a source's clock: call from its update (so it only moves while seen) */
function musicStep(e, dt) { e.st.mpos = (e.st.mpos || 0) + dt; }

/* the island's own small sounds, from whatever is in view: the sea, birds by day, crickets at night, wind up high */
const Ambience = {
    next: 0,
    update() {
        if (!Audio2.ok || !World.map || G.state !== 'play' || World.lapse) return;
        if (G.t < this.next) return;
        this.next = G.t + 2.5 + Math.random() * 4;
        const r = Cam.homeRect(), m = World.map;
        if (m.def.indoor) { if (m.id === 'bakery' || m.id === 'home') Ambience.crackle(); return; }
        let water = 0, n = 0, wild = 0, gravel = 0;
        for (let y = Math.floor(r.y / TILE); y < (r.y + r.h) / TILE; y += 2) for (let x = Math.floor(r.x / TILE); x < (r.x + r.w) / TILE; x += 2) {
            const ch = m.t(x, y), t = TT[ch]; n++;
            if (t && t.water) water++; else if (ch === 'p' || ch === '#') gravel++; else if (ch === 'G' || ch === 'P' || ch === '"' || ch === '.' || ch === ',') wild++;
        }
        if (!n) return;
        const t = Audio2.now(), night = Light.night();
        if (water / n > 0.2) Audio2.noise(t, 1.6, 0.05 * (water / n), Audio2.sfx, 300);
        else if (gravel / n > 0.4) Audio2.noise(t, 1.2, 0.025, Audio2.sfx, 900);
        if (wild / n > 0.3) {
            if (night) { for (let i = 0; i < 3; i++) Audio2.tone('sine', 4200 + Math.random() * 300, t + i * 0.09, 0.04, 0.02); }
            else { const f = 2400 + Math.random() * 1200; Audio2.tone('sine', f, t, 0.08, 0.03, null, f * 1.3); Audio2.tone('sine', f * 1.1, t + 0.12, 0.07, 0.025, null, f * 0.9); }
        }
    },
    crackle() { const t = Audio2.now(); for (let i = 0; i < 4; i++) Audio2.noise(t + Math.random() * 0.8, 0.03, 0.03, Audio2.sfx, 2000); },
};
