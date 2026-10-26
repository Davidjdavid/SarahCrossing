/* ---- 22_npc.js ---- */
/* Neighbors: who they are, how their day goes (wake up, wander, work, go to bed), walking between places,
   and the accessories friends have given them. */
const NPC_DEFS = {
    maki:  { name: 'Maki', sprite: 'maki', color: '#34473e', voice: 520, wave: 'square', house: 'h_maki', h: 16, wake: 7.5, bed: 24,
             fav: { pond: 3, bench_statue: 2, shopfront: 1.5, board: 1.5, meadow: 1, in_studio: 1, forest: 1, oldtree: 1.5, museumfront: 1, eastside: 1 } },
    kai:   { name: 'Kai', sprite: 'kai', color: '#4f86c6', voice: 330, wave: 'triangle', house: 'h_kai', h: 15, wake: 8.5, bed: 24.75,
             fav: { beach_e: 4, beach: 3, pier: 3, beach_far: 2, river: 1, in_arcade: 1, waterfall: 2, harbor: 2, boardwalk: 1.5, bonfire: 1.5 } },
    basil: { name: 'Basil', sprite: 'basil', color: '#b98a3a', voice: 300, wave: 'triangle', house: 'h_basil', h: 15, wake: 9, bed: 25.5,
             fav: { garden: 2, plaza: 2, meadow: 2, beach: 1, bench_e: 1, in_shop: 1, farm: 1, bench_beach: 1, village: 1, harbor: 1 }, work: [['cart', 20, 25.1]] },
    wonton: { name: 'Wonton', sprite: 'wonton', color: '#c29a5d', voice: 440, wave: 'sine', h: 14, wake: 7.5, bed: 24.5, spring: true },
    chili: { name: 'Chili', sprite: 'chili', color: '#e2382b', voice: 600, wave: 'square', house: 'h_chili', h: 20, wake: 8.75, bed: 25,
             fav: { garden: 1.5, plaza: 2, lookout: 2, clubfront: 2, beach_w: 1, boardwalk: 2, bonfire: 2, village: 1 }, club: 0.85, work: [['arcade', 12, 15], ['arcade', 16, 18.5]] },
    coco:  { name: 'Coco', sprite: 'coco', color: '#6e3f25', voice: 470, wave: 'sine', house: 'h_coco', h: 16, wake: 8.5, bed: 25,
             fav: { plaza: 4, bench_e: 3, boutiquefront: 2, shopfront: 2, board: 2, in_boutique: 1.5, museumfront: 1, salonfront: 2, statue: 1.5, in_salon: 1 }, club: 0.9 },
    cece:  { name: 'Cece', sprite: 'cece', color: '#e0647a', voice: 560, wave: 'sine', house: 'h_cece', h: 18, wake: 7, bed: 23,
             fav: { garden: 2, shopfront: 2.5, pond: 2, bench_w: 2, spring: 1, in_studio: 1.5, in_shop: 1, farm: 1, salonfront: 1, village: 1.5, goatpen: 1 } },
    clementine: { name: 'Clementine', sprite: 'clementine', color: '#f28a1a', voice: 500, wave: 'triangle', house: 'h_clementine', h: 16, wake: 8, bed: 24.5,
             fav: { plaza: 2, beach_w: 2, pier: 1, in_shop: 0.5, statue: 1.5, salonfront: 1.5, boardwalk: 1, in_salon: 1 }, club: 0.8, work: [['boutique', 9.2, 12.6], ['boutique', 14, 18]] },
    cuke:  { name: 'Cuke', sprite: 'cuke', color: '#3f8a3a', voice: 380, wave: 'square', house: 'h_cuke', h: 20, wake: 4, bed: 20, early: true,
             fav: { orchard: 3, bridge: 2, beach_far: 2, river: 2, meadow: 2, in_shop: 0.8, mountain: 2, farm: 2, eastmeadow: 1.5, forest: 1, campsite: 1 } },
    sully: { name: 'Sully', sprite: 'sully', color: '#8a5a2b', voice: 240, wave: 'square', house: 'h_sully', h: 18, wake: 8, bed: 24.5,
             fav: { bench_w: 2, plaza: 2, pond: 2, beach_w: 1.5, arcadefront: 2, harbor: 2, boardwalk: 1.5, bench_boardwalk: 1 }, work: [['studio', 9.5, 13], ['studio', 14.5, 18]] },
    david: { name: 'David', human: 'david', color: '#e0559a', voice: 410, wave: 'triangle', h: 24, visitor: true, skates: true,
             fav: { plaza: 3, boutiquefront: 3, pier: 2, beach: 2, arcadefront: 2, in_boutique: 1.5, in_arcade: 1.5, waterfall: 1, statue: 3, salonfront: 2, boardwalk: 2 }, club: 0.95 },
    ginger: { name: 'Ginger', sprite: 'ginger', color: '#c0773a', voice: 430, wave: 'square', house: 'h_ginger', h: 18, wake: 7, bed: 23.5,
             fav: { farm: 3, forest: 2, plaza: 1.5, board: 1, bench_e: 1, mountain: 1, builderfront: 1, in_shop: 1, in_restaurant: 1, goatpen: 1.5, displaysfront: 1.5, bench_farm: 1 }, work: [['builder', 8.4, 12], ['builder', 13, 17]] },
    brulee: { name: 'Brulee', sprite: 'brulee', color: '#c9822e', voice: 500, wave: 'sine', house: 'h_brulee', h: 16, wake: 8, bed: 24.25,
             fav: { waterfall: 2, pond: 2, museumfront: 2, bench_museum: 2, plaza: 1.5, in_restaurant: 1.5, in_studio: 1, in_boutique: 1, statue: 1.5, oldtree: 1, bench_falls: 1 }, work: [['museum', 9.4, 13], ['museum', 14, 18]] },
    mac:   { name: 'Mac', sprite: 'mac', color: '#e9a92a', voice: 360, wave: 'triangle', house: 'h_mac', h: 17, wake: 6.5, bed: 23.5,
             fav: { farm: 2, shopfront: 2, plaza: 2, restaurantfront: 1, beach: 1, pier: 1, garden: 1, orchard: 1.5, harbor: 1, eastside: 1 }, work: [['restaurant', 7.1, 14], ['restaurant', 16.5, 21.6]] },
    goat:  { name: 'The goat', sprite: 'goat', color: '#8a8490', voice: 200, wave: 'sawtooth', house: 'barn', h: 12, wake: 7.5, bed: 23, goat: true,
             fav: { home: 8, farm: 1.5 } },
    fortune: { name: 'Fortune', sprite: 'fortune', color: '#d49a3a', voice: 540, wave: 'square', h: 14, wake: 7.9, bed: 22.1, shop: true },
    floss: { name: 'Floss', sprite: 'floss', color: '#e0559a', voice: 610, wave: 'sine', h: 18, wake: 9.9, bed: 22.1, shop: 'salon' },
    waffle: { name: 'Waffle', sprite: 'waffle', color: '#c98a2e', voice: 320, wave: 'triangle', h: 15, wake: 7.9, bed: 21.1, shop: 'displays' },
    wasabi: { name: 'DJ Wasabi', sprite: 'wasabi', color: '#7aa832', voice: 350, wave: 'square', h: 15, dj: true },
    joe:   { name: 'Joe', human: 'joe', color: '#b8862d', voice: 260, wave: 'sine', house: 'h_joe', h: 24, wake: 6.5, bed: 26,
             fav: { bench_e: 3, pond: 2, plaza: 2, garden: 3, lookout: 1, beach: 1, in_studio: 0.8, in_shop: 0.5, waterfall: 1, forest: 1, bench_statue: 1, bonfire: 1.5, oldtree: 1 }, club: 0.3, work: [['pier_end', 18, 19.6]] },
    james: { name: 'James', human: 'james', color: '#3b8254', voice: 280, wave: 'triangle', h: 24, visitor: true, family: true,
             fav: { beach_e: 4, beach: 2, plaza: 2, pier: 2, arcadefront: 1, meadow: 1, bonfire: 2, harbor: 1 } },
    john:  { name: 'John', human: 'john', color: '#22305a', voice: 250, wave: 'triangle', h: 24, visitor: true, family: true,
             fav: { bench_w: 3, board: 2, shopfront: 2, pond: 2, plaza: 2, lookout: 1, statue: 1, oldtree: 1 } },
    elizabeth: { name: 'Elizabeth', human: 'elizabeth', color: '#3a5ca3', voice: 480, wave: 'sine', h: 24, visitor: true, family: true,
             fav: { plaza: 3, boutiquefront: 2, garden: 2, arcadefront: 2, beach: 1, spring: 1, salonfront: 2, boardwalk: 1 } },
};
/* the food neighbors, in the order the Friends app lists them */
const NEIGHBORS = ['maki', 'kai', 'basil', 'wonton', 'chili', 'coco', 'cece', 'clementine', 'cuke', 'sully', 'ginger', 'brulee', 'mac'];
const HUMANS = ['joe', 'david', 'james', 'john', 'elizabeth'];
const SIBLINGS = ['james', 'john', 'elizabeth'];
/* people who don't live here: they come over on the boat now and then and camp for a night or two */
const VISITORS = ['david', 'james', 'john', 'elizabeth'];
const CLUB_SPOTS = [[4.5, 7.3], [10.6, 7.6], [6.4, 8.8], [8.6, 6.6], [5.6, 5.9], [9.8, 5.7], [7.4, 8.3], [3.6, 8.9]];

