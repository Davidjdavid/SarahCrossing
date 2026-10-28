/* ---- 41b_store.js ---- */
/* Shops and the pocket as one kind of screen (the menus overhaul, David's note of 27 October: "better looking,
   consistent, easier to get around and use"): the things as cards in a grid, and beside them (under them on a phone)
   the one picked, big, turning on a little stage where the new look's models are loaded, with what it is, its price
   and what can be done with it. A tap picks; only a button buys, sells or drops anything. */
function storeView(P, hint) {
    const wrap = el('div', 'store'), list = el('div', 'store-list'), pick = el('div', 'store-pick');
    wrap.appendChild(list);
    wrap.appendChild(pick);
    P.body.appendChild(wrap);
    let shown = null, stage = null;
    const V = {
        list, pick, sel: null,
        /* a heading over the cards that follow, and the grid they go in */
        group(label, cls) { if (label) list.appendChild(el('h3', 'shop-cat', label)); return list.appendChild(el('div', cls || 'store-grid')); },
        /* one thing's card: its picture on a plate, its name, and its price (or a word) */
        card(grid, o) {
            const b = el('button', 'card' + (o.key === V.sel ? ' sel' : '') + (o.dim ? ' dim' : ''));
            b.type = 'button';
            const pic = el('span', 'pic');
            pic.appendChild(iconCanvas(o.icon || itemIcon(o.id), 44));
            b.appendChild(pic);
            b.appendChild(el('span', 'nm', o.name || itemName(o.id)));
            if (o.price != null) b.appendChild(el('span', 'pr' + (o.price > S.money && !o.earn ? ' short' : ''), o.price ? fmtNum(o.price) : 'Free'));
            else if (o.tag) b.appendChild(el('span', 'tg', o.tag));
            if (o.badge) b.appendChild(el('span', 'bd' + (o.hot ? ' hot' : ''), o.badge));
            b.setAttribute('aria-label', (o.name || itemName(o.id)) + (o.price != null ? `, ${o.price ? fmtNum(o.price) + ' sand dollars' : 'free'}` : ''));
            b.addEventListener('click', () => { Sfx.ui('tick'); V.mark(b, o.key); if (o.pick) o.pick(); });
            grid.appendChild(b);
            return b;
        },
        /* (a slot or card picked: the one ringed) */
        mark(node, key) {
            V.sel = key;
            list.querySelectorAll('.card.sel, .slot.sel').forEach(n => n.classList.remove('sel'));
            if (node) node.classList.add('sel');
        },
        /* the one picked: big on its stage, what it is, the price, and the buttons */
        show(id, o) {
            o = o || {};
            if (shown !== id || !stage) {
                stage = el('div', 'store-stage');
                if (!Showcase.show(stage, id)) stage.appendChild(showcasePicture(id));
                shown = id;
            }
            const info = el('div', 'store-info');
            info.appendChild(el('b', 'nm', o.title || itemName(id)));
            if (o.sub) info.appendChild(el('span', 'what', o.sub));
            if (o.price != null) info.appendChild(el('span', 'store-price', o.price ? fmtNum(o.price) : 'Free'));
            for (const ln of o.lines || []) if (ln) info.appendChild(el('p', 'idesc' + (ln.cls ? ' ' + ln.cls : ''), ln.text || ln));
            const acts = el('div', 'store-acts');
            for (const b of o.buttons || []) acts.appendChild(b);
            pick.classList.add('on');
            pick.replaceChildren(stage, info, acts);
        },
        clear(text) {
            shown = null; stage = null; V.sel = null;
            pick.classList.remove('on');
            pick.replaceChildren(el('p', 'muted store-hint', text || hint || (G.touchUsed ? 'Tap something to see it here.' : 'Pick something to see it here.')));
        },
        /* empty the list for drawing again, keeping where it was scrolled to */
        reset() { const top = P.body.scrollTop; list.innerHTML = ''; return () => { P.body.scrollTop = top; }; },
    };
    V.clear();
    return V;
}
/* how many more of one thing a button can buy at once (seeds, the pantry): five, or what's affordable */
function buyFive(price, fn) {
    let n = 0;
    for (let k = 0; k < 5 && S.money >= price; k++) { if (!fn()) break; n++; }
    return n;
}
