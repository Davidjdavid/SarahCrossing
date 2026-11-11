/* The Loom (D8): the First Spinner's own old place, in the Loomwood. Nobody made it for a Wanderer, nobody watches
   from underneath, nobody nudges. Nothing in it has a thread but the Loom's own old weights and its silk: the blocks
   lying about are offcuts, strays, and what you push stays pushed (a pit filled is filled for good; a block jammed in a
   corner is jammed: the offcut chutes drop another). The Shuttle guards the Shears. Then the weights' threads cut,
   iron dropped through silk, a thread cut while it's pulled tight; the Weaver's own rooms east of the weights (its
   larder, a bell's work; its warp walk, a needle's); and the Weaver itself, in its web over its own loom's well. */

THEMES.loomhouse = { floor: ['#a4aebe', '#8a94a4', '#c8d0dc', '#5a6070'], wall: ['#6a7484', '#4a4f5c', '#8a94a4', '#2a2e38'], stone: ['#8a94a4', '#6a7484', '#a4aebe', '#3a404c'], water: ['#8ac8e4', '#64a4cc', '#c0e4f4', '#3a6a96'], dark: '#1a1e26' };
FLOORS.loomhouse = {
    /* worn flagstones; a woven runner; the loom pit's dark */
    /* (four flags: plain, cracked, a dropped bit of silver thread, a darker one with a chipped corner) */
    floor: (x, th, v) => {
        fill(x, v === 3 ? '#9aa4b4' : '#a4aebe'); speckle(x, ['#b4bece', '#949eae'], 30 + v, 0.3);
        if (v === 1) { for (const [a, b] of [[3, 4], [4, 5], [5, 5], [6, 6], [7, 8], [8, 9], [8, 10]]) fill(x, '#7a8496', a, b, 1, 1); }
        if (v === 2) { for (const [a, b] of [[10, 11], [11, 11], [12, 10]]) fill(x, '#bcc6d4', a, b, 1, 1); }
        if (v === 3) { fill(x, '#7a8496', 1, 1, 2, 1); fill(x, '#7a8496', 1, 2, 1, 1); }
        fill(x, '#7a8496', 0, 15, 16, 1); fill(x, '#7a8496', 15, 0, 1, 16);
    },
    floor2: (x, th, v) => { fill(x, '#c8d0dc'); for (let i = 0; i < 16; i += 2) fill(x, '#aab7c8', 0, i, 16, 1); fill(x, '#e4ecf5', 0, 0, 1, 16); },
    floor3: (x, th, v) => { fill(x, '#3a404c'); for (let i = 1; i < 16; i += 3) fill(x, '#5a6070', i, 0, 1, 16); },
};
WALLS.loomhouse = {
    edge: '#1a1e26',
    top: (x) => { fill(x, '#3a404c'); speckle(x, ['#4a5060'], 10, 0.2); },
    face: (x, th, v) => { fill(x, '#6a7484'); for (let y = 3; y < 14; y += 5) fill(x, '#5a6070', 0, y, 16, 1); fill(x, '#e4ecf5', (v * 5) % 15, 0, 1, 14); fill(x, '#1a1e26', 0, 15, 16, 1); },
};

/* the Hanging Gallery's weights: hung out at the trench's west end, home along it, then down the far side to the east */
/* the Bridge Room's weight, wedged in its nook (and any spare dropped into the nook after it) */
const BR_WEDGED = { noPull: true, stitchName: 'the wedged weight', pullLine: 'Wedged in its nook, iron to the stone: no hand will get it out.',
    onPushed(p, d) { if (!this.canPush(d)) UI.toast('Wedged in its nook, iron to the stone: no hand will get it out.', 120); } };
function HANG_PATH(hx, hy, sx) {
    const p = [[hx, hy], [hx, 7]];
    for (let x = hx - 1; x >= 14; x--) p.push([x, 7]);
    p.push([14, 6], [14, 5]);
    for (let x = 14; x >= sx; x--) p.push([x, 4]);
    return p;
}

