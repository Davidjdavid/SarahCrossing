/* The Makings: Tuck's Little Wander. Three little Houses the Makers built for Tuck (six, very brave), run by Wren
   from underneath. Wren can't go up; Tuck walks on his own, by four simple rules you can watch him follow:
     1. he goes for the door (the little hoop at the end);
     2. anything that jumps, he goes and gives it a push (a tug on a home thing's cord makes it jump);
     3. he won't go near anything that bites (a nibbler not tied up);
     4. stuck, he goes as near the door as he can and sits down and sulks.
   He's as heavy as a person (plates feel him), pushes what a person can, and a heavy thing going home will bowl
   him over (a bump: "Ow!", and he's back at the start). His own thread hangs under his start, like everybody's.
   The Makers grade the Little Wander in Ahas: Tuck clearing his own way with a push; Tuck finding the hidden button;
   not a scratch on him. (S30: all three, every time.) */

const MAKING_NAMES = ['The Little Tidyhouse', 'Mind the Nibbler', 'The Little Wander'];

/* ---------------- Tuck ---------------- */
class Tuck extends NPC {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ who: 'tuck', marked: false }, p));
        this.person = true; this.weight = WEIGHT.medium; this.noPush = true; this.showThrough = true;
        this.home0 = [tx, ty];
        this.state = 'go'; this.st = 0; this.wait = 0; this.cur = null; this.seen = 0; this.sitSpot = null;
        this.bumps = 0; this.held = false;
        /* his own thread, down to his start (like everybody's) */
        this.ret = { mx: tx, my: ty, area: null, color: THREAD.wren, state: 'home', trace: [[tx, ty]], timer: 0, patience: 1e9, snap: false, strain: 0, pace: 10 };
    }
    onAdd(area) { area.place(this, this.tx, this.ty); }
    get making() { return Making.cur; }
    /* tiles Tuck will walk: up top, open, no holes or spikes, nothing in the way, nowhere near a biter */
    walkable(x, y, scary) {
        const a = this.area, k = a.kind(x, y), r = a.roomAt(x, y);
        if (!r || r.above || k.solid || k.pit || k.deep || k.fog || k.ledge || k.hurt) return false;
        const o = a.at(x, y); if (o && o !== this) return false;
        for (const b of a.blockers) if (b.blocks(x, y, this)) return false;
        for (const m of a.walkers) if (m.alive !== false && m.onTile && m.onTile(x, y)) return false;
        if (scary && scary.some(n => Math.max(Math.abs(n.tx - x), Math.abs(n.ty - y)) <= 2)) return false;
        return true;
    }
    scary() { return this.area.ents.filter(e => e.kind === 'nibbler' && e.alive && !e.knotted); }
    /* breadth-first from Tuck: the way to a tile, or to the reachable tile nearest it */
    route(gx, gy, nearest) {
        const a = this.area, scary = this.scary(), start = key2(this.tx, this.ty), prev = new Map([[start, null]]), q = [[this.tx, this.ty]];
        let best = [this.tx, this.ty], bd = Math.abs(this.tx - gx) + Math.abs(this.ty - gy);
        while (q.length) {
            const [x, y] = q.shift();
            const d = Math.abs(x - gx) + Math.abs(y - gy);
            if (d < bd) { bd = d; best = [x, y]; }
            if (x === gx && y === gy) break;
            for (const dd of [UP, DOWN, LEFT, RIGHT]) {
                const nx = x + DX[dd], ny = y + DY[dd], k = key2(nx, ny);
                if (prev.has(k) || prev.size > 1500) continue;
                if (!this.walkable(nx, ny, scary)) continue;
                prev.set(k, [x, y]); q.push([nx, ny]);
            }
        }
        const end = prev.has(key2(gx, gy)) ? [gx, gy] : (nearest ? best : null);
        if (!end) return null;
        const path = []; let c = end;
        while (c && !(c[0] === this.tx && c[1] === this.ty)) { path.unshift(c); c = prev.get(key2(c[0], c[1])); }
        return path;
    }
    /* how near the door he could get from here (the reachable tile nearest it) */
    reach(g) {
        const r = this.route(g[0], g[1], true), [x, y] = r && r.length ? r[r.length - 1] : [this.tx, this.ty];
        return Math.abs(x - g[0]) + Math.abs(y - g[1]);
    }
    say(text, bubble) { if (bubble) { this.bubble = bubble; this.bubbleT = 70; } if (text) Fx.text(this.px + 8, this.py - 18, text, '#fbf6ea'); }
    step(nx, ny) { this.dir = dirOf(nx - this.tx, ny - this.ty); this.startMove(nx, ny, 14); }
    /* a bump: a biter, or a heavy thing on its way home: "Ow!", and back to the start */
    bump(why) {
        if (this.state === 'done') return;
        this.bumps++; Stats.count('tuck:bump');
        this.say('Ow!', 'bang'); Sfx.play('hurt');
        Making.note('bump', why);
        this.yank(true);
    }
    /* back to his start (a bump, or somebody tugging his thread) */
    yank(hurt) {
        const a = this.area;
        a.unplace(this, this.tx, this.ty); if (this.mv) a.unplace(this, this.mv.fx, this.mv.fy);
        this.mv = null;
        const [hx, hy] = this.home0;
        Fx.poof(this.px + 8, this.py + 8);
        this.tx = hx; this.ty = hy; this.x = hx * T; this.y = hy * T;
        if (a.at(hx, hy)) { const f = [[hx, hy + 1], [hx + 1, hy], [hx, hy - 1]].find(([x, y]) => this.walkable(x, y)); if (f) { this.tx = f[0]; this.ty = f[1]; this.x = this.tx * T; this.y = this.ty * T; } }
        a.place(this, this.tx, this.ty);
        Fx.poof(this.px + 8, this.py + 8);
        this.state = 'go'; this.cur = null; this.wait = 30; this.path = null;
        if (!hurt) this.say('Wheee!', 'heart');
    }
    onTug() {
        Sfx.play('flight'); this.yank(false); Stats.count('tuck:yanked');
        if (!Progress.flag('tuck_yanked')) { Progress.set('tuck_yanked'); G.pendingToast = "Ives, from somewhere above: \"Not the boy's own thread, love! ...He did like it, mind.\""; }
    }
    onKnot() { this.say('Hey! I can\'t move!', 'bang'); }
    onUntie() { this.say('Phew.'); }
    canBeShoved(d) { return !this.mv; }
    shove(d, dur, by) { this.bump('shoved'); }
    update() {
        this.stepMove();
        if (this.bubbleT > 0 && --this.bubbleT === 0) this.bubble = null;
        if (this.mv) { this.anim++; return; }
        if (this.state === 'done' || Script.blocking() || this.knotted) return;
        if (this.wait > 0) { this.wait--; return; }
        const a = this.area, g = Making.goal(a);
        if (!g) return;
        /* at the hoop */
        if (this.tx === g[0] && this.ty === g[1]) { this.state = 'done'; Making.finish(a); return; }
        /* 3: anything that bites, close by: back off */
        const scary = this.scary(), near = scary.filter(n => Math.max(Math.abs(n.tx - this.tx), Math.abs(n.ty - this.ty)) <= 2);
        if (near.length) {
            const opts = [UP, DOWN, LEFT, RIGHT].map(d => [this.tx + DX[d], this.ty + DY[d]]).filter(([x, y]) => this.walkable(x, y));
            const far = ([x, y]) => Math.min(...near.map(n => Math.max(Math.abs(n.tx - x), Math.abs(n.ty - y))));
            opts.sort((m, n) => far(n) - far(m));
            if (opts.length && far(opts[0]) > Math.min(...near.map(n => Math.max(Math.abs(n.tx - this.tx), Math.abs(n.ty - this.ty))))) { this.step(...opts[0]); if (this.state !== 'scared') this.say('Eek!', 'bang'); this.state = 'scared'; this.cur = null; return; }
            this.state = 'scared'; this.wait = 10; return;
        }
        /* 2: something jumped: go and push it */
        const j = Spool.jolt;
        if (j && j.t > this.seen && G.t - j.t < 240 && !j.e.removed && a.roomAt(j.e.tx, j.e.ty) === a.roomAt(this.tx, this.ty) && Math.max(Math.abs(j.e.tx - this.tx), Math.abs(j.e.ty - this.ty)) <= 8) {
            this.seen = j.t; this.cur = j.e; this.curT = 0; this.say('Ooh! It jumped!', 'bang');
        }
        if (this.cur) {
            const o = this.cur;
            if (o.removed || ++this.curT > 600) { this.cur = null; }
            else {
                const adj = Math.abs(o.tx - this.tx) + Math.abs(o.ty - this.ty) === 1;
                if (adj) {
                    const d = dirOf(o.tx - this.tx, o.ty - this.ty); this.dir = d;
                    this.cur = null; this.wait = 60;      /* (and then he admires it a moment) */
                    const tr = a.ents.find(e => e.kind === 'treasure' && !e.found && e.tx === o.tx && e.ty === o.ty);
                    if (tr) { tr.found = true; a.remove(tr); Making.aha('found'); this.say('Ooh! A shiny button under it!', 'heart'); Sfx.play('button'); Inv.buttons += 5; }
                    if (o.weight > WEIGHT.medium || o.fixed || o.mv) { if (!tr) this.say('Hnnngh!', 'dots'); return; }
                    const before = this.reach(g);
                    if (o.push(d, 16)) {
                        Stats.count('tuck:push'); this.pushedT = G.t;
                        Making.checkCleared = { t: G.t + 20, by: this, before };
                    } else if (!tr) this.say('Hmm.', 'dots');
                    return;
                }
                /* walk to the side of it nearest him */
                const sides = [UP, DOWN, LEFT, RIGHT].map(d => [o.tx + DX[d], o.ty + DY[d]]).filter(([x, y]) => this.walkable(x, y));
                let best = null;
                for (const [x, y] of sides) { const r = this.route(x, y, false); if (r && (!best || r.length < best.length)) best = r; }
                if (best && best.length) { this.step(...best[0]); this.state = 'curious'; return; }
                this.say(null, 'dots'); this.cur = null;
            }
        }
        /* 1: for the door */
        const r = this.route(g[0], g[1], false);
        if (r && r.length) { if (this.state === 'sit') this.say('Ooh!'); this.state = 'go'; this.step(...r[0]); return; }
        /* 4: stuck: as near as he can get, then sit and sulk */
        const n = this.route(g[0], g[1], true);
        if (n && n.length) { this.state = 'go'; this.step(...n[0]); return; }
        if (this.state !== 'sit') { this.state = 'sit'; this.say('Hmph.', 'dots'); Making.note('sat'); }
        this.wait = 20;
    }
    sprite() {
        if (this.state === 'sit' && !this.mv) return personFrame('tuck', DOWN, 0);
        return super.sprite();
    }
    draw(cx, cy) {
        super.draw(cx, cy);
        if (this.state === 'sit' && !this.mv && (G.t >> 5) % 2) Font.draw('z', this.px - cx + 12, this.py - cy - 18, '#cfc6b8');
        if (this.knotted) { const x = this.px + 8 - cx, y = this.py + 14 - cy; Gfx.line(x, y, x, y + 3, THREAD.wren); }
    }
}
SPAWN.tuck = (x, y, p) => new Tuck(x, y, p);

