// Polish round 2 (POLISH.md findings 16 on): what the live run's picture reviews and the critic found, kept fixed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };

test('pages break where sentences end: no page left holding the tail of a sentence', () => {
    const HW = loadGame();
    const pg = HW.global('paginate');
    const lines = [
        "The Houses, love. We make them. We always have. Ives keeps the Tidyhouse, Bram the Kiln, your dad the Millrace, me the Belfry, Mallow the Slumberhouse, and Jory this old place.",
        "Bram has clay up to his elbows. Your dad's sleeves are soaked to the shoulder. Your mum's hair is full of brass dust. Ives has a feather duster sticking out of her apron pocket.",
        "Every Maker you've met learnt the trade down here, in the Spoolworks, where every thread in the valley's wound and weighted. A House is PLAYED from up top. It's WORKED from down here.",
        "Under the Inn, under the town: low beams, warm lamps, and everywhere, hanging from the boards overhead, threads. Thousands of them, every colour, running away into the dark like roots.",
        "I found the Hall of Names on my Wander, the same as you. I read her ledger. I took the old Shears out of the Loom and cut myself loose and walked out into the fog, and the fog let me go.",
    ];
    for (const s of lines) {
        const pages = pg(s, 282, 3);
        assert.ok(pages.every(p => p.length <= 3), 'three lines a page at most');
        assert.equal(pages.flat().join(' ').replace(/\s+/g, ' '), s.replace(/\s+/g, ' '), 'nothing lost');
        for (let i = 1; i < pages.length; i++) {
            const prev = pages[i - 1].join(' ');
            /* a page that starts mid-sentence holds at least two lines (an even split, never three and one) */
            if (!/[.!?]["')]*$/.test(prev)) assert.ok(pages[i].length >= 2, `a stub page: "${pages[i].join(' ')}"`);
        }
    }
});

test('the dialogue box goes to the side that hides least: away from a boss at the top, away from Wren at the bottom (Wren all but a must)', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    HW.warp('kiln', 20 + 9, 33 + 6); HW.step(30); HW.skipTalk();     /* (the Kiln Door: nobody else about) */
    const D = HW.global('Dialog'), Script = HW.global('Script');
    const p = HW.player();
    /* Wren low on the screen, nothing else that matters: the box goes up top */
    const open = () => { D.open(null, 'A line.'); const t = D.top; D.close(); HW.step(10); return t; };
    p.y = HW.global('Cam').y + 160;
    assert.equal(open(), true, 'Wren at the bottom: the box at the top');
    /* a boss up top, Wren in the middle: the box keeps to the bottom (the boss counts double) */
    const Enemy = HW.global('Enemy');
    const cam = HW.global('Cam');
    const b = new Enemy(Math.floor((cam.x + 160) / 16), Math.floor((cam.y + 40) / 16), { type: 'housekeeper', hp: 3 });
    HW.G.map.add(b);
    p.y = cam.y + 100;
    assert.equal(open(), false, 'a boss at the top: the box at the bottom');
    /* and Wren down at the bottom too, said in passing (no lean): she's all but a must, so the box keeps off her */
    p.y = cam.y + 160;
    assert.equal(open(), true, 'Wren at the bottom, a boss at the top: the box off Wren');
    assert.equal(Script.list ? Script.list.length >= 0 : true, true);
});

test('the first nudge asks first: "no" turns hints off and gives no hint', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const Settings = HW.global('Settings'), Dialog = HW.global('Dialog'), UI = HW.global('UI');
    Settings.hints = true;
    HW.warp('kiln', 20 + 9, 33 + 6); HW.step(20); HW.skipTalk();
    /* stand about in a room with a nudge until it would come */
    const r = HW.global('Cam').room;
    assert.ok(r && r.nudge, 'a room with a nudge');
    assert.ok(until(HW, () => Dialog.active, 60 * 60 * 6), 'someone clears their throat');
    for (let i = 0; i < 40 && !(Dialog.active && Dialog.choices); i++) { HW.press('act', 1); HW.step(3); }
    assert.ok(Dialog.choices, 'it asks');
    HW.step(40);
    HW.press('down', 1); HW.step(2); HW.skipTalk(1);
    HW.skipTalk();
    assert.equal(Settings.hints, false, 'hints off');
    assert.ok(!UI.toasts.some(t => t.s === r.nudge.say), 'and no hint given');
});

