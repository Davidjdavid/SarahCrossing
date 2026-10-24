/* ---- 32z_hd_draw.js ---- */
/* Drawing the HD people and neighbors in the game (into the HD-2D view's cards, three pixels to a world pixel).
   drawPlayer, drawNPC and Online.drawOther call these while an HD card is being drawn; each returns false when there
   is no HD art for that character, and the 16x24 sprite is drawn instead. */
/* eyes shut for a few frames every few seconds, everyone at their own moment */
function hdBlinkNow(seed) { return (G.t + seed * 97) % 263 < 7; }
function hdSeed(id) { return hash32(String(id)) % 1000; }

/* ---------------------------------------------------------------- how people move: eight directions, walking, running, standing */
/* the eight ways to face, going round: right, down-right, down, down-left, left, up-left, up, up-right (as frame side and flip) */
const HD_DIR8 = [['side', false], ['dside', false], ['down', false], ['dside', true], ['side', true], ['uside', true], ['up', false], ['uside', false]];
const HD_DIR4 = { right: 0, down: 2, left: 4, up: 6 };
/* where someone is heading (from how they moved since last drawn, smoothed), which way they face (turning one step at a
   time, not snapping round), and how far they've walked (the feet keep pace with the ground) */
function hdMotion(e, moving) {
    const d4 = HD_DIR4[e.dir] != null ? HD_DIR4[e.dir] : 2;
    let m = e._hd;
    if (!m) m = e._hd = { x: e.x, y: e.y, vx: 0, vy: 0, face: d4, want: d4, turn: 0, dist: 0, dir: e.dir };
    // (a slow frame can cover a few steps; a jump of more than two tiles is a teleport: a door, a new area)
    const dx = e.x - m.x, dy = e.y - m.y, jump = Math.abs(dx) > 32 || Math.abs(dy) > 32;
    m.x = e.x; m.y = e.y;
    if (jump) { m.vx = m.vy = 0; m.face = m.want = d4; }
    else { m.vx = m.vx * 0.55 + dx * 0.45; m.vy = m.vy * 0.55 + dy * 0.45; m.dist += Math.hypot(dx, dy); }
    if (moving && Math.hypot(m.vx, m.vy) > 0.2) m.want = (Math.round(Math.atan2(m.vy, m.vx) / (Math.PI / 4)) + 8) % 8;
    else if (e.dir !== m.dir) m.want = d4;      // turned to face something
    m.dir = e.dir;
    // one step round every three ticks of game time (however slowly frames come)
    let steps = m.face === m.want ? 0 : Math.min(4, Math.floor((G.t - (m.turn || 0)) / 3));
    if (m.face === m.want) m.turn = G.t;
    for (; steps > 0 && m.face !== m.want; steps--) {
        const d = (m.want - m.face + 8) % 8;
        m.face = (m.face + (d <= 4 ? 1 : 7)) % 8;
        m.turn = G.t;
    }
    return m;
}
/* the frame for someone moving (or not): "dside:walk:3", "down:idle:1:0"... and whether it's flipped */
function hdMoveFrame(e, moving, run, seed) {
    const m = hdMotion(e, moving), [dir, flip] = HD_DIR8[m.face];
    if (moving) {
        m.still = null;
        const anim = run ? 'run' : 'walk', n = HD_ANIM[anim], len = run ? 34 : 26;     // world pixels per stride cycle
        return [`${dir}:${anim}:${Math.floor(m.dist / len * n) % n}`, flip];
    }
    // standing: breathing, and now and then a glance one way or the other
    const t = G.t + seed * 37, ph = Math.floor(t / 34) % 4, gl = t % 520 < 100 ? ((Math.floor(t / 520) + seed) % 3) - 1 : 0;
    // standing about a while (facing us): every so often a look around, or a big stretch
    if (m.still == null) m.still = G.t;
    const idle = G.t - m.still;
    if (dir === 'down' && idle > 600) {
        const c = (idle - 600) % 900, kind = (Math.floor((idle - 600) / 900) + seed) % 2;
        if (kind === 0 && c < 130) return c < 65 ? ['dside:idle:0:0', true] : ['dside:idle:0:0', false];
        if (kind === 1 && c < 96) return [`down:stretch:${c < 12 || c >= 84 ? 0 : c < 24 || c >= 72 ? 1 : 2}`, false];
    }
    return [`${dir}:idle:${ph}:${dir === 'up' || dir === 'uside' ? 0 : gl}`, flip];
}

