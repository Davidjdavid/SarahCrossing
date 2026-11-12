/* The title screen, naming the Wanderer, and the pause menu (Satchel, Map, Journal, Options, Save). */

const Title = {
    sel: 0, t: 0, mode: 'main', slots: [],
    open() { this.sel = 0; this.t = 0; this.mode = 'main'; this.slots = Save.list(); G.scene = 'title'; Music.play('title'); },
    items() {
        const any = this.slots.some(s => s.s);
        return any ? ['Continue', 'New Wander', 'Options'] : ['New Wander', 'Options'];
    },
    update() {
        this.t++;
        if (this.mode === 'slots') return this.updateSlots();
        if (this.mode === 'options') { Options.update(() => { this.mode = 'main'; }); return; }
        const it = this.items();
        if (Input.pressed('up')) { this.sel = (this.sel + it.length - 1) % it.length; Sfx.play('menu'); }
        if (Input.pressed('down')) { this.sel = (this.sel + 1) % it.length; Sfx.play('menu'); }
        if (Input.pressed('act') || Input.pressed('menu')) {
            Sfx.play('select');
            const c = it[this.sel];
            if (c === 'Continue') { this.mode = 'slots'; this.slotSel = 0; this.slotAction = 'load'; }
            else if (c === 'New Wander') { this.mode = 'slots'; this.slotSel = this.slots.findIndex(s => !s.s); if (this.slotSel < 0) this.slotSel = 0; this.slotAction = 'new'; }
            else if (c === 'Options') { this.mode = 'options'; Options.open(); }
        }
    },
    updateSlots() {
        if (Input.pressed('up')) { this.slotSel = (this.slotSel + 2) % 3; Sfx.play('menu'); }
        if (Input.pressed('down')) { this.slotSel = (this.slotSel + 1) % 3; Sfx.play('menu'); }
        if (Input.pressed('atk') || Input.pressed('menu')) { this.mode = 'main'; Sfx.play('cancel'); return; }
        if (Input.pressed('act')) {
            const s = this.slots[this.slotSel];
            if (this.slotAction === 'load') {
                if (!s.s) { Sfx.play('cancel'); return; }
                Sfx.play('select'); Save.slot = s.n; Game.load(s.s);
            } else {
                if (s.s && !this.confirm) { this.confirm = true; Sfx.play('menu'); return; }
                this.confirm = false;
                Sfx.play('select'); Save.slot = s.n; NameEntry.open();
            }
        }
        if (Input.pressed('left') || Input.pressed('right')) this.confirm = false;
    },
    draw() {
        TitleArt.draw(this.t);
        if (this.mode === 'options') { Options.draw(); return; }
        if (this.mode === 'slots') {
            stitchedBox(60, 70, 200, 96);
            Font.center(this.slotAction === 'load' ? 'Which Wander?' : 'Begin in which slot?', W / 2, 76, PAL.ink);
            this.slots.forEach((s, i) => {
                const y = 92 + i * 22;
                if (i === this.slotSel) { Gfx.rect(68, y - 3, 184, 20, '#f2dfb4'); Font.draw('\x02', 72, y + 2, PAL.red2); }
                if (s.s) {
                    const h = Math.floor(s.s.stats.playFrames / 60 / 3600), m = Math.floor(s.s.stats.playFrames / 60 / 60) % 60;
                    Font.draw(`${s.s.name}`, 82, y - 1, PAL.ink);
                    Font.draw(`${(s.s.inv.knots || []).length} Knots  ${h}:${String(m).padStart(2, '0')}`, 82, y + 8, PAL.grey3);
                    Font.draw(Story.placeName(s.s.pos && s.s.pos.area), 252 - Font.width(Story.placeName(s.s.pos && s.s.pos.area)), y + 3, PAL.grey3);
                } else Font.draw('- empty -', 82, y + 3, PAL.grey2);
            });
            if (this.confirm) Font.center(fillKeys('Start over in this slot? Press [act] again.'), W / 2, 158, PAL.red2);
            return;
        }
        const it = this.items();
        it.forEach((c, i) => {
            const y = 118 + i * 13;
            const col = i === this.sel ? PAL.ink : '#6a5a5e';
            if (i === this.sel) { Font.center('\x02 ' + c + '  ', W / 2, y, col); }
            else Font.center(c, W / 2, y, col);
        });
        Font.draw('v' + VERSION, 4, H - 10, '#8a7a7e');
        /* the buttons, as they're bound now (keys or a controller, whichever was touched last) */
        const mv = keyLabel('up'), hint = `${mv === 'the arrows' ? 'Arrows' : 'D-pad'} move \xb7 ${keyLabel('act')} act \xb7 ${keyLabel('atk')} stick \xb7 ${keyLabel('tool')} tool \xb7 ${keyLabel('menu')} menu`;
        if (Font.width(hint) <= W - 40) Font.draw(hint, W - 4 - Font.width(hint), H - 10, '#8a7a7e');
    },
};

