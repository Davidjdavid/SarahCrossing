/* House 2: the Kiln, in Kilnridge. Bram's House, ochre threads. A broken pot's shards fly home back the way
   it was carried and strike whatever hangs or stands on the way: Wren lays the shards' path by walking.
   One flight rings many charms at once; the last one walked under rings first; doubling back erases a
   stretch; the path can run through doorways and over chasms (the Hookline). The Kilnwyrm follows
   Wren's footsteps, and so do the shards. */

THEMES.kilnhouse = { floor: ['#e8b884', '#c78a52', '#f3d0a4', '#a86e3e'], wall: ['#b8583a', '#8a3c28', '#d67a54', '#5e261c'], stone: ['#c4623a', '#93432c', '#e08a5e', '#6a2e22'], water: ['#5fa6c8', '#3f80b0', '#9cd0e8', '#2b5a88'], dark: '#3a1810' };
FLOORS.kilnhouse = {
    floor: (x, th, v) => {
        /* big terracotta tiles */
        fill(x, '#d99a62'); fill(x, '#c4844e', 0, 7, 16, 1); fill(x, '#c4844e', 7, 0, 1, 16);
        fill(x, '#e8b480', 0, 0, 7, 1); fill(x, '#e8b480', 8, 8, 7, 1);
        speckle(x, ['#b87440'], 30 + v, 0.05);
    },
    floor2: (x, th, v) => { fill(x, '#a85a34'); speckle(x, ['#c0703e', '#8a4628'], 20 + v, 0.25); for (let i = 0; i < 16; i += 4) fill(x, '#7a3a20', 0, i, 16, 1); },
    floor3: (x, th, v) => Paint.planks(x, ['#b07a4a', '#86562e', '#d09a64', '#5e3a1e'], v, true),
};
WALLS.kilnhouse = {
    edge: '#3a1810',
    top: (x) => { fill(x, '#6a2e1e'); speckle(x, ['#7a3a26'], 4, 0.15); },
    face: (x, th, v) => {
        Paint.bricks(x, ['#c4623a', '#93432c', '#e08a5e', '#5e261c'], v);
        fill(x, '#3a1810', 0, 15, 16, 1);
        if (v === 2) { fill(x, '#2a1410', 6, 6, 4, 5); fill(x, '#f39a3c', 7, 9, 2, 2); }   /* a little firebox */
    },
};

const KILN_OUT = { x: 22, y: 80 + 14 };    /* the door out, in Kilnridge (set by the region) */

defHouse({
    id: 'kiln', name: 'The Kiln', place: 'The Kiln', house: 'kiln', theme: 'kilnhouse', thread: THREAD.bram, music: 'kilnhouse',
    knotName: 'Fired Knot',
    entry: { x: 29, y: 42 },
    cells: {
        /* ---------------- 1 Entrance ---------------- */
        '1,3': {
            name: 'Kiln Door',
            rows: [
                '#########.##########',
                '#..............#...#',
                '#..............#...#',
                '#..............##.##',
                '#....oooooooooo.....',
                '#....oooooooooo....#',
                '#....oooooooooo....#',
                '.,,,,,,,,,,,,,,,,,.#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'seal', x: 9, y: 0, id: 'eSeal' },
                { k: 'charm', x: 9, y: 5, mode: 'once', id: 'eCharm', sig: 'ek' },
                { k: 'door', x: 17, y: 3, type: 'gate', when: 'ek', id: 'eGate', passed: 'up' },
                { k: 'chest', x: 17, y: 1, item: 'key', id: 'eKey' },
                { k: 'pot', x: 2, y: 8, id: 'ePot1' }, { k: 'pot', x: 16, y: 8, id: 'ePot2' },
                { k: 'charm', x: 1, y: 7, mode: 'pulse', sig: 'lwr', col: 'leaf', id: 'lwrCharm', time: 200 },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: KILN_OUT.x, ty2: KILN_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: 'THE KILN. Mind the heat. Mind the pots. The pots mind you back.' },
            ],
            nudge: { solved: 'kiln_eGate', after: 60 * 60 * 2, at: [9, 5], say: 'The charm over the pit sways in the hot air. Anything flying past it would set it ringing.' },
        },
        /* ---------------- 1b Long Way Round (optional) ---------------- */
        '0,3': {
            name: 'Long Way Round',
            rows: [
                '####################',
                '#,,,,,#............#',
                '#,,,,,#............#',
                '#,,,,,#............#',
                '###.###............#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 3, y: 4, type: 'gate', when: 'lwr', id: 'lwrGate', passed: 'up' },
                { k: 'chest', x: 3, y: 2, item: 'heartpatch', id: 'lwrPatch' },
                { k: 'crock', x: 11, y: 3 },
                { k: 'kwkiln', x: 9, y: 6, solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
                { k: 'sign', x: 5, y: 5, text: 'A plaque by the little gate: "Rung from next door. Be here when it rings."' },
            ],
            nudge: { solved: 'kiln_lwrGate', after: 60 * 60 * 3, say: "The little gate answers to a charm in the next room. You'd have to be here, and it would have to ring there." },
        },
        /* ---------------- 2 Charm Hall: three at once ---------------- */
        '1,2': {
            name: 'Charm Hall',
            rows: [
                '##L######.##########',
                '#..................#',
                '#..................#',
                '#...###......###...#',
                '#.......,,,,.......#',
                '........,,,,........',
                '#.......,,,,.......#',
                '#...###......###...#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'charm', x: 5, y: 2, mode: 'pulse', sig: 'ha', col: 'ember', id: 'hA' },
                { k: 'charm', x: 14, y: 2, mode: 'pulse', sig: 'hb', col: 'ember', id: 'hB' },
                { k: 'charm', x: 9, y: 8, mode: 'pulse', sig: 'hc', col: 'ember', id: 'hC' },
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'ha&hb&hc', passed: 'up', id: 'hN' },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'hE' },
                { k: 'pot', x: 2, y: 8, id: 'hPot' }, { k: 'pot', x: 17, y: 8, id: 'hPot2' },
                { k: 'kwkiln', x: 9, y: 4, solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
            ],
            nudge: { solved: 'kiln_hN', after: 60 * 60 * 3, say: 'Three charms, all to ring at once. One throw only rings what it flies through... but the pieces go back the whole way you came.' },
        },
        /* ---------------- 3 Crock Pen ---------------- */
        '2,3': {
            name: 'Crock Pen',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..##..........##..#',
                '...##..........##..#',
                '#..................#',
                '#..................#',
                '#..##..........##..#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'crock', x: 6, y: 2 }, { k: 'crock', x: 13, y: 7 }, { k: 'crock', x: 15, y: 1 },
                { k: 'shutter', x: 0, y: 4, dir: 'v', group: 'crocks' },
                { k: 'chest', x: 17, y: 5, item: 'plan', id: 'cPlan', hidden: true, when: 'flag:kiln_crocksDone' },
                { k: 'kwkiln', x: 9, y: 5, solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
            ],
        },
        /* ---------------- 4 Sun, Moon, Star ---------------- */
        '2,2': {
            name: 'Sun, Moon, Star',
            rows: [
                '################.###',
                '#..................#',
                '#..................#',
                '#..#############...#',
                '#..#############...#',
                '...#############...#',
                '#..#############...#',
                '#..#############...#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'charm', x: 9, y: 1, seq: 'sms', order: 2, col: 'star', glyph: true, fade: 150, id: 'smsStar' },
                { k: 'charm', x: 17, y: 5, seq: 'sms', order: 1, col: 'moon', glyph: true, fade: 150, id: 'smsMoon' },
                { k: 'charm', x: 9, y: 9, seq: 'sms', order: 0, col: 'sun', glyph: true, fade: 150, id: 'smsSun' },
                { k: 'pot', x: 1, y: 8, id: 'smsPot' },
                { k: 'door', x: 16, y: 0, type: 'gate', when: 'sms', passed: 'up', id: 'smsN' },
                { k: 'mural', x: 8, y: 3, text: 'A mural painted on the clay: a sun, then a moon, then a star, in a row. Underneath, in somebody\'s neat hand: "In that order, please. All in one breath."' },
            ],
            nudge: { solved: 'kiln_smsN', after: 60 * 60 * 3, say: 'The pieces fly home starting from where they broke. Whatever you passed last, they reach first.' },
        },
        /* ---------------- 5 Doubling Back ---------------- */
        '0,2': {
            name: 'Doubling Back',
            rows: [
                '####################',
                '####################',
                '############.#....##',
                '############.#....##',
                '############.###.###',
                '#...................',
                '#.################.#',
                '#.################.#',
                '#..................#',
                '####################',
                '####################',
            ],
            ents: [
                { k: 'charm', x: 5, y: 5, mode: 'pulse', sig: 'da', col: 'leaf', id: 'dA' },
                { k: 'charm', x: 12, y: 2, mode: 'pulse', sig: 'db', col: 'leaf', id: 'dB' },
                { k: 'pot', x: 17, y: 8, id: 'dPot' },
                { k: 'chest', x: 15, y: 2, item: 'key', id: 'dKey', hidden: true, when: 'da&db' },
            ],
            nudge: { solved: 'kiln_dKey', after: 60 * 60 * 3, at: [12, 2], say: "Walking back the way you came unpicks the thread: the pieces would skip that bit. Finish where the charm is." },
        },
        /* ---------------- 6 The Glazer (Hookline) ---------------- */
        '2,1': {
            name: 'Glazing Room',
            rows: [
                '#########.##########',
                '#..................#',
                '#.##............##.#',
                '#.##............##.#',
                '#..................#',
                '#...................',
                '#..................#',
                '#.##............##.#',
                '#.##............##.#',
                '#..................#',
                '################.###',
            ],
            ents: [
                { k: 'glazer', x: 9, y: 2 },
                { k: 'shutter', x: 16, y: 10, group: 'glazer' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'glazer' },
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'gN' },
                { k: 'chest', x: 9, y: 6, item: 'hook', id: 'hookChest', hidden: true, when: 'flag:kiln_glazer', big: true },
            ],
        },
        /* ---------------- 7 Chasm Gallery ---------------- */
        '3,1': {
            name: 'Chasm Gallery',
            rows: [
                '####################',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '....ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#...ooo....ooo.....#',
                '#########.##########',
            ],
            ents: [
                { k: 'eyelet', x: 8, y: 2 }, { k: 'eyelet', x: 15, y: 7 }, { k: 'eyelet', x: 2, y: 8 },
                { k: 'pot', x: 17, y: 2, id: 'cgPot' },
                { k: 'chest', x: 17, y: 9, item: 'heartpatch', id: 'cgPatch' },
                { k: 'sign', x: 1, y: 1, text: 'GALLERY OF CHASMS. Admire them from the edge, or from a hook.' },
            ],
            nudge: { solved: 'kiln_cgPatch', at: [8, 2], say: 'A brass ring glints on a post across the chasm, just the right height for a hook.' },
        },
        /* ---------------- 8 Bridge of Cords ---------------- */
        '3,2': {
            name: 'Bridge of Cords',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#oooooooooooooooooo#',
                '#oooooooooooooooooo#',
                '#oooooooooooooooooo#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'charm', x: 6, y: 5, mode: 'once', sig: 'bc', id: 'bCharm' },
                { k: 'eyelet', x: 6, y: 1 },
                { k: 'eyelet', x: 14, y: 9 },
                { k: 'pot', x: 3, y: 8, id: 'bPot' },
                { k: 'chest', x: 17, y: 2, item: 'key', id: 'bKey', hidden: true, when: 'bc' },
            ],
            nudge: { solved: 'kiln_bKey', after: 60 * 60 * 3, at: [6, 5], say: 'The charm hangs over the drop, out of reach of any throw from the edge. But a path can cross a chasm, if you fly it.' },
        },
        /* ---------------- 9 Furnace Hall ---------------- */
        /* (the west strip, once reached, has a way back east: a step down through the floor's edge into the Charm Hall
           below, whose north gate is open by then; it only goes down, so it's no way in) */
        '1,1': {
            name: 'Furnace Hall',
            rows: [
                '####################',
                '#...ooo............#',
                '#...ooo............#',
                '#...ooo............#',
                '#...ooo............#',
                '....ooo............#',
                '#...ooo............#',
                '#...ooo............#',
                '#...ooo............#',
                '#...ooo............#',
                '##L######.##########',
            ],
            ents: [
                { k: 'crate', x: 3, y: 5, id: 'fCrate' },
                { k: 'pot', x: 16, y: 2, id: 'fPot' }, { k: 'pot', x: 16, y: 8, id: 'fPot2' },
                { k: 'door', x: 0, y: 5, type: 'lock', dir: 'v', id: 'fW' },
                { k: 'kwkiln', x: 14, y: 4, look: 'kw_furnace', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
                { k: 'sign', x: 12, y: 9, text: 'No hooks over the furnace pit, please. Nothing over there to hook on to anyway.' },
            ],
            nudge: { solved: 'kiln_fW', after: 60 * 60 * 3, at: [3, 5], say: "Where the crate sits, there's a little stitched cross. Knock the crate off it and there'd be nothing on that cross at all..." },
        },
        /* ---------------- 10 Drying Racks (the Pattern) ---------------- */
        '0,1': {
            name: 'Drying Racks',
            rows: [
                '#########,##########',
                '#..................#',
                '#..................#',
                '#......ooooo.......#',
                '#......ooooo.......#',
                '#......ooooo........',
                '#......ooooo.......#',
                '#......ooooo.......#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'charm', x: 16, y: 2, mode: 'pulse', sig: 'ra', col: 'sun', id: 'rA', time: 220 },
                { k: 'charm', x: 16, y: 8, mode: 'pulse', sig: 'rb', col: 'sun', id: 'rB', time: 220 },
                { k: 'charm', x: 9, y: 5, mode: 'pulse', sig: 'rc', col: 'sun', id: 'rC', time: 220 },
                { k: 'charm', x: 2, y: 8, mode: 'pulse', sig: 'rd', col: 'sun', id: 'rD', time: 220 },
                { k: 'eyelet', x: 5, y: 5 },
                { k: 'pot', x: 18, y: 6, id: 'rPot' },
                { k: 'chest', x: 2, y: 2, item: 'pattern', id: 'kPattern', hidden: true, when: 'ra&rb&rc&rd', big: true },
                { k: 'crackwall', x: 9, y: 0, id: 'sigSeal' },
                { k: 'deco', x: 1, y: 4, look: 'kw_rack', solid: [[0, 0]] }, { k: 'deco', x: 17, y: 4, look: 'kw_rack', solid: [[0, 0]] },
            ],
            nudge: { solved: 'kiln_kPattern', after: 60 * 60 * 4, say: 'Four charms, one flight. The path will have to cross the pit... and you can only cross it on a line.' },
        },
        /* ---------------- 11 Signature room ---------------- */
        '0,0': {
            name: 'Potting Shed',
            rows: [
                '####################',
                '####################',
                '#####..........#####',
                '#####..........#####',
                '#####..........#####',
                '#####..........#####',
                '#####..........#####',
                '#####..........#####',
                '#####..........#####',
                '#########,##########',
                '#########,##########',
            ],
            ents: [
                { k: 'signature', x: 9, y: 5, house: 'kiln' },
                { k: 'deco', x: 6, y: 2, look: 'mosaic', solid: false, oy: -8, baseY: -100, text: "A mosaic set into the wall, made of hundreds of broken bits of pot: a big laughing man with a beard, holding up a jug. It's signed in ochre: B." },
                { k: 'deco', x: 13, y: 7, look: 'kw_wheel', text: "A potter's wheel, still turning slowly. Somebody was here not long ago." },
                { k: 'pot', x: 7, y: 7 }, { k: 'pot', x: 12, y: 3 },
                { k: 'deco', x: 10, y: 3, look: 'sandwich', solid: false, text: "Half a cheese sandwich on a plate. There's a bite out of it the size of a very large man." },
            ],
        },
        /* ---------------- 12 Glaze Vats (before the boss) ---------------- */
        '2,0': {
            name: 'Glaze Vats',
            rows: [
                '####################',
                '#..................#',
                '#.vv............vv.#',
                '#.vv............vv.#',
                '#..................#',
                '...................#',
                '#..................#',
                '#.vv............vv.#',
                '#.vv............vv.#',
                '#..................#',
                '#########.##########',
            ],
            legend: {},
            ents: [
                { k: 'door', x: 0, y: 5, type: 'big', dir: 'v', id: 'kBoss' },
                { k: 'pot', x: 8, y: 3, drop: 'heart' }, { k: 'pot', x: 11, y: 3, drop: 'heart' }, { k: 'pot', x: 9, y: 8 },
                { k: 'sign', x: 5, y: 5, text: "THE KILN'S HEART. Something long and glazed sleeps in there. It follows people. Do not let it follow you." },
            ],
        },
        /* ---------------- 13 The Kiln's Heart (boss) ---------------- */
        '1,0': {
            name: "The Kiln's Heart",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'urn', x: 2, y: 2 }, { k: 'urn', x: 17, y: 2 }, { k: 'urn', x: 2, y: 8 }, { k: 'urn', x: 17, y: 8 },
                { k: 'kilnwyrm', x: 9, y: 2 },
                { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'boss' },
            ],
        },
    },
    legend: { 'v': { k: 'low', p: 'vat' }, 'L': { k: 'ledge', p: 'ledge' } },     /* (L: a step down through a floor's edge) */
    tick: a => KilnLogic.tick(a),
    afterKnot: function* () { yield* Kiln.afterKnot(); },
    /* (each room its own look, its dressing laid over the floor and its fires flickering: see the end of this file) */
    themeAt: (x, y) => kilnLookAt(x, y),
    drawGround: (a, cx, cy) => KilnLook.ground(a, cx, cy),
    onEnter: a => KilnLook.warm(a),
});

