/* Hushwood (overworld block 2,1): a dim wood of giant mushrooms and moss where everything is asleep. The road in
   from town is blocked by Old Hummock, a giant asleep across it since before Gran was born; the Recall Bell
   wakes him, and he lumbers home to his own bed in the north-west. The hollow where he lay goes down (S16: it's
   a long way down, so only with a Bedroll laid up top to come home to). Bouncy moss hops you over the stream to
   the Slumberhouse (House 5, Doctor Mallow's); sleep puffs line the trail through Puffball Hollow; Snorelings
   doze in the ferns; Hettie the forager camps by Lantern Pond, where a weir (wound open from this side only)
   lets a raft run down the channel to the lake at Millwater. The cliff stair up the east side stays walled off.
   The Slumberhouse's door opens while Mallow's three Snorelings sleep in the three cradles in the stream's south
   bank (they follow you; a puffball's spores put one to sleep where it stands; somebody in a cradle, nobody else
   gets in); a fourth cradle by the house is for the little wooden one. Lantern Pond's four lanterns light only while
   their stones weigh on them; all four, and the lantern on the isle lights. Map drafted by tools/mapgen/hushwood.py. */

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
    'YY........YYYY1XXXXXXXXXXYYYYY#....M..YY##:H:##YYYYYYYYYYYYYYYYY',
    'YY....M...YYYY.XXXXXXXXXXYYYYY#....k..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY............3XXXX:XXXXXYYYYY#....k..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........::::::::.....YYYYY#.......YY##:::##YYYYYYYYYYYYYYYYY',
    'YYk."b...,..:................YYvvvvvvvYY##:::##YYYYYYYYYYYYYYYYY',
    'YY....k.....:................YY.....YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.~~~~~~~~~~~~~~~~~~~~~~~~~~..,....YYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YY.~~~~~~~~~~~~~~~~~~~~~~~~~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYY11111111..11..11..11~~..,..:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYY.....:..............~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........:.........YYYY.~~.."..:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY......b...:.........YYYY.~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..........:..............~~..qk.:.YYYY##:H:##YYYYYYYYYYYYYYYYY',
    ':::::::::::::::............~~.....:.YYYY##:::##YYYYYYYYYYYYYYYYY',
    ':::::::::::::::::::::::::::__::::::.YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.........................~~.......YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY..................M......~~..YYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY......:.k...qM........"..~~..YYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:.......kYYYYYYY...~~........YYY##:H:##YYYYYYYYYYYYYYYYY',
    'YYYYY...:.......,YYYYYYY...~~........YYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:..b"....YYYYYY.,"~~~~~~~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:..M.....YYYYYYY.-~~~~~~~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY.".:........,".....:-~~~~..~~~...YY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYY...:...............:.~~~~..~~~-..YY##:::##YYYYYYYYYYYYYYYYY',
    'YY.M....:::::::::::::::::.~~~~~~~~~-..YY##:H:##YYYYYYYYYYYYYYYYY',
    'YY........................~~~~~~~~~.".YY##:::##YYYYYYYYYYYYYYYYY',
    'YY........,b.YYYYYYYYYY.k.-b.VV.....YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY.q..k......YYYYYYYYYY....b.VV.....YYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY...........YYYYYYYYYYq...b.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YY...........YYYYYYYYYY....b.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYY.VV..YYYYYYY##:H:##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYY.VV..YYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYY##:::##YYYYYYYYYYYYYYYYY',
];

