/* ---- 6zzm_volley.js ---- */
/* The volleyball court (David, 29 October): Sarah can play on her own (a ball machine across the net sends every ball
   back; how many she gets over is her score) and look up the scores at the court: the best rallies, hers among the
   neighbors' (VB_RIVALS), and how she's done against each neighbor. Some days two neighbors play a game there, the way
   two of them turn the jump rope (vbDay, vbOverride in makePlan; VolleyLive moves the ball between them). */
const VB_TALK = ["We're keeping score. Well, we were. Then we argued about the score. Now we're just playing.", 'Want to play next? Talk to me and say "Let\'s play!" Winner gets bragging rights. Loser gets sand in their shoes.',
    'The trick is to bump it up, not at your face. I learned that one the hard way.', "There's a ball machine by the net if you want to practice on your own. It never gets tired. I'm a little jealous."];
const VB_RIVALS = { kai: 26, cuke: 21, chili: 14, sully: 17, coco: 9, cece: 6 };
function vbSolo() { if (!S.games) S.games = {}; return S.games.vbSolo || (S.games.vbSolo = { best: 0, top: [], played: 0 }); }
function vbSoloBest() { return S && S.games && S.games.vbSolo ? S.games.vbSolo.best : 0; }
function vbVs(id) { if (!S.games) S.games = {}; if (!S.games.vbVs) S.games.vbVs = {}; return S.games.vbVs[id] || (S.games.vbVs[id] = { played: 0, won: 0 }); }
function vbSoloRecord(score) {
    const v = vbSolo();
    v.played++;
    if (score > v.best) v.best = score;
    if (score > 0) { v.top.push([score, Clock.dayNum()]); v.top.sort((a, b) => b[0] - a[0]); v.top.length = Math.min(v.top.length, 5); }
    Save.touch();
}
async function playVolleySolo() {
    if (G.busy || Arcade.on) return;
    await Arcade.start('volley', { solo: true, home: true, title: 'Beach Volleyball, on your own', onOver: r => { if (!r.quit) vbSoloRecord(r.score); } });
}
/* the court's board: the best rallies on the island (Sarah's top five with the neighbors' bests), then each neighbor
   she's played */
function vbScores() {
    const P = UI.open({ title: 'Volleyball scores', back: true });
    const rows = Object.entries(VB_RIVALS).filter(([id]) => NPC_DEFS[id]).map(([id, s]) => ({ who: NPC_DEFS[id].name, s, me: false }));
    for (const [s, day] of vbSolo().top) rows.push({ who: S.playerName || 'Sarah', s, me: true, day });
    rows.sort((a, b) => b.s - a.s);
    P.body.appendChild(el('p', 'muted', 'On your own with the ball machine: the most balls over the net in one go.'));
    const list = el('div', 'list hs-list');
    rows.slice(0, 8).forEach((r, i) => {
        const row = el('div', 'row hs-row' + (r.me ? ' me' : ''));
        row.appendChild(el('div', 'hs-rank', String(i + 1)));
        const t = el('div', 't');
        t.appendChild(el('b', null, r.who));
        t.appendChild(el('span', null, r.me ? dayLabel(r.day) : 'their best'));
        row.appendChild(t);
        row.appendChild(el('div', 'price', String(r.s)));
        list.appendChild(row);
    });
    P.body.appendChild(list);
    const vs = S.games && S.games.vbVs ? Object.entries(S.games.vbVs).filter(([id, v]) => NPC_DEFS[id] && v.played) : [];
    if (vs.length) {
        P.body.appendChild(el('h3', null, 'Against the neighbors'));
        for (const [id, v] of vs.sort((a, b) => b[1].played - a[1].played)) P.body.appendChild(el('p', null, `${NPC_DEFS[id].name}: ${v.won} won of ${v.played}`));
    } else P.body.appendChild(el('p', 'muted', 'Play a neighbor (Let\'s play!) and your games against them show here.'));
}
/* tapping the net */
async function useCourt() {
    const wet = G.weather === 'rain' || G.weather === 'storm';
    const playing = VolleyLive.pl;
    const opts = [];
    if (!wet) opts.push(['Play on my own', 'solo']);
    if (playing && !wet) opts.push([`Play ${playing[0].def.name}`, 'a'], [`Play ${playing[1].def.name}`, 'b']);
    opts.push(['Scores', 'scores'], ['Never mind', 'no']);
    const k = await UI.ask(null, wet ? 'The court is soaked. The ball would just go splat.' : 'The volleyball court. The ball machine is plugged in and ready.', opts.map(o => o[0]));
    const pick = opts[k] && opts[k][1];
    UI.hideDialog();
    if (pick === 'solo') await playVolleySolo();
    else if (pick === 'scores') vbScores();
    else if (pick === 'a' || pick === 'b') await FieldGames.start('volley', playing[pick === 'a' ? 0 : 1]);
}

