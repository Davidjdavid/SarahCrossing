/* ---- 60_audio.js ---- */
/* Sound: a tiny synth, hourly island music, the club songs, effects and voices */
const AUDIO_KEY = 'sarah-crossing-audio';
const Audio2 = {
    ctx: null, master: null, music: null, sfx: null, noise: null, musicOn: true, sfxOn: true, started: false,
    loadPrefs() {
        try { const p = JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}'); if (p.m === false) this.musicOn = false; if (p.s === false) this.sfxOn = false; } catch (e) { /* ignore */ }
    },
    savePrefs() { try { localStorage.setItem(AUDIO_KEY, JSON.stringify({ m: this.musicOn, s: this.sfxOn })); } catch (e) { /* ignore */ } },
    unlock() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { this.ctx = new AC(); }
            const c = this.ctx;
            this.master = c.createGain(); this.master.gain.value = 0.8;
            const comp = c.createDynamicsCompressor();
            comp.threshold.value = -14; comp.ratio.value = 3;
            this.master.connect(comp); comp.connect(c.destination);
            this.music = c.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
            this.sfx = c.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
            const len = c.sampleRate;
            this.noise = c.createBuffer(1, len, c.sampleRate);
            const d = this.noise.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        MusicFile.init();
        MusicFile.resume();
        if (!this.started) { this.started = true; Music.update(true); }
    },
    ok() { return this.ctx && this.ctx.state === 'running'; },
    now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
};

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

/* one note on an instrument, scheduled at time t */
function playNote(dest, instr, midi, t, dur, vol) {
    const c = Audio2.ctx;
    if (!c) return;
    const f = mtof(midi);
    const g = c.createGain();
    g.connect(dest);
    const env = (a, d, s, r, peak) => {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + a);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * s), t + a + d);
        g.gain.setValueAtTime(Math.max(0.0002, peak * s), t + Math.max(a + d, dur));
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
        return t + Math.max(a + d, dur) + r + 0.05;
    };
    const osc = (type, freq, gain, detune) => {
        const o = c.createOscillator();
        o.type = type; o.frequency.value = freq;
        if (detune) o.detune.value = detune;
        if (gain != null && gain !== 1) { const og = c.createGain(); og.gain.value = gain; o.connect(og); og.connect(g); } else o.connect(g);
        return o;
    };
    let end, os = [];
    switch (instr) {
        case 'kalimba':
            end = env(0.004, 0.5, 0.05, 0.3, vol);
            os = [osc('sine', f, 1), osc('sine', f * 2, 0.18), osc('triangle', f, 0.25)];
            break;
        case 'piano':
            end = env(0.005, 0.9, 0.15, 0.4, vol);
            os = [osc('triangle', f, 1), osc('sine', f * 2, 0.3), osc('sine', f * 3, 0.08)];
            break;
        case 'bell':
            end = env(0.003, 1.2, 0.06, 0.6, vol);
            os = [osc('sine', f, 1), osc('sine', f * 2.76, 0.22), osc('sine', f * 5.4, 0.06)];
            break;
        case 'box':      // music box
            end = env(0.002, 0.7, 0.02, 0.3, vol);
            os = [osc('sine', f * 2, 1), osc('sine', f * 4, 0.12)];
            break;
        case 'flute': {
            end = env(0.06, 0.15, 0.8, 0.18, vol);
            const o = osc('sine', f, 1);
            const lfo = c.createOscillator(), lg = c.createGain();
            lfo.frequency.value = 5.5; lg.gain.value = f * 0.006;
            lfo.connect(lg); lg.connect(o.frequency);
            lfo.start(t); lfo.stop(end);
            os = [o, osc('triangle', f, 0.2)];
            break;
        }
        case 'pluck': {
            end = env(0.003, 0.22, 0.05, 0.1, vol);
            const lp = c.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.2);
            g.disconnect(); g.connect(lp); lp.connect(dest);
            os = [osc('square', f, 0.5), osc('triangle', f, 0.6)];
            break;
        }
        case 'bass':
            end = env(0.006, 0.35, 0.3, 0.12, vol);
            os = [osc('triangle', f, 1), osc('sine', f, 0.6)];
            break;
        case 'pad': {
            end = env(0.35, 0.4, 0.7, 0.6, vol);
            const lp = c.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 900;
            g.disconnect(); g.connect(lp); lp.connect(dest);
            os = [osc('sawtooth', f, 0.5, -7), osc('sawtooth', f, 0.5, 7)];
            break;
        }
        case 'lead': {
            end = env(0.005, 0.18, 0.45, 0.12, vol);
            const lp = c.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 3;
            g.disconnect(); g.connect(lp); lp.connect(dest);
            os = [osc('square', f, 0.55), osc('sawtooth', f, 0.25, 6)];
            break;
        }
        case 'stab': {
            end = env(0.004, 0.12, 0.1, 0.06, vol);
            const lp = c.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 1800;
            g.disconnect(); g.connect(lp); lp.connect(dest);
            os = [osc('square', f, 0.5), osc('square', f * 1.5, 0.3)];
            break;
        }
        default:
            end = env(0.005, 0.2, 0.1, 0.1, vol);
            os = [osc('sine', f, 1)];
    }
    for (const o of os) { o.start(t); o.stop(end); }
}
function playDrum(dest, kind, t, vol) {
    const c = Audio2.ctx;
    if (!c) return;
    const g = c.createGain();
    g.connect(dest);
    if (kind === 'kick') {
        const o = c.createOscillator();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        o.connect(g); o.start(t); o.stop(t + 0.26);
        return;
    }
    const n = c.createBufferSource();
    n.buffer = Audio2.noise;
    const f = c.createBiquadFilter();
    let len = 0.05;
    if (kind === 'hat') { f.type = 'highpass'; f.frequency.value = 7000; len = 0.035; }
    else if (kind === 'shaker') { f.type = 'bandpass'; f.frequency.value = 5500; f.Q.value = 1.2; len = 0.06; }
    else if (kind === 'snare' || kind === 'clap') { f.type = 'bandpass'; f.frequency.value = kind === 'clap' ? 1400 : 1900; f.Q.value = 0.8; len = kind === 'clap' ? 0.14 : 0.12; }
    n.connect(f); f.connect(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.start(t, Math.random() * 0.5); n.stop(t + len + 0.02);
    if (kind === 'snare') {
        const o = c.createOscillator(), og = c.createGain();
        o.frequency.value = 190; og.gain.setValueAtTime(vol * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.1);
    }
}

/* ---------------------------------------------------------------- composition helpers */
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
function degToMidi(root, scale, tok) {
    let oct = 0;
    while (tok[0] === '^') { oct += 12; tok = tok.slice(1); }
    while (tok[tok.length - 1] === 'v') { oct -= 12; tok = tok.slice(0, -1); }
    const d = parseInt(tok, 10) - 1;
    const sc = SCALES[scale];
    return root + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7) + oct;
}
function chordMidi(root, scale, deg) {
    const sc = SCALES[scale];
    const d = deg - 1;
    return [0, 2, 4].map(k => root + sc[(d + k) % 7] + 12 * Math.floor((d + k) / 7));
}
/* build an event list for a piece: returns { events: [{s (step), kind, ...}], steps, stepDur, melody } */
function compose(p) {
    const ev = [];
    const spb = 8;                      // steps per bar (8th notes)
    const form = Array.from(p.form);
    const bars = form.length;
    const melody = [];
    form.forEach((sec, bar) => {
        const chordDeg = p.chords[bar % p.chords.length];
        const ch = chordMidi(p.root, p.scale, chordDeg);
        const s0 = bar * spb;
        // melody
        if (sec !== '_' && p.mel[sec]) {
            const toks = p.mel[sec].split(/\s+/);
            toks.forEach((tk, i) => {
                if (tk === '.' || tk === '-') return;
                let len = 1;
                for (let j = i + 1; j < toks.length && toks[j] === '.'; j++) len++;
                const m = degToMidi(p.root + 12, p.scale, tk);
                ev.push({ s: s0 + i, kind: 'note', instr: p.lead, midi: m + (p.leadOct || 0), dur: Math.min(len, p.hold || 3), vol: p.leadVol || 0.22 });
                melody.push({ s: s0 + i, midi: m });
            });
        }
        // bass
        if (p.bass) {
            const pat = p.bass;
            for (let i = 0; i < spb; i++) {
                const c = pat[i];
                if (c === 'x') ev.push({ s: s0 + i, kind: 'note', instr: 'bass', midi: ch[0] - 12, dur: 1.5, vol: p.bassVol || 0.28 });
                else if (c === 'o') ev.push({ s: s0 + i, kind: 'note', instr: 'bass', midi: ch[0], dur: 1, vol: (p.bassVol || 0.28) * 0.8 });
                else if (c === '5') ev.push({ s: s0 + i, kind: 'note', instr: 'bass', midi: ch[0] - 5, dur: 1, vol: (p.bassVol || 0.28) * 0.9 });
            }
        }
        // chords: sustained pad or broken arpeggio
        if (p.pad) ch.forEach(m => ev.push({ s: s0, kind: 'note', instr: p.pad, midi: m, dur: 8, vol: p.padVol || 0.05 }));
        if (p.arp) {
            const order = [0, 1, 2, 1, 0, 1, 2, 1];
            for (let i = 0; i < spb; i++) if (p.arp[i] === 'x') ev.push({ s: s0 + i, kind: 'note', instr: p.arpInstr || 'pluck', midi: ch[order[i]] + (p.arpOct || 0), dur: 1, vol: p.arpVol || 0.07 });
        }
        if (p.stab) for (let i = 0; i < spb; i++) if (p.stab[i] === 'x') ch.forEach(m => ev.push({ s: s0 + i, kind: 'note', instr: 'stab', midi: m + 12, dur: 0.5, vol: 0.045 }));
        // drums
        if (p.drums && (sec !== '_' || p.introDrums !== false)) {
            for (const [kind, pat] of Object.entries(p.drums)) {
                for (let i = 0; i < spb; i++) if (pat[i] === 'x') ev.push({ s: s0 + i, kind: 'drum', drum: kind, vol: (p.drumVol || 0.5) * ({ kick: 1, snare: 0.5, clap: 0.5, hat: 0.18, shaker: 0.2 }[kind]) });
                    else if (pat[i] === 'o') ev.push({ s: s0 + i, kind: 'drum', drum: kind, vol: (p.drumVol || 0.5) * 0.09 });
            }
        }
    });
    ev.sort((a, b) => a.s - b.s);
    return { events: ev, steps: bars * spb, stepDur: 60 / p.bpm / 2, melody };
}

