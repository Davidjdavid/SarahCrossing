/* The Makings' last Little House: Wren's own. After the Grand Hall, Gundry hands her an empty one ("Your turn. Make
   one."): up top, two little rooms with a wall between them and a gap at either end of it, Tuck's door in the west wall
   and the hoop in the east room; underneath, a room for her, with the Makers sat along its wall to watch. Three of the
   Guild's things stand on their marks by the wall (a wooden block, a pot, a stone block), a button waits in a tin, and
   there are two levers. She sets it out from underneath with what she has (the Needle gives a thing a place, a knot
   holds it, a tug sends it home), tells the tin which thing the button goes under, and pulls the lever that lets Tuck
   in. From then on it's a Making like any other: he walks it by his rules, she works it from below, and the Makers
   grade it in the same three Ahas as ever. However it goes, it's done: he gets to the hoop; or he sits stuck with
   nothing moving till he gives up; or she calls him out with the lever. Her House stays as she left it between goes
   (the stitches are the Needle's own; her knots and the button are kept here), and the other lever sets it all back
   the way Gundry had it, any time he isn't in.
   It's the ninth Little House (making9; the eight before keep their numbers), and the act ends with it: the Way Down
   opens once it's done. A save from an act already finished has it there to play, and nothing else changes. */

const CAP_N = MAKINGS.length + 1, CAP_ID = 'making' + CAP_N;
const CAP_DOOR = 58;                         /* its little door on the Making Floor, east of the eighth */
const CAP_START = [1, 5];                    /* where Tuck comes in, just inside his door */
/* the Guild's three things, on their marks by the wall (above, room coordinates) */
const CAP_KIT = [
    { id: 'capW', k: 'wood', x: 7, y: 2, noun: 'the wooden block' },
    { id: 'capP', k: 'pot', x: 7, y: 5, noun: 'the pot' },
    { id: 'capS', k: 'block', x: 7, y: 8, noun: 'the stone block' },
];
const CAP_HMPH = 600, CAP_SULK = 1500;       /* sat with nothing moving: a word after ten seconds; after twenty-five, he gives up */
const CAP_MAKERS = ['ives', 'bram', 'ambrose', 'tess', 'mallow', 'jory'];

MAKINGS.push({ name: 'Your Turn', by: 'you', entry: { x: 9, y: 16 } });
MAKING_NAMES.push(MAKINGS[CAP_N - 1].name);
MAKING_DOOR_X.push(CAP_DOOR);

/* ---------------- the kit underneath: the button's tin, and the two levers ---------------- */
/* the tin: say which thing the button goes under, and up that thing's cord it goes (its lid off while it's up there) */
class CapTin extends GridThing {
    constructor(tx, ty, p = {}) { super('captin', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); }
    interact() { Capstone.tin(this.area); return true; }
    sprite() { return spr(Capstone.button() ? 'captin_open' : 'captin'); }
}
SPAWN.captin = (x, y, p) => new CapTin(x, y, p);
/* the lever that lets him in (pulled again while he's in: call him out) */
class CapLever extends Lever {
    interact() { Capstone.lever(this.area, this); return true; }
}
SPAWN.caplever = (x, y, p) => new CapLever(x, y, p);
/* Gundry's lever: everything up there set back as he had it */
class CapReset extends Lever {
    interact() { Capstone.reset(this.area, this); return true; }
}
SPAWN.capreset = (x, y, p) => new CapReset(x, y, p);
/* a paper tag on the cord of whatever the button's under (so she can see, from below, which one it is) */
class CapTag extends Ent {
    constructor() { super('captag'); }
    cord() {
        const id = Capstone.button(), e = id && this.area.find(id);
        return e ? this.area.ents.find(o => o.kind === 'cord' && o.thing === e && o.pos) || null : null;
    }
    get sortY() { const c = this.cord(); return c ? c.sortY + 1 : -9999; }
    draw(cx, cy) {
        const c = this.cord(); if (!c) return;
        const x = c.pos[0] * T + 8 - cx + 3, y = c.pos[1] * T - cy - 6;
        Gfx.line(x - 2, y, x, y + 1, '#8a6a4e');
        Gfx.rect(x, y - 1, 6, 5, PAL.ink); Gfx.rect(x + 1, y, 4, 3, '#fbf3df'); Gfx.rect(x + 2, y + 1, 2, 1, '#6ec0ee');
    }
}

