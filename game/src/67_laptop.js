/* ---- 67_laptop.js ---- */
/* Sarah's laptop: IslandMart, the island's online shop. This week's stock of furniture, clothes, wallpaper and floors (new
   every Monday: so many of each kind, picked from the seed, so a week is never all chairs and nobody can buy everything at
   the start: David, 27 October), and anything she's ever had, to order again. Orders come in tomorrow's mail, in one box. */
const LAPTOP_TABS = [['furniture', 'Furniture'], ['clothes', 'Clothes'], ['decor', 'Wallpaper & floors'], ['again', 'Order again'], ['orders', 'My orders']];
/* how many of each kind a week */
const MART_WEEK = { floor: 12, wall: 4, rug: 2, top: 5, outfit: 5, acc: 6, walls: 5, floors: 5 };
/* the kinds of floor furniture, taken in turn so the week's twelve are a mix */
const MART_GROUPS = [['seat', /chair|stool|sofa|beanbag|cushion|hammock|bench/], ['table', /table|desk|counter|stand|case|conveyor|stove|fountain/],
    ['store', /shelf|dresser|rack|cabinet|mirror|trunk|chest/], ['light', /lamp|lantern|light|projector/], ['plant', /plant|bonsai|cactus|herb|sunflower|planter/],
    ['bed', /bed|tatami|futon/]];
/* the week number (weeks start on Monday) and the days till the next */
function martWeek(day) { return Math.floor(((day == null ? Clock.dayNum() : day) + 3) / 7); }
function martDaysLeft() { return 7 - ((Clock.dayNum() + 3) % 7); }
function laptopAll(tab) {
    const ok = id => ITEMS[id] && ITEMS[id].price > 0;
    if (tab === 'clothes') return Object.keys(ITEMS).filter(id => ok(id) && (ITEMS[id].type === 'outfit' || ITEMS[id].type === 'acc'));
    if (tab === 'decor') return GD.walls.concat(GD.floors).filter(ok);
    return Object.keys(FURN).filter(id => ok(id) && !FURN[id].fixture && !FURN[id].prize && !FURN[id].pottery && !FURN[id].art && !FURN[id].base && FURN[id].price > 0);
}
/* this week's stock on a tab */
function laptopCatalog(tab, day) {
    const r = mulberry(hash32((S.seed || 'x') + ':mart:' + martWeek(day))), shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    const all = laptopAll(tab), out = [];
    if (tab === 'clothes') for (const t of ['outfit', 'acc']) out.push(...shuffle(all.filter(id => ITEMS[id].type === t)).slice(0, MART_WEEK[t]));
    else if (tab === 'decor') { out.push(...shuffle(all.filter(id => GD.walls.includes(id))).slice(0, MART_WEEK.walls)); out.push(...shuffle(all.filter(id => GD.floors.includes(id))).slice(0, MART_WEEK.floors)); }
    else {
        for (const k of ['wall', 'rug', 'top']) out.push(...shuffle(all.filter(id => FURN[id].kind === k)).slice(0, MART_WEEK[k]));
        // (floor pieces a kind at a time: a seat, a table, a shelf, a lamp, a plant, a bed, something else, round again)
        const floor = all.filter(id => FURN[id].kind === 'floor'), groups = MART_GROUPS.map(([, re]) => shuffle(floor.filter(id => re.test(id)))), rest = shuffle(floor.filter(id => !MART_GROUPS.some(([, re]) => re.test(id))));
        groups.push(rest);
        for (let n = 0, i = 0; n < MART_WEEK.floor && groups.some(g => g.length); i++) { const g = groups[i % groups.length]; if (g.length) { out.push(g.shift()); n++; } }
        out.sort((a, b) => (FURN[a].sets[0] || '').localeCompare(FURN[b].sets[0] || '') || ITEMS[a].price - ITEMS[b].price);
        // (each piece in one of its four colors this week: 6zz_colors.js)
        if (typeof martColor === 'function') return out.map(id => martColor(id, martWeek(day)));
    }
    return out;
}
/* Order again (David, 27 October): anything Sarah has ever had (S.seen, and what's in her wardrobe), in this order,
   but not what's one of a kind or earned: quest things, keepsakes, lost things, gifts and holiday rewards
   (importantItem), the arcade's prizes and trophies, tools and backpacks, paintings and pots */
