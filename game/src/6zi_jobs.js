/* ---- 6zi_jobs.js ---- */
/* Island jobs at the Town Hall (with the civic buildings: CIVIC_PREVIEW): three small jobs a day for sand
   dollars, one at a time: take packages round to the neighbors (they're in the talk menu: "A package for you!"), sweep
   the leaves off the square (piles to pick up), repaint the sign at the dock, or bring the Council some shells, fruit
   or fish (handed in at the counter, better paid than selling them). Pay comes as soon as a job's done. The jobs are
   the island's, but anyone playing can do them. */
const JOB_KINDS = {
    deliver: { title: n => `Deliver ${n} packages`, who: 'For the Post Office', pay: n => 250 * n, mins: n => n * 2 },
    sweep: { title: () => 'Sweep the square', who: 'Leaves everywhere. The Council is distressed.', pay: () => 400, mins: () => 4 },
    sign: { title: () => 'Repaint the dock sign', who: 'Ginger left the paint out, so that\'s a sign', pay: () => 600, mins: () => 3 },
    collect: { title: (n, w) => `Bring the Council ${n} ${w}`, who: 'For the Town Hall\'s display case', pay: (n, w, v) => Math.round(v * 1.25), mins: () => 5 },
};
ITEMS.job_parcel = { name: 'Package (to deliver)', type: 'quest', price: 0, icon: 'ic_package' };
ITEMS.job_leaves = { name: 'Pile of leaves', type: 'event', price: 0, icon: 'ic_leafpile' };
/* a little heap of autumn leaves (no picture in the atlas: made here) */
(() => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16;
    const g = c.getContext('2d'), r = mulberry(7);
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#d8843a', '#c8502e', '#e8b040', '#9a5a2a'][i % 4]; const x = 3 + Math.floor(r() * 10), y = 9 + Math.floor(r() * 5) - (Math.abs(x - 8) < 3 ? 2 : 0); g.fillRect(x, y, 2, 1); }
    Assets.dyn.ic_leafpile = { c, w: 16, h: 16, ax: 8, ay: 15 };
})();
function jobsState() {
    const T = town(), day = Clock.dayNum();
    if (!T.jobs || T.jobs.day !== day) T.jobs = { day, offered: jobsFor(day), active: null, done: [] };
    return T.jobs;
}
/* today's three jobs (the same all day) */
function jobsFor(day) {
    const r = mulberry(hash32((S.seed || '') + ':jobs:' + day)), met = postPeople();
    const out = [];
    if (met.length >= 2) { const n = Math.min(met.length, 2 + Math.floor(r() * 2)); out.push({ id: 'deliver', kind: 'deliver', n, to: shuffled(met, r).slice(0, n) }); }
    out.push(r() < 0.5 ? { id: 'sweep', kind: 'sweep', n: 8 } : { id: 'sign', kind: 'sign', n: 3 });
    const want = rpick([['shells', 5], ['fruit', 4], ['fish', 3]], r);
    out.push({ id: 'collect', kind: 'collect', n: want[1], what: want[0] });
    return out;
}
const JOB_WANTS = { shells: s => ITEMS[s] && ITEMS[s].type === 'shell', fruit: s => ITEMS[s] && ITEMS[s].type === 'fruit', fish: s => ITEMS[s] && ITEMS[s].type === 'fish' && s !== 'boot' };
function jobLabel(j) { const K = JOB_KINDS[j.kind]; return K.title(j.n, j.what); }
function jobPay(j) {
    if (j.kind !== 'collect') return JOB_KINDS[j.kind].pay(j.n);
    // what the things would sell for, and a quarter more (a guess from what's in the pocket, or a fair price)
    const ids = S.pocket.filter(s => s && JOB_WANTS[j.what](s.id)).map(s => s.id);
    const each = ids.length ? ids.reduce((a, id) => a + sellPrice(id), 0) / ids.length : { shells: 120, fruit: 100, fish: 300 }[j.what];
    return Math.round(JOB_KINDS.collect.pay(j.n, j.what, each * j.n));
}
const Jobs = {
    active() { if (!S || !S.town || !CIVIC_PREVIEW) return null; const J = jobsState(); return J.active; },
    take(j) {
        const J = jobsState();
        J.active = Object.assign({}, j, { got: 0, pay: jobPay(j), piles: null, left: j.kind === 'deliver' ? j.to.slice() : null });
        if (j.kind === 'deliver') receive('job_parcel', j.n, true);
        if (j.kind === 'sweep') J.active.piles = this.pileSpots(j.n);
        Save.touch();
    },
    giveUp() {
        const J = jobsState(), a = J.active;
        if (!a) return;
        if (a.kind === 'deliver') removeItem('job_parcel', pocketCount('job_parcel'));
        this.clearPiles();
        J.active = null;
        Save.touch();
    },
    finish() {
        const J = jobsState(), a = J.active;
        if (!a) return;
        J.done.push(a.id); J.active = null;
        addMoney(a.pay, true, 'Island jobs');
        S.stats.jobs = (S.stats.jobs || 0) + 1;
        Sfx.play('fanfare');
        UI.toast(`Job done: ${jobLabel(a)}! +${fmtNum(a.pay)} sand dollars`, 'ui_coin');
        if (S.stats.jobs === 1) townLog(`${S.playerName || 'Sarah'} does her first island job.`);
        Save.touch();
    },
    /* deliveries: the neighbor's in the talk menu */
    options(n) {
        const a = this.active();
        if (!a || a.kind !== 'deliver' || !a.left.includes(n.id) || !pocketCount('job_parcel')) return [];
        return [{ label: 'A package for you!', fn: async () => {
            removeItem('job_parcel', 1);
            a.left.splice(a.left.indexOf(n.id), 1); a.got++;
            addPts(n.id, 1, 'job');
            Sfx.play('item');
            await UI.say(n.id, voiced(n.id, rpick(['A package! For me? I love packages. I love what is in them. I love the box.', "Oh! Thank you! I've been waiting for this. I forget what it is. I'm excited.", 'Special delivery? You work at the Post Office now? You do everything!'])), { keep: true });
            if (!a.left.length) this.finish();
            return true;
        } }];
    },
    /* sweeping: piles of leaves near the square, picked up one by one */
    pileSpots(n) {
        const a = G.areas.island, sp = W0.spots.plaza, out = [], r = mulberry(hash32((S.seed || '') + ':piles:' + Clock.dayNum()));
        for (let tries = 0; tries < 200 && out.length < n; tries++) {
            const tx = sp.x + Math.round((r() * 2 - 1) * 9), ty = sp.y + Math.round((r() * 2 - 1) * 6);
            if (a.blockedAt(tx, ty) || out.some(([x, y]) => Math.abs(x - tx) + Math.abs(y - ty) < 2)) continue;
            out.push([tx, ty]);
        }
        return out;
    },
    clearPiles() { const a = G.areas && G.areas.island; if (a) for (const e of a.ents.filter(e => e.jobPile)) a.remove(e); },
    /* every couple of seconds: the piles are on the island (after a rebuild too) */
    tick() {
        const a = this.active(), isl = G.areas && G.areas.island;
        if (!isl) return;
        // (yesterday's undelivered packages go back to the Post Office)
        if (!a && pocketCount('job_parcel')) removeItem('job_parcel', pocketCount('job_parcel'));
        const want = a && a.kind === 'sweep' ? a.piles : [];
        const have = isl.ents.filter(e => e.jobPile);
        if (!want.length) { if (have.length) this.clearPiles(); return; }
        for (const [tx, ty] of want) {
            if (have.some(e => e.jobPile[0] === tx && e.jobPile[1] === ty)) continue;
            const [fx, fy] = tileFoot(tx, ty), e = makeItemEnt('job_leaves', fx, fy - 1);
            e.jobPile = [tx, ty];
            e.interact = () => this.sweep(e);
            isl.add(e);
        }
    },
    sweep(e) {
        const a = this.active();
        if (!a || a.kind !== 'sweep') return;
        G.areas.island.remove(e);
        a.piles = a.piles.filter(([x, y]) => x !== e.jobPile[0] || y !== e.jobPile[1]);
        a.got++;
        Sfx.play('rustle');
        G.player.pose = 'pick'; G.player.poseT = 16;
        if (!a.piles.length) this.finish(); else UI.toast(`${a.got} of ${a.n} piles swept`, 'ic_leafpile');
        Save.touch();
    },
    /* the dock sign: three coats of paint */
    async paint() {
        const a = this.active();
        if (!a || a.kind !== 'sign') return false;
        G.busy++;
        try {
            for (let i = 0; i < 3; i++) { G.player.pose = i % 2 ? 'left' : 'right'; G.player.poseT = 20; Sfx.play('place'); await waitFrames(24); }
            a.got = a.n;
            await UI.say(null, 'Sarah gives the sign three neat coats of paint. It says the same thing, but shinier.');
            UI.hideDialog();
        } finally { G.busy--; }
        this.finish();
        return true;
    },
};

