/* Reveal 2: the Return holds people. Sent down the Way Down for Tuck's fresh spool, Wren finds the deep store and,
   past it, the Hall of Names: a spool for everybody in the valley, every thread running down a shaft to the Spool
   under the Well; Linnet's, cut; Wren's own, wound tighter than any; and Gran's ledger. Gran comes down the stairs.
   She doesn't argue. She takes Wren's red thread between finger and thumb and pulls, and Wren wakes in bed.
   After it: everyone's thread is there to see; the well cellar is locked; and the Seams' counterweight (the north
   gate's) will take a new place from the Needle (S32 if it's done before this). */

THEMES.hallnames = { floor: ['#3a3440', '#2a2430', '#4a4450', '#1a1420'], wall: ['#4a4054', '#2e2838', '#6a6078', '#14101a'], stone: ['#5a5460', '#3e3844', '#7a7480', '#24202a'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#0c0a10' };
FLOORS.hallnames = {
    floor: (x, th, v) => { fill(x, '#2e2a36'); speckle(x, ['#3a3644', '#24202c'], 30 + v, 0.3); fill(x, '#1e1a26', 0, 15, 16, 1); },
    floor2: (x, th, v) => { fill(x, '#4a2a34'); speckle(x, ['#5a3440', '#3a2028'], 40 + v, 0.3); fill(x, '#c9a24a', 0, 0, 16, 1); fill(x, '#c9a24a', 0, 15, 16, 1); },
    floor3: (x, th, v) => { fill(x, '#0c0a10'); for (let i = 0; i < 6; i++) fill(x, ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8'][(i + v) % 6], 2 + i * 2, 0, 1, 16); },
};
WALLS.hallnames = {
    edge: '#0c0a10',
    top: (x) => { fill(x, '#1e1a26'); speckle(x, ['#2a2634'], 8, 0.2); },
    face: (x, th, v) => { fill(x, '#4a4054'); for (let i = 1; i < 16; i += 5) fill(x, '#3a3244', i, 0, 1, 14); fill(x, '#c0b8d0', 0, 13, 16, 1); fill(x, '#0c0a10', 0, 15, 16, 1); },
};

/* everybody's spool, by name: [peg label, who, colour, how it's wound] */
const NAME_SPOOLS = [
    ['GRAN... no: HESPER', 'hesper', THREAD.hesper, 'An empty peg. Its label says HESPER, in her own hand, and it has never held a spool.'],
    ['MISS QUILL', 'quill', '#c8d8f0', 'Wound neat and even, every turn the same.'],
    ['OLD ARLO', 'arlo', '#e6c08a', 'Wound so tight the spool creaks. A note pinned under it: "Walked to the lake again. Tightened."'],
    ['FISHER HOB', 'hob', '#7ec8f0', 'Tight. A note: "Halfway up the river. Tightened."'],
    ['ROSA', 'rosa', '#f8c8a0', 'Tight, and dusted with flour.'],
    ['THIMBLE', 'thimble', '#d8c8f0', 'Tight.'],
    ['SEBASTIAN SEAM', 'seam', '#f07a9a', 'Tight, wound with a tailor\'s neatness. Somebody has tried to loosen the first turn and given up.'],
    ['AUNTIE MABEL', 'mabel', '#c8e66a', 'Tight.'],
    ['CONSTABLE BURR', 'burr', '#9a9188', 'Wound tight as a drum. Twenty years at one post.'],
    ['NELL', 'nell', '#f59ac0', 'A child\'s spool, small. Tight. A note: "Ran to the posts. Tightened."'],
    ['OTTO', 'otto', '#9fdcf5', 'Small. Tight.'],
    ['BEA', 'bea', '#c8e66a', 'Small. Tight.'],
    ['TUCK', 'tuck', '#5ab85a', 'Small and new, wound loose and full of slack, the way a spool is before anybody has pulled on it.'],
    ['BISCUIT', 'biscuit', '#cfc6b8', 'The peg is empty. A snipped end of thread hangs from it. Whatever was tied to it walked off a long time ago, and came back of its own accord.'],
    ['MOTHER IVES', 'ives', THREAD.ives, 'Tight.'], ['BRAM', 'bram', THREAD.bram, 'Tight.'], ['AMBROSE (DAD)', 'ambrose', THREAD.ambrose, 'Tight.'], ['TESS (MUM)', 'tess', THREAD.tess, 'Tight.'],
    ['DOCTOR MALLOW', 'mallow', THREAD.mallow, 'Tight.'], ['JORY', 'jory', THREAD.jory, 'Tight.'], ['GUNDRY', 'gundry', THREAD.guild, 'Tight.'],
    ['LINNET', 'linnet', THREAD.linnet, 'A green spool, nearly full, and its thread cut clean through a hand\'s length from the peg. Cut with something sharp. Something old.'],
    ['WREN', 'wren', THREAD.wren, 'Your own name. A red spool, wound tighter than any other in the hall, so tight the thread has gone shiny, and still being wound: as you watch, it turns, a little.'],
];

defHouse({
    id: 'deep', name: 'The Deep Store', place: 'The Underside', theme: 'hallnames', thread: THREAD.hesper, music: 'lullaby',
    entry: { x: 2, y: 5 },
    cells: {
        '0,0': {
            name: 'The Deep Store',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#.H................#',
                '####################',
            ],
            ents: [
                { k: 'warp', x: 2, y: 9, to: 'underside', tx2: 55, ty2: 9, face: 'left' },
                { k: 'deco', x: 4, y: 1, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]], text: 'Fresh spools, new and full, every colour. Labels: SPARE. SPARE. FOR NEXT YEAR.' },
                { k: 'deco', x: 9, y: 1, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 14, y: 1, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
                { k: 'freshspool', x: 9, y: 6, id: 'tuckSpool' },
                { k: 'sign', x: 17, y: 4, text: 'THE OLD HALL. Warden only. (The door is not locked. It has never needed to be.)' },
            ],
        },
        '1,0': {
            name: 'The Hall of Names',
            rows: [
                '####################',
                '#..................#',
                '#,,,,,,,,,,,,,,,,..#',
                '#..................#',
                '#..................#',
                '...............:::.#',
                '#..................#',
                '#..................#',
                '#,,,,,,,,,,,,,,,,..#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'ledger', x: 17, y: 3, id: 'ledger' },
            ],
        },
    },
    build: a => Reveal2.build(a),
});

/* Tuck's fresh spool: the errand */
SPAWN.freshspool = (x, y, p) => {
    const pr = new Prop(x, y, { im: ART.freshspool, solid: [[0, 0]], oy: -4 });
    pr.interact = () => {
        if (Inv.items.tuckspool) return false;
        Script.run(function* () {
            Inv.items.tuckspool = 1; Sfx.play('smallitem');
            yield* say(null, 'A fresh spool on a little stand, bright green, labelled TUCK in Gundry\'s big square letters. You tuck it in your satchel.');
            yield* say(null, "From the old hall beyond, very faintly, comes a sound like a winch turning. Click. Click. Click.");
            Progress.setGoal("Tuck's spool is in your satchel. (And there's a door east, into the old hall...)");
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
ITEMS.tuckspool = { name: "Tuck's spool", kind: 'quest', desc: 'A fresh green spool for a new Wanderer.' };

/* a spool on its peg, with a name */
class NameSpool extends GridThing {
    constructor(tx, ty, p = {}) { super('namespool', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true }, p)); }
    interact() { const [label, , , text] = this.spec; Script.run(function* () { yield* say(null, label + '. ' + text); }); Stats.count('names:' + this.spec[1]); return true; }
    draw(cx, cy) {
        const x = this.px - cx, y = this.py - cy, [, who, col] = this.spec;
        Gfx.rect(x + 7, y - 6, 2, 8, '#6a6078');
        if (who === 'hesper' || who === 'biscuit') { Gfx.rect(x + 4, y + 1, 8, 2, '#4a4054'); if (who === 'biscuit') Gfx.line(x + 8, y + 3, x + 8, y + 9, col); }
        else {
            Gfx.rect(x + 3, y, 10, 2, '#8a8096'); Gfx.rect(x + 3, y + 10, 10, 2, '#8a8096');
            Gfx.rect(x + 4, y + 2, 8, 8, col); Gfx.rect(x + 4, y + 2, 8, 1, shade(col, 0.3)); Gfx.rect(x + 4, y + 9, 8, 1, shade(col, -0.3));
            /* every thread runs off to the shaft (but Linnet's, cut) */
            if (who !== 'linnet') { Gfx.alpha(0.4); Gfx.line(x + 8, y + 6, x + 8 + (16 - this.tx % 20) * 2, y + 14, col); Gfx.alpha(1); }
            else { Gfx.line(x + 12, y + 6, x + 15, y + 8, col); }
            if (who === 'wren' && (G.t >> 3) % 2) Gfx.rect(x + 4, y + 5, 8, 1, '#ffd0c8');
        }
        Gfx.rect(x + 5, y + 13, 6, 2, '#c9a24a');     /* a little brass name-tag */
    }
}

/* Gran's ledger, open on its lectern by the shaft */
class Ledger extends GridThing {
    constructor(tx, ty, p = {}) { super('ledger', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); }
    interact() { Script.run(Reveal2.scene()); return true; }
    sprite() { return spr('ledger'); }
}
SPAWN.ledger = (x, y, p) => new Ledger(x, y, p);

const Reveal2 = {
    build(a) {
        /* the pegs along both walls of the hall, one spool each */
        const r = a.rooms.find(q => q.key === '1,0');
        NAME_SPOOLS.forEach((spec, i) => {
            const row = i < 12 ? 2 : 8, x = 1 + (i % 12) + (i % 12 > 5 ? 2 : 0);
            const s = new NameSpool(r.x + x, r.y + row, {}); s.spec = spec; a.add(s);
        });
    },
    *scene() {
        if (Progress.flag('reveal2')) { yield* say(null, "The ledger's gone. Only the lectern, and the click of the winch."); return; }
        const pages = [
            "A heavy book, open, in Gran's hand. The older pages are neat. The newer ones are not.",
            "\"The year Linnet went. I found her spool cut through. Shears: the First Spinner's own, from the old Loom. She cut herself loose and walked into the fog, and the fog let her go. Nobody is ever lost in the Hollow. She was.\"",
            "\"I took every spool in the valley in my two hands and pulled them tight. Nobody else will go.\"",
            "\"Arlo walked to the lake again. Tightened him. Hob halfway up the river. Tightened. The children run so far. Tightened. Tightened.\"",
            "\"The Wander. Six Houses, six Knots. Every Knot the Wanderer ties turns my winch a little further. They never notice. They are always so proud.\"",
            "\"Wren is so like her. Tightened again. The seventh Knot is the Wanderer's own, at the Well: when Wren ties it she will take my place at the Spool, and nobody, nobody, will ever be lost again. Wren mustn't go. Wren mustn't.\"",
        ];
        for (const p of pages) yield* say(null, p);
        G.shake = 4; Sfx.play('rumble');
        yield* say(null, 'Down the shaft, every thread in the hall tightens at once, with a sound like a breath drawn in.');
        const a = G.map, p = G.player;
        const hall = a.rooms.find(q => q.key === '1,0');
        const gran = a.add(new NPC(hall.x + 1, hall.y + 5, { who: 'gran', face: 'right' }));
        Fx.poof(gran.px + 8, gran.py + 8);
        Music.play('silence');
        yield 30;
        yield* say('gran', "You shouldn't be down here, love.");
        yield* say(null, "She looks very small at the top of the hall, and very tired. Her fingers are wound round with threads, every colour, so many that her hands look like spools themselves.");
        yield* say('gran', "I'd have told you. After the seventh Knot. You'd have understood, then. You'd have seen how much there is to lose.");
        const i = yield* ask('gran', "Don't look at me like that.", ['Where is Linnet?', 'Let them go, Gran.', '...']);
        if (i === 0) yield* say('gran', "Gone. Out past the fog, where nothing comes back. Where nobody can find you, or bring you home. I'll not lose another. Not you.");
        else if (i === 1) yield* say('gran', "Let them go? Let them walk off and never come back? I've done that once, love. Once was enough for a whole life.");
        else yield* say('gran', "Oh, love. Don't.");
        yield* say('gran', "Go home now. Go home and go to sleep, and in the morning everything will be in its place.");
        yield* say(null, "She takes your red thread between her finger and thumb, the way she'd take a loose end on a jumper, and pulls.");
        /* yanked home: up, away, a long red line, and bed */
        Sfx.play('flight'); G.shake = 10;
        G.hideHud = true;
        for (let t = 0; t < 40; t++) { p.z = t * 2; yield 1; }
        yield* fadeOut(30);
        p.z = 0;
        Progress.set('reveal2');
        Progress.set('well_locked');
        Stats.count('reveal2');
        World.enter('gran_room', 4, 3, { dir: DOWN });
        G.player.state = 'sleep';
        yield 60;
        yield* fadeIn(60);
        G.player.state = 'normal'; G.hideHud = false;
        Music.play('lullaby');
        yield* say(null, "You wake in your own bed. It's morning. The house is very quiet.");
        yield* say(null, "Gran's chair is empty. On the kitchen table, a cup of tea gone cold. And the door to the well cellar, which is never locked, is locked.");
        yield* say(null, "When you look down at your hands, you can see your own thread, faintly, running from your heart down through the floor. You can see everybody's now.");
        Progress.setGoal("Linnet cut herself loose with the First Spinner's Shears, from the old Loom. Gundry, under the Inn, may know where that is.");
        Save.autosave();
    },
};

/* after Reveal 2: everybody's thread shows, a faint line down from each of them */
{
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        if (Progress.flag('reveal2') && !Progress.flag('cut:' + this.who) && this.who !== 'biscuit' && this.who !== 'linnet') {
            const x = this.px + 8 - cx, y = this.py + 4 - cy;
            Gfx.alpha(0.35); Gfx.line(x, y, x, y + 12, (PEOPLE_DEF[this.who] && PEOPLE_DEF[this.who].col) || THREAD.town); Gfx.alpha(1);
        }
        return draw0.call(this, cx, cy);
    };
}

/* the Way Down, off the Making Floor, once the Little Wander's done */
AREAS.underside.ents.push(
    { k: 'warp', x: 57, y: 9, to: 'deep', tx2: 3, ty2: 9, face: 'right', room: '2,0', if: 'makings_done' },
    { k: 'deco', x: 57, y: 9, look: 'stairs_down', solid: false, baseY: -100, room: '2,0', if: 'makings_done' },
    { k: 'sign', x: 57, y: 7, text: 'THE WAY DOWN. Deep store. (Mind the stairs: they are older than the Guild.)', room: '2,0', if: 'makings_done' },
);

/* the north gate's counterweight in the Seams: the Needle can give it a new place (S32 before Reveal 2) */
SPAWN.gateweight = (x, y, p) => {
    const b = new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'block_weight', noPush: true, id: 'gateWeight', pushLine: "The north gate's counterweight. Far too heavy to shift. TAGGED: DO NOT TOUCH. BY ORDER OF THE WARDEN." }, p));
    b.tick = function () {
        if (this.stitched && !Progress.flag('north_gate')) {
            Progress.set('north_gate'); Stats.count('north_gate');
            if (!Progress.flag('reveal2')) { Progress.set('s32'); Stats.count('secret:gate'); }
            G.shake = 8; Sfx.play('rumble');
            G.pendingToast = 'Far away north, something huge and stone grinds, and stops, and stays open.';
        }
    };
    return b;
};

