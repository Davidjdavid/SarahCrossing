/* Small favours in town. Each is something that has been wrong in Hollowell for a while, there to be seen long before
   there's anything to be done about it, and put right with the newest thing found and the way things go home. Nobody
   says how; people only say what they'd like. Some lead on to the next: Thimble's string flies the children's kite,
   the children give away the only kind of thing a child can give (a stray), and Tuck has wanted one all his life.
     1. The Guild's crates (the Gloves): two crates nose to nose in the lane by Thimble's, each on the other's way home.
     2. The kite (the Hookline): caught in the tree by the Inn, and its way home runs back up through the branches.
     3. Tuck and the odd marble: a stray, for the one boy in town who wants a thing that stays where he puts it.
     4. Mabel's floor of strays (the Recall Bell): one of them isn't a stray at all; it's asleep.
     5. Jory's back room (the Crossbar): a parcel locked in, straining at the door toward Tuck's house.
     6. Rosa's saucer (the Needle): the cream she puts out for Biscuit walks itself home before the cat comes.
   The townsfolk's side of it is FAVOUR_TALK (called from their talk, src/51_town_talk.js and src/52_kidgame.js). */

const FAV_OFF = [64, 40];                         /* the town's block in the Hollow */
const hubAt = (x, y) => [x + FAV_OFF[0], y + FAV_OFF[1]];
const Favours = {
    /* someone has something to say about a favour: said, and true */
    *talk(who, npc) { const f = FAVOUR_TALK[who]; return f ? !!(yield* f(npc)) : false; },
    /* a line said once (and true), or false if it's been said */
    *once(flag, who, text) { if (Progress.flag(flag)) return false; Progress.set(flag); yield* say(who, text); return true; },
    buttons(n) { Inv.buttons += n; Sfx.play('button'); },
};
const FAVOUR_TALK = {};

/* ---------------- 1. the Guild's crates, in the lane by Thimble's (the Gloves) ---------------- */
/* Two crates of the Guild's string came off the carter's barrow in the lane between Thimble's and the fence. Each is on
   the other's way home: the north one belongs at the south end and the south one at the north, and in a lane one wide
   neither can pass. Push either and it only meets the other. Pulled out of line into the gap in the fence (only the
   Gloves pull) and held there, one lets the other by; let go, it follows it home. */
SPAWN.guildcrate = (x, y, p) => new Block(x, y, Object.assign({ style: 'wood', look: 'guild_crate', thread: THREAD.guild, stitchName: "the Guild's crate" }, p));
OW.blocks['1,1'].ents.push(
    { k: 'deco', x: 23, y: 27, look: 'fence_v', solid: [[0, 0]] },
    { k: 'deco', x: 23, y: 29, look: 'fence_v', solid: [[0, 0]] },
    { k: 'deco', x: 23, y: 30, look: 'fence_v', solid: [[0, 0]] },
    { k: 'guildcrate', x: 22, y: 30, id: 'guildA', startAt: [22, 28], trace: [[22, 30], [22, 29], [22, 28]], if: '!fav_cratesHome' },
    { k: 'guildcrate', x: 22, y: 27, id: 'guildB', startAt: [22, 29], trace: [[22, 27], [22, 28], [22, 29]], if: '!fav_cratesHome' },
    { k: 'guildcrate', x: 22, y: 30, id: 'guildA', if: 'fav_cratesHome' },
    { k: 'guildcrate', x: 22, y: 27, id: 'guildB', if: 'fav_cratesHome' },
);
FAVOUR_TALK.thimble = function* () {
    if (Progress.flag('fav_cratesHome') && !Progress.flag('fav_crates')) {
        Progress.set('fav_crates'); Stats.count('favour:crates');
        yield* say('thimble', "My crates! Both home, and the lane clear as a whistle! How ever did you- no, don't tell me, I'd only fret. Here, thirty buttons for your trouble.");
        Favours.buttons(30);
        yield* say('thimble', "And a ball of string. The good stuff: the very same the Guild buys by the mile. Nobody's ever managed to snap it, and I've watched people try.");
        yield* Story.getItem('string')();
        return true;
    }
    if (!Progress.flag('fav_cratesHome') && Progress.flag('met:thimble'))
        return yield* Favours.once('fav_cratesTold', 'thimble', "Two crates of the Guild's string came off the carter's barrow in the lane by my shop, and there they've stuck. Nose to nose, each waiting for the other to go home first. Like a pair of old goats. I've been selling string off the end of the last reel.");
    return false;
};

