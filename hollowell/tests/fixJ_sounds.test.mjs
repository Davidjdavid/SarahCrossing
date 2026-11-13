// Sounds from things out of sight aren't heard (David, playing 1.0.0: "what's clicking so much in town?"). The valley is
// one great place, and its contraptions run on their own all the time: the fair's two plates, a crate the wind keeps
// throwing off a ledge in the Heights, the vents' crate in Kilnridge, sheep and the ferry going home. Every one of their
// sounds was played wherever Wren was: about two hundred in thirty seconds in the town square. Now a thing's sound is
// heard only while it's in sight (or just past the screen's edge): Sfx.src, set by Game.step for each thing in turn.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const SAVES = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'qa_kit', 'saves', 'save_states.json'), 'utf8'));
function at(id) {
    const HW = loadGame();
    HW.global('Game').load(HW.Save.fromCode(SAVES.find(s => s.id === id).code)); HW.step(60); HW.skipTalk();
    return HW;
}
/* every sound asked for, and whether it was heard (the same decision Sfx.play makes) */
function listen(HW, frames) {
    const Sfx = HW.global('Sfx'), heard = [], unheard = [];
    const play0 = Sfx.play.bind(Sfx);
    Sfx.play = function (name, ...rest) { (!Sfx.src || Sfx.heard(Sfx.src) ? heard : unheard).push(name); return play0(name, ...rest); };
    HW.step(frames);
    Sfx.play = play0;
    return { heard, unheard };
}

test('standing in the town square, nothing far away is heard (the fair\'s plates, the Heights\' crate, the vents)', () => {
    const HW = at('T02');
    assert.equal(HW.G.regionName, 'Hollowell');
    const { heard, unheard } = listen(HW, 1800);
    assert.ok(unheard.length > 100, 'the far contraptions still run (' + unheard.length + ' sounds out of sight)');
    assert.deepEqual(heard, [], 'nothing heard in the square: ' + heard.join(', '));
});

test('beside a contraption it is heard: the fair\'s plates, outside the Marionette Hall', () => {
    const HW = at('T33');
    const { heard } = listen(HW, 1800);
    assert.ok(heard.filter(n => n === 'click').length >= 10, 'the plates click in sight: ' + heard.join(', '));
});

test('a sound with no thing behind it (Wren\'s own, a scene\'s) is always heard; a thing far off is not', () => {
    const HW = loadGame(); HW.newGame('Wren', { skipIntro: true }); HW.step(10);
    const Sfx = HW.global('Sfx'), Cam = HW.global('Cam');
    Sfx.src = null; assert.equal(!Sfx.src || Sfx.heard(Sfx.src), true);
    assert.equal(Sfx.heard({ x: Cam.x + 100, y: Cam.y + 80 }), true, 'in sight');
    assert.equal(Sfx.heard({ x: Cam.x + 320 + 30, y: Cam.y + 80 }), true, 'just past the edge');
    assert.equal(Sfx.heard({ x: Cam.x + 320 + 200, y: Cam.y + 80 }), false, 'far off');
    assert.equal(Sfx.heard({ tx: Math.floor(Cam.x / 16) + 50, ty: Math.floor(Cam.y / 16) }), false, 'a thing on the grid, far off');
});

