/* ---- 6zn_bonds.js ---- */
/* The neighbors' own friendships (docs/ROADMAP.md: "friendships between the neighbors themselves that shift with the island
   drama"). Every pair has a bond, -5 to 10 (S.bonds['a+b']; a few pairs start close, BOND_START). The island's storylines
   move their cast's as they go (BOND_STATE, from Drama.setState: falling out over a mix-up, making up, a couple, a contest
   taken well); chatting raises it a little, once a day a pair and only so far (Chats.end); a falling-out mends a point every
   few days (bondTick, in dailyCheck). Close friends stop to chat more and walk over to each other; two who've fallen out
   don't chat until it mends (Chats.ok). And they talk about it: their best friend on the island, or who they're not
   speaking to (bondLine, a talk topic; the census says who's close). */
const BOND_START = { 'kai+maki': 4, 'cece+coco': 4, 'basil+wonton': 3, 'chili+kai': 2, 'clementine+david': 3, 'ginger+sully': 3, 'brulee+cece': 2,
    'cuke+mac': 2, 'basil+mac': 2, 'brulee+clementine': 2, 'coco+joe': 2, 'cuke+ginger': 2 };
/* entering a storyline's step moves A and B's bond */
const BOND_STATE = { 'crush:couple': 4, 'crush:kindno': -1, 'breakup:fight': -3, 'breakup:makeup': 4, 'breakup:split': -3,
    'backtalk:start': -2, 'backtalk:hurt': -1, 'backtalk:apology': 4, 'backtalk:blowsover': 3, 'mixup:start': -2, 'mixup:clear': 3,
    'lostinvite:announce': -2, 'lostinvite:fixed': 3, 'lostinvite:found': 3, 'rivalry:start': -1, 'rivalry:result': 2, 'rivalry:tie': 3,
    'borrowed:start': -2, 'borrowed:returned': 3, 'surprise:after': 2 };
const BOND_CLOSE = 5, BOND_OUT = -2, BOND_CHAT = 6;
const BOND_BEST = ['{B} and I have been hanging out so much lately. Best friends? I think so. Don\'t tell {B} I said it first.',
    'Have you noticed {B} and I are always together now? It just happened. Like peanut butter and a second peanut butter.',
    "If you can't find me, try wherever {B} is. Odds are good."];
const BOND_SPAT = ["{B} and I aren't really talking right now. It's fine. It's FINE. It'll blow over.",
    "Don't mention {B} to me today. Okay, you can mention them. Just quietly.",
    "{B} and I had a thing. It's a small thing. It's getting smaller. Give it a few days."];

function bondKey(a, b) { return a < b ? a + '+' + b : b + '+' + a; }
function bond(a, b) { const k = bondKey(a, b), v = S && S.bonds && S.bonds[k]; return v != null ? v : BOND_START[k] || 0; }
function bondAdd(a, b, n) {
    if (!S || !a || !b || a === b || !TALK[a] || !TALK[b]) return;
    if (!S.bonds) S.bonds = {};
    S.bonds[bondKey(a, b)] = Math.max(-5, Math.min(10, Math.round((bond(a, b) + n) * 10) / 10));
}
function bondPeople() { return NEIGHBORS.concat(['joe']); }
/* their closest friend on the island (close enough to say so), and who they've fallen out with */
function bestFriendOf(id) {
    let best = null, v = BOND_CLOSE - 0.01;
    for (const o of bondPeople()) if (o !== id && bond(id, o) > v) { v = bond(id, o); best = o; }
    return best;
}
function fellOutWith(id) {
    let who = null, v = BOND_OUT + 0.01;
    for (const o of bondPeople()) if (o !== id && bond(id, o) < v) { v = bond(id, o); who = o; }
    return who;
}
/* a storyline moved on (Drama.setState) */
function bondDrama(d) {
    const k = BOND_STATE[d.tpl + ':' + d.state];
    if (k && d.cast.A && d.cast.B) bondAdd(d.cast.A, d.cast.B, k);
}
/* two neighbors finished a chat: a little closer, once a day, and only so far by chatting */
function bondChat(a, b) {
    if (!S || !TALK[a.id] || !TALK[b.id]) return;
    const day = Clock.dayNum(), k = bondKey(a.id, b.id);
    S.bondDay = S.bondDay || {};
    if (S.bondDay[k] === day) return;
    S.bondDay[k] = day;
    if (bond(a.id, b.id) < BOND_CHAT) bondAdd(a.id, b.id, 0.5);
}
/* every morning: a falling-out mends a point every third day; yesterday's chat marks go */
function bondTick() {
    if (!S || !S.bonds) return;
    const day = Clock.dayNum();
    if (day % 3 === 0) for (const [k, v] of Object.entries(S.bonds)) if (v < 0) S.bonds[k] = Math.min(0, v + 1);
    if (S.bondDay) for (const [k, d] of Object.entries(S.bondDay)) if (d < day) delete S.bondDay[k];
}
/* what they say about it (a talk topic) */
function bondLine(n) {
    const out = fellOutWith(n.id), best = bestFriendOf(n.id), nm = id => NPC_DEFS[id].name;
    if (out && NPC_DEFS[out]) return rpick(BOND_SPAT).replace(/\{B\}/g, nm(out));
    if (best && NPC_DEFS[best]) return rpick(BOND_BEST).replace(/\{B\}/g, nm(best));
    return null;
}
EXTRA_TOPICS.push(['bond', n => (fellOutWith(n.id) ? 2.5 : bestFriendOf(n.id) ? 0.8 : 0), bondLine]);
