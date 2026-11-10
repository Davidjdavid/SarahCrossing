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
                { k: 'deco', x: 9, y: 6, look: 'kilnbig', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
                { k: 'sign', x: 5, y: 5, text: 'A plaque by the little gate: "Rung from next door. Be here when it rings."' },
            ],
            nudge: { solved: 'kiln_lwrGate', after: 60 * 60 * 3, say: "The little gate answers to a charm in the next room. You'd have to be here, and it would have to ring there." },
        },
        /* ---------------- 2 Charm Hall: three at once ---------------- */
        '1,2': {
            name: 'Charm Hall',
            rows: [
                '#########.##########',
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
                { k: 'deco', x: 9, y: 4, look: 'kilnbig', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
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
                { k: 'deco', x: 9, y: 5, look: 'kilnbig', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
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
                { k: 'charm', x: 9, y: 1, seq: 'sms', order: 2, col: 'star', glyph: true, id: 'smsStar' },
                { k: 'charm', x: 17, y: 5, seq: 'sms', order: 1, col: 'moon', glyph: true, id: 'smsMoon' },
                { k: 'charm', x: 9, y: 9, seq: 'sms', order: 0, col: 'sun', glyph: true, id: 'smsSun' },
                { k: 'pot', x: 1, y: 8, id: 'smsPot' },
                { k: 'door', x: 16, y: 0, type: 'gate', when: 'sms', passed: 'up', id: 'smsN' },
                { k: 'mural', x: 8, y: 3, text: 'A mural painted on the clay: a sun, then a moon, then a star, in a row. Underneath, in somebody\'s neat hand: "In that order, please."' },
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
                '#########.##########',
            ],
            ents: [
                { k: 'crate', x: 3, y: 5, id: 'fCrate' },
                { k: 'pot', x: 16, y: 2, id: 'fPot' }, { k: 'pot', x: 16, y: 8, id: 'fPot2' },
                { k: 'door', x: 0, y: 5, type: 'lock', dir: 'v', id: 'fW' },
                { k: 'deco', x: 14, y: 4, look: 'kilnbig', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
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
                { k: 'deco', x: 1, y: 4, look: 'rack', solid: [[0, 0]] }, { k: 'deco', x: 17, y: 4, look: 'rack', solid: [[0, 0]] },
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
                { k: 'deco', x: 13, y: 7, look: 'wheel', text: "A potter's wheel, still turning slowly. Somebody was here not long ago." },
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
    legend: { 'v': { k: 'low', p: 'vat' } },
    tick: a => KilnLogic.tick(a),
    afterKnot: function* () { yield* Kiln.afterKnot(); },
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

/* the Glazer: a clay knight who throws clay shot. The shot breaks; its pieces fly back to the Glazer's
   hand along the same line, and the Glazer is still standing on that line */
class Glazer extends Enemy {
    constructor(tx, ty) {
        super(tx, ty, { type: 'glazer', hp: 3 });
        this.state = 'sleep'; this.st = 0;
    }
    hurtBox() { if (!this.alive) return null; return { x0: this.x - 8, x1: this.x + 8, y0: this.y - 22, y1: this.y + 4 }; }
    update() {
        if (!this.alive) return;
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room && Cam.room.key === '2,1' && !Cam.busy) {
                this.state = 'walk'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'glazer') s.shut = true;
                Music.play('boss');
                Script.run(function* () { yield* say(null, 'A clay knight with a glazed shield clanks to its feet, rolling a ball of clay between its hands.'); });
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
                if ((ax < 8 || ay < 8) && this.st > 40) { this.dir = ax < 8 ? (dy < 0 ? UP : DOWN) : (dx < 0 ? LEFT : RIGHT); this.setState('aim'); break; }
                if (ax < ay) this.move(sign(dx) * 0.7, 0); else this.move(0, sign(dy) * 0.7);
                this.anim++;
                break;
            }
            case 'aim': if (this.st > 26) { this.throwShot(); this.setState('hold'); } break;
            case 'hold': if (this.st > 70) this.setState('walk'); break;
            case 'hurt': if (this.st > 30) this.setState('walk'); break;
        }
        if (p.state === 'normal' && Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 8) p.hurt(1, this.x, this.y);
    }
    setState(s) { this.state = s; this.st = 0; }
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
        this.shot = { path, i: 0, t: 0 };
        GlazerShots.list.push({ g: this, path, i: 0, t: 0 });
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0) return;
        if (!shard) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 10); return; }   /* the stick bounces off its glaze */
        this.hp--; this.flash = 30; Sfx.play('enemyhit'); G.hitstop = 6; this.setState('hurt');
        Stats.count('boss:glazer:shards');
        if (this.hp <= 0) {
            this.alive = false; Sfx.play('shatter'); Fx.burst(this.x, this.y - 10, '#c4623a'); Fx.burst(this.x, this.y - 4, '#5ad1c5');
            Progress.set('kiln_glazer');
            for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'glazer') s.shut = false;
            Music.play('kilnhouse');
            Script.run(function* () { yield 40; yield* say(null, 'The Glazer cracks from head to foot and crumbles away to dust. Its own shot, coming home, was the one thing its shield never faced.'); });
        }
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const im = spr(this.state === 'aim' ? 'glazer_aim' : 'glazer');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.alpha(0.25); Gfx.rect(this.x - cx - 7, this.y - cy + 1, 14, 3, PAL.ink); Gfx.alpha(1);
        Gfx.img(img, this.x - cx - 8, this.y - cy - 22, this.dir === LEFT);
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
                if (p.feetOn(lx, ly)) p.hurt(1, lx * T + 8 - DX[s.g.dir] * 8, ly * T + 8 - DY[s.g.dir] * 8);
                Sfx.play('shatter'); Fx.burst(lx * T + 8, ly * T + 8, '#c4623a');
                /* home along the same line, through the thrower if it's still there */
                Shards.flight(area, s.path.slice().reverse(), { col: '#c4623a', hurt: true, pace: 4, delay: 8 });
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