/* ---------------- the House ---------------- */
const CAP_NOTE = "YOUR TURN. The three things up there are yours to set out: give them places (the Needle), tie them, or leave them be. Tell the tin which one the button goes under. The red lever lets him in. Mine sets it all back the way I had it. -G.";
defMaking(CAP_N, {
    /* up top: two little rooms, a gap at each end of the wall between them; his door on the west, the hoop on the east */
    '0,0': {
        name: 'The House Upstairs',
        rows: ['####################', '#........#.........#', '#..................#', '#........#.........#', '#........#.........#', '.........#.........#', '#........#.........#', '#........#.........#', '#..................#', '####################', '####################'],
        ents: [{ k: 'littlehoop', x: 17, y: 5 }, ...CAP_KIT.map(t => ({ k: t.k, x: t.x, y: t.y, id: t.id, stitchName: t.noun }))],
    },
    /* underneath: hers; the kit along the wall (under the wall up top, so no cord ever hangs where they stand) */
    '0,1': BELOW_ROOM('Under the House', '0,0', '', [
        { k: 'memo', x: 1, y: 9, say: () => CAP_NOTE },
        { k: 'captin', x: 3, y: 9 },
        { k: 'capreset', x: 5, y: 9 }, { k: 'sign', x: 6, y: 9, text: "GUNDRY'S LEVER. Sets it all back the way I had it. (Not while he's in.) -G." },
        { k: 'caplever', x: 7, y: 9 }, { k: 'sign', x: 8, y: 9, text: 'LET HIM IN. (And pulled again while he is: out he comes.)' },
        ...CAP_MAKERS.map((who, i) => ({ k: 'npc', who, x: 11 + i, y: 9, face: 'up' })),
    ]),
}, {
    up: 'tidy', thread: THREAD.guild, entry: MAKINGS[CAP_N - 1].entry, noNudges: true,
    onEnter: a => { Making.start(a); Capstone.enter(a); },
    tick: a => { Making.tick(a); Capstone.tick(a); },
    talk: Object.fromEntries(CAP_MAKERS.map(who => [who, function* () { yield* say(who, cycle('cap_' + who + (Progress.flag(CAP_ID) ? '2' : ''), CAP_TALK[who][Progress.flag(CAP_ID) ? 1 : 0])); }])),
});
/* the Makers, sat along the wall underneath, while she sets it out (and after, when she makes another) */
const CAP_TALK = {
    ives: [["Set it out tidy, love. He notices.", "Whatever you hide it under, he'll want to find it. That's the fun."], ["Another one? I'll fetch the duster.", "You've set that pot crooked. ...No, leave it. It's yours."]],
    bram: [["Make it HARD. ...Not that hard. He's six.", "HA! I've never sat on this side of the floor. My knees don't like it."], ["Another! Harder! HA!", "Mine had a hound in it. Just saying."]],
    ambrose: [["We'll be quiet as anything, love. Quieter than in the Millrace. That was me. Sorry.", "Mind where he'll sit. He always sits somewhere."], ["He's asked to do yours again, you know. Twice.", "Your mum's got a hanky out. Don't look."]],
    tess: [["Your first House! I've come over all goosebumps, bairn.", "Don't let him see your hands. That's all of it, really."], ["We could watch these all day, couldn't we.", "That's my bairn's House, that is."]],
    mallow: [["*yawn* Wake me when he's in. Or don't. I'll know.", "I'll just rest my eyes. It helps me watch."], ["*yawn* Lovely. Again. I'll rest my eyes.", "I dreamt you made another one. And here we are."]],
    jory: [["Opening night! I've brought a hanky. Two. One's for Ives.", "Places, everyone! ...Oh. We're in them."], ["Encore!", "From the top! With feeling!"]],
};

