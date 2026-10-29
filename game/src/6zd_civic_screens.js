/* ---- 6zd_civic_screens.js ---- */
/* The screens the Town Hall, the Post Office and the Bank will have (docs/ROADMAP.md, late in development), drawn now
   with sample numbers so their look is settled before the features are hooked up. Each draws one state: 'Works', and
   every way it can go wrong or be empty ('Loading', 'No internet', 'Service down', 'No zip code', 'Old data', 'Not
   enough money', 'Empty', 'Market closed', 'Bad name', 'Bad zip code', 'Expired', 'Not today', 'Not allowed'), with the
   words written for them in the dialogue sheet (scripts/dialogue/new-civic.mjs). In the preview the panel's foot has a
   button for each state. __dbg.civic(id, state) opens one. */

/* ---------------------------------------------------------------- bits the screens share */
const CV = {
    /* {fill-ins} from the sample */
    fill(t, D) { return String(t).replace(/\{(\w+)\}/g, (m, k) => (D[k] != null ? D[k] : m)); },
    banner(body, kind, text) { const b = el('div', 'cv-banner ' + kind, text); body.appendChild(b); return b; },
    note(body, text) { const p = el('p', 'muted cv-note', text); body.appendChild(p); return p; },
    h(body, text) { const h = el('div', 'cv-h', text); body.appendChild(h); return h; },
    /* a big number with its label */
    big(body, label, value, sub) {
        const d = el('div', 'cv-big');
        d.appendChild(el('span', null, label));
        d.appendChild(el('b', null, value));
        if (sub) d.appendChild(el('small', null, sub));
        body.appendChild(d);
        return d;
    },
    row(list, icon, title, sub, right, fn) {
        const r = el(fn ? 'button' : 'div', 'row');
        if (fn) { r.type = 'button'; r.addEventListener('click', () => { Sfx.ui('tick'); fn(); }); }
        if (icon) r.appendChild(typeof icon === 'string' ? uiIcon(icon, 40) : icon);
        const t = el('div', 't');
        t.appendChild(el('b', null, title));
        if (sub) t.appendChild(el('span', null, sub));
        r.appendChild(t);
        if (right != null) r.appendChild(typeof right === 'string' ? el('span', 'price', right) : right);
        list.appendChild(r);
        return r;
    },
    list(body) { const l = el('div', 'list'); body.appendChild(l); return l; },
    empty(body, text, icon) {
        const d = el('div', 'cv-empty');
        if (icon) d.appendChild(uiIcon(icon, 48));
        d.appendChild(el('p', null, text));
        body.appendChild(d);
        return d;
    },
    /* a gentle "working on it" line with dots */
    loading(body, text) { const d = el('div', 'cv-loading'); d.appendChild(el('i')); d.appendChild(el('span', null, text)); body.appendChild(d); return d; },
    field(body, label, value, ph, opts) {
        const f = el('label', 'field');
        f.appendChild(el('span', null, label));
        const i = el('input');
        i.value = value || ''; if (ph) i.placeholder = ph;
        if (opts && opts.inputmode) i.inputMode = opts.inputmode;
        if (opts && opts.max) i.maxLength = opts.max;
        if (opts && opts.bad) i.className = 'bad';
        f.appendChild(i);
        body.appendChild(f);
        return i;
    },
    /* a little line chart (a stock's last weeks), up green, down red */
    spark(vals, w, h, big) {
        const c = document.createElement('canvas'), k = 2;
        c.width = w * k; c.height = h * k; c.style.width = w + 'px'; c.style.height = h + 'px'; c.className = 'cv-spark';
        const g = c.getContext('2d'), lo = Math.min(...vals), hi = Math.max(...vals), up = vals[vals.length - 1] >= vals[0];
        const X = i => (i / (vals.length - 1)) * (w - 4) * k + 2 * k, Y = v => (h - 3 - (v - lo) / (hi - lo || 1) * (h - 6)) * k;
        g.lineWidth = (big ? 2.5 : 1.8) * k; g.lineJoin = 'round'; g.strokeStyle = up ? '#3f9a5a' : '#d0504a';
        if (big) {
            g.fillStyle = up ? 'rgba(63,154,90,0.14)' : 'rgba(208,80,74,0.14)';
            g.beginPath(); g.moveTo(X(0), h * k); vals.forEach((v, i) => g.lineTo(X(i), Y(v))); g.lineTo(X(vals.length - 1), h * k); g.fill();
        }
        g.beginPath(); vals.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke();
        return c;
    },
    /* bars for a statement: each a label, an amount and its share */
    bars(body, rows) {
        const max = Math.max(...rows.map(r => r[1]), 1), d = el('div', 'cv-bars');
        for (const [label, v, col] of rows) {
            const r = el('div', 'cv-bar');
            r.appendChild(el('span', null, label));
            const track = el('i'), fill = el('b');
            fill.style.width = Math.max(3, v / max * 100) + '%'; fill.style.background = col;
            track.appendChild(fill); r.appendChild(track);
            r.appendChild(el('em', null, fmtNum(v)));
            d.appendChild(r);
        }
        body.appendChild(d);
        return d;
    },
    meter(pct, col) { const t = el('i', 'cv-meter'), f = el('b'); f.style.width = Math.min(100, pct) + '%'; if (col) f.style.background = col; t.appendChild(f); return t; },
    /* a seeded random walk: a stock's sample prices */
    walk(seed, n, start, vol) { const r = mulberry(hash32(seed)); const out = [start]; for (let i = 1; i < n; i++) out.push(Math.max(1, out[i - 1] * (1 + (r() - 0.48) * vol))); return out; },
};