/* the title picture: the town's well at the bottom of its hollow, mist at the edges */
const TitleArt = {
    draw(t) {
        const c = Gfx.ctx;
        /* sky */
        for (let y = 0; y < H; y++) Gfx.rect(0, y, W, 1, mix('#9fd4f0', '#f6e2c0', y / H));
        /* hills, far to near */
        const hill = (base, amp, col, seed) => {
            for (let x = 0; x < W; x++) {
                const h = base + Math.sin(x / 40 + seed) * amp + Math.sin(x / 17 + seed * 2) * amp * 0.3;
                Gfx.rect(x, h, 1, H - h, col);
            }
        };
        hill(70, 10, '#c8d8c8', 1); hill(88, 8, '#a8c898', 2); hill(104, 6, '#8cbc78', 3); hill(122, 4, '#7cb064', 4);
        /* mist ring */
        for (let i = 0; i < 40; i++) {
            const x = (i * 37 + t * 0.2) % (W + 60) - 30, y = 60 + (i * 13) % 30;
            Gfx.alpha(0.35); Gfx.circle(x, y, 10 + (i % 3) * 4, '#f4f0f6'); Gfx.alpha(1);
        }
        /* the well */
        const wx = W / 2, wy = 98;
        Gfx.rect(wx - 18, wy, 36, 10, '#8a7a6a'); Gfx.rect(wx - 18, wy, 36, 2, '#c8b8a4');
        for (let i = -16; i < 18; i += 6) Gfx.rect(wx + i, wy + 3, 1, 6, '#6a5a4c');
        Gfx.rect(wx - 14, wy - 18, 3, 18, '#6b4128'); Gfx.rect(wx + 11, wy - 18, 3, 18, '#6b4128');
        Gfx.rect(wx - 18, wy - 22, 36, 5, '#9a4a3a'); Gfx.rect(wx - 16, wy - 24, 32, 2, '#c45a4a');
        Gfx.rect(wx - 11, wy - 12, 22, 2, '#c9925a');
        /* a thread hanging into the well, swaying */
        const sw = Math.sin(t / 50) * 1.5;
        Gfx.line(wx, wy - 11, wx + sw, wy + 2, '#e8463c');
        /* title */
        const title = 'HOLLOWELL';
        let x = W / 2 - 80;
        for (let i = 0; i < title.length; i++) {
            const ch = title[i];
            const y = 26 + Math.sin(t / 30 + i * 0.6) * 1.5;
            BigFont.draw(ch, x + 2, y + 2, '#5a3a3a');
            BigFont.draw(ch, x, y, '#fbf6ea');
            x += 18;
        }
        Font.center('a Wander', W / 2, 58, '#5a4a4e');
    },
};
/* the big letters for the title: the small font doubled, with a stitch */
const BigFont = {
    draw(ch, x, y, col) {
        const g = FONT[ch]; if (!g) return;
        g.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') { Gfx.rect(x + i * 3, y + j * 3, 3, 3, col); } });
    },
};

/* naming the Wanderer: type it, or (with a controller) pick the letters from the grid: the d-pad moves, [act] picks,
   [atk] takes one back, [menu] is done */
