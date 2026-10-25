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
- Buildings are real shapes wearing their HD picture (`r3Volume`; windows glow at night from the house look or the shop
  picture's `wins`); the island's height levels stand up as plateaus with cliffs (`r3GroundH`, on a grid three points a
  tile, the sea cliffs along a smooth outline: `r3Fine`); water moves and, on computers, reflects (`R3Mirror`); the
  ground up close is fine pixel art by kind (grass, dirt, cobbles, sand, stone walls on anything steep, stairs:
  `31a_ground3d.js`) where the painted picture would smear; tufts, lily pads and cattails are instanced meshes refilled
  as the view moves. Tune the camera, bend and haze in `R3_CAM` / `R3_FOG`.
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

## The new 3D look: the test area (?lab) and Sarah's island on beta (33a–33j)

- `?lab` in the address opens a small test island laid out like the concept art (`scripts/island/plan-lab.mjs`, made
  with `node scripts/make-island.mjs --plan lab` into `game/assets/lab/`). It runs on a throwaway save that is never
  written (`LAB` in 20_world.js; `Save.write` returns), with Joe and Maki on the square and everyone else asleep.
  David approved the look for the whole island (25 October): it's on Sarah's island on beta (below), the live site
  keeps the HD-2D view until he says so.
- There `Env` (33a_env.js) draws the world as real 3D, built once when the area loads: the ground from half-tile
  height cells with a stone wall on anything steep (`EnvGround`), procedural surfaces (`EnvTex`), trees (`EnvTrees`),
  water (`EnvWater`), buildings and props (`EnvBuild`) and grass (`EnvGrass`). R3 still draws people, critters and
  anything `Env.takes(e)` leaves out, and its post pass (bloom, depth of field, the warm grade). Tune it in `ENV`
  (a level's height, the camera, depth of field, how big people stand).
- The button under the clock (`localStorage sc-env-next = 0`) draws the test area the old way, for comparing.
- Sarah's island is in the new look on the beta site (`ENV_ISLAND`: the beta host, or `localStorage sc-env-island` 1 or
  0 anywhere; the tests run without it), once the models have loaded (the HD-2D view till then), with the same button.
  The island is big, so the ground and grass come in pieces (`EnvChunk`, `ENV.CHUNK` tiles): each piece's pictures
  (kinds, damp banks) and mesh are made the first time it nears the view, those on screen at once, the next ones a few
  milliseconds a frame (`Env.stream`), and made again when Sarah's paths change; only pieces near the view are shown, and
  every instanced thing shows only its copies near the view (`EnvCull`: keeps the full list, so moving a copy still works
  through `setMatrixAt`). `EnvGround.water()` says what water each tile shows: the planks of a bridge or the pier ('w')
  stand over the river or sea, drawn by `EnvBuild.decks`, and people stand on them (`Env.groundH`). The farm's fields
  ('F') get soil ridges and their crop (`crops.py`), the hot spring a rim of stones, and what lies flat on the ground
  (plots, the volleyball court, dug holes) is drawn by its 2D drawing into a picture laid on the ground (`EnvDecals`).
  Trees, buildings and props in front of Sarah go see-through round her (`see` in `r3Patch`, `R3U.uSee`).
- People are dolls in the new look (`EnvDolls`, 33k_env_dolls.js; David's pick): Sarah, the island's people (the food
  folks are still their HD cards) and friends online, each put together in code from the same look and clothes as the
  HD pictures (`hdSarahSpec`, `hdFolkSpec`), so the tailor and the salon change them at once: a round head with its face
  painted on a picture (it blinks), hair from rounded pieces per style (`EnvDolls.HAIR`, dyed tips as a fade), a body cut
  for each clothes style (`HD_STYLE`: sleeves, legs, skirts, bibs, lapels...), glasses and hats. The limbs swing at the
  joints as they walk and run, and each of the game's poses (cheer, pick, sit, a tool's swing...) is a set of joint
  angles the doll eases into (`EnvDolls.POSES`); the axe, shovel and rod are in the hand. A doll's person has no card
  (`EnvDolls.draws`).
- The important things are models made in Blender, not in code: `tools/blender/*.py` (`common.py` has the helpers: the
  game's camera and sun for previews, baking, GLB export). Blender runs as a Python module: `pip install bpy` (Blender
  5.x, about 1 GB, fine in a venv), then `python tools/blender/cottage.py --preview DIR` (or `shop.py`,
  `stone_wall.py`, `props.py` for the bench, lamp, mailbox, fences, planter and pumpkins, `trees_ac.py` for the trees,
  fruit, palms and bushes, `vegetation.py` for the pines, sunflowers and wild flower clumps, `props_island.py` for
  every other kind of prop on Sarah's island; most take `--only NAME`) writes `game/assets/models/<name>.glb` (plus
  `<name>_lod1.glb` for phones where there is one) and previews from the game's camera into DIR. Each script models the
  detail in full (every needle tuft, shingle, board, stone) and bakes it (color, the dark between things, a normal map)
  onto a lighter mesh; a fixed seed makes the same model every time. Look at the previews beside the concept before
  bringing a model in. The trees, palms and bushes follow Animal Crossing's (the reference David picked): every leaf is
  geometry with its colors in the mesh, shaded smoothly as its lobe, no baking; fruit is its own model, hung at the
  tree's anchors (empties named `anchor_fruit_N` in the file). `props_island.py` builds the island's props the same
  way, from `kit.py` (rounded boxes, turned shapes, tubes, slabs, each painted as it's made: wood grain, stone mottle,
  darker underneath), in the dollhouse look: a part named `*_glow` (flames) is drawn unlit, `*_water` is water, and the
  windmill's sails are their own model, turned at its `anchor_hub`. `houses.py` makes the neighbors' houses as a kit (a
  body and roof per style, a skin per wall pattern, the add-ons), each part shaded in greys and named by role
  (`house_wall`, `house_roof`, `house_trim`, `house_door`): `EnvBuild.house` puts a house together from its look and
  paints each role in the house's own colors (`EnvModels.tinted`), so what Ginger changes is what you see.
  `buildings.py` makes the island's other buildings (post office, town hall, bank, museum, the shops, arcade, club,
  Ginger's workshop, lighthouse, barn) as finished pieces, `bld_<id>`, their names lettered on their signs (letters
  named `*_glow` are neon). Models with hundreds of small pieces set `kit.DETAIL['lite']` (each rounded edge in two
  steps): the game loads every model at once, so keep `game/assets/models/` light (about 30 MB now). `doll.py` was the
  mock-up of the people as dolls. `ground_textures.py` bakes the ground's surfaces the same
  way (the plaza's flagstones with grass between them, the dirt path, the lawn: color, normal and height, each 4 tiles
  square and wrapping) into `game/assets/textures/`, shipped as `window.TEXTURES`; the ground's shader uses the height
  to let grass reach into the gaps and ragged edges.
