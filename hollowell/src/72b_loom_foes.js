/* The Loom's two guardians. The Shuttle: a great wooden shuttle that flies to and fro along its lane, through anything
   soft; put an offcut (a stray block) in its way and it jams on it, and while it's jammed it can be knocked; it shakes
   the offcut out of the lane and starts again (two knocks). The Weaver: see below. */

/* ---------------- the Shuttle ---------------- */
class Shuttle extends Ent {
    constructor(tx, ty, p = {}) {
        super('shuttle', p);
        this.x = tx * T + 8; this.y = ty * T + 8; this.lane = ty; this.hx = tx;
        this.hp = 2; this.state = 'sleep'; this.st = 0; this.t = 0; this.dir = 1; this.flash = 0; this.alive = true;     /* (two knocks: a mini-boss shouldn't outstay its idea) */
    }
    get sortY() { return this.alive ? this.y + 8 : this.y - 12; }      /* (split, it lies on the floor, under whoever walks by) */
    get arena() { return this.area.roomAt(this.hx, this.lane); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'shuttle') s.shut = shut; }
    hurtBox() { return this.alive && this.state !== 'sleep' ? { x0: this.x - 14, x1: this.x + 14, y0: this.y - 10, y1: this.y + 6 } : null; }
    update() {
        if (!this.alive) { this.deadT = (this.deadT || 0) + 1; return; }
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal') { this.state = 'wait'; this.st = 0; this.shutters(true); Music.play('boss'); Script.run(LoomFoes.shuttleIntro(this)); }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        const sp = 2.6 + (2 - this.hp) * 0.6;
        /* its one dangerous move is its flight: waiting at its end, its lane is lit, wall to wall, before it comes (a heart
           and a half if it finds Wren in it) */
        if (this.state === 'wait') {
            if (this.st === 1) { const t = []; for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!a.kind(x, this.lane).solid) t.push([x, this.lane]); Hazard.tiles(this, t, { tell: 50, dmg: 0, live: 0 }); }
            if (this.st > 50) { this.state = 'fly'; this.st = 0; }
            return;
        }
        if (this.state === 'fly') {
            const nx = this.x + this.dir * sp, tx = tileOf(nx + this.dir * 8), o = a.at(tx, this.lane);
            /* an offcut in the lane: it jams */
            if (o && o.isGrid && !o.fixed) { this.state = 'stuck'; this.st = 0; this.jam = o; G.shake = 6; Sfx.play('hitthing'); Fx.dust(this.x + this.dir * 10, this.y); if (!Progress.flag('shuttle_jam')) { Progress.set('shuttle_jam'); G.pendingToast = 'The Shuttle jams on the offcut and sticks there, quivering.'; } return; }
            const end = this.dir > 0 ? (r.x + r.w - 2) * T + 8 : (r.x + 1) * T + 8;
            if ((this.dir > 0 && nx >= end) || (this.dir < 0 && nx <= end)) { this.x = end; this.dir = -this.dir; this.state = 'wait'; this.st = 0; return; }
            this.x = nx;
            if (p.state === 'normal' && Math.abs(p.x - this.x) < 14 && tileOf(p.y) === this.lane) p.hurt(3, this.x, this.y);
        } else if (this.state === 'stuck') {
            if (this.st > 240) this.unjam();
        }
    }
    /* it shakes the offcut out of its lane and goes back to its end */
    unjam() {
        const o = this.jam, a = this.area;
        if (o && !o.removed && o.tx !== undefined) {
            for (const dy of [1, -1]) if (a.freeForThing(o.tx, o.ty + dy, o) && !a.kind(o.tx, o.ty + dy).pit) { o.startMove(o.tx, o.ty + dy, 10); break; }
        }
        this.jam = null; this.dir = -this.dir; this.state = 'fly'; this.st = 0;
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'stuck') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 4); return; }
        this.hp--; this.flash = 30; G.hitstop = 6; G.shake = 6; Sfx.play('enemyhit');
        Stats.count('boss:shuttle:hit');
        if (this.hp <= 0) return this.defeat();
        this.unjam();
    }
    defeat() {
        this.alive = false; Sfx.play('unravel'); Fx.yarn(this.x, this.y, THREAD.loom);
        Progress.set('loom_shuttle'); this.shutters(false); Music.play('loom');
        Script.run(LoomFoes.shuttleDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) return this.drawSplit(cx, cy);
        const r = this.arena, x = this.x - cx, y = this.y - cy;
        /* its lane's thread, glowing while it waits to go */
        Gfx.line((r.x + 1) * T - cx, y, (r.x + r.w - 1) * T - cx, y, this.state === 'wait' && (this.t >> 2) % 2 ? '#ffffff' : '#aab7c8');
        const im = spr('shuttle');
        if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - 16, y - 10, this.dir < 0);
        if (this.state === 'stuck' && (this.t >> 3) % 2) Font.draw('*', x - 4, y - 18, '#f7d64a');
    }
}
/* split along its grain, the two halves lying apart where it stopped; and all the silver thread wound in it unspooling
   across the floor, in loose loops, out along its lane both ways to the walls */
Shuttle.prototype.drawSplit = function (cx, cy) {
    const t = this.deadT || 0, r = this.arena, x = this.x - cx, y = this.y - cy, im = spr('shuttle');
    for (const d of [-1, 1]) {
        const room = d < 0 ? this.x - (r.x + 1) * T - 2 : (r.x + r.w - 1) * T - 2 - this.x, L = Math.min(room, t * 1.5), pts = [];
        for (let s = 0; s <= L; s += 3) pts.push([x + d * s, y + 4 + Math.round(Math.sin(s / 6 + d) * 3 * Math.min(1, s / 18))]);
        if (pts.length > 1) Threads.path(pts, '#e4ecf5');
    }
    if (im) { const g = Math.round(Math.min(3, t / 5)); Gfx.sub(im, 0, 0, 32, 6, x - 16, y - 10 - g); Gfx.sub(im, 0, 6, 32, 10, x - 16, y - 4 + g); }
};
SPAWN.shuttle = (x, y, p) => Progress.flag('loom_shuttle') ? new Ent('none') : new Shuttle(x, y, p);

/* ---------------- the Weaver ----------------
   It keeps the First Spinner's loom, and learns, in three beats:
   1. it hangs in its web over the loom's well, held by four anchor threads, each holding its own way (below): read each
      and cut it (its silk binds you: the Shears snip you free; caught again while bound, the silk tightens), and down it
      comes into the well, tangled in the old warp at the bottom: knock it.
   2. it climbs the loom to the breast-beam over the well's head and hangs by one thread of its own: no anchors to cut.
      It comes down the well for you and drops (its shadow first), crouches there a moment with its thread lying slack,
      then hauls itself home up the well, its thread pulled tight. A thread pulled tight can be cut anywhere along it
      (the Hanging Gallery's rule): snip it ahead of the Weaver while it's over the well and it drops in. Cut over the
      stone, it lands on its feet and runs straight back up.
   3. it hauls the warp up out of the well after it and clings to the breast-beam, out of reach, and won't come down.
      Something has to drag it down: the Hookline pulls light and middling things to you (the Kiln's tool), so hooked
      from below, it's hauled down its own well toward you, and hangs there dazed, low over the well, before it climbs
      home: cut it at the thing itself (or its thread, on the way home) while it's over the well.
   Nothing to set up again between beats: the posts stay bare once cut; it climbs to its new perch by itself. */
/* Its blows (TELL[8], the last and hardest): silk spat after it rears back, its belly aglow (in its web it swings back
   away from Wren as it does; bound, the Shears cut you free; caught again while bound, a heart and a half; two at once
   in the last beat); a warp thread under Wren plucked taut, the column lit first, then snapping down it (a heart and a
   half; two columns from the second beat); its drop from the breast-beam (its shadow first: two hearts); and in the last
   beat, silk moths shaken down out of the web. Each beat it's knocked into, a heart drifts down. */
