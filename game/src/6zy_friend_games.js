/* ---- 6zy_friend_games.js ---- */
/* Tag with a friend online (docs/ROADMAP.md: "more games with friends online"): two people on the same island, both
   outside, play tag for two minutes. Walk up to a friend and pick "Play tag"; whoever asked starts as "it". The one who's
   it tags the other by getting close (each side checks only its own player against where the other is shown, and only
   the one who's it says so, 'tagIt', numbered so a late message can't undo a newer tag); after a tag there's a
   three-second pause before the new "it" can tag back. One side calls time and sends its count of who was it for how
   long, so both see the same result: whoever was it for less time wins. Messages go only to the other player
   (Online.game, as the arcade's two-player games: 6zv_versus.js). Records are in S.games.ftag. */
const FT_FRAMES = 120 * 60, FT_PAUSE = 180, FT_REACH = 18;
const FriendTag = {
    on: null, asking: null, waiting: null,
    /* can these two play now? (both outside on the island, nothing else going on) */
    can(o) { return !!o && G.area && G.area.id === 'island' && o.area === 'island' && !this.on && !this.asking && !IslandGames.on && !(VsNet && VsNet.match); },
    invite(o) {
        if (!this.can(o)) return;
        Online.game(o.who, { k: 'tagAsk' });
        UI.toast(`Asking ${Online.name(o.who)} to play tag...`);
        this.asking = { to: o.who, timer: setTimeout(() => { if (this.asking && this.asking.to === o.who) { this.asking = null; UI.toast(`${Online.name(o.who)} didn't answer.`); } }, 30000) };
    },
    got(from, d) {
        if (d.k === 'tagAsk') { this.asked(from); return; }
        if (d.k === 'tagNo' || d.k === 'tagYes') {
            const a = this.asking;
            if (!a || a.to !== from) return;
            clearTimeout(a.timer); this.asking = null;
            if (d.k === 'tagNo') { UI.toast(d.why === 'busy' ? `${Online.name(from)} is busy right now.` : `${Online.name(from)} said not now.`); return; }
            Online.game(from, { k: 'tagGo', it: Online.who() });
            this.start(from, Online.who());
            return;
        }
        if (d.k === 'tagGo') { if (this.waiting === from) { this.waiting = null; this.start(from, d.it); } return; }
        const g = this.on;
        if (!g || g.with !== from) return;
        if (d.k === 'tagIt') this.tagged(d.it, d.n | 0);
        else if (d.k === 'tagEnd') {
            // (the other side called time: its count, seen from here)
            if (d.why === 'time' && d.mine >= 0 && d.theirs >= 0) { g.mine = d.theirs; g.theirs = d.mine; }
            this.end(d.why === 'time' ? 'time' : 'theyQuit');
        }
    },
    async asked(from) {
        if (this.on || this.asking || this.waiting || G.busy || IslandGames.on || !G.area || G.area.id !== 'island') { Online.game(from, { k: 'tagNo', why: 'busy' }); return; }
        G.busy++;
        let k;
        try { k = await UI.ask(null, `${Online.name(from)} wants to play tag! Two minutes. Whoever's "it" for the least time wins.`, ["Let's play!", 'Not now']); } finally { UI.hideDialog(); G.busy--; }
        if (k !== 0) { Online.game(from, { k: 'tagNo' }); return; }
        this.waiting = from;
        Online.game(from, { k: 'tagYes' });
        setTimeout(() => { if (this.waiting === from) this.waiting = null; }, 10000);
    },
    start(withWho, it) {
        this.on = { with: withWho, it, t: 0, n: 0, mine: 0, theirs: 0, pause: FT_PAUSE, judgeT: 0 };
        HUD.show(false);
        for (const s of ['#djudge', '#dcombo', '#dcount', '#dlyric', '#dtip', '#dscore', '#dsong']) { $(s).style.left = ''; $(s).style.top = ''; $(s).textContent = ''; }
        $('#dancehud').hidden = false;
        igHud('#dsong', `Tag with ${Online.name(withWho)}`);
        Music.over = 'fruit';
        Music.update(true);
        this.say(it === Online.who() ? "You're it! Count to three..." : `${Online.name(withWho)} is it! Run!`);
        igRec('ftag').played++;
        S.stats.islandGames = (S.stats.islandGames || 0) + 1;
        Save.touch();
    },
    say(text, col) { const e = $('#djudge'); e.textContent = text; e.style.color = col || '#ffd84a'; if (this.on) this.on.judgeT = 120; },
    /* every frame (90_main.js) */
    tick() {
        const g = this.on;
        if (!g) return;
        const o = Online.others.get(g.with);
        if (!o) { this.end('gone'); return; }
        if (G.mode !== 'play' || !G.area || G.area.id !== 'island') { this.quit(); return; }
        g.t++;
        if (g.judgeT && --g.judgeT === 0) igHud('#djudge', '');
        if (g.pause > 0) g.pause--;
        const me = g.it === Online.who();
        if (me) g.mine++; else g.theirs++;
        igHud('#dcount', IslandGames.clock(FT_FRAMES - g.t));
        igHud('#dscore', me ? "You're it!" : `${Online.name(g.with)} is it`);
        igHud('#dtip', g.pause > 0 ? (me ? 'Wait for it...' : 'Run!') : me ? `Catch ${Online.name(g.with)}!` : 'Keep away!');
        if (me && g.pause <= 0 && o.area === 'island' && igDist(G.player, o) < FT_REACH) {
            g.n++;
            Online.game(g.with, { k: 'tagIt', it: g.with, n: g.n });
            this.tagged(g.with, g.n);
        }
        // (one side calls time, so both see the same count)
        if (g.t >= FT_FRAMES && Online.who() < g.with) { Online.game(g.with, { k: 'tagEnd', why: 'time', mine: g.mine, theirs: g.theirs }); this.end('time'); }
        else if (g.t >= FT_FRAMES + 600) this.end('time');
    },
    tagged(it, n) {
        const g = this.on;
        if (!g || n < g.n) return;
        g.n = n; g.it = it; g.pause = FT_PAUSE;
        Sfx.play('pick');
        if (it === Online.who()) { this.say("Tagged! You're it!", '#ff8ec0'); G.player.emote = 'surprise'; G.player.emoteT = 50; }
        else this.say(`Tag! ${Online.name(it)} is it!`);
    },
    quit() { const g = this.on; if (!g) return; Online.game(g.with, { k: 'tagEnd', why: 'quit' }); this.end('quit'); },
    end(how) {
        const g = this.on;
        if (!g) return;
        this.on = null;
        $('#dancehud').hidden = true;
        for (const s of ['#djudge', '#dcount', '#dtip', '#dscore', '#dsong']) igHud(s, '');
        HUD.show(true);
        Music.over = null;
        Music.update(true);
        const nm = Online.name(g.with), secs = f => `${Math.round(f / 60)} ${plural(Math.round(f / 60), 'second')}`;
        if (how === 'quit') { UI.toast('Stopped playing tag.'); return; }
        if (how === 'theyQuit') { UI.toast(`${nm} stopped playing tag.`); return; }
        if (how === 'gone') { UI.toast(`${nm} left the island. Game over!`); return; }
        const tie = Math.abs(g.mine - g.theirs) < 60, won = !tie && g.mine < g.theirs;
        if (won) igRec('ftag').won++;
        Save.touch();
        Sfx.play(won || tie ? 'fanfare' : 'pick');
        UI.say(null, tie ? `Time! A tie with ${nm}: you were both "it" for about ${secs(g.mine)}.`
            : `Time! ${won ? 'You win' : `${nm} wins`}! You were "it" for ${secs(g.mine)}, ${nm} for ${secs(g.theirs)}.`);
    },
};