const KilnLogic = {
    tick(a) {
        for (const d of a.ents) if (d.kind === 'door' && d.id && d.open && (d.openedOnce || d.type !== 'gate')) Progress.set('kiln_' + d.id);
        for (const c of a.ents) if (c.kind === 'chest' && c.opened) Progress.set('kiln_' + c.id);
        /* the Crock Pen clears when its crocks are all broken at once */
        const room = Cam.room;
        if (room && room.key === '2,3' && !Progress.flag('kiln_crocksDone')) {
            const crocks = a.ents.filter(e => e.type === 'crock' && e.room === '2,3');
            if (crocks.length && crocks.some(c => c.alive) && G.player && room === a.roomAt(G.player.tx, G.player.ty)) {
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'crocks') s.shut = true;
            }
            if (crocks.length && crocks.every(c => !c.alive)) {
                Progress.set('kiln_crocksDone'); Sfx.play('appear');
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'crocks') s.shut = false;
            }
        }
    },
};

/* pulse charms: lit for a while each time they're struck */
const _charmStrike = Charm.prototype.strike;
Charm.prototype.strike = function (by) {
    if (this.mode === 'pulse') {
        if (this.cool > 0) return;
        this.cool = 10; this.swing = 30; this.pulse = this.time || 160; Sfx.play('charm');
        Fx.ring(this.x + 8, this.y - 6, CHARM_COL[this.col] || '#f0b060');
        Stats.count('charms');
        return;
    }
    return _charmStrike.call(this, by);
};
const _charmUpdate = Charm.prototype.update;
Charm.prototype.update = function () {
    if (this.mode === 'pulse') { if (this.pulse > 0) { this.pulse--; this.on = true; } else this.on = false; }
    _charmUpdate.call(this);
};
/* (how much of its ring is left, 0 to 1: a gate it holds open shows it, src/08_things.js Door.timerLeft) */
Charm.prototype.sigLeft = function () { return this.mode === 'pulse' ? (this.pulse > 0 ? this.pulse / (this.time || 160) : 0) : null; };

/* ---------- the clay creatures ---------- */
/* Crocks: walking pots. One knock shatters them; the pieces fly home the way the crock walked, and they hurt */
ENEMY.crock = { hp: 1, speed: 0.45, leash: 5, sight: 4, ai: 'wander', chase: true, chaseMul: 1.6, r: 6, tall: 12, yarn: '#c4623a', drop: 0.3 };
ENEMY_DRAW.crock = e => spr('crock_' + (Math.floor(e.anim / 8) % 2));
SPAWN.crock = (x, y, p) => {
    const e = new Enemy(x, y, Object.assign({ type: 'crock' }, p));
    e.die = function (quiet) {
        this.alive = false; this.yarnT = 0;
        Sfx.play('shatter'); Fx.burst(this.x, this.y - 6, '#c4623a');
        Stats.count('defeated:crock');
        if (G.rng() < 0.3) this.area.add(new Pickup(this.x - 8, this.y - 12, { what: G.rng() < 0.5 ? 'heart' : 'b1', vz: 2.5, life: 480 }));
        const path = this.trace.slice().reverse();
        path.unshift([this.tx, this.ty]);
        this.hidden = true;
        Shards.flight(this.area, path, { col: '#c4623a', hurt: true, owner: this, onDone: () => { this.reformT = 240; } });
    };
    e.updateYarn = function () { if (this.reformT > 0 && --this.reformT === 0 && !Progress.flag('kiln_crocksDone_' + this.room)) { if (this.room !== '2,3' || !Progress.flag('kiln_crocksDone')) { this.alive = true; this.hp = 1; this.x = this.hx * T + 8; this.y = this.hy * T + 10; this.trace = [[this.hx, this.hy]]; this.hidden = false; Fx.poof(this.x, this.y - 6); } } };
    const d0 = e.draw; e.draw = function (cx, cy) { if (!this.hidden) d0.call(this, cx, cy); };
    return e;
};

/* the Glazer: a clay knight who throws clay shot, and keeps its glazed shield turned towards Wren. The shot breaks; its
   pieces fly back to the Glazer's hand along the same line, and the Glazer stands on that line till they're home: the
   one thing that cracks it, if they come at it where its shield isn't. Met head on they clatter off the shield, so the
   fight asks one thing: be off to its side (or behind it) when its shot comes home, and it turns its shield to you and
   its side to its own shot. Standing still in front of it, the shot hits Wren and the pieces hit the shield. */