/* the sample: the island's own names and numbers where there are some, made-up ones for what doesn't exist yet */
function civicSample() {
    const isl = (typeof S !== 'undefined' && S && S.islandName) || 'Sarah Island', name = (typeof S !== 'undefined' && S && S.playerName) || 'Sarah';
    const money = (typeof S !== 'undefined' && S && S.money) || 12480;
    return {
        name, island: isl, zip: '02134', town: 'Allston, MA', time: '9:41 AM', date: 'Monday, October 26',
        sky: 'Partly cloudy', temp: 58, high: 63, low: 47, money, balance: '18,250', rate: '0.4', earned: '1,312',
        headline: 'A city park plants 500 new trees', when: 'yesterday at 4 PM', opens: 'tomorrow at 9:30 AM',
    };
}
const CV_STOCKS = [['Computer maker', 182], ['Soda maker', 61], ['Toy maker', 18], ['Shoe maker', 97], ['Coffee chain', 88], ['Car maker', 240], ['Game company', 42], ['Streaming service', 410]];

/* ---------------------------------------------------------------- the screens */
const CIVIC_SCREENS = {
    /* ===== Town Hall ===== */
    zip: { title: 'Your address', icon: 'app_map', blurb: 'Register your zip code: the real time, weather and news',
        states: ['Works', 'Loading', 'Found', 'Bad zip code', 'No internet', 'Service down'],
        draw(b, st, D) {
            CV.note(b, "Used for your time zone, local weather, and local news. Saved with your island.");
            CV.field(b, 'Your zip code (5 digits)', st === 'Works' ? '' : st === 'Bad zip code' ? '00000' : D.zip, '5 digits', { inputmode: 'numeric', max: 5, bad: st === 'Bad zip code' });
            if (st === 'Loading') CV.loading(b, 'Looking it up...');
            if (st === 'Found') { CV.banner(b, 'ok', CV.fill('Your island now keeps {town} time. Weather and news will come from {town}.', D)); CV.big(b, 'Now in ' + D.town, D.time, `${D.sky} · ${D.temp}° (high ${D.high}°, low ${D.low}°)`); }
            if (st === 'Bad zip code') CV.banner(b, 'err', "We couldn't find that zip code. Check the numbers and try again.");
            if (st === 'No internet') CV.banner(b, 'warn', 'No internet connection. Your zip code is saved and the island will look it up when it\'s back online. Until then it keeps your device\'s time.');
            if (st === 'Service down') CV.banner(b, 'warn', "The zip code service isn't available. Your number is saved; we'll try again later.");
        },
        foot: f => f.appendChild(btn('Register', 'green', () => {})) },
    ordinance: { title: 'Island ordinance', icon: 'app_calendar', blurb: 'Early Bird, Night Owl, Community Spirit, Nature Conservation',
        states: ['Works', 'Not enough money', 'Not today'],
        draw(b, st, D) {
            const list = CV.list(b), on = 'Community Spirit';
            for (const [n, t] of [['No ordinance', 'The island as it is.'], ['Early Bird', 'Shops open and neighbors wake up earlier.'], ['Night Owl', 'Shops stay open later and neighbors stay up later.'],
                ['Community Spirit', 'Neighbors chat, visit and go on outings more.'], ['Nature Conservation', "More wildlife, trees grow faster, and neighbors plant flowers where there aren't enough."]]) {
                const r = CV.row(list, null, n, t, n === on ? el('span', 'cv-pill ok', 'In effect') : null, () => {});
                if (n === on) r.classList.add('sel');
            }
            CV.note(b, CV.fill('Enacting an ordinance costs {amount} sand dollars. It starts tomorrow morning.', { amount: '20,000' }));
            if (st === 'Not enough money') CV.banner(b, 'err', 'You need 20,000 sand dollars to enact an ordinance. You have ' + fmtNum(Math.min(D.money, 19000)) + '.');
            if (st === 'Not today') CV.banner(b, 'warn', 'The ordinance already changed today. The Council can change it again tomorrow.');
        },
        foot: f => f.appendChild(btn('Enact', 'green', () => {})) },
    flag: { title: 'Design the island flag', icon: 'ui_flag', blurb: 'Draw a pixel flag that flies round the island',
        states: ['Works'],
        draw(b, st, D) {
            const W = 16, H = 10, pal = ['#fbf8f2', '#e8443a', '#f4c040', '#4aa85a', '#3a7ad8', '#9a5ad8', '#f49ac0', '#3b2a2a'];
            const cells = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                // (a sample flag: a sky-blue field, a sun, a green island with a palm)
                let c = 4;
                if (y >= 7) c = 3;
                if ((x - 11) ** 2 + (y - 3) ** 2 < 5) c = 2;
                if (x === 4 && y >= 3 && y < 8) c = 7;
                if (y === 3 && x >= 2 && x <= 6 && x !== 4) c = 3;
                if (y === 9) c = 0;
                cells.push(c);
            }
            const grid = el('div', 'cv-flag'); grid.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
            let pick = 1;
            cells.forEach((c, i) => { const p = el('button', 'cv-px'); p.type = 'button'; p.style.background = pal[c]; p.addEventListener('click', () => { cells[i] = pick; p.style.background = pal[pick]; }); grid.appendChild(p); });
            b.appendChild(grid);
            const sw = el('div', 'swatches');
            pal.forEach((c, k) => { const s = el('button', 'swatch' + (k === pick ? ' on' : '')); s.type = 'button'; s.style.background = c; s.addEventListener('click', () => { pick = k; sw.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); s.classList.add('on'); }); sw.appendChild(s); });
            b.appendChild(sw);
            CV.note(b, 'Tap a color, then the squares. The flag flies on the Town Hall, the pier and the island board.');
        },
        foot: f => f.appendChild(btn('Raise the flag', 'green', () => {})) },
    census: { title: 'Island census', icon: 'app_friends', blurb: 'Every resident: birthdays, personalities, friendship',
        states: ['Works'],
        draw(b, st, D) {
            const folks = Object.entries(typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : {}).filter(([id, n]) => !n.online).slice(0, 18);
            CV.h(b, CV.fill('Island census · {count} residents', { count: folks.length + 1 }));
            const list = CV.list(b);
            folks.forEach(([id, n], i) => {
                // (friendship is the island's own; birthdays and personalities are samples till the neighbors have them)
                const h = typeof hearts === 'function' ? Math.min(5, hearts(id)) : 1 + (i * 7) % 5;
                const hearts_ = el('span', 'cv-hearts', '\u2665'.repeat(h) + '\u2661'.repeat(5 - h));
                CV.row(list, n.sprite ? n.sprite + '_0' : null, n.name, `Birthday: ${n.birthday || ['March 3', 'July 19', 'Nov 2', 'May 27'][i % 4]} · ${n.personality || ['Cheerful', 'Snooty', 'Lazy', 'Peppy', 'Smug', 'Cranky'][i % 6]}`, hearts_);
            });
            CV.row(list, 'goat_0', 'The goat', 'Birthday: unknown · Personality: goat · Favorite thing: everything, eaten');
        } },
    history: { title: 'Island history', icon: 'app_collection', blurb: 'The timeline, records, statistics and achievements',
        states: ['Works', 'Empty'], tabs: ['History', 'Records', 'Statistics', 'Achievements'],
        draw(b, st, D, tab) {
            if (st === 'Empty' && tab === 'History') { CV.empty(b, "The island's story is just beginning. Every big day goes here."); return; }
            if (tab === 'Records') {
                const l = CV.list(b);
                for (const [t, v] of [['Biggest fish', 'Tuna, 192 cm · day 12'], ['Best day for sand dollars', '18,400 · day 9'], ['Longest friendship', 'Joe · 31 days'], ['Most flowers picked in a day', '27 · day 4']]) CV.row(l, null, t, v);
                return;
            }
            if (tab === 'Statistics') {
                const g = el('div', 'cv-stats');
                for (const [t, v] of [['Days played', 34], ['Fish caught', 212], ['Shells found', 486], ['Sand dollars earned', '312,940'], ['Trees planted', 18], ['Letters sent', 41]]) { const c = el('div'); c.appendChild(el('b', null, String(v))); c.appendChild(el('span', null, t)); g.appendChild(c); }
                b.appendChild(g);
                return;
            }
            if (tab === 'Achievements') {
                const l = CV.list(b);
                CV.row(l, 'f_plaque_gold', 'Cozy home', 'The Council gave the house 25 or more', el('span', 'cv-pill ok', 'Earned'));
                CV.row(l, 'fish_tuna', 'Big catch', 'Catch a fish over 150 cm', el('span', 'cv-pill ok', 'Earned'));
                CV.row(l, 'ui_present', 'Island famous', 'Have every neighbor at five hearts', el('span', 'cv-pill', 'Not yet. Keep going!'));
                return;
            }
            const l = el('ol', 'cv-timeline');
            for (const [d, t] of [['Day 1', `${D.name} arrives on ${D.island} with a suitcase and a lot of hope.`], ['Day 3', 'The shop opens its second floor.'], ['Day 9', 'The museum gets its first fossil.'], ['Day 21', 'The Cozy Council calls the house "exquisite."'], ['Day 30', 'The Town Hall opens its doors.']]) {
                const li = el('li'); li.appendChild(el('b', null, d)); li.appendChild(el('span', null, t)); l.appendChild(li);
            }
            b.appendChild(l);
        } },
    rename: { title: 'Rename a place', icon: 'app_paths', blurb: 'New names for the beaches, the woods, the hills',
        states: ['Works', 'Bad name'],
        draw(b, st, D) {
            const l = CV.list(b);
            for (const [k, n] of [['The west beach', 'Sunset Sands'], ['The pond', 'Frog Pond'], ['The northern woods', 'The Whispering Pines'], ['The lookout', 'Lookout Hill']]) CV.row(l, null, n, k, null, () => {});
            CV.field(b, CV.fill('New name for {landmark}', { landmark: 'Frog Pond' }), st === 'Bad name' ? '' : 'Lily Pad Lagoon', 'A new name', { max: 24, bad: st === 'Bad name' });
            if (st === 'Bad name') CV.banner(b, 'err', 'A name needs a letter or two (and at most 24). Try again!');
        },
        foot: f => f.appendChild(btn('Rename', 'green', () => {})) },
    residents: { title: 'Residents', icon: 'app_wardrobe', blurb: 'Catchphrases, clothes and schedules, for good friends',
        states: ['Works', 'Not allowed'],
        draw(b, st, D) {
            const l = CV.list(b);
            const n = st === 'Not allowed' ? ['Wonton', 1] : ['Maki', 4];
            CV.row(l, NPC_DEFS[n[0].toLowerCase()].sprite + '_0', n[0], '♥'.repeat(n[1]) + '♡'.repeat(5 - n[1]));
            if (st === 'Not allowed') { CV.banner(b, 'warn', 'They need to be good friends with you first (three hearts).'); return; }
            CV.field(b, 'Catchphrase', 'rice-ly', 'A word or two', { max: 16 });
            const two = el('div', 'two'); b.appendChild(two);
            CV.field(two, 'Wakes up', '7:00 AM'); CV.field(two, 'Goes home', '9:00 PM');
            CV.note(b, 'Clothes and accessories: give them something to wear, or put them back in their own.');
        },
        foot: f => f.appendChild(btn('Save', 'green', () => {})) },
    holidays: { title: 'Missed holidays', icon: 'ui_present', blurb: 'Hold a holiday you missed, up to a week late',
        states: ['Works', 'Empty', 'Expired'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No missed holidays. You were here for all of them!', 'ui_present'); return; }
            const l = CV.list(b);
            CV.row(l, itemIcon('egg_0'), 'The Egg Hunt', st === 'Expired' ? 'Missed 9 days ago' : 'Missed 2 days ago · can still be held for 5 more days', st === 'Expired' ? el('span', 'cv-pill', 'Too late') : el('span', 'cv-pill ok', 'Hold it today'));
            if (st === 'Expired') CV.banner(b, 'warn', 'A missed holiday can be held up to a week after. This one was too long ago. Next year!');
            else CV.note(b, CV.fill('Today: {holiday}, rescheduled for {name} by the Town Hall.', { holiday: 'The Egg Hunt', name: D.name }));
        },
        foot: f => f.appendChild(btn('Hold it today', 'green', () => {})) },
    jobs: { title: 'Island jobs', icon: 'app_tasks', blurb: 'Small jobs for sand dollars: deliveries, sweeping, signs',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No more jobs today. Come back tomorrow!'); return; }
            const l = CV.list(b);
            for (const [t, w, a, m] of [['Deliver three letters', 'For Pita at the Post Office', 600, 5], ['Sweep the square', 'Leaves everywhere. Autumn!', 400, 4], ['Repaint the pier sign', 'Ginger left the paint out', 900, 8]])
                CV.row(l, null, t, `${w} · ` + CV.fill('Pays {amount} sand dollars · about {count} minutes', { amount: fmtNum(a), count: m }), null, () => {});
        } },
    backups: { title: 'Island backups', icon: 'app_save', blurb: 'Keep or bring back an earlier copy of the island',
        states: ['Works', 'Loading', 'No internet', 'Service down'],
        draw(b, st, D) {
            if (st === 'Loading') { CV.loading(b, 'Fetching the backups...'); return; }
            if (st === 'No internet') { CV.banner(b, 'warn', "Can't reach the island server. Backups need a connection."); return; }
            if (st === 'Service down') { CV.banner(b, 'err', 'Something went wrong on the island server. Nothing was changed. Try again in a minute.'); return; }
            const l = CV.list(b);
            for (const [w, d, m] of [['Today, 9:00 AM', 34, '12,480'], ['Yesterday, 8:00 PM', 33, '11,960'], ['October 24', 32, '9,410'], ['October 20', 28, '6,250']])
                CV.row(l, null, w, CV.fill('{when} · day {count} · {amount} sand dollars', { when: w, count: d, amount: m }).replace(w + ' · ', ''), null, () => {});
            CV.note(b, 'The island server keeps a copy every hour while you play, one a day for two months.');
        },
        foot: (f, st) => { const k = btn('Make a backup now', 'green', () => {}); k.disabled = st !== 'Works'; f.appendChild(k); } },

    /* ===== Post Office ===== */
    gazette: { title: 'The Gazette', icon: 'app_mail', blurb: "Today's paper: your town, the world, the weather, the island",
        states: ['Works', 'Loading', 'No zip code', 'No internet', 'Service down'],
        draw(b, st, D) {
            if (st === 'Loading') { CV.loading(b, 'The paper is on its way...'); return; }
            const p = el('div', 'cv-paper');
            p.appendChild(el('h3', null, CV.fill('The {island} Gazette', D)));
            p.appendChild(el('div', 'cv-dateline', CV.fill('Delivered every morning by the {island} Post Office · {date}', D)));
            const sec = (h, items) => { p.appendChild(el('h4', null, h)); for (const [t, s] of items) { const a = el('div', 'cv-story'); a.appendChild(el('b', null, t)); if (s) a.appendChild(el('span', null, s)); p.appendChild(a); } };
            const live = st === 'Works' || st === 'No zip code';
            if (st === 'No internet') CV.banner(p, 'warn', "No internet this morning: today's paper has the island news only. The rest will be in tomorrow's.");
            if (st === 'Service down') CV.banner(p, 'warn', "The news service didn't answer this morning. Today's paper has the island news; the world news comes back tomorrow.");
            if (st === 'Works') sec(CV.fill('News from {town}', D), [[D.headline, 'Read the full story'], ['The library adds Sunday hours', 'Read the full story']]);
            if (st === 'No zip code') CV.banner(p, 'info', 'No local news yet: register your zip code at the Town Hall.');
            if (live) sec('World news', [['Scientists find a mushroom that glows blue', 'Read the full story'], ["A city's oldest bakery turns 200", 'Read the full story']]);
            if (live && st === 'Works') sec("Today's weather", [[`${D.sky}, ${D.temp}°`, `High ${D.high}°, low ${D.low}°`]]);
            sec('Island news', [[`${D.name} catches a 190 cm tuna off the pier`, 'Witnesses say she did a little dance.'], ['The Council rates a house "exquisite"', 'The Council would not say whose. It was ' + D.name + "'s."]]);
            sec("Coco's Corner", [['Who left a present on Joe\'s doorstep?', 'Coco knows. Coco always knows.']]);
            if (live) sec('The markets (from the Bank)', [['Coffee chain up 2%, Toy maker down 1%', null]]);
            p.appendChild(el('div', 'cv-small', 'Headlines from the wider world, alongside stories from the island.'));
            b.appendChild(p);
        } },
    archive: { title: 'The Gazette archive', icon: 'app_poems', blurb: 'Every paper kept, to read again',
        states: ['Works', 'Empty', 'No results', 'Old data'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No papers yet. The first one comes tomorrow morning.', 'app_mail'); return; }
            CV.note(b, CV.fill('{count} papers kept. Tap one to read it again.', { count: 33 }));
            CV.field(b, 'Find a day or a word', st === 'No results' ? 'dinosaur' : '', 'Find a day or a word');
            if (st === 'No results') { CV.empty(b, 'No papers mention that. Yet.'); return; }
            const l = CV.list(b);
            for (const [d, t] of [['October 25', `${D.name} catches a 190 cm tuna off the pier`], ['October 24', 'Fortune\'s shop adds a second floor'], ['October 23', 'Rain all day: the frogs approve']])
                CV.row(l, 'app_mail', CV.fill('The {island} Gazette, {date}', { island: D.island, date: d }), t, null, () => {});
            if (st === 'Old data') CV.banner(b, 'info', 'The world news on this day was only kept as headlines.');
        } },
    letter: { title: 'Send a letter', icon: 'app_mail', blurb: 'A real letter to a neighbor, with a present if you like',
        states: ['Works', 'Not enough money'],
        draw(b, st, D) {
            CV.note(b, 'Write your letter. Attach a present if you like.');
            const two = el('div', 'two'); b.appendChild(two);
            CV.field(two, 'To', 'Joe'); CV.field(two, 'Present', 'Rose vase');
            const f = el('label', 'field'); f.appendChild(el('span', null, 'Letter'));
            const ta = el('textarea', 'cv-letter'); ta.value = 'Dear Joe,\nThank you for the poem about the frog. And the other frog.\nYour friend,\n' + D.name; f.appendChild(ta); b.appendChild(f);
            CV.note(b, CV.fill('Postage: {amount} sand dollars (free on Sundays)', { amount: 100 }));
            if (st === 'Not enough money') CV.banner(b, 'err', 'Postage is 100 sand dollars, and your pocket is empty. Sundays are free!');
        },
        foot: f => f.appendChild(btn('Mail it', 'green', () => {})) },
    postcards: { title: 'Postcards', icon: 'app_camera', blurb: 'The postcards that came in the mail',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No postcards yet. Neighbors who go on trips send them, and some just turn up in the mail.'); return; }
            CV.note(b, CV.fill('{count} of {total} postcards collected', { count: 5, total: 24 }));
            const g = el('div', 'cv-cards');
            for (const [nm, sky, land, sun] of [['Coral Bay', '#7cc8f0', '#f2d8a0', '#ffe070'], ['Mount Puff', '#a8c8f0', '#7aa860', '#ffffff'], ['Lantern Town', '#3a3a7a', '#5a4a6a', '#ffd27a'], ['Snowcap', '#c8d8f0', '#fbfbfb', '#ffffff'], ['Pumpkin Hollow', '#f0a060', '#8a5a34', '#ffd06a'], ['?', '#d8d0c4', '#d8d0c4', null]]) {
                const c = el('div', 'cv-card' + (sun ? '' : ' locked'));
                const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64;
                const g2 = cv.getContext('2d');
                const gr = g2.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, sky); gr.addColorStop(1, '#ffffff'); g2.fillStyle = gr; g2.fillRect(0, 0, 96, 64);
                if (sun) { g2.fillStyle = sun; g2.beginPath(); g2.arc(72, 18, 9, 0, 7); g2.fill(); }
                g2.fillStyle = land; g2.beginPath(); g2.moveTo(0, 64); g2.lineTo(0, 44); g2.quadraticCurveTo(30, 26, 52, 42); g2.quadraticCurveTo(74, 52, 96, 40); g2.lineTo(96, 64); g2.fill();
                c.appendChild(cv); c.appendChild(el('span', null, nm));
                g.appendChild(c);
            }
            b.appendChild(g);
        } },
    tracking: { title: 'Your packages', icon: 'ic_package', blurb: 'Where the things you ordered are',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'Nothing on the way. Order from IslandMart on your laptop and it arrives in the next morning\'s mail.', 'ic_package'); return; }
            const l = CV.list(b), step = (n) => { const m = el('div', 'cv-steps'); for (let i = 0; i < 4; i++) m.appendChild(el('i', i < n ? 'on' : null)); return m; };
            CV.row(l, 'ic_package', 'Floor lamp', CV.fill('Ordered {when} · Packing at IslandMart', { when: 'today' }), step(1));
            CV.row(l, 'ic_package', 'Rose vase', 'On the boat · Arriving tomorrow morning', step(2));
            CV.row(l, 'ic_package', 'Typewriter', "Out for delivery · Pita's on the way", step(3));
            CV.row(l, 'ic_package', 'Beanbag', CV.fill('Delivered {when} · In your mailbox', { when: 'this morning' }), step(4));
            CV.row(l, 'ui_present', 'A mysterious package', "A special delivery. No tracking. Very mysterious. Pita won't say.", el('span', 'cv-pill', '?'));
        } },
    mailbox: { title: 'Mailbox style', icon: 'mailbox', blurb: 'A new color or a whole new mailbox',
        states: ['Works', 'Not enough money'],
        draw(b, st, D) {
            // (the mailbox in the color picked: a rounded box on a post, its red flag up)
            const prev = el('div', 'cv-mailbox'), cv = document.createElement('canvas');
            cv.width = 160; cv.height = 120; prev.appendChild(cv); b.appendChild(prev);
            const paint = col => {
                const g = cv.getContext('2d'); g.clearRect(0, 0, 160, 120);
                g.fillStyle = '#8a5a34'; g.fillRect(74, 62, 12, 54); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(80, 62, 6, 54);
                g.fillStyle = col; g.beginPath(); g.moveTo(40, 66); g.lineTo(40, 40); g.arc(68, 40, 28, Math.PI, 0); g.lineTo(96, 66); g.closePath(); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(46, 30, 44, 5); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(40, 60, 56, 6);
                g.lineWidth = 3; g.strokeStyle = 'rgba(59,42,42,0.5)'; g.strokeRect(40, 40, 18, 26);
                g.fillStyle = '#d8433b'; g.fillRect(100, 26, 5, 34); g.fillRect(100, 26, 18, 10);
            };
            b.appendChild(el('div', 'cv-h', 'Color'));
            const sw = el('div', 'swatches');
            ['#3a8a4a', '#d8433b', '#3d6fb6', '#f4c040', '#f49ac0', '#fbf8f2', '#3b2a2a'].forEach((c, k) => {
                const s = el('button', 'swatch' + (k === 0 ? ' on' : '')); s.type = 'button'; s.style.background = c;
                s.addEventListener('click', () => { sw.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); s.classList.add('on'); paint(c); });
                sw.appendChild(s);
            });
            b.appendChild(sw);
            paint('#3a8a4a');
            const l = CV.list(b);
            for (const [n, p] of [['Classic', 'Yours'], ['Cottage', '3,000'], ['Lighthouse', '5,000'], ['Fish', '4,200']]) CV.row(l, null, n, null, p, () => {});
            CV.note(b, CV.fill('A new mailbox costs {amount} sand dollars. Changing the color is free.', { amount: '3,000' }));
            if (st === 'Not enough money') CV.banner(b, 'err', 'That mailbox costs 5,000 sand dollars. You have ' + fmtNum(Math.min(D.money, 2400)) + '.');
        },
        foot: f => f.appendChild(btn('Save', 'green', () => {})) },

    /* ===== Bank ===== */
    savings: { title: 'Savings account', icon: 'ui_coin', blurb: 'Put sand dollars away; they grow a little every morning',
        states: ['Works', 'Empty', 'Not enough money'],
        draw(b, st, D) {
            CV.big(b, 'In savings', (st === 'Empty' ? '0' : D.balance) + ' sand dollars', CV.fill('This week\'s interest: {rate}% a day, paid every morning', D));
            if (st !== 'Empty') CV.note(b, CV.fill('Interest earned so far: {amount} sand dollars', { amount: D.earned }));
            else CV.note(b, 'Nothing saved yet. Even a little grows a little every morning.');
            const two = el('div', 'two'); b.appendChild(two);
            CV.field(two, 'Put in', '5,000', '0', { inputmode: 'numeric', bad: st === 'Not enough money' }); CV.field(two, 'Take out', '', '0', { inputmode: 'numeric' });
            if (st === 'Not enough money') CV.banner(b, 'err', `You only have ${fmtNum(Math.min(D.money, 3200))} sand dollars in your pocket.`);
        },
        foot: f => { f.appendChild(btn('Put in', 'green', () => {})); f.appendChild(btn('Take out', 'alt', () => {})); } },
    stocks: { title: 'The market', icon: 'ui_chart', blurb: 'Real companies, in sand dollars: buy, sell, watch them move',
        states: ['Works', 'Loading', 'Market closed', 'No internet', 'Service down', 'Old data', 'Not enough money'],
        draw(b, st, D) {
            if (st === 'Loading') { CV.loading(b, 'Getting the latest prices...'); return; }
            if (st === 'Market closed') CV.banner(b, 'info', CV.fill('Market closed · Prices from {when} · Opens {opens}', D));
            if (st === 'No internet') CV.banner(b, 'warn', CV.fill('No internet connection: showing the last prices we have ({when}). Buying and selling are paused.', D));
            if (st === 'Service down') CV.banner(b, 'warn', CV.fill("The market data service isn't answering. Showing the last prices we have ({when}). Trading is paused.", D));
            if (st === 'Old data') CV.banner(b, 'info', CV.fill('Prices as of {when}. A new update hasn\'t arrived yet.', { when: 'Friday' }));
            // the one picked, big
            const series = {};
            for (const [n, p] of CV_STOCKS) series[n] = CV.walk(n, 40, p, 0.04);
            const top = series['Coffee chain'];
            const head = el('div', 'cv-stock');
            head.appendChild(el('b', null, 'Coffee chain'));
            const chg = (top[39] / top[38] - 1) * 100;
            head.appendChild(el('span', chg >= 0 ? 'up' : 'down', `${fmtNum(Math.round(top[39]))} · ${chg >= 0 ? '+' : ''}${chg.toFixed(1)}% today`));
            head.appendChild(CV.spark(top, 300, 90, true));
            b.appendChild(head);
            CV.h(b, 'Your portfolio');
            const pl = CV.list(b);
            CV.row(pl, null, CV.fill('{shares} shares of {stock}', { shares: 12, stock: 'Coffee chain' }), CV.fill('worth {amount} · {change} since you bought', { amount: fmtNum(Math.round(top[39] * 12)), change: '+8%' }), CV.spark(top.slice(20), 70, 26));
            CV.h(b, 'The market');
            const l = CV.list(b);
            for (const [n, p] of CV_STOCKS) {
                const w = series[n].slice(20), c = (w[19] / w[18] - 1) * 100;
                CV.row(l, null, n, CV.fill('{price} · {change} today', { price: fmtNum(Math.round(w[19])), change: `${c >= 0 ? '+' : ''}${c.toFixed(1)}%` }), CV.spark(w, 70, 26), () => {});
            }
            if (st === 'Not enough money') CV.banner(b, 'err', `Ten shares of Car maker cost ${fmtNum(2400)} sand dollars. You have ${fmtNum(Math.min(D.money, 1800))}.`);
            CV.note(b, "Real market prices, converted to sand dollars and updated daily. Quotes may be up to a day old.");
        },
        foot: (f, st) => { const off = ['Market closed', 'No internet', 'Service down'].includes(st); const a = btn('Buy', 'green', () => {}), s = btn('Sell', 'alt', () => {}); a.disabled = s.disabled = off; f.appendChild(a); f.appendChild(s); } },
    loan: { title: 'House loan', icon: 'ui_house', blurb: 'Pay off the house upgrades a little at a time',
        states: ['Works', 'Empty', 'Not enough money'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No loan! The house is all yours. Ginger says the next upgrade is "very exciting."', 'ui_house'); return; }
            CV.big(b, 'Still to pay', '148,000 sand dollars', 'For the second floor');
            const m = CV.meter(42, '#3f9a5a'); b.appendChild(m);
            CV.note(b, '42% paid · no interest, no hurry');
            CV.field(b, 'Pay now', '10,000', '0', { inputmode: 'numeric', bad: st === 'Not enough money' });
            if (st === 'Not enough money') CV.banner(b, 'err', `You have ${fmtNum(Math.min(D.money, 6100))} sand dollars in your pocket.`);
        },
        foot: f => f.appendChild(btn('Pay', 'green', () => {})) },
    goals: { title: 'Savings goals', icon: 'app_tasks', blurb: 'Save toward something big',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'No goals yet. Add something you\'d like to save for, and an amount to aim toward.'); }
            else {
                const l = CV.list(b);
                for (const [g, a, t] of [['The second floor', 62000, 148000], ['Arcade cabinet', 9000, 12000], ['Every hat at the boutique', 1500, 22000]]) {
                    const r = CV.row(l, null, g, CV.fill('{amount} of {total} ({count}%)', { amount: fmtNum(a), total: fmtNum(t), count: Math.round(a / t * 100) }));
                    r.querySelector('.t').appendChild(CV.meter(a / t * 100));
                }
            }
            CV.field(b, 'What are you saving for?', '', 'A name for the goal');
        },
        foot: f => f.appendChild(btn('New goal', 'green', () => {})) },
    statement: { title: 'Your statement', icon: 'app_collection', blurb: 'Where your sand dollars came from and went',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            if (st === 'Empty') { CV.empty(b, 'Nothing to show yet. Sell something, buy something, and come back!'); return; }
            const two = el('div', 'two'); b.appendChild(two);
            CV.big(two, 'Earned (lifetime)', '312,940'); CV.big(two, 'Spent (lifetime)', '286,410');
            CV.h(b, 'Where your sand dollars came from');
            CV.bars(b, [['Fish', 118400, '#3a7ad8'], ['Shells', 61200, '#f0a088'], ['Fruit', 42800, '#e8843a'], ['Furniture sold', 30100, '#9a6a3a'], ['Interest', 1312, '#3f9a5a']]);
            CV.h(b, 'Where your sand dollars went');
            CV.bars(b, [['House', 152000, '#d8433b'], ['Furniture', 71300, '#9a6a3a'], ['Clothes', 38600, '#f49ac0'], ['Food', 14900, '#f4c040'], ['Stocks', 9600, '#5a5a8a']]);
        } },
    vault: { title: 'Safe deposit box', icon: 'ui_chest', blurb: 'Keep keepsakes and one-of-a-kind gifts safe',
        states: ['Works', 'Empty'],
        draw(b, st, D) {
            const kept = st === 'Empty' ? [] : ['compass', 'shipbottle', 'photo_joe', 'starcrystal', 'luckypenny'];
            CV.note(b, CV.fill('{count} of {total} spaces used', { count: kept.length, total: 20 }));
            if (!kept.length) { CV.empty(b, 'Nothing in here yet. Keep keepsakes, photos and one-of-a-kind gifts safe here.', 'ui_chest'); return; }
            const g = el('div', 'grid');
            for (let i = 0; i < 20; i++) g.appendChild(slotBtn(kept[i] || null, 1, { icon: kept[i] && furnDef(kept[i]) ? (furnDef(kept[i]).frame || 'f_' + kept[i]) : undefined }));
            b.appendChild(g);
        },
        foot: f => f.appendChild(btn('Put something in', 'green', () => {})) },
};

