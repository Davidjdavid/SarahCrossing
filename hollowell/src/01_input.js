/* Input: the keyboard, a gamepad, and a virtual pad the tests and the autopilot press.
   Buttons: up down left right act atk tool prev next menu map. Input.down(b) while held,
   Input.pressed(b) on the step it went down, Input.released(b) on the step it came up. */

const BUTTONS = ['up', 'down', 'left', 'right', 'act', 'atk', 'tool', 'prev', 'next', 'menu', 'map'];
const KEYMAP_DEFAULT = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    KeyZ: 'act', KeyJ: 'act', Space: 'act',
    KeyX: 'atk', KeyK: 'atk',
    KeyC: 'tool', KeyL: 'tool',
    KeyQ: 'prev', KeyE: 'next',
    Enter: 'menu', Escape: 'menu',
    KeyM: 'map', Tab: 'map',
};

const Input = {
    keys: {},            /* physical keys held (by button) */
    pad: {},             /* gamepad buttons held */
    virt: {},            /* virtual buttons held (tests, autopilot) */
    cur: {}, prev: {},
    keymap: Object.assign({}, KEYMAP_DEFAULT),
    lastKind: 'key',
    anyPressed: false,
    textHandler: null,   /* name entry takes raw characters */

    init() {
        if (HEADLESS) return;
        addEventListener('keydown', e => {
            if (e.code === 'F11') return;
            if (this.textHandler && this.textHandler(e)) { e.preventDefault(); return; }
            const b = this.keymap[e.code];
            if (b) { this.keys[b] = (this.keys[b] || 0) + (this.keys['_' + e.code] ? 0 : 1); this.keys['_' + e.code] = 1; e.preventDefault(); }
            if (e.code === 'F1' && G.debug) { Debug.toggle(); e.preventDefault(); }
            this.lastKind = 'key';
            Audio.unlock();
        });
        addEventListener('keyup', e => {
            const b = this.keymap[e.code];
            if (b && this.keys['_' + e.code]) { this.keys[b] = Math.max(0, (this.keys[b] || 1) - 1); this.keys['_' + e.code] = 0; e.preventDefault(); }
        });
        addEventListener('blur', () => { this.keys = {}; });
        addEventListener('mousedown', () => Audio.unlock());
    },

    pollPad() {
        this.pad = {};
        if (HEADLESS || !navigator.getGamepads) return;
        const pads = navigator.getGamepads();
        for (const p of pads) {
            if (!p) continue;
            const bt = i => p.buttons[i] && p.buttons[i].pressed;
            const ax = p.axes || [];
            const set = (b, v) => { if (v) { this.pad[b] = 1; this.lastKind = 'pad'; } };
            set('up', bt(12) || ax[1] < -0.5); set('down', bt(13) || ax[1] > 0.5);
            set('left', bt(14) || ax[0] < -0.5); set('right', bt(15) || ax[0] > 0.5);
            set('act', bt(0)); set('atk', bt(2)); set('tool', bt(1) || bt(3));
            set('prev', bt(4)); set('next', bt(5)); set('menu', bt(9)); set('map', bt(8));
        }
    },

    /* once per step, before the game reads anything */
    update() {
        this.pollPad();
        this.prev = this.cur;
        this.cur = {};
        this.anyPressed = false;
        for (const b of BUTTONS) {
            this.cur[b] = !!(this.keys[b] || this.pad[b] || this.virt[b]);
            if (this.cur[b] && !this.prev[b]) this.anyPressed = true;
        }
    },
    down(b) { return !!this.cur[b]; },
    pressed(b) { return !!this.cur[b] && !this.prev[b]; },
    released(b) { return !this.cur[b] && !!this.prev[b]; },
    /* the d-pad as a vector (8 ways) */
    axis() {
        return { x: (this.cur.right ? 1 : 0) - (this.cur.left ? 1 : 0), y: (this.cur.down ? 1 : 0) - (this.cur.up ? 1 : 0) };
    },
    clearVirtual() { this.virt = {}; },
    /* forget what's held so a menu closing doesn't fire the button again */
    swallow() { for (const b of BUTTONS) this.prev[b] = this.cur[b]; },
};