/* (its picture is drawn this far over its foot: the bottom of its feet, the picture's fifteenth row, on its shadow) */
const GLAZER_TOP = 13;
class Glazer extends Enemy {
    constructor(tx, ty) {
        super(tx, ty, { type: 'glazer', hp: 2 });     /* (two hits: a mini-boss shouldn't outstay its idea) */
        this.state = 'sleep'; this.st = 0; this.shotOut = false; this.shotDir = DOWN;
    }
    /* its shot out, its shield to Wren: still on the line it threw along, it keeps facing down it; off it (a step to
       either side), it turns to her, side on to the line; behind it, it turns round */
    face(p) {
        const d = this.shotDir, dx = p.x - this.x, dy = p.y - this.y, upDown = d === UP || d === DOWN;
        const along = dx * DX[d] + dy * DY[d], perp = upDown ? dx : dy;
        if (Math.abs(perp) <= 10) this.dir = along >= 0 ? d : OPP[d];
        else this.dir = upDown ? (perp < 0 ? LEFT : RIGHT) : (perp < 0 ? UP : DOWN);
    }
    hurtBox() { if (!this.alive) return null; return { x0: this.x - 8, x1: this.x + 8, y0: this.y - 22, y1: this.y + 4 }; }
    update() {
        if (!this.alive) { this.deadT = (this.deadT || 0) + 1; return; }
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room && Cam.room.key === '2,1' && !Cam.busy) {
                this.state = 'walk'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'glazer') s.shut = true;
                Music.play('boss');
                Script.run(function* () { yield* stepIn(); yield* say(null, 'A clay knight with a glazed shield clanks to its feet, rolling a ball of clay between its hands. Its shield turns to follow you.'); });
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        switch (this.state) {
            case 'walk': {
                /* line up with Wren */
                const dx = p.x - this.x, dy = p.y - this.y;
                const ax = Math.abs(dx), ay = Math.abs(dy);
                /* (its one dangerous move: come too close and it braces behind its shield, then barges two tiles on) */
                if (Math.hypot(dx, dy) < 30 && this.st > 30 && p.state === 'normal') { this.brace(dirOf(dx, dy)); break; }
                if ((ax < 8 || ay < 8) && this.st > 40) { this.dir = ax < 8 ? (dy < 0 ? UP : DOWN) : (dx < 0 ? LEFT : RIGHT); this.aim(); break; }
                /* (sidling to line up, its shield kept on her) */
                this.dir = ax > ay ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
                if (ax < ay) this.move(sign(dx) * 0.7, 0); else this.move(0, sign(dy) * 0.7);
                this.anim++;
                break;
            }
            case 'aim': if (this.st >= this.tellN) { this.throwShot(); this.setState('hold'); } break;
            /* (its shot out, it stands on its line and turns to keep its shield on her, till the pieces are home) */
            case 'hold': if (this.shotOut) this.face(p); if (this.st > 70 && (!this.shotOut || this.st > 240)) { this.shotOut = false; this.setState('walk'); } break;
            case 'hurt': if (this.st > 30) this.setState('walk'); break;
            case 'brace': if (this.st >= this.tellN) { this.setState('barge'); Sfx.play('boss'); } break;
            case 'barge':
                if (this.st > 8 || !this.move(DX[this.dir] * 4, DY[this.dir] * 4)) { G.shake = 6; Fx.dust(this.x, this.y); this.setState('hold'); }
                break;
        }
        if (p.state === 'normal' && Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 8) p.hurt(1, this.x, this.y);
    }
    setState(s) { this.state = s; this.st = 0; }
    /* the shot's tell: it rolls the clay in its hands, and the line it'll fly lights up (and the way it'll come home) */
    aim() {
        this.tellN = tellFor(2); this.setState('aim');
        const tiles = []; let x = this.tx, y = this.ty;
        for (let i = 0; i < 9; i++) { x += DX[this.dir]; y += DY[this.dir]; const k = this.area.kind(x, y); if ((k.solid && !k.low) || this.area.at(x, y)) break; tiles.push([x, y]); }
        Hazard.tiles(this, tiles, { tell: this.tellN, dmg: 0, live: 0 });
    }
    /* the barge: shield up, and the two tiles ahead of it lit; then it comes through them (a full heart) */
    brace(d) {
        this.dir = d; this.tellN = tellFor(2); this.setState('brace');
        const tiles = []; let x = this.tx, y = this.ty;
        for (let i = 0; i < 3; i++) { x += DX[d]; y += DY[d]; const k = this.area.kind(x, y); if (k.solid || this.area.at(x, y)) break; tiles.push([x, y]); }
        Hazard.tiles(this, tiles, { tell: this.tellN, dmg: 2, live: 9, from: [this.x, this.y] });
        Stats.count('boss:glazer:barge');
    }
    throwShot() {
        Sfx.play('throw');
        const path = [[this.tx, this.ty]];
        let x = this.tx, y = this.ty;
        for (let i = 0; i < 9; i++) {
            const nx = x + DX[this.dir], ny = y + DY[this.dir];
            const k = this.area.kind(nx, ny);
            if ((k.solid && !k.low) || this.area.at(nx, ny)) break;
            x = nx; y = ny; path.push([x, y]);
            const p = G.player;
            if (p.feetOn(x, y)) break;
        }
        this.shot = { path, i: 0, t: 0 }; this.shotDir = this.dir; this.shotOut = true;
        GlazerShots.list.push({ g: this, path, i: 0, t: 0 });
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0) return;
        if (!shard) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - GLAZER_TOP + 12); return; }   /* the stick bounces off its glaze */
        /* its own shot, met head on (its shield still facing down the line it threw along): off the shield */
        if (by && by.owner === this && this.dir === this.shotDir) {
            Sfx.play('hitthing'); Fx.ring(this.x + DX[this.dir] * 6, this.y - GLAZER_TOP + 10 + DY[this.dir] * 3, '#bff3ee');
            Stats.count('boss:glazer:shield');
            if (!Progress.flag('glazer_shield')) { Progress.set('glazer_shield'); UI.toast('The pieces come home and clatter off its glazed shield. It never takes its shield off you.', 200); }
            return;
        }
        this.hp--; this.flash = 30; Sfx.play('enemyhit'); G.hitstop = 6; this.setState('hurt'); calmBlows(this);
        Stats.count('boss:glazer:shards');
        if (this.hp <= 0) {
            this.alive = false; Sfx.play('shatter'); Fx.burst(this.x, this.y - GLAZER_TOP + 12, '#c4623a'); Fx.burst(this.x, this.y - GLAZER_TOP + 18, '#5ad1c5');
            Progress.set('kiln_glazer');
            for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'glazer') s.shut = false;
            Music.play('kilnhouse');
            /* (it stands there cracked, then crumbles, while it's told: drawDust) */
            const g = this;
            Script.run(function* () { yield 14; yield* say(null, 'The Glazer cracks from head to foot and crumbles away to dust. Its own shot, coming home, was the one thing its shield never faced.', { focus: [g.tx, g.ty, 28] }); });
        }
    }
    /* beaten: it stands a moment cracked from head to foot, then crumbles from the top down into a heap of clay dust with
       the pieces of its shield in it, and the heap is left lying there */
    drawDust(cx, cy) {
        const t = this.deadT || 0, im = spr('glazer'), x = Math.round(this.x - cx), y = Math.round(this.y - cy);
        const k = clamp((t - 50) / 150, 0, 1), w = Math.round(3 + k * 4);
        if (t >= 50) {
            Gfx.rect(x - w - 2, y - 1, w * 2 + 5, 3, PAL.ink); Gfx.rect(x - w - 1, y - 1, w * 2 + 3, 2, '#c4623a');
            if (k > 0.3) { Gfx.rect(x - w, y - 3, w * 2 + 1, 3, PAL.ink); Gfx.rect(x - w + 1, y - 2, w * 2 - 1, 2, '#d98a5a'); Gfx.rect(x - w + 2, y - 2, 2, 1, '#e8b08a'); }
            if (k > 0.6) { Gfx.rect(x - 4, y - 2, 2, 1, '#5ad1c5'); Gfx.rect(x + 3, y - 1, 2, 1, '#2e9a96'); Gfx.rect(x - 1, y - 4, 1, 1, '#bff3ee'); }
        }
        if (k >= 1 || !im) return;
        const cut = Math.round(k * (im.height - 4)), sh = t < 50 ? ((t >> 1) % 2) : 0, top = y - GLAZER_TOP;
        if (t < 50) this.drawShield(cx, cy, sh, 0);
        Gfx.sub(im, 0, cut, im.width, im.height - cut, x - 8 + sh, top + cut);
        /* the crack, head to foot */
        for (let j = Math.max(cut, 1); j <= GLAZER_TOP; j++) Gfx.rect(x - 1 + sh + ((j * 5) >> 2) % 3 - 1, top + j, 1, 1, PAL.ink);
        /* dust sifting down off the crumbling top */
        if (t >= 50) for (let i = 0; i < 5; i++) { const f = Math.floor(t * 0.6 + i * 7) % Math.max(2, GLAZER_TOP + 1 - cut); Gfx.rect(x - 7 + i * 3 + sh, top + cut + f, 1, 1, i % 2 ? '#e8c8a8' : '#c4623a'); }
    }
    /* its glazed shield, held on whichever side it faces (big, braced, before a barge) */
    drawShield(cx, cy, sh, low) {
        const big = this.state === 'brace', d = this.dir, w = big ? 10 : 8, h = big ? 11 : 10;
        const sx = Math.round(this.x - cx + DX[d] * (big ? 5 : 7)) + sh, sy = Math.round(this.y - cy) - GLAZER_TOP + (big ? 5 : 6) + low + (d === UP ? -3 : d === DOWN ? 2 : 0);
        Gfx.rect(sx - w / 2, sy, w, h, PAL.ink); Gfx.rect(sx - w / 2 + 1, sy + 1, w - 2, h - 2, '#5ad1c5'); Gfx.rect(sx - w / 2 + 1, sy + 1, w - 2, 1, '#bff3ee'); Gfx.rect(sx - w / 2 + 1, sy + h - 2, w - 2, 1, '#2e9a96');
        Gfx.rect(sx - 2, sy + h, 4, 1, PAL.ink); Gfx.rect(sx - 1, sy + 3, 2, h - 7, '#e8a070');
    }
    draw(cx, cy) {
        if (!this.alive) return this.drawDust(cx, cy);
        const im = spr(this.state === 'aim' ? 'glazer_aim' : 'glazer');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.alpha(0.25); Gfx.rect(this.x - cx - 7, this.y - cy + 1, 14, 3, PAL.ink); Gfx.alpha(1);
        /* bracing: crouched behind its shield, shivering, its "!" up */
        const sh = this.state === 'brace' ? ((this.st >> 1) % 2 ? 1 : -1) : 0, low = this.state === 'brace' ? 2 : 0;
        /* (its shield always towards her: behind it when it faces away up the room, in front of it otherwise) */
        if (this.dir === UP) this.drawShield(cx, cy, sh, low);
        Gfx.img(img, this.x - cx - 8 + sh, this.y - cy - GLAZER_TOP + low, this.dir === LEFT);
        if (this.dir !== UP) this.drawShield(cx, cy, sh, low);
        if (this.state === 'brace') Tells.bang(this.x - cx, this.y - cy - GLAZER_TOP - 14);
    }
}
SPAWN.glazer = (x, y) => Progress.flag('kiln_glazer') ? new Ent('none') : new Glazer(x, y);
/* the Glazer's clay shot: out along the line, it breaks, the pieces come back the same way */
const GlazerShots = {
    list: [],
    update(area) {
        for (const s of this.list) {
            if (s.g.area !== area) { s.done = true; continue; }
            if (++s.t < 3) continue;
            s.t = 0; s.i++;
            const p = G.player;
            if (s.i >= s.path.length) {
                s.done = true;
                const [lx, ly] = s.path[s.path.length - 1];
                /* (it knocks her straight on down its line: it never shoves her off it) */
                if (p.feetOn(lx, ly)) p.hurt(1, p.x - DX[s.g.shotDir] * 8, p.y - DY[s.g.shotDir] * 8);
                Sfx.play('shatter'); Fx.burst(lx * T + 8, ly * T + 8, '#c4623a');
                /* home along the same line, through the thrower if it's still there (its shield turned away from them, or not) */
                Shards.flight(area, s.path.slice().reverse(), { col: '#c4623a', hurt: true, pace: 4, delay: 8, owner: s.g, onDone: () => { s.g.shotOut = false; } });
            }
        }
        this.list = this.list.filter(s => !s.done);
    },
    draw(cx, cy) {
        for (const s of this.list) {
            const [x, y] = s.path[Math.min(s.i, s.path.length - 1)];
            Gfx.circle(x * T + 8 - cx, y * T + 2 - cy, 3, '#c4623a'); Gfx.rect(x * T + 6 - cx, y * T - cy, 2, 2, '#e8a070');
        }
    },
};

/* urns in the boss's chamber: pots that come home quickly */
SPAWN.urn = (x, y, p) => new Pot(x, y, Object.assign({ style: 'urn', patience: 60 }, p));

/* the Kilnwyrm: a long glazed serpent of pots. It follows exactly where Wren has walked. Its moves (TELL[2]): following,
   it rears up and darts along her footprints (a full heart: keep moving and it falls short); round the rim, it lobs a
   glob of hot glaze where she stands (its shadow first), which lies there a while, still hot; coiled in the pit, it
   rattles and sheds pieces of itself round the pit's edge (their shadows first), and each lies on its thread back to the
   pit till it shivers and flies home along it. Each beat it's knocked into, a heart rolls free. */