defHouse({
    id: 'loom', name: 'The Loom', place: 'The Loom', house: 'loom', theme: 'loomhouse', thread: THREAD.loom, music: 'loom',
    entry: LOOM_ENTRY, noNudges: true,
    drawOver: (a, cx, cy) => LoomHouse.drawOver(a, cx, cy),
    cells: {
        /* ---------------- 1 The Threshold: nothing here comes back ---------------- */
        '1,3': {
            name: 'The Threshold',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#ooooooooooooooooo.#',
                '#ooooooooooooooooo##',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'deco', x: 3, y: 0, look: 'wallhank', solid: false, baseY: -100 }, { k: 'deco', x: 15, y: 0, look: 'wallbobbins', solid: false, baseY: -100 },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: LOOM_OUT.x, ty2: LOOM_OUT.y, face: 'down', dir: 'down' },
                { k: 'stray', x: 5, y: 7, id: 'thStray1' }, { k: 'stray', x: 12, y: 7, id: 'thStray2' },
                { k: 'chute', x: 15, y: 9, drop: [15, 7], id: 'thChute' },
                { k: 'sign', x: 3, y: 9, text: 'Carved deep, very old: NOTHING HERE COMES BACK. (And under it, newer, small: SO MIND WHERE YOU PUSH IT. -L.)' },
            ],
        },
        /* ---------------- 2 The Warp Hall: the middle of the Loom ---------------- */
        '1,2': {
            name: 'The Warp Hall',
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
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'whLock' },
                { k: 'warpthread', x: 19, y: 5, len: 1, dir: 'v', id: 'whSilkE' },
                { k: 'deco', x: 6, y: 4, look: 'loomframe', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], text: 'A loom, bigger than a house, its warp threads running up into the dark. Half a cloth hangs from it, every colour of the valley, unfinished. The shuttle that should be in it is gone.' },
            ],
        },
        /* ---------------- 3 The Offcut Yard: strays, pits, and order (key) ---------------- */
        '0,2': {
            name: 'The Offcut Yard',
            rows: [
                '####################',
                '#..#........#......#',
                '#..#........#......#',
                '#ooo#.......#......#',
                '#ooo...............#',
                '#ooo................',
                '#..................#',
                '#.........######.###',
                '#.........#........#',
                '#.........#........#',
                '####################',
            ],
            ents: [
                { k: 'deco', x: 12, y: 0, look: 'wallhank', solid: false, baseY: -100 },
                { k: 'chest', x: 1, y: 1, item: 'key', id: 'oyKey' },
                { k: 'stray', x: 6, y: 6, id: 'oyS1' }, { k: 'stray', x: 8, y: 4, id: 'oyS2' }, { k: 'stray', x: 5, y: 8, id: 'oyS3' },
                { k: 'chute', x: 15, y: 9, drop: [14, 8], id: 'oyChute' },
                { k: 'sign', x: 17, y: 4, text: 'OFFCUTS. (Pull the chute and another drops. There are always more offcuts.)' },
            ],
        },
        /* ---------------- 4 The Shuttle Run: the Shuttle (the Shears) ---------------- */
        '1,1': {
            name: 'The Shuttle Run',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#,,,,,,,,,,,,,,,,,,#',
                '.,,,,,,,,,,,,,,,,,,.',
                '#,,,,,,,,,,,,,,,,,,#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'srBig' },
                { k: 'shuttle', x: 1, y: 5, id: 'shuttle' },
                { k: 'warpthread', x: 0, y: 5, len: 1, dir: 'v', id: 'srSilkW' },
                { k: 'chute', x: 8, y: 9, drop: [9, 7], id: 'srChute' },      /* (beside the door, not in it) */
                { k: 'chest', x: 9, y: 2, item: 'shears', id: 'srShears', hidden: true, when: 'flag:loom_shuttle', big: true },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'shuttle' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'shuttle' },
            ],
        },
        /* ---------------- 5 The Spinner's Room (behind the silk, west of the Run): the tapestry ---------------- */
        '0,1': {
            name: "The Spinner's Room",
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
                { k: 'deco', x: 6, y: 1, look: 'tapestry', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], text: "A tapestry, faded silver. A woman at a loom in a hard winter, tying a thread to everyone in a little valley so nobody would be lost in the snow. In the last panel the snow has melted, and she is still at the loom, holding all the threads." },
                { k: 'chest', x: 16, y: 2, item: 'heartpatch', id: 'spPatch' },
                { k: 'sign', x: 3, y: 8, text: 'Scratched into the floor, small: L. CUT HER WAY OUT OF HERE. YOU CAN TOO.' },
            ],
        },
        /* ---------------- 6 The Weighing Room: the old loom weights, cut free, fill the floor ---------------- */
        '2,2': {
            name: 'The Weighing Room',
            rows: [
                '###############.####',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '........ooo.........',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '##############.#####',
            ],
            ents: [
                { k: 'deco', x: 3, y: 0, look: 'wallbobbins', solid: false, baseY: -100 }, { k: 'deco', x: 11, y: 0, look: 'wallhank', solid: false, baseY: -100 },
                { k: 'loomweight', x: 4, y: 2, id: 'wrW1' }, { k: 'loomweight', x: 4, y: 8, id: 'wrW2' }, { k: 'loomweight', x: 5, y: 5, id: 'wrW3' },
                { k: 'chute', x: 1, y: 9, drop: [2, 8], id: 'wrChute', weights: true },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'wrEast' },
                { k: 'sign', x: 2, y: 9, text: 'The old loom weights, each on its silver thread. They have hung in the same places for longer than anyone remembers.' },
            ],
        },
        /* ---------------- 6b The Hanging Gallery, under the Weighing Room: two old weights asleep beyond a trench, each on its
           thread back to its hook up this side; ring them awake and they come home hanging over the trench: snip a thread
           (anywhere along it) while its weight is over the gap, and down it goes, and stays (the key) ---------------- */
        '2,3': {
            name: 'The Hanging Gallery',
            rows: [
                '##############.#####',
                '#..................#',
                '#..................#',
                '####...............#',
                '#oooooooooooooo#####',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'deco', x: 5, y: 0, look: 'wallhank', solid: false, baseY: -100 }, { k: 'deco', x: 9, y: 0, look: 'wallhank', solid: false, baseY: -100 },
                /* hung out over the trench on their threads (tied: a lever lets them go), home at the far end of the far side */
                { k: 'loomweight', x: 17, y: 8, id: 'hgW1', group: 'hang', tiedOff: true, hookable: false, noPush: true, startAt: [3, 4], trace: HANG_PATH(17, 8, 3) },
                { k: 'loomweight', x: 16, y: 8, id: 'hgW2', group: 'hang', tiedOff: true, hookable: false, noPush: true, startAt: [2, 4], trace: HANG_PATH(16, 8, 2) },
                { k: 'lever', x: 17, y: 2, release: 'hang' },
                { k: 'chest', x: 9, y: 8, item: 'key', id: 'wrKey' },
                { k: 'sign', x: 10, y: 1, text: 'Carved small on the wall: WHAT HANGS FROM A THREAD FALLS WHEN IT IS CUT. (And, smaller: wasted one? There are spares in the chute upstairs. -L.)' },
            ],
        },
        /* ---------------- 7 The Bridge Room: silk won't hold iron (the Pattern) ---------------- */
        '2,1': {
            name: 'The Bridge Room',
            rows: [
                '####################',
                '#........o.........#',
                '#......#.o.........#',
                '#.......#o.........#',
                '#........o.........#',
                '.........o..........',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '###############.####',
            ],
            ents: [
                { k: 'deco', x: 3, y: 0, look: 'wallbobbins', solid: false, baseY: -100 },
                { k: 'door', x: 15, y: 10, type: 'gate', when: 'brPlate', keep: true, dir: 'h', id: 'brLock' },     /* (a lock once: an old save that used its key here keeps the way open) */
                { k: 'door', x: 0, y: 5, type: 'gate', when: 'brPlate', dir: 'v', id: 'brWest' },
                { k: 'silkbridge', x: 9, y: 5, len: 1, dir: 'h', id: 'brBridge' },
                /* the one weight, wedged in a nook in the far wall of the drop, out over a strand of silk: no hand shifts it, so
                   only a stitch does; and a thing on its way to its place hangs on its thread over whatever's gone from under
                   it. (Old weights here, brW1 and brW2, are gone: whatever an older save did with them, this one is new.) The
                   chute in the nook's ceiling (worked from the far side) drops another only when the nook is empty; the
                   offcuts on this side can fill the strand's gap if it's gone before the weight has crossed */
                { k: 'loomweight', x: 8, y: 2, id: 'brW3', ...BR_WEDGED },
                { k: 'silkbridge', x: 9, y: 2, len: 1, dir: 'h', id: 'brNook' },
                { k: 'chute', x: 8, y: 1, drop: [8, 2], id: 'brChute', weights: true, spare: BR_WEDGED },
                { k: 'chute', x: 13, y: 1, drop: [13, 2], id: 'brOffcuts' },
                { k: 'plate', x: 12, y: 2, sig: 'brPlate', minWeight: 3 },
                { k: 'chest', x: 16, y: 2, item: 'pattern', id: 'brPattern', hidden: true, when: 'brPlate' },
                { k: 'sign', x: 18, y: 4, text: 'Silk will hold a girl. Silk will not hold iron.' },
            ],
        },
        /* ---------------- 7a The Larder, east of the Weighing Room (the Hanging Gallery's key): the Weaver's. It wraps the
           old weights it means to keep in silk and lays them down asleep where it likes. One sleeps beyond the gap with its
           thread trailing back across to this side and home again over there. A ring wakes it (the Belfry's way) and it's
           home in a flash, over the gap and back; but a thing on its way home waits behind anything it can't shove (the
           Tidyhouse's), and while it waits its thread is pulled tight: cut it, and it drops where it hangs ---------------- */
        '3,2': {
            name: 'The Larder',
            rows: [
                '#############.######',
                '###########o.......#',
                '###########o.......#',
                '#..........o.......#',
                '#..........o.......#',
                '...........o.......#',
                '#..........o.......#',
                '#..........o.......#',
                '#..........o.......#',
                '#..........o.......#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 13, y: 0, type: 'gate', when: 'lrPlate', dir: 'h', keep: true, id: 'lrGate' },
                { k: 'plate', x: 18, y: 2, sig: 'lrPlate', minWeight: 3 },
                /* (each lies where startAt says; its home and the way it was dragged there are its trace) */
                { k: 'wrapped', x: 18, y: 2, id: 'lrW2', startAt: [16, 5], trace: [[18, 2], [18, 3], [18, 4], [17, 4], [16, 4], [16, 5]] },
                { k: 'wrapped', x: 15, y: 1, id: 'lrW1', resetSleep: true, startAt: [14, 7],
                    trace: [[15, 1], [15, 2], [15, 3], [14, 3], [13, 3], [12, 3], [11, 3], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7]] },
                { k: 'deco', x: 9, y: 7, look: 'warppost', text: "An old warping post, sunk deep in the floor: a great spool on top, its wood worn silver where a thousand threads were wound." },
                { k: 'deco', x: 2, y: 8, look: 'cocoon', text: 'Something wrapped round and round in grey silk, the size of a sack of flour. Whatever it was, the Weaver meant to keep it.' },
                { k: 'deco', x: 4, y: 9, look: 'cocoon2', solid: [[0, 0]] }, { k: 'deco', x: 1, y: 3, look: 'cocoon2', solid: [[0, 0]] },
                { k: 'deco', x: 5, y: 2, look: 'wallhank', solid: false, baseY: -100 }, { k: 'deco', x: 17, y: 0, look: 'wallhank', solid: false, baseY: -100 },
                { k: 'sign', x: 3, y: 5, text: 'Scratched small on a flagstone: IT WRAPS UP WHAT IT KEEPS AND LAYS IT DOWN TO SLEEP. NOTHING WAKES THEM BUT A BELL. -L.' },
            ],
        },
        /* ---------------- 7b The Warp Walk, north of the Larder: a ledge along the wall over a drop, the way on at its far end
           over one more gap. Its one weight stands at the near end of the ledge, right at the edge: hook it from across
           the gap and the line sets you down in front of it, in the gap. Give it a new place further along (the Needle:
           it reaches over gaps), hook over, cut it free, and push it into the last gap (strays fill holes) ---------------- */
        '3,1': {
            name: 'The Warp Walk',
            rows: [
                '####################',
                '#########..........#',
                '#########..........#',
                '#########..........#',
                '#########..........#',
                '.o,,,,,,o,,,,,.....#',
                '#oooooooo....,.....#',
                '#########....,.....#',
                '#########....,.....#',
                '#########....,.....#',
                '#############.######',
            ],
            ents: [
                { k: 'loomweight', x: 7, y: 5, id: 'wwW', stitchName: 'the old weight' },
                { k: 'deco', x: 12, y: 1, look: 'creel', solid: [[0, 0], [1, 0], [2, 0], [3, 0]], text: 'A creel: a great rack of spools, every one wound full of silver thread and never used.' },
                { k: 'deco', x: 17, y: 8, look: 'spinwheel', text: "A spinning wheel, very old. Its treadle still turns. Its spindle's wound with grey silk, not silver: the Weaver's been at it." },
                { k: 'deco', x: 3, y: 4, look: 'wallhank', solid: false, baseY: -100 }, { k: 'deco', x: 6, y: 4, look: 'wallbobbins', solid: false, baseY: -100 },
                { k: 'deco', x: 10, y: 0, look: 'wallbobbins', solid: false, baseY: -100 },
                { k: 'sign', x: 15, y: 9, text: 'THE WARP WALK. The old weights hung along here once, keeping the warp straight and true. Mind the drop.' },
            ],
        },
        /* ---------------- 8 The Web: the Weaver, over the well of the First Spinner's own loom ---------------- */
        '1,0': {
            name: 'The Web',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#........oo........#',
                '#........oo........#',
                '#........oo........#',
                '#........oo........#',
                '#........oo........#',
                '#........oo........#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'webloom', x: 1, y: 2 },
                { k: 'loomwell', x: 9, y: 3 },
                { k: 'weaver', x: 9, y: 5, id: 'weaver' },
                /* its web's four anchors, each holding its own way (src/72b_loom_foes.js): wound in a cocoon and asleep; tied
                   plain; tied long and hanging slack; and up into the loom's cloth over the well's head */
                { k: 'anchor', x: 5, y: 4, id: 'anA', way: 'asleep' }, { k: 'anchor', x: 5, y: 7, id: 'anC' }, { k: 'anchor', x: 14, y: 7, id: 'anD', way: 'slack' },
                { k: 'loomanchor', x: 10, y: 1, id: 'anB' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'weaver' },
            ],
        },
    },
    afterKnot: function* () { },
});

