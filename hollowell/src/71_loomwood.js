/* The Loomwood (block 1,0): north of town, past the stone gate on the North Road (opened by the gate's counterweight
   in the Seams, src/69_reveal2.js). Silver birches, silk strung between the trees, moths, the fog close on the north
   and the west: the Frayed Edge, where strays turn up and Linnet's Stray House waits (O1, later). The Loom itself,
   the First Spinner's old place, in the north: nobody made it, nobody watches from underneath (D8, src/72_loom.js).
   Silk strands are walls here until the Shears cut them; one hides a clearing with a Heart Patch. */

const LOOMWOOD_ROWS = [
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%YYYY',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%YYYY',
    '%%%...........YYYYYYYYY........................~--~.........YYYY',
    '%%%.XXXXXXXX..YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY.~--~.YYYYYYYYYYYY',
    '%%%.XXXXXXXX..YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY"~--~.YYYYYYYYYYYY',
    '%%%.XXXXXXXX..YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY.~--~.YYYYYYYYYYYY',
    '%%%.XXXXXXXX..YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY.~--~.YYYYYYYYYYYY',
    '%%%...........YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY.~--~.YYYYYYYYYYYY',
    '%%%.,...::....YYYYYYYYY.XXXXXXXXXXXXXXXX.YYYYY.~--~.YYY....YYYYY',
    '%%%.....::........"...".XXXXXXXXXXXXXXXX.YYYYY"~--~.YYY....YYYYY',
    '%%%.....::..............::::::::::::::::.YYYYY.~--~.YYY....YYYYY',
    '%%%.....::..YYYYYYYYYYY.......::.........YYYYY.~--~.YYY....YYYYY',
    '%%%.....::..YYYYYYYYYYY.......::..YYYYYYYYYYYY.~--~.YYY....YYYYY',
    '%%%.....::..YYYYYYYYYYY.......::..YYYYYYYYYYYY.~--~.YYYY.YYYYYYY',
    '%%%.....::."YYYYYYYYYYY.......::..YYYYYYYYYYYY.~--~.YYYY.YYYYYYY',
    '%%%.....::."YYYYYYYYYYY,..."..::..YYYYYYY.,....~--~"YYYY.YYYYYYY',
    '%%%.....::..YYYYYYYYYYY...,...::..YYYYYYY......~--~.YYYY.YYYYYYY',
    '%%%.....::..YYYYYYYYYYY...."..::...............~--~.........YYYY',
    '%%%.....::..."........,.......::::::::::::::::______..."....YYYY',
    '%%%...,.::....................::...............~--~.."......YYYY',
    '%%%.....::::::::::::::::::::::::...............~--~.YYYYYYYYYYYY',
    '%%%.....::::::::::::::::::::::::...............~--~.YYYYYYYYYYYY',
    '%%%...........................::.".............~--~.YYYYYYYYYYYY',
    '%%%...................,.".....::...............~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY...............::...............~--~,YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY...............::...............~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~"YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~.YYYYYYYYYYYY',
    '%%%YYYYYYYYYYYY.YYYYYYYYYYYY..::::..YYYYYYYYYY.~--~"YYYYYYYYYYYY',
    '%%%...........................::::.............~--~.........YYYY',
    '%%%^^^^^^^^^^^^^^^^^^^^^^^^^^^====^^^^^^^^^^^^^^^^^^^^^^^^^^YYYY',
    '%%%^^^^^^^^^^^^^^^^^^^^^^^^^^^====^^^^^^^^^^^^^^^^^^^^^^^^^^YYYY',
    '%%%YYYYYYYYYYYYYYYYYYYYYYYYYYY====YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    '%%%YYYYYYYYYYYYYYYYYYYYYYYYYYY====YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
];
/* the Loom's door */
LOOMWOOD_ROWS[9] = LOOMWOOD_ROWS[9].slice(0, 31) + ':' + LOOMWOOD_ROWS[9].slice(32);

const LOOM_ENTRY = { x: 29, y: 42 };    /* inside the Loom's first hall (src/72_loom.js) */
const LOOM_OUT = { x: 64 + 31, y: 10 };