const KW = { near: 40, close: 28, dart: 52, dartSp: 3.2, cool: [0, 140, 120, 100], glob: 13, puddle: 150, shed: 4 };
class Kilnwyrm extends Enemy {
    constructor(tx, ty) {
        super(tx, ty, { type: 'kilnwyrm', hp: 3 });
        this.state = 'sleep'; this.st = 0; this.cool = 60; this.glowT = 0; this.rattleT = 0;
        this.segs = 7; this.trail = []; this.path = [];
        this.speed = 0.8;
        for (let i = 0; i < 80; i++) this.trail.push([this.x, this.y - i]);
    }
    hurtBox() { if (!this.alive) return null; return { x0: this.x - 9, x1: this.x + 9, y0: this.y - 16, y1: this.y + 4 }; }
    onTile(x, y) { return false; }
    update() {
        if (!this.alive) { this.deadT = (this.deadT || 0) + 1; return; }
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room && Cam.room.key === '1,0' && !Cam.busy) {
                this.state = 'follow'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                Music.play(bossSong('kiln'));
                Script.run(Kiln.bossIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        /* three beats: (1) it follows Wren's footprints, so shards carried home along them meet it; (2) it gives up on
           footprints and runs round the room's rim: the shards' way home has to cross the rim (and loop erasure will cut
           a careless loop out of it) just as it comes by; (3) it coils down in a pit at the Kiln's heart: only a way
           home that flies over the pit (a Hookline reel, carrying) reaches it */
        const phase = 4 - Math.max(1, Math.min(3, this.hp));
        if (this.state === 'hurt') { if (this.st > 50) { this.state = phase === 1 ? 'follow' : phase === 2 ? 'rim' : 'pit'; this.st = 0; if (phase > (this.told || 1)) this.beginPhase(phase); } return; }
        if (this.glowT > 0) this.glowT--; if (this.rattleT > 0) this.rattleT--;
        if (this.state === 'rim' || this.state === 'pit') return this.ring(phase, p);
        /* the path it follows: every step Wren takes (heard even while it rears) */
        const last = this.path[this.path.length - 1];
        if (p.state !== 'flight' && (!last || dist(last[0], last[1], p.x, p.y) > 3)) this.path.push([p.x, p.y]);
        if (this.cool > 0) this.cool--;
        /* close behind her: it rears, hissing, its mouth aglow, and then darts on along her footprints */
        if (this.state === 'rear') { if (++this.st2 >= this.tellN) { this.state = 'dart'; this.dartLeft = KW.dart; Sfx.play('throw'); } return; }
        /* (only from a little way behind her: from closer, there'd be no walking away from it) */
        const gap = dist(p.x, p.y, this.x, this.y);
        if (this.state === 'follow' && this.cool <= 0 && p.state === 'normal' && p.area === a && gap < KW.near && gap >= KW.close) {
            this.state = 'rear'; this.st2 = 0; this.tellN = tellFor(2); Sfx.play('warn'); Stats.count('boss:kiln:dart'); return;
        }
        const sp = this.state === 'dart' ? KW.dartSp : this.speed * (this.hp === 1 ? 1.5 : this.hp === 2 ? 1.2 : 1);
        let left = sp;
        while (left > 0 && this.path.length) {
            const [tx, ty] = this.path[0], d = dist(this.x, this.y, tx, ty);
            if (d <= left) { this.x = tx; this.y = ty; this.path.shift(); left -= d; }
            else { this.x += (tx - this.x) / d * left; this.y += (ty - this.y) / d * left; this.dir = dirOf(tx - this.x, ty - this.y); left = 0; }
            this.trail.unshift([this.x, this.y]);
        }
        if (this.state === 'dart' && ((this.dartLeft -= sp - left) <= 0 || !this.path.length)) { this.state = 'follow'; this.cool = KW.cool[1]; }
        if (this.trail.length > 200) this.trail.length = 200;
        if (p.state === 'normal' && dist(p.x, p.y, this.x, this.y) < 12) { p.hurt(this.state === 'dart' ? 2 : 1, this.x, this.y); }
    }
    /* the room it's in (the Kiln's Heart), in tiles */
    get room() { return this._room || (this._room = this.area.rooms.find(r => r.key === '1,0')); }
    beginPhase(n) {
        this.told = n; this.path = [];
        const r = this.room, a = this.area, p = G.player;
        if (n === 2) {
            this.state = 'rim'; this.s = this.rimNear();
            UI.toast("The Kilnwyrm stops sniffing for your footprints. It pours itself off round the edge of the room, the long way round, faster and faster.", 260);
        } else if (n === 3) {
            this.state = 'pit';
            /* the floor at the Kiln's heart cracks open (anything standing there hops back off it first) */
            for (let y = 3; y <= 7; y++) for (let x = 7; x <= 11; x++) a.setCell(r.x + x, r.y + y, 'o');
            if (p.tx >= r.x + 7 && p.tx <= r.x + 11 && p.ty >= r.y + 3 && p.ty <= r.y + 7) { p.x = (p.tx < r.x + 9 ? r.x + 6 : r.x + 12) * T + 8; Fx.dust(p.x, p.y); }
            for (const [x, y] of [[5, 5], [13, 5]]) a.add(SPAWN.eyelet(r.x + x, r.y + y, {}));
            G.shake = 14; Sfx.play('rumble');
            UI.toast("The floor at the heart of the Kiln cracks open into a glowing pit. The Kilnwyrm coils itself down into it, out of reach. Brass eyes stand at either side.", 300);
        }
    }
    /* (2) round the rim of the room, (3) round and round in the pit */
    rimPt(s) {
        const r = this.room, x0 = (r.x + 1) * T + 8, y0 = (r.y + 1) * T + 10, w = 17 * T, h = 8 * T, L = 2 * (w + h);
        s = ((s % L) + L) % L;
        if (s < w) return [x0 + s, y0]; s -= w;
        if (s < h) return [x0 + w, y0 + s]; s -= h;
        if (s < w) return [x0 + w - s, y0 + h]; s -= w;
        return [x0, y0 + h - s];
    }
    rimNear() { let best = 0, bd = 1e9; for (let s = 0; s < 800; s += 4) { const [x, y] = this.rimPt(s); const d = dist(x, y, this.x, this.y); if (d < bd) { bd = d; best = s; } } return best; }
    ring(phase, p) {
        const r = this.room;
        if (phase === 2) {
            this.s += 1.35;
            const [nx, ny] = this.rimPt(this.s);
            this.dir = dirOf(nx - this.x, ny - this.y); this.x = nx; this.y = ny;
            if (p.state === 'normal' && dist(p.x, p.y, this.x, this.y) < 12) p.hurt(1, this.x, this.y);
        } else {
            this.s = (this.s || 0) + 0.035;
            const cx = (r.x + 9) * T + 8, cy = (r.y + 5) * T + 10, nx = cx + Math.cos(this.s) * 26, ny = cy + Math.sin(this.s) * 22;
            this.dir = dirOf(nx - this.x, ny - this.y); this.x = nx; this.y = ny;
        }
        this.trail.unshift([this.x, this.y]); if (this.trail.length > 200) this.trail.length = 200;
        /* its blows, in turn: (2) a glob of glaze; (3) a shedding, then a glob */
        if (this.cool > 0) this.cool--;
        else if (p.state === 'normal' && p.area === this.area && this.area.roomAt(p.tx, p.ty) === r) {
            if (phase === 3 && !this.shedLast) this.shed(); else this.glob(p, phase);
            this.shedLast = phase === 3 && !this.shedLast;
        }
    }
    /* its head glows; then a glob of hot glaze flies up and comes down where she stood (its shadow there first), and lies
       there a while as a puddle, still hot */
    glob(p, phase) {
        const tell = tellFor(2, phase);
        this.glowT = tell; Sfx.play('warn');
        Hazard.drop(this, p.x, p.y, { r: KW.glob, dmg: 1, tell: tell + 18, live: KW.puddle, fx: 'clay', quiet: true, look: Kiln.drawGlob, lookLanded: Kiln.drawPuddle });
        this.cool = KW.cool[phase];
        Stats.count('boss:kiln:glob');
    }
    /* (3) it rattles its coils, and pieces of it fly up out of the pit and come down round its edge (their shadows first):
       two near Wren, two anywhere; each lies on its thread back to the pit, then shivers and flies home along it */
    shed() {
        const r = this.room, a = this.area, p = G.player, tell = tellFor(2, 3);
        const inPit = (x, y) => x >= r.x + 7 && x <= r.x + 11 && y >= r.y + 3 && y <= r.y + 7;
        const cand = [];
        for (let y = r.y + 1; y <= r.y + 9; y++) for (let x = r.x + 5; x <= r.x + 13; x++) { const k = a.kind(x, y); if (!inPit(x, y) && !k.solid && !k.pit && !a.at(x, y)) cand.push([x, y]); }
        cand.sort((m, n) => dist(m[0], m[1], p.tx, p.ty) - dist(n[0], n[1], p.tx, p.ty));
        const picks = [];
        const take = (from, n) => { for (let i = 0; i < n && from.length; i++) picks.push(from.splice(Math.floor(G.rng() * from.length), 1)[0]); };
        const near = cand.splice(0, 6); take(near, 2); take(cand, KW.shed - 2);
        const home = [r.x + 9, r.y + 5];
        for (const [x, y] of picks) Hazard.drop(this, x * T + 8, y * T + 10, {
            r: 10, dmg: 1, tell, fx: 'clay', quiet: true, look: Kiln.drawShard,
            onLand: () => this.area.add(new Flung(this, Flung.between(home, [x, y]), { lying: true, kin: true, wait: 64, tell: 26, back: 3, dmg: 1, col: THREAD.bram, look: Kiln.drawShard })),
        });
        this.rattleT = tell; Sfx.play('warn'); Sfx.play('rumble');
        this.cool = KW.cool[3] + 40;
        Stats.count('boss:kiln:shed');
    }
    /* shards break it wherever they meet it, head or coil */
    hitsTile(tx, ty) {
        if (!this.alive || this.flash > 0 || this.state === 'sleep') return false;
        const cx = tx * T + 8, cy = ty * T + 8;
        for (let i = 0; i <= this.segs; i++) { const sg = i ? this.trail[Math.min(this.trail.length - 1, i * 11)] : [this.x, this.y]; if (Math.abs(sg[0] - cx) < 11 && Math.abs(sg[1] - 6 - cy) < 11) return true; }
        return false;
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0) return;
        if (!shard) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 8); return; }  /* glazed: only its own kind breaks it */
        this.hp--; this.flash = 40; Sfx.play('enemyhit'); Sfx.play('shatter'); G.hitstop = 8; G.shake = 8;
        this.segs = Math.max(2, this.segs - 2); this.state = 'hurt'; this.st = 0; this.glowT = this.rattleT = 0; this.cool = 90;
        calmBlows(this);
        Stats.count('boss:kiln:shards');
        /* it reels back along its own trail */
        this.path = [];
        if (this.hp <= 0) this.defeat();
        else { const p = G.player; bossHeart(this.area, p.x + 20, p.y); }
    }
    defeat() {
        this.alive = false;
        /* (the pit closes over: the floor the Knot's hoop will stand on) */
        if (this.told === 3) { const r = this.room; for (let y = 3; y <= 7; y++) for (let x = 7; x <= 11; x++) this.area.setCell(r.x + x, r.y + y, '.'); }
        Sfx.play('unravel'); for (let i = 0; i < this.segs; i++) { const s = this.trail[Math.min(this.trail.length - 1, i * 10)]; Fx.burst(s[0], s[1] - 6, '#c4623a'); }
        this.comeApart();
        Progress.set('kiln_boss');
        Script.run(Kiln.bossDown(this));
    }
    /* it comes apart pot by pot (head, coils, tail), and every piece rattles across the floor in turn to a crack at the foot
       of the west wall, and down it (staged under the words: Kiln.bossDown) */
    comeApart() {
        const a = this.area, r = this.room, kx = (r.x + 1) * T + 1, ky = (r.y + 5) * T + 10, bits = [];
        const pots = [[this.x, this.y, spr('wyrm_head_' + DIR_NAME[this.dir === LEFT ? RIGHT : this.dir]), this.dir === LEFT]];
        for (let i = 1; i <= this.segs; i++) { const s = this.trail[Math.min(this.trail.length - 1, i * 11)]; pots.push([s[0], s[1], spr(i === this.segs ? 'wyrm_tail' : 'wyrm_seg'), false]); }
        pots.forEach(([x, y, im, flip], i) => {
            const to = [kx + 6, ky - 6 + (i % 3) * 5], len = Math.hypot(to[0] - x, to[1] - y);
            bits.push({ from: [x, y], to, delay: 10 + i * 10, speed: Math.max(0.6, len / 150), rattle: true, end: 'fade', fade: 12, look: (sx, sy) => Gfx.img(im, sx - 8, sy - 14, flip) });
        });
        this.crack = a.add(new Remains([{ from: [kx, ky], to: [kx, ky], end: 'lie', look: Kiln.drawCrack }], { x: kx, y: ky, floor: true }));
        this.pieces = a.add(new Remains(bits, { x: this.x, y: this.y }));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const fl = this.flash > 0 && (this.flash >> 1) % 2;
        /* rattling its coils (about to shed): every piece of it shivers */
        const rat = this.rattleT > 0 ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        for (let i = this.segs; i >= 1; i--) {
            const s = this.trail[Math.min(this.trail.length - 1, i * 11)];
            const im = spr(i === this.segs ? 'wyrm_tail' : 'wyrm_seg');
            Gfx.alpha(0.22); Gfx.rect(s[0] - cx - 6, s[1] - cy, 12, 3, PAL.ink); Gfx.alpha(1);
            Gfx.img(fl ? tinted(im, '#ffffff') : im, s[0] - cx - 8 + (i % 2 ? rat : -rat), s[1] - cy - 14);
        }
        /* rearing: its head up off the floor, hissing, and its mouth aglow; about to spit glaze: its mouth aglow */
        const rear = this.state === 'rear', lift = rear ? Math.round(5 * Math.min(1, this.st2 / 10)) : 0;
        const hd = spr('wyrm_head_' + DIR_NAME[this.dir === LEFT ? RIGHT : this.dir]);
        Gfx.img(fl ? tinted(hd, '#ffffff') : hd, this.x - cx - 8 + (rear ? ((this.t >> 1) % 2 ? 1 : -1) : 0), this.y - cy - 16 - lift, this.dir === LEFT);
        if (rear || this.glowT > 0) {
            const k = rear ? this.st2 / (this.tellN || 30) : 1 - this.glowT / (tellFor(2, 2) || 30);
            Tells.glow(this.x - cx + DX[this.dir] * 5, this.y - cy - 9 - lift + DY[this.dir] * 2, Math.min(1, k), '#f39a3c');
        }
        if (rear) Tells.bang(this.x - cx, this.y - cy - 30 - lift);
    }
}
SPAWN.kilnwyrm = (x, y) => Progress.flag('kiln_boss') ? new Ent('none') : new Kilnwyrm(x, y);

const Kiln = {
    /* a glob of hot glaze, coming down; the puddle it leaves (fading as it cools); a piece of the wyrm, shed */
    drawGlob(x, y) { Gfx.circle(x, y - 3, 3, PAL.ink); Gfx.circle(x, y - 3, 2, '#f39a3c'); Gfx.rect(x - 1, y - 4, 1, 1, '#fff0b0'); },
    drawPuddle(x, y, h) {
        const left = h.tell + h.live - h.t, k = Math.min(1, left / 40);
        Gfx.alpha(0.4 + 0.5 * k); Tells.ellipse(x, y, h.r, '#c4623a'); Tells.ellipse(x, y - 1, h.r - 3, '#f39a3c'); Gfx.alpha(1);
        if ((G.t >> 3) % 3 === 0) Gfx.rect(x - 3 + ((G.t >> 4) % 5), y - 3, 2, 1, '#fff0b0');
    },
    drawShard(x, y, f) {
        const sp = f && f.state && f.state !== 'lie' && (G.t >> 2) % 2;
        Gfx.rect(x - 3, y - 3, 7, 5, PAL.ink); Gfx.rect(x - 2, y - 2, 5, 3, sp ? '#e8a070' : '#c4623a'); Gfx.rect(x - 2, y - 2, 2, 1, '#5ad1c5');
    },
    *bossIntro(w) {
        yield 20;
        yield* say(null, 'In the heat at the heart of the Kiln, something long and glazed uncoils. Its head turns, sniffs the floor where you just walked, and starts to follow your footprints.');
        yield* say(null, 'Its glaze is as hard as the Glazer\'s shield. Nothing you swing will crack it.');
    },
    /* the crack at the foot of the wall the Kilnwyrm's pieces go down (x, y: its foot on the screen) */
    drawCrack(x, y) {
        for (let j = 0; j < 24; j++) { const o = ((j * 5) >> 3) % 2 + (j > 9 && j < 17 ? 1 : 0); Gfx.rect(x + o, y - 18 + j, 2, 1, '#1a1018'); }
        Gfx.rect(x + 2, y - 10, 2, 1, '#1a1018'); Gfx.rect(x + 3, y - 4, 1, 2, '#3a1810'); Gfx.rect(x, y - 16, 1, 1, '#d98a5a');
    },
    *bossDown(w) {
        const a = w.area;
        Music.play('silence');
        yield 14;
        yield* say(null, 'The Kilnwyrm comes apart pot by pot, and every last piece goes rattling across the floor and down a crack by the wall, back to wherever it belongs.', { focus: [w.pieces, w.crack] });
        for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = false;
        const br = a.rooms.find(r => r.key === '1,0');
        a.add(new Hoop(br.x + 9, br.y + 4));
        a.add(new Pickup((br.x + 9) * T, (br.y + 7) * T, { what: 'heartstitch', id: 'kilnHeart' }));
        Sfx.play('appear');
        Music.play('kilnhouse');
    },
    *afterKnot() {
        Progress.set('d2');
        Progress.set('tagStopped');
        Progress.setGoal('Back to Hollowell. Then east: the broken bridge in Meadowfold, and Millwater beyond it. Your Hookline should get you over.');
        /* (the door first, then the words about it, on it: down in the chamber's south-east corner) */
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 17, r.y + 9, { to: 'hollow', tx2: KILN_OUT.x, ty2: KILN_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 17, r.y + 9, { im: ART.exitlight, solid: [] }));
        /* (the doorway's whole picture: the floor's light and the frame in the wall under it) */
        yield* say(null, 'A door opens in the corner of the chamber, onto a ledge high on the mesa and a long view over Kilnridge.', { focus: [r.x + 17, r.y + 10, 32] });
    },
};
SIGNATURE_TEXT.kiln = "Pressed into the clay floor, as if with a big thumb: an ochre B, and a little jug. Someone signed this House like you'd sign the bottom of a pot.";

