/* The Unwinding, the epilogue and the credits; and after: the free valley (everyone walks where they like), the
   Well's new motto (S35), Gran's garden (S11's seed), and a title screen that's changed. */

const Ending = {
    *unwinding() {
        const p = G.player;
        Music.play('silence');
        G.hideHud = true;
        yield 30;
        UI.fadeA = 0; yield* fadeOut(60);
        yield* say(null, 'Every thread in the valley goes slack at once.');
        yield* say(null, 'Then, for a long moment, nothing at all.');
        Progress.set('unwound'); Stats.count('unwound');
        for (const w of ['wren', ...Object.keys(PEOPLE_DEF)]) if (w !== 'wren') Progress.set('cut:' + w);
        World.enter('hollow', 95, 63, { dir: UP, noSave: true });
        G.hideHud = true;
        yield* fadeIn(80);
        Music.play('drift');
        yield 60;
        yield* say(null, 'Up over the roofs, a flock of birds lifts off the bell tower and flies away, out over the edge of the valley, further than anything has ever flown from here.');
        yield 60;
        yield* say(null, 'You watch the sky a long time.');
        yield 40;
        yield* say(null, 'They come back.');
        yield* say(null, 'Old Arlo walks down to the river. Miss Quill takes the children up the hill. Fisher Hob gets into a boat. Nobody, anywhere, is standing on their spot.');
        yield* say('ives', "We'll keep our Houses' threads, love. By choice. For the next Wanderer. For play. That's the difference.");
        yield* say(null, 'Over the north woods the fog has thinned to nothing but a morning mist, and through it, there is a road.');
        const seed = Progress.flag('seed_planted');
        yield* say(null, "In Gran's garden, Gran and Linnet sit on the bench together, not saying much. Biscuit sits between them, purring like a winch." + (seed ? ' By the gate, the seed you brought back from past the fog has opened: a tall flower the colour of a sky after rain.' : ''));
        if (Inv.items.bracelet) { yield* say(null, Progress.flag('bracelet_top') ? "Gran has Linnet's bracelet on her wrist now, the green thread a little faded. Every so often she turns it round, and Linnet pretends not to see." : "You give Linnet her bracelet back, and Linnet gives it to Gran: plaited from green thread, a little faded. Gran puts it on and doesn't say anything, and doesn't need to."); delete Inv.items.bracelet; Progress.set('bracelet_given'); }
        if (Progress.flag('s30')) yield* say(null, "On Gran's kitchen dresser, propped against the teapot: Tuck's drawing of you, in every colour he had.");
        yield* say(null, "And a week later, somebody re-carves the Well.");
        yield* fadeOut(60);
        yield* Ending.credits();
        Progress.setGoal('The valley is yours. Carry on.');
        World.enter('hollow', 95, 63, { dir: DOWN });
        G.hideHud = false;
        yield* fadeIn(40);
        Save.autosave();
    },
    /* the credits: the Makers, and you */
    *credits() {
        const name = G.wanderer || 'Wren';
        const pages = [
            ['HOLLOWELL', '', 'a Wander'],
            ['Made by the Makers of Hollowell', '', 'Mother Ives, the Tidyhouse', 'Bram, the Kiln', 'Ambrose, the Millrace', 'Tess, the Belfry', 'Doctor Mallow, the Slumberhouse', 'Jory, the Marionette Hall', 'Gundry and the Guild, the Spoolworks'],
            ['and the Loom', '', 'the First Spinner, long ago,', 'who only meant to keep things safe'],
            ['Wanderer:', '', name],
            ['with Linnet, who came home', 'and Hesper, who let go', '', 'and Biscuit, who never needed telling'],
            ['The End.', '', '(Carry on.)'],
        ];
        G.credits = { pages, i: 0, t: 0 };
        for (let i = 0; i < pages.length; i++) {
            G.credits.i = i; G.credits.t = 0;
            for (let t = 0; t < 240; t++) { G.credits.t = t; if (t > 40 && (Input.pressed('act') || Input.pressed('atk'))) break; yield 1; }
        }
        G.credits = null;
    },
    drawCredits() {
        const c = G.credits; if (!c) return;
        Gfx.rect(0, 0, W, H, '#14101c');
        for (let x = 12; x < W - 12; x += 6) { Gfx.rect(x, 10, 3, 1, '#3a3456'); Gfx.rect(x, H - 11, 3, 1, '#3a3456'); }
        if (c.pages[c.i][0] === 'Wanderer:') { const im = typeof personFrame === 'function' && personFrame('wren', DOWN, (c.t >> 4) % 2 ? 1 : 2); if (im) Gfx.img(im, W / 2 - 8, H / 2 + 26); }
        const a = Math.min(1, c.t / 30, (240 - c.t) / 30);
        Gfx.alpha(Math.max(0, a));
        const lines = c.pages[c.i], y0 = H / 2 - lines.length * 6;
        lines.forEach((l, i) => Font.center(l, W / 2, y0 + i * 12, i === 0 ? '#f7e08a' : '#e4ecf5'));
        Gfx.alpha(1);
    },
};
function localSet(k, v) { try { localStorage.setItem(k, v); } catch { } }
function localGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
{
    const draw0 = UI.draw;
    UI.draw = function () { draw0.call(this); if (G.credits) Ending.drawCredits(); };
}

