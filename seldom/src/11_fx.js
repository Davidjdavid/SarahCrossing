/* little effects drawn in the world (puffs, sparkles, splashes) and over the screen (fades, toasts) */
const Fx = {
    parts: [], fade: 0, fadeV: 0, flash: 0, toasts: [],
    add(p) { this.parts.push(Object.assign({ t: 0, life: 0.6, map: World.map }, p)); },
    puff(x, y, kind) {
        const n = kind === 'pop' ? 8 : 10;
        for (let i = 0; i < n; i++) {
            const a = i / n * Math.PI * 2;
            this.add({ x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 18 - 6, life: 0.45, c: kind === 'return' ? P.gold : P.white, r: 1.5, kind });
        }
    },
    sparkle(x, y, c) { for (let i = 0; i < 6; i++) this.add({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: 0, vy: -10, life: 0.6 + Math.random() * 0.4, c: c || P.gold, r: 1, star: true }); },
    splash(x, y) { for (let i = 0; i < 8; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 20, g: 120, life: 0.5, c: '#bfe6ff', r: 1.2 }); Sfx.play('splash'); },
    pickup(x, y, what) { this.add({ x, y: y - 6, vx: 0, vy: -16, life: 0.9, text: '+1', c: P.yellow }); },
    fadeIn(s) { this.fade = 1; this.fadeV = -1 / s; },
    fadeOut(s) { this.fadeV = 1 / s; return until(() => this.fade >= 1); },
    toast(text, icon) { this.toasts.push({ text, icon, t: 0 }); },
    update(dt) {
        for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; }
        this.parts = this.parts.filter(p => p.t < p.life);
        this.fade = clamp(this.fade + this.fadeV * dt, 0, 1); if (this.fade <= 0 || this.fade >= 1) this.fadeV = this.fade >= 1 && this.fadeV > 0 ? 0 : this.fadeV < 0 && this.fade <= 0 ? 0 : this.fadeV;
        this.flash = Math.max(0, this.flash - dt * 2);
        if (this.toasts.length) { this.toasts[0].t += dt; if (this.toasts[0].t > 3) this.toasts.shift(); }
    },
    draw(D) {
        const ctx = D.ctx;
        for (const p of this.parts) {
            if (p.map !== World.map) continue;
            const a = 1 - p.t / p.life;
            ctx.globalAlpha = Math.max(0, a);
            if (p.text) { drawText(ctx, p.text, D.X(p.x) - 4 * D.k, D.Y(p.y), p.c, D.k, P.ink); }
            else { ctx.fillStyle = p.c; const r = (p.r || 1) * D.k * (p.star ? (Math.sin(p.t * 20) > 0 ? 1.4 : 0.8) : 1); ctx.fillRect(D.X(p.x) - r, D.Y(p.y) - r, r * 2, r * 2); }
        }
        ctx.globalAlpha = 1;
    },
};

/* the notebook: Dot writes a law down the first time it happens in front of the player, never before */
const LAWS = [
    { key: 'still', title: 'Still', text: 'Things I can\'t see hold still. The ball waited in the air for me to come back and look.' },
    { key: 'return', title: 'Return', text: 'Wild things that leave my sight go back to where they started, the next time I look there.' },
    { key: 'hour', title: 'The Hour', text: 'The tower\'s hands only move while someone is looking at them. And the whole island keeps the tower\'s time.' },
    { key: 'bound', title: 'Bound', text: 'Some creatures can\'t bear to be out of sight. The edge of what I see pushes them along.' },
    { key: 'squeeze', title: 'Squeeze', text: 'Squash a Bound thing between the edge and a wall and it pops out somewhere it fits. Even through a fence.' },
    { key: 'wrap', title: 'Turnabout', text: 'In the woods, the edges of what I see meet. Go out one side, come in the other.' },
    { key: 'crowd', title: 'Crowds', text: 'There\'s only room for four of us in a line. The ones farthest from the middle flicker, and flickering, they pass right through each other.' },
    { key: 'tiny', title: 'Tiny', text: 'Things too small to see aren\'t there at all. Look close enough and they are.' },
    { key: 'seam', title: 'Seam', text: 'With the view cut in two, where the halves meet is one place. I can walk from one to the other.' },
    { key: 'away', title: 'Away', text: 'When you looked away from the whole island, all of it waited. Even me.', secret: true },
];
const Notebook = {
    got: {}, open: false, sel: 0, pending: {},
    saw(key, e) {
        /* some keys are steps toward a law, not the law */
        if (key === 'crowd-see') { this.pending.crowd = true; return; }
        if (key === 'seam-split') return;
        if (this.got[key]) return;
        const L = LAWS.find(l => l.key === key); if (!L) return;
        this.got[key] = G.t;
        G.flags.notebook = true;
        Fx.toast('Dot wrote in the notebook: ' + L.title, 'note');
        Sfx.play('write');
        Save.soon();
    },
    count() { return Object.keys(this.got).length; },
};
