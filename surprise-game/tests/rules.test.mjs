// The world's rules, one at a time. (SPOILERS.)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from '../tools/headless.mjs';
import { makeBot } from './bot.mjs';

const J = v => JSON.parse(JSON.stringify(v));
function fresh(room, x, y, setup) {
    const A = load();
    A.newGame();
    const G = A.G;
    if (room) { G.room = room; G.p.x = x; G.p.y = y; }
    if (setup) setup(A, G);
    return { A, G: A.G, B: makeBot(A) };
}

test('numbers only ever change hands: you cannot take one empty-handed', () => {
    const { A, G } = fresh('home', 6, 8, (A, G) => { G.pocket = [null]; });
    G.p.dir = 'r';
    assert.equal(A.act({ t: 'swap', tg: { t: 'slot', id: 'c_home', key: 'wt', i: 0 }, pi: 0 }), false);
    assert.equal(A.entById('c_home').s.wt[0], 9);
});

test('you can only touch what is next to you', () => {
    const { A, G } = fresh('home', 3, 5);
    assert.equal(A.act({ t: 'swap', tg: { t: 'slot', id: 'c_home', key: 'wt', i: 0 }, pi: 0 }), false);
});

test('a row of things moves if their weight together is within your strength', () => {
    const { A, G, B } = fresh('quarry', 9, 7, (A, G) => {
        const R = A.rs('quarry');
        R.ents.push({ k: 'crate', id: 'ta', x: 10, y: 7, s: { wt: [1] } }, { k: 'crate', id: 'tb', x: 11, y: 7, s: { wt: [2] } });
        G.p.s.str = [2];
    });
    B.move('r');
    assert.equal(A.entById('ta').x, 10, 'three is more than two');
    G.p.s.str = [3];
    B.move('r');
    assert.equal(A.entById('ta').x, 11);
    assert.equal(A.entById('tb').x, 12);
});

test('heavy things sink; weightless things float, and you can stand on them; set a sunk thing to 0 and it rises', () => {
    const { A, G, B } = fresh('mere', 12, 6, (A, G) => {
        A.rs('mere').ents.push({ k: 'crate', id: 'h', x: 11, y: 6, s: { wt: [3] } });
        G.p.s.str = [9];
    });
    B.move('l');                                  // pushes it into the lake
    const h = A.entById('h');
    assert.ok(h.wet && !h.float, 'sank');
    assert.equal(A.groundOk(10, 6), false, 'a sunk crate is no bridge');
    G.p.dir = 'l';
    G.pocket = [0];
    B.swap('h', 'wt');
    assert.ok(h.float, 'rose');
    B.move('l');
    assert.equal(G.p.x, 10, 'standing on it');
    assert.deepEqual(J(G.pocket), [3]);
});

test('a raft that sinks under you takes you down unless you weigh nothing', () => {
    const { A, G, B } = fresh('mere', 11, 4, (A, G) => { G.pocket = [0]; });
    G.p.dir = 'l';
    B.swap('mere_boulder', 'wt');                 // 7 out, 0 in: it floats
    B.move('l');
    assert.equal(G.p.x, 10);
    assert.throws(() => B.swap('mere_boulder', 'wt'), /died \(sink\)/);
});

test('walking on water when you weigh nothing', () => {
    const { A, G, B } = fresh('mere', 11, 6, (A, G) => { G.p.s.wt = [0]; });
    B.move('l');
    assert.equal(G.p.x, 10);
    assert.ok(A.isWater(10, 6));
});

test('plates and gates: the sluice opens under enough weight and stays open', () => {
    const { A, G, B } = fresh('mere', 8, 3, (A, G) => { G.pocket = [9]; });
    B.move('d');                                  // crate onto plate
    assert.ok(!A.entById('sluice').open, 'one is not six');
    G.p.dir = 'd';
    B.swap('mere_crate', 'wt');
    assert.ok(A.entById('sluice').open);
});

test('cracked floors break under too much weight and drop you to the room below', () => {
    const { A, G, B } = fresh('quarry', 6, 5, (A, G) => { G.p.s.wt = [4]; });
    B.move('r');                                  // onto crack (7,5) holding 3
    assert.equal(G.room, 'cellar');
    assert.ok(A.findEnt('cr1').broken);
});

test('a light step on a cracked floor is fine', () => {
    const { A, G, B } = fresh('quarry', 6, 5);
    B.move('r');
    assert.equal(G.room, 'quarry');
    assert.equal(G.p.x, 7);
});

