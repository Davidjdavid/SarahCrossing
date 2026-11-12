/* Larkspur Fair (overworld block 0,1): an old fairground in a glade at the valley's western edge, the fog close
   by. Nobody comes; nobody can: the only ways in are a jump off Kilnridge's high mesa into the straw (only with a
   Bedroll laid up top to come home to) and, once you're in, the east gate to town, bolted on this side. The
   carousel (Linnet's note 7 under its wooden horse), the fortune teller's tent, a painted hedge, a pen with a
   bed of nails, toy soldiers on parade, and the Marionette Hall (House 6, Jory's). After the Hall, the Crossbar
   works the puppet on the mesa that winds the lift. The fog on the west: lay a Bedroll by it, walk in, and come
   back holding something (S11). The Hall's forecourt is shut by a portcullis that winds up only while both its
   parade pads are held down; a toy soldier marches up and down over each, in its own little pen. A balloon strains at
   its tether by the fog. Map drafted by tools/mapgen/larkspur.py. */

const MARIONETTE_ENTRY = { x: 29, y: 42 };
const LARK = (x, y) => [x, 40 + y];

const LARKSPUR_ROWS = [
    '%%%YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    '%%%YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    '%%%YYYY.YYYYYYYYYYYYYYY..................,YYYYYY..........".YYYY',
    '%%%YYYY.b...YYYYYYYYYYY..XXXXXXXXXXXXXX...YYYYYY..lfffffffl.YYYY',
    '%%%YYYY.b...YYYYYYYYYYY,.XXXXXXXXXXXXXX...YYYYYY.,l.......l.YYYY',
    '%%%YYYY.b...YYYYYYYYYYY..XXXXXXXXXXXXXX...YYYYYY..l.!!!!!.l.YYYY',
    '%%%YYYY.b...b............XXXXXXXXXXXXXX.,.YYYYYY..l.!!!!!.l.YYYY',
    '%%%YYYY"bb.bb".."......".XXXXXXXXXXXXXX..".w......l.!!!!!.l"YYYY',
    '%%%......................XXXXXXXXXXXXXX........w..l.."....l.YYYY',
    '%%%...,......w...........XXXXXX:XXXXXXX...........lfffOfffl.YYYY',
    '%%%.................,"......l..:..l......::::::::::::.......YYYY',
    '%%%.................".......fff:fff......:..................YYYY',
    '%%%.....:....,..............l.l:l.l......:................."YYYY',
    '%%%...".:..,w.................l:l........:..........w.".....YYYY',
    '%%%.,...:.............=======4===4=======:......"..,.......wYYYY',
    '%%%.....:.,...........===================...................YYYY',
    '%%%.....:....,.,......===================....,...,........,.YYYY',
    '%%%.....:.............===================.......w...........YYYY',
    '%%%.....::::::::::::::===================...................YYYY',
    '%%%...w...............===================:::::::::::::::::::::::',
    '%%%........,........,.===================:::::::::::::::::::::::',
    '%%%,.......,..........===================...................YYYY',
    '%%%YYYY......w........===================................ww.YYYY',
    '%%%YYYY....,,.,.......===================......,..YYYYYYYY..YYYY',
    '%%%YYYY...............===================.........YYYYYYYY..YYYY',
    '%%%YYYY...............===================.......,.YYYYYYYY..YYYY',
    '%%%YYYY..........:::::===================.......w,YYYYYYYY..YYYY',
    '%%%YYYY..w,......:....===================.........YYYYYYYY..YYYY',
    '%%%YYYY..........:............:...................YYYYYYYY..YYYY',
    '%%%YYYY..........:............:.........w.........YYYYYYYY,.YYYY',
    '%%%".............:......w.....:..YYYYYYYYY........YYYYYYYY..YYYY',
    '%%%..............:............:.,YYYYYYYYY........YYYYYYYY.,YYYY',
    '%%%..............:..w.........:..YYYYYYYYYw.......YYYYYYYY..YYYY',
    '%%%.........::::::............:..YYYYYYYYY........YYYYYYYY..YYYY',
    '%%%.....................:::::::..YYYYYYYYY...............,.,YYYY',
    '%%%......,.........,..w....................,.............w..YYYY',
    '%%%#########################################################YYYY',
    '%%%#########################################################YYYY',
    '%%%#########################################################YYYY',
    '%%%#########################################################YYYY',
];

