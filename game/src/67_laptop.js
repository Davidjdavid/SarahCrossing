/* ---- 67_laptop.js ---- */
/* Sarah's laptop: IslandMart, the island's online shop. Every outfit, accessory, piece of furniture, wallpaper and
   floor, in stock every day. Orders come in tomorrow's mail, all in one box. */
const LAPTOP_TABS = [['furniture', 'Furniture'], ['clothes', 'Clothes'], ['decor', 'Wallpaper & floors'], ['orders', 'My orders']];
function laptopCatalog(tab) {
    const ok = id => ITEMS[id] && ITEMS[id].price > 0;
    if (tab === 'clothes') return Object.keys(ITEMS).filter(id => ok(id) && (ITEMS[id].type === 'outfit' || ITEMS[id].type === 'acc'));
    if (tab === 'decor') return GD.walls.concat(GD.floors).filter(ok);
    return Object.keys(FURN).filter(id => ok(id) && !FURN[id].fixture && !FURN[id].prize && !FURN[id].pottery && !FURN[id].art && FURN[id].price > 0)
        .sort((a, b) => (FURN[a].sets[0] || '').localeCompare(FURN[b].sets[0] || '') || ITEMS[a].price - ITEMS[b].price);
}
/* tomorrow's box (one per day, however many things Sarah orders) */
function pendingBox() { const day = Clock.dayNum() + 1; return S.mail.find(m => m.from === 'shop' && m.day === day && !m.read) || null; }
function boxBody(ids) {
    return `Hi Sarah!\nYour IslandMart order is here:\n\n${ids.map(id => '- ' + itemName(id)).join('\n')}\n\nThank you for shopping online, from an island, on vacation.\nWe will not tell Harvard.\n- IslandMart`;
}
function laptopOrder(id) {
    const it = ITEMS[id];
    if (S.money < it.price) { Sfx.ui('nope'); UI.toast('Not enough sand dollars'); return false; }
    addMoney(-it.price, true);
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
        const draw = () => {
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
            } else {
                P.body.appendChild(el('p', 'muted', tab === 'clothes' ? 'Every outfit and accessory on the island. Clothes go to your pocket when the box comes; wear them from the wardrobe.'
                    : tab === 'decor' ? 'Every wallpaper and floor. Put them up while decorating.' : 'The whole catalog, every day. Orders arrive in tomorrow\'s mail.'));
                const list = el('div', 'list');
                for (const id of laptopCatalog(tab)) {
                    const it = ITEMS[id], f = FURN[id];
                    const row = el('button', 'row');
                    row.type = 'button';
                    row.appendChild(iconCanvas(itemIcon(id), 40));
                    const t = el('div', 't');
                    t.appendChild(el('b', null, it.name));
                    const owned = it.type === 'outfit' ? S.wardrobe.outfits.includes(it.wear) : it.type === 'acc' ? S.wardrobe.accs.includes(it.wear) : false;
                    t.appendChild(el('span', null, f ? `${SET_NAMES[f.sets[0]] || ''} \u00b7 ${f.w}\u00d7${f.kind === 'wall' ? 1 : f.h}${f.kind === 'wall' ? ' wall' : f.kind === 'top' ? ' tabletop' : f.kind === 'rug' ? ' rug' : ''}`
                        : (ITEM_TYPES[it.type] || '') + (owned ? ' \u00b7 already in your wardrobe' : '')));
                    row.appendChild(t);
                    row.appendChild(el('span', 'price', fmtNum(it.price)));
                    row.addEventListener('click', () => { if (laptopOrder(id)) draw(); });
                    list.appendChild(row);
                }
                P.body.appendChild(list);
            }
            P.foot.innerHTML = '';
            const box = pendingBox();
            P.foot.appendChild(el('span', 'grow', `${fmtNum(S.money)} sand dollars${box ? ` \u00b7 ${box.gifts.length} in tomorrow's box` : ''}`));
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

