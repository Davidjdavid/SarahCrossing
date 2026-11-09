/* Things every House uses: levers, Knot hoops, House doors to the outside, nudges (the Hints option:
   if Wren is stuck in a room a long while, something in the room shifts a little), and the
   "all home" check for rooms that want everything back in its place. */

class Lever extends GridThing {
    constructor(tx, ty, props = {}) {
        super('lever', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props));
        this.on = !!props.on;
    }
    onAdd(area) { super.onAdd(area); if (this.id && !this.release && Progress.areaFlag(area.id, 'lever:' + this.id)) { this.on = true; this.fired = true; } }
    interact() {
        if (this.once && this.on) return false;
        if (this.release && this.solved && this.solved()) { UI.toast('Everything here is already where it belongs.'); return true; }
        this.on = !this.on; Sfx.play('click'); Sfx.play('door');
        if (this.id && !this.release) Progress.setAreaFlag(this.area.id, 'lever:' + this.id, this.on);
        if (this.onPull) this.onPull(this);
        if (this.release) {
            const group = this.area.ents.filter(e => e.group === this.release);
            if (this.on) for (const e of group) { e.tiedOff = false; if (e.ret) e.ret.timer = 20; }
            else for (const e of group) Lever.setOut(e);   /* pulled back: everything set out again, tied, as it started */
        }
        return true;
    }
    static setOut(e) {
        if (!e.startAt || !e.ret) return;
        const a = e.area;
        if (e.heldBy && e.heldBy.release) e.heldBy.release();
        a.unplace(e, e.tx, e.ty); if (e.mv) a.unplace(e, e.mv.fx, e.mv.fy);
        e.mv = null; e.tx = e.startAt[0]; e.ty = e.startAt[1]; e.x = e.tx * T; e.y = e.ty * T;
        a.place(e, e.tx, e.ty);
        e.ret.trace = e.trace.map(p => p.slice()); e.ret.state = 'away'; e.ret.snap = false; e.ret.timer = e.ret.patience;
        e.tiedOff = true;
        Fx.poof(e.tx * T + 8, e.ty * T + 8);
    }
    tick() { if (this.on && this.sig) Signals.set(this.area, this.sig); }
    sprite() { return spr(this.on ? 'lever_on' : 'lever_off'); }
}
SPAWN.lever = (x, y, p) => new Lever(x, y, p);

/* the Knot hoop: where a House's Knot gets tied */
class Hoop extends Ent {
    constructor(tx, ty, props = {}) { super('hoop', props); this.tx = tx; this.ty = ty; this.x = tx * T - 8; this.y = ty * T - 16; this.t = 0; }
    get sortY() { return this.y + 32; }
    onAdd(area) { area.staticSolid.add(this.ty * 4096 + this.tx); }
    update() { this.t++; }
    interact() { if (this.tied) return false; Script.run(Knots.tie(this)); return true; }
    talkBox(p, f) { return f.tx === this.tx && f.ty === this.ty; }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        /* a big embroidery hoop on a stand, threads of every colour running into the floor */
        Gfx.rect(x + 14, y + 26, 4, 8, '#6b4128');
        for (let a = 0; a < 40; a++) {
            const t = a / 40 * Math.PI * 2;
            Gfx.rect(x + 16 + Math.cos(t) * 13, y + 14 + Math.sin(t) * 13, 2, 2, a % 2 ? '#c9925a' : '#9a6438');
        }
        if (!this.tied) {
            const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory];
            for (let i = 0; i < 6; i++) {
                const t = this.t / 40 + i;
                Gfx.line(x + 16 + Math.cos(t) * 8, y + 14 + Math.sin(t) * 8, x + 16, y + 34, cols[i]);
            }
            if ((this.t >> 3) % 2) Gfx.img(spr('knot'), x + 8, y + 6);
        }
    }
}
SPAWN.hoop = (x, y, p) => new Hoop(x, y, p);

/* the door out of a House */
SPAWN.exit = (x, y, p) => new Warp(x, y, Object.assign({ to: 'hollow' }, p));