/* ---------------- nibblers: little biters, tied to their nests ---------------- */
class Nibbler extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'nibbler', hp: 99 }, p));
        this.kind = 'nibbler'; this.cordable = true; this.st = 0; this.showThrough = true;
        this.ret = { mx: tx, my: ty, area: null, color: '#8a6a4e', state: 'home', trace: [[tx, ty]], timer: 99, patience: 99, snap: false, strain: 0, pace: 10 };
    }
    get px() { return this.x - 8; }
    get py() { return this.y - 10; }
    hurtBox() { return null; }
    onTile(x, y) { return this.alive && this.tx === x && this.ty === y; }
    update() {
        if (!this.alive) return;
        this.t++;
        const home = this.tx === this.hx && this.ty === this.hy;
        if (!this.ret.snap) this.ret.state = home ? 'home' : 'away';
        if (this.knotted || Script.blocking()) { this.anim += this.knotted ? 1 : 0; return; }
        const gx = this.hx * T + 8, gy = this.hy * T + 10;
        if (this.ret.snap) {
            const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
            if (d <= 3.5) { this.x = gx; this.y = gy; this.ret.snap = false; this.st = 0; }
            else { this.x += dx / d * 3.5; this.y += dy / d * 3.5; }
            return;
        }
        const tk = this.area.ents.find(e => e.kind === 'npc' && e.who === 'tuck');
        this.st++;
        const sp = 0.55;
        /* Tuck close to the nest: after him; otherwise potter about near home */
        if (tk && Math.hypot(tk.tx - this.hx, tk.ty - this.hy) <= 4 && tk.state !== 'done') {
            const dx = tk.px + 8 - this.x, dy = tk.py + 10 - this.y, d = Math.hypot(dx, dy) || 1;
            this.dir = dirOf(dx, dy);
            if (Math.hypot(this.x + dx / d * sp - gx, this.y + dy / d * sp - gy) < 3.2 * T) this.move(dx / d * sp, dy / d * sp);
            this.anim++;
            if (d < 9) tk.bump('bitten');
        } else {
            if (this.st % 90 === 0) this.wdir = Math.floor(G.rng() * 5);
            const tx = this.wdir < 4 ? this.x + DX[this.wdir] * sp : this.x, ty = this.wdir < 4 ? this.y + DY[this.wdir] * sp : this.y;
            if (this.wdir < 4 && Math.hypot(tx - gx, ty - gy) < 2.2 * T) { this.move(DX[this.wdir] * sp, DY[this.wdir] * sp); this.dir = this.wdir; this.anim++; }
            else if (Math.hypot(this.x - gx, this.y - gy) > 2 * T) { const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy); this.move(dx / d * sp, dy / d * sp); }
        }
    }
    struck() { }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy, sh = this.knotted ? ((this.t >> 2) % 2 ? 1 : -1) : 0;
        Gfx.alpha(0.25); Gfx.rect(x - 5, y + 1, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.img(spr('nibbler_' + ((this.anim >> 3) % 2)), x - 8 + sh, y - 14, this.dir === LEFT);
        if (this.knotted) { Gfx.line(x, y - 2, x, y + 4, '#8a6a4e'); Gfx.rect(x - 1, y + 3, 3, 1, '#c9a24a'); }
    }
}
SPAWN.nibbler = (x, y, p) => new Nibbler(x, y, p);

