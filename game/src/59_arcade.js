/* ---- 59_arcade.js ---- */
/* The arcade: Chili's prize counter, the cabinets (Bento Blocks, Spice Capsules, Snack Stack, Dumpling Drop, Sushi Swap,
   Fortune Falls), the claw machine and tickets; the old classics and the cabinet that's out of order are in the back
   room (6z_backroom.js). Every machine can be won at the prize counter and played at home, free (home games don't pay
   tickets). The games all run inside one cabinet overlay drawn here; their rules live in 61_arcadegames.js. Each game's
   top five (DAVID's record first, just under what it unlocks) are on the wall's board and in the cabinet's menu. */

const ARCADE_GAMES = {};
const ARCADE_CABS = ['blocks', 'capsules', 'stack', 'dumpling', 'sushi', 'fortune'];      // the cabinet games out front, in the room's order
const ARCADE_W = 136, ARCADE_H = 152;
const PLAY_FEE = 50, CLAW_FEE = 100;
const PRIZES = [
    ['plush_maki', 40], ['plush_wonton', 40], ['plush_goat', 40], ['plush_chili', 40], ['plush_coco', 40], ['plush_cece', 40],
    ['plush_kai', 40], ['plush_sully', 40], ['arcade_stool', 30], ['neon_game', 90], ['hiscore_board', 90], ['snack_machine', 120],
    ['cab_blocks', 250], ['cab_capsules', 250], ['cab_fruit', 250], ['cab_stack', 250], ['claw_machine', 320], ['trophy_arcade', 500],
];
function arc() {
    if (!S.arcade) S.arcade = { tickets: 0, best: {}, plays: {}, free: {}, won: 0, claw: null };
    if (!S.arcade.reach) S.arcade.reach = {};
    if (!S.arcade.rival) S.arcade.rival = {};
    return S.arcade;
}
function addTickets(n, quiet) {
    const A = arc();
    A.tickets = Math.max(0, Math.min(99999, A.tickets + n));
    Save.touch();
    if (!quiet && n > 0) UI.toast(`+${n} ${plural(n, 'ticket')}`, 'ui_ticket');
}
const CHILI_ARCADE = [
    "Welcome! Tickets for prizes at this counter. If you're here about a high score, I reserve the right to look unimpressed.",
    "Bento Blocks tip: leave yourself somewhere to put the next piece. I remember that just after I need it.",
    "The claw machine is fair. It treats everybody like this.",
    "Kai played Fortune Falls for three hours yesterday. I asked if he wanted a break. He thought he was taking one.",
    "Tickets don't expire. I still have mine. I'm saving for the big prize. Yes, I work here. I have to win it like everybody else.",
    "The Spice Capsules bug looks a little like me. I would like it recorded that I am much harder to clear.",
    "Maki beat my high score. Said he'd 'noticed a pattern.' I'm trying to notice it too.",
];
const PLUSH_SELF = {
    maki: 'A tiny me. The rice is in order. I see they consulted someone.',
    wonton: 'A tiny me! It is soft! It is NOT a dumpling in soup! I love it!',
    chili: "A little me? Huh. Does it come with the attitude, or do I have to teach it?",
    coco: "Oh my GOD, it's ME. Tiny me! I'm telling everyone. Tiny me is telling everyone too.",
    cece: "It's me! Soft me! Sorry, I'm crying. Tiny me isn't crying. She's doing great.",
    kai: "Little Kai! Dude. You don't even have to go surfing. Your whole life can be the beach bag.",
    sully: "Kid. Is that me? That's wicked cute. Don't tell anybody I said 'cute.'",
};
function chiliVoice() { const c = NPCs.get('chili'); return c && !c.sleeping && c.area === 'arcade' ? 'chili' : null; }

/* the neighbors have opinions about all this */
const ARCADE_CHAT = {
    kai: ['Dude, Fruit Catch is basically surfing. With fruit. And no water. And no board. So, not surfing.'],
    maki: ['Bento Blocks is the only game that respects me. Every row lines up. Precisely.', 'Sushi Swap rewards planning. Swap, wait, chain. Precisely.'],
    cece: ['I tried the claw machine. The plushie slipped and I apologized to it. It did not forgive me.'],
    cuke: ['Jump rope in the plaza! Afternoons! Good for the heart! And the calves! And morale!'],
    basil: ["Karaoke at the club is so nice. Joe's poems with a beat? Magic. Pure magic."],
    clementine: ['The arcade carpet is a crime. A fabulous, glittering crime.'],
    sully: ["Won a plushie. Chili came over to check the machine. I said, 'It's fine, kid. I just won.' That didn't help."],
    wonton: ['There is a Wonton plushie in the claw machine! It is very soft. It is not in soup. I approve.',
        'Dumpling Drop has dumplings! They fall! They pop! Nobody goes in soup! It is my favorite game!'],
    coco: ["Have you done karaoke yet? Joe's poems, with MUSIC. I sang the frog one. Twice. People were moved. To tears."],
    ginger: ["I fixed the claw machine once. Now it's too fair. Chili is furious."],
    brulee: ["The arcade is very loud. But the colors! Like a painting that beeps."],
    mac: ["Bento Blocks makes me hungry. Everything makes me hungry. I'm a restaurant."],
};
for (const [id, lines] of Object.entries(ARCADE_CHAT)) if (TALK[id]) TALK[id].chat.push(...lines);

/* ---------------------------------------------------------------- a 3x5 pixel font for the cabinet screens */
const PXF = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001011001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111101101101', N: '101111111101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', '!': '010010010000010', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000',
    '-': '000000111000000', '+': '000010111010000', '?': '111001010000010', '/': '001001010100100', "'": '010010000000000',
    '*': '101111111010000', ' ': '000000000000000',
};
/* a few letters need more room to read at this size */
const PXF_WIDE = { M: [5, '1000111011101011000110001'], W: [5, '1000110001101011101110001'], N: [4, '10011101101110011001'] };
function pxGlyph(ch) { const w = PXF_WIDE[ch]; return w ? { w: w[0], bits: w[1] } : { w: 3, bits: PXF[ch] }; }
function pxWidth(text, k) {
    k = k || 1;
    let w = 0;
    for (const ch of String(text).toUpperCase()) w += (pxGlyph(ch).w + 1) * k;
    return Math.max(0, w - k);
}
function pxText(g, text, x, y, col, k, align) {
    k = k || 1;
    text = String(text).toUpperCase();
    const w = pxWidth(text, k);
    if (align === 'center') x -= Math.floor(w / 2);
    else if (align === 'right') x -= w;
    g.fillStyle = col;
    let cx = x;
    for (const ch of text) {
        const gl = pxGlyph(ch);
        if (gl.bits) for (let j = 0; j < gl.w * 5; j++) if (gl.bits.charCodeAt(j) === 49) g.fillRect(cx + (j % gl.w) * k, y + Math.floor(j / gl.w) * k, k, k);
        cx += (gl.w + 1) * k;
    }
    return w;
}
function pxShadow(g, text, x, y, col, k, align, sh) {
    pxText(g, text, x + (k || 1), y + (k || 1), sh || '#120c22', k, align);
    return pxText(g, text, x, y, col, k, align);
}
function pxNum(n) { return String(Math.floor(n)); }

