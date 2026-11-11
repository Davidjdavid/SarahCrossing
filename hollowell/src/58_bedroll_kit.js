/* Wren's own mark, for Hushwood and the Slumberhouse (House 5). A bed Wren lies down in, or the Bedroll laid
   anywhere, is Wren's mark, and it holds while Wren stays in that place: rooms don't move it, and a fall home
   onto your own bed doesn't hurt, so falls are travel. Hold C with the Bedroll to go Homeward: fly back along
   your trace to it, over whatever is in the way now (from another place, straight to it). What Wren carries
   comes too. Laid on something floating, the Bedroll goes where it goes. Also here: crumbling boards (they give
   way once whatever stood on them steps off, and mend when Wren comes home or leaves the room), dreamcatchers
   (they light when Wren flies through them), bouncy moss (hops Wren along), sleep puffs (breathe the spores and
   you doze off and wake on your mark) and Snorelings (asleep; awake they shuffle after you; they go back to the
   nearest bed, and a Bedroll counts). */

const Bedroll = {
    traces: {},           /* Wren's trace in the Bedroll's place, kept while she's elsewhere */
    float: null,          /* the float it lies on, if any */
    sleeper: null,        /* a Snoreling asleep on it */
    floatId(o) { return o.id || (o.ret ? o.ret.mx + ',' + o.ret.my : null); },
    lies(area) { const b = Inv.bedroll; return !!(b && area && b.area === area.id); },
    mark() { const b = Inv.bedroll; return { area: b.area, tx: b.tx, ty: b.ty, bed: 'roll' }; },
    /* Wren arrives in the Bedroll's place: it's her mark again, and her old trace here still leads to it */
    claim(p, area) {
        const b = Inv.bedroll;
        p.mark = this.mark();
        const st = this.traces[area.id];
        p.trace = st && st.length && st[0][0] === b.lx && st[0][1] === b.ly ? st.map(q => q.slice()) : [[b.lx, b.ly]];
        p.traceStep();
    },
    stash() {
        const p = G.player, a = G.map;
        if (p && a && this.lies(a) && p.mark && p.mark.bed === 'roll') this.traces[a.id] = p.trace.map(q => q.slice());
    },
    ground(a, tx, ty) {
        const k = a.kind(tx, ty), o = a.at(tx, ty);
        if (o && o.floats && Water.rideable(o)) return true;
        return !(k.solid || k.pit || k.deep || k.fog || k.ledge || a.kindName(tx, ty) === 'stairs' || o);
    },
    near(p) { const b = Inv.bedroll; return this.lies(p.area) && Math.abs(p.tx - b.tx) <= 1 && Math.abs(p.ty - b.ty) <= 1; },
    lay(p) {
        const a = p.area, tx = p.tx, ty = p.ty, o = a.at(tx, ty);
        if (p.carry) { UI.toast('Your hands are full.'); return; }
        if (a.def.noBedroll) { UI.toast(a.def.noBedroll === true ? "It won't lie flat here." : a.def.noBedroll); return; }
        const nb = (a.def.noBedrollAt || []).find(([x0, y0, x1, y1]) => tx >= x0 && ty >= y0 && tx <= x1 && ty <= y1);
        if (nb) { UI.toast(nb[4] || "It won't lie flat here."); return; }
        if (!this.ground(a, tx, ty) || a.ents.some(e => e.kind === 'warp' && e.tx === tx && e.ty === ty)) { UI.toast('Not here: somewhere flat and dry.'); return; }
        const moved = !!Inv.bedroll;
        if (this.sleeper) { this.sleeper.wake(); this.sleeper = null; }
        Inv.bedroll = { area: a.id, tx, ty, lx: tx, ly: ty };
        this.float = o && o.floats ? o : null;
        /* which float it's on, to find it again when the place is built afresh (the float back at its own home) */
        if (this.float) Inv.bedroll.fid = Bedroll.floatId(this.float);
        delete this.traces[a.id];
        p.mark = this.mark(); p.trace = [[tx, ty]];
        Sfx.play('lay'); Fx.poof(tx * T + 8, ty * T + 10);
        Stats.count('bedroll:lay');
        if (!Progress.flag('bedroll_laid')) { Progress.set('bedroll_laid'); UI.toast('Bedroll laid. This is home now. (Hold [tool] to come back to it.)', 200); }
        else if (moved) UI.toast('Bedroll laid here.', 70);
    },
    rollUp(p) {
        if (this.sleeper) { UI.toast("Somebody's fast asleep on your Bedroll."); return; }
        Inv.bedroll = null; this.float = null; this.traces = {};
        p.dropBed();
        /* her place is the room's own again, the doorway she came in by, and her thread to it is drawn straight (she didn't
           walk here from there: like any thread that jumps, a flight home along it goes straight over whatever's between):
           shown a moment, so a fall that flies her through a wall to the door is plainly the thread, not a slip */
        this.snapT = 110;
        Sfx.play('lift'); Sfx.play('twang', 0.5); UI.toast('Bedroll rolled up.', 60);
    },
    /* it's gone somewhere it can't stay (a board gave way under it, its float sank): back in Wren's pack */
    lost(why) {
        Inv.bedroll = null; this.float = null; this.traces = {}; this.sleeper = null;
        const p = G.player;
        if (p && p.mark && p.mark.bed === 'roll') { if (p.state === 'normal') p.dropBed(); else p.mark.bed = false; }
        G.pendingToast = why || 'Your Bedroll tumbled away... and turned up, rolled, in your pack.';
    },
    homeward(p) {
        const b = Inv.bedroll; if (!b) return;
        Stats.count('homeward');
        if (b.area === p.area.id) {
            if (p.tx === b.tx && p.ty === b.ty) { UI.toast("You're home already."); return; }
            /* up above and down below are two places: a floor's in the way */
            if (typeof Layers !== 'undefined' && Layers.layered(p.area)) {
                const r0 = p.area.roomAt(p.tx, p.ty), r1 = p.area.roomAt(b.tx, b.ty);
                if (r0 && r1 && !!r0.above !== !!r1.above) { UI.toast(r1.above ? 'Your Bedroll is down below. The floor is in the way.' : 'Your Bedroll is up above. The floor is in the way.'); return; }
            }
            /* a bed took over as the mark since: fly straight to the Bedroll */
            const straight = !(p.mark && p.mark.bed === 'roll');
            p.mark = this.mark();
            if (straight) p.trace = [[b.tx, b.ty]];
            p.flyHome({ homeward: true, straight });
            return;
        }
        if (!AREAS[b.area] || p.area.def.noHomeward) { UI.toast(p.area.def.noHomeward || 'Home is too far away to fly to from here.'); return; }
        /* from another place: up and away, and down at the Bedroll */
        Stats.count('homeward:far');
        /* what Wren carries can't come so far: it goes home, as things do */
        if (p.carry) { p.dropCarry(); UI.toast('What you were carrying tugs out of your hands, homeward.', 120); }
        Script.run(function* () {
            Sfx.play('flight');
            const pl = G.player; pl.state = 'hop'; pl.hop = { fx: pl.x, fy: pl.y, tx: pl.x, ty: pl.y - 40, t: 0, dur: 30, h: 30 };
            yield* fadeOut(24);
            World.enter(b.area, b.tx, b.ty, { dir: DOWN });
            /* the Bedroll may have gone with its float since (or been lost): land where it is now, on open ground */
            Bedroll.update(G.map);
            const nb = Inv.bedroll, q = G.player;
            if (nb && nb.area === G.map.id) {
                const [lx, ly] = q.landingSpot(nb.tx, nb.ty); q.x = lx * T + 8; q.y = ly * T + 10;
                Bedroll.claim(q, G.map); Cam.snap(q);
            }
            Sfx.play('land'); Fx.dust(G.player.x, G.player.y);
            G.player.inv = 40;
            for (const h of Player.onLand) h(G.player, null);
            yield* fadeIn(24);
        });
    },
    update(area) {
        const b = Inv.bedroll, p = G.player;
        let mat = area.ents.find(e => e.kind === 'bedrollmat' && !e.removed);
        if (!this.lies(area)) { if (mat) area.remove(mat); if (this.float && this.float.area === area) this.float = null; return; }
        if (!mat) {
            mat = area.add(new BedrollMat(b.tx, b.ty));
            /* the place built afresh (or a load): find the float it was lying on, wherever that is now */
            if (!this.float && b.fid) {
                const o = area.ents.find(e => e.floats && !e.removed && Bedroll.floatId(e) === b.fid);
                if (o) {
                    this.float = o; b.tx = o.tx; b.ty = o.ty;
                    if (p && p.mark && p.mark.bed === 'roll' && p.mark.area === area.id) { p.mark.tx = b.tx; p.mark.ty = b.ty; }
                }
            }
            if (!this.float) { const o = area.at(b.tx, b.ty); if (o && o.floats) this.float = o; }
        }
        const f = this.float;
        if (f) {
            if (f.removed || f.area !== area || f.carried) { this.float = null; if (!this.ground(area, b.tx, b.ty)) return this.lost(); }
            else if (f.tx !== b.tx || f.ty !== b.ty) {
                b.tx = f.tx; b.ty = f.ty;
                if (p && p.mark && p.mark.bed === 'roll' && p.mark.area === area.id) { p.mark.tx = b.tx; p.mark.ty = b.ty; }
            }
        } else if (!this.ground(area, b.tx, b.ty) && !(p.flying && p.mark && p.mark.bed === 'roll')) {
            const o = area.at(b.tx, b.ty);
            if (!o || !o.floats) return this.lost();
        }
    },
};
SFX.lay = (o, t) => { Audio.hit(o, t, 0.12, 0.1, 300, 1200); Audio.tone(o, t + 0.05, 392, 0.12, 'triangle', 0.14, { slide: 330 }); };
SFX.yawn = (o, t) => { Audio.tone(o, t, 330, 0.5, 'triangle', 0.16, { slide: 196 }); };
SFX.boing = (o, t) => { Audio.tone(o, t, 180, 0.22, 'triangle', 0.2, { slide: 520 }); Audio.tone(o, t, 360, 0.18, 'p25', 0.05, { slide: 900 }); };
SFX.crumble = (o, t) => { Audio.hit(o, t, 0.3, 0.18, 120, 900); Audio.tone(o, t, 160, 0.2, 'triangle', 0.1, { slide: 60 }); };
SFX.snort = (o, t) => { Audio.hit(o, t, 0.1, 0.14, 200, 700); Audio.tone(o, t + 0.05, 140, 0.12, 'p50', 0.1, { slide: 220 }); };
SFX.puff = (o, t) => Audio.hit(o, t, 0.4, 0.14, 600, 2400);

