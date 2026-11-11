/* The Underside and the Spoolworks (House 7, the Guild's): two layers. Under a room is its Underside, and what's
   up above shows through, faintly; from every mark up there a cord hangs down. A short tug on a cord snaps its thing
   home (or makes it jump, if it's home already). Hold on to a cord and it's tied off: its thing up above holds exactly
   where it is (it can't be pushed, pulled, lifted, drift, or go home) until the knot is undone. Hatches go up and
   down. Counterweights are just heavy weights on plates down below: what's up above answers to them. And the Needle:
   pick a thing (or its cord), walk the needle up to four tiles, and that's its place now: it goes there, and stays.
   Three stitches at a time; a fourth undoes the oldest. A stray can be given a place too. */

THEMES.underside = { floor: ['#5a4636', '#46362a', '#6e5844', '#2a2018'], wall: ['#6a4e38', '#4a3626', '#8a6a4e', '#1e1610'], stone: ['#6a6058', '#4e463e', '#8a8076', '#2a2420'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#120c08' };
FLOORS.underside = {
    /* joists over the dark, planks laid across; a worn walkway; bare earth */
    floor: (x, th, v) => { fill(x, '#2a2018'); fill(x, '#5a4636', 0, 1, 16, 6); fill(x, '#5a4636', 0, 9, 16, 6); fill(x, '#6e5844', 0, 1, 16, 1); fill(x, '#6e5844', 0, 9, 16, 1); fill(x, '#3a2c20', (v * 5) % 14, 3, 1, 2); fill(x, '#3a2c20', (v * 3 + 7) % 14, 11, 1, 2); },
    floor2: (x, th, v) => { fill(x, '#7a6248'); speckle(x, ['#8a7258', '#6a5238'], 40 + v, 0.3); },
    floor3: (x, th, v) => { fill(x, '#3a2c22'); speckle(x, ['#4a3a2c', '#2a2018'], 30 + v, 0.35); },
};
WALLS.underside = {
    edge: '#120c08',
    top: (x) => { fill(x, '#2a1e16'); speckle(x, ['#3a2a1e'], 10, 0.2); },
    face: (x, th, v) => {
        fill(x, '#6a4e38'); for (let y = 2; y < 14; y += 4) fill(x, '#4a3626', 0, y, 16, 1);
        fill(x, '#8a6a4e', 0, 0, 16, 1); fill(x, '#a8784a', 7, 0, 2, 14); fill(x, '#120c08', 0, 15, 16, 1);
    },
};

const Layers = {
    upRoom(area, room) { return room && room.above ? area.rooms.find(r => r.key === room.above.key) || null : null; },
    belowOf(area, room) { return room ? area.rooms.find(r => r.above && r.above.key === room.key) || null : null; },
    /* the tile under an upstairs tile (in the room's Underside), if it has one */
    down(area, tx, ty) { const b = this.belowOf(area, area.roomAt(tx, ty)); return b ? [tx - b.above.dx, ty - b.above.dy] : null; },
    up(area, tx, ty) { const r = area.roomAt(tx, ty); return r && r.above ? [tx + r.above.dx, ty + r.above.dy] : null; },
    layered(area) { return area._layered === undefined ? (area._layered = area.rooms.some(r => r.above)) : area._layered; },
};

/* a cord hanging from a mark up above: it follows the mark (wherever the Needle puts it) */
class Cord extends Ent {
    constructor(thing) { super('cord'); this.thing = thing; this.t = 0; this.pos = null; }
    get x() { return this.pos ? this.pos[0] * T : -9999; }
    get y() { return this.pos ? this.pos[1] * T : -9999; }
    set x(v) { } set y(v) { }
    get tx() { return this.pos ? this.pos[0] : -1; }
    get ty() { return this.pos ? this.pos[1] : -1; }
    /* (sorted with the back of its tile: whoever stands just north of it is in front of it, not run through by it) */
    get sortY() { return this.y - 6; }
    talkBox(p, f) { return !!this.pos && f.tx === this.pos[0] && f.ty === this.pos[1]; }
    interact(p) { Spool.grab(p, this); return true; }
    update() {
        this.t++;
        const e = this.thing, r = e.ret;
        if (e.removed || !r) { this.area.remove(this); return; }
        this.pos = Layers.down(this.area, r.mx, r.my);
    }
    draw(cx, cy) {
        if (!this.pos) return;
        const e = this.thing, r = e.ret, a = this.area;
        const x = this.pos[0] * T + 8 - cx, y = this.pos[1] * T - cy;
        const col = r.color, dark = shade(col, -0.45);
        /* the grommet up in the boards overhead, a brass ring */
        Gfx.rect(x - 2, y - 10, 5, 2, '#c9a24a'); Gfx.rect(x - 1, y - 11, 3, 1, '#f7d64a');
        const away = r.state !== 'home', pulling = Spool.pull && Spool.pull.cord === this;
        if (e.knotted) {
            /* tied off to a cleat in the floor, taut */
            Gfx.line(x, y - 9, x, y + 10, col); Gfx.line(x + 1, y - 9, x + 1, y + 10, dark);
            Gfx.rect(x - 4, y + 10, 10, 3, '#4a3626'); Gfx.rect(x - 3, y + 9, 8, 1, '#8a6a4e');
            Gfx.rect(x - 2, y + 5, 5, 4, col); Gfx.rect(x - 1, y + 6, 3, 2, shade(col, 0.3)); Gfx.rect(x - 2, y + 8, 5, 1, dark);
            return;
        }
        if (away) {
            /* drawn up through the boards toward where its thing is now: taut, short, leaning */
            const d = Layers.down(a, e.tx, e.ty);
            const lean = d ? clamp((d[0] - this.pos[0]) * 2, -6, 6) : 0;
            const shiver = (r.state === 'returning' || r.timer < 30) && (G.t >> 1) % 2 ? 1 : 0;
            Threads.stroke(x, y - 9, x + lean + shiver, y + 2, col);
            Gfx.rect(x + lean + shiver - 1, y + 2, 3, 3, '#8a6a4e');
            return;
        }
        /* hanging slack, a wooden pull at the end; swinging a little */
        const sw = Math.round(Math.sin((this.t + this.pos[0] * 13) / 40) * (pulling ? 0 : 1));
        const down = pulling ? 3 : 0;
        Gfx.line(x, y - 9, x + sw, y + 6 + down, col); Gfx.line(x + 1, y - 9, x + 1 + sw, y + 6 + down, dark);
        Gfx.rect(x - 1 + sw, y + 6 + down, 4, 5, '#a8784a'); Gfx.rect(x - 1 + sw, y + 10 + down, 4, 1, '#6a4e38');
        Gfx.alpha(0.2); Gfx.rect(x - 3, y + 13, 8, 2, PAL.ink); Gfx.alpha(1);
    }
}

const Spool = {
    KNOT: 16,                /* hold on this long and it's tied off */
    pull: null,              /* { cord, t } while Wren has hold of a cord */
    jolt: null,              /* the last thing jolted by a tug, and when (someone up above might notice) */
    canvas: null,
    sync(area) {
        if (!Layers.layered(area)) return;
        const have = area._cords || (area._cords = new Set());
        for (const e of area.ents) {
            if (!(e.isGrid || e.cordable) || !e.ret || e.noCord || e.removed || have.has(e)) continue;
            /* tied off from the start (set out that way), unless it's been untied before */
            if (e.knotted && e._fixed0 === undefined) {
                e.knotted = false;
                if (e.id && Progress.areaFlag(area.id, 'untied:' + e.id)) {
                    if (e.ret && e.isGrid && (e.tx !== e.ret.mx || e.ty !== e.ret.my) && !area.at(e.ret.mx, e.ret.my)) { area.unplace(e, e.tx, e.ty); e.tx = e.ret.mx; e.ty = e.ret.my; e.x = e.tx * T; e.y = e.ty * T; area.place(e, e.tx, e.ty); e.ret.trace = [[e.tx, e.ty]]; e.ret.state = 'home'; }
                } else { this.knot(e, true); e.knotStart = true; }
            }
            if (!Layers.belowOf(area, area.roomAt(e.ret.mx, e.ret.my))) continue;
            have.add(e); area.add(new Cord(e));
        }
        for (const e of have) if (e.removed || !e.ret) have.delete(e);
    },
    grab(p, cord) {
        const e = cord.thing;
        if (e.knotted) { this.untie(e); return; }
        this.pull = { cord, t: 0 }; p.pinned = 'cord';
        Sfx.play('click');
    },
    update(area) {
        this.sync(area);
        for (const e of area.ents) if (e.jolt > 0) { e.jolt--; e.z = Math.round(Math.sin(e.jolt / 14 * Math.PI) * 4); if (!e.jolt) e.z = 0; }
        const pl = this.pull, p = G.player;
        if (!pl) return;
        const done = () => { this.pull = null; if (p && p.pinned === 'cord') p.pinned = null; };
        if (!p || p.area !== area || p.state !== 'normal' || pl.cord.removed || !pl.cord.talkBox(p, p.front())) { done(); return; }
        if (Input.down('act')) {
            if (++pl.t >= this.KNOT) { this.knot(pl.cord.thing); done(); }
            return;
        }
        this.tug(pl.cord.thing); done();
    },
    tug(e) {
        Sfx.play('tug'); Stats.count('tugs');
        if (Return.away(e) && !Return.held(e)) {
            Return.snap(e);
            if (!Progress.flag('tug_first')) { Progress.set('tug_first'); G.pendingToast = 'You tug the cord: up above, something snaps home.'; }
        } else if (!Return.away(e)) {
            e.jolt = 14; this.jolt = { e, t: G.t };
        }
    },
    knot(e, quiet) {
        if (e.knotted) return;
        if (e.noKnot) { if (e.onNoKnot) e.onNoKnot(); return; }
        e.knotted = true; e._fixed0 = !!e.fixed; e.fixed = true; e._lift0 = e.liftable; e.liftable = false;
        if (e.heldBy && e.heldBy.release && e.heldBy !== G.player) e.heldBy.release();
        if (e.onKnot) e.onKnot();
        if (quiet) return;
        Sfx.play('tie'); Stats.count('knots');
        if (!Progress.flag('knot_first')) { Progress.set('knot_first'); G.pendingToast = 'You wind the cord round the cleat and tie it off. Up above, whatever it holds is held fast. (Z on the knot to undo it.)'; }
    },
    untie(e) {
        if (!e.knotted) return;
        e.knotted = false; e.fixed = e._fixed0; e.liftable = e._lift0;
        Return.disturb(e);
        if (e.knotStart && e.id && e.area) Progress.setAreaFlag(e.area.id, 'untied:' + e.id);
        if (e.onUntie) e.onUntie();
        Sfx.play('unclick');
    },
    /* the room upstairs, seen through the boards (drawn under everything down here) */
    drawAbove(a, cx, cy) {
        const r = Cam.room, ar = Layers.upRoom(a, r);
        if (!ar || HEADLESS) return;
        const ux = cx + r.above.dx * T, uy = cy + r.above.dy * T;
        const c = this.canvas || (this.canvas = Gfx.makeCanvas(W, H)), g = c.getContext('2d');
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
        const ctx0 = Gfx.ctx; Gfx.ctx = g;
        try {
            /* the floor up there is the boards overhead: only its walls, holes and water show, and what stands on it. Walls
               up there over open floor down here are drawn as their plan, hatched and dashed round (a wall drawn as a wall
               would make the floor under it look solid); a hole lets the light down; walls over walls aren't drawn */
            for (let ty = ar.y; ty < ar.y + ar.h; ty++) for (let tx = ar.x; tx < ar.x + ar.w; tx++) {
                const k = a.kindName(tx, ty), sx = tx * T - ux, sy = ty * T - uy;
                if (k === 'floor') continue;
                if (k === 'wall' || k === 'void') { if (!a.kind(tx - r.above.dx, ty - r.above.dy).solid) this.plan(a, tx, ty, sx, sy); }
                else if (k === 'pit') Gfx.img(tileCanvas('spool:hole', x => { fill(x, '#fff3d0'); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if ((i * 3 + j * 5) % 11 === 0) px(x, i, j, '#ffe6a0'); }), sx, sy);
                else TileDraw.draw(a, tx, ty, sx, sy);
            }
            const inR = e => { const tx = e.tx !== undefined ? e.tx : tileOf(e.x), ty = e.ty !== undefined ? e.ty : tileOf(e.y); return tx >= ar.x && ty >= ar.y && tx < ar.x + ar.w && ty < ar.y + ar.h; };
            /* (a door up there in a wall that's solid down here too isn't drawn: it would look like a door down here) */
            const list = a.ents.filter(e => e.kind !== 'cord' && !e.removed && inR(e) && !(e.kind === 'door' && a.kind(e.tx - r.above.dx, e.ty - r.above.dy).solid));
            for (const e of list) if (e.floor) e.draw(ux, uy);
            Threads.draw({ ents: list, id: a.id }, ux, uy);
            for (const e of list.filter(e => !e.floor).sort((m, n) => m.sortY - n.sortY)) e.draw(ux, uy);
            if (a.def.drawAboveExtra) a.def.drawAboveExtra(a, ux, uy, ar);
        } catch (e) { reportError(e); }
        Gfx.ctx = ctx0;
        /* faded and cooled, like light through the cracks */
        g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.35; g.fillStyle = '#cfe0ff'; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        Gfx.alpha(0.55); ctx0.drawImage(c, 0, 0); Gfx.alpha(1);
    },
    /* a wall up above, seen from below: its plan, hatched, its edges dashed */
    plan(a, tx, ty, sx, sy) {
        const wall = (x, y) => { const k = a.kindName(x, y); return k === 'wall' || k === 'void'; };
        Gfx.img(tileCanvas('spool:plan', x => { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if ((i + j) % 4 === 0) px(x, i, j, '#d6c9ad'); }), sx, sy);
        for (let i = 0; i < 16; i += 4) {
            if (!wall(tx, ty - 1)) Gfx.rect(sx + i, sy, 2, 1, '#fff6dc');
            if (!wall(tx, ty + 1)) Gfx.rect(sx + i, sy + 15, 2, 1, '#fff6dc');
            if (!wall(tx - 1, ty)) Gfx.rect(sx, sy + i, 1, 2, '#fff6dc');
            if (!wall(tx + 1, ty)) Gfx.rect(sx + 15, sy + i, 1, 2, '#fff6dc');
        }
    },
    /* who matters up there (somebody you're looking after, things that bite) shows clearly through the boards, over
       everything down here, Wren too: the moment upstairs (the boy finding the button) is never hidden behind her */
    drawAboveFront(a, cx, cy) {
        const r = Cam.room, ar = Layers.upRoom(a, r);
        if (!ar || HEADLESS) return;
        const ux = cx + r.above.dx * T, uy = cy + r.above.dy * T;
        try {
            const inR = e => { const tx = e.tx !== undefined ? e.tx : tileOf(e.x), ty = e.ty !== undefined ? e.ty : tileOf(e.y); return tx >= ar.x && ty >= ar.y && tx < ar.x + ar.w && ty < ar.y + ar.h; };
            const front = a.ents.filter(e => e.showThrough && !e.removed && inR(e));
            for (const e of front) e.draw(ux, uy);
        } catch (e) { reportError(e); }
    },
    /* up above: a thing tied off from below shows its cord going down through the floor */
    draw(cx, cy) {
        const a = G.map; if (!a || !Layers.layered(a)) return;
        for (const e of a.ents) {
            if (!e.knotted || !e.isGrid) continue;
            const x = e.px + 8 - cx, y = e.py + 14 - cy;
            Gfx.line(x, y, x, y + 3, e.ret ? e.ret.color : THREAD.guild); Gfx.rect(x - 1, y + 3, 3, 1, '#c9a24a');
        }
    },
};
SFX.tug = (o, t) => { Audio.hit(o, t, 0.06, 0.12, 400, 1600); Audio.tone(o, t, 220, 0.1, 'triangle', 0.12, { slide: 330 }); };
SFX.tie = (o, t) => { Audio.hit(o, t, 0.08, 0.1, 500, 1800); Audio.tone(o, t + 0.04, 262, 0.08, 'triangle', 0.12, { slide: 392 }); };

/* knotted things are held (rule 3) and can't be moved by anything */
{
    const held0 = Return.held;
    Return.held = function (e) { return held0.call(this, e) || !!e.knotted; };
    const drift0 = Water.drift;
    Water.drift = function (e) { if (e.knotted) { e.driftT = 0; return; } return drift0.call(this, e); };
    const step0 = Puppet.prototype.step;
    Puppet.prototype.step = function (d) { return this.knotted ? false : step0.call(this, d); };
}

/* refusals, said (what the world does, not what to do about it): a thing tied off below won't be pushed or gripped up
   here; a thing no hand can shift won't come when pulled */
{
    const said = (p, s) => { if (!p._refT || G.t - p._refT > 90) { p._refT = G.t; UI.toast(s, 130); Sfx.play('hitthing', 0.5); } };
    const KNOT_LINE = "It won't budge: something is holding it fast from underneath.";
    const push0 = Player.prototype.tryPush;
    Player.prototype.tryPush = function (d) {
        const f = this.front(), o = this.area.at(f.tx, f.ty);
        if (o && o.isGrid && o.knotted) {
            if (this.pushDir !== d) { this.pushT = 0; this.pushDir = d; }
            this.pushing = true;
            if (++this.pushT >= 16) { this.pushT = 0; said(this, o.pushLine || KNOT_LINE); }
            return;
        }
        return push0.call(this, d);
    };
    const grip0 = Player.prototype.tryGrip;
    Player.prototype.tryGrip = function () {
        const o = this.thingInFront();
        if (o && o.isGrid && o.knotted && Input.pressed('act')) said(this, o.pushLine || KNOT_LINE);
        return grip0.call(this);
    };
    const gm0 = Player.prototype.gripMove;
    Player.prototype.gripMove = function (ax) {
        const o = this.grip, back = OPP[this.dir], want = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
        if (o && o.noPull && want === back && !o.mv && !this.pullT && !this.solidAt(this.tx + DX[back], this.ty + DY[back])) said(this, o.pullLine || o.pushLine || "It won't come. No hand could pull that.");
        return gm0.call(this, ax);
    };
}

/* hatches: a ladder up from the Underside, a trapdoor down from the room above */
class Hatch extends GridThing {
    constructor(tx, ty, p = {}) { super('hatch', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); }
    interact(p) {
        const a = this.area, up = Layers.up(a, this.tx, this.ty), down = Layers.down(a, this.tx, this.ty);
        const to = up ? 'up' : down ? 'down' : null;
        if (!to || p.carry) { UI.toast(p.carry ? 'Not with your hands full.' : 'It goes nowhere.'); return true; }
        const [dx, dy] = up ? [up[0] - this.tx, up[1] - this.ty] : [down[0] - this.tx, down[1] - this.ty];
        const there = a.at(p.tx + dx, p.ty + dy);
        if (there && !there.removed && !(there.floats && Water.rideable(there))) {
            UI.toast(to === 'up' ? "The trapdoor won't lift: something is standing just where you'd come up." : 'Something is standing just where you would come down.');
            Sfx.play('hitthing'); return true;
        }
        Script.run(function* () {
            Sfx.play('door');
            yield* fadeOut(10);
            p.x += dx * T; p.y += dy * T;
            p.unstick();
            if (p.mark && p.mark.bed) p.dropBed();
            Cam.snap(p); p.setMark();
            Stats.enterRoom(a, Cam.room); if (G.onRoomEnter) G.onRoomEnter(a, Cam.room);
            if (!Progress.flag('hatch_' + to)) {
                Progress.set('hatch_' + to);
                if (to === 'down') G.pendingToast = 'Under the floor. Up above shows through the cracks, and from every mark up there hangs a cord.';
            }
            yield* fadeIn(10);
        });
        return true;
    }
    sprite() { return spr(Layers.up(this.area, this.tx, this.ty) ? 'hatch_up' : 'hatch_down'); }
    draw(cx, cy) {
        const im = this.sprite(); if (!im) return;
        Gfx.img(im, this.px - cx, this.py - cy - (im.height - 16));
    }
}
SPAWN.hatch = (x, y, p) => new Hatch(x, y, p);
/* a counterweight: an iron weight, heavy, sat on its plate */
SPAWN.weight = (x, y, p) => new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'block_weight' }, p));