/* island hours as one run from 5 AM (5) to 5 AM the next morning (29) */
function dayHour(h) { h = h == null ? Clock.hourF() : h; return h < 5 ? h + 24 : h; }
function hourIn(h, a, b) {       // b may pass midnight (e.g. 21..25)
    if (b <= 24) return h >= a && h < b;
    return h >= a || h < b - 24;
}
function fmtDayHour(dh) { return fmtClock(dh % 24); }
function fmtClock(h) {
    const tot = Math.round(h * 60), hh = Math.floor(tot / 60) % 24, mm = tot % 60;
    return `${(hh % 12) || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${hh < 12 ? 'AM' : 'PM'}`;
}

/* ---------------------------------------------------------------- daily plans */
const Plans = {
    cache: {},
    get(id) {
        const day = Clock.dayNum();
        const c = this.cache[id];
        if (c && c.day === day && c.v === Drama.version) return c;
        const p = makePlan(id, day);
        p.v = Drama.version;
        this.cache[id] = p;
        return p;
    },
    reset() { this.cache = {}; },
};
function bandOf(dh) { return dh < 12 ? 'morning' : dh < 17 ? 'day' : dh < 21 ? 'evening' : 'night'; }
const BAND_BASE = {
    morning: { home: 2.5, shopfront: 1.5, plaza: 1.5, board: 1, garden: 0.7, in_shop: 0.8, village: 0.6, eastside: 0.5 },
    day: { plaza: 1.2, bench_w: 0.6, bench_e: 0.6, beach: 0.6, meadow: 0.5, home: 1.0, in_shop: 0.5, in_boutique: 0.35, in_studio: 0.35, in_arcade: 0.35,
        in_museum: 0.35, in_restaurant: 0.6, in_salon: 0.25, in_displays: 0.2, bench_pond: 0.3, bench_falls: 0.25, bench_beach: 0.3, bench_museum: 0.25,
        bench_meadow: 0.2, bench_farm: 0.15, bench_statue: 0.3, bench_boardwalk: 0.25, bench_eastmeadow: 0.15,
        waterfall: 0.3, farm: 0.25, forest: 0.2, statue: 0.4, boardwalk: 0.4, harbor: 0.3, oldtree: 0.15, village: 0.3, eastside: 0.3,
        salonfront: 0.2, displaysfront: 0.2 },
    evening: { plaza: 2, bench_w: 1, bench_e: 1, pier: 1, beach: 0.8, home: 1.6, in_shop: 0.4, in_arcade: 0.5, in_boutique: 0.3, in_restaurant: 1, in_museum: 0.25,
        bench_beach: 0.5, bench_pond: 0.3, bench_lookout: 0.2, bench_falls: 0.2, bonfire: 1.2, boardwalk: 0.8, statue: 0.4, harbor: 0.5 },
    night: { home: 2, plaza: 1.2, plaza_w: 1, pier: 0.6, in_arcade: 0.5, in_shop: 0.3, bonfire: 1.4, boardwalk: 0.6 },
};
/* roughly where a plan spot is on the island (tiles), to keep each part of the day somewhere new */
function spotTile(id, spot) {
    const d = NPC_DEFS[id] || {};
    if (spot === 'home') { const b = bldOf(d.house); return b ? [b.x + b.door, b.y + b.h] : null; }
    if (spot.startsWith('in_')) { const b = bldOf(spot.slice(3)); return b ? [b.x + b.door, b.y + b.h] : null; }
    if (W0.buildings[spot]) { const b = W0.buildings[spot]; return [b.x + b.door, b.y + b.h]; }
    if (spot === 'cart') return [Math.floor(W0.cart.x), W0.cart.y];
    if (spot === 'jog') return [W0.spots.orchard.x, W0.spots.orchard.y];
    if (spot.startsWith('party:')) spot = spot.slice(6);
    const sp = W0.spots[spot];
    return sp ? [sp.x, sp.y] : null;
}
/* the far corners of the island: lovely by day, empty at night */
const WILD_SPOTS = ['farm', 'goatpen', 'forest', 'oldtree', 'meadow', 'eastmeadow', 'lookout', 'mountain', 'waterfall', 'orchard', 'campsite', 'spring',
    'bench_farm', 'bench_meadow', 'bench_eastmeadow', 'bench_lookout', 'bench_falls', 'river', 'bridge', 'beach_far', 'jog'];
