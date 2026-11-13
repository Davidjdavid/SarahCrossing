// Fix round I (the outside QA pass, F1): a load, or a new Wander, takes nothing in from the game before. Loading used to
// put the new save's records in place and then "leave" the old game's place, writing where its strays and people had
// been left into the new save; a new Wander begun after a finished one started with the town as that one left it. And
// saves that took such records in load without what can't be their own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAVES = JSON.parse(fs.readFileSync(path.join(ROOT, 'qa_kit', 'saves', 'save_states.json'), 'utf8'));
const code = id => SAVES.find(s => s.id === id).code;
const raw = c => JSON.parse(Buffer.from(c.slice(4), 'base64').toString());
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const progress = HW => JSON.parse(JSON.stringify({ flags: HW.Progress.flags, areaFlags: HW.Progress.areaFlags, notes: HW.Progress.notes, journal: HW.Progress.journal, goal: HW.Progress.goal }));
const load = (HW, c) => { HW.global('Game').load(HW.Save.fromCode(c)); HW.step(5); HW.skipTalk(); HW.step(5); };
const cuts = af => Object.values(af || {}).reduce((n, o) => n + Object.keys(o).filter(k => k.startsWith('cut:')).length, 0);
/* the code the tester saved after loading T58 (the finished game, in town), then T02 (evidence F1-T02-contaminated.txt) */
const CONTAMINATED = 'HW1:eyJ2IjoxLCJnYW1lIjoiaG9sbG93ZWxsIiwidmVyc2lvbiI6IjAuMS4wIiwic2F2ZWRBdCI6MTc5NDUyMjU5MDQwOSwibmFtZSI6IldyZW4iLCJpbnYiOnsiaHAiOjYsIm1heEhwIjo2LCJidXR0b25zIjowLCJ0b29scyI6W10sImVxdWlwcGVkIjpudWxsLCJrZXlDb3VudCI6e30sInBhdHRlcm5zIjpbXSwicGxhbnMiOltdLCJrbm90cyI6W10sInBhdGNoZXMiOjAsInBhdGNoSWRzIjpbXSwiaXRlbXMiOnsic3RhZmYiOjF9LCJiZWRyb2xsIjpudWxsLCJzdGl0Y2hlcyI6W119LCJwcm9ncmVzcyI6eyJmbGFncyI6eyJ2aXNpdGVkOmdyYW5fcm9vbSI6dHJ1ZSwidmlzaXRlZDpncmFuX2hvdXNlIjp0cnVlLCJ0YWxrZWRHcmFuIjp0cnVlLCJ2aXNpdGVkOmhvbGxvdyI6dHJ1ZSwiY2VyZW1vbnkiOnRydWUsImdzMiI6dHJ1ZX0sImFyZWFGbGFncyI6eyJob2xsb3ciOnsiY3V0OkAxNTgsMzQiOiIxNTksMzQiLCJjdXQ6QDE2MSw4IjoiMTYyLDgiLCJjdXQ6QDEyLDUyIjoiMTcsNTIiLCJjdXQ6QDM2LDUyIjoiMzYsNTQiLCJjdXQ6QDk2LDQ3IjoiOTYsNDYiLCJjdXQ6QDc0LDcwIjoiNzQsNzAiLCJjdXQ6QDcxLDcyIjoiNzEsNzIiLCJjdXQ6QDkxLDYzIjoiMTA2LDY1IiwiY3V0OkA5OCw2NCI6Ijk4LDY0IiwiY3V0OkAxMTIsNjQiOiIxMTIsNjYiLCJjdXQ6QDEwMiw1OCI6IjEwMiw1OCIsImN1dDpAOTgsNTkiOiI5NSw0OCIsImN1dDpAMTA0LDU2IjoiOTYsNDkiLCJjdXQ6QDk3LDYwIjoiOTcsNjAiLCJjdXQ6Z3JhbkFmdGVyIjoiNzgsNTMiLCJjdXQ6bGlubmV0QWZ0ZXIiOiI4MCw1MyIsImN1dDptcml2ZXNUb3duIjoiMTIyLDQ3IiwiY3V0OkAxMzQsNzMiOiIxMzQsNzUiLCJjdXQ6QDQ0LDExMCI6IjQ0LDExMCIsImN1dDpANDksMTEyIjoiNTMsMTE0IiwiY3V0OkA3NywxMDYiOiI4NCwxMDciLCJjdXQ6QDE1NywxMDIiOiIxNjEsMTA2IiwiY3V0OkAxNDIsMTAxIjoiMTQ1LDEwNCIsImN1dDpAMTQ1LDk3IjoiMTUwLDk5In19LCJub3RlcyI6WyJncmFuVHVuZSJdLCJqb3VybmFsIjpbXSwiZ29hbCI6IkZpbmQgdGhlIFRpZHlob3VzZSBpbiBNZWFkb3dmb2xkLCBzb3V0aCBvZiB0b3duLCBhbmQgdGllIGl0cyBLbm90LiJ9LCJzdGF0cyI6eyJjIjp7InRhbGx5IjoxLCJhZnQ6d2F0Y2giOjEsImFmdDprZXB0Q3V0cyI6MSwiYWZ0OmtlcHRXZWxsIjoxLCJpbnRlcmFjdGlvbnMiOjEsImJsb3duIjo1OCwiZHJpZnRzIjoxMiwiaG9tZWNvbWluZ3MiOjI5LCJ2ZW50OmZpcmVkIjo5fSwicm9vbXMiOnsiZ3Jhbl9yb29tOjAiOnsidCI6NjA4LCJ2aXNpdHMiOjEsIm51ZGdlcyI6MH0sImdyYW5faG91c2U6MCI6eyJ0Ijo0NzUsInZpc2l0cyI6MSwibnVkZ2VzIjowfSwiaG9sbG93OjAiOnsidCI6MTUxNywidmlzaXRzIjoyLCJudWRnZXMiOjB9fSwicGxheUZyYW1lcyI6MjYwMCwidmlzaXRlZCI6eyJncmFuX3Jvb20iOnsiMSwwIjoxLCIwLDAiOjF9LCJncmFuX2hvdXNlIjp7IjAsMCI6MSwiMSwwIjoxLCIxLDEiOjEsIjIsMSI6MSwiMSwyIjoxfSwiaG9sbG93Ijp7IjE5LDEzIjoxLCIxOSwxNCI6MSwiMjAsMTQiOjEsIjIxLDE0IjoxLCIyMiwxNCI6MSwiMjIsMTUiOjEsIjIzLDE1IjoxfX19LCJwb3MiOnsiYXJlYSI6ImhvbGxvdyIsIngiOjE1MTIsInkiOjk4NiwiZGlyIjoxLCJtYXJrIjp7ImFyZWEiOiJob2xsb3ciLCJ0eCI6OTQsInR5Ijo2MX19LCJzZWVkIjoyMDI2MTEwOX0=';

