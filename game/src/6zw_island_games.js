/* ---- 6zw_island_games.js ---- */
/* Games with the neighbors out on the island (docs/ROADMAP.md, David's list): "Let's play!" when talking to someone
   offers what fits the place, the hour and the weather. Tag, hide-and-seek (either way round) and a fishing derby are
   played right on the island: the neighbor's day waits while the game lasts (n.script, as in a cutscene), and they run,
   hide, look for Sarah and fish themselves, at their own skill (VS_SKILL, as at the arcade). Afterwards they go back to
   what they were doing. Volleyball and the snowball fight are 2D games (6zx_field_games.js). */

const IG_TAG_FRAMES = 60 * 60;              // a minute of tag
const IG_FIELD = 8 * TILE;                  // how far the tag field reaches from where the game started
const IG_HIDE_FIELD = 13 * TILE;            // hide-and-seek: how far away anyone may hide
const IG_SEEK_FRAMES = 90 * 60;             // Sarah has a minute and a half to find them
const IG_HIDE_FRAMES = 60 * 60;             // they look for her for a minute
const IG_DERBY_FRAMES = 120 * 60;           // two minutes of fishing
const IG_TALL = { tree: 1, fruittree: 1, palm: 1, bigtree: 1, oldtree: 1, building: 1, young: 1 };
const IG_LOW = { flowerbed: 1, blanket: 1, driftwood: 1, lamp: 1, mailbox: 1, board: 1, sign_island: 1, sign_club: 1, rock: 1, bench: 1 };     // too low to hide behind
const IG_LINES = {
    tag: ["Tag! You're it! Count to three, then come get me. A minute on the clock: whoever's it at the end loses!",
        "Tag! Ha! You're it! Three seconds, then chase me. Whoever's it when the minute's up loses!"],
    tagWin: ["Time! You're it, so... I win! That was so fun. My legs are noodles.", "Ha! Time's up and you're it! Good game. I need to sit down for a week."],
    tagLose: ["Time! Aw, I'm it. You win! You're fast. Like, suspiciously fast.", "Noooo, time's up and I'm it! Rematch. After a nap. You win!"],
    seekAsk: ["Hide-and-seek! Do you want to hide, or do you want to find me?"],
    seekStart: ["I'll hide! Cover your eyes and count to ten. No peeking! I'll know!", "My turn to hide! Close your eyes and count. I'm VERY good at this."],
    found: ["Aww, you found me! I thought that was the perfect spot.", "You found me! How?! I was being so quiet. Mostly."],
    notFound: ["Over here! Time's up! I win! I was right here the whole time.", "Ha! You didn't find me! I was RIGHT here. Good game!"],
    hideStart: ["You hide, I'll look! I'm counting to ten. Go, go, go!", "Okay! I'll count to ten. Hide somewhere good! Not too far!"],
    caught: ["Found you! I saw you from all the way over there.", "Found you! Ha! Good spot, though. I almost walked right past."],
    gaveUp: ["I give up! Where WERE you? You're a hide-and-seek genius.", "Time! I couldn't find you anywhere! You win. Teach me your ways."],
    tooFar: ["Hey! That's too far! You have to hide closer than that. That counts as found!"],
    derby: ["A fishing derby! Two minutes. Whoever catches the most fish wins. Ready? Cast away!",
        "Ooh, a derby! Most fish in two minutes wins. Boots don't count. I checked."],
    derbyWin: ["Time! I got more! Fishing is mostly patience. And luck. Mostly luck.", "That's time! I win the derby! The fish just like me. I don't know why."],
    derbyLose: ["Time! You caught more! You're a natural. The fish are scared of you now.", "That's time! You win the derby! I'm going to practice. Tomorrow. Maybe."],
    derbyTie: ["Time! A tie! Exactly the same! That never happens. Good game!"],
    quit: ["Oh, okay! We can play another time.", "Aw! Next time, then!"],
    danceWin: ["I win! My hips don't lie. They don't say much, but they don't lie.", "Ha! I won the dance-off! Rematch? My feet say no. I say yes."],
    danceLose: ["You win! Those moves! I need to sit down. On the dance floor. Briefly.", "You won the dance-off! Teach me that spin. Slowly. Very slowly."],
    danceTie: ["A tie! We're equally amazing. That's the best way to lose. Or win."],
    duetGood: ["We sounded SO good together! Joe would cry. Joe IS crying, probably, somewhere.", "That was beautiful! Our voices go together like rice and... more rice!"],
    duetOk: ["That was fun! We were a little off. A little. Charmingly off.", "Not bad! Next time, let's warm up first. I'll bring tea."],
    cuke: { tag: ["TAG! You're it! Tag is the BEST cardio! Count to three, then chase me! One minute! Whoever's it at the end loses!"],
        tagLose: ["Time! I'm it! You WIN! Your hamstrings must be incredible. Hydrate!"], tagWin: ["Time! You're it! I win! Great hustle! Great everything!"] },
    kai: { tag: ["Tag, dude! You're it. Count to three. Then, like, chase me. Whoever's it in a minute loses."], seekStart: ["I'll hide, dude. Count to ten. I'm gonna be so chill nobody finds me."] },
    maki: { tag: ['Tag. You are it. You will count to three. The round is exactly one minute. Whoever is it at the end loses.'],
        derby: ['A derby. Two minutes. The most fish wins. I will be precise about the count.'] },
    chili: { tag: ["TAG! You're it! Count to three! This is going to be SPICY! One minute! It at the end loses!"] },
    sully: { tag: ["Tag, kid! You're it! Count to three. Whoever's it in a minute loses. Wicked simple."] },
};
function igLine(id, key) {
    const own = IG_LINES[id] && IG_LINES[id][key];
    return voiced(id, rpick(own || IG_LINES[key]));
}
function igRec(kind) {
    if (!S.games) S.games = {};
    return S.games[kind] || (S.games[kind] = { played: 0, won: 0 });
}
function igHud(sel, text) { const e = $(sel); if (e && e.textContent !== text) e.textContent = text; }
function igDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
/* which way something lies, for hints ("to the north-east") */
function igWay(dx, dy) {
    const a = Math.atan2(dy, dx), k = (Math.round(a / (Math.PI / 4)) + 8) % 8;
    return ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'][k];
}

