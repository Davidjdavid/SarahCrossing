/* The kids' game in the square (S12, after the first Knot): "Housekeeper". Otto stands on a chalk X and
   tidies: move one of the two crates and he says "Tsk!", trots over to the side of it facing his X and yanks
   it home. Like the real one, if he's standing on its way home when he yanks, it bowls him over. */

class KidKeeper extends NPC {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ who: 'otto', face: 'left' }, p));
        this.paperHat = true;                  /* (his picture wears it too, while he's playing: src/35b_portraits.js) */
        this.weight = WEIGHT.light;            /* a yanked crate knocks him over; one going home by itself waits */
        this.hx = tx; this.hy = ty;
        this.state = 'home'; this.st = 0;
        this.free = true;                      /* his own mark walks with him: he goes home on his own legs */
        this.crates = p.crates || [];
    }
    tick() {
        super.tick();
        this.st++;
        if (this.state === 'down' || Script.running('talk')) return;
        switch (this.state) {
            case 'home': {
                if (this.path || this.mv) break;
                if (this.tx !== this.hx || this.ty !== this.hy) { this.walkTo(this.hx, this.hy, 2); break; }
                const c = this.mess();
                if (!c) { this.seen = null; this.bubble = null; this.dir = LEFT; break; }
                if (this.seen !== c) { this.seen = c; this.st = 0; this.bubble = 'bang'; Sfx.play('twang'); this.dir = dirOf(c.tx - this.tx, c.ty - this.ty); }
                else if (this.st > 24) { this.bubble = null; this.target = c; this.state = 'tidy'; this.st = 0; this.go(); }
                break;
            }
            case 'tidy': {
                const c = this.target;
                if (!c || !c.ret || c.ret.state === 'home' || c.carried || !this.inPlay(c)) { this.back(); break; }
                if (c.tx !== this.ctx || c.ty !== this.cty || (this.st % 20 === 0 && !this.mv)) this.go();   /* it moved, or a better spot came free */
                if (this.path || this.mv) break;
                if (Math.abs(c.tx - this.tx) + Math.abs(c.ty - this.ty) === 1) {
                    this.dir = dirOf(c.tx - this.tx, c.ty - this.ty);
                    if (c.mv || Return.held(c)) break;
                    Return.snap(c); Sfx.play('tug');
                    this.state = 'watch'; this.st = 0;
                }
                break;
            }
            case 'watch': if (this.st > 40) this.back(); break;
            case 'back':
                if (this.path || this.mv) break;
                if (this.tx === this.hx && this.ty === this.hy) { this.state = 'home'; this.st = 0; }
                else this.walkTo(this.hx, this.hy, 2);
                break;
        }
    }
    inPlay(c) { return c.tx >= 21 + 64 && c.tx <= 42 + 64 && c.ty >= 13 + 40 && c.ty <= 25 + 40; }
    mess() {
        for (const id of this.crates) {
            const c = this.area.find(id);
            if (c && c.ret && c.ret.state !== 'home' && !c.carried && !c.mv && !Return.held(c) && this.inPlay(c)) return c;
        }
        return null;
    }
    /* he always comes at it from the side facing his X (the nearest side that's free and reachable) */
    go() {
        const c = this.target; this.ctx = c.tx; this.cty = c.ty;
        const sides = [0, 1, 2, 3].map(d => [c.tx + DX[d], c.ty + DY[d]])
            .sort((a, b) => Math.hypot(a[0] - this.hx, a[1] - this.hy) - Math.hypot(b[0] - this.hx, b[1] - this.hy));
        for (const [nx, ny] of sides) {
            if (nx === this.tx && ny === this.ty) { this.path = null; this.walking = false; return; }
            if (!this.area.freeForThing(nx, ny, this)) continue;
            const p = findPath(this.area, this.tx, this.ty, nx, ny, this, 1500);
            if (p) { this.path = p; this.walking = p.length > 0; this.walkSpeed = 2; return; }
        }
        this.path = null; this.walking = false;          /* nowhere to stand: wait */
    }
    back() { this.state = 'back'; this.target = null; this.bubble = null; this.walkTo(this.hx, this.hy, 2); }
    shove(d, dur, by) {
        super.shove(d, dur, by);
        if (this.ret) { this.ret.mx = this.tx; this.ret.my = this.ty; this.ret.trace = [[this.tx, this.ty]]; this.ret.state = 'home'; }
        if (this.state === 'down') return;
        this.state = 'down'; this.path = null; this.walking = false; this.bubble = null;
        G.shake = 4; Sfx.play('hitthing');
        Stats.count('kidgame:won');
        Script.run(KidGame.won(this));
    }
    draw(cx, cy) {
        super.draw(cx, cy);
        if (this.state === 'down') return;
        /* a folded paper hat and a feather duster */
        const im = this.sprite(); if (!im) return;
        const sx = this.px - cx, top = this.py - cy - (im.height - T) - 2;
        Gfx.img(spr('kid_hat'), sx + 3, top - 3);
        if (this.state === 'watch' || this.state === 'tidy') Gfx.img(spr('kid_duster'), sx + (this.dir === LEFT ? -4 : 12), top + 6, this.dir === LEFT);
    }
}
SPAWN.kidkeeper = (x, y, p) => new KidKeeper(x, y, p);

