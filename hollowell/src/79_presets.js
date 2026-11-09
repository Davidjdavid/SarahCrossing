/* Presets: game states at the start of each stretch, for the debug panel and the tests. */
function presetBase(name = 'Wren') {
    Game.newGame(name, { skipIntro: true, area: 'gran_room', x: 6, y: 3 });
    Script.clear(); Dialog.active = false; UI.fadeA = 0; G.hideHud = false;
    for (const f of ['talkedGran', 'ceremony']) Progress.set(f);
    Inv.items.staff = 1;
}
PRESETS.afterD1 = () => {
    presetBase();
    Inv.giveTool('gloves'); Inv.knots.push('tidy'); Inv.addHeart();
    for (const f of ['d1', 'tidy_boss', 'gotGloves']) Progress.set(f);
    Progress.setGoal('Next, the Kiln in Kilnridge: the canyon road west of Meadowfold.');
    World.enter('hollow', TIDY_OUT.x, TIDY_OUT.y, { dir: DOWN });
};
PRESETS.afterD2 = () => {
    PRESETS.afterD1();
    Inv.giveTool('hook'); Inv.knots.push('kiln'); Inv.addHeart();
    for (const f of ['d2', 'kiln_boss', 'kilnPass', 'tagStopped']) Progress.set(f);
    Progress.setGoal('East: the broken bridge in Meadowfold, and Millwater beyond it.');
    World.enter('hollow', KILN_OUT.x, KILN_OUT.y, { dir: DOWN });
};
PRESETS.afterD3 = () => {
    PRESETS.afterD2();
    Inv.giveTool('paddle'); Inv.knots.push('mill'); Inv.addHeart();
    for (const f of ['d3', 'millrace_boss', 'millrace_snapjaw', 'met:ambrose']) Progress.set(f);
    Progress.setGoal('Next, Belfry Heights: across the lake from Millwater, up the cliff stair. (The Paddle will get you over.)');
    World.enter('hollow', MILL_OUT.x, MILL_OUT.y, { dir: DOWN });
};
PRESETS.afterD4 = () => {
    PRESETS.afterD3();
    Inv.giveTool('bell'); Inv.knots.push('belfry'); Inv.addHeart();
    for (const f of ['d4', 'belfry_boss', 'belfry_clangor', 'belfry_tollAwake', 'met:tess']) Progress.set(f);
    Progress.setGoal('Home to Hollowell: it is the Knotting Festival.');
    World.enter('hollow', BELFRY_OUT.x, BELFRY_OUT.y, { dir: DOWN });
};
PRESETS.afterD5 = () => {
    PRESETS.afterD4();
    for (const f of ['festival', 'giant_awake', 'giant_home', 'giant_seen', 'met:hettie']) Progress.set(f);
    Inv.giveTool('bedroll'); Inv.knots.push('slumber'); Inv.addHeart();
    for (const f of ['d5', 'slumber_boss', 'slumber_matron', 'slumber_slothAwake', 'bedroll_laid', 'bed_first']) Progress.set(f);
    Progress.setGoal('Home to Hollowell. (Somebody at the clinic will want to hear all about it.)');
    World.enter('hollow', SLUMBER_OUT.x, SLUMBER_OUT.y, { dir: DOWN });
};
PRESETS.afterD6 = () => {
    PRESETS.afterD5();
    for (const f of ['leapt', 'fair_gate', 'met:rook']) Progress.set(f);
    Inv.giveTool('crossbar'); Inv.knots.push('marionette'); Inv.addHeart();
    for (const f of ['d6', 'reveal1', 'marionette_boss', 'marionette_tin', 'marionette_tinAwake', 'marionette_gmAwake', 'crossbar_first', 'flat_first']) Progress.set(f);
    Progress.setGoal('Hollowell: the Inn, and the door marked STAFF ONLY. The Makers are waiting below.');
    World.enter('hollow', MARIONETTE_OUT.x, MARIONETTE_OUT.y, { dir: DOWN });
};