test('a save loaded after another takes nothing from it: T02 loaded after the finished T58 is T02 as its own code has it', () => {
    const alone = loadGame(); load(alone, code('T02'));
    const HW = loadGame(); load(HW, code('T58'));
    assert.ok(cuts(HW.Progress.areaFlags) > 20, 'the finished game has its town as it was left');
    load(HW, code('T02'));
    assert.deepEqual(progress(HW), progress(alone));
    assert.deepEqual(HW.Progress.areaFlags, HW.Save.fromCode(code('T02')).progress.areaFlags, "nothing but the save's own");
    /* (again, as the report did it, and saved: the save has none of it either) */
    load(HW, code('T58')); load(HW, code('T02'));
    assert.deepEqual(HW.Save.snapshot().progress.areaFlags, HW.Save.fromCode(code('T02')).progress.areaFlags);
    assert.equal(HW.G.map.id, alone.G.map.id);
    noErrors(HW); noErrors(alone);
});

test("a load made in a House takes no key's tug from leaving it into the save it loads", () => {
    /* T11 is in the Kiln; T09, in town, given one of the Kiln's keys (as if it had one): "leaving" the Kiln used to tug it */
    const town = raw(code('T09')); town.inv.keyCount = Object.assign({}, town.inv.keyCount, { kiln: 1 });
    const HW = loadGame(); load(HW, code('T11'));
    assert.equal(HW.G.map.id, 'kiln');
    load(HW, 'HW1:' + Buffer.from(JSON.stringify(town)).toString('base64'));
    assert.equal(HW.G.map.id, 'hollow');
    assert.ok(!HW.Progress.flag('keys_tug') && !HW.Progress.flag('s08') && !HW.Progress.notes.includes('s08'), 'no tug, no note');
    noErrors(HW);
});

test('a new Wander begun from the title after a finished one starts with nothing of it', () => {
    const fresh = loadGame(); fresh.newGame('Wren', { noAutosave: true }); fresh.step(200); fresh.skipTalk(); fresh.step(20);
    const HW = loadGame(); load(HW, code('T58'));
    assert.ok(HW.Progress.flag('unwound') && cuts(HW.Progress.areaFlags) > 20);
    /* the menu's Save and go to the title; then New Wander, in an empty slot, the name as it's offered */
    const M = HW.global('PauseMenu'), Title = HW.global('Title');
    HW.press('menu', 1); assert.equal(HW.global('UI').menu, M);
    M.tab = M.tabs.indexOf('Save'); M.sel = 0;
    HW.press('down', 1); HW.press('act', 1);
    assert.equal(HW.G.scene, 'title');
    while (Title.items()[Title.sel] !== 'New Wander') HW.press('down', 1);
    HW.press('act', 1); assert.equal(Title.mode, 'slots'); assert.ok(!Title.slots[Title.slotSel].s, 'an empty slot');
    HW.press('act', 1); assert.equal(HW.G.scene, 'name');
    HW.press('act', 1); assert.equal(HW.G.scene, 'play');
    HW.step(200); HW.skipTalk(); HW.step(20);
    assert.equal(HW.G.map.id, 'gran_room');
    assert.deepEqual(Object.keys(HW.Progress.areaFlags), [], 'no place it holds anything of');
    assert.deepEqual(progress(HW), progress(fresh));
    noErrors(HW); noErrors(fresh);
});

