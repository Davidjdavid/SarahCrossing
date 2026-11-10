/* Areas (maps): a grid of tiles from an ASCII layout and a legend, the things in it, its rooms (the
   camera keeps to the room Wren is in) and its regions (names and music). Tiles are drawn by kind with
   the area's theme; walls, cliffs, water edges and pit lips look at their neighbours. */

/* legends shared by families of maps; a map's own legend adds to (or overrides) its family's */
const LEGENDS = {
    outdoor: {
        '.': { k: 'grass', p: 'grass' }, ',': { k: 'grass', p: 'flowers' }, '"': { k: 'grass', p: 'tallgrass' },
        ':': { k: 'path', p: 'path' }, '=': { k: 'path', p: 'cobble' }, ';': { k: 'sand', p: 'sand' },
        '~': { k: 'water', p: 'deep' }, '-': { k: 'shallow', p: 'water' }, '#': { k: 'cliff', p: 'cliff' },
        '^': { k: 'rock', p: 'cliff' }, 'o': { k: 'pit', p: 'pit' }, 'v': { k: 'ledge', p: 'ledge' },
        '_': { k: 'bridge', p: 'bridgeH' }, '|': { k: 'bridge', p: 'bridgeV' }, '%': { k: 'fog', p: 'fog' },
        'H': { k: 'stairs', p: 'stairs' }, ' ': { k: 'void', p: 'void' },
        /* currents: deep water flowing the way the arrow points (src/47_water_kit.js) */
        '>': { k: 'current', p: 'current', flow: 2 }, '<': { k: 'current', p: 'current', flow: 1 },
        'A': { k: 'current', p: 'current', flow: 3 }, 'V': { k: 'current', p: 'current', flow: 0 },
    },
    dungeon: {
        '.': { k: 'floor', p: 'floor' }, ',': { k: 'floor', p: 'floor2' }, ':': { k: 'floor', p: 'floor3' },
        '#': { k: 'wall', p: 'wall' }, 'o': { k: 'pit', p: 'pit' }, '~': { k: 'water', p: 'deep' },
        '-': { k: 'shallow', p: 'water' }, 'H': { k: 'stairs', p: 'stairs' }, '^': { k: 'spikes', p: 'spikes' },
        ' ': { k: 'void', p: 'void' }, '_': { k: 'bridge', p: 'bridgeH' }, '|': { k: 'bridge', p: 'bridgeV' },
        'v': { k: 'ledge', p: 'ledge' },
        '>': { k: 'current', p: 'current', flow: 2 }, '<': { k: 'current', p: 'current', flow: 1 },
        'A': { k: 'current', p: 'current', flow: 3 }, 'V': { k: 'current', p: 'current', flow: 0 },
    },
    interior: {
        '.': { k: 'floor', p: 'floor' }, ',': { k: 'floor', p: 'floor2' }, ':': { k: 'floor', p: 'floor3' },
        '#': { k: 'wall', p: 'wall' }, ' ': { k: 'void', p: 'void' }, 'H': { k: 'stairs', p: 'stairs' },
        'o': { k: 'pit', p: 'pit' },
    },
};

const AREAS = {};            /* id -> definition (data files fill this) */
function defArea(def) { AREAS[def.id] = def; return def; }

