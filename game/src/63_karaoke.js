/* ---- 63_karaoke.js ---- */
/* Karaoke at Club Wasabi: sing one of Joe's poems. Each poem gets its own little tune (one note per syllable). The notes
   scroll past. Set Sarah's pitch with up and down (it stays where you leave it), and hold Space (or the SING button) to
   sing. Sing on the notes, on key, and the words light up. Joe, if he's there, is very moved. */

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
    const r = mulberry(hash32('karaoke:' + title));
    const bpm = 84 + Math.floor(r() * 16);
    const root = 55 + [0, 2, 3, 5, 7][Math.floor(r() * 5)];
    const spec = { bpm, root, scale: 'major', lead: 'flute', leadVol: 0.1, hold: 4, chords: rpick([[1, 5, 6, 4], [1, 6, 4, 5], [1, 4, 6, 5], [1, 4, 5, 1]], r),
        form: '__', mel: {}, bass: 'x...x.o.', bassVol: 0.22, pad: 'pad', padVol: 0.03, arp: '..x...x.', arpInstr: 'piano', arpVol: 0.035,
        drums: { kick: 'x...x...', snare: '....x...', hat: '..o...o.' }, drumVol: 0.28 };
    const sd = 60 / bpm / 2;
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const notes = [], out = [];
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
            for (let s = 0; s < syl[wi]; s++, k++) {
                const last = k === tot - 1;
                if (last) deg = li % 2 ? (deg >= 5 ? 8 : 1) : 5;
                else if (k > 0 && r() > 0.15) deg = clamp(deg + (r() < (k < tot / 2 ? 0.64 : 0.36) ? 1 : -1) * (r() < 0.25 ? 2 : 1), 1, 8);
                const len = last ? hold : each;
                toks[step] = deg <= 7 ? String(deg) : '^' + (deg - 7);
                for (let h = 1; h < len && step + h < 16; h++) toks[step + h] = '.';
                const s0 = bar0 * 8 + step;
                notes.push({ t0: s0 * sd, t1: (s0 + len) * sd - 0.03, midi: degToMidi(root + 12, 'major', toks[step]), line: li, word: wi, hit: 0, tot: 0 });
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
    S: "You sang my poem! Perfectly! I wrote that in four minutes and you made it sound like four whole minutes. I'm crying. Good crying.",
    A: "That's my poem! On a stage! With music! This is the best night of my life. Second best. The frog poem night was also good.",
    B: "You sang my poem! Some of the notes were in there! All of the words were! That's what counts in poetry.",
    C: "That was so brave! My poems are tricky to sing. They have a lot of feelings in them. Thank you for trying. I'm framing this moment. Somehow.",
};
function karaokePoems() {
    const all = JOE_POEMS.concat([JOE_SUNSET_POEM]);
    return all.filter(p => p[0] === 'Shoe' || S.poems.includes(p[0]));
}
function karaokeMenu() {
    return new Promise(res => {
        let done = false;
        const P = UI.open({ title: 'Karaoke', onClose: () => { if (!done) { done = true; res(null); } } });
        P.body.appendChild(el('p', 'muted', "Pick one of Joe's poems. Hold A (or hold the screen) to sing higher, and let go to come down. Every poem Joe reads you joins the list."));
        const L = el('div', 'list');
        for (const poem of karaokePoems()) {
            const r = el('button', 'row');
            r.type = 'button';
            r.appendChild(iconCanvas('app_poems', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, poem[0]));
            const best = S.karaoke.best[poem[0]];
            t.appendChild(el('span', null, `"${poem[1][0]}"${best ? ' \u00b7 best ' + best : ''}`));
            r.appendChild(t);
            r.addEventListener('click', () => { done = true; UI.close(true); Sfx.ui('ok'); res(poem); });
            L.appendChild(r);
        }
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
async function karaokeNight() {
    if (!S.flags.karaokeTold) {
        S.flags.karaokeTold = true;
        await UI.say('wasabi', ["KARAOKE! Joe gave me all his poems. ALL of them. There are a lot.",
            'Here is how it works, superstar: the notes slide by. Hold the button to sing higher, let go to come down. Stay on the notes!'], { keep: true });
    }
    UI.hideDialog();
    const poem = await karaokeMenu();
    if (!poem) return;
    await Karaoke.start(poem);
}

const Karaoke = {
    on: false, ready: false, held: false, up: false, down: false,
    async start(poem, opts) {
        const p = G.player;
        this.poem = poem;
        this.watch = !!(opts && opts.watch);           // just listening: Sarah sings it herself, no pitch bar, no score
        this.quitting = false;
        this.song = karaokeSong(poem);
        this.on = true; this.ready = false; this.held = false; this.up = false; this.down = false; this.v = 0.5; this.trail = []; this.sparks = []; this.hitF = 0; this.totF = 0; this.judgeT = 0; this.onKey = false; this.singF = 0;
        G.busy++;
        HUD.show(false);
        await fadeTo(async () => { p.x = 7.5 * TILE; p.y = 6.9 * TILE; p.dir = 'down'; p.path = null; });
        const info = Music.startSong('karaoke', this.song.spec);
        this.duration = info.duration;
        this.lead = info.lead;
        this.beat = info.beat;
        const mids = this.song.notes.map(n => n.midi);
        this.lo = Math.min(...mids) - 1.5; this.hi = Math.max(...mids) + 1.5;
        this.voiceOn();
        for (const s of ['#djudge', '#dcombo', '#dcount', '#dlyric']) { $(s).style.left = ''; $(s).style.top = ''; $(s).textContent = ''; }
        $('#dancehud').hidden = false;
        $('#dsong').textContent = `"${poem[0]}" \u00b7 a poem by Joe`;
        $('#dscore').textContent = '';
        $('#dtip').textContent = this.watch ? 'Just listening: Sarah sings it on her own.' : G.touchUsed ? '\u25b2 \u25bc set your pitch \u00b7 hold SING to sing' : '\u2191 \u2193 set your pitch (it stays put) \u00b7 hold Space to sing \u00b7 Esc to stop';
        if (this.watch) $('#dsong').textContent = `"${poem[0]}" \u00b7 a poem by Joe \u00b7 just listening`;
        this._ly = null;
        this.pads(!this.watch);
        this.ready = true;
        await new Promise(res => { this._done = res; });
    },
    now() { return Music.songTime(); },
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
            b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); Audio2.unlock(); try { b.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } set(true); });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, () => set(false)));
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
        // the pitch only moves while up or down is held; it stays where it's left
        const step = 0.022;
        if (this.up && !this.down) this.v = clamp(this.v + step, 0, 1);
        else if (this.down && !this.up) this.v = clamp(this.v - step, 0, 1);
        const cur = this.song.notes.find(n => t >= n.t0 && t < n.t1);
        const tol = 0.09 + 0.6 / (this.hi - this.lo);
        this.onKey = false;
        const singing = this.held;
        if (singing) this.singF++;
        if (cur) {
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
        this.voiceTick(singing);
        p.pose = singing ? (this.onKey ? 'cheer' : 'happy') : null; p.poseT = 6;
        const acc = this.totF ? this.hitF / this.totF : 0;
        for (const n of NPCs.here()) if (n.id !== 'wasabi') n.hop = Math.abs(Math.sin(G.t / 9 + n.x)) * (1 + acc * 3);
        const joe = NPCs.get('joe');
        if (joe && joe.area === 'club' && !joe.sleeping && G.frame % 90 === 0 && this.onKey) { joe.emote = rpick(['heart', 'note', 'sparkle']); joe.emoteT = 60; }
        if (t > this.duration + 0.3) this.finish();
    },
    judge(text, col) { const e = $('#djudge'); e.textContent = text; e.style.color = col; this.judgeT = 36; },
    voiceOn() {
        const c = Audio2.ctx;
        this.vo = null;
        if (!c || !Audio2.sfxOn) return;
        const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
        o.type = 'triangle'; lp.type = 'lowpass'; lp.frequency.value = 1500; g.gain.value = 0;
        lfo.frequency.value = 5.2; lg.gain.value = 2.5;
        lfo.connect(lg); lg.connect(o.frequency);
        o.connect(lp); lp.connect(g); g.connect(Audio2.sfx);
        o.start(); lfo.start();
        this.vo = { o, g, lfo };
    },
    voiceTick(singing) {
        const V = this.vo;
        if (!V) return;
        const c = Audio2.ctx, m = this.lo + this.v * (this.hi - this.lo) - 12;
        V.o.frequency.setTargetAtTime(mtof(m), c.currentTime, 0.03);
        V.g.gain.setTargetAtTime(singing ? 0.1 : 0, c.currentTime, singing ? 0.02 : 0.05);
    },
    voiceOff() {
        const V = this.vo;
        this.vo = null;
        if (!V) return;
        V.g.gain.setTargetAtTime(0, Audio2.ctx.currentTime, 0.05);
        setTimeout(() => { try { V.o.stop(); V.lfo.stop(); V.g.disconnect(); } catch (e) { /* already gone */ } }, 400);
    },
    draw(ctx) {
        if (!this.on || !this.ready) return;
        const v = G.view, t = this.now(), cs = v.cssScale;
        const W = Math.min(v.w - 16, 360), H = clamp(Math.round(v.h * 0.26), 48, 76);
        const kp = $('#karaokepads'), padH = kp && !kp.hidden ? Math.round((kp.getBoundingClientRect().height || 150) / cs) + 8 : 0;
        const x0 = Math.round((v.w - W) / 2), y0 = v.h - H - 22 - padH;
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
            ctx.fillStyle = past ? (n.tot && n.hit / n.tot >= 0.5 ? '#ffd84a' : 'rgba(184,160,200,0.5)') : now ? '#ffb3d9' : '#ff5aa8';
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
        const html = L.words.map(w => `<span class="${t >= w.t1 - 0.02 ? 'sung' : t >= w.t0 ? 'on' : ''}">${esc(w.text)}</span>`).join(' ');
        const ly = $('#dlyric');
        if (this._ly !== html) { ly.innerHTML = html; this._ly = html; }
        const top = Math.round((y0 - 6) * cs - ly.offsetHeight) + 'px';
        if (ly.style.top !== top) ly.style.top = top;
        if (!ly.classList.contains('sing')) ly.classList.add('sing');
        const acc = this.totF ? Math.round(this.hitF / this.totF * 100) : 0;
        const sc = this.totF && !this.watch ? `${acc}% on key` : '';
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
        const acc = this.totF ? this.hitF / this.totF : 0;
        const rank = acc >= 0.7 ? 'S' : acc >= 0.52 ? 'A' : acc >= 0.35 ? 'B' : 'C';
        const title = this.poem[0], K = S.karaoke, day = Clock.dayNum();
        const order = 'CBAS';
        if (!K.best[title] || order.indexOf(rank) > order.indexOf(K.best[title])) K.best[title] = rank;
        K.ranks = K.ranks || {};
        K.ranks[title] = K.best[title];
        S.stats.karaoke = (S.stats.karaoke || 0) + 1;
        await UI.say('wasabi', `"${title}" by Joe! Rank ${rank}. You were on key ${Math.round(acc * 100)}% of the time.`, { keep: true });
        const joe = NPCs.get('joe');
        if (joe && !joe.sleeping && joe.area === 'club') {
            joe.emote = 'heart'; joe.emoteT = 90;
            await UI.say('joe', JOE_KARAOKE[rank], { keep: true });
            if (K.joeDay !== day) { K.joeDay = day; const up = addPts('joe', 3); if (up) await heartUp(joe, up); }
        } else UI.toast('Joe will hear about this. Coco is already texting him.', 'app_poems');
        if (K.day !== day) {
            K.day = day;
            const pay = 150 + Math.round(acc * 35) * 10;
            addMoney(pay, true);
            await UI.say('wasabi', `The crowd tipped you ${fmtNum(pay)} sand dollars!`, { keep: true });
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

