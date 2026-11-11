/* The Stray House (O1, optional): Linnet's, at the Frayed Edge. Its door has no lock, only a slot the size of a folded
   note: post the seven notes of Linnet's Trail through it and it opens (the eighth is waiting inside). Nothing in the
   Stray House has a thread: every block is a stray, so nothing comes back, puzzles are about order and room, holes
   filled stay filled, and the Needle can give a stray a place of its own. Nine rooms; the Pile (a heap of everything
   nobody missed: it shoves after you; box it in and it comes apart); Linnet's room at the end: her bracelet (the
   fuller ending) and a Heartstitch. */

THEMES.strayhouse = { floor: ['#b88a5a', '#a07448', '#d0a070', '#5a3e2a'], wall: ['#8aa88a', '#6a8a6a', '#aac8a8', '#2a3a2a'], stone: ['#9a9a88', '#7a7a68', '#bab8a8', '#3a3a30'], water: ['#4f8fb8', '#3a7098', '#8ac0e0', '#1c4060'], dark: '#1a1612' };
FLOORS.strayhouse = {
    /* honey planks; a rag rug; planks with the Drift's moss coming up between them */
    floor: (x, th, v) => { fill(x, '#b88a5a'); for (let y = 3; y < 16; y += 4) fill(x, '#9a6e44', 0, y, 16, 1); fill(x, '#9a6e44', (v * 5) % 16, 0, 1, 3); fill(x, '#9a6e44', (v * 7 + 6) % 16, 4, 1, 4); speckle(x, ['#c89a68', '#a87a4e'], 12 + v, 0.12); },
    floor2: (x, th, v) => { fill(x, '#b88a5a'); const cols = ['#c8604a', '#5a8ac8', '#e0b84a', '#7ab86a', '#b48ce8']; for (let y = 0; y < 16; y += 2) fill(x, cols[(y / 2 + v) % 5], 0, y, 16, 1); },
    floor3: (x, th, v) => { fill(x, '#b88a5a'); for (let y = 3; y < 16; y += 4) fill(x, '#6a8a4a', 0, y, 16, 1); speckle(x, ['#8ab86a', '#5a7a3a'], 30 + v, 0.18); },
};
WALLS.strayhouse = {
    edge: '#1a1612',
    top: (x) => { fill(x, '#3a2e24'); speckle(x, ['#4a3a2e'], 10, 0.2); },
    face: (x, th, v) => { fill(x, '#8aa88a'); for (let y = 2; y < 14; y += 4) for (let i = (y + v) % 4; i < 16; i += 5) { fill(x, '#9ad0f0', i, y, 1, 1); fill(x, '#f7e08a', i, y + 1, 1, 1); } fill(x, '#6a5040', 0, 13, 16, 3); fill(x, '#1a1612', 0, 15, 16, 1); },
};