/* a shiny button hidden under something: Tuck finds it if he pushes that thing off it */
class Treasure extends FloorThing {
    constructor(tx, ty, p = {}) { super('treasure', tx, ty, p); }
    draw(cx, cy) { if (!this.area.at(this.tx, this.ty)) Gfx.img(spr('button5'), this.x - cx, this.y - cy); }
}
SPAWN.treasure = (x, y, p) => new Treasure(x, y, p);

/* the little hoop at the end of each Little House */
SPAWN.littlehoop = (x, y, p) => { const h = new Hoop(x, y, p); h.little = true; h.interact = () => false; return h; };

/* ---------------- the Little Wander ---------------- */
const Making = {
    cur: null,              /* { n, ahas: Set, bumps, t0 } for the Making being run */
    checkCleared: null,
    goal(a) { const h = a.ents.find(e => e.kind === 'hoop' && e.little); return h ? [h.tx - 1, h.ty] : null; },
    start(a) {
        this.cur = { n: a.def.making, ahas: new Set(), bumps: 0, t0: G.t, sat: 0 };
        this.checkCleared = null;
    },
    note(what, why) { if (!this.cur) return; if (what === 'bump') { this.cur.bumps++; this.cur.why = why; } if (what === 'sat') this.cur.sat++; },
    aha(id) {
        if (!this.cur || this.cur.ahas.has(id)) return;
        this.cur.ahas.add(id); Stats.count('aha:' + id);
        Sfx.play('appear');
        UI.toast({ cleared: 'Aha! Tuck cleared his own way!', found: 'Aha! Tuck found the hidden button!', unhurt: 'Aha! Not a scratch on him!' }[id], 120);
    },
    tick(a) {
        if (!this.cur || this.cur.n !== a.def.making) this.start(a);
        const c = this.checkCleared;
        if (c && G.t >= c.t && !c.by.mv) {
            this.checkCleared = null;
            const g = this.goal(a);
            /* his own push got him nearer the door than he could get before */
            if (g && c.by.reach(g) < c.before) this.aha('cleared');
        }
    },
    finish(a) {
        const c = this.cur, n = a.def.making;
        if (c && c.bumps === 0) this.aha('unhurt');
        Script.run(function* () {
            const t = a.ents.find(e => e.kind === 'npc' && e.who === 'tuck');
            yield 30;
            Sfx.play('knot');
            yield* say('tuck', "I DID IT! Did you see? I did it ALL by MYSELF!");
            const ahas = c ? c.ahas.size : 0;
            Progress.set('making' + n);
            const best = 'making' + n + '_ahas';
            if (ahas > (Progress.get(best) || 0)) Progress.set(best, ahas);
            yield* say(null, `${MAKING_NAMES[n - 1].toUpperCase()}: done. Ahas: ${ahas} of 3. Bumps: ${c ? c.bumps : 0}.`);
            const lines = [
                ["Ives, from somewhere above: \"He thinks he did it all himself. That's the whole trick of it, love.\""],
                ["Bram, from somewhere above: \"HA! He never even saw you. Not once. That's the job.\""],
                ["Tess, from somewhere above: \"Oh, his face. Did you see his face?\""],
            ][n - 1];
            yield* say(null, lines[0]);
            if ([1, 2, 3].every(i => (Progress.get('making' + i + '_ahas') || 0) >= 3) && !Progress.flag('s30')) {
                Progress.set('s30'); Stats.count('secret:ahas');
                yield* say('tuck', "I drew you a picture! It's you. Well, it's a Maker. I don't know which one. It's whoever helped. Somebody helped. I could tell.");
                Inv.items.tuckdrawing = 1;
                yield* say(null, "You got Tuck's drawing: a stick figure under a floor, holding a lot of strings, smiling.");
            }
            yield* fadeOut(20);
            World.enter('underside', 49, 3, { dir: DOWN });
            yield* fadeIn(20);
            if (n === 3) yield* Making.afterAll();
            Save.autosave();
        });
    },
    *afterAll() {
        Progress.set('makings_done');
        yield* say('gundry', "Three Little Houses, and he never once saw your hands. You're a Maker, apprentice. Near enough.");
        yield* say('gundry', "One more job, and it's an honour: every Wanderer gets a fresh spool of their own for the Wander, a new thread. Tuck's is in the deep store, down the Way Down. Go and fetch it.");
        yield* say('gundry', "Mind, it's old down there. Older than the Guild. Don't touch the big ones.");
        Progress.setGoal("The Way Down, off the Making Floor: fetch Tuck's fresh spool from the deep store.");
    },
};
ITEMS.tuckdrawing = { name: "Tuck's drawing", kind: 'quest', desc: 'A stick figure under a floor, holding a lot of strings, smiling. For the fridge.' };

