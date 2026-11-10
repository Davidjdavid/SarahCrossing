/* Controls: every button can be changed, on the keyboard and on a controller (Options > Controls), and the game's own
   words about buttons say whatever's bound now ("[tool]" in a line becomes C, or B with a controller in hand). A
   controller is read in the standard layout (Xbox-style names; a PlayStation or Switch pad's buttons in the same
   places): the d-pad and left stick always move; the rest are as bound. */

const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'L3', 'R3', 'D-pad up', 'D-pad down', 'D-pad left', 'D-pad right', 'Home'];
const PAD_DEFAULT = { act: [0], atk: [2], tool: [1, 3], prev: [4], next: [5], menu: [9], map: [8] };
const ACTION_NAMES = { up: 'Up', down: 'Down', left: 'Left', right: 'Right', act: 'Act: talk, lift, read', atk: 'Stick: swing', tool: 'Use your tool', prev: 'Tool before', next: 'Tool after', menu: 'Menu', map: 'Map' };
/* (always there, whatever's bound: the arrows move and Escape opens the menu, so nobody can lock themselves out) */
const KEYS_FIXED = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Escape: 'menu' };

Input.padmap = JSON.parse(JSON.stringify(PAD_DEFAULT));
Input.padRaw = [];
Input.padName = '';
Input.padBlocked = false;
Input.pollPad = function () {
    this.pad = {}; this.padRaw = [];
    if (HEADLESS || !navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { this.padBlocked = true; return; }   /* (a page that may not read controllers) */
    let name = '';
    for (const p of pads) {
        if (!p || !p.connected) continue;
        name = name || p.id;
        const bt = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
        const ax = p.axes || [];
        p.buttons.forEach((b, i) => { if (bt(i)) this.padRaw.push(i); });
        const set = (b, v) => { if (v) { this.pad[b] = 1; this.lastKind = 'pad'; } };
        set('up', bt(12) || ax[1] < -0.5); set('down', bt(13) || ax[1] > 0.5);
        set('left', bt(14) || ax[0] < -0.5); set('right', bt(15) || ax[0] > 0.5);
        for (const [b, list] of Object.entries(this.padmap)) set(b, list.some(bt));
    }
    this.padName = name;
};
/* what a key is called, short */
function keyName(code) {
    if (!code) return '?';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    if (code.startsWith('Arrow')) return code.slice(5);
    return { Space: 'Space', Enter: 'Enter', Escape: 'Esc', Tab: 'Tab', ShiftLeft: 'Shift', ShiftRight: 'Right Shift', ControlLeft: 'Ctrl', ControlRight: 'Right Ctrl', AltLeft: 'Alt', AltRight: 'Right Alt', Backspace: 'Backspace', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`' }[code] || code;
}
/* the keys bound to a button (in the order they were bound) */
function keysFor(b) { return Object.keys(Input.keymap).filter(c => Input.keymap[c] === b); }
/* what to call a button in the game's words: the controller's name for it with a controller in hand, else the key */
function keyLabel(b) {
    if (Input.lastKind === 'pad') {
        if (b === 'up' || b === 'down' || b === 'left' || b === 'right') return 'the d-pad';
        const i = (Input.padmap[b] || [])[0];
        return i === undefined ? '?' : PAD_NAMES[i] || 'Button ' + i;
    }
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') return 'the arrows';
    const ks = keysFor(b).filter(c => !(c in KEYS_FIXED) || b === 'menu');
    return keyName(ks.find(c => c !== 'Escape') || ks[0]);
}
/* "[tool]" and the like in the game's lines: the button's name now */
function fillKeys(s) { return typeof s === 'string' ? s.replace(/\[(up|down|left|right|act|atk|tool|prev|next|menu|map)\]/g, (m, b) => keyLabel(b)) : s; }

const Controls = {
    open: false, sel: 0, wait: null, rawPrev: [], msg: '', t: 0,
    list() { return ['up', 'down', 'left', 'right', 'act', 'atk', 'tool', 'prev', 'next', 'menu', 'map', 'reset']; },
    start() { this.open = true; this.sel = 0; this.wait = null; this.msg = ''; this.rawPrev = Input.padRaw.slice(); Sfx.play('select'); },
    close() { this.open = false; this.wait = null; Input.textHandler = null; Settings.save(); Input.swallow(); },
    /* set a key for button b: it's b's now (and nothing else's); b's other keys go, except the arrows and Escape */
    bindKey(b, code) {
        if (code in KEYS_FIXED && KEYS_FIXED[code] !== b) { this.msg = keyName(code) + ' is kept for ' + ACTION_NAMES[KEYS_FIXED[code]].toLowerCase() + '.'; return false; }
        for (const c of Object.keys(Input.keymap)) if (Input.keymap[c] === b && !(c in KEYS_FIXED)) delete Input.keymap[c];
        delete Input.keymap[code];
        Input.keymap[code] = b;
        for (const [c, v] of Object.entries(KEYS_FIXED)) Input.keymap[c] = v;
        this.msg = ACTION_NAMES[b] + ': ' + keyName(code) + '.';
        return true;
    },
    bindPad(b, i) {
        for (const k of Object.keys(Input.padmap)) Input.padmap[k] = Input.padmap[k].filter(x => x !== i);
        Input.padmap[b] = [i];
        this.msg = ACTION_NAMES[b] + ': ' + (PAD_NAMES[i] || 'Button ' + i) + '.';
    },
    reset() {
        Input.keymap = Object.assign({}, KEYMAP_DEFAULT);
        Input.padmap = JSON.parse(JSON.stringify(PAD_DEFAULT));
        this.msg = 'Back to how they started.';
    },
    update(back) {
        this.t++;
        const L = this.list(), b = L[this.sel];
        const fresh = Input.padRaw.filter(i => !this.rawPrev.includes(i));
        this.rawPrev = Input.padRaw.slice();
        if (this.wait) {
            /* waiting for the new key or button (Escape, or the controller's Back, to leave it as it was) */
            if (fresh.length) {
                const i = fresh[0];
                if (i >= 12 && i <= 15) this.msg = 'The d-pad always moves.';
                else if (i === 8 && this.wait !== 'map' && !Input.padmap[this.wait].includes(8) && Input.padmap.map.includes(8) && false) this.msg = '';
                else this.bindPad(this.wait, i);
                this.wait = null; Input.textHandler = null; Sfx.play('select'); Input.swallow();
            }
            return;
        }
        if (Input.pressed('up')) { this.sel = (this.sel + L.length - 1) % L.length; Sfx.play('menu'); }
        if (Input.pressed('down')) { this.sel = (this.sel + 1) % L.length; Sfx.play('menu'); }
        if (Input.pressed('atk') || (Input.pressed('menu') && !this.waitedT)) { this.close(); back(); Sfx.play('cancel'); return; }
        if (Input.pressed('act')) {
            if (b === 'done') { this.close(); back(); Sfx.play('cancel'); return; }
            if (b === 'reset') { this.reset(); Sfx.play('select'); return; }
            this.wait = b; this.msg = '';
            Sfx.play('select');
            const isMove = b === 'up' || b === 'down' || b === 'left' || b === 'right';
            /* the next key pressed is the new one (a controller button too, for anything but moving) */
            Input.textHandler = e => {
                if (e.type && e.type !== 'keydown') return false;
                if (e.code === 'Escape') { this.wait = null; this.msg = 'Left as it was.'; Input.textHandler = null; return true; }
                if (this.bindKey(b, e.code)) Sfx.play('select');
                this.wait = null; Input.textHandler = null;
                return true;
            };
            if (isMove) this.msg = '';
        }
    },
    draw() {
        const x = 16, y = 12, w = W - 32, h = H - 24;
        stitchedBox(x, y, w, h);
        Font.draw('{red}Controls', x + 10, y + 7, PAL.ink);
        Font.draw('Keyboard', x + 150, y + 7, PAL.grey3);
        Font.draw(Input.padName ? 'Controller' : 'Controller', x + 220, y + 7, PAL.grey3);
        const L = this.list();
        L.forEach((b, i) => {
            const yy = y + 19 + i * 10, on = i === this.sel;
            if (on) Font.draw('\x02', x + 6, yy, PAL.red2);
            const col = on ? PAL.ink : PAL.grey3;
            if (b === 'reset') { Font.draw('Put them all back as they were', x + 14, yy, col); return; }
            if (b === 'done') { Font.draw('Done', x + 14, yy, col); return; }
            Font.draw(ACTION_NAMES[b], x + 14, yy, col);
            const waiting = this.wait === b && (G.t >> 4) % 2;
            const ks = keysFor(b).filter(c => !(c in KEYS_FIXED)).map(keyName);
            const isMove = b === 'up' || b === 'down' || b === 'left' || b === 'right';
            const keyText = this.wait === b ? (waiting ? 'press a key...' : '') : (ks.length ? ks.join(' ') : '-') + (isMove ? ' ' + keyName('Arrow' + b[0].toUpperCase() + b.slice(1)) : '');
            Font.draw(keyText, x + 150, yy, this.wait === b ? PAL.red2 : col);
            const padText = isMove ? 'D-pad, stick' : this.wait === b ? (waiting ? 'or a button' : '') : (Input.padmap[b] || []).map(i => PAD_NAMES[i] || 'Button ' + i).join(' ');
            Font.draw(padText, x + 220, yy, this.wait === b ? PAL.red2 : col);
        });
        const foot = this.msg || (this.wait ? 'Esc leaves it as it was.' : (Input.padBlocked ? "(This page can't read controllers.) " : '') + keyLabel('act') + ' changes one. ' + keyLabel('atk') + ' when done.' + (Input.padName ? ' Controller found.' : ''));
        Font.draw(foot, x + 10, y + h - 14, PAL.grey3);
    },
};

/* Options: a screen filter and the controls screen */
{
    const rows0 = Options.rows;
    Options.rows = function () {
        const r = rows0.call(this);
        r.push(['Screen filter', () => ['off', 'soft', 'strong'][Settings.crt | 0], d => { Settings.crt = ((Settings.crt | 0) + (d > 0 ? 1 : 2)) % 3; Pace.dirty = true; }]);
        r.push(['Controls', () => '', () => { if (Input.pressed('act') || Input.pressed('right')) Controls.start(); }]);
        return r;
    };
    const up0 = Options.update;
    Options.update = function (back) { if (Controls.open) return Controls.update(() => { }); return up0.call(this, back); };
    const draw0 = Options.draw;
    Options.draw = function (inMenu) { if (Controls.open) return Controls.draw(); return draw0.call(this, inMenu); };
}
