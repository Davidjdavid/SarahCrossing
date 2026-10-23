/* ---- 02_data.js ---- */
/* Game data (exported from the art pipeline) + small tables */
const GD = window.GAMEDATA;
const ITEMS = GD.items;
const FURN = GD.furniture;
const RECIPES = GD.recipes;
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const FISHES = GD.fish;
const ITEM_TYPES = { art: 'Painting', fruit: 'Fruit', shell: 'Beach find', fish: 'Fish', veg: 'Veggie', seed: 'Seeds', staple: 'Pantry', dish: 'Dish',
    furniture: 'Furniture', wall: 'Wallpaper', floor: 'Flooring', outfit: 'Outfit', acc: 'Accessory', tool: 'Tool', special: 'Special',
    plant: 'Plant', material: 'Material', flower: 'Flower', bag: 'Backpack', lost: 'Lost and found', snack: 'Snack', display: 'Island display',
    gem: 'Gem', keepsake: 'Keepsake', quest: 'Quest item' };
function itemName(id) { return (ITEMS[id] && ITEMS[id].name) || id; }
function itemIcon(id) { return (ITEMS[id] && ITEMS[id].icon) || 'ui_present'; }
function sellPrice(id) {
    const it = ITEMS[id];
    if (!it || unsellable(id)) return 0;
    if (it.pottery) return it.price;
    if (it.type === 'furniture' || it.type === 'wall' || it.type === 'floor' || it.type === 'outfit' || it.type === 'acc') return Math.floor((it.price || 400) / 4);
    return it.price || 0;
}
function stackMax(id) {
    const t = ITEMS[id] && ITEMS[id].type;
    return (t === 'furniture' || t === 'outfit' || t === 'acc' || t === 'wall' || t === 'floor' || t === 'tool' || t === 'special' || t === 'keepsake') ? 1 : 30;
}

const JOB_TITLES = [
    'Associate Dean of Vibes', 'Senior Director of Email', 'Chief Spreadsheet Officer', 'Assistant to the Assistant Provost',
    'Professor of Meetings', 'Head of Strategic Initiatives Strategy', 'Vice President of Being Busy', 'Lead Something Coordinator',
    'Director of the Office of the Director', 'Special Projects Lead (projects unclear)', 'Keeper of the Crimson Calendar',
    'Program Manager of Programs', 'Deputy Dean of Deputy Deans', 'Associate Director of Associate Directing',
    'The Person Everyone Emails', 'Senior Coordinator of Coordination', 'Harvard Night Manager', 'Executive Liaison to Liaisons',
    'Chief of Staff (staff unknown)', 'Principal Something Specialist', 'Director of Stuff', 'Head of Reply-All Prevention',
];

const SET_NAMES = { cottage: 'Cottage', beach: 'Beach', nightowl: 'Night owl', sushi: 'Sushi bar', takeout: 'Takeout',
    dessert: 'Dessert caf\u00e9', crimson: 'Crimson study', garden: 'Garden', club: 'Club', poet: 'Poet', rainbow: 'Rainbow',
    family: 'Family', council: 'Council', holiday: 'Holiday', friends: 'Friends', pottery: 'Pottery', fixture: 'Fixture', arcade: 'Arcade', diner: 'Diner', artist: 'Artist' };

/* shop: what Fortune stocks today (seeded by the day) */
function shopStock() {
    const r = mulberry(hash32(S.seed + ':shop:' + Clock.dayNum()));
    const buyable = Object.values(FURN).filter(f => f.price > 0 && f.id !== 'kitchenette' && !f.fixture && !f.prize);
    const furn = shuffled(buyable, r).slice(0, 5).map(f => f.id);
    const walls = shuffled(GD.walls.filter(w => ITEMS[w].price > 0), r).slice(0, 1);
    const floors = shuffled(GD.floors.filter(w => ITEMS[w].price > 0), r).slice(0, 1);
    const clothes = shuffled(GD.outfits.filter(o => ITEMS['out_' + o].price > 0).map(o => 'out_' + o), r).slice(0, 4)
        .concat(shuffled(GD.accs.map(a => 'acc_' + a), r).slice(0, 3));
    const hot = rpick(Object.keys(ITEMS).filter(id => ['fruit', 'shell', 'fish', 'veg', 'dish'].includes(ITEMS[id].type) && ITEMS[id].price >= 100 && id !== 'boot'), r);
    return { furn, walls, floors, clothes, hot };
}

