/* ---- 6zg_townhall.js ---- */
/* The Town Hall, for real (on beta with the civic buildings: CIVIC_PREVIEW): ordinances that change the island from the
   next morning (Early Bird and Night Owl move the shops' hours and when the neighbors wake and go to bed, Community
   Spirit gets them chatting more, Nature Conservation grows trees and flowers faster and brings out more wildlife), the
   census, the island's history (a timeline written as things happen), its records, statistics and achievements, new
   names for the landmarks (on the map), holding a holiday Sarah missed (up to a week late, on a day with no holiday of
   its own), the island flag and the backups. The island is Sarah's: a visitor can look but not change it. */
const ORD_PRICE = 20000;
const ORDINANCES = [['none', 'No ordinance', 'The island as it is.'], ['early', 'Early Bird', 'Shops open two hours earlier, and neighbors wake up and go to bed earlier.'],
    ['night', 'Night Owl', 'Shops stay open three hours later, and neighbors stay up later (and sleep in).'],
    ['spirit', 'Community Spirit', 'Neighbors stop to chat with each other more, and walk over to friends more often.'],
    ['nature', 'Nature Conservation', 'Young trees grow in two days, picked flowers come back sooner, and there is more wildlife about.']];
/* the landmarks that can be renamed: their key, what they're called now (the map's names) */
const LANDMARKS = [['pond', 'Pond'], ['forest', 'Forest'], ['mountain', 'Mountain'], ['lookout', 'Lookout'], ['waterfall', 'Waterfall'], ['beach', 'Beach'],
    ['orchard', 'Orchard'], ['glade', 'The glade'], ['eastmeadow', 'East meadow'], ['oldtree', 'Old tree'], ['campsite', 'Campsite'], ['spring', 'Hot spring']];
/* the holidays big enough to hold late */
const BIG_HOLIDAYS = ['egghunt', 'fishoff', 'oceansday', 'earthday', 'halloween', 'toyday', 'feastday', 'harvest', 'flowerfest', 'winterfest', 'lights', 'blossom', 'stargazing'];
const FLAG_W = 16, FLAG_H = 10, FLAG_PAL = ['#fbf8f2', '#e8443a', '#f4c040', '#4aa85a', '#3a7ad8', '#9a5ad8', '#f49ac0', '#3b2a2a'];

function town() {
    const T = S.town || (S.town = {});
    if (!T.ord) T.ord = { now: 'none', next: null, from: 0, day: -1 };
    if (!T.names) T.names = {};
    if (!T.log) T.log = [];
    if (!T.played) T.played = [];
    if (!T.held) T.held = {};
    return T;
}
/* the ordinance in effect today (a new one starts the morning after it's enacted) */
function townOrd() {
    const T = S && S.town && S.town.ord;
    if (!T || !CIVIC_PREVIEW) return 'none';
    return T.next && Clock.dayNum() >= T.from ? T.next : T.now;
}
/* when the neighbors wake and go to bed (22_npc.js makePlan), and the shops' hours (6z_shops.js roomHours) */
function townWake(wake, bed, id) {
    const o = townOrd();
    if (o === 'early') { wake -= 1.5; bed -= 1; }
    if (o === 'night') { wake += 1; bed += 1.5; }
    // (a good friend's own hours, asked for at the Town Hall's Residents)
    const sc = CIVIC_PREVIEW && id && S && S.town && S.town.sched && S.town.sched[id];
    if (sc) { wake += sc.w || 0; bed += sc.b || 0; }
    return [Math.max(5, wake), Math.min(28.5, Math.max(wake + 4, bed))];
}
/* the places a good friend likes going in their free time, picked at the Residents screen (up to two) */
const RES_SPOTS = { plaza: 'The square', beach: 'The beach', pier: 'The pier', pond: 'The pond', waterfall: 'The waterfall', meadow: 'The meadow', lookout: 'The lookout',
    harbor: 'The harbor', boardwalk: 'The Boardwalk', orchard: 'The orchard', farm: 'The farm', oldtree: 'The old tree', statue: 'The Market Lane lawn', bonfire: 'The bonfire' };
function townSpots(id) {
    const sc = CIVIC_PREVIEW && id && S && S.town && S.town.sched && S.town.sched[id];
    return sc && sc.spots ? sc.spots.filter(k => W0.spots[k]) : [];
}
/* what a good friend does more often, or never, with nothing to do, picked at the Residents screen (2 more, 0 never,
   null as usual: Design.likeWeight and likeChance, 6zza_designer.js, weigh it in) */
