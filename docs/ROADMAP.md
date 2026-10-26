# Roadmap: Sarah Crossing, the real game

The one-page game was a gag gift that Sarah loved. This is everything David asked for to turn
it into a polished, much bigger game. **Nothing goes to the live site (Sarah's island) until it's
all done**; it's built and tried on https://beta.sarahcrossing.com.

Sarah's island must keep loading through every change (see CLAUDE.md, "Old saves must always
load"). Where a change can't keep something (a new map can't keep things placed on the old
ground), the save migration says what starts fresh, as the one-page game did when the island
first grew: her house, money, friends, collections and everything she made always stay.

Status: [x] done, [~] in progress, [ ] not started.

## Online
- [x] On a server with its own address, password, saves online, backups, save import
- [x] Beta site for trying things (pushes go there; live only when asked)
- [x] **Multiplayer**: play as Sarah, David, James, John or Joe (picked per device on the title screen)
  - each visitor has their own save on the island: pocket, money, friendships, mail, collections;
    the island itself is Sarah's (only her game changes it; visitors are told so, kindly)
  - visitors arrive at the boat; Joe starts at his house; their NPC selves step aside while they play
  - see each other live with name tags, chat bubbles, dance moves; give gifts; write letters
  - neighbors greet and chat with each person in their own way, and tell visitors how Sarah's doing
  - placeholders: everyone uses their current sprite until the new art
  - [ ] later: doing things together (fishing, minigames), more lines for everyone

## Art (pick a style first)
- [x] Six sample styles to compare: Stardew-like, handheld classic, tamagotchi-colorful, 3D
  diorama, classic cozy, experimental storybook paper (David liked Stardew-like and classic cozy;
  the 3D and the portraits were too cutesy, and the game needs Animal Crossing's camera to work on
  phones: placing decor, finding dig spots, seeing decor behind buildings)
- [~] Three more samples with Animal Crossing's perspective in 2D: rolling-log pixel art, clean flat
  illustration, cozy pixel art with the Animal Crossing camera (no portraits, less cutesy)
- [x] Round 2 (Animal Crossing camera) and round 3 (Pocket Camp proportions, no visible tiles):
  David picked **HD-2D** (pixel-art people in a softly lit 3D world)
- [x] HD-2D step 1: the new engine with today's art (31_render3d.js, three.js): the island and rooms
  in 3D with sun, shadows, depth of field and a horizon; edit modes and the minigames keep the flat
  view with the grid; a Graphics switch in Settings; the classic view without WebGL; chunked ground,
  drawing distance and fog, phone rules, hold to walk
