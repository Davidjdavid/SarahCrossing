// The islands (save files) kept on the server, one folder per island:
//
//   <dir>/islands/<id>/island.json    { id, rev, createdAt, updatedAt, device, summary, state }
//   <dir>/islands/<id>/photos.json    { photos: [{ url, t, tags? }] }   the phone camera's album
//   <dir>/islands/<id>/backups/       earlier copies of island.json (see "backups" below)
//   <dir>/islands/<id>/people/<who>.json          a visitor's own things on this island
//                                                 (pocket, money, friends...): { who, rev, updatedAt, device, state }
//   <dir>/islands/<id>/people/<who>.photos.json   their photo album
//   <dir>/islands/<id>/people/backups/            a copy of each visitor a day, kept two weeks
//   <dir>/islands/<id>/mail/<who>.json            letters waiting for someone: { seq, letters: [...] }
//   <dir>/trash/<id>--<time>/         deleted islands, kept for TRASH_DAYS days
//
// `state` is the game's save object (S in game/src/11_save.js), exactly as the
// game sent it. `rev` goes up by one on every save; a save names the rev it was
// based on, so a device that missed a newer save can't write over it (409).
// Visitors (David, James, John, Joe) play on Sarah's island: the island is hers,
// so their saves only hold what's theirs (game/src/13_online.js splits them).

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const HOUR = 3600_000;
const DAY = 24 * HOUR;
/** While someone plays, the island is copied to backups/ at most this often... */
export const BACKUP_EVERY_MS = HOUR;
/** ...and all of those copies are kept for two days; after that, one per day for 60 days. */
const KEEP_ALL_MS = 2 * DAY;
const KEEP_DAILY_MS = 60 * DAY;
/** Copies made before an import, a restore or an overwrite are kept 90 days (the newest 50 at most). */
const KEEP_SPECIAL_MS = 90 * DAY;
const KEEP_SPECIAL_MAX = 50;
const TRASH_DAYS = 30;
const MAX_PHOTOS = 24;
const PERSON_BACKUP_DAYS = 14;
const MAX_LETTERS = 200;

const ID = /^[A-Za-z0-9_-]{6,40}$/;
/** Who someone is: a lower-case name ("david"). */
export const WHO = /^[a-z]{2,20}$/;
const BACKUP_NAME = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)_([a-z-]+)_r(\d+)\.json$/;
const BACKUP_REASONS = new Set(['auto', 'before-import', 'before-restore', 'before-overwrite']);

export class IslandError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '');
const finite = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** What the islands list shows, worked out from the save itself. */
export function summarize(state) {
  const day = finite(state.day) !== null && finite(state.startDay) !== null ? state.day - state.startDay + 1 : null;
  const playMs = finite(state.stats && state.stats.playMs);
  return {
    islandName: text(state.islandName, 40),
    money: finite(state.money),
    day: day !== null && day >= 1 ? day : null,
    playMinutes: playMs !== null ? Math.round(playMs / 60_000) : null,
    seed: text(state.seed, 40),
    cheat: !!(state.flags && state.flags.cheat != null),
  };
}

/** A save the game could load: an object with the island's seed. */
export function checkState(state) {
  if (state === null || typeof state !== 'object' || Array.isArray(state)) throw new IslandError(400, 'A save must be an object');
  if (typeof state.seed !== 'string' || !state.seed) throw new IslandError(400, 'That is not a Sarah Crossing save (it has no island seed)');
}

/** Who saved: a random id per browser and a name like "iPhone". */
function checkDevice(device) {
  if (!device || typeof device !== 'object') return null;
  const id = text(device.id, 40);
  return id ? { id, name: text(device.name, 40) } : null;
}

const stamp = (ms) => new Date(ms).toISOString().replace(/[:.]/g, '-');
const stampMs = (s) => Date.parse(s.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, '$1:$2:$3.$4Z'));