/* ---------------------------------------------------------------- the cabinet overlay */
const Arcade = {
    on: false, id: null, def: null, g: null, U: null, opts: {}, state: 'off', t: 0,
    held: {}, tap: {}, prev: {}, pointer: { x: 0, y: 0, down: false, seen: false },
    start(id, opts) {
        return new Promise(res => { this._res = res; this.open(id, opts || {}); });
    },
    open(id, opts) {
        this.close(true);
        const def = ARCADE_GAMES[id];
        this.id = id; this.def = def; this.opts = opts;
        const root = el('div');
        root.id = 'arcade';
        if (def.kitchen) root.className = 'cook';
        root.style.setProperty('--ar-glow', def.glow || '#ff5aa8');
        const top = el('div', 'ar-top');
        top.appendChild(el('div', 'ar-title', opts.title || (def.name + (opts.home ? ' \u00b7 at home' : ''))));
        const tix = el('div', 'ar-tix');
        tix.appendChild(iconCanvas('ui_ticket', 22));
        const tn = el('span', null, '');
        tix.appendChild(tn);
        if (opts.home) tix.hidden = true;
        const x = el('button', 'ar-x', '\u00d7');
        x.type = 'button'; x.setAttribute('aria-label', 'Leave the game');
        x.addEventListener('click', ev => { ev.stopPropagation(); Sfx.ui('tick'); if (this.state === 'over') this.finish(); else this.pause(); });
        top.appendChild(tix); top.appendChild(x);
        const mid = el('div', 'ar-mid');
        const cv = el('canvas', 'ar-screen');
        cv.width = def.w || ARCADE_W; cv.height = def.h || ARCADE_H;
        cv.setAttribute('aria-label', def.name + ' screen');
        mid.appendChild(cv);
        const help = el('div', 'ar-help', def.kitchen ? '' : def.help + ' \u00b7 Esc pauses');
        mid.appendChild(help);
        const pads = el('div', 'ar-pads');
        const padL = el('div', 'ar-pad ar-padL'), padR = el('div', 'ar-pad ar-padR');
        for (const b of def.buttons) {
            if (b.noPad) continue;
            const bt = el('button', 'ar-btn' + (b.wide ? ' wide' : '') + (b.small ? ' sm' : ''), b.label);
            bt.type = 'button';
            bt.dataset.k = b.k;
            bt.setAttribute('aria-label', b.aria || b.k);
            const on = v => { if (v && !this.held[b.k]) this.tap[b.k] = true; this.held[b.k] = v; bt.classList.toggle('on', v); };
            bt.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); Audio2.unlock(); try { bt.setPointerCapture(ev.pointerId); } catch (e) { /* old browser */ } on(true); });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => bt.addEventListener(t, () => on(false)));
            bt.addEventListener('contextmenu', ev => ev.preventDefault());
            (b.side === 'L' ? padL : padR).appendChild(bt);
        }
        pads.appendChild(padL); pads.appendChild(padR);
        // (six buttons don't fit a phone held upright at the usual size: the snowball fight's)
        if (padL.children.length + padR.children.length > 5) pads.classList.add('many');
        const card = el('div', 'ar-card');
        card.hidden = true;
        root.appendChild(top); root.appendChild(mid); root.appendChild(pads); root.appendChild(card);
        $('#ui').appendChild(root);
        // the screen itself: drag (fruit catch) and tap (anything)
        const pt = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * cv.width, (ev.clientY - r.top) / r.height * cv.height]; };
        cv.addEventListener('pointerdown', ev => { ev.preventDefault(); Audio2.unlock(); const [px, py] = pt(ev); Object.assign(this.pointer, { x: px, y: py, down: true, seen: true }); try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } this.tap.screen = true; });
        cv.addEventListener('pointermove', ev => { if (!this.pointer.down) return; const [px, py] = pt(ev); this.pointer.x = px; this.pointer.y = py; });
        ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { this.pointer.down = false; }));
        this.U = { root, top, tn, cv, g: cv.getContext('2d'), mid, pads, padL, padR, help, card };
        this.U.g.imageSmoothingEnabled = false;
        this.on = true;
        G.busy++;
        UI.modal = true;
        G.keys = {};
        this.held = {}; this.tap = {}; this.prev = {};
        Music.over = def.tune || null;
        Music.update(true);
        this._fit = () => this.fit();
        addEventListener('resize', this._fit);
        this.newGame();
        this.fit();
        requestAnimationFrame(() => this.fit());
    },
    newGame() {
        this.g = this.def.create(this.opts);
        this.state = this.def.noReady ? 'play' : 'ready'; this.t = 0;
        this.U.card.hidden = true;
        this.result = null;
        this.showTickets();
    },
    showTickets() { if (this.U) this.U.tn.textContent = fmtNum(arc().tickets); },
    fit() {
        const U = this.U;
        if (!U) return;
        const land = innerWidth > innerHeight * 1.15;
        U.root.classList.toggle('land', land);
        const topH = U.top.offsetHeight || 48;
        const helpH = U.help.offsetHeight ? U.help.offsetHeight + 12 : 0;
        const padW = land ? Math.max(U.padL.offsetWidth, U.padR.offsetWidth) : 0;
        const availW = land ? innerWidth - 2 * (padW + 28) : innerWidth - 24;
        const availH = innerHeight - topH - helpH - (land ? 22 : (U.pads.offsetHeight || 90) + 22);
        const W = U.cv.width, H = U.cv.height;
        let k = Math.min(availW / W, availH / H);
        k = k >= 2 ? Math.floor(k * 4) / 4 : Math.max(0.8, k);
        U.cv.style.width = Math.round(W * k) + 'px';
        U.cv.style.height = Math.round(H * k) + 'px';
    },
    /* the kitchen changes its instructions and button labels step by step */
    help(text) { if (!this.U) return; this.U.help.textContent = text || ''; this.fit(); },
    label(k, text) { if (!this.U) return; const b = this.U.pads.querySelector(`[data-k="${k}"]`); if (b) b.textContent = text; },
    update() {
        if (!this.on || !this.g) return;
        const pressed = {};
        for (const k of Object.keys(this.tap)) if (this.tap[k]) pressed[k] = true;
        this.tap = {};
        const inp = { held: this.held, pressed, pointer: this.pointer };
        this.t++;
        if (this.state === 'ready') {
            if (this.t >= 80) { this.state = 'play'; this.t = 0; }
            if (this.g.idle) this.g.idle(inp);
        } else if (this.state === 'play') {
            this.g.update(inp);
            if (this.g.over) this.gameOver();
        } else if (this.state === 'over' && this.g.after) this.g.after();
        this.draw();
    },
    draw() {
        const g = this.U.g;
        g.setTransform(1, 0, 0, 1, 0, 0);
        this.g.draw(g, this.t, this.state);
        const W = this.U.cv.width, H = this.U.cv.height;
        if (this.state === 'ready') {
            g.fillStyle = 'rgba(18,12,34,0.55)';
            g.fillRect(0, 60, W, 34);
            const n = 3 - Math.floor(this.t / 27);
            pxShadow(g, n > 0 ? 'READY ' + n : 'GO!', W / 2, 70, '#ffd84a', 2, 'center');
        } else if (this.state === 'pause') {
            g.fillStyle = 'rgba(18,12,34,0.6)';
            g.fillRect(0, 0, W, H);
            pxShadow(g, 'PAUSED', W / 2, Math.round(H / 2) - 12, '#ffffff', 2, 'center');
        }
    },
    key(code, down, e) {
        const rep = e && e.repeat;
        if (this.state === 'over') {
            if (down && !rep && this.cardReady) { if (code === 'Escape' || code === 'KeyB') this.finish(); else if (isA(code)) { if (this.def.kitchen) this.finish(); else this.again(); } }
            return;
        }
        if (this.state === 'pause') {
            if (down && !rep) { if (code === 'Escape' || isA(code)) this.resume(); else if (code === 'KeyQ') this.quit(); }
            return;
        }
        if (down && code === 'Escape') { this.pause(); return; }
        for (const b of this.def.buttons) {
            if (!b.keys.includes(code)) continue;
            if (down && !rep && !this.held[b.k]) this.tap[b.k] = true;
            this.held[b.k] = down;
        }
    },
    pause() {
        if (this.state !== 'play' && this.state !== 'ready') return;
        this.was = this.state;
        this.state = 'pause';
        this.held = {};
        this.card('Paused', [this.def.pauseNote || 'Take a breather. The high score will wait.'], [['Keep playing', () => this.resume(), 'go'], [this.def.quitLabel || 'Quit', () => this.quit(), 'alt']]);
    },
    resume() { if (this.state !== 'pause') return; this.state = this.was || 'play'; this.U.card.hidden = true; Sfx.ui('ok'); },
    quit() { this.state = 'play'; this.U.card.hidden = true; this.g.over = true; this.g.quit = true; this.gameOver(); },
    canPay() { return (this.opts.home || this.def.fee === 0 || S.money >= this.def.fee) && (!this.def.canPlay || this.def.canPlay(this.opts)); },
    again() {
        if (!this.canPay()) { Sfx.ui('nope'); return; }
        if (!this.opts.home) addMoney(-this.def.fee, true, 'Arcade');
        Sfx.ui('ok');
        this.newGame();
    },
    gameOver() {
        this.state = 'over';
        if (this.def.kitchen) { this.cookOver(); return; }
        if (this.def.field) { this.fieldOver(); return; }
        const g = this.g, def = this.def, A = arc();
        const home = !!this.opts.home;
        const tickets = !home && def.tickets ? def.tickets(g) * (bonusOn('tickets') ? 2 : 1) : 0;
        if (tickets) addTickets(tickets, true);
        const score = g.score || 0, prev = A.best[this.id] || 0;
        const newBest = def.scored !== false && score > prev && score > 0;
        if (newBest) A.best[this.id] = score;
        // (DAVID's record topped for the first time: what it guards unlocks, checkSpecialMilestones below)
        const record = newBest && beatsRecord(this.id, score) && !beatsRecord(this.id, prev);
        A.plays[this.id] = (A.plays[this.id] || 0) + 1;
        S.stats.arcade = (S.stats.arcade || 0) + 1;
        const lv = this.id === 'blocks' ? g.level : this.id === 'capsules' ? g.level + 1 : 0;
        if (lv && !g.quit) A.reach[this.id] = Math.max(A.reach[this.id] || 0, lv);
        if (this.id === 'stack') A.stackTop = Math.max(A.stackTop || 0, g.top || 0);
        const rv = A.rival[this.id];
        if (rv && score > rv.score && !rv.beatenDay) { rv.beatenDay = Clock.dayNum(); setTimeout(() => UI.toast(`You beat ${cap(rv.who.toLowerCase())}'s score! The whole island will hear about it.`, 'ui_ticket'), 900); }
        Save.touch();
        this.result = { id: this.id, score, tickets, newBest, record, won: g.won || null, home, level: lv };
        Bus.emit('arcadeGame', this.result);
        setTimeout(() => checkSpecialMilestones(), 1200);
        this.showTickets();
        const r = def.result ? def.result(g, this.opts) : null;
        Sfx.play(g.won ? 'prize' : newBest ? 'levelup' : 'gameover');
        const lines = r ? r.lines.slice() : [`Score ${fmtNum(score)} \u00b7 best ${fmtNum(A.best[this.id] || score)}`];
        if (record) lines.push("You topped David's record!");
        if (tickets) lines.push(`+${tickets} ${plural(tickets, 'ticket')} (you have ${fmtNum(A.tickets)})`);
        else if (home && def.tickets) lines.push('Home games are just for fun. No tickets.');
        const fee = this.opts.home ? '' : ` (${fmtNum(def.fee)})`;
        const btns = [[`${def.againLabel || 'Play again'}${fee}`, () => this.again(), 'go', !this.canPay()], ['Done', () => this.finish(), 'alt']];
        this.card(r ? r.title : newBest ? 'New best!' : 'Game over', lines, btns, r && r.icon);
        this.cardReady = false;
        setTimeout(() => { this.cardReady = true; }, 700);
    },
    /* the kitchen: no fees, no tickets, no high scores. Just the dish and a medal. */
    cookOver() {
        const g = this.g;
        this.result = { id: this.id, quit: !!g.quit, medal: g.medal || null, score: g.total || 0 };
        if (g.quit) { this.finish(); return; }
        const r = this.def.result(g, this.opts);
        this.card(r.title, r.lines, [[r.btn || 'Yum!', () => this.finish(), 'go']], r.icon);
        this.cardReady = false;
        setTimeout(() => { this.cardReady = true; }, 700);
    },
    /* an island game with a neighbor (6zx_field_games.js): no fee, no tickets, no high scores; whoever asked hears
       about every game played (opts.onOver) */
    fieldOver() {
        const g = this.g;
        this.result = { id: this.id, quit: !!g.quit, won: !!g.win, score: g.score || 0, op: g.opScore || 0 };
        if (this.opts.onOver) this.opts.onOver(this.result);
        if (g.quit) { this.finish(); return; }
        const r = this.def.result(g, this.opts);
        Sfx.play(g.win ? 'prize' : 'gameover');
        this.card(r.title, r.lines, [['Play again', () => this.again(), 'go'], ['Done', () => this.finish(), 'alt']], r.icon);
        this.cardReady = false;
        setTimeout(() => { this.cardReady = true; }, 700);
    },
    card(title, lines, buttons, icon) {
        const c = this.U.card;
        c.innerHTML = '';
        const box = el('div', 'ar-box');
        if (icon && (Assets.has(icon) || Assets.dyn[icon])) { const ic = iconCanvas(icon, 48); ic.className = 'ar-prize'; box.appendChild(ic); }
        box.appendChild(el('h3', null, title));
        for (const l of lines) box.appendChild(el('p', null, l));
        const row = el('div', 'ar-row');
        for (const [label, fn, cls, disabled] of buttons) {
            const b = el('button', 'btn' + (cls === 'alt' ? ' alt' : cls === 'go' ? ' green' : ''), label);
            b.type = 'button';
            if (disabled) { b.disabled = true; b.title = 'Not enough sand dollars'; }
            b.addEventListener('click', ev => { ev.stopPropagation(); fn(); });
            row.appendChild(b);
        }
        box.appendChild(row);
        if (buttons[0] && buttons[0][3]) box.appendChild(el('p', 'ar-small', this.def.canPlay && !this.def.canPlay(this.opts) ? 'Nothing left to win today!' : 'Not enough sand dollars for another go.'));
        c.appendChild(box);
        c.hidden = false;
    },
    finish() {
        const res = this.result;
        this.close();
        if (this._res) { const r = this._res; this._res = null; r(res); }
    },
    close(silent) {
        const r = $('#arcade');
        if (!r) return;
        r.remove();
        removeEventListener('resize', this._fit);
        this.on = false; this.g = null; this.U = null; this.state = 'off';
        this.held = {}; this.tap = {};
        G.busy = Math.max(0, G.busy - 1);
        UI.modal = false;
        G.keys = {};
        Music.over = null;
        Music.update(true);
        if (!silent) Sfx.ui('close');
    },
};