/* a wall that's only clay, cracked: something thrown hard would go through */
SPAWN.crackwall = (x, y, p) => { const s = new Seal(x, y, p); s.sprite = () => spr('crackwall'); s.onStruck = () => UI.toast('The wall sounds hollow here.'); return s; };
SPAWN.mural = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.mural, solid: [], oy: -10 });
    pr.baseY = -100;
    pr.interact = () => { Script.run(function* () { yield* say(null, p.text); }); return true; };
    pr.talkBox = (pl, f) => f.ty === ty + 1 || f.ty === ty;
    return pr;
};

function initKilnArt() {
    defSprite('crock_0', ['................', '................', '.....kkkkkk.....', '....kyoooooOk...', '....kkkkkkkkk...', '.....koowooOk...', '....kooookoooOk.', '...kooooooooooOk',
        '...koooooooooOOk', '...kOooooooooOOk', '....kOOoooooOOk.', '.....kOOOOOOOk..', '.....kbk..kbk...', '.....kk....kk...', '................', '................'], { o: '#d98f3a', O: '#a8602a', y: '#f2bc78', w: '#ffffff', b: '#6b4128' });
    defSprite('crock_1', ['................', '................', '.....kkkkkk.....', '....kyoooooOk...', '....kkkkkkkkk...', '.....koowooOk...', '....kooookoooOk.', '...kooooooooooOk',
        '...koooooooooOOk', '...kOooooooooOOk', '....kOOoooooOOk.', '.....kOOOOOOOk..', '....kbk....kbk..', '....kk......kk..', '................', '................'], { o: '#d98f3a', O: '#a8602a', y: '#f2bc78', w: '#ffffff', b: '#6b4128' });
    const gz = ['......kkkk......', '.....kqqqqk.....', '....kqwkwkqk....', '....kqqqqqqk....', '.....kkqqkk.....', '...kkooooookk...', '..koookkkkooook.', '..kooqqqqqqoook.',
        '..kooqQQQQqoook.', '..kooqqqqqqoook.', '...kooookoooo k.', '....kooooooook..', '....koookkoook..', '....kbbk..kbbk..', '....kkkk..kkkk..', '................', '................', '................', '................', '................', '................', '................'];
    defSprite('glazer', gz.map(r => r.replace(' ', 'k')), { q: '#5ad1c5', Q: '#2e9a96', o: '#c4623a', w: '#ffffff', b: '#5e261c' });
    defSprite('glazer_aim', gz.map((r, i) => i === 1 ? '..kk.kqqqqk.....' : i === 2 ? '.kook.qwkwkqk...' : r.replace(' ', 'k')).map(r => r.padEnd(16, '.').slice(0, 16)), { q: '#5ad1c5', Q: '#2e9a96', o: '#c4623a', w: '#ffffff', b: '#5e261c' });
    defSym('urn', ['........', '......kk', '.....kyo', '.....kkk', '....kooo', '...kyooo', '..kyoooo', '..kooooo', '..koOooo', '..kooOoo', '..kOoooo', '...kOooo', '....kOOO', '.....kkk', '........', '........'], { o: '#c4623a', O: '#93432c', y: '#e8a070' }, { y: 'o' });
    defSym('wyrm_seg', ['........', '........', '........', '....kkkk', '...kyyoo', '..kyoooo', '..kooOOO', '..kqqqqq', '..kQQQQQ', '..kooooo', '..kOoooo', '...kOOoo', '....kkkk', '........', '........', '........'], { o: '#c4623a', O: '#93432c', y: '#e8a070', q: '#5ad1c5', Q: '#2e9a96' });
    defSym('wyrm_tail', ['........', '........', '........', '........', '........', '.....kkk', '....kyoo', '....kooo', '....kqqq', '....kOoo', '.....kkk', '........', '........', '........', '........', '........'], { o: '#c4623a', O: '#93432c', y: '#e8a070', q: '#5ad1c5' });
    defSprite('wyrm_head_down', ['................', '....kkkkkkkk....', '...kqqqqqqqqk...', '..kqQqqqqqqQqk..', '..kqqwkqqwkqqk..', '..kqqkkqqkkqqk..', '..kqqqqqqqqqqk..', '..kooooooooook..',
        '..koOooooooOok..', '...kooRRRRook...', '...kooRwwRook...', '....kooooook....', '.....kkkkkk.....', '................', '................', '................'], { q: '#5ad1c5', Q: '#2e9a96', o: '#c4623a', O: '#93432c', w: '#ffffff', R: '#6a1a1a' });
    defSprite('wyrm_head_up', ['................', '....kkkkkkkk....', '...kqqqqqqqqk...', '..kqQqqqqqqQqk..', '..kqqqqqqqqqqk..', '..kqqqqqqqqqqk..', '..kqqQqqqqQqqk..', '..kooooooooook..',
        '..koOooooooOok..', '...kooooooook...', '...kooooooook...', '....kooooook....', '.....kkkkkk.....', '................', '................', '................'], { q: '#5ad1c5', Q: '#2e9a96', o: '#c4623a', O: '#93432c' });
    defSprite('wyrm_head_right', ['................', '................', '....kkkkkkk.....', '...kqqqqqqqkk...', '..kqqqqqwkqqqk..', '..kqQqqqkkqqqqk.', '..kqqqqqqqqqqqk.', '..kooooooooRRRk.',
        '..koOooooooRwwk.', '..koooooooRRRk..', '...kooooooook...', '....kkkkkkkk....', '................', '................', '................', '................'], { q: '#5ad1c5', Q: '#2e9a96', o: '#c4623a', O: '#93432c', w: '#ffffff', R: '#6a1a1a' });
    defSprite('crackwall', ['kkkkkkkkkkkkkkkk', 'kooooOooooooOook', 'koOoooooOooooook', 'kooooooko0oOoook', 'kOooooko.koooook', 'kooooko...kooOok', 'kooook.....koook', 'koOook......kook',
        'koook.......kook', 'koooko.....koOok', 'kOoooko...koooook', 'koooooko.koooook', 'kooOoooookoooOok', 'kooooooooooooook', 'kOOOOOOOOOOOOOOk', 'kkkkkkkkkkkkkkkk'].map(r => r.slice(0, 16).replace(/0/g, 'o')), { o: '#c4623a', O: '#93432c' });
    ART.kilnbig = paintSprite(32, 38, x => {
        for (let j = 8; j < 38; j++) { const w = Math.round(10 + Math.min(j - 8, 12) * 0.5); for (let i = 16 - w; i < 16 + w; i++) { x.fillStyle = (i - (16 - w)) < 3 ? '#e08a5e' : (16 + w - i) < 4 ? '#93432c' : (j + i) % 7 === 0 ? '#a8502e' : '#c4623a'; x.fillRect(i, j, 1, 1); } }
        x.fillStyle = '#2a1410'; x.fillRect(10, 24, 12, 12); x.fillStyle = '#f39a3c'; x.fillRect(12, 29, 8, 6); x.fillStyle = '#f7d64a'; x.fillRect(14, 30, 4, 4);
        x.fillStyle = '#6a2e22'; x.fillRect(13, 0, 6, 9); x.fillStyle = '#8a7a6a'; x.fillRect(12, 0, 8, 2);
    });
    ART.mural = paintSprite(48, 22, x => {
        const P = (c, a, b) => { x.fillStyle = c; x.fillRect(a, b, 1, 1); };
        /* a slab of smoothed clay, a darker rim, then the three painted in the charms' colours, outlined like glaze */
        x.fillStyle = '#e8b884'; x.fillRect(0, 0, 48, 22); x.fillStyle = '#a86e3e'; x.fillRect(0, 0, 48, 1); x.fillRect(0, 21, 48, 1);
        x.fillStyle = '#f2cca0'; x.fillRect(0, 1, 48, 1); x.fillStyle = '#d29a68'; x.fillRect(0, 20, 48, 1);
        /* the sun: a round gold face, lit from the top left, and eight rays */
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
            const d = Math.hypot(i, j);
            if (d <= 3.7) P(i + j < -3 ? '#fbe88a' : i + j > 2 ? '#e8b04a' : '#f7d64a', 10 + i, 11 + j);
            else if (d <= 4.6) P('#8a4a2a', 10 + i, 11 + j);
        }
        for (const [a, b] of [[0, -7], [0, 6], [-7, 0], [6, 0]]) { x.fillStyle = '#f39a3c'; x.fillRect(10 + a, 11 + b, a ? 2 : 1, a ? 1 : 2); }
        for (const [a, b] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) P('#f39a3c', 10 + a, 11 + b);
        /* the moon: a crescent, horns to the right */
        stampPx(x, ['...kkkk...', '..kwbbk...', '.kwbbk....', 'kwbbk.....', 'kbbbk.....', 'kbbBk.....', 'kbbBBk....', '.kbbBBkkk.', '..kBBBBBk.', '...kkkkk..'],
            { k: '#8a4a2a', w: '#d8f0fc', b: '#9fd4f0', B: '#6aa8d0' }, 20, 6);
        /* the star: five points */
        stampPx(x, ['......k......', '.....kpk.....', '.....kwk.....', '....kpwpk....', 'kkkkkpwppkkkk', 'kwwwpppppppPk', '.kppppppppPk.', '..kpppppPPk..', '..kppppppPk..', '.kppPkkkpPPk.', '.kpPk...kPPk.', 'kPPk.....kPPk', 'kkk.......kkk'],
            { k: '#8a4a2a', w: '#fde0ec', p: '#f59ac0', P: '#d0608e' }, 32, 4);
    });
    ART.rack = paintSprite(16, 24, x => { x.fillStyle = '#7a4e32'; x.fillRect(1, 0, 2, 24); x.fillRect(13, 0, 2, 24); for (let j = 4; j < 24; j += 7) { x.fillStyle = '#9a6438'; x.fillRect(1, j, 14, 2); x.fillStyle = '#d98f3a'; x.fillRect(3, j - 4, 4, 4); x.fillRect(9, j - 3, 3, 3); } });
    ART.mosaic = paintSprite(40, 24, x => {
        for (let j = 0; j < 24; j += 3) for (let i = 0; i < 40; i += 3) { x.fillStyle = ['#c4623a', '#d98f3a', '#e8b884', '#93432c', '#f2bc78'][Math.floor(hash2(i, j, 4) * 5)]; x.fillRect(i, j, 2, 2); }
        x.fillStyle = '#5a3a26'; x.fillRect(15, 4, 10, 10); x.fillStyle = '#e0a080'; x.fillRect(16, 6, 8, 6); x.fillStyle = '#2a1a14'; x.fillRect(16, 11, 8, 4); x.fillStyle = '#ffffff'; x.fillRect(18, 12, 4, 1);
        x.fillStyle = '#5ad1c5'; x.fillRect(26, 6, 5, 8);
    });
    ART.wheel = paintSprite(16, 16, x => { x.fillStyle = '#7a4e32'; x.fillRect(6, 8, 4, 8); x.fillStyle = '#9a6438'; x.fillRect(1, 6, 14, 4); x.fillStyle = '#c4623a'; x.fillRect(4, 2, 8, 5); x.fillStyle = '#e8a070'; x.fillRect(5, 2, 3, 2); });
    ART.sandwich = paintSprite(12, 8, x => { x.fillStyle = '#e8ecef'; x.fillRect(0, 4, 12, 3); x.fillStyle = '#f0d080'; x.fillRect(2, 2, 6, 3); x.fillStyle = '#e8b04a'; x.fillRect(2, 3, 6, 1); x.fillStyle = '#e8ecef'; x.fillRect(6, 2, 2, 1); }, false);
    ART.monogram_kiln = paintSprite(16, 10, x => { x.fillStyle = '#e0913a'; x.fillRect(3, 1, 2, 8); x.fillRect(5, 1, 3, 2); x.fillRect(5, 4, 3, 1); x.fillRect(5, 7, 3, 2); x.fillRect(8, 2, 1, 2); x.fillRect(8, 5, 1, 2); x.fillStyle = '#a8602a'; x.fillRect(11, 3, 3, 5); x.fillRect(12, 2, 1, 1); }, false);
    /* the vats: low clay basins of glaze */
    FLOORS.kilnhouse.vat = (x) => { fill(x, '#93432c'); fill(x, '#5ad1c5', 2, 2, 12, 11); fill(x, '#8fe6dc', 3, 3, 4, 2); fill(x, '#5e261c', 0, 14, 16, 2); };
}
CONTENT_INIT.push(initKilnArt);
ITEM_LINES.hook = () => "You found the {red}Hookline{/}! [tool] to throw the hook. It catches on brass rings and on any stitched cross with nothing on it, and reels you over; light things it reels to you.";

/* ======================= the look of the place (all paint: nothing here is solid, moves anything or sets a flag) =======================
   A colour script for the Kiln: fired brick, darkened with soot the nearer the fires; clay-dusted flagstones underfoot,
   brick paving round the hearths; the orange of the fires; turquoise glaze in the glazing rooms. The work rooms keep the
   flags and the brick; the glazing rooms are glazed tile to the dado over a chequer of glazed floor tiles; the furnace
   hall and the Kiln's heart are blackened with soot; Bram's potting shed is whitewashed over weathered boards. Floors are
   a flag or a tile to a tile, the dust only in the joints, each picked to keep the ochre threads, their empty marks and
   rings of stitches plain (the flags cool and a little dark, the paving darker and duller than the walls). Then a few great
   things that say what each room is: bottle kilns (in place of the old ones), the great kiln and a long dragon kiln built
   into the rooms' own walls, clay bins, woodpiles, racks of greenware, glaze stores, kiln mouths (KILN_DRESS, laid over
   the floor like the Tidyhouse's: RoomLook), with their fires flickering (KILN_GLOW). */
