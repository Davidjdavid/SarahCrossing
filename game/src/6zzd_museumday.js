/* ---- 6zzd_museumday.js ---- */
/* Museum Day's stamp rally (the roadmap's holidays with things to do; Animal Crossing's Museum Day): on 18 May a stamp
   stand stands just inside each of the museum's six wings (furn_stamp_stand, furn_k.py); a tap stamps Sarah's card for
   that wing, and with all six, Brulee at the museum has a prize for her: one of the museum's own pieces, to be had
   nowhere else (a velvet rope, then a pedestal, then a gallery bench, a year at a time). Kept as S.stamps { day, got:
   the wings stamped that day, prize: the day it was given, n: prizes in all }. */
const STAMP_PRIZES = ['velvet_rope', 'pedestal', 'museum_bench'];
function stamps() {
    const day = Clock.dayNum();
    if (!S.stamps || S.stamps.day !== day) S.stamps = { day, got: [], prize: null, n: (S.stamps && S.stamps.n) || 0 };
    return S.stamps;
}
/* a wing's stand, just inside its door, on Museum Day (each wing's build is wrapped below; rooms are built again each day) */
function stampStand(a, W) {
    if (!isHoliday('museumday')) return null;
    const f = a.floor, dx = a.doorTile[0], y = f.y0 + f.h - 1;
    for (const x of [dx - 2, dx + 2, dx - 3, dx + 3]) {
        if (x < f.x0 || x >= f.x0 + f.w || a.blockedAt(x, y)) continue;
        const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 1, stamp: W.id });
        e.draw = ctx => spr(ctx, 'f_stamp_stand', e.x, e.y);
        e.look3d = { model: 'furn_stamp_stand' };
        e.hit = { x: x * TILE, y: y * TILE - 16, w: TILE, h: 2 * TILE };
        e.interact = () => stampWing(W);
        a.block(x, y, 1);
        return e;
    }
    return null;
}
async function stampWing(W) {
    const T = stamps(), all = MUSEUM_WINGS.length;
    if (T.got.includes(W.id)) { await UI.say(null, `Sarah's card already has the ${W.name} stamp. ${T.got.length} of ${all}.`); return; }
    T.got.push(W.id);
    Sfx.play('item');
    G.player.pose = 'pick'; G.player.poseT = 20;
    Save.touch();
    UI.toast(`Stamped: ${W.name} (${T.got.length} of ${all})`, W.icon);
    if (T.got.length === all) await UI.say(null, ["Thunk! Sarah's stamp card is full. Every wing!", 'Brulee at the front desk will want to see this.']);
}
/* Brulee's talk menu that day, at the museum: how the card's going, and the prize for a full one */
function stampOptions(n) {
    if (n.id !== 'brulee' || !isHoliday('museumday') || !isMuseumRoom(n.area)) return [];
    const T = stamps(), all = MUSEUM_WINGS.length;
    if (T.prize != null) return [];
    if (T.got.length < all) return [{ label: 'Museum Day?', fn: async () => {
        await UI.say('brulee', T.got.length ? `${T.got.length} of ${all} stamps! Each wing has a little stand just inside its door. Keep going, mon amie!`
            : ['It is Museum Day! Each wing has a stamp stand just inside its door.', 'Stamp your card in every wing, then come and see me. I have a little something for a true museum lover.'], { keep: true });
        return true;
    } }];
    return [{ label: 'My card is full!', fn: async () => {
        const prize = STAMP_PRIZES[T.n % STAMP_PRIZES.length];
        T.prize = Clock.dayNum(); T.n++;
        await UI.say('brulee', ['Every stamp! Magnifique!', 'For you: a piece from the museum itself. Do not tell the board.'], { keep: true });
        receive(prize, 1);
        Sfx.play('fanfare');
        Save.touch();
        return true;
    } }];
}
for (const W of MUSEUM_WINGS) { const R = ROOMS[W.id], own = R.build; R.build = a => { own(a); stampStand(a, W); }; }
