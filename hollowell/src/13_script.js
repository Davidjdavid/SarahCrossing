/* Scripts: cutscenes, conversations and events written as generator functions.
     Script.run(function* () { yield* say('Gran', 'Morning, love.'); yield 30; yield () => door.open; })
   A script yields a number (wait that many steps), a function (wait until it's true) or delegates to
   another script with yield*. While a blocking script runs, Wren doesn't take input. */

const Script = {
    list: [],
    run(fn, opts = {}) {
        const it = typeof fn === 'function' ? fn() : fn;
        const s = { it, wait: 0, until: null, blocking: opts.blocking !== false, name: opts.name || '', done: false, onDone: opts.onDone };
        this.list.push(s);
        this.step(s);
        return s;
    },
    blocking() { return this.list.some(s => s.blocking && !s.done); },
    running(name) { return this.list.some(s => s.name === name && !s.done); },
    update() {
        for (const s of this.list.slice()) if (!s.done) this.step(s);
        this.list = this.list.filter(s => !s.done);
    },
    step(s) {
        try {
            if (s.wait > 0) { s.wait--; return; }
            if (s.until) { if (!s.until()) return; s.until = null; }
            for (let guard = 0; guard < 1000; guard++) {
                const r = s.it.next(s.ret);
                s.ret = undefined;
                if (r.done) { s.done = true; if (s.onDone) s.onDone(r.value); return; }
                const v = r.value;
                if (typeof v === 'number') { if (v > 0) { s.wait = v - 1; return; } continue; }
                if (typeof v === 'function') { if (!v()) { s.until = v; return; } continue; }
                if (v && v.then) { return; }
                return;   /* bare yield: next step */
            }
        } catch (e) { reportError(e); s.done = true; }
    },
    clear() { this.list = []; },
};

/* ---- script helpers (use with yield*) ---- */
function* wait(n) { yield n; }
/* whoever speaks to Wren turns to her (when they're close, standing still, and the scene hasn't fixed their facing) */
function faceSpeaker(who) {
    const a = G.map, p = G.player;
    if (!who || !a || !p || p.hidden) return;
    const n = a.ents.find(e => e.kind === 'npc' && e.who === who && !e.hidden);
    if (!n || n.mv || n.walking || n.fixedFace || n.counter) return;
    const dx = p.tx - n.tx, dy = p.ty - n.ty;
    if (Math.abs(dx) + Math.abs(dy) > 6 || (dx === 0 && dy === 0)) return;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
    /* and she to them, if she's standing about with her hands free */
    if (p.state === 'normal' && !p.carry && !p.ride && !p.walking && Math.abs(dx) + Math.abs(dy) <= 4) p.dir = OPP[n.dir];
}
function* say(who, text, opts = {}) {
    const lines = Array.isArray(text) ? text : [text];
    faceSpeaker(who);
    for (const t of lines) {
        Dialog.open(who, t, opts);
        yield () => !Dialog.active;
    }
}
/* a question: returns the index picked */
function* ask(who, text, choices, opts = {}) {
    faceSpeaker(who);
    Dialog.open(who, text, Object.assign({}, opts, { choices }));
    yield () => !Dialog.active;
    return Dialog.picked;
}
function* fadeOut(n = 20) { UI.fade = { from: UI.fadeA, to: 1, t: 0, dur: n }; yield n; }
function* fadeIn(n = 20) { UI.fade = { from: UI.fadeA, to: 0, t: 0, dur: n }; yield n; }
/* walk a grid walker (townsfolk) or Wren to a tile */
/* a scripted walk goes across then along, unless something stands in that way: then round it, a tile at a time */
function straightBlocked(a, sx, sy, gx, gy) {
    const stop = (x, y) => { const k = a.kind(x, y); return !a.inside(x, y) || k.solid || k.pit || k.deep || k.void || !!a.at(x, y); };
    for (let x = sx; x !== gx;) { x += Math.sign(gx - sx); if (stop(x, sy)) return true; }
    for (let y = sy; y !== gy;) { y += Math.sign(gy - sy); if (stop(gx, y)) return true; }
    return false;
}
function* walkTo(e, tx, ty, speed = 1) {
    if (e === G.player && G.map && !G.map.def.noRoute && straightBlocked(G.map, e.tx, e.ty, tx, ty)) {
        const path = critterPath(G.map, e.tx, e.ty, tx, ty);
        const end = path[path.length - 1];
        if (end && end[0] === tx && end[1] === ty) { for (const [x, y] of path) yield* walkStraight(e, x, y, speed); return; }
    }
    yield* walkStraight(e, tx, ty, speed);
}
function* walkStraight(e, tx, ty, speed = 1) {
    if (e === G.player) {
        const p = e;
        const gx = tx * T + 8, gy = ty * T + 10;
        for (let n = 0; n < 600; n++) {
            const dx = gx - p.x, dy = gy - p.y;
            if (Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2) { p.x = gx; p.y = gy; break; }
            const sp = PSPEED * speed;
            if (Math.abs(dx) >= 1.2) { p.dir = dx < 0 ? LEFT : RIGHT; p.x += clamp(dx, -sp, sp); }
            else { p.dir = dy < 0 ? UP : DOWN; p.y += clamp(dy, -sp, sp); }
            p.walking = true; p.anim++;
            yield 1;
        }
        p.walking = false; p.anim = 0;
        return;
    }
    if (e.walkTo) { e.walkTo(tx, ty, speed); yield () => !e.walking; }
}
function* face(e, d) { e.dir = d; yield 1; }
function* shake(n = 20) { G.shake = n; yield n; }