/* a load in a House starts at Wren's mark: the Bedroll, if it lies there. Laid on a float, it went where the float
   went, and the place built afresh has the float back at its own home: she starts on it there, not where it was when
   she saved (which may be somewhere only the float could take her) */
{
    const apply0 = Save.apply;
    Save.apply = function (s) {
        apply0.call(this, s);
        const p = G.player, a = G.map, b = Inv.bedroll, m = s && s.pos && s.pos.mark;
        if (!p || !a || !a.def.house || !m || m.bed !== 'roll' || !b || !b.fid || b.area !== a.id) return;
        Bedroll.update(a);
        const nb = Inv.bedroll;
        if (!nb || nb.area !== a.id || (nb.tx === m.tx && nb.ty === m.ty)) return;
        const [lx, ly] = p.landingSpot(nb.tx, nb.ty);
        p.x = lx * T + 8; p.y = ly * T + 10; p.setMark(); Cam.snap(p);
    };
}

/* keep the trace in the Bedroll's place when Wren goes elsewhere, so it still leads home on her return */
{
    const enter = World.enter;
    World.enter = function (...args) { Bedroll.stash(); Bedroll.float = null; Bedroll.sleeper = null; return enter.apply(this, args); };
}
/* what Wren carries goes the way she goes, a flight home as much as a reel (its trace, and so its shards' way home, runs
   along the flight, tile by tile; a Bell's snap home goes round, not through, so the trace jumps) */
{
    const fly0 = Player.prototype.updateFlight;
    Player.prototype.updateFlight = function () { const r = fly0.call(this); if (this.carry && this.carry.ret) Return.moved(this.carry, this.tx, this.ty); return r; };
}

