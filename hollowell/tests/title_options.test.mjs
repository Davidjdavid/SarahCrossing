// The title screen on a browser that has never started a game: an outside tester's first visit went to Options there,
// and every frame threw (a flag asked of a progress record that didn't exist yet), leaving the menu blank.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

test('the title, before any game: Options opens, every row and the Controls page answer and draw, and it closes back to the title', () => {
    const HW = loadGame();
    const Title = HW.global('Title'), Game = HW.global('Game'), Options = HW.global('Options');
    assert.equal(HW.G.scene, 'title');
    const errors = () => HW.ERRORS.length;
    const draw = () => Game.render();
    assert.doesNotThrow(() => Options.rows(), 'the rows can be built before any game');
    HW.press('down'); assert.equal(Title.items()[Title.sel], 'Options');
    HW.press('act'); assert.equal(Title.mode, 'options', 'Options opens');
    draw();
    for (let i = 0; i < Options.rows().length + 1; i++) { HW.press('down'); draw(); HW.press('right'); draw(); HW.press('left'); draw(); }
    assert.equal(errors(), 0, 'nothing thrown while going through every row: ' + HW.ERRORS.slice(0, 2).map(e => e.msg || e).join(' | '));
    for (let i = 0; i < 4 && Title.mode !== 'main'; i++) HW.press('atk');   /* (out of the Controls page first, if a row opened it) */
    assert.equal(Title.mode, 'main', 'and back to the title');
    /* then a new game starts as usual */
    Title.sel = Title.items().indexOf('New Wander'); HW.press('act'); assert.equal(Title.mode, 'slots');
    assert.equal(errors(), 0);
});
