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

test('every arcade cabinet starts, plays and ends, and the arcade has a cabinet for each', async () => {
  const page = await device();
  await page.evaluate(() => localStorage.setItem('sc-current', ''));
  await page.reload();
  await title(page);
  await page.evaluate(() => __dbg.quickStart());
  await page.waitForFunction(() => G.mode === 'play');
  await page.evaluate(() => __dbg.setTime(10, 23, 14));
  await page.evaluate(() => enterRoom('arcade'));
  await page.waitForFunction(() => G.area && G.area.id === 'arcade');
  const cabs = await page.evaluate(() => ({ list: ARCADE_CABS, inRoom: G.area.items.filter((i) => FURN[i.id] && FURN[i.id].arcade && FURN[i.id].arcade !== 'claw').map((i) => FURN[i.id].arcade), sprites: ARCADE_CABS.every((id) => Assets.has('f_cab_' + id)) }));
  assert.deepEqual(cabs.inRoom.sort(), [...cabs.list].sort());
  assert.ok(cabs.sprites, 'every cabinet has a picture');
  // and the back room's, once its door is open
  const all = await page.evaluate(() => { Quests.finish('backroom'); return arcadeCabs(); });
  assert.ok(all.length > cabs.list.length, 'the back room adds cabinets');
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
    const B = W0.buildings, rowA = ['boutique', 'salon', 'studio', 'displays'], rowB = ['restaurant', 'arcade', 'club', 'builder'];
    const rows = rowA.every((id) => B[id].y === B.boutique.y) && rowB.every((id) => B[id].y === B.restaurant.y) && B.restaurant.y > B.boutique.y + B.boutique.h;
    return { pockets, seaEdge, rows, spots, doors, stair: coveStair.length, cove: can(...cove, 1), coveShut: shut(...cove, 1), civic: ['townhall', 'postoffice', 'bank'].map((id) => !!(W0.buildings[id] && Assets.dyn[W0.buildings[id].sprite])),
      cuke: !!W0.buildings.h_cuke, square: ['shop', 'postoffice', 'townhall', 'bank', 'museum'].every((id) => W0.buildings[id].y + W0.buildings[id].h === W0.plaza[1]) };
  });
  assert.deepEqual(r.spots, [], 'every spot the neighbors use can be walked to');
  assert.deepEqual(r.doors, [], 'every door can be walked to');
  assert.equal(r.pockets, 0, 'no open ground that nobody can get to');
  assert.equal(r.seaEdge, 0, 'nobody can walk out onto the rim of a sea cliff');
  assert.ok(r.rows, 'the shops stand in two rows, the alley between them');
  assert.ok(r.stair >= 3 && r.cove && !r.coveShut, `the cove is reached only by its stair from the farm (${JSON.stringify(r)})`);
  assert.deepEqual(r.civic, [true, true, true], 'the Town Hall, the Post Office and the Bank stand on the square, with pictures');
  assert.ok(r.cuke && r.square, 'Cuke has a house; the civic row opens onto the square');
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