const Knots = {
    tie(hoop) {
        return function* () {
            const p = G.player, a = G.map, house = a.def.house;
            const i = yield* ask(null, "The House's Knot hangs in the hoop, every colour of thread running into it and down through the floor. Tie it?", ['Tie the Knot', 'Not yet']);
            if (i !== 0) return;
            hoop.tied = true;
            G.hideHud = true;
            Music.play('silence');
            Sfx.play('knot');
            /* threads pull taut from every side toward the middle */
            for (let t = 0; t < 120; t++) { G.knotFx = t; if (t % 20 === 0) G.shake = 4; yield 1; }
            G.knotFx = 0;
            Sfx.play('knot');
            UI.fadeA = 1; UI.fade = { from: 1, to: 0, t: 0, dur: 50 };
            yield 30;
            Inv.knots.push(house);
            Progress.set(house + '_knot');
            Music.play('knot');
            G.holdUp = { id: 'knot' };
            p.state = 'hold';
            yield* say(null, `You tied the ${a.def.knotName || 'Knot'}! ` + KNOT_LINES[Inv.knots.length - 1]);
            G.holdUp = null; p.state = 'normal';
            yield* say(null, 'Far away, at the bottom of the Hollow, the Well creaks once, like a winch taking up slack.');
            G.hideHud = false;
            if (a.def.afterKnot) yield* a.def.afterKnot();
            Save.autosave();
        };
    },
    /* every thread in the House streaming into the hoop (drawn over the room) */
    draw(cx, cy) {
        const t = G.knotFx; if (!t) return;
        const p = G.player;
        const tx = p.x - cx, ty = p.y - cy - 20;
        const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory, '#ffffff'];
        for (let i = 0; i < 28; i++) {
            const a = i / 28 * Math.PI * 2 + t * 0.01, r = 220 * (1 - t / 120);
            Gfx.line(tx + Math.cos(a) * r, ty + Math.sin(a) * r, tx, ty, cols[i % cols.length]);
        }
        Gfx.alpha(Math.min(0.6, t / 160)); Gfx.rect(0, 0, W, H, '#fff6e0'); Gfx.alpha(1);
    },
};
const KNOT_LINES = [
    'One Knot of six. You feel steadier, somehow, as if the ground under you had been pinned down a little tighter.',
    'Two Knots of six.', 'Three Knots of six.', 'Four Knots of six.', 'Five Knots of six.', 'Six Knots! The Wander is nearly done.',
];

/* nudges: the Hints option. A room can say how to tell it's solved and what to nudge */
const Nudges = {
    /* "<house>_<id>" means that thing of the House is done: a chest opened, a door or gate opened, a lever pulled;
       "<house>_chest:<id>" a chest opened; anything else is a story flag */
    solved(a, c) {
        if (typeof c === 'function') return c();
        return c.split('&').every(t => {
            t = t.trim();
            if (Progress.flag(t)) return true;
            const m = /^([a-z]+)_(?:chest:)?(\w+)$/.exec(t);
            if (!m || m[1] !== a.id) return false;
            const id = m[2];
            if (Progress.areaFlag(a.id, 'chest:' + id) || Progress.areaFlag(a.id, 'door:' + id) || Progress.areaFlag(a.id, 'lever:' + id)) return true;
            const e = a.find(id);
            return !!(e && (e.opened || e.openedOnce || (e.kind === 'door' && e.open && e.type !== 'shutter') || (e.kind === 'lever' && e.on)));
        });
    },
    update(a) {
        if (!Settings.hints || !a.def.house || Progress.flag('noNudges')) return;
        const r = Cam.room; if (!r || !r.nudge) return;
        const n = r.nudge;
        const key = a.id + ':' + r.key;
        if (Progress.areaFlag(a.id, 'nudged:' + r.key)) return;
        if (n.solved && Nudges.solved(a, n.solved)) return;
        const st = Stats.rooms[a.id + ':' + r.i];
        if (!st || st.t < (n.after || 60 * 60 * 3)) return;
        Progress.setAreaFlag(a.id, 'nudged:' + r.key);
        st.nudges = (st.nudges || 0) + 1;
        Stats.count('nudges');
        Stats.nudgeLog = Stats.nudgeLog || [];
        (Stats.c.nudgeRooms = Stats.c.nudgeRooms || []).push(key);
        if (n.at) { const [x, y] = n.at; Fx.sparkle((r.x + x) * T + 8, (r.y + y) * T + 4, '#fff6c0'); Fx.ring((r.x + x) * T + 8, (r.y + y) * T + 8, '#fff6c0'); }
        if (n.thing) { const o = a.ents.find(e => e.id === n.thing); if (o) { o.nudgeT = 90; Fx.sparkle(o.tx * T + 8, o.ty * T + 2, '#fff6c0'); } }
        Sfx.play('twang');
        if (n.say) UI.toast(n.say, 240);
    },
};

function initHouseKit() {
    defSprite('lever_off', ['................', '................', '................', '..........kk....', '.........kwk....', '........kwk.....', '.......kbk......', '......kbk.......',
        '.....kbk........', '...kkkkkkkk.....', '..kgggggggGk....', '..kgggggggGk....', '..kGGGGGGGGk....', '...kkkkkkkk.....', '................', '................'], { b: '#9a6438', g: '#9a9188', G: '#6a635e', w: '#e8463c' });
    defSprite('lever_on', ['................', '................', '................', '....kk..........', '....kwk.........', '.....kwk........', '......kbk.......', '.......kbk......',
        '........kbk.....', '...kkkkkkkk.....', '..kgggggggGk....', '..kgggggggGk....', '..kGGGGGGGGk....', '...kkkkkkkk.....', '................', '................'], { b: '#9a6438', g: '#9a9188', G: '#6a635e', w: '#5ad1c5' });
}
CONTENT_INIT.push(initHouseKit);