/* ---------------- 2. the children's kite, caught in the tree by the Inn (the Hookline) ---------------- */
/* Blown off its peg one windy day, it went up through the tree and caught in the branches, and its way home runs back
   the way it came: up through the branches. Hooked down, it flies home after a moment and catches again. Carried back
   over its own thread below the tree (a thread can't knot: where it crosses itself the loop drops out) its way home no
   longer goes up there. (Or drop it in the river: anything that sinks is home at once.) Then the string: it snapped. */
const KITE_HOME = [45, 17];
const KITE_CANOPY = new Set([key2(...hubAt(46, 15)), key2(...hubAt(47, 15))]);
class Kite extends Liftable {
    constructor(tx, ty, p = {}) {
        super('kite', tx, ty, p);
        this.caught = !!p.caught; this.rustle = 0;
        this.noNeedle = true; this.noCut = true; this.noCutLine = "It's the children's kite. You'd not cut it loose from them.";
        this.stitchName = 'the kite';
    }
    isHeld() { return this.caught; }
    get noGrip() { return this.caught; }
    canPush(d) { return !this.caught && super.canPush(d); }
    canBeShoved(d) { return !this.caught && super.canBeShoved(d); }
    /* the stick or a throw: up in the branches it only rustles; down, it's knocked along like anything light */
    hit(by, d) { if (this.caught) { this.rustle = 20; Sfx.play('hitthing'); return; } if (!this.mv && d >= 0) this.push(d, 8); }
    interact() {
        if (!this.caught) return false;
        Script.run(function* () { yield* say(null, "The children's kite: a red diamond with a ribbon tail, caught fast high up in the branches. Its thread runs down out of the tree and away to its peg, pulled tight. It's far too high to reach."); });
        return true;
    }
    startMove(nx, ny, dur, returning) { this.caught = false; super.startMove(nx, ny, dur, returning); }
    /* wherever it comes down among the branches, it catches again (and waits there, as anything held does) */
    onLanded() { if (!this.carried && !this.caught && KITE_CANOPY.has(key2(this.tx, this.ty))) this.snag(); }
    snag() {
        this.caught = true; this.rustle = 24;
        if (this.ret && this.ret.state !== 'home') { this.ret.state = 'away'; this.ret.snap = false; this.ret.timer = this.ret.patience; }
        if (this.area === G.map) Sfx.play('hitthing');
    }
    onHome() { if (!Progress.flag('fav_kiteHome')) { Progress.set('fav_kiteHome'); UI.toast('The kite settles back on its peg, home at last.', 160); } }
    tick() { if (this.rustle > 0) this.rustle--; }
    get sortY() { return this.caught ? this.ty * T + 40 : this.py + 15; }
    sprite() { return spr('kite'); }
    draw(cx, cy) {
        if (this.carried) return;
        const im = spr('kite'), x = this.px - cx, y = this.py - cy;
        if (this.caught) { const s = this.rustle > 0 && (G.t >> 1) % 2 ? 1 : 0; Gfx.img(im, x + 2 + s, y - 14, false); return; }
        const home = this.ret && this.ret.state === 'home';
        if (home) { Gfx.img(spr('kite_peg'), x + 6, y + 2); Gfx.img(im, x, y - 8); return; }
        GridThing.prototype.draw.call(this, cx, cy);
    }
}
SPAWN.kite = (x, y, p) => new Kite(x, y, p);
OW.blocks['1,1'].ents.push(
    { k: 'kite', x: KITE_HOME[0], y: KITE_HOME[1], id: 'kite', caught: true, startAt: [46, 15], trace: [[45, 17], [46, 17], [46, 16], [46, 15]], if: '!fav_kiteHome' },
    { k: 'kite', x: KITE_HOME[0], y: KITE_HOME[1], id: 'kite', if: 'fav_kiteHome&!fav_kite' },
    { k: 'kitefly', x: 34, y: 19, if: 'fav_kite' },
);
/* flying, on its string, over whoever's holding it (Nell) */
SPAWN.kitefly = (tx, ty) => {
    const e = new Ent('kitefly', { x: tx * T, y: ty * T });
    e.update = function () {
        if (!this.nell || this.nell.removed) this.nell = this.area.ents.find(o => o.kind === 'npc' && o.who === 'nell');
        const n = this.nell; if (n) { this.x = n.px; this.y = n.py; }
    };
    Object.defineProperty(e, 'sortY', { get() { return this.y + 200; } });
    e.draw = function (cx, cy) {
        const n = this.nell; if (!n || n.hidden) return;
        const t = G.t / 40, hx = n.px - cx + 12, hy = n.py - cy + 2;
        const kx = hx + 26 + Math.round(Math.sin(t) * 4), ky = hy - 34 + Math.round(Math.cos(t * 1.3) * 3);
        /* the string sags a little between her hand and the kite */
        const mx = (hx + kx) / 2 - 3, my = (hy + ky) / 2 + 6;
        Gfx.alpha(0.85); Gfx.line(hx, hy, mx, my, '#efe4cc'); Gfx.line(mx, my, kx + 6, ky + 12, '#efe4cc'); Gfx.alpha(1);
        Gfx.img(spr('kite'), kx - 2, ky);
    };
    return e;
};
ITEMS.marble = { name: 'Odd marble', kind: 'quest', desc: "A glass marble with a little L scratched into it. A stray: it never goes home, because it hasn't got one. The children found it by the fog." };
ITEM_LINES.marble = () => "You got the children's {blue}odd marble{/}! A glass marble with a little L scratched into it. It never goes home: it hasn't got one.";
ITEM_LINES.string = () => "You got a {blue}ball of string{/}! Thimble's best. It doesn't do anything. It's string.";
/* the children: what they'd like, and the string */
function* kiteString() {
    /* (a game saved while this was being made may hold a hank of "Guild twine": it's string) */
    if (Inv.items.twine) { Inv.items.string = (Inv.items.string || 0) + Inv.items.twine; delete Inv.items.twine; }
    if (!Inv.items.string) { yield* say('nell', "It's HOME! You got it down! ...Only the string snapped, when it blew away. A kite's no good without a string. We need string. Proper string."); return; }
    yield* say('nell', "It's HOME! You got it down! ...Only the string snapped when it blew off. A kite's no good without string.");
    const i = yield* ask(null, 'Give Nell a ball of string?', ['Give it', 'Not now']);
    if (i !== 0) { yield* say('nell', 'Aw.'); return; }
    if (--Inv.items.string <= 0) delete Inv.items.string;
    Progress.set('fav_kite'); Stats.count('favour:kite');
    yield* say('nell', "String! Real string! Otto, Bea, look, it's the good stuff! It won't EVER snap!");
    yield* say('bea', "We've got something for you. It's the only thing we've got that's really ours to give. Everything else goes home.");
    yield* say('otto', "We found it by the fog. It doesn't go back anywhere. We think it's broken.");
    yield* Story.getItem('marble')();
    yield* say('nell', "And fifteen buttons. That's the whole club. Don't spend it on anything boring.");
    Favours.buttons(15);
}
FAVOUR_TALK.nell = function* () {
    if (Progress.flag('fav_kiteHome') && !Progress.flag('fav_kite')) { yield* kiteString(); return true; }
    if (!Progress.flag('fav_kiteHome') && Progress.flag('ceremony'))
        return yield* Favours.once('fav_kiteTold', 'nell', "My kite's stuck up the tree by the Inn. Since spring. It keeps TRYING to come home: look at its thread, all pulled tight. Trees don't let go.");
    return false;
};
FAVOUR_TALK.otto = function* () { if (Progress.flag('fav_kiteHome') && !Progress.flag('fav_kite')) { yield* say('otto', "The kite's home! Nell's doing the talking. Nell always does the talking."); return true; } return false; };
FAVOUR_TALK.bea = function* () {
    if (Progress.flag('fav_kiteHome') && !Progress.flag('fav_kite')) { yield* say('bea', "Ask Nell. It's Nell's kite. I'm the audience."); return true; }
    if (Progress.flag('fav_kite')) return yield* Favours.once('fav_kiteBea', 'bea', "It goes up and up and the string pulls it back. That's the best bit. Isn't it? That it comes back?");
    return false;
};