defBlock({
    id: 'larkspur', bx: 0, by: 1, name: 'Larkspur Fair', theme: 'fair', music: 'fair', owArt: true, soft: 4, blobSeam: true,
    rows: LARKSPUR_ROWS,
    forest: ['tree', 'tree2', 'tree_fair'],
    legend: {
        'O': { k: 'crawl', p: 'fence', ent: 'crawlhole' }, '!': { k: 'spikes', p: 'spikes' },
        /* a fence post set in the square's cobbles */
        '4': { k: 'path', p: 'cobble', ent: 'deco', props: { look: 'fence_v' } },
    },
    drawGround: (a, cx, cy) => Larkspur.ground(a, cx, cy),
    drawOver: (a, cx, cy) => Larkspur.over(a, cx, cy),
    ents: [
        /* where you come down: straw bales under the mesa */
        { k: 'deco', x: 11, y: 35, look: 'haystack', solid: [[0, 0]], oy: -6, text: 'A great heap of straw. There is a dent in the top of it the exact shape of somebody falling off a mesa.' },
        { k: 'deco', x: 14, y: 35, look: 'haystack', solid: [[0, 0]], oy: -6, text: 'More straw. Someone stacked it under the cliff on purpose.' },
        { k: 'sign', x: 15, y: 32, text: "LARKSPUR FAIR. Closed for the season. (Which season? It doesn't say.)" },
        { k: 'rest', x: 20, y: 31 },
        /* the lift up to the mesa: wound by the puppet up top */
        { k: 'lift', x: 25, y: 35, id: 'larkLift', down: true },
        { k: 'sign', x: 27, y: 35, text: 'THE LIFT. Wound from the top by the stagehand. (The stagehand is a puppet. Please be kind to him.)' },
        /* the carousel, and its wooden horse (Linnet's note 7 underneath) */
        { k: 'carousel', x: 28, y: 17 },
        { k: 'puppet', x: 31, y: 22, id: 'carouselHorse', look: 'puppet_horse' },
        { k: 'linnetnote', x: 31, y: 22, note: 7, under: 'carouselHorse' },
        /* the fortune teller */
        { k: 'deco', x: 10, y: 10, look: 'tent_fortune', solid: [[0, 0], [1, 0], [2, 0]], ox: 0, oy: -20, text: "MADAME ROOK SEES ALL. (Madame Rook is round the front.)" },
        { k: 'npc', who: 'rook', x: 12, y: 12, face: 'down' },
        /* her wheel of fortune, painted on the grass: a brass pointer that always comes home to NOTHING */
        { k: 'rookwheel', x: 14, y: 10 }, { k: 'rookhub', x: 15, y: 11 }, { k: 'rooktoken', x: 15, y: 10, id: 'rookToken' },
        { k: 'sign', x: 18, y: 13, text: "MADAME ROOK'S WHEEL OF FORTUNE. Push the pointer round. Where it stops, so goes your fortune." },
        /* the painted hedge, and what's behind it */
        { k: 'flat', x: 10, y: 7, id: 'larkFlat', look: 'flat_hedge' },
        { k: 'chest', x: 10, y: 4, item: 'b50', id: 'larkNook' },
        /* the pen with its bed of nails: a puppet through the hole, over the nails, onto the plate */
        { k: 'plate', x: 54, y: 4, sig: 'penplate' },
        { k: 'puppet', x: 56, y: 11, id: 'penPuppet' },
        { k: 'chest', x: 52, y: 11, item: 'heartpatch', id: 'larkPen', hidden: true, when: 'penplate' },
        { k: 'sign', x: 49, y: 11, text: "THE AMAZING PUPPET FAKIR. Walks on nails! (Strings not included.)" },
        /* toy soldiers on parade */
        { k: 'soldier', x: 44, y: 19, facing: 'left', id: 'larkSol1' }, { k: 'soldier', x: 24, y: 15, facing: 'right', id: 'larkSol2' }, { k: 'soldier', x: 38, y: 24, facing: 'left', id: 'larkSol3' },
        /* the theatre */
        { k: 'building', x: 25, y: 3, w: 14, h: 7, door: 6, art: 'marionette' },
        { k: 'warp', x: 31, y: 9, to: 'marionette', tx2: MARIONETTE_ENTRY.x, ty2: MARIONETTE_ENTRY.y, face: 'up', dir: 'up' },
        { k: 'npc', who: 'pell', x: 36, y: 12, face: 'left' },
        /* the forecourt's portcullis: it winds up only while both parade pads are held down; a soldier in each pen */
        { k: 'portcullis', x: 31, y: 11, when: 'pgA&pgB|flag:hall_open|flag:d6', id: 'pgGate' },
        { k: 'drumpad', x: 29, y: 12, sig: 'pgA' }, { k: 'drumpad', x: 33, y: 12, sig: 'pgB' },
        { k: 'deco', x: 21, y: 14, look: 'fairpole', solid: [[0, 0]] }, { k: 'deco', x: 42, y: 15, look: 'fairpole', solid: [[0, 0]] },
        { k: 'deco', x: 21, y: 27, look: 'fairpole', solid: [[0, 0]] }, { k: 'deco', x: 42, y: 27, look: 'fairpole', solid: [[0, 0]] },
        { k: 'soldier', x: 29, y: 13, facing: 'up', id: 'pgSolA' }, { k: 'soldier', x: 33, y: 12, facing: 'down', id: 'pgSolB' },
        /* the fair's prop crates (they know where they live), and two pale ones by the fog with an L on each */
        { k: 'crate', x: 25, y: 12, id: 'lkProp1' }, { k: 'crate', x: 37, y: 14, id: 'lkProp2' },
        { k: 'crate', x: 4, y: 14, id: 'lkStray1', marked: false, noThrow: true, look: 'crate_l' },
        { k: 'crate', x: 4, y: 33, id: 'lkStray2', marked: false, noThrow: true, look: 'crate_l' },
        /* the balloon ascent, closed: its basket tugging west at a single glowing thread */
        { k: 'balloon', x: 5, y: 30, id: 'lkBalloon' },
        /* the big wheel in the west meadow, stopped */
        { k: 'deco', x: 15, y: 22, look: 'bigwheel', solid: [[0, 0], [1, 0], [2, 0], [3, 0]], ox: -16, text: 'The big wheel, stopped with one car at the top. Nobody has ridden it in a long time: there are birds nesting in the top car.' },
        /* the east gate to town, bolted on this side */
        { k: 'door', x: 61, y: 19, type: 'gate', when: 'flag:fair_gate', dir: 'v', id: 'fairGateA' },
        { k: 'door', x: 61, y: 20, type: 'gate', when: 'flag:fair_gate', dir: 'v', id: 'fairGateB' },
        { k: 'bolt', x: 59, y: 18 },
        /* the edge of the valley */
        { k: 'sign', x: 4, y: 19, text: 'THE EDGE. No further. (The fog will see to that.)' },
    ],
    regions: [
        { name: 'The Straw', x: 3, y: 28, w: 30, h: 8 },
        { name: 'The Midway', x: 20, y: 12, w: 22, h: 16 },
        { name: 'The Marionette Hall', x: 20, y: 2, w: 22, h: 10 },
        { name: 'The Edge', x: 3, y: 8, w: 6, h: 20, mark: false },
    ],
});

/* the jump: off the high mesa in Kilnridge, into the straw */
OW.blocks['0,2'].ents.push(
    { k: 'leap', x: 12, y: 3, id: 'mesaLeap' },
    { k: 'puppet', x: 24, y: 3, id: 'stagehand', look: 'puppet' },
    { k: 'crank', x: 25, y: 3, id: 'liftCrank', puppetOnly: true },
    { k: 'lift', x: 22, y: 3, id: 'mesaLift' },
);
/* the town's west road runs on to the fair's gate */
{
    for (const y of [19, 20]) HUB_ROWS[y] = ':::' + HUB_ROWS[y].slice(3);
    OW.blocks['1,1'].ents.push({ k: 'sign', x: 3, y: 18, text: 'LARKSPUR FAIR, this way. (The gate is bolted on the far side. It always has been.)' });
}