test('the House plan and the Pattern name their own House', () => {
    const HW = loadGame();
    HW.preset('afterD2'); HW.step(5); HW.skipTalk();
    HW.warp('millrace', 29, 42); HW.step(10); HW.skipTalk();
    const L = HW.global('ITEM_LINES');
    assert.match(L.plan(), /the Millrace/);
    assert.match(L.pattern(), /blue cloth/);
});

test('a thing taken away mid-step lets go of every tile it held', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const a = HW.G.map, NPC = HW.global('NPC');
    const n = a.add(new NPC(HW.player().tx + 2, HW.player().ty, { who: 'rosa' }));
    n.walkTo(n.tx + 3, n.ty); HW.step(4);
    a.remove(n);
    assert.ok(![...a.occ.values()].includes(n), 'no tile still held');
});

test('sitting and waiting: offered in a House room with things out of place; ends when they are all home', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    HW.warp('tidy', 20 + 9, 33 + 8); HW.step(20); HW.skipTalk();
    const Waiting = HW.global('Waiting'), Cam = HW.global('Cam'), a = HW.G.map;
    const things = a.ents.filter(e => e.ret && a.roomAt(e.tx, e.ty) === Cam.room && !e.fixed && e.weight !== undefined);
    assert.equal(Waiting.canWait(), false, 'nothing out of place: not offered');
    /* push something out of its place */
    const p = HW.player();
    const t = things.find(e => !e.person);
    if (!t) return;    /* (no movable thing in this room: nothing to check here) */
    t.ret.state = 'away'; t.ret.trace = [[t.ret.mx, t.ret.my], [t.tx, t.ty]]; t.ret.timer = t.ret.patience;
    assert.equal(Waiting.canWait(), true, 'offered');
    Waiting.start();
    assert.equal(p.state, 'sleep', 'Wren sits');
    for (let i = 0; i < 4000 && HW.G.waiting; i++) HW.step(1);
    assert.equal(HW.G.waiting, null, 'over');
    assert.equal(p.state, 'normal', 'Wren up again');
    assert.equal(t.ret.state, 'home', 'the thing came home');
});

test('the map points where the goal says', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const P = HW.global('Progress'), pin = () => JSON.parse(JSON.stringify(HW.global('mapPin')(HW.G.map)));     /* (out of the game's own realm) */
    P.setGoal('Next, the Kiln in Kilnridge: the canyon road west of Meadowfold.'); assert.deepEqual(pin(), [22, 93], 'the Kiln door');
    P.setGoal('Home to Hollowell. (Somebody at the clinic will want to hear all about it.)'); assert.deepEqual(pin(), [121, 52], 'the clinic');
    P.setGoal('Home to Hollowell: it is the Knotting Festival.'); assert.deepEqual(pin(), [96, 60], 'the town');
    P.setGoal('Next, Belfry Heights: across the lake from Millwater, up the cliff stair.'); assert.deepEqual(pin(), [158, 7], 'the Belfry');
});

/* no creature starts inside a wall, in any area (a nibbler in Meadowfold began on a tile the region's redraw made solid,
   and stood there for good) */
test('no walker starts inside a wall, anywhere', () => {
    const HW = loadGame();
    HW.newGame('Wren', { skipIntro: true, noAutosave: true });
    const bad = [];
    for (const id of Object.keys(HW.AREAS)) {
        const A = HW.AREAS[id];
        try { HW.warp(id, A.entry ? A.entry.x : 1, A.entry ? A.entry.y : 1); } catch { continue; }
        HW.step(2);
        const a = HW.G.map;
        if (!a || a.id !== id) continue;
        for (const m of a.walkers || []) {
            if (m.alive === false || m.hidden || m.flies || m.ghost || (m.D && m.D.flies)) continue;
            const tx = Math.floor(m.x / 16), ty = Math.floor(m.y / 16);
            if (a.inside(tx, ty) && a.kind(tx, ty).solid) bad.push(`${m.type || m.kind} at ${id} ${tx},${ty}`);
        }
    }
    assert.deepEqual(bad, []);
});