const WV = {
    spit: [0, 70, 0, 54], spitSp: [0, 1.7, 1.8, 2.0],      /* (by beat) */
    warp: [0, 200, 180, 160], moths: 300, maxMoths: 3,
    webZ: 30, perchZ: 8, fall: 4, down: 240,
    perchWait: 60, aim: 44, dropSp: 5, bottom: 46, climb: 1.15,
    drag: 5, hang: 84, scurry: 3, reach: 14,
    swing: 13, swingSp: 2, swingHold: 10, tautAt: 9,       /* (1) rearing back in its web: how far, how fast, how long after it spits; how far pulls the long thread tight */
};
/* (1) the web's four anchor threads, three tied to great posts and one up to the loom itself. Each holds in its own way,
   by the Loom's own rules, and is read where it's tied:
   - plain: tied to its post and drawn tight: cut it at the post (or anywhere along it);
   - slack: tied long, it hangs slack, and a slack thread only slides off the blades (the Hanging Gallery's rule); but
     rearing back to spit, the Weaver swings away from whoever it's spitting at, and the thread on her side is pulled tight;
   - asleep: wound up in a cocoon of grey silk and laid to sleep on its post, as the Weaver keeps things (the Larder's
     note): the blades can't find the thread in it, and only a bell wakes it; woken, its silk unwinds back up into the web
     and the knot's bare;
   - loom: tied up on the loom itself, into the cloth over the well's head, out of the blades' reach; but it's drawn
     tight down over the well, and a tight thread can be cut anywhere along it: from the well's rim.
   A thread is cut where it's seen over the floor in front of Wren, or its shadow is; never in the middle of the web,
   which hangs up out of reach. */
const ANCHOR_LINE = {
    slack: 'Hanging slack like that, it only slides off the blades.',
    asleep: "Wound round and round in grey silk, and fast asleep. The blades can't find the thread in there.",
    loom: "That one's tied up on the loom, out of the blades' reach.",
};
/* (what both kinds of anchor share; a kind's own method wins) */
const withAnchorWays = C => { for (const k of Object.keys(AnchorWays)) if (!Object.prototype.hasOwnProperty.call(C.prototype, k)) C.prototype[k] = AnchorWays[k]; };
const AnchorWays = {
    /* drawn tight? (the long one only while the Weaver's swung away from it; the cocoon's not while it sleeps) */
    taut(w) {
        if (this.cut) return false;
        if (this.way === 'asleep') return !this.sleeping;
        if (this.way === 'slack') return this.stretch(w) >= WV.tautAt;
        return true;
    },
    /* how far the Weaver's swung away from this one, along the line from where it's tied to the middle of the web */
    stretch(w) { const [fx, fy] = this.foot, ux = w.web[0] - fx, uy = w.web[1] - fy, d = Math.hypot(ux, uy) || 1; return ((w.sx || 0) * ux + (w.sy || 0) * uy) / d; },
    /* where it meets the Weaver: in the web round it (the loom's thread: the tip of its back) */
    end(w) { return [w.x, w.y - w.z - (this.way === 'loom' ? 20 : 8)]; },
    /* does its thread run over that tile, as it's seen or by its shadow on the floor, clear of the web's middle? */
    over(tx, ty, w) {
        if (this.cut) return false;
        const cx = tx * T + 8, cy = ty * T + 8;
        for (const [a, b, r] of [[this.top, this.end(w), 16], [this.foot, [w.x, w.y], 22]]) {
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
            for (let s = 0; s <= len - r; s += 3) { const x = a[0] + (b[0] - a[0]) * s / len, y = a[1] + (b[1] - a[1]) * s / len; if (Math.abs(x - cx) <= 8.5 && Math.abs(y - cy) <= 8.5) return true; }
        }
        return false;
    },
    /* where on its thread, as it's seen, a snip at that tile would close (over the tile itself, or above its shadow there) */
    seenAt(tx, ty, w) {
        const cx = tx * T + 8, cy = ty * T + 8, seen = [this.top, this.end(w)];
        for (const [a, b, r] of [[this.top, this.end(w), 16], [this.foot, [w.x, w.y], 22]]) {
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
            for (let s = 0; s <= len - r; s += 3) {
                const x = a[0] + (b[0] - a[0]) * s / len, y = a[1] + (b[1] - a[1]) * s / len;
                if (Math.abs(x - cx) <= 8.5 && Math.abs(y - cy) <= 8.5) { const u = s / len; return [lerp(seen[0][0], seen[1][0], u), lerp(seen[0][1], seen[1][1], u)]; }
            }
        }
        return null;
    },
    /* the Shears at it (at its post, or along it): cut, or said why not */
    snipBy(w, atPost) {
        if (this.taut(w)) { Shears.cut(this); Stats.count('boss:weaver:anchor:' + this.way); return true; }
        this.say(atPost && this.way === 'asleep' ? ANCHOR_LINE.asleep : ANCHOR_LINE.slack); Sfx.play('hitthing', 0.5);
        if (atPost && this.way === 'asleep') Fx.text(this.top[0], this.top[1] - 8, 'z', '#e8e0ff');
        return true;
    },
    /* a line about it (at the foot of the screen if its knot's up where notices go: they'd hide what they're about) */
    say(s) { UI.toast(s, 150); const t = UI.toasts.find(q => q.s === s); if (t && this.top[1] - Cam.y < 64) t.low = true; },
    tie() { this.cut = false; this.cuttable = true; this.sleeping = this.way === 'asleep'; this.unwind = 0; },
    onCut() { if (this.cut) return; this.cut = true; this.cuttable = false; this.sleeping = false; this.unwind = 0; Fx.ring(this.top[0], this.top[1], '#e4ecf5'); },
    /* its thread, from where it's tied to the Weaver: tight and straight (pulled tight, the long one shivers, bright); slack,
       a sag that sways; asleep, grey and low, into its cocoon */
    drawThread(w, cx, cy) {
        if (this.cut) return;
        const [ax, ay] = this.top, [bx, by] = this.end(w);
        if (!this.taut(w)) {
            const k = this.way === 'slack' ? clamp(1 - this.stretch(w) / WV.tautAt, 0, 1) : 0.5, sag = 3 + 9 * k, n = 9;
            const pts = [[ax - cx, ay - cy]];
            for (let i = 1; i <= n; i++) { const u = i / n; pts.push([lerp(ax, bx, u) - cx, lerp(ay, by, u) + Math.sin(u * Math.PI) * (sag + Math.sin(G.t / 17 + this.tx) * k * 1.5) - cy]); }
            Threads.path(pts, this.way === 'asleep' ? '#9aa8b8' : '#d4dbe5');
            return;
        }
        const pulled = this.way === 'slack', sh = pulled && (G.t >> 1) % 2 ? 1 : 0;
        Gfx.line(bx - cx, by - cy, ax - cx, ay - cy + sh, pulled ? '#ffffff' : '#e4ecf5');
        Gfx.line(bx - cx, by - cy + 1, ax - cx, ay - cy + 1 + sh, '#9aa8b8');
    },
    /* tatters of silk left hanging where it was tied */
    drawTatters(x, y) {
        const sw = Math.round(Math.sin((G.t + this.tx * 13) / 25));
        Gfx.line(x - 1, y, x - 2 + sw, y + 7, '#c8d0dc'); Gfx.line(x + 1, y, x + 2 + sw, y + 5, '#aab7c8');
    },
};
/* its great posts: an anchor thread tied to each one's top */
class Anchor extends GridThing {
    constructor(tx, ty, p = {}) { super('anchor', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, way: 'plain' }, p)); this.tie(); }
    get top() { return [this.tx * T + 8, this.ty * T - 25]; }
    get foot() { return [this.tx * T + 8, this.ty * T + 8]; }
    /* asleep in its cocoon, it hears a ring as anything does (within a bell's reach) and wakes: its silk unwinds back up
       into the web, and the knot's bare */
    hear(x, y) {
        if (!this.sleeping || this.cut || Math.hypot(this.tx * T + 8 - x, this.ty * T + 8 - y) > Bells.REACH * T + 4) return;
        this.sleeping = false; this.unwind = 36;
        Sfx.play('twang'); Fx.poof(this.top[0], this.top[1] + 2); Stats.count('boss:weaver:woke');
        if (!Progress.flag('weaver_cocoon')) { Progress.set('weaver_cocoon'); G.pendingToast = { s: 'At the bell the cocoon stirs, and its silk unwinds back up into the web. Under it, a knot.', focus: [this.tx, this.ty, 48] }; }
    }
    /* the stick on its cocoon: asleep, and nothing moves it but a bell */
    onStruck() { Sfx.play('hitthing'); Fx.dust(this.tx * T + 8, this.ty * T + 8); if (this.sleeping) UI.toast(Return.sleepLine(this)); }
    tick() { if (this.unwind > 0) this.unwind--; }
    sprite() { return spr('greatpost'); }
    draw(cx, cy) {
        const im = spr('greatpost'), x = this.tx * T - cx, y = this.ty * T - cy;
        Gfx.alpha(0.3); Gfx.rect(x + 1, y + 13, 14, 3, PAL.ink); Gfx.alpha(1);
        if (im) Gfx.img(im, x, y + 16 - im.height);
        const tx = this.top[0] - cx, ty = this.top[1] - cy;
        if (this.cut) { this.drawTatters(tx, ty); return; }
        if (!this.sleeping) { Gfx.rect(tx - 2, ty - 1, 4, 3, '#e4ecf5'); Gfx.rect(tx - 1, ty, 2, 1, '#ffffff'); }
        /* (the long one: its spare thread hangs in a loop under the knot) */
        if (this.way === 'slack') { Gfx.line(tx - 1, ty + 2, tx - 2, ty + 7, '#d4dbe5'); Gfx.line(tx - 2, ty + 7, tx + 1, ty + 8, '#d4dbe5'); Gfx.line(tx + 1, ty + 8, tx + 1, ty + 2, '#e4ecf5'); }
        /* wound in its cocoon, asleep (a z drifting up off it, as off any sleeper); woken, the cocoon unwinding, its silk
           running off up toward the middle of the web */
        const co = ART.cocoon;
        if (co && (this.sleeping || this.unwind > 0)) {
            const k = this.sleeping ? 1 : this.unwind / 36, r = this.area.roomAt(this.tx, this.ty);
            if (!this.sleeping && r) {
                const wx = r.x * T + 160 - cx, wy = r.y * T + 58 - cy;
                for (let i = 0; i < 3; i++) Gfx.line(tx + (i - 1) * 2, ty - 4, lerp(tx, wx, 1 - k) + (i - 1) * 3, lerp(ty - 4, wy, 1 - k) - i * 2, i === 1 ? '#ffffff' : '#c8d0dc');
            }
            Gfx.alpha(k); Gfx.img(co, tx - 7, ty - 12 + Math.round((1 - k) * 4)); Gfx.alpha(1);
            if (this.sleeping) {
                const ph = ((G.t + this.uid * 37) % 90) / 90;
                Gfx.alpha(Math.min(1, (1 - ph) * 2)); Font.draw('z', tx + 6 + Math.round(ph * 4), ty - 14 - Math.round(ph * 10), '#e8e0ff'); Gfx.alpha(1);
            }
        }
    }
}
withAnchorWays(Anchor);
/* (the Weaver beaten, the place built again: its anchors hang in tatters) */
const spentAnchor = n => { if (Progress.flag('loom_boss')) { n.cut = true; n.cuttable = false; n.sleeping = false; } return n; };
SPAWN.anchor = (x, y, p) => spentAnchor(new Anchor(x, y, p));
/* the one tied up on the loom, into its cloth over the well's head (no post: under it there's only the well) */
class LoomAnchor extends Ent {
    constructor(tx, ty, p = {}) { super('anchor', Object.assign({ way: 'loom' }, p)); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.tie(); }
    get top() { return [this.tx * T, this.ty * T + 8]; }
    get foot() { return [this.tx * T, this.ty * T + 24]; }
    get sortY() { return this.y + 40; }
    /* (where it comes down over the well's head, whichever way the Weaver's swung: the top of the well, under its knot) */
    over(tx, ty) { return !this.cut && Math.abs(tx * T + 8 - this.top[0]) <= 8 && ty >= this.ty + 2 && ty <= this.ty + 3; }
    /* (where it comes down nearest that tile: low on it, by the Weaver's back) */
    seenAt(tx, ty, w) {
        const [ax, ay] = this.top, [bx, by] = this.end(w), cx = tx * T + 8, cy = ty * T + 8, L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
        const u = clamp(((cx - ax) * (bx - ax) + (cy - ay) * (by - ay)) / L2, 0, 1);
        return [ax + (bx - ax) * u, ay + (by - ay) * u];
    }
    draw(cx, cy) {
        const [x, y] = this.top;
        if (this.cut) { this.drawTatters(x - cx, y - cy); return; }
        Gfx.rect(x - cx - 2, y - cy - 1, 5, 3, '#e4ecf5'); Gfx.rect(x - cx - 1, y - cy, 3, 1, '#ffffff'); Gfx.rect(x - cx - 2, y - cy + 2, 5, 1, '#5a6070');
    }
}
withAnchorWays(LoomAnchor);
SPAWN.loomanchor = (x, y, p) => spentAnchor(new LoomAnchor(x, y, p));

