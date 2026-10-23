// The game's icons (browser tab, phone home screen), drawn at build time from a
// sprite in the atlas: the sprite scaled up with crisp pixels on a plain
// background. Reads and writes 8-bit RGBA PNGs only (what the atlas is).
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readPng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8;
  let w = 0;
  let h = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('only 8-bit RGBA, non-interlaced PNGs');
    } else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4);
  const stride = w * 4;
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? px[y * stride + x - 4] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y > 0 ? px[(y - 1) * stride + x - 4] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, px };
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function writePng(w, h, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * A square icon: `frame` ([x, y, w, h] in the atlas) scaled up by whole pixels to
 * fill about `fill` of the icon, centered on `bg` ("#rrggbb").
 */
export function makeIcon(atlasPng, frame, size, bg, fill = 0.72) {
  const atlas = readPng(atlasPng);
  const [fx, fy, fw, fh] = frame;
  const k = Math.max(1, Math.floor((size * fill) / Math.max(fw, fh)));
  const ox = Math.floor((size - fw * k) / 2);
  const oy = Math.floor((size - fh * k) / 2);
  const back = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      let [r, g, b] = back;
      const sx = Math.floor((x - ox) / k);
      const sy = Math.floor((y - oy) / k);
      if (x >= ox && y >= oy && sx < fw && sy < fh) {
        const s = ((fy + sy) * atlas.w + fx + sx) * 4;
        const a = atlas.px[s + 3] / 255;
        r = Math.round(atlas.px[s] * a + r * (1 - a));
        g = Math.round(atlas.px[s + 1] * a + g * (1 - a));
        b = Math.round(atlas.px[s + 2] * a + b * (1 - a));
      }
      px.set([r, g, b, 255], o);
    }
  }
  return writePng(size, size, px);
}
