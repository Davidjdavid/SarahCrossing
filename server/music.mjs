// The music library: David's tracks from the games, kept on the server (never in GitHub: gigabytes, and not ours to
// publish), in one folder that the beta and live sites share. One folder per game, as they were downloaded; the game
// reads the hour (and rain or snow) from each file's name, so the island can play each hour's track from a game picked
// at random for that hour.
//
//   GET    /api/music                    {tracks: [{path, game, name, hour, weather, size}], free}
//   PUT    /api/music/file?path=<a/b.mp3>   the file itself as the body (one at a time, from the Music app)
//   DELETE /api/music/game?name=<folder>    a game's folder, with everything in it
//   POST   /api/music/tidy               non-music files and the lesser copies of a track in two formats deleted
//   GET    /music/<path>                 the file, with Range (phones fetch music in pieces)

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const MUSIC_EXT = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
};
export const MAX_TRACK_BYTES = 120 * 1024 * 1024;
// the disk is kept from filling: an upload that would leave less than this free is refused
export const KEEP_FREE = 1024 * 1024 * 1024;

export class MusicError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// the games' own names, for folders named the way soundtracks are passed round ("ACNL-OST-v4-MP3", "acnr-soundtrack")
const GAME_NAMES = [
  [/\bac\s*nh\b|\bacnr\b|new\s*horizons/i, 'Animal Crossing: New Horizons'],
  [/\bac\s*nl\b|new\s*leaf/i, 'Animal Crossing: New Leaf'],
  [/\bac\s*cf\b|city\s*folk|let'?s\s*go\s*to\s*the\s*city/i, 'Animal Crossing: City Folk'],
  [/\bac\s*ww\b|wild\s*world/i, 'Animal Crossing: Wild World'],
  [/\bac\s*pc\b|pocket\s*camp/i, 'Animal Crossing: Pocket Camp'],
  [/\bhhd\b|happy\s*home\s*designer/i, 'Animal Crossing: Happy Home Designer'],
  [/\bac\s*(gc|pg)\b|population\s*growing|^animal\s*crossing$/i, 'Animal Crossing'],
];
// the words in a folder's name that only say how it was ripped
const RIP_WORD = /^(mp3|flac|ogg|m4a|aac|wav|opus|v\d+|ost|osts|bgm|soundtrack|soundtracks|gamerip|rip|music|complete|original|\d+\s*kbps|\d+\s*khz|\d+\s*bit|\d{4})$/i;

/** A folder or file name as downloaded, tidied into a game's name ("Animal_Crossing_New_Horizons_OST_(2020)_[MP3]"). */
export function gameName(folder) {
  const raw = String(folder);
  for (const [re, name] of GAME_NAMES) if (re.test(raw.replace(/[_-]+/g, ' '))) return name;
  let s = raw.replace(/[_]+/g, ' ');
  // (words joined by dashes: "Some-Game-OST-v2-MP3")
  if (!/\s/.test(s.trim()) && /-/.test(s)) s = s.split('-').filter((w) => w && !RIP_WORD.test(w)).join(' ');
  s = s.replace(/[[(][^\])]*(mp3|flac|ogg|m4a|aac|wav|kbps|khz|bit|rip|ost|soundtrack|\d{4})[^\])]*[\])]/gi, ' ');
  s = s.replace(/\b(original\s+)?(sound\s*track|ost|gamerip|game\s*rip|complete\s+music|music)\b/gi, ' ');
  s = s.replace(/(^|\s)-(?=\s|$)/g, ' ').replace(/\s+-\s*$/, '').replace(/\s{2,}/g, ' ').trim();
  return s || raw.trim();
}

// what's left of a track's name once its hour, weather, game and filler are taken out: an hourly track leaves nothing
// (a jingle, a holiday or a countdown at an hour leaves its own words: "Radio Jingle (Noon 3)", "New Year (1200 AM)")
const HOUR_FILLER = /\b(animal|crossing|new\s*leaf|new\s*horizons|wild\s*world|city\s*folk|let'?s\s*go\s*to\s*the\s*city|population\s*growing|pocket\s*camp|gamecube|acnl|acnh|acnr|acww|accf|acgc|3ds|nds|ds|wii|wii\s*u|switch|gcn?|n64|ost|bgm|theme|music|hourly|o'?clock|clock|sunny|clear|fair|cloudy|rain|rainy|raining|storm|snow|snowy|snowing|weather|version|ver|loop|looped|extended|full|track|am|pm|a\.m|p\.m|midnight|noon|h)\b/gi;

