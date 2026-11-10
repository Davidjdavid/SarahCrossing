/* The Great Pull and the Great Spool. Back from the Drift on foot, Wren finds Gran winding the whole valley in:
   everyone with a thread (everyone not cut free) dragged in a ring round the Well, threads streaming down it. The
   Well's cap is gone; down it, the Great Spool: the six Knots of the Wander, each tied in a room that remembers its
   House (and everything learnt since), to be untied; and at the top, Gran at the Spool. She can't pull Wren. She pulls
   everything else. Six great threads hold the Spool to the walls; the Shears. Then Linnet comes down the Well. */

THEMES.spool = { floor: ['#2a2840', '#201e34', '#3a3854', '#141224'], wall: ['#3a3456', '#2a2440', '#52487a', '#141024'], stone: ['#4a4466', '#36304e', '#6a6488', '#1e1a2e'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#0c0a16' };
FLOORS.spool = {
    floor: (x, th, v) => { fill(x, '#2a2840'); speckle(x, ['#24223a', '#322f4a'], 20 + v, 0.25); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#a8784a']; if (v % 3 === 0) fill(x, shade(cols[v % 8], -0.35), 0, 7, 16, 1); },
    floor2: (x, th, v) => { fill(x, '#3a3854'); speckle(x, ['#4a4864', '#2a2840'], 30 + v, 0.3); },
    floor3: (x, th, v) => { fill(x, '#141224'); for (let i = 1; i < 16; i += 2) fill(x, '#2a2440', i, 0, 1, 16); },
};
WALLS.spool = {
    edge: '#0c0a16',
    top: (x) => { fill(x, '#1e1a2e'); speckle(x, ['#2a2440'], 10, 0.2); },
    face: (x, th, v) => { fill(x, '#3a3456'); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8']; for (let y = 1; y < 15; y += 2) fill(x, cols[(y + v) % 6], 0, y, 16, 1); fill(x, '#0c0a16', 0, 15, 16, 1); },
};
const KNOT_HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const KNOT_COL = { tidy: THREAD.ives, kiln: THREAD.bram, mill: THREAD.ambrose, belfry: THREAD.tess, slumber: THREAD.mallow, marionette: THREAD.jory };
const GREAT_ENTRY = { x: 29, y: 41 };
defHouse({
    id: 'greatspool', name: 'The Great Spool', place: 'The Great Spool', house: 'greatspool', theme: 'spool', thread: THREAD.hesper, music: 'pull',
    entry: GREAT_ENTRY, noNudges: true,
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' } },
    cells: {
        /* ---------------- the foot of the Well ---------------- */
        '1,3': {
            name: 'The Foot of the Well',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'sign', x: 11, y: 8, text: "Six Knots, tied in six rooms round the Spool's foot: the Wander's, every one you tied. A seventh place waits at the top, an empty peg, for the Wanderer's own." },
            ],
        },
        /* ---------------- the Slumberhouse's Knot: a drop, and home by the Bedroll ---------------- */
        '0,3': {
            name: "The Slumberhouse's Knot",
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#...................', '#vvvvvvvvvvvvvvvvvv#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'knotlock', x: 9, y: 8, house: 'slumber' },
                { k: 'sign', x: 16, y: 2, text: 'No stairs down, and none up. Somewhere of your own to come back to, then.' },
            ],
        },
        /* ---------------- the Marionette Hall's Knot: a puppet through the hole onto the plate, then the gate ---------------- */
        '2,3': {
            name: "The Marionette Hall's Knot",
            rows: ['####################', '#.........#........#', '#.........#........#', '#.........#..^^^...#', '#.........O........#', '..........#........#', '#.........#........#', '#####.#####........#', '#.........#........#', '#.........#........#', '####################'],
            ents: [
                { k: 'puppet', x: 7, y: 4, id: 'gsPuppet' },
                { k: 'plate', x: 14, y: 2, sig: 'gsMp' },
                { k: 'door', x: 5, y: 7, type: 'gate', when: 'gsMp', dir: 'h', passed: 'down', id: 'gsMGate' },
                { k: 'knotlock', x: 5, y: 9, house: 'marionette' },
            ],
        },
        /* ---------------- the hub: the Winding Room ---------------- */
        '1,2': {
            name: 'The Winding Room',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'deco', x: 7, y: 2, look: 'spoolpost', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], text: 'The foot of the Great Spool: a drum of thread as wide as a house, every colour, turning, and every turn a little tighter.' },
            ],
        },
        /* ---------------- the Tidyhouse's Knot: a place on the plate ---------------- */
        '0,2': {
            name: "The Tidyhouse's Knot",
            rows: ['####################', '#....#.............#', '#....#.............#', '#....#.............#', '#....#.............#', '#...................', '#....#.............#', '#....#.............#', '#....#.............#', '#....#.............#', '####################'],
            ents: [
                { k: 'door', x: 5, y: 5, type: 'gate', when: 'gsTp', dir: 'v', passed: 'left', id: 'gsTGate' },
                { k: 'plate', x: 12, y: 2, sig: 'gsTp' },
                { k: 'block', x: 14, y: 7, id: 'gsTBlock' },
                { k: 'knotlock', x: 2, y: 5, house: 'tidy' },
            ],
        },
        /* ---------------- the Kiln's Knot: the pot's shards fly home past the crystal ---------------- */
        '2,2': {
            name: "The Kiln's Knot",
            rows: ['####################', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '..........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '####################'],
            ents: [
                { k: 'eyelet', x: 14, y: 5 },
                /* and one on the near side, for the way back */
                { k: 'eyelet', x: 8, y: 8 },
                { k: 'knotlock', x: 16, y: 5, house: 'kiln' },
                { k: 'sign', x: 3, y: 2, text: 'A gap no one could jump, and a brass eye on the far side, waiting for a hook.' },
            ],
        },
        /* ---------------- the climb: Mill west, Belfry east, the top north ---------------- */
        '1,1': {
            name: 'The Climb',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'flag:spool_all', dir: 'h', id: 'gsTop' },
                { k: 'sign', x: 11, y: 1, text: 'UP: THE SPOOL. (The way opens when every Knot is undone.)' },
            ],
        },
        /* ---------------- the Millrace's Knot: across the race on a raft ---------------- */
        '0,1': {
            name: "The Millrace's Knot",
            rows: ['####################', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~......', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '####################'],
            ents: [
                { k: 'raft', x: 13, y: 5, id: 'gsRaft', marked: false },
                { k: 'knotlock', x: 2, y: 5, house: 'mill' },
                { k: 'sign', x: 16, y: 8, text: 'Deep water, and a raft tied to nothing at all.' },
            ],
        },
        /* ---------------- the Belfry's Knot: a sleeper in the doorway; ring it home ---------------- */
        '2,1': {
            name: "The Belfry's Knot",
            rows: ['####################', '#.........#........#', '#.........#........#', '#.........#........#', '#.........#........#', '...................#', '#.........#........#', '#.........#........#', '#.........#........#', '#.........#........#', '####################'],
            ents: [
                { k: 'block', x: 13, y: 8, id: 'gsBBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [10, 5], trace: [[13, 8], [12, 8], [11, 8], [11, 7], [11, 6], [11, 5], [10, 5]], noPush: true, pushLine: "A boulder fast asleep in the doorway. It won't budge for anything but a bell." },
                { k: 'knotlock', x: 16, y: 3, house: 'belfry' },
            ],
        },
        /* ---------------- the top of the Spool ---------------- */
        '1,0': {
            name: 'The Top of the Spool',
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'greatspool', x: 8, y: 1, id: 'theSpool' },
                { k: 'greatpost', x: 1, y: 2, house: 'tidy' }, { k: 'greatpost', x: 18, y: 2, house: 'kiln' }, { k: 'greatpost', x: 1, y: 5, house: 'mill' },
                { k: 'greatpost', x: 18, y: 5, house: 'belfry' }, { k: 'greatpost', x: 1, y: 8, house: 'slumber' }, { k: 'greatpost', x: 18, y: 8, house: 'marionette' },
            ],
        },
    },
});

