/* maps and things in them. A map is a grid of tile chars plus its things (ents). */
const MAPS = {};
const KINDS = {};
function kind(name, o) { KINDS[name] = Object.assign({ w: 12, h: 8, solid: false, wild: false, bound: false, figure: false, tiny: false }, o); }

let entSeq = 1;
class GameMap {
    constructor(def) {
        this.id = def.id; this.def = def;
        const rows = def.rows;
        this.h = rows.length; this.w = Math.max(...rows.map(r => r.length));
        this.tiles = new Array(this.w * this.h);
        this.ents = []; this.props = []; this.zones = def.zones || [];
        this.pw = this.w * TILE; this.ph = this.h * TILE;
        this.solid = new Uint8Array(this.w * this.h);
        const legend = def.legend || {};
        const marks = [];
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            let ch = rows[y][x] || def.fill || 'x';
            const L = legend[ch];
            if (L) { marks.push([ch, x, y]); ch = L.under || def.under || '.'; }
            this.tiles[y * this.w + x] = ch;
        }
        this.marks = marks;
        this.outside = def.outside || 'x';
    }
    /* make its things (after every map exists, so spawns can look things up) */
    populate() {
        const legend = this.def.legend || {};
        for (const [ch, x, y] of this.marks) {
            const L = legend[ch];
            if (L.spawn) L.spawn(this, x, y);
        }
        if (this.def.init) this.def.init(this);
        this.rebuildSolid();
    }
    t(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.tiles[y * this.w + x] : this.outside; }
    setT(x, y, ch) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.tiles[y * this.w + x] = ch; this.rebuildSolid(); } }
    rebuildSolid() {
        for (let i = 0; i < this.tiles.length; i++) { const tt = TT[this.tiles[i]]; this.solid[i] = tt && tt.solid ? 1 : 0; }
        for (const p of this.props) if (!p.gone) for (let j = 0; j < p.fh; j++) for (let i = 0; i < p.fw; i++) {
            const x = p.tx + i, y = p.ty + p.th - p.fh + j;
            if (p.open && p.open.some(([ox, oy]) => ox === i && oy === j)) continue;
            if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.solid[y * this.w + x] = 1;
        }
        G.solidVer = (G.solidVer || 0) + 1;
    }
    solidAt(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? 1 : this.solid[ty * this.w + tx]; }
    waterAt(tx, ty) { const tt = TT[this.t(tx, ty)]; return !!(tt && tt.water); }
    add(kindName, x, y, o) {
        const K = KINDS[kindName];
        const e = Object.assign({ id: 'e' + (entSeq++), kind: kindName, map: this, x, y, w: K.w, h: K.h, vx: 0, vy: 0, z: 0, vz: 0,
            dir: 'down', t: 0, seen: false, gone: false, solid: K.solid, wild: K.wild, bound: K.bound, figure: K.figure, tiny: K.tiny, fixed: K.fixed,
            anim: 0, st: {} }, o || {});
        e.ox = e.x; e.oy = e.y; e.odir = e.dir;
        if (K.init) K.init(e);
        e.init0 = JSON.stringify(e.st);
        this.ents.push(e);
        return e;
    }
    /* place a thing by the tile it stands on: centered on the tile, feet at its bottom */
    addAt(kindName, tx, ty, o) {
        const K = KINDS[kindName];
        const w = (o && o.w) || K.w, h = (o && o.h) || K.h;
        return this.add(kindName, tx * TILE + (TILE - w) / 2, ty * TILE + TILE - h - 1, o);
    }
    remove(e) { const i = this.ents.indexOf(e); if (i >= 0) this.ents.splice(i, 1); }
    find(id) { return this.ents.find(e => e.name === id); }
}
function ent(name) { for (const id in MAPS) { const e = MAPS[id].find(name); if (e) return e; } return null; }

/* does a thing exist right now (not gone, not too tiny for the view, not out of its hours) */
function exists(e) {
    if (e.gone || e.removed) return false;
    if (e.tiny && !(Cam.zoom >= TINY_ZOOM - 0.01 && e.map === World.map)) return false;
    const K = KINDS[e.kind];
    if (K.present && !K.present(e)) return false;
    return true;
}