/* the offcut chute: pull it, and another offcut (a stray block) drops where the last one would land */
class Chute extends GridThing {
    constructor(tx, ty, p = {}) { super('chute', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); }
    interact() {
        const a = this.area, [x, y] = this.drop.map((v, i) => v + (i ? a.roomAt(this.tx, this.ty).y : a.roomAt(this.tx, this.ty).x));
        const p = G.player, k = a.kind(x, y);
        if (a.at(x, y) || (p.tx === x && p.ty === y) || k.solid || k.pit) { UI.toast("The chute rattles. There's no room under it for another."); Sfx.play('hitthing'); return true; }
        /* offcuts are middling things (silk holds them; an iron plate doesn't notice them); some chutes drop spare weights */
        const b = a.add(this.weights ? new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'loomweight', thread: THREAD.loom, patience: 150 }, this.spare || {})) : new Block(x, y, { marked: false, weight: WEIGHT.medium }));
        b.skey = 'chute:' + G.t;
        if (this.weights && !Progress.flag('spare_weight')) { Progress.set('spare_weight'); G.pendingToast = 'A spare weight clanks down, on its own silver thread.'; }
        Fx.poof(x * T + 8, y * T + 4); Sfx.play('land'); G.shake = 3; Stats.count('offcuts');
        return true;
    }
    sprite() { return spr('chute'); }
}
SPAWN.chute = (x, y, p) => new Chute(x, y, p);