const STRAY_DOOR = { x: 72, y: 7 };     /* outside, in the Loomwood, under the Stray House's door */
defHouse({
    id: 'strayhouse', name: 'The Stray House', place: 'The Stray House', house: 'strayhouse', theme: 'strayhouse', thread: THREAD.linnet, music: 'drift',
    entry: { x: 29, y: 42 }, noNudges: true,
    cells: {
        /* ---------------- 1 The Porch: nothing in here comes back ---------------- */
        '1,3': {
            name: 'The Porch',
            rows: ['#########.##########', '#..................#', '#..................#', '#oooooooooooooooooo#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'exit', x: 9, y: 10, tx2: STRAY_DOOR.x, ty2: STRAY_DOOR.y, face: 'down', dir: 'down' },
                { k: 'stray', x: 9, y: 5, id: 'poStray' }, { k: 'stray', x: 4, y: 7, id: 'poSpare' },
                { k: 'linnetnote', x: 13, y: 8, note: 8 },
                { k: 'sign', x: 3, y: 9, text: 'Painted on the wall in green, a bit wobbly: NOTHING IN HERE COMES BACK. DON\'T BE FRIGHTENED OF THAT. -L.' },
            ],
        },
        /* ---------------- 2 The Parlour: the middle of the house ---------------- */
        '1,2': {
            name: 'The Parlour',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#.....,,,,,,,......#', '#.....,,,,,,,......#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'paLock' },
                { k: 'deco', x: 2, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, text: "Shelves of things from the edge: a teacup with no saucer, half a weathervane, a doll's shoe, a key to nothing. Each one has a little L scratched on it." },
                { k: 'deco', x: 15, y: 1, look: 'hearth', solid: [[0, 0], [1, 0], [2, 0]], ox: 0, text: 'A little fire, kept in. Someone has drawn a little house on the chimney breast in chalk, and a stick figure waving from its door.' },
                { k: 'deco', x: 16, y: 8, look: 'plant', solid: [[0, 0]] },
                { k: 'sign', x: 5, y: 8, text: "LINNET'S. Things I found at the edge, that nobody missed enough to pull back. The pantry's west; the garden's east. -L." },
            ],
        },
        /* ---------------- 3 The Pantry: three onto three ---------------- */
        '0,2': {
            name: 'The Pantry',
            rows: ['####################', '#....#.......#.....#', '#....#.......#.....#', '#....#.......#.....#', '#....###.##.##.....#', '#...................', '#....##.##.###.....#', '#....#.......#.....#', '#....#.......#.....#', '#....#.......#.....#', '####################'],
            ents: [
                { k: 'plate', x: 2, y: 2, sig: 'ptA' }, { k: 'plate', x: 16, y: 2, sig: 'ptB' }, { k: 'plate', x: 2, y: 8, sig: 'ptC' },
                { k: 'stray', x: 8, y: 2, id: 'ptS1' }, { k: 'stray', x: 11, y: 5, id: 'ptS2' }, { k: 'stray', x: 9, y: 8, id: 'ptS3' },
                { k: 'chest', x: 16, y: 8, item: 'key', id: 'ptKey', hidden: true, when: 'ptA&ptB&ptC' },
                { k: 'sign', x: 7, y: 9, text: 'Jars on every shelf, labelled in Linnet\'s hand: PLUM. PLUM. PLUM (BETTER). NOT PLUM.' },
            ],
        },
        /* ---------------- 4 The Bridge Garden: a trench to fill, in order; one over to the plate ---------------- */
        '2,2': {
            name: 'The Bridge Garden',
            rows: ['####################', '#:::::::#..........#', '#:::::::#..........#', '#:::::::#..........#', '#:::::::#####......#', '.........ooo.......#', '#:::::::#####......#', '#:::::::#..........#', '#:::::::#..........#', '#:::::::#..........#', '####################'],
            ents: [
                { k: 'stray', x: 3, y: 2, id: 'bgS1' }, { k: 'stray', x: 6, y: 4, id: 'bgS2' }, { k: 'stray', x: 3, y: 7, id: 'bgS3' }, { k: 'stray', x: 5, y: 8, id: 'bgS4' },
                { k: 'plate', x: 16, y: 7, sig: 'bgPlate' },
                { k: 'chest', x: 16, y: 2, item: 'key', id: 'bgKey', hidden: true, when: 'bgPlate' },
                { k: 'chute', x: 1, y: 1, drop: [2, 2], id: 'bgChute' },
                { k: 'sign', x: 1, y: 9, text: "Three holes in a row, and one thing more to carry over them. (The pile in the corner's for spares. Pull the cord. -L.)" },
            ],
        },
        /* ---------------- 5 The Stair Hall: the way up to the Pile, open when both halves of the house are done ---------------- */
        '1,1': {
            name: 'The Stair Hall',
            rows: ['#########.##########', '#..........#...#...#', '#..........#ooo#...#', '#..........##o##...#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'shWash&shMend', dir: 'h', id: 'shStairs' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'shEastLock' },
                { k: 'chest', x: 13, y: 1, item: 'heartpatch', id: 'shPatch' },
                { k: 'stray', x: 6, y: 7, id: 'shS1' }, { k: 'stray', x: 15, y: 7, id: 'shS2' },
                { k: 'sign', x: 9, y: 8, text: 'Up the stairs: THE PILE. (Two lamps to light first, one each side of the house. Then it\'s all yours. -L.)' },
                { k: 'lamp', x: 4, y: 1, sig: 'shWash', look: 'lantern' }, { k: 'lamp', x: 17, y: 1, sig: 'shMend', look: 'lantern' },
            ],
        },
        /* ---------------- 6 The Washhouse: two stones in, the tub hooked over, and paddled ---------------- */
        '0,1': {
            name: 'The Washhouse',
            rows: ['####################', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '#.....~~~~~~~.......', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '#.....~~~~~~~......#', '####################'],
            ents: [
                { k: 'crate', x: 5, y: 5, id: 'whTub', marked: false },
                { k: 'stray', x: 15, y: 3, id: 'whS1' }, { k: 'stray', x: 15, y: 7, id: 'whS2' },
                { k: 'chute', x: 18, y: 9, drop: [17, 8], id: 'whChute' },
                { k: 'lever', x: 2, y: 3, id: 'whLever', sig: 'shWash' },
                { k: 'sign', x: 17, y: 2, text: 'THE WASHHOUSE. Stones sink and stay sunk. Tubs float and stay floated. My hook is too short for the tub from the doorway. -L.' },
            ],
        },
        /* ---------------- 7 The Mending Room: strays on a pincushion; the Needle gives them a place ---------------- */
        '2,1': {
            name: 'The Mending Room',
            rows: ['####################', '#...............#.##', '#...............#.##', '#...^^^^^^^^^^.....#', '#...^.^^^^^^.^.....#', '....^^^^^^^^^^.....#', '#...^^^^^^^^^^.....#', '#...^^^^^.^^^^.....#', '#...^^^^^^^^^^.....#', '#..................#', '####################'],
            ents: [
                { k: 'stray', x: 5, y: 4, id: 'mdS1' }, { k: 'stray', x: 12, y: 4, id: 'mdS2' }, { k: 'stray', x: 9, y: 7, id: 'mdS3' },
                { k: 'plate', x: 2, y: 4, sig: 'mdP1' }, { k: 'plate', x: 15, y: 4, sig: 'mdP2' }, { k: 'plate', x: 16, y: 9, sig: 'mdP3' },
                { k: 'door', x: 17, y: 2, type: 'gate', when: 'mdP1&mdP2&mdP3', dir: 'h', id: 'mdGate' },
                { k: 'lever', x: 17, y: 1, id: 'mdLever', sig: 'shMend' },
                { k: 'sign', x: 1, y: 1, text: "THE MENDING ROOM. Pins in everything. You can't get behind them to push. (A stray will take a place if you give it one. And a place can be unpicked. -L.)" },
            ],
        },
        /* ---------------- 8 The Pile ---------------- */
        '1,0': {
            name: 'The Pile',
            /* four nooks in the corners, each with a slit too narrow for the Pile: slip out, and it's stuck in there,
               straining after you; one stray across the nook's open side boxes it in */
            rows: ['####################', '#..................#', '#..................#', '#.#..............#.#', '#..................#', '...................#', '#..................#', '#.#..............#.#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'pile', x: 9, y: 4, id: 'thePile' },
                { k: 'stray', x: 3, y: 4, id: 'plS1' }, { k: 'stray', x: 16, y: 4, id: 'plS2' }, { k: 'stray', x: 3, y: 6, id: 'plS3' }, { k: 'stray', x: 16, y: 6, id: 'plS4' },
                { k: 'stray', x: 7, y: 2, id: 'plS5' }, { k: 'stray', x: 12, y: 8, id: 'plS6' },
                { k: 'door', x: 0, y: 5, type: 'gate', when: 'flag:sh_pile', dir: 'v', id: 'plWest' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'pile' },
            ],
        },
        /* ---------------- 9 Linnet's Room ---------------- */
        '0,0': {
            name: "Linnet's Room",
            rows: ['####################', '#..................#', '#..................#', '#.....,,,,,,.......#', '#.....,,,,,,.......#', '#...................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'deco', x: 15, y: 6, look: 'bed', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, text: "A narrow bed, made up neatly, a patchwork quilt in every colour of thread there is." },
                { k: 'deco', x: 3, y: 1, look: 'desk', solid: [[0, 0], [1, 0]], ox: 0, text: "Linnet's desk. A diary, open: \"Day 9,131. Cut three more at the edge today. A milk churn, a kite, a garden gnome. Nobody came looking. Nobody ever does, for things. It's people she holds on to. One day someone will come through that door who's followed all my notes, and they'll be a Wanderer, and they'll understand. I hope they're kind to her.\"" },
                { k: 'deco', x: 9, y: 1, look: 'window', solid: [[0, 0]], ox: 0, text: 'The window looks out the wrong way: not into the Loomwood but over the Drift, the open country past the fog, going on and on.' },
                { k: 'chest', x: 9, y: 7, item: 'bracelet', id: 'lrBracelet', big: true },
            ],
        },
    },
});
ITEMS.bracelet = { name: "Linnet's bracelet", kind: 'quest', desc: "Plaited from green thread, a little faded, with a tiny brass L. It's been waiting for someone to take it home." };
ITEM_LINES.bracelet = () => "You found {blue}Linnet's bracelet{/}! Plaited from green thread, a little faded, with a tiny brass L. Somebody ought to give it back to her mother.";

