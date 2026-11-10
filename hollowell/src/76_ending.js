/* The Unwinding, the epilogue and the credits; and after: the free valley (everyone walks where they like), the
   Well's new motto (S35), Gran's garden (S11's seed), and a title screen that's changed. The epilogue is a handful of
   shots, the camera going to each thing as it's told: the square, where every thread goes slack; the birds off the
   roofs; everyone stepping off their spot; the road north; Gran and Linnet on the bench, and the bloom; Tuck's drawing;
   the Well re-carved; and you, a little way up the new road. */

const Ending = {
    hands: null,        /* people side by side holding hands (the end, at the Spool), left to right */
    *unwinding() {
        const p = G.player;
        Music.play('silence');
        G.hideHud = true;
        yield 30;
        UI.fadeA = 0; yield* fadeOut(60);
        Ending.hands = null;
        Progress.set('unwound'); Stats.count('unwound');
        for (const w of ['wren', ...Object.keys(PEOPLE_DEF)]) if (w !== 'wren') Progress.set('cut:' + w);
        World.enter('hollow', 95, 63, { dir: UP, noSave: true });
        let a = G.map;
        Ending.quiet();
        /* the square as the Pull left it, everyone in rings round the Well with their threads running into it: then
           every thread goes slack at once, sags, and drops to the ground */
        const ring = Ending.ring(a);
        Ending.cut(95, 59);
        G.slack = { t: 0, from: ring };
        yield* fadeIn(60);
        yield 30;
        for (let i = 0; i < 110; i++) { G.slack.t++; yield 1; }
        yield* say(null, 'Every thread in the valley goes slack at once. Then, for a long moment, nothing at all.', { focus: [95, 56] });
        for (let i = 0; i < 70; i++) { G.slack.t++; yield 1; }
        G.slack = null;
        Music.play('drift');
        /* the birds: up off the roofs and away over the edge of the valley; a long while; and back */
        const flock = a.add(new Flock());
        yield* camLook({ x: 98 * T, y: 47 * T }, 120);
        yield 30;
        flock.go();
        for (let i = 0; i < 150; i++) yield 1;
        yield* say(null, 'They fly out over the edge of the valley, further than anything has ever flown from here.', { focus: [98, 45] });
        yield 40;
        yield* say(null, 'You watch the sky a long time.', { focus: [98, 45] });
        flock.back();
        for (let i = 0; i < 400 && !flock.landed; i++) yield 1;
        yield 40;
        /* then everyone steps off their spot: Miss Quill takes the children up the hill, Old Arlo walks down to the
           river (Fisher Hob is out in a boat), the Makers come over to you, everyone else wherever they like */
        yield* camLook(95, 60, 120);
        const arlo = Ending.scatter(a, ring, p);
        for (let i = 0; i < 60; i++) { Ending.nudge(); yield 1; }
        for (let i = 0; i < 420 && arlo && (i < 40 || arlo.tx !== 113 || arlo.ty !== 62 || arlo.mv); i++) { Ending.nudge(); Cam.look = { x: arlo.px + 8, y: arlo.py + 8 }; yield 1; }
        if (arlo) arlo.dir = RIGHT;
        for (let i = 0; i < 30; i++) { Ending.nudge(); yield 1; }
        yield* say(null, 'Nobody, anywhere, is standing on their spot.');
        yield* camBack(120);
        for (let i = 0; i < 120 && Ending.walks.some(([n, x, y]) => n.tx !== x || n.ty !== y || n.mv); i++) { Ending.nudge(); yield 1; }
        for (const e of ring) if (['ives', 'bram', 'ambrose', 'tess', 'mallow', 'jory'].includes(e.who) && !e.walking && !e.mv) e.dir = Math.abs(p.tx - e.tx) > Math.abs(p.ty - e.ty) ? (p.tx < e.tx ? LEFT : RIGHT) : (p.ty < e.ty ? UP : DOWN);
        yield* say('ives', "We'll keep our Houses' threads, love. By choice. For the next Wanderer. For play. That's the difference.");
        /* the road north, through what's left of the fog */
        G.mist = { t: 0 };
        yield* camLook(96, 36, 150);
        for (let i = 0; i < 70; i++) { G.mist.t++; yield 1; }
        yield* say(null, 'Over the north woods the fog has thinned to nothing but a morning mist, and through it, there is a road.');
        G.mist = null;
        /* Gran and Linnet on the bench by her gate, Biscuit between them; by the gate, the bloom */
        G.benchCat = true;
        const cat = a.ents.find(e => e.kind === 'critter' && e.who === 'biscuit'); if (cat) a.remove(cat);
        yield* camLook(77, 52, 150);
        yield 20;
        yield* say(null, "Gran and Linnet sit on the bench together, not saying much. Biscuit sits between them, purring like a winch.", { focus: [79, 53] });
        if (Progress.flag('seed_planted')) yield* say(null, 'By the gate, the seed you brought back from past the fog has opened.', { focus: [73, 51] });
        if (Inv.items.bracelet) { yield* say(null, Progress.flag('bracelet_top') ? "Gran has Linnet's bracelet on her wrist now, the green thread a little faded. Every so often she turns it round, and Linnet pretends not to see." : "You give Linnet her bracelet back, and Linnet gives it to Gran: plaited from green thread, a little faded. Gran puts it on and doesn't say anything, and doesn't need to."); delete Inv.items.bracelet; Progress.set('bracelet_given'); }
        /* Tuck's drawing, on Gran's dresser (a close look) */
        if (Progress.flag('s30')) {
            yield* fadeOut(24);
            G.benchCat = false;
            World.enter('gran_house', 6, 6, { dir: UP, noSave: true }); Ending.quiet(); p.hidden = true; Cam.look = null;
            G.card = 'drawing';
            yield* fadeIn(24);
            yield* say(null, "On Gran's kitchen dresser, propped against the teapot: Tuck's drawing of you, in every colour he had.", { focus: [6, 1] });
            G.card = null;
        }
        /* a week later: the Well, re-carved (a close look at its stones) */
        yield* fadeOut(40);
        G.benchCat = false; p.hidden = false;
        World.enter('hollow', 95, 61, { dir: UP, noSave: true }); Ending.quiet(); a = G.map;
        Ending.cut(95, 59);
        yield* fadeIn(40);
        G.card = 'motto';
        yield* say(null, 'And a week later, somebody re-carves the Well.', { focus: [95, 55] });
        G.card = null;
        /* and you, a little way up the new road */
        yield* camBack(60);
        yield* walkTo(p, 97, 57);
        UI.fade = { from: UI.fadeA, to: 1, t: 0, dur: 110 };
        yield* walkTo(p, 97, 49);
        for (let i = 0; i < 120 && UI.fadeA < 1; i++) yield 1;
        UI.fade = null; UI.fadeA = 1;
        yield* Ending.credits();
        Progress.setGoal('The valley is yours. Carry on.');
        World.enter('hollow', 95, 63, { dir: DOWN });
        G.hideHud = false;
        yield* fadeIn(40);
        Save.autosave();
    },
    /* a shot somewhere: no place name popping up on the way in, no HUD */
    quiet() { UI.banner = null; G.hideHud = true; },
    /* the camera straight onto a tile (a cut, not a pan) */
    cut(x, y) { Cam.look = { x: x * T + 8, y: y * T + 8 }; const t = Cam.target({ x: Cam.look.x, y: Cam.look.y + 6 }); Cam.x = t.x; Cam.y = t.y; },
    /* the square as the Pull left it: everybody in town (and the people who live indoors, the Makers among them)
       standing in rings round the Well where they were dragged, facing it, the south side left open for you. Fisher
       Hob is out on the river in a boat. Returns them */
    ring(a) {
        const hob = a.ents.find(e => e.kind === 'npc' && e.who === 'hob'); if (hob) a.remove(hob);
        a.add(new RowBoat(116, 61));
        const inTown = e => e.kind === 'npc' && e.tx >= 64 && e.tx < 128 && e.ty >= 40 && e.ty < 80 && e.who !== 'gran' && e.who !== 'linnet';
        /* (a child still busy with a game of his own comes and stands with everyone else, as himself) */
        for (const e of a.ents.filter(e => inTown(e) && e.constructor !== NPC)) a.remove(e);
        const ppl = a.ents.filter(inTown);
        for (const who of ['ives', 'ambrose', 'tess', 'mallow', 'jory', 'rosa', 'thimble', 'seam', 'mabel', 'otto']) if (!ppl.some(e => e.who === who)) ppl.push({ who, add: true });
        const open = (x, y) => a.inside(x, y) && !a.kind(x, y).solid && !a.at(x, y) && !a.blockers.some(b => b.blocks(x, y));
        const spots = [];
        [[5, 3.5, 12], [7.5, 5, 16], [10, 6.5, 20]].forEach(([rx, ry, n], ri) => {
            for (let i = 0; i < n; i++) {
                const ang = 110 + i * 320 / (n - 1), x = Math.round(95 + Math.cos(ang * Math.PI / 180) * rx), y = Math.round(59 + Math.sin(ang * Math.PI / 180) * ry);
                if (!spots.some(s => s.x === x && s.y === y)) spots.push({ x, y, ang: ang % 360, ri });
            }
        });
        /* (who stands where: the Makers nearest you, the schoolchildren and Miss Quill on the north side, Old Arlo east) */
        const PREF = { ives: 125, bram: 140, mallow: 158, ambrose: 55, tess: 40, jory: 22, quill: 270, tuck: 255, nell: 285, bea: 300, otto: 240, arlo: 0, gundry: 330, burr: 210, rosa: 190, thimble: 225, seam: 315, mabel: 175, mrives: 345 };
        const out = [];
        ppl.forEach((n, i) => {
            const want = PREF[n.who] !== undefined ? PREF[n.who] : (i * 47) % 360;
            let best = null, bc = 1e9;
            for (const s of spots) { if (s.used || !open(s.x, s.y)) continue; const d = Math.abs(s.ang - want) % 360, c = Math.min(d, 360 - d) + s.ri * 30; if (c < bc) { bc = c; best = s; } }
            if (!best) return;
            best.used = true;
            let e = n;
            if (n.add) { e = a.add(new NPC(best.x, best.y, { who: n.who, marked: false })); e.free = e.cutFree = true; }
            else { a.unplace(e, e.tx, e.ty); e.mv = null; e.path = null; e.walking = false; e.tx = best.x; e.ty = best.y; e.x = e.tx * T; e.y = e.ty * T; a.place(e, e.tx, e.ty); e.ret = null; e.free = e.cutFree = true; }
            const dx = 95 - best.x, dy = 58.5 - best.y;
            e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
            e.stopped = true; e.fixedFace = true;
            out.push(e);
        });
        return out;
    },
    /* everyone steps off their spot: Miss Quill takes the children up the hill, Old Arlo goes down to the river, the
       Makers come over to you, the rest go wherever they like. Returns Old Arlo */
    scatter(a, ring, p) {
        const up = [[95, 47], [94, 48], [96, 48], [95, 49], [94, 50], [96, 50]], kids = ['tuck', 'nell', 'bea', 'otto'];
        const near = { ives: [-1, -1], tess: [1, -1], bram: [-2, 0], ambrose: [2, 0], mallow: [-3, -1], jory: [3, -1], gundry: [-2, -2] };
        const send = (e, x, y, sp) => { e.route = null; Ending.walks.push([e, x, y, sp, 0]); e.walkTo(x, y, sp); };
        let k = 0, arlo = null;
        Ending.walks = [];
        for (const e of ring) {
            e.stopped = false; e.fixedFace = false; e.free = true;
            if (e.who === 'arlo') { arlo = e; send(e, 113, 62, 0.7); }
            else if (e.who === 'quill') send(e, ...up[0], 0.8);
            else if (kids.includes(e.who)) send(e, ...up[1 + (k++ % 5)], 0.9);
            else if (near[e.who]) send(e, p.tx + near[e.who][0], p.ty + near[e.who][1], 0.9);
            else if (!e.route) {
                const x0 = e.tx, y0 = e.ty;
                e.route = [[x0 + 2, y0, 60], [x0 + 2, y0 + 2, 40], [x0, y0 + 2, 50], [x0, y0, 30]].filter(([x, y]) => a.inside(x, y) && !a.kind(x, y).solid);
                e.ri = 0; e.routeWait = 10 + (k++ % 4) * 9;
            }
        }
        return arlo;
    },
    /* walks in a crowd: one held up a while by somebody in its way finds another way round */
    walks: [],
    nudge() {
        for (const w of Ending.walks) {
            const [n, x, y, sp] = w;
            if (n.removed || (n.tx === x && n.ty === y) || n.mv) { w[4] = 0; continue; }
            if (++w[4] > 24) { w[4] = 0; n.walkTo(x, y, sp); }
        }
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
function localSet(k, v) { Store.set(k, v); }
function localGet(k) { return Store.get(k); }
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
    /* Gran's bench, in two parts so whoever sits on it sits in it: the back and the seat, and in front, the seat's edge
       and the legs */
    ART.gardenbench = paintSprite(48, 13, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); for (const px of [2, 22, 43]) R('#6b4128', px, 0, 3, 10); R('#9a6438', 1, 1, 46, 3); R('#c9925a', 1, 1, 46, 1); R('#9a6438', 1, 5, 46, 3); R('#c9925a', 1, 5, 46, 1); R('#e6c08a', 1, 9, 46, 3); R('#c9925a', 1, 11, 46, 1); });
    ART.gardenbench_front = paintSprite(48, 10, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#9a6438', 1, 0, 46, 3); R('#c9925a', 1, 0, 46, 1); for (const px of [3, 22, 42]) R('#6b4128', px, 3, 3, 7); });
    /* Biscuit, sitting up, eyes shut, purring */
    ART.catsit = paintSprite(10, 11, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#f0a050', 2, 1, 1, 1); R('#f0a050', 7, 1, 1, 1); R('#f0a050', 2, 2, 6, 4); R('#f0a050', 1, 6, 8, 4); R('#fbf6ea', 4, 6, 2, 3); R('#c87830', 1, 9, 8, 1); R('#c87830', 8, 7, 1, 2); R('#2a1f2d', 3, 4, 1, 1); R('#2a1f2d', 6, 4, 1, 1); R('#f59ac0', 4, 5, 2, 1); });
    /* a little rowing boat seen from the bank: the inside and the far side, then the near side over whoever's in it */
    ART.rowboat = paintSprite(26, 9, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#9a6438', 3, 1, 20, 7); R('#9a6438', 1, 3, 24, 4); R('#c9925a', 3, 1, 20, 1); R('#5a3a26', 4, 3, 18, 4); R('#6b4128', 4, 5, 18, 1); });
    ART.rowboat_front = paintSprite(26, 7, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#9a6438', 1, 0, 24, 3); R('#c9925a', 1, 0, 24, 1); R('#7a4e32', 3, 3, 20, 2); R('#6b4128', 6, 5, 14, 1); });
    /* Tuck's drawing, close up: crayon on paper. A floor, a little figure on it (him); under it, you, smiling, holding up
       a lot of strings, in every colour he had; a sun, some grass */
    ART.tuckpicture = paintSprite(104, 80, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        const crayon = (x0, y0, x1, y1, c, th = 2) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const t = n ? i / n : 0, px = Math.round(x0 + (x1 - x0) * t), py = Math.round(y0 + (y1 - y0) * t + (hash2(i, x0 + y0, 71) < 0.3 ? 1 : 0)); R(c, px, py, th, th); } };
        R('#c8b89a', 3, 3, 100, 76); R('#fbf6ea', 1, 1, 100, 76); R('#f4ead2', 1, 70, 100, 7);
        for (let i = 0; i < 9; i++) R('#e8dcc0', 1 + Math.floor(hash2(i, 1, 72) * 96), 1 + Math.floor(hash2(1, i, 73) * 72), 3, 1);
        /* the sun, up in the corner */
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; crayon(13 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, 13 + Math.cos(a) * 10, 12 + Math.sin(a) * 10, '#f7c63a', 1); }
        R('#f7d64a', 9, 8, 9, 9); R('#e8a83a', 10, 9, 7, 1);
        /* the floor, and Tuck on it, waving */
        crayon(4, 30, 98, 29, '#9a6438', 3);
        R('#f7d64a', 70, 12, 5, 5); crayon(72, 17, 72, 24, '#5ab85a'); crayon(72, 19, 67, 15, '#5ab85a'); crayon(72, 19, 77, 21, '#5ab85a'); crayon(72, 24, 69, 28, '#3a5fae'); crayon(72, 24, 75, 28, '#3a5fae');
        /* you, under the floor: brown hair, a red scarf, holding up the strings */
        const sx = 46, sy = 46;
        R('#a5532a', sx - 6, sy - 9, 13, 5); R('#f2c49b', sx - 5, sy - 5, 11, 9); R('#a5532a', sx - 6, sy - 5, 2, 6); R('#a5532a', sx + 5, sy - 5, 2, 6);
        R('#2a1f2d', sx - 3, sy - 2, 2, 2); R('#2a1f2d', sx + 2, sy - 2, 2, 2); crayon(sx - 3, sy + 1, sx + 3, sy + 1, '#e8463c', 1); R('#e8463c', sx - 4, sy + 2, 1, 1); R('#e8463c', sx + 3, sy + 2, 1, 1);
        crayon(sx - 6, sy + 5, sx + 6, sy + 5, '#e8463c', 2);
        for (let j = 0; j < 12; j++) R('#e7ad3c', sx - 3 - Math.floor(j / 2), sy + 7 + j, 7 + j, 1);
        crayon(sx - 3, sy + 19, sx - 5, sy + 26, '#3a5fae'); crayon(sx + 3, sy + 19, sx + 5, sy + 26, '#3a5fae');
        crayon(sx - 4, sy + 9, sx - 13, sy - 1, '#f2c49b'); crayon(sx + 4, sy + 9, sx + 13, sy - 1, '#f2c49b');
        const cols = ['#e8463c', '#e0913a', '#f7d64a', '#8fd46a', '#3fc1b5', '#4f9be0', '#b48ce8', '#f59ac0'];
        cols.forEach((c, i) => { const hx = i < 4 ? sx - 13 : sx + 13; crayon(hx, sy - 1, 14 + i * 11, 32, c, 1); });
        /* grass */
        for (let i = 0; i < 24; i++) crayon(4 + i * 4, 76, 6 + i * 4, 71 - (i % 2) * 2, i % 3 ? '#4fa84a' : '#8fd46a', 1);
    }, false);
}
CONTENT_INIT.push(initEnding);