/* the Loom's old weights: heavy iron, each on its own silver thread (cut it, and it's an offcut like the rest) */
SPAWN.loomweight = (x, y, p) => new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'loomweight', thread: THREAD.loom, patience: 150 }, p));
/* the Weaver's larder: an old weight wrapped in its silk and laid down asleep where it was dropped (a sleeper: a ring
   wakes it, and home it goes) */
SPAWN.wrapped = (x, y, p) => {
    const b = SPAWN.loomweight(x, y, Object.assign({ sleeper: true, tiedOff: true, hookable: false, stitchName: 'the wrapped weight' }, p));
    b.sprite = function () { return spr(Return.asleep(this) ? 'loomweight_wrapped' : 'loomweight'); };
    return b;
};
/* silk won't hold iron: no heavy thing can be given a place on a silk bridge (it would only go through it) */
{
    const confirm0 = Needle.confirm;
    Needle.confirm = function (p) {
        const st = this.st, e = st && st.thing, end = st && st.path[st.path.length - 1];
        if (e && st.path.length > 1 && e.weight >= WEIGHT.heavy && e.area.ents.some(o => o.kind === 'warpthread' && o.bridge && !o.gone && o.cutAt(end[0], end[1]))) {
            UI.toast("Silk won't hold iron: that's no place for it."); Sfx.play('hitthing'); return;
        }
        return confirm0.call(this, p);
    };
}

