// Portraits in the dialogue box (src/35b_portraits.js, Dialog in src/14_ui.js): everyone who speaks with a look has
// one, every expression draws, the words fit beside it on either side, and the marks the lines carry are read off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const W = 320, H = 180;
/* every Font.draw while fn runs: [text, x, y, width] */
function drawn(HW, fn) {
    const Font = HW.global('Font'), out = [], d0 = Font.draw;
    Font.draw = function (s, x, y, ...r) { out.push([s, x, y, Font.width(s)]); return d0.call(this, s, x, y, ...r); };
    try { fn(); } finally { Font.draw = d0; }
    return out;
}
function speakers(HW) { return ['wren', ...Object.keys(HW.global('PEOPLE_DEF'))].filter(w => w === 'wren' || HW.global('PEOPLE_DEF')[w].look); }

test('everyone who speaks with a look has a portrait, and every expression draws (talking and blinking too)', () => {
    const HW = loadGame();
    const P = HW.global('Portraits'), EX = HW.global('EXPRESSIONS'), legendOf = HW.global('portraitLegend');
    for (const e of ['neutral', 'happy', 'sad', 'surprised', 'cross', 'worried']) assert.ok(EX.includes(e), e);
    const ids = speakers(HW);
    assert.ok(ids.length >= 30, `${ids.length} people`);
    for (const id of ids) {
        assert.ok(P.has(id), `${id} has a portrait`);
        const legend = Object.assign({}, HW.global('LEGEND'), legendOf(P.look(id)));
        const seen = new Set();
        for (const ex of EX) {
            const still = P.rows(id, ex, false, false), talk = P.rows(id, ex, true, false), blink = P.rows(id, ex, false, true);
            for (const rows of [still, talk, blink]) {
                assert.equal(rows.length, 32, `${id} ${ex}: 32 rows`);
                assert.ok(rows.every(r => r.length === 32), `${id} ${ex}: 32 columns`);
                for (const ch of new Set(rows.join(''))) assert.ok(ch === '.' || legend[ch], `${id} ${ex}: a colour for "${ch}"`);
                const all = rows.join('');
                assert.ok(all.includes('k') && /[sjS]/.test(all) && /[tTu]/.test(all), `${id} ${ex}: an outline, a face, clothes`);
            }
            assert.notEqual(talk.join(), still.join(), `${id} ${ex}: the mouth opens to talk`);
            if (ex !== 'happy') assert.notEqual(blink.join(), still.join(), `${id} ${ex}: the eyes shut to blink`);
            seen.add(still.join());
            const c = P.get(id, ex, false, false);
            assert.ok(c && c.width === 32 && c.height === 32, `${id} ${ex}: a picture`);
            assert.equal(P.get(id, ex, false, false), c, `${id} ${ex}: made once and kept`);
        }
        assert.equal(seen.size, EX.length, `${id}: every expression is a different face`);
    }
    /* nobody without a look: narration, signs, creatures, strangers */
    for (const who of [null, undefined, '', 'biscuit', 'sheep', 'housekeeper', 'nobody']) assert.ok(!P.has(who), `no portrait for ${who}`);
});

test('a portrait looks like its sprite: hair, glasses, beard, cap and bun where the look has them', () => {
    const HW = loadGame();
    const P = HW.global('Portraits'), D = HW.global('PEOPLE_DEF');
    for (const id of speakers(HW)) {
        const L = P.look(id), rows = P.rows(id, 'neutral'), all = rows.join(''), x = new Set(L.extra || []);
        assert.equal(all.includes('g'), x.has('glasses'), `${id}: glasses`);
        if (L.hair === 'cap') assert.ok(all.includes('q'), `${id}: a cap`);
        if (L.hair === 'bun') assert.ok(rows[0].includes('h') || rows[0].includes('l') || rows[1].includes('h'), `${id}: a bun on top`);
        if (L.hair === 'bald') assert.ok(/[sj]/.test(rows[3]), `${id}: a bald crown`);
        else if (L.hair !== 'cap') assert.ok(/[hlHK]/.test(rows[3]), `${id}: hair on top`);
        if (L.hair === 'long') assert.ok(/[hlHK]/.test(rows[28].slice(0, 8)), `${id}: hair to the shoulders`);
        if (x.has('beard')) assert.ok(/[hHl]/.test(rows[21]), `${id}: a beard`);
        if (L.body === 'child') assert.ok(all.includes('c'), `${id}: rosy cheeks`);
    }
    assert.equal(P.look('wren').hairC, '#a5532a', "Wren's hair is her sprite's");
    assert.ok(D.linnet && P.look('linnet').ribbon, 'Linnet in her green ribbons');
});

