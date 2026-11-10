/* Millwater, the Reaches (overworld block 2,2): a big lake, its outlet river running south over the falls,
   Dad's mill on the lake shore, and the Millrace (D3) on the far bank above the falls. The far bank is only
   reached by water: the ferry, which runs itself (its mark is on the crossing current: down and back, all
   day). Behind the falls, where the east side of the river turns into the cliff, a hidden pool (S19). */

/* where Wren comes into the Millrace (its entrance hall's door) */
const MILLRACE_ENTRY = { x: 29, y: 42 };

const MILLWATER_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYYYYY:YYYYYYYYYYYYYYYYY###',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYYYYY:YYYYYYYYYYYYYYYYY###',
    'YYY...,...............---"-""VV-.-"-##.......###################',
    'YYY,T...........-"-"-"~~~~~~~~~~|~~~~~~~~~~-~~~~~~~~~~~~~~~~~###',
    'YYY..........-"-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY......""--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY...,--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY..."~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.."~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYYb."~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.."~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY..."~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY....-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.....-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY......-""~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.........---"~~|~~~~~~~~~~~~~~~~~~~~VVV~~~~~~~~~~~~~~~~~~~###',
    'YYY.............""|-"~~~~~~~~~~~~~~~~~~VVV--~~~~~~~~~~~~~~~~~###',
    'YYY...............|..--."--.--.-.-.---"VVV...................###',
    'YYY........r..;;;;;;;;;...XXXXXX...T...VVV...................###',
    'YYY......T....;;;;;;;;;...XXXXXX.......VVV...................###',
    'YYY....r..................XXXXXX....b..VVV...................###',
    'YYY....................................VVV..XXXXXXXX.........###',
    'YYY.....,......r.,.....................VVV..XXXXXXXX.........###',
    'YYY....................................VVV..XXXXXXXX.........###',
    'YYY....................................VVV..XXX:XXXX.........###',
    '::::::::::::::::::::::::::::::::::::::_>>>~::::::::..........###',
    '::::::::::::::::::::::::::::::::::::::_VVV.::::::::..........###',
    'YYY....................................VVV.....:.............###',
    'YYY....................................VVV####...............###',
    'YYY...........................,..######VV>>~.###################',
    'YYY......................b.......######VVV#~####################',
    'YYY.....,.........".......,,.....######VVV######################',
    'YYYr.......b.....................######VVV....##################',
    'YYY...r...T..T.....r........T....######VVV....##################',
    'YYY..............................######VVV....##################',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY###',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY###',
    'YYY%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###',
    'YYY%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###',
];

