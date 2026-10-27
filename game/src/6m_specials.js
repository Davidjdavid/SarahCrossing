/* ---- 6m_specials.js ---- */
/* Special things: rare hairstyles, sewing patterns, accessories, keepsakes that inspire Joe, secret recipes, songs,
   dances, expressions and treasures. They turn up in fishing crates, sparkling trees, after cooking, as thanks for a
   favor, in bottles, for high scores, and at the end of the island's five quests. The Collection app lists them all
   (the missing ones as ??? with a hint). */
const SPECIAL_CATS = [['hair', 'Hairstyles'], ['sew', 'Sewing patterns'], ['acc', 'Accessories'], ['poem', 'Keepsakes'], ['recipe', 'Recipes'],
    ['song', 'Songs'], ['dance', 'Dances'], ['emote', 'Expressions'], ['furn', 'Treasures']];
const SPECIALS = {};
const POOL_HINT = 'Could turn up anywhere: a fishing crate, a sparkling tree, after cooking, or as thanks from a friend.';
function defSpecial(id, cat, name, src, hint, extra) { SPECIALS[id] = Object.assign({ id, cat, name, src, hint: hint || POOL_HINT }, extra || {}); }
// hairstyles: Floss learns them
defSpecial('hair_mohawk', 'hair', 'Mohawk', 'score:capsules:10', 'Spicy! Reach level 10 in Spice Capsules.', { style: 'mohawk' });
defSpecial('hair_bald', 'hair', 'Bald and shiny', 'pool', null, { style: 'bald' });
defSpecial('hair_friar', 'hair', 'Friar', 'pool', null, { style: 'friar' });
defSpecial('hair_buzz', 'hair', 'Buzz cut', 'pool', null, { style: 'buzz' });
defSpecial('hair_pigtails', 'hair', 'Pigtails', 'score:rope:60', 'Hop to it: 60 jumps in a row at jump rope.', { style: 'pigtails' });
defSpecial('hair_joecut', 'hair', "Joe's curls", 'joe:30', 'Listen to thirty of Joe\'s poems. He gets his hair done somewhere...', { style: 'joecut' });
defSpecial('hair_spacebuns', 'hair', 'Space buns', 'score:blocks:50000', 'Score 50,000 in Bento Blocks.', { style: 'spacebuns' });
defSpecial('hair_afro', 'hair', 'Big and round', 'score:dumpling:12000', 'Score 12,000 in Dumpling Drop. Big chains, big hair.', { style: 'afro' });
defSpecial('hair_mullet', 'hair', 'Mullet', 'score:noodle:2000', 'Slurp up 2,000 in Noodle Slurp. Business in front...', { style: 'mullet' });
// sewing patterns: new styles at Clementine's machine
defSpecial('sew_suit', 'sew', 'Suit', 'pool', null, { style: 'suit' });
defSpecial('sew_muumuu', 'sew', 'Muumuu', 'pool', null, { style: 'muumuu' });
defSpecial('sew_gown', 'sew', 'Flowing gown', 'score:karaoke:S', 'Get an S at karaoke. Stars need gowns.', { style: 'gown' });
defSpecial('sew_robe', 'sew', 'Wizard robe', 'pool', null, { style: 'robe' });
defSpecial('sew_jumpsuit', 'sew', 'Disco jumpsuit', 'stat:dances:40', 'Dance your heart out at Club Wasabi (forty songs).', { style: 'jumpsuit' });
defSpecial('sew_cape', 'sew', 'Hero cape', 'score:surf:2500', 'Ride a wave to 2,500 in Surf\'s Up. Heroes surf.', { style: 'cape' });
defSpecial('sew_tutu', 'sew', 'Tutu', 'pool', null, { style: 'tutu' });
defSpecial('sew_sailor', 'sew', 'Sailor dress', 'pool', null, { style: 'sailor' });
defSpecial('sew_spacesuit', 'sew', 'Spacesuit', 'quest:star', 'Somebody up there is blinking at the island...', { style: 'spacesuit' });
// accessories
defSpecial('acc_tiara', 'acc', 'Tiara', 'score:sushi:4000', 'Score 4,000 in Sushi Swap. Royalty chains.', { item: 'acc_tiara' });
defSpecial('acc_flowercrown', 'acc', 'Flower crown', 'stat:flowers:100', 'Pick lots and lots of flowers (100).', { item: 'acc_flowercrown' });
defSpecial('acc_piratehat', 'acc', 'Pirate hat', 'quest:treasure', 'Buried treasure is traditionally guarded by a hat.', { item: 'acc_piratehat' });
defSpecial('acc_wizardhat', 'acc', 'Wizard hat', 'score:garden:20000', 'Bonk your way to 20,000 in Gopher Garden. Magic.', { item: 'acc_wizardhat' });
defSpecial('acc_catears', 'acc', 'Cat ears', 'score:fruit:4000', 'Score 4,000 in Fruit Catch. Cats love catching things.', { item: 'acc_catears' });
defSpecial('acc_halo', 'acc', 'Halo', 'quest:ghost', 'Help someone at the lighthouse find peace.', { item: 'acc_halo' });
defSpecial('acc_goathorns', 'acc', 'Goat horns', 'quest:goat', "Be the goat's friend. It's a goat. It will know.", { item: 'acc_goathorns' });
defSpecial('acc_monocle', 'acc', 'Monocle', 'stat:donated:15', 'Very distinguished. Give the museum fifteen pieces.', { item: 'acc_monocle' });
defSpecial('acc_chefhat', 'acc', 'Chef hat', 'cookgold:12', 'Earn gold medals cooking twelve different dishes.', { item: 'acc_chefhat' });
defSpecial('acc_mustache', 'acc', 'Fancy mustache', 'pool', null, { item: 'acc_mustache' });
// keepsakes that inspire Joe
defSpecial('moonrock', 'poem', 'Moon rock', 'pool', null, { item: 'moonrock' });
defSpecial('pressedflower', 'poem', 'Pressed flower', 'pool', null, { item: 'pressedflower' });
defSpecial('rubberduck', 'poem', 'Rubber duck', 'pool', null, { item: 'rubberduck' });
defSpecial('compass', 'poem', 'Old compass', 'pool', null, { item: 'compass' });
defSpecial('shipbottle', 'poem', 'Ship in a bottle', 'bottle', 'Keep reading the messages that wash up in bottles.', { item: 'shipbottle' });
defSpecial('luckypenny', 'poem', 'Lucky penny', 'tree', 'Shake a tree that sparkles.', { item: 'luckypenny' });
defSpecial('oldmap', 'poem', 'Old treasure map', 'quest:treasure', 'Somebody hid something on this island a long time ago.', { item: 'oldmap' });
defSpecial('starcrystal', 'poem', 'Star crystal', 'quest:star', 'Somebody up there is blinking at the island...', { item: 'starcrystal' });
// secret recipes
defSpecial('recipe_ramen', 'recipe', 'Shoyu ramen', 'pool', null, { recipe: 'ramen' });
defSpecial('recipe_mochi', 'recipe', 'Mochi', 'pool', null, { recipe: 'mochi' });
defSpecial('recipe_takoyaki', 'recipe', 'Takoyaki', 'pool', null, { recipe: 'takoyaki' });
defSpecial('recipe_pancakes', 'recipe', 'Pancake stack', 'pool', null, { recipe: 'pancakes' });
defSpecial('recipe_mooncakes', 'recipe', 'Moon cakes', 'quest:windmill', 'The old windmill could grind something special, if it worked.', { recipe: 'mooncakes' });
defSpecial('recipe_shortcake', 'recipe', 'Cherry shortcake', 'score:stack:10', 'Squish snacks all the way up to a watermelon in Snack Stack.', { recipe: 'shortcake' });
// songs for Club Wasabi
defSpecial('song_goat', 'song', 'The Goat Waltz', 'quest:goat', "Be the goat's friend. It's a goat. It will know.", { song: 'goat' });
defSpecial('song_starlight', 'song', 'Starlight', 'quest:star', 'Somebody up there is blinking at the island...', { song: 'starlight' });
defSpecial('song_shanty', 'song', 'Lighthouse Shanty', 'quest:ghost', 'Help someone at the lighthouse find peace.', { song: 'shanty' });
defSpecial('song_disco', 'song', 'Disco Cheesecake', 'pool', null, { song: 'discocake' });
// dances and expressions (the Moves app)
defSpecial('dance_robot', 'dance', 'The Robot', 'score:blocks:12L', 'Reach level 12 in Bento Blocks.', { move: 'robot' });
defSpecial('dance_twirl', 'dance', 'Twirl', 'pool', null, { move: 'twirl' });
defSpecial('dance_moonwalk', 'dance', 'Moonwalk', 'pool', null, { move: 'moonwalk' });
defSpecial('dance_floss', 'dance', 'The Floss', 'floss:6', 'Get your hair done at Floss & Gloss six times. Floss has a signature move.', { move: 'floss' });
defSpecial('dance_sprinkler', 'dance', 'The Sprinkler', 'stat:harvests:50', 'Harvest the garden fifty times.', { move: 'sprinkler' });
defSpecial('emote_wink', 'emote', 'Wink', 'pool', null, { move: 'wink' });
defSpecial('emote_idea', 'emote', 'Bright idea', 'pool', null, { move: 'idea' });
defSpecial('emote_cool', 'emote', 'Too cool', 'pool', null, { move: 'cool' });
defSpecial('emote_star', 'emote', 'Starstruck', 'pool', null, { move: 'starstruck' });
// treasures (furniture)
defSpecial('furn_treasure_chest', 'furn', 'Treasure chest', 'quest:treasure', 'Somebody hid something on this island a long time ago.', { item: 'treasure_chest' });
defSpecial('furn_keeper_lantern', 'furn', "Keeper's lantern", 'quest:ghost', 'Help someone at the lighthouse find peace.', { item: 'keeper_lantern' });
defSpecial('furn_mini_windmill', 'furn', 'Tiny windmill', 'quest:windmill', 'The old windmill could grind something special, if it worked.', { item: 'mini_windmill' });
defSpecial('furn_star_telescope', 'furn', 'Star telescope', 'quest:star', 'Somebody up there is blinking at the island...', { item: 'star_telescope' });