/* the Kilnwyrm: a long glazed serpent of pots. It follows exactly where Wren has walked */
class Kilnwyrm extends Enemy {
    constructor(tx, ty) {
        super(tx, ty, { type: 'kilnwyrm', hp: 3 });
        this.state = 'sleep'; this.st = 0;
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
                Music.play('boss');
                Script.run(Kiln.bossIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        /* the path it follows: every step Wren takes */
        const last = this.path[this.path.length - 1];
        if (p.state !== 'flight' && (!last || dist(last[0], last[1], p.x, p.y) > 3)) this.path.push([p.x, p.y]);
        if (this.state === 'hurt') { if (this.st > 50) this.state = 'follow'; return; }
        const sp = this.speed * (this.hp === 1 ? 1.5 : this.hp === 2 ? 1.2 : 1);
        let left = sp;
        while (left > 0 && this.path.length) {
            const [tx, ty] = this.path[0], d = dist(this.x, this.y, tx, ty);
            if (d <= left) { this.x = tx; this.y = ty; this.path.shift(); left -= d; }
            else { this.x += (tx - this.x) / d * left; this.y += (ty - this.y) / d * left; this.dir = dirOf(tx - this.x, ty - this.y); left = 0; }
            this.trail.unshift([this.x, this.y]);
        }
        if (this.trail.length > 200) this.trail.length = 200;
        if (p.state === 'normal' && dist(p.x, p.y, this.x, this.y) < 12) { p.hurt(1, this.x, this.y); }
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0) return;
        if (!shard) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 8); return; }  /* glazed: only its own kind breaks it */
        this.hp--; this.flash = 40; Sfx.play('enemyhit'); Sfx.play('shatter'); G.hitstop = 8; G.shake = 8;
        this.segs = Math.max(2, this.segs - 2); this.state = 'hurt'; this.st = 0;
        Stats.count('boss:kiln:shards');
        /* it reels back along its own trail */
        this.path = [];
        if (this.hp <= 0) this.defeat();
    }
    defeat() {
        this.alive = false;
        Sfx.play('unravel'); for (let i = 0; i < this.segs; i++) { const s = this.trail[Math.min(this.trail.length - 1, i * 10)]; Fx.burst(s[0], s[1] - 6, '#c4623a'); }
        Progress.set('kiln_boss');
        Script.run(Kiln.bossDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) {
            if ((this.deadT || 0) < 100) { const k = 1 - (this.deadT || 0) / 100; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(9 * k), THREAD.bram); Gfx.rect(this.x - cx - 1, this.y - cy, 2, 4, '#1a1018'); }
            return;
        }
        const fl = this.flash > 0 && (this.flash >> 1) % 2;
        for (let i = this.segs; i >= 1; i--) {
            const s = this.trail[Math.min(this.trail.length - 1, i * 11)];
            const im = spr(i === this.segs ? 'wyrm_tail' : 'wyrm_seg');
            Gfx.alpha(0.22); Gfx.rect(s[0] - cx - 6, s[1] - cy, 12, 3, PAL.ink); Gfx.alpha(1);
            Gfx.img(fl ? tinted(im, '#ffffff') : im, s[0] - cx - 8, s[1] - cy - 14);
        }
        const hd = spr('wyrm_head_' + DIR_NAME[this.dir === LEFT ? RIGHT : this.dir]);
        Gfx.img(fl ? tinted(hd, '#ffffff') : hd, this.x - cx - 8, this.y - cy - 16, this.dir === LEFT);
    }
}
SPAWN.kilnwyrm = (x, y) => Progress.flag('kiln_boss') ? new Ent('none') : new Kilnwyrm(x, y);

const Kiln = {
    *bossIntro(w) {
        yield 20;
        yield* say(null, 'In the heat at the heart of the Kiln, something long and glazed uncoils. Its head turns, sniffs the floor where you just walked, and starts to follow your footprints.');
        yield* say(null, 'Its glaze is as hard as the Glazer\'s shield. Nothing you swing will crack it.');
    },
    *bossDown(w) {
        const a = w.area;
        Music.play('silence');
        yield 40;
        yield* say(null, 'The Kilnwyrm comes apart pot by pot, and every last piece goes rattling across the floor and down a crack by the wall, back to wherever it belongs.');
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
        yield* say(null, 'A door opens in the side of the chamber, onto a ledge high on the mesa and a long view over Kilnridge.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 17, r.y + 9, { to: 'hollow', tx2: KILN_OUT.x, ty2: KILN_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 17, r.y + 9, { im: ART.exitlight, solid: [] }));
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
        x.fillStyle = '#e8b884'; x.fillRect(0, 0, 48, 22); x.fillStyle = '#a86e3e'; x.fillRect(0, 0, 48, 1); x.fillRect(0, 21, 48, 1);
        x.fillStyle = '#f7d64a'; x.fillRect(5, 7, 8, 8); x.fillStyle = '#f39a3c'; x.fillRect(7, 5, 4, 1); x.fillRect(7, 16, 4, 1); x.fillRect(3, 9, 1, 4); x.fillRect(14, 9, 1, 4);
        x.fillStyle = '#9fd4f0'; x.fillRect(21, 6, 7, 10); x.fillStyle = '#e8b884'; x.fillRect(24, 6, 4, 8);
        x.fillStyle = '#f59ac0'; x.fillRect(38, 6, 2, 10); x.fillRect(34, 10, 10, 2); x.fillRect(36, 8, 6, 6);
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
