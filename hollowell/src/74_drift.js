/* Past the fog: the Drift. With her own thread cut, Wren can walk into the fog at the Frayed Edge and out the other
   side, into the wide world, where nothing has a thread and nothing comes back: no hearts (nothing to unravel), no
   falling home (you climb out where you fell), a map that's blank until you walk it. Linnet lives out here, in a
   cottage with a garden. Meeting her, Wren's gone-ness reaches Gran: the Great Pull begins (src/75_greatspool.js). */

const DRIFT_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYVYYYYYYYYYYYYYYY%%%%',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYVYYYYYYYYYYYYYYY%%%%',
    'YYYYYYYYYYYYYYYY.....hYYhh...",,YYYY..YY..YKVK,..,,,.khhYYYY%%%%',
    'YYYYYYYYYYYYYYYY....hhYYhh.""","YYYY"XXXXXXKV....,,,.khhYYYY%%%%',
    'YYYYYYYYYYYYYY..hhhhhhhhhh."""YYYYYY"XXXXXXKVK...,.,,kh.YY..%%%%',
    'YYYYYYYYYYYYYY..hhhhhhhhhh,"""YYYYYY"XXXXXXKVK..,,,,,k..YY..%%%%',
    'YYYYYYYYYYYYYY..hhhhhhhh.h,...YYYY.""XXXXXX.VK..,,,,,k......%%%%',
    'YYYYYYYYYYYYYY..hhhhhhhh.h....YYYY.."XXXXXXKV....,,,,k......%%%%',
    'YYYYYYYYYYYYYY..hhhhhhhh....,,.............KVK..,,,,,k......%%%%',
    'YYYYYYYYYYYYYY...hhhhhh.....,,,,...~~~~~~~~KKK..,,,,,.hh....%%%%',
    'YYYY,,.,,,........hhhh...""",,,,...~~~~~~~~.....,,,,,.hhh,,,%%%%',
    'YYYY,.....,...........""jjjjjjjjjjj~~~~~~~~......,,,.khhhh.,%%%%',
    'YY........,.""XXXXXXXX""",,""".....~~~~~~~~.........kkhhhh..%%%%',
    'YY........,...XXXXXXXX"",,,"".....KKKKKK~KKK........k.hhhh..%%%%',
    'YY........,...XXXXXXXX..,,,.............~...........k.hhhhh.%%%%',
    'YY............XXXXXXXX..,,,.....".......~......."...k.hhhhhh%%%%',
    'YY............XXXXXXXX..,,,...."""""....~......"""..k.hhhhhh%%%%',
    'YY..............".......,,::::::""".....~.......".....hhhhhh%%%%',
    '......::::::::::::::::::::::::::::::::..~.::::::::::::::::::%%%%',
    '::::::::::::::::::::::::::,,,,,,::::::..~.::::::::::::::::::%%%%',
    'YY,""..."",....,..,,...,,,.,,,,,........~...,,........hhhhhh%%%%',
    'YY,""...""..,,.,,,..,....,,,,,,,........~...........k.hhhhhh%%%%',
    'YY.""..."".,..,..,....,,,.,,,,,.........~"..........k,hhhhh.%%%%',
    'YY....,....,,.,,,,,..,..,..,,.........."~"..........k.hhhhh.%%%%',
    'YY...,,,YY.,.,,....,,.,....,...........~~"..YYYYYY,,k.hhhh..%%%%',
    'YY...,,,YY,.,.,,..,,,,.,.,,,...........~,,..YYYYYY,,k.hhhh..%%%%',
    'YY....YYYYYY..,,....,,.,,..,YYYY.......~""..YYYYYYYYk.hhhh..%%%%',
    'YY....YYYYYY................YYYY.......~""".YYYYYYYY.kh.....%%%%',
    'YYYYYYYYYYYYYYYY..........YYYYYYYY,,,..~""".YYYYYYYYYY".....%%%%',
    'YYYYYYYYYYYYYYYY..........YYYYYYYY,,,,~~"...YYYYYYYYYY.....h%%%%',
    'YY..YYYYYYYYYY............YYYYYYYYYY,,~.....YYYYYYYY"k.....h%%%%',
    'YY..YYYYYYYYYY............YYYYYYYYYY,,~.....YYYYYYYY"k.....h%%%%',
    'YY..YYYYYYYYYY....."".....YYYYYYYY,,,,~,..,.YYYYYYYY.k......%%%%',
    'YY..YYYYYYYYYY....."""....YYYYYYYY.,,,~...,.YYYYYYYY.k,,....%%%%',
    'YYYYYYYYYYYY"......""""...,.YYYYYY...,~~..,...........,,....%%%%',
    'YYYYYYYYYYYY,........"".....YYYYYY..,,,~,,,,,h........,,,...%%%%',
    'YYYY.,YYYY.,,...YY....""".YY..YYYY.,,,Y~,,YYYYYY..YY.k,,,.YY%%%%',
    'YYYY..YYYY.,,...YY....."".YY..YYYY.,,,Y~,,YYYYYY..YY.k....YY%%%%',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY~YYYYYYYYYYYYYYYYYYYY%%%%',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY~YYYYYYYYYYYYYYYYYYYY%%%%',
];

/* the Drift's own ground (these letters are the Drift's alone) */
const DRIFT_LEGEND = Object.assign({}, OW_LEGEND, {
    'h': { k: 'grass', p: 'heath' },            /* heather and dry grass */
    'j': { k: 'grass', p: 'oldroad' },          /* an old road gone back to grass, its cobbles showing through */
    'd': { k: 'path', p: 'mud' },               /* the mill pond's bed, once it's run out */
    'k': { k: 'rock', p: 'drywall' },           /* a dry-stone wall, tumbled in places */
    'K': { k: 'rock', p: 'racewall' },          /* the mill's dressed stone: the race's walls, the dam */
});
/* the old mill: the pond (x, y, w, h), the sluice in its dam, how long the wheel keeps its sluice up after a float has
   gone by (frames), how far up the sluice must be wound before its catch holds, and the milestone on the pond's bed */
const MILL = {
    pond: [35, 9, 8, 4], sluice: [40, 13], TIME: 240, FULL: 900,
    stone: { x: 37, y: 10, look: 'drift_milestone', text: "A milestone, furred with weed, beside the drowned road. Cut deep in its face: HOLLOWELL 3. On its back, worn nearly away: AND THE WIDE WORLD. The road went in, once, before there was any fog." },
};

PEOPLE_DEF.linnet = { name: 'Linnet', col: THREAD.linnet, look: { body: 'adult', hair: 'long', hairC: '#8a4a2a', top: '#5ab85a', accent: '#8fd46a', bottom: '#3a6a3a', skin: 'light' } };

