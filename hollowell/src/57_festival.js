/* The Knotting Festival: home after the fourth Knot, the square strung with bunting and the whole town out.
   Gran says a few words; four people arrive late, out of breath, from four directions, with clay and river
   water and brass dust and a feather duster on them (drawn: MakerProps, below). And Returnball (S29): carry
   the ball through the rings, let it go, and it comes home back through them; a ring counts each time the
   ball passes it on its way home. All five in one go: a Heart Patch. */

/* the decorations, the court and the stage go into the town once the fourth Knot is tied: bunting strung from lamp to
   post to post to lamp along both sides of the square, a paper lantern on every lamp */
{
    const hub = OW.blocks['1,1'];
    hub.ents.push(
        { k: 'deco', x: 27, y: 16, look: 'lantern_post', solid: [[0, 0]], oy: -14, if: 'd4' },
        { k: 'deco', x: 34, y: 16, look: 'lantern_post', solid: [[0, 0]], oy: -14, if: 'd4' },
        { k: 'deco', x: 27, y: 25, look: 'festpole', solid: [[0, 0]], oy: -20, if: 'd4' },
        { k: 'deco', x: 34, y: 25, look: 'festpole', solid: [[0, 0]], oy: -20, if: 'd4' },
        { k: 'feststring', x: 20, y: 15, a: 'lamp', to: [7, 1, 'post'], if: 'd4' }, { k: 'feststring', x: 27, y: 16, a: 'post', to: [7, 0, 'post'], if: 'd4' },
        { k: 'feststring', x: 34, y: 16, a: 'post', to: [9, -1, 'lamp'], if: 'd4' },
        { k: 'feststring', x: 20, y: 24, a: 'lamp', to: [7, 1, 'pole'], if: 'd4' }, { k: 'feststring', x: 27, y: 25, a: 'pole', to: [7, 0, 'pole'], if: 'd4' },
        { k: 'feststring', x: 34, y: 25, a: 'pole', to: [9, -1, 'lamp'], if: 'd4' },
        /* Returnball, east of the south road */
        { k: 'ball', x: 36, y: 34, id: 'rbBall', if: 'd4' },
        { k: 'goalring', x: 38, y: 33, if: 'd4' }, { k: 'goalring', x: 41, y: 33, if: 'd4' }, { k: 'goalring', x: 43, y: 35, if: 'd4' },
        { k: 'goalring', x: 40, y: 36, if: 'd4' }, { k: 'goalring', x: 37, y: 36, if: 'd4' },
        { k: 'sign', x: 35, y: 33, text: "RETURNBALL! Carry the ball through the rings, then let it go. Every ring it goes back through on its way home scores. Five in one go wins a prize! (One prize per Wanderer.)", if: 'd4' },
    );
}

class Ball extends Liftable {
    constructor(tx, ty, p = {}) { super('ball', tx, ty, p); this.floats = true; }
    /* a fresh ball (the place built again): no score carried over from a throw that never finished */
    onAdd(area) { super.onAdd(area); Returnball.score = 0; for (const r of area.ents) if (r.kind === 'goalring') r.hit = false; }
    sprite() { return spr('rball'); }
    onHome() { Returnball.home(this); }
}
SPAWN.ball = (x, y, p) => new Ball(x, y, p);

class GoalRing extends FloorThing {
    constructor(tx, ty, p = {}) { super('goalring', tx, ty, p); this.lit = 0; }
    update() {
        if (this.lit > 0) this.lit--;
        const b = this.area.find('rbBall');
        if (!b || !b.ret || b.ret.state !== 'returning') { if (b && b.ret && b.ret.state === 'home') this.hit = false; return; }
        if (!this.hit && b.tx === this.tx && b.ty === this.ty) { this.hit = true; this.lit = 40; Returnball.score++; Sfx.play('blip'); Fx.ring(this.tx * T + 8, this.ty * T + 8, '#f7d64a'); }
    }
    draw(cx, cy) {
        const x = this.tx * T - cx + 8, y = this.ty * T - cy + 9;
        for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; Gfx.rect(Math.round(x + Math.cos(t) * 6), Math.round(y + Math.sin(t) * 4), 2, 1, this.lit ? '#f7d64a' : (i % 2 ? '#e8463c' : '#fbf6ea')); }
    }
}
SPAWN.goalring = (x, y, p) => new GoalRing(x, y, p);