- [x] HD-2D step 2: everything drawn with three times the detail (32_hd.js and the 32*_hd_*.js files):
  people built from a skeleton (any outfit, sewn design, salon look and accessory, every pose and side,
  eight directions, walk, run, idle fidgets), the food neighbors, hair styles, accessories, trees, houses
  (from their looks, so Ginger's repaints work), the shops and landmarks, outdoor decorations, wildlife,
  boats, items, tools, emotes; drawn off the main thread by a worker so walking stays smooth
- [x] The world in 3D like the sample: buildings as real shapes, the plateau and mountain raised with
  cliffs, moving water with reflections (computers), swaying grass, greener colors, soft path edges,
  blue sky and clouds over the island's rolling edge, lily pads and cattails on the ponds, windows lit
  in the evening, planes and balloons overhead, shopkeepers over their counters, things on rooms' walls;
  the weather and night sky too: sharp rain, round snowflakes and a pale snowy sky, turning petals and
  leaves, glowing fireflies, fireworks in the sky, the lighthouse beam, shooting stars you can tap
- [~] HD-2D step 3: the bigger island with districts and the farm, in the new look (done: Harbor Square, the layout
  David picked from four concepts, made by scripts/make-island.mjs from scripts/island/plan.mjs: a big town square
  above the dock with the Town Hall, Post Office and Bank, Market Lane, a neighborhood with room between the houses,
  the farm up the hill with a hidden cove below it, a forest of looping trails, the campsite, the Ridge Trail and a
  mountain trail to the lookout; old saves keep their progress and get their things back. Still to come: the Town
  Hall, Post Office and Bank's art and insides, things to see at different times, the new vendors, the sailor and the
  balloon's passenger)
- [x] HD-2D step 4: furniture, floors and walls, and the inside of buildings redrawn
- [~] HD-2D step 5: a HUD that matches (done: the sample's dark glass and serif type in HD-2D), and a
  layout made for an upright phone (done: the camera frames Sarah low with the world above her, and the
  date line wraps clear of the buttons)
- [ ] Must look good on phone, laptop and desktop (layout, text size, touch and mouse/keyboard)

## The island
- [x] A much larger island, laid out in districts: shopping/commercial, residential, forest,
  mountain, beach, a dedicated farm area (crops grow there, not in scattered squares), and more
- [ ] Everything on a grid (placing things, walking, collisions)
- [ ] Less clutter: fewer, better placed things by default
- [x] Shop upgrades after a number of days played and money spent: Fortune's Goods (then "& More",
  then Fortune's Emporium) and Clementine's (then Atelier, then Maison Clementine) each grow twice;
  a letter, a day closed for the work, a grand reopening with a free gift; bigger rooms, more stock,
  a daily sale, longer hours, a set of the week, better selling prices

## Neighbors and story
- [ ] New people: meet new vendors by meeting requirements; after some days and play time, new
  characters visit and ask to move in, and Sarah picks where their house goes
- [ ] A secret character
- [~] Every line in one spreadsheet for David to edit (docs/dialogue/dialogue.xlsx, 26 October: 6,694 lines with who
  says them and when, plus 399 new lines for the zip code, Post Office, Bank and Town Hall in every outcome); his edits go
  back in with scripts/dialogue/apply.mjs
- [~] Way more dialogue, better dialogue, conversations that react to what's going on: about 1,340
  new lines (27+ everyday lines per neighbor, plus topics that react to the hour, weather, season,
  where they stand, friendship, Sarah's outfit, what she did today, her records, holidays, solved
  mysteries and who's nearby), and two personal moments per neighbor for close friends. More to come
  with the new residents
- [~] Way more holiday events: holidays with things to do (on top of the 45 with decorations and chatter):
  Egg Hunt (Easter weekend: eggs in the grass, in trees, buried, on the hook; Cece trades them),
  Fish-Off (Kai, four times a year), Beach Cleanup (Earth Day, Ocean Day), Trick-or-Treat (Halloween
  night, candy from Fortune), Toy Day deliveries (December 24), Feast Cook-Off (Mac judges a dish)
- [ ] Way, way more content

## Games
- [x] A few more arcade games: Surf's Up (Kai's wave: jump rocks, grab shells), Gopher Garden (bonk
  the gophers, never Cuke) and Noodle Slurp (Basil's noodle grows as it slurps); the arcade is wider
  to fit their cabinets, which can be won at the prize counter like the others
- [x] The arcade's back room: a hidden mystery for later in the game (Chili, Sully, the lighthouse,
  a key) opens the island's first arcade with three classic cabinets: Dumpling Drop (a Puyo Puyo
  clone), Sushi Swap (Tetris Attack) and Fortune Falls (Peggle)
- [ ] **Later (in about two weeks; very important to David):** once the back room is open and every
  arcade game has been played, a fourth cabinet in the back room turns out to be broken, with a quest
  to fix it. Inside: a recreation of a lost Pogo game from around 2005 that was only up around
  Valentine's Day. It used screenshots of The Sims 1: you made choices on a date and got a letter
  grade at the end for how well it went. Sarah loved it but never won, and it was taken down and
  lost. Get every detail David remembers (screens, choices, grading) before building it.
- [x] Remake the fruit catching game so it's actually fun: trees shake before they drop, a shadow shows
  where things land, fruits fall their own ways, juice meter and Fruit Fever, power-ups, rounds with
  Perfect bonuses, snappier movement

## The new 3D look (on beta; David approved it for the whole island, the live site waits for his word)
- [x] Models made in Blender (trees, buildings, houses, props, furniture, the food folks, wildlife), dolls for people,
  rooms as dollhouse boxes, real water, stone walls, lamplight, rain, steam and smoke
- [x] David's second list (26 October): no sand on cliff tops, a soft shoreline, rivers that keep their banks under
  bridges and run on over waterfalls into pools, bending banks, stairs with side walls, the GameCube-style lawn instead
  of 3D grass (no flowers in it but the pickable ones), tilled fields, fences without sunflowers everywhere, smaller
  falling leaves, a smooth see-through (no dots) for things in front of Sarah
- [ ] Trees like Animal Crossing's (round full canopies, natural trunks), fruit you can see, better palms, more
  variety in size and shape, forests with clusters and clearings; smoother path edges by buildings and stairs
- [ ] Ground and grass colors that change with the seasons, like the trees (next week)
- [x] Decorating on the island: the move/decorate mode switches to the classic view with a tile grid to place things
- [~] The island on a grid (David's pick, 26 October): everything stands in its tile, fences join, half tiles where
  water, the sea or a path makes a stair-step (part walkable, still one tile), the ground's edges drawn from the tiles,
  a tile grid to show in Settings. Still to come: whatever the layout needs redrawn to sit better on the grid
- [ ] Rooms: what's hung on walls and the small things on tables as models (the arcade games, jump rope, volleyball
  and the other minigames keep their 2D look, and so can the arcade cabinets)

## Late in development (David's notes for much later)
Some of these need things that don't exist yet (a town flag, records kept over time); add them when we get here.

### The real world, by zip code
- [ ] Sarah sets a zip code: the island's time zone, that day's weather forecast (not live: the day's prediction),
  local news, fetched once a day from free APIs
- [ ] The post office mails a newspaper every day: real headlines and tidbits, the weather, and an island section
  with stories about what Sarah and the neighbors actually did

### Bank
- [ ] Savings account: deposit and withdraw, daily interest (weekly rates)
- [ ] Stock portfolio from real stocks (a few global ones from a free API): invest, see performance graphs and
  historical returns, dividends from eligible stocks
- [ ] Pay off house upgrade loans
- [ ] Savings goals with progress trackers for expensive purchases
- [ ] Financial statements: lifetime earnings, spending, investments, income sources
- [ ] Safety deposit box for valuable or sentimental items

### Post Office
- [ ] Send physical letters to neighbors (besides texting), with presents attached
- [ ] Newspaper archive: keep and reread past papers
- [ ] Postcard collection from fictional places
- [ ] Package tracking for things ordered from the computer
- [ ] Lost mail quests: deliver misplaced packages and letters
- [ ] Special deliveries: now and then a mysterious package with something rare
- [ ] Customize the look and color of the mailbox

### Town Hall
- [ ] Town flag designer: draw a pixel-art flag shown round the island
- [ ] Town ordinances: Early Bird (shops and neighbors start earlier), Night Owl (shops open later), Community Spirit
  (neighbors socialize more), Nature Conservation (more wildlife and growth, trees grow faster, neighbors plant
  flowers where there aren't enough)
- [ ] Town census: every resident, birthday, personality, friendship and more
- [ ] Town history (a timeline of milestones), island statistics (days played, fish caught, items, money...), island
  records (biggest fish, best day, longest friendship), town achievements with commemorative rewards
- [ ] Rename landmarks (beaches, mountains, forests...)
- [ ] Residents: customize catchphrases, reset or change clothes and accessories, adjust schedules (when they wake,
  go home, where they go)
- [ ] Missed holidays: if Sarah didn't play on a major holiday (the Egg Hunt, say), the Town Hall lets her hold it the
  next day she plays, for up to a week after (so it never lands on another holiday: no Easter at Christmas)
- [ ] Town anniversary: a monthly island day
- [ ] Save management: make backups or restore an earlier save (the server keeps backups already)

## Bugs
- [x] Talking to Wonton in the hot spring: the spot you have to stand in is too hard to hit (fixed: any side of the rim works, and a tap walks below it)
- [ ] A light test pass at the very end (David played it for a week and reported bugs as he went)
