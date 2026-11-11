/* After the end: what Gran felt. She held every thread in the valley, Wren's too, until Wren cut her own at the fog; after
   that she felt nothing of her at all. In the free valley Gran and Linnet sit on the bench by her gate with the middle
   free (where the cat sat in the epilogue). Sit down, and Gran mentions a thing or two she felt, Linnet putting in a word,
   then that after the fog she couldn't feel Wren at all, and she looks at her, as she did the first morning ("Let me
   look at you. Scarf on straight, good."). Down the cellar steps, on the cushioned winch, her ledger lies open: a few
   lines about Wren written at the time, the fog, the rest of the page empty, and one line at the bottom in fresh ink.
   What's said comes only from what Wren did with the game's own things (the fog, leaning on people, the Bell at the
   Well, the north gate's weight, the Hall, Tuck's thread, the Shears on people and on her own, Linnet's places,
   sitting to wait, flying Homeward to the Bedroll, the peephole into Gran's study; the tally of src/80b_tally.js only
   in the ledger's last line, as Gran gave it at the Spool): never time spent anywhere, never an answer picked in a
   conversation. A thing is said only if it happened; a "never" only from a record of that moment (the tally kept from
   the first step, or the count taken as her own thread was cut). It's all worked out from a note
   of the evidence made as the threads go slack, kept in the save, so it says the same thing every time. Nothing of it
   shows before the end. Developers: HW.afterword() (debug or headless) says what was found and why each thing was or
   wasn't said. (All of it lives in the save's own counters and flags: nothing for Save.migrate to change.) */

