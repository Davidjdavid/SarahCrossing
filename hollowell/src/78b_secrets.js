/* Smaller secrets, all over: everyone budged (S01), Biscuit's crawlspace (S03), the tailor's back window (S07), keys
   that tug home (S08), the Bell and the Hookline at the Well (S09, S10), the bosses asleep in their halls (S14),
   Biscuit's collar (S25), the far isle in Millwater lake, only for the Long Hook (S31). */

/* ---------- S01: every townsperson budged off their spot ---------- */
/* everyone who stands anywhere they can be nudged (not those only ever found behind a counter) */
Story.budgeable = function () {
    const seen = {}, free = {};
    const look = ents => { for (const e of ents || []) if (e.k === 'npc' && e.who) { seen[e.who] = 1; if (!e.counter) free[e.who] = 1; } };
    for (const a of Object.values(AREAS)) look(a.ents);
    for (const b of Object.values(OW.blocks)) look(b.ents);
    return Object.keys(BUDGE).filter(w => free[w] || !seen[w]);
};
Story.checkBudgedAll = function () {
    const all = Story.budgeable(), n = all.filter(w => Progress.flag('budged:' + w)).length;
    if (n < all.length || Progress.flag('s01')) return;
    Progress.set('s01'); Stats.count('secret:budged');
    Script.run(function* () {
        yield 20;
        yield* say(null, `That's everyone. All ${all.length} of them, nudged off their spots, and every one of them shuffled straight back.`);
        yield* say(null, 'Somewhere, Old Arlo chuckles. "You\'ve felt everybody\'s thread now, haven\'t you. Ever felt your own?"');
        yield* Story.getItem('ribbon')();
    });
};
ITEMS.ribbon = { name: 'The Frayed Ribbon', kind: 'quest', desc: "A scrap of red ribbon, frayed at one end, as if it had been tied to something once and pulled loose. Arlo's. He says it's yours now." };