class Weaver extends Ent {
    constructor(tx, ty, p = {}) {
        super('weaver', p);
        this.tx = tx; this.ty = ty; this.x = tx * T + 8; this.y = ty * T + 8;
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.flash = 0; this.alive = true; this.shots = [];
        this.z = WV.webZ; this.path = null; this.L = 0; this.s = 0; this.lowZ = 0; this.told = 1; this.bindT = 0;
        this.puff = 0; this.warpT = 90; this.mothT = 120;
        this.sx = 0; this.sy = 0; this.away = [0, 0]; this.swingT = 0;     /* (1) swung back in its web, away from Wren */
    }
    onAdd(area) {
        const r = this.room = area.roomAt(this.tx, this.ty);
        /* where it hangs: the middle of its web over the well; and its perch on the breast-beam over the well's head */
        this.web = [r.x * T + 160, r.y * T + 96]; this.perch = [r.x * T + 160, r.y * T + 46];
        this.x = this.web[0]; this.y = this.web[1];
    }
    get beat() { return 4 - clamp(this.hp, 1, 3); }
    get tall() { return 26 + Math.round(this.z); }
    get sortY() { return !this.alive || this.state === 'down' ? this.y + 2 : this.y + 200; }
    anchors() { return this.area.ents.filter(e => e.kind === 'anchor'); }
    well() { return this.area.ents.find(e => e.kind === 'loomwell'); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'weaver') s.shut = shut; }
    hurtBox() {
        if (!this.alive || this.state === 'sleep') return null;
        if (this.state === 'down') return { x0: this.x - 16, x1: this.x + 16, y0: this.y - 12, y1: this.y + 10 };
        /* (aloft: what a hook flung up at it would catch) */
        return { x0: this.x - 14, x1: this.x + 14, y0: this.y - this.z - 22, y1: this.y + 6 };
    }
    update() {
        this.t++; if (this.flash > 0) this.flash--;
        if (!this.alive) { this.updateSnow(); return; }
        const p = G.player, a = this.area, r = this.room;
        if (this.state === 'sleep') {
            /* (in off the doorstep first, so the shutter doesn't close on Wren) */
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 1) {
                this.state = 'web'; this.st = 0; this.shutters(true); Music.play(bossSong('loom')); Script.run(LoomFoes.weaverIntro(this));
            }
            return;
        }
        /* (Wren gone from the room mid-fight, however she managed it: it settles back into its web and the room opens
           again; the fight starts afresh when she comes back) */
        if (p.area === a && p.state === 'normal' && Cam.room !== r && !Cam.busy) return this.reset();
        /* silk on Wren wears off in time (or the Shears snip it) */
        if (p.pinned === 'silk' && --this.bindT <= 0) p.pinned = null;
        if (Script.blocking()) return;
        this.st++;
        this.updateShots(p, r); this.spareBound(p);
        const here = p.area === a && Cam.room === r && p.state === 'normal';
        /* a spit coming: it rears back, its belly aglow (the tell), then the silk */
        if (this.puff > 0 && --this.puff === 0) { this.spit(p); if (this.beat === 3) this.spit(p, 0.3); }
        /* (its blows while it's up and about, not while it's down in its well) */
        const busy = this.state === 'down' || this.state === 'fall' || this.state === 'climb';
        if (here && !busy) { this.warp(p); if (this.beat === 3) this.moths(p); }
        for (const e of a.ents.slice()) if (e.weaverMoth && !e.alive && e.yarnT > 50) a.remove(e);
        switch (this.state) {
            case 'web': {
                /* rearing back to spit, it swings back in its web away from Wren, and holds there a moment after */
                if (this.swingT > 0) this.swingT--;
                const k = this.swingT > 0 ? WV.swing : 0;
                this.sx = approach(this.sx, this.away[0] * k, WV.swingSp); this.sy = approach(this.sy, this.away[1] * k, WV.swingSp);
                this.x = this.web[0] + this.sx; this.y = this.web[1] + this.sy; this.z = WV.webZ + Math.sin(this.t / 30) * 3;
                if (here && this.st % WV.spit[1] === 20) this.rear();
                if (this.anchors().every(n => n.cut)) { this.state = 'fall'; this.st = 0; Sfx.play('fall'); }
                break;
            }
            case 'fall':
                this.z = Math.max(0, this.z - WV.fall);
                /* (cut loose from its web mid-swing, it drops back over the middle of the well) */
                if (this.beat === 1) { this.sx = approach(this.sx, 0, 2); this.sy = approach(this.sy, 0, 2); this.x = this.web[0] + this.sx; this.y = this.web[1] + this.sy; }
                if (this.z <= 0) this.landIn();
                break;
            case 'down':
                if (this.st > WV.down) this.recover();
                break;
            case 'climb': {
                /* back up to where it hangs in this beat: its web (1), or its perch on the breast-beam (2, 3) */
                const [gx, gy] = this.beat === 1 ? this.web : this.perch, gz = this.beat === 1 ? WV.webZ : WV.perchZ;
                const d = Math.hypot(gx - this.x, gy - this.y);
                if (d > 2) { this.x += (gx - this.x) / d * 2; this.y += (gy - this.y) / d * 2; } else { this.x = gx; this.y = gy; }
                this.z = Math.min(gz, this.z + 1.2);
                if (d <= 2 && this.z >= gz) this.arrive();
                break;
            }
            case 'perch':
                this.x = this.perch[0]; this.y = this.perch[1]; this.z = WV.perchZ + Math.sin(this.t / 24) * 1.5;
                if (this.beat === 2) {
                    if (here && this.st === 18) this.rear();
                    if (here && this.st > WV.perchWait) this.aim(p);
                } else if (here && this.st % WV.spit[3] === 24) this.rear();
                break;
            case 'aim':
                if (this.st > WV.aim) this.drop();
                break;
            case 'drop':
                this.s = Math.min(this.L, this.s + WV.dropSp); this.place();
                if (this.s >= this.L) this.touchDown(p);
                break;
            case 'bottom':
                /* crouched where it dropped, its thread lying slack behind it; it snaps at whoever's close */
                if (this.st === 22 && here && Math.hypot(p.x - this.x, p.y - this.y) < 22) { p.hurt(1, this.x, this.y); Sfx.play('hitthing'); }
                if (this.st > WV.bottom) { this.state = 'home'; this.st = 0; }
                break;
            case 'dragged':
                this.s = Math.min(this.L, this.s + WV.drag); this.place();
                if (this.s >= this.L) { this.state = 'hung'; this.st = 0; }
                break;
            case 'hung':
                if (this.st > WV.hang) { this.state = 'home'; this.st = 0; }
                break;
            case 'home':
                /* hauling itself home up its own thread, pulled tight */
                this.s = Math.max(0, this.s - WV.climb); this.place();
                if (this.s <= 0) { this.path = null; this.state = 'perch'; this.st = 0; }
                break;
            case 'land':
                this.z = Math.max(0, this.z - WV.fall);
                if (this.z <= 0) { this.state = 'scurry'; this.st = 0; Fx.dust(this.x, this.y); Sfx.play('land'); }
                break;
            case 'scurry': {
                const [gx, gy] = this.perch, d = Math.hypot(gx - this.x, gy - this.y);
                if (d > WV.scurry) { this.x += (gx - this.x) / d * WV.scurry; this.y += (gy - this.y) / d * WV.scurry; } else { this.x = gx; this.y = gy; }
                this.z = Math.min(WV.perchZ, this.z + 1.5);
                if (d <= WV.scurry && this.z >= WV.perchZ) { this.state = 'perch'; this.st = 0; }
                break;
            }
        }
    }
    /* the point s pixels along its thread from the perch */
    pointAt(s) {
        const pts = this.path;
        for (let i = 0; i + 1 < pts.length; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
            if (s <= d || i + 2 === pts.length) { const k = d ? Math.min(1, s / d) : 0; return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
            s -= d;
        }
        return pts[pts.length - 1].slice();
    }
    place() { [this.x, this.y] = this.pointAt(this.s); this.z = this.lowZ + (WV.perchZ - this.lowZ) * (1 - (this.L ? this.s / this.L : 0)); }
    setPath(pts, lowZ) {
        this.path = pts; this.lowZ = lowZ; this.s = 0;
        this.L = 0; for (let i = 0; i + 1 < pts.length; i++) this.L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    }
    /* (2) it picks its spot: where Wren stands now; its shadow grows there */
    aim(p) { this.state = 'aim'; this.st = 0; this.target = [p.tx * T + 8, p.ty * T + 10]; Sfx.play('twang'); }
    /* down the well on its thread to her row, then out and onto the spot */
    drop() {
        const [px, py] = this.perch, [gx, gy] = this.target;
        this.setPath([[px, py], [px, Math.max(py, gy)], [gx, gy]], 0);
        this.state = 'drop'; this.st = 0; Sfx.play('throw');
    }
    touchDown(p) {
        this.state = 'bottom'; this.st = 0; G.shake = 6; Sfx.play('land'); Fx.dust(this.x, this.y);
        if (p.area === this.area && p.state === 'normal' && Math.abs(p.x - this.x) < 14 && Math.abs(p.y - this.y) < 12) p.hurt(4, this.x, this.y - 6);
    }
    /* into the well, tangled in the old warp at the bottom */
    landIn() {
        this.state = 'down'; this.st = 0; this.z = 0; this.path = null; this.shots = [];
        G.shake = 10; Sfx.play('land'); Fx.dust(this.x, this.y);
        if (!Progress.flag('weaver_down')) { Progress.set('weaver_down'); G.pendingToast = 'Down it comes into the well of its own loom, tangled in the old warp at the bottom.'; }
    }
    /* not knocked in time: back up where it was (in its web, it ties itself in again) */
    recover() { this.state = 'climb'; this.st = 0; Sfx.play('twang'); }
    /* back as it was before she came in: in its web, tied in at all four posts, the warp in its well */
    reset() {
        this.state = 'sleep'; this.st = 0; this.hp = 3; this.knocks = 0; this.told = 1; this.path = null; this.shots = []; this.flash = 0; this.puff = 0; this.warpT = 90; this.mothT = 120;
        this.sx = this.sy = 0; this.swingT = 0;
        for (const e of this.area.ents.slice()) if (e.weaverMoth) this.area.remove(e);
        this.x = this.web[0]; this.y = this.web[1]; this.z = WV.webZ;
        for (const n of this.anchors()) n.tie();
        const w = this.well(); if (w) { w.bare = false; w.haul = 0; }
        if (G.player && G.player.pinned === 'silk') G.player.pinned = null;
        this.shutters(false); Music.play('loom');
    }
    arrive() {
        if (this.beat === 1) {
            /* (as they were: the long one left long, the cocoon wound up and laid to sleep again) */
            const ans = this.anchors();
            if (ans.some(n => n.cut)) { for (const n of ans) n.tie(); Sfx.play('twang'); Fx.text(this.x, this.y - this.z - 30, 'it spins new anchors!', '#e4ecf5'); }
            this.state = 'web'; this.sx = this.sy = 0; this.swingT = 0;
        } else this.state = 'perch';
        this.st = 0;
    }
    /* (2, 3) the Hookline catches it on its perch: it's hauled toward Wren, down its own well, and hangs there low, dazed */
    hooked(h) {
        if (!this.alive) return;
        if (this.state !== 'perch' || this.beat < 2) { Sfx.play('hookhit'); Fx.ring(this.x, this.y - this.z - 8, '#e4ecf5'); return; }
        const p = h.p;
        let ex = this.x, ey = this.y;
        if (h.d === UP || h.d === DOWN) ey = p.y + DY[h.d] * 16; else ex = p.x + DX[h.d] * 16;
        if (Math.hypot(ex - this.x, ey - this.y) < 4) { Sfx.play('hookhit'); return; }
        this.setPath([[this.x, this.y], [ex, ey]], 8);
        this.state = 'dragged'; this.st = 0; Sfx.play('hookhit'); Sfx.play('tug'); G.shake = 4;
        Stats.count('boss:weaver:hooked');
    }
    /* is its body over that tile? */
    covers(tx, ty) {
        const x0 = tx * T, y0 = ty * T;
        return this.x + 10 > x0 && this.x - 10 < x0 + T && this.y + 8 > y0 && this.y - 8 < y0 + T;
    }
    /* does its thread run over that tile, between it and its perch? (down the middle of the well it lies over both) */
    threadOver(tx, ty) {
        if (!this.path) return false;
        const cx = tx * T + 8, cy = ty * T + 8;
        for (let s = 0; s <= this.s; s += 3) { const [x, y] = this.pointAt(s); if (Math.abs(x - cx) <= 8.5 && Math.abs(y - cy) <= 8.5) return true; }
        return false;
    }
    /* the Shears at its thread: at the thing itself (when it's low enough to reach), or anywhere along the thread while it's
       pulled tight (hauling itself home); lying slack, the blades slide off */
    snip(p) {
        if (!this.alive) return false;
        if (this.beat < 2) return this.snipAnchor(p);
        const f = p.front();
        if (!this.path) {
            if (this.state === 'perch' || this.state === 'aim') { if (!this.covers(f.tx, f.ty)) return false; UI.toast("It's up on the breast-beam, out of reach of the blades.", 120); return true; }
            return false;
        }
        const at = this.z <= WV.reach && this.covers(f.tx, f.ty), on = this.threadOver(f.tx, f.ty);
        if (!at && !on) return false;
        if (!at && this.state !== 'home') { UI.toast("The thread's lying slack there: it only slides off the blades. Cut it at the thing itself, or while it's pulled tight.", 200); return true; }
        this.cutThread();
        return true;
    }
    /* (1) the Shears at one of its anchors: at a post (whatever its own way says), or along a thread in front of Wren (if
       more than one runs there, one that'll cut); facing the loom where the fourth is tied: out of reach */
    snipAnchor(p) {
        if (this.state !== 'web') return false;
        const a = this.area, f = p.front(), o = a.at(f.tx, f.ty);
        if (o && o.kind === 'anchor') return o.cut ? false : o.snipBy(this, true);
        const ans = this.anchors().filter(n => n.over(f.tx, f.ty, this));
        if (ans.length) return (ans.find(n => n.taut(this)) || ans[0]).snipBy(this, false);
        const up = this.anchors().find(n => n.way === 'loom' && !n.cut);
        if (up && a.kind(f.tx, f.ty).solid && f.ty <= up.ty + 1 && Math.abs(f.tx * T + 8 - up.top[0]) <= 2 * T) { up.say(ANCHOR_LINE.loom); Sfx.play('hitthing', 0.5); return true; }
        return false;
    }
    /* what a snip at a tile would cut now, and where on it the blades would close (as snip and snipAnchor go; nothing
       said, nothing done) */
    cutPoint(tx, ty) {
        if (!this.alive) return null;
        if (this.beat < 2) {
            if (this.state !== 'web') return null;
            const o = this.area.at(tx, ty);
            if (o && o.kind === 'anchor') return !o.cut && o.taut(this) ? { thing: o, x: o.top[0], y: o.top[1] } : null;
            const n = this.anchors().find(q => q.taut(this) && q.over(tx, ty, this)), at = n && n.seenAt(tx, ty, this);
            return at ? { thing: n, x: at[0], y: at[1] } : null;
        }
        if (!this.path) return null;
        if (this.z <= WV.reach && this.covers(tx, ty)) return { thing: this, x: this.x, y: this.y - this.z - 6 };
        if (this.state !== 'home') return null;
        for (let s = 0; s <= this.s; s += 3) { const [x, y] = this.pointAt(s); if (Math.abs(x - tx * T - 8) <= 8.5 && Math.abs(y - ty * T - 8) <= 8.5) return { thing: this, x, y }; }
        return null;
    }
    /* the Shears in hand: everything in a snip's reach (in front of her, whichever way she turns) that would cut now, so a
       thread that can be cut is seen to be within reach, as the Needle shows what it would take */
    cutSpots(p) {
        const out = [];
        if (!p || p.area !== this.area || p.state !== 'normal' || p.pinned) return out;
        for (const d of [UP, RIGHT, DOWN, LEFT]) {
            const c = this.cutPoint(tileOf(p.x + DX[d] * 12), tileOf(p.y - 4 + DY[d] * 12));
            if (c && !out.some(q => q.thing === c.thing)) out.push(Object.assign(c, { d, facing: d === p.dir }));
            else if (c && d === p.dir) { const q = out.find(o => o.thing === c.thing); Object.assign(q, c, { d, facing: true }); }
        }
        return out;
    }
    cutThread() {
        Sfx.play('snip'); Fx.ring(this.x, this.y - this.z - 6, '#e4ecf5'); Stats.count('cuts'); Stats.count('boss:weaver:cut');
        this.path = null;
        if (this.area.kind(tileOf(this.x), tileOf(this.y)).pit) { this.state = 'fall'; this.st = 0; Sfx.play('fall'); return; }
        /* over the stone: it lands on its feet, and runs straight back up on a new thread */
        this.state = 'land'; this.st = 0;
        if (!Progress.flag('weaver_feet')) { Progress.set('weaver_feet'); G.pendingToast = 'It lands on its feet on the stone, and scuttles straight back up the loom on a fresh thread.'; }
    }
    rear() {
        this.puff = tellFor(8, this.beat); Sfx.play('warn');
        /* (1) in its web it swings back, away from her (staying over its well), and holds there till after it's spat */
        if (this.state === 'web') {
            const p = G.player, dx = this.web[0] - p.x, dy = this.web[1] - p.y, d = Math.hypot(dx, dy) || 1;
            this.away = [clamp(dx / d, -0.9, 0.9), dy / d]; this.swingT = this.puff + WV.swingHold;
        }
    }
    spit(p, off = 0) {
        if (p.state !== 'normal') return;
        const sx = this.x, sy = this.y - this.z - 6, sp = WV.spitSp[this.beat], a = Math.atan2(p.y - 6 - sy, p.x - sx) + off;
        this.shots.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 240 });
        Sfx.play('throw'); Stats.count('boss:weaver:spit');
    }
    /* a warp thread plucked taut down the column Wren's in (and, later, another), lit first, then snapping down it */
    warp(p) {
        if (--this.warpT > 0) return;
        this.warpT = WV.warp[this.beat];
        /* (bound in its silk, she couldn't step aside: the thread it plucks is the next one over) */
        const a = this.area, r = this.room, cols = [p.pinned === 'silk' ? p.tx + (p.tx > r.x + 9 ? -1 : 1) : p.tx];
        if (this.beat >= 2) cols.push(p.tx + (p.tx > r.x + 9 ? -4 : 4));
        for (const x of cols) {
            const tiles = []; for (let y = r.y + 1; y < r.y + r.h - 1; y++) { const k = a.kind(x, y); if (!k.solid && !k.pit) tiles.push([x, y]); }
            /* (bound in its silk at any moment while it's thrumming, she had no fair chance to step aside: it snaps past
               her, bound or just cut free) */
            const h = Hazard.tiles(this, tiles, { tell: tellFor(8, this.beat) + 8, dmg: 3, live: 8, fxCol: '#e4ecf5', fx: 'silk', shake: 4, look: LoomFoes.drawWarp, warp: true, coverAt: (px, py, q) => !q.spared && q.tiles.some(([tx, ty]) => tileOf(px) === tx && tileOf(py) === ty) });
            if (h && p.pinned === 'silk') h.spared = true;
        }
        Stats.count('boss:weaver:warp');
    }
    /* a warp thread thrumming while she's bound won't land on her (above) */
    spareBound(p) { if (p.pinned === 'silk') for (const h of this.area.ents) if (h.kind === 'hazard' && h.owner === this && h.warp && !h.landed) h.spared = true; }
    /* (3) it shakes the web, and silk moths flutter down out of it (three about at most) */
    moths(p) {
        if (--this.mothT > 0) return;
        this.mothT = WV.moths;
        const a = this.area, r = this.room, live = a.ents.filter(e => e.weaverMoth && e.alive).length;
        for (let i = 0; i < 2 && live + i < WV.maxMoths; i++) {
            const x = r.x + (i ? 15 : 4), y = r.y + 3;
            const m = a.add(new Enemy(x, y, { type: 'moth' }));
            m.weaverMoth = true; Fx.poof(m.x, m.y - 8);
        }
        Sfx.play('twang'); Stats.count('boss:weaver:moths');
    }
    updateShots(p, r) {
        const a = this.area;
        for (const s of this.shots) {
            s.x += s.vx; s.y += s.vy; s.life--; s.t = (s.t || 0) + 1;
            /* (spat from up on the loom, it's clear of the beams before anything solid can stop it) */
            if ((s.t > 16 && a.kind(tileOf(s.x), tileOf(s.y)).solid) || a.roomAt(tileOf(s.x), tileOf(s.y)) !== r) s.life = 0;
            if (p.area === a && p.state === 'normal' && Math.abs(p.x - s.x) < 7 && Math.abs(p.y - 6 - s.y) < 8) {
                s.life = 0; if (p.pinned === 'silk') p.hurt(3, s.x, s.y); p.pinned = 'silk'; this.bindT = 150; Sfx.play('hook');
                Fx.text(p.x, p.y - 22, 'bound!', '#e4ecf5');
                if (!Progress.flag('silk_bound')) { Progress.set('silk_bound'); G.pendingToast = 'Silk, wound tight round you. The Shears would make short work of it. ([tool])'; }
            }
        }
        this.shots = this.shots.filter(s => s.life > 0);
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'down') { if (by === G.player) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - this.z - 6); } return; }
        /* (three knocks; between them it thrashes its legs in the old warp) */
        if (!knockCounts(this, 8, this.x, this.y + 4, 32, 3)) { this.st = Math.max(0, this.st - 60); return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Stats.count('boss:weaver:hit');
        calmBlows(this); this.puff = 0; this.warpT = 150; this.mothT = 120;
        if (this.hp <= 0) return this.defeat();
        { const p = G.player; bossHeart(this.area, p.x, p.y + 18); }      /* (a heart drifts down) */
        this.shots = []; this.state = 'climb'; this.st = 0;
        this.beginBeat(this.beat);
    }
    /* a new beat: the arena changes with it, and a line says how */
    beginBeat(n) {
        if (n <= this.told) return;
        this.told = n;
        if (n === 3) { const w = this.well(); if (w) { w.bare = true; w.haul = 0; } }
        G.shake = 8; Sfx.play('rumble');
        Stats.count('boss:weaver:beat' + n);
        Script.run(LoomFoes.weaverBeat(this, n));
    }
    defeat() {
        this.alive = false; this.shots = []; this.path = null; this.state = 'dead';
        for (const e of this.area.ents.slice()) if (e.weaverMoth) { if (e.alive) Fx.yarn(e.x, e.y - 8, THREAD.loom); this.area.remove(e); }
        const p = G.player; if (p.pinned === 'silk') p.pinned = null;
        Sfx.play('unravel'); Fx.yarn(this.x, this.y, THREAD.loom);
        this.shutters(false);
        this.startSnow();
        Script.run(LoomHouse.afterWeaver(this));
    }
    /* what's left of its web, drifting down like snow (an effect only: Math.random is fine here) */
    startSnow() {
        const r = this.room; this.snow = [];
        for (let i = 0; i < 80; i++) this.snow.push({ x: (r.x + 1 + Math.random() * 18) * T, y: (r.y + 1.5) * T + Math.random() * 7 * T - (i % 3 ? 0 : 40), vy: 0.15 + Math.random() * 0.2, ph: Math.random() * 6, life: 240 + Math.random() * 160 });
    }
    updateSnow() { if (this.snow) { for (const f of this.snow) { f.y += f.vy; f.life--; } this.snow = this.snow.filter(f => f.life > 0); } }
    drawSnow(cx, cy) {
        for (const f of this.snow || []) {
            Gfx.alpha(Math.min(1, f.life / 60) * 0.9);
            const x = f.x + Math.sin(G.t / 40 + f.ph) * 6 - cx, y = f.y - cy;
            Gfx.rect(x, y, 2, 1, '#f4f7fb'); Gfx.rect(x + 1, y - 1, 1, 1, '#ffffff');
        }
        Gfx.alpha(1);
    }
    draw(cx, cy) {
        if (!this.alive) {
            /* the heap of grey silk in the well, still at last */
            const im = spr('weaver_down'); if (im) Gfx.img(im, this.x - cx - im.width / 2, this.y - cy - im.height + 8);
            return;
        }
        const x = this.x - cx, y = this.y - cy, top = y - this.z;
        /* beat 1: the web between where its anchors are tied (torn where one's cut), each anchor's thread (the loom's is
           drawn over it, from its back), and a few rings of web round it */
        const inWeb = this.beat === 1 && (this.state === 'web' || this.state === 'fall' || this.state === 'climb');
        if (inWeb) {
            const ans = this.anchors(), wy = this.web[1] - WV.webZ, at = n => Math.atan2(n.top[1] - wy, n.top[0] - this.web[0]);
            const ring = ans.slice().sort((m, n) => at(m) - at(n));
            for (let i = 0; i < ring.length; i++) {
                const m = ring[i], n = ring[(i + 1) % ring.length];
                if (!m.cut && !n.cut) { Gfx.alpha(0.3); Gfx.line(m.top[0] - cx, m.top[1] - cy, n.top[0] - cx, n.top[1] - cy, '#e4ecf5'); Gfx.alpha(1); }
            }
            if (this.state === 'web') {
                for (const n of ans) if (n.way !== 'loom') n.drawThread(this, cx, cy);
                Gfx.alpha(0.35); for (const rr of [16, 26]) for (let a = 0; a < 12; a++) { const t0 = a / 12 * Math.PI * 2, t1 = (a + 1) / 12 * Math.PI * 2; Gfx.line(x + Math.cos(t0) * rr, top - 8 + Math.sin(t0) * rr * 0.6, x + Math.cos(t1) * rr, top - 8 + Math.sin(t1) * rr * 0.6, '#e4ecf5'); } Gfx.alpha(1);
            }
        }
        /* beats 2 and 3: its own thread, along the floor back to the well's head and up to the breast-beam, bright and
           straight when pulled tight, dim and wavering when slack */
        const [px, py] = this.perch;
        if (this.beat >= 2 && this.state !== 'down' && this.state !== 'fall' && this.state !== 'land' && this.state !== 'scurry') {
            Gfx.line(px - cx, py - cy, px - cx, py - cy - WV.perchZ - 6, '#c8d0dc');
            if (this.path) {
                const tight = this.state === 'home', col = tight ? '#ffffff' : '#9aa8b8', n = Math.max(2, Math.ceil(this.s / 6));
                const [x0, y0] = this.pointAt(0), pts = [[x0 - cx, y0 - cy]];
                for (let i = 1; i <= n; i++) { const [qx, qy] = this.pointAt(this.s * i / n), wob = tight ? 0 : Math.sin(G.t / 12 + i) * 1.2; pts.push([qx - cx + wob, qy - cy]); }
                Threads.path(pts, col);
                Gfx.line(x, y, x, top - 6, tight ? '#ffffff' : '#c8d0dc');
            }
        }
        /* (climbing out of its well after a knock: one grey thread trailing back down to where it lay) */
        if (this.trail) Threads.path([[this.trail[0] - cx, this.trail[1] - cy], [x, top - 4]], '#c8d0dc');
        /* (2) where it's about to drop: its shadow, darkening */
        if (this.state === 'aim') {
            const k = Math.min(1, this.st / WV.aim), [gx, gy] = this.target;
            Gfx.alpha(0.2 + 0.35 * k); Gfx.circle(gx - cx, gy - cy + 2, Math.round(4 + 7 * k), PAL.ink); Gfx.alpha(1);
            if ((this.t >> 2) % 2) { Gfx.line(px - cx, py - cy - WV.perchZ, gx - cx, gy - cy - 4, '#aab7c8'); }
        }
        if (this.state === 'down') {
            const im = spr('weaver_tangled');
            if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - im.width / 2, y - im.height + 8);
            if ((this.t >> 3) % 2) Font.draw('*', x + 12, y - 20, '#f7d64a');
        } else {
            /* its shadow on the floor (smaller the higher it hangs), then the Weaver itself */
            Gfx.alpha(0.28); Gfx.circle(x, y + 3, Math.max(5, 13 - Math.round(this.z / 6)), PAL.ink); Gfx.alpha(1);
            const moving = this.state === 'drop' || this.state === 'home' || this.state === 'dragged' || this.state === 'scurry' || this.state === 'climb';
            let im = spr(this.state === 'hung' || this.state === 'aim' ? 'weaver_curl' : 'weaver_' + (moving ? (this.t >> 3) % 2 : (this.t >> 5) % 2));
            if (im) {
                if (this.flash > 0 && (this.flash >> 1) % 2) im = tinted(im, '#ffffff');
                const sh = this.state === 'hung' ? ((this.t >> 2) % 2 ? 1 : -1) : 0;
                Gfx.img(im, x - im.width / 2 + sh, top - im.height + 10);
            }
            /* (1) its thread up to the loom, from the tip of its back */
            if (inWeb && this.state === 'web') for (const n of this.anchors()) if (n.way === 'loom') n.drawThread(this, cx, cy);
            /* rearing back to spit: its belly aglow */
            if (this.puff > 0) { const k = 1 - this.puff / tellFor(8, this.beat); Tells.glow(x, top - 2, k, '#e4ecf5'); Tells.bang(x, top - 30); }
            /* (3) eyes gone red: it won't come down */
            if (this.beat === 3 && this.state === 'perch' && (this.t >> 4) % 2) { Gfx.rect(x - 4, top - 4, 2, 2, '#ff5a4a'); Gfx.rect(x + 2, top - 4, 2, 2, '#ff5a4a'); }
        }
        for (const s of this.shots) { Gfx.circle(s.x - cx, s.y - cy, 3, '#e4ecf5'); Gfx.rect(s.x - cx - 1, s.y - cy - 1, 2, 2, '#ffffff'); }
        const p = G.player;
        if (p && p.pinned === 'silk') for (let i = 0; i < 4; i++) Gfx.line(p.x - cx - 7, p.y - cy - 14 + i * 4, p.x - cx + 7, p.y - cy - 12 + i * 4, '#e4ecf5');
        /* the Shears in hand: in a snip's reach, where they'd cut now glints (brightest where she's facing) */
        if (p && Inv.equipped === 'shears' && Cam.room === this.room && !Script.blocking()) for (const s of this.cutSpots(p)) Shears.glint(s.x - cx, s.y - cy, s.facing);
    }
}
/* after it's beaten (the place built again): the heap of grey silk in its well */
class WeaverHeap extends Ent {
    constructor(tx, ty) { super('weaverheap'); this.tx = tx; this.ty = ty; this.x = tx * T + 8; this.y = ty * T + 8; }
    onAdd(area) { const r = area.roomAt(this.tx, this.ty); this.x = r.x * T + 160; this.y = r.y * T + 96; }
    get sortY() { return this.y + 2; }
    draw(cx, cy) { const im = spr('weaver_down'); if (im) Gfx.img(im, this.x - cx - im.width / 2, this.y - cy - im.height + 8); }
}
SPAWN.weaver = (x, y, p) => Progress.flag('loom_boss') ? new WeaverHeap(x, y) : new Weaver(x, y, p);

