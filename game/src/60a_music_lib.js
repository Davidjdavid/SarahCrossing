/* ---- 60a_music_lib.js ---- */
/* The music library (David, 27 October late: "the hourly music ... pick a random game for each hour"): his tracks from
   the games, kept on the server in one folder a game (server/music.mjs, uploaded from the Music app). Outside, and in
   Sarah's house as in Animal Crossing, each hour plays that hour's track from a game picked at random for the hour (the
   same pick all hour and on every device: from the seed, the day and the hour), its rain or snow version on a rainy or
   snowy day where the game has one. The Music app sets it by hand (6w_extras.js: S.music.lib, libSkip, and the hour,
   place and "play now" choices). A track plays from its file through an audio element routed into the music's volume,
   so Settings' switch, the club and the arcade work as before; without the library (offline, the tests) the island's
   own tunes play. */
const MUSIC_FILE_RE = /\.(mp3|m4a|aac|ogg|oga|opus|flac|wav|webm)$/i;
const MusicLib = {
    tracks: null, byPath: null, byGame: null, free: null, loading: null, bad: {},
    load(force) {
        if (LAB || location.protocol === 'file:') return Promise.resolve(null);
        if (this.loading && !force) return this.loading;
        this.loading = Cloud.api('GET', '/api/music').then(r => { this.set(r); return r; }, () => null);
        return this.loading;
    },
    set(r) {
        this.tracks = (r && r.tracks) || [];
        this.free = r ? r.free : null;
        this.uploads = !!(r && r.uploads);
        this.byPath = {}; this.byGame = {};
        for (const t of this.tracks) { this.byPath[t.path] = t; (this.byGame[t.game] = this.byGame[t.game] || []).push(t); }
        if (typeof Music !== 'undefined') Music.update(true);
    },
    games() { return Object.keys(this.byGame || {}).sort((a, b) => a.localeCompare(b)); },
    hourlyGames(h) { return this.games().filter(g => this.byGame[g].some(t => t.hour === h && !this.bad[t.path])); },
    has(p) { return !!(this.byPath && this.byPath[p]) && !this.bad[p]; },
    url(p) { return '/music/' + p.split('/').map(encodeURIComponent).join('/'); },
    name(p) { const t = this.byPath && this.byPath[p]; return t ? `${t.name} (${t.game})` : 'A track from your music'; },
    /* a game's track for an hour, in today's weather where it has one */
    gameHour(game, h) {
        const all = ((this.byGame && this.byGame[game]) || []).filter(t => t.hour === h && !this.bad[t.path]);
        if (!all.length) return null;
        const w = todayWeather(), want = w === 'rain' ? 'rain' : w === 'snow' ? 'snow' : 'clear';
        return (all.find(t => t.weather === want) || all.find(t => t.weather === 'clear') || all[0]).path;
    },
    /* the hour's track: S.music.lib '' is a game at random from the mix (all but libSkip), a game's name only that game,
       'tunes' the island's own tunes */
    hourly(h) {
        if (!this.tracks || !this.tracks.length || !S) return null;
        const M = S.music || {}, mode = M.lib || '';
        if (mode === 'tunes') return null;
        if (mode && this.byGame[mode]) { const p = this.gameHour(mode, h); if (p) return p; }
        const skip = M.libSkip || [], all = this.hourlyGames(h);
        const gs = all.filter(g => !skip.includes(g)).length ? all.filter(g => !skip.includes(g)) : all;
        if (!gs.length) return null;
        const r = mulberry(hash32((S.seed || 'x') + ':music:' + Clock.dayNum() + ':' + h));
        return this.gameHour(gs[Math.floor(r() * gs.length)], h);
    },
    /* what an hour's game is, for the Music app */
    hourGame(h) { const p = this.hourly(h); return p ? this.byPath[p].game : null; },
};

/* music a player adds of their own (David: "have the player be able to upload their own music"): kept on this device
   only, the files in IndexedDB (sc-own-music) and their names in localStorage, never on the server; played on repeat
   or picked for an hour or a place like any track ('own:<id>'). The songs made into dances at the club (6zo_mysongs.js)
   play the same way ('mysong:<id>'). */