PEOPLE_DEF.rook = { name: 'Madame Rook', col: '#7d5bc4', look: { body: 'elder', hair: 'bun', hairC: '#2a1f2d', top: '#7d5bc4', accent: '#f7d64a', bottom: '#4b3a8a', skin: 'tan' } };
PEOPLE_DEF.pell = { name: 'Pell', col: '#e8463c', look: { body: 'adult', hair: 'short', hairC: '#c45a3a', top: '#e8463c', accent: '#fbf6ea', bottom: '#2e3a7a', skin: 'light', extra: ['mustache'] } };
TALK.rook = function* () {
    if (!Progress.flag('met:rook')) {
        Progress.set('met:rook');
        yield* say('rook', "Ah. A Wanderer. I saw you coming. Well: I heard the straw. Madame Rook, seer of all things, mostly things in the straw.");
        yield* say('rook', "Cross my palm with a button and I'll tell your fortune. ...No? Then here it is for free: you will go into the theatre. Everyone does.");
        return;
    }
    if (Progress.flag('reveal1')) { yield* say('rook', cycle('rook2', ["I knew. Of course I knew. I've watched them carry the scenery in for forty years.", "The fog? The fog is not my department.", "Your fortune: you are going to be very busy, very soon."])); return; }
    yield* say('rook', cycle('rook', [
        "I see... a stage. I see strings. I see a little puppet that looks very like you. Hm. Probably nothing.",
        "The soldiers march till they meet a wall, then about they turn. Nobody ever taught them to go round.",
        "That hedge by my tent. Don't you think it's a bit... flat?",
        "The fog over there pulls you home if you go in. Unless you've somewhere else to come home to. Then who knows what you'd bring back.",
        "The lift? The stagehand winds it, from the top. He's a puppet. Somebody would have to work him.",
        "My wheel's stopped on Nothing every day for forty years. I'm starting to take it personally.",
    ]));
};
TALK.pell = function* () {
    if (Progress.flag('reveal1')) { yield* say('pell', cycle('pell2', ["Show's over! What a show, eh? Jory's still taking bows.", "Roll up! Roll up! ...Oh, it's you. Bravo, kid. BRAVO."])); return; }
    yield* say('pell', cycle('pell', [
        "Roll up! Roll up! The Marionette Hall! Tonight's show: THE WANDERER! Starring... well. You, I suppose. Go on in!",
        "No, I don't know who's working the puppets. Nobody knows. That's the magic of theatre!",
        "The house lights are up and the seats are all empty. Perfect conditions.",
    ]));
};
BUDGE.rook = 'Madame Rook: "I foresaw that."';
BUDGE.pell = 'Pell: "Steady on! Steady on!"';

LINNET_NOTES[7] = { title: "A note under the carousel's horse", text: "The horse on the carousel walked off its pole for me. Someone was working it, from somewhere. They make the Houses, you know. They make all of it, for us, out of love, and they're very good at it, and they cry when we get things right. I followed the strings down. -L." };
NOTES.linnet7 = { title: LINNET_NOTES[7].title, text: LINNET_NOTES[7].text };

