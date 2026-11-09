/* looking away from the game itself (the tab hidden): the whole island waits */
Story.hooks.away = [(ms) => {
    if (!World.map || !World.dot || (G.state !== 'play' && G.state !== 'talk') || ms < 4000) return;
    if (!Notebook.got.away) { Notebook.saw('away'); if (World.dot.map === World.map && !Cam.eye) bark(World.dot, 'Oh! You\'re back.', 3); }
}];
START.onContinue = (s) => {
    if (G.flags.ended) {
        Cam.eye = false; World.dot.hold = false;
        const days = Math.floor((Date.now() - (G.flags.endedAt || s.at)) / 86400000);
        const nights = days < 1 ? 'Not even a night' : days === 1 ? 'One night' : days + ' nights';
        setTimeout(() => say(`${nights} went by on Seldom while you were away. The light kept the hour.`, null, { name: false }), 600);
    }
};
