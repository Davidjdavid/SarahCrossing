// A fresh Wander, played from the title onwards: the prologue, the ceremony, the road to the Tidyhouse,
// every room on the way to its Knot, and home again. (Fights use HW.hitEnemy, the stand-in for aiming.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const TIDY = { foyer: [20, 33], kitchen: [0, 33], gallery: [40, 33], hall: [20, 22], pantry: [0, 22], parlor: [40, 22], cons: [60, 22], linen: [40, 11], laundry: [60, 11], ball: [20, 11], library: [0, 11], attic: [0, 0], ante: [40, 0], boss: [20, 0] };
function t(room, x, y) { const [ox, oy] = TIDY[room]; return [ox + x, oy + y]; }

test('a fresh game: prologue, ceremony, the Tidyhouse to its Knot, and home', () => {
    const HW = loadGame();
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => {
        let r = HW.walkTo(x, y);
        for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); }   /* something said hello on the way */
        ok(r, m || `walk ${x},${y}`);
    };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };

    HW.newGame('Wren', { noAutosave: true });
    HW.step(120); HW.skipTalk(); HW.step(30);
    assert.equal(area(), 'gran_room');
    walk(1, 3); HW.hold('up'); until(() => area() === 'gran_house', 120); HW.release(); HW.step(40);
    walk(8, 4); HW.face('up'); talk();
    ok(HW.Progress.flag('talkedGran'), 'talked to Gran');
    walk(6, 7); HW.hold('down'); until(() => area() === 'hollow', 120); HW.release();
    HW.step(60); HW.skipTalk(); HW.step(30); HW.skipTalk();
    ok(HW.Progress.flag('ceremony') && HW.Inv.has('staff'), 'ceremony done, staff in hand');
    ok(!HW.Script.blocking(), 'free to move');

    /* down the south road to Meadowfold and the Tidyhouse door */
    walk(64 + 31, 80 + 18, 'south to Meadowfold');
    walk(64 + 44, 80 + 13, 'to the Tidyhouse');
    HW.hold('up'); until(() => area() === 'tidy', 120); HW.release(); HW.step(30);
    ok(area() === 'tidy', 'inside the Tidyhouse');

    /* foyer */
    walk(...t('foyer', 3, 5)); HW.push('right', 2); walk(...t('foyer', 9, 1)); HW.step(4); walk(...t('hall', 9, 9));
    /* back to the kitchen for the first key */
    walk(...t('foyer', 9, 2)); walk(...t('kitchen', 12, 6)); HW.face('up'); HW.press('act', 1);
    walk(...t('kitchen', 4, 4)); HW.face('up'); HW.press('act', 1); HW.step(40);
    walk(...t('kitchen', 13, 3)); HW.face('up'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'kitchen key');
    walk(...t('kitchen', 3, 6)); HW.face('down'); talk();    /* the pie */
    ok(HW.Progress.flag('pie'), 'ate the pie');
    /* the gallery with the key: the plan */
    walk(...t('foyer', 18, 5)); HW.hold('right'); HW.step(40); HW.release();
    walk(...t('gallery', 9, 6)); HW.push('up', 2); walk(...t('gallery', 6, 5)); HW.push('right', 3); walk(...t('gallery', 12, 7)); HW.step(250);
    walk(...t('gallery', 16, 2)); HW.face('up'); talk();
    ok(HW.Inv.plans.includes('tidy'), 'plan');
    /* the hall: shove trick */
    walk(...t('gallery', 1, 5)); walk(...t('foyer', 9, 1)); walk(...t('hall', 9, 7));
    HW.push('up', 3); walk(...t('hall', 7, 4)); HW.push('right', 1); walk(...t('hall', 6, 6)); HW.step(400);
    ok(thing('hN').open, 'hall north door open');
    /* pantry: key 2 */
    walk(...t('pantry', 10, 3)); HW.face('up'); HW.press('act', 1); walk(...t('pantry', 8, 5)); HW.face('left'); HW.press('act', 1); HW.step(28);
    walk(...t('pantry', 14, 7)); walk(...t('pantry', 15, 8)); HW.face('right'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'pantry key');
    /* parlor through the locked door, pulse plate, up into the linen closets */
    walk(...t('hall', 18, 5)); HW.hold('right'); HW.step(40); HW.release();
    walk(...t('parlor', 1, 9)); walk(...t('parlor', 1, 7)); HW.push('right', 6); walk(...t('parlor', 7, 8)); walk(...t('parlor', 16, 1));
    until(() => thing('pN').open, 300);
    HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk();
    const m = HW.ents('enemy').find(e => e.type === 'monger');
    ok(m && m.awake, 'the Dust Monger');
    while (m.alive) { HW.hitEnemy(m); HW.step(30); }
    HW.step(90); HW.skipTalk();
    walk(...t('linen', 9, 6)); HW.face('up'); talk();
    ok(HW.Inv.has('gloves'), 'gloves');
    /* laundry: key 3 */
    walk(...t('linen', 18, 5)); walk(...t('laundry', 14, 4)); HW.face('left');
    HW.hold(['act']); HW.step(3); const lb = thing('laundryBlock'); HW.hold(['act', 'right']); until(() => lb.tx >= 60 + 15, 200); HW.release(); HW.step(20);
    walk(...t('laundry', 13, 4)); HW.face('left'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'laundry key');
    HW.step(200); HW.push('right', 1);         /* the block came home behind you: push it out of the way */
    /* ballroom (from the hall's north door): tidy up, the Pattern */
    walk(...t('laundry', 1, 5)); walk(...t('linen', 9, 9)); walk(...t('parlor', 16, 1)); walk(...t('parlor', 1, 5));
    walk(...t('hall', 3, 1)); walk(...t('ball', 6, 8)); HW.face('down'); HW.press('act', 1);
    walk(...t('ball', 4, 6));
    until(() => HW.Return.isHome(thing('ballA')), 900); walk(...t('ball', 6, 7));
    until(() => HW.Progress.flag('tidy_ballDone'), 900);
    walk(...t('ball', 9, 3)); HW.face('up'); talk();
    ok(HW.Inv.hasPattern('tidy'), 'pattern');
    /* shortcut lever, then the locked door north of the linen closets, the big door, the Housekeeper */
    walk(...t('ball', 17, 4)); HW.face('right'); HW.press('act', 1); HW.step(10);
    walk(...t('ball', 18, 5)); walk(...t('linen', 9, 1)); HW.hold('up'); HW.step(50); HW.release();
    walk(...t('ante', 1, 5)); HW.hold('left'); HW.step(50); HW.release(); HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    ok(k, 'the Housekeeper');
    while (k.alive) { HW.hitEnemy(k); HW.step(40); }
    HW.step(200); HW.skipTalk();
    const hoop = HW.ents('hoop')[0];
    ok(hoop, 'the hoop');
    walk(hoop.tx, hoop.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('tidy') && HW.Progress.flag('d1'), 'the Tidy Knot');
    /* out and home */
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'exit door');
    walk(exit.tx, exit.ty - 1); HW.hold('down'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