const TUNES = {
    morning: { bpm: 92, root: 60, scale: 'major', lead: 'kalimba', chords: [1, 6, 4, 5, 1, 6, 2, 5], form: 'ABCDEFGH',
        mel: { A: '5 . 3 . 5 6 5 3', B: '6 . 5 . 3 . 2 .', C: '4 . 6 . ^1 . 6 5', D: '5 . . . 2 . 3 .', E: '5 . 3 . 5 6 ^1 ^2', F: '^3 . ^2 . ^1 . 6 .', G: '4 . 6 . 5 . 2 .', H: '1 . . . . . . .' },
        bass: 'x...x...', arp: '..x...x.', arpInstr: 'kalimba', arpVol: 0.05, drums: { shaker: '.x.x.x.x' }, drumVol: 0.35 },
    midday: { bpm: 104, root: 65, scale: 'major', lead: 'piano', chords: [1, 5, 6, 4, 1, 5, 4, 1], form: 'ABCDEFGH',
        mel: { A: '1 . 3 5 . 3 5 6', B: '5 . 3 . 2 . . .', C: '3 . 5 6 . 5 6 ^1', D: '6 . 5 . 4 . . .', E: '1 . 3 5 . 3 5 6', F: '^1 . 7 . 6 . 5 .', G: '4 . 6 . 5 . 3 2', H: '1 . . . . . . .' },
        leadOct: -12, bass: 'x.o.x.o.', arp: 'x.x.x.x.', arpVol: 0.045, drums: { kick: 'x...x...', hat: '..x...x.', shaker: 'o.o.o.o.' }, drumVol: 0.3 },
    afternoon: { bpm: 96, root: 62, scale: 'major', lead: 'flute', chords: [1, 4, 1, 5, 6, 4, 5, 1], form: 'ABCDEFGH',
        mel: { A: '3 . . 2 1 . 2 3', B: '4 . . 3 2 . . .', C: '3 . . 5 ^1 . 7 6', D: '5 . . . . . . .', E: '6 . . 5 4 . 3 4', F: '5 . . 4 3 . 2 .', G: '2 . 3 . 4 . 7v .', H: '1 . . . . . . .' },
        leadVol: 0.16, bass: 'x...5...', arp: 'x.x.x.x.', arpVol: 0.05, drums: { shaker: '..x...x.' }, drumVol: 0.3 },
    evening: { bpm: 84, root: 58, scale: 'major', lead: 'kalimba', chords: [1, 3, 4, 4, 1, 6, 2, 5], form: 'ABCDEFGH',
        mel: { A: '5 . 6 . 5 . 3 .', B: '2 . 3 . 5 . . .', C: '6 . 5 . 4 . 5 6', D: '5 . . . . . . .', E: '3 . 5 . ^1 . 6 5', F: '6 . 5 . 3 . 2 .', G: '2 . 3 . 4 . 2 .', H: '1 . . . . . . .' },
        pad: 'pad', padVol: 0.035, bass: 'x.......', drums: { shaker: '....x...' }, drumVol: 0.3 },
    night: { bpm: 76, root: 63, scale: 'major', lead: 'bell', chords: [1, 6, 4, 5, 1, 6, 4, 1], form: 'ABCDEFGH',
        mel: { A: '5 . . . 3 . . .', B: '6 . . 5 . . 3 .', C: '4 . . . 6 . . .', D: '5 . . . . . . .', E: '^1 . . 6 . . 5 .', F: '3 . . . 5 . . .', G: '4 . 3 . 2 . . .', H: '1 . . . . . . .' },
        leadVol: 0.14, pad: 'pad', padVol: 0.03, bass: 'x.......', bassVol: 0.18 },
    late: { bpm: 68, root: 57, scale: 'minor', lead: 'box', chords: [1, 6, 3, 7, 1, 4, 5, 1], form: 'ABCDEFGH',
        mel: { A: '1 . 3 . 5 . 3 .', B: '6 . 5 . 3 . . .', C: '5 . 3 . 2 . 1 .', D: '2 . . . . . . .', E: '1 . 3 . 5 . ^1 .', F: '7 . 6 . 5 . . .', G: '4 . 3 . 2 . 7v .', H: '1 . . . . . . .' },
        leadVol: 0.12, pad: 'pad', padVol: 0.025 },
    home: { bpm: 80, root: 55, scale: 'major', lead: 'piano', chords: [1, 6, 2, 5, 1, 6, 4, 5], form: 'ABCDEFGH',
        mel: { A: '3 . 2 . 1 . 5v .', B: '6v . 1 . 3 . . .', C: '2 . 3 . 4 . 3 2', D: '5 . . . . . . .', E: '3 . 2 . 1 . 5v .', F: '6v . 1 . 3 . 5 .', G: '4 . 3 . 2 . 3 .', H: '1 . . . . . . .' },
        leadVol: 0.17, arp: 'x...x...', arpInstr: 'piano', arpVol: 0.04, arpOct: -12, bass: 'x.......', drums: { kick: 'x.....x.', snare: '....x...', hat: '..o...o.' }, drumVol: 0.22 },
    shop: { bpm: 112, root: 57, scale: 'major', lead: 'pluck', chords: [1, 4, 5, 1, 1, 4, 5, 1], form: 'ABCDABCE',
        mel: { A: '1 3 5 ^1 . 5 3 .', B: '4 6 ^1 . 6 . 4 .', C: '5 7 ^2 . 7 . 5 .', D: '^1 . 5 . 3 . 1 .', E: '^1 . . . . . . .' },
        leadVol: 0.2, bass: 'x.o.x.o.', drums: { kick: 'x...x...', snare: '..x...x.', hat: 'oxoxoxox' }, drumVol: 0.25 },
    boutique: { bpm: 96, root: 62, scale: 'major', lead: 'bell', chords: [2, 5, 1, 6, 2, 5, 1, 1], form: 'ABCDABCE',
        mel: { A: '3 . 5 . ^1 . 7 5', B: '4 . . 2 5 . . .', C: '3 . 5 . ^2 . ^1 7', D: '6 . . 5 3 . . .', E: '^1 . . . . . . .' },
        leadVol: 0.12, bass: 'x..x..x.', arp: '..x...x.', arpInstr: 'piano', arpVol: 0.05, drums: { kick: 'x.....x.', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 },
    studio: { bpm: 76, root: 57, scale: 'major', lead: 'pluck', chords: [1, 6, 4, 5, 1, 6, 2, 5], form: 'ABCDABCE', vary: true,
        mel: { A: '3 . 5 . 6 . 5 3', B: '2 . . . 1 . . .', C: '3 . 5 . 6 . ^1 6', D: '5 . . . . . . .', E: '1 . . . . . . .' },
        leadVol: 0.16, arp: 'x...x.x.', arpInstr: 'kalimba', arpVol: 0.05, bass: 'x...5...', drums: { shaker: '..x...x.', kick: 'x.......' }, drumVol: 0.22 },
    house: { bpm: 88, root: 62, scale: 'major', lead: 'kalimba', chords: [1, 4, 6, 5, 1, 4, 5, 1], form: 'ABCDABCE',
        mel: { A: '5 . 3 . 2 . 1 .', B: '6 . 5 . 3 . . .', C: '5 . 6 . ^1 . 6 5', D: '3 . . . 2 . . .', E: '1 . . . . . . .' },
        leadVol: 0.16, arp: 'x.x.x.x.', arpInstr: 'kalimba', arpVol: 0.04, bass: 'x...x...', drums: { shaker: '..x...x.' }, drumVol: 0.25 },
    arcade: { bpm: 126, root: 60, scale: 'major', lead: 'lead', chords: [1, 6, 4, 5, 1, 6, 2, 5, 4, 4, 1, 1, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '5 . 3 5 ^1 . 5 3', B: '4 . 6 . 5 . 3 .', C: '5 . 3 5 ^1 . ^2 ^1', D: '6 . 5 . 4 . 2 .', E: '1 . 3 . 5 . ^1 .',
            F: '6 . ^1 . 6 5 4 .', G: '5 . 3 . 1 . . .', H: '2 . 4 . 7 . 5 .' },
        leadVol: 0.06, bass: 'x.o.x.o.', arp: 'x.x.x.x.', arpInstr: 'pluck', arpVol: 0.035, drums: { kick: 'x...x...', snare: '....x...', hat: 'oxoxoxox' }, drumVol: 0.2 },
    blocks: { bpm: 138, root: 57, scale: 'minor', lead: 'lead', chords: [1, 7, 6, 5, 1, 7, 4, 5, 6, 7, 1, 1, 4, 5, 1, 5], form: 'ABCDABCEFGFHABCD', vary: true,
        mel: { A: '1 . 5 . 4 3 2 .', B: '3 . 5 . ^1 . 7 .', C: '6 . 4 . 5 3 2 .', D: '3 . 2 . 7v . . .', E: '1 . . . 5v . 1 .',
            F: '^1 . 7 . 6 . 5 .', G: '4 . 5 . 6 . 7 .', H: '5 . 3 . 2 . 7v .' },
        leadVol: 0.07, bass: 'x.x.x.x.', stab: '..x...x.', drums: { kick: 'x...x...', snare: '....x...', hat: 'xoxoxoxo' }, drumVol: 0.2 },
    capsules: { bpm: 120, root: 62, scale: 'major', lead: 'pluck', chords: [1, 4, 5, 1, 6, 4, 2, 5, 6, 3, 4, 5, 6, 3, 2, 5], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '3 5 . 3 6 . 5 .', B: '4 . 2 . 5 . . .', C: '3 5 . 3 ^1 . 6 .', D: '5 . 4 2 1 . . .', E: '1 . 3 . 5 . . .',
            F: '6 . 5 6 ^1 . 6 .', G: '5 . 3 . 5 . . .', H: '4 . 5 . 6 . 7 .' },
        leadVol: 0.14, bass: 'x.xox.xo', arp: '..x...x.', arpInstr: 'kalimba', arpVol: 0.04, drums: { kick: 'x..x..x.', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 },
    fruit: { bpm: 112, root: 65, scale: 'major', lead: 'kalimba', chords: [1, 5, 6, 4, 1, 5, 4, 1, 4, 5, 3, 6, 4, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '1 3 5 . 6 5 3 .', B: '2 . 3 . 5 . . .', C: '1 3 5 . ^1 . 6 5', D: '4 . 3 . 2 . . .', E: '1 . . . . . . .',
            F: '6 . 5 . 4 . 6 .', G: '5 . 7 . ^2 . . .', H: '^1 . 6 . 5 . 3 .' },
        leadVol: 0.15, bass: 'x...5...', arp: 'x.x.x.x.', arpInstr: 'pluck', arpVol: 0.045, drums: { kick: 'x...x...', shaker: 'oxoxoxox', clap: '....x...' }, drumVol: 0.24 },
    stack: { bpm: 108, root: 60, scale: 'major', lead: 'kalimba', chords: [1, 6, 2, 5, 1, 6, 4, 5, 4, 5, 3, 6, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '5 . 6 5 3 . 1 .', B: '2 . 3 . 5 . . .', C: '5 . 6 5 ^1 . 6 5', D: '4 . 3 2 1 . . .', E: '1 . . . 5v . . .',
            F: '6 . 6 5 4 . 5 .', G: '3 . 5 . 7 . . .', H: '6 . 5 . 4 3 2 .' },
        leadVol: 0.15, bass: 'x..ox.o.', arp: '.x.x.x.x', arpInstr: 'pluck', arpVol: 0.035, drums: { kick: 'x...x.x.', clap: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 },
    cooking: { bpm: 116, root: 65, scale: 'major', lead: 'pluck', chords: [1, 4, 5, 1, 6, 2, 5, 1, 4, 4, 1, 6, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '1 . 3 5 . 3 5 .', B: '6 . 5 . 4 . 2 .', C: '1 . 3 5 . ^1 . 6', D: '5 . 3 2 1 . . .', E: '1 . . . . . . .',
            F: '4 . 6 . ^1 . 6 .', G: '5 . 3 . 1 . . .', H: '2 . 3 . 4 . 5 .' },
        leadVol: 0.16, bass: 'x.o.x.o.', arp: 'x.x.x.x.', arpInstr: 'kalimba', arpVol: 0.035, drums: { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.2 },
    workshop: { bpm: 104, root: 55, scale: 'major', lead: 'pluck', chords: [1, 5, 4, 1, 6, 4, 5, 1], form: 'ABCDABCE',
        mel: { A: '1 . 3 . 5 . 3 .', B: '4 . 6 . 5 . 3 .', C: '5 . ^1 . 6 . 5 .', D: '4 . 3 . 2 . . .', E: '1 . . . . . . .' },
        leadVol: 0.16, bass: 'x.x.x.x.', arp: '..x...x.', arpInstr: 'kalimba', arpVol: 0.04, drums: { kick: 'x...x...', clap: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 },
    museum: { bpm: 72, root: 60, scale: 'major', lead: 'piano', chords: [1, 6, 4, 5, 1, 3, 4, 5], form: 'ABCDABCE',
        mel: { A: '5 . . 3 . . 1 .', B: '6 . . 5 . . . .', C: '4 . . 6 . . ^1 .', D: '7 . . . 5 . . .', E: '^1 . . . . . . .' },
        leadVol: 0.14, pad: 'pad', padVol: 0.03, arp: 'x...x...', arpInstr: 'bell', arpVol: 0.03, bass: 'x.......' },
    restaurant: { bpm: 98, root: 58, scale: 'major', lead: 'piano', chords: [1, 6, 2, 5, 3, 6, 2, 5], form: 'ABCDABCE',
        mel: { A: '3 . 5 6 . 5 3 .', B: '2 . 4 . 6 . 5 .', C: '3 . 5 6 . ^1 6 5', D: '4 . 2 . 7v . . .', E: '1 . . . . . . .' },
        leadVol: 0.15, bass: 'x..x.x..', arp: '..x...x.', arpInstr: 'piano', arpVol: 0.045, drums: { kick: 'x.....x.', snare: '....x...', hat: 'o.o.o.o.' }, drumVol: 0.2 },
    sunrise: { bpm: 66, root: 62, scale: 'major', lead: 'bell', chords: [1, 5, 6, 4, 1, 5, 4, 1], form: 'ABCDEFGH',
        mel: { A: '3 . . . 5 . . .', B: '2 . . . 7v . . .', C: '1 . . . 3 . 5 .', D: '6 . . . . . . .', E: '5 . . . ^1 . . .', F: '7 . . . 5 . . .', G: '6 . . . 4 . 2 .', H: '3 . . . . . . .' },
        leadVol: 0.13, pad: 'pad', padVol: 0.04, arp: 'x.x.x.x.', arpInstr: 'kalimba', arpVol: 0.03, bass: 'x.......', bassVol: 0.14 },
    clubday: { bpm: 100, root: 60, scale: 'minor', lead: 'lead', chords: [1, 6, 7, 5], form: '__AB__AB', vary: true,
        mel: { A: '5 . . . 3 . . .', B: '4 . . . 2 . . .' }, leadVol: 0.08, bass: 'x..x..x.', pad: 'pad', padVol: 0.03,
        drums: { kick: 'x...x...', hat: '..x...x.' }, drumVol: 0.3 },
};
const DANCE_TUNES = {
    wiggle: { bpm: 100, root: 65, scale: 'major', lead: 'lead', chords: [1, 5, 6, 4], form: '__ABCDABCDEFABCD', grid: 2,
        mel: { A: '5 . 5 . 6 . 5 .', B: '3 . 2 . 1 . . .', C: '5 . 5 . 6 . ^1 .', D: '6 . 5 . 3 . . .', E: '^1 . 6 . 5 . 6 .', F: '5 . 3 . 2 . 1 .' },
        leadVol: 0.16, bass: 'x.o.x.o.', stab: '.x...x..', drums: { kick: 'x.x.x.x.', clap: '..x...x.', hat: '.x.x.x.x' }, drumVol: 0.45 },
    shuffle: { bpm: 112, root: 62, scale: 'minor', lead: 'lead', chords: [1, 6, 4, 5], form: '__ABCDEFABCDEFAB', grid: 1,
        mel: { A: '1 . 3 4 5 . 4 3', B: '4 . 3 . 1 . . .', C: '1 . 3 4 5 . 7 ^1', D: '7 . 5 . 4 . 3 .', E: '5 5 . 5 7 . 5 .', F: '4 . 3 . 2 . 1 .' },
        leadVol: 0.15, bass: 'x..x.xo.', stab: '..x...x.', drums: { kick: 'x..x.x..', snare: '..x...x.', hat: 'x.xx.xx.' }, drumVol: 0.45 },
    owl: { bpm: 118, root: 57, scale: 'minor', lead: 'lead', chords: [1, 6, 3, 7], form: '__ABCDEFABCDEFCD', grid: 1,
        mel: { A: '5 . 5 6 5 . 3 .', B: '1 . 3 . 5 . 6 .', C: '5 . 5 6 5 . ^1 .', D: '7 . 6 . 5 . . .', E: '^1 . 7 . 6 . 5 .', F: '4 . 5 . 6 . 7 .' },
        leadVol: 0.15, bass: 'x.xox.xo', pad: 'pad', padVol: 0.03, drums: { kick: 'x.x.x.x.', clap: '..x...x.', hat: 'oxoxoxox' }, drumVol: 0.45 },
    disco: { bpm: 124, root: 60, scale: 'major', lead: 'lead', chords: [1, 6, 4, 5], form: '__ABCDABCDEFEFCD', grid: 1,
        mel: { A: '5 6 5 3 5 . 6 ^1', B: '^2 ^1 6 5 6 . . .', C: '5 6 5 3 5 . 3 2', D: '1 2 3 5 3 . . .', E: '^1 . ^1 7 6 . 5 6', F: '5 3 2 3 1 . . .' },
        leadVol: 0.14, bass: 'xoxoxoxo', stab: '.x.x.x.x', drums: { kick: 'x.x.x.x.', clap: '..x...x.', hat: '.x.x.x.x', shaker: 'o.o.o.o.' }, drumVol: 0.45 },
    sonnet: { bpm: 84, root: 63, scale: 'major', lead: 'piano', chords: [1, 6, 4, 5], form: '__ABCDABCDABCDAB', grid: 3,
        mel: { A: '3 . . 5 . . 6 .', B: '5 . . 3 . . 2 .', C: '3 . . 5 . . ^1 .', D: '7 . . 6 . . 5 .' },
        leadVol: 0.2, leadOct: -12, pad: 'pad', padVol: 0.04, bass: 'x....x..', drums: { kick: 'x....x..', snare: '....x...', hat: '..o...o.' }, drumVol: 0.4,
        lyrics: ['The floor is shiny. The floor is bright.', 'I dance on it every night.', 'My shoes go squeak. My arms go wave.',
            'I am a dancer. I am brave.', 'The disco ball is round like cheese.', 'Thank you. Thank you. No applause, please. (Applause, please.)'] },
    // special tracks
    goat: { bpm: 96, root: 60, scale: 'major', lead: 'pluck', chords: [1, 4, 5, 1], form: '__ABCDABCDEFABCD', grid: 3,
        mel: { A: '1 . . 3 . . 5 .', B: '4 . . 6 . . 5 .', C: '5 . . ^1 . . 7 .', D: '6 . . 5 . . 1 .', E: '3 . . 4 . . 5 .', F: '6 . . 7 . . ^1 .' },
        leadVol: 0.2, bass: 'x..o..o.', drums: { kick: 'x.......', clap: '...x..x.', hat: '.o.o.o.o' }, drumVol: 0.35 },
    starlight: { bpm: 108, root: 64, scale: 'major', lead: 'bell', chords: [1, 5, 6, 4], form: '__ABCDABCDEFABCD', grid: 2,
        mel: { A: '5 . 6 . 5 . 3 .', B: '2 . 3 . 5 . . .', C: '^1 . 7 . 6 . 5 .', D: '6 . 5 . 3 . . .', E: '3 . 5 . ^1 . ^2 .', F: '^1 . 7 . 5 . 6 .' },
        leadVol: 0.12, pad: 'pad', padVol: 0.04, arp: 'x.x.x.x.', arpInstr: 'pluck', arpVol: 0.03, bass: 'x...x.o.', drums: { kick: 'x...x...', clap: '..x...x.', hat: 'xoxoxoxo' }, drumVol: 0.42 },
    shanty: { bpm: 116, root: 57, scale: 'minor', lead: 'lead', chords: [1, 7, 6, 5], form: '__ABCDABCDEFABCD', grid: 1,
        mel: { A: '1 . 1 3 5 . 3 1', B: '7 . 5 . 7 . . .', C: '1 . 1 3 5 . 6 5', D: '4 . 3 . 1 . . .', E: '5 5 6 . 5 . 3 .', F: '4 4 3 . 2 . 1 .' },
        leadVol: 0.14, bass: 'x.x.x.x.', stab: '.x.x.x.x', drums: { kick: 'x..x.x..', snare: '..x...x.', hat: 'x.x.x.x.' }, drumVol: 0.45 },
    discocake: { bpm: 128, root: 62, scale: 'major', lead: 'lead', chords: [1, 6, 2, 5], form: '__ABCDABCDEFEFCD', grid: 1,
        mel: { A: '1 3 5 3 6 . 5 3', B: '4 . 3 2 1 . . .', C: '1 3 5 3 ^1 . 7 6', D: '5 6 5 3 2 . . .', E: '^1 . ^1 7 6 5 6 7', F: '^1 7 6 5 4 3 2 1' },
        leadVol: 0.13, bass: 'xoxoxoxo', stab: '.x.x.x.x', drums: { kick: 'x.x.x.x.', clap: '..x...x.', hat: '.x.x.x.x', shaker: 'oooooooo' }, drumVol: 0.45 },
};

const FIXED_TUNES = ['sunrise', 'home', 'clubday', 'shop', 'boutique', 'house', 'studio', 'arcade', 'blocks', 'capsules', 'fruit', 'stack', 'cooking'];
/* tunes marked `vary` change a little every time they come around: a new key, a different groove, the melody turned around */
function retroMel(mel) {
    const out = {};
    for (const [k, v] of Object.entries(mel)) {
        const toks = v.split(/\s+/), notes = toks.filter(t => t !== '.' && t !== '-').reverse();
        let i = 0;
        out[k] = toks.map(t => (t === '.' || t === '-' ? t : notes[i++])).join(' ');
    }
    return out;
}
function tuneVariant(base, k) {
    const v = k % 4;
    if (!base.vary || v === 0) return base;
    const p = Object.assign({}, base, { drums: Object.assign({}, base.drums || {}) });
    if (v === 1) {
        p.root = base.root + 5;
        p.form = base.form.length >= 16 ? base.form.slice(8) + base.form.slice(0, 8) : base.form;
        p.arp = base.arp || 'x.x.x.x.'; p.arpInstr = base.arpInstr || 'pluck'; p.arpVol = (base.arpVol || 0.035) * 1.1;
        if (p.drums.hat) p.drums.hat = 'x.x.x.x.';
    } else if (v === 2) {
        p.root = base.root - 2;
        p.leadOct = (base.leadOct || 0) + 12; p.leadVol = (base.leadVol || 0.15) * 0.8;
        p.lead = base.lead === 'lead' ? 'pluck' : base.lead === 'pluck' ? 'bell' : 'lead';
        p.drums = base.drums ? { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' } : undefined;
        p.pad = 'pad'; p.padVol = 0.025;
    } else {
        p.root = base.root + 2;
        p.mel = retroMel(base.mel);
        p.bass = base.bass ? 'x.x.x.x.' : base.bass;
        p.bpm = base.bpm + 4;
    }
    return p;
}

/* ---------------------------------------------------------------- music player */
const Music = {
    cur: null, want: null, song: null, over: null, scene: null,
    pick() { return musicRule(this.pickBase()); },                   // Sarah's own choices (the Music app) come first
    pickBase() {
        const tune = this.pickTune();
        if (G.introScene || (this.over && !this.scene)) return tune;
        // the soundtracks' own track for the place or the moment (a shop, the museum, a holiday night: SOUNDTRACK)
        const st = MusicLib.scene();
        if (st) return 'lib:' + st;
        // outside and at home, the hour's track from David's music, a game picked at random (60a_music_lib.js)
        if (tune !== this.over && S && S.started && (!G.area || G.area.id === 'island' || G.area.id === 'home')) {
            const p = MusicLib.hourly(Math.floor(Clock.hourF()));
            if (p) return 'lib:' + p;
        }
        return tune;
    },
    pickTune() {
        if (this.over && TUNES[this.over]) return this.over;          // an arcade game's own tune
        if (G.introScene) return 'sunrise';                            // the opening, at sea
        if (!S || !S.started) return 'morning';
        const a = G.area ? G.area.id : 'island';
        if (a === 'home') return 'home';
        if (a === 'club') return 'clubday';
        if (G.area && G.area.room) return TUNES[G.area.room.music] ? G.area.room.music : 'home';
        const h = Clock.hourF();
        if (h >= 5 && h < 10) return 'morning';
        if (h >= 10 && h < 14) return 'midday';
        if (h >= 14 && h < 17) return 'afternoon';
        if (h >= 17 && h < 21) return 'evening';
        if (h >= 21 || h < 1) return 'night';
        return 'late';
    },
    update(force) {
        if (this.song) return;
        const want = this.pick();
        const hour = Math.floor(Clock.hourF());
        const key = want + ':' + (FIXED_TUNES.includes(want) || !TUNES[want] ? 0 : hour);
        // (the same music carries on through a door: only what's playing changing, or the music being switched on or
        // off, starts it again)
        if (key === this.key && (!force || !!this.cur === !!(Audio2.ctx && Audio2.musicOn))) return;
        this.key = key;
        this.play(want, hour);
    },
    play(name, hour) {
        const c = Audio2.ctx;
        this.stop();
        if (!c || !Audio2.musicOn || name === 'silence') return;
        if (/^(lib|own|mysong):/.test(name)) {
            // a track from a file (the soundtracks on the server, or the player's own); the island's tune if it can't play
            const d = MusicFile.play(name);
            if (d) { this.cur = { file: d, path: name.replace(/^lib:/, '') }; return; }
            name = this.pickTune();
        }
        const base = TUNES[name] || DANCE_TUNES[name];              // a club song can play on repeat from the Music app
        if (!base) return;
        // each hour gets its own small variation: key and tempo drift
        const p = Object.assign({}, base);
        if (hour != null && TUNES[name] && !FIXED_TUNES.includes(name)) {
            p.root = base.root + [0, 2, -3, 5, -1, 3][hour % 6];
            p.bpm = base.bpm + [0, 4, -3, 6, -5, 2][(hour * 7) % 6];
        }
        const comp = compose(p);
        const g = c.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(1, c.currentTime + 1.2);
        g.connect(Audio2.music);
        this.cur = { comp, gain: g, t0: c.currentTime + 0.1, idx: 0, loops: 0, base: p, vary: !!p.vary, turn: 0 };
    },
    stop() {
        const c = Audio2.ctx;
        if (this.cur && this.cur.file) MusicFile.stop(this.cur.file);
        else if (this.cur && c) {
            const g = this.cur.gain;
            g.gain.cancelScheduledValues(c.currentTime);
            g.gain.setValueAtTime(g.gain.value, c.currentTime);
            g.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
            setTimeout(() => g.disconnect(), 1500);
        }
        this.cur = null;
    },
    tick() {
        const c = Audio2.ctx;
        const cur = this.cur;
        if (!c || !cur || cur.file) return;
        const ahead = c.currentTime + 0.25;
        for (let guard = 0; guard < 200; guard++) {
            const comp = cur.comp, loopDur = comp.steps * comp.stepDur;
            if (cur.idx >= cur.comp.events.length) {
                if (cur.once) return;
                if (cur.vary) {
                    // the next time round is a variation: it starts right where this one ends
                    const end = cur.t0 + (cur.loops + 1) * cur.comp.steps * cur.comp.stepDur;
                    cur.turn++;
                    cur.comp = compose(tuneVariant(cur.base, cur.turn));
                    cur.t0 = end; cur.loops = 0; cur.idx = 0;
                    continue;
                }
                cur.idx = 0; cur.loops++;
            }
            const e = comp.events[cur.idx];
            if (!e) break;
            const t = cur.t0 + cur.loops * loopDur + e.s * comp.stepDur;
            if (t > ahead) break;
            if (t > c.currentTime - 0.05) {
                if (e.kind === 'note') playNote(cur.gain, e.instr, e.midi, t, e.dur * comp.stepDur, e.vol);
                else playDrum(cur.gain, e.drum, t, e.vol);
            }
            cur.idx++;
        }
    },
    /* a dance (or karaoke) song: plays once, returns the chart */
    startSong(id, spec) {
        const p = spec || DANCE_TUNES[id];
        const comp = compose(p);
        const sd = comp.stepDur;
        const grid = p.grid || 1;
        const chart = [];
        let prev = null, alt = 0;
        for (const m of comp.melody) {
            if (grid > 1 && (m.s % 8) % grid !== 0) continue;
            let lane;
            if (prev == null) lane = 1;
            else if (m.midi > prev + 4) lane = 3;
            else if (m.midi < prev - 4) lane = 0;
            else if (m.midi > prev) lane = 2;
            else if (m.midi < prev) lane = 1;
            else lane = (alt++ % 2) ? 0 : 3;
            prev = m.midi;
            chart.push({ t: m.s * sd, lane });
        }
        const duration = comp.steps * sd;
        const lyrics = p.lyrics ? p.lyrics.map((text, i) => ({ t: (16 + i * 16) * sd, text })) : null;
        this.stop();
        this.song = { comp, chart };
        const c = Audio2.ctx;
        if (c && Audio2.musicOn) {
            const g = c.createGain();
            g.gain.value = 1;
            g.connect(Audio2.music);
            this.cur = { comp, gain: g, t0: c.currentTime + 0.3, idx: 0, loops: 0, once: true };
            this.song.t0 = this.cur.t0;
            this.song.audio = true;
        } else {
            this.song.wall0 = performance.now() / 1000 + 0.3;
        }
        return { chart, duration, lead: 16 * sd, beat: sd * 2, lyrics };
    },
    /* one of Sarah's own songs, from its file (6zo_mysongs.js): f is { buf, chart, beat, dur } */
    startFile(f) {
        this.stop();
        this.cur = null;
        const c = Audio2.ctx;
        this.song = { chart: f.chart };
        if (c && Audio2.musicOn) {
            const src = c.createBufferSource();
            src.buffer = f.buf;
            src.connect(Audio2.music);
            const t0 = c.currentTime + 0.3;
            src.start(t0);
            Object.assign(this.song, { t0, audio: true, src });
        } else this.song.wall0 = performance.now() / 1000 + 0.3;
        return { chart: f.chart, duration: f.dur, lead: f.chart.length ? f.chart[0].t : 2, beat: f.beat, lyrics: null };
    },
    songTime() {
        const s = this.song;
        if (!s) return 0;
        if (s.audio && Audio2.ctx) {
            const lat = (Audio2.ctx.outputLatency || 0) + (Audio2.ctx.baseLatency || 0);
            return Audio2.ctx.currentTime - s.t0 - lat;
        }
        return performance.now() / 1000 - s.wall0;
    },
    stopSong() {
        if (this.song && this.song.src) { try { this.song.src.stop(); } catch (e) { /* already stopped */ } }
        this.song = null;
        this.stop();
        this.key = null;
        this.update(true);
    },
};

/* ---------------------------------------------------------------- effects */
const Sfx = {
    _voiceT: 0,
    tone(type, f0, f1, dur, vol, delay) {
        const c = Audio2.ctx;
        if (!c || !Audio2.sfxOn || c.state !== 'running') return;
        const t = c.currentTime + (delay || 0);
        const o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.connect(g); g.connect(Audio2.sfx);
        o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, freq, vol, delay, type) {
        const c = Audio2.ctx;
        if (!c || !Audio2.sfxOn || c.state !== 'running') return;
        const t = c.currentTime + (delay || 0);
        const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        n.buffer = Audio2.noise;
        f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        n.connect(f); f.connect(g); g.connect(Audio2.sfx);
        n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.02);
    },
    notes(seq, instr, vol, step) {
        const c = Audio2.ctx;
        if (!c || !Audio2.sfxOn || c.state !== 'running') return;
        seq.forEach((m, i) => playNote(Audio2.sfx, instr || 'kalimba', m, c.currentTime + i * (step || 0.08), 0.1, vol || 0.18));
    },
    play(name) {
        switch (name) {
            case 'pick': this.notes([79, 84], 'kalimba', 0.16, 0.06); break;
            case 'item': this.notes([72, 76, 79, 84], 'kalimba', 0.16, 0.07); break;
            case 'fanfare': this.notes([67, 72, 76, 79, 84, 88], 'kalimba', 0.17, 0.08); break;
            case 'heart': this.notes([76, 79, 84, 88], 'bell', 0.12, 0.09); break;
            case 'buy': this.notes([84, 88], 'bell', 0.12, 0.07); this.noise(0.12, 5000, 0.08, 0.05); break;
            case 'sell': this.notes([79, 84, 91], 'bell', 0.12, 0.06); break;
            case 'cook': this.noise(0.5, 1200, 0.1); this.notes([72, 79, 84], 'kalimba', 0.14, 0.12); break;
            case 'eat': this.noise(0.06, 900, 0.12); this.noise(0.06, 900, 0.12, 0.15); this.noise(0.06, 900, 0.12, 0.3); break;
            case 'rustle': this.noise(0.35, 2400, 0.12); this.noise(0.25, 1600, 0.08, 0.12); break;
            case 'flap': for (let i = 0; i < 4; i++) this.noise(0.05, 1300 + i * 120, 0.05, i * 0.07, 'bandpass'); break;     // (gulls taking off)
            case 'dig': this.noise(0.12, 600, 0.18); this.noise(0.12, 500, 0.14, 0.14); break;
            case 'door': this.tone('triangle', 180, 120, 0.12, 0.15); this.noise(0.08, 800, 0.08, 0.02); break;
            case 'knock': this.tone('sine', 220, 150, 0.08, 0.3); this.tone('sine', 220, 150, 0.08, 0.3, 0.14); break;
            case 'cast': this.noise(0.25, 3000, 0.06, 0, 'highpass'); break;
            case 'plop': this.tone('sine', 900, 300, 0.12, 0.12); break;
            case 'nibble': this.tone('sine', 700, 500, 0.05, 0.08); break;
            case 'bite': this.tone('sine', 1200, 300, 0.18, 0.2); this.noise(0.2, 1500, 0.12); break;
            case 'miss': this.notes([67, 63], 'kalimba', 0.12, 0.12); break;
            case 'reel': this.noise(0.15, 4000, 0.05); break;
            case 'place': this.tone('triangle', 330, 200, 0.08, 0.2); this.noise(0.06, 700, 0.1); break;
            case 'step': this.noise(0.04, 1200, 0.03); break;
            case 'nope': this.tone('square', 200, 150, 0.12, 0.05); break;
            case 'wish': this.notes([84, 88, 91, 96], 'bell', 0.1, 0.12); break;
            case 'firework': this.noise(0.6, 400, 0.15, 0, 'lowpass'); break;
            case 'party': this.notes([72, 76, 79, 84, 79, 84, 88], 'kalimba', 0.16, 0.09); break;
            case 'chop': this.tone('square', 180, 90, 0.07, 0.12); this.noise(0.08, 1100, 0.14); break;
            case 'timber': this.noise(0.5, 500, 0.16, 0, 'lowpass'); this.tone('triangle', 140, 60, 0.4, 0.12, 0.1); break;
            case 'plant': this.noise(0.1, 700, 0.12); this.notes([76, 83], 'kalimba', 0.12, 0.08); break;
            // arcade cabinets, the claw machine, jump rope
            case 'blip': this.tone('square', 660, 620, 0.03, 0.03); break;
            case 'rot': this.tone('square', 880, 990, 0.04, 0.03); break;
            case 'land': this.tone('triangle', 220, 140, 0.06, 0.09); break;
            case 'drop': this.tone('square', 520, 130, 0.1, 0.05); this.noise(0.08, 900, 0.05, 0.04); break;
            case 'line': this.notes([72, 76, 79, 84], 'lead', 0.06, 0.05); break;
            case 'bento': this.notes([72, 76, 79, 84, 88, 91], 'lead', 0.07, 0.05); break;
            case 'bug': this.notes([84, 79, 88], 'pluck', 0.11, 0.05); break;
            case 'catch': this.notes([79, 84], 'pluck', 0.11, 0.04); break;
            case 'gold': this.notes([84, 88, 91, 96], 'bell', 0.09, 0.05); break;
            case 'ouch': this.tone('square', 300, 120, 0.2, 0.06); break;
            case 'splat': this.noise(0.12, 500, 0.1); break;
            case 'gameover': this.notes([72, 67, 64, 60], 'lead', 0.07, 0.14); break;
            case 'levelup': this.notes([72, 79, 84, 91], 'lead', 0.07, 0.07); break;
            case 'claw': this.tone('sawtooth', 110, 116, 0.1, 0.02); break;
            case 'grab': this.tone('square', 300, 200, 0.08, 0.05); break;
            case 'prize': this.notes([72, 76, 79, 84, 88], 'bell', 0.11, 0.08); break;
            case 'ticket': this.tone('square', 1320, 1320, 0.025, 0.025); break;
            case 'jump': this.tone('sine', 440, 880, 0.12, 0.07); break;
            case 'trip': this.tone('triangle', 330, 110, 0.3, 0.1); this.noise(0.15, 600, 0.09); break;
            // the kitchen
            case 'sizzle': this.noise(0.22, 6500, 0.05, 0, 'highpass'); break;
            case 'bubble': this.tone('sine', 420 + Math.random() * 300, 800 + Math.random() * 300, 0.06, 0.045); break;
            case 'whisk': this.noise(0.05, 2600 + Math.random() * 800, 0.06); break;
            case 'squish': this.tone('sine', 280, 170, 0.08, 0.09); this.noise(0.05, 700, 0.05); break;
            case 'pour': this.noise(0.14, 900, 0.045, 0, 'lowpass'); break;
            case 'crack': this.noise(0.05, 3200, 0.16); this.tone('square', 900, 300, 0.04, 0.035); break;
            case 'flip': this.tone('sine', 300, 900, 0.14, 0.08); break;
            case 'ding': this.notes([96, 91], 'bell', 0.12, 0.12); break;
            case 'good': this.notes([84, 88, 91], 'bell', 0.09, 0.05); break;
        }
    },
    step(ground) {
        const f = { grass: 1500, sand: 2400, stone: 900, wood: 700 }[ground] || 1200;
        this.noise(0.035, f, 0.025);
    },
    ui(kind) {
        if (kind === 'tick') this.tone('sine', 1100, 900, 0.04, 0.05);
        else if (kind === 'ok') this.tone('sine', 900, 1300, 0.06, 0.06);
        else if (kind === 'open') this.notes([76, 83], 'kalimba', 0.1, 0.05);
        else if (kind === 'close') this.tone('sine', 900, 600, 0.06, 0.05);
        else if (kind === 'nope') this.play('nope');
    },
    voice(pitch, wave, code) {
        const c = Audio2.ctx;
        if (!c || !Audio2.sfxOn || c.state !== 'running') return;
        const now = c.currentTime;
        if (now - this._voiceT < 0.045) return;
        this._voiceT = now;
        const f = pitch * (1 + (((code || 0) % 7) - 3) * 0.045);
        this.tone(wave || 'sine', f, f * 0.94, 0.05, 0.045);
    },
};