const KILN_ROOM_LOOK = { '1,3': 'work', '0,3': 'work', '1,2': 'work', '2,3': 'work', '2,2': 'work', '0,2': 'work', '2,1': 'glaze', '3,1': 'work',
    '3,2': 'work', '1,1': 'heart', '0,1': 'work', '0,0': 'shed', '2,0': 'glaze', '1,0': 'core' };
/* (the glazed floors' chequer: the odd tiles of the floor are the look's second half; walls always the first, as the Tidyhouse's) */
const kilnLookAt = (x, y) => {
    const n = KILN_ROOM_LOOK[Math.floor(x / 20) + ',' + Math.floor(y / 11)] || 'work', row = AREAS.kiln.rows[y];
    return 'kiln_' + n + (KILN_LOOKS[n].alt && (x + y) & 1 && row && row[x] !== '#' ? '_b' : '');
};
const KilnFloor = {
    /* a flagstone a tile: lit along its top and left, in shade along its bottom and right, pale clay dust in its joints
       and a scuff at one corner of some */
    flag: c => (x, th, v) => {
        fill(x, c[0]);
        fill(x, c[1], 0, 0, 15, 1); fill(x, c[1], 0, 1, 1, 14); fill(x, c[2], 0, 15, 16, 1); fill(x, c[2], 15, 0, 1, 15);
        px(x, 2 + v * 3, 15, c[3]); px(x, 3 + v * 3, 15, c[3]); px(x, 15, 4 + v * 2, c[3]);
        if (v === 1) { px(x, 1, 1, c[4]); px(x, 2, 1, c[4]); px(x, 1, 2, c[4]); }
        if (v === 3) { px(x, 13, 13, c[4]); px(x, 12, 14, c[4]); px(x, 14, 12, c[4]); }
    },
    /* brick paving, for the hearths and aprons and the old passages: laid flat in a basket weave (the walls are in a
       running bond, so the floor never reads as a wall), duller than the walls, the mortar dark */
    brick: (x, th, v) => {
        fill(x, '#683c36');
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
            const X = i * 8, Y = j * 8, along = (i + j) % 2 === 0;
            for (let k = 0; k < 2; k++) {
                const t = ['#844c46', '#7e4842', '#8a524a'][(i + j * 2 + k + v) % 3];
                if (along) { fill(x, t, X, Y + k * 4, 7, 3); fill(x, shade(t, 0.12), X, Y + k * 4, 7, 1); }
                else { fill(x, t, X + k * 4, Y, 3, 7); fill(x, shade(t, 0.12), X + k * 4, Y, 3, 1); }
            }
        }
    },
    /* a glazed floor tile: the glaze's shine at its corner, a drip of a darker glaze on some */
    glazed: c => (x, th, v) => {
        fill(x, c[0]); fill(x, c[1], 0, 0, 15, 1); fill(x, c[1], 0, 1, 1, 14); fill(x, c[2], 0, 15, 16, 1); fill(x, c[2], 15, 0, 1, 15);
        px(x, 2, 2, '#ffffff'); px(x, 3, 2, c[1]); px(x, 2, 3, c[1]);
    },
};
const KILN_LOOKS = {
    work: { floor: KilnFloor.flag(['#a29888', '#b6ac9c', '#7c7264', '#cfc6b4', '#8e8476']), brick: ['#c4623a', '#93432c', '#e08a5e', '#5e261c'], soot: 0.35, firebox: true },
    heart: { floor: KilnFloor.flag(['#928676', '#a69a8a', '#6e6458', '#bcb2a0', '#82766a']), brick: ['#a8523a', '#7a3424', '#c46a48', '#4a1c14'], soot: 0.6, firebox: true },
    glaze: { floor: KilnFloor.glazed(['#efe6d2', '#fbf6ea', '#c8bca4']), alt: KilnFloor.glazed(['#b2e0d8', '#cfeee8', '#7cb4ac']), brick: ['#c4623a', '#93432c', '#e08a5e', '#5e261c'], soot: 0.25, dado: true },
    shed: { floor: TidyFloor.boards({ dir: 'h', tone: ['#968676', '#908070', '#9c8c7c'], hi: '#aa9a88', seam: '#6a5c50', nail: '#4e4238' }), brick: ['#ece2cc', '#d8ccb4', '#f6eedf', '#b8ab92'], soot: 0.12 },
};
/* the Kiln's Heart itself: the heart's look, and when its floor cracks open, the pit glows (the dark starry pit the
   Houses share read as the Slumberhouse's night sky) */
KILN_LOOKS.core = KILN_LOOKS.heart;
const KilnWall = {
    face(x, L, v) {
        Paint.bricks(x, L.brick, v);
        /* soot: the top of the wall blackened by the firings */
        x.globalAlpha = L.soot; fill(x, '#2a1410', 0, 0, 16, 2); x.globalAlpha = L.soot * 0.6; fill(x, '#2a1410', 0, 2, 16, 2); x.globalAlpha = L.soot * 0.3; fill(x, '#2a1410', 0, 4, 16, 3); x.globalAlpha = 1;
        if (L.dado) {
            /* glazed tiles to the dado: turquoise, each with its shine, a dark line under */
            fill(x, '#2e7e78', 0, 8, 16, 7);
            for (let j = 8; j < 15; j += 4) for (let i = (j === 12 ? 2 : 0); i < 16; i += 4) { fill(x, '#5ad1c5', i, j, 3, 3); px(x, i, j, '#bff3ee'); }
            fill(x, '#e0913a', 0, 8, 16, 1);
        }
        fill(x, '#3a1810', 0, 15, 16, 1);
        if (v === 2 && L.firebox) {
            /* a little firebox let into the wall: a sooty arch, the embers in it */
            x.globalAlpha = 0.35; fill(x, '#2a1410', 4, 2, 8, 6); x.globalAlpha = 1;
            fill(x, '#3a1810', 4, 8, 8, 7); fill(x, '#3a1810', 5, 7, 6, 1); fill(x, '#1a0c08', 5, 8, 6, 6);
            fill(x, '#c0302e', 5, 12, 6, 2); fill(x, '#f39a3c', 6, 12, 4, 1); px(x, 7, 13, '#f7d64a'); px(x, 8, 12, '#f7d64a');
        }
    },
};
for (const [n, L] of Object.entries(KILN_LOOKS)) for (const half of L.alt ? ['', '_b'] : ['']) {
    const tn = 'kiln_' + n + half, f = half ? L.alt : L.floor;
    THEMES[tn] = THEMES.kilnhouse;
    FLOORS[tn] = { floor: f, floor2: KilnFloor.brick, floor3: FLOORS.kilnhouse.floor3, vat: (x, th, v) => FLOORS.kilnhouse.vat(x, th, v) };
    WALLS[tn] = { edge: '#3a1810', top: (x) => { fill(x, '#6a2e1e'); fill(x, '#7a3a26', 0, 0, 16, 1); }, face: (x, th, v) => KilnWall.face(x, L, v) };
}
THEMES.kiln_core = Object.assign({}, THEMES.kilnhouse, {
    /* embers far down, brightest in the cracks; the rim dark rock, lit from below */
    pit: (x, th, v, lip) => {
        fill(x, '#3e1008'); speckle(x, ['#5e1a0c', '#320c06'], 81 + v, 0.38);
        speckle(x, ['#98301a'], 91 + v, 0.11); speckle(x, ['#e0702a'], 101 + v, 0.035); speckle(x, ['#ffd060'], 111 + v, 0.01);
        for (let i = 0; i < 3; i++) { const cx = Math.floor(hash2(v, i, 7) * 13) + 1, cy = Math.floor(hash2(i, v, 8) * 11) + 3; px(x, cx, cy, '#f39a3c'); px(x, cx + 1, cy, '#ffd060'); px(x, cx + 1, cy + 1, '#f39a3c'); }
        if (lip) { fill(x, '#2a1410', 0, 0, 16, 3); fill(x, '#6a2412', 0, 3, 16, 1); fill(x, '#a8401e', 0, 4, 16, 1); }
    },
});

/* each room's own pieces, in room pixels (as TIDY_DRESS) */
const KILN_DRESS = {
    /* the way in: the Kiln's wares on shelves either side of the sealed door */
    '1,3': { wall: [['kw_potshelf', 72, 0], ['kw_potshelf', 168, 0, true]] },
    /* the long way round: a woodpile for the kiln (the bottle kiln stands where the old one stood), soot at its mouth */
    '0,3': { wall: [['kw_logs', 200, 0]], paint: (x, R) => KilnLook.soot(x, R, [[9, 6]]) },
    /* the charm hall: shelves of greenware drying on the four brick benches, the kiln on its apron */
    '1,2': { wall: [['kw_dryshelf', 64, 48], ['kw_dryshelf', 208, 48], ['kw_dryshelf', 64, 112], ['kw_dryshelf', 208, 112]], paint: (x, R) => KilnLook.soot(x, R, [[9, 4]]) },
    /* the crock pen: clay bins and woodpiles for pillars, the broken crocks swept into a heap */
    '2,3': { wall: [['kw_claybin', 48, 48], ['kw_claybin', 240, 48], ['kw_woodstack', 48, 112], ['kw_woodstack', 240, 112], ['kw_shards', 142, 2]], paint: (x, R) => KilnLook.soot(x, R, [[9, 5]]) },
    /* the room round the great kiln, built into its middle */
    '2,2': { wall: [['kw_greatkiln', 48, 48]] },
    /* doubling back: round a long dragon kiln */
    '0,2': { wall: [['kw_dragonkiln', 32, 96]] },
    /* the glazing room: four glaze stores at its corners */
    '2,1': { wall: [['kw_glazeshelf', 32, 32], ['kw_glazeshelf', 256, 32], ['kw_glazeshelf', 32, 112], ['kw_glazeshelf', 256, 112]] },
    /* the gallery of chasms: plates hung on its wall */
    '3,1': { wall: [['kw_plates', 116, 1]] },
    /* the bridge of cords: coils of rope and a pulley on their pegs */
    '3,2': { wall: [['kw_ropes', 194, 0]] },
    /* the furnace hall: the furnace's iron doors in the wall (the furnace stands where the old kiln stood) */
    '1,1': { wall: [['kw_furnacedoor', 128, 0]], paint: (x, R) => KilnLook.soot(x, R, [[14, 4]]) },
    /* bram's potting shed: his pots on a shelf */
    '0,0': { wall: [['kw_brampots', 166, 16]] },
    /* the glaze vats: each set of four a great vat, the glaze jars on a shelf */
    '2,0': { wall: [['kw_glazejars', 136, 0]], floor: [['kw_vat', 32, 32], ['kw_vat', 256, 32], ['kw_vat', 32, 112], ['kw_vat', 256, 112]] },
    /* the kiln's heart: kiln mouths roaring in its wall */
    '1,0': { wall: [['kw_kilnmouth', 80, 0], ['kw_kilnmouth', 144, 0], ['kw_kilnmouth', 208, 0]] },
};
/* the fires: [x, y, w, h] in room pixels, each flickering (and a warm light on the floor in front) */
const KILN_GLOW = {
    '2,2': [[79, 119, 10, 8], [147, 119, 10, 8], [215, 119, 10, 8]],
    '0,2': [[59, 118, 6, 8], [107, 118, 6, 8], [155, 118, 6, 8], [203, 118, 6, 8], [251, 118, 6, 8]],
    '1,1': [[142, 5, 5, 10]],
    '1,0': [[89, 9, 14, 7], [153, 9, 14, 7], [217, 9, 14, 7]],
};
const KilnLook = {
    ground(a, cx, cy) {
        RoomLook.ground(a, cx, cy, KILN_DRESS);
        if (HEADLESS) return;
        for (const r of a.rooms) {
            const g = KILN_GLOW[r.key]; if (!g) continue;
            const X = r.x * T - cx, Y = r.y * T - cy;
            if (X >= W || Y >= H || X + r.w * T <= 0 || Y + r.h * T <= 0) continue;
            g.forEach(([gx, gy, w, h], i) => {
                const k = 0.5 + 0.5 * Math.sin(G.t / 7 + i * 1.9) * Math.sin(G.t / 11 + i);
                Gfx.alpha(0.25 + 0.3 * k); Gfx.rect(X + gx, Y + gy + h - 3, w, 3, '#f7d64a'); Gfx.alpha(0.2 + 0.25 * k); Gfx.rect(X + gx + 1, Y + gy, w - 2, h, '#f39a3c');
                Gfx.alpha(0.06 + 0.04 * k); Gfx.rect(X + gx - 4, Y + gy + h + 2, w + 8, 10, '#f39a3c'); Gfx.alpha(1);
            });
        }
    },
    warm(a) { RoomLook.warm(a, KILN_DRESS); },
    /* soot round a kiln's foot (the kiln 2x2 at x,y): its shadow, crisp, a little to the right (the light's from the top
       left), and ash and soot specks swept out in front of its mouth (a smooth fade read as a blurred, offset smudge) */
    soot(x, R, kilns) {
        for (const [kx, ky] of kilns) {
            const cx = kx * T + 17, cy = (ky + 2) * T;
            x.globalAlpha = 0.24;
            for (let j = -3; j <= 3; j++) { const hw = Math.round(17 * Math.sqrt(1 - (j / 4) ** 2)); R('#2a1410', cx - hw, cy + j, hw * 2, 1); }
            x.globalAlpha = 0.5;
            for (let j = 0; j < 9; j++) for (let i = -12; i <= 12; i++) {
                const d = Math.hypot(i / 12, j / 9); if (d > 1 || hash2(cx + i, cy + j, 61) > 0.32 * (1 - d) + 0.04) continue;
                R(hash2(i, j, 62) < 0.7 ? '#2a1410' : '#8a8478', cx - 1 + i, cy + 3 + j, 1, 1);
            }
            x.globalAlpha = 1;
        }
    },
};
/* a kiln standing in a room (in place of the old ones, on the same tiles): its fire flickers in its mouth */
SPAWN.kwkiln = (x, y, p) => {
    const pr = SPAWN.deco(x, y, Object.assign({ look: 'kw_kiln' }, p)), d0 = pr.draw.bind(pr), fur = p.look === 'kw_furnace';
    pr.draw = (cx, cy) => {
        d0(cx, cy);
        const k = 0.5 + 0.5 * Math.sin(G.t / 6 + x) * Math.sin(G.t / 13 + y), X = pr.x - cx, Y = pr.y - cy;
        Gfx.alpha(0.3 + 0.35 * k); Gfx.rect(X + (fur ? 10 : 12), Y + (fur ? 27 : 31), fur ? 12 : 8, 3, '#f7d64a'); Gfx.alpha(1);
    };
    return pr;
};
/* the pieces (lit from the top left; the free-standing ones outlined in ink, the ones built into a room's walls painted
   to the edge of their tiles) */
