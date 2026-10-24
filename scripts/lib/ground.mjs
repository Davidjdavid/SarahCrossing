// The island ground on disk: game/assets/ground/ holds the picture cut into square pieces (so a phone only ever
// decodes the few near Sarah), a half-size copy for the island map, and ground.json saying how it's cut.
import fs from 'node:fs';
import path from 'node:path';
import { writeIndexed } from './png.mjs';

export const PIECE = 512;          // pixels a side (32 tiles)
export const MAP_K = 2;            // the map copy keeps one pixel in MAP_K each way

/* write the whole ground (w x h palette indices) as pieces + map copy + manifest, replacing what was there */
export function writeGround(dir, w, h, px, pal) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cols = Math.ceil(w / PIECE), rows = Math.ceil(h / PIECE);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = c * PIECE, y0 = r * PIECE, pw = Math.min(PIECE, w - x0), ph = Math.min(PIECE, h - y0), out = new Uint8Array(pw * ph);
    for (let y = 0; y < ph; y++) out.set(px.subarray((y0 + y) * w + x0, (y0 + y) * w + x0 + pw), y * pw);
    fs.writeFileSync(path.join(dir, `r${r}c${c}.png`), writeIndexed(pw, ph, out, pal));
  }
  const mw = Math.ceil(w / MAP_K), mh = Math.ceil(h / MAP_K), m = new Uint8Array(mw * mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) m[y * mw + x] = px[Math.min(h - 1, y * MAP_K) * w + Math.min(w - 1, x * MAP_K)];
  fs.writeFileSync(path.join(dir, 'map.png'), writeIndexed(mw, mh, m, pal));
  fs.writeFileSync(path.join(dir, 'ground.json'), JSON.stringify({ size: PIECE, w, h, cols, rows, mapK: MAP_K }) + '\n');
  return { cols, rows };
}
