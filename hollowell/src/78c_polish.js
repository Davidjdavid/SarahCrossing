/* Polish from the design critique: the Rules on the schoolroom blackboard keep changing as the Hollow does; the Makers'
   logbooks tell how often you fell in their House and whether you found their mark; the Great Pull, seen. */

/* ---------- the blackboard: the Rules, after each turn of the story ---------- */
{
    const bb0 = Story.blackboard;
    Story.blackboard = function* () {
        if (Progress.flag('unwound')) {
            yield* say(null, "THE RULES OF THE HOLLOW (NEW). In Miss Quill's best hand:\n1. Things have places.\n2. People choose theirs.\n3. Some things get lost. That's allowed.\n4. Come home for tea, if you like.");
            return;
        }
        yield* bb0();
        if (Progress.flag('reveal1')) yield* say(null, "Under the rules, in chalk, in a child's hand: '6. The Makers make it ALL. (Dont tell the little ones.)'");
        if (Progress.flag('reveal2')) yield* say(null, "And under that, in a hand that pressed so hard the chalk snapped: '7. Everyone has a place. EVERYONE.' Nobody owns up to writing it.");
    };
}

/* ---------- the logbooks: falls in each House, and whether you found the Maker's mark ---------- */
{
    const fall0 = Player.prototype.startFall;
    Player.prototype.startFall = function (why) { if (this.area && why !== 'doze') Stats.count('falls@' + this.area.id); return fall0.apply(this, arguments); };
    const MARK_OF = { tidy: 'tidy', kiln: 'kiln', millrace: 'mill', belfry: 'belfry', slumber: 'slumber', marionette: 'marionette' };
    const lines0 = Logbook.lines;
    Logbook.lines = function (area) {
        const out = lines0.call(this, area);
        if (!this.facts(area).been) return out;
        const who = LOGBOOK_HOUSES[area][0], falls = Stats.c['falls@' + area] || 0;
        out.push(falls === 0 ? 'Falls: none. Not one. Feet like a cat.' : `Falls: ${falls}. ${who === 'mallow' ? 'Lovely ones. Very restful.' : 'We caught you every time. That is the job.'}`);
        out.push(Progress.flag('sig:' + MARK_OF[area]) ? 'Found my mark! Nobody finds my mark. (I may have cried.)' : "Walked right past my mark. It's still there, if you go and look.");
        return out;
    };
}

/* ---------- the Great Pull, seen: the town tinted, and threads from every marked thing in sight running to the Well ---------- */
{
    const draw0 = UI.draw;
    UI.draw = function () {
        const a = G.map;
        if (a && a.id === 'hollow' && G.scene === 'play' && Progress.flag('great_pull') && !Progress.flag('unwound') && !G.credits) {
            const t = G.t;
            Gfx.alpha(0.16 + Math.sin(t / 40) * 0.04); Gfx.rect(0, 0, W, H, '#5a2030'); Gfx.alpha(1);
            /* the fog's edge leaning in on every side */
            for (let i = 0; i < 6; i++) { Gfx.alpha(0.07); Gfx.rect(0, 0, W, 6 + i * 4, '#e4ecf5'); Gfx.rect(0, H - 6 - i * 4, W, 6 + i * 4, '#e4ecf5'); Gfx.rect(0, 0, 6 + i * 4, H, '#e4ecf5'); Gfx.rect(W - 6 - i * 4, 0, 6 + i * 4, H, '#e4ecf5'); } Gfx.alpha(1);
            const wx = 95 * T + 8 - Cam.x, wy = 58 * T + 8 - Cam.y;
            const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory, THREAD.guild, THREAD.town];
            let n = 0;
            for (const e of a.ents) {
                if (!e.ret || e.cutFree || e.removed || e.kind === 'npc' || n > 60) continue;
                const x = e.x - Cam.x + 8, y = e.y - Cam.y + 6;
                if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
                n++;
                Gfx.alpha(0.6); Gfx.line(x, y, wx + Math.sin(t / 20 + n) * 2, wy, cols[n % cols.length]); Gfx.alpha(1);
            }
            /* and, from off every edge of the screen, threads from the rest of the valley */
            for (let i = 0; i < 24; i++) {
                const ang = i / 24 * Math.PI * 2 + t / 600, ex = W / 2 + Math.cos(ang) * W, ey = H / 2 + Math.sin(ang) * H;
                Gfx.alpha(0.4); Gfx.line(ex, ey, wx, wy, cols[i % cols.length]); Gfx.line(ex + 1, ey, wx + 1, wy, cols[i % cols.length]); Gfx.alpha(1);
            }
        }
        return draw0.call(this);
    };
}

