// Fix round E, part 2 (AI blind solver E, a heuristic evaluation of the first four Houses, not a playtest; and an outside
// tester's runs): the Hall of Busts and the Gallery can't be dashed (each room's own idea is the way through, and it
// passes at a person's pace); the Parlour's far gate shows how long it's open for; the Drying Racks no longer strand you
// west of the Furnace Hall's pit; the Glazer asks one thing; Old Grindle's last round says its rule, and every boss's beat
// has a nudge (the opt-in hints run in boss rooms); Tollgrim's gravel reads; the Paddle's words name the button, Options
// says hints ask first, the Journal keeps Gran's tune, and the Ballroom's chest is announced.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const toasts = HW => HW.global('UI').toasts.map(t => t.s).concat(HW.G.pendingToast ? [HW.G.pendingToast.s || HW.G.pendingToast] : []);
function sounds(HW) { const S = HW.global('Sfx'), play0 = S.play, out = []; S.play = function (n, ...r) { out.push(n); return play0.call(this, n, ...r); }; return out; }

/* the fewest frames any dash could take from where Wren stands to touching a tile: every route her feet's box fits along,
   in her eight ways, at her top speed (a step of a frame is at most 1.3 px in the octile measure, so no input does better;
   tiles the box would touch the doorway's walls on count as reached, which only makes it kinder to the dash) */
function fastest(HW, [gx, gy]) {
    const p = HW.player(), a = HW.G.map, T = 16, r = a.roomAt(p.tx, p.ty);
    const x0 = r.x * T, y0 = r.y * T, w = r.w * T, h = r.h * T;
    const hit = (x, y) => gx * T < x + 5 && (gx + 1) * T > x - 5 && gy * T < y + 4 && (gy + 1) * T > y - 4;
    const dist = new Float64Array(w * h).fill(Infinity), idx = (x, y) => (y - y0) * w + (x - x0);
    const H = [], push = (d, x, y) => { H.push([d, x, y]); let i = H.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (H[j][0] <= H[i][0]) break; [H[i], H[j]] = [H[j], H[i]]; i = j; } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; for (let i = 0; ;) { const l = 2 * i + 1, m0 = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (m0 < H.length && H[m0][0] < H[m][0]) m = m0; if (m === i) break; [H[i], H[m]] = [H[m], H[i]]; i = m; } } return top; };
    const sx = Math.round(p.x), sy = Math.round(p.y);
    dist[idx(sx, sy)] = 0; push(0, sx, sy);
    while (H.length) {
        const [d, x, y] = pop();
        if (d > dist[idx(x, y)]) continue;
        if (hit(x, y)) return d / 1.3;
        for (const [dx, dy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < x0 || ny < y0 || nx >= x0 + w || ny >= y0 + h || (!p.boxFree(nx, ny) && !hit(nx, ny))) continue;
            if (d + c < dist[idx(nx, ny)]) { dist[idx(nx, ny)] = d + c; push(d + c, nx, ny); }
        }
    }
    return Infinity;
}
/* push the thing in front of her one tile, and say when it started to move (the moment its plate feels it) */
function shove(HW, dir) {
    const p = HW.player(), f = () => { const t = p.front(); return HW.G.map.at(t.tx, t.ty); };
    HW.hold(dir);
    let o = null;
    assert.ok(until(HW, () => { const q = f(); if (q && q.mv) o = q; return !!o; }, 90), 'something pushed');
    HW.release();
    return o;
}
/* how long a gate stays open, from now, standing still */
const openFor = (HW, gate, max = 600) => { let n = 0; for (let i = 0; i < max; i++) { HW.step(1); if (gate.open) n = i + 1; } return n; };