/* ---------------- 3. Tuck, and a thing that stays where he puts it ---------------- */
/* Everything in Hollowell goes back where it belongs, and everything Tuck puts down goes back where his mum put it
   first. A stray goes nowhere. Given it, he puts it somewhere, and next time you come by it's somewhere else in town:
   wherever he put it last. */
FAVOUR_TALK.tuck = function* () {
    if (Inv.items.marble && !Progress.flag('fav_marble')) {
        yield* say('tuck', "What's that? Is that a STRAY? A real one? That doesn't go back anywhere?");
        const i = yield* ask(null, 'Give Tuck the odd marble?', ['Give it', 'Not now']);
        if (i !== 0) { yield* say('tuck', "That's all right. It's yours. Strays are whoever's they are."); return true; }
        delete Inv.items.marble;
        Progress.set('fav_marble'); Stats.count('favour:marble');
        yield* say('tuck', "Watch. I'm putting it HERE. ...And now I'm walking away. ...And now I'm looking.");
        yield* say('tuck', "It STAYED. It's staying! Look at it STAY! That's MY place for it! Because I said!");
        yield* say('tuck', "You can have my buttons. All of them. ...Except the blue one. The blue one's my best one. I've got the marble now, so that's fair.");
        Favours.buttons(11);
        yield* say(null, 'Tuck counts eleven buttons into your hand, one at a time, very seriously.');
        return true;
    }
    if (Progress.flag('fav_stick') && !Progress.flag('fav_stickTuck')) {
        Progress.set('fav_stickTuck');
        yield* say('tuck', "LOOK! A stick! A real Wanderer's stick! It came in my window all by itself and landed on my bed! It's got TUCK burnt on it!");
        yield* say('tuck', "Mum says it's for later. I'm only holding it. Holding's not using.");
        return true;
    }
    if (!Progress.flag('fav_marble') && Progress.flag('met:tuck'))
        return yield* Favours.once('fav_tuckTold', 'tuck', "Everything I put down goes back where Mum put it. Or back where it was before Mum. I want ONE thing that stays where I put it. Just one.");
    return false;
};

