/* The morning of the Wander: waking up, Gran, the ceremony at the Well. */

const Prologue = {
    start() {
        G.hideHud = true;
        World.enter('gran_room', 6, 3, { dir: DOWN, noSave: true });
        const p = G.player;
        p.x = 7 * T + 8; p.y = 2 * T + 10; p.state = 'sleep'; p.inBed = G.map.ents.find(e => e.skey === 'wrenbed');
        UI.fadeA = 1;
        Progress.setGoal('Get up and go downstairs to see Gran.');
        Script.run(function* () {
            yield 30;
            Music.play('lullaby');
            yield* say(null, "Half asleep, you hear Gran humming downstairs: the bedtime tune she always hums. Low... high... in between... high... and low again. It goes round and round.");
            Progress.addNote('granTune');
            Music.play('home');
            yield* fadeIn(60);
            yield 40;
            yield* say('gran', "{happy}{name}! Up you get, love! The whole town's waiting on you, and you're still in bed on your Wander day!");
            yield 20;
            p.state = 'normal'; p.inBed = null; p.x = 6 * T + 8; p.y = 3 * T + 10; p.dir = DOWN;
            Sfx.play('land'); Fx.dust(p.x, p.y);
            yield 20;
            G.hideHud = false;
            yield* say(null, 'Today you go on your Wander. You have been waiting for this your whole life.');
            Save.autosave();
        });
    },
};

/* the Journal keeps the tune (only the tune, as it was heard), for whenever it's wanted again */
NOTES.granTune = { title: "Gran's bedtime tune", text: 'The tune Gran always hums at bedtime: low... high... in between... high... and low again.' };

/* Gran, at home, the morning of the ceremony */
TALK.gran = function* (npc) {
    if (!Progress.flag('ceremony')) {
        if (!Progress.flag('talkedGran')) {
            yield* say('gran', [
                "{happy}There you are. Let me look at you. Scarf on straight, good. Boots? Good.",
                "Every Wanderer before you walked out of a house just like this one, on a morning just like this one. And every one of them came home.",
                "{happy}Now off to the Well with you. I'll be right behind.",
            ]);
            Progress.set('talkedGran');
            Progress.setGoal('Go to the Well in the middle of town, where everyone is waiting.');
        } else yield* say('gran', "Go on, love. The Well. I'll be right behind you.");
        return;
    }
    const lines = Progress.flag('d5') ? GRAN_AFTER_D5 : Progress.flag('d4') ? GRAN_AFTER_D4 : Progress.flag('d1') ? GRAN_AFTER_D1 : GRAN_ACT1;
    const n = Progress.get('granTalk') || 0; Progress.set('granTalk', n + 1);
    yield* say('gran', lines[n % lines.length]);
};
const GRAN_ACT1 = [
    "The Tidyhouse is down in Meadowfold, past the sheep. Mind your manners in there; it's a tidy old place.",
    "If you get stuck, stand still a while and look at what goes back where. It nearly always tells you.",
    "My hands? Old, love. Too much knitting. Go on with you.",
    "Everything in its place, {name}. You'll see. It's a comfort, when you're grown.",
];
const GRAN_AFTER_D1 = [
    "{happy}Your first Knot! Did you feel it? The whole valley sat up a little straighter.",
    "Next is the Kiln, out west in Kilnridge. The road's blocked by that old boulder, but you're a clever thing.",
    "{sad}I always knew you'd be good at this. You've your aunt's... well. You've good hands.",
];

const GRAN_AFTER_D4 = [
    "{happy}Four Knots! Only two to go, love. The east road's next: the old giant's asleep across it. You've a bell now.",
    "Hushwood's a sleepy old place. Don't let it get into your bones. Come home to your own bed.",
    "{sad}You're so like... well. You're growing up, that's all.",
];
const GRAN_AFTER_D5 = [
    "{happy}Five! Only one more House, then home for good. It's out west: Larkspur Fair, down below the high mesa in Kilnridge.",
    "There's no stair down off the mesa. Folk used to say you'd need a way of coming home before you jumped. You've one now, haven't you?",
    "Your bedroll. Hm. Mind you always roll it up and bring it home. A Wanderer's place is at home, {name}.",
    "{worried}Don't stay out too long. The valley likes everyone where they belong.",
];