/* ---------------- the Needle ---------------- */
const NEEDLE_NOUNS = { block_weight: 'the iron weight', bobbin: 'a bobbin', bobbin_t: 'a bobbin', 'block:wood': 'the wooden block', 'block:stone': 'the stone block', crate: 'the crate', pot: 'the pot', puppet: 'the puppet' };
const Needle = {
    MAX: 3, REACH: 4,
    st: null,                /* { thing, path, off: [dx, dy] (drawn under, through a cord), rep } while stitching */
    key(e) { return e.skey || e.id || null; },
    able(e) { return e && e.isGrid && !e.fixed && !e.noNeedle && !e.person && !e.carried && !e.removed && !Return.asleep(e) && !!this.key(e); },
    target(p) {
        const a = p.area, f = p.front();
        const cord = a.ents.find(e => e.kind === 'cord' && e.talkBox(p, f));
        if (cord) { const b = a.roomAt(cord.tx, cord.ty); return { thing: cord.thing, off: [b.above.dx, b.above.dy] }; }
        for (let i = 1; i <= this.REACH; i++) {
            const x = p.tx + DX[p.dir] * i, y = p.ty + DY[p.dir] * i, o = a.at(x, y);
            if (o) return { thing: o };
            if (a.kind(x, y).solid) break;
        }
        return null;
    },
    /* the first thing along the line Wren faces past the Needle's reach (before a wall), if any */
    beyond(p) {
        const a = p.area;
        for (let i = this.REACH + 1; i <= 12; i++) {
            const x = p.tx + DX[p.dir] * i, y = p.ty + DY[p.dir] * i;
            if (!a.inside(x, y) || a.kind(x, y).solid) return null;
            if (a.at(x, y)) return a.at(x, y);
        }
        return null;
    },
    use(p) {
        if (this.st) return this.confirm(p);
        const t = this.target(p);
        if (!t && this.beyond(p)) { UI.toast("Too far off: the Needle's thread reaches four tiles, no further."); Sfx.play('hitthing', 0.4); return; }
        if (!t) { UI.toast(this.hinted ? 'Nothing to stitch there.' : 'Face a thing (or its cord, from underneath) and press [tool] to give it a new place.'); this.hinted = true; return; }
        const e = t.thing;
        if (e.knotted) { UI.toast("It's tied off underneath. Undo the knot first."); return; }
        if (!this.able(e)) { UI.toast(Return.asleep(e) ? "It's asleep; the needle won't take." : "The needle won't go into that."); return; }
        const rec = Inv.stitches.find(s => s.area === e.area.id && s.key === this.key(e));
        if (rec) {
            Script.run(function* () {
                const i = yield* ask(null, 'It has a place of your stitching already.', ['Stitch it somewhere new', 'Unpick it (its old place back)', 'Leave it']);
                if (i === 0) Needle.begin(p, t);
                if (i === 1) { Needle.unpick(rec); Sfx.play('unclick'); }
            });
            return;
        }
        this.begin(p, t);
    },
    begin(p, t) {
        const e = t.thing;
        if (e.mv) { UI.toast("Wait till it's still."); return; }
        this.st = { thing: e, path: [[e.tx, e.ty]], off: t.off || [0, 0], rep: 0, room: e.area.roomAt(e.tx, e.ty), held0: e.heldBy };
        e.heldBy = e.heldBy || { needle: true };
        p.pinned = 'needle';
        Sfx.play('twang');
        if (!Progress.flag('needle_first')) { Progress.set('needle_first'); UI.toast('Arrows walk the needle (up to 4). [tool]: that\'s its place now. [act]: never mind.', 200); }
    },
    stepOk(e, x, y) {
        const a = e.area, k = a.kind(x, y);
        if (a.roomAt(x, y) !== this.st.room) return false;
        if (k.pit || k.fog || (k.deep && !e.floats)) return false;
        return a.freeForThing(x, y, e);
    },
    update(area) {
        const s = this.st, p = G.player;
        if (!s) return;
        if (!p || p.area !== area || p.state !== 'normal' || s.thing.removed || s.thing.area !== area) { this.cancel(p); return; }
        if (Script.blocking()) return;
        if (Input.pressed('act') || Input.pressed('atk') || Inv.equipped !== 'needle') { this.cancel(p); Sfx.play('cancel'); return; }
        const ax = Input.axis();
        if (!ax.x && !ax.y) { s.rep = 0; return; }
        if (s.rep > 0) { s.rep--; return; }
        const d = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
        const [lx, ly] = s.path[s.path.length - 1], nx = lx + DX[d], ny = ly + DY[d];
        const back = s.path.findIndex(([x, y]) => x === nx && y === ny);
        if (back >= 0) { s.path.length = back + 1; s.rep = 7; Sfx.play('blip', 0.3); return; }
        if (s.path.length - 1 >= this.REACH || !this.stepOk(s.thing, nx, ny)) { s.rep = 7; Sfx.play('hitthing', 0.2); return; }
        s.path.push([nx, ny]); s.rep = 7; Sfx.play('blip', 0.4);
    },
    cancel(p) { const s = this.st; if (s && s.thing && s.thing.heldBy && s.thing.heldBy.needle) s.thing.heldBy = s.held0 || null; this.st = null; if (p && p.pinned === 'needle') p.pinned = null; },
    confirm(p) {
        const s = this.st;
        if (s.path.length < 2) { this.cancel(p); return; }
        this.cancel(p);
        this.stitch(s.thing, s.path);
    },
    stitch(e, path) {
        const a = e.area, key = this.key(e);
        const old = Inv.stitches.find(r => r.area === a.id && r.key === key);
        const stray = old ? old.stray : !e.ret;
        if (!e.ret) Return.mark(e, { color: THREAD.wren });
        const r = e.ret;
        const trace0 = r.trace.map(q => q.slice());
        const from = old ? old.from : [r.mx, r.my];
        const way = (old ? old.trace.concat(trace0.slice(1)) : trace0).concat(path.slice(1).map(q => q.slice()));
        if (old) Inv.stitches.splice(Inv.stitches.indexOf(old), 1);
        const end = path[path.length - 1];
        r.mx = end[0]; r.my = end[1];
        r.trace = path.slice().reverse().map(q => q.slice());
        r.state = 'returning'; r.snap = true; r.timer = 0;
        if (!old) r.color0 = r.color;
        r.color = THREAD.wren;
        e.stitched = true;
        Inv.stitches.push({ area: a.id, key, from, to: end.slice(), trace: way, stray, color0: r.color0, noun: this.noun(e) });
        Sfx.play('twang'); Stats.count('stitches');
        if (Inv.stitches.length > this.MAX) {
            const oldest = Inv.stitches[0];
            this.unpick(oldest);
            /* (something that's held where it is when its stitch lets go, tied off below or gripped, stays put) */
            const was = oldest.area === a.id && a.ents.find(o => this.key(o) === oldest.key && !o.removed);
            UI.toast(this.letGo(oldest, !!(was && was.ret && Return.held(was))), 200);
        }
    },
    /* what a stitched thing is called, for saying which one let go */
    noun(e) { return e.stitchName || NEEDLE_NOUNS[e.look] || NEEDLE_NOUNS[e.kind + ':' + e.style] || NEEDLE_NOUNS[e.kind] || 'the ' + e.kind; },
    /* the oldest stitch let go: say plainly what it was and where (older saves' stitches don't know what they were) */
    letGo(rec, held) {
        const def = AREAS[rec.area], at = rec.from || rec.to;
        const room = at && def && def.rooms ? def.rooms.find(r => at[0] >= r.x && at[1] >= r.y && at[0] < r.x + r.w && at[1] < r.y + r.h) : null;
        const here = room && G.map && G.map.id === rec.area && Cam.room && Cam.room.key === room.key, n = room && room.name;
        const where = here ? ' here' : !n ? '' : /^Under /.test(n) ? ' under ' + n.slice(6) : /Floor$/.test(n) ? ' on ' + n.replace(/^The /, 'the ') : ' in ' + n.replace(/^The /, 'the ');
        return 'The Needle only holds three stitches, so your oldest lets go: ' + (rec.noun || (rec.chalk ? 'a sewn plank' : 'something')) + where + (rec.chalk ? ' goes back to chalk.' : held ? ' would go back to its old place, but something is holding it where it is.' : ' goes back to its old place.');
    },
    /* a stitch undone: the thing's old place back, and its way home is the way it came */
    unpick(rec) {
        const i = Inv.stitches.indexOf(rec); if (i >= 0) Inv.stitches.splice(i, 1);
        const a = G.map; if (!a || rec.area !== a.id) return;
        const e = a.ents.find(o => this.key(o) === rec.key && !o.removed);
        if (!e || !e.ret) return;
        e.stitched = false;
        if (rec.stray) { e.ret = null; Fx.poof(e.tx * T + 8, e.ty * T + 8); return; }
        const r = e.ret;
        r.mx = rec.from[0]; r.my = rec.from[1]; r.color = rec.color0 || r.color;
        let tr = rec.trace.map(q => q.slice()).concat(r.trace.slice(1).map(q => q.slice()));
        /* no loops (a thread can't knot on itself) */
        const out = [];
        for (const q of tr) { const k = out.findIndex(o => o[0] === q[0] && o[1] === q[1]); if (k >= 0) out.length = k + 1; else out.push(q); }
        r.trace = out; r.snap = false;
        if (out.length === 1 && e.tx === r.mx && e.ty === r.my) { r.state = 'home'; }
        else { r.state = 'away'; r.timer = 30; }
    },
    /* the place built afresh: things stitched here are at their new places */
    apply(a) {
        for (const rec of Inv.stitches || []) {
            if (rec.area !== a.id) continue;
            const e = a.ents.find(o => this.key(o) === rec.key && o.isGrid && !o.removed);
            if (!e) continue;
            const [x, y] = rec.to;
            if (a.at(x, y) && a.at(x, y) !== e) continue;
            a.unplace(e, e.tx, e.ty); e.mv = null; e.tx = x; e.ty = y; e.x = x * T; e.y = y * T; a.place(e, x, y);
            if (!e.ret) Return.mark(e, { color: THREAD.wren });
            const r = e.ret;
            r.mx = x; r.my = y; r.trace = [[x, y]]; r.state = 'home'; r.snap = false; r.timer = 0;
            r.color0 = rec.color0 || r.color; r.color = THREAD.wren; e.stitched = true;
        }
    },
    /* every tile the needle could still be walked to (four steps from where the thing is, round walls, never over a hole
       or onto Wren herself) */
    reach(s) {
        const e = s.thing, [x0, y0] = s.path[0], seen = new Map([[key2(x0, y0), 0]]), q = [[x0, y0]];
        while (q.length) {
            const [x, y] = q.shift(), d = seen.get(key2(x, y));
            if (d >= this.REACH) continue;
            for (const k of [UP, RIGHT, DOWN, LEFT]) {
                const nx = x + DX[k], ny = y + DY[k];
                if (seen.has(key2(nx, ny)) || !this.stepOk(e, nx, ny)) continue;
                seen.set(key2(nx, ny), d + 1); q.push([nx, ny]);
            }
        }
        seen.delete(key2(x0, y0));
        return seen;
    },
    draw(cx, cy) {
        const s = this.st, p = G.player;
        /* a stitched thing at home: Wren's own little red cross peeping out under it */
        const a = G.map;
        if (a) for (const e of a.ents) if (e.stitched && e.ret && e.ret.state === 'home' && !e.removed) {
            const x = e.px - cx, y = e.py - cy;
            Gfx.rect(x + 2, y + 13, 2, 1, THREAD.wren); Gfx.rect(x + 12, y + 13, 2, 1, THREAD.wren);
        }
        /* the Needle in hand: what it would take, marked at its corners (the first thing in line, four tiles at most) */
        if (!s && p && a && p.area === a && Inv.equipped === 'needle' && p.state === 'normal' && !p.pinned && !Script.blocking()) {
            const t = this.target(p), e = t && !t.off ? t.thing : null;
            if (e && this.able(e) && !e.knotted) {
                const x = e.px - cx, y = e.py - cy, k = (G.t >> 4) % 2;
                Gfx.alpha(0.85);
                for (const [u, v, du, dv] of [[0, 0, 1, 1], [15, 0, -1, 1], [0, 15, 1, -1], [15, 15, -1, -1]]) {
                    const X = x + u - du * k, Y = y + v - dv * k;
                    Gfx.rect(du > 0 ? X : X - 2, Y, 3, 1, THREAD.wren); Gfx.rect(X, dv > 0 ? Y : Y - 2, 1, 3, THREAD.wren);
                }
                Gfx.alpha(1);
            }
        }
        if (!s || !p) return;
        const [ox, oy] = s.off, pts = s.path.map(([x, y]) => [(x - ox) * T + 8 - cx, (y - oy) * T + 9 - cy]);
        /* where it could go: those tiles, stitched faintly round */
        Gfx.alpha(0.55);
        for (const k of this.reach(s).keys()) {
            const [x, y] = k.split(',').map(Number);
            Tells.stitchTile((x - ox) * T - cx, (y - oy) * T - cy, THREAD.wren);
        }
        Gfx.alpha(1);
        /* the needle's red thread, from Wren to the thing, along the stitch to the new place */
        Gfx.line(p.x - cx + 4, p.y - cy - 12, pts[0][0], pts[0][1] - 4, THREAD.wren);
        Threads.path(pts, THREAD.wren);
        const [ex, ey] = s.path[s.path.length - 1];
        Marks.draw((ex - ox) * T - cx, (ey - oy) * T - cy, THREAD.wren, (G.t >> 4) % 2 === 0);
        const nd = spr('needle_cursor'); if (nd) Gfx.img(nd, (ex - ox) * T - cx + 8, (ey - oy) * T - cy - 10);
        Font.draw((this.REACH - s.path.length + 1) + '', (ex - ox) * T - cx + 12, (ey - oy) * T - cy - 2, PAL.white, Infinity, PAL.ink);
    },
    /* the HUD: three little stitches, filled for each in use */
    drawHud() {
        if (Inv.equipped !== 'needle') return;
        for (let i = 0; i < this.MAX; i++) {
            const x = W - 56 + i * 6, y = 31, used = i < (Inv.stitches || []).length;     /* under the key that uses it */
            Gfx.rect(x, y, 4, 4, PAL.ink); Gfx.rect(x + 1, y + 1, 2, 2, used ? THREAD.wren : '#fbf3df');
        }
    },
};
TOOLS.needle = {
    use(p) { Needle.use(p); },
    update(area) { Needle.update(area); },
    draw(cx, cy) { Needle.draw(cx, cy); },
};
TOOLS._spool = { update(area) { Spool.update(area); }, draw(cx, cy) { Spool.draw(cx, cy); } };

