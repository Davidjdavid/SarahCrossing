/* ---- 63_karaoke.js ---- */
/* Karaoke at Club Wasabi: sing one of Joe's poems, or a song Sarah wrote. Each gets its own little tune (one note per
   syllable). The notes scroll past. Set Sarah's pitch with up and down (it stays where you leave it), and hold Space (or
   the SING button) to sing; she sings the words out loud (63a_singing.js). Sing on the notes, on key, and the words light
   up. Joe, if he's there, is very moved. */

/* the pitch marker moves while up or down is held, in semitones a second: quick from the start and quicker the longer
   it's held, so a nudge stays small and a leap gets there (David, 29 October: the old speed couldn't reach some notes in
   time); the same in every song whatever its range, and by the clock, so a slow phone moves it as fast */
const KARA_V0 = 16, KARA_V1 = 34, KARA_ACC = 80;
/* how far the marker gets (semitones) with a key held t seconds from a standstill */
function karaReach(t) {
    const ta = (KARA_V1 - KARA_V0) / KARA_ACC;
    return t <= ta ? KARA_V0 * t + KARA_ACC * t * t / 2 : KARA_V0 * ta + KARA_ACC * ta * ta / 2 + KARA_V1 * (t - ta);
}
/* the hit band either side of a note (semitones) in a song whose bar spans `range` semitones */
function karaTolSemi(range) { return 0.09 * range + 0.6; }
/* every leap in a tune is one the marker can make: by the end of the gap and the first quarter of the next note (so the
   rest of it, 75%, is still ON KEY), counting the narrowest hit band a tune with a leap can have */
const KARA_LATE = 0.25, KARA_TOL0 = 1;

function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
}
/* a poem becomes a song: two intro bars, two bars a line, two to finish */
function karaokeSong(poem) {
    const [title, lines0] = poem;
    const lines = lines0.slice(0, 12);
    // (a song Sarah wrote gets its tune from all its words, so the same words always go the same way)
    const r = mulberry(hash32(poem.mine ? 'karaoke:mine:' + title + '|' + lines.join('|') : 'karaoke:' + title));
    const bpm = 84 + Math.floor(r() * 16);
    const root = 55 + [0, 2, 3, 5, 7][Math.floor(r() * 5)];
    const spec = { bpm, root, scale: 'major', lead: 'flute', leadVol: 0.1, hold: 4, chords: rpick([[1, 5, 6, 4], [1, 6, 4, 5], [1, 4, 6, 5], [1, 4, 5, 1]], r),
        form: '__', mel: {}, bass: 'x...x.o.', bassVol: 0.22, pad: 'pad', padVol: 0.03, arp: '..x...x.', arpInstr: 'piano', arpVol: 0.035,
        drums: { kick: 'x...x...', snare: '....x...', hat: '..o...o.' }, drumVol: 0.28 };
    const sd = 60 / bpm / 2;
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const notes = [], out = [];
    const tok = d => (d <= 7 ? String(d) : '^' + (d - 7));
    let deg = r() < 0.5 ? 3 : 5;
    lines.forEach((text, li) => {
        const words = text.split(/\s+/).filter(Boolean);
        const syl = words.map(syllables);
        let tot = syl.reduce((a, b) => a + b, 0);
        while (tot > 14) { const i = syl.indexOf(Math.max(...syl)); syl[i]--; tot--; }
        const each = tot <= 6 ? 2 : 1;
        const hold = Math.max(1, Math.min(each === 2 ? 4 : 3, 16 - tot * each));
        const toks = new Array(16).fill('-');
        const bar0 = 2 + li * 2;
        const W = words.map(w => ({ text: w, t0: null, t1: null }));
        let step = 0, k = 0;
        words.forEach((w, wi) => {
            const parts = singSyllables(w, syl[wi]);           // (how each syllable is sung: 63a_singing.js)
            for (let s = 0; s < syl[wi]; s++, k++) {
                const last = k === tot - 1;
                if (last) deg = li % 2 ? (deg >= 5 ? 8 : 1) : 5;
                else if (k > 0 && r() > 0.15) deg = clamp(deg + (r() < (k < tot / 2 ? 0.64 : 0.36) ? 1 : -1) * (r() < 0.25 ? 2 : 1), 1, 8);
                const len = last ? hold : each;
                const s0 = bar0 * 8 + step;
                // a leap the marker couldn't make in time comes in a step at a time until it can
                const pv = notes[notes.length - 1];
                if (pv && pv.line === li) {
                    const have = s0 * sd - pv.t1 + KARA_LATE * (len * sd - 0.03);
                    while (deg !== pv.deg && Math.abs(degToMidi(root + 12, 'major', tok(deg)) - pv.midi) - KARA_TOL0 > karaReach(have)) deg += deg > pv.deg ? -1 : 1;
                }
                toks[step] = tok(deg);
                for (let h = 1; h < len && step + h < 16; h++) toks[step + h] = '.';
                notes.push({ t0: s0 * sd, t1: (s0 + len) * sd - 0.03, midi: degToMidi(root + 12, 'major', toks[step]), deg, syl: parts[s] || null, line: li, word: wi, hit: 0, tot: 0 });
                if (W[wi].t0 == null) W[wi].t0 = s0 * sd;
                W[wi].t1 = (s0 + len) * sd;
                step += len;
            }
        });
        // a word with no letters in it rides along with its neighbour
        W.forEach((w, i) => { if (w.t0 == null) { const pv = W[i - 1] && W[i - 1].t0 != null ? W[i - 1] : W[i + 1]; w.t0 = pv && pv.t0 != null ? pv.t0 : bar0 * 8 * sd; w.t1 = pv && pv.t1 != null ? pv.t1 : w.t0; } });
        spec.mel[L[li * 2]] = toks.slice(0, 8).join(' ');
        spec.mel[L[li * 2 + 1]] = toks.slice(8).join(' ');
        spec.form += L[li * 2] + L[li * 2 + 1];
        out.push({ text, words: W, t0: bar0 * 8 * sd, t1: (bar0 + 2) * 8 * sd });
    });
    spec.form += '__';
    return { spec, notes, lines: out, sd };
}