defArea({
    id: 'drift', name: 'The Drift', family: 'outdoor', theme: 'drift', music: 'drift', blankMap: true,
    /* loose ends on the wind: bits of thread with nothing on either end, drifting west to east (only an effect) */
    drawOver: (a, cx, cy) => {
        const cols = [THREAD.town, THREAD.linnet, '#e4ecf5', THREAD.wren, '#c9a24a'];
        for (let i = 0; i < 9; i++) {
            const sp = 0.18 + (i % 4) * 0.06, span = W + 80;
            const x = ((i * 113 + G.t * sp) % span) - 40, y = ((i * 47) % (H - 30)) + 12 + Math.sin(G.t / 50 + i) * 6;
            const c = cols[i % cols.length];
            Gfx.alpha(0.55);
            for (let k = 0; k < 7; k++) Gfx.rect(Math.round(x - k * 2), Math.round(y + Math.sin(G.t / 18 + i + k * 0.8) * 2), 2, 1, c);
            Gfx.alpha(1);
        }
    },
    /* the ground, then the fog bank seen from outside (its threads, its edge spilling onto the grass) */
    drawGround: (a, cx, cy) => { DriftArt.ground(a, cx, cy); Fog.draw(a, cx, cy); },
    rows: DRIFT_ROWS, legend: DRIFT_LEGEND,
    build: a => DriftMill.build(a),
    ents: [
        /* Linnet's cottage and garden */
        { k: 'building', x: 14, y: 12, w: 8, h: 5, door: null, style: 'cottage', variant: 'linnet' },
        { k: 'npc', who: 'linnet', x: 18, y: 21, face: 'down', id: 'linnet' },
        { k: 'driftbloomseed', x: 13, y: 22 },
        { k: 'deco', x: 23, y: 23, look: 'driftbloom', solid: [[0, 0]] }, { k: 'deco', x: 16, y: 24, look: 'driftbloom', solid: [[0, 0]] },
        { k: 'sign', x: 22, y: 17, text: "LINNET'S. (Knock. Or don't: I'm in the garden.)", if: '!unwound' },
        { k: 'sign', x: 22, y: 17, text: "LINNET'S. (Gone home to Mum's. Back now and then. Take a flower.)", if: 'unwound' },
        /* a stray boulder by the stream (nothing out here comes back: push it in and it stays in) */
        { k: 'stray', x: 43, y: 16, id: 'drBoulder' }, { k: 'stray', x: 46, y: 21, id: 'drBoulder2' },
        { k: 'sign', x: 55, y: 17, text: 'An old marker stone, half sunk. Carved on it, worn nearly smooth: THE HOLLOW ENDS HERE.' },
        { k: 'rest', x: 30, y: 20 },
        /* the old mill, up the stream: a race down out of the woods turns its wheel; the wheel winds up the sluice in
           the mill pond's dam, but only while it's turning, and nothing out here comes round twice */
        { k: 'driftmill', x: 37, y: 3 },
        { k: 'millwheel', x: 43, y: 6, face: 'right', sig: 'millWheel', time: MILL.TIME },
        { k: 'millsluice', x: 40, y: 13, id: 'drSluice' },
        { k: 'barrel', x: 46, y: 3, id: 'drBarrel', marked: false },
        { k: 'barrel', x: 48, y: 5, id: 'drBarrel2', marked: false },
        { k: 'stray', x: 47, y: 7, id: 'drBoulder3' },
        /* on the pond's bed, under the water: the old road, its milestone (DriftMill.build), a toll box */
        { k: 'chest', x: 41, y: 10, item: 'b50', id: 'drToll', hidden: true, when: 'flag:drift_millpond' },
        /* what came over the fog from the fair, if it was cut loose */
        { k: 'driftballoon', x: 58, y: 6, if: 'balloon_away' },
    ],
    regions: [
        { name: 'The Drift', x: 0, y: 0, w: 60, h: 40 },
        { name: "Linnet's Garden", x: 10, y: 11, w: 17, h: 16 },
    ],
    entry: { x: 58, y: 18 },
    tick: a => Drift.tick(a),
});

const Drift = {
    tick(a) {
        const p = G.player; if (!p || Script.blocking()) return;
        /* back east into the fog: home, on foot */
        if (p.tx >= 60 && p.state === 'normal') World.go('hollow', 67, p.ty < 20 ? 19 : 20, { dir: RIGHT, fade: true });
    },
    *meet(n) {
        /* what she's noticed, out here: the mill going, a balloon come over the fog */
        if (Progress.flag('met_linnet') && Progress.flag('drift_millpond') && !Progress.flag('linnet_mill')) {
            Progress.set('linnet_mill');
            yield* say('linnet', "You've had the old mill going. The pond's run out! I tried, my first year. I'd push a barrel down the race and watch it turn the wheel once, and then it was gone, and that was that.");
            yield* say('linnet', "Out here nothing comes round twice. Unless somebody gives it a reason to. ...You're Tess's girl, all right.");
            return;
        }
        if (Progress.flag('met_linnet') && Progress.flag('balloon_away') && !Progress.flag('linnet_balloon')) {
            Progress.set('linnet_balloon');
            yield* say('linnet', "Something came over the fog the other day: a balloon, striped, from the fair by the look of it. It's caught in the tree by the old wall. I haven't had the heart to get it down.");
            return;
        }
        if (Progress.flag('met_linnet')) { yield* say('linnet', cycle('linnet_after', ["Go on, Wren. I'll come. I promise I'll come.", "She can't pull you. Remember that. Nothing can, now, unless you let it.", "Tell Biscuit I said hello. Ha! He knows."])); return; }
        Progress.set('met_linnet'); Stats.count('met:linnet');
        yield* say('linnet', "Hello? ...Oh. Oh, look at you. You've got Tess's chin. You're Tess's girl. You're Wren.");
        yield* say('linnet', "You've cut your own thread. I can see it: there's nothing on you. Nothing pulling at all.");
        const i = yield* ask('linnet', "How does it feel?", ['Light.', 'Frightening.', 'Come home.']);
        yield* say('linnet', ["Light. Yes. It's the lightest thing in the world. You'll get used to it. Or you won't, and that's all right too.", "It is. It's frightening. Nobody's going to bring you back if you get lost. That's the whole of it. That's the price, and it's worth it.", "Home. ...I've thought about it every day for twenty-five years."][i]);
        yield* say('linnet', "I found the Hall of Names on my Wander, the same as you. I read her ledger. I took the old Shears out of the Loom and cut myself loose and walked out into the fog, and the fog let me go.");
        yield* say('linnet', "And I've been cutting from out here ever since. Little threads, at the edge, a few a year. Strays. I wanted her to see that the valley didn't come apart. That things could be lost and it would be all right. I wanted her to let go.");
        yield* say('linnet', "I never went back. I was frightened she'd tie me again. She would have.");
        G.shake = 14; Sfx.play('rumble'); Music.play('silence');
        yield 40;
        yield* say(null, "Far off in the east, beyond the fog, something enormous takes up slack. You feel it in your teeth. The fog leans the wrong way: towards the Hollow, not away.");
        yield* say('linnet', "That's her. She's felt you go. She's pulling everything. Every thread in the valley. Everyone.");
        yield* say('linnet', "Go, Wren. Walk. She can't pull you, not now; but she'll pull everyone else down the Well with her if she can. The Spool's under the Well. Go.");
        yield* say('linnet', "...I'll come. I'll come after you. I just need a moment to find my nerve. I've had twenty-five years and I still need a moment.");
        Progress.set('great_pull');
        Progress.setGoal("Back to Hollowell, on foot. Gran is pulling the whole valley down the Well.");
        Music.play('pull');
        Save.autosave();
    },
};
TALK.linnet = function* (n) { yield* Drift.meet(n); };

