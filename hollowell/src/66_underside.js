/* The Underside: under Hollowell, down the Staff stairs from the Inn. The Makers' own place: the Guild Hall (Gundry,
   who keeps the Well up top and the Guild down here), the workshops (each Maker's bench, and their logbook of your
   Wander, from what really happened: S22), the Seams (tunnels under the town with peepholes up into the houses, eight
   private moments: S23), and the big door to the Spoolworks (House 7). After the Spoolworks: Wren's apprentice cot,
   and the Making Floor (Tuck's Little Wander, src/68_makings.js). */

/* a filled rectangle on a sprite being painted */
const sq = (c, a, b, w, h, x) => { x.fillStyle = c; x.fillRect(a, b, w, h); };

const UNDER_ENTRY = { x: 29, y: 19 };     /* the foot of the Staff stairs */
const SPOOL_ENTRY = { x: 29, y: 31 };     /* inside the Spoolworks' gatehouse (src/67_spoolworks.js) */

defHouse({
    id: 'underside', name: 'The Underside', place: 'The Underside', theme: 'underside', thread: THREAD.guild, music: 'underside',
    entry: UNDER_ENTRY, quietName: false,
    legend: { 'H': { k: 'stairs', p: 'stairs' }, 'p': { k: 'wall', p: 'wall', ent: 'peephole' } },
    talk: {},
    cells: {
        /* ---------------- the Staff stairs: from the Inn, down ---------------- */
        '1,1': {
            name: 'The Staff Stairs',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#........H.........#',
                '####################',
            ],
            ents: [
                { k: 'warp', x: 9, y: 9, to: 'inn', tx2: 13, ty2: 3, face: 'down' },
                { k: 'sign', x: 11, y: 8, text: 'UP: THE INN. (Wipe your feet. Ives will know.) WEST AND EAST: THE SEAMS. NORTH: THE GUILD HALL.' },
                { k: 'deco', x: 2, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]], text: 'Racks of spools, every colour, labelled in a tiny hand: TIDYHOUSE, SPARE. KILN, SPARE. WREN, SPARE (RED).' },
                { k: 'deco', x: 16, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
            ],
        },
        /* ---------------- the Guild Hall ---------------- */
        '1,0': {
            name: 'The Guild Hall',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'warp', x: 9, y: 0, to: 'spoolworks', tx2: SPOOL_ENTRY.x, ty2: SPOOL_ENTRY.y, face: 'up', dir: 'up' },
                { k: 'deco', x: 8, y: 0, look: 'bigdoor', ox: -8, oy: -4, solid: false, baseY: -100 },
                { k: 'npc', who: 'gundry', x: 11, y: 3, face: 'down' },
                { k: 'deco', x: 3, y: 6, look: 'longtable', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0]], text: 'A long table scarred with a hundred years of knives and needles. Carved into it, among the initials: L.' },
                { k: 'deco', x: 13, y: 6, look: 'longtable', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0]] },
                { k: 'sign', x: 7, y: 1, text: 'THE SPOOLWORKS. Guild members only. (And Wanderers who have seen the strings.)' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'flag:d7', dir: 'v', id: 'ghMaking' },
                { k: 'bed', x: 1, y: 1, id: 'cot', look: 'cot', if: 'd7' },
            ],
        },
        /* ---------------- the workshops: each Maker's bench and logbook ---------------- */
        '0,0': {
            name: 'The Workshops',
            rows: [
                '####################',
                '#..#..#..#..#..#...#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'logbook', x: 1, y: 1, house: 'tidy' }, { k: 'logbook', x: 4, y: 1, house: 'kiln' }, { k: 'logbook', x: 7, y: 1, house: 'millrace' },
                { k: 'logbook', x: 10, y: 1, house: 'belfry' }, { k: 'logbook', x: 13, y: 1, house: 'slumber' }, { k: 'logbook', x: 16, y: 1, house: 'marionette' },
                { k: 'npc', who: 'ives', x: 2, y: 3, face: 'down' }, { k: 'npc', who: 'bram', x: 5, y: 3, face: 'down' }, { k: 'npc', who: 'ambrose', x: 8, y: 3, face: 'down' },
                { k: 'npc', who: 'tess', x: 11, y: 3, face: 'down' }, { k: 'npc', who: 'mallow', x: 14, y: 3, face: 'down' }, { k: 'npc', who: 'jory', x: 17, y: 3, face: 'down' },
                { k: 'deco', x: 3, y: 7, look: 'housemodel', ox: 0, solid: [[0, 0], [1, 0]], text: 'A little model of the Tidyhouse, every room, with pins in it. One pin is red and labelled YOU.' },
                { k: 'deco', x: 9, y: 7, look: 'kilnwyrm_costume', ox: 0, solid: [[0, 0], [1, 0], [2, 0]], text: "The Kilnwyrm, in pieces: a painted canvas skin, a wooden frame, a sign: TAIL STILL STICKS. -B." },
                { k: 'deco', x: 15, y: 7, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
            ],
        },
        /* ---------------- the Seams, west: tunnels under the houses ---------------- */
        '0,1': {
            name: 'The Seams',
            rows: [
                '########p######p####',
                '#..................#',
                '#..................#',
                '#..##########......#',
                '#..##########......#',
                '#..##########.......',
                '#..##########......#',
                '#..##########......#',
                '#..................#',
                '#..................#',
                '######p######p######',
            ],
            ents: [
                { k: 'sign', x: 17, y: 8, text: "THE SEAMS. Mind your head. And mind your manners: the little holes are for WORK. -G." },
            ],
        },
        /* ---------------- the Seams, east ---------------- */
        '2,1': {
            name: 'The Seams',
            rows: [
                '######p#######p#####',
                '#..................#',
                '#..................#',
                '#.......######.....#',
                '#.......######.....#',
                '........######.....#',
                '#.......######.....#',
                '#.......######.....#',
                '#..................#',
                '#..................#',
                '#####p#######p######',
            ],
            ents: [
                { k: 'chest', x: 18, y: 1, item: 'heartpatch', id: 'seamsPatch', hidden: true, when: 'flag:s23' },
                { k: 'gateweight', x: 17, y: 5 },
                { k: 'sign', x: 17, y: 7, text: "A great iron counterweight, its rope running up and away north. A tag: NORTH GATE. DO NOT TOUCH. BY ORDER OF THE WARDEN." },
            ],
        },
        /* ---------------- the Making Floor (Tuck's Little Wander: src/68_makings.js) ---------------- */
        '2,0': {
            name: 'The Making Floor',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'sign', x: 11, y: 4, text: "THE MAKING FLOOR. Quiet, please: Wanderer at work. (Upstairs.)" },
            ],
        },
    },
    onEnter: (a) => Underside.enter(a),
});

