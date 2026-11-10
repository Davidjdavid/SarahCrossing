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
PRESETS.afterD7 = () => {
    PRESETS.afterD6();
    Inv.giveTool('needle'); Inv.addHeart(); Progress.setAreaFlag('spoolworks', 'got:spoolHeart');
    for (const f of ['d7', 'spool_boss', 'spool_cog', 'met_gundry_below', 'underside_first', 'needle_first', 'hatch_down', 'hatch_up', 'tug_first', 'knot_first', 'tangle_open']) Progress.set(f);
    Progress.setGoal('Up to the Guild Hall, under the Inn: Gundry has a job for you.');
    World.enter('underside', 29, 4, { dir: DOWN });
};
PRESETS.afterMakings = () => {
    PRESETS.afterD7();
    for (const f of ['gundry_job', 'making1', 'making2', 'making3', 'makings_done']) Progress.set(f);
    for (const n of [1, 2, 3]) Progress.set('making' + n + '_ahas', 3);
    Progress.setGoal("The Way Down, off the Making Floor: fetch Tuck's fresh spool from the deep store.");
    World.enter('underside', 49, 5, { dir: DOWN });
};
PRESETS.afterReveal2 = () => {
    PRESETS.afterMakings();
    for (const f of ['reveal2', 'well_locked']) Progress.set(f);
    Inv.items.tuckspool = 1;
    Progress.setGoal("Linnet cut herself loose with the First Spinner's Shears, from the old Loom. Gundry, under the Inn, may know where that is.");
    World.enter('gran_room', 4, 3, { dir: DOWN });
};
PRESETS.afterD8 = () => {
    PRESETS.afterReveal2();
    for (const f of ['gundry_r2', 'north_gate', 'north_gate_seen', 'loom_shuttle', 'loom_boss', 'd8', 'cut_first', 'silk_bound', 'weaver_down', 'shuttle_jam']) Progress.set(f);
    Inv.giveTool('shears'); Inv.addHeart(); Progress.setAreaFlag('loom', 'got:loomHeart');
    Progress.setGoal("The Shears can cut anyone free. The town, first? And then the fog at the Frayed Edge, and your own thread.");
    World.enter('hollow', LOOM_OUT.x, LOOM_OUT.y, { dir: DOWN });
};
