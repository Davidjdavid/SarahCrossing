/* The town moves on. After each turn of the Wander the townsfolk have something new to say: each line is said once, the
   first times you talk to them after it (only the newest turn's, so nothing comes out stale), and then they're their
   usual selves again. Some of them know more than they let on, before the first reveal. Freed townsfolk's lines are in
   src/73_freed.js (FREE_LINES); the small favours in town are src/51c_town_favours.js. */

const TOWN_STAGES = ['d1', 'd2', 'd3', 'd4', 'd5', 'reveal1', 'd7', 'reveal2', 'd8'];
/* stage -> who -> lines (a line may be a function, for one that depends on how things stand) */
const TOWN_LINES = {
    d1: {
        quill: ["Rule four's up on the board now: heavier shoves lighter. It always goes up the morning after a Wanderer's first Knot. Never a day before. I only hold the chalk."],
        gundry: ["Heard your Knot go, in the night. The old winch gave a turn all on its own. Wind, I expect."],
        rosa: ["One Knot! Tuck's drawn you a twelfth picture. You're holding a cupboard over your head, and the cupboard's crying."],
        arlo: ["One Knot, eh? I felt it in my knees. Like weather coming in. Funny old things, knees."],
        mabel: ["Back from the Tidyhouse, are you? Nothing in there ever goes missing, they say. Lucky old house."],
    },
    d2: {
        bram: ["The Kiln! HA! Hot, was it? And the big fellow, the serpent? Did his tail stick? It's always the tail. ...So I'd imagine."],
        seam: ["I've had a monstrous order this month, {name}. Scales. Hundreds of them, glazed. Don't ask; I'm sworn. I keep a secret the way I keep a hem."],
        quill: ["Rule five: broken things come home in pieces. Tuck smashed his milk jug to see if it was true. The jug came home. The milk didn't."],
        burr: ["Two Knots. Fog's a shade thicker up the road this week. Not that I'm complaining. It's good fog."],
        mallow: ["*yawn* Two Knots already. You know what a Wanderer needs most? Sleep. You know what I haven't had all month? Same answer."],
    },
    d3: {
        rosa: ["Your dad came in for a loaf this morning, wet to the knees. Said he'd fallen in the millpond. Twice. Then he winked, which isn't like him."],
        ives: ["Three Knots! And dry as toast, look at you. I hear some people came home soaking. Not me. I've been here all week. Tidying."],
        gundry: ["Three. The winch turned twice in the night this time. I oiled it. It turned anyway."],
        arlo: ["Hob's stopped walking the bank. Just stands there now. I told him, Hob, you'll take root. He said, too late, Arlo."],
        thimble: ["The Guild's ordered four miles of string this week. FOUR. What are they knitting, a road?"],
    },
    d4: {
        ives: ["What a festival! I was a teeny bit late. Something came up. Several somethings. Have you had cake? Have more cake."],
        bram: ["Did I miss Hesper's speech? I was up to my elbows. In pots. HA! Pots, all week. Nothing but pots."],
        quill: ["Somebody chalked a sixth rule on my board and rubbed it out again. It wasn't me. I'd like to know who. I'd like to know why it was rubbed out even more."],
        hob: ["Pudding's stopped chasing his ball. Just lies there and looks at it. I know how he feels."],
        tuck: ["Did you see the bunting? I helped! I held the end! ...It went back up by itself after, but I HELD it."],
    },
    d5: {
        burr: ["Moved my post in a few steps. The fog's closer than it was. Don't ask how I know. A constable knows."],
        tuck: ["How many Houses are there? Are they the same ones every time? Will they still be there when I'm big? Will they WAIT for me?"],
        rosa: ["Your gran's looking tired, love. She was out by the Well half the night. Said she couldn't sleep. Said it twice, as if she wanted me to believe it."],
        arlo: ["Five. In my day the whole town walked out past the bridge to meet the Wanderer at five. Singing, if you can believe it. Can't think why we stopped."],
        seam: ["Is that a bedroll? May I? ...Close, even stitching. Lavender thread. Whoever made this knew exactly what they were doing."],
    },
    reveal1: {
        bram: ["So! You know. HA! What a weight off. Mind, I'd still like a word about what you did to that wyrm."],
        ives: ["No more fibbing about the tidying, love. I HAVE been tidying. Only underneath, mostly."],
        mallow: ["*yawn* So you know. Good. Then I can tell you why I'm tired: I've been working a giant sloth's arms on pulleys all month. One gets stiff."],
        rosa: ["You know, don't you? About the Houses. Every grown-up in Hollowell knows. We all found out on our own Wanders. I cried for a week. Then I baked."],
        quill: ["Ah. You've found out. Don't tell the little ones. It's the one rule I'll never put up on the board."],
        seam: ["You saw the scales through my back window. Of course you did. The next Wanderer's getting a dragon. Not a word, {name}."],
    },
    d7: {
        tuck: ["I'm doing a LITTLE Wander! Miss Quill says it's practice. I've been practising being brave. Twice!"],
        rosa: ["Tuck's Little Wander. You'll keep an eye on him, won't you? From wherever it is you lot keep an eye from. Let him get stuck. Only a little bit stuck."],
        thimble: ["So THAT'S what the Guild wants all that string for. Thirty years I've sold it them, and I never once asked."],
        ives: ["An apprentice! Shoes off in the workshop, mind. And remember, love: a Maker never tells. Not even when it's very, very funny."],
        arlo: ["You've sawdust on your sleeve, {name}. And a bit of thread. Somebody's teaching you something. Like the old days."],
        nell: ["Tuck's doing a Little Wander and he's only SIX. I'm EIGHT. Nobody's made ME a Little Wander."],
    },
    reveal2: {
        arlo: ["You've seen something. You've the look your aunt had, the week before she went. Sit a minute. No? No."],
        burr: ["Your gran's shut herself in. Warden's orders: nobody's to fuss. I'm fussing. Quietly."],
        quill: ["Somebody wrote a seventh rule on my board in the night. Pressed so hard the chalk snapped. I haven't rubbed it out. I'm not sure I'm allowed to."],
        rosa: ["I took your gran a loaf. She said through the door, leave it on the step, love. And the loaf went home before she'd opened it. Everything goes home."],
        hob: ["You keep looking at my boots. What is it? ...Is it the thread? I always thought I'd made that up."],
        bea: ["Everyone's gone quiet. Grown-ups go quiet when there's a secret. I'm keeping a list."],
    },
    d8: {
        quill: ["The First Spinner's own Shears? ...Might I see them? Purely as an educator. Purely."],
        rosa: [() => Progress.flag('cut:hob') ? "Hob's gone up the river! HOB! He waved at me. Forty years I've known that man and I never once saw him wave." : "They say you can cut a body loose with those. I don't know if I'd want it. I don't know that I wouldn't."],
        tuck: [() => Progress.flag('cut:nell') ? "Nell ran past the posts and came back and she's not even in TROUBLE!" : "Are those the scissors? Can you cut MY string? Have I got a string? Mum says not. Mum's looking at the floor."],
        mabel: ["If you cut me loose, I'll still keep the shop. But I might shut it on Tuesdays. Or go and find out who L is."],
        gundry: ["The First Spinner's blades. Carry them points down, Wanderer, and look before you snip. Most threads have somebody on the end."],
    },
};
/* Gran's own: once each, then her usual run of lines (src/50_prologue.js; after the first reveal, new ones, below) */
TOWN_LINES.d2.gran = ["Two Knots! The Kiln's a hot old place. Your grandad came home from it with no eyebrows. Mind yours."];
TOWN_LINES.d3.gran = ["Your dad says you were very brave in the water. He was very wet when he said it. I didn't ask."];
TOWN_LINES.reveal1.gran = ["They told you, then. The Makers. It's a good tradition, love: the best thing this town knows how to do. Every Wanderer looked after, every step of the way."];
TOWN_LINES.d7.gran = ["An apprentice! Gundry's a good man. Mind he doesn't show you anything that'll keep you up at night."];
const GRAN_AFTER_R1 = [
    "Six Knots. There's only the seventh left, at the very end, and that one's mine to give you. Not yet. Soon.",
    "Go down and see the Makers, if they've asked you. Then come home for your tea. Always come home for your tea.",
    "I'm proud of you, love. I'd have you stay just as you are, if I could.",
];
const GRAN_AFTER_D7 = [
    "Tuck's Little Wander. You'll be good to him. You were always good with the little ones.",
    "Come home for your tea. The Spoolworks will keep. Everything keeps, in the Hollow.",
    "I'm proud of you, love. I'd have you stay just as you are, if I could.",
];