- Models: one unit is one tile, Blender's -y is the game's south (the front), z up; trees and props stand on their foot,
  the cottage on its middle with the door at x 0 on the front (the shop's door is at x 0.5), a wall piece runs from x 0
  to its length with its face toward -y, from the lower ground (z 0) to the upper (z 1.5, `ENV.LV`).
- In the game `EnvModels` (33g_env_models.js) loads them (the build ships each with a hashed name in `window.MODELS`;
  the server's CSP allows `blob:` in connect-src for the pictures inside them), gives their materials the view's bend,
  depth of field and shadows (`r3Patch`), uses their colors as they are, and draws a model placed many times as one
  instanced mesh per part. Colors kept in a mesh arrive as glTF's linear values and are turned back into the colors as
  painted (`EnvModels.srgb`). The trees (autumn crowns in autumn), palms, pines and bushes replace the code-built ones
  and follow the game: a shaken tree sways, picked fruit and chopped trees go (`EnvTrees.tick`); the cottage Sarah's
  house, the shop Fortune's, the other buildings theirs (`EnvBuild.BUILDINGS`: how far in front of its middle the
  front wall stands), and the props and flowers theirs (`EnvBuild.PROP_MODELS`: kind, size against its footprint, how
  far back it stands; a picked wild flower's model is hidden until it grows back, Basil's cart by day); the test area
  has a showcase of the props on the lawn below the pond and a town of the other buildings to the south; `EnvWalls`
  (33h_env_walls.js) lays the wall pieces along every south, east and west face of higher ground, and `EnvContact`
  (33i_env_contact.js) darkens the ground softly under things. Until the models arrive the new look draws its own, and
  builds again once they have.

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
