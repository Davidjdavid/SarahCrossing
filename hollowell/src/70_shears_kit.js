/* The Shears: the First Spinner's own blades, the only ones that cut a thread for good. Face something with a thread
   (or, from underneath, its cord) and press C: snip. It's a stray now, for good: wherever it stands, it stays, and
   it goes on staying there (it fills a pit; it doesn't come home). People too: cut free, they walk where they like.
   Silk warp threads strung across the old places are walls and bridges; cut a wall and it falls away, cut a bridge
   and it drops. And at the fog, with nothing in front of you, the Shears will cut your own thread, if you ask. */

const Shears = {
    /* things that have been cut keep the place they were cut at (or wherever they were pushed to after) */
    key(e) { return e.skey || e.id || null; },
    target(p) {
        const a = p.area, f = p.front();
        const cord = a.ents.find(e => e.kind === 'cord' && e.talkBox(p, f));
        if (cord) return cord.thing;
        const o = a.at(f.tx, f.ty);
        if (o && o.kind === 'npc') return o;
        if (o && (o.ret || o.cuttable)) return o;
        const w = a.ents.find(e => e.cuttable && !e.isGrid && e.cutAt && e.cutAt(f.tx, f.ty));
        if (w) return w;
        /* a thread drawn tight (its thing on the way home) can be cut anywhere along it, back to its mark */
        const hung = this.taut(a, f.tx, f.ty, true);
        if (hung) return hung;
        for (const m of a.walkers) if (m.alive && m.ret && m.onTile && m.onTile(f.tx, f.ty)) return m;
        return null;
    },
    /* the thing whose thread runs over a tile (tight: on its way home; or any, slack too) */
    /* (tight as the thread is drawn: on its way home, or about to be, and not held or tied; never a thing out of sight) */
    taut(a, x, y, tight) {
        const isTight = e => !Return.held(e) && (e.ret.state === 'returning' || (e.ret.state === 'away' && e.ret.timer < 30));
        return a.ents.find(e => e.isGrid && e.ret && e.ret.state !== 'home' && !e.removed && !e.noCut && !e.hidden && !e.hiddenYank && !e.inert && !e.swallowed
            && (!tight || isTight(e)) && e.ret.trace && !(e.tx === x && e.ty === y) && e.ret.trace.some(([tx, ty]) => tx === x && ty === y));
    },
    use(p) {
        /* the Makings are Tuck's Wander, and the Makers' kit: not for cutting */
        if (p.area.def.making) { UI.toast("Not in a Making. Everything here is the Makers' kit, for Tuck's Wander."); return; }
        const e = this.target(p);
        if (!e) {
            const a = p.area, f = p.front();
            if ((a.kind(f.tx, f.ty).fog || a.kind(p.tx, p.ty).fog) && !Progress.flag('cut_self')) return Script.run(Shears.selfCut());
            if (this.taut(a, f.tx, f.ty, false)) { UI.toast("The thread's lying slack there: it only slides off the blades. Cut it at the thing itself, or while it's pulled tight.", 200); return; }
            UI.toast(this.hinted ? 'Nothing with a thread there.' : 'Face something with a thread (or its cord, from underneath) and press [tool] to cut it.');
            this.hinted = true; return;
        }
        if (e.noCut) { UI.toast(e.noCutLine || "The Shears won't close on that."); return; }
        if (e.kind === 'npc' && e.who === 'gran') { UI.toast("Gran holds every thread in the valley. Her own isn't one the Shears can reach.", 160); return; }
        if (e.kind === 'npc' && e.who === 'linnet') { UI.toast("Nothing to cut. Linnet did that herself, twenty-five years ago.", 140); return; }
        if (e.kind === 'npc') return Script.run(Shears.cutPerson(e));
        this.cut(e);
    },
    cut(e, quiet) {
        const a = e.area;
        if (e.knotted) Spool.untie(e);
        if (e.heldBy && e.heldBy.release) e.heldBy.release();
        const k = this.key(e);
        /* any stitch on it goes too */
        const rec = Inv.stitches.find(s => s.area === a.id && s.key === k); if (rec) Inv.stitches.splice(Inv.stitches.indexOf(rec), 1);
        if (e.onCut) { e.onCut(); }
        else if (e.ret) {
            e.ret = null; e.stitched = false; e.cutFree = true;
            /* (a cut thing is tied to nothing: a sleeper wakes a stray, and can be pushed) */
            if (e.sleeper) { e.sleeper = false; e.tiedOff = false; e.noPush = false; }
            if (e.isGrid) {
                e.marked = false; e.tiedOff = false; if (!e.fixed) e.noPush = false;
                /* mid-step: it ends up on the tile it was stepping onto, and lets go of the one it was leaving */
                if (e.mv) { a.unplace(e, e.mv.fx, e.mv.fy); e.mv = null; a.unplace(e, e.tx, e.ty); e.x = e.tx * T; e.y = e.ty * T; a.place(e, e.tx, e.ty); }
            }
            /* cut loose over a hole or deep water (hanging on its thread a moment ago): down it goes, and fills it */
            const kind = a.kind(e.tx, e.ty);
            if (e.isGrid && e.landed && !e.removed && (kind.pit || (kind.deep && !e.floats))) e.landed(false);
            /* (where it was cut, kept by its own key: the place built afresh puts it back there) */
            if (k && !e.removed) Progress.setAreaFlag(a.id, 'cut:' + k, e.tx + ',' + e.ty);
        }
        if (!quiet) {
            Sfx.play('snip'); Fx.ring((e.px !== undefined ? e.px : e.x) + 8, (e.py !== undefined ? e.py : e.y) + 4, '#e4ecf5');
            Stats.count('cuts');
            if (!Progress.flag('cut_first')) { Progress.set('cut_first'); G.pendingToast = 'Snip. The thread curls up and is gone. Whatever it held will stay wherever it is, now, for good.'; }
        }
    },
    /* a person cut free */
    *cutPerson(n) {
        const who = n.who, name = Story.name(who);
        if (Progress.flag('cut:' + who)) { yield* say(null, name + ' has no thread to cut. Not any more.'); return; }
        const i = yield* ask(null, `Cut ${name}'s thread? (There's no tying it again.)`, ['Snip', 'Not yet']);
        if (i !== 0) return;
        Sfx.play('snip'); Fx.ring(n.px + 8, n.py + 4, '#e4ecf5');
        Progress.set('cut:' + who); Stats.count('cut:people');
        n.ret = null; n.cutFree = true;
        const line = (typeof CUT_LINES !== 'undefined' && CUT_LINES[who]) || "They blink, and look down at their feet, and take one step they couldn't have taken a moment ago. Then another.";
        yield* say(null, line);
        if (Shears.onPersonCut) Shears.onPersonCut(n);
    },
    /* at the fog: your own */
    *selfCut() {
        /* her own thread, shown: from her heart away home to the Well, across the whole valley */
        G.selfThread = { t: 0, cut: -1 };
        const i = yield* ask(null, "The fog leans on you, threads in it like rain. Nothing is in front of you but your own red thread, going home. Cut it?", ['Cut my thread', 'Not yet']);
        if (i !== 0) { G.selfThread = null; return; }
        yield* say(null, "You take the Shears to your own thread. It's thin. It's never seemed so thin.");
        Sfx.play('snip'); G.shake = 6; G.selfThread.cut = 0;
        G.keepHearts = true;
        Progress.set('cut_self'); Stats.count('cut:self'); Inv.hp = Inv.maxHp;
        yield 50;
        yield* say(null, "Snip. Nothing pulls. For the first time in your life, nothing at all is pulling you anywhere.");
        G.selfThread = null;
        if (Shears.onSelfCut) yield* Shears.onSelfCut();
        G.keepHearts = false;
    },
    /* (the thread drawn: whole, then cut, its far end whipping away home and the near end falling slack) */
    drawSelfThread(cx, cy) {
        const s = G.selfThread, p = G.player; if (!s || !p) return;
        s.t++; if (s.cut >= 0) s.cut++;
        const x0 = p.x - cx, y0 = p.y - cy - 6, hx = 95 * T + 8 - cx, hy = 58 * T + 8 - cy;
        const d = Math.hypot(hx - x0, hy - y0) || 1, ux = (hx - x0) / d, uy = (hy - y0) / d;
        const wob = Math.sin(s.t / 9) * 1.5;
        if (s.cut < 0) { Gfx.line(x0, y0, x0 + ux * 400, y0 + uy * 400 + wob, THREAD.wren); Gfx.line(x0, y0 + 1, x0 + ux * 400, y0 + uy * 400 + wob + 1, shade(THREAD.wren, -0.3)); return; }
        const gone = Math.min(1, s.cut / 30), gap = 6 + gone * 380;
        Gfx.line(x0 + ux * gap, y0 + uy * gap, x0 + ux * 400, y0 + uy * 400, THREAD.wren);
        Gfx.alpha(Math.max(0, 1 - s.cut / 60)); Gfx.line(x0, y0, x0 + ux * 4, y0 + 6 + gone * 4, THREAD.wren); Gfx.alpha(1);
    },
    /* the place built afresh: whatever was cut stays a stray, where it was left */
    apply(a) {
        const af = Progress.areaFlags[a.id]; if (!af) return;
        for (const e of a.ents.slice()) {
            const k = this.key(e); if (!k) continue;
            if (af['gone:' + k]) { a.remove(e); continue; }
            const v = af['cut:' + k]; if (!v) continue;
            if (e.onCut) { e.onCut(true); continue; }
            e.ret = null; e.cutFree = true; e.stitched = false;
            if (e.sleeper) { e.sleeper = false; e.tiedOff = false; e.noPush = false; }
            if (e.isGrid) {
                e.marked = false;
                const [x, y] = String(v).split(',').map(Number);
                if (!isNaN(x) && (!a.at(x, y) || a.at(x, y) === e)) { a.unplace(e, e.tx, e.ty); e.tx = x; e.ty = y; e.x = x * T; e.y = y * T; a.place(e, x, y); }
            }
        }
    },
    /* leaving a place: where the strays ended up */
    remember(a) {
        for (const e of a.ents) if (e.cutFree && e.isGrid && !e.removed) { const k = this.key(e); if (k) Progress.setAreaFlag(a.id, 'cut:' + k, e.tx + ',' + e.ty); }
    },
};
SFX.snip = (o, t) => { Audio.hit(o, t, 0.04, 0.12, 2400, 6000); Audio.tone(o, t, 1400, 0.05, 'p12', 0.08, { slide: 2200 }); Audio.hit(o, t + 0.05, 0.03, 0.08, 3000, 7000); };

