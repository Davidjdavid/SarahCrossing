/* The Makings, the second half (after src/68_makings.js): Little Houses five to eight.
   5 The Tidyhouse, Underneath (Ives): the first rooms of Wren's own Wander, the Foyer, the Hall of Busts and the
     Ballroom, built again for Tuck the way she had them, and worked from underneath: now you see the cords under the busts
     you pushed. New: where he stands when it jumps decides which way he pushes it; and a tug on something out of its
     place sends it home now, shoving harder (the Hall of Busts' own trick, done from below). No Needle in Ives's rooms.
   6 The Housekeeper (Jory): Otto comes along to play the Housekeeper, with rules of his own (anything out of its
     place he goes and tidies home, coming at it from his side; a thing held fast he stands and tsks at; then back
     to his X). New: a second child, and what he does with what Tuck does.
   7 Tidy and Untidy (Mallow): both of them at once; the Needle makes a thing tidy for good.
   8 The Grand Hall (every Maker): the Tidyhouse's last room, from underneath; Otto is the Housekeeper on its cross,
     and the way past him is the one the real Housekeeper fell for. */

/* ---------------- a note on the wall: words worked out when it's read (the Makers' notes from Wren's own Wander) ---------------- */
class Memo extends Sign {
    interact() { const t = typeof this.say === 'function' ? this.say() : this.text; Script.run(function* () { for (const l of [].concat(t)) yield* say(null, l); }); return true; }
}
SPAWN.memo = (x, y, p) => new Memo(x, y, p);
/* how long Wren spent in one of the Tidyhouse's rooms on her own Wander, in whole minutes (0: no page for it) */
function tidyMinutes(name) {
    const def = AREAS.tidy, i = def && def.rooms ? def.rooms.findIndex(r => r.name === name) : -1;
    const r = i >= 0 && Stats.rooms['tidy:' + i];
    return r && r.t ? Math.max(1, Math.round(r.t / 3600)) : 0;
}
function tidyNudged(name) {
    const def = AREAS.tidy, i = def && def.rooms ? def.rooms.findIndex(r => r.name === name) : -1;
    const r = i >= 0 && Stats.rooms['tidy:' + i];
    return !!(r && r.nudges);
}

/* ---------------- no Needle in Ives's rooms ---------------- */
{
    const use0 = Needle.use;
    Needle.use = function (p) {
        if (p && p.area && p.area.def.noNeedle && !this.st) { UI.toast(p.area.def.noNeedle, 200); Sfx.play('cancel'); return; }
        return use0.call(this, p);
    };
}

/* a Maker's lever, underneath: the room up above set out again, the way it was before the boy came in (what the Makers
   do behind every Wanderer): things set out go back out, tied as they were; anything else out of its place goes home */
class ResetLever extends Lever {
    interact() {
        const a = this.area, r = Layers.upRoom(a, a.roomAt(this.tx, this.ty));
        if (!r) return false;
        const inR = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
        let moved = 0, stuck = false;
        for (const e of a.ents) {
            if (!e.isGrid || !e.ret || e.person || e.removed || e.mv || !inR(e.ret.mx, e.ret.my)) continue;
            if (e.startAt) {
                const [sx, sy] = e.startAt;
                if (e.tx === sx && e.ty === sy) continue;
                if (a.at(sx, sy) || !a.freeForThing(sx, sy, e)) { stuck = true; continue; }
                if (e.knotted) { e.knotted = false; e.fixed = e._fixed0; e.liftable = e._lift0; }
                a.unplace(e, e.tx, e.ty); e.tx = sx; e.ty = sy; e.x = sx * T; e.y = sy * T; a.place(e, sx, sy);
                e.ret.trace = (e.trace || [[e.ret.mx, e.ret.my], [sx, sy]]).map(q => q.slice()); e.ret.state = 'away'; e.ret.snap = false; e.ret.timer = e.ret.patience;
                if (e.knotStart) Spool.knot(e, true);
                Fx.poof(sx * T + 8, sy * T + 8); moved++;
            } else if (Return.away(e) && !e.knotted) { Return.snap(e); moved++; }
        }
        this.on = !this.on; Sfx.play('click'); Sfx.play('door');
        UI.toast(stuck ? "Something up there is standing just where a thing goes. It won't set out over it." : moved ? 'Up above, the room creaks and clicks, and everything is set out as it was.' : 'Everything up there is already set out as it was.', 160);
        return true;
    }
}
SPAWN.resetlever = (x, y, p) => new ResetLever(x, y, p);

/* ---------------- 5: The Tidyhouse, Underneath (Ives) ---------------- */
/* Laid out west to east: the Ballroom, the Hall of Busts, the Foyer; Tuck comes in at the Foyer's front door, as Wren
   did. Each room's own trick, the other side of the floor. */
