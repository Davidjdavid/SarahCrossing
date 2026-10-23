// Sarah Crossing game server (Node 22, built-in modules only).
//
// Serves the built game (dist/) behind a password, and keeps the islands (save
// files) so they follow you from device to device. Caddy sits in front of it in
// production (HTTPS), so it only listens on 127.0.0.1.
//
//   SITE_PASSWORD=... DATA_DIR=/var/lib/sarahcrossing node server/server.mjs
//
// Environment:
//   PORT            default 8090
//   HOST            default 127.0.0.1
//   STATIC_DIR      the built game, default ./dist
//   DATA_DIR        islands, backups and the cookie secret, default ./data
//   SITE_PASSWORD   the password players type once. Required when NODE_ENV=production;
//                   without it (on a computer) there's no login.
//
// API (JSON; writes need the header "X-Sarah: 1", which other sites can't send):
//   GET    /api/islands                      every island, most recently played first
//   POST   /api/islands        {state}       a new island -> {island, rev}
//   GET    /api/islands/<id>                 {island, rev, state}
//   PUT    /api/islands/<id>   {state, baseRev, force?, reason?}  -> {island, rev}, or 409 {island}
//   DELETE /api/islands/<id>                 to the trash (kept 30 days)
//   GET    /api/islands/<id>/backups         [{name, at, reason, rev, summary}]
//   GET    /api/islands/<id>/backups/<name>  {island, state}
//   POST   /api/islands/<id>/restore {name}  put a backup back -> {island, rev}
//   GET    /api/islands/<id>/photos          {photos}
//   PUT    /api/islands/<id>/photos {photos}
//   POST   /api/log            {message, ...}   a problem in the game, for the server log
// Request bodies may be gzip-compressed (Content-Encoding: gzip).

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { IslandError, Islands } from './islands.mjs';

const gunzip = promisify(zlib.gunzip);

const PORT = Number(process.env.PORT || 8090);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.resolve(import.meta.dirname, '..');
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || path.join(ROOT, 'dist'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const PASSWORD = process.env.SITE_PASSWORD || '';
const PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE = 'sc_access';
const COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60; // ten years, in seconds
const MAX_SAVE_BYTES = 16 * 1024 * 1024; // a save is ~100 KB; this is plenty of room
const MAX_PHOTOS_BYTES = 16 * 1024 * 1024;
const MAX_SMALL_BYTES = 16 * 1024;
const LOGIN_FAILURES_ALLOWED = 10; // per IP...
const LOGIN_WINDOW_MS = 60_000; // ...per minute
const LOGS_ALLOWED = 30; // game problem reports per IP per minute

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

// The game draws on canvases, makes images from blobs and data URLs, and loads its fonts from Google.
const GAME_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

if (PRODUCTION && !PASSWORD) {
  console.error("Can't start: set SITE_PASSWORD (the password players type).");
  process.exit(1);
}

const islands = new Islands(DATA_DIR);

/** The secret that signs the login cookie. Made once; replacing it logs everyone out. */
function loadSecret() {
  const file = path.join(DATA_DIR, 'secret');
  try {
    const s = fs.readFileSync(file, 'utf8').trim();
    if (s) return s;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const s = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, s + '\n', { mode: 0o600 });
  return s;
}
// The cookie proves the browser knew the password; it changes when the password does.
const TOKEN = crypto.createHmac('sha256', loadSecret()).update(PASSWORD).digest('hex');

function readVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(STATIC_DIR, 'build.json'), 'utf8')).version;
  } catch {
    return process.env.APP_VERSION || 'dev';
  }
}
const VERSION = readVersion();

// ----------------------------------------------------------------- helpers

/** Compare two strings without leaking how much of them matched. */
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

const isLoopback = (addr) => addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';

/** The visitor's IP. Caddy (on this machine) puts it last in X-Forwarded-For. */
function clientIp(req) {
  const remote = req.socket.remoteAddress ?? '';
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && isLoopback(remote)) {
    const last = String(forwarded).split(',').pop().trim();
    if (last) return last;
  }
  return remote;
}