/* the First Spinner's own loom, across the north of the Web: a great frame of beams, the warp still strung, the cloth half
   woven; the breast-beam in front, with a line of words cut in it (under the Weaver's silk till it's beaten) */
class WebLoom extends Prop {
    constructor(tx, ty) {
        super(tx, ty, { im: ART.webloom, solid: [], oy: 16 - ART.webloom.height });
        for (let dx = 0; dx < 18; dx++) this.solid.push([dx, -1], [dx, 0]);
        this.baseY = ART.webloom.height;
    }
    interact() {
        Script.run(function* () { yield* say(null, Progress.flag('loom_boss') ? 'The First Spinner\'s loom. On the breast-beam, cut deep: I MEANT TO UNPICK THEM IN THE SPRING.' : "The First Spinner's own loom: a great frame of beams, its warp still strung, the cloth on it only half woven. In front of the breast-beam the floor drops away into the loom's well, where the finished cloth should run down."); });
        return true;
    }
    talkBox(p, f) { return this.solid.some(([dx, dy]) => this.tx + dx === f.tx && this.ty + dy === f.ty); }
    draw(cx, cy) {
        Gfx.img(this.im, this.x - cx, this.y - cy);
        /* the words on the breast-beam, under a pad of grey silk while the Weaver keeps the loom */
        if (!Progress.flag('loom_boss')) {
            /* (strands wound every which way, thick in the middle, wisps at the ends) */
            const x = this.x - cx + 118, y = this.y - cy + this.im.height - 15;
            Gfx.alpha(0.55); Gfx.rect(x + 6, y + 2, 40, 6, '#c8d0dc'); Gfx.alpha(1);
            for (let i = 0; i < 14; i++) {
                const a = (i * 7) % 48, b = (i * 13 + 5) % 48;
                Gfx.line(x + a, y + (i % 3), x + 4 + b * 0.8, y + 9 - (i % 2) * 2, i % 3 ? '#e4ecf5' : '#aab7c8');
            }
        }
    }
}
SPAWN.webloom = (x, y) => new WebLoom(x, y);
/* the loom's well: a deep slot in the floor where the cloth should run down, the old warp hanging into it and lying in a
   tangle at the bottom (the Weaver hauls the warp up out of it in its last beat) */
