/* Meadowfold (overworld block 1,2): fields south of town, sheep, the windmill, the Tidyhouse, the canyon
   road west to Kilnridge (a boulder only Gloves can shift) and the broken bridge east to Millwater. */

const MEADOW_ROWS = [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY::::YYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY::::YYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
    'YYYY......,.yyyyyyyyyyyyyyyy.g::::.,"....".".....-~~~-....,.YYYY',
    'YYYY.."...,.yyyyyyyy.yyyyyTy"g::::gbbbbb,....,...R~~~-......YYYY',
    'YYYY,.T,,...yyyyyyy...yyyyyy.g::::....,".........R~~~-."...,YYYY',
    'YYYY"...,...yyyyyyy...yyyyyy.g::::g.,......",....R~~~-.T....YYYY',
    'YYYY....,...,....".XXX......,.::::g.T..,...."....R~~~-."....YYYY',
    'YYYY....,...,".....XXX..",...g::::g.,....,"......R~~~-..."..YYYY',
    'YYYY,..,,.T........XXX".,..."g::::g.....XXXXXXXXXR~~~-....,.YYYY',
    'YYYY........yyyyyyy...yyyyyy.g::::."..".XXXXXXXXX-~~~-......YYYY',
    'YYYYWWWWWWWWWWWWWWW.,......".g::::.,.,..XXXXXXXXX-~~~R,.....YYYY',
    'YYYYW.............W,...".....g::::g.....XXXXXXXXX-~~~R......YYYY',
    'YYYYW.............W..,".T.....::::g."...XXXX:XXXX-~~~R...T..YYYY',
    'YYYYW....WWWWW....W...........::::g..,.."..:::...-~~~R......YYYY',
    'YYYYW....W...W....W,........rg::::..,..."..:::.".-~~~R......YYYY',
    'YYYYW....WW.WW....W..........g::::g,.".....:::...-~~~R.r....YYYY',
    'YYYYW.............W....""....g::::g..,.....:::...-~~~-....,.YYYY',
    'YYYYW.............W.."........::::.........:::...-~~~-......YYYY',
    'YYYYWWWWWWW.WWWWWWW..........,:::::::::::::::::::-~~~-......YYYY',
    'YYYY................,.........:::::::::::::::::::-~~~-......YYYY',
    '########................."....::::...............-~~~-..T...YYYY',
    '####::##,........,...,........::::...............-~~~-......YYYY',
    '####::##::::::::::::::::::::::::::......T,.....".-~~~-......YYYY',
    '::::::::::::::::::::::::::::::::::.......,.."....-~~~-,.....YYYY',
    '########........,.,.....,.....::::,.....,........-~~~-......YYYY',
    '########..............r...."..::::...."...,.,....-~~~-......YYYY',
    'YYYY"".."...,."..,.,..."......:::::::::::::::::::_~~~_::::::::::',
    'YYYY....fffff.fffff,........".:::::::::::::::::::_~~~_::::::::::',
    'YYYY....l......"."l.,..................,.........-~~~-...".,YYYY',
    'YYYY....l.........l......RRR................,....R~~~-......YYYY',
    'YYYY..T.l.,.".....l."...R~~~-...............,."r.R~~~R..."..YYYY',
    'YYYY.,..l.........l....R~~~~~R.."....."....,.....R~~~R......YYYY',
    'YYYY....l,......,.l....-~~~~~-.",....T..,".......R~~~R...T..YYYY',
    'YYYY....l....."...l..,.R~~~~~-.....,.......,T....R~~~R.,..."YYYY',
    'YYYY..,.fffffffffff.....-~~~R..,.......,.........-~~~R."....YYYY',
    'YYYY..".........,........RR.....".....r....."..."-~~~-.."...YYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY%%%%%YYYYYYYYYY',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
];