/* walking into the fog with no thread: out the other side */
{
    const tick0 = OW.blocks['1,0'].tick;
    OW.blocks['1,0'].tick = a => {
        if (tick0) tick0(a);
        const p = G.player;
        if (p && Progress.flag('cut_self') && p.state === 'normal' && !Script.blocking() && p.tx <= 65 && a.kind(p.tx, p.ty).fog && !World.going) {
            World.go('drift', 58, clamp(p.ty, 3, 36), { dir: LEFT, fade: true });
            if (!Progress.flag('drift_first')) { Progress.set('drift_first'); G.pendingToast = 'Through the fog, the threads in it parting round you like a bead curtain, and out.'; if (!Progress.flag('met_linnet')) Progress.setGoal('Somewhere out here, west across the stream, a cottage with a garden, and someone in it.'); }
        }
    };
}
Shears.onSelfCut = function* () {
    G.heartsLeaving = 120;
    yield* say(null, "The hearts you've carried all your life come undone and drift away. There's nothing left to unravel.");
    while (G.heartsLeaving > 0) yield 1;
    Progress.setGoal('Into the fog, at the Frayed Edge. Nothing will pull you back now.');
};

/* nothing to pull you home: falls are just falls (you climb out), and hurts have nothing to unravel */
{
    const fall0 = Player.prototype.updateFall;
    Player.prototype.updateFall = function () {
        if (Progress.flag('cut_self') && this.stateT >= 26 && !(Inv.bedroll && Inv.bedroll.area === this.area.id)) {
            /* out on the side you went in from, if there's ground there */
            const bx = this.tx - DX[this.dir], by = this.ty - DY[this.dir], back = this.landingSpot(bx, by);
            const [lx, ly] = back[0] === bx && back[1] === by ? back : this.landingSpot(this.tx, this.ty);
            this.x = lx * T + 8; this.y = ly * T + 10; this.state = 'normal'; this.inv = 40;
            Fx.dust(this.x, this.y); Sfx.play('land');
            return;
        }
        return fall0.call(this);
    };
    const hurt0 = Player.prototype.hurt;
    Player.prototype.hurt = function (n, fx, fy) {
        if (Progress.flag('cut_self')) { Inv.hp = Inv.maxHp; hurt0.call(this, n, fx, fy); Inv.hp = Inv.maxHp; return; }
        return hurt0.call(this, n, fx, fy);
    };
}
/* the map of the Drift is blank until you walk it */
{
    const draw0 = MapView.draw;
    MapView.draw = function (x, y, w, h) {
        const a = G.map;
        if (a && a.def.blankMap) {
            const sc = Math.max(1, Math.min(Math.floor((w - 8) / a.w), Math.floor((h - 16) / a.h)));
            const ox = x + Math.floor((w - a.w * sc) / 2), oy = y + 14 + Math.floor((h - 16 - a.h * sc) / 2);
            Font.draw(a.name + ' (you draw it as you go)', x + 4, y + 2, PAL.ink);
            const seen = Stats.visited[a.id] || {};
            for (let ty = 0; ty < a.h; ty++) for (let tx = 0; tx < a.w; tx++) {
                if (!seen[(tx >> 2) + ',' + (ty >> 2)]) continue;
                Gfx.rect(ox + tx * sc, oy + ty * sc, sc, sc, MAP_COL[a.cell(tx, ty).k] || '#c8e0a0');
            }
            const p = G.player;
            if ((G.t >> 3) % 2) Gfx.rect(ox + (p.x / T) * sc - 1, oy + (p.y / T) * sc - 1, 3, 3, PAL.red);
            return;
        }
        return draw0.call(this, x, y, w, h);
    };
}

function initDrift() {
    ART.driftbloom = paintSprite(16, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#4a8a3a', 7, 8, 2, 16); R('#6ab84a', 4, 14, 4, 2); R('#6ab84a', 9, 18, 4, 2); R('#9ad0f0', 4, 2, 8, 6); R('#c8e8fa', 5, 1, 6, 2); R('#f7e08a', 7, 4, 2, 2); });
}
CONTENT_INIT.push(initDrift);

/* the Drift's woods: a tree to every 2x2 of forest, and more in between where it's thick; wild trees, mostly (oak,
   rowan, birch, a pine or two), none quite in line with the next (each nudged a little when the place is built) */
{
    const R = DRIFT_ROWS, Y = (x, y) => R[y] && R[y][x] === 'Y' && R[y][x + 1] === 'Y' && R[y + 1] && R[y + 1][x] === 'Y' && R[y + 1][x + 1] === 'Y';
    const LOOKS = ['tree_wild', 'tree_wild', 'tree_wild2', 'tree_rowan', 'tree_birch', 'tree_wild2', 'pine', 'tree_wild'];
    const plant = (x, y) => AREAS.drift.ents.push({ k: 'drifttree', x, y, look: LOOKS[Math.floor(hash2(x, y, 7) * LOOKS.length)] });
    for (let y = 0; y < R.length - 1; y += 2) for (let x = 0; x < R[0].length - 1; x += 2) if (Y(x, y)) plant(x, y);
    for (let y = 1; y < R.length - 1; y += 2) for (let x = 1; x < R[0].length - 1; x += 2) if (Y(x, y) && hash2(x, y, 9) < 0.4) plant(x, y);
}
/* a Drift-bloom gone to seed by Linnet's gate: one seed (S11), for anybody who never got one from the fog */
SPAWN.driftbloomseed = (tx, ty) => {
    const pr = SPAWN.deco(tx, ty, { look: 'driftbloom', solid: [[0, 0]] });
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('s11') || Progress.flag('seed_planted') || Inv.items.driftseed) { yield* say(null, 'A tall flower the colour of a sky after rain. It grows nowhere in the Hollow.'); return; }
            Progress.set('s11'); Stats.count('secret:driftseed');
            yield* say(null, 'A Drift-bloom gone to seed. A seed head comes away in your hand, warm, as if it wanted to.');
            yield* Story.getItem('driftseed')();
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};

/* (not a block of the map: just a tick the Hollow runs with its blocks') */
OW.blocks.fogpass = {
    tick: a => {
        const p = G.player;
        if (p && Progress.flag('cut_self') && p.state === 'normal' && !Script.blocking() && !World.going && a.kind(p.tx, p.ty).fog) {
            World.go('drift', 58, clamp(p.ty < 40 ? p.ty : Math.round(p.ty / 4), 3, 36), { dir: LEFT, fade: true });
            if (!Progress.flag('drift_first')) { Progress.set('drift_first'); G.pendingToast = 'Through the fog, the threads in it parting round you like a bead curtain, and out.'; if (!Progress.flag('met_linnet')) Progress.setGoal('Somewhere out here, west across the stream, a cottage with a garden, and someone in it.'); }
        }
    },
};

