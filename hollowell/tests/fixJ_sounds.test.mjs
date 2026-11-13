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