const Town = {
    /* the newest turn of the Wander there's been, if this person has something to say about it (nothing said late: a
       line about the third Knot is never said after the fifth) */
    stage(who) {
        for (let i = TOWN_STAGES.length - 1; i >= 0; i--) {
            const s = TOWN_STAGES[i];
            if (Progress.flag(s)) return TOWN_LINES[s][who] ? s : null;
        }
        return null;
    },
    /* the next line of it you haven't heard: said, and true; otherwise false (and they're their usual selves) */
    *news(who, opts = {}) {
        if (!opts.always && !Progress.flag('met:' + who)) return false;
        if (Progress.flag('cut:' + who)) {
            /* cut free, they're somebody new: their own lines from now on (src/73_freed.js) */
            const F = typeof FREE_LINES !== 'undefined' && FREE_LINES[who];
            if (!F) return false;
            yield* say(who, cycle('free_' + who, F));
            return true;
        }
        const s = this.stage(who); if (!s) return false;
        const L = TOWN_LINES[s][who], k = 'news:' + s + ':' + who, n = Progress.get(k) || 0;
        if (n >= L.length) return false;
        Progress.set(k, n + 1);
        const line = L[n];
        yield* say(who, typeof line === 'function' ? line() : line);
        return true;
    },
    /* every line, for the checks (with each function's answer both ways) */
    allLines() {
        const out = [], saved = Progress.flags;
        for (const s of TOWN_STAGES) for (const [who, L] of Object.entries(TOWN_LINES[s])) for (const l of L) {
            if (typeof l !== 'function') { out.push([who, l]); continue; }
            for (const v of [false, true]) {
                Progress.flags = Object.assign({}, saved, { 'cut:hob': v, 'cut:nell': v });
                out.push([who, l()]);
            }
            Progress.flags = saved;
        }
        return out.concat(GRAN_AFTER_R1.map(l => ['gran', l]), GRAN_AFTER_D7.map(l => ['gran', l]));
    },
};

