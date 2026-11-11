// Every Heart Patch the game can give, found from the places' things and from the scripts that hand them out, against
// the number DESIGN_DOCUMENT.md (§5) and SPOILERS.md (item 36) give: a patch added or taken away anywhere fails this
// until the documents say so too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

/* the built script, file by file (the build marks where each starts), leaving out the debug labs */
function sources() {
    const src = fs.readFileSync(path.join(ROOT, 'dist', 'hollowell.js'), 'utf8');
    return src.split(/^\/\/ ---- (?=\S+\.js ----$)/m).filter(s => !/^30_lab\.js/.test(s)).join('\n');
}

function heartPatches() {
    const HW = loadGame(), src = sources();
    /* lying about: a chest or a pickup among a place's things (the overworld's blocks are all in 'hollow') */
    const placed = [];
    for (const [id, d] of Object.entries(HW.AREAS)) {
        if (/^lab/.test(id) || d.house === 'lab') continue;
        for (const e of d.ents || []) if ((e.k === 'chest' && e.item === 'heartpatch') || (e.k === 'pickup' && e.what === 'heartpatch')) placed.push(`${id}:${e.id || '?'}`);
    }
    /* given by a script: a fanfare for one (a reward, the shop), or one dropped into the world as it happens */
    const given = [...src.matchAll(/getItem\('heartpatch'(?:,\s*'([^']*)')?\)/g)].map(m => m[1] || '(unnamed)');
    const dropped = [...src.matchAll(/new Pickup\([^;\n]*what: 'heartpatch'[^;\n]*/g)].map(m => (/id: '([^']*)'/.exec(m[0]) || [])[1] || '(unnamed)');
    /* every patch written down in the source is one of those (so a new way of setting one out can't slip past) */
    const written = (src.match(/\b(item|what): 'heartpatch'/g) || []).length;
    return { placed, given, dropped, written, total: placed.length + given.length + dropped.length };
}

test('every Heart Patch is found, and the design document and SPOILERS.md give the same number', () => {
    const h = heartPatches();
    assert.equal(h.written, h.placed.length + h.dropped.length, 'every patch written into the game is a place\'s thing or one dropped by a script');
    assert.ok(h.placed.length >= 30 && h.given.length >= 6 && h.dropped.length >= 1, `found: ${h.placed.length} set out, ${h.given.length} given, ${h.dropped.length} dropped`);
    const ids = h.placed.map(s => s.split(':')[1]).concat(h.given, h.dropped).filter(s => s !== '(unnamed)');
    assert.equal(new Set(ids).size, ids.length, 'no two patches share an id');
    const dd = fs.readFileSync(path.join(ROOT, 'DESIGN_DOCUMENT.md'), 'utf8'), sp = fs.readFileSync(path.join(ROOT, 'SPOILERS.md'), 'utf8');
    const said = (re, s) => { const m = re.exec(s); return m ? +m[1] : null; };
    assert.equal(said(/(\d+)\s+patches in the world/, dd), h.total, `DESIGN_DOCUMENT.md §5 (the game has ${h.total})`);
    assert.equal(said(/\*\*Heart Patches\*\* \((\d+) total\b/, sp), h.total, `SPOILERS.md item 36 (the game has ${h.total})`);
});
