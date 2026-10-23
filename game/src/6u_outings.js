/* ---- 6u_outings.js ---- */
/* Outings: most days a few neighbors head off together somewhere nice. A picnic on the blanket in the forest or up in
   the meadow, a trip up the mountain to watch the sun go down, a walk out to the lighthouse. It's all worked out from
   the island's seed each morning (so texting them gives the same answer as walking over), and they only go when
   they're free and the weather's nice. */
const OUTINGS = [
    { spot: 'picnic_forest', kind: 'picnic', a: [11.5, 14.5], len: 1.3, n: [2, 3], chance: 0.55, dry: true },
    { spot: 'summit', kind: 'view', a: [16.4, 18.2], len: 1.1, n: [1, 2], chance: 0.5, dry: true },
    { spot: 'lighthousefront', kind: 'stroll', a: [13, 17], len: 0.9, n: [1, 2], chance: 0.35 },
];
const OUTING_FOLKS = ['maki', 'kai', 'basil', 'chili', 'coco', 'cece', 'clementine', 'cuke', 'sully', 'ginger', 'brulee', 'mac', 'joe'];
/* where on the blanket (tile offsets from the spot), facing in toward the basket */
const PICNIC_SEATS = [[-1.1, -0.1, 'right'], [1.1, -0.1, 'left'], [0, -0.75, 'down']];
const OUTING_PLACE = { picnic_forest: 'having a picnic in the forest', summit: 'on top of the mountain for the view',
    lighthousefront: 'out by the lighthouse' };
Object.assign(PLACE_NAMES, OUTING_PLACE);
function outingFree(id, a, b) {
    const d = NPC_DEFS[id];
    if (!d || d.shop || d.dj || d.spring || d.goat || d.visitor || d.early) return false;
    if (d.wake > a - 0.3 || d.bed < b + 0.5) return false;
    return !(d.work || []).some(([, wa, wb]) => wa < b + 0.3 && wb > a - 0.3);
}
function outingsToday(day) {
    if (!S || !S.flags || !S.flags.introDone) return [];
    const c = outingsToday.c;
    if (c && c.day === day && c.seed === S.seed) return c.list;
    const r = mulberry(hash32(S.seed + ':outing:' + day));
    const wet = day === Clock.dayNum() ? ['rain', 'snow'].includes(todayWeather()) : false;
    const used = new Set(), list = [];
    for (const o of OUTINGS) {
        const roll = r(), a = o.a[0] + r() * (o.a[1] - o.a[0]), b = a + o.len;
        if (roll >= o.chance || (o.dry && wet)) continue;
        const pool = shuffled(OUTING_FOLKS.filter(id => !used.has(id) && outingFree(id, a, b)), r);
        const k = o.n[0] + Math.floor(r() * (o.n[1] - o.n[0] + 1));
        let who = pool.slice(0, k);
        // Joe comes along on group outings (three or more of them), never one-on-one with somebody
        if (who.includes('joe') && who.length < 3) {
            const more = pool.filter(id => !who.includes(id)).slice(0, 3 - who.length);
            who = who.length + more.length >= 3 ? who.concat(more) : who.filter(id => id !== 'joe');
        }
        if (who.length < o.n[0]) continue;
        who.forEach(id => used.add(id));
        list.push(Object.assign({}, o, { a, b, who }));
    }
    outingsToday.c = { day, seed: S.seed, list };
    return list;
}
function outingOverride(id, day) {
    const out = [];
    for (const o of outingsToday(day)) if (o.who.includes(id)) out.push([o.spot, o.a, o.b]);
    return out.length ? out : null;
}
function outingOf(id, day) { return outingsToday(day == null ? Clock.dayNum() : day).find(o => o.who.includes(id)) || null; }
/* on the blanket: a fixed place each, facing the basket (people sit down properly) */
function picnicSpot(n, spot) {
    const o = outingOf(n.id);
    const sp = W0.spots[spot];
    if (!o || !sp || o.spot !== spot) return null;
    const i = Math.max(0, o.who.indexOf(n.id)) % PICNIC_SEATS.length;
    const [dx, dy, face] = PICNIC_SEATS[i];
    return { area: 'island', x: (sp.x + 0.5 + dx) * TILE, y: (sp.y + 0.5 + dy) * TILE + 4, fixed: true, face, lounge: true };
}
function isLounging(n) {
    const w = n.want;
    return !!(w && w.lounge && !n.path && n.area === 'island' && Math.abs(n.x - w.x) < 1 && Math.abs(n.y - w.y) < 1);
}
/* what they say when you find them out there */
const OUTING_TALK = {
    picnic: ['Picnic! Want a sandwich? I made too many. On purpose.', "Sit, sit! There's room on the blanket. There's always room on the blanket.",
        'We brought fruit, cheese and a very ambitious amount of cookies.', 'The ants found us. We are sharing. It is very diplomatic.',
        "Picnics are the best. It's just lunch, but outside, and that makes it an event."],
    view: ['Look at that view. The whole island, all at once. And the sea, forever.', "We came up to watch the sunset. Stay! It's about to get really pretty.",
        'You can see your house from here! It looks so small. It looks so cozy.', 'Worth the climb. My legs disagree. My heart agrees.'],
    stroll: ['We walked all the way out to the lighthouse. Isn\'t it beautiful? And a little spooky.', 'I love it out here. Just the waves and the old lighthouse.',
        'People say there\'s a ghost in the lighthouse. I say hi to it, just in case. Manners.'],
};
Object.assign(PLACE_TALK, { picnic: OUTING_TALK.picnic, summit: OUTING_TALK.view, lighthousefront: OUTING_TALK.stroll });

