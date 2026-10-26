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
  ground with the first island's textures, kept in `scripts/island/source/`. Trees grow in groves with clearings (a slow
  noise says where: thick in the woods, little stands on open ground, broken runs along cliff tops) and wild flowers in
  small patches of one kind, so the island never looks evenly sprinkled. Change the plan and run it again rather
  than editing world.json by hand; the same seed always makes the same island. Higher ground is always north of its
  edge (cliffs face south, east or west) and doors are on a building's south side. `--preview out.png` draws a quick
  map of the layout, `--png out.png` the painted ground, without touching game/. Moving things on the island means old
  saves need a `migrate()` step (map 7 is this island: its woods in groves and clearings; coming from an older map is a
  fresh start that keeps only Sarah's stats and money, plus her name, the island's, her birthday and how long she's
  lived here, David's call; the whole old save is kept inside the new one as `before7`).
  Raised ground ends at the sea in a rim nobody walks on (in 3D the sea cliff stands there). Half tiles (`cut` in
  world.json, `cuts()` in layout.mjs): where the sea, a river or a pond meets land in a stair-step, or a path turns or
  runs on a slant, the step's outer corner tile is cut along its diagonal (a, b, c, d: its NW, NE, SE, SW corner is the
  other side's). It's still one tile for building and placing; a cut water tile's corner is ground you can walk onto
  (`Area.solidPx`, `inCut`), and the new look draws the edge as a straight diagonal (`EnvGround.kindPx`, `cutAt`).
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

## The new 3D look: the test area (?lab) and Sarah's island on beta (33a–33m)

- `?lab` in the address opens a small test island laid out like the concept art (`scripts/island/plan-lab.mjs`, made
  with `node scripts/make-island.mjs --plan lab` into `game/assets/lab/`). It runs on a throwaway save that is never
  written (`LAB` in 20_world.js; `Save.write` returns), with Joe and Maki on the square and everyone else asleep.
  David approved the look for the whole island (25 October): it's on Sarah's island on beta (below), the live site
  keeps the HD-2D view until he says so.
- There `Env` (33a_env.js) draws the world as real 3D, built once when the area loads: the ground from half-tile
  height cells with a stone wall on anything steep (`EnvGround`), procedural surfaces (`EnvTex`), trees (`EnvTrees`),
  water (`EnvWater`), buildings and props (`EnvBuild`); the lawn is a texture of little diamond leaves like the GameCube
  Animal Crossing's (`EnvTex.lawn`, David's pick: no 3D tufts, no flowers but the ones you can pick). R3 still draws people, critters and
  anything `Env.takes(e)` leaves out, and its post pass (bloom, depth of field, the warm grade). Tune it in `ENV`
  (a level's height, the camera, depth of field, how big people stand).
- Sarah's island is in the new look on the beta site (`ENV_ISLAND`: the beta host, or `localStorage sc-env-island` 1 or
  0 anywhere; the tests run without it), once the models have loaded (the HD-2D view till then). There is no switch
  back to the old look any more (David: "we don't need to see the old version when we play").
  The island is big, so the ground comes in pieces (`EnvChunk`, `ENV.CHUNK` tiles): each piece's pictures
  (kinds, damp banks) and mesh are made the first time it nears the view, those on screen at once, the next ones a few
  milliseconds a frame (`Env.stream`), and made again when Sarah's paths change; only pieces near the view are shown, and
  every instanced thing shows only its copies near the view (`EnvCull`: keeps the full list, so moving a copy still works
  through `setMatrixAt`). `EnvGround.water()` says what water each tile shows: the planks of a bridge or the pier ('w')
  stand over the river or sea, drawn by `EnvBuild.decks`, and people stand on them (`Env.groundH`). The farm's fields
  ('F') get soil ridges and their crop (`crops.py`), the hot spring a rim of stones, and what lies flat on the ground
  (plots, the volleyball court, dug holes) is drawn by its 2D drawing into a picture laid on the ground (`EnvDecals`).
  Everything standing on the grid stands in the middle of its tile or footprint (`Env.tileSpot`), fences join tile to
  tile, and the ground's kinds, banks and shore follow the tiles (straight along tile lines, corners rounded, a little
  wobble): Settings > Show the tile grid draws the tiles (`EnvGround.gridOn`, `sc-grid`).
  Trees, buildings and houses in front of Sarah (and anything tall right in front of the camera) fade to a soft ghost
  (`see` in `r3Patch`, `R3U.uSee`): the main pass leaves those pixels out and `EnvGhost` (33n_env_ghost.js) draws them
  again in a second pass on layer 1, depth first then color, only for the few copies on screen that could be fading
  (`EnvModels.tall` decides which models take part). No dither patterns.