/* off the edge of the mesa (only with a Bedroll laid up top: there's no climbing back) */
SPAWN.leap = (x, y) => {
    const pr = new Prop(x, y, { im: ART.leap_edge, solid: [], oy: -4 });
    pr.baseY = -40;
    pr.interact = () => { Script.run(Larkspur.leap()); return true; };
    pr.talkBox = (pl, f) => (f.tx === x && f.ty === y) || (f.tx === x && f.ty === y - 1);
    return pr;
};
/* the lift: down at the fair and up on the mesa, running once the stagehand has wound it */
SPAWN.lift = (x, y, p) => {
    const pr = new Prop(x, y, { im: ART.lift, solid: [[0, 0]], oy: -10 });
    pr.interact = () => {
        Script.run(function* () {
            if (!Progress.flag('fair_lift')) { yield* say(null, p.down ? "A rickety lift, its cage hanging at the top of the cliff. A rope runs up to a winch on the mesa. Nobody's up there to wind it." : "The top of the lift. The winch handle is huge: worked by the stagehand puppet beside it, if anyone worked the stagehand."); return; }
            const i = yield* ask(null, p.down ? 'The lift. Ride up to the mesa?' : 'The lift. Ride down to the fair?', ['Ride', 'Not now']);
            if (i !== 0) return;
            yield* fadeOut(24);
            const [tx, ty] = p.down ? [21, 83] : LARK(24, 34);
            const pl = G.player; pl.x = tx * T + 8; pl.y = ty * T + 10; pl.setMark(); Cam.snap(pl);
            Sfx.play('door');
            yield* fadeIn(24);
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
/* the winch for the lift: a stagehand (a puppet) on it winds it */
class Crank extends FloorThing {
    constructor(tx, ty, p = {}) { super('crank', tx, ty, p); }
    update() { if (!Progress.flag('fair_lift') && this.weighed()) { Progress.set('fair_lift'); Sfx.play('door'); G.shake = 4; G.pendingToast = 'The stagehand leans on the winch. Far below, the lift cage rattles down to the fair.'; } }
    draw(cx, cy) { Gfx.img(ART.crank, this.x - cx, this.y - cy); }
}
SPAWN.crank = (x, y, p) => new Crank(x, y, p);
/* the bolt on the fair's side of the east gate */
SPAWN.bolt = (x, y) => {
    const pr = new Prop(x, y, { im: ART.bolt, solid: [[0, 0]], oy: -6 });
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('fair_gate')) { yield* say(null, 'The bolt is drawn. The gate to town stands open.'); return; }
            Progress.set('fair_gate'); Sfx.play('unlock');
            /* the town's side of the West Gate (a fence in the road) opens with it: each leaf swings back on its hinge, the
               upper one north, the lower one south, and folds away against its post */
            const a = G.map;
            for (const e of a.ents.filter(o => o.skey === 'westGateA' || o.skey === 'westGateB')) {
                for (const [dx, dy] of e.solid || []) a.staticSolid.delete((e.ty + dy) * 4096 + (e.tx + dx));
                e.solid = [];
                const up = e.skey === 'westGateA', im = e.im, t0 = G.t;
                e.draw = (cx, cy) => {
                    const k = Math.min(1, (G.t - t0) / 28), h = Math.round(im.height * (1 - k * k * 0.85));
                    if (!im || HEADLESS || k >= 1) return;
                    Gfx.ctx.drawImage(im, 0, 0, im.width, im.height, Math.round(e.x - cx), Math.round(e.y - cy) + (up ? 0 : im.height - h), im.width, h);
                };
            }
            yield* say(null, 'A big iron bolt, stiff with rust. You heave it back. The fair gate swings open onto the west road into town.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
/* the carousel: turns slowly by itself, whether anyone rides or not */
SPAWN.carousel = (x, y) => {
    const pr = new Prop(x, y, { im: ART.carousel_0, solid: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [1, 3], [2, 3], [3, 3], [4, 3]], oy: -26, live: true });
    pr.update = function () { this.t = (this.t || 0) + 1; };
    pr.draw = function (cx, cy) { Gfx.img(ART['carousel_' + ((this.t >> 4) % 2)], this.x - cx, this.y - cy); };
    pr.baseY = 92;
    return pr;
};

const Larkspur = {
    *leap() {
        if (!Inv.has('bedroll')) { yield* say(null, "The mesa drops away to a fairground, far below: tents, a carousel, a theatre, all very small. It's a long way down, and no way back up."); return; }
        const b = Inv.bedroll;
        if (!b || b.area !== 'hollow') { yield* say(null, "The fairground is a long way below. You could jump into the straw, but there's no climbing back up. You'd want your Bedroll laid somewhere first, to come home to."); return; }
        const i = yield* ask(null, 'A fairground, far below, and a heap of straw right under the edge. Jump?', ['Jump', 'Not now']);
        if (i !== 0) return;
        Sfx.play('flight');
        yield* fadeOut(20);
        const p = G.player, [tx, ty] = LARK(12, 34);
        p.x = tx * T + 8; p.y = ty * T + 10; p.dir = UP; p.setMark(); Cam.snap(p);
        Sfx.play('land');
        yield* fadeIn(30);
        Fx.dust(p.x, p.y);
        if (!Progress.flag('leapt')) { Progress.set('leapt'); const pl = G.player; pl.state = 'sleep'; yield* say(null, 'You land by the haystacks with a whump, and lie there a moment, looking up at the mesa. It is a very long way up.'); pl.state = 'normal'; }
    },
};

/* S11: lay the Bedroll by the fog, walk in till it pulls you, and you come home holding something */
ITEMS.driftseed = { name: 'Drift-bloom seed', kind: 'quest', desc: "A seed from somewhere past the fog. It's warm. Something to plant at home." };
{
    const pull = Story.fogPull;
    Story.fogPull = function (p) {
        const b = Inv.bedroll;
        const near = b && b.area === p.area.id && Math.hypot(b.tx - p.tx, b.ty - p.ty) <= 6;
        pull.call(this, p);
        if (near && !Progress.flag('s11')) { Progress.set('s11'); Stats.count('secret:driftseed'); Inv.items.driftseed = 1; G.pendingSeed = true; }
    };
    /* once the fog's own words are said and Wren is home: the seed */
    const prev = Story.tick;
    Story.tick = a => {
        if (prev) prev(a);
        const p = G.player;
        if (G.pendingSeed && p && p.state === 'normal' && !Script.blocking() && !Dialog.active) {
            G.pendingSeed = false;
            Script.run(function* () {
                yield* say(null, 'You land on your Bedroll with something in your fist that you did not take in with you: a fat brown seed, warm as a hand.');
                delete Inv.items.driftseed;    /* (it was kept safe from the moment the fog let go; now it's shown) */
                yield* Story.getItem('driftseed')();
            });
        }
    };
}

/* the theatre, from outside: red velvet, gold, a painted proscenium over the doors, posters */
FACADES.marionette = function () {
    const w = 224, h = 118;
    ART.f_marionette = paintSprite(w, h, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        /* the pediment: a gold-edged gable with a mask in it */
        for (let j = 0; j < 30; j++) { const half = Math.round(j * 3.4); R(j % 6 === 5 ? '#a8742a' : '#c42b4a', 112 - half, 4 + j, half * 2, 1); }
        R('#f7d64a', 12, 34, 200, 3);
        R('#fbf6ea', 104, 14, 16, 14); R('#2a1f2d', 107, 18, 3, 3); R('#2a1f2d', 114, 18, 3, 3); R('#2a1f2d', 108, 23, 8, 2);
        /* columns and walls */
        R('#9a1e36', 8, 37, 208, 75);
        for (const cxo of [10, 50, 166, 206]) { R('#f4e6c8', cxo - 4, 37, 10, 75); R('#d8c8a8', cxo + 4, 37, 2, 75); R('#f7d64a', cxo - 6, 37, 14, 3); }
        /* the doors under a lit sign */
        R('#2a1f2d', 84, 60, 56, 52); R('#c42b4a', 88, 64, 22, 48); R('#c42b4a', 114, 64, 22, 48); R('#f7d64a', 108, 84, 2, 6); R('#f7d64a', 114, 84, 2, 6);
        R('#2a1f2d', 70, 42, 84, 14); R('#f7d64a', 72, 44, 80, 10); R('#fff4c0', 72, 44, 80, 1); R('#d9a33a', 72, 53, 80, 1);
        for (let i = 0; i < 20; i++) { R(i % 2 ? '#fff4c0' : '#e8b04a', 72 + i * 4, 40, 2, 2); R(i % 2 ? '#e8b04a' : '#fff4c0', 72 + i * 4, 56, 2, 2); }
        /* its name, in the game's own letters, painted crimson with a gold shadow */
        const name = 'MARIONETTE';
        let lx = 112 - Math.floor((name.split('').reduce((s, ch) => s + FONT[ch].w + 1, 0) - 1) / 2);
        for (const ch of name) {
            FONT[ch].rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') { R('#d9a33a', lx + i + 1, 46 + j, 1, 1); } });
            FONT[ch].rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R('#9a1e36', lx + i, 45 + j, 1, 1); });
            lx += FONT[ch].w + 1;
        }
        /* posters either side: a puppet, and a girl with a stick */
        R('#fbf6ea', 20, 56, 22, 30); R('#d6304e', 26, 62, 10, 16); R('#e6c08a', 28, 58, 6, 6); R('#2a1f2d', 30, 50, 1, 8);
        R('#fbf6ea', 182, 56, 22, 30); R('#e8463c', 188, 64, 10, 14); R('#8a5a3a', 189, 58, 8, 6); R('#9a6438', 198, 60, 2, 18);
        R('#5a1428', 0, 112, w, 6); R('#f7d64a', 0, 112, w, 1);
    });
};

function initLarkspurArt() {
    const sq = (c, a, b, ww, hh, x) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
    ART.haystack = paintSprite(20, 22, x => {
        for (let j = 0; j < 20; j++) { const half = Math.round(Math.sqrt(Math.max(0, 100 - (j - 10) * (j - 10))) ); sq(j % 4 === 0 ? '#c8a050' : '#e8c068', 10 - half, 2 + j, half * 2, 1, x); }
        sq('#a8803a', 2, 19, 16, 3, x);
    });
    for (let f = 0; f < 2; f++) ART['carousel_' + f] = paintSprite(96, 92, x => {
        const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x);
        /* the canopy: striped, scalloped, a flag on top */
        for (let j = 0; j < 22; j++) { const half = Math.round(10 + j * 1.75); for (let i = -half; i < half; i++) R(((Math.floor((i + f * 6) / 6) % 2) === 0) ? '#d6304e' : '#fbf6ea', 48 + i, 10 + j, 1, 1); }
        for (let i = 0; i < 12; i++) R('#f7d64a', 10 + i * 6.5, 32, 5, 3);
        R('#9a6438', 47, 0, 2, 12); R('#f7d64a', 49, 1, 7, 5);
        /* the turning floor, the poles, the horses going round */
        R('#5a1428', 6, 72, 84, 10); R('#f7d64a', 6, 72, 84, 2); R('#9a1e36', 6, 82, 84, 4);
        for (let i = 0; i < 6; i++) { const px = 12 + ((i * 14 + f * 7) % 78); R('#f7d64a', px, 35, 2, 38); R(i % 2 ? '#fbf6ea' : '#e6c08a', px - 5, 54 + (i % 2) * 4, 12, 7); R('#2a1f2d', px + 4, 55 + (i % 2) * 4, 2, 2); }
        R('#c42b4a', 42, 35, 12, 37); R('#f7d64a', 42, 35, 12, 2);
    });
    defSprite('puppet_horse', ['................', '...........kk...', '..........kwwk..', '.........kwwewk.', '........kwwwwk..', '...kkkkkkwwwk...', '..kwwwwwwwwwk...', '.kwwwwwwwwwwk...', '.kWwwwwwwwWWk...', '..kWWWWWWWWk....', '..kw.kw.kw.kw...', '..kw.kw.kw.kw...', '..kk.kk.kk.kk...', '....kyyyyyk.....', '...kddddddddk...', '...kkkkkkkkkk...'], { w: '#fbf6ea', W: '#d8c8a8', e: '#2a1f2d', y: '#f7d64a', d: '#9a6438' });
    SPR.puppet_horse_up = SPR.puppet_horse;
    defSprite('flat_hedge', ['kkkkkkkkkkkkkkkk', 'kgGggGgggGggGggk', 'kGggggGggggGgggk', 'kggGgggggGgggGgk', 'kgggggGggggggggk', 'kGggGgggGgggGggk', 'kgggggggggggggGk', 'kggGgggGggggggggk'.slice(0, 16), 'kgggggggggGggggk', 'kGgggGgggggggGgk', 'kggggggGgggggggk', 'kgGgggggggGggggk', 'kdddddddddddddddk'.slice(0, 16), 'kdddddddddddddddk'.slice(0, 16), 'kkkkkkkkkkkkkkkk', '................'], { g: '#5ea84c', G: '#3e7a3a', d: '#7a5a3a' });
    ART.tent_fortune = paintSprite(48, 40, x => {
        const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x);
        for (let j = 0; j < 36; j++) { const half = Math.round(4 + j * 0.6); for (let i = -half; i < half; i++) R(((Math.floor(i / 4) % 2) === 0) ? '#7d5bc4' : '#2e2450', 24 + i, 2 + j, 1, 1); }
        R('#2a1f2d', 18, 22, 12, 16); R('#f7d64a', 23, 0, 2, 4); R('#f7d64a', 22, 26, 4, 4);
    });
    ART.lift = paintSprite(16, 26, x => { const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x); R('#6b4128', 0, 6, 2, 20); R('#6b4128', 14, 6, 2, 20); R('#9a6438', 0, 6, 16, 2); R('#9a6438', 0, 22, 16, 4); R('#c8a07a', 2, 8, 12, 14); R('#a88a5a', 2, 14, 12, 1); R('#d8c08a', 7, 0, 2, 6); });
    ART.crank = paintSprite(16, 16, x => { const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x); R('#6b4128', 2, 6, 12, 8); R('#9a6438', 3, 7, 10, 6); R('#d8c08a', 7, 2, 2, 6); R('#5a3a2a', 6, 1, 6, 2); });
    ART.bolt = paintSprite(16, 18, x => { const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x); R('#6b4128', 4, 2, 8, 16); R('#7a6a6a', 2, 6, 12, 4); R('#a89a9a', 2, 6, 12, 1); R('#5a4a4a', 12, 5, 3, 6); });
    ART.leap_edge = paintSprite(16, 10, x => { const R = (c, a, b, ww, hh) => sq(c, a, b, ww, hh, x); R('#c4623a', 0, 4, 16, 2); R('#8a3c26', 0, 6, 16, 2); R('#e8b884', 3, 2, 3, 2); R('#e8b884', 10, 2, 3, 2); });
}
CONTENT_INIT.push(initLarkspurArt);

