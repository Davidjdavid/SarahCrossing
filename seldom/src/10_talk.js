/* talking: a box at the bottom, letters typed out with each speaker's voice, choices.
   say() and ask() return promises, so scenes are written as plain async functions. */
const VOICES = {};   /* name -> { pitch, wave } */
const Talk = {
    q: [], cur: null, shown: 0, tick: 0, choice: 0,
    open(item) {
        return new Promise(res => { this.q.push(Object.assign(item, { res })); if (!this.cur) this.next(); });
    },
    next() {
        this.cur = this.q.shift() || null; this.shown = 0; this.choice = 0;
        if (this.cur) { G.state = 'talk'; this.cur.lines = wrapText(this.cur.text, 236); }
        else if (G.state === 'talk') { G.state = 'play'; this.closedAt = G.t; }
    },
    full() { return this.cur && this.shown >= this.cur.text.length; },
    update(dt) {
        const c = this.cur; if (!c) return;
        if (!this.full()) {
            this.tick += dt * (Input.down.act ? 90 : 42);
            while (this.tick >= 1 && !this.full()) {
                this.tick -= 1; const ch = c.text[this.shown++];
                if (/[a-z0-9]/i.test(ch) && this.shown % 2) Sfx.voice(c.who);
                if (/[.!?]/.test(ch)) this.tick -= 6;
            }
            if (Input.hit.act && this.shown > 2) this.shown = c.text.length;
            return;
        }
        if (c.options) {
            if (Input.hit.up || Input.hit.left) { this.choice = (this.choice + c.options.length - 1) % c.options.length; Sfx.play('tick'); }
            if (Input.hit.down || Input.hit.right) { this.choice = (this.choice + 1) % c.options.length; Sfx.play('tick'); }
        }
        if (Input.hit.act) {
            Input.consume('act');
            Sfx.play('next');
            const r = c.options ? this.choice : undefined;
            const res = c.res; this.next(); res(r);
        }
    },
    draw(ctx) {
        const c = this.cur; if (!c) return;
        const s = R.s, bw = 256, lineH = 10;
        const n = c.lines.length + (c.options ? c.options.length : 0);
        const bh = Math.max(40, 14 + n * lineH);
        const bx = (VIEW_W - bw) / 2, by = VIEW_H - bh - 6;
        const X = v => R.gx + v * s, Y = v => R.gy + v * s;
        ctx.fillStyle = 'rgba(26,18,32,0.94)'; roundRect(ctx, X(bx), Y(by), bw * s, bh * s, 4 * s); ctx.fill();
        ctx.strokeStyle = P.cream; ctx.lineWidth = s; roundRect(ctx, X(bx + 1.5), Y(by + 1.5), (bw - 3) * s, (bh - 3) * s, 3 * s); ctx.stroke();
        if (c.who && c.name !== false) {
            const nm = c.name || NAMES[c.who] || c.who; const w = textWidth(nm) + 10;
            ctx.fillStyle = P.cream; roundRect(ctx, X(bx + 8), Y(by - 6), w * s, 11 * s, 3 * s); ctx.fill();
            drawText(ctx, nm, X(bx + 13), Y(by - 4), P.ink, s);
        }
        let left = this.shown;
        c.lines.forEach((ln, i) => {
            const part = ln.slice(0, Math.max(0, left)); left -= ln.length + 1;
            drawText(ctx, part, X(bx + 10), Y(by + 8 + i * lineH), P.white, s, '#00000088');
        });
        if (c.options && this.full()) c.options.forEach((o, i) => {
            const y = by + 10 + (c.lines.length + i) * lineH;
            drawText(ctx, (i === this.choice ? '→ ' : '   ') + o, X(bx + 14), Y(y), i === this.choice ? P.yellow : P.cream, s);
        });
        if (this.full() && !c.options && Math.floor(G.t * 3) % 2) drawText(ctx, '↓', X(bx + bw - 12), Y(by + bh - 11), P.yellow, s);
    },
};
const NAMES = {};
function say(text, who, o) { return Talk.open(Object.assign({ text, who }, o)); }
function ask(text, options, who) { return Talk.open({ text, who, options }); }
async function sayAll(lines, who) { for (const l of lines) await say(l, who); }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* talking to a person: their talk() decides what they say (it can be async) */
async function talkTo(e) {
    if (World.talking) return;
    World.talking = e;
    try {
        if (typeof e.talk === 'function') await e.talk(e);
        else if (Array.isArray(e.talk)) await sayAll(e.talk, e.name);
        else if (e.talk) await say(e.talk, e.name);
    } finally { World.talking = null; }
}
/* a scene: the island waits while it runs (the Laws still hold: only what's in view moves) */
async function scene(fn) {
    World.cutscene = true;
    try { await fn(); } finally { World.cutscene = null; Cam.hold = null; }
}
const wait = s => new Promise(res => { const until = G.t + s; World.triggers.push({ test: () => G.t >= until, run: res }); });
const until = f => new Promise(res => World.triggers.push({ test: f, run: res }));
