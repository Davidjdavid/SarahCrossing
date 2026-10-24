// Seeded randomness for the island generator: the same seed always makes the same island.

/* a stream of numbers in [0, 1) */
export function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  r.chance = (p) => r() < p;
  return r;
}

/* a whole number from a few, the same every time (for picking per tile without a stream) */
export function hash(...n) {
  let h = 0x9e3779b9;
  for (const v of n) { h = Math.imul(h ^ (v | 0), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; }
  return h >>> 0;
}

/* smooth value noise in [-1, 1]: a function of (x, y), cells one unit wide */
export function noise(seed) {
  const at = (ix, iy) => (hash(seed, ix, iy) / 4294967296) * 2 - 1;
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy;
    const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
}

/* several octaves of noise, the first `scale` units across */
export function fbm(seed, scale, octaves = 4) {
  const ns = Array.from({ length: octaves }, (_, i) => noise(seed + i * 1013));
  return (x, y) => {
    let s = 0, amp = 1, tot = 0, f = 1 / scale;
    for (const n of ns) { s += n(x * f, y * f) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return s / tot;
  };
}
