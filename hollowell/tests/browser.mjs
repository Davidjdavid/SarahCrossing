// Opens play.html in Chromium, plays a little, fails on any error, and (with --shots) saves screenshots
// into tests/shots/ for looking at. Extra scenarios can be passed as names: node tests/browser.mjs --shots lab
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'tests', 'shots');
const args = process.argv.slice(2);
const wantShots = args.includes('--shots');
const only = args.filter(a => !a.startsWith('--'));
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

async function open(q = '?debug') {
    await page.goto('file://' + path.join(ROOT, 'play.html') + q);
    await page.waitForFunction(() => window.HW && window.HW.G);
    await page.evaluate(() => { window.HW._paused = true; });
}
async function shot(name) {
    if (!wantShots) return;
    await page.evaluate(() => window.HW.step(1));
    await page.waitForTimeout(60);
    await page.locator('canvas').screenshot({ path: path.join(SHOTS, name + '.png') });
    if (process.env.SHOT_ERRS) console.log(name, errors.length);
}
const SCENARIOS = {
    async kiln() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 22, y: 95, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('kr_kilndoor');
        await page.evaluate(() => { HW.warp('hollow', 46, 112); HW.step(30); });
        await shot('kr_camp');
        await page.evaluate(() => { HW.warp('hollow', 58, 103); HW.step(30); });
        await shot('kr_canyon');
        await page.evaluate(() => { HW.warp('hollow', 50, 90); HW.step(30); });
        await shot('kr_hawk');
        const rooms = { entrance: [29, 41], hall: [29, 31], sms: [41, 27], doubling: [17, 27], glazer: [56, 20], gallery: [62, 16], bridge: [69, 24], furnace: [29, 20], racks: [17, 17], boss: [38, 5] };
        await page.evaluate(() => { HW.newGame('Wren', { area: 'kiln', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(20); });
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('kiln', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('kiln_' + n);
        }
    },
    async meadow() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'hollow', x: 64 + 31, y: 80 + 3, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(30); });
        await shot('meadow_north');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 80 + 14); HW.step(30); });
        await shot('meadow_tidyhouse');
        await page.evaluate(() => { HW.warp('hollow', 64 + 14, 80 + 24); HW.step(30); });
        await shot('meadow_pen');
        await page.evaluate(() => { HW.warp('hollow', 64 + 8, 80 + 23); HW.step(30); });
        await shot('meadow_canyon');
        await page.evaluate(() => { HW.warp('hollow', 64 + 45, 80 + 27); HW.step(30); });
        await shot('meadow_bridge');
    },
    async tidy() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'tidy', x: 29, y: 42, noAutosave: true }); HW.Inv.items.staff = 1; HW.step(30); });
        await shot('tidy_foyer');
        const rooms = { kitchen: [10, 38], gallery: [50, 38], hall: [29, 30], pantry: [10, 27], parlor: [50, 27], cons: [70, 27], linen: [56, 20], laundry: [70, 16], ball: [26, 18], library: [10, 16], attic: [9, 8], ante: [49, 9], boss: [38, 5] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('tidy', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('tidy_' + n);
        }
        /* the conservatory with one plate on */
        await page.evaluate(() => { HW.warp('tidy', 60 + 6, 22 + 3); HW.step(4); HW.walkTo(60 + 8, 22 + 3); HW.step(30); });
        await shot('tidy_cons_on');
    },
    async town() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { noAutosave: true }); HW.step(200); });
        await shot('prologue_room');
        await page.evaluate(() => { HW.skipTalk(); HW.step(30); });
        await shot('room_awake');
        await page.evaluate(() => { HW.warp('gran_house', 6, 6); HW.step(10); });
        await shot('gran_house');
        await page.evaluate(() => { HW.Progress.set('talkedGran'); HW.warp('hollow', 64 + 12, 40 + 11, 'down'); HW.step(120); });
        await shot('ceremony');
        await page.evaluate(() => { HW.skipTalk(); HW.step(60); });
        await shot('town_square');
        await page.evaluate(() => { HW.warp('hollow', 64 + 12, 40 + 13, 'down'); HW.step(30); });
        await shot('town_gran');
        await page.evaluate(() => { HW.warp('hollow', 64 + 44, 40 + 15, 'down'); HW.step(30); });
        await shot('town_inn');
        await page.evaluate(() => { HW.warp('hollow', 64 + 20, 40 + 32, 'down'); HW.step(30); });
        await shot('town_south');
        await page.evaluate(() => { HW.warp('inn', 7, 7); HW.step(10); });
        await shot('inn_inside');
    },
    async extras() {
        await open();
        await page.evaluate(() => { HW.preset('afterD1'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 64 + 36, 40 + 21); HW.step(230); });
        await shot('kids_game');
        await page.evaluate(() => { HW.walkTo(64 + 36, 40 + 17); HW.push('left', 1); HW.walkTo(64 + 35, 40 + 19); HW.step(20); });
        await shot('kids_tsk');
        await page.evaluate(() => { for (let i = 0; i < 12; i++) { HW.step(30); HW.skipTalk(); } });
        await page.evaluate(() => { HW.warp('inn', 7, 6); HW.step(30); });
        await shot('inn_stairs');
        for (const [n, x, y] of [['attic1', 3, 8], ['attic2', 21, 9], ['attic3', 43, 7]]) {
            await page.evaluate(([x, y]) => { HW.Progress.set('trial1'); HW.Progress.set('trial2'); HW.warp('inn_attic', x, y); HW.step(40); }, [x, y]);
            await shot(n);
        }
        await page.evaluate(() => { HW.Progress.set('trial1', false); HW.warp('inn_attic', 3, 7); HW.step(5); HW.walkTo(3, 8); HW.step(60); });
        await shot('attic1_clock');
    },
    async water() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab3', x: 15, y: 3, noAutosave: true }); HW.step(5); HW.walkTo(1, 5); HW.step(60); });
        await shot('water_lab');
        await page.evaluate(() => { HW.hold('right'); HW.step(12); HW.release(); HW.step(200); });
        await shot('water_ride');
    },
    async mill() {
        await open();
        await page.evaluate(() => { HW.preset('afterD2'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 128 + 8, 80 + 26); HW.step(230); });
        await shot('mw_west');
        for (const [n, x, y] of [['mw_mill', 128 + 29, 80 + 23], ['mw_ferry', 128 + 37, 80 + 27], ['mw_millrace', 128 + 47, 80 + 27], ['mw_falls', 128 + 36, 80 + 33], ['mw_isle', 128 + 13, 80 + 4]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { wheel: [29, 41], ferry: [17, 38], backwash: [41, 38], carousel: [29, 30], shard: [17, 27], snap: [41, 27], upstream: [29, 20], overflow: [17, 16], twowheels: [41, 16], workshop: [4, 8], pond: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('millrace', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('mr_' + n);
        }
    },
    async belfry() {
        await open();
        await page.evaluate(() => { HW.preset('afterD3'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 128 + 39, 80 + 3); HW.step(230); });
        await shot('ht_northshore');
        for (const [n, x, y] of [['ht_t1', 128 + 14, 33], ['ht_bluster', 128 + 30, 22], ['ht_chasm', 128 + 44, 13], ['ht_belfry', 128 + 31, 9]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { porch: [29, 52], draught: [17, 49], windward: [41, 49], stair: [29, 41], weather: [17, 38], rafters: [41, 38], loft: [29, 30], reach: [17, 27], echo: [41, 27], ropes: [29, 19], workshop: [17, 16], bell: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('belfry', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('bf_' + n);
        }
    },
    async hushwood() {
        await open();
        await page.evaluate(() => { HW.preset('afterD4'); HW.step(5); HW.skipTalk(); HW.Progress.set('festival'); HW.warp('hollow', 125, 60); HW.step(60); HW.skipTalk(); });
        await shot('hw_giant');
        await page.evaluate(() => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120); HW.skipTalk(); HW.step(200); HW.skipTalk(); HW.step(30); });
        await shot('hw_road');
        for (const [n, x, y] of [['hw_house', 128 + 19, 40 + 10], ['hw_puffs', 128 + 8, 40 + 26], ['hw_camp', 128 + 6, 40 + 31], ['hw_pond', 128 + 25, 40 + 29], ['hw_bank', 128 + 34, 40 + 15], ['hw_bed', 128 + 6, 40 + 10]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
    },
    async marionette() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'marionette', x: 29, y: 42, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t); HW.step(10); });
        const rooms = { foyer: [29, 40], box: [44, 38], aud: [29, 31], pit: [10, 27], reh: [46, 27], wings: [29, 20], dress: [5, 18], props: [49, 20], shop: [50, 5], stage: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('marionette', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('mh_' + n);
        }
        await page.evaluate(() => { HW.walkTo(29, 8); HW.step(80); HW.skipTalk(); HW.step(40); HW.skipTalk(); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(30); });
        await shot('mh_boss');
    },
    async spoolkit() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab7', x: 2, y: 2, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar', 'needle']) HW.Inv.giveTool(t); HW.step(10); });
        await page.evaluate(() => { HW.walkTo(3, 3); HW.push('right', 1); HW.step(30); });
        await shot('sk_above');
        await page.evaluate(() => { HW.walkTo(2, 7); HW.face('down'); HW.press('act', 1); HW.step(40); HW.walkTo(6, 16); HW.step(5); });
        await shot('sk_below');
        await page.evaluate(() => { HW.walkTo(8, 13); HW.face('down'); HW.hold('act'); HW.step(20); HW.release(); HW.step(5); HW.walkTo(11, 19); HW.face('up'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); HW.hold('left'); HW.step(2); HW.release(); HW.step(8); HW.hold('up'); HW.step(2); HW.release(); HW.step(8); });
        await shot('sk_needle');
    },
    async underside() {
        await open();
        await page.evaluate(() => { HW.preset('afterD6'); HW.step(5); HW.skipTalk(); HW.warp('underside', 29, 19); HW.step(60); HW.skipTalk(); HW.step(5); });
        await shot('us_stairs');
        for (const [n, x, y] of [['us_guild', 29, 6], ['us_workshops', 9, 5], ['us_seamsW', 2, 16], ['us_seamsE', 44, 16]]) {
            await page.evaluate(([x, y]) => { HW.warp('underside', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot(n);
        }
    },
    async spoolworks() {
        await open();
        await page.evaluate(() => { HW.preset('afterD6'); HW.step(5); HW.skipTalk(); HW.Inv.giveTool('needle'); });
        const rooms = { gate: [29, 31], ugate: [29, 64], wind: [29, 20], uwind: [29, 53], store: [12, 20], ustore: [12, 53], kennel: [44, 16], ukennel: [49, 53], loft: [9, 9], uloft: [9, 42], heart: [26, 7], uheart: [29, 42], bench: [49, 9], ubench: [49, 42] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('spoolworks', x, y); HW.step(40); HW.skipTalk(); HW.step(20); HW.skipTalk(); }, [x, y]);
            await shot('sw_' + n);
        }
    },
    async makings() {
        await open();
        await page.evaluate(() => { HW.preset('afterD7'); HW.step(5); HW.skipTalk(); HW.warp('underside', 49, 5); HW.step(40); HW.skipTalk(); });
        await shot('mk_floor');
        await page.evaluate(() => { HW.warp('making1', 3, 16); HW.step(10); HW.skipTalk(); HW.step(250); HW.walkTo(10, 18); HW.walkTo(11, 17); HW.walkTo(10, 17); HW.walkTo(8, 18); });
        await shot('mk_1a_sit');
        await page.evaluate(() => { HW.walkTo(10, 17); HW.face('up'); });
        await page.evaluate(() => { HW.press('act', 1); HW.step(40); });
        await shot('mk_1a_push');
        await page.evaluate(() => { HW.Progress.set('making1'); HW.warp('making2', 3, 16); HW.step(10); HW.skipTalk(); HW.step(120); HW.walkTo(9, 14); HW.face('up'); });
        await shot('mk_2a_nib');
        await page.evaluate(() => { HW.Progress.set('making2'); HW.warp('making3', 3, 16); HW.step(10); HW.skipTalk(); HW.step(300); HW.walkTo(24, 15); });
        await shot('mk_3b');
        await page.evaluate(() => { HW.Progress.set('making3'); HW.warp('making4', 3, 16); HW.step(10); HW.skipTalk(); HW.step(500); HW.walkTo(9, 14); HW.face('up'); });
        await shot('mk_4a_sulk');
        await page.evaluate(() => { HW.walkTo(11, 13); HW.face('up'); HW.press('act', 1); HW.step(600); HW.walkTo(30, 15); HW.face('up'); });
        await shot('mk_4b_plates');
    },
    async reveal2() {
        await open();
        await page.evaluate(() => { HW.preset('afterMakings'); HW.step(5); HW.skipTalk(); HW.warp('deep', 9, 7); HW.step(40); HW.skipTalk(); });
        await shot('r2_store');
        await page.evaluate(() => { HW.warp('deep', 30, 5); HW.step(40); HW.skipTalk(); });
        await shot('r2_hall');
        await page.evaluate(() => { HW.preset('afterReveal2'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 96, 58); HW.step(60); HW.skipTalk(); });
        await shot('r2_town');
    },
    async loom() {
        await open();
        await page.evaluate(() => { HW.preset('afterReveal2'); HW.step(5); HW.skipTalk(); HW.Progress.set('north_gate'); HW.Inv.giveTool('shears'); });
        for (const [n, x, y] of [['lw_gate', 96, 38], ['lw_road', 95, 22], ['lw_edge', 72, 12], ['lw_loom', 95, 12]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
        const rooms = { th: [29, 40], wh: [29, 29], oy: [12, 28], sr: [29, 19], sp: [9, 16], wr: [52, 27], br: [52, 16], web: [29, 9], hg: [54, 35] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('loom', x, y); HW.step(40); HW.skipTalk(); HW.step(30); HW.skipTalk(); }, [x, y]);
            await shot('lm_' + n);
        }
        /* the Hanging Gallery's weights let go, on their way home over the trench */
        await page.evaluate(() => { HW.walkTo(56, 35); HW.face('right'); HW.press('act', 1); HW.step(70); });
        await shot('lm_hg_moving');
    },
    async ending() {
        await open();
        await page.evaluate(() => { HW.preset('afterDrift'); HW.step(5); HW.skipTalk(); HW.warp('drift', 56, 18); HW.step(60); HW.skipTalk(); });
        await shot('en_drift');
        await page.evaluate(() => { HW.warp('drift', 18, 24); HW.step(60); HW.skipTalk(); });
        await shot('en_garden');
        await page.evaluate(() => { HW.warp('hollow', 95, 66); HW.step(400); HW.skipTalk(); HW.step(200); HW.skipTalk(); });
        await shot('en_pull');
        const rooms = { foot: [49, 39], nursery: [29, 37], slumber: [9, 37], gallery: [69, 37], mario: [87, 36], hub: [49, 27], parlour: [29, 27], tidy: [10, 27], crossing: [69, 27], kiln: [89, 27], climb: [49, 20], ferry: [36, 16], mill: [16, 16], loft: [69, 16], belfry: [89, 16] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('greatspool', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('gs_' + n);
        }
        await page.evaluate(() => { for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('untie:' + h); HW.Progress.set('spool_all'); HW.warp('greatspool', 49, 8); HW.step(60); HW.skipTalk(); HW.step(200); });
        await shot('gs_top');
        await page.evaluate(() => { HW.warp('greatspool', 49, 20); HW.step(150); });
        await shot('gs_climb_junk');
        await page.evaluate(() => { HW.G.credits = { pages: [['Wanderer:', '', 'Wren']], i: 0, t: 120 }; HW.step(1); });
        await shot('en_credits');
        await page.evaluate(() => { HW.G.credits = null; HW.preset('afterEnding'); HW.step(5); HW.skipTalk(); HW.step(300); });
        await shot('en_after');
        await page.evaluate(() => { HW.warp('hollow', 77, 53); HW.step(60); });
        await shot('en_gran');
        await page.evaluate(() => { localStorage.setItem('hollowell-ended', '1'); Title.open(); });
        await page.waitForTimeout(300);
        await shot('en_title');
        await page.evaluate(() => localStorage.removeItem('hollowell-ended'));
    },
    async strayhouse() {
        await open();
        await page.evaluate(() => { HW.preset('afterD8'); HW.step(5); HW.skipTalk(); HW.Progress.set('strayhouse_open'); HW.warp('hollow', 72, 8); HW.step(40); HW.skipTalk(); });
        await shot('sh_door');
        const rooms = { porch: [29, 40], parlour: [29, 29], pantry: [17, 27], garden: [41, 27], stair: [29, 18], wash: [17, 16], mend: [41, 16], pile: [29, 9], linnet: [9, 6] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('strayhouse', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('sh_' + n);
        }
        await page.evaluate(() => { HW.step(200); HW.skipTalk(); HW.step(100); });
        await shot('sh_pile2');
    },
    async unfinished() {
        await open();
        await page.evaluate(() => { HW.preset('afterD8'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 120, 47); HW.step(40); HW.skipTalk(); });
        await shot('uf_door');
        const rooms = { front: [29, 40], hall: [29, 29], gap: [17, 27], shelf: [2, 20], bay: [41, 27], gallery: [29, 19] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('unfinished', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('uf_' + n);
        }
        await page.evaluate(() => { HW.warp('unfinished', 29, 39); HW.step(20); HW.skipTalk(); HW.Inv.equipped = 'needle'; HW.face('up'); HW.walkTo(29, 39); HW.face('up'); HW.press('tool', 1); HW.step(20); });
        await shot('uf_sewn');
    },
    async larkspur() {
        await open();
        await page.evaluate(() => { HW.preset('afterD5'); HW.step(5); HW.skipTalk(); HW.warp('hollow', 12, 84); HW.step(40); HW.skipTalk(); });
        await shot('lk_mesa');
        for (const [n, x, y] of [['lk_straw', 12, 74], ['lk_midway', 31, 60], ['lk_hall', 31, 51], ['lk_pen', 53, 52], ['lk_fortune', 11, 53], ['lk_gate', 57, 59]]) {
            await page.evaluate(([x, y]) => { HW.warp('hollow', x, y); HW.step(60); HW.skipTalk(); }, [x, y]);
            await shot(n);
        }
    },
    async slumber() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'slumber', x: 29, y: 42, noAutosave: true }); for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll']) HW.Inv.giveTool(t); HW.step(10); });
        const rooms = { porch: [29, 42], ward: [29, 31], linen: [17, 27], laundry: [42, 30], study: [64, 30], loft: [49, 34], landing: [29, 20], nursery: [17, 16], moonwalk: [42, 16], fort: [9, 9], boss: [29, 9] };
        for (const [n, [x, y]] of Object.entries(rooms)) {
            await page.evaluate(([x, y]) => { HW.warp('slumber', x, y); HW.step(40); HW.skipTalk(); HW.step(5); }, [x, y]);
            await shot('sl_' + n);
        }
        await page.evaluate(() => { HW.walkTo(29, 6); HW.step(200); HW.skipTalk(); HW.step(60); });
        await shot('sl_boss_fight');
        await page.evaluate(() => { HW.warp('hummock_hollow', 9, 2); HW.step(40); });
        await shot('hw_hollow');
    },
    async bedroll() {
        await open();
        await page.evaluate(() => {
            HW.newGame('Wren', { area: 'lab5', x: 5, y: 5, noAutosave: true }); HW.step(5);
            for (const t of ['gloves', 'hook', 'paddle', 'bedroll']) HW.Inv.giveTool(t); HW.Inv.equipped = 'bedroll';
            HW.walkTo(3, 6); HW.press('tool', 1); HW.step(30);
            HW.walkTo(9, 4); HW.hold('right'); HW.step(60); HW.release(); HW.step(10);
        });
        await shot('br_boards');
        await page.evaluate(() => { HW.walkTo(19, 4); HW.step(20); HW.hold('tool'); HW.step(22); HW.release(); HW.step(14); });
        await shot('br_homeward');
        await page.evaluate(() => { HW.step(120); HW.walkTo(20, 6); HW.step(20); });
        await shot('br_puff');
        await page.evaluate(() => { HW.step(200); HW.walkTo(34, 4); HW.step(10); });
        await shot('br_snoreling');
    },
    async title() { await open(); await page.evaluate(() => { window.HW._paused = false; }); await page.waitForTimeout(400); await page.evaluate(() => { window.HW._paused = true; }); await shot('title'); },
    async lab() {
        await open();
        await page.evaluate(() => { HW.newGame('Wren', { area: 'lab', x: 2, y: 8, noAutosave: true }); HW.step(5); });
        await shot('lab_start');
        await page.evaluate(() => { HW.walkTo(2, 3); HW.push('right', 2); HW.walkTo(4, 5); HW.step(20); });
        await shot('lab_pushed');
        await page.evaluate(() => { HW.walkTo(8, 1); HW.face('down'); HW.press('act', 1); HW.walkTo(9, 6); });
        await shot('lab_carry');
        await page.evaluate(() => { HW.face('left'); HW.press('act', 1); HW.step(40); });
        await shot('lab_shards');
        await page.evaluate(() => { HW.walkTo(1, 2); HW.face('up'); HW.press('act', 1); HW.step(30); });
        await shot('lab_sign');
    },
};
for (const [name, fn] of Object.entries(SCENARIOS)) {
    if (only.length && !only.includes(name)) continue;
    try { await fn(); } catch (e) { errors.push(name + ': ' + e.message); }
    const gameErrors = await page.evaluate(() => window.HW ? window.HW.ERRORS.slice() : []).catch(() => []);
    errors.push(...gameErrors.map(e => name + ': ' + e));
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('browser checks passed' + (wantShots ? ' (screenshots in tests/shots/)' : ''));
