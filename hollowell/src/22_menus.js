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
            if (this.confirm) Font.center('Start over in this slot? Press Z again.', W / 2, 158, PAL.red2);
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

const NameEntry = {
    name: '', t: 0,
    open() {
        G.scene = 'name'; this.name = 'Wren'; this.t = 0; this.fresh = true;
        Input.textHandler = e => {
            if (G.scene !== 'name') return false;
            if (e.key === 'Backspace') { this.name = this.fresh ? '' : this.name.slice(0, -1); this.fresh = false; return true; }
            if (e.key === 'Enter') { this.done(); return true; }
            if (e.key.length === 1 && /[A-Za-z0-9 '\-]/.test(e.key) && this.name.length < 10) {
                if (this.fresh) { this.name = ''; this.fresh = false; }
                this.name += e.key; return true;
            }
            return false;
        };
    },
    done() {
        const n = this.name.trim() || 'Wren';
        Input.textHandler = null;
        Sfx.play('select');
        Game.newGame(n);
    },
    update() {
        this.t++;
        if (HEADLESS && Input.pressed('act')) this.done();
    },
    draw() {
        TitleArt.draw(this.t);
        stitchedBox(70, 84, 180, 64);
        Font.center("What is the Wanderer's name?", W / 2, 92, PAL.ink);
        Gfx.rect(110, 108, 100, 14, '#fff8e8'); Gfx.frame(110, 108, 100, 14, '#b0434a');
        Font.center(this.name + ((this.t >> 4) % 2 ? '_' : ' '), W / 2, 111, PAL.ink);
        Font.center('Type a name, then Enter', W / 2, 130, PAL.grey3);
    },
};

/* the pause menu */
const PauseMenu = {
    tabs: ['Satchel', 'Map', 'Journal', 'Options', 'Save'],
    tab: 0, sel: 0, t: 0,
    open() { UI.menu = this; this.t = 0; this.sel = 0; Sfx.play('menu'); },
    close() { UI.menu = null; Input.swallow(); Settings.save(); },
    update() {
        this.t++;
        if (this.tabs[this.tab] === 'Options' && Options.focus) { Options.update(() => { Options.focus = false; }); return; }
        if (Input.pressed('menu') || (Input.pressed('atk') && !this.saveMsg)) { this.close(); Sfx.play('cancel'); return; }
        if (Input.pressed('prev') || (Input.pressed('left') && this.tabs[this.tab] !== 'Satchel')) { this.tab = (this.tab + this.tabs.length - 1) % this.tabs.length; this.sel = 0; Sfx.play('menu'); }
        else if (Input.pressed('next') || (Input.pressed('right') && this.tabs[this.tab] !== 'Satchel')) { this.tab = (this.tab + 1) % this.tabs.length; this.sel = 0; Sfx.play('menu'); }
        const tab = this.tabs[this.tab];
        if (tab === 'Satchel') {
            const n = Inv.tools.length;
            if (n) {
                if (Input.pressed('left')) { this.sel = (this.sel + n - 1) % n; Sfx.play('menu'); }
                if (Input.pressed('right')) { this.sel = (this.sel + 1) % n; Sfx.play('menu'); }
                if (Input.pressed('act')) { Inv.equipped = Inv.tools[this.sel]; Sfx.play('select'); }
            }
        } else if (tab === 'Options') {
            if (Input.pressed('act')) { Options.open(); Options.focus = true; }
        } else if (tab === 'Save') {
            if (Input.pressed('up') || Input.pressed('down')) { this.sel = 1 - this.sel; Sfx.play('menu'); }
            if (Input.pressed('act')) {
                if (this.sel === 0) { Save.write(); Sfx.play('save'); this.saveMsg = 90; }
                else { Save.write(); this.close(); Title.open(); }
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
        Gfx.rect(16, 28, 288, 1, '#d8c49a');
        const tab = this.tabs[this.tab];
        if (tab === 'Satchel') this.drawSatchel();
        if (tab === 'Map') MapView.draw(18, 32, 284, 136);
        if (tab === 'Journal') this.drawJournal();
        if (tab === 'Options') Options.draw(true);
        if (tab === 'Save') {
            ['Save here', 'Save and go to the title'].forEach((s, i) => {
                const y = 70 + i * 16;
                if (i === this.sel) Font.draw('\x02', 110, y, PAL.red2);
                Font.draw(s, 120, y, i === this.sel ? PAL.ink : PAL.grey3);
            });
            if (this.saveMsg) Font.center('Saved. (The Way remembers.)', W / 2, 120, PAL.green3);
            Font.center('Your Wander is also kept whenever you go through a door.', W / 2, 150, PAL.grey3);
        }
    },
    drawSatchel() {
        Font.draw('Tools', 22, 34, PAL.grey3);
        TOOL_ORDER.forEach((id, i) => {
            const x = 24 + i * 34, y = 46;
            const has = Inv.tools.includes(id);
            Gfx.rect(x, y, 24, 24, has ? '#fff6e0' : '#e6d6b2'); Gfx.frame(x, y, 24, 24, '#b8a07a');
            if (has) {
                Gfx.img(spr('icon_' + id), x + 4, y + 4);
                if (Inv.tools[this.sel] === id) { Gfx.frame(x - 1, y - 1, 26, 26, PAL.red2); Gfx.frame(x - 2, y - 2, 28, 28, PAL.red2); }
                if (Inv.equipped === id) Font.draw('C', x + 18, y + 16, PAL.red2);
            } else Font.center('?', x + 12, y + 8, '#c8b48c');
        });
        const id = Inv.tools[this.sel];
        if (id) { const I = ITEMS[id]; Font.draw('{red}' + I.name, 24, 78, PAL.ink); Font.wrap(I.desc, 270).forEach((l, i) => Font.draw(l, 24, 90 + i * 10, PAL.ink)); }
        else Font.draw('No tools yet.', 24, 80, PAL.grey3);
        /* things */
        Font.draw('Hearts ' + Math.ceil(Inv.maxHp / 2) + '   Heart Patches ' + (Inv.patches % 4) + '/4   Buttons ' + Inv.buttons, 24, 122, PAL.ink);
        Font.draw('Knots: ' + (Inv.knots.length ? '' : 'none yet'), 24, 136, PAL.ink);
        Inv.knots.forEach((k, i) => Gfx.img(spr('knot'), 64 + i * 18, 132));
        const things = Object.keys(Inv.items).filter(k => ITEMS[k] && ITEMS[k].kind !== 'hidden');
        if (things.length) Font.draw('Also: ' + things.map(k => ITEMS[k].name).join(', '), 24, 154, PAL.grey3);
    },
    drawJournal() {
        Font.draw('{red}Now', 22, 34, PAL.ink);
        Font.wrap(Progress.goal || 'Wander.', 270).forEach((l, i) => Font.draw(l, 24, 46 + i * 10, PAL.ink));
        Font.draw('{red}Notes', 22, 82, PAL.ink);
        const notes = Progress.notes.map(n => NOTES[n]).filter(Boolean);
        if (!notes.length) Font.draw('Nothing written yet.', 24, 94, PAL.grey3);
        notes.slice(-6).forEach((n, i) => Font.draw('- ' + n.title, 24, 94 + i * 10, PAL.ink));
        const t = Stats.playFrames / 60;
        Font.draw(`Time wandering: ${Math.floor(t / 3600)}h ${Math.floor(t / 60) % 60}m`, 24, 160, PAL.grey3);
    },
};
const NOTES = {};      /* id -> { title, text } */

const Options = {
    sel: 0, focus: false,
    rows() {
        return [
            ['Music', () => Math.round(Audio.vol.music * 10), d => { Audio.vol.music = clamp(Audio.vol.music + d * 0.1, 0, 1); Audio.setVolumes(); }],
            ['Sound', () => Math.round(Audio.vol.sfx * 10), d => { Audio.vol.sfx = clamp(Audio.vol.sfx + d * 0.1, 0, 1); Audio.setVolumes(); Sfx.play('menu'); }],
            ['Text speed', () => ['slow', 'normal', 'fast'][Settings.textSpeed === 0.5 ? 0 : Settings.textSpeed === 1 ? 1 : 2], d => { const v = [0.5, 1, 2]; let i = v.indexOf(Settings.textSpeed); i = clamp(i + d, 0, 2); Settings.textSpeed = v[i]; }],
            ['Screen shake', () => Settings.shake ? 'on' : 'off', () => { Settings.shake = !Settings.shake; }],
            [Progress.flag && Progress.flag('reveal1') ? "Makers' nudges" : 'Hints', () => Settings.hints ? 'on' : 'off', () => { Settings.hints = !Settings.hints; Stats.count(Settings.hints ? 'hintsOn' : 'hintsOff'); }],
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
        const x = inMenu ? 40 : 70, y = inMenu ? 42 : 70;
        if (!inMenu) stitchedBox(60, 64, 200, 96);
        this.rows().forEach((r, i) => {
            const yy = y + i * 14;
            const on = (!inMenu || this.focus) && i === this.sel;
            if (on) Font.draw('\x02', x - 8, yy, PAL.red2);
            Font.draw(r[0], x, yy, on ? PAL.ink : PAL.grey3);
            Font.draw(String(r[1]()), x + 130, yy, on ? PAL.red2 : PAL.grey3);
        });
        if (inMenu && !this.focus) Font.draw('Press Z to change settings.', x, y + 84, PAL.grey3);
        if (inMenu) Font.draw('Keys: arrows/WASD move, Z act, X stick, C tool, Q/E tools, Enter menu, M map.', 22, 150, PAL.grey3);
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
        if ((G.t >> 3) % 2) Gfx.rect(ox + (p.x / T) * sc - 1, oy + (p.y / T) * sc - 1, 3, 3, PAL.red);
    },
};
const MAP_COL = { grass: '#9cd070', path: '#e8cc98', sand: '#f0dcb0', water: '#5aaee6', shallow: '#8ccaf0', cliff: '#8a7a6a', rock: '#7a6a5a', wall: '#5a4a4a', floor: '#e8dcc0', pit: '#2a1f2d', tree: '#3e8a48', bridge: '#c9925a', fog: '#e0dce4', void: '#e8dcc0', stairs: '#b8a890', roof: '#b0434a', current: '#5aaee6', ledge: '#b8a890', spikes: '#9a9188' };