/* a Little House: three rooms up top for Tuck, three underneath for you (no way up: it's his Wander) */
function defMaking(n, cells) {
    defHouse({
        id: 'making' + n, name: MAKING_NAMES[n - 1], place: 'The Making Floor', house: 'making' + n, making: n, theme: 'tidy', thread: THREAD.ives, music: 'underside',
        entry: { x: 3, y: 16 },
        themeAt: (x, y) => y >= 11 ? 'underside' : ['tidy', 'kilnhouse', 'house'][n - 1],
        drawGround: (a, cx, cy) => Spool.drawAbove(a, cx, cy),
        tick: a => Making.tick(a),
        onEnter: a => Making.start(a),
        cells,
    });
}
const BELOW_ROOM = (name, above, door = true, extra = []) => ({
    name, above,
    rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#',
        (door ? '.' : '#') + '..................' + (above === '2,0' ? '#' : '.'), '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
    ents: extra,
});
const C_ROOM = () => ({
    name: 'The Hoop',
    rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '...................#', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
    ents: [{ k: 'littlehoop', x: 12, y: 5 }],
});

/* ---------------- 1: The Little Tidyhouse (Ives): out of the doorway; onto the plate ---------------- */
defMaking(1, {
    '0,0': {
        name: 'The Doorway',
        rows: ['####################', '#........###.......#', '#........###.......#', '#........###.......#', '#........#.#.......#', '#........#..........', '#........#.#.......#', '#..........#.......#', '#........###.......#', '#........###.......#', '####################'],
        ents: [{ k: 'tuck', x: 3, y: 5, id: 'tuck' }, { k: 'wood', x: 10, y: 5, id: 'm1W' }, { k: 'pot', x: 2, y: 1, id: 'm1Pot' }, { k: 'treasure', x: 2, y: 1 }],
    },
    '1,0': {
        name: 'The Plate',
        rows: ['####################', '#.............#....#', '#.............#....#', '#.............#....#', '#.............#....#', '....................', '#......#.#....#....#', '#......#.#....#....#', '#......###....#....#', '#.............#....#', '####################'],
        ents: [{ k: 'wood', x: 8, y: 6, id: 'm1K', patience: 60 }, { k: 'plate', x: 8, y: 7, sig: 'm1p' }, { k: 'door', x: 14, y: 5, type: 'gate', when: 'm1p', dir: 'v', id: 'm1Gate' }],
    },
    '2,0': C_ROOM(),
    '0,1': BELOW_ROOM('Under the Doorway', '0,0', false, [
        { k: 'sign', x: 6, y: 2, text: "TUCK'S RULES (as written by Tuck): 1. GO TO THE DOOR. 2. IF A THING JUMPS GO AND PUSH IT. 3. NOT NEAR BITEY THINGS. 4. IF STUCK, SIT DOWN. -T. (And a note: You can't go up, love. It's his Wander. -I.)" },
    ]),
    '1,1': BELOW_ROOM('Under the Plate', '1,0'),
    '2,1': BELOW_ROOM('Under the Hoop', '2,0'),
});

