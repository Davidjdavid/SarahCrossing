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
        for (const m of a.walkers) if (m.alive && m.ret && m.onTile && m.onTile(f.tx, f.ty)) return m;
        return null;
    },
    use(p) {
        /* the Makings are Tuck's Wander, and the Makers' kit: not for cutting */
        if (p.area.def.making) { UI.toast("Not in a Making. Everything here is the Makers' kit, for Tuck's Wander."); return; }
        const e = this.target(p);
        if (!e) {
            const a = p.area, f = p.front();
            if ((a.kind(f.tx, f.ty).fog || a.kind(p.tx, p.ty).fog) && !Progress.flag('cut_self')) return Script.run(Shears.selfCut());
            UI.toast(this.hinted ? 'Nothing with a thread there.' : 'Face something with a thread (or its cord, from underneath) and press C to cut it.');
            this.hinted = true; return;
        }
        if (e.noCut) { UI.toast(e.noCutLine || "The Shears won't close on that."); return; }
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
            if (e.isGrid) { e.marked = false; if (e.mv) { e.mv = null; a.unplace(e, e.tx, e.ty); e.x = e.tx * T; e.y = e.ty * T; a.place(e, e.tx, e.ty); } }
            if (k) Progress.setAreaFlag(a.id, 'cut:' + k, e.tx + ',' + e.ty);
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
        const i = yield* ask(null, "The fog leans on you, threads in it like rain. Nothing is in front of you but your own red thread, going home. Cut it?", ['Cut my thread', 'Not yet']);
        if (i !== 0) return;
        yield* say(null, "You take the Shears to your own thread. It's thin. It's never seemed so thin. Snip.");
        Sfx.play('snip'); G.shake = 6;
        Progress.set('cut_self'); Stats.count('cut:self');
        yield* say(null, "Nothing pulls. For the first time in your life, nothing at all is pulling you anywhere.");
        if (Shears.onSelfCut) yield* Shears.onSelfCut();
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