/* the Well's motto, read in every act (S35), changes at the end */
const MOTTO = [
    ['act1', () => !Progress.flag('reveal1'), 'The Well. Carved round its stones: EVERYTHING IN ITS PLACE.'],
    ['act2', () => Progress.flag('reveal1') && !Progress.flag('reveal2'), "The Well. EVERYTHING IN ITS PLACE. Underneath, very small, freshly scratched: (AND WE PUT IT THERE. -B.)"],
    ['act3', () => Progress.flag('reveal2') && !Progress.flag('unwound'), "The Well. EVERYTHING IN ITS PLACE. The letters look deeper than you remember. Tighter, somehow."],
    ['act4', () => Progress.flag('unwound'), "The Well, its cap off and its winch at rest. Re-carved: EVERYTHING IN ITS PLACE, AND EVERYONE IN THEIRS. WHEREVER THAT IS."],
];
{
    const deco0 = SPAWN.deco;
    SPAWN.deco = (tx, ty, p) => {
        const pr = deco0(tx, ty, p);
        if (p.id === 'well') {
            const i0 = pr.interact;
            pr.interact = () => {
                if (Progress.flag('great_pull') && !Progress.flag('unwound')) {
                    Script.run(function* () {
                        const i = yield* ask(null, "The Well's cap is gone. Every thread in the valley pours down into the dark.", ['Down the Well', 'Read the stones', 'Not yet']);
                        if (i === 0) World.go('greatspool', GREAT_ENTRY.x, GREAT_ENTRY.y, { dir: UP, fade: true });
                        if (i === 1) { yield* say(null, MOTTO[2][2]); Progress.set('motto:act3'); }
                    });
                    return true;
                }
                const m = MOTTO.find(([, when]) => when());
                Script.run(function* () {
                    yield* say(null, m[2]);
                    Progress.set('motto:' + m[0]);
                    if (MOTTO.every(([k]) => Progress.flag('motto:' + k)) && !Progress.flag('s35')) { Progress.set('s35'); Stats.count('secret:motto'); yield* say(null, 'You have read the Well four times now, and it has said four different things.'); }
                });
                return true;
            };
        }
        return pr;
    };
}