test('a line\'s mark picks the face and is never shown; no mark is neutral; colours are left alone', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog'), exprOf = HW.global('exprOf');
    assert.deepEqual([...exprOf('{happy}Four Knots!')], ['happy', 'Four Knots!']);
    assert.deepEqual([...exprOf('Four Knots!')], ['neutral', 'Four Knots!']);
    assert.deepEqual([...exprOf('{red}Wren{/} did it.')], ['neutral', '{red}Wren{/} did it.']);
    D.open('gran', '{sad}You shouldn\'t be down here, love.');
    assert.equal(D.expr, 'sad'); assert.equal(D.face, 'gran');
    assert.ok(!D.pages.flat().join(' ').includes('{'), 'the mark is read off');
    D.close(); HW.step(5);
    D.open('gran', 'Morning, {name}.'); assert.equal(D.expr, 'neutral'); assert.ok(D.pages[0][0].startsWith('Morning, '), '{name} still filled'); D.close(); HW.step(5);
    D.open(null, '{happy}A sign.'); assert.equal(D.face, null, 'narration has no portrait'); assert.ok(!D.pages.flat().join(' ').includes('{happy}')); D.close(); HW.step(5);
    D.open('nobody', 'Hello.'); assert.equal(D.face, null, 'a stranger without a look has none'); D.close(); HW.step(5);
});

test('the words fit beside the portrait, on either side, top or bottom, with the longest name and a question', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    HW.G.wanderer = 'WWWWWWWWWW';
    const D = HW.global('Dialog'), P = HW.probe(true), Game = HW.global('Game');
    const long = "{worried}{name}! I found the Hall of Names on my Wander, the same as you, {name}. I read her ledger. I took the old Shears out of the Loom and cut myself loose and walked out into the fog.";
    for (const who of ['gran', 'wren', 'tuck', 'mabel']) for (const side of ['left', 'right']) for (const top of [false, true]) {
        D.open(who, long); D.side = side; D.top = top;
        const y = top ? 18 : H - 44 - 6, fx = side === 'left' ? 13 : 8 + 304 - 5 - 34;
        for (let pg = 0; pg < D.pages.length; pg++) {
            D.page = pg; D.shown = 9999;
            const t = drawn(HW, () => D.draw());
            assert.ok(D.pages[pg].length <= 3, 'three lines a page');
            for (const [s, x, ty, w] of t) {
                assert.ok(x >= 0 && x + w <= W - 8, `"${s}" runs to ${x + w}`);
                if (ty >= y && ty < y + 44) {
                    assert.ok(x + w <= 8 + 304 - 9, `"${s}" stays in the box (${x + w})`);
                    assert.ok(x >= fx + 34 + 4 || x + w <= fx - 4, `${who} ${side}: "${s}" clear of the portrait (${x}..${x + w})`);
                }
            }
            /* the name tag over the portrait's end */
            const tag = t.find(r => r[2] === y - 6);
            assert.ok(tag && (side === 'left' ? tag[1] < 60 : tag[1] + tag[3] > 250), `${who} ${side}: the name tag at the portrait's end`);
        }
        D.close(); HW.step(5);
    }
    /* a question: the choices inside the box, between the words and a portrait on the right */
    for (const side of ['left', 'right']) {
        const ch = ['Where is Linnet?', 'Let them go, Gran.', '...'];
        D.open('gran', "{worried}Don't look at me like that.", { choices: ch }); D.side = side; D.top = false; D.shown = 999;
        const t = drawn(HW, () => D.draw()), fx = side === 'left' ? 13 : 273;
        for (const c of ch) {
            const e = t.find(r => r[0] === c);
            assert.ok(e && e[2] > H - 50 && e[1] + e[3] <= W - 8, `"${c}" in the box`);
            assert.ok(e[1] >= fx + 38 || e[1] + e[3] <= fx - 4, `${side}: "${c}" clear of the portrait`);
        }
        D.close(); HW.step(5);
    }
    for (let i = 0; i < 3; i++) { Game.render(); P.frame(); }
    const issues = P.report().issues.filter(i => i.kind === 'text' && !/WWWWWWWWWWWWWWWW/.test(i.key));
    assert.equal(issues.length, 0, issues.map(i => i.key).join('\n'));
});

