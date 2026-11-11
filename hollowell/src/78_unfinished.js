/* The Unfinished House (O2, optional): old Mr Ives's, up the bank east of the river. He was a Maker; forty years ago he
   began a House of his own and drew all of it in chalk, and never had the hands to build it. The Needle sews a chalk
   piece (a plank over a gap) and it's real, but the Needle only holds three stitches:
   a fourth undoes the oldest, wherever it is (mind you're not standing on it). The Shears snip a sewn piece's stitches
   (to choose which comes undone). The last room is for Mr Ives himself: he walks to his chair across five chalk gaps,
   and you sew them ahead of him. His old hook, with a longer line, is the reward. Opens with the Needle and either the
   Guild pin (Gundry, for all six Maker's marks) or after the Loom. */

THEMES.chalk = { floor: ['#d8c49a', '#bca478', '#ecdcb4', '#6a5a40'], wall: ['#e8e0d0', '#c8bca8', '#f8f4ea', '#4a4238'], stone: ['#b8b0a0', '#98907e', '#d8d0c0', '#3a3428'], water: ['#4f8fb8', '#3a7098', '#8ac0e0', '#1c4060'], dark: '#2a2620' };
FLOORS.chalk = {
    /* raw pine boards, pencil marks on them, chalk dust */
    floor: (x, th, v) => { fill(x, '#d8c49a'); for (let y = 7; y < 16; y += 8) fill(x, '#bca478', 0, y, 16, 1); fill(x, '#bca478', (v * 5) % 16, 0, 1, 7); speckle(x, ['#e8d8b0', '#c8b088'], 9 + v, 0.1); if (v % 5 === 0) fill(x, '#8a8a8a', 3, 4, 6, 1); },
    floor2: (x, th, v) => { fill(x, '#cdb88c'); speckle(x, ['#f4f0e4'], 20 + v, 0.15); },
    floor3: (x, th, v) => { fill(x, '#d8c49a'); fill(x, '#f4f0e4', 0, 0, 16, 1); fill(x, '#f4f0e4', 0, 0, 1, 16); },
};
WALLS.chalk = {
    edge: '#2a2620',
    top: (x) => { fill(x, '#5a5040'); speckle(x, ['#6a6050'], 10, 0.2); },
    /* bare plaster, pencilled measurements on it */
    face: (x, th, v) => { fill(x, '#e8e0d0'); speckle(x, ['#d8d0c0'], 15 + v, 0.2); if (v % 3 === 0) { fill(x, '#8a8a8a', 2, 4, 9, 1); fill(x, '#8a8a8a', 2, 3, 1, 3); fill(x, '#8a8a8a', 10, 3, 1, 3); } fill(x, '#a89a80', 0, 13, 16, 3); fill(x, '#2a2620', 0, 15, 16, 1); },
};

