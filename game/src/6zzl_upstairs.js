/* ---- 6zzl_upstairs.js ---- */
/* Up the stairs (David, 29 October): the windmill's ladder climbs to a room under the sails (just to look at: the big
   wooden gears turning, flour sacks, a window over the farm), and a "!" pops up over Sarah's head at a staircase or
   ladder that goes somewhere, as at a door (stairsNear, from nearDoor in 30_render.js). */
ROOMS.millloft = { w: 7, h: 4, wall: 'wall_stone', floor: 'floor_boards', music: 'house', name: 'Up in the windmill', exitTo: 'windmill', exitAt: [6, 0], building: 'windmill', build: a => buildMillLoft(a) };
ROOM_PLACE.millloft = 'up in the windmill';
const MILL_LOFT_LINES = {
    gear_wall: ['Up here the great wooden gears turn right overhead, slow and steady, creaking like a ship. The sails go round outside.', 'The main shaft comes through the wall from the sails and turns the big gear. Everything in the windmill starts right here.'],
    window_wall: ['Through the little window: the fields, the farmhouse roofs, the orchard, and the sea beyond. Steve the scarecrow is still waving.', 'The whole farm from up high. The goat looks very small. The goat would not like hearing that.'],
    flour_sacks: ['More flour sacks. The windmill makes a lot of flour. Ginger says "too much flour" is not a real problem.'],
    feed_sacks: ['Old sacks of grain waiting to go down the chute.'],
    hay_stack: ['A few bales stored up out of the rain. Somebody has made a cozy little nook between them.'],
};
function buildMillLoft(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['gear_wall', 2, 'wall'], ['window_wall', 5, 'wall'],
        ['flour_sacks', 0, 0], ['feed_sacks', 1, 0], ['hay_stack', 5, 0], ['rug_round', 2, 2], ['flour_sacks', 6, 2]]);
    for (const it of items) it.use = () => UI.say(null, rpick(MILL_LOFT_LINES[it.id] || ['The windmill creaks gently in the wind.']));
    a.items = items;
    placeFurniture(a, items);
}
async function climbMill() {
    Sfx.play('step');
    await goRoom('millloft', [3, 3], 'up');
}
/* a staircase or ladder in this room that goes somewhere, right in front of Sarah (she faces it) */
const STAIR_FURN = { lh_stairs: 'lighthouse', hayloft_ladder: 'windmill' };
function stairsNear(p) {
    const a = G.area;
    if (!a || !a.interior || p.dir !== 'up') return false;
    for (const e of a.ents) {
        if (!e.furn || !e.item || STAIR_FURN[e.item.id] !== a.id) continue;
        const it = e.item, F = furnWH(e.def, e.rot), row = e.def.kind === 'wall' ? a.floor.y0 : it.y + F.h;
        if (p.x / TILE > it.x - 0.2 && p.x / TILE < it.x + F.w + 0.2 && Math.abs(p.y / TILE - (row + 0.5)) < 0.75) return true;
    }
    return false;
}
