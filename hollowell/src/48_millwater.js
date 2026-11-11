/* Millwater, the Reaches (overworld block 2,2): a big lake, its outlet river running south over the falls,
   Dad's mill on the lake shore, and the Millrace (D3) on the far bank above the falls. The far bank is only
   reached by water: the ferry, which runs itself (its mark is on the crossing current: down and back, all
   day). Behind the falls, where the east side of the river turns into the cliff, a hidden pool (S19). */

/* where Wren comes into the Millrace (its entrance hall's door) */
const MILLRACE_ENTRY = { x: 29, y: 42 };

const MILLWATER_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYYYYY:YYYYYYYYYYYYYYYYY###',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYVVYYYYYYYYYYYY:YYYYYYYYYYYYYYYYY###',
    'YYY...,..............RR--RR--VV----R##.......###################',
    'YYY,T..........R------~~~~~~~~~~|~~~~~~~~~~-~~~~~~~~~~~~~~~~~###',
    'YYY.........R-R-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY.....RRR--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY...,--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY..R-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYY..-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
    'YYYbR-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~QQ~QQ~###',
    'YYY.-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Q...Q~###',
    'YYY.--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Q...Q~###',
    'YYY..-R~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~QQQQQ~Q...Q~###',
    'YYY...--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Q..rQ~QQQQQ~###',
    'YYY....R-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Q...Q~~~~~~~###',
    'YYY.....R-R-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~QQ~QQ~~~~~~~###',
    'YYY........R--R-~~|~~~~~~~~~~~~~~~~~~~~VVV~~~~~~~~~~~~~~~~~~~###',
    'YYY.WWWWWWWWW..R-"|--~~~~~~~~~~~~~~~~~~VVV--~~~~~~~~~~~~~~~~~###',
    'YYY.W~~~~~~~W.....|.R-----------VR---R-VVV...................###',
    'YYY.W~~~~~~~W.;;;;;;;;;...XXXXXXVWWWWW.VVV...................###',
    'YYY.W~~~~~Q~W.;;;;;;;;;...XXXXXX~~~~~W.VVV...................###',
    'YYY.W~Q~~~~~W.............XXXXXX~~~~.W.VVV...................###',
    'YYY.W~~~~~~~W..................W~~...W.VVV..XXXXXXXX.........###',
    'YYY.WWWWWWWWW..r.,.............WWWWW.W.VVV..XXXXXXXX.........###',
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
    id: 'millwater', bx: 2, by: 2, name: 'Millwater', sub: 'the Reaches', theme: 'water', music: 'water', owArt: true, soft: 3, lowRocks: true,
    rows: MILLWATER_ROWS,
    forest: ['tree', 'tree2', 'tree_birch'],
    legend: {},
    drawGround: (a, cx, cy) => MillLook.ground(a, cx, cy),
    ents: [
        /* Dad's mill on the shore, its wheel turning in the race that runs past it into the old mill pond */
        { k: 'building', x: 26, y: 19, w: 6, h: 3, style: 'cottage', door: null, windows: [0, 1, 4, 5], wallH: 20, chimneyX: 8, variant: 'dadmill' },
        { k: 'millwheel', x: 31, y: 18 },
        { k: 'npc', who: 'ambrose', x: 29, y: 22, face: 'down' },
        { k: 'npc', who: 'fen', x: 14, y: 21, face: 'down', route: [[14, 21, 200], [19, 21, 160]] },
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
        /* Heron Rock: an islet off the south shore of the east reach, low rocks all round it but on the south; an old
           barrel lives on it (its place is out there; reeled ashore it leaves an empty mark, and a mark is something to
           hook onto, if the barrel's out of the line) */
        { k: 'deco', x: 50, y: 13, look: 'heron_stone', solid: [[0, 0]], oy: -10, text: 'A heron carved in stone, up on one leg on its rock, looking down into the lake. Gulls have left their opinions on it.' },
        { k: 'chest', x: 51, y: 13, item: 'heartpatch', id: 'mwHeron' },
        { k: 'barrel', x: 51, y: 14, id: 'heronBarrel' },
        /* the eel-catcher's post on the shore (a way back off the rock, for anyone with a line) */
        { k: 'eyelet', x: 50, y: 19 },
        /* reed snappers in the shallows */
        { k: 'enemy', x: 7, y: 13, type: 'snapper' }, { k: 'enemy', x: 22, y: 18, type: 'snapper' }, { k: 'enemy', x: 42, y: 17, type: 'snapper' },
        /* Wick's duck pond: Jory's three wooden ducks on one crossbar, a duck house for each on the far side, two rocks */
        { k: 'duckhouse', x: 5, y: 17, sig: 'mwDuckA' }, { k: 'duckhouse', x: 8, y: 17, sig: 'mwDuckB' }, { k: 'duckhouse', x: 11, y: 17, sig: 'mwDuckC' },
        { k: 'millduck', x: 6, y: 22, id: 'mwDuck1', group: 'mwducks', ribbon: '#e8463c' },
        { k: 'millduck', x: 8, y: 22, id: 'mwDuck2', group: 'mwducks', ribbon: '#4f9be0' },
        { k: 'millduck', x: 10, y: 22, id: 'mwDuck3', group: 'mwducks', ribbon: '#5ab85a' },
        { k: 'rack', x: 8, y: 23, id: 'mwDuckRack', group: 'mwducks' },
        { k: 'sign', x: 6, y: 24, text: "WICK'S DUCKS. Carved by Jory, named by Wick: Dot, Dash and Dimple. They swim home to their houses, if somebody knows how to ask them." },
        /* the old mill pond, walled in by the mill: the lake runs in down the race, under a grating; inside, a little boat */
        { k: 'barrel', x: 34, y: 17, id: 'millBarrel', patience: 600, stitchName: "the mill's barrel" },
        { k: 'millgrate', x: 32, y: 19 },
        { k: 'tessboat', x: 34, y: 22 },
        { k: 'pondgate', x: 36, y: 23, id: 'mwPondGate' },
        /* the Gulls' Rock: a rock in a ring of low rocks, nothing on it to catch a hook, a cleft in the ring too narrow for
           anybody; the eel-catcher's float bobbing off it, and his post on the far bank */
        { k: 'cleft', x: 57, y: 9 },
        { k: 'gullfloat', x: 57, y: 7, id: 'gullFloat' },
        { k: 'gullnest', x: 56, y: 11 },
        { k: 'gull', x: 55, y: 10 }, { k: 'gull', x: 59, y: 12, flip: true }, { k: 'gull', x: 58, y: 9 },
        { k: 'eyelet', x: 57, y: 19 },
    ],
    regions: [
        { name: 'The Reaches', x: 0, y: 2, w: 42, h: 34 },
        { name: 'North Shore', x: 38, y: 0, w: 7, h: 3 },
        { name: 'Heron Rock', x: 48, y: 11, w: 7, h: 6 },
        { name: 'Millrace Falls', x: 42, y: 18, w: 19, h: 12 },
        { name: "The Gulls' Rock", x: 55, y: 8, w: 6, h: 7 },
        { name: 'The Old Mill Pond', x: 31, y: 19, w: 7, h: 5 },
        { name: "Wick's Duck Pond", x: 4, y: 17, w: 9, h: 7 },
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

/* ---------- Millwater's look: rushes and reeds along the banks, lily pads on the still water, a soft shore ---------- */
const MILL_LILIES = [];
{
    /* lily pads on the still water near the banks (never on a raft's way, nor the current) */
    const R = MILLWATER_ROWS, away = new Set(['18', '16', '39', '40']);
    for (let y = 3; y <= 17; y++) for (let x = 4; x <= 60; x++) {
        if (R[y][x] !== '~') continue;
        let shore = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = (R[y + dy] || '')[x + dx]; if (c === '-' || c === 'R') shore = true; }
        if (!shore || away.has(String(x)) || y === 6 || (x >= 11 && x <= 16 && y >= 7 && y <= 12) || (x >= 48 && x <= 54 && y >= 11 && y <= 16)) continue;
        if (hash2(x, y, 57) < 0.34) MILL_LILIES.push([x, y, hash2(y, x, 58)]);
    }
}
const MillLook = {
    ground(a, cx, cy) {
        const B = OW.blocks['2,2'], ox = B.bx * OW.bw, oy = B.by * OW.bh;
        for (const [lx, ly, h] of MILL_LILIES) {
            const sx = (ox + lx) * T - cx, sy = (oy + ly) * T - cy;
            if (sx < -T || sy < -T || sx > W + T || sy > H + T) continue;
            const bob = Math.round(Math.sin(G.t / 50 + h * 6.3) * 0.6);
            /* two or three pads a tile, lying flat: round leaves split to the middle, now and then a flower on one */
            for (let n = 0; n < 2 + (h > 0.6 ? 1 : 0); n++) {
                const x0 = sx + 4 + Math.floor(hash2(lx + n, ly, 59) * 8), y0 = sy + 3 + Math.floor(hash2(ly, lx + n, 60) * 10) + bob;
                const r = n === 0 ? 4 : 3, hh = r === 4 ? 2 : 1, cut = Math.floor(hash2(lx, ly + n, 61) * 4);
                Gfx.alpha(0.25); Gfx.rect(x0 - r + 1, y0 + hh + 1, 2 * r - 1, 1, '#123a5a'); Gfx.alpha(1);
                for (let j = -hh; j <= hh; j++) {
                    const w = Math.round(r * Math.sqrt(1 - (j / (hh + 0.6)) ** 2));
                    Gfx.rect(x0 - w, y0 + j, 2 * w + 1, 1, j === hh ? '#2f6e34' : j < 0 ? '#6cbc50' : '#4a9a3e');
                }
                /* the split, from the middle out to the rim */
                const sx2 = [1, -1, 1, -1][cut], sy2 = cut < 2 ? -1 : 1;
                for (let k = 1; k <= r - 1; k++) Gfx.rect(x0 + sx2 * k, y0 + (k > 1 ? sy2 : 0), 1, 1, '#2f6e34');
                Gfx.rect(x0 - r + 1, y0 - hh, 2, 1, '#9ad870');
                if (n === 0 && h > 0.72) { Gfx.rect(x0 - 1, y0 - 2, 3, 2, '#fbf6ea'); Gfx.rect(x0, y0 - 3, 1, 1, '#f59ac0'); Gfx.rect(x0, y0 - 2, 1, 1, '#f7d64a'); }
            }
        }
    },
};
OWA.ground.water = {
    /* lakeside grass: soft and green, clover, forget-me-nots near the water */
    grass: {
        field: (tx, ty) => OWA.field(tx, ty, 31, 7, 5, -0.25),
        draw(x, th, v, fl) {
            const [g0, g1, g2, g3] = th.grass;
            fill(x, g0); speckle(x, [g1], 13 + v * 11, 0.12); speckle(x, [g2], 29 + v * 5, 0.05);
            for (let n = 0; n < 3; n++) { const bx = Math.floor(hash2(v, n, 33) * 14) + 1, by = Math.floor(hash2(n, v, 35) * 13) + 2; px(x, bx, by, g3); px(x, bx, by - 1, g1); px(x, bx + 1, by - 1, g3); }
            if (v % 3 === 1) { const cx2 = 3 + v * 2, cy2 = 11 - v; px(x, cx2, cy2, '#4e9a56'); px(x, cx2 + 1, cy2, '#4e9a56'); px(x, cx2, cy2 + 1, '#4e9a56'); px(x, cx2 + 1, cy2 - 1, '#6fbd68'); }
            for (let n = 0; n < [0, 0, 1, 3][fl]; n++) {
                const fx = 2 + Math.floor(hash2(n, v + fl, 37) * 12), fy = 2 + Math.floor(hash2(v + fl, n, 38) * 11), c = n % 2 ? '#fbf6ea' : '#7aa8f0';
                px(x, fx, fy, c); px(x, fx + 1, fy, c); px(x, fx, fy + 1, c); px(x, fx + 1, fy + 1, '#f7d64a'); px(x, fx, fy + 2, g3);
            }
        },
    },
    flowers(x, th, v) { OWA.ground.water.grass.draw(x, th, v, 3); },
    tallgrass(x, th, v) { OWA.ground.meadow.tallgrass(x, th, v); },
    /* (the road's the same road as Meadowfold's, over the bridge) */
    path(x, th, v) { OWA.ground.meadow.path(x, THEMES.meadow, v); },
    forest(x, th, v) { fill(x, '#355e3e'); speckle(x, ['#40704a', '#2c5034'], v + 9, 0.3); speckle(x, ['#5a9058'], v + 21, 0.05); },
    /* rushes standing in the shallows, a bulrush or two */
    reeds(x, th, v) { OWA.ground.meadow.reeds(x, th, v); },
};
/* the rock along the north shore is the same grey rock as the Heights' */
OWA.cliffs.water = {
    face: (x, th, v, m) => OWA.cliffs.heights.face(x, THEMES.heights, v, m),
    top: (x, th, v, m) => OWA.cliffs.heights.top(x, THEMES.heights, v, m),
};
function initMillwaterLook() {
    /* the stone heron on its rock */
    ART.heron_stone = paintSprite(16, 26, x => {
        const o = '#2a1f2d', s0 = '#b8bcb4', s1 = '#949a92', s2 = '#dfe2d8', s3 = '#70766e';
        const R2 = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        /* the rock it stands on */
        R2(o, 2, 20, 12, 6); R2(s3, 3, 21, 10, 4); R2(s1, 4, 21, 7, 2); R2('#5a8a40', 3, 21, 2, 1); R2('#5a8a40', 11, 22, 2, 1);
        /* the leg, the body, the neck in an S, the beak */
        R2(o, 7, 12, 3, 9); R2(s1, 8, 13, 1, 8);
        R2(o, 3, 6, 10, 8); R2(s0, 4, 7, 8, 6); R2(s2, 5, 7, 5, 2); R2(s3, 4, 11, 7, 2); R2(s3, 11, 9, 1, 3);
        R2(o, 9, 1, 4, 7); R2(s0, 10, 2, 2, 5); R2(s2, 10, 2, 1, 2);
        R2(o, 12, 1, 4, 3); R2('#c8b070', 13, 2, 3, 1);
        R2(o, 9, 0, 3, 2); R2('#3a3a3a', 10, 1, 1, 1);
    });
}
CONTENT_INIT.push(initMillwaterLook);
/* the quilt counts Heron Rock too (src/78c_polish.js) */
CONTENT_INIT.push(() => QUILT[0][1].push(() => Progress.areaFlag('hollow', 'chest:mwHeron')));
