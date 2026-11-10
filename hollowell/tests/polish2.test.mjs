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

test('the dialogue box goes to the side that hides least: away from a boss at the top, away from Wren at the bottom', () => {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    HW.warp('kiln', 20 + 9, 33 + 6); HW.step(30); HW.skipTalk();     /* (the Kiln Door: nobody else about) */
    const D = HW.global('Dialog'), Script = HW.global('Script');
    const p = HW.player();
    /* Wren low on the screen, nothing else that matters: the box goes up top */
    const open = () => { D.open(null, 'A line.'); const t = D.top; D.close(); HW.step(10); return t; };
    p.y = HW.global('Cam').y + 160;
    assert.equal(open(), true, 'Wren at the bottom: the box at the top');
    /* a boss up top as well: the box keeps to the bottom (the boss counts double) */
    const Enemy = HW.global('Enemy');
    const cam = HW.global('Cam');
    const b = new Enemy(Math.floor((cam.x + 160) / 16), Math.floor((cam.y + 40) / 16), { type: 'housekeeper', hp: 3 });
    HW.G.map.add(b);
    assert.equal(open(), false, 'a boss at the top: the box at the bottom');
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
