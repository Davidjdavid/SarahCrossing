/* ---- 40_ui.js ---- */
/* HTML overlays: dialogue, choices, toasts, panels, HUD */
const UI = {
    modal: false, dialogOpen: false, _adv: null, _typing: false, _full: '', _chooser: null,
    speakerInfo(sp) {
        if (!sp) return null;
        if (sp === 'sarah' && Online.visitor()) { const d = NPC_DEFS[Online.who()]; return { name: d.name, color: d.color, icon: `${d.human}_down_stand`, voice: d.voice, wave: d.wave }; }
        if (sp === 'sarah') return { name: S.playerName || 'Sarah', color: '#b3263a', icon: sarahSprite(S.player.outfit, 'down_happy'), voice: 520, wave: 'sine' };
        if (typeof sp === 'object') return sp;
        const d = NPC_DEFS[sp];
        if (d) return { name: d.name, color: d.color, icon: d.human ? `${d.human}_down_stand` : `${d.sprite}_0`, voice: d.voice, wave: d.wave };
        const extra = SPEAKERS[sp];
        return extra || { name: sp, color: '#6e5a78' };
    },
    /* show one or more lines; resolves when done */
    async say(sp, lines, opts) {
        opts = opts || {};
        if (!Array.isArray(lines)) lines = [lines];
        for (const ln of lines) await this._line(sp, ln, opts);
        if (!opts.keep) this.hideDialog();
    },
    async ask(sp, text, choices, opts) {
        opts = opts || {};
        await this._line(sp, text, Object.assign({}, opts, { noWait: true }));
        const idx = await this._choose(choices, opts.cancel != null ? opts.cancel : choices.length - 1);
        if (!opts.keep) this.hideDialog();
        return idx;
    },
    _line(sp, text, opts) {
        // (a good friend calls Sarah by the nickname they gave her: 6zl_nicknames.js)
        text = fillText(typeof nickIn === 'function' ? nickIn(sp, text) : text);
        const box = $('#dialog'), tag = $('#nametag'), dt = $('#dtext'), nx = $('#dnext'), bub = $('#bubble');
        box.hidden = false;
        this.dialogOpen = true;
        const info = this.speakerInfo(sp);
        bub.classList.toggle('letter', !!opts.letter);
        if (info) {
            tag.hidden = false;
            tag.style.setProperty('--tag', info.color || '#6e5a78');
            tag.textContent = '';
            if (info.icon && Assets.has(info.icon)) tag.appendChild(iconCanvas(info.icon, 22));
            tag.appendChild(document.createTextNode(info.name));
        } else tag.hidden = true;
        dt.textContent = '';
        nx.hidden = true;
        this._typing = true;
        this._full = text;
        this._sp = sp;          // (who's speaking: their doll's mouth moves, 33kb_doll_act.js)
        return new Promise(res => {
            let i = 0;
            const speed = opts.fast ? 3 : 1;
            const voice = info && (info.voice || VOICES[sp]);
            const step = () => {
                if (!this._typing) return;
                i = Math.min(text.length, i + speed);
                dt.textContent = text.slice(0, i);
                if (voice && /[a-z0-9]/i.test(text[i - 1] || '')) Voices.blip(typeof sp === 'string' ? sp : null, info, text.charCodeAt(i - 1));
                if (i >= text.length) { this._typing = false; done(); return; }
                this._timer = setTimeout(step, 22);
            };
            const done = () => {
                dt.textContent = text;
                if (opts.noWait) { res(); return; }
                nx.hidden = false;
                this._adv = () => { this._adv = null; nx.hidden = true; Sfx.ui('tick'); res(); };
            };
            this._finish = () => { clearTimeout(this._timer); this._typing = false; done(); };
            step();
        });
    },
    advance() {
        if (this._chooser) return;
        if (this._typing) { this._finish(); return; }
        if (this._adv) this._adv();
    },
    _choose(choices, cancelIdx) {
        const box = $('#choices');
        box.innerHTML = '';
        return new Promise(res => {
            // nothing is highlighted until the arrow keys are used (a tap or a click just picks)
            let sel = -1;
            const btns = choices.map((c, i) => {
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'choice'; b.textContent = fillText(c);
                b.addEventListener('click', ev => { ev.stopPropagation(); pick(i); });
                box.appendChild(b);
                return b;
            });
            const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
            paint();
            const pick = i => { box.innerHTML = ''; this._chooser = null; Sfx.ui('ok'); res(i); };
            const n = btns.length;
            this._chooser = {
                key(code) {
                    if (code === 'ArrowUp' || code === 'KeyW') { sel = sel < 0 ? n - 1 : (sel + n - 1) % n; paint(); Sfx.ui('tick'); }
                    else if (code === 'ArrowDown' || code === 'KeyS') { sel = sel < 0 ? 0 : (sel + 1) % n; paint(); Sfx.ui('tick'); }
                    else if (isA(code)) {
                        // the first press shows where the highlight is; the next one picks it
                        if (sel < 0) { sel = 0; paint(); Sfx.ui('tick'); } else pick(sel);
                    } else if (code === 'Escape' || code === 'KeyB') pick(cancelIdx);
                },
            };
        });
    },
    hideDialog() {
        $('#dialog').hidden = true;
        $('#choices').innerHTML = '';
        this.dialogOpen = false;
        this._adv = null; this._chooser = null; this._typing = false;
    },
    toast(text, icon) {
        const el = document.createElement('div');
        el.className = 'toast';
        if (icon && Assets.has(icon)) el.appendChild(iconCanvas(icon, 24));
        el.appendChild(document.createTextNode(text));
        const box = $('#toasts');
        box.appendChild(el);
        while (box.children.length > 3) box.firstChild.remove();
        setTimeout(() => el.remove(), 2800);
    },
    /* generic modal panel */
    open(opts) {
        this.close(true);
        const panel = $('#panel'), scrim = $('#scrim');
        panel.className = opts.phone ? 'phone' : opts.wide ? 'wide' : '';
        panel.innerHTML = '';
        const head = document.createElement('div');
        head.className = 'phead';
        if (opts.back) {
            const b = document.createElement('button');
            b.className = 'back'; b.type = 'button'; b.textContent = '\u2039'; b.setAttribute('aria-label', 'Back');
            b.addEventListener('click', () => opts.back());
            head.appendChild(b);
        }
        const h = document.createElement('h2');
        h.textContent = opts.title || '';
        head.appendChild(h);
        const x = document.createElement('button');
        x.className = 'x'; x.type = 'button'; x.textContent = '\u00d7'; x.setAttribute('aria-label', 'Close');
        x.addEventListener('click', () => this.close());
        head.appendChild(x);
        panel.appendChild(head);
        if (opts.tabs) panel.appendChild(opts.tabs);
        const body = document.createElement('div');
        body.className = 'pbody';
        panel.appendChild(body);
        let foot = null;
        if (opts.foot) { foot = document.createElement('div'); foot.className = 'pfoot'; panel.appendChild(foot); }
        panel.hidden = false; scrim.hidden = false;
        scrim.onclick = () => this.close();
        this.modal = true;
        this._onClose = opts.onClose || null;
        this._keys = opts.keys || null;
        G.keys = {};
        return { panel, body, foot, head, title: h };
    },
    close(silent) {
        const panel = $('#panel');
        if (panel.hidden) return;
        panel.hidden = true; $('#scrim').hidden = true;
        panel.innerHTML = '';
        this.modal = false;
        this._keys = null;
        const cb = this._onClose;
        this._onClose = null;
        if (!silent) Sfx.ui('close');
        if (cb) cb();
    },
};

