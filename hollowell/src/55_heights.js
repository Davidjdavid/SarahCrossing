/* Belfry Heights (overworld block 2,0): windswept cliffs in three terraces above the lake, and the Belfry
   (D4, Mum's bell tower) on top. The way up from Millwater is the cliff stair, a ravine up the east side of
   block 2,1 (walled off from Hushwood, src/59_hushwood.js), reached by paddling over
   the lake to its north-east shore. On the Heights: a boulder asleep on the first stair (ring the shrine
   bell beside it and it goes home), a ledge the gusts blow across, a chasm the Hookline crosses. */

const BELFRY_ENTRY = { x: 29, y: 53 };

const HEIGHTS_ROWS = [
    '################################################################',
    '###.,...........".......r.............................z......###',
    '###..r...............,....XXXXXXXXXX..................z......###',
    '###.......................XXXXXXXXXX..................z......###',
    '###.............r.,.......XXXXXXXXXX..................zzzzzzz###',
    '###."......,..............XXXXXXXXXX........"....,...........###',
    '###....,..."..........r.".XXXXXXXXXX.....r...r...............###',
    '###...,...........,.......XXXX:XXXXX...r.....................###',
    '###.....".....................::...................,.........###',
    '##############################H#################################',
    '##############################H#################################',
    '###zzzzzzz^zzzzzzzzzzz^zz...............zzzzz.......:........###',
    '###z^^zzzzzz..zzzz..zzzzz.....::::::::::zzzzz::::::::........###',
    '###zzzzzzzzzzzzzzzzzzzzzz...............zzzzz.......:........###',
    '###zzzzzzzz...zzzzz..^zzz...............zzzzz.......:........###',
    '###zzz...zz...zzzzz.zzzzz...............zzzzz.......:........###',
    '###z^z...zzzzzzzzzzzzzz^z...............zzzzz.......:........###',
    '###zzzzzz^zzzzzz^zzzzzzzz...............zzzzz..."...:........###',
    '####################################################H###########',
    '####################################################H###########',
    '###.........:................................................###',
    '###.........:::::::::::::::::::::::::::::::::::::::::........###',
    '###.........:................................................###',
    '###.........:................................................###',
    '###"........:................................................###',
    '###r........:................,................r...........,..###',
    '###.........:....."........r.................................###',
    '###.........:.......vvvvvvvv#####vvvvvvvvvvvvvvvv.........,..###',
    '############H################...################################',
    '############H#################.#################################',
    '###.".r.....::::::::::::::::::::::::::::::::.................###',
    '###.....,..................................:.................###',
    '###........".........,.......".,...........:."...............###',
    '###............................,...........:.................###',
    '###........................................:.................###',
    '###............................"...........:............,....###',
    '###...........,..............,.r...........:......,..........###',
    '###........................................:............,....###',
    '###........r...................,...........:...r.........."..###',
    '##########################################:::###################',
];

