/* sound: little synthesized effects and a tiny sequencer for the tunes. all original */

const AU = { ctx: null, master: null, sfxGain: null, musGain: null, music: true, sound: true, cur: null, next: 0, step: 0, song: null };
function audioInit() {
    if (AU.ctx || typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
    try {
        AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
        AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.5; AU.master.connect(AU.ctx.destination);
        AU.sfxGain = AU.ctx.createGain(); AU.sfxGain.gain.value = AU.sound ? 0.55 : 0; AU.sfxGain.connect(AU.master);
        AU.musGain = AU.ctx.createGain(); AU.musGain.gain.value = AU.music ? 0.28 : 0; AU.musGain.connect(AU.master);
        AU.noise = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate);
        const d = AU.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AU.ctx = null; }
}
function audioResume() { if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume(); }
const NOTE = n => { const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 0; const s = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (s + (+m[3] - 4) * 12 - 9) / 12); };
function tone(f, t0, dur, type = 'square', vol = 0.2, dest = AU.sfxGain, slide = 0, attack = 0.005) {
    const c = AU.ctx; if (!c || !f) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(t0, dur, vol = 0.2, freq = 1200, dest = AU.sfxGain, q = 1) {
    const c = AU.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = AU.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
}
let stepAlt = 0;
function sfx(name) {
    if (!AU.ctx || !AU.sound) return;
    const t = AU.ctx.currentTime + 0.005;
    switch (name) {
        case 'step': stepAlt ^= 1; noise(t, 0.04, 0.05, stepAlt ? 900 : 700, AU.sfxGain, 3); break;
        case 'heavystep': noise(t, 0.12, 0.25, 160, AU.sfxGain, 1); tone(55, t, 0.12, 'sine', 0.3); break;
        case 'bump': tone(90, t, 0.07, 'square', 0.06, AU.sfxGain, 0.7); break;
        case 'heavy': tone(70, t, 0.15, 'square', 0.1, AU.sfxGain, 0.6); noise(t, 0.1, 0.1, 300); break;
        case 'push': noise(t, 0.09, 0.12, 400, AU.sfxGain, 2); break;
        case 'open': tone(NOTE('E5'), t, 0.06, 'triangle', 0.12); break;
        case 'tick': tone(NOTE('A5'), t, 0.03, 'square', 0.04); break;
        case 'swap': tone(NOTE('C5'), t, 0.08, 'square', 0.1, AU.sfxGain, 1.5); tone(NOTE('G5'), t + 0.07, 0.1, 'square', 0.1, AU.sfxGain, 0.67); tone(NOTE('C6'), t + 0.14, 0.12, 'triangle', 0.14); break;
        case 'drop': tone(NOTE('G4'), t, 0.1, 'triangle', 0.15, AU.sfxGain, 0.5); break;
        case 'get': tone(NOTE('E5'), t, 0.07, 'triangle', 0.15); tone(NOTE('B5'), t + 0.07, 0.12, 'triangle', 0.15); break;
        case 'refuse': tone(110, t, 0.12, 'sawtooth', 0.07); tone(104, t + 0.06, 0.12, 'sawtooth', 0.07); break;
        case 'grow': for (let i = 0; i < 4; i++) tone(NOTE(['C5', 'E5', 'G5', 'C6'][i]), t + i * 0.05, 0.1, 'triangle', 0.12); noise(t, 0.2, 0.05, 2000); break;
        case 'sink': tone(400, t, 0.4, 'sine', 0.2, AU.sfxGain, 0.3); noise(t, 0.3, 0.1, 600); break;
        case 'float': tone(200, t, 0.35, 'sine', 0.2, AU.sfxGain, 3); break;
        case 'splash': noise(t, 0.2, 0.15, 900, AU.sfxGain, 0.7); break;
        case 'fall': tone(800, t, 0.5, 'triangle', 0.15, AU.sfxGain, 0.2); break;
        case 'crack': noise(t, 0.3, 0.35, 250); tone(60, t, 0.3, 'square', 0.15, AU.sfxGain, 0.5); break;
        case 'gate': tone(110, t, 0.25, 'square', 0.08, AU.sfxGain, 1.5); noise(t, 0.25, 0.08, 300); break;
        case 'gateshut': tone(160, t, 0.2, 'square', 0.08, AU.sfxGain, 0.6); noise(t + 0.15, 0.1, 0.15, 200); break;
        case 'hit': noise(t, 0.08, 0.3, 1500); tone(200, t, 0.08, 'square', 0.12, AU.sfxGain, 0.5); break;
        case 'hurt': tone(300, t, 0.25, 'square', 0.15, AU.sfxGain, 0.4); break;
        case 'windup': tone(NOTE('A5'), t, 0.06, 'square', 0.1); tone(NOTE('A5'), t + 0.1, 0.06, 'square', 0.1); break;
        case 'defeat': for (let i = 0; i < 5; i++) tone(NOTE(['G5', 'E5', 'C5', 'G4', 'C4'][i]), t + i * 0.04, 0.08, 'square', 0.08); noise(t, 0.25, 0.1, 3000); break;
        case 'creak': tone(140, t, 0.3, 'sawtooth', 0.05, AU.sfxGain, 1.3); break;
        case 'deliver': ['C5', 'E5', 'G5', 'E5', 'C6'].forEach((n, i) => tone(NOTE(n), t + i * 0.08, 0.12, 'triangle', 0.14)); break;
        case 'door': noise(t, 0.18, 0.1, 500, AU.sfxGain, 1); tone(220, t, 0.1, 'triangle', 0.08, AU.sfxGain, 0.8); break;
        case 'stairs': for (let i = 0; i < 4; i++) noise(t + i * 0.07, 0.05, 0.1, 700 + i * 100, AU.sfxGain, 3); break;
        case 'item': ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'].forEach((n, i) => tone(NOTE(n), t + i * 0.09, 0.16, i > 4 ? 'triangle' : 'square', 0.12)); break;
        case 'reveal': for (let i = 0; i < 10; i++) tone(NOTE('C5') * Math.pow(2, i / 6), t + i * 0.06, 0.25, 'sine', 0.08); break;
        case 'stamp': tone(NOTE('G5'), t, 0.06, 'square', 0.1); tone(NOTE('C6'), t + 0.08, 0.06, 'square', 0.1); tone(NOTE('E6'), t + 0.16, 0.2, 'triangle', 0.14); noise(t + 0.3, 0.08, 0.2, 400); break;
        case 'chest': tone(NOTE('C4'), t, 0.1, 'square', 0.08, AU.sfxGain, 1.5); break;
        case 'bell': [1, 2.4, 3.0, 4.2].forEach((m, i) => tone(NOTE('G4') * m, t, 2.2 - i * 0.4, 'sine', 0.18 / (i + 1), AU.sfxGain, 0, 0.002)); break;
        case 'carry': tone(80, t, 0.15, 'square', 0.18, AU.sfxGain, 0.7); noise(t, 0.12, 0.25, 300); break;
        case 'clock': tone(NOTE('E6'), t, 0.02, 'square', 0.03); break;
        case 'pop': tone(NOTE('C6'), t, 0.06, 'square', 0.1, AU.sfxGain, 2); break;
        case 'munch': noise(t, 0.05, 0.2, 2000, AU.sfxGain, 2); noise(t + 0.08, 0.05, 0.2, 1800, AU.sfxGain, 2); break;
        case 'flip': tone(NOTE('C5'), t, 0.25, 'sine', 0.15, AU.sfxGain, 2); tone(NOTE('C6'), t + 0.1, 0.25, 'sine', 0.12, AU.sfxGain, 0.5); break;
        case 'meow': tone(700, t, 0.25, 'triangle', 0.1, AU.sfxGain, 0.7); break;
        case 'hatch': ['E6', 'G6', 'E6', 'C7'].forEach((n, i) => tone(NOTE(n), t + i * 0.07, 0.05, 'square', 0.06)); break;
        case 'flap': for (let i = 0; i < 4; i++) noise(t + i * 0.09, 0.06, 0.15, 1200, AU.sfxGain, 1); break;
        case 'buy': ['G5', 'C6'].forEach((n, i) => tone(NOTE(n), t + i * 0.08, 0.1, 'square', 0.1)); noise(t, 0.1, 0.08, 4000); break;
        case 'die': ['E5', 'C5', 'A4', 'E4'].forEach((n, i) => tone(NOTE(n), t + i * 0.18, 0.3, 'triangle', 0.15)); break;
        case 'undo': tone(NOTE('C6'), t, 0.06, 'triangle', 0.08, AU.sfxGain, 0.5); break;
        case 'morph': tone(200, t, 0.6, 'sine', 0.2, AU.sfxGain, 4); noise(t, 0.5, 0.06, 3000); break;
        case 'menu': tone(NOTE('B5'), t, 0.04, 'square', 0.06); break;
        case 'blip': tone(NOTE('A4') * (1 + Math.random() * 0.3), t, 0.03, 'square', 0.035); break;
        case 'lamp': ['C5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(NOTE(n), t + i * 0.12, 0.8, 'sine', 0.12)); break;
    }
}

/* ---------- tunes: one step is an eighth note. "C5*2" lasts two steps, "_*4" rests four ---------- */
function seq(s) { const out = []; for (const tok of s.trim().split(/\s+/)) { if (tok === '|') continue; const [n, k] = tok.split('*'); out.push([n === '_' ? null : n, +(k || 1)]); } return out; }
const SONGS = {
    village: { bpm: 112, lead: 'square', vol: 0.5,
        lead_: 'E5*2 G5*2 C6*3 B5 | A5*2 E5*2 C5*4 | F5*2 A5*2 C6*2 A5*2 | G5*6 _*2 | E5 F5 G5*2 E5*2 C5*2 | A4*2 C5*2 E5*2 A5*2 | F5*2 E5*2 D5*2 B4*2 | C5*6 _*2',
        bass: 'C3*2 G3*2 C3*2 G3*2 | A2*2 E3*2 A2*2 E3*2 | F2*2 C3*2 F2*2 C3*2 | G2*2 D3*2 G2*2 D3*2 | C3*2 G3*2 C3*2 G3*2 | A2*2 E3*2 A2*2 E3*2 | F2*2 C3*2 G2*2 D3*2 | C3*2 G3*2 C3*4',
        drum: 'k _ h _ s _ h _' },
    night: { bpm: 84, lead: 'triangle', vol: 0.55,
        lead_: 'E5*3 D5 C5*4 | A4*4 _*4 | F4*2 A4*2 C5*2 E5*2 | D5*8 | E5*3 D5 C5*4 | A4*2 C5*2 E5*4 | D5*2 C5*2 B4*2 G4*2 | C5*8',
        bass: 'C3*8 | A2*8 | F2*8 | G2*8 | C3*8 | A2*8 | F2*4 G2*4 | C3*8' },
    home: { bpm: 96, lead: 'triangle', vol: 0.45,
        lead_: 'G5 E5 C5 E5 G5 E5 C6*2 | A5 F5 C5 F5 A5*4 | G5 E5 C5 E5 G5 C6 B5 A5 | G5*8 | F5 D5 B4 D5 F5 D5 A5*2 | E5 C5 A4 C5 E5*4 | D5 E5 F5 G5 A5 B5 C6 D6 | C6*6 _*2',
        bass: 'C3*4 G2*4 | F2*4 C3*4 | C3*4 G2*4 | G2*4 D3*4 | D3*4 A2*4 | A2*4 E3*4 | F2*4 G2*4 | C3*8' },
    woods: { bpm: 92, lead: 'triangle', vol: 0.55,
        lead_: 'A4 C5 E5 A5 G5 E5 C5 E5 | F4 A4 C5 F5 E5 C5 A4 C5 | C5 E5 G5 C6 B5 G5 E5 G5 | G4 B4 D5 G5 F#5 D5 B4 D5 | A5*3 G5 E5*2 C5*2 | F5*3 E5 C5*2 A4*2 | B4*2 C5*2 D5*2 E5*2 | A4*8',
        bass: 'A2*8 | F2*8 | C3*8 | G2*8 | A2*8 | F2*8 | G2*8 | A2*8' },
    fort: { bpm: 104, lead: 'square', vol: 0.4,
        lead_: 'D5*2 D5 E5 F5*2 A5*2 | G5*2 F5 E5 D5*4 | C5*2 C5 D5 E5*2 G5*2 | F5*2 E5 D5 A4*4 | D5*2 F5*2 A5*3 G5 | Bb5*2 A5*2 G5*4 | F5*2 E5*2 D5*2 C#5*2 | D5*6 _*2',
        bass: 'D3*2 A2*2 D3*2 A2*2 | Bb2*2 F2*2 Bb2*2 F2*2 | C3*2 G2*2 C3*2 G2*2 | A2*2 E2*2 A2*2 E2*2 | D3*2 A2*2 D3*2 A2*2 | G2*2 D3*2 G2*2 D3*2 | A2*2 E3*2 A2*2 E3*2 | D3*2 A2*2 D3*4',
        drum: 'k _ _ k s _ k _' },
    mill: { bpm: 120, lead: 'square', vol: 0.4,
        lead_: 'G5 B5 D6 B5 G5*2 D5*2 | E5 G5 B5 G5 E5*4 | C5 E5 G5 E5 A5*2 G5*2 | F#5*2 A5*2 D6*4 | G5 B5 D6 B5 G5*2 D5*2 | E5 G5 B5 G5 E5*2 C5*2 | A4 B4 C5 D5 E5 F#5 A5 F#5 | G5*6 _*2',
        bass: 'G2 D3 G2 D3 G2 D3 G2 D3 | E2 B2 E2 B2 E2 B2 E2 B2 | C3 G3 C3 G3 C3 G3 C3 G3 | D3 A3 D3 A3 D3 A3 D3 A3 | G2 D3 G2 D3 G2 D3 G2 D3 | E2 B2 E2 B2 C3 G3 C3 G3 | D3 A3 D3 A3 D3 A3 D3 A3 | G2 D3 G2*6',
        drum: 'k h s h k h s h' },
    pond: { bpm: 80, lead: 'sine', vol: 0.6,
        lead_: 'E5*4 D5*2 B4*2 | C5*4 A4*4 | D5*4 C5*2 A4*2 | B4*8 | E5*2 G5*2 B5*2 A5*2 | G5*4 E5*4 | F#5*2 E5*2 D#5*2 B4*2 | E5*8',
        bass: 'E3*8 | A2*8 | D3*8 | B2*8 | E3*8 | C3*8 | B2*8 | E3*8' },
    sea: { bpm: 88, lead: 'triangle', vol: 0.55,
        lead_: 'F5*3 G5 A5*2 C6*2 | Bb5*2 A5*2 G5*4 | E5*3 F5 G5*2 Bb5*2 | A5*6 _*2 | F5*3 G5 A5*2 F5*2 | D5*2 E5*2 F5*4 | G5*2 A5*2 Bb5*2 E5*2 | F5*8',
        bass: 'F2*4 C3*4 | Bb2*4 F2*4 | C3*4 G2*4 | F2*4 C3*4 | F2*4 C3*4 | D2*4 A2*4 | Bb2*4 C3*4 | F2*8' },
    road: { bpm: 100, lead: 'triangle', vol: 0.5,
        lead_: 'C5*2 D5*2 E5*2 G5*2 | A5*4 G5*4 | E5*2 D5*2 C5*2 D5*2 | E5*8 | C5*2 D5*2 E5*2 G5*2 | A5*2 C6*2 A5*4 | G5*2 E5*2 D5*2 E5*2 | C5*8',
        bass: 'C3 G3 C3 G3 C3 G3 C3 G3 | F2 C3 F2 C3 F2 C3 F2 C3 | A2 E3 A2 E3 A2 E3 A2 E3 | G2 D3 G2 D3 G2 D3 G2 D3 | C3 G3 C3 G3 C3 G3 C3 G3 | F2 C3 F2 C3 F2 C3 F2 C3 | G2 D3 G2 D3 G2 D3 G2 D3 | C3 G3 C3 G3 C3*4' },
    cape: { bpm: 76, lead: 'sine', vol: 0.6,
        lead_: 'G5*4 E5*2 C5*2 | D5*6 _*2 | E5*4 C5*2 A4*2 | B4*6 _*2 | C5*2 E5*2 G5*2 C6*2 | B5*4 A5*4 | G5*2 F5*2 E5*2 D5*2 | C5*8',
        bass: 'C3*8 | G2*8 | A2*8 | E2*8 | F2*8 | G2*8 | G2*8 | C3*8' },
    tower: { bpm: 88, lead: 'square', vol: 0.32,
        lead_: 'E5 B4 E5 G5 F#5 B4 F#5 A5 | G5 B4 G5 B5 A5*2 F#5*2 | E5 B4 E5 G5 F#5 B4 F#5 A5 | B5*4 A5*2 F#5*2 | C6 G5 E5 G5 B5 F#5 D#5 F#5 | E5*2 G5*2 B5*4 | A5 G5 F#5 E5 D#5 E5 F#5 D#5 | E5*8',
        bass: 'E2*4 B2*4 | E2*4 D3*4 | E2*4 B2*4 | B2*4 F#2*4 | C3*4 B2*4 | E2*4 G2*4 | A2*4 B2*4 | E2*8',
        drum: 'k _ _ _ s _ _ _' },
    hill: { bpm: 70, lead: 'triangle', vol: 0.5,
        lead_: 'D5*4 A4*4 | B4*4 F#4*4 | G4*4 D4*4 | G4*4 A4*4 | D5*4 A4*4 | B4*4 F#4*4 | G4*4 A4*4 | D5*8',
        bass: 'D3*8 | B2*8 | G2*8 | A2*8 | D3*8 | B2*8 | G2*4 A2*4 | D3*8' },
    shop: { bpm: 126, lead: 'square', vol: 0.38,
        lead_: 'C6 G5 E5 G5 C6 G5 E5 G5 | D6 A5 F5 A5 D6*4 | B5 G5 D5 G5 B5 G5 D5 G5 | C6*2 E6*2 C6*4 | A5 E5 C5 E5 A5 E5 C5 E5 | F5 A5 C6 A5 F5*4 | G5 B5 D6 B5 G5 F5 E5 D5 | C5*6 _*2',
        bass: 'C3*4 G2*4 | D3*4 A2*4 | G2*4 D3*4 | C3*4 G2*4 | A2*4 E3*4 | F2*4 C3*4 | G2*4 G2*4 | C3*8', drum: 'k h s h k h s h' },
    eerie: { bpm: 60, lead: 'sine', vol: 0.55,
        lead_: 'C5*3 D5 E5*4 | F#5*3 G#5 A#5*4 | C6*2 A#5*2 G#5*2 F#5*2 | E5*8 | D5*3 C5 A#4*4 | G#4*4 A#4*4 | C5*2 E5*2 F#5*2 G#5*2 | C5*8',
        bass: 'C3*8 | F#2*8 | E2*8 | C3*8 | A#2*8 | G#2*8 | F#2*8 | C3*8' },
    nowhere: { bpm: 66, lead: 'triangle', vol: 0.5, lead_: '_*64', bass: 'C3*8 | _*8 | C#3*8 | _*8 | C3*8 | _*8 | B2*8 | _*8' },
    mill2: null,
    ending: { bpm: 80, lead: 'triangle', vol: 0.6,
        lead_: 'E5*2 F5*2 G5*4 | C6*4 B5*2 A5*2 | A5*2 G5*2 F5*2 E5*2 | D5*6 _*2 | E5*2 F5*2 G5*4 | C6*4 D6*2 E6*2 | D6*2 C6*2 B5*2 D6*2 | C6*8',
        bass: 'C3*4 G2*4 | A2*4 E2*4 | F2*4 C3*4 | G2*4 D3*4 | C3*4 G2*4 | A2*4 E2*4 | F2*4 G2*4 | C3*8' },
};
for (const k in SONGS) if (SONGS[k]) { SONGS[k].L = seq(SONGS[k].lead_); SONGS[k].B = seq(SONGS[k].bass); }
function setMusic(name) {
    if (!SONGS[name]) name = 'village';
    if (AU.cur === name) return;
    AU.cur = name;
    AU.song = SONGS[name];
    AU.li = 0; AU.bi = 0; AU.ln = 0; AU.bn = 0; AU.step = 0;
    if (AU.ctx) AU.next = AU.ctx.currentTime + 0.1;
}
/* schedule a little ahead of time, every frame */
function musicTick() {
    if (!AU.ctx || !AU.song) return;
    const S = AU.song, st = 60 / S.bpm / 2;
    const now = AU.ctx.currentTime;
    if (AU.next < now - 0.5) AU.next = now + 0.05;
    while (AU.next < now + 0.25) {
        const t = AU.next;
        if (AU.ln <= 0) { const [n, k] = S.L[AU.li % S.L.length]; AU.li++; AU.ln = k; if (n && AU.music) tone(NOTE(n), t, st * k * 0.95, S.lead, 0.12 * S.vol * 2, AU.musGain, 0, 0.01); }
        if (AU.bn <= 0) { const [n, k] = S.B[AU.bi % S.B.length]; AU.bi++; AU.bn = k; if (n && AU.music) tone(NOTE(n), t, st * k * 0.9, 'triangle', 0.22, AU.musGain, 0, 0.01); }
        if (S.drum && AU.music) {
            const dd = S.drum.split(' ')[AU.step % 8];
            if (dd === 'k') tone(90, t, 0.1, 'sine', 0.25, AU.musGain, 0.5);
            if (dd === 's') noise(t, 0.08, 0.08, 1800, AU.musGain, 1);
            if (dd === 'h') noise(t, 0.03, 0.04, 6000, AU.musGain, 1);
        }
        AU.ln--; AU.bn--; AU.step++;
        AU.next += st;
    }
}
function setMusicOn(on) { AU.music = on; if (AU.musGain) AU.musGain.gain.value = on ? 0.28 : 0; }
function setSoundOn(on) { AU.sound = on; if (AU.sfxGain) AU.sfxGain.gain.value = on ? 0.55 : 0; }
