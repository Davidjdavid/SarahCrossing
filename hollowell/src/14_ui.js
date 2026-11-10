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

/* the box's lines in pages of three, a page ending where a sentence ends whenever it can: no page left holding the
   last word or two of a sentence ("thread."); a sentence too long for one page is split evenly (two and two, not
   three and one) */
function paginate(text, w, n = 3) {
    const lines = Font.wrap(text, w);
    if (lines.length <= n || text.includes('\n')) { const out = []; for (let i = 0; i < lines.length; i += n) out.push(lines.slice(i, i + n)); return out; }
    const sents = []; let cur = '';
    for (const wd of text.split(' ')) {
        cur = cur ? cur + ' ' + wd : wd;
        if (/[.!?\u2026]["')\]]*(\{\/\})?["')]*$/.test(wd) && !/^(Mr|Mrs|Dr|St)\.$/.test(wd)) { sents.push(cur); cur = ''; }
    }
    if (cur) sents.push(cur);
    const pages = []; let page = '';
    for (const s of sents) {
        const cand = page ? page + ' ' + s : s;
        if (Font.wrap(cand, w).length <= n) { page = cand; continue; }
        if (page) pages.push(page);
        page = s;
        let L = Font.wrap(page, w);
        while (L.length > n) { const m = L.length > 2 * n ? n : Math.ceil(L.length / 2); pages.push(L.slice(0, m).join(' ')); page = L.slice(m).join(' '); L = Font.wrap(page, w); }
    }
    if (page) pages.push(page);
    return pages.map(p => Font.wrap(p, w));
}

/* a speaker's portrait sits in the box, at one end, the words beside it (src/35b_portraits.js) */
const FACE_BOX = 34, FACE_GAP = 36;
const Dialog = {
    active: false, who: null, pages: [], page: 0, shown: 0, choices: null, sel: 0, picked: -1, opts: {},
    open(who, text, opts = {}) {
        this.active = true; this.who = who; this.opts = opts;
        /* (a line can say how it's said, "{happy}...": read off before anything else sees it) */
        const [expr, rest] = exprOf(String(text));
        this.expr = expr;
        this.face = !opts.noFace && Portraits.has(who) ? who : null;
        this.side = this.face ? this.chooseSide(who) : null;
        this.pages = paginate(Story.fill(rest), this.face ? 282 - FACE_GAP : 282, 3);
        this.top = this.chooseTop(opts);
        this.page = 0; this.shown = 0; this.choices = opts.choices || null; this.sel = 0; this.picked = -1;
        this.t = 0;
    },
    /* which end of the box the portrait goes: the speaker's side of the screen against whoever they're talking to
       (Wren; or, when Wren speaks, whoever spoke to her last); not clear (nobody about, or one above the other): the
       side the line before had, when it was just now, or else the left */
    chooseSide(who) {
        const p = G.player, a = G.map;
        const keep = G.t - (this.closedAt || -99) <= 3 && this.lastSide ? this.lastSide : 'left';
        if (G.scene !== 'play' || !p || !a) return keep;
        const at = w => {
            if (w === 'wren') return G.hideWren || p.hidden ? null : p.x - Cam.x;
            const e = a.ents.find(e => e.who === w && !e.hidden && e !== p);
            return e ? (e.isGrid ? e.px + 8 : e.x) - Cam.x : null;
        };
        const sx = at(who);
        if (sx === null || sx < -8 || sx > W + 8) return keep;
        const other = who === 'wren' ? (this.lastWho && this.lastWho !== 'wren' ? at(this.lastWho) : null) : at('wren');
        if (other !== null && Math.abs(sx - other) >= 6) return sx < other ? 'left' : 'right';
        if (Math.abs(sx - W / 2) >= 24) return sx < W / 2 ? 'left' : 'right';
        return keep;
    },
    pageLen() { return this.pages[this.page].reduce((n, l) => n + stripMarkup(l).length, 0); },
    /* top or bottom of the screen: the side that hides least of what the line is about. Wren counts, whoever is
       speaking counts double, a boss on screen double, and whatever the scene points at (opts.focus: a tile or a thing)
       treble; a tie keeps the side the last line had (so an exchange doesn't hop about), or else the bottom */
    chooseTop(opts) {
        const p = G.player, a = G.map;
        if (G.scene !== 'play' || !p || !a) return false;
        const cover = this.coverage(opts);
        const top = cover(9, 62), bottom = cover(H - 59, H - 6);
        if (Math.abs(top - bottom) < 0.05) return G.t - (this.closedAt || -99) <= 3 ? !!this.lastTop : false;
        return bottom > top;
    },
    /* how much of what matters on screen a strip of the screen (y0 to y1) would hide */
    coverage(opts = {}) {
        const p = G.player, a = G.map;
        if (!p || !a) return () => 0;
        const spans = [];
        const add = (feet, tall, wgt) => spans.push([feet - tall - Cam.y, feet + 2 - Cam.y, wgt]);
        const feet = e => e.isGrid ? e.py + 14 : e.y;
        if (!G.hideWren && !p.hidden) add(p.y, 22, 1);
        if (this.who) { const sp = a.ents.find(e => e.who === this.who && !e.hidden && e !== p); if (sp) add(feet(sp), 26, 2); }
        /* (a boss or mini-boss, whatever hits it has left) */
        for (const e of (a.walkers || []).concat(a.ents)) if (e.alive !== false && !e.hidden && e !== p && isBoss(e)) {
            const sx = (e.isGrid ? e.px + 8 * (e.footW || 1) : e.x) - Cam.x, tall = (ENEMY[e.type] && ENEMY[e.type].tall) || e.tall || 28;
            if (sx > -16 && sx < W + 16) add(feet(e), tall + 6, 2);
        }
        const f = opts.focus;
        if (f) { if (Array.isArray(f)) add(f[1] * T + 14, f[2] || 20, 3); else add(feet(f), f.tall || 24, 3); }
        return (y0, y1) => spans.reduce((s, [a0, a1, w]) => s + w * Math.max(0, Math.min(a1, y1) - Math.max(a0, y0)) / Math.max(1, a1 - a0), 0);
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
            /* inside the box, at its right (short of a portrait there), when the question leaves the room (so the scene
               isn't covered); else above the box, or (when the box is at the top of the screen) below it: always on screen */
            const used = Math.max(0, ...lines.map(l => Font.width(l))) + tx - x;
            const inside = this.choices.length <= 3 && used + cw + 8 <= room;
            const cx = inside ? x + room - cw : x + w - cw - 4, cy = inside ? y + Math.round((h - chh) / 2) : top ? y + h + 2 : y - chh - 2;
            if (inside) { Gfx.rect(cx - 4, y + 5, 1, h - 10, '#e3d3ae'); this.inside = true; }
            else stitchedBox(cx, cy, cw, chh);
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

const UI = {
    fadeA: 0, fade: null, toasts: [], banner: null, menu: null,
    modal() { return Dialog.active || !!this.menu; },
    toast(s, dur = 120) {
        s = Story.fill(s); if (this.toasts.some(t => t.s === s)) return;
        let low = false;
        if (G.scene === 'play' && G.map && G.player) {
            /* (where it would go at the top: under a banner and any notices already showing there) */
            const y0 = (this.banner ? (this.banner.sub ? 62 : 52) : 22) + this.toasts.filter(t => !t.low).reduce((n, t) => n + 11 + 10 * (t.lines ? t.lines.length : 1), 0);
            const c = Dialog.coverage(); low = c(y0 - 2, y0 + 22) > c(H - 40, H - 6) + 0.2;
        }
        this.toasts.push({ s, t: 0, dur, low });
    },
    showBanner(s, sub) { this.banner = { s, sub, t: 0 }; },
    update() {
        if (this.fade) {
            const f = this.fade; f.t++;
            this.fadeA = lerp(f.from, f.to, Math.min(1, f.t / f.dur));
            if (f.t >= f.dur) this.fade = null;
        }
        for (const t of this.toasts) t.t++;
        this.toasts = this.toasts.filter(t => t.t < t.dur);
        if (this.banner) { this.banner.t++; if (this.banner.t > 200) this.banner = null; }
    },
    drawHUD() {
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
                if (e === G.player || e.hidden || e instanceof Prop) continue;
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
            const kl = keyLabel(tool === 'gloves' ? 'act' : 'tool');
            hudText(kl, Math.round(W - 48 - Font.width(kl) / 2), 23);
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
        /* toasts */
        const ty0 = this.banner ? (this.banner.sub ? 62 : 52) : 22;
        let y = ty0, yl = Dialog.active && !Dialog.top ? H - 62 : H - 6;
        for (const t of this.toasts) {
            /* a long one wraps onto more lines */
            const lines = t.lines || (t.lines = Font.width(t.s) > W - 40 ? Font.wrap(t.s, W - 40) : [t.s]);
            const w = Math.max(...lines.map(l => Font.width(l))) + 16, x = (W - w) / 2, h = 9 + lines.length * 10;
            const a = t.t < 8 ? t.t / 8 : t.t > t.dur - 10 ? (t.dur - t.t) / 10 : 1;
            const ty = t.low ? (yl -= h + 2) + 2 : y;
            Gfx.alpha(a); stitchedBox(x, ty, w, h); lines.forEach((l, j) => Font.draw(l, x + 8, ty + 5 + j * 10, PAL.ink)); Gfx.alpha(1);
            if (!t.low) y += h + 2;
        }
        if (this.banner) {
            const b = this.banner, a = b.t < 20 ? b.t / 20 : b.t > 170 ? (200 - b.t) / 30 : 1;
            const w = Math.max(Font.width(b.s), b.sub ? Font.width(b.sub) : 0) + 30, x = (W - w) / 2, y = 30;
            Gfx.alpha(a);
            stitchedBox(x, y, w, b.sub ? 28 : 18, { fill: '#f6e2b0', stitch: '#a8642e' });
            Font.center(b.s, W / 2, y + 5, PAL.ink);
            if (b.sub) Font.center(b.sub, W / 2, y + 16, PAL.grey3);
            Gfx.alpha(1);
        }
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