const KidGame = {
    won(otto) {
        return function* () {
            yield 30;
            yield* say('otto', 'OOF! ...I got tidied! By my own tidying!');
            yield* say('nell', '{name} beat the Housekeeper! Nobody beats the Housekeeper!');
            yield* say('bea', "You get the badge. We made it ourselves. It's a button with a duster drawn on.");
            yield* Story.getItem('kidbadge')();
            Progress.set('s12');
            yield* say('otto', "Next time I'm being the Wanderer. You can be the Housekeeper. You're good at it. At knowing how it goes, I mean.");
        };
    },
};

ITEMS.kidbadge = { name: 'Playground badge', kind: 'keepsake', desc: "A button with a feather duster drawn on it in ink: the Hollowell kids' highest honour." };

TALK.otto = function* () {
    if ((yield* Favours.talk('otto')) || (yield* Town.news('otto'))) return;
    if (Progress.flag('s12')) { yield* say('otto', cycle('otto3', ["Rematch? ...No. My X is comfy.", "I'm going to be a Wanderer when I'm big. Or a Housekeeper. Whichever goes further.", "Bea says I fell over funny. I did not fall over funny."])); return; }
    if (Progress.flag('d1')) {
        if (Progress.flag('tagStopped')) { yield* say('otto', cycle('otto2', ["I'm the Housekeeper. I stand on my X. I like my X. Tsk.", "Move a crate, go on. I'll tidy it. I always tidy it."])); return; }
        yield* firstThen('otto', "I'm the Housekeeper! Tsk! TSK! Move anything in my square and I'll tidy it straight back where it goes!",
            ["Tsk! Tsk! (That's Housekeeper for 'hello'.)", "I can see the crates from my X. I can see EVERYTHING from my X.", "You can't beat the Housekeeper. The Housekeeper always tidies."]);
        return;
    }
    yield* say('otto', "I'm IT! Unless you're IT. Are you playing?");
};
TALK.nell = function* () {
    if ((yield* Favours.talk('nell')) || (yield* Town.news('nell'))) return;
    if (Progress.flag('s12')) { yield* say('nell', "You're the best Wanderer ever. Don't tell Gran I said."); return; }
    if (Progress.flag('d1')) {
        if (Progress.flag('tagStopped')) { yield* say('nell', cycle('nell2', ["We don't play tag any more. Housekeeper's better. You don't have to go anywhere.", "Otto's been the Housekeeper all week. Nobody's ever beaten him."])); return; }
        yield* firstThen('nell', "We're playing Housekeeper, like in the Tidyhouse! Otto's the Housekeeper. Nobody's ever beaten him.",
            ["You push a crate and he comes and tidies it. Every time. It's very annoying.", "If you beat him you get the badge. We made the badge."]);
        return;
    }
    yield* say('nell', "Can't talk! Otto's IT!");
};
TALK.bea = function* () {
    if ((yield* Favours.talk('bea')) || (yield* Town.news('bea'))) return;
    if (Progress.flag('s12')) { yield* say('bea', 'Look after the badge! It took three goes to draw the duster.'); return; }
    if (Progress.flag('d1')) {
        yield* firstThen('bea', "You beat the real one, didn't you? How? Did you hit it with your stick?",
            ["Otto always comes at things from his side. From his X. Always. He's very predictable.", "And he won't go round you. If you're in his way he just picks another side.", Progress.flag('tagStopped') ? "Feels like my feet like it here. Here here. This exact spot." : "I'm not playing. I'm the audience."]);
        return;
    }
    yield* say('bea', "You can't tag me, I'm on the well-step! The well-step is safe!");
};

function initKidGame() {
    defSprite('kid_hat', ['....kk....', '...kwwk...', '..kwwwwk..', '.kwwwwwwk.', 'kwwwwwwwwk', 'kkkkkkkkkk'], { w: '#fbf6ea' });
    defSprite('kid_duster', ['..kk..', '.kppk.', 'kppppk', '.kppk.', '..kb..', '..kb..', '..kb..', '...k..'], { p: '#f59ac0', b: '#9a6438' });
    defSprite('icon_kidbadge', ['................', '.....kkkkkk.....', '...kkyyyyyykk...', '..kyyYYYYYYyyk..', '..kyYYkkkkYYyk..', '.kyYYkppppkYYyk.', '.kyYYkppppkYYyk.', '.kyYYYkppkYYYyk.',
        '.kyYYYkbbkYYYyk.', '.kyYYYYkbkYYYyk.', '..kyYYYkbkYYyk..', '..kyyYYYkYYyyk..', '...kkyyyyyykk...', '.....kkkkkk.....', '................', '................'], { y: '#f7d64a', Y: '#e8b04a', p: '#f59ac0', b: '#9a6438' });
    ART.chalk_x = paintSprite(16, 16, x => {
        x.fillStyle = '#f4f0e8';
        for (let i = 2; i < 14; i++) { x.fillRect(i, i, 2, 1); x.fillRect(15 - i, i, 2, 1); }
    }, false);
}
CONTENT_INIT.push(initKidGame);