// Bram's first words are "Here, smash one of my pots. Go on! It comes back." There were none in town to smash (David,
// playing 1.0.0): now two stand by his stall.
test('Bram\'s pots: by his stall from the start; one thrown smashes, and comes back home whole', () => {
    const HW = at('T02');
    const a = HW.G.map, p = HW.player(), bram = a.ents.find(e => e.who === 'bram');
    const pots = a.ents.filter(e => e.kind === 'pot' && !e.removed && e.ty === bram.ty && Math.abs(e.tx - bram.tx) <= 2);
    assert.equal(pots.length, 2, 'two pots beside Bram');
    const pot = pots[0], home = [pot.tx, pot.ty];
    assert.ok(HW.walkTo(pot.tx, pot.ty + 1), 'up to the pot');
    HW.face('up'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry === pot, 'lifted');
    HW.face('down'); HW.press('act', 1);
    let smashed = false;
    for (let i = 0; i < 120 && !smashed; i++) { HW.step(1); smashed = !!pot.shattered; }
    assert.ok(smashed, 'it smashed where it landed');
    let back = false;
    for (let i = 0; i < 1800 && !back; i++) { HW.step(1); back = !pot.shattered && !pot.removed && pot.tx === home[0] && pot.ty === home[1]; }
    assert.ok(back, 'back on its spot by the stall, whole');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

// The map in a House: a room once been in shows whole, not just the stretches walked (David, playing: "can the whole
// room show up on the map and not the parts you walk around at?"); outdoors, still what's been walked near.
test('the map: in a House every room been in shows whole, rooms not yet entered stay dark; outdoors as before', () => {
    const HW = at('T05');
    const a = HW.G.map, seen = HW.global('mapSeen')(a);
    const room = key => a.rooms.find(r => r.key === key);
    for (const key of ['1,3', '1,2']) {
        const r = room(key);
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) assert.ok(seen(x, y), `room ${key} whole: ${x},${y}`);
    }
    const g = room('1,0');
    assert.ok(!seen(g.x + 9, g.y + 5), 'the Grand Hall, not yet entered, stays dark');
    const H2 = at('T02'), o = H2.G.map, os = H2.global('mapSeen')(o), v = H2.Stats.visited[o.id] || {};
    for (const [x, y] of [[94, 61], [10, 10], [180, 110]]) assert.equal(os(x, y), !!v[(x >> 2) + ',' + (y >> 2)], `outdoors ${x},${y} as walked`);
});

// Never left inside something solid (David, playing 1.0.1: "stuck in a wall vs the wardrobe boss"): whatever ends up
// over part of Wren, she's eased onto open floor in under a second; boxed in by things (not inside them) is left alone.
test('Wren inside a wall is eased out onto open floor; Wren boxed in is not moved', () => {
    const HW = at('T07');
    const a = HW.G.map, p = HW.player(), Cam = HW.global('Cam');
    const room = Cam.room;
    /* against the room's west wall, half into it */
    p.x = (room.x + 1) * 16 + 2; p.y = (room.y + 5) * 16 + 10;
    assert.equal(p.boxFree(p.x, p.y), false, 'set up inside the wall');
    HW.step(60);
    assert.ok(p.boxFree(p.x, p.y), 'out of the wall within a second');
    assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => p.boxFree(p.x + dx, p.y + dy)), 'and free to move');
    assert.ok(HW.Stats.c.easedOut >= 1);
    /* boxed in by four blocks round her tile: she stays where she is */
    const H2 = at('T07'), q = H2.player(), b = H2.G.map, x = q.tx, y = q.ty;
    const Block = H2.global('Block');
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!b.kind(x + dx, y + dy).solid && !b.at(x + dx, y + dy)) b.add(new Block(x + dx, y + dy, {}));
    q.x = x * 16 + 8; q.y = y * 16 + 10;
    H2.step(90);
    assert.equal(q.tx, x); assert.equal(q.ty, y);
    assert.ok(!(H2.Stats.c.easedOut > 0), 'not moved when only boxed in');
});

// A heavy thing coming home shoves Wren a tile along (src/07_return.js); standing off the middle of her tile, she used to
// land half inside the wall beside the tile she was shoved into, and couldn't step out (the Grand Hall: a bust coming home).
test('shoved a tile along from off the middle of her tile, Wren lands on the middle of it, never in the wall beside it', () => {
    const HW = at('T07');
    const a = HW.G.map, p = HW.player(), Cam = HW.global('Cam');
    const free = (x, y) => !p.solidAt(x, y);
    let spot = null;
    for (let y = 1; y < a.h - 1 && !spot; y++) for (let x = 1; x < a.w - 1 && !spot; x++)
        if (free(x, y) && free(x - 1, y) && free(x, y - 1) && a.kind(x - 1, y - 1).solid) spot = [x, y];
    assert.ok(spot, 'a tile with a wall up and to its left');
    const [x, y] = spot;
    p.x = x * 16 + 8; p.y = y * 16 + 10; HW.step(120);   /* there first, the camera settled in its room */
    assert.equal(Cam.room, a.roomAt(x, y));
    p.x = x * 16 + 3; p.y = y * 16 + 10;                 /* off the middle, her box over the tile to the left */
    assert.ok(p.boxFree(p.x, p.y) && p.canBeShoved(HW.global('UP')));
    p.shoved(HW.global('UP'), 8);
    HW.step(12);
    assert.equal(p.tx, x); assert.equal(p.ty, y - 1);
    assert.ok(p.boxFree(p.x, p.y), 'not inside the wall');
    assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => p.boxFree(p.x + dx, p.y + dy)), 'free to move');
});