class LoomWell extends Ent {
    constructor(tx, ty) { super('loomwell'); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.floor = true; this.bare = false; }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy, h = 6 * T;
        if (!this.bare) for (let i = 0; i < 7; i++) { const sw = Math.round(Math.sin((G.t + i * 23) / 40)); Gfx.line(x + 3 + i * 4.5, y - 2, x + 3 + i * 4.5 + sw, y + h - 8, i % 2 ? '#aab7c8' : '#6a7484'); }
        /* the tangle at the bottom */
        Gfx.alpha(0.8);
        for (let i = 0; i < 9; i++) Gfx.line(x + 2 + ((i * 7) % 27), y + h - 13 + (i % 3) * 3, x + 6 + ((i * 11) % 24), y + h - 4 - (i % 2) * 3, i % 2 ? '#8a94a4' : '#5a6070');
        Gfx.alpha(1);
    }
}
SPAWN.loomwell = (x, y) => new LoomWell(x, y);
/* silk won't hold iron: a heavy thing on a silk bridge goes through it */
{
    const landed0 = GridThing.prototype.landed;
    GridThing.prototype.landed = function (returning) {
        if (this.weight >= WEIGHT.heavy && this.area) {
            const br = this.area.ents.find(e => e.kind === 'warpthread' && e.bridge && !e.gone && e.cutAt(this.tx, this.ty));
            if (br) { Sfx.play('snip'); br.onCut(); return; }
        }
        return landed0.call(this, returning);
    };
}

const LoomHouse = {
    *afterWeaver(w) {
        const a = w.area, r = a.rooms.find(q => q.key === '1,0');
        Music.play('silence');
        yield 40;
        yield* say(null, "The Weaver curls up in the well of its own loom and lies there, a heap of grey silk, still at last. What's left of its web sags and parts and drifts down like snow.");
        yield* say(null, "The silk on the loom's breast-beam falls away with it. Under it, someone long ago cut a line of words with a very sharp blade: I MEANT TO UNPICK THEM IN THE SPRING. -THE FIRST SPINNER.");
        a.add(new Pickup((r.x + LOOM_HEART[0]) * T, (r.y + LOOM_HEART[1]) * T, { what: 'heartstitch', id: 'loomHeart' }));
        Sfx.play('appear');
        Progress.set('loom_boss'); Progress.set('d8');
        Progress.setGoal("The Shears can cut anyone free. The town, first? And then the fog at the Frayed Edge, and your own thread.");
        Music.play('loom');
        Save.autosave();
    },
    /* over everything: what's left of the web, drifting down */
    drawOver(a, cx, cy) { const w = a.ents.find(e => e.kind === 'weaver'); if (w && w.drawSnow) w.drawSnow(cx, cy); },
};
const LOOM_HEART = [10, 9];     /* (at the foot of the well, in front of the door) */
HOUSE_AFTER.loom = { flag: 'd8', room: '1,0', heart: LOOM_HEART, heartId: 'loomHeart', noHoop: true };