/* after: Gran and Linnet on the bench by Gran's gate, Linnet gone from the Drift, and what everyone says now they're free */
OW.blocks['1,1'].ents.push(
    { k: 'gardenbench', x: 14, y: 13, if: 'unwound' },
    { k: 'npc', who: 'gran', x: 14, y: 13, face: 'down', if: 'unwound', id: 'granAfter', seated: true },
    { k: 'npc', who: 'linnet', x: 16, y: 13, face: 'down', if: 'unwound', id: 'linnetAfter', seated: true });
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

/* the epilogue's pictures: threads going slack in the square (on the ground, under everyone), and over the picture the
   Pull's tint fading as they do, hands held at the Spool, the morning mist on the north road, and the close looks
   (Tuck's drawing; the Well's new motto) */
Object.assign(Ending, {
    drawSlack(a, cx, cy) {
        const s = G.slack; if (!s || a.id !== 'hollow') return;
        const k = clamp((s.t - 10) / 80, 0, 1), e = k * k * (3 - 2 * k), fade = s.t > 120 ? Math.max(0, 1 - (s.t - 120) / 60) : 1;
        const wx = 95 * T + 8 - cx, wy = 58 * T + 2 - cy;
        const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory, THREAD.guild, THREAD.town];
        /* taut: straight and trembling; going slack: sagging, its ends dropping to the ground, and lying there */
        const thread = (x0, y0, x1, y1, col, d0, d1, i) => {
            const tr = (1 - e) * Math.sin(G.t / 2 + i) * 0.7, ay = y0 + e * d0, by = y1 + e * d1;
            const mx = (x0 + x1) / 2, my = (ay + by) / 2 + e * 9 + tr;
            let px = x0, py = ay;
            for (let j = 1; j <= 12; j++) { const u = j / 12, qx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1, qy = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by; Gfx.line(px, py, qx, qy, col); px = qx; py = qy; }
        };
        Gfx.alpha((0.7 - 0.3 * e) * fade);
        (s.from || []).forEach((n, i) => { if (!n.removed) thread(n.px + 8 - cx, n.py + 4 - cy, wx, wy, (PEOPLE_DEF[n.who] && PEOPLE_DEF[n.who].col) || THREAD.town, 10, 14, i); });
        /* and from off every edge of the picture, the rest of the valley's */
        for (let i = 0; i < 24; i++) { const ang = i / 24 * Math.PI * 2, ex = W / 2 + Math.cos(ang) * W, ey = H / 2 + Math.sin(ang) * H; thread(ex, ey, wx, wy, cols[i % cols.length], 0, 14, i + 40); }
        Gfx.alpha(1);
    },
    overlay() {
        const a = G.map;
        if (G.slack && a.id === 'hollow') {
            const k = clamp(G.slack.t / 90, 0, 1);
            Gfx.alpha(0.16 * (1 - k)); Gfx.rect(0, 0, W, H, '#5a2030');
            for (let i = 0; i < 6; i++) { Gfx.alpha(0.07 * (1 - k)); Gfx.rect(0, 0, W, 6 + i * 4, '#e4ecf5'); Gfx.rect(0, H - 6 - i * 4, W, 6 + i * 4, '#e4ecf5'); Gfx.rect(0, 0, 6 + i * 4, H, '#e4ecf5'); Gfx.rect(W - 6 - i * 4, 0, 6 + i * 4, H, '#e4ecf5'); }
            Gfx.alpha(1);
        }
        /* hands held: arms reaching across to each other, the hands clasped between (people facing you) */
        const h = Ending.hands;
        if (h && h.every(e => e.area === a)) {
            const hand = (e, right) => e === G.player ? [e.x - 8 + (right ? 12 : 3), e.y - 1] : [e.px + (right ? 13 : 3), e.py + 6];
            for (let i = 0; i + 1 < h.length; i++) {
                const [x0, y0] = hand(h[i], true), [x1, y1] = hand(h[i + 1], false), X0 = x0 - Cam.x, Y0 = y0 - Cam.y, X1 = x1 - Cam.x, Y1 = y1 - Cam.y;
                Gfx.line(X0, Y0 - 1, X1, Y1 - 1, PAL.ink); Gfx.line(X0, Y0 + 1, X1, Y1 + 1, PAL.ink); Gfx.line(X0, Y0, X1, Y1, PAL.skin);
                const mx = Math.round((X0 + X1) / 2), my = Math.round((Y0 + Y1) / 2);
                Gfx.rect(mx - 2, my - 2, 4, 4, PAL.ink); Gfx.rect(mx - 1, my - 1, 2, 2, PAL.skin); Gfx.rect(mx - 1, my - 1, 1, 1, '#ffe0c4');
            }
        }
        /* the morning mist over the north woods, thinning */
        if (G.mist) {
            const k = Math.min(1, G.mist.t / 100), a0 = 0.55 - 0.38 * k;
            for (let i = 0; i < 16; i++) {
                const y = 4 + (i * 37) % 104, rx = 36 + (i * 23) % 30, ry = 4 + i % 3, x = ((i * 89 + G.t * (0.12 + (i % 3) * 0.05)) % (W + rx * 2)) - rx;
                Gfx.alpha(Math.max(0, a0 * (1 - y / 130)));
                for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); Gfx.rect(x - w, y + j, w * 2 + 1, 1, '#eef2f6'); }
            }
            Gfx.alpha(1);
        }
        /* close looks */
        if (G.card === 'drawing' && ART.tuckpicture) Gfx.img(ART.tuckpicture, (W - ART.tuckpicture.width) >> 1, 14);
        if (G.card === 'motto') {
            const w = 172, hh = 62, x = (W - w) >> 1, y = 16;
            stitchedBox(x - 2, y - 2, w + 4, hh + 4, { fill: '#8a8070', edge: PAL.ink, stitch: '#8a8070', shadow: '#6a6050' });
            for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) { const v = hash2(i >> 1, j >> 1, 61); Gfx.rect(x + i, y + j, 1, 1, v < 0.2 ? '#a89c88' : v > 0.85 ? '#857a6a' : '#988c78'); }
            Gfx.rect(x, y, w, 1, '#c4b8a2'); Gfx.rect(x, y, 1, hh, '#c4b8a2'); Gfx.rect(x, y + hh - 1, w, 1, '#6a6050'); Gfx.rect(x + w - 1, y, 1, hh, '#6a6050');
            ['EVERYTHING IN ITS PLACE,', 'AND EVERYONE IN THEIRS.', 'WHEREVER THAT IS.'].forEach((l, i) => { Font.center(l, W / 2, y + 12 + i * 15 + 1, '#cfc4ae'); Font.center(l, W / 2, y + 12 + i * 15, '#3a3228'); });
            /* (fresh chips of stone under the new letters) */
            for (let i = 0; i < 9; i++) Gfx.rect(x + 20 + Math.floor(hash2(i, 3, 62) * (w - 40)), y + hh - 6 + Math.floor(hash2(3, i, 63) * 3), 1, 1, '#d8ceba');
        }
    },
});
{
    const draw0 = UI.draw;
    UI.draw = function () { if (G.scene === 'play' && G.map && !G.credits) Ending.overlay(); return draw0.call(this); };
    /* (the Hollow's map is put together when the game starts, so its ground is hooked then) */
    CONTENT_INIT.push(() => { const g0 = AREAS.hollow.drawGround; AREAS.hollow.drawGround = (a, cx, cy) => { if (g0) g0(a, cx, cy); Ending.drawSlack(a, cx, cy); }; });
}