class Area {
    constructor(def) {
        this.def = def;
        this.id = def.id;
        this.name = def.name || '';
        this.theme = THEMES[def.theme] || THEMES.town;
        this.themeName = def.theme;
        this.family = def.family || 'outdoor';
        const rows = Array.isArray(def.rows) ? def.rows : def.rows.split('\n').filter(r => r.length);
        this.h = rows.length;
        this.w = Math.max(...rows.map(r => r.length));
        this.legend = Object.assign({}, LEGENDS[this.family], def.legend || {});
        this.cells = new Array(this.w * this.h);
        this.chars = new Array(this.w * this.h);
        this.ents = [];
        this.occ = new Map();               /* "x,y" -> the grid thing standing there */
        this.rooms = (def.rooms || [{ x: 0, y: 0, w: this.w, h: this.h }]).map((r, i) => Object.assign({ i }, r));
        this.regions = def.regions || [];
        this.flow = new Map();              /* "x,y" -> direction of a current */
        this.overlays = [];
        this.staticSolid = new Set();       /* tiles blocked by buildings, trees and other props */
        const spawns = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const ch = rows[y][x] === undefined ? ' ' : rows[y][x];
                let L = this.legend[ch];
                if (!L) { L = this.legend['.']; }
                this.chars[y * this.w + x] = ch;
                this.cells[y * this.w + x] = L;
                if (L.ent) spawns.push({ x, y, L });
                if (L.flow !== undefined) this.flow.set(key2(x, y), L.flow);
            }
        }
        this._spawns = spawns;
    }

    inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    cell(x, y) { return this.inside(x, y) ? this.cells[y * this.w + x] : this.legend[' '] || { k: 'void' }; }
    kind(x, y) {
        if (this.staticSolid.size && this.staticSolid.has(y * 4096 + x)) return TK.prop;
        return TK[this.cell(x, y).k] || TK.void;
    }
    kindName(x, y) { return this.cell(x, y).k; }
    setCell(x, y, ch) { if (this.inside(x, y)) { this.cells[y * this.w + x] = this.legend[ch]; this.chars[y * this.w + x] = ch; this._dirty = true; } }

    /* who is standing on a tile (grid things only) */
    at(x, y) { return this.occ.get(key2(x, y)) || null; }
    place(e, x, y) { this.occ.set(key2(x, y), e); }
    unplace(e, x, y) { if (this.occ.get(key2(x, y)) === e) this.occ.delete(key2(x, y)); }

    /* can a grid thing of this weight move onto the tile? (pits and water are allowed: it falls or floats) */
    freeForThing(x, y, e) {
        if (!this.inside(x, y)) return false;
        const k = this.kind(x, y);
        if ((k.solid && !(k.crawl && e && e.small)) || k.ledge) return false;
        /* a little hole: only small things fit down it */
        if (k.pit && e && e.isGrid && !e.small && this.cell(x, y).narrow) return false;
        if (k.fog) return false;
        const o = this.at(x, y);
        if (o && o !== e) return false;
        /* gates and other blockers that aren't grid things */
        for (const b of this.blockers) if (b.blocks(x, y, e)) return false;
        /* the player and walkers occupy tiles too */
        const pl = G.player;
        if (e && e.isGrid && pl && pl.area === this && !pl.dead && pl.onTile(x, y) && e !== pl && !(e.floats && pl.tx === e.tx && pl.ty === e.ty)) return false;   /* (a float isn't blocked by whoever's riding it) */
        if (e && e.isGrid && pl && pl.area === this && pl.shove && tileOf(pl.shove.tx) === x && tileOf(pl.shove.ty) === y) return false;   /* (nor where she's being shoved to: two can't land on one tile) */
        for (const m of this.walkers) if (m !== e && m.alive !== false && m.onTile && m.onTile(x, y)) return false;
        return true;
    }

    roomAt(tx, ty) {
        for (const r of this.rooms) if (tx >= r.x && ty >= r.y && tx < r.x + r.w && ty < r.y + r.h) return r;
        return null;
    }
    regionAt(tx, ty) {
        for (const r of this.regions) if (tx >= r.x && ty >= r.y && tx < r.x + r.w && ty < r.y + r.h) return r;
        return null;
    }

    get blockers() { return this._blockers || (this._blockers = []); }
    get walkers() { return this._walkers || (this._walkers = []); }
    add(e) {
        e.area = this;
        this.ents.push(e);
        if (e.blocks && e.staticBlock) { for (const [dx, dy] of e.solid) this.staticSolid.add((e.ty + dy) * 4096 + (e.tx + dx)); }
        else if (e.blocks) this.blockers.push(e);
        if (e.isWalker) this.walkers.push(e);
        if (e.onAdd) e.onAdd(this);
        return e;
    }
    remove(e) {
        e.removed = true;
        const i = this.ents.indexOf(e); if (i >= 0) this.ents.splice(i, 1);
        const j = this.blockers.indexOf(e); if (j >= 0) this.blockers.splice(j, 1);
        const k = this.walkers.indexOf(e); if (k >= 0) this.walkers.splice(k, 1);
        if (e.isGrid) {
            this.unplace(e, e.tx, e.ty);
            /* (a thing taken away mid-step, or wider than a tile, holds other tiles too: let them all go) */
            for (const [k, o] of [...this.occ]) if (o === e) this.occ.delete(k);
        }
    }
    find(id) { return this.ents.find(e => e.id === id); }
    all(kind) { return this.ents.filter(e => e.kind === kind); }
}