const SPEAKERS = {
    sign: { name: 'Sign', color: '#9a6b45' },
    board: { name: 'Island board', color: '#9a6b45' },
    phone: { name: 'Phone', color: '#3b2a45' },
    council: { name: 'The Cozy Council', color: '#3f8f3a', icon: 'floret_0', voice: 240, wave: 'square' },
    floret: { name: 'Sir Floret', color: '#3f8f3a', icon: 'floret_0', voice: 220, wave: 'square' },
    stalk: { name: 'Dame Stalk', color: '#4a9a42', icon: 'stalk_0', voice: 330, wave: 'square' },
    sprout: { name: 'Little Sprout', color: '#5aad4a', icon: 'sprout_0', voice: 620, wave: 'square' },
    everyone: { name: 'Everyone', color: '#e0559a' },
    plaque: { name: 'The plaque', color: '#a8832e' },
    ghost: { name: 'The old keeper', color: '#7a8ac8', icon: 'ghost_0', voice: 180, wave: 'sine', ghost: true },
    narrator: null,
};

function isA(code) { return code === 'Space' || code === 'Enter' || code === 'KeyE' || code === 'KeyX' || code === 'NumpadEnter'; }

/* ---------------------------------------------------------------- HUD */
const HUD = {
    show(on) { ['#hudL', '#hudR', '#hudB'].forEach(s => { $(s).hidden = !on; }); $('#hint').hidden = !on || G.touchUsed; if (on && typeof runButton === 'function') runButton(); },
    bonus() {
        const el0 = $('#bonuspill');
        if (!el0) return;
        const B = S && S.bonus, on = B && Date.now() < B.until && BONUSES[B.id];
        el0.hidden = !on;
        if (!on) return;
        const mins = Math.max(1, Math.ceil((B.until - Date.now()) / 60e3));
        const txt = `${BONUSES[B.id].name} \u00b7 ${mins} min`;
        if (el0.dataset.txt === txt) return;
        el0.dataset.txt = txt;
        el0.innerHTML = '';
        el0.appendChild(iconCanvas(BONUSES[B.id].icon, 16));
        el0.appendChild(document.createTextNode(txt));
        el0.title = BONUSES[B.id].text;
    },
    update() {
        if ($('#hudL').hidden) return;
        if (G.frame % 120 === 0) this.bonus();
        const f = Clock.fmt();
        $('#clock').innerHTML = `${f.t}<span class="ampm">${f.ap}</span>`;
        const w = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow' }[G.weather] || '';
        const ev = eventLabel();
        $('#dateline').textContent = `${Clock.dateLine()} \u00b7 ${w}${ev ? ' \u00b7 ' + ev : ''}`;
        // (the HUD's tiles and the weather drawn like the phone's icons, 41c_phone_icons.js)
        if (!this.iconsDrawn) { this.iconsDrawn = true; $$('#ui .vic[data-vec]').forEach(v => { if (!v.firstChild) v.appendChild(phoneIcon(v.dataset.vec, v.dataset.col, v.closest('.hbtn') ? 34 : 28)); }); }
        const h = Clock.hourF ? Clock.hourF() : 12, wk = G.weather === 'sunny' && (h < 6 || h >= 19.5) ? 'moon' : PHONE_ICONS[G.weather] ? G.weather : 'sunny', wx = $('#wxic');
        if (wx && wx.dataset.w !== wk) { wx.dataset.w = wk; wx.innerHTML = ''; wx.appendChild(phoneIcon(wk, '#e8dcc8', 18)); }
        $('#money').textContent = fmtNum(S.money);
        const unread = S.mail.filter(m => !m.read && m.day <= Clock.dayNum()).length + Invites.pending().length;
        const pb = $('#bPhone');
        let badge = pb.querySelector('.badge');
        if (unread && !badge) { badge = document.createElement('span'); badge.className = 'badge'; pb.appendChild(badge); }
        if (badge) { if (unread) badge.textContent = unread; else badge.remove(); }
    },
};
function eventLabel() {
    const ev = G.events || new Set();
    if (ev.has('birthday')) return 'Your birthday!';
    const main = holidaysToday().filter(h => !['blossom', 'spooky', 'lights', 'fireflies'].includes(h.id));
    if (main.length) return main.map(h => h.name).join(' \u00b7 ');
    if (ev.has('newyear')) return "New Year's Day";
    if (ev.has('lunar')) return 'Lunar New Year';
    if (ev.has('valentine')) return "Valentine's Day";
    if (ev.has('july4')) return 'Fourth of July';
    if (ev.has('halloween')) return 'Halloween';
    if (ev.has('winterfest')) return 'Winter Holiday';
    if (ev.has('nye')) return "New Year's Eve";
    if (ev.has('blossom')) return 'Cherry blossoms';
    return '';
}

/* {island}, {name}, {title} ... */
function fillText(t) {
    return String(t)
        .replace(/\{island\}/g, S.islandName || 'the island')
        .replace(/\{name\}/g, S.playerName || 'Sarah')
        .replace(/\{time\}/g, Clock.fmt().s)
        .replace(/\{early\}/g, Clock.fmt().s)
        .replace(/\{title\}/g, () => rpick(JOB_TITLES))
        .replace(/\{hours:(\w+)\}/g, (m, id) => hoursText(id))
        .replace(/\{day\}/g, Clock.dateLine());
}

