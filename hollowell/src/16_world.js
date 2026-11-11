/* Going places: building an area from its definition, putting Wren in it, warps between areas.
   An area is built fresh every time Wren arrives: everything in it is back in its place. */

const SPAWN = {
    block: (x, y, p) => new Block(x, y, p),
    wood: (x, y, p) => new Block(x, y, Object.assign({ style: 'wood' }, p)),
    marble: (x, y, p) => new Block(x, y, Object.assign({ style: 'marble' }, p)),
    stray: (x, y, p) => new Block(x, y, Object.assign({ stray: true }, p)),
    pot: (x, y, p) => new Pot(x, y, p),
    crate: (x, y, p) => new Crate(x, y, p),
    bust: (x, y, p) => new Bust(x, y, p),
    plate: (x, y, p) => new Plate(x, y, p),
    crystal: (x, y, p) => new Crystal(x, y, p),
    door: (x, y, p) => new Door(x, y, p),
    chest: (x, y, p) => new Chest(x, y, p),
    sign: (x, y, p) => new Sign(x, y, p),
    pickup: (x, y, p) => new Pickup(x * T, y * T, p),
    warp: (x, y, p) => new Warp(x, y, p),
    prop: (x, y, p) => new Prop(x, y, p),
};

class Warp extends FloorThing {
    constructor(tx, ty, props = {}) { super('warp', tx, ty, props); this.armed = false; }
    update() {
        const p = G.player;
        if (!p || p.area !== this.area || p.state !== 'normal' || Script.blocking()) return;
        const on = p.feetOn(this.tx, this.ty);
        /* only fires after Wren has stepped off it once (arriving on a warp doesn't send you back) */
        if (!on) { this.armed = true; this.told = false; return; }
        if (!this.armed) return;
        if (this.dir !== undefined && p.dir !== dirByName(this.dir)) return;
        if (this.when && !Signals.eval(this.area, this.when)) { if (this.lockedLine && !this.told) { this.told = true; UI.toast(this.lockedLine, 160); Sfx.play('hitthing'); } return; }
        this.armed = false;
        let x2 = this.tx2, y2 = this.ty2;
        if (x2 === 'door') [x2, y2] = INTERIOR_DOOR[this.to];
        World.go(this.to, x2, y2, { dir: this.face, fade: true, from: this.area.id });
    }
    draw() { }
}

