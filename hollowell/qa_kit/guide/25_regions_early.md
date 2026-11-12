## The overworld up to the fourth House (the main path)

### How the overworld works (what to keep in mind while testing it)

- **One map** (`hollow`, about 192 x 120 tiles) made of 64 x 40 blocks: Hollowell (block 1,1: x 64-127, y 40-79), Meadowfold (1,2: x 64-127, y 80-119), Kilnridge (0,2: x 0-63, y 80-119), Millwater (2,2: x 128-191, y 80-119), Belfry Heights (2,0: x 128-191, y 0-39). The Cliff Stair is a ravine (x 168-174, y 40-79) up the east side of the Hushwood block, walled off from Hushwood. Block-local coordinates in the code add the block's origin (a Meadowfold `(4,23)` is overworld (68,103)). Overworld coordinates below are absolute.
- **Rebuilt on arrival.** The overworld is built fresh each time Wren comes out of a building, a House or a load: everything marked is back on its place. Permanent changes are flags (`kilnPass`, `woke:<id>`, `fill:x,y`, chests, the forecourt gate...).
- **Wren's mark outdoors** is set each time she enters a named region, and at a stitched stump where she ties off. Falling or drowning outdoors flies her back to it along her trace. **Fainting outdoors** wakes her in her own bed at Gran's (a different line each of the first few times, then a notice "Your own bed again.").
- **The fog** at the valley's edge pulls Wren back along her trace (not passable until much later).
- **Rest stumps** (`rest`, a stump with a red cross): Action asks to tie off her thread there: yes saves the game, sets her mark beside the stump and gives back a heart ("Tied off. (Saved.)"). Meadowfold (102,95); Millwater (137,104), (181,107); Heights (174,33), (161,13), (155,16).
- **The goal line** (top of the pause menu and the map pin) tracks the main path. The map pin points at the first place the goal names (`MAP_SPOTS`, src/22_menus.js).
- **Townsfolk are marked** to their spots: push one and they shuffle off, then back ("budging"; each has a line the first time: secret S01).

### Save states for this part
S01 (Wren's room, new game), S02 (the square after the ceremony), S03 (Meadowfold, before House 1), S08 (Meadowfold after Knot 1), S09 (Kilnridge, through the pass), S13 (Kilnridge after Knot 2), S14 (Millrace Falls, outside House 3), S18 (Millrace Falls after Knot 3), S19 (Belfry Heights, top of the Cliff Stair), S23 (Hollowell after Knot 4, festival about to start). The catalogue's route goes straight from each House to the next: in S08-S12 and S14-S17 the goal line still says "go back to Hollowell" (a visit home that the route skipped; playing it late is valid).

---

### Gran's house and the prologue (src/50_prologue.js; legs.mjs LEG1)

- **Opening:** black screen, Gran humming her bedtime tune ("Low... high... in between... high... and low again."). The Journal keeps it as a note, "Gran's bedtime tune" (`granTune`): it is the answer to the Belfry's Echo Room. Wren wakes in bed in her room (`gran_room`); Gran calls her down. Goal: "Get up and go downstairs to see Gran."
- **Downstairs** (`gran_house`): talk to Gran (`talkedGran`): "Every Wanderer before you walked out of a house just like this one... And every one of them came home." Goal: "Go to the Well in the middle of town, where everyone is waiting." Talking again: "Go on, love. The Well."
- **The ceremony** (`Ceremony`, flag `ceremony`) starts the moment Wren steps out of the house after talking to Gran. Scripted: Wren walks to the Well (95,58); the town gathers round her (Ives, Bram holding a pot, Rosa, Thimble, Seam, Mallow, Mabel, Quill); Gran's speech (strays, the Wander, six Houses, six Knots); Miss Quill reads the Rules of the Return ("One: everything has its place. Two: whatever is moved goes back the way it came. Three: nothing is ever lost in the Hollow."); Gran gives the **Wanderstaff** ("Press [atk] to swing it: it knocks light things aside and flips crystals."); "the Way always brings you home"; Ives: "And wipe your feet!" The crowd walks off and vanishes into their places (a poof each). Goal: "Find the Tidyhouse in Meadowfold, south of town, and tie its Knot." Toast: "[atk] swings the Wanderstaff." Autosave.
- **Expected:** no control until the end of the scene; afterwards Gran stands by the Well (93,60) until much later.
- **QA notes:** the ceremony triggers only after `talkedGran` (leaving the house without talking to her doesn't start it). Earlier fixes worth re-checking: Wren no longer walks through props or the Well, the crowd no longer vanishes in one frame, Mabel no longer covers Wren (POLISH findings 22, 54); the first line (narration over black) is visible (finding 11).
- **Optional here (see 50_optional.md):** the turned portrait in Gran's house (Linnet's note 1, needs the Gloves).

### Hollowell, the town, from the ceremony to the fourth Knot (src/36_hub.js, 51_town_talk.js, 51b_town_life.js, 57_festival.js; tests/town.test.mjs, hub.test.mjs)

**Layout (main path only).** The Well in the square (95,58), carved EVERYTHING IN ITS PLACE. Gran's house north-west (door 76,50). The Inn (Spool & Thimble, door 108,52) east of the square. The schoolhouse (Miss Quill's blackboard: the Rules) south-west. Exits: **south road** to Meadowfold (sign at 98,77: "South: Meadowfold."); **north road** "Closed past the posts, by order of the Warden of the Well", Constable Burr at the posts (96,43) (the stone gate is far later); **west road** to Larkspur (not open from this side yet); **east road** to Hushwood, blocked by the sleeping giant until the Recall Bell (after the festival, outside this part).