PEOPLE_DEF.mrives = { name: 'Mr Ives', col: THREAD.chalk, look: { body: 'elder', hair: 'short', hairC: '#f0f0f0', top: '#9a9488', accent: '#e8e0d0', bottom: '#5a5448', skin: 'light', extra: ['glasses'] } };
const IVES_OUT = { x: 120, y: 46 };         /* outside his door, in the town */
defHouse({
    id: 'unfinished', name: 'The Unfinished House', place: 'The Unfinished House', house: 'unfinished', theme: 'chalk', thread: THREAD.chalk, music: 'underside',
    entry: { x: 29, y: 42 }, noNudges: true,
    cells: {
        /* ---------------- 1 The Front Room: a gap, a chalk bridge, the Needle ---------------- */
        '1,3': {
            name: 'The Front Room',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#oooooooooooooooooo#', '#oooooooooooooooooo#', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'exit', x: 9, y: 10, tx2: IVES_OUT.x, ty2: IVES_OUT.y, face: 'down', dir: 'down' },
                { k: 'chalk', x: 9, y: 4, len: 2, dir: 'v', type: 'bridge', id: 'frBridge' },
                { k: 'npc', who: 'mrives', x: 13, y: 7, face: 'left', id: 'ivesFront', if: '!ives_done' },
                { k: 'sign', x: 3, y: 8, text: 'Chalked on the floorboards: A BRIDGE GOES HERE. (Mr Ives drew all of it. None of it is there.)' },
            ],
        },
        /* ---------------- 2 The Drafting Hall: the middle; two lamps for the stairs ---------------- */
        '1,2': {
            name: 'The Drafting Hall',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'ufW&ufE', dir: 'h', id: 'ufStairs', keep: true },
                { k: 'lamp', x: 4, y: 1, sig: 'ufW', look: 'lantern' }, { k: 'lamp', x: 15, y: 1, sig: 'ufE', look: 'lantern' },
                { k: 'deco', x: 2, y: 7, look: 'desk', solid: [[0, 0], [1, 0]], ox: 0, text: "Mr Ives's drafting table. A plan of the whole House, beautifully drawn, every gap and every bridge; and in the corner, in a shakier hand: FOR WHOEVER COMES NEXT. I'M SORRY IT'S NOT DONE." },
                { k: 'sign', x: 15, y: 8, text: 'Pencilled on the wall: THE NEEDLE HOLDS THREE. A FOURTH STITCH UNDOES THE FIRST. (WHEREVER IT IS. WHOEVER IS ON IT.)' },
            ],
        },
        /* ---------------- 3 The Long Gap: four gaps, four bridges, three stitches ---------------- */
        '0,2': {
            name: 'The Long Gap',
            rows: ['##.#################', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '#...o..o..o..o......', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '#...o..o..o..o.....#', '####################'],
            ents: [
                { k: 'chalk', x: 13, y: 5, type: 'bridge', id: 'lgA' }, { k: 'chalk', x: 10, y: 5, type: 'bridge', id: 'lgB' },
                { k: 'chalk', x: 7, y: 5, type: 'bridge', id: 'lgC' }, { k: 'chalk', x: 4, y: 5, type: 'bridge', id: 'lgD' },
                { k: 'stray', x: 16, y: 8, id: 'lgStray' },
                { k: 'lever', x: 2, y: 8, id: 'lgLever', sig: 'ufW' },
                { k: 'sign', x: 17, y: 2, text: "Four gaps, and the Needle holds three stitches. (Mr Ives fell in here a great deal.)" },
            ],
        },
        /* ---------------- 4 The Far Shelf (off the Long Gap): four planks side by side, and the Needle holds three ---------------- */
        '0,1': {
            name: 'The Far Shelf',
            rows: ['####################', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '#.........oooo.....#', '##.#################'],
            ents: [
                { k: 'chalk', x: 10, y: 5, type: 'bridge', id: 'fsA' }, { k: 'chalk', x: 11, y: 5, type: 'bridge', id: 'fsB' },
                { k: 'chalk', x: 12, y: 5, type: 'bridge', id: 'fsC' }, { k: 'chalk', x: 13, y: 5, type: 'bridge', id: 'fsD' },
                { k: 'chest', x: 17, y: 3, item: 'heartpatch', id: 'fsPatch' },
                { k: 'sign', x: 3, y: 2, text: "THE FAR SHELF. Four planks, side by side, and the Needle holds three. (Mr Ives never could work out how to get back from it without falling in. He fell in a lot.)" },
            ],
        },
        /* ---------------- 5 The Loading Bay: a stray across four gaps, and three stitches; one gap filled for good ---------------- */
        '2,2': {
            name: 'The Loading Bay',
            rows: ['####################', '#.......oooo.......#', '#.......oooo.......#', '#.......oooo.......#', '#.......oooo.......#', '........oooo.......#', '#.......oooo.......#', '#.......oooo.......#', '#.......oooo.......#', '#.......oooo.......#', '####################'],
            ents: [
                { k: 'chalk', x: 8, y: 5, type: 'bridge', id: 'lbA' }, { k: 'chalk', x: 9, y: 5, type: 'bridge', id: 'lbB' },
                { k: 'chalk', x: 10, y: 5, type: 'bridge', id: 'lbC' }, { k: 'chalk', x: 11, y: 5, type: 'bridge', id: 'lbD' },
                { k: 'stray', x: 5, y: 3, id: 'lbS1' }, { k: 'stray', x: 5, y: 7, id: 'lbS2' },
                { k: 'plate', x: 15, y: 5, sig: 'ufE' },
                { k: 'chute', x: 1, y: 9, drop: [2, 8], id: 'lbChute' },
                { k: 'sign', x: 16, y: 2, text: "THE LOADING BAY. Something heavy on the plate lights the east lamp. (You can't see past a thing you're pushing to sew what's in front of it. -I.)" },
            ],
        },
        /* ---------------- 6 The Gallery: Mr Ives's walk to his chair ---------------- */
        '1,1': {
            name: 'The Gallery',
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#..o..o..o..o..o...#', '#oooooooooooooooooo#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'chalk', x: 3, y: 5, type: 'bridge', id: 'gaA' }, { k: 'chalk', x: 6, y: 5, type: 'bridge', id: 'gaB' }, { k: 'chalk', x: 9, y: 5, type: 'bridge', id: 'gaC' },
                { k: 'chalk', x: 12, y: 5, type: 'bridge', id: 'gaD' }, { k: 'chalk', x: 15, y: 5, type: 'bridge', id: 'gaE' },
                { k: 'deco', x: 17, y: 4, look: 'stool', solid: [[0, 0]], text: "Mr Ives's chair, by the window, where he meant to sit and watch the Wanderers come and go." },
                { k: 'deco', x: 17, y: 2, look: 'window', solid: [[0, 0]], ox: 0, text: 'The window looks down over the whole town.' },
                { k: 'ivesWalker', x: 1, y: 5, id: 'ivesWalk' },
            ],
        },
    },
});
ITEMS.guildpin = { name: 'The Guild pin', kind: 'quest', desc: "A little brass spool on a pin: the Makers' Guild's own. Any Maker's door opens to it." };
ITEMS.longhook = { name: 'The Long Hook', kind: 'quest', desc: "Mr Ives's old hook, on a longer line. The Hookline reaches further (10 tiles, not 7)." };
ITEM_LINES.longhook = () => "You got {red}the Long Hook{/}! Mr Ives's old hook on a longer line: the Hookline reaches ten tiles now.";