/* the birds of the Unwinding: perched along the roof ridges by the square; up and away over the edge of the valley,
   one after another; and, a long while later, back to the same ridges */
const FLOCK_PERCHES = [[1424, 714], [1436, 714], [1447, 714], [1459, 714], [1606, 698], [1617, 698], [1629, 698], [1641, 698], [1653, 698], [1690, 762], [1701, 762], [1713, 762], [1726, 762]];
class Flock extends Ent {
    constructor() {
        super('flock'); this.x = 98 * T; this.y = 46 * T;
        this.birds = FLOCK_PERCHES.map(([x, y], i) => ({ x, y, hx: x, hy: y, i, st: 'perch', t: 0, d: Math.floor(hash2(i, 3, 1) * 60), vx: 0.8 + hash2(i, 5, 2) * 0.6, vy: -(1.3 + hash2(i, 7, 3) * 0.5), f: hash2(i, 9, 4) < 0.5 ? -1 : 1 }));
    }
    get sortY() { return 1e9; }
    go() { for (const b of this.birds) { b.st = 'off'; b.t = -b.d; } }
    back() { for (const b of this.birds) { b.st = 'back'; b.t = -b.d; } }
    get landed() { return this.birds.every(b => b.st === 'perch'); }
    update() {
        for (const b of this.birds) {
            b.t++;
            if (b.st === 'off' && b.t > 0) { const s = Math.min(1.6, 0.4 + b.t / 25); b.x += b.vx * s; b.y += b.vy * s; }
            if (b.st === 'back' && b.t > 0) {
                const k = Math.min(1, b.t / 140), e = 1 - (1 - k) * (1 - k);
                b.x = b.hx + b.vx * 160 * (1 - e); b.y = b.hy + b.vy * 160 * (1 - e);
                if (k >= 1) { b.st = 'perch'; b.x = b.hx; b.y = b.hy; b.f = -1; }
            }
        }
    }
    draw(cx, cy) {
        const C = '#4a3a40', D = '#2a1f2d';
        for (const b of this.birds) {
            const x = Math.round(b.x - cx), y = Math.round(b.y - cy);
            if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
            if (b.st === 'perch' || b.t <= 0) {
                /* sitting on the ridge: a round body, a head with a beak, a tail; now and then a peck */
                const f = b.f, peck = ((G.t + b.i * 37) % 160) < 10 ? 1 : 0;
                Gfx.rect(x - 2, y - 4, 5, 3, D); Gfx.rect(x - 1, y - 4, 3, 2, C); Gfx.rect(x - 1, y - 2, 3, 1, '#8a7a7e');
                Gfx.rect(x + f * 2 - (f < 0 ? 1 : 0), y - 6 + peck, 2, 2, C); Gfx.rect(x + f * 4 - (f < 0 ? 0 : 0), y - 5 + peck, 1, 1, '#e8b04a');
                Gfx.rect(x - f * 3, y - 4, 1, 1, D); Gfx.rect(x, y - 1, 1, 1, D);
            } else {
                /* flying: wings up, wings down */
                const up = ((G.t >> 2) + b.i) % 2;
                Gfx.rect(x - 1, y, 3, 2, C);
                if (up) { Gfx.rect(x - 3, y - 2, 2, 1, D); Gfx.rect(x - 2, y - 1, 1, 1, D); Gfx.rect(x + 2, y - 1, 1, 1, D); Gfx.rect(x + 2, y - 2, 2, 1, D); }
                else { Gfx.rect(x - 3, y + 2, 2, 1, D); Gfx.rect(x - 2, y + 1, 1, 1, D); Gfx.rect(x + 2, y + 1, 1, 1, D); Gfx.rect(x + 2, y + 2, 2, 1, D); }
            }
        }
    }
}