/* ---------------------------------------------------------------- the room */
ROOMS.arcade = { w: 17, h: 7, wall: 'wall_arcade', floor: 'floor_arcade', music: 'arcade', name: 'The Arcade', staff: 'chili',
    staffAt: [15, 0], staffStand: [15, 2], guest: [5, 4, 2], guestSpots: [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1], [10, 1], [9, 4], [11, 4], [12, 4], [2, 5]],
    build: a => buildArcadeRoom(a),
    closedSign: 'THE ARCADE. Open {hours:arcade}. The machines are asleep. Chili tucked them in.' };
function buildArcadeRoom(a) {
    const items = layoutItems([
        ['poster_blocks', 1, 'wall'], ['poster_capsules', 3, 'wall'], ['poster_stack', 5, 'wall'], ['clock_wall', 9, 'wall'],
        ['hiscore_board', 13, 'wall'], ['neon_game', 15, 'wall'],
        ['cab_blocks', 0, 0], ['cab_capsules', 2, 0], ['cab_stack', 4, 0], ['cab_dumpling', 6, 0], ['cab_sushi', 8, 0], ['cab_fortune', 10, 0],
        ['claw_machine', 11, 3], ['counter_prize', 14, 1], ['plush_goat', 14, 1], ['trophy_arcade', 16, 1], ['snack_machine', 16, 4],
        ['arcade_stool', 1, 4], ['cafe_table', 2, 4], ['arcade_stool', 3, 4], ['plant_monstera', 0, 6], ['plant_monstera', 16, 6]]);
    const use = {
        cab_blocks: () => arcadeCabinet('blocks'), cab_capsules: () => arcadeCabinet('capsules'), cab_stack: () => arcadeCabinet('stack'),
        cab_dumpling: () => arcadeCabinet('dumpling'), cab_sushi: () => arcadeCabinet('sushi'), cab_fortune: () => arcadeCabinet('fortune'),
        poster_stack: () => UI.say(null, 'A poster: "SNACK STACK. Two of the same snack squish into a bigger snack. Can you make a watermelon?" There is a very happy watermelon on it.'),
        claw_machine: () => clawMachine(), counter_prize: () => prizeDesk(), prize_shelf: () => prizeDesk(), hiscore_board: () => showHiScores(),
        snack_machine: () => snackMachine(),
        poster_blocks: () => UI.say(null, 'A poster: "BENTO BLOCKS. Fill the box. Clear the rows. Stay calm. (Chili cannot stay calm.)"'),
        poster_capsules: () => UI.say(null, 'A poster: "SPICE CAPSULES. The bugs are loose! Line up four to catch them." The chili bug looks a lot like Chili.'),
        plush_goat: () => UI.say(null, "A goat plushie sits at the counter, wearing a STAFF badge."),
        trophy_arcade: () => UI.say(null, `ARCADE CHAMPION. It's for sale, sort of: ${fmtNum(PRIZES.find(p => p[0] === 'trophy_arcade')[1])} tickets. Chili polishes it every hour.`),
    };
    items.forEach(it => { if (use[it.id]) it.use = use[it.id]; });
    a.items = items;
    placeFurniture(a, items);
    addBackDoor(a);
}
/* the cabinet that's out of order: a paper note taped over its screen (it's the game David is making again from
   memory; until then nobody can play it). It stands in the back room with the reject games (David, 29 October), and
   tapping it reads the note. */
