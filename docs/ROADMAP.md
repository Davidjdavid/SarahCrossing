# Roadmap: Sarah Crossing, the real game

The one-page game was a gag gift that Sarah loved. This is everything David asked for to turn
it into a polished, much bigger game. **Nothing goes to the live site (Sarah's island) until it's
all done**; it's built and tried on https://beta.sarahcrossing.com.

Sarah's island must keep loading through every change (see CLAUDE.md, "Old saves must always
load"). For the remade game David decided (27 October) that a save brings over only Sarah's
stats and money (and her name, the island's name and her birthday); the rest starts fresh, and
the whole old save is kept inside the new one in case it's ever wanted back.

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
  - [x] playing together: every arcade cabinet but Fortune Falls and the claw has a two-player mode, against a
    neighbor (at their own skill) or a friend online on the same island
  - [~] later: more games with friends online (the island games below), more lines for everyone (tag with a friend online:
    walk up to them and pick Play tag; two minutes, whoever's it for less time wins)

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
  Hall, Post Office and Bank's art and insides, the new vendors and the sailor; the balloon's passenger isn't coming,
  David's call)
- [x] HD-2D step 4: furniture, floors and walls, and the inside of buildings redrawn
- [~] HD-2D step 5: a HUD that matches (done: the sample's dark glass and serif type in HD-2D), and a
  layout made for an upright phone (done: the camera frames Sarah low with the world above her, and the
  date line wraps clear of the buttons)
- [ ] Must look good on phone, laptop and desktop (layout, text size, touch and mouse/keyboard)

## The island
- [x] A much larger island, laid out in districts: shopping/commercial, residential, forest,
  mountain, beach, a dedicated farm area (crops grow there, not in scattered squares), and more
- [ ] Everything on a grid (placing things, walking, collisions)
- [~] Less clutter: fewer, better placed things by default (27 October: trees in groves with clearings, open lawns,
  wild flowers in small patches; the new island is a fresh start for saves, keeping only stats and money, David's call)
- [x] Shop upgrades after a number of days played and money spent: Fortune's Goods (then "& More",
  then Fortune's Emporium) and Clementine's (then Atelier, then Maison Clementine) each grow twice;
  a letter, a day closed for the work, a grand reopening with a free gift; bigger rooms, more stock,
  a daily sale, longer hours, a set of the week, better selling prices

## Neighbors and story
- [ ] New people: meet new vendors by meeting requirements; after some days and play time, new
  characters visit and ask to move in, and Sarah picks where their house goes
- [ ] A secret character
- [~] Every line in one spreadsheet for David to edit (docs/dialogue/dialogue.xlsx, 26 October: 6,694 lines with who
  says them and when, plus 399 new lines for the zip code, Post Office, Bank and Town Hall in every outcome; exported again
  27 October with everything added since: 8,332 lines); his edits go back in with scripts/dialogue/apply.mjs
- [~] Way more dialogue, better dialogue, conversations that react to what's going on: about 1,340
  new lines (27+ everyday lines per neighbor, plus topics that react to the hour, weather, season,
  where they stand, friendship, Sarah's outfit, what she did today, her records, holidays, solved
  mysteries and who's nearby), and two personal moments per neighbor for close friends. More to come
  with the new residents
- [~] Way more holiday events: holidays with things to do (on top of the 45 with decorations and chatter):
  Egg Hunt (Easter weekend: eggs in the grass, in trees, buried, on the hook; Cece trades them),
  Fish-Off (Kai, four times a year), Beach Cleanup (Earth Day, Ocean Day), Trick-or-Treat (Halloween
  night, candy from Fortune), Toy Day deliveries (December 24), Feast Cook-Off (Mac judges a dish), New Year's Eve
  (everyone on the square, a countdown to midnight, cheers and fireworks), the Fourth of July (everyone on the beach for
  the fireworks), Stargazing Night (everyone up at the lookout), Pirate Day (a treasure map in a bottle, steps from a
  landmark to an X, a treasure chest to dig up), Lunar New Year (a red envelope from every
  neighbor), Valentine's Day (cards for the neighbors, truffles back from good friends)
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
- [x] Games with the neighbors ("Let's play!" when talking to them, by place, hour and weather): tag and
  hide-and-seek (either way round) out on the island, a fishing derby by the water, beach volleyball at the court
  and snowball fights in winter (2D, in the cabinet), a dance-off and karaoke duets at the club. No bug-catching
  contest (bug catching isn't part of the game). A game together counts for friendship once a day

## The new 3D look (on beta; David approved it for the whole island, the live site waits for his word)
- [x] Models made in Blender (trees, buildings, houses, props, furniture, the food folks, wildlife), dolls for people,
  rooms as dollhouse boxes, real water, stone walls, lamplight, rain, steam and smoke
- [x] David's second list (26 October): no sand on cliff tops, a soft shoreline, rivers that keep their banks under
  bridges and run on over waterfalls into pools, bending banks, stairs with side walls, the GameCube-style lawn instead
  of 3D grass (no flowers in it but the pickable ones), tilled fields, fences without sunflowers everywhere, smaller
  falling leaves, a smooth see-through (no dots) for things in front of Sarah
- [x] Trees like Animal Crossing's (round full canopies, natural trunks), fruit you can see, better palms, more
  variety in size and shape, forests with clusters and clearings; smoother path edges by buildings and stairs
- [x] Ground and grass colors that change with the seasons, like the trees
- [x] Decorating on the island: the move/decorate mode switches to the classic view with a tile grid to place things
- [~] The island on a grid (David's pick, 26 October): everything stands in its tile, fences join, half tiles where
  water, the sea or a path makes a stair-step (part walkable, still one tile), the ground's edges drawn from the tiles,
  a tile grid to show in Settings. Still to come: whatever the layout needs redrawn to sit better on the grid
- [x] Everything a 3D model in the dollhouse look but the minigames (David, 27 October): palms redone, walls without corner
  posts, stairs that match their paths, shells, gems and things dropped on the ground, the sailboat, the planes,
  balloons, boats and dolphins
- [x] Things to see at certain times, never announced (26 October): a glowing toadstool ring in the woods at night, a
  rainbow at the falls the morning after rain, the northern lights on some clear winter nights, sea turtle hatchlings on
  some summer dawns (and the owl at night, the deer)
- [x] Rooms: what's hung on walls and the small things on tables as models (the arcade games, jump rope, volleyball
  and the other minigames keep their 2D look, and so can the arcade cabinets)
- [~] Characters and props as cozy handcrafted toys after New Horizons (David, 26 October): the style test is in the test
  area (Sarah from a doll kit with sculpted hair and sixteen painted expressions, Maki, Kai and Ginger redone, five
  props, acting: Sarah's arms-out run, tag's glances back, stumbles and celebrations, faces while talking). David liked
  the direction with revisions; round 2 (26 October): Joe in a men's cut with his own curls, Kai's round bowl with his
  face up where the camera sees it, the folks molded as soft single pieces, sized one by one. Round 3 (David: "looks
  good, make the rest"): every food folk, the goat, the council and the old keeper; David, James, John and Elizabeth's
  hair and David's beard; the talk camera; stools behind counters; sitting, dancing and the dance game's poses for the
  folks. Round 4 (David: "do the lighter versions and hairstyles, then put them on beta"): the models packed smaller by
  the build for everything and sent gzipped (a computer fetches 23 MB of models instead of 73, a phone 20 instead of 70), the characters from fewer points and phone
  versions of them; every salon style sculpted; the clothes' details (pleated and gathered skirts, a tutu, bare
  shoulders with straps, the overalls' bib, a hoodie's hood and pocket, buttons, belts, an obi, a cardigan's front, a
  collar, a cape); Fortune's fold and David's beard fuller; and the new characters on Sarah's island on beta. Still to
  come: the props and furniture in the new style, acting for the other games (docs/STYLE.md)
- [x] Graphics settings (David, 26 October, for later): a quality setting and a draw distance, each with its own default
  for laptops and phones, so the look can go up if the server or the devices get faster (Settings: Picture quality and
  Draw distance, each Auto, which is the device's own, or picked; kept per device)

## Friendship, deeper (David, 27 October: for a later addition)
- [x] Nicknames: once a neighbor is a good enough friend they ask if they can call Sarah something (their own idea, or
  she suggests one), and use it from then on; she can ask them to change it (at four hearts; "Call me something
  else?" in the talk menu)
- [x] Catchphrases: every neighbor has one, said at the end of lines; after raising friendship Sarah can give them a new
  one (and they react to it in their own way) (at four hearts, from the talk menu; or at the Town Hall's Residents)
- [x] A more in-depth friendship system: more than hearts going up. Friendship that grows from many kinds of time spent
  together (talking, gifts they actually like, favors, games together, visits, outings), and fades a little if she's
  away a long time; milestones that unlock things (a photo, a nickname, sharing something personal, a gift for her
  house, asking her advice, coming to her for help, inviting her places, a best-friend moment); neighbors who remember
  what she did and bring it up; friendships between the neighbors themselves that shift with the island drama
  (done: they remember the last few things she did with them, a gift they liked, a game, a favor, a visit,
  finding what they lost, and bring one up some days within the week; after three weeks away a friendship fades a
  point every other day, at most ten, never below the hearts they have, and they say they missed her; at two hearts
  their favorite spot (where they then invite her to hang out), at three they ask her advice, at four a gift for her
  house in the mail, at five a best-friend moment, one a day; already there: the photo, the nickname, something
  personal at four and five hearts, favors, and invitations by text to lunch, to hang out, to come by for news or a
  present; and the neighbors' own friendships: a bond between each two that the storylines move, chats raise a little
  and time mends, so close friends chat more, two who've fallen out don't for a few days, and they say so)
- [ ] Friendship that shows (David's last list, 27 October): how close a neighbor is changes how they greet Sarah, what
  they do with her and how they act around her; now and then they wave, come over, sit down beside her or say hello
  without her starting it; conversations fit the moment better (friendship, place, weather, what's happened lately,
  what they're doing right then); and they remember more kinds of things (gifts, earlier conversations, things done
  together) and bring them up in more ways
- [ ] And so on: David will add more ideas here

## A lived-in island (David, 27 October: for later)
- [x] Each neighbor plans their day every morning and lives it at set times, whether or not anyone is playing: say work,
  lunch at home on their own, the Bank after work, picking some fruit, fishing, selling the catch, visiting a friend, bed.
  Sarah could follow one all day and watch them do it. Worked out from the day and the hour, so wherever she looks in,
  everyone is where their day has taken them. It only has to look real (no crops or stock actually tracked): the farmers
  tend the fields, pack the produce and deliver it to the store each morning, and neighbors go and buy it (already: a
  plan each morning worked out from the day and hour, work, shopping, benches, the club; now also lunch at home or at
  Mac's, fishing where there's water, evenings visiting a friend at their house, an errand at the Bank or the Post
  Office after work (on beta, where those open into rooms), Cuke watering the farm's fields after the dawn jog and
  carrying a basket of vegetables to Fortune's each morning, and some afternoons Kai fishing off the end of the pier and
  taking his bucket to the shop to sell; and after the delivery some neighbors stop at Fortune's and walk home with a
  tote of groceries)
- [x] Vacations, now and then (rare, and marked on the calendar): a neighbor packs their bags, walks to the pier with
  friends seeing them off, and a boat comes for them; friends get a postcard, good friends a souvenir in the mail, and they
  come home after a few days (each neighbor about three times a year, one at a time, to a place of their own: Sully to
  Boston, Brulee to Paris, Kai to Surf Point...; a note on their door while they're away)
- [x] Much more said overhead: lines of each neighbor's own and plenty shared between them, so hearing the same thing twice
  is rare (about a hundred conversations anyone can have, four to six of each neighbor's own, more for rain, snow,
  mornings, evenings, nights and each season; the last forty heard wait their turn)
- [x] IslandMart's stock changes every week: so many of each kind (chairs, wall pieces, plants...), picked at random so a
  week is never all chairs, so Sarah can't buy everything at the start. Many more pieces too: every piece of furniture in
  four colors (the model's parts painted differently), named like "Large couch (pink)" (new every Monday, a third of the
  catalog in a mix of kinds, everything she's had still in Order again; every piece IslandMart sells in its own colors and
  three more, its main color repainted in the picture and the model, "Sofa (mint)"; a wooden piece in light wood, dark wood
  and white; a plant keeps its leaves and changes its pot; each week the shop has each piece in one of its four)
- [~] The achievements that unlock outfits, songs, recipes and the like much harder and spread out over a long time
  (27 October: every score and count raised a lot; see the late notes)
- [x] Hybrid flower colors (David, 27 October): rarer colors that only come from cross-breeding (a blue daisy, a purple
  tulip...), each with its own picture and its own color in 3D (done: blue and purple daisies, orange and black tulips,
  red and chocolate cosmos, red and black lilies)
- [x] The flowers as Animal Crossing's (David, 27 October: "flowers are kinda an important part"): rebuilt in Blender
  (flowers.py), thick soft petals, a tulip's cup, a lily's speckled star, a cosmos's notched petals
- [x] Roses, as a fifth kind of flower from seeds (red, white and yellow; pink and blue hybrids)
- [x] Neighbors turn round to face Sarah when she talks to them
- [x] Lots of things they do when they're not busy, each its own animation: looking at the stars, eating a snack, sitting
  on the ground, on their phone, reading a book, painting, and more, so they feel alive (in the new look: the stars at
  night, an ice cream, sitting on the grass, the phone, a book, painting at an easel, a mug of cocoa, each with the thing
  in hand; each neighbor has a favorite)
- [x] Neighbors stopping close together to chat, one talking and the other listening, now and then nodding while
  looking at whoever's talking
- [x] Songs and poems that rotate, so there's something new to check each day; many more songs; and a way to upload a
  song and have a dance made for it (a karaoke request each night at the club, on the board, the crowd tipping extra
  for it; sixteen more of Joe's poems, which are the karaoke songs too; "Your songs" at the club: any music file from
  her phone or computer, its beat found and a dance written for it at the level she picks, up to twelve, the file kept
  on the device and the dance with the island)
- [x] Sarah dances on her own between the steps in the dance game (an idle dance when no button is pressed), so it looks
  like dancing

## Rooms and props in 3D, another look (David, 27 October: for later)
- [x] Rooms a bit taller, so windows, clocks and the like fit the walls better (in the new look: the walls go up past
  the picture with a picture rail and a cornice, so what hangs there has room above it and nothing is stretched)
- [x] Clocks show the real time (in the new look: the wall clock's hands turn with the island's time)
- [~] Go back through the island, the shops, the houses and every room and look again at each prop and decoration in 3D:
  they came over one to one from the 2D pictures, so not everything looks good in 3D (and some didn't look great to begin
  with); redo or replace what doesn't (so far: every piece of furniture and every prop on the island has a model of its
  own, checked against the lists; Sarah's pots from the wheel are turned round from their own shape instead of a cut-out)
- [x] Outdoor decorations placed better: the notice board in front of the square's big tree, and lamp posts along the
  paths into the square, down the steps to the dock, along Market Lane and up the trails (a save step brings back to
  Sarah's storage anything of hers that was in their way)
- [ ] Big outdoor-only furniture installed around the island (what it is still to decide). Some spots could be held back
  from the grid (nothing can be placed there) until Sarah has given enough to the town, and then the town builds
  something there: a coffee shop, a set of swings, and the like
- [x] The fountain on the square bigger, more detailed, and solid: a grand fountain modeled in Blender, a moulded basin
  with two bowls, water sheets, a jet and four bronze fish, four tiles wide and three deep, that nobody walks through
- [x] The giant David statue taken off the main square: a flower bed stands there now, and the statue, smaller, is on
  the lawn along Market Lane (the neighbors still talk about it, so it stayed on the island; easy to take away entirely)

## David's notes from playing beta (27 October)
- [x] Mac's: every seat a stool in the new look, so the round folks fit (and whoever's in a seat sits on it now)
- [x] The square's big tree stands in a raised bed of stones (grass, roots and little flowers inside; nobody walks on it)
- [x] Order again on the laptop: anything Sarah has ever had, but quest things, keepsakes, prizes, tools and one-of-a-kind
  gifts
- [x] Flowers bigger and more flower-like: each kind easy to tell apart and its color easy to see
- [x] A watering can: water flowers, and two watered flowers side by side may cross-breed a new one next to them
  (Fortune sells it on the tool rack; it waters the tile in front and one each side; two of a kind, both watered, may grow
  a new one beside them by morning: two of one color make that color, two different colors the third)
- [x] Hats sit on the hair: right now nearly every hat clips through most hairstyles (the crown sinks in, hair pokes
  through the sun hat's brim)
- [x] A scrapbook for the camera: a photo says what's in it (a neighbor, an item, furniture, a building, a special or
  strange event, the weather...) in a little tag, and the scrapbook keeps each with a short bio. It counts what Sarah
  has found but never shows a total, so it doesn't feel like something to complete
- [x] Shaking trees: Sarah shakes with her arms, the tree shakes a bit, then something falls. Now and then a neighbor
  shakes a fruit tree and picks up what falls (fruit only, never anything important, and only once the island has
  several fruit trees)
- [x] Shake a tree and talk to a neighbor from where Sarah stands, without jumping in front of them first (the jump can
  land her somewhere she shouldn't be)
- [x] The plane flying by is a full-size plane far off, not a toy (a jet with its contrails, high over the far edge); cloud
  shadows drifting over now and then
- [x] Fruit, things on the ground, lights and animals pop in only a step away: show them from further off (the animals
  come and go out of sight, the lamps' light fades in and out, the far edge fades into the haze when zoomed out)
- [x] A clearer sky: the haze shouldn't go all the way up
- [x] Street lights light up more of the paths and the square at night
- [x] Walking: Sarah can walk a little way up cliff sides (only the camera moves), a little into rivers, and oddly over
  bridges and stairs. Everything on the grid, each tile walkable or not, would fix it
- [x] Fishing: Sarah reels in what she caught and holds it up over her head; the fishing rod a 3D model, not a picture
- [x] Market lane: more space between its top and bottom rows of shops, and the shops a bit further apart (the alley
  between the rows has benches, lamps and flower beds, a lawn runs along the lane, and two empty lots wait at its east
  end; a shop Sarah had moved goes to its new spot)
- [x] The arcade swapped round: Fruit Catch, Gopher Garden (the whack-a-mole one), Surf's Up and Noodle Slurp (the
  snake one) go to the back room, and the back room's Dumpling Drop, Sushi Swap and Fortune Falls come out front. One
  cabinet in the front room is out of order: that's the special game David will remake from memory later
  (done: the back room's story now hides the four old classics; the out-of-order cabinet at the end of the row, a
  paper sign over its screen, waits for that game)
- [x] The garden spots by Sarah's house are raised planter boxes now (they were lost under the grass); a community garden
  of eight beds by the farm that anyone can plant, where a grown crop turns up in none, one or two empty beds each
  morning; fruit trees round the farm
- [x] Music for each hour of the day, as Animal Crossing has (David will bring the tracks) (the library is ready for them:
  see the late notes below)
- [x] Holiday decorations that fit the day: bigger jack-o'-lanterns, and decorations round the square and on the shops and
  houses for the big holidays, seasons and events, up for longer and more elaborate the more the day matters (Spooky
  Season done: carved jack-o'-lanterns that glow at every shop and house, hay bales of pumpkins at the square's corners,
  orange and purple bunting, and on Halloween one by every lamp post. The Winter Lights: the grand tree strung with lights
  and a star, a wreath on every door, red lanterns at every shop, red and green bunting, and for the Winter Holiday presents
  under the tree; snowmen all winter; lanterns at every shop for Lunar New Year, heart lamps and hearts for Valentine's;
  hay bales of pumpkins and corn for the Harvest Festival and Feast Day; red, white and blue for the Fourth of July)
- [x] Fortune's shop moves onto the shopping street, and Fortune gets a house of their own; Sarah can shop there when it's
  closed or Fortune isn't working, on the honor system, as at the other shops (the shop at Market Lane's east end, Fortune's
  house just west of the square, a little garden where the shop stood; open all night on the honor system)
- [x] An empty lot on the shopping street, to even out its places: a sign saying it's set aside for a new business, where
  one of the neighbors still to come will open a coffee shop (the lot at the alley's east end: a COMING SOON board with a
  coffee cup)
- [x] Two "residential land for sale" signs somewhere on the island, with paths out to them: where the new neighbors
  will live (two plots in the neighborhood, west and north-west, kept empty, each with a FOR SALE sign)
- [ ] The cliff edges, the island's sides and some of the sea look blocky. Once everything is on the grid, draw the tiles
  rounded like a tile sheet: the cliff sides are tiles nobody walks on, their 3D pieces with a little ground and
  see-through edges
- [x] The boat Sarah came on is tiny: it should be as big as a building (now a cabin sailboat five tiles long, tied up
  stern-to at the end of the pier with its fenders against it: a cabin with portholes, the wheel, the mast and rigging,
  the mainsail furled under a blue cover, rails and a life ring)

## David's notes from playing beta (27 October, evening)
- [x] Birds flying around go backwards (they fly tail first) (the gulls circling over the beach were turned the wrong way)
- [x] Shaking a tree: the fruit should fall out of the tree and land, not just appear on the ground; and it shouldn't be
  hidden when Sarah stands behind it (the see-through fade hides the fruit with the tree) (it falls from the crown, one a
  moment after another, bounces once and comes to rest; fruit on the ground never fades)
- [x] The community garden should look more like a farm plot (tilled rows in a fenced plot, like the farm's fields,
  rather than planter boxes) (a fence round it with a gate, the ground tilled, each bed two ridges of soil)
- [x] Far fewer street lights round the town square and elsewhere; each lamp lighting much further out, and the town more
  lit up at night in general (fourteen lamps instead of thirty-two: the square's four corners, one down the pier street,
  one out along each main path, a few on Market Lane and in the neighborhood; each reaches about half again as far)
- [x] Talking to a neighbor, now and then they ask to play a game or ask Sarah to do something for them; and now and then
  (rarely) they text her asking to play or for a hand (favors were already asked; now about one talk in eight a neighbor
  asks to play, once a day at most, and a text now and then asks too)
- [x] The collection: tapping an item opens its own little display: the item in 3D (turning), what it sells and buys for
  where that applies, where it comes from, and so on (in the new look its model turns; where the models aren't loaded, its
  picture big; first found, how many she has)

## David's notes from playing beta (27 October, late)
- [x] Music: David is downloading the music from every game (about 3 GB). It lives on the server, not in GitHub (a music
  folder shared by beta and live, uploaded from the Music app); each hour outside plays that hour's track from a game picked
  at random for the hour (rain and snow versions where a game has them), and the Music app sets it by hand: one game always,
  a game for a given hour, or any track on repeat (Phone > Music > Your music > Upload a folder; steps in docs/DEPLOY.md;
  at home too, as in Animal Crossing; games can be left out of the mix or removed; David uploads it once from beta, live
  only plays it; anyone can add music of their own, kept on their device)
- [x] Once David's soundtracks are uploaded: go through them and swap the game's own tunes (the shops, the museum, the
  club by day, the title...) for the soundtracks' tracks (he sends the list from "Copy the track list") (done: the title,
  Fortune's by its size up to T&T Emporium, Able Sisters, Shampoodle, the museum and its aquarium, the Town Hall, the post
  office by day and night, Club LOL, The Roost Café, Nook's Homes at Ginger's, the holidays and the New Year countdown,
  hide-and-seek, a project's dedication; the folder tidied of duplicate formats and files that aren't music)
- [x] A new neighbor, the seafarer: a giant shrimp, a salty old sailor, found washed up on the shore, out cold, a week
  after a new island is started or a save imported. He's building a new ship and needs something each day: ten logs
  (chopping a tree gives one until he has enough), then ten home-cooked meals for the journey, then gems. He sails away
  in a little cutscene and leaves a gift; a few days later his boat is back at the pier and he asks to move in. If Sarah
  says yes he takes one of the plots for sale and works the farm (out in the fields every day), and brings new foods,
  recipes and seeds (Captain Shrimpy: the wreck, then his ship taking shape on the beach east of the pier; five gems; his
  old compass as the gift, or a letter if Sarah misses the tide; the plot by the west lane; pumpkin and sweet corn seeds
  at Fortune's from then on; sailor's stew, fish tacos, pumpkin soup and grilled corn taught a heart at a time; salty;
  talked to while he's farming, a stall of the season's seeds and one of his recipes; his house a ship's cabin)
- [x] A new neighbor, the coffee shop's: an empty mug. Once enough has been given to the museum and the pottery hall is
  full, the curator writes to thank Sarah, then tells of an old dig on the island that found part of a pot, and asks her
  to look for the rest. An X dug-up spot turns up somewhere on the island once a day (not dug that day, it's somewhere
  else the next); five pieces in all. Sully puts them back together at the museum: a giant mug. The next day, the first
  time Sarah comes out, the mug visits: they were a living mug all along, and thank her. They talk about being a mug, being
  caffeinated, and how odd it is that everyone else is food. They open the coffee shop on the alley's lot (Muggy: twenty gifts
  and a full pottery hall; Sully mends the pieces with gold; Muggy's café with four coffees that perk Sarah up, the first
  one free, a friend texted to come along like at Mac's, a cup to go set on a table at home; the mug lives on the plot by
  the farm lane, in a house that remembers when everyone was dishware)
- [x] The new neighbors and how they're found count as secret characters, and as the harder achievements (the
  Collection's "Secret neighbors" page: Captain Shrimpy and Muggy, each with a hint until found)
- [x] The arcade's unlocks (hairstyles, clothes and the like) much harder: the watermelon in the Suika-like game, level 10
  in Spice Capsules, and so on for every game (a watermelon in Snack Stack, level 10 in Spice Capsules, 50,000 and level 12
  in Bento Blocks, 4,000 in Fruit Catch, 60 jumps at jump rope; five things that used to turn up by chance now come from
  the back-room games: 12,000 in Dumpling Drop, 4,000 in Sushi Swap, 2,500 in Surf's Up, 20,000 in Gopher Garden, 2,000 in
  Noodle Slurp; set against how the neighbors' best players score; and the other unlocks raised too: forty dances, a
  hundred flowers, fifteen museum pieces, twelve gold medals cooking, thirty of Joe's poems, six salon visits, fifty
  harvests)
- [x] Town projects, paid for from the town's projects fund: a swing set, a hammock on the beach, a park clock, a stone
  tablet (a shrine) on top of the mountain, restoring the lighthouse (boards over its door until it's paid for; paying
  starts the ghost's side quest), and last and dearest, a
  statue of Sarah (the Town Hall's Projects screen: paid in bit by bit, built overnight with a letter from Sir Floret;
  Sarah swings on the swings and lies in the hammock, the clock keeps the time, the tablet grants a wish a day; the statue
  opens once all the others are built, and the day after it's up the Council offers to cast anyone or anything new in
  bronze, free: David, any of the island's people, Dr. Frasier Crane, her Tamagotchi keychain, a rose; Fortune's bigger
  shop is Fortune's own doing now, a week in; an island whose lighthouse story
  had begun keeps it open)
- [x] When a neighbor asks to play, it's sometimes volleyball, jump rope or one of the arcade games, as well as tag and
  hide-and-seek (volleyball wherever they are by day; jump rope on the square with a friend of theirs turning, Cuke if
  he's about; an arcade game on their handheld, two players; texts ask for them too)

## David's last list for later (27 October, late)
(Where this list repeated something already on the roadmap, it's folded into that item instead: memories and friendship
under "Friendship, deeper", the testing under "Bugs", the town flag under the Town Hall.)
- [ ] Menus and screens overhauled: better looking, consistent, easier to get around and use (the phone, the pockets,
  the shops, the customizing screens, the dialogue boxes)
- [x] What renews (fruit, fish and the like) left lying on the ground is gone at 5 AM when the day turns over; anything
  that matters (furniture and the like) goes to a lost and found instead (the Town Hall's, with a letter from Sir Floret)
- [ ] The Friends app: fuller profiles (personality, who they're friends with, what they like doing, memories with Sarah)
- [ ] Final polish of the new look: every hairstyle, outfit, design, accessory and animation together with nothing
  poking through; lighting indoors, in each season, weather and time of day; draw distance (nothing popping in or
  vanishing; the worst of it fixed 27 October); ground, water, grass, trees, props and animations that don't match;
  phones faster without the nearby scenery and people looking worse
- [ ] (David, 28 October) Seeing far, at the very end of the polish, just before the big testing: things coming into view
  without being noticed (on computers and phones), and the haze far off much less obvious (it can feel like an N64 or
  PS1 game). Started 28 October: the haze takes the sky's color behind each thing, the sky's horizon sits on the
  island's far edge, stars and clouds in the strip of sky over it.
- [ ] The game as something played for months: tedious chores, awkward pacing, confusing screens, frustrating
  activities

## David's notes from playing beta (28 October)
- [x] The lighting at night blown out yellow near the shops (every doorway and jack-o'-lantern was lit like a street
  lamp); a street lamp's light far reaching but gentle close up
- [x] Brick paths from the island editor show in 3D (and planks)
- [x] An option to play in 2D (Settings > View: 3D or Classic 2D)
- [ ] A sky behind the haze (started: see "Seeing far" above)
- [ ] Outdoor furniture: real 3D models; sold by kind each day (lights, benches, fences, statues and gnomes, signs and
  umbrellas and picnic tables and the like, hedges and plants, and more), more of each kind (hedges, benches...), each in
  four colors; any furniture goes indoors or out (a paint easel outside, a park bench in the house)
- [ ] (for later) More life at night: moths round the lamps, fireflies, and the like
- [ ] (for later) The lawn's texture calmer: shapes that don't overlap, with even dark gaps between them, as in the
  GameCube Animal Crossing's grass (triangles, circles, squares; green in spring and summer, olive and gold in autumn)
- [ ] The map redone to look better, with places named on it, so a neighbor's text saying where they are can be found on
  it. On beta, David draws the areas on the map himself (these tiles are the campfire, this is the neighborhood, this the
  mountains, the east meadow...), and their names show as labels
- [ ] Residents at the Town Hall: pick the areas a neighbor likes to spend their free time in (not working or asleep), and
  for each activity whether they do it more often, as usual, or never (chatting with neighbors, the museum, fishing, the
  arcade, eating out, planting flowers...). Anywhere not drawn on the map is a way between places: walking there, a
  neighbor sometimes stops to use what's along it (a drink at a fountain, a sit on a bench)
- [ ] Friendship earned over days: with each neighbor, points only for the first talk of the day, one favor a day if they
  have one, one gift a day, and every other thing that raises friendship once a day; best friends is something worked
  at. Joe still starts at the most and never goes down
- [ ] Decorating the house: furniture turned to face any of the four ways (they're models now: a chair facing the table);
  pictures on a table, on the floor or on the wall; flowers, fish and most other things set down too
- [ ] The Cozy Council out of the Town Hall: they come by only when Sarah asks for the island to be judged. The Town Hall
  gets a keeper of its own who does the desk's work, and when nobody's working the screens are there anyway, on the
  honor system, as at the shops
- [x] No descriptions when looking at props and things (they dated from the phone game's stand-in pictures: now you can
  see what things are, and the jokes wore thin heard often)
- [ ] Props and furniture that act: anything that should move or do something does (fires flicker and breathe, fountains
  shoot water, lamps indoors switch on and off, a TV switches on to static, clocks tick round as time passes...)

## The museum, in rooms (David, 26 October: for later)
- [x] A room for each kind of thing given to it: paintings, pottery and so on, each room laid out for its kind (paintings
  hung along the walls, pottery on plinths and in cases), walked through from the entrance hall (the hall has Brulee's
  desk, the easel corner and six archways on its back wall, each with its wing's name over it; the gallery hangs eight
  paintings, five on the wall and three on easels, and the pottery hall has ten pedestals)
- [x] A fish section, already full: every kind of fish in the game in its tanks from the start (tanks for the rivers, the
  sea and the ponds and a touch pool for the shellfish; each tank's card says where and when each is caught, and which
  Sarah has caught)
- [x] A photography section: photos taken in the game, or real photos uploaded from a computer or a phone, framed on its
  walls (kept on the server with the island, like the save) (nine spots, five on the wall and four easels, each photo
  with a name on its card; it stays in the album too, outside the album's twelve)
- [x] An outfit section: the clothes Sarah has made at the sewing machine, worn by mannequins (six dress forms, each in a
  copy of one of her designs)
- [x] An island history section: displays of the special things found on the island in the big hidden quests (a glass
  case for each of the six mysteries, its keepsake inside once solved, and a plaque for the island's founding)

## Late in development (David's notes for much later)
Some of these need things that don't exist yet (a town flag, records kept over time); add them when we get here.

On beta, walk into the Town Hall, the Post Office or the Bank and use the counter: the ticked ones below work for real; the
rest still show sample numbers. (The zip code's weather and news and the market's prices come from free services the
server asks once a day.) The Post
Office's and the Bank's keepers are still to be picked.

### The real world, by zip code
- [x] Sarah sets a zip code: the island's time zone, that day's weather forecast (not live: the day's prediction),
  local news, fetched once a day from free APIs
- [x] The post office mails a newspaper every day: real headlines and tidbits, the weather, and an island section
  with stories about what Sarah and the neighbors actually did

### Bank
- [x] Savings account: deposit and withdraw, daily interest (weekly rates)
- [x] Stock portfolio from real stocks (a few global ones from a free API): invest, see performance graphs and
  historical returns, dividends from eligible stocks
- [x] Pay off house upgrade loans
- [x] Savings goals with progress trackers for expensive purchases
- [x] Financial statements: lifetime earnings, spending, investments, income sources
- [x] Safety deposit box for valuable or sentimental items

### Post Office
- [x] Send physical letters to neighbors (besides texting), with presents attached
- [x] Newspaper archive: keep and reread past papers
- [x] Postcard collection from fictional places
- [x] Package tracking for things ordered from the computer
- [x] Lost mail quests: deliver misplaced packages and letters
- [x] Special deliveries: now and then a mysterious package with something rare
- [x] Customize the look and color of the mailbox (seven colors, free; a cottage, a fish and a lighthouse to buy once, painted in the color picked)

### Town Hall
- [ ] (David, 27 October: for later) Take David's statue off the island, and later bring a statue back as a town project:
  Sarah saves up for it in the town's projects fund (with the Bank's investments), and when it's built it's a statue of
  Sarah; a day or two after it goes up, she can have it changed to David or to another of the island's characters or
  to an object instead
- [x] Town flag designer: draw a pixel-art flag shown round the island
- [ ] (David's last list, 27 October) The flag Sarah draws as a 3D flag flying over the Town Hall, and on a little
  flagpole at the end of the pier
- [x] Town ordinances: Early Bird (shops and neighbors start earlier), Night Owl (shops open later), Community Spirit
  (neighbors socialize more), Nature Conservation (more wildlife and growth, trees grow faster, neighbors plant
  flowers where there aren't enough)
- [x] Town census: every resident, birthday, personality, friendship and more
- [x] Town history (a timeline of milestones), island statistics (days played, fish caught, items, money...), island
  records (biggest fish, best day, longest friendship), town achievements with commemorative rewards
- [x] Rename landmarks (beaches, mountains, forests...)
- [x] Residents: customize catchphrases, reset or change clothes and accessories, adjust schedules (when they wake,
  go home, where they go) (hours, what they wear today, catchphrases, and two places a good friend likes going in their
  free time)
- [x] Missed holidays: if Sarah didn't play on a major holiday (the Egg Hunt, say), the Town Hall lets her hold it the
  next day she plays, for up to a week after (so it never lands on another holiday: no Easter at Christmas)
- [x] Town anniversary: a monthly island day
- [x] Save management: make backups or restore an earlier save (the server keeps backups already)
- [x] Island jobs: three small jobs a day for sand dollars (deliveries, sweeping the square, repainting the dock sign, bringing in shells, fruit or fish)

## Bugs
- [x] Talking to Wonton in the hot spring: the spot you have to stand in is too hard to hit (fixed: any side of the rim works, and a tap walks below it)
- [~] A light test pass at the very end (David played it for a week and reported bugs as he went; David's last list,
  27 October: every system, minigame, shop, way of talking, holiday and odd combination of things; old saves still
  loading and progress hard to lose; long sessions for bugs, slowdowns, repetition and stalled progress). 26 October: a bot
  played about 2,300 actions in the classic view, the HD-2D view and the new look (random places, hours, talk, buildings,
  apps, civic screens, games, jobs, new days), every civic screen and the neighbor games were checked on three phone
  sizes, and Halloween night was played through; fixed: the new look not showing Ginger's changes until a reload, edit
  modes left on without their Done button, six-button games too wide for phones, the trick-or-treat costume lines,
  holiday bunting against the shop fronts and flat in 3D, leaving a building twice, mail piling up, interest too high
