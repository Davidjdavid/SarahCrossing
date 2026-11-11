// The story told through play: Wren's tally (every time she's been brought home) on her spool and in the ledger, and
// Tuck's pulls in Gran's mouth; holding on in the Hall of Names while Gran waits; the voice behind the walls before
// Reveal 1 (its Maker's way of talking, no name); after a Knot, a wordless look at the Well's winch; Biscuit, just a
// cat; Linnet's note 5, tried at the river's fog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* everything said from here on (the dialogue box's lines) */
function listen(HW) {
    const lines = [], D = HW.Dialog, open0 = D.open.bind(D);
    D.open = (who, t, o) => { lines.push((who ? who + ': ' : '') + t); return open0(who, t, o); };
    return lines;
}
/* talk on (first choice) until fn, or until nothing's left to say */
function talkUntil(HW, fn, choice = 0, max = 40000) {
    const D = HW.Dialog;
    for (let i = 0; i < max && !fn(); i++) {
        if (D.active && D.shown >= D.pageLen()) { if (D.choices) D.sel = choice; HW.press('act', 1); }
        else if (!D.active && !HW.Script.blocking()) break;
        else HW.step(1);
    }
    return fn();
}
/* from the end of the Makings: down the Way Down, Tuck's spool, Wren's and Tuck's own spools, then the ledger, talked
   through to the moment Gran pulls */
