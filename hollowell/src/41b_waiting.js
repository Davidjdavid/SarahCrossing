/* Sitting and waiting (from the pause menu, in a House): whatever's out of its place in the room comes home in its own
   time, and the game simply runs faster until it has (or until anything else happens). Nothing new under the law: it's
   the waiting a player would do anyway, without the standing about. Not offered with anything awake and dangerous in
   the room, nor anything out of place that would never come home by itself. */
const Waiting = {
    MAX: 60 * 60,      /* game frames at most (a minute of the House's time) */
    away(a, r) {
        return a.ents.filter(e => e.ret && !e.removed && e.ret.state !== 'home' && a.roomAt(e.tx, e.ty) === r && !e.carried);
    },
    canWait() {
        const a = G.map, p = G.player, r = Cam.room;
        if (!a || !p || !r || !a.def.house || p.state !== 'normal' || p.ride || p.carry) return false;
        if ((a.walkers || []).some(e => e.alive !== false && !e.hidden && !e.harmless && !(ENEMY[e.type] && ENEMY[e.type].harmless) && a.roomAt(Math.floor(e.x / T), Math.floor(e.y / T)) === r)) return false;
        const away = this.away(a, r);
        /* (tied off, asleep or held: they'd never come home on their own, so waiting would wait for ever) */
        return away.length > 0 && away.every(e => !e.tiedOff && !Return.asleep(e) && !e.heldBy && !e.paddled);
    },
    start() {
        const p = G.player;
        G.waiting = { t: 0, room: Cam.room };
        p.state = 'sleep'; p.walking = false;
        UI.toast('You sit down to wait...', 90);
        Stats.count('waited');
    },
    /* each step: done when the room's things are all home (or something else needs Wren) */
    tick() {
        const w = G.waiting; if (!w) return;
        const a = G.map, p = G.player;
        w.t++;
        const anyKey = w.t > 10 && ['act', 'atk', 'tool', 'menu', 'up', 'down', 'left', 'right'].some(b => Input.pressed(b));
        const home = this.away(a, w.room).length === 0;
        if (home || anyKey || w.t > this.MAX || Dialog.active || p.area !== a || Cam.room !== w.room) {
            G.waiting = null;
            if (p.state === 'sleep') p.state = 'normal';
            if (home) UI.toast('Everything in here is back where it belongs.', 120);
        }
    },
};
