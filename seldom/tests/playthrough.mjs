// A whole game, start to end credits, played by a bot with the player's buttons (Bot in src/85_debug.js).
// node seldom/tests/playthrough.mjs [shots-dir]   exit code 0 when the ending is reached.
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const SHOTS = process.argv[2] || null;

/* each chapter runs inside the page; it returns a string on failure */
const CHAPTERS = {
    async start() {
        await Bot.talkThrough();
        if (G.state !== 'play') return 'not playing after the opening';
    },
    async eggs() {
        for (let i = 0; i < 3; i++) {
            if (!await Bot.walkTo(60, 43)) return 'could not reach the hen run';
            await Bot.face('right'); await Bot.act();
            if ((World.inv.egg || 0) !== i + 1) return 'egg ' + (i + 1) + ' not picked: ' + World.inv.egg;
            if (i < 2) { if (!await Bot.walkTo(45, 50)) return 'could not walk away'; }
        }
    },
    async cake() {
        if (!await Bot.walkTo(60, 39)) return 'no bakery door';
        Bot.keys({ up: true }); await Bot.step(20); Bot.keys();
        if (World.map.id !== 'bakery') return 'not in the bakery: ' + World.map.id;
        if (!await Bot.walkTo(5, 4)) return 'no counter';
        await Bot.face('up'); await Bot.act();
        if (!G.flags.cakeBaking) return 'cake not baking';
        if (!await Bot.until(() => G.flags.cake, 3000)) return 'cake never baked';
        await Bot.walkTo(5, 6); Bot.keys({ down: true }); await Bot.step(30); Bot.keys();
        if (World.map.id !== 'island') return 'did not leave the bakery';
    },
    async bridge() {
        if (!await Bot.walkTo(63, 43)) return 'no Bridget';
        if (!await Bot.until(() => G.flags.bridge, 3000)) return 'bridge never built';
    },
    async drummer() {
        if (!await Bot.walkTo(40, 60)) return 'no beach';
        const t = ent('tilt');
        for (let i = 0; i < 80 && !G.flags.drummer; i++) {
            const [x, y] = tileOf(t);
            await Bot.walkTo(x + 1, y + 2, 120);
            await Bot.step(30);
        }
        if (!G.flags.drummer) return 'Tilt never got back: ' + tileOf(t);
    },
    async night() {
        if (!await Bot.walkTo(52, 40)) return 'no bench';
        await Bot.face('up'); await Bot.act();
        if (!await Bot.until(() => G.flags.festival, 9000)) return 'Lamp Night never came; hour ' + World.hour;
        await Bot.talkThrough();
        if (!G.flags.spyglass) return 'no spyglass';
    },
    async pasture() {
        if (!await Bot.walkTo(89, 41)) return 'no Pan';
        await Bot.face('down'); await Bot.act();
        if (!G.flags.penOpen) return 'pen not opened';
        /* drag each sheep down into the pen with the top edge of the view */
        for (const n of ['dolly', 'lolly', 'molly', 'polly']) {
            const s = ent(n);
            s.x = 89 * TILE + 1; s.y = 38 * TILE; s.st.t = 3;
            await Bot.walkTo(89, 43, 600);
            await Bot.walkTo(89, 58, 900);
            if (!s.penned) return n + ' not penned, at ' + tileOf(s);
        }
        await Bot.walkTo(89, 41); await Bot.face('down'); await Bot.act();
        if (!G.flags.loupe) return 'no loupe';
    },
    async lux() {
        if (!await Bot.walkTo(49, 31)) return 'no gate';
        const lux = ent('lux');
        if (!await Bot.until(() => lux.x >= 60 * TILE, 2000)) return 'Lux never went to the far end';
        await Bot.look({ left: true }, 12);
        if (lux.seen) return 'Lux still seen';
        Bot.keys({ up: true }); await Bot.step(60); Bot.keys();
        await Bot.press('center');
        if (!await Bot.walkTo(49, 25)) return 'not through the gate';
        if (!G.flags.quarry) return 'quarry flag';
    },
    async hourglass() {
        if (!await Bot.walkTo(44, 24)) return 'no plate';
        await Bot.step(10);
        await Bot.look({ right: true }, 50);
        if (ent('hourglass').seen) return 'hourglass still seen';
        if (!await Bot.walkTo(54, 23)) return 'no gate';
        if (!await Bot.walkTo(54, 21)) return 'gate shut: ' + JSON.stringify(ent('stonegate').st);
        await Bot.press('center');
        await Bot.walkTo(55, 21); await Bot.face('right'); await Bot.act();
        if (!G.flags.quarryGate) return 'lever';
    },
    async stillfall() {
        if (!await Bot.walkTo(44, 16)) return 'no ledge';
        await Bot.look({ down: true }, 13);
        await Bot.step(200);
        if (fallsBlocking()) return 'falls still running';
        Bot.keys({ up: true }); await Bot.step(30); Bot.keys();
        if (World.map.id !== 'cave') return 'not in the cave';
        await Bot.walkTo(6, 4); await Bot.face('up'); await Bot.act();
        if (!G.flags.wideglass) return 'no wide glass';
        await Bot.walkTo(6, 8); Bot.keys({ down: true }); await Bot.step(30); Bot.keys();
        if (World.map.id !== 'island') return 'did not leave the cave';
    },
    async chute() {
        if (!await Bot.walkTo(59, 6)) return 'no chute top';
        await Bot.press('zout'); await Bot.press('zout'); await Bot.step(30);
        Bot.keys({ down: true }); await Bot.step(30); Bot.keys();
        if (!await Bot.until(() => G.flags.wallBroken, 1500)) return 'wall not broken, block at ' + JSON.stringify(ent('block') && tileOf(ent('block')));
        await Bot.press('zin'); await Bot.press('zin'); await Bot.step(30);
    },
    async backSouth() {
        if (!await Bot.walkTo(49, 33)) return 'not back in the village';
        await Bot.talkThrough();
        if (!G.flags.luxGaveUp) return 'Lux did not give up';
    },
    async woodsA() {
        if (!await Bot.walkTo(28, 38)) return 'no clearing';
        await Bot.look({ left: true }, 48);
        Bot.keys({ right: true }); await Bot.step(70); Bot.keys();
        const [x] = tileOf(World.dot);
        if (x > 24) return 'did not wrap past wall A, at ' + tileOf(World.dot) + ' cam ' + JSON.stringify(Cam.rect(0));
        await Bot.press('center');
        if (!await Bot.walkTo(22, 33)) return 'no rope A';
        await Bot.face('right'); await Bot.act();
        if (!G.flags.gateA) return 'gate A';
    },
    async woodsD() {
        if (!await Bot.walkTo(18, 37)) return 'no south of room B';
        await Bot.press('zout'); await Bot.step(30);
        await Bot.look({ down: true }, 200);
        Bot.keys({ up: true }); await Bot.step(60); Bot.keys();
        const [, y] = tileOf(World.dot);
        if (y < 53) return 'did not wrap past wall D, at ' + tileOf(World.dot) + ' cam ' + JSON.stringify(Cam.rect(0));
        await Bot.press('center'); await Bot.press('zin'); await Bot.step(30);
        if (!await Bot.walkTo(16, 53)) return 'no rope D';
        await Bot.face('left'); await Bot.act();
        if (!G.flags.gateD) return 'gate D';
    },
    async brook() {
        if (!await Bot.walkTo(28, 59)) return 'no brook';
        for (let i = 0; i < 4; i++) await Bot.press('zin');
        await Bot.step(30);
        if (Cam.zoom < 2.9) return 'not zoomed in: ' + Cam.zoom;
        if (!await Bot.walkTo(28, 62)) return 'could not cross the ant bridge';
        for (let i = 0; i < 4; i++) await Bot.press('zout');
        await Bot.step(30);
    },
    async nightAgain() {
        if (Light.night()) return;
        if (!await Bot.walkTo(52, 40, 9000)) return 'could not get back to the bench';
        await Bot.face('up'); await Bot.act();
        if (!await Bot.until(() => Light.night(), 9000)) return 'no night';
        if (!await Bot.walkTo(17, 73, 9000)) return 'could not get back to the Hollow';
    },
    async ghosts() {
        if (!await Bot.walkTo(17, 72)) return 'no chapel gate';
        Bot.keys({ up: true }); await Bot.step(20); Bot.keys();
        for (let tries = 0; tries < 10 && tileOf(World.dot)[1] > 69; tries++) {
            await Bot.look({ right: true }, 60);
            await Bot.look({ up: true }, tries * 2);
            Bot.keys({ up: true }); await Bot.step(40); Bot.keys();
            if (tileOf(World.dot)[1] <= 69) break;
            await Bot.press('center'); await Bot.walkTo(17, 71); Bot.keys({ up: true }); await Bot.step(10); Bot.keys();
        }
        if (tileOf(World.dot)[1] > 69) return 'could not pass the Faded';
        await Bot.press('center');
        if (!await Bot.walkTo(18, 67)) return 'no chapel door';
        Bot.keys({ up: true }); await Bot.step(30); Bot.keys();
        if (World.map.id !== 'chapel') return 'not in the chapel';
        if (!await Bot.walkTo(5, 2)) return 'no altar';
        await Bot.face('up'); await Bot.act();
        if (!G.flags.prism) return 'no prism';
        await Bot.walkTo(6, 9); Bot.keys({ down: true }); await Bot.step(30); Bot.keys();
    },
    async seamOut() {
        if (!await Bot.walkTo(20, 68)) return 'not in the yard';
        await Bot.press('split'); await Bot.step(5);
        /* the half Dot isn't in is the one that moves; Dot crosses toward the middle */
        await Bot.look({ down: true }, 20); await Bot.look({ right: true }, Cam.home === 0 ? 24 : 30);
        Bot.keys({ [Cam.home === 0 ? 'right' : 'left']: true }); await Bot.step(60); Bot.keys();
        const [x, y] = tileOf(World.dot);
        await Bot.press('split'); await Bot.press('center');
        if (y <= 69 && x < 25) return 'still in the yard: ' + [x, y];
    },
    async hollowGate() {
        if (!await Bot.walkTo(34, 65)) return 'no rope by the Hollow gate';
        await Bot.face('left'); await Bot.act();
        if (!G.flags.gateH) return 'Hollow gate';
    },
    async toLedge() {
        if (!await Bot.walkTo(66, 19, 12000)) { const m = World.map, d = World.dot; return 'could not reach the ledge: ' + [findPath(m, ...tileOf(d), 50, 45), findPath(m, 50, 45, 49, 25), findPath(m, 49, 25, 55, 21), findPath(m, 55, 21, 60, 19), findPath(m, 60, 19, 66, 19)].map(p => p ? p.length : 'none').join(' '); }
    },
    async gap() {
        await Bot.face('right'); await Bot.step(5);
        await Bot.press('split'); await Bot.step(5);
        if (Cam.home !== 0) return 'Dot in the right half at the gap';
        await Bot.look({ right: true }, 22);
        Bot.keys({ right: true }); await Bot.step(60); Bot.keys();
        await Bot.press('split'); await Bot.press('center');
        if (tileOf(World.dot)[0] < 71) return 'did not cross the gap, at ' + tileOf(World.dot);
    },
    async lighthouse() {
        if (!await Bot.walkTo(87, 10)) return 'no lighthouse door';
        Bot.keys({ up: true }); await Bot.step(30); Bot.keys();
        if (World.map.id !== 'lamproom') return 'not in the lamp room';
        await Bot.walkTo(5, 4); await Bot.face('up'); await Bot.press('act');
        await Bot.talkThrough(600);
        if (!Cam.eye) return 'no eye';
        await Bot.until(() => G.flags.eyeTold && !World.cutscene, 600); await Bot.talkThrough();
    },
    async gather() {
        /* night (it should be: nobody's watched the Clock since the Hollow) */
        if (!Light.night()) { Cam.ax = 50 * TILE; Cam.ay = 36 * TILE; if (!await Bot.until(() => Light.night(), 9000)) return 'no night in the eye'; }
        await Bot.press('zout'); await Bot.press('zout'); await Bot.step(30);
        const walkers = EYE_WALKERS.map(ent);
        const ferry = () => {
            /* the seam over the gap: the left half's right edge on the ledge, the right half's left edge on the cape */
            if (!Cam.split) Cam.toggleSplit();
            const L = Cam.rect(0); Cam.ax += (66.6 * TILE) - (L.x + L.w); Cam.ay = 19 * TILE;
            const R = Cam.rect(1); Cam.bx += (71.2 * TILE) - R.x; Cam.by = Cam.ay;
        };
        for (let i = 0; i < 30000; i++) {
            const left = walkers.filter(w => !w.st.arrived);
            if (!left.length) break;
            const w = left.find(w => tileOf(w)[0] >= 66) || left[0];
            const [x, y] = tileOf(w);
            if (x >= 64 && x <= 67 && y >= 16 && y <= 21) ferry();
            else { if (Cam.split) Cam.toggleSplit(); Cam.ax = ecx(w); Cam.ay = ecy(w); Cam.clampMap(0); }
            await Bot.step(1);
        }
        if (Cam.split) Cam.toggleSplit();
        const late = walkers.filter(w => !w.st.arrived).map(w => w.name + '@' + tileOf(w));
        if (late.length) { const a = ent('ansel'); return 'not everyone arrived: ' + late.join(' ') + ' | ansel ' + JSON.stringify({ seen: a.seen, hidden: a.hidden, hold: a.hold, st: a.st, goal: a.goal, route: a.route && a.route.length, brain: a.brain && a.brain.name, cam: Cam.rect(0), map: a.map.id, state: G.state, cut: !!World.cutscene }); }
    },
    async fire() {
        Cam.setZoom(0.5); Cam.zoom = 0.5; if (!Cam.split) Cam.toggleSplit();
        const b = ent('bonfire'), lamp = ent('lhlamp');
        for (let i = 0; i < 3000 && !G.flags.lit; i++) {
            Cam.ax = ecx(b) + 100 - Cam.fw() / 2; Cam.ay = b.y + Cam.fh() / 2 - 30;
            Cam.bx = lamp.x - 60 + Cam.fw() / 2; Cam.by = Cam.ay - (b.y - lamp.y) - 10;
            await Bot.step(1);
        }
        if (!G.flags.lit) return 'the lamp never lit';
        await Bot.talkThrough(600);
        if (!G.flags.lastLook) return 'no last look';
        Cam.toggleSplit();
    },
    async ending() {
        await Bot.press('act');
        if (G.state !== 'ending') return 'no ending: ' + G.state;
        if (!await Bot.until(() => Ending.phase === 'after', 6000)) return 'credits never finished';
        await Bot.step(120); await Bot.press('act');
        if (G.state !== 'title') return 'not back at the title';
    },
    async afterwards() {
        /* the island after the end: continue, and Dot can walk about again */
        Title.enter(); Game.continueGame(); await Bot.step(30); await Bot.talkThrough();
        if (Cam.eye) return 'still the eye after the end';
        if (!G.flags.ended || !G.flags.lit) return 'the end was not kept';
        const x0 = World.dot.x; Bot.keys({ left: true }); await Bot.step(30); Bot.keys();
        if (World.dot.x >= x0) return 'Dot cannot move after the end';
    },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.stack || e)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
await page.goto('file://' + path.join(HERE, '..', 'seldom.html') + '?debug');
await page.waitForTimeout(300);
await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } Title.enter(); Game.newGame(); });
let failed = null;
const t0 = Date.now();
for (const [name, fn] of Object.entries(CHAPTERS)) {
    const res = await page.evaluate(`(${fn.toString().replace(/^async \w+\(\)/, 'async function()')})()`).catch(e => 'threw: ' + e.message);
    const st = await page.evaluate(() => ({ map: World.map && World.map.id, at: World.dot && tileOf(World.dot), hour: Math.round(World.hour * 10) / 10, t: Math.round(G.playT), laws: Object.keys(Notebook.got), log: Bot.log.splice(0) }));
    console.log((res ? 'FAIL ' : 'ok   ') + name.padEnd(12) + JSON.stringify(st) + (res ? '\n     ' + res : ''));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'pt-' + name + '.png') });
    if (res) { failed = name; break; }
}
console.log(`game time ${await page.evaluate(() => fmtTime(G.playT))}, real ${Math.round((Date.now() - t0) / 1000)}s`);
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 20).join('\n'));
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
