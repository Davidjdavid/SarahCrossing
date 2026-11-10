/* What's drawn over the world: the dialogue box, the HUD, toasts, banners and the fade. Every panel wears
   the same stitched look: cream cloth, a dark edge and a running stitch just inside it. */

function stitchedBox(x, y, w, h, opts = {}) {
    const fillC = opts.fill || '#fbf3df', edge = opts.edge || PAL.ink, stitch = opts.stitch || '#c0505a';
    Gfx.rect(x + 1, y, w - 2, h, edge); Gfx.rect(x, y + 1, w, h - 2, edge);
    Gfx.rect(x + 1, y + 1, w - 2, h - 2, fillC);
    /* shading at the bottom */
    Gfx.rect(x + 1, y + h - 3, w - 2, 2, opts.shadow || '#e9dcbc');
    /* the running stitch */
    for (let i = x + 4; i < x + w - 4; i += 4) { Gfx.rect(i, y + 3, 2, 1, stitch); Gfx.rect(i, y + h - 4, 2, 1, stitch); }
    for (let j = y + 5; j < y + h - 5; j += 4) { Gfx.rect(x + 3, j, 1, 2, stitch); Gfx.rect(x + w - 4, j, 1, 2, stitch); }
}

const VOICES = {};       /* speaker -> blip pitch */

const Dialog = {
    active: false, who: null, pages: [], page: 0, shown: 0, choices: null, sel: 0, picked: -1, opts: {},
    open(who, text, opts = {}) {
        this.active = true; this.who = who; this.opts = opts;
        const lines = Font.wrap(Story.fill(text), 282);
        this.pages = [];
        for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
        this.page = 0; this.shown = 0; this.choices = opts.choices || null; this.sel = 0; this.picked = -1;
        this.t = 0;
    },
    pageLen() { return this.pages[this.page].reduce((n, l) => n + stripMarkup(l).length, 0); },
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
    close() { this.active = false; Input.swallow(); },
    draw() {
        if (!this.active) return;
        const p = G.player;
        const top = p && (p.y - Cam.y) > 110;
        const x = 8, w = 304, h = 44, y = top ? 18 : H - h - 6;
        stitchedBox(x, y, w, h);
        let n = Math.floor(this.shown);
        const lines = this.pages[this.page] || [];
        lines.forEach((l, i) => {
            const len = stripMarkup(l).length;
            Font.draw(l, x + 9, y + 7 + i * 10, PAL.ink, Math.max(0, n));
            n -= len;
        });
        if (this.who) {
            const name = Story.name(this.who);
            const tw = Font.width(name) + 12;
            const ty = y - 9;
            stitchedBox(x + 6, ty, tw, 14, { fill: SPEAKER_COL[this.who] || '#f0c070', stitch: '#ffffff', shadow: shade(SPEAKER_COL[this.who] || '#f0c070', -0.15) });
            Font.draw(name, x + 12, ty + 3, PAL.ink);
        }
        const done = this.shown >= this.pageLen();
        const last = this.page === this.pages.length - 1;
        if (done && last && this.choices) {
            const cw = Math.max(...this.choices.map(c => Font.width(c))) + 20, chh = this.choices.length * 11 + 8;
            /* above the box, or (when the box is at the top of the screen) below it: always on screen */
            const cx = x + w - cw - 4, cy = top ? y + h + 2 : y - chh - 2;
            stitchedBox(cx, cy, cw, chh);
            this.choices.forEach((c, i) => {
                if (i === this.sel) Font.draw('\x02', cx + 5, cy + 5 + i * 11, PAL.red2);
                Font.draw(c, cx + 12, cy + 5 + i * 11, i === this.sel ? PAL.ink : PAL.grey3);
            });
        } else if (done && (G.t >> 4) % 2) {
            Gfx.rect(x + w - 12, y + h - 9, 5, 1, PAL.red2); Gfx.rect(x + w - 11, y + h - 8, 3, 1, PAL.red2); Gfx.rect(x + w - 10, y + h - 7, 1, 1, PAL.red2);
        }
    },
};
const SPEAKER_COL = {};

