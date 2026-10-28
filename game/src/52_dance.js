/* ---- 52_dance.js ---- */
/* Club Wasabi: DJ Wasabi and the dance game */
const MOVES = {
    wave: { name: 'Wave', note: 'Hi!', emote: 'note', seq: ['right', null, 'right', null] },
    happy: { name: 'Happy', note: 'A big bright smile', emote: 'sparkle', seq: ['happy', 'happy', 'happy'] },
    laugh: { name: 'Laugh', note: 'Ha!', emote: 'laugh', seq: ['happy', null, 'happy', null] },
    heart: { name: 'Love', note: 'Hearts everywhere', emote: 'heart', seq: ['cheer', 'cheer', 'happy'] },
    yawn: { name: 'Yawn', note: "It's only 2 PM, though", emote: 'zzz', seq: [null, null, null] },
    wiggle: { name: 'Wasabi Wiggle', note: 'Learned from DJ Wasabi', emote: 'note', seq: ['left', 'right', 'left', 'right', 'left', 'right'] },
    shuffle: { name: 'Spicy Shuffle', note: 'Feet on fire', emote: 'spicy', seq: ['left', null, 'right', null, 'left', 'right'] },
    owlflap: { name: 'Night Owl Flap', note: 'Only after midnight', emote: 'zzz', seq: ['cheer', null, 'cheer', null, 'cheer'] },
    disco: { name: 'Roller Disco Point', note: "David's signature", emote: 'sparkle', seq: ['right', 'cheer', 'right', 'cheer', 'left', 'cheer'] },
    swoon: { name: 'The Swoon', note: "For Joe's slow jam", emote: 'heart', seq: ['happy', null, 'cheer', null, 'happy'] },
    // special moves (found around the island). "d:" turns to face a way, "m:" moonwalks (face a way, slide the other)
    robot: { name: 'The Robot', note: 'Beep. Boop. Extremely smooth. Extremely stiff.', emote: 'sparkle', seq: ['left', 'left', 'right', 'right', 'pick', null, 'cheer', 'cheer'] },
    twirl: { name: 'Twirl', note: 'Round and round and round', emote: 'sparkle', fast: true, seq: ['d:right', 'd:up', 'd:left', 'd:down', 'd:right', 'd:up', 'd:left', 'd:down', 'cheer'] },
    moonwalk: { name: 'Moonwalk', note: 'Walking forward. Going backward. Magic.', emote: 'note', seq: ['m:right:-5', 'm:right:-5', 'm:right:-5', 'm:right:-5', 'd:down', 'cheer'] },
    floss: { name: 'The Floss', note: "Floss's signature move (she invented it, she says)", emote: 'sparkle', fast: true, seq: ['left', 'pick', 'right', 'pick', 'left', 'pick', 'right', 'pick', 'cheer'] },
    sprinkler: { name: 'The Sprinkler', note: 'Tick tick tick tick... whoosh', emote: 'note', seq: ['d:right', 'right', 'd:right', 'right', 'd:left', 'left', 'd:left', 'left', 'cheer'] },
    wink: { name: 'Wink', note: 'Just a little wink', emote: 'wink', seq: ['happy', null, 'happy'] },
    idea: { name: 'Bright idea', note: 'Ding!', emote: 'idea', seq: ['pick', null, 'cheer'] },
    cool: { name: 'Too cool', note: 'Cool as a cucumber (sorry, Cuke)', emote: 'cool', seq: ['right', null, null, 'happy'] },
    starstruck: { name: 'Starstruck', note: 'Stars in your eyes', emote: 'star', seq: ['cheer', 'happy', 'cheer', 'happy'] },
};
async function doMove(m) {
    const p = G.player;
    if (!p || G.busy) return;
    G.busy++;
    const mv = MOVES[m];
    Online.did(m);
    p.emote = mv.emote; p.emoteT = 70;
    const d0 = p.dir;
    p.dir = 'down';
    const beat = mv.fast ? 7 : 12;
    for (const pose of mv.seq) {
        if (typeof pose === 'string' && pose.startsWith('d:')) { p.dir = pose.slice(2); p.pose = null; Sfx.play('step'); await waitFrames(beat); continue; }
        if (typeof pose === 'string' && pose.startsWith('m:')) {
            const [, dir, dx] = pose.split(':');
            p.dir = dir;
            for (let f = 0; f < 12; f++) { p.pose = 'walk'; p.poseT = 2; p.anim++; if (!blockedFoot(G.area, p.x + (+dx) / 12, p.y)) p.x += (+dx) / 12; await waitFrames(1); }
            Sfx.play('step');
            continue;
        }
        p.dir = 'down';
        p.pose = pose; p.poseT = beat;
        if (pose) Sfx.play('step');
        await waitFrames(beat);
    }
    p.pose = null; p.dir = d0;
    // nearby neighbors react
    for (const n of NPCs.here()) {
        if (Math.hypot(n.x - p.x, n.y - p.y) < 60) { n.emote = rpick(['note', 'heart', 'laugh', 'sparkle']); n.emoteT = 60; }
    }
    if (m === 'yawn') UI.toast(`${S.playerName || 'Sarah'} yawns. It's only ${Clock.fmt().s}, though.`);
    G.busy--;
}

