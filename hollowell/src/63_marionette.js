/* House 6: the Marionette Hall, at Larkspur Fair. Jory's House, crimson threads. A theatre with nobody in the
   seats. Remote bodies: toy soldiers that march till they meet something and turn (shape their beat and they
   press plates for you); painted flats that look like walls until a knock shows the cardboard; and, from
   Captain Tin, the Crossbar: puppets walked from a distance, through little holes, over nails, three at once
   on a rack. Old rules join in: strays stay where they're pushed, the Bedroll gets you home from under the
   stage. The Great Marionette dances on its strings; walk your own puppets round its feet till the strings
   tangle and down it comes. And the curtain falls on whoever was working it. (Reveal 1.) */

THEMES.marionette = { floor: ['#c8a878', '#a07e52', '#e0c494', '#76583a'], wall: ['#9a1e36', '#6a1426', '#c42b4a', '#3a0a16'], stone: ['#9a8a7a', '#7a6a5a', '#bcae9e', '#4e4238'], water: ['#5fb5e8', '#3f8fd8', '#a5dcf7', '#2b5aa8'], dark: '#1a0a10' };
FLOORS.marionette = {
    /* stage boards, red carpet with a gold edge, the dark of the wings */
    floor: (x, th, v) => Paint.planks(x, ['#c8a070', '#a07a4a', '#dcb886', '#6e4e2e'], v, false),
    floor2: (x, th, v) => { fill(x, '#a8203a'); speckle(x, ['#b8304a', '#982038'], 50 + v, 0.3); fill(x, '#f7d64a', 0, 0, 16, 1); },
    floor3: (x, th, v) => { fill(x, '#3a2a30'); speckle(x, ['#4a3a40', '#2a1a20'], 30 + v, 0.3); },
};
WALLS.marionette = {
    edge: '#1a0a10',
    top: (x) => { fill(x, '#3a0a16'); speckle(x, ['#5a1426'], 8, 0.15); },
    face: (x, th, v) => {
        fill(x, '#9a1e36'); for (let i = 0; i < 16; i += 4) fill(x, '#7a1428', i, 0, 1, 12);
        fill(x, '#f7d64a', 0, 12, 16, 1); fill(x, '#c8a070', 0, 13, 16, 2); fill(x, '#1a0a10', 0, 15, 16, 1);
    },
};

const MARIONETTE_OUT = { x: 31, y: 40 + 10 };     /* the doors out, onto the fair */