const oneLine = (s, max = 300) => String(s).replace(/[\u0000-\u001f\u007f]+/g, ' ').slice(0, max);

function logLine(req, outcome, message) {
  console.error(`${new Date().toISOString()} ${clientIp(req)} ${oneLine(req.method, 16)} ${oneLine(req.url, 200)} -> ${outcome}: ${oneLine(message, 2000)}`);
}

function send(res, status, body = '', headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, { 'Content-Length': buf.length, 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(res.req.method === 'HEAD' ? undefined : buf);
}

const sendText = (res, status, text, headers = {}) => send(res, status, text, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
const sendJson = (res, status, value) => send(res, status, JSON.stringify(value), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
const redirect = (res, status, location) => send(res, status, '', { Location: location, 'Cache-Control': 'no-store' });

/** Read a request body (gunzipped if it was sent compressed), refusing anything over `limit` bytes. */
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const finish = (err, value) => {
      if (done) return;
      done = true;
      if (err) reject(err);
      else resolve(value);
    };
    if (Number(req.headers['content-length']) > limit) finish(new HttpError(413, 'Too large'));
    req.on('data', (chunk) => {
      size += chunk.length;
      if (done) {
        if (size > limit * 2) req.destroy();
      } else if (size > limit) {
        finish(new HttpError(413, 'Too large'));
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => finish(null, Buffer.concat(chunks)));
    req.on('error', (err) => finish(err));
    req.on('close', () => finish(new HttpError(400, 'Request was cut off')));
  }).then(async (buf) => {
    const enc = String(req.headers['content-encoding'] || '').trim().toLowerCase();
    if (!enc || enc === 'identity') return buf;
    if (enc !== 'gzip') throw new HttpError(415, `Can't read ${enc}-encoded requests`);
    try {
      return await gunzip(buf, { maxOutputLength: limit });
    } catch (err) {
      throw new HttpError(err.code === 'ERR_BUFFER_TOO_LARGE' ? 413 : 400, err.code === 'ERR_BUFFER_TOO_LARGE' ? 'Too large' : 'Bad gzip');
    }
  });
}

async function readJson(req, limit) {
  const body = await readBody(req, limit);
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Not valid JSON');
  }
}

function hasAccess(req) {
  if (!PASSWORD) return true;
  const header = req.headers.cookie;
  if (!header) return false;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === COOKIE && safeEqual(part.slice(eq + 1).trim(), TOKEN)) return true;
  }
  return false;
}