/* the ceremony starts when Wren first steps out of the house after talking to Gran */
const Ceremony = {
    check(area) {
        if (area.id !== 'hollow' || Progress.flag('ceremony') || !Progress.flag('talkedGran')) return;
        Progress.set('ceremony');
        Script.run(Ceremony.run, { name: 'ceremony' });
    },
    *run() {
        const ox = 64, oy = 40;
        const a = G.map, p = G.player;
        /* the town gathers at the Well (round Wren, not behind her: nobody stands in front of her all the while), and Bram,
           who can't help himself, has brought a pot */
        const crowd = [['ives', 27, 21, 'up'], ['bram', 34, 21, 'left'], ['rosa', 28, 22, 'up'], ['thimble', 33, 22, 'up'], ['seam', 26, 20, 'right'], ['mallow', 35, 20, 'left'], ['mabel', 29, 22, 'up'], ['quill', 32, 21, 'up']];
        const added = [];
        for (const [who, x, y, f] of crowd) { const n = a.add(new NPC(ox + x, oy + y, { who, face: f })); added.push(n); }
        const bram = added[1]; bram.holding = 'bram_pot';
        let pot = null;
        let gran = a.ents.find(e => e.who === 'gran');
        if (!gran) gran = a.add(new NPC(ox + 29, oy + 20, { who: 'gran', face: 'down' }));
        G.hideHud = true;
        yield 20;
        yield* walkTo(p, ox + 30, oy + 21);
        p.dir = UP;
        yield 20;
        yield* say('gran', "{happy}Hollowell! Hush now, hush. Bram, put the pot down.");
        /* (he does, at his feet) */
        bram.holding = null; pot = a.add(new Prop(bram.tx, bram.ty + 1, { im: spr('bram_pot'), solid: [], ox: 3, oy: 2 })); Sfx.play('step');
        yield 14;
        yield* say('gran', [
            "Every year the Hollow wakes up a little weaker. Strays turn up that won't go home. The Way forgets itself.",
            "So every so often, one of our young ones goes on the Wander: through the six Houses, to tie the six Knots that hold the Hollow in its shape.",
            "{happy}This year, it's {name}.",
        ]);
        for (const n of added) n.bubble = 'heart';
        Sfx.play('appear');
        yield 50;
        for (const n of added) n.bubble = null;
        /* (Miss Quill turns to say them to Wren's face, and Wren to her) */
        const quill = added[7]; quill.dir = LEFT; p.dir = RIGHT;
        yield* say('quill', [
            "Ahem. The Rules of the Return, as every child knows them.",
            "One: everything has its place. Two: whatever is moved goes back the way it came. Three: nothing is ever lost in the Hollow.",
        ]);
        p.dir = UP;
        yield* say('gran', "{happy}And now your Wanderstaff. Your grandad cut it from the old apple tree. It's done this before.");
        yield* Story.getItem('staff')();
        yield* say('gran', [
            "First, the Tidyhouse, down in Meadowfold, south of town. Then you'll find the rest; they're not hard to find. They want to be found.",
            "{happy}And whatever happens, love: the Way always brings you home.",
        ]);
        yield* say('ives', "{cross}And wipe your feet!");
        /* the town goes back to its day: everyone walks off a little way, then about their business */
        /* (Bram picks his pot up again first) */
        if (pot) { a.remove(pot); bram.holding = 'bram_pot'; }
        for (const n of added) { const away = n.tx < ox + 30 ? [-4, 1] : n.tx > ox + 31 ? [4, 1] : [0, 4]; n.walkTo(n.tx + away[0], n.ty + away[1]); }
        for (let i = 0; i < 70 && added.some(n => n.walking); i++) yield 1;
        for (const n of added) { Fx.poof(n.px + 8, n.py + 8); a.remove(n); yield 3; }
        G.hideHud = false;
        Progress.setGoal('Find the Tidyhouse in Meadowfold, south of town, and tie its Knot.');
        UI.toast('[atk] swings the Wanderstaff.', 200);
        Save.autosave();
    },
};
ITEM_LINES.staff = () => 'You got the {red}Wanderstaff{/}! Press [atk] to swing it: it knocks light things aside and flips crystals.';

/* someone with something in their hands (Bram's pot at the ceremony, Gundry's rag): held out in front of them, or seen
   at their side when they've their back to us */
{
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        draw0.call(this, cx, cy);
        const im = this.holding && spr(this.holding), body = im && this.sprite();
        if (!body) return;
        const sx = this.px - cx, top = this.py - cy - (body.height - T) - 2;
        const x = this.dir === LEFT ? sx - 3 : this.dir === RIGHT ? sx + 19 - im.width : this.dir === UP ? sx + 18 - im.width : sx + 8 - im.width / 2;
        Gfx.img(im, Math.round(x), top + 10);
    };
}
function initPrologue() {
    /* a little glazed pot, one of Bram's */
    defSprite('bram_pot', ['..kkkkkk..', '.kyyoooOk.', '..kkkkkk..', '.koooooOk.', 'kyoooooOOk', 'kyooooOOOk', 'koooooOOOk', '.kOOOOOOk.', '..kkkkkk..'], { o: '#c8743a', O: '#9a5228', y: '#e8a060' });
}
CONTENT_INIT.push(initPrologue);