/* ---------- the Wander quilt, on the chair by Wren's bed: a patch sewn on for everything found (counts, never where) ---------- */
const QUILT = [
    ['Secrets of the valley', [
        () => Progress.flag('linnet1'), () => Progress.flag('s01'), () => Progress.flag('s03'), () => Progress.flag('staffonly'), () => Progress.flag('pie'),
        () => Progress.flag('s07'), () => Progress.flag('s08'), () => Progress.flag('s09'), () => Progress.flag('s10'), () => Progress.flag('s11'),
        () => Progress.flag('s12'), () => Progress.flag('s13'), () => Progress.flag('s14'), () => Progress.flag('belfry_echo'), () => Progress.flag('linnet6'),
        () => Progress.flag('s18'), () => Progress.areaFlag('hollow', 'chest:mwCave'), () => Progress.areaFlag('hollow', 'got:hawkPatch'), () => Progress.flag('s22'),
        () => Progress.flag('s23'), () => Progress.flag('s24'), () => Progress.flag('s25'), () => Progress.flag('s28'), () => Progress.flag('s29'),
        () => Progress.flag('s30'), () => Progress.flag('s31'), () => Progress.flag('s32'), () => Progress.flag('s33'), () => Progress.flag('s35'),
    ]],
    ["Linnet's notes", [1, 2, 3, 4, 5, 6, 7, 8].map(n => () => Progress.flag('linnet' + n))],
    ["The Makers' marks", ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'].map(h => () => Progress.flag('sig:' + h))],
    ['Old foes, asleep and patted', ['tidy', 'kiln', 'millrace', 'belfry', 'slumber', 'marionette', 'spoolworks'].map(h => () => Progress.flag('pet:' + h))],
    ['Hollows in the fog-silk', ['silkMeadow', 'silkKiln', 'silkMill'].map(id => () => Progress.flag('silk:' + id))],
    ['The two houses nobody has to visit', [() => Progress.flag('sh_pile'), () => Progress.flag('ives_done')]],
];
const Quilt = {
    tally() { return QUILT.map(([name, list]) => [name, list.filter(f => f()).length, list.length]); },
    *read() {
        const t = this.tally(), all = t.reduce((s, r) => s + r[1], 0), of = t.reduce((s, r) => s + r[2], 0);
        yield* say(null, Progress.flag('unwound') ? `The Wander quilt, folded on the chair. Gran's been adding to it: ${all} patches now, every one a thing you found.` : `Your Wander quilt, folded on the chair. Gran sews a patch on for everything you find. ${all} so far.`);
        yield* say(null, t.map(([name, n, m]) => `${name}: ${n} of ${m}`).join('\n'));
        if (all === of) yield* say(null, "Every patch. Gran has stitched a little red thread all the way round the border, and then, at the very end, deliberately, left it loose.");
    },
};
SPAWN.quilt = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.quilt, solid: [[0, 0]], oy: -2 });
    pr.interact = () => { Script.run(Quilt.read()); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
AREAS.gran_room.ents.push({ k: 'quilt', x: 7, y: 5 });
CONTENT_INIT.push(() => {
    ART.quilt = paintSprite(16, 16, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6b4128', 3, 10, 2, 5); R('#6b4128', 11, 10, 2, 5); R('#8a5a38', 2, 8, 12, 3);
        const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#8fd46a', '#d6304e'];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R(cols[(i + j * 3) % 8], 2 + i * 3, 3 + j * 3, 3, 3);
        R('#fbf6ea', 2, 3, 12, 1);
    });
});