/* ---------------- 2: Mind the Nibbler (Bram): tie the biter up; get him out of the way of a heavy thing ---------------- */
defMaking(2, {
    '0,0': {
        name: 'The Nest',
        rows: ['####################', '##########.#########', '##########.#########', '##########.#########', '#..............#.###', '#..............#....', '#..............#.###', '#####.########...###', '#####.##############', '####################', '####################'],
        ents: [{ k: 'tuck', x: 2, y: 5, id: 'tuck' }, { k: 'nibbler', x: 10, y: 2, id: 'm2Nib' }, { k: 'pot', x: 5, y: 8, id: 'm2Pot' }, { k: 'treasure', x: 5, y: 8 }, { k: 'wood', x: 16, y: 5, id: 'm2W' }],
    },
    '1,0': {
        name: 'The Crossing',
        rows: ['####################', '#########.##########', '###.#####.##########', '###.#####.##########', '###.#####.##########', '....................', '#########.##########', '#########.##########', '#########.##########', '#########.##########', '####################'],
        ents: [
            { k: 'block', x: 9, y: 9, id: 'm2H', startAt: [9, 1], trace: [[9, 9], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1]], knotted: true, patience: 20 },
            { k: 'plate', x: 9, y: 9, sig: 'm2p' },
            { k: 'door', x: 10, y: 5, type: 'gate', when: 'm2p', dir: 'v', id: 'm2Gate' },
            { k: 'crate', x: 3, y: 3, id: 'm2Crate' },
        ],
    },
    '2,0': C_ROOM(),
    '0,1': BELOW_ROOM('Under the Nest', '0,0', false, [{ k: 'sign', x: 2, y: 2, text: "NIBBLERS: they won't hurt YOU. Tied up, they won't hurt anybody. -B." }]),
    '1,1': BELOW_ROOM('Under the Crossing', '1,0', true, [{ k: 'sign', x: 16, y: 2, text: 'MIND THE BOY. Heavy things going home go straight through anything in the way. -B.' }]),
    '2,1': BELOW_ROOM('Under the Hoop', '2,0'),
});

