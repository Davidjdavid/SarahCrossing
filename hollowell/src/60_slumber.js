/* House 5: the Slumberhouse, in Hushwood. Doctor Mallow's House, lavender threads. A great dormitory at night.
   Wren's own mark: lie down in a bed and that bed is where you wake, however far you go in here (rooms don't
   move it), and a fall onto your own bed doesn't hurt, so falls are travel. Your trace remembers paths that are
   gone: boards that crumble behind you, a ride on the current; flying home, you go back the way you came, over
   anything, through dreamcatchers. Matron Hush follows your footsteps exactly; beaten, she leaves the Bedroll:
   lay it anywhere and hold C to go Homeward. Old rules join in: currents and floats, the Hookline, the Recall
   Bell and sleepers, strays filling pits, plates and their weights. Mother Sloth pulls you to her bed; fly home
   from her grip, far enough, and her arms snap. */

THEMES.slumberhouse = { floor: ['#8a8ac8', '#6a6aa8', '#a8a8e0', '#4a4a7a'], wall: ['#b48ce8', '#8a64c4', '#d8c8f8', '#4b3a8a'], stone: ['#9a8ab8', '#7a6a98', '#bcaed8', '#4e4268'], water: ['#6ab0d8', '#4a8ac0', '#a8d8f0', '#2a5a8a'], dark: '#1e1a34' };
FLOORS.slumberhouse = {
    /* soft blue carpet with little stars, old boards, and the night-blue tiles of the wards */
    floor: (x, th, v) => { fill(x, '#6e74b8'); speckle(x, ['#7a80c4', '#646aac'], 70 + v, 0.35); if (v === 3 && hash2(v, 7, 3) < 2) { fill(x, '#c8c0f0', 7, 7, 3, 1); fill(x, '#c8c0f0', 8, 6, 1, 3); } },
    floor2: (x, th, v) => Paint.planks(x, ['#a88a6a', '#86684a', '#c4a684', '#5a4430'], v, true),
    floor3: (x, th, v) => { fill(x, '#5a5e98'); fill(x, '#4a4e84', 0, 15, 16, 1); fill(x, '#4a4e84', 15, 0, 1, 16); speckle(x, ['#6a6ea8'], 40 + v, 0.15); },
};
WALLS.slumberhouse = {
    edge: '#1e1a34',
    top: (x) => { fill(x, '#3e2e6a'); speckle(x, ['#4b3a8a'], 8, 0.15); },
    face: (x, th, v) => {
        fill(x, '#b48ce8'); speckle(x, ['#a47ad8', '#c4a0f0'], 30 + v, 0.25);
        fill(x, '#f7e08a', 3 + (v * 5) % 9, 4, 1, 1); fill(x, '#fbf6ea', 11 - (v * 3) % 7, 8, 1, 1);
        fill(x, '#7d5bc4', 0, 12, 16, 1); fill(x, '#4b3a8a', 0, 15, 16, 1);
    },
};

const SLUMBER_OUT = { x: 128 + 19, y: 40 + 9 };      /* the door out, at the front of the house */

