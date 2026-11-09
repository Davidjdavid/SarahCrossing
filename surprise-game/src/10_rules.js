/* the rules of the world: tiles, what each kind of thing is, and what its numbers mean.
   no drawing here: this runs in the tests too */

const TILE = {
    ' ': { solid: 1 }, '.': {}, ',': {}, '"': {}, ':': {}, ';': {}, s: {}, '=': {}, _: {}, '-': {}, r: {}, M: { mat: 1 },
    W: { solid: 1 }, w: { solid: 1 }, '#': { solid: 1 }, '^': { solid: 1 }, f: { solid: 1 }, o: { solid: 1 }, C: { solid: 1 },
    b: { solid: 1 }, B: { solid: 1 }, h: { solid: 1 }, k: { solid: 1 }, n: { solid: 1 },
    '~': { water: 1 }, '%': { water: 1, sea: 1 }, x: { pit: 1 }, v: { ledge: 1 }, '!': { solid: 1 },
};
const tileOf = c => TILE[c] || TILE[' '];

/* slot kinds: the little picture on the tag says which */
const SLOT_NAMES = { wt: 'weight', str: 'strength', hp: 'health', age: 'age', addr: 'address', to: 'to', hour: 'hour', e: 'onward', w: 'back', price: 'price', gold: 'gold', need: 'need', hold: 'holds', cnt: 'count', n: 'cookies', v: 'number', d: 'width', lamp: 'lamp' };

/* the hour, as the world sees it */
function hourVal() { return dval(G.hour); }
function band() {
    const h = hourVal();
    if (h >= 24) return 'eerie';
    if (h >= 6 && h <= 17) return 'day';
    if (h >= 18 && h <= 19) return 'dusk';
    return 'night';
}
const isNight = () => band() === 'night';
const isEerie = () => band() === 'eerie';

/* ages: what each age looks like for each kind of thing */
function treeStage(a) { return a === 0 ? 'seed' : a <= 2 ? 'sprout' : a <= 5 ? 'young' : a <= 7 ? 'tree' : a === 8 ? 'old' : 'ancient'; }
function wallStage(a) { return a === 0 ? 'none' : a >= 9 ? 'rubble' : 'wall'; }
function bridgeStage(a) { return a === 0 ? 'none' : a >= 9 ? 'rotten' : a <= 2 ? 'new' : 'sound'; }
function chickStage(a) { return a === 0 ? 'egg' : a <= 2 ? 'chick' : 'bird'; }
function lotStage(a) { return a === 0 ? 'none' : a >= 9 ? 'ruin' : 'house'; }

const sv = (e, k) => { const d = slotGet(e, k); return d ? dval(d) : 0; };

/* what each kind of thing does. solid: stops you walking; push: you can push it;
   bump: what happens when you walk into it; tags: where its numbers sit (drawn) */
const KIND = {};
function kind(name, def) { KIND[name] = Object.assign({ solid: () => true, osolid: null }, def); }

const weighty = { push: true, solid: e => !e.wet };
kind('crate', weighty);
kind('boulder', weighty);
kind('anchor', weighty);
kind('parcel', weighty);
kind('tree', { solid: e => sv(e, 'age') >= 3, bump: e => (e.hollow && sv(e, 'age') >= 9) ? enterHollow(e) : say(e.age9line && sv(e, 'age') >= 9 ? e.age9line : null) });
kind('wall', { solid: e => wallStage(sv(e, 'age')) === 'wall' });
kind('bridge', { solid: e => bridgeStage(sv(e, 'age')) === 'rotten', bump: e => { EV.push({ t: 'creak', e: e.id }); return false; } });
kind('lot', { solid: e => lotStage(sv(e, 'age')) !== 'none', bump: (e, x, y) => lotBump(e, x, y) });
const standing = e => !(e.s && e.s.age) || lotStage(sv(e, 'age')) === 'house';
kind('house', { solid: e => !(e.s && e.s.age) || lotStage(sv(e, 'age')) !== 'none', bump: (e, x, y) => houseBump(e, x, y) });
kind('door', { bump: e => doorBump(e) });
kind('plate', { solid: () => false });
kind('crack', { solid: () => false });
kind('gate', { solid: e => !e.open });
kind('loose', { solid: () => false });
kind('stamp', { solid: () => false });
kind('npc', { bump: e => talkTo(e) });
kind('sign', { bump: e => say(e.text) });
kind('clock', { bump: e => say(e.text || null) });
kind('milestone', { bump: e => false });
kind('shelf', { bump: e => buy(e) });
kind('drum', { bump: e => false });
kind('counter', { bump: e => false });
kind('chest', { bump: e => openChest(e) });
kind('bell', { bump: e => ringBell(e) });
kind('jar', { bump: e => eatCookie(e) });
kind('cat', { bump: e => say(['Mrrp.']) });
kind('egg', { solid: e => chickStage(sv(e, 'age')) === 'egg' || chickStage(sv(e, 'age')) === 'bird', bump: e => say(chickStage(sv(e, 'age')) === 'bird' ? ['Cheep!'] : null) });
kind('mirror', { bump: e => false });
kind('stairs', { bump: e => takeStairs(e) });
kind('deco', { solid: e => !e.walk, bump: e => TALK[e.id] ? talkTo(e) : say(e.text || null) });
kind('slime', { bump: e => attack(e) });
kind('rattle', { bump: e => attack(e) });
kind('golem', { push: false, bump: e => attack(e) });
kind('scope', { bump: e => say(e.text || null) });
kind('lamp', { bump: e => false });
kind('sea', { solid: () => false });
const MONSTER = { slime: 1, rattle: 1, golem: 1 };

/* existence by the hour: people keep hours, some things only exist outside of time */
function present(e) {
    if (e.gone) return false;
    const b = band();
    if (e.when === 'eerie') return b === 'eerie';
    if (e.when && typeof WHEN !== 'undefined' && WHEN[e.when]) return WHEN[e.when](e);
    if (e.k === 'npc' || e.when) {
        if (b === 'eerie') return !!e.always;
        const w = e.when || 'out';
        if (w === 'out') return b === 'day' || b === 'dusk';
        if (w === 'in') return b === 'night';
        return true;
    }
    return true;
}
function solidFor(e) { return present(e) && KIND[e.k].solid(e); }