/* the place built afresh: stitches, and the hatches' other halves */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        /* every hatch down below has its trapdoor up above */
        if (Layers.layered(a)) for (const h of a.ents.filter(e => e.kind === 'hatch')) {
            const up = Layers.up(a, h.tx, h.ty);
            if (up && !(a.at(up[0], up[1]) && a.at(up[0], up[1]).kind === 'hatch')) a.add(new Hatch(up[0], up[1]));
        }
        Needle.apply(a);
        return a;
    };
    const hud0 = UI.drawHUD;
    /* (under a notice, a banner or words at the top the little stitches would sit under the panel: left out then) */
    UI.drawHUD = function () { hud0.call(this); if (G.scene === 'play' && !G.hideHud && !(Dialog.active && Dialog.top) && !this.banner && !this.toasts.some(t => !t.low)) { Gfx.alpha(this.hudA === undefined ? 1 : this.hudA); Needle.drawHud(); Gfx.alpha(1); } };
}

function initSpoolKit() {
    ART.hatch_up = paintSprite(16, 16, x => {
        /* a ladder up to a square of light, all in its own tile (so it never stands up over whoever's just behind it) */
        x.fillStyle = '#f7e8b8'; x.fillRect(3, 0, 10, 3); x.fillStyle = '#fffbe8'; x.fillRect(5, 0, 6, 1);
        x.fillStyle = '#c9a24a'; x.fillRect(2, 0, 1, 4); x.fillRect(13, 0, 1, 4); x.fillRect(2, 3, 12, 1);
        x.fillStyle = '#6a4e38'; x.fillRect(3, 4, 2, 12); x.fillRect(11, 4, 2, 12);
        x.fillStyle = '#a8784a'; for (let y = 6; y < 16; y += 3) x.fillRect(3, y, 10, 2);
        x.fillStyle = '#2a1e16'; for (let y = 8; y < 16; y += 3) x.fillRect(5, y, 6, 1);
    });
    ART.hatch_down = paintSprite(16, 16, x => {
        /* a trapdoor in the floor with an iron ring */
        x.fillStyle = '#2a1e16'; x.fillRect(1, 1, 14, 14); x.fillStyle = '#8a6040'; x.fillRect(2, 2, 12, 12);
        x.fillStyle = '#6a4630'; x.fillRect(2, 5, 12, 1); x.fillRect(2, 9, 12, 1);
        x.fillStyle = '#c9a24a'; x.fillRect(6, 6, 4, 1); x.fillRect(6, 9, 4, 1); x.fillRect(5, 7, 1, 2); x.fillRect(10, 7, 1, 2);
    });
    SPR.hatch_up = ART.hatch_up; SPR.hatch_down = ART.hatch_down;
    defSprite('block_weight', ['................', '......kkkk......', '.....kyyyyk.....', '......kkkk......', '....kkkkkkkk....', '...kiiiiiiiik...', '..kiIiiiiiiiik..', '..kiiiiiiiiiik..',
        '..kiiiiiiiiiik..', '..kiiiiiiiiiik..', '..kiiiiiiiiiik..', '..kiiiiiiiiiIk..', '..kIIIIIIIIIIk..', '..kIIIIIIIIIIk..', '...kkkkkkkkkk...', '................'], { i: '#6a6e78', I: '#484c56', y: '#c9a24a' });
    defSprite('needle_cursor', ['.......w', '......wk', '.....wk.', '....wk..', '...wk...', '..wk....', '.wk.....', 'kk......'], { w: '#eef2f8' });
}
CONTENT_INIT.push(initSpoolKit);