defBlock({
    id: 'millwater', bx: 2, by: 2, name: 'Millwater', sub: 'the Reaches', theme: 'water', music: 'water', owArt: true, soft: 3,
    rows: MILLWATER_ROWS,
    forest: ['tree', 'tree2', 'tree_birch'],
    legend: {},
    ents: [
        /* Dad's mill on the shore, its wheel in the lake */
        { k: 'building', x: 26, y: 19, w: 6, h: 3, style: 'cottage', door: null, windows: [0, 1, 4, 5], wallH: 20, chimneyX: 8, variant: 'dadmill' },
        { k: 'deco', x: 32, y: 18, look: 'millwheel', solid: [[0, 0]], ox: -4, oy: -8, baseY: 20 },
        { k: 'npc', who: 'ambrose', x: 29, y: 22, face: 'down' },
        { k: 'npc', who: 'fen', x: 12, y: 21, face: 'down', route: [[12, 21, 200], [19, 21, 160]] },
        { k: 'npc', who: 'wick', x: 17, y: 17, face: 'right' },
        { k: 'sign', x: 6, y: 25, text: 'MILLWATER. The Reaches. (East: the falls, and the Millrace above them. Ferry at the end of the road.)' },
        { k: 'rest', x: 9, y: 24 },
        /* the ferry: its mark is on the crossing current, so it runs across and back by itself */
        { k: 'raft', x: 39, y: 26, id: 'mwFerry', patience: 150 },
        { k: 'sign', x: 37, y: 25, text: "FERRY. It runs itself: over, back, over, back. Hop on when it's in. (Off at the far side quick, mind.)" },
        /* two rafts on the lake, one at Wick's pier, one at the north shore below the cliff stair: each goes
           back to its own landing, so there's always one waiting on either side (the Paddle takes you over) */
        { k: 'raft', x: 18, y: 15, id: 'mwLakeRaft' },
        { k: 'raft', x: 40, y: 3, id: 'mwNorthRaft' },
        { k: 'sign', x: 17, y: 18, text: "WICK'S PIER. (The raft's for anyone who can paddle. Over the lake: the cliff stair, and the Heights.)" },
        { k: 'sign', x: 44, y: 2, text: 'THE CLIFF STAIR. Up to Belfry Heights.' },
        /* the far bank: the Millrace */
        { k: 'building', x: 44, y: 21, w: 8, h: 5, door: 3, art: 'millrace' },
        { k: 'warp', x: 47, y: 25, to: 'millrace', tx2: MILLRACE_ENTRY.x, ty2: MILLRACE_ENTRY.y, face: 'up', dir: 'up' },
        { k: 'rest', x: 53, y: 27 },
        { k: 'sign', x: 50, y: 27, text: 'THE MILLRACE. Wanderers welcome. Hold on to your hat.' },
        /* behind the falls (S19), and the beach below them */
        { k: 'falls', x: 39, y: 30, w: 6, h: 2 },
        { k: 'chest', x: 44, y: 30, item: 'heartpatch', id: 'mwCave' },
        { k: 'chest', x: 44, y: 34, item: 'b50', id: 'mwBasin' },
        { k: 'deco', x: 43, y: 35, look: 'note_bottle', solid: [[0, 0]], text: 'A bottle with a note in it: "If you are reading this, you rode over the falls. So did I. Then I fell in on purpose and went home the quick way. - L."' },
        /* reed snappers in the shallows */
        { k: 'enemy', x: 7, y: 13, type: 'snapper' }, { k: 'enemy', x: 22, y: 18, type: 'snapper' }, { k: 'enemy', x: 42, y: 17, type: 'snapper' },
    ],
    regions: [
        { name: 'The Reaches', x: 0, y: 2, w: 42, h: 34 },
        { name: 'North Shore', x: 38, y: 0, w: 7, h: 3 },
        { name: 'Millrace Falls', x: 42, y: 18, w: 19, h: 12 },
    ],
});

PEOPLE_DEF.fen = { name: 'Fen', col: '#9ad870', look: { body: 'adult', hair: 'bun', hairC: '#5a3a26', top: '#6a9a52', accent: '#e6c08a', bottom: '#4a5a3a', skin: 'tan' } };
PEOPLE_DEF.wick = { name: 'Wick', col: '#f0c060', look: { body: 'child', hair: 'short', hairC: '#e8b04a', top: '#e8463c', accent: '#fbf6ea', bottom: '#3f6ad8', skin: 'light' } };

