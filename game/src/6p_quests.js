/* ---- 6p_quests.js ---- */
/* The island's old mysteries, each tied to one of the quiet old buildings (a hidden sixth, the arcade's back room, is in 6z_backroom.js):
   1. The barn: an old trunk hides a pirate's note. It leads to buried treasure on the beach (bring a shovel).
   2. The lighthouse: near midnight, the old keeper's ghost haunts the lamp room. He misses his wife's clam chowder.
   3. The goat: be its friend (pet it on three different days) and it starts a chain of trades around the island.
   4. The windmill: its moonstone has been still for years. Three cogs are missing, scattered around the island.
   5. The lookout: once the lighthouse shines again, a star over the mountain starts blinking. Answer it.
   Neighbors drop rumors and hints; the To-do app keeps track once Sarah is on the trail. */
const QUEST_IDS = ['treasure', 'ghost', 'goat', 'windmill', 'star'];
const QUEST_INFO = {
    treasure: { title: 'The note in the barn', icon: 'ic_oldmap' },
    ghost: { title: 'The keeper of the light', icon: 'ghost_0' },
    goat: { title: "The goat's friend", icon: 'goat_0' },
    windmill: { title: 'The silent moonstone', icon: 'ic_q_cog' },
    star: { title: 'The blinking star', icon: 'ic_starcrystal' },
};
const LIGHTHOUSE_SHUT = "(The lighthouse is boarded up until it's restored: pay toward it at the Town Hall's Projects.)";
const QUEST_NOTE = 'An old note, in faded ink:\n\n"To whoever finds this, I buried my treasure where nobody would think to look.\nStand at the foot of the long pier, where the planks meet the sand.\nWalk west along the water\'s edge, five-and-twenty paces.\nWhere the sand turns dark, dig.\n\n- Captain Gouda, 1887"';
const QUEST_RUMORS = {
    treasure: ["Ginger says there's an old trunk in the barn that nobody's opened in years. She says it's not her trunk. She says that a lot.",
        'Sully says a pirate captain buried treasure on this island a long time ago. Captain Gouda. A cheese, probably.',
        "There's an old trunk in the barn, by the ladder. Coco says it's full of love letters. Coco says that about every trunk."],
    ghost: ['They say the old lighthouse keeper still climbs the stairs near midnight. Every night. Just to check on the light.',
        "Wonton says he saw a light moving at the top of the old lighthouse, around midnight. Wonton went back in the spring and didn't come out till morning.",
        'The old keeper\'s wife, Martha, used to bring him chowder up all those stairs. Sully says people still remember the recipe.'],
    goat: ["The goat seems a little lonely. It's a goat. But still. Maybe it needs a friend. Someone to pet it. A few times.", "Coco says the goat likes shiny things. And being petted. And cans. Mostly cans."],
    windmill: ['Ginger says the windmill has a second millstone. The moonstone. It used to grind moon flour. It hasn\'t turned in years.',
        "Something's wrong with the windmill's moonstone. Ginger says some cogs went missing a long time ago."],
    star: ['Some nights, one star over the mountain blinks. Like it\'s trying to say something.',
        "I saw a star blinking at 4 AM! Short, short, long! I blinked back! Nothing happened!", 'If the lighthouse was working, maybe you could signal that blinking star back. Just a thought.'],
};
const TRADE_CHAIN = [
    ['q_tincan', 'chili', 'q_hotsauce'], ['q_hotsauce', 'kai', 'q_necklace'], ['q_necklace', 'clementine', 'q_scarf'],
    ['q_scarf', 'brulee', 'q_goatpic'], ['q_goatpic', 'coco', 'q_bell'], ['q_bell', 'goat', null],
];
const TRADE_LINES = {
    chili: ['A tin can! Do you know how long I have wanted a can? To age my reserve hot sauce in? Forever. At least a week.',
        'Trade you. My last bottle of reserve hot sauce. It\'s so hot it has a warning label. The warning label is also hot.'],
    kai: ["Chili's RESERVE hot sauce? For my poke? Bro. BRO.", 'Trade you. My shell necklace. I made it myself. Every shell has a story. The stories are mostly "I found it on the beach."'],
    clementine: ['Darling. That necklace. Handmade? It\'s so... authentic. I need it. For a look I\'m building.', "Trade you. My silk scarf. It's vintage. It's from last Tuesday, but it's vintage."],
    brulee: ['A silk scarf! Exactly what I needed for my model! The model is a vase. The vase needs a scarf.', 'For you, a tiny painting of the goat. I did it this morning. The goat did not pose. The goat was not asked.'],
    coco: ['A painting of the GOAT? I LOVE the goat. Everyone knows I love the goat. I tell everyone.', "Trade you this golden bell I found. It's too loud for me. I'm already loud."],
};

