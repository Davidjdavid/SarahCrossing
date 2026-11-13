# Hollowell: notes for working on it

An original top-down adventure game made for David (a separate project from Sarah Crossing, kept in this
folder on branch `claude/wizardly-cray-td23as`). **David must not learn what the game is until it is done:**
progress updates stay spoiler-free (no genre, setting, mechanics, characters, secrets, story).

Start every session by reading, in order: `PROJECT_STATE.md` (where things stand, next priorities),
`DUNGEON_TRACKER.md`, `QA_REPORT.md`; then `DESIGN_DOCUMENT.md`, `SPOILERS.md`, `WORLD_MAP.md` as needed.
`GAME_BRIEF.md` is the assignment, word for word; its section 13 is the definition of done. A scheduled
task fires every four hours into the working session with the checkpoint instructions (brief §12).

## Running it
- `node tools/build.mjs` builds `play.html` (the whole game in one file: double-click to play) and
  `dist/hollowell.js` (the script alone, for tests). Commit `play.html` so it's always playable.
- `npm test`: build, then the headless tests (`tests/*.test.mjs`, the real game code in a Node `vm` with no
  page, via `tests/harness.mjs`).
- `node tests/browser.mjs [--shots] [scenario...]`: Chromium via Playwright (require it with `createRequire`,
  it's installed globally); fails on any page error; `--shots` saves PNGs into `tests/shots/` (not
  committed). Look at screenshots with the Read tool after visual changes.
- `play.html?debug`: F1 debug panel (warp, presets, tools, god, noclip). `play.html?debug&notitle` skips the
  title. `window.HW` drives the game (newGame, warp, preset, give, step, press, hold, walkTo, push,
  skipTalk, state...). The headless harness exposes the same `HW`.

## The outside QA package (qa_kit/, 12 November)
A testing package for an outside AI tester (David's request): `qa_kit/00-02` are spoiler-free papers (start here, the
instructions, how to run); `qa_kit/guide/*.md` is the confidential guide in parts. To rebuild it all (the game itself
is never changed for it):
- `node tools/build.mjs && node tools/qa_record.mjs OUT/rec` records save states along the whole scripted game
  (the legs through `tools/qa_legs.mjs`: hearts only as the game gives them, nothing able to hurt Wren, each boss's
  Heartstitch picked up);
- `node tools/qa_saves.mjs OUT/rec OUT/main --quick` picks the milestone saves (T01-T58, the list is in the file);
- `node tools/qa_tour.mjs OUT/main/save_states.json OUT/tour` plays the optional content from them (T59 on);
- `node tools/qa_saves.mjs OUT/rec OUT/saves --tour=OUT/tour` tests every save: loads cleanly, then played on
  (`--only=T05,T06` a few);
- `node tools/qa_kit.mjs OUT/saves OUT` writes `OUT/qa_kit/` and `OUT/hollowell-qa-kit.zip` (the playable page with the
  test saves built in is `hollowell_qa.html`, also published as the tester copy's link in `02_HOW_TO_RUN.md`).
The saves as delivered on 12 November are in `qa_kit/saves/` (74, every one passing). Known open issues the package lists
for the tester are POLISH.md findings 82-89; the game was frozen while the package was prepared.
Never put anything from `private/` in it.

## Frozen copies for David (12 November)
David keeps copies of a version to compare with later ones: the 12 November version (commit b217800) is the artifact
https://claude.ai/artifact/CQ43nkNPyugBTyQbXsmDKV (never to be updated) and a Linux folder (`Hollowell.html` plus the
launcher in `tools/linux/`: its own Chromium profile per version, so versions' saves stay apart). For a later version:
build, copy `dist/hollowell_page.html` with the title and the version line under the lede changed, and copy
`tools/linux/*` with the date changed (2026-11-12, 12 November) in every file; publish the page as a new artifact. His
main page (https://claude.ai/artifact/4cwxT315Taw5N4ewmxertc) is the one that's kept up to date.

## Version 1.0.0 (13 November), now 1.0.4
The game's version (title screen, saves) is `version.json`; 1.0.0 is the release David plays, after fix round I; 1.0.1
fixes what he found in his first minutes (POLISH.md 96-97); 1.0.2 what he found at the first boss (98-101: Wren is
never left inside a wall or a thing, `Player.easeOut` as the net under it; the Houses' maps show whole rooms); 1.0.3 a sign on the only way into part of the Millrace (102-103:
`tests/reach_check.mjs` now checks every place, in the placement audit and a test); 1.0.4 the toy block down the
Nursery's little hole (104). His page keeps a copy of each of his saves with his account (`data/users/me` in the page's
store, read with ArtifactData), which is how 104 was found: load one with `Game.load(Save.migrate(JSON.parse(doc.v)))`. His
download is `hollowell-<version>.zip` (`dist/release/`, not committed): `dist/hollowell_page.html` as `Hollowell.html` plus `tools/release/*` (its launcher
keeps saves in one fixed Chromium profile, ~/.local/share/hollowell, so a later version started the same way carries
on with them). A later release: bump `version.json`, build, test, republish his main page, zip the same way.

## The code (src/)
- One script, joined in file-name order by `tools/build.mjs`; `00_core.js` has `'use strict'`. Everything
  is global. A new file's name decides its place (data files 30–79, story 80–89, `90_main.js` last: it boots).
- The simulation never touches the DOM (`HEADLESS` when there's no `document`): `Gfx` and `Audio` no-op, so
  tests run the real code. Keep it that way: no `document`/`window` outside Gfx, Input, Audio, boot.
- 4-space indent, single quotes, `/* lowercase comments that say why */`, compact lines.
- Fixed 60 Hz `Game.step()`; deterministic: use `G.rng`, never `Math.random`, in anything that affects play
  (effects may use Math.random).
- Key modules: `07_return.js` (the core law: marks, traces, patience, returning, shoving; `GridThing`),
  `08_things.js` (blocks, pots, plates, crystals, doors, chests, signs, pickups, signals), `11_player.js`
  (Wren, thrown things, shards), `06_area.js` (maps from ASCII + legend, tile drawing), `16_world.js`
  (`World.go/enter`, `SPAWN`), `13_script.js` (generator cutscenes: `yield* say(...)`, `yield n`, `yield fn`),
  `21_story.js` (items, fainting, fog), `22_menus.js`, `17_save.js` (+ `migrate()`), `25_debug.js` (HW API,
  autopilot, presets).
- Areas: `defArea({ id, family: outdoor|dungeon|interior, theme, rows, legend, ents, rooms, regions, entry,
  music, house })`. Rooms are rectangles the camera keeps to; entering a room sets Wren's mark there.
- **Old saves must always load**: any change to the save's shape needs a step in `Save.migrate()`.
- Content goes in data files (areas, people, talk, songs). Put each House in its own file.

## Rules of thumb
- Every puzzle must follow from the Return's rules (DESIGN_DOCUMENT.md §4); never special-case a solution.
- Each room gets a scripted solution test once built (DUNGEON_TRACKER.md lists them).
- Commit and push to `claude/wizardly-cray-td23as` at each milestone; never to another branch; never open a PR
  unless David asks.
- Never put spoilers in commit messages beyond neutral descriptions ("Dungeon 2 rooms 1-8", "hub NPCs").