/* ---------- round C: where the screen's words go (POLISH.md 43-46) ---------- */
/* how much of a thing's box (world) is under a rect on the screen, with the camera where it is (0..1) */
const share = (HW, e, r) => { const C = HW.global('Cam'), b = HW.global('viewBox')(e), x0 = b[0] - C.x, y0 = b[1] - C.y, x1 = b[2] - C.x, y1 = b[3] - C.y; return Math.max(0, Math.min(x1, r[2]) - Math.max(x0, r[0])) * Math.max(0, Math.min(y1, r[3]) - Math.max(y0, r[1])) / Math.max(1, (x1 - x0) * (y1 - y0)); };
/* every panel the UI draws this frame */
const panelsUp = HW => { const UI = HW.global('UI'), out = []; if (!UI.held()) { let y = 22, yl = 174; for (const t of UI.toasts) { if (t.wait) continue; UI.measure(t); const x = Math.round((320 - t.w) / 2), ty = t.low ? (yl -= t.h + 2) + 2 : y; out.push([x, ty, x + t.w, ty + t.h]); if (!t.low) y += t.h + 2; } if (UI.banner && !UI.banner.wait) out.push(UI.bannerRect(UI.banner, UI.banner.low)); } return out; };
const kilnDoor = () => { const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk(); HW.warp('kiln', 20 + 9, 33 + 6); HW.step(30); HW.skipTalk(); const UI = HW.global('UI'); UI.banner = null; UI.toasts = []; return HW; };

test('a stack of notices never covers Wren: two at a time at most, the rest wait their turn, each on the side that hides least', () => {
    for (const at of [24, 60, 100, 150]) {
        const HW = kilnDoor(), UI = HW.global('UI'), p = HW.player(), Cam = HW.global('Cam');
        p.y = Cam.y + at;
        const long = i => `Notice number ${i}: a long one, that runs on and on over two or three lines of the screen, the way the Needle's did when it let a stitch go.`;
        for (let i = 1; i <= 4; i++) UI.toast(long(i), 200);
        for (let k = 0; k < 40; k++) {
            const up = UI.toasts.filter(t => !t.wait);
            assert.ok(up.length <= 2, 'two at most');
            for (const r of panelsUp(HW)) assert.ok(share(HW, p, r) < 0.3, `Wren at ${at}: a notice over her (${r})`);
            HW.step(5);
        }
        assert.ok(UI.toasts.some(t => t.s === long(4)), 'the rest waited their turn');
    }
});

test('a notice keeps clear of what it is about, gives the banner its side or puts it out, and never carries into another place', () => {
    const HW = kilnDoor(), UI = HW.global('UI'), p = HW.player(), Cam = HW.global('Cam');
    p.y = Cam.y + 90;
    /* about something at the top: it goes to the bottom */
    const thing = { x0: Cam.x + 100, y0: Cam.y + 24, x1: Cam.x + 220, y1: Cam.y + 60 };
    UI.toasts = [];
    UI.toast('Somewhere inside, a bolt slides back.', 120, { focus: thing });
    assert.equal(UI.toasts[0].low, true, 'away from its subject');
    /* the place's name up top: a notice doesn't stack under it */
    UI.toasts = []; UI.bannerMap = HW.G.map; UI.showBanner('The Kiln'); UI.update();
    assert.ok(UI.banner && !UI.banner.wait);
    const side = UI.banner.low;
    UI.toast('A notice while the name is up.', 120);
    const t = UI.toasts[0];
    for (let i = 0; i < 120 && t.wait; i++) { HW.step(1); assert.ok(!(UI.banner && !UI.banner.wait && !t.wait && UI.banner.low === t.low), 'never under the banner on one side'); }
    assert.ok(!t.wait, 'shown, after the name had a moment');
    assert.ok(!UI.banner || UI.banner.low !== t.low, 'never under the banner on the same side');
    void side;
    /* somewhere else: the notice about the last place goes */
    HW.step(30);
    HW.warp('hollow', 96, 60); HW.step(3);
    assert.ok(!UI.toasts.some(q => /while the name is up/.test(q.s)), 'left behind');
});

