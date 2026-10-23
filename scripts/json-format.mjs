// JSON written so it's easy to read and to compare between versions: the outer
// levels one entry per line, anything deeper kept on its entry's line.
//
//   formatJson(value, 2)   e.g. gamedata.json: one line per item, recipe, ...

/** `depth` = how many levels open up onto their own lines. */
export function formatJson(value, depth) {
  return fmt(value, depth, '') + '\n';
}

function fmt(v, depth, indent) {
  const flat = JSON.stringify(v);
  if (depth <= 0 || v === null || typeof v !== 'object') return flat;
  const entries = Array.isArray(v) ? v.map((x) => [null, x]) : Object.entries(v);
  if (!entries.length) return flat;
  // Short lists of plain values stay on one line ([x, y] spots and the like).
  const nested = entries.some(([, x]) => x !== null && typeof x === 'object');
  if (!nested && flat.length <= 100) return flat;
  const inner = indent + '  ';
  const lines = entries.map(([k, x]) => inner + (k === null ? '' : JSON.stringify(k) + ': ') + fmt(x, depth - 1, inner));
  return (Array.isArray(v) ? '[' : '{') + '\n' + lines.join(',\n') + '\n' + indent + (Array.isArray(v) ? ']' : '}');
}