const NEAR_TILES = 14;            // a new part of the day is at least this far from the last one (unless it's indoors)
/* indoor places only count while they're open (and people don't go shopping at their own shop) */
function openIndoor(wts, t, d) {
    for (const k of Object.keys(wts)) {
        if (!k.startsWith('in_')) continue;
        const room = k.slice(3);
        if (!ROOMS[room] || !roomOpen(room, t) || !roomOpen(room, t + 0.6) || (d.work || []).some(w => w[0] === room)) delete wts[k];
    }
    return wts;
}
function makePlan(id, day) {
    const d = NPC_DEFS[id];
    const r = mulberry(hash32(S.seed + ':plan:' + id + ':' + day));
    const jit = () => (r() - 0.5) * 0.6;               // a window of about half an hour, different every day
    let [wake, bed] = townWake(d.wake + jit(), d.bed + jit());       // (the Town Hall's ordinance can move them: 6zg_townhall.js)
    const segs = [];
    if (d.dj) { segs.push({ a: 5, b: 29, spot: 'club' }); return { day, wake: 5, bed: 29, segs }; }
    if (d.visitor) return visitorPlan(id, day, r);
    if (d.spring) { segs.push({ a: 5, b: 29, spot: 'spring' }); return { day, wake, bed, segs }; }
    if (d.shop) { segs.push({ a: d.wake, b: d.bed, spot: d.shop === true ? 'shop' : d.shop }); return { day, wake: d.wake, bed: d.bed, segs }; }
    if (d.early) {
        // Cuke lives on early-people time: up at 4 AM, jogging at dawn, in bed by 8 PM
        segs.push({ a: 5, b: 8.5 + r() * 0.5, spot: 'jog' });
        wake = 5;
    }
    const work = (d.work || []).map(([spot, a, b]) => ({ spot, a: a + jit() * 0.5, b: b + jit() * 0.5 }));
    const clubNight = d.club && r() < d.club;
    let t = segs.length ? segs[segs.length - 1].b : wake;
    if (!segs.length) {
        segs.push({ a: t, b: t + 0.4 + r() * 0.6, spot: 'home' });
        t = segs[0].b;
    }
    let prev = 'home';
    // the evening ends at home for a while before bed (that's when you can drop by)
    const homeAt = d.goat ? bed - 0.3 : bed - (0.5 + r() * 0.8);
    while (t < homeAt - 0.1) {
        const w = work.find(k => t >= k.a - 0.05 && t < k.b);
        if (w) { segs.push({ a: t, b: Math.min(w.b, homeAt), spot: w.spot }); prev = w.spot; t = Math.min(w.b, homeAt); continue; }
        const nextWork = work.filter(k => k.a > t).sort((x, y) => x.a - y.a)[0];
        const band = bandOf(t);
        let len = 0.6 + r() * 1.9;                      // anywhere from about half an hour to two and a half
        let spot;
        if (band === 'night' && clubNight && t >= 21) { spot = 'club'; len = homeAt - t; }
        else {
            const wts = Object.assign({}, BAND_BASE[band]);
            for (const [k, v] of Object.entries(d.fav || {})) wts[k] = (wts[k] || 0) + v * (band === 'morning' ? 0.6 : 1);
            openIndoor(wts, t, d);
            if (band !== 'day') delete wts.meadow;
            // after dark nobody wanders off to the fields, the woods or the mountain (the bonfire is where the night is)
            if (band === 'night') for (const k of WILD_SPOTS) delete wts[k];
            // the goat lives at the farm now: its pen, and a wander round the fields now and then
            if (d.goat) { for (const k of Object.keys(wts)) if (k !== 'home' && k !== 'farm') delete wts[k]; }
            delete wts[prev];
            // somewhere that's actually somewhere else (not the bench next to the spot they were just standing at)
            const pt = d.goat ? null : spotTile(id, prev);
            if (pt) {
                const far = Object.entries(wts).filter(([k]) => { if (k.startsWith('in_')) return true; const q = spotTile(id, k); return !q || Math.hypot(q[0] - pt[0], q[1] - pt[1]) >= NEAR_TILES; });
                if (far.length) { for (const k of Object.keys(wts)) if (!far.some(f => f[0] === k)) delete wts[k]; }
            }
            if (!Object.keys(wts).length) wts.home = 1;                    // nowhere else to be: home it is
            spot = weighted(Object.entries(wts), r);
            if (spot.startsWith('in_')) len = 0.3 + r() * 0.8;          // shopping is a quick trip
        }
        if (nextWork && t + len > nextWork.a) len = nextWork.a - t;
        if (t + len > homeAt) len = homeAt - t;
        // not worth the walk for a few minutes: stay put a little longer instead (and never leave a gap in the day)
        if (len < 0.35 && segs.length) { segs[segs.length - 1].b = t + Math.max(0.05, len); t += Math.max(0.05, len); continue; }
        segs.push({ a: t, b: t + len, spot });
        prev = spot;
        t += len;
    }
    // the last stretch is always home
    if (segs.length && segs[segs.length - 1].spot === 'home') segs[segs.length - 1].b = bed;
    else segs.push({ a: t, b: bed, spot: 'home' });                  // (right away: no gap to wander home in)
    if (d.early) { segs.push({ a: 28, b: 29, spot: 'jog' }); }
    // jump rope in the plaza, then today's storyline, may send people somewhere (the rope, a date, a party)
    const o = (ropeOverride(id, day) || []).concat(Drama.override(id, day) || [], inviteOverride(id, day) || [], outingOverride(id, day, r) || []);
    for (const [spot, a, b] of o) {
        const more = [];
        for (const s of segs) {
            if (s.dead || !(s.b > a && s.a < b)) continue;
            if (s.a >= a && s.b <= b) s.dead = true;
            else if (s.a < a && s.b > b) { more.push({ a: b, b: s.b, spot: s.spot }); s.b = a; }     // before and after it
            else if (s.a < a) s.b = a;
            else s.a = b;
        }
        segs.push(...more, { a, b, spot, ov: true });
    }
    const live = segs.filter(s => !s.dead && s.b > s.a).sort((x, y) => x.a - y.a);
    // little stubs left where the day was trimmed around the rope or a storyline: fold them into a neighbor
    for (let i = 0; i < live.length; i++) {
        const s = live[i];
        if (s.ov || s.b - s.a >= 0.25) continue;
        const prev = live[i - 1], next = live[i + 1];
        if (prev && !prev.ov && Math.abs(prev.b - s.a) < 0.02) { prev.b = s.b; live.splice(i--, 1); }
        else if (next && !next.ov && Math.abs(next.a - s.b) < 0.02) { next.a = s.a; live.splice(i--, 1); }
    }
    return { day, wake, bed, segs: live };
}
/* Visitors don't live here: once in a while one of them comes over on the boat and stays a day, or camps a night or
   two in a tent at the campsite. Every visit is worked out from the island's seed, so it's the same whenever you look. */
