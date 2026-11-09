// Every stamp in the album can be found. (SPOILERS.)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from '../tools/headless.mjs';
import { makeBot } from './bot.mjs';

function at(room, x, y, setup) {
    const A = load();
    A.newGame();
    const G = A.G;
    G.room = room; G.p.x = x; G.p.y = y;
    A.entById('c_home', 'home').x = 10;
    if (setup) setup(A, G);
    return { A, G, B: makeBot(A) };
}
const stampsAll = new Set();
const got = (G, id) => { assert.ok(G.stamps[id], `stamp ${id}`); stampsAll.add(id); };

test('hatchling: a little age for the egg', () => {
    const { G, B } = at('deepwood', 11, 5, (A, G) => { G.pocket = [0, 2]; });
    B.near(11, 4, 'u'); B.put(0, 'dw_wall', 'age');
    B.move('u');
    B.near(11, 2, 'u'); B.put(2, 'egg', 'age');
    got(G, 'hatch');
});

test('the hollow: the old tree at nine', () => {
    const { G, B } = at('deepwood', 1, 5, (A, G) => { G.pocket = [9]; });
    B.near(2, 2, 'u'); B.put(9, 'oldtree', 'age');
    B.move('u');
    assert.equal(G.room, 'hollow');
    B.goto(6, 5);
    got(G, 'hollow');
});

test('upside down: the mirror stone turns a six', () => {
    const { G, B } = at('mirror', 13, 5, (A, G) => { G.pocket = [3]; });
    B.near(9, 5, 'l'); B.swap('mstone', 'v'); B.swap('mstone', 'v');
    got(G, 'mirror');
});

test('the hour that isn\'t: the tower on the hill grows a door', () => {
    const { A, G, B } = at('square', 10, 3, (A, G) => { G.pocket = [9]; });
    B.near(10, 2, 'u'); B.put(9, 'townclock', 'hour', 0);
    assert.equal(A.band(), 'eerie');
    B.exit('r'); B.exit('u');
    assert.equal(G.room, 'clockhill', 'the guard is gone');
    B.bump(7, 5, 'u');
    assert.equal(G.room, 'clocktower');
    B.bump(7, 3, 'u');
    assert.equal(G.pocket.length, 2, 'a satchel in the chest');
    B.goto(7, 5);
    got(G, 'hour');
});

test('the guard goes home at night, and steps aside if he is only little', () => {
    const { A, G, B } = at('square', 10, 3, (A, G) => { G.pocket = [2, 1]; });
    B.near(10, 2, 'u'); B.put(2, 'townclock', 'hour', 1);   // 08 -> 02
    assert.equal(A.band(), 'night');
    B.exit('r'); B.exit('u');
    assert.equal(G.room, 'clockhill');
    const { A: A2, G: G2, B: B2 } = at('eastlane', 7, 2, (A, G) => { G.items.specs = 1; G.pocket = [0]; });
    B2.near(7, 1, 'u'); B2.put(0, 'guard', 'age', 0);       // 29 -> 09
    B2.move('u');
    assert.equal(G2.p.y, 1, 'past him');
});

test('nowhere: an address nobody has', () => {
    const { G, B } = at('square', 2, 4, (A, G) => { G.pocket = [9]; });
    B.near(2, 3, 'u'); B.put(9, 'h1', 'addr');
    B.move('u');
    assert.equal(G.room, 'nowhere');
    B.goto(10, 6);
    got(G, 'nowhere');
});

test('housewarming: build on the lot, visit No. 9', () => {
    const { A, G, B } = at('eastlane', 3, 5, (A, G) => { G.pocket = [4]; });
    B.near(3, 3, 'u'); B.put(4, 'lot9', 'age');
    B.move('u');
    assert.equal(G.room, 'newhouse');
    B.goto(7, 4);
    got(G, 'house');
});

test('the old dig: heavy feet on the quarry floor', () => {
    const { G, B } = at('quarry', 5, 5, (A, G) => { G.p.s.wt = [5]; });
    B.move('r'); B.move('r');
    assert.equal(G.room, 'cellar');
    B.goto(11, 7);
    got(G, 'cellar');
    B.bump(3, 2);
    assert.equal(G.room, 'quarry', 'the ladder goes back up');
});

test('the old dig: or push the boulder through and drop in after it', () => {
    const { A, G, B } = at('quarry', 2, 6, (A, G) => { G.p.s.str = [9]; });
    B.move('r'); B.move('r'); B.move('r'); B.move('r'); B.move('r');   // boulder 3,6 -> 8,6 crack
    assert.ok(A.findEnt('cr2').broken);
    B.goto(7, 6);
    B.move('r');
    assert.equal(G.room, 'cellar');
});

test('the far shore', () => {
    const { G, B } = at('harbor', 8, 6, (A, G) => { G.items.specs = 1; G.pocket = [0]; });
    B.goto(7, 8); B.put(0, 'sea', 'd');
    B.goto(7, 10);
    got(G, 'shore');
});

test('halfway: walk the long road honestly', () => {
    const { G, B } = at('eastlane', 15, 5);
    B.move('r');
    for (let i = 0; i < 49; i++) { B.goto(15, 5); B.move('r'); }
    assert.equal(G.road.p, 50);
    B.goto(10, 4);
    got(G, 'walk');
});

test('no stamp for a road made short', () => {
    const { A, G, B } = at('eastlane', 15, 5, (A, G) => { G.pocket = [5, 0]; });
    B.move('r');
    B.near(7, 4, 'u'); B.put(0, 'ms_road', 'e', 0);  // 98 -> 08
    B.put(5, 'ms_road', 'w', 0);                     // 01 -> 51
    assert.equal(G.road.p, 51);
    B.goto(0, 5); B.move('l');                    // 50
    assert.equal(G.road.p, 50);
    assert.ok(!A.present(A.entById('st_walk')), 'only for the honest walker');
});

test('all nine stamps', () => { assert.deepEqual([...stampsAll].sort(), ['cellar', 'hatch', 'hollow', 'hour', 'house', 'mirror', 'nowhere', 'shore', 'walk']); });