defHouse({
    id: 'marionette', name: 'The Marionette Hall', place: 'The Marionette Hall', house: 'marionette', theme: 'marionette', thread: THREAD.jory, music: 'marionette',
    knotName: 'Dancing Knot',
    entry: MARIONETTE_ENTRY,
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' }, ';': { k: 'floor', p: 'floor2' } },
    cells: {
        /* ---------------- 1 The Foyer: toy soldiers on parade; a wall that's only a painted flat ---------------- */
        '1,3': {
            name: 'The Foyer',
            rows: [
                '#########.##########',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;..........',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#########.##########',
            ],
            ents: [
                { k: 'flat', x: 19, y: 5, id: 'foFlat', look: 'flat_red' },
                { k: 'soldier', x: 3, y: 3, facing: 'right', id: 'foSol1' }, { k: 'soldier', x: 16, y: 7, facing: 'left', id: 'foSol2' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: MARIONETTE_OUT.x, ty2: MARIONETTE_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: "THE MARIONETTE HALL. Tonight: THE WANDERER. (Toy soldiers march till they meet something, then about turn. Don't be the something.)" },
                { k: 'deco', x: 2, y: 9, look: 'poster', solid: [[0, 0]], oy: -14, text: 'A poster: a girl with a stick, painted in bright colours, standing on a stage. Underneath: STARRING YOU.' },
            ],
            nudge: { solved: () => Progress.areaFlag('marionette', 'visited:boxoffice'), after: 60 * 60 * 3, at: [19, 5], say: "The east wall of the foyer is a slightly different red from the rest, and it isn't quite straight. As if it were only painted on something." },
        },
        /* ---------------- 2 The Box Office (behind the flat): the Plan ---------------- */
        '2,3': {
            name: 'The Box Office',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'chest', x: 10, y: 3, item: 'plan', id: 'boPlan' },
                { k: 'deco', x: 6, y: 6, look: 'booth', solid: [[0, 0], [1, 0]], oy: -12, text: 'The ticket booth. A ledger lies open: "THE WANDERER. Cast: one. Crew: six. Audience: the crew." Six names, rubbed out.' },
                { k: 'deco', x: 15, y: 2, look: 'poster', solid: [[0, 0]], oy: -14, text: "Old playbills, years and years of them. THE WANDERER. THE WANDERER. THE WANDERER. Every one a different face. One, a girl with green ribbons, has a moustache drawn on." },
            ],
        },
        /* ---------------- 3 The Auditorium (hub): rows of empty seats ---------------- */
        '1,2': {
            name: 'The Auditorium',
            rows: [
                '#########.##########',
                '#........;.........#',
                '#..................#',
                '#........;.........#',
                '#........;.........#',
                '.........;..........',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'auLockN' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'auLockE', dir: 'v' },
                { k: 'deco', x: 2, y: 3, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], text: 'Plush red seats. Nobody in them. There is a small dent in one, about the size of a grandmother.' },
                { k: 'deco', x: 11, y: 3, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'deco', x: 2, y: 7, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'deco', x: 11, y: 7, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'soldier', x: 9, y: 2, facing: 'right', id: 'auSol' },
                { k: 'sign', x: 17, y: 9, text: 'THE AUDITORIUM. Please do not talk during the performance. (There is no one to talk to.)' },
            ],
        },
        /* ---------------- 4 The Orchestra Pit: give the soldier a new beat across the plate (key A) ---------------- */
        '0,2': {
            name: 'The Orchestra Pit',
            rows: [
                '####################',
                '#...#..............#',
                '#...#..............#',
                '##.##..............#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 2, y: 3, type: 'gate', when: 'opp', id: 'opGate', passed: 'up' },
                { k: 'chest', x: 2, y: 1, item: 'key', id: 'opKey' },
                { k: 'plate', x: 9, y: 6, sig: 'opp', mode: 'pulse', time: 80 },
                { k: 'soldier', x: 5, y: 9, facing: 'right', turn: 'right', id: 'opSol' },
                { k: 'block', x: 10, y: 2, id: 'opBlock', marked: false },
                { k: 'deco', x: 14, y: 6, look: 'drum', solid: [[0, 0]], text: 'A big drum. Somebody has painted on it: PLAYED BY B.' },
                { k: 'sign', x: 17, y: 1, text: "THE ORCHESTRA PIT. Our drummer marches round and round the edge, turning right at every wall. He has never once crossed the middle. (The gate by the music stands keeps time with the drum-plate.)" },
            ],
            nudge: { solved: 'marionette_chest:opKey', after: 60 * 60 * 3, thing: 'opBlock', say: 'The drummer turns right at anything in his way, not only walls. Put something in his way, see where he goes instead, and be waiting at the gate when he crosses the plate.' },
        },
        /* ---------------- 5 Rehearsal Room: down the trapdoor for the key, home by the Bedroll (key B); S13 the Wren puppet ---------------- */
        '2,2': {
            name: 'The Rehearsal Room',
            rows: [
                '####################',
                '#..................#',
                '#..........#.......#',
                '#..........#.......#',
                '#..........#.......#',
                '...........#.......#',
                '#vvvvvvvvvv#.......#',
                '#..........#.......#',
                '#..........#.......#',
                '#........o.#.......#',
                '####################',
            ],
            ents: [
                { k: 'chest', x: 5, y: 8, item: 'key', id: 'rhKey' },
                { k: 'deco', x: 2, y: 9, look: 'prompter', solid: [[0, 0]], oy: -6, text: "The prompter's box, under the stage. A script lies open: THE WANDERER, ACT ONE. Every line you've said today is in it. Some you haven't said yet." },
                /* the stage set: the Tidyhouse's foyer in miniature, and a little wooden you (S13, with the Crossbar) */
                { k: 'rack', x: 15, y: 9, group: 'wren', id: 'rhRack' },
                { k: 'puppet', x: 13, y: 7, id: 'wrenPuppet', look: 'puppet_wren', group: 'wren' },
                { k: 'deco', x: 14, y: 2, look: 'set_tidy', solid: [[0, 0], [1, 0], [2, 0], [3, 0]], oy: -8, text: 'A stage set, built small: a grand foyer, a staircase, a portrait of a woman with a feather duster. You have been here. You have been here this week.' },
                { k: 'plate', x: 16, y: 4, sig: 'rhSet', puppetOnly: true },
                { k: 'chest', x: 17, y: 6, item: 'heartpatch', id: 'rhPatch', hidden: true, when: 'flag:s13' },
                { k: 'sign', x: 8, y: 1, text: "THE REHEARSAL ROOM. Mind the trapdoor. (There is no ladder. There has never been a ladder. Stagehands come up the hard way.)" },
            ],
            nudge: { solved: 'marionette_chest:rhKey', after: 60 * 60 * 3, at: [5, 5], say: "Under the stage there's no way back up. Unless you'd left somewhere to come home to." },
        },
        /* ---------------- 6 The Wings (mini-boss): Captain Tin marches; knock the flat and he marches on, down a trapdoor (the Crossbar) ---------------- */
        '1,1': {
            name: 'The Wings',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#.o..............o.#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'wiBig' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'flag:marionette_tin', keep: true, id: 'wiLockE', dir: 'v' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'tin' }, { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'tin' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'tin' },
                { k: 'flat', x: 4, y: 6, id: 'wiFlatW', look: 'flat_red', respring: true }, { k: 'flat', x: 15, y: 6, id: 'wiFlatE', look: 'flat_red', respring: true },
                { k: 'captain', x: 9, y: 6, id: 'tin' },
                { k: 'chest', x: 9, y: 3, item: 'crossbar', id: 'wiCrossbar', hidden: true, when: 'flag:marionette_tin', big: true },
            ],
        },
        /* ---------------- 7 The Dressing Rooms: a puppet through the holes, over the nails, onto the plate (key C) ---------------- */
        '0,1': {
            name: 'The Dressing Rooms',
            rows: [
                '####################',
                '#...#....^^....#...#',
                '#...O....^^....O...#',
                '#...#....^^....#...#',
                '##O#################',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'puppet', x: 2, y: 7, id: 'drPuppet' },
                { k: 'plate', x: 17, y: 2, sig: 'drp' },
                { k: 'chest', x: 10, y: 7, item: 'key', id: 'drKey', hidden: true, when: 'drp' },
                { k: 'deco', x: 8, y: 9, look: 'mirror', solid: [[0, 0]], oy: -12, text: 'A dressing-room mirror ringed with bulbs. Stuck in the frame: a sketch of the Kilnwyrm costume, with notes. "Tail: TOO FLOPPY. -J."' },
                { k: 'sign', x: 17, y: 9, text: 'THE DRESSING ROOMS. The little doors are for the little people.' },
            ],
            nudge: { solved: 'marionette_chest:drKey', after: 60 * 60 * 3, thing: 'drPuppet', say: 'The holes in the walls are puppet-sized. The puppet is right there.' },
        },
        /* ---------------- 8 The Prop Store: three puppets on one rack, three plates (the Pattern) ---------------- */
        '2,1': {
            name: 'The Prop Store',
            rows: [
                '##O##############.##',
                '#...###########....#',
                '#...#.........#....#',
                '#...#.....#...#....#',
                '#...#.#..##...#....#',
                '....#.#.......#....#',
                '#...#.........#....#',
                '#...###########....#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 17, y: 0, type: 'gate', when: 'wsp', id: 'psWorkshop', keep: true },
                { k: 'rack', x: 9, y: 8, group: 'trio', id: 'psRack' },
                { k: 'puppet', x: 5, y: 2, id: 'psA', group: 'trio' }, { k: 'puppet', x: 5, y: 4, id: 'psB', group: 'trio' }, { k: 'puppet', x: 5, y: 6, id: 'psC', group: 'trio' },
                { k: 'plate', x: 12, y: 4, sig: 'pp1' }, { k: 'plate', x: 11, y: 5, sig: 'pp2' }, { k: 'plate', x: 11, y: 6, sig: 'pp3' },
                { k: 'chest', x: 16, y: 8, item: 'pattern', id: 'psPattern', hidden: true, when: 'pp1&pp2&pp3', big: true },
                { k: 'puppet', x: 2, y: 3, id: 'psLone' },
                { k: 'sign', x: 18, y: 9, text: 'THE PROP STORE. Three understudies on one string. They do everything together. Everything.' },
            ],
            nudge: { solved: () => Inv.hasPattern('marionette'), after: 60 * 60 * 4, at: [9, 8], say: 'The three puppets step together, but a wall stops one and not the others. That is the whole trick: let the walls hold some back.' },
        },
        /* ---------------- 9 Jory's Workshop (signature): a puppet through the little door opens the big one ---------------- */
        '2,0': {
            name: "Jory's Workshop",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '##O##############.##',
            ],
            ents: [
                { k: 'plate', x: 2, y: 8, sig: 'wsp' },
                { k: 'signature', x: 10, y: 5, house: 'marionette' },
                { k: 'deco', x: 5, y: 2, look: 'workbench', solid: [[0, 0], [1, 0]], oy: -6, text: "Jory's bench: chisels, paint, a half-carved wooden face that looks a bit like Gran. A label: FOR THE LAST ACT. (NOT YET.)" },
                { k: 'deco', x: 14, y: 2, look: 'puppets_hung', solid: [[0, 0], [1, 0], [2, 0]], oy: -14, text: 'Puppets hanging on a rail: a Housekeeper, a wyrm in three pieces, a mill-beast, a gargoyle, a sloth in a nightcap. Every one you have met.' },
                { k: 'chest', x: 16, y: 5, item: 'b50', id: 'wsButtons' },
            ],
        },
        /* ---------------- 10 The Great Stage (boss) ---------------- */
        '1,0': {
            name: 'The Great Stage',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#;;;;;;;;;;;;;;;;;;#',
                '#;;;;;;;;;;;;;;;;;;#',
                '#########.##########',
            ],
            ents: [
                { k: 'marionette', x: 9, y: 3, id: 'greatMarionette' },
                { k: 'rack', x: 9, y: 8, group: 'boss', id: 'gsRack' },
                { k: 'puppet', x: 3, y: 6, id: 'gsWrenA', look: 'puppet_wren', group: 'boss' }, { k: 'puppet', x: 9, y: 6, id: 'gsWrenB', look: 'puppet_wren', group: 'boss' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
            ],
            nudge: { solved: 'reveal1', after: 60 * 60 * 3, at: [9, 5], say: "The great feet stamp, and every string runs straight up past them. A little Wren walked right round a foot, and round, would wind its own string round it. Two of them, round both feet at once..." },
        },
    },
    tick: a => MarionetteHall.tick(a),
    afterKnot: function* () { yield* MarionetteHall.afterKnot(); },
});