/* ---------- drawing the ground ---------- */
const TileDraw = {
    frame: 0, warmed: new Set(),
    /* every tile of a place painted once, when it's first entered (the screen is fading then): walking into a room
       never stops to paint its floor (a hitch, on a slow machine) */
    warm(area) {
        if (HEADLESS || this.warmed.has(area.id)) return;
        this.warmed.add(area.id);
        const scratch = this._scratch || (this._scratch = Gfx.makeCanvas(T, T)), c0 = Gfx.ctx;
        Gfx.ctx = scratch.getContext('2d');
        try { for (let ty = 0; ty < area.h; ty++) for (let tx = 0; tx < area.w; tx++) this.draw(area, tx, ty, 0, 0); }
        catch (e) { } finally { Gfx.ctx = c0; }
    },
    draw(area, tx, ty, sx, sy) {
        const L = area.cell(tx, ty);
        const tn = area.def.themeAt ? area.def.themeAt(tx, ty) : area.themeName, th = THEMES[tn] || area.theme;
        const v = Math.floor(hash2(tx, ty, 99) * 4);
        let c;
        const p = L.p;
        const same = (dx, dy, kinds) => { const k = area.cell(tx + dx, ty + dy).k; return kinds.includes(k); };
        switch (p) {
            case 'grass': c = tileCanvas(`${tn}:grass:${v}`, x => Paint.grass(x, th, v)); break;
            case 'flowers': c = tileCanvas(`${tn}:flowers:${v}`, x => Paint.flowers(x, th, v + 4)); break;
            case 'tallgrass': c = tileCanvas(`${tn}:tall:${v % 2}`, x => Paint.tallgrass(x, th, v)); break;
            case 'path': c = tileCanvas(`${tn}:path:${v}`, x => Paint.path(x, th, v)); break;
            case 'cobble': c = tileCanvas(`${tn}:cobble:${v % 2}`, x => Paint.cobble(x, th, v)); break;
            case 'sand': c = tileCanvas(`${tn}:sand:${v}`, x => Paint.sand(x, th, v)); break;
            case 'water': case 'deep': case 'current': {
                const f = Math.floor(this.frame / 20) % 8;
                const land = k => !['water', 'shallow', 'current', 'void', 'bridge', 'bridgew'].includes(k);
                const n = land(area.cell(tx, ty - 1).k) ? 1 : 0, s = land(area.cell(tx, ty + 1).k) ? 1 : 0;
                const w = land(area.cell(tx - 1, ty).k) ? 1 : 0, e = land(area.cell(tx + 1, ty).k) ? 1 : 0;
                const mask = n | s << 1 | w << 2 | e << 3;
                c = tileCanvas(`${tn}:${p}:${v}:${f}:${mask}`, x => {
                    (p === 'water' ? Paint.water : Paint.deep)(x, th, v, f);
                    const foam = th.water[2], edge = shade(th.water[3], -0.1);
                    const wob = i => (Math.floor(hash2(i, f, 3) * 2));
                    if (n) { fill(x, edge, 0, 0, 16, 2); for (let i = 0; i < 16; i++) px(x, i, 2 + wob(i), foam); }
                    if (s) { for (let i = 0; i < 16; i++) px(x, i, 14 - wob(i + 5), foam); }
                    if (w) { fill(x, edge, 0, 0, 2, 16); for (let i = 0; i < 16; i++) px(x, 2 + wob(i + 9), i, foam); }
                    if (e) { for (let i = 0; i < 16; i++) px(x, 14 - wob(i + 2), i, foam); }
                });
                break;
            }
            case 'pit': {
                const lipN = !['pit', 'void'].includes(area.cell(tx, ty - 1).k);
                c = tileCanvas(`pit:${lipN}`, x => {
                    Paint.pit(x, th);
                    if (lipN) { fill(x, '#3a2a34', 0, 0, 16, 3); fill(x, '#221722', 0, 3, 16, 2); }
                });
                break;
            }
            case 'cliff': {
                const cl = k => k === 'cliff' || k === 'rock';
                const below = cl(area.cell(tx, ty + 1).k), above = cl(area.cell(tx, ty - 1).k);
                const left = cl(area.cell(tx - 1, ty).k), right = cl(area.cell(tx + 1, ty).k);
                const mask = (below ? 1 : 0) | (above ? 2 : 0) | (left ? 4 : 0) | (right ? 8 : 0);
                c = tileCanvas(`${tn}:cliff:${v}:${mask}`, x => this.cliff(x, th, v, below, above, left, right));
                break;
            }
            case 'ledge': c = tileCanvas(`${tn}:ledge:${v}`, x => {
                /* indoors a ledge is the floor's edge; outdoors, grass */
                if (th.grass) Paint.grass(x, th, v); else if (FLOORS[tn] && FLOORS[tn].floor) FLOORS[tn].floor(x, th, v); else fill(x, (th.floor || ['#c8b898'])[0]);
                fill(x, th.stone[3], 0, 10, 16, 2); fill(x, th.stone[1], 0, 12, 16, 3); fill(x, th.stone[2], 0, 12, 16, 1);
                fill(x, shade(th.stone[3], -0.3), 0, 15, 16, 1);
            }); break;
            case 'bridgeH': case 'bridgeV': c = tileCanvas(`bridge:${p}:${v}`, x => {
                const cols = ['#c9925a', '#9a6438', '#e6c08a', '#6b4128'];
                Paint.planks(x, cols, v, p === 'bridgeH');
                if (p === 'bridgeH') { fill(x, '#45281c', 0, 0, 16, 1); fill(x, '#45281c', 0, 15, 16, 1); }
                else { fill(x, '#45281c', 0, 0, 1, 16); fill(x, '#45281c', 15, 0, 1, 16); }
            }); break;
            case 'stairs': c = tileCanvas(`${tn}:stairs`, x => {
                const s = th.stone || th.wall;
                for (let i = 0; i < 4; i++) { fill(x, s[2], 0, i * 4, 16, 1); fill(x, s[0], 0, i * 4 + 1, 16, 2); fill(x, s[3], 0, i * 4 + 3, 16, 1); }
            }); break;
            case 'fog': {
                const f = Math.floor(this.frame / 12) % 8;
                c = tileCanvas(`fog:${v}:${f}`, x => {
                    fill(x, '#d8d4dc');
                    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
                        const r = hash2(i + f * 2, j, v + 40);
                        if (r < 0.25) px(x, i, j, '#eeeaf2'); else if (r > 0.85) px(x, i, j, '#c4bfcc');
                    }
                    /* the fine lines no one looks at closely */
                    x.globalAlpha = 0.18; for (let i = 0; i < 16; i += 3) fill(x, '#ffffff', (i + f) % 16, 0, 1, 16); x.globalAlpha = 1;
                });
                break;
            }
            case 'void': c = tileCanvas('void', x => fill(x, PAL.night)); break;
            case 'forest': c = tileCanvas(`${tn}:forest:${v}`, x => { fill(x, shade(th.grass[3], -0.35)); speckle(x, [shade(th.grass[3], -0.2)], v + 9, 0.15); }); break;
            case 'spikes': c = tileCanvas(`${tn}:spikes`, x => {
                this.floor(x, area, 'floor', v, tn);
                for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
                    const bx = 2 + i * 8, by = 3 + j * 8;
                    fill(x, '#5a5060', bx, by + 3, 5, 2);
                    px(x, bx + 2, by, '#e4e0ea'); fill(x, '#b8b2c4', bx + 1, by + 1, 3, 1); fill(x, '#8a8296', bx, by + 2, 5, 1);
                }
            }); break;
            case 'wall': {
                const isW = k => k === 'wall' || k === 'void';
                const below = isW(area.cell(tx, ty + 1).k);
                const mask = (below ? 1 : 0) | (isW(area.cell(tx, ty - 1).k) ? 2 : 0) | (isW(area.cell(tx - 1, ty).k) ? 4 : 0) | (isW(area.cell(tx + 1, ty).k) ? 8 : 0);
                c = tileCanvas(`${tn}:wall:${v}:${mask}`, x => Walls.draw(x, area, tn, th, v, mask));
                break;
            }
            default: {
                /* floors, by theme */
                c = tileCanvas(`${tn}:${p}:${v}`, x => this.floor(x, area, p, v, tn));
            }
        }
        Gfx.img(c, sx, sy);
    },

    cliff(x, th, v, below, above, left, right) {
        const [s0, s1, s2, s3] = th.stone;
        fill(x, s1);
        /* rock strata */
        for (let j = 0; j < 16; j += 4) {
            const off = Math.floor(hash2(v, j, 6) * 6);
            fill(x, s0, 0, j + 1, 16, 2);
            for (let i = off; i < 16; i += 7) { fill(x, s3, i, j, 1, 4); px(x, i + 1, j + 1, s2); }
            fill(x, mix(s1, s3, 0.5), 0, j + 3, 16, 1);
        }
        if (!above) { fill(x, th.grass ? th.grass[0] : s2, 0, 0, 16, 3); fill(x, th.grass ? th.grass[3] : s3, 0, 3, 16, 1); }
        if (!left) fill(x, s3, 0, 0, 1, 16);
        if (!right) fill(x, s3, 15, 0, 1, 16);
        if (!below) { fill(x, shade(s3, -0.35), 0, 14, 16, 2); }
    },

    floor(x, area, p, v, tn0) {
        const tn = tn0 || area.themeName, th = THEMES[tn] || area.theme;
        const F = FLOORS[tn] && FLOORS[tn][p];
        if (F) return F(x, th, v);
        if (th.floor) { fill(x, th.floor[0]); speckle(x, [th.floor[2]], v + 3, 0.06); return; }
        Paint.grass(x, th, v);
    },
};