defMaking(5, {
    /* the Ballroom: both busts home, tidied (as Wren left it); the hoop at the end of the corridor they used to jam in */
    '0,0': {
        name: 'The Ballroom',
        rows: ['####################', '#..................#', '#..................#', '#..................#', '#....##########....#', '#...................', '#...o##########....#', '##..o...........ooo#', '#.ooo...........o.o#', '##..............ooo#', '###.################'],
        ents: [
            { k: 'littlehoop', x: 3, y: 5 },
            { k: 'bust', x: 2, y: 2, id: 'm5BA' }, { k: 'bust', x: 17, y: 3, id: 'm5BB' },
            { k: 'lever', x: 6, y: 9 },
            { k: 'door', x: 3, y: 10, type: 'lock', id: 'm5LockS' },
        ],
    },
    /* the Hall of Busts: the middle bust set out up its lane and tied there; its way home runs down past the plate */
    '1,0': {
        name: 'The Hall of Busts',
        rows: ['###.################', '#..................#', '#..................#', '########...........#', '#,,,,,,,,,,,,,,,,,,#', ',,,,,,,,,,,,,,,,,,,,', '#,,,,,,,,,,,,,,,,,,#', '#,,,,,,,,,,,,,,,,,,#', '#,,,,,,,,,,,,,,,,,,#', '#,,,,,,,,,,,,,,,,,,#', '#########,##########'],
        ents: [
            { k: 'bust', x: 9, y: 6, id: 'm5B', startAt: [9, 3], trace: [[9, 6], [9, 5], [9, 4], [9, 3]], knotted: true },
            { k: 'plate', x: 9, y: 7, sig: 'm5h' },
            { k: 'wood', x: 8, y: 5, id: 'm5K' },
            { k: 'bust', x: 2, y: 8, id: 'm5B2' }, { k: 'bust', x: 17, y: 8, id: 'm5B3' },
            { k: 'pot', x: 2, y: 1, id: 'm5Pot', style: 'pot_teal' }, { k: 'treasure', x: 2, y: 1 },
            { k: 'door', x: 0, y: 5, type: 'gate', when: 'm5h', dir: 'v', id: 'm5Gate' },
            { k: 'door', x: 3, y: 0, type: 'lock', id: 'm5LockN' }, { k: 'door', x: 9, y: 10, type: 'lock', id: 'm5LockH' },
        ],
    },
    /* the Foyer: the block a step nearer the plate than Wren had it (he's six); the plate opens the way west */
    '2,0': {
        name: 'The Foyer',
        rows: ['#########.##########', '#..................#', '#.,,,,,,,,,,,,,,,,.#', '#.,..............,.#', '#.,..............,.#', '.................,..', '#.,..............,.#', '#.,..............,.#', '#.,,,,,,,,,,,,,,,,.#', '#..................#', '#########.##########'],
        ents: [
            { k: 'tuck', x: 9, y: 9, id: 'tuck' },
            { k: 'wood', x: 6, y: 5, id: 'm5F', patience: 60 },
            { k: 'plate', x: 7, y: 5, sig: 'm5f' },
            { k: 'door', x: 0, y: 5, type: 'gate', when: 'm5f', dir: 'v', id: 'm5FGate' },
            { k: 'bust', x: 3, y: 3, id: 'm5F1' }, { k: 'bust', x: 16, y: 3, id: 'm5F2' }, { k: 'bust', x: 3, y: 7, id: 'm5F3' }, { k: 'bust', x: 16, y: 7, id: 'm5F4' },
            { k: 'door', x: 9, y: 0, type: 'lock', id: 'm5LockF' }, { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'm5LockE' },
        ],
    },
    '0,1': BELOW_ROOM('Under the Ballroom', '0,0', 'e', [
        { k: 'deco', x: 4, y: 3, look: 'keeper_costume', solid: [[0, 0], [1, 0]], text: "On a rail under the Ballroom hangs a wardrobe with polished feet, its doors open: leather straps inside, two handholds worn smooth, a cushion. The Grand Housekeeper. A label: MINE. WHEELS WANT OILING. DON'T TELL GUNDRY. -I." },
        { k: 'memo', x: 15, y: 2, say: () => "THE BALLROOM. Two busts, one corridor. You held the one and let the other by, and then you sat on the floor and laughed. I heard you. -I." },
    ]),
    '1,1': Object.assign(BELOW_ROOM('Under the Hall of Busts', '1,0', 'we', [
        { k: 'memo', x: 16, y: 2, say: () => { const m = tidyMinutes('Hall of Busts'); return m ? `THE HALL OF BUSTS: ${G.wanderer || 'Wren'}, ${m} minute${m === 1 ? '' : 's'}. Stood on the plate, pushed the big bust up the lane, and let it come home through the block. I nearly clapped and gave us all away. -I.` : "THE HALL OF BUSTS. (The page is blank. That's not like me.) -I."; } },
        { k: 'sign', x: 5, y: 9, text: "A HEAVY THING GOING HOME GOES THROUGH WHATEVER'S LIGHTER. (Mind the boy.) And a tug on a thing that's out of its place sends it home now. -I." },
        { k: 'resetlever', x: 13, y: 9 },
        { k: 'sign', x: 14, y: 9, text: "IVES'S LEVER. Sets the Hall out again the way it was for him: the big bust back up its lane, tied. (We do it behind every Wanderer, love. You never once noticed.) -I." },
    ]), { nudge: { solved: () => Making.past(20), after: 60 * 60 * 2, at: [9, 6], say: "The bust up the lane would come home through anything lighter that got in its way. Nothing's in its way. Yet." } }),
    '2,1': Object.assign(BELOW_ROOM('Under the Foyer', '2,0', 'w', [
        { k: 'sign', x: 2, y: 2, text: "THE TIDYHOUSE, UNDERNEATH. My first three rooms, the way your Wander went, built again for Tuck. No Needle in my rooms, love: you didn't have one either. -I." },
        { k: 'memo', x: 16, y: 8, say: () => { const m = tidyMinutes('Foyer'); return m ? [`THE FOYER: ${G.wanderer || 'Wren'}, ${m} minute${m === 1 ? '' : 's'}. Raced that block to the gate like a hare. Never once looked down.`, tidyNudged('Foyer') ? "(I ticked, once, behind the wall. You didn't need it. You'd have got it.) -I." : "(I never had to tick once.) -I."] : "THE FOYER. (A blank page, and a little drawing of a block.) -I."; } },
    ]), { nudge: { solved: () => Making.past(40), after: 60 * 60 * 2, at: [6, 5], say: "Up there, whatever jumps, Tuck pushes away from wherever he's standing. Where's he standing now?" } }),
}, {
    up: 'tidy', thread: THREAD.ives, noNeedle: "Not in Ives's rooms: you hang the Needle on its hook. (You didn't have one in the Tidyhouse either.)",
});