/** What a file's name says: the hour it's for (0-23, or null), the weather and a tidy name. */
export function readTrackName(file) {
  const base = path.basename(file, path.extname(file));
  // the track number in front ("05 - ", "1-05. ", "Track 05 ") isn't the hour
  let name = base.replace(/_/g, ' ').replace(/^\s*(?:track\s*)?(?:\d+[-.])?\d+(?![\d:]|\s*(?:[ap]\.?\s*m\b|h(?:\b|\d)|o'?clock))\s*[-._)\]]?\s*/i, '').trim() || base;
  // and the game's name in front of every track ("Animal Crossing New Leaf (3DS) - Museum") goes too
  const lead = /^(?:animal\s*crossing[^-]*?|ac\s*(?:nl|nh|ww|cf|gc))\s*(?:\([^)]*\))?\s+-\s+(.+)$/i.exec(name);
  if (lead) name = lead[1].trim();
  let hour = null;
  let mins = 0;
  let said = '';
  // "5 PM", "5:00 p.m.", and the hours as New Horizons writes them: "1200 AM", "100 PM"
  const ampm = /(?:^|[^\d])(1[0-2]|0?[1-9])(?:\s*[:.]?\s*([0-5]\d))?\s*([ap])\.?\s*m\b\.?/i.exec(name);
  const h24 = /(?:^|[^\d:])([01]?\d|2[0-3])\s*(?::00|h00|h)\b/i.exec(name);
  if (ampm) {
    hour = (Number(ampm[1]) % 12) + (ampm[3].toLowerCase() === 'p' ? 12 : 0);
    mins = Number(ampm[2] || 0);
    said = ampm[0];
  } else if (/\bmidnight\b/i.test(name)) hour = 0;
  else if (/\bnoon\b/i.test(name)) hour = 12;
  else if (h24) [hour, said] = [Number(h24[1]), h24[0]];
  // an hour's track is only the hour (and its weather): not a jingle, a holiday's night or a countdown at half past
  if (hour != null && (mins || name.replace(said, ' ').replace(HOUR_FILLER, ' ').replace(/[^a-z]+/gi, '').length)) hour = null;
  const weather = /\b(rain|rainy|raining|storm)\b/i.test(name) ? 'rain' : /\b(snow|snowy|snowing)\b/i.test(name) ? 'snow' : 'clear';
  return { hour, weather, name };
}

// when a track is there in more than one format (as soundtracks come: MP3 and FLAC, MP3 and OGG), the one kept: MP3
// plays everywhere and is the smallest
export const FORMAT_RANK = ['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.oga', '.webm', '.flac', '.wav'];
const rankOf = (file) => {
  const i = FORMAT_RANK.indexOf(path.extname(file).toLowerCase());
  return i < 0 ? 99 : i;
};
const sansExt = (file) => file.slice(0, file.length - path.extname(file).length);

/** One safe relative path inside the folder (two folders deep at most), or an error. */
export function safeMusicPath(rel) {
  const parts = String(rel || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length || parts.length > 3) throw new MusicError(400, 'Bad path');
  for (const p of parts) {
    if (p === '.' || p === '..' || p.startsWith('.') || /[\u0000-\u001f\u007f]/.test(p) || p.length > 180) throw new MusicError(400, 'Bad path');
  }
  if (!MUSIC_EXT[path.extname(parts[parts.length - 1]).toLowerCase()]) throw new MusicError(415, 'Not a music file');
  return parts.join('/');
}

export class Music {
  constructor(dir) {
    this.dir = path.resolve(dir);
    this.cache = null;
  }

  async list() {
    // (kept a minute: the other site uploads into the same folder)
    if (this.cache && Date.now() - this.cache.at < 60_000) return this.cache.list;
    const tracks = [];
    const walk = async (rel, depth) => {
      let ents;
      try {
        ents = await fsp.readdir(path.join(this.dir, rel), { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of ents) {
        if (e.name.startsWith('.')) continue;
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory() && depth < 2) await walk(r, depth + 1);
        else if (e.isFile() && MUSIC_EXT[path.extname(e.name).toLowerCase()]) {
          const st = await fsp.stat(path.join(this.dir, r)).catch(() => null);
          if (!st) continue;
          const top = r.includes('/') ? r.split('/')[0] : null;
          tracks.push({ path: r, game: top ? gameName(top) : 'Other', size: st.size, ...readTrackName(e.name) });
        }
      }
    };
    await walk('', 0);
    // (one of each track: the best format where it's there twice)
    const best = new Map();
    for (const t of tracks) {
      const k = sansExt(t.path);
      if (!best.has(k) || rankOf(t.path) < rankOf(best.get(k).path)) best.set(k, t);
    }
    tracks.splice(0, tracks.length, ...best.values());
    tracks.sort((a, b) => a.game.localeCompare(b.game) || (a.hour ?? 99) - (b.hour ?? 99) || a.path.localeCompare(b.path));
    const list = { tracks, free: await this.free() };
    this.cache = { at: Date.now(), list };
    return list;
  }

  async free() {
    try {
      await fsp.mkdir(this.dir, { recursive: true });
      const s = await fsp.statfs(this.dir);
      return s.bavail * s.bsize;
    } catch {
      return null;
    }
  }

  /** Write one uploaded file (the request's body), through a temporary file. */
  async put(rel, req) {
    rel = safeMusicPath(rel);
    const size = Number(req.headers['content-length']);
    if (!(size > 0)) throw new MusicError(411, 'Send the file with its length');
    if (size > MAX_TRACK_BYTES) throw new MusicError(413, 'That file is too big for the music folder');
    const free = await this.free();
    if (free != null && free - size < KEEP_FREE) throw new MusicError(507, "The server's disk is nearly full");
    const file = path.join(this.dir, rel);
    await fsp.mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.part-' + process.pid + '-' + Date.now();
    await new Promise((resolve, reject) => {
      let got = 0;
      const out = fs.createWriteStream(tmp);
      const fail = (err) => {
        out.destroy();
        fsp.rm(tmp, { force: true }).finally(() => reject(err));
      };
      req.on('data', (c) => {
        got += c.length;
        if (got > size || got > MAX_TRACK_BYTES) {
          req.destroy();
          fail(new MusicError(413, 'Too large'));
        }
      });
      req.on('aborted', () => fail(new MusicError(400, 'The upload was cut off')));
      req.pipe(out);
      out.on('error', fail);
      out.on('finish', () => (got === size ? resolve() : fail(new MusicError(400, 'The upload was cut off'))));
    });
    await fsp.rename(tmp, file);
    this.cache = null;
    return { path: rel, size };
  }

  /** Tidy the folder (David, 27 October: "delete duplicate files and the non music files"): every file that isn't
   * music (covers, playlists, notes) goes, and of a track there in two formats only the best stays (FORMAT_RANK);
   * folders left empty go too. An upload still being written (".part-") is left alone. */
  async tidy() {
    const removed = [];
    let bytes = 0;
    const drop = async (rel) => {
      const st = await fsp.stat(path.join(this.dir, rel)).catch(() => null);
      await fsp.rm(path.join(this.dir, rel), { force: true });
      removed.push(rel);
      bytes += st ? st.size : 0;
    };
    const walk = async (rel, depth) => {
      const ents = await fsp.readdir(path.join(this.dir, rel), { withFileTypes: true }).catch(() => []);
      const music = [];
      for (const e of ents) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) {
          if (depth < 3) await walk(r, depth + 1);
          continue;
        }
        if (!e.isFile() || /\.part-\d+-\d+$/.test(e.name)) continue;
        if (MUSIC_EXT[path.extname(e.name).toLowerCase()]) music.push(r);
        else await drop(r);
      }
      const best = new Map();
      for (const r of music) {
        const k = sansExt(r);
        if (!best.has(k)) best.set(k, r);
        else if (rankOf(r) < rankOf(best.get(k))) {
          await drop(best.get(k));
          best.set(k, r);
        } else await drop(r);
      }
      if (rel && !(await fsp.readdir(path.join(this.dir, rel)).catch(() => ['?'])).length) await fsp.rmdir(path.join(this.dir, rel)).catch(() => {});
    };
    await walk('', 0);
    this.cache = null;
    return { removed: removed.length, bytes };
  }

  /** Take a game's folder out (by its folder name or its tidy name). */
  async removeGame(name) {
    const ents = await fsp.readdir(this.dir, { withFileTypes: true }).catch(() => []);
    const hit = ents.find((e) => e.isDirectory() && !e.name.startsWith('.') && (e.name === name || gameName(e.name) === name));
    if (!hit) throw new MusicError(404, 'No such game in the music folder');
    await fsp.rm(path.join(this.dir, hit.name), { recursive: true, force: true });
    this.cache = null;
    return { removed: hit.name };
  }

  /** Send one file, in part when the browser asks for a range. */
  async send(req, res, rel) {
    let safe;
    try {
      safe = safeMusicPath(rel);
    } catch {
      throw new MusicError(404, 'Not found');
    }
    const file = path.join(this.dir, safe);
    const st = await fsp.stat(file).catch(() => null);
    if (!st || !st.isFile()) throw new MusicError(404, 'Not found');
    const etag = `"m${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const headers = {
      'Content-Type': MUSIC_EXT[path.extname(file).toLowerCase()],
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    let start = 0;
    let end = st.size - 1;
    let status = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || '').trim());
    if (m && (m[1] || m[2])) {
      if (m[1]) {
        start = Number(m[1]);
        if (m[2]) end = Math.min(end, Number(m[2]));
      } else start = Math.max(0, st.size - Number(m[2]));
      if (start > end || start >= st.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}`, 'Content-Length': 0 });
        return res.end();
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }
}
