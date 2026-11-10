// Regression tests for the fresh-eyes review of the final act (the Drift, the Pull, the Great Spool, the end, after).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { foot: [20, 33], slumber: [0, 11], mario: [40, 11], belfry: [40, 22], top: [20, 0] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const go = (HW, r, x, y) => assert.ok(HW.walkTo(...at(r, x, y)), `walk to ${r} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const snip = HW => { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); HW.step(3); };
function game(preset = 'afterDrift') { const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk(); return HW; }
const spool = HW => { HW.warp('greatspool', ...at('foot', 9, 8)); HW.step(30); HW.skipTalk(); };

test('1/8: down the Spool the Shears won\'t take a sleeper\'s thread (too taut: it sleeps on); a Knot\'s gate, once passed, stays open when the room is built afresh', () => {
    const HW = game(); spool(HW);
    HW.warp('greatspool', ...at('belfry', 14, 9)); HW.step(20);
    HW.face('up'); snip(HW);
    const b = HW.G.map.find('gsBBoulder');
    assert.ok(b.ret && b.sleeper && b.tiedOff, 'asleep, on its thread');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120);
    assert.ok(HW.G.map.find('gsBGate').open, 'rung north onto the plate: the gate');
    go(HW, 'belfry', 16, 3);
    spool(HW); HW.warp('greatspool', ...at('belfry', 16, 2)); HW.step(20);
    assert.ok(HW.G.map.find('gsBGate').open, 'open after a rebuild');
    assert.ok(HW.walkTo(...at('belfry', 13, 5)), 'and the way out with it');
    noErrors(HW);
});

test('2/5: puppets, Gran and Linnet are not for the Shears', () => {
    const HW = game(); spool(HW);
    HW.warp('greatspool', ...at('mario', 1, 5)); HW.step(20);
    go(HW, 'mario', 4, 7); HW.face('down'); snip(HW);
    assert.ok(HW.G.map.find('gsPuppet').ret, 'the puppet keeps its strings');
    HW.Progress.set('spool_met');
    HW.warp('greatspool', ...at('top', 9, 5)); HW.step(30);
    const gran = HW.G.map.ents.find(e => e.who === 'gran');
    HW.walkTo(gran.tx, gran.ty + 1); HW.face('up'); snip(HW);
    assert.ok(!HW.Progress.flag('cut:gran'), 'not Gran');
    HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.ok(HW.global('Dialog').active && /home|hold on|look/i.test(HW.global('Dialog').pages.flat().join(' ')), 'and she talks like it');
    HW.skipTalk();
    noErrors(HW);
});

test('3: with her own thread cut, nothing makes Wren faint', () => {
    const HW = game(); HW.Inv.hp = 1;
    HW.player().hurt(5, 0, 0); HW.step(30);
    assert.equal(HW.player().state, 'normal');
    assert.equal(HW.G.map.id, 'hollow');
    noErrors(HW);
});

test('4: the Drift\'s woods are solid; into the stream from the east, out on the east bank again', () => {
    const HW = game();
    HW.warp('drift', 50, 19); HW.step(10); HW.skipTalk();
    assert.ok(HW.G.map.kind(10, 30).solid, 'trees');
    HW.walkTo(41, 19); HW.hold('left'); HW.step(60); HW.release(); HW.step(60);
    assert.ok(HW.player().tx > 40, 'back on the east bank, not the west');
    noErrors(HW);
});

test('6/7: cut during the Pull, they come free of it; nobody with a thread is indoors meanwhile', () => {
    const HW = game();
    HW.step(600);
    const n = HW.G.map.ents.find(e => e.dragged);
    HW.global('Freed').free(n); HW.Progress.set('cut:' + n.who);
    assert.ok(!n.dragged, 'not dragged');
    HW.warp('bakery', 'door'); HW.step(10);
    HW.warp('inn', 4, 4); HW.step(10);
    assert.ok(!HW.G.map.ents.some(e => e.kind === 'npc' && !HW.Progress.flag('cut:' + e.who) && e.who !== 'gran'), 'the Inn is empty');
    noErrors(HW);
});

test('10/12/13: a Knot untied is saved; the goal counts the Knots', () => {
    const HW = game(); spool(HW);
    assert.match(HW.Progress.goal, /0 of 6/);
    HW.warp('greatspool', ...at('slumber', 6, 2)); HW.step(20);
    HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5);
    assert.match(HW.Progress.goal, /1 of 6/);
    const s = HW.Save.read(HW.Save.slot);
    assert.ok(s && s.progress.flags['untie:slumber'], 'saved');
    noErrors(HW);
});

test('11/14/15/18: after: lines indoors; a Drift-bloom seed; the stones read during the Pull; the bracelet given; the title per save', () => {
    const HW = game();
    HW.walkTo(95, 60, 40000); HW.step(10); HW.skipTalk(); HW.walkTo(95, 60, 40000);
    HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(1); HW.step(5);
    assert.ok(HW.Progress.flag('motto:act3'), 'the stones read');
    HW.warp('drift', 13, 23); HW.step(10); HW.skipTalk(); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.items.driftseed, 'a seed');
    HW.Inv.items.bracelet = 1;
    HW.global('Script').run(HW.global('Ending').unwinding());
    for (let i = 0; i < 300 && (HW.G.hideHud || HW.G.credits || !HW.Progress.flag('unwound')); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(!HW.Inv.items.bracelet, 'given');
    const T = HW.global('Title');
    T.slots = [{ n: 1, s: HW.Save.snapshot() }, { n: 2, s: null }, { n: 3, s: null }];
    assert.ok(T.ended() && T.items().includes('Carry on'), 'Carry on, for this save');
    T.slots = [{ n: 1, s: null }, { n: 2, s: null }, { n: 3, s: null }];
    assert.ok(!T.ended(), 'not for nobody');
    const H3 = game('afterEnding');
    H3.warp('inn', 4, 4); H3.step(10);
    const ives = H3.G.map.ents.find(e => e.who === 'ives');
    assert.ok(ives, 'Ives at the Inn');
    H3.global('Script').run(H3.global('Story').talk(ives), { name: 'talk' }); H3.step(3);
    assert.ok(H3.global('AFTER_LINES').ives.some(l => H3.global('Dialog').pages[0][0].startsWith(l.slice(0, 10))), 'Ives, after'); H3.skipTalk();
    noErrors(HW); noErrors(H3);
});