/* ---------------- Otto, the Housekeeper ---------------- */
/* His rules (on the wall below, in his own spelling): 1. stand on my X; 2. anything out of its place, tidy it home
   (he trots round to the side of it facing his X, the nearest free side if that one's taken, and yanks it, which
   sends it home at once, hard); 3. if it's held, stand there and tsk at it till it isn't; 4. then back to my X.
   He weighs what Tuck weighs, and a thing he yanks home through him bowls him over ("OOF!"), as it did in the square. */
const KEEP_STEP = 12;           /* frames a tile: he trots */
const KEEP_DOWN = 360;          /* bowled over, he sits a good while, seeing stars */
class Keeper extends NPC {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ who: 'otto', marked: false }, p));
        this.person = true; this.weight = WEIGHT.medium; this.noPush = true; this.showThrough = true; this.noKnot = true; this.keeper = true;
        this.home0 = [tx, ty]; this.face0 = this.dir;
        this.state = 'home'; this.st = 0; this.target = null; this.seen = null; this.wait = 0; this.downs = 0;
        /* his own thread, down to his X (like everybody's) */
        this.ret = { mx: tx, my: ty, area: null, color: PEOPLE_DEF.otto.col, state: 'home', trace: [[tx, ty]], timer: 0, patience: 1e9, snap: false, strain: 0, pace: 10 };
    }
    onAdd(area) { area.place(this, this.tx, this.ty); }
    scary() { return []; }
    say(text, bubble) { return Tuck.prototype.say.call(this, text, bubble); }
    /* things out of their place, in his room up top: the nearest to his X first */
    mess() {
        const a = this.area, room = a.roomAt(this.home0[0], this.home0[1]);
        let best = null, bd = 1e9;
        for (const e of a.ents) {
            if (!e.isGrid || !e.ret || e.person || e.removed || e.carried || e.mv || e.hiddenYank || e.pendingHome) continue;
            if (e.ret.state !== 'away' || a.roomAt(e.tx, e.ty) !== room) continue;
            const d = Math.hypot(e.tx - this.home0[0], e.ty - this.home0[1]);
            if (d < bd) { bd = d; best = e; }
        }
        return best;
    }
    /* the side of it he comes at it from: the one facing his X, or the next nearest he can get to */
    side(m) {
        const [hx, hy] = this.home0;
        const sides = [UP, DOWN, LEFT, RIGHT].map(d => [m.tx + DX[d], m.ty + DY[d]]).sort((p, q) => Math.hypot(p[0] - hx, p[1] - hy) - Math.hypot(q[0] - hx, q[1] - hy));
        for (const [x, y] of sides) {
            if (x === this.tx && y === this.ty) return [x, y];
            if (this.walkable(x, y) && this.route(x, y, false)) return [x, y];
        }
        return null;
    }
    stepTo(gx, gy) {
        const r = this.route(gx, gy, false) || this.route(gx, gy, true);
        if (r && r.length) { this.dir = dirOf(r[0][0] - this.tx, r[0][1] - this.ty); this.startMove(r[0][0], r[0][1], KEEP_STEP); return true; }
        this.wait = 12; return false;
    }
    /* he has an X in every room of his; he's always in the room the boy's in (round the back, ahead of him) */
    follow() {
        const a = this.area, t = a.find('tuck'), r = t && !t.mv ? a.roomAt(t.tx, t.ty) : null;
        if (!r || r === a.roomAt(this.home0[0], this.home0[1])) return false;
        const x = a.ents.find(e => e.kind === 'keeperx' && a.roomAt(e.tx, e.ty) === r);
        if (!x || (a.at(x.tx, x.ty) && a.at(x.tx, x.ty) !== this)) return false;
        a.unplace(this, this.tx, this.ty); Fx.poof(this.px + 8, this.py + 8);
        this.home0 = [x.tx, x.ty]; this.face0 = x.face !== undefined ? dirByName(x.face) : DOWN; this.dir = this.face0;
        this.tx = x.tx; this.ty = x.ty; this.x = x.tx * T; this.y = x.ty * T; a.place(this, x.tx, x.ty);
        this.ret.mx = x.tx; this.ret.my = x.ty; this.ret.trace = [[x.tx, x.ty]]; this.ret.state = 'home';
        Fx.poof(this.px + 8, this.py + 8);
        this.state = 'home'; this.st = 0; this.target = null; this.seen = null; this.tsking = false; this.wait = 20;
        if (x.line) this.say(x.line, 'bang');
        return true;
    }
    update() {
        this.stepMove();
        if (this.bubbleT > 0 && --this.bubbleT === 0) this.bubble = null;
        if (this.mv) { this.anim++; return; }
        if (Script.blocking() || this.knotted) return;
        if (this.state === 'down') Signals.set(this.area, 'ottoDown');
        if (this.state !== 'down' && this.follow()) return;
        this.st++;
        if (this.wait > 0) { this.wait--; return; }
        const [hx, hy] = this.home0;
        switch (this.state) {
            case 'down':
                if (this.st > KEEP_DOWN) { this.state = 'home'; this.st = 0; this.say('...Tidied. By my own tidying.', 'dots'); this.wait = 30; }
                return;
            case 'home': {
                const m = this.mess();
                if (m) {
                    if (this.seen !== m) { this.seen = m; this.st = 0; this.say('Tsk!', 'bang'); Sfx.play('twang'); this.dir = dirOf(m.tx - this.tx, m.ty - this.ty); return; }
                    if (this.st > 24) { this.target = m; this.state = 'tidy'; this.st = 0; }
                    return;
                }
                this.seen = null;
                if (this.tx !== hx || this.ty !== hy) { this.stepTo(hx, hy); return; }
                if (this.dir !== this.face0 && this.st > 30) this.dir = this.face0;
                return;
            }
            case 'tidy': {
                const m = this.target;
                if (!m || m.removed || !m.ret || m.ret.state !== 'away' || m.carried) { this.state = 'home'; this.st = 0; this.target = null; return; }
                const sd = this.side(m);
                if (!sd) { this.wait = 20; if (this.st > 40 && this.st % 90 === 41) this.say('Hmph!', 'dots'); return; }
                if (this.tx !== sd[0] || this.ty !== sd[1]) { this.stepTo(sd[0], sd[1]); return; }
                this.dir = dirOf(m.tx - this.tx, m.ty - this.ty);
                if (m.mv) return;
                /* held fast: he stands there and tsks at it */
                if (Return.held(m)) { if (!this.tsking) { this.tsking = true; this.st = 0; } if (this.st % 70 === 1) this.say(this.st < 2 ? 'Tsk! Tsk!' : ['Tsk.', 'TSK.', 'Tsk tsk tsk.', 'Hmph. Tsk.'][(this.st / 70 | 0) % 4], 'bang'); return; }
                this.tsking = false;
                Return.snap(m); Sfx.play('tug'); this.say('Tidy!');
                Stats.count('otto:tidy');
                this.state = 'watch'; this.st = 0;
                return;
            }
            case 'watch': if (this.st > 40) { this.state = 'home'; this.st = 0; this.target = null; } return;
        }
    }
    /* bowled over by something coming home through him: he slides a tile and sits down hard */
    shove(d, dur, by) {
        this.startMove(this.tx + DX[d], this.ty + DY[d], dur);
        this.state = 'down'; this.st = 0; this.target = null; this.tsking = false; this.downs++;
        G.shake = 4; Sfx.play('hitthing'); this.say('OOF!', 'bang');
        Stats.count('otto:down');
        if (Making.cur) Making.cur.ottoDown = (Making.cur.ottoDown || 0) + 1;
    }
    /* his own thread: a tug and he's back on his X */
    onTug() {
        Sfx.play('flight'); Stats.count('otto:yanked');
        const a = this.area, [hx, hy] = this.home0;
        a.unplace(this, this.tx, this.ty); if (this.mv) a.unplace(this, this.mv.fx, this.mv.fy);
        this.mv = null; Fx.poof(this.px + 8, this.py + 8);
        let [x, y] = [hx, hy];
        if (a.at(x, y)) { const f = [[hx, hy + 1], [hx + 1, hy], [hx - 1, hy], [hx, hy - 1]].find(([u, v]) => this.walkable(u, v)); if (f) [x, y] = f; }
        this.tx = x; this.ty = y; this.x = x * T; this.y = y * T; a.place(this, x, y);
        Fx.poof(this.px + 8, this.py + 8);
        this.state = 'home'; this.st = 0; this.target = null; this.seen = null; this.tsking = false; this.wait = 30;
        this.say('Hey! I was TIDYING!', 'bang');
    }
    onNoKnot() { this.say("Housekeepers don't get tied!", 'bang'); UI.toast("He's the Housekeeper: you can give his thread a tug, but you won't tie him down.", 150); }
    sprite() {
        if (this.state === 'down' && !this.mv) return personFrame('otto', DOWN, 0);
        return super.sprite();
    }
    draw(cx, cy) {
        super.draw(cx, cy);
        const im = this.sprite(); if (!im) return;
        const sx = this.px - cx, top = this.py - cy - (im.height - T) - 2;
        if (this.state === 'down') { if (!this.mv) for (let i = 0; i < 3; i++) { const a = G.t / 9 + i * 2.1; Gfx.rect(sx + 7 + Math.round(Math.cos(a) * 6), top - 2 + Math.round(Math.sin(a) * 2), 2, 2, PAL.yellow); } return; }
        /* a folded paper hat and a feather duster, as in the square */
        Gfx.img(spr('kid_hat'), sx + 3, top - 3);
        if (this.state === 'tidy' || this.state === 'watch') Gfx.img(spr('kid_duster'), sx + (this.dir === LEFT ? -4 : 12), top + 6, this.dir === LEFT);
    }
}
for (const k of ['walkable', 'route']) Keeper.prototype[k] = Tuck.prototype[k];
SPAWN.keeper = (x, y, p) => new Keeper(x, y, p);
/* his chalk X, on the floor where he stands guard */
class KeeperX extends FloorThing {
    constructor(tx, ty, p = {}) { super('keeperx', tx, ty, p); }
    draw(cx, cy) { if (ART.chalk_x) { Gfx.alpha(0.8); Gfx.img(ART.chalk_x, this.x - cx, this.y - cy); Gfx.alpha(1); } }
}
SPAWN.keeperx = (x, y, p) => new KeeperX(x, y, p);
/* a doormat: it only feels somebody standing on it (a person, not a thing) */
class Mat extends Plate {
    weighed() { const o = this.area.at(this.tx, this.ty); return !!(o && o.person && !o.mv); }
    draw(cx, cy) { Gfx.img(spr(this.down ? 'mat_down' : 'mat'), this.x - cx, this.y - cy); }
}
SPAWN.mat = (x, y, p) => new Mat(x, y, p);


