// A fixed thing (a sign, a chest, a post...) standing on the only floor that joins two stretches of floor cuts one of them
// off for good. David, playing 1.0.2, couldn't get past the Millrace's UPSTREAM sign into half its room, and so never into
// the two rooms beyond it; it had stood there since the House was built, and every test of those rooms began inside them.
// Used by the placement audit (every area at every stage) and by tests/fixK_reach.test.mjs.

/* barriers made to open (by a tool, a puzzle or the story): the puzzles' own, not cuts */
export const OPENS = new Set(['seal', 'flat', 'warpthread', 'dam', 'knotlock']);
/* looked at one by one: area|thing -> why it's fine */
export const EXPECTED_CUTS = {
    'strayhouse|shPatch': 'the chest in the middle of its alcove over the holes: each side of the alcove is reached by filling the hole below it',
};

/* every fixed thing in the area standing on the only floor between two stretches of floor (walking only: water, holes and
   ledges count as walls, doors as open, things that can be moved as floor) */
export function fixedCuts(HW, a) {
    const DX = HW.global('DX'), DY = HW.global('DY'), out = [];
    const terr = (x, y) => { if (!a.inside(x, y)) return false; const k = a.kind(x, y); return !(k.solid && !k.crawl) && !k.pit && !k.deep && !k.fog && !k.void && !k.ledge; };
    const isFixed = o => o && !o.removed && o.kind !== 'door' && o.kind !== 'warp' && !o.walkOn && (o.fixed || o.weight >= 99 || o.kind === 'sign' || o.kind === 'chest' || o.kind === 'deco');
    const fixedAt = (x, y) => {
        const o = a.at(x, y); if (isFixed(o)) return o;
        for (const b of a.blockers) if (b.kind !== 'door' && b.kind !== 'warp' && !b.isGrid && b.blocks && b.blocks(x, y)) return b;
        return null;
    };
    const walk = (x, y) => terr(x, y) && !fixedAt(x, y);
    const flood = (sx, sy, cut) => {
        const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
        while (q.length) {
            const [x, y] = q.pop();
            for (let d = 0; d < 4; d++) {
                const nx = x + DX[d], ny = y + DY[d], k = nx + ',' + ny;
                if (seen.has(k) || k === cut || !walk(nx, ny)) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        return seen;
    };
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        if (!terr(x, y)) continue;
        const f = fixedAt(x, y); if (!f || OPENS.has(f.kind)) continue;
        const name = f.id || f.kind;
        if (EXPECTED_CUTS[a.id + '|' + name]) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => walk(nx, ny));
        if (n.length < 2) continue;
        const cut = x + ',' + y, side = flood(n[0][0], n[0][1], cut), lost = n.filter(([nx, ny]) => !side.has(nx + ',' + ny));
        if (!lost.length) continue;
        const other = flood(lost[0][0], lost[0][1], cut), room = a.rooms && a.rooms.length > 1 && a.roomAt(x, y);
        out.push({ key: `${a.id}|cut|${name}|${x},${y}`, small: Math.min(side.size, other.size),
            msg: `${a.id}: ${f.kind} ${name}${f.text ? ' "' + String(f.text).slice(0, 30) + '..."' : ''} at ${x},${y}${room ? ' (' + (room.name || room.key) + ')' : ''} stands on the only floor between ${side.size} tiles and ${other.size}` });
    }
    return out;
}