/* its door on the Making Floor: open once the eighth is done */
AREAS.underside.ents.push(
    { k: 'warp', x: CAP_DOOR, y: 1, to: CAP_ID, tx2: MAKINGS[CAP_N - 1].entry.x, ty2: MAKINGS[CAP_N - 1].entry.y, dir: 'up', face: 'up', room: '2,0', if: 'making' + (CAP_N - 1) },
    { k: 'deco', x: CAP_DOOR, y: 0, look: 'littledoor', solid: false, baseY: -100, room: '2,0', if: 'making' + (CAP_N - 1) },
    { k: 'deco', x: CAP_DOOR, y: 0, look: 'littledoor_shut', solid: false, baseY: -100, room: '2,0', if: '!making' + (CAP_N - 1) },
    { k: 'memo', x: CAP_DOOR - 1, y: 1, room: '2,0', say: () => Progress.flag('cap_given') || Progress.flag(CAP_ID) ? `MAKING ${CAP_N}: YOUR TURN. (By {name}, it says, in Gundry's chalk.)` : `MAKING ${CAP_N}: (no name chalked on it yet). Opens when the eighth is done.` },
);

/* ---------------- setting it out, letting him in, and the grading ---------------- */
const Capstone = {
    run: null,              /* while Tuck's in: { t0, quiet, hmph, button, setOut, yanks0, pushes0 } */
    ending: false,
    flag(n) { const f = Progress.areaFlags[CAP_ID]; return f ? f[n] : undefined; },
    setFlag(n, v) { Progress.setAreaFlag(CAP_ID, n, v); },
    /* whatever the button's under (an id of the kit), or null: it's still in the tin */
    button() { return this.flag('cap:button') || null; },
    kit(a) { return CAP_KIT.map(k => a.find(k.id)).filter(Boolean); },
    noun(id) { const k = CAP_KIT.find(q => q.id === id); return k ? k.noun : 'it'; },
    up(a) { return a.rooms.find(r => r.key === '0,0'); },
    treasure(a) { return a.ents.find(e => e.kind === 'treasure' && e.cap && !e.removed) || null; },
    /* the House built afresh: as she left it (the stitches are the Needle's; her knots and the button are kept here) */
    enter(a) {
        this.run = null; this.ending = false;
        if (!Progress.flag('cap_given')) Progress.set('cap_given');
        for (const id of this.flag('cap:knots') || []) { const e = a.find(id); if (e && !e.knotted) Spool.knot(e, true); }
        this.placeButton(a);
        a.add(new CapTag());
        if (!Progress.flag('cap_seen')) {
            Progress.set('cap_seen');
            Script.run(function* () { yield 20; yield* say(null, 'Up through the boards: an empty Little House. Three things by the wall, a hoop at the far end, and nobody in it yet.'); });
        }
    },
    /* the button, up there under whatever it's under (or nowhere, while it's in the tin) */
    placeButton(a) {
        const tr = this.treasure(a), id = this.button(), e = id && a.find(id);
        if (!e) { if (tr) a.remove(tr); return; }
        if (tr) { tr.tx = e.tx; tr.ty = e.ty; tr.x = e.tx * T; tr.y = e.ty * T; return; }
        const t = new Treasure(e.tx, e.ty); t.cap = true; a.add(t);
    },
    /* has anything been set out (a place given, a knot tied) or does it all stand as Gundry left it? */
    setOut(a) {
        const r = this.up(a);
        return this.kit(a).some(e => {
            const k = CAP_KIT.find(q => q.id === e.id);
            return e.knotted || e.tx !== r.x + k.x || e.ty !== r.y + k.y;
        });
    },
    tick(a) {
        if (this.ending) return;
        const r = this.run;
        if (!r) {
            /* setting out: the button goes where its thing goes; her knots are kept as she ties them */
            if (this.button()) this.placeButton(a);
            const knots = this.kit(a).filter(e => e.knotted).map(e => e.id), was = this.flag('cap:knots') || [];
            if (knots.join() !== was.join()) this.setFlag('cap:knots', knots);
            return;
        }
        /* he's in: sat with nothing moving (nothing up there on the move, nobody at a cord or the Needle), he waits a
           while, says so, and then gives up */
        const t = a.find('tuck');
        if (!t || t.state === 'done' || Script.blocking()) return;
        const up = this.up(a);
        const moving = !!t.mv || !!Spool.pull || !!Needle.st || a.ents.some(e => e.isGrid && e !== t && e.mv && !e.person && a.roomAt(e.tx, e.ty) === up);
        if (t.state === 'sit' && !moving) r.quiet++; else { r.quiet = 0; r.hmph = false; }
        if (r.quiet >= CAP_HMPH && !r.hmph) { r.hmph = true; t.say('Is this IT?', 'dots'); }
        if (r.quiet >= CAP_SULK) this.finish(a, 'stuck');
        /* (the Makers' little bubbles go again after a moment) */
        for (const n of a.ents) if (n.kind === 'npc' && n.bubbleT > 0 && --n.bubbleT === 0) n.bubble = null;
    },
    /* the Makers underneath, all at once: a heart, an exclamation, a sigh */
    react(a, bubble, dur = 70) { for (const n of a.ents) if (n.kind === 'npc' && CAP_MAKERS.includes(n.who)) { n.bubble = bubble; n.bubbleT = dur; } },
    tin(a) {
        if (this.ending) return;
        Script.run(function* () {
            const cur = Capstone.button();
            if (Capstone.run) { yield* say(null, cur ? `The tin's empty: the button's up there under ${Capstone.noun(cur)}.` : "There's the button, in its tin. Too late to hide it now: he's in."); return; }
            const opts = CAP_KIT.map(k => 'Under ' + k.noun);
            const i = yield* ask(null, cur ? `The button's up under ${Capstone.noun(cur)}. Move it?` : "Gundry's button, in a tin: a shiny one, for hiding. Under which?", [...opts, cur ? 'Back in the tin' : 'Leave it in the tin']);
            if (i < 0) return;
            const id = i < CAP_KIT.length ? CAP_KIT[i].id : null;
            if (id === cur) return;
            Capstone.setFlag('cap:button', id || false);
            Capstone.placeButton(a);
            Sfx.play(id ? 'tug' : 'click');
            UI.toast(id ? `You tie the button to its cord, and up it goes: it's under ${Capstone.noun(id)} now.` : 'You let the button back down its cord and into the tin.', 160);
        });
    },
    lever(a, lever) {
        if (this.ending) return;
        if (!this.run) { this.letIn(a, lever); return; }
        Script.run(function* () {
            const i = yield* ask(null, "He's in. Call him out?", ['Call him out', 'Leave him be']);
            if (i === 0 && Capstone.run && !Capstone.ending) Capstone.finish(a, 'called');
        });
    },
    letIn(a, lever) {
        const up = this.up(a), [sx, sy] = [up.x + CAP_START[0], up.y + CAP_START[1]];
        if (a.at(sx, sy)) { UI.toast('Up above, something is standing just inside his door. He can\'t get in past it.', 160); Sfx.play('hitthing'); return; }
        Making.start(a);
        this.run = { t0: G.t, quiet: 0, hmph: false, button: this.button(), setOut: this.setOut(a), yanks0: Stats.c['tuck:yanked'] || 0, pushes0: Stats.c['tuck:push'] || 0 };
        this.placeButton(a);
        this.setFlag('cap:knots', this.kit(a).filter(e => e.knotted).map(e => e.id));
        const t = a.add(new Tuck(sx, sy, { id: 'tuck', face: 'right' }));
        t.seen = G.t; t.wait = 40;     /* (a moment to look about him; and nothing that jumped before he came in counts) */
        Fx.poof(t.px + 8, t.py + 8);
        t.say('Ooh! A NEW one!', 'heart');
        lever.on = true; Sfx.play('click'); Sfx.play('door');
        Stats.count('cap:runs');
        if (!Progress.flag('cap_letin')) { Progress.set('cap_letin'); UI.toast('Up above, his little door swings open, and in comes Tuck.', 150); }
    },
    /* Gundry's lever: every thing up there back on its first mark, untied and unstitched, the button back in its tin */
    reset(a, lever) {
        if (this.ending) return;
        if (this.run) { UI.toast("Not while he's in. Let him finish, or call him out with the red lever.", 160); Sfx.play('hitthing'); return; }
        const up = this.up(a), kit = this.kit(a), mine = (Inv.stitches || []).filter(s => s.area === CAP_ID);
        const changed = this.setOut(a) || !!this.button() || mine.length > 0;
        lever.on = !lever.on; Sfx.play('click');
        if (!changed) { UI.toast("It's all just as Gundry left it.", 120); return; }
        Inv.stitches = (Inv.stitches || []).filter(s => s.area !== CAP_ID);
        for (const e of kit) { a.unplace(e, e.tx, e.ty); if (e.mv) a.unplace(e, e.mv.fx, e.mv.fy); }
        for (const e of kit) {
            const k = CAP_KIT.find(q => q.id === e.id), x = up.x + k.x, y = up.y + k.y;
            if (e.knotted) { e.knotted = false; e.fixed = e._fixed0; e.liftable = e._lift0; }
            e.mv = null; e.tx = x; e.ty = y; e.x = x * T; e.y = y * T; e.z = 0; e.jolt = 0; a.place(e, x, y);
            const r = e.ret;
            if (r) { r.mx = x; r.my = y; r.trace = [[x, y]]; r.state = 'home'; r.snap = false; r.timer = 0; r.strain = 0; if (r.color0) r.color = r.color0; }
            e.stitched = false;
            Fx.poof(x * T + 8, y * T + 8);
        }
        this.setFlag('cap:knots', []); this.setFlag('cap:button', false);
        this.placeButton(a);
        Sfx.play('door');
        UI.toast('Up above, it all goes back the way Gundry had it: each thing on its mark, untied, and the button back in its tin.', 180);
    },
    /* what happened, for the grading: from the run itself */
    facts(a, how) {
        const c = Making.cur || { ahas: new Set(), bumps: 0 }, r = this.run || {};
        return {
            how, n: c.ahas.size, bumps: c.bumps, cleared: c.ahas.has('cleared'), found: c.ahas.has('found'),
            button: r.button || null, setOut: !!r.setOut,
            yanked: (Stats.c['tuck:yanked'] || 0) - (r.yanks0 || 0), pushes: (Stats.c['tuck:push'] || 0) - (r.pushes0 || 0),
            secs: Math.round((G.t - (r.t0 || G.t)) / 60),
        };
    },
    /* the Makers' say: one thing each, about what really happened (how it went, the button, any scrapes), and Jory to finish */
    grade(f, first) {
        const out = [], used = new Set();
        const add = (whos, line) => { const w = [].concat(whos).find(q => !used.has(q)); if (!w || out.length >= 3) return; used.add(w); out.push([w, line]); };
        if (f.how === 'stuck') add(['bram', 'ives'], "He sat in your House till he gave up. Every Maker builds one of those. Once.");
        else if (f.how === 'called') add(['ambrose', 'tess'], "Called in for his tea. Fair enough. I'd have gone too.");
        else if (!f.setOut && !f.pushes) add(['bram', 'ambrose'], "In one door and out the other. That's not a House, that's a corridor. HA!");
        else if (f.cleared) add(['ives', 'tess'], "He moved that himself. He'll be telling everyone for a week.");
        if (f.found) add({ capP: ['tess', 'ambrose'], capW: ['ambrose', 'tess'], capS: ['bram', 'tess'] }[f.button] || ['tess'], { capP: 'Under the pot! Oldest trick there is. Still works.', capW: 'Under the block! He went pink.', capS: "Under the heavy one. He'll say he lifted it. Let him." }[f.button] || 'He found it!');
        else if (f.button) add(['mallow', 'ives'], `*yawn* The button's still under ${this.noun(f.button)}. Somebody should tell him. Not me.`);
        else add(['ives', 'tess'], "No button? There's always a button, love.");
        if (f.bumps === 1) add(['tess', 'ambrose'], "One bump. He'll be showing everyone the bruise.");
        else if (f.bumps > 1) add(['tess', 'ambrose'], `${numWords(f.bumps).replace(/^\w/, s => s.toUpperCase())} bumps. Oh, his poor knees.`);
        else if (f.yanked > 0) add(['ives', 'mallow'], 'And you pulled his thread. I saw that.');
        else if (f.secs > 240) add(['mallow', 'ambrose'], 'That was a long one. I had a little nap in the middle. Lovely.');
        if (first) out.push(['jory', 'What did I tell you? On the stage? I SAID.']);
        else if (f.n === 3) out.push(['jory', 'BRAVO.']);
        return out;
    },
    finish(a, how) {
        if (this.ending) return;
        this.ending = true;
        const t = a.find('tuck'), c = Making.cur;
        if (t) { t.state = 'done'; t.cur = null; }
        if (how === 'hoop' && c && c.bumps === 0) Making.aha('unhurt');
        const f = this.facts(a, how);
        Script.run(function* () {
            yield 30;
            if (how === 'hoop') Sfx.play('knot');
            yield* say('tuck', how === 'stuck' ? "This one doesn't GO anywhere. I'm going OUT." : how === 'called' ? 'Is it tea? Is it CAKE?' : f.n === 3 ? 'I DID IT! That was the BEST one. Who made it?' : 'I DID IT! Did you see? ALL by MYSELF!');
            const first = !Progress.flag(CAP_ID);
            Progress.set(CAP_ID);
            const best = CAP_ID + '_ahas';
            if (f.n > (Progress.get(best) || 0)) Progress.set(best, f.n);
            Stats.count('cap:' + how);
            const name = MAKING_NAMES[CAP_N - 1].toUpperCase();
            yield* say(null, `${name}: done${how === 'stuck' ? ', though he never got to the hoop' : how === 'called' ? ', called in for his tea' : ''}. Ahas: ${f.n} of 3. Bumps: ${f.bumps}.`);
            Capstone.react(a, f.n === 3 ? 'heart' : f.how === 'hoop' ? 'bang' : 'dots', 400);
            for (const [who, line] of Capstone.grade(f, first)) yield* say(who, line);
            Capstone.react(a, null, 0);
            if (MAKINGS.every((_, i) => (Progress.get('making' + (i + 1) + '_ahas') || 0) >= 3) && !Progress.flag('s30')) {
                Progress.set('s30'); Stats.count('secret:ahas');
                yield* say('tuck', "I drew you a picture! It's you. Well, it's a Maker. I don't know which one. It's whoever helped. Somebody helped. I could tell.");
                Inv.items.tuckdrawing = 1;
                yield* say(null, "You got Tuck's drawing: a stick figure under a floor, holding a lot of strings, smiling.");
            }
            yield* fadeOut(20);
            World.enter('underside', CAP_DOOR, 2, { dir: DOWN });
            yield* fadeIn(20);
            Capstone.ending = false; Capstone.run = null;
            if (!Progress.flag('makings_done') && MAKINGS.every((_, i) => Progress.flag('making' + (i + 1)))) yield* Making.afterAll();
            Save.autosave();
        });
    },
    /* after the Grand Hall, the first time: Gundry brings the empty one over */
    *handOver() {
        if (Progress.flag('cap_given')) return;
        Progress.set('cap_given');
        const a = G.map, p = G.player, g = a && a.id === 'underside' ? a.ents.find(e => e.kind === 'npc' && e.who === 'gundry') : null;
        if (g && p) {
            yield* say(null, 'Through the door from the Guild Hall comes Gundry, with a little wooden House under his arm. There is nothing in it.');
            yield* Making.fetch(g, p);
        }
        yield* say('gundry', "Not done yet, apprentice. Here. An empty one: a room up top, a room under, three things, a button and a hoop.");
        yield* say('gundry', 'Your turn. Make one.');
        yield* say('tuck', 'ANOTHER one? Who made it?');
        yield* say('gundry', 'Nobody, yet.');
        Progress.setGoal("The Making Floor's last little door: set out a Little House of your own, hide the button, then let Tuck in.");
        if (g) g.walkTo(31, 3, 1);
    },
    /* on the Making Floor: anything the act still owes (a save from before it was here, or one made in the middle of a
       speech) is paid as soon as Wren's back on the Floor */
    floorTick(a) {
        const p = G.player;
        if (!p || p.area !== a || p.state !== 'normal' || Script.blocking() || Dialog.active || Progress.flag('makings_done')) return;
        const r = a.roomAt(p.tx, p.ty);
        if (!r || r.key !== '2,0') return;
        if (MAKINGS.every((_, i) => Progress.flag('making' + (i + 1)))) { Script.run(Making.afterAll()); return; }
        if (Progress.flag('making' + (CAP_N - 1)) && !Progress.flag('cap_given')) Script.run(Capstone.handOver());
    },
};
MAKINGS[CAP_N - 2].then = function* () { yield* Capstone.handOver(); };