/* ---------------- 6: The Housekeeper (Jory): Otto comes along ---------------- */
const OTTO_RULES = "OTTO'S RULES (THE HOUSEKEEPER'S, as written by Otto): 1. STAND ON MY X. (I HAVE ONE IN EVERY ROOM. I GO ROUND THE BACK.) 2. IF A THING IS OUT OF ITS PLACE, TIDY IT. I COME AT IT FROM MY SIDE. 3. IF IT WONT GO, TSK AT IT TILL IT DOES. 4. THEN BACK TO MY X. -O. (And a note: He's playing the Housekeeper, love. He isn't on a Wander, so he won't go near the hoop. -J.)";
defMaking(6, {
    /* the only way through is a passage in the wall, a block at its far mouth; Otto's X just beyond: whatever Tuck
       pushes out of the way, Otto tidies straight back into it */
    '0,0': {
        name: "Otto's X",
        rows: ['####################', '#........#.........#', '#........#.........#', '#........#.........#', '#........#.........#', '#...................', '#........#.........#', '#........#.........#', '#........#.........#', '#........#.........#', '####################'],
        ents: [
            { k: 'tuck', x: 3, y: 5, id: 'tuck' },
            { k: 'keeperx', x: 11, y: 3, face: 'down' }, { k: 'keeper', x: 11, y: 3, id: 'otto', face: 'down' },
            { k: 'wood', x: 10, y: 5, id: 'm6W' },
            { k: 'pot', x: 2, y: 8, id: 'm6Pot' }, { k: 'treasure', x: 2, y: 8 },
        ],
    },
    /* the way on opens while somebody stands on the doormat; Otto won't, unless he's got something to tsk at there */
    '1,0': {
        name: 'The Doormat',
        rows: ['####################', '#.............#....#', '#.............#....#', '#.............#....#', '#.............#....#', '...............,...#', '#.............#....#', '#.............#....#', '#.............#....#', '#.............#....#', '####################'],
        ents: [
            { k: 'keeperx', x: 10, y: 1, face: 'down', line: 'Round the back! Tsk!' },
            { k: 'wood', x: 10, y: 5, id: 'm6B' },
            { k: 'mat', x: 9, y: 4, sig: 'm6m' },
            { k: 'door', x: 14, y: 5, type: 'gate', when: 'm6m', dir: 'v', id: 'm6Gate' },
            { k: 'littlehoop', x: 17, y: 5 },
        ],
    },
    '0,1': Object.assign(BELOW_ROOM("Under Otto's X", '0,0', 'e', [
        { k: 'sign', x: 3, y: 2, text: OTTO_RULES },
    ]), { nudge: { solved: () => Making.past(20, true), after: 60 * 60 * 2, at: [10, 5], say: "Otto can't bear a thing out of its place. And he can't tidy a thing that's held fast; he can only stand there tsking at it." } }),
    '1,1': Object.assign(BELOW_ROOM('Under the Doormat', '1,0', 'w', [
        { k: 'sign', x: 16, y: 8, text: "THE DOORMAT. It only feels somebody standing on it. (Otto always comes at a thing from the side nearest his X. Always. -J.)" },
    ]), { nudge: { solved: () => Making.past(35, true), after: 60 * 60 * 2, at: [9, 4], say: "Otto stands on whichever side of a mess is nearest his X. Where would the block have to be for that side to be the mat?" } }),
}, { up: 'kilnhouse', thread: THREAD.jory });


