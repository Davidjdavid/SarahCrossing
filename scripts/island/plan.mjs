// The island's plan: Harbor Square, the layout David picked (drawn first as a concept map on this same grid). layout.mjs
// turns it into the game's map; the noise that roughens the coast and the cliff edges is seeded, so the same plan always
// makes the same island. Coordinates are tiles, north at the top: higher ground is always north of its edge (every cliff
// faces south, east or west), stairs go where a path crosses a cliff, bridges where it crosses the river.
//
//   - the town square above the dock: the Post Office, Town Hall and Bank along its top, shops round it, Market Lane east
//   - the neighborhood to the west, one step above the beach, round a ring of flower beds and a village green
//   - the farm up a level in the north-west, with a point looking over a bay and a narrow stair down to a hidden cove
//   - the forest in the middle: loops round the pond, the old tree and a glade, a cliff walk along its edge
//   - the campsite on a hill above it, joined by a ridge to the mountain; the Ridge Trail runs from the farm through the
//     campsite to the lookout
//   - the mountain in the north-east: the hot spring on a ledge, a trail up three cliffs, a stream falling to the river,
//     which runs past the orchard to the sea; the lighthouse on the south-east point

export const PLAN = {
  w: 224, h: 156, seed: 11,
  coast: [[25,27],[43,14],[69,11],[101,10],[132,8],[164,7],[190,7],[208,13],[218,31],[216,56],[220,78],[215,100],[217,116],[208,127],[193,129],[177,126],[164,123],[150,125],[134,130],[119,131],[103,130],[85,129],[67,127],[49,125],[34,121],[20,113],[12,98],[12,86],[18,81],[27,79],[30,75],[26,71],[17,69],[12,64],[10,56],[11,46],[15,40]],
  // each level is everything north of its edge (a row per column, between the listed points); steep ones keep their
  // straight sides (the farm's point above the cove)
  levels: [
    { L: 1, x0: 0, x1: 223, pts: [[0,109],[34,112],[63,116],[90,118],[134,118],[157,115],[179,114],[197,116],[223,114]] },
    { L: 2, x0: 0, x1: 223, pts: [[0,58],[34,60],[63,62],[81,65],[92,74],[112,78],[132,78],[146,71],[157,65],[175,62],[186,69],[223,71]] },
    { L: 2, x0: 28, x1: 36, pts: [[28,80],[36,80]], steep: true, rough: 0.3 },
    { L: 3, x0: 103, x1: 160, pts: [[103,33],[125,31],[146,32],[152,24],[160,24]] },
    { L: 3, x0: 157, x1: 223, pts: [[157,54],[179,51],[202,54],[223,54]] },
    { L: 4, x0: 166, x1: 223, pts: [[166,38],[190,36],[223,38]] },
    { L: 5, x0: 177, x1: 219, pts: [[177,22],[199,20],[219,22]] },
  ],
  // the stream runs straight down the mountain (2 wide, so its falls are too), the river 3 wide where it leaves the cliff
  rivers: [
    { pts: [[173,27],[173,40],[173,53.5],[173,63.5]], w: 2 },
    { pts: [[173,63.5],[176,70],[182.5,80],[187,91.5],[188,102.5],[186,110],[184.5,113],[184.5,119],[182,126],[180,134]], w: 3 },
  ],
  ponds: [{ x: 173, y: 27.5, rx: 3, ry: 2 }, { x: 98.5, y: 56, rx: 4.5, ry: 2.9 }, { x: 83, y: 45.5, rx: 1.6, ry: 1.1 }, { x: 174, y: 67.5, rx: 2.8, ry: 1.8 }],
  plaza: { x0: 93, y0: 89, x1: 141, y1: 113 },
  streets: [{ pts: [[141,108],[152,108.5],[165,108],[176,107]], w: 3 }, { pts: [[117,113],[117,125]], w: 4 }],
  pier: { x: 116, y0: 124, y1: 146 },
  // paths (p), hiking trails (d)
  paths: [
    { pts: [[117,125],[117,131]] },
    // the forest: a cliff walk along its edge, loops round the pond, the old tree and the glade
    { pts: [[110,89],[110,84],[110,79],[110,75],[110,72.5]] },
    { pts: [[80.5,53.4],[82.5,58],[86,62],[96,67],[110,72.5],[124,73],[138,70],[150,64],[157,61]] },
    { ring: [98.5, 56, 9.5, 6.5] },
    { pts: [[98.5,62.5],[98.5,68]] },
    { ring: [120, 57, 7, 7] },
    { pts: [[108,56],[113,57]] },
    { pts: [[120,64],[120,72.6]] },
    { pts: [[120,50],[123,44],[125,38],[125,32],[126,27],[126,23]] },
    { pts: [[89,56],[80,53],[70,49],[63,44],[57.5,41.5],[54.3,40]] },
    { pts: [[91.8,51.4],[88,48],[85,46.5]], w: 1.5 },
    { ring: [141, 47, 4.5, 4.5] },
    { pts: [[124,41],[130,44],[136.5,47]] },
    { pts: [[141,51.5],[141,60.4]] },
    { pts: [[127,57],[136,60],[148,61],[160,61],[173,60],[182,63],[190,66],[197,67]] },
    // the mountain trail, from the hot spring up three cliffs to the lookout
    { pts: [[197,67],[206,64.5],[210.5,60],[210.5,52.5],[206,49],[195,47],[188,42.5],[188,34.5],[195,31],[206,28],[209.5,24.5],[208,19],[203,16],[198,16]] },
    // town to the orchard, the river, the lighthouse (and down to its beach) and up to the hot spring
    { pts: [[141.5,90],[147,85],[158,82],[170,83],[178,90],[182,99],[182,104]] },
    { pts: [[170,83],[174,77],[173,72.5]], w: 1.6 },
    { pts: [[176,107],[183,104],[193,102],[201,103],[208,107],[209.5,111.5]] },
    { pts: [[209.5,111.5],[204,113.5],[203,116],[203,121]] },
    { pts: [[197,102],[197,92],[199,80],[201,74],[201,68],[197,66]] },
    // the neighborhood
    { pts: [[93,108],[84,107],[74,104],[64,102]] },
    { pts: [[64,102],[52,103],[40,104],[28,101],[20,96]] },
    { ring: [50, 90, 5.5, 5.5] },
    { pts: [[50,95.5],[50,103.2]] },
    { pts: [[55.5,90],[62,91],[70,92]] },
    { ring: [78, 92, 8, 6] },
    { pts: [[78,98],[78,105.3]] },
    { pts: [[50,84.5],[48,76],[46,70],[45,65],[45,58],[48,50],[54,40],[58,33]] },
    { pts: [[78,86],[77,78],[74,71],[72,66],[72,60],[68,52],[63,44]] },
    { pts: [[40,104],[38,110],[37,114],[37,118]] },
    // the farm, its point above the bay (steps down to the lane) and the narrow way down to the cove
    { pts: [[58,33],[64,30.5],[70,27],[73.5,25.5]] },
    { pts: [[58,33],[56,29],[54.5,26.5]] },
    { pts: [[58,33],[50,34],[44,31],[39.5,28.5]] },
    { pts: [[48,50],[40,52],[34,58],[32,66],[32,76]] },
    { pts: [[40,52],[30,54],[22,56],[18.5,59],[18,63],[15,65.5]], w: 1.5 },
    { pts: [[32,76],[33,80],[33,84],[40,84],[47,83],[49.3,82]] },
    // the Ridge Trail: from the farm through the campsite (a loop round the fire), along the ridge, over the stream
    { pts: [[73.5,25.5],[82,24],[90,28],[96,34],[101,39],[105,38],[105,32],[107,27],[113,22],[117,20],[120,19]], w: 1.6, trail: true },
    { ring: [126, 19, 6, 4], w: 1.6, trail: true },
    { pts: [[132,19],[140,18],[150,17],[158,19],[161,26],[162,34],[163,41],[168,44.5],[173,45.5],[178,46.5],[186,44.5],[188,43.5]], w: 1.6, trail: true },
  ],
  // crops are copied from the first island's fields (x, y there)
  fields: [{ x: 25, y: 33, crop: 'cabbage' }, { x: 38, y: 38, crop: 'wheat' }, { x: 63, y: 35, crop: 'pumpkin' }],
  goatpen: { x: 24, y: 45, w: 8, h: 6 },
  lawns: [{ x: 73, y: 89, w: 10, h: 6 }, { x: 144, y: 111, w: 20, h: 3 }, { x: 204, y: 80, w: 10, h: 10 }],
  forests: [
    { poly: [[78,40],[100,36],[150,36],[158,46],[160,58],[150,66],[132,76],[112,76],[94,72],[84,66],[76,54]], p: 0.58, kind: 'mixed' },
    { poly: [[103,6],[150,6],[150,32],[103,32]], p: 0.42, kind: 'mixed' },
    { poly: [[152,4],[223,4],[223,72],[152,72]], p: 0.26, kind: 'pine' },
  ],
  clearings: [{ x: 120, y: 57, r: 5 }, { x: 98.5, y: 56, r: 6.5 }, { x: 141, y: 47, r: 5.5 }, { x: 84, y: 46, r: 2.8 }, { x: 103.5, y: 46, r: 3 }, { x: 126, y: 18, r: 9 }, { x: 173, y: 27.5, r: 4.5 }, { x: 198, y: 15, r: 4.5 }, { x: 173, y: 70, r: 3 }],
  noTree: [[86, 80, 182, 120], [22, 16, 76, 48], [10, 58, 27, 70]],
  orchard: { x: 142, y: 80, w: 36, h: 17 },
  sand: [[10, 61, 26, 69]],
  hotspring: { x: 193, y: 57 },
  oldTree: { x: 119, y: 56 },
  bigTree: { x: 106, y: 96 },
  camp: { x: 126, y: 19 },
  garden: { x: 62, y: 81 },
  buildings: [
    { id: 'shop', x: 95, y: 86, w: 5, h: 3, door: 2, sprite: 'shop', front: 'shopfront' },
    { id: 'postoffice', x: 103, y: 86, w: 5, h: 3, door: 2, sprite: 'postoffice', front: 'postofficefront' },
    { id: 'townhall', x: 113, y: 85, w: 7, h: 4, door: 3, sprite: 'townhall', front: 'townhallfront' },
    { id: 'bank', x: 123, y: 86, w: 5, h: 3, door: 2, sprite: 'bank', front: 'bankfront' },
    { id: 'museum', x: 131, y: 85, w: 7, h: 4, door: 3, sprite: 'museum', front: 'museumfront' },
    { id: 'boutique', x: 94, y: 92, w: 4, h: 3, door: 2, sprite: 'boutique', front: 'boutiquefront' },
    { id: 'salon', x: 94, y: 100, w: 4, h: 3, door: 2, sprite: 'salon', front: 'salonfront' },
    { id: 'studio', x: 136, y: 92, w: 5, h: 3, door: 2, sprite: 'studio', front: 'studiofront' },
    { id: 'displays', x: 136, y: 100, w: 5, h: 3, door: 2, sprite: 'displays', front: 'displaysfront' },
    { id: 'restaurant', x: 144, y: 103, w: 5, h: 3, door: 2, sprite: 'restaurant', front: 'restaurantfront' },
    { id: 'arcade', x: 151, y: 103, w: 5, h: 3, door: 2, sprite: 'arcade', front: 'arcadefront' },
    { id: 'club', x: 158, y: 103, w: 6, h: 3, door: 3, sprite: 'club', front: 'clubfront' },
    { id: 'builder', x: 166, y: 103, w: 5, h: 3, door: 2, sprite: 'builder', front: 'builderfront' },
    { id: 'lighthouse', x: 208, y: 108, w: 3, h: 3, door: 1, sprite: 'lighthouse', front: 'lighthousefront' },
    { id: 'barn', x: 52, y: 23, w: 5, h: 3, door: 2, sprite: 'barn' },
    { id: 'home', x: 57, y: 81, w: 4, h: 3, door: 2, sprite: 'house_sarah', link: [[59.5,90.7]] },
    { id: 'h_coco', x: 82, y: 74, w: 3, h: 3, door: 1, link: [[83.5,87.4]] },
    { id: 'h_basil', x: 66, y: 96, w: 3, h: 3, door: 1, link: [[67.5,102.7]] },
    { id: 'h_clementine', x: 64, y: 70, w: 3, h: 3, door: 1, link: [[65.5,75],[75.2,75]] },
    { id: 'h_mac', x: 42, y: 74, w: 3, h: 3, door: 1, link: [[43.5,80],[46.2,86.2]] },
    { id: 'h_sully', x: 30, y: 86, w: 3, h: 3, door: 1, link: [[31.5,101.8]] },
    { id: 'h_brulee', x: 18, y: 86, w: 3, h: 3, door: 1, link: [[19.5,95.7]] },
    { id: 'h_chili', x: 38, y: 68, w: 3, h: 3, door: 1, link: [[39.5,71],[45.4,71]] },
    { id: 'h_joe', x: 42, y: 107, w: 3, h: 3, door: 1, link: [[43.5,110],[38.4,110]] },
    { id: 'h_ginger', x: 72, y: 22, w: 3, h: 3, door: 1, link: [[73.5,25.5]] },
    { id: 'h_cece', x: 38, y: 25, w: 3, h: 3, door: 1, link: [[39.5,28.5]] },
    { id: 'h_maki', x: 102, y: 43, w: 3, h: 3, door: 1, link: [[103.5,46],[102.5,50.2]] },
    { id: 'h_cuke', x: 191, y: 92, w: 3, h: 3, door: 1, link: [[192.5,95],[193,101.6]] },
    { id: 'h_kai', x: 50, y: 117, w: 3, h: 3, door: 1 },
  ],
  // room kept for what's coming: the café, the sailor's and the balloonist's houses, a bait shop
  lots: { cafe: { x: 174, y: 103, w: 4, h: 3 }, sailor: { x: 124, y: 123, w: 3, h: 3 }, balloonist: { x: 205, y: 94, w: 3, h: 3 }, bait: { x: 106, y: 121, w: 4, h: 3 } },
  props: [
    // the square
    { kind: 'fountain', x: 116, y: 101 }, { kind: 'flowerbed', x: 127, y: 95 }, { kind: 'flowerbed', x: 104, y: 106 }, { kind: 'flowerbed', x: 128, y: 106 },
    { kind: 'bench', x: 111, y: 108 }, { kind: 'bench', x: 121, y: 108 }, { kind: 'bench', x: 95, y: 110 }, { kind: 'bench', x: 129, y: 91 },
    { kind: 'statue_david', x: 99, y: 107 }, { kind: 'plaque', x: 100, y: 109 }, { kind: 'board', x: 108, y: 92 },
    { kind: 'drinkfountain', x: 112, y: 92 }, { kind: 'trashcan', x: 102, y: 112 }, { kind: 'trashcan', x: 133, y: 112 },
    { kind: 'lamp', x: 93, y: 89 }, { kind: 'lamp', x: 141, y: 89 }, { kind: 'lamp', x: 93, y: 113 }, { kind: 'lamp', x: 141, y: 113 }, { kind: 'lamp', x: 111, y: 89 }, { kind: 'lamp', x: 121, y: 89 },
    { kind: 'sign_island', x: 120, y: 123 }, { kind: 'tackle', x: 118, y: 129 }, { kind: 'viewer', x: 114, y: 123 },
    // Market Lane
    { kind: 'sign_club', x: 164, y: 105 }, { kind: 'bench', x: 165, y: 111 }, { kind: 'lamp', x: 150, y: 110 }, { kind: 'lamp', x: 172, y: 110 }, { kind: 'lamp', x: 143, y: 106 },
    // the neighborhood
    { kind: 'mailbox', x: 61, y: 84 }, { kind: 'bench', x: 49, y: 91 }, { kind: 'lamp', x: 56, y: 100 }, { kind: 'lamp', x: 70, y: 99 }, { kind: 'lamp', x: 86, y: 105 },
    { kind: 'lamp', x: 42, y: 101 }, { kind: 'lamp', x: 24, y: 98 }, { kind: 'lamp', x: 52, y: 79 }, { kind: 'lamp', x: 76, y: 82 },
    { kind: 'birdhouse', x: 29, y: 88 }, { kind: 'flamingo', x: 85, y: 76 }, { kind: 'birdhouse', x: 63, y: 72 }, { kind: 'flamingo', x: 45, y: 109 },
    // the farm, its point and the cove
    { kind: 'windmill', x: 47, y: 18 }, { kind: 'well', x: 52, y: 36 }, { kind: 'scarecrow', x: 30, y: 31 }, { kind: 'scarecrow', x: 68, y: 33 },
    { kind: 'hay', x: 58, y: 24 }, { kind: 'hay', x: 58, y: 25 }, { kind: 'crate', x: 50, y: 27 }, { kind: 'wheelbarrow', x: 34, y: 41 },
    { kind: 'sign_farm', x: 47, y: 67 }, { kind: 'trough', x: 26, y: 47 }, { kind: 'bench', x: 29, y: 77 },
    { kind: 'driftwood', x: 20, y: 66 }, { kind: 'rock', x: 12, y: 63 }, { kind: 'rock', x: 25, y: 68 },
    // the forest, the glade, the campsite
    { kind: 'bench', x: 101, y: 64 }, { kind: 'log', x: 83, y: 44 }, { kind: 'bench', x: 140, y: 48 },
    { kind: 'tent', x: 114, y: 15, tent: 0 }, { kind: 'tent', x: 123, y: 10, tent: 1 }, { kind: 'tent', x: 136, y: 15, tent: 2 },
    { kind: 'campfire', x: 126, y: 19 }, { kind: 'log', x: 122, y: 19 }, { kind: 'log', x: 128, y: 19 }, { kind: 'log', x: 125, y: 21 },
    { kind: 'picnic', x: 113, y: 22 }, { kind: 'sign_camp', x: 134, y: 22 }, { kind: 'sign_trail', x: 78, y: 22 },
    // the river, the mountain, the east
    { kind: 'bench', x: 169, y: 71 }, { kind: 'telescope', x: 198, y: 13 }, { kind: 'bench', x: 193, y: 16 }, { kind: 'bench', x: 205, y: 90 },
    // the beaches
    { kind: 'bonfire', x: 64, y: 122 }, { kind: 'log', x: 61, y: 123 }, { kind: 'log', x: 67, y: 123 }, { kind: 'log', x: 64, y: 124 }, { kind: 'sign_bonfire', x: 69, y: 120 },
    { kind: 'bench', x: 86, y: 121 }, { kind: 'icecream', x: 92, y: 121 }, { kind: 'sandcastle', x: 98, y: 125 }, { kind: 'volleyball', x: 131, y: 121 },
    { kind: 'driftwood', x: 76, y: 125 }, { kind: 'driftwood', x: 150, y: 123 }, { kind: 'driftwood', x: 200, y: 124 },
  ],
  flowers: [{ x: 50, y: 90, r: 4, n: 46 }, { x: 141, y: 47, r: 4, n: 30 }, { x: 60, y: 72, r: 6, n: 10 }, { x: 18, y: 64, r: 4, n: 8 }, { x: 30, y: 70, r: 4, n: 8 }, { x: 78, y: 98, r: 3, n: 6 }],
  // the cart in the square (Basil's), the jump rope
  cart: { x: 130, y: 98 },
  rope: { y: 105, x: 110 },
  // where the neighbors go (anything not given here comes from a building's front or a prop above)
  spots: {
    plaza: [117, 97, 4], plaza_w: [104, 98, 1], plaza_e: [130, 104, 2], bench_w: [112, 109, 1], bench_e: [122, 109, 1], board: [108, 93, 1],
    garden: [64, 85, 2], village: [50, 98, 3], statue: [100, 111, 2], bench_statue: [96, 111, 1], bench_museum: [130, 92, 1],
    boardwalk: [160, 108, 3], bench_boardwalk: [166, 112, 1],
    beach_w: [44, 121, 3], beach: [90, 124, 4], bench_beach: [87, 122, 1], beach_e: [142, 125, 3], beach_far: [196, 122, 3], harbor: [128, 122, 3],
    pier: [117, 126, 1], pier_end: [117, 145, 0], bonfire: [65, 125, 2],
    pond: [99, 65, 2], bench_pond: [102, 65, 1], forest: [109, 62, 3], oldtree: [120, 60, 2], meadow: [141, 44, 3], bench_meadow: [141, 49, 1],
    campsite: [126, 24, 3], picnic_forest: [114, 23, 1],
    farm: [52, 32, 3], bench_farm: [30, 78, 1], goatpen: [28, 48, 2],
    orchard: [160, 88, 3], river: [177, 90, 2], bridge: [188, 102, 0], eastside: [195, 105, 3], waterfall: [173, 73, 2], bench_falls: [170, 72, 1],
    eastmeadow: [209, 85, 3], bench_eastmeadow: [206, 91, 1], spring: [198, 65, 1],
    mountain: [196, 45, 3], lookout: [198, 15, 2], bench_lookout: [194, 17, 1], summit: [201, 18, 2],
  },
};
