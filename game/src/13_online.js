/* ---- 13_online.js ---- */
/* Playing together. Five people can play: Sarah, whose island it is, and the people who visit her: David, James,
   John and Joe. Each device says who's playing on it.
   The island (the ground, houses, trees, the museum, the house inside...) is Sarah's: only her game changes it. A
   visitor's save holds just what's theirs (PERSON_KEYS: pocket, money, friendships, mail...), kept on the server next
   to the island (server/islands.mjs); their game puts it on top of the island as Sarah last saved it.
   Everyone on the island at the same time sees everyone else: where they walk, what they say, their dance moves
   (the live connection in server/live.mjs). Letters and gifts between people go through the server's mailboxes. */
const PEOPLE = ['sarah', 'david', 'james', 'john', 'joe'];
const WHO_KEY = 'sc-who';
/* what a visitor keeps for themselves (everything else in a save is the island) */
const PERSON_KEYS = ['money', 'pocket', 'storage', 'player', 'wardrobe', 'npcs', 'seen', 'recipes', 'mail', 'mailSeq', 'mailIn', 'dance',
    'stats', 'dayStats', 'poems', 'lastPoem', 'pottery', 'arcade', 'rope', 'karaoke', 'specials', 'quests', 'tasks', 'bag', 'day', 'startDay',
    'lastDay', 'playerName', 'cookLog', 'colors', 'colorSeq', 'designs', 'designSeq', 'look', 'bonus', 'texts', 'fresh', 'held', 'invites',
    'inviteAt', 'invite', 'lost', 'music', 'shells', 'gems', 'trees', 'games', 'bank', 'post', 'mysongs'];
const ONLINE_STATE_EVERY = 120;          // ms between position updates while walking