/* everything from the civic buildings that shows up in a neighbor's talk menu (50_talk.js) */
function civicOptions(n) { return CIVIC_PREVIEW ? Jobs.options(n).concat(postLostOptions(n)) : []; }

CIVIC_LIVE.jobs = {
    draw(b, f, redraw) {
        const J = jobsState(), a = J.active;
        if (a) {
            CV.big(b, 'Your job', jobLabel(a), `Pays ${fmtNum(a.pay)} sand dollars`);
            if (a.kind === 'deliver') CV.note(b, `Still to go: ${a.left.map(id => NPC_DEFS[id].name).join(', ')}. Talk to them and hand it over.`);
            if (a.kind === 'sweep') CV.note(b, `${a.got} of ${a.n} piles of leaves swept. They're around the square.`);
            if (a.kind === 'sign') CV.note(b, 'The sign is down by the dock. Walk up to it and get painting.');
            if (a.kind === 'collect') {
                const have = S.pocket.filter(s => s && JOB_WANTS[a.what](s.id)).reduce((n, s) => n + s.n, 0);
                CV.note(b, `You have ${have} of ${a.n} ${a.what} with you.`);
                const hand = btn('Hand them in', 'green', () => {
                    let left = a.n;
                    for (let i = 0; i < S.pocket.length && left; i++) { const s = S.pocket[i]; if (s && JOB_WANTS[a.what](s.id)) left -= removeSlot(i, Math.min(left, s.n)); }
                    this.done = true;
                    Jobs.finish(); redraw();
                });
                hand.disabled = have < a.n;
                f.appendChild(hand);
            }
            f.appendChild(btn('Give up', 'alt', () => { Jobs.giveUp(); redraw(); }));
            return;
        }
        const open = J.offered.filter(j => !J.done.includes(j.id));
        if (!open.length) { CV.empty(b, 'No more jobs today. Come back tomorrow!'); return; }
        CV.note(b, 'One job at a time. Tap one to take it.');
        const l = CV.list(b);
        for (const j of J.offered) {
            const done = J.done.includes(j.id), K = JOB_KINDS[j.kind];
            CV.row(l, j.kind === 'deliver' ? 'ic_package' : j.kind === 'sweep' ? 'ic_leafpile' : j.kind === 'sign' ? 'sign_island' : 'ui_present', jobLabel(j),
                `${K.who} · pays ${fmtNum(jobPay(j))} sand dollars · about ${K.mins(j.n)} minutes`, done ? el('span', 'cv-pill ok', 'Done') : null,
                done ? null : () => { Jobs.take(j); Sfx.ui('ok'); redraw(); UI.toast(`New job: ${jobLabel(j)}`, 'app_tasks'); });
        }
    },
};