const JOE_KARAOKE = {
    S: "You sang it perfectly! I wrote that in four minutes, and you made it sound like four whole minutes. Amazing.",
    A: "That's my poem! On a stage! With music! This is the best night of my life. Second best. The frog poem night was also good.",
    B: "You sang my poem! Some of the notes were in there! All of the words were! That's what counts in poetry.",
    C: "That was so brave! My poems are tricky to sing. They have a lot of feelings in them. Thank you for trying. I'm framing this moment. Somehow.",
};
/* and for a song Sarah wrote herself */
const JOE_KARAOKE_MINE = {
    S: "You WROTE that? And sang it? Perfectly? I need to sit down. I am sitting down. I need to sit down more.",
    A: "A song by you! The words were yours and the notes were mostly where they go. That's called being a songwriter. I'm so proud.",
    B: "You wrote your own song! Some of the notes wandered off. Words do that too. That's how you know it's art.",
    C: "Writing it AND singing it! That takes courage. My first poem was about a shoe. Keep going. Never stop.",
};
function karaokePoems() {
    const all = JOE_POEMS.concat([JOE_SUNSET_POEM]);
    return all.filter(p => p[0] === 'Shoe' || S.poems.includes(p[0]));
}
/* tonight's request at the club (David, 27 October: "songs and poems that rotate, so there's something new to check each
   day"): one of the poems Sarah has, a different one each night; the crowd tips extra the first time she sings it */
function karaokeRequest(day) {
    const have = karaokePoems();
    if (have.length < 2) return null;
    return have[hash32((S.seed || 'x') + ':req:' + (day == null ? Clock.dayNum() : day)) % have.length];
}
/* the songs Sarah writes herself (David, 29 October: "can we write our own karaoke songs?"): S.karaoke.mine, each
   { id, title, lines, day, best }, a person's own like the rest of karaoke; as poems the stage sings, the song riding
   along as `mine` (its tune comes from its words: karaokeSong) */