/* ---------- the Hall's forecourt: a portcullis wound up by two parade pads ---------- */
/* it winds up slowly while what it wants holds, and drops fast when it doesn't (never onto anybody) */
class Portcullis extends Door {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ type: 'gate', dir: 'h' }, p)); this.rise = 0; }
    onAdd(area) { super.onAdd(area); if (Signals.eval(area, (this.when || '').split('|').filter(t => t.startsWith('flag:')).join('|'))) { this.rise = 60; this.open = true; } }
    update() {
        const want = Signals.eval(this.area, this.when), was = this.open;
        if (want) { if (this.rise < 60 && ++this.rise % 12 === 1) Sfx.play('click', 0.35); }
        else if (this.rise > 0) { const p = G.player; if (!(p && p.area === this.area && p.onTile(this.tx, this.ty))) this.rise = Math.max(0, this.rise - 6); }
        this.open = this.rise >= 60;
        if (this.open && !was) Sfx.play('door');
        if (!this.open && was) Sfx.play('doorshut');
    }
    get sortY() { return this.y + 15; }
    draw(cx, cy) {
        const sx = this.x - cx, sy = this.y - cy, h = Math.round(26 * (1 - this.rise / 60));
        /* the grille, rising into the red bar overhead (which stays) */
        if (h > 0) {
            for (let i = 1; i < 16; i += 4) { Gfx.rect(sx + i, sy - 10, 2, h, PAL.ink); Gfx.rect(sx + i, sy - 10, 1, h, '#e8c86a'); }
            for (let j = 2; j < h; j += 6) { Gfx.rect(sx, sy - 10 + j, 16, 2, PAL.ink); Gfx.rect(sx, sy - 10 + j, 16, 1, '#c9a24a'); }
            for (let i = 1; i < 16; i += 4) Gfx.rect(sx + i, sy - 10 + h, 2, 1, '#8a6a2a');
        }
        Gfx.rect(sx - 1, sy - 14, 18, 5, PAL.ink); Gfx.rect(sx, sy - 13, 16, 3, '#d6304e'); Gfx.rect(sx, sy - 13, 16, 1, '#f07080');
    }
}
SPAWN.portcullis = (x, y, p) => new Portcullis(x, y, p);
/* a parade pad: a drum let into the ground; anything standing on it holds it down */
SPAWN.drumpad = (x, y, p) => {
    const c = new Plate(x, y, p);
    c.draw = function (cx, cy) { Gfx.img(ART[this.down ? 'drumpad_down' : 'drumpad'], this.x - cx, this.y - cy); };
    return c;
};
/* once you've been in, the forecourt's open to you */
{
    const enter0 = World.enter;
    World.enter = function (id, ...rest) {
        if ((id === 'marionette' || (Progress.areaFlags && Progress.areaFlags.marionette)) && !Progress.flag('hall_open')) Progress.set('hall_open');
        return enter0.call(this, id, ...rest);
    };
}