FURN.cab_broken = { id: 'cab_broken', name: 'Out-of-order cabinet', w: 1, h: 1, kind: 'floor', price: 0, sets: ['fixture'], fixture: 1, arcade: 'broken' };
ITEMS.cab_broken = { name: 'Out-of-order cabinet', type: 'furniture', price: 0, icon: 'f_cab_broken' };
async function brokenCabinet() {
    return UI.say(null, ['A cabinet with a paper note taped over the screen: "OUT OF ORDER. Back here with the other rejects for now. A future update might restore it. Please don\'t hit it. - Ginger"',
        'Under the note the screen flickers now and then, as if it remembers a game.']);
}
/* a cabinet's screen keeps playing its attract mode */
function drawCabinetScreen(ctx, e) {
    const d = e.def, t = G.t;
    const x0 = Math.round(e.x) - 8, y0 = Math.round(e.y) - 29;
    if (d.arcade === 'claw') {
        // the claw drifts back and forth over the plushies
        const cx = Math.round(e.x) - 12 + Math.round((Math.sin(t / 50) + 1) * 11);
        ctx.fillStyle = '#8a96a8';
        ctx.fillRect(cx, Math.round(e.y) - 36, 1, 5);
        ctx.fillRect(cx - 2, Math.round(e.y) - 31, 5, 1);
        return;
    }
    const k = Math.floor(t / 10);
    if (d.arcade === 'blocks') {
        const y = y0 + 7 + (k % 5);
        ctx.fillStyle = ['#4ec3d9', '#ffd45a', '#f28a6b', '#b37cf0'][Math.floor(k / 5) % 4];
        ctx.fillRect(x0 + 6 + (Math.floor(k / 5) % 3), y, 2, 1);
    } else if (d.arcade === 'capsules') {
        ctx.fillStyle = k % 2 ? '#e0405a' : '#ffd45a';
        ctx.fillRect(x0 + 6, y0 + 8 + (k % 4), 1, 1);
        ctx.fillStyle = k % 2 ? '#8cc152' : '#e0405a';
        ctx.fillRect(x0 + 7, y0 + 8 + (k % 4), 1, 1);
    } else if (d.arcade === 'stack') {
        ctx.fillStyle = ['#7acc5e', '#d8283f', '#ffd0e0', '#ffa98a'][Math.floor(k / 6) % 4];
        ctx.fillRect(x0 + 6 + (Math.floor(k / 6) % 3), y0 + 7 + (k % 6), 2, 2);
    } else if (d.arcade === 'fruit') {
        ctx.fillStyle = ['#d8283f', '#ffc53a', '#ffa98a'][Math.floor(k / 4) % 3];
        ctx.fillRect(x0 + 5 + (Math.floor(k / 4) * 3) % 6, y0 + 7 + (k % 4), 1, 1);
    } else if (d.arcade === 'surf') {
        ctx.fillStyle = '#e8f8ff'; ctx.fillRect(x0 + 4 + (k % 8), y0 + 12, 2, 1);
        ctx.fillStyle = '#ff7a6a'; ctx.fillRect(x0 + 6, y0 + 10 - [0, 1, 2, 1][k % 4], 3, 1);
    } else if (d.arcade === 'garden') {
        const h = Math.floor(k / 3) % 3;
        ctx.fillStyle = '#a8743a'; ctx.fillRect(x0 + 5 + h * 2, y0 + 10 - (k % 3 ? 1 : 0), 2, 2);
    } else if (d.arcade === 'dumpling') {
        ctx.fillStyle = ['#ff8aa8', '#7acc5e', '#ffd84a', '#7ab0ff'][Math.floor(k / 5) % 4];
        ctx.fillRect(x0 + 6, y0 + 7 + (k % 5), 2, 2);
    } else if (d.arcade === 'sushi') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + 5 + (k % 2) * 3, y0 + 9, 3, 1);
        ctx.fillStyle = '#ff8a6a'; ctx.fillRect(x0 + 8 - (k % 2) * 3, y0 + 9, 3, 1);
    } else if (d.arcade === 'fortune') {
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0 + 5 + Math.round(Math.abs(Math.sin(k / 3)) * 5), y0 + 7 + (k % 6), 1, 1);
    } else if (d.arcade === 'broken') {
        // the sign taped over the screen, and now and then a flicker of the game underneath
        if (k % 23 === 0) { ctx.fillStyle = '#4ec3d9'; ctx.fillRect(x0 + 3, y0 + 6, 10, 1); }
        ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x0 + 4, y0 + 6, 8, 6);
        ctx.fillStyle = '#c0283a'; ctx.fillRect(x0 + 5, y0 + 8, 6, 1); ctx.fillRect(x0 + 5, y0 + 10, 4, 1);
    } else if (d.arcade === 'noodle') {
        ctx.fillStyle = '#ffe08a';
        for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 5 + ((k - i + 24) % 6), y0 + 9 + (Math.floor((k - i + 24) / 6) % 2) * 2, 1, 1);
    }
    if (G.lamps > 0.2) {
        ctx.fillStyle = 'rgba(160,220,255,0.25)';
        ctx.fillRect(x0 + 4, y0 + 7, 8, 7);
    }
}

