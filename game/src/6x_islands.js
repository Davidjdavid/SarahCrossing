/* ---- 6x_islands.js ---- */
/* The islands on the server: the title screen's island list, backups, bringing in a save code or save file
   (from the one-file Sarah Crossing, or a backup), and what to do when two devices played the same island. */
const BACKUP_REASONS = {
    auto: 'Saved while playing',
    'before-import': 'Before a save file replaced it',
    'before-restore': 'Before a backup was put back',
    'before-overwrite': 'Before another device saved over it',
};

/* "just now", "5 minutes ago", "yesterday", "Oct 3" */
function agoText(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) { const m = Math.round(s / 60); return `${m} ${plural(m, 'minute')} ago`; }
    if (s < 86400) { const h = Math.round(s / 3600); return `${h} ${plural(h, 'hour')} ago`; }
    if (s < 2 * 86400) return 'yesterday';
    if (s < 7 * 86400) return `${Math.floor(s / 86400)} days ago`;
    const d = new Date(ms);
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`;
}
function whenText(ms) {
    return new Date(ms).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const IslandList = {
    /* "on this device" / "on iPhone" */
    deviceText(dev) {
        if (!dev) return '';
        if (Cloud.device && dev.id === Cloud.device.id) return ' on this device';
        if (!dev.name || dev.name === 'a browser') return ' on another device';
        return ` on ${aOrAn(dev.name)} ${dev.name}`;
    },
    /* Day 12 · 3,450 bells · 4 hours played */
    facts(sum) {
        if (!sum) return '';
        const out = [];
        if (sum.day) out.push(`Day ${fmtNum(sum.day)}`);
        if (sum.money != null) out.push(`${fmtNum(sum.money)} bells`);
        if (sum.playMinutes) out.push(sum.playMinutes < 60 ? `${sum.playMinutes} min played` : `${fmtNum(Math.round(sum.playMinutes / 60))} ${plural(Math.round(sum.playMinutes / 60), 'hour')} played`);
        return out.join(' · ');
    },
    name(isl) { return (isl && isl.summary && isl.summary.islandName) || 'An island with no name yet'; },

    /* a panel over the title screen hides the title card while it's open */
    panel(opts) {
        const fromTitle = G.mode === 'title';
        if (fromTitle) $('#title').hidden = true;
        const onClose = opts.onClose;
        // (a panel is also "closed" when the next one replaces it: the title only comes back once none is open)
        const back = () => setTimeout(() => { if (G.mode === 'title' && $('#panel').hidden) showTitle(); });
        return UI.open(Object.assign({}, opts, { onClose: () => { if (onClose) onClose(); if (fromTitle) back(); } }));
    },
    busyRow(P, text) { P.body.innerHTML = ''; P.body.appendChild(el('p', 'muted', text)); },

    /* ---------------------------------------------------------------- the title screen's note */
    syncNote() {
        let n = $('#tsync');
        if (!n) { n = el('p', 'tnote'); n.id = 'tsync'; $('#tnote').after(n); }
        let t = '';
        if (Cloud.broken) t = `Couldn't open ${this.name(Cloud.broken)}. It's safe on the server: open Islands to try a backup.`;
        else if (Cloud.problem === 'offline') t = S && S.started ? "Offline: playing this device's copy. It saves online once the connection is back." : "Can't reach the island server right now.";
        else if (S && S.started && Cloud.island) t = `Saved online · last played ${agoText(Cloud.island.updatedAt)}${this.deviceText(Cloud.island.device)}`;
        n.textContent = t;
        n.hidden = !t;
    },

    /* ---------------------------------------------------------------- the list */
    async open(fromPhone) {
        const back = fromPhone ? appSettings : null;
        const P = this.panel({ title: 'Your islands', phone: !!fromPhone, back, foot: true });
        this.busyRow(P, 'Looking for your islands...');
        P.foot.appendChild(btn('New island', 'alt', () => this.startNew()));
        P.foot.appendChild(btn('Import a save', 'alt', () => this.importPanel(fromPhone)));
        try { await Cloud.refreshList(); } catch (e) {
            if (e.status === 401) return Cloud.toLogin();
            this.busyRow(P, "Can't reach the island server right now. Try again in a moment.");
            return;
        }
        if (!P.panel.isConnected || $('#panel').hidden) return;
        P.body.innerHTML = '';
        if (!Cloud.list.length) { P.body.appendChild(el('p', 'muted', 'No islands yet. Start one, or import a save from the old Sarah Crossing.')); return; }
        P.body.appendChild(el('p', 'muted', 'Your islands are kept online, so they follow you to any device. Pick one to play, look at its backups, or save it as a file.'));
        const L = el('div', 'list');
        for (const isl of Cloud.list) {
            const r = el('button', 'row' + (isl.id === Cloud.id ? ' sel' : ''));
            r.type = 'button';
            r.dataset.island = isl.id;
            const t = el('div', 't');
            t.appendChild(el('b', null, this.name(isl) + (isl.id === Cloud.id && S && S.started ? ' (playing now)' : '')));
            const facts = this.facts(isl.summary);
            t.appendChild(el('span', null, `${facts ? facts + ' · ' : ''}played ${agoText(isl.updatedAt)}${this.deviceText(isl.device)}`));
            r.appendChild(t);
            r.addEventListener('click', () => { Sfx.ui('tick'); this.detail(isl, fromPhone); });
            L.appendChild(r);
        }
        P.body.appendChild(L);
    },

    detail(isl, fromPhone) {
        const playing = isl.id === Cloud.id && S && S.started;
        const P = this.panel({ title: this.name(isl), phone: !!fromPhone, back: () => this.open(fromPhone), foot: true });
        const facts = this.facts(isl.summary);
        if (facts) P.body.appendChild(el('p', null, facts));
        P.body.appendChild(el('p', 'muted', `Last played ${agoText(isl.updatedAt)}${this.deviceText(isl.device)} (${whenText(isl.updatedAt)}). Started ${whenText(isl.createdAt)}.`));
        if (isl.summary && isl.summary.cheat) P.body.appendChild(el('p', 'muted', 'Cheat mode is on for this island.'));
        const msg = el('p', 'muted', '');
        const row = el('div');
        row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
        if (!playing) row.appendChild(btn('Play this island', 'green', () => this.switchTo(isl.id)));
        row.appendChild(btn('Backups', 'alt', () => this.backups(isl, fromPhone)));
        row.appendChild(btn('Save a file', 'alt', async () => {
            msg.textContent = 'Getting the island...';
            try {
                const r = await Cloud.api('GET', '/api/islands/' + encodeURIComponent(isl.id));
                await this.download(r.state);
                msg.textContent = '';
            } catch (e) { msg.textContent = "Couldn't get the island from the server. Try again in a moment."; }
        }));
        P.body.appendChild(row);
        P.body.appendChild(msg);
        const danger = el('div');
        danger.style.cssText = 'margin-top:18px;padding-top:12px;border-top:2px dashed var(--line)';
        const del = () => {
            danger.innerHTML = '';
            danger.appendChild(el('p', 'muted', `Delete ${this.name(isl)}? It goes to the server's trash, where it's kept for 30 days in case you change your mind.`));
            danger.appendChild(btn('Yes, delete it', '', async () => {
                try {
                    await Cloud.api('DELETE', '/api/islands/' + encodeURIComponent(isl.id));
                    if (isl.id === Cloud.id) { Cloud.dropCopy(); Save.wipe(); this.leave(); return; }
                    UI.toast(`${this.name(isl)} was deleted.`);
                    this.open(fromPhone);
                } catch (e) { msg.textContent = "Couldn't delete it. Try again in a moment."; }
            }));
            danger.appendChild(btn('Keep it', 'alt', () => { danger.innerHTML = ''; danger.appendChild(btn('Delete this island', 'alt', del)); }));
        };
        danger.appendChild(btn('Delete this island', 'alt', del));
        P.body.appendChild(danger);
    },

    async backups(isl, fromPhone) {
        const P = this.panel({ title: 'Backups', phone: !!fromPhone, back: () => this.detail(isl, fromPhone) });
        this.busyRow(P, 'Looking for backups...');
        let list;
        try { list = (await Cloud.api('GET', `/api/islands/${encodeURIComponent(isl.id)}/backups`)).backups; } catch (e) {
            this.busyRow(P, "Can't reach the island server right now. Try again in a moment.");
            return;
        }
        if (!P.panel.isConnected || $('#panel').hidden) return;
        P.body.innerHTML = '';
        P.body.appendChild(el('p', 'muted', `Earlier copies of ${this.name(isl)}. While you play, a copy is kept every hour for two days, then one a day for two months.`));
        if (!list.length) { P.body.appendChild(el('p', 'muted', 'No backups yet. The first one is made an hour into playing.')); return; }
        const L = el('div', 'list');
        for (const b of list) {
            const r = el('button', 'row');
            r.type = 'button';
            r.dataset.backup = b.name;
            const t = el('div', 't');
            t.appendChild(el('b', null, whenText(b.savedAt || b.at)));
            const facts = this.facts(b.summary);
            t.appendChild(el('span', null, (BACKUP_REASONS[b.reason] || b.reason) + (facts ? ' · ' + facts : '')));
            r.appendChild(t);
            r.addEventListener('click', () => { Sfx.ui('tick'); this.backup(isl, b, fromPhone); });
            L.appendChild(r);
        }
        P.body.appendChild(L);
    },

    backup(isl, b, fromPhone) {
        const P = this.panel({ title: whenText(b.savedAt || b.at), phone: !!fromPhone, back: () => this.backups(isl, fromPhone) });
        P.body.appendChild(el('p', null, `${this.name({ summary: b.summary })}${this.facts(b.summary) ? ' · ' + this.facts(b.summary) : ''}`));
        P.body.appendChild(el('p', 'muted', `Putting it back replaces ${this.name(isl)} as it is now. (That's kept as a backup too, so nothing is lost.)`));
        const msg = el('p', 'muted', '');
        const row = el('div');
        row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
        row.appendChild(btn('Put this one back', 'green', async () => {
            msg.textContent = 'Putting it back...';
            try {
                // anything unsent from this device goes first, so it's in the backup of "as it is now"
                if (isl.id === Cloud.id) await Cloud.flush();
                await Cloud.api('POST', `/api/islands/${encodeURIComponent(isl.id)}/restore`, { name: b.name, device: Cloud.device });
                lsSet(CLOUD_CURRENT, isl.id);
                if (isl.id === Cloud.id) Cloud.dropCopy();
                this.leave();
            } catch (e) { msg.textContent = "Couldn't put it back. Try again in a moment."; }
        }));
        row.appendChild(btn('Save a file', 'alt', async () => {
            try { const r = await Cloud.api('GET', `/api/islands/${encodeURIComponent(isl.id)}/backups/${encodeURIComponent(b.name)}`); await this.download(r.state); }
            catch (e) { msg.textContent = "Couldn't get that backup. Try again in a moment."; }
        }));
        P.body.appendChild(row);
        P.body.appendChild(msg);
    },

    /* any island as a save file (the same kind the game's Save & quit makes) */
    async download(st) {
        const code = await Save.exportCode(st);
        const safe = (st.islandName || 'island').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'island';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
        a.download = `sarah-crossing-${safe}-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        UI.toast('Save file downloaded!');
    },

    /* ---------------------------------------------------------------- switching */
    /* reload the page into another island (or a new one): it starts clean, nothing of this island carries over */
    leave() {
        Cloud.leaving = true;
        clearTimeout(Cloud.timer);
        location.reload();
    },
    async switchTo(id) {
        if (S && S.started) await Cloud.flush();
        lsSet(CLOUD_CURRENT, id);
        this.leave();
    },
    async startNew() {
        if (S && S.started) await Cloud.flush();
        Save.wipe();
        this.leave();
    },

    /* ---------------------------------------------------------------- bringing a save in */
    importPanel(fromPhone) {
        const P = this.panel({ title: 'Import a save', phone: !!fromPhone, back: fromPhone ? appSettings : null, foot: true });
        P.body.appendChild(el('p', null, 'Bring an island in from a save file or a save code: from the old one-page Sarah Crossing, or a backup.'));
        P.body.appendChild(el('p', 'muted', 'In the old Sarah Crossing, open the phone and go to Save & quit, then "Just save a file". Or go to Settings and tap "Make save code" to copy a code.'));
        const msg = el('p', 'muted', '');
        const fileRow = el('div');
        fileRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 16px';
        fileRow.appendChild(btn('Choose a save file', 'green', () => this.chooseFile(msg)));
        P.body.appendChild(fileRow);
        const f = el('div', 'field');
        f.appendChild(el('span', null, 'Or paste a save code'));
        const ta = el('textarea');
        ta.id = 'loadcode';
        ta.placeholder = 'SC1:...';
        f.appendChild(ta);
        P.body.appendChild(f);
        P.body.appendChild(msg);
        P.foot.appendChild(btn('Import this code', 'green', () => this.importText(ta.value, msg)));
    },
    chooseFile(msg) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.txt,.json,text/plain,application/json';
        inp.addEventListener('change', async () => {
            const f = inp.files && inp.files[0];
            if (f) this.importText(await f.text(), msg || $('#ttag'));
        });
        inp.click();
    },
    async importText(text, msg) {
        const say = t => { if (msg) msg.textContent = t; };
        let st;
        try { st = await Save.importCode((text || '').trim()); } catch (e) {
            say("That didn't work. Check that it's a whole save code (it starts with SC) or a save file made by Sarah Crossing.");
            return;
        }
        st.started = true;
        say('Looking at your islands...');
        try { await Cloud.refreshList(); } catch (e) { say("Can't reach the island server right now. Try again in a moment."); return; }
        const same = Cloud.list.find(i => i.summary && i.summary.seed && i.summary.seed === st.seed);
        if (!same) return this.importAs(st, null, msg);
        // the same island is already here (it was imported before, or it's the one being played)
        const P = this.panel({ title: 'Import a save', foot: true });
        const facts = this.facts({ day: st.day && st.startDay ? st.day - st.startDay + 1 : null, money: st.money });
        P.body.appendChild(el('p', null, `This save is ${st.islandName || 'an island'}${facts ? ' (' + facts + ')' : ''}, and that island is already here: ${this.name(same)}, last played ${agoText(same.updatedAt)}${this.deviceText(same.device)}.`));
        P.body.appendChild(el('p', 'muted', 'Replace it with this save? The island that is here now is kept in its backups. Or keep both, as two islands.'));
        const m2 = el('p', 'muted', '');
        P.body.appendChild(m2);
        P.foot.appendChild(btn('Replace it', 'green', () => this.importAs(st, same, m2)));
        P.foot.appendChild(btn('Keep both', 'alt', () => this.importAs(st, null, m2)));
        P.foot.appendChild(btn('Cancel', 'alt', () => UI.close()));
    },
    async importAs(st, replace, msg) {
        const say = t => { if (msg) msg.textContent = t; };
        say('Bringing the island in...');
        try {
            let id;
            if (replace) {
                const r = await Cloud.api('PUT', '/api/islands/' + encodeURIComponent(replace.id), { state: st, baseRev: replace.rev, force: true, reason: 'import', device: Cloud.device });
                id = r.island.id;
                if (id === Cloud.id) Cloud.dropCopy();
            } else {
                if (S && S.started) await Cloud.flush();
                id = (await Cloud.api('POST', '/api/islands', { state: st, device: Cloud.device })).island.id;
            }
            lsSet(CLOUD_CURRENT, id);
            this.leave();
        } catch (e) {
            say(e.status === 401 ? 'Log in again first (reload the page).' : "Couldn't bring it in: " + (e.status ? e.message : "can't reach the island server") + '.');
        }
    },

    /* ---------------------------------------------------------------- two devices */
    /* mid-game: the island was saved somewhere else after this device opened it */
    conflict(other) {
        const show = () => {
            if (Cloud.problem !== 'conflict') return;
            if (G.mode !== 'title' && (UI.modal || UI.dialogOpen || G.busy || Watchdog.minigame())) { setTimeout(show, 1000); return; }
            const P = this.panel({ title: 'Played somewhere else', foot: true });
            P.head.querySelector('.x').remove();
            UI._onClose = null;
            const where = other ? `${agoText(other.updatedAt)}${this.deviceText(other.device)}` : 'on another device';
            P.body.appendChild(el('p', null, `${this.name(other || Cloud.island)} was saved ${where}${other && this.facts(other.summary) ? ' (' + this.facts(other.summary) + ')' : ''}, after this one opened it.`));
            P.body.appendChild(el('p', 'muted', 'Load that one to carry on from there. Or keep this one; the other is kept in the island’s backups.'));
            const msg = el('p', 'muted', '');
            P.body.appendChild(msg);
            P.foot.appendChild(btn('Load that one', 'green', () => { Cloud.dropCopy(); this.leave(); }));
            P.foot.appendChild(btn('Keep this one', 'alt', async () => {
                msg.textContent = 'Saving...';
                try { await Cloud.overwrite(); UI.close(true); UI.toast("Kept this one. The other is in the island's backups."); }
                catch (e) { Cloud.problem = 'conflict'; msg.textContent = "Couldn't reach the island server. Try again in a moment."; }
            }));
        };
        show();
    },
    /* at boot: this device has progress the server never got, and the island was also saved somewhere else */
    fork() {
        const { copy, server } = Cloud.fork;
        const P = this.panel({ title: 'Two versions of your island', foot: true });
        P.head.querySelector('.x').remove();
        UI._onClose = null;
        const sum = { day: copy.state.day && copy.state.startDay ? copy.state.day - copy.state.startDay + 1 : null, money: copy.state.money };
        P.body.appendChild(el('p', null, `This device has progress on ${this.name(server.island)} from ${agoText(copy.at)} that never reached the server (${this.facts(sum)}).`));
        P.body.appendChild(el('p', null, `The island was also saved ${agoText(server.island.updatedAt)}${this.deviceText(server.island.device)} (${this.facts(server.island.summary)}).`));
        P.body.appendChild(el('p', 'muted', 'Which one do you want to play? "Keep both" makes this device’s version a separate island.'));
        const msg = el('p', 'muted', '');
        P.body.appendChild(msg);
        const done = () => { Cloud.fork = null; UI.close(true); showTitle(); };
        P.foot.appendChild(btn('The online one', 'green', () => { Cloud.dropCopy(); done(); }));
        P.foot.appendChild(btn("This device's", 'alt', async () => {
            msg.textContent = 'Saving...';
            try {
                await Cloud.api('PUT', '/api/islands/' + encodeURIComponent(Cloud.id), { state: copy.state, baseRev: server.rev, force: true, device: Cloud.device });
                Cloud.dropCopy(); this.leave();
            } catch (e) { msg.textContent = "Couldn't reach the island server. Try again in a moment."; }
        }));
        P.foot.appendChild(btn('Keep both', 'alt', async () => {
            msg.textContent = 'Saving...';
            try {
                await Cloud.api('POST', '/api/islands', { state: copy.state, device: Cloud.device });
                Cloud.dropCopy(); done();
            } catch (e) { msg.textContent = "Couldn't reach the island server. Try again in a moment."; }
        }));
    },
};
