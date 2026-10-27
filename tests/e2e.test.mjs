// The real game in a real browser (Chromium, through Playwright), against the real server:
// logging in, bringing in saves from the old one-page game, saving online, two devices, going offline.
//
// Needs the browser: npx playwright install chromium
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { ROOT, startServer } from './helpers.mjs';

const OLD_SAVE = fs.readFileSync(path.join(ROOT, 'tests/fixtures/old-game-save.txt'), 'utf8');
const OLD_UNLOCKED = fs.readFileSync(path.join(ROOT, 'tests/fixtures/old-game-unlocked.txt'), 'utf8');

let srv;
let browser;

before(async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, stdio: 'ignore' });
  srv = await startServer();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await srv?.stop();
});

/** A new "device": its own browser storage, logged in, on the title screen. */
async function device({ debug = true, who = 'sarah' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 } });
  if (debug) await ctx.addInitScript(() => { window.__DEBUG = true; });
  // the classic view (HD-2D has its own test: software WebGL is slow)
  await ctx.addInitScript(() => { if (!localStorage.getItem('sc_gfx')) localStorage.setItem('sc_gfx', 'classic'); });
  // this device has already said who's playing (the picker has its own test)
  if (who) await ctx.addInitScript((w) => { if (!localStorage.getItem('sc-who')) localStorage.setItem('sc-who', w); }, who);
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push(m.text()); });
  await page.goto(srv.url + '/');
  if (page.url().includes('/login')) {
    await page.fill('#password', 'pw');
    await page.click('button[type=submit]');
  }
  await title(page);
  return page;
}
async function title(page) {
  await page.waitForSelector('#title:not([hidden]) #tbtns button', { timeout: 30000 });
}
const buttons = (page) => page.$$eval('#tbtns button', (bs) => bs.map((b) => b.textContent));
async function play(page) {
  await page.click('#tbtns button:has-text("Continue")');
  await page.waitForFunction(() => G.mode === 'play', null, { timeout: 15000 });
}
const islandsOnServer = async (page) => page.evaluate(async () => (await (await fetch('/api/islands')).json()).islands);
/** What the server has for the island this page is playing. */
const serverState = (page) => page.evaluate(async () => (await (await fetch('/api/islands/' + Cloud.id)).json()));
/** Save now and wait until the server has it. */
async function saveNow(page) {
  await page.evaluate(async () => { Save.touch(); Save.write(true); await Cloud.flush(); });
}
/** Wait (in Node) until `fn` comes back truthy. */
async function until(fn, ms = 10000) {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 200))) if (await fn()) return;
  throw new Error('timed out waiting');
}
async function importCode(page, code) {
  await page.click('#tbtns button:has-text("Import a save")');
  await page.fill('#loadcode', code);
  await page.click('button:has-text("Import this code")');
}

test('the password page lets the right password in', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(srv.url + '/');
  assert.match(page.url(), /\/login/);
  await page.fill('#password', 'wrong');
  await page.click('button[type=submit]');
  assert.match(await page.textContent('.msg'), /not it/);
  await page.fill('#password', 'pw');
  await page.click('button[type=submit]');
  // a new device asks who's playing first
  await page.waitForSelector('#panel:not([hidden]) .whobtn');
  assert.deepEqual(await page.$$eval('.whobtn b', (bs) => bs.map((b) => b.textContent)), ['Sarah', 'David', 'James', 'John', 'Joe']);
  await page.click('.whobtn:has-text("Sarah")');
  await title(page);
  assert.deepEqual(await buttons(page), ['Start', 'Import a save', 'Change player']);
  await ctx.close();
});

