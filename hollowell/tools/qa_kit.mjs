// Builds the QA package for an outside tester (hollowell/qa_kit/00_START_HERE.md says what's in it).
//   node tools/build.mjs && node tools/qa_kit.mjs SAVES_DIR OUT_DIR
// SAVES_DIR is what tools/qa_saves.mjs wrote (save_states.json, results.json). Writes OUT_DIR/qa_kit/ (the documents,
// the confidential save list and guide, the saves, and hollowell_qa.html: the playable page with the test saves built
// in) and OUT_DIR/hollowell-qa-kit.zip.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const [savesDir, outDir] = process.argv.slice(2);
if (!savesDir || !outDir) { console.error('usage: node tools/qa_kit.mjs SAVES_DIR OUT_DIR'); process.exit(1); }
const states = JSON.parse(fs.readFileSync(path.join(savesDir, 'save_states.json'), 'utf8'));
const results = JSON.parse(fs.readFileSync(path.join(savesDir, 'results.json'), 'utf8'));
const kit = path.join(outDir, 'qa_kit');
fs.rmSync(kit, { recursive: true, force: true });
fs.mkdirSync(path.join(kit, 'saves', 'codes'), { recursive: true });

/* the spoiler-free papers, as written */
for (const f of ['00_START_HERE.md', '01_QA_INSTRUCTIONS.md', '02_HOW_TO_RUN.md']) fs.copyFileSync(path.join(ROOT, 'qa_kit', f), path.join(kit, f));

/* a confidential paper starts with a screenful of warning before anything that could be read at a glance */
const BUFFER = name => `# ${name}\n\n**CONFIDENTIAL: for the QA tester only.** This file gives away the whole game: its places, people, puzzles,\n` +
    `solutions and story. If the game was made for you, stop reading here and close this file.\n` + '\n.\n'.repeat(28) + '\n---\n\n';

/* the saves: the data, a file of code per save, and the confidential list */
const PARTS = { early: 'Early game', middle: 'Middle game', late: 'Late game', after: 'After the ending', optional: 'Optional content and other paths' };
for (const s of states) fs.writeFileSync(path.join(kit, 'saves', 'codes', s.id + '.txt'), s.code + '\n');
fs.writeFileSync(path.join(kit, 'saves', 'save_states.json'), JSON.stringify(states, null, 1) + '\n');
const tested = id => {
    const r = results.find(q => q.id === id);
    if (!r) return 'not tested';
    const on = r.playOn ? (r.playOn.ok ? (r.playOn.how ? 'played on: ' + r.playOn.how : 'played on to the end of its stretch') : 'PLAYED ON: FAILED ' + r.playOn.problem) : 'not played on';
    return (r.basic.ok ? 'loads cleanly' : 'LOAD FAILED: ' + r.basic.problems.join('; ')) + '; ' + on;
};
let list = BUFFER('Hollowell: the test saves') + `${states.length} saves, each a moment of a real game of Hollowell. Load one from the **Test saves** box on the
game's page, or paste its code (\`saves/codes/SNN.txt\`) into the **Save code** box (\`02_HOW_TO_RUN.md\`).

## How they were made
- The main saves (S01-S58) are moments of one game played from a new game to the end and after, by a script that
  plays through the game's own rules: it walks, pushes, lifts, talks, uses the tools and fights as a player does,
  and every flag and item came from the game itself. A save was taken only where a player could save (the menu
  could open) and only once things had held still for half a second.
- To save time the script sometimes hops from one place to another instead of walking there. So the map may show
  stretches as unexplored that a player would have walked through: not a defect of the game.
- The script takes no damage in fights (they test the fight's rules, not dodging), so hearts are full in most saves.
- The script goes straight from each House to the next. After a House the goal line suggests a visit home first;
  that visit is optional, and the script skips it, so in S08-S12, S14-S17 and S29-S32 the goal line still suggests it.
  Going home from one of those saves plays the visit late: a valid path, and worth testing.
- The optional saves (S59 on, where present) start from main saves and play optional content and other paths the
  same way.

## How each was tested
Every save was loaded from its code into a fresh game and checked: no errors; the right place; the story, the
satchel and the places' state the same after the load as in the save (apart from what a load changes by design: the
systems chapter of the guide says what); Wren free to move and able to move; the menu opens and closes; then ten
seconds left running with no errors. Then each was played on: a save at the start of a stretch of the game was loaded
and that whole stretch played from it, to the next milestone; any other save was loaded in the middle of its stretch,
at the moment it was taken, in place of the game, and the stretch played on to its end from it. Where a load puts a
room back as it was (by design) so that a step done before the save must be done again, that step was done by hand
and the way on checked (the notes say so).

## Where a load starts
Outdoors and in town, where the save was made. In a House (a dungeon), at Wren's mark: the doorway she came into that
room by, or where she laid the Bedroll (or the bed she lay down in), which can be in another room; the list says
which.

`;
for (const part of Object.keys(PARTS)) {
    const rows = states.filter(s => s.part === part);
    if (!rows.length) continue;
    list += `## ${PARTS[part]}\n\n`;
    for (const s of rows) {
        list += `### ${s.id}: ${s.what}\n`;
        list += `- Place: ${s.area}${s.roomKey ? ' room ' + s.roomKey + (s.room ? ' (' + s.room + ')' : '') : ''}${s.region ? ', ' + s.region : ''}; loads ${s.loadsAt === 'where it was saved' ? 'where it was saved' : 'at ' + s.loadsAt}.\n`;
        list += `- Knots: ${s.knots}; tools: ${s.tools.length ? s.tools.join(', ') : 'none'}; hearts: ${s.hearts}; time played: ${s.playMinutes} min.\n`;
        list += `- Goal line: "${s.goal}"\n`;
        list += `- Tested: ${tested(s.id)}.\n\n`;
    }
}
fs.writeFileSync(path.join(kit, '03_SAVE_STATES_CONFIDENTIAL.md'), list);

