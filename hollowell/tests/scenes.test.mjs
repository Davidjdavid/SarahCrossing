// Scenes that show what they tell (fix round C, staging): who stands where, faces whom and holds what while a line is
// said, played through the real game code. And the Makings' Ahas, said once and then tallied.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const npcs = (HW, who) => HW.G.map.ents.filter(e => e.kind === 'npc' && e.who === who && !e.removed);
/* talk through whatever's said, calling back once each line is shown in full (picking the first choice when asked);
   onFrame, if given, every frame between */
function lines(HW, onLine, max = 40000, onFrame = null) {
    const D = HW.Dialog; let last = '';
    for (let n = 0; n < max && (D.active || HW.Script.blocking()); n++) {
        if (onFrame) onFrame();
        if (D.active && D.shown >= D.pageLen()) {
            const k = D.page + '|' + (D.pages[D.page] || []).join(' ');
            if (k !== last) { last = k; onLine((D.pages[D.page] || []).join(' ')); }
            if (D.choices && D.page === D.pages.length - 1) D.sel = 0;
            HW.press('act', 1);
        } else HW.step(1);
    }
}
/* the tile someone stands on, as drawn: is anyone drawn on top of Wren's head (straight below her, one or two rows)? */
const under = (HW, p) => HW.G.map.ents.filter(e => e.kind === 'npc' && !e.removed && !e.hidden && e.tx === p.tx && (e.ty === p.ty + 1 || e.ty === p.ty + 2)).map(e => e.who);
const faces = (n, p) => n.dir === HW_dirOf(p.tx - n.tx, p.ty - n.ty);
let HW_dirOf = null;

test('the ceremony: nobody stands in front of Wren all scene; Bram puts his pot down when he is told to; Miss Quill says the Rules to her face', () => {
    const HW = loadGame(); HW_dirOf = HW.global('dirOf');
    HW.newGame('Wren', { noAutosave: true });
    HW.step(120); HW.skipTalk(); HW.step(30);
    const walk = (x, y) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } assert.ok(r, `walk ${x},${y}`); };
    walk(1, 3); HW.hold('up'); until(HW, () => HW.G.map.id === 'gran_house', 120); HW.release(); HW.step(40);
    walk(8, 4); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    walk(6, 7); HW.hold('down'); until(HW, () => HW.G.map.id === 'hollow', 120); HW.release();
    const seen = {};
    lines(HW, t => {
        const p = HW.player(), a = HW.G.map;
        assert.equal(under(HW, p).join(), '', 'nobody drawn over Wren: ' + t);
        const bram = a.ents.find(e => e.kind === 'npc' && e.who === 'bram' && e.tx === 98 && e.ty === 61), pot = a.ents.find(e => e.kind === 'prop' && e.tx === 98 && e.ty === 62);
        if (/put the pot down/.test(t)) seen.pot = bram && bram.holding === 'bram_pot' && !pot;
        if (/Every year the Hollow/.test(t)) seen.down = bram && !bram.holding && !!pot;
        if (/^One: everything has its place/.test(t)) { const q = a.ents.find(e => e.kind === 'npc' && e.who === 'quill' && e.ty === 61); seen.quill = q && faces(q, p) && faces(p, q); }
    });
    assert.ok(seen.pot, 'a pot in his hands as she tells him');
    assert.ok(seen.down, 'and at his feet after');
    assert.ok(seen.quill, 'Miss Quill and Wren face each other for the Rules');
    assert.ok(HW.Progress.flag('ceremony') && HW.Inv.has('staff'));
    noErrors(HW);
});