const Quests = {
    st(q) { if (!S.quests) S.quests = {}; if (!S.quests[q]) S.quests[q] = { stage: 0 }; return S.quests[q]; },
    stage(q) { return S && S.quests && S.quests[q] ? S.quests[q].stage : 0; },
    done(q) { return !!(S && S.quests && S.quests[q] && S.quests[q].done); },
    lamp() { return this.done('ghost'); },
    set(q, stage) { this.st(q).stage = stage; Save.touch(); },
    finish(q) { const s = this.st(q); s.done = true; s.doneDay = Clock.dayNum(); S.stats.quests = (S.stats.quests || 0) + 1; Save.touch(); },
    heard(q) { this.st(q).heard = true; },
    /* rumors for Talk (they also put the mystery on the To-do list) */
    rumor(n) {
        const open = QUEST_IDS.filter(q => !this.done(q) && (q !== 'star' || this.lamp()) && (q !== 'backroom' || backRoomReady()));
        if (!open.length) return null;
        const q = rpick(open);
        const s = this.stage(q);
        this.heard(q);
        if (q === 'ghost' && s === 1) return "A ghost who wants chowder? Only one chowder on this island is worth coming back from the other side for. Sully's. Ask him.";
        if (q === 'goat' && s >= 1) { const step = TRADE_CHAIN[s - 1]; if (step) return `I heard you're doing some trading! Maybe ${NPC_DEFS[step[1]] ? (step[1] === 'goat' ? 'the goat' : NPC_DEFS[step[1]].name) : 'someone'} could use that ${itemName(step[0]).toLowerCase()}?`; }
        if (q === 'windmill' && s === 1) return "Ginger said one of the windmill's cogs went into a crate on the farm, one into a hollow tree in the forest, and one out to sea. Things that go out to sea wash up in Driftwood Cove, if you ask me. Out on the west beach.";
        if (q === 'treasure' && s === 1) return "Did you figure out the note? Start at the foot of the pier and walk west along the water, twenty-five steps. Look for dark sand. Bring a shovel!";
        if (q === 'star' && s === 1) return 'You saw the blinking star too? Short, short, long. If only there was a big light to answer it with. Like a lighthouse. A working one.';
        return rpick(QUEST_RUMORS[q]);
    },
    todo() {
        const out = [];
        for (const q of QUEST_IDS) {
            const s = this.st(q), I = QUEST_INFO[q];
            if (!s.heard && !s.stage && !s.done) continue;
            out.push({ title: I.title, icon: I.icon, done: !!s.done, text: s.done ? 'Solved! ' + this.doneText(q) : this.hint(q) });
        }
        return out;
    },
    doneText(q) {
        return { treasure: 'Captain Gouda\'s treasure is yours.', ghost: 'The old keeper is at peace, and the lighthouse shines every night.', goat: 'The goat has its golden bell.',
            windmill: 'The moonstone grinds moon flour. Pick some up in the windmill every day.', star: 'The star said hi back.', backroom: BACK_DONE }[q];
    },
    /* (a step in the boarded lighthouse says so while it is: on beta it's restored through the Town Hall's projects) */
    hint(q) {
        const t = this.hintBase(q), s = this.stage(q);
        const inside = q === 'ghost' || (q === 'star' && s === 1) || (q === 'backroom' && s === 2);
        return t && inside && !lighthouseOpen() ? t + ' ' + LIGHTHOUSE_SHUT : t;
    },
    hintBase(q) {
        const s = this.stage(q);
        switch (q) {
            case 'treasure': return s ? 'From the foot of the pier, walk west along the water\'s edge, twenty-five paces, and dig where the sand is dark. (Hold the shovel!)'
                : 'A rumor: there is an old trunk in the barn, up on the farm.' + (barnOpen() ? '' : ' (The barn is locked. Maybe a friend has a spare key.)');
            case 'ghost': return s === 1 ? `The keeper's ghost appears in the lamp room from 11 PM to 1 AM. He misses Martha's clam chowder.${S.recipes.includes('chowder') ? ' (You know the recipe!)' : ' (Sully knows chowder.)'}`
                : 'A rumor: the old keeper still climbs the lighthouse stairs near midnight.';
            case 'goat': {
                if (!s) { const d = (this.st('goat').hugDays || []).length; return `A rumor: the goat is lonely. Pet it on three different days. (${d} of 3)`; }
                const step = TRADE_CHAIN[s - 1];
                return step ? `You have the ${itemName(step[0]).toLowerCase()}. Maybe ${step[1] === 'goat' ? 'the goat' : NPC_DEFS[step[1]].name} would like it?` : '';
            }
            case 'windmill': {
                if (!s) return "A rumor: the windmill's second millstone, the moonstone, hasn't turned in years.";
                const got = this.st('windmill').cogs || [];
                return `Cogs found: ${got.length} of 3. Ginger remembers: one in a crate on the farm, one in a hollow of the oldest tree in the forest, and one washed out to sea (it'd wash up in Driftwood Cove).`;
            }
            case 'backroom': return backHint(s);
            case 'star': return s === 2 ? 'The star answered! Something fell on the mountain top. Go look!' : s === 1 ? "Answer the blinking star (short, short, long) from the lighthouse's great lamp, at night."
                : 'A rumor: some nights one star over the mountain blinks. Look through the telescope at the lookout, at night.';
        }
        return '';
    },
    /* ---------------------------------------------------------------- talk menu entries */
    options(n) {
        const out = [], id = n.id;
        if (!S) return out;
        out.push(...backOptions(n), ...festOptions(n));
        // the trading chain
        const gs = this.stage('goat');
        if (gs >= 1 && !this.done('goat')) {
            const step = TRADE_CHAIN[gs - 1];
            if (step && step[1] === id && pocketCount(step[0])) out.push({ label: id === 'goat' ? 'Give the goat the golden bell' : `Want this ${itemName(step[0]).toLowerCase()}?`,
                fn: async () => { if (id === 'goat') await this.goatBell(n); else await this.trade(n, gs); return true; } });
        }
        if (id === 'sully' && this.stage('ghost') === 1 && !S.recipes.includes('chowder')) out.push({ label: 'The lighthouse ghost wants chowder...', fn: async () => {
            await UI.say('sully', ["A ghost? Wants chowdah? ...Martha's chowdah, huh. Kid, I heard stories about that chowdah. Wicked famous.",
                "Here. My recipe. Two littleneck clams, cream, flour. Dig the clams where the sand bubbles on the beach. Make it right and he'll know."], { keep: true });
            S.recipes.push('chowder');
            UI.toast('Learned a recipe: Clam chowder', 'dish_chowder');
            Sfx.play('item');
            Save.touch();
            return true;
        } });
        if (id === 'ginger' && this.stage('windmill') === 1 && !this.st('windmill').gingerHint) out.push({ label: 'About the windmill cogs...', fn: async () => {
            this.st('windmill').gingerHint = true;
            await UI.say('ginger', ['The moonstone cogs? Oh, those. Big storm, years ago. The gear box blew open.',
                'One rolled into a crate out on the farm, I think. Squirrels took one into the hollow of the oldest tree in the forest. The squirrels are a problem.',
                "And one went right off the cliff and out to sea. If it washed up anywhere, it'd be in Driftwood Cove, out on the west beach. Everything washes up there eventually."], { keep: true });
            return true;
        } });
        return out;
    },
    async trade(n, gs) {
        const [give, who, get] = TRADE_CHAIN[gs - 1];
        removeItem(give, 1);
        n.emote = 'heart'; n.emoteT = 90;
        Sfx.play('item');
        await UI.say(n.id, TRADE_LINES[who].map(l => voiced(n.id, l)), { keep: true });
        receive(get, 1);
        addPts(n.id, 4);
        this.set('goat', gs + 1);
        UI.toast(`Traded the ${itemName(give).toLowerCase()} for the ${itemName(get).toLowerCase()}`, itemIcon(get));
    },
    /* ---------------------------------------------------------------- the goat */
    goatPet() {
        const s = this.st('goat'), day = Clock.dayNum();
        if (s.stage || this.done('goat')) return;
        s.hugDays = s.hugDays || [];
        if (!s.hugDays.includes(day)) s.hugDays.push(day);
        this.heard('goat');
        if (s.hugDays.length >= 3) setTimeout(() => this.goatGift(), 400);
    },
    async goatGift() {
        if (this.stage('goat')) return;
        G.busy++;
        try {
            await UI.say(null, ["The goat nudges something toward Sarah with its nose. It's a tin can. The goat has been saving it. For her.", "It's a goat. This is a big deal."]);
            receive('q_tincan', 1);
            this.set('goat', 1);
            UI.toast("New on your To-do list: The goat's friend", 'app_tasks');
        } finally { G.busy--; }
    },
    async goatBell(n) {
        removeItem('q_bell', 1);
        Sfx.play('fanfare');
        n.emote = 'heart'; n.emoteT = 120;
        await UI.say(null, ['Sarah ties the golden bell around the goat\'s neck. The goat looks at her. The goat rings the bell. Once.',
            "The goat takes a step, listens to the bell, and takes another.", 'The goat hums a little tune. Sarah could swear it is a waltz.']);
        this.finish('goat');
        S.flags.goatBell = true;
        await grantSpecial('acc_goathorns', 'The goat wants you to have these. They are not its horns. It is unclear whose horns they are.');
        await grantSpecial('song_goat', 'The goat taught you its waltz.');
    },
    /* ---------------------------------------------------------------- the barn trunk */
    async barnTrunk() {
        const s = this.st('treasure');
        if (s.stage === 0 && !s.done) {
            Sfx.play('door');
            await UI.say(null, ['An old trunk, covered in dust. The lid is stuck... Sarah jiggles it... and it creaks open!', 'Inside: a moth, a very old sock, and a rolled-up note.']);
            receive('q_note', 1);
            this.set('treasure', 1);
            this.heard('treasure');
            refreshRoomHere('barn');
            await this.readNote();
            UI.toast('New on your To-do list: The note in the barn', 'app_tasks');
            refreshTreasure();
            return;
        }
        await UI.say(null, s.done ? 'The old trunk. Empty now, except for the moth. The moth is doing fine.' : "The old trunk. Just a moth and a sock now. The note's in Sarah's pocket.");
    },
    readNote() { return UI.say(null, QUEST_NOTE, { letter: true }); },
    async digTreasure(e, act) {
        await act(async () => {
            G.area.remove(e);
            this.finish('treasure');
            S.flags.treasureDug = true;
            if (pocketCount('q_note')) removeItem('q_note', 1);
            Sfx.play('fanfare');
            await UI.say(null, ['CLUNK. The shovel hits wood. Sarah digs faster...', "It's a treasure chest! Captain Gouda's treasure! Gold coins, a ruby, a pirate hat and an old map, all packed in very old cheese paper."]);
            addMoney(5000, false, 'Favors');
            receive('gem_ruby', 1);
        });
        await grantSpecial('furn_treasure_chest', "Captain Gouda's treasure chest!");
        await grantSpecial('acc_piratehat', 'Arr!');
        await grantSpecial('oldmap', 'The map that started it all.');
    },
    /* ---------------------------------------------------------------- the windmill */
    async gearWall() {
        const s = this.st('windmill');
        if (this.done('windmill')) { await UI.say(null, 'The big wooden gears turn, and behind them the moonstone turns too, grinding soft silver moon flour.'); return; }
        if (!s.stage) {
            await UI.say(null, ["Big wooden gears, turning with the sails. Behind them there's a second, smaller millstone. It's pale, almost silver.",
                'A little brass plaque: "THE MOONSTONE. Grinds moon flour." It isn\'t turning. Three slots in its gear are empty. Three cogs are missing!']);
            this.set('windmill', 1); this.heard('windmill');
            UI.toast('New on your To-do list: The silent moonstone', 'app_tasks');
            return;
        }
        const got = s.cogs || [];
        if (got.length < 3) { await UI.say(null, `The moonstone's gear has ${3 - got.length} empty ${plural(3 - got.length, 'slot')}. ${got.length ? `Sarah has found ${got.length} of the cogs.` : 'Where could the cogs be?'}`); return; }
        removeItem('q_cog', 3);
        Sfx.play('fanfare');
        await UI.say(null, ['Sarah fits the three cogs into place. Click. Click. CLICK.', 'The moonstone shudders... and starts to turn. A soft silver dust spills out: moon flour!']);
        this.finish('windmill');
        receive('moonflour', 3);
        await grantSpecial('recipe_mooncakes', 'Moon flour makes moon cakes. Everyone knows that. Now you know that.');
        await grantSpecial('furn_mini_windmill', 'Ginger made you a tiny windmill to celebrate.');
    },
    async findCog(where) {
        const s = this.st('windmill');
        s.cogs = s.cogs || [];
        if (s.cogs.includes(where)) return false;
        if (!s.stage) return false;
        s.cogs.push(where);
        Sfx.play('fanfare');
        receive('q_cog', 1);
        await UI.say(null, `${{ crate: 'Under the pumpkins in the crate', tree: 'Deep in the hollow of the old tree, past a very judgmental squirrel', chest: 'Tangled in the driftwood, wrapped in a scrap of old sailcloth' }[where]}: a brass cog! (${s.cogs.length} of 3)`);
        Save.touch();
        return true;
    },
    async moonBin() {
        const day = Clock.dayNum();
        if (S.flags.moonDay === day) { await UI.say(null, 'The moonstone is still grinding. More moon flour tomorrow.'); return; }
        S.flags.moonDay = day;
        receive('moonflour', 1);
        Sfx.play('pick');
        await UI.say(null, 'A little silver heap of moon flour has piled up under the moonstone. Sarah scoops it up.');
    },
    /* ---------------------------------------------------------------- the ghost */
    ghostHere() { const h = Clock.hourF(); return !this.done('ghost') && (h >= 23 || h < 1); },
    async ghost(n) {
        const s = this.st('ghost');
        this.heard('ghost');
        if (!s.stage) {
            await UI.say('ghost', ['Ooooh... hello... You can see me? Nobody has seen me in a hundred years... Well. Seventy.',
                'I was the keeper of this light. Fifty years, every night, I kept it burning for the ships...',
                'And every night, my Martha climbed all those stairs with a bowl of her clam chowder... to keep me warm...',
                'I miss it so... Ooooh... If only I could taste it one more time...']);
            this.set('ghost', 1);
            UI.toast('New on your To-do list: The keeper of the light', 'app_tasks');
            return;
        }
        if (!pocketCount('chowder')) {
            await UI.say('ghost', rpick([['Ooooh... hello again... Chowder... clams, cream... Martha always said the secret was the littleneck clams...'],
                ['Ooooh... Is that you? I thought I smelled chowder... No... just the sea...']]));
            return;
        }
        const k = await UI.ask('ghost', 'Ooooh... is that... CHOWDER? Real clam chowder?', ['Here, it\'s for you', 'Not yet']);
        if (k !== 0) return;
        removeItem('chowder', 1);
        Sfx.play('fanfare');
        await UI.say('ghost', ['*slurp* ...Oh. Oh, my. It tastes just like Martha\'s. Just exactly like it.',
            'I can rest now. I can finally rest. But the light... please... keep the light burning for me. Every night.',
            'Here. My lantern. And a little song I used to sing to the ships. Goodbye, young keeper. Ooooh...']);
        this.finish('ghost');
        S.flags.lampLit = true;
        await grantSpecial('furn_keeper_lantern', "The old keeper's lantern.");
        await grantSpecial('acc_halo', 'A little glow the ghost left behind.');
        await grantSpecial('song_shanty', 'The keeper\'s sea song.');
        await UI.say(null, 'Down below, with a great clank, the lighthouse lamp flickers... and lights! It sweeps across the dark water.');
        markRoomStale('lamproom');
    },
    /* ---------------------------------------------------------------- the star */
    starVisible() { const h = Clock.hourF(); return this.lamp() && !this.done('star') && (h >= 20 || h < 4.5) && G.weather !== 'rain' && G.weather !== 'snow'; },
    async lookout() {
        if (!this.starVisible()) return false;
        const s = this.st('star');
        this.heard('star');
        if (s.stage === 0) {
            await UI.say(null, ['Through the telescope: stars and more stars. And one of them is... blinking.', 'Short. Short. Long. ... Short. Short. Long. Like it\'s saying hello.',
                'If only there was a big enough light on this island to answer it with.']);
            this.set('star', 1);
            UI.toast('New on your To-do list: The blinking star', 'app_tasks');
            return true;
        }
        if (s.stage === 1) { await UI.say(null, 'The star is still blinking: short, short, long. It seems patient. Stars are very patient.'); return true; }
        return false;
    },
    async lens() {
        const s = this.st('star'), h = Clock.hourF(), night = h >= 20 || h < 4.5;
        if (!this.lamp()) { await UI.say(null, "The great lamp. Its glass rings are dusty and dark. Nobody has lit it in a very long time. It feels like it's waiting for something."); return; }
        if (s.stage !== 1 || !night) { await UI.say(null, night ? 'The great lamp turns slowly, sweeping its beam over the dark sea. It hums.' : 'The great lamp, resting for the day. It gleams. Somebody (the ghost?) has polished it.'); return; }
        const k = await UI.ask(null, 'The great lamp can be flashed with the big lever. Answer the blinking star? How did its blink go?', ['Short, short, long', 'Long, long, short', 'Short, long, short', 'Not now']);
        if (k === 3 || k < 0) return;
        UI.hideDialog();
        G.busy++;
        try { for (const len of [[8, 8, 26], [26, 26, 8], [8, 26, 8]][k]) { G.flash = 0.35; Sfx.play('blip'); await waitFrames(len); G.flash = 0; await waitFrames(10); } } finally { G.busy--; }
        if (k !== 0) { await UI.say(null, 'Sarah flashes the lamp. Out over the sea, the star keeps blinking its pattern. Short, short, long. That wasn\'t it.'); return; }
        Sfx.play('fanfare');
        await UI.say(null, ['Short, short, long. Sarah flashes it back.', 'For a second, nothing. Then the star blinks back, very fast, very bright, like it\'s laughing...',
            '...and a shooting star streaks across the sky and lands, with a soft glow, on the mountain top!']);
        this.set('star', 2);
        Save.touch();
    },
    async fallenStar() {
        Sfx.play('fanfare');
        await UI.say(null, ["A glowing crystal, still warm, sits in a little crater at the top of the mountain. It hums, very softly.", 'It seems like it was always meant for Sarah.']);
        this.finish('star');
        await grantSpecial('starcrystal', 'A gift from the star.');
        await grantSpecial('sew_spacesuit', 'For your next trip. Upwards.');
        await grantSpecial('song_starlight', 'The star\'s song.');
        await grantSpecial('furn_star_telescope', 'So you can wave back any time.');
        refreshTreasure();
    },
};