/* bound in silk: the Shears snip you free; and, facing the Weaver's own thread, they cut that */
{
    const use0 = Shears.use;
    Shears.use = function (p) {
        if (p.pinned === 'silk') { p.pinned = null; Sfx.play('snip'); Fx.ring(p.x, p.y - 8, '#e4ecf5'); Stats.count('silk:snipped'); return; }
        const w = p.area && p.area.ents.find(e => e.kind === 'weaver');
        if (w && w.snip && w.snip(p)) return;
        return use0.call(this, p);
    };
    /* bound, there's nothing else to be done with whatever's in hand: the tool button takes the Shears to the silk (said
       the first time it isn't them in hand) */
    const tools0 = Tools.use;
    Tools.use = function (p) {
        if (p && p.pinned === 'silk' && Inv.has('shears')) {
            const it = Inv.equipped !== 'shears' && ITEMS[Inv.equipped];
            if (it && !Progress.flag('silk_anytool')) { Progress.set('silk_anytool'); UI.toast(`Wound up in silk, you can't use the ${it.name}. You work the Shears loose and snip the silk instead.`, 180); }
            return Shears.use(p);
        }
        return tools0.call(this, p);
    };
}

const LoomFoes = {
    /* a warp thread plucked taut down its column, thrumming, about to snap (the column itself is lit) */
    drawWarp(x, y, h) {
        const camY = h.y - y - (h.tell - h.t) * 5, top = h.tiles[0][1] * T - camY, bot = (h.tiles[h.tiles.length - 1][1] + 1) * T - camY;
        const w = Math.round(Math.sin(h.t * 1.7) * 2 * (1 - h.t / h.tell + 0.3));
        Gfx.line(x + w, top, x - w, bot, '#ffffff'); Gfx.line(x + w + 1, top, x - w + 1, bot, '#aab7c8');
    },
    *shuttleIntro(s) {
        yield 20;
        yield* say(null, "Something long and smooth and wooden lifts itself off the floor. It hangs at the end of a silver thread stretched wall to wall: the loom's lost shuttle, big as a boat.");
        yield* say(null, "It flies. Back and forth, back and forth, the way it was made to, through anything soft enough to let it.");
    },
    *shuttleDown(s) {
        yield 30;
        yield* say(null, 'The Shuttle splits along its grain, and all the silver thread wound in it unspools across the floor. By the big door, a lid lifts.');
    },
    /* knocked, it drags itself up out of its well and up the loom to the breast-beam over the well's head, trailing a grey
       thread, while it's told (not after); in the last beat the old warp comes up out of the well after it */
    *climb(w, n) {
        const [gx, gy] = w.perch, x0 = w.x, y0 = w.y, z0 = w.z || 0, well = w.well();
        const steps = Math.max(40, Math.round(Math.hypot(gx - x0, gy - y0) / 0.9));
        w.trail = [x0, well ? well.y + 6 * T - 12 : y0 + 24];          /* (from the bottom of the well, where it lay) */
        for (let i = 1; i <= steps; i++) {
            const k = i / steps;
            w.x = lerp(x0, gx, k); w.y = lerp(y0, gy, k); w.z = lerp(z0, WV.perchZ, k);
            if (n === 3 && well) well.haul = k;
            yield 1;
        }
        w.x = gx; w.y = gy; w.z = WV.perchZ; w.trail = null;
        if (n === 3 && well) well.haul = 1;
        yield 10;
    },
    *weaverIntro(w) {
        const r = w.room, at = [r.x + 9, r.y + 4, 60];
        yield 20;
        yield* stepIn();
        yield* say(null, "In front of the old loom, the Weaver hangs in a web strung to three great posts and up into the loom itself: grey, many-legged, very old, spinning. It has been keeping this loom for the First Spinner since she stopped coming.", { focus: at });
        yield* say(null, 'It does not want anything to change at all.', { focus: at });
    },
    *weaverBeat(w, n) {
        const r = w.room, at = [r.x + 9, r.y + 2, 40];
        yield 30;
        yield* LoomFoes.climb(w, n);
        if (n === 2) {
            yield* say(null, 'The Weaver drags itself out of its well and up the loom, trailing one grey thread, and crouches on the breast-beam over the well\'s head. Its anchors hang in tatters.', { focus: at });
            yield* say(null, 'It spins no new anchors. It hangs by a thread of its own now, and watches you.', { focus: at });
        } else yield* say(null, 'This time it hauls the old warp up out of the well after it, winding it round and round the breast-beam, and clings there, high on the loom, spitting. It won\'t come down again of its own accord.', { focus: at });
    },
};

