/* Cut free: townsfolk whose threads the Shears have cut walk where they like (a little round of their own, in town),
   say something new, and do things they haven't done in years. Old Arlo walks down to the river (S24). */

const CUT_LINES = {
    quill: "Miss Quill blinks, takes off her spectacles, and looks at the schoolhouse as if she'd never seen it from outside. \"I used to walk the children up the hill,\" she says. \"Every spring. Why did we stop?\"",
    arlo: "Old Arlo stands up without his stick. \"Well,\" he says. \"WELL.\" And he sets off east, towards the river, not fast, but going.",
    bram: "Bram rolls his shoulders, laughs like a kiln door banging open, and says, \"I've a mind to go and dig some new clay. FRESH clay. From somewhere I've never been!\"",
    hob: "Fisher Hob looks at the river. Then up it. \"There's a pool up past the bend,\" he says slowly. \"My dad fished it. I haven't been since I was your age.\"",
    gundry: "Gundry wipes his hands on his apron for a long time. \"Forty years oiling one winch,\" he says. \"I think I'll go and look at the sea. Is there a sea? There must be a sea.\"",
    burr: "Constable Burr takes off his helmet. He looks at his post. He looks at the open road north. \"Go on, then,\" he says, to himself this time, and laughs.",
    tuck: "Tuck goes very still, and then very fast. \"I can go ANYWHERE!\" He doesn't go anywhere. He hugs your leg. Then he goes everywhere.",
    rosa: "Rosa puts down her rolling pin. \"I've always wanted to bake for somebody who doesn't live here,\" she says. \"Is that silly?\"",
    thimble: "Thimble counts her buttons, stops halfway, and laughs. \"I'll go to market. A real one. In another town!\"",
    seam: "Sebastian Seam lets out the breath he's been holding for twenty years and starts measuring you for a travelling coat.",
    mabel: "Auntie Mabel looks at her shelves of strays, every one with its little L, and starts to cry, and then to smile.",
    mallow: "Doctor Mallow yawns, stretches, and for the first time in your memory, looks wide awake.",
    ives: "Mother Ives straightens your collar. \"I'll keep the Tidyhouse,\" she says. \"Because I want to. Not because I'm tied to it. That's the difference, love.\"",
    ambrose: "Your dad picks you up and swings you round, the way he did when you were small. \"Let's go and see where the river goes,\" he says. \"All of us.\"",
    tess: "Your mum rings a little bell she keeps in her pocket, just once, just for the sound. \"There,\" she says. \"I've always wanted to ring something for no reason at all.\"",
    jory: "Jory clicks his heels. \"A touring show!\" he says. \"The Marionette Hall, on wheels! Why not?\"",
    nell: "Nell runs. All the way to the posts. And past them. And back again, shrieking.",
    otto: "Otto puts the crate down where it is and walks away from it, and it stays there, and he looks back at it, astonished.",
    bea: "Bea starts a game of tag and doesn't stop.",
};
/* each freed townsperson's own little round in town (hub tiles), and where Arlo's walk ends */
const FREE_ROUTES = {
    quill: [[10, 30, 120], [20, 27, 60], [28, 24, 90]],
    arlo: [[40, 24, 30], [46, 26, 9999]],
    bram: [[34, 24, 90], [38, 29, 60], [30, 27, 60]],
    hob: [[48, 22, 90], [47, 33, 200]],
    gundry: [[33, 20, 60], [29, 27, 60], [24, 22, 80]],
    burr: [[32, 6, 60], [31, 14, 60], [33, 20, 90]],
    tuck: [[7, 32, 40], [15, 28, 30], [22, 26, 30], [12, 24, 30]],
};
const HUB_OFF = [64, 40];
function freeRoute(who) { const r = FREE_ROUTES[who]; return r ? r.map(([x, y, w]) => [x + HUB_OFF[0], y + HUB_OFF[1], w]) : null; }
const Freed = {
    count() { return Object.keys(Progress.flags).filter(k => k.startsWith('cut:') && k !== 'cut_self').length; },
    free(n) {
        n.ret = null; n.cutFree = true;
        const r = n.area && n.area.id === 'hollow' ? freeRoute(n.who) : null;
        if (r) { n.route = r; n.ri = 0; n.routeWait = 20; n.free = true; }
    },
    tick(a) {
        /* S24: Old Arlo at the river, if you followed him */
        if (Progress.flag('cut:arlo') && !Progress.flag('s24')) {
            const arlo = a.ents.find(e => e.kind === 'npc' && e.who === 'arlo'), p = G.player;
            if (arlo && p && arlo.tx === 46 + HUB_OFF[0] && arlo.ty === 26 + HUB_OFF[1] && Math.hypot(p.tx - arlo.tx, p.ty - arlo.ty) <= 3 && !Script.blocking()) {
                Progress.set('s24'); Stats.count('secret:arlo');
                Script.run(function* () {
                    yield* say('arlo', "Ah. You followed me. Good. I wanted somebody to see.");
                    yield* say('arlo', "This is where the lake comes down, if you keep on along the bank. I used to walk it every morning, when I was a lad. Then I didn't. I don't remember deciding to stop.");
                    yield* say('arlo', "Here. Found this in the water years ago and could never walk far enough to give it back. I think it's meant for a Wanderer.");
                    yield* Story.getItem('heartpatch', 'arloPatch')();
                });
            }
        }
    },
};
Shears.onPersonCut = n => Freed.free(n);
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        for (const e of a.ents) if (e.kind === 'npc' && Progress.flag('cut:' + e.who)) Freed.free(e);
        return a;
    };
    const tick0 = OW.blocks['1,1'].tick;
    OW.blocks['1,1'].tick = a => { if (tick0) tick0(a); Freed.tick(a); };
}
