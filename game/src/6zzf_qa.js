/* ---- 6zzf_qa.js ---- */
/* The QA room (?qa, on beta or this computer; anywhere with localStorage sc-qa 1): for testing the game before it goes
   live. Its island is a throwaway, never saved or sent anywhere (Save.write returns, Cloud.api only reads, no friends
   online, the designer and the music uploads refuse), so a real island can't be touched from here; the debug tools are
   on (__dbg, __game). The QA button (or the ` key) opens a panel to go anywhere, set the date, hour, weather and season,
   jump to any holiday, run days forward, set friendships, hand out money and things, unlock what's earned over weeks,
   start any game, keep snapshots of the island to come back to, bring in a save code (an older save goes through
   migrate() as it would for real), and note down problems found (each with where and when it was). Snapshots and notes
   stay in this browser (sc-qa-snap:<name>, sc-qa-notes). A reload keeps the island it had and the date and hour it was
   set to (sessionStorage sc-qa-carry, sc-qa-clock). */
const QA = !!window.IS_QA;
const QA_SNAP = 'sc-qa-snap:', QA_NOTES = 'sc-qa-notes', QA_CARRY = 'sc-qa-carry', QA_CLOCK = 'sc-qa-clock';
/* the island the QA room starts on: what a reload carried over, else a fresh one, Sarah on the square */
async function qaState() {
    let code = null;
    try { code = sessionStorage.getItem(QA_CARRY); const c = +sessionStorage.getItem(QA_CLOCK); if (c) Clock.offsetMs = c; } catch (e) { /* none */ }
    if (code) {
        try { const st = await Save.importCode(code); if (st && st.started) return st; } catch (e) { console.warn('QA: the carried island would not load', e); }
    }
    const st = newState();
    st.started = true; st.flags.introDone = true; st.flags.metJoe = true;
    st.islandName = 'QA Island'; st.birthday = { m: 3, d: 14 };
    st.house.items = STARTER_HOUSE.map(o => Object.assign({ flip: false }, o));
    st.day = Clock.dayNum(); st.startDay = st.day;
    st.npcs.joe = Object.assign(st.npcs.joe || {}, { met: true }); st.npcs.fortune = Object.assign(st.npcs.fortune || {}, { met: true });
    st.player.x = (W0.spots.plaza.x + 0.5) * TILE; st.player.y = (W0.spots.plaza.y + 3.6) * TILE; st.player.dir = 'down';
    return st;
}
const QAPanel = {
    tab: 'go',
    TABS: [['go', 'Go'], ['time', 'Time'], ['people', 'People'], ['things', 'Things'], ['unlock', 'Unlocks'], ['games', 'Games'], ['view', 'View'], ['saves', 'Saves'], ['notes', 'Notes']],
    init() {
        if (!QA || this.btn) return;
        const b = this.btn = el('button', 'qa-btn', 'QA');
        b.type = 'button'; b.title = 'QA tools (`)';
        Object.assign(b.style, { position: 'fixed', left: 'calc(8px + env(safe-area-inset-left, 0px))', top: '50%', zIndex: 60, padding: '8px 10px', borderRadius: '10px',
            border: '2px solid #7a5a3a', background: '#fff6df', color: '#5a3a1a', font: '700 13px system-ui, sans-serif', cursor: 'pointer', opacity: 0.85 });
        b.addEventListener('click', ev => { ev.stopPropagation(); this.toggle(); });
        document.body.appendChild(b);
        addEventListener('keydown', ev => {
            if (ev.code !== 'Backquote' || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
            ev.preventDefault(); this.toggle();
        }, true);
        this.fps = { on: false, el: null, t: performance.now(), n: 0 };
    },
    toggle() { if (this.open) UI.close(); else this.show(); },
    show() {
        const tabs = el('div', 'qa-tabs');
        Object.assign(tabs.style, { display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 12px 6px' });
        for (const [id, name] of this.TABS) tabs.appendChild(chip(name, () => { this.tab = id; this.show(); }, id === this.tab ? 'on' : ''));
        const v = UI.open({ title: 'QA room', wide: true, tabs, onClose: () => { this.open = false; } });
        this.open = true;
        const body = v.body;
        const where = el('p', 'note', this.where());
        body.appendChild(where);
        try { this['tab_' + this.tab](body); } catch (e) { console.error('QA panel', e); body.appendChild(el('p', 'note', 'This tab broke: ' + e.message)); }
    },
    /* a row of chips under a little heading */
    row(body, title, items) {
        if (title) body.appendChild(stLabel(title));
        const r = el('div', 'qa-row');
        Object.assign(r.style, { display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '2px 0 10px' });
        for (const [label, fn] of items) r.appendChild(chip(label, () => { try { fn(); } catch (e) { console.error('QA', label, e); UI.toast('QA: ' + e.message); } }));
        body.appendChild(r);
        return r;
    },
    done(msg, keep) { if (!keep) UI.close(); if (msg) UI.toast(msg); },
    where() {
        const p = G.player, a = G.area;
        return `${a ? a.id : '?'} (${Math.floor(p.x / TILE)}, ${Math.floor((p.y - 2) / TILE)}) · ${dayLabel(Clock.dayNum())}, ${Clock.fmt().s} · ${G.weather} · ${Clock.season()}`;
    },
    // ---------------------------------------------------------------- tabs
    tab_go(body) {
        const D = window.__dbg;
        this.row(body, 'Places', Object.keys(W0.spots).sort().map(k => [k, () => { D.at(k); this.done(); }]));
        this.row(body, 'Outside a building', Object.keys(W0.buildings).sort().map(k => [k, () => { D.at(k); this.done(); }]));
        this.row(body, 'Into a room', Object.keys(ROOMS).sort().map(k => [ROOMS[k].name || k, () => { D.enter(k); this.done(); }]));
    },
    tab_time(body) {
        const D = window.__dbg, d = Clock.dayDate(), y = d.getFullYear();
        this.row(body, 'Hour', [5, 6, 7, 9, 12, 15, 17, 18, 19, 20, 21, 23, 0, 2].map(h => [(h % 12 || 12) + (h < 12 ? ' AM' : ' PM'), () => { D.hour(h); this.done(); }]));
        this.row(body, 'Season (the 15th, noon)', [['Spring', 4], ['Summer', 7], ['Fall', 10], ['Winter', 1]].map(([n, m]) => [n, () => { D.setTime(m, 15, 12); this.done(); }]));
        this.row(body, 'Weather today', ['sunny', 'cloudy', 'rain', 'snow', 'storm'].map(w => [w, () => { D.weather(w); this.done(); }]));
        this.row(body, 'Run days forward (each morning\'s work done)', [1, 2, 3, 7, 14, 30].map(n => [n + (n === 1 ? ' day' : ' days'), () => { D.nextDay(n); this.done(`${n} ${plural(n, 'day')} on: ${dayLabel(Clock.dayNum())}`); }]));
        body.appendChild(stLabel('A date'));
        const f = el('div', 'qa-row');
        Object.assign(f.style, { display: 'flex', gap: '6px', alignItems: 'center', margin: '2px 0 10px' });
        const m = el('select'); MONTHS.forEach((n, i) => { const o = el('option', null, n); o.value = i + 1; if (i === d.getMonth()) o.selected = true; m.appendChild(o); });
        const dd = el('input'); dd.type = 'number'; dd.min = 1; dd.max = 31; dd.value = d.getDate(); dd.style.width = '4em';
        f.append(m, dd, btn('Go', '', () => { D.setTime(+m.value, Math.max(1, Math.min(31, +dd.value || 1)), Clock.hourF()); this.done(); }));
        body.appendChild(f);
        this.row(body, 'Holidays (this year, noon)', HOLIDAYS.map(h => [h.name, () => { const [hm, hd] = holidayStart(h, y); D.setTime(hm, hd, 12); this.done(h.name); }]));
    },
    tab_people(body) {
        const list = NPCs.list.filter(n => !n.def || !n.def.online);
        this.row(body, 'Everyone', [
            ['All 5 hearts', () => { for (const n of list) this.setHearts(n.id, 5); this.done('Everyone at five hearts', true); this.show(); }],
            ['All 0 hearts', () => { for (const n of list) this.setHearts(n.id, 0); this.done('Everyone at no hearts', true); this.show(); }],
            ['All here', () => { list.forEach((n, i) => this.bring(n, i)); this.done('Everyone is here'); }],
        ]);
        for (const n of list) {
            const h = hearts(n.id);
            this.row(body, `${(NPC_DEFS[n.id] || {}).name || n.id} · ${'♥'.repeat(h)}${'♡'.repeat(5 - h)} · ${rel(n.id).pts} pts · ${n.area}${n.sleeping ? ', asleep' : ''}`, [
                ...[0, 1, 2, 3, 4, 5].map(k => [k + '♥', () => { this.setHearts(n.id, k); this.done(null, true); this.show(); }]),
                ['Bring here', () => { this.bring(n, 0); this.done(); }],
                ['Go to', () => { window.__dbg.teleport(n.area, Math.floor(n.x / TILE), Math.floor(n.y / TILE) + 1, 'up'); this.done(); }],
                ['Talk', () => { UI.close(); talkTo(n); }],
            ]);
        }
    },
    setHearts(id, h) { const r = rel(id); r.met = true; r.pts = HEARTS[h]; Save.touch(); },
    bring(n, i) {
        const p = G.player, a = G.area, tx = Math.floor(p.x / TILE) + (i % 5) - 2, ty = Math.floor((p.y - 2) / TILE) + 1 + Math.floor(i / 5);
        const f = a.nearestFree ? a.nearestFree(tx, ty, 6) || [tx, ty] : [tx, ty];
        n.area = a.id; n.x = (f[0] + 0.5) * TILE; n.y = (f[1] + 0.6) * TILE; n.path = null; n.sleeping = false; n.hidden = false; n.dir = 'up'; n.face = 'up';
    },
    tab_things(body) {
        this.row(body, 'Money and tickets', [
            ['+1,000', () => addMoney(1000, false, 'qa')], ['+100,000', () => addMoney(100000, false, 'qa')], ['+1,000,000', () => addMoney(1000000, false, 'qa')],
            ['+500 tickets', () => addTickets(500)], ['Money to 0', () => addMoney(-S.money, true, 'qa')],
        ]);
        this.row(body, 'Tools', Object.keys(ITEMS).filter(k => ITEMS[k].type === 'tool').map(k => [ITEMS[k].name, () => addItem(k, 1, true)]));
        body.appendChild(stLabel('Find a thing (by name or id)'));
        const q = el('input'); q.type = 'search'; q.placeholder = 'e.g. sofa, fish_bass, seed'; q.style.width = '100%';
        const res = el('div'); Object.assign(res.style, { display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0 10px' });
        const find = () => {
            res.innerHTML = '';
            const s = q.value.trim().toLowerCase();
            if (s.length < 2) return;
            const hits = Object.keys(ITEMS).filter(k => k.toLowerCase().includes(s) || (ITEMS[k].name || '').toLowerCase().includes(s)).slice(0, 48);
            for (const k of hits) {
                res.appendChild(chip(`${ITEMS[k].name || k} ×1`, () => addItem(k, 1, true)));
                res.appendChild(chip('×10', () => addItem(k, 10, true)));
            }
            if (!hits.length) res.appendChild(el('span', 'note', 'Nothing by that name.'));
        };
        q.addEventListener('input', find);
        body.append(q, res);
        setTimeout(() => q.focus(), 50);
    },
    tab_unlock(body) {
        const lv = id => shopLevel(id);
        this.row(body, `Fortune's shop: ${shopName('shop')} (step ${lv('shop')})`, SHOP_UP.shop.names.map((n, i) => [n, () => { shopState('shop').level = i + 1; shopState('shop').reno = null; Save.touch(); this.done(n + ' (go in again to see it)'); }]));
        this.row(body, `Clementine's: ${shopName('boutique')} (step ${lv('boutique')})`, SHOP_UP.boutique.names.map((n, i) => [n, () => { shopState('boutique').level = i + 1; shopState('boutique').reno = null; Save.touch(); this.done(n + ' (go in again to see it)'); }]));
        this.row(body, `Sarah's house: size ${S.house.level + 1} of ${HOUSE_SIZES.length}`, HOUSE_SIZES.map((s, i) => [`${s[0]}×${s[1]}`, () => { S.house.level = i; delete G.areas.house; Save.touch(); this.done('The house is that size now (go in again)'); }]));
        const P = projState(), day = Clock.dayNum();
        this.row(body, 'Town projects (built tomorrow morning, or now)', [
            ...PROJECTS.map(p => [(projectBuilt(p.id) ? '✓ ' : '') + p.name, () => { P.paid[p.id] = p.cost; P.done[p.id] = day; projectsTick(); this.done(p.name + ' built'); }]),
            ['All of them', () => { for (const p of PROJECTS) { P.paid[p.id] = p.cost; P.done[p.id] = day; } projectsTick(); this.done('Every project built'); }],
        ]);
        this.row(body, 'The museum', [
            ['20 gifts given', () => { S.stats.donated = Math.max(S.stats.donated || 0, 20); Save.touch(); this.done('The museum counts twenty gifts'); }],
        ]);
        this.row(body, 'Captain Shrimpy', [
            [`washes up today (now: ${S.sea && S.sea.stage != null ? 'stage ' + S.sea.stage : 'not yet'})`, () => { S.sea = S.sea || {}; S.sea.from = day - 7; seaTick(); this.done('Look on the beach east of the pier'); }],
        ]);
        this.row(body, 'Beta switches (the page reloads, keeping this island)', [
            [`Civic rooms: ${CIVIC_PREVIEW ? 'on' : 'off'}`, () => this.flip('sc-civic', CIVIC_PREVIEW)],
            [`New look on the island: ${ENV_ISLAND ? 'on' : 'off'}`, () => this.flip('sc-env-island', ENV_ISLAND)],
            [`Neighbors' plans shown: ${plansShown() ? 'yes' : 'no'}`, () => this.flip('sc-plans', plansShown())],
        ]);
    },
    flip(key, was) { lsSet(key, was ? '0' : '1'); this.reload(); },
    tab_games(body) {
        const D = window.__dbg, near = () => NPCs.here().sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0];
        this.row(body, 'Arcade cabinets (no fee)', Object.keys(ARCADE_GAMES).map(k => [ARCADE_GAMES[k].name || k, () => { UI.close(); D.arcade(k); }]));
        this.row(body, 'Club', [
            ...Object.keys(SONGS).map(k => ['Dance: ' + SONGS[k].name, () => { UI.close(); Dance.start(k); }]),
            ['Karaoke', () => { UI.close(); D.karaoke(); }],
        ]);
        this.row(body, 'With the nearest neighbor here', ['tag', 'hide', 'seek', 'derby', 'volley', 'snowball'].map(k => [k, () => {
            const n = near();
            if (!n) { UI.toast('Nobody here: bring someone over from People first'); return; }
            UI.close(); D.islandGame(k === 'seek' || k === 'hide' ? 'hide' : k, n.id, k === 'seek' ? 'seek' : k === 'hide' ? 'hide' : undefined);
        }]));
        this.row(body, 'Other', [
            ['Jump rope (on the square)', () => { UI.close(); if (!D.rope()) UI.toast('Nobody turning the rope right now'); }],
            ['Fishing spot', () => { const f = D.fishSpot(); if (f) D.teleport('island', f[0], f[1], 'down'); addItem('rod', 1, true); this.done('A rod, at the water'); }],
            ['Kiln: everything done', () => { D.kilnDone(); this.done('The kiln is done'); }],
        ]);
    },
    tab_view(body) {
        this.row(body, 'Zoom', [['Closer', () => Zoom.in()], ['Further', () => Zoom.out()]]);
        this.row(body, 'Screen', [
            [`HUD: ${this.hudOff ? 'hidden' : 'shown'}`, () => { this.hudOff = !this.hudOff; for (const id of ['#hudL', '#hudR', '#hudB', '#hint', '#toasts']) { const e = $(id); if (e) e.style.visibility = this.hudOff ? 'hidden' : ''; } this.btn.style.visibility = this.hudOff ? 'hidden' : ''; this.show(); }],
            [`Frame rate: ${this.fps.on ? 'shown' : 'hidden'}`, () => { this.fps.on = !this.fps.on; this.fpsShow(); this.show(); }],
            [`Tile grid (new look): ${EnvGround.gridOn.value ? 'on' : 'off'}`, () => { EnvGround.gridOn.value = EnvGround.gridOn.value ? 0 : 1; this.show(); }],
        ]);
        body.appendChild(el('p', 'note', 'Picture quality, draw distance and 2D/3D are in the game\'s own Settings.'));
    },
    fpsShow() {
        const F = this.fps;
        if (!F.el) {
            F.el = el('div', 'qa-fps');
            Object.assign(F.el.style, { position: 'fixed', right: '8px', top: '50%', zIndex: 60, padding: '3px 6px', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', font: '12px ui-monospace, monospace', pointerEvents: 'none' });
            document.body.appendChild(F.el);
        }
        F.el.hidden = !F.on;
    },
    /* once a frame from the main loop */
    tick() {
        const F = this.fps;
        if (!F || !F.on) return;
        F.n++;
        const now = performance.now();
        if (now - F.t >= 500) {
            const mem = performance.memory ? ` · ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : '';
            F.el.textContent = `${Math.round(F.n * 1000 / (now - F.t))} fps${mem}`;
            F.n = 0; F.t = now;
        }
    },
    tab_saves(body) {
        const snaps = this.snaps();
        body.appendChild(stLabel('Snapshots (in this browser)'));
        const nm = el('input'); nm.placeholder = 'a name, e.g. before the statue'; nm.style.width = '60%';
        const r = el('div'); Object.assign(r.style, { display: 'flex', gap: '6px', margin: '2px 0 8px' });
        r.append(nm, btn('Keep this island', '', async () => {
            const name = nm.value.trim() || `${dayLabel(Clock.dayNum())} ${Clock.fmt().s}`;
            try { lsSet(QA_SNAP + name, await this.code()); this.done('Kept: ' + name, true); this.show(); }
            catch (e) { UI.toast('Could not keep it: ' + e.message); }
        }));
        body.appendChild(r);
        for (const name of snaps) this.row(body, null, [[name, () => {}], ['Load', () => this.load(lsGet(QA_SNAP + name))], ['Delete', () => { lsDel(QA_SNAP + name); this.show(); }]]);
        if (!snaps.length) body.appendChild(el('p', 'note', 'None kept yet.'));
        this.row(body, 'Start over', [['A fresh island', () => this.load(null)]]);
        body.appendChild(stLabel('A save code (SC1:, SC0: or JSON): brought in as an old save would be'));
        const ta = el('textarea'); Object.assign(ta.style, { width: '100%', height: '5em' });
        body.appendChild(ta);
        this.row(body, null, [
            ['Load this code', () => { const c = ta.value.trim(); if (c) this.load(c); }],
            ['This island\'s code', async () => { ta.value = await this.code(); ta.select(); }],
        ]);
    },
    snaps() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(QA_SNAP)) out.push(k.slice(QA_SNAP.length)); } } catch (e) { /* none */ } return out.sort(); },
    /* this island as a save code, with Sarah where she stands */
    async code() {
        const p = G.player;
        S.player.area = G.area.id; S.player.x = p.x; S.player.y = p.y; S.player.dir = p.dir;
        return Save.exportCode(S);
    },
    async load(code) {
        if (code) { try { await Save.importCode(code); } catch (e) { UI.toast("That code didn't load: " + e.message); return; } }
        try {
            if (code) sessionStorage.setItem(QA_CARRY, code); else sessionStorage.removeItem(QA_CARRY);
            sessionStorage.removeItem(QA_CLOCK);
        } catch (e) { UI.toast('This browser kept nothing: ' + e.message); return; }
        location.reload();
    },
    /* reload the page with this island */
    async reload() { await this.carry(true); location.reload(); },
    /* the island as it is now, carried over a reload anyone else's code does (every few seconds while playing) */
    async carry(any) {
        if (!QA || !S || !S.started || (!any && G.mode !== 'play')) return;
        try { sessionStorage.setItem(QA_CLOCK, String(Clock.offsetMs || 0)); sessionStorage.setItem(QA_CARRY, await this.code()); } catch (e) { /* too big for it: never mind */ }
    },
    tab_notes(body) {
        const notes = this.notes();
        body.appendChild(stLabel('Note a problem (kept with where and when it was)'));
        const ta = el('textarea'); Object.assign(ta.style, { width: '100%', height: '4em' }); ta.placeholder = 'What looks or plays wrong';
        const sev = el('select'); for (const s of ['minor', 'medium', 'major', 'blocker']) { const o = el('option', null, s); sev.appendChild(o); }
        body.append(ta);
        const r = el('div'); Object.assign(r.style, { display: 'flex', gap: '6px', margin: '4px 0 10px' });
        r.append(sev, btn('Note it', '', () => {
            const t = ta.value.trim();
            if (!t) return;
            notes.push({ at: new Date().toISOString(), sev: sev.value, note: t, where: this.where(), view: Env.on ? 'new look' : R3.active() ? 'HD-2D' : '2D', mode: G.mode });
            lsSet(QA_NOTES, JSON.stringify(notes)); this.show();
        }));
        body.appendChild(r);
        notes.slice().reverse().forEach((n, i) => {
            const k = notes.length - 1 - i;
            this.row(body, `${n.sev} · ${n.where} · ${n.view}`, [[n.note, () => {}], ['Delete', () => { notes.splice(k, 1); lsSet(QA_NOTES, JSON.stringify(notes)); this.show(); }]]);
        });
        this.row(body, null, [['Copy every note', async () => {
            const txt = notes.map(n => `[${n.sev}] ${n.note}\n  ${n.where} (${n.view}) ${n.at}`).join('\n');
            try { await navigator.clipboard.writeText(txt); UI.toast('Copied'); } catch (e) { ta.value = txt; ta.select(); }
        }]]);
    },
    notes() { try { return JSON.parse(lsGet(QA_NOTES) || '[]'); } catch (e) { return []; } },
};