const NAME_GRID = ['ABCDEFGHIJ', 'KLMNOPQRST', "UVWXYZ-' ", '<>'];
const NameEntry = {
    name: '', t: 0, gx: 0, gy: 0,
    open() {
        G.scene = 'name'; this.name = 'Wren'; this.t = 0; this.fresh = true; this.gx = 0; this.gy = 0;
        Input.textHandler = e => {
            if (G.scene !== 'name') return false;
            if (e.key === 'Backspace') { this.back(); return true; }
            if (e.key === 'Enter') { this.done(); return true; }
            if (e.key.length === 1 && /[A-Za-z0-9 '\-]/.test(e.key) && this.name.length < 10) { this.add(e.key, true); return true; }
            return false;
        };
    },
    add(ch, typed) {
        if (this.fresh) { this.name = ''; this.fresh = false; }
        if (this.name.length >= 10) { Sfx.play('hitthing'); return; }
        /* (picked from the grid: a capital to start a word, small letters after) */
        if (!typed && /[A-Z]/.test(ch) && this.name.length && !/[ \-']$/.test(this.name)) ch = ch.toLowerCase();
        this.name += ch; if (!typed) Sfx.play('menu');
    },
    back() { this.name = this.fresh ? '' : this.name.slice(0, -1); this.fresh = false; Sfx.play('cancel'); },
    done() {
        const n = this.name.trim() || 'Wren';
        Input.textHandler = null;
        Sfx.play('select');
        Game.newGame(n);
    },
    update() {
        this.t++;
        if (HEADLESS && Input.pressed('act')) { this.done(); return; }
        const rows = NAME_GRID.length;
        if (Input.pressed('up')) { this.gy = (this.gy + rows - 1) % rows; Sfx.play('menu'); }
        if (Input.pressed('down')) { this.gy = (this.gy + 1) % rows; Sfx.play('menu'); }
        const row = NAME_GRID[this.gy];
        if (Input.pressed('left')) { this.gx = (this.gx + row.length - 1) % row.length; Sfx.play('menu'); }
        if (Input.pressed('right')) { this.gx = (this.gx + 1) % row.length; Sfx.play('menu'); }
        this.gx = Math.min(this.gx, row.length - 1);
        if (Input.pressed('menu')) { this.done(); return; }
        if (Input.pressed('atk')) this.back();
        if (Input.pressed('act')) {
            const ch = row[this.gx];
            if (ch === '<') this.back(); else if (ch === '>') this.done(); else this.add(ch);
        }
    },
    draw() {
        TitleArt.draw(this.t);
        stitchedBox(70, 64, 180, 108);
        Font.center("What is the Wanderer's name?", W / 2, 72, PAL.ink);
        Gfx.rect(110, 84, 100, 14, '#fff8e8'); Gfx.frame(110, 84, 100, 14, '#b0434a');
        Font.center(this.name + ((this.t >> 4) % 2 ? '_' : ' '), W / 2, 87, PAL.ink);
        NAME_GRID.forEach((row, ry) => {
            const last = ry === NAME_GRID.length - 1;
            [...row].forEach((ch, rx) => {
                const label = last ? (ch === '<' ? 'Back' : 'Done') : ch === ' ' ? '_' : ch;
                const x = last ? 116 + rx * 54 : 92 + rx * 14, y = 104 + ry * 12, w = last ? 34 : 10;
                const on = rx === this.gx && ry === this.gy;
                if (on) { Gfx.rect(x - 2, y - 2, w + 4, 12, '#f2d49a'); Gfx.frame(x - 2, y - 2, w + 4, 12, '#b0434a'); }
                Font.center(label, x + w / 2, y, on ? PAL.ink : PAL.grey3);
            });
        });
        Font.center(Input.lastKind === 'pad' ? fillKeys('[act] picks   [atk] takes back   [menu] done') : 'Type a name, then Enter', W / 2, 158, PAL.grey3);
    },
};

/* the pause menu */
const PauseMenu = {
    tabs: ['Satchel', 'Map', 'Journal', 'Options', 'Save'],
    tab: 0, sel: 0, t: 0,
    open() { UI.menu = this; this.t = 0; this.sel = 0; this.row = 0; this.tsel = 0; this.ttop = 0; this.nsel = 0; this.reading = null; Sfx.play('menu'); },
    close() { UI.menu = null; Input.swallow(); Settings.save(); },
    update() {
        this.t++;
        if (this.tabs[this.tab] === 'Options' && Options.focus) { Options.update(() => { Options.focus = false; }); return; }
        /* reading a note: X (or Z at its end) puts it down */
        if (this.reading) {
            const n = NOTES[this.reading], pages = Math.max(1, Math.ceil(Font.wrap(Story.fill(n.text || ''), 270).length / 11));
            if (Input.pressed('act') && (this.rpage || 0) < pages - 1) { this.rpage = (this.rpage || 0) + 1; Sfx.play('menu'); return; }
            if (Input.pressed('act') || Input.pressed('atk') || Input.pressed('menu')) { this.reading = null; this.rpage = 0; Sfx.play('cancel'); return; }
            return;
        }
        if (Input.pressed('menu') || (Input.pressed('atk') && !this.saveMsg)) { this.close(); Sfx.play('cancel'); return; }
        if (Input.pressed('prev') || (Input.pressed('left') && this.tabs[this.tab] !== 'Satchel')) { this.tab = (this.tab + this.tabs.length - 1) % this.tabs.length; this.sel = 0; Sfx.play('menu'); }
        else if (Input.pressed('next') || (Input.pressed('right') && this.tabs[this.tab] !== 'Satchel')) { this.tab = (this.tab + 1) % this.tabs.length; this.sel = 0; Sfx.play('menu'); }
        const tab = this.tabs[this.tab];
        if (tab === 'Satchel') {
            const things = this.things(), per = this.SAT.perRow;
            if (this.row === 1 && !things.length) this.row = 0;
            this.tsel = Math.min(this.tsel || 0, Math.max(0, things.length - 1));
            /* down from the tools to the things, and down and up their rows; up from the top row of things: the tools */
            if (this.row !== 1) { if (Input.pressed('down') && things.length) { this.row = 1; Sfx.play('menu'); } }
            else if (Input.pressed('up')) { if (this.tsel >= per) this.tsel -= per; else this.row = 0; Sfx.play('menu'); }
            else if (Input.pressed('down') && this.tsel + per < things.length) { this.tsel += per; Sfx.play('menu'); }
            const n = this.row === 1 ? things.length : Inv.tools.length;
            if (n) {
                const k = this.row === 1 ? 'tsel' : 'sel';
                if (Input.pressed('left')) { this[k] = ((this[k] || 0) + n - 1) % n; Sfx.play('menu'); }
                if (Input.pressed('right')) { this[k] = ((this[k] || 0) + 1) % n; Sfx.play('menu'); }
                if (Input.pressed('act') && this.row !== 1) { Inv.equipped = Inv.tools[this.sel]; Sfx.play('select'); }
            }
        } else if (tab === 'Journal') {
            const notes = this.notes();
            if (notes.length) {
                if (Input.pressed('up')) { this.nsel = ((this.nsel || 0) + notes.length - 1) % notes.length; Sfx.play('menu'); }
                if (Input.pressed('down')) { this.nsel = ((this.nsel || 0) + 1) % notes.length; Sfx.play('menu'); }
                if (Input.pressed('act')) { this.reading = notes[Math.min(this.nsel || 0, notes.length - 1)]; this.rpage = 0; Sfx.play('select'); }
            }
        } else if (tab === 'Options') {
            if (Input.pressed('act')) { Options.open(); Options.focus = true; }
        } else if (tab === 'Save') {
            const n = this.saveItems().length;
            if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sfx.play('menu'); }
            if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sfx.play('menu'); }
            if (Input.pressed('act')) {
                if (this.sel === 0) { Save.write(); Sfx.play('save'); this.saveMsg = 90; }
                else if (this.sel === 1) { Save.write(); this.close(); Title.open(); }
                else if (this.saveItems()[this.sel].startsWith('Sit')) { this.close(); Waiting.start(); }
                else { this.close(); PauseMenu.backToDoor(); }
            }
            if (this.saveMsg) this.saveMsg--;
        } else if (tab === 'Map') {
            MapView.update();
        }
    },
    draw() {
        Gfx.alpha(0.55); Gfx.rect(0, 0, W, H, PAL.night); Gfx.alpha(1);
        stitchedBox(10, 8, 300, 166);
        /* tabs */
        let x = 18;
        this.tabs.forEach((t, i) => {
            const w = Font.width(t) + 12;
            if (i === this.tab) { Gfx.rect(x - 2, 12, w + 4, 14, '#f2d49a'); Gfx.frame(x - 2, 12, w + 4, 14, '#b0434a'); }
            Font.draw(t, x + 4, 15, i === this.tab ? PAL.ink : PAL.grey3);
            x += w + 6;
        });
        /* which keys turn the tabs (the arrows do too, but not in the Satchel, where they pick things) */
        const turn = keyLabel('prev') + '/' + keyLabel('next'), tw = Font.width(turn);
        if (x + tw < 302) Font.draw(turn, 302 - tw, 15, PAL.grey3);
        Gfx.rect(16, 28, 288, 1, '#d8c49a');
        const tab = this.tabs[this.tab];
        if (tab === 'Satchel') this.drawSatchel();
        if (tab === 'Map') MapView.draw(18, 32, 284, 136);
        if (tab === 'Journal') this.drawJournal();
        if (tab === 'Options') Options.draw(true);
        if (tab === 'Save') {
            this.saveItems().forEach((s, i) => {
                const y = 70 + i * 16;
                if (i === this.sel) Font.draw('\x02', 110, y, PAL.red2);
                Font.draw(s, 120, y, i === this.sel ? PAL.ink : PAL.grey3);
            });
            if (this.saveMsg) Font.center('Saved. (The Way remembers.)', W / 2, 120, PAL.green3);
            Font.center('Your Wander is also kept whenever you go through a door.', W / 2, 150, PAL.grey3);
        }
    },
    /* in a House there's always a way out: back to its door, as if you'd fainted (but without the fainting) */
    saveItems() {
        const a = G.map, l = ['Save here', 'Save and go to the title'];
        if (a && a.def.house && AREAS[a.id].entry && G.player && G.player.state === 'normal') l.push(a.def.making ? 'Out to the Making Floor' : "Back to the House's door");
        if (Waiting.canWait()) l.push('Sit and wait for things to come home');
        return l;
    },
    backToDoor() {
        Script.run(function* () {
            const e = AREAS[G.map.id].entry;
            yield* fadeOut(20);
            /* (a Making's door is on the Making Floor: out, and in again starts it afresh) */
            if (G.map.def.making) World.enter('underside', 49, 3, { dir: DOWN });
            else World.enter(G.map.id, e.x, e.y, { dir: UP });
            Stats.count('backToDoor');
            yield* fadeIn(20);
        });
    },
    /* the satchel: tools on one row, things under them (each picked with the arrows, its name and what it is below);
       hearts, patches and buttons at the foot, the Knots tied up top. However many things there are it fits: two rows
       of them show at a time (the rows scroll with the pick, an arrow at the end of a row when there are more), and
       what the picked one is has the room left above the foot: its name on a line of its own when that leaves room for
       all it says, else leading into it. (tests/ui_sweep.test.mjs holds it to that, with every thing in the game.) */
    SAT: { perRow: 12, rows: 2, gridY: 84, pitch: 22, footY: 158, descW: 280 },
    things() { return Object.keys(Inv.items).filter(k => ITEMS[k] && ITEMS[k].kind !== 'hidden' && ITEMS[k].kind !== 'tool'); },
    /* the first row of things shown: the picked one's row kept in view (the last one picked, while it's the tools) */
    satchelTop(things) {
        const S = this.SAT, rows = Math.ceil(things.length / S.perRow), vis = Math.min(S.rows, Math.max(1, rows));
        let top = this.ttop || 0;
        const r = Math.floor((this.tsel || 0) / S.perRow); if (r < top) top = r; if (r >= top + vis) top = r - vis + 1;
        return (this.ttop = clamp(top, 0, Math.max(0, rows - vis)));
    },
    /* what a thing is, in lines that fit `room` (its name in red on a line of its own, or leading in when that's too many) */
    satchelLines(id, room) {
        const I = ITEMS[id], w = this.SAT.descW, desc = Story.fill(I.desc || '');
        const own = desc ? Font.wrap(desc, w) : [];
        if (own.length + 1 <= room) return ['{red}' + I.name].concat(own);
        return Font.wrap(I.name.split(' ').map(s => '{red}' + s + '{/}').join(' ') + (desc ? ': ' + desc : ''), w);
    },
    drawSatchel() {
        const S = this.SAT;
        Font.draw('Tools', 22, 33, PAL.grey3);
        /* the Knots tied, at the right of the Tools line */
        if (Inv.knots.length) { const kx = 302 - Inv.knots.length * 14; Font.draw('Knots', kx - 30, 33, PAL.grey3); Inv.knots.forEach((k, i) => Gfx.img(spr('knot'), kx + i * 14, 27)); }
        const n = TOOL_ORDER.length, sp = Math.min(34, Math.floor((280 - 24) / Math.max(1, n - 1)));
        TOOL_ORDER.forEach((id, i) => {
            const x = 24 + i * sp, y = 45;
            const has = Inv.tools.includes(id);
            Gfx.rect(x, y, 24, 24, has ? '#fff6e0' : '#e6d6b2'); Gfx.frame(x, y, 24, 24, '#b8a07a');
            if (has) {
                Gfx.img(spr('icon_' + id), x + 4, y + 4);
                if (this.row !== 1 && Inv.tools[this.sel] === id) { Gfx.frame(x - 1, y - 1, 26, 26, PAL.red2); Gfx.frame(x - 2, y - 2, 28, 28, PAL.red2); }
                /* the one in hand: a red pip in its corner */
                if (Inv.equipped === id) { Gfx.rect(x + 17, y + 17, 6, 6, PAL.red2); Gfx.rect(x + 19, y + 19, 2, 2, '#ffffff'); }
            } else Font.center('?', x + 12, y + 8, '#c8b48c');
        });
        const things = this.things(), rows = Math.ceil(things.length / S.perRow), vis = Math.min(S.rows, rows), top = this.satchelTop(things);
        Font.draw('Things', 22, 74, PAL.grey3);
        if (!things.length) Font.draw('Nothing else yet.', 60, 74, PAL.grey3);
        things.forEach((id, i) => {
            const r = Math.floor(i / S.perRow) - top;
            if (r < 0 || r >= vis) return;
            const x = 24 + (i % S.perRow) * S.pitch, y = S.gridY + r * S.pitch;
            Gfx.rect(x, y, 20, 20, '#fff6e0'); Gfx.frame(x, y, 20, 20, '#b8a07a');
            const im = spr(ITEM_ICON[id] || ('icon_' + id)) || spr(id);
            if (im) Gfx.img(im, x + 10 - im.width / 2, y + 10 - im.height / 2); else Font.center('?', x + 10, y + 6, '#c8b48c');
            if (this.row === 1 && this.tsel === i) { Gfx.frame(x - 1, y - 1, 22, 22, PAL.red2); Gfx.frame(x - 2, y - 2, 24, 24, PAL.red2); }
        });
        /* more rows of things above or below the ones shown: a little arrow at the end of the row */
        const ax = 24 + S.perRow * S.pitch + 4;
        if (top > 0) for (let j = 0; j < 3; j++) Gfx.rect(ax + 2 - j, S.gridY + 6 + j, 1 + j * 2, 1, PAL.red2);
        if (top + vis < rows) for (let j = 0; j < 3; j++) Gfx.rect(ax + j, S.gridY + (vis - 1) * S.pitch + 11 + j, 5 - j * 2, 1, PAL.red2);
        /* what the picked one is, in the room between the things and the foot */
        const descY = S.gridY + Math.max(1, vis) * S.pitch, room = Math.floor((S.footY - descY) / 10);
        const pick = this.row === 1 ? things[this.tsel] : Inv.tools[this.sel];
        if (pick) this.satchelLines(pick, room).slice(0, room).forEach((l, i) => Font.draw(l, 24, descY + i * 10, PAL.ink));
        else Font.draw('No tools yet.', 24, descY, PAL.grey3);
        /* the foot: hearts, patches, buttons */
        const foot = (Progress.flag('cut_self') ? 'No hearts: nothing to unravel' : 'Hearts ' + Math.ceil(Inv.maxHp / 2) + '   Heart Patches ' + (Inv.patches % 4) + '/4') + '   Buttons ' + Inv.buttons;
        Font.draw(foot, 24, S.footY, PAL.ink);
    },
    /* the journal: what's next, and the notes found (pick one to read it again) */
    drawJournal() {
        const notes = this.notes();
        if (this.reading) {
            const n = NOTES[this.reading];
            Font.draw('{red}' + n.title, 22, 34, PAL.ink);
            const lines = Font.wrap(Story.fill(n.text || ''), 270), per = 11, pages = Math.max(1, Math.ceil(lines.length / per));
            const pg = Math.min(this.rpage || 0, pages - 1);
            lines.slice(pg * per, pg * per + per).forEach((l, i) => Font.draw(l, 24, 48 + i * 10, PAL.ink));
            Font.draw(pages > 1 && pg < pages - 1 ? fillKeys('[act] more   [atk] back') : fillKeys('[atk] back'), 24, 160, PAL.grey3);
            return;
        }
        Font.draw('{red}Now', 22, 34, PAL.ink);
        const goal = Font.wrap(Story.fill(Progress.goal || 'Wander.'), 270).slice(0, 4);
        goal.forEach((l, i) => Font.draw(l, 24, 46 + i * 10, PAL.ink));
        let ny = 46 + goal.length * 10 + 6;
        /* what's going on in town that's new, until it's done (so a new thing is told, not stumbled on) */
        /* (the newest first: what opened up with the latest turn of the Wander is what you'll want to hear of) */
        const news = TOWN_NEWS.filter(([on, done]) => on() && !done()).sort((a, b) => (b[3] || 0) - (a[3] || 0)).map(n => n[2]);
        if (news.length) {
            /* as many as fit in three lines; the rest counted ("and 2 more"), never cut off mid-word */
            const text = k => '{red}Also in town:{/} ' + news.slice(0, k).join('; ') + (k < news.length ? `; and ${news.length - k} more` : '') + '.';
            let k = news.length;
            while (k > 1 && Font.wrap(text(k), 270).length > 3) k--;
            const lines = Font.wrap(text(k), 270).slice(0, 3);
            lines.forEach((l, i) => Font.draw(l, 24, ny + i * 10, PAL.ink));
            ny += lines.length * 10 + 6;
        }
        Font.draw('{red}Notes', 22, ny, PAL.ink);
        if (!notes.length) Font.draw('Nothing written yet.', 24, ny + 12, PAL.grey3);
        const rows = Math.max(1, Math.floor((150 - (ny + 12)) / 10));
        const top = Math.max(0, Math.min((this.nsel || 0) - rows + 1, notes.length - rows));
        notes.slice(top, top + rows).forEach((id, i) => {
            const k = top + i, on = k === (this.nsel || 0);
            if (on) Font.draw('\x02', 18, ny + 12 + i * 10, PAL.red2);
            Font.draw(NOTES[id].title, 24, ny + 12 + i * 10, on ? PAL.ink : PAL.grey3);
        });
        if (notes.length > rows) Font.draw((top > 0 ? '^ ' : '  ') + (top + rows < notes.length ? 'v' : ''), 290, ny, PAL.grey3);
        const t = Stats.playFrames / 60;
        Font.draw(`Time wandering: ${Math.floor(t / 3600)}h ${Math.floor(t / 60) % 60}m` + (notes.length ? fillKeys('   [act] read a note') : ''), 24, 160, PAL.grey3);
    },
    notes() { return Progress.notes.filter(n => NOTES[n]).slice().reverse(); },
};
const NOTES = {};      /* id -> { title, text } */
/* new things to do in town: [shown when, done when, what, how far into the Wander it opens (the newest are told first)]
   (the town's favours add theirs: src/51c_town_favours.js) */
const TOWN_NEWS = [
    [() => Progress.flag('d1'), () => Progress.flag('s12'), "Otto's game in the square", 1],
    [() => Progress.flag('d1'), () => Progress.flag('s28'), "the Tidiness Trials up the Inn's attic stairs", 1],
    [() => Progress.flag('d4'), () => Progress.flag('s29'), 'Returnball, by the south road', 4],
];

const Options = {
    sel: 0, focus: false,
    rows() {
        return [
            ['Music', () => Math.round(Audio.vol.music * 10), d => { Audio.vol.music = clamp(Audio.vol.music + d * 0.1, 0, 1); Audio.setVolumes(); }],
            ['Sound', () => Math.round(Audio.vol.sfx * 10), d => { Audio.vol.sfx = clamp(Audio.vol.sfx + d * 0.1, 0, 1); Audio.setVolumes(); Sfx.play('menu'); }],
            ['Text speed', () => ['slow', 'normal', 'fast'][Settings.textSpeed === 0.5 ? 0 : Settings.textSpeed === 1 ? 1 : 2], d => { const v = [0.5, 1, 2]; let i = v.indexOf(Settings.textSpeed); i = clamp(i + d, 0, 2); Settings.textSpeed = v[i]; }],
            ['Screen shake', () => Settings.shake ? 'on' : 'off', () => { Settings.shake = !Settings.shake; }],
            /* (on, until the House has asked whether it should: it asks first, so a player can see they're offered, not given) */
            [Progress.flag && Progress.flag('reveal1') ? "Makers' nudges" : 'Hints', () => !Settings.hints ? 'off' : Progress.flag && Progress.flag('hintsAsked') ? 'on' : 'ask first', () => { Settings.hints = !Settings.hints; Stats.count(Settings.hints ? 'hintsOn' : 'hintsOff'); }],
        ];
    },
    open() { this.sel = 0; },
    update(back) {
        const r = this.rows();
        if (Input.pressed('up')) { this.sel = (this.sel + r.length - 1) % r.length; Sfx.play('menu'); }
        if (Input.pressed('down')) { this.sel = (this.sel + 1) % r.length; Sfx.play('menu'); }
        if (Input.pressed('left')) r[this.sel][2](-1);
        if (Input.pressed('right') || Input.pressed('act')) r[this.sel][2](1);
        if (Input.pressed('atk') || Input.pressed('menu')) { Settings.save(); back(); Sfx.play('cancel'); }
    },
    draw(inMenu) {
        /* (on the title screen, a box round however many rows there are, about the screen's middle, the pointer inside it) */
        const n = this.rows().length, top = 112 - Math.round((n * 14 + 10) / 2), x = inMenu ? 40 : 70, y = inMenu ? 42 : top + 8;
        if (!inMenu) stitchedBox(54, top, 212, n * 14 + 10);
        this.rows().forEach((r, i) => {
            const yy = y + i * 14;
            const on = (!inMenu || this.focus) && i === this.sel;
            if (on) Font.draw('\x02', x - 8, yy, PAL.red2);
            Font.draw(r[0], x, yy, on ? PAL.ink : PAL.grey3);
            Font.draw(String(r[1]()), x + 130, yy, on ? PAL.red2 : PAL.grey3);
        });

        if (inMenu) Font.draw(fillKeys(this.focus ? '[act] or the arrows change it.   [atk] when done.' : 'Press [act] to change settings.'), 22, 156, PAL.grey3);
    },
};

/* the map in the pause menu */
const MapView = {
    update() { },
    draw(x, y, w, h) {
        const a = G.map;
        if (!a) return;
        const def = a.def;
        const big = def.mapOf ? AREAS[def.mapOf] : def;
        Font.draw(a.name || '', x + 4, y + 2, PAL.ink);
        /* the area drawn small: every tile a dot of its colour */
        const sc = Math.max(1, Math.min(Math.floor((w - 8) / a.w), Math.floor((h - 16) / a.h)));
        const ox = x + Math.floor((w - a.w * sc) / 2), oy = y + 14 + Math.floor((h - 16 - a.h * sc) / 2);
        const seen = Stats.visited[a.id] || {};
        const known = def.house ? (Inv.plans.includes(def.house)) : true;
        for (let ty = 0; ty < a.h; ty++) for (let tx = 0; tx < a.w; tx++) {
            const vis = seen[(tx >> 2) + ',' + (ty >> 2)];
            if (!vis && !known) continue;
            const k = a.cell(tx, ty).k;
            const col = MAP_COL[k] || '#c8e0a0';
            Gfx.rect(ox + tx * sc, oy + ty * sc, sc, sc, vis ? col : mix(col, '#e8dcc0', 0.6));
        }
        const p = G.player;
        if (a.id === 'hollow') this.drawValley(a, ox, oy, sc, seen);
        if ((G.t >> 3) % 2) Gfx.rect(ox + (p.x / T) * sc - 1, oy + (p.y / T) * sc - 1, 3, 3, PAL.red);
    },
    /* the valley's map tells: the regions' names once you've been there, every House's door in its Maker's colour once
       seen (a Knot tied, a knot drawn on it), the Well, and a flag where the goal points */
    drawValley(a, ox, oy, sc, seen) {
        const been = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y += 4) for (let x = x0; x < x0 + w; x += 4) if (seen[(x >> 2) + ',' + (y >> 2)]) return true; return false; };
        const placed = [];
        for (const r of a.regions) if (r.w === 64 && r.h === 40 && been(r.x, r.y, r.w, r.h)) {
            const name = r.name.replace(/^The /, ''), cx = ox + (r.x + r.w / 2) * sc, tw = Font.width(name);
            const lx = Math.round(clamp(cx - tw / 2, ox + 1, ox + a.w * sc - tw - 1));
            let ly = Math.round(oy + (r.y + r.h * 0.72) * sc - 4);
            /* (two names never run into each other: the second steps down a line) */
            for (let k = 0; k < 3 && placed.some(q => lx < q[2] + 3 && lx + tw + 3 > q[0] && ly < q[3] && ly + 9 > q[1]); k++) ly += 10;
            placed.push([lx, ly, lx + tw, ly + 9]);
            Gfx.alpha(0.9); Font.draw(name, lx, ly, PAL.white, Infinity, PAL.ink); Gfx.alpha(1);
        }
        for (const [h, x, y, col] of MAP_HOUSES) {
            const known = seen[(x >> 2) + ',' + (y >> 2)] || Inv.knots && Inv.knots.includes(h);
            if (!known) continue;
            const dx = ox + x * sc, dy = oy + y * sc;
            Gfx.rect(dx - 2, dy - 2, 5, 5, PAL.ink); Gfx.rect(dx - 1, dy - 1, 3, 3, col);
            if (Inv.knots && Inv.knots.includes(h)) Gfx.rect(dx, dy, 1, 1, '#f7d64a');
        }
        Gfx.rect(ox + 95 * sc - 2, oy + 58 * sc - 1, 5, 4, PAL.ink); Gfx.rect(ox + 95 * sc - 1, oy + 58 * sc, 3, 2, '#9a9188');
        const pin = mapPin(a);
        if (pin && (G.t >> 4) % 4) {
            const px = ox + pin[0] * sc, py = oy + pin[1] * sc;
            Gfx.rect(px, py - 9, 1, 9, PAL.ink); Gfx.rect(px + 1, py - 9, 5, 4, PAL.ink); Gfx.rect(px + 1, py - 8, 4, 2, PAL.red);
        }
    },
};
/* the Houses' doors on the valley's map: [house, x, y, colour] */
const MAP_HOUSES = [['tidy', 108, 92, THREAD.ives], ['kiln', 22, 93, THREAD.bram], ['mill', 175, 105, THREAD.ambrose], ['belfry', 158, 7, THREAD.tess],
    ['slumber', 147, 48, THREAD.mallow], ['marionette', 31, 49, THREAD.jory], ['loom', 95, 9, THREAD.loom]];