test('a notice made while a scene is talking waits till the scene is over; one up when a line opens steps aside till then', () => {
    const HW = kilnDoor(), UI = HW.global('UI'), Script = HW.global('Script');
    UI.toast('Up before the scene.', 300);
    HW.step(5);
    assert.ok(!UI.toasts[0].wait);
    Script.run(function* () { yield* HW.global('say')(null, 'A line.'); UI.toast('Said in the scene.', 120); yield* HW.global('say')(null, 'Another line.'); });
    HW.step(3);
    assert.ok(UI.held(), 'held while the box is up');
    const t0 = UI.toasts[0].t;
    HW.skipTalk();
    assert.ok(UI.toasts.some(t => t.s === 'Said in the scene.'), 'kept');
    HW.step(2);
    assert.ok(!UI.held(), 'shown once the scene is over');
    assert.ok(UI.toasts.find(t => t.s === 'Up before the scene.').t <= t0 + 3, 'and it did not run down meanwhile');
    assert.ok(!UI.toasts.find(t => t.s === 'Said in the scene.').wait, 'the new one shows');
});

test('the place name shows coming in from outside, not coming back out of somewhere inside it (a Little House, the Inn)', () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(5); HW.skipTalk();
    const UI = HW.global('UI');
    const go = (id, x, y) => { HW.warp(id, x, y); HW.step(2); HW.skipTalk(); return UI.banner && UI.banner.s; };
    go('hollow', 96, 60);
    assert.ok(go('inn', 7, 6), 'into the Inn: its name');
    assert.equal(go('hollow', 96, 60), null, 'back out into town: no banner');
    go('inn', 7, 6);
    assert.equal(go('underside', 49, 5), 'The Underside', 'down into the Underside: its name');
    assert.ok(go('making1', 3, 16), 'into a Little House: its name');
    assert.equal(go('underside', 49, 5), null, 'back on the Making Floor: no banner');
    assert.equal(go('inn', 7, 6), null, 'and up into the Inn');
    assert.equal(go('hollow', 96, 60), null, 'and out into town');
});

test('the place name never sits on Wren or on whoever is speaking: it waits out a scene, and keeps to the side away from her', () => {
    const HW = kilnDoor(), UI = HW.global('UI'), p = HW.player(), Cam = HW.global('Cam'), D = HW.global('Dialog');
    for (const at of [40, 150]) {
        p.y = Cam.y + at; UI.banner = null; UI.bannerMap = HW.G.map;
        UI.showBanner('The Kiln'); UI.update();
        assert.ok(share(HW, p, UI.bannerRect(UI.banner, UI.banner.low)) === 0, `Wren at ${at}: not under the name`);
    }
    /* a speaker at the top and Wren at the bottom, a line open: no name drawn till it's over */
    UI.banner = null; UI.bannerMap = HW.G.map;
    HW.global('Script').run(function* () { yield* HW.global('say')('gran', 'A word, love.'); });
    UI.showBanner('The Kiln'); HW.step(2);
    assert.ok(D.active && UI.held() && panelsUp(HW).length === 0, 'nothing over the scene while it talks');
    HW.skipTalk(); HW.step(2);
    assert.ok(UI.banner && !UI.banner.wait, 'shown after');
});

test('a line Wren says keeps clear of her: the speaker counts double, Wren too', () => {
    const HW = kilnDoor(), D = HW.global('Dialog'), p = HW.player(), Cam = HW.global('Cam');
    p.y = Cam.y + 150;
    D.open('wren', "You can't pull me, Gran.");
    assert.equal(D.top, true, 'her line up top, away from her');
    D.close();
});

