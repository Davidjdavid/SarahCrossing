// The island's design (David's note of 28 October, late): during the beta he moves, turns, adds and takes away the stairs,
// the island's props and outdoor furniture and each room's own furniture in the game's designer mode, and what he saves
// is the map the real game uses. One file both sites share (like the music, outside data/ and never in GitHub): the beta
// site writes it, the live site only reads it.
//
//   GET /api/design      {design, rev, at}   (design is null until something is saved)
//   PUT /api/design      {design, rev}  ->  {rev, at}   (where edits are allowed; rev must be the one read, or 409)
//
// Every save keeps the one before it beside it (before-<rev>.json, the last 60), so nothing is ever lost.

import fsp from 'node:fs/promises';
import path from 'node:path';

export const MAX_DESIGN_BYTES = 4 * 1024 * 1024;
const KEEP = 60;
const PARTS = new Set(['v', 'base', 'props', 'added', 'stairs', 'rooms', 'npcs', 'areas', 'note']);

export class DesignError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class Design {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'design.json');
  }

  async read() {
    try {
      const j = JSON.parse(await fsp.readFile(this.file, 'utf8'));
      return { design: j.design || null, rev: j.rev || 0, at: j.at || null };
    } catch (err) {
      if (err.code === 'ENOENT') return { design: null, rev: 0, at: null };
      throw err;
    }
  }

  /** a new design saved over the one read as `rev` (the one before it kept beside it) */
  async write(body) {
    const design = body && body.design;
    if (!design || typeof design !== 'object' || Array.isArray(design)) throw new DesignError(400, 'No design');
    for (const k of Object.keys(design)) if (!PARTS.has(k)) throw new DesignError(400, `Unknown part of a design: ${k}`);
    const text = JSON.stringify(design);
    if (text.length > MAX_DESIGN_BYTES) throw new DesignError(413, 'That design is too big');
    const cur = await this.read();
    if (Number(body.rev || 0) !== cur.rev) throw new DesignError(409, 'The design was changed somewhere else');
    await fsp.mkdir(this.dir, { recursive: true });
    if (cur.design) await fsp.copyFile(this.file, path.join(this.dir, `before-${String(cur.rev).padStart(6, '0')}.json`));
    const out = { rev: cur.rev + 1, at: new Date().toISOString(), design };
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(out));
    await fsp.rename(tmp, this.file);
    await this.prune();
    return { rev: out.rev, at: out.at };
  }

  async prune() {
    const old = (await fsp.readdir(this.dir)).filter((f) => /^before-\d+\.json$/.test(f)).sort();
    for (const f of old.slice(0, Math.max(0, old.length - KEEP))) await fsp.rm(path.join(this.dir, f), { force: true });
  }
}
