/* ---- 12_cloud.js ---- */
/* Online saves: the islands live on the server (server/islands.mjs), so they follow Sarah from device to device.
   This device keeps a copy of the island it's playing, marked "pending" until the server has it, so nothing is
   lost when the connection drops or the page closes mid-save; the next visit sends it. Every save names the
   server copy it was based on (rev). If another device saved in between, the server refuses, and Sarah picks
   which island to keep (the other one stays in the island's backups). */
const CLOUD_CURRENT = 'sc-current';          // which island this device plays: an island id, or '' for a new one
const CLOUD_DEVICE = 'sc-device';            // a random id for this browser
const CLOUD_COPY = 'sc-island-';             // + island id (or 'new'): { id, rev, pending, at, state }
const CLOUD_PUSH_EVERY = 20e3;               // ordinary saves reach the server at most this often (ms)

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }

const Cloud = {
    id: null,            // the island on the server (null: a new island the server doesn't have yet)
    rev: 0,              // the server's rev that S is based on
    list: [],            // every island on the server (summaries), from the last look
    island: null,        // the summary of the island being played
    online: true,
    problem: null,       // null | 'offline' | 'login' | 'conflict' | 'big'
    fork: null,          // at boot: this device's unsent progress AND a newer save from elsewhere: { copy, server }
    seq: 0, sentSeq: 0, busy: false, again: false, lastPush: 0, timer: 0, retryMs: 0, told: {},
    device: null, reports: 0, leaving: false, broken: null,

    /* ---------------------------------------------------------------- talking to the server */
    async api(method, url, body, opts) {
        opts = opts || {};
        const init = { method, headers: { 'X-Sarah': '1' }, credentials: 'same-origin', cache: 'no-store', keepalive: !!opts.keepalive };
        if (body !== undefined) {
            let data = typeof body === 'string' ? body : JSON.stringify(body);
            init.headers['Content-Type'] = 'application/json';
            if (data.length > 2048 && window.CompressionStream) {
                try {
                    data = await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
                    init.headers['Content-Encoding'] = 'gzip';
                } catch (e) { /* send it as it is */ }
            }
            init.body = data;
        }
        let res;
        try { res = await fetch(url, init); } catch (e) { const err = new Error('offline'); err.offline = true; throw err; }
        let json = null;
        try { json = await res.json(); } catch (e) { /* not JSON */ }
        if (!res.ok) { const err = new Error((json && json.error) || 'HTTP ' + res.status); err.status = res.status; err.data = json; throw err; }
        return json;
    },
    toLogin() {
        location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search);
        return new Promise(() => {});   // the page is going away
    },
    async refreshList() {
        const r = await this.api('GET', '/api/islands');
        this.list = r.islands || [];
        this.island = this.list.find(i => i.id === this.id) || this.island;
        this.online = true;
        return this.list;
    },

    /* ---------------------------------------------------------------- this device's copy */
    copyKey(id) { return CLOUD_COPY + (id || 'new'); },
    readCopy(id) {
        try { const c = JSON.parse(lsGet(this.copyKey(id)) || 'null'); return c && c.state && typeof c.state === 'object' ? c : null; } catch (e) { return null; }
    },
    writeCopy(pending, json) {
        const text = `{"id":${JSON.stringify(this.id)},"rev":${this.rev},"pending":${!!pending},"at":${Date.now()},"state":${json || JSON.stringify(S)}}`;
        if (lsSet(this.copyKey(this.id), text)) return true;
        // storage is full: let go of other islands' copies the server already has, and try once more
        try {
            for (const k of Object.keys(localStorage)) {
                if (!k.startsWith(CLOUD_COPY) || k === this.copyKey(this.id)) continue;
                const c = JSON.parse(localStorage.getItem(k) || 'null');
                if (!c || !c.pending) localStorage.removeItem(k);
            }
        } catch (e) { /* storage blocked */ }
        return lsSet(this.copyKey(this.id), text);
    },

    /* ---------------------------------------------------------------- boot */
    /* which island to play: { state } (a raw save, not migrated yet), or null for a new island */
    async boot() {
        let dev = lsGet(CLOUD_DEVICE);
        if (!dev) { dev = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); lsSet(CLOUD_DEVICE, dev); }
        this.device = { id: dev };
        addEventListener('online', () => { this.retryMs = 0; this.push(false); });
        let current = lsGet(CLOUD_CURRENT);
        let reached = true;
        try { await this.refreshList(); } catch (e) {
            if (e.status === 401) return this.toLogin();
            reached = false; this.offline();
        }
        if (reached) {
            // nothing chosen on this device yet, or the island was deleted somewhere else: the most recently played one
            if (current == null || (current && !this.list.some(i => i.id === current))) current = this.list.length ? this.list[0].id : '';
            lsSet(CLOUD_CURRENT, current);
        }
        if (!current) {
            // a new island that was started while the server couldn't be reached
            const c = this.readCopy(null);
            if (c && c.pending && c.state.started) { this.id = null; this.rev = 0; this.seq = 1; return { state: c.state }; }
            return null;
        }
        this.id = current;
        this.island = this.list.find(i => i.id === current) || null;
        const copy = this.readCopy(current);
        let server = null;
        if (reached) {
            try { server = await this.api('GET', '/api/islands/' + encodeURIComponent(current)); } catch (e) {
                if (e.status === 401) return this.toLogin();
                this.offline();
            }
        }
        if (!server) {
            if (copy) { this.rev = copy.rev; this.seq = copy.pending ? 1 : 0; return { state: copy.state }; }
            this.id = null;
            return null;
        }
        this.island = server.island;
        this.rev = server.rev;
        if (copy && copy.pending) {
            // progress from this device that never reached the server (offline, or the page closed mid-save). It's the
            // newest when nobody saved since, or when the newer save was this device's own (sent as the page closed,
            // with the answer lost): this device's island only ever moves forward.
            const mine = server.island && server.island.device && server.island.device.id === this.device.id;
            if (copy.rev === server.rev || mine) { this.seq = 1; return { state: copy.state }; }
            // somebody else saved too: unless it's the very same island, Sarah picks (see IslandList.fork)
            if (JSON.stringify(copy.state) !== JSON.stringify(server.state)) this.fork = { copy, server };
        }
        this.writeCopy(false, JSON.stringify(server.state));
        return { state: server.state };
    },

    /* boot has set S: progress this device kept but never sent (offline, or the page closed mid-save) goes now */
    ready() { if (this.seq !== this.sentSeq) this.push(false); },

    /* ---------------------------------------------------------------- saving */
    /* Save.write calls this: a copy on this device right away, and to the server now (urgent) or soon */
    saved(urgent) {
        if (this.leaving) return;       // the page is reloading into another island
        this.seq++;
        const kept = this.writeCopy(true);
        Save.ok = kept || this.online;
        if (urgent) this.push(true); else this.schedule();
    },
    schedule() {
        if (this.timer || this.seq === this.sentSeq) return;
        const wait = Math.max(CLOUD_PUSH_EVERY - (Date.now() - this.lastPush), this.retryMs, 0);
        this.timer = setTimeout(() => { this.timer = 0; this.push(false); }, wait);
    },
    async push(urgent) {
        if (this.leaving || this.problem === 'conflict' || this.problem === 'login' || this.problem === 'big' || this.fork || !S || !S.started) return;
        if (this.seq === this.sentSeq) return;
        if (this.busy) { this.again = true; return; }
        clearTimeout(this.timer); this.timer = 0;
        this.busy = true;
        const seq = this.seq, json = JSON.stringify(S), wasNew = !this.id;
        const body = `{"baseRev":${this.rev},"device":${JSON.stringify(this.device)},"state":${json}}`;
        try {
            const r = wasNew ? await this.api('POST', '/api/islands', body, { keepalive: urgent })
                : await this.api('PUT', '/api/islands/' + encodeURIComponent(this.id), body, { keepalive: urgent });
            this.id = r.island.id; this.rev = r.rev; this.island = r.island;
            this.sentSeq = seq; this.lastPush = Date.now(); this.retryMs = 0;
            if (wasNew) { lsDel(this.copyKey(null)); lsSet(CLOUD_CURRENT, this.id); if (Photos.list().length) Photos.send(); }
            // newer changes since this one was sent stay pending (the copy is redone from S, with the new rev)
            this.writeCopy(seq !== this.seq, seq === this.seq ? json : null);
            if (this.problem) { const was = this.problem; this.problem = null; if (was === 'offline' && G.mode === 'play') UI.toast('Back online. The island is saved.'); }
            this.online = true; Save.ok = true;
        } catch (e) {
            if (e.status === 409) this.conflict(e.data && e.data.island);
            else if (e.status === 401) { this.problem = 'login'; this.tell('login', 'Log in again to keep saving online. (Your island is kept on this device until then.)'); }
            else if (e.status === 404 && !wasNew) {
                // deleted on another device: keep Sarah's island anyway, as a new one
                this.id = null; this.rev = 0;
                this.tell('gone', 'This island was deleted on another device, so it was saved again as a new island.');
                this.again = true;
            } else if (e.status === 413) { this.problem = 'big'; this.tell('big', 'The island is too big to save online. Save a file from the phone (Save & quit) to keep it safe.'); }
            else { this.offline(); this.retryMs = clamp((this.retryMs || 2500) * 2, 5000, 60e3); }
        } finally {
            this.busy = false;
            if (this.again) { this.again = false; this.push(false); }
            else this.schedule();
        }
    },
    /* send everything now and wait (before leaving this island) */
    async flush() {
        if (G.mode !== 'title') Save.write(true);
        for (let i = 0; i < 100 && (this.busy || (this.seq !== this.sentSeq && !this.problem && !this.fork)); i++) {
            if (!this.busy) await this.push(true); else await new Promise(r => setTimeout(r, 100));
            if (this.problem === 'offline') break;
        }
        return this.seq === this.sentSeq;
    },
    offline() {
        this.online = false;
        if (!this.problem) this.problem = 'offline';
        if (G.mode === 'play') this.tell('offline', "Can't reach the island server. Saving on this device until it's back.");
    },
    /* one toast per kind of problem per visit */
    tell(kind, text) {
        if (this.told[kind] || G.mode !== 'play') return;
        this.told[kind] = true;
        UI.toast(text);
    },

    /* ---------------------------------------------------------------- two devices */
    /* the island was saved somewhere else after this device loaded it */
    conflict(other) {
        this.problem = 'conflict';
        clearTimeout(this.timer); this.timer = 0;
        IslandList.conflict(other);
    },
    /* back to this tab after a while: if the island moved on elsewhere, say so before Sarah plays on an old copy */
    async check() {
        if (!this.id || this.problem === 'conflict' || this.fork || G.mode === 'title') return;
        try { await this.refreshList(); } catch (e) { return; }
        const now = this.list.find(i => i.id === this.id);
        if (now && now.rev > this.rev && this.seq === this.sentSeq && !this.busy) this.conflict(now);
    },
    /* keep this device's island, writing over the newer one (which the server keeps as a backup) */
    async overwrite() {
        this.problem = null;
        this.seq++;
        const json = JSON.stringify(S);
        const r = await this.api('PUT', '/api/islands/' + encodeURIComponent(this.id), `{"baseRev":${this.rev},"force":true,"device":${JSON.stringify(this.device)},"state":${json}}`);
        this.rev = r.rev; this.island = r.island; this.sentSeq = this.seq; this.lastPush = Date.now();
        this.writeCopy(false, json);
    },
    /* forget this device's copy of the island, so the next load takes the server's */
    dropCopy() { lsDel(this.copyKey(this.id)); this.seq = this.sentSeq; },

    /* ---------------------------------------------------------------- the album */
    async loadPhotos() {
        if (!this.id) return;
        try { const r = await this.api('GET', `/api/islands/${encodeURIComponent(this.id)}/photos`); Photos.got(r.photos || []); } catch (e) { /* the copy on this device will do */ }
    },

    /* ---------------------------------------------------------------- problems, for the server log */
    report(message, stack) {
        if (this.reports >= 12) return;
        this.reports++;
        this.api('POST', '/api/log', { message: String(message).slice(0, 600), stack: String(stack || '').slice(0, 3000), island: this.id || '' }).catch(() => {});
    },
};

addEventListener('error', e => Cloud.report(e.message, e.error && e.error.stack));
addEventListener('unhandledrejection', e => { const r = e.reason || {}; Cloud.report('unhandled: ' + (r.message || r), r.stack); });
/* what the game catches and writes down goes to the server log too */
(() => {
    const ce = console.error.bind(console);
    console.error = (...a) => { ce(...a); try { Cloud.report(a.map(x => (x && x.message) || String(x)).join(' '), (a.find(x => x && x.stack) || {}).stack); } catch (e) { /* never mind */ } };
})();
document.addEventListener('visibilitychange', () => { if (!document.hidden) Cloud.check(); });