defBlock({
    id: 'hushwood', bx: 2, by: 1, name: 'Hushwood', theme: 'hush', music: 'hush', owArt: true, soft: 4, blobSeam: true,
    rows: HUSHWOOD_ROWS,
    forest: ['tree_hush', 'tree_hush', 'pine', 'tree_hush2'],
    legend: {
        'M': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'mushroom_big', solid: [[0, 0], [1, 0]], ox: -8, oy: -26 } },
        'k': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'mushrooms', solid: false } },
        'q': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'glowcaps', solid: false } },
        /* the Nursery's low hedge (it stops a body; a hook or a throw goes over), brambles, a hole only a little one fits */
        '1': { k: 'low', p: 'grass', ent: 'deco', props: { look: 'nursery_hedge', solid: false, oy: -3 } },
        '2': { k: 'spikes', p: 'hthorn' },
        '3': { k: 'crawl', p: 'grass', ent: 'deco', props: { look: 'nursery_hole', solid: false, oy: -3 } },
    },
    drawGround: (a, cx, cy) => Hushwood.ground(a, cx, cy),
    drawOver: (a, cx, cy) => Hushwood.over(a, cx, cy),
    ents: [
        /* the sleeping road */
        { k: 'giant', x: 1, y: 18, id: 'giant' },
        { k: 'hollowhole', x: 3, y: 16, id: 'hollowHole', if: 'giant_awake' },
        { k: 'sign', x: 9, y: 18, text: 'HUSHWOOD. Please do not wake anything.' },
        { k: 'rest', x: 10, y: 16 },
        { k: 'snoreling', x: 15, y: 22, id: 'hwSnore1' },
        /* over the stream to the Slumberhouse: bouncy moss, one each way */
        { k: 'moss', x: 12, y: 15, dir: 'up', dist: 4, id: 'hwMossN' },
        { k: 'moss', x: 10, y: 11, dir: 'down', dist: 4, id: 'hwMossS' },
        { k: 'sign', x: 11, y: 16, text: 'MIND THE MOSS. It is VERY bouncy. (The stream is cold.)' },
        { k: 'building', x: 15, y: 3, w: 10, h: 6, door: 4, art: 'slumber' },
        { k: 'warp', x: 19, y: 8, to: 'slumber', tx2: SLUMBER_ENTRY.x, ty2: SLUMBER_ENTRY.y, face: 'up', dir: 'up', when: 'nuA&nuB&nuC|flag:slumber_open|flag:d5', lockedLine: "The round lavender door won't open. From somewhere inside comes a long, slow yawn." },
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
        /* Lantern Pond's lanterns: each lit while something heavy stands on the stone at its foot; the stones go home */
        { k: 'pondlantern', x: 30, y: 26, sig: 'lpN' }, { k: 'lanternstone', x: 30, y: 25, sig: 'lpN', minWeight: WEIGHT.heavy },
        { k: 'pondlantern', x: 37, y: 27, sig: 'lpE' }, { k: 'lanternstone', x: 36, y: 27, sig: 'lpE', minWeight: WEIGHT.heavy },
        { k: 'pondlantern', x: 32, y: 33, sig: 'lpS' }, { k: 'lanternstone', x: 32, y: 32, sig: 'lpS', minWeight: WEIGHT.heavy },
        { k: 'pondlantern', x: 23, y: 26, sig: 'lpW' }, { k: 'lanternstone', x: 24, y: 26, sig: 'lpW', minWeight: WEIGHT.heavy },
        { k: 'block', x: 32, y: 25, id: 'lpStoneN', look: 'mossstone', stitchName: 'a mossy stone' },
        { k: 'block', x: 36, y: 29, id: 'lpStoneE', look: 'mossstone', stitchName: 'a mossy stone' },
        { k: 'block', x: 34, y: 32, id: 'lpStoneS', look: 'mossstone', stitchName: 'a mossy stone' },
        { k: 'block', x: 24, y: 28, id: 'lpStoneW', look: 'mossstone', stitchName: 'a mossy stone' },
        /* the isle, and its great lantern; all four lit, it lights, and something is there to find */
        { k: 'greatlantern', x: 31, y: 28 },
        { k: 'chest', x: 30, y: 28, item: 'heartpatch', id: 'lpIsle', hidden: true, when: 'lpN&lpE&lpS&lpW' },
        /* the Slumberhouse's garden: three cradles in the stream's south bank, a puffball beside each; Mallow's three
           Snorelings asleep in the meadow behind. The door opens while all three are asleep in the cradles */
        { k: 'puffball', x: 15, y: 14, id: 'nuPuffA' }, { k: 'cradle', x: 16, y: 14, sig: 'nuA' },
        { k: 'puffball', x: 19, y: 14, id: 'nuPuffB' }, { k: 'cradle', x: 20, y: 14, sig: 'nuB' },
        { k: 'puffball', x: 23, y: 14, id: 'nuPuffC' }, { k: 'cradle', x: 24, y: 14, sig: 'nuC' },
        { k: 'snoreling', x: 8, y: 16, id: 'nuSnoreA', type: 'snoreling_n' },
        { k: 'snoreling', x: 16, y: 16, id: 'nuSnoreB', type: 'snoreling_n' },
        { k: 'snoreling', x: 20, y: 16, id: 'nuSnoreC', type: 'snoreling_n' },
        /* by the house, a fourth cradle behind a little round hole in the hedge, and the wooden one Jory carved */
        { k: 'cradle', x: 14, y: 7, sig: 'nuD' },
        { k: 'puppet', x: 17, y: 10, id: 'nuDolly', look: 'puppet_snore' },
        { k: 'chest', x: 13, y: 9, item: 'heartpatch', id: 'nuPatch', hidden: true, when: 'nuA&nuB&nuC&nuD' },
        /* something lost on the isle, long ago */
        { k: 'lostweight', x: 31, y: 29 },
    ],
    regions: [
        { name: 'The Sleeping Road', x: 0, y: 14, w: 20, h: 8 },
        { name: 'The Slumberhouse', x: 2, y: 2, w: 27, h: 10 },
        { name: 'Puffball Hollow', x: 2, y: 22, w: 22, h: 14 },
        { name: 'Lantern Pond', x: 24, y: 21, w: 15, h: 19 },
        { name: "The Slumberhouse Garden", x: 7, y: 14, w: 20, h: 4 },
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

/* ---------- Mallow's Nursery and Lantern Pond ---------- */
/* a cradle: a pressure plate in a little crib (whatever lies in it, or stands in it, weighs it down); somebody in it
   already, nobody else gets in */
SPAWN.cradle = (x, y, p) => {
    const c = new Plate(x, y, p);
    c.blocks = function (tx, ty, who) {
        if (tx !== this.tx || ty !== this.ty || !this.area) return false;
        const pl = G.player;
        if (pl && pl !== who && pl.area === this.area && !pl.flying && pl.feetOn(tx, ty)) return true;
        return this.area.walkers.some(m => m !== who && m.alive !== false && m.feetOn && m.feetOn(tx, ty));
    };
    c.draw = function (cx, cy) { Gfx.img(ART[this.down ? 'cradle_down' : 'cradle'], this.x - cx, this.y - cy); };
    return c;
};
/* a stone at a lantern's foot: a plate that only something heavy weighs down */
SPAWN.lanternstone = (x, y, p) => {
    const c = new Plate(x, y, p);
    c.draw = function (cx, cy) { Gfx.img(ART[this.down ? 'lanternstone_down' : 'lanternstone'], this.x - cx, this.y - cy); };
    return c;
};
/* a paper lantern on a post: lit while its stone is weighed down */
SPAWN.pondlantern = (x, y, p) => {
    const pr = new Prop(x, y, { im: ART.pond_lantern, solid: [[0, 0]], oy: -16 });
    pr.sig = p.sig;
    pr.draw = function (cx, cy) {
        const on = this.area && Signals.get(this.area, this.sig), x0 = this.x - cx, y0 = this.y - cy;
        if (on) { Gfx.alpha(0.22 + 0.06 * Math.sin(G.t / 9 + this.tx)); Gfx.circle(x0 + 8, y0 + 9, 13, '#ffd27a'); Gfx.alpha(0.3); Gfx.circle(x0 + 8, y0 + 9, 7, '#fff0b0'); Gfx.alpha(1); }
        Gfx.img(ART[on ? 'pond_lantern_lit' : 'pond_lantern'], x0, y0);
    };
    pr.interact = () => { Script.run(function* () { yield* say(null, Signals.get(pr.area, pr.sig) ? 'The paper lantern glows, warm as a window. Its flat stone is weighed down.' : 'A paper lantern on a post, cold. At its foot, a round flat stone with a lantern carved in it, a little proud of the ground.'); }); return true; };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
/* the stone lantern on the isle: alight when all four round the pond are */
SPAWN.greatlantern = (x, y) => {
    const pr = new Prop(x, y, { im: ART.great_lantern, solid: [[0, 0]], oy: -18 });
    pr.lit = () => pr.area && ['lpN', 'lpE', 'lpS', 'lpW'].every(s => Signals.get(pr.area, s));
    pr.draw = function (cx, cy) {
        const on = this.lit(), x0 = this.x - cx, y0 = this.y - cy;
        if (on) { Gfx.alpha(0.18 + 0.05 * Math.sin(G.t / 11)); Gfx.circle(x0 + 8, y0 + 12, 20, '#ffd27a'); Gfx.alpha(1); }
        Gfx.img(ART[on ? 'great_lantern_lit' : 'great_lantern'], x0, y0);
    };
    pr.interact = () => { Script.run(function* () { yield* say(null, pr.lit() ? 'The old stone lantern is alight, for the first time in years. Its light lies on the water all the way to the shore.' : "An old stone lantern on the isle, its little windows dark. Moss on its roof. Round the pond, four paper lanterns on posts look back at it."); }); return true; };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};

/* an old loom weight, lost on the isle in Lantern Pond (it fits somewhere in the north, much later) */
ITEMS.oldweight = { name: 'old loom weight', kind: 'quest', desc: 'A fist-sized lump of grey stone with a hole worn through it, far heavier than it looks.' };
SPAWN.lostweight = (x, y) => {
    const pr = new Prop(x, y, { im: ART.loomweight_ground, solid: [], oy: 0 });
    pr.baseY = 4; pr.inert = false;
    const gone = () => Progress.flag('oldweight_got');
    pr.draw = function (cx, cy) { if (!gone()) Gfx.img(this.im, this.x - cx, this.y - cy); };
    pr.interact = () => {
        if (gone()) return false;
        Script.run(function* () { Progress.set('oldweight_got'); Stats.count('secret:oldweight'); yield* Story.getItem('oldweight')(); });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
{
    /* the garden's three asleep: a bolt slides back somewhere in the house; once you've been in, the door's open to you */
    const tick0 = OW.blocks['2,1'].tick;
    OW.blocks['2,1'].tick = a => {
        if (tick0) tick0(a);
        const all = Signals.get(a, 'nuA') && Signals.get(a, 'nuB') && Signals.get(a, 'nuC');
        if (all && !Hushwood.bolted && !Progress.flag('slumber_open') && !Progress.flag('d5')) { G.pendingToast = 'Somewhere inside the Slumberhouse, a bolt slides back.'; Sfx.play('unlock'); }
        Hushwood.bolted = all;
    };
    const enter0 = World.enter;
    World.enter = function (id, ...rest) {
        if (id === 'slumber' || (Progress.areaFlags && Progress.areaFlags.slumber)) { if (!Progress.flag('slumber_open')) Progress.set('slumber_open'); }
        return enter0.call(this, id, ...rest);
    };
}

/* ---------- the look of the wood: moss underfoot, ferns, loam paths with roots across them; and in the air under the
   trees a dimness, drifting mist and spores (thinning toward the edges of the wood) ---------- */
THEMES.hush.grass = ['#68a266', '#58905b', '#84bc7a', '#427850'];
THEMES.hush.path = ['#9c8564', '#80694e', '#b8a07a'];
OWA.ground.hush = {
    /* moss: soft cushions with a lit top and a shadowed foot, a few pores; now and then a leaf, spores, sorrel */
    grass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0);
        speckle(x, [g1], 12 + v * 13, 0.12);
        for (let n = 0; n < 5; n++) {
            const cx = Math.floor(hash2(v, n, 31) * 14) + 1, cy = Math.floor(hash2(n, v, 32) * 13) + 2, w = 2 + (n + v) % 2;
            fill(x, g2, cx, cy, w, 1); px(x, cx - 1, cy + 1, g1); fill(x, mix(g0, g2, 0.4), cx, cy + 1, w, 1); fill(x, g1, cx, cy + 2, w, 1);
        }
        for (let n = 0; n < 3; n++) px(x, Math.floor(hash2(n, v, 33) * 16), Math.floor(hash2(v, n, 34) * 16), g3);
        if (v === 1) { px(x, 4, 11, '#c87a3a'); px(x, 5, 11, '#e09848'); px(x, 5, 10, '#a85e2a'); px(x, 10, 4, '#6a5038'); px(x, 11, 5, '#6a5038'); }
        if (v === 2) { px(x, 3, 4, '#e8f4ff'); px(x, 12, 9, '#d8ecff'); px(x, 8, 13, '#e8f4ff'); }
        if (v === 3) { px(x, 9, 6, '#9ad48a'); px(x, 10, 6, '#9ad48a'); px(x, 9, 5, '#b8e8a0'); px(x, 10, 7, g3); }
    },
    /* bluebells and the odd glowcap in the moss */
    flowers(x, th, v) {
        OWA.ground.hush.grass(x, th, v);
        for (let n = 0; n < 3; n++) {
            const fx = 2 + Math.floor(hash2(n, v, 41) * 11), fy = 3 + Math.floor(hash2(v + 3, n, 42) * 10);
            if ((n + v) % 3 === 2) { px(x, fx, fy, '#c8f4ff'); px(x, fx + 1, fy, '#8ad8f0'); px(x, fx, fy + 1, '#e0e8d8'); px(x, fx, fy + 2, th.grass[3]); }
            else { px(x, fx, fy - 1, th.grass[3]); px(x, fx + 1, fy - 1, th.grass[3]); px(x, fx, fy, '#7a8ae8'); px(x, fx + 1, fy + 1, '#5a64c8'); px(x, fx, fy + 1, '#a8b4f8'); px(x, fx - 1, fy + 2, th.grass[3]); }
        }
    },
    /* ferns: fronds arching up from the moss, a leaflet each side at every step */
    tallgrass(x, th, v) {
        OWA.ground.hush.grass(x, th, v);
        const fern = (bx, h, lean, col, hi) => {
            for (let j = 0; j < h; j++) {
                const fx = bx + Math.round(lean * j * j / (h * h) * 4), fy = 15 - j;
                px(x, fx, fy, '#2e5a3e');
                if (j > 1 && j % 2 === 0 && j < h - 1) { const w = Math.max(1, Math.round((h - j) / 2.5)); fill(x, col, fx - w, fy, w, 1); fill(x, col, fx + 1, fy, w, 1); px(x, fx - w, fy - 1, hi); }
            }
            px(x, bx + Math.round(lean * 4), 15 - h, hi);
        };
        fern(4 + v % 2, 10 + v % 3, -1, '#4e9a5a', '#86c47a');
        fern(10 + (v >> 1), 12 - v % 2, 1, '#3e8a50', '#76b46a');
    },
    /* a loam path, roots across it, a few pebbles */
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.18); speckle(x, [p2], 41 + v, 0.06);
        if (v % 2 === 0) {
            /* a root, wandering across (its own colour, a highlight along its top) */
            let ry = 3 + Math.floor(hash2(v, 1, 51) * 10);
            for (let i = 0; i < 16; i++) { if (hash2(i, v, 52) < 0.22) ry += hash2(v, i, 53) < 0.5 ? -1 : 1; ry = clamp(ry, 2, 13); px(x, i, ry, '#5e4430'); px(x, i, ry - 1, '#8a6a48'); px(x, i, ry + 1, mix(p0, '#3a2a1c', 0.4)); }
        }
        for (let n = 0; n < 2; n++) { const sx = 1 + Math.floor(hash2(v, n, 54) * 13), sy = 1 + Math.floor(hash2(n, v, 55) * 13); px(x, sx, sy, '#b8b0a0'); px(x, sx + 1, sy, '#8a8274'); }
        if (v === 3) { px(x, 11, 12, '#4c8457'); px(x, 12, 11, '#5d9862'); px(x, 3, 3, '#4c8457'); }
    },
    /* under the trees: dark, ferny */
    forest(x, th, v) {
        fill(x, '#335640'); speckle(x, ['#3c624a', '#284634'], v + 9, 0.3);
        for (let n = 0; n < 2; n++) { const fx = 2 + Math.floor(hash2(v, n, 61) * 12), fy = 6 + Math.floor(hash2(n, v, 62) * 8); px(x, fx, fy, '#34584a'); px(x, fx - 1, fy + 1, '#2e4e40'); px(x, fx + 1, fy + 1, '#2e4e40'); px(x, fx, fy + 2, '#2a4436'); }
    },
    /* brambles: purple-brown stems looped over the moss, thorns, a few dark berries */
    hthorn(x, th, v) {
        OWA.ground.hush.grass(x, th, v);
        for (let n = 0; n < 3; n++) {
            let sx = Math.floor(hash2(v, n, 71) * 16), sy = 15;
            for (let j = 0; j < 18; j++) {
                px(x, ((sx % 16) + 16) % 16, sy, '#4a2a3e'); if (j % 3 === 1) px(x, ((sx + 1) % 16 + 16) % 16, sy, '#c8b0c0');
                sx += hash2(j, n + v, 72) < 0.5 ? 1 : -1; sy -= hash2(n, j + v, 73) < 0.75 ? 1 : 0; if (sy < 1) break;
            }
        }
        for (let n = 0; n < 2; n++) { const bx = 3 + Math.floor(hash2(v, n, 74) * 10), by = 3 + Math.floor(hash2(n, v, 75) * 10); px(x, bx, by, '#2a1638'); px(x, bx + 1, by, '#3a2050'); px(x, bx, by - 1, '#7a5aa0'); }
    },
};
Object.assign(Hushwood, {
    /* how deep in the wood a point is, 0 at its edges (with the town, the Heights, the Reaches) to 1 four tiles in */
    depth(wx, wy) { return clamp(Math.min(wx - 128 * T, wy - 40 * T, 80 * T - wy) / (4 * T), 0, 1); },
    /* small things on the ground: across the edge with the town, moss creeping out over the town's grass and road and the
       town's grass in tufts among the moss, more of each nearer the edge (so it never changes on a line); in the wood, fallen
       leaves and toadstools here and there */
    ground(a, cx, cy) {
        if (HEADLESS || cx + W < 124 * T || cy + H < 40 * T || cy > 80 * T) return;
        const tx0 = Math.max(124, Math.floor(cx / T)), tx1 = Math.floor((cx + W) / T), ty0 = Math.max(40, Math.floor(cy / T)), ty1 = Math.min(79, Math.floor((cy + H) / T));
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
            const p = a.cell(tx, ty).p;
            if (!(p === 'grass' || p === 'flowers' || p === 'tallgrass' || p === 'path' || p === 'forest')) continue;
            const d = tx + 0.5 - 128;
            for (let n = 0; n < 3; n++) {
                const r = hash2(tx * 3 + n, ty, 201), ox = Math.floor(hash2(tx, ty * 3 + n, 202) * 12), oy = Math.floor(hash2(ty, tx + n, 203) * 12);
                let im = null;
                if (d < 4 && d > -4) {
                    /* the edge: moss going west, grass tufts coming east */
                    if (d < 0 && r < 0.55 * (1 + d / 4)) im = ART['hw_moss' + (n % 3)];
                    else if (d > 0 && r < 0.5 * (1 - d / 4) && p !== 'forest') im = ART['hw_tuft' + (n % 2)];
                    else if (d < 0 && p === 'forest' && r < 0.7 * (1 + d / 4)) im = ART.hw_fern;
                } else if (d >= 4 && n === 0 && p !== 'forest' && p !== 'path' && r < 0.06) im = ART[r < 0.03 ? 'hw_leaves' : 'hw_toad'];
                if (im) Gfx.img(im, tx * T - cx + ox, ty * T - cy + oy);
            }
        }
    },
    over(a, cx, cy) {
        if (HEADLESS || cx + W < 128 * T || cy + H < 40 * T || cy > 80 * T) return;
        const k0 = Math.min(this.depth(cx, cy), this.depth(cx, cy + H), this.depth(cx + W, cy), this.depth(cx + W, cy + H));
        /* the dimness under the trees: deepening over the wood's first few tiles, its edge wandering (runs of equal shade
           drawn at once) */
        if (k0 >= 1) { Gfx.alpha(0.17); Gfx.rect(0, 0, W, H, '#16203a'); }
        else for (let sy = 0; sy < H; sy += 4) {
            let run = 0, q0 = -1;
            for (let sx = 0; sx <= W; sx += 4) {
                const wx = cx + sx + 2, wy = cy + sy + 2, wob = (hash2(Math.floor(wy / 12), 3, 211) - 0.5) * 20 + (hash2(Math.floor(wx / 8), Math.floor(wy / 8), 212) - 0.5) * 8;
                const q = sx < W ? Math.round(this.depth(wx + wob, wy + wob * 0.5) * 12) : -2;
                if (q !== q0) { if (q0 > 0) { Gfx.alpha(0.17 * q0 / 12); Gfx.rect(sx - run * 4, sy, run * 4, 4, '#16203a'); } q0 = q; run = 0; }
                run++;
            }
        }
        Gfx.alpha(1);
        /* mist lying in long soft banks, drifting */
        for (let i = 0; i < 9; i++) {
            const wx = 128 * T + ((i * 331 + G.t * (0.12 + (i % 3) * 0.05)) % (64 * T)), wy = 40 * T + 24 + (i * 157) % (38 * T);
            const x = wx - cx, y = wy - cy, rx = 46 + (i % 4) * 9, ry = 5 + i % 3;
            if (x < -rx || x > W + rx || y < -ry || y > H + ry) continue;
            const k = this.depth(wx, wy); if (k <= 0) continue;
            Gfx.alpha(0.07 * k);
            for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); Gfx.rect(x - w, y + j, w * 2 + 1, 1, '#dce4f4'); }
        }
        /* spores, drifting up through the gloom (a layer that moves at half the ground's pace) */
        for (let i = 0; i < 26; i++) {
            const sx = (((i * 73 - cx * 0.5 + Math.sin(G.t / 60 + i) * 6) % W) + W) % W, sy = H - (((i * 41 + G.t * (0.18 + (i % 4) * 0.05) + cy * 0.5) % (H + 20)) + H + 20) % (H + 20);
            const k = this.depth(cx + sx, cy + sy); if (k <= 0) continue;
            Gfx.alpha((0.35 + 0.35 * Math.sin(G.t / 13 + i * 2)) * k);
            Gfx.rect(sx, sy, 1, 1, i % 3 ? '#e8f8d0' : '#c8e8ff');
            Gfx.alpha(1);
        }
        Gfx.alpha(1);
        /* while the garden's three sleep in their cradles, the Slumberhouse's round windows glow */
        if (Signals.get(a, 'nuA') && Signals.get(a, 'nuB') && Signals.get(a, 'nuC')) {
            for (const wx of [20, 52, 110, 141]) { const x = (128 + 15) * T + wx - cx, y = (40 + 3) * T - 6 + 66 - cy; Gfx.alpha(0.22 + 0.05 * Math.sin(G.t / 17 + wx)); Gfx.circle(x, y, 10, '#ffe8a0'); Gfx.alpha(1); }
        }
    },
});