function hdDrawPlayer(ctx, p) {
    const spec = Online.visitor() ? hdFolkSpec(Online.who()) : hdSarahSpec();
    if (!spec || !HD_HAIR.waves) return false;
    if (p.sit && Math.abs(p.y - (p.sit.benchY - 1)) > 2) { p.sit = null; p.sy = undefined; }
    if (p.sit) { hdDraw(ctx, hdPersonFrame(spec, 'down_sit', hdBlinkNow(1)), p.x, Math.round(p.y)); return true; }
    const y = Math.round(p.y) - (p.hop || 0);
    drawToolUnder(ctx, p, y);
    // poses (picking up, cheering, dancing, hugging, fishing, holding a tool) keep their own frames
    let fr, flip = p.dir === 'left';
    if (p.pose || p.tool || p.glide) { fr = playerFrameKey(p); hdMotion(p, false); }
    else { [fr, flip] = hdMoveFrame(p, p.moving, p.run, 1); if (p.moving && p.run) hdDust(p); }
    hdDraw(ctx, hdPersonFrame(spec, fr, hdBlinkNow(1)), p.x, y, flip);
    drawToolOver(ctx, p, y);
    return true;
}
/* little puffs of dust from running feet */
function hdDust(e) {
    const m = e._hd;
    if (!m || m.puff === Math.floor(m.dist / 17)) return;
    m.puff = Math.floor(m.dist / 17);
    const sx = -Math.sign(m.vx || 0.01), sy = -Math.sign(m.vy || 0.01);
    G.fx.push({ x: e.x + sx * 2, y: e.y + 1, t: 0, life: 22, sorted: false, draw(ctx) {
        const k = this.t / this.life, r = 1.5 + k * 3.5;
        ctx.globalAlpha = 0.45 * (1 - k);
        ctx.fillStyle = '#e8dcc4';
        ctx.beginPath(); ctx.arc(this.x + sx * k * 4, this.y - k * 3 + sy * k, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    } });
}

function hdDrawNPC(ctx, n) {
    const d = n.def, acc = npcWearing(n.id), seed = hdSeed(n.id), blink = hdBlinkNow(seed);
    const [f, flip0, , squashed] = npcFrame(n);
    const y = Math.round(n.y - n.hop);
    if (d.human) {
        const spec = hdFolkSpec(d.human, acc);
        if (!spec) return false;
        if (isSeated(n) || isLounging(n)) { hdMotion(n, false); hdDraw(ctx, hdPersonFrame(spec, 'down_sit', blink), n.x, y); return true; }
        const [fr, flip] = hdMoveFrame(n, n.moving, false, seed);
        hdDraw(ctx, hdPersonFrame(spec, fr, blink), n.x, y, flip);
        return true;
    }
    if (!HD_NPC[d.sprite]) return false;
    // the food folks hop as they go; standing, they sway gently from side to side
    const sway = n.moving ? 0 : [0, 1, 1, 0, 0, -1, -1, 0][Math.floor((G.t + seed * 13) / 26) % 8];
    const fr = hdNpcFrame(d.sprite, squashed, acc, blink, sway);
    if (isSeated(n)) drawSeated(ctx, n.want.sit.benchY, () => hdDraw(ctx, fr, n.x, y, flip0));
    else hdDraw(ctx, fr, n.x, y, flip0);
    return true;
}

function hdDrawOther(ctx, o) {
    const spec = o.who === 'sarah' ? hdRemoteSarah(o.look) : hdFolkSpec(o.who);
    if (!spec) return false;
    const y = Math.round(o.y) - (o.hop || 0);
    const seed = hdSeed(o.who);
    if (o.sit) { hdMotion(o, false); hdDraw(ctx, hdPersonFrame(spec, 'down_sit', hdBlinkNow(seed)), o.x, y); return true; }
    const [fr, flip] = hdMoveFrame(o, o.walking, o.run, seed);
    hdDraw(ctx, hdPersonFrame(spec, fr, hdBlinkNow(seed)), o.x, y, flip);
    return true;
}
/* Sarah, seen from a visitor's game: her look comes with her position (checked: it's from the network) */
const HD_HEX = /^#[0-9a-fA-F]{6}$/;
function hdRemoteSarah(look) {
    const h = look && look.hd, col = (c, d) => (typeof c === 'string' && HD_HEX.test(c) ? c : d);
    const base = { look: Object.assign({}, LOOK_DEFAULT), clothes: hdOutfit((look && typeof look.outfit === 'string' && look.outfit) || 'crimson'), eyes: null, acc: null };
    if (!h || typeof h !== 'object' || !h.look || !h.clothes) return base;
    const L = h.look, C = h.clothes, word = v => (typeof v === 'string' && /^[a-z]{1,16}$/.test(v) ? v : null);
    return {
        look: { hair: word(L.hair) || 'waves', hairCol: col(L.hairCol, LOOK_DEFAULT.hairCol), tipCol: col(L.tipCol, null), skin: col(L.skin, LOOK_DEFAULT.skin),
            eyes: col(L.eyes, LOOK_DEFAULT.eyes), blush: !!L.blush, freckles: !!L.freckles },
        clothes: { style: word(C.style) || 'toppants', top: col(C.top, '#b3263a'), trim: col(C.trim, '#ffffff'), bottom: col(C.bottom, '#4d6d9f'), shoes: col(C.shoes, '#f3f1ee'),
            pat: word(C.pat), patCol: col(C.patCol, null), patWhere: word(C.patWhere),
            print: Array.isArray(C.print) && C.print.length <= 18 ? C.print.map(c => col(c, null)) : null },
        eyes: word(h.eyes), acc: word(h.acc) };
}

/* draw ahead, one frame at a time while nothing else is new: Sarah's whole set and the neighbors in view, so the first
   step in a new direction doesn't wait for a drawing */
function hdWarm() {
    if (!G.player) return;
    const sp = Online.visitor() ? hdFolkSpec(Online.who()) : hdSarahSpec(), key = JSON.stringify(sp);
    if (hdWarm.key !== key) { hdWarm.key = key; hdWarm.i = 0; }
    // the way she's facing first: walking, running and standing; then every other way
    const face = G.player._hd ? HD_DIR8[G.player._hd.face][0] : 'down', dirs = [face].concat(['down', 'dside', 'side', 'uside', 'up'].filter(d => d !== face));
    if (!hdWarm.list || hdWarm.list.face !== face || hdWarm.i === 0) {
        hdWarm.list = [];
        for (const d of dirs) { for (let i = 0; i < 8; i++) hdWarm.list.push(`${d}:walk:${i}`); for (let i = 0; i < 4; i++) hdWarm.list.push(`${d}:idle:${i}:0`); for (let i = 0; i < 6; i++) hdWarm.list.push(`${d}:run:${i}`); }
        hdWarm.list.face = face;
    }
    // her frames and the things around her take turns, while there's drawing time left this frame
    if (!hdBudget()) return;
    if (G.frame % 4 === 0) while (hdWarm.i < hdWarm.list.length) { const k = hdWarm.list[hdWarm.i++]; if (!HD_CACHE.has('p|' + k + '|0|' + key)) { hdPersonFrame(sp, k, false); return; } }
    const n = NPCs.here().find(n => !n.hidden && !n.def.human && HD_NPC[n.def.sprite] && !HD_CACHE.has(`n|${n.def.sprite}|1|${npcWearing(n.id) || ''}|0`));
    if (n) { hdNpcFrame(n.def.sprite, 1, npcWearing(n.id)); return; }
    // then the remastered things here, nearest first, before they come into view
    const a = G.area;
    if (hdWarm.area !== a) { hdWarm.area = a; const p = G.player; hdWarm.todo = [...new Set(a.ents.filter(e => e.frame && HD_SPR[e.frame]).sort((q, r) => Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(r.x - p.x, r.y - p.y)).map(e => e.frame))]; }
    const nm = hdWarm.todo && hdWarm.todo.shift();
    if (nm) hdNamed(nm, true);
}