const MarionetteHall = {
    tick(a) {
        const r = Cam.room;
        if (r && r.key === '2,3') Progress.setAreaFlag('marionette', 'visited:boxoffice');
        /* S13: the little wooden Wren walked onto the set's mark */
        if (Signals.get(a, 'rhSet') && !Progress.flag('s13')) {
            Progress.set('s13'); Stats.count('secret:wrenpuppet');
            Sfx.play('appear');
            G.pendingToast = 'The little wooden you takes a bow on the miniature foyer. From somewhere above, very faintly, one pair of hands claps.';
        }
    },
    *afterKnot() {
        Progress.set('d6');
        yield* say(null, 'The Knot pulls tight. Up in the flies, six people you know very well start, very quietly, to cry.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 3, r.y + 9, { to: 'hollow', tx2: MARIONETTE_OUT.x, ty2: MARIONETTE_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 3, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
SIGNATURE_TEXT.marionette = "Carved into the bench, worn smooth by elbows: a little crimson J with a string tied round it. Someone signed this House where only a puppet-maker would ever sit.";
ITEM_LINES.crossbar = () => "You found the {red}Crossbar{/}! Face a puppet you can see and press [tool] to take up its strings: you stand still and it walks for you. [tool] again to let go, and it walks home. Some racks hold several puppets at once.";
ITEM_AFTER.crossbar = function* () { Inv.equipped = 'crossbar'; };

/* a flat that springs back up a while after it's knocked down (stagehands) */
{
    const knock = Flat.prototype.knock;
    Flat.prototype.knock = function () {
        const was = this.down;
        knock.call(this);
        if (!was && this.respring) this.springT = 300;
    };
    Flat.prototype.tick = function () {
        if (this.springT > 0 && --this.springT === 0 && this.down) {
            if (this.area.at(this.tx, this.ty) || (G.player && G.player.onTile(this.tx, this.ty)) || this.area.walkers.some(m => m.alive !== false && m.onTile && m.onTile(this.tx, this.ty))) { this.springT = 30; return; }
            this.down = false; this.area.place(this, this.tx, this.ty); Sfx.play('door'); Fx.dust(this.tx * T + 8, this.ty * T + 12);
        }
    };
}
