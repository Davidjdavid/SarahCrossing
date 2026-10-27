// The game server over HTTP: the password, the islands API, the game's files.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { after, before, test } from 'node:test';
import zlib from 'node:zlib';
import { fakeState, login, ROOT, startServer } from './helpers.mjs';

let srv;
let cookie;
const api = (method, p, body, headers = {}) =>
  fetch(srv.url + p, {
    method,
    headers: { cookie, 'X-Sarah': '1', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body),
    redirect: 'manual',
  });

before(async () => {
  if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT });
  srv = await startServer();
  cookie = await login(srv.url);
});
after(() => srv && srv.stop());

test('health check answers without logging in', async () => {
  const res = await fetch(srv.url + '/healthz');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.version);
});

test('without the password: pages go to the login, the API says 401', async () => {
  const page = await fetch(srv.url + '/', { redirect: 'manual' });
  assert.equal(page.status, 302);
  assert.equal(page.headers.get('location'), '/login?next=%2F');
  const asset = await fetch(srv.url + '/build.json', { redirect: 'manual' });
  assert.equal(asset.status, 302);
  const res = await fetch(srv.url + '/api/islands');
  assert.equal(res.status, 401);
  const loginPage = await fetch(srv.url + '/login');
  assert.equal(loginPage.status, 200);
  assert.match(await loginPage.text(), /Sarah<span>Crossing/);
});

test('the icons and the home-screen manifest are there before logging in', async () => {
  assert.equal((await fetch(srv.url + '/favicon.png')).status, 200);
  const html = await (await fetch(srv.url + '/', { headers: { cookie } })).text();
  for (const re of [/href="(assets\/manifest-[^"]+)"/, /href="(assets\/icon-180-[^"]+)"/]) {
    const res = await fetch(`${srv.url}/${re.exec(html)[1]}`);
    assert.equal(res.status, 200, re.source);
  }
  // but not the game itself
  const js = /src="(assets\/game-[^"]+)"/.exec(html)[1];
  assert.equal((await fetch(`${srv.url}/${js}`, { redirect: 'manual' })).status, 302);
});

test('a wrong password is refused, and too many tries wait a minute', async () => {
  for (let i = 0; i < 10; i++) {
    const res = await fetch(srv.url + '/login', { method: 'POST', body: new URLSearchParams({ password: 'nope' }), redirect: 'manual', headers: { 'X-Forwarded-For': '10.0.0.9' } });
    assert.equal(res.status, 401);
  }
  const res = await fetch(srv.url + '/login', { method: 'POST', body: new URLSearchParams({ password: 'pw' }), redirect: 'manual', headers: { 'X-Forwarded-For': '10.0.0.9' } });
  assert.equal(res.status, 429);
});

test('after logging in, "next" only ever leads to this site', async () => {
  for (const [next, want] of [
    ['/', '/'],
    ['/index.html?x=1', '/index.html?x=1'],
    ['//evil.example', '/'],
    ['https://evil.example/', '/'],
    ['/\\evil', '/'],
  ]) {
    const res = await fetch(srv.url + '/login', { method: 'POST', body: new URLSearchParams({ password: 'pw', next }), redirect: 'manual' });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), want, next);
  }
});

test('the game page and its files', async () => {
  const page = await fetch(srv.url + '/', { headers: { cookie } });
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(page.headers.get('cache-control'), 'no-cache');
  const html = await page.text();
  const js = /src="(assets\/game-[0-9a-f]{10}\.js)"/.exec(html)[1];
  const asset = await fetch(`${srv.url}/${js}`, { headers: { cookie } });
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control'), /immutable/);
  assert.match(asset.headers.get('content-type'), /javascript/);
  const again = await fetch(srv.url + '/', { headers: { cookie, 'If-None-Match': page.headers.get('etag') } });
  assert.equal(again.status, 304);
});