/* the Hookline, with the Long Hook, reaches further */
{
    const up0 = TOOLS.hook.update;
    TOOLS.hook.update = function (area) {
        const h = this.h;
        if (h && h.state === 'out' && Inv.items.longhook && !h.long) { h.long = true; h.dist -= 3 * T; }
        return up0.call(this, area);
    };
}

/* a chalk piece: drawn, not built. The Needle sews it real (a bridge over its gap); the Needle
   holds three stitches, things and chalk together */
class ChalkPiece extends Ent {
    constructor(tx, ty, p = {}) { super('chalk', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.len = p.len || 1; this.dir = p.dir || 'h'; this.sewn = false; }
    get sortY() { return this.y - 100; }
    tiles() { const out = []; for (let i = 0; i < this.len; i++) out.push(this.dir === 'v' ? [this.tx, this.ty + i] : [this.tx + i, this.ty]); return out; }
    covers(x, y) { return this.tiles().some(([a, b]) => a === x && b === y); }
    /* a gap filled in for good (a stray in it) leaves nothing to bridge */
    get builtOver() { return this.tiles().every(([x, y]) => !this.area.kind(x, y).pit && !this.sewn); }
    get cuttable() { return this.sewn; }
    cutAt(x, y) { return this.sewn && this.covers(x, y); }
    onCut() { Needle.unsewRec(this); }
    sew(quiet) {
        if (this.sewn) return true;
        const a = this.area;
        if (this.builtOver) return false;
        for (const [x, y] of this.tiles()) a.setCell(x, y, this.dir === 'v' ? '|' : '_');
        this.sewn = true;
        if (!quiet) { Sfx.play('twang'); for (const [x, y] of this.tiles()) Fx.sparkle(x * T + 8, y * T + 8, '#fbf6ea'); }
        return true;
    }
    unsew(quiet) {
        if (!this.sewn) return;
        const a = this.area, p = G.player;
        this.sewn = false;
        for (const [x, y] of this.tiles()) {
            a.setCell(x, y, 'o');
            const o = a.at(x, y);
            /* a thing given its place on the plank: that place is gone, so its stitch goes too (or it would hang there) */
            if (o && o.stitched) { const rec = Inv.stitches.find(s => s.area === a.id && s.key === Needle.key(o)); if (rec) Needle.unpick(rec); }
            if (o && o.landed) o.landed(false);
            for (const w of a.ents) if (w.onUnsew) w.onUnsew(x, y);
        }
        if (!quiet && p && p.area === a && this.covers(p.tx, p.ty) && p.state === 'normal') p.startFall('pit');
        if (!quiet) { Sfx.play('unclick'); for (const [x, y] of this.tiles()) Fx.dust(x * T + 8, y * T + 8); }
    }
    draw(cx, cy) {
        const a = this.area;
        if (this.builtOver) return;
        for (const [x, y] of this.tiles()) {
            const sx = x * T - cx, sy = y * T - cy;
            if (this.sewn) { for (let i = 3; i < 16; i += 5) Gfx.rect(this.dir === 'v' ? sx + 1 : sx + i, this.dir === 'v' ? sy + i : sy + 1, this.dir === 'v' ? 14 : 2, this.dir === 'v' ? 2 : 14, THREAD.wren); continue; }
            /* chalk: a dashed outline of planks over the gap */
            for (let i = 0; i < 16; i += 4) { Gfx.rect(sx + i, sy + 1, 2, 1, '#f4f0e4'); Gfx.rect(sx + i, sy + 14, 2, 1, '#f4f0e4'); Gfx.rect(sx + 1, sy + i, 1, 2, '#f4f0e4'); Gfx.rect(sx + 14, sy + i, 1, 2, '#f4f0e4'); }
            for (let i = 4; i < 13; i += 4) Gfx.rect(this.dir === 'v' ? sx + 3 : sx + i, this.dir === 'v' ? sy + i : sy + 3, this.dir === 'v' ? 10 : 1, this.dir === 'v' ? 1 : 10, '#d8d0c0');
        }
    }
}
SPAWN.chalk = (x, y, p) => new ChalkPiece(x, y, p);

/* the Needle on chalk: sew it (a stitch, like any other: three at once, a fourth undoes the oldest); sewn, ask to unpick */
{
    const use0 = Needle.use;
    /* the chalk pieces in a line in front of Wren, nearest first (up to the Needle's reach) */
    Needle.chalkLine = function (p) {
        const a = p.area, out = [];
        for (let i = 1; i <= this.REACH; i++) {
            const x = p.tx + DX[p.dir] * i, y = p.ty + DY[p.dir] * i;
            const c = a.ents.find(e => e.kind === 'chalk' && e.covers(x, y) && !e.builtOver);
            if (c && !out.includes(c)) out.push(c);
            if (a.at(x, y) || (a.kind(x, y).solid && !a.kind(x, y).pit)) break;
        }
        return out;
    };
    Needle.sewChalk = function (p, c) {
        if (!c.sew()) { UI.toast('The gap is filled in already.'); return; }
        Inv.stitches.push({ area: p.area.id, key: 'chalk:' + c.id, chalk: true });
        Stats.count('stitches'); Stats.count('chalk:sewn');
        if (!Progress.flag('chalk_first')) { Progress.set('chalk_first'); UI.toast('Sewn: real now. (The Needle holds three stitches; a fourth undoes the oldest.)', 220); }
        if (Inv.stitches.length > this.MAX) { this.unpick(Inv.stitches[0]); UI.toast('Three stitches is all the Needle holds: the oldest comes undone.', 140); }
    };
    Needle.use = function (p) {
        if (this.st) return use0.call(this, p);
        const line = this.chalkLine(p), c = line[0];
        if (!c) return use0.call(this, p);
        if (!c.sewn) return this.sewChalk(p, c);
        const next = line.find(e => !e.sewn);
        Script.run(function* () {
            const opts = next ? ['Unpick this one', 'Sew the next one along', 'Leave it'] : ['Unpick it', 'Leave it'];
            const i = yield* ask(null, 'Sewn, with your stitches.', opts);
            if (i === 0) Needle.unsewRec(c);
            else if (next && i === 1) Needle.sewChalk(p, next);
        });
    };
    /* undoing a chalk stitch: the piece goes back to chalk */
    const unpick0 = Needle.unpick;
    Needle.unpick = function (rec) {
        if (!rec.chalk) return unpick0.call(this, rec);
        const i = Inv.stitches.indexOf(rec); if (i >= 0) Inv.stitches.splice(i, 1);
        const a = G.map; if (!a || rec.area !== a.id) return;
        const c = a.ents.find(e => e.kind === 'chalk' && 'chalk:' + e.id === rec.key);
        if (c) c.unsew();
    };
    Needle.unsewRec = function (c) {
        const rec = Inv.stitches.find(r => r.chalk && r.area === c.area.id && r.key === 'chalk:' + c.id);
        if (rec) Inv.stitches.splice(Inv.stitches.indexOf(rec), 1);
        c.unsew();
    };
    /* built again: sewn pieces are sewn */
    const apply0 = Needle.apply;
    Needle.apply = function (a) {
        apply0.call(this, a);
        for (const rec of Inv.stitches || []) {
            if (!rec.chalk || rec.area !== a.id) continue;
            const c = a.ents.find(e => e.kind === 'chalk' && 'chalk:' + e.id === rec.key);
            if (c) c.sew(true);
        }
    };
}

/* Mr Ives's walk, in the Gallery: along the row to his chair, a tile at a time; he waits at a gap, and if the bridge
   under him comes undone he drops, and his own old thread hauls him back to the start */
class IvesWalker extends GridThing {
    constructor(tx, ty, p = {}) {
        /* (as heavy as a post to the Hookline: it bounces off him rather than haul him about) */
        super('npc', tx, ty, Object.assign({ weight: WEIGHT.fixed, marked: false, hookable: false, noPush: true, noNeedle: true, noCut: true, noCutLine: "His thread's his own business, he says." }, p));
        this.who = 'mrives'; this.sprId = 'mrives'; this.dir = RIGHT; this.t = 0; this.wait = 60; this.home = [tx, ty]; this.person = true; this.anim = 0;
        this.done = Progress.flag('ives_done');
    }
    onAdd(area) { super.onAdd(area); if (this.done) { const r = area.roomAt(this.tx, this.ty); this.warpTo(r.x + 16, this.ty); this.dir = DOWN; } }
    landed() { }
    warpTo(x, y) { const a = this.area; a.unplace(this, this.tx, this.ty); this.tx = x; this.ty = y; this.x = x * T; this.y = y * T; a.place(this, x, y); }
    onUnsew(x, y) {
        if (this.done || x !== this.tx || y !== this.ty) return;
        /* down he goes, and up on his own thread, back to the start */
        Fx.fallAt(this.tx * T, this.ty * T, personFrame('mrives', DOWN, 0)); Sfx.play('fall');
        this.warpTo(this.home[0], this.home[1]); this.wait = 120; this.dir = RIGHT;
        Fx.poof(this.tx * T + 8, this.ty * T + 8);
        this.bubble = 'bang'; this.bubbleT = 90;
        if (!Progress.flag('ives_fell')) { Progress.set('ives_fell'); G.pendingToast = "\"Whoops!\" Mr Ives drops through, and his own old thread hauls him back to the start. \"Not to worry! Again!\""; }
    }
    update() {
        this.stepMove();
        if (this.bubbleT > 0 && --this.bubbleT === 0) this.bubble = null;
        if (this.mv) { this.anim++; return; }
        if (this.done || Script.blocking()) return;
        const p = G.player, a = this.area;
        if (!p || p.area !== a || Cam.room !== a.roomAt(this.tx, this.ty)) return;
        /* moved off his walk somehow: his own old thread hauls him back to the start */
        if (this.ty !== this.home[1] || a.roomAt(this.tx, this.ty) !== a.roomAt(this.home[0], this.home[1])) { this.warpTo(this.home[0], this.home[1]); this.wait = 120; this.dir = RIGHT; Fx.poof(this.tx * T + 8, this.ty * T + 8); return; }
        if (this.wait > 0) { this.wait--; return; }
        const r = a.roomAt(this.tx, this.ty), nx = this.tx + 1;
        if (nx > r.x + 16) { this.finish(); return; }
        if (a.kind(nx, this.ty).pit) { if (!this.bubble) { this.bubble = 'dots'; this.bubbleT = 60; } this.wait = 20; return; }
        if (!a.freeForThing(nx, this.ty, this)) { this.wait = 20; return; }
        this.dir = RIGHT; this.startMove(nx, this.ty, 22); this.wait = 18;
    }
    finish() {
        this.done = true; this.dir = DOWN; Progress.set('ives_done'); Stats.count('ives_done');
        Script.run(Unfinished.atChair(this));
    }
    interact(p) {
        Script.run(function* () { yield* say('mrives', Progress.flag('ives_done') ? cycle('ives_chair', ["Look at it. All of it, real. Well. Three bits at a time.", "You'll come and see an old man now and then? Bring that cat."]) : "Off we go, then. You sew, I'll walk. Don't let me fall in; I'm not as bouncy as I was."); });
        return true;
    }
    sprite() { const fr = this.mv ? [1, 0, 2, 0][Math.floor(this.anim / 6) % 4] : 0; return personFrame('mrives', this.dir, fr); }
    draw(cx, cy) {
        const im = this.sprite(); if (!im) return;
        const sx = this.px - cx, sy = this.py - cy - (im.height - T) - 2;
        Gfx.alpha(0.22); Gfx.rect(sx + 3, this.py - cy + 13, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.img(im, sx, sy, this.dir === LEFT);
        if (this.bubble) Gfx.img(spr('bubble_' + this.bubble), sx + 8, sy - 10);
    }
    get sortY() { return this.py + 15; }
}
SPAWN.ivesWalker = (x, y, p) => new IvesWalker(x, y, p);

const Unfinished = {
    open() { return Inv.has('needle') && (Inv.items.guildpin || Progress.flag('d8')); },
    *door() {
        if (!Unfinished.open()) {
            yield* say('mrives', Inv.has('needle') ? "You've a Needle! Good girl. But I can't let anybody in who's not a Maker, Guild rules. Bring me the Guild's pin. Or come back when you've done something bigger; I'll know." : "My House. Not finished. Never will be, the way my hands are. You'd need a Needle to do anything with it, and nobody has a Needle any more.");
            return;
        }
        if (!Progress.flag('ives_in')) {
            Progress.set('ives_in');
            yield* say('mrives', "Forty years ago I drew a whole House in chalk, for a Wanderer of my own. Never built a stick of it. My hands, see.");
            yield* say('mrives', "You sew it. I'll follow you round and tell you how clever it all was going to be.");
        }
        World.go('unfinished', 29, 42, { dir: UP, fade: true });
    },
    *atChair(w) {
        yield 20;
        yield* say('mrives', "Oh. Oh, there it is. My chair. I drew this chair when I had all my own teeth.");
        yield* say('mrives', "Here. My old hook. Longer line than they make now; I made it for this House, and never had a House to use it in.");
        yield* Story.getItem('longhook')();
        Progress.setGoal('');
        Save.autosave();
    },
};
SPAWN.ivesdoor = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: null, solid: [[0, 0]] });
    pr.interact = () => { Script.run(Unfinished.door()); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    pr.draw = () => { };
    return pr;
};
/* his house in the town: up the bank east of the river, with Mr Ives outside it (after Reveal 1, when Makers are Makers) */
{
    const B = OW.blocks['1,1'];
    B.rows[4] = B.rows[4].slice(0, 57) + '.' + B.rows[4].slice(58);
    B.ents.push(
        { k: 'building', x: 54, y: 3, w: 5, h: 3, door: 2, style: 'cottage', variant: 'b' },
        { k: 'ivesdoor', x: 56, y: 5 },
        { k: 'sign', x: 59, y: 6, text: 'IVES. (UNFINISHED.)' },
        { k: 'npc', who: 'mrives', x: 58, y: 7, face: 'left', id: 'mrivesTown', if: 'reveal1&!ives_done' },
        { k: 'npc', who: 'mrives', x: 58, y: 7, face: 'down', id: 'mrivesTown2', if: 'ives_done' });
}
TALK.mrives = function* (n) {
    if (n.area && n.area.id === 'unfinished') return yield* say('mrives', cycle('ives_in', ["The Needle holds three. I never could hold more than two in my head at once, so you're ahead of me already.", "Mind where you stand when you sew the next one. I fell through my own floor twice when I drew it, and it was only chalk.", "The Gallery's at the top, once you've lit both lamps. That's the bit I wanted to see finished."]));
    if (Progress.flag('ives_done')) return yield* say('mrives', cycle('ives_town', ["Best afternoon I've had in forty years, that.", "Hesper and I were at school together, you know. She cried at everything. Still does, I expect."]));
    if (!Unfinished.open()) return yield* Unfinished.door();
    yield* say('mrives', "Door's open for you, Maker. In you go.");
};

