/* ---- 2c_builder.js ---- */
/* Ginger's workshop: making Sarah's house bigger, redoing the outside of any house on the island (paint, roof,
   door, a mailbox, flower boxes...), and what the neighbors think when they find their house redone. */
const WORK_MENUS = {};          // neighbors with a job: talking to them at work adds their menu (each place fills this in)
const AREA_TALK = {};           // things people say while they're somewhere in particular (the museum, the restaurant)
const EXT_PRICE = 1500;
const HOUSE_EXPAND = [20000, 60000, 150000, 300000];

ROOMS.builder = { w: 11, h: 6, wall: 'wall_workshop', floor: 'floor_workshop', music: 'workshop', name: "Ginger's Workshop", staff: 'ginger',
    staffAt: [5, 0], guest: [5, 3, 2], build: a => buildBuilderRoom(a),
    closedSign: "GINGER'S WORKSHOP. Open {hours:builder}. \"Houses made bigger. Roofs made redder. Mailboxes made.\"" };
function buildBuilderRoom(a) {
    const items = layoutItems([
        ['sign_builder', 1, 'wall'], ['window_wall', 3, 'wall'], ['pegboard', 5, 'wall'], ['swatch_board', 8, 'wall'], ['clock_wall', 10, 'wall'],
        ['paint_shelf', 0, 1], ['workbench', 4, 1], ['toolbox', 4, 1], ['house_model', 5, 1], ['blueprint_table', 7, 1], ['paint_cans', 10, 1],
        ['lumber_stack', 0, 4], ['sawhorse', 9, 4], ['plant_monstera', 10, 5], ['rug_round', 4, 3]]);
    const use = {
        workbench: 'counter',
        blueprint_table: () => gingerVoice() ? talkTo(NPCs.get('ginger')) : UI.say(null, "Blueprints for a porch. It's always a porch."),
        swatch_board: () => UI.say(null, 'Paint chips. Sarah picks a favorite. Then a second favorite. Then the first one again.'),
        paint_shelf: () => UI.say(null, 'Every color of paint on the island. There is a whole shelf of oranges. Clementine.'),
        lumber_stack: () => UI.say(null, 'A neat stack of lumber. Sarah counts the rings on one board. She loses count at thirty.'),
        house_model: () => UI.say(null, "A tiny model of a house. Ginger makes one before every job 'for reference.' It's adorable."),
        sawhorse: () => UI.say(null, 'A sawhorse. It is not a horse. Cuke was very disappointed.'),
    };
    items.forEach(it => { if (use[it.id]) it.use = use[it.id]; });
    a.items = items;
    placeFurniture(a, items);
}
function gingerVoice() { const g = NPCs.get('ginger'); return g && !g.sleeping && g.area === 'builder' ? 'ginger' : null; }

/* first time in: Ginger explains what she does */
Bus.on('enter', async id => {
    if (id !== 'builder' || S.flags.builderTour || !gingerVoice()) return;
    S.flags.builderTour = true;
    G.busy++;
    await waitFrames(20);
    await UI.say('ginger', ["Welcome to the workshop! Hard hats optional. Mine is not optional. Mine is part of me.",
        "Here's what I do: I make houses bigger. I repaint walls, swap roofs, add mailboxes, flower boxes, chimneys, the works.",
        `Your house or anybody's. Want to surprise a neighbor? I'll redo their place too. ${fmtNum(EXT_PRICE)} sand dollars a job, any changes you like.`,
        'Just talk to me at the bench whenever you want something built.']);
    G.busy--;
});

