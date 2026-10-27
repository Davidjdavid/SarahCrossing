/* ---- 66_holidays.js ---- */
/* Little holidays. Every week or two there's something: a neighbor's special day, a silly day, a festival. Each one
   can decorate the plaza, change something small (hugs count double, soup at Mac's, pirate talk...), give people
   something to say, and it all shows up on the calendar on the island board. */
const HOLIDAYS = [
    { id: 'newyear', name: "New Year's Day", m: 1, d: 1, icon: 'f_firework_poster', note: 'Fireworks at midnight, then everybody sleeps in. (Everybody always sleeps in.)' },
    { id: 'soupday', name: 'Soup Day', m: 1, d: 13, icon: 'dish_tomato_soup', note: "Mac's special is soup. Wonton is staying out of it.",
        hello: 'Happy Soup Day! Mac made a pot the size of a hot tub. Do NOT tell Wonton.',
        chat: [['Happy Soup Day!', "Shh. Wonton's right there.", 'Happy... Warm Liquid Day!']] },
    { id: 'hugday', name: 'Hug Day', m: 1, d: 21, icon: 'f_heart_lamp', note: 'Hugs count double today.', deco: 'hearts',
        hello: 'Happy Hug Day! Hugs count double today. I checked. It is the law.', chat: [['Happy Hug Day!', 'Hug?', 'Hug.']] },
    { id: 'hotsauce', name: 'Hot Sauce Day', m: 1, d: 22, npc: 'chili', note: "Chili's day! Say hi for something spicy." },
    { id: 'shadowday', name: 'Shadow Day', m: 2, d: 2, icon: 'shell_star', note: 'If Cuke sees his shadow at 5 AM, six more weeks of winter.',
        hello: "It's Shadow Day! Cuke saw his shadow at 5 AM. He also saw a bird. He's more excited about the bird." },
    { id: 'valentine', name: "Valentine's Day", m: 2, d: 14, icon: 'f_heart_lamp', note: "Joe has been making a card since dawn. It has a frog on it. (It's for somebody. He won't say who.)" },
    { id: 'piday', name: 'Pi Day', m: 3, d: 14, npc: 'sully', note: "Sully's day. He's a Boston cream pie. (He's a cake. Don't bring it up.)" },
    { id: 'greenday', name: 'Green Day', m: 3, d: 17, icon: 'fl_cosmos_0', deco: 'bunting_green', note: 'Everybody wears green. Cuke has been ready since January.',
        hello: "Happy Green Day! I'm wearing green. Emotionally. Cuke is wearing green physically. He IS green.",
        chat: [['Happy Green Day!', "I'm wearing green socks.", 'Show me.', 'No.']] },
    { id: 'poetryday', name: 'Poetry Day', m: 3, d: 21, npc: 'joe', note: "Joe's day. He'll read you a poem. Lucky you!" },
    { id: 'blossom', name: 'Cherry Blossom Week', m: 3, d: 26, days: 16, icon: 'fl_tulip_2', note: 'Pink petals everywhere. Everyone takes the long way home.' },
    { id: 'prankday', name: 'Prank Day', m: 4, d: 1, icon: 'fl_daisy_1', note: 'Nothing anyone says today is true. Probably.',
        chat: [['The goat can talk now.', 'What did it say?', "Nothing. It's a goat.", '...Prank Day?', 'Prank Day.']] },
    { id: 'pajamaday', name: 'Pajama Day', m: 4, d: 16, icon: 'cloth_pajamas', note: 'Everybody stays in pajamas. Sarah was going to anyway.',
        hello: "Happy Pajama Day! I'm in my pajamas. You can't tell. They're emotional pajamas.", chat: [['Nice pajamas!', "I'm not wearing pajamas.", 'Oh. Nice... outfit.']] },
    { id: 'earthday', name: 'Earth Day', m: 4, d: 22, icon: 'ic_sapling', note: 'Fortune hands out free saplings. Plant something!', deco: 'bunting_green',
        hello: 'Happy Earth Day! Plant something! A tree, a flower, a feeling.', chat: [['Happy Earth Day!', 'I hugged a tree.', 'Did it hug back?', 'Emotionally.']] },
    { id: 'orangeday', name: 'Orange Day', m: 5, d: 4, npc: 'clementine', note: "Clementine's day. Wear orange. She's checking." },
    { id: 'museumday', name: 'Museum Day', m: 5, d: 18, npc: 'brulee', note: "Brulee's day. Donations to the museum count double." },
    { id: 'flowerfest', name: 'Flower Festival', m: 5, d: 20, days: 3, icon: 'fl_lily_2', deco: 'bunting', note: "Every wild flower is blooming, and flower seeds are half price at Fortune's.",
        hello: 'Happy Flower Festival! Every flower on the island is out today. Pick some!', chat: [['The flowers are all out!', 'I picked one for everyone.', 'Even the goat?', 'The goat ate it.']] },
    { id: 'cucumberday', name: 'Cucumber Day', m: 6, d: 14, npc: 'cuke', note: "Cuke's day. He's been up since 4 AM. He's always up since 4 AM." },
    { id: 'sushiday', name: 'Sushi Day', m: 6, d: 18, npc: 'maki', note: "Maki's day. Precisely." },
    { id: 'surfday', name: 'Surf Day', m: 6, d: 20, npc: 'kai', note: "Kai's day. Surf's up. (Kai does not surf. Kai is a bowl.)" },
    { id: 'solstice', name: 'Longest Day', m: 6, d: 21, icon: 'shell_star', note: 'The sun stays up late. So does everyone.',
        hello: 'Happy Longest Day! The sun is staying up late. Finally, it gets us.' },
    { id: 'july4', name: 'Fourth of July', m: 7, d: 4, icon: 'f_firework_poster', deco: 'bunting_july', note: 'Fireworks over the beach after 9 PM.' },
    { id: 'chocday', name: 'Chocolate Day', m: 7, d: 7, npc: 'coco', note: "Coco's day. Expect gossip. Expect chocolate." },
    { id: 'macday', name: 'Mac and Cheese Day', m: 7, d: 14, npc: 'mac', note: "Mac's day! Mac and cheese is free at Mac's." },
    { id: 'cheesecakeday', name: 'Cheesecake Day', m: 7, d: 30, npc: 'cece', note: "Cece's day. She baked. She's apologizing for it." },
    { id: 'friendday', name: 'Friendship Day', m: 8, d: 2, icon: 'ui_present', deco: 'bunting', note: 'Chatting with friends fills hearts faster today.',
        hello: "Happy Friendship Day! You're one of my favorite people. Don't tell the others. (Tell them.)", chat: [['Happy Friendship Day!', "You're my best friend.", "You said that to the goat.", 'The goat is also my best friend.']] },
    { id: 'stargazing', name: 'Stargazing Night', m: 8, d: 12, icon: 'shell_star', note: 'Shooting stars all night long. Make a wish from the lookout!',
        hello: "It's Stargazing Night! Shooting stars all night. I'm going to wish for more nights like this.", chat: [['Did you see that one?', 'I made a wish!', 'What was it?', "Can't tell you. Rules."]] },
    { id: 'goatday', name: 'Goat Day', m: 8, d: 21, icon: 'goat_0', note: "It's a goat. Nothing else to say.", hello: "Happy Goat Day. It's a goat. Nothing else to say.",
        chat: [['Happy Goat Day.', "It's a goat.", 'Nothing else to say.']] },
    { id: 'fortuneday', name: 'Fortune Cookie Day', m: 9, d: 13, npc: 'fortune', note: 'Fortune cracks two fortunes for you today.' },
    { id: 'pirateday', name: 'Pirate Day', m: 9, d: 19, icon: 'shell_bottle', note: 'Everybody talks like a pirate. Arr.',
        hello: 'Ahoy, matey! Happy Pirate Day! Arr! ...I have been saying arr since 5 AM. My throat hurts.', chat: [['Arr!', 'Arr!', "What's arr mean?", 'No idea. Arr!']] },
    { id: 'harvest', name: 'Harvest Festival', m: 9, d: 22, icon: 'f_lunar_lantern', deco: 'lanterns', note: 'Lanterns in the plaza, and the farm fields are at their best.',
        hello: 'Happy Harvest Festival! The fields are full, the lanterns are up. Everything smells like pumpkin.', chat: [['The lanterns are up!', 'The fields look amazing.', 'Harvest vibes.']] },
    { id: 'dumplingday', name: 'Dumpling Day', m: 9, d: 26, npc: 'wonton', note: "Wonton's day. It is NOT Soup Day." },
    { id: 'coffeeday', name: 'Coffee Day', m: 10, d: 1, icon: 'f_coffee_maker', note: 'Sully is having the best day of his life.',
        hello: "Happy Coffee Day! Sully has had six coffees. He's vibrating. Wicked vibrating." },
    { id: 'noodleday', name: 'Noodle Day', m: 10, d: 6, npc: 'basil', note: "Basil's day. The noodle cart has a free bowl for you." },
    { id: 'spooky', name: 'Spooky Season', m: 10, d: 24, days: 8, icon: 'f_pumpkin_lantern', note: 'Pumpkin lanterns around the island.' },
    { id: 'halloween', name: 'Halloween', m: 10, d: 31, icon: 'f_pumpkin_lantern', note: 'Everyone dresses up as themselves. Very scary.' },
    { id: 'kindday', name: 'Kindness Day', m: 11, d: 13, icon: 'ui_present', note: 'Gifts mean a little extra today.', hello: 'Happy Kindness Day! You are doing great. That is my kindness. It is free.' },
    { id: 'gingerday', name: 'Gingerbread Day', m: 11, d: 21, npc: 'ginger', note: "Ginger's day. Her whole farmhouse smells amazing." },
    { id: 'feastday', name: 'Feast Day', rule: 'thanks', icon: 'dish_mac_cheese', deco: 'lanterns', note: "Everything at Mac's is half price. Big dinner tonight!",
        hello: "Happy Feast Day! Everybody's eating at Mac's tonight. Everything's half price. I've been hungry since Tuesday.", chat: [['Feast tonight!', 'I skipped lunch for it.', 'Smart.', 'Hungry.']] },
    { id: 'lights', name: 'Winter Lights', m: 12, d: 10, days: 22, icon: 'f_red_lantern', note: 'Lanterns glow around the plaza every night.' },
    { id: 'cocoanight', name: 'Cocoa Night', m: 12, d: 21, icon: 'f_coffee_maker', note: 'The longest night. Stay in. Drink cocoa. Everybody is up late anyway.',
        hello: "Happy Cocoa Night! Longest night of the year. For us that's... a normal night. With cocoa." },
    { id: 'winterfest', name: 'Winter Holiday', m: 12, d: 24, days: 2, icon: 'f_snow_globe', note: 'Cozy season. Fortune has a present for you.' },
    { id: 'nye', name: "New Year's Eve", m: 12, d: 31, icon: 'f_firework_poster', note: 'Countdown in the plaza at midnight. Island midnight.' },
];
/* a neighbor's own day: they have something for Sarah, and everyone else wishes them well */
const NPC_DAY = {
    chili: ['chili_crisp', "It's Hot Sauce Day! MY day! Here, take this. It's spicy. Everything I give you is spicy."],
    sully: ['chowder', "Pi Day, kid! That's my day. I'm a pie. Don't say cake. Here, have some chowdah."],
    joe: ['framed_poem', "It's Poetry Day! I wrote you a poem. I framed it. The frame is also a poem, emotionally."],
    clementine: ['acc_sunglasses', 'Darling. Orange Day. Wear these. Everything looks more orange through them.'],
    brulee: ['easel', 'Museum Day! My favorite day. Here: an easel for your house. Paint me something?'],
    cuke: ['cucumber', "CUCUMBER DAY! I've been up since 4! Here, a cucumber! It's my cousin! We're not close!"],
    maki: ['nigiri', 'Sushi Day. I made this for you. It is precisely perfect. Please eat it within the hour.'],
    kai: ['ahi_poke', "Surf Day, dude! I don't surf. But I celebrate. Here, poke bowl! Bowl-oha!"],
    coco: ['truffles', "Chocolate Day! My day! Here, truffles. And I have NEWS. The news is: truffles."],
    mac: ['mac_cheese', "Mac and Cheese Day! My day! Here, on the house. Everything's on the house. Mostly cheese."],
    cece: ['cheesecake', "Cheesecake Day! I baked one for you. Sorry if it's not perfect! It's perfect. Sorry!"],
    fortune: [null, ''],
    wonton: ['dumplings', 'Dumpling Day! My day! Here are some dumplings. Eat them dry. NOT in soup.'],
    basil: ['pad_thai', "Noodle Day. My day. Here, a bowl on me. Balanced. Warm. Noodles."],
    ginger: ['gingerbread', "Gingerbread Day! Built these myself. Well, baked. Same thing, basically."],
};