const KARA_MINE_MAX = 12, KARA_LINES = 8, KARA_LINE_LEN = 40, KARA_TITLE_LEN = 24;
function karaokeMine() {
    return ((S.karaoke && S.karaoke.mine) || []).filter(s => s && Array.isArray(s.lines) && s.lines.length).map(s => Object.assign([s.title, s.lines.slice()], { mine: s }));
}
/* what was typed, tidied: letters, numbers and a little punctuation (no markup), one space at a time */
function karaokeClean(v, max) {
    return String(v || '').replace(/<[^>]*>/g, '').replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[^\p{L}\p{N} '!?.,-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();
}
/* the words, a line each: only lines with something to sing in them (the tune counts English syllables), eight at most */
function karaokeLines(text) {
    return String(text || '').split(/\r?\n/).map(l => karaokeClean(l, KARA_LINE_LEN)).filter(l => /[a-z]/i.test(l)).slice(0, KARA_LINES);
}
function karaokeMenu() {
    return new Promise(res => {
        let done = false;
        const fin = v => { if (done) return; done = true; UI.close(true); Sfx.ui('ok'); res(v); };
        const P = UI.open({ title: 'Karaoke', onClose: () => { if (!done) { done = true; res(null); } } });
        P.body.appendChild(el('p', 'muted', "Pick one of Joe's poems, or a song you wrote. Up and down (\u25b2 \u25bc) set your pitch, and it stays put; hold Space (or SING) to sing. Every poem Joe reads you joins the list."));
        const L = el('div', 'list');
        // (tonight's request first)
        const req = karaokeRequest();
        for (const poem of karaokePoems().sort((a, b) => (b === req) - (a === req))) {
            const r = el('button', 'row');
            r.type = 'button';
            r.appendChild(iconCanvas('app_poems', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, poem === req ? `${poem[0]} \u2605 tonight's request` : poem[0]));
            const best = S.karaoke.best[poem[0]];
            t.appendChild(el('span', null, `"${poem[1][0]}"${best ? ' \u00b7 best ' + best : ''}`));
            r.appendChild(t);
            r.addEventListener('click', () => fin(poem));
            L.appendChild(r);
        }
        // the songs Sarah wrote, each to sing or change, and room for another
        L.appendChild(el('p', null, 'Songs you wrote'));
        for (const poem of karaokeMine()) {
            const sg = poem.mine, r = el('div', 'row kara-mine');
            r.tabIndex = 0; r.setAttribute('role', 'button');
            r.appendChild(iconCanvas('app_music', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, sg.title));
            t.appendChild(el('span', null, `"${sg.lines[0]}"${sg.best ? ' \u00b7 best ' + sg.best : ''}`));
            r.appendChild(t);
            r.appendChild(chip('Change', () => fin({ write: true, song: sg })));
            r.addEventListener('click', () => fin(poem));
            r.addEventListener('keydown', e => { if (e.key === 'Enter') fin(poem); });
            L.appendChild(r);
        }
        if ((S.karaoke.mine || []).length < KARA_MINE_MAX) {
            const w = el('button', 'row kara-write');
            w.type = 'button';
            w.appendChild(iconCanvas('app_edit', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, 'Write a song'));
            t.appendChild(el('span', null, 'A title and a few lines. DJ Wasabi writes the tune.'));
            w.appendChild(t);
            w.addEventListener('click', () => fin({ write: true }));
            L.appendChild(w);
        } else L.appendChild(el('p', 'muted', `That's ${KARA_MINE_MAX} songs! Change one, or delete one to write another.`));
        // the poems Joe hasn't read to Sarah yet
        const have = new Set(karaokePoems().map(p => p[0]));
        for (const poem of JOE_POEMS.concat([JOE_SUNSET_POEM])) {
            if (have.has(poem[0])) continue;
            const r = el('div', 'row locked');
            r.appendChild(iconCanvas('ui_lock', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, '???'));
            t.appendChild(el('span', null, "Locked. Joe hasn't read you this one yet. Ask him for a poem!"));
            r.appendChild(t);
            L.appendChild(r);
        }
        P.body.appendChild(L);
    });
}
/* the page a song is written on: a title and the words, a line each. Resolves with { title, lines }, { gone: true } for a
   song deleted (a second tap to be sure), or null */
function karaokeWrite(song) {
    return new Promise(res => {
        let done = false, sure = false;
        const fin = v => { if (done) return; done = true; UI.close(true); res(v); };
        const P = UI.open({ title: song ? `"${song.title}"` : 'Write a song', onClose: () => { if (!done) { done = true; res(null); } } });
        P.body.appendChild(el('p', 'muted', `A title, then the words: a line for each line of the song, up to ${KARA_LINES}. DJ Wasabi writes a tune for them, and the same words always go the same way.`));
        const f1 = el('label', 'field');
        f1.appendChild(el('span', null, 'Title'));
        const ti = el('input');
        ti.id = 'karatitle'; ti.maxLength = KARA_TITLE_LEN; ti.autocomplete = 'off'; ti.value = song ? song.title : '';
        f1.appendChild(ti);
        P.body.appendChild(f1);
        const f2 = el('label', 'field');
        f2.appendChild(el('span', null, 'The words'));
        const ta = el('textarea', 'cv-letter');
        ta.id = 'karawords'; ta.maxLength = KARA_LINES * (KARA_LINE_LEN + 2); ta.rows = 6; ta.value = song ? song.lines.join('\n') : '';
        ta.placeholder = 'The sea is blue\nThe sand is warm\nI sing a song\nFor the whole island';
        f2.appendChild(ta);
        P.body.appendChild(f2);
        const msg = el('p', 'muted');
        P.body.appendChild(msg);
        ti.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); ta.focus(); } });
        ta.addEventListener('keydown', e => e.stopPropagation());
        const row = el('div', 'st-row');
        row.appendChild(chip(song ? 'Save it' : 'Write it', () => {
            const lines = karaokeLines(ta.value);
            if (!lines.length) { msg.textContent = 'Write a line or two first! (Words with letters in them: the singable kind.)'; return; }
            fin({ title: karaokeClean(ti.value, KARA_TITLE_LEN) || 'My song', lines });
        }, 'go'));
        if (song) row.appendChild(chip('Delete it', b => { if (!sure) { sure = true; b.textContent = 'Tap again to delete'; return; } fin({ gone: true }); }));
        row.appendChild(chip('Never mind', () => fin(null)));
        P.body.appendChild(row);
        setTimeout(() => { try { (song ? ta : ti).focus(); } catch (e) { /* fine */ } }, 60);
    });
}
/* write one (or change or delete `song`), then back to the list */
async function karaokeWriteFlow(song) {
    const K = S.karaoke, v = await karaokeWrite(song);
    if (!v) return;
    if (!Array.isArray(K.mine)) K.mine = [];
    if (v.gone) {
        K.mine = K.mine.filter(s => s !== song);
        Save.touch();
        await UI.say('wasabi', `"${song.title}" is off the list. Every great songwriter has a drawer of songs nobody hears.`, { keep: true });
        return;
    }
    if (song) {
        // (new words make a new tune, so the old best goes)
        if (song.title !== v.title || song.lines.join('\n') !== v.lines.join('\n')) delete song.best;
        song.title = v.title; song.lines = v.lines;
    } else K.mine.push({ id: 1 + K.mine.reduce((m, s) => Math.max(m, +s.id || 0), 0), title: v.title, lines: v.lines, day: Clock.dayNum() });
    Save.touch();
    Sfx.play('fanfare');
    await UI.say('wasabi', song ? `New words for "${v.title}"! And a new tune to go with them. I'm fast.` : `"${v.title}"! Lovely words, superstar. I wrote you a tune for them: it's on your list.`, { keep: true });
}
async function karaokeNight(opts) {
    if (!S.flags.karaokeTold) {
        S.flags.karaokeTold = true;
        await UI.say('wasabi', ["KARAOKE! Joe gave me all his poems. ALL of them. There are a lot.",
            'Here is how it works, superstar: the notes slide by. Up and down set your pitch, and it stays where you leave it. Hold the button to sing. Stay on the notes!',
            "And if you write a song of your own, I'll make a tune for it. Any words you like!"], { keep: true });
    }
    UI.hideDialog();
    for (;;) {
        const pick = await karaokeMenu();
        if (!pick) return;
        if (pick.write) { await karaokeWriteFlow(pick.song); UI.hideDialog(); continue; }
        await Karaoke.start(pick, opts);
        return;
    }
}