TALK.ambrose = function* () {
    if (Progress.flag('d3')) { yield* say('ambrose', cycle('amb3', ["Three Knots! Your gran'll be... well. She'll be Gran about it. I'm proud as anything.", "The mill's been grinding sweeter since you came out of the Millrace. Don't ask me why. I'm sure I don't know why.", "Mind the falls on your way, love. Everything comes back. Still: mind them."])); return; }
    if (!Progress.flag('met:ambrose')) {
        Progress.set('met:ambrose');
        yield* say('ambrose', "{name}! Look at you! Two Knots already! Come here. Mind the flour.");
        yield* say('ambrose', "The Millrace is over the river, above the falls. The ferry'll take you; it goes over and comes back on its own, like everything else round here.");
        yield* say('ambrose', "I'd come and see you off at the door, but... the mill. Always the mill. Busy, busy.");
        return;
    }
    yield* say('ambrose', cycle('amb1', ["Things in the water drift off, and come back the long way, slower against the current. Every miller knows that. Mind you use it.", "I'm not allowed to help, you know. Wander rules. But if I WERE allowed, I'd say: ride it there, ride it back.", "Your mum rang the noon bell five minutes early today. She's excited. She'd never say."]));
};
TALK.fen = function* () {
    yield* firstThen('fen', "Reeds, mostly. I cut them, they grow back where they were. Steady work.",
        ["Watch the shallows: snappers. They pop up out of the reeds and nip. A good whack sends them under.", "The ferry's never been late in my lifetime. Never been early either. Same as the sun.", "The falls are loud today. Or I'm quiet. One of the two."]);
};
TALK.wick = function* () {
    yield* firstThen('wick', "Shh! I'm fishing. ...I've never caught one. They all swim home.",
        ["If you drop something in the river it goes off down the falls and comes back up later all by itself. I tried it with my shoe.", "Dad says behind the falls there's nothing. I think there's a cave. Caves are always behind falls.", "You can't swim in the deep bits. You go under and then you're back where you started, coughing."]);
};
BUDGE.fen = 'Fen: "Careful, I\'ve a sickle."';
BUDGE.wick = 'Wick: "Hey! You scared the fish!"';

/* the falls: a curtain of water over the gorge (and over the pool behind it) */
class Falls extends Ent {
    constructor(tx, ty, p) { super('falls', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.w = p.w || 3; this.h = p.h || 2; }
    get sortY() { return (this.ty + this.h) * T + 8; }
    draw(cx, cy) {
        const x0 = this.tx * T - cx, y0 = this.ty * T - cy, w = this.w * T, h = this.h * T;
        Gfx.rect(x0, y0, w, h, '#7cc8ee');
        for (let i = 0; i < w; i += 2) {
            const ph = (G.t * 2 + hash2(i, 0, 7) * 40) % h;
            Gfx.rect(x0 + i, y0 + ph, 1, 5, '#e8f8ff');
            Gfx.rect(x0 + i + 1, y0 + (ph + h / 2) % h, 1, 3, '#a5dcf7');
        }
        Gfx.alpha(0.6); Gfx.rect(x0, y0 + h - 3, w, 3, '#ffffff'); Gfx.alpha(1);
        for (let i = 0; i < 6; i++) Gfx.circle(x0 + ((G.t * 0.7 + i * 17) % w), y0 + h - 1, 2, '#ffffff');
    }
}
SPAWN.falls = (x, y, p) => new Falls(x, y, p);

function initMillwaterArt() {
    ART.millwheel = paintSprite(24, 24, x => {
        x.fillStyle = '#6b4128'; x.beginPath(); x.arc(12, 12, 11, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#9a6438'; x.beginPath(); x.arc(12, 12, 9, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#3a2418'; x.fillRect(10, 10, 4, 4);
        x.fillStyle = '#e6c08a'; for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; x.fillRect(Math.round(12 + Math.cos(t) * 9) - 1, Math.round(12 + Math.sin(t) * 9) - 1, 3, 3); x.fillRect(Math.round(12 + Math.cos(t) * 5), Math.round(12 + Math.sin(t) * 5), 1, 1); }
    });
    ART.note_bottle = paintSprite(10, 14, x => { x.fillStyle = '#6ab08a'; x.fillRect(2, 4, 6, 9); x.fillRect(4, 1, 2, 3); x.fillStyle = '#a8e0c0'; x.fillRect(3, 5, 1, 6); x.fillStyle = '#fbf3df'; x.fillRect(4, 6, 3, 5); x.fillStyle = '#9a6438'; x.fillRect(4, 0, 2, 2); });
}
CONTENT_INIT.push(initMillwaterArt);
