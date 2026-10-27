/* ---- 55a_scrapbook.js ---- */
/* The camera's scrapbook (David, 27 October): a photo says what's in it, in little tags under it (who, where, what's
   about, the weather and the sky, anything special going on, the filter), and the scrapbook keeps a page for everything
   ever photographed with a short bio, how many photos it's in and the day it was first taken. It counts what Sarah has
   found in each part, but never out of how many: it isn't something to finish. S.scrap: { 'npc:maki': { n, first } } */
const SCRAP_PARTS = [['npc', 'Neighbors'], ['place', 'Places'], ['wild', 'Wildlife'], ['thing', 'Things'], ['sky', 'Weather and sky'], ['moment', 'Special moments']];
const SCRAP_EMPTY = { npc: 'Nobody yet. Neighbors love a photo.', place: 'No places yet.', wild: 'No animals yet. They scatter if Sarah runs at them.',
    thing: 'Nothing yet. Things lying about count, and furniture indoors.', sky: 'No weather yet.', moment: 'Nothing special yet. Keep the camera handy.' };
const SCRAP_BIO = {
    npc: {
        maki: 'A sushi roll, rolled very tightly. Measures everything twice and sorts rice by grain size.',
        kai: 'A poke bowl, mostly toppings and good vibes. Says the surf is best around 11 AM.',
        basil: 'Pad thai with a sprig of Thai basil. Runs the noodle cart on the square at night.',
        wonton: 'Keeper of the hot spring, which is a spring and not soup. Wary of green onions.',
        chili: 'A pepper, and spicy about it. Always blushing; sometimes it means respect.',
        coco: 'A truffle who hears everything on the island first, and passes it on second.',
        cece: 'A cheesecake who bakes when nervous, which is always. Worried about cracks.',
        clementine: 'Like the fruit, but more expensive. Runs the boutique; sunglasses at night, on principle.',
        cuke: 'A cucumber, never a pickle, who has been up since 4 AM jogging.',
        sully: 'A Boston cream pie with a wicked nice kiln. Runs the pottery studio.',
        ginger: 'Gingerbread, and the island\'s builder. Has opinions about porches and mailboxes.',
        brulee: 'A crème brûlée who runs the museum. Please do not tap the top.',
        mac: 'Mac and cheese, mostly cheese, emotionally. Runs the restaurant and makes sure everyone eats.',
        fortune: 'Keeps the island\'s shop, and was there to meet Sarah the morning she arrived.',
        floss: 'Runs Floss & Gloss, the salon: any hairstyle, any color.',
        waffle: 'Runs the shop of island displays. Every square has room for something.',
        wasabi: 'The DJ at Club Wasabi. The beat drops whenever it likes.',
        goat: 'The island\'s goat. Favorite thing: everything, eaten.',
        joe: 'Sarah\'s best friend. Writes poems, some of them about frogs.',
    },
    place: {
        home: 'Home. The door\'s always open, and the kettle\'s never far.',
        shop: 'Fortune\'s shop: tools, seeds, furniture, and what\'s new this week.',
        townhall: 'The Town Hall, on the square, where the Cozy Council sits.',
        postoffice: 'The Post Office: letters out today, replies tomorrow.',
        bank: 'The Bank: savings with a little interest every morning.',
        museum: 'The museum, where Brulee hangs what the island makes.',
        boutique: 'Clementine\'s boutique. Orange is the new orange.',
        salon: 'Floss & Gloss, the salon on the alley.',
        studio: 'Sully\'s pottery studio, and its wicked nice kiln.',
        displays: 'Waffle\'s shop of things to set out on the island.',
        restaurant: 'Mac\'s, where nobody leaves hungry.',
        arcade: 'The arcade: a cabinet for every game, and a door at the back.',
        club: 'Club Wasabi: the dance floor, the karaoke stage, the disco ball.',
        builder: 'Ginger\'s workshop. Bigger houses, new roofs, opinions about mailboxes.',
        lighthouse: 'The lighthouse at the point. Its beam sweeps the sea all night.',
        barn: 'The barn up at the farm.',
        bigtree: 'The grand tree in the middle of the square, twice as tall as any other.',
        fountain: 'The fountain on the square: two bowls, four bronze fish and a jet.',
        statue: 'David\'s statue, on the lawn by Market Lane.',
        windmill: 'The windmill on the farm, turning whenever there\'s a breeze.',
        well: 'The old well. Some say it grants wishes. Some say it\'s just a well.',
        pier: 'The pier, where the boat came in.',
        boat: 'The boat Sarah came on, tied up at the end of the pier.',
        spring: 'Wonton\'s hot spring: 104 degrees, relaxing, not cooking.',
        waterfall: 'The falls, coming down off the mountain in steps.',
        camp: 'The campsite: tents, a campfire and a picnic table.',
        farm: 'The farm: fields, a scarecrow or two, and the community garden.',
    },
    wild: {
        bird: 'Little birds peck about in the grass and scatter at a run.', squirrel: 'Squirrels live in the woods. Always busy.',
        rabbit: 'Rabbits sit very still, until they don\'t.', deer: 'Deer in the forest, now and then, if Sarah is quiet.',
        owl: 'The owl only comes out at night. It blinks slowly at everyone.', gull: 'Gulls on the beach, and over it.',
        crab: 'Crabs on the sand, ready to dig in.', duck: 'Ducks on the pond, paddling about.', frog: 'Frogs by the pond. One jump and gone.',
        butterfly: 'Butterflies over the flowers on a sunny day.', dolphin: 'Dolphins leaping out at sea.',
        boat: 'A boat out on the water, going somewhere.', plane: 'A plane, high over the far edge of the sea.',
        balloon: 'A hot air balloon drifting over the island.',
    },
    sky: {
        sunny: 'A clear, bright day.', cloudy: 'A soft grey day.', rain: 'Rain on the island. Everything smells green.', snow: 'Snow on the island.',
        dawn: 'Early morning, the sun just up.', sunset: 'The evening, the sun going down.', night: 'Night on the island, the lamps lit.',
        rainbow: 'A rainbow in the mist at the foot of the falls, the morning after rain.', aurora: 'The northern lights, low over the north on a clear winter night.',
        fairy: 'A ring of glowing toadstools in a clearing. Nobody knows who planted them.', turtles: 'Sea turtle hatchlings scrambling down the beach to the sea at dawn.',
    },
};
const Scrapbook = {
    st() { if (!S.scrap || typeof S.scrap !== 'object') S.scrap = {}; return S.scrap; },
    /* is this spot in the photo? (world pixels; lift: how high above the ground) */
    onScreen(x, y, lift) {
        const v = G.view;
        if (typeof R3 !== 'undefined' && R3.active()) { const p = R3.project(x, y, lift || 0); return !p.behind && p.x >= 0 && p.x <= v.w && p.y >= 0 && p.y <= v.h; }
        const sx = x - G.cam.x, sy = y - (lift || 0) - G.cam.y;
        return sx >= 0 && sx <= v.w && sy >= 0 && sy <= v.h;
    },
    /* everything in the photo being taken: [{ k, label }] */
    seen() {
        const a = G.area, out = [], have = new Set(), add = (k, label) => { if (!have.has(k)) { have.add(k); out.push({ k, label }); } };
        if (!a) return out;
        const on = (x, y, lift) => this.onScreen(x, y, lift);
        const island = a.id === 'island';
        for (const n of NPCs.here()) if (!n.hidden && NPC_DEFS[n.id] && on(n.x, n.y, 10)) add('npc:' + n.id, NPC_DEFS[n.id].name);
        for (const e of a.ents) {
            if (e === G.player || e.hidden) continue;
            if (e.npc && NPC_DEFS[e.id] && on(e.x, e.y, 10)) add('npc:' + e.id, NPC_DEFS[e.id].name);
            else if (e.kind === 'building' && on(e.x, e.y - 8)) add('place:' + e.id, e.id.startsWith('h_') ? bldName(e.id) : cap(bldName(e.id)));
            else if (e.kind === 'bigtree' && on(e.x, e.y, 20)) add('place:bigtree', 'The grand tree');
            else if (e.kind === 'sailboat' && on(e.x, e.y)) add('place:boat', 'Sarah\'s boat');
            else if (e.px != null && on(e.x, e.y)) {
                const P = { fountain_grand: ['fountain', 'The fountain'], statue_david: ['statue', 'David\'s statue'], windmill: ['windmill', 'The windmill'], well: ['well', 'The well'],
                    tent: ['camp', 'The campsite'], scarecrow: ['farm', 'The farm'] }[e.kind];
                if (P) add('place:' + P[0], P[1]);
            } else if (e.kind === 'item' && on(e.x, e.y) && ITEMS[e.id]) add('thing:' + e.id, itemName(e.id));
            else if (e.furn && e.item && ITEMS[e.item.id] && on(e.x, e.y)) add('thing:' + e.item.id, itemName(e.item.id));
            else if (e.kind === 'gflower' && on(e.x, e.y) && e.pl) add('thing:flower_' + e.pl.kind + '_' + e.pl.ci, itemName('flower_' + e.pl.kind + '_' + e.pl.ci));
        }
        if (island) {
            const pr = W0.pier;
            if (pr && on((pr.x0 + 1) * TILE, (pr.y0 + pr.y1) / 2 * TILE)) add('place:pier', 'The pier');
            for (const f of W0.waterfalls || []) { const [x, y] = f.tiles[0]; if (on((x + 1) * TILE, (y + 1) * TILE)) { add('place:waterfall', 'The falls'); break; } }
            if (W0.camp && on(W0.camp.x * TILE, W0.camp.y * TILE)) add('place:camp', 'The campsite');
            // (the hot spring: a few of its tiles on screen)
            const [x0, y0] = [Math.floor(G.player.x / TILE) - 12, Math.floor(G.player.y / TILE) - 10];
            spring: for (let y = y0; y < y0 + 20; y++) for (let x = x0; x < x0 + 24; x++) if (a.waterAt(x, y) === 'h' && on((x + 0.5) * TILE, (y + 0.5) * TILE)) { add('place:spring', 'The hot spring'); break spring; }
            if (typeof Critters !== 'undefined') for (const c of Critters.list) if (CRITTER[c.kind] && on(c.x, c.y, c.alt || 0)) add('wild:' + c.kind, cap(c.kind === 'butterfly' ? 'butterflies' : c.kind + 's').replace('Deers', 'Deer'));
            if (typeof SeaSky !== 'undefined') {
                for (const b of SeaSky.boats || []) if (on(b.x, b.y)) add('wild:boat', 'A boat at sea');
                for (const q of SeaSky.dolphins || []) if (q.t >= 0 && on(q.x, q.y)) add('wild:dolphin', 'Dolphins');
                for (const s of SeaSky.sky || []) if ((s.kind === 'plane' || s.kind === 'balloon') && on(s.x, s.y, 40)) add('wild:' + s.kind, s.kind === 'plane' ? 'A plane' : 'A hot air balloon');
            }
            // the sky and the weather (outdoors only), and what the new look shows now and then
            const h = Clock.hourF();
            const w = G.weather || 'sunny';
            add('sky:' + w, { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow' }[w] || cap(w));
            if (h >= 21 || h < 5) add('sky:night', 'Night'); else if (h < 7.5) add('sky:dawn', 'Dawn'); else if (h >= 18) add('sky:sunset', 'Sunset');
            if (typeof EnvSights !== 'undefined' && Env.on) {
                const Sg = EnvSights;
                if (Sg.bow && Sg.bow.m.visible && on(Sg.bow.m.position.x * TILE, Sg.bow.m.position.z / R3_ZS * TILE, 30)) add('sky:rainbow', 'A rainbow');
                if (Sg.ring && Sg.ring.g.visible && on(Sg.ring.g.position.x * TILE, Sg.ring.g.position.z / R3_ZS * TILE)) add('sky:fairy', 'A fairy ring');
                const aur = R3.sky && R3.sky.material.uniforms.uAur;
                if (aur && aur.value > 0.2) add('sky:aurora', 'Northern lights');
                if (Sg.nest && (Sg.turtles || []).some(q => q.phase !== 'wait' && q.d && q.d.root.visible && on(q.x * TILE, q.y * TILE))) add('sky:turtles', 'Turtle hatchlings');
            }
        }
        // a holiday or a festival today
        for (const hd of (typeof holidaysToday === 'function' ? holidaysToday() : [])) add('moment:' + hd.id, hd.name);
        return out;
    },
    /* the photo's tags, and the scrapbook's pages for them */
    note(tags) {
        const st = this.st(), day = Clock.dayNum(), fresh = [];
        for (const t of tags) {
            const r = st[t.k] || (st[t.k] = { n: 0, first: day });
            if (!r.n) fresh.push(t);
            r.n++;
            if (t.label) r.label = t.label;
        }
        Save.touch();
        return fresh;
    },
    bio(k) {
        const [part, id] = k.split(':');
        const b = SCRAP_BIO[part] && SCRAP_BIO[part][id];
        if (b) return b;
        if (part === 'npc') return NPC_DEFS[id] ? `${NPC_DEFS[id].name}, a friend on ${S.islandName || 'the island'}.` : '';
        if (part === 'place' && id.startsWith('h_')) return NPC_DEFS[id.slice(2)] ? `Where ${NPC_DEFS[id.slice(2)].name} lives.` : '';
        if (part === 'thing' && ITEMS[id]) return `${ITEM_TYPES[ITEMS[id].type] || 'A thing'}${ITEMS[id].price ? `, worth about ${fmtNum(ITEMS[id].price)} sand dollars` : ''}.`;
        if (part === 'moment') { const h = typeof HOLIDAYS !== 'undefined' && HOLIDAYS.find(x => x.id === id); return h ? h.note || `${h.name} on the island.` : ''; }
        return '';
    },
    icon(k) {
        const [part, id] = k.split(':');
        if (part === 'npc' && NPC_DEFS[id]) return NPC_DEFS[id].human ? `${NPC_DEFS[id].human}_down_stand` : `${NPC_DEFS[id].sprite || id}_0`;
        if (part === 'thing' && ITEMS[id]) return itemIcon(id);
        if (part === 'moment') { const h = typeof HOLIDAYS !== 'undefined' && HOLIDAYS.find(x => x.id === id); return h ? holidayIcon(h) : null; }
        return null;
    },
    /* the scrapbook: a part for each kind of thing, each page with its bio */
    open(back) {
        const st = this.st();
        const P = UI.open({ title: 'Scrapbook', back: back || null });
        P.body.appendChild(el('p', 'muted', 'Everything Sarah has taken a photo of, a page each.'));
        for (const [part, name] of SCRAP_PARTS) {
            const keys = Object.keys(st).filter(k => k.startsWith(part + ':') && st[k].n > 0).sort((x, y) => st[x].first - st[y].first || (st[x].label || x).localeCompare(st[y].label || y));
            P.body.appendChild(el('h3', 'todo-h', keys.length ? `${name} · ${keys.length}` : name));
            if (!keys.length) { P.body.appendChild(el('p', 'muted', SCRAP_EMPTY[part])); continue; }
            const list = el('div', 'list');
            for (const k of keys) {
                const r = st[k], row = el('div', 'row task'), t = el('div', 't'), ic = this.icon(k);
                if (ic && Assets.frames[ic]) row.appendChild(iconCanvas(ic, 40));
                t.appendChild(el('b', null, r.label || k.split(':')[1]));
                const bio = this.bio(k);
                if (bio) t.appendChild(el('span', null, bio));
                t.appendChild(el('span', 'muted', ` In ${r.n} ${plural(r.n, 'photo')} · first ${dayDate(r.first)}`));
                row.appendChild(t);
                list.appendChild(row);
            }
            P.body.appendChild(list);
        }
    },
};
