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
