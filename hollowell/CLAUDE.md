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
