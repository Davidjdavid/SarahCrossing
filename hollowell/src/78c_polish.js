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
