/* ---- 6zo_mysongs.js ---- */
/* Sarah's own songs at the club (docs/ROADMAP.md: "a way to upload a song and have a dance made for it"). She picks a music
   file on her device; the game listens to it (songChart: where the sound rises across the frequencies, its onsets; the
   tempo from how they repeat; the beat's place from where they land) and writes a dance on that beat at the level she
   picks: Easy on the strong beats, Medium on the beats and the strong ones between, Hard on the eighths. It's a track in
   the club's "Your songs", danced in the dance game as it is (Music.startFile plays the file). The file stays on the device
   (IndexedDB, MySongs.files), the dance with the island (S.mysongs: name, tempo, length, level, steps packed small), so on
   another device the track is listed but asks for the file again. Tips from her own songs come once a day in all. */
const MYSONG_MAX = 12, MYSONG_RATE = 11025, MYSONG_HOP = 256, MYSONG_FFT = 1024, MYSONG_LAG = 2.8;     // (a sound's onset peaks this many frames into its window)
const MYSONG_LEVELS = ['Easy', 'Medium', 'Hard'];

/* ---------------------------------------------------------------- listening */
function fftMag(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
                re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
                const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
            }
        }
    }
    const out = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) out[i] = Math.hypot(re[i], im[i]);
    return out;
}
/* an AudioBuffer (any rate, any channels) to its onset strength frame by frame (spectral flux, the bass counted twice
   over), and the brightness of each frame */
function songListen(buf) {
    const sr = buf.sampleRate, step = Math.max(1, Math.round(sr / MYSONG_RATE)), rate = sr / step;
    const len = Math.min(buf.length, Math.round(sr * 360)), n = Math.floor(len / step), mono = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < step; k++) s += d[i * step + k] || 0; mono[i] += s / step / buf.numberOfChannels; }
    }
    const frames = Math.max(0, Math.floor((n - MYSONG_FFT) / MYSONG_HOP)), flux = new Float32Array(frames), low = new Float32Array(frames), bright = new Float32Array(frames);
    const lowTop = Math.ceil(300 / (rate / MYSONG_FFT));      // (the bass, under 300 Hz: where the beat usually is)
    const win = new Float32Array(MYSONG_FFT).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / MYSONG_FFT));
    let prev = null;
    for (let f = 0; f < frames; f++) {
        const re = new Float32Array(MYSONG_FFT), im = new Float32Array(MYSONG_FFT), o = f * MYSONG_HOP;
        for (let i = 0; i < MYSONG_FFT; i++) re[i] = mono[o + i] * win[i];
        const m = fftMag(re, im);
        let fl = 0, lo = 0, num = 0, den = 0;
        for (let i = 1; i < m.length; i++) {
            const v = Math.log1p(m[i] * 10), up = prev ? Math.max(0, v - prev[i]) : 0;
            fl += up; if (i <= lowTop) lo += up;
            num += i * v; den += v; m[i] = v;
        }
        flux[f] = fl; low[f] = lo; bright[f] = den ? num / den : 0; prev = m;
    }
    // onsets: the whole spectrum's and the bass's, each against its own average, together
    let mf = 0, ml = 0;
    for (let f = 0; f < frames; f++) { mf += flux[f]; ml += low[f]; }
    mf = mf / Math.max(1, frames) || 1; ml = ml / Math.max(1, frames);
    for (let f = 0; f < frames; f++) flux[f] = flux[f] / mf + (ml > 0 ? low[f] / ml : 0);
    return { flux, bright, fps: rate / MYSONG_HOP, dur: len / sr };
}
/* the tempo (beats a minute, 70 to 180, liking 90 to 140) and where the first beat falls: every tempo and starting point
   tried as a comb over the whole song (the onsets on its teeth, half as much between them), the best refined finer */