/* the peepholes: eight private moments in the town above (S23) */
const PEEPS = {
    '8,11': "Through the little hole: the bakery, after closing. Rosa sets a saucer of cream on the step. \"For the cat that isn't mine,\" she says to nobody, and Biscuit comes in out of the dark and drinks it.",
    '15,11': "Through the little hole: the schoolhouse. Miss Quill pins up Tuck's eleventh drawing of you, next to an old, faded one of a girl in green ribbons. She straightens them both, twice.",
    '6,21': "Through the little hole: Old Arlo's room. He gets up out of his chair, walks to the window, and back. Then again. He has to stop and hold the sill. \"Used to do this all day,\" he tells the window.",
    '13,21': "Through the little hole: the Lost and Found. Auntie Mabel turns a stray button over and over, finds a scratched L on the back, and puts it on a shelf of its own, very carefully, with the others.",
    '46,11': "Through the little hole: the tailor's back room. Seam is sewing a tiny green scarf, child-sized. On the bench: a list in big crooked letters. THINGS TUCK NEEDS FOR HIS WANDER. 1. A SCARF. 2. A STICK. 3. BRAVE.",
    '54,11': "Through the little hole: Constable Burr's house. He polishes his boots, says \"Halt!\" to the mirror, then, much quieter, \"Go on, then. Go on.\" He sits down on the bed and doesn't move for a long time.",
    '45,21': "Through the little hole: the clinic. Doctor Mallow is asleep at his desk with his cheek on the plans for the Slumberhouse, a mug of cocoa gone cold by his hand. He is smiling.",
    '53,21': "Through the little hole: Gran's study. Gran sits with a heavy book open, writing. She stops, and looks up at the portrait turned to the wall, and for a long moment you think she'll turn it round. She doesn't. She writes another line.",
};
SPAWN.peephole = (x, y) => {
    const pr = new Prop(x, y, { im: ART.peephole, solid: [[0, 0]], oy: 0 });
    pr.baseY = -40;
    pr.interact = () => {
        const k = x + ',' + y, text = PEEPS[k] || 'Through the little hole: somebody\'s ceiling. Somebody snoring.';
        Script.run(function* () {
            yield* say(null, text);
            if (!Progress.flag('peep:' + k)) {
                Progress.set('peep:' + k); Stats.count('peeps');
                const n = Object.keys(PEEPS).filter(q => Progress.flag('peep:' + q)).length;
                if (n >= Object.keys(PEEPS).length && !Progress.flag('s23')) {
                    Progress.set('s23'); Stats.count('secret:peepholes');
                    yield* say(null, "Eight little holes, eight little lives. You feel you know the town better than you did this morning, and you're not sure you should. Somewhere along the Seams, a lid clicks open.");
                } else UI.toast(n + ' of ' + Object.keys(PEEPS).length + ' peepholes.', 90);
            }
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};

/* the logbooks: what each Maker wrote down while you were in their House (from what really happened) */
const LOGBOOK_HOUSES = { tidy: ['ives', 'the Tidyhouse'], kiln: ['bram', 'the Kiln'], millrace: ['ambrose', 'the Millrace'], belfry: ['tess', 'the Belfry'], slumber: ['mallow', 'the Slumberhouse'], marionette: ['jory', 'the Marionette Hall'] };
const Logbook = {
    facts(area) {
        let t = 0, nudges = 0, best = null;
        for (const [k, r] of Object.entries(Stats.rooms)) {
            const [a, i] = k.split(':'); if (a !== area) continue;
            t += r.t; nudges += r.nudges || 0;
            if (!best || r.t > best.t) best = { t: r.t, i: +i };
        }
        const def = AREAS[area], room = best && def && def.rooms && def.rooms[best.i];
        return { mins: Math.max(1, Math.round(t / 3600)), nudges, room: room ? room.name : null, roomMins: best ? Math.max(1, Math.round(best.t / 3600)) : 0, been: t > 0 };
    },
    lines(area) {
        const [who, house] = LOGBOOK_HOUSES[area], f = this.facts(area), n = G.wanderer || 'Wren';
        if (!f.been) return [`${house.toUpperCase()}: WANDERER'S LOG. (Nothing yet. The pages are ready.)`];
        const out = [`${house.toUpperCase()}: WANDERER'S LOG. ${n}. In the House about ${f.mins} minute${f.mins === 1 ? '' : 's'} all told.`];
        if (f.room) out.push(({
            ives: `Longest in ${f.room}: ${f.roomMins} min. Tidied it beautifully in the end. (I did have to re-dust after.)`,
            bram: `${f.room}: ${f.roomMins} min! HA! Took me longer to build. Not by much.`,
            ambrose: `Spent ${f.roomMins} min in ${f.room}. Kept dry, mostly. Proud of you, love.`,
            tess: `${f.room}: ${f.roomMins} min. Rang true in the end. They always do, the good ones.`,
            mallow: `${f.room}: ${f.roomMins} min. Patient. Didn't fall asleep once. I did.`,
            jory: `${f.room}: ${f.roomMins} min! Applause from the wings (mine). Encore.`,
        })[who]);
        if (!Settings.hints && f.nudges === 0) out.push('The Wanderer asked us not to help. We respected that. (We were proud.)');
        else if (f.nudges === 0) out.push("Nudges: none. Not one. We didn't have to lift a finger. A bit put out, frankly.");
        else out.push(`Nudges: ${f.nudges}. Only little ones. ${who === 'bram' ? "You'd have got there. Probably. HA!" : 'You found it yourself, really.'}`);
        return out;
    },
};
class Logbook_ extends GridThing {
    constructor(tx, ty, p = {}) { super('logbook', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); }
    interact() {
        const lines = Logbook.lines(this.house);
        if (!Progress.flag('log:' + this.house)) { Progress.set('log:' + this.house); Stats.count('logbooks'); if (Object.keys(LOGBOOK_HOUSES).every(h => Progress.flag('log:' + h))) Progress.set('s22'); }
        Script.run(function* () { for (const l of lines) yield* say(null, l); });
        return true;
    }
    sprite() { return spr('logbook'); }
}
SPAWN.logbook = (x, y, p) => new Logbook_(x, y, p);

/* below the town, the Makers talk shop */
const UNDER_TALK = AREAS.underside.talk;
UNDER_TALK.gundry = function* () {
    if (Progress.flag('d7')) {
        yield* say('gundry', cycle('gundry_d7', ["Apprentice. Has a ring to it. Your cot's in the corner, by the way. Mind the spiders: they're Guild members too.", "Tuck's Little Wander's through the east door, when you're ready. Mind you don't make it too hard. He's six.", "Forty years I'd been meaning to sort that Tangle. Forty years."]));
        return;
    }
    if (!Progress.flag('met_gundry_below')) {
        Progress.set('met_gundry_below');
        yield* say('gundry', "So. You found the stairs. Up top I keep the Well; down here, the Guild. Every Maker you've met learnt the trade here, in the Spoolworks.");
        yield* say('gundry', "A House is PLAYED from up top. It's WORKED from down here: every mark up there has its cord below. Tug one, tie one off, see what happens.");
        yield* say('gundry', "Through the big door. The Works has got itself in a tangle. And mind the hound: he was a good dog once, till somebody wound him too tight.");
        Progress.setGoal('The Spoolworks: through the big door in the Guild Hall, under the Inn.');
        return;
    }
    yield* say('gundry', cycle('gundry_pre', ["Through the big door. The Spoolworks. Tug, tie, mind the hound.", "The cords never lie. Whatever's up top, its thread comes down somewhere.", "The Tangle's in the heart of the Works. You'll know it. It knows you're coming."]));
};
const MAKER_LINES = {
    ives: ["Welcome to the workshop, love. Shoes OFF. ...No, I'm joking. Mostly.", "Every crate in the Tidyhouse has a little brass ring under it, and every ring a thread, and I know every one by name.", "Read the log, if you like. I wrote it neat."],
    bram: ["HA! The Wanderer, in the workshop! Mind the clay, it's everywhere. It's ALWAYS everywhere.", "The Kilnwyrm's in bits over there. Took three winters. Tail still sticks.", "My log's honest. Brutally honest. Read it and weep! Or laugh. Laugh's better."],
    ambrose: ["There you are. Hello, love. Mind the puddle, that's mine.", "Grindle's in the millpond still. I go and give him a polish now and then.", "Your mum and I took turns at the sluices, every time you went near the Millrace. Best summer we've had."],
    tess: ["Hello, my darling. Brass dust on everything. Sorry.", "Every bell in the Belfry I tuned myself. Tollgrim's voice was your dad's idea. He does a good gargoyle.", "Up top, you rang the bells. Down here, we were pulling the ropes. Teamwork!"],
    mallow: ["Yaaawn. Hello. Is it morning? Down here I can never tell.", "Mother Sloth's arms are on pulleys. I pull them. It's very tiring.", "The logbook. Yes. I wrote some of it asleep. It's probably fine."],
    jory: ["Welcome backstage! Well. Underneath-stage.", "Captain Tin's having a lie down. He's earned it.", "Have a look at my log! I've drawn the bits I liked. Mostly you falling over. Lovingly!"],
};
for (const who of Object.keys(MAKER_LINES)) UNDER_TALK[who] = function* () { yield* say(who, cycle('under_' + who, MAKER_LINES[who])); };

const Underside = {
    enter(a) {
        if (!Progress.flag('underside_first')) {
            Progress.set('underside_first');
            Script.run(function* () {
                yield 20;
                /* (the beams, the lamps and the threads are drawn: StaffStairs, below; the box keeps clear of them) */
                yield* say(null, "Under the Inn, under the town: threads. Thousands of them, every colour, running away into the dark like roots.", { focus: [29, 14] });
                yield* say(null, 'Somewhere a long way off, a machine is going round and round. It sounds like a heartbeat, if a heart were made of wood.', { focus: [29, 14] });
            });
        }
    },
};

/* the Staff door at the Inn, open after the reveal (standing ajar: lamplight in the gap and on the boards) */
SPAWN.staffdoor = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.staffdoor, solid: [[0, 0]], oy: -16 }), d0 = pr.draw.bind(pr);
    pr.draw = (cx, cy) => {
        const open = Progress.flag('reveal1');
        pr.im = open ? ART.staffdoor_ajar : ART.staffdoor;
        if (open) { Gfx.alpha(0.18 + 0.04 * Math.sin(G.t / 31)); Gfx.rect(tx * T - cx + 6, ty * T - cy + 14, 10, 4, '#f7d64a'); Gfx.rect(tx * T - cx + 9, ty * T - cy + 18, 7, 3, '#f7d64a'); Gfx.alpha(1); }
        d0(cx, cy);
    };
    pr.interact = () => {
        if (!Progress.flag('reveal1')) { Script.run(function* () { yield* say(null, 'A narrow door: STAFF ONLY. Locked. Something hums on the other side.'); }); return true; }
        World.go('underside', UNDER_ENTRY.x, UNDER_ENTRY.y, { dir: UP, fade: true, from: 'inn' });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};

function initUnderside() {
    /* the Staff door ajar: the leaf swung in, a gap of lamplight beside it */
    ART.staffdoor_ajar = paintSprite(16, 32, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#5a3a26', 1, 2, 14, 30); R('#2a1a12', 2, 3, 12, 28); R('#c8903a', 8, 3, 6, 28); R('#f7d64a', 10, 5, 3, 25); R('#fff4c0', 11, 8, 1, 18);
        R('#7a4e32', 2, 3, 7, 28); R('#9a6438', 8, 3, 1, 28); R('#fbf6ea', 3, 8, 5, 4); R('#c42b4a', 4, 9, 3, 1); R('#c42b4a', 4, 11, 2, 1); R('#f7d64a', 7, 18, 1, 2);
    });
    ART.peephole = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#2a1e16', 0, 0, 16, 16); R('#4a3626', 1, 1, 14, 14); R('#120c08', 6, 5, 4, 4); R('#f7e8b8', 7, 6, 2, 2); R('#6a4e38', 5, 10, 6, 1); });
    ART.cot = paintSprite(16, 32, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 1, 2, 14, 28); R('#a8784a', 2, 3, 12, 26); R('#fbf6ea', 3, 4, 10, 6); R('#c42b4a', 3, 12, 10, 16); R('#e8463c', 3, 12, 10, 2); R('#5a3a26', 1, 28, 2, 4); R('#5a3a26', 13, 28, 2, 4); });
    ART.bigdoor = paintSprite(48, 20, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#a8784a', 0, 0, 48, 4); R('#c9a24a', 2, 1, 44, 2); R('#6a4e38', 0, 4, 4, 16); R('#6a4e38', 44, 4, 4, 16); R('#f7d64a', 20, 0, 8, 3); });
    SPR.cot = ART.cot;
    const deco = (n, w, h, f) => { ART[n] = paintSprite(w, h, f); SPR[n] = ART[n]; };
    deco('spoolrack', 32, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 0, 0, 32, 24); R('#8a6a4e', 1, 1, 30, 22); const cols = ['#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#e8463c', '#8fd46a']; for (let i = 0; i < 8; i++) { R(cols[i], 2 + (i % 4) * 7, 3 + (i >> 2) * 10, 5, 7); R('#2a1e16', 2 + (i % 4) * 7, 3 + (i >> 2) * 10, 5, 1); R('#2a1e16', 2 + (i % 4) * 7, 9 + (i >> 2) * 10, 5, 1); } });
    deco('longtable', 64, 20, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#6a4630', 0, 4, 64, 10); R('#9a6438', 1, 5, 62, 7); R('#4a3020', 2, 14, 3, 6); R('#4a3020', 59, 14, 3, 6); R('#c9a24a', 20, 6, 6, 3); R('#eef2f8', 40, 7, 8, 1); });
    deco('housemodel', 32, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 0, 14, 32, 10); R('#efe4cc', 4, 4, 24, 14); R('#3a4656', 4, 4, 24, 2); R('#2e9a96', 2, 0, 28, 5); R('#e8463c', 15, 10, 2, 2); });
    deco('kilnwyrm_costume', 48, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 0, 18, 48, 6); R('#e0913a', 4, 6, 40, 12); R('#c96a2a', 4, 6, 40, 2); for (let i = 0; i < 5; i++) R('#a8502a', 6 + i * 8, 10, 4, 4); R('#fbf6ea', 40, 8, 3, 3); });
    deco('counterweight', 32, 32, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#c9a24a', 15, 0, 2, 12); R('#2a2e36', 4, 12, 24, 18); R('#484c56', 6, 14, 20, 14); R('#6a6e78', 6, 14, 20, 2); R('#fbf6ea', 10, 20, 12, 5); R('#c42b4a', 11, 21, 10, 1); });
    defSprite('logbook', ['................', '................', '...kkkkkkkkkk...', '..kbbbbbbbbbbk..', '..kbwwwwbwwwbk..', '..kbwkkwbwkwbk..', '..kbwwwwbwwwbk..', '..kbwkwwbwkkbk..', '..kbwwwwbwwwbk..', '..kbbbbbbbbbbk..', '..kkkkkkkkkkkk..', '...kddddddddk...', '...kd......dk...', '...kd......dk...', '...kk......kk...', '................'], { b: '#7a4e32', w: '#fbf6ea', d: '#5a3a26' });
}
CONTENT_INIT.push(initUnderside);