/* an ordinal in words ("ninth", "twenty-first") */
function ordWords(n) {
    const w = numWords(n), m = w.match(/^(.*?)([a-z]+)$/), last = m ? m[2] : w;
    const O = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
    return (m ? m[1] : '') + (O[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th'));
}

const After = {
    /* the valley's own people: everyone with a spool in the Hall of Names */
    town() { return NAME_SPOOLS.map(s => s[1]).filter(w => !['hesper', 'biscuit', 'linnet', 'wren'].includes(w)); },
    /* what Gran calls people, out loud and in her ledger */
    SAY: { quill: 'Miss Quill', arlo: 'Arlo', hob: 'Hob', ives: 'Mother Ives', mallow: 'Doctor Mallow', mabel: 'Mabel', burr: 'Burr', seam: 'Seam', annie: 'Annie', ambrose: 'your dad', tess: 'your mum' },
    WRITE: { quill: 'Quill', arlo: 'Arlo', hob: 'Hob', ives: 'Ives', mallow: 'Mallow', mabel: 'Mabel', burr: 'Burr', seam: 'Seam', annie: 'Annie', rook: 'Rook', ambrose: 'Ambrose', tess: 'Tess' },
    said(w) { return this.SAY[w] || Story.name(w); },
    written(w) { return this.WRITE[w] || Story.name(w); },
    list(names) { return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]; },

    /* ---------------- kept as it happens ---------------- */
    /* a new Wander keeps all of it from the first step; an older save, from its first load, whatever's still ahead */
    watch() {
        const c = Stats.c; if (!c || c['aft:watch']) return;
        c['aft:watch'] = 1;
        if (!Progress.flag('unwound') && !(c['cut:people'] > 0)) c['aft:keptCuts'] = 1;
        if (!Progress.flag('great_pull') && !Inv.has('bell')) c['aft:keptWell'] = 1;
    },
    cuts() { return String(Progress.get('aft:cuts') || '').split(' ').filter(Boolean); },
    noteCut(who) { const l = this.cuts(); if (!l.includes(who)) { l.push(who); Progress.set('aft:cuts', l.join(' ')); } },

    /* ---------------- the evidence, noted as the threads go slack ---------------- */
    snap() {
        const c = Stats.c, f = Progress.flags, n = k => c[k] || 0;
        /* (the most of something, the first to reach it winning a tie: the order things happened in, kept by the save) */
        const most = (pre, skip) => { let b = null; for (const [k, v] of Object.entries(c)) if (k.startsWith(pre) && k !== skip && v > (b ? b[1] : 0)) b = [k.slice(pre.length), v]; return b; };
        return {
            v: 1, kept: Tally.kept(), keptCuts: !!c['aft:keptCuts'], keptWell: !!c['aft:keptWell'],
            fog: Tally.fogs(), self: n('aft:no:self'), atSelf: c['aft:cutsAtSelf'] === undefined ? null : c['aft:cutsAtSelf'],
            cuts: this.cuts(), no: most('aft:no:', 'aft:no:self'), lean: most('budge:', 'budge:gran'), gran: Math.max(n('budge:gran'), f['budged:gran'] ? 1 : 0), all: !!f.s01,
            hold: !!f.hall_held, tuck: n('tuck:yanked'), gate: !!f.s32, notes: [1, 2, 3, 4, 5, 6, 7, 8].filter(i => f['linnet' + i]).length,
            bell: !!f.s09, rings: n('aft:well'), waited: n('waited'), peep: !!f['peep:53,21'],
            /* (the tally as Gran gives it at the Spool, her own pull in the Hall included; and Homeward flights, which it
               leaves out: those were Wren's own going home) */
            home: Tally.home(), homeward: n('homeward'),
        };
    },
    freeze() { if (!Progress.get('aft:snap')) Progress.set('aft:snap', this.snap()); return Progress.get('aft:snap'); },
    /* (nothing known: what a note without some of this reads as) */
    NONE: { v: 1, kept: false, keptCuts: false, keptWell: false, fog: 0, self: 0, atSelf: null, cuts: [], no: null, lean: null, gran: 0, all: false, hold: false, tuck: 0, gate: false, notes: 0, bell: false, rings: 0, waited: 0, peep: false, home: null, homeward: 0 },
    /* noted when the threads went slack (or, for a save that ended before any of this, the first time it's asked) */
    evidence() { return Object.assign({}, this.NONE, { cuts: [] }, Progress.get('aft:snap') || (Progress.flag('unwound') ? this.freeze() : this.snap())); },

    /* ---------------- what Gran could say, and what she wrote ----------------
       Each: whether it holds and why; what it's about (two things about the same evidence never go together); how much
       it weighs on the bench (w) and in the ledger (lw); when in the Wander it happened (ord); Gran's line and whatever
       Linnet (or Gran again) says after it; the ledger's line. */
    cands(e) {
        const L = [], cap = s => s[0].toUpperCase() + s.slice(1), Num = k => cap(numWords(k)), poss = w => this.said(w) + "'s";
        const add = (id, ok, why, groups, w, lw, ord, say, write, contra) => L.push({ id, ok: !!ok, why, groups, w, lw, ord, say, write, contra: !!contra });
        const town = this.town(), cutTown = town.filter(w => e.cuts.includes(w)), left = town.filter(w => !e.cuts.includes(w));
        /* a contradiction: two things that pull different ways */
        add('fogblades', e.fog >= 3 && e.self >= 1, `turned round by the fog ${e.fog} (from 3); not yet to her own thread ${e.self} (from 1)`, ['fog', 'blades'], 95, 0, 0,
            () => [['gran', `{happy}${Num(e.fog)} times you went into that fog to see if it'd let you through. And the day it would, you stood there with the Shears and didn't close them.` + (e.self >= 2 ? ` ${cap(numTimes(e.self))}.` : '')], ['linnet', '{sad}It took me a week.']], null, true);
        add('freeothers', e.atSelf >= 8 && e.self >= 1, `cut before her own thread ${e.atSelf === null ? 'not seen' : e.atSelf} (from 8); not yet to her own ${e.self} (from 1)`, ['cuts', 'blades'], 93, 0, 0,
            () => [['gran', `{sad}You cut ${numWords(e.atSelf)} people loose before you went to the fog. Your own, you had to think about.`], ['linnet', '{sad}It took me a week.']], null, true);
        add('holdtuck', e.hold && e.tuck >= 2, `held on in the Hall: ${e.hold ? 'yes' : 'no'}; Tuck's own thread pulled ${e.tuck} (from 2)`, ['hold', 'tuck'], 92, 0, 0,
            () => [['gran', `{sad}${Num(e.tuck)} times you pulled that boy home by his own thread. And when I pulled yours, you held on with both hands.`], ['linnet', 'Did he mind?'], ['gran', "{happy}He loved it. That isn't the point."]], null, true);
        /* one thing each */
        add('granlean', e.gran >= 1, `leant on Gran ${e.gran} (from 1)`, ['lean'], 90, 90, 2,
            () => [['gran', e.gran === 1 ? '{happy}You leant on me once. I had to remember to go back where I was.' : `{happy}You leant on me ${numTimes(e.gran)}. Every time, I had to remember to go back where I was.`], ['linnet', '{surprised}Mum!']],
            () => '{name} leant on me. I went back where I was. She didn\'t notice.');
        add('left', e.keptCuts && cutTown.length >= 14 && left.length >= 1 && left.length <= 3, `cut ${cutTown.length} of the town's ${town.length} (from 14), leaving ${left.length} (one to three)` + (e.keptCuts ? '' : '; cuts not watched from the first'), ['cuts'], 88, 76, 10,
            () => [['gran', `{sad}You cut every thread in town but ${this.list(left.map(poss))}.`], ['linnet', '{surprised}Why ever not?']],
            () => `Everyone in town loose now but ${this.list(left.map(w => this.written(w)))}.`);
        add('gate', e.gate, `the north gate's weight moved before Reveal 2 (S32): ${e.gate ? 'yes' : 'no'}`, ['gate'], 85, 85, 6,
            () => [['gran', '{surprised}You let my north gate go before you\'d ever been down to the Hall. I felt the weight shift, and I thought: she knows.'], ['linnet', '{happy}Did you?']],
            () => "The north gate's weight, moved. {name}. She can't know.");
        const nw = e.no && e.no[0], nk = e.no ? e.no[1] : 0, later = nw && e.cuts.includes(nw);
        add('declined', !!e.no, e.no ? `not yet to cutting ${nw} ${nk} times` + (later ? ', then cut' : ', never cut') : 'no not-yet to cutting anyone seen', ['cuts'], later ? 84 : 83, 73, 9,
            () => [['gran', `{sad}${cap(numTimes(nk))} you had the Shears to ${poss(nw)} thread and didn't. ${later ? 'Then you did.' : 'You never did.'}`]],
            () => `{name} with the Shears at ${this.written(nw)}'s thread. Didn't.`);
        add('hold', e.hold, `held on to the lectern when Gran pulled: ${e.hold ? 'yes' : 'no'}`, ['hold'], 82, 82, 7,
            () => [['gran', "{sad}In the Hall, when I pulled, you held on. Both hands. I'd have waited all night."], ['linnet', '{happy}Good.']],
            () => '{name} in the Hall. Held on. I waited.');
        add('blades', e.self >= 1, `not yet to her own thread ${e.self} (from 1)`, ['blades'], 80, 78, 11,
            () => [['gran', e.self === 1 ? "{sad}At the fog I felt the Shears on your thread, and they didn't close." : `{sad}At the fog I felt the Shears on your thread ${numTimes(e.self)}, and they didn't close.`], ['linnet', '{sad}It took me a week.']],
            () => e.self === 1 ? "{name} at the fog with the Shears. They didn't close." : `{name} at the fog with the Shears again. They didn't close. ${cap(numTimes(e.self))} now.`);
        add('linnet', e.notes >= 6, `Linnet's notes found ${e.notes} (from 6)`, ['linnet'], e.notes === 8 ? 78 : 75, 68, 8,
            () => e.notes === 8 ? [['gran', "{sad}You went everywhere she'd been. Every place she left a note, one after another. I felt you go, the way I felt her."], ['linnet', '{surprised}Even the horse?'], ['gran', 'Even the horse.']]
                : [['gran', "{sad}You went nearly everywhere she'd been, the places she left her notes. I felt you go, the way I felt her."], ['linnet', "{sad}I didn't think anybody would look."]],
            () => "{name} in Linnet's places again." + (e.notes === 8 ? ' All of them, now.' : ''));
        add('leanall', e.all, `leant on everyone (S01): ${e.all ? 'yes' : 'no'}`, ['lean'], 72, 58, 2,
            () => [['gran', "{happy}You leant on every soul in the valley, one after another, to see what they'd do. I felt the lot."], ['linnet', '{happy}I never got past Arlo.']],
            () => '{name} has leant on every one of them now, to see. Every one went back.');
        const first = e.cuts[0];
        add('firstcut', e.keptCuts && !!first, (first ? `the first she cut: ${first}` : 'cut nobody') + (e.keptCuts ? '' : '; cuts not watched from the first'), ['cuts'], 70, 74, 9,
            () => [['gran', `{sad}The first thread you cut was ${poss(first)}. I felt it go, like a dropped stitch.`], ...(first === 'arlo' ? [['linnet', '{happy}Did he get as far as the lake?'], ['gran', 'Every morning, now.']] : [])],
            () => `${this.written(first)}'s thread, gone. She's cutting them.`);
        add('fog', e.fog >= 3, `turned round by the fog ${e.fog} (from 3)`, ['fog'], 62 + Math.min(10, e.fog), 80, 1,
            () => [['gran', `{happy}${Num(e.fog)} times you walked into that fog before it would let you through. I'd turn you round, and back you'd come.`], ['linnet', `{happy}Only ${numWords(e.fog)}?`]],
            () => `{name} in the fog again. The ${ordWords(e.fog)} time. Turned her round. Tightened.`);
        const rang = e.keptWell && e.rings >= 2;
        add('bell', e.bell || e.rings >= 1, `rang the Bell at the Well (S09): ${e.bell ? 'yes' : 'no'}; with Gran by ${e.rings}` + (e.keptWell ? ' (a number from 2)' : ' (not counted from before the Bell: no number)'), ['bell'], rang ? 66 : 60, 70, 3,
            () => [['gran', rang ? `{cross}${Num(e.rings)} times you rang that Bell at my Well. I asked you not to, every time. The whole Spool groaned.` : '{cross}You rang that Bell at my Well. The whole Spool groaned.'], ['linnet', '{happy}I used to do that.']],
            () => '{name} rang the Bell at the Well. Asked her not to.' + (rang ? ` That makes ${numWords(e.rings)}.` : ''));
        const lw = e.lean && e.lean[0], ln = e.lean ? e.lean[1] : 0;
        add('lean', ln >= 4, e.lean ? `leant on ${lw} most: ${ln} (from 4)` : 'leant on nobody', ['lean'], 55 + Math.min(15, ln), 55, 2,
            () => [['gran', `{happy}${Num(ln)} times you leant on ${this.said(lw)}. I felt every one.`], ['linnet', '{happy}Somebody had to.']],
            () => `{name} leaning on ${this.written(lw)} again. The ${ordWords(ln)} time.`);
        add('waited', e.waited >= 5, `sat and waited ${e.waited} (from 5)`, ['waited'], 50, 40, 1.5,
            () => [['gran', `In the Houses you'd sit down and wait for everything to come home. ${Num(e.waited)} times. I'd feel you go still.`]],
            () => '{name} sat down in a House again and waited for it all to come home. She does that.');
        add('straight', e.kept && e.fog === 0 && e.atSelf === 0, `tally kept from the first step: ${e.kept ? 'yes' : 'no'}; turned round by the fog ${e.fog} (needs 0); cut before her own thread ${e.atSelf === null ? 'not seen' : e.atSelf} (needs 0)`, ['fog', 'cuts'], 45, 0, 0,
            () => [['gran', "{happy}That fog never had to turn you round once. And with the Shears, you didn't cut a soul loose before your own."], ['linnet', '{happy}Saving them for later.']]);
        add('nocut', e.atSelf === 0, `cut before her own thread ${e.atSelf === null ? 'not seen' : e.atSelf} (needs 0)`, ['cuts'], 40, 0, 0,
            () => [['gran', "{happy}You had the Shears, and you didn't cut a soul loose before your own."], ['linnet', '{happy}Saving them for later.']]);
        add('homeward', e.homeward >= 5, `Homeward to the Bedroll ${e.homeward} (from 5)`, ['home'], 35, 35, 3.5,
            /* (no number: the bench never says a count of times home, which is Gran's at the Spool and the ledger's) */
            () => [['gran', "{happy}You'd fly off to that Bedroll of yours from anywhere, wherever you'd left it lying. And me telling you to roll it up and bring it home."], ['linnet', "{happy}That's what it's for, Mum."]],
            () => '{name} off home to her Bedroll again. Not here.');
        /* for the ledger only */
        add('peep', e.peep, `looked through the peephole into Gran's study: ${e.peep ? 'yes' : 'no'}`, ['peep'], 0, 95, 4, null,
            () => 'Somebody at the little hole in my study wall. {name}. Let her look.');
        add('tuck', e.tuck >= 2, `Tuck's own thread pulled ${e.tuck} (from 2)`, ['tuck'], 0, 60, 5, null,
            () => '{name} pulling Tuck home by his own thread, from underneath. He laughs.');
        return L;
    },
    /* the bench: the best single thing, then a contradiction if there is one (or else the next best thing); the ledger:
       the four that weigh most there, in the order they happened. Never two things about the same evidence. */
    pick(e) {
        const c = this.cands(e).filter(x => x.ok), clash = (a, b) => !!(a && b && a.groups.some(g => b.groups.includes(g)));
        const by = k => (a, b) => b[k] - a[k];
        const contra = c.filter(x => x.contra).sort(by('w'))[0] || null;
        const singles = c.filter(x => !x.contra && x.w > 0 && !clash(x, contra)).sort(by('w'));
        const one = singles[0] || null, two = contra || singles.find(x => !clash(x, one)) || null;
        const ledger = [];
        for (const x of c.filter(x => x.lw > 0).sort(by('lw'))) if (ledger.length < 4 && !ledger.some(y => clash(x, y))) ledger.push(x);
        ledger.sort((a, b) => a.ord - b.ord);
        return { bench: [one, two].filter(Boolean), ledger, contra: !!(two && two.contra) };
    },
    BASE: [['gran', '{happy}I felt every step of your Wander, love. Every fall, every tug on your thread, right up to the fog.']],
    END: [['gran', "{sad}After the fog I couldn't feel you at all. So let me look at you."], ['gran', "...Your scarf's crooked."], ['linnet', 'Leave it, Mum.'], ['gran', "{happy}I'm leaving it."]],
    /* what's said on the bench: Gran's lines, and what's said back where there's room (four at most before the end),
       the contradiction's first */
    benchLines(e) {
        const { bench, contra } = this.pick(e), parts = bench.map(x => x.say(e)), keep = parts.map(() => 0);
        let room = 4 - parts.length;
        for (const i of (contra ? [1, 0] : [0, 1]).filter(i => i < parts.length)) { const n = parts[i].length - 1; if (n <= room) { keep[i] = n; room -= n; } }
        const out = parts.length ? [] : this.BASE.slice();
        parts.forEach((p, i) => out.push(...p.slice(0, 1 + keep[i])));
        return out.concat(this.END);
    },
    /* the count as she gave it at the Spool (src/75_greatspool.js granCount), the same number */
    brought(e) {
        if (e.home === null) return 'Brought her home every time, this Wander.';
        return !e.home ? 'Never once had to bring her home, this Wander.' : e.home === 1 ? 'Brought her home once, this Wander.' : `Brought her home ${numWords(e.home)} times, this Wander.`;
    },
    ledgerLines(e) {
        const q = s => '"' + s + '"', ent = this.pick(e).ledger.map(x => q(x.write(e))), out = ["Down the steps it's cool and quiet. On the cushion, her ledger lies open near the back, at a page in her small, careful hand."];
        for (let i = 0; i < ent.length; i += 2) out.push(ent.slice(i, i + 2).join(' '));
        out.push(q('{name} at the fog with the Shears.') + ' Under that, nothing. The rest of the page is empty, all the way down, but for one line at the very bottom, in fresh ink:');
        out.push(q(this.brought(e) + ' Last night she fell out of bed. Nobody caught her. She laughed.'));
        return out;
    },

    /* ---------------- the bench and the cellar ---------------- */
    /* (wherever the two of them are after the end, together: on the bench by Gran's gate, as built, or anywhere else) */
    offers(npc) {
        const a = npc && npc.area, here = w => a.ents.some(e => e.kind === 'npc' && e.who === w && !e.removed);
        return Progress.flag('unwound') && !Progress.flag('aft:sat') && !!a && (npc.who === 'gran' || npc.who === 'linnet') && here('gran') && here('linnet');
    },
    *bench() {
        const p = G.player, a = G.map; if (!p || !a) return;
        const g = a.ents.find(e => e.kind === 'npc' && e.who === 'gran' && e.seated), l = a.ents.find(e => e.kind === 'npc' && e.who === 'linnet' && e.seated);
        /* not side by side on a bench: the same words, standing with them */
        if (!g || !l || g.ty !== l.ty || Math.abs(g.tx - l.tx) !== 2) {
            if ((yield* ask(null, 'Stay with them a while?', ['Stay', 'Not now'])) !== 0) return;
            yield* say(null, 'You stay a while, the three of you, not saying much.');
            for (const [who, t] of this.benchLines(this.evidence())) yield* say(who, t);
            Progress.set('aft:sat');
            return;
        }
        const i = yield* ask(null, 'Between them, the middle of the bench is free.', ['Sit down', 'Not now']);
        if (i !== 0) return;
        if (p.carry || p.ride) { UI.toast('Not with your hands full.'); return; }
        /* sat in the middle, drawn there; standing, for the game, on the tile in front (so she's drawn after the bench) */
        const seat = { tx: (g.tx + l.tx) / 2, ty: g.ty }, me = (x, y) => x === p.tx && y === p.ty;
        const spot = [[seat.tx, seat.ty + 1], [seat.tx - 1, seat.ty + 1], [seat.tx + 1, seat.ty + 1]].find(([x, y]) => me(x, y) || (!p.solidAt(x, y) && !a.at(x, y))) || [p.tx, p.ty];
        const hold = { blocks: (x, y, who) => who !== p && x === spot[0] && y === spot[1] };
        a.blockers.push(hold);
        p.x = spot[0] * T + 8; p.y = spot[1] * T + 10; p.walking = false; p.dir = UP; p.benchSeat = seat;
        Sfx.play('land');
        yield 12;
        yield* say(null, "You sit down between them. It's still warm in the middle, where the cat was.");
        for (const [who, t] of this.benchLines(this.evidence())) yield* say(who, t);
        p.benchSeat = null; const j = a.blockers.indexOf(hold); if (j >= 0) a.blockers.splice(j, 1);
        Progress.set('aft:sat');
    },
    *ledger() {
        const i = yield* ask(null, 'Go down the steps?', ['Go down', 'Leave it']);
        if (i !== 0) return;
        yield* fadeOut(24);
        for (const l of this.ledgerLines(this.evidence())) yield* say(null, l);
        Progress.set('aft:ledger');
        yield* fadeIn(24);
    },

    /* ---------------- for developers: what was found, and why each thing was or wasn't said ---------------- */
    explain() {
        const e = this.evidence(), c = this.cands(e), { bench, ledger } = this.pick(e);
        return {
            stage: !Progress.flag('unwound') ? 'before the end: a live look (nothing is said yet)' : Progress.get('aft:snap') ? 'after the end: as noted when the threads went slack' : 'after the end',
            evidence: e,
            candidates: c.map(x => ({ id: x.id, holds: x.ok, why: x.why, about: x.groups, bench: x.w, ledger: x.lw })),
            bench: bench.map(x => x.id), ledger: ledger.map(x => x.id),
            lines: { bench: this.benchLines(e).map(([w, t]) => w + ': ' + Story.fill(t)), ledger: this.ledgerLines(e).map(t => Story.fill(t)) },
        };
    },
};

/* ---------------- the hooks: counting, the note at the Unwinding, and the two places it's told ---------------- */
{
    const begin1 = Story.begin;
    Story.begin = function () { const r = begin1.apply(this, arguments); After.watch(); return r; };
    const apply1 = Save.apply;
    Save.apply = function () { const r = apply1.apply(this, arguments); After.watch(); return r; };
    /* her own thread: each "not yet"; and, when it's cut, how many people she'd cut loose before it */
    const self1 = Shears.selfCut;
    Shears.selfCut = function* () {
        const was = Progress.flag('cut_self');
        yield* self1.apply(this, arguments);
        if (was) return;
        if (Progress.flag('cut_self')) Stats.c['aft:cutsAtSelf'] = Stats.c['cut:people'] || 0;
        else Stats.count('aft:no:self');
    };
    /* other people's: who, in what order; and each "not yet" */
    const person1 = Shears.cutPerson;
    Shears.cutPerson = function* (n) {
        const who = n && n.who, was = !who || Progress.flag('cut:' + who);
        yield* person1.apply(this, arguments);
        if (was) return;
        if (Progress.flag('cut:' + who)) After.noteCut(who); else Stats.count('aft:no:' + who);
    };
    /* the Bell rung at the Well with Gran standing by it (she asks you not to, every time) */
    const ring1 = TOOLS.bell.use;
    TOOLS.bell.use = function (p) {
        const cool = this.cool > 0;
        ring1.call(this, p);
        if (cool || !p || !p.area || !nearWell(p, 3) || Progress.flag('great_pull')) return;
        const gran = p.area.ents.find(e => e.kind === 'npc' && e.who === 'gran');
        if (gran && Math.hypot(gran.tx - p.tx, gran.ty - p.ty) < 12) Stats.count('aft:well');
    };
    /* the evidence noted the moment the threads go slack (before the Unwinding frees everyone at once) */
    const unwind1 = Ending.unwinding;
    Ending.unwinding = function* () { After.freeze(); return yield* unwind1.apply(this, arguments); };
    /* the bench: after whatever Gran or Linnet says first, the seat between them */
    const talk1 = Story.talk;
    Story.talk = function (npc) {
        const base = talk1.call(this, npc);
        if (!After.offers(npc)) return base;
        return function* () { if (base) yield* base(); if (After.offers(npc)) yield* After.bench(); };
    };
    /* the cellar, open: down the steps to the ledger */
    const cellar1 = Story.cellarDoor;
    Story.cellarDoor = function* () { yield* cellar1.apply(this, arguments); if (Progress.flag('unwound')) yield* After.ledger(); };
    /* sat on the bench: drawn the way the bench draws whoever sits on it (in it, to the waist) */
    const draw1 = Player.prototype.draw;
    Player.prototype.draw = function (cx, cy) {
        const s = this.benchSeat;
        if (!s || this.hidden) return draw1.call(this, cx, cy);
        const im = personFrame('wren', DOWN, 0);
        if (im) Gfx.sub(im, 0, 0, 16, im.height - 5, s.tx * T - cx, s.ty * T - cy + 11 - im.height);
    };
}
HW.afterword = function () { return HEADLESS || G.debug ? After.explain() : null; };