test('the portrait goes to the speaker\'s side of the screen, and Wren\'s to hers', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog'), p = HW.player(), NPC = HW.global('NPC');
    const rook = HW.G.map.add(new NPC(p.tx + 3, p.ty, { who: 'rook' }));   /* (somebody from away: nobody else of hers about) */
    const side = who => { D.open(who, 'A line.'); const s = D.side; D.close(); HW.step(1); return s; };
    const put = (n, tx) => { const a = HW.G.map; a.unplace(n, n.tx, n.ty); n.tx = tx; n.x = tx * 16; a.place(n, n.tx, n.ty); };
    put(rook, p.tx + 3); HW.step(2);
    assert.equal(side('rook'), 'right', 'Rook to the right of Wren: on the right');
    assert.equal(side('wren'), 'left', 'and Wren answering her: on the left');
    put(rook, p.tx - 3); HW.step(2);
    assert.equal(side('rook'), 'left', 'Rook to the left: on the left');
    assert.equal(side('wren'), 'right', 'and Wren: on the right');
});

test('the mouth goes while the words come out and stops when they\'re done; the eyes blink now and then', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog'), P = HW.global('Portraits'), Game = HW.global('Game'), Script = HW.global('Script'), say = HW.global('say');
    const calls = [], g0 = P.get;
    P.get = function (...a) { calls.push(a); return g0.apply(this, a); };
    try {
        Script.run(function* () { yield* say('tuck', '{happy}Are you going? Are you going NOW? When I\'m big I\'m going on a Wander too! I\'m going to do ALL the Houses!'); });
        const typing = [], after = [];
        for (let i = 0; i < 400 && D.active; i++) {
            calls.length = 0; Game.render();
            const c = calls.find(a => a[0] === 'tuck');
            assert.ok(c, 'drawn with a portrait'); assert.equal(c[1], 'happy', 'in the line\'s expression');
            (D.shown < D.pageLen() ? typing : after).push(c);
            HW.step(1);
            if (D.shown >= D.pageLen() && after.length > 260) break;
        }
        assert.ok(typing.some(c => c[2]) && typing.some(c => !c[2]), 'the mouth opens and shuts while the words come out');
        assert.ok(after.length > 200 && after.every(c => !c[2]), 'and is shut once they have');
        assert.ok(after.some(c => c[3]) && after.some(c => !c[3]), 'a blink now and then');
    } finally { P.get = g0; }
});

test('every mark a line carries is an expression the portraits know', () => {
    const HW = loadGame();
    const EX = HW.global('EXPRESSIONS'), TC = HW.global('TEXT_COLORS'), PAL = HW.global('PAL');
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'dist', 'hollowell.js'), 'utf8');
    const used = new Set();
    for (const m of src.matchAll(/["'`]\{([a-z]+)\}/g)) {
        const k = m[1];
        if (k === 'name' || TC[k] !== undefined || PAL[k]) continue;
        assert.ok(EX.includes(k), `an unknown mark {${k}}`);
        used.add(k);
    }
    assert.ok(used.size >= 4, `the story uses its expressions (${[...used].join(', ')})`);
});
