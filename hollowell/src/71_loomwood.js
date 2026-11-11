/* The Loomwood (block 1,0): north of town, past the stone gate on the North Road (opened by the gate's counterweight
   in the Seams, src/69_reveal2.js). Silver birches, silk strung between the trees, moths, the fog close on the north
   and the west: the Frayed Edge, where strays turn up and Linnet's Stray House waits (O1, later). The Loom itself,
   the First Spinner's old place, in the north: nobody made it, nobody watches from underneath (D8, src/72_loom.js).
   Silk strands are walls here until the Shears cut them; one hides a clearing with a Heart Patch. Across the Loom's
   door hangs a short warp, its four cords running away through the birches to four stone sockets: it lifts only while
   all four hold a weight (one socket is far off over the stream); the Needle holds three. */

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
    id: 'loomwood', bx: 1, by: 0, name: 'The Loomwood', theme: 'loom', music: 'loomwood', owArt: true, soft: 2, blobSeam: true,
    rows: LOOMWOOD_ROWS,
    forest: ['birch', 'birch2', 'birch', 'birch3'],
    drawGround: (a, cx, cy) => Loomwood.ground(a, cx, cy),
    drawOver: (a, cx, cy) => Loomwood.over(a, cx, cy),
    ents: [
        /* the north gate, held shut from the Seams */
        { k: 'door', x: 30, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateA' }, { k: 'door', x: 31, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateB' },
        { k: 'door', x: 32, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateC' }, { k: 'door', x: 33, y: 37, type: 'gate', when: 'flag:north_gate', dir: 'h', id: 'northGateD' },
        { k: 'sign', x: 34, y: 35, text: 'THE LOOMWOOD. Nobody tends it. Nothing in it comes when it is called.' },
        { k: 'rest', x: 28, y: 33 },
        /* the Loom */
        { k: 'building', x: 24, y: 3, w: 16, h: 7, door: 7, art: 'loom' },
        { k: 'warp', x: 31, y: 9, to: 'loom', tx2: LOOM_ENTRY.x, ty2: LOOM_ENTRY.y, face: 'up', dir: 'up', when: 'flag:gundry_r2', lockedLine: 'The great doors are locked: an old lock, older than the Houses, with a keyhole as big as your hand. The Guild had a key to everything, once.' },
        /* the warp across the Loom's door, its four sockets, and the weights lying about */
        { k: 'warpgate', x: 30, y: 10, len: 3, id: 'lgWarp', when: 'lgS1&lgS2&lgS3&lgS4|flag:loom_open|flag:d8' },
        { k: 'socket', x: 26, y: 12, sig: 'lgS1', id: 'lgS1' }, { k: 'socket', x: 36, y: 11, sig: 'lgS2', id: 'lgS2' },
        { k: 'socket', x: 24, y: 17, sig: 'lgS3', id: 'lgS3' }, { k: 'socket', x: 57, y: 17, sig: 'lgS4', id: 'lgS4' },
        { k: 'loomweight', x: 26, y: 14, id: 'lgW1', stitchName: 'a loom weight' }, { k: 'loomweight', x: 38, y: 11, id: 'lgW2', stitchName: 'a loom weight' },
        { k: 'loomweight', x: 24, y: 19, id: 'lgW3', stitchName: 'a loom weight' }, { k: 'loomweight', x: 55, y: 17, id: 'lgW4', stitchName: 'a loom weight' },
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

/* ---------- the warp across the Loom's door ---------- */
/* a short warp of silk on a beam: it lifts (slowly) while all four of its cords' sockets hold a weight, and drops when
   they don't (never onto anybody); silk all the same, so the Shears cut it for good */
class WarpGate extends WarpThread {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ dir: 'h' }, p)); this.lift = 0; this.lifted = false; }
    onAdd(area) {
        super.onAdd(area);
        if (Signals.eval(area, (this.when || '').split('|').filter(t => t.startsWith('flag:')).join('|'))) { this.lift = 24; this.lifted = true; }
    }
    blocks(x, y) { return !this.gone && !this.lifted && this.tiles().some(([a, b]) => a === x && b === y); }
    update() {
        if (this.gone) return;
        const want = Signals.eval(this.area, this.when), p = G.player;
        const under = p && p.area === this.area && this.tiles().some(([a, b]) => p.onTile(a, b));
        if (want) this.lift = Math.min(24, this.lift + 1); else if (!under) this.lift = Math.max(0, this.lift - 3);
        const was = this.lifted; this.lifted = this.lift >= 24;
        if (this.lifted && !was) Sfx.play('door');
        if (!this.lifted && was) Sfx.play('doorshut');
    }
    get sortY() { return this.y + 14; }
    draw(cx, cy) {
        const x0 = this.tx * T - cx, y0 = this.ty * T - cy, w = this.len * T, k = this.lift / 24;
        /* the beam, on two posts */
        Gfx.rect(x0 - 3, y0 - 18, 3, 34, PAL.ink); Gfx.rect(x0 - 2, y0 - 17, 1, 32, '#8a7a6a');
        Gfx.rect(x0 + w, y0 - 18, 3, 34, PAL.ink); Gfx.rect(x0 + w + 1, y0 - 17, 1, 32, '#8a7a6a');
        Gfx.rect(x0 - 4, y0 - 20, w + 8, 5, PAL.ink); Gfx.rect(x0 - 3, y0 - 19, w + 6, 3, '#a89c8c'); Gfx.rect(x0 - 3, y0 - 19, w + 6, 1, '#d8ccbc');
        if (this.gone) return;
        /* the threads, drawn up into the beam as it lifts */
        const bot = y0 + 15 - Math.round(k * 28);
        for (let i = 2; i < w; i += 3) {
            const sh = Math.round(Math.sin((G.t + i * 7) / 30) * (1 - k));
            if (bot > y0 - 15) Gfx.line(x0 + i, y0 - 15, x0 + i + sh, bot, i % 6 === 2 ? '#e4ecf5' : '#9aa8b8');
            if (bot > y0 - 13) Gfx.rect(x0 + i - 1 + sh, bot, 3, 2, '#7a8496');
        }
    }
}
SPAWN.warpgate = (x, y, p) => new WarpGate(x, y, p);
/* a socket: a round stone worn hollow by a weight; anything heavy in it holds it down. The old weight from the isle fits */
SPAWN.socket = (x, y, p) => {
    const c = new Plate(x, y, Object.assign({ minWeight: WEIGHT.heavy }, p));
    c.draw = function (cx, cy) { Gfx.img(ART[this.down ? 'socket_down' : 'socket'], this.x - cx, this.y - cy); };
    const add0 = c.onAdd;
    c.onAdd = function (area) {
        if (add0) add0.call(this, area);
        if (Progress.get('oldweight_at') === this.id) area.add(new Block(this.tx, this.ty, { marked: false, weight: WEIGHT.heavy, look: 'oldweight_block', noPush: true }));
    };
    c.interact = () => {
        const a = c.area;
        if (!Inv.items.oldweight || a.at(c.tx, c.ty) || Progress.get('oldweight_at')) {
            Script.run(function* () { yield* say(null, 'A round stone set in the ground, worn hollow in the middle by something heavy that sat in it a long time. A cord runs from it, away through the trees.'); });
            return true;
        }
        Script.run(function* () {
            const i = yield* ask(null, 'A round stone worn hollow in the middle. The old loom weight from the isle is heavy in your satchel.', ['Set it in', 'Not now']);
            if (i !== 0) return;
            delete Inv.items.oldweight; Progress.set('oldweight_at', c.id); Stats.count('secret:oldweight_set');
            a.add(new Block(c.tx, c.ty, { marked: false, weight: WEIGHT.heavy, look: 'oldweight_block', noPush: true }));
            Sfx.play('land'); G.shake = 3;
            yield* say(null, 'It drops into the hollow with a thump, and fits it exactly, as if it had been made for it. Somewhere, a cord goes tight.');
        });
        return true;
    };
    c.talkBox = (pl, f) => f.tx === c.tx && f.ty === c.ty;
    return c;
};
/* once you've been in, the warp's lifted for you */
{
    const enter0 = World.enter;
    World.enter = function (id, ...rest) {
        if ((id === 'loom' || (Progress.areaFlags && Progress.areaFlags.loom)) && !Progress.flag('loom_open')) Progress.set('loom_open');
        return enter0.call(this, id, ...rest);
    };
}