/* ---------------- 7: Tidy and Untidy (Mallow): both of them at once ---------------- */
defMaking(7, {
    /* a block in the only junction; Otto's X just off it: pushed aside, he tidies it back; tied, he stands in the
       junction tsking at it. A thing given a new place is in its place, though */
    '0,0': {
        name: 'Tidy for Good',
        rows: ['####################', '#########..........#', '#########.########.#', '#########.########.#', '#########.########.#', '#...........######..', '#.........##########', '#........###########', '#........###########', '#........###########', '####################'],
        ents: [
            { k: 'tuck', x: 3, y: 8, id: 'tuck' },
            { k: 'keeperx', x: 9, y: 6, face: 'up' }, { k: 'keeper', x: 9, y: 6, id: 'otto', face: 'up' },
            { k: 'wood', x: 9, y: 5, id: 'm7W' },
            { k: 'pot', x: 1, y: 9, id: 'm7Pot' }, { k: 'treasure', x: 1, y: 9 },
        ],
    },
    /* the gate wants somebody on each doormat at once (and stays open after); Tuck will sit on the one by the gate */
    '1,0': {
        name: 'Two Mats',
        rows: ['####################', '#..............#...#', '#..............#...#', '#..............#...#', '#.........#....#...#', '................,..#', '#.........#....#...#', '#..............#...#', '#..............#...#', '#..............#...#', '####################'],
        ents: [
            { k: 'keeperx', x: 6, y: 1, face: 'down', line: 'Two mats. I stand on NEITHER. Tsk!' },
            { k: 'wood', x: 10, y: 5, id: 'm7K' },
            { k: 'mat', x: 10, y: 5, sig: 'm7a' }, { k: 'mat', x: 14, y: 5, sig: 'm7b' },
            { k: 'crate', x: 7, y: 2, id: 'm7C' },
            { k: 'door', x: 15, y: 5, type: 'gate', when: 'm7a&m7b', dir: 'v', keep: true },
            { k: 'littlehoop', x: 17, y: 5 },
        ],
    },
    '0,1': Object.assign(BELOW_ROOM('Under Tidy for Good', '0,0', 'e', [
        { k: 'sign', x: 2, y: 2, text: "A KNOT HOLDS A THING. A STITCH GIVES IT A PLACE. Otto only minds places. (He'll stand and tsk at a knot all day, mind: wherever his side of it is.) -M." },
    ]), { nudge: { solved: () => Making.past(18, true), after: 60 * 60 * 2, at: [9, 5], say: "Otto tidies whatever's out of its place. A thing with a new place isn't out of it." } }),
    '1,1': Object.assign(BELOW_ROOM('Under the Two Mats', '1,0', 'w', [
        { k: 'sign', x: 16, y: 8, text: "TWO MATS: somebody on each, both at once. One of them sits wherever he gets stuck. The other stands wherever his side of a mess is. -M." },
    ]), { nudge: { solved: () => Making.past(35, true), after: 60 * 60 * 3, at: [10, 5], say: "Tuck sits on the mat by the gate all by himself. The other mat wants Otto, and Otto stands on whichever side of a mess is nearest his X." } }),
}, { up: 'house', thread: THREAD.mallow });

