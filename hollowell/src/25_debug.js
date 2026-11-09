/* Debug tools and the test API. play.html?debug turns on F1 (the debug panel); window.HW is how the
   tests (and the autopilot) drive the game: start a game, warp, give tools, set a preset, step frames,
   press buttons, walk to a tile, run a list of commands. */

const Auto = {
    plan: null,
    /* walk Wren to a tile along a path that avoids solid things */
    walk(tx, ty, opts = {}) {
        const p = G.player;
        const path = playerPath(p.area, p.tx, p.ty, tx, ty);
        if (!path) return false;
        this.plan = { kind: 'walk', path, i: 0, stuck: 0, opts };
        return true;
    },
    active() { return !!this.plan; },
    update() {
        const pl = this.plan; if (!pl) return;
        const p = G.player;
        Input.virt = {};
        if (p.state !== 'normal' || Cam.busy || Script.blocking()) return;
        if (pl.kind === 'walk') {
            if (pl.i >= pl.path.length) { this.plan = null; return; }
            const [tx, ty] = pl.path[pl.i];
            const gx = tx * T + 8, gy = ty * T + 10;
            const dx = gx - p.x, dy = gy - p.y;
            if (Math.abs(dx) <= 1.4 && Math.abs(dy) <= 1.4) { pl.i++; pl.stuck = 0; if (pl.i >= pl.path.length) { p.x = gx; p.y = gy; this.plan = null; } return; }
            if (Math.abs(dx) > 1.4) Input.virt[dx < 0 ? 'left' : 'right'] = true;
            if (Math.abs(dy) > 1.4) Input.virt[dy < 0 ? 'up' : 'down'] = true;
            if (++pl.stuck > 240) { this.plan = null; this.failed = 'stuck walking to ' + tx + ',' + ty; }
        }
    },
};
/* a path for Wren: tiles Wren can stand in */
function playerPath(area, sx, sy, gx, gy) {
    const p = G.player;
    const ok = (x, y) => { if (!area.inside(x, y)) return false; const k = area.kind(x, y); if (k.solid || k.pit || k.deep || k.ledge || k.fog) return false; if (area.at(x, y)) return false; return !area.blockers.some(b => b.blocks(x, y, p)); };
    if (sx === gx && sy === gy) return [[gx, gy]];
    const q = [[sx, sy]], prev = new Map([[key2(sx, sy), null]]);
    while (q.length) {
        const [x, y] = q.shift();
        for (let d = 0; d < 4; d++) {
            const nx = x + DX[d], ny = y + DY[d], k = key2(nx, ny);
            if (prev.has(k) || !ok(nx, ny)) continue;
            prev.set(k, [x, y]);
            if (nx === gx && ny === gy) {
                const path = []; let c = [nx, ny];
                while (c) { path.unshift(c); c = prev.get(key2(c[0], c[1])); }
                return path;
            }
            q.push([nx, ny]);
        }
    }
    return null;
}

const PRESETS = {};    /* name -> () => sets up a game state (the content files add these) */

const HW = {
    G, Inv, Progress, Stats, Save, World, Script, Input, Return, AREAS, ERRORS, LOG, PRESETS, Auto, Story, Dialog, Cam, spr, get ART() { return ART; },
    newGame(name = 'Wren', opts = {}) { G.noAutosave = !!opts.noAutosave; Game.newGame(name, opts); if (opts.skipIntro) { Script.clear(); Dialog.active = false; UI.fadeA = 0; } return this.state(); },
    warp(id, x, y, dir) { World.enter(id, x, y, { dir }); return this.state(); },
    preset(name) { PRESETS[name](); return this.state(); },
    give(id) { if (ITEMS[id] && ITEMS[id].kind === 'tool') Inv.giveTool(id); else Inv.items[id] = (Inv.items[id] || 0) + 1; },
    step(n = 1) { for (let i = 0; i < n; i++) Game.step(); },
    /* hold buttons for n steps then let go */
    press(btns, n = 2) { btns = [].concat(btns); for (let i = 0; i < n; i++) { Input.virt = {}; for (const b of btns) Input.virt[b] = true; Game.step(); } Input.virt = {}; Game.step(); },
    hold(btns) { Input.virt = {}; for (const b of [].concat(btns)) Input.virt[b] = true; },
    release() { Input.virt = {}; },
    /* talk through any open dialogue (picking choice i when asked) */
    skipTalk(choice = 0, max = 4000) {
        for (let n = 0; n < max && (Dialog.active || Script.blocking()); n++) {
            if (Dialog.active && Dialog.shown >= Dialog.pageLen()) {
                if (Dialog.choices && Dialog.page === Dialog.pages.length - 1) { Dialog.sel = choice; }
                this.press('act', 1);
            } else this.step(1);
        }
        return !Dialog.active;
    },
    walkTo(tx, ty, max = 3000) {
        if (!Auto.walk(tx, ty)) return false;
        for (let n = 0; n < max && Auto.active(); n++) { Auto.update(); Game.step(); }
        Input.virt = {};
        const p = G.player;
        return p.tx === tx && p.ty === ty;
    },
    /* face a direction without moving (a tap) */
    face(d) { G.player.dir = typeof d === 'string' ? dirByName(d) : d; },
    /* push the thing in front n tiles (walk into it) */
    push(d, n = 1) {
        const dn = typeof d === 'string' ? d : DIR_NAME[d], di = dirByName(dn);
        for (let i = 0; i < n; i++) {
            let moved = null, steps = 0;
            this.hold(dn);
            while (steps++ < 160 && !moved) {
                Game.step();
                const p = G.player, f = p.front();
                const o = p.area.at(f.tx, f.ty);
                if (o && o.mv) moved = o;
            }
            while (moved && moved.mv && steps++ < 260) Game.step();
            this.release(); Game.step();
        }
    },
    /* stand-in for aiming in a fight: hit a creature as a thrown pot or a slam would */
    hitEnemy(e) {
        if (!e.alive) return;
        if (e.shoved && e.type === 'housekeeper') { if (e.state !== 'stunned') e.shoved(DOWN, 10, { weight: 3 }); for (let i = 0; i < 12; i++) Game.step(); e.flash = 0; e.struck(G.player, 1, UP); return; }
        e.flash = 0; e.struck({ isGrid: true, weight: 1 }, 1, -1, true);
    },
    state() {
        const p = G.player;
        return { scene: G.scene, area: G.map && G.map.id, tx: p && p.tx, ty: p && p.ty, x: p && p.x, y: p && p.y, hp: Inv.hp, state: p && p.state, errors: ERRORS.length, dialog: Dialog.active };
    },
    player() { return G.player; },
    at(x, y) { return G.map.at(x, y); },
    ents(kind) { return G.map.ents.filter(e => !kind || e.kind === kind); },
    find(id) { return G.map.find(id); },
};
if (!HEADLESS) window.HW = HW; else globalThis.HW = HW;