/* first time in: Chili explains how it all works */
Bus.on('enter', async id => {
    if (id !== 'arcade' || S.flags.arcadeTour || !chiliVoice()) return;
    S.flags.arcadeTour = true;
    G.busy++;
    await waitFrames(20);
    const c = NPCs.get('chili');
    c.emote = 'spicy'; c.emoteT = 80;
    await UI.say('chili', ["Hey! Welcome to the arcade. I'm Chili. The prizes are over here. The records are mostly David's. The rest are mine.",
        `The cabinets are ${PLAY_FEE} sand dollars a game, and your first game on each one is free. Play well, win tickets.`,
        'Bring the tickets to me for plushies, trophies, even the machines themselves. Then you can play at home. Free. Forever.',
        `The claw machine is ${CLAW_FEE} a try. Line it up carefully. I've heard cheering helps, but I cannot prove it.`]);
    G.busy--;
});

/* ---------------------------------------------------------------- using things */
function levelChoices(id) {
    const top = (arc().reach || {})[id] || 1;
    if (!ARCADE_GAMES[id].levels || top < 2) return [];
    const out = [1];
    for (const k of [Math.round(top / 3), Math.round(top * 2 / 3), top]) if (k > out[out.length - 1]) out.push(k);
    return out;
}
async function arcadeCabinet(id) {
    const def = ARCADE_GAMES[id], A = arc(), sp = chiliVoice();
    const free = !A.free[id];
    const best = A.best[id] ? ` Your best: ${fmtNum(A.best[id])}.` : '';
    const lv = levelChoices(id);
    const vs = typeof Versus !== 'undefined' && Versus.has(id) ? [`Play a neighbor (${fmtNum(def.fee)})`].concat(VsNet.friends().map(w => `Play ${Online.name(w)} (${fmtNum(def.fee)})`)) : [];
    const opts = [free ? 'Play (free!)' : `Play (${fmtNum(def.fee)})`].concat(vs, lv.length ? [`Start at level ${lv[lv.length - 1]}`] : [], lv.length > 2 ? ['Pick a level'] : [], ['High scores', 'How do I play?', 'Not now']);
    const k = await UI.ask(sp, free ? `${def.name}! Your first game is on the house.${best}` : `${def.name}. ${fmtNum(def.fee)} sand dollars a game.${best}`, opts);
    const c = opts[k];
    if (c === 'How do I play?') { await UI.say(sp, def.how); return arcadeCabinet(id); }
    if (c === 'High scores') { UI.hideDialog(); await gameHiScores(id); return arcadeCabinet(id); }
    if (c === 'Not now') return;
    if (c && c.startsWith('Play a neighbor')) return arcadeVersus(id, sp);
    const friend = c && VsNet.friends().find(w => c.startsWith(`Play ${Online.name(w)} (`));
    if (friend) {
        if (S.money < def.fee) { Sfx.ui('nope'); await UI.say(sp, 'Not enough sand dollars.'); return; }
        UI.hideDialog();
        if (!(await VsNet.invite(friend, id))) return;
        addMoney(-def.fee, true, 'Arcade');
        return afterArcade(await VsNet.play(id, friend));
    }
    let level = 1;
    if (c && c.startsWith('Start at level')) level = lv[lv.length - 1];
    if (c === 'Pick a level') {
        const j = await UI.ask(sp, 'Which level? (You can start at any level you have reached.)', lv.map(n => `Level ${n}`).concat(['Never mind']));
        if (j >= lv.length) return;
        level = lv[j];
    }
    if (!free && S.money < def.fee) { Sfx.ui('nope'); await UI.say(sp, sp ? "Not enough sand dollars. Go shake a tree. I'll wait. I'm very patient. For a chili." : 'Not enough sand dollars.'); return; }
    if (free) A.free[id] = true; else addMoney(-def.fee, true, 'Arcade');
    UI.hideDialog();
    const res = await Arcade.start(id, { level });
    await afterArcade(res);
}
/* two players: one of the neighbors here plays you, side by side (6zv_versus.js) */
async function arcadeVersus(id, sp) {
    const def = ARCADE_GAMES[id], who = Versus.rivals('arcade');
    if (!who.length) { await UI.say(sp, sp ? "Nobody's around to play right now. Come back when it's busier! Afternoons are spicy." : 'Nobody is around to play right now.'); return; }
    const how = s => (s >= 0.75 ? 'a whiz' : s >= 0.55 ? 'pretty good' : s >= 0.4 ? 'okay' : 'just learning');
    const j = await UI.ask(sp, 'Who do you want to play?', who.map(w => `${Online.name(w)} (${how(VS_SKILL[w])})`).concat(['Never mind']));
    if (j >= who.length) return;
    if (S.money < def.fee) { Sfx.ui('nope'); await UI.say(sp, 'Not enough sand dollars.'); return; }
    addMoney(-def.fee, true, 'Arcade');
    const res = await versusPlay(id, who[j]);
    await afterArcade(res);
}
async function afterArcade(res) {
    if (!res) return;
    if (res.tickets) UI.toast(`+${res.tickets} ${plural(res.tickets, 'ticket')} \u00b7 ${fmtNum(arc().tickets)} total`, 'ui_ticket');
    const sp = chiliVoice();
    // David's record topped: Chili says so (or a toast), and what it guarded turns up right after (6m_specials.js)
    if (res.record) {
        checkSpecialMilestones();
        if (sp) {
            const c = NPCs.get('chili');
            c.emote = 'sparkle'; c.emoteT = 90;
            await UI.say('chili', rpick(RECORD_LINES));
        } else UI.toast(`You topped David's record at ${ARCADE_GAMES[res.id].name}!`, 'ui_ticket');
    } else if (res.newBest && sp && res.score >= 500) {
        const c = NPCs.get('chili');
        c.emote = 'spicy'; c.emoteT = 70;
        await UI.say('chili', rpick(["NEW HIGH SCORE! I suppose I have to make room for your name now.", "That's a new record. Nice work. I'm writing it down before I talk myself out of it.",
            "High score! Yes, I saw. You can stop looking at me like that. Well played."]));
    }
    Bus.emit('arcade', res);
}
async function clawMachine(home) {
    const A = arc(), sp = home ? null : chiliVoice();
    if (!home && !clawPile(false).length) { await UI.say(sp, sp ? "You cleaned out the claw machine! I'm restocking it tonight. Tomorrow it's full again. Wow." : 'The claw machine is empty! A sign says: "RESTOCKING TONIGHT. WOW."'); return; }
    if (!home) {
        const k = await UI.ask(sp, sp ? `The claw machine! ${fmtNum(CLAW_FEE)} sand dollars a try. Center the claw right over a plushie. It's all in the wrist.`
            : `The claw machine. ${fmtNum(CLAW_FEE)} sand dollars a try. The plushies look a little nervous.`, [`Try it (${fmtNum(CLAW_FEE)})`, 'Not now']);
        if (k !== 0) return;
        if (S.money < CLAW_FEE) { Sfx.ui('nope'); await UI.say(sp, 'Not enough sand dollars.'); return; }
        addMoney(-CLAW_FEE, true, 'Arcade');
        UI.hideDialog();
    }
    const res = await Arcade.start('claw', { home: !!home });
    if (res && res.won && !home) {
        A.won = (A.won || 0) + 1;
        const c = sp && NPCs.get('chili');
        if (c) { c.emote = 'heart'; c.emoteT = 70; await UI.say('chili', rpick(["You got one! Nobody gets one! I'm so proud. I'm also a little worried about the machine.", 'A WINNER! Take good care of that little guy.'])); }
    }
}
async function snackMachine() {
    await UI.say(null, rpick(['A snack machine. Every single bag says HOT CHIPS. Chili stocks it himself.',
        'The snack machine hums. It only sells hot chips. There are eleven flavors of hot.', "Chili's note on the snack machine says: 'THE RED ONES ARE NOT STRAWBERRY.'"]));
}

