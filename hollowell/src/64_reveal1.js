/* Reveal 1: the Houses are made. The Great Marionette folds up and the curtain comes down on it in a heap; up in the
   flies, at the end of a dozen strings, Jory dangles in a bosun's chair, and comes down. The rest of the Makers come
   out of the wings, covered in clay and river water and brass dust and feathers, and shuffle into a line. Then you walk
   the stage and hear each of them out, in any order: their House, and their bit of how it's done. When all six have
   had their say, they tell you where to go next, and the Staff door at the Inn opens. ("Hints" become the Makers'
   nudges.) */

/* where each Maker stands in the line, what they carry (drawn: MakerProps, src/57_festival.js), and their bit */
const R1_LINE = { ives: [2, 7], bram: [4, 7], ambrose: [6, 7], tess: [13, 7], mallow: [15, 7], jory: [17, 7] };
const R1_PROP = { ives: 'duster', bram: 'clay', ambrose: 'wet', tess: 'brass', mallow: 'lamp', jory: 'crossbar' };
const R1_SAYS = {
    ives: "{happy}The Tidyhouse is mine. We watch from underneath, love: there are little holes. When you're stuck a long while, we nudge something. Just a little, so you'd find it yourself.",
    bram: "{happy}The Kiln's mine! And the going-home? Not us. Well, it IS us that keeps it running: every mark's got a thread, every thread goes down, and somebody winds them all. HA!",
    ambrose: "{happy}The Millrace is mine, love. After every Wander we take them down and build them again. Every room. Every puzzle. Every crate that shivers before it goes home.",
    tess: "{happy}The Belfry's mine. It's a gift, {name}, the Wander. Every one of us had one, and now you've had yours. Well, nearly.",
    mallow: "Yaaawn. The Slumberhouse. Mine. And all that winding goes on at night, mostly. Which is why nobody in this valley ever gets any sleep in Wander season.",
    jory: "{happy}This old place is mine. And the bosses. Mostly the bosses. Do you know how long the Kilnwyrm took? Three winters. The tail never did work properly.",
};

