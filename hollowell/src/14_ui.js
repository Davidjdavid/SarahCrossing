/* What's drawn over the world: the dialogue box, the HUD, toasts, banners and the fade. Every panel wears
   the same stitched look: cream cloth, a dark edge and a running stitch just inside it. */

function stitchedBox(x, y, w, h, opts = {}) {
    const fillC = opts.fill || '#fbf3df', edge = opts.edge || PAL.ink, stitch = opts.stitch || '#c0505a';
    Gfx.rect(x + 1, y, w - 2, h, edge); Gfx.rect(x, y + 1, w, h - 2, edge);
    Gfx.rect(x + 1, y + 1, w - 2, h - 2, fillC);
    /* shading at the bottom */
    Gfx.rect(x + 1, y + h - 3, w - 2, 2, opts.shadow || '#e9dcbc');
    /* the running stitch */
    /* (not along the top and bottom of a box too short to keep it clear of its line of words) */
    if (h >= 18) for (let i = x + 4; i < x + w - 4; i += 4) { Gfx.rect(i, y + 3, 2, 1, stitch); Gfx.rect(i, y + h - 4, 2, 1, stitch); }
    for (let j = y + 5; j < y + h - 5; j += 4) { Gfx.rect(x + 3, j, 1, 2, stitch); Gfx.rect(x + w - 4, j, 1, 2, stitch); }
}

const VOICES = {};       /* speaker -> blip pitch */
/* the Houses' bosses and mini-bosses (by type or kind), for whatever needs to keep them in view */
const BOSS_KINDS = new Set(['housekeeper', 'monger', 'glazer', 'kilnwyrm', 'snapjaw', 'grindle', 'clangor', 'tollgrim', 'matron', 'mothersloth',
    'captain', 'greatmarionette', 'cog', 'tangle', 'shuttle', 'weaver', 'pile']);