function initKilnLook() {
    const pic = (w, h, fn, outline = true) => paintSprite(w, h, x => fn((c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); }, x), outline);
    /* fired brick in a running bond over a box (tone: light, mid, dark, mortar) */
    const bricks = (R, x0, y0, w, h, c, s = 0) => {
        R(c[3], x0, y0, w, h);
        for (let j = 0; j < h; j += 4) for (let i = ((j / 4 + s) % 2) * -4; i < w; i += 8) {
            const a = Math.max(0, i), ww = Math.min(i + 7, w) - a, t = hash2(i + s * 7, j, 11) < 0.5 ? c[1] : c[0];
            if (ww > 0) { R(t, x0 + a, y0 + j, ww, Math.min(3, h - j)); R(shade(t, 0.15), x0 + a, y0 + j, ww, 1); }
        }
    };
    const BRICK = ['#c86a44', '#b45a3c', '#8a3c28', '#5e261c'];
    const embers = (R, a, b, w, h) => { R('#1a0c08', a, b, w, h); R('#c0302e', a, b + h - 3, w, 3); R('#f39a3c', a + 1, b + h - 3, w - 2, 2); R('#f7d64a', a + Math.floor(w / 2) - 1, b + h - 2, 2, 1); };
    const arch = (R, a, b, w, h, col) => { R(col, a + 1, b, w - 2, 1); R(col, a, b + 1, w, h - 1); };
    /* a bottle kiln: a brick hovel at its foot, the bottle swelling up out of it, a sooty neck, the fire in its mouth */
    ART.kw_kiln = pic(32, 38, R => {
        const hw = y => y < 2 ? 6 : y < 9 ? 5 : y < 23 ? Math.round(5 + Math.pow((y - 9) / 14, 0.7) * 9) : 14;
        for (let y = 0; y < 36; y++) {
            const h = hw(y);
            for (let i = 16 - h; i < 16 + h; i++) {
                const u = (i - 16 + 0.5) / h, mortar = y >= 23 ? (y - 23) % 4 === 3 || ((y - 23) >> 2) % 2 === 0 && i % 8 === 0 || ((y - 23) >> 2) % 2 === 1 && i % 8 === 4 : y % 3 === 2;
                R(mortar ? '#6a2e1e' : u < -0.55 ? '#e08a5e' : u > 0.45 ? '#93432c' : y > 22 && hash2(i, y, 5) < 0.3 ? '#b45a3c' : '#c4623a', i, y, 1, 1);
            }
        }
        R('#8a7a6a', 3, 34, 26, 2); R('#a89a88', 3, 34, 26, 1); R('#93432c', 10, 0, 12, 2); R('#e08a5e', 10, 0, 4, 1);
        for (let y = 0; y < 14; y++) { const h = hw(y); R('#2a1410', 16 - h, y, h * 2, 1); }
        R('#4a2418', 13, 0, 6, 1);
        arch(R, 11, 25, 10, 10, '#3a1810'); embers(R, 12, 27, 8, 8);
        for (let y = 14; y < 18; y++) { const h = hw(y); R('#5e3a2e', 16 - h, y, h * 2, 1); }
    });
    /* the furnace: a squat brick furnace bound with iron, a flue out of its back, its iron door glowing at the seams */
    ART.kw_furnace = pic(32, 38, R => {
        R('#4a4454', 20, 0, 5, 10); R('#6a6474', 20, 0, 1, 10); R('#2a2430', 19, 0, 7, 1);
        for (let y = 6; y < 36; y++) { const h = y < 12 ? Math.round(8 + (y - 6)) : 14; for (let i = 16 - h; i < 16 + h; i++) { const u = (i - 16 + 0.5) / h; R((y % 4 === 3) ? '#6a2e1e' : u < -0.55 ? '#d67a54' : u > 0.45 ? '#8a3c28' : '#b8583a', i, y, 1, 1); } }
        for (const b of [14, 24]) { R('#3a3440', 2, b, 28, 2); R('#6a6474', 2, b, 28, 1); for (let i = 4; i < 29; i += 6) R('#a8a4b8', i, b, 1, 1); }
        R('#2a2430', 9, 20, 14, 12); R('#4a4454', 10, 21, 12, 10); R('#5e586a', 10, 21, 12, 1); R('#5e586a', 10, 21, 1, 10);
        R('#f39a3c', 10, 27, 12, 2); R('#f7d64a', 14, 27, 4, 1); R('#a8a4b8', 20, 24, 2, 1);
        R('#8a5634', 0, 26, 5, 6); R('#a8744a', 0, 26, 5, 1); R('#6e4226', 1, 32, 3, 2);
        R('#8a7a6a', 2, 34, 28, 2); R('#a89a88', 2, 34, 28, 1);
        for (let y = 6; y < 12; y++) R('#3a1c14', 16 - (y - 2), y, (y - 2) * 2, 1);
    });
    /* a drying rack of greenware: unfired pots, pale and dull, on three slatted shelves */
    const greenware = (R, a, b, kind) => {
        const c = ['#ddd2c0', '#c4b8a4', '#ece4d6'];
        if (kind === 0) { R(c[0], a, b + 1, 4, 4); R(c[0], a + 1, b, 2, 1); R(c[1], a + 3, b + 1, 1, 4); R(c[2], a, b + 1, 1, 2); }
        else if (kind === 1) { R(c[0], a, b + 2, 5, 3); R(c[1], a + 4, b + 2, 1, 3); R(c[2], a, b + 2, 5, 1); }
        else { R(c[0], a + 1, b, 2, 2); R(c[0], a, b + 2, 4, 3); R(c[1], a + 3, b + 2, 1, 3); R(c[2], a + 1, b, 1, 2); R(c[0], a + 4, b + 2, 1, 1); }
    };
    ART.kw_rack = pic(16, 28, R => {
        R('#7a4e32', 1, 1, 2, 26); R('#7a4e32', 13, 1, 2, 26); R('#a8744a', 1, 1, 1, 26); R('#a8744a', 13, 1, 1, 26);
        for (const s of [8, 17, 26]) { R('#9a6438', 1, s, 14, 2); R('#c9925a', 1, s, 14, 1); }
        greenware(R, 3, 3, 0); greenware(R, 8, 3, 2); greenware(R, 3, 12, 1); greenware(R, 9, 12, 0); greenware(R, 4, 21, 2); greenware(R, 9, 21, 1);
    });
    /* bram's wheel: a kick wheel on its frame, a pot half-thrown on the head, wet and shining */
    ART.kw_wheel = pic(20, 20, R => {
        R('#7a4e32', 1, 11, 18, 3); R('#a8744a', 1, 11, 18, 1); R('#5e3a22', 2, 14, 2, 5); R('#5e3a22', 16, 14, 2, 5); R('#5e3a22', 9, 14, 2, 3);
        for (let i = -6; i <= 6; i++) { const h = Math.round(Math.sqrt(36 - i * i) / 3); R(i < -2 ? '#8a5a36' : '#6b4128', 10 + i, 17 - h, 1, h * 2 + 1); }
        for (let i = -5; i <= 5; i++) { const h = Math.round(Math.sqrt(25 - i * i) / 3); R(i < -1 ? '#9a6644' : '#7a4c30', 10 + i, 9 - h, 1, h * 2 + 1); }
        R('#b07a5a', 7, 3, 6, 6); R('#d8a888', 7, 3, 2, 5); R('#8a5a40', 12, 3, 1, 6); R('#b07a5a', 8, 1, 4, 2); R('#6e4430', 9, 1, 2, 1); R('#f0c8a8', 8, 4, 1, 2);
        R('#9a9aa8', 15, 8, 4, 3); R('#c8c8d4', 15, 8, 4, 1); R('#5fa6c8', 16, 9, 2, 1);
    });
    /* the kiln's wares on a shelf: a tall ochre jug, a turquoise vase, a stack of bowls, a teapot, a jar */
    ART.kw_potshelf = pic(64, 16, R => {
        R('#9a6438', 1, 11, 62, 2); R('#c9925a', 1, 11, 62, 1); R('#6b4128', 6, 13, 2, 2); R('#6b4128', 56, 13, 2, 2);
        const pot = (a, w, h, c, neck) => { R(c, a, 11 - h, w, h); R(shade(c, 0.3), a, 11 - h, 1, h - 1); R(shade(c, -0.25), a + w - 1, 11 - h, 1, h); if (neck) { R(c, a + 1, 11 - h - 2, w - 2, 2); R(shade(c, -0.25), a + w - 2, 11 - h - 2, 1, 2); } R('#ffffff', a + 1, 11 - h + 1, 1, 1); };
        pot(3, 6, 6, '#e0913a', true); R('#e0913a', 9, 6, 1, 2);
        pot(12, 5, 7, '#5ad1c5', true);
        for (let k = 0; k < 3; k++) { R('#efe6d2', 20, 10 - k * 2, 8, 2); R('#c8bca4', 20, 11 - k * 2, 8, 1); }
        pot(31, 7, 4, '#8a4a2a', false); R('#8a4a2a', 38, 8, 2, 1); R('#8a4a2a', 33, 6, 3, 1);
        pot(43, 5, 6, '#e0913a', false); R('#efe6d2', 43, 5, 5, 1);
        pot(51, 6, 5, '#2e9a96', true);
    });
    /* firewood for the kilns, stacked log ends out */
    const logEnd = (R, a, b, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j); if (d > r + 0.3) continue; R(d > r - 0.8 ? '#6b4128' : d < 1 ? '#b8864a' : (i + j) < -1 ? '#e8bc80' : '#d8a868', a + i, b + j, 1, 1); } };
    ART.kw_logs = pic(32, 16, R => {
        for (const [a, b] of [[5, 12], [12, 12], [19, 12], [26, 12], [8, 7], [15, 7], [22, 7], [12, 2], [19, 2]]) logEnd(R, a, b, 3);
    });
    /* built into the room's walls: a shelving unit of greenware over a brick bench (3 tiles), a clay bin (2x2), a
       woodpile (2x1), a glaze store (2x2): each fills its tiles, drawn over the brick */
    ART.kw_dryshelf = pic(48, 16, R => {
        R('#2a1f2d', 0, 0, 48, 16); R('#3a2418', 1, 1, 46, 14); R('#7a4e32', 1, 1, 2, 14); R('#7a4e32', 45, 1, 2, 14); R('#7a4e32', 23, 1, 2, 14);
        for (const s of [6, 13]) { R('#9a6438', 1, s, 46, 2); R('#c9925a', 1, s, 46, 1); }
        for (let k = 0; k < 4; k++) { greenware(R, 4 + k * 5, 1, k % 3); greenware(R, 27 + k * 5, 1, (k + 1) % 3); greenware(R, 4 + k * 5, 8, (k + 2) % 3); greenware(R, 27 + k * 5, 8, k % 3); }
        R('#a8744a', 1, 1, 46, 1);
    }, false);
    ART.kw_claybin = pic(32, 32, R => {
        R('#2a1f2d', 0, 0, 32, 32); R('#6b4128', 1, 1, 30, 14); R('#9a6438', 1, 1, 30, 1); R('#4a2c1c', 3, 3, 26, 12);
        for (let j = 0; j < 11; j++) { const w = Math.round(12 * Math.sqrt(Math.max(0, 1 - ((j - 9) / 10) ** 2))); R(j < 4 ? '#b8aea2' : '#9a8e84', 16 - w, 4 + j, w * 2, 1); }
        R('#d0c8c0', 10, 6, 4, 1); R('#d0c8c0', 8, 8, 2, 1); R('#7a6e64', 18, 9, 7, 1); R('#9a6438', 21, 2, 1, 6); R('#c9925a', 20, 2, 3, 1);
        R('#6b4128', 1, 15, 30, 1);
        for (let i = 1; i < 31; i += 5) { R(i % 2 ? '#8a5a36' : '#9a6644', i, 16, 5, 15); R('#5e3a22', i + 4, 16, 1, 15); R('#a8744a', i, 16, 1, 15); }
        for (const b of [19, 26]) { R('#4a4454', 1, b, 30, 2); R('#6a6474', 1, b, 30, 1); for (let i = 4; i < 30; i += 8) R('#a8a4b8', i, b, 1, 1); }
        R('#3a2418', 1, 30, 30, 1);
    }, false);
    ART.kw_woodstack = pic(32, 16, R => {
        R('#2a1f2d', 0, 0, 32, 16); R('#3a2418', 1, 1, 30, 14);
        for (const [a, b] of [[4, 4], [11, 4], [18, 4], [25, 4], [7, 10], [14, 10], [21, 10], [28, 11], [1, 11]]) logEnd(R, a, b, 3);
        R('#6b4128', 1, 15, 30, 1);
    }, false);
    ART.kw_glazeshelf = pic(32, 32, R => {
        R('#2a1f2d', 0, 0, 32, 32); R('#3a2418', 1, 1, 30, 30);
        const jar = (a, b, w, h, c) => { R(c, a, b, w, h); R(shade(c, 0.35), a, b, 1, h - 1); R(shade(c, -0.3), a + w - 1, b, 1, h); R(shade(c, -0.15), a + 1, b - 1, w - 2, 1); R('#ffffff', a + 1, b + 1, 1, 1); };
        jar(3, 4, 8, 10, '#5ad1c5'); R('#2e9a96', 4, 9, 6, 1); jar(13, 6, 6, 8, '#e0913a'); jar(21, 3, 8, 11, '#2e9a96'); R('#5ad1c5', 23, 8, 4, 1);
        R('#9a6438', 1, 14, 30, 2); R('#c9925a', 1, 14, 30, 1);
        R('#7a4e32', 1, 16, 2, 15); R('#7a4e32', 29, 16, 2, 15);
        jar(4, 18, 4, 4, '#efe6d2'); jar(10, 17, 5, 5, '#5ad1c5'); jar(17, 18, 4, 4, '#8a4a2a'); jar(23, 17, 5, 5, '#e0913a');
        R('#9a6438', 1, 22, 30, 2); R('#c9925a', 1, 22, 30, 1);
        jar(4, 25, 5, 4, '#e0913a'); jar(11, 25, 4, 4, '#2e9a96'); jar(17, 24, 6, 5, '#efe6d2'); jar(25, 25, 3, 4, '#5ad1c5');
        R('#9a6438', 1, 29, 30, 2);
    }, false);
    /* the broken crocks, swept into a heap against the wall */
    ART.kw_shards = pic(32, 14, R => {
        for (let j = 0; j < 12; j++) { const w = Math.round(14 * Math.sqrt(Math.max(0, 1 - ((11 - j) / 12) ** 2))); R('#93432c', 16 - w, j + 1, w * 2, 1); }
        for (const [a, b, c] of [[9, 7, '#c4623a'], [14, 4, '#e08a5e'], [19, 8, '#c4623a'], [12, 10, '#d98f3a'], [22, 11, '#e08a5e'], [6, 11, '#c4623a'], [17, 2, '#d98f3a'], [25, 9, '#93432c']]) { R(c, a, b, 4, 2); R(shade(c, 0.3), a, b, 2, 1); }
        R('#5ad1c5', 15, 6, 2, 1); R('#5ad1c5', 23, 10, 2, 1); R('#efe6d2', 10, 4, 2, 1);
    });
    /* the great kiln, built into the middle of its room (13x5 tiles): a brick dome in courses round its flue, spy-holes
       glowing, the hovel's roof at its corners; three firemouths along its front */
    ART.kw_greatkiln = pic(208, 80, R => {
        bricks(R, 0, 0, 208, 64, ['#7a3426', '#6a2e1e', '#5e261c', '#4a1c14']);
        for (let j = 0; j < 64; j++) for (let i = 0; i < 208; i++) {
            const u = (i - 104) / 98, v = (j - 33) / 31, d = Math.hypot(u, v); if (d > 1) continue;
            const ring = Math.floor(d * 9), joint = Math.floor((Math.atan2(v, u) + Math.PI) * (6 + ring * 3)) % 2;
            const lit = -u * 0.6 - v * 0.8;
            const base = lit > 0.35 ? '#d67a54' : lit > -0.15 ? '#c4623a' : lit > -0.6 ? '#ac5234' : '#923f2a';
            let c = (d * 9) % 1 < 0.14 ? shade(base, -0.18) : base;
            if (joint && (d * 9) % 1 < 0.5 && (d * 9) % 1 > 0.4) c = shade(base, -0.18);
            R(c, i, j, 1, 1);
        }
        for (let j = 0; j < 64; j++) for (let i = 0; i < 208; i++) { const d = Math.hypot((i - 104) / 22, (j - 31) / 8); if (d < 1) R(d < 0.6 ? '#1a0c08' : d < 0.8 ? '#7a2a1e' : '#4a1c14', i, j, 1, 1); }
        R('#f39a3c', 98, 30, 12, 2); R('#f7d64a', 102, 30, 4, 1);
        for (const [a, b] of [[48, 22], [160, 22], [62, 46], [146, 46]]) { R('#1a0c08', a, b, 4, 3); R('#f39a3c', a + 1, b + 1, 2, 1); }
        R('#2a1f2d', 0, 63, 208, 1);
        bricks(R, 0, 64, 208, 16, BRICK, 1);
        for (const m of [30, 98, 166]) {
            for (let k = 0; k < 6; k++) R(k < 3 ? '#4a2418' : '#6a3424', m + 2 - k, 60 + k, 8 + k * 2, 1);
            arch(R, m, 66, 12, 14, '#3a1810'); embers(R, m + 1, 68, 10, 12);
        }
    }, false);
    /* a dragon kiln, built along the middle of its room (16x2 tiles): a long brick vault with ports along its back, small
       stoke holes all down its side with soot over each */
    ART.kw_dragonkiln = pic(256, 32, R => {
        for (let j = 0; j < 16; j++) { const t = j / 15, c = t < 0.2 ? '#a84e30' : t < 0.5 ? '#e08a5e' : t < 0.8 ? '#c4623a' : '#8a3c28'; R(c, 0, j, 256, 1); }
        for (let i = 0; i < 256; i += 8) R('#6a2e1e', i, 0, 1, 16);
        for (let j = 2; j < 16; j += 4) R('#7a3426', 0, j, 256, 1);
        for (let i = 24; i < 256; i += 48) { R('#1a0c08', i, 5, 5, 3); R('#f39a3c', i + 1, 6, 3, 1); }
        R('#2a1f2d', 0, 15, 256, 1);
        bricks(R, 0, 16, 256, 16, BRICK);
        for (let i = 26; i < 256; i += 48) { for (let k = 0; k < 4; k++) R('#4a2418', i - k, 17 + k, 8 + k * 2 - 2, 1); arch(R, i, 21, 8, 9, '#3a1810'); embers(R, i + 1, 22, 6, 8); }
        R('#3a1810', 0, 31, 256, 1);
    }, false);
    /* plates hung on the gallery wall */
    ART.kw_plates = pic(48, 14, R => {
        const plate = (cx, rim, mid, dot) => { for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const d = Math.hypot(i, j); if (d > 6.3) continue; R(d > 4.8 ? rim : d < 1.8 ? dot : mid, cx + i, 7 + j, 1, 1); } R('#ffffff', cx - 3, 3, 2, 1); };
        plate(8, '#2e9a96', '#efe6d2', '#e0913a'); plate(24, '#e0913a', '#efe6d2', '#5ad1c5'); plate(40, '#8a4a2a', '#e8b884', '#2e9a96');
    });
    /* rope coiled on its peg, a pulley block, a hank of cord */
    ART.kw_ropes = pic(24, 16, R => {
        R('#6b4128', 5, 1, 2, 2);
        for (let k = 0; k < 4; k++) { const r = 5 - k; for (let a = 0; a < 20; a++) { const t = a / 20 * Math.PI * 2; R(k % 2 ? '#c9b089' : '#a88a60', 6 + Math.round(Math.cos(t) * r), 8 + Math.round(Math.sin(t) * r * 0.8), 1, 1); } }
        R('#9a6438', 14, 2, 6, 7); R('#c9925a', 14, 2, 6, 1); for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; R('#6a6474', 17 + Math.round(Math.cos(t) * 2), 5 + Math.round(Math.sin(t) * 2), 1, 1); }
        R('#c9b089', 17, 9, 1, 6); R('#c9b089', 21, 3, 1, 10); R('#a88a60', 20, 12, 3, 2);
    });
    /* the furnace's iron doors in the wall, the fire showing at the seam, a poker leaning by them */
    ART.kw_furnacedoor = pic(32, 16, R => {
        arch(R, 3, 1, 26, 15, '#5e261c'); R('#8a7a6a', 4, 2, 24, 2); R('#a89a88', 4, 2, 24, 1);
        R('#3a3440', 5, 4, 11, 12); R('#3a3440', 17, 4, 10, 12); R('#5e586a', 5, 4, 11, 1); R('#5e586a', 17, 4, 10, 1); R('#5e586a', 5, 4, 1, 12);
        for (const [a, b] of [[7, 6], [13, 6], [7, 13], [13, 13], [19, 6], [24, 6], [19, 13], [24, 13]]) R('#8a8496', a, b, 1, 1);
        R('#1a0c08', 16, 4, 1, 12); R('#f39a3c', 16, 6, 1, 8);
        R('#6a6474', 29, 3, 1, 12); R('#9a94a8', 29, 3, 1, 1); R('#6a6474', 28, 2, 2, 1);
    });
    /* a kiln's mouth in the wall: an arch of stone, soot climbing above it, the fire roaring in it */
    ART.kw_kilnmouth = pic(32, 16, R => {
        for (let k = 0; k < 6; k++) R(k < 3 ? '#2a1410' : '#4a2418', 9 - k, k, 14 + k * 2, 1);
        arch(R, 5, 3, 22, 13, '#8a7a6a'); R('#a89a88', 6, 3, 20, 1);
        arch(R, 8, 5, 16, 11, '#1a0c08');
        R('#c0302e', 9, 10, 14, 6); R('#f39a3c', 10, 11, 12, 4); R('#f7d64a', 13, 12, 6, 3); R('#fff4c0', 15, 13, 2, 2);
        R('#3a3440', 7, 15, 18, 1);
    });
    /* bram's own pots on his shelf: a great jug, two mugs, a teapot, a bowl */
    ART.kw_brampots = pic(48, 16, R => {
        R('#9a6438', 1, 12, 46, 2); R('#c9925a', 1, 12, 46, 1); R('#6b4128', 5, 14, 2, 2); R('#6b4128', 41, 14, 2, 2);
        R('#e0913a', 3, 3, 9, 9); R('#f2bc78', 3, 3, 2, 8); R('#a8602a', 11, 3, 1, 9); R('#e0913a', 4, 1, 7, 2); R('#e0913a', 12, 5, 2, 4); R('#a8602a', 6, 7, 4, 1);
        for (const a of [16, 22]) { R('#8a4a2a', a, 8, 4, 4); R('#b8743c', a, 8, 1, 3); R('#8a4a2a', a + 4, 9, 1, 2); }
        R('#5ad1c5', 29, 7, 8, 5); R('#bff3ee', 29, 7, 2, 2); R('#2e9a96', 36, 7, 1, 5); R('#5ad1c5', 31, 5, 4, 2); R('#5ad1c5', 37, 8, 2, 1);
        R('#efe6d2', 40, 9, 6, 3); R('#c8bca4', 40, 11, 6, 1);
    });
    /* glaze in jars on a shelf, dribbled down their sides */
    ART.kw_glazejars = pic(48, 16, R => {
        R('#9a6438', 1, 12, 46, 2); R('#c9925a', 1, 12, 46, 1); R('#6b4128', 5, 14, 2, 2); R('#6b4128', 41, 14, 2, 2);
        const jar = (a, c) => { R('#c4b8a4', a, 3, 10, 9); R('#e8dcc8', a, 3, 2, 8); R('#9a8e7a', a + 9, 3, 1, 9); R(c, a + 1, 2, 8, 2); R(c, a + 2, 4, 1, 3); R(c, a + 6, 4, 1, 5); R(shade(c, 0.4), a + 2, 2, 3, 1); };
        jar(3, '#5ad1c5'); jar(19, '#e0913a'); jar(35, '#9a2a3a');
    });
    /* a great vat of glaze over each four vat tiles: a clay basin brimming with turquoise, a paddle across it */
    ART.kw_vat = pic(32, 32, R => {
        /* the tub's side, in front (lit from the left), then its rim and the glaze in it, seen from above */
        for (let i = 1; i < 31; i++) { const u = (i - 15.5) / 14.5, h = Math.round(Math.sqrt(1 - u * u) * 6); R(u < -0.5 ? '#d67a54' : u > 0.4 ? '#8a3c28' : '#b4583a', i, 14, 1, 12 + h); R('#5e261c', i, 25 + h, 1, 1); }
        for (const b of [17, 22]) for (let i = 1; i < 31; i++) { const u = (i - 15.5) / 14.5; R(u < -0.5 ? '#8a7a6a' : '#5a4e44', i, b + Math.round(Math.sqrt(1 - u * u) * 6), 1, 1); }
        for (let j = 0; j < 22; j++) for (let i = 0; i < 32; i++) {
            const d = Math.hypot((i - 15.5) / 15.5, (j - 11) / 11);
            if (d > 1) continue;
            R(d > 0.86 ? (i < 14 ? '#e08a5e' : '#a84e30') : d > 0.78 ? '#5e261c' : (i + j < 14 ? '#8fe6dc' : i + j > 32 ? '#2e9a96' : '#5ad1c5'), i, j, 1, 1);
        }
        R('#bff3ee', 8, 6, 4, 1); R('#bff3ee', 7, 7, 2, 1);
        for (let k = 0; k < 16; k++) R(k < 2 ? '#6b4128' : '#c9925a', 8 + k, 15 - Math.round(k * 0.45), 2, 1);
        R('#2e9a96', 5, 20, 1, 4); R('#2e9a96', 24, 22, 1, 3);
    }, false);
}
CONTENT_INIT.push(initKilnLook);