defBlock({
    id: 'meadow', bx: 1, by: 2, name: 'Meadowfold', theme: 'meadow', music: 'meadow', owArt: true, soft: 4,
    rows: MEADOW_ROWS,
    forest: ['tree', 'tree2', 'tree_apple', 'tree'],
    legend: {
        /* (Meadowfold's own: dry-stone walls, hedgerows, wheat, reeds in the shallows) */
        'W': { k: 'fence', p: 'drystone' },
        'g': { k: 'tree', p: 'hedgerow' },
        'y': { k: 'grass', p: 'wheat' },
        'R': { k: 'shallow', p: 'reeds' },
    },
    /* the canyon's walls are Kilnridge's red rock */
    themeAt: (lx, ly) => lx <= 7 && ly >= 20 && ly <= 25 && MEADOW_ROWS[ly][lx] === '#' ? 'kiln' : null,
    ents: [
        { k: 'building', x: 40, y: 8, w: 9, h: 5, door: 4, art: 'tidyhouse' },
        { k: 'warp', x: 44, y: 12, to: 'tidy', tx2: 29, ty2: 42, face: 'up', dir: 'up' },
        { k: 'windmill', x: 19, y: 6 },
        { k: 'sign', x: 34, y: 17, text: 'East: the Tidyhouse. (Please wipe your feet.) Further east: the old bridge to Millwater.' },
        { k: 'sign', x: 29, y: 21, text: 'West: Canyon Road, to Kilnridge.' },
        { k: 'sign', x: 47, y: 25, text: 'BRIDGE OUT. Hook on, if you have a hook.' },
        { k: 'sign', x: 34, y: 2, text: 'MEADOWFOLD. Mind the sheep. The sheep mind you.' },
        { k: 'rest', x: 38, y: 15 },
        { k: 'eyelet', x: 55, y: 27 }, { k: 'eyelet', x: 47, y: 26 },
        { k: 'block', x: 4, y: 23, look: 'boulder_big', id: 'canyonBoulder', weight: WEIGHT.heavy, if: '!kilnPass', pushLine: '' },
        { k: 'block', x: 4, y: 22, look: 'boulder_big', id: 'canyonBoulder2', weight: WEIGHT.heavy, if: 'kilnPass' },
        { k: 'stray', x: 36, y: 30, look: 'haybale_stray', id: 'strayBale' },
        { k: 'linnetnote', x: 36, y: 30, note: 2, under: 'strayBale' },
        { k: 'pickup', x: 20, y: 4, what: 'heartpatch', id: 'meadowPatch' },
        { k: 'npc', who: 'pip', x: 13, y: 26, face: 'down' },
        /* Pip's flock: they wander a step and come home, all day */
        { k: 'sheep', x: 10, y: 29, id: 'penSheep1', grazes: true }, { k: 'sheep', x: 16, y: 30, id: 'penSheep2', grazes: true, face: 'right' }, { k: 'sheep', x: 12, y: 32, id: 'penSheep3', grazes: true },
        /* the Old Fold: three counting stones that count sheep coming home; Nettle's place by the gate; Old Tup asleep in the
           bothy's doorway since before Pip was born (a ring would wake him) */
        { k: 'sheep', x: 6, y: 16, id: 'nettle', talk: "Nettle, it says on the tag in her ear. She has a look about her as if she's been counting something and lost her place." },
        { k: 'tally', x: 14, y: 14, n: 1, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 15, y: 14, n: 1, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 16, y: 14, n: 1, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 17, y: 14, n: 1, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 11, y: 11, n: 2, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 11, y: 12, n: 2, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 5, y: 14, n: 3, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 6, y: 14, n: 3, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 7, y: 14, n: 3, group: 'fold', done: 'fold_counted' },
        { k: 'tally', x: 8, y: 14, n: 3, group: 'fold', done: 'fold_counted' },
        { k: 'chest', x: 17, y: 11, item: 'clapper', id: 'foldChest', hidden: true, when: 'flag:fold_counted' },
        { k: 'sign', x: 12, y: 19, text: "THE OLD FOLD. Built by Pip's great-grandad. Sheep counted home here every night for a hundred years." },
        { k: 'sheep', x: 12, y: 16, id: 'oldTup', ram: true, sleeper: true, tiedOff: true, startAt: [11, 15], trace: [[12, 16], [11, 16], [11, 15]], pushLine: "Old Tup, asleep in the bothy's doorway. Pip says he's been asleep there since before she was born. He snores like a gate.",
            talk: "Old Tup, the ram, asleep across the bothy's doorway. He is enormous, and he smells of rain." },
        { k: 'chest', x: 12, y: 14, item: 'heartpatch', id: 'bothyPatch' },
        { k: 'deco', x: 10, y: 14, look: 'tally_book', solid: [[0, 0]], oy: 2, text: "A tally book, on a shelf of stone. Every page, a column of little strokes: yan, tan, tethera, a sheep each, counted home. The last page is in a child's writing: GRANDAD SAYS THE STONES DO THE COUNTING AND HE JUST WRITES IT DOWN. I SAID THAT'S CHEATING. HE SAID THAT'S SHEPHERDING. - P." },
        /* Lucky: born over the river, and that's her place, so that's where she goes */
        { k: 'sheep', x: 55, y: 32, id: 'lucky', lamb: true, grazes: true, talk: "A lamb with a red cross dyed on her and LUCKY painted on her bell. She bleats at the river, and at you, and at the river again." },
        { k: 'enemy', x: 24, y: 13, type: 'nibbler' }, { k: 'enemy', x: 25, y: 18, type: 'nibbler' }, { k: 'enemy', x: 56, y: 9, type: 'nibbler' },
        { k: 'enemy', x: 40, y: 33, type: 'nibbler' },
    ],
    regions: [
        { name: 'Canyon Road', x: 0, y: 19, w: 8, h: 8, quiet: true },
    ],
});