const SPECIAL_BLURB = {
    hair: 'Floss can do this style at the salon now.', sew: "A new sewing pattern! Make it at Clementine's sewing machine.",
    acc: 'It went straight into your wardrobe.', poem: 'Show it to Joe. He might write a poem about it.', recipe: 'A new recipe! Cook it at your kitchenette.',
    song: 'A new track for Club Wasabi. Ask DJ Wasabi to put it on.', dance: 'A new move! Do it any time from the Moves app.',
    emote: 'A new expression! Find it in the Moves app.', furn: 'Place it at home with Decorate.',
};
function specials() { if (!S.specials) S.specials = {}; return S.specials; }
function hasSpecial(id) { return !!(S && S.specials && S.specials[id]); }
function specialCount() { return Object.keys(SPECIALS).filter(hasSpecial).length; }
function specialHint(cat, style) {
    const sp = Object.values(SPECIALS).find(q => q.cat === cat && q.style === style);
    return sp && sp.hint ? `Still a secret. Hint: ${sp.hint}` : 'Still a secret! Keep exploring: specials turn up in fishing crates, sparkly trees, favors for neighbors and more.';
}
function specialStyleOk(style) { const sp = Object.values(SPECIALS).find(q => q.cat === 'hair' && q.style === style); return !sp || hasSpecial(sp.id); }
function sewStyleOk(style) { const sp = Object.values(SPECIALS).find(q => q.cat === 'sew' && q.style === style); return !sp || hasSpecial(sp.id); }

