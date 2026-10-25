// The test area for the new 3D look: a small island laid out like the concept art (the picture David and Sarah picked
// for how the game should look), made by the same generator as the island (node scripts/make-island.mjs --plan lab, into
// game/assets/lab/) and played with ?lab in the address. Nothing here is part of Sarah's island.
//
//   - Sarah's cottage at the back in the middle, Fortune's shop to its right, a path down from each to the cobbles in
//     front
//   - a stone wall across the left with higher ground behind it (pines, autumn trees), a waterfall coming over it into a
//     stream that runs down to a pond with lily pads
//   - the beach down the right side, the sea beyond it, palms leaning over
//   - autumn trees round the cottage and the shop, pines here and there, a bench and a lamp by the path
//   - south of it all, a town of the island's other buildings along three streets (for reviewing their models): the
//     town hall, post office, bank, museum and lighthouse; the shops; the club, Ginger's workshop and the barn

export const PLAN = {
  w: 50, h: 68, seed: 21,
  start: [27, 23],                       // (no pier: where Sarah starts)
  beachD: 2,                             // only the low ground near the sea is beach
  treeChance: 0, wildFlowers: false,     // every tree where it's put, nothing scattered
  // laid out to the concept's proportions: everything you see there is within a few steps of the cobbles
  coast: [[4,3],[24,2],[32,3],[33,10],[33.4,16],[34,20],[34.8,25],[36.3,30],[38,37],[44,40],[48,46],[48.4,56],[46,64],[30,66],[10,65.4],[4,58],[4,44],[3,30],[3,14]],
  levels: [
    { L: 1, x0: 0, x1: 24, pts: [[0,20],[24,20]], steep: true, rough: 0 },
    { L: 1, x0: 25, x1: 36, pts: [[25,16],[36,16]], steep: true, rough: 0 },
  ],
  rivers: [{ pts: [[22.6,11.5],[22.6,15],[22.6,18.5],[22.6,21.4],[22.2,23.2],[21.6,24.6]], w: 1.2 }],
  // a spring up on the higher ground feeds the stream; the pond at the bottom of it
  ponds: [{ x: 22.6, y: 10.6, rx: 1.8, ry: 1.3 }, { x: 21.2, y: 26.8, rx: 2.8, ry: 1.9 }],
  plaza: { x0: 25, y0: 25, x1: 30, y1: 28 },
  streets: [],
  paths: [
    { pts: [[27.5,20.4],[27.4,22.6],[27.1,24.6]], w: 1.6 },
    { pts: [[32.5,19.4],[31.8,22.4],[30.4,24.8]], w: 1.6 },
    { pts: [[30.4,27.4],[33,28.2],[34.6,28.6]], w: 1.6 },
    { pts: [[26,28.6],[25.2,31],[24.6,34]], w: 1.6 },
    // round the pond and up the stairs at the far left to the higher ground
    { pts: [[24.8,30],[18,30.5],[12,28],[10,23],[10,15]], w: 1.6 },
    // down to the town and its three streets, joined at the ends and in the middle
    { pts: [[24.6,34],[23.4,39],[22.4,43],[22.2,48.6]], w: 1.6 },
    { pts: [[5.4,48.6],[46,48.6]], w: 1.5 }, { pts: [[5.4,54.6],[44,54.6]], w: 1.5 }, { pts: [[6,60.6],[33,60.6]], w: 1.5 },
    { pts: [[5.4,48.6],[5.4,54.6]], w: 1.4 }, { pts: [[23.2,48.6],[23.2,60.6]], w: 1.4 }, { pts: [[45.6,48.6],[44.2,54.6]], w: 1.4 },
  ],
  buildings: [
    { id: 'home', x: 25, y: 17, w: 4, h: 3, door: 2, sprite: 'house_sarah' },
    { id: 'shop', x: 30, y: 16, w: 4, h: 3, door: 2, sprite: 'shop', front: 'shopfront' },
    // two neighbors' houses up in the woods (for the houses made from the kit of parts)
    { id: 'h_joe', x: 6, y: 11, w: 3, h: 3, door: 1 },
    { id: 'h_maki', x: 15, y: 15, w: 3, h: 3, door: 1 },
    // the town
    { id: 'townhall', x: 7, y: 44, w: 7, h: 4, door: 3, sprite: 'townhall', front: 'townhallfront' },
    { id: 'postoffice', x: 15, y: 45, w: 5, h: 3, door: 2, sprite: 'postoffice', front: 'postofficefront' },
    { id: 'bank', x: 25, y: 45, w: 5, h: 3, door: 2, sprite: 'bank', front: 'bankfront' },
    { id: 'museum', x: 31, y: 44, w: 7, h: 4, door: 3, sprite: 'museum', front: 'museumfront' },
    { id: 'lighthouse', x: 41, y: 45, w: 3, h: 3, door: 1, sprite: 'lighthouse', front: 'lighthousefront' },
    { id: 'boutique', x: 7, y: 51, w: 4, h: 3, door: 2, sprite: 'boutique', front: 'boutiquefront' },
    { id: 'salon', x: 12, y: 51, w: 4, h: 3, door: 2, sprite: 'salon', front: 'salonfront' },
    { id: 'studio', x: 17, y: 51, w: 5, h: 3, door: 2, sprite: 'studio', front: 'studiofront' },
    { id: 'displays', x: 25, y: 51, w: 5, h: 3, door: 2, sprite: 'displays', front: 'displaysfront' },
    { id: 'restaurant', x: 31, y: 51, w: 5, h: 3, door: 2, sprite: 'restaurant', front: 'restaurantfront' },
    { id: 'arcade', x: 37, y: 51, w: 5, h: 3, door: 2, sprite: 'arcade', front: 'arcadefront' },
    { id: 'club', x: 8, y: 57, w: 6, h: 3, door: 3, sprite: 'club', front: 'clubfront' },
    { id: 'builder', x: 16, y: 57, w: 5, h: 3, door: 2, sprite: 'builder', front: 'builderfront' },
    { id: 'barn', x: 26, y: 57, w: 5, h: 3, door: 2, sprite: 'barn' },
  ],
  props: [
    { kind: 'bench', x: 28, y: 22 }, { kind: 'lamp', x: 30, y: 22 }, { kind: 'mailbox', x: 29, y: 20 },
    { kind: 'fence', x: 23, y: 21, w: 2 },
    { kind: 'bush', x: 25, y: 22 }, { kind: 'bush', x: 33, y: 25 }, { kind: 'bush', x: 23, y: 29 }, { kind: 'bush', x: 33, y: 31 },
    // a showcase of the island's other props on the lawn below the pond (for reviewing the new models), the windmill
    // up in the woods, the volleyball court on the south lawn
    { kind: 'well', x: 7, y: 32 }, { kind: 'scarecrow', x: 9, y: 32 }, { kind: 'hay', x: 11, y: 32 }, { kind: 'hay', x: 12, y: 32 }, { kind: 'crate', x: 13, y: 32 },
    { kind: 'wheelbarrow', x: 16, y: 32 }, { kind: 'trough', x: 20, y: 32 },
    { kind: 'fountain', x: 7, y: 35 }, { kind: 'birdhouse', x: 10, y: 35 }, { kind: 'flamingo', x: 11, y: 35 }, { kind: 'sign_trail', x: 13, y: 35 },
    { kind: 'sign_farm', x: 14, y: 35 }, { kind: 'board', x: 16, y: 35 }, { kind: 'trashcan', x: 18, y: 35 }, { kind: 'drinkfountain', x: 20, y: 35 }, { kind: 'plaque', x: 21, y: 35 },
    { kind: 'tent', x: 7, y: 37, tent: 1 }, { kind: 'campfire', x: 11, y: 37 }, { kind: 'log', x: 12, y: 37 }, { kind: 'picnic', x: 15, y: 37 },
    { kind: 'telescope', x: 19, y: 37 }, { kind: 'statue_david', x: 21, y: 37 },
    { kind: 'driftwood', x: 11, y: 40 }, { kind: 'rock', x: 13, y: 39 }, { kind: 'sandcastle', x: 16, y: 39 }, { kind: 'tackle', x: 18, y: 39 },
    { kind: 'viewer', x: 20, y: 40 }, { kind: 'icecream', x: 22, y: 40 }, { kind: 'bonfire', x: 30, y: 40 },
    { kind: 'windmill', x: 11, y: 11 }, { kind: 'volleyball', x: 25, y: 36 },
    // lamps and benches along the town's streets
    { kind: 'lamp', x: 14, y: 50 }, { kind: 'lamp', x: 30, y: 50 }, { kind: 'lamp', x: 21, y: 56 }, { kind: 'lamp', x: 36, y: 56 },
    { kind: 'bench', x: 39, y: 50 }, { kind: 'bench', x: 31, y: 56 }, { kind: 'hay', x: 32, y: 58 }, { kind: 'trough', x: 33, y: 59 },
  ],
  trees: [
    // up behind the wall
    { x: 4, y: 16, kind: 'pine' }, { x: 13, y: 17, kind: 'pine' }, { x: 17, y: 14, kind: 'pine' }, { x: 19, y: 18, kind: 'oak' },
    { x: 11, y: 8, kind: 'pine' }, { x: 15, y: 9, kind: 'pine' }, { x: 20, y: 11, kind: 'pine' }, { x: 24, y: 15, kind: 'pine' }, { x: 3, y: 10, kind: 'pine' },
    { x: 6, y: 6, kind: 'oak' }, { x: 10, y: 15, kind: 'oak' }, { x: 18, y: 8, kind: 'oak' }, { x: 21, y: 16, kind: 'oak' }, { x: 25, y: 11, kind: 'oak' },
    { x: 15, y: 13, kind: 'oak' }, { x: 7, y: 18, kind: 'pine' },
    // up behind the cottage and the shop
    { x: 27, y: 11, kind: 'pine' }, { x: 30, y: 9, kind: 'pine' }, { x: 33, y: 11, kind: 'pine' }, { x: 32, y: 6, kind: 'pine' }, { x: 28, y: 5, kind: 'pine' },
    { x: 28, y: 14, kind: 'oak' }, { x: 26, y: 14, kind: 'oak' }, { x: 29, y: 12, kind: 'oak' }, { x: 32, y: 14, kind: 'pine' }, { x: 31, y: 13, kind: 'oak' }, { x: 34, y: 14, kind: 'oak' }, { x: 26, y: 8, kind: 'oak' }, { x: 30, y: 3, kind: 'oak' },
    // round the cottage and the shop, by the stream and the pond, in front
    { x: 24, y: 18, kind: 'oak' },  { x: 18, y: 24, kind: 'oak' }, { x: 17, y: 28, kind: 'pine' },
    { x: 19, y: 33, kind: 'oak' }, { x: 28, y: 35, kind: 'pine' }, { x: 33, y: 35, kind: 'oak' }, { x: 15, y: 31, kind: 'oak' },
    // round the town
    { x: 6, y: 42, kind: 'oak' }, { x: 15, y: 42, kind: 'oak' }, { x: 29, y: 42, kind: 'pine' }, { x: 39, y: 43, kind: 'oak' },
    { x: 43, y: 52, kind: 'oak' }, { x: 6, y: 58, kind: 'pine' }, { x: 37, y: 59, kind: 'oak' }, { x: 41, y: 58, kind: 'pine' },
  ],
  palms: [{ x: 33, y: 21, coconut: true }, { x: 34, y: 26 }, { x: 36, y: 33, coconut: true }],
  // a few fruit trees in front, toward the beach
  orchard: { x: 28, y: 31, w: 7, h: 5 },
  // Basil's noodle cart (out at night) on the town's middle street
  cart: { x: 40, y: 56 },
  flowers: [{ x: 28, y: 20, r: 1, n: 3 }, { x: 25, y: 23, r: 1.2, n: 3 }, { x: 29, y: 31, r: 2.5, n: 5 }, { x: 23, y: 25, r: 1, n: 2 }],
  spots: {
    plaza: [27, 26, 2], pond: [20, 30, 1], beach: [35, 31, 1], waterfall: [24, 23, 1], summit: [10, 12, 1],
    pier: [34, 38, 1], spring: [14, 30, 1], orchard: [31, 33, 2],
  },
};