/* ---------------- the Hall of Names, and the morning after ---------------- */
function toLedger(HW) {
    assert.ok(HW.walkTo(57, 8)); HW.hold('down'); HW.step(30); HW.release(); HW.step(40); HW.skipTalk();
    assert.ok(HW.walkTo(9, 7)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.walkTo(37, 4)); HW.face('up'); HW.press('act', 1);
}
test('the Hall of Names: Gran comes down the hall to Wren, Wren turned to her; the thread from Wren to her fingers is there as she takes it; then downstairs, to her empty chair, her cold cup, the cellar door', () => {
    const HW = loadGame(); HW_dirOf = HW.global('dirOf');
    HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    toLedger(HW);
    const R2 = HW.global('Reveal2'), seen = {};
    lines(HW, t => {
        const a = HW.G.map, p = HW.player(), g = a.ents.find(e => e.kind === 'npc' && e.who === 'gran');
        if (/^You shouldn't be down here/.test(t)) seen.turned = g && faces(p, g);
        if (/^She takes your red thread/.test(t)) {
            seen.near = g && Math.abs(g.tx - p.tx) + Math.abs(g.ty - p.ty) <= 3;
            seen.facing = g && faces(g, p) && faces(p, g);
            seen.thread = R2.taking === g && g.spools;
        }
        if (/^Gran's chair is empty/.test(t)) seen.kitchen = a.id === 'gran_house' && a.ents.some(e => e.kind === 'prop' && e.tx === 6 && e.ty === 4 && e.baseY === 20) && a.ents.some(e => e.kind === 'prop' && e.tx === 1 && e.ty === 6);
        if (/^When you look down at your hands/.test(t)) seen.own = R2.ownSeen === true;
    });
    assert.ok(seen.turned, 'Wren turns round to her');
    assert.ok(seen.near, 'Gran close by as she takes the thread');
    assert.ok(seen.facing, 'face to face');
    assert.ok(seen.thread, 'the thread in her fingers, drawn');
    assert.ok(seen.kitchen, 'the kitchen as it is told: the cup on the table, the cellar door');
    assert.ok(seen.own, 'her own thread, plain to see, as she first sees it');
    assert.equal(R2.ownSeen, false);
    assert.ok(HW.Progress.flag('reveal2') && HW.G.map.id === 'gran_house');
    noErrors(HW);
});

/* ---------------- Cog runs down ---------------- */
test("Cog topples clear of Wren (not across the top of her head), and his thread runs off down the cracks while it's told", () => {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 30; HW.G.cheats.god = true; HW.Inv.keyCount.spoolworks = 1;
    const at = (x, y) => [40 + x, 11 + y], uat = (x, y) => [40 + x, 44 + y];
    HW.warp('spoolworks', 20 + 17, 11 + 5); HW.step(30); HW.skipTalk(); HW.step(5);
    assert.ok(HW.walkTo(38, 16)); HW.hold('right'); HW.step(40); HW.release(); HW.step(5);
    HW.walkTo(...at(3, 5)); HW.step(2); HW.skipTalk(); HW.step(5);
    const c = HW.G.map.ents.find(e => e.type === 'cog');
    const hatch = (xy, dir) => { assert.ok(HW.walkTo(...xy)); HW.face(dir); HW.press('act', 1); HW.step(40); };
    const knot = () => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
    c.hp = 1;
    hatch(at(9, 7), 'down'); until(HW, () => c.state === 'sit', 400);
    assert.ok(HW.walkTo(...uat(9, 5))); HW.face('up'); knot(); hatch(uat(9, 7), 'down');
    assert.ok(HW.walkTo(...at(9, 5))); HW.face('up'); HW.press('atk', 1); HW.step(14);
    const p = HW.player(), seen = {};
    lines(HW, t => {
        if (/^Cog runs down/.test(t)) seen.gap = Math.abs(c.x - p.x) >= 12 || c.y > p.y || (p.y - 13) - (c.y + 2) >= 6;
        if (/^All the thread wound in him/.test(t)) seen.runs = !c.alive && (c.runs || []).filter(r => c.yarnT - r.late - 70 < r.len / 0.45).length >= 3;
    });
    assert.ok(seen.gap, 'lying clear of her head');
    assert.ok(seen.runs, 'still running off as the line says so');
    noErrors(HW);
});

/* ---------------- the Weaver climbs the loom ---------------- */
test('the Weaver climbs up its loom to the breast-beam while it is told, and clings there; in the last beat the old warp comes up out of the well after it', () => {
    const HW = loadGame();
    HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2'); HW.Inv.giveTool('shears'); HW.Inv.giveTool('hook');
    HW.Inv.maxHp = HW.Inv.hp = 36; HW.G.cheats.god = true;
    HW.warp('loom', 20 + 9, 9); HW.step(30); HW.skipTalk(); HW.step(5);
    const w = HW.G.map.ents.find(e => e.kind === 'weaver'), well = HW.G.map.ents.find(e => e.kind === 'loomwell');
    const said = [];
    for (const beat of [2, 3]) {
        /* (knocked, in its well, as a fight leaves it: the climb and its lines follow) */
        w.x = w.web[0]; w.y = w.web[1]; w.z = 0; w.flash = 0;
        w.hp = 4 - beat; w.state = 'climb'; w.st = 0; w.beginBeat(beat);
        lines(HW, t => said.push([beat, t, w.x === w.perch[0] && w.y === w.perch[1] && w.z === HW.global('WV').perchZ, well.haul]));
    }
    const on = said.filter(([, t]) => /breast-beam|watches you|won't come down/.test(t));
    assert.ok(on.length >= 3, said.map(s => s[1]).join(' / '));
    for (const [beat, t, perched, haul] of on) {
        assert.ok(perched, `up on the beam as it's said: ${t}`);
        if (beat === 3) assert.equal(haul, 1, 'the warp hauled up after it');
    }
    noErrors(HW);
});

/* ---------------- the Makings ---------------- */
test("the Makings: Tuck's word at the hoop is his own in each Little House (but the first and last); and he and Wren aren't drawn on each other at the start", () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    const M = HW.global('MAKINGS'), done = HW.global('TUCK_DONE');
    const words = M.slice(0, 8).map(m => m.tuck || done);
    assert.equal(new Set(words).size, 7, words.join(' / '));
    assert.equal(words[0], words[7], 'the first and the last the same');
    for (let n = 1; n <= 8; n++) {
        const d = HW.AREAS['making' + n];
        HW.warp('making' + n, d.entry.x, d.entry.y); HW.step(3);
        const tuck = HW.G.map.find('tuck'), p = HW.player();
        if (!tuck) continue;
        /* (the room up top shows through over the one under it: the same tile, eleven rows up) */
        assert.ok(!(tuck.tx === p.tx && tuck.ty === p.ty - 11), `making${n}: not under his start`);
    }
    noErrors(HW);
});

test('the Makings: each kind of Aha is named the first time; after that it is a pip on the tally, not a notice', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    const UI = HW.global('UI'), Making = HW.global('Making'), toasts = [], t0 = UI.toast.bind(UI);
    UI.toast = (s, d) => { toasts.push(s); return t0(s, d); };
    HW.warp('making1', 5, 16); HW.step(5);
    for (const id of ['found', 'cleared', 'unhurt']) Making.aha(id);
    assert.equal(toasts.filter(s => /^Aha!/.test(s)).length, 3, 'named, the first time');
    assert.equal(Making.cur.ahas.size, 3);
    HW.warp('making2', 5, 16); HW.step(5);
    toasts.length = 0;
    for (const id of ['found', 'cleared', 'unhurt']) Making.aha(id);
    assert.equal(toasts.filter(s => /^Aha!/.test(s)).length, 0, 'not again: the tally shows them');
    assert.equal(Making.cur.ahas.size, 3, 'counted all the same');
    Making.drawTally(HW.G.map);
    noErrors(HW);
});

test('somebody fetched over to Wren stands beside her, not straight below her (drawn on her head); Otto on the Making Floor is dressed as the Housekeeper, and his picture too', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Progress.set('making1'); HW.Progress.set('making2'); HW.Progress.set('making3'); HW.Progress.set('making4'); HW.Progress.set('making5');
    HW.warp('underside', 50, 2); HW.step(10); HW.skipTalk();
    const o = npcs(HW, 'otto')[0], p = HW.player();
    assert.ok(o && o.sword && o.paperHat, 'paper hat and duster');
    assert.ok(HW.global('Portraits').look('otto').paperHat, 'in his picture too');
    HW.Script.run(HW.global('Making').fetch(o, p));
    for (let i = 0; i < 900 && HW.Script.blocking(); i++) HW.step(1);
    assert.equal(o.ty, p.ty, 'beside her'); assert.equal(Math.abs(o.tx - p.tx), 1);
    HW.warp('hollow', 95, 66); HW.step(5);
    assert.ok(!HW.global('Portraits').look('otto').paperHat || npcs(HW, 'otto').some(e => e.paperHat), 'his cap again, out of costume');
    noErrors(HW);
});