/* an icon for any special: atlas icons for things, a little drawing of Sarah for hairstyles and sewing patterns */
function specialIcon(id) {
    const sp = SPECIALS[id];
    if (!sp) return 'ui_present';
    if (sp.cat === 'hair' || sp.cat === 'sew') {
        const name = 'spic_' + id;
        if (!Assets.dyn[name]) {
            try {
                const L = Object.assign(look(), sp.cat === 'hair' ? { hair: sp.style } : {});
                const s = sp.cat === 'hair' ? lookFrame('crimson', 'down', 'stand', 'happy', L) : sewFrame(specialDesign(sp.style), 'down', 'stand', 'happy', L);
                if (s) Assets.dyn[name] = { c: s.canvas(), w: 16, h: 24, ax: 8, ay: 23 };
            } catch (e) { console.error(e); }
        }
        return Assets.dyn[name] ? name : (sp.cat === 'hair' ? 'ic_stylecard' : 'ic_pattern');
    }
    if (sp.item) return itemIcon(sp.item);
    if (sp.recipe) return 'dish_' + sp.recipe;
    if (sp.cat === 'song') return 'ic_song';
    if (sp.cat === 'emote') return 'emote_' + (MOVES[sp.move] && MOVES[sp.move].emote || 'note');
    return 'ic_dance';
}