/* a Knot of the Wander, tied into the Spool: untie it */
class KnotLock extends GridThing {
    constructor(tx, ty, p = {}) { super('knotlock', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true, noCut: true, noCutLine: "It isn't a thread to cut. It's a Knot. Knots are undone with fingers." }, p)); }
    get undone() { return Progress.flag('untie:' + this.house); }
    interact() {
        if (this.undone) { UI.toast('Undone. Its thread hangs slack.'); return true; }
        const h = this.house;
        Script.run(function* () {
            const i = yield* ask(null, `The ${HOUSE_NAMES[h]}'s Knot: the one you tied, pulled tight into the Spool's own thread. Untie it?`, ['Untie it', 'Not yet']);
            if (i !== 0) return;
            Progress.set('untie:' + h); Sfx.play('unclick'); Sfx.play('knot'); G.shake = 6; Stats.count('untied');
            const n = KNOT_HOUSES.filter(k => Progress.flag('untie:' + k)).length;
            yield* say(null, n < 6 ? `It comes undone in your fingers, and somewhere above, the Spool shudders and slows. (${n} of 6.)` : 'The sixth Knot comes undone. Overhead, the Great Spool groans, and stops turning, and for the first time in your life there is no sound of winding anywhere.');
            if (n >= 6) { Progress.set('spool_all'); Progress.setGoal('Up the Climb to the top of the Spool. Gran is there.'); }
            else Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${n} of 6).`);
            Save.autosave();
        });
        return true;
    }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, col = KNOT_COL[this.house];
        Gfx.line(x + 8, y - 30, x + 8, y + 2, this.undone ? shade(col, -0.4) : col);
        if (this.undone) { Gfx.line(x + 8, y + 2, x + 4, y + 12, shade(col, -0.4)); return; }
        Gfx.circle(x + 8, y + 6, 6, col); Gfx.circle(x + 8, y + 6, 3, shade(col, 0.35)); Gfx.rect(x + 4, y + 4, 8, 1, shade(col, -0.4));
        if ((G.t >> 4) % 2) Gfx.rect(x + 7, y - 2, 2, 2, '#ffffff');
    }
}
SPAWN.knotlock = (x, y, p) => new KnotLock(x, y, p);
const HOUSE_NAMES = { tidy: 'Tidyhouse', kiln: 'Kiln', mill: 'Millrace', belfry: 'Belfry', slumber: 'Slumberhouse', marionette: 'Marionette Hall' };

/* ---------------- the top: the Spool, its six great threads, Gran ---------------- */
class GreatPost extends GridThing {
    constructor(tx, ty, p = {}) { super('greatpost', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true }, p)); this.cuttable = true; }
    get cut() { return Progress.flag('great:' + this.house); }
    onCut() {
        if (this.cut || !Progress.flag('spool_met')) return;
        Progress.set('great:' + this.house); Sfx.play('snip'); G.shake = 8; Fx.ring(this.tx * T + 8, this.ty * T, KNOT_COL[this.house]);
        const n = KNOT_HOUSES.filter(h => Progress.flag('great:' + h)).length;
        if (n >= 6) Script.run(GreatSpool.finale(), { name: 'finale' });
        else { UI.toast(`A great thread parts with a sound like a bell cracking. (${n} of 6.)`, 120); Save.autosave(); }
    }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, col = KNOT_COL[this.house];
        Gfx.rect(x + 3, y - 10, 10, 26, '#4a4466'); Gfx.rect(x + 4, y - 10, 8, 26, '#6a6488'); Gfx.rect(x + 2, y - 12, 12, 3, col);
        if (!this.cut) { const s = this.area.find('theSpool'); if (s) { Gfx.line(x + 8, y - 6, s.tx * T + 32 - cx, s.ty * T + 16 - cy, col); Gfx.line(x + 8, y - 5, s.tx * T + 32 - cx, s.ty * T + 17 - cy, shade(col, -0.3)); } }
        else Gfx.line(x + 8, y - 6, x + 14, y + 4, shade(col, -0.4));
    }
}
SPAWN.greatpost = (x, y, p) => new GreatPost(x, y, p);
class SpoolDrum extends Ent {
    constructor(tx, ty, p = {}) { super('greatspool', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = 0; this.junk = []; }
    get sortY() { return this.y + 40; }
    onAdd(area) { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) area.staticSolid.add((this.ty + j) * 4096 + this.tx + i); }
    update() {
        this.t++;
        const p = G.player, a = this.area;
        /* Gran pulls everything else: things fly in from the walls toward the Spool (they'd knock you flat, if there were
           anything left in you to unravel; as it is, they knock you about) */
        if (Progress.flag('spool_met') && !Progress.flag('unwound') && !Script.blocking()) {
            if (this.t % 80 === 0) {
                const r = a.roomAt(this.tx, this.ty), y = r.y + 3 + Math.floor(G.rng() * 6), fromL = G.rng() < 0.5;
                this.junk.push({ x: (fromL ? r.x + 1 : r.x + r.w - 2) * T + 8, y: y * T + 8, tx: (this.tx + 2) * T, ty: (this.ty + 1) * T + 8, k: Math.floor(G.rng() * 3) });
            }
            for (const j of this.junk) {
                const dx = j.tx - j.x, dy = j.ty - j.y, d = Math.hypot(dx, dy);
                if (d < 4) { j.gone = true; continue; }
                j.x += dx / d * 1.6; j.y += dy / d * 1.6;
                if (p.area === a && p.state === 'normal' && Math.abs(p.x - j.x) < 8 && Math.abs(p.y - 6 - j.y) < 8) { p.hurt(1, j.x, j.y); j.gone = true; }
            }
            this.junk = this.junk.filter(j => !j.gone);
        }
    }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#a8784a', '#f0e6d0'];
        Gfx.rect(x - 4, y - 6, 72, 6, '#4a4466'); Gfx.rect(x - 4, y + 28, 72, 6, '#4a4466');
        const turn = Progress.flag('spool_all') ? 0 : this.t;
        for (let i = 0; i < 28; i++) Gfx.rect(x, y + i, 64, 1, cols[(i + (turn >> 3)) % cols.length]);
        for (const j of this.junk) Gfx.img(spr(['block_wood', 'pot', 'crate'][j.k]) || spr('block_wood'), j.x - cx - 8, j.y - cy - 12);
    }
}
SPAWN.greatspool = (x, y, p) => new SpoolDrum(x, y, p);

const GreatSpool = {
    /* stepping into the top room: Gran */
    tick(a) {
        const p = G.player, r = Cam.room;
        if (!Progress.flag('spool_all') && !Progress.flag('gs_entered')) { Progress.set('gs_entered'); Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${KNOT_HOUSES.filter(k => Progress.flag('untie:' + k)).length} of 6).`); }
        if (r && r.key === '0,3' && p.ty >= r.y + 7 && !(Inv.bedroll && Inv.bedroll.area === a.id && Inv.bedroll.ty < r.y + 6)) {
            this.below = (this.below || 0) + 1;
            if (this.below === 900) UI.toast("No way back up from down here. (Pause, then Save: Back to the House's door.)", 240);
        } else this.below = 0;
        if (!Progress.flag('spool_met') && r && r.name === 'The Top of the Spool' && p.state === 'normal' && !Script.blocking() && !Cam.busy) Script.run(this.meet());
        /* back after a save: Gran is still at the Spool; and if every great thread was cut, the end goes on */
        if (Progress.flag('spool_met') && !Progress.flag('unwound')) {
            const s = a.find('theSpool');
            if (s && !a.ents.some(e => e.who === 'gran')) a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
            if (KNOT_HOUSES.every(h => Progress.flag('great:' + h)) && !Script.running('finale') && !Script.blocking()) Script.run(this.finale(), { name: 'finale' });
        }
    },
    *meet() {
        Progress.set('spool_met');
        const a = G.map, s = a.find('theSpool');
        if (!a.ents.some(e => e.who === 'gran')) a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
        Music.play('pull');
        yield 20;
        yield* say('gran', "You came back. You walked. I felt you go out past the edge, love, and I pulled, and I pulled, and there was nothing on the end.");
        yield* say('gran', "So I pulled everything else. Everyone. Down here, safe, where nobody can wander off. Where nobody gets lost.");
        yield* say('wren', "You can't pull me, Gran.");
        yield* say('gran', "...No. I can't, can I.");
        yield* say(null, "Her hands don't stop. The Spool's six great threads, one to every House, hum like bowstrings. Things come flying off the walls toward the drum: pots, crates, blocks, every marked thing in the valley, wound in.");
        Progress.setGoal('Cut the Spool\'s six great threads, at their posts round the walls.');
    },
    *finale() {
        const a = G.map, p = G.player;
        Progress.set('spool_cut');
        G.shake = 14; Sfx.play('rumble');
        yield 30;
        const gran = a.ents.find(e => e.who === 'gran');
        yield* say(null, "The last great thread parts. The Spool lurches, and everything it was winding goes slack at once: in the walls, overhead, all the way up the Well, a long, long sigh of thread.");
        yield* say('gran', "Don't. Don't, love, please. If I let go, I'll lose them. I'll lose you. I lost her.");
        const r = a.rooms.find(q => q.name === 'The Top of the Spool');
        const linnet = a.add(new NPC(r.x + 9, r.y + 9, { who: 'linnet', face: 'up' }));
        Fx.poof(linnet.px + 8, linnet.py + 8);
        yield 20;
        yield* say('linnet', "Mum.");
        yield* say(null, "Gran's hands go still on the Spool.");
        yield* say('linnet', "I came back. Nobody pulled me. I walked all the way, because I wanted to.");
        yield* say('linnet', "That's the only way anyone ever really comes home, Mum. You have to let them choose it.");
        const i = yield* ask(null, "Gran looks at you. You hold out your hand.", ['Let go, Gran.', 'Come home with us.']);
        yield* say('gran', i === 0 ? "...Let go." : "...Home.");
        yield* say(null, "And she takes her hands off the Spool, and puts one in yours, and one in Linnet's.");
        yield* Ending.unwinding();
    },
};