test("Gundry brings the empty little House in under his arm (in sight as it's told), and leaves it at the last little door", () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
    HW.warp('underside', 56, 2); HW.step(10);
    const Cam = HW.global('Cam'), seen = {};
    HW.Script.run(HW.global('Capstone').handOver());
    lines(HW, t => {
        const g = npcs(HW, 'gundry')[0], r = Cam.room;
        if (/^Through the door from the Guild Hall/.test(t)) seen.carry = g.holding === 'little_house' && g.tx >= r.x && g.tx < r.x + r.w && g.ty >= r.y && g.ty < r.y + r.h;
        if (/^Nobody, yet/.test(t)) seen.still = g.holding === 'little_house';
    });
    const g = npcs(HW, 'gundry')[0];
    assert.ok(seen.carry, 'in sight, carrying it, as he is said to come in');
    assert.ok(seen.still, 'still carrying it while they talk');
    assert.ok(!g.holding, 'left at the door');
    assert.ok(HW.walkTo(58, 2), 'and its step is clear for Wren');
    noErrors(HW);
});

/* ---------------- the end ---------------- */
test('the Pull: everyone dragged faces the same way (back to the Well, their feet not wanting to)', () => {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk();
    HW.walkTo(95, 66, 40000); HW.step(200); HW.skipTalk();
    const dirOf = HW.global('dirOf'), dragged = HW.G.map.ents.filter(e => e.dragged && !e.removed);
    assert.ok(dragged.length >= 8);
    for (const n of dragged) assert.equal(n.dir, dirOf(n.tx - 95, n.ty - 59), n.who);
    noErrors(HW);
});

