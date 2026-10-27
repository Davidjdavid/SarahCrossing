/* ---- 6ze_bank.js ---- */
/* The Bank of the Island, for real (on beta with the civic buildings: CIVIC_PREVIEW): a savings account that grows a
   little every morning (the rate changes each week), savings goals, the statement of where Sarah's sand dollars came
   from and went (every addMoney says why: moneyFlow in 23_items.js), a safety deposit box for keepsakes, and the house
   loan when Ginger builds before it's paid for. Each replaces its sample screen (CIVIC_LIVE); the samples are still in
   the preview's buttons. The Bank is each person's own (PERSON_KEYS): a visitor has their own account. */
const BANK_BOX = 20, BANK_GOALS = 5, BANK_CAP = 1000000;      // interest is paid on up to a million
function bank() {
    const B = S.bank || (S.bank = {});
    if (B.savings == null) { B.savings = 0; B.earned = 0; B.day = Clock.dayNum(); }
    if (!B.goals) B.goals = [];
    if (!B.box) B.box = [];
    if (!B.flow) B.flow = { in: {}, out: {}, since: Clock.dayNum() };
    return B;
}
/* this week's interest, in percent a day (between 0.05 and 0.25: about a tenth more in a month) */
function bankRate(day) {
    const r = mulberry(hash32((S.seed || '') + ':rate:' + Math.floor((day == null ? Clock.dayNum() : day) / 7)))();
    return Math.round((0.05 + r * 0.2) * 100) / 100;
}
/* each morning: the interest on what's saved (and on what's put toward goals), for every day since the last time */
function bankTick() {
    if (!S) return 0;
    const B = bank(), today = Clock.dayNum();
    if (B.day >= today) return 0;
    let paid = 0;
    for (let d = Math.max(B.day + 1, today - 30); d <= today; d++) {
        const k = bankRate(d) / 100;
        const i = Math.floor(Math.min(B.savings, BANK_CAP) * k);
        B.savings += i; paid += i;
        for (const g of B.goals) { const j = Math.floor(Math.min(g.saved, BANK_CAP) * k); g.saved += j; paid += j; }
    }
    B.day = today;
    if (paid) { B.earned += paid; B.flow.in.Interest = (B.flow.in.Interest || 0) + paid; Save.touch(); }
    return paid;
}
/* an amount typed into a field (commas and spaces are fine) */
function bankAmount(input) {
    const v = Math.floor(Number(String(input.value).replace(/[,\s]/g, '')));
    return isFinite(v) && v > 0 ? v : 0;
}
/* a line under the fields for what just happened, or what went wrong */
function bankMsg(b) {
    const m = el('div', 'cv-msg');
    b.appendChild(m);
    return (kind, text) => { m.innerHTML = ''; if (text) CV.banner(m, kind, text); };
}
const bankFmt = n => `${fmtNum(n)} sand ${n === 1 ? 'dollar' : 'dollars'}`;