function songTempo(L) {
    const { flux, fps } = L, n = flux.length;
    const pk = i => { const a = Math.floor(i); return Math.max(flux[a] || 0, flux[a + 1] || 0); };
    const score = (bpm, ph) => {
        const p = fps * 60 / bpm;
        let s = 0, c = 0;
        for (let t = ph; t < n - 1; t += p) { s += pk(t) + 0.5 * pk(t + p / 2); c++; }
        return s / Math.max(1, c) * (bpm >= 90 && bpm <= 140 ? 1 : 0.85);
    };
    let best = -1, bpm0 = 120, ph0 = 0;
    for (let bpm = 70; bpm <= 180; bpm += 0.5) {
        const p = fps * 60 / bpm;
        for (let ph = 0; ph < p; ph += 1) { const s = score(bpm, ph); if (s > best) { best = s; bpm0 = bpm; ph0 = ph; } }
    }
    let bpm1 = bpm0, ph1 = ph0;
    for (let bpm = bpm0 - 0.5; bpm <= bpm0 + 0.5; bpm += 0.05) for (let ph = ph0 - 1; ph <= ph0 + 1; ph += 0.25) {
        const s = score(bpm, Math.max(0, ph));
        if (s > best) { best = s; bpm1 = bpm; ph1 = Math.max(0, ph); }
    }
    return { bpm: Math.round(bpm1 * 10) / 10, beat: 60 / bpm1, phase: (ph1 + MYSONG_LAG) / fps };
}
/* the dance: steps on the beat grid where the song hits, as many as the level asks, the arrows following its brightness */
function songChart(buf, level) {
    const L = songListen(buf), T = songTempo(L), { flux, bright, fps } = L, n = flux.length;
    const at = t => { const c = Math.round(t * fps - MYSONG_LAG); let m = 0, b = 0; for (let k = c - 2; k <= c + 2; k++) if (flux[k] > m) { m = flux[k]; b = bright[k]; } return [m, b]; };
    let sum = 0; for (let i = 0; i < n; i++) sum += flux[i];
    const mean = sum / Math.max(1, n), lv = Math.max(0, MYSONG_LEVELS.indexOf(level));
    const half = T.beat / 2, steps = [];
    for (let t = T.phase, k = 0; t < L.dur - 0.5; t += half, k++) {
        const [m, b] = at(t), on = k % 2 === 0, strong = k % 4 === 0;
        const need = lv === 0 ? (on ? 1.1 : 99) : lv === 1 ? (on ? 0.8 : 1.8) : (on ? 0.6 : 1.0);
        if (t < 1.2 || m < mean * need * (strong ? 0.85 : 1)) continue;
        const last = steps[steps.length - 1];
        if (last && t - last.raw < (lv === 0 ? T.beat * 0.99 : half * 0.99)) continue;
        steps.push({ t: Math.round(t * 100) / 100, raw: t, b });
    }
    // arrows: brighter than the last step goes right, darker left, the same alternates (never three in a row)
    let prev = null, alt = 0;
    const chart = steps.map(s => {
        let lane;
        if (prev == null) lane = 1;
        else if (s.b > prev * 1.15) lane = 3; else if (s.b < prev / 1.15) lane = 0;
        else if (s.b > prev) lane = 2; else if (s.b < prev) lane = 1; else lane = (alt++ % 2) ? 0 : 3;
        prev = s.b;
        return { t: s.t, lane };
    });
    for (let i = 2; i < chart.length; i++) if (chart[i].lane === chart[i - 1].lane && chart[i].lane === chart[i - 2].lane) chart[i].lane = (chart[i].lane + 2) % 4;
    return { bpm: T.bpm, beat: T.beat, dur: Math.round(L.dur * 10) / 10, chart };
}
/* small to keep: times in hundredths, arrows as a string */
function packSteps(chart) { return { t: chart.map(s => Math.round(s.t * 100)), l: chart.map(s => s.lane).join('') }; }
function unpackSteps(p) { return (p.t || []).map((t, i) => ({ t: t / 100, lane: +p.l[i] || 0 })); }

/* ---------------------------------------------------------------- keeping them */
const MySongs = {
    _db: null,
    db() {
        if (!this._db) this._db = new Promise((ok, bad) => {
            const q = indexedDB.open('sc-songs', 1);
            q.onupgradeneeded = () => q.result.createObjectStore('files');
            q.onsuccess = () => ok(q.result);
            q.onerror = () => bad(q.error);
        });
        return this._db;
    },
    async files(mode, fn) { const db = await this.db(); return new Promise((ok, bad) => { const tx = db.transaction('files', mode), q = fn(tx.objectStore('files')); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => bad(tx.error); }); },
    key(id) { return (Cloud.id || 'local') + (Online.visitor() ? '-' + Online.who() : '') + ':' + id; },
    put(id, bytes) { return this.files('readwrite', st => st.put(bytes, this.key(id))); },
    get(id) { return this.files('readonly', st => st.get(this.key(id))).catch(() => null); },
    del(id) { return this.files('readwrite', st => st.delete(this.key(id))).catch(() => null); },
    list() { return S.mysongs || (S.mysongs = []); },
    find(id) { return this.list().find(s => s.id === id) || null; },
    /* the dance game's view of one ('my:<id>') */
    def(songId) { const s = this.find(String(songId).slice(3)); return s ? { name: s.name, level: s.level, mine: true } : null; },
    decode(bytes) { return new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes.slice(0)); },
    /* a new song from the file's bytes */
    async add(bytes, name, level) {
        const buf = await this.decode(bytes), c = songChart(buf, level);
        if (c.chart.length < 8) return null;
        const s = { id: 's' + Date.now().toString(36), name: String(name || 'My song').slice(0, 32), level, bpm: c.bpm, beat: Math.round(c.beat * 1000) / 1000, dur: c.dur, steps: packSteps(c.chart) };
        await this.put(s.id, bytes);
        this.list().push(s);
        Save.touch();
        return s;
    },
    async relevel(s, level) {
        const bytes = await this.get(s.id);
        if (!bytes) return false;
        const c = songChart(await this.decode(bytes), level);
        Object.assign(s, { level, bpm: c.bpm, beat: Math.round(c.beat * 1000) / 1000, steps: packSteps(c.chart) });
        delete S.dance.songs['my:' + s.id];
        Save.touch();
        return true;
    },
    remove(s) { S.mysongs = this.list().filter(x => x !== s); delete S.dance.songs['my:' + s.id]; this.del(s.id); Save.touch(); },
    /* play it: the dance game takes it from here */
    async dance(s, opts) {
        const bytes = await this.get(s.id);
        if (!bytes) { await UI.say('wasabi', `I can't find "${s.name}" on this device. Add the file again here and I'll keep your dance.`); return; }
        let buf;
        try { buf = await (Audio2.ctx || new OfflineAudioContext(1, 1, 44100)).decodeAudioData(bytes.slice(0)); } catch (e) { UI.toast("That song wouldn't play. Try another file?"); return; }
        UI.hideDialog();
        await Dance.start('my:' + s.id, Object.assign({ file: { buf, chart: unpackSteps(s.steps), beat: s.beat, dur: s.dur } }, opts || {}));
    },
};
function pickSongFile() {
    return new Promise(res => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'audio/*';
        inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0];
            if (!f) { res(null); return; }
            if (f.size > 40e6) { UI.toast('That file is too big. Try a song under 40 MB.'); res(null); return; }
            f.arrayBuffer().then(b => res({ bytes: b, name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() }), () => res(null));
        });
        inp.click();
    });
}