const IslandGames = {
    on: null,
    /* could this neighbor play something right now? */
    list(n) {
        const out = [];
        if (this.on || !n || n.def.spring || n.def.shop || !VS_SKILL[n.id]) return out;
        // at the club: dance against them, or sing with them
        if (n.area === 'club' && G.area.id === 'club' && !Dance.on && !Karaoke.on) return [['danceoff', 'Dance-off'], ['duet', 'Karaoke duet']];
        if (n.area !== 'island' || G.area.id !== 'island') return out;
        if (n.spotKey === 'rope_a' || n.spotKey === 'rope_b' || n.dancer || (n.want && n.want.playing) || isSeated(n)) return out;
        const h = Clock.hourF(), wet = G.weather === 'rain' || G.weather === 'storm';
        if (h >= 7 && h < 20 && !wet) { out.push(['tag', 'Tag']); out.push(['hide', 'Hide-and-seek']); }
        if (pocketCount('rod') && this.derbySpot(n)) out.push(['derby', 'Fishing derby']);
        if (typeof FieldGames !== 'undefined') out.push(...FieldGames.list(n));
        return out;
    },
    /* "Let's play!" in the talk menu: false ends the conversation (the game starts once it has) */
    async offer(n) {
        const games = this.list(n);
        if (!games.length) return true;
        const k = await UI.ask(n.id, rpick(['Ooh, yes! What do you want to play?', 'A game? Yes! Which one?', "I'm in! What are we playing?"]), games.map(g => g[1]).concat(['Never mind']), { keep: true });
        if (k >= games.length) { await UI.say(n.id, rpick(['Okay! Another time.', 'Aw. Okay! Just say when.']), { keep: true }); return true; }
        const kind = games[k][0];
        let mode = null;
        if (kind === 'hide') {
            const m = await UI.ask(n.id, igLine(n.id, 'seekAsk'), ["I'll hide!", "I'll look for you!"], { keep: true });
            mode = m === 0 ? 'hide' : 'seek';
        }
        setTimeout(() => this.start(kind, n, mode), 60);
        return false;
    },
    start(kind, n, mode) {
        if (this.on || G.busy || n.talking) return;
        if (kind === 'danceoff' || kind === 'duet') { this.club(kind, n); return; }
        if (kind !== 'tag' && kind !== 'hide' && kind !== 'derby') { FieldGames.start(kind, n); return; }
        if (n.chat) Chats.end(n.chat);
        n.script = true; n.path = null; n.pose = null;
        const p = G.player;
        p.path = null;
        this.on = { kind, mode, n, t: 0, skill: VS_SKILL[n.id] || 0.5, cx: p.x, cy: p.y, lx: p.x, ly: p.y, vx: 0, vy: 0, ux: 0, uy: 0, phase: 'intro' };
        HUD.show(false);
        for (const s of ['#djudge', '#dcombo', '#dcount', '#dlyric', '#dtip', '#dscore', '#dsong']) { $(s).style.left = ''; $(s).style.top = ''; $(s).textContent = ''; }
        $('#dancehud').hidden = false;
        Music.over = kind === 'hide' ? 'studio' : kind === 'derby' ? 'afternoon' : 'fruit';
        Music.update(true);
        igRec(kind).played++;
        S.stats.islandGames = (S.stats.islandGames || 0) + 1;
        Save.touch();
        const go = { tag: () => this.tagStart(), hide: () => (mode === 'hide' ? this.hideStart() : this.seekStart()), derby: () => this.derbyStart() }[kind];
        go().catch(e => { console.error(e); this.stop(); });
    },
    /* the club's games: the dance floor and the karaoke stage, with the neighbor beside Sarah (52_dance.js, 63_karaoke.js) */
    async club(kind, n) {
        if (kind === 'danceoff') { const id = await clubList('dance'); if (id) await Dance.start(id, { rival: n }); }
        else await karaokeNight({ duet: n });
    },
    /* every frame (90_main.js): a game in progress runs while nothing else has Sarah's attention */
    tick() {
        const g = this.on;
        if (!g) return;
        if (G.mode !== 'play' || G.area.id !== 'island' || g.n.area !== 'island') { this.end('left'); return; }
        const p = G.player;
        // (where she's heading, smoothed: a wiggle on the spot isn't a direction)
        g.vx = g.vx * 0.85 + (p.x - g.lx) * 0.15; g.vy = g.vy * 0.85 + (p.y - g.ly) * 0.15; g.lx = p.x; g.ly = p.y;
        // (they run off while Sarah counts to three)
        if (g.phase === 'count' && g.kind === 'tag') { this.tagNpc(g); return; }
        if (g.phase !== 'play' || G.busy || UI.dialogOpen || UI.modal) return;
        g.t++;
        if (g.judgeT && --g.judgeT === 0) igHud('#djudge', '');
        if (g.kind === 'tag') this.tagTick(g);
        else if (g.kind === 'hide') { if (g.mode === 'hide') this.hideTick(g); else this.seekTick(g); }
        else if (g.kind === 'derby') this.derbyTick(g);
    },
    say(text, col) { const e = $('#djudge'); e.textContent = text; e.style.color = col || '#ffd84a'; if (this.on) this.on.judgeT = 70; },
    clock(left) { const s = Math.max(0, Math.ceil(left / 60)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
    /* talking to the neighbor mid-game (hide-and-seek: that's finding them) */
    poke(n) {
        const g = this.on;
        if (!g || g.n !== n) return false;
        if (g.kind === 'hide' && g.mode === 'seek' && g.phase === 'play' && igDist(n, G.player) < 34) this.seekFound();
        return true;
    },
    has(n) { return !!(this.on && this.on.n === n); },
    quit() { const g = this.on; if (g && (g.phase === 'play' || (g.phase === 'count' && !G.busy))) this.end('quit'); },
    /* the leave button and the rescue: put everything back at once */
    stop() {
        const g = this.on;
        if (!g) return;
        this.on = null;
        const n = g.n;
        n.script = false; n.run = false; n.jog = false; n.pose = null; n.path = null; n.moving = false;
        $('#dancehud').hidden = true;
        for (const s of ['#djudge', '#dcount', '#dtip', '#dscore', '#dsong']) igHud(s, '');
        HUD.show(true);
        Music.over = null;
        Music.update(true);
        G.fade = 0;
    },
    async end(how) {
        const g = this.on;
        if (!g || g.phase === 'done') return;
        g.phase = 'done';
        const n = g.n, id = n.id;
        const won = how === 'win';
        this.stop();
        if (how === 'left') { if (n.area === G.area.id) moveTo(n, targetFor(n, dayHour())); return; }
        G.busy++;
        try {
            faceNpc(n, G.player);
            faceToward(G.player, n);
            if (how === 'quit') await UI.say(id, igLine(id, 'quit'), { keep: true });
            else {
                await UI.say(id, g.endLine, { keep: true });
                if (won) { igRec(g.kind).won++; n.emote = 'sweat'; G.player.pose = 'cheer'; G.player.poseT = 60; Sfx.play('fanfare'); }
                else { n.emote = 'laugh'; n.emoteT = 60; }
                if (g.best) await UI.say(null, g.best, { keep: true });
                await igFriend(n, g.kind);
            }
        } catch (e) { console.error(e); }
        UI.hideDialog();
        G.busy = Math.max(0, G.busy - 1);
        Save.touch();
        moveTo(n, targetFor(n, dayHour()));
    },

    /* ---------------------------------------------------------------- moving the neighbor */
    /* one step toward (or away from) a point, around what's in the way: the best of sixteen ways to go */
    steer(g, sp, score) {
        const n = g.n, a = G.area;
        let best = null, bs = -1e9;
        for (let i = 0; i < 16; i++) {
            const ang = i * Math.PI / 8, ux = Math.cos(ang), uy = Math.sin(ang);
            const x = n.x + ux * sp, y = n.y + uy * sp;
            if (blockedFoot(a, x, y)) continue;
            // each way is judged by where it leads a little further on, as far as it's open (a way that runs
            // into something soon is a corner to get stuck in)
            let r = sp;
            while (r < 24 && !blockedFoot(a, n.x + ux * (r + 4), n.y + uy * (r + 4))) r += 4;
            const s = score(n.x + ux * r, n.y + uy * r) + (ux * g.ux + uy * g.uy) * 6 - (24 - r) * 1.5;
            if (s > bs) { bs = s; best = [x, y, ux, uy]; }
        }
        if (!best) return false;
        this.walk(n, best[0], best[1], sp);
        g.ux = best[2]; g.uy = best[3];
        return true;
    },
    walk(n, x, y, sp) {
        const dx = x - n.x, dy = y - n.y;
        n.x = x; n.y = y;
        n.moving = true; n.anim++;
        n.run = n.jog = sp > 1.2;
        if (Math.abs(dx) > 0.2) n.flip = dx < 0;
        if (n.def.human) n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        else n.hop = Math.abs(Math.sin(n.anim / (sp > 1.2 ? 3.5 : 6))) * 3;
    },
    /* follow a path of tiles (hide-and-seek's seeker, walking to a fishing spot) */
    follow(g, sp) {
        const n = g.n;
        if (!g.path || !g.path.length) { n.moving = false; n.run = n.jog = false; return true; }
        const [tx, ty] = g.path[0];
        const gx = (tx + 0.5) * TILE, gy = (ty + 0.5) * TILE + 4, d = Math.hypot(gx - n.x, gy - n.y);
        if (d <= sp) { this.walk(n, gx, gy, sp); g.path.shift(); return !g.path.length; }
        this.walk(n, n.x + (gx - n.x) / d * sp, n.y + (gy - n.y) / d * sp, sp);
        return false;
    },
    pathTo(n, tx, ty, max) { return findPath(G.area, Math.floor(n.x / TILE), Math.floor((n.y - 2) / TILE), tx, ty, max || 2500); },
    /* is the straight line between two points clear of trees, walls and buildings? (water doesn't hide anybody) */
    clear(x0, y0, x1, y1) {
        const a = G.area, d = Math.hypot(x1 - x0, y1 - y0), steps = Math.ceil(d / 5);
        for (let i = 1; i < steps; i++) {
            const x = x0 + (x1 - x0) * i / steps, y = y0 - 6 + (y1 - y0) * i / steps;
            const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
            if (a.blockedAt(tx, ty) && !a.waterAt(tx, ty)) return false;
        }
        return true;
    },
    countdown(from, every) {
        return (async () => {
            for (let i = from; i > 0; i--) { igHud('#dcount', String(i)); Sfx.ui('tick'); await waitFrames(every); }
            igHud('#dcount', '');
        })();
    },

    /* ---------------------------------------------------------------- tag */
    async tagStart() {
        const g = this.on, n = g.n, p = G.player;
        G.busy++;
        try {
            faceNpc(n, p);
            await UI.say(n.id, igLine(n.id, 'tag'), { keep: true });
            UI.hideDialog();
            igHud('#dsong', `Tag with ${n.def.name}`);
            g.it = 'sarah'; g.safe = 0; g.wait = 0; g.dash = 0; g.cool = 0; g.out = 0; g.tags = 0;
            g.phase = 'count';
            p.emote = 'sweat'; p.emoteT = 40;
            igHud('#dtip', G.touchUsed ? 'Hold a finger down to run after them' : 'Hold Shift (or turn on Run) to be quicker');
            await this.countdown(3, 50);
        } finally { G.busy = Math.max(0, G.busy - 1); }
        if (this.on !== g) return;
        g.phase = 'play';
        this.say("GO! You're it!");
    },
    tagTick(g) {
        const n = g.n, p = G.player;
        const left = IG_TAG_FRAMES - g.t;
        igHud('#dscore', this.clock(left));
        igHud('#dsong', g.it === 'sarah' ? `Tag: you're it!` : `Tag: ${n.def.name} is it!`);
        if (g.safe > 0 && --g.safe > 0 && g.it === 'sarah') igHud('#dtip', 'No tag-backs! Wait a moment...');
        else if (g.safe === 0 && $('#dtip').textContent.startsWith('No tag')) igHud('#dtip', '');
        // the field: running off while they're it counts as tagged
        const out = Math.hypot(p.x - g.cx, p.y - g.cy);
        if (out > IG_FIELD) {
            g.out++;
            igHud('#dtip', 'Out of bounds! Back to the field!');
            if (g.it === 'npc' && g.out > 90) { this.tagSwap(g, 'sarah'); this.say('Out of bounds!', '#ffffff'); }
        } else { g.out = 0; igHud('#dtip', out > IG_FIELD * 0.82 ? 'Edge of the field!' : ''); }
        this.tagNpc(g);
        if (g.safe === 0 && igDist(n, p) < 14) {
            this.tagSwap(g, g.it === 'sarah' ? 'npc' : 'sarah');
            this.say(g.it === 'npc' ? 'TAGGED!' : "You're it!", g.it === 'npc' ? '#ffd84a' : '#ffffff');
        }
        if (left <= 0) {
            const won = g.it === 'npc';
            g.endLine = igLine(n.id, won ? 'tagLose' : 'tagWin');
            if (won && g.tags >= 6) g.best = `${g.tags} tags in one minute!`;
            this.end(won ? 'win' : 'lose');
        }
    },
    tagSwap(g, it) {
        // no tag-backs: whoever was just tagged waits a moment before they can tag anyone
        g.it = it; g.safe = 120; g.tags++; g.out = 0;
        Sfx.play(it === 'npc' ? 'catch' : 'trip');
        if (it === 'npc') { g.wait = 75; g.n.emote = 'bang'; g.n.emoteT = 40; }
        else { g.dash = 30; g.cool = 0; G.player.emote = 'sweat'; G.player.emoteT = 40; g.n.emote = 'laugh'; g.n.emoteT = 50; }
    },
    tagNpc(g) {
        const n = g.n, p = G.player, sk = g.skill;
        if (g.cool > 0) g.cool--;
        if (g.wait > 0) { g.wait--; n.moving = false; n.run = n.jog = false; return; }
        const d = igDist(n, p);
        let sp;
        if (g.dash > 0) { g.dash--; sp = g.it === 'npc' ? 2.25 : 2.15; }
        else if (g.cool === 0 && d < (g.it === 'npc' ? 40 : 30)) { g.dash = g.it === 'npc' ? 20 : 26; g.cool = g.it === 'npc' ? 110 : 125; sp = 2.2; }
        else sp = g.it === 'npc' ? 1.45 + sk * 0.35 : 1.25 + sk * 0.3;
        if (g.it === 'npc') {
            // after her, aiming a little ahead of where she's going; round whatever's in the way by its path
            const lead = Math.min(6 + sk * 10, igDist(n, p) / 5);
            let tx = p.x + g.vx * lead, ty = p.y + g.vy * lead;
            if (!this.clear(n.x, n.y, p.x, p.y)) {
                if (!g.path || g.t % 20 === 0) g.path = this.pathTo(n, Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE), 3000);
                if (g.path && g.path.length > 1) { tx = (g.path[1][0] + 0.5) * TILE; ty = (g.path[1][1] + 0.5) * TILE + 4; }
                if (g.path && g.path.length && Math.hypot((g.path[0][0] + 0.5) * TILE - n.x, (g.path[0][1] + 0.5) * TILE + 4 - n.y) < 6) g.path.shift();
            } else g.path = null;
            this.steer(g, sp, (x, y) => -Math.hypot(tx - x, ty - y) * 4 - Math.max(0, Math.hypot(x - g.cx, y - g.cy) - IG_FIELD - 2 * TILE) * 2);
        } else {
            // away from her, keeping inside the field, turning before the edge rather than at it
            this.steer(g, sp, (x, y) => {
                const away = Math.hypot(x - p.x, y - p.y), edge = Math.hypot(x - g.cx, y - g.cy);
                return away * 4 - Math.max(0, edge - IG_FIELD * 0.7) * 6;
            });
        }
    },

    /* ---------------------------------------------------------------- hide-and-seek: they hide, Sarah looks */
    /* good places to hide: just behind (north of) a tree or a building, out of sight from the south */
    hideSpots(cx, cy, minD, maxD) {
        const a = G.area, out = [], seen = new Set();
        for (const e of a.ents) {
            const prop = e.px != null && PROP_SIZE[e.kind] && !IG_LOW[e.kind];
            if (!IG_TALL[e.kind] && !prop) continue;
            const cells = [];
            if (e.kind === 'building' && e.b) for (let x = e.b.x; x < e.b.x + e.b.w; x++) cells.push([x, e.b.y - 1]);
            else if (prop) for (let x = e.px; x < e.px + PROP_SIZE[e.kind]; x++) cells.push([x, e.py - 1]);
            else if (e.tx != null) cells.push([e.tx, e.ty - 1]);
            else cells.push([Math.floor(e.x / TILE), Math.floor(e.y / TILE) - 2]);
            for (const [tx, ty] of cells) {
                const k = tx + ',' + ty;
                if (seen.has(k) || a.blockedAt(tx, ty)) continue;
                seen.add(k);
                const x = (tx + 0.5) * TILE, y = (ty + 0.5) * TILE + 4, d = Math.hypot(x - cx, y - cy);
                if (d < minD || d > maxD) continue;
                if (NPCs.here().some(o => Math.hypot(o.x - x, o.y - y) < 20)) continue;
                out.push([tx, ty, x, y]);
            }
        }
        return shuffled(out);
    },
    async seekStart() {
        const g = this.on, n = g.n, p = G.player;
        G.busy++;
        try {
            faceNpc(n, p);
            await UI.say(n.id, igLine(n.id, 'seekStart'), { keep: true });
            UI.hideDialog();
            igHud('#dsong', `Hide-and-seek: find ${n.def.name}!`);
            g.phase = 'count';
            for (let i = 1; i <= 10; i++) { G.fade = i / 10; await waitFrames(2); }
            // the spot: somewhere Sarah can walk to, behind something, not right next to her
            let spot = null;
            for (const s of this.hideSpots(p.x, p.y, 5 * TILE, IG_HIDE_FIELD)) {
                const path = findPath(G.area, Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE), s[0], s[1], 4000);
                if (path && path.length < 40) { spot = s; break; }
            }
            // (nowhere behind anything: just somewhere a good way off)
            for (let tries = 0; !spot && tries < 60; tries++) {
                const tx = Math.floor(p.x / TILE) + rint(-10, 10), ty = Math.floor(p.y / TILE) + rint(-10, 10);
                const x = (tx + 0.5) * TILE, y = (ty + 0.5) * TILE + 4;
                if (G.area.blockedAt(tx, ty) || Math.hypot(x - p.x, y - p.y) < 6 * TILE) continue;
                const path = findPath(G.area, Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE), tx, ty, 4000);
                if (path && path.length < 40) spot = [tx, ty, x, y];
            }
            if (!spot) spot = [0, 0, n.x, n.y];
            await this.countdown(10, 22);
            n.x = spot[2]; n.y = spot[3]; n.dir = 'down'; n.flip = R() < 0.5;
            n.moving = false; n.run = n.jog = false;
            g.hint = 25 * 60;
            for (let i = 9; i >= 0; i--) { G.fade = i / 10; await waitFrames(2); }
            G.fade = 0;
        } finally { G.busy = Math.max(0, G.busy - 1); }
        if (this.on !== g) return;
        g.phase = 'play';
        this.say('Ready or not!');
        igHud('#dtip', 'Walk right up to them to find them');
    },
    seekTick(g) {
        const n = g.n, p = G.player;
        const left = IG_SEEK_FRAMES - g.t;
        igHud('#dscore', this.clock(left));
        if (g.t % 60 === 0 && R() < 0.15) { n.hop = 2; }
        // a giggle now and then gives away which way they are
        if (g.t >= g.hint) {
            g.hint += 20 * 60;
            const d = igDist(n, p), far = d > 9 * TILE ? 'far away' : d > 4 * TILE ? 'not too far' : 'close by';
            n.emote = 'laugh'; n.emoteT = 70;
            Sfx.play('blip');
            this.say(`A giggle... ${far}, to the ${igWay(n.x - p.x, n.y - p.y)}!`, '#ffffff');
        }
        if (igDist(n, p) < 20) { this.seekFound(); return; }
        if (left <= 0) {
            g.endLine = igLine(n.id, 'notFound');
            n.hop = 3; n.emote = 'laugh';
            this.end('lose');
        }
    },
    seekFound() {
        const g = this.on;
        if (!g || g.phase !== 'play') return;
        const secs = Math.ceil(g.t / 60), R0 = igRec('seek');
        g.endLine = igLine(g.n.id, 'found');
        g.n.emote = 'bang'; g.n.emoteT = 50; g.n.hop = 3;
        if (!R0.fast || secs < R0.fast) { if (R0.fast) g.best = `Found in ${secs} seconds: your fastest yet!`; R0.fast = secs; }
        this.end('win');
    },

    /* ---------------------------------------------------------------- hide-and-seek: Sarah hides, they look */
    async hideStart() {
        const g = this.on, n = g.n, p = G.player;
        G.busy++;
        try {
            faceNpc(n, p);
            await UI.say(n.id, igLine(n.id, 'hideStart'), { keep: true });
            UI.hideDialog();
        } finally { G.busy = Math.max(0, G.busy - 1); }
        if (this.on !== g) return;
        igHud('#dsong', `Hide-and-seek: hide from ${n.def.name}!`);
        // they turn round and count out loud; Sarah runs off and hides (behind something is best)
        n.dir = 'up'; n.flip = false;
        g.cx = n.x; g.cy = n.y;
        g.phase = 'count';
        igHud('#dtip', 'Hide behind a tree or a building, not too far away');
        g.count = 10;
        const tick = async () => {
            for (; g.count > 0 && this.on === g; g.count--) {
                igHud('#dcount', String(g.count));
                Sfx.ui('tick');
                for (let i = 0; i < 60 && this.on === g; i++) { await waitFrames(1); if (G.busy || UI.dialogOpen) i--; }
            }
        };
        await tick();
        if (this.on !== g) return;
        igHud('#dcount', '');
        g.phase = 'play';
        g.t = 0; g.path = null; g.look = 0;
        n.emote = 'bang'; n.emoteT = 40;
        this.say('Ready or not, here I come!', '#ffffff');
        igHud('#dtip', '');
    },
    hideTick(g) {
        const n = g.n, p = G.player, sk = g.skill;
        const left = IG_HIDE_FRAMES - g.t;
        igHud('#dscore', this.clock(left));
        const d = igDist(n, p);
        // hiding too far away doesn't count
        if (Math.hypot(p.x - g.cx, p.y - g.cy) > IG_HIDE_FIELD + 2 * TILE) {
            if (++g.far > 150) { g.endLine = igLine(n.id, 'tooFar'); this.end('lose'); return; }
            igHud('#dtip', 'Too far away! Come back closer!');
        } else if (g.far) { g.far = 0; igHud('#dtip', ''); }
        // seen? Close by, anyone's seen; further off, only out in the open
        const sight = (4 + sk * 3) * TILE;
        if (d < 1.6 * TILE || (d < sight && this.clear(n.x, n.y, p.x, p.y))) {
            g.endLine = igLine(n.id, 'caught');
            n.emote = 'bang'; n.emoteT = 50;
            this.end('lose');
            return;
        }
        if (left <= 0) { g.endLine = igLine(n.id, 'gaveUp'); n.emote = 'sweat'; n.emoteT = 60; this.end('win'); return; }
        // looking: off to somewhere, a look round, somewhere else; warmer as the time goes on
        if (g.look > 0) { g.look--; n.moving = false; n.run = n.jog = false; if (g.look % 30 === 0) n.flip = !n.flip; return; }
        if (!g.path || !g.path.length) {
            const warm = Math.min(1, g.t / IG_HIDE_FRAMES) * (0.4 + sk * 0.6);
            const ox = lerp(g.cx, p.x, warm), oy = lerp(g.cy, p.y, warm), rad = lerp(10, 3, warm) * TILE;
            for (let tries = 0; tries < 12; tries++) {
                const tx = Math.floor((ox + (R() * 2 - 1) * rad) / TILE), ty = Math.floor((oy + (R() * 2 - 1) * rad) / TILE);
                if (G.area.blockedAt(tx, ty) || Math.hypot((tx + 0.5) * TILE - g.cx, (ty + 0.5) * TILE - g.cy) > IG_HIDE_FIELD) continue;
                const path = this.pathTo(n, tx, ty, 2500);
                if (path && path.length > 1 && path.length < 30) { g.path = path; break; }
            }
            if (!g.path) { g.look = 40; return; }
        }
        if (this.follow(g, 0.95 + sk * 0.3)) { g.look = 50 + rint(0, 40); n.emote = rpick(['dots', 'question', null]); n.emoteT = 40; }
    },

    /* ---------------------------------------------------------------- the fishing derby */
    /* somewhere for the neighbor to fish from: open ground beside water, near Sarah, not on top of her */
    derbySpot(n) {
        const a = G.area, p = G.player, tx0 = Math.floor(p.x / TILE), ty0 = Math.floor((p.y - 2) / TILE);
        let best = null, bd = 1e9;
        for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
            const tx = tx0 + dx, ty = ty0 + dy;
            if (a.blockedAt(tx, ty) || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1)) continue;
            for (const [dir, [wx, wy]] of Object.entries(DIRV)) {
                if (!a.waterAt(tx + wx, ty + wy)) continue;
                const d = Math.abs(dx) + Math.abs(dy) + (dir === 'up' ? 0 : 1);
                if (d < bd) { bd = d; best = { tx, ty, dir, kind: a.waterAt(tx + wx, ty + wy) }; }
            }
        }
        // (and Sarah has to be near the water too)
        if (!best || bd > 8) return null;
        return best;
    },
    async derbyStart() {
        const g = this.on, n = g.n, p = G.player;
        const spot = this.derbySpot(n);
        if (!spot) { this.stop(); return; }
        G.busy++;
        try {
            faceNpc(n, p);
            await UI.say(n.id, igLine(n.id, 'derby'), { keep: true });
            UI.hideDialog();
        } finally { G.busy = Math.max(0, G.busy - 1); }
        if (this.on !== g) return;
        igHud('#dsong', `Fishing derby with ${n.def.name}`);
        g.spot = spot; g.mine = 0; g.theirs = 0; g.next = this.derbyWait(g);
        g.path = this.pathTo(n, spot.tx, spot.ty, 3000) || [];
        g.phase = 'play';
        this.derbyScore(g);
        igHud('#dtip', pocketCount('rod') && heldTool() !== 'rod' ? 'Hold your rod (T) and face the water to cast' : 'Face the water and cast!');
        this.say('Cast away!');
    },
    derbyWait(g) { return Math.round((12 - g.skill * 6) * 60 * (0.5 + R())); },
    derbyScore(g) { igHud('#dscore', `${this.clock(IG_DERBY_FRAMES - g.t)}  You ${g.mine} · ${g.n.def.name} ${g.theirs}`); },
    /* Sarah's own catches (51_fishing.js) */
    caught(id) {
        const g = this.on;
        if (g && g.kind === 'derby' && g.phase === 'play' && id !== 'crate' && id !== 'boot') { g.mine++; this.derbyScore(g); }
    },
    derbyTick(g) {
        const n = g.n;
        if (g.t % 30 === 0) this.derbyScore(g);
        if (g.path && g.path.length) { this.follow(g, 0.9); if (!g.path.length) { n.dir = g.spot.dir; n.flip = g.spot.dir === 'left'; } return; }
        n.moving = false; n.run = n.jog = false;
        n.dir = g.spot.dir;
        if (n.pose !== 'fish' && !g.cheer) n.pose = 'fish';
        if (g.cheer > 0 && --g.cheer === 0) n.pose = 'fish';
        if (--g.next <= 0) {
            g.next = this.derbyWait(g);
            const fish = Fishing.choose(g.spot.kind);
            if (fish !== 'boot') {
                g.theirs++;
                n.pose = 'cheer'; g.cheer = 50; n.emote = 'sparkle'; n.emoteT = 50;
                Sfx.play('plop');
                UI.toast(`${n.def.name} caught ${aOrAn(itemName(fish))} ${itemName(fish).toLowerCase()}!`, fish);
            } else { n.emote = 'sweat'; n.emoteT = 50; }
            this.derbyScore(g);
        }
        if (g.t >= IG_DERBY_FRAMES) {
            if (Fishing.st) Fishing.stop();
            const won = g.mine > g.theirs, tie = g.mine === g.theirs;
            g.endLine = igLine(n.id, tie ? 'derbyTie' : won ? 'derbyLose' : 'derbyWin');
            const R0 = igRec('derby');
            if (g.mine > (R0.most || 0)) { if (R0.most) g.best = `${g.mine} fish: your best derby yet!`; R0.most = g.mine; }
            this.end(won ? 'win' : 'lose');
        }
    },
};
Bus.on('fish', id => IslandGames.caught(id));