/* Tuck at the hoop of hers: graded here (the eight before keep theirs) */
{
    const finish0 = Making.finish;
    Making.finish = function (a) { if (a && a.def.making === CAP_N) return Capstone.finish(a, 'hoop'); return finish0.call(this, a); };
    /* an Aha in her House: the Makers underneath can't help themselves */
    const aha0 = Making.aha;
    Making.aha = function (id) {
        const had = this.cur && this.cur.ahas.has(id);
        aha0.call(this, id);
        const a = G.map;
        if (!had && a && a.def.making === CAP_N && !Capstone.ending) Capstone.react(a, 'heart');
    };
    /* (and a bump: they all wince) */
    const bump0 = Tuck.prototype.bump;
    Tuck.prototype.bump = function (why) { bump0.call(this, why); if (this.area && this.area.def.making === CAP_N) Capstone.react(this.area, 'bang'); };
    const ut0 = AREAS.underside.tick;
    AREAS.underside.tick = a => { if (ut0) ut0(a); Capstone.floorTick(a); };
}
/* on the Making Floor meanwhile */
{
    const tuck0 = UNDER_TALK.tuck, otto0 = UNDER_TALK.otto;
    const between = () => Progress.flag('making' + (CAP_N - 1)) && !Progress.flag(CAP_ID) && !Progress.flag('makings_done');
    UNDER_TALK.tuck = function* (n) {
        if (between()) { yield* say('tuck', cycle('tuck_cap', ["Gundry says the last one's EMPTY. How can a House be empty? Where do you GO?", "I'm not scared of an empty House. Nobody's even made it yet."])); return; }
        yield* tuck0(n);
    };
    UNDER_TALK.otto = function* (n) {
        if (between()) { yield* say('otto', "An empty House? Then there's nothing out of its place. Nothing to TIDY. That's the worst kind."); return; }
        yield* otto0(n);
    };
}