test('a model goes gzipped to a browser that takes it, as it is to one that does not', async () => {
  const html = await (await fetch(srv.url + '/', { headers: { cookie } })).text();
  const data = await (await fetch(`${srv.url}/${/src="(assets\/data-[0-9a-f]{10}\.js)"/.exec(html)[1]}`, { headers: { cookie } })).text();
  const model = /"(assets\/model-folk2_kai-[0-9a-f]{10}\.glb)"/.exec(data)[1];
  // (node:http, so nothing is unzipped on the way)
  const get = (headers) => new Promise((ok, bad) => http.get(`${srv.url}/${model}`, { headers: { cookie, ...headers } }, (res) => {
    const parts = [];
    res.on('data', (d) => parts.push(d));
    res.on('end', () => ok({ res, body: Buffer.concat(parts) }));
  }).on('error', bad));
  const plain = await get({}), zipped = await get({ 'Accept-Encoding': 'gzip, deflate, br' });
  assert.equal(plain.res.statusCode, 200);
  assert.equal(plain.res.headers['content-encoding'], undefined);
  assert.equal(plain.res.headers['content-type'], 'model/gltf-binary');
  assert.equal(plain.body.subarray(0, 4).toString(), 'glTF');
  assert.equal(zipped.res.headers['content-encoding'], 'gzip');
  assert.equal(zipped.res.headers.vary, 'Accept-Encoding');
  assert.ok(zipped.body.length < plain.body.length * 0.8, `${zipped.body.length} of ${plain.body.length}`);
  assert.deepEqual(zlib.gunzipSync(zipped.body), plain.body);
  assert.notEqual(zipped.res.headers.etag, plain.res.headers.etag);
  assert.equal((await get({ 'Accept-Encoding': 'gzip', 'If-None-Match': zipped.res.headers.etag })).res.statusCode, 304);
});

test('files outside the game are never served', async () => {
  for (const p of ['/../server/server.mjs', '/..%2fserver%2fserver.mjs', '/%2e%2e/package.json', '/.hidden', '/assets/../../package.json']) {
    const res = await fetch(srv.url + p, { headers: { cookie } });
    assert.equal(res.status, 404, p);
  }
});

test('writes need the X-Sarah header (other sites cannot send it)', async () => {
  const res = await fetch(srv.url + '/api/islands', { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ state: fakeState() }) });
  assert.equal(res.status, 403);
});

test('islands: make one, save it, a stale save gets 409, list, delete', async () => {
  const made = await api('POST', '/api/islands', { state: fakeState({ islandName: 'Coral Cove' }), device: { id: 'dev-a' } }, { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' });
  assert.equal(made.status, 201);
  const { island, rev } = await made.json();
  assert.equal(rev, 1);
  assert.deepEqual(island.device, { id: 'dev-a', name: 'iPhone' });

  const got = await (await api('GET', `/api/islands/${island.id}`)).json();
  assert.equal(got.state.islandName, 'Coral Cove');

  const saved = await api('PUT', `/api/islands/${island.id}`, { state: fakeState({ islandName: 'Coral Cove', money: 9 }), baseRev: 1, device: { id: 'dev-a' } });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).rev, 2);

  const stale = await api('PUT', `/api/islands/${island.id}`, { state: fakeState({ money: 1 }), baseRev: 1, device: { id: 'dev-b' } });
  assert.equal(stale.status, 409);
  const conflict = await stale.json();
  assert.equal(conflict.island.rev, 2);
  assert.equal(conflict.island.summary.money, 9);

  const list = await (await api('GET', '/api/islands')).json();
  assert.ok(list.islands.some((i) => i.id === island.id && i.summary.islandName === 'Coral Cove'));

  assert.equal((await api('DELETE', `/api/islands/${island.id}`)).status, 200);
  assert.equal((await api('GET', `/api/islands/${island.id}`)).status, 404);
});

test('a save sent gzip-compressed is understood', async () => {
  const body = zlib.gzipSync(JSON.stringify({ state: fakeState({ islandName: 'Zipped' }) }));
  const res = await api('POST', '/api/islands', body, { 'Content-Encoding': 'gzip' });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).island.summary.islandName, 'Zipped');
});

test('things that are not saves are refused', async () => {
  assert.equal((await api('POST', '/api/islands', '{not json')).status, 400);
  assert.equal((await api('POST', '/api/islands', { state: { no: 'seed' } })).status, 400);
  assert.equal((await api('GET', '/api/islands/nope')).status, 404);
  assert.equal((await api('GET', '/api/nothing')).status, 404);
});