- People are dolls in the new look (`EnvDolls`, 33k_env_dolls.js; David's pick): Sarah, the island's people and friends
  online, each put together in code from the same look and clothes as the
  HD pictures (`hdSarahSpec`, `hdFolkSpec`), so the tailor and the salon change them at once: a round head with its face
  painted on a picture (it blinks), hair from rounded pieces per style (`EnvDolls.HAIR`, dyed tips as a fade), a body cut
  for each clothes style (`HD_STYLE`: sleeves, legs, skirts, bibs, lapels...), glasses and hats. The limbs swing at the
  joints as they walk and run, and each of the game's poses (cheer, pick, sit, a tool's swing...) is a set of joint
  angles the doll eases into (`EnvDolls.POSES`); the axe, shovel and rod are in the hand. A doll's person has no card
  (`EnvDolls.draws`). The food folks are painted toys from `folks.py` (`folk_<sprite>`), made after their HD pictures
  in the pictures' own pixels: the feet, eyes (and the gingerbread builder's arms and legs, the goat's legs) are their
  own objects with their origins at the joints, so they waddle, hop, step and blink (`EnvDolls.poseFolk`); a gift hat
  or glasses sits at `anchor_hat` / `anchor_eyes` (`EnvModels` keeps each part's name and origin, an anchor's scale).
  The council's broccoli and the old keeper are made too, for the rooms.
- The wildlife (birds, gulls, the owl, squirrels, rabbits, deer, crabs, ducks, frogs, butterflies) are toys from
  `critters.py` (`critter_<kind>`), posed by `EnvCritters` (33m_env_critters.js) from the game's own critters and
  Flutter's butterflies: wings fold or flap, birds peck, the owl blinks, ducks float at `Env.waterH`. While the models
  are still downloading, `Env.cover` shows a moment of getting the island ready (at most 25 s) instead of the old look.
  On a grey day the new look's light is soft (the sun dimmer, shadows faint: `soft` in `updateLight`).
- The small and far-off things are toys too, from `tools/blender/small_things.py`: shells and gems lying on the island
  (`item_<id>`; fruit uses the trees' `fruit_<id>`), drawn by `EnvItems` (33p_env_items.js) in place of their pictures;
  Sarah's sailboat at the pier, the boats crossing the sea, dolphins, planes (the propeller its own model,
  `sky_plane_prop`), hot air balloons and the gull flock, posed from SeaSky's own things by `EnvSea` (33o_env_sea.js),
  the planes and balloons small and high so they read as up in the sky (their shadows cross the ground below).
- Rooms in the new look (`EnvRoom`, 33l_env_room.js): the dolls and folks go indoors too (`EnvDolls.attach` moves them
  between the island's group and the room's), and the room is a box you look into: the back wall wears the HD view's
  wall picture (so what's hung there shows), the side walls one tile of its paper repeated, skirting boards, dark cut
  tops, a sill with the doorway; it's lit brighter and warmer than the HD view's rooms. The floor pieces of furniture
  are models from `furniture.py` (`furn_<id>`: the kit in `furn_kit.py`, the pieces in `furn_a.py`..`furn_d.py`, one
  file per batch; `--batch furn_b` builds one), placed on their footprints by `EnvRoom.furniture` (built again when the
  room changes); a plush is its folk's model, small. What a model doesn't cover stays the HD view's picture: what's
  hung on the wall (on the back wall's picture), rugs (on the floor), pieces drawn moving (arcade cabinets, the disco
  floor), and the small things on tables, which stand on the model's top (`anchor_top`, `EnvRoom.place`). The
  furniture loads after the island's models, so the island never waits for it. Glass is a part named `*_clear`
  (see-through).
- David's rule (27 October): everything in the world is a 3D model in the dollhouse look (things on the ground, in the sky
  and at sea, what's hung on walls and set on tables), except the minigames (cooking, the arcade cabinets, jump rope,
  volleyball and the like), which keep their 2D look.
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
  steps): the game loads every model at once, so keep `game/assets/models/` light (about 44 MB now, 7 of it furniture). `doll.py` was the
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
  (33h_env_walls.js) lays the wall pieces along every south, east and west face of higher ground, running on round
  corners to meet the next (no corner posts: David didn't like them); a staircase gets steps that match its path (the
  flagstones' own stones on the square's paths, packed earth held by logs on dirt paths and trails) between walls of the
  cliff's stone (`EnvBuild.stairs`, climbed a step at a time: `EnvGround.stairH`), and `EnvContact`
  (33i_env_contact.js) darkens the ground softly under things (and `EnvGlow` lays a warm pool of light under every lamp,
  lantern and lit doorway at night). Ponds and streams (`EnvGround.shapeWater`) and the beaches (`shapeShore`) meet the
  water along a blurred outline, not the tiles' steps; the depth map behind the water's shader also says where it flows
  (streams' current streaks) and where it's the hot spring (milky, steaming). Until the models arrive the new look draws its own, and
  builds again once they have.

## The dialogue spreadsheet (scripts/dialogue)

- `node scripts/dialogue/export.mjs docs/dialogue/dialogue.xlsx` writes every line anyone reads (found by reading
  game/src: `extract.mjs`; who says it and when, in plain words: the hand-written tables in `describe.mjs`) and the new
  lines written ahead for features to come (`new-civic.mjs`: the zip code, the Post Office, the Bank, the Town Hall, each
  outcome) into a spreadsheet for David (needs python3 with openpyxl). When he sends it back,
  `node scripts/dialogue/apply.mjs his.xlsx` (`--dry` first) puts each "Your new line" into the code in place of its
  original (by its exact text, nearest its old line; quotes and `${}` handled); his notes and his edits to the new lines
  land in `docs/dialogue/notes-from-david.json`.

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