/* ---------------- 8: The Grand Hall (every Maker): the Tidyhouse's last room, from underneath ---------------- */
/* West from the Antechamber (its big door hangs on a weight below: that's what the Pattern really did), into the
   Grand Hall, where Otto is the Grand Housekeeper on its cross: the way west opens only when the Housekeeper's
   beaten, and the one thing that ever beat a Housekeeper is its own tidying. Then the little hoop, and the Makers. */
defMaking(8, {
    /* one last thing in the passage's mouth, and the hoop */
    '0,0': {
        name: 'The Little Hoop',
        rows: ['####################', '#.............######', '#.............######', '#.............######', '#.............######', '#...................', '#.............######', '#.............######', '#.............######', '#.............######', '####################'],
        ents: [{ k: 'littlehoop', x: 6, y: 5 }, { k: 'wood', x: 13, y: 5, id: 'm8W2' }],
    },
    /* the Housekeeper's cross by the way west, which opens only once he's beaten; a block in a slot between two
       busts, and a nibbler that has its eye on the spot Tuck would push it from */
    '1,0': {
        name: 'The Grand Hall',
        rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
        ents: [
            { k: 'keeperx', x: 2, y: 3, face: 'right', line: "I'm the GRAND Housekeeper. Nobody gets past the Grand Housekeeper!" }, { k: 'keeper', x: 2, y: 3, id: 'otto', face: 'right' },
            { k: 'bust', x: 6, y: 4, id: 'm8B1' }, { k: 'bust', x: 6, y: 6, id: 'm8B2' }, { k: 'bust', x: 16, y: 4, id: 'm8B3' }, { k: 'bust', x: 12, y: 8, id: 'm8B4' },
            { k: 'wood', x: 6, y: 5, id: 'm8W' },
            { k: 'nibbler', x: 5, y: 7, id: 'm8Nib' },
            { k: 'pot', x: 1, y: 1, style: 'pot_teal' }, { k: 'pot', x: 18, y: 9, style: 'pot_teal' },
            { k: 'door', x: 0, y: 5, type: 'gate', when: 'ottoDown', dir: 'v', keep: true, id: 'm8Shut' },
        ],
    },
    /* the Antechamber: four pots (one with a button under it), and the big door to the Grand Hall */
    '2,0': {
        name: 'The Antechamber',
        rows: ['####################', '#..................#', '#.,,,,,,,,,,,,,,,,.#', '#.,..............,.#', '#.,..............,.#', '..,..............,.#', '#.,..............,.#', '#.,..............,.#', '#.,,,,,,,,,,,,,,,,.#', '#..................#', '#########.##########'],
        ents: [
            { k: 'tuck', x: 9, y: 9, id: 'tuck' },
            { k: 'door', x: 0, y: 5, type: 'gate', when: '!m8w', dir: 'v', id: 'm8Big' },
            { k: 'pot', x: 4, y: 3, id: 'm8P1', style: 'pot_teal' }, { k: 'pot', x: 15, y: 3, id: 'm8P2', style: 'pot_teal' },
            { k: 'pot', x: 4, y: 7, id: 'm8P3', style: 'pot_teal' }, { k: 'treasure', x: 4, y: 7 }, { k: 'pot', x: 15, y: 7, id: 'm8P4', style: 'pot_teal' },
        ],
    },
    '0,1': Object.assign(BELOW_ROOM('Under the Little Hoop', '0,0', 'e', [
        { k: 'npc', who: 'ives', x: 9, y: 3, face: 'up' }, { k: 'npc', who: 'bram', x: 11, y: 3, face: 'up' }, { k: 'npc', who: 'ambrose', x: 13, y: 3, face: 'up' },
        { k: 'npc', who: 'tess', x: 9, y: 7, face: 'up' }, { k: 'npc', who: 'mallow', x: 11, y: 7, face: 'up' }, { k: 'npc', who: 'jory', x: 13, y: 7, face: 'up' },
    ]), { nudge: { solved: () => Making.past(13), after: 60 * 60 * 2, at: [13, 5], say: "One last thing in his way. He knows what to do with things that jump." } }),
    '1,1': Object.assign(BELOW_ROOM('Under the Grand Hall', '1,0', 'we', [
        { k: 'sign', x: 16, y: 2, text: "THE GRAND HALL. Mine, the real one. The Housekeeper always went and stood exactly where a thing was coming home to. Every Wanderer's beaten it that way, and every one thought they'd thought of it first. (You did think of it first, love.) -I." },
        { k: 'sign', x: 2, y: 8, text: "MIND THE NIBBLER. Tuck won't go near it, and it's got its eye on the very spot you'll want him in. -B." },
    ]), { nudge: { solved: () => Making.past(20), after: 60 * 60 * 3, at: [6, 5], say: "The Housekeeper only ever gets beaten one way: standing on a thing's way home when it tidies it. Hold the thing till he's standing there. Then let go." } }),
    '2,1': Object.assign(BELOW_ROOM('Under the Antechamber', '2,0', 'w', [
        { k: 'plate', x: 2, y: 5, sig: 'm8w' }, { k: 'weight', x: 2, y: 5, id: 'm8Weight', patience: 90 },
        { k: 'sign', x: 6, y: 8, text: "COUNTERWEIGHT: THE BIG DOOR. On its plate, the door's shut. Off it, open, till it goes home. (So that's what your Pattern did, love: I heard it in the lock, and pushed. -I.)" },
    ]), { nudge: { solved: () => Making.past(40), after: 60 * 60 * 2, at: [2, 5], say: "Up above, the big door. Down here, its weight." } }),
}, {
    up: 'tidy', thread: THREAD.ives, entry: { x: 56, y: 16 },
    talk: {
        ives: function* () { yield* say('ives', "Shh! Look at him. LOOK at him. Oh, I'm going to cry on the boards."); },
        bram: function* () { yield* say('bram', "HA! (Shh.) HA! (Sorry.) He's got it! Course he's got it."); },
        ambrose: function* () { yield* say('ambrose', "We used to do this for you, love. Every Wander. Lying on our fronts under the floor, not breathing."); },
        tess: function* () { yield* say('tess', "Don't tell him we were here. Don't you dare. It's his."); },
        mallow: function* () { yield* say('mallow', "*yawn* I wasn't asleep. I was watching with my eyes closed. It's a technique."); },
        jory: function* () { yield* say('jory', "Places, everyone! ...No, wait, we're already in them. Carry on."); },
    },
});

