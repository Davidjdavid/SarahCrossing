/* ---- 6zh_world.js ---- */
/* The real world, by zip code (with the civic buildings: CIVIC_PREVIEW), and the market. Sarah registers a zip
   code at the Town Hall: the island can keep that town's time (her choice), the day's weather is that town's forecast
   for the day (looked up once a day, not live), and the morning paper gets the town's and the world's headlines. The
   server looks everything up (server/world.mjs: /api/world, /api/market), so the game never talks to anyone else.
   The Bank's market has a few real companies at their real closing prices, in sand dollars (ten to the dollar), with
   a portfolio, gains since buying, and dividends on the first of the month for those that pay them. */
const STOCK_K = 10;                         // sand dollars to the dollar
function zipState() { return S && S.zip && S.zip.code ? S.zip : null; }
/* look the zip code up (today's, once a day): the forecast becomes the weather, the headlines go in today's paper */
async function worldFetch(force) {
    const Z = zipState();
    if (!Z && CIVIC_PREVIEW && S && !Online.visitor()) newsFetch();
    if (!Z || !CIVIC_PREVIEW || Online.visitor()) return null;
    const day = Clock.dayNum();
    if (!force && Z.last === day) return null;
    let w;
    try { w = await Cloud.api('GET', '/api/world?zip=' + encodeURIComponent(Z.code)); } catch (e) { Z.err = e.offline ? 'offline' : e.status === 404 || e.status === 400 ? 'bad' : 'down'; return null; }
    Z.err = null; Z.last = day; Z.place = w.place; Z.st = w.state; Z.offset = w.offset; Z.tz = w.tz;
    const t = w.days && w.days[0];
    Z.days = Z.days || {};
    if (t) Z.days[day] = { sky: t.sky, hi: t.hi, lo: t.lo };
    for (const k of Object.keys(Z.days)) if (+k < day - 7) delete Z.days[k];
    Z.news = { day, local: (w.news && w.news.local) || [], world: (w.news && w.news.world) || [] };
    if (Z.useTime) zipUseTime(true);
    // the weather changes to the forecast now, if it's a different kind of day
    const sky = todayWeather();
    if (sky !== G.weather) { G.weather = sky; HUD.update(); }
    // and the paper (made this morning) gets the real world's page
    const p = S.post && S.post.papers && S.post.papers.find(q => q.day === day);
    if (p) p.world = zipPage();
    Save.touch();
    return w;
}
/* the world's headlines for the paper on an island with no zip code (once they've come in today; worldFetch brings
   them with the town's news otherwise) */