/* ---------------- 3: The Little Wander (Tess): a new place for the heavy one; the biter by the plate ---------------- */
defMaking(3, {
    '0,0': {
        name: 'The Heavy Door',
        rows: ['####################', '#........###.......#', '#........###.......#', '#........###.......#', '#........#.#.......#', '#........#..........', '#........#.#.......#', '#..........#.......#', '#........###.......#', '#........###.......#', '####################'],
        ents: [{ k: 'tuck', x: 3, y: 5, id: 'tuck' }, { k: 'block', x: 10, y: 5, id: 'm3H' }, { k: 'pot', x: 5, y: 8, id: 'm3Pot' }, { k: 'treasure', x: 5, y: 8 }],
    },
    '1,0': {
        name: 'The Guarded Plate',
        rows: ['####################', '#.............#....#', '#.............#....#', '#.............#....#', '#.............#....#', '....................', '#......#.#....#....#', '#......#.#....#....#', '#......###....#....#', '#.............#....#', '####################'],
        ents: [
            { k: 'wood', x: 8, y: 6, id: 'm3K', patience: 60 }, { k: 'plate', x: 8, y: 7, sig: 'm3p' },
            { k: 'door', x: 14, y: 5, type: 'gate', when: 'm3p', dir: 'v', id: 'm3Gate' },
            { k: 'nibbler', x: 5, y: 3, id: 'm3Nib' },
        ],
    },
    '2,0': C_ROOM(),
    '0,1': BELOW_ROOM('Under the Heavy Door', '0,0', false, [{ k: 'sign', x: 2, y: 2, text: "Heavy things he can't shift. A Needle can. -T." }]),
    '1,1': BELOW_ROOM('Under the Guarded Plate', '1,0'),
    '2,1': BELOW_ROOM('Under the Hoop', '2,0'),
});