/* how a dance-off or a duet ends (52_dance.js, 63_karaoke.js call these after Wasabi's say) */
async function danceOffEnd(n, mine, theirs) {
    const id = n.id, won = mine > theirs, R0 = igRec('danceoff');
    R0.played++; if (won) R0.won++;
    await UI.say('wasabi', `Dance-off! ${fmtNum(mine)} for ${S.playerName || 'Sarah'}, ${fmtNum(theirs)} for ${n.def.name}. ` + (won ? 'The floor is YOURS!' : mine === theirs ? 'A tie?! On MY floor?!' : `${n.def.name} takes it!`), { keep: true });
    await UI.say(id, igLine(id, won ? 'danceLose' : mine === theirs ? 'danceTie' : 'danceWin'), { keep: true });
    if (won) { G.player.pose = 'cheer'; G.player.poseT = 60; } else { n.emote = 'note'; n.emoteT = 60; }
    await igFriend(n, 'danceoff');
}
async function duetEnd(n, rank) {
    const id = n.id, good = rank === 'S' || rank === 'A', R0 = igRec('duet');
    R0.played++; if (good) R0.won++;
    n.emote = good ? 'heart' : 'note'; n.emoteT = 70;
    // (Joe has his own words about his poems, right after)
    if (id !== 'joe') await UI.say(id, igLine(id, good ? 'duetGood' : 'duetOk'), { keep: true });
    await igFriend(n, 'duet');
}
/* a game together counts for friendship once a day */
async function igFriend(n, kind) {
    const r = rel(n.id), day = Clock.dayNum();
    remember(n.id, 'game', { game: kind });
    if (r.playDay === day) return;
    r.playDay = day;
    const up = addPts(n.id, 3);
    heartPop(n);
    if (up) await heartUp(n, up);
}