/* Gundry gives the Guild pin for all six Maker's marks */
{
    const g0 = UNDER_TALK.gundry;
    UNDER_TALK.gundry = function* (n) {
        if (['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'].every(h => Progress.flag('sig:' + h)) && !Inv.items.guildpin) {
            yield* say('gundry', "Six Maker's marks. You found all six. Mother Ives's broom, Bram's pot, your dad's wheel, your mum's bell, Mallow's moon, Jory's star. Nobody's ever found all six. Nobody's ever LOOKED.");
            yield* say('gundry', "That makes you one of us, near enough. Here: the Guild's pin. Old Mr Ives up past the river will want to see that.");
            yield* Story.getItem('guildpin')();
            Progress.set('s06'); Stats.count('secret:guildpin');
            return;
        }
        return yield* g0(n);
    };
}

function initUnfinished() {
    defSprite('icon_longhook', ['................', '.........kkk....', '........kwwwk...', '.......kw...wk..', '.......kw....k..', '........k...wk..', '............wk..', '...........kwk..', '..........kwk...', '.........kwk....', '....kk..kwk.....', '...kbbkkwk......', '..kbbbbkk.......', '..kbbbbk........', '...kkkk.........', '................'], { w: '#e4ecf5', b: '#9a6438' });
    defSprite('icon_guildpin', ['................', '......kkkk......', '.....kyyyyk.....', '....kyrrrryk....', '....kyrrrryk....', '....kyyyyyyk....', '....kyrrrryk....', '....kyrrrryk....', '.....kyyyyk.....', '......kkkk......', '.......kk.......', '.......kk.......', '.......kk.......', '.......kk.......', '........k.......', '................'], { y: '#e8c04a', r: '#a8784a' });
}
CONTENT_INIT.push(initUnfinished);