/* the Bedroll where it lies: drawn on the floor (on its float, if it's on one) */
class BedrollMat extends Ent {
    constructor(tx, ty) { super('bedrollmat'); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.floor = true; }
    get sortY() { return -1000 + this.y; }
    update() { const b = Inv.bedroll; if (b) { this.tx = b.tx; this.ty = b.ty; } const f = Bedroll.float; this.x = f ? f.px : this.tx * T; this.y = f ? f.py : this.ty * T; }
    draw(cx, cy) {
        const im = spr('bedroll_mat'); if (!im) return;
        Gfx.img(im, Math.round(this.x - cx), Math.round(this.y - cy + (Bedroll.float ? -2 : 0)));
        /* Wren's own red stitch, on the pillow */
        if ((G.t >> 5) % 2) { Gfx.rect(this.x - cx + 3, this.y - cy + 5, 1, 1, THREAD.wren); Gfx.rect(this.x - cx + 5, this.y - cy + 5, 1, 1, THREAD.wren); Gfx.rect(this.x - cx + 4, this.y - cy + 6, 1, 1, THREAD.wren); Gfx.rect(this.x - cx + 3, this.y - cy + 7, 1, 1, THREAD.wren); Gfx.rect(this.x - cx + 5, this.y - cy + 7, 1, 1, THREAD.wren); }
    }
}

/* C taps lay it (or roll it up when you're beside it); held, it takes you Homeward */
TOOLS.bedroll = {
    HOLD: 20,
    down: false, charge: 0,
    use(p) {
        this.down = true; this.charge = 0;
        if (!Inv.bedroll) { this.down = false; Bedroll.lay(p); }
    },
    hold(p) {
        if (!this.down) return;
        this.charge++;
        if (this.charge >= this.HOLD) { this.down = false; this.charge = 0; if (Inv.bedroll) Bedroll.homeward(p); }
    },
    unhold(p) {
        if (!this.down) return;
        this.down = false; this.charge = 0;
        if (Inv.equipped !== 'bedroll' || !p || p.state !== 'normal') return;
        if (Bedroll.near(p)) Bedroll.rollUp(p); else Bedroll.lay(p);
    },
    update(area) { Bedroll.update(area); if (Bedroll.snapT > 0) Bedroll.snapT--; },
    draw(cx, cy) {
        const p = G.player;
        /* just rolled up: Wren's red thread, back along her trace to the doorway's mark (straight where it jumps) */
        const m = p && p.mark;
        if (Bedroll.snapT > 0 && m && !m.bed && p.area && m.area === p.area.id && p.state === 'normal') {
            const pts = p.trace.map(([x, y]) => [x * T + 8 - cx, y * T + 9 - cy]);
            pts.push([p.x - cx, p.y - cy - 4]);
            Gfx.alpha(Math.min(1, Bedroll.snapT / 40));
            for (let i = 0; i + 1 < pts.length; i++) { Gfx.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, 'rgba(20,10,20,0.35)'); Gfx.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], THREAD.wren); }
            Marks.draw(m.tx * T - cx, m.ty * T - cy, THREAD.wren, true);
            Gfx.alpha(1);
        }
        if (!this.down || this.charge < 4 || !Inv.bedroll || !p) return;
        /* a ring of stitches filling in over Wren's head */
        const n = Math.round(12 * this.charge / this.HOLD);
        for (let i = 0; i < 12; i++) { const t = -Math.PI / 2 + i / 12 * Math.PI * 2; Gfx.rect(Math.round(p.x - cx + Math.cos(t) * 7), Math.round(p.y - cy - 26 + Math.sin(t) * 5), 2, 1, i < n ? THREAD.wren : '#5a4a6a'); }
    },
};