**Who's where and what matters (by stage).** Townsfolk say something new once after each Knot (`TOWN_LINES`, only the newest stage's lines, said once each, then their usual lines; town.test checks this).

- **Before Knot 1 (S02):**
  - Gran at the Well: Act I lines ("The Tidyhouse is down in Meadowfold, past the sheep...", "If you get stuck, stand still a while and look at what goes back where. It nearly always tells you.").
  - Miss Quill (by the school): a quiz on the Return (right answer "Goes back the way it came": 5 buttons, `quiz1`); her blackboard has rules 1-3 only.
  - The children Nell, Otto and Bea play tag in the square (they move); Fisher Hob walks the river bank; Pudding the dog chases a ball; Biscuit the cat wanders.
  - The Inn's attic stairs are roped off (hub.test).
  - Seen in passing, nothing to do yet: two Guild crates jammed in the lane by Thimble's, a kite up the tree by the Inn, a sewing tin asleep among Mabel's strays, a crimson thread from Jory's shut toy shop to Tuck's door, Rosa's saucer on the bakery's sill (favours: 50_optional.md).
- **After Knot 1 (S08 goal: "Go back to Hollowell and tell Gran. Next, the Kiln in Kilnridge: the canyon road west of Meadowfold."):**
  - Gran's lines change: "Your first Knot! Did you feel it?...", "Next is the Kiln, out west in Kilnridge. The road's blocked by that old boulder, but you're a clever thing."
  - New once-lines: Quill ("Rule four's up on the board now: heavier shoves lighter. It always goes up the morning after a Wanderer's first Knot."), Gundry (the winch turned by itself), Rosa, Arlo (felt it in his knees), Mabel.
  - Mother Ives tells of the **Tidiness Trials** in the Inn's attic (stairs now open). The children play "Housekeeper" round Otto's chalk X (S12). Both optional.
  - Pip in Meadowfold now says "There's a big boulder in the canyon, west of the pen... Somebody with a good grip could shift it."
- **After Knot 2 (goal: "Back to Hollowell. Then east: the broken bridge in Meadowfold, and Millwater beyond it. Your Hookline should get you over."):**
  - `tagStopped`: the children stop playing tag ("don't feel like running"). Thimble sells the Hook pouch. New lines: Bram ("Did his tail stick? It's always the tail. ...So I'd imagine."), Seam (an order of glazed scales), Quill (rule five), Burr (fog thicker), Mallow. Gran still uses her after-Knot-1 lines. The kite favour becomes possible (Hookline).