async function newsFetch() {
    const day = Clock.dayNum();
    if (S.news && S.news.day === day && S.news.world.length) return;
    if (newsFetch.busy) return;
    newsFetch.busy = true;
    let w = null;
    try { w = await Cloud.api('GET', '/api/news'); } catch (e) { /* offline: the next try */ }
    newsFetch.busy = false;
    if (!w || !S) return;
    S.news = { day, world: (w.world || []).slice(0, 5) };
    const p = S.post && S.post.papers && S.post.papers.find(q => q.day === day);
    if (p && !(p.world && p.world.world && p.world.world.length)) p.world = Object.assign({}, p.world || {}, { world: S.news.world });
    Save.touch();
}
/* the real world's page for the paper */
function zipPage() {
    const Z = zipState(), day = Clock.dayNum();
    if (!Z || !Z.place) return S && S.news && S.news.day === day && S.news.world.length ? { world: S.news.world } : null;
    const f = Z.days && Z.days[day];
    return { town: `${Z.place}, ${Z.st}`, sky: f ? f.sky : null, hi: f ? f.hi : null, lo: f ? f.lo : null, local: Z.news && Z.news.day === day ? Z.news.local : [], world: Z.news && Z.news.day === day ? Z.news.world : [] };
}
/* the island keeps that town's time: the clock's shift is the town's offset from this device's */
function zipUseTime(on) {
    const Z = zipState();
    if (!Z) return;
    Z.useTime = !!on;
    if (on && Z.offset != null) { S.settings = S.settings || {}; S.settings.clockShift = Z.offset + new Date().getTimezoneOffset(); }
    Save.touch();
}
function zipTimeThere() {
    const Z = zipState();
    if (!Z || Z.offset == null) return '';
    const d = new Date(Date.now() + (Z.offset + new Date().getTimezoneOffset()) * 60e3);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

CIVIC_LIVE.zip = {
    draw(b, f, redraw) {
        const Z = zipState();
        CV.note(b, "The island uses it for your time zone (if you like), the day's weather and local news. It's only kept in your island's save.");
        if (Z && Z.place) {
            const fc = Z.days && Z.days[Clock.dayNum()];
            CV.big(b, `Now in ${Z.place}, ${Z.st}`, zipTimeThere(), fc ? `${cap(fc.sky)} · high ${fc.hi}°, low ${fc.lo}°` : 'Looking up the weather...');
            CV.note(b, Z.useTime ? `The island keeps ${Z.place} time.` : `The island keeps its own clock (Settings), not ${Z.place} time.`);
        }
        if (Z && Z.err === 'offline') CV.banner(b, 'warn', "No internet connection. Your zip code is saved and the island will look it up when it's back online.");
        if (Z && Z.err === 'down') CV.banner(b, 'warn', "The zip code service isn't available. Your number is saved; we'll try again later.");
        if (townVisitorNote(b)) return;
        const inp = CV.field(b, Z ? 'A different zip code' : 'Your zip code (5 digits)', '', '5 digits', { inputmode: 'numeric', max: 5 });
        const say = bankMsg(b);
        f.appendChild(btn(Z ? 'Change' : 'Register', 'green', async () => {
            const code = inp.value.trim();
            if (!/^\d{5}$/.test(code)) return say('err', "A zip code is five numbers. Check them and try again.");
            say('info', 'Looking it up...');
            let w;
            try { w = await Cloud.api('GET', '/api/world?zip=' + code); } catch (e) {
                if (e.status === 404 || e.status === 400) return say('err', "We couldn't find that zip code. Check the numbers and try again.");
                S.zip = { code, err: e.offline ? 'offline' : 'down' }; Save.touch();
                return say('warn', e.offline ? 'No internet connection. Your zip code is saved and the island will look it up when it\'s back online.' : "The service isn't answering. Your zip code is saved; we'll try again later.");
            }
            S.zip = { code, place: w.place, st: w.state, offset: w.offset, tz: w.tz, useTime: false };
            townLog(`${S.playerName || 'Sarah'} registers the island's address: ${w.place}, ${w.state}.`);
            await worldFetch(true);
            Sfx.play('fanfare');
            redraw();
            const k = await UI.ask('floret', `Registered! ${w.place}, ${w.state}. It's ${zipTimeThere()} there. Shall the island keep ${w.place} time? (You can change the clock in Settings any time.)`, [`Yes, ${w.place} time`, "Keep the island's clock"]);
            UI.hideDialog();
            zipUseTime(k === 0);
            civicScreen('zip', null, () => civicMenu('townhall'));
        }));
        if (Z) f.appendChild(btn('Forget it', 'alt', () => { S.zip = null; Save.touch(); G.weather = todayWeather(); redraw(); }));
    },
};

/* ---------------------------------------------------------------- the market */
const Market = {
    data: null, at: 0, err: null, tried: 0,
    async load() {
        if (this.data && Date.now() - this.at < 30 * 60e3) return this.data;
        // (after a failed try, the next one waits a minute: the screen asks again every time it's drawn)
        if (this.err && Date.now() - this.tried < 60e3) return this.data;
        if (this.busy) return this.busy;
        this.tried = Date.now();
        this.busy = (async () => {
            try { const d = await Cloud.api('GET', '/api/market'); if (!d || !Array.isArray(d.stocks) || !d.stocks.length) throw new Error('no prices'); this.data = d; this.at = Date.now(); this.err = null; }
            catch (e) { this.err = e.offline ? 'offline' : 'down'; }
            this.busy = null;
            return this.data;
        })();
        return this.busy;
    },
    stock(sym) { return this.data && this.data.stocks.find(s => s.sym === sym); },
    price(s) { return Math.round(s.closes[s.closes.length - 1] * STOCK_K); },
    closed() { const wd = Clock.weekday(); return wd === 0 || wd === 6; },
};
function portfolio() { const B = bank(); if (!B.stocks) B.stocks = {}; return B.stocks; }
CIVIC_LIVE.stocks = {
    draw(b, f, redraw) {
        const M = Market;
        if (!M.data) {
            CV.loading(b, 'Getting the latest prices...');
            if (!M.err || Date.now() - M.tried >= 60e3) M.load().then(() => { if ((M.data || M.err) && $('#panel') && !$('#panel').hidden) redraw(); });
            if (M.err) { b.innerHTML = ''; CV.banner(b, 'warn', M.err === 'offline' ? 'No internet connection, and no prices yet. Try again when you\'re back online.' : "The market data service isn't answering. Try again in a little while."); }
            return;
        }
        const P = portfolio(), last = M.data.stocks[0].dates.slice(-1)[0], closed = M.closed(), paused = closed || !!M.err || M.data.old;
        if (closed) CV.banner(b, 'info', `Market closed for the weekend · Prices from ${last} · Opens Monday`);
        else if (M.data.old || M.err) CV.banner(b, 'warn', `The market data service isn't answering. Showing the last prices we have (${last}). Trading is paused.`);
        const pick = M.stock(this.pick) || M.data.stocks[0];
        const s = pick.closes.map(v => v * STOCK_K), price = Math.round(s[s.length - 1]), chg = (s[s.length - 1] / s[s.length - 2] - 1) * 100;
        const head = el('div', 'cv-stock');
        head.appendChild(el('b', null, `${pick.name} (${pick.sym})`));
        head.appendChild(el('span', chg >= 0 ? 'up' : 'down', `${fmtNum(price)} · ${chg >= 0 ? '+' : ''}${chg.toFixed(1)}% on the last day`));
        head.appendChild(CV.spark(s, 300, 90, true));
        const r60 = (s[s.length - 1] / s[0] - 1) * 100;
        head.appendChild(el('small', null, `${r60 >= 0 ? '+' : ''}${r60.toFixed(1)}% over the last ${s.length} trading days` + (pick.yield ? ` · pays about ${(pick.yield * 100).toFixed(1)}% a year in dividends` : '')));
        b.appendChild(head);
        const held = P[pick.sym];
        const two = el('div', 'two'); b.appendChild(two);
        const qty = CV.field(two, 'How many shares', '1', '1', { inputmode: 'numeric' });
        two.appendChild(el('div', 'cv-note muted', held ? `You have ${held.n} (bought for ${fmtNum(Math.round(held.cost / held.n))} each on average).` : `You have none. One share is ${fmtNum(price)}.`));
        const say = bankMsg(b);
        const buy = btn('Buy', 'green', () => {
            const n = bankAmount(qty);
            if (!n) return say('err', 'How many? Type a number first.');
            const cost = n * price;
            if (cost > S.money) return say('err', `${n} ${plural(n, 'share')} of ${pick.name} cost ${fmtNum(cost)} sand dollars. You have ${fmtNum(S.money)}.`);
            addMoney(-cost, true, 'Stocks');
            const h = P[pick.sym] || (P[pick.sym] = { n: 0, cost: 0 });
            h.n += n; h.cost += cost;
            if (!bank().stockLog) townLog(`${S.playerName || 'Sarah'} buys her first shares: ${pick.name}.`);
            bank().stockLog = true;
            Sfx.play('buy'); Save.touch(); redraw();
        });
        const sell = btn('Sell', 'alt', () => {
            const n = bankAmount(qty), h = P[pick.sym];
            if (!n) return say('err', 'How many? Type a number first.');
            if (!h || h.n < n) return say('err', `You have ${h ? h.n : 0} ${plural(h ? h.n : 0, 'share')} of ${pick.name}.`);
            const avg = h.cost / h.n;
            h.n -= n; h.cost -= Math.round(avg * n);
            if (!h.n) delete P[pick.sym];
            addMoney(n * price, true, 'Stocks');
            Sfx.play('sell'); Save.touch(); redraw();
        });
        buy.disabled = sell.disabled = paused;
        f.appendChild(buy); f.appendChild(sell);
        const mine = Object.keys(P);
        if (mine.length) {
            CV.h(b, 'Your portfolio');
            const pl = CV.list(b);
            let total = 0, paid = 0;
            for (const sym of mine) {
                const st = M.stock(sym);
                if (!st) continue;
                const h = P[sym], worth = h.n * M.price(st), ch = Math.round((worth / h.cost - 1) * 100);
                total += worth; paid += h.cost;
                CV.row(pl, null, `${h.n} ${plural(h.n, 'share')} of ${st.name}`, `worth ${fmtNum(worth)} · ${ch >= 0 ? '+' : ''}${ch}% since you bought`, CV.spark(st.closes.slice(-20), 70, 26), () => { this.pick = sym; redraw(); });
            }
            CV.note(b, `All together: ${fmtNum(total)} sand dollars (you paid ${fmtNum(paid)}).`);
        }
        CV.h(b, 'The market');
        const l = CV.list(b);
        for (const st of M.data.stocks) {
            const w = st.closes.slice(-20), c = (w[w.length - 1] / w[w.length - 2] - 1) * 100;
            const r = CV.row(l, null, st.name, `${fmtNum(M.price(st))} · ${c >= 0 ? '+' : ''}${c.toFixed(1)}% on the last day`, CV.spark(w, 70, 26), () => { this.pick = st.sym; redraw(); });
            if (st === pick) r.classList.add('sel');
        }
        CV.note(b, "Real prices from a free market data service, ten sand dollars to the dollar. They're a little behind (up to a day).");
    },
};
/* dividends: on the first of the month, the companies that pay them pay a twelfth of a year's worth */
async function marketDividends() {
    const P = S.bank && S.bank.stocks;
    if (!P || !Object.keys(P).length || Clock.date() !== 1 || !CIVIC_PREVIEW) return;
    const B = bank(), day = Clock.dayNum();
    if (B.divDay === day) return;
    const M = await Market.load();
    if (!M) return;
    B.divDay = day;
    let total = 0;
    const lines = [];
    for (const [sym, h] of Object.entries(P)) {
        const st = Market.stock(sym);
        if (!st || !st.yield) continue;
        const pay = Math.floor(h.n * Market.price(st) * st.yield / 12);
        if (pay > 0) { total += pay; lines.push(`${st.name}: ${fmtNum(pay)}`); }
    }
    if (!total) return;
    addMoney(total, true, 'Dividends');
    sendMail({ from: 'post', subject: 'Dividends from the Bank', body: `Your companies paid you this month:\n${lines.join('\n')}\n\nAll together: ${fmtNum(total)} sand dollars, already in your pocket.\n- The Bank of the Island` });
    Save.touch();
}
