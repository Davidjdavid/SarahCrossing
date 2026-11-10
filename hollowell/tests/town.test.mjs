// The town between the Houses (src/51b_town_life.js, src/51c_town_favours.js): what's new to say after each turn of
// the Wander (once each, then everyone's themselves again), the town getting stiller, the six favours (each solved as
// a player would, and not without the thing it needs), the journal's news, and every new line fitting its box.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const H = (x, y) => [64 + x, 40 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function game(preset, flags = []) { const HW = loadGame(); HW.preset(preset); HW.step(5); HW.skipTalk(); for (const f of flags) HW.Progress.set(f); return HW; }
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const goH = (HW, x, y) => go(HW, ...H(x, y));
const thing = (HW, id) => HW.G.map.find(id);
/* every page anybody says while fn runs */
function said(HW, fn) {
    const D = HW.global('Dialog'), o0 = D.open, out = [];
    D.open = function (who, text, opts) { out.push(text); return o0.call(this, who, text, opts); };
    try { fn(); } finally { D.open = o0; }
    return out;
}
/* run whatever's being said to its end (answering `choice`), and return the pages */
function talkThrough(HW, choice = 0) {
    const D = HW.global('Dialog'), out = [];
    for (let i = 0; i < 6000 && (D.active || HW.Script.blocking()); i++) {
        if (D.active && D.shown >= D.pageLen()) {
            out.push(D.pages[D.page].join(' '));
            if (D.choices && D.page === D.pages.length - 1) D.sel = choice;
            HW.press('act', 1);
        } else HW.step(1);
    }
    return out.join(' ');
}
/* talk to someone (wherever they are: the talk is theirs, as the game runs it) */
function talk(HW, who, choice = 0) {
    const n = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === who) || { who, kind: 'npc' };
    HW.Script.run(HW.Story.talk(n), { name: 'talk' }); HW.step(2);
    return talkThrough(HW, choice);
}
const plain = s => s.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();

/* ---------------- the news, stage by stage ---------------- */
const STAGE_PRESET = { d1: 'afterD1', d2: 'afterD2', d3: 'afterD3', d4: 'afterD4', d5: 'afterD5', reveal1: 'afterD6', d7: 'afterD7', reveal2: 'afterReveal2', d8: 'afterD8' };
/* (what would come first otherwise: a first meeting, the quiz, the Trials, the doctor's news, a favour's wish) */
const QUIET = ['quiz1', 'met:trials', 'mallow_d5', 'rosaBun', 'festival', 'fav_cratesTold', 'fav_kiteTold', 'fav_tuckTold', 'fav_tinTold', 'fav_saucerTold'];

test('after every turn of the Wander, four to six townsfolk have something new; said once each, then they are themselves', () => {
    const L = loadGame().global('TOWN_LINES');
    for (const [stage, preset] of Object.entries(STAGE_PRESET)) {
        const who = Object.keys(L[stage]).filter(w => w !== 'gran');
        assert.ok(who.length >= 4 && who.length <= 6, `${stage}: ${who.length} people`);
        const HW = game(preset, QUIET);
        HW.warp('hollow', ...H(30, 30)); HW.step(5); HW.skipTalk();      /* (in town: below the Inn they talk shop) */
        for (const w of who) {
            HW.Progress.set('met:' + w);
            const first = talk(HW, w), line = HW.global('TOWN_LINES')[stage][w][0];
            const want = plain(HW.Story.fill(typeof line === 'function' ? line() : line));
            assert.ok(plain(first).includes(want.slice(0, 40)), `${stage} ${w}: "${first}"`);
            const again = talk(HW, w);
            assert.ok(!plain(again).includes(want.slice(0, 40)), `${stage} ${w} says it only once`);
        }
        noErrors(HW);
    }
});

test("only the newest turn's lines: a line from three Houses back is never said late", () => {
    const HW = game('afterD5', QUIET);
    HW.Progress.set('met:gundry');           /* (Gundry's newest are the third Knot's; nothing since) */
    const d5 = talk(HW, 'gundry');
    assert.ok(!/twice in the night/.test(d5), 'not the third Knot\'s news: ' + d5);
    HW.Progress.set('met:rosa');
    assert.match(talk(HW, 'rosa'), /half the night/, "Rosa's newest");
    noErrors(HW);
});

