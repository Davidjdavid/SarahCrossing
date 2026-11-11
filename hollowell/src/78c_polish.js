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
/* What's only seen or tried, with nothing to show for it but the seeing, isn't sewn on: the costume through Seam's back
   window (S07), a House's key tugging back at its door (S08), the Well's groan at the Bell and its threads under the Hook
   (S09, S10), the Bell rung in mid-flight (S18), a faint once the Hall of Names is behind you (S33), the motto read in
   every act (S35). Found, not counted. And the valley's secrets are counted without how many there are to find. */
const QUILT = [
    ['Secrets of the valley', [
        () => Progress.flag('linnet1'), () => Progress.flag('s01'), () => Progress.flag('s03'), () => Progress.flag('staffonly'), () => Progress.flag('pie'),
        () => Progress.flag('s11'), () => Progress.flag('s12'), () => Progress.flag('s13'), () => Progress.flag('s14'), () => Progress.flag('belfry_echo'),
        () => Progress.flag('linnet6'), () => Progress.areaFlag('hollow', 'chest:mwCave'), () => Progress.areaFlag('hollow', 'got:hawkPatch'), () => Progress.flag('s22'),
        () => Progress.flag('s23'), () => Progress.flag('s24'), () => Progress.flag('s25'), () => Progress.flag('s28'), () => Progress.flag('s29'),
        () => Progress.flag('s30'), () => Progress.flag('s31'), () => Progress.flag('s32'),
        /* the later regions' finds (what's off the way, not the gates on it): the wooden one in Mallow's nursery, Lantern
           Pond's isle and the old weight found there and set in its socket, the balloon cut loose and found again past
           the fog, the Drift's mill pond run out and its toll box */
        () => Progress.areaFlag('hollow', 'chest:nuPatch'), () => Progress.areaFlag('hollow', 'chest:lpIsle'), () => Progress.flag('oldweight_got'),
        () => Progress.flag('oldweight_at'), () => Progress.flag('balloon_away'), () => Progress.flag('drift_balloon'),
        () => Progress.flag('drift_millpond'), () => Progress.areaFlag('drift', 'chest:drToll'),
    ]],
    ["Linnet's notes", [1, 2, 3, 4, 5, 6, 7, 8].map(n => () => Progress.flag('linnet' + n))],
    ["The Makers' marks", ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'].map(h => () => Progress.flag('sig:' + h))],
    ['Old foes, asleep and patted', ['tidy', 'kiln', 'millrace', 'belfry', 'slumber', 'marionette', 'spoolworks'].map(h => () => Progress.flag('pet:' + h))],
    ['Hollows in the fog-silk', ['silkMeadow', 'silkKiln', 'silkMill'].map(id => () => Progress.flag('silk:' + id))],
    /* the town's favours, each counted once it's done (src/51c_town_favours.js) */
    ['Good turns done in town', ['crates', 'kite', 'marble', 'tin', 'stick', 'saucer'].map(f => () => Progress.flag('fav_' + f))],
    ['The two houses nobody has to visit', [() => Progress.flag('sh_pile'), () => Progress.flag('ives_done')]],
];
const Quilt = {
    tally() { return QUILT.map(([name, list]) => [name, list.filter(f => f()).length, list.length]); },
    total() { return this.tally().reduce((s, r) => s + r[1], 0); },
    /* is Gran shut in, under the Well (from the Hall of Names till the Unwinding)? */
    shut() { return Progress.flag('well_locked') && !Progress.flag('unwound'); },
    *read() {
        const t = this.tally(), all = t.reduce((s, r) => s + r[1], 0), of = t.reduce((s, r) => s + r[2], 0);
        yield* say(null, Progress.flag('unwound') ? `The Wander quilt, folded on the chair. Gran's been adding to it: ${all} patches now, every one a thing you found.` : `Your Wander quilt, folded on the chair. Gran sews a patch on for everything you find. ${all} so far.`);
        /* and still they come, with Gran shut in under the Well: as many as were found since she went down (counted from
           that moment), or, for a save from before that was counted, since the last look while she's been down there */
        if (this.shut()) {
            const base = Progress.get('quiltR2'), seen = Progress.get('quiltShutSeen'), k = typeof base === 'number' ? all - base : 0;
            if (k > 0) yield* say(null, `${numWords(k).replace(/^\w/, c => c.toUpperCase())} new patch${k === 1 ? '' : 'es'} since Gran shut herself in. Nobody has been up the stairs.`);
            else if (typeof base !== 'number' && typeof seen === 'number' && all > seen) yield* say(null, 'New patches since you last looked. Nobody has been up the stairs.');
            Progress.set('quiltShutSeen', all);
        }
        yield* say(null, t.map(([name, n, m], i) => i === 0 ? `${name}: ${n}` : `${name}: ${n} of ${m}`).join('\n'));
        if (all === of) yield* say(null, "Every patch. Gran has stitched a little red thread all the way round the border, and then, at the very end, deliberately, left it loose.");
    },
};
/* the moment Gran shuts herself in, the quilt is counted, so the patches after it can be told from the ones before */
{
    const set0 = Progress.set;
    Progress.set = function (n) { const r = set0.apply(this, arguments); if (n === 'well_locked' && this.flags.quiltR2 === undefined) this.flags.quiltR2 = Quilt.total(); return r; };
}
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

/* pictures for the things held up when found (each found thing is shown over Wren's head while the line about it shows) */
CONTENT_INIT.push(() => {
    const T2 = { t: '#3aa8a0', T: '#2a7a78', g: '#5ab85a', G: '#3a8a3a' };
    defSprite('icon_staff', ['................', '............kk..', '...........kbbk.', '..........kbrbk.', '..........kbbk..', '.........kbk....', '........kbk.....', '.......kbk......', '......kbk.......', '.....kbk........', '....kbk.........', '...kbk..........', '..kbk...........', '.kbk............', '.kk.............', '................']);
    defSprite('icon_satchel', ['................', '....kkkkkkkk....', '...k........k...', '...k........k...', '..kkkkkkkkkkkk..', '.kuuuuuuuuuuuuk.', '.kubbbbbbbbbbuk.', '.kubbbbkkbbbbuk.', '.kubbbkyykbbbuk.', '.kubbbbkkbbbbuk.', '.kuuuuuuuuuuuuk.', '.kbbbbbbbbbbbbk.', '.kbbbbbbbbbbbbk.', '.kbbbbbbbbbbbbk.', '..kkkkkkkkkkkk..', '................']);
    defSprite('icon_plan', ['................', '..kkkkkkkkkkk...', '.kWWkzzzzzzzzk..', '.kWWkzwzzzwzzk..', '.kWWkzwwwwwzzk..', '.kWWkzwzzzwzzk..', '.kWWkzwzwzwzzk..', '.kWWkzwwwwwzzk..', '.kWWkzzzzzzzzk..', '.kWWkzzwwwwzzk..', '.kWWkzzwzzwzzk..', '.kWWkzzwwwwzzk..', '.kWWkzzzzzzzzk..', '..kkkkkkkkkkk...', '................', '................']);
    defSprite('icon_string', ['................', '................', '.....kkkkk......', '...kkrrRrrkk....', '..krrRrrrRrrk...', '..kRrrrRrrrRk...', '.krrrRrrrRrrrk..', '.krRrrrRrrrRrk..', '.krrrRrrrRrrrk..', '..kRrrrRrrrRk...', '..krrRrrrRrrk...', '...kkrrRrrkkk...', '.....kkkkk..kk..', '.............kk.', '..............k.', '................']);
    defSprite('icon_tealscarf', ['................', '..kkkkkkkkkkkk..', '..kttttttttttk..', '..kTTTTTTTTTTk..', '..kttttttttttk..', '..kkkkkkkkktk...', '.........ktTk...', '.........kttk...', '.........kTTk...', '.........kttk...', '.........kTTk...', '.........kttk...', '.........kkkk...', '.........k.k.k..', '.........k.k.k..', '................'], T2);
    defSprite('icon_driftseed', ['................', '......W..W......', '....W......W....', '.......kk.......', '......kaak......', '.....kazaak.....', '.....kaaaak.....', '....kaazaaak....', '....kaaaaaak....', '....kazaaaak....', '.....kaaaak.....', '.....kaazak.....', '......kaak......', '.......kk.......', '...W........W...', '................']);
    defSprite('icon_tuckdrawing', ['................', '.kkkkkkkkkkkkk..', '.kWWWWWWWWWWWk..', '.kWWrWWrWWrWWk..', '.kWWrWWrWWrWWk..', '.kWWWrWrWrWWWk..', '.kWWWWWkkWWWWk..', '.kWWWWkWWkWWWk..', '.kWWWWWkkWWWWk..', '.kWWWkkkkkkWWk..', '.kWWWWWkkWWWWk..', '.kWWWWkWWkWWWk..', '.kWWWkWWWWkWWk..', '.kWWWWWWWWWWWk..', '.kkkkkkkkkkkkk..', '................']);
    defSprite('icon_tuckspool', ['................', '...kkkkkkkkkk...', '...kbbbbbbbbk...', '...kkkkkkkkkk...', '....kggggggk....', '....kGgGgGgk....', '....kggggggk....', '....kGgGgGgk....', '....kggggggk....', '....kGgGgGgk....', '....kggggggk....', '...kkkkkkkkkk...', '...kbbbbbbbbk...', '...kkkkkkkkkk...', '................', '................'], T2);
    defSprite('icon_guildkey', ['................', '..kkkkk.........', '..kxxxk.........', '..kkkkk.........', '...kXk..........', '..kkkkk.........', '..kxxxk.........', '..kkkkk.........', '....kxk.........', '....kxk.........', '....kxkkkk......', '....kxxxxk......', '....kxkkkk......', '....kxkk........', '....kxxk........', '....kkkk........']);
    defSprite('icon_ribbon', ['................', '.....kkk........', '....kRRRk.......', '...kRrrRk.......', '...kRrkRk.......', '....kRRk........', '....kRrk........', '...kRrRk........', '...kRrk.........', '..kRrRk.........', '..kRrk..........', '.kRrRk..........', '.kRrk...........', '.kr.r...........', '.r.r.r..........', '................']);
});