WORK_MENUS.ginger = { room: 'builder', label: 'Building stuff', fn: () => builderMenu() };
async function builderMenu() {
    for (;;) {
        const lvl = S.house.level;
        const opts = [lvl < HOUSE_EXPAND.length ? 'Make my house bigger' : null, "Redo my house's outside", "Fix up a neighbor's house",
            pendingMove() ? `The move (${bldName(pendingMove().id)})` : 'Move a building', 'Lay some paths', 'Never mind'].filter(Boolean);
        const g = gingerVoice();
        const k = await UI.ask(g, g ? rpick(['What are we building today?', 'Hard hat on! What do you need?', "Measure twice, build once. What'll it be?"])
            : "Ginger's order clipboard. What should the crew build? (The crew works overnight either way.)", opts, { keep: true });
        const c = opts[k];
        if (c === 'Make my house bigger') { await houseExpand(); continue; }
        if (c === "Redo my house's outside") { UI.hideDialog(); if (await redoHouse('home')) return; continue; }
        if (c === "Fix up a neighbor's house") { UI.hideDialog(); const hid = await pickNeighborHouse(); if (hid && await redoHouse(hid)) return; continue; }
        if (c === 'Move a building' || (c && c.startsWith('The move ('))) { if (await moveBuildingFlow()) return; continue; }
        if (c === 'Lay some paths') {
            await UI.say(g, S.flags.pathKit ? (g ? 'Out you go! Paths anywhere you like. The Paths app on your phone works too.' : 'Sarah grabs the path kit. (The Paths app on the phone works too.)')
                : g ? ["Paths! I'll lend you the crew's path kit. Dirt, stones, brick or wood planks, anywhere on the island.", "Just not under trees or buildings. And it's on the house. Paths are for everybody.", 'You can also lay paths any time from the Paths app on your phone.']
                    : ['A note on the path kit: "Borrow me! Dirt, stones, brick or wood planks, anywhere on the island. Not under trees or buildings. Free! - G"', 'You can also lay paths any time from the Paths app on your phone.']);
            S.flags.pathKit = true;
            UI.hideDialog();
            const from = G.area.id;
            if (from !== 'island') { await leaveInterior(); }
            PathTool.open();
            return;
        }
        await UI.say(g, g ? rpick(['Okay! Come back anytime. The hard hat is always on.', 'See you! Mind the sawdust on the way out.']) : 'Sarah clips the pen back onto the clipboard.');
        return;
    }
}

/* ---------------------------------------------------------------- a bigger house */
async function houseExpand() {
    const lvl = S.house.level, cost = HOUSE_EXPAND[lvl];
    const [fw, fh] = HOUSE_SIZES[lvl + 1];
    const what = ['a bigger room, plus a little attic window', 'a whole second floor. Two stories! Very fancy', 'even more room, and a new attic window on top',
        'the biggest house on the island. And a porch. Finally, a porch'][lvl];
    // (with the Bank open, the crew can build first and the Bank waits for the money: 6ze_bank.js)
    const loan = typeof bankLoanOk === 'function' && bankLoanOk();
    const k = await UI.ask('ginger', `Next up for your place: ${what}. The inside gets to ${fw} by ${fh}. ${fmtNum(cost)} sand dollars. Deal?`,
        loan ? [`Build it (${fmtNum(cost)})`, 'Build it, pay later', 'Not yet'] : [`Build it (${fmtNum(cost)})`, 'Not yet']);
    if (loan && k === 1) {
        await UI.say('ginger', "Build now, pay later! The Bank covers it and you pay them back whenever. No interest. Pay at the teller's window.", { keep: true });
        bankLend(['the bigger room', 'the second floor', 'the bigger second floor', 'the biggest house and its porch'][lvl], cost);
    } else {
        if (k !== 0) return;
        if (S.money < cost) { await UI.say('ginger', "Hmm, you're a little short. Fish, fruit and shells add up fast! Moonfish at night sell for a lot." + (loan ? ' Or build it now and pay the Bank later.' : '')); return; }
        addMoney(-cost, true, 'House');
    }
    S.house.level++;
    if (G.areas.home) G.areas.home.stale = true;
    await constructionTime();
    applyExteriors(G.areas.island);
    Sfx.play('fanfare');
    Save.touch();
    await UI.say('ginger', lvl === 3 ? "Done! Biggest house on the island. And the porch! Look at that porch. I'm not crying. It's sawdust." : "Done! Bigger inside, and it looks great outside too. Your furniture's right where you left it.");
    await offerLook('home');
}
/* Ginger's crew works fast: hammering in the dark */
async function constructionTime() {
    UI.hideDialog();
    await fadeTo(async () => {
        UI.toast("Ginger's crew gets to work...", 'f_toolbox');
        for (let i = 0; i < 4; i++) { Sfx.play('knock'); await waitFrames(14); }
        Sfx.play('dig');
        await waitFrames(24);
    });
}
async function offerLook(id) {
    const k = await UI.ask(gingerVoice(), rpick(['Want to go see it?', 'Go take a look?']), ['Take me there!', 'Later']);
    if (k !== 0) return;
    const b = W0.buildings[id], a = G.areas.island;
    const [fx, fy] = a.nearestFree(b.x + b.door, b.y + b.h + 2, 4);
    const from = G.area.id;
    Sfx.play('door');
    await fadeTo(async () => { setArea('island', (fx + 0.5) * TILE, (fy + 0.6) * TILE, 'up'); });
    Bus.emit('leave', from);
}