/** Where to go after logging in: only ever a page on this site. */
function safeNext(next) {
  if (typeof next !== 'string' || next.length > 2048) return '/';
  if (!next.startsWith('/') || next.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(next)) return '/';
  try {
    const url = new URL(next, 'http://site.invalid');
    if (url.origin !== 'http://site.invalid' || url.pathname === '/login') return '/';
    return url.pathname + url.search;
  } catch {
    return '/';
  }
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** "iPhone", "Android", "Mac", ... from the browser's User-Agent. */
function deviceName(req) {
  const ua = String(req.headers['user-agent'] || '');
  for (const [re, name] of [
    [/iPhone/, 'iPhone'],
    [/iPad/, 'iPad'],
    [/Android/, 'Android'],
    [/CrOS/, 'Chromebook'],
    [/Macintosh/, 'Mac'],
    [/Windows/, 'Windows PC'],
    [/Linux/, 'Linux computer'],
  ]) {
    if (re.test(ua)) return name;
  }
  return 'a browser';
}

/** The browser's own id (made by the game), with a name the islands list can show. */
function deviceOf(req, body) {
  const id = body && body.device && typeof body.device.id === 'string' ? body.device.id : '';
  return id ? { id, name: deviceName(req) } : null;
}

// ------------------------------------------------------------------- login

function loginPage(next, message) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1e2447">
<link rel="icon" href="/favicon.png">
<title>Sarah Crossing</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@700;800&display=swap">
<style>
html, body { height: 100%; }
body { margin: 0; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
  background: radial-gradient(ellipse at 50% 120%, #3a8fd0 0%, #1e2447 70%); color: #3b2a45;
  font: 700 16px/1.45 "Nunito", "Segoe UI", Arial, sans-serif; }
form { width: 100%; max-width: 340px; background: #fff7f1; border-radius: 22px; padding: 28px 24px 22px; box-sizing: border-box;
  box-shadow: 0 6px 0 rgba(59, 42, 69, 0.16), 0 14px 30px rgba(20, 16, 40, 0.28); text-align: center; }
h1 { margin: 0 0 4px; font: 700 34px/1.05 "Fredoka", "Arial Rounded MT Bold", sans-serif; color: #d9674a; }
h1 span { display: block; color: #5f9a33; }
p { margin: 0 0 18px; color: #6e5a78; }
label { display: block; text-align: left; margin-bottom: 6px; }
input { display: block; width: 100%; box-sizing: border-box; margin-bottom: 14px; font: inherit; padding: 10px 14px;
  border: 2px solid #ead3c6; border-radius: 12px; background: #fff; color: inherit; }
input:focus { outline: 3px solid #ffcf57; outline-offset: 1px; }
button { font: 600 18px/1 "Fredoka", sans-serif; color: #fff; background: #8cc152; border: 0; border-radius: 999px;
  padding: 12px 28px; cursor: pointer; box-shadow: 0 4px 0 #5f9a33; }
button:active { transform: translateY(2px); box-shadow: 0 2px 0 #5f9a33; }
.msg { margin: 16px 0 0; color: #b3263a; }
</style>
</head>
<body>
<form method="post" action="/login">
<h1>Sarah<span>Crossing</span></h1>
<p>The island is just past this gate.</p>
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
<input type="hidden" name="next" value="${escapeHtml(next)}">
<button type="submit">Come on in</button>
${message ? `<p class="msg" role="alert">${escapeHtml(message)}</p>\n` : ''}</form>
</body>
</html>
`;
}

function sendLoginPage(res, status, next, message = '', headers = {}) {
  send(res, status, loginPage(next, message), {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; frame-ancestors 'none'",
    ...headers,
  });
}

// Wrong passwords per IP: { count, resetAt }. Problem reports per IP, the same way.
const failedLogins = new Map();
const logReports = new Map();
setInterval(() => {
  const now = Date.now();
  for (const map of [failedLogins, logReports]) for (const [ip, entry] of map) if (entry.resetAt <= now) map.delete(ip);
}, LOGIN_WINDOW_MS).unref();

/** Counts one more for this IP; true while it's within `allowed` per minute. */
function withinLimit(map, ip, allowed) {
  const now = Date.now();
  let entry = map.get(ip);
  if (!entry || entry.resetAt <= now) map.set(ip, (entry = { count: 0, resetAt: now + LOGIN_WINDOW_MS }));
  return ++entry.count <= allowed;
}

async function login(req, res) {
  const form = new URLSearchParams((await readBody(req, MAX_SMALL_BYTES)).toString('utf8'));
  const next = safeNext(form.get('next') ?? '/');
  const ip = clientIp(req);
  const entry = failedLogins.get(ip);
  if (entry && entry.resetAt > Date.now() && entry.count >= LOGIN_FAILURES_ALLOWED) {
    logLine(req, 429, 'too many wrong passwords');
    const wait = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
    return sendLoginPage(res, 429, next, 'Too many tries. Wait a minute, then try again.', { 'Retry-After': String(wait) });
  }
  if (!safeEqual(form.get('password') ?? '', PASSWORD)) {
    withinLimit(failedLogins, ip, LOGIN_FAILURES_ALLOWED);
    return sendLoginPage(res, 401, next, "That's not it. Try again?");
  }
  failedLogins.delete(ip);
  const https = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() === 'https';
  res.setHeader('Set-Cookie', `${COOKIE}=${TOKEN}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${https ? '; Secure' : ''}`);
  return redirect(res, 303, next);
}

// --------------------------------------------------------------------- API

const ISLAND_ROUTE = /^\/api\/islands(?:\/([^/]+)(?:\/(backups|restore|photos)(?:\/([^/]+))?)?)?\/?$/;

/** What the game gets back about an island (everything but the state). */
const islandInfo = (rec) => ({ id: rec.id, rev: rec.rev, createdAt: rec.createdAt, updatedAt: rec.updatedAt, device: rec.device || null, summary: rec.summary });

async function handleApi(req, res, pathname) {
  const method = req.method;
  // Only the game writes, and it always sends this header; a form or image on another site can't.
  if (method !== 'GET' && method !== 'HEAD' && req.headers['x-sarah'] !== '1') throw new HttpError(403, 'Missing X-Sarah header');

  if (pathname === '/api/log') {
    if (method !== 'POST') throw new HttpError(405, 'Use POST');
    const body = await readJson(req, MAX_SMALL_BYTES);
    if (withinLimit(logReports, clientIp(req), LOGS_ALLOWED)) {
      const where = [body.where, body.island].filter((x) => typeof x === 'string' && x).join(' ');
      logLine(req, 'game problem', `${where ? where + ': ' : ''}${body.message ?? ''}${body.stack ? ' | ' + body.stack : ''} | ${deviceName(req)} | ${VERSION}`);
    }
    return sendJson(res, 200, { ok: true });
  }

  const m = ISLAND_ROUTE.exec(pathname);
  if (!m) throw new HttpError(404, 'No such API');
  const [, id, sub, name] = m;

  if (!id) {
    if (method === 'GET' || method === 'HEAD') return sendJson(res, 200, { islands: await islands.list(), version: VERSION });
    if (method === 'POST') {
      const body = await readJson(req, MAX_SAVE_BYTES);
      const rec = await islands.create(body.state, { device: deviceOf(req, body) });
      return sendJson(res, 201, { island: islandInfo(rec), rev: rec.rev });
    }
    throw new HttpError(405, 'Use GET or POST');
  }

  if (!sub) {
    if (method === 'GET' || method === 'HEAD') {
      const rec = await islands.get(id);
      return sendJson(res, 200, { island: islandInfo(rec), rev: rec.rev, state: rec.state });
    }
    if (method === 'PUT') {
      const body = await readJson(req, MAX_SAVE_BYTES);
      const reason = body.reason === 'import' ? 'before-import' : 'auto';
      const rec = await islands.save(id, body.state, { baseRev: body.baseRev, device: deviceOf(req, body), force: body.force === true, reason });
      return sendJson(res, 200, { island: islandInfo(rec), rev: rec.rev });
    }
    if (method === 'DELETE') {
      await islands.remove(id);
      return sendJson(res, 200, { ok: true });
    }
    throw new HttpError(405, 'Use GET, PUT or DELETE');
  }

  if (sub === 'backups') {
    if (method !== 'GET' && method !== 'HEAD') throw new HttpError(405, 'Use GET');
    if (!name) return sendJson(res, 200, { backups: await islands.backups(id) });
    const rec = await islands.backup(id, decodeURIComponent(name));
    return sendJson(res, 200, { island: islandInfo(rec), state: rec.state });
  }

  if (sub === 'restore' && !name) {
    if (method !== 'POST') throw new HttpError(405, 'Use POST');
    const body = await readJson(req, MAX_SMALL_BYTES);
    const rec = await islands.restore(id, body.name, { device: deviceOf(req, body) });
    return sendJson(res, 200, { island: islandInfo(rec), rev: rec.rev });
  }

  if (sub === 'photos' && !name) {
    if (method === 'GET' || method === 'HEAD') return sendJson(res, 200, { photos: await islands.photos(id) });
    if (method === 'PUT') {
      const body = await readJson(req, MAX_PHOTOS_BYTES);
      await islands.setPhotos(id, body.photos);
      return sendJson(res, 200, { ok: true });
    }
    throw new HttpError(405, 'Use GET or PUT');
  }

  throw new HttpError(404, 'No such API');
}

// ------------------------------------------------------------ static files

const etags = new Map(); // file -> { mtimeMs, size, etag }

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return sendText(res, 400, 'Bad path');
  }
  if (rel === '/' || rel === '/index.html') rel = '/index.html';
  const file = path.join(STATIC_DIR, path.normalize(rel));
  if (!file.startsWith(STATIC_DIR + path.sep) || rel.includes('\0') || path.basename(file).startsWith('.')) return sendText(res, 404, 'Not found');
  let stat;
  try {
    stat = await fsp.stat(file);
  } catch {
    stat = null;
  }
  if (!stat || !stat.isFile()) return sendText(res, 404, 'Not found');

  const ext = path.extname(file).toLowerCase();
  const isPage = ext === '.html';
  // Asset names carry a hash of their content (scripts/build.mjs), so they can be kept forever.
  const immutable = rel.startsWith('/assets/') && /-[0-9a-f]{10}\.[a-z]+$/.test(rel);
  let cached = etags.get(file);
  if (!cached || cached.mtimeMs !== stat.mtimeMs || cached.size !== stat.size) {
    const etag = '"' + crypto.createHash('sha1').update(await fsp.readFile(file)).digest('base64url').slice(0, 20) + '"';
    etags.set(file, (cached = { mtimeMs: stat.mtimeMs, size: stat.size, etag }));
  }
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    ETag: cached.etag,
  };
  if (isPage) {
    headers['Content-Security-Policy'] = GAME_CSP;
    headers['Referrer-Policy'] = 'no-referrer';
  }
  if (req.headers['if-none-match'] === cached.etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  return send(res, 200, await fsp.readFile(file), headers);
}

// ------------------------------------------------------------------ routes

async function handle(req, res) {
  const url = new URL(req.url, 'http://site.invalid');
  const { pathname } = url;

  if (pathname === '/healthz') return sendJson(res, 200, { ok: true, version: VERSION });

  if (pathname === '/login') {
    if (!PASSWORD) return redirect(res, 302, '/');
    if (req.method === 'POST') return login(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, 'Method not allowed', { Allow: 'GET, HEAD, POST' });
    const next = safeNext(url.searchParams.get('next') ?? '/');
    if (hasAccess(req)) return redirect(res, 302, next);
    return sendLoginPage(res, 200, next);
  }

  // The tab icon works before logging in (the login page shows it too).
  if (pathname === '/favicon.png' || pathname === '/favicon.ico') return serveStatic(req, res, '/favicon.png');

  if (!hasAccess(req)) {
    if (pathname.startsWith('/api/')) return sendJson(res, 401, { error: 'Log in first', login: '/login' });
    if (req.method === 'GET' || req.method === 'HEAD') return redirect(res, 302, '/login?next=' + encodeURIComponent(safeNext(pathname + url.search)));
    return sendText(res, 401, 'Log in first');
  }

  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  return serveStatic(req, res, pathname);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    const status = err instanceof IslandError || err instanceof HttpError ? err.status : 500;
    if (status >= 500 || status === 409) logLine(req, status, status === 409 ? err.message : err.stack || err.message);
    if (res.headersSent) return res.destroy();
    const body = { error: status >= 500 ? 'Something went wrong on the server' : err.message, ...(err.extra || {}) };
    if (req.url.startsWith('/api/')) sendJson(res, status, body);
    else sendText(res, status, body.error);
  });
});
server.requestTimeout = 120_000;
server.headersTimeout = 30_000;
server.keepAliveTimeout = 65_000;

// The trash is emptied of islands deleted over 30 days ago, at start and then daily.
const sweep = () => islands.sweep().catch((err) => console.error(`emptying the trash: ${err.message}`));
sweep();
setInterval(sweep, 24 * 3600_000).unref();

server.listen(PORT, HOST, () => {
  console.log(`Sarah Crossing ${VERSION} on http://${HOST}:${server.address().port} (game ${STATIC_DIR}, data ${DATA_DIR}${PASSWORD ? '' : ', no password'})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