const Reveal1 = {
    heard: null, g: null, rig: null,
    /* the Great Marionette down: the curtain comes down on it, WHUMP; a voice from the flies; Jory, coming down */
    *curtain(g) {
        const a = g.area, br = a.rooms.find(r => r.key === '1,0'), p = G.player;
        const L = (x, y) => [(br.x + x) * T, (br.y + y) * T];
        Music.play('silence');
        G.hideHud = true;
        const rig = this.rig = a.add(new StageRig(br));
        yield 40;
        for (let i = 0; i < 26; i++) { rig.drop++; yield 1; }
        G.shake = 12; Sfx.play('land'); Sfx.play('rumble');
        for (let i = 0; i < 7; i++) Fx.dust(L(6.5, 0)[0] + i * 16, L(0, 7)[1]);
        for (let i = 0; i < 26; i++) { rig.drop++; yield 1; }
        yield 50;
        const t = Fx.text(L(9.5, 0)[0] + 8, L(0, 2)[1], 'Oh, BOTHER.', '#fbf6ea'); t.life = 120; t.vy = -0.1;
        yield 80;
        /* up in the flies, on a bosun's chair, with the crossbar he works it by: as big as a door, a dozen strings off it */
        rig.chair = { y: -70, to: 34 };
        for (let i = 0; i < 160 && rig.chair.y < rig.chair.to; i++) { rig.chair.y = Math.min(rig.chair.to, rig.chair.y + 1.4); yield 1; }
        p.dir = UP;
        yield 20;
        yield* say(null, "It's Jory up there. Jory the toymaker, who sold you a spinning top for your sixth birthday.", { focus: [br.x + 17, br.y + 3] });
        yield* say('jory', "{worried}Ah. Hello, {name}. This is... awkward. I'd prepared a much better ending. There were going to be fireworks. Hold on. I'll come down.", { focus: [br.x + 17, br.y + 3] });
        rig.chair.to = 100;
        for (let i = 0; i < 160 && rig.chair.y < rig.chair.to; i++) { rig.chair.y = Math.min(rig.chair.to, rig.chair.y + 1.2); yield 1; }
        Sfx.play('land'); Fx.dust(L(17.5, 0)[0], L(0, 7)[1] + 12);
        yield 16;
        const jory = a.add(new NPC(br.x + R1_LINE.jory[0], br.y + R1_LINE.jory[1], { who: 'jory', face: 'left', marked: false }));
        jory.prop = 'crossbar'; jory.free = true;
        rig.chair.empty = true; rig.chair.to = -80;
        yield* Reveal1.run(g);
    },
    /* the rest of the Makers out of the wings, into a line; then the stage is yours */
    *run(g) {
        const a = g.area, br = a.rooms.find(r => r.key === '1,0'), rig = this.rig;
        this.g = g; this.heard = new Set();
        const go = (n, tx, ty, sp) => { n.goal = [br.x + tx, br.y + ty, sp]; n.stuck = 0; n.walkTo(br.x + tx, br.y + ty, sp); };
        const out = (who, x, y, tx, ty) => {
            const n = a.add(new NPC(br.x + x, br.y + y, { who, face: x < 10 ? 'right' : 'left', marked: false }));
            n.prop = R1_PROP[who]; n.free = true; go(n, tx, ty, 0.9); Sfx.play('step');
            return n;
        };
        /* (wait for them to get where they're going; one held up by another finds a way round, and nobody's left behind) */
        const settle = function* (ns, max = 150) {
            const there = n => n.tx === n.goal[0] && n.ty === n.goal[1] && !n.mv;
            for (let i = 0; i < max && !ns.every(there); i++) {
                for (const n of ns) if (!there(n) && !n.mv && ++n.stuck > 20) { n.stuck = 0; n.walkTo(...n.goal); }
                if (rig.chair) rig.chair.y = Math.max(rig.chair.to, rig.chair.y - 1.5);
                yield 1;
            }
            for (const n of ns) if (!there(n) && !a.at(n.goal[0], n.goal[1])) { a.unplace(n, n.tx, n.ty); n.mv = null; n.path = null; n.walking = false; n.tx = n.goal[0]; n.ty = n.goal[1]; n.x = n.tx * T; n.y = n.ty * T; a.place(n, n.tx, n.ty); }
        };
        const ives = out('ives', 1, 5, 3, 5);
        yield* settle([ives]);
        ives.dir = RIGHT;
        yield* say('ives', "{surprised}Jory! You've dropped the whole— oh. Oh, she's looking right at us.");
        /* (a step along from her, not in file behind her, and turned to you to say it) */
        const bram = out('bram', 1, 4, 4, 4);
        yield* settle([bram]);
        bram.dir = DOWN;
        yield* say('bram', "{happy}HA! Well! That's torn it!");
        const dad = out('ambrose', 1, 6, 4, 6);
        yield* settle([dad]);
        yield* say('ambrose', "{worried}Hello, love. Er. Surprise?");
        const mum = out('tess', 18, 5, 15, 5), mallow = out('mallow', 18, 4, 16, 4);
        yield* settle([mum, mallow]);
        rig.chair = null;
        /* they shuffle into a line across the stage like a cast taking a bow, and nobody quite looks at you */
        const cast = [ives, bram, dad, mum, mallow, a.ents.find(e => e.who === 'jory' && e.kind === 'npc')].filter(Boolean);
        for (const n of cast) go(n, R1_LINE[n.who][0], R1_LINE[n.who][1], 0.7);
        yield* settle(cast, 240);
        for (const n of cast) { n.dir = DOWN; n.fixedFace = true; }
        yield 40;
        /* (each glancing off to one side: a back turned in a line-up read as a Maker saying his piece to the wall) */
        const away = { ives: LEFT, bram: RIGHT, ambrose: RIGHT, tess: LEFT, mallow: LEFT, jory: RIGHT };
        for (const n of cast) n.dir = away[n.who];
        yield 30;
        mum.fixedFace = false;
        yield* say('tess', "{worried}We were going to tell you at the end, {name}. We always tell the Wanderer at the end. You're just... early. The Houses, love: we make them. We always have.");
        /* yours to walk the stage and hear each of them out */
        for (const n of cast) { n.r1 = true; n.fixedFace = false; n.bubble = 'dots'; n.dir = DOWN; }
        Progress.setGoal('The Makers, lined up on the stage: hear each of them out (0 of 6).');
        G.hideHud = false;
        Music.play('lullaby');
    },
    /* one Maker's bit; once all six have had their say, the end of it */
    *talk(n) {
        yield* say(n.who, R1_SAYS[n.who]);
        if (!this.heard || this.heard.has(n.who)) return;
        this.heard.add(n.who); n.bubble = null;
        const k = this.heard.size;
        if (k < 6) { Progress.setGoal(`The Makers, lined up on the stage: hear each of them out (${k} of 6).`); return; }
        yield* this.finish(this.g);
    },
    *finish(g) {
        const a = g.area, br = a.rooms.find(r => r.key === '1,0');
        const cast = a.ents.filter(e => e.kind === 'npc' && e.r1);
        G.hideHud = true;
        yield 20;
        yield* say('jory', "{happy}Here's the thing. The last part of a Wander isn't a House: it's learning to make one. Under the Inn there's a door marked STAFF ONLY. It's open now. Come down and see.");
        /* and all at once they look up */
        for (const n of cast) { n.dir = UP; n.fixedFace = true; }
        Music.play('silence');
        yield 50;
        yield* say(null, "Then, all at the same moment, they look up, at nothing, the way people do when they think they've heard their name called from another room.");
        const mum = cast.find(e => e.who === 'tess'); if (mum) mum.fixedFace = false;
        yield* say('tess', "{worried}...Tie your Knot, love. Gran'll want to hear all about it.");
        Progress.set('marionette_boss'); Progress.set('reveal1');
        /* off into the wings, the way they came */
        for (const n of cast) { n.fixedFace = false; n.r1 = false; n.walkTo(n.tx < br.x + 10 ? br.x + 1 : br.x + 18, n.ty - 2, 1); }
        for (let i = 0; i < 150 && cast.some(n => !n.removed); i++) {
            for (const n of cast) if (!n.removed && !n.mv && !n.walking) { if (n.tx !== br.x + 1 && n.tx !== br.x + 18) Fx.poof(n.px + 8, n.py + 8); a.remove(n); }
            yield 1;
        }
        for (const n of cast) if (!n.removed) { Fx.poof(n.px + 8, n.py + 8); a.remove(n); }
        Sfx.play('appear');
        g.shutters(false);
        a.add(new Hoop(br.x + 15, br.y + 6));
        a.add(new Pickup((br.x + 4) * T, (br.y + 6) * T, { what: 'heartstitch', id: 'marionetteHeart' }));
        Music.play('marionette');
        Progress.setGoal('Tie the Dancing Knot. Then: the Inn in Hollowell, the door marked STAFF ONLY.');
        G.hideHud = false;
        UI.toast("Hints (in Options) now come from the Makers themselves.", 200);
    },
};
MarionetteFoes.curtain = function* (g) { yield* Reveal1.curtain(g); };
{
    const talk0 = Story.talk;
    Story.talk = function (npc) { if (npc.r1) return () => Reveal1.talk(npc); return talk0.call(this, npc); };
}