/* ---------------- the Great Pull, up in the town ---------------- */
{
    const tick0 = OW.blocks['1,1'].tick;
    OW.blocks['1,1'].tick = a => {
        if (tick0) tick0(a);
        if (!Progress.flag('great_pull') || Progress.flag('unwound')) return;
        /* everyone with a thread is dragged in a ring round the Well */
        /* (the townsfolk, in town: in an arc round the Well, its south side left open so you can get to it) */
        const pulled = a.ents.filter(n => n.kind === 'npc' && !n.cutFree && !Progress.flag('cut:' + n.who) && n.who !== 'gran' && n.who !== 'linnet' && n.tx >= 64 && n.tx < 128 && n.ty >= 40 && n.ty < 80);
        const fresh = pulled.filter(n => !n.dragged);
        if (fresh.length) pulled.forEach((n, i) => {
            const t = Math.PI / 2 + 0.75 + (2 * Math.PI - 1.5) * i / Math.max(1, pulled.length - 1);
            let rx = 95 + Math.round(Math.cos(t) * 6), ry = 59 + Math.round(Math.sin(t) * 4);
            while (pulled.some(q => q !== n && q.dragTo && q.dragTo[0] === rx && q.dragTo[1] === ry)) ry--;
            n.dragTo = [rx, ry];
            n.route = [[rx, ry, 9999]]; n.ri = 0; n.routeWait = 0; n.routeSpeed = 0.5; n.free = true; n.dragged = true; n.path = null;
        });
        if (!Progress.flag('pull_seen') && G.player && G.player.area === a && Math.hypot(G.player.tx - 95, G.player.ty - 60) < 14) {
            Progress.set('pull_seen');
            const nd = a.ents.filter(e => e.dragged).length;
            Script.run(function* () {
                if (nd) yield* say(null, "The town square. " + (nd > 6 ? 'Everyone you know is' : 'The few with threads still on them are') + " shuffling towards the Well, step by step, threads streaming from them down into it. Their feet don't want to; their threads do.");
                else yield* say(null, "The town square. Everyone you cut free is standing about the Well, watching. Threads are pouring into it from every direction: from the hills, the river, the fields, every marked thing in the valley. Nobody here is being pulled. You saw to that.");
                yield* say(null, "The Well's cap is gone. Threads pour into the dark like water going down a drain.");
                Progress.setGoal('Down the Well, to the Great Spool.');
            });
        }
    };
    /* while the Pull goes on, the dragged are drawn with their threads streaming to the Well */
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        if (this.dragged && !this.cutFree && Progress.flag('great_pull') && !Progress.flag('unwound') && this.area && this.area.id === 'hollow') {
            const col = (PEOPLE_DEF[this.who] && PEOPLE_DEF[this.who].col) || THREAD.town;
            Gfx.alpha(0.6); Gfx.line(this.px + 8 - cx, this.py + 6 - cy, 95 * T + 8 - cx, 59 * T - cy, col); Gfx.alpha(1);
        }
        return draw0.call(this, cx, cy);
    };
    /* talking to them meanwhile */
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && npc.area && npc.area.id === 'hollow') {
            if (Progress.flag('cut:' + npc.who)) return function* () { yield* say(npc.who, "We're all right! Nothing's got hold of us! Go on, Wren!"); };
            if (npc.dragged) return function* () { yield* say(npc.who, ["I can't... stop... walking. Wren? Is that you?", "My feet won't listen. It's the Well. It wants us.", "Go on, love. Down the Well. Don't mind us."][Math.floor(G.rng() * 3)]); };
        }
        /* everyone else with a thread, wherever they are, is holding on to something */
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && !Progress.flag('cut:' + npc.who) && npc.who !== 'gran' && npc.who !== 'linnet' && PEOPLE_DEF[npc.who]) {
            return function* () { yield* say(npc.who, ["It's pulling. Toward the town, toward the Well. I've got my arm round the post, love, I'm all right. Go on.", "Can you feel it? No. No, you can't, can you. Go on, then. Go and stop it."][Math.floor(G.rng() * 2)]); };
        }
        return talk0.call(this, npc);
    };
}
/* the Well, open */
{
    const deco0 = SPAWN.deco;
    SPAWN.deco = (tx, ty, p) => {
        const pr = deco0(tx, ty, p);
        if (p.id === 'well') {
            const i0 = pr.interact;
            pr.interact = () => {
                if (Progress.flag('great_pull') && !Progress.flag('unwound')) {
                    Script.run(function* () {
                        const i = yield* ask(null, "The Well's cap is gone. Every thread in the valley pours down into the dark. Go down?", ['Down the Well', 'Not yet']);
                        if (i === 0) World.go('greatspool', GREAT_ENTRY.x, GREAT_ENTRY.y, { dir: UP, fade: true });
                    });
                    return true;
                }
                return i0 ? i0() : false;
            };
        }
        return pr;
    };
}
AREAS.greatspool.tick = a => GreatSpool.tick(a);
/* the Well brings you back up (and the foot of the Well is where you'd fall to, if you fell) */
AREAS.greatspool.ents.push({ k: 'warp', x: 29, y: 42, to: 'hollow', tx2: 95, ty2: 60, face: 'down', room: '1,3' }, { k: 'deco', x: 29, y: 42, look: 'stairs_up', solid: false, baseY: -100, room: '1,3' });

function initGreatSpool() {
    ART.spoolpost = paintSprite(96, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8']; R('#2a2440', 0, 0, 96, 24); for (let i = 0; i < 22; i++) R(cols[i % 6], 2, 1 + i, 92, 1); });
    SPR.spoolpost = ART.spoolpost;
}
CONTENT_INIT.push(initGreatSpool);

/* Gran at the Spool: talking to her, before it's over */
{
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (npc.who === 'gran' && npc.area && npc.area.id === 'greatspool' && !Progress.flag('unwound')) return function* () { yield* say('gran', cycle('gran_spool', ["Go home, love. Please. Go home and let me hold on.", "Twenty-five years I've held on. I can't stop now. If I stop, they'll all go.", "Don't look at me like that. You've your mother's look. And hers."])); };
        return talk0.call(this, npc);
    };
}
/* while the Pull goes on, nobody with a thread is indoors or down below: they're all out at the Well, or holding on */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && (a.family === 'interior' || id === 'underside'))
            for (const e of a.ents.slice()) if (e.kind === 'npc' && PEOPLE_DEF[e.who] && !Progress.flag('cut:' + e.who) && e.who !== 'gran') a.remove(e);
        return a;
    };
}
