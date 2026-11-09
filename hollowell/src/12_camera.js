/* The camera follows Wren and keeps to the room Wren is in. Crossing into another room scrolls over
   (the world waits meanwhile) and gives Wren a new mark at the doorway. Outdoors the area is one room. */

const Cam = {
    x: 0, y: 0, room: null, trans: null,
    target(p, room) {
        const r = room || this.room;
        let x = p.x - W / 2, y = p.y - 6 - H / 2;
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
            /* Wren steps on through the doorway */
            p.x = lerp(tr.px0, tr.px1, k); p.y = lerp(tr.py0, tr.py1, k);
            p.anim++; p.walking = true;
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
            this.trans = { fx: this.x, fy: this.y, tx: t.x, ty: t.y, t: 0, dur: 34, px0: p.x, py0: p.y, px1, py1 };
            if (p.grip) p.release();
            return;
        }
        const t = this.target(p);
        /* outdoors, a gentle follow; indoors, exact */
        if (p.area.family === 'outdoor') {
            this.x = Math.round(lerp(this.x, t.x, 0.2)); this.y = Math.round(lerp(this.y, t.y, 0.2));
            if (Math.abs(this.x - t.x) < 1) this.x = t.x; if (Math.abs(this.y - t.y) < 1) this.y = t.y;
        } else { this.x = t.x; this.y = t.y; }
    },
    get busy() { return !!this.trans; },
};
