/* ---- 32z_hd_draw.js ---- */
/* Drawing the HD people and neighbors in the game (into the HD-2D view's cards, three pixels to a world pixel).
   drawPlayer, drawNPC and Online.drawOther call these while an HD card is being drawn; each returns false when there
   is no HD art for that character, and the 16x24 sprite is drawn instead. */
/* eyes shut for a few frames every few seconds, everyone at their own moment */
function hdBlinkNow(seed) { return (G.t + seed * 97) % 263 < 7; }
function hdSeed(id) { return hash32(String(id)) % 1000; }

function hdDrawPlayer(ctx, p) {
    const spec = Online.visitor() ? hdFolkSpec(Online.who()) : hdSarahSpec();
    if (!spec || !HD_HAIR.waves) return false;
    if (p.sit && Math.abs(p.y - (p.sit.benchY - 1)) > 2) { p.sit = null; p.sy = undefined; }
    if (p.sit) { hdDraw(ctx, hdPersonFrame(spec, 'down_sit', hdBlinkNow(1)), p.x, Math.round(p.y)); return true; }
    const y = Math.round(p.y) - (p.hop || 0);
    drawToolUnder(ctx, p, y);
    hdDraw(ctx, hdPersonFrame(spec, playerFrameKey(p), hdBlinkNow(1)), p.x, y, p.dir === 'left');
    drawToolOver(ctx, p, y);
    return true;
}

function hdDrawNPC(ctx, n) {
    const d = n.def, acc = npcWearing(n.id), blink = hdBlinkNow(hdSeed(n.id));
    const [f, flip, , squashed] = npcFrame(n);
    const y = Math.round(n.y - n.hop);
    if (d.human) {
        const spec = hdFolkSpec(d.human, acc);
        if (!spec) return false;
        if (isSeated(n) || isLounging(n)) { hdDraw(ctx, hdPersonFrame(spec, 'down_sit', blink), n.x, y); return true; }
        hdDraw(ctx, hdPersonFrame(spec, f.slice(d.human.length + 1), blink), n.x, y, flip);
        return true;
    }
    if (!HD_NPC[d.sprite]) return false;
    const fr = hdNpcFrame(d.sprite, squashed, acc, blink);
    if (isSeated(n)) drawSeated(ctx, n.want.sit.benchY, () => hdDraw(ctx, fr, n.x, y, flip));
    else hdDraw(ctx, fr, n.x, y, flip);
    return true;
}

function hdDrawOther(ctx, o) {
    const spec = o.who === 'sarah' ? hdRemoteSarah(o.look) : hdFolkSpec(o.who);
    if (!spec) return false;
    const y = Math.round(o.y) - (o.hop || 0);
    hdDraw(ctx, hdPersonFrame(spec, Online.frameKey(o), hdBlinkNow(hdSeed(o.who))), o.x, y, o.dir === 'left');
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
    if (G.frame % 2 || !G.player) return;
    const sp = Online.visitor() ? hdFolkSpec(Online.who()) : hdSarahSpec(), key = JSON.stringify(sp);
    if (hdWarm.key !== key) { hdWarm.key = key; hdWarm.i = 0; }
    const fr = Object.keys(HD_FRAMES);
    if (hdWarm.i < fr.length * 2) { const i = hdWarm.i++; hdPersonFrame(sp, fr[i % fr.length], i >= fr.length); return; }
    const n = NPCs.here().find(n => !n.hidden && !n.def.human && HD_NPC[n.def.sprite] && !HD_CACHE.has(`n|${n.def.sprite}|1|${npcWearing(n.id) || ''}|0`));
    if (n) { hdNpcFrame(n.def.sprite, 1, npcWearing(n.id)); return; }
    // then the remastered things here, nearest first, before they come into view
    const a = G.area;
    if (hdWarm.area !== a) { hdWarm.area = a; const p = G.player; hdWarm.todo = [...new Set(a.ents.filter(e => e.frame && HD_SPR[e.frame]).sort((q, r) => Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(r.x - p.x, r.y - p.y)).map(e => e.frame))]; }
    const nm = hdWarm.todo && hdWarm.todo.shift();
    if (nm) hdNamed(nm);
}