test('door numbers are addresses: any door with a number leads to that room', () => {
    const { A, G, B } = fresh('square', 2, 4, (A, G) => { G.pocket = [3]; G.p.dir = 'u'; });
    B.swap('h1', 'addr');
    B.move('u');
    assert.equal(G.room, 'shop');
    B.leave();
    assert.equal(G.room, 'square');
    assert.equal(G.p.x, 2, 'back out of the door you went in by');
});

test('No. 0 is the lighthouse, 9 is nowhere until the lot is built, unknown numbers are Nowhere', () => {
    const { A } = fresh();
    assert.equal(A.addrRoom(0), 'lh0');
    assert.equal(A.addrRoom(9), null);
    A.entById('lot9', 'eastlane').s.age = [3];
    assert.equal(A.addrRoom(9), 'newhouse');
    assert.equal(A.addrRoom(47), null);
    assert.equal(A.addrRoom(1), 'home');
});

test('a two-digit door reading 01 is your house; 47 is Nowhere', () => {
    const { A, G, B } = fresh('fortyard', 3, 2, (A, G) => { G.pocket = [0, 4]; G.p.dir = 'u'; A.entById('c_home', 'home').x = 10; });
    B.put(0, 'd11', 'addr', 0);
    B.move('u');
    assert.equal(G.room, 'home');
    B.leave();
    assert.equal(G.room, 'fortyard');
    B.put(4, 'd11', 'addr', 0);                  // 41
    B.move('u');
    assert.equal(G.room, 'nowhere');
    assert.ok(G.stamps.nowhere === undefined, 'the stamp is on the floor, not given');
});

test('ages: 0 is not yet, 9 is a ruin; things cannot appear where something stands', () => {
    const { A, G, B } = fresh('woodedge', 7, 2, (A, G) => { G.pocket = [9]; G.p.dir = 'u'; });
    B.swap('we_wall', 'age');                     // rubble
    B.move('u');
    assert.equal(G.p.y, 1, 'walked over the rubble');
    G.pocket = [4];
    G.p.y = 2;
    const w = A.entById('we_wall');
    w.s.age = [0];
    G.p.y = 1;                                    // standing where it would be
    G.p.dir = 'u';
    assert.equal(A.act({ t: 'swap', tg: { t: 'slot', id: 'we_wall', key: 'age', i: 0 }, pi: 0 }), false);
});

test('rotten bridges will not hold you; new ones will', () => {
    const { A, G, B } = fresh('westlane', 9, 5, (A, G) => { G.pocket = [1]; });
    B.move('l');
    assert.equal(G.p.x, 9, 'creak');
    G.p.dir = 'l';
    B.swap('wl_bridge', 'age');
    B.move('l');
    assert.equal(G.p.x, 8);
});

test('a parcel goes through a door with its number, and not through any other', () => {
    const { A, G, B } = fresh('westlane', 13, 4, (A, G) => {
        G.p.s.str = [9];
        A.rs('westlane').ents.find(e => e.id === 'parcel5').x = 12;
        A.rs('westlane').ents.find(e => e.id === 'parcel5').y = 4;
        A.rs('westlane').ents.find(e => e.id === 'sev').gone = true;
    });
    G.p.y = 5; G.p.x = 12;
    B.move('u');                                  // into door 7
    assert.ok(!A.entById('parcel5').gone, 'not for No. 7');
    G.pocket = [7];
    G.p.dir = 'u';
    B.swap('parcel5', 'to');
    B.move('u');
    assert.ok(A.entById('parcel5').gone);
    assert.equal(G.flags.got_parcel5, 'seven');
});

test('defeated monsters leave all their numbers, the zero of their health too', () => {
    const { A, G, B } = fresh('woodedge', 9, 6, (A, G) => { G.p.s.str = [9]; });
    B.kill('we_slime');
    const loose = A.rs().ents.filter(e => e.k === 'loose' && !e.gone).map(e => e.s.v[0]).sort();
    assert.deepEqual(J(loose), [0, 1]);
});

test('the golem winds up before it strikes', () => {
    const { A, G, B } = fresh('fortgate', 7, 6);
    B.move('u');
    assert.ok(A.entById('golem').wound);
    assert.equal(A.pv('hp'), 3, 'one free action');
    assert.throws(() => B.wait(), /died \(hp\)/);
});

test('counters carry the one, even into drums you cannot reach', () => {
    const { A, G, B } = fresh('mill', 6, 3, (A, G) => {
        A.entById('sluice', 'mere').open = true;
        A.entById('millcount', 'mill').s.cnt = [0, 9, 8];
    });
    B.wait();
    assert.deepEqual(J(A.entById('millcount').s.cnt), [0, 9, 9]);
    B.wait();
    assert.deepEqual(J(A.entById('millcount').s.cnt), [1, 0, 0]);
    const tg = A.swapTargets().filter(t => t.id === 'millcount').map(t => t.i);
    assert.deepEqual(J(tg), [1, 2], 'the hundreds are out of reach');
});