test('Gran: her news once, and after the first reveal her lines move on ("one more House" never said after six)', () => {
    const HW = game('afterD6', QUIET);
    const t1 = talk(HW, 'gran'), t2 = talk(HW, 'gran'), t3 = talk(HW, 'gran');
    assert.match(t1, /told you, then/);
    for (const t of [t2, t3]) assert.ok(!/one more House/.test(t), t);
    noErrors(HW);
});

test('cut free, the townsfolk have lines of their own (the free ones), every time', () => {
    const HW = game('afterD8', QUIET);
    HW.Progress.set('met:hob'); HW.Progress.set('cut:hob');
    assert.match(talk(HW, 'hob'), /my dad's pool|Up past the bend/i);
    HW.Progress.set('met:burr'); HW.Progress.set('cut:burr');
    assert.match(talk(HW, 'burr'), /No post/);
    noErrors(HW);
});

test('the town gets stiller: Hob only stands after the third Knot, Pudding stops chasing at the fourth, Burr moves his post in at the fifth', () => {
    const npc = (HW, who) => HW.G.map.ents.find(e => e.kind === 'npc' && e.who === who);
    const dog = HW => HW.G.map.ents.find(e => e.kind === 'critter' && e.who === 'pudding');
    let HW = game('afterD2'); HW.warp('hollow', ...H(40, 22)); HW.step(5);
    assert.ok(npc(HW, 'hob').route && dog(HW).route, 'walking, chasing');
    HW = game('afterD4'); HW.warp('hollow', ...H(40, 22)); HW.step(5);
    assert.ok(!npc(HW, 'hob').route, 'Hob stands');
    assert.ok(!dog(HW).route, 'Pudding lies by his ball');
    assert.equal(npc(HW, 'burr').ty, H(0, 3)[1]);
    HW = game('afterD5'); HW.warp('hollow', ...H(32, 10)); HW.step(5);
    assert.equal(npc(HW, 'burr').ty, H(0, 7)[1], 'Burr a few steps in');
    HW = game('afterEnding'); HW.warp('hollow', ...H(40, 22)); HW.step(5);
    assert.ok(dog(HW).route, 'after the Unwinding Pudding chases again');
    noErrors(HW);
});

/* ---------------- 1. the Guild's crates (the Gloves) ---------------- */
test("the Guild's crates: jammed, each on the other's way home; pushing gets nowhere", () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...H(25, 28)); HW.step(200);
    const A = thing(HW, 'guildA'), B = thing(HW, 'guildB');
    assert.deepEqual([A.tx, A.ty, B.tx, B.ty], [...H(22, 28), ...H(22, 29)]);
    assert.ok(A.ret.strain > 0 && B.ret.strain > 0, 'both straining');
    goH(HW, 22, 27); HW.push('down', 1); HW.step(10);
    goH(HW, 22, 31); HW.push('up', 1); HW.step(10);
    goH(HW, 25, 28); HW.step(300);
    assert.deepEqual([A.tx, A.ty, B.tx, B.ty], [...H(22, 28), ...H(22, 29)], 'still nose to nose');
    noErrors(HW);
});

function solveCrates(HW) {
    HW.warp('hollow', ...H(25, 28)); HW.step(60);
    const A = thing(HW, 'guildA'), B = thing(HW, 'guildB');
    goH(HW, 23, 28); HW.face('left');
    HW.hold('act'); HW.step(4);
    assert.ok(HW.player().grip === A, 'gripped');
    HW.hold(['act', 'right']); HW.step(19); HW.hold('act');          /* one step back: it comes out into the gap */
    assert.ok(until(HW, () => HW.Return.isHome(B), 400), 'the other goes by, home');
    HW.release();
    assert.ok(until(HW, () => HW.Return.isHome(A), 400), 'let go, it follows it home');
    HW.step(2);
}
test("the Guild's crates: one pulled out into the gap and held lets the other by; Thimble's thanks and her string", () => {
    const HW = game('afterD1');
    solveCrates(HW);
    assert.ok(HW.Progress.flag('fav_cratesHome'));
    HW.warp('store', 5, 6); HW.step(10);
    HW.Progress.set('met:thimble');
    const lines = said(HW, () => talk(HW, 'thimble', 3));
    assert.ok(HW.Progress.flag('fav_crates') && HW.Inv.items.string && HW.Inv.buttons === 30, 'buttons and string');
    fits(lines);
    HW.warp('hollow', ...H(25, 28)); HW.step(10);
    assert.ok(HW.Return.isHome(thing(HW, 'guildA')) && HW.Return.isHome(thing(HW, 'guildB')), 'home for good');
    noErrors(HW);
});