function initLoom() {
    defSprite('chute', ['....kkkkkkkk....', '....kmmmmmmk....', '....kmkkkkmk....', '....kmk..kmk....', '....kmk..kmk....', '...kkmkkkkmkk...', '...kmmmmmmmmk...', '...kmMMMMMMmk...', '...kkkkkkkkkk...', '.....k....k.....', '....kkk..kkk....', '...kwwwk.kwwk...', '...kkkk..kkkk...', '................', '................', '................'], { m: '#8a94a4', M: '#6a7484', w: '#e4ecf5' });
    defSprite('loomweight', ['.......kk.......', '.......ww.......', '.......ww.......', '......kkkk......', '.....kiiiik.....', '....kiIiiiik....', '...kiiiiiiiik...', '...kiiiiiiiik...', '..kiiiiiiiiiik..', '..kiiiiiiiiiik..', '..kiiiiiiiiiik..', '..kIiiiiiiiiIk..', '..kIIIIIIIIIIk..', '...kkkkkkkkkk...', '................', '................'], { i: '#7a8496', I: '#5a6070', w: '#e4ecf5' });
    ART.loomframe = paintSprite(128, 40, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 0, 30, 128, 6); R('#6a4630', 2, 0, 6, 36); R('#6a4630', 120, 0, 6, 36); R('#8a5a3a', 0, 2, 128, 4); for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#e4ecf5' : '#aab7c8'; x.fillRect(10 + i * 2.7, 6, 1, 24); } const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory, THREAD.guild, THREAD.wren]; for (let j = 0; j < 8; j++) R(cols[j], 10, 18 + j, 70, 1); });
    ART.tapestry = paintSprite(128, 28, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#6a7484', 0, 0, 128, 28); R('#c8d0dc', 2, 2, 124, 24); for (let k = 0; k < 4; k++) { R('#e4ecf5', 4 + k * 31, 4, 28, 20); R('#5a6070', 12 + k * 31, 8, 6, 12); for (let i = 0; i < 6; i++) R(['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8'][i], 18 + k * 31 + i, 10, 1, 8 + k * 2); } R('#8fd46a', 104, 6, 20, 4); });
    SPR.loomframe = ART.loomframe; SPR.tapestry = ART.tapestry;
    /* small things on the Loom's walls, each inside its own wall tile: a hank of silver on a hook; a shelf of bobbins */
    ART.wallhank = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#2a2e38', 7, 1, 2, 2); R('#4a4f5c', 7, 3, 1, 2); R('#e4ecf5', 5, 5, 6, 1); R('#e4ecf5', 4, 6, 1, 6); R('#e4ecf5', 11, 6, 1, 6); R('#c8d0dc', 6, 6, 1, 7); R('#c8d0dc', 9, 6, 1, 7); R('#e4ecf5', 5, 12, 6, 1); R('#a4aebe', 7, 7, 2, 5); });
    ART.wallbobbins = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 1, 11, 14, 2); R('#3a2618', 2, 13, 1, 2); R('#3a2618', 13, 13, 1, 2); for (const [i, c] of [[2, '#d6304e'], [6, '#5ab85a'], [10, '#5a8ad6']]) { R('#c9925a', i, 4, 4, 1); R(c, i, 5, 4, 5); R('#c9925a', i, 10, 4, 1); } });
    SPR.wallhank = ART.wallhank; SPR.wallbobbins = ART.wallbobbins;
    const line = (x, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; x.fillStyle = c; for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
    const oval = (x, cx, cy, rx, ry, colFn) => { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) { if ((i * i) / (rx * rx) + (j * j) / (ry * ry) > 1.05) continue; const c = colFn(i / rx, j / ry, cx + i, cy + j); if (c) { x.fillStyle = c; x.fillRect(cx + i, cy + j, 1, 1); } } };
    /* the First Spinner's loom (the Web): the warp strung from the top beam, the cloth woven only so far, the uprights,
       and the breast-beam in front with its words cut in the middle */
    ART.webloom = paintSprite(288, 56, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#3a404c', 12, 9, 264, 32);
        for (let i = 0; i < 88; i++) R(i % 2 ? '#e4ecf5' : '#aab7c8', 13 + i * 3, 9, 1, 32);
        const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory, THREAD.guild, THREAD.linnet, THREAD.wren];
        for (let j = 0; j < 12; j++) { R(cols[j % cols.length], 13, 29 + j, 150 + ((j * 53) % 41), 1); R(shade(cols[j % cols.length], -0.25), 13, 29 + j, 2, 1); }
        for (let i = 0; i < 50; i++) R('#e4ecf5', 13 + i * 3, 29 + (i % 2) * 4, 1, 2);
        R('#4a301e', 0, 0, 288, 9); R('#7a4e32', 0, 1, 288, 4); R('#a8744c', 0, 1, 288, 1);
        for (const ux of [0, 276]) { R('#5a3a26', ux, 0, 12, 56); R('#8a5a3a', ux + 1, 0, 3, 56); R('#3a2618', ux + 10, 0, 2, 56); for (const y of [12, 30]) { R('#3a404c', ux, y, 12, 2); R('#8a94a4', ux, y, 12, 1); } }
        R('#6a4630', 4, 40, 280, 14); R('#a8744c', 4, 40, 280, 3); R('#c9925a', 4, 40, 280, 1); R('#4a301e', 4, 52, 280, 2);
        for (const ux of [14, 262]) { R('#3a404c', ux, 42, 12, 10); R('#8a94a4', ux + 3, 44, 6, 6); R('#2a2e38', ux + 5, 46, 2, 2); }
        for (let i = 0; i < 15; i++) R('#3a2618', 122 + i * 3, 45 + (i % 2), 2, 2);
    });
    /* the Larder: an old warping post with a great spool on top; things wrapped up in the Weaver's silk */
    ART.warppost = paintSprite(16, 28, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#7a8496', 1, 23, 14, 5); R('#a4aebe', 1, 23, 14, 1); R('#5a6070', 1, 27, 14, 1);
        R('#6a4630', 4, 8, 8, 16); R('#8a5a3a', 4, 8, 2, 16); R('#4a301e', 10, 8, 2, 16); R('#3a404c', 3, 15, 10, 2); R('#8a94a4', 3, 15, 10, 1);
        R('#8a5a3a', 1, 0, 14, 2); R('#e4ecf5', 2, 2, 12, 5); R('#aab7c8', 2, 3, 12, 1); R('#aab7c8', 2, 5, 12, 1); R('#8a5a3a', 1, 7, 14, 2); R('#b07848', 2, 0, 6, 1);
    });
    /* (wound round and round: bands of darker silk across a pale bundle, a loose end trailing) */
    const wrapped = (i, j, X, Y, k) => (j < -0.5 && i < 0.1) ? '#f4f7fb' : ((X + Y * k) % 4 === 0 ? '#8a94a4' : (i + j > 0.7 ? '#aab7c8' : '#d4dbe5'));
    ART.cocoon = paintSprite(14, 20, x => { oval(x, 7, 11, 5, 8, (i, j, X, Y) => wrapped(i, j, X, Y, 2)); line(x, 7, 0, 7, 3, '#c8d0dc'); line(x, 9, 18, 12, 19, '#aab7c8'); });
    ART.cocoon2 = paintSprite(18, 12, x => { oval(x, 9, 6, 8, 4, (i, j, X, Y) => wrapped(i, j, X, Y, -2)); line(x, 16, 8, 17, 11, '#aab7c8'); });
    defSprite('loomweight_wrapped', ['.......kk.......', '.......ww.......', '......kwwk......', '......kkkk......', '.....kwwiik.....', '....kiIwwiik....', '...kiiiiwwiik...', '...kwwiiiiwwk...', '..kiiwwiiiiiwk..', '..kiiiiwwiiiik..', '..kwiiiiiwwiik..', '..kIwwiiiiiwwk..', '..kIIIIwwIIIIk..', '...kkkkkkkkkk...', '................', '................'], { i: '#7a8496', I: '#5a6070', w: '#e4ecf5' });
    /* the Warp Walk: a creel of spools, full and never used; an old spinning wheel with the Weaver's grey silk on it */
    ART.creel = paintSprite(64, 26, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#5a3a26', 0, 0, 3, 26); R('#5a3a26', 61, 0, 3, 26); R('#6a4630', 0, 2, 64, 2); R('#6a4630', 0, 12, 64, 2); R('#6a4630', 0, 22, 64, 3); R('#8a5a3a', 0, 22, 64, 1);
        for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const sx = 6 + i * 9, sy = 4 + r * 10; R('#c9925a', sx, sy, 7, 1); R(i % 2 ? '#e4ecf5' : '#c8d0dc', sx, sy + 1, 7, 6); R('#aab7c8', sx, sy + 3, 7, 1); R('#c9925a', sx, sy + 7, 7, 1); }
    });
    ART.spinwheel = paintSprite(24, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        for (let a = 0; a < 56; a++) { const t = a / 56 * Math.PI * 2; R('#8a5a3a', Math.round(10 + Math.cos(t) * 8), Math.round(9 + Math.sin(t) * 8), 1, 1); }
        for (let k = 0; k < 3; k++) { const t = k / 3 * Math.PI; line(x, Math.round(10 + Math.cos(t) * 7), Math.round(9 + Math.sin(t) * 7), Math.round(10 - Math.cos(t) * 7), Math.round(9 - Math.sin(t) * 7), '#6a4630'); }
        R('#4a301e', 9, 8, 3, 3);
        R('#5a3a26', 2, 18, 20, 2); R('#5a3a26', 3, 20, 2, 4); R('#5a3a26', 19, 20, 2, 4); R('#5a3a26', 9, 11, 2, 7);
        R('#5a3a26', 19, 6, 2, 12); R('#9aa4b2', 17, 3, 6, 4); R('#c8d0dc', 17, 3, 6, 1);
    });
}
CONTENT_INIT.push(initLoom);
ITEM_LINES.shears = () => "You found the {red}Shears{/}: the First Spinner's own. Face something with a thread (or its cord, from below) and press [tool]: snip. It's a stray now, for good. People too. And, at the fog, your own.";
ITEM_AFTER.shears = function* () { Inv.equipped = 'shears'; };