/** Write through a temporary file, so a crash never leaves half a file. */
async function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    await fsp.writeFile(tmp, data, { mode: 0o640, flush: true });
    await fsp.rename(tmp, file);
  } catch (err) {
    await fsp.rm(tmp, { force: true });
    throw err;
  }
}

/** A record as stored: `state` last, so the fields before it can be read without the (big) state. */
const serialize = (rec) =>
  JSON.stringify({ id: rec.id, rev: rec.rev, createdAt: rec.createdAt, updatedAt: rec.updatedAt, device: rec.device, summary: rec.summary, state: rec.state });

/** The fields before `state`, reading only the start of the file. */
async function readHead(file) {
  const fh = await fsp.open(file, 'r');
  try {
    const buf = Buffer.alloc(8192);
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    const head = buf.subarray(0, bytesRead).toString('utf8');
    const at = head.indexOf(',"state":');
    if (at > 0) return JSON.parse(head.slice(0, at) + '}');
  } finally {
    await fh.close();
  }
  const { state, ...rest } = JSON.parse(await fsp.readFile(file, 'utf8'));
  return rest;
}

const info = (rec) => ({ id: rec.id, rev: rec.rev, createdAt: rec.createdAt, updatedAt: rec.updatedAt, device: rec.device || null, summary: rec.summary });

export class Islands {
  constructor(dir, { now = () => Date.now(), log = (msg) => console.error(msg) } = {}) {
    this.dir = path.resolve(dir);
    this.root = path.join(this.dir, 'islands');
    this.trash = path.join(this.dir, 'trash');
    this.now = now;
    this.log = log;
    this.queues = new Map();
    this.lastMs = 0;
    fs.mkdirSync(this.root, { recursive: true });
    fs.mkdirSync(this.trash, { recursive: true });
  }

  folder(id) {
    if (typeof id !== 'string' || !ID.test(id)) throw new IslandError(404, 'No such island');
    return path.join(this.root, id);
  }

  /** Times always move forward, so names made from them sort in order. */
  tick() {
    this.lastMs = Math.max(this.now(), this.lastMs + 1);
    return this.lastMs;
  }

  /** One change at a time per island. */
  queued(id, task) {
    const run = (this.queues.get(id) ?? Promise.resolve()).then(task);
    const tail = run.catch(() => {});
    this.queues.set(id, tail);
    tail.then(() => {
      if (this.queues.get(id) === tail) this.queues.delete(id);
    });
    return run;
  }