PEOPLE_DEF.pip = { name: 'Pip', col: '#c8e66a', look: { body: 'child', hair: 'cap', hairC: '#c9925a', top: '#8fd46a', accent: '#f4e6c8', bottom: '#6b4128', skin: 'tan' } };
TALK.pip = function* () {
    /* S17: Lucky's place is on this side of the river now (the Needle) */
    const lucky = (Inv.stitches || []).find(r => r.area === 'hollow' && r.key === 'lucky');
    if (lucky && lucky.to[0] < 64 + 49 && !Progress.flag('s17')) {
        Progress.set('s17'); Stats.count('secret:lucky');
        yield* say('pip', "LUCKY! She's on our side! She's lying down on this side like it's her spot. It IS her spot. How did you DO that?");
        yield* say('pip', "Grandad said whoever brought her home was to have this. I always thought that would be me. I don't mind. Much.");
        yield* Story.getItem('heartpatch', 'luckyPatch')();
        return;
    }
    if (Progress.flag('s17')) { yield* say('pip', cycle('pip17', ["Lucky's home. She still shouts at the river, but now it's out of habit.", "I counted them tonight. Four. FOUR. I counted them three times."])); return; }
    const extra = [
        "See Lucky over the river? Born over there the spring of the big flood, and that's her spot now. She won't come over. She CAN'T come over. She just stands there and shouts at me.",
        Progress.areaFlag('hollow', 'woke:oldTup') ? "Old Tup's UP. A bell rang somewhere and he just got up and walked off, after all these years. Grandad would have cried." : "Old Tup sleeps in Grandad's bothy doorway, up in the Old Fold. He's been asleep there since before I was born. Grandad used to say a good bell would shift him.",
        Progress.flag('fold_counted') ? "You got the stones in the Old Fold to count! Nobody's done that since Grandad. He always said the counting was the stones' job, not his." : "Grandad counted the sheep home at the Old Fold every night. Yan, tan, tethera. He said the stones did the counting, really. I never knew what he meant.",
    ];
    if (Progress.flag('d2')) { yield* say('pip', cycle('pip2', ["The sheep came home early today. All three, straight to their spots, before I'd even called. Good sheep.", "Did you go up the canyon? Mum says nobody's been up there in ages. She says it like it's a rule.", "I tried to teach the sheep a new spot. They looked at me like I'd said something rude."].concat(extra))); return; }
    if (Progress.flag('d1')) { yield* say('pip', cycle('pip1', ["You came out of the Tidyhouse! Was it clean? I bet it was clean.", "There's a big boulder in the canyon, west of the pen. Been there since before Grandad. Somebody with a good grip could shift it, maybe.", "A Knot! Can I see it? ...It looks like a knot."].concat(extra))); return; }
    yield* firstThen('pip', "I'm Pip. I mind the sheep. Well, the sheep mind themselves, mostly. Wander off, wander back. Same three spots, every day, forever.",
        ["See that hay bale under the big tree? It got moved in a storm years ago and it never went back. Gives me the shivers.", "Count them every night: same three sheep. Never one more, never one less. Restful, that.", "The Tidyhouse is just east. My mum says it's the oldest house in the Hollow. It's always so clean."].concat(extra));
};
BUDGE.pip = 'Pip: "Baa. Sorry. Habit."';
CRITTER_TALK.sheep = () => function* () { yield* say(null, ['A sheep. It looks at you, chews, and looks away.', 'Baa.', "The sheep has a little red cross dyed into its fleece. So do all of them."][Math.floor(G.rng() * 3)]); };

/* the windmill: a stone tower with sails that turn */
class Windmill extends Ent {
    constructor(tx, ty) { super('windmill'); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T - 32; this.inert = false; this.solid = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]; this.staticBlock = true; }
    blocks(x, y) { return this.solid.some(([dx, dy]) => this.tx + dx === x && this.ty + dy === y); }
    get sortY() { return this.ty * T + 48; }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy;
        Gfx.img(ART.windmill, x, y - 40);
        /* sails */
        const hx = x + 24, hy = y - 22, a0 = G.t / 90;
        for (let i = 0; i < 4; i++) {
            const a = a0 + i * Math.PI / 2, ex = hx + Math.cos(a) * 28, ey = hy + Math.sin(a) * 28;
            Gfx.line(hx, hy, ex, ey, '#6b4128');
            const px = -Math.sin(a), py = Math.cos(a);
            for (let k = 8; k < 28; k += 2) { const sx = hx + Math.cos(a) * k, sy = hy + Math.sin(a) * k; Gfx.line(sx, sy, sx + px * 6, sy + py * 6, k % 4 ? '#f4e6c8' : '#d8c49e'); }
        }
        Gfx.circle(hx, hy, 3, '#6b4128'); Gfx.rect(hx - 1, hy - 1, 2, 2, '#c9925a');
    }
}
SPAWN.windmill = (x, y) => new Windmill(x, y);

