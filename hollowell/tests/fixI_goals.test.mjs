// Fix round I (the outside QA pass, F3 and F4; POLISH.md 83 and 84): the goal line always says where next. After the
// fifth Knot it sends Wren home to the clinic, and moves on to the fair once she's been there (or has gone straight on
// and jumped down into the fair); the Stray House lends the goal line while it's played and gives the story's own back
// once it's done; Mr Ives's chair no longer empties it. Saves from before are put right as they load.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAVES = JSON.parse(fs.readFileSync(path.join(ROOT, 'qa_kit', 'saves', 'save_states.json'), 'utf8'));
const code = id => SAVES.find(s => s.id === id).code;
const raw = c => JSON.parse(Buffer.from(c.slice(4), 'base64').toString());
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y, 20000), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const load = c => { const HW = loadGame(); HW.global('Game').load(HW.Save.fromCode(c)); HW.step(40); HW.skipTalk(); return HW; };
const talk = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
/* everything said while fn runs */
const listen = (HW, fn) => { const lines = [], D = HW.Dialog, open0 = D.open; D.open = function (who, t, o) { lines.push(HW.Story.fill(t)); return open0.call(this, who, t, o); }; try { fn(); } finally { D.open = open0; } return lines; };
/* where the map's flag is for the goal (the valley's map) */
const pin = HW => { const q = HW.global('mapPin')({ regions: HW.AREAS.hollow.regions }); return q && [q[0], q[1]]; };
const inFair = ([x, y]) => x >= 0 && x < 64 && y >= 40 && y < 80;

const D5_HOME = 'Home to Hollowell. (Somebody at the clinic will want to hear all about it.)';
const D5_FAIR = 'Next, Larkspur Fair: down below the high mesa in Kilnridge.';
const D8 = 'The Shears can cut anyone free. The town, first? And then the fog at the Frayed Edge, and your own thread.';
const PILE_ROOM = "West of the Pile's room: Linnet's own room.";

test('after the fifth Knot: Gran names the fair; the goal moves on once the clinic has heard all about it, and the flag leaves the clinic', () => {
    const HW = load(code('T28'));
    assert.equal(HW.Progress.goal, D5_HOME);
    assert.deepEqual(pin(HW), [121, 52], 'the flag on the clinic');
    /* Gran first: she names the fair (the clinic's still to be told) */
    HW.warp('hollow', 93, 61, 'up'); HW.step(10); HW.skipTalk();
    const said = [];
    for (let i = 0; i < 4 && !said.some(l => /Larkspur Fair/.test(l)); i++) said.push(...listen(HW, () => talk(HW, 'up')));
    assert.ok(said.some(l => /Larkspur Fair, down below the high mesa in Kilnridge/.test(l)), said.join(' | '));
    assert.equal(HW.Progress.goal, D5_HOME, 'the clinic still to visit');
    /* then the clinic: Doctor Mallow hears all about it */
    HW.warp('clinic', 6, 4, 'up'); HW.step(10); HW.skipTalk();
    talk(HW, 'up');
    assert.ok(HW.Progress.flag('mallow_d5'), 'the clinic visited');
    assert.equal(HW.Progress.goal, D5_FAIR, 'the goal says where next');
    assert.ok(inFair(pin(HW)), `the flag on the fair (${pin(HW)})`);
    noErrors(HW);
});

test('after the fifth Knot, the clinic skipped: the jump down into the fair moves the goal on too', () => {
    const HW = load(code('T28'));
    HW.warp('hollow', 15, 83); HW.step(10); HW.skipTalk();
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); HW.skipTalk();
    go(HW, 12, 83); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(60); HW.skipTalk();
    assert.ok(HW.Progress.flag('leapt') && !HW.Progress.flag('mallow_d5'), 'down in the straw, the clinic not visited');
    assert.equal(HW.Progress.goal, D5_FAIR, 'not pointing back home');
    noErrors(HW);
});

test('saves from before: the clinic visited (T62) or the fair reached (T29-T32) load with the goal moved on; T28 keeps the clinic', () => {
    for (const id of ['T62', 'T29', 'T30', 'T31', 'T32', 'T73']) {
        assert.equal(raw(code(id)).progress.goal, D5_HOME, id + ' as saved');
        const HW = load(code(id));
        assert.equal(HW.Progress.goal, D5_FAIR, id);
        noErrors(HW);
    }
    assert.equal(load(code('T28')).Progress.goal, D5_HOME, 'T28: neither yet');
});

/* the Stray House's rooms (src/77_strayhouse.js, as tests/strayhouse.test.mjs has them) */
const R = { sh: [20, 11], pl: [20, 0], lr: [0, 0] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];

test('the Stray House lends the goal line (the Pile, then Linnet\'s room) and gives the story\'s own back when the bracelet is taken', () => {
    const HW = load(code('T66'));
    HW.Inv.maxHp = HW.Inv.hp = 36;
    assert.equal(HW.Progress.goal, D8);
    go(HW, ...at('pl', 9, 10));
    for (let i = 0; i < 20 && !/Pile can't be pushed/.test(HW.Progress.goal); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(/Pile can't be pushed/.test(HW.Progress.goal), 'in: the Pile wakes, its goal');
    /* (beaten as a burst beats it: its last) */
    const pile = HW.G.map.find('thePile'); pile.hp = 1; pile.burst();
    for (let i = 0; i < 10; i++) { HW.step(20); HW.skipTalk(); }
    assert.ok(HW.Progress.flag('sh_pile'));
    assert.equal(HW.Progress.goal, PILE_ROOM);
    go(HW, ...at('lr', 9, 6)); talk(HW, 'down');
    for (let i = 0; i < 6; i++) { HW.step(20); HW.skipTalk(); }
    assert.ok(HW.Inv.items.bracelet, "Linnet's bracelet");
    assert.equal(HW.Progress.goal, D8, "the story's own goal back");
    noErrors(HW);
});

test("the Unfinished House's end (Mr Ives at his chair) leaves the goal line as the story has it", () => {
    const HW = load(code('T69'));
    assert.equal(HW.Progress.goal, D8, 'T69 (saved still on the Stray House\'s line) loads with the story\'s own');
    HW.global('Script').run(HW.global('Unfinished').atChair());
    for (let i = 0; i < 12; i++) { HW.step(20); HW.skipTalk(); }
    assert.ok(HW.Inv.has('longhook'), 'the Long Hook given');
    assert.equal(HW.Progress.goal, D8);
    noErrors(HW);
});

test("saves from before: the optional Houses' ends (T67-T69 on the Stray House's line, T70 empty) load with the story's own goal", () => {
    for (const id of ['T67', 'T68', 'T69', 'T70']) {
        assert.notEqual(raw(code(id)).progress.goal, D8, id + ' as saved');
        const HW = load(code(id));
        assert.equal(HW.Progress.goal, D8, id);
        noErrors(HW);
    }
    /* (worked out from how far the story has got: the same as the game's own goal at every checkpoint of the main path
       from the Spoolworks on, where either House can first be finished) */
    const HW = loadGame(), storyGoal = HW.global('storyGoal');
    const main = ['T35', 'T36', 'T37', 'T38', 'T39', 'T40', 'T41', 'T42', 'T43', 'T44', 'T45', 'T46', 'T47', 'T48', 'T49', 'T50', 'T51', 'T52', 'T53', 'T54', 'T55', 'T56', 'T57', 'T58'];
    for (const id of main) { const s = raw(code(id)); assert.equal(storyGoal(s.progress.flags, s.inv), s.progress.goal, id); }
});