/* the special actually does its thing */
function applySpecial(id) {
    const sp = SPECIALS[id];
    if (sp.cat === 'acc') { const w = ITEMS[sp.item].wear; if (!S.wardrobe.accs.includes(w)) S.wardrobe.accs.push(w); S.seen[sp.item] = S.seen[sp.item] || Clock.dayNum(); }
    else if (sp.cat === 'poem' || sp.cat === 'furn') receive(sp.item, 1, true);
    else if (sp.cat === 'recipe') { if (!S.recipes.includes(sp.recipe)) S.recipes.push(sp.recipe); }
    else if (sp.cat === 'dance' || sp.cat === 'emote') { if (!S.dance.moves.includes(sp.move)) S.dance.moves.push(sp.move); }
}
/* found one! returns a promise that resolves when the card is closed */
async function grantSpecial(id, how) {
    const sp = SPECIALS[id];
    if (!sp || hasSpecial(id)) return false;
    specials()[id] = { day: Clock.dayNum(), how: how || '' };
    applySpecial(id);
    Save.touch();
    Sfx.play('fanfare');
    if (G.player) { G.player.emote = 'sparkle'; G.player.emoteT = 90; }
    Bus.emit('special', id);
    await specialCard(id, how);
    return true;
}
function specialCard(id, how) {
    const sp = SPECIALS[id];
    return new Promise(res => {
        const P = UI.open({ title: 'Something special!', onClose: () => res(true) });
        P.panel.classList.add('spcard');
        const box = el('div', 'spbox');
        box.appendChild(iconCanvas(specialIcon(id), 96));
        box.appendChild(el('div', 'spcat', (SPECIAL_CATS.find(c => c[0] === sp.cat) || ['', ''])[1].replace(/s$/, '')));
        box.appendChild(el('div', 'spname', sp.name));
        if (how) box.appendChild(el('p', 'sphow', how));
        box.appendChild(el('p', null, SPECIAL_BLURB[sp.cat]));
        box.appendChild(el('p', 'muted', `Specials found: ${specialCount()} of ${Object.keys(SPECIALS).length}`));
        P.body.appendChild(box);
        const row = el('div', 'sprow');
        row.appendChild(btn('Yay!', 'go', () => UI.close()));
        P.body.appendChild(row);
    });
}
/* something from the pool nobody's found yet (prefer: categories to try first) */
function poolSpecial(prefer, rng) {
    rng = rng || R;
    const left = Object.values(SPECIALS).filter(sp => sp.src === 'pool' && !hasSpecial(sp.id));
    if (!left.length) return null;
    const pref = prefer ? left.filter(sp => prefer.includes(sp.cat)) : [];
    const list = pref.length && rng() < 0.7 ? pref : left;
    return list[Math.floor(rng() * list.length)].id;
}
async function maybeSpecial(chance, prefer, how) {
    if (R() >= chance) return false;
    const id = poolSpecial(prefer);
    if (!id) return false;
    return grantSpecial(id, how);
}
/* specials earned in the background (milestones) are marked found right away; their cards wait until Sarah isn't in
   the middle of something (a game, a chat, a menu) */