const AGAIN = [['furniture', 'Furniture'], ['wall', 'Wallpaper'], ['floor', 'Floors'], ['outfit', 'Outfits'], ['acc', 'Accessories'],
    ['display', 'Island displays'], ['dish', 'Dishes'], ['snack', 'Snacks'], ['staple', 'Pantry'], ['veg', 'Veggies'], ['fruit', 'Fruit'],
    ['seed', 'Seeds'], ['flower', 'Flowers'], ['plant', 'Plants'], ['fish', 'Fish'], ['shell', 'Beach finds'], ['gem', 'Gems'], ['material', 'Materials']];
function laptopAgain() {
    const had = new Set(Object.keys(S.seen || {})), types = AGAIN.map(t => t[0]);
    for (const [id, it] of Object.entries(ITEMS)) if ((it.type === 'outfit' && S.wardrobe.outfits.includes(it.wear)) || (it.type === 'acc' && S.wardrobe.accs.includes(it.wear))) had.add(id);
    return [...had].filter(id => {
        const it = ITEMS[id], f = FURN[id];
        return it && types.includes(it.type) && !importantItem(id) && !it.pottery && !it.special && !(f && (f.prize || f.fixture || f.pottery || f.art));
    }).sort((a, b) => types.indexOf(ITEMS[a].type) - types.indexOf(ITEMS[b].type) || ITEMS[a].name.localeCompare(ITEMS[b].name));
}
/* what it costs to order again: what the shops ask for what they sell (a free one from the start, 400); twice what Sarah
   would get for the rest (found, caught, grown or cooked, and shipped to her) */