/* ---------------------------------------------------------------- redoing a house */
async function redoHouse(id) {
    const owner = id === 'home' ? null : id.slice(2);
    const L = await ExtEditor.run(id);
    if (!L) return false;
    const diff = lookDiff(id, L);
    const before = JSON.stringify(exteriors()[id] || {});
    if (JSON.stringify(diff) === before) { await UI.say(gingerVoice(), "That's exactly how it looks now! No charge. I'm very fair."); return false; }
    if (S.money < EXT_PRICE) { await UI.say(gingerVoice(), `That's ${fmtNum(EXT_PRICE)} for the job, and you're a little short. Come back after some fishing!`); return false; }
    addMoney(-EXT_PRICE, true, 'House');
    if (Object.keys(diff).length) exteriors()[id] = diff; else delete exteriors()[id];
    await constructionTime();
    applyExteriors(G.areas.island);
    Sfx.play('fanfare');
    S.stats.houseJobs = (S.stats.houseJobs || 0) + 1;
    if (owner) rel(owner).houseNews = { day: Clock.dayNum(), restored: !Object.keys(diff).length };
    else S.flags.homeRedoDay = Clock.dayNum();
    Save.touch();
    await UI.say(gingerVoice(), owner ? `All done! ${NPC_DEFS[owner].name} is going to be so surprised. In a good way. Probably.` : 'All done! Your house looks great. I would know. I built it.');
    await offerLook(id);
    return true;
}
function pickNeighborHouse() {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: "Whose house?", onClose: () => finish(null) });
        P.body.appendChild(el('p', 'muted', `Ginger will redo any neighbor's house for ${fmtNum(EXT_PRICE)}. They'll notice.`));
        const list = el('div', 'list');
        for (const hid of HOUSE_IDS) {
            if (hid === 'home' || !W0.buildings[hid]) continue;
            const owner = hid.slice(2), d = NPC_DEFS[owner];
            if (!d) continue;
            const met = S.npcs[owner] && S.npcs[owner].met;
            const r = el('button', 'row');
            r.type = 'button';
            r.appendChild(iconCanvas(d.sprite ? d.sprite + '_0' : d.human + '_down_stand', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, `${d.name}'s house`));
            t.appendChild(el('span', null, !met ? "You haven't met yet" : houseCustom(hid) ? 'Redone by Ginger' : 'The original look'));
            r.appendChild(t);
            if (!met) r.disabled = true;
            else r.addEventListener('click', () => { finish(hid); UI.close(true); });
            list.appendChild(r);
        }
        P.body.appendChild(list);
    });
}

/* the editor: a live picture of the house on the left, paint and extras on the right */
const HOUSE_TIPS = { maki: 'dark greens and navy. Nothing fussy', kai: 'ocean blues and sandy colors', basil: 'greens, like fresh herbs',
    chili: 'reds. Hot reds. Only reds', coco: 'pink and chocolate brown', cece: 'soft pinks and buttery yellows', clementine: 'orange. Obviously orange',
    cuke: 'bright, fresh greens', sully: 'crimson and brick. Very Boston', david: 'rainbow. Or pink. Or purple. Mostly rainbow', joe: 'calm blues and grays',
    ginger: 'gingerbread browns and brick', brulee: 'caramel, gold and cream', mac: 'cheddar yellow and a nice bowl blue' };