defHouse({
    id: 'slumber', name: 'The Slumberhouse', place: 'The Slumberhouse', house: 'slumber', theme: 'slumberhouse', thread: THREAD.mallow, music: 'slumber',
    knotName: 'Sleeping Knot',
    entry: SLUMBER_ENTRY,
    legend: { 'c': { k: 'floor', p: 'floor2', ent: 'crumble' }, 'n': { k: 'pit', p: 'pit', narrow: true } },
    cells: {
        /* ---------------- 1 The Night Porch: a bed is where you wake; boards that give way; falls are travel ---------------- */
        '1,3': {
            name: 'The Night Porch',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#.........ooooooooo#',
                '#.........ooooo...o#',
                '#.........ccccc...o#',
                '#.........ooooo...o#',
                '#.........ooooooooo#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'nplever', id: 'npGate' },
                { k: 'lever', x: 16, y: 5, id: 'npLever', sig: 'nplever', once: true },
                { k: 'bed', x: 3, y: 6, id: 'npBed' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: SLUMBER_OUT.x, ty2: SLUMBER_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 5, y: 9, text: "THE SLUMBERHOUSE. Lie down a moment, why don't you. However far you wander in here, the bed you lay in is where you'll wake. (Mind the old boards.)" },
            ],
            nudge: { solved: () => Progress.areaFlag('slumber', 'lever:npLever'), after: 60 * 60 * 2, at: [3, 6], say: 'The bed by the door has its covers turned down, as if it were expecting someone. The boards across the pit creak.' },
        },
        /* ---------------- 2 The Long Ward (hub): beds all along, and the patients asleep in the aisles ---------------- */
        '1,2': {
            name: 'The Long Ward',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'lwLockN' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'lwLockE', dir: 'v' },
                { k: 'bed', x: 2, y: 1 }, { k: 'bed', x: 5, y: 1 }, { k: 'bed', x: 13, y: 1 }, { k: 'bed', x: 16, y: 1 },
                { k: 'bed', x: 2, y: 7 }, { k: 'bed', x: 5, y: 7 }, { k: 'bed', x: 13, y: 7 }, { k: 'bed', x: 16, y: 7 },
                { k: 'snoreling', x: 8, y: 3, id: 'lwSnore1' }, { k: 'snoreling', x: 11, y: 8, id: 'lwSnore2' },
                { k: 'sign', x: 10, y: 9, text: "THE LONG WARD. Lights out. Patients will kindly stay in bed. (Snorelings: tread softly and they won't stir.)" },
            ],
        },
        /* ---------------- 3 The Linen Cupboard: one walk over the boards, every lamp lit (key A) ---------------- */
        '0,2': {
            name: 'The Linen Cupboard',
            rows: [
                '####################',
                '#..................#',
                '#.....oooooooo.....#',
                '#####.oo.cccoo.....#',
                '#...#.ooccocoo.....#',
                '#.....oocccc.o......',
                '#...#.oocoocc......#',
                '#####.o.ccocoo.....#',
                '#.....oooooooo.....#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 8, y: 3, sig: 'lp1', mode: 'toggle' }, { k: 'plate', x: 12, y: 5, sig: 'lp2', mode: 'toggle' }, { k: 'plate', x: 7, y: 7, sig: 'lp3', mode: 'toggle' },
                { k: 'door', x: 4, y: 5, type: 'gate', when: 'lp1&lp2&lp3', dir: 'v', id: 'lcGate', keep: true },
                { k: 'chest', x: 2, y: 5, item: 'key', id: 'lcKey' },
                { k: 'bed', x: 16, y: 1, id: 'lcBed' },
                { k: 'sign', x: 17, y: 8, text: 'THE LINEN CUPBOARD. Three lamps on the old floor. Light them all at once and the cupboard opens. The boards only bear you the once.' },
            ],
            nudge: { solved: 'slumber_chest:lcKey', after: 60 * 60 * 3, at: [13, 6], say: 'The boards sag where they have been trodden before. You would have to plan the whole walk before you set foot on them, and fall home after.' },
        },
        /* ---------------- 4 The Laundry: ride the current under the dreamcatchers; jump in before it comes round (the Plan) ---------------- */
        '2,2': {
            name: 'The Laundry',
            rows: [
                '####################',
                '#..................#',
                '#..V<<<<<<<<<<<<<..#',
                '#..V............A...',
                '#..V............A..#',
                '...V............A~~~',
                '#..V............A..#',
                '#..>>>>>>>>>>>>>A..#',
                '#..~...............#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'raft', x: 3, y: 8, id: 'ldBasket', look: 'basket', patience: 2400 },
                { k: 'dreamring', x: 9, y: 7, sig: 'lr1', id: 'ldRing1' }, { k: 'dreamring', x: 16, y: 4, sig: 'lr2', id: 'ldRing2' }, { k: 'dreamring', x: 9, y: 2, sig: 'lr3', id: 'ldRing3' },
                { k: 'chest', x: 1, y: 1, item: 'plan', id: 'ldPlan', hidden: true, when: 'lr1&lr2&lr3' },
                { k: 'grate', x: 19, y: 5 },
                { k: 'barrel', x: 22, y: 5, id: 'ldBarrel', sleeper: true, tiedOff: true, saveWake: e => Bedroll.float === e, startAt: [17, 5], trace: [[22, 5], [21, 5], [20, 5], [19, 5], [18, 5], [17, 5]], pushLine: 'A washtub barrel, bobbing fast asleep by the grate. Bubbles come up, now and then, like snores.' },
                { k: 'door', x: 19, y: 3, type: 'gate', when: 'stlever', dir: 'v', id: 'ldStudyDoor' },
                { k: 'sign', x: 18, y: 9, text: 'THE LAUNDRY. The wash goes round and round. Whatever goes round comes back to where it started, and is none the wiser.' },
                { k: 'sign', x: 1, y: 9, text: 'Hung over the tub: three dreamcatchers. They only catch you on your way home.' },
            ],
            nudge: { solved: () => Inv.plans.includes('slumber'), after: 60 * 60 * 3, at: [3, 8], say: "The basket bobs at its little dock. Out on the water, a dreamcatcher turns slowly, though nobody could ever walk under it." },
        },
        /* ---------------- 5 Mallow's Study (signature): only reached by sending your Bedroll home in the sleeping barrel ---------------- */
        '3,2': {
            name: "Mallow's Study",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '...................#',
                '#..................#',
                '~~~~...............#',
                '#~~~...............#',
                '#~~~...............#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'lever', x: 2, y: 1, id: 'stLever', sig: 'stlever', once: true },
                { k: 'signature', x: 10, y: 5, house: 'slumber' },
                { k: 'deco', x: 14, y: 2, look: 'desk', solid: [[0, 0], [1, 0]], text: "Doctor Mallow's desk. A case book lies open: \"The Wanderer. Sleeps soundly. Dreams of the road. Wakes where we put her.\" The last three words have been crossed out, very hard." },
                { k: 'deco', x: 17, y: 7, look: 'bookshelf_tall', solid: [[0, 0]], oy: -16, text: 'Books on sleep, on dreams, on threads, and one called KNOTS FOR BEGINNERS with a lot of pages turned down.' },
                { k: 'chest', x: 16, y: 2, item: 'heartpatch', id: 'stPatch' },
            ],
        },
        /* ---------------- 6 The Drying Loft: ring the sleeper off the pillar, hook over, fall home (key B) ---------------- */
        '2,3': {
            name: 'The Drying Loft',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#oooooooooooooooooo#',
                '#oooooooooooo.ooooo#',
                '#oooooooooooooooooo#',
                '#oooooooooooooooooo#',
                '#ooooooooooo....ooo#',
                '#ooooooooooo....ooo#',
                '####################',
            ],
            ents: [
                { k: 'block', x: 6, y: 1, id: 'dlBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [13, 5], trace: [[6, 1], [6, 2], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [13, 4], [13, 5]], pushLine: 'A boulder, asleep on a pillar out in the drop. How did it get out there? How does anything?' },
                { k: 'eyelet', x: 13, y: 9 },
                { k: 'chest', x: 15, y: 8, item: 'key', id: 'dlKey' },
                { k: 'bed', x: 2, y: 1, id: 'dlBed' },
                { k: 'snoreling', x: 4, y: 2, id: 'dlSnore1' }, { k: 'snoreling', x: 17, y: 2, id: 'dlSnore2' },
                { k: 'sign', x: 17, y: 3, text: 'THE DRYING LOFT. Sheets, socks, and a long way down.' },
            ],
            nudge: { solved: 'slumber_chest:dlKey', after: 60 * 60 * 3, thing: 'dlBoulder', say: 'Out on its pillar, the sleeping boulder sits exactly between you and the ring on the island. A bell would wake it. A bell would wake everything.' },
        },
        /* ---------------- 7 The Landing (mini-boss): Matron Hush follows your footsteps (the Bedroll) ---------------- */
        '1,1': {
            name: 'The Landing',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#....cccccccccc....#',
                '#....cccccccccc....#',
                '.....cccccccccc.....',
                '#....cccccccccc....#',
                '#....cccccccccc....#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'laBig' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'matron' }, { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'matron' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'matron' },
                { k: 'deco', x: 1, y: 8, look: 'bed_big', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], oy: 0, text: "Matron's bed. Starched so stiff it could stand up by itself. It very nearly is." },
                { k: 'matron', x: 3, y: 9, id: 'matron' },
                { k: 'chest', x: 9, y: 8, item: 'bedroll', id: 'laBedroll', hidden: true, when: 'flag:slumber_matron', big: true },
                { k: 'sign', x: 17, y: 1, text: "THE LANDING. Matron does her rounds in her sleep. She never misses a step: yours. (The floorboards here are older than she is.)" },
            ],
        },
        /* ---------------- 8 The Nursery: carry the toy home over the drop it can't climb (key C's door) ---------------- */
        '0,1': {
            name: 'The Nursery',
            rows: [
                '#########.##########',
                '#..................#',
                '#oooooooooooooooooo#',
                '#..................#',
                '#..................#',
                '#...................',
                '##vvvvvvvv#........#',
                '##........#........#',
                '##........#........#',
                '##......n.#........#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'nuLock' },
                { k: 'crate', x: 4, y: 8, id: 'nuToy', marked: false, look: 'toyblock', noThrow: true },
                { k: 'deco', x: 14, y: 7, look: 'crib', solid: [[0, 0], [1, 0]], oy: -6, text: 'A crib, empty. A mobile of little wooden moons turns over it, though there is no draught.' },
                { k: 'sign', x: 12, y: 4, text: "THE NURSERY. Toys away by bedtime, please. (Someone has added, in crayon: THE BIG BLOCK DOESN'T GO BACK. IT NEVER GOES BACK.)" },
            ],
            nudge: { solved: () => Slumber.toyUsed(), after: 60 * 60 * 3, thing: 'nuToy', say: "The toy block in the playpen doesn't belong anywhere. Whatever falls into a pit and doesn't come back fills it in. If only it could be got out of the playpen." },
        },
        /* ---------------- 9 The Moonwalk: be in two places at once, nearly (key C) ---------------- */
        '2,1': {
            name: 'The Moonwalk',
            rows: [
                '####################',
                '#...#..............#',
                '#...#..............#',
                '##.##..#......#....#',
                '#..................#',
                '...........#.......#',
                '#..................#',
                '#......#......#....#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 2, y: 3, type: 'gate', when: 'mwp', id: 'mwGate', passed: 'up' },
                { k: 'chest', x: 2, y: 1, item: 'key', id: 'mwKey' },
                { k: 'plate', x: 17, y: 9, sig: 'mwp' },
                { k: 'wood', x: 16, y: 9, id: 'mwBlock' },
                { k: 'sign', x: 5, y: 9, text: "THE MOONWALK. The gate in the corner stays open while the far plate is pressed. Nobody has ever walked it in time. (Nobody walks in here.)" },
            ],
            nudge: { solved: 'slumber_mwGate', after: 60 * 60 * 3, at: [2, 4], say: 'The gate is a long way from the plate. Walking back takes too long. Something faster than walking, then.' },
        },
        /* ---------------- 10 Pillow Fort: a Snoreling will sleep in any bed going, even yours (the Pattern) ---------------- */
        '0,0': {
            name: 'Pillow Fort',
            rows: [
                '####################',
                '#......#...#.......#',
                '#......#...#.......#',
                '#......#...#.......#',
                '#......##.##.......#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 4, type: 'gate', when: 'pfp', id: 'pfGate' },
                { k: 'chest', x: 9, y: 2, item: 'pattern', id: 'pfPattern', big: true },
                { k: 'plate', x: 16, y: 8, sig: 'pfp' },
                { k: 'snoreling', x: 3, y: 2, id: 'pfSnore1' }, { k: 'snoreling', x: 17, y: 2, id: 'pfSnore2' },
                { k: 'deco', x: 2, y: 7, look: 'pillowpile', solid: [[0, 0], [1, 0]], oy: -4, text: 'A heap of pillows, still warm.' },
                { k: 'deco', x: 13, y: 6, look: 'pillowpile', solid: [[0, 0], [1, 0]], oy: -4, text: 'A heap of pillows. Somebody has built a little wall of them, and a little flag on top: a sock.' },
                { k: 'sign', x: 18, y: 9, text: 'PILLOW FORT. The keep opens while someone holds down the plate. Snorelings will sleep anywhere that looks like a bed.' },
            ],
            nudge: { solved: () => Inv.hasPattern('slumber'), after: 60 * 60 * 4, at: [16, 8], say: 'A Snoreling, woken, shuffles about and then goes to the nearest bed it can find. Any bed at all. Even one somebody has just laid out.' },
        },
        /* ---------------- 11 Mother Sloth (boss) ---------------- */
        '1,0': {
            name: "Mother Sloth's Room",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'mothersloth', x: 9, y: 2, id: 'sloth' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
            ],
        },
    },
    tick: a => Slumber.tick(a),
    build: a => Slumber.build(a),
    afterKnot: function* () { yield* Slumber.afterKnot(); },
});
/* a pit still there? (for nudges) */
function slumberPit(area, cx, cy, x, y) { const a = G.map; if (!a || a.id !== area) return true; return a.kind(cx * 20 + x, cy * 11 + y).pit; }