/* Gran's garden: the Drift-bloom seed (S11) goes in by the gate */
SPAWN.gardenplot = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.gardenplot, solid: [[0, 0]], oy: 0 });
    pr.baseY = -20;
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('seed_planted')) { yield* say(null, Progress.flag('unwound') ? "The Drift-bloom: a tall flower the colour of a sky after rain. Nothing like it grows anywhere else in the Hollow." : 'Where you planted the seed, a green shoot. It seems in no hurry.'); return; }
            if (!Inv.items.driftseed) { yield* say(null, "A bare patch by Gran's gate, dug over and ready, as if she'd meant to plant something there for years."); return; }
            const i = yield* ask(null, "A bare patch by Gran's gate. Plant the Drift-bloom seed here?", ['Plant it', 'Not yet']);
            if (i !== 0) return;
            delete Inv.items.driftseed; Progress.set('seed_planted'); Stats.count('seed_planted'); Sfx.play('appear');
            yield* say(null, 'You press it into the earth and water it from the butt. Something past the fog, growing in the Hollow.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    pr.draw = (cx, cy) => { Gfx.img(ART.gardenplot, tx * T - cx, ty * T - cy); if (Progress.flag('seed_planted')) { const im = Progress.flag('unwound') ? ART.driftbloom : null; if (im) Gfx.img(im, tx * T - cx, ty * T - cy - 10); else { Gfx.rect(tx * T - cx + 7, ty * T - cy + 6, 2, 6, '#4a8a3a'); Gfx.rect(tx * T - cx + 5, ty * T - cy + 7, 3, 2, '#6ab84a'); } } };
    return pr;
};
OW.blocks['1,1'].ents.push({ k: 'gardenplot', x: 9, y: 11 });

/* after the Unwinding: everyone free, wandering a little round of their own */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        if (Progress.flag('unwound') && id === 'hollow') {
            let k = 0;
            for (const e of a.ents) {
                if (e.kind !== 'npc' || e.route || e.who === 'gran' || e.who === 'linnet') continue;
                e.ret = null; e.cutFree = true; e.free = true;
                const x0 = e.tx, y0 = e.ty, d = 3 + (k++ % 3);
                e.route = [[x0, y0, 60 + k * 7], [x0 + d, y0, 40], [x0 + d, y0 + 2, 50], [x0, y0 + 2, 30]].filter(([x, y]) => a.inside(x, y) && !a.kind(x, y).solid);
                e.ri = 0; e.routeWait = 20 + k * 5;
            }
        }
        return a;
    };
}

/* the title, once the Wander's done: no mist, no thread in the Well, and Carry on */
{
    const items0 = Title.items;
    Title.ended = function () { return (this.slots || []).some(s => s.s && s.s.progress && s.s.progress.flags && s.s.progress.flags.unwound); };
    Title.items = function () { const it = items0.call(this); return this.ended() ? it.map(s => s === 'Continue' ? 'Carry on' : s) : it; };
    const upd0 = Title.update;
    Title.update = function () {
        if (this.ended() && this.mode === 'main' && (Input.pressed('act') || Input.pressed('menu'))) {
            const c = this.items()[this.sel];
            if (c === 'Carry on') { Sfx.play('select'); this.mode = 'slots'; this.slotSel = 0; this.slotAction = 'load'; return; }
        }
        return upd0.call(this);
    };
    const art0 = TitleArt.draw;
    TitleArt.draw = function (t) {
        if (!Title.ended()) return art0.call(this, t);
        for (let y = 0; y < H; y++) Gfx.rect(0, y, W, 1, mix('#8fd0f4', '#fff0c8', y / H));
        const hill = (base, amp, col, seed) => { for (let x = 0; x < W; x++) { const h = base + Math.sin(x / 40 + seed) * amp + Math.sin(x / 17 + seed * 2) * amp * 0.3; Gfx.rect(x, h, 1, H - h, col); } };
        hill(70, 10, '#b8d8b8', 1); hill(88, 8, '#98c888', 2); hill(104, 6, '#84bc70', 3); hill(122, 4, '#74b05c', 4);
        /* a road from the Well out over the hills, people walking it, and birds going wherever they like */
        const road = t0 => [W / 2 + 22 + t0 * 96 + Math.sin(t0 * 6) * 10 * (1 - t0), 106 - t0 * 36];
        for (let i = 0; i <= 80; i++) { const [rx, ry] = road(i / 80); Gfx.rect(rx, ry, Math.max(1, 4 - i / 25), 1, '#e8cc98'); }
        for (let k = 0; k < 3; k++) {
            const q = ((t * 0.0015) + k / 3) % 1, [rx, ry] = road(q), sc = 1 - q * 0.6;
            Gfx.rect(rx, ry - 4 * sc, Math.max(1, 2 * sc), Math.max(1, 3 * sc), ['#e8463c', '#5ab85a', '#4f9be0'][k]); Gfx.rect(rx, ry - 5 * sc, Math.max(1, 2 * sc), 1, '#f2c6a0');
        }
        for (let i = 0; i < 5; i++) { const bx = (t * 0.4 + i * 70) % (W + 40) - 20, by = 10 + i * 3 + Math.sin(t / 40 + i) * 3, f = (t >> 3) % 2; Gfx.rect(bx, by + f, 3, 1, '#5a4a4e'); Gfx.rect(bx + 3, by + 1 - f, 3, 1, '#5a4a4e'); }
        const wx = W / 2, wy = 98;
        Gfx.rect(wx - 18, wy, 36, 10, '#8a7a6a'); Gfx.rect(wx - 18, wy, 36, 2, '#c8b8a4');
        Gfx.rect(wx - 14, wy - 18, 3, 18, '#6b4128'); Gfx.rect(wx + 11, wy - 18, 3, 18, '#6b4128');
        Gfx.rect(wx - 18, wy - 22, 36, 5, '#9a4a3a'); Gfx.rect(wx - 16, wy - 24, 32, 2, '#c45a4a');
        const title = 'HOLLOWELL';
        let x = W / 2 - 80;
        for (let i = 0; i < title.length; i++) { const y = 26 + Math.sin(t / 30 + i * 0.6) * 1.5; BigFont.draw(title[i], x + 2, y + 2, '#5a3a3a'); BigFont.draw(title[i], x, y, '#fbf6ea'); x += 18; }
        Font.center('a Wander (and after)', W / 2, 58, '#5a4a4e');
    };
}

