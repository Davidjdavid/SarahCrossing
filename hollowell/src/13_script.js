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
function* say(who, text, opts = {}) {
    const lines = Array.isArray(text) ? text : [text];
    for (const t of lines) {
        Dialog.open(who, t, opts);
        yield () => !Dialog.active;
    }
}
/* a question: returns the index picked */
function* ask(who, text, choices, opts = {}) {
    Dialog.open(who, text, Object.assign({}, opts, { choices }));
    yield () => !Dialog.active;
    return Dialog.picked;
}
function* fadeOut(n = 20) { UI.fade = { from: UI.fadeA, to: 1, t: 0, dur: n }; yield n; }
function* fadeIn(n = 20) { UI.fade = { from: UI.fadeA, to: 0, t: 0, dur: n }; yield n; }
/* walk a grid walker (townsfolk) or Wren to a tile */
function* walkTo(e, tx, ty, speed = 1) {
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