const UI = {
    fadeA: 0, fade: null, toasts: [], banner: null, menu: null,
    modal() { return Dialog.active || !!this.menu; },
    toast(s, dur = 120) { s = Story.fill(s); if (this.toasts.some(t => t.s === s)) return; this.toasts.push({ s, t: 0, dur }); },
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
        const under = p && (p.y - Cam.y) < 40;
        this.hudA = approach(this.hudA === undefined ? 1 : this.hudA, under ? 0.35 : 1, 0.08);
        Gfx.alpha(this.hudA);
        this._hud(p);
        Gfx.alpha(1);
    },
    _hud(p) {
        if (G.trial) Trials.draw();
        /* Wren's thread: a little red spool (until it's cut) */
        if (!Progress.flag('cut_self')) {
            const sp = (p && (p.state === 'flight')) ? Math.floor(G.t / 3) % 3 : 0;
            Gfx.img(spr('hud_spool' + sp), 4, 3);
        }
        /* hearts */
        if (!Progress.flag('cut_self')) {
            const n = Math.ceil(Inv.maxHp / 2);
            for (let i = 0; i < n; i++) {
                const hx = 16 + (i % 10) * 9, hy = 3 + Math.floor(i / 10) * 8;
                const v = Inv.hp - i * 2;
                Gfx.img(spr(v >= 2 ? 'hud_heart' : v === 1 ? 'hud_heart_half' : 'hud_heart_empty'), hx, hy);
            }
        }
        /* buttons */
        /* (the count right-aligned to the edge, however many) */
        const bs = String(Inv.buttons), bx = W - 5 - Font.width(bs);
        Gfx.img(spr('hud_button'), bx - 10, 4);
        Font.draw(bs, bx, 5, PAL.white, Infinity, PAL.ink);
        /* the tool in hand */
        const tool = Inv.equipped;
        if (tool) {
            stitchedBox(W - 58, 1, 20, 20, { fill: '#fbf3df' });
            const ic = spr('icon_' + tool); if (ic) Gfx.img(ic, W - 56, 3);
            /* the key (or button) that uses it, under the box */
            const kl = keyLabel('tool');
            Font.draw(kl, Math.round(W - 48 - Font.width(kl) / 2), 23, PAL.white, Infinity, PAL.ink);
        }
        /* keys in a House */
        const area = G.map;
        /* (a House with no locks and no keys to find shows no key count) */
        if (area && area.def.house && area.hasKeys === undefined) area.hasKeys = area.ents.some(e => (e.kind === 'door' && e.type === 'lock') || (e.kind === 'chest' && e.item === 'key'));
        if (area && area.def.house && (area.hasKeys || Inv.keys(area.def.house) > 0)) {
            const k = Inv.keys(area.def.house);
            const kx = tool ? W - 84 : W - 62;
            Gfx.img(spr('key'), kx, 1);
            Font.draw('x' + k, kx + 12, 6, PAL.white, Infinity, PAL.ink);
            if (Inv.hasPattern(area.def.house)) Gfx.img(spr('hud_pattern'), kx - 12, 6);
        }
    },
    draw() {
        /* toasts */
        const ty0 = this.banner ? (this.banner.sub ? 62 : 52) : 22;
        let y = ty0;
        for (const t of this.toasts) {
            /* a long one wraps onto more lines */
            const lines = t.lines || (t.lines = Font.width(t.s) > W - 40 ? Font.wrap(t.s, W - 40) : [t.s]);
            const w = Math.max(...lines.map(l => Font.width(l))) + 16, x = (W - w) / 2, h = 4 + lines.length * 10;
            const a = t.t < 8 ? t.t / 8 : t.t > t.dur - 10 ? (t.dur - t.t) / 10 : 1;
            Gfx.alpha(a); stitchedBox(x, y, w, h); lines.forEach((l, j) => Font.draw(l, x + 8, y + 3 + j * 10, PAL.ink)); Gfx.alpha(1);
            y += h + 2;
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
        /* the fade first: words said over a black screen are on it, not under it */
        if (this.fadeA > 0) { Gfx.alpha(this.fadeA); Gfx.rect(0, 0, W, H, PAL.night); Gfx.alpha(1); }
        Dialog.draw();
        if (this.menu) this.menu.draw();
    },
};

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
}