/* floor painters for interiors and Houses, by theme then legend painter name */
const FLOORS = {
    tidy: {
        floor: (x, th) => Paint.checker(x, '#efe4cc', '#3a4656'),
        floor2: (x, th, v) => Paint.carpet(x, '#9a3a4a', '#c45a6a', '#6e2232'),
        floor3: (x, th, v) => Paint.planks(x, ['#c9925a', '#9a6438', '#e6c08a', '#6b4128'], v, true),
        /* a kitchen counter, low enough to throw things over: a tiled cream top with a lip, painted cupboard doors (or
           drawers) under it, and its shadow on the boards at its foot */
        counter: (x, th, v) => {
            FLOORS.tidy.floor3(x, th, v);
            fill(x, '#3a2a30', 0, 0, 16, 1); fill(x, '#f4ecdc', 0, 1, 16, 5); fill(x, '#fffaf0', 0, 1, 16, 1);
            for (const i of [3, 7, 11, 15]) fill(x, '#ddd0b6', i, 2, 1, 4);
            fill(x, '#ddd0b6', 0, 3, 16, 1);
            fill(x, '#fbf6ea', 0, 6, 16, 1); fill(x, '#a89878', 0, 7, 16, 1);
            fill(x, '#245a54', 0, 8, 16, 6);
            if (v === 3) {
                for (const j of [8, 10, 12]) { fill(x, '#4fa89c', 1, j, 14, 1); fill(x, '#3c8a80', 1, j + 1, 14, 1); px(x, 7, j + 1, '#e8b04a'); px(x, 8, j + 1, '#e8b04a'); }
            } else {
                fill(x, '#3c8a80', 1, 8, 6, 5); fill(x, '#3c8a80', 9, 8, 6, 5);
                fill(x, '#5fb7a8', 1, 8, 6, 1); fill(x, '#5fb7a8', 9, 8, 6, 1); fill(x, '#5fb7a8', 1, 8, 1, 5); fill(x, '#5fb7a8', 9, 8, 1, 5);
                fill(x, '#2e7068', 3, 10, 3, 2); fill(x, '#2e7068', 11, 10, 3, 2);
                px(x, 6, 10, '#e8b04a'); px(x, 9, 10, '#e8b04a');
            }
            fill(x, '#2a1f2d', 0, 13, 16, 2);
            x.globalAlpha = 0.4; fill(x, '#2a1f2d', 0, 15, 16, 1); x.globalAlpha = 1;
        },
    },
    house: {
        floor: (x, th, v) => Paint.planks(x, ['#c9925a', '#9a6438', '#e6c08a', '#7b4a2c'], v, false),
        floor2: (x, th, v) => Paint.carpet(x, '#b0434a', '#d06a6a', '#7a2a32'),
        floor3: (x, th) => Paint.checker(x, '#efe4cc', '#c9b896'),
    },
};

