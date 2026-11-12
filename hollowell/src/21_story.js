/* The story's machinery: who's who, what they say (TALK, filled by the content files), getting things,
   fainting, the fog, leaving a House with its keys, and conditions on flags. */

const PEOPLE = {};     /* id -> { name, col, voice } */
const TALK = {};       /* id -> function* (npc) : what they say now */
const BUDGE = {};      /* id -> line when pushed off their spot */
const START = { area: 'gran_room', x: 6, y: 3 };

const Story = {
    name(id) { return id === 'wren' ? G.wanderer : (PEOPLE[id] && PEOPLE[id].name) || id; },
    /* {name} in text becomes the Wanderer's name */
    /* {name} is the Wanderer's name; [tool] and the like, the button bound to it now (src/22b_controls.js) */
    fill(s) { s = String(s).replace(/\{name\}/g, G.wanderer || 'Wren'); return typeof fillKeys === 'function' ? fillKeys(s) : s; },
    cond(c) {
        if (typeof c === 'function') return c();
        return c.split('&').every(t => { t = t.trim(); return t[0] === '!' ? !Progress.flag(t.slice(1)) : Progress.flag(t); });
    },
    talk(npc) {
        /* a place can have its own words for someone (the Makers below the town talk shop) */
        const f = (G.map && G.map.def.talk && G.map.def.talk[npc.who]) || TALK[npc.who];
        if (f) return () => f(npc);
        return function* () { yield* say(npc.who, '...'); };
    },
    budged(npc) {
        const n = 'budged:' + npc.who;
        const first = !Progress.flag(n);
        Progress.set(n);
        const line = BUDGE[npc.who];
        if (first && line) UI.toast(Story.fill(typeof line === 'function' ? line() : line), 150);
        else if (first) UI.toast(Story.name(npc.who) + ': "Oop."', 120);
        Story.checkBudgedAll && Story.checkBudgedAll();
    },
    /* opened from below, a chest is right over her head when she holds its find up: from there it looked as if she were
       lifting the chest. She steps back a tile first (or aside), onto plain floor in the same room (nothing on it, nothing
       it could set off); if there's none, the find is held up high over the chest instead */
    *stepBack(p) {
        const a = p.area, c = a && p.dir === UP && p.state === 'normal' && a.at(p.tx, p.ty - 1);
        if (!(c instanceof Chest)) return false;
        const r = Cam.room, plain = (x, y) => {
            const k = a.inside(x, y) ? a.kind(x, y) : null;
            return k && !k.solid && !k.pit && !k.water && !k.hurt && !k.ledge && !k.fog && !k.ice && !k.slow && (!r || (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h))
                && !a.at(x, y) && !a.blockers.some(b => b.blocks(x, y, p)) && !a.ents.some(e => e !== p && !e.removed && e.tx === x && e.ty === y)
                && !a.walkers.some(m => m.alive !== false && tileOf(m.x) === x && tileOf(m.y) === y);
        };
        const to = [[0, 1], [-1, 0], [1, 0]].find(([dx, dy]) => plain(p.tx + dx, p.ty + dy));
        if (!to) return 'high';
        const x0 = p.x, y0 = p.y;
        for (let i = 1; i <= 8; i++) { p.x = x0 + to[0] * T * i / 8; p.y = y0 + to[1] * T * i / 8; yield 1; }
        return true;
    },
    /* the fanfare for a found thing */
    getItem(id, srcId) {
        return function* () {
            const p = G.player;
            const I = ITEMS[id] || { name: id, kind: 'quest' };
            const prevState = p.state;
            const back = yield* Story.stepBack(p);
            p.state = 'hold'; p.holding = id;
            Music.duck = true;
            Sfx.play(I.kind === 'tool' || id === 'knot' || id === 'heartstitch' ? 'item' : 'smallitem');
            G.holdUp = { id, t: 0, high: back === 'high' };
            if (I.kind === 'tool') Inv.giveTool(id);
            else if (id === 'heartpatch') { Inv.patches++; if (srcId) Inv.patchIds.push(srcId); }
            else if (id === 'heartstitch') Inv.addHeart();
            else if (id === 'key') { const h = G.map.def.house; Inv.keyCount[h] = Inv.keys(h) + 1; }
            else if (id === 'pattern') Inv.patterns.push(G.map.def.house);
            else if (id === 'plan') Inv.plans.push(G.map.def.house);
            else if (id.startsWith('b') && /^b\d+$/.test(id)) Inv.buttons += parseInt(id.slice(1));
            else Inv.items[id] = (Inv.items[id] || 0) + 1;
            yield 30;
            const line = ITEM_LINES[id] ? ITEM_LINES[id]() : `You found the {${I.kind === 'tool' ? 'red' : 'blue'}}${I.name}{/}!` + (I.desc ? ' ' + I.desc : '');
            yield* say(null, line);
            if (id === 'heartpatch' && Inv.patches % 4 === 0) { Inv.addHeart(); yield* say(null, 'Four Heart Patches stitch together into a new heart!'); }
            G.holdUp = null;
            p.state = prevState === 'hold' ? 'normal' : 'normal';
            Music.duck = false;
            if (ITEM_AFTER[id]) yield* ITEM_AFTER[id]();
        };
    },
    /* hearts ran out */
    faint() {
        return function* () {
            const p = G.player;
            G.hideHud = false;
            yield 50;
            yield* fadeOut(40);
            Inv.hp = Inv.maxHp;
            const house = G.map.def.house;
            if (house && AREAS[G.map.id].entry) {
                /* in a House, you come to at its door */
                const e = AREAS[G.map.id].entry;
                World.enter(G.map.id, e.x, e.y, { dir: UP });
                const again = Progress.flag('fainted_in_house');
                Progress.set('fainted_in_house');
                p.state = 'normal';
                yield* fadeIn(30);
                /* (said in full the first time; after that a notice, with no box to press through: a hard fight can take a
                   good many tries) */
                if (again) UI.toast('You come to by the door of the House again.', 150);
                else yield* say(null, 'You come to by the door of the House, with no idea how you got here.');
            } else {
                World.enter('gran_room', 6, 3, { dir: DOWN });
                G.player.state = 'sleep'; G.player.inBed = G.map.ents.find(e => e.skey === 'wrenbed');
                yield* fadeIn(40);
                yield 40;
                G.player.state = 'normal'; G.player.inBed = null;
                yield* Story.wakeAfterFaint();
            }
        };
    },
    *wakeAfterFaint() {
        const n = (Progress.get('faintHome') || 0) + 1; Progress.set('faintHome', n);
        /* (past the last of them, a notice: the third was said over and over) */
        if (n > FAINT_LINES.length) { UI.toast('Your own bed again.', 150); return; }
        yield* say(null, FAINT_LINES[n - 1]);
    },
    /* the fog: you can't go further, it pulls you back */
    fogPull(p) {
        Script.run(function* () {
            const n = (Progress.get('fogTries') || 0) + 1; Progress.set('fogTries', n);
            p.flyHome();
            yield () => p.state === 'normal';
            /* (past the last of them, a notice: the third was said over and over) */
            if (n > FOG_LINES.length) UI.toast('The fog turns you round again.', 150);
            else yield* say(null, FOG_LINES[n - 1]);
        });
    },
    /* small keys fly back into their House */
    /* small keys belong to their House: outside, they tug toward it (S08) */
    leaveHouse(house) {
        const k = Inv.keys(house);
        if (k > 0) {
            if (!Progress.flag('keys_tug')) G.pendingToast = 'The small key in your pocket tugs back towards the House, like a dog on a lead.';
            Progress.set('keys_tug');
        }
    },
};

const ITEM_LINES = {};     /* id -> () => the line when found */
/* true the first time it's asked about a thing, and never again (a flag, so it holds across saves): a line said often
   can be said in full once and shorter after */
function firstTime(id) { if (Progress.flag('told:' + id)) return false; Progress.set('told:' + id); return true; }
const ITEM_AFTER = {};     /* id -> function* after the fanfare */
const FAINT_LINES = [
    "You wake up in your own bed. There's a cup of warm milk on the stool, and Gran's humming downstairs. You must have walked home in your sleep... somehow.",
    "Home in bed again. Your scarf is folded on the stool. You don't remember the walk at all.",
    "Your bed. Of course. Everything comes home in the end.",
];
const FOG_LINES = [
    "The fog is thick as wool. A few steps in, something tugs you gently back the way you came.",
    "The fog again. It won't let you through: it just turns you round and sends you back.",
    "Everyone knows you can't go into the Drift. The Way always brings you back.",
];