defBlock({
    id: 'loomwood', bx: 1, by: 0, name: 'The Loomwood', theme: 'loom', music: 'loomwood',
    rows: LOOMWOOD_ROWS,
    forest: ['birch', 'birch2'],
    ents: [
        /* the north gate, held shut from the Seams */
        { k: 'door', x: 30, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateA' }, { k: 'door', x: 31, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateB' },
        { k: 'door', x: 32, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateC' }, { k: 'door', x: 33, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateD' },
        { k: 'sign', x: 34, y: 35, text: 'THE LOOMWOOD. Nobody tends it. Nothing in it comes when it is called.' },
        { k: 'rest', x: 28, y: 33 },
        /* the Loom */
        { k: 'building', x: 24, y: 3, w: 16, h: 7, door: 7, art: 'loom' },
        { k: 'warp', x: 31, y: 9, to: 'loom', tx2: LOOM_ENTRY.x, ty2: LOOM_ENTRY.y, face: 'up', dir: 'up', when: 'flag:gundry_r2', lockedLine: 'The great doors are locked: an old lock, older than the Houses, with a keyhole as big as your hand. The Guild had a key to everything, once.' },
        /* silk strung across the way into the hidden clearing; a Heart Patch inside */
        { k: 'warpthread', x: 56, y: 16, len: 1, dir: 'v', id: 'lwSilk' },
        { k: 'chest', x: 57, y: 10, item: 'heartpatch', id: 'lwPatch' },
        /* moths in the birches */
        { k: 'moth', x: 20, y: 22 }, { k: 'moth', x: 38, y: 22 }, { k: 'moth', x: 12, y: 9 }, { k: 'moth', x: 55, y: 18 },
        /* the Frayed Edge: Linnet's Stray House, and strays left lying about */
        { k: 'building', x: 4, y: 3, w: 8, h: 4, door: 4, style: 'cottage', variant: 'stray' },
        { k: 'strayhouse', x: 8, y: 6 },
        { k: 'stray', x: 6, y: 12, id: 'feStray1' }, { k: 'stray', x: 4, y: 17, id: 'feStray2' },
        { k: 'sign', x: 10, y: 19, text: 'THE FRAYED EDGE. (Scratched underneath, small: L.)' },
    ],
    regions: [
        { name: 'The Frayed Edge', x: 3, y: 2, w: 12, h: 22 },
        { name: 'The Loom', x: 22, y: 2, w: 20, h: 10 },
        { name: 'The North Gate', x: 26, y: 34, w: 12, h: 6, mark: false },
    ],
});

/* moths: drawn to anything moving (Wren walking); still, she's nothing to them */
AI.moth = (e, p) => {
    e.modeT++; e.anim++;
    const D = e.D, nx = e.hx * T + 8, ny = e.hy * T + 10;
    const moving = p && p.area === e.area && p.walking && p.state === 'normal';
    const pd = p && p.area === e.area ? dist(p.x, p.y, e.x, e.y) : 999;
    if (moving && pd < 6 * T && dist(p.x, p.y, nx, ny) < 8 * T) {
        const dx = p.x - e.x, dy = p.y - 8 - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * 0.75; e.y += dy / d * 0.75; e.dir = dirOf(dx, dy); e.mode = 'chase';
    } else {
        /* flutter in a loop round home */
        const t = e.modeT / 40 + e.hx;
        const gx = nx + Math.cos(t) * 12, gy = ny + Math.sin(t * 1.3) * 8;
        e.x += (gx - e.x) * 0.05; e.y += (gy - e.y) * 0.05; e.mode = 'idle';
    }
    e.z = 6 + Math.round(Math.sin(e.modeT / 6) * 2);
};
SPAWN.moth = (x, y, p) => new Enemy(x, y, Object.assign({ type: 'moth' }, p));

/* the Stray House's door: Linnet's (O1) */
SPAWN.strayhouse = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: null, solid: [[0, 0]] });
    pr.interact = () => { Script.run(function* () {
        if (typeof StrayHouse !== 'undefined' && StrayHouse.open()) return yield* StrayHouse.enter();
        yield* say(null, "A low door, painted green once, with no knob, no lock and no keyhole: just a carved L, and a little slot under it the size of a folded note.");
    }); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    pr.draw = () => { };
    return pr;
};

