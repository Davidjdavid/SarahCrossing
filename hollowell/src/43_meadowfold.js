/* Meadowfold (overworld block 1,2): fields south of town, sheep, the windmill, the Tidyhouse, the canyon
   road west to Kilnridge (a boulder only Gloves can shift) and the broken bridge east to Millwater. */

const MEADOW_ROWS = [
        'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY::::YYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
        'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY::::YYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
        'YYYY......,...."".,."...."....::::.,"....".".....-~~~-....,.YYYY',
        'YYYY.."...,.....,...,.,,..T.",::::.bbbbb,....,...-~~~-......YYYY',
        'YYYY,.T,,...,.............,...::::....,".........-~~~-."...,YYYY',
        'YYYY"...,........"............::::..,......",....-~~~-.T....YYYY',
        'YYYY....,...,....".XXX......,.::::..T..,...."....-~~~-."....YYYY',
        'YYYY....,...,".....XXX..",....::::".,....,"......-~~~-..."..YYYY',
        'YYYY,..,,.T........XXX".,...",::::......XXXXXXXXX-~~~-....,.YYYY',
        'YYYY......,...................::::."..".XXXXXXXXX-~~~-......YYYY',
        'YYYY..."..,.".......,......"..::::.,.,..XXXXXXXXX-~~~-,.....YYYY',
        'YYYY...............,..."......::::".....XXXXXXXXX-~~~-......YYYY',
        'YYYY.....,......,....,".T.....::::.."...XXXX:XXXX-~~~-...T..YYYY',
        'YYYY............,,............::::...,.."..:::...-~~~-......YYYY',
        'YYYY..,.,.bbbbbb...,........r.::::..,..."..:::.".-~~~-......YYYY',
        'YYYY........."".,,...........,::::.,.".....:::...-~~~-.r....YYYY',
        'YYYY.r......".........."".....::::...,.....:::...-~~~-....,.YYYY',
        'YYYY........,...",..."........::::.........:::...-~~~-......YYYY',
        'YYYY..........T..............,:::::::::::::::::::-~~~-......YYYY',
        'YYYY"...".........,.,.........:::::::::::::::::::-~~~-......YYYY',
        '########................."....::::...............-~~~-..T...YYYY',
        '####::##,........,...,........::::...............-~~~-......YYYY',
        '####::##::::::::::::::::::::::::::......T,.....".-~~~-......YYYY',
        '::::::::::::::::::::::::::::::::::.......,.."....-~~~-,.....YYYY',
        '########........,.,.....,.....::::,.....,........-~~~-......YYYY',
        '########..............r...."..::::...."...,.,....-~~~-......YYYY',
        'YYYY"".."...,."..,.,..."......:::::::::::::::::::_~~~_::::::::::',
        'YYYY....fffff.fffff,........".:::::::::::::::::::_~~~_::::::::::',
        'YYYY....l......"."l.,..................,.........-~~~-...".,YYYY',
        'YYYY....l.........l.........................,....-~~~-......YYYY',
        'YYYY..T.l.,.".....l."...-----"..............,."r.-~~~-..."..YYYY',
        'YYYY.,..l.........l....-~~~~~-.."....."....,.....-~~~-......YYYY',
        'YYYY....l,......,.l....-~~~~~-.",....T..,".......-~~~-...T..YYYY',
        'YYYY....l....."...l..,.-~~~~~-,....,.......,T....-~~~-.,..."YYYY',
        'YYYY..,.fffffffffff.....~~~~~..,.......,.........-~~~-."....YYYY',
        'YYYY..".........,........"....".".....r....."..."-~~~-.."...YYYY',
        'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY-~~~-YYYYYYYYYY',
        'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY%%%%%YYYYYYYYYY',
        '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
        '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
];

defBlock({
    id: 'meadow', bx: 1, by: 2, name: 'Meadowfold', theme: 'meadow', music: 'meadow',
    rows: MEADOW_ROWS,
    forest: ['tree', 'tree2', 'tree_apple', 'tree'],
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
        { k: 'critter', who: 'sheep', look: 'sheep', x: 10, y: 29, speed: 0.3, route: [[10, 29, 120], [14, 31, 90], [11, 32, 150]] },
        { k: 'critter', who: 'sheep', look: 'sheep', x: 16, y: 30, speed: 0.3, route: [[16, 30, 150], [12, 29, 100], [15, 32, 80]] },
        { k: 'critter', who: 'sheep', look: 'sheep', x: 12, y: 32, speed: 0.25, route: [[12, 32, 200], [16, 28, 120]] },
        { k: 'enemy', x: 10, y: 10, type: 'nibbler' }, { k: 'enemy', x: 25, y: 18, type: 'nibbler' }, { k: 'enemy', x: 56, y: 9, type: 'nibbler' },
        { k: 'enemy', x: 38, y: 33, type: 'nibbler' },
    ],
    regions: [
        { name: 'Canyon Road', x: 0, y: 19, w: 8, h: 8, quiet: true },
    ],
});

PEOPLE_DEF.pip = { name: 'Pip', col: '#c8e66a', look: { body: 'child', hair: 'cap', hairC: '#c9925a', top: '#8fd46a', accent: '#f4e6c8', bottom: '#6b4128', skin: 'tan' } };
TALK.pip = function* () {
    if (Progress.flag('d2')) { yield* say('pip', cycle('pip2', ["The sheep came home early today. All three, straight to their spots, before I'd even called. Good sheep.", "Did you go up the canyon? Mum says nobody's been up there in ages. She says it like it's a rule.", "I tried to teach the sheep a new spot. They looked at me like I'd said something rude."])); return; }
    if (Progress.flag('d1')) { yield* say('pip', cycle('pip1', ["You came out of the Tidyhouse! Was it clean? I bet it was clean.", "There's a big boulder in the canyon, west of the pen. Been there since before Grandad. Somebody with a good grip could shift it, maybe.", "A Knot! Can I see it? ...It looks like a knot."])); return; }
    yield* firstThen('pip', "I'm Pip. I mind the sheep. Well, the sheep mind themselves, mostly. Wander off, wander back. Same three spots, every day, forever.",
        ["See that hay bale under the big tree? It got moved in a storm years ago and it never went back. Gives me the shivers.", "Count them every night: same three sheep. Never one more, never one less. Restful, that.", "The Tidyhouse is just east. My mum says it's the oldest house in the Hollow. It's always so clean."]);
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