const ExtEditor = {
    run(id) { return visitorStop('build') ? Promise.resolve(null) : new Promise(res => this.start(id, res)); },
    start(id, res) {
        this.id = id; this.res = res;
        this.L = houseLook(id);
        this.saved = Object.assign({}, this.L);
        this.tab = 'walls';
        const owner = id === 'home' ? null : id.slice(2);
        const tip = owner && HOUSE_TIPS[owner] ? ` Ginger's tip: ${NPC_DEFS[owner].name} likes ${HOUSE_TIPS[owner]}.` : '';
        const U = Studio.open(owner ? `${NPC_DEFS[owner].name}'s house` : "Sarah's house", `Pick paint, a roof and extras. The whole job is ${fmtNum(EXT_PRICE)}.${tip}`);
        this.U = U;
        const cv = el('canvas', 'st-canvas');
        cv.width = 108; cv.height = 100;
        cv.style.cursor = 'default';
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        Studio.onResize = fitCanvas(cv, U.box, cv.width, cv.height);
        U.x.addEventListener('click', () => this.finish(null));
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(null); };
        this.tools();
        this.draw();
    },
    finish(L) {
        Studio.close();
        const r = this.res;
        this.res = null;
        if (r) r(L);
    },
    set(k, v, name) {
        this.L[k] = v;
        if (['wall', 'roof', 'door', 'trim'].includes(k)) { if (name) this.L[k + 'Name'] = name; else delete this.L[k + 'Name']; }
        this.tools(); this.draw();
    },
    draw() {
        const g = this.ctx, W = this.cv.width, H = this.cv.height, L = this.L;
        g.fillStyle = '#cdeefc'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#e8f7ff'; g.fillRect(8, 10, 22, 5); g.fillRect(13, 7, 11, 3); g.fillRect(74, 18, 20, 4); g.fillRect(79, 15, 9, 3);
        g.fillStyle = '#8fd46f'; g.fillRect(0, H - 20, W, 20);
        g.fillStyle = '#7cc65f';
        for (let x = 1; x < W; x += 6) g.fillRect(x, H - 18 + (x * 7) % 15, 2, 1);
        const s = drawHouse(L);
        const hx = Math.round(W / 2 - s.w / 2), hy = H - 14 - s.h + 3;
        const doorX = hx + (L.doorX != null ? L.doorX : Math.floor(s.w / 2));
        g.fillStyle = '#e8d2a0'; g.fillRect(doorX - 5, H - 15, 10, 15);
        g.drawImage(s.canvas(), hx, hy);
        if (L.mailbox) spr(g, 'mailbox', this.id === 'home' ? hx + s.w + 6 : hx - 7, H - 6);
    },
    tools() {
        const U = this.U, L = this.L;
        U.tools.innerHTML = '';
        const tabs = el('div', 'st-row');
        for (const [k, label] of [['walls', 'Walls'], ['roof', 'Roof'], ['door', 'Door & trim'], ['extras', 'Extras']]) {
            tabs.appendChild(chip(label, () => { this.tab = k; this.tools(); }, this.tab === k ? 'on' : ''));
        }
        U.tools.appendChild(tabs);
        const foot = el('div', 'st-row');
        const short = innerHeight < 520;          // phones on their side: the buttons go up top
        if (short) U.tools.appendChild(foot);
        const swatches = (label, list, key) => {
            U.tools.appendChild(stLabel(label));
            const sw = el('div', 'swatches');
            for (const c of list) {
                const b = el('button', 'swatch' + (L[key] === c ? ' on' : ''));
                b.type = 'button';
                b.title = c === 'rainbow' ? 'Rainbow' : c;
                b.setAttribute('aria-label', c === 'rainbow' ? 'Rainbow' : `Color ${c}`);
                b.style.background = c === 'rainbow' ? `linear-gradient(180deg, ${RAINBOW.join(', ')})` : c;
                b.addEventListener('click', () => { Sfx.ui('tick'); this.set(key, c); });
                sw.appendChild(b);
            }
            // Sarah's own colors, and a "+" to make one
            mySwatches(sw, c => L[key] === c.hex && L[key + 'Name'] === c.name, c => this.set(key, c.hex, c.name),
                () => colorForm(U, { start: L[key] && L[key][0] === '#' ? L[key] : null, done: c => { if (c) this.set(key, c.hex, c.name); else { this.tools(); this.draw(); } } }));
            U.tools.appendChild(sw);
            if (L[key + 'Name']) editMine(U, myColors().find(c => c.hex === L[key] && c.name === L[key + 'Name']), () => { this.tools(); this.draw(); });
        };
        const choices = (label, list, key) => {
            U.tools.appendChild(stLabel(label));
            const row = el('div', 'st-row');
            for (const [v, name] of list) row.appendChild(chip(name, () => this.set(key, v), (L[key] || list[0][0]) === v ? 'on' : ''));
            U.tools.appendChild(row);
        };
        if (this.tab === 'walls') { swatches('Paint', EXT_WALLS, 'wall'); choices('Pattern', EXT_PATTERNS, 'pattern'); }
        else if (this.tab === 'roof') { swatches('Roof color', EXT_ROOFS, 'roof'); choices('Roof style', EXT_STYLES, 'style'); }
        else if (this.tab === 'door') { swatches('Door', EXT_DOORS, 'door'); swatches('Trim', EXT_TRIMS, 'trim'); }
        else {
            U.tools.appendChild(stLabel('Extras (tap to add or remove)'));
            const row = el('div', 'st-row');
            for (const [k, name] of EXT_ADDONS) row.appendChild(chip((L[k] ? '\u2713 ' : '') + name, () => this.set(k, L[k] ? 0 : 1), L[k] ? 'on' : ''));
            U.tools.appendChild(row);
            if (this.id === 'home') U.tools.appendChild(el('div', 'st-sub', 'No mailbox? Your letters still show up in the Mail app on your phone.'));
        }
        if (!short) { foot.style.marginTop = '8px'; U.tools.appendChild(foot); }
        foot.appendChild(chip('Original look', () => { this.L = houseLook(this.id, null, true); this.tools(); this.draw(); }));
        foot.appendChild(chip('Undo changes', () => { this.L = Object.assign({}, this.saved); this.tools(); this.draw(); }));
        foot.appendChild(chip(`Build it! (${fmtNum(EXT_PRICE)})`, () => this.finish(this.L), short ? 'go' : 'go big'));
    },
};

