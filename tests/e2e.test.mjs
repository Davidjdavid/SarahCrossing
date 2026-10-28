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
  // (no random "want to play?" in the middle of a talk a test is checking)
  if (debug) await ctx.addInitScript(() => { window.__DEBUG = true; window.__noAsk = true; });
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
  assert.deepEqual(await page.$$eval('.whobtn b', (bs) => bs.map((b) => b.textContent)), ['Sarah', 'David', 'James', 'John', 'Elizabeth', 'Joe']);
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
  assert.equal(await sarah.evaluate(() => NPCs.get('david')), undefined);          // (the family are only here online, never as neighbors)
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
  // Residents: a good friend's favorite places, picked at the Town Hall, fill more of their free time
  const spots = await page.evaluate(() => {
    const id = 'maki', count = () => { let n = 0; for (let d = 1; d <= 20; d++) n += makePlan(id, Clock.dayNum() + d).segs.filter((s) => s.spot === 'harbor' || s.spot === 'orchard').length; return n; };
    rel(id).met = true; rel(id).pts = HEARTS[3];
    const before = count();
    CIVIC_LIVE.residents.pick = id; civicScreen('residents');
    for (const name of ['The harbor', 'The orchard']) [...document.querySelectorAll('#panel .chip')].find((c) => c.textContent === name).click();
    // and what they like doing: reading more often, then never
    const book = () => [...document.querySelectorAll('#panel .chip')].find((c) => c.textContent.startsWith('Reading:'));
    book().click();
    const more = Design.likeWeight(id, 'book', 1) === 3 && book().textContent === 'Reading: more often';
    book().click();
    const never = Design.likeWeight(id, 'book', 1) === 0 && Design.likeChance(id, 'bench', 0.6) === 0.6;
    return { kept: (S.town.sched.maki.spots || []).join(), more: count() > before * 1.5 + 2, likes: more && never };
  });
  assert.deepEqual(spots, { kept: 'harbor,orchard', more: true, likes: true });
  // and the Town Hall itself opens, with the Council at the desk
  await page.evaluate(() => { __dbg.setTime(10, 27, 11); enterRoom('townhall'); });
  await page.waitForFunction(() => G.area && G.area.id === 'townhall');
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("shops grow: Fortune puts the order in a week on, a day closed, then a bigger shop with more stock, a sale and a free gift", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 11));
  const res = await page.evaluate(async () => {
    const out = { before: [shopLevel('shop'), shopStock().furn.length] };
    S.shops.shop.since = Clock.dayNum() - 6;
    shopsTick();
    out.early = !!S.shops.shop.offer || S.shops.shop.reno != null;      // not a week yet: nothing happens
    S.shops.shop.since = Clock.dayNum() - 7;
    shopsTick();
    // a week on: no letter, Fortune brings it up next time they talk (the order's in: closed tomorrow)
    out.offer = S.shops.shop.offer === true && S.shops.shop.reno == null && !S.mail.some((m) => m.from === 'fortune' && /closed tomorrow/i.test(m.subject));
    const say = UI.say, said = [];
    UI.say = async (who, t) => { said.push(who + ': ' + [].concat(t).join(' ')); };
    try { await shopOrderTalk(); await shopOrderTalk(); } finally { UI.say = say; }
    out.order = said.length === 1 && /fortune: .*order/.test(said[0]) && S.shops.shop.reno === Clock.dayNum() + 1;
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
  assert.deepEqual(res, { before: [1, 5], early: false, offer: true, order: true, closed: true, after: [2, 7, "Fortune's Goods & More", '7 AM to 11 PM'], gift: [0, true], sale: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the watering can: Fortune sells one; flowers of a kind side by side, both watered, grow a new one by morning (two colors make the third, now and then a hybrid)', async () => {
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
    const A = { x, y, kind: 'daisy', ci: 0, day: day - 3, pickDay: -1 }, B = { x: x + 1, y, kind: 'daisy', ci: 2, day: day - 3, pickDay: -1 };
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
    // hybrids (2ab_hybrids.js): colors 0 and 1 make the first now and then, 1 and 2 the second, 0 and 2 never; two of a
    // hybrid make it again; each has its own item, repainted picture, HD picture and color in the new look
    const lo = () => 0.1, hi = () => 0.9;
    out.breed = [breedColor(0, 1, lo), breedColor(0, 1, hi), breedColor(1, 2, lo), breedColor(0, 2, lo), breedColor(4, 4, lo), breedColor(3, 0, hi), breedColor(3, 0, lo)];
    const pic = Assets.dyn.fl_lily_4, px0 = pic && pic.c.getContext('2d').getImageData(0, 0, pic.w, pic.h).data;
    let dark = 0; for (let k = 0; px0 && k < px0.length; k += 4) if (px0[k] === 0x4e && px0[k + 1] === 0x2a && px0[k + 2] === 0x4c) dark++;
    out.hybrid = { name: itemName('flower_lily_4'), dear: ITEMS.flower_tulip_3.price > ITEMS.flower_tulip_0.price, pic: dark > 10, hd: !!hdNamed('fl_lily_4', true), petals: EnvItems.petals('flower_daisy_3') };
    // roses (2aa_roses.js): a fifth kind from Fortune's seeds, its pictures drawn at load, a pink and a blue rose to breed
    out.rose = { seeds: GD.flowerKinds.includes('rose') && ITEMS.seed_fl_rose.grows === 'flower_rose_*', names: [0, 1, 2, 3, 4].map(i => itemName('flower_rose_' + i)),
      pics: ['fl_rose_0', 'fl_rose_4', 'seed_fl_rose'].every(n => Assets.has(n)), hd: !!hdNamed('fl_rose_3', true), petals: EnvItems.petals('flower_rose_4') };
    return out;
  });
  assert.deepEqual(res, { stock: true, busy: true, wet: [true, true], kid: ['daisy', 1, true, true], breed: [3, 2, 4, 1, 4, 0, 3],
    hybrid: { name: 'Black lily', dear: true, pic: true, hd: true, petals: '#8cbcff' },
    rose: { seeds: true, names: ['Red rose', 'White rose', 'Yellow rose', 'Pink rose', 'Blue rose'], pics: true, hd: true, petals: '#7a9cff' } });
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
  const shown = await page.$$eval('#panel .store-list .card .nm', (bs) => bs.map((b) => b.textContent));
  for (const n of names.yes) assert.ok(shown.includes(n), `${n} can be ordered again`);
  for (const n of names.no) assert.ok(!shown.includes(n), `${n} is not for sale`);
  assert.ok(await page.locator('#panel h3', { hasText: 'Fish' }).count());
  // (a tap picks it and shows it big; Order buys it)
  await page.locator('#panel .store-list .card', { has: page.locator('.nm', { hasText: new RegExp(`^${names.tuna}$`) }) }).click();
  assert.equal(await page.evaluate(() => S.money), 10000);
  await page.locator('#panel .store-pick .btn', { hasText: 'Order' }).click();
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
    // (a bench or the telescope close by is tried first: off it again each time, to see what else they'd do)
    const unsit = () => { if (n.benchIdle) idleBenchEnd(n); n.path = null; n.idle = null; };
    const kinds = (h) => { __dbg.setTime(6, 12, h); G.weather = 'sunny'; free(n, 116, 110); const k = new Set(); for (let i = 0; i < 200; i++) { unsit(); idleStart(n); if (n.idle) k.add(n.idle.kind); } unsit(); return k; };
    free(n, 116, 110);
    const night = kinds(22), noon = kinds(12);
    out.night = night.has('stars') && !night.has('snack');
    out.noon = !noon.has('stars') && noon.has('snack') && !noon.has('fish') && [...noon].every((k) => IDLE_ACTS[k]);
    // by the water a line goes in too (facing the water)
    const a = G.areas.island; let edge = null;
    for (let y = 40; y < 150 && !edge; y++) for (let x = 20; x < 200 && !edge; x++) if (!a.blockedAt(x, y) && !a.waterAt(x, y) && a.waterAt(x, y + 1) && !pathAt(x, y)) edge = [x, y];
    __dbg.setTime(6, 12, 12); G.weather = 'sunny'; free(n, edge[0] + 0.5, edge[1] + 0.6);
    let fish = false;
    for (let i = 0; i < 200 && !fish; i++) { unsit(); idleStart(n); fish = !!n.idle && n.idle.kind === 'fish'; }
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
    for (let i = 0; i < 60 && !n.idle; i++) { unsit(); idleStart(n); }
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
      // looked into, a case shows what's in it big, with its card
      await cases.find((e) => e.look3d.showcase === 'oldmap').interact();
      out.history.big = !!document.querySelector('#panel .showcase canvas') && /Captain Gouda/.test(document.querySelector('#panel').textContent);
      UI.close();
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
  assert.deepEqual(res.history, { cases: 6, map: true, waiting: 5, big: true });
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
    // (the hour first, then the day: run between midnight and 5 AM, the game's day is still yesterday's)
    const go = (dn, h) => { Clock.offsetMs += (h - Clock.hourF()) * 3600e3; Clock.offsetMs += (dn - Clock.dayNum()) * 864e5; G.events = todayEvents(); Plans.reset(); };
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
      // memories: a favor and a game, brought up once, a few days on
      const kai = NPCs.get('kai'), rk = rel('kai');
      rk.met = true; rk.pts = HEARTS[1]; rk.playDay = -1;
      remember('kai', 'favor');
      await igFriend(kai, 'derby');
      out.kept = rk.mem.map(m => m.k).join();
      for (const m of rk.mem) m.day = day - 2;
      const a = memoryLine('kai'), b = memoryLine('kai'), c = memoryLine('kai');
      out.mem = { game: /fishing derby the other day/.test(a), favor: /helping me out|came through/.test(b) && /the other day/.test(b), once: c === null };
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
  assert.deepEqual(res, { kept: 'favor,game', mem: { game: true, favor: true, once: true, talk: true },
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
    // close friends have chats of their own; two who've just made up say so for a few days
    S.bonds[bondKey('basil', 'chili')] = BOND_OUT;
    try { Clock.dayNum = () => day + (3 - day % 3); bondTick(); } finally { Clock.dayNum = real; }
    const has = (a, b, L) => bondChats(NPCs.get(a), NPCs.get(b)).some(([l]) => L.includes(l));
    out.chats = { close: has('cuke', 'mac', CHAT_CLOSE), mended: has('basil', 'chili', CHAT_MENDED), strangers: bondChats(NPCs.get('maki'), NPCs.get('chili')).length === 0,
      picked: Chats.pick(NPCs.get('basil'), NPCs.get('chili')) && true };
    try { Clock.dayNum = () => day + (3 - day % 3) + 6; bondTick(); } finally { Clock.dayNum = real; }
    out.chats.over = !has('basil', 'chili', CHAT_MENDED);
    return out;
  });
  assert.deepEqual(res, { start: [4, 4, 0], fell: 2, cleared: 5, chat: 2.5, capped: 10, ok: [false, true], mend: -3, best: true, spat: true, topic: true,
    chats: { close: true, mended: true, strangers: true, picked: true, over: true } });
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
    // a dozen songs (the most: no "Add a song" then): the list starts on the screen and scrolls (a long list of choices
    // never runs off the top)
    S.mysongs = Array.from({ length: 12 }, (_, i) => ({ id: 'x' + i, name: 'Song ' + (i + 1), level: 'Easy', bpm: 120, beat: 0.5, dur: 60, steps: { t: [], l: '' } }));
    mySongsMenu();
    for (let i = 0; i < 100 && document.querySelectorAll('#choices .choice').length < 13; i++) await new Promise(r => setTimeout(r, 50));
    const ch = document.querySelector('#choices');
    out.list = { all: ch.querySelectorAll('.choice').length, top: ch.getBoundingClientRect().top >= 0, scrolls: ch.scrollHeight > ch.clientHeight };
    ch.querySelectorAll('.choice')[12].click();
    S.mysongs = [];
    return out;
  });
  assert.deepEqual(res, { bpm: [120, 120, 120], onBeat: true, easyOnBeats: true, more: true, lanes: true, pack: true,
    kept: { list: 1, name: 'Click Track', level: 'Easy', file: true }, relevel: true, plays: true, stopped: true, removed: true, list: { all: 13, top: true, scrolls: true } });
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
      S.flags['gather' + Clock.dayNum()] = 1;          // (just the countdown here: coming by the crowd is checked below)
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
      // the Fourth of July's fireworks from the beach, Stargazing Night at the lookout: everyone's out, and coming by counts
      const j4 = Math.round(Date.UTC(2027, 6, 4) / 86400e3), sg = Math.round(Date.UTC(2027, 7, 12) / 86400e3);
      out.gather = { beach: makePlan('kai', j4).segs.some((x) => x.spot === 'party:beach' && x.late), lookout: makePlan('maki', sg).segs.some((x) => x.spot === 'party:lookout' && x.late) };
      now = new Date(2027, 6, 4, 21, 30, 0);
      const bs = W0.spots.beach;
      __dbg.teleport('island', bs.x, bs.y);
      const crowd = ['kai', 'cuke'].map((id) => NPCs.get(id)), before = crowd.map((x) => rel(x.id).pts);
      crowd.forEach((x, i) => { rel(x.id).met = true; Object.assign(x, { area: 'island', x: G.player.x + 20 + i * 14, y: G.player.y, sleeping: false, script: false, path: null }); x.want = { area: 'island', x: x.x, y: x.y, party: true }; });
      G.frame = 600; G.busy = 0; Gathering.tick();
      out.gather.joined = !!S.flags['gather' + Clock.dayNum()] && crowd.every((x, i) => rel(x.id).pts === before[i] + 1 && (rel(x.id).mem || []).some((m) => m.k === 'gather'));
      Clock.island = real;
      // Pirate Day: a map in a bottle from Kai, steps from a landmark to an X, the treasure under it
      G.events = new Set(['pirateday']);
      delete fest().pirate;
      const mails = S.mail.length;
      pirateTick();
      const st = fest().pirate, x = G.areas.island.ents.find((e) => e.pirateX), m = S.mail[S.mail.length - 1];
      __dbg.give('shovel', 1); S.held = 'shovel';
      const money = S.money, chests = pocketCount('treasure_chest');
      if (x) await x.interact();
      out.pirate = { mail: S.mail.length === mails + 1 && m.from === 'kai' && /Start at .+ Walk \d+ steps? (east|west|north|south)/.test(m.body),
        x: !!x && Math.floor(x.x / TILE) === st.spot.x, dug: !!st.dug && !G.areas.island.ents.some((e) => e.pirateX), chest: pocketCount('treasure_chest') - chests, money: S.money - money };
      pirateTick();
      out.pirate.once = S.mail.length === mails + 1 && !G.areas.island.ents.some((e) => e.pirateX);
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
  assert.deepEqual(res, { plan: true, count: '5', midnight: { text: 'Happy New Year!', pts: 3, flag: true, mem: true }, gather: { beach: true, lookout: true, joined: true },
    pirate: { mail: true, x: true, dug: true, chest: 1, money: 1000, once: true }, lunar: 88, val: { offered: true, pts: 4, truffles: 1, once: true } });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("Sarah's pottery from the wheel is turned round in the new look: its own profile, its glaze in bands, the handle", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(() => {
    const P = pottery(), prof = Object.assign({}, POT_PRESETS.Mug), h = prof.h, id = newPieceId();
    // a mug: cobalt above the middle, plain clay below
    const glaze = Array.from({ length: POT_W * h }, (_, i) => (Math.floor(i / POT_W) < h / 2 ? 'c' : '0')).join('');
    const p = { id, kind: 'mug', base: 'Mug', name: 'Test mug', h, mask: profileMask(prof), glaze, state: 'done', stars: 2, big: false, prof, day: Clock.dayNum() };
    P.pieces[id] = p; registerPiece(p);
    const fig = { id: newPieceId(), kind: 'frog', name: 'Frog', h: 10, state: 'done', glaze: null };
    P.pieces[fig.id] = fig;
    const e = { furn: true, def: FURN[id], item: { id, x: 3, y: 2, on: null } }, ef = { furn: true, def: { pottery: true, kind: 'top', w: 1, h: 1 }, item: { id: fig.id, x: 4, y: 2, on: null } };
    const was = EnvRoom.built;
    EnvRoom.built = { hosts: new Map(), potGeo: new Map() };
    const g = new THREE.Group(), o = EnvRoom.pot(g, e);
    EnvRoom.built = was;
    const body = o.children[0], box = new THREE.Box3().setFromObject(body), size = box.getSize(new THREE.Vector3());
    const col = body.geometry.attributes.color.array, cob = new THREE.Color(GLAZES.c[0]), clay = new THREE.Color(CLAY_BISQUE);
    let blue = 0, bare = 0;
    for (let v = 0; v < col.length; v += 3) { if (Math.abs(col[v] - cob.r) < 0.01 && Math.abs(col[v + 2] - cob.b) < 0.01) blue++; if (Math.abs(col[v] - clay.r) < 0.01 && Math.abs(col[v + 1] - clay.g) < 0.01) bare++; }
    const k = EnvRoom.POT_K / TILE;
    return { turned: !!o && o.children.length === 2, tall: Math.abs(size.y - h * k) < k, wide: size.x > 7 * k && size.x < 10 * k, bands: blue > 20 && bare > 20,
      placed: Math.abs(o.position.x - 3.5) < 0.01, figure: EnvRoom.potOf(ef) === null };
  });
  assert.deepEqual(res, { turned: true, tall: true, wide: true, bands: true, placed: true, figure: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("talking: no hugs (the goat is petted for its quest), Joe doesn't rate the house; a folk who ran up to a counter faces the room; plans only by text unless on beta; a flower in a vase in its color", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, menus = [], day = Clock.dayNum(), say = UI.say, ask = UI.ask;
    UI.say = async () => {};
    UI.ask = async (who, t, choices) => { menus.push(choices.slice()); const k = choices.indexOf('Pet the goat'); return k >= 0 ? k : choices.length - 1; };
    try {
      for (const id of ['kai', 'joe', 'goat']) { const r = rel(id); r.met = true; r.pts = HEARTS[3]; }
      S.house.items = S.house.items.concat([{ id: 'f_lamp', x: 1, y: 1 }, { id: 'f_lamp', x: 2, y: 1 }, { id: 'f_lamp', x: 3, y: 1 }]);
      await neighborTalk(NPCs.get('kai'));
      await joeTalk(NPCs.get('joe'));
      const fam = NPCs.list.find(n => n.def.family);
      if (fam) await familyTalk(fam);
      out.hug = menus.some(m => m.some(c => /hug/i.test(c)));
      out.house = menus.some(m => m.some(c => /think of my house/i.test(c)));
      menus.length = 0;
      await goatTalk(NPCs.get('goat'));
      out.goat = { asked: menus.some(m => m.includes('Pet the goat')), petted: rel('goat').hugDay === day, quest: (Quests.st('goat').hugDays || []).length };
      out.kindness = HOLIDAYS.find(h => h.id === 'hugday').name;
    } finally { UI.say = say; UI.ask = ask; }
    // Chili walks up to the counter (north) and stops there facing the room: the walk turns a folk too, and stopping
    // turns them back to the way they stand
    const n = NPCs.get('chili');
    n.dir = 'down'; n._hd = null; n.path = [[Math.floor(n.x / TILE), Math.floor(n.y / TILE) - 2]];
    hdMotion(n, false);
    for (let i = 0; i < 20 && n.path; i++) { stepNpc(n); G.t += 3; hdMotion(n, true); }
    out.walkUp = { dir: n.dir, face: n._hd.face };
    n.path = null; n.dir = 'down';
    for (let i = 0; i < 8; i++) { G.t += 3; hdMotion(n, false); }
    out.stopped = n._hd.face === HD_DIR4.down;
    // neighbors' hours and today's plan: shown on beta and with the debug tools, not in the game (text them instead)
    const fr = () => { appFriends(); const t = document.querySelector('#panel .list').textContent; UI.close(); return t; };
    localStorage.setItem('sc-plans', '0');
    out.live = { hours: /up \d/.test(fr()), hint: Requests.hint({ kind: 'deliver', who: 'kai', to: 'cuke' }) };
    localStorage.setItem('sc-plans', '1');
    out.beta = { hours: /up \d/.test(fr()) };
    appDayPlan('kai');
    out.beta.plan = [...document.querySelectorAll('#panel .list .row')].length >= 3;
    UI.close();
    localStorage.removeItem('sc-plans');
    // a flower on a table indoors wears its color (the vase's flower used to stand there white)
    const m = new THREE.MeshStandardMaterial({ vertexColors: true }); m.name = 'flower_tulip_top';
    out.vase = EnvModels.partMat({ material: m }, EnvItems.tint('flower_tulip_0')).color.getHexString() === new THREE.Color(EnvItems.petals('flower_tulip_0')).getHexString();
    return out;
  });
  assert.deepEqual(res, { hug: false, house: false, goat: { asked: true, petted: true, quest: 1 }, kindness: 'Kindness Day',
    walkUp: { dir: 'up', face: 6 }, stopped: true, vase: true, live: { hours: false, hint: res.live.hint }, beta: { hours: true, plan: true } });
  assert.match(res.live.hint || '', /Text them/);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("David's evening notes: shaken fruit falls, fewer lamps (saves remapped), the community garden fenced, neighbors ask to play, an item's own display", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {};
    // fruit falls out of the crown and comes to rest (from G.t, so the new look sees it too); fruit on the ground never fades
    const e = spawnDrop('peach', G.player.x + 20, G.player.y, false, TREE_FALL), t0 = G.t;
    G.t = e.fall.t0; const top = itemLift(e); G.t = e.fall.t0 + e.fall.T + 12; const rest = itemLift(e); G.t = t0;
    G.area.remove(e);
    const m = r3Patch(new THREE.MeshStandardMaterial(), { key: 'envmodel', see: true });
    out.fruit = { falls: top > 20, rests: rest === 0 && e.fall === null, solid: EnvModels.solid(m)._r3o.see === false && EnvModels.solid(m) === EnvModels.solid(m) };
    // fourteen lamps; an older save's moves and clears follow their props to the new numbers, a moved lamp that's gone goes to storage
    out.lamps = W0.props.filter(p => p.kind === 'lamp').length;
    const st = { flags: {}, storage: {}, deco: { moved: { 27: [1, 1], 50: [2, 2] }, gone: { 3: true, 30: true }, placed: [] }, cleared: { pr69: 1, wf3: 1 } };
    const f = Object.assign({}, newState()); delete f.flags.lamps9;
    st.flags = Object.assign({}, f.flags);
    migrate(Object.assign(f, st));
    out.remap = { moved: Object.keys(f.deco.moved).join(), gone: Object.keys(f.deco.gone).join(), cleared: Object.keys(f.cleared).sort().join(), lamp: f.storage.dp_lamp };
    // the community garden: a fence round it with a gate, tilled inside in the new look
    const c = W0.community, fences = W0.props.filter(p => p.kind === 'fence' && p.x >= c.x && p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h);
    out.garden = { fences: fences.reduce((a, p) => a + (p.w || 1), 0), gate: inCommunity(c.gate, c.y + c.h - 1), corner: inCommunity(c.x, c.y), bed: inCommunity(53, 45) };
    // talked to, a neighbor now and then asks to play (once a day at most), and rarely texts to
    const ask = UI.ask, say = UI.say, asked = [];
    UI.say = async () => {};
    UI.ask = async (who, t, choices) => { asked.push(choices.join('|')); return choices.length - 1; };
    try {
      __dbg.setTime(5, 12, 11);
      G.weather = 'sunny';
      const kai = NPCs.get('kai'); rel('kai').met = true; rel('kai').igAskDay = -1;
      kai.area = 'island'; kai.spotKey = 'plaza'; kai.want = null; kai.sleeping = false;
      out.ask1 = await igMaybeAsk(kai, 0);
      out.ask2 = await igMaybeAsk(kai, 0);
      out.asked = asked.filter(a => /Sure, let's play!/.test(a)).length;
      const inv = Invites.send('kai', 'play');
      out.text = !!inv && ['tag', 'hide', 'volley', 'rope', 'vs'].includes(inv.game) && /tag|hide-and-seek|volleyball|jump rope|arcade game/.test(textsOf('kai').slice(-1)[0].t);
    } finally { UI.ask = ask; UI.say = say; }
    // the collection: a found item opens its own display, its picture big (no 3D here), what it sells for, where from
    S.seen.sea_bass = S.seen.sea_bass || Clock.dayNum();
    const fid = FISHES[0].id; S.seen[fid] = Clock.dayNum();
    itemShowcase(fid, () => appCollection('fish'));
    const txt = document.querySelector('#panel').textContent;
    out.show = { pic: !!document.querySelector('#panel .showcase canvas'), sells: /Sells for/.test(txt), where: /Where from/.test(txt) && /Fished from/.test(txt), first: /First found/.test(txt) };
    UI.close();
    return out;
  });
  assert.deepEqual(res, { fruit: { falls: true, rests: true, solid: true }, lamps: 14,
    remap: { moved: '37', gone: '3', cleared: 'pr51,wf3', lamp: 1 },
    garden: { fences: 9 + 3 * 2 + 8, gate: true, corner: false, bed: true },
    ask1: false, ask2: false, asked: 1, text: true,
    show: { pic: true, sells: true, where: true, first: true } });
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
    assert.ok(island.glass, 'the body is marked while the 3D view shows');
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

test("David's music: uploaded from the Music app's way, each hour a game at random (the same all hour), set by hand, streamed from the server", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    // half a second of quiet as a WAV file
    const n = 4000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    const file = (rel) => { const f = new File([buf], rel.split('/').pop(), { type: 'audio/wav' }); Object.defineProperty(f, 'webkitRelativePath', { value: 'Music/' + rel }); return f; };
    const out = {};
    // a picked folder with a folder for each game keeps each game's folder
    out.paths = musicUploadPaths([file('Game One/05 - 5 PM.wav'), file('Game Two/Shop.wav')]).join();
    await MusicUpload.start([file('Game One/05 - 5 PM.wav'), file('Game One/06 - 5 PM (Rainy).wav'), file('Game Two/5 PM.wav'), file('Game Two/Shop.wav'), file('Game Two/notes.txt')]);
    out.games = MusicLib.games().join();
    out.tracks = MusicLib.tracks.map(t => `${t.game}:${t.hour}:${t.weather}`).join();
    // uploaded again, what's there already is skipped
    await MusicUpload.start([file('Game One/05 - 5 PM.wav')]);
    out.skipped = MusicUpload.job.skipped;
    __dbg.setTime(5, 12, 17);
    // (a clear day: the island's own weather for 12 May depends on its seed, and rain picks the rain versions)
    const tw0 = window.todayWeather;
    window.todayWeather = () => 'sunny';
    const M = musicState();
    const pick = () => Music.pick();
    out.hourly = pick();
    out.same = pick() === out.hourly;
    M.lib = 'Game Two'; out.always = pick();
    M.lib = 'tunes'; out.tunes = pick();
    M.lib = ''; M.libSkip = ['Game Two']; out.mix = pick();
    M.libSkip = [];
    M.hours[17] = 'hgame:Game One'; out.hourGame = pick();
    delete M.hours[17];
    M.now = 'lib:Game Two/Shop.wav'; out.now = pick();
    M.now = null;
    const tw = window.todayWeather;
    window.todayWeather = () => 'rain'; M.lib = 'Game One'; out.rain = pick(); window.todayWeather = tw; M.lib = '';
    // it plays from its file, through the music's volume
    Audio2.unlock();
    M.lib = 'Game Two';
    Music.update(true);
    const d = Music.cur && Music.cur.file;
    out.playing = Music.cur && Music.cur.path;
    if (d) { for (let i = 0; i < 50 && d.el.readyState < 1; i++) await new Promise(r => setTimeout(r, 100)); out.ready = d.el.readyState >= 1; }
    // music of the player's own, kept on this device, plays from its file too
    const added = await OwnMusic.add([new File([buf], 'My_Tune.wav', { type: 'audio/wav' })]);
    const mine = OwnMusic.list()[0];
    out.own = { n: added, name: mine.name, ok: trackOk('own:' + mine.id), named: trackName('own:' + mine.id) };
    M.now = 'own:' + mine.id;
    out.ownPick = pick() === 'own:' + mine.id;
    Music.update(true);
    const od = Music.cur && Music.cur.file;
    for (let i = 0; i < 50 && od && !(od.el.src || '').startsWith('blob:'); i++) await new Promise(r => setTimeout(r, 100));
    out.ownPlays = !!od && od.el.src.startsWith('blob:');
    // the Music app shows it
    appMusic('library');
    out.ownApp = document.querySelector('#panel').textContent.includes('My Tune');
    M.now = null;
    await OwnMusic.remove(mine.id);
    out.ownGone = OwnMusic.list().length === 0 && !trackOk('own:' + mine.id);
    // the soundtracks' own tracks for places (SOUNDTRACK): one format of a track goes up; the museum's rooms share a
    // track, so it carries on through their doors, and the aquarium has its own
    await MusicUpload.start([file('Game Three/Museum.wav'), file('Game Three/Museum (Aquarium Track).wav'), file('Game Three/Theme.wav'), file('Game Three/Theme.mp3')]);
    out.three = MusicLib.byGame['Game Three'].map(t => t.path).sort().join();
    const [ix, iy] = [G.player.x, G.player.y];
    __dbg.enter('museum');
    out.museum = Music.pick();
    const cur0 = Music.cur;
    __dbg.enter('museum_art');
    out.museumArt = Music.pick();
    out.carriedOn = !!cur0 && Music.cur === cur0;
    __dbg.enter('museum_fish');
    out.aquarium = Music.pick();
    M.lib = 'tunes'; out.museumTunes = Music.pick();
    // (its files stopped before they're taken off the server)
    setArea('island', ix, iy);
    await new Promise(r => setTimeout(r, 1500));
    M.lib = '';
    await Cloud.api('DELETE', '/api/music/game?name=' + encodeURIComponent('Game Three'));
    await MusicLib.load(true);
    appMusic('library');
    out.app = document.querySelector('#panel').textContent;
    appMusic('now');
    out.now2 = [...document.querySelectorAll('#panel details.mlib summary')].map(s => s.textContent).join('|');
    UI.close();
    M.lib = '';
    for (const g of ['Game One', 'Game Two']) await Cloud.api('DELETE', '/api/music/game?name=' + encodeURIComponent(g));
    await MusicLib.load(true);
    out.after = MusicLib.tracks.length;
    out.back = pick();
    window.todayWeather = tw0;
    return out;
  });
  assert.equal(res.paths, 'Game One/05 - 5 PM.wav,Game Two/Shop.wav');
  assert.equal(res.games, 'Game One,Game Two');
  assert.equal(res.tracks, 'Game One:17:clear,Game One:17:rain,Game Two:17:clear,Game Two:null:clear');
  assert.equal(res.skipped, 1);
  assert.match(res.hourly, /^lib:Game (One\/05 - 5 PM|Two\/5 PM)\.wav$/);
  assert.ok(res.same, 'the same game all hour');
  assert.equal(res.always, 'lib:Game Two/5 PM.wav');
  assert.ok(!res.tunes.startsWith('lib:'), "the island's own tunes when asked");
  assert.equal(res.mix, 'lib:Game One/05 - 5 PM.wav', 'a game left out of the mix');
  assert.equal(res.hourGame, 'lib:Game One/05 - 5 PM.wav');
  assert.equal(res.now, 'lib:Game Two/Shop.wav');
  assert.equal(res.rain, 'lib:Game One/06 - 5 PM (Rainy).wav', 'the rain version on a rainy day');
  assert.equal(res.playing, 'Game Two/5 PM.wav');
  assert.ok(res.ready, 'the server streams it to the audio element');
  assert.match(res.app, /Hourly music/);
  assert.match(res.app, /Game One/);
  assert.match(res.app, /Upload a folder/);
  assert.equal(res.now2, 'Game One (2)|Game Two (2)');
  assert.deepEqual(res.own, { n: 1, name: 'My Tune', ok: true, named: 'My Tune (yours)' });
  assert.ok(res.ownPick && res.ownPlays && res.ownApp && res.ownGone, JSON.stringify(res));
  assert.match(res.app, /Copy the track list/);
  assert.equal(res.three, 'Game Three/Museum (Aquarium Track).wav,Game Three/Museum.wav,Game Three/Theme.mp3');
  assert.equal(res.museum, 'lib:Game Three/Museum.wav');
  assert.equal(res.museumArt, res.museum);
  assert.ok(res.carriedOn, 'the same music carries on into the next room');
  assert.equal(res.aquarium, 'lib:Game Three/Museum (Aquarium Track).wav');
  assert.ok(!res.museumTunes.startsWith('lib:'), "the island's own tunes when asked");
  assert.equal(res.after, 0);
  assert.ok(!res.back.startsWith('lib:'));
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('asking to play: volleyball wherever they are by day, jump rope with a friend turning, an arcade game on their handheld', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {};
    const ask = UI.ask, say = UI.say;
    UI.say = async () => {};
    try {
      __dbg.setTime(5, 12, 11);
      G.weather = 'sunny';
      const kai = NPCs.get('kai'), cuke = NPCs.get('cuke');
      for (const n of [kai, cuke]) { rel(n.id).met = true; n.area = 'island'; n.want = null; n.sleeping = false; n.script = false; n.talking = false; }
      kai.spotKey = 'plaza'; kai.x = G.player.x + 20; kai.y = G.player.y;
      cuke.x = G.player.x + 40; cuke.y = G.player.y;
      const games = igAskGames(kai).map(g => g[0]);
      out.kinds = { volley: games.includes('volley'), rope: games.includes('rope'), vs: games.some(g => g.startsWith('vs:')), tag: games.includes('tag') };
      out.friend = igRopeFriend(kai) && igRopeFriend(kai).id;
      out.ropeLine = /Cuke/.test(igAskLine(kai, 'rope', 'Jump rope'));
      const vs = games.find(g => g.startsWith('vs:'));
      out.vsLine = igAskLine(kai, vs, ARCADE_GAMES[vs.slice(3)].name).includes(ARCADE_GAMES[vs.slice(3)].name);
      // jump rope: the screen dims and the two of them hold the rope on the square
      igRope(kai);
      for (let i = 0; i < 300 && !(Rope.on && Rope.state === 'ready'); i++) await new Promise(r => setTimeout(r, 20));
      out.rope = { on: Rope.on, cast: Rope.cast.map(n => n.id).join(), turners: (Rope.turners() || []).map(n => n.id).join(), held: kai.script && cuke.script };
      Rope.quit();
      for (let i = 0; i < 300 && (Rope.on || Rope.forced); i++) await new Promise(r => setTimeout(r, 20));
      out.ropeDone = { off: !Rope.on, forced: Rope.forced, free: !kai.script && !cuke.script, played: S.games.rope.played };
      // an arcade game on the handheld: the two-player cabinet game against them
      UI.ask = async (who, t, choices) => choices.length - 1;
      igHandheld(kai, vs.slice(3));
      for (let i = 0; i < 300 && !Arcade.on; i++) await new Promise(r => setTimeout(r, 20));
      out.arcade = { on: !!Arcade.on, id: Arcade.id };
      if (Arcade.on) { Arcade.g.over = true; for (let i = 0; i < 250 && Arcade.state !== 'over'; i++) await new Promise(r => setTimeout(r, 20)); Arcade.finish(); }
      for (let i = 0; i < 300 && (Arcade.on || kai.script); i++) await new Promise(r => setTimeout(r, 20));
      out.arcadeDone = !Arcade.on && !kai.script;
    } finally { UI.ask = ask; UI.say = say; }
    return out;
  });
  assert.deepEqual(res.kinds, { volley: true, rope: true, vs: true, tag: true });
  assert.equal(res.friend, 'cuke');
  assert.ok(res.ropeLine);
  assert.ok(res.vsLine);
  assert.deepEqual(res.rope, { on: true, cast: 'kai,cuke', turners: 'kai,cuke', held: true });
  assert.deepEqual(res.ropeDone, { off: true, forced: null, free: true, played: 1 });
  assert.equal(res.arcade.on, true);
  assert.match(res.arcade.id, /^vs_/);
  assert.ok(res.arcadeDone);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('town projects: paid for at the Town Hall, built overnight; the lighthouse boarded till then; the statue last; the swings, the hammock', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {}, isl = G.areas.island, has = kind => G.areas.island.ents.some(e => e.kind === kind);
    __dbg.setTime(5, 12, 11);
    out.spots = Object.keys(W0.projects).sort().join();
    out.hidden = !has('hammock') && !has('swing_set') && !has('statue_sarah');
    const h = W0.projects.hammock;
    out.held = projectTile(h.x + 1, h.y) === 'hammock' && !projectTile(h.x + 1, h.y - 3);
    // the lighthouse is boarded up: its door says so and nobody goes in
    const say = UI.say, said = [];
    UI.say = async (who, t) => { said.push(String(t)); };
    try { await enterBuilding('lighthouse'); } finally { UI.say = say; }
    out.boarded = G.area.id === 'island' && said.some(t => /boarded/.test(t));
    // paying in, a bit at a time; paid off, it's there the next morning with a letter
    S.money = 2000000;
    out.part = projectPay('hammock', 5000) === 5000 && projectPaid('hammock') === 5000 && !projectBuilt('hammock');
    out.rest = projectPay('hammock', 999999) === 15000 && S.money === 2000000 - 20000;
    out.notYet = !projectBuilt('hammock');
    __dbg.setTime(5, 13, 9);
    projectsTick();
    out.built = [projectBuilt('hammock'), has('hammock'), JSON.stringify(S.mail || S.inbox || []).includes('hammock')].join();
    // the statue waits for all the others (Fortune's bigger store isn't one any more: Fortune orders it, 6z_shops.js)
    const statue = PROJECTS.find(p => p.id === 'statue');
    out.statueLater = !projectOpen(statue);
    out.noStore = !PROJECTS.some(p => p.id === 'store');
    for (const p of PROJECTS) if (!p.last && p.id !== 'hammock') projectPay(p.id, p.cost);
    __dbg.setTime(5, 14, 9);
    projectsTick();
    out.allBuilt = PROJECTS.filter(p => !p.last).every(p => projectBuilt(p.id)) && has('swing_set') && has('park_clock') && has('shrine_stone');
    // a save that had paid toward the old store project gets it back; one that had paid it off has the Department Store
    const st = JSON.parse(JSON.stringify(S));
    st.town.proj.paid.store = 5000; st.money = 100;
    const m1 = migrate(st);
    const st2 = JSON.parse(JSON.stringify(S));
    st2.town.proj.paid.store = 200000; st2.town.proj.done.store = Clock.dayNum(); st2.shops.shop.level = 3;
    const m2 = migrate(st2);
    out.store = m1.money === 5100 && m1.town.proj.paid.store === undefined && m2.shops.shop.level === 4 && m2.town.proj.done.store === undefined;
    out.statueOpen = projectOpen(statue);
    out.lighthouse = lighthouseOpen();
    // an island whose keeper's story had begun before the projects keeps its lighthouse open
    const P = S.town.proj; S.town.proj = { paid: {}, done: {} };
    S.quests = S.quests || {}; const q0 = S.quests.ghost; S.quests.ghost = { stage: 1 };
    out.grandfathered = lighthouseOpen();
    S.quests.ghost = q0; S.town.proj = P;
    // the swings swing
    const sw = G.areas.island.ents.find(e => e.kind === 'swing_set');
    if (!sw) return Object.assign(out, { noSwing: G.areas.island === isl, kinds: G.areas.island.ents.filter(e => e.propIdx >= 118).map(e => e.kind).join() });
    const say0 = UI.say;
    let swingSaid = 0;
    UI.say = async () => { swingSaid++; };
    const go = Projects.swingOn(sw);
    await new Promise(r => setTimeout(r, 300));
    out.swinging = !!Projects.swing && G.player.pose === 'sit';
    await go;
    out.swung = !Projects.swing && !G.player.pose && swingSaid === 0;
    // the hammock: she lies down in it until the line's read, then she's back where she was
    const hm = G.areas.island.ents.find(e => e.kind === 'hammock'), at = [G.player.x, G.player.y];
    let lying = null;
    UI.say = async () => { lying = G.player.lie === hm && G.player.pose === 'sit' && Math.abs(G.player.x - hm.x) < 2; };
    try { await Projects.hammock(hm); } finally { UI.say = say0; }
    out.hammock = lying === true && !G.player.lie && !G.player.pose && G.player.x === at[0] && G.player.y === at[1];
    // the Town Hall's screen lists them all
    const b = document.createElement('div'), f = document.createElement('div');
    CIVIC_LIVE.projects.draw(b, f, () => {});
    out.screen = PROJECTS.every(p => b.textContent.includes(p.name)) && CIVIC_MENUS.townhall.includes('projects');
    return out;
  });
  assert.deepEqual(res, { spots: 'clock,hammock,shrine,statue,swings', hidden: true, held: true, boarded: true, part: true, rest: true, notYet: true, built: 'true,true,true',
    statueLater: true, noStore: true, allBuilt: true, store: true, statueOpen: true, lighthouse: true, grandfathered: true,
    swinging: true, swung: true, hammock: true, screen: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('the statue: the Council congratulates Sarah the day after, and casts anyone (or a Tamagotchi, or a rose) in bronze by morning, free', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {};
    __dbg.setTime(5, 12, 11);
    S.money = 3000000;
    for (const p of PROJECTS) if (!p.last) projectPay(p.id, p.cost);
    __dbg.setTime(5, 13, 9); projectsTick();
    projectPay('statue', 500000);
    __dbg.setTime(5, 14, 9); projectsTick();
    out.built = projectBuilt('statue') && statueKind() === 'sarah' && !!S.town.statue.spec;
    const say = UI.say, ask = UI.ask, said = [];
    UI.say = async (who, t) => { said.push(who + ': ' + [].concat(t).join(' ')); };
    UI.ask = async (who, t) => { said.push(who + '? ' + t); return 0; };
    try {
      out.sameDay = (await statueCongrats()) === false;
      __dbg.setTime(5, 15, 10);
      out.offer = (await statueCongrats()) === true && said.some(t => /^floret: .*congratulations/i.test(t)) && said.some(t => /^stalk: .*free of charge/i.test(t));
      out.once = (await statueCongrats()) === false;
    } finally { UI.say = say; UI.ask = ask; }
    // the choices: Sarah, David, everyone, Frasier, the keychain, a rose
    const ids = statueChoices().map(c => c[0]);
    out.choices = ids[0] === 'sarah' && ids[1] === 'david' && ['joe', 'kai', 'goat', 'fortune', 'frasier', 'tama', 'rose'].every(k => ids.includes(k)) && !ids.includes('scampi');
    // the screen: pick Frasier, cast him (free), and he's up by morning with a letter
    const b = document.createElement('div'), f = document.createElement('div'), redraw = () => { b.innerHTML = ''; f.innerHTML = ''; CIVIC_LIVE.statue.draw(b, f, redraw); };
    redraw();
    const money = S.money;
    [...b.querySelectorAll('.row')].find(r => /Frasier/.test(r.textContent)).click();
    [...f.querySelectorAll('button')].find(x => /Cast/.test(x.textContent)).click();
    out.pending = S.town.statue.next && S.town.statue.next.kind === 'frasier' && statueKind() === 'sarah' && S.money === money;
    __dbg.setTime(5, 16, 9); projectsTick();
    out.frasier = statueKind() === 'frasier' && !S.town.statue.next && /FRASIER CRANE/.test(statueWords()) && S.mail.some(m => m.from === 'floret' && /new statue/i.test(m.subject));
    out.key = /:frasier$/.test(projectsKey());
    // a neighbor's statue in the flat views: their picture in bronze on the plinth
    S.town.statue.next = { kind: 'kai', day: Clock.dayNum() + 1 };
    __dbg.setTime(5, 17, 9); projectsTick();
    out.kai = statueKind() === 'kai' && statueFrame() === 'statue_kai' && !!Assets.dyn.statue_kai && /KAI/.test(statueWords());
    return out;
  });
  assert.deepEqual(res, { built: true, sameDay: true, offer: true, once: true, choices: true, pending: true, frasier: true, key: true, kai: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("5 AM: fruit, fish and shells left out are gone by morning; anything else is kept at the Town Hall's Lost and Found (or home in storage)", async () => {
  const page = await device();
  await page.evaluate(() => { localStorage.setItem('sc-current', ''); localStorage.setItem('sc-civic', '1'); });
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(() => {
    const out = {};
    __dbg.setTime(5, 12, 11);
    __dbg.teleport('island', 110, 100);
    const p = G.player;
    for (const id of ['peach', 'clam', 'mackerel', 'wood', 'sofa_pink', 'sofa_pink', 'axe']) spawnDrop(id, p.x + 20, p.y);
    spawnDrop('q_note', p.x - 20, p.y);
    out.before = S.drops.length === 8;
    // the next morning: the renewables are gone, the quest note still lies there, the rest is at the Town Hall
    __dbg.setTime(5, 13, 6);
    dailyCheck();
    out.left = S.drops.map(d => d.id).join() + '|' + G.area.ents.filter(e => e.dropRef).map(e => e.id).join();
    out.kept = JSON.stringify(S.lostFound);
    out.mail = S.mail.some(m => m.from === 'floret' && m.body.includes(itemName('sofa_pink')) && /Lost and Found/.test(m.body) && !m.body.includes(itemName('peach')));
    out.menu = CIVIC_MENUS.townhall.includes('lostfound');
    // the Town Hall's screen: take the sofas, then the axe; then everything at once
    const b = document.createElement('div'), f = document.createElement('div'), redraw = () => { b.innerHTML = ''; f.innerHTML = ''; CIVIC_LIVE.lostfound.draw(b, f, redraw); };
    redraw();
    const row = (name) => [...b.querySelectorAll('.row')].find(r => r.textContent.includes(name));
    row(itemName('sofa_pink')).click();
    out.sofas = pocketCount('sofa_pink') === 2 && !S.lostFound.sofa_pink && !!row(itemName('axe')) && !f.querySelector('button');
    row(itemName('axe')).click();
    out.axe = pocketCount('axe') === 1 && !Object.keys(S.lostFound).length && /Nothing here/.test(b.textContent);
    S.lostFound = { nigiri: 2, out_pajamas: 1 };
    redraw();
    [...f.querySelectorAll('button')].find(x => /Take everything/.test(x.textContent)).click();
    out.all = pocketCount('nigiri') === 2 && pocketCount('out_pajamas') === 1 && !Object.keys(S.lostFound).length;
    return out;
  });
  assert.deepEqual(res, { before: true, left: 'q_note|q_note', kept: '{"sofa_pink":2,"axe":1}', mail: true, menu: true, sofas: true, axe: true, all: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
  // with the Town Hall's rooms not open yet, what's found goes home to storage
  const p2 = await device();
  await p2.evaluate(() => localStorage.setItem('sc-current', ''));
  await p2.reload();
  await title(p2);
  await p2.evaluate(() => __dbg.quickStart());
  await p2.waitForFunction(() => G.mode === 'play' && !G.busy);
  const r2 = await p2.evaluate(() => {
    __dbg.setTime(5, 12, 11);
    spawnDrop('sofa_pink', G.player.x + 20, G.player.y);
    spawnDrop('cherry', G.player.x + 20, G.player.y);
    __dbg.setTime(5, 13, 6);
    dailyCheck();
    return [CIVIC_PREVIEW, S.drops.length, S.storage.sofa_pink, !S.lostFound, S.mail.some(m => m.from === 'floret' && /storage/.test(m.body))].join();
  });
  assert.equal(r2, 'false,0,1,true,true');
  await p2.context().close();
});

test("outdoor furniture: Waffle's stock by kind each day in four colors; floor furniture goes outside, Waffle's pieces go indoors", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(() => {
    const out = {}, day = Clock.dayNum(), st = waffleStock(day);
    // a few of each kind, the same all day, different tomorrow; every piece in four colors; plenty of each kind
    out.kinds = OUTDOOR_CATS.every(([c]) => st.some(s => s.cat === c)) && st.length === Object.values(OUTDOOR_DAILY).reduce((a, b) => a + b, 0);
    out.days = JSON.stringify(st) === JSON.stringify(waffleStock(day)) && JSON.stringify(st) !== JSON.stringify(waffleStock(day + 1));
    out.colors = Object.keys(DISPLAYS).every(id => FURN[id] && FURN[id].colors && FURN[id].colors.length === 4);
    out.perKind = OUTDOOR_CATS.every(([c]) => Object.values(DISPLAYS).filter(d => d.cat === c).length >= 6);
    out.pictures = Object.keys(DISPLAYS).every(id => Assets.has(DISPLAYS[id].frame));
    // a piece in another color is set down as its own piece, with its own name and picture
    const v = dispDef('od_iron_bench@white');
    out.variant = !!v && v.seat && v.w === 2 && /white/.test(v.name) && v.frame === 'f_od_iron_bench@white' && Assets.has(v.frame);
    // anything standing on the floor indoors goes outside too (a sofa is still a seat); a clock on the wall doesn't
    out.indoorOut = !!dispDef('easel') && dispDef('sofa_pink').seat && !dispDef('clock_wall');
    toStorage('easel', 1); toStorage('dp_bench@dark wood', 1);
    out.owned = ownedDisplays().easel === 1 && ownedDisplays()['dp_bench@dark wood'] === 1;
    // set down: its tiles blocked, a two-wide seat a bench the neighbors use, a street lamp lit as one
    deco().placed.push({ id: 'easel', x: 70, y: 88 }, { id: 'od_porch_swing', x: 72, y: 88 }, { id: 'od_lamp_double', x: 76, y: 88 });
    rebuildIsland();
    const isl = G.areas.island, es = isl.ents.filter(e => e.kind === 'display');
    out.island = es.some(e => e.disp === 'easel') && isl.blockedAt(70, 88) && isl.blockedAt(73, 88) && !!es.find(e => e.disp === 'od_porch_swing').interact;
    benches.c = null;
    out.bench = benches().some(b => b.placed && b.x === 72);
    out.lamp = lightSources(isl).some(q => q[4] === 'lamp' && Math.abs(q[0] - 76.5 * TILE) < 2);
    // Waffle's pieces indoors: in the house's Furniture tab, standing on the floor
    toStorage('od_hedge_tall', 1);
    out.indoors = !!Decor.owned().od_hedge_tall && furnDef('od_hedge_tall').kind === 'floor';
    return out;
  });
  assert.deepEqual(res, { kinds: true, days: true, colors: true, perKind: true, pictures: true, variant: true, indoorOut: true, owned: true, island: true, bench: true, lamp: true, indoors: true });
  // buying at Waffle's: today's first piece goes home to storage
  await page.evaluate(() => { S.money = 100000; displaysShop(); });
  const first = await page.evaluate(() => waffleStock(Clock.dayNum())[0].id);
  await page.click('#panel .store-list .card');
  assert.deepEqual(await page.evaluate((id) => [S.storage[id] || 0, S.money < 100000], first), [0, false]);
  await page.locator('#panel .store-pick .btn', { hasText: 'Buy' }).click();
  assert.deepEqual(await page.evaluate((id) => [S.storage[id] || 0, S.money < 100000], first), [1, true]);
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test("buying and selling at Fortune's: a tap picks a thing and shows it, Buy buys it, Sell sells it (and the statement says what for)", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => { __dbg.setTime(11, 0, 14); S.money = 50000; __dbg.give('apple', 3); __dbg.enter('shop'); });
  await page.waitForFunction(() => G.area.id === 'shop' && NPCs.get('fortune') && NPCs.get('fortune').area === 'shop');
  // talking to Fortune, as Sarah does
  const choose = async (label) => {
    for (let i = 0; i < 40 && !(await page.$('#choices .choice')); i++) { await page.evaluate(() => UI.advance()); await page.waitForTimeout(150); }
    await page.click(`#choices .choice:has-text("${label}")`);
  };
  await page.evaluate(() => { talkTo(NPCs.get('fortune')); });
  await choose('Buy');
  await page.waitForSelector('#panel .store-list .card');
  const first = await page.evaluate(() => shopStock().furn[0]);
  await page.click('#panel .store-list .card');
  assert.equal(await page.evaluate(() => S.money), 50000, 'a tap only picks');
  await page.locator('#panel .store-pick .btn', { hasText: 'Buy' }).first().click();
  const bought = await page.evaluate((id) => ({ home: S.storage[id] || 0, spent: S.money < 50000, why: Object.keys(S.bank.flow.out) }), first);
  assert.deepEqual(bought, { home: 1, spent: true, why: ['Furniture'] });
  // seeds by fives
  await page.click('#panel .tabs button:has-text("Seeds")');
  await page.click('#panel .store-list .card');
  const seed = await page.evaluate(() => { const id = GD.veg.map(v => 'seed_' + v).filter(farOk)[0]; return [id, pocketCount(id)]; });
  await page.locator('#panel .store-pick .btn', { hasText: 'Buy 5' }).click();
  assert.equal(await page.evaluate((id) => pocketCount(id), seed[0]), seed[1] + 5);
  await page.evaluate(() => UI.close());
  await choose('Sell');
  await page.waitForSelector('#panel .store-list .card');
  const m0 = await page.evaluate(() => S.money);
  await page.locator('#panel .store-list .card', { has: page.locator('.nm', { hasText: /^Apple$/ }) }).click();
  await page.locator('#panel .store-pick .btn', { hasText: 'Sell all' }).click();
  const sold = await page.evaluate((m0) => ({ apples: pocketCount('apple'), more: S.money > m0, why: !!S.bank.flow.in['Fruit & veg'] }), m0);
  assert.deepEqual(sold, { apples: 0, more: true, why: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('Captain Shrimpy: washed up a week in, ten logs, ten meals, five gems, sails off, back at the pier, moves in and farms', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {}, ents = () => G.areas.island.ents, site = () => (ents().find(e => e.kind === 'seasite') || {}).frame || null;
    const day = d => { __dbg.setTime(5, d, 10); dailyCheck(); NPCs.place(true); };
    day(1);
    const Q = seaState(); Q.from = Clock.dayNum(); Q.stage = 0;
    out.farBefore = !farOk('seed_pumpkin') && !farOk('sailor_stew');
    // an older island (a save brought in) counts its week from the day it first loads
    const old = JSON.parse(JSON.stringify(S)); delete old.sea; old.started = true;
    out.migrated = migrate(old).sea.from === Clock.dayNum();
    const said = [], say = UI.say, ask = UI.ask, card = window.specialCard;
    UI.say = async (who, t) => { said.push([who, [].concat(t).join(' ')]); };
    UI.ask = async () => 0;
    window.specialCard = async () => {};
    const talk = async () => { said.length = 0; await talkTo(NPCs.get('scampi')); return said.map(x => x[1]).join(' '); };
    try {
      day(6);
      out.notYet = seaStage() === 0 && NPCs.get('scampi').sleeping && !site();
      day(8);
      const n = NPCs.get('scampi'), s = seaSite();
      out.washed = [seaStage(), site(), !!(n.want && n.want.lie), n.area, Math.abs(n.x / TILE - s.x) < 3].join();
      out.wakes = /LAND/.test(await talk()) && seaStage() === 2;
      // chopping a tree while he's short drops a sturdy log
      G.area = G.areas.island;
      const logs = () => ents().filter(e => e.kind === 'item' && e.id === 'ship_log').length, l0 = logs();
      seaChop(G.player.x, G.player.y);
      out.chopDrop = logs() === l0 + 1;
      addItem('ship_log', 10, true);
      seaChop(G.player.x, G.player.y);
      out.enough = logs() === l0 + 1;
      out.logs = /Ten logs/.test(await talk()) && seaStage() === 3 && S.sea.got.logs === 10 && pocketCount('ship_log') === 0 && site() === 'ship_frame';
      out.waits = /[Tt]omorrow/.test(await talk()) && seaStage() === 3;
      day(9);
      addItem('fried_rice', 6, true); addItem('chowder', 4, true);
      out.meals = /meals/.test(await talk()) && seaStage() === 4 && S.sea.got.meals === 10 && !pocketCount('fried_rice') && !pocketCount('chowder');
      day(10);
      addItem('gem_ruby', 3, true); addItem('gem_quartz', 2, true);
      out.gems = /Five gems/.test(await talk()) && seaStage() === 5 && site() === 'ship_scampi';
      out.tide = /morning tide/.test(await talk()) && seaStage() === 5;
      day(11);
      out.stillHere = seaStage() === 5 && !NPCs.get('scampi').sleeping;
      const go = talk();
      let boat = false;
      for (let i = 0; i < 80 && !boat; i++) { await new Promise(r => setTimeout(r, 50)); boat = SeaSky.boats.some(b => b.kind === 'ship_scampi'); }
      await go;
      out.sailed = [boat, seaStage(), hasSpecial('compass'), NPCs.get('scampi').sleeping, site()].join();
      day(13);
      out.away = seaStage() === 6;
      day(14);
      const m = NPCs.get('scampi'), pr = W0.pier;
      out.back = [seaStage(), site(), !m.sleeping, Math.abs(m.x / TILE - pr.x0) < 3].join();
      out.asks = /drop anchor[^]*treasure/.test(await talk()) && seaStage() === 8;
      day(15);
      const land = W0.lots.land_a, sign = W0.props.findIndex(p => p.kind === 'sign_land' && p.x >= land.x && p.x < land.x + land.w && p.y >= land.y && p.y < land.y + land.h);
      out.movedIn = [seaStage(), NEIGHBORS.includes('scampi'), !!W0.buildings.h_scampi, hasSpecial('friend_scampi'), sign >= 0 && !ents().some(e => e.propIdx === sign)].join();
      out.letter = JSON.stringify(S.mail || []).includes('seed_pumpkin');
      out.hello = /Captain Shrimpy, late of the Brine Darling/.test(await talk());
      const seg = planNow('scampi', 8);
      out.farms = !!seg && seg.spot === 'farm' && !!seg.tend;
      out.farAfter = farOk('seed_pumpkin') && RECIPE_FROM.scampi.length === 4;
      await teachRecipe('scampi', false);
      out.recipe = S.recipes.includes('sailor_stew');
      out.likes = giftTier('scampi', 'seabass') === 'love' && giftTier('scampi', 'shrimp') === 'dislike';
    } finally { UI.say = say; UI.ask = ask; window.specialCard = card; }
    return out;
  });
  assert.deepEqual(res, { farBefore: true, migrated: true, notYet: true, washed: '1,wreck,true,island,true', wakes: true, chopDrop: true, enough: true, logs: true,
    waits: true, meals: true, gems: true, tide: true, stillHere: true, sailed: 'true,6,true,true,', away: true, back: '7,ship_scampi,true,true', asks: true,
    movedIn: '9,true,true,true,true', letter: true, hello: true, farms: true, farAfter: true, recipe: true, likes: true });
  await page.close();
});

test("Shrimpy's stall at the farm by season, a coffee with a friend at Muggy's, a cup to go on a table, their themed houses", async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {}, say0 = UI.say, ask0 = UI.ask, answers = [];
    UI.say = async () => {};
    UI.ask = async () => (answers.length ? answers.shift() : -1);
    try {
      // Shrimpy, moved in, at the farm on a summer morning: corn seeds and the season's recipe
      S.sea = { from: 0, stage: 9, got: {} }; seaJoin();
      __dbg.setTime(7, 10, 8);
      const n = NPCs.get('scampi'), off = { area: n.area };
      n.area = 'island';
      out.farming = seaFarming(n) && seaOptions(n).length === 1;
      __dbg.setTime(7, 10, 12);
      out.offDuty = seaOptions(n).length === 0;
      __dbg.setTime(7, 10, 8);
      S.money = 50000;
      const before = S.money;
      answers.push(0, 4);
      await seaStall(n);
      out.stall = pocketCount('seed_corn') === 1 && S.recipes.includes('grilled_corn') && S.money === before - ITEMS.seed_corn.price - SEA_RECIPE_PRICE;
      __dbg.setTime(10, 10, 8);
      out.autumn = SEA_STALL[Clock.season()].seeds.includes('pumpkin');
      n.area = off.area;
      // Muggy's: a coffee with a friend at the table, Muggy's café open
      S.mug = { stage: 6, found: 5, day: 0, free: false }; mugJoin();
      __dbg.setTime(5, 12, 10);
      __dbg.enter('cafe');
      const k = NPCs.get('kai');
      k.area = 'cafe'; k.sleeping = false;
      rel('kai').met = true;
      // (the secret neighbor's card from Muggy staying, out of the way first)
      await new Promise(r => setTimeout(r, 300));
      UI.close(true);
      answers.push(0);
      const inv = cafeInvite();
      for (let i = 0; i < 40 && !document.querySelector('#panel .row'); i++) await new Promise(r => setTimeout(r, 50));
      [...document.querySelectorAll('#panel .row')].find(r => /Kai/.test(r.textContent)).click();
      out.invite = (await inv) === 'kai';
      await cafeSit('latte', 'kai');
      out.sat = G.eatSeat == null && rel('kai').cafeDay === Clock.dayNum() && !!S.bonus && S.bonus.id === 'speed' && (rel('kai').mem || []).some(m => m.k === 'coffee');
      // a cup to go sits on a table at home like food
      receive('mocha', 1);
      const d = furnDef('mocha');
      out.furniture = !!d && d.kind === 'top' && !!d.food && Decor.owned().mocha === 1;
      // their houses: a ship's cabin, and the dishware days
      out.houses = ROOMS.h_scampi.layout.some(i => i[0] === 'ship_wheel') && ROOMS.h_scampi.layout.some(i => i[0] === 'anchor_deco')
        && ROOMS.h_mug.layout.some(i => i[0] === 'teacup_chair') && ROOMS.h_mug.layout.some(i => i[0] === 'china_cabinet')
        && ['ship_wheel', 'porthole', 'anchor_deco', 'teacup_chair', 'teapot_lamp', 'plate_rack', 'china_cabinet'].every(id => FURN[id] && Assets.dyn['f_' + id]);
      out.names = NPC_DEFS.scampi.name === 'Shrimpy' && NPC_DEFS.mug.name === 'Muggy' && ROOMS.cafe.name === "Muggy's";
    } finally { UI.say = say0; UI.ask = ask0; }
    return out;
  });
  assert.deepEqual(res, { farming: true, offDuty: true, stall: true, autumn: true, invite: true, sat: true, furniture: true, houses: true, names: true });
  assert.deepEqual(page.problems, []);
  await page.context().close();
});

test('Muggy: Brulee\'s letter, five pieces under an X a day, Sully mends a giant mug, it visits, stays and opens the café', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play' && !G.busy);
  const res = await page.evaluate(async () => {
    const out = {}, isl = () => G.areas.island, xs = () => isl().ents.filter(e => e.mugX);
    const day = d => { __dbg.setTime(5, d, 10); dailyCheck(); NPCs.place(true); };
    const said = [], say = UI.say, ask = UI.ask, card = window.specialCard;
    let answers = [];
    UI.say = async (who, t) => { said.push([who, [].concat(t).join(' ')]); };
    UI.ask = async () => (answers.length ? answers.shift() : 0);
    window.specialCard = async () => {};
    const heard = () => { const t = said.map(x => x[1]).join(' '); said.length = 0; return t; };
    try {
      day(1);
      out.notYet = mugStage() === 0;
      // twenty gifts to the museum, a pot of hers on every pedestal: Brulee writes
      S.stats.donated = 20; artState().pots = Array.from({ length: 10 }, (_, i) => 'pot_test_' + i);
      day(2);
      out.letter = mugStage() === 1 && JSON.stringify(S.mail || []).includes('Merci');
      const brulee = NPCs.get('brulee'), opt = label => mugOptions(brulee).find(o => o.label.startsWith(label));
      await opt('About your letter').fn();
      out.story = mugStage() === 2 && /dig on this island/.test(heard()) && xs().length === 1;
      // an X a day: no shovel, nothing; with one, a piece; dug, it's gone till tomorrow, then somewhere new
      const x0 = xs()[0], at0 = [x0.tx, x0.ty].join();
      out.spot = at0 === [mugSpot(Clock.dayNum()).x, mugSpot(Clock.dayNum()).y].join();
      await x0.interact();
      out.noShovel = /shovel would help/.test(heard()) && !pocketCount('mug_shard');
      addItem('shovel', 1, true); setHeld('shovel');
      G.area = isl();
      await digAt(x0.tx, x0.ty);
      out.dug = pocketCount('mug_shard') === 1 && S.mug.found === 1 && !xs().length;
      mugRefresh();
      out.oncePerDay = !xs().length;
      const places = new Set([at0]);
      for (let d = 3; d <= 6; d++) { day(d); const e = xs()[0]; if (!e) break; places.add([e.tx, e.ty].join()); await digAt(e.tx, e.ty); }
      out.five = [mugStage(), pocketCount('mug_shard'), places.size >= 4].join();
      // at the museum, Brulee fetches Sully, and the five become a giant mug, on show in the hall today
      await opt('I found all five').fn();
      out.notHere = mugStage() === 3 && /Bring them to the museum/.test(heard());
      await enterRoom('museum');
      await opt('I found all five').fn();
      out.mended = [mugStage(), pocketCount('mug_shard'), /GIANT mug/.test(heard()), NPCs.get('mug').area].join();
      // the next day, out on the island, the mug comes to find Sarah
      day(7);
      __dbg.teleport('island', 110, 100);
      out.due = mugStage() === 5;
      mugCheck();
      for (let i = 0; i < 200 && !S.mug.visited; i++) await new Promise(r => setTimeout(r, 50));
      out.visit = [S.mug.visited, mugStage(), rel('mug').met, /LIVING mug/.test(heard())].join();
      day(8);
      const land = W0.lots.land_b, sign = W0.props.findIndex(p => p.kind === 'sign_land' && p.x >= land.x && p.x < land.x + land.w && p.y >= land.y && p.y < land.y + land.h);
      const lot = W0.props.findIndex(p => p.kind === 'sign_lot');
      out.open = [mugStage(), NEIGHBORS.includes('mug'), !!W0.buildings.cafe, !!W0.buildings.h_mug, hasSpecial('friend_mug'),
        sign >= 0 && !isl().ents.some(e => e.propIdx === sign), lot >= 0 && !isl().ents.some(e => e.propIdx === lot)].join();
      out.mail = JSON.stringify(S.mail || []).includes('OPEN');
      // the café: Muggy behind the counter, the first cup free, a coffee perks Sarah up, one to go
      const seg = planNow('mug', 10);
      out.works = !!seg && seg.spot === 'cafe';
      await enterBuilding('cafe');
      NPCs.place(true);
      out.inside = G.area.id === 'cafe' && NPCs.get('mug').area === 'cafe';
      const m0 = S.money;
      // (a latte, for here, just Sarah: no friend texted)
      answers = [0, 0, 1];
      await cafeMenu();
      out.free = S.money === m0 && bonusOn('speed') && S.stats.coffees === 1;
      S.bonus = null;
      answers = [1, 1];
      await cafeMenu();
      out.toGo = S.money === m0 - 350 && pocketCount('mocha') === 1;
      await eatItem(S.pocket.findIndex(s => s && s.id === 'mocha'));
      out.perk = bonusOn('speed');
    } finally { UI.say = say; UI.ask = ask; window.specialCard = card; }
    return out;
  });
  assert.deepEqual(res, { notYet: true, letter: true, story: true, spot: true, noShovel: true, dug: true, oncePerDay: true, five: '3,5,true',
    notHere: true, mended: '4,0,true,museum', due: true, visit: 'true,6,true,true', open: '7,true,true,true,true,true,true', mail: true,
    works: true, inside: true, free: true, toGo: true, perk: true });
  await page.close();
});

test('furniture turns four ways (its footprint turns with it); neighbors with nothing to do sit on a bench or look through the telescope', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(async () => { __dbg.setTime(10, 13, 11); await goHome(); });
  await page.waitForFunction(() => G.area.id === 'home');
  const res = await page.evaluate(async () => {
    const out = {}, a = G.area, f = a.floor;
    S.house.items = []; placeFurniture(a, S.house.items);
    __dbg.give('shelf_book', 1);
    await Decor.enter();
    Decor.held = 'shelf_book'; Decor.rot = 0; Decor.turn();
    out.held = Decor.rot;
    const x = f.x0 + 2, y = f.y0 + 2;
    out.placed = Decor.place(x, y);
    const it = S.house.items[0];
    out.item = [it.rot, it.x, it.y].join();
    out.foot = JSON.stringify(furnWH(furnDef('shelf_book'), it.rot));
    // turned again where it stands: front to back, as wide as before
    Decor.sel = 0; Decor.turn();
    out.turned = S.house.items[0].rot;
    // the wall pieces and rugs don't turn
    out.wall = turnable({ kind: 'wall' }) || turnable({ kind: 'rug' });
    Decor.exit();
    placeFurniture(a, S.house.items);
    const e = a.ents.find(e => e.furn && e.item === S.house.items[0]);
    out.ent = e && e.rot;
    out.blocked = [a.blockedAt(it.x, it.y), a.blockedAt(it.x + 1, it.y)].join();
    // an old save's pieces have no rot: they face the front
    out.old = JSON.stringify(furnWH(furnDef('shelf_book'), undefined));
    // a lamp switches off and on with a tap, and stays as she left it
    S.house.items.push({ id: 'lamp_floor', x: f.x0 + f.w - 2, y: f.y0 + 1, flip: false });
    placeFurniture(a, S.house.items);
    const lamp = () => a.ents.find(e => e.furn && e.item.id === 'lamp_floor');
    await useFurniture(lamp());
    const off = !lamp().light && S.house.items.find(i => i.id === 'lamp_floor').off === true;
    await useFurniture(lamp());
    out.lamp = off && !!lamp().light && !S.house.items.find(i => i.id === 'lamp_floor').off;
    // a fish, a shell or a gem can be set down like the food and flowers
    const fish = FISHES.find(q => q.id !== 'boot').id;
    __dbg.give(fish, 1); __dbg.give('scallop', 1);
    out.things = furnDef(fish).kind === 'top' && furnDef('scallop').thing === 1 && Decor.owned()[fish] === 1 && Decor.owned().scallop === 1;
    // a painting of Sarah's on an easel on the floor: put away, it's the painting again
    const A = artState(), id = 'ptg_' + (A.seq++);
    A.pieces[id] = { id, name: 'Test', px: '1'.repeat(ART_W * ART_H), frame: 'gold', day: Clock.dayNum() };
    registerArt(A.pieces[id]);
    __dbg.give(id, 1);
    await Decor.enter();
    Decor.held = id + '_easel';
    const easel = Decor.place(f.x0 + 1, f.y0 + f.h - 2);
    const k = S.house.items.findIndex(i => i.id === id + '_easel');
    const kinds = [furnDef(id).kind, furnDef(id + '_stand').kind, furnDef(id + '_easel').kind].join();
    const gone = !Decor.owned()[id];
    Decor.store(k);
    out.art = easel && k >= 0 && kinds === 'wall,top,floor' && gone && Decor.owned()[id] === 1 && !S.storage[id + '_easel'];
    Decor.exit();
    return out;
  });
  assert.deepEqual(res, { held: 1, placed: true, item: res.item, foot: '{"w":1,"h":2}', turned: 2, wall: false, ent: 2, blocked: 'true,true', old: '{"w":2,"h":1}', lamp: true, things: true, art: true });
  assert.match(res.item, /^1,/);
  // a neighbor near a bench sits on it for a while; one at the lookout looks through the telescope
  const idle = await page.evaluate(async () => {
    await leaveInterior();
    const out = {}, isl = G.areas.island;
    const bench = benches()[0], n = NPCs.get('maki');
    n.area = 'island'; n.sleeping = false; n.script = false; n.path = null; n.idle = null; n.talking = false;
    n.x = (bench.x + 0.5) * TILE; n.y = (bench.y + 2.5) * TILE; n.anchor = [bench.x, bench.y + 2]; n.radius = 2; n.want = { x: n.x, y: n.y }; n.fixed = false;
    out.bench = idleBench(n, isl) && !!n.benchIdle && !!n.want.sit;
    for (let i = 0; i < 600 && n.path; i++) updateNPC(n, isl);
    out.sat = isSeated(n);
    n.benchIdle.until = G.t; updateNPC(n, isl);
    out.up = !n.benchIdle && !n.want.sit;
    const s = W0.spots.lookout, c = NPCs.get('chili');
    c.area = 'island'; c.sleeping = false; c.script = false; c.path = null; c.idle = null; c.talking = false;
    c.x = (s.x + 1.5) * TILE; c.y = (s.y + 0.5) * TILE; c.anchor = [s.x, s.y]; c.radius = 2; c.fixed = false;
    out.scope = idleScope(c, isl);
    for (let i = 0; i < 600 && c.path; i++) updateNPC(c, isl);
    out.looking = [c.idle && c.idle.kind, c.dir].join();
    // one at a time
    const k = NPCs.get('kai'); k.anchor = [s.x, s.y]; k.radius = 2;
    out.oneAtATime = !idleScope(k, isl);
    out.look = typeof idleLook(100, 3) === 'number';
    // on the way somewhere past the drinking fountain, some days a neighbor stops for a drink, then carries on
    const f = W0.props.find(p => p.kind === 'drinkfountain'), day = Clock.dayNum();
    const who = NEIGHBORS.map(id => NPCs.get(id)).find(m => m && !m.def.spring && hash32(S.seed + ':sip:' + m.id + ':' + day) % 3 === 0);
    who.area = 'island'; who.sleeping = false; who.script = false; who.idle = null; who.talking = false; who.sipDay = null; who.segKey = 'test';
    who.x = (f.x - 1 + 0.5) * TILE; who.y = (f.y + 1 + 0.5) * TILE + 4;
    who.path = [[f.x - 2, f.y + 2], [f.x - 3, f.y + 2], [f.x - 4, f.y + 2], [f.x - 5, f.y + 2]]; who.travel = true;
    sipCheck(who);
    for (let i = 0; i < 600 && who.path; i++) updateNPC(who, isl);
    out.sip = [who.idle && who.idle.kind, who.dir, Math.floor(who.x / TILE) === f.x].join();
    who.idle.until = G.t; updateNPC(who, isl);
    out.onward = !who.idle && who.segKey === null && who.sipDay === day;
    return out;
  });
  assert.deepEqual(idle, { bench: true, sat: true, up: true, scope: true, looking: 'scope,up', oneAtATime: true, look: true, sip: 'sip,up,true', onward: true });
  await page.close();
});