/* the lamps in the Stair Hall: lit by their levers, far off in the house */
SPAWN.lamp = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.lamp_off, solid: [[0, 0]], oy: -8 });
    pr.draw = (cx, cy) => { const on = Signals.eval(pr.area, p.sig); Gfx.img(on ? ART.lamp_on : ART.lamp_off, tx * T - cx, ty * T - cy - 8); if (on && (G.t >> 4) % 2) Gfx.rect(tx * T - cx + 7, ty * T - cy - 6, 2, 2, '#fff6c0'); };
    pr.interact = () => { Script.run(function* () { yield* say(null, Signals.eval(pr.area, p.sig) ? 'A lantern, lit from somewhere else in the house.' : 'A lantern, cold. Its wick runs down into the floor, toward one side of the house.'); }); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};

/* the Pile: everything nobody missed, heaped up, shoving after you two tiles wide. It can't be pushed. Box it in (all
   four sides blocked, by walls or strays) and it heaves and bursts, flinging the strays about; three times and it
   comes apart for good */
class Pile extends Ent {
    constructor(tx, ty, p = {}) { super('pile', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.mv = null; this.alive = !Progress.flag('sh_pile'); }
    get sortY() { return this.y + 32; }
    get arena() { return this.area.roomAt(this.tx, this.ty); }
    tiles(x = this.tx, y = this.ty) { return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]; }
    claim(on) { for (const [x, y] of this.tiles()) { if (on) this.area.staticSolid.add(y * 4096 + x); else this.area.staticSolid.delete(y * 4096 + x); } }
    onAdd(area) { if (this.alive) this.claim(true); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'pile') s.shut = shut; }
    /* can its 2x2 move one tile that way? (not into walls, holes, things, or Wren: Wren it shoves) */
    free(d) {
        const a = this.area, nx = this.tx + DX[d], ny = this.ty + DY[d];
        const ahead = this.tiles(nx, ny).filter(([x, y]) => !this.tiles().some(([u, v]) => u === x && v === y));
        return ahead.every(([x, y]) => { const k = a.kind(x, y); return a.roomAt(x, y) === this.arena && !(k.solid || k.pit || k.deep) && !a.at(x, y); });
    }
    boxed() { return [UP, DOWN, LEFT, RIGHT].every(d => !this.free(d)); }
    update() {
        if (!this.alive) return;
        this.t++;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal') { this.state = 'go'; this.st = 0; this.shutters(true); Music.play('boss'); Script.run(StrayHouse.pileIntro(this)); }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        if (this.mv) {
            const m = this.mv; m.t++;
            const k = m.t / m.dur;
            this.x = (m.fx + (this.tx - m.fx) * k) * T; this.y = (m.fy + (this.ty - m.fy) * k) * T;
            if (m.t >= m.dur) { this.mv = null; this.x = this.tx * T; this.y = this.ty * T; }
            return;
        }
        if (this.state === 'heave') { if (this.st > 70) this.burst(); return; }
        if (this.state === 'rest') { if (this.st > 60) { this.state = 'go'; this.st = 0; } return; }
        if (this.boxed()) { this.state = 'heave'; this.st = 0; G.shake = 6; Sfx.play('rumble'); return; }
        if (this.state === 'strain') { if (this.st > 150) { this.state = 'go'; this.st = 0; } return; }
        const period = [0, 34, 44, 54][this.hp];
        if (this.st < period) return;
        this.st = 0;
        /* toward Wren: the longer way first, else the other */
        const dx = p.tx - (this.tx + 0.5), dy = p.ty - (this.ty + 0.5);
        const order = Math.abs(dx) >= Math.abs(dy) ? [dx < 0 ? LEFT : RIGHT, dy < 0 ? UP : DOWN] : [dy < 0 ? UP : DOWN, dx < 0 ? LEFT : RIGHT];
        /* it only ever goes toward you; when neither way toward you is open, it strains after you a while */
        if (!order.some(d => this.free(d))) { this.state = 'strain'; this.st = 0; Sfx.play('hitthing', 0.5); return; }
        for (const d of order) {
            const nx = this.tx + DX[d], ny = this.ty + DY[d];
            /* (any tile Wren's feet touch, not just her middle: it never shuts a tile round her) */
            if (p.area === a && this.tiles(nx, ny).some(([x, y]) => p.onTile(x, y))) {
                if (p.state !== 'normal') { this.st = period - 6; return; }
                if (this.free(d)) { p.hurt(2, (this.tx + 1) * T, (this.ty + 1) * T); Sfx.play('hitthing'); return; }
                continue;
            }
            if (!this.free(d)) continue;
            this.claim(false); const fx = this.tx, fy = this.ty;
            this.tx = nx; this.ty = ny; this.claim(true);
            this.mv = { fx, fy, t: 0, dur: 12 };
            Sfx.play('step', 0.6); G.shake = 1;
            return;
        }
    }
    /* boxed in: it heaves, and bursts, flinging the strays round it about the room */
    burst() {
        const a = this.area, r = this.arena;
        this.hp--; G.shake = 10; Sfx.play('rumble'); Fx.dust((this.tx + 1) * T, (this.ty + 1) * T);
        if (this.hp <= 0) return this.defeat();
        const near = a.ents.filter(e => e.kind === 'block' && !e.removed && Math.abs(e.tx - this.tx - 0.5) <= 1.5 && Math.abs(e.ty - this.ty - 0.5) <= 1.5);
        for (const b of near) {
            for (let i = 0; i < 60; i++) {
                const x = r.x + 1 + Math.floor(G.rng() * (r.w - 2)), y = r.y + 1 + Math.floor(G.rng() * (r.h - 2));
                const p = G.player;
                if (a.freeForThing(x, y, b) && !a.kind(x, y).pit && !(p.tx === x && p.ty === y) && Math.abs(x - this.tx - 0.5) > 2) {
                    a.unplace(b, b.tx, b.ty); b.tx = x; b.ty = y; b.x = x * T; b.y = y * T; a.place(b, x, y); Fx.poof(x * T + 8, y * T + 8); break;
                }
            }
        }
        Fx.text((this.tx + 1) * T, this.ty * T - 10, ['', 'it heaves itself loose!', 'it shakes everything off!'][this.hp] || '', '#f7e08a');
        this.state = 'rest'; this.st = 0;
    }
    defeat() {
        this.alive = false; this.claim(false); this.shutters(false);
        Progress.set('sh_pile'); Stats.count('boss:pile');
        Sfx.play('unravel');
        Script.run(StrayHouse.pileDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy, sh = this.state === 'heave' ? ((this.t >> 1) % 2) * 2 - 1 : 0;
        Gfx.alpha(0.25); Gfx.rect(x + 2, y + 26, 28, 5, PAL.ink); Gfx.alpha(1);
        Gfx.img(ART.pile, x + sh, y - 14 + (this.mv ? -((this.mv.t >> 2) % 2) : 0));
        /* eyes, peering out of the heap */
        const blink = (this.t % 140) < 6;
        if (!blink) { Gfx.rect(x + 10 + sh, y + 4, 3, 3, '#fff6e0'); Gfx.rect(x + 19 + sh, y + 4, 3, 3, '#fff6e0'); Gfx.rect(x + 11 + sh, y + 5, 1, 2, PAL.ink); Gfx.rect(x + 20 + sh, y + 5, 1, 2, PAL.ink); }
        for (let i = 0; i < 3; i++) if (i < this.hp) Gfx.rect(x + 10 + i * 5, y - 18, 3, 3, '#e8463c');
    }
}
SPAWN.pile = (x, y, p) => new Pile(x, y, p);

