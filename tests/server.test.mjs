// The game server over HTTP: the password, the islands API, the game's files.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
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