function townLike(id, k) {
    const sc = CIVIC_PREVIEW && id && S && S.town && S.town.sched && S.town.sched[id], v = sc && sc.acts && sc.acts[k];
    return v === 0 || v === 2 ? v : null;
}
function townHours(id, h) {
    const o = townOrd();
    if (!h || id === 'club' || (o !== 'early' && o !== 'night')) return h;
    return o === 'early' ? [Math.max(5, h[0] - 2), h[1]] : [h[0], Math.min(28.5, h[1] + 3)];
}
function landmarkName(key, fallback) { return (S && S.town && S.town.names && S.town.names[key]) || fallback; }
/* a line in the island's history */
function townLog(text, day) {
    if (!S || Online.visitor()) return;
    const T = town(), d = day == null ? Clock.dayNum() : day;
    if (T.log.some(l => l.text === text)) return;
    T.log.push({ day: d, text });
    T.log.sort((a, b) => a.day - b.day);
    if (T.log.length > 200) T.log.splice(1, T.log.length - 200);
    Save.touch();
}
/* each morning (54_events.js): the day counts as played, the ordinance turns over, a holiday held late ends */
function townTick() {
    if (!S || !CIVIC_PREVIEW) return;
    const T = town(), day = Clock.dayNum();
    if (!T.played.includes(day)) { T.played.push(day); while (T.played.length > 40) T.played.shift(); }
    if (T.ord.next && day >= T.ord.from) { T.ord.now = T.ord.next; T.ord.next = null; }
    if (!T.log.length && S.startDay) townLog(`${S.playerName || 'Sarah'} arrives on ${S.islandName || 'the island'} with a suitcase and a lot of hope.`, S.startDay);
    // the island's month-day: every month on the day she arrived
    if (S.startDay && day > S.startDay) {
        const a = new Date(S.startDay * 86400e3), t = new Date(day * 86400e3);
        if (a.getUTCDate() === t.getUTCDate() && !Online.visitor()) {
            const months = (t.getUTCFullYear() - a.getUTCFullYear()) * 12 + t.getUTCMonth() - a.getUTCMonth();
            if (months > 0 && months % 12) sendMail({ from: 'floret', subject: `${months} ${plural(months, 'month')} on the island`, body: `Dear ${S.playerName || 'Sarah'},\nThe Cozy Council notes that today you have lived on ${S.islandName || 'the island'} for ${months} ${plural(months, 'month')}.\nThe Council is very proud. The Council is broccoli, but proud.\nHappy island month-day!\n- Sir Floret, for the Council` });
        }
    }
    Save.touch();
}
/* a holiday held late counts as today's (66_holidays.js holidaysToday, 10_time.js todayEvents) */
function townHeld() {
    const T = S && S.town;
    if (!T || !T.hold || T.hold.day !== Clock.dayNum()) return null;
    return HOLIDAYS.find(h => h.id === T.hold.id) || null;
}
/* holidays missed in the last week (days the island wasn't played) */
function townMissed() {
    const T = town(), today = Clock.dayNum(), out = [];
    for (let d = today - 9; d < today; d++) {
        if (d < (S.startDay || today) || T.played.includes(d)) continue;
        const dt = new Date(d * 86400e3);
        for (const h of holidaysOn(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())) {
            if (!BIG_HOLIDAYS.includes(h.id) || out.some(o => o.h.id === h.id)) continue;
            if (T.held[h.id + ':' + dt.getUTCFullYear()]) continue;
            out.push({ h, day: d, ago: today - d, year: dt.getUTCFullYear() });
        }
    }
    return out;
}
function townVisitorNote(b) { if (Online.visitor()) { CV.banner(b, 'info', `Only ${Online.name('sarah')} can change the island. You can look, though!`); return true; } return false; }

