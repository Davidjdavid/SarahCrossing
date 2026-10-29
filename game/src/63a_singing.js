/* ---- 63a_singing.js ---- */
/* The singing voice at karaoke (David, 29 October: "some sort of text to voice so that Sarah sings the songs... when you go
   off pitch make the voice mess up"). The browser's speech can't hold a note (and isn't there on every device), so this
   is a little singing synth in Web Audio: a buzz at the pitch being sung (a wave made for each voice), shaped into the
   syllable's vowel by three formant filters, with a puff of filtered noise for its consonants. Each word is split into
   the syllables the tune gives a note each (singSyllables). Off the note the voice wobbles, goes raspy and cracks. One
   set of nodes a singer, made when the song starts, so it stays light on phones. */

/* the mouth shapes: three formants (Hz, for a woman's voice) and how loud the second and third are */
const SING_VOWELS = {
    a: [800, 1150, 2800, 0.6, 0.18],      // father
    ae: [700, 1650, 2650, 0.45, 0.14],    // cat
    aw: [600, 950, 2650, 0.45, 0.14],     // dog, saw
    e: [500, 1850, 2750, 0.3, 0.14],      // bed
    i: [300, 2250, 3000, 0.3, 0.12],      // see
    ih: [420, 1950, 2750, 0.3, 0.12],     // sit
    o: [480, 820, 2750, 0.45, 0.12],      // go
    u: [340, 720, 2550, 0.3, 0.06],       // boo
    uh: [640, 1250, 2700, 0.45, 0.14],    // cup
    er: [480, 1350, 1700, 0.4, 0.3],      // her
    m: [260, 1100, 2400, 0.08, 0.04],     // lips closed: a hum
    n: [260, 1650, 2600, 0.1, 0.05],
    ng: [260, 2000, 2650, 0.1, 0.05],
    l: [360, 1050, 2650, 0.3, 0.1],
    r: [420, 1150, 1550, 0.35, 0.25],
    w: [300, 650, 2350, 0.25, 0.04],
    y: [280, 2150, 3000, 0.25, 0.1],
};
/* the consonants: kind, the noise's pitch (Hz), how loud, how long (s), and whether the buzz carries on through it */
const SING_CONS = {
    p: ['stop', 900, 0.5, 0.02], b: ['stop', 700, 0.25, 0.015, 1], t: ['stop', 4200, 0.55, 0.025], d: ['stop', 3200, 0.3, 0.015, 1],
    k: ['stop', 2100, 0.55, 0.03], g: ['stop', 1800, 0.3, 0.02, 1], ch: ['fric', 3000, 0.6, 0.07], j: ['fric', 2600, 0.4, 0.06, 1],
    s: ['fric', 6500, 0.5, 0.08], z: ['fric', 5500, 0.3, 0.07, 1], sh: ['fric', 2900, 0.55, 0.08], f: ['fric', 7000, 0.28, 0.07],
    v: ['fric', 5000, 0.18, 0.05, 1], th: ['fric', 5600, 0.22, 0.06], h: ['fric', 1500, 0.3, 0.06],
    m: ['nasal'], n: ['nasal'], ng: ['nasal'], l: ['glide'], r: ['glide'], w: ['glide'], y: ['glide'],
};
/* short words English doesn't spell the way they sound */
const SING_WORDS = { the: 'uh', a: 'uh', of: 'uh', was: 'uh', what: 'uh', one: 'uh', once: 'uh', love: 'uh', come: 'uh', some: 'uh', done: 'uh', from: 'uh',
    to: 'u', do: 'u', who: 'u', you: 'u', two: 'u', too: 'u', through: 'u', i: 'a>i', eye: 'a>i', is: 'ih', his: 'ih', give: 'ih', live: 'ih', been: 'ih',
    are: 'a', said: 'e', says: 'e', any: 'e', have: 'ae', they: 'e>i', there: 'e', where: 'e', their: 'e', here: 'i', were: 'er', your: 'o',
    our: 'a>u', four: 'o', door: 'o', more: 'o', great: 'e>i', want: 'aw', walk: 'aw', talk: 'aw', all: 'aw', call: 'aw', small: 'aw', fall: 'aw' };