const Slumber = {
    NURSERY_PITS: () => { const r = []; for (let x = 1; x <= 18; x++) r.push([x, 11 + 2]); return r; },
    toyUsed() { return this.NURSERY_PITS().some(([x, y]) => Progress.areaFlag('slumber', `fill:${x},${y}`)); },
    build(a) {
        /* the toy block, once it's filled the gap for good, is used up */
        if (this.toyUsed()) { const t = a.find('nuToy'); if (t) a.remove(t); }
    },
    /* the Linen Cupboard's lamps go out when the boards mend (one walk, every lamp lit) */
    linenReset(a) {
        const r = a.rooms.find(q => q.key === '0,2');
        for (const e of a.ents) if (e.kind === 'plate' && /^lp\d$/.test(e.sig) && e.mode === 'toggle') e.on = false;
    },
    tick(a) {
        /* the Linen Cupboard: leave it and the lamps go out with the boards mending */
        const inL = !!(Cam.room && Cam.room.key === '0,2');
        if (this._inL && !inL) this.linenReset(a);
        this._inL = inL;
        /* toys away by bedtime: the toy block won't leave the Nursery */
        const toy = a.find('nuToy'), p = G.player;
        if (toy && !toy.removed && p) {
            const nr = a.rooms.find(q => q.key === '0,1');
            const inN = (x, y) => x >= nr.x && y >= nr.y && x < nr.x + nr.w && y < nr.y + nr.h;
            const out = toy.carried ? (p.state === 'normal' && !inN(p.tx, p.ty)) : (!toy.mv && !inN(toy.tx, toy.ty));
            if (out) {
                if (toy.carried) { p.carry = null; toy.carried = false; toy.heldBy = null; }
                else a.unplace(toy, toy.tx, toy.ty);
                const spot = [[4, 8], [5, 8], [3, 8], [6, 8], [4, 7], [5, 7]].find(([x, y]) => !a.at(nr.x + x, nr.y + y)) || [4, 8];
                toy.tx = nr.x + spot[0]; toy.ty = nr.y + spot[1]; toy.x = toy.tx * T; toy.y = toy.ty * T;
                a.place(toy, toy.tx, toy.ty);
                Fx.poof(toy.tx * T + 8, toy.ty * T + 8);
                UI.toast('The toy block wriggles free and bounces off back to the Nursery. (Toys away by bedtime.)', 160);
            }
        }
        /* the Moonwalk gate, latched once passed */
        const g = a.find('mwGate');
        if (g && g.openedOnce && !Progress.flag('slumber_mwGate')) Progress.set('slumber_mwGate');
    },
    *afterKnot() {
        Progress.set('d5');
        Progress.setGoal('Home to Hollowell. (Somebody at the clinic will want to hear all about it.)');
        yield* say(null, 'All through the house, very softly, every bed creaks at once, as if everyone in them had turned over in their sleep.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 3, r.y + 9, { to: 'hollow', tx2: SLUMBER_OUT.x, ty2: SLUMBER_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 3, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
SIGNATURE_TEXT.slumber = "Stitched into the rug, lavender on lavender, so you'd only see it lying down: a crescent moon and the letters D.M. Someone signed this House where they'd see it last thing at night.";

ITEM_LINES.bedroll = () => 'You found the {red}Bedroll{/}! Tap C to lay it down anywhere: that spot is home now. Hold C to go Homeward, flying back along your trace to it. What you carry comes too.';
ITEM_AFTER.bedroll = function* () { Inv.equipped = 'bedroll'; };
/* falling home in the Linen Cupboard mends the boards, and puts the lamps out */
Player.onLand.push(p => { const a = p.area; if (a && a.id === 'slumber') { const r = a.roomAt(p.tx, p.ty); if (r && r.key === '0,2') Slumber.linenReset(a); } });