/* ---------------- 2. the kite (the Hookline) ---------------- */
const kite = HW => thing(HW, 'kite');
function hookKite(HW) {
    HW.warp('hollow', ...H(43, 15)); HW.step(30);
    goH(HW, 44, 15); HW.face('right'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(40);
    assert.ok(!kite(HW).caught && kite(HW).tx === H(45, 0)[0], 'hooked down out of the branches');
}
test('the kite: no getting it down before the Hookline (the stick only rustles it; it is far too high to lift)', () => {
    const HW = game('afterD1');
    HW.warp('hollow', ...H(43, 15)); HW.step(30);
    goH(HW, 45, 15); HW.face('right'); HW.press('atk', 1); HW.step(20);
    HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(kite(HW).caught && !HW.player().carry, 'still caught');
    noErrors(HW);
});
test('the kite: hooked down and left alone, it flies home the way it came, up through the branches, and catches again', () => {
    const HW = game('afterD2');
    hookKite(HW);
    goH(HW, 43, 16);
    assert.ok(until(HW, () => kite(HW).caught, 400), 'caught again');
    assert.ok(!HW.Progress.flag('fav_kiteHome'));
    noErrors(HW);
});
test('the kite: carried back over its own thread below the tree, the branches drop out of its way home', () => {
    const HW = game('afterD2');
    hookKite(HW);
    HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry === kite(HW), 'carrying it');
    goH(HW, 45, 18); goH(HW, 46, 17);
    assert.equal(JSON.stringify(kite(HW).ret.trace), JSON.stringify([H(45, 17), H(46, 17)]), 'the loop up the tree is gone');
    HW.face('left'); HW.press('act', 1); HW.step(10);
    goH(HW, 47, 18);
    assert.ok(until(HW, () => HW.Progress.flag('fav_kiteHome'), 600), 'home on its peg');
    noErrors(HW);
});
test('the kite: or thrown in the river: anything that sinks is home at once', () => {
    const HW = game('afterD2');
    hookKite(HW);
    HW.face('right'); HW.press('act', 1); HW.step(10);
    goH(HW, 47, 14); goH(HW, 48, 14);
    HW.face('right'); HW.press('act', 1);
    assert.ok(until(HW, () => HW.Progress.flag('fav_kiteHome'), 300), 'home');
    noErrors(HW);
});
test('the kite home: the children need string; they give their stray marble; Tuck, given it, gives his buttons', () => {
    const HW = game('afterD2', ['fav_kiteHome', 'met:nell', 'met:tuck']);
    HW.warp('hollow', ...H(36, 20)); HW.step(10);
    assert.match(talk(HW, 'nell'), /need string/i);
    HW.Inv.items.string = 1;
    let lines = said(HW, () => talk(HW, 'nell', 0));
    assert.ok(HW.Progress.flag('fav_kite') && HW.Inv.items.marble && !HW.Inv.items.string, 'string given, marble got');
    fits(lines);
    HW.warp('hollow', ...H(36, 20)); HW.step(10);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'kitefly'), 'flying');
    lines = said(HW, () => talk(HW, 'tuck', 0));
    assert.ok(HW.Progress.flag('fav_marble') && !HW.Inv.items.marble && HW.Inv.buttons === 15 + 11, 'his buttons (but the blue one)');
    fits(lines);
    HW.warp('hollow', ...H(10, 32)); HW.step(5);
    assert.ok(HW.G.map.ents.some(e => e.im === HW.ART.tuck_marble), 'the marble where Tuck put it');
    noErrors(HW);
});
test("Thimble's string from the crates is the children's string (a chain: the crates, the kite, the marble, Tuck)", () => {
    const HW = game('afterD2');
    solveCrates(HW);
    HW.warp('store', 5, 6); HW.step(10); HW.Progress.set('met:thimble');
    talk(HW, 'thimble', 3);
    HW.Progress.set('fav_kiteHome'); HW.Progress.set('met:nell');
    HW.warp('hollow', ...H(36, 20)); HW.step(10);
    talk(HW, 'nell', 0);
    assert.ok(HW.Progress.flag('fav_kite') && !HW.Inv.items.string && HW.Inv.items.marble);
    noErrors(HW);
});