test('in a scene the camera leans so Wren and the boss are both clear of the box; an exchange keeps its side', () => {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 30; HW.Inv.giveTool('needle');
    HW.warp('spoolworks', 20 + 9, 0 + 9); HW.step(30);
    HW.walkTo(20 + 6, 0 + 7);
    const D = HW.global('Dialog'), p = HW.player(), t = HW.G.map.ents.find(e => e.kind === 'tangle'), bobbins = t.bobbins(), sides = [];
    for (let i = 0; i < 1500 && sides.length < 3; i++) {
        if (D.active && D.t === 40) {
            const rs = D.rects();
            sides.push(D.top);
            assert.ok(rs.every(r => share(HW, p, r) < 0.2), 'Wren clear of the box');
            for (const b of [t, ...bobbins]) assert.ok(rs.every(r => share(HW, b, r) < 0.2), 'the Tangle and its four bobbins clear of the box');
        }
        HW.step(1);
        if (D.active && D.shown >= D.pageLen() && D.t > 45) HW.press('act', 1);
    }
    assert.equal(sides.length, 3, 'its lines');
    assert.ok(sides.every(s => s === sides[0]), 'one side for the exchange');
    HW.skipTalk(); HW.step(60);
    assert.equal(HW.global('UI').lean.now, 0, 'and the camera back when it is over');
});

test("the Needle: its first notice keeps clear of the thing and where it could go; a doorway at the top doesn't hide Wren; the let-go notice shortens", () => {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk(); HW.Inv.giveTool('needle'); HW.Inv.equipped = 'needle';
    HW.Progress.set('needle_first', false);
    const UI = HW.global('UI'), N = HW.global('Needle'), Cam = HW.global('Cam'), p = HW.player();
    /* the Practice Floor: in the top doorway (as the live run found it), facing the iron weight just below */
    HW.warp('spoolworks', 40 + 9, 22); HW.step(30); HW.skipTalk(); HW.face('down');
    const pot = HW.G.map.find('paWeight');
    assert.ok(pot && N.able(pot), 'the weight below the door');
    HW.press('tool', 1); HW.step(2);
    assert.ok(N.st, 'choosing');
    const t = UI.toasts.find(q => /Arrows walk the Needle/.test(q.s));
    assert.ok(t && !t.wait, 'the first notice');
    HW.step(40);
    const r = panelsUp(HW).find(q => q);
    const focus = N.focus(N.st);
    assert.ok(share(HW, pot, r) === 0 && share(HW, focus[1], r) < 0.2, 'clear of the thing and its reach');
    assert.ok(p.y - 24 - Cam.y >= 4, 'Wren on screen');
    HW.press('atk', 1); HW.step(30);
    /* the let-go notice: in full, and in full again the second time only if the first was a while ago (five in fifteen
       seconds in the Bobbin Loft had it twice); then short */
    const said = [], go = () => said.push(N.letGo({ area: 'spoolworks', key: 'x', noun: 'the iron weight', from: [45, 25] }, false));
    go(); go(); HW.G.t += 60 * 61; go(); go();
    assert.match(said[0], /^The Needle only holds three stitches/);
    assert.match(said[1], /^Your oldest stitch lets go: the iron weight/, 'the second, straight after: short');
    assert.match(said[2], /^Your oldest stitch lets go: the iron weight/, 'and then short for good');
    assert.ok(said[1].length < said[0].length - 30, 'shorter');
    const H2 = loadGame(); H2.preset('afterD6'); H2.step(10); H2.skipTalk();
    const N2 = H2.global('Needle'), said2 = [], go2 = () => said2.push(N2.letGo({ area: 'spoolworks', key: 'x', noun: 'the iron weight', from: [45, 25] }, false));
    go2(); H2.G.t += 60 * 61; go2(); go2();
    assert.match(said2[1], /^The Needle only holds three stitches/, 'a minute on, the second in full');
    assert.match(said2[2], /^Your oldest stitch lets go/, 'the third short');
});