const VISIT_MAX_DAYS = 3;
function visitStart(id, day) {
    if (!S || !S.flags || !S.flags.introDone) return null;
    const ov = (visitStart.forced || {})[id + ':' + day];
    if (ov !== undefined) return ov;
    const start = S.startDay || day;
    const first = start + 3 + (hash32(S.seed + ':firstsib') % 4);      // somebody drops by in the first week
    const firstWho = VISITORS[hash32(S.seed + ':firstwho') % VISITORS.length];
    const r = mulberry(hash32(S.seed + ':visit:' + id + ':' + day));
    let go = false;
    if (day === first) go = id === firstWho;
    else if (day > first) go = r() < 0.024;
    else r();
    if (!go) return null;
    const days = 1 + Math.floor(r() * VISIT_MAX_DAYS);
    return { who: id, day, days, arrive: 11 + r() * 3, leave: id === 'elizabeth' ? 23.5 + r() * 1.5 : 18.5 + r() * 3.5 };
}
/* the visit someone is on today, if any: { who, day (first day), days, arrive, leave, first, last, tent } */
function visitOf(id, day) {
    const c = visitOf.cache || (visitOf.cache = {});
    const key = S.seed + ':' + id + ':' + day;
    if (c[key] !== undefined) return c[key];
    let out = null;
    for (let d0 = day - VISIT_MAX_DAYS + 1; d0 <= day && !out; d0++) {
        const v = visitStart(id, d0);
        if (v && d0 + v.days - 1 >= day) out = Object.assign({}, v, { first: d0 === day, last: d0 + v.days - 1 === day });
    }
    c[key] = out;
    return out;
}
/* everyone visiting today (three tents: when they're all taken, the next visitor comes another time) */
function visitorsToday(day) {
    day = day == null ? Clock.dayNum() : day;
    return VISITORS.filter(id => tentOf(id, day) != null);
}
function visitingToday(day) { return visitorsToday(day)[0] || null; }
/* which tent a visitor sleeps in: picked on the day they arrive (whoever got here first keeps theirs), kept all visit */
function tentOf(id, day) {
    day = day == null ? Clock.dayNum() : day;
    const v = visitOf(id, day);
    if (!v) return null;
    const c = tentOf.cache || (tentOf.cache = {});
    const key = S.seed + ':' + id + ':' + v.day;
    if (c[key] !== undefined) return c[key];
    c[key] = null;                                  // (guards against going round in circles)
    const d0 = v.day, taken = new Set();
    const others = VISITORS.filter(o => o !== id).map(o => [o, visitOf(o, d0)]).filter(([o, w]) => w && (w.day < d0 || (w.day === d0 && VISITORS.indexOf(o) < VISITORS.indexOf(id))));
    for (const [o] of others) { const t = tentOf(o, d0); if (t != null) taken.add(t); }
    const pref = VISITORS.indexOf(id) % 3;
    const t = !taken.has(pref) ? pref : [0, 1, 2].find(k => !taken.has(k));
    c[key] = t == null ? null : t;
    return c[key];
}
function tentProp(i) { return (W0.props || []).filter(p => p.kind === 'tent').find(p => (p.tent || 0) === i) || null; }
function tentDoor(i) { const t = tentProp(i); return t ? [t.x + 1, t.y + (W0.tent ? W0.tent.h : 2)] : W0.boat; }
function visitorPlan(id, day, r) {
    const v = visitOf(id, day), tent = tentOf(id, day);
    if (!v || tent == null) return { day, wake: 0, bed: 0, segs: [], away: true };
    const d = NPC_DEFS[id];
    const segs = [];
    // arriving: off the boat at the end of the pier. Staying over: out of the tent in the morning
    let t;
    if (v.first) { segs.push({ a: v.arrive, b: v.arrive + 0.4, spot: 'pier' }); t = v.arrive + 0.4; }
    else { t = 9.5 + r() * 1.5; segs.push({ a: t, b: t + 0.5, spot: 'campsite' }); t += 0.5; }
    const end = v.last ? v.leave : 25 + r() * 1.2;                  // the last evening: back to the boat; otherwise, bed
    const pool = ['plaza', 'plaza_w', 'plaza_e', 'bench_w', 'bench_e', 'board', 'shopfront', 'boutiquefront', 'arcadefront', 'studiofront', 'garden',
        'beach_w', 'beach', 'beach_e', 'beach_far', 'pond', 'river', 'orchard', 'spring', 'lookout', 'meadow', 'bridge', 'clubfront', 'statue',
        'boardwalk', 'harbor', 'salonfront', 'displaysfront', 'oldtree', 'forest', 'waterfall', 'farm',
        'in_shop', 'in_boutique', 'in_studio', 'in_arcade', 'in_museum', 'in_restaurant', 'in_salon'];
    let prev = segs[segs.length - 1].spot;
    const clubNight = d.club && r() < d.club;
    while (t < end - 0.9) {
        const band = bandOf(t);
        let spot, len;
        if (band === 'night' && clubNight && t >= 21.5) { spot = 'club'; len = Math.min(2.5, end - 0.6 - t); }
        else if (!v.last && t >= 20.5 && prev !== 'bonfire' && prev !== 'campsite' && r() < 0.5) { spot = r() < 0.5 ? 'bonfire' : 'campsite'; len = 1 + r(); }
        else {
            const ok = openIndoor(Object.fromEntries(pool.map(k => [k, 1])), t, d);
            const pt = d.goat ? null : spotTile(id, prev);
            let wts = pool.filter(k => k !== prev && ok[k] && !(band === 'night' && WILD_SPOTS.includes(k))).map(k => [k, 1 + ((d.fav || {})[k] || 0)]);
            const far = wts.filter(([k]) => { if (k.startsWith('in_')) return true; const q = spotTile(id, k); return !pt || !q || Math.hypot(q[0] - pt[0], q[1] - pt[1]) >= NEAR_TILES; });
            if (far.length) wts = far;
            spot = weighted(wts, r);
            len = spot.startsWith('in_') ? 0.4 + r() * 0.5 : 0.8 + r() * 1.2;
        }
        len = Math.min(len, end - 0.5 - t);
        if (len < 0.2) break;
        segs.push({ a: t, b: t + len, spot });
        prev = spot; t += len;
    }
    // the day ends at the boat (going home) or at the campsite (turning in)
    segs.push({ a: t, b: end, spot: v.last ? 'pier' : 'campsite' });
    const o = Drama.override(id, day);
    if (o) for (const [spot, a, b] of o) segs.push({ a, b, spot });
    return { day, wake: segs[0].a, bed: end, segs: segs.filter(s => s.b > s.a).sort((x, y) => x.a - y.a), visit: true, tent,
        wakeAt: v.first ? 'boat' : 'tent', sleepAt: v.last ? 'boat' : 'tent', leavesDay: v.day + v.days - 1 };
}
/* "David is visiting: camping till Sunday" */
function visitNote(id) {
    const v = visitOf(id, Clock.dayNum()), nm = NPC_DEFS[id].name;
    if (!v) return `${nm} visits now and then.`;
    const endDay = v.day + v.days - 1, today = Clock.dayNum();
    if (endDay === today) return v.first ? `${nm} is over for the day. The boat back is this evening.` : `${nm} heads home on the boat this evening.`;
    const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(endDay * 86400e3).getUTCDay()];
    return `${nm} is camping at the campsite until ${endDay - today === 1 ? 'tomorrow' : wd}.`;
}
/* where a visitor comes from in the morning / goes at night: the boat, or their tent */
function visitorDoor(id, which) {
    const p = Plans.get(id);
    const at = which === 'wake' ? p.wakeAt : p.sleepAt;
    return at === 'tent' && p.tent != null ? tentDoor(p.tent) : W0.boat;
}