/* a bed: lie down, and this is where you wake (Wren's mark, till you leave the place or choose another) */
SPAWN.bed = (tx, ty, p = {}) => {
    const big = p.size === 'big';
    const pr = new Prop(tx, ty, { im: ART[p.look || 'bed'] || ART.bed, solid: big ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0], [0, 1]], oy: big ? 0 : 0 });
    pr.baseY = 30;
    pr.isBed = true;
    pr.interact = () => {
        const pl = G.player;
        if (pl.carry) { UI.toast('Not with your hands full.'); return true; }
        if (pr.taken && pr.taken()) { UI.toast(pr.takenLine || 'Somebody is asleep in it.'); return true; }
        Script.run(function* () {
            Sfx.play('lay');
            if (!Progress.flag('bed_first')) {
                Progress.set('bed_first');
                pl.state = 'sleep'; pl.inBed = pr;
                yield* say(null, 'You lie down, just for a moment. The quilt smells of lavender. Somewhere a long way off, somebody is humming.');
                pl.state = 'normal'; pl.inBed = null;
                yield* say(null, 'When you get up, the bed keeps the shape of you. However far you wander in this place, this is where you would wake.');
            }
            pl.mark = { area: pl.area.id, tx: pl.tx, ty: pl.ty, bed: 'bed' };
            pl.trace = [[pl.tx, pl.ty]];
            Fx.text(pl.x, pl.y - 20, 'z z z', '#d8c8f8');
            Stats.count('beds');
            UI.toast('This bed is your mark now.', 90);
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && (f.ty === ty || f.ty === ty + 1 || (big && (f.tx === tx + 1)));
    if (big) pr.talkBox = (pl, f) => f.tx >= tx && f.tx <= tx + 1 && f.ty >= ty && f.ty <= ty + 1;
    return pr;
};

/* crumbling boards: they give way once whatever stood on them steps off; they mend when Wren comes home from
   a flight, or leaves the room (outdoors: wanders off a way) */
class Crumble extends FloorThing {
    constructor(tx, ty, p = {}) { super('crumble', tx, ty, p); this.state = 'whole'; this.t = 0; }
    onAdd(area) { this.orig = area.chars[this.ty * area.w + this.tx]; this.room = area.roomAt ? area.roomAt(this.tx, this.ty) : null; }
    update() {
        const a = this.area;
        if (this.state === 'gone') {
            if (!a.kind(this.tx, this.ty).pit) { this.state = 'filled'; return; }        /* a stray filled it in */
            if (this.awayFrom()) this.mend();
            return;
        }
        if (this.state === 'filled') return;
        const w = this.weighed() || this.walkerOn();
        if (this.state === 'whole') { if (w) this.state = 'trod'; return; }
        if (this.state === 'trod') { if (!w) { this.state = 'cracking'; this.t = 0; Sfx.play('crumble', 0.4); } return; }
        if (this.state === 'cracking') {
            /* a foot back on it straight away (a wobble on the edge) doesn't count as leaving it */
            if (w && this.t < 6) { this.state = 'trod'; return; }
            if (++this.t >= (this.slow || 16)) this.fall();
        }
    }
    /* anything walking (a Snoreling, the Matron) weighs on it too */
    walkerOn() { for (const m of this.area.walkers) if (m.alive !== false && m.feetOn && m.feetOn(this.tx, this.ty)) return true; return false; }
    fall() {
        const a = this.area;
        this.state = 'gone';
        a.setCell(this.tx, this.ty, 'o');
        Sfx.play('crumble');
        Fx.burst(this.tx * T + 8, this.ty * T + 10, '#9a7a5a');
        Stats.count('crumbled');
        const b = Inv.bedroll;
        if (b && b.area === a.id && b.tx === this.tx && b.ty === this.ty && !Bedroll.float) Bedroll.lost('The board gave way under your Bedroll. It turned up, rolled, in your pack.');
    }
    awayFrom() {
        const p = G.player;
        if (!p || p.area !== this.area) return true;
        if (this.room) return Cam.room && Cam.room !== this.room && !p.flying;
        return Math.abs(p.tx - this.tx) + Math.abs(p.ty - this.ty) > 16;
    }
    mend() {
        if (this.state !== 'gone') return;
        const a = this.area;
        if (a.at(this.tx, this.ty)) return;
        a.setCell(this.tx, this.ty, this.orig || '.');
        this.state = 'whole'; this.t = 0;
        const p = G.player;
        if (p && p.area === a && Cam.room === this.room) Fx.sparkle(this.tx * T + 8, this.ty * T + 8, '#e8d8b8');
    }
    static mendAll(area, room) { for (const e of area.ents) if (e.kind === 'crumble' && (!room || e.room === room)) e.mend(); }
    draw(cx, cy) {
        if (this.state === 'gone' || this.state === 'filled') return;
        const sh = this.state === 'cracking' ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        Gfx.img(spr(this.state === 'whole' ? 'crumble' : 'crumble_cracked'), this.x - cx + sh, this.y - cy);
    }
}
SPAWN.crumble = (x, y, p) => new Crumble(x, y, p);
Player.onLand.push((p) => { if (p.area) Crumble.mendAll(p.area, p.area.roomAt ? p.area.roomAt(p.tx, p.ty) : null); });

/* a dreamcatcher hung over the floor (or water): it lights when Wren flies through it */
class DreamRing extends Ent {
    constructor(tx, ty, p = {}) { super('dreamring', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.lit = 0; this.time = p.time || 600; }
    get sortY() { return this.y + 24; }
    flyThrough(pl, x0, y0, x1, y1) {
        const cx = this.tx * T + 8, cy = this.ty * T + 10;
        /* the nearest the flight came to the ring's middle */
        const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy;
        const u = L ? clamp(((cx - x0) * dx + (cy - y0) * dy) / L, 0, 1) : 0;
        if (Math.hypot(x0 + dx * u - cx, y0 + dy * u - cy) > 9) return;
        /* a flight that starts under the ring hasn't gone through it */
        const f = pl.flight; if (f && f.pts && Math.hypot(f.pts[0][0] - cx, f.pts[0][1] - cy) < 14) return;
        if (!this.lit) { Sfx.play('blip'); Fx.ring(cx, cy - 8, '#d8c8f8'); Stats.count('dreamrings'); }
        this.lit = this.time;
        /* the flight remembers which dreams it went through (a room's pair: its good one, 1, and its bad one, 2) */
        if (this.dream && f) { const d = f.dreams || (f.dreams = {}); d[this.dream] = (d[this.dream] || 0) | (this.bad ? 2 : 1); }
    }
    update() { if (this.lit > 0) { this.lit--; if (this.sig) Signals.set(this.area, this.sig); } }
    draw(cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy - 4 + Math.round(Math.sin(G.t / 30 + this.tx) * 1.5);
        Gfx.alpha(0.2); Gfx.rect(x - 4, this.y - cy + 12, 8, 2, PAL.ink); Gfx.alpha(1);
        Gfx.line(x, y - 14, x, y - 8, '#7a6a9a');
        const col = this.lit ? '#f7e08a' : '#b48ce8';
        for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; Gfx.rect(Math.round(x + Math.cos(t) * 6), Math.round(y + Math.sin(t) * 6), 1, 1, col); }
        Gfx.line(x - 4, y, x + 4, y, this.lit ? '#fff4c0' : '#8a7aaa'); Gfx.line(x, y - 4, x, y + 4, this.lit ? '#fff4c0' : '#8a7aaa');
        Gfx.rect(x - 4, y + 6, 1, 4, '#e8e0f0'); Gfx.rect(x + 3, y + 6, 1, 4, '#e8e0f0'); Gfx.rect(x, y + 6, 1, 5, '#f0b0c8');
        if (this.lit) { Gfx.alpha(0.3 + 0.15 * Math.sin(G.t / 6)); Gfx.circle(x, y, 8, '#f7e08a'); Gfx.alpha(1); }
    }
}
SPAWN.dreamring = (x, y, p) => new DreamRing(x, y, p);

/* bouncy moss: step onto it and it hops you on (the way you were going, or the way it's grown) */
class Moss extends FloorThing {
    constructor(tx, ty, p = {}) { super('moss', tx, ty, p); this.armed = true; this.dist = p.dist || 2; this.squish = 0; }
    update() {
        if (this.squish > 0) this.squish--;
        const p = G.player;
        if (!p || p.area !== this.area || !p.feetOn(this.tx, this.ty) || p.state !== 'normal') { if (!p || !p.feetOn(this.tx, this.ty)) this.armed = true; return; }
        if (!this.armed || Script.blocking()) return;
        const d = this.dir !== undefined ? dirByName(this.dir) : p.dir;
        const lx = this.tx + DX[d] * this.dist, ly = this.ty + DY[d] * this.dist;
        this.armed = false;
        const a = this.area, k = a.kind(lx, ly), o = a.at(lx, ly);
        if (!a.inside(lx, ly) || k.solid || k.pit || k.deep || k.ledge || k.fog || (o && !Water.rideable(o))) { Sfx.play('boing', 0.3); this.squish = 8; return; }
        this.squish = 12;
        p.dir = d;
        p.hopTo(lx * T + 8, ly * T + 10, 16 + this.dist * 6, 10 + this.dist * 4);
        Sfx.play('boing');
        Stats.count('bounces');
    }
    draw(cx, cy) { Gfx.img(spr(this.squish > 0 ? 'moss_squish' : 'moss'), this.x - cx, this.y - cy); }
}
SPAWN.moss = (x, y, p) => new Moss(x, y, p);

/* sleep puffs: a step too close (or a knock) and they burst; breathe the spores and you doze off, and wake on
   your mark. Snorelings in the cloud go back to sleep where they stand. They grow back. */
class Puffball extends Ent {
    constructor(tx, ty, p = {}) { super('puffball', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.state = 'ripe'; this.t = 0; this.cloud = 0; this.grow = p.grow || 420; }
    get sortY() { return this.y + 14; }
    blocks(tx, ty) { return this.state === 'ripe' && tx === this.tx && ty === this.ty; }
    hurtBox() { return this.state === 'ripe' ? { x0: this.x + 2, x1: this.x + 14, y0: this.y + 2, y1: this.y + 14 } : null; }
    struck() { this.burst(); }
    hit() { this.burst(); }
    hooked() { this.burst(); }
    burst() {
        if (this.state !== 'ripe') return;
        this.state = 'burst'; this.t = 0; this.cloud = 110;
        Sfx.play('puff'); Fx.poof(this.x + 8, this.y + 8);
        Stats.count('puffs');
    }
    inCloud(x, y) { return this.cloud > 0 && Math.abs(tileOf(x) - this.tx) <= 1 && Math.abs(tileOf(y) - this.ty) <= 1; }
    update() {
        const p = G.player, a = this.area;
        if (this.state === 'ripe') {
            if (p && p.area === a && p.state === 'normal' && !p.flying && Math.abs(p.tx - this.tx) <= 1 && Math.abs(p.ty - this.ty) <= 1) this.burst();
            return;
        }
        this.t++;
        if (this.cloud > 0) {
            this.cloud--;
            if (p && p.area === a && p.state === 'normal' && this.inCloud(p.x, p.y)) {
                p.dozeT = (p.dozeT || 0) + 2;
                if (p.dozeT > 70) { p.dozeT = 0; p.startFall('doze'); }
            }
            for (const m of a.walkers) if (m.doze && m.alive !== false && this.inCloud(m.x, m.y)) m.doze();
        }
        if (this.t > this.grow && !(p && p.area === a && Math.abs(p.tx - this.tx) <= 1 && Math.abs(p.ty - this.ty) <= 1)) { this.state = 'ripe'; this.t = 0; Fx.sparkle(this.x + 8, this.y + 8, '#d8c8f8'); }
    }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        if (this.state === 'ripe') Gfx.img(spr('puffball'), x, y + Math.round(Math.sin(G.t / 20 + this.tx) * 0.6));
        else Gfx.img(spr('puffball_stalk'), x, y);
        if (this.cloud > 0) {
            const k = this.cloud / 110;
            Gfx.alpha(0.35 * Math.min(1, k * 2));
            for (let i = 0; i < 14; i++) {
                const t = i / 14 * Math.PI * 2 + G.t / 40, r = 12 + 6 * Math.sin(i * 1.7 + G.t / 25);
                Gfx.circle(x + 8 + Math.cos(t) * r, y + 8 + Math.sin(t) * r * 0.8, 5, '#d8c8f8');
            }
            Gfx.alpha(1);
        }
    }
}
SPAWN.puffball = (x, y, p) => new Puffball(x, y, p);
/* Wren's doze wears off when she's out of the spores */
{
    const after = Player.prototype.afterMove;
    Player.prototype.afterMove = function () { if (this.dozeT > 0) this.dozeT--; return after.call(this); };
}

/* Snorelings: asleep where they lie; disturbed, they shuffle after you with their arms out; after a while they
   go to bed and drop off again: the nearest bed they can get to, their own spot, a cradle nobody's in (anything set out
   for a little one to sleep in: `cot`) or the Bedroll. The same in the wood as in the House */
const Snooze = {
    REACH: 12,
    /* the way to the nearest free bed, by the tiles it would walk (nearest first); null if none is in reach */
    route(e) {
        const a = e.area, b = Inv.bedroll, beds = new Map();
        beds.set(key2(e.hx, e.hy), { nest: true });
        if (b && b.area === a.id && !Bedroll.sleeper && e.D.likesBeds !== false) beds.set(key2(b.tx, b.ty), { roll: true });
        for (const c of a.ents) if (c.cot && !c.removed && !c.blocks(c.tx, c.ty, e)) beds.set(key2(c.tx, c.ty), { cot: c });
        const sx = e.tx, sy = e.ty, prev = new Map([[key2(sx, sy), null]]), q = [[sx, sy]];
        for (let i = 0; i < q.length; i++) {
            const [x, y] = q[i], bed = beds.get(key2(x, y));
            if (bed) { const path = []; for (let c = [x, y]; c; c = prev.get(key2(c[0], c[1]))) path.unshift(c); return Object.assign({ x, y, path, i: 1 }, bed); }
            for (const d of [UP, DOWN, LEFT, RIGHT]) {
                const nx = x + DX[d], ny = y + DY[d], k = key2(nx, ny);
                if (prev.has(k) || Math.abs(nx - sx) > this.REACH || Math.abs(ny - sy) > this.REACH || e.solidAt(nx, ny)) continue;
                prev.set(k, [x, y]); q.push([nx, ny]);
            }
        }
        return null;
    },
    /* still free for it? (somebody else may have got into the cradle first, or onto the Bedroll, or picked it up) */
    free(e, r) {
        if (r.roll) { const b = Inv.bedroll; return !!(b && b.area === e.area.id && b.tx === r.x && b.ty === r.y && !Bedroll.sleeper); }
        if (r.cot) return !r.cot.removed && !r.cot.blocks(r.x, r.y, e);
        return true;
    },
};
AI.snore = (e, p) => {
    e.modeT++;
    const near = p && p.area === e.area && p.state === 'normal' && Math.hypot(p.x - e.x, p.y - e.y) < 2.6 * T;
    if (e.mode === 'idle') e.mode = 'sleep';
    if (e.mode === 'sleep') {
        if (near && p.walking) e.stir = (e.stir || 0) + 1; else if (e.stir > 0) e.stir -= 0.25;
        if (e.stir > 50) e.wake();
        return;
    }
    if (e.mode === 'chase') {
        if (p && p.area === e.area && p.state === 'normal') {
            const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, sp = e.D.speed || 0.55;
            e.dir = dirOf(dx, dy);
            e.move(dx / d * sp, dy / d * sp);
            e.anim++;
            if (d > 9 * T) e.modeT += 3;
        }
        if (e.modeT > (e.D.chase || 420)) {
            /* off to bed: the nearest it can get to (its own, a cradle, a Bedroll lying free) */
            e.mode = 'bed'; e.modeT = 0; e.stuck = 0; e.lost = 0;
            e.bed = Snooze.route(e);
        }
        return;
    }
    if (e.mode === 'bed') {
        let r = e.bed;
        /* somebody's in it already (or the Bedroll's gone): the next nearest */
        if (r && !Snooze.free(e, r)) r = e.bed = Snooze.route(e);
        /* none in reach: back along its own trace to its own */
        if (!r) { e.mode = 'home'; e.modeT = 0; return; }
        const [nx, ny] = r.path[Math.min(r.i, r.path.length - 1)];
        const gx = nx * T + 8, gy = ny * T + 10, dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy);
        const sp = (e.D.speed || 0.55) * 0.9;
        if (d < sp + 0.5) {
            e.x = gx; e.y = gy;
            if (r.i < r.path.length - 1) { r.i++; return; }
            /* in bed: asleep */
            e.mode = 'sleep'; e.stir = 0; e.bed = null;
            if (r.roll) { Bedroll.sleeper = e; e.onRoll = true; }
            if (r.nest) e.trace = [[e.hx, e.hy]];
            else { Fx.text(e.x, e.y - 16, 'z z', '#d8c8f8'); if (p && p.area === e.area && Math.hypot(p.x - e.x, p.y - e.y) < 12 * T) Sfx.play('yawn', 0.5); }
            return;
        }
        e.dir = dirOf(dx, dy); e.anim++;
        const ox = e.x, oy = e.y;
        e.move(dx / d * sp, dy / d * sp);
        if (Math.abs(e.x - ox) + Math.abs(e.y - oy) < 0.05) e.stuck++; else e.stuck = 0;
        /* something's standing in the way: find the way again; still stuck, back along its own trace instead */
        if (e.stuck > 40) { e.stuck = 0; r = e.bed = ++e.lost < 3 ? Snooze.route(e) : null; if (!r) { e.mode = 'home'; e.modeT = 0; } }
        return;
    }
    if (e.mode === 'home') { if (e.goHome(0.6)) { e.mode = 'sleep'; e.stir = 0; } }
};
class Snoreling extends Enemy {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ type: 'snoreling' }, p)); this.mode = 'sleep'; this.stir = 0; this.stuck = 0; }
    wake() {
        if (!this.alive || this.mode === 'chase') return;
        if (Bedroll.sleeper === this) Bedroll.sleeper = null;
        this.onRoll = false;
        this.mode = 'chase'; this.modeT = 0; this.stir = 0;
        Sfx.play('snort'); Fx.text(this.x, this.y - 20, '!', '#f7d64a');
    }
    doze() { if (this.alive && this.mode !== 'sleep') { this.mode = 'sleep'; this.stir = -60; Fx.text(this.x, this.y - 18, 'z', '#d8c8f8'); } }
    struck(by, dmg, dir, shard) { super.struck(by, dmg, dir, shard); if (this.alive) this.wake(); else if (Bedroll.sleeper === this) Bedroll.sleeper = null; }
    shoved(d, pace, by) { super.shoved(d, pace, by); }
}
SPAWN.snoreling = (x, y, p) => new Snoreling(x, y, p);

