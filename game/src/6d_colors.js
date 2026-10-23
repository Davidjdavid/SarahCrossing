/* ---- 6d_colors.js ---- */
/* Sarah's own colors: pick any color at all and give it a name. They show up in every color picker (house paint, the
   easel, pottery glazes, the sewing machine), and the name is used when something made with it gets described
   ("Tall Midnight Blueberry vase"). Things remember their colors, so changing or deleting one later doesn't repaint
   anything already made. */
const MAX_COLORS = 12;
function myColors() { if (!S.colors) S.colors = []; return S.colors; }          // [{ id, hex, name }]
function hexRgbA(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shadeHex(h, k) {               // k < 0 darker (toward deep purple), k > 0 lighter
    const [r, g, b] = hexRgbA(h), to = k < 0 ? [26, 16, 38] : [255, 255, 255], t = Math.min(1, Math.abs(k));
    return rgbHex(r + (to[0] - r) * t, g + (to[1] - g) * t, b + (to[2] - b) * t);
}
function colorDist(a, b) {
    if (!a || !b || a[0] !== '#' || b[0] !== '#') return a === b ? 0 : 999;
    const x = hexRgbA(a), y = hexRgbA(b);
    return Math.hypot(x[0] - y[0], (x[1] - y[1]) * 1.2, x[2] - y[2]);
}
/* a friendly name for any color, by hue and lightness */
const NAME_IDEAS = {
    red: ['Cherry Pop', 'Lipstick', 'Tomato Soup', 'Ladybug', 'Hot Sauce'], orange: ['Clementine', 'Sunset', 'Pumpkin Spice', 'Tangerine', 'Marmalade'],
    yellow: ['Lemon Drop', 'Butter', 'Sunflower', 'Honey', 'Mac and Cheese'], green: ['Matcha', 'Pickle', 'Mint Leaf', 'Fern', 'Lucky Clover'],
    teal: ['Sea Glass', 'Lagoon', 'Mermaid', 'Hot Spring'], blue: ['Midnight Blueberry', 'Denim', 'Deep Sea', 'Bluebird', 'Harvard Sky'],
    purple: ['Grape Soda', 'Lavender', 'Plum', 'Violet Hour', 'Disco Night'], pink: ['Bubblegum', 'Strawberry Milk', 'Rose Petal', 'Cotton Candy', 'Blush'],
    brown: ['Cocoa', 'Toffee', 'Gingerbread', 'Iced Coffee', 'Caramel'], gray: ['Storm Cloud', 'Pebble', 'Moonlight', 'Foggy Morning'],
    white: ['Marshmallow', 'Cloud', 'Sea Foam', 'Rice'], black: ['Night Owl', 'Ink', 'Midnight', 'Licorice'],
};
function colorFamily(hex) {
    const [r, g, b] = hexRgbA(hex).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (l > 0.9 && d < 0.12) return 'white';
    if (l < 0.14) return 'black';
    if (d < 0.1) return 'gray';
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    if ((h < 40 || h > 330) && l < 0.42 && d < 0.5 && h < 40) return 'brown';
    if (h < 12 || h >= 345) return l > 0.72 ? 'pink' : 'red';
    if (h < 42) return l < 0.4 ? 'brown' : 'orange';
    if (h < 68) return l < 0.35 ? 'brown' : 'yellow';
    if (h < 160) return 'green';
    if (h < 195) return 'teal';
    if (h < 250) return 'blue';
    if (h < 290) return 'purple';
    return 'pink';
}
function suggestName(hex, not) {
    const list = NAME_IDEAS[colorFamily(hex)] || ['Island Special'];
    const taken = new Set(myColors().map(c => c.name).concat(not ? [not] : []));
    return list.find(n => !taken.has(n)) || rpick(list);
}
function colorById(id) { return myColors().find(c => c.id === id) || null; }
function saveColor(hex, name, id) {
    const list = myColors();
    name = (name || '').trim().slice(0, 22) || suggestName(hex);
    if (id) { const c = colorById(id); if (c) { c.hex = hex; c.name = name; Save.touch(); return c; } }
    S.colorSeq = (S.colorSeq || 0) + 1;
    const c = { id: 'c' + S.colorSeq, hex, name };
    list.push(c);
    while (list.length > MAX_COLORS) list.shift();
    Save.touch();
    return c;
}
function deleteColor(id) { S.colors = myColors().filter(c => c.id !== id); Save.touch(); }

/* the "make a color" form, drawn into a studio's tool panel; back() redraws the tool when it's done */
function colorForm(U, opts) {
    const edit = opts.id ? colorById(opts.id) : null;
    U.tools.innerHTML = '';
    U.tools.appendChild(stLabel(edit ? 'Change your color' : 'A color of your own'));
    const row = el('div', 'colorform');
    const pick = el('input');
    pick.type = 'color'; pick.id = 'mycolor'; pick.value = edit ? edit.hex : (opts.start || '#7a63c4');
    pick.setAttribute('aria-label', 'Pick a color');
    const f = el('label', 'field');
    f.appendChild(el('span', null, 'Name it'));
    const name = el('input');
    name.id = 'mycolorname'; name.maxLength = 22; name.autocomplete = 'off';
    name.value = edit ? edit.name : suggestName(pick.value);
    let typed = !!edit;
    name.addEventListener('input', () => { typed = true; });
    name.addEventListener('keydown', e => e.stopPropagation());
    pick.addEventListener('input', () => { if (!typed) name.value = suggestName(pick.value); hex.textContent = pick.value.toUpperCase(); });
    f.appendChild(name);
    row.appendChild(pick);
    row.appendChild(f);
    U.tools.appendChild(row);
    const hex = el('div', 'st-sub', pick.value.toUpperCase());
    U.tools.appendChild(hex);
    const r2 = el('div', 'st-row');
    r2.appendChild(chip('Another name idea', () => { name.value = suggestName(pick.value, name.value); typed = true; }));
    U.tools.appendChild(r2);
    U.tools.appendChild(el('p', 'muted', "The name is what everyone will call it: \"a Midnight Blueberry vase.\" Things you've already made keep their colors."));
    const r3 = el('div', 'st-row');
    r3.appendChild(chip(edit ? 'Save changes' : 'Save my color', () => { const c = saveColor(pick.value, name.value, edit && edit.id); Sfx.play('item'); opts.done(c); }, 'go'));
    if (edit) r3.appendChild(chip('Delete it', () => { deleteColor(edit.id); Sfx.ui('tick'); opts.done(null); }));
    r3.appendChild(chip('Cancel', () => opts.done(null)));
    U.tools.appendChild(r3);
}
/* add Sarah's colors (and a "+") to a row of swatches */
function mySwatches(sw, isOn, onPick, onAdd) {
    for (const c of myColors()) {
        const b = el('button', 'swatch mine' + (isOn(c) ? ' on' : ''));
        b.type = 'button'; b.title = c.name; b.setAttribute('aria-label', c.name);
        b.style.background = c.hex;
        b.addEventListener('click', () => { Sfx.ui('tick'); onPick(c); });
        sw.appendChild(b);
    }
    const add = el('button', 'swatch add', '+');
    add.type = 'button'; add.title = 'Make your own color'; add.setAttribute('aria-label', 'Make your own color');
    add.addEventListener('click', () => { Sfx.ui('tick'); onAdd(); });
    sw.appendChild(add);
}
/* "Edit Midnight Blueberry" under a palette when one of Sarah's colors is picked */
function editMine(U, c, redraw) {
    if (!c) return;
    const r = el('div', 'st-row');
    r.appendChild(chip(`Change "${c.name}"`, () => colorForm(U, { id: c.id, done: () => redraw() })));
    U.tools.appendChild(r);
}