/* ---------------------------------------------------------------- what the neighbors think */
const HOUSE_TASTE = {
    maki: ['#34473e', '#2c3e66', '#fbf6ee', '#4a4450'], kai: ['#4f86c6', '#3a8a8a', '#d4ebf7', '#e9d3a8', '#caa55f'],
    basil: ['#4a9a52', '#dcf2e6', '#c9dbb8', '#3f8f45', '#5aa844'], chili: ['#c8505a', '#9a2f3a', '#e84a5a', '#b3263a'],
    coco: ['#ff9ec0', '#8a5a3c', '#ffd1ea', '#7a4422'], cece: ['#ffd1ea', '#ff9ec0', '#fff1b8', '#ff8aa8'],
    clementine: ['#f7962d', '#f2b880', '#ffd9c0'], cuke: ['#4a9a52', '#3f8f45', '#dcf2e6', '#c9dbb8', '#5aa844'],
    sully: ['#9a2f3a', '#b0533c', '#c8505a', '#b3263a'], david: ['rainbow', '#ff9ec0', '#8a5ab8', '#e2d4f7', '#ffd1ea', '#b37cf0'],
    joe: ['#2c3e66', '#8a95a8', '#4f86c6', '#d4ebf7'], ginger: ['#7a4422', '#b0533c', '#d98a5a', '#8a5a3c', '#f2b880'],
    brulee: ['#e9b93b', '#fff1b8', '#f2b880', '#caa55f'], mac: ['#fff1b8', '#e9b93b', '#4f86c6', '#ffd84a'],
};
const HOUSE_LOVE_LINE = {
    maki: 'My house. New colors. I have looked at it for twenty minutes. It is precisely right.',
    kai: 'Duuude, my shack looks SICK. Did you do that? You did that. Bowl-oha!',
    basil: 'My house looks... balanced. Calm. Like a good curry. Thank you, {name}.',
    chili: "My house got a glow-up and now it's HOT. Like, hotter. I'm blushing. I'm always blushing, but still.",
    coco: "Oh my GOD, my house! Everyone is talking about it. Okay, I started it. But everyone is talking about it!",
    cece: "You fixed up my house?! It's so pretty! I cried a little. Sorry! Happy crying!",
    clementine: 'Darling. My house. Finally, it looks like it knows who I am.',
    cuke: 'My house looks AMAZING! I jogged past it six times this morning! At 5 AM!',
    sully: "Kid, my house looks wicked nice. The whole street's jealous. Well. Everybody's jealous.",
    david: "My house? Honey, it's a MOMENT. The goat is speechless. The goat is always speechless, but still.",
    joe: "Did you redo my house? It's beautiful. I'm writing a poem about it. It's about the door. It's a very good door.",
    ginger: "Ha! Hiring my own crew to redo MY house? Smart. It looks great. I'd know.",
    brulee: 'My house is a masterpiece now. I would put it in the museum, but it will not fit through the door.',
    mac: "My house looks good enough to eat! Which is my highest compliment. For everything.",
};
async function houseReaction(n) {
    const id = n.id, r = rel(id), news = r.houseNews;
    r.houseNews = null;
    if (!news) return;
    const L = houseLook('h_' + id), taste = HOUSE_TASTE[id] || [];
    const loved = !news.restored && !news.moved && [L.wall, L.roof, L.door].some(c => taste.some(t => colorDist(c, t) < 60));
    n.emote = loved ? 'heart' : 'sparkle'; n.emoteT = 80;
    let line;
    if (news.moved) line = rpick(["My house MOVED! I walked to the old spot this morning and just stood there. New view, though. I love the new view.",
        "Did you have Ginger move my house? Overnight? I went to bed in one place and woke up in another! Best surprise ever."]);
    else if (news.restored) line = "My house looks like my house again! I missed it, honestly. Thank you for putting it back.";
    else if (loved) line = HOUSE_LOVE_LINE[id] || 'Did you redo my house? I LOVE it. I walked past it three times just to look.';
    else line = rpick(['Did you have Ginger fix up my house? That is so sweet. It is different! I like different. Mostly.',
        "My house looks brand new! Ginger said it was your idea. I'm still getting used to it. In a good way!"]);
    const named = ['wall', 'roof', 'door'].find(k => L[k + 'Name']);
    if (named && !news.restored && !news.moved) line += ` And that ${L[named + 'Name']} ${{ wall: 'paint', roof: 'roof', door: 'door' }[named]}? ${rpick(['I keep saying the name out loud.', 'What a name. What a color.', 'Chef\'s kiss.'])}`;
    await UI.say(id, voiced(id, line), { keep: true });
    const up = addPts(id, loved ? 6 : 3);
    if (up) await heartUp(n, up);
    Save.touch();
}
/* for a day or two after Sarah redoes her own place, people mention it */
function homeRedoLine(r) {
    const mv = S.flags.homeMoveDay;
    if (mv != null && Clock.dayNum() - mv <= 2 && r.sawHomeMove !== mv && R() < 0.6) {
        r.sawHomeMove = mv;
        return rpick(["Your house moved! I went to the old spot to say hi and said hi to some grass instead.", "Ooh, your house is in a new spot! Very bold. Very Ginger.",
            "I love where your house is now. Did it like the move? Houses have feelings. Probably."]);
    }
    const d = S.flags.homeRedoDay;
    if (d == null || Clock.dayNum() - d > 2 || r.sawHomeRedo === d || R() < 0.4) return null;
    r.sawHomeRedo = d;
    return rpick(['Your house looks so good! Did Ginger do that? It has that Ginger sparkle.', 'I walked by your house. New look? I love it. Very you.',
        "Okay, your house? Cutest on the island. Don't tell the others I said that."]);
}