test('backups can be listed, read and put back', async () => {
  const { island } = await (await api('POST', '/api/islands', { state: fakeState({ money: 1 }) })).json();
  await api('PUT', `/api/islands/${island.id}`, { state: fakeState({ money: 2 }), baseRev: 1 });
  const { backups } = await (await api('GET', `/api/islands/${island.id}/backups`)).json();
  assert.equal(backups.length, 1);
  assert.equal(backups[0].summary.money, 1);
  const one = await (await api('GET', `/api/islands/${island.id}/backups/${encodeURIComponent(backups[0].name)}`)).json();
  assert.equal(one.state.money, 1);
  const restored = await api('POST', `/api/islands/${island.id}/restore`, { name: backups[0].name });
  assert.equal(restored.status, 200);
  assert.equal((await (await api('GET', `/api/islands/${island.id}`)).json()).state.money, 1);
  assert.equal((await api('POST', `/api/islands/${island.id}/restore`, { name: '../../secret' })).status, 404);
});

test('photos are kept with the island', async () => {
  const { island } = await (await api('POST', '/api/islands', { state: fakeState() })).json();
  const photos = [{ url: 'data:image/jpeg;base64,/9j/4AAQ', t: 123 }];
  assert.equal((await api('PUT', `/api/islands/${island.id}/photos`, { photos })).status, 200);
  assert.deepEqual((await (await api('GET', `/api/islands/${island.id}/photos`)).json()).photos, photos);
  assert.equal((await api('PUT', `/api/islands/${island.id}/photos`, { photos: [{ url: 'https://x', t: 1 }] })).status, 400);
  // one hung in the museum's photography wing: its spot, its card's name, a real photo uploaded
  const hung = [{ url: 'data:image/jpeg;base64,/9j/4AAQ', t: 124, museum: 3, title: 'Grandma\'s garden', real: true }, { url: 'data:image/jpeg;base64,/9j/4AAQ', t: 125, tags: ['Joe'] }];
  assert.equal((await api('PUT', `/api/islands/${island.id}/photos`, { photos: hung })).status, 200);
  assert.deepEqual((await (await api('GET', `/api/islands/${island.id}/photos`)).json()).photos, hung);
  assert.equal((await api('PUT', `/api/islands/${island.id}/photos`, { photos: [{ url: 'data:image/jpeg;base64,AAAA', t: 1, museum: 'wall' }] })).status, 400);
  assert.equal((await api('PUT', `/api/islands/${island.id}/photos`, { photos: [{ url: 'data:image/jpeg;base64,AAAA', t: 1, title: 'x'.repeat(61) }] })).status, 400);
});

test("the game's problem reports end up in the server log", async () => {
  const res = await api('POST', '/api/log', { message: 'Boom in the kitchen', stack: 'at cook (game.js:1:2)', island: 'abc' });
  assert.equal(res.status, 200);
  await new Promise((r) => setTimeout(r, 100));
  assert.match(srv.log(), /game problem: abc: Boom in the kitchen \| at cook/);
});

test('in production the server will not start without a password', async () => {
  await assert.rejects(() => startServer({ password: '', env: { NODE_ENV: 'production' } }), /SITE_PASSWORD/);
});

// ------------------------------------------------------------------ visitors