/* Gran: her news first, once each; after the first reveal her usual lines move on too (they'd still say "one more House") */
{
    const g0 = TALK.gran;
    TALK.gran = function* (npc) {
        if (!Progress.flag('ceremony')) return yield* g0(npc);
        if (yield* Town.news('gran', { always: true })) return;
        if (Progress.flag('d7')) { yield* say('gran', cycle('granD7', GRAN_AFTER_D7)); return; }
        if (Progress.flag('reveal1')) { yield* say('gran', cycle('granR1', GRAN_AFTER_R1)); return; }
        yield* g0(npc);
    };
}

/* when the north gate opens (under the town, told only as a far-off grinding), the first time you come out into town
   you're shown it: up the North Road, standing open. (Only coming out through a door: a jump straight into town, as
   the tests make, leaves it to the notice by the gate itself, src/71_loomwood.js.) */
const TownLooks = {
    pending: false,
    /* the Inn, the first time after the first reveal: the Staff door stands ajar (a notice, not a scene: nothing stops) */
    inn(a) {
        if (!Progress.flag('reveal1') || Progress.flag('inn_staffSeen') || Progress.flag('great_pull')) return;
        Progress.set('inn_staffSeen');
        UI.toast('At the back of the Inn, the door marked STAFF ONLY stands ajar. Lamplight, and a hum, come up from below.', 220);
    },
    enter(a, o) { this.pending = !!(o && o.from) && Progress.flag('north_gate') && !Progress.flag('north_gate_seen') && !Progress.flag('great_pull'); },
    tick(a) {
        const p = G.player;
        if (!this.pending || !p || p.area !== a || p.state !== 'normal' || Script.blocking() || Dialog.active || Cam.busy) return;
        if (p.tx < 64 || p.tx >= 128 || p.ty < 40 || p.ty >= 80) return;
        this.pending = false;
        if (Progress.flag('north_gate_seen')) return;
        Progress.set('north_gate_seen');
        Script.run(function* () {
            yield 10;
            yield* camLook(95, 38);
            yield 20;
            yield* say(null, "Up the North Road, past Burr's post: the old stone gate, standing open for the first time in anybody's memory. Beyond it, silver trees.", { focus: [95, 37] });
            yield* camBack();
        });
    },
};
{
    const B = OW.blocks['1,1'], tick0 = B.tick, enter0 = B.onEnter;
    B.tick = a => { if (tick0) tick0(a); TownLooks.tick(a); };
    B.onEnter = (a, o) => { if (enter0) enter0(a, o); TownLooks.enter(a, o); };
}