function initCapstone() {
    /* a round biscuit tin with a button painted on its lid; open, the lid leant against it and nothing inside */
    defSprite('captin', ['................', '................', '................', '................', '................', '....kkkkkkkk....', '...kwwwwwwwwk...', '..kwwbbbbbbwwk..', '..kwbbkbbkbbwk..', '..kwwbbbbbbwwk..', '..kkkkkkkkkkkk..', '..kRrrrrrrrrRk..', '..kRrrrrrrrrRk..', '..kRRRRRRRRRRk..', '...kkkkkkkkkk...', '................'],
        { w: '#d8dce4', b: '#6ec0ee', r: '#c42b4a', R: '#8a1e34' });
    defSprite('captin_open', ['................', '................', '................', '.........kkk....', '........kwwwk...', '.......kwbbwk...', '.......kwbbwk...', '..kkkkkkkwwk....', '..kddddddkkk....', '..kkkkkkkkkkkk..', '..kRrrrrrrrrRk..', '..kRrrrrrrrrRk..', '..kRrrrrrrrrRk..', '..kRRRRRRRRRRk..', '...kkkkkkkkkk...', '................'],
        { w: '#d8dce4', b: '#6ec0ee', d: '#3a1a22', r: '#c42b4a', R: '#8a1e34' });
}
CONTENT_INIT.push(initCapstone);