/* ---------------------------------------------------------------- which days are which */
function thanksgiving(y) { const d = new Date(Date.UTC(y, 10, 1)); const first = (4 - d.getUTCDay() + 7) % 7 + 1; return [11, first + 21]; }
function holidayStart(h, y) { return h.rule === 'thanks' ? thanksgiving(y) : h.rule && HOLIDAY_RULES[h.rule] ? HOLIDAY_RULES[h.rule](y, h) : [h.m, h.d]; }
/* holidays on a given date (month 1-12) */
function holidaysOn(y, m, d) {
    const out = [];
    const t = Date.UTC(y, m - 1, d);
    for (const h of HOLIDAYS) {
        const [hm, hd] = holidayStart(h, y);
        const t0 = Date.UTC(y, hm - 1, hd), t1 = t0 + ((h.days || 1) - 1) * 86400e3;
        if (t >= t0 && t <= t1) out.push(h);
    }
    const ln = LUNAR_NEW_YEAR[y];
    if (ln && ln[0] === m && ln[1] === d) out.push({ id: 'lunar', name: 'Lunar New Year', icon: 'f_lunar_lantern', note: 'Wonton hands out red envelopes. Lanterns by the spring.' });
    if (S && S.birthday && S.birthday.m === m && S.birthday.d === d) out.push({ id: 'birthday', name: "Sarah's birthday", icon: 'ui_present', note: 'A party! The whole island knows. Coco made sure.' });
    if (S && S.startDay) {
        const s = new Date(S.startDay * 86400e3);
        if (s.getUTCMonth() + 1 === m && s.getUTCDate() === d && y > s.getUTCFullYear()) out.push({ id: 'islandday', name: 'Island Day', icon: 'f_star_jar', deco: 'bunting', note: 'The day Sarah arrived! The whole island celebrates.',
            hello: 'Happy Island Day! It has been a whole year since you got here! Best year ever.' });
    }
    return out;
}
function holidaysToday() {
    const d = Clock.dayDate(), held = townHeld();           // (a missed holiday held late: 6zg_townhall.js)
    const out = holidaysOn(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (held && !out.includes(held)) out.push(held);
    return out;
}
function holidayIcon(h) { return h.icon || (h.npc && NPC_DEFS[h.npc] ? (NPC_DEFS[h.npc].sprite || h.npc) + '_0' : 'ui_present'); }
function holidayName(h) { return h.name; }

/* today's holiday lines: what neighbors say, and what they say to each other */
function refreshHolidayChat() {
    CHAT_TODAY.length = 0;
    for (const h of holidaysToday()) {
        if (h.chat) CHAT_TODAY.push(...h.chat);
        if (h.npc && NPC_DEFS[h.npc]) {
            const nm = NPC_DEFS[h.npc].name;
            CHAT_TODAY.push([`Did you wish ${nm} a happy ${h.name}?`, 'Twice!', `${nm} cried a little.`], [`It's ${h.name}!`, `${nm}'s day!`, "Let's go say hi."]);
        }
    }
}
/* a holiday greeting for the first chat of the day (null if nothing's on) */
function holidayHello(id) {
    for (const h of holidaysToday()) {
        if (h.npc === id) continue;
        if (h.npc && NPC_DEFS[h.npc]) return `Happy ${h.name}! It's ${NPC_DEFS[h.npc].name}'s day. Did you say hi yet?`;
        if (h.id === 'prankday') return rpick(['Did you hear? The goat can talk now. ...Prank Day!', "I'm moving off the island! ...Prank Day! I'd never.", 'The ocean is soup now. ...Prank Day. Sorry, Wonton.']);
        if (h.hello) return h.hello;
    }
    return null;
}
/* the neighbor whose day it is gives Sarah something */
async function npcDayGift(n) {
    const today = holidaysToday().find(h => h.npc === n.id);
    if (!today) return false;
    const r = rel(n.id), key = 'npcday_' + Clock.dayNum();
    if (r[key]) return false;
    r[key] = true;
    const [gift, line] = NPC_DAY[n.id] || [null, ''];
    n.emote = 'heart'; n.emoteT = 90;
    await UI.say(n.id, line || `It's ${today.name}! My day! Thank you for remembering!`, { keep: true });
    if (gift && ITEMS[gift]) { receive(gift, 1); Sfx.play('fanfare'); }
    const up = addPts(n.id, 4);
    if (up) await heartUp(n, up);
    return true;
}
function isHoliday(id) { return G.events && G.events.has(id); }

/* ---------------------------------------------------------------- the island board: today, a calendar, opening hours */
const PLACE_HOURS = [
    ['shop', "Fortune's Goods", 'shop'], ['boutique', "Clementine's", 'boutique'], ['studio', "Sully's Pottery Studio", 'studio'],
    ['arcade', 'The Arcade', 'arcade', 'Chili runs the prize counter most afternoons.'], ['builder', "Ginger's Workshop", 'builder'],
    ['museum', 'The Museum', 'museum'], ['restaurant', "Mac's", 'restaurant', 'Breakfast, lunch and dinner.'], ['salon', 'Floss & Gloss', 'salon'],
    ['displays', "Waffle's Island Displays", 'displays'],
];
function dayNumOf(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 86400e3); }
/* everything happening on a date, for the calendar */
function dayEvents(y, m, d) {
    const out = holidaysOn(y, m, d).map(h => ({ icon: holidayIcon(h), name: h.name, note: h.note || (h.npc && NPC_DEFS[h.npc] ? `${NPC_DEFS[h.npc].name}'s day!` : '') }));
    const dn = dayNumOf(y, m, d);
    const dr = typeof Drama !== 'undefined' && S.drama ? Drama.cur() : null;
    if (dr && dr.pday === dn && (dr.tpl === 'party' || dr.tpl === 'lostinvite') && ['announce', 'party', 'fixed', 'partyfixed'].includes(dr.state))
        out.push({ icon: 'f_red_lantern', name: Drama.fill(dr, "{A}'s party"), note: Drama.fill(dr, '8 PM at the {place}. Everyone is invited.') });
    out.push(...vacationEvents(dn));
    return out;
}
function boardTodayLines() {
    const st = shopStock(), lines = [];
    const w = { sunny: 'sunny', cloudy: 'cloudy', rain: 'rainy', snow: 'snowy' }[G.weather];
    lines.push(`Today is ${Clock.dateLine()}. It will be ${w}.`);
    lines.push(`Fortune's hot item: ${itemName(st.hot)}. She pays double for it.`);
    for (const vis of visitorsToday()) lines.push(`Boat schedule: ${visitNote(vis)}`);
    for (const v of vacationEvents(Clock.dayNum())) lines.push(`${v.name}. ${v.note}`);
    for (const h of holidaysToday()) lines.push(`Today: ${h.name}! ${h.note || ''}`);
    const m = typeof todaysMenu === 'function' ? todaysMenu() : null;
    if (m) lines.push(`Mac's special: ${itemName(m.special)}. Cece's dessert: ${itemName(m.dessert).toLowerCase()}.`);
    const d = Drama.cur();
    if (d && (d.tpl === 'party' || d.tpl === 'lostinvite') && ['announce', 'party', 'fixed', 'partyfixed'].includes(d.state)) { lines.push(Drama.fill(d, "PARTY! {A}'s party, {pday} at 8 PM, at the {place}. Everyone welcome. (Snacks.)")); Drama.note(d); }
    if (d && d.tpl === 'rivalry' && d.state !== 'result' && d.state !== 'tie') lines.push(Drama.fill(d, 'A {contest}: {A} vs. {B}. {cdayName}, at the beach. Come watch!'));
    if (ropeDay()) { const rd = ropeDay(); lines.push(`Jump rope in the plaza, 2:30 to 5:30 PM! ${NPC_DEFS[rd.a].name} and ${NPC_DEFS[rd.b].name} are turning.`); }
    const lc = S.lost && S.lost.cur;
    if (lc && !lc.found) lines.push(`LOST: ${ITEMS[lc.id].name}. Last seen: who knows. If you find it, please bring it back! (${NPC_DEFS[lc.owner].name} is very sad about it.)`);
    return lines;
}
async function readBoard() {
    Sfx.play('item');
    await openBoard();
}
function openBoard(fromPhone) {
    return new Promise(res => {
        const now = Clock.dayDate();
        let y = now.getFullYear(), m = now.getMonth() + 1, sel = now.getDate();
        const tabs = el('div', 'tabs');
        let tab = 'today';
        const P = UI.open({ title: 'Island Board', tabs, onClose: res, back: fromPhone === true ? () => { UI.close(true); res(); appToday(); } : null });
        const draw = () => {
            tabs.innerHTML = '';
            for (const [k, label] of [['today', 'Today'], ['calendar', 'Calendar'], ['hours', 'Opening hours']]) {
                const b = el('button', 'tab' + (k === tab ? ' on' : ''), label);
                b.type = 'button';
                b.addEventListener('click', () => { tab = k; draw(); });
                tabs.appendChild(b);
            }
            P.body.innerHTML = '';
            if (tab === 'today') {
                const box = el('div', 'boardnotes');
                for (const l of boardTodayLines()) box.appendChild(el('p', null, fillText(l)));
                P.body.appendChild(box);
                const soon = [];
                for (let k = 1; k <= 14 && soon.length < 4; k++) {
                    const dt = new Date((Clock.dayNum() + k) * 86400e3);
                    for (const h of holidaysOn(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())) if (!soon.some(s => s[1].name === h.name)) soon.push([k, h]);
                }
                if (soon.length) {
                    P.body.appendChild(el('p', 'artcap', 'Coming up'));
                    const list = el('div', 'list');
                    for (const [k, h] of soon) {
                        const row = el('div', 'row');
                        row.appendChild(iconCanvas(holidayIcon(h), 40));
                        const t = el('div', 't');
                        t.appendChild(el('b', null, h.name));
                        t.appendChild(el('span', null, (k === 1 ? 'Tomorrow' : `In ${k} days`) + ' \u00b7 ' + (h.note || '')));
                        row.appendChild(t);
                        list.appendChild(row);
                    }
                    P.body.appendChild(list);
                }
                return;
            }
            if (tab === 'hours') {
                P.body.appendChild(el('p', 'muted', `Island time. It's ${Clock.fmt().s} now.`));
                const list = el('div', 'list');
                const addRow = (name, hours, open, extra) => {
                    const row = el('div', 'row');
                    const t = el('div', 't');
                    t.appendChild(el('b', null, name));
                    t.appendChild(el('span', null, hours + (extra ? ' \u00b7 ' + extra : '')));
                    row.appendChild(t);
                    row.appendChild(el('span', 'openbadge' + (open ? ' on' : ''), open ? 'Open' : 'Closed'));
                    list.appendChild(row);
                };
                const dh = dayHour();
                const hl = h => { const x = h % 24; return x === 12 ? 'noon' : x === 0 ? 'midnight' : fmtDayHour(h); };
                for (const [id, name, , extra] of PLACE_HOURS) { const h = roomHours(id); addRow(name, `${hl(h[0])} to ${hl(h[1])}`, roomOpen(id), extra); }
                addRow("Basil's noodle cart", '8 PM to 1 AM, in the plaza', hourIn(Clock.hourF(), 20, 25), '');
                addRow('Club Wasabi', 'Always open. Gets going after 9 PM', true, 'Karaoke every night.');
                addRow('Joe at the pier', 'Sunset, around 6 PM', dh >= 18 && dh < 19.6, 'He may read you a poem.');
                P.body.appendChild(list);
                return;
            }
            // calendar
            const head = el('div', 'calhead');
            const move = k => { m += k; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } sel = null; draw(); };
            head.appendChild(btn('\u2039', 'alt', () => move(-1)));
            head.appendChild(el('b', null, `${MONTHS[m - 1]} ${y}`));
            head.appendChild(btn('\u203a', 'alt', () => move(1)));
            P.body.appendChild(head);
            const grid = el('div', 'cal');
            for (const w of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) grid.appendChild(el('div', 'calw', w));
            const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), days = new Date(Date.UTC(y, m, 0)).getUTCDate();
            for (let i = 0; i < first; i++) grid.appendChild(el('div', 'calc empty'));
            const isNow = d => y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
            for (let d = 1; d <= days; d++) {
                const evs = dayEvents(y, m, d);
                const cell = el('button', 'calc' + (isNow(d) ? ' today' : '') + (sel === d ? ' sel' : '') + (evs.length ? ' has' : ''));
                cell.type = 'button';
                cell.setAttribute('aria-label', `${MONTHS[m - 1]} ${d}${evs.length ? ': ' + evs.map(e => e.name).join(', ') : ''}`);
                cell.appendChild(el('span', 'caln', String(d)));
                if (evs.length) { const ic = iconCanvas(evs[0].icon, 20); ic.classList.add('calic'); cell.appendChild(ic); }
                if (evs.length > 1) cell.appendChild(el('span', 'calmore', '+' + (evs.length - 1)));
                cell.addEventListener('click', () => { sel = d; Sfx.ui('tick'); draw(); });
                grid.appendChild(cell);
            }
            P.body.appendChild(grid);
            if (sel) {
                const evs = dayEvents(y, m, sel);
                P.body.appendChild(el('p', 'artcap', `${MONTHS[m - 1]} ${sel}`));
                const list = el('div', 'list');
                if (!evs.length) list.appendChild(el('p', 'muted', 'Nothing special. A perfectly good regular island day.'));
                for (const e of evs) {
                    const row = el('div', 'row');
                    row.appendChild(iconCanvas(e.icon, 40));
                    const t = el('div', 't');
                    t.appendChild(el('b', null, e.name));
                    t.appendChild(el('span', null, e.note || ''));
                    row.appendChild(t);
                    list.appendChild(row);
                }
                P.body.appendChild(list);
            }
        };
        draw();
    });
}