/* ---------------------------------------------------------------- things in the world */
function refreshTreasure() { const a = G.areas && G.areas.island; if (a) addQuestWorld(a); }
function addQuestWorld(a) {
    a.ents = a.ents.filter(e => !e.questThing);
    if (!S) return;
    const T = W0.treasure;
    if (T && Quests.stage('treasure') >= 1 && !Quests.done('treasure')) {
        const [fx, fy] = tileFoot(T.x, T.y);
        const e = a.add({ kind: 'treasure', forest: true, questThing: true, layer: 0, tx: T.x, ty: T.y, x: fx, y: fy - 3, frame: 'digspot' });
        e.hit = { x: T.x * TILE, y: T.y * TILE, w: TILE, h: TILE };
        e.draw = ctx => { spr(ctx, 'digspot', e.x, e.y); if ((G.t >> 4) % 6 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(Math.round(e.x) + 3, Math.round(e.y) - 2, 1, 1); } };
        e.interact = () => heldTool() === 'shovel' ? digAt(T.x, T.y) : UI.say(null, 'The sand is darker here. Somebody dug here, a long, long time ago. A shovel would help.');
    }
    if (Quests.stage('star') === 2 && !Quests.done('star')) {
        const sp = W0.spots.summit;
        const [fx, fy] = tileFoot(sp.x + 1, sp.y - 1);
        const e = a.add({ kind: 'fallenstar', questThing: true, x: fx, y: fy, frame: 'ic_starcrystal' });
        e.hit = { x: fx - 8, y: fy - 16, w: 16, h: 18 };
        e.draw = ctx => {
            const k = 0.5 + 0.5 * Math.sin(G.t / 12);
            ctx.fillStyle = `rgba(190,225,255,${0.25 + 0.2 * k})`;
            ctx.beginPath(); ctx.ellipse(e.x, e.y - 4, 12 + 3 * k, 6 + k, 0, 0, Math.PI * 2); ctx.fill();
            spr(ctx, 'ic_starcrystal', e.x, e.y - Math.round(k * 2));
        };
        e.interact = async () => { a.remove(e); await Quests.fallenStar(); };
    }
}