/* ---------------------------------------------------------------- prizes */
async function prizeDesk() {
    const sp = chiliVoice();
    if (sp) {
        const met = rel('chili').met;
        await talkTo(NPCs.get('chili'));
        if (!met) { await UI.say('chili', "Prize counter. Tickets in, prizes out. No, compliments aren't tickets. I checked. For myself.", { keep: true }); UI.hideDialog(); await prizeCounter(); }
        return;
    }
    await UI.say(null, 'A sign on the empty counter reads: "SELF-SERVE. LEAVE YOUR TICKETS. YES, I COUNT THEM. — CHILI."');
    return prizeCounter();
}
function prizeCounter() {
    return new Promise(res => {
        const draw = () => {
            const A = arc(), sp = chiliVoice();
            const P = UI.open({ title: 'Prize counter', onClose: () => res() });
            const head = el('div', 'detail');
            head.appendChild(iconCanvas('ui_ticket', 48));
            const t = el('div');
            t.appendChild(el('b', null, `${fmtNum(A.tickets)} ${plural(A.tickets, 'ticket')}`));
            t.appendChild(el('span', null, sp ? '"Come for the games. Stay until my high score starts to look possible." — Chili' : 'Win tickets at the cabinets. Home machines play free, but pay no tickets.'));
            head.appendChild(t);
            P.body.appendChild(head);
            const L = el('div', 'list');
            L.style.marginTop = '10px';
            for (const [id, cost] of PRIZES.filter(p => !(FURN[p[0]] && FURN[p[0]].back) || backRoomOpen())) {
                const f = FURN[id];
                const r = el('div', 'row');
                r.appendChild(iconCanvas(ITEMS[id].icon, 40));
                const tt = el('div', 't');
                tt.appendChild(el('b', null, ITEMS[id].name));
                const owned = pocketCount(id) + (S.storage[id] || 0) + S.house.items.filter(i => i.id === id).length;
                tt.appendChild(el('span', null, prizeNote(id) + (owned ? ` \u00b7 you have ${owned}` : '')));
                r.appendChild(tt);
                const b = el('button', 'btn' + (A.tickets >= cost ? ' green' : ' alt'), `${fmtNum(cost)}`);
                b.type = 'button';
                b.setAttribute('aria-label', `Get the ${ITEMS[id].name} for ${cost} tickets`);
                b.prepend(iconCanvas('ui_ticket', 18));
                b.style.cssText = 'display:inline-flex;gap:6px;align-items:center;padding:10px 14px';
                if (A.tickets < cost) b.disabled = true;
                b.addEventListener('click', () => {
                    if (arc().tickets < cost) return;
                    addTickets(-cost, true);
                    if (f.kind === 'top') receive(id, 1, true);
                    else toStorage(id, 1);
                    S.seen[id] = S.seen[id] || Clock.dayNum();
                    Sfx.play('prize');
                    UI.toast(f.kind === 'top' ? `${ITEMS[id].name}! It's in your pocket.` : `${ITEMS[id].name}! Delivered to your house.`, ITEMS[id].icon);
                    const c = sp && NPCs.get('chili');
                    if (c) { c.emote = 'sparkle'; c.emoteT = 60; }
                    draw();
                });
                r.appendChild(b);
                L.appendChild(r);
            }
            P.body.appendChild(L);
        };
        draw();
    });
}
function prizeNote(id) {
    const f = FURN[id];
    if (f.arcade === 'claw') return 'A claw machine for your house. Free to play. You always win. (It\'s your plushie already.)';
    if (f.arcade) return `Play ${ARCADE_GAMES[f.arcade].name} at home, free.`;
    if (id.startsWith('plush_')) return 'Soft. Tabletop. Very huggable.';
    if (id === 'trophy_arcade') return 'The big one. Chili will be SO jealous.';
    return { arcade_stool: 'A bright pink stool.', neon_game: 'Glows at night.', hiscore_board: 'Shows your best scores.', snack_machine: 'Hot chips only.' }[id] || '';
}
/* ---------------------------------------------------------------- high scores */
/* the island's records: DAVID's, on every game, each just under what that game unlocks (David, 29 October: "when you
   get a high score you get an unlock"), so topping one is what earns its special; where a game unlocks more than one
   thing, under the first a player gets to. Where the unlock is a level reached (Spice Capsules, Snack Stack), it's the
   score a player has just short of that level, and topping it unlocks the special as well as the level does
   (checkSpecialMilestones). Fixed, never saved: only Sarah's best and the rivals change. [score, note, special] */
const ARCADE_RECORD = {
    blocks: [49999, 'on skates. one point shy', 'hair_spacebuns'],          // 50,000 (level 12's dance comes later)
    capsules: [61840, 'one bug short of level 10', 'hair_mohawk'],          // level 10 (bugs 100, a bottle 1,000 x its level)
    stack: [5850, 'two pumpkins. no watermelon', 'recipe_shortcake'],       // a watermelon
    dumpling: [11999, 'left the last dumpling for you', 'hair_afro'],       // 12,000
    sushi: [3999, 'one point shy. on purpose?', 'acc_tiara'],               // 4,000
    fortune: [49990, 'one peg short, he says', 'emote_star'],              // 50,000 (points come in tens)
    fruit: [3995, 'let the last apple drop', 'acc_catears'],                // 4,000 (in fives)
    garden: [7998, 'spared the last gopher', 'acc_wizardhat'],              // 8,000 (in twos)
    surf: [2499, 'did a spin, somehow', 'sew_cape'],                        // 2,500
    noodle: [1995, 'one bite short', 'hair_mullet'],                        // 2,000 (in fives)
};
function beatsRecord(id, score) { const r = ARCADE_RECORD[id]; return !!r && score > r[0]; }
const RECORD_LINES = ["WAIT. You topped David? Nobody tops David. He always stops just short of something good. Looks like you found out what.",
    "That was David's record. WAS. I'm changing the board. I'm not even mad. I'm a little mad.",
    "You beat David! He told me nobody would. Then he said, '{name} might.' I hate it when he's right."];
/* the neighbors' records, under David's (a neighbor's best can be topped by Sarah, and now and then one tops hers back) */
const HISCORE_RIVALS = {
    blocks: [['CHILI', 12400, 'too hot to stop'], ['MAKI', 9100, 'every block exactly aligned'], ['GINGER', 6800, 'built a little house, then cleared it'],
        ['JOE', 5200, 'wrote a poem about the long piece'], ['CECE', 3900, 'apologized to every row']],
    capsules: [['CUKE', 8800, 'played at 5 AM'], ['CHILI', 7400, 'spared every chili bug'], ['COCO', 6200, 'told everyone'],
        ['BRULEE', 4500, 'kept the prettiest colors'], ['KAI', 3100, 'says he was "vibing"']],
    fruit: [['SULLY', 2600, 'set in 1987, in pencil'], ['CUKE', 2200, 'lunges between catches'], ['KAI', 1900, 'surf stance'],
        ['CECE', 1450, 'apologized to every fruit'], ['WONTON', 900, 'from the spring. somehow.']],
    stack: [['MAC', 2600, 'made a poke bowl, got hungry'], ['MAKI', 2200, 'dropped them in order. by size'], ['BRULEE', 1800, 'arranged every snack by color'],
        ['CUKE', 1200, 'only stacked edamame'], ['WONTON', 950, 'never squished a dumpling']],
};
/* a game's whole table, best first: David, the neighbors (a rival's topped score in place of theirs), the old one-page
   game's score as 2D SARAH (S.arcade.legacy: it ranks, but never counts as her best or unlocks anything) and Sarah's
   best (below anyone she only ties) */
