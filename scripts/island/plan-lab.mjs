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

export const PLAN = {
  w: 50, h: 44, seed: 21,
  start: [27, 23],                       // (no pier: where Sarah starts)
  beachD: 2,                             // only the low ground near the sea is beach
  treeChance: 0, wildFlowers: false,     // every tree where it's put, nothing scattered
  // laid out to the concept's proportions: everything you see there is within a few steps of the cobbles
  coast: [[4,3],[24,2],[32,3],[33,10],[33.4,16],[34,20],[34.8,25],[36.3,30],[38,37],[35,42],[26,42],[9,41],[3,30],[3,14]],
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
    { pts: [[26.5,20.4],[26.6,22.6],[26.8,24.6]], w: 1.6 },
    { pts: [[31.5,19.4],[31.1,22.4],[30.1,24.8]], w: 1.6 },
    { pts: [[30.4,27.4],[33,28.2],[34.6,28.6]], w: 1.6 },
    { pts: [[26,28.6],[25.2,31],[24.6,34]], w: 1.6 },
    // round the pond and up the stairs at the far left to the higher ground
    { pts: [[24.8,30],[18,30.5],[12,28],[10,23],[10,15]], w: 1.6 },
  ],
  buildings: [
    { id: 'home', x: 25, y: 17, w: 4, h: 3, door: 1, sprite: 'house_sarah' },
    { id: 'shop', x: 30, y: 16, w: 4, h: 3, door: 1, sprite: 'shop', front: 'shopfront' },
  ],
  props: [
    { kind: 'bench', x: 28, y: 22 }, { kind: 'lamp', x: 30, y: 22 }, { kind: 'mailbox', x: 27, y: 20 },
    { kind: 'fence', x: 23, y: 21, w: 2 },
    { kind: 'bush', x: 25, y: 22 }, { kind: 'bush', x: 33, y: 25 }, { kind: 'bush', x: 23, y: 29 }, { kind: 'bush', x: 33, y: 31 },
  ],
  trees: [
    // up behind the wall
    { x: 4, y: 16, kind: 'pine' }, { x: 8, y: 12, kind: 'pine' }, { x: 13, y: 17, kind: 'pine' }, { x: 17, y: 14, kind: 'pine' }, { x: 19, y: 18, kind: 'oak' },
    { x: 11, y: 8, kind: 'pine' }, { x: 15, y: 9, kind: 'pine' }, { x: 20, y: 11, kind: 'pine' }, { x: 24, y: 15, kind: 'pine' }, { x: 3, y: 10, kind: 'pine' },
    { x: 6, y: 6, kind: 'oak' }, { x: 10, y: 15, kind: 'oak' }, { x: 18, y: 8, kind: 'oak' }, { x: 21, y: 16, kind: 'oak' }, { x: 25, y: 11, kind: 'oak' },
    { x: 15, y: 13, kind: 'oak' }, { x: 7, y: 18, kind: 'pine' },
    // up behind the cottage and the shop
    { x: 27, y: 11, kind: 'pine' }, { x: 30, y: 9, kind: 'pine' }, { x: 33, y: 11, kind: 'pine' }, { x: 32, y: 6, kind: 'pine' }, { x: 28, y: 5, kind: 'pine' },
    { x: 28, y: 14, kind: 'oak' }, { x: 26, y: 14, kind: 'oak' }, { x: 29, y: 12, kind: 'oak' }, { x: 32, y: 14, kind: 'pine' }, { x: 31, y: 13, kind: 'oak' }, { x: 34, y: 14, kind: 'oak' }, { x: 26, y: 8, kind: 'oak' }, { x: 30, y: 3, kind: 'oak' },
    // round the cottage and the shop, by the stream and the pond, in front
    { x: 24, y: 18, kind: 'oak' }, { x: 29, y: 17, kind: 'oak' },  { x: 18, y: 24, kind: 'oak' }, { x: 17, y: 28, kind: 'pine' },
    { x: 19, y: 33, kind: 'oak' }, { x: 28, y: 35, kind: 'pine' }, { x: 33, y: 35, kind: 'oak' }, { x: 15, y: 31, kind: 'oak' },
  ],
  palms: [{ x: 33, y: 21, coconut: true }, { x: 34, y: 26 }, { x: 36, y: 33, coconut: true }],
  flowers: [{ x: 28, y: 20, r: 1, n: 3 }, { x: 25, y: 23, r: 1.2, n: 3 }, { x: 29, y: 31, r: 2.5, n: 5 }, { x: 23, y: 25, r: 1, n: 2 }],
  spots: {
    plaza: [27, 26, 2], pond: [20, 30, 1], beach: [35, 31, 1], waterfall: [24, 23, 1], summit: [10, 12, 1],
    pier: [34, 38, 1], spring: [14, 30, 1], orchard: [31, 33, 2],
  },
};