/* ---------------------------------------------------------------- savings */
CIVIC_LIVE.savings = {
    draw(b, f, redraw) {
        bankTick();
        const B = bank();
        CV.big(b, 'In savings', bankFmt(B.savings), `This week's interest: ${bankRate()}% a day, paid every morning`);
        CV.note(b, B.earned ? `Interest earned so far: ${bankFmt(B.earned)}` : 'Nothing earned yet. Even a little grows a little every morning.');
        const two = el('div', 'two'); b.appendChild(two);
        const put = CV.field(two, 'Put in', '', '0', { inputmode: 'numeric' }), take = CV.field(two, 'Take out', '', '0', { inputmode: 'numeric' });
        const quick = el('div', 'st-row');
        quick.appendChild(chip('All my pocket', () => { put.value = String(S.money); }));
        quick.appendChild(chip('All of it back', () => { take.value = String(B.savings); }));
        b.appendChild(quick);
        const say = bankMsg(b);
        CV.note(b, `In your pocket: ${bankFmt(S.money)}.` + (B.savings >= BANK_CAP ? ` (Interest is paid on the first ${fmtNum(BANK_CAP)}.)` : ''));
        f.appendChild(btn('Put in', 'green', () => {
            const n = bankAmount(put);
            if (!n) return say('err', 'How much? Type an amount first.');
            if (n > S.money) return say('err', `You only have ${bankFmt(S.money)} in your pocket.`);
            addMoney(-n, true, 'bank'); B.savings += n;
            Sfx.play('buy'); Save.touch();
            redraw(); UI.toast(`${bankFmt(n)} into savings`, 'ui_coin');
        }));
        f.appendChild(btn('Take out', 'alt', () => {
            const n = bankAmount(take);
            if (!n) return say('err', 'How much? Type an amount first.');
            if (n > B.savings) return say('err', `There's ${bankFmt(B.savings)} in savings.`);
            if (S.money + n > 9999999) return say('err', "That won't fit in your pocket. Leave some in the Bank!");
            B.savings -= n; addMoney(n, true, 'bank');
            Sfx.play('sell'); Save.touch();
            redraw(); UI.toast(`${bankFmt(n)} back in your pocket`, 'ui_coin');
        }));
    },
};

/* ---------------------------------------------------------------- savings goals */
CIVIC_LIVE.goals = {
    draw(b, f, redraw) {
        bankTick();
        const B = bank();
        if (!B.goals.length) CV.empty(b, 'No goals yet. Add something you\'d like to save for, and an amount to aim toward.');
        else {
            const l = CV.list(b);
            for (const g of B.goals) {
                const pct = Math.min(100, Math.round(g.saved / g.target * 100)), done = g.saved >= g.target;
                const r = CV.row(l, null, g.name, `${fmtNum(g.saved)} of ${fmtNum(g.target)} (${pct}%)`, done ? el('span', 'cv-pill ok', 'Reached!') : null, () => bankGoal(g, () => civicScreen('goals', null, () => civicMenu('bank'))));
                r.querySelector('.t').appendChild(CV.meter(pct, done ? '#3f9a5a' : null));
            }
            CV.note(b, 'Money put toward a goal waits in the Bank (and earns interest) until you take it out.');
        }
        if (B.goals.length >= BANK_GOALS) { CV.note(b, `That's ${BANK_GOALS} goals: finish one before starting another.`); return; }
        CV.h(b, 'A new goal');
        const name = CV.field(b, 'What are you saving for?', '', 'A name for the goal', { max: 24 });
        const target = CV.field(b, 'How much does it cost?', '', 'Sand dollars', { inputmode: 'numeric' });
        const say = bankMsg(b);
        f.appendChild(btn('New goal', 'green', () => {
            const nm = name.value.trim(), t = bankAmount(target);
            if (!/[a-z0-9]/i.test(nm)) return say('err', 'Give the goal a name (a word or two).');
            if (t < 100) return say('err', 'A goal needs a price: at least 100 sand dollars.');
            B.goals.push({ name: nm.slice(0, 24), target: Math.min(t, 9999999), saved: 0, day: Clock.dayNum() });
            Sfx.ui('ok'); Save.touch(); redraw();
        }));
    },
};
/* one goal: put money toward it, take it back, or, once it's reached, take it all out */
function bankGoal(g, back) {
    const B = bank();
    const P = UI.open({ title: g.name, foot: true, back });
    const draw = () => {
        P.body.innerHTML = ''; P.foot.innerHTML = '';
        P.body.className = 'pbody cv';
        const done = g.saved >= g.target, pct = Math.min(100, Math.round(g.saved / g.target * 100));
        CV.big(P.body, done ? 'Reached!' : 'Saved so far', bankFmt(g.saved), `of ${bankFmt(g.target)} · ${pct}%`);
        P.body.appendChild(CV.meter(pct, done ? '#3f9a5a' : null));
        const amt = CV.field(P.body, done ? 'Take out' : 'Put toward it', '', '0', { inputmode: 'numeric' });
        if (!done) { const q = el('div', 'st-row'); q.appendChild(chip(`What's left (${fmtNum(Math.max(0, g.target - g.saved))})`, () => { amt.value = String(Math.max(0, Math.min(S.money, g.target - g.saved))); })); P.body.appendChild(q); }
        const say = bankMsg(P.body);
        CV.note(P.body, `In your pocket: ${bankFmt(S.money)}.`);
        if (!done) P.foot.appendChild(btn('Put in', 'green', () => {
            const n = bankAmount(amt);
            if (!n) return say('err', 'How much? Type an amount first.');
            if (n > S.money) return say('err', `You only have ${bankFmt(S.money)} in your pocket.`);
            addMoney(-n, true, 'bank'); g.saved += n;
            Sfx.play('buy'); Save.touch();
            if (g.saved >= g.target) { Sfx.play('fanfare'); UI.toast(`Goal reached: ${g.name}!`, 'ui_coin'); }
            draw();
        }));
        P.foot.appendChild(btn(done ? 'Take it all out' : 'Take some back', done ? 'green' : 'alt', () => {
            const n = done ? g.saved : bankAmount(amt);
            if (!n) return say('err', 'How much? Type an amount first.');
            if (n > g.saved) return say('err', `There's ${bankFmt(g.saved)} put toward it.`);
            if (S.money + n > 9999999) return say('err', "That won't fit in your pocket. Leave some in the Bank!");
            g.saved -= n; addMoney(n, true, 'bank');
            Sfx.play('sell');
            if (done) { B.goals.splice(B.goals.indexOf(g), 1); Save.touch(); UI.toast(`${bankFmt(n)} for ${g.name}. Enjoy it!`, 'ui_coin'); if (back) back(); else UI.close(); return; }
            Save.touch(); draw();
        }));
        P.foot.appendChild(btn('Delete goal', 'alt', () => {
            if (g.saved) { addMoney(g.saved, true, 'bank'); UI.toast(`${bankFmt(g.saved)} back in your pocket`, 'ui_coin'); }
            B.goals.splice(B.goals.indexOf(g), 1);
            Save.touch();
            if (back) back(); else UI.close();
        }));
    };
    draw();
}