const SONGS = {
    wiggle: { name: 'Wasabi Wiggle', level: 'Easy', move: 'wiggle', gift: 'speaker' },
    shuffle: { name: 'Spicy Tuna Shuffle', level: 'Medium', move: 'shuffle', gift: 'turntables' },
    owl: { name: 'Night Owl Anthem', level: 'Medium', move: 'owlflap', gift: 'neon_sign' },
    disco: { name: 'Roller Disco Forever', level: 'Hard', move: 'disco', gift: 'disco_ball' },
    sonnet: { name: "Joe's Poem Jam (Slow)", level: 'Easy', move: 'swoon', gift: 'light_floor' },
    // special tracks (found around the island)
    goat: { name: 'The Goat Waltz', level: 'Easy', special: 'song_goat' },
    starlight: { name: 'Starlight', level: 'Medium', special: 'song_starlight' },
    shanty: { name: 'Lighthouse Shanty', level: 'Medium', special: 'song_shanty' },
    discocake: { name: 'Disco Cheesecake', level: 'Hard', special: 'song_disco' },
};
/* a track's name and level: the club's own, or one of Sarah's (6zo_mysongs.js) */
function songDef(id) { return SONGS[id] || (String(id).startsWith('my:') && MySongs.def(id)) || { name: 'A song', level: '' }; }
function songUnlocked(id) {
    const d = S.dance.songs;
    if (SONGS[id] && SONGS[id].special) return hasSpecial(SONGS[id].special);
    if (id === 'wiggle' || id === 'sonnet' && hearts('joe') >= 2) return true;
    if (id === 'shuffle') return !!d.wiggle;
    if (id === 'owl') return !!d.shuffle;
    if (id === 'disco') return !!d.owl;
    if (id === 'sonnet') return !!d.disco;
    return false;
}
async function wasabiTalk(n) {
    const r = rel('wasabi');
    const night = hourIn(Clock.hourF(), 21, 28);
    if (!r.met) {
        r.met = true;
        await UI.say('wasabi', ["YOOO! Welcome to Club Wasabi! I'm DJ Wasabi. If you hear your favorite song, I meant to do that!",
            'The floor is open all day for practice. After 9 PM, the whole island shows up. Pick a track, superstar!'], { keep: true });
    } else {
        await UI.say('wasabi', night ? rpick(['The floor is PACKED tonight! Let\'s go!', "It's peak hours! Nobody leaves before midnight!", 'Somebody\'s been out there since 9. No signs of stopping. Respect.'])
            : rpick(["Daytime practice! The crowd's still out in the sun. More room for you.", 'Warm up now, shine tonight!', "It's quiet. Perfect time to learn the moves."]), { keep: true });
    }
    await clubMenu();
}

