// Makes a model (GLB) smaller for the browser to fetch: its points' positions in 16 bits instead of 32, normals in 8,
// colors and picture coordinates in 16 (KHR_mesh_quantization; three.js's glTF loader reads it). The game turns them
// back into plain numbers as it loads each model (EnvModels.unpack in 33g_env_models.js), so nothing else changes.
//
//   import { packGlb } from './glb-pack.mjs';   packGlb(buffer) -> a smaller buffer (or the same one if nothing fits)
//
// A position is kept relative to its part's own origin, scaled to fit, and the part's node takes the scale, so a part's
// origin (a folk's foot or eye turns about it) stays where it was. Anything unusual (shared or interleaved data, sparse
// accessors, nodes with children or a matrix, animation, morph targets) is copied as it is.

const FLOAT = 5126, BYTE = 5120, SHORT = 5122, USHORT = 5123;
const SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const pad4 = (n) => (n + 3) & ~3;

function readFloats(bin, json, acc) {
  const view = json.bufferViews[acc.bufferView], n = acc.count * SIZES[acc.type];
  const at = (view.byteOffset || 0) + (acc.byteOffset || 0);
  return new Float32Array(Uint8Array.from(bin.subarray(at, at + n * 4)).buffer);
}

export function packGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2) return buf;
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binAt = 20 + jsonLen;
  if (binAt + 8 > buf.length || buf.readUInt32LE(binAt + 4) !== 0x004e4942) return buf;
  const bin = buf.subarray(binAt + 8, binAt + 8 + buf.readUInt32LE(binAt));
  if ((json.buffers || []).length !== 1 || json.animations?.length) return buf;

  // which accessors each buffer view holds, and who uses each mesh
  const viewUse = new Map();
  (json.accessors || []).forEach((a, i) => {
    if (a.bufferView === undefined) return;
    viewUse.set(a.bufferView, (viewUse.get(a.bufferView) || []).concat(i));
  });
  for (const im of json.images || []) if (im.bufferView !== undefined) viewUse.set(im.bufferView, (viewUse.get(im.bufferView) || []).concat(-1));
  const meshNodes = new Map();
  for (const node of json.nodes || []) if (node.mesh !== undefined) meshNodes.set(node.mesh, (meshNodes.get(node.mesh) || []).concat(node));
  const accUse = new Map();   // accessor -> how many attribute slots use it
  for (const m of json.meshes || []) for (const p of m.primitives) for (const a of Object.values(p.attributes)) accUse.set(a, (accUse.get(a) || 0) + 1);
  const plain = (i) => {
    const a = json.accessors[i];
    if (a.componentType !== FLOAT || a.sparse || a.bufferView === undefined || accUse.get(i) !== 1) return false;
    const view = json.bufferViews[a.bufferView];
    return !view.byteStride && viewUse.get(a.bufferView).length === 1;
  };

  // what each accessor becomes: { type, normalized, scale? }
  const plan = new Map();
  let quant = false;
  (json.meshes || []).forEach((m, mi) => {
    const nodes = meshNodes.get(mi) || [];
    const prims = m.primitives;
    if (prims.some((p) => p.targets)) return;
    for (const p of prims) {
      for (const [sem, i] of Object.entries(p.attributes)) {
        if (!plain(i)) continue;
        const a = json.accessors[i];
        if (sem === 'NORMAL' && a.type === 'VEC3') { plan.set(i, { ct: BYTE }); quant = true; }
        else if (/^COLOR_\d+$/.test(sem)) plan.set(i, { ct: USHORT });
        else if (/^TEXCOORD_\d+$/.test(sem) && a.type === 'VEC2') {
          const f = readFloats(bin, json, a);
          if (f.every((v) => v >= 0 && v <= 1)) plan.set(i, { ct: USHORT });
        }
      }
    }
    // positions: one scale for the whole mesh (it goes on the node), only on plain leaf nodes
    const pos = prims.map((p) => p.attributes.POSITION);
    if (!nodes.length || nodes.some((n) => n.matrix || n.children?.length || n.skin !== undefined)) return;
    if (pos.some((i) => i === undefined || !plain(i))) return;
    let s = 0;
    for (const i of pos) for (const v of readFloats(bin, json, json.accessors[i])) s = Math.max(s, Math.abs(v));
    if (!(s > 0)) return;
    for (const i of pos) plan.set(i, { ct: SHORT, scale: s });
    for (const n of nodes) n.scale = (n.scale || [1, 1, 1]).map((v) => v * s);
    quant = true;
  });
  if (!plan.size) return buf;

  // the new binary: every buffer view in order, packed where planned, copied otherwise
  const parts = [], views = [];
  let len = 0;
  const put = (bytes, view) => {
    const at = len;
    parts.push(bytes);
    len += bytes.length;
    const padTo = pad4(len);
    if (padTo > len) { parts.push(Buffer.alloc(padTo - len)); len = padTo; }
    views.push(Object.assign({}, view, { byteOffset: at, byteLength: bytes.length }));
  };
  json.bufferViews.forEach((view, vi) => {
    const use = viewUse.get(vi) || [];
    const i = use.length === 1 ? use[0] : -1, p = i >= 0 ? plan.get(i) : null;
    if (!p) {
      const at = view.byteOffset || 0;
      put(bin.subarray(at, at + view.byteLength), (({ byteOffset, byteLength, ...rest }) => rest)(view));
      return;
    }
    const a = json.accessors[i], n = SIZES[a.type], f = readFloats(bin, json, a);
    const size = p.ct === BYTE ? 1 : 2, item = n * size, stride = pad4(item);
    const out = Buffer.alloc(a.count * stride);
    const min = new Array(n).fill(Infinity), max = new Array(n).fill(-Infinity);
    for (let k = 0; k < a.count; k++) {
      for (let j = 0; j < n; j++) {
        const v = f[k * n + j], o = k * stride + j * size;
        let q;
        if (p.ct === BYTE) { q = Math.round(Math.max(-1, Math.min(1, v)) * 127); out.writeInt8(q, o); }
        else if (p.ct === SHORT) { q = Math.round((v / p.scale) * 32767); out.writeInt16LE(q, o); }
        else { q = Math.round(Math.max(0, Math.min(1, v)) * 65535); out.writeUInt16LE(q, o); }
        if (q < min[j]) min[j] = q;
        if (q > max[j]) max[j] = q;
      }
    }
    const nv = { buffer: 0, target: view.target || 34962 };
    if (stride !== item) nv.byteStride = stride;
    put(out, nv);
    a.componentType = p.ct;
    a.normalized = true;
    a.byteOffset = 0;
    if (a.min) a.min = min;
    if (a.max) a.max = max;
  });
  json.bufferViews = views;
  json.buffers[0].byteLength = len;
  if (quant) {
    json.extensionsUsed = [...new Set((json.extensionsUsed || []).concat('KHR_mesh_quantization'))];
    json.extensionsRequired = [...new Set((json.extensionsRequired || []).concat('KHR_mesh_quantization'))];
  }

  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  if (jsonBuf.length % 4) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(4 - (jsonBuf.length % 4), 0x20)]);
  const binBuf = Buffer.concat(parts);
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);
  jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(binBuf.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  const packed = Buffer.concat([head, jh, jsonBuf, bh, binBuf]);
  return packed.length < buf.length ? packed : buf;
}