/* ---------------------------------------------------------------- they ask Sarah to play */
/* Now and then, talked to, a neighbor asks Sarah to play (David, 27 October evening): at most once a day each, about one
   talk in eight when a game fits where they are and the hour; never one who's just asked a favor. And rarely they text
   to ask (6w_extras.js Invites, kind 'play'): yes, then talking to them starts it. */
const IG_ASK_CHANCE = 0.12;
const IG_ASK = {
    _: ["Hey! Want to play {game}? I've been standing here thinking about {game}.", 'Perfect timing! Play {game} with me?', 'Wanna play {game}? Just one round. Okay, maybe two.'],
    kai: ["Duuude. {game}. You and me. Right now?", "Bro, I'm SO restless. {game}? Please?"],
    maki: ['I have scheduled a short game of {game}. You are invited. Precisely now.'],
    joe: ["Want to play {game}? I'll go easy on you. No I won't. Yes I will. Let's find out."],
    chili: ["I'm all fired up! {game}? Say yes. Say yes!"],
    cuke: ['Quick game of {game}? Great for the heart! The actual heart!'],
    coco: ["Girl, play {game} with me. I need something to talk about later."],
};
async function igMaybeAsk(n, roll = R()) {
    const id = n.id, r = rel(id), day = Clock.dayNum();
    if (r.igAskDay === day || NPC_DEFS[id].family || IslandGames.on) return false;
    const games = IslandGames.list(n);
    if (!games.length || roll > IG_ASK_CHANCE) return false;
    r.igAskDay = day;
    const [kind, label] = rpick(games);
    const pool = IG_ASK[id] || IG_ASK._;
    const k = await UI.ask(id, voiced(id, rpick(pool).replace(/\{game\}/g, label.toLowerCase())), ["Sure, let's play!", 'Maybe later'], { keep: true });
    if (k !== 0) { await UI.say(id, voiced(id, rpick(["Aw, okay! I'll ask again sometime.", 'No worries! Another time.'])), { keep: true }); return false; }
    return igBegin(n, kind);
}
/* start a game they asked for (false: the talk carries on) */
async function igBegin(n, kind) {
    let mode = null;
    if (kind === 'hide') {
        const m = await UI.ask(n.id, igLine(n.id, 'seekAsk'), ["I'll hide!", "I'll look for you!"], { keep: true });
        mode = m === 0 ? 'hide' : 'seek';
    }
    setTimeout(() => IslandGames.start(kind, n, mode), 60);
    return true;
}