/* ---------------- 4. Mabel's floor of strays (the Recall Bell) ---------------- */
function inMabels(HW) { HW.warp('lostfound', 6, 7); HW.step(30); HW.skipTalk(); }
test("Mabel's strays: the sewing tin is asleep; nothing moves it but a ring", () => {
    const HW = game('afterD3');
    inMabels(HW);
    const tin = thing(HW, 'mabelTin');
    assert.ok(HW.Return.asleep(tin));
    go(HW, 9, 4); HW.face('down'); HW.push('down', 1); HW.step(5);
    assert.deepEqual([tin.tx, tin.ty], [9, 5], "won't budge");
    noErrors(HW);
});
test("Mabel's strays: rung awake, the tin snaps home, stops at the heavy stray on its thread; moved off, it's home; Mabel's thanks", () => {
    const HW = game('afterD4', ['festival']);
    inMabels(HW);
    const tin = thing(HW, 'mabelTin'), stone = thing(HW, 'mabelStone');
    go(HW, 6, 6); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(60);
    assert.deepEqual([tin.tx, tin.ty], [6, 4], 'waiting behind the stone');
    go(HW, 5, 3); HW.face('down'); HW.push('down', 1); HW.step(5); HW.walkTo(7, 2);       /* (out of its way: it's home before she's there) */
    assert.deepEqual([stone.tx, stone.ty], [5, 5], 'a stray stays pushed');
    const lines = said(HW, () => { until(HW, () => HW.Progress.flag('fav_tin'), 300); talkThrough(HW); });
    assert.ok(HW.Inv.items.oddsock && HW.Inv.buttons === 40, 'a stray of your own, and buttons');
    fits(lines);
    inMabels(HW);
    assert.ok(HW.Return.isHome(thing(HW, 'mabelTin')), 'home for good');
    noErrors(HW);
});
test("Mabel's strays: rung but left, the tin lies down again (no favour done behind your back)", () => {
    const HW = game('afterD4', ['festival']);
    inMabels(HW);
    go(HW, 6, 6); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(60);
    inMabels(HW);
    assert.ok(HW.Return.asleep(thing(HW, 'mabelTin')) && !HW.Progress.flag('fav_tin'));
});

/* ---------------- 5. Jory's back room (the Crossbar) ---------------- */
test("Jory's back room: the shop's puppet through the little hole onto the latch: the parcel's off home to Tuck; the chest", () => {
    const HW = game('afterD6');
    HW.warp('hollow', ...H(24, 12)); HW.step(5);
    assert.ok(HW.G.map.ents.some(e => e.kind === 'stickthread'), "the parcel's thread out in the street");
    HW.warp('toys', 6, 8); HW.step(30); HW.skipTalk();
    const door = thing(HW, 'jDoor');
    assert.ok(!door.open, 'shut');
    go(HW, 9, 8); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const m of 'LLUUUURRU') { HW.hold(names[m]); HW.step(4); HW.release(); HW.step(14); }
    assert.ok(door.open, 'the latch');
    assert.ok(until(HW, () => HW.Progress.flag('fav_stick'), 300), 'the parcel out of the door');
    HW.press('tool', 1); HW.step(2);
    go(HW, 3, 5); go(HW, 1, 3); HW.face('up'); HW.press('act', 1); HW.step(5); HW.skipTalk();
    assert.equal(HW.Inv.buttons, 50);
    HW.warp('hollow', ...H(8, 31)); HW.step(5);
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'stickthread'), 'its thread gone');
    HW.Progress.set('met:tuck'); HW.Progress.set('fav_tuckTold');
    assert.match(talk(HW, 'tuck'), /stick/);
    noErrors(HW);
});
test("Jory's back room: shut before the Crossbar; the parcel strains at the door", () => {
    const HW = game('afterD5');
    HW.warp('toys', 6, 8); HW.step(200);
    const par = thing(HW, 'jParcel');
    assert.ok(par.ret.state === 'returning' && par.ret.strain > 0 && !thing(HW, 'jDoor').open);
    noErrors(HW);
});