defBlock({
    id: 'heights', bx: 2, by: 0, name: 'Belfry Heights', theme: 'heights', music: 'heights', owArt: true, soft: 3,
    /* the terraces, from the lake up: each a level higher */
    levels: [[20, 34, 0], [20, 23, 1], [20, 14, 2], [20, 4, 3]],
    rows: HEIGHTS_ROWS,
    forest: ['pine', 'tree_birch'],
    legend: {
        /* (the Heights' own: a chasm with a lip, and heather) */
        'z': { k: 'pit', p: 'chasm' },
        'e': { k: 'grass', p: 'heather' },
    },
    ents: [
        /* terrace 1: the shrine bell, and the boulder asleep on the stair; along the path, a little cave stopped up
           by another sleeping boulder, out of the shrine's reach (after the Belfry: the Recall Bell) */
        { k: 'bell', x: 14, y: 31, id: 'hShrine' },
        { k: 'deco', x: 14, y: 32, look: 'shrine_post', solid: [[0, 0]], oy: -4, text: 'A little shrine with a bell on a bracket. Carved underneath: RING, AND ALL COMES HOME.' },
        { k: 'block', x: 11, y: 30, id: 'hBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [12, 29], trace: [[11, 30], [12, 30], [12, 29]], noPush: true, pushLine: "A boulder, fast asleep on the stair. It doesn't budge. It snores, faintly." },
        { k: 'sign', x: 44, y: 31, text: 'BELFRY HEIGHTS. Mind the wind. Mind the drop. Mind your mother.' },
        /* the ringers' old bell by the little cave, dumb: its clapper went down the hill years ago (it's in Meadowfold's Old Fold) */
        { k: 'oldbell', x: 33, y: 32, id: 'oldBell' },
        { k: 'rest', x: 46, y: 33 },
        { k: 'npc', who: 'brindle', x: 30, y: 34, face: 'down', route: [[30, 34, 240], [22, 36, 200]] },
        { k: 'critter', who: 'goat', look: 'sheep', x: 26, y: 35, speed: 0.4, route: [[26, 35, 200], [33, 37, 160]] },
        /* terrace 2: the windy ledge (gusts blow south, toward the drop) */
        { k: 'gust', x: 13, y: 20, w: 39, h: 7, dir: 'down', period: 300, len: 110, force: 1.0, id: 'hGust' },
        { k: 'vane', x: 11, y: 20 }, { k: 'vane', x: 53, y: 20 },
        { k: 'sign', x: 11, y: 22, text: 'THE BLUSTER. Walk in the lulls; lean into it when it blows. (The vanes spin up first.)' },
        { k: 'block', x: 31, y: 28, id: 'hCaveRock', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [30, 29], trace: [[31, 28], [30, 28], [30, 29]], noPush: true, pushLine: 'A boulder, asleep in the mouth of a little cave. No bell nearby will reach it.' },
        { k: 'chest', x: 29, y: 28, item: 'heartpatch', id: 'hCave' },
        /* terrace 3: the chasm, eyelets either side */
        { k: 'eyelet', x: 38, y: 12 }, { k: 'eyelet', x: 46, y: 12 },
        { k: 'rest', x: 33, y: 13 },
        /* the top: the Belfry */
        { k: 'building', x: 26, y: 2, w: 10, h: 6, door: 4, art: 'belfry' },
        { k: 'warp', x: 30, y: 7, to: 'belfry', tx2: BELFRY_ENTRY.x, ty2: BELFRY_ENTRY.y, face: 'up', dir: 'up' },
        { k: 'npc', who: 'tess', x: 33, y: 8, face: 'down' },
        { k: 'sign', x: 28, y: 8, text: 'THE BELFRY. Ring once for the Wanderer. (Twice if lost.)' },
        { k: 'enemy', x: 34, y: 15, type: 'nibbler' }, { k: 'enemy', x: 50, y: 34, type: 'nibbler' },
        /* the Crags: pinnacles in a chasm, crossed on the Hookline (an eyelet; then only where things belong and aren't) */
        { k: 'gust', x: 3, y: 11, w: 22, h: 4, dir: 'right', period: 330, len: 130, force: 0.05, id: 'cragGust' },
        { k: 'vane', x: 26, y: 11, gust: 'cragGust' },
        { k: 'rest', x: 27, y: 16 },
        { k: 'sign', x: 28, y: 12, text: 'THE CRAGS. The wind up here takes anything that isn\'t held down. The old bell-ringers crossed them for luck, and came back down the quick way.' },
        { k: 'eyelet', x: 18, y: 12 },
        { k: 'crate', x: 19, y: 14, id: 'cragCrate' },
        { k: 'block', x: 13, y: 15, id: 'cragBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, resetSleep: true, startAt: [13, 12], trace: [[13, 15], [13, 14], [13, 13], [13, 12]], noPush: true, pushLine: 'A boulder, asleep on its little pinnacle. Its thread runs off over the drop to where it belongs.' },
        { k: 'pot', x: 8, y: 15, id: 'cragPot' },
        { k: 'chest', x: 6, y: 16, item: 'heartpatch', id: 'cragPatch' },
        { k: 'ringstone', x: 6, y: 15 },
        /* the Eyrie: a nook in the north-east cut off by a crevice the draught blows a crate into (and it pops home) */
        { k: 'gust', x: 47, y: 1, w: 7, h: 3, dir: 'right', period: 300, len: 90, force: 0.35, id: 'eyrieGust' },
        { k: 'crate', x: 51, y: 2, id: 'eyrieCrate' },
        { k: 'chest', x: 59, y: 2, item: 'heartpatch', id: 'eyriePatch' },
        { k: 'deco', x: 57, y: 1, look: 'eyrie_nest', solid: [[0, 0]], oy: -2, text: 'An old eagles\' nest, empty for years, as big as a cartwheel. Woven in among the sticks: a strip of green ribbon, bleached nearly white by the wind.' },
        /* the moor: cairns, gorse, hawthorns the wind has combed */
        { k: 'deco', x: 9, y: 4, look: 'cairn', solid: [[0, 0]], text: 'A cairn. Everyone who comes up here adds a stone. You add one. It stays where you put it, which is more than most things up here do.' },
        { k: 'deco', x: 48, y: 25, look: 'cairn', solid: [[0, 0]] },
        { k: 'deco', x: 6, y: 36, look: 'cairn', solid: [[0, 0]] },
        { k: 'deco', x: 38, y: 33, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 56, y: 37, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 4, y: 26, look: 'gorse', solid: [[0, 0]] },
        { k: 'deco', x: 50, y: 3, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 24, y: 25, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 23, y: 26, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 59, y: 27, look: 'heather_clump', solid: [[0, 0]] }, { k: 'deco', x: 8, y: 35, look: 'gorse', solid: [[0, 0]] }, { k: 'deco', x: 7, y: 37, look: 'heather_clump', solid: [[0, 0]] },
        { k: 'deco', x: 44, y: 6, look: 'heather_clump', solid: [[0, 0]] }, { k: 'deco', x: 15, y: 5, look: 'heather_clump', solid: [[0, 0]] }, { k: 'deco', x: 33, y: 16, look: 'heather_clump', solid: [[0, 0]] },
        { k: 'tree', x: 4, y: 29, look: 'tree_bent', small: true }, { k: 'tree', x: 56, y: 33, look: 'tree_bent2', small: true }, { k: 'tree', x: 47, y: 13, look: 'tree_bent', small: true },
        { k: 'tree', x: 8, y: 6, look: 'tree_bent2', small: true }, { k: 'tree', x: 51, y: 6, look: 'tree_bent', small: true }, { k: 'tree', x: 58, y: 25, look: 'tree_bent', small: true },
    ],
    regions: [
        { name: 'The Bluster', x: 3, y: 20, w: 58, h: 8 },
        { name: 'The Crags', x: 3, y: 11, w: 26, h: 7 },
        { name: 'The Eyrie', x: 55, y: 1, w: 6, h: 3 },
        { name: 'The Belfry', x: 3, y: 1, w: 58, h: 8 },
    ],
});

PEOPLE_DEF.brindle = { name: 'Brindle', col: '#d8b070', look: { body: 'adult', hair: 'long', hairC: '#9a6438', top: '#b48ce8', accent: '#fbf6ea', bottom: '#5a4a3a', skin: 'tan' } };
PEOPLE_DEF.tess = PEOPLE_DEF.tess || { name: 'Mum', col: '#e8b04a', look: { body: 'adult', hair: 'bun', hairC: '#c45a3a', top: '#e8b04a', accent: '#fbf6ea', bottom: '#6b4128', skin: 'light' } };

TALK.brindle = function* () {
    yield* firstThen('brindle', "Goats, heather and wind. That's the Heights. The goats are mostly wind too, some days.",
        ["That boulder on the stair? Rolled down in a storm and fell asleep there. Ring the shrine bell. Wakes anything.", "The Bluster blows on and off, regular as a clock. Watch the vanes.", "Your mum's up top. She's been up top since before the sun.",
            "The old ringers used to cross the Crags for luck, past the chasm. The wind does half the work, they'd say. I never did know what they meant, and I never asked. Too windy to ask."]);
};
TALK.tess = function* () {
    if (Progress.flag('d4')) { yield* say('tess', cycle('tess4', ["Four Knots! Did you hear the bells ringing for you? That was me. Well. Some of it.", "Get yourself home for the festival. Everyone'll be there. Everyone always is.", "My bell-ringer's bairn. Go on, then."])); return; }
    if (!Progress.flag('met:tess')) {
        Progress.set('met:tess');
        yield* say('tess', "{name}! You climbed all this way! Come here, let me see you. Windblown. Good. That's how you should look.");
        yield* say('tess', "The Belfry's just there. Bells call things home, love. Remember that. Ring, and everything that's wandered comes running back.");
        yield* say('tess', "I'd come in with you, but I've the noon bell to see to. And the one o'clock. And... well. Bells.");
        return;
    }
    yield* say('tess', cycle('tess1', ["A ring reaches as far as you can throw a shout. Seven strides, about.", "When it's windy, everything wanders. When the bell goes, everything comes back. That's the Heights for you.", "Did your dad feed you? He never feeds you."]));
};
BUDGE.brindle = 'Brindle: "Mind the goats."';

/* the ringers' old bell: with its clapper back it rings like any bell (and wakes what sleeps in reach) */
class OldBell extends Bell {
    constructor(tx, ty, p) { super(tx, ty, p); this.fitted = false; }
    onAdd(area) { if (Progress.areaFlag(area.id, 'oldbell')) this.fitted = true; }
    ring() { if (this.fitted) return super.ring(); if (this.cool > 0) return; this.cool = 30; this.swing = 20; Sfx.play('hitthing'); Fx.text(this.x + 8, this.y - 14, 'clonk', PAL.grey2); }
    interact() {
        const b = this;
        Script.run(function* () {
            if (b.fitted) { yield* say(null, "The ringers' old bell, its clapper back where it belongs. A good knock would ring it."); return; }
            if (!Inv.items.clapper) { yield* say(null, "An old bell on a post, green with age. Somebody's taken its clapper: it hangs there with nothing inside, dumb. Carved on the post: RUNG FOR THE FLOCK. RUNG FOR THE LOST."); return; }
            const i = yield* ask(null, "An old bell with no clapper. The one you found in the Old Fold would fit it. Hang it in?", ['Hang it in', 'Not now']);
            if (i !== 0) return;
            b.fitted = true; Progress.setAreaFlag(b.area.id, 'oldbell'); Sfx.play('unlock'); Stats.count('secret:oldbell');
            yield* say(null, 'The clapper drops into place with a little ting, as if it had been waiting.');
        });
        return true;
    }
    talkBox(pl, f) { return f.tx === this.tx && f.ty === this.ty; }
    draw(cx, cy) { super.draw(cx, cy); const x = this.x - cx, y = this.y - cy; Gfx.rect(x + 7, y - 2, 2, 18, '#6b4128'); Gfx.rect(x + 7, y - 2, 1, 18, '#9a6438'); }
}
SPAWN.oldbell = (x, y, p) => new OldBell(x, y, p);

/* the Ringers' Stone, at the far end of the Crags: everyone who got across carved their initial and a little bell */
SPAWN.ringstone = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.ringstone, solid: [[0, 0]], oy: -14 });
    pr.baseY = 30;
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('crags_carved')) { yield* say(null, "The Ringers' Stone. Low down, very old, H. A long way above it, L. And above that, newest of all, your own initial and a little bell, the scratches still pale."); return; }
            yield* say(null, "A standing stone, worn smooth by the wind and carved all over with initials, a little bell scratched beside each one: everybody who ever got across the Crags.");
            yield* say(null, "Low down, very old and nearly worn away: H. A long way above it, sharper, years later: L. Above that there's smooth stone, as if nobody has been out here since.");
            const i = yield* ask(null, 'Carve your own?', ['Carve it', 'Not now']);
            if (i !== 0) return;
            Progress.set('crags_carved'); Stats.count('secret:crags'); Sfx.play('charm');
            yield* say(null, 'You scratch a little bell into the stone with the end of your stick, and your initial beside it. The wind blows the dust off it straight away, as if it had been waiting.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
BUDGE.tess = 'Mum: "Oof! Hello, love."';

/* ---------- the Heights' look: moor grass bent by the wind, heather, stony tracks, grey-violet rock, the chasm ---------- */
THEMES.heights.grass = ['#a9bf74', '#93aa62', '#c4d48e', '#6e8a4c'];
THEMES.heights.stone = ['#a69cae', '#7d7490', '#cbc3d2', '#4e465e'];
const HEIGHTS_HEATHER = ['#9a62a2', '#b884c0', '#6e4a78', '#d8b0dc'];
OWA.ground.heights = {
    /* short wiry grass, a little straw-coloured, every blade leaning the same way, heather coming and going through it */
    grass: {
        field: (tx, ty) => OWA.field(tx, ty, 31, 6, 4),
        draw(x, th, v, fl) {
            const [g0, g1, g2, g3] = th.grass;
            const base = g0;
            fill(x, base);
            speckle(x, [mix(base, g1, 0.8)], 11 + v * 13, 0.18);
            speckle(x, [mix(base, g2, 0.7)], 23 + v * 7, 0.06);
            /* heather's own dark foliage, thicker where the field says */
            speckle(x, ['#7a8650', '#6e7a4a'], 37 + v * 5 + fl, [0, 0.03, 0.06, 0.1][fl]);
            for (let n = 0; n < 6; n++) {
                const bx = Math.floor(hash2(v, n, 3) * 14) + 1, by = Math.floor(hash2(n, v, 5) * 12) + 3;
                px(x, bx, by, g3); px(x, bx + 1, by - 1, g1); px(x, bx + 1, by - 2, n % 2 ? g2 : '#d8cc90');
            }
            /* clumps of heather: a dark sprig, purple bells on it, a light one on top */
            for (let n = 0; n < [0, 1, 3, 5][fl]; n++) {
                const hx = Math.floor(hash2(v + fl * 4, n, 61) * 13) + 1, hy = Math.floor(hash2(n, v + fl * 4, 62) * 12) + 3;
                px(x, hx, hy + 1, '#5e6a40'); px(x, hx + 1, hy + 1, '#5e6a40');
                px(x, hx, hy, HEIGHTS_HEATHER[0]); px(x, hx + 1, hy, HEIGHTS_HEATHER[1]); px(x, hx + 1, hy - 1, HEIGHTS_HEATHER[3]);
                if (n % 2) { px(x, hx + 2, hy + 1, HEIGHTS_HEATHER[0]); px(x, hx - 1, hy + 1, HEIGHTS_HEATHER[2]); }
            }
            if (!fl && v === 3) { px(x, 11, 5, '#e8e0b0'); px(x, 12, 5, '#d8cc90'); }
        },
    },
    /* heather and harebells in the grass */
    flowers(x, th, v) {
        OWA.ground.heights.grass.draw(x, th, v, 1);
        for (let n = 0; n < 3; n++) {
            const fx = 2 + Math.floor(hash2(n, v, 1) * 11), fy = 3 + Math.floor(hash2(v + 3, n, 2) * 10);
            if ((n + v) % 2) { px(x, fx, fy, '#7aa0e8'); px(x, fx + 1, fy, '#a8c4f8'); px(x, fx, fy - 1, '#a8c4f8'); px(x, fx, fy + 1, th.grass[3]); }
            else { px(x, fx, fy, '#f4f0d8'); px(x, fx + 1, fy, '#f8e070'); px(x, fx, fy + 1, th.grass[3]); }
        }
    },
    /* tall bents, combed over by the wind */
    tallgrass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0); speckle(x, [g1], 31 + v, 0.12);
        for (let i = 0; i < 7; i++) {
            const bx = 1 + i * 2, h = 6 + Math.floor(hash2(i, v, 4) * 5);
            for (let j = 0; j < h; j++) px(x, Math.min(15, bx + Math.floor(j * j / 18)), 15 - j, j > h - 3 ? '#d8d090' : j > h / 2 ? g2 : g1);
            px(x, bx, 15, g3);
        }
    },
    /* a stony track: trodden earth with flat stones in it */
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.18); speckle(x, [p2], 41 + v, 0.07);
        for (let n = 0; n < 2; n++) {
            const sx = 1 + Math.floor(hash2(v, n, 12) * 10), sy = 1 + Math.floor(hash2(n, v, 13) * 11), w = 3 + (n + v) % 3;
            fill(x, th.stone[0], sx, sy, w, 2); fill(x, th.stone[2], sx, sy, w - 1, 1); fill(x, th.stone[1], sx, sy + 2, w, 1);
        }
    },
    /* under the pines: needles and heather */
    forest(x, th, v) { fill(x, '#4a5440'); speckle(x, ['#5a6a48', '#3a4232'], v + 9, 0.3); speckle(x, [HEIGHTS_HEATHER[2]], v + 19, 0.05); },
    /* heather, thick (it frays into the grass round it) */
    heather(x, th, v) {
        OWA.ground.heights.grass.draw(x, th, v, 3);
        for (let n = 0; n < 4; n++) {
            const hx = Math.floor(hash2(v, n, 71) * 14), hy = Math.floor(hash2(n, v, 72) * 13) + 1, c = HEIGHTS_HEATHER[(n + v) % 2];
            px(x, hx, hy, c); px(x, hx + 1, hy, c); px(x, hx, hy + 1, HEIGHTS_HEATHER[2]); if (n % 2) px(x, hx + 1, hy - 1, HEIGHTS_HEATHER[3]);
        }
    },
    /* steps cut in the rock, worn in the middle */
    stairs(x, th) {
        const [s0, s1, s2, s3] = th.stone;
        for (let i = 0; i < 4; i++) {
            const y = i * 4;
            fill(x, mix(s0, s2, 0.4), 0, y, 16, 2); fill(x, s0, 0, y + 2, 16, 1); fill(x, mix(s1, s3, 0.5), 0, y + 3, 16, 1);
            fill(x, mix(s0, '#c8b896', 0.35), 5, y, 6, 2);
        }
        fill(x, s3, 0, 0, 1, 16); fill(x, s3, 15, 0, 1, 16);
    },
};
OWA.cliffs.heights = {
    face: (x, th, v, m) => OWA.rockFace(x, th, v, m, { blocks: true, band1: [0, 5, 10], band2: [0, 6, 11], lip: ['#7e8a52', '#6a7a4a', '#9aa86a'], lichen: ['#c8d890', '#e8e0a0', '#a8c0a0'], seed: 5 }),
    top: (x, th, v, m) => OWA.rockTop(x, th, v, m, { topCol: '#9c94a8', tuft: [HEIGHTS_HEATHER[0], HEIGHTS_HEATHER[1]], seed: 5 }),
};
/* a chasm: the far wall going down into the dark, rocky lips, a breath of mist far below */
OWA.paint.chasm = {
    shade: true,
    mask(a, tx, ty) {
        const pit = (x, y) => a.inside(x, y) && a.cell(x, y).k === 'pit';
        return (pit(tx, ty - 1) ? 'n' : '-') + (pit(tx, ty + 1) ? 's' : '-') + (pit(tx - 1, ty) ? 'w' : '-') + (pit(tx + 1, ty) ? 'e' : '-') + (pit(tx, ty - 2) || !pit(tx, ty - 1) ? '' : '2');
    },
    draw(x, th, v, m) {
        const [s0, s1, s2, s3] = th.stone;
        const n = m[0] === 'n', s = m[1] === 's', w = m[2] === 'w', e = m[3] === 'e', deep2 = m[4] === '2';
        /* the depths */
        for (let j = 0; j < 16; j++) fill(x, mix('#2c2438', '#120e1a', Math.min(1, (j + (n ? 10 : 0)) / 22)), 0, j, 16, 1);
        speckle(x, ['#3a3248'], 70 + v, 0.05);
        /* the far wall: rock falling away from the lip above */
        if (!n || deep2) {
            const top = n ? -6 : 0;
            for (let j = 0; j < 12; j++) {
                const y = top + j; if (y < 0) continue;
                const k = j / 12, c = mix(mix(s0, s1, 0.3), '#2c2438', k * k);
                fill(x, c, 0, y, 16, 1);
                for (let i = 0; i < 16; i++) if (hash2(i, j + v * 16, 77) < 0.12) px(x, i, y, mix(c, s3, 0.6));
                if (j % 4 === 3) fill(x, mix(c, '#120e1a', 0.4), 0, y, 16, 1);
            }
            if (!n) { fill(x, mix(s2, '#ffffff', 0.15), 0, 0, 16, 1); fill(x, s0, 0, 1, 16, 1); }
        }
        /* mist far down */
        if (s || n) for (let i = 0; i < 3; i++) { const mx = Math.floor(hash2(v, i, 81) * 12), my = 9 + Math.floor(hash2(i, v, 82) * 5); x.globalAlpha = 0.18; fill(x, '#c8c0e0', mx, my, 4 + i, 1); x.globalAlpha = 1; }
        /* the lips: rock edges on either side, the near edge's lip below */
        if (!w) { fill(x, mix(s1, '#120e1a', 0.3), 0, 0, 3, 16); fill(x, s0, 0, 0, 1, 16); fill(x, s3, 2, 0, 1, 16); }
        if (!e) { fill(x, mix(s1, '#120e1a', 0.5), 13, 0, 3, 16); fill(x, s1, 15, 0, 1, 16); fill(x, s3, 13, 0, 1, 16); }
        if (!s) { fill(x, s3, 0, 13, 16, 1); fill(x, s1, 0, 14, 16, 1); fill(x, mix(s0, s2, 0.4), 0, 15, 16, 1); }
    },
};