const StrayHouse = {
    NEED: [1, 2, 3, 4, 5, 6, 7],
    have() { return this.NEED.filter(n => Progress.flag('linnet' + n)).length; },
    open() { return Progress.flag('strayhouse_open') || this.have() >= this.NEED.length; },
    *enter() {
        if (!Progress.flag('strayhouse_open')) {
            yield* say(null, "The low green door: no knob, no lock, no keyhole; a carved L, and a slot the size of a folded note.");
            const i = yield* ask(null, "You have seven of Linnet's notes, from all over the valley. Post them through the slot?", ['Post them', 'Keep them']);
            if (i !== 0) return;
            for (let k = 0; k < 7; k++) { Sfx.play('blip', 0.5); yield 12; }
            yield 20;
            yield* say(null, "One by one, they go through. A pause. Then, from the other side, the sound of a bolt being drawn back very slowly, as if by somebody who'd been waiting a long time and wanted to get it right.");
            Progress.set('strayhouse_open'); Stats.count('secret:strayhouse');
            Sfx.play('door');
        }
        World.go('strayhouse', 29, 42, { dir: UP, fade: true });
    },
    *pileIntro(pile) {
        yield 20;
        yield* say(null, "In the middle of the room, a heap of things: a pram wheel, a kettle, a coat stand, a scarecrow's hat, a hundred odd shoes. Two eyes open in it.");
        yield* say(null, "Everything nobody missed. It shuffles toward you, the whole heap of it, as if it wanted very badly to be somebody's.");
        Progress.setGoal('The Pile can\'t be pushed, and it\'s too wide for narrow places. Box it in, all four sides.');
    },
    *pileDown(pile) {
        yield 30;
        yield* say(null, "The Pile heaves one last time and comes apart: a kettle, a coat stand, a pram wheel, a hundred odd shoes, lying about the floor. Just things. Nothing's holding them. Nothing needs to.");
        const a = pile.area;
        for (const [dx, dy] of [[0, 0], [1, 1]]) { const x = pile.tx + dx, y = pile.ty + dy; if (!a.at(x, y)) { const b = a.add(new Block(x, y, { stray: true })); b.skey = 'pile:' + dx; Fx.poof(x * T + 8, y * T + 8); } }
        /* the Heartstitch on a free floor tile where it came apart (never in a wall) */
        const r = pile.arena, spot = [[1, 0], [0, 1], [0, -1], [2, 0], [-1, 0]].map(([dx, dy]) => [pile.tx + dx, pile.ty + dy]).find(([x, y]) => !a.at(x, y) && !a.kind(x, y).solid && !a.kind(x, y).pit && a.roomAt(x, y) === r) || [r.x + 9, r.y + 3];
        if (!a.ents.some(e => e.id === 'pileHeart')) a.add(new Pickup(spot[0] * T, spot[1] * T, { what: 'heartstitch', id: 'pileHeart' }));
        Progress.setGoal("West of the Pile's room: Linnet's own room.");
        Save.autosave();
    },
};
/* after the Pile, the Heartstitch waits if it wasn't picked up */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        if (id === 'strayhouse' && Progress.flag('sh_pile') && !Progress.areaFlag('strayhouse', 'got:pileHeart') && !a.ents.some(e => e.id === 'pileHeart')) {
            const r = a.rooms.find(q => q.key === '1,0');
            a.add(new Pickup((r.x + 9) * T, (r.y + 3) * T, { what: 'heartstitch', id: 'pileHeart' }));
        }
        return a;
    };
}

