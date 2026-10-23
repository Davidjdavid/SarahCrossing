// The islands on disk (server/islands.mjs): saves, revs, backups, the trash.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { IslandError, Islands, summarize } from '../server/islands.mjs';
import { fakeState } from './helpers.mjs';

const HOUR = 3600_000;
const DAY = 24 * HOUR;
let dir;
let clock;
let islands;

beforeEach(async () => {
  dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'sc-islands-'));
  clock = Date.UTC(2026, 9, 1, 12);
  islands = new Islands(dir, { now: () => clock, log: () => {} });
});
afterEach(() => fsp.rm(dir, { recursive: true, force: true }));

test('a new island starts at rev 1 and is listed with its summary', async () => {
  const rec = await islands.create(fakeState({ islandName: 'Night Owl Isle', money: 4321 }), { device: { id: 'phone', name: 'iPhone' } });
  assert.equal(rec.rev, 1);
  const [listed] = await islands.list();
  assert.equal(listed.id, rec.id);
  assert.equal(listed.summary.islandName, 'Night Owl Isle');
  assert.equal(listed.summary.money, 4321);
  assert.equal(listed.summary.day, 11);
  assert.equal(listed.summary.playMinutes, 90);
  assert.deepEqual(listed.device, { id: 'phone', name: 'iPhone' });
  assert.equal(listed.state, undefined, 'the list leaves the (big) state out');
});

test('the list puts the most recently played island first', async () => {
  const a = await islands.create(fakeState({ islandName: 'A' }));
  clock += 1000;
  const b = await islands.create(fakeState({ islandName: 'B' }));
  clock += 1000;
  await islands.save(a.id, fakeState({ islandName: 'A' }), { baseRev: 1 });
  assert.deepEqual((await islands.list()).map((i) => i.summary.islandName), ['A', 'B']);
  assert.ok(b);
});

test('saves need the current rev; a stale one is refused with the newer island', async () => {
  const rec = await islands.create(fakeState());
  const r2 = await islands.save(rec.id, fakeState({ money: 1 }), { baseRev: 1 });
  assert.equal(r2.rev, 2);
  await assert.rejects(
    () => islands.save(rec.id, fakeState({ money: 2 }), { baseRev: 1 }),
    (err) => err instanceof IslandError && err.status === 409 && err.extra.island.rev === 2 && err.extra.island.summary.money === 1,
  );
  assert.equal((await islands.get(rec.id)).state.money, 1);
});

test('a forced save goes through and keeps the overwritten island as a backup', async () => {
  const rec = await islands.create(fakeState());
  await islands.save(rec.id, fakeState({ money: 111 }), { baseRev: 1 });
  clock += 10 * 60_000;
  const r = await islands.save(rec.id, fakeState({ money: 222 }), { baseRev: 1, force: true });
  assert.equal(r.rev, 3);
  const backups = await islands.backups(rec.id);
  assert.ok(backups.some((b) => b.reason === 'before-overwrite' && b.summary.money === 111), JSON.stringify(backups));
});

test('a save that is not a Sarah Crossing save is refused', async () => {
  await assert.rejects(() => islands.create({ hello: 1 }), (err) => err.status === 400);
  await assert.rejects(() => islands.create([1, 2]), (err) => err.status === 400);
  await assert.rejects(() => islands.create(null), (err) => err.status === 400);
});

test('ids that could leave the islands folder are not found', async () => {
  for (const id of ['..', '../x', 'a/b', '', 'short', 'x'.repeat(41)]) {
    await assert.rejects(() => islands.get(id), (err) => err.status === 404, id);
  }
});

test('while playing, a backup is kept at most once an hour', async () => {
  const rec = await islands.create(fakeState());
  let rev = 1;
  for (let i = 0; i < 12; i++) {
    // a save every 10 minutes for two hours
    rev = (await islands.save(rec.id, fakeState({ money: i }), { baseRev: rev })).rev;
    clock += 10 * 60_000;
  }
  const backups = await islands.backups(rec.id);
  assert.equal(backups.length, 2, JSON.stringify(backups.map((b) => b.name)));
  assert.ok(backups.every((b) => b.reason === 'auto'));
});