function planNow(id, dh) {
    const p = Plans.get(id);
    for (const s of p.segs) if (dh >= s.a && dh < s.b) return s;
    return null;
}

/* where a plan's spot actually is */
/* buildings, plus the windmill (a prop you can walk into) */
function bldOf(id) { return W0.buildings[id] || (id === 'windmill' ? W0.windmill : null); }
function doorTileOf(bid) { const b = bldOf(bid); return [b.x + b.door, b.y + b.h]; }
function resolveSpot(n, spot) {
    const d = n.def, sp = W0.spots;
    const tpx = (tx, ty) => [(tx + 0.5) * TILE, (ty + 0.5) * TILE + 4];
    if (spot === 'home' && d.goat) spot = 'goatpen';
    if (spot === 'goatpen') { const g = sp.goatpen; return { area: 'island', ...xy(tpx(g.x, g.y)), anchor: [g.x, g.y], r: d.goat ? 2 : 1 }; }
    if (spot === 'bonfire') { const bs = benchSpot(n, spot); if (bs) return bs; }
    if (spot === 'campsite' && d.visitor) {
        // at their own tent, just outside the flap
        const pl = Plans.get(n.id), [tx, ty] = pl.tent != null ? tentDoor(pl.tent) : [sp.campsite.x, sp.campsite.y];
        return { area: 'island', ...xy(tpx(tx, ty + 1)), anchor: [tx, ty + 1], r: 1 };
    }
    if (spot === 'home' && d.house && ROOMS[d.house]) return roomSpot(d.house, 'home');
    if (spot.startsWith('in_') && ROOMS[spot.slice(3)]) return roomSpot(spot.slice(3), 'guest', n);
    if (spot.startsWith('bench')) { const bs = benchSpot(n, spot); if (bs) return bs; }
    if (spot === 'rope_a' || spot === 'rope_b') return ropeSpot(spot.slice(5));
    if (ROOMS[spot] && ROOMS[spot].staff === n.id) return roomSpot(spot, 'staff');
    if (spot === 'club') {
        const i = Math.max(0, ['chili', 'coco', 'clementine', 'david', 'joe', 'elizabeth', 'sully', 'kai', 'james', 'john'].indexOf(n.id));
        const [x, y] = d.dj ? [7.5, 3.2] : CLUB_SPOTS[i % CLUB_SPOTS.length];
        return { area: 'club', x: x * TILE, y: y * TILE, fixed: !!d.dj, anchor: [Math.floor(x), Math.floor(y)], r: 1, dancer: !d.dj };
    }
    if (spot === 'spring') return { area: 'island', x: W0.wonton[0] * TILE, y: W0.wonton[1] * TILE, fixed: true };
    if (spot === 'shop') { const [tx, ty] = doorTileOf('shop'); return { area: 'island', x: (tx + 1.6) * TILE, y: (ty + 1.2) * TILE, fixed: true, face: 'down' }; }
    if (spot === 'cart') return { area: 'island', x: W0.cart.basil[0] * TILE, y: W0.cart.basil[1] * TILE, fixed: true };
    if (spot === 'pier_end') return { area: 'island', x: (sp.pier_end.x + 0.45) * TILE, y: (sp.pier_end.y + 0.6) * TILE, fixed: true, face: 'down' };
    if (spot === 'boutique' || spot === 'studio') {
        const [tx, ty] = doorTileOf(spot);
        return { area: 'island', x: (tx + 1.6) * TILE, y: (ty + 1.3) * TILE, fixed: true, face: 'down' };
    }
    if (spot === 'home' || spot === 'jog') {
        if (spot === 'jog') { const s = sp.orchard; return { area: 'island', ...xy(tpx(s.x, s.y + 3)), anchor: [s.x, s.y + 3], r: 7, jog: true }; }
        const [tx, ty] = doorTileOf(d.house);
        const ay = ty + 1;
        return { area: 'island', ...xy(tpx(tx, ay)), anchor: [tx, ay], r: 2 };
    }
    if (spot.startsWith('party:')) { const s = sp[spot.slice(6)] || sp.plaza; return { area: 'island', ...xy(tpx(s.x, s.y)), anchor: [s.x, s.y], r: 3, party: true }; }
    if (spot.startsWith('picnic_')) { const ps = picnicSpot(n, spot); if (ps) return ps; }
    const s = sp[spot] || sp.plaza;
    return { area: 'island', ...xy(tpx(s.x, s.y)), anchor: [s.x, s.y], r: s.r };
}
function xy([x, y]) { return { x, y }; }