function initHeightsArt() {
    /* a hawthorn bent by the wind: the trunk leans east, the crown swept along after it, a few leaves flying */
    const bent = (name, leaf, bark, seed, berries) => {
        ART[name] = paintSprite(36, 36, x => {
            const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
            for (let j = 0; j < 18; j++) {
                const k = j / 18, cx = Math.round(14 + k * k * 9);
                R(bark[1], cx - 2, 35 - j, 4, 1); R(bark[0], cx - 2, 35 - j, 1, 1); R(bark[2], cx + 1, 35 - j, 1, 1);
            }
            R(bark[1], 9, 34, 4, 2); R(bark[1], 16, 34, 4, 2); R(bark[1], 20, 22, 6, 2); R(bark[0], 20, 22, 6, 1);
            const clumps = [[22, 14, 9, 6], [14, 15, 6, 5], [29, 12, 6, 5], [20, 9, 7, 4], [27, 18, 5, 4]];
            for (const [cx, cy, rx, ry] of clumps) for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
                const u = i / rx, w = j / ry; if (u * u + w * w > 1) continue;
                const l = -u * 0.35 - w * 0.9 + (hash2(cx + i, cy + j, seed) - 0.5) * 0.8;
                R(l > 0.55 ? leaf[2] : l > 0 ? leaf[1] : l > -0.6 ? leaf[0] : leaf[3], cx + i, cy + j, 1, 1);
            }
            /* streaming twigs downwind */
            for (const [a, b] of [[33, 10], [34, 15], [32, 19]]) { R(leaf[3], a, b, 2, 1); R(leaf[0], a - 1, b, 1, 1); }
            if (berries) for (let n = 0; n < 7; n++) { const bx = 12 + Math.floor(hash2(n, seed, 9) * 20), by = 9 + Math.floor(hash2(seed, n, 11) * 10); const d = x.getImageData(bx, by, 1, 1).data; if (d[3]) { R(berries, bx, by, 1, 1); R('#ffd0c8', bx, by - 1, 1, 1); } }
        });
    };
    bent('tree_bent', ['#5a8a4a', '#76a258', '#a4c47a', '#3a5e3e'], ['#8a6a50', '#6a4e3a', '#4a3428'], 3, '#d83a3a');
    bent('tree_bent2', ['#6a8a4e', '#86a45e', '#b0c884', '#44603e'], ['#8a7058', '#6a5240', '#463428'], 9);
    /* a cairn: flat stones stacked by passers-by, the top one set on edge */
    ART.cairn = paintSprite(16, 22, x => {
        const st = [[8, 19, 7, 3], [7, 15, 6, 3], [9, 11, 5, 3], [7, 7, 4, 3], [8, 3, 2, 3]];
        st.forEach(([cx, cy, rx, ry], i) => discPx(x, cx, cy, Math.max(rx, ry), (px, py, u, w) => {
            if ((py - cy) * (py - cy) * rx * rx + (px - cx) * (px - cx) * ry * ry > rx * rx * ry * ry) return null;
            const l = -u * 0.6 - w * 1.0 + (hash2(px, py, 4 + i) - 0.5) * 0.5;
            return l > 0.5 ? '#d4ccd8' : l > -0.1 ? '#aaa0b4' : l > -0.7 ? '#857c94' : '#5e5670';
        }));
    });
    /* heather in a clump, and gorse with its yellow flowers */
    bushArt('heather_clump', ['#6a7a4a', '#8a5a98', '#b47ac0', '#4a5638', '#e0a8e0'], 13, 16, 12);
    bushArt('gorse', ['#4a7038', '#5e8a44', '#86ac5a', '#2e4a2a', '#f4d040'], 17, 16, 14);
    /* the Ringers' Stone: a tall stone carved with initials and little bells */
    ART.ringstone = paintSprite(16, 30, x => {
        for (let j = 2; j < 30; j++) { const w = j < 6 ? 3 + j : 7 - (j > 26 ? 1 : 0); for (let i = 8 - w; i < 8 + w; i++) { const l = -(i - 8) / 7 * 0.6 + (hash2(i, j, 5) - 0.5) * 0.4; x.fillStyle = l > 0.35 ? '#cfc7d6' : l > -0.2 ? '#a69cae' : '#7d7490'; x.fillRect(i, j, 1, 1); } }
        x.fillStyle = '#5e5670'; for (const [a, b] of [[5, 9], [9, 10], [6, 14], [10, 15], [5, 19], [9, 21]]) { x.fillRect(a, b, 2, 1); x.fillRect(a, b + 1, 1, 2); }
        x.fillStyle = '#e2b45a'; x.fillRect(11, 8, 2, 2); x.fillRect(4, 17, 2, 2);
    });
    /* the eagles' old nest: a great tangle of sticks */
    ART.eyrie_nest = paintSprite(28, 16, x => {
        for (let j = 0; j < 14; j++) for (let i = 0; i < 28; i++) {
            const u = (i - 13.5) / 13.5, w = (j - 8) / 6; if (u * u + w * w > 1) continue;
            const ring = u * u + w * w > 0.45 || j > 9;
            const r = hash2(i, j, 33);
            x.fillStyle = !ring ? (r < 0.5 ? '#4a3424' : '#3a281c') : r < 0.3 ? '#a87a50' : r < 0.6 ? '#8a6040' : r < 0.85 ? '#6a4a30' : '#c49a68';
            x.fillRect(i, j + 1, 1, 1);
        }
        for (const [a, b, c, d] of [[0, 6, 6, 1], [22, 4, 6, 1], [3, 11, 5, 1], [20, 12, 7, 1]]) { x.fillStyle = '#6a4a30'; x.fillRect(a, b, c, d); }
        x.fillStyle = '#8ac87a'; x.fillRect(16, 5, 4, 1); x.fillStyle = '#d8ecc8'; x.fillRect(19, 5, 2, 1);
    });
    /* a proper birch: white bark ringed with black, a crown of small bright leaves (it was washed out before) */
    treeArt('tree_birch', { leaf: ['#5f9e46', '#7dbc52', '#a8d470', '#3a7038'], bark: ['#f4f2ea', '#d6d6cc', '#3a3a3a'] }, 6, { clumps: [[16, 12, 8], [10, 16, 6], [22, 15, 6], [13, 7, 5], [20, 7, 5], [16, 19, 6]] });
    {
        const c = ART.tree_birch; if (!HEADLESS) { const x = c.getContext('2d'); x.fillStyle = '#3a3a3a'; for (const [a, b] of [[14, 27], [16, 30], [15, 32], [17, 25]]) x.fillRect(a, b, 2, 1); }
    }
}
CONTENT_INIT.push(initHeightsArt);
/* the quilt counts the Heights' finds too (src/78c_polish.js) */
CONTENT_INIT.push(() => QUILT[0][1].push(() => Progress.areaFlag('hollow', 'chest:cragPatch'), () => Progress.flag('crags_carved'), () => Progress.areaFlag('hollow', 'chest:eyriePatch'), () => Progress.areaFlag('hollow', 'oldbell')));