test('a counter that runs out of room drops the carried one', () => {
    const { A, G, B } = fresh('mill', 6, 3, (A, G) => {
        A.entById('sluice', 'mere').open = true;
        A.entById('millcount', 'mill').s.cnt = [9, 9, 9];
    });
    B.wait();
    assert.deepEqual(J(A.entById('millcount').s.cnt), [0, 0, 0]);
    assert.ok(A.rs().ents.some(e => e.k === 'loose' && e.s.v[0] === 1 && e.x === 7 && e.y === 4));
});

test('the bell: 9999 carries into the lamp', () => {
    const { A, G, B } = fresh('lhtop', 7, 8, (A, G) => { G.count = [9, 9, 9, 9]; });
    B.move('u');
    assert.deepEqual(J(G.count), [0, 0, 0, 0]);
    assert.equal(A.dval(G.lamp), 1);
    assert.ok(G.flags.lit);
});

test('the clock is the time: night sends people home, the hour that isn\'t sends everyone away', () => {
    const { A, G } = fresh('square', 7, 5);
    const gran = A.entById('gran');
    assert.ok(A.present(gran));
    G.hour = [2, 2];
    assert.equal(A.band(), 'night');
    assert.ok(!A.present(gran));
    assert.ok(A.present(A.entById('marlo_in', 'fisher')));
    G.hour = [9, 8];
    assert.equal(A.band(), 'eerie');
    assert.ok(!A.present(A.entById('marlo_in', 'fisher')));
    assert.ok(A.present(A.entById('towerdoor', 'clockhill')));
    assert.ok(!A.present(A.entById('guard', 'eastlane')));
});

test('the long road is as long as its milestones say; 0 means you are there', () => {
    const { A, G, B } = fresh('eastlane', 15, 5, (A, G) => { G.pocket = [0, 0, 3]; });
    B.move('r');
    assert.equal(G.room, 'road');
    assert.deepEqual(J([G.road.p, G.road.e]), [1, 98]);
    G.p.x = 7; G.p.y = 5;                        // under the milestone
    G.p.dir = 'u';
    B.put(0, 'ms_road', 'e', 0);                  // 98 -> 08
    assert.equal(G.road.e, 8);
    B.put(3, 'ms_road', 'e', 1);                  // 08 -> 03
    assert.equal(G.road.e, 3);
    B.put(0, 'ms_road', 'e', 1);                  // 03 -> 00: you're there
    assert.equal(G.room, 'cliff');
    assert.ok(G.road.p >= 1);
});

test('the road cannot be made longer than its milestones can say', () => {
    const { A, G, B } = fresh('eastlane', 15, 5, (A, G) => { G.pocket = [9]; });
    B.move('r'); B.goto(15, 5); B.move('r');                     // pos 2, 97 to go
    G.p.x = 7; G.p.y = 5; G.p.dir = 'u';
    assert.equal(A.act({ t: 'swap', tg: { t: 'slot', id: 'ms_road', key: 'e', i: 1 }, pi: 0 }), false, '2 + 99 > 99');
});

test('the mirror stone turns a 6 over', () => {
    const { A, G, B } = fresh('mirror', 10, 5, (A, G) => { G.pocket = [3]; G.p.dir = 'l'; });
    B.swap('mstone', 'v');
    assert.deepEqual(J(G.pocket), [6]);
    B.swap('mstone', 'v');
    assert.deepEqual(A.entById('mstone').s.v[0], 9);
    assert.ok(G.stamps.mirror);
});

test('the egg: 1 or 2 hatches a chick that follows you; 3 or more and it flies home', () => {
    const { A, G, B } = fresh('deepwood', 11, 3, (A, G) => { G.pocket = [1]; A.entById('dw_wall').s.age = [0]; G.p.dir = 'u'; });
    B.swap('egg', 'age');
    assert.ok(G.follow, 'a chick');
    assert.ok(G.stamps.hatch);
    B.move('d'); B.move('d');
    assert.equal(G.follow.y, 4, 'it follows');
    G.pocket = [5];
    B.swap('chick', 'age');
    assert.equal(G.follow, null);
    assert.equal(A.entById('egg', 'deepwood').s.age[0], 5);
});

test('the old tree at nine opens', () => {
    const { A, G, B } = fresh('deepwood', 2, 3, (A, G) => { G.pocket = [9]; G.p.dir = 'u'; });
    B.swap('oldtree', 'age');
    B.move('u');
    assert.equal(G.room, 'hollow');
});