/* the guide: its parts in order, with the contents first */
const gdir = path.join(ROOT, 'qa_kit', 'guide');
const parts = fs.existsSync(gdir) ? fs.readdirSync(gdir).filter(f => f.endsWith('.md')).sort() : [];
const bodies = parts.map(f => fs.readFileSync(path.join(gdir, f), 'utf8').trim());
const toc = bodies.flatMap(b => b.split('\n').filter(l => /^## /.test(l)).map(l => `- ${l.slice(3)}`)).join('\n');
fs.writeFileSync(path.join(kit, 'CONFIDENTIAL_GUIDE.md'), BUFFER('Hollowell: the confidential QA guide') +
    'A reference for testing the game, organised by system and by place: not a walkthrough. The save IDs (S01...) are\n' +
    'listed in `03_SAVE_STATES_CONFIDENTIAL.md`.\n\n## Contents\n\n' + toc + '\n\n' + bodies.join('\n\n---\n\n') + '\n');

/* the playable page with the test saves: the published page, its title changed, a box of test saves under the save codes */
let page = fs.readFileSync(path.join(ROOT, 'dist', 'hollowell_page.html'), 'utf8');
const n0 = page.length;
page = page.replace('<title>Hollowell</title>', '<title>Hollowell (QA copy)</title>');
const box = `    <section class="codes" id="qaBox" aria-label="Test saves">
      <p class="small"><b>Test saves</b> (this copy only): pick one and load it. What each one is: the QA package's list of test saves.</p>
      <div class="bar"><select id="qaPick" aria-label="A test save" style="font:inherit;color:var(--text);background:var(--night-3);border:1px solid #4a3d5c;border-radius:999px;padding:6px 12px"></select><button class="pill" id="qaLoad" type="button">Load test save</button><span class="small" id="qaMsg" role="status"></span></div>
    </section>
  </header>`;
if (!page.includes('\n  </header>')) throw new Error('the page has changed: no header to put the test saves under');
page = page.replace('\n  </header>', '\n' + box);
const saves = Object.fromEntries(states.map(s => [s.id, s.code]));
const script = `<script>
/* the QA copy: the package's test saves, each loaded as the Save code box loads a code (keys pressed in the list stay in
   the list: the game would otherwise take them) */
(() => {
  const SAVES = ${JSON.stringify(saves)};
  const $ = id => document.getElementById(id), HW = window.HW, sel = $('qaPick');
  for (const id of Object.keys(SAVES)) { const o = document.createElement('option'); o.value = o.textContent = id; sel.appendChild(o); }
  for (const t of ['keydown', 'keyup']) sel.addEventListener(t, e => e.stopPropagation());
  $('qaLoad').addEventListener('click', () => {
    const s = HW.Save.fromCode(SAVES[sel.value] || '');
    if (!s) { $('qaMsg').textContent = "That save didn't load."; return; }
    HW.global('Game').load(s);
    $('qaMsg').textContent = 'Loaded ' + sel.value + '. It goes into the current save slot the next time the game saves.';
    try { $('screen').focus({ preventScroll: true }); } catch (e) { }
  });
})();
</script>
`;
const end = page.lastIndexOf('</body>');
page = end >= 0 ? page.slice(0, end) + script + page.slice(end) : page + script;
fs.writeFileSync(path.join(kit, 'hollowell_qa.html'), page);

/* the zip */
const zip = path.join(outDir, 'hollowell-qa-kit.zip');
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-q', '-X', path.basename(zip), 'qa_kit'], { cwd: outDir });
console.log(`qa_kit: ${states.length} saves, guide ${parts.length} parts (${bodies.reduce((n, b) => n + b.split(/\s+/).length, 0)} words), page ${(page.length / 1e6).toFixed(1)} MB (game ${(n0 / 1e6).toFixed(1)} MB); ${zip} ${(fs.statSync(zip).size / 1e6).toFixed(1)} MB`);