/* where the goal points, read from its words: the first place it names (a House, a building, a landmark; a region only
   if it names none of those); the longer name wins where two start together */
const MAP_SPOTS = [[/\bTidyhouse\b/, 108, 92], [/\bKiln\b/, 22, 93], [/\bMillrace\b/, 175, 105], [/\bBelfry\b/, 158, 7], [/\bSlumberhouse\b/, 147, 48],
    [/\bMarionette Hall\b/, 31, 49], [/\bLoom\b/, 95, 9], [/\bInn\b|\bGuild Hall\b|\bSpoolworks\b|\bMaking Floor\b|\bWay Down\b|\bUnderside\b/, 108, 52],
    [/\bWell\b|\bGreat Spool\b/, 95, 58], [/\bclinic\b/, 121, 52], [/\bgiant\b|\beast road\b/, 129, 58], [/\bFrayed Edge\b|\bfog\b/, 73, 13], [/\bcliff stair\b/, 171, 60],
    [/\bbroken bridge\b/, 126, 96], [/\bcanyon road\b/, 66, 102]];
function mapPin(a) {
    const g = Progress.goal; if (!g) return null;
    let best = null;
    const consider = (i, len, x, y) => { if (i >= 0 && (!best || i < best.i || (i === best.i && len > best.len))) best = { i, len, x, y }; };
    for (const [re, x, y] of MAP_SPOTS) { const m = re.exec(g); if (m) consider(m.index, m[0].length, x, y); }
    /* (a named place beats a region: "Home to Hollowell. (...the clinic...)" points at the clinic) */
    if (!best) for (const r of a.regions) { const i = g.indexOf(r.name); if (i >= 0) consider(i, r.name.length, r.x + r.w / 2, r.y + r.h / 2); }
    return best ? [best.x, best.y] : null;
}
const MAP_COL = { grass: '#9cd070', path: '#e8cc98', sand: '#f0dcb0', water: '#5aaee6', shallow: '#8ccaf0', cliff: '#8a7a6a', rock: '#7a6a5a', wall: '#5a4a4a', floor: '#e8dcc0', pit: '#2a1f2d', tree: '#3e8a48', bridge: '#c9925a', fog: '#e0dce4', void: '#e8dcc0', stairs: '#b8a890', roof: '#b0434a', current: '#5aaee6', ledge: '#b8a890', spikes: '#9a9188' };
