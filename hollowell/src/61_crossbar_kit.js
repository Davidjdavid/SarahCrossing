/* Puppets, for Larkspur Fair and the Marionette Hall (House 6). The Crossbar: press C at a puppet in sight to
   take its strings; while you hold them you stand still and the arrows walk the puppet a tile at a time; press
   C (or Z) again to let go, and the puppet walks home along its trace like anything else. A rack holds the
   strings of several puppets at once: take the rack and they all step together (each that can). Puppets are as
   heavy as a person (plates feel them), small enough for the little holes in the walls, and don't mind spikes.
   Also here: toy soldiers that march in a line and turn at walls, and painted flats (scenery that looks like
   wall, until a knock shows it's cardboard). */

const Crossbar = {
    REACH: 8,
    ctl: null,           /* { puppets: [...], rack } while Wren holds the strings */
    repeat: 0,
    sightOf(p) {
        const a = p.area, room = a.rooms && a.rooms.length > 1 ? a.roomAt(p.tx, p.ty) : null;
        return e => Math.hypot(e.tx - p.tx, e.ty - p.ty) <= this.REACH && (!room || a.roomAt(e.tx, e.ty) === room) && this.clear(a, p.tx, p.ty, e.tx, e.ty);
    },
    /* indoors, walls are in the way (little holes aren't); outdoors you can see up a cliff or over a fence */
    clear(a, x0, y0, x1, y1) {
        if (a.family === 'outdoor') return true;
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
        for (let i = 1; i < n; i++) {
            const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
            if ((x === x0 && y === y0) || (x === x1 && y === y1)) continue;
            const k = a.kind(x, y);
            if (k.solid && !k.crawl) return false;
        }
        return true;
    },
    /* a puppet on a rack is only worked from its rack */
    onRack(e) { return !!e.group && e.area.ents.some(o => o.kind === 'rack' && o.group === e.group && !o.removed); },
    /* what C would take: a rack in front, else the nearest puppet in sight on the side Wren faces */
    target(p) {
        const a = p.area, f = p.front(), o = a.at(f.tx, f.ty);
        if (o && o.kind === 'rack') return { rack: o, puppets: a.ents.filter(e => e.kind === 'puppet' && e.group === o.group && !e.removed) };
        const seen = this.sightOf(p);
        let best = null, bd = Infinity;
        for (const e of a.ents) {
            if (e.kind !== 'puppet' || e.removed || this.onRack(e) || !seen(e)) continue;
            const dx = e.tx - p.tx, dy = e.ty - p.ty;
            if (DX[p.dir] * dx + DY[p.dir] * dy <= 0) continue;
            const d = Math.hypot(dx, dy);
            if (d < bd) { bd = d; best = e; }
        }
        return best ? { puppets: [best] } : null;
    },
    take(p) {
        const t = this.target(p);
        if (!t || !t.puppets.length) { UI.toast(this.hinted ? 'No puppet in sight.' : 'Face a puppet (or a crossbar rack) and press [tool] to take its strings.'); this.hinted = true; return; }
        this.ctl = t; p.pinned = 'crossbar';
        for (const e of t.puppets) { e.heldBy = p; e.worked = true; if (e.ret) e.ret.timer = e.ret.patience; }
        Sfx.play('twang'); Stats.count('crossbar');
        if (!Progress.flag('crossbar_first')) { Progress.set('crossbar_first'); UI.toast('Arrows walk the puppet. [tool] again to let go.', 150); }
    },
    release(p) {
        const c = this.ctl; if (!c) return;
        this.ctl = null;
        if (p && p.pinned === 'crossbar') p.pinned = null;
        for (const e of c.puppets) {
            e.heldBy = null; e.worked = false;
            /* let go, a puppet goes home (after its patience, like anything else: time to take the strings up again) */
            if (e.ret && e.ret.state !== 'home') { e.ret.state = 'away'; e.ret.timer = e.ret.patience; }
        }
        Sfx.play('unclick');
    },
    update(area) {
        const p = G.player, c = this.ctl;
        if (!c) return;
        if (!p || p.area !== area || p.state !== 'normal' || c.puppets.some(e => e.removed || e.area !== area)) { this.release(p); return; }
        if (Script.blocking()) return;
        if (Input.pressed('act') || Inv.equipped !== 'crossbar') { this.release(p); return; }
        const ax = Input.axis();
        if (!ax.x && !ax.y) { this.repeat = 0; return; }
        if (c.puppets.some(e => e.mv)) return;
        if (this.repeat > 0) { this.repeat--; return; }
        const d = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
        let moved = false;
        /* the ones in front go first, so a line steps together */
        const order = c.puppets.slice().sort((m, n) => (DX[d] * (n.tx - m.tx) + DY[d] * (n.ty - m.ty)));
        const going = [];
        for (const e of order) {
            e.dir = d;
            /* a puppet just stepping off the tile ahead has as good as left it */
            for (const m of going) if (m.mv && m.mv.fx === e.tx + DX[d] && m.mv.fy === e.ty + DY[d]) area.unplace(m, m.mv.fx, m.mv.fy);
            if (e.step(d)) { moved = true; going.push(e); }
        }
        if (moved) { this.repeat = 2; Sfx.play('step', 0.4); }
        else if (!this.bumped) { this.bumped = 8; Sfx.play('hitthing', 0.3); }
        if (this.bumped > 0) this.bumped--;
    },
    draw(cx, cy) {
        const c = this.ctl, p = G.player;
        if (!c || !p) return;
        const hx = p.x - cx, hy = p.y - cy - 24;
        Gfx.rect(hx - 6, hy, 12, 2, '#9a6438'); Gfx.rect(hx - 1, hy - 2, 2, 6, '#9a6438');
        for (const e of c.puppets) Threads.stroke(hx, hy, e.px - cx + 8, e.py - cy - 14, THREAD.jory);
    },
};