/* collision: is this box blocked by the ground or by a solid thing */
function boxBlocked(map, b, self, tilesOnly) {
    if (self && self.fly) return false;   /* sparks and the like go over anything */
    const x0 = Math.floor(b.x / TILE), x1 = Math.floor((b.x + b.w - 0.01) / TILE);
    const y0 = Math.floor(b.y / TILE), y1 = Math.floor((b.y + b.h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (map.solidAt(tx, ty)) {
            if (self && self.overWater && map.waterAt(tx, ty)) continue;
            if (map.waterAt(tx, ty) && deckAt(map, tx, ty)) continue;
            if (self && self.overTall && TT[map.t(tx, ty)] && (TT[map.t(tx, ty)].low || TT[map.t(tx, ty)].water)) continue;
            return true;
        }
        if (self && self.noWater && map.waterAt(tx, ty)) return true;
    }
    if (tilesOnly) return false;
    for (const o of map.ents) {
        if (o === self || !o.solid || !exists(o) || o.held) continue;
        if (self && (self.ghostly || o.ghostly)) continue;
        if (self && (self.flick && o.figure || o.flick && self.figure)) { if (self === World.dot && overlap(b, o)) Notebook.saw('crowd'); continue; }
        if (self && self.carrying === o) continue;
        if (o.passFor && o.passFor(self)) continue;
        if (self && self.w && overlap(self, o)) continue;   /* already tangled up: let them walk apart */
        if (overlap(b, o)) return o;
    }
    if (map.blockers) for (const r of map.blockers) if (overlap(b, r)) return true;
    return false;
}
/* move with sliding; returns what stopped it on each axis */
function moveEnt(e, dx, dy) {
    const map = e.map; let hitX = null, hitY = null;
    if (dx) {
        const nb = { x: e.x + dx, y: e.y, w: e.w, h: e.h };
        const b = boxBlocked(map, nb, e);
        if (!b) e.x += dx; else {
            hitX = b;
            /* slide round corners a little, like the old games */
            if (!dy && e.corner) for (const s of [1, -1]) { const nb2 = { x: e.x + dx, y: e.y + s * 3, w: e.w, h: e.h }; if (!boxBlocked(map, nb2, e) && !boxBlocked(map, { x: e.x, y: e.y + s * 3, w: e.w, h: e.h }, e)) { e.y += s * Math.min(1, Math.abs(dx)); break; } }
        }
    }
    if (dy) {
        const nb = { x: e.x, y: e.y + dy, w: e.w, h: e.h };
        const b = boxBlocked(map, nb, e);
        if (!b) e.y += dy; else {
            hitY = b;
            if (!dx && e.corner) for (const s of [1, -1]) { const nb2 = { x: e.x + s * 3, y: e.y + dy, w: e.w, h: e.h }; if (!boxBlocked(map, nb2, e) && !boxBlocked(map, { x: e.x + s * 3, y: e.y, w: e.w, h: e.h }, e)) { e.x += s * Math.min(1, Math.abs(dy)); break; } }
        }
    }
    return [hitX, hitY];
}
const ecx = e => e.x + e.w / 2, ecy = e => e.y + e.h / 2;
const tileOf = e => [Math.floor(ecx(e) / TILE), Math.floor((e.y + e.h - 1) / TILE)];

/* props: buildings and big standing things, drawn standing and solid on their footprint */
function addProp(map, o) {
    const p = Object.assign({ fw: o.tw, fh: o.th, open: null }, o);
    map.props.push(p);
    return p;
}

/* something lying over water that can be walked on (a twig bridge, a raft) */
function deckAt(map, tx, ty) {
    const x = tx * TILE + 8, y = ty * TILE + 8;
    for (const e of map.ents) if (KINDS[e.kind].deck && exists(e) && x >= e.x - 4 && x <= e.x + e.w + 4 && y >= e.y - 6 && y <= e.y + e.h + 6) return e;
    return null;
}