test('undo puts everything back exactly', () => {
    const { A, G, B } = fresh();
    const s0 = J(A.G);
    B.near(7, 8, 'r'); B.swap('c_home', 'wt'); B.move('r'); B.leave(); B.move('r');
    while (A.UNDO.length) A.undo();
    assert.deepEqual(J(A.G), s0);
});

test('restart puts the room back as you found it', () => {
    const { A, G, B } = fresh();
    B.near(7, 8, 'r'); B.swap('c_home', 'wt'); B.move('r');
    A.restartRoom();
    assert.equal(A.entById('c_home').s.wt[0], 9);
    assert.deepEqual(J(A.G.pocket), [1]);
});

test('cookies: one bite is one health', () => {
    const { A, G, B } = fresh('cell12', 8, 3);
    B.move('r');
    assert.equal(A.pv('hp'), 4);
    assert.equal(A.dval(A.entById('jar12').s.n), 2);
});

test('your age at zero: not yet', () => {
    const { A, G, B } = fresh('square', 7, 5, (A, G) => { G.items.specs = 1; G.pocket = [0]; });
    assert.throws(() => B.swap('@', 'age', 1), /died \(unborn\)/);
});

test('the far shore: the sea is as wide as it says', () => {
    const { A, G, B } = fresh('harbor', 8, 8, (A, G) => { G.items.specs = 1; G.pocket = [0]; });
    assert.equal(A.tileAt(8, 9), '%');
    B.swap('sea', 'd');
    assert.equal(A.tileAt(8, 9), 's');
    B.move('d'); B.move('l'); B.move('d');
    assert.ok(G.stamps.shore);
    assert.equal(G.pocket[0], 10, 'carrying infinity');
});

/* ---- from the independent review ---- */
test('infinity at the shop: priceless things cannot be bought, endless gold stays one infinity', () => {
    const { A, G, B } = fresh('shop', 7, 5, (A, G) => { G.p.s.gold = [10, 2]; A.entById('sh_nine').s.price = [10, 0]; });
    B.move('u');
    assert.ok(!A.entById('sh_nine').sold, 'priceless');
    G.p.x = 9; B.move('u');
    assert.ok(A.entById('sh_map').sold);
    assert.deepEqual(J(G.p.s.gold), [10, 2], 'gold unchanged and never NaN');
});

test('starting a room over puts back what fell out of it, without copies', () => {
    const { A, G, B } = fresh('westlane', 13, 9, (A, G) => { G.p.s.str = [9]; });
    B.exit('d');
    assert.equal(G.room, 'quarry');
    for (let n = 0; n < 3; n++) { B.goto(2, 6); for (let i = 0; i < 5; i++) B.move('r'); assert.ok(A.findEnt('cr2').broken); A.restartRoom(); }
    const inCellar = A.rs('cellar').ents.filter(e => e.id === 'q_boulder').length;
    assert.equal(inCellar, 0);
    assert.equal(A.rs('quarry').ents.filter(e => e.id === 'q_boulder').length, 1);
});

test('stairs never land you inside something', () => {
    const { A, G, B } = fresh('cellar', 3, 3, (A, G) => { A.entById('q_boulder', 'quarry').x = 4; A.entById('q_boulder', 'quarry').y = 5; });
    B.move('u');
    assert.equal(G.room, 'quarry');
    assert.ok(!(G.p.x === 4 && G.p.y === 5));
});

test('an unbuilt bridge holds nothing up', () => {
    const { A, G, B } = fresh('westlane', 11, 5, (A, G) => { G.p.s.str = [9]; A.entById('wl_bridge').s.age = [0]; });
    B.move('l'); B.move('l');
    const p = A.entById('parcel5');
    assert.equal(p.x, 8);
    assert.ok(p.wet, 'into the river');
});

test('the road cannot be made endless', () => {
    const { A, G, B } = fresh('eastlane', 15, 5, (A, G) => { G.pocket = [10]; });
    B.move('r');
    G.p.x = 7; G.p.y = 5; G.p.dir = 'u';
    assert.equal(A.act({ t: 'swap', tg: { t: 'slot', id: 'ms_road', key: 'e', i: 0 }, pi: 0 }), false);
});

test('the little guard says so', () => {
    const { A, G, B } = fresh('eastlane', 7, 2, (A, G) => { G.items.specs = 1; G.pocket = [0]; });
    B.near(7, 1, 'u'); B.put(0, 'guard', 'age', 0);
    B.bump(5, 2);
    assert.ok(B.lines.some(l => /only little/.test(l)), B.lines.join('|'));
});
