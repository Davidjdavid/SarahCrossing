/* ---- 6zu_outdoor.js ---- */
/* Outdoor furniture (David, 28 October): Waffle's island displays sorted into kinds, with many more of each kind (more
   lamps, benches, fences, statues, hedges...), each in four colors as IslandMart's furniture is, a few of each kind in the
   shop each day. Every piece is a model now (furn_j.py), and every piece is furniture too: a park bench can go in the
   house, and anything that stands on the floor indoors can go outside with Island edit (a paint easel on the lawn), see
   dispDef in 6j_displays.js. The new pieces' pictures for the flat views and the menus are rendered from their models
   (furniture.py --sprites, tools/sprites_to_atlas.py). */
const OUTDOOR_CATS = [['lights', 'Lights'], ['seats', 'Benches and seats'], ['fences', 'Fences'], ['statues', 'Statues and gnomes'],
    ['standing', 'Signs, tables and things'], ['plants', 'Hedges and plants'], ['fun', 'And more']];
/* how many of each kind Waffle has in a day */
const OUTDOOR_DAILY = { lights: 2, seats: 2, fences: 2, statues: 2, standing: 3, plants: 3, fun: 1 };
/* the new pieces: [name, wide, kind, price, talk, extras] */
const OUTDOOR_NEW = {
    od_lamp_double: ['Double street lamp', 1, 'lights', 2600, 'Two lamps on one post. Twice the light, twice the moths.', { light: 48, lamp: true }],
    od_path_light: ['Path lights', 1, 'lights', 700, 'Three little lights in a cluster, glowing at ankle height. Very polite lights.', { light: 22 }],
    od_lantern_post: ['Lantern post', 1, 'lights', 1500, 'A paper lantern hanging from a hook. It sways a little, even when there is no wind.', { light: 30 }],
    od_string_lights: ['String lights', 2, 'lights', 2200, 'A string of little colored bulbs between two posts. Instant party.', { light: 36 }],
    od_firepit: ['Fire pit', 1, 'lights', 2400, 'A ring of stones with a cozy fire. Sarah warms her hands. Marshmallows would be perfect.', { light: 46, fire: true }],
    od_iron_bench: ['Iron garden bench', 2, 'seats', 3200, '', { seat: true }],
    od_adirondack: ['Adirondack chair', 1, 'seats', 1800, '', { seat: true }],
    od_stump: ['Stump seat', 1, 'seats', 400, '', { seat: true }],
    od_porch_swing: ['Porch swing', 2, 'seats', 4200, '', { seat: true }],
    od_deck_chair: ['Deck chair', 1, 'seats', 900, '', { seat: true }],
    od_fence_rail: ['Split-rail fence', 1, 'fences', 350, 'A split-rail fence. Rustic. A squirrel uses it as a highway.'],
    od_fence_iron: ['Iron fence', 1, 'fences', 600, 'A wrought-iron fence with little spear tops. Fancy, but friendly.'],
    od_fence_bamboo: ['Bamboo fence', 1, 'fences', 450, 'A bamboo fence tied with dark cord. It clacks softly in the breeze.'],
    od_fence_stone: ['Low stone wall', 1, 'fences', 800, 'A low wall of stacked stones. Good for sitting on. Also for being a wall.'],
    od_fence_rope: ['Rope fence', 1, 'fences', 300, 'A rope swagged between two posts. A very gentle way of saying "not here".'],
    od_fence_lattice: ['Garden lattice', 1, 'fences', 700, 'A white lattice with a vine climbing it. The vine is in no hurry.'],
    od_gnome_fish: ['Fishing gnome', 1, 'statues', 900, 'A gnome fishing off a rock. He has never caught anything. He is very happy.'],
    od_owl: ['Owl statue', 1, 'statues', 1400, 'A stone owl. It watches the path. Who? It. It watches.'],
    od_cat: ['Cat statue', 1, 'statues', 1200, 'A stone cat with its tail round its paws. It looks like it knows something.'],
    od_turtle: ['Turtle statue', 1, 'statues', 1100, 'A stone turtle, very slowly going nowhere. Respect.'],
    od_mushroom: ['Toadstool', 1, 'statues', 800, 'A giant spotted toadstool. Sarah checks for fairies. None today.'],
    od_sundial: ['Sundial', 1, 'standing', 2200, 'A sundial. Sarah checks it against her phone. The sundial is a little behind. Island time.'],
    od_birdhouse: ['Birdhouse', 1, 'standing', 1300, 'A birdhouse on a post. Somebody has moved in. There is a tiny welcome mat.'],
    od_wheelbarrow: ['Flower wheelbarrow', 1, 'standing', 1700, 'A wheelbarrow full of flowers. Nobody knows who left it. Everybody waters it.'],
    od_arch: ['Rose arch', 2, 'standing', 4600, 'An arch covered in roses. Walking under it feels like an occasion.'],
    od_telescope: ['Telescope', 1, 'standing', 3800, 'A brass telescope on a tripod. Sarah looks through it. A seagull looks back.'],
    od_chimes: ['Wind chimes', 1, 'standing', 1200, 'Wind chimes on a stand. They play a little song nobody wrote.'],
    od_hedge_tall: ['Tall hedge', 1, 'plants', 1200, 'A hedge taller than Sarah. She cannot see over it. That is the point of it.'],
    od_hedge_flower: ['Flowering hedge', 1, 'plants', 1400, 'A hedge dotted with pink blossoms. The bees approve, loudly.'],
    od_topiary_spiral: ['Spiral topiary', 1, 'plants', 2600, 'A topiary clipped into a spiral. Looking at it too long makes Sarah a little dizzy.'],
    od_topiary_heart: ['Heart topiary', 1, 'plants', 2800, 'A topiary clipped into a heart. Joe saw it and had to sit down.'],
    od_barrel_planter: ['Barrel planter', 1, 'plants', 1300, 'Half a barrel full of flowers. A second life for a barrel. Good for it.'],
    od_potted_palm: ['Potted palm', 1, 'plants', 1600, 'A little palm in a big pot. It thinks it is on vacation. It is.'],
    od_rose_bush: ['Rose bush', 1, 'plants', 1800, 'A rose bush. It smells wonderful. It has thorns. Both things are true.'],
    od_grill: ['Kettle grill', 1, 'fun', 2400, 'A round black grill. Sarah imagines corn on the cob. Now she is hungry.'],
    od_cooler: ['Picnic cooler', 1, 'fun', 900, 'A cooler. Inside: ice, and one very cold juice box. Classic.'],
    od_rowboat: ['Rowboat', 2, 'fun', 5200, 'A little rowboat pulled up on the grass. It dreams of the sea.'],
    od_haybale: ['Hay bale', 1, 'fun', 500, 'A round hay bale. The goat has been here. There is a bite out of one side.'],
    od_crates: ['Crate stack', 1, 'fun', 700, 'Wooden crates stacked up, one full of apples. Help yourself? Better not.'],
};
for (const [id, [name, w, cat, price, talk, x]] of Object.entries(OUTDOOR_NEW)) {
    DISPLAYS[id] = Object.assign({ name, price, w, frame: 'f_' + id, cat, talk: talk || undefined }, x || {});
    ITEMS[id] = { name, type: 'display', price, icon: 'f_' + id };
}
/* Waffle's first pieces, sorted into kinds */
const OUTDOOR_CAT_OF = {
    dp_lamp: 'lights', dp_lantern: 'lights', dp_torch: 'lights', dp_bench: 'seats', dp_stonebench: 'seats', dp_log: 'seats', dp_lounger: 'fun',
    dp_hedge: 'plants', dp_hedge_round: 'plants', dp_hedge_long: 'plants', dp_topiary: 'plants', dp_planter: 'plants', dp_sign: 'standing',
    dp_fountain: 'standing', dp_birdbath: 'standing', dp_gnome: 'statues', dp_frog: 'statues', dp_umbrella: 'standing', dp_fence: 'fences',
    dp_flag: 'standing', dp_picnic: 'standing', dp_flamingo: 'statues',
};
for (const [id, c] of Object.entries(OUTDOOR_CAT_OF)) if (DISPLAYS[id]) DISPLAYS[id].cat = c;
DISPLAYS.dp_lamp.lamp = true;
/* every piece is furniture too (it stands on the floor indoors, as its model) */
for (const [id, d] of Object.entries(DISPLAYS)) {
    FURN[id] = { id, name: d.name, w: d.w, h: d.rows || 1, kind: 'floor', price: d.price, sets: ['outdoor'], frame: d.frame, light: d.light, outdoor: d.cat };
}
/* (their models come with the island's, not after with the rest of the furniture: they stand outdoors) */
for (const id of Object.keys(DISPLAYS)) EnvModels.OUTDOOR.add('furn_' + id);
/* each piece's four colors (6zz_colors.js): its own and three more, frozen here so saves keep them */
const OUTDOOR_PAINT = {
    dp_lamp: 'green,red,white', dp_lantern: 'black,white,yellow', dp_torch: 'wood', od_lamp_double: 'green,white,red', od_path_light: 'white,green,red',
    od_lantern_post: 'red,pink,sky', od_string_lights: 'wood', od_firepit: 'black,white,yellow',
    dp_bench: 'wood', dp_stonebench: 'black,white,yellow', dp_log: 'wood', od_iron_bench: 'black,white,blue', od_adirondack: 'mint,blue,red',
    od_stump: 'wood', od_porch_swing: 'wood', od_deck_chair: 'red,green,yellow',
    dp_fence: 'sky,pink,yellow', od_fence_rail: 'wood', od_fence_iron: 'green,white,blue', od_fence_bamboo: 'wood', od_fence_stone: 'black,white,yellow',
    od_fence_rope: 'wood', od_fence_lattice: 'sky,pink,mint',
    dp_gnome: 'green,lilac,yellow', od_gnome_fish: 'red,blue,lilac', dp_frog: 'black,white,yellow', dp_flamingo: 'sky,yellow,mint', od_owl: 'black,white,yellow',
    od_cat: 'black,yellow,orange', od_turtle: 'black,white,yellow', od_mushroom: 'blue,yellow,lilac',
    dp_sign: 'wood', dp_umbrella: 'blue,green,yellow', dp_picnic: 'wood', dp_flag: 'red,green,lilac', dp_fountain: 'black,white,yellow', dp_birdbath: 'black,white,yellow',
    od_sundial: 'black,white,yellow', od_birdhouse: 'pink,mint,yellow', od_wheelbarrow: 'blue,green,yellow', od_arch: 'sky,pink,mint', od_telescope: 'wood',
    od_chimes: 'wood',
    dp_hedge: 'yellow,orange,red', dp_hedge_round: 'yellow,orange,red', dp_hedge_long: 'yellow,orange,red', dp_topiary: 'blue,white,green', od_hedge_tall: 'yellow,orange,red',
    od_hedge_flower: 'sky,yellow,white', od_topiary_spiral: 'blue,white,green', od_topiary_heart: 'pink,blue,yellow', dp_planter: 'wood', od_barrel_planter: 'wood',
    od_potted_palm: 'pink,yellow,white', od_rose_bush: 'yellow,white,pink',
    dp_lounger: 'pink,yellow,blue', od_grill: 'red,blue,green', od_cooler: 'red,green,yellow', od_rowboat: 'red,green,yellow', od_haybale: 'wood', od_crates: 'wood',
};
/* Waffle's stock today: so many of each kind (OUTDOOR_DAILY), each piece in one of its four colors, from the island's seed
   and the day (the same all day, different tomorrow) */
function waffleStock(day) {
    const r = mulberry(hash32(S.seed + ':waffle:' + day)), out = [];
    for (const [cat] of OUTDOOR_CATS) {
        const pool = Object.keys(DISPLAYS).filter(id => DISPLAYS[id].cat === cat);
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
        for (const id of pool.slice(0, OUTDOOR_DAILY[cat] || 1)) {
            const cols = FURN[id] && FURN[id].colors, c = cols ? cols[Math.floor(r() * cols.length)] : null;
            out.push({ id: c ? id + '@' + c : id, base: id, cat });
        }
    }
    return out;
}