/* Linnet's Trail: notes 4 (the Belfry's Echo Room) and 5 (below the falls) were scenery; now they're notes like the rest */
LINNET_NOTES[4] = { title: 'A note pinned in the Echo Room', text: "Sang her to sleep with the stones, the way she sings it: low, high, middle, high, low. She sings it to the cellar too, late at night, very quietly. Something down there turns one click for every Knot I tie. I counted. - L." };
/* (note 5 says where and what to try, not what you'll find: the river's mouth in Meadowfold shows it, src/80c_fog_hand.js) */
LINNET_NOTES[5] = { title: 'A note in a bottle below the falls', text: "If you're reading this, you rode over the falls too. Go to where the river runs into the fog and put your hand in it. Then tell me it's mist. - L." };
LINNET_NOTES[8] = { title: 'A note inside the Stray House', text: "If you're reading this, you're a Wanderer too. The Stray House is for you. Nothing in it comes back. Don't be frightened of that. I'm out past the fog, cutting a little at a time from the outside, until she can let go. - L." };
for (const k of [4, 5, 8]) NOTES['linnet' + k] = { title: LINNET_NOTES[k].title, text: LINNET_NOTES[k].text };
{
    const belfry = AREAS.belfry.ents.find(e => e.look === 'note_paper' && e.if === 'belfry_echo');
    if (belfry) { delete belfry.look; delete belfry.text; delete belfry.solid; belfry.k = 'linnetnote'; belfry.note = 4; }
    const mill = OW.blocks['2,2'].ents.find(e => e.look === 'note_bottle');
    if (mill) { delete mill.look; delete mill.text; delete mill.solid; mill.k = 'linnetnote'; mill.note = 5; }
}