/* ---------------- 6. Rosa's saucer for Biscuit (the Needle) ---------------- */
function carrySaucerBack(HW) {
    HW.warp('hollow', ...H(40, 34)); HW.step(20);
    goH(HW, 40, 33); HW.face('up'); HW.press('act', 1); HW.step(10);
    goH(HW, 42, 32); goH(HW, 43, 27);
    HW.face('left'); HW.press('act', 1); HW.step(5);           /* set down: too full to throw */
    assert.deepEqual([thing(HW, 'saucer').tx, thing(HW, 'saucer').ty], H(42, 27));
}
test("Rosa's saucer: set out on the back step, it walks itself home round the front", () => {
    const HW = game('afterD7');
    carrySaucerBack(HW);
    goH(HW, 44, 24);
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'saucer')), 900), 'home');
    assert.deepEqual([thing(HW, 'saucer').tx, thing(HW, 'saucer').ty], H(40, 32));
    assert.ok(!HW.Progress.flag('fav_saucerPlaced'));
    noErrors(HW);
});
test("Rosa's saucer: given a place on the back step with the Needle, it stays; Biscuit gets his cream; Rosa's thanks and her buns", () => {
    const HW = game('afterD7', ['met:rosa']);
    HW.Inv.stitches = [];
    carrySaucerBack(HW);
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    HW.hold('down'); HW.step(2); HW.release(); HW.step(8);
    HW.press('tool', 1); HW.step(30);
    assert.ok(HW.Progress.flag('fav_saucerPlaced'), 'its place now');
    goH(HW, 44, 24); HW.step(400);
    assert.deepEqual([thing(HW, 'saucer').tx, thing(HW, 'saucer').ty], H(42, 28), 'stays');
    assert.ok(until(HW, () => thing(HW, 'saucer').licked, 7000), 'Biscuit comes round and laps it up');
    const lines = said(HW, () => talk(HW, 'rosa'));
    assert.ok(HW.Progress.flag('fav_saucer') && HW.Inv.buttons === 20);
    fits(lines);
    HW.Inv.hp = 1;
    talk(HW, 'rosa');
    assert.equal(HW.Inv.hp, HW.Inv.maxHp, 'a bun on the house');
    noErrors(HW);
});

/* ---------------- the journal, the looks, later saves ---------------- */
test("the journal tells what's new in town until it's done, and all of it at once still fits", () => {
    const HW = game('afterD7');
    const news = () => HW.global('TOWN_NEWS').filter(([on, done]) => on() && !done()).map(n => n[2]);
    assert.ok(news().some(s => /crates/.test(s)) && news().some(s => /saucer/.test(s)) && news().some(s => /Jory/.test(s)));
    HW.G.wanderer = 'WWWWWWWWWW';
    const P = HW.probe(true), M = HW.global('PauseMenu'), Game = HW.global('Game');
    M.open(); M.tab = M.tabs.indexOf('Journal');
    for (let i = 0; i < 3; i++) { Game.render(); P.frame(); }
    M.close();
    const issues = P.report().issues.filter(i => i.kind === 'text');
    assert.equal(issues.length, 0, issues.map(i => i.key + ' -- ' + i.detail).join('\n'));
    for (const f of ['fav_cratesHome', 'fav_kite', 'fav_tin', 'fav_stick', 'fav_saucerPlaced']) HW.Progress.set(f);
    assert.ok(!news().some(s => /crates|kite|strays|Jory|saucer/.test(s)), 'done, gone from the news');
});