const Returnball = {
    score: 0,
    home(b) {
        const n = this.score; this.score = 0;
        for (const r of b.area.ents) if (r.kind === 'goalring') r.hit = false;
        if (!n) return;
        Stats.count('returnball');
        if (n >= 5 && !Progress.flag('s29')) {
            Progress.set('s29'); Stats.count('secret:returnball');
            Script.run(function* () {
                yield* say('pip', '{surprised}FIVE! All five! Nobody gets five! Here, it\'s the prize, it\'s a Heart Patch, Mum sewed it!');
                yield* Story.getItem('heartpatch')();
            });
        } else UI.toast(n >= 5 ? 'Five rings! A perfect throw.' : `Returnball: ${n} ring${n === 1 ? '' : 's'}.`, 120);
    },
};

const Festival = {
    tick(a) {
        if (a.id !== 'hollow' || !Progress.flag('d4') || Progress.flag('festival') || Script.blocking()) return;
        const p = G.player; if (!p || p.state !== 'normal') return;
        /* in the square */
        if (p.tx >= 64 + 21 && p.tx < 64 + 43 && p.ty >= 40 + 13 && p.ty < 40 + 27) { Progress.set('festival'); Script.run(this.scene()); }
    },
    /* the whole town out in the square, round the Well (and Bram not at his stall yet: he's late) */
    CROWD: [['rosa', 90, 58, 'right'], ['thimble', 89, 59, 'right'], ['tuck', 90, 62, 'right'], ['quill', 91, 62, 'right'], ['seam', 100, 58, 'left'],
        ['mallow', 100, 61, 'left'], ['mabel', 99, 62, 'left'], ['gundry', 101, 60, 'left'], ['pip', 96, 63, 'up']],
    gather(a) {
        const bram = a.ents.find(e => e.kind === 'npc' && e.who === 'bram' && e.tx === 98 && e.ty === 64);
        if (bram) a.remove(bram);
        for (const [who, x, y, f] of this.CROWD) {
            let n = a.ents.find(e => e.kind === 'npc' && e.who === who && e.constructor === NPC);
            if (n) this.put(n, x, y); else n = a.add(new NPC(x, y, { who }));
            n.dir = dirByName(f); n.free = true; n.fest = true;
        }
        const arlo = a.ents.find(e => e.kind === 'npc' && e.who === 'arlo'); if (arlo) { arlo.dir = RIGHT; arlo.fest = true; }
    },
    /* someone straight to a tile, their place moved with them */
    put(n, x, y) {
        const a = n.area; a.unplace(n, n.tx, n.ty); n.mv = null; n.path = null; n.walking = false;
        n.tx = x; n.ty = y; n.x = x * T; n.y = y * T; a.place(n, x, y);
        if (n.ret) { n.ret.mx = x; n.ret.my = y; n.ret.trace = [[x, y]]; n.ret.state = 'home'; }
    },
    *scene() {
        const a = G.map, p = G.player, X = 64, Y = 40;
        Music.play('silence');
        G.hideHud = true; UI.banner = null;
        /* you walk into the middle of it; Gran steps out to meet you */
        const gran = a.ents.find(e => e.kind === 'npc' && e.who === 'gran');
        if (gran) { gran.free = true; gran.walkTo(X + 31, Y + 20, 0.8); }
        yield* walkTo(p, X + 31, Y + 22);
        p.dir = UP;
        yield* camLook(X + 32, Y + 20);
        for (let i = 0; i < 60 && gran && (gran.walking || gran.mv); i++) yield 1;
        if (gran) gran.dir = DOWN;
        yield* say('gran', "{happy}There she is! Four Knots! Only two to go, love. The town's put on the Knotting Festival for you, the way it always does for the Wanderer.");
        /* and four people come hurrying in from four directions, out of breath (from the Kiln, the Millrace, the Belfry
           and the Tidyhouse, though nobody says so) */
        const late = [['bram', X + 20, Y + 20, X + 29, Y + 21, RIGHT, 'clay'], ['ambrose', X + 44, Y + 20, X + 33, Y + 23, LEFT, 'wet'],
            ['tess', X + 32, Y + 13, X + 33, Y + 21, LEFT, 'brass'], ['ives', X + 30, Y + 27, X + 29, Y + 23, RIGHT, 'duster']];
        const runs = late.map(([who, sx, sy, gx, gy, d, prop]) => {
            let n = a.ents.find(e => e.kind === 'npc' && e.who === who && e.constructor === NPC);
            if (n) this.put(n, sx, sy); else n = a.add(new NPC(sx, sy, { who }));
            n.free = true; n.prop = prop; n.walkTo(gx, gy, 2);
            return { n, gx, gy, d, t: 0, there: false };
        });
        for (let i = 0; i < 300 && runs.some(r => !r.there); i++) {
            for (const r of runs) {
                if (r.there) continue;
                if (r.n.tx === r.gx && r.n.ty === r.gy && !r.n.mv) { r.there = true; r.n.dir = r.d; r.n.bubble = 'puff'; r.n.puffT = 90; Fx.dust(r.n.px + 8, r.n.py + 14); Sfx.play('land'); continue; }
                /* (one held up by somebody in the way finds another way round) */
                if (!r.n.mv && ++r.t > 20) { r.t = 0; r.n.walkTo(r.gx, r.gy, 2); }
            }
            yield 1;
        }
        /* (one still held up on the way stops where they are, facing in, so they can turn to her when they speak) */
        for (const r of runs) if (!r.there) { r.n.path = null; r.n.walking = false; r.n.dir = r.d; r.n.bubble = 'puff'; r.n.puffT = 90; }
        yield 30;
        yield* say(null, "Bram has clay up to his elbows. Your dad is soaked to the shoulder. Your mum's hair is full of brass dust. Ives has a feather duster in her apron pocket.", { focus: [X + 31, Y + 22] });
        yield* say('tess', '{worried}Sorry! Sorry. Busy day.');
        yield* say('ambrose', '{worried}Very busy.');
        yield* say('bram', "{happy}Pots don't make themselves! HA!");
        yield* say('ives', '{worried}...Tidying.');
        for (const r of runs) r.n.bubble = null;
        yield* say('gran', "{happy}Well, you're here now. All of you. Music!");
        /* the music, and everyone dancing on the spot */
        Music.play('festival');
        for (const e of a.ents) if (e.kind === 'npc' && (e.fest || e.prop)) e.dance = true;
        yield 50;
        yield* say('gran', "And {name}: when you've eaten something, there's the east road. The old giant's been asleep across it since before I was born. You've a bell now, haven't you?");
        Progress.setGoal('The east road out of town: the sleeping giant. Ring the Recall Bell at it.');
        /* Pip, and over by the bakery, the Returnball rings */
        yield* say('pip', "{happy}And Returnball! By the bakery! Nobody's ever got five!");
        yield* camLook(X + 39, Y + 34);
        yield 50;
        yield* camBack();
        /* (Bram back to his stall; the rest stay out a while) */
        const bram = runs[0].n; bram.dance = false; bram.walkTo(X + 34, Y + 24);
        G.hideHud = false;
    },
};
/* the town gathers in the square on festival day */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        if (id === 'hollow' && Progress.flag('d4') && !Progress.flag('festival')) Festival.gather(a);
        return a;
    };
}
{
    const prev = Story.tick;
    Story.tick = a => { if (prev) prev(a); Festival.tick(a); };
}

