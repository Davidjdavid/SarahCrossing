/* Indoors in Hollowell. interior() lays out a room: the back wall two tiles high, side walls, a doorway
   in the front wall that goes back out to the building's door in town. */

const INTERIOR_DOOR = {};      /* interior id -> [x, y] where you stand coming in */

function interior(def) {
    const w = def.w, h = def.h, dx = def.door;
    const rows = [];
    for (let y = 0; y < h; y++) {
        let r = '';
        for (let x = 0; x < w; x++) {
            if (y <= 1 || x === 0 || x === w - 1) r += '#';
            else if (y === h - 1) r += (x === dx ? '.' : '#');
            else r += def.floor ? def.floor(x, y) : '.';
        }
        rows.push(r);
    }
    if (def.rows) def.rows(rows);
    INTERIOR_DOOR[def.id] = [dx, h - 2];
    const ents = (def.ents || []).slice();
    if (def.out) {
        const b = HUB_BUILDINGS.find(b => b.to === def.id);
        const ox = OW.bw * 1, oy = OW.bh * 1;
        ents.push({ k: 'warp', x: dx, y: h - 1, to: 'hollow', tx2: ox + b.x + b.door, ty2: oy + b.y + b.h, face: 'down', dir: 'down' });
        ents.push({ k: 'deco', x: dx, y: h - 2, look: 'doormat', solid: false, oy: 8, baseY: -100 });
    }
    return defArea(Object.assign({ family: 'interior', theme: 'house', music: 'home', rooms: [{ x: 0, y: 0, w, h }] }, def, { rows, ents, entry: { x: dx, y: h - 2 } }));
}