/* ---------------------------------------------------------------- the neighbors' games at the court */
const VB_PLAYERS = ['kai', 'cuke', 'chili', 'sully', 'coco', 'cece', 'basil', 'clementine', 'scampi'];
function vbDay(day) {
    if (!S || !S.flags || !S.flags.introDone || !(W0.props || []).some(q => q.kind === 'volleyball')) return null;
    const today = Clock.dayNum();
    day = day == null ? today : day;
    if (day === today && G.weather && ['rain', 'storm', 'snow'].includes(G.weather)) return null;
    const mo = new Date(day * 86400e3).getUTCMonth();
    if (mo === 11 || mo < 2) return null;                       // (no beach volleyball in winter)
    const r = mulberry(hash32(S.seed + ':vb:' + day));
    if (r() < 0.5) return null;
    const late = r() < 0.5, hours = late ? [15.75, 17.75] : [10.5, 12.5];
    const rope = late ? ropeDay(day) : null;
    const free = VB_PLAYERS.filter(id => {
        const d = NPC_DEFS[id];
        if (!d || d.online || d.shop || (rope && (rope.a === id || rope.b === id))) return false;
        if (id === 'scampi' && !(S.sea && S.sea.stage >= 99)) return false;
        if (d.wake > hours[0] - 0.5 || d.bed < hours[1] + 0.5) return false;
        return !(d.work || []).some(([, a, b]) => a < hours[1] && b > hours[0]);
    });
    if (free.length < 2) return null;
    const a = free[Math.floor(r() * free.length)], rest = free.filter(id => id !== a), b = rest[Math.floor(r() * rest.length)];
    return { a, b, hours };
}
function vbOverride(id, day) {
    const v = vbDay(day);
    if (!v || (id !== v.a && id !== v.b)) return null;
    return [[id === v.a ? 'vb_a' : 'vb_b', v.hours[0], v.hours[1]]];
}
/* where the two stand: each side of the net, in the middle of their half, facing it */
function vbSpot(which) {
    const c = (W0.props || []).find(q => q.kind === 'volleyball');
    const w = PROP_SIZE.volleyball || 6, x = c.x + w / 2, y = which === 'a' ? c.y + 0.9 : c.y + 3.9;
    return { area: 'island', x: x * TILE, y: y * TILE, fixed: true, face: which === 'a' ? 'down' : 'up' };
}
const VolleyLive = {
    pl: null, t: 0,
    players() {
        const v = vbDay();
        if (!v) return null;
        const a = NPCs.get(v.a), b = NPCs.get(v.b);
        const ok = (n, k) => n && !n.sleeping && n.area === 'island' && n.spotKey === k && !n.path && !n.talking && !n.script;
        return ok(a, 'vb_a') && ok(b, 'vb_b') ? [a, b] : null;
    },
    ball() { const isl = G.areas && G.areas.island; return isl && isl.ents.find(e => e.kind === 'vbball'); },
    update() {
        if (G.frame % 20 === 3) this.pl = this.players();
        const pl = this.pl, ball = this.ball();
        if (!ball) return;
        if (!pl) { if (ball.home) { [ball.x, ball.y] = ball.home; ball.air = 0; ball.home = null; } return; }
        if (!ball.home) ball.home = [ball.x, ball.y];
        // a rally: the ball goes back and forth over the net, now and then it drops (a point), a moment's rest, a serve
        const P = 62;
        this.t++;
        const leg = Math.floor(this.t / P), k = (this.t % P) / P, rally = leg % 9;
        const from = pl[leg % 2], to = pl[(leg + 1) % 2];
        if (rally === 8) { ball.x = from.x + (to.x - from.x) * 0.15; ball.y = from.y + (to.y - from.y) * 0.15 + 6; ball.air = 0; return; }
        const drop = rally === 7;
        const kk = drop ? Math.min(1, k * 1.1) : k;
        ball.x = from.x + (to.x - from.x) * kk * (drop ? 0.8 : 1);
        ball.y = from.y + (to.y - from.y) * kk * (drop ? 0.8 : 1);
        ball.air = drop ? Math.max(0, 26 + Math.sin(Math.PI * kk) * 34 - kk * 26) : 26 + Math.sin(Math.PI * kk) * 34;
        if (this.t % P === 1) { from.pose = 'cheer'; from.poseT = 14; }
    },
};