/* ---------------------------------------------------------------- the lighthouse (inside) */
ROOMS.lighthouse = { w: 8, h: 5, wall: 'wall_lighthouse', floor: 'floor_boards', music: 'house', name: 'The old lighthouse', build: a => buildLighthouseRoom(a) };
ROOMS.lamproom = { w: 6, h: 4, wall: 'wall_lamp', floor: 'floor_grate', music: 'night', name: 'The lamp room', exitTo: 'lighthouse', exitAt: [5, 2], building: 'lighthouse', build: a => buildLampRoom(a) };
ROOM_PLACE.lighthouse = 'at the old lighthouse';
ROOM_PLACE.lamproom = 'up in the lighthouse';
LOST_ROOMS.push('lighthouse');
const LH_LINES = {
    lh_desk: ["The keeper's desk. A logbook lies open: \"Clear skies. Calm sea. Martha's chowder tonight.\" Every entry ends with chowder.", 'An old logbook and a brass oil lamp. The last entry is seventy years old.'],
    lh_map: ['A sea chart of the island and the waters around it. Somebody drew a tiny heart on the lighthouse.', 'An old chart. The reefs are marked in red. The island looks smaller. It was smaller.'],
    lh_barometer: ['A brass barometer. The needle points to "FAIR." It has pointed to "FAIR" for seventy years. Optimistic.'],
    lh_shelf: ['A ship in a bottle, a coil of rope, jars of buttons, and a book called "Knots, Volume 4."', 'Shelves of odds and ends that washed up on the beach. The keeper kept everything.'],
    lh_cot: ["The keeper's narrow cot, with a patchwork quilt. It looks very comfortable. It looks very old."],
    lh_lifering: ['A red and white life ring. It says "SS MARTHA."'],
    lh_stove: ['A little iron stove. Cold now. There\'s an old pot on it that still smells, very faintly, like clam chowder.'],
    window_wall: ['Through the round window: the sea, and the sea, and more sea.'],
};
function buildLighthouseRoom(a) {
    const items = layoutItems([
        ['lh_map', 0, 'wall'], ['window_wall', 2, 'wall'], ['lh_barometer', 3, 'wall'], ['lh_lifering', 4, 'wall'],
        ['lh_desk', 0, 0], ['lh_shelf', 3, 0], ['lh_stairs', 6, 0], ['lh_stove', 0, 3], ['lh_cot', 5, 3], [S && S.flags.lhChest ? 'lh_trunk_open' : 'lh_trunk', 3, 4], ['rug_round', 2, 2]]);
    items.forEach(it => {
        if (it.id === 'lh_stairs') it.use = () => climbLighthouse();
        else if (it.id === 'lh_trunk' || it.id === 'lh_trunk_open') it.use = () => lighthouseChest(it);
        else if (it.id === 'lh_desk') it.use = async () => { if (!(await backKeyHunt())) await UI.say(null, rpick(LH_LINES.lh_desk)); };
        else if (LH_LINES[it.id]) it.use = () => UI.say(null, rpick(LH_LINES[it.id]));
    });
    a.items = items;
    placeFurniture(a, items);
}
/* the old keeper's sea chest: the first time it's opened (the first thing the lighthouse gives once it's open), his fancy
   mustache; open from then on (David, 29 October) */