test("what the game before had up doesn't come along: the attic's trial clock taken to the title, the credits mid-way", () => {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'inn_attic', x: 3, y: 7, noAutosave: true, skipIntro: true }); HW.step(5);
    HW.walkTo(3, 8); HW.step(10); HW.skipTalk();
    assert.ok(HW.G.trial, "the first trial's clock running");
    HW.walkTo(5, 8);
    const M = HW.global('PauseMenu');
    HW.press('menu', 1); M.tab = M.tabs.indexOf('Save'); M.sel = 0; HW.press('down', 1); HW.press('act', 1);
    assert.equal(HW.G.scene, 'title'); assert.ok(HW.G.trial, 'still running at the title');
    load(HW, code('T02'));
    assert.equal(HW.G.trial, null, 'no clock over the game loaded');
    /* a code loaded on the page while the credits roll (the HUD away for them) */
    HW.global('Script').run(function* () { HW.G.hideHud = true; yield* HW.global('Ending').credits(); });
    HW.step(30); assert.ok(HW.G.credits && HW.G.hideHud);
    load(HW, code('T02'));
    assert.equal(HW.G.credits, null); assert.equal(HW.G.hideHud, false);
    noErrors(HW);
});

test('the code saved from such a load (T58 then T02) loads clean: just what T02 holds', () => {
    const was = raw(CONTAMINATED);
    assert.equal(cuts(was.progress.areaFlags), 24, 'the town as the finished game left it');
    const HW = loadGame(), own = HW.Save.fromCode(code('T02')), s = HW.Save.fromCode(CONTAMINATED);
    assert.deepEqual(s.progress.areaFlags, own.progress.areaFlags);
    assert.deepEqual(s.progress.flags, own.progress.flags);
    HW.global('Game').load(s); HW.step(5); HW.skipTalk(); HW.step(5);
    assert.deepEqual(HW.Save.snapshot().progress.areaFlags, own.progress.areaFlags);
    noErrors(HW);
});

test("the clean-up keeps every save's own: none of the test saves loses a thing, a late one keeps its own cuts and anyone Wren cut loose", () => {
    const HW = loadGame();
    for (const t of SAVES) assert.deepEqual(HW.Save.fromCode(t.code).progress.areaFlags, raw(t.code).progress.areaFlags || {}, t.id);
    /* T64: the Shears in hand, the end still to come; given the finished T58's town as a load used to give it */
    const late = raw(code('T64')), done = raw(code('T58')), own = raw(code('T64')).progress.areaFlags;
    late.progress.areaFlags.hollow = Object.assign({}, late.progress.areaFlags.hollow, done.progress.areaFlags.hollow);
    assert.ok(cuts(late.progress.areaFlags) > cuts(own) + 20);
    assert.deepEqual(HW.Save.migrate(JSON.parse(JSON.stringify(late))).progress.areaFlags, own);
    /* someone she did cut loose (flagged so) keeps their spot; nobody else does */
    const one = JSON.parse(JSON.stringify(late)), spot = Object.keys(done.progress.areaFlags.hollow).find(k => k === 'cut:@161,8');
    assert.ok(spot, "Tess's spot in the town");
    one.progress.flags['cut:tess'] = true;
    const m = HW.Save.migrate(one).progress.areaFlags.hollow;
    assert.deepEqual(Object.keys(m).filter(k => k.startsWith('cut:')), [spot]);
    /* the finished game keeps all of its town */
    assert.deepEqual(HW.Save.fromCode(code('T58')).progress.areaFlags, done.progress.areaFlags);
    /* and a save without the Shears given a House's cut records keeps none, nor the place they made it look visited */
    const early = raw(code('T02'));
    early.progress.areaFlags.loom = Object.fromEntries(Object.entries(raw(code('T64')).progress.areaFlags.loom).filter(([k]) => k.startsWith('cut:')));
    assert.ok(cuts(early.progress.areaFlags) > 0);
    assert.equal(HW.Save.migrate(early).progress.areaFlags.loom, undefined);
});