const SpecialQueue = [];
let specialPumping = false;
function earnSpecial(id, how) {
    if (!SPECIALS[id] || hasSpecial(id)) return false;
    specials()[id] = { day: Clock.dayNum(), how: how || '' };
    applySpecial(id);
    Save.touch();
    Bus.emit('special', id);
    SpecialQueue.push([id, how]);
    return true;
}
function uiIdle() {
    return G.mode === 'play' && !G.busy && !UI.modal && !UI.dialogOpen && !G.fade && !Arcade.on && !Studio.on && !Dance.on && !Karaoke.on && !SeaView.on
        && !Decor.on && !Photo.on && !BigMap.on && !IslandEdit.on && !(Rope.on && Rope.state !== 'done') && !IslandGames.on;
}
async function flushSpecials() {
    if (specialPumping) return;
    specialPumping = true;
    try {
        while (SpecialQueue.length) {
            const [id, how] = SpecialQueue.shift();
            Sfx.play('fanfare');
            if (G.player) { G.player.emote = 'sparkle'; G.player.emoteT = 90; }
            await specialCard(id, how);
        }
    } finally { specialPumping = false; }
}
function pumpSpecials() { if (SpecialQueue.length && !specialPumping && uiIdle()) flushSpecials(); }
/* milestones: checked after games, at the salon, when stats change */
async function checkSpecialMilestones() {
    if (!S || !S.started) return;
    const A = S.arcade || {}, st = S.stats || {}, best = A.best || {};
    for (const sp of Object.values(SPECIALS)) {
        if (hasSpecial(sp.id)) continue;
        const [kind, a, b] = sp.src.split(':');
        let ok = false;
        if (kind === 'score') {
            if (a === 'rope') ok = (S.rope && S.rope.best || 0) >= +b;
            else if (a === 'karaoke') ok = Object.values((S.karaoke && S.karaoke.ranks) || {}).includes('S');
            else if (b.endsWith('L')) ok = ((A.reach || {})[a] || 0) >= parseInt(b, 10);
            else if (a === 'stack') ok = ((A.stackTop || 0) >= +b);
            else if (a === 'capsules') ok = ((A.reach || {}).capsules || 0) >= +b;
            else ok = (best[a] || 0) >= +b;
        } else if (kind === 'stat') ok = (st[a] || 0) + (a === 'flowers' ? (st.flower || 0) : 0) >= +b;
        else if (kind === 'joe') ok = (S.poems || []).length >= +a;
        else if (kind === 'floss') ok = (st.salon || 0) >= +a;
        else if (kind === 'cookgold') ok = Object.values(S.cookLog || {}).filter(c => c.medal === 'gold').length >= +a;
        if (!ok) continue;
        const how = { score: 'A high score special!', stat: 'All that practice paid off!', joe: 'Joe says: "Floss did my hair. Tell her I sent you."', floss: 'Floss taught Sarah her signature move!', cookgold: 'A true chef!' }[kind];
        earnSpecial(sp.id, how);
    }
}
/* a sewing design for a special style, in its classic colors */
const SPECIAL_DESIGNS = {
    suit: { top: ['#2c3e66', 'navy'], bottom: ['#2c3e66', 'navy'], trim: ['#e0405a', 'red'], shoes: ['#3a3340', 'black'] },
    muumuu: { top: ['#f7962d', 'orange'], bottom: ['#f7962d', 'orange'], trim: ['#ffd84a', 'yellow'], shoes: ['#d9a46a', 'tan'], pat: 'flowers', patCol: ['#ffffff', 'white'] },
    gown: { top: ['#b37cf0', 'lilac'], bottom: ['#b37cf0', 'lilac'], trim: ['#ffd84a', 'yellow'], shoes: ['#ffffff', 'white'] },
    robe: { top: ['#6b3fa0', 'purple'], bottom: ['#6b3fa0', 'purple'], trim: ['#ffd84a', 'yellow'], shoes: ['#8a5a3c', 'brown'], pat: 'stars', patCol: ['#ffd84a', 'yellow'] },
    jumpsuit: { top: ['#ffffff', 'white'], bottom: ['#ffffff', 'white'], trim: ['#ffd84a', 'yellow'], shoes: ['#ffd84a', 'yellow'] },
    cape: { top: ['#4f86c6', 'blue'], bottom: ['#4f86c6', 'blue'], trim: ['#e0405a', 'red'], shoes: ['#e0405a', 'red'] },
    tutu: { top: ['#ffffff', 'white'], bottom: ['#ff9ec0', 'pink'], trim: ['#ff9ec0', 'pink'], shoes: ['#ff9ec0', 'pink'] },
    sailor: { top: ['#ffffff', 'white'], bottom: ['#2c3e66', 'navy'], trim: ['#2c3e66', 'navy'], shoes: ['#3a3340', 'black'] },
    spacesuit: { top: ['#f4efe6', 'cream'], bottom: ['#f4efe6', 'cream'], trim: ['#f7962d', 'orange'], shoes: ['#8a8ea8', 'gray'] },
};
function specialDesign(style) {
    const d = Object.assign(newDesign(), { style }, JSON.parse(JSON.stringify(SPECIAL_DESIGNS[style] || {})));
    return d;
}