function initBedrollKit() {
    ENEMY.snoreling = { hp: 2, ai: 'snore', r: 5, tall: 12, speed: 0.55, yarn: THREAD.mallow, weight: WEIGHT.medium, drop: 0.4 };
    const sn = { m: '#b48ce8', M: '#8a64c4', w: '#fbf6ea', c: '#6a8ec8', C: '#4a6aa8', e: '#2a1f2d', p: '#f0a0b8' };
    defSprite('snore_sleep', ['......cc......', '.....cCcc.....', '....cCcccw....', '...kkkkkkww...', '..kmmmmmmmmk..', '.kmmmmmmmmmmk.', '.kmmeemmeemmk.', '.kmmmmmmmmmmk.', '.kmpmmmmmmpmk.', '.kMmmmmmmmmMk.', '..kMMMMMMMMk..', '...kkkkkkkk...'], sn);
    defSprite('snore_0', ['......cc......', '.....cCcc.....', '....cCcccw....', '...kkkkkkww...', 'kkkmmmmmmmmkkk', 'kmmmmmmmmmmmmk', 'kkkmwemmwemkkk', '.kmmmmmmmmmmk.', '.kmpmmeemmpmk.', '.kMmmmmmmmmMk.', '..kMMkkkkMMk..', '..kkk....kkk..'], sn);
    defSprite('snore_1', ['......cc......', '.....cCcc.....', '....cCcccw....', '...kkkkkkww...', 'kkkmmmmmmmmkkk', 'kmmmmmmmmmmmmk', 'kkkmwemmwemkkk', '.kmmmmmmmmmmk.', '.kmpmmeemmpmk.', '.kMmmmmmmmmMk.', '..kkMMkkMMkk..', '...kkk..kkk...'], sn);
    ENEMY_DRAW.snoreling = e => e.mode === 'sleep' ? spr('snore_sleep') : spr('snore_' + ((e.anim >> 4) % 2));
    defSprite('bedroll_mat', ['................', '................', '..kkkkkkkkkkkk..', '..kwwwwkmmmmmk..', '.kwwwwwkmMmMmmk.', '.kwwwwwkmmmmmmk.', '.kwwwwwkmMmMmmk.', '.kwwwwwkmmmmmmk.', '..kwwwwkmMmMmk..', '..kkkkkkmmmmmk..', '.......kmMmMmk..', '.......kmmmmmk..', '.......kkkkkkk..', '................', '................', '................'],
        { m: '#b48ce8', M: '#7d5bc4', w: '#fbf6ea' });
    defSprite('crumble', ['kkkkkkkkkkkkkkkk', 'kbbbbbbBkbbbbbbk', 'kbBbbbbBkbbbbBbk', 'kbbbbbbBkbbbbbbk', 'kBBBBBBBkBBBBBBk', 'kkkkkkkkkkkkkkkk', 'kbbbbbbbbBkbbbbk', 'kbbbBbbbbBkbbbbk', 'kbbbbbbbbBkbbBbk', 'kBBBBBBBBBkBBBBk', 'kkkkkkkkkkkkkkkk', 'kbbbbkbbbbbbbbbk', 'kbbbbkbbbbBbbbbk', 'kbBbbkbbbbbbbbbk', 'kBBBBkBBBBBBBBBk', 'kkkkkkkkkkkkkkkk'],
        { b: '#c8a07a', B: '#8a6a4a' });
    defSprite('crumble_cracked', ['kkkkkkkkkkkkkkkk', 'kbbbbbbBkbbkbbbk', 'kbBbkbbBkbbbkBbk', 'kbbbbkbBkbbbbbbk', 'kBBBBBkBkBBBBBBk', 'kkkkkkkkkkkkkkkk', 'kbbbbbbbbBkbbbbk', 'kbbkkbbbbBkbbbbk', 'kbbbbkbbbBkbbkbk', 'kBBBBBkBBBkBBBBk', 'kkkkkkkkkkkkkkkk', 'kbbbbkbbbkbbbbbk', 'kbbbbkbbbbkbbbbk', 'kbBbbkbbkbbbbbbk', 'kBBBBkBBBBBkBBBk', 'kkkkkkkkkkkkkkkk'],
        { b: '#b8906a', B: '#7a5a3a' });
    const moss = { g: '#7ad06a', G: '#4e9a4e', l: '#b8f08a', d: '#2e6a3e' };
    defSprite('moss', ['................', '................', '................', '................', '.....kkkkkk.....', '...kkglgglgkk...', '..kgglggglgggk..', '.kgGgglgggglggk.', '.kgggggGggggggk.', '.kGgggggggGgggk.', '.kdGGgggggggGdk.', '..kddGGGGGGddk..', '...kkkddddkkk...', '.....kkkkkk.....', '................', '................'], moss);
    defSprite('moss_squish', ['................', '................', '................', '................', '................', '................', '................', '...kkkkkkkkkk...', '.kkgglgggglggkk.', 'kgGgggglgggggGgk', 'kGggggggggGgggGk', 'kdGGgggggggGGGdk', '.kddGGGGGGGddkk.', '..kkkkkkkkkkkk..', '................', '................'], moss);
    const pf = { w: '#e8dcf8', W: '#c4b0e8', s: '#d8c8f8', t: '#a08ac8', T: '#7a64a8', d: '#5a4a7a' };
    defSprite('puffball', ['................', '................', '.....kkkkkk.....', '...kkwwswwwkk...', '..kwwswwwwswWk..', '.kwswwwwswwwwWk.', '.kwwwwswwwwsWWk.', '.kwswwwwwswwWWk.', '.kWwwwswwwwWWWk.', '..kWWwwwwWWWWk..', '...kkWWWWWWkk...', '.....kkttkk.....', '......ktTk......', '......kTTk......', '.....kkddkk.....', '................'], pf);
    defSprite('puffball_stalk', ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '......kkkk......', '.....kttTTk.....', '......ktTk......', '......kTTk......', '.....kkddkk.....', '................'], pf);
    ART.bed = paintSprite(16, 32, x => {
        x.fillStyle = '#5a3a2a'; x.fillRect(0, 0, 16, 32);
        x.fillStyle = '#9a6438'; x.fillRect(1, 1, 14, 30);
        x.fillStyle = '#c48a52'; x.fillRect(1, 1, 14, 3);
        x.fillStyle = '#fbf6ea'; x.fillRect(3, 5, 10, 6); x.fillStyle = '#e0d8ec'; x.fillRect(3, 10, 10, 1);
        x.fillStyle = '#b48ce8'; x.fillRect(1, 12, 14, 17);
        x.fillStyle = '#9a76d8'; for (let i = 0; i < 4; i++) x.fillRect(1, 14 + i * 4, 14, 1);
        x.fillStyle = '#d8c8f8'; x.fillRect(1, 12, 14, 1);
        x.fillStyle = '#7d5bc4'; x.fillRect(1, 28, 14, 1);
        x.fillStyle = '#5a3a2a'; x.fillRect(0, 29, 16, 3); x.fillStyle = '#7a4e32'; x.fillRect(1, 29, 14, 1);
    });
}
CONTENT_INIT.push(initBedrollKit);
