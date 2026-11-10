/* Past the fog: the Drift. With her own thread cut, Wren can walk into the fog at the Frayed Edge and out the other
   side, into the wide world, where nothing has a thread and nothing comes back: no hearts (nothing to unravel), no
   falling home (you climb out where you fell), a map that's blank until you walk it. Linnet lives out here, in a
   cottage with a garden. Meeting her, Wren's gone-ness reaches Gran: the Great Pull begins (src/75_greatspool.js). */

const DRIFT_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    '..............."............,........"..~...........^.......%%%%',
    '..YYYYYYYY...,......,,..,,..YYYYYYYY....~...........^.......%%%%',
    '..YYYYYYYY..,........,......YYYYYYYY..".~.,.......",,.",..."%%%%',
    '..YYYYYYYY......,,....,.....YYYYYYYY....~...........^.......%%%%',
    '..YYYYYYYY..................YYYYYYYY,...~...........^"......%%%%',
    '..YYYYYYYY......,.,...,.....YYYYYYYY....~."...."....^,..,...%%%%',
    ',.YYYYYYYY".,........,......YYYYYYYY....~.,.........^.......%%%%',
    '..YYYYYYYY......,..........,YYYYYYYY.,..~.".......,,........%%%%',
    '..YYYYYYYY,....,..".........."..........~.,......,..^.......%%%%',
    '..."....,..............,......"...,.....~.....,.....^.".....%%%%',
    '..............XXXXXXXX..................~.....,..,.,^.......%%%%',
    '"..........".,XXXXXXXX..................~.,"........^.....,.%%%%',
    '........"...,.XXXXXXXX....,.......".....~.,.............,...%%%%',
    '..............XXXXXXXX.......,....."....~.....,.....^.,.....%%%%',
    '..............XXXXXXXX...........,....."~........,.,^,...,..%%%%',
    '.................:........,,............~...".......^.......%%%%',
    '::::::::::::::::::::::::::::::::::::::::~:::::::::::::::::::%%%%',
    '::::::::::::::::::::::::::::::::::::::::~:::::::::::::::::::%%%%',
    '...........,,,,,,,,,,,,,,,....,.........~...........^......,%%%%',
    '...........,,,,,,,,,,,,,,,,.............~.........".^.......%%%%',
    '...........,,,,,,,,,,,,,,,.,."..........~.,.........^"...,..%%%%',
    '..,........,,,,,,,,,,,,,,,..............~...."......^...."..%%%%',
    '...........,,,,,,,,,,,,,,,.,............~...YYYYYYY.........%%%%',
    '......"....,,,,,,,,,,,,,,,.....,...."...~.,.YYYYYYY.^.......%%%%',
    '....,.....,...............".......,.....~...YYYYYYY.^.......%%%%',
    '....YYYYYYYYY.............YYYYYYYYY.....~...YYYYYYY.^.".....%%%%',
    ',.,.YYYYYYYYY.............YYYYYYYYY.."".~...YYYYYYY.^....,..%%%%',
    '....YYYYYYYYY.............YYYYYYYYY....,~.,.YYYYYYY.........%%%%',
    '....YYYYYYYYY.............YYYYYYYYY.,,..~...YYYYYYY"^.....,.%%%%',
    '....YYYYYYYYY...,.........YYYYYYYYY.,..,~...YYYYYYY.^.......%%%%',
    '....YYYYYYYYY.............YYYYYYYYY.....~...YYYYYYY.^.....,.%%%%',
    ',...YYYYYYYYY.............YYYYYYYYY.,...~...YYYYYYY.^.......%%%%',
    '....YYYYYYYYY.............YYYYYYYYY,....~................,..%%%%',
    '....YYYYYYYYY..........."..........,....~..,."..,...^.......%%%%',
    '..............................,".".,....~...,......,^.......%%%%',
    '...."..............,...............,....~......"".,.^.......%%%%',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY%%%%',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY%%%%',
];

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
    rows: DRIFT_ROWS, legend: OW_LEGEND,
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

/* the Drift's woods: every 2x2 of forest is a tree, as in the Hollow */
for (let y = 0; y < DRIFT_ROWS.length - 1; y += 2) for (let x = (y / 2) % 2; x < DRIFT_ROWS[0].length - 1; x += 2) {
    const R = DRIFT_ROWS;
    if (R[y][x] === 'Y' && R[y + 1][x] === 'Y' && R[y][x + 1] === 'Y' && R[y + 1][x + 1] === 'Y') AREAS.drift.ents.push({ k: 'tree', x, y, look: ['birch', 'tree', 'tree2'][Math.floor(hash2(x, y, 7) * 3)], deco: true });
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
