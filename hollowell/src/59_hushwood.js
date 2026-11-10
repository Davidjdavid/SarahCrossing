/* Hushwood (overworld block 2,1): a dim wood of giant mushrooms and moss where everything is asleep. The road in
   from town is blocked by Old Hummock, a giant asleep across it since before Gran was born; the Recall Bell
   wakes him, and he lumbers home to his own bed in the north-west. The hollow where he lay goes down (S16: it's
   a long way down, so only with a Bedroll laid up top to come home to). Bouncy moss hops you over the stream to
   the Slumberhouse (House 5, Doctor Mallow's); sleep puffs line the trail through Puffball Hollow; Snorelings
   doze in the ferns; Hettie the forager camps by Lantern Pond, where a weir (wound open from this side only)
   lets a raft run down the channel to the lake at Millwater. The cliff stair up the east side stays walled off.
   Map drafted by tools/mapgen/hushwood.py. */

const SLUMBER_ENTRY = { x: 29, y: 42 };
const HUSH = (x, y) => [128 + x, 40 + y];
const GIANT_BED = { x: 3, y: 4 };

const HUSHWOOD_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.k......YYYY...........YYYYY........YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........YYYY.XXXXXXXXXXYYYYY#...b...YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........YYYY.XXXXXXXXXXYYYYY#k......YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........YYYY.XXXXXXXXXXYYYYY#.......YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........YYYY.XXXXXXXXXXYYYYY#....M..YY##:H:##YYYYYYYYYYYYYYYYY',
    'YY....M...YYYY.XXXXXXXXXXYYYYY#....k..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY.............XXXX:XXXXXYYYYY#....k..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........::::::::.....YYYYY#.......YY##:::##YYYYYYYYYYYYYYYYY',
    'YYk."b...,..:................YYvvvvvvvYY##:::##YYYYYYYYYYYYYYYYY',
    'YY....k.....:.........M......YY.....YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.~~~~~~~~~~~~~~~~~~~~~~~~~~..,....YYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YY.~~~~~~~~~~~~~~~~~~~~~~~~~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYY.....:........k.....~~..,..:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYY.....:.......YYYYYY.~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........:.......YYYYYY.~~.."..:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY......b...:.......YYYYYY.~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........:.......YYYYYY.~~..qk.:.YYYY##:H:##YYYYYYYYYYYYYYYYY',
    ':::::::::::::::............~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    ':::::::::::::::::::::::::::__::::::.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.........................~~.......YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..................M......~~..YYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY......:.k...qM........"..~~..YYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:.......kYYYYYYY...~~.qYYYYYYYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YYYYY...:.......,YYYYYYY...~~..YYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:..b"....YYYYYYY,"~~~~~~~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:..M.....YYYYYYY.-~~~~~~~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY.".:........,".....:-~~~~~~~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:...............:.~~~~~~~~~-..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY.M....:::::::::::::::::.~~~~~~~~~-..YY##:H:##YYYYYYYYYYYYYYYYY',
    'YY........................~~~~~~~~~.".YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........,b.YYYYYYYYYY.k.-b.VV""YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.q..k......YYYYYYYYYY....b.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY...........YYYYYYYYYYq...b.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY...........YYYYYYYYYY....b.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYY.VV..YYYYYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYY.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
];