const World = {
    going: false,
    build(id) {
        const def = AREAS[id];
        if (!def) throw new Error('no area ' + id);
        const a = new Area(def);
        for (const s of a._spawns) {
            const f = SPAWN[s.L.ent];
            if (f) { const e = f(s.x, s.y, Object.assign({}, s.L.props || {})); e.skey = '@' + s.x + ',' + s.y; a.add(e); }
        }
        for (const e of def.ents || []) {
            if (e.if && !Story.cond(e.if)) continue;
            const f = SPAWN[e.k];
            if (!f) { log('no spawn kind', e.k); continue; }
            const props = Object.assign({}, e); delete props.k; delete props.x; delete props.y;
            const ent = f(e.x, e.y, props); ent.skey = e.id || ('@' + e.x + ',' + e.y); a.add(ent);
        }
        /* things changed for good (pits filled with strays...) */
        const af = Progress.areaFlags[id] || {};
        for (const k in af) {
            const m = /^fill:(\d+),(\d+)$/.exec(k);
            if (m) { a.filled(+m[1], +m[2]); a.setCell(+m[1], +m[2], a.family === 'outdoor' ? ':' : ','); a.flow.delete(key2(+m[1], +m[2])); }
        }
        if (def.build) def.build(a);
        return a;
    },
    /* put Wren in an area at a tile */
    go(id, tx, ty, opts = {}) {
        if (opts.fade && !HEADLESS) {
            if (this.going) return;
            this.going = true;
            Script.run(function* () {
                yield* fadeOut(14);
                World.enter(id, tx, ty, opts);
                yield 4;
                World.going = false;
                yield* fadeIn(14);
            }, { name: 'warp' });
            return;
        }
        this.enter(id, tx, ty, opts);
    },
    enter(id, tx, ty, opts = {}) {
        const prev = G.map;
        if (prev && prev.def.onLeave) prev.def.onLeave(prev);
        /* keys don't leave their House */
        if (prev && prev.def.house && AREAS[id] && AREAS[id].def !== undefined) { }
        if (prev && prev.def.house && (!AREAS[id] || AREAS[id].house !== prev.def.house)) Story.leaveHouse(prev.def.house);
        const a = this.build(id);
        G.map = a;
        TileDraw.warm(a);
        Fx.clear(); Thrown.list = []; Shards.list = []; if (typeof GlazerShots !== 'undefined') GlazerShots.list = []; if (TOOLS.hook) TOOLS.hook.h = null;
        let p = G.player;
        if (!p) { p = G.player = new Player(0, 0); }
        if (p.carry) { p.carry = null; }
        p.grip = null;
        p.area = a;
        p.x = tx * T + 8; p.y = ty * T + 10;
        if (opts.px !== undefined) { p.x = opts.px; p.y = opts.py; }
        p.dir = opts.dir !== undefined ? (typeof opts.dir === 'string' ? dirByName(opts.dir) : opts.dir) : p.dir;
        p.state = 'normal'; p.kx = p.ky = 0; p.shove = null; p.z = 0; p.pinned = null;
        p.unstick();
        p.setMark();
        Cam.snap(p);
        Stats.enterRoom(a, Cam.room);
        Progress.set('visited:' + id);
        if (a.def.music) Music.play(typeof a.def.music === 'function' ? a.def.music() : a.def.music);
        G.region = null;
        this.checkRegion(true);
        if (a.def.onEnter) a.def.onEnter(a, opts);
        if (G.onRoomEnter) G.onRoomEnter(a, Cam.room);
        if (!opts.noSave && !G.noAutosave) Save.autosave();
    },
    checkRegion(first) {
        const p = G.player, a = G.map;
        if (!p || !a) return;
        let r = a.regionAt(p.tx, p.ty);
        if (r && r.quiet) r = a.regions.find(q => !q.quiet && p.tx >= q.x && p.ty >= q.y && p.tx < q.x + q.w && p.ty < q.y + q.h) || null;
        const name = r ? r.name : a.name;
        if (name !== G.regionName) {
            G.regionName = name;
            if (name && (!first || !a.def.quietName)) UI.showBanner(name, r && r.sub);
            const m = r && r.music;
            if (m) Music.play(m);
            if (r && r.mark !== false && a.family === 'outdoor' && p.state === 'normal') p.setMark();
        }
    },
};

/* Houses (dungeons): rooms of 20x11 tiles on a grid. cells: { "cx,cy": { rows: [11 x 20], ents, name } }.
   Room ents are in room coordinates; they're moved into place here. */
function defHouse(def) {
    const RW = 20, RH = 11;
    let mx = 0, my = 0;
    for (const k of Object.keys(def.cells)) { const [cx, cy] = k.split(',').map(Number); mx = Math.max(mx, cx + 1); my = Math.max(my, cy + 1); }
    const rows = [];
    for (let y = 0; y < my * RH; y++) rows.push(new Array(mx * RW).fill(' '));
    const ents = [], rooms = [];
    for (const [k, c] of Object.entries(def.cells)) {
        const [cx, cy] = k.split(',').map(Number);
        const ox = cx * RW, oy = cy * RH;
        if (c.rows.length !== RH) throw new Error(def.id + ' ' + k + ': ' + c.rows.length + ' rows');
        c.rows.forEach((r, y) => {
            if (r.length !== RW) throw new Error(def.id + ' ' + k + ' row ' + y + ' is ' + r.length + ' wide: ' + r);
            for (let x = 0; x < RW; x++) rows[oy + y][ox + x] = r[x];
        });
        for (const e of c.ents || []) {
            const o = Object.assign({}, e, { x: e.x + ox, y: e.y + oy, room: k });
            if (o.tx2 !== undefined && o.local) { o.tx2 += ox; o.ty2 += oy; }
            if (o.trace) o.trace = o.trace.map(([x, y]) => [x + ox, y + oy]);
            if (o.startAt) o.startAt = [o.startAt[0] + ox, o.startAt[1] + oy];
            ents.push(o);
        }
        let above = null;
        if (c.above) { const [ax, ay] = c.above.split(',').map(Number); above = { key: c.above, dx: (ax - cx) * RW, dy: (ay - cy) * RH }; }
        rooms.push({ x: ox, y: oy, w: RW, h: RH, name: c.name || '', key: k, nudge: c.nudge, dark: c.dark, above });
    }
    return defArea(Object.assign({ family: 'dungeon' }, def, { rows: rows.map(r => r.join('')), ents, rooms }));
}
