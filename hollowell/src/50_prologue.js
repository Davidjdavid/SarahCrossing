/* The morning of the Wander: waking up, Gran, the ceremony at the Well. */

const Prologue = {
    start() {
        G.hideHud = true;
        World.enter('gran_room', 6, 3, { dir: DOWN, noSave: true });
        const p = G.player;
        p.x = 7 * T + 8; p.y = 2 * T + 10; p.state = 'sleep';
        UI.fadeA = 1;
        Progress.setGoal('Get up and go downstairs to see Gran.');
        Script.run(function* () {
            yield 30;
            yield* fadeIn(60);
            yield 40;
            yield* say('gran', "{name}! Up you get, love! The whole town's waiting on you, and you're still in bed on your Wander day!");
            yield 20;
            p.state = 'normal'; p.x = 6 * T + 8; p.y = 3 * T + 10; p.dir = DOWN;
            Sfx.play('land'); Fx.dust(p.x, p.y);
            yield 20;
            G.hideHud = false;
            yield* say(null, 'Today you go on your Wander. You have been waiting for this your whole life.');
            Save.autosave();
        });
    },
};

/* Gran, at home, the morning of the ceremony */
TALK.gran = function* (npc) {
    if (!Progress.flag('ceremony')) {
        if (!Progress.flag('talkedGran')) {
            yield* say('gran', [
                "There you are. Let me look at you. Scarf on straight, good. Boots? Good.",
                "Every Wanderer before you walked out of a house just like this one, on a morning just like this one. And every one of them came home. The Way always brings you home.",
                "Now off to the Well with you. I'll be right behind.",
            ]);
            Progress.set('talkedGran');
            Progress.setGoal('Go to the Well in the middle of town, where everyone is waiting.');
        } else yield* say('gran', "Go on, love. The Well. I'll be right behind you.");
        return;
    }
    const lines = Progress.flag('d1') ? GRAN_AFTER_D1 : GRAN_ACT1;
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
    "Your first Knot! Did you feel it? The whole valley sat up a little straighter.",
    "Next is the Kiln, out west in Kilnridge. The road's blocked by that old boulder, but you're a clever thing.",
    "I always knew you'd be good at this. You've your aunt's... well. You've good hands.",
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
        /* the town gathers at the Well */
        const crowd = [['ives', 27, 21, 'up'], ['bram', 34, 21, 'up'], ['rosa', 28, 22, 'up'], ['thimble', 33, 22, 'up'], ['seam', 26, 20, 'right'], ['mallow', 35, 20, 'left'], ['mabel', 30, 22, 'up'], ['quill', 31, 22, 'up']];
        const added = [];
        for (const [who, x, y, f] of crowd) { const n = a.add(new NPC(ox + x, oy + y, { who, face: f })); added.push(n); }
        let gran = a.ents.find(e => e.who === 'gran');
        if (!gran) gran = a.add(new NPC(ox + 29, oy + 20, { who: 'gran', face: 'down' }));
        G.hideHud = true;
        yield 20;
        yield* walkTo(p, ox + 30, oy + 23);
        yield* walkTo(p, ox + 30, oy + 21 + 2);
        p.dir = UP;
        yield 20;
        yield* say('gran', [
            "Hollowell! Hush now, hush. Bram, put the pot down.",
            "Every year the Hollow wakes up a little weaker. Strays turn up that won't go home. The Way forgets itself.",
            "So every so often, one of our young ones goes on the Wander: through the six Houses, to tie the six Knots that hold the Hollow in its shape.",
            "This year, it's {name}.",
        ]);
        for (const n of added) n.bubble = 'heart';
        Sfx.play('appear');
        yield 50;
        for (const n of added) n.bubble = null;
        yield* say('quill', [
            "Ahem. The Rules of the Return, as every child knows them.",
            "One: everything has its place. Two: whatever is moved goes back the way it came. Three: nothing is ever lost in the Hollow.",
        ]);
        yield* say('gran', "And now your Wanderstaff. Your grandad cut it from the old apple tree. It's done this before.");
        yield* Story.getItem('staff')();
        yield* say('gran', [
            "First, the Tidyhouse, down in Meadowfold, south of town. Then you'll find the rest; they're not hard to find. They want to be found.",
            "And whatever happens, love: the Way always brings you home.",
        ]);
        yield* say('ives', "And wipe your feet!");
        for (const n of added) a.remove(n);
        Fx.poof(p.x, p.y - 20);
        G.hideHud = false;
        Progress.setGoal('Find the Tidyhouse in Meadowfold, south of town, and tie its Knot.');
        UI.toast('X swings the Wanderstaff.', 200);
        Save.autosave();
    },
};
ITEM_LINES.staff = () => 'You got the {red}Wanderstaff{/}! Press X to swing it: it knocks light things aside and flips crystals.';