/** A live connection to an island, collecting what it's sent. */
function live(island, who, withCookie = true) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${srv.url.replace('http', 'ws')}/api/live/${island}?who=${who}`, withCookie ? { headers: { cookie } } : undefined);
    ws.got = [];
    ws.onmessage = (e) => ws.got.push(JSON.parse(e.data));
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error('refused'));
  });
}
const settle = () => new Promise((r) => setTimeout(r, 150));

test('visitors keep their own save on an island, with the same rev rules', async () => {
  const { island } = await (await api('POST', '/api/islands', { state: fakeState() })).json();
  assert.equal((await api('GET', `/api/islands/${island.id}/people/david`)).status, 404);
  const first = await api('PUT', `/api/islands/${island.id}/people/david`, { baseRev: 0, state: { money: 5 } });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).rev, 1);
  assert.equal((await api('PUT', `/api/islands/${island.id}/people/david`, { baseRev: 0, state: { money: 6 } })).status, 409);
  assert.equal((await api('PUT', `/api/islands/${island.id}/people/david`, { baseRev: 1, state: { money: 7 } })).status, 200);
  assert.equal((await (await api('GET', `/api/islands/${island.id}/people/david`)).json()).state.money, 7);
  const { people } = await (await api('GET', `/api/islands/${island.id}/people`)).json();
  assert.deepEqual(people.map((p) => [p.who, p.money]), [['david', 7]]);
  assert.equal((await api('PUT', `/api/islands/${island.id}/people/Not-A-Name`, { baseRev: 0, state: {} })).status, 404);
  // their album is theirs, not the island's
  await api('PUT', `/api/islands/${island.id}/people/david/photos`, { photos: [{ url: 'data:image/jpeg;base64,AAAA', t: 1 }] });
  assert.equal((await (await api('GET', `/api/islands/${island.id}/photos`)).json()).photos.length, 0);
  assert.equal((await (await api('GET', `/api/islands/${island.id}/people/david/photos`)).json()).photos.length, 1);
});

test('mail between people: posted, waiting, taken out once delivered', async () => {
  const { island } = await (await api('POST', '/api/islands', { state: fakeState() })).json();
  const sent = await api('POST', `/api/islands/${island.id}/mail`, { to: 'sarah', from: 'james', subject: 'Fore!', body: 'A golf ball for you.', gift: 'clam' });
  assert.equal(sent.status, 201);
  await api('POST', `/api/islands/${island.id}/mail`, { to: 'sarah', from: 'john', subject: 'Objection', body: '<b>no html</b>', gift: '../bad' });
  const { letters } = await (await api('GET', `/api/islands/${island.id}/mail/sarah`)).json();
  assert.deepEqual(letters.map((l) => [l.seq, l.from, l.gift]), [[1, 'james', 'clam'], [2, 'john', null]]);
  await api('DELETE', `/api/islands/${island.id}/mail/sarah?upTo=1`);
  assert.deepEqual((await (await api('GET', `/api/islands/${island.id}/mail/sarah`)).json()).letters.map((l) => l.seq), [2]);
  assert.equal((await api('POST', `/api/islands/${island.id}/mail`, { to: 'sarah', from: '', subject: 'x' })).status, 404);
});

test('live: who is there, where they are, what they say; island saves and letters reach them', async () => {
  const { island } = await (await api('POST', '/api/islands', { state: fakeState() })).json();
  await assert.rejects(() => live(island.id, 'david', false), /refused/);
  const sarah = await live(island.id, 'sarah');
  sarah.send(JSON.stringify({ t: 'state', area: 'island', x: 10, y: 20, dir: 'down', evil: 'x' }));
  await settle();
  const david = await live(island.id, 'david');
  await settle();
  assert.deepEqual(david.got[0], { t: 'here', people: [{ who: 'sarah', area: 'island', x: 10, y: 20, dir: 'down' }] });
  assert.deepEqual(sarah.got.at(-1), { t: 'join', who: 'david' });
  david.send(JSON.stringify({ t: 'say', text: 'Hi sis!' }));
  david.send(JSON.stringify({ t: 'emote', e: 'wave' }));
  await settle();
  assert.deepEqual(sarah.got.slice(-2), [{ t: 'say', who: 'david', text: 'Hi sis!' }, { t: 'emote', who: 'david', e: 'wave' }]);
  // a two-player game's messages go to the one person they're for, from whoever sent them
  const before = david.got.length;
  sarah.send(JSON.stringify({ t: 'game', to: 'david', d: { k: 'invite', game: 'blocks' } }));
  sarah.send(JSON.stringify({ t: 'game', to: 'sarah', d: { k: 'self' } }));
  sarah.send(JSON.stringify({ t: 'game', to: 'david', d: 'not an object' }));
  await settle();
  assert.deepEqual(david.got.slice(before), [{ t: 'game', from: 'sarah', d: { k: 'invite', game: 'blocks' } }]);
  assert.equal(sarah.got.filter((m) => m.t === 'game').length, 0);
  // Sarah saves: David hears about it; a letter for Sarah: she hears about it
  await api('PUT', `/api/islands/${island.id}`, { state: fakeState(), baseRev: 1 });
  await api('POST', `/api/islands/${island.id}/mail`, { to: 'sarah', from: 'david', subject: 'Hi' });
  await settle();
  assert.deepEqual(david.got.at(-1), { t: 'island', rev: 2 });
  assert.deepEqual(sarah.got.at(-1), { t: 'mail' });
  // David opens the game somewhere else: the old connection is replaced
  const closed = new Promise((r) => (david.onclose = (e) => r(e.code)));
  const david2 = await live(island.id, 'david');
  assert.equal(await closed, 4000);
  const { here } = await (await api('GET', `/api/islands/${island.id}/people`)).json();
  assert.deepEqual(here.sort(), ['david', 'sarah']);
  const left = new Promise((r) => { const t = setInterval(() => { if (sarah.got.some((m) => m.t === 'leave')) { clearInterval(t); r(); } }, 20); });
  david2.close();
  await left;
  sarah.close();
});

test('the real world: a zip code\'s place, forecast and headlines, and the market (made-up data: WORLD_FAKE)', async () => {
  const w = await startServer({ env: { WORLD_FAKE: '1' } });
  try {
    const c = await login(w.url);
    const get = (p) => fetch(w.url + p, { headers: { cookie: c } });
    const ok = await get('/api/world?zip=02134');
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.place, 'Allston');
    assert.equal(body.state, 'MA');
    assert.ok(['sunny', 'cloudy', 'rain', 'snow'].includes(body.days[0].sky));
    assert.ok(Array.isArray(body.news.local) && Array.isArray(body.news.world));
    assert.equal((await get('/api/world?zip=12')).status, 400);
    assert.equal((await get('/api/world?zip=00000')).status, 404);
    assert.equal((await fetch(w.url + '/api/world?zip=02134')).status, 401, 'needs the password like the rest');
    const m = await (await get('/api/market')).json();
    assert.equal(m.stocks.length, 8);
    for (const s of m.stocks) assert.equal(s.closes.length, 60);
  } finally { await w.stop(); }
});

test('the real world\'s helpers: weather codes and news feed titles', async () => {
  const { skyOf, feedTitles } = await import('../server/world.mjs');
  assert.deepEqual([0, 1, 2, 45, 61, 80, 95, 71, 86].map(skyOf), ['sunny', 'sunny', 'cloudy', 'cloudy', 'rain', 'rain', 'rain', 'snow', 'snow']);
  const xml = '<rss><channel><title>Feed</title><item><title><![CDATA[Park plants &amp; waters 500 trees - The Daily Paper]]></title></item><item><title>Frog &#39;found&#39;</title></item><item><title>Frog &#39;found&#39;</title></item></channel></rss>';
  assert.deepEqual(feedTitles(xml), ['Park plants & waters 500 trees', "Frog 'found'"]);
});

test('the music library: uploaded a track at a time, listed with its hour and weather, streamed in ranges, a game taken out', async () => {
  const up = (p, body, headers = {}) => api('PUT', '/api/music/file?path=' + encodeURIComponent(p), body, { 'Content-Type': 'audio/mpeg', ...headers });
  assert.deepEqual((await (await api('GET', '/api/music')).json()).tracks, [], 'empty to begin with');
  const bytes = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 251));
  assert.equal((await up('Animal_Crossing_New_Horizons_OST_(2020)/05 - 5 PM (Rainy).mp3', bytes)).status, 200);
  assert.equal((await up('Animal_Crossing_New_Horizons_OST_(2020)/06 - 5 PM.mp3', bytes)).status, 200);
  assert.equal((await up('Wild World/Nook Shop.m4a', bytes)).status, 200);
  assert.equal((await up('Wild World/cover.jpg', bytes)).status, 415, 'only music files');
  assert.equal((await up('../outside.mp3', bytes)).status, 400, 'never outside the folder');
  assert.equal((await up('a/b/c/d.mp3', bytes)).status, 400, 'two folders deep at most');
  assert.equal((await fetch(srv.url + '/api/music/file?path=x.mp3', { method: 'PUT', headers: { cookie }, body: bytes })).status, 403, 'needs the X-Sarah header');
  const { tracks, free } = await (await api('GET', '/api/music')).json();
  assert.ok(free == null || free > 0);
  assert.deepEqual(tracks.map((t) => [t.game, t.hour, t.weather, t.name]), [
    ['Animal Crossing New Horizons', 17, 'rain', '5 PM (Rainy)'],
    ['Animal Crossing New Horizons', 17, 'clear', '5 PM'],
    ['Wild World', null, 'clear', 'Nook Shop'],
  ]);
  const url = srv.url + '/music/' + tracks[0].path.split('/').map(encodeURIComponent).join('/');
  const whole = await fetch(url, { headers: { cookie } });
  assert.equal(whole.status, 200);
  assert.equal(whole.headers.get('content-type'), 'audio/mpeg');
  assert.deepEqual(Buffer.from(await whole.arrayBuffer()), bytes);
  const part = await fetch(url, { headers: { cookie, Range: 'bytes=100-199' } });
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), 'bytes 100-199/1000');
  assert.deepEqual(Buffer.from(await part.arrayBuffer()), bytes.subarray(100, 200));
  assert.equal((await fetch(url, { headers: { cookie, Range: 'bytes=5000-' } })).status, 416);
  assert.equal((await fetch(url, { redirect: 'manual' })).status, 302, 'needs the password like the rest');
  assert.equal((await fetch(srv.url + '/music/..%2F..%2Fsecret', { headers: { cookie } })).status, 404);
  assert.equal((await api('DELETE', '/api/music/game?name=' + encodeURIComponent('Animal Crossing New Horizons'))).status, 200);
  assert.deepEqual((await (await api('GET', '/api/music')).json()).tracks.map((t) => t.game), ['Wild World']);
  assert.equal((await api('DELETE', '/api/music/game?name=Nope')).status, 404);
});

test('the music library reads hours from the names the soundtracks use', async () => {
  const { readTrackName, gameName } = await import('../server/music.mjs');
  const hours = ['05 - 1 AM.mp3', '5 AM (Sunny).mp3', '12 PM (Rainy).flac', '1-05. 5 PM (Snowy).mp3', '12 AM.mp3', 'Midnight.mp3', 'Noon.mp3', '17h00.mp3', '10_AM.mp3', 'Track 03 2 p.m.mp3', '01. Title Theme.mp3'].map((f) => readTrackName(f));
  assert.deepEqual(hours.map((t) => t.hour), [1, 5, 12, 17, 0, 0, 12, 17, 10, 14, null]);
  assert.deepEqual(hours.map((t) => t.weather).slice(0, 4), ['clear', 'clear', 'rain', 'snow']);
  assert.equal(hours[10].name, 'Title Theme');
  assert.equal(gameName('Animal_Crossing_New_Horizons_OST_(2020)_[MP3]'), 'Animal Crossing New Horizons');
  assert.equal(gameName('Animal Crossing - Wild World'), 'Animal Crossing - Wild World');
});

test('the music library is uploaded from the beta site only: the live site plays it but refuses uploads', async () => {
  const live = await startServer({ env: { MUSIC_UPLOADS: '0' } });
  try {
    const c = await login(live.url);
    const list = await (await fetch(live.url + '/api/music', { headers: { cookie: c } })).json();
    assert.equal(list.uploads, false);
    const put = await fetch(live.url + '/api/music/file?path=' + encodeURIComponent('G/5 PM.mp3'), { method: 'PUT', headers: { cookie: c, 'X-Sarah': '1' }, body: Buffer.from('abc') });
    assert.equal(put.status, 403);
    assert.equal((await fetch(live.url + '/api/music/game?name=G', { method: 'DELETE', headers: { cookie: c, 'X-Sarah': '1' } })).status, 403);
  } finally { await live.stop(); }
  assert.equal((await (await api('GET', '/api/music')).json()).uploads, true, 'the test server (not production) takes uploads');
});