defBlock({
    id: 'hushwood', bx: 2, by: 1, name: 'Hushwood', theme: 'hush', music: 'hush',
    rows: HUSHWOOD_ROWS,
    forest: ['tree_hush', 'tree_hush', 'pine'],
    legend: {
        'M': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'mushroom_big', solid: [[0, 0], [1, 0]], ox: -8, oy: -26 } },
        'k': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'mushrooms', solid: false } },
        'q': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'glowcaps', solid: false } },
    },
    ents: [
        /* the sleeping road */
        { k: 'giant', x: 1, y: 18, id: 'giant' },
        { k: 'hollowhole', x: 3, y: 16, id: 'hollowHole', if: 'giant_awake' },
        { k: 'sign', x: 9, y: 18, text: 'HUSHWOOD. Please do not wake anything.' },
        { k: 'rest', x: 10, y: 16 },
        { k: 'snoreling', x: 15, y: 22, id: 'hwSnore1' },
        /* over the stream to the Slumberhouse: bouncy moss, one each way */
        { k: 'moss', x: 12, y: 14, dir: 'up', dist: 3, id: 'hwMossN' },
        { k: 'moss', x: 10, y: 11, dir: 'down', dist: 3, id: 'hwMossS' },
        { k: 'sign', x: 11, y: 15, text: 'MIND THE MOSS. It is VERY bouncy. (The stream is cold.)' },
        { k: 'building', x: 15, y: 3, w: 10, h: 6, door: 4, art: 'slumber' },
        { k: 'warp', x: 19, y: 8, to: 'slumber', tx2: SLUMBER_ENTRY.x, ty2: SLUMBER_ENTRY.y, face: 'up', dir: 'up' },
        { k: 'sign', x: 17, y: 9, text: 'THE SLUMBERHOUSE. Visiting hours: whenever you wake up. Doctor M.' },
        { k: 'puffball', x: 9, y: 10, id: 'hwPuffN' },
        /* Old Hummock's own bed */
        { k: 'giantbed', x: 2, y: 4 },
        /* Puffball Hollow */
        { k: 'sign', x: 9, y: 23, text: "PUFFBALL HOLLOW. Don't breathe in. (Honestly.)" },
        { k: 'puffball', x: 9, y: 25, id: 'hwPuff1' }, { k: 'puffball', x: 7, y: 28, id: 'hwPuff2' }, { k: 'puffball', x: 14, y: 29, id: 'hwPuff3' }, { k: 'puffball', x: 19, y: 31, id: 'hwPuff4' },
        { k: 'snoreling', x: 12, y: 26, id: 'hwSnore2' }, { k: 'snoreling', x: 5, y: 33, id: 'hwSnore3' },
        /* Hettie's camp */
        { k: 'deco', x: 3, y: 31, look: 'tent', solid: [[0, 0], [1, 0]], ox: 0, oy: -12, text: "Hettie's tent. It's been pitched here a long time: there's moss growing up the guy ropes." },
        { k: 'campfire', x: 8, y: 33 },
        { k: 'npc', who: 'hettie', x: 6, y: 33, face: 'right' },
        /* Lantern Pond and the weir down to the lake */
        { k: 'raft', x: 26, y: 29, id: 'hwRaft' },
        { k: 'winch', x: 25, y: 31, id: 'hwWinch' },
        { k: 'door', x: 29, y: 32, type: 'gate', when: 'flag:hush_weir', dir: 'h', id: 'hwWeirA' },
        { k: 'door', x: 30, y: 32, type: 'gate', when: 'flag:hush_weir', dir: 'h', id: 'hwWeirB' },
        { k: 'sign', x: 23, y: 28, text: 'LANTERN POND. The channel runs down to the Reaches. Wind the weir to let a boat through.' },
        /* the far bank: the plateau over the ledge (bouncy moss up, the ledge down) */
        { k: 'moss', x: 34, y: 12, dir: 'up', dist: 3, id: 'hwMossE' },
        { k: 'chest', x: 36, y: 4, item: 'heartpatch', id: 'hwPatch' },
        { k: 'snoreling', x: 32, y: 16, id: 'hwSnore4' },
        { k: 'puffball', x: 33, y: 13, id: 'hwPuffE' },
        /* the cliff stair, as it was */
        { k: 'sign', x: 43, y: 37, text: 'THE CLIFF STAIR. Up to Belfry Heights. (Hushwood is through the trees. Nobody goes into Hushwood.)' },
        { k: 'rest', x: 44, y: 20 },
    ],
    regions: [
        { name: 'The Sleeping Road', x: 0, y: 14, w: 20, h: 8 },
        { name: 'The Slumberhouse', x: 2, y: 2, w: 27, h: 10 },
        { name: 'Puffball Hollow', x: 2, y: 22, w: 22, h: 14 },
        { name: 'Lantern Pond', x: 24, y: 21, w: 15, h: 19 },
        { name: 'The Far Bank', x: 29, y: 2, w: 10, h: 19 },
        { name: 'The Cliff Stair', x: 40, y: 0, w: 7, h: 40 },
    ],
});