/* the Staff Stairs as you first see them: two low beams across the room, warm lamps hung from them, and threads,
   every colour, lying along the beams, hanging from them, and running off over the walls and through the doorways
   into the dark like roots (over the room; the lamps' light lies on the floor under it). Painted once; only the
   loose ends sway and the lamps flicker */
const StaffStairs = {
    ox: 20 * T, oy: 11 * T, beams: [50, 100], lamps: [[72, 0], [160, 0], [248, 0], [116, 1], [204, 1]],
    cols: ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#8fd46a', '#f59ac0', '#fbf6ea', '#5ad1c5', '#f0b060'],
    on(a, cx, cy) { return a.id === 'underside' && this.ox - cx < W && this.ox + 320 - cx > 0 && this.oy - cy < H && this.oy + 176 - cy > 0; },
    paint() {
        return paintSprite(320, 176, x => {
            const P = (c, a, b) => { x.fillStyle = c; x.fillRect(a, b, 1, 1); };
            const line = (x0, y0, x1, y1, c) => { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 900; n++) { P(c, x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
            const path = (pts, c) => { for (let i = 0; i + 1 < pts.length; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c); };
            const col = k => this.cols[k % this.cols.length];
            /* roots: from the beams up over the back wall and out through the three doorways, splaying as they go
               (under the beams, so they seem to come from behind them) */
            const root = (x0, y0, x1, y1, n, seed, spread) => {
                for (let k = 0; k < n; k++) {
                    const s = (k - (n - 1) / 2) * spread, w = hash2(k, seed, 9) * 6.28, pts = [];
                    for (let i = 0; i <= 16; i++) { const t = i / 16, e = t * t; pts.push([x0 + (x1 - x0) * t + s * e * 3 + Math.sin(t * 9 + w) * 2 * t, y0 + (y1 - y0) * t + s * (1 - e) * 0.4]); }
                    path(pts, col(k * 7 + seed));
                }
            };
            x.globalAlpha = 0.7;
            for (const [rx, n] of [[30, 3], [98, 4], [200, 4], [276, 3]]) root(rx, this.beams[0] + 2, rx + (rx < 160 ? -14 : 14), -4, n, rx, 2);
            root(140, this.beams[0] + 2, 152, -4, 6, 3, 1.4);
            root(56, this.beams[0] + 4, -6, 86, 4, 5, 1.6); root(48, this.beams[1] + 4, -6, 92, 4, 11, 1.6);
            root(264, this.beams[0] + 4, 326, 86, 4, 13, 1.6); root(272, this.beams[1] + 4, 326, 92, 4, 17, 1.6);
            x.globalAlpha = 1;
            /* the beams: an inked edge, a lit top, a darker face with the grain, pegged where they meet the walls */
            for (const by of this.beams) {
                x.fillStyle = PAL.ink; x.fillRect(8, by - 1, 304, 10);
                x.fillStyle = '#9a7a5a'; x.fillRect(9, by, 302, 2);
                x.fillStyle = '#6a4e38'; x.fillRect(9, by + 2, 302, 5);
                x.fillStyle = '#4a3626'; x.fillRect(9, by + 7, 302, 1);
                for (let i = 9; i < 311; i++) if (hash2(i, by, 3) < 0.12) P('#5a3e2a', i, by + 3 + Math.floor(hash2(by, i, 4) * 3));
                for (const px of [12, 304]) { x.fillStyle = '#c9a24a'; x.fillRect(px, by + 3, 2, 2); }
            }
            /* threads along each beam: a few lying on its top, and loops hanging under it between nails */
            this.beams.forEach((by, b) => {
                for (let k = 0; k < 3; k++) for (let px = 9; px < 311; px++) if (hash2(px >> 4, k, b + 30) < 0.6) P(col(k * 4 + b), px, by + (k % 2));
                x.globalAlpha = 0.85;
                for (let k = 0; k < 7; k++) {
                    const span = 36 + Math.floor(hash2(k, b, 7) * 30), deep = 2 + Math.floor(hash2(b, k, 8) * 8), sh = Math.floor(hash2(k, b, 6) * span), pts = [];
                    for (let px = 9; px <= 311; px += 3) { const f = ((px + sh) % span) / span; pts.push([px, by + 8 + Math.sin(f * Math.PI) * deep]); }
                    path(pts, col(k * 5 + b * 3));
                }
                x.globalAlpha = 1;
            });
        }, false);
    },
    /* the lamps' light, warm on the boards below them */
    ground(a, cx, cy) {
        if (!this.on(a, cx, cy)) return;
        for (const [lx, b] of this.lamps) {
            const x0 = this.ox + lx - cx, y0 = this.oy + this.beams[b] + 32 - cy, fl = 0.02 * Math.sin(G.t / 13 + lx);
            for (const [rx, ry, al] of [[30, 13, 0.07], [20, 9, 0.08], [11, 5, 0.09]]) {
                Gfx.alpha(al + fl);
                for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); Gfx.rect(x0 - w, y0 + j, w * 2 + 1, 1, '#ffcf70'); }
            }
        }
        Gfx.alpha(1);
    },
    /* over everything: the beams and their threads, the loose ends swaying, the lamps glowing */
    front(a, cx, cy) {
        if (!this.on(a, cx, cy)) return;
        if (!this.art) this.art = this.paint();
        const X = this.ox - cx, Y = this.oy - cy;
        /* (Wren under a beam: the beam and its threads thin to a ghost round her, so she's never lost under them) */
        const p = G.player, bx0 = p && p.area === a && !p.hidden ? Math.round(p.x - this.ox) - 9 : -99, by0 = p ? Math.round(p.y - this.oy) - 24 : 0;
        if (bx0 > -18 && bx0 < 320 && this.beams.some(by => by0 < by + 22 && by0 + 28 > by - 2)) {
            const x0 = clamp(bx0, 0, 320), x1 = clamp(bx0 + 18, 0, 320), y0 = clamp(by0, 0, 176), y1 = clamp(by0 + 28, 0, 176), im = this.art;
            const part = (sx, sy, sw, sh) => { if (sw > 0 && sh > 0) Gfx.sub(im, sx, sy, sw, sh, X + sx, Y + sy); };
            part(0, 0, 320, y0); part(0, y1, 320, 176 - y1); part(0, y0, x0, y1 - y0); part(x1, y0, 320 - x1, y1 - y0);
            Gfx.alpha(0.3); part(x0, y0, x1 - x0, y1 - y0); Gfx.alpha(1);
        } else Gfx.img(this.art, X, Y);
        this.beams.forEach((by, b) => {
            for (let k = 0; k < 26; k++) {
                const px = 14 + Math.floor(hash2(k, b, 21) * 292), len = 3 + Math.floor(hash2(b, k, 22) * 11), sw = Math.round(Math.sin(G.t / 47 + k * 1.7) * Math.min(1, len / 8));
                const c = this.cols[(k * 3 + b) % this.cols.length];
                Gfx.rect(X + px, Y + by + 7, 1, Math.ceil(len / 2), c); Gfx.rect(X + px + sw, Y + by + 7 + Math.ceil(len / 2), 1, Math.floor(len / 2), c);
            }
        });
        for (const [lx, b] of this.lamps) {
            const x0 = X + lx, y0 = Y + this.beams[b] + 7, fl = Math.sin(G.t / 13 + lx);
            Gfx.rect(x0, y0, 1, 4, '#3a2a1e');
            Gfx.alpha(0.13 + 0.03 * fl); Gfx.circle(x0, y0 + 9, 11, '#ffcf70'); Gfx.alpha(0.22 + 0.04 * fl); Gfx.circle(x0, y0 + 9, 6, '#ffe08a'); Gfx.alpha(1);
            Gfx.rect(x0 - 3, y0 + 3, 7, 2, PAL.ink); Gfx.rect(x0 - 2, y0 + 3, 5, 1, '#c9a24a');
            Gfx.rect(x0 - 3, y0 + 5, 7, 8, PAL.ink); Gfx.rect(x0 - 2, y0 + 5, 5, 7, '#ffd77a'); Gfx.rect(x0 - 1, y0 + 6, 3, 4, '#fff4c8'); Gfx.rect(x0 - 2, y0 + 5, 1, 7, '#e0a848');
            Gfx.rect(x0 - 2, y0 + 12, 5, 2, PAL.ink); Gfx.rect(x0 - 1, y0 + 12, 3, 1, '#a6772a');
        }
    },
};
{
    const g0 = AREAS.underside.drawGround, f0 = AREAS.underside.drawFront;
    AREAS.underside.drawGround = (a, cx, cy) => { if (g0) g0(a, cx, cy); StaffStairs.ground(a, cx, cy); };
    AREAS.underside.drawFront = (a, cx, cy) => { if (f0) f0(a, cx, cy); StaffStairs.front(a, cx, cy); };
}
