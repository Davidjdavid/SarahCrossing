# Sarah Crossing: notes for working on it

A single-player cozy island game (in the spirit of Animal Crossing) made for Sarah, played online
at https://sarahcrossing.com. Vanilla JavaScript on a canvas, no framework, no bundler; a small
Node.js server (built-in modules only) keeps the islands. See README.md for the layout and
docs/DEPLOY.md for the server.

## The game code (game/src)

- The files are **one script**, joined in file-name order by `scripts/build.mjs` (`00_core.js` has
  the `'use strict'` that covers all of it). Everything is global: a top-level `const` in one file
  is used by others. A new file's name decides where it lands (`2a` sorts after `29`, `6x` after
  `6w`, `90_main.js` is last and boots the game).
- Match the existing style: 4-space indent, single quotes, compact lines, `/* lowercase comments */`
  that say why. Helpers to know: `el(tag, cls, text)`, `btn(label, cls, fn)`, `chip()`,
  `UI.open({title, phone, back, foot})`, `UI.say/ask`, `UI.toast`, `Save.touch()` after changing `S`.
- `S` is the save (the island's whole state). `newState()` and `migrate()` are in `11_save.js`.
- The island (`game/assets/world.json` and its ground picture in pieces, `game/assets/ground/`) is made by
  `node scripts/make-island.mjs`, from `scripts/island/`: `plan.mjs` is the layout David picked (Harbor Square: the
  coast, each level's edge, rivers, ponds, the square, every path and trail, buildings, props and the neighbors' spots,
  in tiles), `layout.mjs` turns it into tiles (cliffs, stairs where a path crosses one, waterfalls, straight bridges,
  trees and flowers) and checks every door, staircase and spot can be walked to from the pier, `paint.mjs` paints the
  ground with the first island's textures, kept in `scripts/island/source/`. Change the plan and run it again rather
  than editing world.json by hand; the same seed always makes the same island. Higher ground is always north of its
  edge (cliffs face south, east or west) and doors are on a building's south side. `--preview out.png` draws a quick
  map of the layout, `--png out.png` the painted ground, without touching game/. Moving things on the island means old
  saves need a `migrate()` step (map 6 is this island, map 5 the same before its shops moved into two rows along an
  alley: progress stays, what was laid out on the old island's ground starts fresh and Sarah's things come back).
  Raised ground ends at the sea in a rim nobody walks on (in 3D the sea cliff stands there).
- The Town Hall, Post Office and Bank (`24b_civic.js`) are signs for now, with stand-in pictures until their art.
- **Old saves must always load.** Sarah's island came from the one-page game and lives on the
  server; any change to the shape of `S` needs a step in `migrate()` that upgrades older saves.
  `tests/fixtures/` has saves made by the one-page game; the end-to-end tests import them.
- With `window.__DEBUG = true` set before the page loads, `window.__dbg` (quick start, teleport,
  give items, set the time...) and `window.__game` exist. The end-to-end tests use them.

## The HD-2D view (31_render3d.js, 32*_hd*.js)

- `R3` draws the island and rooms in 3D (three.js r128 in `game/vendor`): the ground as textures,
  everything standing as a card drawn by its usual 2D draw code. The edit modes and minigames use the
  flat view; without WebGL (or with "HD-2D graphics" off in Settings) everything is the classic view.
- In HD-2D, people and remastered props are drawn with three times the detail into cards with three
  canvas pixels to a world pixel. `HDSprite` (32_hd.js) shades filled parts per pixel. People are built
  from a skeleton in 32a_hd_people.js (any look, outfit, sewn design and accessory: `hdPersonFrame`);
  neighbors are `HD_NPC`, hair `HD_HAIR`, accessories `HD_ACC`, and any atlas sprite can get an HD
  version in `HD_SPR[name]` (exactly 3x the old frame and anchor): `spr()` uses it in HD cards.
- Buildings are real shapes wearing their HD picture (`r3Volume`; windows glow at night from the house
  look or the shop picture's `wins`); the island's height levels stand up as plateaus with cliffs
  (`r3GroundH`, on a grid three points a tile, the sea cliffs along a smooth outline: `r3Fine`); water moves and, on
  computers, reflects (`R3Mirror`); the ground up close is fine pixel art by kind (grass, dirt, cobbles, sand, stone
  walls on anything steep, stairs: `31a_ground3d.js`) where the painted picture would smear; tufts, lily pads and cattails are
  instanced meshes refilled as the view moves. Tune the camera, bend and haze in `R3_CAM` / `R3_FOG`.
- The ground's pieces (15 tiles square) are made just before they come into view, painted a few milliseconds a frame
  (`paintChunkSteps`), and painted again only when something drawn into them changes (`r3ChunkSig`: plots, things on the
  ground, Sarah's paths). Never paint pieces on a timer or several in one frame: that is what made walking hitch.
- Houses and `HD_SPR` pictures are drawn by a worker (`HDW` in 32_hd.js; the build makes
  `assets/hdw-*.js` from 2b_exterior.js and the 32*.js files, so those files must not touch the page
  at load time). Until a picture arrives the card shows today's sprite. `hdNamed(name, true)` draws
  at once on the main thread (tests, sheets).
- What the flat view draws over the world (effects, emotes, sky things) goes on the overlay canvas, placed with
  `R3.project` / `R3.localTransform`; anything drawn with `G.cam` would land in the wrong place. The weather and the
  lighthouse beam are drawn sharp on `R3.wx`, a canvas at the screen's resolution (`r3Sharp`).
- While the HD-2D view shows, `body.hd2d` gives the HUD and dialogue the art sample's dark glass and
  serif type (style.css, end).
- The classic 16x24 art stays the source for menus, icons, the classic view and the flat modes.

## The new 3D look: the test area (?lab, 33a–33f)

- `?lab` in the address opens a small test island laid out like the concept art (`scripts/island/plan-lab.mjs`, made
  with `node scripts/make-island.mjs --plan lab` into `game/assets/lab/`). It runs on a throwaway save that is never
  written (`LAB` in 20_world.js; `Save.write` returns), with Joe and Maki on the square and everyone else asleep.
  Sarah's island doesn't use any of this until David approves the look for the whole island.
- There `Env` (33a_env.js) draws the world as real 3D, built once when the area loads: the ground from half-tile
  height cells with a stone wall on anything steep (`EnvGround`), procedural surfaces (`EnvTex`), trees (`EnvTrees`),
  water (`EnvWater`), buildings and props (`EnvBuild`) and grass (`EnvGrass`). R3 still draws people, critters and
  anything `Env.takes(e)` leaves out, and its post pass (bloom, depth of field, the warm grade). Tune it in `ENV`
  (a level's height, the camera, depth of field, how big people stand).
- The button under the clock (`localStorage sc-env-next = 0`) draws the test area the old way, for comparing.
- The important things are models made in Blender, not in code: `tools/blender/*.py` (`common.py` has the helpers:
  the game's camera and sun for previews, baking, GLB export). Blender runs as a Python module: `pip install bpy`
  (Blender 5.x, about 1 GB, fine in a venv), then `python tools/blender/tree_autumn.py --preview DIR` (or
  `cottage.py`, `stone_wall.py`) writes `game/assets/models/<name>.glb` (plus `<name>_lod1.glb` for phones where there
  is one) and previews from the game's camera into DIR. Each script models the detail in full (every leaf clump,
  shingle, stone) and bakes it (color, the dark between things, a normal map) onto a lighter mesh; a fixed seed makes
  the same model every time. Look at the previews beside the concept before bringing a model in.
- Models: one unit is one tile, Blender's -y is the game's south (the front), z up; trees stand on their trunk's foot,
  the cottage on its middle with the door at x 0 on the front, a wall piece runs from x 0 to its length with its face
  toward -y, from the lower ground (z 0) to the upper (z 1.5, `ENV.LV`).
- In the game `EnvModels` (33g_env_models.js) loads them (the build ships each with a hashed name in `window.MODELS`;
  the server's CSP allows `blob:` in connect-src for the pictures inside them), gives their materials the view's bend,
  depth of field and shadows (`r3Patch`), uses their colors as they are, and draws a model placed many times as one
  instanced mesh per part. The autumn maples replace the broadleaf trees in autumn, the cottage replaces Sarah's house,
  and `EnvWalls` (33h_env_walls.js) lays the wall pieces along every south, east and west face of higher ground. Until
  the models arrive the new look draws its own, and builds again once they have.

## Saving (11_save.js, 12_cloud.js, 6x_islands.js)

- `Save.write()` keeps a copy on the device (`localStorage`, marked pending) and sends the island to
  the server (at once when forced, otherwise at most every 20 s). The pending copy is sent on the
  next visit if the page closed first.
- Every save names the server rev it was based on; the server answers 409 if the island moved on
  (another device). The player then picks which to keep (`IslandList.conflict` / `IslandList.fork`).
- Switching islands, importing and restoring reload the page (`IslandList.leave()`), so nothing of
  one island carries over into another.
- Save codes (`SC1:` = deflate + base64, `SC0:` = base64, or raw JSON) are the one-page game's
  format and still what **Save a file** / **Make save code** produce.

## The server (server/)

- `islands.mjs`: one folder per island in `DATA_DIR/islands/<id>/`, `island.json` written atomically
  with `state` last (so the list can read the summary without parsing the save). Backups: hourly
  while playing, all kept 2 days, then one a day for 60 days; plus `before-import`,
  `before-restore` and `before-overwrite` copies (90 days).
- `server.mjs`: the password (cookie signed with `DATA_DIR/secret`), the JSON API (writes need the
  header `X-Sarah: 1`), the built game from `STATIC_DIR` (hashed asset names, cached forever).
  Problems in the browser are posted to `/api/log` and end up in the server log.

## Checks

`npm test` (fast) and `npm run test:e2e` (Chromium via Playwright, ~2 min). Run both before pushing;
CI and the deploy run them too. Pushes to `claude/serene-mendel-8428vr` deploy to the beta site
(https://beta.sarahcrossing.com, its own islands); the live site (Sarah's island) only changes when
the Deploy workflow is run by hand with target `live` (or on a push to `main`). Never deploy live
unless asked.