TOOLS.crossbar = {
    use(p) { if (Crossbar.ctl) Crossbar.release(p); else Crossbar.take(p); },
    update(area) { Crossbar.update(area); },
    draw(cx, cy) { Crossbar.draw(cx, cy); },
};

/* a puppet: a wooden figure on a stand; heavy as a person, small enough for the holes */
class Puppet extends GridThing {
    constructor(tx, ty, p = {}) {
        super('puppet', tx, ty, Object.assign({ weight: WEIGHT.medium, thread: THREAD.jory }, p));
        this.small = true; this.dir = DOWN; this.bob = 0;
        this.noCut = true; this.noCutLine = 'Its strings are its own. The Shears slide off them.';
    }
    canPush(d) { return false; }
    /* walked by its strings: a tile in a direction (light things in the way get a nudge) */
    step(d) {
        if (this.mv) return false;
        const a = this.area, nx = this.tx + DX[d], ny = this.ty + DY[d];
        const o = a.at(nx, ny);
        if (o && o !== this && !o.fixed && o.weight <= WEIGHT.light && o.canPush && o.canPush(d)) { o.push(d, 12); return false; }
        if (!a.freeForThing(nx, ny, this)) return false;
        if (a.kind(nx, ny).pit || (a.kind(nx, ny).deep && !this.floats)) return false;      /* a puppet won't walk off an edge */
        this.startMove(nx, ny, 12);
        this.bob = 12;
        return true;
    }
    tick() {
        if (this.bob > 0) this.bob--;
        /* two puppets going home can stand nose to nose on each other's way: they find a way round, or slip past */
        const r = this.ret;
        if (r && r.state === 'returning' && !this.mv && r.strain > 45 && r.trace.length >= 2) {
            const [nx, ny] = r.trace[r.trace.length - 2], o = this.area.at(nx, ny);
            if (o && o.kind === 'puppet' && !o.mv && !o.heldBy) {
                const ot = o.ret && o.ret.trace;
                if (o.ret && o.ret.state === 'returning' && ot.length >= 2 && ot[ot.length - 2][0] === this.tx && ot[ot.length - 2][1] === this.ty) {
                    /* face to face: slip past each other */
                    const a = this.area; a.unplace(this, this.tx, this.ty); a.unplace(o, o.tx, o.ty);
                    const mx = this.tx, my = this.ty;
                    this.startMove(nx, ny, r.pace, true); o.startMove(mx, my, o.ret.pace, true);
                    r.strain = 0; o.ret.strain = 0;
                    return;
                }
                const way = this.findWay(r.mx, r.my);
                if (way) { r.trace = way; r.strain = 0; }
            }
        }
    }
    /* a way home round whatever's in the way (tiles a puppet can stand on), as a trace from the mark to here */
    findWay(mx, my) {
        const a = this.area, start = key2(this.tx, this.ty), prev = new Map([[start, null]]), q = [[this.tx, this.ty]];
        while (q.length) {
            const [x, y] = q.shift();
            if (x === mx && y === my) {
                const out = []; let k = key2(x, y), c = [x, y];
                while (c) { out.push(c); const pk = prev.get(key2(c[0], c[1])); c = pk; }
                return out;     /* mark first ... here last */
            }
            for (const d of [UP, DOWN, LEFT, RIGHT]) {
                const nx = x + DX[d], ny = y + DY[d], k = key2(nx, ny);
                if (prev.has(k) || prev.size > 400) continue;
                const kk = a.kind(nx, ny);
                if (kk.pit || kk.deep || !a.freeForThing(nx, ny, this)) continue;
                prev.set(k, [x, y]); q.push([nx, ny]);
            }
        }
        return null;
    }
    sprite() { return spr((this.look || 'puppet') + (this.worked ? '_up' : '')); }
    draw(cx, cy) {
        const im = this.sprite(); if (!im) return;
        const x = this.px - cx, y = this.py - cy - (this.worked ? 2 : 0) - (this.bob > 6 ? 1 : 0);
        Gfx.alpha(0.25); Gfx.rect(x + 3, this.py - cy + 13, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.img(im, x, y - (im.height - 16), this.dir === LEFT);
    }
}
SPAWN.puppet = (x, y, p) => new Puppet(x, y, p);

/* a crossbar rack: take it and every puppet strung to it steps together */
class Rack extends GridThing {
    constructor(tx, ty, p = {}) { super('rack', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, p)); }
    onAdd(area) { super.onAdd(area); for (const e of area.ents) if (e.kind === 'puppet' && e.group === this.group) e.racked = true; }
    sprite() { return spr('rack'); }
    draw(cx, cy) {
        const im = spr('rack'); if (im) Gfx.img(im, this.px - cx, this.py - cy - 8);
        /* its strings run off to its puppets: thread like any other, over its dark under-stroke (which puppets a rack
           works is the puzzle), and brighter while the Crossbar's in hand */
        Gfx.alpha(Inv.equipped === 'crossbar' ? 1 : 0.7);
        for (const e of this.area.ents) if (e.kind === 'puppet' && e.group === this.group) Threads.stroke(this.px - cx + 8, this.py - cy - 6, e.px - cx + 8, e.py - cy - 14, THREAD.jory);
        Gfx.alpha(1);
    }
}
SPAWN.rack = (x, y, p) => new Rack(x, y, p);

