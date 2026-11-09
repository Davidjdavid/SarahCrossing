/* input: keyboard, mouse wheel and drag, gamepad, and on-screen buttons on touch screens.
   Everything is read as named buttons: held (Input.down) and pressed this step (Input.hit). */
const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'act', Space: 'act', Enter: 'act', KeyJ: 'act',
    KeyX: 'look', ShiftLeft: 'look', ShiftRight: 'look', KeyK: 'look',
    KeyC: 'center', KeyL: 'center',
    KeyQ: 'zout', Minus: 'zout', NumpadSubtract: 'zout',
    KeyE: 'zin', Equal: 'zin', NumpadAdd: 'zin',
    Tab: 'split', KeyP: 'split',
    KeyN: 'notebook', KeyI: 'notebook',
    Escape: 'menu', Backspace: 'back',
    F2: 'debug',
};
const Input = {
    keys: {}, down: {}, hit: {}, prev: {}, wheel: 0, drag: null, pad: null, touch: {}, anyHit: false, lastKind: 'key',
    init(canvas) {
        addEventListener('keydown', e => {
            const b = KEYMAP[e.code];
            if (b) { this.keys[b] = true; e.preventDefault(); }
            this.anyKey = true; this.lastKind = 'key';
            Audio2.unlock();
        });
        addEventListener('keyup', e => { const b = KEYMAP[e.code]; if (b) { this.keys[b] = false; e.preventDefault(); } });
        addEventListener('blur', () => { this.keys = {}; });
        canvas.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('mousedown', e => {
            Audio2.unlock(); canvas.focus();
            if (e.button === 2 || e.button === 1) { this.drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; e.preventDefault(); }
            else this.click = true;
        });
        addEventListener('mousemove', e => { if (this.drag) { this.drag.dx += e.clientX - this.drag.x; this.drag.dy += e.clientY - this.drag.y; this.drag.x = e.clientX; this.drag.y = e.clientY; } });
        addEventListener('mouseup', e => { if (e.button === 2 || e.button === 1) this.drag = null; });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    },
    /* one step: merge every source into down/hit */
    poll() {
        const d = {};
        for (const k in this.keys) if (this.keys[k]) d[k] = true;
        for (const k in this.touch) if (this.touch[k]) d[k] = true;
        this.padAxes = null;
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const p of pads) {
            if (!p) continue;
            const ax = p.axes, bt = i => p.buttons[i] && p.buttons[i].pressed;
            const dz = 0.35;
            if (ax[0] < -dz || bt(14)) d.left = true;
            if (ax[0] > dz || bt(15)) d.right = true;
            if (ax[1] < -dz || bt(12)) d.up = true;
            if (ax[1] > dz || bt(13)) d.down = true;
            if (bt(0)) d.act = true;
            if (bt(1)) d.back = true;
            if (bt(2)) d.center = true;
            if (bt(3)) d.notebook = true;
            if (bt(4) || bt(6)) d.zout = true;
            if (bt(5) || bt(7)) d.zin = true;
            if (bt(9)) d.menu = true;
            if (bt(8)) d.split = true;
            if (bt(10)) d.look = true;
            if (Math.hypot(ax[2] || 0, ax[3] || 0) > dz) this.padAxes = [ax[2], ax[3]];
            for (const b of p.buttons) if (b.pressed) this.lastKind = 'pad';
        }
        this.hit = {};
        for (const k in d) if (!this.prev[k]) this.hit[k] = true;
        if (this.wheel) { if (this.wheel > 0) this.hit.zout = true; else this.hit.zin = true; this.wheel = 0; }
        this.anyHit = Object.keys(this.hit).length > 0 || !!this.click;
        this.clicked = !!this.click; this.click = false;
        this.prev = d; this.down = d;
    },
    axis() {
        let x = 0, y = 0;
        if (this.down.left) x -= 1; if (this.down.right) x += 1;
        if (this.down.up) y -= 1; if (this.down.down) y += 1;
        if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
        return [x, y];
    },
    /* the look vector: right stick or mouse drag (in screen pixels) */
    takeDrag() { if (!this.drag) return null; const r = [this.drag.dx, this.drag.dy]; this.drag.dx = 0; this.drag.dy = 0; return r; },
    consume(b) { delete this.hit[b]; },
};
