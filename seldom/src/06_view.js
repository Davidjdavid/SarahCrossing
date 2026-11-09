/* the view. On Seldom the view is not a camera looking at a world that goes on without it:
   what's in it is what's alive. Cam holds where it is; Laws (07) says what that means. */
const TINY_ZOOM = 3;
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3];
const Cam = {
    zoom: 1, ztarget: 1, zmin: 1, zmax: 1,
    mode: 'follow',          /* follow | pinned */
    ax: 0, ay: 0,            /* the main frame's center */
    bx: 0, by: 0,            /* the second frame's center (split) */
    split: false, home: 0,   /* which frame Dot is in */
    looking: false, lookMoved: false,
    bump: { l: 0, r: 0, t: 0, b: 0 },
    eye: false,              /* the last act: the view moves on its own, no Dot */
    hold: null,              /* a scripted framing {x, y, zoom} for scenes */
    /* rooms are shown a little closer (they're small); the laws don't care, everything in a room is in view */
    roomScale() { return World.map && World.map.def.indoor && !this.eye ? 1.5 : 1; },
    fw() { return (this.split ? VIEW_W / 2 : VIEW_W) / (this.zoom * this.roomScale()); },
    fh() { return VIEW_H / (this.zoom * this.roomScale()); },
    rect(i) {
        const w = this.fw(), h = this.fh();
        const cx = i ? this.bx : this.ax, cy = i ? this.by : this.ay;
        return { x: cx - w / 2, y: cy - h / 2, w, h };
    },
    frames() { return this.split ? [this.rect(0), this.rect(1)] : [this.rect(0)]; },
    homeRect() { return this.rect(this.home); },
    canLook() { return !!G.flags.spyglass || this.eye; },
    snap() {
        const d = World.dot; if (!d || this.eye) return;
        this.ax = ecx(d); this.ay = ecy(d) - 6; this.home = 0; this.clampMap(0);
    },
    /* keep a frame on its map (where the map is smaller than the frame, center it) */
    clampMap(i) {
        const m = World.map, w = this.fw(), h = this.fh();
        let cx = i ? this.bx : this.ax, cy = i ? this.by : this.ay;
        const pad = m.def.pad || 0;
        if (m.pw + pad * 2 <= w) cx = m.pw / 2; else cx = clamp(cx, w / 2 - pad, m.pw - w / 2 + pad);
        if (m.ph + pad * 2 <= h) cy = m.ph / 2; else cy = clamp(cy, h / 2 - pad, m.ph - h / 2 + pad);
        if (i) { this.bx = cx; this.by = cy; } else { this.ax = cx; this.ay = cy; }
    },
    /* Dot's picture box (feet box plus the head) */
    dotBox() { const d = World.dot; return { x: d.x - 1, y: d.y - 14, w: d.w + 2, h: d.h + 14 }; },
    /* move frame i so Dot stays inside it */
    keepDot(i) {
        if (this.eye || !World.dot) return;
        const r = this.rect(i), b = this.dotBox();
        let dx = 0, dy = 0;
        if (b.x < r.x) dx = b.x - r.x; else if (b.x + b.w > r.x + r.w) dx = b.x + b.w - (r.x + r.w);
        if (b.y < r.y) dy = b.y - r.y; else if (b.y + b.h > r.y + r.h) dy = b.y + b.h - (r.y + r.h);
        if (i) { this.bx += dx; this.by += dy; } else { this.ax += dx; this.ay += dy; }
    },
    setZoom(z) {
        this.ztarget = clamp(z, this.zmin, this.zmax);
    },
    stepZoom(dir) {
        const zs = ZOOMS.filter(z => z >= this.zmin - 0.001 && z <= this.zmax + 0.001);
        let i = zs.findIndex(z => Math.abs(z - this.ztarget) < 0.01);
        if (i < 0) i = zs.indexOf(1);
        const j = clamp(i + dir, 0, zs.length - 1);
        if (j !== i) { this.ztarget = zs[j]; Sfx.play(dir > 0 ? 'zin' : 'zout'); }
        else Sfx.play('nope');
    },
    update(dt) {
        const d = World.dot;
        if (this.hold) {   /* a scene holds the view */
            const h = this.hold;
            this.ax = lerp(this.ax, h.x, Math.min(1, dt * (h.speed || 3)));
            this.ay = lerp(this.ay, h.y, Math.min(1, dt * (h.speed || 3)));
            if (h.zoom) this.zoom = lerp(this.zoom, h.zoom, Math.min(1, dt * 3));
            if (!h.free) this.clampMap(0);
            return;
        }
        /* zoom */
        if (G.state === 'play' && (this.zmin < 1 || this.zmax > 1)) {
            if (Input.hit.zout) this.stepZoom(-1);
            if (Input.hit.zin) this.stepZoom(1);
        }
        if (Math.abs(this.zoom - this.ztarget) > 0.001) {
            const before = this.zoom;
            this.zoom = Math.abs(this.ztarget - this.zoom) < 0.01 ? this.ztarget : lerp(this.zoom, this.ztarget, Math.min(1, dt * 10));
            if (this.mode === 'follow' && !this.split && d) { this.ax = ecx(d); this.ay = ecy(d) - 6; }
            if (before !== this.zoom) { this.keepDot(this.home); this.clampMap(0); if (this.split) this.clampMap(1); }
        }
        /* split (the Prism) */
        if (G.state === 'play' && Input.hit.split && G.flags.prism) this.toggleSplit();
        /* look */
        const look = G.state === 'play' && this.canLook() && !!(Input.down.look || Input.padAxes || Input.drag);
        if (look && !this.looking) { this.looking = true; this.lookMoved = false; }
        if (!look && this.looking) {
            this.looking = false;
            if (!this.lookMoved && !this.eye && !Input.padAxes) { if (this.mode === 'pinned') this.recenter(); }
        }
        if (G.state === 'play' && Input.hit.center && this.canLook() && !this.eye) this.recenter();
        if (this.looking && G.state === 'play') {
            let [x, y] = Input.down.look || this.eye ? Input.axis() : [0, 0];
            if (Input.padAxes) { x = Input.padAxes[0]; y = Input.padAxes[1]; }
            const sp = 200 / this.zoom * dt;
            let mx = x * sp, my = y * sp;
            const dr = Input.takeDrag();
            if (dr) { const s = World.screenScale(); mx -= dr[0] / s; my -= dr[1] / s; }
            if (mx || my) {
                this.lookMoved = true;
                if (!this.split && this.mode !== 'pinned') this.mode = 'pinned';
                const i = this.split ? 1 - this.home : 0;
                if (i) { this.bx += mx; this.by += my; } else { this.ax += mx; this.ay += my; }
                if (!this.split) this.keepDot(0);
                this.clampMap(i);
                if (!this.split) this.keepDot(0);
            }
        } else if (this.eye && G.state === 'play') {
            /* the last act: the arrows move the view itself */
            const [x, y] = Input.axis();
            const sp = 150 / this.zoom * dt * (Input.down.act ? 2 : 1);
            this.ax += x * sp; this.ay += y * sp; this.clampMap(0);
        }
        if (!this.split && this.mode === 'follow' && d && !this.eye) {
            const tx = ecx(d) + (DIRS[d.dir][0] * 10), ty = ecy(d) - 6 + DIRS[d.dir][1] * 6;
            const k = Math.min(1, dt * 7);
            this.ax = lerp(this.ax, tx, k); this.ay = lerp(this.ay, ty, k);
            this.keepDot(0); this.clampMap(0);
        }
        for (const k in this.bump) this.bump[k] = Math.max(0, this.bump[k] - dt * 3);
    },
    recenter() {
        if (this.split) { this.toggleSplit(); return; }
        if (this.mode !== 'follow') { this.mode = 'follow'; Sfx.play('unpin'); }
    },
    toggleSplit() {
        if (!this.split) {
            /* cut the view down the middle: the halves start side by side, so nothing jumps yet */
            const w = VIEW_W / this.zoom, cx = this.ax;
            this.split = true;
            this.ax = cx - w / 4; this.bx = cx + w / 4; this.by = this.ay;
            this.home = World.dot && !this.eye && ecx(World.dot) >= cx ? 1 : 0;
            if (World.dot) World.dot.lastFrame = this.home;
            this.mode = 'pinned';
            Sfx.play('split'); this.splitAt = G.t;
            Notebook.saw('seam-split');
        } else {
            /* whole again, round the half Dot is in */
            const r = this.rect(this.home);
            this.split = false;
            this.ax = r.x + r.w / 2; this.ay = r.y + r.h / 2;
            this.home = 0; this.mode = 'pinned';
            this.keepDot(0); this.clampMap(0);
            Sfx.play('unsplit');
        }
    },
};