/* the Making Floor's three doors (the Underside, cell 2,0) */
AREAS.underside.ents.push(
    { k: 'warp', x: 44, y: 1, to: 'making1', tx2: 3, ty2: 16, dir: 'up', face: 'right', room: '2,0' },
    { k: 'deco', x: 44, y: 0, look: 'littledoor', solid: false, baseY: -100, room: '2,0' },
    { k: 'sign', x: 43, y: 2, text: 'MAKING 1: THE LITTLE TIDYHOUSE. (Ives)', room: '2,0' },
    { k: 'warp', x: 49, y: 1, to: 'making2', tx2: 3, ty2: 16, dir: 'up', face: 'right', room: '2,0', if: 'making1' },
    { k: 'deco', x: 49, y: 0, look: 'littledoor', solid: false, baseY: -100, room: '2,0' },
    { k: 'sign', x: 48, y: 2, text: 'MAKING 2: MIND THE NIBBLER. (Bram) Opens when the first is done.', room: '2,0' },
    { k: 'warp', x: 54, y: 1, to: 'making3', tx2: 3, ty2: 16, dir: 'up', face: 'right', room: '2,0', if: 'making2' },
    { k: 'deco', x: 54, y: 0, look: 'littledoor', solid: false, baseY: -100, room: '2,0' },
    { k: 'sign', x: 53, y: 2, text: 'MAKING 3: THE LITTLE WANDER. (Tess) Opens when the second is done.', room: '2,0' },
    { k: 'npc', who: 'tuck', x: 47, y: 6, face: 'down', room: '2,0', if: 'd7&!makings_done' },
);
UNDER_TALK.tuck = function* () {
    if (!Progress.flag('making1')) { yield* say('tuck', "{name}! I'm doing a WANDER! A little one! The Makers built it! You're not allowed to help. It's MY Wander."); return; }
    if (!Progress.flag('making3')) { yield* say('tuck', cycle('tuck_mk', ["Did you see me? Did you SEE? The block just jumped and I pushed it!", "There was a nibbler. I wasn't scared. Much.", "Next one's harder. Bram said. I'm not scared."])); return; }
    yield* say('tuck', "I did my whole Little Wander! Next year I'm doing a real one.");
};
const UNDER_TALK_GUNDRY = UNDER_TALK.gundry;
UNDER_TALK.gundry = function* (n) {
    if (Progress.flag('d7') && !Progress.flag('making1') && !Progress.flag('gundry_job')) {
        Progress.set('gundry_job');
        yield* say('gundry', "Right, apprentice. The job. Tuck's been on at everybody for a Wander since he could walk. He's six. So the Makers built him a Little one: three little Houses, up above the Making Floor.");
        yield* say('gundry', "You'll run it. From underneath. He walks, you work. Get him through, don't let him get hurt, and if you're any good, he'll work something out himself and never know you were there.");
        yield* say('gundry', "Read his rules on the wall down there. He wrote them himself. Spelling's his own.");
        Progress.setGoal("The Making Floor, east of the Guild Hall: run Tuck's Little Wander from underneath.");
        return;
    }
    yield* UNDER_TALK_GUNDRY(n);
};

function initMakings() {
    const nb = { b: '#8a6a4e', B: '#5a4030', t: '#fbf6ea', e: '#2a1f2d', r: '#d6304e' };
    const nib = legs => ['................', '................', '................', '................', '................', '.....kkkkk......', '....kbbbbbk.....', '...kbebbbebk....', '...kbbbbbbbk....', '...kbrtrtrbk....', '....kBBBBBk.....', '.....kkkkk......', legs, '................', '................', '................'];
    defSprite('nibbler_0', nib('....k.k.k.k.....'), nb); defSprite('nibbler_1', nib('.....k.k.k.k....'), nb);
    ART.littledoor = paintSprite(16, 20, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#5a3a26', 1, 2, 14, 18); R('#a8784a', 2, 3, 12, 17); R('#f7d64a', 11, 11, 2, 2); R('#5ab85a', 4, 6, 8, 4); });
    SPR.littledoor = ART.littledoor;
}
CONTENT_INIT.push(initMakings);

/* a tug on a thing's cord lets the thing say so (Tuck's own thread) */
{
    const tug0 = Spool.tug;
    Spool.tug = function (e) { if (e.onTug) { Sfx.play('tug'); return e.onTug(); } return tug0.call(this, e); };
}