/* the stage, after: the curtain coming down on the Great Marionette and lying on it in a great red heap (its wooden
   boots sticking out from under), the wings' drapes either side for the Makers to come out of, and Jory's bosun's
   chair on its ropes, the crossbar in his hands and its strings hanging slack */
class StageRig extends Ent {
    constructor(r) { super('stagerig'); this.r = r; this.x = (r.x + 10) * T; this.y = (r.y + 6) * T; this.drop = 0; this.chair = null; this.t = 0; }
    get sortY() { return this.r.y * T + 120; }
    /* (only people are kept off the heap: a little wooden Wren coming home goes under it) */
    blocks(x, y, who) { return this.drop >= 26 && !!who && (who === G.player || who.kind === 'npc') && y >= this.r.y + 4 && y <= this.r.y + 6 && x >= this.r.x + 7 && x <= this.r.x + 12; }
    update() { this.t++; }
    draw(cx, cy) {
        const X = this.r.x * T - cx, Y = this.r.y * T - cy, d = this.drop;
        if (d < 30 && ART.gm_down) Gfx.img(ART.gm_down, X + 104, Y + 68);
        /* falling: the whole drape, folds and gold fringe, coming down faster and faster */
        if (d > 0 && d < 52) {
            const k = Math.min(1, d / 26), e = k * k, bot = Math.round(-20 + 132 * e), hgt = d <= 26 ? 84 : Math.round(84 - (d - 26) * 1.7);
            if (d > 26) Gfx.alpha(Math.max(0, 1 - (d - 26) / 26));
            StageRig.drape(X + 96, Y + bot - hgt, 112, hgt);
            Gfx.alpha(1);
        }
        if (d > 26 && ART.curtain_heap) { Gfx.alpha(Math.min(1, (d - 26) / 20)); Gfx.img(ART.curtain_heap, X + 92, Y + 62); Gfx.alpha(1); }
        /* the wings: a drape either side of the stage */
        const wa = Math.min(1, d / 40);
        if (wa > 0) { Gfx.alpha(wa); StageRig.drape(X + 16, Y + 14, 12, 118, true); StageRig.drape(X + 292, Y + 14, 12, 118, true); Gfx.alpha(1); }
        const c = this.chair; if (c) StageRig.chairAt(X + 17 * T + 8, Y + Math.round(c.y), c.empty, this.t, X + 152, Y + 74);
    }
    /* a hanging drape: deep folds, lit along one side of each, a gold fringe along its foot (wings: a tie-back) */
    static drape(x, y, w, h, wing) {
        Gfx.rect(x - 1, y, w + 2, h + 1, PAL.ink);
        for (let i = 0; i < w; i++) { const f = i % 8; Gfx.rect(x + i, y, 1, h, f < 2 ? '#7a1428' : f < 5 ? '#a8203a' : f < 7 ? '#c42b4a' : '#e04a5a'); }
        if (wing) { Gfx.rect(x, y + 74, w, 2, '#c9a24a'); Gfx.rect(x + w - 3, y + 72, 3, 6, '#f7d64a'); return; }
        Gfx.rect(x - 1, y - 2, w + 2, 3, '#c9a24a'); Gfx.rect(x - 1, y - 2, w + 2, 1, '#f7e08a');
        for (let i = 0; i < w; i++) Gfx.rect(x + i, y + h - 3, 1, i % 3 ? 3 : 4, i % 2 ? '#f7d64a' : '#c8a83a');
    }
    /* the bosun's chair: two ropes up out of sight, a plank seat, Jory on it with the crossbar across his knees and a
       dozen strings hanging off it (slack, down to the heap, while he's up there); empty, it goes back up */
    static chairAt(x, y, empty, t, hx, hy) {
        Gfx.line(x - 10, -2, x - 10, y, '#cfc6b8'); Gfx.line(x + 10, -2, x + 10, y, '#cfc6b8');
        if (!empty) {
            const im = personFrame('jory', DOWN, 0);
            if (im) Gfx.sub(im, 0, 0, 16, 14, x - 8, y - 13);
            /* the crossbar, as big as a door: a long bar and a cross-piece, a string off every peg */
            for (let i = 0; i < 12; i++) {
                const sx = x - 22 + i * 4, sag = 10 + (i % 3) * 4;
                if (y < hy - 30) { const mx = (sx + hx - 40 + i * 7) / 2, my = (y + hy) / 2 + sag; Gfx.line(sx, y + 1, mx, my, '#cfc6b8'); Gfx.line(mx, my, hx - 40 + i * 7, hy, '#cfc6b8'); }
                else Gfx.line(sx, y + 1, sx + (i % 2 ? 1 : -1), y + 7 + (i % 4), '#cfc6b8');
            }
            Gfx.rect(x - 24, y - 2, 48, 5, PAL.ink); Gfx.rect(x - 23, y - 1, 46, 3, '#9a6438'); Gfx.rect(x - 23, y - 1, 46, 1, '#c9925a');
            Gfx.rect(x - 2, y - 7, 5, 14, PAL.ink); Gfx.rect(x - 1, y - 6, 3, 12, '#9a6438'); Gfx.rect(x - 1, y - 6, 1, 12, '#c9925a');
        }
        Gfx.rect(x - 12, y + 1, 24, 5, PAL.ink); Gfx.rect(x - 11, y + 2, 22, 3, '#9a6438'); Gfx.rect(x - 11, y + 2, 22, 1, '#e6c08a');
    }
}