/* the screens that work for real (6ze_bank.js and on): draw(body, foot, redraw, tab) */
const CIVIC_LIVE = {};

/* one screen, in one state (the preview: a button for each state at the foot; 'Yours' is the real one, where there is one) */
function civicScreen(id, state, back) {
    const S_ = CIVIC_SCREENS[id], L = CIVIC_LIVE[id];
    if (!S_) return;
    let st = state || (L ? 'Yours' : 'Works'), tab = S_.tabs ? S_.tabs[0] : null;
    const tabs = S_.tabs ? el('div', 'tabs') : null;
    const P = UI.open({ title: S_.title, foot: true, tabs, back: back || null });
    const D = civicSample();
    const draw = () => {
        P.body.innerHTML = '';
        P.body.className = 'pbody cv';
        if (tabs) {
            tabs.innerHTML = '';
            for (const t of S_.tabs) { const b = el('button', 'tab' + (t === tab ? ' on' : ''), t); b.type = 'button'; b.addEventListener('click', () => { tab = t; Sfx.ui('tick'); draw(); }); tabs.appendChild(b); }
        }
        P.foot.innerHTML = '';
        if (st === 'Yours') L.draw(P.body, P.foot, draw, tab);
        else {
            S_.draw(P.body, st, D, tab);
            if (S_.foot && st !== 'Loading') S_.foot(P.foot, st);
        }
        if (CIVIC_PREVIEW || window.__DEBUG) {
            const box = el('div', 'cv-states');
            box.appendChild(el('span', null, L ? 'Samples:' : 'Preview:'));
            for (const s of (L ? ['Yours'] : []).concat(S_.states)) box.appendChild(chip(s, () => { st = s; draw(); }, s === st ? 'on' : ''));
            P.foot.appendChild(box);
        }
    };
    draw();
    return P;
}
