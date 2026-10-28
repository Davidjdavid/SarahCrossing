/* ---------------------------------------------------------------- furniture that does something (David's list, 28 October:
   "a TV switches on to static...") A retro TV and a record player (furn_k.py), sold at IslandMart like any piece, in their
   woods (PAINT_TABLE): a tap at home switches either on or off (it.play, kept with the house; off as it arrives; it.on is
   already what a thing on a table stands on). In the new
   look the TV's screen shows static while it's on and dark glass while it's off (EnvRoom.drawScreen), and the record
   turns about the piece's middle (EnvRoom.animate, its *_move part). Their flat pictures are rendered from the models
   (furniture.py --batch furn_k --sprites, tools/sprites_to_atlas.py --add). */
const ACTING_FURN = { tv_retro: ['Retro TV', 3200], record_player: ['Record player', 2800] };
for (const [id, [name, price]] of Object.entries(ACTING_FURN)) {
    ITEMS[id] = { name, type: 'furniture', price, icon: 'f_' + id };
    FURN[id] = { id, name, w: 1, h: 1, kind: 'floor', price, sets: ['cottage'], switch: true };
}
/* a tap at home: on or off (from useFurniture, 25_house.js) */
function furnSwitch(e) {
    const d = e.def, it = e.item;
    if (!d || !it || !FURN[d.base || d.id] || !FURN[d.base || d.id].switch) return false;
    if (it.play) delete it.play; else it.play = true;
    Sfx.ui(it.play ? 'open' : 'close');
    // (the TV's hiss of static, the record's first few notes)
    if (it.play) { if ((d.base || d.id) === 'tv_retro') Sfx.noise(0.35, 3200, 0.05, 0, 'highpass'); else Sfx.notes([72, 76, 79, 76, 72], 'kalimba', 0.12, 0.14); }
    Save.touch();
    return true;
}
/* a tap gives the globe a spin, slowing to a stop (EnvRoom.animate; the flat views can't turn it, so Sarah says so) */
function globeSpin(e) {
    const d = e.def;
    if (!d || (d.base || d.id) !== 'globe') return false;
    e.spinT = G.t;
    Sfx.notes([60, 64, 67], 'kalimba', 0.06, 0.1);
    const shown = typeof EnvRoom !== 'undefined' && EnvRoom.built && (EnvRoom.built.movers || []).some(m => m.e === e);
    if (!shown) UI.say(null, rpick(['Sarah gives the globe a spin. It stops with her finger in the middle of an ocean. Most of the world is ocean, to be fair.',
        'The globe spins and spins. Sarah stops it on a tiny island. It looks a lot like this one.']));
    return true;
}
/* is this placed piece switched on */
function furnOn(e) { return !!(e && e.item && e.item.play); }
/* the TV's screen in the new look: static while it's on (snow, a rolling bar), dark glass with a glint while it's off */
function tvScreen(g, W, H, on) {
    if (!on) {
        const grd = g.createLinearGradient(0, 0, W, H);
        grd.addColorStop(0, '#2c3038'); grd.addColorStop(1, '#14161c');
        g.fillStyle = grd; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(W * 0.12, H * 0.14, W * 0.22, H * 0.08);
        return;
    }
    const img = g.createImageData(W, H), d = img.data, bar = (G.t * 0.6) % (H + 12) - 6;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = (Math.random() * 200 + 40) * (Math.abs(y - bar) < 4 ? 1.15 : 0.92), i = (y * W + x) * 4;
        d[i] = v; d[i + 1] = v; d[i + 2] = v * 1.05; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
}