PEOPLE_DEF.hettie = { name: 'Hettie', col: '#c8a868', look: { body: 'adult', hair: 'bun', hairC: '#8a8a8a', top: '#6a8a5a', accent: '#e8c08a', bottom: '#5a4a3a', skin: 'tan' } };
TALK.hettie = function* () {
    if (!Progress.flag('met:hettie')) {
        Progress.set('met:hettie');
        yield* say('hettie', "Well! A person! Awake! You'll be the Wanderer. Hettie. I pick mushrooms. Or I did, until that great lump fell asleep across the road and I couldn't get home.");
        yield* say('hettie', "That was... oh, a while ago now. I made the best of it. Pitched my tent. It's very quiet here. Everything sleeps. You get used to it. You get very used to it.");
        return;
    }
    yield* say('hettie', cycle('hettie', [
        "The puffballs go POOF when you get close. Breathe it in and you'll nod off where you stand, and wake up wherever you last thought of as home. Saves walking, I suppose.",
        "Snorelings. Little sleepwalkers. Wake one and it'll shuffle after you a while, then go and find a bed. Any bed. They're not fussy.",
        "Doctor Mallow's place is over the stream. The Slumberhouse. Lovely man. Never sleeps himself, mind. Funny, that.",
        "The weir on the pond: wind it and the boat'll take you all the way down to the Reaches. And back, if you leave it be. Boats here know where they live.",
        Progress.flag('giant_home') ? "Old Hummock's gone home to his own bed at last. Up in the north-west. Snoring like a landslide. Good for him." : "Is he still across the road, the old lump? Bless him.",
        "There's a hollow where he slept, isn't there? Don't go down it unless you've a way home. I mean it. I'm not climbing down after you.",
    ]));
};
BUDGE.hettie = 'Hettie: "Mind my mushrooms!"';