/* after Reveal 2, a faint on purpose: Gran pulls you home, and this time you know (S33) */
{
    const wake0 = Story.wakeAfterFaint;
    Story.wakeAfterFaint = function* () {
        if (Progress.flag('reveal2') && !Progress.flag('s33')) {
            Progress.set('s33'); Stats.count('secret:faint');
            yield* say(null, "You wake in your bed again. This time you felt it: a hand on your thread, far away, under the Well, winding you in like a kite. Gentle. Certain.");
            yield* say(null, "Somewhere under the house, very quietly, someone says, \"There you are, love.\"");
            return;
        }
        yield* wake0.call(this);
    };
}

function initReveal2() {
    ART.freshspool = paintSprite(16, 20, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#4a4054', 3, 16, 10, 4); R('#8a8096', 3, 4, 10, 2); R('#8a8096', 3, 14, 10, 2); R('#5ab85a', 4, 6, 8, 8); R('#8ad88a', 4, 6, 8, 1); R('#3a7a3a', 4, 13, 8, 1); });
    defSprite('ledger', ['................', '................', '..kkkkkkkkkkkk..', '.kwwwwwkwwwwwwk.', '.kwkkwwkwkkkwwk.', '.kwwwwwkwwwwwwk.', '.kwkkkwkwkkwwwk.', '.kwwwwwkwwwwwwk.', '..kkkkkkkkkkkk..', '.......kk.......', '.......dd.......', '.......dd.......', '.......dd.......', '.....kddddk.....', '....kkkkkkkk....', '................'], { w: '#efe4cc', d: '#5a3a26' });
}
CONTENT_INIT.push(initReveal2);

/* Gundry, after: the Shears, the Loom, the north gate, and a counterweight in the Seams */
{
    const g0 = UNDER_TALK.gundry;
    UNDER_TALK.gundry = function* (n) {
        if (!Progress.flag('reveal2')) return yield* g0(n);
        if (!Progress.flag('gundry_r2')) {
            Progress.set('gundry_r2');
            yield* say('gundry', "You've seen the Hall, then. I can tell. You've got the look. I had it too, forty years back, and I went straight back upstairs and oiled the winch and never said a word. I'm not proud of that.");
            yield* say('gundry', "The Shears. The First Spinner's own, the only blades in the valley that cut a thread for good. They're in the old Loom, in the Loomwood, past the north gate. Linnet went that way.");
            yield* say('gundry', "Hesper keeps that gate shut with a counterweight, down here in the Seams, east. Nobody can shift it. But nobody had a Needle before, did they?");
            Progress.setGoal('The north gate: its counterweight is in the Seams (east), under the town. Give it a new place.');
            return;
        }
        yield* say('gundry', cycle('gundry_r2b', ["The Seams, east end. The counterweight. Mind your fingers.", "Past the gate it's the Loomwood. Old. Older than the Houses. Nobody's built anything there; nobody watches from underneath. You'll be on your own.", "If you see Linnet... tell her the Guild still has her name on the bench."]));
    };
}