/* a string of bunting hung between two posts (a lamp, a lantern post, a festival pole): little flags in every colour,
   swaying; a lamp at either end gets a red paper lantern hung from it */
const FEST_TOP = { lamp: -11, post: -12, pole: -18 };
class FestString extends Ent {
    constructor(tx, ty, p) {
        super('feststring');
        const [dx, dy, kb] = p.to;
        this.ax = tx * T + 8; this.ay = ty * T + FEST_TOP[p.a]; this.bx = (tx + dx) * T + 8; this.by = (ty + dy) * T + FEST_TOP[kb];
        this.lamps = [p.a === 'lamp' ? [this.ax, this.ay] : null, kb === 'lamp' ? [this.bx, this.by] : null].filter(Boolean);
        this.x = (this.ax + this.bx) / 2; this.y = (this.ay + this.by) / 2; this.foot = Math.max(ty, ty + dy) * T + 15;
    }
    get sortY() { return this.foot; }
    draw(cx, cy) {
        const cols = ['#e8463c', '#f7d64a', '#4f9be0', '#3fc1b5', '#f59ac0', '#e0913a'];
        const n = Math.max(2, Math.round(Math.abs(this.bx - this.ax) / 2)), sag = 4 + Math.abs(this.bx - this.ax) / 18;
        const at = u => [this.ax + (this.bx - this.ax) * u - cx, this.ay + (this.by - this.ay) * u + sag * 4 * u * (1 - u) - cy];
        let [px, py] = at(0);
        for (let i = 1; i <= n; i++) { const [x, y] = at(i / n); Gfx.line(px, py, x, y, '#5a3a26'); px = x; py = y; }
        const flags = Math.floor(Math.abs(this.bx - this.ax) / 8);
        for (let i = 1; i < flags; i++) {
            const [x, y] = at(i / flags), sw = Math.round(Math.sin(G.t / 26 + i * 1.3 + this.ax) * 0.8), c = cols[(i + (this.ax >> 4)) % cols.length];
            for (let j = 0; j < 5; j++) Gfx.rect(Math.round(x) - 2 + (j >> 1) + (j > 2 ? sw : 0), Math.round(y) + 1 + j, 5 - j, 1, j === 0 ? shade(c, -0.25) : c);
        }
        /* a paper lantern on each lamp, glowing */
        for (const [lx, ly] of this.lamps) {
            const x = Math.round(lx - cx) + 4, y = Math.round(ly - cy) + 1;
            Gfx.rect(x + 2, y, 1, 3, '#5a3a26'); Gfx.rect(x, y + 3, 5, 1, '#c8a83a');
            Gfx.rect(x - 1, y + 4, 7, 6, PAL.ink); Gfx.rect(x, y + 4, 5, 6, '#e8463c'); Gfx.rect(x + 1, y + 5, 3, 4, '#f5786c'); Gfx.rect(x + 2, y + 6, 1, 2, '#ffd27a');
            Gfx.rect(x, y + 10, 5, 1, '#c8a83a');
        }
    }
}
SPAWN.feststring = (x, y, p) => new FestString(x, y, p);