/* the little round holes in walls (the tile kind 'crawl'): drawn over the wall */
SPAWN.crawlhole = (x, y) => {
    const pr = new Prop(x, y, { im: ART.crawlhole, solid: [], oy: 0 });
    pr.baseY = -40;
    return pr;
};

/* toy soldiers: march straight on, about-turn (or turn right) at anything in the way */
AI.march = (e, p) => {
    e.modeT++;
    const sp = e.D.speed || 0.6;
    if (e.march === undefined) e.march = dirByName(e.facing || 'right');
    const d = e.march;
    e.dir = d; e.anim++;
    if (!e.move(DX[d] * sp, DY[d] * sp)) {
        e.march = e.turn === 'right' ? (d === UP ? RIGHT : d === RIGHT ? DOWN : d === DOWN ? LEFT : UP) : OPP[d];
        /* square up on the tile as it turns */
        e.x = e.tx * T + 8; e.y = e.ty * T + 10;
    }
};
/* tin soldiers: a whack doesn't hurt them, it turns them round */
SPAWN.soldier = (x, y, p) => { const e = new Enemy(x, y, Object.assign({ type: 'soldier' }, p)); e.onArmor = () => { if (e.march !== undefined) { e.march = OPP[e.march]; e.x = e.tx * T + 8; e.y = e.ty * T + 10; } }; return e; };

/* painted flats: stage scenery standing in for a wall; a knock and it falls over, cardboard */
class Flat extends GridThing {
    constructor(tx, ty, p = {}) { super('flat', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, p)); this.down = false; }
    hit(by, d) { this.knock(); }
    onStruck() { this.knock(); }
    knock() {
        if (this.down) return;
        this.down = true; this.area.unplace(this, this.tx, this.ty);
        Sfx.play('push'); Fx.dust(this.tx * T + 8, this.ty * T + 12);
        Stats.count('flats');
        if (!Progress.flag('flat_first')) { Progress.set('flat_first'); G.pendingToast = "It falls flat with a slap. It's cardboard: painted cardboard, propped up on a stick."; }
    }
    get sortY() { return this.down ? this.py - 20 : this.py + 15; }
    sprite() { return spr(this.down ? 'flat_down' : (this.look || 'flat')); }
}
SPAWN.flat = (x, y, p) => new Flat(x, y, p);