/* ---------------------------------------------------------------- the NPC list */
const NPCs = {
    list: [],
    init() {
        Plans.reset();
        this.list = Object.keys(NPC_DEFS).map(id => {
            const d = NPC_DEFS[id];
            const n = { npc: true, id, def: d, x: 0, y: 0, dir: 'down', flip: false, area: null, path: null,
                t: R() * 200, hop: 0, moving: false, anim: 0, emote: null, emoteT: 0, h: d.h, talking: false, sleeping: true, spotKey: null };
            n.hit = { x: 0, y: 0, w: 16, h: 20 };
            n.interact = () => talkTo(n);
            return n;
        });
        this.place(true);
    },
    get(id) { return this.list.find(n => n.id === id); },
    here() { return this.list.filter(n => n.area === G.area.id && !n.sleeping); },
    /* where should everyone be right now? force = put them there instantly */
    place(force) {
        const dh = dayHour();
        const host = G.area && G.area.room && G.area.room.owner;
        for (const n of this.list) {
            if (n.talking || n.script) continue;
            if (!force && n.id === host && n.area === G.area.id && !n.sleeping) continue;      // hosts don't leave while Sarah visits
            if (!force && G.area.room && G.area.room.staff === n.id && n.area === G.area.id && !n.sleeping) continue;   // nor do shopkeepers
            const want = targetFor(n, dh);
            if (!force && want.key === n.segKey) continue;
            moveTo(n, want, force);
        }
    },
    update() {
        if (G.frame % 30 === 0) this.place(false);
        for (const n of this.list) {
            if (n.sleeping || n.area !== G.area.id) continue;
            updateNPC(n);
        }
        Chats.update();
    },
};

/* the test area's cast: where they stand (tiles), beside Sarah on the cobbles */
const LAB_CAST = { joe: [28.4, 27.0], maki: [30.0, 27.1] };
/* what an NPC wants to be doing at island-hour dh */
function targetFor(n, dh) {
    const d = n.def;
    if (G.intro) {
        if (n.id === 'fortune') return { key: 'intro', area: 'island', x: W0.intro.fortune[0] * TILE, y: W0.intro.fortune[1] * TILE, fixed: true };
        if (n.id === 'joe') return { key: 'intro', area: 'island', x: W0.intro.joe[0] * TILE, y: W0.intro.joe[1] * TILE, fixed: true, face: 'left' };
        return { key: 'sleep', sleep: true };
    }
    if (!S.flags.introDone) return { key: 'sleep', sleep: true };
    if (LAB) { const at = LAB_CAST[n.id]; return at ? { key: 'lab', area: 'island', x: at[0] * TILE, y: at[1] * TILE, fixed: true, face: 'down' } : { key: 'sleep', sleep: true }; }
    if (Online.isHere(n.id)) return { key: 'online', sleep: true };       // the real David (or Joe...) is playing: their NPC steps aside
    const seg = planNow(n.id, dh);
    if (!seg) return { key: 'sleep', sleep: true };
    // Sarah said yes to lunch or hanging out: that's where they're headed
    const inv = Invites.spotFor(n.id);
    if (inv) { const w = resolveSpot(n, inv); if (w) return Object.assign({ key: 'inv:' + inv }, w, { spot: inv }); }
    const where = resolveSpot(n, seg.spot);
    return Object.assign({ key: seg.spot + '@' + seg.a.toFixed(2) }, where, { spot: seg.spot });
}

/* close enough to Sarah to be seen walking (on the big island, neighbors far off just get where they're going) */
function nearSarah(area, x, y) { const p = G.player; return !!p && !!G.area && G.area.id === area && Math.abs(p.x - x) < 44 * TILE && Math.abs(p.y - y) < 36 * TILE; }
/* send an NPC toward a target (walking when Sarah can see it, otherwise just placing them) */
function moveTo(n, want, force) {
    const prevKey = n.spotKey;
    n.spotKey = want.spot || want.key;
    n.segKey = want.key;
    n.want = want;
    n.dancer = !!want.dancer;
    n.fixed = !!want.fixed;
    n.anchor = want.anchor || null;
    n.radius = want.r || 0;
    const here = G.area && G.area.id;
    const visible = !n.sleeping && n.area === here && nearSarah(n.area, n.x, n.y);
    if (want.sleep) {
        if (visible && !force && n.area === 'island' && (n.def.house || n.def.visitor)) {
            // walk home and go inside (visitors head back to the boat at the end of the pier)
            const [tx, ty] = n.def.visitor ? visitorDoor(n.id, 'sleep') : doorTileOf(n.def.house);
            if (walkNpc(n, tx, ty, () => { n.sleeping = true; n.area = null; n.path = null; })) return;
        }
        n.sleeping = true; n.area = null; n.path = null; n.moving = false;
        return;
    }
    const place = () => {
        n.area = want.area; n.sleeping = false;
        const [px, py] = pickSpotPos(n, want);
        n.x = px; n.y = py; n.path = null; n.moving = false;
        if (want.face) { n.dir = want.face; n.flip = want.face === 'left'; }
    };
    if (force || (!visible && want.area !== here)) { place(); return; }
    const [dpx, dpy] = pickSpotPos(n, want);
    const gt = [Math.floor(dpx / TILE), Math.floor((dpy - 2) / TILE)];
    if (n.sleeping) {
        // waking up: come out of the front door (visitors step off the boat at the end of the pier)
        const [tx, ty] = want.area === 'island' && here === 'island' && (n.def.house || n.def.visitor) ? (n.def.visitor ? visitorDoor(n.id, 'wake') : doorTileOf(n.def.house)) : [0, 0];
        if (want.area === 'island' && here === 'island' && (n.def.house || n.def.visitor) && (nearSarah('island', (tx + 0.5) * TILE, ty * TILE) || nearSarah('island', dpx, dpy))) {
            n.area = 'island'; n.sleeping = false;
            n.x = (tx + 0.5) * TILE; n.y = (ty + 0.5) * TILE + 4;
            if (!walkNpc(n, gt[0], gt[1], () => arriveAt(n, want))) place();
            return;
        }
        place();
        return;
    }
    if (n.area === want.area) {
        if ((!visible && !nearSarah(want.area, dpx, dpy)) || !walkNpc(n, gt[0], gt[1], () => arriveAt(n, want))) place();
        return;
    }
    // changing areas: leave through a door Sarah can see, or come in through one
    if (visible) {
        const door = exitDoor(n.area, want.area);
        if (door && walkNpc(n, door[0], door[1], () => { place(); })) return;
        place();
        return;
    }
    if (want.area === here) {
        const door = entryDoor(here, n.area);
        if (door && (nearSarah(here, (door[0] + 0.5) * TILE, door[1] * TILE) || nearSarah(here, dpx, dpy))) {
            n.area = here; n.sleeping = false;
            n.x = (door[0] + 0.5) * TILE; n.y = (door[1] + 0.5) * TILE + 4;
            if (walkNpc(n, gt[0], gt[1], () => arriveAt(n, want))) return;
        }
    }
    place();
}
/* the door tile you walk to in `from` to get to `to`, and the one you appear at (every room's id is its building's id) */
function exitDoor(from, to) {
    if (from === 'island') return bldOf(to) ? doorTileOf(to) : null;
    const a = G.areas[from];
    return a && a.doorTile ? [a.doorTile[0], a.doorTile[1] - 1] : null;
}
function entryDoor(into, from) {
    if (into === 'island') { const b = bldOf(from); return b ? doorTileOf(from) : null; }
    const a = G.areas[into];
    return a && a.doorTile ? [a.doorTile[0], a.doorTile[1] - 1] : null;
}
function arriveAt(n, want) {
    if (want.fixed) { n.x = want.x; n.y = want.y; }
    if (want.face) { n.dir = want.face; n.flip = want.face === 'left'; }
}
function pickSpotPos(n, want) {
    if (want.fixed || !want.anchor) return [want.x, want.y];
    const a = G.areas[want.area];
    const r = mulberry(hash32(n.id + ':' + (n.segKey || '') + ':' + Clock.dayNum()));
    const [ax, ay] = want.anchor, rad = Math.max(1, want.r || 0);
    for (let k = 0; k < 16; k++) {
        const tx = ax + Math.round((r() * 2 - 1) * rad), ty = ay + Math.round((r() * 2 - 1) * rad);
        const px = (tx + 0.5) * TILE, py = (ty + 0.5) * TILE + 4;
        if (a && !a.blockedAt(tx, ty) && (k > 12 || !spotTaken(want.area, px, py, n))) return [px, py];
    }
    const f = a ? a.nearestFree(ax, ay, 4) : null;
    return f ? [(f[0] + 0.5) * TILE, (f[1] + 0.5) * TILE + 4] : [want.x, want.y];
}
/* a little personal space: nobody stands on top of anybody else */
function spotTaken(areaId, px, py, self) {
    for (const o of NPCs.list) {
        if (o === self || o.sleeping || o.area !== areaId) continue;
        if (Math.hypot(o.x - px, o.y - py) < 15) return true;
        if (o.dest && Math.hypot(o.dest[0] - px, o.dest[1] - py) < 15) return true;
    }
    const p = G.player;
    return !!(p && G.area && G.area.id === areaId && Math.hypot(p.x - px, p.y - py) < 13);
}
function walkNpc(n, tx, ty, done) {
    const a = G.areas[n.area];
    if (!a) return false;
    const sx = Math.floor(n.x / TILE), sy = Math.floor((n.y - 2) / TILE);
    let g = [tx, ty];
    if (a.blockedAt(tx, ty)) {
        // doors sit in the building footprint: stand just outside
        if (!a.blockedAt(tx, ty + 1)) g = [tx, ty + 1];
        else { const f = a.nearestFree(tx, ty, 3); if (!f) return false; g = f; }
    }
    const path = findPath(a, sx, sy, g[0], g[1], 24000);
    if (!path) return false;
    if (!path.length) { n.path = null; n.dest = null; if (done) done(); return true; }        // already there
    n.path = path;
    n.dest = [(g[0] + 0.5) * TILE, (g[1] + 0.5) * TILE + 4];
    n.onArrive = done || null;
    n.travel = true;
    return true;
}