/* Old Hummock: asleep across the road. A ring wakes him; up he gets and home he goes */
class Giant extends Ent {
    constructor(tx, ty, p = {}) {
        super('giant', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = 0;
        this.state = Progress.flag('giant_home') ? 'home' : Progress.flag('giant_awake') ? 'home' : 'asleep';
        if (this.state === 'home') this.goTo(128 + GIANT_BED.x, 40 + GIANT_BED.y);
    }
    goTo(tx, ty) { this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; }
    get sortY() { return this.y + 64; }
    /* asleep he fills the road; at home, his own bed */
    blocks(x, y) { return this.state !== 'walking' && x >= this.tx && x < this.tx + 5 && y >= this.ty && y < this.ty + 4; }
    hear(x, y) {
        if (this.state !== 'asleep') return;
        if (Math.hypot(this.x + 40 - x, this.y + 32 - y) > (Bells.REACH + 1) * T) return;
        this.state = 'waking'; Progress.set('giant_awake'); Stats.count('giant');
        Script.run(Hushwood.giantWakes(this));
    }
    update() { this.t++; }
    interact() {
        const g = this;
        Script.run(function* () {
            if (g.state === 'asleep') {
                if (!Progress.flag('giant_seen')) { Progress.set('giant_seen'); yield* say(null, 'A giant, fast asleep across the road. He is covered in moss, and ferns, and a few small mushrooms. Each snore lifts the moss on his back like a tide.'); }
                yield* say(null, cycle('giantpush', ["You push. You might as well push a hill.", "You shout HELLO right in his ear. He smiles in his sleep.", "You tickle his nose with a fern. He sneezes, and a bird you hadn't seen flies out of his beard."]));
                if (Inv.has('bell')) yield* say(null, '(You have the Recall Bell. A ring wakes anything.)');
            } else yield* say(null, cycle('giantbed', ['"Mm. Is it morning? ...No. Good."', '"Thank you for waking me, little Wanderer. I was in the way. I\'m always in the way. Mm."', '"Zzzzz."', '"I dreamed I was a mountain. Then I dreamed I was a road. Then you rang."']));
        });
        return true;
    }
    talkBox(p, f) { return f.tx >= this.tx && f.tx < this.tx + 5 && f.ty >= this.ty && f.ty < this.ty + 4; }
    draw(cx, cy) {
        const im = ART[this.state === 'walking' || this.state === 'waking' && this.up ? 'giant_up' : 'giant_sleep'];
        if (!im) return;
        const bob = this.state === 'walking' ? Math.abs(Math.sin(this.t / 8)) * 2 : Math.sin(this.t / 50) * 1;
        Gfx.alpha(0.25); Gfx.circle(this.x - cx + 40, this.y - cy + 58, 30, PAL.ink); Gfx.alpha(1);
        Gfx.img(im, this.x - cx, Math.round(this.y - cy + 64 - im.height - bob));
        if (this.state === 'asleep' || this.state === 'home') {
            const ph = (this.t % 120) / 120;
            Gfx.alpha(Math.min(1, (1 - ph) * 2)); Font.draw('Z', this.x - cx + 62 + Math.round(ph * 8), this.y - cy + 4 - Math.round(ph * 16), '#e8e0ff'); Gfx.alpha(1);
        }
    }
}
SPAWN.giant = (x, y, p) => new Giant(x, y, p);

/* his own bed: a mossy hollow in the north-west, empty until he's home */
SPAWN.giantbed = (x, y) => {
    const pr = new Prop(x, y, { im: ART.giant_bed, solid: [], oy: 8 });
    pr.baseY = -50; pr.floor = true;
    pr.draw = function (cx, cy) { Gfx.img(this.im, this.x - cx, this.y - cy); };
    return pr;
};

/* the hollow he slept in: a hole in the ground, a very long way down */
SPAWN.hollowhole = (x, y) => {
    const pr = new Prop(x, y, { im: ART.hollow_hole, solid: [[0, 0]], ox: -8, oy: -4 });
    pr.baseY = 4;
    pr.interact = () => { Script.run(Hushwood.hole()); return true; };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};

/* the weir winch: wound from this side, it lets a boat down the channel (and keeps it open) */
SPAWN.winch = (x, y, p) => {
    const pr = new Prop(x, y, { im: ART.winch, solid: [[0, 0]], oy: -8 });
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('hush_weir')) { yield* say(null, 'The weir is wound up and pegged. The channel runs free down to the Reaches.'); return; }
            yield* say(null, 'A big wooden winch, the rope running out to the weir across the channel. You lean on the handle. It creaks round, and round, and round.');
            Progress.set('hush_weir'); Sfx.play('door'); G.shake = 4;
            yield* say(null, 'The weir gates lift out of the water. The channel down to the lake is open.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};

/* a campfire: crackles, glows a little */
SPAWN.campfire = (x, y) => {
    const pr = new Prop(x, y, { im: ART.campfire_0, solid: [[0, 0]], oy: 0, live: true });
    pr.update = function () { this.t = (this.t || 0) + 1; };
    pr.draw = function (cx, cy) { Gfx.img(ART['campfire_' + ((this.t >> 3) % 2)], this.x - cx, this.y - cy); };
    pr.text = 'A little campfire. Hettie keeps it going with dry puffball skins. They burn blue.';
    pr.interact = () => { Script.run(function* () { yield* say(null, pr.text); }); return true; };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};

const Hushwood = {
    *giantWakes(g) {
        Music.play('silence');
        G.shake = 20; Sfx.play('rumble');
        yield 50;
        yield* say(null, 'The ring rolls through the trees. The giant stops snoring. Somewhere, a bird stops singing to listen.');
        g.up = true; G.shake = 10; Sfx.play('rumble');
        yield 30;
        yield* say(null, '"HRRRMMMMMMHH." He sits up, very slowly, and moss and leaves and one surprised squirrel slide off his shoulders.');
        yield* say(null, '"Is it... morning? It\'s always morning somewhere. Oh. Oh dear. Was I across the road again? I was, wasn\'t I. I\'m so sorry, little Wanderer."');
        yield* say(null, '"I meant to go home to bed. I only sat down for a moment. I\'ll go now. My bed\'s just over there. Mind your feet."');
        /* up and away to his own bed, over the stream in a stride */
        g.state = 'walking'; Sfx.play('rumble');
        const fx = g.x, fy = g.y;
        const bx = (128 + GIANT_BED.x) * T, by = (40 + GIANT_BED.y) * T;
        for (let i = 0; i <= 150; i++) { const k = i / 150; g.x = lerp(fx, bx, k); g.y = lerp(fy, by, k); if (i % 30 === 0) { G.shake = 4; Sfx.play('land'); } yield 1; }
        g.goTo(128 + GIANT_BED.x, 40 + GIANT_BED.y);
        g.state = 'home'; g.up = false;
        Progress.set('giant_home');
        G.player.area.add(SPAWN.hollowhole(128 + 3, 40 + 16, {}));
        Music.play('hush');
        yield* say(null, 'Where he lay, the moss is pressed flat, and in the middle of it is a deep dark hollow.');
        Progress.setGoal('Hushwood: find the Slumberhouse, over the stream.');
    },
    *hole() {
        if (!Inv.has('bedroll')) { yield* say(null, "A hollow in the ground, going straight down into the dark. You drop a pebble. It's a long time before you hear it land. You'd never climb back out."); return; }
        const b = Inv.bedroll;
        if (!b || b.area !== 'hollow') { yield* say(null, "A hollow, straight down into the dark. A long way down. You'd want your Bedroll laid somewhere up here first, to come home to."); return; }
        const i = yield* ask(null, 'A hollow, straight down into the dark. Your Bedroll is laid up here to come home to. Climb down?', ['Climb down', 'Not now']);
        if (i !== 0) return;
        yield* fadeOut(30);
        World.enter('hummock_hollow', 9, 2, { dir: DOWN });
        Sfx.play('land');
        yield* fadeIn(30);
        if (!Progress.flag('hollow_in')) { Progress.set('hollow_in'); yield* say(null, 'You slither down a long chute of roots and moss and land on something soft. It is very dark, and it smells of giant.'); }
    },
};

/* S16: the hollow under where the giant slept. A cave going down; a round door in the rock; Linnet's note */
THEMES.hushcave = { floor: ['#5a6a5a', '#44544a', '#6e7e6a', '#2e3a32'], wall: ['#4a4a5e', '#3a3a4c', '#5e5e74', '#26263a'], stone: ['#4a4a5e', '#3a3a4c', '#5e5e74', '#26263a'], water: ['#3a6a8a', '#2a5070', '#5a8aa8', '#1a3450'], dark: '#1a1a26' };
FLOORS.hushcave = {
    floor: (x, th, v) => { fill(x, '#4e6450'); speckle(x, ['#5e7a5e', '#3e5240', '#7a9a6a'], 40 + v, 0.35); },
    floor2: (x, th, v) => { fill(x, '#44544a'); speckle(x, ['#566a56', '#38463c'], 50 + v, 0.3); },
    floor3: (x, th, v) => Paint.planks(x, ['#7a6a5a', '#5a4a3a', '#9a8a6a', '#3a2e22'], v, true),
};
WALLS.hushcave = {
    edge: '#1a1a26',
    top: (x) => { fill(x, '#2e2e3e'); speckle(x, ['#3a3a4c', '#4a6a4a'], 9, 0.2); },
    face: (x, th, v) => { fill(x, '#4a4a5e'); speckle(x, ['#5e5e74', '#3a3a4c', '#5a7a5a'], 20 + v, 0.35); fill(x, '#26263a', 0, 15, 16, 1); },
};
LINNET_NOTES[6] = { title: "A note under the giant's hollow", text: "Underneath where the giant sleeps there's a hollow, and at the bottom of the hollow there's a little round door, and behind the door somebody was sawing wood and singing a work song. I didn't knock. I'm not brave yet. Nearly. - L." };
NOTES.linnet6 = { title: LINNET_NOTES[6].title, text: LINNET_NOTES[6].text };
defArea({
    id: 'hummock_hollow', name: "The Giant's Hollow", family: 'dungeon', theme: 'hushcave', house: null, thread: THREAD.wren,
    rows: [
        '####################',
        '#######.....########',
        '######.......#######',
        '#####.........######',
        '####..........ooooo#',
        '###...........ccccc.',
        '###...........ooooo#',
        '####..........######',
        '#####........#######',
        '######......########',
        '####################',
    ],
    legend: { 'c': { k: 'floor', p: 'floor3', ent: 'crumble' } },
    ents: [
        { k: 'deco', x: 4, y: 4, look: 'round_door', solid: [[0, 0]], oy: -14, text: 'A small round door set into the rock, painted exactly the brown of the rock, with a red X stitched over the keyhole. It is locked from the other side. Behind it, very faintly: somebody sawing wood, and humming.' },
        { k: 'linnetnote', x: 19, y: 5, note: 6 },
        { k: 'chest', x: 9, y: 8, item: 'b20', id: 'hhChest' },
        { k: 'deco', x: 9, y: 1, look: 'roots', solid: [[0, 0]], oy: -10, roots: true },
        { k: 'snoreling', x: 6, y: 6, id: 'hhSnore' },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 9, y: 2 },
    music: 'hush',
    noBedroll: 'The moss down here is far too wet to lay a Bedroll on.',
});
/* the roots down here: climbable, just, if there's no other way home */
{
    const deco = SPAWN.deco;
    SPAWN.deco = (tx, ty, p) => {
        const pr = deco(tx, ty, p);
        if (p.roots) {
            pr.interact = () => {
                Script.run(function* () {
                    const i = yield* ask(null, 'Roots hang down the chute you came in by, slick with moss. You could climb them. It would take an age, and you would ache all over.', ['Climb', 'Not now']);
                    if (i !== 0) return;
                    yield* fadeOut(40);
                    World.enter('hollow', ...HUSH(3, 17), { dir: DOWN });
                    Inv.hp = Math.max(1, Inv.hp - 2);
                    yield* fadeIn(30);
                    yield* say(null, 'You haul yourself out at last, scraped and filthy and aching. Next time, the Bedroll.');
                });
                return true;
            };
            pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
        }
        return pr;
    };
}

/* the Slumberhouse from outside: a long low house under a lavender roof, its windows curtained, a moon over
   the door, a lantern lit in the daytime, and the smoke from the chimney going up in Zs */
FACADES.slumber = function () {
    const w = 160, h = 102;
    ART.f_slumber = paintSprite(w, h, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        /* chimney and its sleepy smoke */
        R('#7a6a8a', 118, 6, 12, 26); R('#5a4a6a', 126, 6, 4, 26); R('#3e3250', 116, 4, 16, 3);
        const z = (a, b, s) => { R('#e8e0f4', a, b, s, 1); for (let i = 0; i < s; i++) R('#e8e0f4', a + s - 1 - i, b + i, 1, 1); R('#e8e0f4', a, b + s - 1, s, 1); };
        z(132, 0, 4); z(138, 2, 3);
        /* the roof: a deep sweep of lavender shingles with a darker ridge */
        const top = 14, bot = 52;
        for (let j = top; j < bot; j++) {
            const k = (j - top) / (bot - top), inset = Math.round(22 * (1 - k) * (1 - k));
            for (let i = inset; i < w - inset; i++) {
                const row = Math.floor((j - top) / 4);
                let c = (j - top) % 4 === 3 ? '#7d5bc4' : '#b48ce8';
                if ((j - top) % 4 === 0) c = '#c8a8f0';
                if (((i + (row % 2) * 4) % 8) === 0 && (j - top) % 4 !== 3) c = '#9a76d8';
                if (i === inset || i === w - inset - 1) c = '#4b3a8a';
                R(c, i, j, 1, 1);
            }
        }
        R('#4b3a8a', 22, top - 1, w - 44, 2); R('#e0d0fa', 23, top + 1, w - 46, 1);
        /* moons and stars cut in the roof, glowing a little */
        stampPx(x, ['..yy.', '.yw..', 'yw...', 'yw...', 'yw...', '.yw..', '..yy.'], { y: '#f7e08a', w: '#fff4c0' }, 40, 24); R('#f7e08a', 110, 30, 2, 2); R('#f7e08a', 78, 22, 2, 2); R('#fff4c0', 60, 34, 1, 1); R('#fff4c0', 96, 36, 1, 1);
        /* eaves */
        R('#4b3a8a', 0, 52, w, 3); R('#9a76d8', 0, 55, w, 1);
        /* walls: cream plaster, timber framed */
        R('#f4ecdc', 2, 56, w - 4, 40); R('#e0d6c2', 2, 56, w - 4, 2);
        for (const px of [2, 36, 66, 94, 124, w - 6]) R('#8a6a4a', px, 56, 4, 40);
        R('#8a6a4a', 2, 74, w - 4, 3);
        /* round windows with the curtains drawn */
        for (const cxw of [20, 52, 110, 141]) {
            for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
                const d = i * i + j * j;
                if (d <= 64) R(d > 49 ? '#5a3a2a' : (i < 0 ? '#b48ce8' : '#9a76d8'), cxw + i, 66 + j, 1, 1);
            }
            R('#5a3a2a', cxw, 58, 1, 16); R('#f7e08a', cxw - 1, 66, 2, 1);
        }
        /* the door: rounded, deep purple, a moon on it; steps */
        R('#4b3a8a', 68, 62, 24, 34); R('#2e2450', 70, 64, 20, 32);
        for (let j = 0; j < 6; j++) R('#4b3a8a', 68 + j, 62 - (6 - j) / 2, 24 - 2 * j, 1);
        R('#7d5bc4', 72, 66, 16, 30); R('#9a76d8', 72, 66, 2, 30);
        stampPx(x, ['..yy.', '.yy..', 'yy...', 'yy...', 'yY...', '.yY..', '..YY.'], { y: '#f7e08a', Y: '#d9a33a' }, 78, 70);
        R('#e8b04a', 85, 82, 2, 2);
        /* the moon sign over the door, and a lantern by it */
        R('#5a3a2a', 62, 56, 36, 5);
        stampPx(x, ['...kkkk...', '..kwyyk...', '.kwyyk....', 'kwyyk.....', 'kyyyk.....', 'kyyYk.....', 'kyyYYk....', '.kyyYYkkk.', '..kYYYYYk.', '...kkkkk..'],
            { k: '#2a1f2d', w: '#fff4c0', y: '#f7e08a', Y: '#d9a33a' }, 76, 47);
        R('#3e3250', 98, 64, 2, 14); R('#f7d64a', 96, 70, 6, 7); R('#fff4c0', 97, 71, 4, 4); R('#3e3250', 96, 69, 6, 1);
        /* the ground line, and a sleepy cat on the step */
        R('#5a4a6a', 0, 96, w, 6); R('#7a6a8a', 0, 96, w, 1);
        R('#e0913a', 58, 92, 7, 4); R('#e0913a', 63, 90, 3, 3); R('#a85e2a', 58, 95, 7, 1);
    });
};

