/* the second act: the glasses. Where Dot's been (for hints), Ansel at home, Iris's ideas. */
Story.on('tick', () => {
    const d = World.dot; if (!d || !d.map || d.map.id !== 'island' || Cam.eye) return;
    const [x, y] = tileOf(d), F = G.flags;
    const mark = (f, r) => { if (!F[f] && inRect(x, y, r)) { F[f] = true; Save.soon(); } };
    mark('seenPasture', PASTURE);
    mark('woodsIn', { x: 27, y: 15, w: 8, h: 41 });
    mark('woodsB', { x: 4, y: 30, w: 21, h: 10 });
    mark('woodsC', { x: 4, y: 3, w: 21, h: 23 });
    mark('woodsE', { x: 4, y: 53, w: 21, h: 3 });
    mark('hollowIn', { x: 4, y: 57, w: 31, h: 3 });
    mark('hollowSouth', { x: 4, y: 62, w: 31, h: 14 });
    mark('capeIn', { x: 71, y: 3, w: 26, h: 22 });
    mark('ledge', { x: 65, y: 17, w: 2, h: 4 });
    /* the zone's name, as you come into it */
    for (const z of d.map.zones) if (z.name && inRect(x, y, z)) { UI.area(z.name); break; }
});
function actTwoHint() {
    const F = G.flags;
    if (!F.seenPasture && !F.loupe) return 'Pan\'s family always had one of the glasses, Ansel says. Over Bridget\'s bridge, east. His sheep have gone peculiar.';
    if (!F.loupe) return 'Pan\'s sheep can\'t bear to be out of sight. So the edge of what you see pushes them, doesn\'t it? Hold X to move the edge yourself, and let go to leave it there.';
    if (!F.quarry) return 'Lux guards the quarry gate. But he can only watch while he\'s being watched. Everybody can. Catch him at the far end of his walk, and look the other way.';
    if (!F.wideglass) {
        if (!F.quarryGate && !ent('stonegate').st.o) return 'The quarry gate\'s sand only runs while the hourglass is seen. Stand on the stone, look away from the sand... and keep looking away.';
        return 'Stillfall. The water only comes over while the spring at the top is seen. Hmm. What if you didn\'t look at the top?';
    }
    if (!F.woodsB) return 'Ruth from the woods came by. She says it isn\'t which way you face. Hold X and look past the trees as far as you can, let go, then walk away from them, out of the edge of the view.';
    if (!F.woodsE) return 'To get south through the woods you need a taller view than usual. Not the tallest, though. Something in between.';
    if (!F.hollowSouth) return 'The black brook in the Hollow. Pan\'s Nan said the ants build bridges. Look close enough, and they\'re there.';
    if (!F.prism && !Light.night()) return 'The Faded only come out at night. And night only comes while the Great Clock is watched... and then stays, as long as nobody looks at the Clock again.';
    if (!F.prism && !F.seenFaded) return 'The Hollow\'s chapel only opens at night, they say. Properly dark. And something keeps watch at its gate.';
    if (!F.prism) return 'Four in a line at the chapel gate? The old songs say there\'s only room for four in a line. The ones farthest from the middle flicker. Even you.';
    if (!F.wallBroken) return 'The foreman watched every block all the way down the chute from the top. If you could see that much at once...';
    if (!F.capeIn) return 'Mrs. Sepia said the old keepers never needed a boat. Cut the looking in two, and walk from one half to the other.';
    return 'The lighthouse, Dot. Bring it the glasses.';
}
function irisAside() {
    const F = G.flags;
    if (!F.curio_marble) return 'Leica sits by the little walled garden behind my observatory every day and whines. Nobody can get in there. Nobody our size.';
    return null;
}
async function actTwoAnsel(e) {
    const F = G.flags;
    const n = ['spyglass', 'loupe', 'wideglass', 'prism'].filter(k => F[k]).length;
    if (F.ended) { await say('The light\'s been going all night, every night. I sleep like a baby. First time in years.', 'ansel'); return; }
    if (n >= 4) { await say('All four! Then to the lighthouse with you, Dot. The cape, across the Gap. I\'ll be right behind you.', 'ansel'); return; }
    if (!e.st.told) {
        e.st.told = true;
        await say('Four glasses. The Spyglass, which you have. A loupe, for looking close. A wide glass, for looking far. And a prism, that cut the light in two.', 'ansel');
        await say('Pan\'s family had the loupe. The miners took the wide glass up the quarry. And the prism went south, through the woods, to the Hollow.', 'ansel');
        return;
    }
    await say(`${n} of the four glasses. Your great-great-grandfather would be proud. He was a bit odd about glass.`, 'ansel');
}