/* the heap stays where it fell: the stage after the Reveal */
AREAS.marionette.ents.push({ k: 'deco', x: 20 + 6, y: 0 + 4, look: 'curtain_heap', solid: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 2], [2, 2], [4, 2], [5, 2], [6, 2]], ox: -4, oy: -2, baseY: 58, if: 'reveal1' });
/* (not over the little wooden Wren's own spot, where she goes home to, under it) */

{
    const prev = MarionetteHall.afterKnot;
    MarionetteHall.afterKnot = function* () {
        /* up in the flies, six faces you know, looking down, crying very quietly */
        const a = G.map, r = a.rooms.find(q => q.key === '1,0'), peek = r ? a.add(new FliesPeek(r)) : null, hud = G.hideHud;
        G.hideHud = true;
        yield* prev.call(this);
        if (peek) a.remove(peek);
        G.hideHud = hud;
        Progress.setGoal('Hollowell: the Inn, and the door marked STAFF ONLY. The Makers are waiting below.');
    };
}
class FliesPeek extends Ent {
    constructor(r) { super('fliespeek'); this.r = r; this.x = (r.x + 10) * T; this.y = r.y * T; this.t = 0; }
    get sortY() { return 1e9; }
    update() { this.t++; }
    draw(cx, cy) {
        ['ives', 'bram', 'ambrose', 'tess', 'mallow', 'jory'].forEach((who, i) => {
            const im = personFrame(who, DOWN, 0); if (!im) return;
            const x = (this.r.x + [4, 6, 8, 11, 13, 15][i]) * T - cx, y = this.r.y * T - cy + 6 + Math.round(Math.sin(this.t / 30 + i) * 0.6);
            Gfx.sub(im, 0, 0, 16, 10, x, y);
            if ((this.t + i * 11) % 40 < 22) Gfx.rect(x + 4 + (i % 2) * 7, y + 9 + ((this.t + i * 11) % 40 >> 2), 1, 2, '#9fd4f0');
        });
        Gfx.rect(this.r.x * T - cx + 16, this.r.y * T - cy + 15, 288, 2, '#3a0a16');
    }
}