function initEnding() {
    ART.gardenplot = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3e2a', 3, 5, 10, 9); R('#5a3e2a', 2, 6, 12, 7); R('#7a5638', 3, 6, 10, 7); for (let i = 0; i < 3; i++) R('#4a3222', 4, 7 + i * 2, 8, 1); R('#9a7050', 5, 6, 2, 1); R('#9a7050', 9, 10, 2, 1); }, false);
}
CONTENT_INIT.push(initEnding);

/* after: Gran and Linnet in Gran's garden, Linnet gone from the Drift, and what everyone says now they're free */
OW.blocks['1,1'].ents.push(
    { k: 'npc', who: 'gran', x: 14, y: 11, face: 'down', if: 'unwound', id: 'granAfter' },
    { k: 'npc', who: 'linnet', x: 15, y: 11, face: 'down', if: 'unwound', id: 'linnetAfter' });
for (const e of AREAS.drift.ents) if (e.who === 'linnet') e.if = '!unwound';
const AFTER_LINES = {
    gran: ["Sit with us a while, love. There's no hurry. There's never going to be a hurry again.", "I held on so tight I nearly lost everything. Don't you ever hold on like that. Not to anyone.", "Your aunt says the world goes on a long way past the fog. Go and see it. Then come and tell me. If you like."],
    linnet: ["Twenty-five years. The garden's exactly where I left it. Well. Mum would see to that.", "I used to cut the strays loose at the edge and scratch an L on them, so somebody would know. You knew.", "There's a road through the fog now. I'll show you my garden on the other side, one day."],
    ives: ["The Tidyhouse is open, love, any time you fancy a puzzle. For fun, now.", "Do you know, I put a box in the wrong place yesterday. On purpose. It was thrilling."],
    bram: ["Fresh clay! From past the ridge! It's terrible clay. I love it.", "Bring me a pot from somewhere else, Wanderer. Anywhere else."],
    ambrose: ["Your mum and I are taking the boat out past the falls tomorrow. Just to see.", "I'll keep the Millrace running for the next Wanderer. The river can do as it likes the rest of the time."],
    tess: ["I rang the big bell this morning for nothing at all. Half the town came out to see. I'll do it again tomorrow.", "Proud of you, Wren. Not for the Knots. For the other thing."],
    mallow: ["I slept in my own bed last night and woke up somewhere completely different. Well, the same bed. But I felt different.", "Go anywhere you like. Come home when you like. Doctor's orders."],
    jory: ["The touring show! I'm painting the wagon. What colour's a road?", "Every puppet in the Hall's on a string, and every one of them's glad of it. That's what strings are FOR."],
    gundry: ["I went to look for the sea. I didn't find it. I'm going again Thursday.", "The Guild votes to keep the Spoolworks turning. For play. Motion carried. Then we all went for a walk."],
    quill: ["We walked up the hill this morning, the whole school. Nobody wanted to come down.", "Lesson for today: anything at all. Isn't it marvellous?"],
    arlo: ["Down to the lake and back every morning now. My knees complain. I don't listen.", "Seventy years in this valley and I'm only just seeing it."],
    hob: ["The pool past the bend. My dad's pool. Caught nothing all morning. Best morning of my life.", "Fish go where they like. Turns out so do I."],
    burr: ["No post to stand at. I keep going back to it out of habit, and then I go somewhere else.", "Move along! Anywhere you like! Ha!"],
    tuck: ["I drew a map of EVERYWHERE. It's mostly the bakery.", "I'm going to be a Maker AND a Wanderer. Both. At once."],
    rosa: ["A cart came through from past the fog and bought every loaf I had. Every one!", "Bread for strangers. Who knew it'd taste better?"],
    annie: ["Broke a pot this morning. It stayed broken. I made a mosaic out of it. Best thing I've ever made.", "The canyon's the same as ever. I'm not. Funny, that."],
    tal: ["Things break now and stay broken, so you mend them. I'd forgotten mending.", "Mind my tools. I left them where I liked, and they stayed there."],
    pip: ["The sheep wander off now! I go and find them. It takes ALL DAY. It's brilliant.", "Baa. Sorry. Still a habit."],
    fen: ["Cut a field of barley yesterday. It's still cut. I'll have to plant it again. Imagine.", "The scarecrow fell over in the night. I left him. He looked comfy."],
    wick: ["The fish don't swim home any more. They swim wherever. So do I!", "I went down the river past the falls and nobody came to fetch me. I came back for tea."],
    hettie: ["The giant's walked off over the hills. Left a dent in the woods the size of a house. I miss him.", "The old roots don't creak home at night now. It's very quiet in Hushwood."],
    rook: ["My crystal ball shows... the future. Isn't that something? It never used to. It used to show the same afternoon.", "The fair's going on tour. I've told everyone's fortune and they're all different now."],
    pell: ["The carousel horses walked off into the fields. We'll get them back. Or we won't. The fair'll be different.", "Roll up! Roll up! Nobody has to. That's the beauty of it."],
    brindle: ["The wind up here blows things away now, and they stay blown. I've lost three hats. Wonderful.", "The bells ring for no reason now. Your mum's doing, mostly."],
    thimble: ["I'm off to a market two valleys over. I've packed forty buttons. In case.", "I lost a button yesterday and I didn't even mind."],
    seam: ["Your travelling coat's nearly done. Room in the pockets for anything you find out there.", "Every seam in this town was straight. I'm trying a crooked one. For fun."],
    mabel: ["I'm giving the strays away. To anyone who wants them. They can go where they like too.", "Every one with an L. She was trying to tell us, all those years."],
    nell: ["I ran right past the posts and NOTHING HAPPENED!", "Race you to the fog! It's not even fog any more!"],
    otto: ["That crate's still where I left it. I go and look at it sometimes. It's my favourite crate.", "I moved my house's chair to the window. It's stayed there two whole days."],
    bea: ["Tag! You're it! You'll always be it!", "We played hide-and-seek and I hid past the river and nobody pulled me back!"],
};
{
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (Progress.flag('unwound') && AFTER_LINES[npc.who]) {
            const L = AFTER_LINES[npc.who];
            return function* () { yield* say(npc.who, cycle('after_' + npc.who, L)); };
        }
        return talk0.call(this, npc);
    };
}

/* the cellar door, after */
{
    const c0 = Story.cellarDoor;
    Story.cellarDoor = function* () {
        if (Progress.flag('unwound')) { yield* say(null, "The cellar door, standing open. Down the steps, the Well's winch, at rest, with a cushion on it. Gran comes down to sit here sometimes, she says, for the quiet."); return; }
        return yield* c0();
    };
}