/* ---------- the balloon ascent: a basket by the fog, its balloon pulling west at a single bright thread ---------- */
class Balloon extends GridThing {
    constructor(tx, ty, p = {}) { super('balloon', tx, ty, Object.assign({ weight: WEIGHT.medium, noPush: true, thread: THREAD.jory }, p)); this.t = 0; this.away = null; }
    canPush() { return false; }
    tick() { this.t++; }
    interact() {
        Script.run(function* () { yield* say(null, 'A wicker basket under a striped balloon, CLOSED painted on its side. The balloon leans west over the fog, straining, held down by one bright thread to a peg in the grass.'); });
        return true;
    }
    /* cut, up it goes, west over the fog, and away */
    onCut(quiet) {
        if (quiet) { this.area.remove(this); return; }
        Progress.set('balloon_away'); Stats.count('balloon');
        this.away = { t: 0 }; this.area.unplace(this, this.tx, this.ty);
        G.pendingToast = 'Snip. The basket lifts off the grass, and up, and drifts away west over the fog.';
    }
    update() {
        super.update();
        if (this.away && ++this.away.t > 240) this.area.remove(this);
    }
    get sortY() { return this.y + 30; }
    draw(cx, cy) {
        const k = this.away ? this.away.t / 240 : 0, bob = Math.round(Math.sin(this.t / 30) * 1.5);
        const x = this.x - cx - 8 - Math.round(k * k * 120), y = this.y - cy - 40 + bob - Math.round(k * 60);
        if (!this.away) {
            /* the tether, glowing, to its peg */
            Gfx.line(x + 16, y + 48, this.x - cx + 14, this.y - cy + 13, THREAD.jory);
            Gfx.rect(this.x - cx + 13, this.y - cy + 12, 3, 3, '#6b4128');
            Gfx.alpha(0.25); Gfx.rect(this.x - cx + 2, this.y - cy + 13, 12, 2, PAL.ink); Gfx.alpha(1);
        }
        Gfx.img(ART.balloon, x, y, false, this.away ? Math.max(0, 1 - k * 1.2) : 1);
    }
}
SPAWN.balloon = (x, y, p) => Progress.flag('balloon_away') ? new Ent('none') : new Balloon(x, y, p);

/* ---------- the fair's look: trampled meadow, sawdust walks, larkspur in the grass, bunting over the square ---------- */
OWA.ground.fair = {
    /* meadow grass, trodden paler in patches, clover */
    grass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0); speckle(x, [g1], 11 + v * 13, 0.12); speckle(x, [g2], 23 + v * 7, 0.04);
        /* now and then a trodden spot, the grass flattened paler */
        if (v === 3) for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = Math.hypot((i - 9) * 1.3, j - 10); if (d < 3 + hash2(i, j, 5) * 2) px(x, i, j, hash2(i, j, 6) < 0.5 ? '#b4d088' : '#a8c87c'); }
        for (let n = 0; n < 3; n++) { const bx = 1 + Math.floor(hash2(v, n, 3) * 14), by = 2 + Math.floor(hash2(n, v, 5) * 13); px(x, bx, by, g3); px(x, bx, by - 1, g1); }
        if (v === 2) { px(x, 4, 5, '#5a9a4a'); px(x, 5, 5, '#5a9a4a'); px(x, 4, 4, '#7cc06a'); px(x, 5, 6, g3); }
    },
    /* larkspur: spikes of blue and violet flowers */
    flowers(x, th, v) {
        OWA.ground.fair.grass(x, th, v);
        const cols = [['#7a8ae8', '#b4c0f8'], ['#9a6ad8', '#c8a8f0'], ['#e87aa8', '#f8c0d8']];
        for (let n = 0; n < 2; n++) {
            const [c0, c1] = cols[(n + v) % 3], fx = 3 + Math.floor(hash2(n, v, 1) * 10), fy = 6 + Math.floor(hash2(v + 3, n, 2) * 6);
            px(x, fx, fy + 4, th.grass[3]); px(x, fx, fy + 3, '#4a8a3a');
            for (let j = 0; j < 4; j++) { px(x, fx, fy - j, j % 2 ? c1 : c0); if (j < 3) px(x, fx + (j % 2 ? -1 : 1), fy - j, c0); }
        }
    },
    /* sawdust: pale shavings over trodden earth */
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.16); speckle(x, ['#f8ecc8'], 41 + v, 0.1);
        for (let n = 0; n < 4; n++) { const sx = Math.floor(hash2(v, n, 12) * 14), sy = Math.floor(hash2(n, v, 13) * 15); px(x, sx, sy, '#c89a5a'); px(x, sx + 1, sy, '#e8c08a'); px(x, sx + 2, sy + (n % 2), '#c89a5a'); }
        if (v === 3) { fill(x, '#fbf6ea', 10, 4, 3, 2); px(x, 10, 4, '#e8463c'); px(x, 12, 5, '#e8463c'); }
    },
    tallgrass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0);
        for (let i = 0; i < 7; i++) { const bx = 1 + i * 2, h = 7 + Math.floor(hash2(i, v, 4) * 6); for (let j = 0; j < h; j++) px(x, Math.min(15, bx + (j > h - 4 ? 1 : 0)), 15 - j, j > h - 3 ? '#d8e8a0' : j > h / 2 ? g2 : g1); px(x, bx, 15, g3); }
    },
    forest(x, th, v) { fill(x, '#3a6a32'); speckle(x, ['#467a3a', '#2e5a2a'], v + 9, 0.3); },
};
Object.assign(Larkspur, {
    ground() { },
    /* bunting strung from pole to pole over the square, swaying */
    RUNS: [[[21, 14], [42, 15]], [[21, 27], [42, 27]]],
    over(a, cx, cy) {
        if (HEADLESS || cx > 64 * T || cx + W < 0 || cy + H < 40 * T || cy > 80 * T) return;
        const cols = ['#e8463c', '#f7d64a', '#4f9be0', '#fbf6ea', '#5ab85a', '#d0608e'];
        for (const [[x0, y0], [x1, y1]] of this.RUNS) {
            const ax = x0 * T + 8 - cx, ay = (40 + y0) * T - 34 - cy, bx = x1 * T + 8 - cx, by = (40 + y1) * T - 34 - cy;
            if (Math.max(ax, bx) < -20 || Math.min(ax, bx) > W + 20 || Math.max(ay, by) < -30 || Math.min(ay, by) > H + 30) continue;
            const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 7)), sway = Math.sin(G.t / 50 + x0) * 2;
            let px0 = ax, py0 = ay;
            for (let i = 1; i <= n; i++) {
                const u = i / n, sag = Math.sin(u * Math.PI) * (14 + sway), qx = ax + (bx - ax) * u, qy = ay + (by - ay) * u + sag;
                Gfx.line(px0, py0, qx, qy, '#5a3a2a');
                if (i < n) { const c = cols[i % cols.length]; Gfx.rect(qx - 2, qy + 1, 5, 1, c); Gfx.rect(qx - 1, qy + 2, 3, 1, c); Gfx.rect(qx, qy + 3, 1, 1, c); }
                px0 = qx; py0 = qy;
            }
        }
    },
});