function isBoss(e) { return !!(e && (e.boss || BOSS_KINDS.has(e.type) || BOSS_KINDS.has(e.kind) || (ENEMY[e.type] && ENEMY[e.type].boss))); }
/* a speaker's name tag in their colour, lightened until the dark letters on it read easily (crimson, brick, brown) */
function luminance(h) { return hexRGB(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0); }
function contrast(a, b) { const A = luminance(a), B = luminance(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }
function tagFill(col) { let c = col; for (let i = 0; i < 10 && contrast(c, PAL.ink) < 4.5; i++) c = shade(c, 0.1); return c; }

/* ---------------- what a panel mustn't hide ---------------- */
/* a thing's box in the world (x0, y0, x1, y1): roughly what's drawn of it. A focus can also be a tile ([x, y, how tall])
   or a box ({ x0, y0, x1, y1 }). The big ones drawn about their middle, not standing on their feet, say so here */
const VIEW_BOX = {
    tangle: e => { const L = Math.round(e.lift || 0); return [e.x - 16, e.y - 18 - L, e.x + 32, e.y + 30]; },
    weaver: e => { const z = Math.round(e.z || 0); return [e.x - 26, e.y - z - 24, e.x + 26, e.y - z + 14]; },
    hoop: e => [e.x, e.y, e.x + 32, e.y + 36],
    /* (Mother Sloth: her bed and her, drawn round her home tile) */
    mothersloth: e => e.hx === undefined ? null : [e.hx * T - 40, e.hy * T - 30, e.hx * T + 56, e.hy * T + 30],
    /* (the great marionette stands on its two feet and rises 74 pixels over them) */
    greatmarionette: e => { const f = e.feet; if (!f || !f.length) return null; const xs = f.map(q => q[0] * T), y = Math.max(...f.map(q => q[1])) * T; return [Math.min(...xs) - 8, y - 76, Math.max(...xs) + 24, y + 16]; },
};
function viewBox(e) {
    if (!e) return null;
    if (Array.isArray(e)) return [e[0] * T, e[1] * T + 16 - (e[2] || 20), e[0] * T + 16, e[1] * T + 16];
    if (e.x0 !== undefined) return [e.x0, e.y0, e.x1, e.y1];
    const f = VIEW_BOX[e.kind] || VIEW_BOX[e.type], fb = f && f(e);
    if (fb) return fb;
    if (e === G.player) return [e.x - 7, e.y - 22, e.x + 7, e.y + 2];
    if (e.isGrid) {
        const w = T * (e.footW || 1), h = e.tall || (e.kind === 'npc' || e.person ? 26 : e.im ? Math.max(16, e.im.height) : 16);
        return [e.px, e.py + 16 - h, e.px + w, e.py + 16];
    }
    if (e.im && !e.isWalker) return [e.x, e.y, e.x + e.im.width, e.y + e.im.height];
    const D = ENEMY[e.type] || {}, r = D.r || e.r || 8, tall = D.tall || e.tall || 28;
    return [e.x - r - 2, e.y - tall - 6, e.x + r + 2, e.y + 2];
}
/* how much of what matters (items: [x0, y0, x1, y1, weight] in the world) some panels (boxes on the screen) would hide
   with the camera at (cx, cy): each thing's share under a panel or off the screen, squared (a little off the top of a
   boss is nothing beside Wren gone under the box; plain, as a share, for whether she's under something), by how much it
   matters */
function hiddenBy(items, rects, cx, cy, plain = false) {
    let s = 0;
    for (const [x0, y0, x1, y1, w] of items) {
        const X0 = x0 - cx, Y0 = y0 - cy, X1 = x1 - cx, Y1 = y1 - cy, area = Math.max(1, (X1 - X0) * (Y1 - Y0));
        const sx0 = Math.max(0, X0), sy0 = Math.max(0, Y0), sx1 = Math.min(W, X1), sy1 = Math.min(H, Y1);
        const on = Math.max(0, sx1 - sx0) * Math.max(0, sy1 - sy0);
        let under = 0;
        for (const r of rects) under += Math.max(0, Math.min(sx1, r[2]) - Math.max(sx0, r[0])) * Math.max(0, Math.min(sy1, r[3]) - Math.max(sy0, r[1]));
        const f = Math.min(1, (area - on + under) / area);
        s += w * (plain ? f : f * f);
    }
    return s;
}

/* the box's lines in pages of three. Every place a page could end is weighed: best where a sentence ends (inside a
   quotation a little less, so "There," she murmurs. "Nowhere left. Nowhere but bed." keeps together), then at a
   semicolon, colon or dash, then a comma, worst in the middle of a phrase ("whatever's in its / way"); a page of one
   line costs too, a lone fragment more, and most of all one that's only the tail end of a sentence ("thread."); and
   every page costs (less than splitting a sentence that could have had a page to itself), so a line takes as few
   pages as read well */
const PAGE_COST = { page: 10, end: 0, quote: 2, semi: 14, comma: 16, none: 30, one: 6, fragment: 16, stub: 60 };
function paginate(text, w, n = 3) {
    const lines = Font.wrap(text, w);
    if (lines.length <= n || text.includes('\n')) { const out = []; for (let i = 0; i < lines.length; i += n) out.push(lines.slice(i, i + n)); return out; }
    const C = PAGE_COST, words = text.split(' '), m = words.length, brk = [C.end];
    let q = 0;
    for (const word of words) {
        const wd = stripMarkup(word);
        q += (wd.match(/"/g) || []).length;
        const end = /[.!?\u2026]["')\]]*$/.test(wd) && !/^(Mr|Mrs|Dr|St)\.$/.test(wd);
        brk.push(end ? (q % 2 ? C.quote : C.end) : /[;:\u2014]["')\]]*$/.test(wd) ? C.semi : /,["')\]]*$/.test(wd) ? C.comma : C.none);
    }
    brk[m] = C.end;
    /* (best[j]: the least it costs to lay out the first j words; from[j]: where the last of those pages began. A page's
       lines are counted as Font.wrap counts them, a word at a time) */
    const best = [0], from = [0], ww = words.map(wd => Font.width(wd)), sp = Font.charW(' ') + 1;
    for (let j = 1; j <= m; j++) best[j] = Infinity;
    for (let i = 0; i < m; i++) {
        if (best[i] === Infinity) continue;
        let L = 1, lw = 0;
        for (let j = i + 1; j <= m; j++) {
            const k = ww[j - 1];
            if (j === i + 1) lw = k; else if (lw + sp + k > w) { L++; lw = k; } else lw += sp + k;
            if (L > n) break;
            const one = L > 1 ? 0 : brk[i] > C.quote ? C.stub : brk[j] > C.quote ? C.fragment : C.one;
            const c = best[i] + C.page + brk[j] + one;
            if (c <= best[j]) { best[j] = c; from[j] = i; }     /* (a tie: the fuller pages first) */
        }
    }
    const pages = [];
    for (let j = m; j > 0; j = from[j]) pages.unshift(words.slice(from[j], j).join(' '));
    /* (and never more than n lines, whatever a stray double space did to the count) */
    return pages.flatMap(p => { const L = Font.wrap(p, w), out = []; for (let i = 0; i < L.length; i += n) out.push(L.slice(i, i + n)); return out; });
}

/* a speaker's portrait sits in the box, at one end, the words beside it (src/35b_portraits.js) */
const FACE_BOX = 34, FACE_GAP = 36;
const Dialog = {
    active: false, who: null, pages: [], page: 0, shown: 0, choices: null, sel: 0, picked: -1, opts: {}, lean: 0,
    open(who, text, opts = {}) {
        /* (whoever spoke the line before, if it was someone else: the box keeps clear of them too, see items) */
        if (this.who && this.who !== who) this.prevWho = this.who;
        this.active = true; this.who = who; this.opts = opts;
        /* (a line can say how it's said, "{happy}...": read off before anything else sees it) */
        const [expr, rest] = exprOf(String(text));
        this.expr = expr;
        this.face = !opts.noFace && Portraits.has(who) ? who : null;
        this.side = this.face ? this.chooseSide(who) : null;
        this.choices = opts.choices || null;
        const words = Story.fill(rest);
        this.pages = paginate(words, this.face ? 282 - FACE_GAP : 282, 3);
        if (this.choices) this.fitChoices(words.includes('\n'));
        const at = this.place(opts);
        this.top = at.top; this.lean = at.lean; this.leanAt = G.map && [G.map, Cam.room];
        if (this.choices && !this.inside) this.choiceLeft = this.choiceEnd(opts, at);
        this.page = 0; this.shown = 0; this.sel = 0; this.picked = -1;
        this.t = 0;
        /* (notices and the place's name wait till the scene's over) */
        UI.sceneHold = true;
    },
    /* which end of the box the portrait goes: the speaker's side of the screen against whoever they're talking to
       (Wren; or, when Wren speaks, whoever spoke to her last); not clear (nobody about, or one above the other): the
       side the line before had, when it was just now, or else the left */
    chooseSide(who) {
        const p = G.player, a = G.map;
        const keep = G.t - (this.closedAt || -99) <= 3 && this.lastSide ? this.lastSide : 'left';
        if (G.scene !== 'play' || !p || !a) return keep;
        /* (where on the screen someone stands: the one of that name nearest Wren) */
        const at = w => {
            if (w === 'wren') return G.hideWren || p.hidden ? null : p.x - Cam.x;
            let best = null, bd = Infinity;
            for (const e of a.ents) if (e.who === w && !e.hidden && e !== p) {
                const ex = e.isGrid ? e.px + 8 : e.x, d = Math.abs(ex - p.x) + Math.abs((e.isGrid ? e.py + 8 : e.y) - p.y);
                if (d < bd) { bd = d; best = ex; }
            }
            return best === null ? null : best - Cam.x;
        };
        const sx = at(who);
        if (sx === null || sx < -8 || sx > W + 8) return keep;
        const other = who === 'wren' ? (this.lastWho && this.lastWho !== 'wren' ? at(this.lastWho) : null) : at('wren');
        if (other !== null && Math.abs(sx - other) >= 6) return sx < other ? 'left' : 'right';
        if (Math.abs(sx - W / 2) >= 24) return sx < W / 2 ? 'left' : 'right';
        return keep;
    },
    pageLen() { return this.pages[this.page].reduce((n, l) => n + stripMarkup(l).length, 0); },
    /* what matters on screen while a line's up: [x0, y0, x1, y1, weight] in the world. Wren counts (double while she's
       the one speaking, a little more while she spoke just before), whoever's speaking double, whoever spoke just before
       a little less, a boss or mini-boss double, and whatever the scene points at (opts.focus: a tile [x, y, tall], a
       thing, a box, or a list of them) treble. For a notice or the place's name (more), the creatures and people about
       count a little too. Only what's in the room on screen: what's in another can't be shown or hidden */
    items(opts = {}, more = false) {
        const p = G.player, a = G.map, out = [];
        if (!p || !a) return out;
        const room = Cam.room, multi = a.rooms.length > 1, seen = new Set();
        const add = (e, w) => {
            const b = viewBox(e);
            if (!b || (multi && room && a.roomAt(tileOf((b[0] + b[2]) / 2), tileOf(b[3] - 1)) !== room)) return;
            out.push([b[0], b[1], b[2], b[3], w]);
        };
        const talk = this.active, prev = talk && this.prevWho !== this.who && G.t - (this.closedAt || -999) <= 120 ? this.prevWho : null;
        if (!G.hideWren && !p.hidden) add(p, talk && this.who === 'wren' ? 2 : prev === 'wren' ? 1.5 : 1);
        const find = who => a.ents.find(e => e.who === who && !e.hidden && !e.removed && e !== p);
        if (talk && this.who && this.who !== 'wren') { const sp = find(this.who); if (sp) { add(sp, 2); seen.add(sp); } }
        if (prev && prev !== 'wren') { const pv = find(prev); if (pv && !seen.has(pv)) { add(pv, 1.5); seen.add(pv); } }
        for (const e of (a.walkers || []).concat(a.ents)) {
            if (seen.has(e) || e === p || e.hidden || e.removed || e.alive === false) continue;
            seen.add(e);
            if (isBoss(e)) add(e, 2);
            else if (more && (e.isWalker || (e.kind === 'npc' && e.who))) add(e, 0.5);
        }
        const f = opts.focus;
        for (const x of !f ? [] : Array.isArray(f) && typeof f[0] !== 'number' ? f : [f]) add(x, 3);
        return out;
    },
    /* the panels the box makes at the top or the bottom: the box, and the speaker's name tag over it */
    rects(top = this.top) {
        const x = 8, w = 304, h = 44, y = top ? 18 : H - h - 6, out = [[x, y, x + w, y + h]];
        if (this.who) { const tw = Font.width(Story.name(this.who)) + 12, nx = this.face && this.side === 'right' ? x + w - 6 - tw : x + 6; out.push([nx, y - 10, nx + tw, y + 5]); }
        return out;
    },
    /* the box goes top or bottom, and in a scene the camera may lean up or down for it (UI.lean): whatever hides least of
       what the line is about (items), so Wren and the line's subject are both clear of the box where they can be. A scene's
       exchange keeps its side and its lean unless another is clearly better; all else equal, the bottom and no lean */
    place(opts = {}) {
        const p = G.player, a = G.map;
        if (G.scene !== 'play' || !p || !a) return { top: false, lean: 0 };
        const items = this.items(opts), recent = G.t - (this.closedAt || -999) <= 120, was = recent && this.leanHere() ? this.lean || 0 : 0;
        const base = UI.camBaseY(), range = this.canLean(opts) ? UI.leanRange(base) : null;
        let best = null;
        for (const top of [false, true]) {
            const rs = this.rects(top), [lo, hi] = range ? range[top ? 1 : 0] : [0, 0];
            for (let dy = lo; dy <= hi; dy += 2) {
                let c = hiddenBy(items, rs, Cam.x, base + dy) + 0.004 * Math.abs(dy) + 0.006 * Math.abs(dy - was);
                c += recent ? (top !== !!this.lastTop ? (Script.blocking() ? 0.35 : 0.05) : 0) : (top ? 0.01 : 0);
                if (!best || c < best.c - 1e-9) best = { c, top, lean: dy };
            }
        }
        return best;
    },
    chooseTop(opts = {}) { return this.place(opts).top; },
    /* (the lean the last line asked for holds in the room it was asked for, not one Wren's been taken on to) */
    leanHere() { return !!this.leanAt && this.leanAt[0] === G.map && this.leanAt[1] === Cam.room; },
    /* (a scene's line may lean the camera, a scene's look too; not a line said in passing, nor a look into another room) */
    canLean(opts) { return Script.blocking() && !opts.noLean && !(Cam.look && Cam.look.free) && !Cam.busy && !UI.fade && !UI.fadeA && !G.credits; },
    /* the choices sit inside the box at its right when the question leaves room beside them: its last page wrapped a
       little narrower if that keeps it to three lines; else they go outside the box (choiceEnd) */
    fitChoices(raw) {
        const c = this.choices, cw = Math.max(...c.map(s => Font.width(s))) + 20;
        const right = !!this.face && this.side === 'right', tx = 9 + (this.face && !right ? FACE_GAP : 0), room = 304 - 6 - (right ? FACE_GAP : 0);
        const last = this.pages.length - 1, L = this.pages[last], tw = room - cw - 8 - tx;
        this.inside = false;
        if (c.length > 3 || tw < 60) return;
        if (Math.max(...L.map(l => Font.width(l))) <= tw) { this.inside = true; return; }
        if (raw) return;
        /* (each sentence on lines of its own when they fit, so a short question isn't split: "Tie / it?") */
        const s = L.join(' '), bySent = (s.match(/[^.!?]+[.!?]+["')]*\s*/g) || [s]).flatMap(t => Font.wrap(t.trim(), tw)), R = bySent.length <= 3 ? bySent : Font.wrap(s, tw);
        if (R.length <= 3 && R.join(' ') === s) { this.pages[last] = R; this.inside = true; }
    },
    /* outside the box, the choices sit just above it (below it when it's at the top), at whichever end hides less: never
       the end with the speaker's name tag */
    choiceRect(top, left) {
        const cw = Math.max(...this.choices.map(c => Font.width(c))) + 20, chh = this.choices.length * 11 + 8, y = top ? 18 : H - 50;
        const cx = left ? 12 : 8 + 304 - cw - 4, cy = top ? y + 44 + 2 : y - chh - 2;
        return [cx, cy, cx + cw, cy + chh];
    },
    choiceEnd(opts, at) {
        if (this.who) return !!this.face && this.side === 'right';
        const items = this.items(opts), cy = UI.camBaseY() + at.lean;
        return hiddenBy(items, [this.choiceRect(at.top, true)], Cam.x, cy) + 0.01 < hiddenBy(items, [this.choiceRect(at.top, false)], Cam.x, cy);
    },
    /* every panel the box has up now (for whatever else keeps clear of it: words floating in the world) */
    panels() {
        const out = this.rects();
        if (this.choices && !this.inside && this.page === this.pages.length - 1 && this.shown >= this.pageLen()) out.push(this.choiceRect(!!this.top, !!this.choiceLeft));
        return out;
    },
    update() {
        if (!this.active) return;
        this.t++;
        const len = this.pageLen();
        const fast = Input.down('act') || Input.down('atk');
        if (this.shown < len) {
            const sp = Settings.textSpeed;
            this.shown = Math.min(len, this.shown + (fast && this.t > 4 ? 3 : sp));
            if (Math.floor(this.shown) % 3 === 0) Sfx.play(this.who && VOICES[this.who] === 'low' ? 'blipLow' : 'blip');
            if (Input.pressed('act') && this.t > 3) this.shown = len;
            return;
        }
        const last = this.page === this.pages.length - 1;
        if (last && this.choices) {
            if (Input.pressed('up')) { this.sel = (this.sel + this.choices.length - 1) % this.choices.length; Sfx.play('menu'); }
            if (Input.pressed('down')) { this.sel = (this.sel + 1) % this.choices.length; Sfx.play('menu'); }
            if (Input.pressed('act')) { this.picked = this.sel; this.close(); Sfx.play('select'); }
            return;
        }
        if (Input.pressed('act') || Input.pressed('atk')) {
            if (last) this.close(); else { this.page++; this.shown = 0; this.t = 0; }
        }
    },
    close() { this.active = false; this.closedAt = G.t; this.lastTop = this.top; if (this.face) { this.lastWho = this.face; this.lastSide = this.side; } Input.swallow(); },
    /* the portrait, in a little frame in the speaker's colour: the mouth going while the words come out, a blink now
       and then (each speaker on a clock of their own) */
    drawFace(fx, fy) {
        const fill = mix(tagFill(SPEAKER_COL[this.face] || '#f0c070'), '#fbf3df', 0.45);
        Gfx.rect(fx + 1, fy, FACE_BOX - 2, FACE_BOX, PAL.ink); Gfx.rect(fx, fy + 1, FACE_BOX, FACE_BOX - 2, PAL.ink);
        Gfx.rect(fx + 1, fy + 1, FACE_BOX - 2, FACE_BOX - 2, fill);
        Gfx.rect(fx + 1, fy + FACE_BOX - 9, FACE_BOX - 2, 8, shade(fill, -0.08));
        const talking = this.shown < this.pageLen() && Math.floor(this.t / 5) % 2 === 0;
        let ph = 0; for (const ch of this.face) ph = (ph * 31 + ch.charCodeAt(0)) % 997;
        const b = (G.t + ph * 7) % 211, blink = b < 6 || (ph % 3 === 0 && b >= 14 && b < 19);
        Gfx.img(Portraits.get(this.face, this.expr, talking, blink), fx + 1, fy + 1);
    },
    draw() {
        if (!this.active) return;
        const top = !!this.top;
        const x = 8, w = 304, h = 44, y = top ? 18 : H - h - 6;
        stitchedBox(x, y, w, h);
        /* (the portrait at one end, the words beside it) */
        const face = !!this.face, left = face && this.side !== 'right', right = face && !left;
        if (face) this.drawFace(left ? x + 5 : x + w - 5 - FACE_BOX, y + 5);
        const tx = x + 9 + (left ? FACE_GAP : 0);
        let n = Math.floor(this.shown);
        const lines = this.pages[this.page] || [];
        lines.forEach((l, i) => {
            const len = stripMarkup(l).length;
            Font.draw(l, tx, y + 7 + i * 10, PAL.ink, Math.max(0, n));
            n -= len;
        });
        if (this.who) {
            const name = Story.name(this.who);
            const tw = Font.width(name) + 12;
            const ty = y - 10, nx = right ? x + w - 6 - tw : x + 6;
            const fill = tagFill(SPEAKER_COL[this.who] || '#f0c070');
            stitchedBox(nx, ty, tw, 15, { fill, stitch: '#ffffff', shadow: shade(fill, -0.15) });
            Font.draw(name, nx + 6, ty + 4, PAL.ink);
        }
        const done = this.shown >= this.pageLen();
        const last = this.page === this.pages.length - 1;
        const room = w - 6 - (right ? FACE_GAP : 0);
        if (done && last && this.choices) {
            const cw = Math.max(...this.choices.map(c => Font.width(c))) + 20, chh = this.choices.length * 11 + 8;
            /* inside the box, at its right (short of a portrait there), when the question leaves room for them (see
               fitChoices: so the scene isn't covered); else just outside it, at the end that hides less (choiceEnd) */
            let cx, cy;
            if (this.inside) { cx = x + room - cw; cy = y + Math.round((h - chh) / 2); Gfx.rect(cx - 4, y + 5, 1, h - 10, '#e3d3ae'); }
            else { [cx, cy] = this.choiceRect(top, !!this.choiceLeft); stitchedBox(cx, cy, cw, chh); }
            this.choices.forEach((c, i) => {
                if (i === this.sel) Font.draw('\x02', cx + 5, cy + 5 + i * 11, PAL.red2);
                Font.draw(c, cx + 12, cy + 5 + i * 11, i === this.sel ? PAL.ink : PAL.grey3);
            });
        } else if (done && (G.t >> 4) % 2) {
            const ax = x + room - 6;
            Gfx.rect(ax, y + h - 9, 5, 1, PAL.red2); Gfx.rect(ax + 1, y + h - 8, 3, 1, PAL.red2); Gfx.rect(ax + 2, y + h - 7, 1, 1, PAL.red2);
        }
    },
};
const SPEAKER_COL = {};
/* a scene that opens as Wren comes in at a door, with what it's about at the far end of the room (a boss waiting): she
   walks a tile or two on in first, where the way's clear, so the box can keep clear of her and of that at once */
function* stepIn(n = 2) {
    const p = G.player, a = G.map, r = Cam.room;
    if (!p || !a || !r || p.state !== 'normal') return;
    /* (only just in at a door: by the room's edge, walking away from it) */
    const d = p.ty >= r.y + r.h - 2 ? UP : p.ty <= r.y + 1 ? DOWN : p.tx <= r.x + 1 ? RIGHT : p.tx >= r.x + r.w - 2 ? LEFT : -1;
    if (d < 0) return;
    const free = (x, y) => { const k = a.kind(x, y); return a.roomAt(x, y) === r && !k.solid && !k.pit && !k.deep && !k.hurt && !a.at(x, y) && !a.walkers.some(m => m.alive !== false && m.onTile && m.onTile(x, y)); };
    /* (a spot with nothing just before or behind it, so she neither hides a thing nor stands hidden by one, a few steps off) */
    for (const [ahead, side] of [[n, 0], [n, -1], [n, 1], [n - 1, 0], [n, -2], [n, 2], [n - 1, -1], [n - 1, 1]]) {
        const x = p.tx + DX[d] * ahead + (DX[d] ? 0 : side), y = p.ty + DY[d] * ahead + (DX[d] ? side : 0);
        if (ahead <= 0 || !free(x, y) || a.at(x, y - 1) || a.at(x, y + 1)) continue;
        const path = critterPath(a, p.tx, p.ty, x, y), end = path[path.length - 1];
        if (!end || end[0] !== x || end[1] !== y || path.length > ahead + Math.abs(side) + 2) continue;
        for (const [px, py] of path) yield* walkStraight(p, px, py);
        p.dir = d;
        return;
    }
}

/* a notice's words in lines: as Font.wrap, but a short bracket, "(2 of 6.)", isn't broken over two lines */
function wrapKeep(s, w) {
    if (s.includes('\n')) return Font.wrap(s, w);
    const words = s.split(' '), toks = [];
    for (let i = 0; i < words.length; i++) {
        let tok = words[i];
        if (/^\(/.test(tok) && !/\)/.test(tok)) for (let k = i + 1; k < words.length && k <= i + 3; k++) {
            if (!/\)/.test(words[k])) continue;
            const glued = words.slice(i, k + 1).join(' ');
            if (Font.width(glued) <= 60) { tok = glued; i = k; }
            break;
        }
        toks.push(tok);
    }
    const out = []; let line = '';
    for (const tk of toks) { const cand = line ? line + ' ' + tk : tk; if (line && Font.width(cand) > w) { out.push(line); line = tk; } else line = cand; }
    out.push(line);
    return out;
}

const UI = {
    fadeA: 0, fade: null, toasts: [], banner: null, menu: null,
    sceneHold: false, places: [], lean: { now: 0, want: 0, map: null, room: null },
    modal() { return Dialog.active || !!this.menu; },
    /* ---- notices ---- */
    /* a notice (s may be { s, focus }: one about something keeps clear of it). Two show at a time at most, the rest
       waiting their turn; none while a scene's words are up (they wait till it's over); each on the side, top or bottom,
       where it hides least (placeNotice); and one about a place Wren has left goes with it */
    toast(s, dur = 120, opts = {}) {
        if (s && typeof s === 'object') { opts = s; s = s.s; }
        s = Story.fill(s); if (this.toasts.some(t => t.s === s)) return;
        this.toasts.push({ s, t: 0, dur, focus: opts.focus || null, area: G.map ? G.map.id : null, born: G.t, wait: true });
        this.showNotices();
    },
    /* (a scene's words up, or the rest of that scene still going: notices and the place's name wait) */
    held() { return Dialog.active || (this.sceneHold && Script.blocking()); },
    showNotices() {
        if (this.held()) return;
        let n = this.toasts.filter(t => !t.wait).length;
        for (const t of this.toasts) if (t.wait && n < 2) { if (!this.placeNotice(t)) break; t.wait = false; n++; }
    },
    measure(t) {
        if (!t.lines) { t.lines = Font.width(t.s) > W - 40 ? wrapKeep(t.s, W - 40) : [t.s]; t.w = Math.max(...t.lines.map(l => Font.width(l))) + 16; t.h = 9 + t.lines.length * 10; }
        return t;
    },
    /* where a notice sits on a side: under the ones before it there, stacked from the edge (the top's from under the HUD) */
    noticeRect(t, low) {
        let y = 22, yl = H - 6;
        for (const q of this.toasts) { if (q === t) break; if (!q.wait && !!q.low === low) { this.measure(q); if (low) yl -= q.h + 2; else y += q.h + 2; } }
        this.measure(t);
        const x = Math.round((W - t.w) / 2);
        return low ? [x, yl - t.h, x + t.w, yl] : [x, y, x + t.w, y + t.h];
    },
    /* what a notice would hide on a side (a little more on the side the place's name is up, which would have to make way;
       all else equal, the top, and the side with notices up already) */
    noticeCost(t, low, items) {
        const b = this.banner && !this.banner.wait ? this.banner : null;
        return hiddenBy(items, [this.noticeRect(t, low)], Cam.x, this.camPlanY()) + (b && !!b.low === low ? 0.3 : 0) + (low ? 0.02 : 0)
            - (this.toasts.some(q => q !== t && !q.wait && !!q.low === low) ? 0.03 : 0);
    },
    /* (false: it waits a moment, for the place's name on its side to have been read) */
    placeNotice(t) {
        let low = false;
        if (G.scene === 'play' && G.map && G.player) { const items = Dialog.items({ focus: t.focus }, true); low = this.noticeCost(t, true, items) < this.noticeCost(t, false, items); }
        const b = this.banner && !this.banner.wait ? this.banner : null;
        if (b && !!b.low === low && b.t < 90) { b.until = 90; return false; }
        this.setSide(t, low);
        return true;
    },
    setSide(t, low) {
        t.low = low;
        /* (never one under the place's name on a side: the name gives way) */
        if (this.banner && !this.banner.wait && !!this.banner.low === low) this.banner = null;
    },
    /* every few frames: a notice Wren has walked in under moves to the other side, when that side's clearly better; the
       place's name, once it's been up a moment, just goes (it's been read), or else moves the same way */
    recheck() {
        const p = G.player;
        if (G.t % 3 || !p || !G.map || G.scene !== 'play' || G.hideWren || p.hidden) return;
        const wren = [viewBox(p).concat(1)], under = r => hiddenBy(wren, [r], Cam.x, Cam.y, true) > 0.35;
        for (const t of this.toasts) {
            if (t.wait || !under(this.noticeRect(t, !!t.low))) continue;
            const items = Dialog.items({ focus: t.focus }, true);
            if (this.noticeCost(t, !t.low, items) + 0.3 < this.noticeCost(t, !!t.low, items)) { this.setSide(t, !t.low); t.back = 6; }
        }
        const b = this.banner;
        if (b && !b.wait && b.t < 170 && under(this.bannerRect(b, !!b.low))) {
            const items = Dialog.items({}, true), free = !this.toasts.some(t => !t.wait && !!t.low === !b.low);
            if (b.t > 60 || !free) b.t = 194;
            else if (hiddenBy(items, [this.bannerRect(b, !b.low)], Cam.x, Cam.y) + 0.3 < hiddenBy(items, [this.bannerRect(b, !!b.low)], Cam.x, Cam.y)) { b.low = !b.low; b.back = 6; }
        }
    },
    /* is a notice or the place's name up at the top (the Needle's stitches in the HUD sit under them)? and over a spot? */
    topBusy() { return !this.held() && (this.toasts.some(t => !t.wait && !t.low) || !!(this.banner && !this.banner.wait && !this.banner.low)); },
    underTop(r) {
        if (!this.topBusy()) return false;
        const rs = this.toasts.filter(t => !t.wait && !t.low).map(t => this.noticeRect(t, false));
        if (this.banner && !this.banner.wait && !this.banner.low) rs.push(this.bannerRect(this.banner, false));
        return rs.some(q => q[0] < r[2] && r[0] < q[2] && q[1] < r[3] && r[1] < q[3]);
    },
    /* ---- the place's name ---- */
    /* shown coming into a place from outside it, not coming back out into it from somewhere inside it (out of a house into
       the town, out of a Little House onto the Making Floor). places: what Wren is inside of, the outermost first */
    showBanner(s, sub) {
        const a = G.map;
        if (a && a !== this.bannerMap) {
            const from = this.bannerName;
            this.bannerMap = a; this.bannerName = s;
            if (this.cameBack(s, from, a)) { this.banner = null; return; }
        } else this.bannerName = s;
        this.banner = { s, sub, t: 0, wait: true, waited: 0 };
        if (!this.held()) this.placeBanner();
    },
    cameBack(s, from, a) {
        const P = this.places;
        if (a.family === 'outdoor') { const back = P[0] === s; this.places = []; return back; }
        const i = P.lastIndexOf(s);
        if (i >= 0) { P.length = i; return true; }
        if (from) { P.push(from); if (P.length > 8) P.shift(); }
        return false;
    },
    /* top or bottom, where it hides least, on a side with no notices up (both taken: it waits for one, a little while) */
    placeBanner() {
        const b = this.banner;
        if (!b || !b.wait) return;
        const sides = [false, true].filter(lo => !this.toasts.some(t => !t.wait && !!t.low === lo));
        if (!sides.length) { if (++b.waited > 120) this.banner = null; return; }
        let low = sides[0];
        if (sides.length > 1 && G.scene === 'play' && G.map && G.player) {
            const items = Dialog.items({}, true), cy = this.camPlanY();
            low = hiddenBy(items, [this.bannerRect(b, true)], Cam.x, cy) + 0.02 < hiddenBy(items, [this.bannerRect(b, false)], Cam.x, cy);
        }
        b.low = low; b.wait = false;
    },
    bannerRect(b, low) {
        const w = Math.max(Font.width(b.s), b.sub ? Font.width(b.sub) : 0) + 30, h = b.sub ? 28 : 18, x = Math.round((W - w) / 2), y = low ? H - 24 - h : 30;
        return [x, y, x + w, y + h];
    },
    /* ---- the camera's lean ---- */
    /* a scene's line can have the camera stand a little higher or lower than it would (Dialog.place), and so can the
       Needle while it's choosing with Wren in a doorway at the screen's edge; it eases there and back, and never carries
       into another room. Past the room's edge it shows only dark (drawCurtain) */
    camBaseY() { const p = G.player, lk = Cam.look; return p ? Cam.base(lk ? { x: lk.x, y: lk.y + 6 } : p, null, lk && lk.free).y : Cam.y; },
    /* (where the camera's going: a notice is placed for that) */
    camPlanY() { const L = this.lean, ok = L.map === G.map && L.room === Cam.room; return Cam.y + Math.round(this.leanWanted()) - (ok ? Math.round(L.now) : 0); },
    /* how far the camera may lean from base, with the box at the bottom and at the top ([lo, hi] each, even, with 0): past
       the room's edge only as far as the box covers (with the box at the top, the strip over it would show: not at all) */
    leanRange(base) {
        const r = Cam.room;
        if (!r) return [[0, 0], [0, 0]];
        const ry0 = r.y * T, ry1 = (r.y + r.h) * T, up0 = Math.max(2, ry0 - base), dn0 = Math.max(2, base + H - ry1);
        const even = (lo, hi) => [Math.min(0, Math.ceil(Math.max(-48, lo) / 2) * 2), Math.max(0, Math.floor(Math.min(48, hi) / 2) * 2)];
        return [even(ry0 - base - up0, ry1 - base - H + Math.max(dn0, 50)), even(ry0 - base - up0, ry1 - base - H + dn0)];
    },
    leanWanted() {
        const p = G.player;
        if (p && p.pinned === 'needle' && !Script.blocking()) return this.needleLean(p);
        if ((Cam.look && Cam.look.free) || !(Dialog.active || Script.blocking()) || !Dialog.leanHere()) return 0;
        return Dialog.lean || 0;
    },
    needleLean(p) {
        const base = this.camBaseY(), head = p.y - 24 - base, feet = p.y + 3 - base;
        return head < 6 ? Math.max(-24, Math.floor((head - 6) / 2) * 2) : feet > H - 2 ? Math.min(24, Math.ceil((feet - H + 2) / 2) * 2) : 0;
    },
    /* while the camera leans past the room's edge: dark there, not the room next door */
    drawCurtain() {
        const L = this.lean, r = Cam.room;
        if (!L.now || !r || L.map !== G.map || L.room !== r) return;
        const y0 = Math.ceil(r.y * T - Cam.y), y1 = Math.floor((r.y + r.h) * T - Cam.y);
        if (y0 > 0) Gfx.rect(0, 0, W, y0, PAL.night);
        if (y1 < H) Gfx.rect(0, y1, W, H - y1, PAL.night);
    },
    update() {
        if (this.fade) {
            const f = this.fade; f.t++;
            this.fadeA = lerp(f.from, f.to, Math.min(1, f.t / f.dur));
            if (f.t >= f.dur) this.fade = null;
        }
        /* somewhere new: notices about the last place go (all but what was only just said, on the way out) */
        if (G.map !== this.noticeMap) { this.noticeMap = G.map; const id = G.map ? G.map.id : null; this.toasts = this.toasts.filter(t => t.area === id || G.t - t.born < 12); }
        /* a scene over: what it held back shows again, placed afresh (things have moved) */
        if (this.sceneHold && !Dialog.active && !Script.blocking()) {
            this.sceneHold = false;
            for (const t of this.toasts) if (!t.wait) { t.back = 8; this.placeNotice(t); }
            if (this.banner && !this.banner.wait) { this.banner.wait = true; this.banner.back = 8; }
        }
        /* (a scene that looks somewhere new: the last line's lean goes) */
        if (Cam.look !== this.lookSeen) { this.lookSeen = Cam.look; if (Cam.look) Dialog.lean = 0; }
        if (!this.held()) {
            this.recheck();
            for (const t of this.toasts) if (!t.wait) { t.t++; if (t.back > 0) t.back--; }
            this.toasts = this.toasts.filter(t => t.wait || t.t < t.dur);
            this.showNotices();
            const b = this.banner;
            if (b && b.wait) this.placeBanner();
            if (b && !b.wait) { b.t++; if (b.back > 0) b.back--; if (b.t > 200 || (b.until && b.t >= b.until)) this.banner = null; }
        }
        const L = this.lean, want = this.leanWanted();
        if (want && (L.map !== G.map || L.room !== Cam.room)) { L.now = 0; L.map = G.map; L.room = Cam.room; }
        L.want = want;
        if (Cam.busy || L.map !== G.map || L.room !== Cam.room) L.now = L.want = 0;
        else L.now = approach(L.now, L.want, Math.max(2, Math.abs(L.want - L.now) * 0.3));     /* (a quick glide: a few frames) */
    },
    drawHUD() {
        this.drawCurtain();
        if (G.hideHud) return;
        const p = G.player;
        /* when Wren (or a doorway) is up under the HUD, it steps back */
        const under = (p && (p.y - Cam.y) < 46) || (Dialog.active && Dialog.top) || this.hudCovers();
        this.hudA = approach(this.hudA === undefined ? 1 : this.hudA, under ? 0.35 : 1, 0.08);
        Gfx.alpha(this.hudA);
        this._hud(p);
        Gfx.alpha(1);
    },
    /* is anything that matters (a chest, a door, a plate, a person, a creature, a thing's home cross) under the HUD's
       corners? then the HUD steps back, as it does for Wren (looked at every few frames) */
    hudCovers() {
        if (G.t % 8 && this._hc !== undefined) return this._hc;
        let hit = false;
        const a = G.map;
        if (a && G.scene === 'play' && G.onScreen) {
            const n = Math.ceil(Inv.maxHp / 2), rows = n > 10 ? 2 : 1;
            const boxes = [[0, 0, 18 + 9 * Math.min(n, 10), 4 + 8 * rows], [W - 96, 0, W, Inv.equipped ? 32 : 16]];
            const over = (x0, y0, x1, y1) => boxes.some(b => x1 > b[0] + 1 && x0 < b[2] - 1 && y1 > b[1] + 1 && y0 < b[3] - 1);
            for (const e of G.onScreen) {
                if (e === G.player || e.hidden) continue;
                /* (scenery never moves the HUD; a set piece you can walk up to and read does: the stove's pan of milk) */
                if (e instanceof Prop) {
                    const im = e.im || (e.look && spr(e.look));
                    if (e.interact && im && over(e.x - Cam.x, e.y - Cam.y, e.x - Cam.x + im.width, e.y - Cam.y + im.height)) { hit = true; break; }
                    continue;
                }
                if (e.isGrid || e instanceof Door || e instanceof FloorThing) {
                    const x = (e.isGrid ? e.px : e.tx * T) - Cam.x, y = (e.isGrid ? e.py : e.ty * T) - Cam.y;
                    if (over(x, y, x + 16, y + 16)) { hit = true; break; }
                    if (e.ret && e.ret.area === a.id) { const mx = e.ret.mx * T - Cam.x, my = e.ret.my * T - Cam.y; if (over(mx, my, mx + 16, my + 16)) { hit = true; break; } }
                }
            }
            if (!hit) for (const e of a.walkers || []) { if (e.alive === false || e.hidden) continue; const x = e.x - Cam.x, y = e.y - Cam.y; if (over(x - 8, y - 18, x + 8, y)) { hit = true; break; } }
        }
        return this._hc = hit;
    },
    _hud(p) {
        if (G.trial) Trials.draw();
        /* Wren's thread: a little red spool (until it's cut); and her hearts (which, once it's cut, come undone and
           drift away while she's told so) */
        const leaving = G.heartsLeaving > 0 ? G.heartsLeaving : 0;
        if (!Progress.flag('cut_self') || G.keepHearts) {
            const k = leaving ? leaving / 120 : 1, a0 = Gfx.ctx && Gfx.ctx.globalAlpha !== undefined ? Gfx.ctx.globalAlpha : 1;
            if (leaving) Gfx.alpha(a0 * k);
            const sp = (p && (p.state === 'flight')) ? Math.floor(G.t / 3) % 3 : 0;
            Gfx.img(spr('hud_spool' + sp), 4, 3 - Math.round((1 - k) * 10));
            const n = Math.ceil(Inv.maxHp / 2);
            for (let i = 0; i < n; i++) {
                const hx = 16 + (i % 10) * 9 + (leaving ? Math.round(Math.sin(i * 1.7 + leaving / 9) * (1 - k) * 6) : 0);
                const hy = 3 + Math.floor(i / 10) * 8 - (leaving ? Math.round((1 - k) * (14 + (i * 7) % 11)) : 0);
                const v = Inv.hp - i * 2;
                Gfx.img(spr(v >= 2 ? 'hud_heart' : v === 1 ? 'hud_heart_half' : 'hud_heart_empty'), hx, hy);
            }
            if (leaving) Gfx.alpha(a0);
        }
        /* buttons */
        /* (the count right-aligned to the edge, however many) */
        const bs = String(Inv.buttons), bx = W - 5 - Font.width(bs);
        Gfx.img(spr('hud_button'), bx - 10, 4);
        hudText(bs, bx, 5);
        /* the tool in hand */
        const tool = Inv.equipped;
        if (tool) {
            stitchedBox(W - 58, 1, 20, 20, { fill: '#fbf3df' });
            const ic = spr('icon_' + tool); if (ic) Gfx.img(ic, W - 56, 3);
            /* the key (or button) that uses it, under the box (the gloves work through the action button) */
            /* (not under a notice at the top: it would only be drawn over) */
            const kl = keyLabel(tool === 'gloves' ? 'act' : 'tool'), kx = Math.round(W - 48 - Font.width(kl) / 2);
            if (!this.underTop([kx - 3, 22, kx + Font.width(kl) + 3, 32])) hudText(kl, kx, 23);
        }
        /* keys in a House */
        const area = G.map;
        /* (a House with no locks and no keys to find shows no key count) */
        if (area && area.def.house && area.hasKeys === undefined) area.hasKeys = area.ents.some(e => (e.kind === 'door' && e.type === 'lock') || (e.kind === 'chest' && e.item === 'key'));
        if (area && area.def.house && (area.hasKeys || Inv.keys(area.def.house) > 0)) {
            const k = Inv.keys(area.def.house);
            const kx = tool ? W - 84 : W - 62;
            Gfx.img(spr('key'), kx, 1);
            hudText('x' + k, kx + 12, 6);
            if (Inv.hasPattern(area.def.house)) Gfx.img(spr(patternIcon(area.def.house)), kx - 12, 6);
        }
    },
    draw() {
        /* the fade first: words said, and notices and banners shown, over a black screen are on it, not under it */
        if (this.fadeA > 0) { Gfx.alpha(this.fadeA); Gfx.rect(0, 0, W, H, PAL.night); Gfx.alpha(1); }
        const panels = [];
        if (!this.held()) {
            /* notices: the top ones stacked down from under the HUD, the low ones up from the bottom (a long one wraps) */
            let y = 22, yl = H - 6;
            for (const t of this.toasts) {
                if (t.wait) continue;
                this.measure(t);
                const a = (t.t < 8 ? t.t / 8 : t.t > t.dur - 10 ? (t.dur - t.t) / 10 : 1) * (t.back ? 1 - t.back / 8 : 1);
                const x = Math.round((W - t.w) / 2), ty = t.low ? (yl -= t.h + 2) + 2 : y;
                Gfx.alpha(a); stitchedBox(x, ty, t.w, t.h); t.lines.forEach((l, j) => Font.draw(l, x + 8, ty + 5 + j * 10, PAL.ink)); Gfx.alpha(1);
                panels.push([x, ty, x + t.w, ty + t.h]);
                if (!t.low) y += t.h + 2;
            }
            const b = this.banner;
            if (b && !b.wait) {
                const a = Math.min(b.t < 20 ? b.t / 20 : b.t > 170 ? (200 - b.t) / 30 : 1, b.until ? (b.until - b.t) / 12 : 1) * (b.back ? 1 - b.back / 8 : 1), [x, by, x1, by1] = this.bannerRect(b, b.low);
                Gfx.alpha(a);
                stitchedBox(x, by, x1 - x, by1 - by, { fill: '#f6e2b0', stitch: '#a8642e' });
                Font.center(b.s, W / 2, by + 5, PAL.ink);
                if (b.sub) Font.center(b.sub, W / 2, by + 16, PAL.grey3);
                Gfx.alpha(1);
                panels.push([x, by, x1, by1]);
            }
        }
        if (Dialog.active) panels.push(...Dialog.panels());
        /* words floating in the world: over everything in it and the notices, kept clear of them (src/10_fx.js) */
        Fx.drawText(Cam.x, Cam.y, panels);
        Dialog.draw();
        if (this.menu) this.menu.draw();
    },
};

/* a few words on the HUD over a soft dark backing, so they read on any floor (sand, snow, water, a bed) */
function hudText(s, x, y) {
    const w = Font.width(s);
    Gfx.alpha(Gfx.ctx && Gfx.ctx.globalAlpha !== undefined ? Gfx.ctx.globalAlpha * 0.55 : 0.55);
    Gfx.rect(x - 2, y - 1, w + 4, 10, PAL.ink); Gfx.rect(x - 3, y, w + 6, 8, PAL.ink);
    Gfx.alpha(UI.hudA === undefined ? 1 : UI.hudA);
    Font.draw(s, x, y, PAL.white, Infinity, PAL.ink);
}
function initUISprites() {
    defSym('hud_heart', ['.kk.', 'krrk', 'krwr', 'krrr', '.kRr', '..kR', '...k'], {}, { w: 'r' });
    defSprite('hud_heart_half', ['.kk.kk.', 'krrkxxk', 'krwrxxk', 'krrrxxk', '.kRrxk.', '..kRk..', '...k...'], { x: '#6a4a52' });
    defSym('hud_heart_empty', ['.kk.', 'kxxk', 'kxxx', 'kxxx', '.kxx', '..kx', '...k'], { x: '#6a4a52' });
    for (let i = 0; i < 3; i++) {
        const rows = ['kkkkkkkk', '.kUUUUk.', '.krrrrk.', '.kRrrRk.', '.krrrrk.', '.kRrrRk.', '.kUUUUk.', 'kkkkkkkk'];
        if (i === 1) rows[3] = '.krRrrk.'; if (i === 2) rows[4] = '.kRrRrk.';
        defSprite('hud_spool' + i, rows, { U: '#c9925a' });
    }
    defSprite('hud_button', ['..kkkk..', '.kyyyyk.', 'kyykkyyk', 'kyyyyyyk', 'kyykkyyk', 'kYyyyyYk', '.kYYYYk.', '..kkkk..'], { y: '#e8b04a', Y: '#a8742a' });
    defSprite('hud_pattern', ['kkkkkkkk', 'kaAaAaAk', 'kAaAaAak', 'kaAaAaAk', 'kAaAaAak', 'kkkkkkkk'], { a: '#6ab0e0', A: '#f7d64a' });
    /* each House's Pattern is cloth in its Maker's thread colour (the words say which: PATTERN_CLOTH) */
    for (const h in PATTERN_CLOTH) { const c = PATTERN_CLOTH[h][1]; defSprite('hud_pattern_' + h, ['kkkkkkkk', 'kaAaAaAk', 'kAaAaAak', 'kaAaAaAk', 'kAaAaAak', 'kkkkkkkk'], { a: c, A: h === 'belfry' || h === 'loom' ? '#5a4a6a' : '#f7d64a' }); }
}
const PATTERN_CLOTH = { tidy: ['teal', THREAD.ives], kiln: ['orange', THREAD.bram], mill: ['blue', THREAD.ambrose], belfry: ['gold', THREAD.tess],
    slumber: ['lavender', THREAD.mallow], marionette: ['crimson', THREAD.jory], spoolworks: ['brown', THREAD.guild], loom: ['white', THREAD.loom] };
function patternIcon(h) { return spr('hud_pattern_' + h) ? 'hud_pattern_' + h : 'hud_pattern'; }

/* the camera with its lean added (UI.lean); Cam.base: where it would stand without it */
{
    const target0 = Cam.target;
    Cam.base = function (p, room, free) { return target0.call(this, p, room, free); };
    Cam.target = function (p, room, free) {
        const t = target0.call(this, p, room, free), L = UI.lean;
        if (!free && L.now && L.map === G.map && (room || this.room) === L.room) t.y += Math.round(L.now);
        return t;
    };
}