/* ---------------------------------------------------------------- keepsakes: some things are too special to sell */
function unsellable(id) {
    const it = ITEMS[id];
    if (!it) return true;
    if (it.special || it.type === 'keepsake' || it.type === 'quest' || it.type === 'lost' || it.type === 'art' || it.type === 'tool') return true;
    if (id.startsWith('photo_') || id === 'bottle' || id === 'present' || id === 'lost_invite') return true;
    if (it.type === 'furniture' && !it.pottery && !(FURN[id] && FURN[id].price > 0) && !(FURN[id] && FURN[id].prize)) return true;
    return false;
}
/* the things that matter (quest items, lost things, keepsakes, signed photos, one-of-a-kind gifts) stay with Sarah: they
   can't be sold, given away as a gift or dropped. The quest (or the person they belong to) takes them when it's time. */
function importantItem(id) {
    const it = ITEMS[id];
    if (!it) return false;
    if (['quest', 'lost', 'keepsake'].includes(it.type)) return true;
    if (id.startsWith('photo_') || id === 'lost_invite') return true;
    if (it.special) return true;
    return it.type === 'furniture' && unsellable(id);
}
const IMPORTANT_NOTE = 'A keepsake. It stays with you and can\'t be sold, given away, or dropped.';
/* what an item is for (shown in the pocket, storage and shops) */
function recipesUsing(id) { return RECIPES.filter(r => r.need[id] && S.recipes.includes(r.id)).map(r => r.name); }
function listWords(a, max) { a = a.slice(0, max || 3); return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
function itemDesc(id) {
    const it = ITEMS[id];
    if (!it) return '';
    const uses = recipesUsing(id);
    const cook = uses.length ? `Cook with it: ${listWords(uses)}${uses.length > 3 ? ' and more' : ''}.` : '';
    const sell = unsellable(id) ? '' : ` Sells for ${fmtNum(sellPrice(id))}.`;
    const t = it.type;
    if (id.startsWith('photo_')) return 'A signed photo from a friend. A keepsake: it can\'t be sold. Hang it at home!';
    if (it.pottery) return `${labelNote(id)}Handmade by Sarah at Sully's studio. Put it on a table at home, give it to a friend, or sell it.${sell}`;
    if (t === 'art') return `${labelNote(id)}A painting Sarah made. Hang it at home or give it to the museum. It can't be sold.`;
    if (t === 'keepsake') return 'A special keepsake. Show it to Joe: it might inspire a poem. It can\'t be sold.';
    if (t === 'quest') return QUEST_ITEM_DESC[id] || 'Somebody on the island might want this. It can\'t be sold.';
    if (t === 'gem') return `A ${it.name.toLowerCase()} from the mountain top. Sell it to Fortune or give it to a friend.${sell}`;
    if (t === 'shell') return `A beach find. Sell it or give it to a friend.${sell}`;
    if (t === 'fruit') return `Eat it, cook with it or sell it. ${cook}${sell}`;
    if (t === 'fish') return (uses.length ? cook : id === 'boot' ? 'A bit of junk. Fine to sell.' : 'No current recipe uses it. Sell it or give it to a friend.') + sell;
    if (t === 'veg') return `${cook || 'A garden veggie.'} Fine to sell extras.${sell}`;
    if (t === 'staple') return `A pantry basic. ${cook || 'Used in cooking.'}${sell}`;
    if (t === 'dish') {
        const f = freshCount(id), all = ownedCount(id);
        if (f) return `Fresh${f < all ? ` (${f} of your ${all})` : ''}: made at home or bought from Mac's. Eating it always gives a boost. You can also give it to a friend or sell it.${sell}`;
        return `Eating it has a 1-in-10 chance of giving a boost. You can also give it to a friend or sell it.${sell}`;
    }
    if (t === 'snack') return `Eat it!${sell}`;
    if (t === 'seed') return it.flower ? `Plant them in a garden plot, or in any hole dug with the shovel for flowers right there.${sell}` : `Plant them in a garden plot at home. They grow in a few days.${sell}`;
    if (t === 'flower') return `A flower to give to a friend, display, or sell.${sell}`;
    if (t === 'furniture') return (unsellable(id) ? 'One of a kind. Place it at home with Decorate.' : `Place it at home with Decorate, or give it to a friend.${sell}`);
    if (t === 'wall' || t === 'floor') return `Put it up at home with Decorate.${sell}`;
    if (t === 'outfit') return `Add it to your wardrobe to wear it.${sell}`;
    if (t === 'acc') return it.special ? 'One of a kind. Add it to your wardrobe and wear it.' : `Add it to your wardrobe to wear it, or give it to a friend to wear.${sell}`;
    if (t === 'tool') return { rod: 'Hold it and face the water to fish.', axe: 'Hold it to chop trees (they give wood).', shovel: 'Hold it to dig holes, dig up clams and plant saplings.' }[id] || 'A tool.';
    if (t === 'material') return id === 'wood' ? `Building wood. Ginger likes it as a gift, and neighbors may ask for some. Sell any extra.${sell}` : `A material.${sell}`;
    if (t === 'plant') return `Plant it in a hole dug with the shovel. It grows into a tree.${sell}`;
    if (t === 'display') return 'Set it up outside with Island edit.';
    if (t === 'lost') return 'Somebody lost this. Give it back to them!';
    if (t === 'special') return id === 'bottle' ? 'A message in a bottle. Read it!' : 'Something special.';
    return sell.trim();
}
const QUEST_ITEM_DESC = {
    q_note: 'An old note from the barn. Read it again from your pocket.',
    q_tincan: 'An old tin can the goat was chewing on. Somebody who makes sauces might want a can.',
    q_hotsauce: "Chili's reserve hot sauce. Somebody who puts sauce on his poke bowls would love this.",
    q_necklace: 'A shell necklace. Somebody very stylish might trade for it.',
    q_scarf: 'A silk scarf. Somebody at the museum wanted a model for a painting...',
    q_goatpic: 'A tiny painting of the goat. Somebody who loves to talk about the goat would treasure it.',
    q_bell: 'A golden bell. It would look perfect on a goat.',
    q_cog: 'A brass cog from the old windmill. The millstone needs three of these.',
    package: 'A package to deliver. Your To-do list says who it\'s for.',
};