function initHushArt2() {
    ENEMY.snoreling_n = Object.assign({}, ENEMY.snoreling, { chase: 1500 });
    ENEMY_DRAW.snoreling_n = ENEMY_DRAW.snoreling;
    treeArt('tree_hush2', { leaf: ['#3a6e66', '#4a8a78', '#6eb294', '#24504a'], bark: ['#8a7a9a', '#64547a', '#3a2e4a'] }, 9, { clumps: [[16, 15, 10], [8, 18, 7], [24, 18, 7], [11, 10, 6], [21, 10, 6], [16, 21, 8]] });
    {
        /* moss hanging from its boughs */
        const c = ART.tree_hush2; if (!HEADLESS) { const x = c.getContext('2d'); for (const [a, b, l] of [[7, 22, 5], [12, 25, 4], [21, 24, 6], [26, 21, 4]]) { x.fillStyle = '#8ac47a'; x.fillRect(a, b, 1, l); x.fillStyle = '#5a9a5a'; x.fillRect(a + 1, b + 1, 1, l - 2); } }
    }
    const k = '#2a1f2d';
    defSprite('mossstone', ['................', '....kkkkkkk.....', '..kkMMmMMmmkk...', '.kmMMmmmMmmmmk..', '.kMmmmmmmmmmmmk.', 'kmmmmgmmmmmmgmmk', 'kgmmgggmmgggggmk', 'kgsggggggggsgggk', 'ksgggggggggggggk', 'kgggsgggggggsggk', 'kggggggsggggggSk', 'ksggggggggggggSk', 'kgggggggsgggSSSk', '.kSggggggggSSSk.', '..kkSSSSSSSSkk..', '....kkkkkkkk....'],
        { m: '#5f9a58', M: '#8cc474', g: '#8a86a2', s: '#aca8c4', S: '#5e5a78' });
    defSprite('puppet_snore', ['.......cc.......', '......cCcc......', '.....cCcccw.....', '....kkkkkkww....', '...kmmmmmmmmk...', '..kmmmmmmmmmmk..', '..kmmekmmekmmk..', '..kmmmmmmmmmmk..', '..kMmpmmmmpmMk..', '...kMMMMMMMMk...', '....kkmmmmkk....', '......kWWk......', '......kWWk......', '....kkkWWkkk....', '...kddddddddk...', '...kkkkkkkkkk...'],
        { m: '#d8b4ec', M: '#a884cc', c: '#6a8ec8', C: '#4a6aa8', w: '#fbf6ea', e: k, p: '#f0a0b8', W: '#c49a62', d: '#8a6040' });
    SPR.puppet_snore_up = SPR.puppet_snore;
    const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    /* a cradle: a little wicker crib, a white pillow at its head, a lavender quilt stitched in squares (pressed: the quilt
       sunk in the middle where somebody's lying) */
    for (const down of [false, true]) ART[down ? 'cradle_down' : 'cradle'] = paintSprite(16, 16, x => {
        R(x, '#5a3a24', 1, 1, 14, 14); R(x, '#5a3a24', 0, 2, 16, 12);
        for (let j = 2; j < 14; j++) for (let i = 1; i < 15; i++) if (i < 2 || i > 13 || j < 3 || j > 12) R(x, (i + j) % 2 ? '#c8945a' : '#a8743e', i, j, 1, 1);
        R(x, '#e8c08a', 2, 2, 12, 1);
        R(x, '#fbf6ea', 3, 3, 10, 3); R(x, '#e0d8ec', 3, 5, 10, 1); R(x, '#ffffff', 4, 3, 3, 1);
        for (let j = 6; j < 13; j++) for (let i = 2; i < 14; i++) {
            const sq = ((i >> 2) + (j >> 2)) % 2, sag = down && i > 4 && i < 11 && j > 7;
            R(x, sag ? (sq ? '#7d5bc4' : '#6a4aae') : (sq ? '#b48ce8' : '#9a76d8'), i, j, 1, 1);
        }
        R(x, '#d8c8f8', 2, 6, 12, 1); R(x, '#4b3a8a', 2, 12, 12, 1);
    });
    /* the round flat stone at a lantern's foot, a lantern carved in it (pressed: sunk, the carving dark) */
    for (const down of [false, true]) ART[down ? 'lanternstone_down' : 'lanternstone'] = paintSprite(16, 16, x => {
        discPx(x, 8, 8, 6, (px0, py0, u, v) => { const l = -u * 0.5 - v * 0.7 + (hash2(px0, py0, 4) - 0.5) * 0.4 - (down ? 0.5 : 0); return l > 0.45 ? '#c8c4d4' : l > -0.15 ? '#a09cb4' : l > -0.7 ? '#7e7a94' : '#5e5a74'; });
        const c = down ? '#3e3a54' : '#5e5a74';
        R(x, c, 7, 4, 2, 1); R(x, c, 6, 5, 4, 1); R(x, c, 6, 6, 1, 4); R(x, c, 9, 6, 1, 4); R(x, c, 6, 10, 4, 1); R(x, down ? '#e8b04a' : '#7e7a94', 7, 7, 2, 2);
    });
    /* a paper lantern on a post with a hook */
    for (const lit of [false, true]) ART[lit ? 'pond_lantern_lit' : 'pond_lantern'] = paintSprite(16, 32, x => {
        R(x, '#4a3424', 7, 4, 3, 28); R(x, '#6a4e36', 7, 4, 1, 28); R(x, '#4a3424', 7, 4, 7, 2); R(x, '#3a2618', 12, 6, 1, 2);
        const body = lit ? ['#fff4c0', '#f7d64a', '#e8a83a', '#c8782a'] : ['#f4ecdc', '#e0d4bc', '#c8b898', '#a89878'];
        R(x, '#3a2618', 10, 8, 5, 1); R(x, '#3a2618', 10, 18, 5, 1);
        for (let j = 9; j < 18; j++) { const w = j < 11 || j > 15 ? 3 : 5, x0 = 12 - (w >> 1); for (let i = 0; i < w; i++) R(x, i === 0 ? body[0] : i === w - 1 ? body[2] : body[1], x0 + i, j, 1, 1); }
        for (const j of [11, 14]) R(x, body[3], 10, j, 5, 1);
        R(x, '#c84a3a', 12, 19, 1, 3);
        R(x, '#3a2618', 5, 30, 7, 2);
    });
    /* the stone lantern on the isle (lit: its windows alight) */
    for (const lit of [false, true]) ART[lit ? 'great_lantern_lit' : 'great_lantern'] = paintSprite(16, 34, x => {
        const st = ['#c4c0d0', '#9c98b0', '#76728e', '#54506c'];
        R(x, st[2], 3, 30, 10, 4); R(x, st[1], 3, 30, 10, 1); R(x, st[2], 6, 20, 4, 10); R(x, st[1], 6, 20, 1, 10);
        R(x, st[2], 2, 17, 12, 3); R(x, st[0], 2, 17, 12, 1);
        R(x, st[1], 3, 9, 10, 8); R(x, lit ? '#f7d64a' : '#2e2a40', 5, 11, 2, 4); R(x, lit ? '#fff4c0' : '#2e2a40', 9, 11, 2, 4); R(x, st[3], 12, 9, 1, 8);
        for (let j = 0; j < 6; j++) R(x, j < 2 ? '#8cc474' : st[j % 2 ? 1 : 0], 1 + Math.max(0, 5 - j * 2) - 1, 3 + j, 16 - 2 * Math.max(0, 5 - j * 2), 1);
        R(x, st[2], 7, 0, 2, 3); R(x, '#5f9a58', 2, 7, 4, 1); R(x, '#5f9a58', 10, 8, 3, 1);
    });
    /* the Nursery's low hedge, clipped round, with lavender flowers; the one with a little round hole in its foot */
    for (const hole of [false, true]) ART[hole ? 'nursery_hole' : 'nursery_hedge'] = paintSprite(16, 19, x => {
        for (let j = 0; j < 17; j++) for (let i = 0; i < 16; i++) {
            const top = j < 4 ? Math.abs(i - 7.5) > 6.5 + j * 0.5 : false; if (top) continue;
            const l = -(i - 8) / 10 * 0.4 - (j - 7) / 9 * 0.8 + (hash2(i, j, hole ? 5 : 4) - 0.5) * 0.7;
            R(x, l > 0.55 ? '#8ad87a' : l > 0 ? '#5ab85a' : l > -0.55 ? '#3f9a4a' : '#2a6a36', i, j + 2, 1, 1);
        }
        for (const [a, b] of [[3, 5], [10, 4], [6, 9], [12, 10]]) { R(x, '#c8a8f0', a, b, 1, 1); R(x, '#9a76d8', a + 1, b + 1, 1, 1); }
        if (hole) { R(x, '#120c14', 5, 12, 6, 7); R(x, '#120c14', 6, 11, 4, 1); R(x, '#2a1f2d', 5, 12, 1, 7); }
    });
    /* the loom weight: lying in the moss, and as the satchel shows it */
    ART.loomweight_ground = paintSprite(16, 16, x => {
        discPx(x, 8, 10, 4, (px0, py0, u, v) => { const l = -u * 0.6 - v * 0.8 + (hash2(px0, py0, 6) - 0.5) * 0.4; return l > 0.5 ? '#c4c0cc' : l > -0.1 ? '#9a96a6' : l > -0.7 ? '#76728a' : '#58546c'; });
        R(x, '#2a1f2d', 7, 9, 2, 2); R(x, '#4c8457', 3, 13, 3, 1); R(x, '#4c8457', 11, 13, 2, 1);
    });
    defSprite('icon_oldweight', ['................', '................', '......kkkk......', '....kkwggxkk....', '...kwggggggxk...', '...kgggggggxk...', '..kwggkkkggxxk..', '..kgggk..kgxxk..', '..kgggk..kgxxk..', '..kgggkkkkgxxk..', '...kggggggxxk...', '...kgggggxxxk...', '....kkxxxxkk....', '......kkkk......', '................', '................']);
    /* things on the ground: moss cushions, a fern sprig, the town's grass in a tuft, fallen leaves, a toadstool */
    for (let i = 0; i < 3; i++) ART['hw_moss' + i] = paintSprite(6 + i, 4, x => { R(x, '#84bc7a', 1, 0, 3 + i, 1); R(x, '#68a266', 0, 1, 5 + i, 2); R(x, '#4c7e52', 1, 3, 3 + i, 1); R(x, '#a8d890', 1, 1, 1, 1); }, false);
    ART.hw_fern = paintSprite(7, 6, x => { R(x, '#3c6a48', 3, 1, 1, 5); for (const j of [1, 3]) { R(x, '#4e8a58', 0, j, 3, 1); R(x, '#4e8a58', 4, j + 1, 3, 1); } R(x, '#6aa86a', 3, 0, 1, 1); }, false);
    for (let i = 0; i < 2; i++) ART['hw_tuft' + i] = paintSprite(5, 5, x => { R(x, '#7cc35c', 0, 2, 1, 3); R(x, '#8fd46a', 2, 0, 1, 5); R(x, '#a9e07f', 4, 1 + i, 1, 4 - i); R(x, '#5fa84c', 1, 4, 3, 1); }, false);
    ART.hw_leaves = paintSprite(7, 4, x => { R(x, '#c87a3a', 0, 1, 2, 1); R(x, '#e09848', 1, 0, 2, 1); R(x, '#a8603a', 4, 2, 2, 1); R(x, '#d8a050', 5, 1, 2, 1); R(x, '#6a5038', 2, 3, 3, 1); }, false);
    ART.hw_toad = paintSprite(5, 5, x => { R(x, '#e8dcc8', 2, 2, 1, 3); R(x, '#c84a6a', 0, 0, 5, 2); R(x, '#fbe8f0', 1, 0, 1, 1); R(x, '#8a2a4a', 0, 2, 5, 1); }, false);
}
CONTENT_INIT.push(initHushArt2);