  async read(id) {
    const file = path.join(this.folder(id), 'island.json');
    try {
      return JSON.parse(await fsp.readFile(file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') throw new IslandError(404, 'No such island');
      throw err;
    }
  }

  /** Every island, the most recently played first. */
  async list() {
    const out = [];
    for (const id of await fsp.readdir(this.root)) {
      if (!ID.test(id)) continue;
      try {
        out.push(info(await readHead(path.join(this.root, id, 'island.json'))));
      } catch (err) {
        if (err.code !== 'ENOENT') this.log(`island ${id} is unreadable: ${err.message}`);
      }
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id) {
    return this.read(id);
  }

  async create(state, { device } = {}) {
    checkState(state);
    const id = crypto.randomBytes(8).toString('base64url');
    const at = this.tick();
    const rec = { id, rev: 1, createdAt: at, updatedAt: at, device: checkDevice(device), summary: summarize(state), state };
    await fsp.mkdir(path.join(this.root, id, 'backups'), { recursive: true });
    await writeAtomic(path.join(this.root, id, 'island.json'), serialize(rec));
    return rec;
  }

  /**
   * Save a new state over the island. `baseRev` is the rev the game last loaded or
   * saved; if the island has moved on since (another device saved), it's refused
   * with 409 and the newer island's details, unless `force` (then the newer one is
   * kept as a backup). `reason` names the backup made first: 'auto' (at most hourly)
   * for ordinary saves, 'before-import' when a save file replaces the island.
   */
  async save(id, state, { baseRev, device, force = false, reason = 'auto' } = {}) {
    checkState(state);
    this.folder(id);
    return this.queued(id, async () => {
      const cur = await this.read(id);
      if (!force && baseRev !== cur.rev) throw new IslandError(409, 'This island was saved from somewhere else in the meantime', { island: info(cur) });
      const why = force && baseRev !== cur.rev && reason === 'auto' ? 'before-overwrite' : reason;
      await this.backupIfDue(cur, why);
      const rec = { ...cur, rev: cur.rev + 1, updatedAt: this.tick(), device: checkDevice(device), summary: summarize(state), state };
      await writeAtomic(path.join(this.folder(id), 'island.json'), serialize(rec));
      return rec;
    });
  }

  /** Copy the island as it is now to backups/: always for special reasons, hourly for 'auto'. */
  async backupIfDue(cur, reason) {
    if (!BACKUP_REASONS.has(reason)) throw new Error(`unknown backup reason ${reason}`);
    const dir = path.join(this.folder(cur.id), 'backups');
    await fsp.mkdir(dir, { recursive: true });
    if (reason === 'auto') {
      const newest = (await this.backupNames(cur.id)).at(-1);
      if (newest && this.now() - stampMs(BACKUP_NAME.exec(newest)[1]) < BACKUP_EVERY_MS) return;
    }
    await writeAtomic(path.join(dir, `${stamp(this.tick())}_${reason}_r${cur.rev}.json`), serialize(cur));
    await this.prune(cur.id);
  }

  async backupNames(id) {
    try {
      return (await fsp.readdir(path.join(this.folder(id), 'backups'))).filter((f) => BACKUP_NAME.test(f)).sort();
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async prune(id) {
    const now = this.now();
    const dir = path.join(this.folder(id), 'backups');
    const names = await this.backupNames(id);
    const keep = new Set();
    const days = new Map();
    const special = [];
    for (const name of names) {
      const [, s, reason] = BACKUP_NAME.exec(name);
      const at = stampMs(s);
      const age = now - at;
      if (reason !== 'auto') {
        if (age < KEEP_SPECIAL_MS) special.push(name);
      } else if (age < KEEP_ALL_MS) {
        keep.add(name);
      } else if (age < KEEP_DAILY_MS) {
        days.set(s.slice(0, 10), name); // names sort by time, so the last one of each day wins
      }
    }
    for (const name of days.values()) keep.add(name);
    for (const name of special.slice(-KEEP_SPECIAL_MAX)) keep.add(name);
    for (const name of names) if (!keep.has(name)) await fsp.rm(path.join(dir, name), { force: true });
  }

  /** The island's backups, newest first. */
  async backups(id) {
    await this.read(id);
    const out = [];
    for (const name of (await this.backupNames(id)).reverse()) {
      const [, s, reason, rev] = BACKUP_NAME.exec(name);
      let head = {};
      try {
        head = await readHead(path.join(this.folder(id), 'backups', name));
      } catch (err) {
        this.log(`backup ${id}/${name} is unreadable: ${err.message}`);
      }
      out.push({ name, at: stampMs(s), reason, rev: Number(rev), savedAt: head.updatedAt ?? null, summary: head.summary ?? null });
    }
    return out;
  }

  async backup(id, name) {
    if (typeof name !== 'string' || !BACKUP_NAME.test(name)) throw new IslandError(404, 'No such backup');
    try {
      return JSON.parse(await fsp.readFile(path.join(this.folder(id), 'backups', name), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') throw new IslandError(404, 'No such backup');
      throw err;
    }
  }

  /** Put a backup back (the island as it is now is backed up first). */
  async restore(id, name, { device } = {}) {
    const old = await this.backup(id, name);
    return this.queued(id, async () => {
      const cur = await this.read(id);
      await this.backupIfDue(cur, 'before-restore');
      const rec = { ...cur, rev: cur.rev + 1, updatedAt: this.tick(), device: checkDevice(device), summary: summarize(old.state), state: old.state };
      await writeAtomic(path.join(this.folder(id), 'island.json'), serialize(rec));
      return rec;
    });
  }

  /** Move the island to the trash (kept TRASH_DAYS days). */
  async remove(id) {
    const dir = this.folder(id);
    return this.queued(id, async () => {
      await this.read(id);
      await fsp.rename(dir, path.join(this.trash, `${id}--${stamp(this.tick())}`));
    });
  }

  /** The album: the island's (Sarah's), or a visitor's when `who` is given. */
  async photos(id, who) {
    await this.read(id);
    try {
      return JSON.parse(await fsp.readFile(this.photosFile(id, who), 'utf8')).photos;
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  photosFile(id, who) {
    if (who === undefined) return path.join(this.folder(id), 'photos.json');
    return path.join(this.folder(id), 'people', `${this.who(who)}.photos.json`);
  }

  who(who) {
    if (typeof who !== 'string' || !WHO.test(who)) throw new IslandError(404, 'No such person');
    return who;
  }

  async setPhotos(id, photos, who) {
    if (!Array.isArray(photos) || photos.length > MAX_PHOTOS) throw new IslandError(400, `Photos must be a list of at most ${MAX_PHOTOS}`);
    for (const p of photos) {
      if (!p || typeof p.url !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.url) || !finite(p.t)) {
        throw new IslandError(400, 'A photo must be { url: "data:image/...", t: <time> }');
      }
      // (what's in it: a few short tags, from the camera's scrapbook)
      if (p.tags !== undefined && (!Array.isArray(p.tags) || p.tags.length > 16 || p.tags.some((t) => typeof t !== 'string' || t.length > 40))) {
        throw new IslandError(400, "A photo's tags must be a list of at most 16 short words");
      }
    }
    const file = this.photosFile(id, who);
    return this.queued(id, async () => {
      await this.read(id);
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await writeAtomic(file, JSON.stringify({ photos: photos.map((p) => (p.tags && p.tags.length ? { url: p.url, t: p.t, tags: p.tags } : { url: p.url, t: p.t })) }));
    });
  }

  // ------------------------------------------------------------------ visitors

  /** A visitor's own save on this island, or 404 if they haven't been yet. */
  async person(id, who) {
    await this.read(id);
    try {
      return JSON.parse(await fsp.readFile(path.join(this.folder(id), 'people', `${this.who(who)}.json`), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') throw new IslandError(404, 'Not here yet');
      throw err;
    }
  }

  /** Save a visitor's things. The first save names baseRev 0; after that, the same rev rules as islands. */
  async savePerson(id, who, state, { baseRev, device, force = false } = {}) {
    if (state === null || typeof state !== 'object' || Array.isArray(state)) throw new IslandError(400, 'A save must be an object');
    this.who(who);
    const dir = path.join(this.folder(id), 'people');
    const file = path.join(dir, `${who}.json`);
    return this.queued(id, async () => {
      await this.read(id);
      let cur = null;
      try {
        cur = JSON.parse(await fsp.readFile(file, 'utf8'));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      const curRev = cur ? cur.rev : 0;
      if (!force && baseRev !== curRev) throw new IslandError(409, 'Saved from somewhere else in the meantime', { person: cur && { who, rev: cur.rev, updatedAt: cur.updatedAt, device: cur.device || null } });
      await fsp.mkdir(path.join(dir, 'backups'), { recursive: true });
      if (cur) await this.personBackup(dir, who, cur);
      const rec = { who, rev: curRev + 1, updatedAt: this.tick(), device: checkDevice(device), state };
      await writeAtomic(file, JSON.stringify(rec));
      return rec;
    });
  }

  /** One copy of a visitor per day (the first save of the day keeps yesterday's), for two weeks. */
  async personBackup(dir, who, cur) {
    const day = new Date(this.now()).toISOString().slice(0, 10);
    const name = `${who}-${day}.json`;
    const backups = path.join(dir, 'backups');
    if (fs.existsSync(path.join(backups, name))) return;
    await writeAtomic(path.join(backups, name), JSON.stringify(cur));
    for (const f of await fsp.readdir(backups)) {
      const m = /^([a-z]+)-(\d{4}-\d{2}-\d{2})\.json$/.exec(f);
      if (m && this.now() - Date.parse(m[2]) > PERSON_BACKUP_DAYS * DAY) await fsp.rm(path.join(backups, f), { force: true });
    }
  }

  /** Who has been to this island, with their summaries (not their saves). */
  async people(id) {
    await this.read(id);
    const dir = path.join(this.folder(id), 'people');
    const out = [];
    let names = [];
    try {
      names = await fsp.readdir(dir);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    for (const f of names) {
      const m = /^([a-z]{2,20})\.json$/.exec(f);
      if (!m) continue;
      try {
        const { state, ...rest } = JSON.parse(await fsp.readFile(path.join(dir, f), 'utf8'));
        out.push({ ...rest, money: finite(state && state.money) });
      } catch (err) {
        this.log(`visitor ${id}/${f} is unreadable: ${err.message}`);
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ mail between people

  mailFile(id, who) {
    return path.join(this.folder(id), 'mail', `${this.who(who)}.json`);
  }

  async readMail(id, who) {
    try {
      return JSON.parse(await fsp.readFile(this.mailFile(id, who), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return { seq: 0, letters: [] };
      throw err;
    }
  }

  /** Letters waiting for `who`, oldest first; each has a seq. */
  async mail(id, who) {
    await this.read(id);
    return (await this.readMail(id, who)).letters;
  }

  /** Post a letter (and maybe a gift) to someone on this island. */
  async post(id, letter) {
    const to = this.who(letter && letter.to);
    const from = this.who(letter.from);
    const clean = {
      to,
      from,
      subject: text(letter.subject, 80) || 'A letter',
      body: typeof letter.body === 'string' ? letter.body.replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, '').slice(0, 2000) : '',
      gift: typeof letter.gift === 'string' && /^[a-z0-9_]{1,40}$/.test(letter.gift) ? letter.gift : null,
    };
    return this.queued(id, async () => {
      await this.read(id);
      const box = await this.readMail(id, to);
      if (box.letters.length >= MAX_LETTERS) throw new IslandError(429, `${to}'s mailbox is full`);
      const rec = { ...clean, seq: box.seq + 1, at: this.tick() };
      box.seq = rec.seq;
      box.letters.push(rec);
      await fsp.mkdir(path.dirname(this.mailFile(id, to)), { recursive: true });
      await writeAtomic(this.mailFile(id, to), JSON.stringify(box));
      return rec;
    });
  }

  /** The letters up to `upTo` have been delivered into `who`'s game: take them out of the box. */
  async takeMail(id, who, upTo) {
    if (!Number.isInteger(upTo) || upTo < 0) throw new IslandError(400, 'upTo must be a letter number');
    return this.queued(id, async () => {
      await this.read(id);
      const box = await this.readMail(id, who);
      const left = box.letters.filter((l) => l.seq > upTo);
      if (left.length === box.letters.length) return box.letters;
      box.letters = left;
      await writeAtomic(this.mailFile(id, who), JSON.stringify(box));
      return left;
    });
  }

  /** Empty the trash of islands deleted more than TRASH_DAYS days ago. */
  async sweep() {
    const now = this.now();
    for (const name of await fsp.readdir(this.trash)) {
      const m = /--(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)$/.exec(name);
      if (m && now - stampMs(m[1]) > TRASH_DAYS * DAY) await fsp.rm(path.join(this.trash, name), { recursive: true, force: true });
    }
  }
}
