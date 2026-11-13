// Fix round I (POLISH.md 85-88): Linnet's notes 4, 5 and 8 told in words that fit where they lie, note 4 there as soon as
// the lullaby's sung; the Pile's Heartstitch never walled in by the strays it leaves in a corner nook; every goal line's
// flag on the valley's map on or next to the place it names (the broken bridge's was ten tiles off); the Guild's key
// opens the Loom's great doors, as its description says.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAVES = JSON.parse(fs.readFileSync(path.join(ROOT, 'qa_kit', 'saves', 'save_states.json'), 'utf8'));
const code = id => SAVES.find(s => s.id === id).code;
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y, 20000), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const load = c => { const HW = loadGame(); HW.global('Game').load(HW.Save.fromCode(c)); HW.step(40); HW.skipTalk(); return HW; };
const settle = HW => { for (let i = 0; i < 12; i++) { HW.step(10); HW.skipTalk(); } };
/* everything said while fn runs */
const listen = (HW, fn) => { const lines = [], D = HW.Dialog, open0 = D.open; D.open = function (who, t, o) { lines.push(HW.Story.fill(t)); return open0.call(this, who, t, o); }; try { fn(); } finally { D.open = open0; } return lines; };
const read = (HW, d) => listen(HW, () => { HW.face(d); HW.press('act', 1); HW.step(3); settle(HW); });
const OUTDOOR = 'Someone has carved a little "L." into the ground here. Tucked into the grass beside it, a folded note, yellow with age.';

test("Linnet's notes 4, 5 and 8 are told in words that fit where they lie (the notes themselves word for word)", () => {
    const check = (HW, n, lines) => {
        const L = HW.global('LINNET_NOTES')[n];
        assert.ok(HW.Progress.flag('linnet' + n), 'note ' + n + ' read');
        assert.notEqual(lines[0], OUTDOOR, 'note ' + n + ': not the grass');
        assert.equal(lines[0], L.found);
        assert.equal(lines[1], '"' + L.text + '"');
    };
    /* 8: the Stray House's Porch, its floorboards */
    let HW = load(code('T65'));
    go(HW, 33, 42); check(HW, 8, read(HW, 'up'));
    assert.match(HW.global('LINNET_NOTES')[8].found, /floorboard/);
    noErrors(HW);
    /* 5: the bottle on the beach below the falls */
    HW = load(code('T49'));
    HW.warp('hollow', 172, 115); HW.step(10); HW.skipTalk();
    check(HW, 5, read(HW, 'left'));
    assert.match(HW.global('LINNET_NOTES')[5].found, /bottle/);
    /* (and it's drawn as a bottle) */
    assert.equal(HW.G.map.ents.find(e => e.kind === 'prop' && e.tx === 171 && e.ty === 115).im, HW.global('ART').note_bottle);
    noErrors(HW);
    /* 4: the Belfry's Echo Room, in the tower */
    HW = echoRoom();
    sing(HW);
    go(HW, 55, 30); check(HW, 4, read(HW, 'right'));
    assert.match(HW.global('LINNET_NOTES')[4].found, /floorboards/);
    noErrors(HW);
    /* (the outdoor ones keep theirs: note 2 under the hay bale in Meadowfold) */
    assert.equal(HW.global('LINNET_NOTES')[2].found, undefined);
});

/* the Echo Room (the Belfry's 2,2), from after the eighth House (the Trail not yet begun): the stones struck in Gran's
   lullaby, low, high, middle, high, low (tests/belfry.test.mjs) */
function echoRoom() {
    const HW = load(code('T49'));
    HW.warp('belfry', 49, 28); HW.step(20); HW.skipTalk();
    return HW;
}
function sing(HW) {
    for (const x of [45, 53, 49, 53, 45]) { go(HW, x, 27); HW.face('up'); HW.press('atk', 1); HW.step(12); HW.step(25); }
    settle(HW);
    assert.ok(HW.Progress.flag('belfry_echo'), 'the lullaby sung');
}