/* Gran's house: downstairs */
interior({
    id: 'gran_house', name: "Gran's house", place: 'Home', w: 13, h: 9, door: 6, out: true,
    floor: (x, y) => (x >= 4 && x <= 8 && y >= 4 && y <= 6) ? ',' : '.',
    ents: [
        { k: 'deco', x: 5, y: 1, look: 'hearth', ox: 0, oy: -16, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 2, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'portrait', x: 9, y: 1 },
        { k: 'deco', x: 10, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 5, y: 4, look: 'table', ox: 0, oy: 0, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 4, y: 4, look: 'stool', solid: false }, { k: 'deco', x: 7, y: 4, look: 'chair', solid: false },
        /* (the morning she's gone: her cup on the table, the tea in it gone cold) */
        { k: 'deco', x: 6, y: 4, look: 'teacup', solid: false, ox: 3, oy: 2, baseY: 20, if: 'reveal2&!unwound' },
        { k: 'deco', x: 11, y: 6, look: 'plant' },
        { k: 'cellar', x: 1, y: 6 },
        { k: 'warp', x: 1, y: 2, to: 'gran_room', tx2: 1, ty2: 3, face: 'down' },
        { k: 'deco', x: 1, y: 2, look: 'stairs_up', solid: false, baseY: -100 },
        { k: 'npc', who: 'gran', x: 8, y: 3, face: 'down', if: '!ceremony' },
        { k: 'npc', who: 'gran', x: 6, y: 3, face: 'down', if: 'gran_home' },
    ],
});
/* Wren's room upstairs */
interior({
    id: 'gran_room', name: 'Your room', place: 'Home', w: 10, h: 7, door: -1,
    floor: (x, y) => (x >= 4 && x <= 7 && y >= 3 && y <= 4) ? ',' : '.',
    ents: [
        { k: 'deco', x: 4, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'bed', x: 7, y: 2, look: 'bed', id: 'wrenbed' },
        { k: 'deco', x: 2, y: 2, look: 'desk', ox: 0, oy: 0, solid: [[0, 0], [1, 0]], text: "Your desk. A drawing of the Well, a pencil worn to a stub, and a list: THINGS TO SEE ON MY WANDER. It's very long." },
        { k: 'deco', x: 8, y: 5, look: 'chest_wood', text: "Your toy box. A wooden horse, a top, a spool of red thread you've had since you were tiny." },
        { k: 'warp', x: 1, y: 2, to: 'gran_house', tx2: 2, ty2: 2, face: 'down' },
        { k: 'deco', x: 1, y: 2, look: 'stairs_down', solid: false, baseY: -100 },
    ],
});
interior({
    id: 'inn', name: 'The Spool & Thimble', place: 'The Inn', w: 15, h: 9, door: 7, out: true, music: 'inn',
    onEnter: a => TownLooks.inn(a),
    floor: (x, y) => (y === 4 && x > 1 && x < 13) ? ':' : '.',
    ents: [
        { k: 'deco', x: 2, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'deco', x: 12, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'deco', x: 5, y: 2, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 2, y: 5, look: 'table', solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 11, y: 5, look: 'table', solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 11, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 9, y: 2, look: 'pedestal', id: 'pedestal', text: 'An empty velvet cushion under glass. A brass plate: THE WANDERER\'S KNOT.' },
        { k: 'staffdoor', x: 13, y: 2 },
        /* once the Makers have owned up, the Staff door stands ajar: lamplight from below on the floorboards */
        { k: 'deco', x: 13, y: 3, look: 'staff_light', solid: false, baseY: -100, if: 'reveal1' },
        /* the attic stairs: the Tidiness Trials, once the first Knot is tied (S28, src/53_trials.js) */
        { k: 'deco', x: 1, y: 2, look: 'stairs_up', solid: false, baseY: -100 },
        { k: 'warp', x: 1, y: 2, to: 'inn_attic', tx2: 2, ty2: 9, face: 'up', if: 'd1' },
        { k: 'deco', x: 1, y: 2, look: 'rope_across', solid: [[0, 0]], baseY: 100, text: "A rope across the attic stairs, and a card: PRIVATE. TIDYING IN PROGRESS.", if: '!d1' },
        { k: 'npc', who: 'ives', x: 6, y: 1, face: 'down', counter: true },
    ],
});
interior({
    id: 'store', name: 'Thimble & Things', place: 'Thimble & Things', w: 11, h: 8, door: 5, out: true, music: 'shop',
    ents: [
        { k: 'deco', x: 3, y: 2, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 1, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 8, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 1, y: 5, look: 'barrel' }, { k: 'deco', x: 9, y: 5, look: 'plant' },
        { k: 'npc', who: 'thimble', x: 4, y: 1, face: 'down', counter: true },
        { k: 'shop', x: 3, y: 3 },
    ],
});
interior({
    id: 'bakery', name: "Rosa's Bakery", place: 'The Bakery', w: 11, h: 8, door: 5, out: true, music: 'shop',
    ents: [
        { k: 'deco', x: 3, y: 2, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 8, y: 1, look: 'hearth', ox: 0, oy: -16, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 1, y: 5, look: 'table', solid: [[0, 0], [1, 0]] },
        { k: 'npc', who: 'rosa', x: 4, y: 1, face: 'down', counter: true },
    ],
});
interior({
    id: 'tailor', name: "Seam's", place: 'The Tailor', w: 10, h: 8, door: 5, out: true, music: 'shop',
    ents: [
        { k: 'deco', x: 2, y: 2, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 7, y: 2, look: 'dressform', solid: [[0, 0]] },
        { k: 'deco', x: 8, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'deco', x: 1, y: 5, look: 'rug_small', solid: false, baseY: -100 },
        { k: 'npc', who: 'seam', x: 3, y: 1, face: 'down', counter: true },
    ],
});
/* the toy shop, shut "for the season": the front shop, and behind a wall (a door, and a little hole low down) Jory's
   back room (a favour, src/51c_town_favours.js) */