/* ---------------------------------------------------------------- the statement */
CIVIC_LIVE.statement = {
    draw(b) {
        bankTick();
        const F = bank().flow, sum = o => Object.values(o).reduce((a, v) => a + v, 0);
        const earned = sum(F.in), spent = sum(F.out);
        if (!earned && !spent) { CV.empty(b, 'Nothing to show yet. Sell something, buy something, and come back!'); return; }
        const two = el('div', 'two'); b.appendChild(two);
        CV.big(two, 'Earned', fmtNum(earned)); CV.big(two, 'Spent', fmtNum(spent));
        CV.note(b, `Since the Bank started keeping track (${dayDate(F.since)}).`);
        const cols = ['#3a7ad8', '#f0a088', '#e8843a', '#9a6a3a', '#3f9a5a', '#9a5ad8', '#f4c040', '#5a5a8a', '#d8433b', '#f49ac0'];
        const top = (o) => Object.entries(o).sort((a, c) => c[1] - a[1]).slice(0, 7).map(([k, v], i) => [k, v, cols[i % cols.length]]);
        if (earned) { CV.h(b, 'Where your sand dollars came from'); CV.bars(b, top(F.in)); }
        if (spent) { CV.h(b, 'Where your sand dollars went'); CV.bars(b, top(F.out)); }
        const B = bank(), goals = B.goals.reduce((a, g) => a + g.saved, 0);
        CV.h(b, 'Right now');
        const l = CV.list(b);
        CV.row(l, 'ui_coin', 'In your pocket', null, fmtNum(S.money));
        CV.row(l, 'ui_coin', 'In savings', null, fmtNum(B.savings));
        if (goals) CV.row(l, 'ui_coin', 'Put toward goals', null, fmtNum(goals));
        if (B.loan) CV.row(l, 'app_home', 'Still to pay on the house', null, fmtNum(B.loan.total - B.loan.paid));
    },
};
/* a day number as a date ("October 26") */
function dayDate(day) {
    const d = new Date(day * 86400e3);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/* ---------------------------------------------------------------- the safety deposit box */
CIVIC_LIVE.vault = {
    draw(b, f, redraw) {
        const B = bank();
        CV.note(b, `${B.box.length} of ${BANK_BOX} spaces used. Tap something to take it back.`);
        const say = bankMsg(b);
        const g = el('div', 'grid');
        for (let i = 0; i < BANK_BOX; i++) {
            const s = B.box[i];
            g.appendChild(slotBtn(s ? s.id : null, s ? s.n : 0, { onClick: s ? () => {
                if (!canAdd(s.id, s.n)) return say('err', 'Your pocket is full. Make some room first.');
                addItem(s.id, s.n, true);
                B.box.splice(i, 1);
                Sfx.play('pick'); Save.touch(); redraw();
                UI.toast(`${itemName(s.id)} back in your pocket`, itemIcon(s.id));
            } : null }));
        }
        b.appendChild(g);
        if (!B.box.length) CV.note(b, 'Keep keepsakes, photos and one-of-a-kind gifts safe here.');
        const put = btn('Put something in', 'green', async () => {
            if (B.box.length >= BANK_BOX) return say('err', 'The box is full. Take something out first.');
            const id = await pickFromPocket('Put in the box', s => ITEMS[s.id] && ITEMS[s.id].type !== 'tool', 'Tools stay with you.');
            civicScreen('vault', null, () => civicMenu('bank'));
            if (!id) return;
            const i = S.pocket.findIndex(s => s && s.id === id), n = removeSlot(i);
            const have = B.box.find(s => s.id === id && stackMax(id) > 1);
            if (have) have.n += n; else B.box.push({ id, n });
            Sfx.play('place'); Save.touch();
            civicScreen('vault', null, () => civicMenu('bank'));
            UI.toast(`${itemName(id)} is safe in the box`, itemIcon(id));
        });
        put.disabled = B.box.length >= BANK_BOX;
        f.appendChild(put);
    },
};

/* ---------------------------------------------------------------- the house loan */
/* Ginger's crew can build before the house is paid for (the Bank lends it: no interest, no hurry) */
function bankLoanOk() { return CIVIC_PREVIEW && !Online.visitor() && !bank().loan; }
function bankLend(what, total) { bank().loan = { what, total, paid: 0, day: Clock.dayNum() }; Save.touch(); }
CIVIC_LIVE.loan = {
    draw(b, f, redraw) {
        const B = bank(), L = B.loan;
        if (!L) { CV.empty(b, "No loan! The house is all yours. Ginger can build the next upgrade before it's paid for, and the Bank will wait.", 'app_home'); return; }
        const left = L.total - L.paid, pct = Math.round(L.paid / L.total * 100);
        CV.big(b, 'Still to pay', bankFmt(left), `For ${L.what}`);
        b.appendChild(CV.meter(pct, '#3f9a5a'));
        CV.note(b, `${pct}% paid · no interest, no hurry`);
        const amt = CV.field(b, 'Pay now', '', '0', { inputmode: 'numeric' });
        const q = el('div', 'st-row');
        q.appendChild(chip(`All of it (${fmtNum(left)})`, () => { amt.value = String(Math.min(left, S.money)); }));
        b.appendChild(q);
        const say = bankMsg(b);
        CV.note(b, `In your pocket: ${bankFmt(S.money)}.`);
        f.appendChild(btn('Pay', 'green', () => {
            const n = Math.min(bankAmount(amt), left);
            if (!n) return say('err', 'How much? Type an amount first.');
            if (n > S.money) return say('err', `You have ${bankFmt(S.money)} in your pocket.`);
            addMoney(-n, true, 'House');
            L.paid += n;
            Sfx.play('buy');
            if (L.paid >= L.total) { B.loan = null; Sfx.play('fanfare'); UI.toast('The house is paid for! All yours.', 'app_home'); }
            Save.touch(); redraw();
        }));
    },
};