function toHall(HW) {
    assert.ok(HW.walkTo(57, 8)); HW.hold('down'); HW.step(30); HW.release(); HW.step(40); HW.skipTalk();
    assert.equal(HW.G.map.id, 'deep');
    assert.ok(HW.walkTo(9, 7)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.walkTo(21, 5)); HW.step(20);
    for (const who of ['wren', 'tuck']) {
        const s = HW.G.map.ents.find(e => e.kind === 'namespool' && e.spec[1] === who);
        assert.ok(HW.walkTo(s.tx, s.ty + 1)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    }
    assert.ok(HW.walkTo(37, 4)); HW.face('up'); HW.press('act', 1);
    assert.ok(talkUntil(HW, () => HW.global('Reveal2').taut), 'Gran pulls');
}
function hall(setup) {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    setup(HW);
    const lines = listen(HW);
    toHall(HW);
    for (let i = 0; i < 60 && !HW.Progress.flag('reveal2'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('reveal2') && HW.G.map.id === 'gran_room', 'home in bed');
    noErrors(HW);
    const said = re => lines.find(l => re.test(l)) || '';
    return { HW, lines, spool: said(/^WREN\./), tuck: said(/^TUCK\./), page: said(/^The last page/), gran: said(/^gran: .*(boy|thread\.)/) };
}

/* ---------------- Wren's tally ---------------- */

test('a new Wander keeps the tally from its first step; a preset and an older save never claim one', () => {
    const HW = loadGame(), Tally = HW.global('Tally');
    HW.newGame('Wren', { skipIntro: true, noAutosave: true }); HW.step(5);
    assert.ok(Tally.kept(), 'a new game');
    assert.equal(Tally.home(), 0);
    /* saved and loaded, it still knows */
    HW.Save.write(1); const s = HW.Save.read(1); HW.global('Game').load(s); HW.step(5);
    assert.ok(Tally.kept(), 'kept through a save');
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    assert.ok(!Tally.kept() && Tally.home() === null && Tally.rows() === null && Tally.tuck() === null, 'a preset skips the play before it');
    /* a save from before the tally (counters it did keep, but no mark) loads, and says nothing in numbers */
    const old = { game: 'hollowell', v: 1, name: 'Wren', inv: { tools: ['gloves'] }, progress: { flags: { fogTries: 2 } }, stats: { c: { falls: 7, faints: 1, 'falls@tidy': 4 } }, pos: { area: 'gran_room', x: 6 * 16 + 8, y: 3 * 16 + 10 } };
    const code = 'HW1:' + Buffer.from(JSON.stringify(old)).toString('base64');
    const back = HW.Save.fromCode(code);
    assert.ok(back, 'the old save reads'); HW.global('Game').load(back); HW.step(5);
    assert.equal(HW.G.map.id, 'gran_room');
    assert.ok(!Tally.kept() && Tally.home() === null, 'an older save: no number');
    noErrors(HW);
});

test('every way home is counted (a fall by where it was, a faint, the fog, Gran\'s pull); not Homeward, not a fall nothing pulls', () => {
    const HW = loadGame(), Tally = HW.global('Tally');
    HW.newGame('Wren', { skipIntro: true, noAutosave: true }); HW.step(5);
    HW.give('gloves');
    const p = () => HW.player();
    const fall = (area, x, y, why = 'pit') => { HW.warp(area, x, y); HW.step(10); HW.skipTalk(); p().startFall(why); for (let i = 0; i < 200 && p().state !== 'normal'; i++) HW.step(1); HW.skipTalk(); };
    fall('tidy', 29, 39);
    fall('tidy', 29, 39, 'doze');
    assert.equal(HW.Stats.c['home@tidy'], 2, 'two flights home in the Tidyhouse (a doze too)');
    fall('hollow', 128 + 20, 80 + 21, 'water');
    assert.equal(HW.Stats.c['home@hollow:millwater'], 1, 'a sink in the lake: Millwater');
    /* a Homeward flight is her own doing */
    const before = HW.Stats.c['home:fall'];
    HW.warp('tidy', 29, 39); HW.step(10); HW.skipTalk(); p().flyHome({ homeward: true }); for (let i = 0; i < 200 && p().state !== 'normal'; i++) HW.step(1);
    assert.equal(HW.Stats.c['home:fall'], before, 'Homeward: not counted');
    /* in the Stray House nothing pulls her: she climbs out, and nothing's counted */
    HW.warp('strayhouse', HW.AREAS.strayhouse.entry.x, HW.AREAS.strayhouse.entry.y); HW.step(10); HW.skipTalk();
    p().startFall('pit'); for (let i = 0; i < 200 && p().state !== 'normal'; i++) HW.step(1); HW.skipTalk();
    assert.equal(HW.Stats.c['home@strayhouse'], undefined, 'a fall nothing pulls');
    /* a faint, and the fog */
    HW.warp('hollow', 100, 60); HW.step(10); HW.skipTalk();
    HW.Inv.hp = 1; p().inv = 0; p().hurt(2, p().x + 5, p().y);
    for (let i = 0; i < 60 && (HW.G.map.id !== 'gran_room' || HW.Script.blocking()); i++) { HW.skipTalk(); HW.step(10); }
    assert.equal(HW.Stats.c.faints, 1);
    HW.warp('hollow', 100, 60); HW.step(10); HW.skipTalk();
    HW.Story.fogPull(p()); for (let i = 0; i < 300 && (p().state !== 'normal' || HW.Script.blocking()); i++) { HW.skipTalk(); HW.step(1); }
    assert.equal(HW.Progress.get('fogTries'), 1);
    assert.equal(Tally.home(), 5, 'three falls, a faint, the fog');
    assert.equal(Tally.rows().map(r => r.join(' ')).join(', '), 'TIDYHOUSE 2, MILLWATER 1, FAINTED 1, THE FOG 1');
    noErrors(HW);
});

test('the Hall of Names: the tally on Wren\'s spool and the ledger\'s last page; Gran quotes Tuck\'s pulls', () => {
    const r = hall(HW => {
        const c = HW.Stats.c; c.tally = 1;
        Object.assign(c, { 'home:fall': 23, 'home@millrace': 9, 'home@tidy': 4, 'home@hollow:millwater': 10, faints: 3, 'tuck:yanked': 4 });
        HW.Progress.set('fogTries', 2); HW.Progress.set('tuck_yanked');
    });
    assert.match(r.spool, /a tally in Gran's hand, five strokes to a gate\. Twenty-eight\./, r.spool);
    assert.match(r.page, /The longest row is MILLWATER: ten\. Under them all, underlined: "Every one, home\."/, r.page);
    assert.match(r.tuck, /but for the last four turns, pulled snug/, r.tuck);
    assert.match(r.gran, /You pulled that boy home four times, love, by his own thread\. Then you know how easy it is\./, r.gran);
    /* (and Gran's own pull counts too: the Spool can use it) */
    assert.equal(r.HW.global('Tally').home(), 29);
});

test('the Hall of Names, never brought home and never pulling: nothing on the card, and Gran says so', () => {
    const r = hall(HW => { HW.Stats.c.tally = 1; });
    assert.match(r.spool, /ruled for a tally in Gran's hand\. There isn't a stroke on it\./, r.spool);
    assert.match(r.page, /there isn't a stroke in any of them\. Under them all: "Not one fall\. I wound her in anyway, every night\."/, r.page);
    assert.match(r.tuck, /the way a spool is before anybody has pulled on it/, r.tuck);
    assert.match(r.gran, /You never once pulled that boy's thread, down there\. I could never leave yours alone\./, r.gran);
});

test('the Hall of Names from a save that kept no tally: the same things, with no numbers', () => {
    const NUM = /\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|once|twice|times)\b|\d/i;
    let r = hall(HW => { HW.Progress.set('tuck_yanked'); HW.Stats.c.faints = 4; HW.Stats.c['tuck:yanked'] = 2; });
    assert.match(r.spool, /A card is pinned under it: a tally in Gran's hand, five strokes to a gate\.$/, r.spool);
    assert.match(r.page, /Under them all, underlined: "Every one, home\."/);
    assert.ok(!/longest|Only one row|Not one fall/.test(r.page), r.page);
    assert.match(r.gran, /You pulled that boy home by his own thread, love\./);
    for (const l of [r.page.replace('five strokes', '').replace('Every one', ''), r.gran, r.tuck]) assert.ok(!NUM.test(l), 'no number: ' + l);
    r = hall(() => { });
    assert.equal(r.gran, '', 'never pulled, and nothing to say it with: Gran says nothing about the boy');
});

/* ---------------- holding on ---------------- */

test('held things wait: holding on to the lectern, Gran can\'t take Wren, and waits; let go and she\'s pulled home', () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    const UI = HW.global('UI'), toasts = [], t0 = UI.toast.bind(UI);
    UI.toast = (s, d) => { toasts.push(s); return t0(s, d); };
    toHall(HW);
    const p = HW.player(), lect = HW.G.map.ents.find(e => e.kind === 'ledger');
    HW.hold('act'); HW.step(1500);
    assert.ok(!HW.Progress.flag('reveal2') && HW.G.map.id === 'deep', 'still in the Hall, as long as she holds on');
    assert.equal(p.grip, lect, 'holding the lectern');
    assert.ok(HW.Progress.flag('hall_held'));
    assert.ok(toasts.some(s => /Gran: "I can wait, love\."/.test(s)), toasts.join(' | '));
    assert.ok(HW.global('Reveal2').taut, 'the thread still taut between them');
    HW.release(); HW.step(2);
    assert.ok(!p.grip, 'let go');
    for (let i = 0; i < 60 && !HW.Progress.flag('reveal2'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('reveal2') && HW.G.map.id === 'gran_room', 'pulled home to bed');
    assert.equal(HW.global('Reveal2').taut, null);
    noErrors(HW);
});

test('a tap isn\'t holding on, and nobody has to: without a hold the pull takes Wren home as it always did', () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    toHall(HW);
    HW.step(20); HW.press('act', 3); HW.step(20); HW.press('act', 3);
    for (let i = 0; i < 400 && !HW.Progress.flag('reveal2'); i++) HW.step(1);
    assert.ok(HW.Progress.flag('reveal2'), 'pulled home within seconds');
    assert.ok(!HW.Progress.flag('hall_held'), 'taps never took hold');
    for (let i = 0; i < 20; i++) { HW.skipTalk(); HW.step(10); }
    assert.equal(HW.G.map.id, 'gran_room');
    noErrors(HW);
});

/* ---------------- the voice behind the walls, the winch, the cat ---------------- */

test('before Reveal 1 the voice behind the walls is nobody by name: it talks the way its Maker does', () => {
    const HOUSES = { tidy: ['afterD1', 'tidy', /Not very tidy/], kiln: ['afterD1', 'kiln', /HA— ahem/], mill: ['afterD2', 'millrace', /Wander rules/],
        belfry: ['afterD3', 'belfry', /bairn/], slumber: ['afterD4', 'slumber', /yaaawn/], marionette: ['afterD5', 'marionette', /Psst/] };
    const ask = (preset, area, choice) => {
        const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk();
        HW.global('Settings').hints = true;
        HW.warp(area, HW.AREAS[area].entry.x, HW.AREAS[area].entry.y); HW.step(5); HW.skipTalk();
        const a = HW.G.map, room = a.rooms.find(q => q.nudge), lines = listen(HW);
        HW.Script.run(HW.global('Nudges').ask(a, room, room.nudge));
        talkUntil(HW, () => false, choice);
        noErrors(HW);
        return lines.join(' ');
    };
    for (const [h, [preset, area, tic]] of Object.entries(HOUSES)) {
        const said = ask(preset, area, 1);
        assert.match(said, tic, h + ': ' + said);
        assert.ok(!/rather like|Ives|Bram|Mallow|Jory|your dad|your mum|Gundry/.test(said), h + ' names nobody: ' + said);
        assert.match(said, /Would you like that\?/);
    }
    /* after Reveal 1 everybody knows who's down there */
    assert.match(ask('afterD6', 'spoolworks', 1), /one of the Makers clears their throat/);
});

test('a Knot: no words about the Well, but a moment\'s look at its winch turning a notch, the Knot\'s thread wound on', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(10); HW.skipTalk();
    HW.Inv.knots.length = 0;
    HW.warp('tidy', 29, 7); HW.step(20); HW.skipTalk();
    const hoop = HW.ents('hoop')[0]; assert.ok(hoop, 'the hoop');
    const lines = listen(HW);
    assert.ok(HW.walkTo(hoop.tx, hoop.ty + 1)); HW.face('up'); HW.press('act', 1);
    let seen = null, frames = 0;
    talkUntil(HW, () => { if (HW.G.winch) { seen = HW.G.winch; frames++; } return false; });
    assert.equal(HW.Inv.knots.join(), 'tidy');
    assert.ok(seen && seen.n === 1 && seen.knots[0] === 'tidy', 'the winch, one band: the Tidyhouse\'s thread');
    assert.ok(frames >= 90, 'a moment, ' + frames + ' frames');
    assert.equal(HW.G.winch, null, 'and gone');
    assert.ok(!lines.some(l => /creak|winch|Well/i.test(l)), lines.join(' | '));
    /* (a load in the middle of it can't leave the picture up: it times itself) */
    HW.G.winch = { t0: HW.G.t, n: 2, knots: ['tidy', 'kiln'] };
    HW.Script.clear(); HW.step(HW.global('WINCH_T') + 2);
    HW.global('Knots').draw(0, 0);
    assert.equal(HW.G.winch, null);
    noErrors(HW);
});

test('Biscuit, the first time: just the town cat', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(10); HW.skipTalk();
    const lines = listen(HW);
    HW.Script.run(HW.global('CRITTER_TALK').biscuit({})); HW.step(3); HW.skipTalk();
    assert.deepEqual(lines, ['Biscuit, the town cat.']);
});

/* ---------------- Linnet's note 5, tried ---------------- */

test('Linnet\'s note 5 says where and what; at the river\'s fog in Meadowfold, a hand in it shows the rest', () => {
    const HW = loadGame(); HW.preset('afterD3'); HW.step(10); HW.skipTalk();
    const note = HW.global('NOTES').linnet5.text;
    assert.match(note, /Go to where the river runs into the fog and put your hand in it\./);
    assert.ok(!/fine as hair|It's thread|It isn't mist/.test(note), note);
    const FogHand = HW.global('FogHand');
    /* elsewhere at the fog's edge (the fair's west side), nothing */
    HW.warp('hollow', 100, 60); HW.step(10); HW.skipTalk();
    const a = HW.G.map, open = (x, y) => !a.kind(x, y).solid && !a.kind(x, y).fog && !a.kind(x, y).deep && !a.at(x, y);
    let spot = null;
    for (let y = 41; y < 79 && !spot; y++) for (let x = 1; x < 30; x++) if (open(x, y) && a.kind(x - 1, y).fog) { spot = [x, y]; break; }
    assert.ok(spot, 'a spot at the fog\'s edge, away from the river');
    HW.warp('hollow', spot[0], spot[1]); HW.step(10); HW.skipTalk();
    HW.face('left'); HW.press('act', 1); HW.step(5); HW.skipTalk();
    assert.ok(!HW.Progress.flag('fog_hand') && !FogHand.card, 'nothing to see there');
    /* where the river runs into it */
    HW.warp('hollow', 113, 112); HW.step(20); HW.skipTalk();
    assert.ok(HW.walkTo(113, 116), 'down the shallows to the river\'s end');
    const lines = listen(HW), fog0 = HW.Progress.get('fogTries') || 0;
    HW.face('down'); HW.press('act', 1); HW.step(30);
    assert.ok(FogHand.card && FogHand.card.red && !FogHand.card.slack, 'a close look: taut, her own thread among them');
    HW.skipTalk(); HW.step(5);
    assert.deepEqual(lines, ['You put your hand into the fog.']);
    assert.ok(HW.Progress.flag('fog_hand'));
    assert.equal(FogHand.card, null, 'gone with the line');
    assert.equal(HW.Progress.get('fogTries') || 0, fog0, 'the fog never pulled');
    assert.deepEqual([HW.player().tx, HW.player().ty], [113, 116]);
    /* her own thread cut: not among them; the Unwinding come: all of them slack */
    HW.Progress.set('cut_self'); HW.face('down'); HW.press('act', 1); HW.step(30);
    assert.ok(FogHand.card && !FogHand.card.red); HW.skipTalk(); HW.step(5);
    HW.Progress.set('unwound'); HW.face('down'); HW.press('act', 1); HW.step(30);
    assert.ok(FogHand.card && FogHand.card.slack); HW.skipTalk(); HW.step(5);
    noErrors(HW);
});