function hiScoreRows(id) {
    const A = arc(), rows = [], rec = ARCADE_RECORD[id];
    if (rec) rows.push({ n: 'DAVID', s: rec[0], note: rec[1], rec: true });
    for (const [n, s, note] of HISCORE_RIVALS[id] || []) rows.push({ n, s, note });
    const rv = A.rival[id];
    if (rv) { const o = rows.find(q => q.n === rv.who && !q.rec); if (o) { o.s = Math.max(o.s, rv.score); o.note = rv.beatenDay ? 'beaten by you!' : 'topped your score!'; } }
    const old = Math.floor(+((A.legacy || {})[id]) || 0);
    if (old > 0) rows.push({ n: '2D SARAH', s: old, note: 'from the old one-page game', old: true });
    if (A.best[id]) rows.push({ n: (S.playerName || 'SARAH').toUpperCase(), s: A.best[id], note: 'you!', me: true });
    rows.sort((a, b) => b.s - a.s || (a.me ? 1 : 0) - (b.me ? 1 : 0));
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
}
/* the top five (and Sarah's own row under them when she isn't in it): the wall's board and the cabinet's menu */
function hiScoreList(id) {
    const rows = hiScoreRows(id), me = rows.find(r => r.me), L = el('div', 'list hs-list');
    L.dataset.game = id;
    const row = r => {
        const d = el('div', 'row hs-row' + (r.me ? ' me' : r.rec ? ' rec' : r.old ? ' old' : ''));
        d.dataset.who = r.me ? 'me' : r.old ? 'old' : r.n.toLowerCase();
        d.appendChild(el('div', 'hs-rank', String(r.rank)));
        const t = el('div', 't');
        t.appendChild(el('b', null, r.n));
        t.appendChild(el('span', null, r.note));
        d.appendChild(t);
        d.appendChild(el('div', 'price', fmtNum(r.s)));
        L.appendChild(d);
    };
    rows.slice(0, 5).forEach(row);
    if (me && me.rank > 5) { L.appendChild(el('div', 'hs-gap', '⋮')); row(me); }
    return L;
}
async function showHiScores() {
    const A = arc();
    const P = UI.open({ title: 'High scores' });
    for (const id of arcadeCabs()) {
        P.body.appendChild(el('h3', 'ar-hs', ARCADE_GAMES[id].name));
        P.body.appendChild(hiScoreList(id));
    }
    P.body.appendChild(el('p', 'muted', `Every record starts out as David's. Top one and something special turns up. Tickets: ${fmtNum(A.tickets)}. Games played: ${fmtNum(Object.values(A.plays).reduce((a, b) => a + b, 0))}.`));
}
/* one game's, from its cabinet's menu (closing it goes back to the menu) */
function gameHiScores(id) {
    return new Promise(res => {
        const P = UI.open({ title: `${ARCADE_GAMES[id].name}: high scores`, back: () => UI.close(), foot: true, onClose: () => res() });
        P.body.appendChild(hiScoreList(id));
        P.foot.appendChild(btn('Back', 'alt', () => UI.close()));
    });
}
/* now and then somebody Sarah has passed tops her best (and brags about it); while David's record still stands over
   hers, theirs stays under his */
function arcadeRivals() {
    const A = arc(), day = Clock.dayNum(), r = mulberry(hash32(S.seed + ':rival:' + day));
    for (const g of Object.keys(HISCORE_RIVALS)) {
        const best = A.best[g] || 0, cur = A.rival[g];
        if (!best || (cur && !cur.beatenDay && day - cur.day < 3) || !arcadeCabs().includes(g)) continue;
        if (r() > 0.14) continue;
        const passed = HISCORE_RIVALS[g].filter(q => q[1] < best);
        if (!passed.length) continue;
        const who = rpick(passed, r)[0];
        let score = Math.ceil((best * (1.04 + r() * 0.12)) / 50) * 50;
        if (ARCADE_RECORD[g] && !beatsRecord(g, best)) score = Math.min(score, Math.floor(ARCADE_RECORD[g][0] / 50) * 50);
        if (score <= best) continue;
        A.rival[g] = { who, score, day, beatenDay: null };
    }
}
/* machines at home: free play */
async function homeArcade(d) {
    if (d.arcade === 'claw') return clawMachine(true);
    const res = await Arcade.start(d.arcade, { home: true });
    if (res && res.record) UI.toast(`You topped David's record at ${ARCADE_GAMES[d.arcade].name}: ${fmtNum(res.score)}!`, 'ui_ticket');
    else if (res && res.newBest) UI.toast(`New best at ${ARCADE_GAMES[d.arcade].name}: ${fmtNum(res.score)}!`, 'ui_ticket');
}