- **After Knot 3 (goal: "Next, Belfry Heights: across the lake from Millwater, up the cliff stair. (The Paddle will get you over.)"):**
  - Hob stops walking the bank and only stands (`d3`; town.test "the town gets stiller"). New lines: Rosa (Dad came in wet to the knees, and winked), Ives ("I've been here all week. Tidying."), Gundry, Arlo (Hob's taken root), Thimble (four miles of string).
- **After Knot 4 (S23; goal: "Home to Hollowell: it is the Knotting Festival."):** the square in bunting and lanterns, Returnball set up east of the south road, the town gathered round the Well (`Festival.gather` on building the town while `d4 & !festival`).
  - **The festival scene** fires once (`festival`) when Wren steps into the square (x 85-106, y 53-66). Gran: "Four Knots! Only two to go, love." Four people arrive late, out of breath, from four directions: Bram (clay to the elbows), Dad (soaked), Mum (brass dust in her hair), Ives (a feather duster in her apron pocket): "Sorry! Busy day." / "Very busy." / "Pots don't make themselves! HA!" / "...Tidying." Music; everyone dances on the spot. Gran points Wren at the east road: goal "The east road out of town: the sleeping giant. Ring the Recall Bell at it." Pip announces Returnball; the camera looks at it and back.
  - Afterwards: Pudding stops chasing and lies by his ball; new lines (Ives and Bram late, "several somethings"; Quill, a sixth rule chalked and rubbed out; Hob; Tuck held the bunting). Returnball stays up (S29, optional). Mabel's tin can be woken.
  - These are the first strong clues to the first big reveal (the Makers): intended, not continuity errors.
- **QA notes:** town.test checks that only the newest turn's lines are said (a line from three Houses back is never said late), that each new line fits the box in three pages or fewer, and the stillness steps (Hob at 3, Pudding at 4). The pin for "Home to Hollowell: it is the Knotting Festival." points at the town (96,60) (polish2).

---

### Meadowfold (block 1,2; src/43_meadowfold.js; tests/meadowfold.test.mjs; legs.mjs LEG1-LEG3)

**Overview.** Fields south of town: Pip's pen and her three sheep, the windmill, the Old Fold, the Tidyhouse on a rise (door 108,92), the canyon road west to Kilnridge (blocked by a boulder), the river and the broken bridge east to Millwater. Nibblers wander (1 HP). Signs: "MEADOWFOLD. Mind the sheep. The sheep mind you."; "East: the Tidyhouse. (Please wipe your feet.) Further east: the old bridge to Millwater."; "West: Canyon Road, to Kilnridge."; "BRIDGE OUT. Hook on, if you have a hook." Rest spot at (102,95). Save states S03, S08.

- **To the Tidyhouse (before Knot 1):** south road from town (LEG1 walks to (95,98)), east to the door (108,93), up into it. No gate.
- **Sheep** (Pip's flock): marked to their spots; walking up on one drives it on ahead a step at a time; left alone it ambles home the way it went (meadowfold.test). Pip (77,106): "Same three spots, every day, forever."

#### The canyon road boulder (to Kilnridge; needs the Gloves)
- **Idea:** the Gloves pull a heavy thing that can't be pushed out of the way.
- **Elements:** a big boulder `canyonBoulder` (heavy, marked) on the canyon road at (68,103), the road one tile wide there; a 2x2 niche just north of it (68-69, 101-102), reached from the road at (69,103).
- **Solution (LEG2, checked in the headless game):** go into the niche to (68,102), face down, hold Action to grip the boulder and step back up to (68,101): it comes up into the niche (68,102). Walk out round it ((69,101), (69,102), (69,103)) and west along the road into Kilnridge (x < 64), within the boulder's patience (2.5 s). Crossing into Kilnridge sets `kilnPass`.
- **Blocked:** pushed, the boulder won't go anywhere useful (the road is walled both sides); without pulling there is no way past (walkTo fails).
- **State:** once `kilnPass` is set, every later build of the overworld puts the boulder in the niche (`canyonBoulder2` at (68,102), homed there): the road stays open for good.
- **QA notes (checked headless):** until the overworld is rebuilt, the pulled boulder goes home onto the road after its patience, so turning straight back east finds the road blocked again. That is the Return working, not a softlock: from the west side push it one tile east, step into the niche, pull it again; or enter any building, the Kiln, or load, and it is in the niche.

#### The broken bridge (to Millwater; needs the Hookline)
- **Elements:** the road meets the river (x 114-116) at rows 106-107; the bridge is gone. Brass eyelets on posts: (111,106) on the west bank and (119,107) on the east bank. Sign (111,105): "BRIDGE OUT. Hook on, if you have a hook."
- **Solution (LEG3):** stand at (113,107) facing east and use the Hookline: it catches the far eyelet and reels Wren over the river to the east bank (x 117-118). Walk east into Millwater (x 128+). The west eyelet brings her back the same way.
- **Blocked:** no other crossing on foot before the Paddle (the river is deep).
- **Possible bug (cosmetic, map pin):** for the goal "Back to Hollowell. Then east: the broken bridge in Meadowfold, and Millwater beyond it..." the map pin is at (126,96), a solid tile about 10 tiles north-east of the bridge (113-118, 106-107). Checked headless with `mapPin`. Not a blocker.

#### Optional things passed in Meadowfold (details in 50_optional.md)
- Heart Patch behind the windmill (84,84): walk round behind it.
- The stray hay bale (100,110): push it; it doesn't come back; Linnet's note 2 under it.
- The Old Fold (68-82, 90-98): drive Nettle round against the count; the tally box (the clapper for the Heights' old bell).
- Old Tup asleep in the bothy door (76,96): the Recall Bell; a Heart Patch inside.
- Lucky the lamb across the river (119,112): the Needle (much later); Pip's Heart Patch.

---

### Kilnridge and the canyon road (block 0,2; src/46_kilnridge.js; tests/kilnridge.test.mjs; LEG2)

**Overview.** Red clay canyons and mesas west of Meadowfold. Vents (a vent fires whatever sits in its mouth along its line; their wet clay mouths hold what lands in them whole); wet clay holds what's thrown into it; Crocks (walking pots) wander. The Kiln is in the Kiln Mesa; its door (22,93) is behind a forecourt gate. Save states S09 (through the pass), S13 (after Knot 2).

#### The two old vents on the road in (a demonstration, no reward)
- Two vents four steps apart (40,101) and (44,101) throw a pot back and forth: it comes down whole in the other's wet mouth each time and is held there (kilnridge.test: "40,21 -> 44,21 -> 40,21"). This shows, without telling, that a pot can land in a vent's mouth and be fired on (finding 40: the blind solver's round B asked for it to be shown).

#### The Kiln's forecourt gate (the way into House 2)
- **Idea:** a pot set in a vent's wet mouth stays whole and is fired on.
- **Elements:** the forecourt gate `kilnGate` (22,96) below the Kiln door (shut: walking to (22,94) fails); a pot `fgPot1` on the road (17,99); a vent by the road whose wet mouth is at (25,97); the firing hole in the rock (25,99), a `once` charm `fgHole`.
- **Solution (test, LEG2):** lift the pot from (17,98) facing down; stand at (21,97) facing east and throw: the pot lands whole in the vent's wet mouth (25,97) and is held. After the vent's breath (a few seconds) it throws the pot over the rock into the firing hole: the hole rings and the gate opens for good. Walk to (22,94) and up into the Kiln.
- **Blocked:** set down on plain ground off its place, the pot walks home; LEG2 allows another go if a Crock gets in the way. A save that has been inside the Kiln (`visited:kiln`) or holds Knot 2 finds the forecourt open (test).
- **State:** `charm:fgHole` (stays rung); the gate's condition is `fgHole | visited:kiln | d2`.

#### Leaving after Knot 2
- The Kiln's exit opens onto a ledge high on the mesa, out to (22,94). The goal sends Wren back through town and east to the broken bridge.

#### Optional things in Kilnridge (details in 50_optional.md)
- The Firing Ground (pit 11-28, 108-114): a Heart Patch; Bram's first pot.
- The sleeping vent (14,94) and the Kiln Mesa's chimney: the Recall Bell; 50 buttons.
- The clay dam in the slot (60,96): the Needle; a Heart Patch.
- S20, the hawk's nest: a pot carried down past it and broken at the bottom; a Heart Patch.
- Linnet's urn at the end of the crevice: knocked from afar; note 3.
- The high mesa overlooking Larkspur (a later, one-way drop).

---

### Millwater (block 2,2; src/48_millwater.js, src/47_water_kit.js; tests/millwater.test.mjs, heights.test.mjs; LEG3-LEG4)

**Overview.** The Reaches: a big lake in the north half, Dad's mill on its south shore, reeds, piers, the outlet river running south over the falls, and the far bank (Millrace Falls, reached only by water) with the Millrace door (175,105). People: Dad (Ambrose) by his mill (157,102), Fen cutting reeds, Wick at his pier (145,97). Sign at the road in: "MILLWATER. The Reaches. (East: the falls, and the Millrace above them. Ferry at the end of the road.)" Rest spots (137,104) and (181,107). Save states S14 (Millrace Falls, outside), S18 (after Knot 3).

- **Dad (main-path lines):** the first time: "Two Knots already!... The Millrace is over the river, above the falls. The ferry'll take you; it goes over and comes back on its own, like everything else round here." Then hints in his way ("Things in the water drift off, and come back the long way, slower against the current.", "I'm not allowed to help, you know. Wander rules. But if I WERE allowed, I'd say: ride it there, ride it back."). After Knot 3 he is proud ("The mill's been grinding sweeter since you came out of the Millrace.").

#### The Millwater ferry (to the Millrace)
- **Idea:** a raft whose mark is on a current runs by itself: waits at its landing, crosses, waits, comes back.
- **Elements:** the ferry `mwFerry` (a raft, patience 2.5 s) at its landing (167,106) at the end of the road; it crosses the river to (170,106) on Millrace Falls. Sign: "FERRY. It runs itself: over, back, over, back. Hop on when it's in. (Off at the far side quick, mind.)"
- **Solution (LEG3):** wait for it at the landing, step on from (166,106), ride across, step off east promptly, walk to (175,106), up into the Millrace. Coming back (LEG4): wait at (171,106) for it to come in, step on, ride back west.
- **QA notes:** stepping at a raft as it pulls away doesn't drop Wren in the water (millrace test "review fixes"). Missing the step-off means riding back: by design ("Off at the far side quick, mind."). A dive into the river from the far bank costs one heart and lands on dry ground (test).

#### The lake crossing (to the Heights; needs the Paddle)
- **Idea:** the Paddle steers a float; a float not held goes home.
- **Elements:** a raft at Wick's pier `mwLakeRaft` (146,95) and a raft on the north shore `mwNorthRaft` (168,83), each homed on its own side. Sign: "WICK'S PIER. (The raft's for anyone who can paddle. Over the lake: the cliff stair, and the Heights.)"
- **Solution (heights.test, LEG4):** step onto the pier raft from (146,96); hold [tool] with a direction to paddle: north to (146,86), east to (167,86), north to (167,83); step off north onto the North Shore (167,82). The raft paddles itself home to the pier once let go. Back: the north raft, paddled round the far isle's rocks (not through them) to the south side; it too goes home and doesn't carry Wren back.
- **Blocked:** without the Paddle the north shore is out of reach on foot (test); rafts can't be paddled until the Paddle is in hand ("Stand on something floating and hold [tool] to paddle." when used off a float).
- **QA notes:** no raft gets alongside the far isle (review_opt "new 3"). The shallows round the lake run in bands, never an isolated square (millwater.test).

#### Optional things in Millwater (details in 50_optional.md)
- S19 behind the falls (171,110): ride a float down the east side of the river (Paddle) into a hidden pool; a chest opened from the float.
- The basin below the falls (172,114): ride over the falls; 50 buttons and Linnet's bottle.
- Heron Rock (177-181, 91-95): reel a barrel ashore, set it out of the line, hook its empty mark; a Heart Patch; back by the post (178,99).
- Wick's ducks (Crossbar), the old mill pond (Bedroll), the Gulls' Rock (Needle): later tools.

---

### The North Shore, the Cliff Stair and Belfry Heights (src/55_heights.js; tests/heights.test.mjs, heights_crags.test.mjs; LEG4)

**Overview.** From the lake's north shore (166-172, 80-82; sign at (172,82): "THE CLIFF STAIR. Up to Belfry Heights.") a ravine climbs north up the east side of the Hushwood block (168-174, 40-79), walled off from Hushwood. At its top (171,38) Belfry Heights: windswept cliffs in terraces, each a level higher: terrace 1 (around y 30-37), the Bluster ledge (y 20-27), terrace 3 with a chasm (around y 11-17), the Belfry on top (door 158,7). Sign: "BELFRY HEIGHTS. Mind the wind. Mind the drop. Mind your mother." People: Brindle the goatherd on terrace 1, Mum (Tess) by the Belfry door (161,8). Rest spots (174,33), (161,13). Save state S19 (top of the Cliff Stair).

#### The shrine boulder on the first stair
- **Idea:** a sleeper goes home at a ring; a shrine bell rings like any bell.
- **Elements:** a boulder `hBoulder` asleep on the stair (140,29) (its place (139,30), off the stair); the shrine bell `hShrine` (142,31) on a post carved "RING, AND ALL COMES HOME."; Brindle: "That boulder on the stair? Rolled down in a storm and fell asleep there. Ring the shrine bell. Wakes anything."
- **Solution (test):** stand at (141,31) facing east and strike the bell with the stick: the boulder wakes and goes home; the stair is open (walkTo (140,26) succeeds). It stays awake (`woke:hBoulder`).
- **Blocked:** the boulder can't be pushed, pulled, gripped or hooked while asleep ("A boulder, fast asleep on the stair. It doesn't budge. It snores, faintly.").

#### The Bluster (the windy ledge)
- **Idea:** walk in the lulls, lean into the wind when it blows.
- **Elements:** a gust over the ledge (x 141-179, y 20-26) blowing south toward the drop, every 5 s for about 1.8 s (`hGust`); weather vanes at (139,20) and (181,20) spin up just before it blows. Sign (139,22): "THE BLUSTER. Walk in the lulls; lean into it when it blows. (The vanes spin up first.)"
- **Solution (test):** walk east along the ledge (row 21) in the lulls; when the vanes spin up or it blows, hold Up (into the wind) until it drops. Reach (180,21), go north to (180,17).
- **Caught out not leaning:** Wren is blown off the ledge down onto the first terrace (row 30), onto open ground, and can walk off (test). Nothing lost but the climb.
- **QA note:** the ledge above the little cave is rock: no hopping down into it (test).

#### The chasm (terrace 3)
- **Elements:** eyelets either side of a chasm: (166,12) and (174,12).
- **Solution (test):** stand at (173,12) facing west, Hookline: reeled over to (167,12). Walk to (158,8), up into the Belfry (158,7).
- **Mum:** by the door. Her lines are in her own manner (a "bairn" here and there).

#### After Knot 4
- The Belfry's exit lets Wren out on the Heights; the goal is "Home to Hollowell: it is the Knotting Festival." The way home is the way up (the Cliff Stair, the lake by raft, Millwater, the ferry or bridge, Meadowfold, the south road) unless a later shortcut is open. S23 is saved back in Hollowell.

#### Optional things on the Heights (details in 50_optional.md)
- The little cave on terrace 1 (157,28): a boulder asleep in its mouth, out of the shrine bell's reach: the Recall Bell (after the Belfry); a Heart Patch.
- The ringers' old bell (161,32): dumb until the clapper from the Old Fold is hung on it; then a strike wakes the cave's boulder before the Recall Bell.
- The Crags (131-152, 11-17), the Ringers' Stone: the Hookline across four ways (an eyelet, a mark the wind empties, a sleeper's empty mark, a pot's mark emptied by hand); a Heart Patch. The crag boulder is a puzzle sleeper: it lies down again (`resetSleep`). Sign: "The old bell-ringers crossed them for luck, and came back down the quick way."
- The Eyrie (183-188, 1-3): the draught drops a crate into the crevice; it pops home; cut loose with the Shears (much later) it fills it; a Heart Patch.

---

### Main-path gates in this part, in order (quick reference)

| # | Gate | Where | Needs | Opens | Test |
|---|---|---|---|---|---|
| 1 | Ceremony | Gran's house door | talk to Gran (`talkedGran`) | the Wanderstaff, free play | LEG1 |
| 2 | Tidyhouse door | Meadowfold (108,92) | nothing | House 1 | LEG1 |
| 3 | Canyon road boulder | Meadowfold (68,103) | the Gloves (pull it into the niche) | Kilnridge (`kilnPass`) | LEG2; headless check |
| 4 | Kiln forecourt gate | Kilnridge (22,96), door (22,93) | a pot in the vent's wet mouth (25,97), fired into the hole (25,99) | House 2 | kilnridge.test, LEG2 |
| 5 | Broken bridge | Meadowfold (113-118, 106-107) | the Hookline (east eyelet 119,107) | Millwater | LEG3 |
| 6 | Millwater ferry | (167,106) to (170,106) | nothing (wait for it) | Millrace Falls, House 3 | LEG3 |
| 7 | The lake | Wick's pier (146,95) to the North Shore (167,82) | the Paddle | the Cliff Stair | heights.test, LEG4 |
| 8 | Shrine boulder | Heights (140,29) | strike the shrine bell (142,31) | terrace 2 | heights.test |
| 9 | The Bluster | Heights (141-179, 20-26) | timing (lean into the gusts) | terrace 3 | heights.test |
| 10 | The chasm | Heights (166-174, 12) | the Hookline | the Belfry door, House 4 | heights.test |
| 11 | The festival | Hollowell square | Knot 4 (`d4`) | the east road goal | hub.test |

### Optional activities passed on the way (one line each; details in 50_optional.md)
- Miss Quill's quiz (school): 5 buttons, `quiz1`.
- Budging every townsperson (S01).
- The turned portrait at Gran's (Linnet's note 1; the Gloves).
- The kids' Housekeeper game round Otto's chalk X (S12; after Knot 1; the playground badge).
- The Tidiness Trials in the Inn's attic (S28; after Knot 1): three timed rooms, buttons, a Heart Patch, Ives's teal scarf.
- The town's favours (the Guild's crates after Knot 1; the kite after Knot 2; Mabel's tin after the Bell; Jory's back room and Rosa's saucer later).
- Thimble's Heart Patch (120 buttons) and the Hook pouch (after Knot 2).
- Returnball (S29; after Knot 4): carry the ball through all five rings, let it go; five on its way home wins Pip's Heart Patch. A throw cut short by leaving town scores nothing next time (review_d4).
- Every Heart Patch and Linnet note listed above under its region.

### Known accepted behaviour in these regions
- The canyon boulder goes home onto the road until the overworld is rebuilt (above): the Return, not a softlock.
- Ferries and rafts move on their own schedule; waiting is part of the design.
- The four latecomers at the festival and the townsfolk's knowing lines are deliberate clues, not continuity slips.
- Townsfolk going back to the same spots and the town "getting stiller" after each Knot (Hob, the children, Pudding) are intended.
- Signs say how things behave, never the step (POLISH finding 25).