const LANE_COL = ['#ff5aa8', '#4ec3d9', '#8cc152', '#ffd84a'];
const Dance = {
    on: false,
    async start(id, opts) {
        const p = G.player;
        this.song = id;
        this.watch = !!(opts && opts.watch);           // just watching: Sarah dances it herself, no arrows, no score
        this.rival = (opts && opts.rival) || null;      // a dance-off: a neighbor dances it beside her (6zw_island_games.js)
        this.quitting = false;
        this.on = true;
        this.ready = false;
        this.notes = [];
        G.busy++;
        HUD.show(false);
        const a = G.area;
        await fadeTo(async () => {
            p.x = 7.5 * TILE; p.y = 6.9 * TILE; p.dir = 'down';
            const r = this.rival;
            if (r) { if (r.chat) Chats.end(r.chat); r.script = true; r.path = null; r.x = 9.5 * TILE; r.y = 6.9 * TILE; r.dir = 'down'; r.flip = true; }
        });
        G.camTarget = [7.5 * TILE, 5.6 * TILE];
        const info = opts && opts.file ? Music.startFile(opts.file) : Music.startSong(id);
        this.info = info;
        this.notes = info.chart.map(n => ({ t: n.t, lane: n.lane, hit: false, judged: null }));
        this.score = 0; this.combo = 0; this.maxCombo = 0; this.hype = 0.2; this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
        this.flash = []; this.judge = null;
        this.pressed = [false, false, false, false];
        this.rs = 0; this.rcombo = 0; this.ri = 0;
        this.ready = true;
        $('#dancepads').hidden = !G.touchUsed || this.watch;
        $('#dancehud').hidden = false;
        const sg = songDef(id);
        $('#dsong').textContent = this.watch ? `${sg.name} \u00b7 just watching` : `${sg.name} \u00b7 ${sg.level}`;
        await new Promise(res => { this._done = res; });
    },
    now() { return Music.songTime(); },
    quit() { if (this.on && this.ready) { this.quitting = true; this.finish(); } },
    hit(lane, auto) {
        if (!this.on || !this.ready || (this.watch && !auto)) return;
        const t = this.now();
        this.pressed[lane] = true;
        setTimeout(() => { this.pressed[lane] = false; }, 90);
        let best = null, bd = 1;
        for (const n of this.notes) {
            if (n.judged || n.lane !== lane) continue;
            const d = Math.abs(n.t - t);
            if (d < bd) { bd = d; best = n; }
        }
        const p = G.player;
        p.pose = ['left', 'pick', 'cheer', 'right'][lane]; p.poseT = 10;
        if (!best || bd > 0.16) { return; }
        const j = bd <= 0.055 ? 'perfect' : bd <= 0.1 ? 'great' : 'good';
        best.judged = j;
        this.counts[j]++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.score += { perfect: 100, great: 70, good: 40 }[j] + Math.min(50, this.combo);
        this.hype = Math.min(1, this.hype + (j === 'perfect' ? 0.04 : 0.025));
        this.judge = { text: j === 'perfect' ? 'PERFECT' : j === 'great' ? 'GREAT' : 'GOOD', t: 30, col: j === 'perfect' ? '#ffd84a' : j === 'great' ? '#8cc152' : '#4ec3d9' };
        this.flash.push({ lane, t: 12 });
        if (this.combo % 10 === 0) { p.emote = 'note'; p.emoteT = 30; }
    },
    update() {
        if (!this.on || !this.ready) return;
        const t = this.now();
        if (this.watch) for (const n of this.notes) if (!n.judged && t >= n.t) this.hit(n.lane, true);
        // (between the steps Sarah keeps dancing: a little bounce on the beat; the dolls dance it with their whole body)
        const p = G.player;
        p.hop = p.pose ? 0 : Math.abs(Math.sin(t / (this.info.beat || 0.5) * Math.PI)) * 1.5;
        if (this.rival) this.rivalTick(t);
        for (const n of this.notes) {
            if (!n.judged && t - n.t > 0.16) {
                n.judged = 'miss'; this.counts.miss++; this.combo = 0;
                this.hype = Math.max(0, this.hype - 0.06);
                this.judge = { text: 'MISS', t: 24, col: '#b8a0c8' };
            }
        }
        this.flash = this.flash.filter(f => --f.t > 0);
        if (this.judge && --this.judge.t <= 0) this.judge = null;
        // the crowd feels it
        for (const n of NPCs.here()) if (n.id !== 'wasabi') n.hop = Math.abs(Math.sin(G.t / 7 + n.x)) * (2 + this.hype * 4);
        if (t > this.info.duration + 0.4) this.finish();
    },
    /* the dance-off's other dancer: each step judged by their skill, scored the same way as Sarah's */
    rivalTick(t) {
        const r = this.rival, sk = VS_SKILL[r.id] || 0.5;
        if (r.poseT > 0 && --r.poseT === 0) r.pose = null;
        while (this.ri < this.notes.length && t >= this.notes[this.ri].t + 0.03) {
            const n = this.notes[this.ri++], x = R();
            const j = x < 0.25 + sk * 0.55 ? 'perfect' : x < 0.5 + sk * 0.42 ? 'great' : x < 0.62 + sk * 0.35 ? 'good' : 'miss';
            if (j === 'miss') { this.rcombo = 0; continue; }
            this.rcombo++;
            this.rs += { perfect: 100, great: 70, good: 40 }[j] + Math.min(50, this.rcombo);
            r.pose = ['left', 'pick', 'cheer', 'right'][n.lane]; r.poseT = 10;
            if (this.rcombo % 10 === 0) { r.emote = 'note'; r.emoteT = 30; }
        }
    },
    /* lanes sit beside the dance floor on wide screens and under it on tall ones */
    layout() {
        const v = G.view, a = G.area;
        const laneW = 18, gap = 4, totalW = laneW * 4 + gap * 3, block = totalW + 28;
        const padH = G.touchUsed ? Math.round(($('#dancepads').getBoundingClientRect().height || 64) / v.cssScale) + 8 : 26;
        const mh = a.h * TILE;
        if (v.w - block >= 180) return { wide: true, laneW, gap, totalW, x0: Math.round(v.w - totalW - 14), top: 30, targetY: v.h - padH - 12, shift: [block / 2, 0], roomCx: (v.w - block) / 2 };
        const roomBottom = mh + 12;
        const targetY = v.h - padH - 12;
        const top = Math.round(clamp(roomBottom + 6, 40, targetY - 90));
        return { wide: false, laneW, gap, totalW, x0: Math.round(v.w / 2 - totalW / 2), top, targetY, shift: [0, mh < v.h ? Math.max(0, (v.h - mh) / 2 - 6) : 0], roomCx: v.w / 2 };
    },
    draw(ctx) {
        if (!this.on || !this.ready) return;
        const v = G.view;
        const t = this.now();
        const L = this.layout();
        if (this.watch) {
            // no lanes: just the count-in and the words
            G.camShift = null;
            for (const s of ['#dscore', '#dcombo', '#djudge']) if ($(s).textContent) $(s).textContent = '';
            const intro = this.info.lead - t;
            const cnt = intro > 0 ? (intro > this.info.beat * 3 ? 'Ready' : String(Math.ceil(intro / this.info.beat))) : '';
            if ($('#dcount').textContent !== cnt) $('#dcount').textContent = cnt;
            let ly = '';
            if (this.info.lyrics) { const l = this.info.lyrics.filter(q => t >= q.t && t < q.t + 4).pop(); if (l) ly = l.text; }
            if ($('#dlyric').textContent !== ly) $('#dlyric').textContent = ly;
            return;
        }
        const { laneW, gap, totalW, x0, targetY, top } = L;
        G.camShift = L.shift;
        const speed = 90;          // px per second
        ctx.fillStyle = 'rgba(20,16,40,0.55)';
        ctx.fillRect(x0 - 6, top - 4, totalW + 12, targetY - top + 18);
        for (let l = 0; l < 4; l++) {
            const x = x0 + l * (laneW + gap);
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.fillRect(x, top, laneW, targetY - top + 10);
            const lit = this.pressed[l] || this.flash.some(f => f.lane === l);
            drawArrow(ctx, x + laneW / 2, targetY, l, lit ? LANE_COL[l] : 'rgba(255,255,255,0.35)', !lit);
        }
        for (const n of this.notes) {
            if (n.judged && n.judged !== 'miss') continue;
            const y = targetY - (n.t - t) * speed;
            if (y < top - 10 || y > targetY + 20) continue;
            const x = x0 + n.lane * (laneW + gap) + laneW / 2;
            drawArrow(ctx, x, Math.round(y), n.lane, n.judged === 'miss' ? 'rgba(140,120,150,0.6)' : LANE_COL[n.lane], false);
        }
        // hype meter
        ctx.fillStyle = 'rgba(20,16,40,0.7)';
        ctx.fillRect(x0 - 6, top - 14, totalW + 12, 9);
        ctx.fillStyle = '#ff5aa8';
        ctx.fillRect(x0 - 5, top - 13, Math.round((totalW + 10) * this.hype), 7);
        // words live in the HTML overlay so they stay crisp
        const set = (id, txt, col) => { const e = $(id); if (e.textContent !== txt) e.textContent = txt; if (col) e.style.color = col; };
        const cs = v.cssScale, lx = (x0 + totalW / 2) * cs + 'px';
        const place = (id, x, y) => { const s = $(id).style; if (s.left !== x) s.left = x; if (s.top !== y) s.top = y; };
        place('#djudge', lx, (top + (targetY - top) * 0.42) * cs + 'px');
        place('#dcombo', lx, (top + (targetY - top) * 0.42 + 22) * cs + 'px');
        place('#dcount', lx, (top + (targetY - top) * 0.3) * cs + 'px');
        place('#dlyric', L.roomCx * cs + 'px', L.wide ? 'calc(env(safe-area-inset-top, 0px) + 54px)' : (top - 30) * cs + 'px');
        set('#dscore', fmtNum(this.score));
        if (this.rival) set('#dsong', `Dance-off · ${this.rival.def.name}: ${fmtNum(this.rs)}`);
        set('#dcombo', this.combo >= 4 ? `${this.combo} combo` : '');
        set('#djudge', this.judge ? this.judge.text : '', this.judge ? this.judge.col : null);
        const intro = this.info.lead - t;
        set('#dcount', intro > 0 ? (intro > this.info.beat * 3 ? 'Ready' : String(Math.ceil(intro / this.info.beat))) : '');
        let ly = '';
        if (this.info.lyrics) { const l = this.info.lyrics.filter(q => t >= q.t && t < q.t + 4).pop(); if (l) ly = l.text; }
        set('#dlyric', ly);
    },
    finish() {
        if (!this.on) return;
        this.on = false;
        Music.stopSong();
        G.camShift = null;
        $('#dancepads').hidden = true;
        $('#dancehud').hidden = true;
        if (this.rival) { this.rival.script = false; this.rival.pose = null; }
        G.player.hop = 0;
        if (this.watch || this.quitting) {
            // just watching, or left early: no score, no tips, no penalty
            const left = this.quitting && !this.watch;
            this.quitting = false;
            G.camTarget = null;
            G.busy--;
            HUD.show(true);
            if (left) UI.toast('Sarah left the floor early. No score this time.');
            if (this._done) this._done();
            return;
        }
        const maxScore = this.notes.length * 150 + 1;
        const pct = this.score / (this.notes.length * 125 + 1);
        const rank = pct >= 0.9 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.55 ? 'B' : 'C';
        const id = this.song, sd = S.dance.songs[id] || (S.dance.songs[id] = { best: 0, rank: 'C', paid: -1 });
        const first = !sd.cleared;
        sd.cleared = true;
        const order = 'CBAS';
        if (this.score > sd.best) sd.best = this.score;
        if (order.indexOf(rank) > order.indexOf(sd.rank)) sd.rank = rank;
        // (Sarah's own songs tip once a day between them)
        const mine = String(id).startsWith('my:'), paid = mine ? S.dance.myPaid : sd.paid;
        const pay = paid === Clock.dayNum() ? 0 : Math.round(this.score / 10 / 50) * 50 + 100;
        if (mine) S.dance.myPaid = Clock.dayNum(); else sd.paid = Clock.dayNum();
        S.stats.dances = (S.stats.dances || 0) + 1;
        Save.touch();
        G.camTarget = null;
        G.busy--;
        HUD.show(true);
        this.results({ rank, first, pay, pct });
    },
    async results(r) {
        G.busy++;
        const song = songDef(this.song);
        const c = this.counts;
        await UI.say('wasabi', [`${song.name}: rank ${r.rank}! ${fmtNum(this.score)} points, best combo ${this.maxCombo}.`,
            `Perfect ${c.perfect}, great ${c.great}, good ${c.good}, missed ${c.miss}.`], { keep: true });
        if (r.pay) { addMoney(r.pay, true, 'Prizes & tips'); await UI.say('wasabi', `The crowd tipped you ${fmtNum(r.pay)} sand dollars!`, { keep: true }); }
        if (this.rival) await danceOffEnd(this.rival, this.score, this.rs);
        if (r.first && song.move) {
            const mv = song.move;
            if (!S.dance.moves.includes(mv)) S.dance.moves.push(mv);
            await UI.say('wasabi', `New move unlocked: ${MOVES[mv].name}! Show it off anywhere. (Moves button.)`, { keep: true });
            if (song.gift) receive(song.gift, 1);
        } else if (r.first && song.special) await UI.say('wasabi', `A special track, and you nailed it. Where did you even FIND this one?`, { keep: true });
        if (r.rank === 'S' && !S.flags.clubDecor) {
            S.flags.clubDecor = true;
            receive('wall_disco', 1); receive('floor_disco', 1);
            await UI.say('wasabi', "An S rank?! Take the club's wallpaper and floor. Make your house a club. I insist.", { keep: true });
        }
        const next = Object.keys(SONGS).find(id => songUnlocked(id) && !S.dance.songs[id]);
        if (next && r.first) await UI.say('wasabi', `Oh, and a new track just dropped: ${SONGS[next].name}.`, { keep: true });
        UI.hideDialog();
        G.busy--;
        Bus.emit('danced', this.song);
        this._done && this._done();
    },
};
function drawArrow(ctx, cx, cy, lane, col, hollow) {
    // pixel arrow pointing left / down / up / right
    const pts = {
        0: [[-7, 0], [0, -7], [0, -3], [7, -3], [7, 3], [0, 3], [0, 7]],
        3: [[7, 0], [0, -7], [0, -3], [-7, -3], [-7, 3], [0, 3], [0, 7]],
        2: [[0, -7], [-7, 0], [-3, 0], [-3, 7], [3, 7], [3, 0], [7, 0]],
        1: [[0, 7], [-7, 0], [-3, 0], [-3, -7], [3, -7], [3, 0], [7, 0]],
    }[lane];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)));
    ctx.closePath();
    if (hollow) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); }
    else { ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(20,16,40,0.8)'; ctx.lineWidth = 1; ctx.stroke(); }
}