/* Fisher Hob, out on the river in a little rowing boat (the epilogue), drifting and bobbing */
class RowBoat extends Ent {
    constructor(tx, ty) { super('rowboat'); this.x = tx * T + 8; this.y = ty * T + 8; this.t = 0; }
    get sortY() { return this.y + 8; }
    update() { this.t++; this.y += 0.03; }
    draw(cx, cy) {
        const x = Math.round(this.x - cx), y = Math.round(this.y - cy + Math.sin(this.t / 24)), im = personFrame('hob', DOWN, 0);
        if (ART.rowboat) Gfx.img(ART.rowboat, x - 13, y - 4);
        if (im) Gfx.sub(im, 0, 0, 16, 14, x - 8, y - 15);
        if (ART.rowboat_front) Gfx.img(ART.rowboat_front, x - 13, y + 1);
        const o = Math.round(Math.sin(this.t / 30) * 2);
        Gfx.line(x - 7, y - 2, x - 15, y + 2 + o, '#6b4128'); Gfx.line(x + 7, y - 2, x + 15, y + 2 + o, '#6b4128');
        Gfx.alpha(0.5); Gfx.rect(x - 15 + (this.t >> 4) % 3, y + 8, 6, 1, '#d8f0fb'); Gfx.rect(x + 8 - (this.t >> 4) % 3, y + 9, 6, 1, '#d8f0fb'); Gfx.alpha(1);
    }
}

