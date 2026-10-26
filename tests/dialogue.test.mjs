// The dialogue spreadsheet's scripts (scripts/dialogue): every line is found, and an edited line goes back into the code.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';
import { extract } from '../scripts/dialogue/extract.mjs';
import { describe } from '../scripts/dialogue/describe.mjs';
import { requote } from '../scripts/dialogue/apply.mjs';
import { NEW_LINES } from '../scripts/dialogue/new-civic.mjs';

const rows = extract();
const src = (f) => fs.readFileSync(path.join(ROOT, 'game/src', f), 'utf8');

test('the lines people read are found, each where the sheet says', () => {
  assert.ok(rows.length > 6000, `only ${rows.length} lines`);
  const files = {};
  for (const r of rows) {
    const t = files[r.file] || (files[r.file] = src(r.file));
    const at = t.indexOf(r.raw);
    assert.ok(at >= 0, `${r.file}:${r.line} ${r.raw.slice(0, 40)}`);
  }
  // (and things that aren't lines stay out)
  assert.ok(!rows.some((r) => /^\s*(\d+px|rgba?\(|#[0-9a-f]{6})/.test(r.text)));
});

test('every line says who and when', () => {
  for (const r of rows) {
    const d = describe(r);
    assert.ok(d.who && d.when && d.kind, `${r.file}:${r.line}`);
  }
  const maki = rows.filter((r) => describe(r).who === 'Maki');
  assert.ok(maki.length > 150);
});

test('an edited line goes back as valid code, with its {code} parts', () => {
  const cases = [
    ["'Lost and found'", "It's \"lost\" \\ found"],
    ['"It\'s Joe."', 'Still "Joe", it\'s fine'],
    ['`${nm} visits now and then.`', '{nm} drops by. `Backticks` and ${dollars} stay text.'],
  ];
  for (const [raw, text] of cases) {
    const code = requote(raw, text);
    const out = vm.runInNewContext(code, { nm: 'Kai' });
    assert.equal(out, text.replace('{nm}', 'Kai'));
  }
});

test('the new lines have ids, people and states', () => {
  assert.equal(new Set(NEW_LINES.map((l) => l.id)).size, NEW_LINES.length);
  for (const l of NEW_LINES) assert.ok(l.who && l.state && l.when && l.line, l.id);
  for (const s of ['Works', 'Loading', 'No internet', 'Service down', 'No zip code', 'Market closed']) assert.ok(NEW_LINES.some((l) => l.state === s), s);
});