/* where Tuck last put it (it's a stray: nothing moves it but him) */
const MARBLE_SPOTS = [['reveal2', 31, 21], ['reveal1', 24, 10], ['d4', 23, 24], ['', 9, 33]];
SPAWN.tuckmarble = (tx, ty) => {
    const [, mx, my] = MARBLE_SPOTS.find(([f]) => !f || Progress.flag(f));
    const [x, y] = hubAt(mx, my);
    const pr = new Prop(x, y, { im: ART.tuck_marble, solid: [], ox: 5, oy: 7 });
    pr.baseY = -50;
    pr.interact = () => {
        Script.run(function* () {
            yield* say(null, Progress.flag('great_pull') && !Progress.flag('unwound')
                ? "Tuck's marble, where he left it by the Well. Every marked thing in the square is straining toward the Well's mouth; the marble just sits. Nothing's pulling it. Nothing ever did."
                : Progress.flag('reveal2') ? "Tuck's marble, by the Well. Everybody in town has a thread now, if you look. The marble hasn't. It's only where Tuck put it."
                    : "Tuck's odd marble, exactly where he left it this time. Nothing tidies it away. Nothing pulls it home.");
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === x && f.ty === y;
    return pr;
};
OW.blocks['1,1'].ents.push({ k: 'tuckmarble', x: 0, y: 0, if: 'fav_marble' });

/* ---------------- 4. Auntie Mabel's floor of strays (the Recall Bell) ---------------- */
/* Everything on her floor is a stray, she says: nothing ever pulls it home. One of them is a battered
   sewing tin, and it snores. Rung awake, it snaps home along its thread to the little table by her counter, shoving
   the light strays aside; the heavy one in its way it can't shift, and waits, until that's moved off its thread. */
const TIN_TRACE = [[1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [9, 5]];
class SewingTin extends Liftable {
    constructor(tx, ty, p = {}) { super('tin', tx, ty, p); this.noNeedle = true; this.noCut = true; this.noCutLine = "It's Mabel's. It's only just come home."; this.stitchName = 'the sewing tin'; }
    sprite() { return spr('sewing_tin'); }
    draw(cx, cy) {
        if (this.ret && this.ret.state === 'home' && !this.carried && !this.mv) Gfx.img(spr('tin_table'), this.px - cx, this.py - cy);
        GridThing.prototype.draw.call(this, cx, cy);
    }
    onHome() {
        if (Progress.flag('fav_tin')) return;
        Progress.set('fav_tin'); Stats.count('favour:tin');
        Script.run(function* () {
            yield 20;
            yield* say('mabel', "...That's my mother's sewing tin. Her thimble, her needles, the lot. It's been on that floor with the strays thirty years. I've dusted it every Tuesday.");
            yield* say('mabel', "I called it a stray. It wasn't a stray at all. It was only asleep.");
            yield* say('mabel', "Here. Have a stray of your own, a real one. They're the only things in Hollowell a body can give away.");
            yield* Story.getItem('oddsock')();
            yield* say('mabel', "And forty buttons. Don't argue. I've a whole jar of them nobody ever comes back for.");
            Favours.buttons(40);
        });
    }
}
SPAWN.tin = (x, y, p) => new SewingTin(x, y, p);
AREAS.lostfound.ents.push(
    { k: 'tin', x: 1, y: 3, id: 'mabelTin', sleeper: true, tiedOff: true, resetSleep: true, startAt: [9, 5], trace: TIN_TRACE, pushLine: "A battered sewing tin among the strays, fast asleep. It snores, very faintly, like a kettle a long way off.", if: '!fav_tin' },
    { k: 'tin', x: 1, y: 3, id: 'mabelTin', if: 'fav_tin' },
    /* the strays on the floor: never home, because they've none (pushed, they stay pushed) */
    { k: 'stray', x: 5, y: 4, id: 'mabelStone' },
    { k: 'crate', x: 8, y: 5, marked: false, id: 'mabelCrate' },
    { k: 'crate', x: 9, y: 6, marked: false, id: 'mabelCrate2' },
    { k: 'stray', x: 7, y: 6, id: 'mabelStone2' },
);
ITEMS.oddsock = { name: 'Odd sock', kind: 'keepsake', desc: "A striped sock from Auntie Mabel's strays. Its pair is somewhere. It doesn't seem to mind." };
ITEM_LINES.oddsock = () => "You got an {blue}odd sock{/}! A stray, striped, from Auntie Mabel's floor. Its pair is somewhere. It doesn't seem to mind.";
FAVOUR_TALK.mabel = function* () {
    if (Progress.flag('fav_tin') && Progress.flag('reveal2'))
        return yield* Favours.once('fav_tinR2', 'mabel', "Asleep, you said. Not lost. Just asleep, all those years, with me calling it a stray. I keep wondering how much else in this town is only asleep.");
    if (!Progress.flag('fav_tin') && Progress.flag('met:mabel'))
        return yield* Favours.once('fav_tinTold', 'mabel', "Everything on my floor there is a stray. Things nobody comes back for, that nothing pulls home. Not one of them has moved an inch on its own in thirty years.");
    return false;
};

/* ---------------- 5. Jory's back room (the Crossbar) ---------------- */
/* Jory made Tuck a Wanderer's stick, gave it its place on Tuck's bed (a Maker gives a gift by giving it its place), and
   locked it in his back room for later. Its crimson thread runs under the door, across the shop, out into the street
   and all the way to Tuck's. The door opens from inside, from a plate; the only way in is a little hole low in the wall,
   and the only thing that fits is the shop's puppet. On its plate, the door swings open and the parcel's off home. */
class Parcel extends GridThing {
    constructor(tx, ty, p = {}) {
        super('parcel', tx, ty, Object.assign({ weight: WEIGHT.light, thread: THREAD.jory }, p));
        this.noPush = true; this.noNeedle = true; this.noCut = true; this.noCutLine = "It's not yours to cut loose. It's Tuck's."; this.noGrip = true;
    }
    sprite() { return spr('parcel'); }
    interact() {
        Script.run(function* () { yield* say(null, "A long parcel in brown paper, tied with red string. A label in Jory's hand: TUCK. FOR LATER. It strains at the door like a dog on a lead."); });
        return true;
    }
    /* home is out of the door and away up the street: there it goes */
    onHome() {
        if (Progress.flag('fav_stick')) return;
        Progress.set('fav_stick'); Stats.count('favour:stick');
        Fx.poof(this.px + 8, this.py + 8); Sfx.play('home');
        this.area.remove(this);
        UI.toast('The parcel shoots out of the door and away up the street, as if it knows exactly where it\'s going.', 200);
    }
}
SPAWN.parcel = (x, y, p) => new Parcel(x, y, p);
AREAS.toys.ents.push(
    { k: 'puppet', x: 10, y: 7, id: 'jPuppet' },
    { k: 'plate', x: 10, y: 2, sig: 'jLatch' },
    { k: 'door', x: 3, y: 4, type: 'gate', when: 'jLatch', dir: 'h', id: 'jDoor', passed: 'up' },
    { k: 'parcel', x: 6, y: 8, id: 'jParcel', startAt: [3, 3], trace: [[6, 8], [6, 7], [5, 7], [5, 6], [4, 6], [4, 5], [3, 5], [3, 4], [3, 3]], if: '!fav_stick' },
    { k: 'chest', x: 1, y: 2, item: 'b50', id: 'jChest' },
    { k: 'deco', x: 4, y: 1, look: 'jory_note', solid: [[0, 0]], oy: 2, baseY: -100, text: "A note pinned up in Jory's hand: TUCK'S. FOR LATER. NOT BEFORE. And underneath, smaller: If you can read this, you're good with strings. Have a look in the chest. - J." },
);
/* out in the street, the parcel's thread: from Jory's door, down through the square, to Tuck's (drawn on the ground) */
const STICK_THREAD = [[24, 9], [24, 12], [23, 13], [23, 25], [25, 26], [25, 31], [19, 31], [18, 32], [18, 35]];
SPAWN.stickthread = () => {
    const e = new Ent('stickthread', { x: 0, y: 0 });
    e.floor = true;
    Object.defineProperty(e, 'sortY', { get() { return -2000; } });
    e.draw = function (cx, cy) {
        const pts = STICK_THREAD.map(([x, y]) => hubAt(x, y)).map(([x, y]) => [x * T + 8 - cx, y * T + 9 - cy]);
        for (let i = 0; i + 1 < pts.length; i++) {
            Gfx.alpha(0.35); Gfx.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, '#1a1018'); Gfx.alpha(0.8);
            Gfx.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], THREAD.jory); Gfx.alpha(1);
        }
    };
    /* (on the screen wherever the camera is: the culling looks at x and y) */
    e.update = function () { this.x = Cam.x + 100; this.y = Cam.y + 60; };
    return e;
};
OW.blocks['1,1'].ents.push({ k: 'stickthread', x: 0, y: 0, if: '!fav_stick' });
/* Tuck, holding his stick (for later; holding's not using) */
{
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        const r = draw0.call(this, cx, cy);
        if (this.who === 'tuck' && Progress.flag('fav_stick') && this.area && this.area.id === 'hollow') {
            const x = this.px - cx + (this.dir === LEFT ? 1 : 13), y = this.py - cy;
            Gfx.rect(x, y - 7, 2, 18, PAL.ink); Gfx.rect(x, y - 6, 1, 16, '#c9925a'); Gfx.rect(x - 1, y - 8, 4, 3, PAL.ink); Gfx.rect(x, y - 7, 2, 1, THREAD.wren);
        }
        return r;
    };
}
/* ---------------- 6. Rosa's saucer for Biscuit (the Needle) ---------------- */
/* The saucer belongs on the bakery's front sill, so whenever Rosa sets it out on the back step it walks itself home,
   round the corner, long before the cat comes by (Biscuit's round stops at the back step, by its crawlspace). Given a
   new place on the back step, it stays. It's too full to throw: set it down. */