/* ---------------------------------------------------------------- per-frame behaviour */
function updateNPC(n) {
    n.t++;
    if (n.emoteT > 0 && --n.emoteT === 0) n.emote = null;
    const d = n.def;
    n.hit.x = n.x - 9; n.hit.y = n.y - n.h - 4; n.hit.w = 18; n.hit.h = n.h + 8;
    // Wonton sits in the middle of the spring, behind its rock rim: he can be talked to from any side of the rim,
    // and a tap walks Sarah to the open ground just below it (the rim itself can't be stood on)
    if (d.spring) { const [wx, wy] = W0.wonton; n.hit = { x: (wx - 5) * TILE, y: (wy - 4) * TILE, w: 10.5 * TILE, h: 8 * TILE }; n.stand = [Math.floor(wx), Math.floor(wy) + 3]; }
    else n.stand = (n.want && n.want.stand) || null;          // staff are talked to across their counter
    if (n.talking || n.script) { n.moving = false; return; }
    const a = G.area;
    if (n.path) { stepNpc(n); return; }
    n.travel = false;
    n.moving = false;
    n.hop *= 0.7;
    // a safety net: nowhere near where they said they'd be, and not on their way there? Off they go (after a few
    // seconds, so a chat with a friend can wrap up first)
    const w = n.want;
    if (w && !w.sleep && w.area === n.area && !n.chat && !n.dancer && !w.playing && !isSeated(n)) {
        const tx = n.anchor ? (n.anchor[0] + 0.5) * TILE : w.x, ty = n.anchor ? (n.anchor[1] + 0.5) * TILE : w.y;
        const lim = n.anchor ? (Math.max(2, n.radius || 0) + 3) * TILE : 2.5 * TILE;
        if (tx != null && Math.hypot(n.x - tx, n.y - ty) > lim) {
            if (++n.farT > 240) { n.farT = 0; moveTo(n, w); if (n.path) return; }
        } else n.farT = 0;
    }
    if (n.dancer) { n.hop = Math.abs(Math.sin(n.t / 9 + n.x)) * 3; return; }
    if (n.want && n.want.playing) {
        // at an arcade cabinet: bounce a little when it's going well
        if (n.t % 40 === 0 && R() < 0.35) { n.hop = 2.5; if (R() < 0.3) { n.emote = rpick(['note', 'sparkle', 'laugh', 'spicy']); n.emoteT = 50; } }
        return;
    }
    n.sy = isSeated(n) ? n.want.sit.benchY + 0.5 : undefined;
    if (n.chat) { if (n.chat.i >= 0 && (n.t % 50 === 0) && R() < 0.3) { n.emote = rpick(['note', 'laugh', 'heart']); n.emoteT = 40; } return; }
    if (n.fixed || !n.anchor) return;
    // idle: sometimes turn toward whoever is nearby, sometimes wander a little
    if (n.t % 70 === 0) {
        const buddy = NPCs.here().find(o => o !== n && !o.path && Math.hypot(o.x - n.x, o.y - n.y) < 34);
        if (buddy && R() < 0.5) { faceNpc(n, buddy); return; }
    }
    if (n.t % 90 === 0 && R() < (n.want && n.want.jog ? 0.9 : 0.35)) {
        const rad = n.radius || 2;
        const [ax, ay] = n.anchor;
        for (let tries = 0; tries < 6; tries++) {
            const tx = ax + rint(-rad, rad), ty = ay + rint(-rad, rad);
            if (a.blockedAt(tx, ty)) continue;
            const px = (tx + 0.5) * TILE, py = (ty + 0.5) * TILE + 4;
            if (spotTaken(a.id, px, py, n)) continue;
            const path = findPath(a, Math.floor(n.x / TILE), Math.floor((n.y - 2) / TILE), tx, ty, 1500);
            if (path && path.length && path.length < 20) { n.path = path; n.dest = [px, py]; n.onArrive = null; break; }
        }
    }
}
function stepNpc(n) {
    const d = n.def;
    if (!n.path[0]) { n.path = null; return; }
    const [tx, ty] = n.path[0];
    const gx = (tx + 0.5) * TILE, gy = (ty + 0.5) * TILE + 4;
    const dx = gx - n.x, dy = gy - n.y, dist = Math.hypot(dx, dy);
    const jog = n.want && n.want.jog;
    let sp = d.skates ? 1.2 : d.human ? 0.8 : jog ? 1.1 : 0.55;
    if (n.travel && !d.skates) sp *= 1.25;            // a little brisker when they're going somewhere
    if (dist < sp + 0.05) {
        n.x = gx; n.y = gy; n.path.shift();
        if (!n.path.length) { n.path = null; n.dest = null; const cb = n.onArrive; n.onArrive = null; if (cb) cb(); }
    } else { n.x += dx / dist * sp; n.y += dy / dist * sp; }
    n.moving = true;
    n.anim++;
    if (Math.abs(dx) > 0.3) n.flip = dx < 0;
    if (d.human) n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (!d.human) n.hop = Math.abs(Math.sin(n.anim / (jog ? 4 : 6))) * 3;
    if (d.skates && n.anim % 3 === 0) G.fx.push(sparkleFx(n.x + (n.flip ? 6 : -6), n.y - 2));
}
function faceNpc(n, o) {
    const dx = o.x - n.x, dy = o.y - n.y;
    if (n.def.human) n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    n.flip = dx < 0;
}

