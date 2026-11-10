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
    /* Old Hummock: a huge, gentle, mossy old giant. Painted from shaded lumps lit from the top left (as the trees
       are), each part with its own ink edge: warm weathered skin, a blanket of moss with ferns and mushrooms growing in
       it, a great grey beard with moss in it, a big round nose */
    const HK = { skin: ['#f2cfa6', '#dca97e', '#b47e5a', '#83563e'], moss: ['#b6d888', '#88b864', '#5c8e4e', '#3a6442'],
        beard: ['#f0eee0', '#cfcab4', '#a29c86', '#726c5c'], nose: ['#f6bfa2', '#e4967c', '#bc6e5a', '#8e4c40'], ink: '#2a1f2d' };
    /* a shaded lump (an ellipse); o.ring gives it an ink edge, o.clip(i, j) keeps only part of it */
    const lump = (x, cx, cy, rx, ry, pal, seed, o = {}) => {
        const P = (c, i, j) => { x.fillStyle = c; x.fillRect(i, j, 1, 1); };
        const inE = (i, j, ax, ay) => { const u = (i + 0.5 - cx) / ax, v = (j + 0.5 - cy) / ay; return u * u + v * v <= 1; };
        for (let j = Math.floor(cy - ry - 1); j <= cy + ry + 1; j++) for (let i = Math.floor(cx - rx - 1); i <= cx + rx + 1; i++) {
            if (o.clip && !o.clip(i, j)) continue;
            if (inE(i, j, rx, ry)) {
                const u = (i + 0.5 - cx) / rx, v = (j + 0.5 - cy) / ry;
                const l = -u * 0.55 - v * 0.8 + (hash2(i, j, seed) - 0.5) * (o.noise !== undefined ? o.noise : 0.35);
                P(l > 0.6 ? pal[0] : l > -0.05 ? pal[1] : l > -0.75 ? pal[2] : pal[3], i, j);
            } else if (o.ring && inE(i, j, rx + 1, ry + 1)) P(HK.ink, i, j);
        }
    };
    const R = (x, c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
    /* a thick limb: a chain of shaded discs from (ax, ay) to (bx, by), radius ra to rb, inked round the whole */
    const tube = (x, ax, ay, bx, by, ra, rb, pal, seed) => {
        const n = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (const pass of [0, 1]) for (let k = 0; k <= n; k++) {
            const t = k / n, cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, r = ra + (rb - ra) * t + (pass ? 0 : 1);
            for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) {
                const u = (i + 0.5 - cx) / r, v = (j + 0.5 - cy) / r;
                if (u * u + v * v > 1) continue;
                const l = -u * 0.55 - v * 0.8 + (hash2(i, j, seed) - 0.5) * 0.35;
                x.fillStyle = !pass ? HK.ink : l > 0.6 ? pal[0] : l > -0.05 ? pal[1] : l > -0.75 ? pal[2] : pal[3];
                x.fillRect(i, j, 1, 1);
            }
        }
    };
    /* the things growing on him: a fern, a toadstool, a little purple cap, a bird's nest with eggs */
    const fern = (x, fx, fy, h, flip) => {
        const sx = flip ? -1 : 1;
        for (let k = 0; k < h; k++) {
            const px = fx + sx * Math.floor(k * k / (h * 2.5)), py = fy - k;
            R(x, '#2e6a36', px, py, 1, 1);
            if (k % 2 === 1 && k < h - 1) { const w = Math.max(1, Math.round((h - k) / 1.8)); R(x, '#78cc6c', px - w, py, w, 1); R(x, '#4e9a4e', px + 1, py, w, 1); R(x, '#a8e890', px - w, py - 1, Math.max(1, w - 1), 1); }
        }
    };
    const toadstool = (x, mx, my, big, cap, capD) => {
        const w = big ? 7 : 5;
        R(x, HK.ink, mx - 1, my - 3, 3, 4); R(x, '#f4e8d0', mx, my - 3, 1, 3);
        R(x, HK.ink, mx - (w >> 1) - 1, my - 6 - (big ? 1 : 0), w + 2, big ? 5 : 4); R(x, cap, mx - (w >> 1), my - 6 - (big ? 1 : 0) + 1, w, big ? 3 : 2);
        R(x, capD, mx - (w >> 1), my - 3, w, 1); R(x, '#ffffff', mx - (w >> 1) + 1, my - 5 - (big ? 1 : 0), 1, 1); if (big) R(x, '#ffffff', mx + 1, my - 5, 1, 1);
    };
    const nest = (x, nx, ny) => {
        for (const [ex, ey] of [[nx - 3, ny - 3], [nx, ny - 4], [nx + 2, ny - 3]]) { R(x, '#cfe8f2', ex, ey, 2, 2); R(x, '#ffffff', ex, ey, 1, 1); R(x, '#8ab8cc', ex + 1, ey + 1, 1, 1); }
        lump(x, nx, ny, 5, 2.5, ['#c8a070', '#9a7448', '#74542e', '#523a20'], 70, { ring: true, clip: (i, j) => j >= ny - 1 });
        R(x, '#d8b480', nx - 4, ny - 1, 9, 1); R(x, '#74542e', nx - 3, ny + 1, 2, 1); R(x, '#74542e', nx + 1, ny, 2, 1);
    };
    /* asleep: lying on his side across the road, his head on the left resting on his hand, his knees drawn up */
    ART.giant_sleep = paintSprite(80, 64, x => {
        const ground = (i, j) => j <= 61;
        const TUNIC = ['#a07a52', '#80603e', '#5e442c', '#40301e'];
        /* the body under its blanket of moss: shoulder, hip, thigh, and his knees drawn up toward you */
        lump(x, 34, 37, 18, 21, HK.moss, 3, { clip: ground });
        lump(x, 52, 33, 17, 22, HK.moss, 4, { clip: ground });
        lump(x, 63, 44, 13, 14, HK.moss, 5, { clip: ground });
        lump(x, 64, 53, 12, 9, HK.moss, 6, { clip: ground });
        /* moss clumps standing up along his back */
        for (const [a, b, r] of [[22, 22, 3], [29, 17, 4], [39, 14, 4], [48, 11, 4], [57, 11, 4], [65, 18, 3], [71, 29, 3]]) lump(x, a, b, r, r - 1, HK.moss, 7 + a);
        /* his tunic, peeping out under the moss along the bottom, and the moss hanging over it in fringes */
        for (let i = 24; i < 58; i++) { const h = 3 + Math.floor(hash2(i, 2, 9) * 3); R(x, TUNIC[1], i, 61 - h, 1, h); R(x, TUNIC[3], i, 61, 1, 1); }
        for (let i = 24; i < 58; i += 2) R(x, HK.moss[2 + (i % 4 ? 1 : 0)], i, 55 + Math.floor(hash2(i, 1, 4) * 3), 1, 2);
        /* one big bare foot poking out from under the moss at the far end, toes and all */
        lump(x, 72, 56, 6, 4, HK.skin, 11, { ring: true, clip: ground });
        for (const [tx, ty] of [[77, 52], [78, 55], [78, 58]]) lump(x, tx, ty, 1.7, 1.5, HK.skin, 12 + ty, { ring: true, clip: ground });
        R(x, HK.skin[0], 69, 53, 3, 1);
        for (let i = 64; i < 70; i++) R(x, HK.moss[i % 2 ? 2 : 3], i, 53 + Math.floor(hash2(i, 7, 3) * 4), 1, 3);
        /* moss texture: little lighter tufts and dark hollows */
        for (let n = 0; n < 80; n++) {
            const i = 16 + Math.floor(hash2(n, 3, 21) * 62), j = 8 + Math.floor(hash2(3, n, 22) * 46);
            const d = x.getImageData(i, j, 1, 1).data;
            if (d[3] && d[1] > d[0] + 20) { R(x, n % 3 ? HK.moss[0] : HK.moss[3], i, j, 1, 1); if (n % 3) R(x, HK.moss[2], i, j + 1, 1, 1); }
        }
        /* the head: weathered skin, tufts of mossy hair, an ear */
        lump(x, 17, 38, 15, 14, HK.skin, 13, { ring: true });
        for (const [a, b, r] of [[6, 29, 4], [12, 26, 5], [20, 25, 5], [27, 28, 4], [30, 33, 3]]) lump(x, a, b, r, r - 1, HK.moss, 14 + a, { ring: true, clip: (i, j) => j < b + 2 || i > 28 });
        lump(x, 29, 39, 3, 4, HK.skin, 15, { ring: true });
        R(x, HK.skin[3], 29, 39, 1, 2);
        /* bushy brows, eyes shut in a smile, rosy cheeks, the big round nose */
        lump(x, 10, 33, 3, 1.5, HK.beard, 16); lump(x, 23, 33, 3, 1.5, HK.beard, 17);
        for (const ex of [7, 20]) { R(x, '#4a2e22', ex, 36, 1, 1); R(x, '#4a2e22', ex + 1, 37, 4, 1); R(x, '#4a2e22', ex + 5, 36, 1, 1); R(x, '#4a2e22', ex + 1, 38, 1, 1); R(x, '#4a2e22', ex + 4, 38, 1, 1); }
        R(x, '#e89a8a', 6, 41, 3, 2); R(x, '#e89a8a', 24, 41, 3, 2);
        lump(x, 16, 42, 5, 4, HK.nose, 18, { ring: true });
        R(x, '#fde0d0', 14, 40, 2, 1);
        /* moustache and beard, with moss caught in it, spilling down over his hand */
        lump(x, 17, 53, 13, 8, HK.beard, 19, { ring: true, clip: (i, j) => j > 45 && j <= 61 });
        lump(x, 11, 48, 5, 3, HK.beard, 20, { ring: true }); lump(x, 21, 48, 5, 3, HK.beard, 21, { ring: true });
        for (const [a, b] of [[10, 54], [19, 57], [24, 52], [14, 59]]) { R(x, HK.moss[1], a, b, 2, 1); R(x, HK.moss[3], a, b + 1, 2, 1); }
        /* his hand under his cheek, fingers curled */
        lump(x, 5, 56, 5, 5, HK.skin, 22, { ring: true, clip: ground });
        for (const f of [53, 56, 59]) R(x, HK.skin[3], 1, f, 3, 1);
        R(x, HK.skin[0], 3, 52, 3, 1);
        /* his other arm, draped over his side, the hand hanging over his knee */
        tube(x, 30, 31, 43, 33, 6, 5, HK.moss, 23); tube(x, 43, 33, 52, 42, 5, 4, HK.moss, 25);
        for (const [a, b] of [[52, 49], [55, 50], [58, 50], [61, 48]]) lump(x, a, b, 1.8, 2, HK.skin, 26 + a, { ring: true });
        lump(x, 56, 45, 6, 4, HK.skin, 24, { ring: true });
        for (const f of [54, 57, 60]) R(x, HK.skin[2], f, 47, 1, 2);
        R(x, HK.skin[0], 53, 42, 4, 1);
        /* what grows on him */
        fern(x, 44, 12, 9, false); fern(x, 41, 13, 6, true);
        toadstool(x, 58, 11, true, '#e8463c', '#a82a26');
        toadstool(x, 31, 18, false, '#b48ce8', '#7d5bc4');
        nest(x, 60, 19);
        R(x, '#fbf6ea', 65, 24, 1, 1); R(x, '#f7d64a', 66, 25, 1, 1); R(x, '#fbf6ea', 67, 24, 1, 1);
    });
    /* awake: sitting up, blinking, his hands on his knees */
    ART.giant_up = paintSprite(80, 88, x => {
        const TUNIC = ['#c88a5a', '#a86a40', '#7e4c2e', '#563420'], TROUS = ['#9a8a64', '#7a6c4c', '#5a5038', '#3e3826'];
        /* the great mossy back and shoulders like a hillside, a tunic at the front with a rope belt */
        lump(x, 40, 62, 36, 25, HK.moss, 31, { clip: (i, j) => j <= 86 });
        for (const [a, b, r] of [[8, 52, 4], [72, 52, 4], [13, 44, 4], [67, 44, 4], [22, 38, 4], [58, 38, 4]]) lump(x, a, b, r, r - 1, HK.moss, 33 + a);
        lump(x, 40, 66, 18, 15, TUNIC, 32, { ring: true });
        R(x, HK.ink, 22, 71, 37, 3); R(x, '#e8cf98', 22, 72, 37, 1);
        lump(x, 44, 73, 2, 2, ['#f0dca8', '#e8cf98', '#b89a62', '#8a7448'], 34, { ring: true }); R(x, '#b89a62', 44, 75, 1, 3); R(x, '#b89a62', 46, 75, 1, 2);
        /* his knees drawn up, his bare feet tucked in between them, toes and all */
        for (const fx of [35, 45]) {
            lump(x, fx, 84, 5, 3, HK.skin, 36 + fx, { ring: true, clip: (i, j) => j <= 86 });
            for (const t of [-3, 0, 3]) lump(x, fx + t, 86, 1.5, 1.3, HK.skin, 37 + fx + t, { ring: true, clip: (i, j) => j <= 87 });
        }
        for (const kx of [20, 60]) lump(x, kx, 78, 13, 8, TROUS, 35 + kx, { ring: true, clip: (i, j) => j <= 86 });
        /* his arms in sleeves of moss, bent, and his big hands on his knees, fingers over the front */
        for (const sd of [-1, 1]) {
            const ax = 40 + sd * 29;
            tube(x, ax, 48, ax + sd * 2, 62, 7, 6, HK.moss, 39 + sd);
            tube(x, ax + sd * 2, 62, ax - sd * 7, 70, 6, 5, HK.moss, 41 + sd);
            const hx = ax - sd * 10;
            for (const k of [-4, -1, 2, 5]) lump(x, hx + k * -sd - (sd > 0 ? 1 : 0), 77, 1.7, 2.2, HK.skin, 45 + k + sd, { ring: true });
            lump(x, hx, 73, 6, 4, HK.skin, 44 + sd, { ring: true });
            lump(x, hx + sd * 6, 71, 2, 2, HK.skin, 46 + sd, { ring: true });
            R(x, HK.skin[0], hx - 3, 70, 3, 1);
        }
        /* moss texture */
        for (let n = 0; n < 90; n++) {
            const i = 4 + Math.floor(hash2(n, 5, 41) * 72), j = 36 + Math.floor(hash2(5, n, 42) * 48);
            const d = x.getImageData(i, j, 1, 1).data;
            if (d[3] && d[1] > d[0] + 20) { R(x, n % 3 ? HK.moss[0] : HK.moss[3], i, j, 1, 1); if (n % 3) R(x, HK.moss[2], i, j + 1, 1, 1); }
        }
        /* the head */
        lump(x, 40, 27, 18, 17, HK.skin, 43, { ring: true });
        lump(x, 22, 28, 3, 5, HK.skin, 44, { ring: true }); lump(x, 58, 28, 3, 5, HK.skin, 45, { ring: true });
        for (const [a, b, rx, ry] of [[25, 17, 5, 5], [56, 17, 5, 5], [30, 11, 7, 6], [50, 11, 7, 6], [40, 8, 8, 6], [23, 24, 3, 4], [58, 24, 3, 4]]) lump(x, a, b, rx, ry, HK.moss, 46 + a + b, { ring: true });
        /* brows, eyes just opening (sleepy, kind), cheeks, the great nose */
        lump(x, 32, 20, 5, 2, HK.beard, 50); lump(x, 48, 20, 5, 2, HK.beard, 51);
        R(x, HK.beard[2], 27, 21, 1, 1); R(x, HK.beard[2], 53, 21, 1, 1);
        for (const ex of [29, 45]) { R(x, HK.ink, ex, 24, 6, 4); R(x, HK.ink, ex + 1, 23, 4, 1); R(x, '#fbf6ea', ex + 1, 25, 4, 2); R(x, '#4a2e22', ex + 2, 25, 2, 2); R(x, '#fbf6ea', ex + 2, 25, 1, 1); R(x, HK.skin[2], ex, 22, 6, 1); }
        R(x, '#e89a8a', 25, 30, 4, 2); R(x, '#e89a8a', 51, 30, 4, 2);
        lump(x, 40, 30, 6, 5, HK.nose, 52, { ring: true });
        R(x, '#fde0d0', 37, 27, 2, 1);
        /* beard and moustache, down over his chest */
        lump(x, 40, 45, 16, 11, HK.beard, 53, { ring: true, clip: (i, j) => j > 34 });
        lump(x, 34, 37, 6, 3, HK.beard, 54, { ring: true }); lump(x, 46, 37, 6, 3, HK.beard, 55, { ring: true });
        R(x, '#7a4a3a', 37, 40, 6, 1); R(x, '#7a4a3a', 36, 39, 1, 1); R(x, '#7a4a3a', 43, 39, 1, 1);
        for (const [a, b] of [[30, 46], [44, 50], [49, 43], [36, 53]]) { R(x, HK.moss[1], a, b, 2, 1); R(x, HK.moss[3], a, b + 1, 2, 1); }
        fern(x, 52, 6, 8, false);
        toadstool(x, 30, 7, false, '#e8463c', '#a82a26');
    });
    /* his own bed: a hollow in the moss, worn into the shape of him, a pillow of moss at the head end */
    ART.giant_bed = paintSprite(96, 64, x => {
        const P = (c, i, j) => { x.fillStyle = c; x.fillRect(i, j, 1, 1); };
        for (let j = 0; j < 64; j++) for (let i = 0; i < 96; i++) {
            const dx = (i + 0.5 - 48) / 47, dy = (j + 0.5 - 32) / 31, d = dx * dx + dy * dy, h = hash2(i, j, 2);
            if (d > 1 - (h < 0.25 ? 0.04 : 0)) continue;
            const ix = (i + 0.5 - 52) / 38, iy = (j + 0.5 - 34) / 22, di = ix * ix + iy * iy;
            let c;
            if (di < 1) {
                /* the hollow: in shadow under its back (top) edge, lighter toward the front, softly mottled */
                const v = iy + (h - 0.5) * 0.4;
                c = v < -0.5 ? '#2a4432' : v < -0.1 ? '#36583e' : v < 0.35 ? '#41664a' : '#4c7652';
                if (di > 0.78 && iy > 0.25) c = h < 0.5 ? '#5e8a5a' : '#567f52';
                if (hash2(i, j, 5) < 0.04) c = '#6a9a5e';
            } else {
                /* the rim: lumpy moss, lit on top */
                c = dy < -0.2 ? (h < 0.3 ? '#9ac47a' : '#86b464') : dy < 0.5 ? (h < 0.3 ? '#78a458' : '#6a9a52') : (h < 0.3 ? '#4e7a44' : '#5a8a4c');
                if (d > 0.9) c = dy < 0 ? '#5a8a4c' : '#3a6442';
                if (di < 1.12 && iy < 0) c = '#3e6446';
            }
            P(c, i, j);
        }
        /* the moss pillow at the head end, and a few tufts and flowers on the rim */
        lump(x, 15, 30, 10, 8, HK.moss, 61, { ring: true });
        for (const [a, b] of [[30, 4], [62, 3], [82, 9], [88, 40], [70, 58], [36, 59], [8, 46], [50, 2], [20, 10]]) { P('#c8e894', a, b); P('#88b864', a + 1, b); P('#c8e894', a, b - 1); }
        for (const [a, b] of [[44, 2], [78, 56], [12, 16]]) { P('#fbf6ea', a, b); P('#f7d64a', a + 1, b); P('#fbf6ea', a + 2, b); }
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