const SAUCER_HOME = [40, 32];
/* (round the back step, where it can be seen: right under the eaves the bakery's roof hides it) */
const BACKSTEP = new Set([[39, 26], [40, 26], [41, 26], [42, 27], [42, 28]].map(([x, y]) => key2(...hubAt(x, y))));
const saucerPlaced = () => Inv.stitches.some(r => r.area === 'hollow' && r.key === 'saucer' && BACKSTEP.has(key2(r.to[0], r.to[1])));
class Saucer extends Liftable {
    constructor(tx, ty, p = {}) { super('saucer', tx, ty, p); this.noThrow = true; this.lap = 0; this.licked = false; this.stitchName = "Rosa's saucer"; }
    sprite() { return spr(this.licked ? 'saucer_empty' : 'saucer'); }
    tick() {
        const r = this.ret;
        const placed = r && r.state === 'home' && !this.carried && BACKSTEP.has(key2(r.mx, r.my));
        if (placed && !Progress.flag('fav_saucerPlaced')) { Progress.set('fav_saucerPlaced'); UI.toast('The saucer settles on the back step. Its place, now.', 160); }
        if (this.lap > 0) this.lap--;
        if (!placed || this.licked) return;
        const cat = this.area.ents.find(e => e.kind === 'critter' && e.who === 'biscuit');
        if (cat && cat.wait > 0 && Math.hypot(cat.x - (this.tx * T + 8), cat.y - (this.ty * T + 10)) < 40) { this.lap = 150; this.licked = true; this.cat = cat; }
    }
    draw(cx, cy) {
        GridThing.prototype.draw.call(this, cx, cy);
        const c = this.cat;
        if (this.lap > 0 && c) { const b = spr('bubble_heart'); if (b) Gfx.img(b, c.x - cx - 4, c.y - cy - 22 - ((150 - this.lap) >> 5)); }
    }
}
SPAWN.saucer = (x, y, p) => new Saucer(x, y, p);
OW.blocks['1,1'].ents.push({ k: 'saucer', x: SAUCER_HOME[0], y: SAUCER_HOME[1], id: 'saucer' });
/* Rosa: the saucer (and Tuck's stick, which she's heard about) */
FAVOUR_TALK.rosa = function* () {
    if (Progress.flag('fav_saucerPlaced') && !Progress.flag('fav_saucer')) {
        Progress.set('fav_saucer'); Stats.count('favour:saucer');
        yield* say('rosa', "The saucer's on the back step, and it's STAYING there! Biscuit's been round already, look: licked clean, and him washing his whiskers on my step like a lord.");
        yield* say('rosa', "I don't know how you did it and I'm not going to ask. Twenty buttons. And a bun, any time you're in, for nothing. Any time at all.");
        Favours.buttons(20);
        return true;
    }
    if (Progress.flag('fav_saucer') && Inv.hp < Inv.maxHp) {
        Inv.hp = Inv.maxHp; Sfx.play('heart');
        yield* say('rosa', saucerPlaced() ? "Bun, love. On the house. Always." : "Bun, love, on the house. ...The saucer's walked itself round the front again, mind. Biscuit looked ever so put out.");
        return true;
    }
    if (Progress.flag('fav_stick') && !Progress.flag('fav_stickRosa') && Progress.flag('met:rosa')) {
        Progress.set('fav_stickRosa');
        yield* say('rosa', "Tuck says a stick flew in at his window and landed on his bed, with his name burnt on it. Jory's work, that is. Jory's been gone all season. ...Was that you, love?");
        return true;
    }
    if (!Progress.flag('fav_saucerPlaced') && Progress.flag('met:rosa'))
        return yield* Favours.once('fav_saucerTold', 'rosa', "Every night I put a saucer of cream out on the back step for Biscuit. Every morning it's walked itself round to the front again, still full. That poor cat's never had a drop.");
    return false;
};