/* Linnet's notes: found under strays, behind things, in places the Return can't reach */
const LINNET_NOTES = {
    1: { title: "A note behind Gran's portrait", text: "This is my Wander, my first day. Gran's turned my picture to the wall because she says I'll be back before it gets dusty. I'll turn it round myself when I get home. - L." },
    2: { title: 'A note under a hay bale', text: "Day three. This bale was in the way so I pushed it, and it DIDN'T GO BACK. A stray! Mabel says they're terribly rare. Someone cut its thread, she says, but who cuts a hay bale? I'm hiding this under it. - L." },
};
SPAWN.linnetnote = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.note, solid: [], oy: 2 });
    pr.baseY = -60; pr.inert = false;
    pr.update = () => { if (pr.under) { const b = pr.area.find(pr.under); pr.hiddenNow = b && b.tx === tx && b.ty === ty; } };
    pr.under = p.under;
    pr.draw = function (cx, cy) { if (!this.hiddenNow && !Progress.flag('linnet' + p.note)) { Gfx.img(ART.carvedL, this.x - cx, this.y - cy - 2); Gfx.img(this.im, this.x - cx + 4, this.y - cy + 2); } };
    pr.interact = () => {
        if (pr.hiddenNow || Progress.flag('linnet' + p.note)) return false;
        Script.run(function* () {
            Progress.set('linnet' + p.note); Progress.addNote('linnet' + p.note);
            Stats.count('secret:linnet');
            yield* say(null, 'Someone has carved a little "L." into the ground here. Tucked into the grass beside it, a folded note, yellow with age.');
            yield* say(null, '"' + LINNET_NOTES[p.note].text + '"');
            const n = Object.keys(LINNET_NOTES).filter(k => Progress.flag('linnet' + k)).length;
            yield* say(null, `(Notes found: ${n}.)`);
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
for (const [k, v] of Object.entries(LINNET_NOTES)) NOTES['linnet' + k] = { title: v.title, text: v.text };

function initMeadowArt() {
    ART.windmill = paintSprite(48, 88, x => {
        /* a stone tower, a door, a little window, a wooden cap */
        for (let j = 30; j < 88; j++) {
            const w = Math.round(14 + (j - 30) * 0.15);
            for (let i = 24 - w; i < 24 + w; i++) {
                const brick = (Math.floor((j - 30) / 5) + Math.floor((i + (Math.floor((j - 30) / 5) % 2) * 3) / 6)) % 2;
                x.fillStyle = (j - 30) % 5 === 4 ? '#8a7e70' : brick ? '#d6cab6' : '#c8bcac';
                if (i < 24 - w + 3) x.fillStyle = '#e8dcc8';
                if (i > 24 + w - 4) x.fillStyle = '#a89c8c';
                x.fillRect(i, j, 1, 1);
            }
        }
        x.fillStyle = '#7a4e32'; x.fillRect(19, 72, 10, 16); x.fillStyle = '#9a6438'; x.fillRect(20, 73, 8, 15);
        x.fillStyle = '#2a1f2d'; x.fillRect(21, 48, 6, 7); x.fillStyle = '#9fdcf5'; x.fillRect(22, 49, 4, 5);
        for (let j = 10; j < 32; j++) { const w = Math.round((j - 10) * 0.75); x.fillStyle = j < 14 ? '#e07a64' : '#c45a4a'; x.fillRect(24 - w, j, w * 2, 1); }
    });
    ART.boulder_big = ART.boulder;
    ART.note = paintSprite(8, 8, x => { x.fillStyle = '#f4e0a8'; x.fillRect(0, 1, 8, 6); x.fillStyle = '#d8c080'; x.fillRect(0, 4, 8, 1); x.fillStyle = '#8a7a5a'; x.fillRect(2, 2, 4, 1); });
    ART.carvedL = paintSprite(16, 16, x => { x.fillStyle = '#5a4a3a'; x.fillRect(4, 3, 2, 9); x.fillRect(4, 11, 6, 2); x.fillRect(11, 11, 2, 2); }, false);
    defSprite('haybale_stray', ['................', '................', '.kkkkkkkkkkkkkk.', 'kyyyyyyyyyyyyyyk', 'kYyyYyyYyyYyyYyk', 'kyyyyyyyyyyyyyyk', 'kUUUUUUUUUUUUUUk', 'kyyYyyYyyYyyYyyk',
        'kyyyyyyyyyyyyyyk', 'kYyyYyyYyyYyyYyk', 'kyyyyyyyyyyyyyyk', 'kUUUUUUUUUUUUUUk', 'kYYYYYYYYYYYYYYk', '.kkkkkkkkkkkkkk.', '................', '................'], { y: '#f0d070', Y: '#c8a040', U: '#9a6438' });
    defSprite('boulder_big', ['.....kkkkkk.....', '...kkggggggkk...', '..kggwwgggggGk..', '.kggwggggggggGk.', '.kgggggggggggGGk', 'kgggggggggggggGk', 'kggggggggggggGGk', 'kgGgggggggggGGGk',
        'kggGggggggggGGGk', 'kgggggggggGGGGGk', '.kGggggggGGGGGk.', '.kGGGgggGGGGGGk.', '..kGGGGGGGGGGk..', '...kkkGGGGkkk...', '......kkkk......', '................'], { g: '#b8aa98', G: '#8a7e70', w: '#e0d6c4' });
    defSprite('sheep_0', ['................', '................', '................', '................', '......kkkkk.....', '....kkwwwwwkk...', '...kwwwwwwwwwk..', '.kkkwwwwwrwwwk..',
        'kxxkwwwwrrrwwk..', 'kxexwwwwwrwwwk..', 'kxxkwwwwwwwwwk..', '.kk.kwwwwwwwk...', '....kxk..kxk....', '....kk....kk....', '................', '................'], { w: '#fbf6ea', x: '#4a4040', r: '#e8463c' });
    defSprite('sheep_1', ['................', '................', '................', '................', '......kkkkk.....', '....kkwwwwwkk...', '...kwwwwwwwwwk..', '.kkkwwwwwrwwwk..',
        'kxxkwwwwrrrwwk..', 'kxexwwwwwrwwwk..', 'kxxkwwwwwwwwwk..', '.kk.kwwwwwwwk...', '...kxk....kxk...', '...kk......kk...', '................', '................'], { w: '#fbf6ea', x: '#4a4040', r: '#e8463c' });
}
CONTENT_INIT.unshift(initMeadowArt);

/* ---------- sheep: marked like everything else (a red cross dyed in the fleece; a sheep's place is its spot). A sheep shies
   from Wren a step at a time, straight away from her (or along a wall, away from her side), so she can drive it; left
   alone it ambles home the way it was driven, back the way it came. Going home it pays her no mind (it waits behind her
   if she's in its way). A ram is heavy (he shoves a ewe aside on his way home); a lamb is light, and small. ---------- */
SFX.baa = (o, t) => { Audio.tone(o, t, 330, 0.1, 'p25', 0.07, { slide: 300 }); Audio.tone(o, t + 0.1, 300, 0.22, 'p25', 0.06, { slide: 280 }); };
class Sheep extends GridThing {
    constructor(tx, ty, p = {}) {
        super('sheep', tx, ty, Object.assign({ weight: p.ram ? WEIGHT.heavy : p.lamb ? WEIGHT.light : WEIGHT.medium, patience: 200 }, p));
        this.small = !!p.lamb; this.noPush = true; this.anim = 0; this.baaT = -99;
        this.dir = p.face === 'right' ? RIGHT : LEFT;
        this.look = p.look || (p.ram ? 'ram' : p.lamb ? 'lamb' : 'sheep');
    }
    onAdd(area) { super.onAdd(area); if (this.ret) { this.ret.color = '#e8463c'; this.ret.pace = 14; } }
    canPush() { return false; }
    /* a step away, if the ground's fit to stand on */
    step(d, quiet) {
        const a = this.area, nx = this.tx + DX[d], ny = this.ty + DY[d], k = a.kind(nx, ny);
        if (k.pit || k.deep || k.fog || k.clay || k.ledge) return false;
        if (!a.freeForThing(nx, ny, this)) return false;
        if (d === LEFT || d === RIGHT) this.dir = d;
        this.startMove(nx, ny, this.small ? 12 : 15);
        if (!quiet && G.t - this.baaT > 70) { this.baaT = G.t; Sfx.play('baa', 0.45); }
        return true;
    }
    tick() {
        if (this.mv) { this.anim++; return; }
        if (this.heldBy || this.carried || Return.asleep(this) || this.flying) return;
        if (this.ret && this.ret.state === 'returning') return;
        const p = G.player;
        if (!p || p.area !== this.area || p.state !== 'normal' || p.ride || p.pinned) return this.graze();
        const dx = this.tx * T + 8 - p.x, dy = this.ty * T + 8 - (p.y - 3);
        if (dx * dx + dy * dy > 21 * 21) return this.graze();
        const horiz = Math.abs(dx) >= Math.abs(dy);
        const pri = horiz ? (dx >= 0 ? RIGHT : LEFT) : (dy >= 0 ? DOWN : UP);
        const side = horiz ? dy : dx, tie = hash2(this.tx, this.ty, 17) < 0.5;
        const sec = horiz ? (side > 0 || (side === 0 && tie) ? DOWN : UP) : (side > 0 || (side === 0 && tie) ? RIGHT : LEFT);
        for (const d of [pri, sec, OPP[sec]]) if (this.step(d)) return;
    }
    /* now and then a sheep at home wanders a step and comes back (those that graze) */
    graze() {
        if (!this.grazes || !this.ret || this.ret.state !== 'home') return;
        const k = G.t + this.uid * 131;
        if (k % 420 !== 0) return;
        this.step(Math.floor(hash2(this.uid, Math.floor(k / 420), 31) * 4), true);
    }
    interact() {
        const s = this;
        Script.run(function* () { yield* say(null, s.talk ? (typeof s.talk === 'function' ? s.talk(s) : s.talk) : cycle('sheeptalk', ['A sheep. It looks at you, chews, and looks away.', 'Baa.', 'The sheep has a little red cross dyed into its fleece. So do all of them.'])); });
        return true;
    }
    sprite() { return spr(this.look + '_' + (this.mv ? Math.floor(this.anim / 5) % 2 : 0)); }
    draw(cx, cy) {
        const im = this.sprite(); if (!im) return;
        let shake = 0; const r = this.ret;
        if (r && r.state === 'away' && !Return.held(this) && r.timer < 30) shake = (G.t >> 1) % 2 ? 1 : -1;
        Gfx.alpha(0.22); Gfx.rect(this.px - cx + 3, this.py - cy + 13, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.img(im, this.px - cx + shake, this.py - cy - (im.height - T), this.dir === RIGHT);
    }
}
SPAWN.sheep = (x, y, p) => new Sheep(x, y, p);

/* ---------- the counting stones in the Old Fold: they count sheep coming home, in order (yan, tan, tethera) ---------- */
const TALLY_WORDS = ['yan', 'tan', 'tethera', 'methera', 'pip'];
class TallyStone extends FloorThing {
    constructor(tx, ty, p = {}) { super('tally', tx, ty, p); this.lit = false; this.prev = null; this.inert = false; }
    onAdd(area) { if (Progress.flag(this.done)) this.lit = true; }
    update() {
        const a = this.area, o = a.at(this.tx, this.ty);
        if (o !== this.prev && o && o.kind === 'sheep' && o.ret && o.ret.state === 'returning') this.counted(o);
        this.prev = o;
    }
    counted(o) {
        const a = this.area, all = a.ents.filter(e => e.kind === 'tally' && e.group === this.group);
        if (Progress.flag(this.done)) return;
        const st = a.tally = a.tally || {}, want = (st[this.group] || 0) + 1;
        if (this.n === want - 1) return;          /* (another stone of the band just counted) */
        if (this.n === want) {
            st[this.group] = want; for (const e of all) if (e.n === this.n) e.lit = true; Sfx.play('click');
            Fx.text(this.x + 8, this.y - 6, TALLY_WORDS[this.n - 1] + '!', '#fff4c0');
            if (!all.some(e => e.n > want)) { Progress.set(this.done); Sfx.play('appear'); Stats.count('secret:fold'); }
        } else {
            st[this.group] = 0; for (const e of all) e.lit = false;
            Sfx.play('unclick'); Fx.text(this.x + 8, this.y - 6, '...', PAL.grey2);
        }
    }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        Gfx.img(spr('tallystone'), x, y);
        /* its notches, one for each it counts for */
        for (let i = 0; i < this.n; i++) Gfx.rect(x + 5 + i * 2 - (this.n - 1), y + 6, 1, 4, this.lit ? '#fff4c0' : '#5a5250');
        if (this.lit) { Gfx.alpha(0.25 + 0.1 * Math.sin(G.t / 10)); Gfx.rect(x + 2, y + 3, 12, 10, '#fff4c0'); Gfx.alpha(1); }
    }
}
SPAWN.tally = (x, y, p) => new TallyStone(x, y, p);

/* the clapper of the old ringers' bell (Grandad brought it down off the Heights to call the flock in with) */
ITEMS.clapper = { name: "Ringers' clapper", kind: 'quest', desc: "An old bell's clapper, heavy as a fist. It came off a bell up on the Heights, Pip's grandad said." };
ITEM_LINES.clapper = () => "You found an old {blue}bell's clapper{/}, wrapped in sacking: a heavy iron tongue with a ring through the top. Somewhere there's a bell missing it.";

/* ---------- Meadowfold's look: lush grass with clover, drifts of wild flowers, hay meadow, hedgerows, dry-stone walls ---------- */
const MEADOW_BLOOMS = [['#e8463c', '#2a1f2d'], ['#6a8ae8', '#fbf6ea'], ['#f7d64a', '#e8a030'], ['#fbf6ea', '#f7d64a'], ['#f59ac0', '#fbf6ea']];
OWA.ground.meadow = {
    grass: {
        field: (tx, ty) => OWA.field(tx, ty, 23, 8, 5, -0.1),
        draw(x, th, v, fl) {
            const [g0, g1, g2, g3] = th.grass;
            fill(x, g0); speckle(x, [g1], 11 + v * 13, 0.12); speckle(x, [g2], 23 + v * 7, 0.05);
            for (let n = 0; n < 3; n++) { const bx = Math.floor(hash2(v, n, 3) * 14) + 1, by = Math.floor(hash2(n, v, 5) * 13) + 2; px(x, bx, by, g3); px(x, bx, by - 1, g1); px(x, bx + 1, by - 1, g3); }
            /* clover */
            if (v % 2) { const cx = 4 + v * 2, cy = 10 - v; px(x, cx, cy, '#5aa848'); px(x, cx + 1, cy, '#5aa848'); px(x, cx, cy + 1, '#5aa848'); px(x, cx + 1, cy - 1, '#78c060'); }
            /* wild flowers, thicker where the meadow's left long */
            for (let n = 0; n < [0, 1, 2, 4][fl]; n++) {
                const [pe, mi] = MEADOW_BLOOMS[Math.floor(hash2(v + fl * 3, n, 9) * MEADOW_BLOOMS.length)];
                const fx = 2 + Math.floor(hash2(n, v + fl, 1) * 12), fy = 2 + Math.floor(hash2(v + 3 + fl, n, 2) * 11);
                px(x, fx, fy, pe); px(x, fx + 1, fy, pe); px(x, fx, fy + 1, pe); px(x, fx + 1, fy + 1, mi); px(x, fx, fy + 2, g3);
            }
        },
    },
    flowers(x, th, v) {
        OWA.ground.meadow.grass.draw(x, th, v, 2);
        for (let n = 0; n < 2; n++) {
            const [pe, mi] = MEADOW_BLOOMS[Math.floor(hash2(v, n, 19) * MEADOW_BLOOMS.length)], fx = 3 + Math.floor(hash2(n, v, 11) * 9), fy = 3 + Math.floor(hash2(v + 5, n, 12) * 9);
            px(x, fx, fy - 1, pe); px(x, fx - 1, fy, pe); px(x, fx + 1, fy, pe); px(x, fx, fy + 1, pe); px(x, fx, fy, mi); px(x, fx, fy + 2, th.grass[3]);
        }
    },
    /* hay meadow: tall grass with seed heads, buttercups down in it */
    tallgrass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0); speckle(x, [g1], 31 + v, 0.1);
        for (let i = 0; i < 6; i++) {
            const bx = 1 + i * 2 + (i % 2), h = 7 + Math.floor(hash2(i, v, 4) * 5);
            for (let j = 0; j < h; j++) px(x, bx + (j > h - 3 ? 1 : 0), 15 - j, j > h - 2 ? '#d8d090' : j > h - 4 ? g2 : g1);
            px(x, bx, 15, g3);
        }
        if (v % 2) { px(x, 6, 12, '#f7d64a'); px(x, 7, 12, '#f7d64a'); }
    },
    /* the lanes: packed earth, a strip of grass up the middle where nobody treads */
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.14); speckle(x, [p2], 41 + v, 0.06);
        for (let n = 0; n < 2; n++) { const sx = Math.floor(hash2(v, n, 12) * 13) + 1, sy = Math.floor(hash2(n, v, 13) * 13) + 1; px(x, sx, sy, p1); px(x, sx + 1, sy, p1); px(x, sx, sy + 1, p2); }
        if (v === 2) { px(x, 7, 4, '#84c95a'); px(x, 8, 3, '#9adb6c'); px(x, 8, 10, '#84c95a'); }
    },
    forest(x, th, v) { fill(x, '#3e6a34'); speckle(x, ['#4a7a3e', '#32582c'], v + 9, 0.3); speckle(x, ['#6a9a4a'], v + 21, 0.05); },
    /* wheat, gold, nodding */
    wheat(x, th, v) {
        fill(x, '#c8a048'); speckle(x, ['#b89038', '#d8b058'], 61 + v, 0.25);
        for (let i = 0; i < 8; i++) {
            const bx = i * 2 + (v % 2), h = 9 + Math.floor(hash2(i, v, 64) * 4);
            for (let j = 0; j < h; j++) px(x, bx, 15 - j, j < h - 3 ? '#a88430' : '#e8c868');
            px(x, bx, 15 - h, '#f4dc88'); px(x, bx + 1, 16 - h, '#c8a048');
        }
    },
    /* reeds standing in the shallows */
    reeds(x, th, v) {
        const [w0, w1, w2] = th.water;
        fill(x, w0); speckle(x, [w1], 71 + v, 0.12);
        for (let i = 0; i < 5; i++) {
            const bx = 1 + i * 3 + (v % 2), h = 9 + Math.floor(hash2(i, v, 74) * 5);
            for (let j = 0; j < h; j++) px(x, bx, 15 - j, j > h - 4 ? '#8ab060' : '#5a8a40');
            if (i % 2) { fill(x, '#8a5a2a', bx, 16 - h - 2, 1, 3); }
            px(x, bx - 1, 14, w2);
        }
    },
};
OWA.cliffs.meadow = {
    face: (x, th, v, m) => OWA.rockFace(x, th, v, m, { blocks: true, band1: [0, 5, 10], band2: [0, 6, 11], moss: ['#6aa84a', '#8ac860'], seed: 7 }),
    top: (x, th, v, m) => OWA.rockTop(x, th, v, m, { topCol: '#b8ae9c', tuft: ['#5aa848', '#84c95a'], seed: 7 }),
};
/* a hedgerow: thick, round-topped, joined to its neighbours, hawthorn flowers and dog roses in it */
OWA.paint.hedgerow = {
    mask(a, tx, ty) { const h = (x, y) => a.cell(x, y).p === 'hedgerow'; return (h(tx, ty - 1) ? 'n' : '-') + (h(tx, ty + 1) ? 's' : '-') + (h(tx - 1, ty) ? 'w' : '-') + (h(tx + 1, ty) ? 'e' : '-'); },
    draw(x, th, v, m) {
        const n = m[0] === 'n', s = m[1] === 's', w = m[2] === 'w', e = m[3] === 'e';
        const [g0, g1, g2, g3] = ['#3e8a3e', '#56a44a', '#82c868', '#2a5e30'];
        OWA.ground.meadow.grass.draw(x, th, v, 0);
        const top = n ? 0 : 2, bot = s ? 16 : 13, l = w ? 0 : 1, r = e ? 16 : 15;
        for (let j = top; j < bot; j++) for (let i = l; i < r; i++) {
            const u = (i - 8) / 8, vv = (j - 7) / 8, edge = (!w && i < l + 1) || (!e && i > r - 2) || (!n && j < top + 1);
            const L = -u * 0.4 - vv * 0.9 + (hash2(i + v * 16, j, 81) - 0.5) * 0.9;
            px(x, i, j, edge ? g3 : L > 0.55 ? g2 : L > -0.1 ? g1 : L > -0.7 ? g0 : g3);
        }
        if (!s) { fill(x, '#2a5e30', l, bot - 1, r - l, 1); x.globalAlpha = 0.35; fill(x, '#1d3a22', l, bot, r - l, 2); x.globalAlpha = 1; }
        if (!n) fill(x, '#2a1f2d', l, top, r - l, 1);
        if (!w) fill(x, '#2a1f2d', 0, top, 1, bot - top);
        if (!e) fill(x, '#2a1f2d', 15, top, 1, bot - top);
        for (let k = 0; k < 3; k++) { const fx = 2 + Math.floor(hash2(v, k, 83) * 11), fy = top + 1 + Math.floor(hash2(k, v, 84) * (bot - top - 3)); px(x, fx, fy, k === 2 ? '#f59ac0' : '#fbf6ea'); px(x, fx + 1, fy, k === 2 ? '#f7d64a' : '#f4ecd8'); }
    },
};
/* a dry-stone wall: flat stones laid without mortar, a coping of upright stones, moss */
OWA.paint.drystone = {
    mask(a, tx, ty) { const h = (x, y) => a.cell(x, y).p === 'drystone'; return (h(tx, ty - 1) ? 'n' : '-') + (h(tx, ty + 1) ? 's' : '-') + (h(tx - 1, ty) ? 'w' : '-') + (h(tx + 1, ty) ? 'e' : '-'); },
    draw(x, th, v, m) {
        const n = m[0] === 'n', s = m[1] === 's', w = m[2] === 'w', e = m[3] === 'e';
        OWA.ground.meadow.grass.draw(x, th, v, 0);
        const vert = (n || s) && !(w || e);
        const l = vert && !w ? 3 : 0, r = vert && !e ? 13 : 16, top = vert ? 0 : 4, bot = vert ? 16 : 14;
        fill(x, '#7a7468', l, n ? 0 : top, r - l, (s ? 16 : bot) - (n ? 0 : top));
        for (let row = 0; row < 6; row++) {
            const y0 = (n ? 0 : top) + row * 3; if (y0 >= (s ? 16 : bot)) break;
            for (let i = l - (row % 2) * 2; i < r; i += 4 + ((i + row + v) % 2)) {
                const c = ['#b8b0a0', '#a8a090', '#c8c0b0', '#9a9284'][(i + row * 3 + v) % 4];
                fill(x, c, Math.max(l, i), y0, Math.min(3, r - Math.max(l, i)), 2);
                px(x, Math.max(l, i), y0, '#dcd4c4');
            }
        }
        /* coping stones on top and moss on them */
        if (!vert) { for (let i = 0; i < 16; i += 2) { fill(x, '#a8a090', i, top - 2, 1, 3); px(x, i, top - 2, '#d0c8b8'); } if (v % 2) { px(x, 3, top - 1, '#6aa84a'); px(x, 11, top, '#6aa84a'); } }
        if (!n && vert) fill(x, '#2a1f2d', l, 0, r - l, 1);
        if (!s) { fill(x, '#4a463e', l, (vert ? 16 : bot) - 1, r - l, 1); x.globalAlpha = 0.3; fill(x, '#1d2a1a', l, vert ? 15 : bot, r - l, 2); x.globalAlpha = 1; }
        if (vert) { if (!w) fill(x, '#2a1f2d', l - 1, 0, 1, 16); if (!e) fill(x, '#2a1f2d', r, 0, 1, 16); }
        else { if (!w) fill(x, '#2a1f2d', 0, top - 2, 1, bot - top + 2); if (!e) fill(x, '#2a1f2d', 15, top - 2, 1, bot - top + 2); }
    },
};

