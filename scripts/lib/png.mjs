// Indexed (palette) PNGs, read and written with Node's own zlib: the island ground is one of these per piece, with
// the colors swapped for each season in the browser (01_assets.js).
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/* { w, h, px: Uint8Array of palette indices, pal: Uint8Array rgb } from an 8-bit indexed PNG */
export function readIndexed(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, pal = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 3 || data[12] !== 0) throw new Error('only 8-bit indexed, non-interlaced PNGs');
    } else if (type === 'PLTE') pal = new Uint8Array(data);
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), px = new Uint8Array(w * h);
  let prev = new Uint8Array(w);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w + 1)], row = raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1)), out = px.subarray(y * w, (y + 1) * w);
    for (let x = 0; x < w; x++) {
      const a = x ? out[x - 1] : 0, b = prev[x], c = x ? prev[x - 1] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[x] = v & 255;
    }
    prev = out;
  }
  return { w, h, px, pal };
}

/* an 8-bit indexed PNG of w x h palette indices (pal: rgb bytes, up to 256 entries) */
export function writeIndexed(w, h, px, pal) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 3;
  // (rows left unfiltered: the ground is mostly noise, which filters don't help)
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (w + 1);
    raw[o] = 0;
    for (let x = 0; x < w; x++) raw[o + 1 + x] = px[y * w + x];
  }
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal)), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