/* ---------------------------------------------------------------- drawing */
function npcFrame(n) {
    const d = n.def;
    if (d.human) {
        const side = n.dir === 'left' || n.dir === 'right';
        const dd = side ? 'side' : n.dir;
        let b = 'stand';
        if (n.moving && !d.skates) { const k = Math.floor(n.anim / 8) % 4; b = k === 1 ? 'walkA' : k === 3 ? 'walkB' : 'stand'; }
        if (d.skates && n.moving) b = Math.floor(n.anim / 20) % 2 ? 'walkA' : 'stand';
        return [`${d.human}_${dd}_${b}`, n.dir === 'left', dd, false];
    }
    const squash = n.moving ? (n.hop < 1 ? 1 : 0) : (Math.floor(n.t / 40) % 2);
    return [`${d.sprite}_${squash}`, n.flip, 'down', !!squash];
}
function drawNPC(ctx, n) {
    if (hdOn() && hdDrawNPC(ctx, n)) { if (n.def.spring) springWater(ctx, n); return; }       // the HD-2D view's art
    const [f, flip, dir, squashed] = npcFrame(n);
    if (isSeated(n)) {
        const y = Math.round(n.y - n.hop);
        if (n.def.human) {
            // people have a proper sitting frame (legs and all)
            const sit = `${n.def.human}_down_sit`;
            spr(ctx, Assets.has(sit) ? sit : f, n.x, y);
            const acc = npcWearing(n.id);
            if (acc) drawNpcAcc(ctx, n, acc, y + 1, false, 'down', false);
            return;
        }
        // the food folks just settle onto the seat; the bench hides their feet
        drawSeated(ctx, n.want.sit.benchY, () => {
            spr(ctx, f, n.x, y, flip);
            const acc = npcWearing(n.id);
            if (acc) drawNpcAcc(ctx, n, acc, y, flip, dir, squashed);
        });
        return;
    }
    if (n.def.human && isLounging(n)) {
        // sitting on a picnic blanket
        const y = Math.round(n.y - n.hop), sit = `${n.def.human}_down_sit`;
        spr(ctx, Assets.has(sit) ? sit : f, n.x, y);
        const acc = npcWearing(n.id);
        if (acc) drawNpcAcc(ctx, n, acc, y + 1, false, 'down', false);
        return;
    }
    const y = Math.round(n.y - n.hop);
    if (!n.def.spring) spr(ctx, 'shadow_s', n.x, n.y + 1);
    spr(ctx, f, n.x, y, flip);
    const acc = npcWearing(n.id);
    if (acc) drawNpcAcc(ctx, n, acc, y, flip, dir, squashed);
    if (n.def.spring) springWater(ctx, n);
}
/* the water line: Wonton is sitting in the (not soup) spring */
function springWater(ctx, n) {
    const y = Math.round(n.y - n.hop);
    ctx.fillStyle = 'rgba(166,236,224,0.92)';
    ctx.fillRect(Math.round(n.x) - 9, y - 5, 18, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(Math.round(n.x) - 8 + (G.t >> 4) % 4, y - 5, 5, 1);
    const dh = dayHour();
    if (dh < NPC_DEFS.wonton.wake || dh >= NPC_DEFS.wonton.bed) n.emote = 'zzz';
    else if (n.emote === 'zzz') n.emote = null;
}

/* ---------------------------------------------------------------- accessories friends have given */
const EYE_ACCS = new Set(['glasses', 'sunglasses', 'monocle', 'mustache']);
const FACE_ACCS = EYE_ACCS;
function npcWearing(id) {
    const r = S.npcs && S.npcs[id];
    if (!r || !r.accs || !r.accs.length) return null;
    const day = Clock.dayNum();
    if (r.wearDay === day) return r.wearing || null;
    const rr = mulberry(hash32(S.seed + ':wear:' + id + ':' + day));
    return rr() < 0.55 ? r.accs[Math.floor(rr() * r.accs.length)] : null;
}
function drawNpcAcc(ctx, n, acc, y, flip, dir, squashed) {
    const d = n.def;
    const key = d.human || d.sprite;
    const A = (GD.npcAcc && GD.npcAcc[key]) || { hat: 0, eye: 0, dx: 0 };
    const eye = EYE_ACCS.has(acc);
    let dd = dir, dx = A.dx, dy = eye ? A.eye : A.hat;
    if (d.goat) {                         // the goat is drawn side-on, head at the front
        dd = 'side'; dx = 1; dy = eye ? 5 : 8;
    }
    if (dd === 'up' && eye) return;
    if (squashed) dy += 1;
    const name = `acc_${acc}_${dd}`;
    if (!Assets.has(name)) return;
    spr(ctx, name, n.x + (flip ? -dx : dx), y + dy, flip);
}

function sparkleFx(x, y) {
    const cols = ['#ff5a6a', '#ffa24a', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0'];
    const c = cols[(G.frame >> 2) % cols.length];
    return { x, y, t: 0, life: 26, draw(ctx) { ctx.fillStyle = c; ctx.globalAlpha = 1 - this.t / this.life; ctx.fillRect(Math.round(this.x), Math.round(this.y - this.t * 0.3), 2, 2); ctx.globalAlpha = 1; } };
}

/* ---------------------------------------------------------------- who's up (for the phone) */
function wakeBed(id) {
    const p = Plans.get(id);
    if (p.away) return null;
    return { wake: p.wake, bed: p.bed };
}