function initLarkspurArt2() {
    const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    treeArt('tree_fair', { leaf: ['#4fa84a', '#6fc65a', '#a0e078', '#2e7a43'], bark: ['#9a6438', '#6b4128', '#45281c'], fruit: '#f59ac0' }, 8);
    /* a stray crate with an L scratched in its side */
    defSprite('crate_l', SPR_SRC.crate.rows.map((r, j) => j === 8 ? '..kbbkbbbbbbbk..' : j === 9 ? '..kbbkbbbBbbbk..' : j === 10 ? '..kbbkkkbBbbbk..' : r), { u: '#f0f8e0', U: '#d8e8b8', b: '#c8dca8', B: '#98b07a' });
    /* a parade pad: a drum let into the ground, red rim and a white skin (held down: the skin sunk and shadowed) */
    for (const down of [false, true]) ART[down ? 'drumpad_down' : 'drumpad'] = paintSprite(16, 16, x => {
        discPx(x, 8, 8, 7, (px0, py0, u, v) => { const d = u * u + v * v; if (d > 0.62) return v < 0 ? '#e8463c' : '#9a1e36'; const l = -u * 0.4 - v * 0.6 - (down ? 0.6 : 0); return l > 0.2 ? '#fbf6ea' : l > -0.3 ? '#e8dcc8' : '#c8b898'; });
        for (const [a, b] of [[2, 8], [14, 8], [8, 2], [8, 14]]) R(x, '#f7d64a', a - (a > 8 ? 1 : 0), b - (b > 8 ? 1 : 0), 1, 1);
    });
    /* a striped pole for the bunting, a gilded knob on top */
    ART.fairpole = paintSprite(8, 44, x => { for (let j = 4; j < 44; j++) { R(x, (j >> 2) % 2 ? '#e8463c' : '#fbf6ea', 2, j, 4, 1); R(x, '#2a1f2d', 5, j, 1, 1); } R(x, '#f7d64a', 1, 0, 6, 5); R(x, '#fff4c0', 2, 1, 2, 2); });
    /* the balloon: a striped envelope, its ropes, the wicker basket */
    ART.balloon = paintSprite(32, 56, x => {
        for (let j = 0; j < 34; j++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - ((j - 15) / 17) ** 2)) * 14 * (j > 24 ? 1 - (j - 24) / 16 : 1)); for (let i = -w; i < w; i++) { const band = Math.floor((i + 14) / 4) % 2, l = -i / 14 * 0.6 - (j - 12) / 20; R(x, band ? (l > 0.3 ? '#ff8a7a' : l > -0.2 ? '#e8463c' : '#a82a26') : (l > 0.3 ? '#ffffff' : l > -0.2 ? '#f4ecdc' : '#c8bca8'), 16 + i, j, 1, 1); } }
        R(x, '#7a4e32', 9, 34, 1, 10); R(x, '#7a4e32', 22, 34, 1, 10); R(x, '#7a4e32', 13, 33, 1, 11); R(x, '#7a4e32', 18, 33, 1, 11);
        R(x, '#9a6438', 8, 44, 16, 10); for (let j = 44; j < 54; j += 2) R(x, '#c9925a', 8, j, 16, 1); for (let i = 8; i < 24; i += 3) R(x, '#6b4128', i, 44, 1, 10); R(x, '#e6c08a', 8, 44, 16, 1);
    });
    /* the big wheel: a rim of red and white on spokes, gondolas hanging, an A-frame of timber */
    ART.bigwheel = paintSprite(96, 112, x => {
        const cx = 48, cy = 46, r = 40;
        R(x, '#6b4128', 20, 50, 4, 62); R(x, '#6b4128', 72, 50, 4, 62);
        for (let j = 0; j < 62; j++) { R(x, '#9a6438', 22 + Math.round(j * 0.42), 46 + j, 3, 1); R(x, '#7a4e32', 72 - Math.round(j * 0.42), 46 + j, 3, 1); }
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let t = 4; t < r; t++) R(x, '#d8c8a8', Math.round(cx + Math.cos(a) * t), Math.round(cy + Math.sin(a) * t), 1, 1); }
        for (let k = 0; k < 360; k++) { const a = k / 360 * Math.PI * 2; R(x, Math.floor(k / 15) % 2 ? '#e8463c' : '#fbf6ea', Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2); }
        R(x, '#f7d64a', cx - 4, cy - 4, 8, 8); R(x, '#a8742a', cx - 2, cy - 2, 4, 4);
        const gc = ['#4f9be0', '#5ab85a', '#f7d64a', '#d0608e', '#7d5bc4', '#e0913a', '#3fc1b5', '#e8463c'];
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 - Math.PI / 2, gx = Math.round(cx + Math.cos(a) * r), gy = Math.round(cy + Math.sin(a) * r); R(x, '#5a3a2a', gx, gy, 1, 4); R(x, gc[k], gx - 5, gy + 4, 11, 6); R(x, shade(gc[k], -0.35), gx - 5, gy + 9, 11, 1); R(x, '#fbf6ea', gx - 3, gy + 5, 3, 2); }
        R(x, '#8a7a6a', 14, 106, 68, 6); R(x, '#a89c8c', 14, 106, 68, 2);
    });
}
CONTENT_INIT.push(initLarkspurArt2);

/* ---------- Madame Rook's wheel of fortune (the Needle) ----------
   Painted on the grass by her tent: twelve fortunes round a hub, and a brass pointer on the rim that's pushed round to
   one. It has its place on NOTHING, and home it goes, the long way round whichever way it was pushed. THE TRUTH is
   right across the hub from NOTHING, six fortunes either way: further than the Needle reaches in one stitch, and pushed
   all the way there it only sets off home again. Pushed partway, then stitched the rest of the way (or stitched partway,
   pushed, and stitched again), its place is THE TRUTH, and there it stops. */