/* and words whose first letters aren't what's said */
const SING_ON = { two: 't', who: 'h', whom: 'h', whole: 'h', hour: '', honest: '', knew: 'n', know: 'n', write: 'r', wrong: 'r', psst: 's' };
const SING_GAIN = 0.5;          // makes the filtered voice a little louder than the old karaoke hum
const SING_Q = [5, 7, 9];       // the formants' widths

/* a word split into n syllables to sing (n from the tune: `syllables`, maybe fewer): each { c, c2, v, v2, co }: the
   consonants going in (c, then c2: the r of "tr", the t of "st"), the vowel (v, gliding to v2: "my" goes a then i), and
   the consonant the word ends on (co, on its last syllable) */
function singSyllables(word, n) {
    const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!w || !(n > 0)) return [];
    // (y is a vowel but at the start or before a vowel, "my", "happy"; w is one after a vowel at a syllable's end, "snow")
    const v5 = ch => 'aeiou'.includes(ch || '-');
    const vow = i => v5(w[i]) || (i > 0 && !v5(w[i + 1]) && (w[i] === 'y' || (w[i] === 'w' && v5(w[i - 1]))));
    let G = [];
    for (let i = 0; i < w.length;) {
        if (!vow(i)) { i++; continue; }
        let j = i;
        while (j < w.length && vow(j)) j++;
        // (the u of "qu" is the w in it)
        if (w[i] === 'u' && w[i - 1] === 'q' && j > i + 1) G.push({ a: i + 1, b: j }); else G.push({ a: i, b: j });
        i = j;
    }
    if (!G.length) G = [{ a: w.length, b: w.length }];           // "hmm", "shh": a hum
    // a final e (or es, ed) after a consonant is silent, and one consonant before it makes the vowel long ("like", "home")
    let magic = false, wc = w;
    const L = G[G.length - 1];
    if (G.length > 1 && L.b - L.a === 1 && w[L.a] === 'e' && (L.a === w.length - 1 || (L.a === w.length - 2 && /[sd]$/.test(w))) && !vow(L.a - 1) && w[L.a - 1] !== 'l') {
        G.pop();
        magic = L.a - G[G.length - 1].b === 1;
        wc = w.slice(0, L.a) + w.slice(L.a + 1);
    }
    while (G.length > n) G.pop();
    while (G.length < n) {
        // more notes than vowels: split two vowels said apart ("lion"), or hold the last one again
        const k = G.findIndex(g => /^(io|ia|iu|eo|uo|ua)/.test(w.slice(g.a, g.b)));
        if (k >= 0) G.splice(k, 1, { a: G[k].a, b: G[k].a + 1 }, { a: G[k].a + 1, b: G[k].b });
        else G.push(Object.assign({}, G[G.length - 1], { again: true }));
    }
    const whole = G.length === 1 && SING_WORDS[w];
    return G.map((g, k) => {
        let on = g.again ? '' : !k && SING_ON[w] != null ? SING_ON[w] : w.slice(k ? G[k - 1].b : 0, g.a);
        if (k && on.length > 1) on = /^(th|sh|ch|ph|wh|ck|ng|qu|[bcdfgkpt][lr]|s[ptkmnlw]|tw)$/.test(on.slice(-2)) ? on.slice(-2) : on.slice(-1);
        const vs = w.slice(g.a, g.b), last = k === G.length - 1;
        if (/c$/.test(on) && /^[eiy]/.test(vs)) on = on.slice(0, -1) + 's';          // a soft c: "nice", "city"
        const out = singOnset(on);
        const vv = whole || singVowel(vs, last ? wc.slice(g.b) : w.slice(g.b, G[k + 1].a), last && magic, last && g.b >= wc.length, w.length, G.length === 1);
        const [v, v2] = vv.split('>');
        out.v = v; if (v2) out.v2 = v2;
        if (last) { const co = singCoda(wc.slice(g.b)); if (co) out.co = co; }
        return out;
    });
}
function singOnset(s) {
    if (!s) return { c: '' };
    const D = { th: 'th', sh: 'sh', ch: 'ch', ph: 'f', wh: 'w', kn: 'n', wr: 'r', gh: 'g', ck: 'k', qu: 'k', gn: 'n', ps: 's' };
    let c, rest;
    if (D[s.slice(0, 2)]) { c = D[s.slice(0, 2)]; rest = s.slice(2); if (s.startsWith('qu')) rest += 'w'; }
    else { c = { c: 'k', q: 'k', x: 'z' }[s[0]] || s[0]; rest = s.slice(1); }
    const e = rest.slice(-1);
    let c2 = /[lrwy]/.test(e) ? e : c === 's' && /[ptkcmn]/.test(rest[0] || '') ? ({ c: 'k' }[rest[0]] || rest[0]) : null;
    if (c2 === c) c2 = null;
    return { c: SING_CONS[c] ? c : '', c2: c2 && SING_CONS[c2] ? c2 : null };
}
/* the vowel a spelling sings as (roughly: it's a song, not a dictionary) */
function singVowel(g, rest, magic, end, len, mono) {
    if (/^(ee|ea|ie|ey|ei|eo)$/.test(g)) return g === 'ie' && end && mono ? 'a>i' : 'i';
    if (/^(ai|ay|eigh)$/.test(g)) return 'e>i';
    if (/^(oo|ue|ew|ui|eu)$/.test(g)) return 'u';
    if (/^(ou|ow)$/.test(g)) return end && g === 'ow' && len > 3 ? 'o>u' : 'a>u';
    if (/^(oa|oe)$/.test(g)) return 'o>u';
    if (/^(oi|oy)$/.test(g)) return 'o>i';
    if (/^(au|aw)$/.test(g)) return 'aw';
    const c = g[0], r = rest[0] === 'r';
    if (c === 'a') return magic || rest[0] === 'y' ? 'e>i' : r ? 'a' : /^l[lkt]?$|^w/.test(rest) ? 'aw' : end ? 'uh' : 'ae';
    if (c === 'e') return magic || end ? 'i' : r ? 'er' : 'e';
    if (c === 'i') return magic || /^(gh|nd|ld)/.test(rest) ? 'a>i' : r ? 'er' : 'ih';
    if (c === 'o') return magic || end || /^l[dt]/.test(rest) ? 'o>u' : rest[0] === 'w' ? 'a>u' : r ? 'o' : 'aw';
    if (c === 'u') return magic ? 'u' : r ? 'er' : 'uh';
    if (c === 'y') return mono && end ? 'a>i' : end ? 'i' : 'ih';
    return 'uh';
}
function singCoda(s) {
    s = s.replace(/gh/g, '').replace(/[aeiouy]/g, '');
    if (!s) return null;
    const two = s.slice(-2);
    if (two === 'ng' || two === 'nk') return 'ng';
    if ({ th: 1, sh: 1, ch: 1 }[two]) return two;
    const c = { c: 'k', x: 's', q: 'k' }[s.slice(-1)] || s.slice(-1);
    return SING_CONS[c] && c !== 'h' && c !== 'w' && c !== 'y' ? c : null;
}