const Online = {
    me: null,            // who's playing on this device (null: not picked yet, so it's Sarah until someone says otherwise)
    island: null,        // a visitor's copy of the island as Sarah last saved it
    ws: null, retry: 0, others: new Map(), lastState: '', stateAt: 0, mine: null, islandAt: 0, islandWant: 0, replaced: false,

    init() { const w = lsGet(WHO_KEY); this.me = PEOPLE.includes(w) ? w : null; },
    who() { return this.me || 'sarah'; },
    visitor() { return !!this.me && this.me !== 'sarah'; },
    name(who) { return who === 'sarah' ? 'Sarah' : (NPC_DEFS[who] && NPC_DEFS[who].name) || cap(who); },
    /* play as someone else on this device (the page reloads into their game) */
    async become(who) {
        if (S && S.started && G.mode !== 'title') await Cloud.flush();
        else if (Cloud.seq !== Cloud.sentSeq) await Cloud.flush();
        lsSet(WHO_KEY, who);
        IslandList.leave();
    },

    /* ---------------------------------------------------------------- a visitor's save, and the island under it */
    personOf(st) {
        const p = {};
        for (const k of PERSON_KEYS) if (st[k] !== undefined) p[k] = st[k];
        const isl = this.island || {};
        // the island's flags and settings, with the visitor's own on top: keep only what's theirs
        p.flags = {};
        for (const [k, v] of Object.entries(st.flags || {})) if (!isl.flags || isl.flags[k] !== v) p.flags[k] = v;
        p.settings = Object.assign({}, st.settings);
        delete p.settings.clockShift;
        return p;
    },
    merge(isl, person) {
        const st = Object.assign({}, isl);
        // Sarah's own things are never the visitor's: what the visitor hasn't got yet starts new (migrate fills it in)
        for (const k of PERSON_KEYS) { if (person[k] !== undefined) st[k] = person[k]; else delete st[k]; }
        st.flags = Object.assign({}, isl.flags, person.flags);
        st.settings = Object.assign({}, person.settings);
        if (isl.settings && isl.settings.clockShift != null) st.settings.clockShift = isl.settings.clockShift;
        return st;
    },
    /* where someone steps onto the island: the boat at the end of the pier (Joe lives here: his front door) */
    arrival(who) { return who === 'joe' ? doorTileOf('h_joe') : W0.boat; },
    newPerson(who) {
        const base = newState(), p = {};
        for (const k of PERSON_KEYS) if (base[k] !== undefined) p[k] = base[k];
        const [tx, ty] = this.arrival(who);
        p.player = { area: 'island', x: (tx + 0.5) * TILE, y: (ty + 0.6) * TILE, dir: 'down', outfit: who, acc: null, eyes: null };
        p.wardrobe = { outfits: [who], accs: [] };
        p.money = 1000;
        p.playerName = this.name(who);
        p.day = Clock.dayNum(); p.startDay = p.day;
        p.npcs = {};
        // Joe lives here, so he already knows everybody (and they like him)
        if (who === 'joe') for (const id of NEIGHBORS.concat(['fortune', 'floss', 'waffle', 'wasabi', 'goat'])) p.npcs[id] = { met: true, pts: 45, talkDay: -1, giftDay: -1, gifts: 0, favor: null, photo: false, letter: false, last: '' };
        p.mail = [{ id: 1, from: 'fortune', subject: `Welcome to ${this.island && this.island.islandName || 'the island'}!`,
            body: who === 'joe' ? VISIT_WELCOME.joe : VISIT_WELCOME.any.replace('{who}', this.name(who)), gift: null, gifts: null, read: false, claimed: false, day: p.day }];
        p.mailSeq = 2;
        p.flags = { introDone: true, metJoe: true };
        return p;
    },

    /* ---------------------------------------------------------------- the live connection */
    connect() {
        // (not before this device says who's playing: it would show up as Sarah, and bump the real one)
        if (!this.me || !Cloud.id || this.ws || this.replaced) return;
        const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/live/${encodeURIComponent(Cloud.id)}?who=${this.who()}`;
        let ws;
        try { ws = new WebSocket(url); } catch (e) { this.later(); return; }
        this.ws = ws;
        ws.onopen = () => { this.retry = 0; this.lastState = ''; this.tick(true); };
        ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } this.got(m); };
        ws.onclose = e => {
            if (this.ws === ws) this.ws = null;
            for (const who of [...this.others.keys()]) this.drop(who, true);
            if (e.code === 4000) { this.replaced = true; if (G.mode === 'play') UI.toast(`${this.name(this.who())} opened the game on another device, so this one stepped away.`); return; }
            this.later();
        };
    },
    later() { clearTimeout(this.retryT); this.retry = Math.min(30e3, (this.retry || 1000) * 2); this.retryT = setTimeout(() => this.connect(), this.retry); },
    send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); },
    /* a two-player game's message for one other person (6zv_versus.js) */
    game(to, d) { this.send({ t: 'game', to, d }); },
    got(m) {
        if (m.t === 'here') { for (const p of m.people || []) this.add(p, true); return; }
        if (m.t === 'join') { this.add(m, false); return; }
        if (m.t === 'leave') { this.drop(m.who); return; }
        if (m.t === 'island') { if (this.visitor()) this.refreshIsland(m.rev); return; }
        if (m.t === 'mail') { this.fetchMail(); return; }
        if (m.t === 'game') { if (typeof VsNet !== 'undefined') VsNet.got(m.from, m.d); return; }
        const o = this.others.get(m.who);
        if (!o) return;
        if (m.t === 'state') this.place(o, m);
        else if (m.t === 'say') { Bubbles.show(o, m.text); o.sayT = Date.now(); if (o.area !== G.area.id && G.mode === 'play') UI.toast(`${this.name(o.who)}: ${m.text}`); }
        else if (m.t === 'emote') this.emote(o, m.e);
    },

    /* ---------------------------------------------------------------- everyone else, drawn on the island */
    add(p, quiet) {
        if (!PEOPLE.includes(p.who) || p.who === this.who()) return;
        let o = this.others.get(p.who);
        if (!o) {
            o = { kind: 'remote', who: p.who, def: { human: true }, x: 0, y: 0, tx: 0, ty: 0, dir: 'down', moving: false, anim: 0, emote: null, emoteT: 0, h: 24,
                area: null, sleeping: false, look: null };
            o.hit = { x: 0, y: 0, w: 16, h: 22 };
            o.interact = () => this.meet(o);
            o.draw = ctx => this.drawOther(ctx, o);
            this.others.set(p.who, o);
        }
        this.place(o, p, true);
        if (!quiet && G.mode === 'play') { UI.toast(`${this.name(p.who)} is on the island!`); Sfx.ui('ok'); }
        NPCs.place(false);
    },
    drop(who, quiet) {
        if (typeof VsNet !== 'undefined') VsNet.gone(who);
        const o = this.others.get(who);
        if (!o) return;
        this.others.delete(who);
        Bubbles.hide(o);
        if (!quiet && G.mode === 'play') UI.toast(`${this.name(who)} left the island.`);
        NPCs.place(false);
    },
    place(o, m, jump) {
        if (m.area !== undefined) { if (m.area !== o.area) jump = true; o.area = m.area; }
        if (m.x != null) o.tx = m.x;
        if (m.y != null) o.ty = m.y;
        if (m.dir) o.dir = m.dir;
        if (m.moving != null) o.moving = m.moving;
        if (m.run != null) o.run = m.run;
        if (m.sit != null) o.sit = m.sit;
        if (m.look !== undefined) o.look = m.look;
        if (jump) { o.x = o.tx; o.y = o.ty; }
    },
    /* a dance move (MOVES): its emote pops up over them, with a little hop */
    emote(o, e) {
        const mv = MOVES[e];
        o.emote = mv ? mv.emote : 'note'; o.emoteT = 80; o.hopT = 36;
    },
    /* the people on the island who are where Sarah (or whoever's playing here) is */
    here() { const a = G.area && G.area.id, out = []; for (const o of this.others.values()) if (o.area === a) out.push(o); return out; },
    /* is this person (an NPC's real-life self) on the island right now? Then their NPC steps aside */
    isHere(id) { return id === this.who() || this.others.has(id); },
    update() {
        for (const o of this.others.values()) {
            const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
            if (d > 64) { o.x = o.tx; o.y = o.ty; }
            else if (d > 0.3) { const k = Math.min(1, (o.run ? 2.2 : 1.4) / d); o.x += dx * k; o.y += dy * k; }
            o.walking = d > 0.6 || o.moving;
            if (o.walking) o.anim++;
            if (o.emoteT > 0 && --o.emoteT === 0) o.emote = null;
            if (o.hopT > 0) { o.hopT--; o.hop = Math.max(0, Math.round(Math.sin(o.hopT / 36 * Math.PI * 3) * 3)); } else o.hop = 0;
            o.hit.x = o.x - 8; o.hit.y = o.y - 22;
            if (o.sayT && Date.now() - o.sayT > 6000) { Bubbles.hide(o); o.sayT = 0; }
        }
        if (this.mineT && Date.now() - this.mineT > 6000) { Bubbles.hide(this.mineProxy()); this.mineT = 0; }
        if (this.mineT) { const pr = this.mineProxy(), p = G.player; if (p) { pr.x = p.x; pr.y = p.y; pr.area = G.area.id; } }
        if (G.frame % 6 === 0) this.tick(false);
        if (G.frame % 4 === 0) this.tags();
        if (G.frame % 30 === 0) this.chatButton();
    },
    /* a chat button by the map and zoom buttons, while someone else is on the island */
    chatButton() {
        let b = $('#bChat');
        const show = this.others.size > 0 && G.mode === 'play';
        if (!b && show) {
            b = el('button', 'mbtn');
            b.id = 'bChat'; b.type = 'button'; b.title = 'Say something (Enter)'; b.setAttribute('aria-label', 'Say something');
            b.appendChild(iconCanvas('emote_dots', 28));
            b.addEventListener('click', ev => { ev.stopPropagation(); if (!UI.modal && !G.busy) this.chat(); });
            $('.hud-mini').prepend(b);
        }
        if (b) b.hidden = !show;
    },
    frameKey(o) {
        const side = o.dir === 'left' || o.dir === 'right', d = side ? 'side' : o.dir;
        let b = 'stand';
        if (o.walking) { const k = Math.floor(o.anim / (o.run ? 5 : 8)) % 4; b = k === 1 ? 'walkA' : k === 3 ? 'walkB' : 'stand'; }
        return o.sit ? 'down_sit' : `${d}_${b}`;
    },
    frameOf(o) {
        const f = this.frameKey(o);
        if (o.who === 'sarah') {
            const outfit = o.look && o.look.outfit, nm = `sarah_${outfit}_${f}`;
            return Assets.has(nm) ? nm : `sarah_crimson_${f}`;
        }
        return personFrame(o.who, f);
    },
    drawOther(ctx, o) {
        if (hdOn() && hdDrawOther(ctx, o)) return;
        const y = Math.round(o.y) - (o.hop || 0);
        spr(ctx, 'shadow_s', o.x, o.y + 1);
        spr(ctx, this.frameOf(o), o.x, y, o.dir === 'left');
    },
    /* name tags over everyone else (HTML, like the chat bubbles, so the words stay sharp) */
    tags() {
        let box = $('#nametags');
        if (!box) { box = el('div'); box.id = 'nametags'; $('#game').after(box); }
        // (while someone's chat bubble is up, it shows who's talking: their tag steps aside)
        const here = G.mode === 'play' && !UI.modal ? this.here().filter(o => !o.sayT) : [];
        for (const t of [...box.children]) if (!here.some(o => o.who === t.dataset.who)) t.remove();
        for (const o of here) {
            let t = box.querySelector(`[data-who="${o.who}"]`);
            if (!t) { t = el('div', 'ptag', this.name(o.who)); t.dataset.who = o.who; t.style.background = o.who === 'sarah' ? '#b3263a' : (NPC_DEFS[o.who] || {}).color || '#6e5a78'; box.appendChild(t); }
            const [sx, sy] = screenOf(o.x, o.y, 34);
            t.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
        }
    },
    /* where this device's player is: sent when it changes (and now and then anyway, so newcomers see them) */
    tick(force) {
        const p = G.player;
        if (!p || !this.ws || this.ws.readyState !== 1 || !G.area) return;
        if (G.mode === 'title' && !force) return;
        const st = { t: 'state', area: G.mode === 'play' ? G.area.id : null, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, dir: p.dir,
            moving: !!p.moving, run: !!p.run, sit: !!p.sit, look: this.who() === 'sarah' ? { outfit: S.player.outfit, hd: hdSarahSpec() } : null };
        const key = JSON.stringify(st), now = Date.now();
        if (!force && key === this.lastState && now - this.stateAt < 5000) return;
        if (!force && now - this.stateAt < ONLINE_STATE_EVERY) return;
        this.lastState = key; this.stateAt = now;
        this.send(st);
    },
    /* a dance move or emote this device's player just did, for everyone else to see */
    did(e) { this.send({ t: 'emote', e }); },
    mineProxy() { return this.mine || (this.mine = { def: { human: true }, x: 0, y: 0, area: null, sleeping: false }); },
    say(text) {
        text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
        if (!text) return;
        this.send({ t: 'say', text });
        const pr = this.mineProxy(), p = G.player;
        pr.x = p.x; pr.y = p.y; pr.area = G.area.id;
        Bubbles.show(pr, text);
        this.mineT = Date.now();
    },

    /* ---------------------------------------------------------------- meeting someone */
    async meet(o) {
        if (G.busy) return;
        const nm = this.name(o.who);
        faceToward(G.player, o);
        G.busy++;
        let k;
        // (a game of tag, when both are outside: 6zy_friend_games.js)
        const tag = typeof FriendTag !== 'undefined' && FriendTag.can(o);
        try { k = await UI.ask(null, `${nm} is right here.`, ['Wave', 'Say something', `Give ${nm} a gift`].concat(tag ? ['Play tag'] : [], ['Never mind'])); } finally { UI.hideDialog(); G.busy--; }
        if (k === 0) await doMove('wave');
        else if (k === 1) this.chat();
        else if (k === 2) this.giftTo(o.who);
        else if (k === 3 && tag) FriendTag.invite(o);
    },
    chat() {
        const P = UI.open({ title: 'Say something', foot: true });
        const f = el('label', 'field');
        f.appendChild(el('span', null, 'Everyone nearby sees it over your head'));
        const inp = el('input');
        inp.type = 'text'; inp.maxLength = 200; inp.id = 'chatline'; inp.autocomplete = 'off';
        f.appendChild(inp);
        P.body.appendChild(f);
        const quick = el('div', 'st-row');
        quick.style.marginTop = '10px';
        for (const q of CHAT_QUICK) quick.appendChild(chip(q, () => { this.say(q); UI.close(true); }));
        P.body.appendChild(quick);
        const go = () => { this.say(inp.value); UI.close(true); };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } e.stopPropagation(); });
        P.foot.appendChild(btn('Say it', 'green', go));
        setTimeout(() => inp.focus(), 50);
    },
    /* pick something from the pocket; it goes to them as a letter with the gift attached */
    giftTo(who) {
        const nm = this.name(who);
        const P = UI.open({ title: `A gift for ${nm}`, foot: true });
        P.body.appendChild(el('p', 'muted', `Pick something from your pocket. ${nm} gets it as a letter, with the gift attached (right away if they're playing).`));
        const grid = el('div', 'grid');
        let picked = null;
        const msg = el('p', 'muted', '');
        S.pocket.forEach((s, i) => {
            if (!s || !ITEMS[s.id] || /^pot_|^art_|^dz_/.test(s.id)) return;    // handmade things live in one person's save
            const b = slotBtn(s.id, s.n, { onClick: () => { picked = i; grid.querySelectorAll('.slot').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); msg.textContent = itemName(s.id); } });
            grid.appendChild(b);
        });
        if (!grid.children.length) P.body.appendChild(el('p', null, 'Your pocket is empty.'));
        P.body.appendChild(grid);
        P.body.appendChild(msg);
        P.foot.appendChild(btn('Send it', 'green', async () => {
            const s = S.pocket[picked];
            if (!s) { msg.textContent = 'Pick something first.'; return; }
            const id = s.id;
            removeSlot(picked, 1);
            try {
                await this.post({ to: who, subject: `A gift from ${this.name(this.who())}`, body: `${giftNote(this.who(), who, id)}\n- ${this.name(this.who())}`, gift: id });
                UI.close(true);
                UI.toast(`${itemName(id)} is on its way to ${nm}!`, itemIcon(id));
                Sfx.play('item');
            } catch (e) { addItem(id, 1, true); msg.textContent = "Couldn't reach the island server, so it's still in your pocket."; }
        }));
    },
    /* the Mail app's "Write a letter": to anyone else who plays, maybe with a gift from the pocket */
    writeLetter() {
        const others = PEOPLE.filter(w => w !== this.who());
        const P = UI.open({ title: 'Write a letter', phone: true, back: () => appMail(), foot: true });
        let to = others[0], gift = null;
        const row = el('div', 'st-row');
        const chips = others.map(w => { const c = chip(this.name(w), () => { to = w; chips.forEach(x => x.classList.toggle('on', x === c)); }); return c; });
        chips[0].classList.add('on');
        chips.forEach(c => row.appendChild(c));
        P.body.appendChild(el('p', 'muted', 'To:'));
        P.body.appendChild(row);
        const f1 = el('label', 'field'); f1.style.marginTop = '10px';
        f1.appendChild(el('span', null, 'Subject'));
        const subj = el('input'); subj.type = 'text'; subj.maxLength = 80; subj.value = 'Hello from ' + this.name(this.who());
        f1.appendChild(subj);
        const f2 = el('label', 'field'); f2.style.marginTop = '10px';
        f2.appendChild(el('span', null, 'Letter'));
        const body = el('textarea'); body.maxLength = 2000; body.style.font = '700 16px/1.4 var(--body)';
        f2.appendChild(body);
        for (const i of [subj, body]) i.addEventListener('keydown', e => e.stopPropagation());
        P.body.appendChild(f1); P.body.appendChild(f2);
        const gl = el('p', 'muted', 'No gift. (Tap something in your pocket to attach it.)');
        const grid = el('div', 'grid'); grid.style.marginTop = '6px';
        S.pocket.forEach((s, i) => {
            if (!s || !ITEMS[s.id] || /^pot_|^art_|^dz_/.test(s.id)) return;
            const b = slotBtn(s.id, s.n, { onClick: () => {
                gift = gift === i ? null : i;
                grid.querySelectorAll('.slot').forEach(x => x.classList.remove('sel'));
                if (gift != null) b.classList.add('sel');
                gl.textContent = gift == null ? 'No gift.' : `Attached: ${itemName(s.id)}`;
            } });
            grid.appendChild(b);
        });
        P.body.appendChild(gl); P.body.appendChild(grid);
        const msg = el('p', 'muted', '');
        P.body.appendChild(msg);
        P.foot.appendChild(btn('Send', 'green', async () => {
            const text = body.value.trim();
            if (!text) { msg.textContent = 'Write something first!'; return; }
            const g = gift != null && S.pocket[gift] ? S.pocket[gift].id : null;
            if (g) removeSlot(gift, 1);
            try {
                await this.post({ to, subject: subj.value.trim() || 'A letter', body: `${text}\n- ${this.name(this.who())}`, gift: g });
                Sfx.play('item'); UI.toast(`Letter sent to ${this.name(to)}!`, 'app_mail'); appMail();
            } catch (e) { if (g) addItem(g, 1, true); msg.textContent = "Couldn't reach the island server. Try again in a moment."; }
        }));
    },
    /* a letter to someone on this island (through the server's mailboxes) */
    post(letter) {
        return Cloud.api('POST', `/api/islands/${encodeURIComponent(Cloud.id)}/mail`, Object.assign({ from: this.who() }, letter));
    },
    /* letters waiting on the server go into the Mail app; each one only once (S.mailIn is the last one in) */
    async fetchMail() {
        if (!Cloud.id || this.fetching) return;
        this.fetching = true;
        try {
            const r = await Cloud.api('GET', `/api/islands/${encodeURIComponent(Cloud.id)}/mail/${this.who()}`);
            const fresh = (r.letters || []).filter(l => l.seq > (S.mailIn || 0));
            if (!fresh.length) return;
            for (const l of fresh) {
                sendMail({ from: l.from, subject: l.subject, body: l.body, gift: l.gift && ITEMS[l.gift] ? l.gift : null });
                S.mailIn = l.seq;
            }
            if (S.started) await Cloud.flush();
            Cloud.api('DELETE', `/api/islands/${encodeURIComponent(Cloud.id)}/mail/${this.who()}?upTo=${S.mailIn}`).catch(() => {});
            const l = fresh[fresh.length - 1];
            if (G.mode === 'play') UI.toast(fresh.length > 1 ? `${fresh.length} new letters! Check your phone.` : `A letter from ${this.name(l.from)}${l.gift ? ' (with a gift!)' : ''}`, 'app_mail');
            HUD.update();
        } catch (e) { /* next time */ } finally { this.fetching = false; }
    },

    /* ---------------------------------------------------------------- a visitor sees Sarah's changes */
    async refreshIsland(rev) {
        this.islandWant = Math.max(this.islandWant, rev || 0);
        if (this.islandBusy) return;
        const wait = 30e3 - (Date.now() - this.islandAt);
        if (wait > 0) { clearTimeout(this.islandT); this.islandT = setTimeout(() => this.refreshIsland(), wait); return; }
        this.islandBusy = true;
        try {
            const r = await Cloud.api('GET', '/api/islands/' + encodeURIComponent(Cloud.id));
            this.islandAt = Date.now();
            this.island = r.state;
            lsSet('sc-view-' + Cloud.id, JSON.stringify(r.state));
            this.apply();
        } catch (e) { /* next time */ } finally { this.islandBusy = false; }
    },
    /* put Sarah's latest island under this visitor's things, and rebuild what's outside */
    apply() {
        if (!this.island || G.busy || UI.modal || Watchdog.minigame()) { clearTimeout(this.islandT); this.islandT = setTimeout(() => this.apply(), 5000); return; }
        const p = this.personOf(S);
        const next = migrate(this.merge(JSON.parse(JSON.stringify(this.island)), p));
        if (!next) return;
        for (const k of Object.keys(S)) if (!(k in next)) delete S[k];
        Object.assign(S, next);
        const here = G.area && G.area.id === 'island';
        G.areas.island = buildIsland(); restoreDrops(G.areas.island); spawnShells(G.areas.island); decorateIsland(G.areas.island);
        if (here) { G.area = G.areas.island; updateCam(true); }
    },
};
Online.init();