const Karaoke = {
    on: false, ready: false, held: false, up: false, down: false,
    async start(poem, opts) {
        const p = G.player;
        this.poem = poem;
        this.watch = !!(opts && opts.watch);           // just listening: Sarah sings it herself, no pitch bar, no score
        this.duet = (opts && opts.duet) || null;        // a duet: a neighbor sings every other line (6zw_island_games.js)
        this.dHit = 0; this.dTot = 0;
        this.quitting = false;
        this.song = karaokeSong(poem);
        this.on = true; this.ready = false; this.held = false; this.up = false; this.down = false; this.v = 0.5; this.trail = []; this.sparks = []; this.hitF = 0; this.totF = 0; this.judgeT = 0; this.onKey = false; this.singF = 0;
        G.busy++;
        HUD.show(false);
        await fadeTo(async () => {
            p.x = 7.5 * TILE; p.y = 6.9 * TILE; p.dir = 'down'; p.path = null;
            const d = this.duet;
            if (d) { if (d.chat) Chats.end(d.chat); d.script = true; d.path = null; d.x = 9.5 * TILE; d.y = 6.9 * TILE; d.dir = 'down'; d.flip = true; }
        });
        const info = Music.startSong('karaoke', this.song.spec);
        this.duration = info.duration;
        this.lead = info.lead;
        this.beat = info.beat;
        const mids = this.song.notes.map(n => n.midi);
        this.lo = Math.min(...mids) - 1.5; this.hi = Math.max(...mids) + 1.5;
        this.lastT = null; this.heldT = 0; this.dir = 0; this.drag = false; this.dragAt = null;
        this.voiceOn();
        for (const s of ['#djudge', '#dcombo', '#dcount', '#dlyric']) { $(s).style.left = ''; $(s).style.top = ''; $(s).textContent = ''; }
        $('#dancehud').hidden = false;
        $('#dsong').textContent = `"${poem[0]}" \u00b7 ${this.byline()}` + (this.duet ? ` \u00b7 a duet with ${this.duet.def.name}` : '');
        $('#dscore').textContent = '';
        $('#dtip').textContent = this.watch ? 'Just listening: Sarah sings it on her own.' : G.touchUsed ? '\u25b2 \u25bc (or slide) set your pitch \u00b7 hold SING' : '\u2191 \u2193 set your pitch (it stays put) \u00b7 hold Space to sing \u00b7 Esc to stop';
        if (this.watch) $('#dsong').textContent = `"${poem[0]}" \u00b7 ${this.byline()} \u00b7 just listening`;
        this._ly = null;
        this.pads(!this.watch);
        this.ready = true;
        await new Promise(res => { this._done = res; });
    },
    now() { return Music.songTime(); },
    byline() { return this.poem && this.poem.mine ? `a song by ${S.playerName || 'Sarah'}` : 'a poem by Joe'; },
    norm(m) { return (m - this.lo) / (this.hi - this.lo); },
    hold(v) { if (this.on && !this.watch) this.held = !!v; },
    pitch(dir, v) { if (!this.on || this.watch) return; if (dir > 0) this.up = !!v; else this.down = !!v; },
    pads(on) {
        const P = $('#karaokepads');
        if (!P) return;
        P.hidden = !on || !G.touchUsed;
        if (P.dataset.wired) return;
        P.dataset.wired = '1';
        for (const b of P.querySelectorAll('button')) {
            const k = b.dataset.k;
            const set = v => { b.classList.toggle('on', v); if (k === 'sing') this.hold(v); else this.pitch(k === 'up' ? 1 : -1, v); };
            b.addEventListener('pointerdown', ev => {
                ev.preventDefault(); ev.stopPropagation(); Audio2.unlock();
                try { b.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ }
                if (k !== 'sing') this.dragAt = { id: ev.pointerId, y: ev.clientY, v: this.v, on: false };
                set(true);
            });
            // a finger sliding up or down the arrows takes the marker with it, as far as it slides along the bar: on a phone,
            // quicker than holding an arrow down
            if (k !== 'sing') b.addEventListener('pointermove', ev => {
                const d = this.dragAt;
                if (!d || d.id !== ev.pointerId || !this.on || this.watch) return;
                if (!d.on) {
                    if (Math.abs(ev.clientY - d.y) < 10) return;
                    d.on = true; d.y = ev.clientY; d.v = this.v; this.up = this.down = false; this.drag = true;
                }
                this.v = clamp(d.v + (d.y - ev.clientY) / Math.max(40, this.barPx || 120), 0, 1);
            });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, () => { set(false); if (k !== 'sing') { this.dragAt = null; this.drag = false; } }));
            b.addEventListener('contextmenu', ev => ev.preventDefault());
        }
    },
    update() {
        if (!this.on || !this.ready) return;
        const t = this.now(), p = G.player;
        if (this.watch) {
            // Sarah sings it herself: right on the notes
            const c = this.song.notes.find(n => t >= n.t0 - 0.03 && t < n.t1);
            this.held = !!c;
            if (c) this.v += (this.norm(c.midi) - this.v) * 0.35;
        }
        // the pitch only moves while up or down is held, quicker the longer it's held (karaReach), by the clock rather than
        // by frames; it stays where it's left
        const wall = performance.now() / 1000, dt = this.lastT == null ? 0 : clamp(wall - this.lastT, 0, 0.1);
        this.lastT = wall;
        const dir = this.drag ? 0 : (this.up ? 1 : 0) - (this.down ? 1 : 0);
        if (dir) {
            if (dir !== this.dir) this.heldT = 0;
            this.heldT += dt;
            this.v = clamp(this.v + dir * Math.min(KARA_V1, KARA_V0 + KARA_ACC * this.heldT) * dt / (this.hi - this.lo), 0, 1);
        } else this.heldT = 0;
        this.dir = dir;
        const cur = this.song.notes.find(n => t >= n.t0 && t < n.t1);
        const tol = karaTolSemi(this.hi - this.lo) / (this.hi - this.lo);
        this.onKey = false;
        const singing = this.held;
        if (singing) this.singF++;
        // a duet: the other lines are theirs, sung as well as they sing (Sarah can hum along; it doesn't count)
        const theirs = !!(this.duet && cur && cur.line % 2 === 1);
        this.duetTick(theirs ? cur : null);
        if (cur && !theirs) {
            cur.tot++; this.totF++;
            if (singing && Math.abs(this.v - this.norm(cur.midi)) <= tol) { cur.hit++; this.hitF++; this.onKey = true; }
        }
        this.trail.push({ t, v: this.v, on: this.onKey, sing: singing });
        while (this.trail.length && t - this.trail[0].t > 2.6) this.trail.shift();
        for (const n of this.song.notes) {
            if (n.judged || t < n.t1) continue;
            n.judged = true;
            if (!n.tot) continue;
            const q = n.hit / n.tot;
            if (q >= 0.7) this.judge('ON KEY!', '#ffd84a');
            else if (q >= 0.35) this.judge('NICE', '#8cc152');
        }
        if (this.judgeT && --this.judgeT === 0) $('#djudge').textContent = '';
        this.voiceTick(singing, cur, theirs, t);
        p.pose = singing ? (this.onKey ? 'cheer' : 'happy') : null; p.poseT = 6;
        const acc = this.totF ? this.hitF / this.totF : 0;
        for (const n of NPCs.here()) if (n.id !== 'wasabi') n.hop = Math.abs(Math.sin(G.t / 9 + n.x)) * (1 + acc * 3);
        const joe = NPCs.get('joe');
        if (joe && joe.area === 'club' && !joe.sleeping && G.frame % 90 === 0 && this.onKey) { joe.emote = rpick(['heart', 'note', 'sparkle']); joe.emoteT = 60; }
        if (t > this.duration + 0.3) this.finish();
    },
    judge(text, col) { const e = $('#djudge'); e.textContent = text; e.style.color = col; this.judgeT = 36; },
    duetTick(cur) {
        const d = this.duet;
        if (!d) return;
        if (cur) {
            if (cur.pq == null) cur.pq = clamp(0.45 + (VS_SKILL[d.id] || 0.5) * 0.5 + (R() - 0.5) * 0.3, 0.15, 1);
            cur.tot++; this.dTot++;
            if (R() < cur.pq) { cur.hit++; this.dHit++; }
            d.pose = 'cheer'; d.hop = Math.abs(Math.sin(G.t / 6)) * 2;
        } else d.pose = null;
        // their voice, in their own way of singing: a little off the note when they're unsure, wobbling (and now and then
        // cracking) when they're a shaky singer
        const V2 = this.vo2;
        if (V2) Singer.tick(V2, cur ? cur.midi + V2.o.shift + (1 - cur.pq) * Math.sin(G.t / 7) * 0.8 : null, !!cur && Audio2.sfxOn, 0.85, cur ? clamp((0.6 - cur.pq) * 1.8, 0, 1) : 0);
    },
    /* the voices (63a_singing.js): whoever's playing on this device, by their look (a man's voice is lower), and the
       duet's neighbor in their own; none without Web Audio */
    voiceOn() {
        const c = Audio2.ctx;
        this.vo = this.vo2 = null;
        this.nextSyl = 0; this.humming = false; this.lastEnd = 0;
        if (!c) return;
        try {
            const who = typeof Online !== 'undefined' ? Online.who() : 'sarah';
            const masc = !!look().masc || ['david', 'james', 'john', 'joe'].includes(who);
            this.vo = Singer.make(c, Audio2.sfx, Singer.opts(VOICES[who] || VOICES.sarah, masc));
            const d = this.duet;
            if (d) this.vo2 = Singer.make(c, Audio2.sfx, Singer.opts(VOICES[d.id] || Voices.profile(d.id, d.def), !!(d.def && d.def.human)));
        } catch (e) { console.warn('karaoke voice', e); this.vo = this.vo2 = null; }
    },
    /* the audio clock's time at a moment of the song (the music is scheduled on it; with the music off, from now) */
    ctxAt(st) { const s = Music.song; return s && s.audio ? s.t0 + st : Audio2.ctx.currentTime + st - this.now(); },
    voiceTick(singing, cur, theirs, t) {
        const V = this.vo;
        if (!V) return;
        // each syllable's mouth, scheduled a moment ahead on the music's clock: Sarah's, and in a duet every other line
        // the neighbor's (it's only heard while they're singing)
        const N = this.song.notes;
        while (this.nextSyl < N.length && N[this.nextSyl].t0 < t + 0.2) {
            const n = N[this.nextSyl++], who = this.duet && n.line % 2 === 1 ? this.vo2 : V;
            if (who && n.t1 > t) Singer.syl(who, n.syl, this.ctxAt(n.t0), n.t1 - n.t0);
        }
        // she sings the pitch she's holding: off the note, past the hit band, it wobbles, then rasps and cracks
        const range = this.hi - this.lo, m = this.lo + this.v * range;
        const off = cur && !theirs && !this.watch ? clamp((Math.abs(m - cur.midi) - karaTolSemi(range)) / 3, 0, 1) : 0;
        // (still singing between lines: a hum)
        if (cur) { this.humming = false; this.lastEnd = cur.t1; }
        else if (singing && !this.humming && t - this.lastEnd > 0.25) { Singer.hum(V); this.humming = true; }
        Singer.tick(V, m + V.o.shift, singing && Audio2.sfxOn, theirs ? 0.4 : 1, off, !!cur && !V.on && t - cur.t0 > 0.12);
    },
    voiceOff() {
        Singer.stop(this.vo); Singer.stop(this.vo2);
        this.vo = this.vo2 = null;
    },
    draw(ctx) {
        if (!this.on || !this.ready) return;
        const v = G.view, t = this.now(), cs = v.cssScale;
        const W = Math.min(v.w - 16, 360), H = clamp(Math.round(v.h * 0.26), 48, 76);
        const kp = $('#karaokepads'), padH = kp && !kp.hidden ? Math.round((kp.getBoundingClientRect().height || 150) / cs) + 8 : 0;
        const x0 = Math.round((v.w - W) / 2), y0 = v.h - H - 22 - padH;
        this.barPx = (H - 8) * cs;            // (the bar's height on the page: how far a finger slides for the whole range)
        G.camShift = [0, Math.round((H + 40 + padH) / 2)];
        G.camTarget = [7.5 * TILE, 5.6 * TILE + (H + 40 + padH) / 2];
        if (!this.watch) {
        ctx.fillStyle = 'rgba(20,16,40,0.8)';
        ctx.fillRect(x0 - 4, y0 - 4, W + 8, H + 8);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 1; i < 4; i++) ctx.fillRect(x0, y0 + Math.round(H * i / 4), W, 1);
        const nx = x0 + Math.round(W * 0.24), pps = W / 4.2;
        const yOf = nv => y0 + 4 + Math.round((1 - nv) * (H - 8));
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.clip();
        for (const n of this.song.notes) {
            const xa = nx + (n.t0 - t) * pps, xb = nx + (n.t1 - t) * pps;
            if (xb < x0 || xa > x0 + W) continue;
            const y = yOf(this.norm(n.midi));
            const past = t >= n.t1, now = t >= n.t0 && t < n.t1;
            const duo = this.duet && n.line % 2 === 1;
            ctx.fillStyle = past ? (n.tot && n.hit / n.tot >= 0.5 ? (duo ? '#9ef0ff' : '#ffd84a') : 'rgba(184,160,200,0.5)') : now ? (duo ? '#c8f4ff' : '#ffb3d9') : duo ? '#4ec3d9' : '#ff5aa8';
            ctx.fillRect(Math.round(xa) + 1, y - 2, Math.max(2, Math.round(xb - xa) - 2), 5);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillRect(Math.round(xa) + 2, y - 2, Math.max(1, Math.round(xb - xa) - 4), 1);
        }
        for (const tr of this.trail) {
            if (!tr.sing) continue;
            const x = Math.round(nx + (tr.t - t) * pps);
            ctx.fillStyle = tr.on ? 'rgba(255,216,74,0.95)' : 'rgba(255,255,255,0.6)';
            ctx.fillRect(x, yOf(tr.v), 2, 2);
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(255,216,74,0.55)';
        ctx.fillRect(nx, y0, 1, H);
        const my = yOf(this.v);
        // the pitch marker: a little arrow when she's quiet, a bright note when she's singing
        ctx.fillStyle = '#2d2230'; ctx.fillRect(nx - 3, my - 3, 7, 7);
        ctx.fillStyle = this.held ? (this.onKey ? '#ffd84a' : '#ffffff') : 'rgba(255,255,255,0.55)'; ctx.fillRect(nx - 2, my - 2, 5, 5);
        ctx.fillStyle = this.held ? (this.onKey ? '#ff8a1a' : '#e0405a') : 'rgba(224,64,90,0.5)'; ctx.fillRect(nx - 1, my - 1, 3, 3);
        if (!this.held) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(nx - 8, my, 4, 1); }
        if (this.onKey && G.frame % 5 === 0) this.sparks.push({ x: nx, y: my, t: 0, vx: -0.7 - R() * 0.7, vy: (R() - 0.5) * 0.9 });
        for (const sp of this.sparks) {
            sp.t++;
            ctx.fillStyle = `rgba(255,216,74,${Math.max(0, 1 - sp.t / 20)})`;
            ctx.fillRect(Math.round(sp.x + sp.vx * sp.t), Math.round(sp.y + sp.vy * sp.t), 1, 1);
        }
        this.sparks = this.sparks.filter(sp => sp.t < 20);
        }
        // the words (HTML, so they stay crisp)
        const lines = this.song.lines;
        let li = 0;
        for (let i = 0; i < lines.length; i++) if (t >= lines[i].t0 - 0.9) li = i;
        const L = lines[li];
        const html = (this.duet && li % 2 === 1 ? `<em>${esc(this.duet.def.name)}:</em> ` : '') + L.words.map(w => `<span class="${t >= w.t1 - 0.02 ? 'sung' : t >= w.t0 ? 'on' : ''}">${esc(w.text)}</span>`).join(' ');
        const ly = $('#dlyric');
        if (this._ly !== html) { ly.innerHTML = html; this._ly = html; }
        const top = Math.round((y0 - 6) * cs - ly.offsetHeight) + 'px';
        if (ly.style.top !== top) ly.style.top = top;
        if (!ly.classList.contains('sing')) ly.classList.add('sing');
        const acc = this.totF + this.dTot ? Math.round((this.hitF + this.dHit) / (this.totF + this.dTot) * 100) : 0;
        const sc = this.totF + this.dTot && !this.watch ? `${acc}% on key` : '';
        if ($('#dscore').textContent !== sc) $('#dscore').textContent = sc;
        const intro = this.lead - t;
        const cnt = intro > 0 ? (intro > this.beat * 3 ? 'Ready' : String(Math.ceil(intro / this.beat))) : '';
        if ($('#dcount').textContent !== cnt) $('#dcount').textContent = cnt;
    },
    quit() { if (this.on && this.ready) { this.quitting = true; this.finish(); } },
    finish() {
        if (!this.on) return;
        this.on = false; this.ready = false; this.held = false; this.up = false; this.down = false;
        this.pads(false);
        Music.stopSong();
        this.voiceOff();
        G.camShift = null; G.camTarget = null;
        $('#dancehud').hidden = true;
        $('#dlyric').innerHTML = ''; $('#dlyric').style.top = ''; $('#dlyric').classList.remove('sing');
        $('#dtip').textContent = '';
        HUD.show(true);
        G.player.pose = null;
        if (this.duet) { this.duet.script = false; this.duet.pose = null; }
        if (this.watch || this.quitting) {
            // just listening, or left early: no score, no tips, no penalty
            if (this.quitting && !this.watch) UI.toast('Sarah left the stage early. No score this time.');
            this.quitting = false;
            G.busy = Math.max(0, G.busy - 1);
            if (this._done) { const d = this._done; this._done = null; d(); }
            return;
        }
        this.results();
    },
    async results() {
        const acc = this.totF + this.dTot ? (this.hitF + this.dHit) / (this.totF + this.dTot) : 0;
        const rank = acc >= 0.7 ? 'S' : acc >= 0.52 ? 'A' : acc >= 0.35 ? 'B' : 'C';
        const title = this.poem[0], mine = this.poem.mine, K = S.karaoke, day = Clock.dayNum();
        const order = 'CBAS';
        K.ranks = K.ranks || {};
        // (a song she wrote keeps its own best; its rank counts for the specials as a poem's does)
        if (mine) { if (!mine.best || order.indexOf(rank) > order.indexOf(mine.best)) mine.best = rank; K.ranks['my:' + mine.id] = mine.best; }
        else { if (!K.best[title] || order.indexOf(rank) > order.indexOf(K.best[title])) K.best[title] = rank; K.ranks[title] = K.best[title]; }
        S.stats.karaoke = (S.stats.karaoke || 0) + 1;
        const what = mine ? `"${title}", your very own song` : `"${title}" by Joe`;
        if (this.duet) await UI.say('wasabi', `${what}, a duet with ${this.duet.def.name}! Rank ${rank}. The two of you were on key ${Math.round(acc * 100)}% of the time.`, { keep: true });
        else await UI.say('wasabi', `${what}! Rank ${rank}. You were on key ${Math.round(acc * 100)}% of the time.`, { keep: true });
        if (this.duet) await duetEnd(this.duet, rank);
        const joe = NPCs.get('joe');
        if (joe && !joe.sleeping && joe.area === 'club') {
            joe.emote = 'heart'; joe.emoteT = 90;
            await UI.say('joe', (mine ? JOE_KARAOKE_MINE : JOE_KARAOKE)[rank], { keep: true });
            if (K.joeDay !== day) { K.joeDay = day; const up = addPts('joe', 3); if (up) await heartUp(joe, up); }
        } else UI.toast('Joe will hear about this. Coco is already texting him.', 'app_poems');
        if (K.day !== day) {
            K.day = day;
            const pay = 150 + Math.round(acc * 35) * 10;
            addMoney(pay, true, 'Prizes & tips');
            await UI.say('wasabi', `The crowd tipped you ${fmtNum(pay)} sand dollars!`, { keep: true });
        }
        // (tonight's request: the crowd's been waiting all night for it)
        const req = karaokeRequest();
        if (req && !mine && req[0] === title && K.reqDay !== day) {
            K.reqDay = day;
            addMoney(200, true, 'Prizes & tips');
            await UI.say('wasabi', `And that was TONIGHT'S REQUEST! The crowd went wild. 200 more sand dollars in the tip jar!`, { keep: true });
        }
        if ((rank === 'S' || rank === 'A') && !K.trophy) {
            K.trophy = true;
            receive('trophy_karaoke', 1);
            Sfx.play('fanfare');
            await UI.say('wasabi', 'A karaoke STAR! Take the trophy. The mic stays here, though. The mic is family.', { keep: true });
        }
        UI.hideDialog();
        Save.touch();
        G.busy = Math.max(0, G.busy - 1);
        Bus.emit('karaoke', { title, rank });
        checkSpecialMilestones();
        if (this._done) { const d = this._done; this._done = null; d(); }
    },
};