const Singer = {
    _waves: new WeakMap(), _noise: new WeakMap(),
    /* a voice's buzz: harmonics falling off as 1/n^b (a higher b is softer), the even ones turned down for a hollow,
       square-ish voice */
    wave(c, b, odd) {
        let m = this._waves.get(c);
        if (!m) { m = {}; this._waves.set(c, m); }
        const k = b + (odd ? 'o' : '');
        if (!m[k]) {
            const N = 40, re = new Float32Array(N), im = new Float32Array(N);
            for (let i = 1; i < N; i++) im[i] = Math.pow(i, -b) * (odd && i % 2 === 0 ? 0.35 : 1);
            m[k] = c.createPeriodicWave(re, im);
        }
        return m[k];
    },
    noiseBuf(c) {
        if (c === Audio2.ctx && Audio2.noise) return Audio2.noise;
        let b = this._noise.get(c);
        if (!b) {
            b = c.createBuffer(1, c.sampleRate, c.sampleRate);
            const d = b.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            this._noise.set(c, b);
        }
        return b;
    },
    /* how someone sings, from their talking voice (VOICES, 6s_voices.js): the octave under the tune, how bright, the size
       of their mouth (fk scales the formants), their vibrato and breath; masc is a man's voice, lower */
    opts(P, masc) {
        P = P || VOICES.sarah;
        const f = P.f || 440;
        const vib = P.vib ? [clamp(P.vib[0], 4.5, 9), clamp(1200 * Math.log2((f + P.vib[1]) / f), 15, 70)] : [5.4, 30];
        return { shift: masc || f < 300 ? -24 : f >= 650 ? 0 : -12, bright: P === VOICES.sarah ? 1.3 : { sawtooth: 1.0, square: 1.15, triangle: 1.4, sine: 1.5 }[P.w] || 1.35,
            odd: P.w === 'square', fk: masc ? 0.86 : clamp(Math.pow(f / 520, 0.35), 0.86, 1.18), vibHz: vib[0], vibC: vib[1],
            breath: 0.025 + (P.breath || 0) * 2 + (P.airy ? 0.08 : 0) };
    },
    /* one singer's voice, into dest: silent until tick says they're singing */
    make(c, dest, o) {
        const osc = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), voc = c.createGain(), mix = c.createGain(), gate = c.createGain();
        osc.setPeriodicWave(this.wave(c, o.bright, o.odd));
        osc.frequency.value = 220;
        lfo.frequency.value = o.vibHz; lg.gain.value = 0;
        lfo.connect(lg); lg.connect(osc.detune);
        osc.connect(voc);
        const v0 = SING_VOWELS.uh, A = [];
        const F = [0, 1, 2].map(i => {
            const f = c.createBiquadFilter(), g = c.createGain();
            f.type = 'bandpass'; f.frequency.value = v0[i] * o.fk; f.Q.value = SING_Q[i];
            g.gain.value = i ? v0[2 + i] : 1;
            voc.connect(f); f.connect(g); g.connect(mix);
            A.push(g);
            return f;
        });
        // noise: the consonants (shaped a syllable at a time) and a breath (more of it is a rasp)
        const ns = c.createBufferSource(), cf = c.createBiquadFilter(), cg = c.createGain(), bf = c.createBiquadFilter(), bg = c.createGain();
        ns.buffer = this.noiseBuf(c); ns.loop = true;
        cf.type = 'bandpass'; cf.frequency.value = 4000; cf.Q.value = 1.4; cg.gain.value = 0;
        bf.type = 'bandpass'; bf.frequency.value = 2400 * o.fk; bf.Q.value = 0.8; bg.gain.value = o.breath;
        ns.connect(cf); cf.connect(cg); cg.connect(mix);
        ns.connect(bf); bf.connect(bg); bg.connect(mix);
        // a little of the voice's own top end past the formants, so it isn't muffled (David, 29 October)
        const pf = c.createBiquadFilter(), pg = c.createGain();
        pf.type = 'highpass'; pf.frequency.value = 2600 * o.fk; pf.Q.value = 0.5; pg.gain.value = 0.18;
        voc.connect(pf); pf.connect(pg); pg.connect(mix);
        mix.gain.value = SING_GAIN; gate.gain.value = 0;
        mix.connect(gate); gate.connect(dest);
        const t = c.currentTime;
        osc.start(t); lfo.start(t); ns.start(t, Math.random() * 0.5);
        const V = { c, o, osc, lfo, lg, voc, F, A, ns, cf, cg, bg, gate, on: false, m: null, g: 0, vib: 0, br: o.breath, crackT: -9, onT: 0, busy: 0, cracks: 0,
            q: [], vs: v0, corr: 1, ck: '' };
        V.ref = this.level(V, SING_VOWELS.a, mtof(69 + o.shift));
        return V;
    },
    /* how loud a mouth shape comes out at a pitch (its formants catch some harmonics and miss others: an "ee" up high is
       thin, an "eh" there booms); the gate evens it out against the voice's own "ah" */
    level(V, s, f0) {
        let p = 0;
        for (let n = 1; n <= 10; n++) {
            const f = n * f0;
            let h = 0;
            for (let i = 0; i < 3; i++) { const fc = s[i] * V.o.fk, x = SING_Q[i] * (f / fc - fc / f); h += (i ? s[2 + i] : 1) / Math.sqrt(1 + x * x); }
            p += Math.pow(Math.pow(n, -V.o.bright) * h, 2);
        }
        return Math.sqrt(p);
    },
    /* every frame: the pitch they're singing (midi, in their own octave), whether they are, how loud, how far off the note
       (off, 0 to 1: a wobble, then a rasp and cracks), and scoop: coming in late, sliding up into the note */
    tick(V, midi, on, vol, off, scoop) {
        const c = V.c, now = c.currentTime;
        off = on ? off || 0 : 0;
        if (on && midi != null) {
            const f = mtof(midi);
            if (!V.on) { V.osc.frequency.cancelScheduledValues(now); V.osc.frequency.setValueAtTime(scoop ? f * 0.87 : f, now); V.osc.frequency.setTargetAtTime(f, now, scoop ? 0.07 : 0.02); V.m = midi; V.onT = now; }
            else if (Math.abs(midi - V.m) > 0.03) { V.osc.frequency.setTargetAtTime(f, now, 0.022); V.m = midi; }
        }
        // the vowel being sung now (from the syllables scheduled), evened out for loudness at this pitch
        while (V.q.length && V.q[0].t <= now) V.vs = V.q.shift().s;
        const ck = V.vs[0] + ':' + V.vs[1] + ':' + Math.round(V.m * 2);
        if (V.m != null && ck !== V.ck) { V.ck = ck; V.corr = clamp(V.ref / this.level(V, V.vs, mtof(V.m)), 0.45, 2.5); }
        // a wavering voice off the note: the loudness flutters
        const g = on ? vol * V.corr * (1 - off * 0.35 * (0.5 + 0.5 * Math.sin(now * 21))) : 0;
        if (Math.abs(g - V.g) > 0.004) { V.gate.gain.setTargetAtTime(g, now, on ? (V.on ? 0.03 : 0.012) : 0.06); V.g = g; }
        V.on = on;
        // vibrato grows in on a held note; off the note it's a wobble, wider and unsteady
        const vib = on ? V.o.vibC * clamp((now - V.onT - 0.15) / 0.4, 0, 1) + off * 110 : 0;
        if (Math.abs(vib - V.vib) > 2) { V.lg.gain.setTargetAtTime(vib, now, 0.08); V.vib = vib; }
        if (off > 0.3 && R() < 0.05) { V.lfo.frequency.setTargetAtTime(V.o.vibHz * (0.6 + R()), now, 0.05); V.wob = true; }
        else if (V.wob && off < 0.1) { V.lfo.frequency.setTargetAtTime(V.o.vibHz, now, 0.1); V.wob = false; }
        // (only a touch of rasp: sliding to a note with the keys counts as off it, and a full rasp hissed like static)
        const br = V.o.breath + off * 0.08;
        if (Math.abs(br - V.br) > 0.01) { V.bg.gain.setTargetAtTime(br, now, 0.05); V.br = br; }
        // and well off the note, the voice cracks
        if (on && off > 0.45 && now - V.crackT > 0.4 && R() < off * 0.06) this.crack(V, now);
    },
    /* a crack: the voice flips up (now and then down) for a moment and breaks */
    crack(V, t) {
        const d = V.osc.detune, j = (R() < 0.75 ? 1 : -1) * (700 + R() * 500), len = 0.05 + R() * 0.07;
        V.crackT = t; V.cracks++;
        d.cancelScheduledValues(t); d.setValueAtTime(0, t); d.linearRampToValueAtTime(j, t + 0.012); d.setValueAtTime(j, t + len); d.linearRampToValueAtTime(0, t + len + 0.025);
        V.bg.gain.setTargetAtTime(V.br + 0.2, t, 0.005); V.bg.gain.setTargetAtTime(V.br, t + len, 0.03);
    },
    /* the mouth's shape (formants and the loudness of the upper two), from t, getting there in about tau */
    shape(V, s, t, tau) {
        const fk = V.o.fk;
        for (let i = 0; i < 3; i++) V.F[i].frequency.setTargetAtTime(s[i] * fk, t, tau);
        V.A[1].gain.setTargetAtTime(s[3], t, tau); V.A[2].gain.setTargetAtTime(s[4], t, tau);
    },
    /* lips closed between lines, still singing: a hum */
    hum(V) { const t = V.c.currentTime; this.shape(V, SING_VOWELS.m, t, 0.05); V.voc.gain.setTargetAtTime(0.6, t, 0.03); V.vs = SING_VOWELS.m; },
    /* one consonant from ta to tb (the noise and the buzz shaped with setTargetAtTime, so nothing clicks, whatever came
       before); a word's last one (end) leaves the mouth closed for the next syllable to open */
    cons(V, k, ta, tb, end) {
        const C = SING_CONS[k], vg = V.voc.gain, ng = V.cg.gain;
        if (!C) return;
        if (C[0] === 'stop') {
            vg.setTargetAtTime(C[4] ? 0.3 : 0.02, ta, 0.006);
            V.cf.frequency.setValueAtTime(C[1] * V.o.fk, ta);
            ng.setTargetAtTime(C[2], tb, 0.002); ng.setTargetAtTime(0, tb + 0.008, C[3] / 2);
            if (!end) vg.setTargetAtTime(1, tb + 0.01, 0.012);
        } else if (C[0] === 'fric') {
            vg.setTargetAtTime(C[4] ? 0.55 : 0.06, ta, 0.008);
            V.cf.frequency.setValueAtTime(C[1] * V.o.fk, ta);
            ng.setTargetAtTime(C[2], ta, 0.01); ng.setTargetAtTime(0, Math.max(ta + 0.02, tb - 0.008), 0.008);
            vg.setTargetAtTime(end ? 0.02 : 1, tb, 0.012);
        } else {
            // a hum or a glide: the mouth starts in its shape and opens into the vowel
            this.shape(V, SING_VOWELS[k], ta, 0.01);
            vg.setTargetAtTime(C[0] === 'nasal' ? 0.55 : 0.85, ta, 0.01);
            if (!end) vg.setTargetAtTime(1, tb, 0.02);
        }
    },
    /* a syllable's mouth, scheduled at T (when its note starts) for len seconds: its consonants just before the beat, the
       vowel on it (gliding to the second vowel of "my" or "go"), and the word's last consonant near the end */
    syl(V, s, T, len) {
        const now = V.c.currentTime;
        s = s || { c: '', v: 'uh' };
        const C = SING_CONS[s.c], C2 = s.c2 && SING_CONS[s.c2];
        const dur = (C ? (C[0] === 'stop' ? 0.03 : C[0] === 'fric' ? C[3] : 0.06) : 0) + (C2 ? 0.045 : 0);
        const ta = Math.max(now + 0.003, T - dur, V.busy), tb = Math.max(T, ta + 0.015);
        if (C) this.cons(V, s.c, ta, C2 ? Math.max(ta + 0.01, tb - 0.045) : tb);
        if (C2) this.cons(V, s.c2, Math.max(ta + 0.01, tb - 0.045), tb);
        const vw = SING_VOWELS[s.v] || SING_VOWELS.uh;
        this.shape(V, vw, C && C[0] !== 'glide' && C[0] !== 'nasal' && !C2 ? ta : tb, C2 || (C && C[0] === 'glide') ? 0.035 : 0.02);
        if (!C) V.voc.gain.setTargetAtTime(1, tb, 0.015);
        V.q.push({ t: tb, s: vw });
        if (s.v2 && SING_VOWELS[s.v2]) { this.shape(V, SING_VOWELS[s.v2], tb + len * 0.55, len * 0.15); V.q.push({ t: tb + len * 0.6, s: SING_VOWELS[s.v2] }); }
        V.busy = tb;
        // the word's last consonant, when the note is long enough to hear it
        if (s.co && len >= 0.22) {
            const tc = tb + len - Math.min(0.09, len * 0.3);
            this.cons(V, s.co, tc, tb + len - 0.02, true);
            V.busy = tb + len - 0.01;
        }
    },
    stop(V) {
        if (!V) return;
        const t = V.c.currentTime;
        V.gate.gain.cancelScheduledValues(t);
        V.gate.gain.setTargetAtTime(0, t, 0.04);
        setTimeout(() => { try { V.osc.stop(); V.lfo.stop(); V.ns.stop(); V.gate.disconnect(); } catch (e) { /* already gone */ } }, 400);
    },
};