function initStrayHouse() {
    ART.pile = paintSprite(32, 44, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        /* a heap: a coat stand poking out, a kettle, a pram wheel, shoes, a hat */
        R('#6a5040', 3, 22, 26, 20); R('#8a6a50', 5, 18, 22, 8); R('#7a6a8a', 8, 12, 16, 8); R('#a87a4a', 10, 8, 12, 6);
        R('#4a3a2e', 22, 0, 2, 20); R('#4a3a2e', 19, 1, 8, 2);                 /* the coat stand */
        R('#c8c0b0', 4, 26, 8, 8); R('#9a9488', 5, 27, 6, 6); R('#4a4440', 7, 29, 2, 2);   /* a pram wheel */
        R('#5a8ac8', 20, 24, 8, 7); R('#7aaae0', 21, 25, 4, 2); R('#3a5a8a', 27, 26, 2, 2);  /* a kettle */
        R('#c8604a', 12, 32, 6, 4); R('#e0b84a', 6, 36, 6, 3); R('#7ab86a', 18, 34, 7, 3); R('#b48ce8', 13, 38, 6, 3);  /* shoes */
        R('#3a2a1e', 8, 8, 16, 2); R('#5a4a3a', 11, 4, 10, 5);                 /* a scarecrow's hat */
    });
    ART.lamp_off = paintSprite(16, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#4a3a2e', 7, 14, 2, 10); R('#5a4a3e', 4, 4, 8, 10); R('#8a8070', 5, 5, 6, 8); R('#3a2e24', 3, 2, 10, 2); });
    ART.lamp_on = paintSprite(16, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#4a3a2e', 7, 14, 2, 10); R('#5a4a3e', 4, 4, 8, 10); R('#f7e08a', 5, 5, 6, 8); R('#fff6c0', 7, 7, 2, 4); R('#3a2e24', 3, 2, 10, 2); });
    defSprite('icon_bracelet', ['................', '.....kkkkkk.....', '...kkggGGggkk...', '..kgGk....kGgk..', '.kgGk......kGgk.', '.kgk........kgk.', 'kgGk........kGgk', 'kgk..........kgk', 'kgk..........kgk', 'kgGk........kGgk', '.kgk...kk...kgk.', '.kgGk.kyyk.kGgk.', '..kgGkkyykkGgk..', '...kkggkkggkk...', '.....kkkkkk.....', '................'], { g: '#5ab85a', G: '#8fd46a', y: '#e8c04a' });
}
CONTENT_INIT.push(initStrayHouse);

/* in the Stray House nothing pulls anything back, Wren included: a fall is just a fall, and she climbs out on the side
   she went in from (as she will everywhere, once her own thread is cut) */
{
    const fall0 = Player.prototype.updateFall;
    Player.prototype.updateFall = function () {
        if (this.area && this.area.id === 'strayhouse' && !Progress.flag('cut_self') && this.stateT >= 26 && this.fallWhy !== 'doze' && !(Inv.bedroll && Inv.bedroll.area === this.area.id)) {
            const bx = this.tx - DX[this.dir], by = this.ty - DY[this.dir], back = this.landingSpot(bx, by);
            const [lx, ly] = back[0] === bx && back[1] === by ? back : this.landingSpot(this.tx, this.ty);
            this.x = lx * T + 8; this.y = ly * T + 10; this.state = 'normal'; this.inv = 40;
            Fx.dust(this.x, this.y); Sfx.play('land');
            if (!Progress.flag('sh_fell')) { Progress.set('sh_fell'); G.pendingToast = 'Nothing pulls you home in here. You climb out, scraped, on the side you fell in from.'; }
            return;
        }
        return fall0.call(this);
    };
}