/* ---------------------------------------------------------------- at the club */
async function mySongsMenu() {
    for (;;) {
        const list = MySongs.list();
        const opts = list.map(s => { const sd = S.dance.songs['my:' + s.id]; return `${s.name} (${s.level}${sd && sd.cleared ? ', best ' + sd.rank : ''})`; });
        if (list.length < MYSONG_MAX) opts.push('Add a song from this device');
        opts.push('Back');
        const k = await UI.ask('wasabi', list.length ? 'Your tracks! Pick one, or bring me a new one.' : "Bring me a song from your phone or computer and I'll make a dance for it. Any song you like!", opts);
        if (k === opts.length - 1 || k < 0) { UI.hideDialog(); return; }
        if (k === list.length) { await mySongAdd(); continue; }
        const s = list[k];
        const a = await UI.ask('wasabi', `"${s.name}": ${s.level}, ${Math.round(s.bpm)} beats a minute.`, ['Dance it', 'Just watch', 'Change the level', 'Take it off the list', 'Back']);
        if (a === 0) { await MySongs.dance(s); return; }
        if (a === 1) { await MySongs.dance(s, { watch: true }); return; }
        if (a === 2) {
            const l = await UI.ask('wasabi', 'How hard?', MYSONG_LEVELS.concat(['Back']));
            if (l < 3 && l !== MYSONG_LEVELS.indexOf(s.level)) {
                UI.toast('DJ Wasabi is listening again...');
                if (await MySongs.relevel(s, MYSONG_LEVELS[l])) await UI.say('wasabi', `Done! "${s.name}" is ${s.level} now.`, { keep: true });
                else await UI.say('wasabi', `I need the file for that. It's not on this device.`, { keep: true });
            }
        }
        if (a === 3) {
            const y = await UI.ask('wasabi', `Take "${s.name}" off your list? Your best score on it goes too.`, ['Take it off', 'Keep it']);
            if (y === 0) MySongs.remove(s);
        }
    }
}
async function mySongAdd() {
    UI.hideDialog();
    const f = await pickSongFile();
    if (!f) return;
    const l = await UI.ask('wasabi', 'Ooh, a new track! How hard should the dance be?', MYSONG_LEVELS.concat(['Never mind']));
    if (l > 2 || l < 0) return;
    const name = (await askText('A name for the track', 'What is it called?', f.name.slice(0, 32), 32, null, 'Save')) || f.name || 'My song';
    UI.toast('DJ Wasabi is listening to it...');
    let s = null;
    try { s = await MySongs.add(f.bytes, name, MYSONG_LEVELS[l]); } catch (e) { s = null; }
    if (!s) { await UI.say('wasabi', "Hmm. I couldn't find a beat in that one. Is it a song? Try another file!", { keep: true }); return; }
    Sfx.play('fanfare');
    await UI.say('wasabi', [`"${s.name}"! ${Math.round(s.bpm)} beats a minute, ${unpackSteps(s.steps).length} steps. I made you a dance.`,
        "It's on your list now. The song stays on this device; the dance stays with the island."], { keep: true });
}
