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
- The Town Hall, Post Office and Bank (`24b_civic.js`) are signs on the live site. On beta (`CIVIC_PREVIEW`: the beta host,
  or `localStorage sc-civic` 1 or 0 anywhere; the tests run without it) they open into rooms (`6zc_civic.js`: the Cozy
  Council at the Town Hall's desk, the Post Office and Bank counters waiting with a bell until David picks their keepers),
  and each counter lists the building's screens (`6zd_civic_screens.js`, `CIVIC_SCREENS`): every feature in docs/ROADMAP.md's
  "Late in development" drawn with sample numbers in each state it can be in (works, loading, no internet, service down,
  empty, not enough money...), with the on-screen words from the dialogue sheet (`new-civic.mjs`). The preview's foot has
  a button per state; `__dbg.civic(id, state)` opens one. Most now work for real (`CIVIC_LIVE[id]`, drawn first as
  "Yours"; the samples stay in the buttons): the Bank (`6ze_bank.js`: savings with interest each morning, goals, the
  statement from `moneyFlow`, since every `addMoney(n, quiet, why)` says why, the safety deposit box, the house loan
  Ginger offers), the Post Office (`6zf_post.js`: letters to neighbors delivered next morning with replies, postcards,
  special deliveries, the island paper each morning with an archive, order tracking) and the Town Hall (`6zg_townhall.js`:
  ordinances through `townWake`/`townHours`/`townOrd`, the census, the history `townLog` writes as things happen,
  records, statistics, achievements, landmark names on the map (`landmarkName`), holding a missed holiday (`townHeld`,
  joined into `holidaysToday`), the flag (a wall piece in the Town Hall), backups) and the real world (`6zh_world.js`: a zip
  code registered at the Town Hall gives the island that town's time if Sarah wants (`zipUseTime`), the day's forecast
  as its weather (`todayWeather`) and headlines in the paper; the Bank's market has real companies' closing prices,
  ten sand dollars to the dollar, with dividends on the 1st). The server looks the world up (`server/world.mjs`:
  `/api/world?zip=`, `/api/market`; free services with no key: zippopotam.us, open-meteo.com, news feeds, stooq.com;
  kept for the day; `WORLD_FAKE=1` answers with made-up data, as the tests do), and island jobs (`6zi_jobs.js`: three a
  day at the Town Hall: packages to deliver through the talk menu, leaves to sweep off the square, the dock sign to
  repaint, shells, fruit or fish to hand in). The Post Office paints Sarah's mailbox (`MAILBOX_COLORS`: a model each,
  `mailbox_<color>` from props.py) and sells it in other styles (`MAILBOX_STYLES`: `mailbox_<style>` from props_island.py,
  whose part named `*_body` takes the paint), and Residents lets Sarah nudge a good friend's hours (`S.town.sched`, through
  `townWake`), pick two places they like going in their free time (`townSpots`, `RES_SPOTS`, weighted in makePlan), pick
  what they wear today and set their catchphrase. Their
  morning work runs in `dailyCheck` (`bankTick`, `postYesterday`/`postTick`, `townTick`); the Bank and the post are each
  person's own (`PERSON_KEYS`), the town is the island's.
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
- Settings > Picture quality and Draw distance (`GFX`, kept per device in `sc-quality` / `sc-far`): Auto is the device's
  own (phones lighter and shorter, a slow computer drops its quality by itself in `watchSpeed`); a pick stays as picked.
  Quality scales the pixels drawn (`R3.quality`; High keeps the water's reflections), distance scales `R3.farTiles()`,
  which the haze, the ground pieces and every culled thing follow.
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
  The island's 3D is built once, and built again when Sarah comes back outside after something it's made from changed
  indoors (`Env.look`: the houses' looks, the house's size, the mailbox's color).
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
- Fishing in the new look is 3D (`EnvFishing`, 33r_env_fishing.js): the rod in Sarah's hand (`style_rod`, props2.py; the
  line tied at its tip, `d.rodTip`), the line a thin tube sagging to the bobber, ripples at a nibble and the bite, the
  fish's shadow drifting up; a catch flies up out of the water into her hands (`G.reel`) and is held up over her head
  (`G.held`, the `holdup` pose) while she shows it off. The flat views keep `Fishing.draw`.
- Neighbors who stop to chat (2d_life.js `Chats`) act it out in the new look: whoever's line it is talks (mouth and a
  hand going while their bubble is new), the other looks at them and nods now and then (`act`'s `listen`, `nod`). With
  nothing to do they find something of their own for a while (`idleStart` from updateNPC, 33kd_doll_idle.js `IDLE_ACTS`,
  `n.idle`): the stars at night, an ice cream, sitting on the grass, their phone, a book, painting at an easel, a mug of
  cocoa, fishing where there's water a step or two ahead (`idleWater`; a doll in the game's fishing pose, a folk holding
  the rod out), each with its own pose (`idleDoll`, `idleFolk`) and the thing in hand from props2.py (`style_book`,
  `style_phone`, `style_snack`, `style_cup`, `style_brush`, `style_palette`; `idleHold`, `HOLD`; a folk's hand is its
  arm's furthest point, `handOf`); who likes what is `IDLE_LIKES`. A chat, Sarah talking to them or their day moving on
  ends it, and nobody busy with something starts a chat; walk up to them and they mention it (`IDLE_HELLO`). The flat
  views show them standing.
- Catchphrases (6zk_catchphrases.js): every neighbor has one (`CATCH`), said at the end of some of their lines (`voiced`'s
  `catchTail`); a good friend (four hearts) takes a new one from the talk menu ("New catchphrase?", `catchFlow`, typed in
  `askText`, tidied by `catchClean`) and reacts in their own way (`CATCH_REACT`); the Town Hall's Residents sets it too. Kept
  as `S.npcs[id].catch` (missing: their own).
- The museum is in rooms (65a_museum_wings.js, David's note of 26 October): the hall (65_museum.js: Brulee's desk, the easel
  corner) has an archway for each wing on its back wall (`MUSEUM_WINGS`; the wall tile is open and walking up into it goes
  through: `a.upDoors`, checked in `afterMove`; each wing's room has `exitTo: 'museum'`). The gallery (`MUSEUM_WALL`: five
  on the wall, three easels), the pottery hall (`MUSEUM_PEDESTALS`, ten; an older save's shorter `hung`/`peds` lists fill
  the new spots from what isn't out), the aquarium (`AQUARIUM`: every fish but the boot, from the start; in the new look
  the fish swim in `furn_fish_tank`, `EnvRoom.animate`), photography (`MUSEUM_PHOTO_SPOTS`: an album photo with `museum`
  set hangs there, `title` its card, `real` for one uploaded from the device, shrunk to 720 pixels; the album's twelve
  don't count it, and the server keeps the fields), fashion (`MUSEUM_FORMS`: dress forms in copies of Sarah's designs,
  `S.art.fashion`) and island history (`MUSEUM_HISTORY`: a case per old mystery, its keepsake once solved; a founding
  plaque). The museum's models are furn_h.py's (`museum_arch` with its name lettered on a `*_pic` plaque, `fish_tank`,
  `touch_pool`, `display_case`). `EnvRoom.pic` takes a picture made while playing (`Assets.dyn`, with `hi` a sharper copy
  for the new look), so Sarah's paintings and the photos hang as framed pictures there.
- Sarah's own songs (6zo_mysongs.js): at the club, "Your songs" takes a music file from her device; `songChart` listens
  to it (onsets from spectral flux, `songListen`; the tempo by autocorrelation and the beat's place, `songTempo`) and writes
  a dance on that beat (Easy on the strong beats, Medium the beats and strong offbeats, Hard the eighths; arrows from the
  sound's brightness). The file stays on the device (IndexedDB `sc-songs`, `MySongs.put/get`), the dance with the island
  (`S.mysongs`: name, level, tempo, length, `steps` packed by `packSteps`); `Dance.start('my:<id>', { file })` plays it
  through `Music.startFile`, `songDef(id)` names any track. Her songs tip once a day between them (`S.dance.myPaid`).
- More holidays to do (6zp_holiday_events.js; the first six are 6z_festivals.js): New Year's Eve gathers everyone who's up
  on the square from 11 PM (`nyeOverride`, a `late` override that keeps them up past bed), a countdown fills the screen
  ten seconds before island midnight and the square cheers at it, a little friendship with each neighbor there once a
  year (`NewYear.tick`, every frame); Lunar New Year, a red envelope from each neighbor (`lunarHello`); Valentine's Day,
  "Happy Valentine's!" in the talk menu, truffles back from a good friend (`valentineOptions`, `valentineGive`).
- Karaoke has a request each night (`karaokeRequest`: one of the poems Sarah has, from the seed and the day), first in the
  list and on the board; the first time she sings it that night the crowd tips 200 more.
- Most days a neighbor not working at noon goes home for lunch, some days to Mac's (`lunchOverride`, the first of
  makePlan's overrides, so anything else planned that day wins), and some evenings two neighbors pair up for a visit, one
  at the other's house while the host stays home (`friendVisits`/`visitOverride`: from the day alone, so both plans agree);
  after work, some days, an errand at the Bank or the Post Office where those rooms are open (`errandOverride`). Each
  morning the farmer (`FARMER`, Cuke) waters the fields and carries a basket to Fortune's, and some afternoons the fisher
  (`FISHER`, Kai) fishes off the pier and takes the catch to the shop (`farmOverride`, `catchOverride`); after the delivery
  some neighbors stop at Fortune's and walk home with a tote of groceries (`shopOverride`, about one in four a day). An
  override can carry extras for its stretch of the day (`tend`, `fish`: what they do there, in `idleStart`; `carry`: what's
  in hand on the way, `CARRY` in 33kd_doll_idle.js, props2.py's `style_basket`, `style_bucket`, `style_grocery`, the
  vacation's suitcase).
- IslandMart on Sarah's laptop (67_laptop.js) sells a week's stock, new every Monday (`martWeek`, `laptopCatalog(tab, day)`:
  so many of each kind, `MART_WEEK`, floor pieces taken a kind at a time, `MART_GROUPS`), from the seed; Order again keeps
  everything she's ever had (`laptopAgain`). Each piece it sells comes in four colors (6zz_colors.js): its own and three more,
  each an item of its own (`<id>@<color>`, "Sofa (mint)", the same price; `FURN[id].base`, `.color`), frozen per piece in
  `PAINT_TABLE` so saves keep them (a sellable piece missing from it fails a test: `paintTableMissing()` gives its line);
  the picture and the HD picture are repainted where the piece's main color is (`colorSprite`, `colorHd`, from `spr` and
  `iconCanvas`), and in the new look the model's own vertex colors (`colorGeo`, in `EnvRoom.parts`); a wooden piece comes in
  woods and white, a plant changes its pot. The week's stock has each piece in one of its four (`martColor`), and a save
  holding a color this version doesn't have gets the piece itself (`migrate`).
- Nicknames (6zl_nicknames.js): at four hearts a neighbor asks once, the first time they see Sarah that day, if they can
  call her something (`NICK_IDEAS`, or one she types, or her name; `nickAsk`); their lines then call her by it (`nickIn`
  in `UI._line`, that neighbor's lines only), and "Call me something else?" changes it (`nickFlow`). Kept as
  `S.npcs[id].nick` and `nickAsked`.
- Friendship, deeper (6zm_friendship.js): neighbors remember the last few things Sarah did with them (`remember(id, kind,
  data)` from the gift, hug, favor, game, visit and lost-and-found flows; `S.npcs[id].mem`, eight at most) and some days
  bring one from the last week up (`memoryLine`, said once). After three weeks without a word a friendship fades a point
  every other day, at most ten, never below the hearts it has (`friendshipTick` in `dailyCheck`; `faded`, `missed`), and
  they say they missed her (`MISSED_LINES`). Each heart brings something new, one a day (`friendMilestone`, after the
  nickname question): their favorite spot at two (`FAV_SPOT`; from then on their text invitations to hang out go there
  most often, `Invites.hangSpots`; something personal is at four and five, `TM_SHARE`), asking her advice at three
  (`ADVICE`, `r.advice` her answer), a gift for her house in the mail at four (`HOUSE_GIFT`), a best-friend moment at five (`BEST_FRIEND`, `r.bff`);
  kept as `ms2`..`ms5` (the day) and `msDay`. The neighbors' own friendships (6zn_bonds.js): a bond per pair, -5 to 10
  (`S.bonds['a+b']`, `bond(a, b)`, a few pairs start close: `BOND_START`), moved by each storyline step (`BOND_STATE`, from
  `Drama.setState`), raised a little by a chat once a day per pair up to `BOND_CHAT` (`Chats.end`), a falling-out mended a
  point every third day (`bondTick`). Close friends (`BOND_CLOSE`) stop to chat more and walk over to each other; two
  fallen out (`BOND_OUT`) don't chat (`Chats.ok`); they talk about it (`bondLine`, a talk topic) and the census says who's
  close (`bestFriendOf`).
- Vacations (6zj_vacations.js, `VAC`: each neighbor's place, postcard and souvenir): about three times a year (one in
  every `VAC_EVERY` days) each neighbor goes away for three to five days, worked out from the seed (`vacationOf`,
  `vacationIn`), never over their own day, a festival in `VAC_KEEP` or Sarah's birthday, one at a time (a trip that would
  clash slides on a few days). The plan (`vacationPlan`, after makePlan in `Plans.get`):
  to the pier at 10 with a suitcase (`bags`, `style_suitcase` in hand), onto the boat (`sleepAt: 'boat'`; `npcDoor`), two
  friends there to see them off (`vacationOverride`); away between (`away`); off the boat at 3 PM the day they're back
  (`wakeAt: 'boat'`). `vacationTick` (in `dailyCheck`) mails the postcard and, for three hearts or more, the souvenir; the
  board and calendar list it (`vacationEvents`), they talk about it (`vacationLine`), their door has a note, texts say
  they're off the island (`awayNow`), and storylines don't cast them (`vacationSoon`). Wonton leaves his spring too
  (`inSpring`).
- Hats fit the hair (`EnvDolls.hatFit`, `HAT_FIT` in 33ka_doll_kit.js): a covering hat grows to the hair at its band and
  presses the hair above it down and in; what sits on top rests on the hair round a ring half a head out; what goes round
  the head goes round the hair.
- Garden plots are raised planter boxes (`planter_box`, props_island.py; solid, planted from beside them), Sarah's six by
  her house and the community garden's eight by the farm (`community` in plan.mjs, plots with `c`, after hers so her
  plots keep their numbers): each morning `communityTick` plants a leftover seed, grown, in none, one or two empty beds (a
  third of mornings each). The farm's fruit trees are the plan's `fruitTrees`. Both are placed by `layout.mjs`'s
  `additions()`, after everything random has grown, so the rest of the island stays exactly as it was; the save step
  `garden8` returns anything of Sarah's that stood on their tiles to her storage.
- The island's trees, palms, wild flowers and gem spots are frozen in `scripts/island/greenery.json` (the plan's
  `greenery`): `layout.mjs` keeps them as they are, leaving out only what a building, prop, road or lawn now covers, so
  moving a street or a shop never regrows the woods. Delete the file (and the plan's line) to grow them again from the seed.
  The square (27 October): the grand fountain (`fountain_grand`, props_island.py, 4x3 and solid: `PROP_SIZE`/`PROP_ROWS`),
  the notice board in front of the big tree, a flower bed where David's statue stood (the statue, smaller, is on the lawn
  along Market Lane), lamps along the paths; the shops on the alley and Market Lane further apart, with benches, lamps and
  flower beds in the alley and two empty lots at its east end. Save steps `square8` and `lane8` (a shop Sarah had moved
  goes to its new spot) return whatever of hers was in the way. Fortune's shop stands at Market Lane's east end and Fortune
  has a house of their own (`h_fortune`, just west of the square; a little garden where the shop stood); after hours the
  shop stays open on the honor system (Fortune asleep at home). The café's lot has a COMING SOON sign (`sign_lot`,
  `sign_comingsoon`) and two plots of land for sale in the neighborhood (`land_a`, `land_b` in the plan's lots) have FOR
  SALE signs (`sign_land`, `sign_forsale`) and paths out to them: where the neighbors still to come will live. Save step
  `fortune8`, with Fortune's letter.
- The watering can (`can`, a tool on Fortune's rack, 2a_flowers.js): it waters the tile in front of Sarah and one each side
  (`waterFront`, `waterTiles`; `pl.wet` is the day a planted flower was watered, darker soil in 2D and 3D). Each morning
  `flowerBreed` (in `dailyCheck`) may grow a new flower beside two watered ones of a kind (two of a color make it again,
  two colors the third). In the new look the doll holds the room's can (`furn_watering_can`, `EnvDolls.canModel`) and
  tips it in the `water` pose. The boat Sarah came on is `boat_home` (small_things.py), as big as a building, at the pier.
- The camera's scrapbook (55a_scrapbook.js, David's note of 27 October): a photo's tags say what's in it (`Scrapbook.seen`:
  neighbors, buildings and landmarks, wildlife and what's at sea or in the sky, things lying about or furniture indoors,
  the weather and time of day, the new look's sights, a holiday; plus the filter), kept with the photo (`Photos.add(url,
  tags)`, the server keeps `tags`) and shown under it in the album. `S.scrap` keeps a page per thing (`{ n, first }`), with
  a short bio (`SCRAP_BIO`); the scrapbook counts each part but never says out of how many.
- Clocks keep the time in the new look: a furniture piece's parts `*_hour` and `*_minute` (furn_kit's `P.hour`,
  `P.minute`, drawn pointing at 12) are turned by `EnvRoom.animate` to `Clock.hourF()`.
- Flowers are one plant per kind (vegetation.py's `flower_<kind>`), the petals their own part painted in the flower's
  color (`EnvItems.PETALS`, `petals(id)`): wild ones (`EnvBuild.flower`, instanced per color through
  `EnvModels.instances`' `tint`), planted ones and the plots' (`EnvItems`), a picked one lying on its side.
- The wildlife (birds, gulls, the owl, squirrels, rabbits, deer, crabs, ducks, frogs, butterflies) are toys from
  `critters.py` (`critter_<kind>`), posed by `EnvCritters` (33m_env_critters.js) from the game's own critters and
  Flutter's butterflies: wings fold or flap, birds peck, the owl blinks, ducks float at `Env.waterH`. While the models
  are still downloading, `Env.cover` shows a moment of getting the island ready (at most 25 s) instead of the old look.
  On a grey day the new look's light is soft (the sun dimmer, shadows faint: `soft` in `updateLight`).
- Things Sarah happens to see, never announced (no popups, nothing to win: `EnvSights`, 33q_env_sights.js): a ring of
  glowing toadstools (`fairy_mushroom` from props_island.py, its cap `*_glow`) in the clearing by the old tree on autumn
  nights and the night of a rainy day; a rainbow in the mist at the falls' foot the morning after rain when the sun's out
  (`todayWeather(day)` takes another day); the northern lights low over the north horizon on some clear winter nights (in
  the sky's shader, `uAur` in `r3Sky`, their green on everything in `updateLight`); sea turtle hatchlings
  (`critter_turtle`, flippers that paddle) scrambling from a nest on the far beach into the sea on some summer dawns.
  "Some" is a coin toss per day (`EnvSights.lucky`), the same all day. The owl at night and the deer are the wildlife's.
- The holidays' decorations on the island (54_events.js `decorateIsland`) are models too (`EnvBuild.holidayModel`): pumpkin
  lanterns, the lunar and red lanterns and heart lamps (the furniture's own models, loaded with the island's:
  `EnvModels.OUTDOOR`) and bunting (`bunting`, `bunting_green` from props_island.py); the island's 3D is built again when
  the day's decorations change (`Env.look`). A decoration can name its own model (`model3d`: Spooky Season's carved
  `jack_o_lantern` / `jack_o_lantern_b`, whose faces are `*_glow`, the square's `jack_stack` hay bales and
  `bunting_spooky`), and one put down with `stand()` is solid like a prop (`solidTile`, unblocked when the decorations come
  down), never on a path. Spooky Season puts jack-o'-lanterns at every shop and building's front corners and by every
  house's door (`fronts`); Halloween itself adds one by every lamp post. The Winter Lights (all of December from the 10th)
  string the grand tree with lights and a star (`grand_lights`), put a wreath on every house's door (`shownLook`: the
  look the island shows, never saved), red lanterns at every shop and red and green bunting (`bunting_winter`); the Winter
  Holiday adds presents under the tree (`grand_presents`) and a lantern by every door. What's made for the grand tree is a
  decoration with `grand` (its model), stood with the tree by `EnvTrees` in the tree's own coordinates and drawn over the
  tree's picture in the flat views (`drawTreeLights`, `drawTreePresents`). Snowmen stand by the square and Sarah's house all
  winter (`snowman`, `drawSnowman`); Lunar New Year puts lanterns at every shop (`bunting_lunar`), Valentine's heart
  lamps (`bunting_hearts`), the Harvest Festival and Feast Day hay bales of pumpkins and corn (`harvest_stack`,
  `bunting_harvest`), the Fourth of July red, white and blue (`bunting_july`; a holiday's `deco` can name a bunting model
  with no picture of its own: the flat views draw `bunting`).
- On Halloween night (5 PM to midnight, `trickOn`) the neighbors' dolls and toys wear their costumes (`COSTUME_ACC` in
  6z_festivals.js, pieces in `EnvDolls`' hat table: a ghost hood, a bat, a soup bowl, sun rays, a deerstalker, a witch's
  hat, a pumpkin, mummy wraps, lobster claws, a cardboard robot box, a gold frame); the 2D views don't draw them.
- The small and far-off things are toys too, from `tools/blender/small_things.py`: shells and gems lying on the island
  (`item_<id>`; fruit uses the trees' `fruit_<id>`), drawn by `EnvItems` (33p_env_items.js) in place of their pictures;
  everything else Sarah can carry comes from `pocket_things.py` (`item_<its picture>`: wood, presents, money bags, the
  eggs, tools, keepsakes, quest things, what the neighbors lose, the vegetables picked), and what has no model of its
  own lies as a stand-in for its kind, as in Animal Crossing (`EnvItems.model`): a leaf for furniture, wallpaper, floors
  and accessories, a folded shirt painted in the outfit's colors and a fish in the fish's (`*_top`/`*_trim` parts,
  `EnvItems.tint`), a seed packet, a sack, a covered dish. Every dish Sarah cooks or the restaurant serves is its own
  miniature from `dishes.py` (`item_dish_<name>`, the dish's picture's name: on its plate, in its bowl, on its board or in
  its steamer, all as big as the covered one, `EnvItems.size`), so a dish on a table, at the restaurant or dropped on the
  island is that dish. The `item_` models load after the island, before the furniture; a thing to be found still twinkles;
  Sarah's sailboat at the pier, the boats crossing the sea, dolphins, planes (the propeller its own model,
  `sky_plane_prop`), hot air balloons and the gull flock, posed from SeaSky's own things by `EnvSea` (33o_env_sea.js),
  the planes and balloons small and high so they read as up in the sky (their shadows cross the ground below).
- Rooms in the new look (`EnvRoom`, 33l_env_room.js): the dolls and folks go indoors too (`EnvDolls.attach` moves them
  between the island's group and the room's), and the room is a box you look into: the back wall wears the HD view's
  wall picture (so what's hung there shows; `WH` high), the side walls one tile of its paper repeated, and above them a
  band of the same paper (`TOP`) under a picture rail and a cornice (rooms a bit taller, nothing stretched), skirting
  boards, dark cut tops, a sill with the doorway; it's lit brighter and warmer than the HD view's rooms. The floor pieces of furniture
  are models from `furniture.py` (`furn_<id>`: the kit in `furn_kit.py`, the pieces in `furn_a.py`..`furn_g.py`, one
  file per batch; `--batch furn_b` builds one), placed on their footprints by `EnvRoom.furniture` (built again when the
  room changes); a plush is its folk's model, small; the little things on tables are models too (`furn_e.py`), standing
  on their table's top (`anchor_top`). What hangs on the walls is made in `furn_f.py` against the back wall (its middle
  at the origin, its back on the wall, as big as its picture), hung where its picture was (taken off the wall's
  picture, `EnvRoom.hangs`); the shaped ones are models through and through (the clock, the window, mirrors, curtains,
  shelves, the life ring...), and what carries words or a painting (signs, posters, framed pictures, menu boards, neon)
  is a frame or board whose face, a part named `*_pic` (`*_picglow` unlit), wears the piece's own picture
  (`EnvRoom.picMat`, `picUV`), so the lettering and art stay as drawn. A neighbor's painting for the museum borrows the gilt
  frame (`furn_empty_frame`) and a photo of a neighbor the photo frame (`furn_photo_frame`), each wearing its own picture.
  Sarah's pots from the wheel are turned from their own profile (`EnvRoom.pot`: the wheel's seven radii through `profR`,
  hollow at the top, each band in its glaze, a handle or spout), half their picture's size like the tabletop things; her
  hand-built figures stay cut-outs. What has no model of its own yet is a thick cut-out of its picture
  (`EnvRoom.cutout`: the picture on the front, the same shape twice behind it a shade darker). What the 2D view draws
  moving is a model whose moving part is its own (`furn_g.py`, `EnvRoom.animate`): an arcade cabinet's screen (a part
  named `*_screen`) shows its game's name and attract animation drawn on a picture of its own (`EnvRoom.screen`), the claw
  rides along the claw machine's top and the plates along the sushi conveyor (`*_move`). Rugs are soft slabs wearing
  their picture (`EnvRoom.rug`; the light-up floor's squares light in turn). Clementine's mannequins are dolls from the
  kit with no face or hair, the color of a dress form, wearing the outfit for sale (`EnvRoom.mannequin`), and the
  accessories for sale lie on her table as the pieces a doll wears (`EnvRoom.accessories`). Fittings with no furniture of
  their own say how the new look draws them in `look3d` (`EnvRoom.deco`): the shop's easel (a 3D easel and canvas, the
  painting on it still its picture) and board, the restaurant's stools (Mac's chairs in the 2D views) and the dishes on its tables (what each seat is
  eating, `seatDish`), the arcade's back door and crates; food on a table is its dish, a flower stands in a vase. The
  furniture loads after the island's models, so the island never waits for it. Glass is a part named `*_clear`
  (see-through).
- The club is a 3D room in the new look too (`EnvRoom.club`: the DJ booth, speakers and disco ball as their models, the dance
  floor's tiles lit in turn, light beams and the ball's sparkles, lit for dancing at any hour), and the dance game and
  karaoke stay in 3D there (`R3.active`): Sarah's doll dances the game's poses, while the arrows, judgements, lyrics and
  pitch bar are drawn flat over the scene (`Dance.draw`, `Karaoke.draw` on the overlay). The HD-2D view keeps the club and
  both games flat.
- The style test (David, 26 October: characters and props redone as cozy handcrafted miniatures after Animal Crossing:
  New Horizons; the rules it settled on are in docs/STYLE.md). In the test area and on Sarah's island on beta (`STYLE2`:
  `?lab` or `ENV_ISLAND`, or `localStorage sc-style2` 1 or 0 anywhere; its models, `doll_*`, `folk2_*`, `style_*`, load
  only there), the live site keeps the first dolls until David approves it: people are chibi dolls from a Blender kit (`tools/blender/dolls.py`: `doll_kit` with each part in greys
  named `<part>__<role>` and its origin at its joint, elbows and knees jointed on balls; `doll_hair`, the hair sculpted as
  locks melted into one mass with grooves between them, its blue channel how far toward the dyed tips), put together and
  painted by `EnvDolls.make2` (33ka_doll_kit.js); a look with `masc` (Joe, David, James, John) gets the men's cut from
  the same kit (`torso_m`, `arm_m`... an open jacket over a shirt), Joe's curls (`hair_joecut`), a boy's face in
  `personFace` and stands 4% taller (David's notes on the test, 26 October: Joe looked too like Sarah); Maki, Kai and
  Ginger redone in `tools/blender/folks2.py` (`folk2_<id>`, each with its own arms, an accessory only where it suits, each
  body molded from pieces melted into one soft surface by `sculpt`, sized one by one by `SIZE` so the face reads), and then
  the rest of the cast the same way (David, 26 October: every food folk, the goat, the Cozy Council and the old keeper;
  Chili and Floss stand on their tips, their feet at its base; David, James, John and Elizabeth's hair and David's beard
  sculpted in dolls.py, and every other style the salon has: `HAIRS`, `MELT`); the clothes' details are kit parts too
  (dolls.py's `skirts`, `strap_top`, `bib`, `hoodie`, `fastenings`, `cape`: pleats, gathers and a tutu's ruffles, bare
  shoulders with straps, the overalls' bib, a hood with its pocket and cords, buttons, a belt, an obi or a sash, a
  cardigan's front, a pointed collar), put on by `make2` from the clothes style's flags (`HD_STYLE`) and shaded only
  against what's worn with them (`kit_ao`'s `occ`); every face is painted on a patch (`face__face`, a folk's `face` part) from a
  sheet of sixteen expressions per look or folk (`FACES`, `faceSheet`/`folkSheet`, `personFace`, `FOLK_FACES`), changed
  by moving the patch's UVs (`setFace`); how they act is 33kb_doll_act.js (`act`: faces from talking, a line's mood,
  emotes and games, tag's glances back, stumbles and celebrations; `pose2`, `poseFolk2`, `FOLK_ACT`); five props in
  `tools/blender/props2.py` (`style_bench`, `style_lamp`, `style_armchair`, `style_cake`, `style_shovel`, the shovel in
  Sarah's hand too) stand in the test area's corner by the square (`EnvStyle`), with Kai and Ginger beside Maki and Joe
  (`LAB_CAST`). `UI._sp` is who's speaking. While Sarah talks with someone in the new look the camera eases in on the
  two of them, a little lower (`R3_TALK`, `R3.talkWith`); a folk working behind a counter stands on a step stool there
  (`EnvStools`, 33kc_doll_stools.js, `style_stool`); the folks sit with their feet out and hands in their lap, dance
  with their arms going, and strike the dance game's poses (`poseFolk2`). They're light enough for the whole island:
  folks2.py molds each surface from 60% of the points its parts ask for (`BUDGET`; it looks the same in close-up), and
  `--lod1` makes the phones' versions (`folk2_<id>_lod1` from 35% with no part over `LOD1_CAP` points; dolls.py `--lod1`:
  `doll_kit_lod1` with every part from half its points, `doll_hair_lod1`).
- David's rule (27 October): everything in the world is a 3D model in the dollhouse look (things on the ground, in the sky
  and at sea, what's hung on walls and set on tables), except the minigames (cooking, the arcade cabinets, jump rope,
  volleyball and the like), which keep their 2D look.
- The important things are models made in Blender, not in code: `tools/blender/*.py` (`common.py` has the helpers: the
  game's camera and sun for previews, baking, GLB export). Blender runs as a Python module: `pip install bpy` (Blender
  5.x, about 1 GB, fine in a venv), then `python tools/blender/cottage.py --preview DIR` (or `shop.py`,
  `stone_wall.py`, `props.py` for the bench, lamp, mailbox, fences, planter and pumpkins, `trees_ac.py` for the trees,
  fruit, palms and bushes, `vegetation.py` for the pines, sunflowers and wild flower clumps (with lighter `_lod1` clumps for phones), `props_island.py` for
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
  steps): the game loads every model at once, so keep `game/assets/models/` light (about 85 MB on disk now, 12 of it furniture, 30 the style test's dolls and folks with their phone versions; packed and gzipped by the build, a computer fetches about 26 MB of it and a phone 21). `doll.py` was the
  mock-up of the people as dolls. `ground_textures.py` bakes the ground's surfaces the same
  way (the plaza's flagstones with grass between them, the dirt path, the lawn: color, normal and height, each 4 tiles
  square and wrapping) into `game/assets/textures/`, shipped as `window.TEXTURES`; the ground's shader uses the height
  to let grass reach into the gaps and ragged edges.
- Models: one unit is one tile, Blender's -y is the game's south (the front), z up; trees and props stand on their foot,
  the cottage on its middle with the door at x 0 on the front (the shop's door is at x 0.5), a wall piece runs from x 0
  to its length with its face toward -y, from the lower ground (z 0) to the upper (z 1.5, `ENV.LV`).
- In the game `EnvModels` (33g_env_models.js) loads them (the build packs each smaller, `scripts/glb-pack.mjs`: positions,
  colors and picture spots in 16 bits, normals in 8, KHR_mesh_quantization, a part's positions scaled on its own node so
  its origin stays put, and `EnvModels.unpack` makes them plain numbers again as they load; it ships each with a hashed name in `window.MODELS`,
  with a gzipped copy beside it that server.mjs sends to browsers that take gzip, since the proxy in front only compresses text;
  the server's CSP allows `blob:` in connect-src for the pictures inside them), gives their materials the view's bend,
  depth of field and shadows (`r3Patch`), uses their colors as they are, and draws a model placed many times as one
  instanced mesh per part. Colors kept in a mesh arrive as glTF's linear values and are turned back into the colors as
  painted (`EnvModels.srgb`). The trees (autumn crowns in autumn), palms, pines and bushes replace the code-built ones
  and follow the game: a shaken tree sways, picked fruit and chopped trees go (`EnvTrees.tick`); the square's big tree is
  the grand tree, the island's landmark (`tree_grand`, trees_ac.py: twice as tall as the others, six lobes on a long bare
  trunk with limbs), standing in a raised bed of stones (`bigtree_planter`, props_island.py; its 2x2 and the ring round it
  but the corners are blocked, in the game and in layout.mjs); the cottage Sarah's
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
  water along a blurred outline, not the tiles' steps; never over ground people walk on, though: every point of a walkable tile stays above the
  water (`keepDry`; Sarah's feet are a box as wide as her doll, `blockedFoot`), and a stream running out over the beach
  comes down to the sea's level over its last tiles (`surfAt`) to meet it; the depth map behind the water's shader also says where it flows
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

## Two-player games (6zv_versus.js)

- Every arcade game but Fortune Falls and the claw has a two-player mode (`versusDef(id)` makes `vs_<id>`: two boards
  side by side in one cabinet): "Play a neighbor" at a cabinet picks one of the neighbors in the arcade, whose board an
  opponent brain plays at their own skill (`VS_SKILL`). `Versus.ADAPT[id]` says how a game is played two-handed:
  Bento Blocks, Spice Capsules, Dumpling Drop and Sushi Swap send junk across (`hook` reports what a board sends,
  `junk` puts it on the other, `ready` says when it can land, `done` a board that wins outright); Surf's Up, Gopher
  Garden, Fruit Catch, Snack Stack and Noodle Slurp are races (`race`, on `VS_RACE` or the game's own clock). The other
  board plays silently (`Versus.quiet`). Playing a neighbor earns a little friendship once a day.
- A friend online on the same island can be asked too ("Play <name>" at a cabinet: `VsNet.invite`): each side plays
  its own board and sends a picture of it a few times a second (`vsSnap`, laid over the other side's copy of the game
  with `Object.assign`), junk and leaving go across as messages (the live connection's `game` messages, passed only to
  the one person they're for: server/live.mjs), and a friend who leaves mid-game hands you the win.

- Tag with a friend online (6zy_friend_games.js, `FriendTag`): "Play tag" in a friend's menu (`Online.meet`) when both are
  outside; two minutes; only the one who's it checks for a tag and says so (`tagIt`, numbered), and one side calls time
  with its count so both see the same result. Its messages ride the same `game` messages (`VsNet.got` hands `tag*` on).

## Games with the neighbors (6zw_island_games.js, 6zx_field_games.js)

- "Let's play!" in the talk menu (`IslandGames.list(n)`: what fits the place, the hour and the weather) starts a game
  with that neighbor at their skill (`VS_SKILL`). Tag, hide-and-seek (Sarah hides or seeks) and the fishing derby are
  played on the island: the neighbor's day waits (`n.script`), `IslandGames.tick` moves them (chasing and fleeing by
  `steer`: the best of sixteen ways judged a little ahead; seeking along `findPath`), the dance HUD shows the clock
  and the Leave button stops it. Hiding places are just north of trees, buildings and big props (out of the camera's
  sight); the seeker sees Sarah when close, or further off with nothing solid between (`clear`).
- Volleyball (by the court) and the snowball fight (in winter) are 2D games in the arcade's cabinet (`field` games:
  no fee, tickets or high scores; `opts.onOver` hears every game). At the club, a dance-off puts the neighbor on the
  floor beside Sarah (`Dance.start(id, { rival })`, their steps judged by skill) and a karaoke duet gives them every
  other line (`Karaoke.start(poem, { duet })`, a second voice). Records are in `S.games`; a game together counts for
  friendship once a day (`igFriend`). `__dbg.islandGame(kind, id, mode)` starts one.

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
  header `X-Sarah: 1`), the built game from `STATIC_DIR` (hashed asset names, cached forever; a model's `.gz` copy to a
  browser that takes gzip).
- `world.mjs`: the real world for the Town Hall's zip code and the Bank's market (see above).
  Problems in the browser are posted to `/api/log` and end up in the server log.

## Checks

`npm test` (fast) and `npm run test:e2e` (Chromium via Playwright, ~2 min). Run both before pushing;
CI and the deploy run them too. Pushes to `claude/serene-mendel-8428vr` deploy to the beta site
(https://beta.sarahcrossing.com, its own islands); the live site (Sarah's island) only changes when
the Deploy workflow is run by hand with target `live` (or on a push to `main`). Never deploy live
unless asked.