/* ======================= the Tidyhouse ======================= */
const TR = { foyer: [20, 33], gallery: [40, 33], hall: [20, 22], parlor: [40, 22], ball: [20, 11], linen: [40, 11], ante: [40, 0] };
const tat = (room, x, y) => [TR[room][0] + x, TR[room][1] + y];
const tgo = (HW, room, x, y) => assert.ok(HW.walkTo(...tat(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const tloc = (o, room) => [o.tx - TR[room][0], o.ty - TR[room][1]];
function tidy() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'tidy', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1; HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}

test('the Hall of Busts: the bust, or the block, pushed onto the plate and a dash for the north door: no dash at any speed gets there before it shuts', () => {
    for (const what of ['bust', 'block']) {
        const HW = tidy();
        HW.Progress.setAreaFlag('tidy', 'door:fN');
        const gate = HW.find('hN');
        if (what === 'bust') { HW.warp('tidy', ...tat('hall', 9, 4)); tgo(HW, 'hall', 9, 5); shove(HW, 'down'); }
        else {
            HW.warp('tidy', ...tat('hall', 8, 4)); HW.push('down', 2);
            tgo(HW, 'hall', 7, 7); shove(HW, 'right');
        }
        const need = fastest(HW, tat('hall', 3, 0)), open = openFor(HW, HW.find('hN'));
        assert.ok(open > 100, `${what}: the door opens a while (${open} frames)`);
        assert.ok(need > open + 60, `${what}: the fastest dash takes ${need.toFixed(0)} frames; the door is open ${open}`);
        assert.equal(HW.find('hN').open, false);
        noErrors(HW);
    }
});

test("the Hall of Busts: the bust pushed up its lane and the block put in its way home, at a person's pace: the bust brings it home onto the plate and holds it there for good", () => {
    const HW = tidy();
    HW.Progress.setAreaFlag('tidy', 'door:fN');
    HW.warp('tidy', ...tat('hall', 9, 9)); HW.step(5);
    tgo(HW, 'hall', 9, 7);
    HW.push('up', 2);
    const bust = HW.find('hallBust'), block = HW.find('hallBlock');
    assert.deepEqual(tloc(bust, 'hall'), [9, 4], 'up against the wall');
    /* (its way home runs right past the block) */
    assert.ok(bust.ret.trace.some(([x, y]) => Math.abs(x - block.tx) + Math.abs(y - block.ty) === 1), 'its thread beside the block');
    HW.step(30);                                     /* a look round */
    tgo(HW, 'hall', 7, 5); HW.step(30);              /* and a breath */
    HW.push('right', 1);
    tgo(HW, 'hall', 6, 7);
    HW.step(1500);
    assert.deepEqual(tloc(block, 'hall'), [9, 7], 'the block on the plate');
    assert.ok(HW.Return.isHome(bust), 'the bust home, in its way');
    assert.ok(HW.find('hN').open, 'the north door open, and still open');
    tgo(HW, 'hall', 3, 1); HW.step(5); tgo(HW, 'ball', 3, 9);
    noErrors(HW);
});

test('the Hall of Busts and the Gallery: each has a sign that says how its busts behave, never what to do', () => {
    const HW = tidy();
    const signs = HW.G.map.ents.filter(e => e.kind === 'sign'), room = e => HW.G.map.roomAt(e.tx, e.ty).name;
    const hall = signs.find(e => room(e) === 'Hall of Busts'), gal = signs.find(e => room(e) === 'Gallery');
    assert.ok(hall && /go home/.test(hall.text) && /lighter/.test(hall.text), 'the hall: they go home, and move lighter things: ' + (hall && hall.text));
    assert.ok(gal && /place/.test(gal.text) && /nothing gets past/.test(gal.text), 'the gallery: a bust in its place lets nothing past: ' + (gal && gal.text));
    for (const s of [hall, gal]) assert.ok(!/plate|block|push|door|gate|closet/i.test(s.text), 'no step: ' + s.text);
});

test("the Gallery: the bust pushed onto the far plate lifts its own (iron: nothing lighter sinks it), so the closet never opens, whatever the speed, whatever stands in the bust's place", () => {
    const HW = tidy();
    HW.warp('tidy', ...tat('gallery', 9, 7)); HW.step(5);
    const bust = HW.find('galBust'), block = HW.find('galBlock'), gate = HW.find('gG'), a = HW.G.map;
    let opened = false; const watch = n => { for (let i = 0; i < n; i++) { HW.step(1); if (gate.open) opened = true; } };
    /* (the block out of the bust's way, put down south of its place as if pushed there: it waits a long while) */
    a.unplace(block, block.tx, block.ty); [block.tx, block.ty] = tat('gallery', 9, 6); block.x = block.tx * 16; block.y = block.ty * 16; a.place(block, block.tx, block.ty);
    block.ret.trace = [[block.ret.mx, block.ret.my], tat('gallery', 8, 6), [block.tx, block.ty]]; block.ret.state = 'away'; block.ret.timer = 99999;
    tgo(HW, 'gallery', 8, 5); shove(HW, 'right'); watch(24);
    assert.deepEqual(tloc(bust, 'gallery'), [10, 5], 'the bust on the far plate');
    assert.ok(!gate.open, 'Wren in its place: shut (she is too light for its plate)');
    /* and the block pushed up into its place behind it */
    tgo(HW, 'gallery', 8, 6); tgo(HW, 'gallery', 9, 7); shove(HW, 'up'); watch(30);
    assert.deepEqual(tloc(block, 'gallery'), [9, 5], 'the block in the bust\'s place');
    watch(400);
    assert.equal(opened, false, 'the closet never opened');
    noErrors(HW);
});

test("the Gallery: the bust on the far plate, Wren waiting right at the closet: the bust going home never sinks both plates at once (its own is a stiff one), so the closet never opens for her", () => {
    const HW = tidy();
    HW.warp('tidy', ...tat('gallery', 9, 7)); HW.step(5);
    const bust = HW.find('galBust'), block = HW.find('galBlock'), gate = HW.find('gG'), a = HW.G.map;
    a.unplace(block, block.tx, block.ty); a.remove(block);            /* (the block out of the way altogether) */
    tgo(HW, 'gallery', 8, 5); shove(HW, 'right'); HW.step(24);
    /* (straight over to the closet door: the quickest dash there is is well within the bust's patience) */
    const need = fastest(HW, tat('gallery', 16, 5));
    assert.ok(need < 120, 'a dash gets there in time: ' + need.toFixed(0));
    const p = HW.player(); [p.x, p.y] = [tat('gallery', 16, 5)[0] * 16 + 8, tat('gallery', 16, 5)[1] * 16 + 10]; HW.face('up');
    assert.ok(bust.ret.state === 'away' && bust.ret.timer > 30, 'the bust still waiting on the far plate');
    let opened = false;
    HW.hold('up');
    for (let i = 0; i < 400; i++) { HW.step(1); if (gate.open) opened = true; }
    HW.release();
    assert.ok(HW.Return.isHome(bust), 'the bust went home');
    assert.equal(opened, false, 'never open');
    assert.ok(HW.player().ty > gate.ty, 'still outside');
    noErrors(HW);
});

test("the Gallery: the bust up its alcove, the block through its place onto the far plate, at a person's pace: the bust comes home behind it, and the closet stays open", () => {
    const HW = tidy();
    HW.warp('tidy', ...tat('gallery', 9, 7)); HW.step(5);
    const bust = HW.find('galBust'), block = HW.find('galBlock'), gate = HW.find('gG');
    tgo(HW, 'gallery', 9, 6); HW.push('up', 1);
    HW.step(20);
    tgo(HW, 'gallery', 8, 6); tgo(HW, 'gallery', 7, 5); HW.step(20);
    HW.hold('right'); until(HW, () => block.tx === tat('gallery', 10, 5)[0] && !block.mv, 200); HW.release();
    tgo(HW, 'gallery', 9, 8);
    HW.step(1500);
    assert.ok(HW.Return.isHome(bust), 'the bust home');
    assert.deepEqual(tloc(block, 'gallery'), [10, 5], 'the block on the far plate, its way home shut');
    assert.ok(gate.open, 'the closet open');
    tgo(HW, 'gallery', 16, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('tidy'), 'the plan');
    noErrors(HW);
});

test("the Gallery: in the far plate's nook when the bust comes home, Wren isn't shut in: she hops down off its step (and nothing else goes that way)", () => {
    const HW = tidy();
    HW.warp('tidy', ...tat('gallery', 9, 7)); HW.step(5);
    const bust = HW.find('galBust'), a = HW.G.map;
    tgo(HW, 'gallery', 9, 6); HW.push('up', 2);
    tgo(HW, 'gallery', 9, 5); tgo(HW, 'gallery', 10, 5);
    assert.ok(until(HW, () => HW.Return.isHome(bust) && !bust.mv, 400), 'the bust home, behind her');
    HW.step(3);
    assert.ok(HW.find('gG').open, 'standing on the far plate with the bust at home, the closet opens: she can see what it wants');
    HW.hold('down'); HW.step(40); HW.release(); HW.step(10);
    assert.ok(HW.player().ty > tat('gallery', 0, 6)[1], 'down off the step');
    assert.ok(!HW.find('gG').open, 'and it shuts');
    assert.ok(HW.walkTo(...tat('gallery', 1, 5)), 'and away');
    /* (a thing can't go off the step: the nook is reached only through the bust's place) */
    assert.equal(a.freeForThing(...tat('gallery', 10, 6), HW.find('galBlock')), false);
    noErrors(HW);
});

test("the Parlour's far gate runs down with its plate, and shows it: a ring of stitches round the gate and round the plate, unpicking as the time goes; passed, it stays open with no ring", () => {
    const HW = tidy();
    HW.Inv.keyCount.tidy = 1;
    HW.warp('tidy', ...tat('parlor', 1, 9)); HW.step(5);
    const gate = HW.find('pN'), plate = HW.G.map.ents.find(e => e.kind === 'plate' && e.sig === 'pp');
    /* standing on the plate: its time runs down all the same */
    tgo(HW, 'parlor', 4, 8); tgo(HW, 'parlor', 4, 7); HW.step(2);
    const k0 = plate.sigLeft(); HW.step(60); const k1 = plate.sigLeft();
    assert.ok(k0 > 0.9 && k1 < k0 && k1 > 0, `the plate runs down under her: ${k0.toFixed(2)} then ${k1.toFixed(2)}`);
    assert.ok(gate.open && gate.timerLeft() > 0 && gate.timerLeft() < 1, 'the gate open, its time showing');
    /* drawn: rings at the plate and at the gate */
    const T = HW.global('Threads'), r0 = T.ring, rings = [];
    T.ring = function (x, y, k) { rings.push([x + HW.Cam.x, y + HW.Cam.y, k]); return r0.apply(this, arguments); };
    try { HW.global('Game').render(); } finally { T.ring = r0; }
    const near = (tx, ty) => rings.find(([x, y]) => Math.abs(x - (tx * 16 + 8)) < 2 && Math.abs(y - (ty * 16 + 8)) < 2);
    assert.ok(near(...tat('parlor', 16, 0)), 'a ring round the gate');
    assert.ok(near(...tat('parlor', 4, 7)), 'and round the plate');
    assert.ok(until(HW, () => !gate.open, 300), 'and it shuts while she still stands on the plate');
    /* the way through: the block home over the plate, Wren at the gate, through it: latched, no ring */
    tgo(HW, 'parlor', 1, 7); HW.push('right', 6); tgo(HW, 'parlor', 7, 8); tgo(HW, 'parlor', 16, 1);
    assert.ok(until(HW, () => gate.open, 400), 'the block home over the plate');
    assert.ok(gate.timerLeft() > 0, 'its time showing');
    HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    assert.ok(gate.openedOnce && gate.timerLeft() === null, 'passed: open for good, nothing running down');
    noErrors(HW);
});

test("the Parlour's far gate sits under the HUD's top corner: on screen, that corner steps back for it", () => {
    const HW = tidy();
    HW.Inv.keyCount.tidy = 1;
    HW.warp('tidy', ...tat('parlor', 2, 9)); HW.step(5);
    const UI = HW.global('UI');
    assert.equal(HW.Cam.room.name, 'Parlour');
    HW.global('Game').render();                  /* (what's on screen) */
    UI._hc = undefined;
    assert.ok(UI.hudCovers() && UI._hcSide[1], 'the right-hand corner steps back');
});

/* ======================= the Kiln ======================= */
const KR = { furnace: [20, 11], charm: [20, 22], racks: [0, 11], glazer: [40, 11] };
const kat = (room, x, y) => [KR[room][0] + x, KR[room][1] + y];
function kiln(tools = []) {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5);
    for (const t of tools) HW.give(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    return HW;
}

test("the Drying Racks, done: back through the Furnace Hall's west door, a step down through the floor's edge into the Charm Hall below, and so back east; it only goes down", () => {
    const HW = kiln(['hook']);
    HW.Progress.setAreaFlag('kiln', 'door:hN'); HW.Progress.setAreaFlag('kiln', 'door:fW');
    HW.warp('kiln', ...kat('racks', 17, 5)); HW.step(30); HW.skipTalk();
    assert.ok(HW.walkTo(...kat('furnace', 2, 9)), 'through the west door, at the foot of the west strip');
    const hp = HW.Inv.hp;
    HW.hold('down'); HW.step(60); HW.release(); HW.step(40);
    const p = HW.player(), a = HW.G.map;
    assert.equal(a.roomAt(p.tx, p.ty).name, 'Charm Hall', 'down in the Charm Hall');
    assert.equal(HW.Inv.hp, hp, 'a hop, not a fall');
    assert.ok(HW.walkTo(...kat('furnace', 12, 5)), 'and round, up through its north gate, into the Furnace Hall east of the pit');
    /* and from below it's a wall */
    assert.ok(HW.walkTo(...kat('charm', 2, 1)));
    HW.hold('up'); HW.step(60); HW.release(); HW.step(5);
    assert.equal(a.roomAt(HW.player().tx, HW.player().ty).name, 'Charm Hall', 'no way up');
    for (const y of [10]) assert.equal(a.freeForThing(...kat('furnace', 2, y), a.ents.find(e => e.kind === 'pot')), false, 'and nothing goes through it');
    noErrors(HW);
});

function glazerGame() {
    const HW = kiln();
    HW.warp('kiln', ...kat('glazer', 16, 9)); HW.step(60); HW.skipTalk();
    const g = HW.ents('enemy').find(e => e.type === 'glazer');
    assert.ok(g && g.state !== 'sleep', 'awake');
    return [HW, g];
}
test('the Glazer: stood still in front of it, its shot comes home into its shield and it never cracks (a line says so, once); Wren takes the shot', () => {
    const [HW, g] = glazerGame();
    HW.walkTo(...kat('glazer', 9, 7));
    /* (whatever it began while she walked over, it finishes; then it lines up with her where she stands) */
    assert.ok(until(HW, () => g.state === 'walk', 600));
    assert.ok(until(HW, () => g.state === 'aim', 600));
    const hp0 = g.hp;
    let hurt = 0;
    for (let n = 0; n < 1500 && g.alive; n++) { const hp = HW.Inv.hp; HW.step(1); if (HW.Inv.hp < hp) hurt++; if (HW.Inv.hp < 10) HW.Inv.hp = 40; if (HW.Dialog.active) HW.skipTalk(); }
    assert.ok(g.alive && g.hp === hp0, 'not a crack');
    assert.ok(HW.global('Stats').c['boss:glazer:shield'] >= 3, 'its pieces off its shield, again and again');
    assert.ok(hurt >= 3, 'and its shot hit her');
    assert.ok(HW.Progress.flag('glazer_shield'), 'the line, once');
    noErrors(HW);
});
test("the Glazer: a step off its line once it's thrown and it turns its shield to her, side on to its own shot coming home: two of those and it crumbles", () => {
    const [HW, g] = glazerGame();
    HW.walkTo(...kat('glazer', 9, 7));
    let mode = 'line', t = 0, side = 'right';
    for (let n = 0; n < 5000 && g.alive; n++) {
        const p = HW.player();
        if (HW.Dialog.active) { HW.skipTalk(); continue; }
        if (g.state === 'aim' && mode === 'line') mode = 'wait';
        if (g.state === 'hold' && g.shotOut && mode === 'wait') { mode = 'step'; t = 0; side = p.x < g.x ? 'left' : 'right'; }
        if (mode === 'step') { HW.hold(g.shotDir === 0 || g.shotDir === 3 ? side : 'down'); HW.step(1); if (++t >= 14) { HW.release(); mode = 'after'; } continue; }
        if (mode === 'after') { HW.release(); HW.step(1); if (g.state !== 'hold') mode = 'line'; continue; }
        if (mode === 'wait') { HW.release(); HW.step(1); continue; }
        /* (lined up a few tiles below it) */
        const dx = g.x - p.x, dy = g.y + 56 - p.y, keys = [];
        if (Math.abs(dx) > 3) keys.push(dx < 0 ? 'left' : 'right'); if (Math.abs(dy) > 3) keys.push(dy < 0 ? 'up' : 'down');
        HW.hold(keys); HW.step(1);
        if (HW.Inv.hp < 10) HW.Inv.hp = 40;
    }
    HW.release(); HW.step(80); HW.skipTalk();
    assert.ok(!g.alive && HW.Progress.flag('kiln_glazer'), 'crumbled');
    assert.ok(!(HW.global('Stats').c['boss:glazer:shield'] > 0), 'never once met head on');
    noErrors(HW);
});

/* ======================= the Millrace: Old Grindle ======================= */
const MR = { pond: [20, 0] };
const mat = (room, x, y) => [MR[room][0] + x, MR[room][1] + y];
function pond() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'millrace', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle']) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    HW.Inv.patterns.push('mill');
    HW.step(5);
    HW.warp('millrace', ...mat('pond', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    return HW;
}
test("Old Grindle's last round says its rule before it's needed: only something in little pieces gets between its clamped teeth (and the first clang says so again)", () => {
    const HW = pond(), g = HW.G.map.find('grindle');
    assert.ok(g && g.state === 'home');
    const said = [];
    const D = HW.global('Dialog'), open0 = D.open;
    D.open = function (who, text, opts) { said.push(String(text)); return open0.apply(this, arguments); };
    g.hp = 1; g.phase = 2; g.turn(); HW.skipTalk(); HW.step(5); HW.skipTalk();
    D.open = open0;
    assert.equal(g.state, 'shut');
    const line = said.join(' ');
    assert.ok(/teeth/.test(line) && /chip/.test(line), 'nothing bigger than a chip between its teeth: ' + line.slice(0, 300));
    HW.Inv.equipped = null;
    g.struck({ isGrid: true, weight: 1 }, 1, -1, false); HW.step(2);
    assert.ok(toasts(HW).some(s => /Nothing whole gets between those teeth/.test(s)), toasts(HW).join(' | '));
    assert.equal(g.hp, 1, 'the clang, no harm');
    noErrors(HW);
});

test('every beat of every boss in the first seven Houses that needs an idea has a nudge, saying how things behave', () => {
    const HW = loadGame(), N = HW.global('BOSS_NUDGES');
    const want = { monger: [1], housekeeper: [1, 2, 3], glazer: [1], kilnwyrm: [1, 2, 3], snapjaw: [1], grindle: [1, 2, 3], clangor: [1], tollgrim: [1, 2, 3],
        matron: [1], mothersloth: [1, 2, 3], captain: [1], greatmarionette: [1, 2, 3], cog: [1], tangle: [1, 2, 3] };
    for (const [k, beats] of Object.entries(want)) for (const b of beats) assert.ok(N[k] && typeof N[k][b] === 'string' && N[k][b].length > 40, `${k} beat ${b}`);
});

test("the later Houses' bosses are found in their rooms by the nudges, beat by beat (Mother Sloth, the Great Marionette, the Tangle, and the three in between)", () => {
    const cases = [['afterD4', 'slumber', '1,0', 'mothersloth'], ['afterD4', 'slumber', '1,1', 'matron'], ['afterD5', 'marionette', '1,0', 'greatmarionette'],
        ['afterD5', 'marionette', '1,1', 'captain'], ['afterD6', 'spoolworks', '1,0', 'tangle'], ['afterD6', 'spoolworks', '2,1', 'cog']];
    for (const [preset, area, key, type] of cases) {
        const HW = loadGame();
        HW.preset(preset); HW.step(5);
        const def = HW.AREAS[area], room = def.rooms.find(r => r.key === key);
        HW.warp(area, room.x + 2, room.y + 9); HW.step(2);
        const a = HW.G.map, r = a.rooms.find(q => q.key === key), N = HW.global('BOSS_NUDGES'), Nudges = HW.global('Nudges');
        const e = a.ents.find(q => (q.type || q.kind) === type);
        assert.ok(e, type + ' there');
        e.state = e.state === 'sleep' ? 'awake' : e.state;
        for (const hp of N[type][2] ? [3, 2, 1] : [2]) {
            e.hp = hp;
            const b = Nudges.boss(a, r), beat = N[type][2] ? 4 - hp : 1;
            assert.ok(b && b.say === N[type][beat], `${type} beat ${beat}`);
        }
    }
});

test("hints on and asked: stuck in Old Grindle's last round a good while, the Millrace nudges (once that round), in the boss room", () => {
    const HW = pond(), g = HW.G.map.find('grindle'), S = HW.global('Settings');
    S.hints = true; HW.Progress.set('hintsAsked');
    g.hp = 1; g.phase = 2; g.turn(); HW.skipTalk(); HW.step(5); HW.skipTalk();
    assert.equal(g.state, 'shut');
    const after = HW.global('BOSS_NUDGE_AFTER'), heard = sounds(HW);
    HW.step(after - 600);
    assert.ok(!toasts(HW).some(s => /pieces/.test(s)), 'not yet');
    assert.ok(until(HW, () => toasts(HW).some(s => /Little pieces get in/.test(s)), 900), 'the nudge: ' + toasts(HW).join(' | '));
    assert.ok(heard.includes('twang'));
    assert.ok(HW.Progress.areaFlag('millrace', 'nudged:1,0:3'), 'that round, nudged');
    noErrors(HW);
});

test("the first nudge asks first, in a boss room too: stuck in the Grand Hall's first beat with hints on and never asked, the House asks", () => {
    const HW = tidy(), S = HW.global('Settings');
    S.hints = true; HW.G.cheats.god = true;
    HW.Inv.patterns.push('tidy');
    HW.warp('tidy', ...tat('ante', 1, 5));
    HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    assert.ok(k && k.state !== 'sleep', 'the Housekeeper awake');
    const D = HW.global('Dialog');
    assert.ok(until(HW, () => D.active, HW.global('BOSS_NUDGE_AFTER') + 600), 'something said');
    assert.ok(HW.Progress.flag('hintsAsked'), 'it asked');
    HW.skipTalk(0); HW.step(5);
    assert.ok(toasts(HW).some(s => /walks right up to the mess/.test(s)), 'then the nudge for its first beat: ' + toasts(HW).join(' | '));
    noErrors(HW);
});

/* ======================= the Belfry: Tollgrim's gravel ======================= */
test("Tollgrim's gravel reads: each stone inked round and pale, with its shadow on the floor and a streak behind it; his blows' numbers as they were", () => {
    const HW = loadGame();
    HW.preset('afterD3'); HW.step(5);
    const TOLL = HW.global('TOLL');
    assert.equal(JSON.stringify([TOLL.spit, TOLL.spitSp, TOLL.lean, TOLL.peek, TOLL.toll]), JSON.stringify([[0, 75, 70, 70], [0, 1.7, 1.9, 2.0], [0, 30, 20, 20], [0, 330, 600, 600], [0, 0, 220, 190]]), 'the numbers');
    HW.Inv.giveTool('bell');
    HW.warp('belfry', 20 + 9, 9); HW.step(30); HW.skipTalk();
    const t = HW.ents('enemy').find(e => e.type === 'tollgrim');
    assert.ok(t, 'Tollgrim');
    t.spits = [{ x: t.x, y: t.y + 40, vx: 0, vy: 1.7, t: 10 }];
    const G = HW.global('Gfx'), c0 = G.circle, r0 = G.rect, circles = [], rects = [];
    G.circle = function (x, y, r, col) { circles.push([x + HW.Cam.x, y + HW.Cam.y, r, col]); return c0.apply(this, arguments); };
    G.rect = function (x, y, w, h, col) { rects.push([x + HW.Cam.x, y + HW.Cam.y, w, h, col]); return r0.apply(this, arguments); };
    try { t.draw(HW.Cam.x, HW.Cam.y); } finally { G.circle = c0; G.rect = r0; }
    const sx = Math.round(t.x), sy = Math.round(t.y + 40), ink = HW.global('PAL').ink;
    assert.ok(circles.some(([x, y, r, col]) => x === sx && y === sy && r === 3 && col === ink), 'inked round');
    assert.ok(circles.some(([x, y, r, col]) => x === sx && y === sy && r === 2 && col !== ink), 'a pale stone');
    assert.ok(rects.some(([x, y, w, h, col]) => y > sy + 3 && Math.abs(x - sx) <= 3 && col === ink), 'its shadow below it');
    assert.ok(circles.filter(([x, y]) => x === sx && y < sy).length >= 2, 'a streak behind it');
});

/* ======================= words ======================= */
test('the Paddle says which button: hold [tool] (whatever is bound) and steer', () => {
    const HW = loadGame(), ITEMS = HW.global('ITEMS'), fill = HW.global('fillKeys');
    assert.ok(/hold \[tool\]/.test(ITEMS.paddle.desc) && /steer/.test(ITEMS.paddle.desc), ITEMS.paddle.desc);
    assert.ok(!/\[tool\]/.test(fill(ITEMS.paddle.desc)), 'the bound key filled in: ' + fill(ITEMS.paddle.desc));
});

test('Options shows hints as "ask first" until the House has asked (they are offered, not given), then on; off is off', () => {
    const HW = loadGame(), O = HW.global('Options'), S = HW.global('Settings');
    const hints = () => O.rows().find(r => /Hints|nudges/.test(r[0]))[1]();
    S.hints = true;
    assert.equal(hints(), 'ask first', 'on the title screen, a fresh browser');
    HW.newGame('Test', { noAutosave: true, skipIntro: true }); HW.step(2);
    assert.equal(hints(), 'ask first', 'in a new game');
    HW.Progress.set('hintsAsked');
    assert.equal(hints(), 'on', 'asked and answered yes');
    S.hints = false;
    assert.equal(hints(), 'off');
});

test("the Journal keeps Gran's tune from the first morning, the tune only, as heard; an older save has it too", () => {
    const HW = loadGame();
    HW.newGame('Wren', { noAutosave: true });
    HW.step(120); HW.skipTalk();
    const NOTES = HW.global('NOTES');
    assert.ok(HW.Progress.notes.includes('granTune'), 'noted as she hums it');
    const n = NOTES.granTune;
    assert.ok(/low\.\.\. high\.\.\. in between\.\.\. high\.\.\. and low again/.test(n.text), n.text);
    assert.ok(!/stone|Echo|sleep/i.test(n.text), 'nothing about where it comes in');
    /* (an older save, from before: it gets the note on loading) */
    const s = HW.Save.snapshot(); s.progress.notes = s.progress.notes.filter(x => x !== 'granTune');
    const m = HW.Save.migrate(JSON.parse(JSON.stringify(s)));
    assert.ok(m.progress.notes.includes('granTune'));
    assert.equal(HW.Save.migrate(m).progress.notes.filter(x => x === 'granTune').length, 1, 'once');
});

test("the Ballroom tidied: a chime and a line as its big chest appears, not just a chest where there wasn't one", () => {
    const HW = tidy();
    HW.Inv.giveTool('gloves');
    HW.warp('tidy', ...tat('ball', 6, 8)); HW.step(5);
    const heard = sounds(HW);
    for (const b of HW.G.map.ents.filter(e => e.group === 'ball')) { b.tiedOff = false; HW.G.map.unplace(b, b.tx, b.ty); b.tx = b.ret.mx; b.ty = b.ret.my; b.x = b.tx * 16; b.y = b.ty * 16; HW.G.map.place(b, b.tx, b.ty); b.ret.trace = [[b.tx, b.ty]]; b.ret.state = 'home'; }
    HW.step(3);
    assert.ok(HW.Progress.flag('tidy_ballDone'));
    assert.ok(heard.includes('appear'), 'the chime');
    assert.ok(toasts(HW).some(s => /chest/.test(s)), 'said: ' + toasts(HW).join(' | '));
    assert.ok(until(HW, () => !HW.find('pattern').hidden, 30), 'and there it is');
    noErrors(HW);
});