/* the Makers' giveaways, drawn on them (the festival, and the stage at the Marionette Hall): Bram's clay up to the
   elbows, Dad's soaked sleeves dripping, brass dust glinting in Mum's hair, Ives's feather duster in her apron pocket,
   Doctor Mallow's night lamp, Jory's great crossbar. Spots are on the person's 16-wide frame, facing you (mirrored when
   they face left); a dancer bobs to the music; someone out of breath puffs */
const MakerProps = {
    clay(R, d, t) {
        const c = '#a8907a', h = '#cbb8a0', k = '#7a6656';
        const arm = x => { R(c, x, 10, 2, 4); R(h, x, 10, 1, 2); R(k, x + 1, 13, 1, 1); };
        if (d === 'right') { arm(9); R(c, 7, 14, 2, 1); return; }
        arm(3); arm(12); R(c, 6, 14, 2, 1); R(h, 9, 13, 1, 1);
    },
    wet(R, d, t) {
        /* soaked to the shoulder, and dripping on the cobbles */
        const c = '#2e6ab0', drip = '#9fd4f0', k = (t % 36), y = 14 + Math.min(6, k >> 1);
        const sleeve = x => { R(c, x, 10, 2, 4); R('#1e4a80', x, 13, 2, 1); };
        if (d === 'right') sleeve(9); else { sleeve(3); sleeve(12); }
        for (const x of d === 'right' ? [9] : [3, 13]) { if (k < 13) R(drip, x, y, 1, 2); else if (k < 18) { R(drip, x - 1, 20, 1, 1); R(drip, x + 1, 20, 1, 1); } }
    },
    brass(R, d, t) { const s = [[5, 2], [9, 1], [11, 3], [6, 4], [8, 3]]; s.forEach(([x, y], i) => R(((t >> 3) + i) % 3 ? '#e2b45a' : '#fff4c0', x, y, 1, 1)); },
    duster(R, d, t) {
        if (d === 'up') { R('#6b4128', 12, 9, 1, 4); R('#e8463c', 11, 7, 1, 2); R('#f7d64a', 12, 6, 1, 3); R('#4f9be0', 13, 7, 1, 2); return; }
        const x = d === 'right' ? 10 : 12;
        R(PAL.ink, x - 1, 6, 5, 5); R('#e8463c', x, 7, 1, 3); R('#f7d64a', x + 1, 7, 1, 3); R('#4f9be0', x + 2, 7, 1, 3); R('#8fd46a', x + 1, 6, 1, 1);
        R('#6b4128', x + 1, 11, 1, 3);
    },
    lamp(R, d, t) {
        const x = d === 'right' ? 11 : 13, y = 10, f = (t >> 4) % 2;
        R(PAL.ink, x - 1, y, 5, 7); R('#a6772a', x, y, 3, 1); R(f ? '#ffe08a' : '#ffd27a', x, y + 1, 3, 4); R('#fff4c8', x + 1, y + 2, 1, 2); R('#a6772a', x, y + 5, 3, 1);
    },
    crossbar(R, d, t) {
        /* (as wide as a door, held in both hands at his middle, its upright below his chin, not up over his face; a few
           slack strings still hanging off it) */
        R(PAL.ink, -7, 14, 30, 5); R('#9a6438', -6, 15, 28, 3); R('#c9925a', -6, 15, 28, 1);
        R(PAL.ink, 6, 12, 4, 10); R('#9a6438', 7, 13, 2, 8);
        for (const x of [-5, 0, 16, 21]) R('#cfc6b8', x, 18, 1, 4 + (x & 3));
    },
    draw(n, sx, sy) {
        const f = MakerProps[n.prop]; if (!f) return;
        const d = n.dir === LEFT ? 'right' : DIR_NAME[n.dir], flip = n.dir === LEFT, h = n.sprite() ? n.sprite().height : 20;
        /* (an old body is a row shorter at the neck) */
        const dy = h < 20 ? -1 : 0;
        f((c, x, y, w, hh) => Gfx.rect(flip ? sx + 16 - x - w : sx + x, sy + y + (y > 8 ? dy : 0), w, hh, c), d, G.t + n.uid * 7);
    },
};
{
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        if (!this.prop && !this.dance && !this.puffT) return draw0.call(this, cx, cy);
        const bob = this.dance && !this.mv && !Script.running('talk') ? (((G.t + this.uid * 13) >> 4) % 2) : 0;
        if (this.puffT > 0 && --this.puffT === 0 && this.bubble === 'puff') this.bubble = null;
        draw0.call(this, cx, cy + bob);
        const im = this.sprite();
        if (im && this.prop) MakerProps.draw(this, this.px - cx, this.py - cy + bob - (im.height - T) - 2);
    };
}