test("the designer (beta): the island's things moved, turned, added and taken away, a room's furniture too, neighbors' likes; saved, every game starts from it", async () => {
  let page = await device();
  try {
    await page.evaluate(() => __dbg.quickStart());
    await page.waitForFunction(() => G.mode === 'play');
    const island = await page.evaluate(() => {
      const out = { edit: Design.edit, rev: Design.rev };
      __dbg.setTime(10, 13, 11);
      IslandEdit.open({ design: true });
      out.on = IslandEdit.on && IslandEdit.design;
      const spot = (p0) => { for (let r = 2; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = p0.x + dx, y = p0.y + dy; if (!IslandEdit.whyNot(x, y)) return [x, y]; } return null; };
      // a bench, turned to face east and moved
      const i = W0.props.findIndex((p, k) => p.kind === 'bench' && !propGone(k) && k < WORLD_PROPS);
      const b0 = { x: W0.props[i].x, y: W0.props[i].y };
      IslandEdit.pickUp(Design.thingAt(b0.x, b0.y));
      Design.turn(IslandEdit);
      out.footTurned = [IslandEdit.held.w, IslandEdit.held.rows].join();
      const s1 = spot(b0);
      IslandEdit.drop(s1[0], s1[1]);
      out.moved = JSON.stringify(Design.d.props[i]) === JSON.stringify({ x: s1[0], y: s1[1], rot: 1 });
      const e1 = G.areas.island.ents.find(e => e.propIdx === i);
      out.ent = !!e1 && e1.rot === 1 && G.areas.island.blockedAt(s1[0], s1[1] + 1);
      // a lamp taken away
      const j = W0.props.findIndex((p, k) => p.kind === 'lamp' && !propGone(k));
      IslandEdit.pickUp(Design.thingAt(W0.props[j].x, W0.props[j].y));
      Design.remove(IslandEdit);
      out.gone = !!Design.d.props[j].gone && !G.areas.island.ents.some(e => e.propIdx === j);
      // a garden gnome added
      Design.pickNew(IslandEdit, 'disp', 'dp_gnome');
      const s2 = spot(b0);
      IslandEdit.drop(s2[0], s2[1]);
      out.added = Design.d.added.length === 1 && W0.props.length === WORLD_PROPS + 1 && G.areas.island.ents.some(e => e.propIdx === WORLD_PROPS && e.kind === 'display');
      // undo takes the gnome back off; doing it again puts it back
      Design.back();
      out.undo = W0.props.length === WORLD_PROPS;
      Design.pickNew(IslandEdit, 'disp', 'dp_gnome');
      IslandEdit.drop(s2[0], s2[1]);
      // stairs: cut into a cliff's face near the square (three tiles wide, two rows), taken away, and cut again
      IslandEdit.stairs = true;
      let cliff = null;
      for (let r = 4; r < 60 && !cliff; r++) for (let dy = -r; dy <= r && !cliff; dy++) for (let dx = -r; dx <= r && !cliff; dx++) { const x = s1[0] + dx, y = s1[1] + dy; if (Design.stairAt(x, y).tiles) cliff = [x, y]; }
      const tiles = Design.stairAt(cliff[0], cliff[1]).tiles;
      IslandEdit.tap((cliff[0] + 0.5) * TILE, (cliff[1] + 0.5) * TILE);
      out.stairs = tiles.every(([x, y]) => RAMPS.has(x + ',' + y) && W0.coll[y][x] === '0' && !G.areas.island.blockedAt(x, y)) && Design.d.stairs.add.length === 6;
      IslandEdit.tap((tiles[0][0] + 0.5) * TILE, (tiles[0][1] + 0.5) * TILE);
      out.stairsGone = tiles.every(([x, y]) => !RAMPS.has(x + ',' + y) && W0.coll[y][x] === '1') && Design.d.stairs.add.length === 0;
      IslandEdit.tap((cliff[0] + 0.5) * TILE, (cliff[1] + 0.5) * TILE);
      IslandEdit.stairs = false;
      IslandEdit.close();
      window._t = { i, j, s1, s2, tiles };
      return out;
    });
    assert.deepEqual(island, { edit: true, rev: 0, on: true, footTurned: '1,2', moved: true, ent: true, gone: true, added: true, undo: true, stairs: true, stairsGone: true });
    // a room: Waffle's shop, one piece turned, one taken away, a chair added
    await page.evaluate(() => __dbg.enter('displays'));
    await page.waitForFunction(() => G.area.id === 'displays');
    // (and it stays open: the watchdog that ends decorating outside the house leaves the designer alone)
    await page.evaluate(() => Decor.enter({ design: true }));
    await page.waitForTimeout(2500);
    const room = await page.evaluate(() => {
      const out = {}, a = G.area;
      out.on = Decor.on && Decor.design === 'displays';
      const k = a.items.findIndex(it => furnDef(it.id).kind === 'floor' && furnDef(it.id).w === 1 && (furnDef(it.id).h || 1) === 1 && it.on == null);
      const key = a.items[k].o;
      Decor.sel = k; Decor.turn();
      out.turned = Design.d.rooms.displays.moved[key].rot === 1;
      const g = a.items.findIndex((it, n) => n !== k && furnDef(it.id).kind === 'floor' && !a.items.some(t => t.on === n));
      const gkey = a.items[g].o;
      Decor.store(g);
      out.gone = !!Design.d.rooms.displays.gone[gkey];
      let free = null;
      for (let y = a.floor.y0; y < a.floor.y0 + a.floor.h && !free; y++) for (let x = a.floor.x0; x < a.floor.x0 + a.floor.w && !free; x++) if (Decor.fit('chair_wood', x, y)) free = [x, y];
      Decor.held = 'chair_wood'; Decor.rot = 3;
      Decor.place(free[0], free[1]);
      out.added = JSON.stringify(Design.d.rooms.displays.added) === JSON.stringify([{ id: 'chair_wood', x: free[0], y: free[1], rot: 3 }]);
      Decor.exit();
      window._t.room = { key, gkey, free };
      return out;
    });
    assert.deepEqual(room, { on: true, turned: true, gone: true, added: true });
    await page.evaluate(() => __dbg.at('plaza'));
    await page.waitForFunction(() => G.area.id === 'island');
    // what the neighbors like: Maki never reads and loves fishing, and never goes to the beach
    const likes = await page.evaluate(async () => {
      const N = Design.work().npcs;
      N.maki = { acts: { book: 0, fish: 3 }, spots: { beach: 0 } };
      const w = { beach: 2, plaza: 1 };
      designSpots('maki', w);
      const ok = Design.likeWeight('maki', 'book', 4) === 0 && Design.likeWeight('maki', 'fish', 1) === 6 && Design.likeWeight('kai', 'fish', 4) === 4 && !('beach' in w) && w.plaza === 1;
      // an area drawn round the campsite (two corners), named; a neighbor there is "at the campfire"; Kai never goes there
      const c = W0.spots.campsite;
      Design.work().areas = [{ id: 'a1', name: 'the campfire', rects: [] }];
      IslandEdit.open({ design: true }); IslandEdit.areaMode = true; IslandEdit.areaId = 'a1';
      IslandEdit.tap((c.x - 2 + 0.5) * TILE, (c.y - 2 + 0.5) * TILE); IslandEdit.tap((c.x + 2 + 0.5) * TILE, (c.y + 2 + 0.5) * TILE);
      IslandEdit.close();
      N.kai = { areas: { a1: 0 } };
      const w2 = { campsite: 2, beach: 1 };
      designSpots('kai', w2);
      const area = JSON.stringify(Design.d.areas[0].rects) === JSON.stringify([[c.x - 2, c.y - 2, 5, 5]]) && placeName('maki', 'campsite') === 'at the campfire' && !('campsite' in w2) && w2.beach === 1;
      return { ok, area, saved: await Design.save(), rev: Design.rev, dirty: Design.dirty };
    });
    assert.deepEqual(likes, { ok: true, area: true, saved: true, rev: 1, dirty: false });
    const t = await page.evaluate(() => window._t);
    // a new game (another device) starts from the design
    await page.close();
    page = await device();
    await page.evaluate(() => __dbg.quickStart());
    await page.waitForFunction(() => G.mode === 'play');
    const after = await page.evaluate(async (t) => {
      const out = {}, p = W0.props[t.i], isl = G.areas.island;
      out.bench = [p.x, p.y, p.rot].join() === [t.s1[0], t.s1[1], 1].join() && isl.ents.some(e => e.propIdx === t.i && e.rot === 1);
      out.lamp = !!W0.props[t.j].gone && !isl.ents.some(e => e.propIdx === t.j);
      out.gnome = W0.props[WORLD_PROPS] && W0.props[WORLD_PROPS].disp === 'dp_gnome' && isl.ents.some(e => e.propIdx === WORLD_PROPS);
      out.likes = Design.likeWeight('maki', 'book', 4) === 0 && Design.areas().length === 1 && placeName('maki', 'campsite') === 'at the campfire';
      out.stairs = t.tiles.every(([x, y]) => RAMPS.has(x + ',' + y) && W0.coll[y][x] === '0');
      __dbg.setTime(10, 13, 11);
      await enterRoom('displays');
      const a = G.area;
      out.room = a.items.some(it => it.o === t.room.key && it.rot === 1) && !a.items.some(it => it.o === t.room.gkey) && a.items.some(it => it.added && it.id === 'chair_wood' && it.x === t.room.free[0] && it.rot === 3);
      // Sarah's own house stays hers
      out.home = !Design.canRoom({ interior: true, floor: {}, id: 'home' });
      return out;
    }, t);
    assert.deepEqual(after, { bench: true, lamp: true, gnome: true, likes: true, stairs: true, room: true, home: true });
    assert.deepEqual(page.problems, []);
  } finally {
    // (the next tests start from the island as it ships)
    await page.evaluate(async () => { const r = await (await fetch('/api/design')).json(); await fetch('/api/design', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Sarah': '1' }, body: JSON.stringify({ design: { v: 1 }, rev: r.rev }) }); }).catch(() => {});
    await page.close();
  }
});

test("the Friends app: a tap on a friend opens their page (what they're like, work, loves and likes, friends, and what they've done with Sarah)", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => {
    for (const id of ['maki', 'sully', 'coco']) { const r = rel(id); r.met = true; r.pts = 60; }
    const r = rel('sully'); r.ms2 = Clock.dayNum() - 3; r.given = 2; r.nick = 'Kiddo';
    remember('sully', 'game', { game: 'tag' });
    S.bonds = S.bonds || {}; S.bonds[bondKey('sully', 'coco')] = 8;
    appFriends();
  });
  await page.click('#panel .row:has-text("Sully")');
  await page.waitForSelector('#panel .prof-head');
  const text = await page.$eval('#panel', (p) => p.textContent);
  for (const want of ['Gruff, big-hearted', 'the pottery studio', 'Kiddo', 'Down by the harbor', 'Best friend', 'Coco', '2 gifts from you', 'You had a game of tag together', 'Friends', 'since']) assert.ok(text.includes(want), `the page says "${want}"`);
  await page.click('#panel .back');
  await page.waitForSelector('#panel .row:has-text("Maki")');
  // friendship is earned over days: each kind of thing counts once a day with each neighbor
  const once = await page.evaluate(() => {
    const r = rel('maki'), p0 = r.pts;
    addPts('maki', 3, 'favor'); const p1 = r.pts;
    addPts('maki', 3, 'favor'); const p2 = r.pts;
    addPts('maki', 2, 'hangout'); const p3 = r.pts;
    r.got.day--; addPts('maki', 3, 'favor');
    return [p1 - p0, p2 - p1, p3 - p2, r.pts - p3].join();
  });
  assert.equal(once, '3,0,2,3');
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("the island flag's poles by the Town Hall and at the end of the pier; the Town Hall's desk on the honor system (the Council comes to the house to judge)", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, poles = W0.props.filter(p => p.kind === 'flagpole'), th = W0.buildings.townhall, pier = W0.pier;
    out.poles = poles.length === 2 && poles.some(p => Math.abs(p.x - th.x) <= 3 && p.y >= th.y && p.y <= th.y + th.h + 2) && poles.some(p => p.x >= pier.x0 && p.x <= pier.x1 && p.y === pier.y1);
    out.solid = poles.every(p => G.areas.island.blockedAt(p.x, p.y)) && G.areas.island.ents.filter(e => e.kind === 'flagpole').length === 2;
    // a save from before the poles: whatever of Sarah's stood there comes back to her storage
    const st = JSON.parse(JSON.stringify(S)); delete st.flags.flags9;
    st.deco = { moved: {}, gone: {}, placed: [{ id: 'dp_gnome', x: poles[0].x, y: poles[0].y }] };
    const m = migrate(st);
    out.migrate = m.deco.placed.length === 0 && m.storage.dp_gnome >= 1;
    // the desk: a bell and a card, the menu all the same, nobody from the Council behind it
    const said = [], say = UI.say;
    UI.say = async (who, t) => { said.push(String(who) + ': ' + [].concat(t).join(' ')); };
    try {
      ROOMS.townhall = ROOMS.townhall || { w: 15, h: 7, name: 'Town Hall', build: a => buildTownHall(a) };
      const a = buildRoom('townhall');
      out.noCouncil = !a.ents.some(e => e.kind === 'judge');
      await civicCounter('townhall');
      out.card = said.some(t => /^null: .*THE COUNCIL IS OUT/.test(t)) && !said.some(t => /^floret/.test(t)) && !document.getElementById('panel').hidden;
    } finally { UI.say = say; UI.close(true); }
    return out;
  });
  assert.deepEqual(res, { poles: true, solid: true, migrate: true, noCouncil: true, card: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('every screen opens without a problem: the phone and its apps, the pocket, the shops, the cooking, the board, the laptop, every Town Hall, Post Office and Bank screen in every state', async () => {
  const page = await device();
  await page.evaluate(() => { localStorage.setItem('sc-current', ''); localStorage.setItem('sc-civic', '1'); });
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const failed = await page.evaluate(async () => {
    __dbg.setTime(11, 13, 11);
    const out = [], wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const closeAll = () => {
      for (const f of [() => Studio.on && Studio.close(), () => BigMap.on && BigMap.close(), () => Photo.on && Photo.stop(), () => Decor.on && Decor.exit(),
        () => IslandEdit.on && IslandEdit.close(), () => UI.hideDialog(), () => UI.close(true)]) { try { f(); } catch (e) { out.push('closing: ' + e.message); } }
    };
    // (each opened, given a moment to draw, and closed again; what it throws, or leaves on the console, is a failure)
    const open = async (name, fn) => {
      try { const r = fn(); if (r && r.catch) r.catch((e) => out.push(name + ': ' + e.message)); } catch (e) { out.push(name + ': ' + e.message); }
      await wait(120);
      if (!document.querySelector('#panel:not([hidden])') && !BigMap.on && !Photo.on && !Decor.on && !IslandEdit.on && !UI.dialogOpen) out.push(name + ': nothing opened');
      closeAll();
      await wait(30);
    };
    await open('phone', () => openPhone());
    for (const [id] of APPS) {
      if (['save', 'gohome', 'home', 'camera'].includes(id)) continue;          // (they leave, ask or need the house: below)
      await open('app ' + id, () => openApp(id));
    }
    await open('camera', () => openApp('camera'));
    await open('pocket', () => openPocket());
    await open("Fortune's: buy", () => shopBuy());
    await open("Fortune's: sell", () => shopSell());
    await open("Clementine's", () => shopClothes(true));
    await open("Waffle's", () => displaysShop());
    await open('cooking', () => openCooking());
    await open('wardrobe', () => openWardrobe());
    await open('the board', () => openBoard());
    await open('the laptop', () => openLaptop());
    for (const id of Object.keys(CIVIC_SCREENS)) {
      const states = (CIVIC_LIVE[id] ? ['Yours'] : []).concat(CIVIC_SCREENS[id].states || []);
      for (const st of states) await open(`civic ${id} (${st})`, () => civicScreen(id, st));
    }
    // every neighbor's talk menu (met and not yet met): what they say is skipped, and each question answered with its
    // last choice (goodbye, or no), so every menu is opened and left
    const say = UI.say, ask = UI.ask, menus = {};
    let cur = null;
    UI.say = async () => {};
    UI.ask = async (who, q, opts) => { (menus[cur] = menus[cur] || []).push(opts.length); return opts.length - 1; };
    try {
      for (const met of [false, true]) for (const id of NEIGHBORS.concat(['joe', 'goat', 'fortune', 'floss', 'waffle', 'wasabi'])) {
        const n = NPCs.get(id);
        if (!n) continue;
        cur = id + (met ? ' (a friend)' : '');
        if (met) { rel(id).met = true; rel(id).pts = HEARTS[4]; }
        n.talking = false; n.script = false;
        try { await Promise.race([talkTo(n), wait(4000).then(() => out.push('talk ' + cur + ': still going after 4 s'))]); } catch (e) { out.push('talk ' + cur + ': ' + e.message); }
        n.talking = false; G.busy = 0;
      }
    } finally { UI.say = say; UI.ask = ask; }
    for (const id of NEIGHBORS) if (!menus[id + ' (a friend)']) out.push('talk ' + id + ': no menu');
    closeAll();
    // and at home: decorating
    await goHome();
    await wait(200);
    await open('decorate', () => openApp('home'));
    for (const tab of ['pocket', 'storage']) await open('pocket at home: ' + tab, () => openPocket(null, tab));
    return out;
  });
  assert.deepEqual(failed, []);
  // (the Bank's market and the zip code reach the real world through the server, which this test machine can't: those
  // screens show their "service down" state, and the browser notes the failed fetch)
  assert.deepEqual(page.problems.filter((p) => !/status of 502/.test(p)), []);
  await page.close();
});

test("every shop sells: something bought at Clementine's, Waffle's, IslandMart and Mac's, the way a player does", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => { __dbg.setTime(11, 0, 14); S.money = 100000; Save.touch(); });
  // in a shop's screen: tap the first thing, then the button that buys it
  const buyFirst = async (open) => {
    await page.evaluate(open);
    await page.waitForSelector('#panel .store-list .card');
    const before = await page.evaluate(() => S.money);
    await page.click('#panel .store-list .card');
    await page.locator('#panel .store-pick .btn').first().click();
    const spent = await page.evaluate((m) => m - S.money, before);
    await page.evaluate(() => UI.close(true));
    return spent > 0;
  };
  const clothes = await buyFirst(() => { shopClothes(true); });
  const got = await page.evaluate(() => S.pocket.some((s) => s && ['outfit', 'acc'].includes(ITEMS[s.id].type)));
  const stored = () => page.evaluate(() => Object.values(S.storage).reduce((t, n) => t + n, 0));
  const kept0 = await stored();
  const displays = await buyFirst(() => { displaysShop(); });
  const sent = (await stored()) === kept0 + 1;
  const mart = await buyFirst(() => { openLaptop(); });
  const box = await page.evaluate(() => !!pendingBox());
  // Mac's: a dish from today's menu, to go (the menu tapped as a player would, the question answered "To go")
  await page.evaluate(() => {
    __dbg.enter('restaurant');
    window.__ask = UI.ask; window.__say = UI.say; window.__m0 = S.money;
    UI.ask = async (who, q, opts) => Math.max(0, opts.findIndex((o) => /^To go/.test(o)));
    UI.say = async () => {};
    window.__order = orderFood();
  });
  await page.click('#panel .list .row');
  const meal = await page.evaluate(async () => {
    await Promise.race([window.__order, new Promise((r) => setTimeout(r, 4000))]);
    UI.ask = window.__ask; UI.say = window.__say;
    return S.money < window.__m0 && S.pocket.some((s) => s && ITEMS[s.id].type === 'dish');
  });
  assert.deepEqual({ clothes, got, displays, sent, mart, box, meal }, { clothes: true, got: true, displays: true, sent: true, mart: true, box: true, meal: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("Sarah's tools, the way a player uses them: wood from a tree, then the tree felled and its stump dug up, a hole dug, a fruit tree shaken, a fish caught", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    __dbg.setTime(11, 0, 14);
    const out = {}, a = G.areas.island, ask = UI.ask, say = UI.say, F = forest();
    UI.ask = async () => 0; UI.say = async () => {};
    try {
      // a plain tree with open ground beside it
      const t = a.ents.find((e) => e.kind === 'tree' && !e.fruit && !a.blockedAt(e.tx, e.ty + 1));
      __dbg.teleport('island', t.tx, t.ty + 1, 'up');
      const wood0 = S.stats.wood || 0;
      for (let i = 0; i < 3; i++) await chopTree(t);
      out.wood = (S.stats.wood || 0) - wood0;
      await chopTree(t);
      out.felled = !!(F.chopped[t.id] && F.chopped[t.id].stump) && !a.ents.includes(t);
      await digAt(t.tx, t.ty);
      out.stumpGone = !a.ents.some((e) => e.kind === 'stump' && e.tx === t.tx && e.ty === t.ty);
      // a hole in open grass (the first spot near the stump with nothing standing over it)
      const holes0 = F.holes.length;
      for (let r = 2; r < 14 && F.holes.length === holes0; r++) for (let dx = -r; dx <= r && F.holes.length === holes0; dx++) {
        const x = t.tx + dx, y = t.ty + r;
        if (a.blockedAt(x, y) || a.blockedAt(x, y - 1) || groundChar(x, y) !== 'g' || pathAt(x, y)) continue;
        __dbg.teleport('island', x, y - 1, 'down');
        await digAt(x, y);
      }
      const h = F.holes[F.holes.length - 1];
      out.hole = F.holes.length === holes0 + 1 && !!a.ents.find((e) => e.forest && e.kind === 'hole' && e.tx === h.x && e.ty === h.y);
      // a fruit tree, shaken: its fruit falls round the trunk
      const ft = a.ents.find((e) => e.kind === 'fruittree' && e.fruit && treeHasFruit(e));
      __dbg.teleport('island', ft.tx, ft.ty + 1, 'up');
      const drops0 = S.drops.length;
      await shakeTree(ft);
      out.fruit = S.drops.length > drops0 && S.trees[ft.id] === Clock.dayNum();
      // fishing off the beach: cast, wait for the bite, reel it in
      __dbg.give('rod', 1);
      const fs = __dbg.fishSpot();
      __dbg.teleport('island', fs[0], fs[1], 'down');
      const caught0 = S.stats.fish || 0, pocket0 = S.pocket.filter(Boolean).length;
      Fishing.start(fs[0], fs[1] + 1, 's');
      for (let i = 0; i < 3000 && Fishing.st && Fishing.st.phase !== 'bite'; i++) Fishing.update();
      out.bite = !!Fishing.st && Fishing.st.phase === 'bite';
      if (Fishing.st) Fishing.st.fish = FISHES.find((f) => f.id !== 'boot').id;      // (not a crate, one cast in ten)
      await Promise.race([Fishing.catch(), new Promise((r) => setTimeout(r, 6000))]);
      out.fish = (S.stats.fish || 0) > caught0 || S.pocket.filter(Boolean).length > pocket0;
    } finally { UI.ask = ask; UI.say = say; G.busy = 0; }
    clearInterval(spCloser);
    return out;
  });
  assert.deepEqual(res, { wood: 3, felled: true, stumpGone: true, hole: true, fruit: true, bite: true, fish: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('growing and making, the way a player does: seeds planted in a plot and picked two days on, a dish cooked from what she has, a pot from the studio given to a friend', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    __dbg.setTime(10, 0, 14);
    const out = {}, ask = UI.ask, say = UI.say;
    UI.ask = async () => 0; UI.say = async () => {};
    try {
      // a seed in Sarah's first plot, grown in two days, then picked
      const seed = GD.veg.map((v) => 'seed_' + v).filter(farOk)[0], i = S.plots.findIndex((p) => !p);
      __dbg.give(seed, 1);
      await usePlot(i);
      out.planted = !!S.plots[i] && pocketCount(seed) === 0;
      S.plots[i].day -= 3;
      const crop = S.plots[i].seed, had = pocketCount(crop);
      await usePlot(i);
      out.picked = !S.plots[i] && pocketCount(crop) >= had + 2;
      // a recipe, cooked (the quick way: what's needed comes out of the pocket, the dish goes in)
      const r = RECIPES[0];
      for (const [k, n] of Object.entries(r.need)) __dbg.give(k, n);
      out.cooked = (await cookDish(r, true)) === true && pocketCount(r.id) >= 1 && Object.keys(r.need).every((k) => pocketCount(k) === 0);
      // a pot from the studio's hand-building, given to a neighbor: picked from the pocket as a player taps it
      const pot = __dbg.potPiece('frog', 'c'), n = NPCs.get('maki');
      rel('maki').met = true; rel('maki').giftDay = -1;
      n.area = G.area.id; n.sleeping = false; n.talking = false;
      const given0 = rel('maki').given || 0;
      const gift = giftFlow(n);
      for (let k = 0; k < 40 && !document.querySelector('#panel:not([hidden]) .grid .slot'); k++) await new Promise((r) => setTimeout(r, 50));
      document.querySelectorAll('#panel .grid .slot')[S.pocket.findIndex((q) => q && q.id === pot)].click();
      await Promise.race([gift, new Promise((r) => setTimeout(r, 4000))]);
      out.gave = !pocketCount(pot) && (rel('maki').given || 0) === given0 + 1;
    } finally { UI.ask = ask; UI.say = say; G.busy = 0; }
    clearInterval(spCloser);
    return out;
  });
  assert.deepEqual(res, { planted: true, picked: true, cooked: true, gave: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('the phone and the camera, the way a player uses them: a photo taken, an outfit changed in the wardrobe, a pot donated to the museum, a text answered, a letter read', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => { __dbg.setTime(11, 0, 14); __dbg.at('plaza'); });
  // the camera: a photo goes in the album
  const photos0 = await page.evaluate(() => Photos.list().length);
  await page.evaluate(() => { Photo.start(); Photo.snap(); });
  await page.waitForFunction((n) => Photos.list().length > n, photos0, { timeout: 15000 });
  await page.evaluate(() => Photo.stop());
  // the wardrobe: another outfit, tapped
  const outfit = await page.evaluate(() => {
    const other = Object.keys(ITEMS).filter((k) => ITEMS[k].type === 'outfit').map((k) => ITEMS[k].wear).find((o) => o && o !== S.player.outfit);
    if (!S.wardrobe.outfits.includes(other)) S.wardrobe.outfits.push(other);
    openWardrobe();
    return other;
  });
  await page.locator(`#panel .slot[title="${await page.evaluate((o) => ITEMS['out_' + o].name, outfit)}"]`).first().click();
  const wore = await page.evaluate((o) => S.player.outfit === o, outfit);
  await page.evaluate(() => UI.close(true));
  // a pot donated to the museum (Brulee's thanks skipped)
  const donated = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    const say = UI.say; UI.say = async () => {};
    try { const id = __dbg.potPiece('frog', 'c'); await donatePot(id); return artState().pots.includes(id) && !pocketCount(id); } finally { UI.say = say; }
  });
  // a text: "Where are you?" to a neighbor who's up, and their answer comes back
  const id = await page.evaluate(() => { const n = NPCs.list.find((m) => NEIGHBORS.includes(m.id) && !m.sleeping); rel(n.id).met = true; textThread(n.id); return n.id; });
  await page.click('#panel .pfoot .btn:has-text("Where are you?"), #panel button:has-text("Where are you?")');
  await page.waitForFunction((i) => textsOf(i).some((m) => !m.me && !m.sys), id, { timeout: 8000 });
  await page.evaluate(() => UI.close(true));
  // a letter in the Mail app, opened and read
  const read = await page.evaluate(() => {
    sendMail({ from: 'maki', subject: 'Test', body: 'A letter.' });
    const m = S.mail[S.mail.length - 1];
    appMail();
    const row = [...document.querySelectorAll('#panel .row')].find((r) => r.textContent.includes('Test'));
    row.click();
    return m.read === true;
  });
  assert.deepEqual({ wore, donated, read }, { wore: true, donated: true, read: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("making Sarah's look, the way a player does: a new hairstyle at Floss's chair, a design sewn at Clementine's machine, a prize from Chili's counter", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    __dbg.setTime(14, 0, 14);
    S.money = 50000;
    const out = {}, ask = UI.ask, say = UI.say, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    UI.ask = async () => 0; UI.say = async () => {};
    try {
      // the salon: another hairstyle, then "Do it!"
      const hair0 = look().hair, money0 = S.money;
      const chair = salonChair();
      for (let i = 0; i < 40 && !Salon.res; i++) await wait(50);
      Salon.L.hair = Object.keys(GD.sarahTpl.hair.styles).find((k) => k !== hair0);
      Salon.finish(true);
      await Promise.race([chair, wait(5000)]);
      out.salon = look().hair !== hair0 && S.money === money0 - SALON_PRICE;
      // the sewing machine: a design, made and in the wardrobe
      const outfits0 = S.wardrobe.outfits.length;
      const sew = sewingMachine();
      for (let i = 0; i < 40 && !Sewing.res; i++) await wait(50);
      Sewing.d.name = 'Test dress';
      Sewing.finish(Sewing.d);
      await Promise.race([sew, wait(5000)]);
      out.sewn = S.wardrobe.outfits.length === outfits0 + 1 && Object.values(designs()).some((d) => d.name === 'Test dress');
      // the prize counter: tickets for the first prize, delivered home (or to the pocket)
      addTickets(100000, true);
      const t0 = arc().tickets, got0 = (S.storage[PRIZES[0][0]] || 0) + pocketCount(PRIZES[0][0]);
      prizeCounter();
      document.querySelector('#panel .list .row .btn.green').click();
      out.prize = arc().tickets === t0 - PRIZES[0][1] && (S.storage[PRIZES[0][0]] || 0) + pocketCount(PRIZES[0][0]) === got0 + 1;
      UI.close(true);
    } finally { UI.ask = ask; UI.say = say; G.busy = 0; }
    clearInterval(spCloser);
    return out;
  });
  assert.deepEqual(res, { salon: true, sewn: true, prize: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('decorating the island and giving gifts, the way a player does: a lamp set down, moved and put away, a bench moved, an apple given to a neighbor', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    __dbg.setTime(14, 0, 14);
    const out = {}, E = IslandEdit, D = deco();
    /* a free spot near Sarah, a few tiles off, that the held thing can go */
    const spot = (not) => {
      const p = G.player, px = Math.floor(p.x / TILE), py = Math.floor(p.y / TILE);
      for (let r = 2; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = px + dx, y = py + dy;
        if (not && not[0] === x && not[1] === y) continue;
        if (!E.whyNot(x, y)) return [x, y];
      }
      return null;
    };
    const tapAt = (x, y) => { const h = E.held; E.tap((x + Math.floor((h.w - 1) / 2)) * TILE + 8, (y + h.rows - 1) * TILE + 8); };
    toStorage('dp_lamp', 1);
    E.open();
    // Set something down, then the lamp from the list
    [...document.querySelectorAll('#panel .chip')].find((c) => c.textContent.startsWith('Set something down')).click();
    [...document.querySelectorAll('#panel .list .row')].find((r) => r.textContent.includes('Street lamp')).click();
    const a = spot();
    tapAt(a[0], a[1]);
    const p0 = D.placed[D.placed.length - 1];
    out.down = !!p0 && p0.id === 'dp_lamp' && p0.x === a[0] && p0.y === a[1] && !(S.storage.dp_lamp > 0);
    // picked up again and moved somewhere else
    const h = displayRows(dispDef('dp_lamp'));
    E.tap(a[0] * TILE + 8, (a[1] + h - 1) * TILE + 8);
    const b = spot(a);
    tapAt(b[0], b[1]);
    out.moved = !E.held && p0.x === b[0] && p0.y === b[1];
    // and put away: back home in storage
    E.tap(b[0] * TILE + 8, (b[1] + h - 1) * TILE + 8);
    [...document.querySelectorAll('#panel .chip')].find((c) => c.textContent === 'Put it away').click();
    out.away = !D.placed.includes(p0) && S.storage.dp_lamp === 1;
    // one of the island's own benches moved
    const bench = G.areas.island.ents.find((e) => e.kind === 'bench' && e.propIdx != null && !e.hidden);
    E.pickUp(bench);
    const c = spot();
    tapAt(c[0], c[1]);
    out.bench = !!D.moved[bench.propIdx] && D.moved[bench.propIdx].join() === c.join();
    E.close();
    // a gift: Talk, then the apple from the pocket
    const ask = UI.ask, say = UI.say;
    UI.say = async () => {}; UI.ask = async () => 1;
    try {
      receive('apple', 2, true);
      const id = 'coco', n = NPCs.get(id), given = rel(id).given || 0;
      const flow = giftFlow(n);
      for (let i = 0; i < 40 && !document.querySelector('#panel .grid'); i++) await new Promise((r) => setTimeout(r, 50));
      const slot = [...document.querySelectorAll('#panel .grid > *')].find((s) => s.style.opacity !== '0.35' && s.querySelector('canvas'));
      slot.click();
      await Promise.race([flow, new Promise((r) => setTimeout(r, 5000))]);
      out.gift = (rel(id).given || 0) === given + 1 && rel(id).giftDay === Clock.dayNum() && pocketCount('apple') === 1;
    } finally { UI.ask = ask; UI.say = say; }
    clearInterval(spCloser);
    return out;
  });
  assert.deepEqual(res, { down: true, moved: true, away: true, bench: true, gift: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("a favor and a bigger house, the way a player does: \"Need anything?\" in the talk menu, the thing brought, paid; Ginger makes the house bigger and it's bigger inside", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const out = {}, ask = UI.ask, say = UI.say;
    /* answers the talk menu with the first option that matches, in order, else the last one ("See you!") */
    let want = [];
    UI.say = async () => {};
    UI.ask = async (w, t, opts) => { for (const re of want) { const i = opts.findIndex((o) => re.test(o)); if (i >= 0) return i; } return opts.length - 1; };
    // (now and then a thank-you is something special: its card is tapped away, as a player does)
    const closer = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    try {
      const id = 'coco', n = NPCs.get(id), T = Requests.st(), day = Clock.dayNum();
      rel(id).met = true;
      // a day when Coco wants something brought (the favor is from the seed, the day and the count)
      for (let s = T.seq; s < T.seq + 200; s++) {
        const keep = T.seq; T.seq = s;
        const t = Requests.make(n), rr = mulberry(hash32(S.seed + ':need:' + id + ':' + day + ':' + s));
        T.seq = keep;
        if (t.kind === 'bring' && !(rr() < 0.2 && hearts(id) >= 2)) { T.seq = s; break; }
      }
      const done0 = T.done;
      want = [/^Sure!$/, /^Need anything\?$/];
      await talkTo(n);
      const t = Requests.from(id) || T.list.find((q) => q.from === id);
      out.asked = !!t && t.kind === 'bring';
      if (t.state !== 'done') {
        receive(t.item, 1, true);
        const money0 = S.money;
        want = [/^Brought your/];
        await talkTo(n);
        out.paid = S.money > money0 || Object.keys(S.storage).length > 0;
      } else out.paid = true;
      out.done = T.done === done0 + 1 && t.state === 'done';
      // Ginger's workshop: Make my house bigger, then Build it
      S.money = 100000;
      const lvl = S.house.level, cost = HOUSE_EXPAND[lvl];
      want = [/^Make my house bigger$/, /^Build it \(/, /^Later$/];
      let rounds = 0;
      const ask2 = UI.ask;
      UI.ask = async (w, t2, opts) => { if (opts.includes('Make my house bigger') && rounds++) return opts.indexOf('Never mind'); return ask2(w, t2, opts); };
      await builderMenu();
      out.bigger = S.house.level === lvl + 1 && S.money === 100000 - cost;
    } finally { clearInterval(closer); UI.ask = ask; UI.say = say; G.busy = 0; }
    return out;
  });
  assert.deepEqual(res, { asked: true, paid: true, done: true, bigger: true });
  // inside, the house is the next size up
  await page.evaluate(() => enterRoom('home'));
  await page.waitForFunction(() => G.area && G.area.id === 'home');
  assert.deepEqual(await page.evaluate(() => [G.area.floor.w, G.area.floor.h, S.house.level].join()), await page.evaluate(() => HOUSE_SIZES[1].join() + ',1'));
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('friendship that shows: a neighbor who knows Sarah waves, a friend walks over to say hello, a good friend sits beside her on a bench, and a best friend greets her warmly', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {}, a = G.areas.island, p = G.player;
    const until = async (fn, ms) => { for (const end = Date.now() + ms; Date.now() < end; await wait(100)) if (fn()) return true; return false; };
    /* Sarah a few tiles from a neighbor who's free right now */
    const near = (id, d) => {
      const n = NPCs.get(id), nx = Math.floor(n.x / TILE), ny = Math.floor((n.y - 2) / TILE);
      for (let r = d; r < d + 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || a.blockedAt(nx + dx, ny + dy)) continue;
        const path = findPath(a, nx, ny, nx + dx, ny + dy, 1500);
        if (!path || path.length > d + 4) continue;
        p.x = (nx + dx + 0.5) * TILE; p.y = (ny + dy + 0.6) * TILE; p.path = null;
        return n;
      }
      return n;
    };
    const free = NPCs.here().filter((n) => Chats.free(n) && TALK[n.id] && !n.fixed && n.anchor && !n.def.goat && n.id !== 'joe');
    /* (whatever they're in the middle of, set aside) */
    const ready = (n) => { if (n.chat) Chats.end(n.chat); n.idle = null; n.path = null; n.chatCool = 0; return n; };
    // left to itself: someone who knows her (a heart) waves from where they are, with a word over their head
    const w = ready(free[0]);
    rel(w.id).met = true; rel(w.id).pts = HEARTS[1];
    near(w.id, 3);
    Greet.day = -1;
    // (the checks run every 45 frames and only now and then act: run them here as many times as it takes, w kept close
    // and free, so a busy test machine's slow frames don't decide it)
    for (let k = 0; k < 400 && !Greet.n; k++) {
      if (!Chats.free(w)) ready(w);
      if (Math.hypot(w.x - p.x, w.y - p.y) > 6 * TILE) near(w.id, 3);
      G.frame = (Math.floor(G.frame / 45) + 1) * 45 + 20;
      Greet.update();
    }
    out.waved = Greet.n > 0;
    out.bubble = await until(() => Object.keys(Greet.done).some((id) => Bubbles.map.has(NPCs.get(id))), 15000);
    // a heart's pose wears off (it used to stay on: the New Year's cheer)
    const g = NPCs.get(w.id);
    g.pose = 'wave'; g.poseT = 5;
    out.poseOff = await until(() => g.pose === null, 3000);
    // a friend (three hearts) walks over and says hello beside her
    const f = ready(free.find((n) => n !== w));
    rel(f.id).met = true; rel(f.id).pts = HEARTS[3];
    near(f.id, 5);
    out.came = Greet.comeOver(f);
    out.arrived = await until(() => !f.path && Math.hypot(f.x - p.x, f.y - p.y) < 2.5 * TILE, 15000);
    // a good friend (four hearts) sees her on a bench and sits in the other seat
    const b = benches().find((q) => !seatTaken(q, 0) && !seatTaken(q, 1));
    const bp = benchSeatPos(b, 0);
    p.x = bp.x; p.y = bp.y + TILE;
    await sitOnBench({ px: b.x, py: b.y });
    const s = ready(free.find((n) => n !== w && n !== f));
    rel(s.id).met = true; rel(s.id).pts = HEARTS[4];
    const sp = benchSeatPos(b, 1), [stx, sty] = a.nearestFree(Math.floor(sp.x / TILE) + 4, Math.floor(sp.y / TILE), 4);
    s.x = (stx + 0.5) * TILE; s.y = (sty + 0.5) * TILE + 4;
    out.sitting = !!p.sit && Greet.sitBy(s, p.sit);
    out.beside = await until(() => isSeated(s) && s.want.sit.b === b, 15000);
    // and talking to a best friend, the hello is warm now and then
    rel(s.id).pts = HEARTS[5];
    const lines = new Set();
    for (let i = 0; i < 200; i++) lines.add(openerLine(s, true));
    out.warm = [...lines].some((l) => OPEN_CLOSE.some((o) => l.includes(fillText(o).slice(0, 12)) || l.includes(o.slice(0, 12))));
    // a best friend walks along with her: Sarah moves on a few tiles and they keep up, then head off on their own
    if (p.sit) standUp(p);
    const wk = ready(free.find((n) => n !== w && n !== f && n !== s && !n.path && Chats.free(n)) || free.find((n) => n !== s));
    rel(wk.id).met = true; rel(wk.id).pts = HEARTS[5];
    near(wk.id, 2);
    out.walks = Greet.walkWith(wk) && wk.script;
    const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 2) / TILE);
    let moved = false;
    for (let r = 5; r < 9 && !moved; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      if (moved || a.blockedAt(sx + dx, sy + dy)) continue;
      const path = findPath(a, sx, sy, sx + dx, sy + dy, 1500);
      if (!path || path.length > r + 4) continue;
      p.x = (sx + dx + 0.5) * TILE; p.y = (sy + dy + 0.6) * TILE; moved = true;
    }
    out.kept = moved && await until(() => Math.hypot(wk.x - p.x, wk.y - p.y) < 2.6 * TILE, 15000);
    Greet.walkEnd(GREET_BYE);
    out.off = !wk.script && !wk.escort && !Greet.walk;
    return out;
  });
  assert.deepEqual(res, { waved: true, bubble: true, poseOff: true, came: true, arrived: true, sitting: true, beside: true, warm: true, walks: true, kept: true, off: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("the newcomers' houses: the first to stay while both plots are free lets Sarah pick, the other takes the plot that's left", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const said = [], say = UI.say, ask = UI.ask, asked = [];
    UI.say = async (w, t) => { said.push([].concat(t).join(' ')); };
    let answers = [];
    UI.ask = async (w, t, opts) => { asked.push(opts.join(' / ')); return answers.length ? answers.shift() : 0; };
    const out = {};
    try {
      // Muggy asks first: yes, and the plot by the west lane (its own is by the farm lane)
      mugState().stage = 5;
      answers = [0, 1];
      await mugAsk(NPCs.get('mug') || { emote: null });
      out.mugPicked = [mugStage(), newcomerLot('mug'), asked.some((q) => /West lane/i.test(q) && /farm lane/i.test(q))].join();
      mugMoveIn();
      const A = W0.lots.land_a, B = W0.lots.land_b, at = (b, l) => !!b && b.x === l.x && b.y === l.y;
      out.mugHouse = at(W0.buildings.h_mug, A);
      // then Shrimpy: no question about where, the farm lane's plot is the one left
      seaState().stage = 7;
      asked.length = 0;
      answers = [0];
      await seaTalk(NPCs.get('scampi'));
      out.seaLot = [seaStage(), newcomerLot('scampi'), asked.length, said.some((l) => /plot by the farm lane it is/i.test(l))].join();
      seaState().stage = 8; seaState().day = Clock.dayNum();
      await seaMoveIn();
      out.seaHouse = at(W0.buildings.h_scampi, B);
      // both FOR SALE signs are down
      rebuildIsland();
      const signs = W0.props.map((p, i) => [p, i]).filter(([p]) => p.kind === 'sign_land');
      out.signs = signs.length > 0 && signs.every(([, i]) => !G.areas.island.ents.some((e) => e.propIdx === i));
    } finally { UI.say = say; UI.ask = ask; }
    return out;
  });
  assert.deepEqual(res, { mugPicked: '6,land_a,true', mugHouse: true, seaLot: '8,land_b,1,true', seaHouse: true, signs: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("the phone's own apps, the way a player uses them: a move from Moves, one of Joe's poems read again, Go home, and Save & quit back to the title, then Continue", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const until = async (fn, ms) => { for (const end = Date.now() + ms; Date.now() < end; await wait(50)) if (fn()) return true; return false; };
    const choose = async (label) => { await until(() => [...document.querySelectorAll('#choices .choice')].some((b) => b.textContent === label), 5000); [...document.querySelectorAll('#choices .choice')].find((b) => b.textContent === label).click(); };
    // Moves: the first move in the list, danced
    openApp('moves');
    document.querySelector('#panel .list button.row').click();
    out.moved = await until(() => G.busy > 0 || !!G.player.emote, 2000) && await until(() => !G.busy, 8000);
    // Joe's poems: one he's read her, opened again
    S.poems = [JOE_POEMS[0][0]];
    openApp('poems');
    document.querySelector('#panel .list button.row').click();
    out.poem = document.querySelector('#panel .letterbody').textContent.includes(JOE_POEMS[0][1][0]);
    UI.close(true);
    // Go home: asked, then through her front door
    const ask = askGoHome();
    await choose('Go home');
    await ask;
    out.home = await until(() => G.area && G.area.id === 'home', 8000);
    return out;
  });
  assert.deepEqual(res, { moved: true, poem: true, home: true });
  // Save & quit: back to the title without a file, then Continue carries on with the same island
  const money = await page.evaluate(() => { S.money = 12345; return S.money; });
  await page.evaluate(() => openApp('save'));
  await page.click('#panel button:has-text("Quit without a file")');
  await title(page);
  await play(page);
  assert.equal(await page.evaluate(() => S.money), money);
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('furniture that acts: a retro TV and a record player, sold at IslandMart in their woods; a tap at home switches each on and off, kept with the house', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const out = {};
    out.sold = ['tv_retro', 'record_player'].every((id) => laptopAll('furniture').includes(id) && FURN[id].colors && FURN[id].colors.length > 2 && FURN[id + '@' + FURN[id].colors[1]]);
    out.pictures = ['f_tv_retro', 'f_record_player'].every((f) => !!Assets.frames[f]);
    out.noMissing = Object.keys(paintTableMissing()).filter((id) => ACTING_FURN[id]).length === 0;
    // both in the house, a tap on each
    S.flags.homeIntro = true;
    await goHome();
    const f = G.area.floor;
    S.house.items.push({ id: 'tv_retro', x: f.x0 + 1, y: f.y0, flip: false }, { id: 'record_player@' + FURN.record_player.colors[1], x: f.x0 + 3, y: f.y0, flip: false });
    placeFurniture(G.area, S.house.items);
    const ent = (id) => G.area.ents.find((e) => e.furn && e.item && e.item.id.startsWith(id));
    const tv = ent('tv_retro'), rec = ent('record_player');
    out.offFirst = !furnOn(tv) && !furnOn(rec);
    UI.say = async () => {};
    await useFurniture(tv); await useFurniture(rec);
    out.on = furnOn(tv) && furnOn(rec) && S.house.items.filter((it) => it.play).length === 2;
    await useFurniture(tv);
    out.tvOff = !furnOn(tv) && furnOn(rec);
    // the globe on a table: a tap gives it a spin (in the flat view, which can't turn it, Sarah says so)
    S.house.items.push({ id: 'globe', x: f.x0 + 1, y: f.y0, on: S.house.items.indexOf(S.house.items.find((it) => it.id === 'tv_retro')) });
    placeFurniture(G.area, S.house.items);
    const said = [];
    UI.say = async (w, l) => { said.push(l); };
    const globe = G.area.ents.find((e) => e.furn && e.item && e.item.id === 'globe');
    await useFurniture(globe);
    out.globe = globe.spinT === G.t && said.some((l) => /globe/.test(l));
    return out;
  });
  assert.deepEqual(res, { sold: true, pictures: true, noMissing: true, offFirst: true, on: true, tvOff: true, globe: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('painting, the way a player does: a picture painted at the easel goes in the pocket, then donated, it hangs first in the museum gallery', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    // (now and then something special turns up, a card to tap away, as a player does)
    const spCloser = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    __dbg.setTime(14, 0, 14);
    const out = {}, say = UI.say, ask = UI.ask, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    UI.say = async () => {}; UI.ask = async () => 0;
    try {
      const A = artState(), n0 = Object.keys(A.pieces).length;
      const go = paintAtEasel('home');
      for (let i = 0; i < 40 && !Painter.res; i++) await wait(50);
      // a few strokes: the top half sky blue, a sun in the middle
      for (let i = 0; i < Painter.px.length / 2; i++) Painter.px[i] = 4;
      Painter.px[Math.floor(Painter.px.length / 2) - 8] = 3;
      Painter.finish({ px: Painter.px.map((v) => ART_CODE[v]).join(''), frame: 'gold', name: 'Test sunset' });
      await Promise.race([go, wait(5000)]);
      const id = Object.keys(A.pieces).find((k) => A.pieces[k].name === 'Test sunset');
      out.painted = Object.keys(A.pieces).length === n0 + 1 && !!id && pocketCount(id) === 1;
      const d0 = S.stats.donated || 0;
      await donateArt(id, false);
      out.donated = A.museum.includes(id) && pocketCount(id) === 0 && (S.stats.donated || 0) === d0 + 1 && (!Array.isArray(A.hung) || A.hung[0] === id);
    } finally { UI.say = say; UI.ask = ask; }
    clearInterval(spCloser);
    return out;
  });
  assert.deepEqual(res, { painted: true, donated: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("island jobs, the way a player does: packages handed over through the talk menu, the dock sign repainted, apples handed in at the Town Hall's screen", async () => {
  const page = await device();
  await page.evaluate(() => { localStorage.setItem('sc-current', ''); localStorage.setItem('sc-civic', '1'); });
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(10, 0, 14);
    const out = {}, ask = UI.ask, say = UI.say;
    let want = [];
    UI.say = async () => {};
    UI.ask = async (w, t, opts) => { for (const re of want) { const i = opts.findIndex((o) => re.test(o)); if (i >= 0) return i; } return opts.length - 1; };
    const closer = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    try {
      const J = jobsState();
      // packages for Coco and Kai, handed over from their talk menus
      for (const id of ['coco', 'kai']) rel(id).met = true;
      const m0 = S.money;
      Jobs.take({ id: 'deliver', kind: 'deliver', n: 2, to: ['coco', 'kai'] });
      out.parcels = pocketCount('job_parcel') === 2;
      want = [/^A package for you!$/];
      for (const id of ['coco', 'kai']) { await talkTo(NPCs.get(id)); G.busy = 0; }
      out.delivered = !Jobs.active() && J.done.includes('deliver') && S.money > m0 && pocketCount('job_parcel') === 0;
      // the dock sign: walk up to it and paint
      Jobs.take({ id: 'sign', kind: 'sign', n: 3 });
      const sign = G.areas.island.ents.find((e) => e.kind === 'sign_island');
      await sign.interact();
      out.sign = !Jobs.active() && J.done.includes('sign');
      // three apples for the Council's display case, handed in with the screen's button
      S.pocket.forEach((q, i) => { if (q && ITEMS[q.id] && ITEMS[q.id].type === 'fruit') S.pocket[i] = null; });
      receive('apple', 3, true);
      Jobs.take({ id: 'collect', kind: 'collect', n: 3, what: 'fruit' });
      const m1 = S.money;
      civicScreen('jobs');
      [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'Hand them in').click();
      out.handedIn = !Jobs.active() && J.done.includes('collect') && pocketCount('apple') === 0 && S.money > m1;
      UI.close(true);
    } finally { clearInterval(closer); UI.ask = ask; UI.say = say; G.busy = 0; }
    return out;
  });
  assert.deepEqual(res, { parcels: true, delivered: true, sign: true, handedIn: true });
  assert.deepEqual(page.problems.filter((p) => !/502|Bad Gateway/.test(p)), []);
  await page.context().close();
});

test('on a phone, nothing spills sideways: the phone and its apps, the pocket, the shops, the cooking, the board, the laptop, every Town Hall, Post Office and Bank screen', async () => {
  const page = await device();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { localStorage.setItem('sc-current', ''); localStorage.setItem('sc-civic', '1'); });
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const spilled = await page.evaluate(async () => {
    __dbg.setTime(11, 13, 11);
    const out = [], wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const closeAll = () => { for (const f of [() => Studio.on && Studio.close(), () => BigMap.on && BigMap.close(), () => Photo.on && Photo.stop(), () => UI.hideDialog(), () => UI.close(true)]) { try { f(); } catch (e) { /* (closing) */ } } };
    /* what's open must fit the screen's width: the panel inside it, nothing in it wider than it can scroll, the page not wider than the phone */
    const check = async (name, fn) => {
      try { const r = fn(); if (r && r.catch) r.catch(() => {}); } catch (e) { out.push(name + ': ' + e.message); }
      await wait(150);
      const P = document.querySelector('#panel:not([hidden])'), W = innerWidth;
      if (P) {
        const r = P.getBoundingClientRect();
        if (r.left < -1 || r.right > W + 1) out.push(`${name}: the panel runs off the screen (${Math.round(r.left)} to ${Math.round(r.right)} of ${W})`);
        for (const e of P.querySelectorAll('*')) {
          const b = e.getBoundingClientRect();
          if (b.width && (b.right > W + 2 || b.left < -2) && getComputedStyle(e).position !== 'fixed' && !e.closest('[style*="overflow"], .grid, .list, .hscroll, .store-list')) { out.push(`${name}: ${e.tagName.toLowerCase()}.${(e.className || '').toString().split(' ')[0]} reaches ${Math.round(b.right)} of ${W}`); break; }
        }
      }
      if (document.documentElement.scrollWidth > W + 1) out.push(`${name}: the page is ${document.documentElement.scrollWidth} wide`);
      closeAll();
      await wait(30);
    };
    await check('phone', () => openPhone());
    for (const [id] of APPS) if (!['save', 'gohome', 'home', 'camera', 'map'].includes(id)) await check('app ' + id, () => openApp(id));
    await check('pocket', () => openPocket());
    await check("Fortune's: buy", () => shopBuy());
    await check("Fortune's: sell", () => shopSell());
    await check("Clementine's", () => shopClothes(true));
    await check("Waffle's", () => displaysShop());
    await check('cooking', () => openCooking());
    await check('wardrobe', () => openWardrobe());
    await check('the board', () => openBoard());
    await check('the laptop', () => openLaptop());
    for (const id of Object.keys(CIVIC_SCREENS)) await check('civic ' + id, () => civicScreen(id, CIVIC_LIVE[id] ? 'Yours' : (CIVIC_SCREENS[id].states || [])[0]));
    return out;
  });
  assert.deepEqual(spilled, []);
  await page.close();
});

test("selling a pocketful at Fortune's in one go: All fish, a second tap to be sure, every fish sold at its own price", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    S.pocket.forEach((q, i) => { if (q && ITEMS[q.id] && ITEMS[q.id].type === 'fish') S.pocket[i] = null; });
    const fish = FISHES.filter((f) => f.id !== 'boot').slice(0, 3).map((f) => f.id);
    for (const id of fish) receive(id, 2, true);
    const m0 = S.money;
    shopSell();
    const allFish = () => [...document.querySelectorAll('#panel button')].find((b) => /^All fish|^Sell 6 fish/.test(b.textContent));
    const b = allFish(), label = b.textContent;
    b.click();
    const ask = allFish().textContent;
    const fishKept = S.pocket.some((q) => q && ITEMS[q.id].type === 'fish');
    allFish().click();
    const out = { label, ask: /^Sell 6 fish for/.test(ask), waited: fishKept, sold: !S.pocket.some((q) => q && ITEMS[q.id].type === 'fish') && S.money > m0, gone: !allFish() };
    UI.close(true);
    return out;
  });
  assert.deepEqual(res, { label: 'All fish (6)', ask: true, waited: true, sold: true, gone: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("every neighbor's talk menu, the way a player does: each option tried with each neighbor (a good friend), the goat and the newcomers too, every talk ending back on the island", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), ask = UI.ask, say = UI.say;
    const out = { tried: 0, hung: [], busy: [], missing: [] };
    // (the menus' ways out: the neighbors', Joe's, Basil's cart, the club's, the goat's)
    const EXITS = ['See you!', 'See you later!', 'Bye!', 'Just vibing', 'Leave'];
    await seaMoveIn(); await mugMoveIn();
    /* the menu's option to try (once a talk), then the way out; a question inside an option gets its last answer
       (Never mind, Not now...), and whatever opens (a shop, the pocket, a song list, a game) is closed again, as a
       player who changes their mind does */
    let pick = null, used = false, menu = null;
    UI.say = async () => {};
    UI.ask = async (w, t, opts) => {
      const exit = opts.findIndex((o) => EXITS.includes(o));
      if (exit >= 0 && !menu) menu = opts.slice();
      if (exit >= 0 && pick && !used && opts.includes(pick)) { used = true; return opts.indexOf(pick); }
      return exit >= 0 ? exit : opts.length - 1;
    };
    let openSince = 0;
    const closer = setInterval(() => {
      if (document.querySelector('.spcard')) UI.close();
      if (!document.querySelector('#panel').hidden) { if (!openSince) openSince = Date.now(); else if (Date.now() - openSince > 300) { UI.close(); openSince = 0; } } else openSince = 0;
      if (Dance.on) Dance.quit();
      if (IslandGames.on) IslandGames.stop();
      if (Rope.on) Rope.quit();
    }, 100);
    const talk = async (n) => { const t0 = Date.now(); await Promise.race([talkTo(n), wait(15000)]); return Date.now() - t0 < 14900; };
    try {
      for (const n of NPCs.list) {
        const id = n.id, r = rel(id);
        r.met = true; r.pts = Math.max(r.pts || 0, HEARTS[4]); r.nickAsked = true;
        // the day's first talk (its hellos and news), then the menu as it is after that
        pick = null; used = false;
        if (!await talk(n)) { out.hung.push(id); G.busy = 0; continue; }
        r.talkAt = 0; menu = null;
        await talk(n);
        if (!menu) { out.missing.push(id); continue; }
        for (const label of menu.filter((o) => !EXITS.includes(o))) {
          r.talkAt = 0; pick = label; used = false;
          if (!await talk(n)) { out.hung.push(id + ': ' + label); G.busy = 0; UI.close(true); UI.hideDialog(); }
          out.tried++;
          if (G.busy || G.mode !== 'play') { out.busy.push(id + ': ' + label); G.busy = 0; }
          await wait(30);
        }
      }
    } finally { clearInterval(closer); UI.ask = ask; UI.say = say; }
    out.many = out.tried > 90;
    out.family = NPCs.list.filter((n) => NPC_DEFS[n.id].online).length;
    delete out.tried;
    return out;
  });
  assert.deepEqual(res, { hung: [], busy: [], missing: [], many: true, family: 0 });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("pottery, the way a player does: the clay centered and opened on Sully's wheel by holding and letting go, a mug shaped and named, glazed, fired in the kiln, and in Sarah's pocket", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const until = async (fn, ms = 8000) => { for (const end = Date.now() + ms; Date.now() < end; await wait(40)) { const v = fn(); if (v) return v; } return null; };
    const tap = async (sel, re) => { const b = await until(() => [...document.querySelectorAll(sel)].find((q) => re.test(q.textContent))); if (!b) throw new Error('no button ' + re); b.click(); };
    const say = UI.say; UI.say = async () => {};
    const P = pottery(), made0 = S.stats.pottery || 0;
    receive('wood', 1, true);
    try {
      enterRoom('studio');
      await until(() => G.area && G.area.id === 'studio');
      const job = potteryWheel();
      await until(() => document.querySelector('#studio .st-hold'));
      /* the Hold button, pressed and let go as the needle swings: in the green while centering, then down to the
         green when opening */
      const press = (on) => document.querySelector('#studio .st-hold').dispatchEvent(new PointerEvent(on ? 'pointerdown' : 'pointerup', { bubbles: true }));
      let held = false;
      const steer = setInterval(() => {
        const st = Wheel.st;
        if (!st || !document.querySelector('#studio .st-hold')) return;
        if (st.phase === 'center') { if (!held && st.pressure < 0.6) { press(true); held = true; } else if (held && st.pressure > 0.72) { press(false); held = false; } }
        else if (st.phase === 'open') { if (st.pause > 0) { if (held) { press(false); held = false; } } else if (!held && st.depth < 0.6) { press(true); held = true; } else if (held && st.depth >= 0.68) { press(false); held = false; } }
      }, 16);
      await until(() => Wheel.st && Wheel.st.phase === 'shape', 20000);
      clearInterval(steer);
      out.wheel = { centered: Wheel.st.qC > 0.7, opened: Wheel.st.qO === 1 };
      await tap('#studio .chip', /^Mug$/);
      await tap('#studio .chip', /^That's the one$/);
      await tap('#studio .chip', /^Save it$/);
      await tap('#choices .choice', /^Glaze it now/);
      await until(() => document.querySelector('#studio .swatch'));
      document.querySelectorAll('#studio .swatch')[3].click();
      await tap('#studio .chip', /^Dip all$/);
      await tap('#studio .chip', /^Done glazing$/);
      await tap('#choices .choice', /^Into the kiln/);
      await tap('#choices .choice', /^Fire it up/);
      await Promise.race([job, wait(5000)]);
      const id = P.kiln.length && P.kiln[0].id;
      out.firing = !!id && P.pieces[id].state === 'kiln' && pocketCount('wood') === 0;
      // (the kiln keeps real time: five minutes on, back at the kiln)
      for (const k of P.kiln) k.ready = Clock.real().getTime() - 1000;
      await kilnStation();
      const p = P.pieces[id];
      out.done = p.state === 'done' && pocketCount(id) === 1 && /[^0]/.test(p.glaze) && p.kind === 'mug' && !!p.prof.handle && p.stars >= 2;
      out.counted = (S.stats.pottery || 0) === made0 + 1;
    } finally { UI.say = say; }
    return out;
  });
  assert.deepEqual(res, { wheel: { centered: true, opened: true }, firing: true, done: true, counted: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('cooking, the way a player does: every kind of step played in the kitchen (chop, stir, heat, pour, toppings, roll, mash, crack and flip), a gold medal, a double portion', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    __dbg.setTime(14, 0, 14);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = [];
    const until = async (fn, ms = 8000) => { for (const end = Date.now() + ms; Date.now() < end; await wait(40)) { const v = fn(); if (v) return v; } return null; };
    /* a cook who watches the pan: after each frame, what to press in the next, with the same taps and holds the
       kitchen's buttons give (Arcade.tap, Arcade.held) */
    const bot = (g) => {
      const T = Arcade.tap, H = Arcade.held;
      H.act = false;
      if (g.phase === 'intro') { if (g.pt > 30) T.act = true; return; }
      if (g.phase === 'plate') { if (g.pt > 55) T.act = true; return; }
      if (g.phase !== 'go') return;
      const s = g.s, m = s.spec.m, t = s.t;
      if (m === 'chop') {
        const kx = s.x0 - 8 + (s.x1 - s.x0 + 16) * (0.5 - 0.5 * Math.cos(s.ph + s.sp));
        if (!s.down && !s.fin && s.marks.some((q) => !q.cut && Math.abs(q.x - kx) <= 1.5)) T.act = true;
      } else if (m === 'top') {
        const hx = 24 + 112 * (0.5 - 0.5 * Math.cos(s.ph + s.sp)), falling = s.drops.filter((d) => !d.landed).map((d) => d.x);
        if (!s.cool && s.used < s.n && s.marks.some((q) => !q.got && !falling.some((x) => Math.abs(x - q.x) < 6) && Math.abs(q.x - hx) <= 1.5)) T.act = true;
      } else if (m === 'stir') { if (t % 4 === 0) T[['right', 'down', 'left', 'up'][(t / 4) % 4]] = true; }
      else if (m === 'heat') H.act = s.v + s.vel * 10 < (s.z[0] + s.z[1]) / 2;
      else if (m === 'pour') { if (s.lv >= s.tg - 0.04) s.stop = true; H.act = !s.stop; }
      else if (m === 'mash') { if (t % 2 === 0) T.act = true; }
      else if (m === 'roll') { if (t % 3 === 0) T[(t / 3) % 2 ? 'left' : 'right'] = true; }
      else if (m === 'timing' && !s.anim) { const next = s.pos + s.sp * (s.spec.v === 'crack' ? s.dir : 1); if (Math.abs(next - s.zc) <= s.sp) T.act = true; }
    };
    const say = UI.say; UI.say = async () => {};
    const closer = setInterval(() => { if (document.querySelector('.spcard')) UI.close(); }, 100);
    try {
      for (const id of ['pad_thai', 'mango_sticky', 'dumplings']) {
        const r = RECIPES.find((q) => q.id === id);
        for (const [k, n] of Object.entries(r.need)) __dbg.give(k, n);
        const had = pocketCount(id);
        const job = cookDish(r);
        const g = await until(() => Arcade.on && Arcade.g && Arcade.g.steps && Arcade.g);
        const up = g.update.bind(g);
        g.update = (inp) => { up(inp); bot(g); };
        await until(() => Arcade.state === 'over' && Arcade.cardReady, 60000);
        [...document.querySelectorAll('#arcade .ar-card button')].find((b) => b.offsetParent).click();
        const ok = await Promise.race([job, wait(8000).then(() => 'hung')]);
        out.push({ steps: g.steps.map((q) => q.m), medal: g.medal, ok, got: pocketCount(id) - had, used: Object.keys(r.need).every((k) => pocketCount(k) === 0) });
      }
    } finally { clearInterval(closer); UI.say = say; }
    return { kinds: [...new Set(out.flatMap((q) => q.steps))].sort(), games: out.map(({ steps, ...q }) => q) };
  });
  assert.deepEqual(res.kinds, ['chop', 'heat', 'mash', 'pour', 'roll', 'stir', 'timing', 'top']);
  assert.deepEqual(res.games, Array(3).fill({ medal: 'gold', ok: true, got: 2, used: true }));
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("an evening, the way a player does: a bowl of the night's special at Basil's noodle cart (Thai spicy), and a letter's present taken from the mailbox", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const until = async (fn, ms = 8000) => { for (const end = Date.now() + ms; Date.now() < end; await wait(40)) { const v = fn(); if (v) return v; } return null; };
    const tap = async (sel, re) => { const b = await until(() => [...document.querySelectorAll(sel)].find((q) => re.test(q.textContent) && q.offsetParent)); if (!b) throw new Error('no button ' + re); b.click(); };
    // (setTime takes the month, the day and the hour: 10 PM on 5 June, when Basil's at the cart)
    __dbg.setTime(6, 5, 22); Plans.reset(); NPCs.place(true);
    const say = UI.say; UI.say = async () => {};
    try {
      const n = NPCs.get('basil'); rel('basil').met = true;
      const special = CART_MENU[hash32(S.seed + ':cart:' + Clock.dayNum()) % CART_MENU.length], m0 = S.money, had = pocketCount(special);
      out.atCart = n.spotKey === 'cart' && G.areas.island.ents.some((e) => e.kind === 'cart');
      const job = talkTo(n);
      await tap('#choices .choice', /^One bowl/);
      await tap('#choices .choice', /^Thai spicy/);
      await Promise.race([job, wait(5000)]);
      out.bowl = pocketCount(special) === had + 1 && S.money === m0 - CART_PRICE;
      sendMail({ from: 'kai', subject: 'Found this on the beach', body: 'Thought of you.\n- Kai', gift: 'conch' });
      const g0 = pocketCount('conch');
      await openMailbox();
      await tap('#panel .list .row', /Found this on the beach/);
      await tap('#panel .pfoot button', /^Take it$/);
      const mail = S.mail.find((m) => m.subject === 'Found this on the beach');
      out.mail = mail.read && mail.claimed && pocketCount('conch') === g0 + 1 && /taken/.test(document.querySelector('#panel .pfoot').textContent);
      UI.close(true);
    } finally { UI.say = say; }
    return out;
  });
  assert.deepEqual(res, { atCart: true, bowl: true, mail: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('the claw machine, the way a player does: paid at the machine, the claw steered over the highest plushie and dropped, tried again until one comes home in the pocket', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = { tries: 0 };
    const until = async (fn, ms = 8000) => { for (const end = Date.now() + ms; Date.now() < end; await wait(40)) { const v = fn(); if (v) return v; } return null; };
    const tap = async (sel, re) => { const b = await until(() => [...document.querySelectorAll(sel)].find((q) => re.test(q.textContent) && q.offsetParent)); if (!b) throw new Error('no button ' + re); b.click(); };
    __dbg.setTime(6, 5, 14);
    await enterRoom('arcade');
    const say = UI.say; UI.say = async () => {};
    const A = arc(), won0 = A.won || 0, m0 = S.money, plushes = () => S.pocket.filter((q) => q && /^plush_/.test(q.id)).reduce((a, q) => a + q.n, 0), p0 = plushes();
    try {
      const machine = G.area.items.find((i) => i.id === 'claw_machine');
      // (a grab right over the middle holds nine times in ten, and now and then a plushie slips: six tries at most)
      for (let k = 0; k < 6 && (A.won || 0) === won0; k++) {
        out.tries++;
        const job = machine.use();
        await tap('#choices .choice', /^Try it/);
        const g = await until(() => Arcade.on && Arcade.state === 'play' && Arcade.g && Arcade.g.pile && Arcade.g);
        const goal = g.pile.slice().sort((a, b) => g.top(a) - g.top(b))[0], up = g.update.bind(g);
        g.update = (inp) => {
          up(inp);
          if (g.phase !== 'aim') { Arcade.held.left = Arcade.held.right = false; return; }
          const d = goal.x - g.x;
          Arcade.held.right = d > 0.5; Arcade.held.left = d < -0.5;
          if (Math.abs(d) <= 0.5) Arcade.tap.drop = true;
        };
        await until(() => Arcade.state === 'over', 30000);
        await wait(300);
        [...document.querySelectorAll('#arcade .ar-card button')].find((b) => /^Done/.test(b.textContent) && b.offsetParent).click();
        await Promise.race([job, wait(5000)]);
      }
      out.won = (A.won || 0) === won0 + 1 && plushes() === p0 + 1;
      out.paid = S.money === m0 - CLAW_FEE * out.tries;
    } finally { UI.say = say; }
    delete out.tries;
    return out;
  });
  assert.deepEqual(res, { won: true, paid: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('chores in one go: every piece of furniture in the pocket sent home with one button, and every present in the mailbox taken with one (the letters left to read)', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const res = await page.evaluate(async () => {
    const out = {}, btnOf = (re) => [...document.querySelectorAll('#panel button')].find((q) => re.test(q.textContent));
    S.pocket = S.pocket.map(() => null);
    receive('lamp_floor', 1, true); receive('wall_cream', 1, true); receive('floor_wood', 1, true); receive('seabass', 2, true);
    const st = (id) => S.storage[id] || 0, s0 = ['lamp_floor', 'wall_cream', 'floor_wood'].map(st);
    openPocket();
    out.label = btnOf(/^Send furniture home/).textContent;
    btnOf(/^Send furniture home/).click();
    out.home = ['lamp_floor', 'wall_cream', 'floor_wood'].every((id, i) => st(id) === s0[i] + 1) && pocketCount('seabass') === 2 && !btnOf(/^Send furniture home/);
    UI.close(true);
    sendMail({ from: 'kai', subject: 'A shell', body: 'For you.', gift: 'conch' });
    sendMail({ from: 'shop', subject: 'Your order', body: 'Here it is.', gifts: ['lamp_floor', 'chair_wood'] });
    sendMail({ from: 'maki', subject: 'Hi', body: 'Just saying hi.' });
    await openMailbox();
    out.mail = btnOf(/^Take every present/).textContent;
    btnOf(/^Take every present/).click();
    out.taken = ['conch', 'lamp_floor', 'chair_wood'].every((id) => pocketCount(id) === 1) && S.mail.filter((m) => m.gift || m.gifts).every((m) => m.claimed && !m.read) && !btnOf(/^Take every present/);
    UI.close(true);
    return out;
  });
  assert.deepEqual(res, { label: 'Send furniture home (3)', home: true, mail: 'Take every present (2)', taken: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test('neighbors remember more: a photo with them in it, a letter, a lunch, a hangout, the catchphrase she gave them; brought up the next day and listed on their profile', async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => {
    __dbg.setTime(6, 5, 14);
    const n = NPCs.get('kai'), p = G.player, r = rel('kai');
    r.met = true; r.pts = HEARTS[4]; r.mem = [];
    Object.assign(n, { area: 'island', x: p.x + TILE, y: p.y, sleeping: false, hidden: false });
    n.script = true;
    Photo.start(); Photo.snap();
  });
  await page.waitForFunction(() => (rel('kai').mem || []).some((m) => m.k === 'photo'), null, { timeout: 15000 });
  const res = await page.evaluate(() => {
    Photo.stop();
    const id = 'kai', r = rel(id);
    NPCs.get(id).script = null;
    postDeliver({ to: id, day: Clock.dayNum(), body: 'Hi Kai!' });
    remember(id, 'lunch'); remember(id, 'hang', { place: 'at the lookout' }); remember(id, 'catch', { phrase: 'surf it out' });
    const kinds = r.mem.map((m) => m.k).sort().join();
    for (const m of r.mem) m.day = Clock.dayNum() - 1;
    const lines = []; let l; while ((l = memoryLine(id))) lines.push(l);
    appProfile(id);
    const page = document.querySelector('#panel .pbody').textContent;
    UI.close(true);
    return { kinds, said: lines.length, filled: !lines.some((x) => /[{}]/.test(x)) && lines.some((x) => /at the lookout/.test(x)) && lines.some((x) => /surf it out/.test(x)),
      profile: ['photo with them', 'wrote them a letter', "Lunch together at Mac's", 'hung out at the lookout', 'catchphrase: "surf it out"'].every((t) => page.includes(t)) };
  });
  assert.deepEqual(res, { kinds: 'catch,hang,letter,lunch,photo', said: 5, filled: true, profile: true });
  assert.deepEqual(page.problems, []);
  await page.close();
});

test("on a phone, upright and sideways, the full-screen ones fit too: Sully's wheel, glazing, the easel, the salon chair, the sewing machine, arcade cabinets, the kitchen; nothing off the side, every button in reach", async () => {
  const page = await device();
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  const out = {};
  for (const [w, h] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width: w, height: h });
    out[w + 'x' + h] = await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms)), res = {}, say = UI.say, ask = UI.ask;
      UI.say = async () => {}; UI.ask = async () => 0;
      const W = innerWidth, H = innerHeight, all = () => [...document.querySelectorAll('#studio *, #arcade *, #panel *')].filter((e) => e.offsetParent);
      /* off the side; or a button below the screen with nothing to scroll it into view */
      const off = () => all().filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1); }).length;
      const lost = () => all().filter((b) => {
        if (b.tagName !== 'BUTTON' || b.getBoundingClientRect().bottom <= H + 1) return false;
        for (let p = b.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) return false; }
        return true;
      }).length;
      const check = async (name, start, stop) => {
        start(); await wait(700);
        const o = off(), l = lost();
        if (o || l) res[name] = { off: o, lost: l };
        try { stop(); } catch (e) { /* (closed already) */ }
        await wait(250);
      };
      try {
        await check('wheel', () => Wheel.run(), () => Wheel.finish(null));
        await check('glaze', () => Glaze.run({ id: 'tp', kind: 'mug', name: 'Test mug', h: 11, mask: profileMask(fixProf({ h: 11, r: [4.3, 4.3, 4.3, 4.3, 4.3, 4.2, 4], handle: true })), glaze: null, state: 'green' }), () => Glaze.finish(false));
        await check('easel', () => paintAtEasel('home'), () => Studio.close());
        await check('salon', () => salonChair(), () => { Studio.close(); UI.close(true); });
        await check('sewing', () => sewingMachine(), () => { Studio.close(); UI.close(true); });
        for (const id of ['blocks', 'sushi', 'fortune']) await check('arcade ' + id, () => __dbg.arcade(id), () => Arcade.close(true));
        await check('kitchen', () => { const r = RECIPES[0]; for (const [k, n] of Object.entries(r.need)) __dbg.give(k, n); cookDish(r); }, () => Arcade.close(true));
      } finally { UI.say = say; UI.ask = ask; }
      return res;
    });
  }
  assert.deepEqual(out, { '390x844': {}, '844x390': {} });
  assert.deepEqual(page.problems, []);
  await page.close();
});