test('backups: all from the last two days, then one a day, for 60 days', async () => {
  const rec = await islands.create(fakeState());
  let rev = 1;
  for (let h = 0; h < 24 * 70; h++) {
    rev = (await islands.save(rec.id, fakeState({ money: h }), { baseRev: rev })).rev;
    clock += HOUR;
  }
  const backups = await islands.backups(rec.id);
  const now = clock - HOUR; // when the last save (and the last tidy-up of the backups) happened
  const recent = backups.filter((b) => now - b.at < 2 * DAY);
  const older = backups.filter((b) => now - b.at >= 2 * DAY);
  assert.ok(recent.length >= 47 && recent.length <= 49, `recent: ${recent.length}`);
  assert.equal(new Set(older.map((b) => new Date(b.at).toISOString().slice(0, 10))).size, older.length, 'one per day');
  assert.ok(older.length >= 57 && older.length <= 59, `older: ${older.length}`);
  assert.ok(backups.every((b) => now - b.at < 60 * DAY));
});

test('putting a backup back keeps the island as it was in a backup too', async () => {
  const rec = await islands.create(fakeState({ money: 100 }));
  await islands.save(rec.id, fakeState({ money: 200 }), { baseRev: 1 }); // backs up rev 1 (100)
  clock += 2 * HOUR;
  await islands.save(rec.id, fakeState({ money: 300 }), { baseRev: 2 }); // backs up rev 2 (200)
  const old = (await islands.backups(rec.id)).find((b) => b.summary.money === 100);
  const r = await islands.restore(rec.id, old.name, {});
  assert.equal(r.state.money, 100);
  assert.equal(r.rev, 4);
  assert.ok((await islands.backups(rec.id)).some((b) => b.reason === 'before-restore' && b.summary.money === 300));
});

test('an imported save that replaces an island keeps the old one as a backup', async () => {
  const rec = await islands.create(fakeState({ money: 5 }));
  await islands.save(rec.id, fakeState({ money: 6 }), { baseRev: 99, force: true, reason: 'before-import' });
  const b = await islands.backups(rec.id);
  assert.equal(b[0].reason, 'before-import');
  assert.equal(b[0].summary.money, 5);
});

test('deleted islands go to the trash, which is emptied after 30 days', async () => {
  const rec = await islands.create(fakeState());
  await islands.remove(rec.id);
  await assert.rejects(() => islands.get(rec.id), (err) => err.status === 404);
  assert.deepEqual(await islands.list(), []);
  assert.equal(fs.readdirSync(path.join(dir, 'trash')).length, 1);
  clock += 29 * DAY;
  await islands.sweep();
  assert.equal(fs.readdirSync(path.join(dir, 'trash')).length, 1);
  clock += 2 * DAY;
  await islands.sweep();
  assert.equal(fs.readdirSync(path.join(dir, 'trash')).length, 0);
});

test('photos are kept with the island and checked', async () => {
  const rec = await islands.create(fakeState());
  assert.deepEqual(await islands.photos(rec.id), []);
  const photos = [{ url: 'data:image/jpeg;base64,/9j/AAAA', t: 1 }];
  await islands.setPhotos(rec.id, photos);
  assert.deepEqual(await islands.photos(rec.id), photos);
  await assert.rejects(() => islands.setPhotos(rec.id, [{ url: 'javascript:alert(1)', t: 1 }]), (err) => err.status === 400);
  await assert.rejects(() => islands.setPhotos(rec.id, 'nope'), (err) => err.status === 400);
});

test('saves to one island happen one at a time', async () => {
  const rec = await islands.create(fakeState());
  const results = await Promise.allSettled([1, 2, 3].map((n) => islands.save(rec.id, fakeState({ money: n }), { baseRev: 1 })));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected' && r.reason.status === 409).length, 2);
});

test('summaries cope with odd saves', () => {
  assert.deepEqual(summarize({ seed: 'x' }), { islandName: '', money: null, day: null, playMinutes: null, seed: 'x', cheat: false });
  assert.equal(summarize({ seed: 'x', islandName: 'A\u0000B'.repeat(30) }).islandName.length, 40);
  assert.equal(summarize({ seed: 'x', flags: { cheat: 20000 } }).cheat, true);
});