/* ---------------------------------------------------------------- the screens */
CIVIC_LIVE.ordinance = {
    draw(b, f, redraw) {
        const T = town(), now = townOrd(), want = this.pick || T.ord.next || now;
        const list = CV.list(b);
        for (const [id, n, t] of ORDINANCES) {
            const tag = id === now ? el('span', 'cv-pill ok', 'In effect') : id === T.ord.next ? el('span', 'cv-pill', 'Starts tomorrow') : null;
            const r = CV.row(list, null, n, t, tag, () => { this.pick = id; redraw(); });
            if (id === want) r.classList.add('sel');
        }
        CV.note(b, `Enacting an ordinance costs ${fmtNum(ORD_PRICE)} sand dollars (going back to no ordinance is free). It starts tomorrow morning.`);
        if (townVisitorNote(b)) return;
        const say = bankMsg(b);
        f.appendChild(btn('Enact', 'green', () => {
            const id = this.pick;
            if (!id || id === (T.ord.next || now)) return say('info', 'Pick a different ordinance first.');
            if (T.ord.day === Clock.dayNum()) return say('warn', 'The ordinance already changed today. The Council can change it again tomorrow.');
            const cost = id === 'none' ? 0 : ORD_PRICE;
            if (S.money < cost) return say('err', `You need ${fmtNum(ORD_PRICE)} sand dollars to enact an ordinance. You have ${fmtNum(S.money)}.`);
            if (cost) addMoney(-cost, true, 'Town Hall');
            T.ord.next = id; T.ord.from = Clock.dayNum() + 1; T.ord.day = Clock.dayNum();
            const name = ORDINANCES.find(o => o[0] === id)[1];
            townLog(id === 'none' ? 'The island goes back to no ordinance.' : `The Council enacts ${name}.`);
            Sfx.play('fanfare'); Save.touch();
            this.pick = null;
            redraw();
            UI.toast(id === 'none' ? 'Back to no ordinance, from tomorrow.' : `${name} starts tomorrow morning!`, 'app_calendar');
        }));
    },
};
CIVIC_LIVE.census = {
    draw(b) {
        const ids = NEIGHBORS.concat(['joe']).filter(id => NPC_DEFS[id]);
        CV.h(b, `Island census · ${ids.length + 1} residents (and a goat)`);
        const list = CV.list(b);
        CV.row(list, sarahPreview ? sarahPreview(40) : null, S.playerName || 'Sarah', `Lives here since ${dayDate(S.startDay || Clock.dayNum())}`, el('span', 'cv-pill ok', 'You'));
        for (const id of ids) {
            const d = NPC_DEFS[id], r = S.npcs[id], met = r && r.met;
            const day = HOLIDAYS.find(h => h.npc === id);
            const h = met ? Math.min(5, hearts(id)) : 0;
            const hs = el('span', 'cv-hearts', met ? '♥'.repeat(h) + '♡'.repeat(5 - h) : 'Not met');
            const wake = `${fmtOpen(d.wake)} to ${fmtOpen(d.bed)}`, bf = bestFriendOf(id);
            CV.row(list, d.human ? `${d.human}_down_stand` : `${d.sprite}_0`, d.name, (day ? `${day.name}: ${MONTHS[day.m - 1]} ${day.d}` : 'Their day: a mystery') + ` · up ${wake}` + (bf ? ` · close with ${NPC_DEFS[bf].name}` : ''), hs);
        }
        CV.row(list, 'goat_0', 'The goat', 'Birthday: unknown · Favorite thing: everything, eaten');
    },
};
CIVIC_LIVE.history = {
    draw(b, f, redraw, tab) {
        const T = town();
        if (tab === 'Records') {
            const l = CV.list(b), A = arc(), recs = [];
            const best = Object.entries(A.best || {}).sort((a, c) => c[1] - a[1])[0];
            if (best && ARCADE_GAMES[best[0]]) recs.push(['Best arcade score', `${fmtNum(best[1])} at ${ARCADE_GAMES[best[0]].name}`]);
            if (S.rope && S.rope.best) recs.push(['Most jumps at jump rope', fmtNum(S.rope.best)]);
            if (S.council && S.council.best) recs.push(['Best score from the Cozy Council', String(S.council.best)]);
            const fr = NEIGHBORS.filter(id => S.npcs[id] && S.npcs[id].met).sort((a, c) => (S.npcs[c].pts || 0) - (S.npcs[a].pts || 0))[0];
            if (fr) recs.push(['Closest friend', `${NPC_DEFS[fr].name} · ${Math.min(5, hearts(fr))} ${plural(Math.min(5, hearts(fr)), 'heart')}`]);
            const G_ = S.games || {};
            if (G_.derby && G_.derby.most) recs.push(['Most fish in a derby', String(G_.derby.most)]);
            if (G_.seek && G_.seek.fast) recs.push(['Fastest find at hide-and-seek', `${G_.seek.fast} seconds`]);
            const K = S.karaoke && S.karaoke.best ? Object.values(S.karaoke.best) : [];
            if (K.length) recs.push(['Best karaoke rank', K.includes('S') ? 'S' : K.includes('A') ? 'A' : K.includes('B') ? 'B' : 'C']);
            if (!recs.length) { CV.empty(b, 'No records yet. Play a little, and the Council will write them down.'); return; }
            for (const [t, v] of recs) CV.row(l, null, t, v);
            return;
        }
        if (tab === 'Statistics') {
            const st = S.stats || {}, g = el('div', 'cv-stats');
            const rows = [['Days on the island', daysPlayed()], ['Hours played', Math.floor((st.playMs || 0) / 3600e3)], ['Fish caught', st.fish], ['Beach finds', st.shell], ['Fruit picked', st.fruit],
                ['Things sold', st.sold], ['Dishes cooked', st.cooked], ['Gifts given', st.gifts], ['Hugs', st.hugs], ['Letters mailed', st.letters], ['Arcade games', st.arcade], ['Games with neighbors', st.islandGames],
                ['Dances', st.dances], ['Songs sung', st.karaoke], ['Wood chopped', st.wood], ['Gems found', st.gem]];
            for (const [t, v] of rows) { const c = el('div'); c.appendChild(el('b', null, fmtNum(v || 0))); c.appendChild(el('span', null, t)); g.appendChild(c); }
            b.appendChild(g);
            const F = S.bank && S.bank.flow;
            if (F) CV.note(b, `Sand dollars earned since the Bank started keeping track: ${fmtNum(Object.values(F.in).reduce((a, v) => a + v, 0))}.`);
            return;
        }
        if (tab === 'Achievements') {
            const l = CV.list(b), ids = Object.keys(SPECIALS), have = ids.filter(id => hasSpecial(id));
            CV.note(b, `${have.length} of ${ids.length} special things earned.`);
            for (const id of have.concat(ids.filter(id => !hasSpecial(id)).slice(0, 12))) {
                const sp = SPECIALS[id], got = hasSpecial(id);
                CV.row(l, null, got ? sp.name : '???', got ? (specials()[id].how || sp.hint) : sp.hint, got ? el('span', 'cv-pill ok', 'Earned') : el('span', 'cv-pill', 'Not yet'));
            }
            return;
        }
        if (!T.log.length) townTick();
        if (!T.log.length) { CV.empty(b, "The island's story is just beginning. Every big day goes here."); return; }
        const ol = el('ol', 'cv-timeline');
        for (const L of T.log.slice().reverse()) { const li = el('li'); li.appendChild(el('b', null, `Day ${L.day - (S.startDay || L.day) + 1} · ${dayDate(L.day)}`)); li.appendChild(el('span', null, L.text)); ol.appendChild(li); }
        b.appendChild(ol);
    },
};
CIVIC_LIVE.rename = {
    draw(b, f, redraw) {
        const T = town(), pick = this.pick || LANDMARKS[0][0];
        const l = CV.list(b);
        for (const [k, n] of LANDMARKS) {
            const r = CV.row(l, null, landmarkName(k, n), T.names[k] ? `Was: ${n}` : 'Its name on the map', null, () => { this.pick = k; redraw(); });
            if (k === pick) r.classList.add('sel');
        }
        if (townVisitorNote(b)) return;
        const cur = LANDMARKS.find(x => x[0] === pick);
        const inp = CV.field(b, `New name for ${landmarkName(pick, cur[1])}`, '', 'A new name', { max: 24 });
        const say = bankMsg(b);
        f.appendChild(btn('Rename', 'green', () => {
            const v = inp.value.trim().replace(/\s+/g, ' ');
            if (!/[a-z]/i.test(v) || v.length > 24) return say('err', 'A name needs a letter or two (and at most 24). Try again!');
            const old = landmarkName(pick, cur[1]);
            T.names[pick] = v;
            townLog(`${old} is renamed ${v}.`);
            Sfx.play('fanfare'); Save.touch(); redraw();
            UI.toast(`${old} is now ${v}. It's on the map.`, 'app_paths');
        }));
        if (T.names[pick]) f.appendChild(btn('Back to the old name', 'alt', () => { delete T.names[pick]; Save.touch(); redraw(); }));
    },
};
CIVIC_LIVE.holidays = {
    draw(b, f, redraw) {
        const T = town(), miss = townMissed(), held = townHeld();
        if (held) CV.banner(b, 'ok', `Today: ${held.name} (moved here by the Town Hall, because ${S.playerName || 'Sarah'} missed it).`);
        if (!miss.length) { CV.empty(b, 'No missed holidays. You were here for all of them!', 'ui_present'); return; }
        const today = holidaysToday().filter(h => h.id !== 'fireflies');
        const l = CV.list(b);
        for (const m of miss) {
            const late = m.ago > 7;
            const tag = late ? el('span', 'cv-pill', 'Too late') : el('span', 'cv-pill ok', 'Hold it today');
            CV.row(l, holidayIcon(m.h), m.h.name, late ? `Missed ${m.ago} days ago` : `Missed ${m.ago} ${plural(m.ago, 'day')} ago · can still be held for ${7 - m.ago} more ${plural(7 - m.ago, 'day')}`, tag, late || today.length || Online.visitor() ? null : () => {
                T.hold = { id: m.h.id, day: Clock.dayNum() };
                T.held[m.h.id + ':' + m.year] = true;
                G.events = todayEvents();
                try { decorateIsland(G.areas.island); festTick(); } catch (e) { console.error(e); }
                townLog(`${m.h.name} is held ${m.ago} ${plural(m.ago, 'day')} late, by order of the Town Hall.`);
                Sfx.play('fanfare'); Save.touch(); redraw();
                UI.toast(`${m.h.name} is today!`, holidayIcon(m.h));
            });
        }
        if (today.length) CV.banner(b, 'warn', `Today is already ${today[0].name}. A missed holiday can only be held on a day without one.`);
        else CV.note(b, 'A missed holiday can be held up to a week after, on a day with no holiday of its own. Tap one to hold it today.');
        townVisitorNote(b);
    },
};
CIVIC_LIVE.flag = {
    draw(b, f, redraw) {
        const T = town();
        if (!this.cells) this.cells = T.flag ? T.flag.split('').map(Number) : Array.from({ length: FLAG_W * FLAG_H }, (_, i) => (Math.floor(i / FLAG_W) >= 7 ? 3 : 4));
        const cells = this.cells;
        let pick = this.brush == null ? 1 : this.brush;
        const grid = el('div', 'cv-flag'); grid.style.gridTemplateColumns = `repeat(${FLAG_W}, 1fr)`;
        cells.forEach((c, i) => { const p = el('button', 'cv-px'); p.type = 'button'; p.style.background = FLAG_PAL[c]; p.addEventListener('click', () => { cells[i] = this.brush == null ? 1 : this.brush; p.style.background = FLAG_PAL[cells[i]]; }); grid.appendChild(p); });
        b.appendChild(grid);
        const sw = el('div', 'swatches');
        FLAG_PAL.forEach((c, k) => { const s = el('button', 'swatch' + (k === pick ? ' on' : '')); s.type = 'button'; s.style.background = c; s.addEventListener('click', () => { this.brush = k; sw.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); s.classList.add('on'); }); sw.appendChild(s); });
        b.appendChild(sw);
        CV.note(b, T.flag ? 'The island flag hangs in the Town Hall. Change a square or two and raise it again.' : 'Tap a color, then the squares. Raise it and it hangs in the Town Hall.');
        if (townVisitorNote(b)) return;
        f.appendChild(btn('Raise the flag', 'green', () => {
            const first = !T.flag;
            T.flag = cells.join('');
            if (first) townLog('The island raises its own flag.');
            townFlagSprite();
            if (G.areas.townhall) G.areas.townhall.stale = true;
            Sfx.play('fanfare'); Save.touch();
            UI.toast('The flag is up!', 'app_edit');
        }));
        f.appendChild(btn('Start over', 'alt', () => { this.cells = null; redraw(); }));
    },
};
/* the flag hung in the Town Hall: a wall piece whose picture is made from the flag (Assets.dyn) */
ITEMS.island_flag = { name: 'Island flag', type: 'furniture', price: 0, icon: 'f_island_flag' };
FURN.island_flag = { id: 'island_flag', name: 'Island flag', w: 1, h: 1, kind: 'wall', price: 0, sets: ['council'], fixture: true };
function townFlagSprite() {
    const T = S && S.town;
    if (!T || !T.flag) return false;
    if (Assets.dyn.f_island_flag && Assets.dyn.f_island_flag.flag === T.flag) return true;
    const c = document.createElement('canvas'); c.width = 16; c.height = 16;
    const g = c.getContext('2d'), cells = T.flag.split('').map(Number);
    g.fillStyle = '#7a5234'; g.fillRect(0, 1, 1, 15);                 // a little pole on the left
    g.fillStyle = '#e8c070'; g.fillRect(0, 0, 1, 1);
    // the cloth, one square a pixel, a slight wave
    cells.forEach((v, i) => { const x = i % FLAG_W, y = Math.floor(i / FLAG_W); if (x >= 15) return; g.fillStyle = FLAG_PAL[v]; g.fillRect(1 + x, 2 + y + (x > 4 && x < 11 ? 1 : 0), 1, 1); });
    Assets.dyn.f_island_flag = { c, w: 16, h: 16, ax: 8, ay: 15, flag: T.flag };
    return true;
}
/* the flag as a picture (for the Town Hall's wall) */
function flagCanvas(scale) {
    const T = S && S.town, k = scale || 2;
    const cells = T && T.flag ? T.flag.split('').map(Number) : null;
    if (!cells) return null;
    const c = document.createElement('canvas'); c.width = FLAG_W * k; c.height = FLAG_H * k;
    const g = c.getContext('2d');
    cells.forEach((v, i) => { g.fillStyle = FLAG_PAL[v]; g.fillRect((i % FLAG_W) * k, Math.floor(i / FLAG_W) * k, k, k); });
    return c;
}
/* Residents: for good friends (three hearts), when they wake and go to bed, what they wear today and their catchphrase */
CIVIC_LIVE.residents = {
    draw(b, f, redraw) {
        const T = town(), ids = NEIGHBORS.filter(id => S.npcs[id] && S.npcs[id].met && NPC_DEFS[id]);
        if (!ids.length) { CV.empty(b, 'Meet the neighbors first!', 'app_friends'); return; }
        const pick = ids.includes(this.pick) ? this.pick : ids[0], d = NPC_DEFS[pick], h = Math.min(5, hearts(pick));
        const who = el('div', 'st-row');
        for (const id of ids) who.appendChild(chip(NPC_DEFS[id].name, () => { this.pick = id; redraw(); }, id === pick ? 'on' : ''));
        b.appendChild(who);
        const l = CV.list(b);
        CV.row(l, d.human ? `${d.human}_down_stand` : `${d.sprite}_0`, d.name, null, el('span', 'cv-hearts', '\u2665'.repeat(h) + '\u2661'.repeat(5 - h)));
        if (h < 3) { CV.banner(b, 'warn', `${d.name} needs to be good friends with you first (three hearts).`); return; }
        if (townVisitorNote(b)) return;
        const sc = (T.sched = T.sched || {})[pick] || { w: 0, b: 0 };
        const row = (label, key, base) => {
            const r = el('div', 'st-row'); r.appendChild(el('b', null, `${label}: ${fmtOpen(base + (sc[key] || 0))}`));
            for (const [t, dv] of [['Earlier', -0.5], ['Later', 0.5]]) r.appendChild(chip(t, () => {
                const v = Math.max(-2, Math.min(2, (sc[key] || 0) + dv));
                T.sched[pick] = Object.assign({ w: 0, b: 0 }, sc, { [key]: v }); Save.touch(); redraw();
            }));
            b.appendChild(r);
        };
        CV.h(b, 'Their hours');
        row('Wakes up', 'w', d.wake); row('Goes to bed', 'b', d.bed);
        CV.note(b, 'Up to two hours either way. It starts tomorrow (today they already have plans).');
        // where they like to go when they're free (two at most: they still go everywhere else too, just less)
        CV.h(b, 'Where they like to go');
        const mine = sc.spots || [], sp = el('div', 'st-row');
        for (const k of Object.keys(RES_SPOTS).filter(k => W0.spots[k])) sp.appendChild(chip(landmarkName(k, RES_SPOTS[k]), () => {
            const on = mine.includes(k), next = on ? mine.filter(x => x !== k) : mine.concat([k]).slice(-2);
            T.sched[pick] = Object.assign({ w: 0, b: 0 }, sc, { spots: next }); if (!next.length) delete T.sched[pick].spots;
            Save.touch(); redraw();
        }, mine.includes(k) ? 'on' : ''));
        b.appendChild(sp);
        CV.note(b, mine.length ? `${d.name} will spend more of their free time there, from tomorrow.` : 'Pick up to two places they\'ll go more often when they\'re free.');
        // what they do with nothing to do: more often, as usual or never (33kd_doll_idle.js)
        CV.h(b, 'What they like doing');
        const acts = sc.acts || {}, ar = el('div', 'st-row');
        for (const k of Object.keys(LIKE_ACTS)) {
            const v = acts[k], word = v === 2 ? 'more often' : v === 0 ? 'never' : 'as usual';
            ar.appendChild(chip(`${LIKE_ACTS[k]}: ${word}`, () => {
                const next = Object.assign({}, acts), nv = v == null ? 2 : v === 2 ? 0 : null;
                if (nv == null) delete next[k]; else next[k] = nv;
                T.sched[pick] = Object.assign({ w: 0, b: 0 }, sc, { acts: next }); if (!Object.keys(next).length) delete T.sched[pick].acts;
                Save.touch(); redraw();
            }, v === 2 ? 'on' : v === 0 ? 'off' : ''));
        }
        b.appendChild(ar);
        CV.note(b, 'Tap to go round: more often, never, as usual.');
        if (sc.w || sc.b || mine.length || sc.acts) f.appendChild(btn('Back to their own ways', 'alt', () => { delete T.sched[pick]; Save.touch(); redraw(); }));
        const r = S.npcs[pick];
        CV.h(b, 'What they wear');
        if (!r.accs || !r.accs.length) CV.note(b, `Give ${d.name} a hat or glasses as a present and they can wear it.`);
        else {
            const now = npcWearing(pick), w = el('div', 'st-row');
            for (const acc of [null].concat(r.accs)) w.appendChild(chip(acc ? cap(acc.replace(/_/g, ' ')) : 'Nothing today', () => { r.wearDay = Clock.dayNum(); r.wearing = acc; Save.touch(); redraw(); }, acc === now ? 'on' : ''));
            b.appendChild(w);
            CV.note(b, 'Just for today: tomorrow they pick for themselves again.');
        }
        // (their catchphrase: 6zk_catchphrases.js)
        CV.h(b, 'Their catchphrase');
        const cf = CV.field(b, 'Catchphrase', catchOf(pick) || '', 'A word or two', { max: 16 });
        const cr = el('div', 'st-row');
        cr.appendChild(chip('Teach it', () => { const v = catchClean(cf.value); if (!v) return; r.catch = v; Save.touch(); UI.toast(`${d.name} will try out '${v}'.`); redraw(); }, 'go'));
        if (r.catch) cr.appendChild(chip('Their old one', () => { delete r.catch; Save.touch(); redraw(); }));
        b.appendChild(cr);
    },
};
CIVIC_LIVE.backups = {
    draw(b, f) {
        if (!Cloud.id) { CV.banner(b, 'info', 'This island is only on this device, so there are no backups on the island server.'); return; }
        const box = el('div'); b.appendChild(box);
        CV.loading(box, 'Fetching the backups...');
        Cloud.api('GET', `/api/islands/${encodeURIComponent(Cloud.id)}/backups`).then(r => {
            box.innerHTML = '';
            const list = (r && r.backups) || [];
            if (!list.length) { CV.empty(box, 'No backups yet. The first one is made an hour into playing.'); return; }
            const l = CV.list(box);
            for (const k of list.slice(0, 12)) CV.row(l, null, whenText(k.savedAt || k.at), (BACKUP_REASONS[k.reason] || k.reason || '') + (IslandList.facts(k.summary) ? ' · ' + IslandList.facts(k.summary) : ''));
            CV.note(box, 'The island server keeps a copy every hour while you play, then one a day for two months. To put one back, use Islands on the title screen (or your phone\'s Save & quit).');
        }).catch(() => { box.innerHTML = ''; CV.banner(box, 'warn', "Can't reach the island server. Backups need a connection."); });
    },
};

/* ---------------------------------------------------------------- the history writes itself */
Bus.on('special', id => { if (SPECIALS[id]) townLog(`${S.playerName || 'Sarah'} earns ${SPECIALS[id].name}.`); });
Bus.on('karaoke', r => { if (r && (r.rank === 'S')) townLog(`${S.playerName || 'Sarah'} sings "${r.title}" at Club Wasabi and gets an S.`); });
Bus.on('danced', id => { if (S.dance && S.dance.songs[id] && S.dance.songs[id].rank === 'S' && SONGS[id]) townLog(`${S.playerName || 'Sarah'} dances ${SONGS[id].name} to an S rank.`); });