// Thrown point-blank (a wall or a creature right in front, so it never got clear of her own tile), a thing came down on
// Wren's own tile, on top of her, and she couldn't move till it went home (the full playthrough found it in the Belfry).
// Now it comes down in front of her if there's room, else beside her, else behind her.
test('a throw stopped before it is clear of Wren never lands on her: in front if there is room, else beside, else behind', () => {
    const setUp = blockSides => {
        const HW = at('T07');
        const a = HW.G.map, p = HW.player(), Cam = HW.global('Cam'), Crate = HW.global('Crate'), Block = HW.global('Block');
        const open = (x, y) => !p.solidAt(x, y) && a.freeForThing(x, y, null) && !a.kind(x, y).pit;
        /* a tile with a wall to its right and open floor below, above and to its left, in the room she's in */
        const r = Cam.room;
        let spot = null;
        for (let y = r.y + 1; y < r.y + r.h - 1 && !spot; y++) for (let x = r.x + 1; x < r.x + r.w - 1 && !spot; x++)
            if (open(x, y) && a.kind(x + 1, y).solid && open(x, y + 1) && open(x, y - 1) && open(x - 1, y)) spot = [x, y];
        assert.ok(spot, 'a tile with a wall to its right');
        const [x, y] = spot;
        p.x = x * 16 + 8; p.y = y * 16 + 10; HW.step(10);
        const crate = new Crate(x, y + 1, {}); a.add(crate);
        HW.face('down'); HW.press('act', 1); HW.step(20);
        assert.ok(p.carry && p.carry.kind === 'crate', 'carrying the crate');
        if (blockSides) for (const [bx, by] of [[x, y + 1], [x, y - 1]]) a.add(new Block(bx, by, {}));
        HW.face('right'); HW.press('act', 1); HW.step(40);
        return { HW, p, crate, x, y };
    };
    {
        const { p, crate, x, y } = setUp(false);
        assert.ok(!p.carry, 'thrown');
        assert.ok(!(crate.tx === x && crate.ty === y), 'not on her tile');
        assert.deepEqual([crate.tx, crate.ty], [x, y + 1], 'the wall in front: beside her (below)');
        assert.ok(p.boxFree(p.x, p.y), 'not inside it');
    }
    {
        const { p, crate, x, y } = setUp(true);
        assert.deepEqual([crate.tx, crate.ty], [x - 1, y], 'the wall in front, both sides taken: behind her');
        assert.ok(p.boxFree(p.x, p.y), 'not inside it');
    }
});

// Crossing into another room, Wren is carried a little way in (so the doorway is behind her) without looking where:
// a thing standing just inside the doorway left her half inside it, unable to move in any direction (the playthrough
// found it in the Spoolworks). Now she's carried in only as far as she could walk.
test('stepping into another room with a thing just inside the doorway, Wren stops short of it, never inside it', () => {
    const HW = at('T07');
    const a = HW.G.map, p = HW.player(), Cam = HW.global('Cam'), Block = HW.global('Block');
    const open = (x, y) => !p.solidAt(x, y) && a.freeForThing(x, y, null) && !a.kind(x, y).pit;
    /* a crossing downward from one room into the next, open for three tiles below it, that she can walk to */
    let door = null;
    for (let y = 1; y < a.h - 3 && !door; y++) for (let x = 1; x < a.w - 1 && !door; x++) {
        const r1 = a.roomAt(x, y), r2 = a.roomAt(x, y + 1);
        if (r1 && r2 && r1 !== r2 && open(x, y - 1) && open(x, y) && open(x, y + 1) && open(x, y + 2) && a.roomAt(x, y + 2) === r2 && HW.walkTo(x, y - 1)) door = [x, y, r2];
    }
    assert.ok(door, 'a doorway to walk down through');
    const [x, y, r2] = door;
    a.add(new Block(x, y + 2, {}));                      /* just inside the next room, in the way */
    p.x = x * 16 + 8; p.y = (y - 1) * 16 + 10; HW.step(10);
    HW.hold('down');
    for (let i = 0; i < 200 && !(Cam.room === r2 && !Cam.busy); i++) HW.step(1);
    HW.release();
    assert.equal(Cam.room, r2, 'through into the next room');
    assert.ok(p.boxFree(p.x, p.y), 'not inside the thing in the way');
    assert.ok([[1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => p.boxFree(p.x + dx, p.y + dy)), 'free to move');
});
