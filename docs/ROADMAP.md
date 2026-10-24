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
  in the evening, planes and balloons overhead, shopkeepers over their counters, things on rooms' walls
- [ ] HD-2D step 3: the bigger island with districts and the farm, in the new look
- [x] HD-2D step 4: furniture, floors and walls, and the inside of buildings redrawn
- [~] HD-2D step 5: a HUD that matches (done: the sample's dark glass and serif type in HD-2D), and a
  layout made for an upright phone (done: the camera frames Sarah low with the world above her)
- [ ] Must look good on phone, laptop and desktop (layout, text size, touch and mouse/keyboard)

## The island
- [ ] A much larger island, laid out in districts: shopping/commercial, residential, forest,
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

## Bugs
- [x] Talking to Wonton in the hot spring: the spot you have to stand in is too hard to hit (fixed: any side of the rim works, and a tap walks below it)
- [ ] A light test pass at the very end (David played it for a week and reported bugs as he went)
