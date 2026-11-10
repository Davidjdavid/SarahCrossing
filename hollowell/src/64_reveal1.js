/* Reveal 1: the Houses are made. The Great Marionette's curtain comes down on Jory at the controls, and the
   rest of the Makers come out of the wings, covered in clay and river water and brass dust and feathers: the
   Houses are theirs, built new for every Wanderer and worked from underneath, a gift. The last part of a Wander
   is learning to make one. The Staff door at the Inn opens. ("Hints" become the Makers' nudges.) */

const Reveal1 = {
    *run(g) {
        const a = g.area, br = a.rooms.find(r => r.key === '1,0');
        const at = (x, y) => [br.x + x, br.y + y];
        Music.play('lullaby');
        const jory = a.add(new NPC(...at(9, 2), { who: 'jory', face: 'down' }));
        Fx.poof(jory.x * 1 + 8, jory.y + 8);
        yield 30;
        yield* say('jory', "Bother, bother, bother. Hold on. I'll come down. Mind the sandbags.");
        const cast = [['ives', 3, 5, 'right'], ['bram', 5, 4, 'right'], ['ambrose', 14, 4, 'left'], ['tess', 16, 5, 'left'], ['mallow', 12, 2, 'down']];
        for (const [who, x, y, f] of cast) { a.add(new NPC(...at(x, y), { who, face: f })); Sfx.play('step'); yield 14; }
        yield* say('ives', "Jory! You've dropped the whole— oh. Oh, she's looking right at us.");
        yield* say('bram', "HA! Well! That's torn it!");
        yield* say('ambrose', "Hello, love. Er. Surprise?");
        yield* say(null, "They shuffle into a line across the stage like a cast taking a bow: Ives with her feather duster, Bram up to the elbows in clay, your dad dripping, your mum glittering with brass dust, Doctor Mallow in his slippers. Nobody quite looks at you.");
        yield* say('tess', "We were going to tell you at the end, {name}. We always tell the Wanderer at the end. You're just... early.");
        yield* say('tess', "The Houses, love. We make them. We always have. Ives keeps the Tidyhouse, Bram the Kiln, your dad the Millrace, me the Belfry, Mallow the Slumberhouse, and Jory this old place.");
        yield* say('jory', "And the bosses. Mostly the bosses. Do you know how long the Kilnwyrm took? Three winters. The tail never did work properly.");
        yield* say('ambrose', "We take them down after every Wander and build them again for the next one. Every room. Every puzzle. Every crate that shivers before it goes home.");
        yield* say('ives', "We watch from underneath. There are little holes. And when you're stuck a long while, we nudge something. Just a little. Just so you'd find it yourself.");
        yield* say('bram', "The going-home, though: that's not us. Well, it IS us that keeps it running. Every mark's got a thread, and every thread goes down, and somebody's got to wind them all. Takes some winding!");
        yield* say('mallow', "*yawn* Which is why nobody in this valley ever gets any sleep in Wander season.");
        yield* say('tess', "It's a gift, {name}. The Wander. It's the best thing this town knows how to make, and every one of us had one, and now you've had yours. Well, nearly.");
        yield* say('jory', "Because here's the thing. The last part of a Wander isn't a House. It's the bit where you learn to make one. Come down and see.");
        yield* say('jory', "Under the Inn there's a door marked STAFF ONLY. It's open now. We'll be waiting for you below.");
        yield* say(null, "Then, all at the same moment, they look up, at nothing, the way people do when they think they've heard their name called from another room.");
        yield* say('tess', "...Tie your Knot, love. Gran'll want to hear all about it.");
        Progress.set('marionette_boss'); Progress.set('reveal1');
        for (const e of a.ents.slice()) if (e.kind === 'npc' && ['ives', 'bram', 'ambrose', 'tess', 'mallow', 'jory'].includes(e.who)) { Fx.poof(e.x + 8, e.y + 8); a.remove(e); }
        Sfx.play('appear');
        g.shutters(false);
        a.add(new Hoop(br.x + 15, br.y + 6));
        a.add(new Pickup((br.x + 4) * T, (br.y + 6) * T, { what: 'heartstitch', id: 'marionetteHeart' }));
        Music.play('marionette');
        Progress.setGoal('Tie the Dancing Knot. Then: the Inn in Hollowell, the door marked STAFF ONLY.');
        UI.toast("Hints (in Options) now come from the Makers themselves.", 200);
    },
};
{
    const prev = MarionetteHall.afterKnot;
    MarionetteHall.afterKnot = function* () {
        yield* prev.call(this);
        Progress.setGoal('Hollowell: the Inn, and the door marked STAFF ONLY. The Makers are waiting below.');
    };
}