/* ---------------- the town's tick for them: the crates home ---------------- */
{
    const B = OW.blocks['1,1'], tick0 = B.tick;
    B.tick = a => {
        if (tick0) tick0(a);
        if (Progress.flag('fav_cratesHome')) return;
        const A = a.find('guildA'), C = a.find('guildB');
        if (A && C && Return.isHome(A) && Return.isHome(C)) { Progress.set('fav_cratesHome'); UI.toast("Both crates home at last, and the lane clear. Somewhere inside, Thimble whoops.", 180); }
    };
}

/* what's new in town, for the journal, until it's done */
TOWN_NEWS.push(
    [() => Progress.flag('d1'), () => Progress.flag('fav_cratesHome'), "Thimble's crates, stuck in the lane by her shop", 1],
    [() => Progress.flag('d2'), () => Progress.flag('fav_kite'), "the children's kite, up the tree by the Inn", 2],
    [() => !!Inv.items.marble, () => Progress.flag('fav_marble'), "Tuck, who's never had a thing that stays put", 9],
    [() => Progress.flag('d4'), () => Progress.flag('fav_tin'), "Auntie Mabel's floor of strays", 4],
    [() => Progress.flag('reveal1'), () => Progress.flag('fav_stick'), "the puppet in Jory's shop window", 6],
    [() => Progress.flag('d7'), () => Progress.flag('fav_saucerPlaced'), "Rosa's saucer of cream for Biscuit", 7],
);