function initReveal1() {
    /* the curtain in a heap: folds of red velvet piled up, its gold fringe tumbled round the foot, the marionette's wooden
       boots poking out from under it */
    ART.curtain_heap = paintSprite(120, 58, x => {
        const boot = (bx, by, flip) => stampPx(x, ['..kkkk..', '.kbubBk.', 'kbuubbBk', 'kbbbbbBk', 'kSSSSSSk', '.kkkkkk.'].map(r => flip ? r.split('').reverse().join('') : r), { k: PAL.ink, b: '#7a4a2c', B: '#5a341e', u: '#9a6a44', S: '#45281c' }, bx, by);
        boot(14, 50, false); boot(98, 50, true);
        const lumps = [[30, 38, 17], [60, 30, 22], [90, 38, 17], [44, 24, 13], [76, 24, 13], [60, 16, 10], [18, 46, 9], [102, 46, 9]];
        for (const [cx, cy, r] of lumps) discPx(x, cx, cy, r, (px, py, u, v) => {
            if (py > 52) return null;
            const fold = Math.sin(px / 3.2 + py / 9) * 0.35, l = -u * 0.45 - v * 0.7 + fold + (hash2(px, py, 81) - 0.5) * 0.2;
            return l > 0.55 ? '#e04a5a' : l > 0.1 ? '#c42b4a' : l > -0.45 ? '#a8203a' : '#7a1428';
        });
        /* the gold fringe, round the foot of the pile */
        for (let i = 4; i < 116; i++) {
            let y = 51; while (y > 0 && !x.getImageData(i, y, 1, 1).data[3]) y--;
            if (y < 30) continue;
            x.fillStyle = i % 2 ? '#f7d64a' : '#c8a83a'; x.fillRect(i, y, 1, i % 3 ? 2 : 3);
        }
        /* a tassel or two, and the rod it hung from, sticking out of the top */
        x.fillStyle = '#c9a24a'; x.fillRect(54, 4, 26, 2); x.fillStyle = '#f7e08a'; x.fillRect(54, 4, 26, 1);
        x.fillStyle = '#f7d64a'; x.fillRect(36, 20, 2, 4); x.fillRect(84, 22, 2, 4);
    });
}
CONTENT_INIT.push(initReveal1);