function initMeadowArt2() {
    ART.tally_book = paintSprite(14, 10, x => { x.fillStyle = '#7a4e32'; x.fillRect(0, 2, 14, 8); x.fillStyle = '#f4e6c8'; x.fillRect(1, 1, 12, 6); x.fillStyle = '#9a8a6a'; for (let i = 2; i < 12; i += 2) x.fillRect(i, 3, 1, 3); x.fillStyle = '#e8463c'; x.fillRect(11, 2, 1, 4); });
    defSprite('icon_clapper', ['................', '.......kk.......', '......kyyk......', '.......kk.......', '.......kxk......', '.......kxk......', '.......kxk......', '.......kxk......',
        '.......kxk......', '......kxxxk.....', '.....kxxxxxk....', '.....kxXxxxk....', '.....kxxxXxk....', '......kxxxk.....', '.......kkk......', '................'], { x: '#7a7468', X: '#4a463e', y: '#c9925a' });
    /* the ram: big, curly-horned, a black face */
    defSprite('ram_0', ['................', '.........kkkkk..', '.......kkwwwwwk.', '..kkk.kwwwwwwwwk', '.kyYyk.wwwwwrwwk', 'kyyYyykwwwwrrrwk', 'kyxxxyywwwwwrwwk', 'kxexxxkwwwwwwwwk',
        'kxxxxxkwwwwwwwwk', '.kxxxkkwwwwwwwk.', '..kkk..kwwwwwk..', '......kxk..kxk..', '......kxk..kxk..', '......kk....kk..', '................', '................'], { w: '#f0eadc', x: '#3a3436', r: '#e8463c', y: '#c8b88a', Y: '#9a8a62' });
    defSprite('ram_1', ['................', '.........kkkkk..', '.......kkwwwwwk.', '..kkk.kwwwwwwwwk', '.kyYyk.wwwwwrwwk', 'kyyYyykwwwwrrrwk', 'kyxxxyywwwwwrwwk', 'kxexxxkwwwwwwwwk',
        'kxxxxxkwwwwwwwwk', '.kxxxkkwwwwwwwk.', '..kkk..kwwwwwk..', '.....kxk....kxk.', '.....kxk....kxk.', '.....kk......kk.', '................', '................'], { w: '#f0eadc', x: '#3a3436', r: '#e8463c', y: '#c8b88a', Y: '#9a8a62' });
    /* a lamb: small and new */
    defSprite('lamb_0', ['................', '................', '................', '................', '................', '................', '.......kkkk.....', '.....kkwwwwk....',
        '..kk.kwwwrwwk...', '.kxxkwwwrrrwk...', '.kexkwwwwrwwk...', '..kk.kwwwwwk....', '.....kxk.kxk....', '.....kk..kk.....', '................', '................'], { w: '#fffbf0', x: '#4a4040', r: '#e8463c' });
    defSprite('lamb_1', ['................', '................', '................', '................', '................', '................', '.......kkkk.....', '.....kkwwwwk....',
        '..kk.kwwwrwwk...', '.kxxkwwwrrrwk...', '.kexkwwwwrwwk...', '..kk.kwwwwwk....', '....kxk...kxk...', '....kk....kk....', '................', '................'], { w: '#fffbf0', x: '#4a4040', r: '#e8463c' });
    /* a counting stone: flat, worn, set in the turf */
    defSprite('tallystone', ['................', '................', '...kkkkkkkkkk...', '..kggwwggggggk..', '.kgwggggggggGGk.', '.kggggggggggGGk.', '.kggggggggggGGk.', '.kggggggggggGGk.',
        '.kggggggggggGGk.', '.kgGGGGGGGGGGGk.', '..kGGGGGGGGGGk..', '...kkkkkkkkkk...', '................', '................', '................', '................'], { g: '#c8c0b0', G: '#9a9284', w: '#e8e0d0' });
}
CONTENT_INIT.push(initMeadowArt2);
/* the quilt counts Meadowfold's finds too (src/78c_polish.js) */
CONTENT_INIT.push(() => QUILT[0][1].push(() => Progress.flag('fold_counted'), () => Progress.areaFlag('hollow', 'chest:bothyPatch'), () => Progress.flag('s17')));