/* a handful of buttons out of a chest is named for what it is ("You found 50 buttons!") */
for (const n of [5, 10, 20, 30, 40, 50, 100]) if (!ITEM_LINES['b' + n]) ITEM_LINES['b' + n] = () => `You found {blue}${n} buttons{/}!`;

function initTownFavours() {
    defSprite('guild_crate', [
        '.kkkkkkkkkkkkkk.', 'kuuuuuuuuuuuuuuk', 'kuUUUUUUUUUUUUuk', 'kuuuuuuuuuuuuuuk', 'kBBBBBBBBBBBBBBk',
        'kbbbbbbbbbbbbbbk', 'kbbbbkkkkkkbbbbk', 'kbbbbkddddkbbbbk', 'kbbbbbkddkbbbbbk', 'kbbbbbkddkbbbbbk',
        'kbbbbkddddkbbbbk', 'kbbbbkkkkkkbbbbk', 'kbbbbbbbbbbbbbbk', 'kbBbbbbbbbbbbBbk', 'kBBBBBBBBBBBBBBk', '.kkkkkkkkkkkkkk.'],
        { u: '#e6b47a', U: '#c48a52', b: '#b47a44', B: '#7e4e2a', d: '#8a6a3a' });
    defSprite('kite', [
        '.......k........', '......krk.......', '.....krrrk......', '....krrkrrk.....', '...krrrkrrrk....', '..krrwrkrrrrk...',
        '.kkkkkkkkkkkkk..', '..kRRRRkRRRRk...', '...kRRRkRRRk....', '....kRRkRRk.....', '.....kRkRk......', '......kkk.......',
        '.......kk.......', '........yk......', '.......ky.......', '........yk......'],
        { r: '#e8463c', R: '#a82a26', w: '#ffd0c8', y: '#f7d64a' });
    defSprite('kite_peg', ['.kk.', 'kbbk', '.kk.', '.kb.', '.kb.', '.kb.', '.kb.', '.kb.', '.kb.', '.kb.', '.kb.', 'kbbk', 'kkkk'], { b: '#9a6438' });
    defSprite('sewing_tin', ['................', '................', '................', '................', '...kkkkkkkkkk...', '..kaaaaaaaaaak..', '..kaAwwwwwwAak..', '..kaAwiiiiwAak..',
        '..kkkkkkkkkkkk..', '..kzzzzzzzzzzk..', '..kzzZzzzzZzzk..', '..kzzzzzzzzzzk..', '..kZZZZZZZZZZk..', '...kkkkkkkkkk...', '................', '................'],
        { a: '#7fb6d8', A: '#4f86b0', w: '#fbf6ea', i: '#e86a8e', z: '#5f9ac4', Z: '#3a6a94' });
    defSprite('tin_table', ['................', '................', '................', '................', '................', '................', '................', '................',
        '................', '................', '................', '.kkkkkkkkkkkkkk.', 'kuuuuuuuuuuuuuuk', 'kUUUUUUUUUUUUUUk', '.kbk........kbk.', '.kbk........kbk.'],
        { u: '#c9925a', U: '#9a6438', b: '#7a4e32' });
    defSprite('parcel', ['................', '................', '................', '................', '................', '..kkkkkkkkkkkk..', '.kwwwwrwwwwwwwk.', '.kuuuurrrrrrrrkk',
        '.kuuuuruuuuuuurk', '.kUUUUrUUUUUUUk.', '..kkkkrkkkkkkk..', '......rr........', '................', '................', '................', '................'],
        { w: '#e6c08a', u: '#c9925a', U: '#9a6438', r: '#c42b4a' });
    defSprite('saucer', ['................', '................', '................', '................', '................', '................', '................', '................',
        '................', '................', '...kkkkkkkkkk...', '..kwwwwwwwwwwk..', '.kWwwwwwwwwwwWk.', '.kkWWWWWWWWWWkk.', '...kkkkkkkkkk...', '................'],
        { W: '#cfd8e0' });
    defSprite('saucer_empty', ['................', '................', '................', '................', '................', '................', '................', '................',
        '................', '................', '...kkkkkkkkkk...', '..kAAAAAAAAAAk..', '.kWAAAAAAAAAAWk.', '.kkWWWWWWWWWWkk.', '...kkkkkkkkkk...', '................'],
        { W: '#cfd8e0', A: '#9aa8b8' });
    defSprite('icon_marble', ['................', '................', '................', '................', '.....kkkkk......', '....kaawaak.....', '...kaawwaaak....', '...kaaaaaZak....',
        '...kaaaZaaak....', '...kaaZaaaak....', '....kaaaaak.....', '.....kkkkk......', '................', '................', '................', '................'],
        { a: '#8fd4c8', w: '#ffffff', Z: '#3a8a7a' });
    defSprite('icon_oddsock', ['................', '.....kkkkk......', '.....krrrk......', '.....kwwwk......', '.....krrrk......', '.....kwwwk......', '.....krrrk......', '.....kwwwk......',
        '.....krrrkk.....', '.....kwwwwwkk...', '.....krrrrrrrk..', '......kwwwwwwk..', '.......kkkkkk...', '................', '................', '................'],
        { r: '#4f9be0', w: '#f7d64a' });
    ART.tuck_marble = paintSprite(6, 6, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#8fd4c8', 1, 1, 4, 4); R('#ffffff', 2, 1, 1, 1); R('#3a8a7a', 3, 3, 1, 1); R('#3a8a7a', 4, 2, 1, 1); });
    ART.jory_note = paintSprite(12, 12, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#fbf6ea', 1, 2, 10, 9); R('#c42b4a', 5, 1, 2, 2); for (let i = 0; i < 4; i++) R('#7a6a5a', 3, 4 + i * 2, 6 - (i % 2) * 2, 1); });
    ART.staff_light = paintSprite(16, 16, x => { x.globalAlpha = 0.35; x.fillStyle = '#f7d27a'; x.beginPath(); x.moveTo(3, 0); x.lineTo(13, 0); x.lineTo(15, 16); x.lineTo(1, 16); x.fill(); x.globalAlpha = 0.25; x.fillStyle = '#fff4c0'; x.fillRect(5, 0, 6, 10); }, false);
    ART.pudding_ball = paintSprite(8, 8, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#e8463c', 1, 1, 6, 6); R('#ffffff', 2, 2, 2, 1); R('#a82a26', 2, 5, 4, 1); });
}
CONTENT_INIT.push(initTownFavours);