const Debug = {
    open: false, sel: 0, page: 'main', scroll: 0,
    toggle() { this.open = !this.open; this.page = 'main'; this.sel = 0; },
    items() {
        if (this.page === 'warp') return Object.keys(AREAS).map(id => [id, () => { const d = AREAS[id]; const e = d.entry || d.spawn || { x: 2, y: 2 }; World.enter(id, e.x, e.y); this.open = false; }]).concat([['< back', () => { this.page = 'main'; this.sel = 0; }]]);
        if (this.page === 'preset') return Object.keys(PRESETS).map(id => [id, () => { PRESETS[id](); this.open = false; }]).concat([['< back', () => { this.page = 'main'; this.sel = 0; }]]);
        return [
            ['Warp...', () => { this.page = 'warp'; this.sel = 0; }],
            ['Presets...', () => { this.page = 'preset'; this.sel = 0; }],
            ['All tools', () => TOOL_ORDER.forEach(t => Inv.giveTool(t))],
            ['Heal, +10 hearts', () => { Inv.maxHp = Math.max(Inv.maxHp, 26); Inv.hp = Inv.maxHp; }],
            ['God mode: ' + (G.cheats.god ? 'on' : 'off'), () => { G.cheats.god = !G.cheats.god; }],
            ['Noclip: ' + (G.cheats.noclip ? 'on' : 'off'), () => { G.cheats.noclip = !G.cheats.noclip; }],
            ['+100 buttons', () => { Inv.buttons += 100; }],
            ['Give keys (this House)', () => { const h = G.map.def.house; if (h) Inv.keyCount[h] = Inv.keys(h) + 5; }],
            ['Give Pattern + plan', () => { const h = G.map.def.house; if (h) { Inv.patterns.push(h); Inv.plans.push(h); } }],
            ['Show tile grid: ' + (G.cheats.grid ? 'on' : 'off'), () => { G.cheats.grid = !G.cheats.grid; }],
            ['Close', () => { this.open = false; }],
        ];
    },
    update() {
        const it = this.items();
        if (Input.pressed('up')) this.sel = (this.sel + it.length - 1) % it.length;
        if (Input.pressed('down')) this.sel = (this.sel + 1) % it.length;
        if (Input.pressed('act')) { it[this.sel][1](); Input.swallow(); }
        if (Input.pressed('atk')) { if (this.page !== 'main') { this.page = 'main'; this.sel = 0; } else this.open = false; }
        this.scroll = clamp(this.sel - 6, 0, Math.max(0, it.length - 13));
    },
    draw() {
        if (!this.open) return;
        Gfx.alpha(0.85); Gfx.rect(170, 4, 146, 172, '#101018'); Gfx.alpha(1);
        Font.draw('DEBUG ' + (G.map ? G.map.id + ' ' + G.player.tx + ',' + G.player.ty : ''), 174, 7, PAL.yellow);
        this.items().slice(this.scroll, this.scroll + 14).forEach(([n], i) => {
            const j = i + this.scroll;
            Font.draw((j === this.sel ? '> ' : '  ') + n, 174, 19 + i * 11, j === this.sel ? PAL.white : '#a0a0b0');
        });
    },
};
