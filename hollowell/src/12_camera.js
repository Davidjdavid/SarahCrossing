/* The camera follows Wren and keeps to the room Wren is in. Crossing into another room scrolls over
   (the world waits meanwhile) and gives Wren a new mark at the doorway. Outdoors the area is one room. */

const Cam = {
    x: 0, y: 0, room: null, trans: null,
    target(p, room, free) {
        const r = room || this.room;
        let x = p.x - W / 2, y = p.y - 6 - H / 2;
        if (free) return { x: Math.round(x), y: Math.round(y) };      /* (a look across rooms: right at it, whatever room it's in) */
        const rx = r.x * T, ry = r.y * T, rw = r.w * T, rh = r.h * T;
        /* the HUD sits over the top 14 px of a room-sized room */
        const top = ry - (rh <= H ? (H - rh) / 2 : 0);
        if (rw <= W) x = rx - (W - rw) / 2; else x = clamp(x, rx, rx + rw - W);
        if (rh <= H) y = top; else y = clamp(y, ry, ry + rh - H);
        return { x: Math.round(x), y: Math.round(y) };
    },
    snap(p) {
        this.room = p.area.roomAt(p.tx, p.ty) || p.area.rooms[0];
        const t = this.target(p);
        this.x = t.x; this.y = t.y; this.trans = null;
    },
    update(p) {
        if (this.trans) {
            const tr = this.trans;
            tr.t++;
            const k = tr.t / tr.dur, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            this.x = Math.round(lerp(tr.fx, tr.tx, e)); this.y = Math.round(lerp(tr.fy, tr.ty, e));
            /* Wren steps on through the doorway (the tool pressed meanwhile is kept for when she's through) */
            p.x = lerp(tr.px0, tr.px1, k); p.y = lerp(tr.py0, tr.py1, k);
            p.anim++; p.walking = true;
            if (Input.pressed('tool')) p.toolQ = true;
            if (tr.t >= tr.dur) {
                this.trans = null;
                p.setMark();
                Stats.enterRoom(p.area, this.room);
                if (G.onRoomEnter) G.onRoomEnter(p.area, this.room);
            }
            return;
        }
        if (p.state === 'flight' || p.state === 'faint') {
            const r = p.area.roomAt(p.tx, p.ty);
            if (r && r !== this.room) { this.room = r; }
        }
        const r = p.area.roomAt(p.tx, p.ty);
        if (r && r !== this.room && p.state === 'normal' && !Script.blocking()) {
            const from = this.room;
            this.room = r;
            const t = this.target(p, r);
            /* carry Wren a little way in so the doorway is behind */
            const dx = sign(Math.round(p.x / T - 0.5) - Math.round((from.x + from.w / 2))), dy = 0;
            const dirx = p.tx < r.x + 0.01 ? 0 : 0;
            let px1 = p.x, py1 = p.y;
            if (p.tx >= r.x && p.tx < r.x + r.w && (tileOf(p.x - DX[p.dir] * T) < r.x || tileOf(p.x - DX[p.dir] * T) >= r.x + r.w)) px1 = p.x + DX[p.dir] * 14;
            if (p.ty >= r.y && p.ty < r.y + r.h && (tileOf(p.y - DY[p.dir] * T) < r.y || tileOf(p.y - DY[p.dir] * T) >= r.y + r.h)) py1 = p.y + DY[p.dir] * 14;
            /* (only as far in as she could walk: a thing standing just inside the doorway stops her short of it, instead of
               her ending up half inside it, unable to move) */
            const ux = sign(px1 - p.x), uy = sign(py1 - p.y);
            if (ux || uy) { let n = 14; while (n > 0 && !p.boxFree(p.x + ux * n, p.y + uy * n)) n--; px1 = p.x + ux * n; py1 = p.y + uy * n; }
            this.trans = { fx: this.x, fy: this.y, tx: t.x, ty: t.y, t: 0, dur: 34, px0: p.x, py0: p.y, px1, py1 };
            if (p.grip) p.release();
            return;
        }
        /* a scene can point the camera somewhere else for a while (Cam.look: a point in the world), panned to gently;
           (once no scene is running, it comes back to Wren whatever the scene forgot) */
        if (this.look && !Script.blocking()) { this.look = null; this.lookEase = true; }
        const t = this.target(this.look ? { x: this.look.x, y: this.look.y + 6 } : p, null, this.look && this.look.free);
        /* outdoors, a gentle follow; indoors, exact */
        if (p.area.family === 'outdoor' || this.look || this.lookEase) {
            const k = this.look || this.lookEase ? 0.08 : 0.2;
            /* (eased by a fraction, but never less than a pixel a step: rounding a small fraction used to leave it
               stuck a few pixels short) */
            const ease = (c, g) => { const d = g - c; if (!d) return c; const st = d * k; return Math.round(c + (Math.abs(st) < 1 ? Math.sign(d) * Math.min(1, Math.abs(d)) : st)); };
            this.x = ease(this.x, t.x); this.y = ease(this.y, t.y);
            if (this.lookEase && Math.abs(this.x - t.x) < 1 && Math.abs(this.y - t.y) < 1) this.lookEase = false;
            if (Math.abs(this.x - t.x) < 1) this.x = t.x; if (Math.abs(this.y - t.y) < 1) this.y = t.y;
        } else { this.x = t.x; this.y = t.y; }
    },
    get busy() { return !!this.trans; },
};
/* for scenes: look at a tile (or a thing) and wait till the camera's there; then back to Wren */
function* camLook(x, y, max = 90) {
    Cam.look = typeof x === 'object' ? { x: (x.isGrid ? x.px : x.x) + 8, y: (x.isGrid ? x.py : x.y) + 8 } : { x: x * T + 8, y: y * T + 8 };
    /* (a look out of the room Wren's in, at a door in its wall or into another room: the camera goes right to it, not
       kept to her room) */
    const a = G.map, lr = a && a.rooms && a.rooms.length > 1 ? a.roomAt(tileOf(Cam.look.x), tileOf(Cam.look.y)) : null;
    if (lr && lr !== Cam.room) Cam.look.free = true;
    for (let i = 0; i < max; i++) { const t = Cam.target({ x: Cam.look.x, y: Cam.look.y + 6 }, null, Cam.look.free); if (Math.abs(Cam.x - t.x) < 2 && Math.abs(Cam.y - t.y) < 2) break; yield 1; }
}
function* camBack(max = 90) {
    Cam.look = null; Cam.lookEase = true;
    const p = G.player;
    for (let i = 0; i < max && Cam.lookEase; i++) yield 1;
    Cam.lookEase = false;
}
