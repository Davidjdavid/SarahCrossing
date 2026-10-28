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
/* the new pieces: [name, wide, kind, price, extras] */
const OUTDOOR_NEW = {
    od_lamp_double: ['Double street lamp', 1, 'lights', 2600, { light: 48, lamp: true }],
    od_path_light: ['Path lights', 1, 'lights', 700, { light: 22 }],
    od_lantern_post: ['Lantern post', 1, 'lights', 1500, { light: 30 }],
    od_string_lights: ['String lights', 2, 'lights', 2200, { light: 36 }],
    od_firepit: ['Fire pit', 1, 'lights', 2400, { light: 46, fire: true }],
    od_iron_bench: ['Iron garden bench', 2, 'seats', 3200, { seat: true }],
    od_adirondack: ['Adirondack chair', 1, 'seats', 1800, { seat: true }],
    od_stump: ['Stump seat', 1, 'seats', 400, { seat: true }],
    od_porch_swing: ['Porch swing', 2, 'seats', 4200, { seat: true }],
    od_deck_chair: ['Deck chair', 1, 'seats', 900, { seat: true }],
    od_fence_rail: ['Split-rail fence', 1, 'fences', 350],
    od_fence_iron: ['Iron fence', 1, 'fences', 600],
    od_fence_bamboo: ['Bamboo fence', 1, 'fences', 450],
    od_fence_stone: ['Low stone wall', 1, 'fences', 800],
    od_fence_rope: ['Rope fence', 1, 'fences', 300],
    od_fence_lattice: ['Garden lattice', 1, 'fences', 700],
    od_gnome_fish: ['Fishing gnome', 1, 'statues', 900],
    od_owl: ['Owl statue', 1, 'statues', 1400],
    od_cat: ['Cat statue', 1, 'statues', 1200],
    od_turtle: ['Turtle statue', 1, 'statues', 1100],
    od_mushroom: ['Toadstool', 1, 'statues', 800],
    od_sundial: ['Sundial', 1, 'standing', 2200],
    od_birdhouse: ['Birdhouse', 1, 'standing', 1300],
    od_wheelbarrow: ['Flower wheelbarrow', 1, 'standing', 1700],
    od_arch: ['Rose arch', 2, 'standing', 4600],
    od_telescope: ['Telescope', 1, 'standing', 3800],
    od_chimes: ['Wind chimes', 1, 'standing', 1200],
    od_hedge_tall: ['Tall hedge', 1, 'plants', 1200],
    od_hedge_flower: ['Flowering hedge', 1, 'plants', 1400],
    od_topiary_spiral: ['Spiral topiary', 1, 'plants', 2600],
    od_topiary_heart: ['Heart topiary', 1, 'plants', 2800],
    od_barrel_planter: ['Barrel planter', 1, 'plants', 1300],
    od_potted_palm: ['Potted palm', 1, 'plants', 1600],
    od_rose_bush: ['Rose bush', 1, 'plants', 1800],
    od_grill: ['Kettle grill', 1, 'fun', 2400],
    od_cooler: ['Picnic cooler', 1, 'fun', 900],
    od_rowboat: ['Rowboat', 2, 'fun', 5200],
    od_haybale: ['Hay bale', 1, 'fun', 500],
    od_crates: ['Crate stack', 1, 'fun', 700],
};
for (const [id, [name, w, cat, price, x]] of Object.entries(OUTDOOR_NEW)) {
    DISPLAYS[id] = Object.assign({ name, price, w, frame: 'f_' + id, cat }, x || {});
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
