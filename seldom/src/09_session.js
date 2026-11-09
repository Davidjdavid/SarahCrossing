/* the running game: which map is shown, Dot, the island's hour, doors, the step that runs it all */
const HOUR_RATE = 1 / 30;     /* island hours per second the Great Clock is watched */
const World = {
    map: null, dot: null, hour: 9, day: 1, cutscene: null, talking: null, inv: {}, carry: null,
    scripts: [],     /* running async scenes */
    triggers: [],    /* {test(), run()} checked each step */
    screenScale() { return R.s * Cam.zoom; },
    /* go through a door to another map */
    go(mapId, tx, ty, dir, opts) {
        const from = this.map;
        if (from) Laws.leaveMap(from);
        const m = MAPS[mapId];
        const d = this.dot;
        if (from) from.remove(d);
        d.map = m; m.ents.push(d);
        d.x = tx * TILE + (TILE - d.w) / 2; d.y = ty * TILE + TILE - d.h - 2;
        if (dir) d.dir = dir;
        if (d.carrying) { const c = d.carrying; from && from.remove(c); c.map = m; m.ents.push(c); carryPos(d); }
        this.map = m;
        if (Cam.split) { Cam.split = false; Cam.home = 0; }
        Cam.mode = 'follow'; Cam.snap();
        for (const e of m.ents) { e.seen = false; e.originSeen = false; }
        Laws.see();
        if (!opts || !opts.quiet) { Fx.fadeIn(0.35); Sfx.play('door'); }
        UI.areaT = 0; UI.areaName = m.def.indoor ? UI.areaName : null;
        if (m.def.enter) m.def.enter(m, from);
        Story.entered(m, from);
        Music.mapChanged();
        Save.soon();
    },
    /* Dot stepping onto doors */
    step(d) {
        const [tx, ty] = tileOf(d);
        const m = d.map;
        for (const door of m.doors || []) {
            if (door.x === tx && door.y === ty && (!door.dir || door.dir === d.dir)) {
                if (door.locked && door.locked()) { if (!d.st.knock || G.t - d.st.knock > 1.2) { d.st.knock = G.t; const msg = door.lockedSay && door.lockedSay(); if (msg) say(msg); else Sfx.play('nope'); } continue; }
                this.go(door.to, door.tx, door.ty, door.tdir || d.dir);
                return;
            }
        }
    },
    update(dt) {
        Laws.see();
        const map = this.map;
        for (const e of map.ents.slice()) {
            if (e.removed || !e.seen) continue;
            const K = KINDS[e.kind];
            e.t += dt;
            if (e.justBack) e.justBack = Math.max(0, e.justBack - dt);
            if (e.wrapped) e.wrapped = Math.max(0, e.wrapped - dt);
            if (K.update) K.update(e, dt);
            if (e.song && !K.ownSong) musicStep(e, dt);
            if (K.noteStill && e.unseenFor > 0.8 && (e.z > 0 || e.moving)) { Notebook.saw('still', e); e.unseenFor = 0; }
        }
        Laws.wrap(); Laws.seam(); Laws.bound(); Laws.crowd();
        for (const p of map.props) if (p.update && p.seenNow) p.update(p, dt);
        if (G.state === 'play' && !this.cutscene && Input.hit.act) this.interact();
        for (const tr of this.triggers.slice()) if (!tr.done && tr.test()) { tr.done = true; tr.run(); }
        Story.tick(dt);
    },
    /* the action button */
    interact() {
        const d = this.dot;
        if (d.carrying) { putDown(d); return; }
        const [fx, fy] = DIRS[d.dir];
        const probe = { x: ecx(d) + fx * 10 - 8, y: d.y + d.h / 2 + fy * 10 - 8, w: 16, h: 16 };
        const find = (pr, onlyTalk) => {
            let best = null, bd = 1e9;
            for (const e of d.map.ents) {
                if (e === d || !exists(e) || !e.seen || e.held) continue;
                const K = KINDS[e.kind];
                if (onlyTalk ? !(e.talk || K.act && e.kind !== 'furn') : (!K.act && !K.carry && !e.talk && !e.onAct)) continue;
                const vb = { x: e.x - 2, y: e.y - 6, w: e.w + 4, h: e.h + 9 };
                if (!overlap(pr, vb)) continue;
                const dd = dist(ecx(e), ecy(e), pr.x + pr.w / 2, pr.y + pr.h / 2);
                if (dd < bd) { bd = dd; best = e; }
            }
            return best;
        };
        /* the thing in front; or, across a counter, the person beyond it */
        const best = find(probe) && !(find(probe).kind === 'furn' && find({ x: probe.x + fx * 16, y: probe.y + fy * 16, w: 16, h: 16 }, true)) ? find(probe) : (find({ x: probe.x + fx * 16, y: probe.y + fy * 16, w: 16, h: 16 }, true) || find(probe));
        if (best) {
            const K = KINDS[best.kind];
            if (best.onAct) best.onAct(best);
            else if (K.act) K.act(best);
            else if (K.carry) pickUp(d, best);
            return;
        }
        /* signs and props */
        for (const p of d.map.props) {
            if (!p.read) continue;
            const r = { x: p.tx * TILE, y: (p.ty + p.th - p.fh) * TILE, w: p.fw * TILE, h: p.fh * TILE + 4 };
            if (overlap(probe, r)) { p.read(p); return; }
        }
        const tx = Math.floor((probe.x + 6) / TILE), ty = Math.floor((probe.y + 6) / TILE);
        const sign = (d.map.signs || {})[tx + ',' + ty];
        if (sign) { say(typeof sign === 'function' ? sign() : sign); return; }
    },
};
function pickUp(d, e) {
    const K = KINDS[e.kind];
    if (K.pocket) {
        /* small wild things go in the pocket: gone from the island, so they come back where they began */
        World.inv[K.pocket] = (World.inv[K.pocket] || 0) + 1;
        if (e.wild) { e.gone = true; e.taken = false; } else { e.removed = true; d.map.remove(e); }
        Sfx.play('pick'); Fx.pickup(ecx(e), e.y, K.pocket);
        Story.got(K.pocket, e);
        return;
    }
    d.carrying = e; e.held = true; carryPos(d); Sfx.play('lift');
}
function putDown(d) {
    const e = d.carrying; if (!e) return;
    const [fx, fy] = DIRS[d.dir];
    e.held = false; d.carrying = null;
    if (d.moving) {
        /* thrown */
        e.vx = fx * 120 + (Input.axis()[0] * 20); e.vy = fy * 120; e.vz = 110; e.z = 14;
        e.x = ecx(d) - e.w / 2; e.y = d.y + (fy > 0 ? 4 : fy < 0 ? -4 : 0);
        Sfx.play('throw');
        return;
    }
    let nx = ecx(d) - e.w / 2 + fx * 12, ny = d.y + d.h - e.h + fy * 12;
    const nb = { x: nx, y: ny, w: e.w, h: e.h };
    if (boxBlocked(d.map, nb, e)) { nx = ecx(d) - e.w / 2; ny = d.y + d.h - e.h; }
    e.x = nx; e.y = ny; e.z = 0; e.vz = 0;
    Sfx.play('drop');
    const K = KINDS[e.kind]; if (K.onLand) K.onLand(e);
}
function invHas(k, n) { return (World.inv[k] || 0) >= (n || 1); }
function invTake(k, n) { World.inv[k] = Math.max(0, (World.inv[k] || 0) - (n || 1)); }