const ROOK_RIM = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1]];
const ROOK_FORTUNES = ['A JOURNEY', 'NOTHING', 'A BUTTON', 'RAIN', 'A WISH', 'A FRIEND', 'A SURPRISE', 'THE TRUTH', 'SECRETS', 'A LONG WALK', 'LOVE', 'TEA'];
const RookWheel = {
    at: [14, 10],
    /* which fortune a tile is (by the wheel's own corner, in the Hollow), or -1 */
    fortune(tx, ty) { const [x0, y0] = LARK(...this.at); return ROOK_RIM.findIndex(([dx, dy]) => tx === x0 + dx && ty === y0 + dy); },
    /* the pointer, if it's stopped on a fortune for good (its place there, or no place at all any more) */
    stopped(a) {
        const e = a && a.find('rookToken');
        if (!e || e.mv || e.carried || e.heldBy) return -1;
        if (e.ret && !(e.ret.state === 'home' && e.ret.mx === e.tx && e.ret.my === e.ty)) return -1;
        return this.fortune(e.tx, e.ty);
    },
};
class RookWheelPaint extends FloorThing {
    constructor(tx, ty, p = {}) { super('rookwheel', tx, ty, p); }
    draw(cx, cy) {
        const x0 = this.x - cx, y0 = this.y - cy;
        if (x0 < -64 || y0 < -64 || x0 > W || y0 > H) return;
        const cols = ['#e8463c', '#f7d64a', '#4f9be0', '#fbf6ea'];
        /* a brass edge round the whole wheel, then each fortune's patch in turn, its sign in the middle */
        Gfx.rect(x0 - 1, y0 - 1, 66, 66, '#a8742a');
        ROOK_RIM.forEach(([dx, dy], i) => {
            const sx = x0 + dx * T, sy = y0 + dy * T;
            Gfx.rect(sx, sy, T, T, i === 7 ? '#7d5bc4' : cols[i % 4]); Gfx.rect(sx, sy, T, 1, '#fff4c0'); Gfx.rect(sx, sy + 15, T, 1, '#6a4e2a');
            const c = i === 3 ? '#4a6ab8' : i % 4 === 1 ? '#a8742a' : '#2a1f2d', mx = sx + 8, my = sy + 8;
            switch (i) {
                case 1: Gfx.rect(mx - 2, my - 2, 4, 1, c); Gfx.rect(mx - 2, my + 1, 4, 1, c); Gfx.rect(mx - 3, my - 1, 1, 2, c); Gfx.rect(mx + 2, my - 1, 1, 2, c); break;  /* an O */
                case 2: Gfx.rect(mx - 2, my - 2, 5, 5, c); Gfx.rect(mx - 1, my - 1, 1, 1, '#fbf6ea'); Gfx.rect(mx + 1, my + 1, 1, 1, '#fbf6ea'); break;
                case 4: for (let j = -2; j <= 2; j++) { Gfx.rect(mx + j, my, 1, 1, c); Gfx.rect(mx, my + j, 1, 1, c); } break;            /* a star */
                case 7: Gfx.rect(mx - 4, my - 1, 9, 3, '#fbf6ea'); Gfx.rect(mx - 1, my - 1, 3, 3, '#2a1f2d'); Gfx.rect(mx - 3, my - 2, 7, 1, '#2a1f2d'); Gfx.rect(mx - 3, my + 2, 7, 1, '#2a1f2d'); break;   /* an eye */
                case 10: Gfx.rect(mx - 3, my - 2, 2, 2, c); Gfx.rect(mx + 1, my - 2, 2, 2, c); Gfx.rect(mx - 3, my, 6, 1, c); Gfx.rect(mx - 2, my + 1, 4, 1, c); Gfx.rect(mx - 1, my + 2, 2, 1, c); break;   /* a heart */
                default: Gfx.rect(mx - 1, my - 1, 3, 3, c);
            }
        });
    }
}
SPAWN.rookwheel = (x, y, p) => new RookWheelPaint(x, y, p);
SPAWN.rookhub = (tx, ty) => {
    const pr = new Prop(tx, ty, { solid: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    pr.baseY = 30;
    pr.draw = function (cx, cy) {
        const x = this.x - cx + 16, y = this.y - cy + 16;
        Gfx.circle(x, y, 13, PAL.ink); Gfx.circle(x, y, 12, '#9a1e36'); Gfx.circle(x, y, 9, '#d6304e'); Gfx.circle(x, y, 4, '#f7d64a');
        Gfx.rect(x - 1, y - 14, 3, 12, PAL.ink); Gfx.rect(x, y - 14, 1, 11, '#fff4c0'); Gfx.circle(x, y - 15, 3, '#f7d64a');
    };
    pr.interact = () => { Script.run(function* () { yield* say(null, 'The hub of the wheel, a painted drum with a brass spindle. Twelve fortunes run round it. The pointer always seems to end up back on NOTHING.'); }); return true; };
    pr.talkBox = (pl, f) => f.tx >= tx && f.tx <= tx + 1 && f.ty >= ty && f.ty <= ty + 1;
    return pr;
};
/* the pointer: a brass arrowhead on the rim, pushed round; it has its place on NOTHING */
class RookToken extends GridThing {
    constructor(tx, ty, p = {}) { super('rooktoken', tx, ty, Object.assign({ weight: WEIGHT.light, thread: THREAD.jory, stitchName: "Madame Rook's pointer" }, p)); }
    interact() {
        const i = RookWheel.fortune(this.tx, this.ty);
        Script.run(function* () { yield* say(null, i >= 0 ? `The wheel's brass pointer. It points at: ${ROOK_FORTUNES[i]}.` : 'The brass pointer off Madame Rook\'s wheel, out on the grass.'); });
        return true;
    }
    sprite() { return spr('rook_pointer'); }
}
SPAWN.rooktoken = (x, y, p) => new RookToken(x, y, p);
CONTENT_INIT.push(() => {
    defSprite('rook_pointer', ['................', '................', '................', '.......kk.......', '......kyyk......', '.....kyyyyk.....', '....kyywyyyk....', '...kyyyyyyyyk...',
        '...kkkkYYkkkk...', '......kYYk......', '......kYYk......', '......kYYk......', '.....kkkkkk.....', '....kYYYYYYk....', '.....kkkkkk.....', '................'], { y: '#f7d64a', Y: '#b88a2a', w: '#fff4c0' });
    /* what Madame Rook makes of it (before anything else she'd say, and after the Unwinding too) */
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (npc.who !== 'rook' || (Progress.flag('great_pull') && !Progress.flag('unwound'))) return talk0.call(this, npc);
        const a = G.map, i = RookWheel.stopped(a);
        if (i === 7 && !Progress.flag('rook_truth')) return function* () {
            Progress.set('rook_truth'); Stats.count('secret:rook');
            yield* say('rook', "{surprised}It's stopped. On THE TRUTH. In forty years it has never once... Well. You'd better sit down, dear. So had I.");
            if (Progress.flag('unwound')) yield* say('rook', "{happy}The truth is that everything I can see has happened already. A fortune-teller with nothing left to tell! Isn't it wonderful?");
            else if (Progress.flag('met_linnet')) yield* say('rook', "You've met the woman with the green thread already. I see that too. Then here's another truth: she'll come home. And nobody will have to pull her.");
            else yield* say('rook', "Past the fog there's a woman who plaits green thread. She keeps a garden where nothing comes back, and she's waited twenty-five years for somebody with your chin.");
            yield* say('rook', "{happy}That one's free. They're all free, really. Here: your button back, and nineteen more. I haven't been surprised since I was a girl.");
            Favours.buttons(20);
        };
        const e = a && a.find('rookToken');
        if (e && e.ret && e.ret.state !== 'home' && !e.mv && !e.carried && RookWheel.fortune(e.tx, e.ty) >= 0) {
            const f = ROOK_FORTUNES[RookWheel.fortune(e.tx, e.ty)];
            return function* () { yield* say('rook', `{surprised}${f}! ...No. Look at it, creeping off home. NOTHING, after all. It always is.`); };
        }
        return talk0.call(this, npc);
    };
    /* the quilt counts it (src/78c_polish.js) */
    QUILT[0][1].push(() => Progress.flag('rook_truth'));
});
