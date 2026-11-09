/* Larkspur Fair (overworld block 0,1): an old fairground in a glade at the valley's western edge, the fog close
   by. Nobody comes; nobody can: the only ways in are a jump off Kilnridge's high mesa into the straw (only with a
   Bedroll laid up top to come home to) and, once you're in, the east gate to town, bolted on this side. The
   carousel (Linnet's note 7 under its wooden horse), the fortune teller's tent, a painted hedge, a pen with a
   bed of nails, toy soldiers on parade, and the Marionette Hall (House 6, Jory's). After the Hall, the Crossbar
   works the puppet on the mesa that winds the lift. The fog on the west: lay a Bedroll by it, walk in, and come
   back holding something (S11). Map drafted by tools/mapgen/larkspur.py. */

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
    '%%%.................,".........:.........::::::::::::.......YYYY',
    '%%%................."..........:.........:..................YYYY',
    '%%%.....:....,.................:.........:................."YYYY',
    '%%%...".:..,w..................:.........:..........w.".....YYYY',
    '%%%.,...:.............===================:......"..,.......wYYYY',
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
    id: 'larkspur', bx: 0, by: 1, name: 'Larkspur Fair', theme: 'fair', music: 'fair',
    rows: LARKSPUR_ROWS,
    forest: ['tree', 'tree2'],
    legend: { 'O': { k: 'crawl', p: 'fence', ent: 'crawlhole' }, '!': { k: 'spikes', p: 'spikes' } },
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
        { k: 'npc', who: 'pell', x: 33, y: 11, face: 'down' },
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

LINNET_NOTES[7] = { title: "A note under the carousel's horse", text: "The horse on the carousel walked off its pole for me. Someone was working it, from somewhere. They make the Houses, you know. They make all of it, for us, out of love, and they're very good at it, and they cry when we get things right. I followed the strings down. - L." };
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
            /* the town's side of the West Gate (a fence in the road) opens with it */
            const a = G.map;
            for (const e of a.ents.filter(o => o.skey === 'westGateA' || o.skey === 'westGateB')) { for (const [dx, dy] of e.solid || []) a.staticSolid.delete((e.ty + dy) * 4096 + (e.tx + dx)); a.remove(e); Fx.poof(e.tx * T + 8, e.ty * T + 8); }
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
        if (!Progress.flag('leapt')) { Progress.set('leapt'); yield* say(null, 'You land in the straw with a whump, and lie there a moment, looking up at the mesa. It is a very long way up.'); }
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
        R('#2a1f2d', 70, 42, 84, 14); R('#f7d64a', 72, 44, 80, 10);
        for (let i = 0; i < 20; i++) R(i % 2 ? '#fff4c0' : '#e8b04a', 72 + i * 4, 40, 2, 2);
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