/* ---------- S03: Biscuit's crawlspace behind the bakery ---------- */
{
    const cat = OW.blocks['1,1'].ents.find(e => e.who === 'biscuit');
    if (cat) cat.route.splice(4, 0, [41, 27, 260]);
}
SPAWN.crawlspace = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.crawlspace, solid: [[0, 0]], oy: 0 });
    pr.baseY = -40;
    pr.interact = () => {
        Script.run(function* () {
            if (Progress.flag('s03')) { yield* say(null, "Biscuit's crawlspace, under the bakery's back step. Smells of cat and warm bread."); return; }
            const cat = pr.area.ents.find(e => e.kind === 'critter' && e.who === 'biscuit');
            if (!cat || Math.hypot(cat.x - (tx * T + 8), cat.y - (ty * T + 10)) > 28) { yield* say(null, "A gap under the bakery's back step, just cat-sized. Something glints at the very back, well out of reach."); return; }
            Progress.set('s03'); Stats.count('secret:biscuit');
            yield* say(null, "Biscuit looks at you, then at the gap, then slips into it like water. A scuffle; a sneeze; and out comes the cat with something in its mouth, which it drops at your feet as if it's been meaning to for ages.");
            yield* Story.getItem('heartpatch', 'biscuitPatch')();
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
OW.blocks['1,1'].ents.push({ k: 'crawlspace', x: 41, y: 27 });

/* ---------- S07: the tailor's back window, after the Kiln ---------- */
OW.blocks['1,1'].ents.push({ k: 'backwindow', x: 38, y: 4 });
SPAWN.backwindow = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: null, solid: [] });
    pr.interact = () => {
        Script.run(function* () {
            if (!Progress.flag('d2')) { yield* say(null, "The back window of Seam's. The curtains are drawn."); return; }
            if (!Progress.flag('s07')) { Progress.set('s07'); Stats.count('secret:costume'); }
            yield* say(null, Progress.flag('reveal1') ? "Seam's back window. On the dummy now: a felt bat's head, half stitched, for somebody's House. You know what it's for now. You smile anyway." : Progress.flag('d4') ? "Through the gap in Seam's back curtains: Sebastian Seam, a mouthful of pins, stitching glazed scales onto a long padded tube. A head sits on the dummy beside it, with a jaw like a kiln door. He hasn't seen you." : "Through the gap in Seam's back curtains: Sebastian Seam, a mouthful of pins, stitching orange scales onto something very long. A tag on it says FESTIVAL. He hasn't seen you.");
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty && pl.dir === DOWN;
    pr.draw = () => { };
    return pr;
};

/* ---------- S08: a House's key tugs back at its door ---------- */
NOTES.s08 = { title: 'Keys', text: "A small key from a House won't leave it: at the door it tugs back toward the House like a dog on a lead. Everything in the Houses knows where it belongs. Even the keys." };
{
    const leave0 = Story.leaveHouse;
    Story.leaveHouse = function (house) {
        const had = Inv.keys(house) > 0;
        leave0.call(this, house);
        if (had && !Progress.flag('s08')) { Progress.set('s08'); Progress.addNote('s08'); Stats.count('secret:keys'); }
    };
}

/* ---------- S09, S10: the Bell rung, and the Hookline thrown, at the Well ---------- */
const WELL = { x0: 94, y0: 58, x1: 96, y1: 59 };
const nearWell = (p, d) => p.area && p.area.id === 'hollow' && p.tx >= WELL.x0 - d && p.tx <= WELL.x1 + d && p.ty >= WELL.y0 - d && p.ty <= WELL.y1 + d;
{
    const use0 = TOOLS.bell.use;
    TOOLS.bell.use = function (p) {
        const cool = this.cool > 0;
        use0.call(this, p);
        if (cool || !nearWell(p, 3) || Progress.flag('great_pull')) return;
        Script.run(function* () {
            yield 20;
            G.shake = 4; Sfx.play('rumble');
            yield* say(null, "Deep under the Well, something enormous groans, like a great winch taking strain, and then thinks better of it.");
            const gran = p.area.ents.find(e => e.kind === 'npc' && e.who === 'gran');
            if (gran && Math.hypot(gran.tx - p.tx, gran.ty - p.ty) < 12) yield* say('gran', "Don't do that, love.");
            if (!Progress.flag('s09')) { Progress.set('s09'); Stats.count('secret:bellwell'); }
        });
    };
    const check0 = TOOLS.hook.check;
    TOOLS.hook.check = function (h, area, tx, ty) {
        if (area.id === 'hollow' && tx >= WELL.x0 && tx <= WELL.x1 && ty >= WELL.y0 && ty <= WELL.y1 && !Progress.flag('great_pull')) {
            h.state = 'back'; Sfx.play('hookhit'); G.shake = 3;
            Script.run(function* () {
                yield* say(null, "The hook bites on the great iron X on the Well's cap. The cap shifts a finger's width, and through the crack, for a moment: threads. Thousands of them, every colour, all going down.");
                if (!Progress.flag('s10')) { Progress.set('s10'); Stats.count('secret:hookwell'); }
            });
            return true;
        }
        return check0.call(this, h, area, tx, ty);
    };
}

/* ---------- S14: the bosses, rewound, asleep in their halls ---------- */
const BOSS_NAPS = {
    tidy: { flag: 'tidy_boss', name: 'the Grand Housekeeper', col: THREAD.ives, line: "The Grand Housekeeper, wound back together, fast asleep in its corner with its doors shut. You pat its side. Somewhere inside it, a drawer sighs." },
    kiln: { flag: 'kiln_boss', name: 'the Kilnwyrm', col: THREAD.bram, line: "The Kilnwyrm, its segments glued back in a heap, snoring very quietly through its nose. It's warm. You pat it, and it rattles happily." },
    millrace: { flag: 'millrace_boss', name: 'Old Grindle', col: THREAD.ambrose, line: "Old Grindle, beached at the edge of the pond, gears ticking slowly in its sleep. You pat its fin. It goes clank, contentedly." },
    belfry: { flag: 'belfry_boss', name: 'the Tollgrim', col: THREAD.tess, line: "The Tollgrim, curled up under an upturned bell, purring at the exact pitch of middle C. You pat its stone head." },
    slumber: { flag: 'slumber_boss', name: 'Mother Sloth', col: THREAD.mallow, line: "Mother Sloth, asleep in her own bed for once, a nightcap over one eye. You tuck her in. She mumbles something about bedtimes." },
    marionette: { flag: 'reveal1', name: 'the Great Marionette', col: THREAD.jory, line: "The Great Marionette, hung up neatly on its hook, strings coiled, dozing. Somebody's chalked a smile on it. You give its foot a little wiggle." },
    spoolworks: { flag: 'd7', name: 'the Tangle', col: THREAD.guild, line: "The Tangle, wound loosely into a great soft ball, the Cog curled asleep on top of it. You pat the ball. It unwinds a little, comfortably." },
};
SPAWN.bossnap = (tx, ty, p) => {
    const d = BOSS_NAPS[p.house];
    const pr = new Prop(tx, ty, { im: null, solid: [[0, 0]] });
    pr.interact = () => {
        Script.run(function* () {
            yield* say(null, d.line);
            if (!Progress.flag('pet:' + p.house)) { Progress.set('pet:' + p.house); Stats.count('secret:pet'); }
            if (!Progress.flag('s14')) { Progress.set('s14'); }
            const n = Object.keys(BOSS_NAPS).filter(h => Progress.flag('pet:' + h)).length;
            if (n === Object.keys(BOSS_NAPS).length && !Progress.flag('s14_all')) { Progress.set('s14_all'); yield* say(null, "Every one of them, rewound, asleep, patted. Nobody tells you, but each of the Makers smiles at their supper tonight and doesn't say why."); yield* Story.getItem('heartpatch', 'napPatch')(); }
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    pr.draw = (cx, cy) => {
        const x = tx * T - cx, y = ty * T - cy, t = G.t;
        Gfx.alpha(0.22); Gfx.rect(x + 1, y + 13, 14, 3, PAL.ink); Gfx.alpha(1);
        Gfx.circle(x + 8, y + 7, 7, d.col); Gfx.circle(x + 8, y + 7, 4, shade(d.col, 0.25));
        for (let i = 0; i < 3; i++) Gfx.line(x + 2 + i * 4, y + 2, x + 6 + i * 4, y + 12, shade(d.col, -0.3));
        const z = (t >> 5) % 3; Font.draw('z', x + 12 + z * 2, y - 4 - z * 3, '#fbf6ea');
    };
    return pr;
};
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        const d = BOSS_NAPS[id], h = HOUSE_AFTER[id];
        if (d && h && Progress.flag(d.flag)) {
            const r = a.rooms.find(q => q.key === h.room);
            /* a free spot in the hall, near its middle, not where the hoop or the heart goes */
            const taken = [[r.x + (h.hoop || [0, 0])[0], r.y + (h.hoop || [0, 0])[1]], [r.x + h.heart[0], r.y + h.heart[1]]];
            outer: for (let rad = 1; rad < 8; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
                const x = r.x + 14 + dx, y = r.y + 3 + dy, k = a.kind(x, y);
                if (!a.inside(x, y) || a.roomAt(x, y) !== r || k.solid || k.pit || k.deep || k.hurt || a.at(x, y) || taken.some(([u, v]) => Math.abs(u - x) <= 1 && Math.abs(v - y) <= 1)) continue;
                if (a.ents.some(e => e.kind === 'warp' && e.tx === x && e.ty === y)) continue;
                a.add(SPAWN.bossnap(x, y, { house: id }));
                break outer;
            }
        }
        return a;
    };
}

/* ---------- S25: Biscuit's collar ---------- */
{
    const cat0 = CRITTER_TALK.biscuit;
    CRITTER_TALK.biscuit = c => {
        const n = [1, 2, 3, 4, 5, 6, 7, 8].filter(k => Progress.flag('linnet' + k)).length;
        if (n < 6 || Progress.flag('s25')) return cat0(c);
        return function* () {
            Progress.set('s25'); Stats.count('secret:collar');
            yield* say(null, "Biscuit lets you scratch under its chin, and for the first time you notice the collar: green thread, plaited, very old. A little brass tag on it, worn nearly smooth: L.R.");
            yield* say(null, "Linnet's cat.");
        };
    };
}
AREAS.drift.ents.push({ k: 'critter', who: 'biscuit', look: 'cat', x: 20, y: 23, speed: 0.4, route: [[20, 23, 300], [17, 25, 200], [21, 21, 240]], if: 's25&!unwound' });

/* ---------- S31: the far isle in Millwater lake: too far for the Hookline, not for the Long Hook ---------- */
{
    const B = OW.blocks['2,2'];
    for (const y of [9, 10]) B.rows[y] = B.rows[y].slice(0, 13) + '..' + B.rows[y].slice(15);
    /* a ring of low rocks round it: no raft gets alongside; the hooks fly over them */
    const set = (x, y, c) => { B.rows[y] = B.rows[y].slice(0, x) + c + B.rows[y].slice(x + 1); };
    for (let x = 12; x <= 15; x++) { set(x, 8, 'Q'); set(x, 11, 'Q'); }
    for (const y of [9, 10]) { set(12, y, 'Q'); set(15, y, 'Q'); }
    /* the isle's two open tiles are one above the other: the Long Hook from the west shore lands on the lower; the chest
       stands in the way of a hook from the north shore, and the post on the north shore is the way off without one */
    B.ents.push(
        { k: 'eyelet', x: 14, y: 10 }, { k: 'eyelet', x: 3, y: 10 }, { k: 'eyelet', x: 13, y: 3 },
        { k: 'chest', x: 14, y: 9, item: 'heartpatch', id: 'islePatch' },
        { k: 'sign', x: 4, y: 8, text: "THE ISLE OF NOWHERE. (Too far to hook. Too far to swim. Not too far to want. -H.)" });
}
{
    const int0 = Chest.prototype.interact;
    Chest.prototype.interact = function (p) { const r = int0.call(this, p); if (this.id === 'islePatch' && this.opened && !Progress.flag('s31')) { Progress.set('s31'); Stats.count('secret:isle'); } return r; };
}

function initSecrets() {
    ART.crawlspace = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#8a6448', 1, 6, 14, 4); R('#6a4a32', 1, 9, 14, 2); R('#1a1410', 3, 11, 10, 5); R('#2a201a', 4, 12, 8, 4); if (true) R('#f7e08a', 9, 14, 1, 1); });
}
CONTENT_INIT.push(initSecrets);

/* ---------- fog-silk hollows: little nooks by the fog's edge, grown shut with the fog's own thread; only the Shears part
   it, so the early places hold something for the end of the Wander ---------- */
const SILK_HOLLOWS = [
    { block: '1,2', x: 11, y: 36, id: 'silkMeadow', keep: "Caught in the fog-silk long ago: a child's red shoe, a teaspoon, a ribbon off a prize ewe. Things the fog took and never quite let go of." },
    { block: '0,2', x: 21, y: 37, id: 'silkKiln', keep: "Behind the silk, in a dry hollow of the rock: a potter's stamp with an L cut into it, and a jar of glaze gone solid. Somebody hid here once, and watched the fog." },
    { block: '2,2', x: 16, y: 36, id: 'silkMill', keep: "Tangled in the silk at the back: a fishing float, a cork, a little wooden boat with a name painted on it, worn away. The fog keeps what drifts to it." },
];
for (const h of SILK_HOLLOWS) {
    const B = OW.blocks[h.block];
    B.rows[h.y] = B.rows[h.y].slice(0, h.x - 1) + '...' + B.rows[h.y].slice(h.x + 2);
    B.ents.push(
        { k: 'warpthread', x: h.x - 1, y: h.y - 1, len: 3, dir: 'h', id: h.id + 'Silk' },
        { k: 'chest', x: h.x, y: h.y, item: 'b20', id: h.id },
        { k: 'deco', x: h.x + 1, y: h.y, look: 'rock', solid: [[0, 0]], text: h.keep });
}
{
    const int0 = Chest.prototype.interact;
    Chest.prototype.interact = function (p) {
        const r = int0.call(this, p);
        if (this.opened && SILK_HOLLOWS.some(h => h.id === this.id) && !Progress.flag('silk:' + this.id)) { Progress.set('silk:' + this.id); Stats.count('secret:silk'); }
        return r;
    };
}

/* ---------- the town's favours (src/51c_town_favours.js) go on in the free valley: a thank-you still owing, or a want,
   comes before everyone's new lines there (src/76_ending.js) ---------- */
{
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        const base = talk0.call(this, npc);
        if (!Progress.flag('unwound') || !FAVOUR_TALK[npc.who] || !npc.area || (npc.area.id !== 'hollow' && npc.area.family !== 'interior')) return base;
        return function* () { if (yield* Favours.talk(npc.who, npc)) return; yield* base(); };
    };
}
