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
  // the handmade frog pot from the old game is still a real item
  const pots = await page.evaluate(() => S.pocket.filter((s) => s && /^pot/.test(s.id)).length + Object.keys(S.storage).filter((k) => /^pot/.test(k)).length);
  assert.ok(pots >= 1, 'the handmade pot came along');
  const islands = await islandsOnServer(page);
  assert.equal(islands.length, 1);
  assert.equal(islands[0].summary.islandName, 'Imported Isle');
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