const SHOP_TYPES = new Set(['furniture', 'wall', 'floor', 'outfit', 'acc', 'display', 'staple', 'seed', 'plant']);
function againPrice(id) { const it = ITEMS[id]; return SHOP_TYPES.has(it.type) ? it.price || 400 : Math.max(20, (it.price || 10) * 2); }
/* tomorrow's box (one per day, however many things Sarah orders) */
function pendingBox() { const day = Clock.dayNum() + 1; return S.mail.find(m => m.from === 'shop' && m.day === day && !m.read) || null; }
function boxBody(ids) {
    return `Hi Sarah!\nYour IslandMart order is here:\n\n${ids.map(id => '- ' + itemName(id)).join('\n')}\n\nThank you for shopping online, from an island, on vacation.\nWe will not tell Harvard.\n- IslandMart`;
}
function laptopOrder(id, price) {
    const it = ITEMS[id];
    price = price != null ? price : it.price;
    if (S.money < price) { Sfx.ui('nope'); UI.toast('Not enough sand dollars'); return false; }
    addMoney(-price, true, 'Orders');
    const box = pendingBox();
    if (box) { box.gifts = (box.gifts || []).concat([id]); box.body = boxBody(box.gifts); }
    else sendMail({ from: 'shop', subject: 'Your IslandMart order', body: boxBody([id]), gifts: [id], delay: 1 });
    S.stats.ordered = (S.stats.ordered || 0) + 1;
    Sfx.play('buy');
    UI.toast(`Ordered: ${it.name}. It arrives in tomorrow's mail.`, it.icon);
    Save.touch();
    return true;
}
function openLaptop() {
    return new Promise(res => {
        const tabs = el('div', 'tabs');
        let tab = 'furniture';
        const P = UI.open({ title: 'IslandMart', tabs, foot: true, onClose: res });
        /* a thing to order: its picture, name, what it is, the price; a click orders one */
        const row = (id, price) => {
            const it = ITEMS[id], f = FURN[id];
            const r = el('button', 'row');
            r.type = 'button';
            r.appendChild(iconCanvas(itemIcon(id), 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, it.name));
            const owned = it.type === 'outfit' ? S.wardrobe.outfits.includes(it.wear) : it.type === 'acc' ? S.wardrobe.accs.includes(it.wear) : false;
            t.appendChild(el('span', null, f ? `${SET_NAMES[f.sets[0]] || ''} \u00b7 ${f.w}\u00d7${f.kind === 'wall' ? 1 : f.h}${f.kind === 'wall' ? ' wall' : f.kind === 'top' ? ' tabletop' : f.kind === 'rug' ? ' rug' : ''}`
                : (ITEM_TYPES[it.type] || '') + (owned ? ' \u00b7 already in your wardrobe' : '')));
            r.appendChild(t);
            r.appendChild(el('span', 'price', fmtNum(price)));
            r.addEventListener('click', () => { if (laptopOrder(id, price)) draw(true); });
            return r;
        };
        // (after an order the list stays where it was scrolled to)
        const draw = (keep) => {
            const top = keep ? P.body.scrollTop : 0;
            tabs.innerHTML = '';
            for (const [k, label] of LAPTOP_TABS) {
                const b = el('button', 'tab' + (k === tab ? ' on' : ''), label);
                b.type = 'button';
                b.addEventListener('click', () => { tab = k; draw(); });
                tabs.appendChild(b);
            }
            P.body.innerHTML = '';
            if (tab === 'orders') {
                const box = pendingBox();
                P.body.appendChild(el('p', 'muted', box ? "Arriving tomorrow, in one box. It'll be in your mailbox (and the Mail app)." : 'Nothing on the way. Everything you order today arrives tomorrow.'));
                const list = el('div', 'list');
                for (const id of (box && box.gifts) || []) {
                    const row = el('div', 'row');
                    row.appendChild(iconCanvas(itemIcon(id), 40));
                    const t = el('div', 't');
                    t.appendChild(el('b', null, itemName(id)));
                    t.appendChild(el('span', null, 'Arriving tomorrow'));
                    row.appendChild(t);
                    list.appendChild(row);
                }
                P.body.appendChild(list);
            } else if (tab === 'again') {
                const ids = laptopAgain();
                P.body.appendChild(el('p', 'muted', ids.length ? "Everything you've ever had, to order again. Quest things, keepsakes, prizes, tools and one-of-a-kind gifts aren't sold."
                    : 'Nothing yet. Everything you get or buy shows up here, to order again whenever you like.'));
                let list = null, type = null;
                for (const id of ids) {
                    if (ITEMS[id].type !== type) {
                        type = ITEMS[id].type;
                        P.body.appendChild(el('h3', 'todo-h', AGAIN.find(t => t[0] === type)[1]));
                        list = P.body.appendChild(el('div', 'list'));
                    }
                    list.appendChild(row(id, againPrice(id)));
                }
            } else {
                const left = martDaysLeft(), when = left === 1 ? 'tomorrow' : `in ${left} days`;
                P.body.appendChild(el('p', 'muted', (tab === 'clothes' ? "This week's clothes. They go to your pocket when the box comes; wear them from the wardrobe."
                    : tab === 'decor' ? "This week's wallpaper and floors. Put them up while decorating." : "This week's furniture. Orders arrive in tomorrow's mail.") + ` New stock every Monday (${when}). Anything you've had is always in Order again.`));
                const list = el('div', 'list');
                for (const id of laptopCatalog(tab)) list.appendChild(row(id, ITEMS[id].price));
                P.body.appendChild(list);
            }
            P.foot.innerHTML = '';
            const box = pendingBox();
            P.foot.appendChild(el('span', 'grow', `${fmtNum(S.money)} sand dollars${box ? ` \u00b7 ${box.gifts.length} in tomorrow's box` : ''}`));
            P.body.scrollTop = top;
        };
        draw();
    });
}
/* the laptop on Sarah's table */
async function useLaptop() {
    const k = await UI.ask(null, rpick(["Sarah's laptop. The Harvard inbox is closed. It's staying closed.", 'The laptop wakes up. The wallpaper is the island at sunset.']),
        ['Shop on IslandMart', 'Check email', 'Harvard portal', 'Close it']);
    if (k === 0) { UI.hideDialog(); await openLaptop(); }
    else if (k === 1) { UI.hideDialog(); appMail(true); }
    else if (k === 2) await UI.say(null, rpick(['The portal says: "You are on vacation. Please log off." Sarah logs off.', 'Sarah types her password. The portal says: "Nice try. Go outside." Fair.']));
}

