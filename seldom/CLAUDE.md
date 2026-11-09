# Seldom: notes for working on it

An original adventure game made for David (the brief: `GAME_BRIEF.md`). It lives in this folder of the
SarahCrossing repo but has nothing to do with Sarah Crossing: separate code, separate tests, no server.

**Spoilers:** `DESIGN_NOTES.md` is the full design. `PROJECT_STATE.md` says where things stand and what's next: read it
first when resuming, and never restart the project. Progress updates to David must be spoiler-free (no concept, mechanic,
genre turn, characters, secrets or ending). Commit messages too: keep them vague ("Seldom: fourth area, tests").

## Running it

- `node seldom/build.mjs` joins `src/*.js` (file-name order, one script, everything global) into `seldom/seldom.html`,
  a single file that opens straight from disk. That file is the deliverable and is committed.
- `seldom.html?debug` exposes `window.__seldom` and the globals (`Debug.go(tx, ty)`, `Bot`, `Laws`, `Cam`...).
  `?debug&skip` skips the opening scene. `?test` is the prototype's test ground (`20_testmap.js`).
- Publishing: `node seldom/build.mjs` also writes `seldom/artifact.html`; publish that same file path with the Artifact
  tool to update https://claude.ai/artifact/S9EUh2jjQ5MwP4zPJfV29v in place (private to David).
- Blind playtests: `node seldom/tests/playserver.mjs PORT SHOTS 'Debug.afterLampNight()'` (or `afterQuarry`,
  `atLighthouse`), then brief a fresh agent with only what a player would know; never let it read `seldom/`.
- Tests: `node seldom/tests/run.mjs` (all), or `node seldom/tests/playthrough.mjs [shots-dir]` (the whole game, start to
  credits, played by `Bot` with the player's buttons) and `node seldom/tests/laws.test.mjs`. `tests/shot.mjs OUT "query"
  'js...' 'shot:name'` takes screenshots. Playwright's Chromium is preinstalled (createRequire).

## The code

- Style as in Sarah Crossing: 4-space indent, single quotes, compact lines, `/* lowercase comments that say why */`.
- `00` core, `01` input, `02` font (pixel font from text), `03` art (pixel grids drawn in code, outlined), `04` tiles,
  `05` maps and things (`kind()`, `GameMap.add/addAt`, `boxBlocked`, `moveEnt`), `05b` Story hooks, `06` the view
  (`Cam`: follow, look, pin, zoom, split, eye), `07` the laws (`Laws.see/bound/wrap/seam/crowd`), `08` actors, `09` the
  session (`World`: doors, `update`, interact), `10` talk (`say`, `ask`, `scene`, `wait`), `11` fx and the notebook
  (`LAWS`, `Notebook.saw`), `12` render, `13` UI (light, HUD, notebook, menu), `14` audio (synth, `SONGS`, `Music`),
  `15` save, `16`-`19` world things, songs, people (`findPath`, `goTo`, `dayBrain`), away; `20`+ the content: test map,
  island terrain (`21_island.js`, painted in code), village (act one), pasture, quarry, woods, hollow, cape (act three,
  `Eye`, `Beam`), rooms, ending, act two hints; `40` title, `85` debug and `Bot`, `90` main loop.
- The one rule everything follows: only things in a frame of the view are updated (`World.update` skips unseen things).
  Anything that should only happen "while watched" is just an `update`. Don't add timers that run unseen.
- Saves: `Save.snapshot/apply` (localStorage `seldom-save-1`); named things (`name:`) are saved per map with their `st`;
  tiles changed with `setTile`; props by `id`. Anything new that must persist goes in `st`, a flag, or a named thing.
- Area files add their things with `ISLAND_ADD.push(fn)`; rooms with `room(id, rows, {exit, init})`.
