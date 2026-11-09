// The whole game, played the intended way by a bot, from waking up to the light.
// (SPOILERS, obviously.)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from '../tools/headless.mjs';
import { makeBot } from './bot.mjs';

export function playToEnd({ log = false } = {}) {
    const A = load();
    A.newGame();
    const B = makeBot(A, { log });
    const G = () => A.G;
    const pocket = () => JSON.parse(JSON.stringify(G().pocket));
    const room = () => G().room;

    /* ---- home: the first swap ---- */
    B.near(7, 8, 'r');                  // stand left of the crate
    B.move('r');                         // too heavy
    assert.equal(A.entById('c_home').x, 7);
    B.swap('c_home', 'wt');
    assert.deepEqual(pocket(), [9]);
    B.move('r');                         // now it moves
    assert.equal(A.entById('c_home').x, 8);
    B.leave();
    assert.equal(room(), 'square');

    /* ---- the post office ---- */
    B.bump(13, 3);                       // door No. 2
    assert.equal(room(), 'post');
    B.bump(5, 4);                        // across the counter
    assert.ok(G().items.letter, 'got the letter');
    B.leave();

    /* ---- west lane: the parcel and the old bridge ---- */
    B.exit('l');
    assert.equal(room(), 'westlane');
    B.swap('@', 'str');                  // 9 into strength
    assert.equal(A.pv('str'), 9);
    B.goto(9, 5);
    B.put(1, 'wl_bridge', 'age');        // a new bridge
    B.goto(11, 5);
    for (let i = 0; i < 5; i++) B.move('l');
    assert.equal(A.entById('parcel5').x, 5);
    B.goto(5, 6);
    B.move('u'); B.move('u');            // into door No. 5
    assert.equal(G().flags.got_parcel5, 'five');
    B.bump(5, 3);                        // visit
    assert.equal(room(), 'five');
    B.bump(6, 3);                        // Mrs. Fife's tip: nothing
    B.pickLoose(0);
    assert.ok(pocket().includes(0));
    B.leave();
    B.exit('r');

    /* ---- the shop: a free satchel ---- */
    B.bump(2, 8);
    assert.equal(room(), 'shop');
    B.near(5, 4, 'u');
    B.put(0, 'sh_satchel', 'price', 0);
    assert.equal(A.dval(A.entById('sh_satchel').s.price), 0);
    B.move('u');                         // buy
    assert.equal(pocket().length, 2);
    B.leave();

    /* ---- wood edge: a slime, a tree, an old wall ---- */
    B.exit('u');
    assert.equal(room(), 'woodedge');
    B.kill('we_slime');
    B.goto(A.rs().ents.find(e => e.k === 'loose').x, A.rs().ents.find(e => e.k === 'loose').y);
    B.pickLoose(0); B.pickLoose(1, 0);   // pocket: [1, 0]
    B.near(1, 5, 'l');
    B.put(1, 'we_tree', 'age');           // a sprout now
    B.near(7, 1, 'u');
    B.put(0, 'we_wall', 'age');           // never built
    assert.deepEqual(pocket().slice().sort(), [5, 6]);

    /* ---- deep wood: an unbuilt bridge gives a zero ---- */
    B.exit('l');
    assert.equal(room(), 'deepwood');
    B.goto(9, 5);
    B.put(5, 'dw_bridge', 'age');
    assert.ok(pocket().includes(0));
    B.exit('r'); B.exit('u');

    /* ---- the fort gate: the golem ---- */
    assert.equal(room(), 'fortgate');
    B.goto(7, 6);
    B.move('u');                          // next to it: it winds up
    assert.ok(A.entById('golem').wound);
    B.put(0, 'golem', 'str');             // disarmed (we take its 9)
    assert.equal(A.pv('hp'), 3);
    B.kill('golem');
    B.goto(7, 4);
    /* its numbers are on the floor: 0 0 0 9. keep a 9 and a 0 */
    B.pickLoose(9, pocket().indexOf(6));
    B.pickLoose(0, pocket().findIndex(v => v !== 9 && v !== 0) >= 0 ? pocket().findIndex(v => v !== 9 && v !== 0) : 1);
    B.exit('u');

    /* ---- the fort yard: an armory nobody can open ---- */
    assert.equal(room(), 'fortyard');
    B.bump(9, 1);                         // cell 13
    assert.equal(room(), 'cell13');
    B.near(8, 5);
    B.put(0, 'c13', 'wt');                // take its 5
    assert.ok(pocket().includes(5));
    B.leave();
    B.near(3, 1, 'u');
    B.put(5, 'd11', 'addr', 1);           // 11 -> 15
    B.move('u');
    assert.equal(room(), 'armory');
    B.bump(7, 3);
    assert.ok(G().items.specs, 'spectacles');
    B.leave();
    B.exit('d'); B.exit('d'); B.exit('d');
    assert.equal(room(), 'square');

    /* ---- the mere: float the boulder, weigh down the sluice ---- */
    B.exit('l'); B.exit('l');
    assert.equal(room(), 'mere');
    B.near(13, 3);
    const small = pocket().find(v => v !== 9);
    B.put(small, 'mere_sapling', 'age');  // the sapling gives a zero
    B.near(10, 4, 'l');
    B.put(0, 'mere_boulder', 'wt');       // it floats; we hold its 7
    B.move('l'); B.move('l');             // across on it
    B.goto(8, 3);
    B.move('d');                          // crate onto the plate
    B.put(7, 'mere_crate', 'wt');
    assert.ok(A.entById('sluice').open, 'sluice open');
    B.goto(11, 4);
    B.exit('d');

    /* ---- the mill: carry the one ---- */
    assert.equal(room(), 'mill');
    B.goto(6, 3);
    for (let n = 0; n < 200 && A.entById('millcount').s.cnt[0] < 1; n++) B.wait();
    assert.ok(A.entById('millcount').s.cnt[0] >= 1, 'counted to a hundred');
    B.bump(9, 2);                         // the strongbox
    assert.ok(G().items.watch, 'watch');

    /* ---- the lighthouse by its address ---- */
    B.exit('u'); B.exit('r'); B.exit('r');
    assert.equal(room(), 'square');
    assert.deepEqual(pocket(), [9, 1]);
    B.near(10, 2);
    B.put(1, 'townclock', 'hour', 0);     // 08 -> 18, and a zero for us
    assert.equal(A.hourVal(), 18);
    B.near(2, 3, 'u');
    B.put(0, 'h1', 'addr');               // our own door is No. 0 now
    B.move('u');
    assert.equal(room(), 'lh0');
    B.bump(5, 4);                         // the keeper reads the letter
    assert.ok(G().flags.letterRead);
    B.near(11, 2);
    B.put(1, 'cat', 'wt');                // a light cat hops off the stairs
    assert.notEqual(A.entById('cat').x, 11, 'the cat moved');
    B.put(9, '@', 'hp');                  // carry a nine in our own health
    assert.equal(A.pv('hp'), 9);
    B.bump(12, 2);
    assert.equal(room(), 'lh1');

    /* ---- second floor: two numbers down a one-way drop ---- */
    B.near(10, 2);
    B.put(3, 'lhjar', 'n');               // three cookies in, a zero out
    assert.deepEqual(pocket().slice().sort(), [0, 9]);
    B.goto(7, 4); B.move('d'); B.move('d');
    assert.equal(G().p.y, 6);
    B.near(13, 7, 'r');
    B.put(9, 'drum1', 'cnt');
    B.near(7, 9, 'd');
    B.put(0, 'lh1_door', 'addr');
    B.move('d');
    assert.equal(room(), 'lh0');
    B.bump(12, 2); B.bump(3, 2);
    assert.equal(room(), 'lh2');

    /* ---- third floor: the sun gate, then the moon gate ---- */
    assert.ok(G().items.watch);
    B.put(2, '@', 'hour', 1);             // 18 -> 12: day
    assert.equal(A.band(), 'day');
    B.goto(8, 5);
    B.put(4, '@', 'age', 0);              // our own age lends us a zero
    B.put(0, '@', 'hour', 0);             // 12 -> 02: night
    assert.equal(A.band(), 'night');
    B.goto(12, 4);
    B.put(1, '@', 'hp');                  // the nine we carried up
    B.near(13, 4, 'r');
    B.put(9, 'drum2', 'cnt');
    B.bump(12, 8);
    assert.equal(room(), 'lh3');

    /* ---- fourth floor: what only the spectacles see ---- */
    B.near(5, 5);
    B.swap('lhscope', 'd', 0, pocket().findIndex(v => v !== 9));
    B.near(7, 1, 'u');
    B.put(9, 'drum3', 'cnt');
    B.near(11, 2);
    B.put(0, 'partition', 'age');
    B.bump(12, 2);
    assert.equal(room(), 'lhtop');
    assert.deepEqual(JSON.parse(JSON.stringify(G().count)), [9, 9, 9, 7]);

    /* ---- the bell ---- */
    for (let i = 0; i < 3; i++) B.bump(7, 7);
    assert.equal(A.dval(G().lamp), 1, 'the lamp took the one');
    assert.ok(G().flags.lit);
    return { A, B, G };
}

if (!process.env.NO_TEST) test('the intended route lights the lamp', () => {
    playToEnd({ log: false });
});