TOOLS.shears = { use(p) { Shears.use(p); } };
{
    const build0 = World.build;
    World.build = function (id) { const a = build0.call(this, id); Shears.apply(a); return a; };
    const enter0 = World.enter;
    World.enter = function (...args) { if (G.map) Shears.remember(G.map); return enter0.apply(this, args); };
    /* a cut thing that fills a pit is gone for good */
    const fill0 = GridThing.prototype.fillPit;
    GridThing.prototype.fillPit = function () { const k = Shears.key(this); if ((this.cutFree || (!this.ret && this.marked === false)) && k) Progress.setAreaFlag(this.area.id, 'gone:' + k); return fill0.call(this); };      /* (a stray that filled a hole is gone for good, not back next time) */
    /* a save mid-place keeps the strays where they are too */
    const snap0 = Save.snapshot;
    Save.snapshot = function () { if (G.map) Shears.remember(G.map); return snap0.call(this); };
}

/* silk warp threads: strung tile to tile, a wall (or, laid over a gap, a bridge). Cut, the wall falls; the bridge drops */
class WarpThread extends Ent {
    constructor(tx, ty, p = {}) {
        super('warpthread', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.len = p.len || 1; this.dir = p.dir || 'v';    /* v: runs down from tx,ty; h: runs right */
        this.cuttable = true; this.gone = false;
    }
    tiles() { const out = []; for (let i = 0; i < this.len; i++) out.push(this.dir === 'v' ? [this.tx, this.ty + i] : [this.tx + i, this.ty]); return out; }
    cutAt(x, y) { return !this.gone && this.tiles().some(([a, b]) => a === x && b === y); }
    blocks(x, y) { return !this.gone && !this.bridge && this.tiles().some(([a, b]) => a === x && b === y); }
    onAdd(area) {
        if (this.id && Progress.areaFlag(area.id, 'cutthread:' + this.id)) { this.gone = true; if (this.bridge) this.drop(area, true); return; }
        if (this.bridge) for (const [x, y] of this.tiles()) area.setCell(x, y, this.bridgeChar || '_');
    }
    onCut(quiet) {
        if (this.gone) return;
        this.gone = true;
        if (this.id) Progress.setAreaFlag(this.area.id, 'cutthread:' + this.id);
        if (this.bridge) this.drop(this.area, quiet);
        if (!quiet) for (const [x, y] of this.tiles()) Fx.dust(x * T + 8, y * T + 8);
    }
    drop(area, quiet) {
        for (const [x, y] of this.tiles()) {
            area.setCell(x, y, this.under || 'o');
            /* whatever stood on it goes down with it */
            const o = area.at(x, y); if (o && o.landed) o.landed(false);
        }
        const p = G.player; if (!quiet && p && p.area === area && this.tiles().some(([x, y]) => p.tx === x && p.ty === y)) p.startFall('pit');
    }
    get sortY() { return this.y + (this.dir === 'v' ? this.len * T : 8); }
    draw(cx, cy) {
        if (this.gone) return;
        const col = '#e4ecf5', dim = '#9aa8b8';
        if (this.bridge) {
            /* threads laid side by side over the gap */
            for (const [x, y] of this.tiles()) for (let i = 2; i < 16; i += 3) { const sx = x * T - cx, sy = y * T - cy; if (this.dir === 'h') Gfx.line(sx, sy + i, sx + 16, sy + i, i % 2 ? col : dim); else Gfx.line(sx + i, sy, sx + i, sy + 16, i % 2 ? col : dim); }
            return;
        }
        for (const [x, y] of this.tiles()) {
            const sx = x * T - cx, sy = y * T - cy;
            for (let i = 3; i < 16; i += 4) {
                const sh = Math.round(Math.sin((G.t + i * 7 + x * 11) / 30));
                if (this.dir === 'v') Gfx.line(sx + i + sh, sy - 8, sx + i - sh, sy + 16, i % 8 === 3 ? col : dim);
                else Gfx.line(sx, sy + i - 4 + sh, sx + 16, sy + i - 4 - sh, i % 8 === 3 ? col : dim);
            }
            Gfx.rect(sx + 1, sy - 10, 14, 2, '#6a7080');
        }
    }
}
SPAWN.warpthread = (x, y, p) => new WarpThread(x, y, p);
SPAWN.silkbridge = (x, y, p) => new WarpThread(x, y, Object.assign({ bridge: true }, p));
