// Fix round D, part 2 (AI blind solver D, a heuristic evaluation, not a playtest): the seventh and eighth Houses' bosses
// and the Great Spool. The Tangle answers every try (the stick on the whole knot; four threads out with one not held; a
// knot tied below, every time); the Weaver's threads in the Shears' reach glint, its silk is cut whatever's in hand, and
// a lash never lands on a bound Wren; the Airing Cupboard can't be run through; the Winding Room's way up in plain sight;
// the last hand-hold shows how far it's got and doesn't lose it all when let go; the Foot's empty peg, there at the top.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const toasts = HW => HW.global('UI').toasts.map(t => t.s).concat(HW.G.pendingToast ? [HW.G.pendingToast.s || HW.G.pendingToast] : []);
/* every sound played from now on, by name */
function sounds(HW) { const S = HW.global('Sfx'), play0 = S.play, out = []; S.play = function (n, ...r) { out.push(n); return play0.call(this, n, ...r); }; return out; }

/* ================= the Tangle (the Spoolworks' Heart) ================= */
const SR = { heart: [20, 0], uheart: [20, 33] };
const sat = (room, x, y) => [SR[room][0] + x, SR[room][1] + y];
const sgo = (HW, room, x, y) => assert.ok(HW.walkTo(...sat(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const sthing = (HW, id) => HW.G.map.find(id);
const where = (HW, id) => { const e = sthing(HW, id); return [e.tx, e.ty]; };
function hatch(HW, room, x, y, dir) { sgo(HW, room, x, y); HW.face(dir); HW.press('act', 1); HW.step(40); }
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function sstitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
function tangleGame() {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 30;
    HW.Inv.giveTool('needle');
    HW.G.cheats.god = true;
    HW.warp('spoolworks', ...sat('heart', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    HW.walkTo(...sat('heart', 6, 7)); HW.step(5); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    assert.equal(t.state, 'whole');
    return [HW, t];
}
const allHome = HW => until(HW, () => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(sthing(HW, id)) && !sthing(HW, id).mv), 600);
/* three stitched away from it (the Needle), as the first beat wants */
function stitchThree(HW) {
    allHome(HW);
    HW.walkTo(...sat('heart', 8, 2)); HW.face('right'); sstitch(HW, 'UL'); until(HW, () => HW.Return.isHome(sthing(HW, 'tbN')), 60);
    sgo(HW, 'heart', 6, 4); HW.face('down'); sstitch(HW, 'LL'); until(HW, () => HW.Return.isHome(sthing(HW, 'tbW')), 60);
    sgo(HW, 'heart', 12, 4); HW.face('down'); sstitch(HW, 'RR'); until(HW, () => HW.Return.isHome(sthing(HW, 'tbE')), 60);
}

test('the Tangle whole, struck with the stick: a thud and a shrug of its cords every time, and a line the first time', () => {
    const [HW, t] = tangleGame();
    t.ballT = t.sweepT = 9999;
    const heard = sounds(HW);
    sgo(HW, 'heart', 7, 5);
    strike(HW, 'right');
    assert.ok(heard.includes('thud'), 'heard: ' + heard.join());
    assert.ok(t.shrug > 0, 'its cords shrug');
    const line = toasts(HW).find(s => /stick/i.test(s));
    assert.ok(line, 'said, the first time: ' + toasts(HW).join(' | '));
    assert.equal(t.state, 'whole', 'and nothing more: still whole');
    HW.global('UI').toasts.length = 0; HW.G.pendingToast = null;
    HW.step(40); heard.length = 0;
    strike(HW, 'right');
    assert.ok(heard.includes('thud') && t.shrug > 0, 'again: the thud and the shrug');
    assert.ok(!toasts(HW).some(s => s === line), 'the line not again');
    noErrors(HW);
});

test("the Tangle's four threads out at once, three held and the fourth only pushed off: the fourth's thread is drawn being pulled in, and when it slips home it's said and seen (every time, the long way the first time)", () => {
    const [HW, t] = tangleGame();
    t.ballT = t.sweepT = 9999; t.lashT = 9999;
    stitchThree(HW);
    sgo(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25);
    assert.deepEqual(where(HW, 'tbS'), sat('heart', 11, 8), 'the fourth pushed off');
    const S = sthing(HW, 'tbS');
    assert.ok(t.bobbins().every(b => t.out(b)), 'all four out');
    assert.ok(t.pulling(S) && !['tbN', 'tbW', 'tbE'].some(id => t.pulling(sthing(HW, id))), 'the fourth drawn being pulled in; the three held, not');
    sgo(HW, 'heart', 15, 8);
    const heard = sounds(HW);
    assert.ok(until(HW, () => HW.Return.isHome(S) && !S.mv, 900), 'it slips home');
    HW.step(5);
    assert.equal(t.state, 'whole', 'still whole');
    const first = toasts(HW).find(s => /fourth/i.test(s));
    assert.ok(first && /three/i.test(first), 'said what happened: ' + toasts(HW).join(' | '));
    assert.ok(t.tight > 0 && heard.includes('twang'), 'and seen and heard: it winds tight');
    /* again: a shorter line, and the same sight */
    HW.global('UI').toasts.length = 0; HW.G.pendingToast = null; HW.step(60);
    sgo(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25); sgo(HW, 'heart', 15, 8);
    assert.ok(until(HW, () => HW.Return.isHome(S) && !S.mv, 900));
    HW.step(5);
    const again = toasts(HW).find(s => /fourth/i.test(s));
    assert.ok(again && again.length < first.length, 'a shorter line: ' + toasts(HW).join(' | '));
    noErrors(HW);
});

test('a knot tied below: the long line the first time, a short one every time after', () => {
    const [HW, t] = tangleGame();
    t.ballT = t.sweepT = 9999; t.lashT = 9999;
    allHome(HW);
    const tie = () => {
        sgo(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25);
        hatch(HW, 'heart', 2, 7, 'down');
        sgo(HW, 'uheart', 9, 7); HW.face('down'); knot(HW);
        assert.ok(sthing(HW, 'tbS').knotted, 'tied');
    };
    tie();
    const first = toasts(HW).find(s => /tie it off/i.test(s));
    assert.ok(first, 'the first time: ' + toasts(HW).join(' | '));
    HW.press('act', 1); HW.step(5);                 /* (undone) */
    assert.ok(!sthing(HW, 'tbS').knotted);
    HW.global('UI').toasts.length = 0; HW.G.pendingToast = null;
    hatch(HW, 'uheart', 2, 7, 'down');
    allHome(HW);
    tie();
    const again = toasts(HW).find(s => /tied/i.test(s));
    assert.ok(again && again.length < first.length, 'again, a short line: ' + toasts(HW).join(' | '));
    noErrors(HW);
});

/* ================= the Weaver (the Loom's Web) ================= */
const WR = [20, 0], wat = (x, y) => [WR[0] + x, WR[1] + y];
function webGame(god = true) {
    const HW = loadGame();
    HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2');
    for (const t of ['shears', 'hook', 'bell']) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 24;
    HW.G.cheats.god = god;
    HW.warp('loom', ...wat(9, 9)); HW.step(30); HW.skipTalk(); HW.step(5); HW.skipTalk();
    return [HW, HW.G.map.ents.find(e => e.kind === 'weaver')];
}
const wgo = (HW, x, y) => { const p = HW.player(); for (let k = 0; k < 40 && (p.tx !== wat(x, y)[0] || p.ty !== wat(x, y)[1]); k++) { if (p.pinned === 'silk') { p.pinned = null; } HW.walkTo(...wat(x, y), 30); } assert.deepEqual([p.tx, p.ty], wat(x, y), `walk to ${x},${y}`); };
/* the glints the Shears show in a frame (each where a snip in reach would cut now) */
function glints(HW) {
    const S = HW.global('Shears'), g0 = S.glint, out = [];
    S.glint = function (x, y, strong) { out.push([x, y, !!strong]); return g0.call(this, x, y, strong); };
    try { HW.global('Game').render(); } finally { S.glint = g0; }
    return out;
}
const spot = (w, p, id) => w.cutSpots(p).find(s => s.thing && s.thing.id === id);

test("the Shears in hand at the Weaver: what's in a snip's reach and would cut now glints (the strand up into the loom, from the well's rim at its head; the plain post; the long one only while it's pulled tight; the cocoon only once it's woken); nothing glints with another tool in hand", () => {
    const [HW, w] = webGame();
    w.spit = () => { };                         /* (it rears back and swings, but nothing comes) */
    w.warpT = 99999;
    const p = HW.player();
    HW.Inv.equipped = 'shears';
    /* the strand into the loom: from the rim beside the well's head, whichever way she faces */
    wgo(HW, 8, 3); HW.face('down'); HW.step(2);
    assert.ok(spot(w, p, 'anB'), 'the strand up into the loom, in reach from the rim at the well\'s head');
    assert.ok(glints(HW).length > 0, 'and it glints');
    HW.Inv.equipped = 'bell';
    assert.equal(glints(HW).length, 0, 'nothing glints with the Bell in hand');
    HW.Inv.equipped = 'shears';
    HW.face('right'); HW.step(2);
    assert.ok(glints(HW).some(g => g[2]), 'faced, it glints brighter');
    HW.face('right'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.G.map.find('anB').cut, 'and it cuts there');
    wgo(HW, 8, 7); HW.step(2);
    assert.ok(!w.cutSpots(p).some(s => s.thing && s.thing.way === 'loom'), 'cut: nothing of it left to glint');
    /* the plain one, at its post */
    wgo(HW, 4, 7); HW.step(2);
    assert.ok(spot(w, p, 'anC'), 'the plain post');
    /* the cocoon: asleep, nothing to find; woken by a ring in reach, its knot */
    wgo(HW, 4, 4); HW.step(2);
    assert.ok(!spot(w, p, 'anA'), 'the cocoon, asleep: nothing');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10); HW.Inv.equipped = 'shears'; HW.step(2);
    assert.ok(spot(w, p, 'anA'), 'woken: its knot');
    /* the long one: slack, nothing; pulled tight as the Weaver rears back away from her, it glints */
    wgo(HW, 15, 7); HW.step(2);
    const D = HW.G.map.find('anD');
    until(HW, () => !D.taut(w), 300);
    assert.ok(!spot(w, p, 'anD'), 'slack: nothing');
    assert.ok(until(HW, () => D.taut(w), 300), 'pulled tight');
    assert.ok(spot(w, p, 'anD'), 'tight: it glints');
    noErrors(HW);
});

test('bound in the Weaver\'s silk, the tool button cuts her free whatever tool is in hand (said once); and a warp thread plucked while she\'s bound never lands on her', () => {
    const [HW, w] = webGame(false);
    w.spit = () => { }; w.warpT = 99999;
    const p = HW.player(), heard = sounds(HW);
    wgo(HW, 3, 8);
    const bind = () => { p.pinned = 'silk'; w.bindT = 150; };
    for (const tool of ['bell', 'hook']) {
        bind(); HW.Inv.equipped = tool; HW.step(3);
        heard.length = 0;
        HW.press('tool', 1); HW.step(2);
        assert.equal(p.pinned, null, 'cut free with the ' + tool + ' in hand');
        assert.ok(heard.includes('snip') && !heard.includes('bell'), 'snipped, not rung: ' + heard.join());
    }
    assert.equal(toasts(HW).filter(s => /Shears/.test(s) && /silk/.test(s)).length, 1, 'said once: ' + toasts(HW).join(' | '));
    /* a warp thread plucked down her column, and she's bound before it snaps: it doesn't land on her, bound or just cut free */
    for (const freeAt of [-1, 4]) {
        HW.Inv.equipped = 'bell'; HW.step(80);
        w.warpT = 1; w.puff = 0;
        assert.ok(until(HW, () => HW.G.map.ents.some(e => e.kind === 'hazard' && e.owner === w), 10), 'a column lit');
        const h = HW.G.map.ents.find(e => e.kind === 'hazard' && e.owner === w);
        assert.ok(h.covers(p.x, p.y), 'hers');
        w.warpT = 99999;
        HW.step(8); bind();
        const hp = HW.Inv.hp;
        if (freeAt >= 0) { until(HW, () => h.t >= h.tell - freeAt, 60); HW.press('tool', 1); assert.equal(p.pinned, null); }
        assert.ok(until(HW, () => h.removed, 90), 'it snapped');
        assert.equal(HW.Inv.hp, hp, freeAt < 0 ? 'not on her, bound' : 'not on her, cut free a moment before it snapped');
        p.pinned = null;
    }
    noErrors(HW);
});

test("the Weaver's first beat at a person's pace, the Bell in hand: bound, the tool button a third of a second later cuts her free; a lit column stepped out of a quarter second after it lights; no fainting in twenty seconds, and no blow taken while bound", () => {
    const [HW, w] = webGame(false);
    const p = HW.player();
    wgo(HW, 6, 8);
    HW.Inv.equipped = 'bell';
    const hp0 = HW.Inv.hp, hits = [];
    let bound = 0, lit = null, litT = 0, last = HW.Inv.hp, side = 1;
    for (let t = 0; t < 60 * 20 && p.state !== 'faint'; t++) {
        const h = HW.G.map.ents.find(e => e.kind === 'hazard' && e.owner === w && !e.landed && e.covers(p.x, p.y));
        if (h !== lit) { lit = h; litT = 0; } else if (h) litT++;
        bound = p.pinned === 'silk' ? bound + 1 : 0;
        if (bound === 20) { HW.press('tool', 1); continue; }
        if (!bound && lit && litT >= 15) { const x = p.tx - WR[0]; side = x <= 3 ? 1 : x >= 15 ? -1 : side; HW.hold(side > 0 ? 'right' : 'left'); }
        else HW.release();
        HW.step(1);
        if (HW.Inv.hp < last) { hits.push([t, last - HW.Inv.hp, p.pinned === 'silk' || bound ? 'bound' : 'free']); last = HW.Inv.hp; }
    }
    HW.release();
    assert.notEqual(p.state, 'faint', 'still standing: ' + JSON.stringify(hits));
    assert.ok(!hits.some(q => q[2] === 'bound'), 'no blow while bound: ' + JSON.stringify(hits));
    assert.ok(HW.Inv.hp >= hp0 / 2, `hearts left: ${HW.Inv.hp}/${hp0} ` + JSON.stringify(hits));
    noErrors(HW);
});

/* ================= the Great Spool ================= */
const GS = { top: [20, 0], climb: [20, 11], hub: [20, 22], tidy: [0, 33], foot: [20, 33] };
const gs = (r, x, y) => [GS[r][0] + x, GS[r][1] + y];
function spool() { const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; HW.Inv.stitches = []; return HW; }
function inSpool(HW, r, x, y) { HW.warp('greatspool', ...gs(r, x, y)); HW.step(60); HW.skipTalk(); HW.step(5); }
const ggo = (HW, r, x, y) => assert.ok(HW.walkTo(...gs(r, x, y)), `walk to ${r} ${x},${y} (at ${HW.player().tx - GS[r][0]},${HW.player().ty - GS[r][1]})`);
const gloc = (r, e) => [e.tx - GS[r][0], e.ty - GS[r][1]];
/* a person's pace: a beat of looking about between things */
const dither = (HW, n) => HW.step(n);
/* the Airing Cupboard's block into the slot, onto the plate; Wren in the slot's mouth, on the mangle's place */
function blockIn(HW) {
    ggo(HW, 'tidy', 17, 3); HW.push('left', 2); HW.step(5);
    ggo(HW, 'tidy', 14, 2); HW.push('down', 4); HW.step(5);
    assert.deepEqual(gloc('tidy', HW.find('gsTBlock')), [14, 7], 'the block in the slot, on the plate');
    ggo(HW, 'tidy', 14, 6);
}
/* up to the gate and through it to the Knot, as fast as she can go (or as far as it lets her) */
function runThrough(HW) {
    const p = HW.player();
    HW.walkTo(...gs('tidy', 5, 2));
    for (let i = 0; i < 40; i++) { HW.hold('left'); HW.step(1); } HW.release(); HW.step(2);
    return gloc('tidy', p)[0] < 4;
}

test('the Airing Cupboard: the block on the plate and a dash for the gate, at any speed, doesn\'t get through (the mangle has to come home over the block); nor does holding the block there a long while and then dashing', () => {
    const HW = spool(); inSpool(HW, 'tidy', 17, 5);
    const gate = HW.find('gsTGate');
    blockIn(HW);
    assert.ok(!gate.open, 'the block on the plate alone: the gate stays shut');
    assert.ok(!runThrough(HW), 'run for it: shut in her face');
    assert.ok(!HW.Progress.areaFlag('greatspool', 'door:gsTGate') && !HW.Progress.flag('untie:tidy'));
    /* again, holding the block on the plate ten seconds first, then let go and dash */
    ggo(HW, 'tidy', 17, 4); HW.face('right'); HW.press('act', 1); HW.step(40); HW.skipTalk();       /* (the brake: the block home) */
    blockIn(HW);
    HW.face('down'); HW.hold('act'); HW.step(600);
    assert.equal(HW.player().grip, HW.find('gsTBlock'), 'held');
    assert.ok(!gate.open, 'held there ten seconds: still shut');
    HW.release(); HW.step(1);
    assert.ok(!runThrough(HW), 'let go and dash: shut');
    assert.ok(!HW.Progress.flag('untie:tidy'));
    noErrors(HW);
});

test('the Airing Cupboard, the two ways it was made for, at a person\'s pace: the block gripped and the Bell rung with the other hand; or rung from across the room out of the block\'s hearing; either way the mangle comes home over the block and the gate opens', () => {
    for (const way of ['grip', 'far']) {
        const HW = spool(); inSpool(HW, 'tidy', 17, 5);
        const A = HW.find('gsTBlock'), B = HW.find('gsTMangle'), gate = HW.find('gsTGate'), p = HW.player();
        blockIn(HW);
        dither(HW, 30);
        if (way === 'grip') {
            HW.face('down'); HW.hold('act'); HW.step(20);
            assert.equal(p.grip, A, 'gripped');
            dither(HW, 30);
            HW.Inv.equipped = 'bell'; HW.hold(['act', 'tool']); HW.step(2); HW.hold('act'); HW.step(60);
            assert.ok(B.pendingHome, 'the mangle wound in, hanging over its place, Wren on it');
            HW.release(); dither(HW, 30);
            ggo(HW, 'tidy', 14, 5);
        } else {
            ggo(HW, 'tidy', 6, 5);
            dither(HW, 40);
            HW.Inv.equipped = 'bell'; HW.press('tool', 1);
        }
        assert.ok(until(HW, () => gate.open && !B.pendingHome && B.ret.state === 'home', 300), way + ': the gate');
        assert.deepEqual(gloc('tidy', B), [14, 6], 'the mangle home on top of the slot');
        assert.deepEqual(gloc('tidy', A), [14, 7], 'the block under it, on the plate');
        HW.step(600);
        assert.ok(gate.open, 'and it stays open');
        ggo(HW, 'tidy', 2, 2); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5);
        assert.ok(HW.Progress.flag('untie:tidy'), way + ': untied');
        noErrors(HW);
    }
});

test('the Winding Room: the way up is in plain sight from every door in (the drum stands beside it, not in front of it), and straight up from the Foot', () => {
    const HW = spool(); inSpool(HW, 'hub', 9, 9);
    const a = HW.G.map, r = a.roomAt(...gs('hub', 9, 5)), T = 16;
    const drum = a.ents.find(e => e.im && e.im === HW.global('ART').spoolpost);
    assert.ok(drum, 'the drum');
    const im = drum.im, d = [drum.x, drum.y, drum.x + im.width, drum.y + im.height];
    for (const [x, y] of [[9, 0], [9, 1]]) {
        const t = [(r.x + x) * T, (r.y + y) * T, (r.x + x + 1) * T, (r.y + y + 1) * T];
        assert.ok(t[2] <= d[0] || t[0] >= d[2] || t[3] <= d[1] || t[1] >= d[3], `the drum isn't drawn over the way up (${x},${y})`);
    }
    for (let y = 1; y <= 9; y++) assert.ok(!a.kind(...gs('hub', 9, y)).solid && !a.at(...gs('hub', 9, y)), 'a clear way straight up, row ' + y);
    HW.hold('up'); until(HW, () => HW.Cam.room && HW.Cam.room.name === 'The Climb', 400); HW.release();
    assert.equal(HW.Cam.room.name, 'The Climb', 'up from the Foot\'s door, holding Up');
    noErrors(HW);
});

/* the end at the top: every great thread cut, the room as Gran left it; the finale up to Linnet taking one of her hands */
function toClimax() {
    const HW = spool();
    for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) { HW.Progress.set('untie:' + h); HW.Progress.set('great:' + h); }
    HW.Progress.set('spool_all'); HW.Progress.set('spool_met'); HW.Progress.set('gs_s1'); HW.Progress.set('gs_s2');
    HW.warp('greatspool', ...gs('top', 9, 7));
    for (let i = 0; i < 4000 && !HW.G.map.climax; i++) { HW.skipTalk(); HW.step(1); }
    const a = HW.G.map;
    assert.ok(a.climax, 'Linnet has one of her hands');
    const g = a.ents.find(e => e.who === 'gran'), l = a.climax.linnet, s = l.tx < g.tx ? 1 : -1;
    for (let k = 0; k < 5 && !HW.walkTo(g.tx + s, g.ty); k++) HW.step(20);
    HW.face(s > 0 ? 'left' : 'right'); HW.step(2);
    return [HW, a, g];
}
/* how far the hold has got, as it's drawn (the ring of stitches on the floor under the clasped hands) */
function ringDrawn(HW) {
    const S = HW.global('SpoolArt'), r0 = S.holdRing, out = [];
    S.holdRing = function (x, y, k) { out.push(k); return r0.call(this, x, y, k); };
    try { HW.global('Game').render(); } finally { S.holdRing = r0; }
    return out;
}

test("the last hand-hold shows how far it's got (a ring of stitches on the floor under the clasped hands, sewn as it's held); let go early, it unpicks slowly, and taken again goes on from there; she still tries twice in all", () => {
    const [HW, a, g] = toClimax();
    const c = a.climax, p = HW.player();
    let tugs = 0; const sfx = HW.global('Sfx'), play0 = sfx.play; sfx.play = function (n, ...r) { if (n === 'tug') tugs++; return play0.call(this, n, ...r); };
    assert.deepEqual(ringDrawn(HW), [], 'nothing held, nothing drawn');
    HW.hold('act'); HW.step(100);
    assert.equal(p.grip, g, 'her hand');
    const k1 = ringDrawn(HW);
    assert.equal(k1.length, 1, 'the ring drawn');
    assert.ok(k1[0] > 0.4 && k1[0] < 0.9, 'part way: ' + k1[0]);
    const h1 = c.h;
    HW.release(); HW.step(30);
    assert.ok(!p.grip && a.climax === c, 'let go: it waits');
    assert.ok(c.h > h1 * 0.6 && c.h < h1, `unpicking slowly: ${c.h} of ${h1}`);
    assert.ok(ringDrawn(HW)[0] < k1[0], 'drawn unpicking');
    HW.step(1); HW.hold('act');
    const t0 = HW.G.t;
    assert.ok(until(HW, () => !a.climax, 400), 'held again: she lets go of the Spool');
    assert.ok(HW.G.t - t0 < 140, 'sooner than from nothing: ' + (HW.G.t - t0));
    HW.release();
    assert.equal(tugs, 2, 'she tried twice in all');
    for (let i = 0; i < 200 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('unwound'), 'the Unwinding');
    noErrors(HW);
});

test('the last hand-hold with Grip on toggle: a tap and the ring is sewn with Action up; a tap lets go and it unpicks slowly; let go long enough and it is gone', () => {
    const [HW, a, g] = toClimax();
    HW.global('Settings').grip = 'toggle';
    const c = a.climax, p = HW.player();
    HW.press('act', 1); HW.step(60);
    assert.equal(p.grip, g, 'a tap: her hand, Action up');
    assert.ok(c.h > 40 && ringDrawn(HW).length === 1, 'being sewn: ' + c.h);
    HW.press('act', 1); HW.step(2);
    assert.ok(!p.grip && c.h > 30, 'a tap lets go; not all lost: ' + c.h);
    HW.step(600);
    assert.equal(c.h, 0, 'all unpicked in time');
    assert.deepEqual(ringDrawn(HW), [], 'and nothing drawn');
    noErrors(HW);
});

test("the Foot's sign promises a seventh place at the top, an empty peg for the Wanderer's own: there it is on the Spool, in sight of the last scene, and it stays empty", () => {
    const [HW, a, g] = toClimax();
    const sign = a.ents.find(e => e.kind === 'sign' && /empty peg/.test(e.text || ''));
    assert.ok(sign, 'the sign at the Foot still says so');
    const pegs = () => { const S = HW.global('SpoolArt'), p0 = S.peg, out = []; S.peg = function (...q) { out.push(q); return p0.apply(this, q); }; try { HW.global('Game').render(); } finally { S.peg = p0; } return out; };
    let got = pegs();
    assert.equal(got.length, 1, 'the peg, drawn');
    const [px, py] = got[0], cx = HW.Cam.x, cy = HW.Cam.y;
    assert.ok(px >= 0 && px < 320 && py >= 0 && py < 180, 'on screen');
    /* above the heads of the three of them at the Spool, so they don't stand in front of it */
    for (const n of [g, a.climax.linnet]) assert.ok(py + 4 < n.py - cy - 6, 'clear of ' + n.who + "'s head");
    HW.hold('act');
    assert.ok(until(HW, () => !a.climax, 400));
    HW.release(); HW.step(60);
    got = pegs();
    assert.equal(got.length, 1, 'still there as she lets go of the Spool, and empty');
    noErrors(HW);
});