test('the Unwinding: the birds are still to be seen going when their line is said, and the line names them', () => {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk();
    const Cam = HW.global('Cam'), W = 320, H = 180;
    HW.Script.run(HW.global('Ending').unwinding());
    let seen = null;
    lines(HW, t => {
        if (/fly out over the edge of the valley/.test(t)) {
            const f = HW.G.map.ents.find(e => e.kind === 'flock');
            seen = { t, n: f.birds.filter(b => b.st === 'off' && b.t > 0 && b.x - Cam.x > -10 && b.x - Cam.x < W + 10 && b.y - Cam.y > 0 && b.y - Cam.y < H).length };
        }
    }, 4000);
    assert.ok(seen, 'the line');
    assert.match(seen.t, /^The birds/);
    assert.ok(seen.n >= 3, `birds in flight, on screen: ${seen.n}`);
});

/* ---------------- smaller ones ---------------- */
const inHouse = (area, x, y, tools = []) => {
    const HW = loadGame(); HW_dirOf = HW.global('dirOf');
    HW.newGame('Test', { area, x, y, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    HW.step(5);
    return HW;
};
test("Mother Sloth is drawn asleep, eyes shut, all the while she talks in her sleep, and only then with them open", () => {
    const HW = inHouse('slumber', 29, 42, ['bedroll']);
    HW.warp('slumber', 20 + 9, 9); HW.step(30);
    HW.walkTo(29, 7);
    const s = HW.G.map.ents.find(e => e.type === 'mothersloth'), Gfx = HW.global('Gfx'), spr = HW.global('spr');
    /* (which of her pictures she's drawn with) */
    const drawn = () => {
        const img0 = Gfx.img, ims = [];
        Gfx.img = (im, ...q) => { ims.push(im); return img0.call(Gfx, im, ...q); };
        try { s.draw(0, 0); } finally { Gfx.img = img0; }
        return ims.includes(spr('sloth_sleep')) ? 'asleep' : ims.includes(spr('sloth_awake')) ? 'awake' : 'neither';
    };
    const seen = [];
    lines(HW, () => seen.push(drawn()));
    assert.ok(seen.length >= 3 && seen.every(d => d === 'asleep'), 'eyes shut through every line: ' + seen);
    HW.step(30);
    assert.equal(drawn(), 'awake', 'and open after');
    noErrors(HW);
});
test('Tollgrim: "two yellow eyes" in the bell, drawn all the while that is said; only now and then after', () => {
    const HW = inHouse('belfry', 29, 53);
    HW.Inv.patterns.push('belfry');
    HW.warp('belfry', 40 + 1, 5); HW.step(20); HW.hold('left'); HW.step(50); HW.release(); HW.step(20);
    HW.walkTo(20 + 17, 5);
    const t = HW.G.map.find('tollgrim'), Gfx = HW.global('Gfx');
    /* (over so many frames while a line is up: in how many are his two yellow eyes drawn?) */
    const eyes = frames => {
        const rect0 = Gfx.rect; let k = 0;
        try {
            for (let i = 0; i < frames; i++) {
                let n = 0;
                Gfx.rect = (x, y, w, h, c) => { if (c === '#f7d64a' && w === 2 && h === 2) n++; return rect0.call(Gfx, x, y, w, h, c); };
                t.draw(0, 0); Gfx.rect = rect0;
                if (n === 2) k++;
                HW.step(1);
            }
        } finally { Gfx.rect = rect0; }
        return k;
    };
    const seen = {};
    lines(HW, l => { if (/two yellow eyes/.test(l)) seen.said = eyes(64); else if (/cold draught/.test(l)) seen.after = eyes(64); });
    assert.equal(seen.said, 64, 'his eyes there all the while');
    assert.ok(seen.after > 0 && seen.after < 64, 'and back to now and then after: ' + seen.after + ' of 64');
    noErrors(HW);
});
test("the Tidyhouse: the way out opens before it's said to, where it's said to be: a corner of the Grand Hall, on screen, clear of the box", () => {
    const HW = inHouse('tidy', 29, 42);
    HW.warp('tidy', 20 + 9, 6); HW.step(20); HW.skipTalk();
    HW.Script.run(HW.AREAS.tidy.afterKnot());
    const Cam = HW.global('Cam'), T = 16, W = 320, H = 180;
    let seen = null, said = '';
    lines(HW, l => {
        if (!/^A door opens in/.test(l)) return;
        said = l;
        /* (the hall's own way out: not the Foyer's door home) */
        const a = HW.G.map, hall = a.rooms.find(r => r.key === '1,0'), d = a.ents.find(e => e.kind === 'warp' && e.to === 'hollow' && !e.removed && a.roomAt(e.tx, e.ty) === hall);
        seen = { open: !!d };
        if (!d) return;
        /* (in the hall, by one of its side walls and its top or bottom wall) */
        const sx = Math.min(d.tx - hall.x, hall.x + hall.w - 1 - d.tx), sy = Math.min(d.ty - hall.y, hall.y + hall.h - 1 - d.ty);
        seen.corner = sx >= 0 && sy >= 0 && sx <= 2 && sy <= 2;
        const x = d.tx * T - Cam.x, y = d.ty * T - Cam.y;
        seen.onScreen = x >= 0 && x + T <= W && y >= 0 && y + T <= H;
        seen.clear = !HW.Dialog.rects().some(([x0, y0, x1, y1]) => x < x1 && x + T > x0 && y < y1 && y + T > y0);
    });
    assert.deepEqual(seen, { open: true, corner: true, onScreen: true, clear: true });
    assert.match(said, /^A door opens in the corner of the Grand Hall/);
    noErrors(HW);
});
test("the Snapjaw's door grinds shut behind Wren, once she's wholly in off the doorstep", () => {
    const HW = inHouse('millrace', 29, 42);
    HW.Inv.keyCount.mill = 2;
    HW.warp('millrace', 20 + 17, 22 + 5); HW.step(10);
    const p = HW.player(), door = HW.G.map.ents.find(e => e.kind === 'door' && e.group === 'sj'), PBOX = HW.global('PBOX');
    assert.ok(door && !door.shut, 'the way in open');
    /* (walked in a frame at a time: where her feet are the moment it shuts) */
    HW.hold('right');
    for (let i = 0; i < 240 && !door.shut; i++) HW.step(1);
    HW.release();
    assert.ok(door.shut, 'the door shut');
    assert.ok(door.tx < p.tx, 'behind her');
    assert.ok(p.x - PBOX.hw >= (door.tx + 1) * 16, `her feet wholly off the doorstep (from x ${p.x - PBOX.hw}; the doorstep ends at ${(door.tx + 1) * 16})`);
    assert.ok(until(HW, () => HW.Dialog.active, 120), 'and it woke');
    noErrors(HW);
});
test('the festival: the four who come late stand still and turn to Wren when they speak, even one held up on the way', () => {
    const HW = loadGame(); HW_dirOf = HW.global('dirOf');
    const NPC = HW.global('NPC');
    HW.preset('afterD4'); HW.step(5); HW.skipTalk();
    HW.warp('hollow', 95, 69); HW.step(10); HW.skipTalk();
    HW.walkTo(95, 64);
    until(HW, () => HW.Script.blocking(), 120);
    const late = who => HW.G.map.ents.find(e => e.kind === 'npc' && e.who === who && e.prop && !e.removed);
    let inWay = null;
    const said = {};
    lines(HW, t => {
        const p = HW.player();
        for (const [who, re] of [['tess', /^Sorry! Sorry/], ['ambrose', /^Very busy/], ['bram', /^Pots don't make themselves/], ['ives', /^\.\.\.Tidying/]]) {
            if (!re.test(t)) continue;
            const n = late(who), at = n && [n.x, n.y];
            HW.step(30);           /* (and a moment on, still standing there) */
            said[who] = !!n && !n.walking && !n.path && !n.mv && n.x === at[0] && n.y === at[1] && faces(n, p);
        }
    }, 40000, () => {
        /* (as the town was about in a whole playthrough: somebody standing on the spot Bram's running to) */
        if (!inWay && late('bram')) inWay = HW.G.map.add(new NPC(64 + 29, 40 + 21, { who: 'otto', face: 'down' }));
    });
    assert.ok(inWay, 'somebody in his way');
    assert.deepEqual(said, { tess: true, ambrose: true, bram: true, ives: true });
    noErrors(HW);
});
test('words: no yawn in asterisks; a House is a House', () => {
    const src = fs.readFileSync(path.join(import.meta.dirname, '..', 'dist', 'hollowell.js'), 'utf8');
    assert.ok(!/\*ya+wn\*/.test(src), 'no yawns in asterisks');
    assert.ok(!/'All through the house/.test(src));
});