const CHAT_QUICK = ['Hi!', 'Come over here!', 'Look at this!', 'Want to go fishing?', 'Race you to the plaza!', 'Bye! See you later!'];
const VISIT_WELCOME = {
    any: "Hello hello, {who}!\nWelcome to the island! Sarah's island, technically. But everyone's welcome. That's the island way.\nYou've got your own pocket, your own sand dollars and your own friends to make. My shop is open most of the day. The cookie says you'll love it here.\n- Fortune",
    joe: "Hello hello, Joe!\nYou're playing, too! Everyone already knows you, so this is less 'welcome' and more 'oh good, it's Joe.'\nYour house is just how you left it. The cookie says: write more poems. (The cookie always says that.)\n- Fortune",
};
/* what goes in the letter when someone sends a gift */
function giftNote(from, to, id) {
    const it = itemName(id);
    if (to === 'sarah') return rpick([`I found ${aOrAn(it)} ${it} and thought of you.`, `For your island. (For you, mostly.) ${cap(aOrAn(it))} ${it}!`, `${cap(aOrAn(it))} ${it}! Don't say I never give you anything.`]);
    return rpick([`Here, ${aOrAn(it)} ${it}. Because I'm nice.`, `I found ${aOrAn(it)} ${it}. It's yours now.`, `${cap(aOrAn(it))} ${it}, for you. You're welcome.`]);
}
/* a visitor's own frame: they don't have every pose Sarah has, so a pose falls back to standing */
function personFrame(who, frame) {
    const nm = `${who}_${frame}`;
    if (Assets.has(nm)) return nm;
    const side = frame.startsWith('side_'), up = frame.startsWith('up_');
    const nm2 = `${who}_${side ? 'side' : up ? 'up' : 'down'}_stand`;
    return Assets.has(nm2) ? nm2 : 'sarah_crimson_down_stand';
}
/* the visitor's game won't do this: the island is Sarah's (a friendly word instead) */
function visitorStop(what) {
    if (!Online.visitor()) return false;
    UI.toast(rpick(VISITOR_STOP[what] || VISITOR_STOP.any).replace('{who}', Online.name(Online.who())), 'ui_hand');
    return true;
}
const VISITOR_STOP = {
    any: ["This is Sarah's island. That one's up to her!", "That's a Sarah thing. Ask her!"],
    decorate: ["Sarah's house, Sarah's furniture. You can look, though!"],
    build: ["Changing the island is Sarah's job. She has a whole phone app for it."],
    dig: ["Digging up Sarah's island? Bold. Maybe ask first.", "The shovel is for islanders. Sarah would notice."],
    chop: ["Chopping Sarah's trees? She'd notice. She notices everything."],
    plant: ["Planting is for whoever lives here. That's Sarah."],
    drop: ["Leave it on Sarah's island and it might get lost. It stays in your pocket."],
    take: ["That's something Sarah left here. Better leave it."],
    museum: ["Only islanders can donate. Brulee is very firm about it."],
    look: ["New looks are coming for everyone soon. For now, you look great."],
    farm: ["That's Sarah's garden. You can admire it."],
};