const OWN_MUSIC_KEY = 'sc-own-music';
const OwnMusic = {
    _db: null, _list: null,
    db() {
        if (!this._db) this._db = new Promise((ok, bad) => {
            const q = indexedDB.open('sc-own-music', 1);
            q.onupgradeneeded = () => q.result.createObjectStore('files');
            q.onsuccess = () => ok(q.result);
            q.onerror = () => bad(q.error);
        });
        return this._db;
    },
    async files(mode, fn) { const db = await this.db(); return new Promise((ok, bad) => { const tx = db.transaction('files', mode), q = fn(tx.objectStore('files')); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => bad(tx.error); }); },
    list() {
        if (!this._list) { try { this._list = JSON.parse(lsGet(OWN_MUSIC_KEY) || '[]'); } catch (e) { this._list = []; } if (!Array.isArray(this._list)) this._list = []; }
        return this._list;
    },
    keep() { try { localStorage.setItem(OWN_MUSIC_KEY, JSON.stringify(this.list())); } catch (e) { /* storage full or off */ } },
    has(id) { return this.list().some(t => t.id === id) && !MusicLib.bad['own:' + id]; },
    name(id) { const t = this.list().find(x => x.id === id); return t ? t.name : 'One of your own'; },
    async add(files) {
        let n = 0;
        for (const f of Array.from(files || [])) {
            if (!MUSIC_FILE_RE.test(f.name) && !/^audio\//.test(f.type)) continue;
            if (f.size > 80 * 1024 * 1024) { UI.toast(`${f.name} is too big to keep here.`); continue; }
            const id = 'o' + Date.now().toString(36) + n;
            try { await this.files('readwrite', st => st.put(f, id)); } catch (e) { UI.toast("There's no room on this device for more music."); break; }
            this.list().push({ id, name: f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').slice(0, 60), size: f.size });
            n++;
        }
        this.keep();
        return n;
    },
    async remove(id) {
        this._list = this.list().filter(t => t.id !== id);
        this.keep();
        try { await this.files('readwrite', st => st.delete(id)); } catch (e) { /* already gone */ }
    },
    /* a track's bytes, for 'own:<id>' or 'mysong:<id>' */
    async blob(key) {
        if (key.startsWith('own:')) return this.files('readonly', st => st.get(key.slice(4))).catch(() => null);
        const b = await MySongs.get(key.slice(7));
        return b ? new Blob([b]) : null;
    },
};
/* any track that plays from a file: the soundtracks on the server, a player's own, a club song */
function fileTrackOk(key) {
    if (key.startsWith('lib:')) return MusicLib.has(key.slice(4));
    if (key.startsWith('own:')) return OwnMusic.has(key.slice(4));
    if (key.startsWith('mysong:')) return !MusicLib.bad[key] && !!MySongs.find(key.slice(7));
    return false;
}

/* two audio elements taking turns, so one track fades into the next; each made ready for sound in the first tap
   (phones only let an element play that has been started from a tap once) */
const MusicFile = {
    decks: null, turn: 0,
    init() {
        if (this.decks || !Audio2.ctx || typeof Audio === 'undefined') return;
        const c = Audio2.ctx;
        this.decks = [0, 1].map(() => {
            const el = new Audio();
            el.preload = 'auto'; el.loop = true;
            const gain = c.createGain();
            gain.gain.value = 0;
            let node = null;
            try { node = c.createMediaElementSource(el); node.connect(gain); gain.connect(Audio2.music); } catch (e) { node = null; }
            try { el.load(); } catch (e) { /* nothing to load yet */ }
            return { el, gain, node, token: 0, path: null };
        });
    },
    /* key: 'lib:<path>' (from the server), 'own:<id>' or 'mysong:<id>' (from this device) */
    play(key) {
        this.init();
        const c = Audio2.ctx;
        if (!this.decks || !c || !fileTrackOk(key)) return null;
        const d = this.decks[this.turn = 1 - this.turn];
        if (!d.node) return null;
        const token = ++d.token;
        d.path = key;
        const bad = () => {
            if (d.token !== token) return;
            MusicLib.bad[key.startsWith('lib:') ? key.slice(4) : key] = true;
            if (Music.cur && Music.cur.file === d) { Music.key = null; Music.update(true); }
        };
        d.el.onerror = bad;
        d.gain.gain.cancelScheduledValues(c.currentTime);
        d.gain.gain.setValueAtTime(0, c.currentTime);
        d.gain.gain.linearRampToValueAtTime(1, c.currentTime + 1.6);
        const start = src => {
            if (d.token !== token) { if (src.startsWith('blob:')) URL.revokeObjectURL(src); return; }
            if (d.blob) URL.revokeObjectURL(d.blob);
            d.blob = src.startsWith('blob:') ? src : null;
            d.el.src = src;
            const go = d.el.play();
            // (not allowed to start yet: the next tap starts it, Audio2.unlock)
            if (go && go.catch) go.catch(e => { if (d.token === token && e && e.name === 'NotAllowedError') this.waiting = d; });
        };
        if (key.startsWith('lib:')) start(MusicLib.url(key.slice(4)));
        else OwnMusic.blob(key).then(b => (b ? start(URL.createObjectURL(b)) : bad()), bad);
        return d;
    },
    resume() {
        const d = this.waiting;
        this.waiting = null;
        if (d && Music.cur && Music.cur.file === d) { const go = d.el.play(); if (go && go.catch) go.catch(() => {}); }
    },
    stop(d) {
        const c = Audio2.ctx;
        if (!d || !c) return;
        const token = d.token;
        d.gain.gain.cancelScheduledValues(c.currentTime);
        d.gain.gain.setValueAtTime(d.gain.gain.value, c.currentTime);
        d.gain.gain.linearRampToValueAtTime(0, c.currentTime + 1);
        setTimeout(() => {
            if (d.token !== token) return;
            d.el.pause(); d.path = null;
            d.el.removeAttribute('src');
            try { d.el.load(); } catch (e) { /* let go */ }
            if (d.blob) { URL.revokeObjectURL(d.blob); d.blob = null; }
        }, 1200);
    },
};

/* ---------------------------------------------------------------- uploading (the Music app's "Your music") */
/* where each picked file goes in the folder: a picked folder of games keeps each game's folder; a picked game keeps its
   own name (and any Disc 1, Disc 2 inside it) */
function musicUploadPaths(files) {
    const rels = files.map(f => (f.webkitRelativePath || f.name).split('/').filter(Boolean));
    const firsts = new Set(rels.map(r => r[0]));
    const deep = rels.every(r => r.length >= 3) && firsts.size === 1;
    const seconds = new Set(rels.map(r => r[1]));
    const discs = [...seconds].every(s => /^(disc|disk|cd)\s*\d+/i.test(s));
    return rels.map(r => {
        const parts = deep && !discs ? r.slice(1) : r;
        return parts.slice(-3).join('/');
    });
}
const MusicUpload = {
    job: null,
    async start(fileList, onChange) {
        if (this.job && !this.job.done) { UI.toast('Music is already uploading.'); return; }
        const all = Array.from(fileList || []).filter(f => MUSIC_FILE_RE.test(f.name));
        if (!all.length) { UI.toast('No music files there (MP3, M4A, OGG, FLAC or WAV).'); return; }
        const paths = musicUploadPaths(all);
        await MusicLib.load(true);
        // (what's there already at the same size is skipped, so an upload cut off part way goes on where it stopped)
        const todo = all.map((f, i) => ({ f, path: paths[i] })).filter(x => !(MusicLib.byPath && MusicLib.byPath[x.path] && MusicLib.byPath[x.path].size === x.f.size));
        // (job.watch: whichever Music app screen is showing it, told as it goes and once more at the end)
        const job = this.job = { n: 0, of: todo.length, bytes: 0, total: todo.reduce((s, x) => s + x.f.size, 0), skipped: all.length - todo.length, failed: 0, now: '', done: false, stop: false, err: null, watch: onChange };
        const tell = last => { try { if (job.watch) job.watch(job, last); } catch (e) { /* the screen closed */ } };
        tell();
        for (const x of todo) {
            if (job.stop) break;
            job.now = x.path;
            tell();
            let ok = false;
            for (let tries = 0; tries < 3 && !ok && !job.stop; tries++) {
                try {
                    const res = await fetch('/api/music/file?path=' + encodeURIComponent(x.path), { method: 'PUT', headers: { 'X-Sarah': '1', 'Content-Type': x.f.type || 'application/octet-stream' }, body: x.f, credentials: 'same-origin' });
                    if (res.ok) ok = true;
                    else if (res.status === 507) { job.err = "The server's disk is nearly full, so the upload stopped."; job.stop = true; }
                    else if (res.status === 401) { job.err = 'Log in again to upload music.'; job.stop = true; }
                    else if (res.status === 413 || res.status === 415 || res.status === 400) break;
                } catch (e) { await new Promise(r => setTimeout(r, 1500 * (tries + 1))); }
            }
            if (!ok) job.failed++;
            job.n++;
            job.bytes += x.f.size;
            tell();
        }
        job.done = true;
        job.now = '';
        await MusicLib.load(true);
        tell(true);
        UI.toast(job.err || (job.stop ? 'Upload stopped.' : `Music uploaded: ${fmtNum(job.n - job.failed)} track${job.n - job.failed === 1 ? '' : 's'}${job.failed ? ` (${job.failed} didn't go)` : ''}.`));
    },
};
function fmtBytes(n) {
    if (n == null) return '?';
    return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? Math.round(n / 1e6) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
}