/* ---------- the Loomwood's look: silvery grass with silk lying in it, birch leaves, the ground fraying toward the fog;
   silk strung between the birches; the warp's cords running away to their sockets ---------- */
THEMES.loom.grass = ['#b6d2b0', '#9ec29c', '#d2e6c8', '#789c7e'];
THEMES.loom.path = ['#dcd8ca', '#c2bcaa', '#eeebe0'];
OWA.ground.loom = {
    grass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0); speckle(x, [g1], 11 + v * 13, 0.13); speckle(x, [g2], 23 + v * 7, 0.05);
        for (let n = 0; n < 3; n++) { const bx = 1 + Math.floor(hash2(v, n, 3) * 14), by = 2 + Math.floor(hash2(n, v, 5) * 13); px(x, bx, by, g3); px(x, bx + 1, by - 1, g1); }
        /* now and then a strand of silk lying in the grass */
        if (v === 1) { let sy = 4 + Math.floor(hash2(v, 1, 7) * 8); for (let i = 3; i < 12; i++) { if (hash2(i, v, 8) < 0.25) sy += 1; if (sy >= 0 && sy < 16) px(x, i, sy, i % 4 ? '#dfe8ee' : '#ffffff'); } }
        /* a fallen birch leaf, gold */
        if (v === 3) { px(x, 4, 10, '#e8c84a'); px(x, 5, 10, '#f4dc6a'); px(x, 5, 11, '#c8a83a'); px(x, 11, 4, '#e8c84a'); px(x, 12, 4, '#c8a83a'); }
    },
    flowers(x, th, v) {
        OWA.ground.loom.grass(x, th, v);
        for (let n = 0; n < 2; n++) { const fx = 3 + Math.floor(hash2(n, v, 1) * 10), fy = 3 + Math.floor(hash2(v + 3, n, 2) * 10); px(x, fx, fy, '#ffffff'); px(x, fx - 1, fy, '#e4ecf5'); px(x, fx + 1, fy, '#e4ecf5'); px(x, fx, fy - 1, '#e4ecf5'); px(x, fx, fy + 1, '#c8d4c0'); px(x, fx, fy + 2, th.grass[3]); }
    },
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.2); speckle(x, [p2], 41 + v, 0.08);
        for (let n = 0; n < 3; n++) { const sx = Math.floor(hash2(v, n, 12) * 14), sy = Math.floor(hash2(n, v, 13) * 14); px(x, sx, sy, '#a8a294'); px(x, sx + 1, sy, '#bcb6a6'); }
    },
    forest(x, th, v) { fill(x, '#5e7468'); speckle(x, ['#6a8274', '#4e6258'], v + 9, 0.28); speckle(x, ['#c8b04a'], v + 19, 0.03); },
};
const Loomwood = {
    /* the ground fraying toward the fog: loose thread-ends lying on the grass, pointing into it */
    ground(a, cx, cy) {
        if (HEADLESS || cx > 128 * T || cx + W < 64 * T || cy > 40 * T) return;
        const F = typeof Fog !== 'undefined' ? Fog.info(a) : null;
        const tx0 = Math.max(64, Math.floor(cx / T)), tx1 = Math.min(127, Math.floor((cx + W) / T)), ty0 = Math.max(0, Math.floor(cy / T)), ty1 = Math.min(39, Math.floor((cy + H) / T));
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
            const k = a.cell(tx, ty).k; if (k !== 'grass' && k !== 'path') continue;
            let near = 9; for (let d = 1; d <= 4 && near === 9; d++) if (a.cell(tx - d, ty).k === 'fog' || a.cell(tx, ty - d).k === 'fog') near = d;
            if (near > 4) continue;
            const left = a.cell(tx - near, ty).k === 'fog';
            for (let n = 0; n < 5 - near; n++) {
                const ox = Math.floor(hash2(tx, ty * 5 + n, 301) * 14), oy = Math.floor(hash2(ty, tx * 5 + n, 302) * 14), len = 3 + Math.floor(hash2(n, tx + ty, 303) * 5);
                const x = tx * T - cx + ox, y = ty * T - cy + oy, col = n % 2 ? '#ffffff' : '#dfe6ef';
                if (left) for (let i = 0; i < len; i++) Gfx.rect(x - i, y + (i > 2 ? (n % 2 ? 1 : -1) : 0), 1, 1, col);
                else for (let i = 0; i < len; i++) Gfx.rect(x + (i > 2 ? (n % 2 ? 1 : -1) : 0), y - i, 1, 1, col);
            }
            void F;
        }
    },
    /* the warp's cords, strung from its beam over the birches to each socket (taut while the socket's held): drawn over the
       trees, so each can be followed by eye from the door to wherever its socket is, the far one away over the river too;
       and now and then a glint runs along a slack one from the beam to its socket */
    CORDS: [['lgS1', 26, 12], ['lgS2', 36, 11], ['lgS3', 24, 17], ['lgS4', 57, 17]],
    cords(a, cx, cy) {
        if (cx > 128 * T || cx + W < 64 * T || cy > 40 * T) return;
        const wx = (64 + 31) * T + 8 - cx, wy = 10 * T - 16 - cy;
        this.CORDS.forEach(([id, sx, sy], k) => {
            const ex = (64 + sx) * T + 8 - cx, ey = sy * T + 8 - cy;
            if (Math.max(wx, ex) < -10 || Math.min(wx, ex) > W + 10 || Math.max(wy, ey) < -10 || Math.min(wy, ey) > H + 10) return;
            const held = Signals.get(a, id), n = Math.max(2, Math.round(Math.hypot(ex - wx, ey - wy) / 10));
            const at = u => [wx + (ex - wx) * u, wy + (ey - wy) * u + (held ? 0 : Math.sin(u * Math.PI) * 6)];
            let [px0, py0] = at(0);
            Gfx.alpha(held ? 0.95 : 0.75);
            for (let i = 1; i <= n; i++) { const [qx, qy] = at(i / n); Gfx.line(px0, py0 + 1, qx, qy + 1, 'rgba(20,10,20,0.35)'); Gfx.line(px0, py0, qx, qy, held ? '#ffffff' : '#dfe6ef'); px0 = qx; py0 = qy; }
            if (!held) { const u = ((G.t + k * 53) % 200) / 120; if (u <= 1) { const [gx, gy] = at(u); Gfx.alpha(0.9); Gfx.rect(Math.round(gx) - 1, Math.round(gy) - 1, 2, 2, '#ffffff'); } }
            Gfx.alpha(1);
        });
    },
    /* silk strung between the birches, glinting now and then */
    over(a, cx, cy) {
        this.cords(a, cx, cy);
        if (HEADLESS || cx > 128 * T || cx + W < 64 * T || cy > 40 * T) return;
        const trees = this.trees || (this.trees = a.ents.filter(e => e.kind === 'prop' && e.im && (e.im === ART.birch || e.im === ART.birch2 || e.im === ART.birch3)));
        for (let i = 0; i < trees.length; i++) {
            const t = trees[i], ax = t.x - cx + 16, ay = t.y - cy + 14;
            if (ax < -40 || ax > W + 40 || ay < -40 || ay > H + 40 || hash2(t.tx, t.ty, 311) > 0.45) continue;
            const o = trees[(i + 1 + Math.floor(hash2(t.tx, t.ty, 312) * 3)) % trees.length]; if (!o || Math.hypot(o.tx - t.tx, o.ty - t.ty) > 4) continue;
            const bx = o.x - cx + 16, by = o.y - cy + 14, glint = (G.t + i * 37) % 300 < 20;
            Gfx.alpha(glint ? 0.8 : 0.35); Gfx.line(ax, ay, bx, by, '#ffffff'); Gfx.alpha(1);
        }
    },
};
{
    /* (the tree list is the place's own: built afresh each time) */
    const build0 = World.build;
    World.build = function (id) { const a = build0.call(this, id); if (id === 'hollow') Loomwood.trees = null; return a; };
}
CONTENT_INIT.push(() => {
    const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    /* the birches again, bolder: brighter leaves with real shade in them, white bark ringed with black */
    treeArt('birch', { leaf: ['#8cc07e', '#acd696', '#d8eebc', '#4e8058'], bark: ['#f6f6f0', '#cacac0', '#2e2e34'] }, 7, { clumps: [[16, 12, 8], [10, 16, 6], [22, 15, 6], [13, 7, 5], [20, 7, 5], [16, 19, 6]] });
    treeArt('birch2', { leaf: ['#9cc488', '#bcdaa2', '#e2f2c6', '#5a8a5e'], bark: ['#f0f0ea', '#c4c4ba', '#2e2e34'] }, 11, { clumps: [[16, 13, 9], [9, 17, 6], [23, 16, 6], [12, 8, 6], [21, 8, 5], [16, 20, 6]] });
    treeArt('birch3', { leaf: ['#d4b84a', '#e8d070', '#f8ecac', '#9a8a3a'], bark: ['#f6f6f0', '#cacac0', '#2e2e34'] }, 13, { clumps: [[16, 12, 8], [10, 16, 6], [22, 15, 6], [13, 7, 5], [20, 7, 5], [16, 19, 6]] });
    for (const n of ['birch', 'birch2', 'birch3']) { const c = ART[n]; if (!HEADLESS) { const x = c.getContext('2d'); x.fillStyle = '#2e2e34'; for (const [a, b] of [[14, 27], [16, 30], [15, 32], [17, 25]]) x.fillRect(a, b, 2, 1); } }
    /* a socket stone (held: the hollow full and dark) */
    for (const down of [false, true]) ART[down ? 'socket_down' : 'socket'] = paintSprite(16, 16, x => {
        discPx(x, 8, 8, 7, (px0, py0, u, v) => { const d = u * u + v * v, l = -u * 0.5 - v * 0.7 + (hash2(px0, py0, 4) - 0.5) * 0.3; if (d < 0.3) return down ? '#3a3e4a' : (l > 0 ? '#6a7080' : '#545a68'); return l > 0.45 ? '#e4e8ef' : l > -0.15 ? '#b8c0cc' : l > -0.7 ? '#8a94a4' : '#6a7484'; });
        R(x, '#e4ecf5', 14, 7, 2, 1);
    });
    defSprite('oldweight_block', ['................', '................', '.....kkkkkk.....', '....kwggggxk....', '...kwgggggxxk...', '..kwggkkkkgxxk..', '..kgggk..kgxxk..', '..kgggk..kgxxk..', '..kgggkkkkgxxk..', '..kggggggggxxk..', '..kgggggggxxxk..', '...kggggggxxk...', '....kxxxxxxk....', '.....kkkkkk.....', '................', '................']);
});
