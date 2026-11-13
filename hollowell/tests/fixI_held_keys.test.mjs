// Fix round I (the outside QA pass, F5): changing the buttons never leaves one held. Act bound to V, then "Put them all
// back as they were" picked with V: V's release found V bound to nothing and never let go of Act, so Z and J never
// pressed it again. The same with any key held while the buttons change, a key still repeating, and a controller's
// button bound (or put back) while it's down. Driven through the input layer as the page's key events drive it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function start() {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true, skipIntro: true }); HW.step(5);
    const I = HW.global('Input');
    const ev = (code, type, repeat) => ({ code, key: '', type, repeat: !!repeat, preventDefault() { } });
    const down = (c, repeat) => I.keyDown(ev(c, 'keydown', repeat)), up = c => I.keyUp(ev(c, 'keyup'));
    const tap = (c, n = 3) => { down(c); HW.step(n); up(c); HW.step(n); };
    return { HW, I, down, up, tap, C: HW.global('Controls'), M: HW.global('PauseMenu'), O: HW.global('Options'), UI: HW.global('UI') };
}
/* the menu, Options, Controls, the row for a button: by keys */
function toRow(k, row) {
    const { HW, tap, C, M, O, UI } = k;
    tap('Escape'); assert.equal(UI.menu, M, 'the menu');
    while (M.tabs[M.tab] !== 'Options') tap('KeyE');
    tap('KeyZ'); assert.ok(O.focus, 'in Options');
    while (O.rows()[O.sel][0] !== 'Controls') tap('ArrowDown');
    tap('KeyZ'); assert.ok(C.open, 'in Controls');
    while (C.list()[C.sel] !== row) tap('ArrowDown');
    return HW;
}
/* out of Controls, Options and the menu, with the Stick */
function leave(k) { const { tap, C, UI } = k; tap('KeyX'); assert.ok(!C.open); tap('KeyX'); tap('KeyX'); assert.ok(!UI.menu, 'back in play'); }
/* a key presses Act, on the step it goes down, and lets go of it */
function acts(k, code) {
    const { HW, I, down, up } = k;
    down(code); HW.step(1);
    const pressed = I.pressed('act');
    up(code); HW.step(2);
    return pressed && !I.down('act');
}

test('Act bound to V, then the controls put back with V: Z, J and Space press Act again, and nothing is left held', () => {
    const k = start(), { HW, I, down, up, tap, C } = k;
    toRow(k, 'act');
    tap('KeyZ'); assert.equal(C.wait, 'act', 'waiting for the new key');
    tap('KeyV'); assert.equal(I.keymap.KeyV, 'act'); assert.equal(I.keymap.KeyZ, undefined);
    while (C.list()[C.sel] !== 'reset') tap('ArrowDown');
    down('KeyV'); HW.step(3);
    assert.equal(I.keymap.KeyZ, 'act', 'put back'); assert.equal(I.keymap.KeyV, undefined);
    up('KeyV'); HW.step(3);
    assert.equal(I.keys.act || 0, 0, 'Act let go');
    leave(k);
    for (const c of ['KeyZ', 'KeyJ', 'Space']) assert.ok(acts(k, c), c + ' presses Act');
    assert.ok(!acts(k, 'KeyV'), 'V is nothing again');
    noErrors(HW);
});