/* Gran's bench, by her gate (after the Unwinding): whoever sits on it is drawn sitting, their legs behind the seat; in
   the epilogue Biscuit is curled up between Gran and Linnet */
SPAWN.gardenbench = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.gardenbench, solid: [[0, 0], [1, 0], [2, 0]], oy: -6 });
    pr.baseY = 21;
    pr.draw = (cx, cy) => {
        const x = tx * T - cx, y = ty * T - cy;
        if (ART.gardenbench) Gfx.img(ART.gardenbench, x, y - 6);
        for (const n of pr.area.ents) if (n.seated && n.ty === ty && n.tx >= tx && n.tx < tx + 3) {
            const im = personFrame(n.sprId, DOWN, 0); if (!im) continue;
            Gfx.sub(im, 0, 0, 16, im.height - 5, n.tx * T - cx, y + 11 - im.height);
        }
        if (G.benchCat && ART.catsit) Gfx.img(ART.catsit, x + 16 + 3, y - 5);
        if (ART.gardenbench_front) Gfx.img(ART.gardenbench_front, x, y + 6);
    };
    return pr;
};
{
    /* someone sitting on the bench is drawn by the bench, and doesn't budge when leant on */
    const draw0 = NPC.prototype.draw, push0 = NPC.prototype.onPushed;
    NPC.prototype.draw = function (cx, cy) { if (this.seated) return; return draw0.call(this, cx, cy); };
    NPC.prototype.onPushed = function (p, d) { if (this.seated) return false; return push0.call(this, p, d); };
}
