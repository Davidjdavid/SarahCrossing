/* Things every House uses: levers, Knot hoops, House doors to the outside, nudges (the Hints option:
   if Wren is stuck in a room a long while, something in the room shifts a little), and the
   "all home" check for rooms that want everything back in its place. */

class Lever extends GridThing {
    constructor(tx, ty, props = {}) {
        super('lever', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, props));
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
            /* (the first time it's all told; after that, the ceremony is quicker, and the Well's answer grows) */
            const first = !Inv.knots.length;
            const i = yield* ask(null, first ? "The House's Knot hangs in the hoop, every colour of thread running into it and down through the floor. Tie it?" : "The House's Knot hangs in the hoop. Tie it?", ['Tie the Knot', 'Not yet']);
            if (i !== 0) return;
            hoop.tied = true;
            G.hideHud = true;
            Music.play('silence');
            Sfx.play('knot');
            /* threads pull taut from every side toward the middle */
            for (let t = first ? 0 : 50; t < 120; t++) { G.knotFx = t; if (t % 20 === 0) G.shake = 4; yield 1; }
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
            yield* Knots.winch();
            G.hideHud = false;
            if (a.def.afterKnot) yield* a.def.afterKnot();
            Save.autosave();
        };
    },
    /* then, far away, the Well's winch turns a notch by itself, and the Knot's thread winds on beside the others: a moment's
       picture, no words (Gundry: "turns by itself some nights"). It times itself, so a load in the middle can't leave it up. */
    *winch() {
        G.winch = { t0: G.t, n: Inv.knots.length, knots: Inv.knots.slice() };
        for (let t = 0; t < WINCH_T; t++) {
            if (t === WINCH_NOTCH) { Sfx.play('winch'); if (G.winch.n >= KNOT_LINES.length) { Sfx.play('rumble'); G.shake = 3; } }
            yield 1;
        }
        G.winch = null;
    },
    drawWinch() {
        const c = G.winch, t = c ? G.t - c.t0 : WINCH_T;
        if (t < 0 || t >= WINCH_T) { G.winch = null; return; }
        const w = 112, h = 76, x = (W - w) >> 1, y = 22, n = c.n;
        const turn = clamp((t - WINCH_NOTCH) / 10, 0, 1), ease = turn * turn * (3 - 2 * turn);
        Gfx.alpha(t < 10 ? t / 10 : t > WINCH_T - 16 ? (WINCH_T - t) / 16 : 1);
        stitchedBox(x - 2, y - 2, w + 4, h + 4, { fill: '#1a1828', stitch: '#3e3a58', shadow: '#141220' });
        for (let i = 0; i < 12; i++) Gfx.rect(x + 6 + Math.floor(hash2(i, 5, 71) * (w - 12)), y + 4 + Math.floor(hash2(5, i, 72) * 14), 1, 1, i % 3 ? '#7a76a0' : '#d8d4f0');
        /* the Well: its stone side, its rim, the dark inside */
        for (let j = 0; j < 16; j++) for (let i = 0; i < 76; i += 2) Gfx.rect(x + 18 + i, y + 54 + j, 2, 1, (j % 4 === 3 || (i + (j >> 2) * 4) % 12 === 0) ? '#5e5648' : ((i >> 3) + (j >> 2)) % 2 ? '#a89a86' : '#94877a');
        Gfx.rect(x + 16, y + 50, 80, 4, '#cfc3ae'); Gfx.rect(x + 22, y + 51, 68, 2, '#0c0a10');
        /* the posts and the drum between them */
        for (const px of [22, 86]) { Gfx.rect(x + px, y + 12, 4, 40, '#7a4e32'); Gfx.rect(x + px, y + 12, 2, 40, '#9a6438'); }
        Gfx.rect(x + 26, y + 22, 60, 10, '#c9925a'); Gfx.rect(x + 26, y + 22, 60, 1, '#e6c08a'); Gfx.rect(x + 26, y + 31, 60, 1, '#8a5a38');
        /* a band of thread on the drum for each Knot, in its House's colour, running down into the dark; the newest winds
           on as the winch turns */
        const quiver = n >= KNOT_LINES.length && turn >= 1 ? Math.round((Math.random() - 0.5) * 1.6) : 0;
        for (let i = 0; i < n; i++) {
            const col = KNOT_THREAD[c.knots[i]] || THREAD.town, bx = x + 30 + i * 8, bw = i === n - 1 ? Math.round(7 * ease) : 7;
            if (bw <= 0) continue;
            for (let r = 0; r < 12; r++) Gfx.rect(bx, y + 21 + r, bw, 1, (r + Math.floor(ease * 4)) % 2 ? shade(col, -0.2) : shade(col, 0.15));
            Gfx.line(bx + 3, y + 33, bx + 3 + quiver, y + 51, col);
        }
        /* the crank on the right-hand post, turned a notch by nobody, and the pawl that clicks */
        const hx = x + 92, hy = y + 27, an = -Math.PI / 2 + (n - 1 + ease) * Math.PI / 4;
        Gfx.line(hx, hy, hx + Math.round(Math.cos(an) * 9), hy + Math.round(Math.sin(an) * 9), '#45281c');
        Gfx.rect(hx + Math.round(Math.cos(an) * 9) - 1, hy + Math.round(Math.sin(an) * 9) - 1, 3, 3, '#6b4128');
        Gfx.rect(hx - 1, hy - 1, 3, 3, '#3a3440');
        Gfx.rect(hx - 1, hy - 4 + (turn > 0 && turn < 1 ? 1 : 0), 1, 2, '#8a8096');
        Gfx.alpha(1);
    },
    /* every thread in the House streaming into the hoop (drawn over the room) */
    draw(cx, cy) {
        if (G.winch) this.drawWinch();
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
/* the winch's moment after a Knot: how long, and when it turns; each Knot's thread on its drum is its House's colour */
const WINCH_T = 100, WINCH_NOTCH = 34;
const KNOT_THREAD = { tidy: THREAD.ives, kiln: THREAD.bram, mill: THREAD.ambrose, belfry: THREAD.tess, slumber: THREAD.mallow, marionette: THREAD.jory };
/* (a winch taking up a notch: a long wooden creak, then the pawl's click) */
SFX.winch = (o, t) => { Audio.tone(o, t, 150, 0.4, 'p25', 0.06, { slide: 95 }); Audio.hit(o, t + 0.3, 0.05, 0.2, 1500, 6000); Audio.tone(o, t + 0.3, 240, 0.05, 'p50', 0.1); };
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
        if (!Settings.hints || !a.def.house || a.def.noNudges || Progress.flag('noNudges')) return;
        const r = Cam.room; if (!r || !r.nudge) return;
        const n = r.nudge;
        const key = a.id + ':' + r.key;
        if (Progress.areaFlag(a.id, 'nudged:' + r.key)) return;
        if (n.solved && Nudges.solved(a, n.solved)) return;
        const st = Stats.rooms[a.id + ':' + r.i];
        if (!st || st.t < (n.after || 60 * 60 * 3)) return;
        if (Script.blocking() || Dialog.active) return;
        /* the first time, the House asks whether it should (the answer stands; Options > Hints changes it) */
        if (!Progress.flag('hintsAsked')) { Progress.set('hintsAsked'); Script.run(Nudges.ask(a, r, n)); return; }
        Nudges.fire(a, r, n);
    },
    *ask(a, r, n) {
        const who = { tidy: "rather like Mother Ives's", kiln: "deep and gruff, rather like Bram's", mill: "rather like your dad's", belfry: "rather like your mum's",
            slumber: "soft and sleepy, rather like Doctor Mallow's", marionette: "rather like Jory's", spoolworks: "rather like Gundry's", loom: "very old" }[a.def.house] || 'muffled';
        const known = Progress.flag('reveal1');
        yield* say(null, known ? 'Somewhere behind the walls, one of the Makers clears their throat.' : `Somewhere behind the walls, someone clears their throat. A voice, ${who}:`);
        const i = yield* ask(null, '"Stuck, are we? We could... the House could give you a nudge now and then, when you\'ve been stuck a good while. Would you like that?"', ['Yes, please.', "No, I'll work it out."]);
        if (i === 0) { yield* say(null, '"Right you are." Something behind the wall goes twang.'); Nudges.fire(a, r, n); }
        else {
            Settings.hints = false; Settings.save();
            yield* say(null, '"Quite right too." A door closes softly, somewhere. (Hints can be turned on in Options, if you change your mind.)');
        }
    },
    fire(a, r, n) {
        const key = a.id + ':' + r.key, st = Stats.rooms[a.id + ':' + r.i];
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

/* a House's boss beaten but its Knot not yet tied: the Hoop and the boss's Heartstitch are there whenever the House is
   built again (after leaving it, or a load), not only right after the fight */
const HOUSE_AFTER = {
    tidy: { flag: 'tidy_boss', room: '1,0', hoop: [9, 5], heart: [9, 7], heartId: 'tidyHeart' },
    kiln: { flag: 'kiln_boss', room: '1,0', hoop: [9, 4], heart: [9, 7], heartId: 'kilnHeart' },
    millrace: { flag: 'millrace_boss', room: '1,0', hoop: [17, 9], heart: [4, 9], heartId: 'millHeart' },
    belfry: { flag: 'belfry_boss', room: '1,0', hoop: [15, 6], heart: [4, 6], heartId: 'belfryHeart' },
    slumber: { flag: 'slumber_boss', room: '1,0', hoop: [15, 6], heart: [4, 6], heartId: 'slumberHeart' },
    marionette: { flag: 'reveal1', room: '1,0', hoop: [15, 6], heart: [4, 6], heartId: 'marionetteHeart' },
    spoolworks: { flag: 'd7', room: '1,0', heart: [9, 5], heartId: 'spoolHeart', noHoop: true },
};
const HouseAfter = {
    add(a) {
        const d = HOUSE_AFTER[a.id], br = d && a.rooms.find(r => r.key === d.room);
        if (!br) return;
        if (!d.noHoop && !Inv.knots.includes(a.def.house) && !a.ents.some(e => e.kind === 'hoop')) a.add(new Hoop(br.x + d.hoop[0], br.y + d.hoop[1]));
        if (!a.ents.some(e => e.id === d.heartId)) a.add(new Pickup((br.x + d.heart[0]) * T, (br.y + d.heart[1]) * T, { what: 'heartstitch', id: d.heartId }));
    },
};
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        const d = HOUSE_AFTER[id];
        if (d && Progress.flag(d.flag)) HouseAfter.add(a);
        return a;
    };
}

function initHouseKit() {
    defSprite('lever_off', ['................', '................', '................', '..........kk....', '.........kwk....', '........kwk.....', '.......kbk......', '......kbk.......',
        '.....kbk........', '...kkkkkkkk.....', '..kgggggggGk....', '..kgggggggGk....', '..kGGGGGGGGk....', '...kkkkkkkk.....', '................', '................'], { b: '#9a6438', g: '#9a9188', G: '#6a635e', w: '#e8463c' });
    defSprite('lever_on', ['................', '................', '................', '....kk..........', '....kwk.........', '.....kwk........', '......kbk.......', '.......kbk......',
        '........kbk.....', '...kkkkkkkk.....', '..kgggggggGk....', '..kgggggggGk....', '..kGGGGGGGGk....', '...kkkkkkkk.....', '................', '................'], { b: '#9a6438', g: '#9a9188', G: '#6a635e', w: '#5ad1c5' });
}
CONTENT_INIT.push(initHouseKit);
