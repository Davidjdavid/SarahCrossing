/* The Loom (D8): the First Spinner's own old place, in the Loomwood. Nobody made it for a Wanderer, nobody watches
   from underneath, nobody nudges. Nothing in it has a thread but the Loom's own old weights and its silk: the blocks
   lying about are offcuts, strays, and what you push stays pushed (a pit filled is filled for good; a block jammed in a
   corner is jammed: the offcut chutes drop another). The Shuttle guards the Shears. Then the weights' threads cut,
   iron dropped through silk, and the Weaver in its web over its own loom. */

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
                '#ooo........#......#',
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
                { k: 'deco', x: 6, y: 1, look: 'tapestry', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], text: "A tapestry, faded silver. A woman at a loom in a hard winter, tying a thread to everyone in a little valley so nobody would be lost in the snow. In the last panel the snow has melted, and she is still at the loom, holding all the threads, and she has not let go. Stitched underneath: SHE MEANT TO UNPICK THEM IN THE SPRING." },
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
                '........ooo........#',
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
                { k: 'sign', x: 10, y: 1, text: 'Carved small on the wall: WHAT HANGS FROM A THREAD FALLS WHEN IT IS CUT. (And, smaller: a slack thread slides off the blades. A tight one parts anywhere. -L.)' },
            ],
        },
        /* ---------------- 7 The Bridge Room: silk won't hold iron (the Pattern) ---------------- */
        '2,1': {
            name: 'The Bridge Room',
            rows: [
                '####################',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '.........o.........#',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '#........o.........#',
                '###############.####',
            ],
            ents: [
                { k: 'deco', x: 3, y: 0, look: 'wallbobbins', solid: false, baseY: -100 },
                { k: 'door', x: 15, y: 10, type: 'lock', id: 'brLock' },
                { k: 'chute', x: 1, y: 1, drop: [2, 2], id: 'brChute', weights: true },
                { k: 'door', x: 0, y: 5, type: 'gate', when: 'brPlate', dir: 'v', id: 'brWest' },
                { k: 'silkbridge', x: 9, y: 5, len: 1, dir: 'h', id: 'brBridge' },
                { k: 'loomweight', x: 4, y: 3, id: 'brW1' }, { k: 'loomweight', x: 4, y: 7, id: 'brW2' },
                { k: 'plate', x: 14, y: 5, sig: 'brPlate', minWeight: 3 },
                { k: 'chest', x: 16, y: 2, item: 'pattern', id: 'brPattern', hidden: true, when: 'brPlate' },
                { k: 'sign', x: 2, y: 9, text: 'Silk will hold a girl. Silk will not hold iron.' },
            ],
        },
        /* ---------------- 8 The Web: the Weaver ---------------- */
        '1,0': {
            name: 'The Web',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#........::........#',
                '#........::........#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'weaver', x: 9, y: 5, id: 'weaver' },
                { k: 'anchor', x: 2, y: 2, id: 'anA' }, { k: 'anchor', x: 17, y: 2, id: 'anB' }, { k: 'anchor', x: 2, y: 8, id: 'anC' }, { k: 'anchor', x: 17, y: 8, id: 'anD' },
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
        const b = a.add(this.weights ? new Block(x, y, { weight: WEIGHT.heavy, look: 'loomweight', thread: THREAD.loom, patience: 150 }) : new Block(x, y, { marked: false, weight: WEIGHT.medium }));
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
        yield* say(null, "The Weaver drops into the well of its own loom and lies there, a heap of grey silk, still at last. The web it hung in sags and parts and drifts down like snow.");
        yield* say(null, "Under the web, on the loom's breast-beam, someone long ago cut a line of words with a very sharp blade: I MEANT TO UNPICK THEM IN THE SPRING. -THE FIRST SPINNER.");
        a.add(new Pickup((r.x + 9) * T, (r.y + 8) * T, { what: 'heartstitch', id: 'loomHeart' }));
        Sfx.play('appear');
        Progress.set('loom_boss'); Progress.set('d8');
        Progress.setGoal("The Shears can cut anyone free. The town, first? And then the fog at the Frayed Edge, and your own thread.");
        Music.play('loom');
        Save.autosave();
    },
};
HOUSE_AFTER.loom = { flag: 'd8', room: '1,0', heart: [9, 8], heartId: 'loomHeart', noHoop: true };

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
}
CONTENT_INIT.push(initLoom);
ITEM_LINES.shears = () => "You found the {red}Shears{/}: the First Spinner's own. Face something with a thread (or its cord, from below) and press C: snip. It's a stray now, for good. People too. And, at the fog, your own.";
ITEM_AFTER.shears = function* () { Inv.equipped = 'shears'; };