/* things Linnet cut loose at the edge over the years, lying about the Drift where they ended up, each with its L */
AREAS.drift.ents.push(
    { k: 'driftstray', x: 24, y: 6, look: 'drift_churn', text: "A milk churn, lying on its side in the grass, an L scratched into its lid. It used to stand outside a dairy in Meadowfold. Nobody came looking." },
    { k: 'driftstray', x: 55, y: 9, look: 'drift_kite', text: "A kite, caught in the long grass, its string cut clean. A little L inked on the tail. Somebody's child lost it over the fog, and it just... kept going." },
    { k: 'driftstray', x: 30, y: 25, look: 'drift_gnome', text: "A garden gnome, grinning, an L scratched on his hat. He's been out here so long a bird has nested in the crook of his arm." },
);
SPAWN.driftstray = (tx, ty, p) => {
    const pr = SPAWN.deco(tx, ty, { look: p.look, solid: [[0, 0]], text: p.text });
    return pr;
};
CONTENT_INIT.push(() => {
    ART.drift_churn = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#a8b0b8', 2, 8, 12, 6); R('#c8d0d8', 3, 9, 10, 3); R('#8a929a', 12, 7, 3, 8); R('#6a727a', 14, 9, 2, 4); R('#5a3a26', 7, 10, 1, 2); });
    ART.drift_kite = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#e8463c', 6, 2, 4, 2); R('#e8463c', 5, 4, 6, 2); R('#f7d64a', 6, 6, 4, 2); R('#4f9be0', 7, 8, 2, 2); R('#5a3a26', 8, 10, 1, 2); R('#e4ecf5', 9, 12, 1, 1); R('#e4ecf5', 10, 13, 1, 1); });
    ART.drift_gnome = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#e8463c', 6, 1, 4, 2); R('#e8463c', 5, 3, 6, 2); R('#f2c6a0', 6, 5, 4, 3); R('#fbf6ea', 5, 7, 6, 3); R('#4f9be0', 5, 10, 6, 4); R('#3a2e24', 5, 14, 2, 2); R('#3a2e24', 9, 14, 2, 2); });
});

/* ---------- the Drift's look: a wide wild meadow; wildflowers in drifts of one kind, long grass, heather; an old cart
   track; dry-stone walls. The greens change softly from patch to patch: each tile's corners say which patch they're in,
   and the tile goes from one to the next between them, dithered, so no change of ground runs along a tile's edge ---------- */