async function lighthouseChest(it) {
    if (!S.flags.lhChest) {
        S.flags.lhChest = Clock.dayNum();
        Sfx.play('door');
        await UI.say(null, ['The old sea chest. The latch is stiff... Sarah works it loose, and the lid creaks up.', 'Rope, a lantern wick, a very old sandwich (fossilized)... and, folded in a silk handkerchief, a magnificent mustache.']);
        refreshRoomHere('lighthouse');
        if (!hasSpecial('acc_mustache')) await grantSpecial('acc_mustache', "The old keeper's Sunday mustache. Martha made him wear it to dances.");
        else { addMoney(500, false, 'Found & gifts'); await UI.say(null, 'Under the handkerchief, a little purse of old coins: 500 sand dollars.'); }
        Save.touch();
        return;
    }
    await UI.say(null, rpick(['The keeper\'s sea chest, open. Rope, a lantern wick and the fossilized sandwich. Nobody\'s touching the sandwich.', 'An open sea chest full of things that washed up on the beach. Sea glass, a spoon, a boot. The keeper kept everything.']));
}
function buildLampRoom(a) {
    const items = layoutItems([['window_wall', 0, 'wall'], ['window_wall', 5, 'wall'], ['lh_lens', 2, 0]]);
    items.forEach(it => { if (it.id === 'lh_lens') it.use = () => Quests.lens(); });
    a.items = items;
    placeFurniture(a, items);
    // the ghost, near midnight
    const [gx, gy] = toArea(4, 2);
    const g = a.add({ kind: 'ghost', ghost: true, x: (gx + 0.5) * TILE, y: (gy + 0.8) * TILE, layer: 1 });
    g.hit = { x: g.x - 10, y: g.y - 26, w: 20, h: 28 };
    const talk = () => Quests.ghost(g);
    g.draw = ctx => {
        g.interact = Quests.ghostHere() ? talk : null;
        if (!Quests.ghostHere()) return;
        const k = Math.floor(G.t / 20) % 2;
        ctx.globalAlpha = 0.72 + 0.18 * Math.sin(G.t / 17);
        spr(ctx, 'ghost_' + k, g.x, g.y - 2 + Math.round(Math.sin(G.t / 13) * 2));
        ctx.globalAlpha = 1;
    };
    g.interact = Quests.ghostHere() ? talk : null;
    g.sy = g.y;
}
async function climbLighthouse() {
    Sfx.play('step');
    await goRoom('lamproom', [3, 3], 'up');
    const h = Clock.hourF();
    if (Quests.ghostHere() && !Quests.st('ghost').stage) {
        await waitFrames(20);
        await UI.say(null, 'The air goes cold. Something pale is floating by the great lamp...');
    } else if (!Quests.lamp() && (h >= 20 || h < 4)) await UI.say(null, 'The lamp room. The great lamp is dark. Out the windows, the sea is black and endless.');
}
/* moving between two rooms (the lighthouse stairs) */
async function goRoom(id, at, dir) {
    await fadeTo(async () => {
        const a = ensureArea(id);
        const [x, y] = toArea(at[0], at[1]);
        setArea(id, (x + 0.5) * TILE, (y + 0.6) * TILE, dir || 'down');
    });
    Bus.emit('enter', id);
}
AREA_TALK.lighthouse = ["It's so quiet in here. Just the waves. And a clock, somewhere.", 'The keeper spent so many nights here. I like reading the ordinary little things he wrote in the logbook.',
    "The lamp room at midnight? I'd go. I'm just waiting for someone braver to start up the stairs."];