/* after the fifth, the first time: Otto turns up on the Making Floor, in a paper hat, with a duster */
MAKINGS[4].then = function* () {
    const a = G.map, p = G.player, o = a && a.ents.find(e => e.kind === 'npc' && e.who === 'otto');
    if (o && p) { yield* say(null, "Somebody else is on the Making Floor: Otto, from the square, in a folded paper hat, holding a feather duster like a sword."); yield* Making.fetch(o, p); }
    yield* say('otto', "I'm in the next ones! Jory said every Wander needs a Housekeeper. So I'm the Housekeeper. Tsk!");
    yield* say('tuck', "He's not ON the Wander. He's just TIDYING. It's MY Wander.");
    yield* say('otto', "Anything out of its place, I tidy. From my side. I wrote my rules down. They're on the wall underneath.");
    Progress.setGoal('The Making Floor: the sixth Little House is open. Otto is coming too, as the Housekeeper.');
};

/* Tuck's got west of x (the Little Houses run west to east, or east to west: a room's done once he's out of it) */
Making.past = function (x, east) {
    const a = G.map, t = a && a.def.making ? a.find('tuck') : null;
    return !t || t.state === 'done' || (east ? t.tx >= x : t.tx < x);
};

function initMakingsMore() {
    ART.keeper_costume = SPR.keeper_open;
    /* a woven doormat with a red border; pressed, it squashes flat */
    defSprite('mat', ['................', '................', '................', '..kkkkkkkkkkkk..', '..krrrrrrrrrrk..', '..krmMmMmMmMrk..', '..krMmMmMmMmrk..', '..krmMmMmMmMrk..', '..krMmMmMmMmrk..', '..krmMmMmMmMrk..', '..krMmMmMmMmrk..', '..krrrrrrrrrrk..', '..kkkkkkkkkkkk..', '................', '................', '................'], { r: '#c42b4a', m: '#c9a46a', M: '#a8844a' });
    defSprite('mat_down', ['................', '................', '................', '................', '..kkkkkkkkkkkk..', '..krrrrrrrrrrk..', '..krmMmMmMmMrk..', '..krMmMmMmMmrk..', '..krmMmMmMmMrk..', '..krMmMmMmMmrk..', '..krmMmMmMmMrk..', '..krrrrrrrrrrk..', '..kkkkkkkkkkkk..', '................', '................', '................'], { r: '#a8243e', m: '#b4925a', M: '#94743e' });
}
CONTENT_INIT.push(initMakingsMore);