function initHushArt() {
    /* Old Hummock asleep: a great mossy heap with a face */
    ART.giant_sleep = paintSprite(80, 64, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 64; j++) for (let i = 0; i < 80; i++) {
            const dx = (i - 40) / 39, dy = (j - 40) / 26;
            const d = dx * dx + dy * dy;
            if (d > 1 || j < 10) continue;
            let c = '#6a8a5a';
            if (dy < -0.4) c = '#88aa6a';
            if (dy > 0.5) c = '#4e6a48';
            if (d > 0.85) c = '#2e3a2e';
            if (hash2(i, j, 3) < 0.12 && d < 0.85) c = '#9ac07a';
            R(c, i, j, 1, 1);
        }
        /* his face, on the left end, eyes shut */
        R('#c8a07a', 6, 30, 22, 20); R('#a8805a', 6, 46, 22, 4); R('#2e3a2e', 5, 30, 1, 20);
        R('#5a3a2a', 10, 38, 5, 1); R('#5a3a2a', 19, 38, 5, 1); R('#5a3a2a', 11, 39, 3, 1); R('#5a3a2a', 20, 39, 3, 1);
        R('#d89a7a', 13, 41, 8, 6); R('#b87a5a', 13, 46, 8, 1);
        R('#7a5a4a', 12, 48, 10, 1);
        /* a fern, two mushrooms and a bird's nest growing on him */
        R('#4e9a4e', 46, 8, 1, 10); for (let k = 0; k < 4; k++) { R('#6ac06a', 42 - k, 10 + k * 2, 4, 1); R('#6ac06a', 47, 11 + k * 2, 4, 1); }
        R('#e8463c', 60, 14, 7, 4); R('#fbf6ea', 62, 15, 1, 1); R('#f4e6c8', 62, 18, 3, 4);
        R('#b48ce8', 28, 16, 5, 3); R('#f4e6c8', 29, 19, 3, 3);
        R('#8a6a4a', 64, 26, 10, 4); R('#6a4a2a', 65, 29, 8, 1);
        /* a hand tucked under his cheek */
        R('#c8a07a', 24, 50, 14, 8); R('#a8805a', 24, 57, 14, 1);
    });
    /* Old Hummock up on his feet (well, sitting up) */
    ART.giant_up = paintSprite(80, 88, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 88; j++) for (let i = 0; i < 80; i++) {
            const dx = (i - 40) / 34, dy = (j - 56) / 32;
            const d = dx * dx + dy * dy;
            if (d > 1) continue;
            let c = d > 0.85 ? '#2e3a2e' : dy < -0.5 ? '#88aa6a' : '#6a8a5a';
            if (hash2(i, j, 5) < 0.12 && d < 0.85) c = '#9ac07a';
            R(c, i, j, 1, 1);
        }
        R('#c8a07a', 26, 6, 28, 26); R('#2e3a2e', 25, 6, 30, 1); R('#a8805a', 26, 30, 28, 2);
        R('#2a1f2d', 32, 14, 4, 4); R('#2a1f2d', 44, 14, 4, 4); R('#fbf6ea', 33, 14, 1, 1); R('#fbf6ea', 45, 14, 1, 1);
        R('#d89a7a', 36, 18, 8, 7); R('#5a3a2a', 34, 27, 12, 2);
        R('#c8a07a', 6, 50, 12, 18); R('#c8a07a', 62, 50, 12, 18);
        R('#4e9a4e', 52, 0, 1, 10); R('#6ac06a', 49, 2, 3, 1); R('#6ac06a', 53, 4, 3, 1);
    });
    ART.giant_bed = paintSprite(96, 64, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 64; j++) for (let i = 0; i < 96; i++) {
            const dx = (i - 48) / 47, dy = (j - 32) / 31, d = dx * dx + dy * dy;
            if (d > 1) continue;
            R(d > 0.7 ? (hash2(i, j, 2) < 0.3 ? '#4e7a4a' : '#5e8a54') : (hash2(i, j, 9) < 0.2 ? '#3e5a40' : '#4a6a48'), i, j, 1, 1);
        }
    }, false);
    ART.hollow_hole = paintSprite(32, 20, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 20; j++) for (let i = 0; i < 32; i++) {
            const dx = (i - 16) / 15, dy = (j - 10) / 9, d = dx * dx + dy * dy;
            if (d > 1) continue;
            R(d > 0.6 ? '#4e6a48' : d > 0.35 ? '#2e3a2e' : '#0e1214', i, j, 1, 1);
        }
        R('#7a5a3a', 10, 6, 2, 8); R('#7a5a3a', 20, 5, 1, 9);
    });
    ART.mushroom_big = paintSprite(32, 42, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#d8ccb8', 12, 18, 9, 24); R('#b8ab96', 18, 18, 3, 24); R('#f0e6d4', 13, 18, 2, 24);
        for (let j = 0; j < 20; j++) for (let i = 0; i < 32; i++) {
            const dx = (i - 16) / 15.5, dy = (j - 16) / 15, d = dx * dx + dy * dy;
            if (d > 1 || j > 18) continue;
            R(j > 16 ? '#7a3a5a' : d > 0.8 ? '#8a3a6a' : j < 8 ? '#d86a9a' : '#b84a7a', i, j, 1, 1);
        }
        for (const [a, b, s] of [[8, 6, 3], [18, 4, 4], [24, 10, 3], [12, 12, 2], [4, 12, 2]]) R('#fbe8f0', a, b, s, s - 1);
    });
    ART.mushrooms = paintSprite(16, 16, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#e8dcc8', 4, 10, 2, 5); R('#c84a6a', 2, 7, 6, 3); R('#fbe8f0', 3, 7, 1, 1);
        R('#e8dcc8', 10, 11, 2, 4); R('#a86a3a', 8, 9, 6, 2); R('#e8dcc8', 12, 12, 1, 3); R('#c84a6a', 11, 10, 3, 2);
    });
    ART.glowcaps = paintSprite(16, 16, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#9adcf0', 3, 6, 5, 3); R('#d8f8ff', 4, 6, 2, 1); R('#c8e8e0', 5, 9, 1, 5);
        R('#9adcf0', 9, 9, 4, 2); R('#c8e8e0', 10, 11, 1, 4); R('#7ab8e0', 11, 3, 3, 2); R('#c8e8e0', 12, 5, 1, 4);
    });
    ART.tent = paintSprite(32, 28, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 24; j++) { const half = Math.round(j * 0.66); R(j % 6 === 5 ? '#8a7a4a' : '#b8a86a', 16 - half, 2 + j, half * 2, 1); }
        R('#5a4a2a', 15, 0, 2, 26); R('#3a2e1a', 13, 12, 6, 14); R('#6a8a5a', 2, 25, 6, 2); R('#6a8a5a', 24, 25, 6, 2);
    });
    for (let f = 0; f < 2; f++) ART['campfire_' + f] = paintSprite(16, 16, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#6b4128', 2, 12, 12, 2); R('#4a2e1a', 4, 13, 8, 2);
        R('#5a8ae0', 5 + f, 6, 6, 6); R('#9ad0f8', 6 + f, 8, 3, 4); R('#e8f8ff', 7, 10, 2, 2); R('#5a8ae0', 7 - f, 3, 2, 3);
    });
    ART.winch = paintSprite(16, 24, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#6b4128', 2, 8, 2, 16); R('#6b4128', 12, 8, 2, 16); R('#9a6438', 2, 10, 12, 8);
        R('#d8c08a', 3, 11, 10, 6); R('#a88a5a', 3, 13, 10, 1); R('#5a3a2a', 13, 6, 2, 6); R('#5a3a2a', 13, 5, 3, 2);
    });
    ART.round_door = paintSprite(16, 30, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = (i - 7.5) ** 2 + (j - 7.5) ** 2; if (d < 64) R(d > 48 ? '#3a3a4c' : '#5a5a6e', i, 14 + j, 1, 1); }
        R('#e8463c', 7, 20, 1, 1); R('#e8463c', 9, 20, 1, 1); R('#e8463c', 8, 21, 1, 1); R('#e8463c', 7, 22, 1, 1); R('#e8463c', 9, 22, 1, 1);
    });
    ART.roots = paintSprite(16, 26, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (const [a, b, l] of [[3, 0, 24], [7, 0, 20], [11, 0, 26], [13, 0, 14]]) { R('#6b4128', a, b, 2, l); R('#4e9a4e', a, b + Math.floor(l / 2), 2, 3); }
    });
}
CONTENT_INIT.push(initHushArt);