function initFestival() {
    defSprite('rball', ['................', '................', '................', '.....kkkkkk.....', '....kyyrryyk....', '...kyywrryyyk...', '...kyyrrrryyk...', '...krrrrrrrrk...',
        '...krrrrrrrrk...', '...kyyrrrryyk...', '...kyyyrryyYk...', '....kYYrrYYk....', '.....kkkkkk.....', '................', '................', '................'], { y: '#f7d64a', Y: '#c8a83a', r: '#e8463c', w: '#ffffff' });
    ART.lantern_post = paintSprite(10, 30, x => { x.fillStyle = '#6b4128'; x.fillRect(4, 8, 2, 22); x.fillStyle = '#e8463c'; x.fillRect(1, 2, 8, 7); x.fillStyle = '#f7d64a'; x.fillRect(3, 3, 4, 5); x.fillStyle = '#9a3a3a'; x.fillRect(1, 1, 8, 1); });
    /* a festival pole: striped, a gold knob on top for the bunting */
    ART.festpole = paintSprite(8, 36, x => { const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }; R('#c8a83a', 2, 0, 4, 4); R('#f7e08a', 3, 1, 1, 1); for (let j = 4; j < 34; j++) R(((j >> 2) % 2) ? '#fbf6ea' : '#e8463c', 3, j, 2, 1); R('#6b4128', 1, 33, 6, 3); });
    /* out of breath: a puff of breath and a drop of sweat */
    defSprite('bubble_puff', ['.kkkkkkk.', 'kwwwwwakk', 'kwkkwwaak', 'kwwwwwwwk', '.kkkwkkk.', '....k....'], { a: '#9fd4f0' });
}
CONTENT_INIT.push(initFestival);