/* the north gate: a gate of stone, swung open by its counterweight below the town */
{
    const tick0 = OW.blocks['1,0'].tick;
    OW.blocks['1,0'].tick = a => {
        if (tick0) tick0(a);
        if (Progress.flag('north_gate') && !Progress.flag('north_gate_seen') && G.player && G.player.ty > 33 && G.player.ty < 41 && G.player.tx > 88 && G.player.tx < 102) {
            Progress.set('north_gate_seen');
            G.pendingToast = 'The north gate stands open, for the first time in anybody\'s memory. Beyond it, silver trees.';
        }
    };
}
/* Constable Burr steps aside once the gate is open */
TALK.burr_gate = null;
{
    const t0 = TALK.burr;
    TALK.burr = function* (n) {
        if (Progress.flag('north_gate')) { yield* say('burr', cycle('burr_gate', ["The gate's open. Twenty years I've stood here and it's open. I don't... I don't know what my post's for now.", "Go on, then. Go on. Somebody ought to.", "Mind the moths up there. They go for anything that moves."])); return; }
        yield* t0(n);
    };
}

function initLoomwood() {
    treeArt('birch', { leaf: ['#b8d4b8', '#d0e4cc', '#eef6ea', '#88a890'], bark: ['#f4f4f0', '#c8c8c0', '#4a4a50'] }, 7);
    treeArt('birch2', { leaf: ['#a8c8b0', '#c4dcc0', '#e2f0dc', '#78988a'], bark: ['#eeeeea', '#bcbcb4', '#3a3a40'] }, 11);
    ENEMY.moth = { hp: 1, ai: 'moth', r: 5, tall: 10, flies: true, yarn: THREAD.loom, drop: 0.4, dmg: 1 };
    const mo = { w: '#e4ecf5', W: '#aab7c8', b: '#6a7080', e: '#2a1f2d' };
    defSprite('moth_0', ['................', '................', '................', '..kk........kk..', '.kwwk..kk..kwwk.', '.kwWwkkbbkkwWwk.', '..kwwkbebbkwwk..', '...kkkbbbbkkk...', '..kwwkbbbbkwwk..', '.kwWwk.kk.kwWwk.', '..kkk......kkk..', '................', '................', '................', '................', '................'], mo);
    defSprite('moth_1', ['................', '................', '................', '................', '.....kk..kk.....', '....kwwkkwwk....', '...kwWwbbwWwk...', '...kwwbebbwwk...', '....kkbbbbkk....', '....kwbbbbwk....', '...kwWk..kWwk...', '....kk....kk....', '................', '................', '................', '................'], mo);
    ENEMY_DRAW.moth = e => spr('moth_' + ((e.anim >> 2) % 2));
    FACADES.loom = () => {
        const w = 256, h = 120;
        ART.f_loom = paintSprite(w, h, x => {
            const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
            /* an old grey stone hall, long and low, a great wooden loom-frame standing up through its roof */
            R('#5a6070', 30, 0, 12, 60); R('#5a6070', 214, 0, 12, 60); R('#4a4f5c', 30, 0, 196, 10); R('#7a8090', 32, 2, 192, 4);
            for (let i = 0; i < 24; i++) { x.fillStyle = i % 2 ? '#e4ecf5' : '#aab7c8'; x.fillRect(46 + i * 7, 10, 1, 40); }
            R('#8a94a4', 0, 44, w, 8); R('#6a7484', 0, 50, w, 3);
            R('#a4aebe', 4, 53, w - 8, 61);
            for (let j = 53; j < 114; j += 8) { R('#8a94a4', 4, j + 7, w - 8, 1); for (let i = ((j / 8) % 2) * 12; i < w - 8; i += 24) R('#8a94a4', 4 + i, j, 1, 7); }
            /* the arch door, dark, threads across it like a curtain */
            R('#2a2e38', 104, 72, 48, 42); R('#4a5060', 100, 68, 56, 4);
            for (let i = 0; i < 12; i++) { x.fillStyle = '#c8d0dc'; x.fillRect(107 + i * 4, 74, 1, 40); }
            /* narrow windows, every one with a thread across it */
            for (const wx of [24, 60, 184, 220]) { R('#2a2e38', wx, 66, 12, 26); R('#e4ecf5', wx + 6, 66, 1, 26); }
            R('#e4ecf5', 0, 114, w, 2); R('#6a7484', 0, 116, w, 4);
        });
    };
}
CONTENT_INIT.push(initLoomwood);