const DriftArt = {
    MEADOW: [
        ['#98c862', '#88b856', '#b0d878', '#6a9446'],      /* lush, in the hollows */
        ['#a8d26a', '#96c25e', '#c0e084', '#76a24a'],      /* the meadow */
        ['#bade7c', '#a8ce6e', '#d2ea98', '#86ae56'],      /* sunlit, on the rises */
    ],
    BLOOMS: [
        { head: '#e2483a', hi: '#f6826a', eye: '#3a2424' },      /* poppies */
        { head: '#5a84e0', hi: '#94b6f4', eye: '#2e4aa0' },      /* cornflowers */
        { head: '#fbfaf2', hi: '#ffffff', eye: '#f2c040' },      /* ox-eye daisies */
        { head: '#f4d443', hi: '#fff09a', eye: '#c89a28' },      /* buttercups */
    ],
    cs: null,
    corner(x, y) { const n = OWA.n2(x / 6, y / 6, 51) * 0.75 + OWA.n2(x / 2.5, y / 2.5, 52) * 0.25; return n < 0.42 ? 0 : n < 0.6 ? 1 : 2; },
    corners(a, tx, ty) {
        if (!this.cs || this.cs.length !== a.w * a.h) this.cs = new Array(a.w * a.h);
        const i = ty * a.w + tx;
        return this.cs[i] || (this.cs[i] = '' + this.corner(tx, ty) + this.corner(tx + 1, ty) + this.corner(tx, ty + 1) + this.corner(tx + 1, ty + 1));
    },
    bloom(tx, ty) { return Math.min(3, Math.floor(OWA.n2(tx / 4, ty / 4, 53) * 4)); },
    /* which neighbours are (or aren't) like this tile: up 1, down 2, left 4, right 8 */
    mask(a, tx, ty, f) { let m = 0; [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy], b) => { if (f(a.cell(tx + dx, ty + dy))) m |= 1 << b; }); return m; },
    /* the meadow's greens across a tile, from its corners */
    meadow(x, cs, v, busy = 1) {
        const P = this.MEADOW.map(r => r.map(hexRGB)), c = [+cs[0], +cs[1], +cs[2], +cs[3]];
        const id = x.createImageData(T, T), d = id.data;
        for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
            const u = (i + 0.5) / T, w = (j + 0.5) / T;
            const m = c[0] * (1 - u) * (1 - w) + c[1] * u * (1 - w) + c[2] * (1 - u) * w + c[3] * u * w;
            const k = clamp(Math.round(m + (hash2(i, j, 61 + v) - 0.5) * 0.8), 0, 2), r = hash2(i, j, 71 + v);
            const col = P[k][r < 0.13 * busy ? 1 : r > 1 - 0.06 * busy ? 2 : 0], o = (j * T + i) * 4;
            d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
        }
        x.putImageData(id, 0, 0);
        /* blades: short dark strokes, each with a lit tip */
        for (let n = 0; n < 5 * busy; n++) {
            const bx = Math.floor(hash2(n, v, 81) * 15), by = 2 + Math.floor(hash2(v, n, 82) * 12), k = c[(bx > 7 ? 1 : 0) + (by > 7 ? 2 : 0)];
            fill(x, this.MEADOW[k][3], bx, by, 1, 2); px(x, bx, by - 1, this.MEADOW[k][2]);
        }
        return c;
    },
    grass(x, cs, v) {
        this.meadow(x, cs, v);
        const cols = ['#f8f4e4', '#f4d84a', '#d0b0ec'];
        for (let n = 0; n < 2; n++) if (hash2(n, v, 91) < 0.45) px(x, 1 + Math.floor(hash2(v, n, 92) * 14), 1 + Math.floor(hash2(n, v, 93) * 14), cols[Math.floor(hash2(n, v, 94) * 3)]);
    },
    flowers(x, cs, v, kind) {
        this.meadow(x, cs, v);
        const B = this.BLOOMS[kind];
        for (let n = 0; n < 6; n++) {
            const fx = 2 + Math.floor(hash2(n, v + kind * 4, 101) * 12), fy = 1 + Math.floor(hash2(v + kind * 4, n, 102) * 11);
            fill(x, '#4e8436', fx, fy + 2, 1, 2);
            if (kind === 2) { px(x, fx - 1, fy, B.head); px(x, fx + 1, fy, B.head); px(x, fx, fy - 1, B.head); px(x, fx, fy + 1, B.head); px(x, fx, fy, B.eye); }
            else { fill(x, B.head, fx, fy, 2, 2); px(x, fx, fy, B.hi); if (kind === 0) px(x, fx + 1, fy + 1, B.eye); }
        }
    },
    tall(x, cs, v) {
        const c = this.meadow(x, cs, v, 0.6);
        for (let n = 0; n < 8; n++) {
            const sx = 1 + Math.floor(hash2(n, v, 121) * 14), h = 5 + Math.floor(hash2(v, n, 122) * 5), sy = 15 - h - Math.floor(hash2(n, v, 123) * 3);
            const P = this.MEADOW[c[(sx > 7 ? 1 : 0) + (sy > 7 ? 2 : 0)]];
            fill(x, P[3], sx, sy, 1, h); px(x, sx + 1, sy + 2, P[2]);
            fill(x, n % 3 ? '#e2d49a' : '#c8b878', sx, sy - 2, 1, 2);
        }
    },
    oldroad(x, cs, v) {
        this.meadow(x, cs, v, 0.7);
        for (let n = 0; n < 5; n++) {
            const cx = 1 + Math.floor(hash2(n, v, 131) * 11), cy = 2 + Math.floor(hash2(v, n, 132) * 11), w = 3 + (n % 2);
            fill(x, '#a8a294', cx, cy, w, 2); fill(x, '#c4beb0', cx, cy, w - 1, 1); fill(x, '#7a7466', cx, cy + 2, w, 1);
            if (hash2(n, v, 133) < 0.5) px(x, cx + w - 1, cy, this.MEADOW[1][0]);
        }
    },
    /* heather and dry grass, its edge against the meadow ragged */
    heath(x, m, cs, v) {
        fill(x, '#8a9856'); speckle(x, ['#7c8a4c', '#9aa864'], 141 + v, 0.3); speckle(x, ['#cabf86'], 143 + v, 0.08);
        for (let n = 0; n < 4; n++) {
            const hx = 2 + Math.floor(hash2(n, v, 145) * 11), hy = 2 + Math.floor(hash2(v, n, 146) * 11);
            for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) {
                if (i * i / 9 + j * j / 4 > 1 + hash2(i, j, n + v) * 0.4) continue;
                px(x, clamp(hx + i, 0, 15), clamp(hy + j, 0, 15), j < 0 && i < 1 ? '#b88ac6' : j > 0 ? '#7c4e8c' : '#a072b0');
            }
        }
        const P = this.MEADOW[+cs[0]];
        for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
            let d = 99;
            if (m & 1) d = Math.min(d, j); if (m & 2) d = Math.min(d, 15 - j); if (m & 4) d = Math.min(d, i); if (m & 8) d = Math.min(d, 15 - i);
            if (d < hash2(i, j, 147 + v) * 5) px(x, i, j, hash2(i, j, 148) < 0.2 ? P[1] : P[0]);
        }
    },
    /* the cart track: two ruts (one to a lane where it's two wide), grass at its edges and down the middle */
    track(x, m, cs, v) {
        fill(x, '#d6c292'); speckle(x, ['#c6ae80', '#e4d4a8'], 111 + v, 0.22); speckle(x, ['#ae9e80'], 113 + v, 0.04);
        const up = m & 1, dn = m & 2, lf = m & 4, rt = m & 8;
        const rut = y => { fill(x, '#e8dab4', 0, y - 1, 16, 1); fill(x, '#bca272', 0, y, 16, 1); };
        if (dn && !up) rut(9); else if (up && !dn) rut(6); else if (!up && !dn) rut(8); else { rut(4); rut(11); }
        const P = this.MEADOW[+cs[0]];
        for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
            let d = 99;
            if (!up) d = Math.min(d, j); if (!dn) d = Math.min(d, 15 - j); if (!lf) d = Math.min(d, i); if (!rt) d = Math.min(d, 15 - i);
            /* the hump between two lanes */
            if (dn && !up) d = Math.min(d, 15 - j + 1); if (up && !dn) d = Math.min(d, j + 1);
            if (d < 0.6 + hash2(i, j, 115 + v) * 2.4) px(x, i, j, hash2(i, j, 116 + v) < 0.25 ? P[3] : P[0]);
        }
    },
    forest(x, v) {
        fill(x, '#3e5a34'); speckle(x, ['#4c6a3e', '#334c2c'], 151 + v, 0.3);
        for (let n = 0; n < 3; n++) { const fx = 2 + Math.floor(hash2(n, v, 153) * 11), fy = 3 + Math.floor(hash2(v, n, 154) * 10); px(x, fx, fy, '#5c7e44'); px(x, fx - 1, fy - 1, '#5c7e44'); px(x, fx + 1, fy - 1, '#5c7e44'); px(x, fx, fy + 1, '#4c6a3e'); }
    },
    /* a dry-stone wall: rough stones laid without mortar, moss on top; a run north-south or east-west */
    drywall(x, m, cs, v) {
        this.meadow(x, cs, v, 0.5);
        const vert = (m & 3) || !(m & 12), hor = m & 12;
        const x0 = vert ? 3 : 0, x1 = vert ? (hor ? 16 : 13) : 16, y0 = hor && !vert ? 3 : (m & 1) ? 0 : 2, y1 = hor && !vert ? 13 : (m & 2) ? 16 : 14;
        const xs = hor && vert ? 0 : x0;
        fill(x, '#5e5a50', xs, y0, x1 - xs, y1 - y0);
        const cols = ['#b4ae9e', '#a09a8a', '#c8c2b2', '#8c8676'];
        for (let y = y0; y < y1; y += 3) for (let i = xs + ((y >> 1) % 2) * 2 - 2; i < x1; i += 4) {
            const a = Math.max(i, xs), b = Math.min(i + 3 + (hash2(i, y, 161 + v) < 0.4 ? 1 : 0), x1);
            if (b - a < 1) continue;
            const c = cols[Math.floor(hash2(i, y, 162 + v) * 4)];
            fill(x, c, a, y, b - a, 2); fill(x, shade(c, 0.25), a, y, b - a, 1);
        }
        for (let n = 0; n < 4; n++) px(x, xs + Math.floor(hash2(n, v, 163) * (x1 - xs)), y0 + Math.floor(hash2(v, n, 164) * (y1 - y0)), '#7a9a48');
    },
    /* the mill's dressed stone: big blocks, mortared, moss in the joints */
    racewall(x, v) {
        fill(x, '#9c968a');
        for (let y = 0; y < 16; y += 5) {
            fill(x, '#6e6a62', 0, y, 16, 1); fill(x, '#b8b2a4', 0, y + 1, 16, 1);
            const off = ((y / 5) % 2) * 5 + (v % 2) * 2;
            for (let i = off; i < 16; i += 9) fill(x, '#6e6a62', i, y, 1, 5);
        }
        speckle(x, ['#7a8a4a', '#8a8478'], 171 + v, 0.05);
    },
    /* the mill pond's bed, run out: wet mud, puddles, weed, the odd shell */
    mud(x, v) {
        fill(x, '#7a6a4c'); speckle(x, ['#6a5a3e', '#84744e'], 181 + v, 0.3); speckle(x, ['#9a8a6a'], 183 + v, 0.05);
        if (v % 2 === 0) { fill(x, '#6e8ea4', 4 + v, 6, 6, 3); fill(x, '#6e8ea4', 5 + v, 5, 4, 5); px(x, 5 + v, 6, '#a8c8dc'); px(x, 6 + v, 6, '#a8c8dc'); }
        for (let n = 0; n < 3; n++) { const wx = 1 + Math.floor(hash2(n, v, 185) * 14), wy = 2 + Math.floor(hash2(v, n, 186) * 11); fill(x, '#5a7a3a', wx, wy, 1, 3); px(x, wx + 1, wy, '#6a8a44'); }
        if (v === 3) px(x, 11, 12, '#ece4d0');
    },
    tile(a, tx, ty) {
        const L = a.cell(tx, ty), p = L.p, v = Math.floor(hash2(tx, ty, 99) * 4);
        switch (p) {
            case 'grass': { const cs = this.corners(a, tx, ty); return tileCanvas(`drift2:grass:${cs}:${v}`, x => this.grass(x, cs, v)); }
            case 'flowers': { const cs = this.corners(a, tx, ty), k = this.bloom(tx, ty); return tileCanvas(`drift2:fl:${cs}:${v}:${k}`, x => this.flowers(x, cs, v, k)); }
            case 'tallgrass': { const cs = this.corners(a, tx, ty); return tileCanvas(`drift2:tall:${cs}:${v}`, x => this.tall(x, cs, v)); }
            case 'oldroad': { const cs = this.corners(a, tx, ty); return tileCanvas(`drift2:road:${cs}:${v}`, x => this.oldroad(x, cs, v)); }
            case 'heath': { const cs = this.corners(a, tx, ty), m = this.mask(a, tx, ty, c => c.k === 'grass' && c.p !== 'heath'); return tileCanvas(`drift2:heath:${m}:${cs[0]}:${v}`, x => this.heath(x, m, cs, v)); }
            case 'path': { const cs = this.corners(a, tx, ty), m = this.mask(a, tx, ty, c => c.p === 'path'); return tileCanvas(`drift2:track:${m}:${cs[0]}:${v}`, x => this.track(x, m, cs, v)); }
            case 'forest': return tileCanvas(`drift2:forest:${v}`, x => this.forest(x, v));
            case 'drywall': { const cs = this.corners(a, tx, ty), m = this.mask(a, tx, ty, c => c.p === 'drywall'); return tileCanvas(`drift2:wall:${m}:${cs}:${v}`, x => this.drywall(x, m, cs, v)); }
            case 'racewall': return tileCanvas(`drift2:race:${v}`, x => this.racewall(x, v));
            case 'mud': return tileCanvas(`drift2:mud:${v}`, x => this.mud(x, v));
        }
        return null;
    },
    /* over the ground: the old bridge's ends where the track meets the stream; under the mill pond while it's full, the
       drowned road and what stands on it; the grating the race goes under the mill by */
    ground(a, cx, cy) {
        if (HEADLESS) return;
        const at = (tx, ty) => [tx * T - cx, ty * T - cy], on = ([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40;
        for (const y of [18, 19]) {
            let [x, yy] = at(39, y);
            if (on([x, yy])) { Gfx.rect(x + 11, yy, 5, 16, '#8c8676'); Gfx.rect(x + 11, yy, 5, 1, '#c8c2b2'); Gfx.rect(x + 11, yy + 7, 5, 1, '#5e5a50'); Gfx.rect(x + 10, yy, 1, 16, '#5e5a50'); }
            [x, yy] = at(41, y);
            if (on([x, yy])) { Gfx.rect(x, yy, 5, 16, '#8c8676'); Gfx.rect(x, yy, 5, 1, '#c8c2b2'); Gfx.rect(x, yy + 7, 5, 1, '#5e5a50'); Gfx.rect(x + 5, yy, 1, 16, '#5e5a50'); }
        }
        const [sx, sy] = at(40, 18); if (on([sx, sy])) { Gfx.rect(sx + 3, sy + 11, 4, 3, '#7a7466'); Gfx.rect(sx + 3, sy + 11, 4, 1, '#a8a294'); Gfx.rect(sx + 9, sy + 20, 3, 2, '#7a7466'); }
        if (a.kind(37, 10).water) {
            Gfx.alpha(0.28);
            for (let tx = 35; tx <= 42; tx++) { const [x, y] = at(tx, 11); for (let i = 0; i < 4; i++) Gfx.rect(x + 1 + i * 4, y + 5 + (i % 2) * 3, 3, 2, '#1e3a5a'); }
            const [mx, my] = at(37, 10); Gfx.rect(mx + 4, my + 2, 8, 12, '#1e3a5a'); Gfx.rect(mx + 5, my + 1, 6, 1, '#1e3a5a');
            const [bx, by] = at(41, 10); Gfx.rect(bx + 2, by + 6, 12, 8, '#1e3a5a');
            Gfx.alpha(1);
            if ((G.t >> 5) % 4 === 0) { Gfx.alpha(0.5); Gfx.rect(mx + 3, my + 1, 10, 1, '#d8eef8'); Gfx.alpha(1); }
        }
        const [gx, gy] = at(44, 9);
        if (on([gx, gy])) { Gfx.rect(gx + 1, gy, 14, 7, '#2a3038'); for (let i = 2; i < 15; i += 3) Gfx.rect(gx + i, gy, 1, 7, '#8a8a90'); Gfx.rect(gx + 1, gy + 7, 14, 1, '#5e5a50'); }
    },
};
{
    const draw0 = TileDraw.draw;
    TileDraw.draw = function (area, tx, ty, sx, sy) {
        if (area.id === 'drift') { const c = DriftArt.tile(area, tx, ty); if (c) { Gfx.img(c, sx, sy); return; } }
        return draw0.call(this, area, tx, ty, sx, sy);
    };
}
/* a tree of the Drift's woods, not quite in line with the next */
SPAWN.drifttree = (tx, ty, p) => {
    const pr = SPAWN.tree(tx, ty, Object.assign({ deco: true }, p));
    pr.x += Math.round((hash2(tx, ty, 13) - 0.5) * 8); pr.y += Math.round((hash2(ty, tx, 14) - 0.5) * 6);
    return pr;
};

/* ---------- the old mill: a wheel on the race winds up the sluice in the dam of the pond below, but only while it
   turns, and it only turns while something floats past it on its own (nobody aboard: the paddles want the race's push).
   Out here a barrel goes down the race once, and that's all: it fetches up at the grating under the mill. Wound right up,
   the sluice's catch holds, and the pond runs out for good ---------- */
const DriftMill = {
    build(a) {
        if (!Progress.areaFlag('drift', 'millpond')) return;
        this.drainAll(a);
        if (!Progress.flag('drift_millpond')) Progress.set('drift_millpond');
        this.addStone(a);
    },
    drainAll(a) { const [x0, y0, w, h] = MILL.pond; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (a.kind(x, y).water) a.setCell(x, y, 'd'); },
    addStone(a) { if (!a.ents.some(e => e.milestone)) { const s = MILL.stone, e = SPAWN.deco(s.x, s.y, { look: s.look, text: s.text }); e.milestone = true; a.add(e); } },
};
class MillWheel extends Wheel {
    tick() {
        const [wx, wy] = this.watch, o = this.area.at(wx, wy), p = G.player;
        const turning = !!(o && o.floats && !o.paddled && !(p && p.area === this.area && p.ride === o));
        if (turning) { if (!this.turning) Sfx.play('click'); this.timer = this.time; this.ang += 0.09; }
        else if (this.timer > 0) { this.timer--; this.ang += 0.05 * this.timer / this.time; }
        this.turning = turning;
        this.on = this.timer > 0;
        if (this.on) Signals.set(this.area, this.sig);
    }
    get sortY() { return this.y + 22; }
    draw(cx, cy) {
        const x = (this.tx + 1) * T - cx, y = this.ty * T - cy + 4;
        /* the axle out of the mill's wall, the rim, the spokes and the paddles going round, the race slopping off them */
        Gfx.rect(x - 9, y - 2, 9, 4, '#4a2e1c');
        Gfx.circle(x, y, 15, '#3a2418'); Gfx.circle(x, y, 13, '#7a5030'); Gfx.circle(x, y, 11, '#3a2418');
        for (let i = 0; i < 8; i++) {
            const t = this.ang + i * Math.PI / 4, c = Math.cos(t), s = Math.sin(t);
            Gfx.line(x, y, x + c * 12, y + s * 12, '#9a6a3e');
            Gfx.rect(Math.round(x + c * 14) - 2, Math.round(y + s * 14) - 2, 4, 4, '#c08a52');
            Gfx.rect(Math.round(x + c * 14) - 2, Math.round(y + s * 14) - 2, 4, 1, '#e0b07a');
        }
        Gfx.circle(x, y, 4, '#3a2418'); Gfx.circle(x, y, 2, '#8a8a90');
        if (this.on && (G.t >> 2) % 2) { Gfx.alpha(0.8); Gfx.rect(x + 2, y + 13, 3, 1, '#ffffff'); Gfx.rect(x + 8, y + 10, 2, 2, '#d8f2fc'); Gfx.rect(x + 5, y + 15, 2, 1, '#d8f2fc'); Gfx.alpha(1); }
    }
}
SPAWN.millwheel = (x, y, p) => new MillWheel(x, y, p);

class MillSluice extends Ent {
    constructor(tx, ty, p = {}) { super('millsluice', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.lift = 0; this.open = false; this.drain = -1; }
    onAdd(a) { if (Progress.areaFlag('drift', 'millpond')) { this.open = true; this.lift = MILL.FULL; } }
    blocks(x, y) { return !this.open && x === this.tx && y === this.ty; }     /* (nothing floats out of the pond past it) */
    update() {
        const a = this.area;
        if (this.drain >= 0) { this.drainStep(a); return; }
        if (this.open) return;
        /* wound up while the wheel turns; its own weight lets it back down a notch at a time when it stops */
        if (Signals.get(a, 'millWheel')) this.lift = Math.min(MILL.FULL, this.lift + 1);
        else this.lift = Math.max(0, this.lift - 3);
        if (this.lift > 0 && this.lift % 90 === 0) Sfx.play('click', 0.4);
        if (this.lift >= MILL.FULL) this.release(a);
    }
    release(a) {
        this.open = true; this.drain = 0;
        Progress.setAreaFlag('drift', 'millpond'); Stats.count('secret:millpond');
        Sfx.play('unlock'); Sfx.play('splash'); G.shake = 10;
        G.pendingToast = 'Clank: the sluice\'s catch drops into its last notch and holds, and the mill pond starts to run out through it.';
    }
    /* the pond runs out from the sluice outward */
    drainStep(a) {
        this.drain++;
        if (this.drain % 6) return;
        const k = this.drain / 6, [x0, y0, w, h] = MILL.pond, [sx, sy] = MILL.sluice;
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (Math.abs(x - sx) + (sy - 1 - y) === k && a.kind(x, y).water) { a.setCell(x, y, 'd'); if ((x + y) % 2) Fx.splash(x * T + 8, y * T + 8); }
        if (k >= w + h) {
            this.drain = -1;
            Progress.set('drift_millpond'); DriftMill.addStone(a);
            Sfx.play('chime');
        }
    }
    get sortY() { return this.y + 16; }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, r = Math.round(Math.min(1, this.lift / MILL.FULL) * 13);
        /* the chain up to the mill, over the pond */
        for (let j = 8 * T - cy; j < y - 10; j += 3) Gfx.rect(x + 8 + (Math.round(j / 3) % 2), j, 1, 2, '#3a3030');
        /* the frame: two posts and a beam with the winding drum */
        Gfx.rect(x, y - 12, 2, 26, '#5a3a24'); Gfx.rect(x + 14, y - 12, 2, 26, '#5a3a24');
        Gfx.rect(x - 1, y - 13, 18, 3, '#7a5234'); Gfx.rect(x + 5, y - 15, 6, 4, '#3a2a20'); Gfx.rect(x + 6, y - 14, 4, 1, '#8a8a90');
        /* the water going under it, the more the higher it's wound */
        if (r > 0) {
            Gfx.rect(x + 2, y + 15 - r, 12, r, '#2e66b0');
            for (let i = 0; i < 3; i++) Gfx.rect(x + 3 + i * 4, y + 15 - r + ((G.t >> 1) + i * 3) % Math.max(1, r), 1, 2, '#d8f2fc');
        }
        /* the gate */
        const gy = y + 1 - r;
        Gfx.rect(x + 2, gy, 12, 14, '#8a5a32');
        for (let i = 0; i < 3; i++) Gfx.rect(x + 2 + i * 4, gy, 1, 14, '#6a4226');
        Gfx.rect(x + 2, gy + 3, 12, 2, '#4a4a52'); Gfx.rect(x + 2, gy + 10, 12, 2, '#4a4a52');
        Gfx.rect(x + 2, gy, 12, 1, '#b07a48');
    }
}
SPAWN.millsluice = (x, y, p) => new MillSluice(x, y, p);

SPAWN.driftmill = (tx, ty) => {
    const im = ART.drift_mill;
    const pr = new Prop(tx, ty, { im, solid: [], ox: -2, oy: 5 * T - im.height + 2 });
    pr.baseY = im.height - 2;
    pr.interact = () => { Script.run(function* () { yield* say(null, "The old mill. Its door has swollen tight in its frame; through a knot-hole there's only dust, and the millstones, still. A chain runs down from the wall into the pond, out to the sluice in the dam."); }); return true; };
    pr.talkBox = (pl, f) => f.ty === ty + 4 && f.tx >= tx && f.tx < tx + 6;
    return pr;
};

/* ---------- the fair's balloon, cut loose in Larkspur: it came down over here, snagged in a treetop by the old wall ---------- */
SPAWN.driftballoon = (tx, ty) => {
    const im = ART.drift_balloon;
    const pr = new Prop(tx, ty, { im, solid: [[0, 0]], ox: -48, oy: T - im.height });
    pr.baseY = im.height;
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('drift_balloon')) { yield* say(null, "The fair's balloon, snagged in the treetop. The basket creaks whenever the wind gets under it."); return; }
            yield* say(null, "The balloon from the fair! It came down out here, its envelope snagged over a treetop, the basket hanging just clear of the grass. CLOSED, it still says on the side.");
            yield* say(null, "You climb in. It sways, and holds. From up here you can see over the trees: the stream coming down past an old mill, a cottage with a garden, the old wall, and away west, hills and hills, further than anything goes in the Hollow.");
            const a = G.map, s = Stats.visited[a.id] = Stats.visited[a.id] || {};
            for (let y = 0; y < a.h; y += 4) for (let x = 0; x < a.w; x += 4) s[(x >> 2) + ',' + (y >> 2)] = 1;
            Progress.set('drift_balloon'); Stats.count('secret:balloon');
            UI.toast('The whole of the Drift, drawn on your map.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};

function initDriftArt() {
    const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    /* the Drift's trees: a wild oak, broad and lumpy; a yellower one; a rowan in berry */
    treeArt('tree_wild', { leaf: ['#5e9a40', '#78b450', '#9ccc68', '#3e7034'], bark: ['#8a6a52', '#6a5040', '#4a3828'] }, 11, { clumps: [[16, 13, 11], [8, 17, 7], [24, 16, 8], [11, 8, 7], [21, 7, 7], [16, 21, 8], [5, 12, 5]] });
    treeArt('tree_wild2', { leaf: ['#78a63e', '#92bc4e', '#b6d66a', '#527a30'], bark: ['#8a6a52', '#6a5040', '#4a3828'] }, 23, { clumps: [[15, 14, 10], [24, 12, 7], [8, 15, 7], [17, 6, 7], [10, 21, 6], [22, 20, 7]] });
    treeArt('tree_rowan', { leaf: ['#4e8a3c', '#68a44a', '#8cc062', '#346a30'], bark: ['#b4b2a8', '#8a8a80', '#5e5e56'], fruit: '#d83a2a' }, 17, { clumps: [[16, 12, 9], [9, 15, 6], [23, 15, 6], [12, 7, 6], [20, 7, 6], [16, 19, 7]] });
    /* the mill: rubble-stone walls, a slate roof with a hoist hood on its front, a door boarded shut, two small windows */
    ART.drift_mill = paintSprite(100, 112, x => {
        /* the roof: back slope, ridge, front slope */
        R(x, '#4e5a68', 2, 6, 96, 64);
        for (let y = 8; y < 26; y += 3) { R(x, '#5a6676', 3, y, 94, 2); for (let i = 3 + (y % 2) * 4; i < 96; i += 8) R(x, '#46505e', i, y, 1, 2); }
        R(x, '#8a96a6', 2, 26, 96, 3); R(x, '#3a4450', 2, 29, 96, 1);
        for (let y = 30; y < 68; y += 4) { R(x, '#6e7c8e', 3, y, 94, 3); R(x, '#7e8c9e', 3, y, 94, 1); for (let i = 2 + (y % 8 ? 0 : 5); i < 96; i += 10) R(x, '#56626e', i, y, 1, 3); }
        for (let n = 0; n < 40; n++) R(x, n % 3 ? '#7a9a4a' : '#5e7e3a', 4 + Math.floor(hash2(n, 1, 201) * 90), 8 + Math.floor(hash2(1, n, 202) * 58), 2, 1);
        /* the hoist hood on the roof's front, its beam and rope */
        R(x, '#c8b494', 62, 40, 20, 28); R(x, '#a8946c', 62, 40, 2, 28); R(x, '#5a4a3a', 66, 50, 12, 16);
        R(x, '#6e7c8e', 59, 34, 26, 7); R(x, '#8a96a6', 59, 34, 26, 2);
        R(x, '#6a4a30', 70, 44, 4, 4); R(x, '#d8c8a0', 72, 48, 1, 14); R(x, '#c8a868', 69, 62, 7, 6); R(x, '#a8884c', 69, 66, 7, 2);
        /* under the eaves */
        R(x, '#3a3440', 2, 70, 96, 3);
        /* the front wall: rubble stone */
        R(x, '#8a8070', 2, 73, 96, 39);
        for (let y = 73; y < 110; y += 4) for (let i = 2 + ((y >> 2) % 2) * 3; i < 98; i += 6 + Math.floor(hash2(i, y, 203) * 3)) {
            const c = ['#bdb3a0', '#a89e8a', '#d0c8b6', '#b2a892'][Math.floor(hash2(i, y, 204) * 4)];
            R(x, c, i, y, 5, 3); R(x, shade(c, 0.2), i, y, 5, 1);
        }
        R(x, '#6a6050', 2, 108, 96, 4);
        /* the door, boarded */
        R(x, '#3a2a20', 40, 84, 20, 26); R(x, '#7a5434', 42, 86, 16, 24);
        for (let i = 42; i < 58; i += 4) R(x, '#6a4428', i, 86, 1, 24);
        R(x, '#9a6c44', 40, 92, 20, 3); R(x, '#9a6c44', 40, 102, 20, 3);
        for (let i = 0; i < 16; i++) R(x, '#8a6038', 42 + i, 106 - i, 2, 2);
        R(x, '#4a4a52', 44, 93, 1, 1); R(x, '#4a4a52', 55, 103, 1, 1);
        /* the windows */
        for (const wx of [14, 76]) { R(x, '#e8e0d0', wx - 1, 80, 12, 12); R(x, '#2e2a30', wx, 81, 10, 10); R(x, '#e8e0d0', wx + 4, 81, 2, 10); R(x, '#e8e0d0', wx, 85, 10, 2); R(x, '#5a6a7a', wx + 1, 82, 3, 3); }
        /* moss and weed where the wall meets the ground */
        for (let n = 0; n < 30; n++) R(x, n % 2 ? '#6a8a3e' : '#7a9a4a', 2 + Math.floor(hash2(n, 3, 205) * 94), 104 + Math.floor(hash2(3, n, 206) * 6), 2, 1);
    });
    /* the milestone on the drowned road */
    ART.drift_milestone = paintSprite(16, 24, x => {
        R(x, '#8a8476', 3, 6, 10, 18); R(x, '#a8a294', 4, 4, 8, 19); R(x, '#a8a294', 5, 3, 6, 1); R(x, '#c4beb0', 4, 4, 3, 18);
        R(x, '#5e5a50', 6, 9, 1, 4); R(x, '#5e5a50', 9, 9, 1, 4); R(x, '#5e5a50', 6, 11, 4, 1);
        R(x, '#5e5a50', 6, 15, 4, 1); R(x, '#5e5a50', 9, 16, 1, 2); R(x, '#5e5a50', 6, 18, 4, 1);
        R(x, '#5a8a3a', 3, 20, 2, 4); R(x, '#5a8a3a', 11, 19, 2, 5); R(x, '#6a9a44', 7, 21, 1, 3); R(x, '#4a7a30', 4, 22, 8, 2);
    });
    /* the fair's balloon, its envelope fallen in over a treetop, the ropes down to its basket */
    ART.drift_balloon = paintSprite(64, 84, x => {
        const S = ['#e8463c', '#f7d64a', '#4f9be0'];
        /* the envelope, slack, draped: stripes running down its folds */
        for (let j = 0; j < 22; j++) {
            const w = 30 - Math.abs(j - 9) * 1.2, x0 = Math.round(26 + Math.sin(j / 3) * 2);
            for (let i = 0; i < w; i++) { const k = Math.floor((i + (j > 12 ? j - 12 : 0)) / 5) % 3; R(x, j % 4 === 3 && i % 7 === 0 ? shade(S[k], -0.3) : S[k], x0 + i, 26 + j, 1, 1); }
        }
        R(x, '#c43a32', 30, 47, 18, 2); R(x, '#f7d64a', 44, 44, 6, 3);
        /* the ropes */
        for (let j = 0; j < 20; j++) { R(x, '#6a5040', 46 + Math.round(j * 0.15), 48 + j, 1, 1); R(x, '#6a5040', 56 + Math.round(j * 0.2), 46 + j, 1, 1); }
        /* the basket: wicker, a rim, CLOSED on a board */
        R(x, '#7a5228', 47, 68, 17, 3); R(x, '#c8964a', 48, 71, 15, 12); R(x, '#a8763a', 48, 82, 15, 2);
        for (let j = 72; j < 82; j += 2) for (let i = 48 + (j % 4 === 0 ? 0 : 2); i < 63; i += 4) R(x, '#e4b870', i, j, 2, 1);
        R(x, '#f0e6d0', 50, 75, 11, 4); R(x, '#c42b4a', 51, 76, 9, 2);
    });
}
CONTENT_INIT.push(initDriftArt);