interior({
    id: 'toys', name: "Jory's Toys", place: "Jory's Toys", w: 12, h: 10, door: 6, out: true, music: 'shop',
    rows: r => { r[4] = '###.####O###'; },
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' } },
    ents: [
        { k: 'deco', x: 1, y: 7, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 2, y: 7, look: 'sign_closed', solid: [[0, 0]], oy: -14, baseY: 40, text: 'A card on the counter: GONE FOR THE SEASON. BACK WHEN I\'M BACK. -J.' },
        { k: 'deco', x: 9, y: 5, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 6, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
    ],
    if: true,
});
interior({
    id: 'school', name: 'The Schoolhouse', place: 'School', w: 13, h: 9, door: 6, out: true, music: 'home',
    ents: [
        { k: 'deco', x: 5, y: 1, look: 'blackboard', ox: 0, oy: -8, solid: false, baseY: -100, id: 'blackboard' },
        { k: 'blackboard', x: 6, y: 2 },
        { k: 'deco', x: 2, y: 4, look: 'desk', solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 5, y: 4, look: 'desk', solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 8, y: 4, look: 'desk', solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 11, y: 2, look: 'plant' },
    ],
});
/* the Lost & Found: Mabel's counter, her shelves of strays, and the strays on the floor (a favour, src/51c_town_favours.js) */
interior({
    id: 'lostfound', name: 'Lost & Found', place: 'Lost & Found', w: 12, h: 9, door: 6, out: true, music: 'shop',
    ents: [
        { k: 'deco', x: 2, y: 2, look: 'counter', ox: 0, oy: -6, solid: [[0, 0], [1, 0], [2, 0]] },
        { k: 'deco', x: 8, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]], text: "Shelves of strays: a single glove, a teaspoon, a bootlace, a doorknob with no door. Every one has a little L scratched on it somewhere." },
        { k: 'deco', x: 10, y: 7, look: 'barrel' }, { k: 'deco', x: 1, y: 7, look: 'chest_wood' },
        { k: 'npc', who: 'mabel', x: 3, y: 1, face: 'down', counter: true },
    ],
});
interior({
    id: 'tuckhouse', name: "Tuck's house", place: "Tuck's house", w: 10, h: 7, door: 5, out: true,
    ents: [
        { k: 'deco', x: 2, y: 2, look: 'table', solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 7, y: 1, look: 'bed', ox: 0, oy: -12, solid: [[0, 0]] },
        { k: 'deco', x: 4, y: 1, look: 'window', ox: 0, oy: -8, solid: false, baseY: -100 },
        { k: 'deco', x: 1, y: 4, look: 'plant' },
    ],
});
interior({
    id: 'clinic', name: "Doctor Mallow's", place: 'The Clinic', w: 12, h: 8, door: 6, out: true, music: 'home',
    ents: [
        { k: 'deco', x: 2, y: 1, look: 'bed_gran', ox: 0, oy: -12, solid: [[0, 0]] }, { k: 'deco', x: 4, y: 1, look: 'bed_gran', ox: 0, oy: -12, solid: [[0, 0]] },
        { k: 'deco', x: 8, y: 2, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'deco', x: 10, y: 5, look: 'plant' },
        { k: 'npc', who: 'mallow', x: 6, y: 3, face: 'down' },
    ],
});