/* ---------------------------------------------------------------- the claw machine (a game like the others) */
const CLAW_FLOOR = 128, CLAW_TOP = 22, CHUTE_X = 20;
function clawPile(home) {
    const A = arc(), day = Clock.dayNum();
    if (!home && A.claw && A.claw.day === day) return A.claw.pile;
    const r = mulberry(hash32(S.seed + ':claw:' + (home ? 'home' + R() : day)));
    const kinds = shuffled(PRIZES.filter(p => p[0].startsWith('plush_')).map(p => p[0].slice(6)), r);
    const pile = [];
    [48, 66, 84, 102, 120].forEach((x, i) => pile.push({ id: kinds[i % kinds.length], x: x + rint(-2, 2, r), layer: 0 }));
    [57, 93].forEach((x, i) => pile.push({ id: kinds[(5 + i) % kinds.length], x: x + rint(-3, 3, r), layer: 1 }));
    if (!home) A.claw = { day, pile };
    return pile;
}
function ClawGame(opts) {
    this.home = !!opts.home;
    this.pile = clawPile(this.home).map(p => Object.assign({}, p));
    this.x = 34; this.y = 0; this.open = 1; this.phase = 'aim'; this.timer = 15 * 60; this.score = 0; this.over = false;
    this.carry = null; this.won = null; this.fx = [];
}
ClawGame.prototype = {
    top(p) { return CLAW_FLOOR - 15 - p.layer * 9; },           // top of a plushie's head
    under() {
        let best = null;
        for (const p of this.pile) if (Math.abs(p.x - this.x) <= 9 && (!best || this.top(p) < this.top(best))) best = p;
        return best;
    },
    update(inp) {
        const h = inp.held;
        this.stepFx();
        if (this.phase === 'aim') {
            const dx = (h.right ? 1 : 0) - (h.left ? 1 : 0);
            if (dx) { this.x = clamp(this.x + dx * 0.9, 30, 126); if (G.frame % 8 === 0) Sfx.play('claw'); }
            if (--this.timer <= 0 || inp.pressed.drop) { this.phase = 'down'; Sfx.play('drop'); }
            return;
        }
        if (this.phase === 'down') {
            const t = this.under();
            const stop = t ? this.top(t) - 2 : CLAW_FLOOR - 4;
            this.y += 1.1;
            if (G.frame % 10 === 0) Sfx.play('claw');
            if (CLAW_TOP + this.y + 10 >= stop) { this.phase = 'close'; this.k = 0; this.target = t; }
            return;
        }
        if (this.phase === 'close') {
            this.open = Math.max(0, this.open - 0.06);
            if (this.open > 0) return;
            const t = this.target;
            Sfx.play('grab');
            if (t) {
                const off = Math.abs(t.x - this.x);
                let p = off <= 2 ? 0.88 : off <= 4 ? 0.66 : off <= 7 ? 0.38 : 0.08;
                if (this.home) p = Math.min(0.95, p + 0.15);
                if (R() < p) { this.carry = t; this.pile = this.pile.filter(q => q !== t); this.settle(); this.slip = R() < (this.home ? 0.05 : 0.14) ? 20 + R() * 30 : -1; }
            }
            this.phase = 'up';
            return;
        }
        if (this.phase === 'up') {
            this.y = Math.max(0, this.y - 0.9);
            if (this.carry && this.slip > 0 && this.y < this.slip) this.drop('slip');
            if (this.y <= 0) this.phase = 'home';
            return;
        }
        if (this.phase === 'home') {
            this.x = Math.max(CHUTE_X, this.x - 1);
            if (G.frame % 8 === 0) Sfx.play('claw');
            if (this.x <= CHUTE_X) { this.phase = 'release'; this.k = 0; }
            return;
        }
        if (this.phase === 'release') {
            this.open = Math.min(1, this.open + 0.08);
            if (this.carry && this.open > 0.5) this.drop('chute');
            if (++this.k > 50) { this.over = true; this.score = this.won ? 1 : 0; }
        }
    },
    drop(where) {
        const p = this.carry;
        this.carry = null;
        if (where === 'chute') {
            this.fx.push({ id: p.id, x: CHUTE_X, y: CLAW_TOP + 20, vy: 0.5, chute: true });
            this.won = 'plush_' + p.id;
            if (!this.home) {                          // (at home it's your machine: the plushie goes back in for next time)
                receive(this.won, 1, true);
                const A = arc();
                if (A.claw) A.claw.pile = A.claw.pile.filter(q => !(q.id === p.id && Math.abs(q.x - p.x) < 1));
                if (A.claw) A.claw.pile.forEach(q => { if (q.layer && !A.claw.pile.some(o => !o.layer && Math.abs(o.x - q.x) <= 12)) q.layer = 0; });
                S.seen[this.won] = S.seen[this.won] || Clock.dayNum();
            }
            Save.touch();
        } else {
            // it slipped: it tumbles back onto the pile
            if (p.layer && !this.pile.some(o => !o.layer && Math.abs(o.x - p.x) <= 12)) p.layer = 0;
            this.fx.push({ id: p.id, x: p.x, y: CLAW_TOP + this.y + 20, vy: 0, land: p });
            Sfx.play('ouch');
        }
    },
    /* a plushie that was resting on the one you took drops to the floor */
    settle() { for (const q of this.pile) if (q.layer && !this.pile.some(o => !o.layer && Math.abs(o.x - q.x) <= 12)) q.layer = 0; },
    after() { this.stepFx(); },
    stepFx() {
        for (const f of this.fx) {
            f.vy += 0.25; f.y += f.vy;
            if (f.land && f.y >= this.top(f.land) + 15) { f.done = true; this.pile.push(f.land); }
            if (f.chute && f.y > ARCADE_H + 20) f.done = true;
        }
        this.fx = this.fx.filter(f => !f.done);
    },
    draw(g, t) {
        // cabinet interior
        g.fillStyle = '#2a1840'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        const grd = g.createLinearGradient(0, 14, 0, CLAW_FLOOR);
        grd.addColorStop(0, '#ffd6ec'); grd.addColorStop(1, '#f6a6d2');
        g.fillStyle = grd; g.fillRect(6, 14, ARCADE_W - 12, CLAW_FLOOR - 14);
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(10 + i * 22, 20, 8, CLAW_FLOOR - 26); }
        // the prize chute
        g.fillStyle = '#3a2455'; g.fillRect(8, CLAW_FLOOR - 26, 26, 26);
        g.fillStyle = '#b37cf0'; g.fillRect(8, CLAW_FLOOR - 28, 26, 3); g.fillRect(33, CLAW_FLOOR - 28, 2, 28);
        pxText(g, 'PRIZE', 21, CLAW_FLOOR - 20, '#ffd84a', 1, 'center');
        // plushies (back row first)
        const pile = this.pile.slice().sort((a, b) => a.layer - b.layer);
        for (const p of pile) spr(g, 'f_plush_' + p.id, p.x, CLAW_FLOOR - p.layer * 9);
        for (const f of this.fx) spr(g, 'f_plush_' + f.id, f.x, f.y);
        // rail + claw
        g.fillStyle = '#8a96a8'; g.fillRect(6, 14, ARCADE_W - 12, 3);
        const cx = Math.round(this.x), cy = CLAW_TOP + Math.round(this.y);
        g.fillStyle = '#6b7385'; g.fillRect(cx - 4, 15, 9, 4);
        g.fillStyle = '#c8d0e0'; g.fillRect(cx, 18, 1, cy - 18);
        g.fillStyle = '#8a96a8'; g.fillRect(cx - 3, cy, 7, 4);
        g.fillStyle = '#e0405a'; g.fillRect(cx - 1, cy + 1, 3, 2);
        if (this.carry) spr(g, 'f_plush_' + this.carry.id, cx, cy + 20);
        const o = Math.round(this.open * 4);
        g.fillStyle = '#c8d0e0';
        for (let i = 0; i < 7; i++) {
            g.fillRect(cx - 3 - Math.round(o * i / 7), cy + 4 + i, 1, 1);
            g.fillRect(cx + 3 + Math.round(o * i / 7), cy + 4 + i, 1, 1);
        }
        g.fillRect(cx - 3 - o + 1, cy + 11, 2, 1); g.fillRect(cx + 3 + o - 2, cy + 11, 2, 1);
        // glass glare + frame
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(100, 18, 4, 100); g.fillRect(108, 18, 2, 100);
        g.fillStyle = '#b37cf0'; g.fillRect(0, 0, ARCADE_W, 12); g.fillRect(0, CLAW_FLOOR, ARCADE_W, ARCADE_H - CLAW_FLOOR);
        g.fillRect(0, 0, 6, ARCADE_H); g.fillRect(ARCADE_W - 6, 0, 6, ARCADE_H);
        pxShadow(g, this.home ? 'CLAW  (HOME)' : 'CLAW MACHINE', ARCADE_W / 2, 3, '#ffffff', 1, 'center', '#6b4ac9');
        if (this.phase === 'aim') {
            pxShadow(g, 'TIME ' + Math.ceil(this.timer / 60), 10, CLAW_FLOOR + 6, '#ffd84a', 1);
            pxShadow(g, 'MOVE, THEN DROP', ARCADE_W - 10, CLAW_FLOOR + 6, '#ffffff', 1, 'right');
            // a little shadow shows where the claw will land
            g.fillStyle = 'rgba(80,20,80,0.35)'; g.fillRect(cx - 4, CLAW_FLOOR - 1, 9, 2);
        } else if (this.won) pxShadow(g, 'YOU WON!', ARCADE_W / 2, CLAW_FLOOR + 8, '#ffd84a', 2, 'center');
        else if (this.phase === 'release' && !this.won) pxShadow(g, 'SO CLOSE!', ARCADE_W / 2, CLAW_FLOOR + 8, '#ffffff', 2, 'center');
    },
};
ARCADE_GAMES.claw = {
    name: 'Claw machine', fee: CLAW_FEE, tune: null, glow: '#b37cf0', scored: false, againLabel: 'Try again',
    help: 'Arrows move the claw \u00b7 Space drops it',
    how: 'Move the claw over a plushie, then drop it. Right over the middle works best. Sometimes they slip. That is the claw machine way.',
    buttons: [
        { k: 'left', label: '\u25c0', keys: ['ArrowLeft', 'KeyA'], side: 'L', aria: 'Move left' },
        { k: 'right', label: '\u25b6', keys: ['ArrowRight', 'KeyD'], side: 'L', aria: 'Move right' },
        { k: 'drop', label: 'DROP', keys: ['Space', 'Enter', 'KeyE', 'KeyX', 'ArrowDown', 'KeyS'], side: 'R', wide: true, aria: 'Drop the claw' },
    ],
    create(opts) { return new ClawGame(opts); },
    canPlay(opts) { return !!opts.home || clawPile(false).length > 0; },
    result(g, opts) {
        if (g.won) return { title: 'You won!', lines: [opts.home ? `The ${itemName(g.won)} goes right back in. It's your machine. Everybody wins.` : `A ${itemName(g.won)}! It's in your pocket.`], icon: ITEMS[g.won].icon };
        return { title: 'So close!', lines: [rpick(['It slipped. They always slip. That is how they get you.', 'The claw grabbed a whole lot of air.', 'The plushie tips back into the pile. Its stitched smile is unhelpful.'])] };
    },
};