/* walls seen from above at a slant: the face shows where the tile below is open floor */
const Walls = {
    draw(x, area, tn, th, v, mask) {
        const below = mask & 1, above = mask & 2, left = mask & 4, right = mask & 8;
        const W = WALLS[tn] || WALLS.default;
        if (!below) W.face(x, th, v);
        else W.top(x, th, v);
        const edge = W.edge || '#1a1418';
        /* outline the wall's top where it meets floor */
        if (below) {
            if (!left) fill(x, edge, 0, 0, 1, 16);
            if (!right) fill(x, edge, 15, 0, 1, 16);
            if (!above) fill(x, edge, 0, 0, 16, 1);
        } else {
            if (!above) fill(x, edge, 0, 0, 16, 1);
            if (!left) fill(x, edge, 0, 0, 1, 16);
            if (!right) fill(x, edge, 15, 0, 1, 16);
        }
    },
};
const WALLS = {
    default: {
        top: (x, th) => { const c = th.wall || th.stone; fill(x, c[3]); speckle(x, [shade(c[3], 0.1)], 4, 0.1); },
        face: (x, th, v) => { const c = th.wall || th.stone; Paint.bricks(x, c, v); fill(x, shade(c[3], -0.3), 0, 15, 16, 1); },
    },
    tidy: {
        edge: '#142424',
        top: (x, th) => { fill(x, '#245a54'); speckle(x, ['#2c6a63'], 4, 0.12); },
        face: (x, th, v) => {
            /* teal damask paper over a wooden wainscot */
            fill(x, '#5fb7a8');
            for (let j = 1; j < 10; j += 4) for (let i = (j % 8 === 1 ? 2 : 6); i < 16; i += 8) {
                px(x, i, j, '#8fd6c8'); px(x, i - 1, j + 1, '#8fd6c8'); px(x, i + 1, j + 1, '#8fd6c8'); px(x, i, j + 2, '#8fd6c8');
                px(x, i, j + 1, '#3c8a80');
            }
            fill(x, '#9a3a4a', 0, 10, 16, 1);
            fill(x, '#b0785a', 0, 11, 16, 4); fill(x, '#d09a74', 0, 11, 16, 1);
            for (let i = 3; i < 16; i += 5) fill(x, '#7a4e38', i, 12, 1, 3);
            fill(x, '#4a2e22', 0, 15, 16, 1);
        },
    },
    house: {
        edge: '#2a1a14',
        top: (x) => { fill(x, '#5a3a28'); speckle(x, ['#6a4632'], 4, 0.12); },
        face: (x, th, v) => {
            fill(x, '#e9d9b4'); speckle(x, ['#dccaa2'], 8 + v, 0.2);
            for (let i = 0; i < 16; i += 8) fill(x, '#cdb88c', i, 0, 1, 11);
            fill(x, '#8a5a3c', 0, 11, 16, 1); fill(x, '#b07a50', 0, 12, 16, 3); fill(x, '#5a3a28', 0, 15, 16, 1);
        },
    },
};