function initCrossbarKit() {
    ENEMY.soldier = { hp: 2, ai: 'march', r: 5, tall: 14, speed: 0.6, yarn: THREAD.jory, weight: WEIGHT.medium, drop: 0.3, armored: true };
    const sd = { r: '#d6304e', R: '#9a1e36', b: '#2e3a7a', g: '#f7d64a', s: '#f0c8a0', w: '#fbf6ea', k: '#2a1f2d' };
    const soldier = leg => ['.....kkkk.....', '....kbbbbk....', '....kbbbbk....', '....kbbbbk....', '...kkggggkk...', '....kssssk....', '....kswswk....', '....kssssk....', '...krrrrrrk...', '..krRrggrRrk..', '..krrrggrrrk..', '..ksrrrrrrsk..', '...kbbbbbbk...', '...kbbk' + leg + 'bk...', '...kkk....kkk.'.slice(0, 14)];
    defSprite('soldier_0', soldier('kb'), sd); defSprite('soldier_1', soldier('bk'), sd);
    ENEMY_DRAW.soldier = e => spr('soldier_' + ((e.anim >> 4) % 2));
    /* puppets: a little jointed wooden figure on a stand (and lifted on its strings when worked) */
    const pp = { w: '#e6c08a', W: '#c49a62', d: '#8a6040', r: '#d6304e', R: '#9a1e36', e: '#2a1f2d', y: '#f7d64a', b: '#4f9be0' };
    const puppet = (top, arms) => ['......kkkk......', '.....kwwwwk.....', '.....kwewek.....', '.....kwwwwk.....', '......kWWk......', '....' + arms + '....', '...kwk' + top + 'kwk...', '...kk.' + top + '.kk...', '......krrk......', '......kWWk......', '.....kw..wk.....', '.....kw..wk.....', '.....kW..Wk.....', '....kkk..kkk....', '...kddddddddk...', '...kkkkkkkkkk...'];
    defSprite('puppet', puppet('rrrr', 'kkrrrrrrkk'), pp); defSprite('puppet_up', puppet('rrrr', 'kwrrrrrrwk'), pp);
    defSprite('puppet_wren', ['......kkkk......', '.....kRRRRk.....', '....kRwwwwRk....', '.....kwewek.....', '.....kwwwwk.....', '....kkrrrrkk....', '...kwkrrrrkwk...', '...kk.rrrr.kk...', '......kbbk......', '......kWWk......', '.....kb..bk.....', '.....kb..bk.....', '.....kW..Wk.....', '....kkk..kkk....', '...kddddddddk...', '...kkkkkkkkkk...'], Object.assign({}, pp, { R: '#8a5a3a' }));
    SPR.puppet_wren_up = SPR.puppet_wren;
    defSprite('rack', ['................', '.kkkkkkkkkkkkkk.', '.kddddddddddddk.', '.kkkkkkddkkkkkk.', '......kddk......', '......kddk......', '......kddk......', '......kddk......', '......kddk......', '......kddk......', '......kddk......', '......kddk......', '....kkddddkk....', '...kddddddddk...', '...kkkkkkkkkk...', '................'], { d: '#9a6438' });
    defSprite('flat', ['kkkkkkkkkkkkkkkk', 'kaaaaaaaaaaaaaak', 'kaAaaaaaaaaaAaak', 'kaaaaaaAaaaaaaak', 'kaaaaaaaaaaaaaak', 'kAaaaaaaaaAaaaak', 'kaaaaaaaaaaaaaak', 'kaaaaAaaaaaaaaAk', 'kaaaaaaaaaaaaaak', 'kaaaaaaaaaaaaaak', 'kaaAaaaaaAaaaaak', 'kaaaaaaaaaaaaaak', 'kccccccccccccccc', 'kccccccccccccccc', 'kkkkkkkkkkkkkkkk', '................'], { a: '#a39aa8', A: '#8a8296', c: '#7f7688' });
    defSprite('flat_down', ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '.kkkkkkkkkkkkkk.', 'kbbbbbbbbbbbbbbk', 'kbBbbbbbBbbbbbbk', '.kkkkkkkkkkkkkk.', '................'], { b: '#c8a878', B: '#a8885a' });
    ART.crawlhole = paintSprite(16, 16, x => { x.fillStyle = '#1a1420'; x.beginPath(); x.arc(8, 13, 6, Math.PI, 0); x.fill(); x.fillRect(2, 13, 12, 3); x.fillStyle = '#4a3a5a'; x.fillRect(2, 15, 12, 1); });
}
CONTENT_INIT.push(initCrossbarKit);