/* a bed you can sleep in: your mark at home, heals and saves */
SPAWN.bed = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART[p.look || 'bed'], solid: [[0, 0], [0, 1]], ox: -1, oy: -2 });
    pr.mark = true;
    pr.interact = () => { Script.run(Story.sleepInBed()); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && (f.ty === ty || f.ty === ty + 1);
    pr.draw = function (cx, cy) {
        Prop.prototype.draw.call(this, cx, cy);
    };
    return pr;
};
/* the cellar door in Gran's house: locked */
SPAWN.cellar = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.cellar_door, solid: [[0, 0]], oy: 0 });
    pr.sortY0 = -50;
    pr.interact = () => { Script.run(Story.cellarDoor()); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
function initInteriorArt() {
    /* Gran's chair at the kitchen table, its back to the wall side; and a cup and saucer */
    ART.chair = paintSprite(14, 18, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        R('#6b4128', 2, 12, 2, 6); R('#6b4128', 10, 12, 2, 6);
        R('#9a6438', 10, 0, 3, 12); R('#c9925a', 10, 0, 3, 2); R('#c9925a', 11, 3, 1, 7);
        R('#c9925a', 1, 8, 12, 4); R('#e6c08a', 1, 8, 9, 1); R('#9a6438', 1, 11, 12, 1);
    });
    ART.teacup = paintSprite(10, 8, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        R('#e8dcc8', 0, 6, 9, 1);
        R('#fbf6ea', 1, 2, 6, 4); R('#d8d0c0', 5, 2, 2, 4); R('#6b4128', 2, 2, 4, 1);
        R('#fbf6ea', 7, 3, 1, 1); R('#fbf6ea', 8, 3, 1, 2); R('#fbf6ea', 7, 5, 1, 1);
    });
    ART.stairs_up = paintSprite(16, 16, x => { for (let i = 0; i < 4; i++) { x.fillStyle = '#c9925a'; x.fillRect(0, i * 4, 16, 3); x.fillStyle = '#7a4e32'; x.fillRect(0, i * 4 + 3, 16, 1); } x.fillStyle = '#5a3a26'; x.fillRect(0, 0, 2, 16); x.fillRect(14, 0, 2, 16); }, false);
    ART.rope_across = paintSprite(16, 16, x => { x.fillStyle = '#c9925a'; x.fillRect(1, 2, 2, 12); x.fillRect(13, 2, 2, 12); x.fillStyle = '#c42b4a'; for (let i = 0; i < 10; i++) x.fillRect(3 + i, 6 + Math.round(Math.sin(i / 9 * Math.PI) * 2), 1, 2); x.fillStyle = '#fbf6ea'; x.fillRect(5, 9, 6, 4); });
    ART.stairs_down = paintSprite(16, 16, x => { x.fillStyle = '#2a1f2d'; x.fillRect(0, 0, 16, 16); for (let i = 0; i < 4; i++) { x.fillStyle = '#9a6438'; x.fillRect(2, i * 4 + 1, 12, 2); } }, false);
    ART.pedestal = paintSprite(16, 22, x => {
        x.fillStyle = '#9a6438'; x.fillRect(3, 12, 10, 10); x.fillStyle = '#c9925a'; x.fillRect(3, 12, 10, 2);
        x.fillStyle = '#b0434a'; x.fillRect(4, 8, 8, 4); x.fillStyle = '#d0608e'; x.fillRect(4, 8, 8, 1);
        x.globalAlpha = 0.5; x.fillStyle = '#d8f2ff'; x.fillRect(2, 0, 12, 12); x.globalAlpha = 1;
        x.fillStyle = '#ffffff'; x.fillRect(3, 1, 2, 4);
    });
    ART.dressform = paintSprite(14, 26, x => {
        x.fillStyle = '#6b4128'; x.fillRect(6, 18, 2, 6); x.fillRect(3, 24, 8, 2);
        x.fillStyle = '#d0608e'; x.fillRect(2, 4, 10, 14); x.fillStyle = '#f07a9a'; x.fillRect(3, 4, 4, 14);
        x.fillStyle = '#c9925a'; x.fillRect(5, 1, 4, 3);
    });
    ART.staffdoor = paintSprite(16, 32, x => { x.fillStyle = '#5a3a26'; x.fillRect(1, 2, 14, 30); x.fillStyle = '#7a4e32'; x.fillRect(2, 3, 12, 28); x.fillStyle = '#fbf6ea'; x.fillRect(4, 8, 8, 4); x.fillStyle = '#c42b4a'; x.fillRect(5, 9, 6, 1); x.fillRect(5, 11, 4, 1); x.fillStyle = '#f7d64a'; x.fillRect(11, 18, 2, 2); });
    ART.sign_closed = paintSprite(12, 10, x => { x.fillStyle = '#fbf6ea'; x.fillRect(0, 2, 12, 8); x.fillStyle = '#c42b4a'; x.fillRect(2, 4, 8, 1); x.fillRect(2, 6, 6, 1); });
}
CONTENT_INIT.unshift(initInteriorArt);

/* the blackboard in the school: the Rules of the Return (they change as the Wander goes on) */
SPAWN.blackboard = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: null, solid: [] });
    pr.interact = () => { Script.run(Story.blackboard()); return true; };
    pr.talkBox = (pl, f) => f.ty <= 2 && f.tx >= 5 && f.tx <= 7;
    return pr;
};

/* the picture that faces the wall (S02, Linnet's first note) */
SPAWN.portrait = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.portrait_turned, solid: [], oy: -10 });
    pr.baseY = -100;
    pr.interact = () => {
        Script.run(function* () {
            if (!Inv.has('gloves')) { yield* say(null, "A picture, turned to face the wall. It has always been like that. When you try to turn it, it slides straight back, like everything does."); return; }
            pr.im = ART.portrait_linnet; Sfx.play('tug');
            yield* say(null, 'You grip the frame with your Gloves and turn it round. It strains to turn back, but you hold on.');
            yield* say(null, 'A young woman with a green scarf grins out of the painting, wind in her hair. She looks a bit like you. She looks a bit like Gran.');
            if (!Progress.flag('linnet1')) {
                Progress.set('linnet1'); Progress.addNote('linnet1'); Stats.count('secret:linnet'); Progress.set('portrait');
                yield* say(null, 'A folded note slips out from behind the frame and drops at your feet.');
                yield* say(null, '"' + LINNET_NOTES[1].text + '"');
            }
            const gran = pr.area.ents.find(e => e.who === 'gran');
            if (gran) yield* say('gran', "...Put that back, love. Please. Some things are best left facing the wall.");
            pr.im = ART.portrait_turned; Sfx.play('pop');
            yield* say(null, 'You let go, and the picture swings back to face the wall.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