test('a save code from the old game comes in as an island, and plays', async () => {
  const page = await device();
  await importCode(page, OLD_SAVE);
  await page.waitForLoadState('load');
  await title(page);
  assert.deepEqual(await buttons(page), ['Continue', 'Islands', 'Import a save', 'Change player']);
  assert.match(await page.textContent('#ttag'), /Welcome back to Imported Isle/);
  assert.match(await page.textContent('#tsync'), /Saved online/);
  await play(page);
  assert.equal(await page.textContent('#money'), '12,345');
  // it's on today's island, a fresh start with a letter about it (the old island kept inside the save)
  const moved = await page.evaluate(() => ({ mapV: S.mapV, letter: S.mail.some((m) => m.from === 'fortune' && /fresh start/.test(m.subject)), w: G.areas.island.w, kept: !!S.before7 }));
  assert.deepEqual(moved, { mapV: 7, letter: true, w: JSON.parse(fs.readFileSync(path.join(ROOT, 'game/assets/world.json'), 'utf8')).w, kept: true });
  // the handmade frog pot from the old game is still a real item, kept with the old island
  const pots = await page.evaluate(() => { const o = S.before7; return o.pocket.filter((s) => s && /^pot/.test(s.id)).length + Object.keys(o.storage).filter((k) => /^pot/.test(k)).length; });
  assert.ok(pots >= 1, 'the handmade pot came along');
  const islands = await islandsOnServer(page);
  assert.equal(islands.length, 1);
  assert.equal(islands[0].summary.islandName, 'Imported Isle');
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('a save from an older island: a fresh start that keeps her stats, money and name, with the old save inside', async () => {
  const page = await device();
  await title(page);
  const r = await page.evaluate(() => {
    const disp = Object.keys(DISPLAYS)[0];
    const st = Object.assign(newState(), {
      mapV: 3, started: true, money: 5000, storage: { peach: 1 }, islandName: 'Old Isle', playerName: 'Sarah', stats: { fish: 12, hugs: 3 }, startDay: 100,
      player: { area: 'island', x: 3 * TILE, y: 3 * TILE, dir: 'up', outfit: 'crimson', acc: null, eyes: 'glasses' },
      drops: [{ id: 'peach', x: 40, y: 40, area: 'island' }, { id: 'apple', x: 10, y: 10, area: 'home' }],
      deco: { moved: { 2: { x: 1, y: 1 } }, gone: { 3: true }, placed: [{ id: disp, x: 5, y: 5, text: '' }] },
      forest: { chopped: { dt1_1: true }, planted: [{ kind: 'money', amount: 1000 }], holes: [], wood: { day: -1, n: {} }, glow: { day: -1, dug: false }, clams: { day: -1, dug: [] } },
      npcs: { joe: { pts: 100 }, kai: { met: true, pts: 80 } }, house: { level: 2, wall: 'wall_cream', floor: 'floor_wood', items: [{ id: 'chair', x: 1, y: 1 }] },
    });
    const m = migrate(st);
    return { mapV: m.mapV, money: m.money, stats: m.stats, name: m.islandName + '/' + m.playerName, startDay: m.startDay, storage: m.storage, drops: m.drops, house: m.house.level,
      friends: Object.keys(m.npcs).sort(), joe: m.npcs.joe.pts, at: [Math.floor(m.player.x / TILE), Math.floor(m.player.y / TILE)], boat: W0.boat,
      letter: m.mail.map((x) => x.subject), old: m.before7 && [m.before7.mapV, m.before7.house.level, m.before7.npcs.kai.pts, m.before7.storage.peach] };
  });
  assert.equal(r.mapV, 7);
  assert.equal(r.money, 6000, 'her money comes along (the sand dollars she buried too)');
  assert.deepEqual(r.stats, { fish: 12, hugs: 3 });
  assert.equal(r.name, 'Old Isle/Sarah');
  assert.equal(r.startDay, 100, 'how long she has lived here stays');
  assert.deepEqual([r.storage, r.drops, r.house], [{}, [], 0], 'everything else starts new');
  assert.deepEqual([r.friends, r.joe], [['fortune', 'joe'], 100]);
  assert.deepEqual(r.at, r.boat, 'she steps off the boat');
  assert.deepEqual(r.letter, ['A fresh start!']);
  assert.deepEqual(r.old, [6, 2, 80, 2], 'the old save is kept whole inside the new one');
  // Harbor Square (map 6) and a new island that never started: the same, and nothing to do
  const r6 = await page.evaluate(() => {
    const a = migrate(Object.assign(newState(), { mapV: 6, started: true, money: 77, storage: { peach: 3 } }));
    const b = migrate(Object.assign(newState(), { mapV: 6, started: false }));
    return [a.mapV, a.money, Object.keys(a.storage).length, !!a.before7, b.mapV, !!b.before7, newState().mapV];
  });
  assert.deepEqual(r6, [7, 77, 0, true, 7, false, 7]);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('playing saves online: another device carries on where this one stopped', async () => {
  const phone = await device();
  await play(phone);
  await phone.evaluate(() => { __dbg.give('mango', 2); S.money += 1000; });
  await saveNow(phone);
  const saved = await serverState(phone);
  assert.equal(saved.state.money, 13345);

  const laptop = await device();
  assert.match(await laptop.textContent('#tsync'), /last played .* on an? /);
  await play(laptop);
  assert.equal(await laptop.textContent('#money'), '13,345');
  assert.ok(await laptop.evaluate(() => S.pocket.some((s) => s && s.id === 'mango')));
  await phone.context().close();
  await laptop.context().close();
});

test('two devices on one island: the second save is stopped, and the player picks', async () => {
  const a = await device();
  const b = await device();
  await play(a);
  await play(b);
  await a.evaluate(() => { S.money = 777; });
  await saveNow(a);
  await b.evaluate(() => { S.money = 1; Save.touch(); Save.write(true); });
  await b.waitForSelector('#panel:not([hidden]) h2:has-text("Played somewhere else")', { timeout: 10000 });
  assert.equal((await serverState(a)).state.money, 777, 'the stale device did not write over the newer save');
  await b.click('button:has-text("Load that one")');
  await b.waitForLoadState('load');
  await title(b);
  await play(b);
  assert.equal(await b.textContent('#money'), '777');

  // and the other choice: keep this one (the newer one goes into the backups)
  await b.evaluate(() => { S.money = 555; });
  await saveNow(b);
  await a.evaluate(() => { S.money = 888; Save.touch(); Save.write(true); });
  await a.waitForSelector('#panel:not([hidden]) h2:has-text("Played somewhere else")', { timeout: 10000 });
  await a.click('button:has-text("Keep this one")');
  await a.waitForFunction(() => Cloud.problem === null && Cloud.seq === Cloud.sentSeq);
  assert.equal((await serverState(a)).state.money, 888);
  const backups = await a.evaluate(async () => (await (await fetch(`/api/islands/${Cloud.id}/backups`)).json()).backups);
  assert.ok(backups.some((x) => x.reason === 'before-overwrite' && x.summary.money === 555), JSON.stringify(backups));
  await a.context().close();
  await b.context().close();
});

test('coming back to an old tab: it says the island moved on before playing on', async () => {
  const a = await device();
  const b = await device();
  await play(a);
  await play(b);
  await a.evaluate(() => { S.money = 4242; });
  await saveNow(a);
  // b's tab comes back into view
  await b.evaluate(() => Cloud.check());
  await b.waitForSelector('#panel:not([hidden]) h2:has-text("Played somewhere else")', { timeout: 10000 });
  await a.context().close();
  await b.context().close();
});

test('offline: the island is kept on the device and reaches the server later', async () => {
  const page = await device();
  await play(page);
  await page.route('**/api/**', (route) => route.abort());
  await page.evaluate(() => { S.money = 31337; Save.touch(); Save.write(true); });
  await page.waitForFunction(() => Cloud.problem === 'offline');
  // the page closes before the connection comes back
  const ctx = page.context();
  await page.close();
  const again = await ctx.newPage();
  await again.goto(srv.url + '/');
  await title(again);
  // the copy on this device was newer than the server's, so it's the one loaded and sent
  await again.waitForFunction(() => Cloud.seq === Cloud.sentSeq && !Cloud.busy, null, { timeout: 15000 });
  assert.equal((await serverState(again)).state.money, 31337);
  await ctx.close();
});

test('the same island imported again: replace it (kept as a backup) or keep both', async () => {
  const page = await device();
  const before = (await islandsOnServer(page)).length;
  await importCode(page, OLD_UNLOCKED);
  await page.waitForSelector('#panel:not([hidden]) button:has-text("Replace it")');
  assert.match(await page.textContent('#panel'), /already here/);
  await page.click('button:has-text("Replace it")');
  await page.waitForLoadState('load');
  await title(page);
  const islands = await islandsOnServer(page);
  assert.equal(islands.length, before, 'replaced, not added');
  assert.equal(islands[0].summary.cheat, true, 'the unlocked save is the island now');
  const backups = await page.evaluate(async () => (await (await fetch(`/api/islands/${Cloud.id}/backups`)).json()).backups);
  assert.equal(backups[0].reason, 'before-import');

  await importCode(page, OLD_SAVE);
  await page.click('button:has-text("Keep both")');
  await page.waitForLoadState('load');
  await title(page);
  assert.equal((await islandsOnServer(page)).length, before + 1);
  await page.context().close();
});

test('a save file from the old game comes in too', async () => {
  const page = await device();
  const file = path.join(srv.dataDir, 'sarah-crossing-Imported-Isle-2026-10-23.txt');
  fs.writeFileSync(file, OLD_SAVE);
  await page.click('#tbtns button:has-text("Import a save")');
  const chooser = page.waitForEvent('filechooser');
  await page.click('button:has-text("Choose a save file")');
  await (await chooser).setFiles(file);
  await page.waitForSelector('#panel:not([hidden]) button:has-text("Keep both")');
  await page.click('button:has-text("Keep both")');
  await page.waitForLoadState('load');
  await title(page);
  await play(page);
  assert.equal(await page.textContent('#money'), '12,345');
  await page.context().close();
});

test('islands list: switch islands, start a new one; backups can be put back', async () => {
  const page = await device();
  const islands = await islandsOnServer(page);
  assert.ok(islands.length >= 2);
  await page.click('#tbtns button:has-text("Islands")');
  await page.waitForSelector('#panel .list .row');
  assert.equal(await page.locator('#panel .list .row').count(), islands.length);
  // pick one that isn't being played
  const playing = await page.evaluate(() => Cloud.id);
  const other = islands.find((i) => i.id !== playing);
  await page.click(`#panel .list .row[data-island="${other.id}"]`);
  await page.click('button:has-text("Play this island")');
  await page.waitForLoadState('load');
  await title(page);
  assert.equal(await page.evaluate(() => Cloud.id), other.id);

  // backups of the island imported over (it has a "before-import" one)
  const replaced = (await islandsOnServer(page)).find((i) => i.summary.cheat);
  await page.click('#tbtns button:has-text("Islands")');
  await page.waitForSelector('#panel .list .row');
  await page.click(`#panel .list .row[data-island="${replaced.id}"]`);
  await page.click('button:has-text("Backups")');
  await page.waitForSelector('#panel .list .row');
  await page.locator('#panel .list .row', { hasText: 'Before a save file replaced it' }).first().click();
  await page.click('button:has-text("Put this one back")');
  await page.waitForLoadState('load');
  await title(page);
  const now = (await islandsOnServer(page)).find((i) => i.id === replaced.id);
  assert.equal(now.summary.cheat, false, 'the island from before the import is back');

  // a new island: back at the title with Start
  await page.click('#tbtns button:has-text("Islands")');
  await page.click('#panel button:has-text("New island")');
  await page.waitForLoadState('load');
  await title(page);
  assert.equal((await buttons(page))[0], 'Start');
  await page.context().close();
});

test('the photo album is kept online with the island', async () => {
  const page = await device();
  await play(page);
  await page.evaluate(() => { Photo.start(); Photo.snap(); Photo.stop(); });
  const id = await page.evaluate(() => Cloud.id);
  await until(async () => (await page.evaluate(async () => (await (await fetch(`/api/islands/${Cloud.id}/photos`)).json()).photos.length)) === 1);
  // another device playing the same island sees the photo
  const other = await device();
  await other.evaluate((id) => localStorage.setItem('sc-current', id), id);
  await other.reload();
  await title(other);
  await until(() => other.evaluate(() => Photos.list().length === 1));
  await page.context().close();
  await other.context().close();
});

test('a problem in the game shows up in the server log', async () => {
  const page = await device();
  await page.evaluate(() => setTimeout(() => { throw new Error('kaboom in the test'); }));
  await new Promise((r) => setTimeout(r, 1000));
  assert.match(srv.log(), /game problem: .*kaboom in the test/);
  await page.context().close();
});

test('a brand-new island is made on the server once the intro is done', async () => {
  const page = await device();
  const before = (await islandsOnServer(page)).length;
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.click('#tbtns button:has-text("Start")');
  await page.waitForFunction(() => IntroScene.on);
  await page.evaluate(() => IntroScene._finish());
  // talk through the welcome, filling in the island's name when asked
  for (let i = 0; i < 80 && !(await page.evaluate(() => G.mode === 'play')); i++) {
    if (await page.locator('#islandname').isVisible().catch(() => false)) {
      await page.fill('#islandname', 'Brand New Isle');
      await page.click("button:has-text(\"That's everything\")");
    } else await page.evaluate(() => UI.advance());
    await page.waitForTimeout(150);
  }
  await until(() => page.evaluate(() => !!Cloud.id && Cloud.seq === Cloud.sentSeq));
  const islands = await islandsOnServer(page);
  assert.equal(islands.length, before + 1);
  assert.equal(islands[0].summary.islandName, 'Brand New Isle');
  assert.equal(await page.evaluate(() => localStorage.getItem('sc-current')), islands[0].id);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('playing together: David visits Sarah, they see each other, and his things are his own', async () => {
  const sarah = await device();
  await play(sarah);
  const islandBefore = await serverState(sarah);
  const david = await device({ who: 'david' });
  assert.match(await david.textContent('#ttag'), /Welcome to .*, David!/);
  const db = await buttons(david);
  assert.ok(db.includes('Continue') && db.includes('Change player') && !db.includes('Import a save') && !db.includes('Start'), db.join());
  await play(david);
  // he starts with his own pocket and sand dollars, at the boat
  assert.equal(await david.textContent('#money'), '1,000');
  assert.equal(await david.evaluate(() => S.playerName), 'David');
  // they see each other (and David's NPC self steps aside while he plays)
  await until(() => sarah.evaluate(() => Online.others.has('david')));
  await until(() => david.evaluate(() => Online.others.has('sarah')));
  assert.equal(await sarah.evaluate(() => NPCs.get('david').sleeping), true);
  const at = await sarah.evaluate(() => [G.player.x, G.player.y]);
  await david.evaluate(([x, y]) => { G.player.x = x + 20; G.player.y = y; }, at);
  await until(() => sarah.evaluate(() => { const o = Online.others.get('david'); return o && o.area === G.area.id && Math.abs(o.x - G.player.x - 20) < 2; }));
  // he says hi; she sees the bubble
  await david.evaluate(() => Online.say('Hi sis!'));
  await until(() => sarah.evaluate(() => [...document.querySelectorAll('#bubbles .chatb')].some((b) => b.textContent === 'Hi sis!')));
  // a gift by letter
  await david.evaluate(() => addItem('peach', 1, true));
  await david.evaluate(() => { Online.giftTo('sarah'); });
  await david.click('#panel .slot');
  await david.click('#panel button:has-text("Send it")');
  await until(() => sarah.evaluate(() => S.mail.some((m) => m.from === 'david' && m.gift === 'peach')));
  // his money is his; Sarah's island isn't touched by his game
  await david.evaluate(() => { S.money += 500; Save.touch(); return Cloud.flush(); });
  const people = await david.evaluate(async () => (await (await fetch(`/api/islands/${Cloud.id}/people`)).json()).people);
  assert.equal(people.find((p) => p.who === 'david').money, 1500);
  assert.equal((await serverState(sarah)).state.money, islandBefore.state.money);
  // changing the island is Sarah's job
  assert.equal(await david.evaluate(() => visitorStop('build')), true);
  assert.equal(await sarah.evaluate(() => visitorStop('build')), false);
  // the neighbors have their own lines for him
  assert.ok(await david.evaluate(() => VISIT_TALK.maki.hi.david.length > 0));
  assert.deepEqual(david.problems.filter((p) => !/404/.test(p)), []);
  await sarah.context().close();
  await david.context().close();
});

test('two players online: Sarah asks David to play Bento Blocks; boards and junk cross; leaving hands over the win', async () => {
  const sarah = await device();
  await play(sarah);
  await saveNow(sarah);
  const david = await device({ who: 'david' });
  await play(david);
  await until(() => sarah.evaluate(() => VsNet.friends().includes('david')));
  // she asks, he says yes
  await sarah.evaluate(() => { window.__inv = VsNet.invite('david', 'blocks'); });
  await until(() => david.evaluate(() => VsNet.prompt === 'sarah'));
  await david.click('#choices .choice:has-text("Play!")');
  assert.equal(await sarah.evaluate(() => window.__inv), true);
  await sarah.evaluate(() => { VsNet.play('blocks', 'david'); });
  await until(() => sarah.evaluate(() => Arcade.state === 'play' && !!VsNet.match));
  await until(() => david.evaluate(() => Arcade.state === 'play' && !!VsNet.match));
  // his pieces land on his board, and on her picture of it
  for (let i = 0; i < 4; i++) { await david.keyboard.press('Space'); await david.waitForTimeout(400); }
  const his = await david.evaluate(() => VsNet.match.me.grid.flat().filter(Boolean).length);
  assert.ok(his >= 8, String(his));
  await until(() => sarah.evaluate((n) => VsNet.match.op.grid.flat().filter(Boolean).length >= n, his));
  // junk she sends turns up on his board as rows of grey
  await sarah.evaluate(() => Online.game('david', { k: 'junk', n: 2 }));
  await until(() => david.evaluate(() => VsNet.match.me.grid.flat().filter((c) => c === 'G').length >= 9));
  // she leaves: he wins
  await sarah.evaluate(() => Arcade.quit());
  await until(() => david.evaluate(() => Arcade.state === 'over' && Arcade.result && Arcade.result.won === true));
  assert.deepEqual(sarah.problems, []);
  assert.deepEqual(david.problems.filter((m) => !/404/.test(m)), []);
  await sarah.context().close();
  await david.context().close();
});

test('Wonton can be talked to from every side of the hot spring (and a tap walks somewhere you can stand)', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 12));
  const res = await page.evaluate(() => {
    const n = NPCs.get('wonton');
    const [wx, wy] = W0.wonton;
    const out = { awake: !n.sleeping, standFree: !G.area.blockedAt(n.stand[0], n.stand[1]) };
    for (const [k, [tx, ty, dir]] of Object.entries({ below: [wx, wy + 3, 'up'], above: [wx, wy - 3, 'down'], left: [wx - 5, wy, 'right'], right: [wx + 4, wy, 'left'] })) {
      const p = G.player;
      p.x = (Math.floor(tx) + 0.5) * TILE; p.y = (Math.floor(ty) + 0.6) * TILE; p.dir = dir;
      const t = frontTarget(p);
      out[k] = !G.area.blockedAt(Math.floor(tx), Math.floor(ty)) && !!t && t.id === 'wonton';
    }
    return out;
  });
  assert.deepEqual(res, { awake: true, standFree: true, below: true, above: true, left: true, right: true });
  await page.context().close();
});

test('every arcade cabinet starts, plays and ends, the arcade has a cabinet for each (and one out of order), and the back room keeps the old classics', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 14));
  await page.evaluate(() => enterRoom('arcade'));
  await page.waitForFunction(() => G.area && G.area.id === 'arcade');
  const cabs = await page.evaluate(() => ({ list: ARCADE_CABS, inRoom: G.area.items.filter((i) => FURN[i.id] && FURN[i.id].arcade && !['claw', 'broken'].includes(FURN[i.id].arcade)).map((i) => FURN[i.id].arcade),
    broken: G.area.items.filter((i) => i.id === 'cab_broken').length, sprites: ARCADE_CABS.concat('broken').every((id) => Assets.has('f_cab_' + id)), now: arcadeCabs() }));
  assert.deepEqual(cabs.inRoom.sort(), [...cabs.list].sort());
  assert.deepEqual(cabs.list, ['blocks', 'capsules', 'stack', 'dumpling', 'sushi', 'fortune'], "David's swap: the back room's games out front");
  assert.equal(cabs.broken, 1, 'one cabinet out of order');
  assert.deepEqual(cabs.now, cabs.list, 'the classics wait behind the locked door');
  assert.ok(cabs.sprites, 'every cabinet has a picture');
  // the out-of-order one only says so
  const broken = await page.evaluate(async () => { const said = []; const say = UI.say; UI.say = async (who, l) => { said.push([].concat(l).join(' ')); }; try { await G.area.items.find((i) => i.id === 'cab_broken').use(); } finally { UI.say = say; } return { said: said.join(' '), playing: Arcade.on }; });
  assert.match(broken.said, /out of order/i);
  assert.equal(broken.playing, false);
  // and the back room's, once its door is open
  const all = await page.evaluate(() => { Quests.finish('backroom'); return arcadeCabs(); });
  assert.deepEqual(all.slice(cabs.list.length), ['fruit', 'garden', 'surf', 'noodle'], 'the back room adds the four classics');
  const back = await page.evaluate(async () => { await enterRoom('arcade_back'); return G.area.items.filter((i) => FURN[i.id] && FURN[i.id].arcade).map((i) => FURN[i.id].arcade); });
  assert.deepEqual(back.sort(), ['fruit', 'garden', 'noodle', 'surf']);
  for (const id of all) {
    await page.evaluate((id) => __dbg.arcade(id), id);
    await page.waitForFunction(() => Arcade.state === 'play', null, { timeout: 5000 });
    // a few seconds of mashing every button and tapping the screen
    for (let i = 0; i < 25; i++) {
      await page.evaluate(() => { for (const b of Arcade.def.buttons) Arcade.tap[b.k] = Math.random() < 0.3; Arcade.tap.screen = Math.random() < 0.2; Object.assign(Arcade.pointer, { x: Math.random() * ARCADE_W, y: Math.random() * ARCADE_H, down: Math.random() < 0.5 }); });
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => { Arcade.g.over = true; });
    await page.waitForFunction(() => Arcade.state === 'over', null, { timeout: 5000 });
    await page.evaluate(() => Arcade.close(true));
  }
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('games with the neighbors: "Let\'s play!" in the talk menu, tag, hide-and-seek, volleyball at the court, a dance-off at the club', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  // (the new day settles first: its own weather could be rain, and nobody plays tag in the rain)
  await page.evaluate(() => { __dbg.setTime(6, 10, 11); dailyCheck(); G.weather = 'sunny'; __dbg.at('plaza'); });
  const bring = (area) => page.evaluate((area) => { const n = NPCs.get('coco'), P = G.player; Object.assign(n, { sleeping: false, area, path: null, x: P.x + 22, y: P.y, talking: false, script: false }); }, area);
  // talk through whatever she says until a choice with this option comes up, and pick it
  const choose = async (label) => {
    await until(() => page.evaluate((label) => {
      if (UI._chooser) {
        const all = [...document.querySelectorAll('#choices .choice')], b = all.find((c) => c.textContent === label);
        if (b) { b.click(); return true; }
        // (a question of hers first, a favor or the like: the last answer is the polite no)
        if (all.length && !all.some((c) => c.textContent === 'Talk' || c.textContent === 'Tag')) all[all.length - 1].click();
        return false;
      }
      if (UI.dialogOpen) UI.advance();
      // (meeting her the first time is just hello: talk to her again)
      else if (!G.busy && label === "Let's play!") talkTo(NPCs.get('coco'));
      return false;
    }, label), 15000);
  };
  const talkThrough = (done) => until(() => page.evaluate((done) => { if (UI.dialogOpen && !UI._chooser) UI.advance(); return eval(done); }, done), 20000);
  await bring('island');
  await page.evaluate(() => { talkTo(NPCs.get('coco')); });
  await choose("Let's play!");
  await choose('Tag');
  // tag: she counts to three while Coco runs, then it's on
  await talkThrough("!!IslandGames.on && IslandGames.on.phase === 'play'");
  const tag = await page.evaluate(() => ({ script: NPCs.get('coco').script, hud: !$('#dancehud').hidden, away: Math.hypot(NPCs.get('coco').x - G.player.x, NPCs.get('coco').y - G.player.y), it: IslandGames.on.it }));
  assert.ok(tag.script && tag.hud && tag.it === 'sarah', JSON.stringify(tag));
  assert.ok(tag.away > 30, 'Coco ran off while Sarah counted: ' + tag.away);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(600); await page.keyboard.up('ArrowRight');
  await page.evaluate(() => { IslandGames.on.t = IG_TAG_FRAMES - 20; });
  await talkThrough('!IslandGames.on && !G.busy');
  assert.deepEqual(await page.evaluate(() => [S.games.tag.played, NPCs.get('coco').script, $('#dancehud').hidden]), [1, false, true]);
  // hide-and-seek: Coco hides somewhere Sarah can walk to; walking up to her finds her
  await bring('island');
  await page.evaluate(() => __dbg.islandGame('hide', 'coco', 'seek'));
  await talkThrough("!!IslandGames.on && IslandGames.on.phase === 'play'");
  const hid = await page.evaluate(() => { const n = NPCs.get('coco'); return { d: Math.hypot(n.x - G.player.x, n.y - G.player.y) / 16, open: !G.area.blockedAt(Math.floor(n.x / 16), Math.floor((n.y - 2) / 16)) }; });
  assert.ok(hid.d >= 4 && hid.open, JSON.stringify(hid));
  await page.evaluate(() => { const n = NPCs.get('coco'); G.player.x = n.x; G.player.y = n.y + 10; });
  await talkThrough('!IslandGames.on && !G.busy');
  assert.equal(await page.evaluate(() => S.games.hide.won), 1);
  // volleyball at the court: the game opens in the cabinet, and the score comes back
  const court = await page.evaluate(() => { const c = W0.props.find((q) => q.kind === 'volleyball'); const f = G.areas.island.nearestFree(c.x + 3, c.y + 7, 5); __dbg.teleport('island', f[0], f[1]); return f; });
  assert.ok(court, 'a place to stand by the court');
  await bring('island');
  assert.ok(await page.evaluate(() => IslandGames.list(NPCs.get('coco')).some((g) => g[0] === 'volley')), 'volleyball is offered by the court');
  await page.evaluate(() => __dbg.islandGame('volley', 'coco'));
  await talkThrough("Arcade.on && Arcade.id === 'volley' && Arcade.state === 'play'");
  for (let i = 0; i < 15; i++) { await page.evaluate(() => { for (const b of Arcade.def.buttons) Arcade.tap[b.k] = Math.random() < 0.4; }); await page.waitForTimeout(60); }
  await page.evaluate(() => { Arcade.g.score = 7; Arcade.g.pause = 1; });
  await page.waitForFunction(() => Arcade.state === 'over');
  await page.click('#arcade .ar-card button:has-text("Done")');
  await talkThrough('!Arcade.on && !G.busy');
  assert.deepEqual(await page.evaluate(() => [S.games.volley.played, S.games.volley.won, NPCs.get('coco').script]), [1, 1, false]);
  // the club: a dance-off with Coco beside Sarah on the floor (left early: no score, and she's free again)
  await page.evaluate(() => { __dbg.setTime(6, 12, 21); __dbg.teleport('club', 7, 9, 'up'); });
  await bring('club');
  assert.deepEqual(await page.evaluate(() => IslandGames.list(NPCs.get('coco')).map((g) => g[0])), ['danceoff', 'duet']);
  await page.evaluate(() => { Dance.start(Object.keys(SONGS)[0], { rival: NPCs.get('coco') }); });
  await page.waitForFunction(() => Dance.on && Dance.ready && Dance.now() > 3, null, { timeout: 20000 });
  const off = await page.evaluate(() => ({ next: Math.abs(NPCs.get('coco').x - G.player.x) / 16, script: NPCs.get('coco').script, hud: $('#dsong').textContent }));
  assert.ok(off.next <= 3 && off.script && /Dance-off/.test(off.hud), JSON.stringify(off));
  await page.evaluate(() => Dance.quit());
  await page.waitForFunction(() => !Dance.on && !G.busy);
  assert.equal(await page.evaluate(() => NPCs.get('coco').script), false);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('beta civic buildings: savings with interest, a letter delivered with a reply, an ordinance that moves the hours, a job', async () => {
  const page = await device();
  await page.evaluate(() => { localStorage.setItem('sc-current', ''); localStorage.setItem('sc-civic', '1'); });
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  assert.equal(await page.evaluate(() => CIVIC_PREVIEW), true);
  await page.evaluate(() => { S.money = 40000; for (const id of ['coco', 'kai', 'maki']) rel(id).met = true; dayStatsTick(); });
  // the Bank: put 5,000 in; three mornings later it has grown
  await page.evaluate(() => civicScreen('savings'));
  await page.locator('#panel input').first().fill('5000');
  await page.click('#panel button:has-text("Put in")');
  assert.deepEqual(await page.evaluate(() => [S.money, S.bank.savings]), [35000, 5000]);
  await page.evaluate(() => { S.bank.day -= 3; bankTick(); });
  assert.ok(await page.evaluate(() => S.bank.savings > 5000 && S.bank.flow.in.Interest > 0), 'interest paid');
  // the Post Office: a letter to Coco arrives the next morning, and she writes back
  await page.evaluate(() => civicScreen('letter'));
  await page.click('#panel .chip:has-text("Coco")');
  await page.locator('#panel textarea').fill('Dear Coco,\nThanks for showing me the crabs. They were very polite.\nYour friend,\nSarah');
  await page.click('#panel button:has-text("Mail it")');
  assert.equal(await page.evaluate(() => S.post.sent.length), 1);
  await page.evaluate(() => { S.post.sent[0].day -= 1; S.dayStats.day -= 1; postYesterday(); postTick(); });
  assert.deepEqual(await page.evaluate(() => [S.post.sent.length, S.mail.some((m) => m.from === 'coco'), S.post.papers.length > 0]), [0, true, true]);
  // the Town Hall: Night Owl keeps the shop open later, from the next morning
  const before = await page.evaluate(() => roomHours('shop')[1]);
  await page.evaluate(() => civicScreen('ordinance'));
  await page.click('#panel .row:has-text("Night Owl")');
  await page.click('#panel button:has-text("Enact")');
  assert.equal(await page.evaluate(() => [S.town.ord.next, roomHours('shop')[1]].join()), `night,${before}`);
  await page.evaluate(() => { S.town.ord.from = Clock.dayNum(); });
  assert.equal(await page.evaluate(() => roomHours('shop')[1]), Math.min(28.5, before + 3));
  // an island job: sweep the square, pile by pile, and get paid
  await page.evaluate(() => { const j = jobsState().offered.find((o) => o.kind === 'sweep') || { id: 'sweep', kind: 'sweep', n: 8 }; Jobs.take(j); Jobs.tick(); });
  const piles = await page.evaluate(() => G.areas.island.ents.filter((e) => e.jobPile).length);
  assert.ok(piles >= 4, String(piles));
  const money0 = await page.evaluate(() => S.money);
  await page.evaluate(() => { for (const e of G.areas.island.ents.filter((q) => q.jobPile)) e.interact(); });
  assert.ok(await page.evaluate((m) => !Jobs.active() && S.money > m, money0), 'paid for the job');
  // and the Town Hall itself opens, with the Council at the desk
  await page.evaluate(() => { __dbg.setTime(10, 27, 11); enterRoom('townhall'); });
  await page.waitForFunction(() => G.area && G.area.id === 'townhall');
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('shops grow: a letter, a day closed, then a bigger shop with more stock, a sale and a free gift', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 11));
  const res = await page.evaluate(() => {
    const out = { before: [shopLevel('shop'), shopStock().furn.length] };
    shopsTick();
    out.early = S.shops.shop.reno;                      // not enough yet: nothing happens
    S.startDay -= 10; S.shops.shop.spent = 20000;
    shopsTick();
    out.letter = S.mail.some((m) => m.from === 'fortune' && /closed tomorrow/i.test(m.subject));
    S.shops.shop.reno = Clock.dayNum();
    out.closed = !roomOpen('shop');
    S.shops.shop.reno = Clock.dayNum() - 1;
    shopsTick();
    const st = shopStock();
    out.after = [shopLevel('shop'), st.furn.length, shopName('shop'), hoursText('shop')];
    out.gift = [shopPrice(st.furn[0], 'shop'), shopPrice('seed_' + GD.veg[0], 'shop') > 0];
    shopState('shop').gift = null;
    out.sale = shopPrice(st.sale, 'shop') < ITEMS[st.sale].price;
    return out;
  });
  assert.deepEqual(res, { before: [1, 5], early: undefined, letter: true, closed: true, after: [2, 7, "Fortune's Goods & More", '7 AM to 11 PM'], gift: [0, true], sale: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the watering can: Fortune sells one; flowers of a kind side by side, both watered, grow a new one by morning (two colors make the third)', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = { stock: TOOL_STOCK.includes('can') && ITEMS.can.type === 'tool' };
    receive('can', 1);
    setHeld('can');
    // a clear patch of grass near Sarah, with two daisies side by side (two colors), bloomed
    const a = G.area, F = flowerState(), day = Clock.dayNum(), px = Math.floor(G.player.x / TILE), py = Math.floor(G.player.y / TILE);
    const clear = (x, y) => groundChar(x, y) === 'g' && !pathAt(x, y) && !a.waterAt(x, y) && !a.blockedAt(x, y)
      && !a.ents.some((o) => (o.tx === x && o.ty === y) || (o.kind === 'item' && Math.floor(o.x / TILE) === x && Math.floor((o.y - 2) / TILE) === y));
    let spot = null;
    for (let r = 2; r < 40 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
      let ok = true;
      for (let j = -1; j <= 2 && ok; j++) for (let i = -1; i <= 2 && ok; i++) ok = clear(px + dx + i, py + dy + j);
      if (ok) spot = [px + dx, py + dy];
    }
    const [x, y] = spot;
    const A = { x, y, kind: 'daisy', ci: 0, day: day - 3, pickDay: -1 }, B = { x: x + 1, y, kind: 'daisy', ci: 1, day: day - 3, pickDay: -1 };
    F.planted.push(A, B);
    addFlowerPlant(a, A); addFlowerPlant(a, B);
    // Sarah stands below them facing up and waters: the can's sweep reaches both
    G.player.x = (x + 0.5) * TILE; G.player.y = (y + 1.6) * TILE; G.player.dir = 'up';
    pressA();
    out.busy = G.busy > 0;
    await new Promise((r) => { const t = setInterval(() => { if (!G.busy) { clearInterval(t); r(); } }, 50); });
    out.wet = [watered(A), watered(B)];
    // mornings until they've made one (a third of mornings or so), watered every day
    for (let n = 0; n < 20 && F.planted.length === 2; n++) { __dbg.nextDay(1); A.wet = B.wet = Clock.dayNum(); }
    const kid = F.planted[2];
    out.kid = kid && [kid.kind, kid.ci, (Math.abs(kid.x - x) <= 1 || Math.abs(kid.x - x - 1) <= 1) && Math.abs(kid.y - y) <= 1, G.areas.island.ents.some((e) => e.pl === kid)];
    return out;
  });
  assert.deepEqual(res, { stock: true, busy: true, wet: [true, true], kid: ['daisy', 2, true, true] });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("Fortune's shop on Market Lane stays open after hours on the honor system; Fortune has a house; the lots have their signs", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    __dbg.setTime(10, 20, 23.5);
    const out = { lane: W0.buildings.shop.y === W0.buildings.restaurant.y && W0.buildings.shop.x > W0.buildings.builder.x, closed: !roomOpen('shop') };
    const said = [], say0 = UI.say, ask0 = UI.ask;
    UI.say = async (who, t) => { said.push(t); };
    UI.ask = async () => 2;
    await enterBuilding('shop');
    out.inside = G.area.id === 'shop';
    await staffAway();
    out.note = said.some((t) => /gone home for the night/.test(t));
    await leaveInterior();
    out.signs = W0.props.filter((p) => p.kind === 'sign_land').length + ',' + W0.props.filter((p) => p.kind === 'sign_lot').length;
    out.house = !!ROOMS.h_fortune && NPC_DEFS.fortune.house === 'h_fortune';
    // at night Fortune is asleep at home
    await visitHouse('h_fortune');
    out.asleep = said.some((t) => /Fortune is asleep/.test(t));
    UI.say = say0; UI.ask = ask0;
    return out;
  });
  assert.deepEqual(res, { lane: true, closed: true, inside: true, note: true, signs: '2,1', house: true, asleep: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("the camera's scrapbook: a photo says what's in it, and the scrapbook keeps a page for each with a bio, counted but never out of a total", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(() => {
    __dbg.setTime(6, 12, 13);
    // Sarah below the fountain, Maki beside her
    const f = W0.props.find((p) => p.kind === 'fountain_grand');
    G.player.x = (f.x + 2) * TILE; G.player.y = (f.y + 6) * TILE; G.player.dir = 'up';
    const n = NPCs.get('maki');
    n.area = 'island'; n.sleeping = false; n.hidden = false; n.x = G.player.x + 20; n.y = G.player.y; n.path = null;
    updateCam(true);
    Photo.start(); Photo.filter = 1; Photo.snap(); Photo.stop();
    const tags = Photos.list()[0].tags;
    Scrapbook.open();
    const text = document.querySelector('#panel').textContent;
    UI.close();
    return { tags: ['Maki', 'The fountain', 'Golden hour'].filter((t) => tags.includes(t)), maki: S.scrap['npc:maki'], day: Clock.dayNum(), fountain: S.scrap['place:fountain'] && S.scrap['place:fountain'].n,
      page: [/Neighbors · \d/.test(text), /rolled very tightly/.test(text), /In 1 photo/.test(text), /\d+ (of|out of) \d+/.test(text)] };
  });
  assert.deepEqual(res.tags, ['Maki', 'The fountain', 'Golden hour']);
  assert.deepEqual(res.maki, { n: 1, first: res.day, label: 'Maki' });
  assert.equal(res.fountain, 1);
  assert.deepEqual(res.page, [true, true, true, false]);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the laptop: Order again lists what Sarah has had, but not quest things, keepsakes, prizes, tools or gifts, and orders one for tomorrow', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const yes = ['table_wood', 'wall_mint', 'out_sundress', 'tuna', 'ramen', 'conch', 'seed_carrot'], no = ['q_note', 'moonrock', 'plush_maki', 'trophy_rope', 'axe', 'bag_1', 'photo_maki', 'present'];
  const names = await page.evaluate(([yes, no]) => {
    for (const id of yes.concat(no)) S.seen[id] = S.seen[id] || 1;
    S.money = 10000;
    openLaptop();
    return { yes: yes.map((id) => ITEMS[id].name), no: no.map((id) => ITEMS[id].name), tuna: ITEMS.tuna.name, price: ITEMS.tuna.price };
  }, [yes, no]);
  await page.locator('#panel .tabs button', { hasText: 'Order again' }).click();
  const shown = await page.$$eval('#panel .list .row b', (bs) => bs.map((b) => b.textContent));
  for (const n of names.yes) assert.ok(shown.includes(n), `${n} can be ordered again`);
  for (const n of names.no) assert.ok(!shown.includes(n), `${n} is not for sale`);
  assert.ok(await page.locator('#panel h3', { hasText: 'Fish' }).count());
  await page.locator('#panel .list .row', { has: page.locator('b', { hasText: new RegExp(`^${names.tuna}$`) }) }).click();
  const after = await page.evaluate(() => ({ money: S.money, box: pendingBox() && pendingBox().gifts }));
  assert.deepEqual(after, { money: 10000 - names.price * 2, box: ['tuna'] });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('IslandMart: a new stock every Monday, so many of each kind (never all chairs), the same all week', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const today = Clock.dayNum(), monday = today - ((today + 3) % 7), key = (d) => ['furniture', 'clothes', 'decor'].map((t) => laptopCatalog(t, d).join()).join('|');
    const f = laptopCatalog('furniture', monday), kinds = {};
    for (const id of f) kinds[FURN[id].kind] = (kinds[FURN[id].kind] || 0) + 1;
    const groups = new Set(f.filter((id) => FURN[id].kind === 'floor').map((id) => (MART_GROUPS.find(([, re]) => re.test(id)) || ['other'])[0]));
    const clothes = laptopCatalog('clothes', monday), decor = laptopCatalog('decor', monday);
    return {
      kinds, mixed: groups.size >= 5,
      clothes: [clothes.filter((id) => ITEMS[id].type === 'outfit').length, clothes.filter((id) => ITEMS[id].type === 'acc').length],
      decor: [decor.filter((id) => GD.walls.includes(id)).length, decor.filter((id) => GD.floors.includes(id)).length],
      week: key(monday) === key(monday + 6), next: key(monday) !== key(monday + 7), fewer: f.length < laptopAll('furniture').length,
    };
  });
  assert.deepEqual(res, { kinds: { floor: 12, wall: 4, rug: 2, top: 5 }, mixed: true, clothes: [5, 6], decor: [5, 5], week: true, next: true, fewer: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the arcade back room: a hidden mystery from Chili to Sully to the lighthouse, then the door opens', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 15));
  const res = await page.evaluate(async () => {
    const chili = NPCs.get('chili');
    chili.area = 'arcade';
    const out = { hidden: backOptions(chili).length === 0 && !Quests.todo().some((t) => t.title === 'The locked door') };
    S.startDay -= 20;
    for (const id of ARCADE_CABS) arc().plays[id] = 1;
    // answer every line as soon as it is asked
    const say = UI.say;
    UI.say = async () => {};
    try {
      await backOptions(chili)[0].fn();
      await backOptions(NPCs.get('sully'))[0].fn();
      await backKeyHunt();
      out.key = pocketCount('q_arcadekey');
      await enterRoom('arcade');
      await backDoor();
    } finally { UI.say = say; }
    out.area = G.area.id;
    out.done = Quests.done('backroom');
    out.keyGone = pocketCount('q_arcadekey') === 0;
    return out;
  });
  assert.deepEqual(res, { hidden: true, key: 1, area: 'arcade_back', done: true, keyGone: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the island: every spot and door can be walked to (the mountain, the forest loops, the Ridge Trail), no open ground is out of reach, nobody walks off a sea cliff, the cove only down its stair from the farm, the square has its Town Hall, Post Office and Bank, and the shops stand in two rows along an alley', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const r = await page.evaluate(() => {
    // walk the island as the game blocks it (ground, buildings, props, trees), from the square
    const a = G.areas.island, walk = (blocked) => {
      const seen = new Uint8Array(a.w * a.h), st = [[W0.spots.plaza.x, W0.spots.plaza.y]];
      seen[W0.spots.plaza.y * a.w + W0.spots.plaza.x] = 1;
      while (st.length) {
        const [x, y] = st.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * a.w + nx; if (!seen[k] && !a.blockedAt(nx, ny) && !blocked.has(nx + ',' + ny)) { seen[k] = 1; st.push([nx, ny]); } }
      }
      return (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (seen[(y + dy) * a.w + x + dx]) return true; return false; };
    };
    const can = walk(new Set());
    const spots = Object.entries(W0.spots).filter(([, s]) => !can(s.x, s.y, Math.max(1, s.r))).map(([k]) => k);
    const doors = Object.entries(W0.buildings).filter(([, b]) => !can(b.x + b.door, b.y + b.h, 0)).map(([k]) => k);
    // the cove: its stair is the only way down (block it and the beach can't be reached)
    const coveStair = W0.ramps.filter(([x, y]) => x >= 15 && x <= 21 && y >= 58 && y <= 63);
    const cove = [16, 65], shut = walk(new Set(coveStair.map(([x, y]) => x + ',' + y)));
    // any open ground can be reached, and raised ground ends at the sea in a rim nobody stands on (in 3D it's the cliff)
    let pockets = 0, seaEdge = 0;
    for (let y = 1; y < a.h - 1; y++) for (let x = 1; x < a.w - 1; x++) {
      if (a.blockedAt(x, y)) continue;
      if (!can(x, y, 0)) pockets++;
      if (+W0.height[y][x] > 0 && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => W0.grid[y + dy][x + dx] === '~')) seaEdge++;
    }
    const B = W0.buildings, rowA = ['boutique', 'salon', 'studio', 'displays'], rowB = ['restaurant', 'arcade', 'club', 'builder', 'shop'];
    const rows = rowA.every((id) => B[id].y === B.boutique.y) && rowB.every((id) => B[id].y === B.restaurant.y) && B.restaurant.y > B.boutique.y + B.boutique.h;
    return { pockets, seaEdge, rows, spots, doors, stair: coveStair.length, cove: can(...cove, 1), coveShut: shut(...cove, 1), civic: ['townhall', 'postoffice', 'bank'].map((id) => !!(W0.buildings[id] && Assets.dyn[W0.buildings[id].sprite])),
      cuke: !!W0.buildings.h_cuke, square: ['postoffice', 'townhall', 'bank', 'museum'].every((id) => W0.buildings[id].y + W0.buildings[id].h === W0.plaza[1]), fortune: !!(W0.buildings.h_fortune && ROOMS.h_fortune) };
  });
  assert.deepEqual(r.spots, [], 'every spot the neighbors use can be walked to');
  assert.deepEqual(r.doors, [], 'every door can be walked to');
  assert.equal(r.pockets, 0, 'no open ground that nobody can get to');
  assert.equal(r.seaEdge, 0, 'nobody can walk out onto the rim of a sea cliff');
  assert.ok(r.rows, 'the shops stand in two rows, the alley between them');
  assert.ok(r.stair >= 3 && r.cove && !r.coveShut, `the cove is reached only by its stair from the farm (${JSON.stringify(r)})`);
  assert.deepEqual(r.civic, [true, true, true], 'the Town Hall, the Post Office and the Bank stand on the square, with pictures');
  assert.ok(r.cuke && r.square && r.fortune, 'Cuke and Fortune have houses; the civic row opens onto the square');
  // their doors are signs for now
  const said = await page.evaluate(async () => { const out = []; UI.say = async (who, t) => { out.push(t); }; await enterBuilding('townhall'); await enterBuilding('bank'); return out; });
  assert.ok(/TOWN HALL/.test(said[0]) && /BANK/.test(said[1]));
  // no clouds on the map, no places counter
  await page.evaluate(() => BigMap.open());
  assert.equal(await page.$('.bm-found'), null);
  await page.evaluate(() => BigMap.close());
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('holiday events: eggs to find on the Egg Hunt (gone the next day), and a Fish-Off with Kai', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const say = UI.say;
    UI.say = async () => {};
    const out = {};
    try {
      const egghunt = HOLIDAYS.find((h) => h.id === 'egghunt');
      const [m, d] = holidayStart(egghunt, new Date().getFullYear());
      __dbg.setTime(m, d, 10); dailyCheck(true); festTick();
      const a = G.areas.island;
      out.eggs = a.ents.filter((e) => e.kind === 'item' && /^egg_/.test(e.id)).length;
      for (const e of a.ents.filter((e) => e.kind === 'item' && /^egg_/.test(e.id)).slice(0, 3)) await pickUp(e);
      const money = S.money;
      await eggsToCece();
      out.paid = S.money - money;
      out.recipe = S.recipes.includes('pancakes');
      __dbg.setTime(m, d + 3, 10); dailyCheck(true); festTick();
      out.left = S.drops.filter((x) => /^egg_/.test(x.id)).length;
      const fo = HOLIDAYS.find((h) => h.id === 'fishoff' && h.m === 10);
      const [fm, fd] = holidayStart(fo, new Date().getFullYear());
      __dbg.setTime(fm, fd, 10); dailyCheck(true);
      __dbg.give('rod');
      out.open = FishOff.open();
      await FishOff.start();
      for (const id of ['tuna', 'tuna', 'salmon', 'octopus', 'tuna']) FishOff.caught(id);
      FishOff.end = Date.now() - 1;
      await FishOff.finish();
      out.trophy = ownedCount('fish_trophy');
      out.again = festOptions(NPCs.get('kai')).length;
    } finally { UI.say = say; }
    return out;
  });
  assert.deepEqual(res, { eggs: 8, paid: 240, recipe: true, left: 0, open: true, trophy: 1, again: 0 });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('neighbors find things of their own to do (the stars only at night), a chat is acted out: one talks, the other listens', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const out = {}, n = NPCs.get('maki'), m = NPCs.get('kai');
    const free = (o, x, y) => { Object.assign(o, { area: 'island', x: x * TILE, y: y * TILE, path: null, sleeping: false, fixed: false, talking: false, script: false, chat: null, idle: null, anchor: [x, y] }); o.want = { area: 'island', x: o.x, y: o.y }; };
    // (the clock jump places everyone where their day says: put her back out on the square each time)
    const kinds = (h) => { __dbg.setTime(6, 12, h); G.weather = 'sunny'; free(n, 116, 110); const k = new Set(); for (let i = 0; i < 200; i++) { n.idle = null; idleStart(n); if (n.idle) k.add(n.idle.kind); } n.idle = null; return k; };
    free(n, 116, 110);
    const night = kinds(22), noon = kinds(12);
    out.night = night.has('stars') && !night.has('snack');
    out.noon = !noon.has('stars') && noon.has('snack') && !noon.has('fish') && [...noon].every((k) => IDLE_ACTS[k]);
    // by the water a line goes in too (facing the water)
    const a = G.areas.island; let edge = null;
    for (let y = 40; y < 150 && !edge; y++) for (let x = 20; x < 200 && !edge; x++) if (!a.blockedAt(x, y) && !a.waterAt(x, y) && a.waterAt(x, y + 1) && !pathAt(x, y)) edge = [x, y];
    __dbg.setTime(6, 12, 12); G.weather = 'sunny'; free(n, edge[0] + 0.5, edge[1] + 0.6);
    let fish = false;
    for (let i = 0; i < 200 && !fish; i++) { n.idle = null; idleStart(n); fish = !!n.idle && n.idle.kind === 'fish'; }
    out.fish = fish && n.dir === 'down';
    n.idle = null;
    // lunch: most days home or at Mac's round noon
    let lunches = 0;
    for (let d = 0; d < 20; d++) { const p = makePlan('maki', Clock.dayNum() + d); if (p.segs.some((s) => (s.spot === 'home' || s.spot === 'in_restaurant') && s.a >= 11.7 && s.a <= 12.6)) lunches++; }
    out.lunch = lunches >= 10;
    // an evening visit now and then: the guest at the host's house, the host home for it
    let visits = 0, agree = true;
    for (let d = 0; d < 20; d++) {
      const day = Clock.dayNum() + d;
      for (const [g, v] of Object.entries(friendVisits(day))) {
        if (!v[0].startsWith('in_h_')) continue;
        visits++;
        const host = v[0].slice(5), gp = makePlan(g, day), hp = makePlan(host, day), mid = (v[1] + v[2]) / 2;
        if (!gp.segs.some((s) => s.spot === v[0] && s.a <= mid && s.b >= mid) || !hp.segs.some((s) => s.spot === 'home' && s.a <= mid && s.b >= mid)) agree = false;
      }
    }
    out.visits = visits >= 3 && agree;
    // an errand after work, where the Bank or the Post Office opens into a room (beta: stand-ins for the rooms here)
    const had = { b: ROOMS.bank, p: ROOMS.postoffice, hb: ROOM_HOURS.bank, hp: ROOM_HOURS.postoffice };
    ROOMS.bank = ROOMS.bank || { w: 13, h: 6, name: 'Bank' }; ROOMS.postoffice = ROOMS.postoffice || { w: 13, h: 6, name: 'Post Office' };
    ROOM_HOURS.bank = ROOM_HOURS.bank || [9, 18]; ROOM_HOURS.postoffice = ROOM_HOURS.postoffice || [7, 21];
    let errands = 0, open = true;
    for (let d = 0; d < 20; d++) for (const id of NEIGHBORS) {
      for (const s of makePlan(id, Clock.dayNum() + d).segs) {
        if (s.spot !== 'in_bank' && s.spot !== 'in_postoffice') continue;
        errands++;
        if (!roomOpen(s.spot.slice(3), s.a) || !roomOpen(s.spot.slice(3), s.b - 0.01)) open = false;
      }
    }
    if (!had.b) delete ROOMS.bank; if (!had.p) delete ROOMS.postoffice;
    if (!had.hb) delete ROOM_HOURS.bank; if (!had.hp) delete ROOM_HOURS.postoffice;
    out.errands = errands >= 5 && open;
    // the farm's morning: Cuke waters the fields, then carries a basket to Fortune's; some afternoons Kai fishes off the pier
    // and takes his bucket to the shop
    const cp = makePlan('cuke', Clock.dayNum() + 1), fs = cp.segs.find((s) => s.spot === 'farm' && s.tend), ds = cp.segs.find((s) => s.spot === 'in_shop' && s.carry === 'crate');
    let catches = 0;
    for (let d = 0; d < 20; d++) { const kp = makePlan('kai', Clock.dayNum() + d); if (kp.segs.some((s) => s.spot === 'pier_end' && s.fish) && kp.segs.some((s) => s.spot === 'in_shop' && s.carry === 'catch')) catches++; }
    // and the neighbors go and buy it: after the delivery, a trip to Fortune's and home with a tote of groceries
    let trips = 0, early = 0;
    for (let d = 0; d < 14; d++) {
      const day = Clock.dayNum() + d, del = makePlan('cuke', day).segs.find((s) => s.spot === 'in_shop' && s.carry === 'crate');
      for (const id of NEIGHBORS) {
        const segs = makePlan(id, day).segs, i = segs.findIndex((s) => s.spot === 'home' && s.carry === 'groceries');
        if (i < 1) continue;
        if (segs[i - 1].spot === 'in_shop') trips++;
        if (!del || segs[i - 1].a < del.b - 0.01) early++;
      }
    }
    out.farm = { round: !!fs && !!ds && ds.a >= fs.b - 0.01, catches: catches >= 4, shopping: trips >= 10 && !early && CARRY.groceries.hand === 'style_grocery' };
    // and once there, their day says what they do: watering, or a line in the water
    __dbg.setTime(6, 12, 9.5); free(n, 116, 110); n.want = Object.assign({}, n.want, { tend: true }); idleStart(n);
    out.farm.tend = !!n.idle && n.idle.kind === 'tend';
    n.idle = null; free(n, edge[0] + 0.5, edge[1] + 0.6); n.want = Object.assign({}, n.want, { tend: false, fish: true }); idleStart(n);
    out.farm.fish = !!n.idle && n.idle.kind === 'fish';
    n.idle = null; n.want = Object.assign({}, n.want, { fish: false });
    // busy with something: no chat; walking off ends it
    __dbg.setTime(6, 12, 12);
    free(n, 116, 110);
    idleStart(n);
    out.busy = !!n.idle && !Chats.free(n);
    n.path = [[117, 110]];
    updateNPC(n);
    out.ended = n.idle === null;
    // a chat: whoever's line it is talks, the other listens (and nods now and then)
    free(n, 116, 110); free(m, 117, 110);
    Chats.start(n, m);
    const c = Chats.list.find((x) => x.a === n);
    c.t = c.dur;
    const sp = EnvDolls.act(n, {}), li = EnvDolls.act(m, {});
    out.chat = { talks: !!sp.talking, listens: li.listen === n, text: typeof c.text === 'string' && c.text.length > 0 };
    let nods = 0;
    const d = {};
    for (let i = 0; i < 400; i++) { G.t++; if (EnvDolls.act(m, d).nod > 0) nods++; }
    out.nods = nods > 0;
    Chats.end(c);
    return out;
  });
  assert.deepEqual(res, { night: true, noon: true, fish: true, lunch: true, visits: true, errands: true, farm: { round: true, catches: true, shopping: true, tend: true, fish: true }, busy: true, ended: true, chat: { talks: true, listens: true, text: true }, nods: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the museum in rooms: archways from the hall into six wings, every fish from the start, photos, designs and the island\'s mysteries on show', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => { __dbg.setTime(10, 27, 11); enterRoom('museum'); });
  await page.waitForFunction(() => G.area && G.area.id === 'museum');
  const hall = await page.evaluate(() => ({ doors: G.area.upDoors.length, arches: G.area.ents.filter((e) => e.look3d && e.look3d.arch).map((e) => e.look3d.arch),
    open: G.area.upDoors.every((d) => !G.area.blockedAt(d.x, 1)) }));
  assert.deepEqual(hall, { doors: 6, arches: ['museum_art', 'museum_pots', 'museum_fish', 'museum_photo', 'museum_fashion', 'museum_history'], open: true });
  // walking up through the first archway goes into the gallery; its door leads back to the hall, under the archway
  await page.evaluate(() => { const [x, y] = toArea(1, 0); G.player.x = (x + 0.5) * TILE; G.player.y = (y + 0.6) * TILE; for (let i = 0; i < 12; i++) { movePlayer(G.player, 0, -1.35); afterMove(G.player); } });
  await page.waitForFunction(() => G.area && G.area.id === 'museum_art', null, { timeout: 5000 });
  const gallery = await page.evaluate(() => ({ wall: G.area.items.filter((i) => FURN[i.id] && FURN[i.id].kind === 'wall' && (FURN[i.id].art || i.id === 'empty_frame')).length,
    easels: G.area.ents.filter((e) => e.look3d && e.look3d.easel).length }));
  assert.deepEqual(gallery, { wall: 5, easels: 3 });
  await page.evaluate(() => { G.player.y = G.area.exitY + 2; afterMove(G.player); });
  await page.waitForFunction(() => G.area && G.area.id === 'museum', null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => Math.floor(G.player.x / TILE)), 2, 'back under the archway');
  const res = await page.evaluate(async () => {
    const out = {};
    const askText0 = window.askText;
    window.askText = async () => 'Sunset from the pier';
    try {
      // ten pedestals in the pottery hall
      await enterRoom('museum_pots');
      out.pots = G.area.items.filter((i) => i.id === 'pedestal' || (FURN[i.id] && FURN[i.id].kind === 'floor' && ITEMS[i.id] && ITEMS[i.id].pottery)).length;
      // every fish in the game but the boot, in the aquarium from the start
      await enterRoom('museum_fish');
      const tanks = G.area.ents.filter((e) => e.look3d && e.look3d.tank);
      const shown = new Set(tanks.flatMap((e) => e.look3d.tank));
      out.fish = { tanks: tanks.length, all: FISHES.every((f) => f.id === 'boot' || shown.has(f.id)), boot: shown.has('boot') };
      // a photo from the album hung in the photography wing, with its card's name; the album keeps it however many more are taken
      await enterRoom('museum_photo');
      const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d'); g.fillStyle = '#e88a3a'; g.fillRect(0, 0, 40, 30);
      Photos.keep([{ url: c.toDataURL('image/jpeg', 0.8), t: 1000, tags: ['the pier'] }]);
      out.placed = await placePhoto(2, 0);
      for (let i = 0; i < 14; i++) Photos.add(c.toDataURL('image/jpeg', 0.5), []);
      const kept = Photos.list().find((p) => p.museum === 2);
      out.photo = { kept: !!kept && kept.title === 'Sunset from the pier', album: Photos.list().filter((p) => p.museum == null).length };
      await new Promise((r) => { const t0 = performance.now(); (function wait() { if (Assets.dyn.mphoto_1000 || performance.now() - t0 > 3000) r(); else setTimeout(wait, 50); })(); });
      out.photo.wall = G.area.id === 'museum_photo' && G.area.items.some((i) => i.id === 'mphoto_1000');
      // one of Sarah's designs on a dress form (a copy)
      designs().d1 = Object.assign(newDesign(), { name: 'Blue Tuesday' });
      registerDesign('d1', designs().d1);
      await enterRoom('museum_fashion');
      const pick = fashionPick(0);
      await new Promise((r) => setTimeout(r, 50));
      [...document.querySelectorAll('button.slot')].find((b) => b.title === 'Blue Tuesday').click();
      await pick;
      designs().d1.top = ['#e0405a', 'red'];
      out.fashion = { name: S.art.fashion[0] && S.art.fashion[0].name, copy: S.art.fashion[0].d.top[1] === 'blue', form: G.area.ents.some((e) => e.kind === 'mannequin' && e.design) };
      // a solved mystery's keepsake in its case, the rest still waiting
      Quests.finish('treasure');
      await enterRoom('museum_history');
      const cases = G.area.ents.filter((e) => e.look3d && 'showcase' in e.look3d);
      out.history = { cases: cases.length, map: cases.some((e) => e.look3d.showcase === 'oldmap'), waiting: cases.filter((e) => !e.look3d.showcase).length };
      // an older save's five spots in the gallery: the three new easels take what isn't up yet
      artState().hung = ['art_goat', null, null, null, null];
      const w = museumWall();
      out.oldSave = { n: w.length, first: w[0], more: w.slice(5).filter(Boolean).length >= 2, unique: new Set(w.filter(Boolean)).size === w.filter(Boolean).length };
    } finally { window.askText = askText0; }
    return out;
  });
  assert.equal(res.pots, 10);
  assert.deepEqual(res.fish, { tanks: 4, all: true, boot: false });
  assert.equal(res.placed, true);
  assert.deepEqual(res.photo, { kept: true, album: 12, wall: true });
  assert.deepEqual(res.fashion, { name: 'Blue Tuesday', copy: true, form: true });
  assert.deepEqual(res.history, { cases: 6, map: true, waiting: 5 });
  assert.deepEqual(res.oldSave, { n: 8, first: 'art_goat', more: true, unique: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('IslandMart furniture in four colors: each piece in its own and three more, named for the color, one color a week in the shop, kept in saves', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const out = {};
    const v = FURN['sofa_pink@mint'];
    out.piece = { name: v && v.name, price: ITEMS['sofa_pink@mint'].price === ITEMS.sofa_pink.price, colors: FURN.sofa_pink.colors.length, wood: FURN['table_wood@dark wood'].name };
    out.missing = Object.keys(paintTableMissing());
    out.all = laptopAll('furniture').some((id) => id.includes('@'));
    let colored = 0;
    for (let w = 0; w < 6; w++) colored += laptopCatalog('furniture', Clock.dayNum() + w * 7).filter((id) => id.includes('@') && FURN[id]).length;
    out.week = colored > 0;
    // its picture repainted: the sofa's pink gone mint, its outline the same
    const a = iconCanvas('f_sofa_pink', 16), b = iconCanvas('f_sofa_pink@mint', 16);
    const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    let changed = 0, same = 0;
    for (let i = 0; i < da.length; i += 4) { if (da[i + 3] < 128) continue; if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) changed++; else same++; }
    out.picture = { size: a.width === b.width, changed: changed > 10, kept: same > 10 };
    // placed at home and drawn
    S.house.items.push({ id: 'sofa_pink@mint', x: 2, y: 4 });
    out.home = !!furnDef('sofa_pink@mint');
    // an old save with a color this version doesn't have: the piece itself
    const st = JSON.parse(JSON.stringify(S));
    st.storage['sofa_pink@purple'] = 2; st.storage['sofa_pink@mint'] = 1;
    st.pocket[0] = { id: 'chair_wood@violet', n: 1 };
    const m = migrate(st);
    out.save = { purple: !m.storage['sofa_pink@purple'], base: m.storage.sofa_pink >= 2, mint: m.storage['sofa_pink@mint'] === 1, pocket: m.pocket[0] && m.pocket[0].id };
    return out;
  });
  assert.deepEqual(res, {
    piece: { name: 'Sofa (mint)', price: true, colors: 4, wood: 'Table (dark wood)' },
    missing: [], all: false, week: true,
    picture: { size: true, changed: true, kept: true },
    home: true,
    save: { purple: true, base: true, mint: true, pocket: 'chair_wood' },
  });
  await page.evaluate(() => enterRoom ? (G.areas.home = buildHome(), __dbg.teleport('home', 4, 6, 'up')) : null);
  await page.waitForTimeout(300);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('tag with a friend online: asked from the friend\'s menu, tags go back and forth, one side calls time with the count, and either can stop', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, sent = [], said = [];
    const game0 = Online.game, ask0 = UI.ask, say0 = UI.say;
    Online.game = (to, d) => sent.push([to, d.k, d]);
    UI.say = async (who, t) => { said.push(String(t)); };
    // a friend (Joe) on the island, right beside Sarah
    const p = G.player, o = { kind: 'remote', who: 'joe', area: 'island', x: p.x + 60, y: p.y, tx: p.x + 60, ty: p.y, def: { human: true } };
    Online.others.set('joe', o);
    try {
      out.can = FriendTag.can(o);
      FriendTag.invite(o);
      out.ask = sent.at(-1)[1];
      FriendTag.got('joe', { k: 'tagYes' });
      out.started = { on: !!FriendTag.on, it: FriendTag.on.it, go: sent.at(-1)[1], hud: !$('#dancehud').hidden };
      // Sarah's it: after the pause, close enough is a tag
      FriendTag.on.pause = 0; o.x = p.x + 6;
      FriendTag.tick();
      out.tag = { sent: sent.at(-1)[1], to: sent.at(-1)[2].it, it: FriendTag.on.it, pause: FriendTag.on.pause > 0 };
      // Joe tags back; an older message afterwards changes nothing
      FriendTag.got('joe', { k: 'tagIt', it: 'sarah', n: 2 });
      FriendTag.got('joe', { k: 'tagIt', it: 'joe', n: 1 });
      out.back = FriendTag.on.it;
      // Joe's side calls time with its count: Sarah was it less, so she wins
      FriendTag.got('joe', { k: 'tagEnd', why: 'time', mine: 4000, theirs: 3000 });
      out.end = { on: !!FriendTag.on, won: S.games.ftag.won, said: said.some((t) => /You win/.test(t)), hud: $('#dancehud').hidden };
      // asked: yes, then the go-ahead with Joe as it; then Joe stops
      UI.ask = async () => 0;
      await FriendTag.got('joe', { k: 'tagAsk' });
      out.yes = sent.at(-1)[1];
      FriendTag.got('joe', { k: 'tagGo', it: 'joe' });
      out.second = FriendTag.on && FriendTag.on.it;
      FriendTag.got('joe', { k: 'tagEnd', why: 'quit' });
      out.stopped = !FriendTag.on;
      // busy: inside, a friend's ask is turned down
      G.area = { id: 'home' };
      await FriendTag.got('joe', { k: 'tagAsk' });
      out.busy = sent.at(-1)[1] + ':' + sent.at(-1)[2].why;
      G.area = G.areas.island;
    } finally { Online.game = game0; UI.ask = ask0; UI.say = say0; Online.others.delete('joe'); }
    return out;
  });
  assert.deepEqual(res, {
    can: true, ask: 'tagAsk',
    started: { on: true, it: 'sarah', go: 'tagGo', hud: true },
    tag: { sent: 'tagIt', to: 'joe', it: 'joe', pause: true },
    back: 'sarah',
    end: { on: false, won: 1, said: true, hud: true },
    yes: 'tagYes', second: 'joe', stopped: true, busy: 'tagNo:busy',
  });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('vacations: rare, one at a time, on the board; friends see them off at the pier, a postcard, a souvenir, a note on the door', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const say = UI.say;
    const said = [];
    UI.say = async (who, text) => { said.push(String(text)); };
    const out = {}, today = Clock.dayNum();
    const go = (dn, h) => { Clock.offsetMs += (dn - Clock.dayNum()) * 864e5; Clock.offsetMs += (h - Clock.hourF()) * 3600e3; G.events = todayEvents(); Plans.reset(); };
    try {
      // a year of them: each neighbor a few times, never two at once
      let most = 0, trips = 0, v = null;
      const went = new Set();
      for (let d = today; d < today + 365; d++) {
        const away = Object.keys(VAC).filter((id) => vacationOf(id, d));
        most = Math.max(most, away.length);
        for (const id of away) if (vacationOf(id, d).leave === d) { trips++; went.add(id); if (!v && id === 'kai') v = vacationOf(id, d); }
      }
      out.year = { most, trips: trips >= 26 && trips <= 52, everyone: Object.keys(VAC).every((id) => went.has(id)), kai: !!v, long: v && v.back - v.leave >= 3 && v.back - v.leave <= 5 };
      const r = rel('kai'); r.met = true; r.pts = 9999;
      // the morning they leave: at the pier with a suitcase, onto the boat, two friends there to see them off
      go(v.leave, 9);
      const p = Plans.get('kai'), pier = p.segs.find((s) => s.spot === 'pier' && s.a >= VAC_LEAVE - 0.01);
      out.leave = { pier: !!pier && pier.bags, boat: p.sleepAt === 'boat', friends: Object.keys(VAC).filter((id) => (vacationOverride(id, v.leave) || []).length).length, board: boardTodayLines().some((l) => /Kai leaves for/.test(l)), line: /this morning/.test(vacationLine('kai') || '') };
      // away: no plan, the board and texts say so, a note on the door, a postcard in the mail
      go(v.leave + 1, 12);
      dailyCheck(true);
      out.away = { plan: !!Plans.get('kai').away, texts: whereabouts('kai').away, board: boardTodayLines().some((l) => /Kai is on vacation/.test(l)), postcard: S.mail.some((m) => m.from === 'kai' && /postcard/i.test(m.subject)) };
      said.length = 0;
      await visitHouse('h_kai');
      out.door = said.some((s) => /note on the door/.test(s) && s.includes(v.place));
      // back: off the boat in the afternoon, a souvenir for a good friend
      go(v.back, 16);
      dailyCheck(true);
      const q = Plans.get('kai');
      out.back = { boat: q.wakeAt === 'boat', away: !q.away, souvenir: S.mail.some((m) => m.from === 'kai' && m.gift === VAC.kai.gift), line: /I'm back/.test(vacationLine('kai') || '') };
    } finally { UI.say = say; }
    return out;
  });
  assert.deepEqual(res, {
    year: { most: 1, trips: true, everyone: true, kai: true, long: true },
    leave: { pier: true, boat: true, friends: 2, board: true, line: true },
    away: { plan: true, texts: true, board: true, postcard: true },
    door: true,
    back: { boat: true, away: true, souvenir: true, line: true },
  });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('catchphrases: each neighbor ends some lines with theirs; a good friend takes a new one (and reacts), kept with the island', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, n = NPCs.get('kai'), r = rel('kai');
    const ends = (id, word) => { let k = 0; for (let i = 0; i < 400; i++) if (voiced(id, 'Hello there ' + 'x'.repeat(i)).endsWith(' ' + word)) k++; return k; };
    out.own = ends('kai', 'Bro.') > 50;
    out.tidy = catchClean('  wow!!  <b>x</b>  ') === 'wow!! bxb' && catchClean('a'.repeat(30)).length === 16;
    // not a good enough friend yet: no option; at four hearts there is
    r.met = true; r.pts = 0;
    const said = [], say = UI.say, ask = UI.ask, text = window.askText;
    let opts = null;
    UI.say = async (who, t) => { said.push(String(t)); };
    UI.ask = async (who, t, choices) => { opts = opts || choices.slice(); return choices.length - 1; };
    try {
      await neighborTalk(n);
      out.early = !opts.includes('New catchphrase?');
      r.pts = HEARTS[4]; r.talkDay = Clock.dayNum(); opts = null;
      await neighborTalk(n);
      out.offered = opts.includes('New catchphrase?');
      window.askText = async () => 'tubular';
      said.length = 0;
      await catchFlow(n);
      out.taught = { kept: r.catch === 'tubular', react: said.some((s) => /Tubular/.test(s)), ends: ends('kai', 'Tubular.') > 50, once: r.catchDay === Clock.dayNum() };
    } finally { UI.say = say; UI.ask = ask; window.askText = text; }
    out.saved = JSON.parse(JSON.stringify(S)).npcs.kai.catch === 'tubular';
    delete r.catch;
    out.back = catchOf('kai') === 'bro';
    return out;
  });
  assert.deepEqual(res, { own: true, tidy: true, early: true, offered: true, taught: { kept: true, react: true, ends: true, once: true }, saved: true, back: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('nicknames: a good friend asks once if they can call Sarah something, uses it in their lines, and she can change it', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, n = NPCs.get('cece'), r = rel('cece'), nm = S.playerName || 'Sarah';
    r.met = true; r.pts = HEARTS[4]; r.talkDay = -1;
    const say = UI.say, ask = UI.ask, text = window.askText;
    let asked = 0;
    UI.say = async () => {};
    UI.ask = async (who, t, choices) => { if (choices[0] === 'Sure, I love it!') { asked++; return 0; } return choices.length - 1; };
    try {
      await neighborTalk(n);
      out.first = { asked, nick: r.nick };
      r.talkDay = -1;
      await neighborTalk(n);
      out.once = asked === 1;
      out.lines = { mine: nickIn('cece', 'Hi, {name}! ' + nm + ' is here.') === 'Hi, Sweetie! Sweetie is here.', others: nickIn('kai', 'Hi, {name}!') === 'Hi, {name}!' };
      window.askText = async () => 'Sar-bear';
      await nickFlow(n);
      out.changed = r.nick === 'Sar-bear';
      window.askText = async () => '';
      await nickFlow(n);
      out.back = !r.nick && nickIn('cece', 'Hi, {name}!') === 'Hi, {name}!';
    } finally { UI.say = say; UI.ask = ask; window.askText = text; }
    return out;
  });
  assert.deepEqual(res, { first: { asked: 1, nick: 'Sweetie' }, once: true, lines: { mine: true, others: true }, changed: true, back: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('friendship: neighbors remember what Sarah did with them, fade a little after weeks away (never a heart), and share something new at each heart', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, day = Clock.dayNum(), said = [];
    const say = UI.say, ask = UI.ask;
    let advice = null;
    UI.say = async (who, t) => { said.push(...[].concat(t).map(String)); };
    UI.ask = async (who, t, choices) => { if (choices.join() === ADVICE.maki.a.join()) { advice = choices; return 0; } return choices.length - 1; };
    try {
      // memories: a hug and a game, brought up once, a few days on
      const kai = NPCs.get('kai'), rk = rel('kai');
      rk.met = true; rk.pts = HEARTS[1]; rk.hugDay = -1; rk.playDay = -1;
      await hugFlow(kai);
      await igFriend(kai, 'derby');
      out.kept = rk.mem.map(m => m.k).join();
      for (const m of rk.mem) m.day = day - 2;
      const a = memoryLine('kai'), b = memoryLine('kai'), c = memoryLine('kai');
      out.mem = { game: /fishing derby the other day/.test(a), hug: /hug/i.test(b) && /the other day/.test(b), once: c === null };
      for (const m of rk.mem) { m.said = 0; m.day = day - 6; }
      let heard = false;
      for (let i = 0; i < 12 && !heard; i++) { rk.talkDay = -1; said.length = 0; await neighborTalk(kai); heard = said.some(l => /last week/.test(l)); }
      out.mem.talk = heard;
      // fading: three weeks away and more, a point every other day, never below the hearts they have
      const rc = rel('cuke'), rs = rel('sully');
      rc.met = true; rc.pts = 30; rc.talkDay = day - 30;
      rs.met = true; rs.pts = HEARTS[3] + 8; rs.talkDay = day - 41;
      friendshipTick(); friendshipTick();
      out.fade = { cuke: rc.pts, sully: rs.pts === HEARTS[3], hearts: hearts('sully') === 3, missed: !!rc.missed };
      said.length = 0;
      await neighborTalk(NPCs.get('cuke'));
      out.fade.welcome = MISSED_LINES.some(l => said.some(s => s.includes(l.slice(8, 20)))) && !rc.missed;
      // milestones, one a day: personal, advice, a gift for her house, best friends
      const maki = NPCs.get('maki'), rm = rel('maki');
      rm.met = true; rm.pts = HEARTS[5]; rm.nickAsked = true; rm.photo = true; rm.talkDay = -1;
      const steps = [];
      for (let d = 0; d < 5; d++) {
        said.length = 0;
        const mail = S.mail.length;
        rm.talkDay = -1; await neighborTalk(maki);
        rm.talkDay = -1; await neighborTalk(maki);
        const has = l => said.some(x => x.includes(l.slice(0, 24)));
        steps.push({ fav: has(FAV_SPOT.maki[2]), advice: rm.advice === 0 && has(ADVICE.maki.r[0]),
          gift: S.mail.length > mail && S.mail[S.mail.length - 1].gift === 'bonsai', bff: !!rm.bff && said.some(l => l.includes('best friend')) });
        rm.msDay = -1;
      }
      out.steps = steps.map(s => Object.keys(s).filter(k => s[k]).join() || '-');
      out.joe = nextMilestone('joe') === null && nextMilestone('maki') === null;
      // (her favorite spot, once she's told: most of Maki's hang-out invitations go there)
      out.hang = Invites.hangSpots('maki').filter(s => s === 'bench_pond').length >= 3;
      // (two files once declared the same function and the later one won: these are each file's own)
      out.names = [placeName('maki', 'bench_pond'), landmarkName('pond', 'Pond'), hexRgb('#ff8000').join()];
    } finally { UI.say = say; UI.ask = ask; }
    return out;
  });
  assert.deepEqual(res, { kept: 'hug,game', mem: { game: true, hug: true, once: true, talk: true },
    fade: { cuke: 26, sully: true, hearts: true, missed: true, welcome: true },
    steps: ['fav', 'advice', 'gift', 'bff', '-'], joe: true, hang: true,
    names: ['on the bench by the pond', 'Pond', '255,128,0'] });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("the neighbors' own friendships: storylines move them, chats and time mend them, close friends chat more, and they say so", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const out = {};
    out.start = [bond('maki', 'kai'), bond('kai', 'maki'), bond('maki', 'chili')];
    // a storyline: falling out over a mix-up, then cleared up
    for (const id of DRAMA_FOOD) rel(id).met = true;
    const d = Drama.begin(mulberry(5), { tpl: 'mixup', cast: { A: 'maki', B: 'kai' } });
    out.fell = bond('maki', 'kai');
    Drama.setState(d, 'clear');
    out.cleared = bond('maki', 'kai');
    Drama.finish(d);
    // a chat: a little closer, once a day, only so far by chatting
    const A = NPCs.get('cuke'), B = NPCs.get('mac');
    const chat = () => { const c = { a: A, b: B, lines: ['a', 'b'], i: 1, t: 0 }; Chats.list.push(c); A.chat = B.chat = c; Chats.end(c); };
    chat(); chat();
    out.chat = bond('cuke', 'mac');
    S.bondDay = {}; bondAdd('cuke', 'mac', 10); chat();
    out.capped = bond('cuke', 'mac');
    // fallen out: no chatting, and it mends every third day
    bondAdd('chili', 'coco', -4);
    out.ok = [Chats.ok(NPCs.get('chili'), NPCs.get('coco')), Chats.ok(A, B)];
    const day = Clock.dayNum(), real = Clock.dayNum;
    try { Clock.dayNum = () => day + (3 - day % 3); bondTick(); } finally { Clock.dayNum = real; }
    out.mend = bond('chili', 'coco');
    // what they say
    out.best = bestFriendOf('cuke') === 'mac' && /Mac/.test(bondLine(NPCs.get('cuke')));
    out.spat = fellOutWith('chili') === 'coco' && /Coco/.test(bondLine(NPCs.get('chili')));
    out.topic = EXTRA_TOPICS.some(t => t[0] === 'bond');
    return out;
  });
  assert.deepEqual(res, { start: [4, 4, 0], fell: 2, cleared: 5, chat: 2.5, capped: 10, ok: [false, true], mend: -3, best: true, spat: true, topic: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('your own songs: the game finds the beat of a song from the device, writes a dance for it at each level, keeps it, and it plays', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // a 24-second song at 120 beats a minute: a low thump on each beat, a higher click between, the first beat at 0.3 s
    const sr = 22050, secs = 24, buf = new AudioBuffer({ length: sr * secs, sampleRate: sr, numberOfChannels: 2 });
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let k = 0; 0.3 + k * 0.25 < secs - 0.2; k++) {
        const s0 = Math.round((0.3 + k * 0.25) * sr), beat = k % 2 === 0, f = beat ? (k % 4 ? 0.07 : 0.05) : 0.6;
        for (let i = 0; i < 1500; i++) d[s0 + i] += Math.sin(i * f) * Math.exp(-i / (beat ? 400 : 120)) * (beat ? 0.8 : 0.25);
      }
    }
    const out = {};
    const charts = MYSONG_LEVELS.map(l => songChart(buf, l));
    out.bpm = charts.map(c => Math.round(c.bpm));
    const off = c => Math.max(...c.chart.map(s => { const x = (s.t - 0.3) / 0.25; return Math.abs(x - Math.round(x)) * 0.25; }));
    out.onBeat = charts.every(c => off(c) < 0.035);
    out.easyOnBeats = charts[0].chart.every(s => Math.round((s.t - 0.3) / 0.25) % 2 === 0);
    out.more = charts[0].chart.length < charts[1].chart.length && charts[1].chart.length <= charts[2].chart.length;
    out.lanes = charts.every(c => c.chart.every(s => s.lane >= 0 && s.lane <= 3) && new Set(c.chart.map(s => s.lane)).size >= 3);
    out.pack = JSON.stringify(unpackSteps(packSteps(charts[1].chart))) === JSON.stringify(charts[1].chart);
    // the file as a WAV, kept: the dance with the island, the file on the device
    const pcm = buf.getChannelData(0), wav = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const str = (o, t) => { for (let i = 0; i < t.length; i++) wav.setUint8(o + i, t.charCodeAt(i)); };
    str(0, 'RIFF'); wav.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true);
    wav.setUint32(24, sr, true); wav.setUint32(28, sr * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); str(36, 'data'); wav.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767, true);
    const s = await MySongs.add(wav.buffer, 'Click Track', 'Easy');
    out.kept = { list: S.mysongs.length, name: songDef('my:' + s.id).name, level: s.level, file: ((await MySongs.get(s.id)) || {}).byteLength === wav.buffer.byteLength };
    out.relevel = (await MySongs.relevel(s, 'Hard')) && s.level === 'Hard' && unpackSteps(s.steps).length > charts[0].chart.length;
    // it plays in the dance game
    MySongs.dance(s, { watch: true });
    await new Promise(r => setTimeout(r, 1500));
    out.plays = Dance.on && Dance.notes.length === unpackSteps(s.steps).length && /Click Track/.test(document.querySelector('#dsong').textContent);
    Dance.quit();
    await new Promise(r => setTimeout(r, 300));
    out.stopped = !Dance.on && !Music.song;
    MySongs.remove(s);
    await new Promise(r => setTimeout(r, 200));
    out.removed = !S.mysongs.length && !(await MySongs.get(s.id));
    return out;
  });
  assert.deepEqual(res, { bpm: [120, 120, 120], onBeat: true, easyOnBeats: true, more: true, lanes: true, pack: true,
    kept: { list: 1, name: 'Click Track', level: 'Easy', file: true }, relevel: true, plays: true, stopped: true, removed: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("more holidays to do: New Year's Eve on the square with a countdown, red envelopes, valentines", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // everyone who's up gathers on the square, staying up for it; Cuke (early to bed) sleeps through it
    const nye = Math.round(Date.UTC(2026, 11, 31) / 86400e3), kp = makePlan('kai', nye), seg = kp.segs.find((x) => x.spot === 'party:plaza');
    out.plan = !!seg && seg.a <= 23.3 && seg.b >= 24.5 && kp.bed > seg.b && !makePlan('cuke', nye).segs.some((x) => x.spot === 'party:plaza') && !makePlan('kai', nye + 1).segs.some((x) => x.late);
    // the countdown, then midnight
    const say = UI.say, ask = UI.ask, real = Clock.island;
    UI.say = async () => {}; UI.ask = async (w, t, c) => c.length - 1;
    try {
      const sq = W0.spots.plaza;
      __dbg.teleport('island', sq.x, sq.y + 3);
      let now = new Date(2026, 11, 31, 23, 59, 55);
      Clock.island = () => new Date(now.getTime());
      G.events = new Set(['nye']);
      const n = NPCs.get('maki'), r = rel('maki');
      r.met = true;
      Object.assign(n, { area: 'island', x: G.player.x + 24, y: G.player.y, sleeping: false, script: false, path: null, chat: null, idle: null });
      n.want = { area: 'island', x: n.x, y: n.y, party: true };
      const pts = r.pts;
      NewYear.done = null; NewYear.tick();
      await wait(300);
      out.count = document.querySelector('.nye-count').textContent;
      now = new Date(2027, 0, 1, 0, 0, 1);
      n.want = { area: 'island', x: n.x, y: n.y, party: true };
      await wait(400);
      out.midnight = { text: document.querySelector('.nye-count').textContent, pts: r.pts - pts, flag: !!S.flags.nye2027, mem: (r.mem || []).some((m) => m.k === 'newyear') };
      Clock.island = real;
      // Lunar New Year: a red envelope from each, once
      G.events = new Set(['lunar']);
      const m0 = S.money;
      await lunarHello(NPCs.get('kai'), true); await lunarHello(NPCs.get('kai'), true);
      out.lunar = S.money - m0;
      // Valentine's Day: a card for a neighbor, truffles back from a good friend
      G.events = new Set(['valentine']);
      const c = NPCs.get('cece'), rc = rel('cece');
      rc.met = true; rc.pts = HEARTS[3];
      const opt = valentineOptions(c), had = pocketCount('truffles');
      if (opt.length) await opt[0].fn();
      out.val = { offered: opt.length === 1, pts: rc.pts - HEARTS[3], truffles: pocketCount('truffles') - had, once: valentineOptions(c).length === 0 };
    } finally { UI.say = say; UI.ask = ask; Clock.island = real; G.events = todayEvents(); }
    return out;
  });
  assert.deepEqual(res, { plan: true, count: '5', midnight: { text: 'Happy New Year!', pts: 3, flag: true, mem: true }, lunar: 88, val: { offered: true, pts: 4, truffles: 1, once: true } });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('karaoke: a different request each night from the poems Sarah has, first on the list and on the board, and the crowd tips extra', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {};
    S.poems = ['The Frog', 'Duck', 'Cheese', 'Kite', 'Owl'];
    const day = Clock.dayNum(), req = karaokeRequest();
    const names = new Set(); for (let d = 0; d < 14; d++) names.add(karaokeRequest(day + d)[0]);
    out.req = { have: karaokePoems().includes(req), same: karaokeRequest(day) === req, varies: names.size >= 3, board: boardTodayLines().some((l) => l.includes(`"${req[0]}"`)) };
    const say = UI.say; UI.say = async () => {};
    try {
      const money = S.money;
      Object.assign(Karaoke, { poem: req, totF: 100, hitF: 80, dTot: 0, dHit: 0, duet: null });
      G.busy++;
      await Karaoke.results();
      const first = S.money - money;
      G.busy++;
      await Karaoke.results();
      out.tips = { first: first >= 350, again: S.money - money === first };
    } finally { UI.say = say; }
    out.poems = JOE_POEMS.length >= 60;
    return out;
  });
  assert.deepEqual(res, { req: { have: true, same: true, varies: true, board: true }, tips: { first: true, again: true }, poems: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('graphics settings: picture quality and draw distance, Auto by default, kept per device', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const out = { auto: GFX.pick('q') === 'auto' && GFX.pick('f') === 'auto' && GFX.quality() === null && GFX.far() === 1 };
    GFX.set('q', 'low'); GFX.set('f', 'far');
    out.picked = { q: GFX.quality(), f: GFX.far(), kept: localStorage.getItem('sc-quality') === 'low' && localStorage.getItem('sc-far') === 'far' };
    const box = gfxSetting();
    out.chips = box.querySelectorAll('button.chip').length;
    out.on = [...box.querySelectorAll('button.chip.on')].map((b) => b.textContent);
    GFX.set('q', 'auto'); GFX.set('f', 'auto');
    out.back = GFX.quality() === null && GFX.far() === 1;
    return out;
  });
  assert.deepEqual(res, { auto: true, picked: { q: 0.55, f: 1.35, kept: true }, chips: 8, on: ['Low', 'Far'], back: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('holiday decorations fit the day: Spooky Season, the Winter Lights and Holiday, snowmen all winter, Valentine\'s', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const a = G.areas.island, out = {};
    const day = (m, d) => { __dbg.setTime(m, d, 12); dailyCheck(true); decorateIsland(a); };
    const deco = () => a.ents.filter((e) => e.holiday);
    const n = (f) => deco().filter(f).length;
    const looks = JSON.stringify(S.exteriors || {});
    day(10, 28);
    out.spooky = { jacks: n((e) => /^jack_o_lantern/.test(e.model3d || '')) >= 20, stacks: n((e) => e.model3d === 'jack_stack'), bunting: n((e) => e.model3d === 'bunting_spooky') > 0, snow: n((e) => e.model3d === 'snowman') };
    day(12, 5);
    const snow = deco().filter((e) => e.model3d === 'snowman');
    out.early = { snowmen: snow.length >= 2 && snow.every((e) => e.solidTile && a.blockedAt(...e.solidTile)), lights: n((e) => e.grand), wreath: !!shownLook('h_coco').wreath };
    day(12, 15);
    out.lights = { tree: n((e) => e.grand === 'grand_lights'), presents: n((e) => e.grand === 'grand_presents'), lanterns: n((e) => e.frame === 'f_red_lantern' && e.solidTile) >= 10, bunting: n((e) => e.model3d === 'bunting_winter') > 0, wreath: !!shownLook('h_coco').wreath };
    const shopLanterns = n((e) => e.frame === 'f_red_lantern' && e.solidTile);
    day(12, 24);
    out.holiday = { presents: n((e) => e.grand === 'grand_presents'), more: n((e) => e.frame === 'f_red_lantern' && e.solidTile) > shopLanterns };
    out.saved = JSON.stringify(S.exteriors || {}) === looks && !houseLook('h_coco').wreath;
    day(2, 14);
    out.valentine = n((e) => e.model3d === 'bunting_hearts') > 0 && n((e) => e.frame === 'f_heart_lamp') >= 5;
    day(9, 22);
    out.harvest = { stacks: n((e) => e.model3d === 'harvest_stack'), bunting: n((e) => e.model3d === 'bunting_harvest') > 0 };
    day(7, 4);
    out.july = n((e) => e.model3d === 'bunting_july' && e.frame === 'bunting') > 0;
    const tiles = snow.map((e) => e.solidTile);
    day(6, 12);
    out.summer = { left: deco().length, unblocked: tiles.every(([x, y]) => !a.blockedAt(x, y)), wreath: !!shownLook('h_coco').wreath };
    return out;
  });
  assert.deepEqual(res, {
    spooky: { jacks: true, stacks: 4, bunting: true, snow: 0 },
    early: { snowmen: true, lights: 0, wreath: false },
    lights: { tree: 1, presents: 0, lanterns: true, bunting: true, wreath: true },
    holiday: { presents: 1, more: true },
    saved: true,
    valentine: true,
    harvest: { stacks: 4, bunting: true },
    july: true,
    summer: { left: 0, unblocked: true, wreath: false },
  });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('HD-2D: the island and rooms draw in 3D, taps land where they point, and the edit modes and the classic view still work', async () => {
  const { chromium: chromium3d } = await import('playwright');
  const b3 = await chromium3d.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const ctx = await b3.newContext({ viewport: { width: 800, height: 500 } });
    await ctx.addInitScript(() => { window.__DEBUG = true; localStorage.setItem('sc-who', 'sarah'); localStorage.setItem('sc-current', ''); });
    const page = await ctx.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    await page.goto(srv.url + '/');
    await page.fill('#password', 'pw');
    await page.click('button[type=submit]');
    await title(page);
    await page.evaluate(() => __dbg.quickStart());
    await page.waitForFunction(() => G.mode === 'play', null, { timeout: 60000 });
    await page.waitForFunction(() => R3.ok && R3.active() && R3.cards.size > 5, null, { timeout: 60000 });
    const island = await page.evaluate(() => {
      const want = [G.player.x + 40, G.player.y + 24];
      const q = R3.project(want[0], want[1], 0);
      const back = R3.unproject(q.x, q.y);
      return { shown: getComputedStyle(document.getElementById('game3d')).display, err: Math.hypot(back[0] - want[0], back[1] - want[1]), glass: document.body.classList.contains('hd2d') };
    });
    assert.equal(island.shown, 'block');
    assert.ok(island.glass, 'the HUD and dialogue wear the HD-2D look');
    // big pictures are drawn by the worker (off the main thread), and arrive
    await page.waitForFunction(() => HDW.w && HDW.n > 5 && HDW.pend.size === 0, null, { timeout: 60000 });
    assert.equal(await page.evaluate(() => HDW.failed), false, 'the HD worker kept going');
    // on a computer the water reflects (phones skip it: this small window counts as one); by night the houses' windows
    // are lit; the ponds have lily pads
    await page.waitForFunction(() => R3.phone || R3.quality < 1 || R3U.uRefl.value === 1, null, { timeout: 20000 });
    await page.evaluate(() => { __dbg.setTime(10, 24, 21.5); __dbg.at('pond'); });
    await page.waitForFunction(() => [...R3.cards.values()].some(c => c.glow && c.glow.emissiveIntensity > 0.3), null, { timeout: 30000 });
    await page.waitForFunction(() => R3.lilies && R3.lilies.mesh.count > 0, null, { timeout: 30000 });
    // rain is drawn sharp on a canvas of its own at the screen's resolution
    await page.evaluate(() => { G.weather = 'rain'; });
    await page.waitForFunction(() => Weather.kind === 'rain' && R3.wxOn && getComputedStyle(R3.wx).display === 'block', null, { timeout: 20000 });
    await page.evaluate(() => { __dbg.setTime(10, 24, 10.4); __dbg.at('home'); });
    assert.ok(island.err < 1, `a tap lands where it points (off by ${island.err})`);
    // people, neighbors and props have HD art: every outfit, frame, hair style and accessory draws, and Sarah's card has
    // three pixels to one (any error drawing them shows up in problems)
    const hd = await page.evaluate(() => {
      let made = 0, want = 0;
      const tryOne = f => { want++; if (f && f.c && f.c.width) made++; };
      for (const o of Object.keys(GD.sarahTpl.hair.outfits)) for (const f of Object.keys(HD_FRAMES)) tryOne(hdPersonFrame({ look: look(), clothes: hdOutfit(o), eyes: 'glasses', acc: 'sunhat' }, f));
      for (const h of Object.keys(HD_HAIR)) for (const f of ['down_stand', 'side_walkA', 'up_stand']) tryOne(hdPersonFrame({ look: Object.assign(look(), { hair: h }), clothes: hdOutfit('crimson'), eyes: null, acc: null }, f));
      for (const a of Object.keys(HD_ACC)) for (const f of ['down_stand', 'side_stand', 'up_stand']) tryOne(hdPersonFrame({ look: look(), clothes: hdOutfit('hoodie'), eyes: null, acc: a }, f));
      for (const w of Object.keys(HD_FOLKS)) tryOne(hdPersonFrame(hdFolkSpec(w), 'down_walkA'));
      // eight directions (the 3/4 views), the walk and run cycles and standing, with a hat and glasses
      for (const d of ['down', 'dside', 'side', 'uside', 'up']) for (const [an, n] of Object.entries(HD_ANIM)) for (let i = 0; i < n; i++) tryOne(hdPersonFrame({ look: look(), clothes: hdOutfit('sundress'), eyes: 'sunglasses', acc: 'wizardhat' }, `${d}:${an}:${i}:${i % 3 - 1}`));
      for (const id of Object.keys(HD_NPC)) tryOne(hdNpcFrame(id, 0, null, false, 1));
      for (const id of Object.keys(HD_NPC)) { tryOne(hdNpcFrame(id, 0)); tryOne(hdNpcFrame(id, 1, 'crown', true)); }
      for (const n of Object.keys(HD_SPR)) tryOne(hdNamed(n, true));          // (now: not waiting for drawing time)
      // Sarah as a visitor sees her (her look comes over the network: odd values fall back to defaults)
      tryOne(hdPersonFrame(hdRemoteSarah({ outfit: 'crimson', hd: hdSarahSpec() }), 'side_walkB'));
      tryOne(hdPersonFrame(hdRemoteSarah({ outfit: 7, hd: { look: { hair: '<b>', skin: 'red', hairCol: [1] }, clothes: { style: 'x y', top: '#zzzzzz', print: [{}, 3] }, acc: {} } }), 'down_stand'));
      return { made, want, npcs: Object.keys(HD_NPC).length, sarah: [...HD_CACHE.keys()].some(k => k.startsWith('p|')), card: R3.pool.p && R3.pool.p[0].cv.width };
    });
    assert.equal(hd.made, hd.want, 'every HD frame draws');
    assert.ok(hd.npcs >= 20, `the neighbors have HD art (${hd.npcs})`);
    assert.ok(hd.sarah, 'Sarah is drawn with the HD art');
    assert.equal(hd.card, 144, "a person's card has three pixels to one");
    await page.evaluate(() => enterRoom('arcade'));
    await page.waitForFunction(() => (G.area.id === 'arcade' && R3.areaId === 'arcade' && R3.wall) || R3.failed, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => R3.failed), false, 'HD-2D kept going into a room');
    await page.evaluate(() => leaveInterior());
    await page.waitForFunction(() => (G.area.id === 'island' && R3.areaId === 'island') || R3.failed, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => R3.failed), false, 'and back out onto the island');
    // decorating at home uses the flat view with its grid
    await page.evaluate(async () => { await goHome(); });
    await page.waitForFunction(() => G.area.id === 'home', null, { timeout: 30000 });
    await page.evaluate(() => { Decor.on = true; });
    await page.waitForFunction(() => !R3.active() && getComputedStyle(document.getElementById('game3d')).display === 'none' && !document.body.classList.contains('hd2d'), null, { timeout: 10000 });
    await page.evaluate(() => { Decor.on = false; R3.setWant(false); });
    await page.waitForFunction(() => !R3.active() && localStorage.getItem('sc_gfx') === 'classic', null, { timeout: 10000 });
    assert.deepEqual(problems, []);
  } finally { await b3.close(); }
});

test('hold to walk: keeping a finger (or the mouse) down keeps Sarah walking towards it, and letting go stops her', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.waitForTimeout(500);
  const start = await page.evaluate(() => [G.player.x, G.player.y]);
  const pt = await page.evaluate(() => { const c = document.getElementById('game').getBoundingClientRect(); return [c.left + (G.player.x + 50 - G.cam.x) / G.view.w * c.width, c.top + (G.player.y - G.cam.y) / G.view.h * c.height]; });
  await page.mouse.move(pt[0], pt[1]);
  await page.mouse.down();
  await page.mouse.move(pt[0] + 420, pt[1], { steps: 6 });
  await page.waitForTimeout(1800);
  const held = await page.evaluate(() => [G.player.x, !!(G.hold && G.hold.steer)]);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => G.player.x);
  await page.waitForTimeout(500);
  const later = await page.evaluate(() => G.player.x);
  assert.ok(held[1], 'holding steers');
  assert.ok(held[0] - start[0] > 80, `walked ${held[0] - start[0]}px while held`);
  assert.ok(Math.abs(later - after) < 3, 'stops when let go');
  assert.deepEqual(page.problems, []);
  await page.context().close();
});