test('a key held down while the buttons change lets go when it should: Z still down as Act is bound to V', () => {
    const k = start(), { HW, I, down, up, tap, C } = k;
    toRow(k, 'act');
    down('KeyZ'); HW.step(3); assert.equal(C.wait, 'act');
    down('KeyV'); HW.step(2); up('KeyV'); HW.step(2);
    assert.equal(I.keymap.KeyV, 'act');
    up('KeyZ'); HW.step(3);
    assert.equal(I.keys.act || 0, 0, 'Act let go');
    assert.equal(C.wait, null, 'not waiting again');
    /* the Stick's row, the key held on it a while (repeating): the repeats aren't taken for the new key */
    while (C.list()[C.sel] !== 'atk') tap('ArrowDown');
    down('KeyV'); HW.step(3); assert.equal(C.wait, 'atk');
    for (let i = 0; i < 4; i++) { down('KeyV', true); HW.step(2); }
    up('KeyV'); HW.step(2);
    assert.equal(C.wait, 'atk', 'still waiting'); assert.equal(I.keymap.KeyV, 'act', 'V still Act');
    tap('KeyX'); assert.equal(I.keymap.KeyX, 'atk');
    leave(k);
    assert.ok(acts(k, 'KeyV'), 'V presses Act');
    assert.ok(!acts(k, 'KeyZ'), 'Z is nothing now');
    noErrors(HW);
});

test("a controller's button bound while it's down doesn't press what it's become; put back while it's down, nothing stays held", () => {
    const k = start(), { HW, I, C, M, O, UI } = k;
    const pad = { id: 'Test pad (STANDARD GAMEPAD)', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    I.pads = () => [pad];
    const set = (i, on) => { pad.buttons[i] = { pressed: on, value: on ? 1 : 0 }; };
    const tap = (i, n = 3) => { set(i, true); HW.step(n); set(i, false); HW.step(n); };
    /* (Start: the menu; RB: the tabs; A: act; the d-pad down; X: the Stick, back) */
    tap(9); assert.equal(UI.menu, M);
    while (M.tabs[M.tab] !== 'Options') tap(5);
    tap(0); assert.ok(O.focus);
    while (O.rows()[O.sel][0] !== 'Controls') tap(13);
    tap(0); assert.ok(C.open);
    while (C.list()[C.sel] !== 'act') tap(13);
    tap(0); assert.equal(C.wait, 'act');
    /* Y (the tool's) becomes Act, and is held a while */
    set(3, true); HW.step(1);
    assert.deepEqual([...I.padmap.act], [3]);
    HW.step(20);
    assert.equal(C.wait, null, "not waiting again: Y's press was for the tool");
    assert.ok(!I.down('act') && !I.down('tool'), 'Y does nothing while still down');
    set(3, false); HW.step(3);
    /* put back with Y (Act now), held */
    while (C.list()[C.sel] !== 'reset') tap(13);
    set(3, true); HW.step(1);
    assert.deepEqual([...I.padmap.act], [0]); assert.deepEqual([...I.padmap.tool], [1, 3]);
    HW.step(20);
    assert.ok(!I.down('act'), 'Act not held'); assert.ok(!I.down('tool'), 'nor the tool, until Y is pressed again');
    set(3, false); HW.step(3);
    tap(2); assert.ok(!C.open); tap(2); tap(2); assert.ok(!UI.menu);
    set(0, true); HW.step(1); assert.ok(I.pressed('act'), 'A presses Act'); set(0, false); HW.step(2);
    set(3, true); HW.step(1); assert.ok(I.pressed('tool'), 'Y is the tool again'); set(3, false); HW.step(2);
    assert.ok(!I.down('act') && !I.down('tool'));
    noErrors(HW);
});

test('the buttons read in again while a key is down (the page brings the settings from another device): it lets go', () => {
    const k = start(), { HW, I, down, up } = k;
    const Store = HW.global('Store'), Settings = HW.global('Settings');
    /* this device: Act on V; the settings coming in: the buttons as they started */
    I.keymap.KeyV = 'act'; delete I.keymap.KeyZ;
    down('KeyV'); HW.step(2); assert.ok(I.down('act'));
    Store.set('hollowell-settings', JSON.stringify({ keys: HW.global('KEYMAP_DEFAULT') }), true);
    Settings.load(); HW.step(2);
    assert.ok(!I.down('act'), 'Act let go, V still down');
    up('KeyV'); HW.step(2);
    assert.ok(acts(k, 'KeyZ'), 'Z presses Act'); assert.ok(!acts(k, 'KeyV'));
    noErrors(HW);
});