function initLoomFoes() {
    defSprite('shuttle', ['................................', '................................', '......kkkkkkkkkkkkkkkkkkkk......', '....kkbbbbbbbbbbbbbbbbbbbbkk....', '..kkbbBBBBBBBBkkkkBBBBBBBBbbkk..', 'kkbbBBBBBBBBBBkwwkBBBBBBBBBBbbkk', 'kbbbBBBBBBBBBBkwwkBBBBBBBBBBbbbk', 'kkbbBBBBBBBBBBkkkkBBBBBBBBBBbbkk', '..kkbbBBBBBBBBBBBBBBBBBBBBbbkk..', '....kkbbbbbbbbbbbbbbbbbbbbkk....', '......kkkkkkkkkkkkkkkkkkkk......', '................................', '................................', '................................', '................................', '................................'], { b: '#a8784a', B: '#c9925a', w: '#e4ecf5' });
    /* the Weaver: a big grey spider with its abdomen banded in wound silver thread, six red eyes; drawn as shapes and
       outlined (two leg frames; curled when dazed; tangled on its back in the well; a heap when it's over) */
    const legsOf = (frame, curl) => [
        [[25, 17], [32, 9 + curl], [37, 3 + curl * 2]], [[26, 19], [35, 15 + curl], [41, 12 + curl * 2]],
        [[26, 21], [35, 23 - curl], [41, 26 - curl * 2]], [[25, 23], [31, 27 - curl], [35, 31 - curl * 2]],
    ];
    const body = (x, frame, curl) => {
        const px = (c, a, b) => { x.fillStyle = c; x.fillRect(a, b, 1, 1); };
        const line = (x0, y0, x1, y1, c, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) { x.fillStyle = c; x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w); } };
        legsOf(frame, curl).forEach(([[hx, hy], [kx, ky], [fx, fy]], i) => {
            for (const side of [1, -1]) {
                const m = v => side > 0 ? v : 43 - v, lift = (i + frame + (side > 0 ? 0 : 1)) % 2 ? -1 : 0;
                line(m(hx), hy, m(kx), ky + lift, '#3a3f4c', 2); line(m(kx), ky + lift, m(fx), fy + lift, '#3a3f4c', 1);
                px('#8a94a4', m(kx), ky + lift); px('#2a2e38', m(fx), fy + lift + 1);
            }
        });
        /* the abdomen, banded with wound silver; the head, darker, with its eyes */
        discPx(x, 22, 11, 9, (X, Y, i, j) => (j < -0.45 && i < 0.25) ? '#7a8496' : (i + j > 1.0 ? '#2e3340' : ((Y - 4) % 4 === 0 && Math.abs(i) < 0.85 ? '#dfe6ef' : '#4a505e')));
        for (const [a, b] of [[19, 7], [24, 11], [20, 15]]) px('#ffffff', a, b);
        discPx(x, 22, 22, 6, (X, Y, i, j) => (j < -0.4 && i < 0) ? '#5a6070' : '#353a46');
        for (const [a, b] of [[19, 21], [21, 20], [23, 20], [25, 21], [20, 23], [24, 23]]) { px('#e8463c', a, b); }
        px('#ffd0c8', 21, 20); px('#ffd0c8', 23, 20);
        /* fangs */
        px('#c8d0dc', 21, 27); px('#c8d0dc', 23, 27);
    };
    for (const f of [0, 1]) ART['weaver_' + f] = paintSprite(44, 33, x => body(x, f, 0));
    ART.weaver_curl = paintSprite(44, 33, x => body(x, 0, 3));
    /* on its back in the well, legs every which way, tangled in old warp */
    ART.weaver_tangled = paintSprite(44, 26, x => {
        const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) { x.fillStyle = c; x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); } };
        for (const [a, b, c, d] of [[14, 14, 6, 4], [16, 12, 12, 1], [28, 12, 33, 2], [30, 14, 39, 5], [13, 18, 3, 16], [31, 18, 41, 17], [15, 21, 8, 25], [29, 21, 36, 25]]) { line(a, b, c, d, '#3a3f4c'); line(a, b + 1, c, d + 1, '#3a3f4c'); }
        discPx(x, 22, 16, 8, (X, Y, i, j) => (j < -0.4 && i < 0.2) ? '#7a8496' : ((X + Y) % 5 === 0 ? '#c8d0dc' : '#4a505e'));
        for (const [a, b, c, d] of [[4, 20, 40, 9], [6, 9, 38, 22], [10, 24, 34, 6]]) line(a, b, c, d, '#dfe6ef');
    });
    /* the heap of grey silk it is at the end: wound round and round, a curled leg or two poking out */
    ART.weaver_down = paintSprite(44, 22, x => {
        const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) { x.fillStyle = c; x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); } };
        for (const [a, b, c, d] of [[12, 15, 5, 12], [5, 12, 4, 15], [32, 15, 39, 11], [39, 11, 41, 14], [14, 18, 9, 21], [30, 18, 35, 21]]) line(a, b, c, d, '#3a3f4c');
        discPx(x, 22, 13, 8, (X, Y, i, j) => (j < -0.45 && i < 0.3) ? '#dfe6ef' : (i + j > 0.9 ? '#8a94a4' : '#b4bece'));
        discPx(x, 15, 15, 5, (X, Y, i, j) => (j < -0.3) ? '#c8d0dc' : '#9aa4b2'); discPx(x, 29, 15, 5, (X, Y, i, j) => (j < -0.3) ? '#c8d0dc' : '#9aa4b2');
        for (let k = 0; k < 5; k++) line(13 + k * 3, 19 - (k % 2), 19 + k * 3, 7 + (k % 3), '#e4ecf5');
        line(11, 11, 33, 17, '#8a94a4'); line(12, 17, 31, 9, '#f4f7fb');
    });
    SPR.weaver_0 = ART.weaver_0; SPR.weaver_1 = ART.weaver_1; SPR.weaver_curl = ART.weaver_curl; SPR.weaver_tangled = ART.weaver_tangled; SPR.weaver_down = ART.weaver_down;
    SPR.weaver = ART.weaver_0;
    /* the great posts: thick old wood, iron-banded, a ring at the top where the silk is tied */
    ART.greatpost = paintSprite(16, 44, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#7a8496', 1, 38, 14, 6); R('#a4aebe', 1, 38, 14, 1); R('#5a6070', 1, 43, 14, 1);
        R('#6a4630', 3, 6, 10, 33); R('#8a5a3a', 3, 6, 3, 33); R('#4a301e', 11, 6, 2, 33);
        for (const y of [10, 22, 33]) { R('#3a404c', 2, y, 12, 3); R('#8a94a4', 2, y, 12, 1); }
        R('#8a5a3a', 2, 3, 12, 4); R('#b07848', 3, 3, 6, 1);
        R('#5a6070', 5, 0, 6, 4); R('#c8d0dc', 6, 0, 4, 1); R('#2a2e38', 7, 1, 2, 2);
    });
    SPR.greatpost = ART.greatpost;
}
CONTENT_INIT.push(initLoomFoes);
