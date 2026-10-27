/* ---- 6s_voices.js ---- */
/* Everyone's voice is a little burble of sounds while their words type out (like the critters in Animal Crossing or
   the gang in Banjo-Kazooie), and each voice sounds like what they're made of: Maki's precise little clicks, Kai's
   wavy surfer wub, Basil's noodly slides, Wonton's bubbles, Chili's sizzle, Coco's smooth chocolate, Cece's nervous
   wobble, Clementine's zesty pops, Cuke's crunch, Sully's gruff honk, Ginger's cookie snap, Brulee's caramel crack,
   Mac's gooey cheese stretch... */
const VOICES = {
    //         base Hz, wave,       end x, dur,   vib [Hz, depth], click [vol, Hz], filter [type, Hz, Q], vol,  gap
    maki:   { f: 520, w: 'square', end: 0.82, dur: 0.035, click: [0.05, 5200], filt: ['lowpass', 2600, 1], vol: 0.04, gap: 0.05 },
    kai:    { f: 300, w: 'triangle', end: 1.12, dur: 0.075, vib: [9, 14], vol: 0.07, gap: 0.06, glide: 1.06 },
    basil:  { f: 290, w: 'sine', end: 1.35, dur: 0.08, vol: 0.075, gap: 0.06, slide: true },
    wonton: { f: 470, w: 'sine', end: 0.55, dur: 0.06, vol: 0.075, gap: 0.05, bubble: true },
    chili:  { f: 640, w: 'square', end: 0.9, dur: 0.04, click: [0.035, 7000, 'highpass'], filt: ['lowpass', 3200, 2], vol: 0.035, gap: 0.045, sizzle: true },
    coco:   { f: 420, w: 'triangle', end: 0.86, dur: 0.085, vib: [5, 6], filt: ['lowpass', 1500, 1], vol: 0.07, gap: 0.065 },
    cece:   { f: 600, w: 'sine', end: 1.02, dur: 0.07, vib: [18, 22], vol: 0.06, gap: 0.05 },
    clementine: { f: 520, w: 'square', end: 1.4, dur: 0.04, filt: ['lowpass', 2800, 3], vol: 0.04, gap: 0.055 },
    cuke:   { f: 700, w: 'square', end: 0.9, dur: 0.028, click: [0.06, 6000], filt: ['lowpass', 3600, 1], vol: 0.035, gap: 0.04 },
    sully:  { f: 175, w: 'sawtooth', end: 0.88, dur: 0.07, filt: ['bandpass', 1100, 2.5], vol: 0.11, gap: 0.06 },
    ginger: { f: 440, w: 'square', end: 0.92, dur: 0.045, click: [0.05, 3800], filt: ['lowpass', 2200, 1], vol: 0.04, gap: 0.05 },
    brulee: { f: 480, w: 'sine', end: 0.96, dur: 0.07, click: [0.04, 8000, 'highpass'], vol: 0.07, gap: 0.06, crackle: true },
    mac:    { f: 330, w: 'sine', end: 0.72, dur: 0.1, vib: [4, 10], vol: 0.08, gap: 0.07 },
    fortune: { f: 620, w: 'triangle', end: 1.05, dur: 0.05, click: [0.04, 5000], vol: 0.06, gap: 0.05, bell: true },
    floss:  { f: 700, w: 'sine', end: 1.15, dur: 0.07, breath: 0.025, vol: 0.055, gap: 0.055 },
    waffle: { f: 330, w: 'square', end: 0.94, dur: 0.05, filt: ['lowpass', 1400, 1], vol: 0.05, gap: 0.055 },
    wasabi: { f: 380, w: 'sawtooth', end: 1.25, dur: 0.05, vib: [22, 30], filt: ['lowpass', 2400, 2], vol: 0.045, gap: 0.05 },
    goat:   { f: 210, w: 'sawtooth', end: 0.92, dur: 0.12, vib: [11, 18], filt: ['lowpass', 1300, 1], vol: 0.07, gap: 0.09 },
    joe:    { f: 250, w: 'triangle', end: 0.94, dur: 0.07, filt: ['lowpass', 1800, 0.7], vol: 0.08, gap: 0.06 },
    david:  { f: 400, w: 'triangle', end: 1.08, dur: 0.06, vol: 0.07, gap: 0.05, bell: true },
    james:  { f: 270, w: 'triangle', end: 0.94, dur: 0.06, vol: 0.075, gap: 0.06 },
    john:   { f: 240, w: 'triangle', end: 0.92, dur: 0.06, vol: 0.075, gap: 0.06 },
    elizabeth: { f: 470, w: 'sine', end: 1.0, dur: 0.06, vol: 0.07, gap: 0.055 },
    scampi: { f: 150, w: 'sawtooth', end: 0.84, dur: 0.08, vib: [5, 9], filt: ['lowpass', 1000, 1.4], vol: 0.09, gap: 0.07 },   // gravelly, an old sea dog
    mug:    { f: 540, w: 'triangle', end: 1.15, dur: 0.035, vib: [14, 10], vol: 0.06, gap: 0.035, bell: true },   // quick and clinky: a lot of coffee
    ghost:  { f: 330, w: 'sine', end: 0.9, dur: 0.2, vib: [5, 6], vol: 0.05, gap: 0.13, breath: 0.01, airy: true },   // a soft, airy "oooh"
    sarah:  { f: 520, w: 'sine', end: 1.0, dur: 0.05, vol: 0.05, gap: 0.055 },
};
const VOICE_STEPS = [0, 2, 4, 7, 9, 12, 14, 7];            // a pentatonic wobble, so it sounds friendly, not random
const Voices = {
    last: 0,
    profile(sp, info) {
        if (VOICES[sp]) return VOICES[sp];
        if (info && info.voice) return { f: info.voice, w: info.wave || 'square', end: 0.94, dur: 0.045, vol: 0.045, gap: 0.05 };
        return null;
    },
    /* one little sound for a typed letter */
    blip(sp, info, code) {
        const P = this.profile(sp, info), c = Audio2.ctx;
        if (!P || !c || !Audio2.sfxOn || c.state !== 'running') return;
        const now = c.currentTime;
        if (now - this.last < P.gap) return;
        this.last = now;
        const ch = String.fromCharCode(code || 97).toLowerCase();
        const vowel = 'aeiouy'.includes(ch);
        const step = VOICE_STEPS[(code || 0) % VOICE_STEPS.length] + (vowel ? 2 : 0);
        const f = P.f * Math.pow(2, step / 12) * (P.slide ? 0.9 + Math.random() * 0.2 : 1);
        this.sound(P, f, now);
    },
    sound(P, f, t, volK) {
        const c = Audio2.ctx, vol = P.vol * (volK || 1);
        const o = c.createOscillator(), g = c.createGain();
        let out = g;
        o.type = P.w;
        o.frequency.setValueAtTime(f * (P.bubble ? 1.6 : 1), t);
        if (P.slide) { o.frequency.linearRampToValueAtTime(f * 1.25, t + P.dur * 0.5); o.frequency.linearRampToValueAtTime(f * 0.9, t + P.dur); }
        else o.frequency.exponentialRampToValueAtTime(f * P.end, t + P.dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + (P.airy ? 0.05 : 0.006));
        g.gain.exponentialRampToValueAtTime(0.0006, t + P.dur + 0.02);
        o.connect(g);
        if (P.filt) {
            const fl = c.createBiquadFilter();
            fl.type = P.filt[0]; fl.frequency.value = P.filt[1]; fl.Q.value = P.filt[2] || 1;
            g.connect(fl); out = fl;
        }
        out.connect(Audio2.sfx);
        let lfo = null;
        if (P.vib) {
            lfo = c.createOscillator();
            const lg = c.createGain();
            lfo.frequency.value = P.vib[0]; lg.gain.value = P.vib[1];
            lfo.connect(lg); lg.connect(o.frequency);
            lfo.start(t); lfo.stop(t + P.dur + 0.05);
        }
        o.start(t); o.stop(t + P.dur + 0.05);
        if (P.bell) {
            const o2 = c.createOscillator(), g2 = c.createGain();
            o2.type = 'sine'; o2.frequency.value = f * 3;
            g2.gain.setValueAtTime(vol * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + P.dur * 1.6);
            o2.connect(g2); g2.connect(Audio2.sfx); o2.start(t); o2.stop(t + P.dur * 1.7);
        }
        if (P.airy) {
            // a faint octave above, fading in and out: ghostly, not buzzy
            const o4 = c.createOscillator(), g4 = c.createGain();
            o4.type = 'sine'; o4.frequency.setValueAtTime(f * 2, t); o4.frequency.exponentialRampToValueAtTime(f * 2 * P.end, t + P.dur);
            g4.gain.setValueAtTime(0.0001, t); g4.gain.linearRampToValueAtTime(vol * 0.18, t + 0.06); g4.gain.exponentialRampToValueAtTime(0.0005, t + P.dur + 0.05);
            o4.connect(g4); g4.connect(Audio2.sfx); o4.start(t); o4.stop(t + P.dur + 0.08);
        }
        if (P.echo) {
            const o3 = c.createOscillator(), g3 = c.createGain();
            o3.type = 'sine'; o3.frequency.value = f * 0.998;
            g3.gain.setValueAtTime(0.0001, t + 0.11); g3.gain.linearRampToValueAtTime(vol * 0.4, t + 0.12); g3.gain.exponentialRampToValueAtTime(0.0005, t + 0.11 + P.dur);
            o3.connect(g3); g3.connect(Audio2.sfx); o3.start(t + 0.1); o3.stop(t + 0.14 + P.dur);
        }
        if (P.click) this.noise(t, 0.012, P.click[0] * (volK || 1), P.click[1], P.click[2] || 'bandpass');
        if (P.sizzle && Math.random() < 0.5) this.noise(t + 0.01, 0.045, 0.02 * (volK || 1), 6500, 'highpass');
        if (P.crackle && Math.random() < 0.35) this.noise(t, 0.008, 0.05 * (volK || 1), 3000, 'bandpass');
        if (P.breath) this.noise(t, P.dur, P.breath * (volK || 1), 4000, 'bandpass');
    },
    noise(t, dur, vol, freq, type) {
        const c = Audio2.ctx;
        const n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
        n.buffer = Audio2.noise;
        fl.type = type; fl.frequency.value = freq; fl.Q.value = 1;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
        n.connect(fl); fl.connect(g); g.connect(Audio2.sfx);
        n.start(t, Math.random() * 0.4); n.stop(t + dur + 0.02);
    },
    /* a happy little three-note chirp in their voice (the first hello of the day) */
    chirp(id) {
        const P = VOICES[id], c = Audio2.ctx;
        if (!P || !c || !Audio2.sfxOn || c.state !== 'running') return;
        const t = c.currentTime + 0.02;
        [0, 4, 7].forEach((st, i) => this.sound(P, P.f * Math.pow(2, (st + 5) / 12), t + i * 0.07, 0.8));
    },
};

