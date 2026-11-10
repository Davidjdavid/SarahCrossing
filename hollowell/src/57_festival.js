/* The Knotting Festival: home after the fourth Knot, the square strung with bunting and the whole town out.
   Gran says a few words; four people arrive late, out of breath. And Returnball (S29): carry the ball
   through the rings, let it go, and it comes home back through them; a ring counts each time the ball
   passes it on its way home. All five in one go: a Heart Patch. */

/* the decorations, the court and the stage go into the town once the fourth Knot is tied */
{
    const hub = OW.blocks['1,1'];
    hub.ents.push(
        { k: 'deco', x: 22, y: 13, look: 'bunting', solid: false, baseY: -100, oy: -10, if: 'd4' },
        { k: 'deco', x: 30, y: 13, look: 'bunting', solid: false, baseY: -100, oy: -10, if: 'd4' },
        { k: 'deco', x: 38, y: 13, look: 'bunting', solid: false, baseY: -100, oy: -10, if: 'd4' },
        { k: 'deco', x: 22, y: 26, look: 'bunting', solid: false, baseY: -100, oy: -4, if: 'd4' },
        { k: 'deco', x: 38, y: 26, look: 'bunting', solid: false, baseY: -100, oy: -4, if: 'd4' },
        { k: 'deco', x: 27, y: 16, look: 'lantern_post', solid: [[0, 0]], oy: -14, if: 'd4' },
        { k: 'deco', x: 34, y: 16, look: 'lantern_post', solid: [[0, 0]], oy: -14, if: 'd4' },
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
                yield* say('pip', 'FIVE! All five! Nobody gets five! Here, it\'s the prize, it\'s a Heart Patch, Mum sewed it!');
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
    *scene() {
        Music.play('festival');
        yield* say(null, 'The square is strung with bunting, there are lanterns on every lamp, and the whole of Hollowell is out.');
        yield* say('gran', "There she is! Four Knots! Only two to go, love. The town's put on the Knotting Festival for you, the way it always does for the Wanderer.");
        yield* say(null, 'Just then four people come hurrying into the square from four different directions, out of breath: Ives, Bram, your dad and your mum.');
        yield* say(null, "Bram has clay up to his elbows. Your dad's sleeves are soaked to the shoulder. Your mum's hair is full of brass dust. Ives has a feather duster sticking out of her apron pocket.");
        yield* say('tess', 'Sorry! Sorry. Busy day.');
        yield* say('ambrose', 'Very busy.');
        yield* say('bram', "Pots don't make themselves! HA!");
        yield* say('ives', '...Tidying.');
        yield* say('gran', "Well, you're here now. All of you. Music!");
        yield* say('gran', "And {name}: when you've eaten something, there's the east road. The old giant's been asleep across it since before I was born. You've a bell now, haven't you?");
        Progress.setGoal('The east road out of town: the sleeping giant. Ring the Recall Bell at it.');
        yield* say('pip', "And Returnball! By the bakery! Nobody's ever got five!");
    },
};
{
    const prev = Story.tick;
    Story.tick = a => { if (prev) prev(a); Festival.tick(a); };
}

function initFestival() {
    defSprite('rball', ['................', '................', '................', '.....kkkkkk.....', '....kyyrryyk....', '...kyywrryyyk...', '...kyyrrrryyk...', '...krrrrrrrrk...',
        '...krrrrrrrrk...', '...kyyrrrryyk...', '...kyyyrryyYk...', '....kYYrrYYk....', '.....kkkkkk.....', '................', '................', '................'], { y: '#f7d64a', Y: '#c8a83a', r: '#e8463c', w: '#ffffff' });
    ART.bunting = paintSprite(48, 12, x => {
        x.fillStyle = '#6b4128'; for (let i = 0; i < 48; i++) x.fillRect(i, Math.round(2 + Math.sin(i / 48 * Math.PI) * 3), 1, 1);
        const cols = ['#e8463c', '#f7d64a', '#4f9be0', '#3fc1b5', '#f59ac0', '#e0913a'];
        for (let i = 0; i < 6; i++) { const cx = 4 + i * 8, cy = Math.round(3 + Math.sin(cx / 48 * Math.PI) * 3); x.fillStyle = cols[i]; for (let j = 0; j < 5; j++) x.fillRect(cx - 2 + Math.floor(j / 2), cy + j, 5 - j, 1); }
    }, false);
    ART.lantern_post = paintSprite(10, 30, x => { x.fillStyle = '#6b4128'; x.fillRect(4, 8, 2, 22); x.fillStyle = '#e8463c'; x.fillRect(1, 2, 8, 7); x.fillStyle = '#f7d64a'; x.fillRect(3, 3, 4, 5); x.fillStyle = '#9a3a3a'; x.fillRect(1, 1, 8, 1); });
}
CONTENT_INIT.push(initFestival);
