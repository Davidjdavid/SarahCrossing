/* The probe: a debug-only inspector for the polish passes (POLISH.md). Off unless switched on (?probe in the address, or
   HW.probe(true)); it never changes play. While on, every drawn frame is checked for the kinds of glitches a player sees:
   colours that aren't colours (the canvas keeps the last good one: things come out the wrong colour), pictures that
   don't exist (an invisible person, a shadow with nothing on it), positions that aren't numbers, see-through or a flip
   left switched on after drawing, text with leftovers in it ("undefined", "{name}", a character the font doesn't have),
   people and things standing in walls or holes, a tile that thinks something's on it that isn't, the player inside a
   solid, and frames that take too long. Each kind of thing is logged once (with how often it happened and where). */

const Probe = {
    on: false, frameN: 0, log: new Map(), slow: [], budget: 8,
    COLOR: /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)|transparent|black|white)$/i,
    where() {
        const a = G.map, p = G.player, r = a && p && a.roomAt ? a.roomAt(p.tx, p.ty) : null;
        return (a ? a.id : G.scene) + (r && r.name ? ' / ' + r.name : '') + (p ? ` @${p.tx},${p.ty}` : '');
    },
    /* the source file and line a call came from (the build marks each file in the script) */
    caller(skip = 3) {
        const st = (new Error().stack || '').split('\n').slice(skip, skip + 3).map(s => s.trim().replace(/^at /, ''));
        return st.map(s => { const m = s.match(/:(\d+):\d+\)?$/); const f = m ? Probe.srcLine(+m[1]) : ''; return (s.split(' ')[0] || '?') + (f ? ' ' + f : ''); }).join(' < ');
    },
    srcLine(n) {
        if (!this._marks) {
            this._marks = [];
            const src = typeof document !== 'undefined' ? [...document.scripts].map(s => s.textContent).join('\n') : (globalThis.__SRC || '');
            src.split('\n').forEach((l, i) => { const m = l.match(/^\/\/ ---- (.+) ----$/); if (m) this._marks.push([i + 1, m[1]]); });
        }
        let f = null; for (const [ln, name] of this._marks) { if (ln <= n) f = [ln, name]; else break; }
        return f ? `${f[1]}:${n - f[0]}` : '';
    },
    CALL: {},     /* (passed as the detail: where it was drawn from, worked out only the first time it's seen) */
    note(kind, key, detail) {
        const k = kind + '|' + key, e = this.log.get(k);
        if (e) { e.n++; return; }
        if (detail === this.CALL) detail = this.caller(4);
        this.log.set(k, { kind, key, detail: detail || '', n: 1, first: this.frameN, where: this.where() });
    },
    okColor(c) { return typeof c !== 'string' || this.COLOR.test(c.trim()); },
    num(...v) { return v.every(x => typeof x === 'number' && isFinite(x)); },
    install() {
        if (this._installed) return; this._installed = true;
        const P = this;
        const wrap = (obj, name, check) => { const f = obj[name]; obj[name] = function (...a) { if (P.on) check.apply(this, a); return f.apply(this, a); }; };
        wrap(Gfx, 'rect', (x, y, w, h, col) => {
            if (!P.okColor(col)) P.note('colour', String(col), P.CALL); if (!P.num(x, y, w, h)) P.note('position', 'rect ' + [x, y, w, h].join(','), P.CALL);
            /* little marks drawn over the screen (a counter's dots, a pip) mustn't land on words, nor words on them */
            if (P.inUI && !P.inFont && G.scene === 'play' && w <= 8 && h <= 8 && P.num(x, y, w, h)) {
                const r = [x, y, x + w, y + h];
                for (const q of P.texts) if (Math.min(r[2], q[2]) - Math.max(r[0], q[0]) > 1 && Math.min(r[3], q[3]) - Math.max(r[1], q[1]) > 1) { P.note('text', `a mark drawn over the words "${stripMarkup(q[4]).slice(0, 30)}"`, P.CALL); break; }
                P.marks.push(r);
            }
        });
        wrap(Gfx, 'line', (x0, y0, x1, y1, col) => { if (!P.okColor(col)) P.note('colour', String(col), P.CALL); if (!P.num(x0, y0, x1, y1)) P.note('position', 'line', P.CALL); });
        wrap(Gfx, 'circle', (x, y, r, col) => { if (!P.okColor(col)) P.note('colour', String(col), P.CALL); if (!P.num(x, y, r)) P.note('position', 'circle', P.CALL); });
        wrap(Gfx, 'img', (im, x, y) => {
            if (!im) P.note('picture', 'drawn with no picture', P.CALL);
            else if (!P.num(x, y)) P.note('position', 'img ' + x + ',' + y, P.CALL);
            else if (!im.width || !im.height) P.note('picture', 'empty picture', P.CALL);
        });
        const spr0 = spr;
        spr = function (name) { const s = spr0(name); if (P.on && !s && name !== undefined) P.note('picture', 'no sprite "' + name + '"', P.CALL); return s; };
        /* every panel drawn this frame, so text can be checked against the panel it's in */
        const box0 = stitchedBox;
        /* (a panel hides whatever text it's drawn over) */
        stitchedBox = function (x, y, w, h, opts) { if (P.on) { P.boxes.push({ x, y, w, h }); P.texts = P.texts.filter(q => q[2] <= x || q[0] >= x + w || q[3] <= y || q[1] >= y + h); } return box0(x, y, w, h, opts); };
        /* (words floating in the world may drift off the screen's edge; the checks below are for what's drawn over it:
           the HUD, notices, dialogue, menus, and whole screens like the title) */
        for (const k of ['drawHUD', 'draw']) { const f = UI[k]; UI[k] = function (...a) { P.inUI = true; return f.apply(this, a); }; }
        wrap(Font, 'draw', (s, x, y) => {
            if (typeof s !== 'string') { P.note('text', 'not text: ' + typeof s, P.CALL); return; }
            const ui = P.inUI || G.scene !== 'play';
            /* two lines of text on top of each other */
            if (ui && P.num(x, y) && !G.credits && P.texts.length < 300) {
                const tw = Font.width(s), r = [x, y, x + tw, y + 8];
                for (const q of P.texts) {
                    if (q[4] === s && Math.abs(q[0] - x) <= 1 && Math.abs(q[1] - y) <= 1) continue;   /* (the same words a pixel apart: a shadow or an engraving) */
                    const ix = Math.min(r[2], q[2]) - Math.max(r[0], q[0]), iy = Math.min(r[3], q[3]) - Math.max(r[1], q[1]);
                    if (ix > 2 && iy > 2) { P.note('text', `overlaps other text: "${stripMarkup(s).slice(0, 30)}" on "${stripMarkup(q[4]).slice(0, 30)}"`, P.CALL); break; }
                }
                P.texts.push([...r, s]);
                for (const q of P.marks) if (Math.min(r[2], q[2]) - Math.max(r[0], q[0]) > 1 && Math.min(r[3], q[3]) - Math.max(r[1], q[1]) > 1) { P.note('text', `words drawn over a mark: "${stripMarkup(s).slice(0, 30)}"`, P.CALL); break; }
            }
            /* inside a panel: it ends inside the panel's stitching, and doesn't hang off its foot */
            if (ui && P.num(x, y) && !G.credits) {
                let box = null;
                for (let i = P.boxes.length - 1; i >= 0; i--) { const b = P.boxes[i]; if (x + 1 >= b.x && x + 1 < b.x + b.w && y + 4 >= b.y && y + 4 < b.y + b.h) { box = b; break; } }
                const tw = Font.width(s);
                if (box && (x + tw > box.x + box.w - 3 || y + 8 > box.y + box.h - 1)) P.note('text', `runs out of its panel (${Math.round(x + tw - (box.x + box.w - 3))} px over): ` + stripMarkup(s).slice(0, 60), P.CALL);
            }
            /* off the screen's edge (the credits roll in from below on purpose) */
            if (ui && !G.credits && P.num(x, y) && (x < 0 || y < 0 || x + Font.width(s) > W || y + 8 > H)) P.note('text', `off screen at ${Math.round(x)},${Math.round(y)}: ` + s.slice(0, 50), P.CALL);
            if (/undefined|NaN|\[object|\bnull\b/.test(s)) P.note('text', 'leftover in: ' + s.slice(0, 60), P.CALL);
            if (/\[(act|atk|tool|prev|next|menu|map|up|down|left|right)\]/.test(s)) P.note('text', 'a button left unnamed in: ' + s.slice(0, 60), P.CALL);
            for (const m of s.matchAll(/\{([^}]*)\}/g)) { const t = m[1]; if (t !== '/' && t !== '' && !TEXT_COLORS[t] && !PAL[t]) P.note('text', '{' + t + '} in: ' + s.slice(0, 60), P.CALL); }
            for (const ch of stripMarkup(s)) if (ch !== ' ' && ch !== '\n' && !FONT[ch]) P.note('text', `no glyph "${ch}" (${ch.charCodeAt(0)}) in: ` + s.slice(0, 50), P.CALL);
        });
        const fd = Font.draw; Font.draw = function (...a) { P.inFont = true; try { return fd.apply(this, a); } finally { P.inFont = false; } };
    },
    /* after each drawn frame */
    boxes: [], texts: [], marks: [],
    frame(ms) {
        if (!this.on) return;
        this.frameN++; this.boxes = []; this.texts = []; this.marks = []; this.inUI = false;
        const c = Gfx.ctx;
        if (c && c.globalAlpha !== undefined && c.globalAlpha !== 1) { this.note('state', 'see-through left on (' + c.globalAlpha + ')', ''); c.globalAlpha = 1; }
        if (c && c.getTransform && !HEADLESS) { const t = c.getTransform(); if (t.a !== 1 || t.d !== 1 || t.e || t.f) { this.note('state', 'flip/offset left on', ''); c.setTransform(1, 0, 0, 1, 0, 0); } }
        if (ms !== undefined && ms > this.budget) { this.slow.push([ms, this.where(), this.frameN]); if (this.slow.length > 400) { this.slow.sort((a, b) => b[0] - a[0]); this.slow.length = 200; } }
        if (G.scene === 'play' && G.map) this.world(G.map);
    },
    /* people and things where they can't be */
    world(a) {
        const p = G.player;
        const bad = k => k.solid || k.pit || (k.deep && !k.bridge) || k.fog || k.void;
        for (const e of a.ents) {
            if (e.removed || e.hidden || e.hiddenYank || e.carried || e.shattered || e.down || e.alive === false || e.swallowed) continue;
            if (e.isGrid) {
                if (!this.num(e.tx, e.ty, e.x, e.y)) { this.note('thing', 'not a number: ' + (e.id || e.kind), ''); continue; }
                if (!e.mv && !e.pendingHome && !e.flying && a.inside(e.tx, e.ty) && a.at(e.tx, e.ty) !== e && !e.noGrid) this.note('thing', `${e.id || e.kind} isn't on the tile it's at (${a.id} ${e.tx},${e.ty})`, '');
                if (e.kind === 'npc' && !e.mv && !e.counter && !e.seated && a.inside(e.tx, e.ty)) {   /* (a keeper behind a counter stands against the back wall, as drawn; someone seated sits on their seat) */ const k = a.kind(e.tx, e.ty); if (k.solid || k.pit || k.deep) this.note('placement', `${e.who || e.id} stands on ${a.kindName(e.tx, e.ty)} (${a.id} ${e.tx},${e.ty})`, ''); }
            } else if (e.kind === 'critter' && this.num(e.x, e.y)) {
                const tx = Math.floor(e.x / T), ty = Math.floor((e.y - 2) / T);
                if (a.inside(tx, ty) && bad(a.kind(tx, ty)) && !e.flies) this.note('placement', `${e.who || e.look} (critter) over ${a.kindName(tx, ty)} (${a.id} ${tx},${ty})`, '');
            }
        }
        /* a tile pointing at something that's gone, or that's somewhere else */
        if (a.occ && this.frameN % 30 === 0) for (const [k, o] of a.occ) {
            if (!o || o.isPlayer) continue;
            const [kx, ky] = k.split(',').map(Number), w = o.footW || 1;
            const here = (ky === o.ty && kx >= o.tx && kx < o.tx + w) || (o.mv && key2(o.mv.fx, o.mv.fy) === k);
            if (o.removed || o.carried || !here) this.note('thing', `a tile (${k}) still holds ${o.id || o.who || o.kind}${o.removed ? ' (gone)' : o.carried ? ' (carried)' : ' (moved on)'} in ${a.id}`, '');
        }
        for (const m of a.walkers) {
            if (m.alive === false || m.hidden || !this.num(m.x, m.y)) continue;
            const tx = Math.floor(m.x / T), ty = Math.floor(m.y / T);
            if (a.inside(tx, ty) && a.kind(tx, ty).solid && !m.flies && !m.ghost && !m.D?.flies) this.note('placement', `${m.type || m.kind} in a wall (${a.id} ${tx},${ty})`, '');
        }
        if (p && p.state === 'normal' && !G.cheats.noclip && a.inside(p.tx, p.ty)) { const k = a.kind(p.tx, p.ty); if (k.solid && !k.low) this.note('placement', `Wren inside ${a.kindName(p.tx, p.ty)} (${a.id} ${p.tx},${p.ty})`, ''); }
    },
    report() {
        const rows = [...this.log.values()].sort((x, y) => (x.kind > y.kind ? 1 : x.kind < y.kind ? -1 : y.n - x.n));
        this.slow.sort((x, y) => y[0] - x[0]);
        return { frames: this.frameN, issues: rows, slowest: this.slow.slice(0, 25) };
    },
    reset() { this.log = new Map(); this.slow = []; this.frameN = 0; },
};
HW.probe = function (on = true) { Probe.install(); Probe.on = on; return Probe; };
HW.Probe = Probe;
/* every step drawn and probed (the polish runs: the game in full, frame by frame) */
HW.drawEveryStep = function (on = true) {
    if (!Game._step0) Game._step0 = Game.step;
    Game.step = on ? function () { Game._step0.call(Game); const t0 = performance.now(); Game.render(); Probe.frame(performance.now() - t0); } : Game._step0;
};
if (!HEADLESS && /[?&]probe/.test(location.search)) HW.probe(true);