test('the north gate: the first time you come out into town after it opens, you see it standing open', () => {
    const HW = game('afterD7');
    HW.Progress.set('north_gate');
    HW.warp('inn', 7, 6); HW.step(10);
    go(HW, 7, 7); HW.hold('down'); until(HW, () => HW.G.map.id === 'hollow', 120); HW.release();
    assert.ok(until(HW, () => HW.global('Dialog').active, 300), 'shown');
    assert.match(HW.global('Dialog').pages.flat().join(' '), /gate/);
    HW.skipTalk();
    assert.ok(HW.Progress.flag('north_gate_seen'));
    noErrors(HW);
});

test('the Inn after the first reveal: the Staff door stands ajar (a notice; nothing stops)', () => {
    const HW = game('afterD6');
    HW.warp('inn', 7, 6); HW.step(5);
    assert.ok(HW.global('UI').toasts.some(t => /STAFF ONLY/.test(t.s)));
    assert.ok(!HW.global('Dialog').active);
});

test('a save mid-favour loads with the favour as it stood: the crates still jammed, the kite in its tree', () => {
    const HW = game('afterD3');
    HW.warp('hollow', ...H(25, 28)); HW.step(30);
    goH(HW, 23, 28); HW.face('left'); HW.hold('act'); HW.step(4); HW.hold(['act', 'right']); HW.step(19); HW.release();
    HW.Save.write(1);
    const code = HW.Save.code(1);
    const H2 = loadGame();
    H2.global('Game').load(H2.Save.fromCode(code));
    H2.step(5); H2.warp('hollow', ...H(25, 28)); H2.step(200);
    const A = H2.G.map.find('guildA'), B = H2.G.map.find('guildB');
    assert.ok(A && B && !H2.Return.isHome(A) && !H2.Return.isHome(B), 'jammed again');
    H2.warp('hollow', ...H(43, 15)); H2.step(5);
    assert.ok(H2.G.map.find('kite').caught, 'the kite up its tree');
    noErrors(H2);
});

test('after the Unwinding a thank-you still owing is still said (the crates, then Thimble)', () => {
    const HW = game('afterEnding');
    solveCrates(HW);
    HW.warp('store', 5, 6); HW.step(10);
    talk(HW, 'thimble', 3);
    assert.ok(HW.Progress.flag('fav_crates') && HW.Inv.items.string);
    noErrors(HW);
});

/* ---------------- every new line fits its box ---------------- */
let FONT_G = null, PG = null, FILL = null;
function fits(texts) {
    for (const t of texts) {
        const s = FILL(t);
        for (const ch of s.replace(/\{[^}]*\}/g, '')) assert.ok(FONT_G[ch], `a character the font hasn't got (${JSON.stringify(ch)}) in "${t}"`);
        const pages = PG(s, 246, 3);          /* (as narrow as it gets: the box with a portrait in it) */
        assert.ok(pages.length <= 3, `${pages.length} pages: "${t}"`);
        for (let i = 1; i < pages.length; i++) {
            const prev = pages[i - 1].join(' ');
            if (!/[.!?]["')]*$/.test(prev)) assert.ok(pages[i].length >= 2, `a stub page: "${pages[i].join(' ')}"`);
        }
    }
}
{
    const HW = loadGame();
    FONT_G = HW.global('FONT'); PG = HW.global('paginate');
    HW.G.wanderer = 'WWWWWWWWWW';
    FILL = s => HW.Story.fill(s);
}
test('every new line (the news, Gran, the freed, the favours) is in the font and fits the box in three pages or fewer', () => {
    const HW = loadGame(); HW.G.wanderer = 'WWWWWWWWWW';
    const lines = HW.global('Town').allLines().map(([, l]) => l);
    for (const L of Object.values(HW.global('FREE_LINES'))) lines.push(...L);
    for (const n of HW.global('TOWN_NEWS')) lines.push('Also in town: ' + n[2] + '.');
    for (const id of ['string', 'marble', 'oddsock']) { lines.push(HW.global('ITEM_LINES')[id](), HW.global('ITEMS')[id].desc); }
    assert.ok(lines.length > 80, `${lines.length} lines`);
    fits(lines);
});