test("Linnet's note 4 is there as soon as the lullaby's sung, without leaving the Belfry", () => {
    const HW = echoRoom();
    const note = () => HW.G.map.ents.find(e => e.kind === 'prop' && e.tx === 56 && e.ty === 30);
    assert.ok(!note() || note().hiddenNow, 'not before');
    go(HW, 55, 30); assert.equal(read(HW, 'right').length, 0, 'nothing to read before');
    assert.equal(HW.G.map.id, 'belfry');
    sing(HW);
    assert.ok(note() && !note().hiddenNow, 'there now, the Belfry not built again');
    go(HW, 55, 30); read(HW, 'right');
    assert.ok(HW.Progress.flag('linnet4'), 'and read');
    noErrors(HW);
});

/* the Pile's room (the Stray House's 1,0, at 20,0): its north-west nook is 21-22 x 1-2, the pillar under it at 22,3 and
   the slit (one tile, too narrow for the Pile) at 21,3 */
test("the Pile beaten in a corner nook: its Heartstitch lies where Wren can walk to it, not walled in by the strays it leaves", () => {
    const HW = load(code('T66'));
    HW.Inv.maxHp = HW.Inv.hp = 36;
    go(HW, 29, 10);
    for (let i = 0; i < 20 && !/Pile can't be pushed/.test(HW.Progress.goal); i++) { HW.skipTalk(); HW.step(10); }
    const a = HW.G.map, pile = a.find('thePile'), p = HW.player();
    /* as the guide plays it: the Pile strained into the nook after her, she out through the slit, the nook's stray pushed
       across its open side (boxed), its last burst */
    pile.claim(false); pile.tx = 21; pile.ty = 1; pile.x = 21 * 16; pile.y = 16; pile.claim(true);
    const b = a.find('plS5'); a.unplace(b, b.tx, b.ty); b.tx = 23; b.ty = 1; b.x = 23 * 16; b.y = 16; a.place(b, 23, 1);
    p.x = 21 * 16 + 8; p.y = 4 * 16 + 10;
    assert.ok(pile.boxed(), 'boxed in the nook');
    pile.hp = 1; pile.burst();
    settle(HW);
    assert.ok(HW.Progress.flag('sh_pile'), 'it came apart');
    assert.ok(a.at(21, 1) && a.at(22, 2), 'two strays where it stood');
    const h = a.ents.find(e => e.id === 'pileHeart'), hx = Math.floor(h.x / 16), hy = Math.floor(h.y / 16);
    assert.ok(!(hx === 22 && hy === 1), 'not on the tile the walls and strays shut in');
    assert.ok(HW.global('findPath')(a, p.tx, p.ty, hx, hy, p), `a way to it (${hx},${hy})`);
    assert.equal(a.roomAt(hx, hy), pile.arena, 'in the Pile\'s room');
    noErrors(HW);
});

test("every goal line's flag on the valley's map lands on or next to the place it names", () => {
    const HW = loadGame(); HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    const a = HW.G.map, mapPin = HW.global('mapPin');
    assert.equal(a.id, 'hollow');
    const all = f => { const out = []; for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (f(x, y)) out.push([x, y]); return out; };
    const door = to => { const w = a.ents.find(e => e.kind === 'warp' && e.to === to); return [[w.tx, w.ty]]; };
    const at = e => [[e.tx, e.ty]];
    const region = name => { const r = a.regions.find(q => q.name === name); return all((x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h); };
    /* the places the goal lines name, found in the valley itself */
    const PLACES = [
        [/\bTidyhouse\b/, door('tidy')], [/\bKiln\b/, door('kiln')], [/\bMillrace\b/, door('millrace')], [/\bBelfry\b/, door('belfry')],
        [/\bSlumberhouse\b/, door('slumber')], [/\bMarionette Hall\b/, door('marionette')], [/\bLoom\b/, door('loom')], [/\bclinic\b/, door('clinic')],
        [/\bInn\b|\bGuild Hall\b|\bSpoolworks\b|\bMaking Floor\b|\bWay Down\b|\bUnderside\b/, door('inn')],
        [/\bWell\b|\bGreat Spool\b/, all((x, y) => x >= 94 && x <= 96 && y >= 58 && y <= 59)],
        [/\bgiant\b|\beast road\b/, at(a.ents.find(e => e.kind === 'giant'))],
        [/\bFrayed Edge\b|\bfog\b/, region('The Frayed Edge')],
        [/\bcliff stair\b/, all((x, y) => a.kindName(x, y) === 'stairs' && x >= 128 && y < 80)],
        /* the broken bridge: Meadowfold's, over the river on the road east (113-117, 106-107) */
        [/\bbroken bridge\b/, all((x, y) => a.kindName(x, y) === 'bridge' && x >= 64 && x < 128 && y >= 80)],
        /* the canyon road: the boulder in it, west of Meadowfold */
        [/\bcanyon road\b/, at(a.ents.find(e => e.kind === 'block' && e.look === 'boulder_big'))],
    ];
    const near = (p, tiles) => tiles.some(([x, y]) => Math.max(Math.abs(x - p[0]), Math.abs(y - p[1])) <= 2);
    /* every goal line the game sets (the counts' lines as they read with a number in) */
    const SRC = HW.global('__SRC'), goals = new Set();
    for (const m of SRC.matchAll(/setGoal\((['"`])((?:\\.|(?!\1).)*)\1/g)) goals.add(m[2].replace(/\\'/g, "'").replace(/\$\{[^}]*\}/g, '1'));
    for (const t of ['LOOM_GOALS', 'D5_GOALS', 'SH_GOALS']) for (const g of Object.values(HW.global(t))) goals.add(g);
    let pinned = 0;
    for (const g of goals) {
        HW.Progress.setGoal(g);
        const p = mapPin(a);
        const named = PLACES.map(([re, tiles]) => { const m = re.exec(g); return m && { i: m.index, tiles }; }).filter(Boolean).sort((u, v) => u.i - v.i)[0];
        if (named) { assert.ok(p && near(p, named.tiles), `"${g}": flag at ${p}`); pinned++; continue; }
        if (!p) continue;
        /* (a region, where it names no building or landmark: the middle of one it names) */
        assert.ok(a.regions.some(r => g.includes(r.name) && p[0] === r.x + r.w / 2 && p[1] === r.y + r.h / 2), `"${g}": flag at ${p}`);
        pinned++;
    }
    assert.ok(pinned >= 25, `${pinned} goal lines with a flag`);
    noErrors(HW);
});

test("the Guild's key opens the Loom's great doors, as its description says (the warp across them lifted by the weights)", () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    assert.match(HW.global('ITEMS').guildkey.desc, /opens the Loom's great doors/);
    HW.Progress.set('north_gate'); HW.Progress.set('loom_open');
    const tryDoors = () => {
        HW.warp('hollow', 95, 11, 'up'); HW.step(10); HW.skipTalk();
        for (let i = 0; i < 200 && HW.G.map.id === 'hollow'; i++) { HW.hold('up'); HW.step(1); }
        HW.release(); HW.step(30); HW.skipTalk();
        return HW.G.map.id;
    };
    assert.equal(tryDoors(), 'hollow', 'locked without the key');
    HW.warp('underside', 31, 4, 'up'); HW.step(10); HW.skipTalk();
    HW.face('up'); HW.press('act', 1); HW.step(3); settle(HW);
    assert.ok(HW.Inv.items.guildkey, "Gundry gives the Guild's key");
    assert.equal(tryDoors(), 'loom', 'in, with it');
    noErrors(HW);
});
