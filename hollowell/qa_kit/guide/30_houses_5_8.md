## Houses 5 to 8: the Slumberhouse, the Marionette Hall, the Spoolworks, the Loom

Conventions in this part:
- Rooms are 20x11 tiles; positions are room-local `(x,y)`, x from the west wall, y from the north wall. A House's
  cells are named by their grid key (`1,3` = column 1, row 3 of the House's map); the tests' origin tables
  (`const R = {...}` at the top of each test file) convert them to map tiles.
- Hearts: the game counts half-hearts (`Inv.hp`); "a heart" below is 2 points.
- Boss blows all follow one pattern (`src/20_enemies.js`): a tell first (pose, a two-note warning, red stitches where
  it will land), lasting `TELL[house]` frames in beat 1, 90% of that in beat 2, 80% in beat 3 (House 5: 26/23/21,
  House 6: 24/22/19, House 7: 22/20/18, House 8: 20/18/16). Stepping out of the marked tiles always avoids it.
  A downed boss takes `KNOCKS[house]` stick hits to topple (Houses 5-6: 2, Houses 7-8: 3); between them it thrashes,
  its reach drawn first (a ring hazard). Each beat knocked into drops a heart pickup (`bossHeart`).
- Fainting in any of these Houses (checked headless for all four bosses): Wren comes to at the House's entrance room
  with full hearts ("You come to by the door of the House", then a short notice on later faints). The House is built
  fresh: a boss or mini-boss not yet beaten is back at full strength (beat 1); keys, opened doors, chests, latched
  gates and dreamt rooms are area flags and are kept. The boss's intro is not replayed (its `..._awake` flag).
- Loading a save inside a House puts Wren at her mark (`Save.apply`): the doorway of the room she last entered by,
  or, if she lay in a bed or laid the Bedroll in this House, at that bed or Bedroll, which can be a different room
  from the one the catalogue line names (S26, S27, S31, S32 below).
- Leaving a House and coming back rebuilds it: everything marked is back on its mark, broken boards mend, sleepers
  sleep again, unless a flag says otherwise.
- Every House has "Back to the House's door" in the pause menu while inside (`tests/review_d5`, "a House's door is
  always in the pause menu").

---

## House 5: the Slumberhouse (`slumber`)

### Overview
- Doctor Mallow's House in Hushwood, lavender threads. Fifth House, after the festival and the giant on the east road,
  before Larkspur Fair. Files: `src/60_slumber.js` (rooms, the Long Way Home), `src/60b_slumber_foes.js` (the grate,
  Matron Hush, Mother Sloth), `src/58_bedroll_kit.js` (beds, crumbling boards, dreamcatchers, the Bedroll, Snorelings,
  sleep puffs, bouncy moss). Tests: `tests/slumber.test.mjs` (every room), `tests/longway.test.mjs` (the Pattern),
  `tests/bedroll_kit.test.mjs`, `tests/review_d5.test.mjs`, parts of `review_blind_cd`, `told_seen`, `scenes`.
- Getting in: the door (Hushwood 147,48) opens while a Snoreling sleeps in each of the garden's three cradles (see the
  regions part); once entered, `slumber_open` keeps it open.
- Grammar: your own mark. Lying in a bed makes that bed Wren's mark for the whole House (rooms don't move it); a fall
  onto your own bed or Bedroll costs nothing, so falls are travel. A flight home follows Wren's trace (loops erased),
  over anything that's gone since (crumbling boards). Dreamcatchers light when a flight passes under them.
- Tool: the Bedroll, from the mini-boss Matron Hush (the Landing). Tap the tool to lay it (one at a time; on a float it
  rides the float); hold the tool to go Homeward along the trace (from another map, straight to it); what Wren carries
  comes too. Tapped beside it, it rolls up. Rolled up, her mark is the room's doorway again, her thread drawn straight
  to it for a moment.
- Gives: the Sleeping Knot (d5), the Bedroll, a Heartstitch, the Plan, a Heart Patch (Mallow's Study), 50 buttons
  (the Dreaming Door), Mallow's Maker's mark (S06 signature).

### Save states
- S25 (the Night Porch, just inside).
- S26 (the Bedroll just got). Catalogue line says the Landing, but it loads **by the bed in the Drying Loft** (2,3)
  at (3,1), because Wren lay in that bed; keys 0, the Plan held. Walk: Loft N door → Laundry → Long Ward... (the ward's
  east and north locks are already open).
- S27 (before the boss). Loads **beside the Bedroll in the Long Ward** at (17,6), where it was laid for the Long Way
  Home. Pattern held, every door open, all three night-lights lit; walk N through the Landing's big door (already open).
- S28 (outside, after the Knot). Note: the Bedroll is still laid in Mother Sloth's room (15,5). Homeward from
  outside flies Wren straight back into the House.

### Map
```
 0,0 Pillow Fort      1,0 Mother Sloth (boss)   2,0 Milk Kitchen ===gate(bell)=== 3,0 Dreaming Door
   | lock C              | big door (Pattern)     | lock D        \ hole (4,10) drops into the Moonwalk
 0,1 Nursery ==shut== 1,1 Landing (Matron) ==shut== 2,1 Moonwalk
                         | lock B                   | laundry chute (bolted on the Laundry side;
 0,2 Linen Cupboard ---- 1,2 Long Ward ---- lock A -- 2,2 Laundry -- grate -- 3,2 Mallow's Study
                         | gate (lever)                 |                       (no door)
                      1,3 Night Porch (entrance)     2,3 Drying Loft
```
- Keys: A in the Linen Cupboard, B in the Drying Loft, C in the Moonwalk, D in Pillow Fort. Locks: Ward east
  (`lwLockE`), Ward north (`lwLockN`), Nursery north (`nuLock`), Moonwalk north (`mwLockN`). Keys are generic: any key
  opens any lock. The Landing's west and east doors are shutters that close only during the Matron fight.
- Pattern: the Long Way Home (its chest comes down in the Long Ward); opens the Landing's big door.
- Order: any order works and none strands the run (tracker; `longway` "the laundry chute ... whatever key went where").
  Key A must go on Ward east or Ward north. Spent on the north door first, the Laundry is still reachable later through
  the chute from the Moonwalk (its lever). Key C can skip the Nursery and the Fort (then optional). The Milk Kitchen's
  jug and the Dreaming Door are optional since the Long Way Home exists, but the Long Way Home goes through the Milk
  Kitchen, so lock D (the Moonwalk's north door) must be opened for it.
- Scripted route (S26/S27 flags): Night Porch, Linen (key A) → Ward east, Laundry (Plan), Drying Loft (key B) →
  Ward north, Matron (Bedroll), Moonwalk (key C, chute lever), Nursery (C used) → Fort (key D) → Moonwalk north,
  Milk Kitchen (bell gate), Long Way Home, Pattern, big door.

### Rooms

#### The Night Porch (1,3), entrance
- Idea: a bed is where you wake; boards give way; falls are travel.
- Elements: bed (3,6); a pit with one row of old boards across it (row 5, x 10-14) to an island with a lever (16,5);
  gate north (9,0) opened by the lever (`npLever`, once).
- Solution (`slumber.test` "the night porch"): lie in the bed (Action facing it from (4,6)); walk to (9,5) and step
  east over the boards to (15,5) (each gives way after Wren steps off it); pull the lever; walk back west: the boards
  are gone, she falls and flies home onto the bed, unhurt. Gate north open.
- Blocked: the Hookline is not reeled to a lever (`review_d5` L1: levers are no posts for the hook).
- State: `lever:npLever` (gate open for good); `bed_first`, `told:bedmark` flags; boards mend on landing from a flight
  home or on leaving the room.
- QA: the same fall without a bed costs a heart (`bedroll_kit` "without a bed").

#### The Long Ward (1,2), hub
- Elements: eight beds (rows 1 and 7); two Snorelings (8,3), (11,8); west door open, east (19,5) and north (9,0) locked;
  three night-lights on a brass rail over the north door (the linen's, the milk's, the wash's: W, N, E of the ward) and
  a sign about them; the Pattern chest (10,4), hidden until `slumber_longway`.
- Snorelings: woken by walking near them a while, they shuffle after Wren, then lie down in the nearest bed they can
  walk to. They keep to their own room: one following stops at the doorway Wren goes through and goes back to bed
  (`review_blind_cd` "Snorelings keep to their own room").
- Nudge (after 4 minutes): about walking back over your own steps erasing the thread.

#### The Linen Cupboard (0,2), key A
- Idea: one walk over the boards, planned before you start.
- Elements: crumbling boards (x 6-13, rows 2-8, with holes); three toggle plates ("lamps") at (8,3), (12,5), (7,7);
  gate (4,5) to the key chest (2,5), open while all three are lit (`keep`: stays open once opened); a bed (16,1);
  the linen's good dream over the north boards (10,3), its bad dream over the south ones (10,5); its night-light (13,0).
- Solution (`slumber.test`): lie in the bed; from (13,6) step (12,6), (12,5), (11,5), (10,5), (9,5), (9,4), (9,3),
  (8,3), (8,4), (8,5), (8,6), (8,7), (7,7): every lamp lit in one walk, no board trodden twice; the gate opens; step
  off into a hole and fall home to the bed (boards mend); take key A.
- Blocked: a wrong walk strands Wren on the boards; falling home mends them for another go (test "a wrong walk").
  Falling home also puts the lamps out (`review_d5` M1), so lamps can't be lit over several walks.
- State: `door:lcGate` and `chest:lcKey` kept. The lamps reset whenever Wren leaves the room (`Slumber.linenReset`).

#### The Laundry (2,2), the Plan
- Idea: the trace remembers a ride.
- Elements: a tub whose current runs down the west side (column 3), east along row 7, up column 16, west along row 2;
  the basket (a raft, `ldBasket`, patience 40 s) moored at (3,8); three dreamcatcher rings (9,7), (16,4), (9,2) for the
  Plan; the wash's good dream (6,2) and bad dream (12,7) for the Long Way Home; a sleeping washtub barrel by the grate
  in the east wall (barrel at (17,5), its home (2,5) in Mallow's Study); the laundry chute (7,0) north to the Moonwalk,
  bolted on this side ("Bolted, from the other side."); door south to the Drying Loft.
- Solution (Plan): board the basket from (2,8); paddle up into the current; ride it east along the bottom, up the east
  side and west along the top; step ashore onto row 1 before the loop comes round; drop into the water: the flight home
  retraces the ride and lights all three rings; the Plan chest (1,1) appears.
- Blocked: ride all the way round and the trace folds back on itself (loops erased): the rings stay dark (test "ride all
  the way round"). A dive that starts under a ring, or a Bell snap, doesn't light it (`review_d5` M2).
- QA: a basket left going round never stops; board it as it passes or ring it home. The grate stops any float with
  Wren aboard (test "the grate").

#### Mallow's Study (3,2), signature
- Idea: only the Bedroll can go first.
- Elements: no door; reached only through the grate; Maker's mark (10,5); desk with the case book; Heart Patch chest
  (16,2); water along the west edge.
- Solution (test "mallow's study"): stand on the barrel at (17,5), lay the Bedroll on it, step off south, ring the
  Bell from (15,9): the barrel (riderless) snaps home through the grate carrying the Bedroll; hold Homeward: Wren lands
  on it at (2,5) in the study. Read the mark (`sig:slumber`), open the chest.
- Way out (the room teaches it): a fall only brings Wren back to the Bedroll. Roll it up: her mark becomes the doorway
  she came into the Laundry by, her thread drawn straight to it; a drop into the water flies her straight there,
  through the wall (test "has no door out"). The pause menu's "Back to the House's door" also works.
- State: the barrel rung home without the Bedroll is asleep by the grate again next visit (`review_d5` H3).

#### The Drying Loft (2,3), key B
- Idea: the Hookline catches on an empty mark; the Bell is the wrong idea.
- Elements: a long drop over most of the room; an island (x 12-15, rows 8-9) with the key chest (15,8); a sleeping
  boulder lying at (6,2) whose own mark is out on the island at (13,8), empty while it sleeps; a bed (2,1); two
  Snorelings.
- Solution: lie in the bed; stand at (13,3) facing down and throw the Hookline: it catches the empty mark and reels
  Wren over the drop onto (13,8); take key B; walk off into the drop: home to the bed, unhurt.
- Wrong idea: rung awake, the boulder goes home over the drop and fills its mark; the hook then lands Wren in front of
  it, in the drop. Leave and come back and it lies down again at (6,2) (test "rung awake").
- Note: S26 loads here (by the bed).

#### The Landing (1,1), mini-boss: Matron Hush
- Elements: crumbling boards over the middle (x 5-14, rows 3-7); Matron asleep standing by her bed (1,8)/(3,9); big
  door north (9,0) with the three night-lights over it; shutters west, east and south close when she wakes; the
  Bedroll chest (9,8) appears when she's beaten.
- Fight (`slumber.test` "the landing"): she follows Wren's footsteps exactly. Walk up column 9 from (9,8) to (9,1) over
  the boards; they give way behind Wren; Matron, on the same steps, falls through, flies home and lies dazed by her
  bed (about 4 s). Walk round the edge of the boards (not over them) to her and hit her. Twice (`hp: 2`).
- Her move: every 4 s she stops dead and puffs up (a "!", shiver, tell 26 frames), then comes on along the footsteps
  at double speed for a second. Contact costs half a heart, a lunge contact a full heart. Struck while not dazed:
  "too starchy!", no damage.
- Leaving mid-fight (flying home to a bed elsewhere): she goes back to bed, the doors open.
- Defeat: she unravels into lavender yarn that rolls under her bed (stays until the line is read: `told_seen`). Flag
  `slumber_matron`; the Bedroll chest appears. Her intro is said once (`matron_met`).

#### The Nursery (0,1), lock C's room (opens to Pillow Fort)
- Idea: Homeward carries.
- Elements: a row of pits across the room under the north door (row 2); a ledge (row 6, x 2-9) dropping into a walled
  playpen; a stray toy block (4,8), unmarked, too big to throw; a narrow hole (8,9) in the playpen floor; lock north.
- Solution (test "the nursery"): lay the Bedroll at (8,3); from (4,5) drop down the ledge; pick up the toy; Homeward:
  back to (8,3) holding it; face north and set it down: it drops into the pit at (8,2) and fills it for good. Through
  the lock.
- Blocked (`review_d5` H2): the toy won't go down the narrow hole (too big) and can't be pushed into it; carried out of
  the Nursery it "wriggles free and bounces off back to the Nursery" (toast). Without the Bedroll the narrow hole drops
  Wren out of the playpen (the toy stays). Once it has filled the pit it never turns up again (H2b).
- State: `fill:8,13` (the filled tile, map coordinates) and the toy removed for good.

#### The Moonwalk (2,1), key C; the chute lever
- Idea: Homeward is quicker than walking.
- Elements: a gated nook (gate (2,3)) holding the key chest (2,1); the plate (17,9) with a wooden block beside it (16,9)
  at the far corner; lock north (15,0) to the Milk Kitchen; a lever (8,9) by the south wall that draws the laundry
  chute's bolt; the chute itself (7,10) down to the Laundry.
- Solution: lay the Bedroll at (2,4) by the gate; push the block onto the plate (gate opens while it's there); Homeward;
  through the gate before the block goes home (it latches once passed: `slumber_mwGate`); key C.
- Blocked: walking back from the plate is too slow (test "walking back"). A save loaded with the Bedroll on the
  block's home never leaves Wren inside the block (`review_d5` H1).
- The lever: pulled, the camera goes to look at the chute opening (out of sight); the Laundry is then always reachable
  from here (`lever:mwChuteLever`, `door:ldChute`).

#### Pillow Fort (0,0), key D
- Idea: bait (a Snoreling sleeps in any bed going).
- Elements: the keep's gate (9,4) with the key chest (9,2), open while the plate (16,8) is held; two Snorelings.
- Solution: lay the Bedroll on the plate; walk to and fro near a Snoreling (around (15,3)-(18,3)) till it wakes and
  follows; walk off; it gives up and lies down on the nearest bed, the Bedroll, holding the plate; key D.
- State: a Snoreling asleep on the Bedroll is forgotten when the place is rebuilt (`review_d5` M4). An old save that
  found the Pattern here finds key D in a new chest (tracker; test "an old game").

#### The Milk Kitchen (2,0), the gate to the Dreaming Door (optional since the Long Way Home)
- Idea: Kiln (a broken pot flies home the way it was carried) plus Homeward carrying.
- Elements: a gap the full height of the room (x 5-13); two rows of old bedsprings sprung one way only, west (row 4
  and row 7, three tiles a hop); the milk jug (2,2) on the far (west) side; a little bell (9,4) over the middle of the
  gap above the upper springs, out of throwing range; gate east (19,5) opened by the bell; a hole in the far bank's
  floor (4,10) that drops into the Moonwalk (landing at Moonwalk (4,4), not in the gated nook); the milk's bad dream
  over the upper springs (12,4), its good dream over the hole (4,10).
- Solution (test "the milk kitchen"): lay the Bedroll on the near side (15,6); spring across from (15,4) (land at
  (2,4)); pick up the jug; Homeward with it: its trace runs back along the flight, under the bell; smash it (Action to
  throw/drop it): its pieces fly home along that trace and ring the bell; gate east.
- Blocked (test "the springs only go one way"): no way back on foot; thrown from the far side it falls short; smashed on
  the far side its way home never crosses the gap; a fall drops it and it goes home; crossed on the lower springs its
  pieces pass under the lower row and miss the bell.

#### The Dreaming Door (3,0), 50 buttons (optional)
- Idea: Belfry (the Bell rung in mid-flight) plus the trace; the door opens while its good dream is lit and its bad one
  dark.
- Elements: door (2,3) to a chest (2,1) of 50 buttons; old boards from (5,8) east along row 8, up column 17, west along
  row 2 to an island (x 5-7, rows 1-2); the bad dream (6,8) near the start, the good one (10,2) near the end (each lit
  300 frames).
- Solution A (test "the dreaming door"): Bedroll at (2,4); walk the boards out to (6,2); Homeward: the flight passes the
  good dream first, the bad one last (door shut); walk out again, Homeward, and ring the Bell after the good one lights:
  Wren snaps straight home before the bad one; door open; flag `s18` (the Bell rung in flight).
- Solution B (longway, last test): lay the Bedroll on the bottom boards a couple of steps past the bad dream, e.g.
  at (9,8), and roll it up there (her thread is drawn straight from there to the doorway); walk on to the island and
  fall: the flight comes home under the good dream, then straight to the door. Rolled up right beside it at (7,8), the
  straight thread clips the bad dream and the door stays shut.
- Blocked: Bell rung too soon: nothing lights; the boards mend on landing (test "rung too soon").
- State: the chest held the Pattern before the Long Way Home existed; a save that took it here keeps it and the Long
  Ward's chest then gives 20 buttons.

### The Long Way Home (the Pattern; `src/60_slumber.js` `Dreams`, `tests/longway.test.mjs`)
- Rule: three rooms each hang a good dream and a bad one over a way they already have (Linen Cupboard: good over the
  north boards, bad over the south walk that lights the lamps; Laundry: good over the top of the tub near the west
  side, bad over the bottom where the current goes first; Milk Kitchen: good over the hole in the far bank, bad over the
  upper springs). A flight home that passes a room's good dream and not its bad one "dreams" that room for good: its
  night-light comes on (in the room, and one of the three over the ward's north door and the big door). All three good
  dreams on **one** flight, and none bad: `slumber_longway`, the Pattern chest comes down in the Long Ward (the camera
  goes to look if Wren landed elsewhere).
- Why it's hard (intended): the Linen Cupboard and the Laundry are dead ends off the ward, and walking back over a
  doorway erases everything since. The only way is a loop that never crosses itself.
- Intended route (test "the long way home", from the Bedroll laid at Long Ward (17,6)):
  1. Ward (18,6), (18,5), out east (19,5) into the Laundry (0,5); down to (1,8), (2,8), onto the basket (3,8).
  2. Paddle up the west side against the current to (3,2), then east along the top to (6,2) (under the good dream);
     ashore at (6,1).
  3. (7,1), up the chute (7,0) into the Moonwalk (7,10); north up its east side (7,8) → (15,8) → (15,0) into the Milk
     Kitchen (15,10).
  4. North to (15,7); spring west on the **lower** springs (land (2,7)); (3,7), (4,7), (4,8), (4,9); down the hole into
     the Moonwalk, landing at (4,4).
  5. West (3,4) → (0,5) into the Landing (19,5); round the bottom of its boards (18,8) → (10,8), (10,9), (9,9), out
     south (9,10) into the ward's north door.
  6. Across the top of the ward: (9,1) → (9,4) → (1,4), (1,5), out west (0,5).
  7. Linen Cupboard north walk: (19,5) → (14,5), (14,6) → (11,6), (11,5), (11,4), (11,3), (10,3), (9,3), (8,3).
  8. Hold Homeward. The flight (about 7 s, a moment in each room) lights the linen's, the milk's and the wash's good
     dreams in that order and lands on the Bedroll; Pattern chest at (10,4); the big door opens with it.
- Alternatives that work: any bed as the place instead of the Bedroll (from the Drying Loft's bed, up into the Laundry,
  round, and a fall in the Linen Cupboard: test "nothing special-cased"); the wash's good dream can also be had by
  boarding the basket (left going round since an earlier ride) from the bottom bank past the bad dream (x 13, row 8) and
  riding with the current over the top (last-but-two test).
- Blocked or no effect:
  - three separate flights each dream one room and light all three lamps, but give no Pattern (the third lamp says so:
    "All three burn now, each on its own"; the lamps hang apart; a gold thread joins them only for one flight);
  - the usual routes light the bad dreams (lamps lit the usual way; riding with the current; crossing on the upper
    springs): the lamp gutters red;
  - a folded route (stepping back onto the way out) cuts the thread: only what came after the fold lights, and the
    lamps over the ward door show which;
  - rolled up, the Bedroll is no way round (each room's door is home again; a fall comes home only through its room).
- State: `dream:linen`, `dream:kitchen`, `dream:laundry` area flags kept through rebuilds and saves; `slumber_dreamt`
  (first one), `slumber_longway`. A save holding the Pattern already gets 20 buttons from the ward's chest.
- QA: while the Bedroll is laid in this House, Wren's thread back to it is drawn faintly as she walks; a step back onto
  it shows the dropped loop pale and fading (`review_blind_cd`). A dreamcatcher on a flight's second tile is caught
  however close Wren stood to it on the first (same file). The flight through one room is as quick as ever (at most
  about 110 frames); through several, a moment in each, never faster than a few pixels a frame (`longway` "timed").

### Boss: Mother Sloth (1,0), the Sleeping Knot
- Room: open floor x 1-17, rows 1-9; her four-poster at the top middle (9,2); a ring of stars in the carpet: an arm
  stretched further than 5.75 tiles from its shoulder snaps (`SLOTH.SNAP`); reach 5.25. Shutter south closes when she
  wakes (Wren entering above the bottom two rows). `hp 3`, one per round, two knocks each.
- Her rule all fight: a hand rises and spreads its fingers (tell 26/23/21), then the arm reaches; caught, Wren is
  reeled to the bed and tucked in (a heart) unless she flies out of reach first. Both arms snapped: she slumps; knock
  her nightcap (stand at (9,6), strike up) twice.
- Round 1: lay the Bedroll out past the stars (the test uses (2,9)); stand in reach (9,6); when caught, hold Homeward:
  the arm stretches past the stars and snaps. Twice (one per arm). Knock.
- Round 2: she thumps the bed; the floor out past the stars drops into the dark except a row of old boards along the
  bottom (row 9). A Bedroll lying out there falls back into the pack (said after her lines). Now nowhere to lay it is
  out of reach, but the flight follows the trace: lay it inside, by the boards (5,8); walk out over the boards and back
  in ((5,9) → (8,9), (8,8), (8,7)); when caught, Homeward goes back over the gone boards: snap. The boards mend when
  Wren lands. Second arm: a longer loop ((5,9) → (13,9), (13,8), (12,8), (12,7)). Knock.
- Round 3: the boards drop too; four old bedposts stand in the dark ringed with brass (eyelets at (1,7), (3,9),
  (15,9), (17,7)). Homeward does nothing. Caught in line with a post, turn about in her grip (a tap of the direction)
  and throw the Hookline at it: the reel drags Wren out of her hand (snap) and she drops into the dark and flies home to
  the Bedroll unhurt. Test: Bedroll at (9,6); caught at (3,5) facing up, turn down, hook the post (3,9); the other arm
  from (15,5). Knock: she unravels.
- Her other blows: out of reach she lifts pillows over her head (one, two, three per round) and throws them (half a
  heart each); in round 3 she counts sheep: a row of the floor glows, then a flock bounds along it, over the dark too
  (a heart; never the row she is holding Wren on).
- Leaving: flown out of the room (to a Bedroll elsewhere) the fight waits: arms grown back, doors open, floor restored;
  back in, the same round starts again on its own floor (test "fly home to a Bedroll outside her room").
- Blocked: Homeward to a Bedroll inside her reach does nothing (she holds on and tucks Wren in); an arm snaps only out
  past the stars (flown across to the far side of the other arm, it holds).
- Pace: the whole fight takes a scripted bot well under 90 s (`slumber.test` asserts < 90; tracker: about 50 s for a
  player who never hesitates).
- Defeat: she lets go, unravels into yarn that drifts down; the floor comes back board by board while that's told; the
  bedposts go. Flags `slumber_boss`, then the Knot hoop and the Heartstitch. Tying the Knot (`afterKnot`): `d5`, goal
  "Home to Hollowell. (Somebody at the clinic will want to hear all about it.)", every bed in the House creaks, and an
  exit tile (3,9) appears in the boss room out to Hushwood.
- QA: she is drawn asleep (eyes shut) while she talks in her sleep (`scenes`). What each round's sentence names (the
  boards, the bedposts) is clear of the box (`told_seen`).

### Known accepted behaviour (House 5)
- The fifth House's thread is drawn only while the Bedroll is laid here (finding 55), and not in other places
  (`review_blind_cd`).
- Signs say how things behave, never the step (the Moonwalk's and Pillow Fort's rewritten; finding 25, 39;
  `hushwood` "nobody gives the step away").
- The Laundry can be done before the Bedroll; it needs no change (finding 40).
- No Bedroll on stairs (`review_d5` L2).
- The rolled-up Bedroll's straight flight to the doorway is a rule (taught in Mallow's Study), not an exploit
  (finding 40).

---

## House 6: the Marionette Hall (`marionette`)

### Overview
- Jory's House at Larkspur Fair, crimson threads. Sixth House, after Hushwood and the leap into the fair, before
  Reveal 1 and the Underside. Files: `src/63_marionette.js`, `src/63b_marionette_foes.js` (soldiers, flats, Captain
  Tin, the Great Marionette, the stage trap), `src/61_crossbar_kit.js`, `src/64_reveal1.js`. Tests:
  `tests/marionette.test.mjs`, `tests/review_d6.test.mjs`, `tests/crossbar_kit.test.mjs`, parts of `told_seen`.
- Getting in: the portcullis in the fair's forecourt (regions part); `hall_open` once entered.
- Grammar: remote bodies. Toy soldiers march straight and turn at anything in their way (about-turn, or turn right);
  they weigh on plates as they pass; the stick only turns them round. Painted flats stand in for walls until knocked
  down (one hit).
- Tool: the Crossbar, from Captain Tin (the Wings). Tool at a puppet in sight (same room, the side Wren faces, up to 8
  tiles) takes its strings; Wren stands still; arrows walk it a tile at a time; tool or Action lets go and it walks home
  after its patience. Puppets weigh on plates, fit through little holes in walls (tile kind `crawl`), don't mind spikes,
  won't walk off an edge. A rack works several puppets together, the leading ones first, each that can. Rack puppets
  are worked only from their rack; walls block sight (`review_d6` 4).
- Gives: the Dancing Knot (d6), the Crossbar, a Heartstitch, Reveal 1, the Plan, a Heart Patch (S13), Jory's mark and
  50 buttons.

### Save states
- S30 (the Foyer). The Bedroll is still laid on the high mesa in Kilnridge (from the leap).
- S31 (the Crossbar just got). Loads **beside the Bedroll in the Rehearsal Room** at (5,4), not in the Wings; keys 0.
- S32 (before the Great Stage). Also loads **in the Rehearsal Room** by the Bedroll; Pattern held, big door already
  open, one spare key. Walk: Rehearsal Room west → Auditorium → north lock (open) → Wings → north.
- S33 (outside, after the Knot and the reveal). The Bedroll stays in the Rehearsal Room in every later catalogue save
  (S33-S58): Homeward from anywhere flies Wren straight back to it.

### Map
```
                      1,0 Great Stage (boss)      2,0 Jory's Workshop
                         | big door                 | gate (puppet plate inside)
 0,1 Dressing Rooms ==== 1,1 Wings (Tin) == gate == 2,1 Prop Store == gate == 3,1 Fly Tower
                         | lock               (Tin falls)          (3 plates)    | gate (3 timed plates)
 0,2 Orchestra Pit ----- 1,2 Auditorium -- lock -- 2,2 Rehearsal Room == gate == 3,2 Trap Room
                         |                                 (opens from the Trap Room once the Pattern is had)
                      1,3 Foyer -- flat -- 2,3 Box Office
```
- Keys: A (Orchestra Pit), B (Rehearsal Room, needs the Bedroll), C (Dressing Rooms, needs the Crossbar). Locks:
  Auditorium east (`auLockE`) and north (`auLockN`): one key spare whatever the order.
- The Wings' east gate opens when Tin falls (`flag:marionette_tin`), so no key order can shut the Rehearsal Room for
  good (`review_d6` 2). The Rehearsal Room's east gate (`rhGateE`) opens once the Pattern is had, from either side
  (bolted till then: test "the trap room's way west").
- Late House: Wings → Prop Store → Fly Tower → Trap Room (Pattern) → back west through the Rehearsal Room →
  Auditorium → Wings' big door.

### Rooms

#### The Foyer (1,3), entrance
- Elements: two toy soldiers (3,3) marching right and (16,7) marching left; the east wall at (19,5) is a painted flat
  (it wobbles when soldiers pass); the north door to the Auditorium is open; a poster ("STARRING YOU").
- Solution: knock the flat down with the stick (from (18,5)); through to the Box Office.
- QA: tin soldiers shrug off the stick: a whack only turns them round (`review_d6` 3b).

#### The Box Office (2,3), the Plan
- Behind the flat: the Plan chest (10,3); the ledger ("Cast: one. Crew: six. Audience: the crew"); old playbills.

#### The Auditorium (1,2), hub
- Seats (solid rows), a soldier on the aisle; west open (Orchestra Pit), east and north locked.

#### The Orchestra Pit (0,2), key A
- Idea: shape a soldier's beat.
- Elements: the drummer (5,9) marching round the edge, turning right at every wall; a pulse plate (9,6) (each footfall
  opens the gate a moment, 80 frames); the gate (2,3) into a nook with key A (2,1); a stray block (10,2), unmarked.
- Solution (test "the orchestra pit"): left alone he never touches the plate; push the stray block down two tiles to
  (10,4), into the top of his beat: he turns down early across the plate; wait at (3,6) by the gate and slip through as
  it opens; key A.
- Blocked (`review_d6` 3): Wren on the plate opens it only a moment (shut again before she reaches it); the stray
  pushed onto the plate gives one pulse, not a held gate. Only the drummer, passing repeatedly, holds it often enough.

#### The Rehearsal Room (2,2), key B
- Elements: a one-way ledge (row 6) dropping into the under-stage (rows 7-9); the key chest (5,8) down there; a hole
  (9,9) in the under-stage floor; the prompter's box (a script with lines Wren hasn't said yet); a rack (15,9) and a
  little wooden Wren puppet (13,7) for the stage set; the set's mark plate (16,4, puppets only); a hidden Heart Patch
  chest (17,6) that appears with `s13`; the east gate (19,8) to the Trap Room.
- Solution (test "the rehearsal room"): lay the Bedroll at (5,4); drop through the trapdoor row to (5,7); take key B;
  Homeward back up. (Or the hole in the under-stage floor, which hurts.)
- S13 (optional secret): take the rack from (15,8) facing down and walk the little Wren `UUURRR` onto the set's mark:
  a bow, `s13`, and the Heart Patch chest. Wren standing on the mark does nothing (`review_d6` 5).

#### The Wings (1,1), mini-boss: Captain Tin
- Elements: two flats (4,6) and (15,6) that spring back up; trapdoors (pits) just behind each, at (2,6) and (17,6);
  shutters south, west, east; the big door north (Pattern); the Crossbar chest (9,3) appears when he falls.
- Fight (test "the wings"): he marches between the flats, about-turning at each. Stand above a flat (4,5); as he comes
  toward it (marching left), knock the flat down (strike down): he marches on into the trapdoor behind it and lies
  dazed; step to (2,5) and hit him. The flats spring back up. Twice (`hp 2`).
- His move: he twirls his baton overhead (a "!", its line lit; tell 24+4 frames), flings it along that line, and it
  comes home along its thread: a heart each way. Contact half a heart.
- Defeat: he salutes, falls over backwards and unravels into crimson yarn that drains down a crack (kept until the line
  is read: `told_seen`); `marionette_tin`; the east gate opens; the Crossbar chest.

#### The Dressing Rooms (0,1), key C
- Idea: the Crossbar: little holes and spikes.
- Elements: a puppet (2,7); three little holes in the walls (`O` at (2,4), (4,2), (15,2)); nails (spikes) at x 9-10,
  rows 1-3; the plate (17,2); key C chest (10,7), shown while the plate is down.
- Solution (test): from (2,9) facing up take the puppet; walk it `UUUUU RR RRRRRRRRRRRRR` (up through the hole, along,
  over the nails, through the far hole) onto the plate (17,2); the chest shows; let go; take key C from (9,7).
- Blocked: Wren can't go through a little hole herself; a puppet won't walk into a pit (`crossbar_kit`).

#### The Prop Store (2,1), the way east
- Idea: a rack (several puppets in step).
- Elements: three puppets (5,2), (5,4), (5,6) on one rack (9,8); shelves in the store's middle; three plates (7,6),
  (9,6), (13,6); the east gate (19,5), open while all three are down, then for good (`keep`); a lone puppet (2,3) and a
  little hole (2,0) in the north wall to Jory's Workshop; the workshop gate (17,0).
- Solution (test): take the rack from (9,9) facing up; `RRRRRRRR`: the shelves stop the leading puppets at x 7 and 9,
  the wall the last at 13; `DDDD`: all three on the plates; the gate opens and stays open.
- The rack can't be hooked (`hookable: false`). Puppets going home don't block each other forever (`review_d6` 8).

#### Jory's Workshop (2,0), signature
- Solution (test): take the lone puppet from (2,5) facing up; `UUUUUU` through the little hole in the Prop Store's
  north wall onto the plate (2,8) inside: the workshop door (17,0) opens for good. Inside: Jory's mark (10,5)
  (`sig:marionette`), 50 buttons (16,5), the half-carved face ("FOR THE LAST ACT. (NOT YET.)"), the puppets of every
  boss.

#### The Fly Tower (3,1), the way south
- Idea: Belfry (a ring snaps things home fast) + Tidyhouse (plates pressed in passing) + Kiln (the trace, loops erased).
- Elements: a walled catwalk (x 5-9, rows 3-7) round the fly well; the puppet (5,5) on a one-string rack (3,5)
  (no sight needed); three timed plates on the catwalk (7,3), (9,5), (7,7), each down 36 frames; the fly door (14,10),
  open while all three are down at once, then for good.
- Solution (test): take the rack from (2,5) facing right; walk the puppet `UURRRRDDDDLLLLU`: right round the catwalk
  to one short of its stand (5,6), its trace over all three plates; switch to the Bell and ring: it snaps home along
  its trace over all three at once; the door opens.
- Blocked: walked round, it's on one plate at a time (shut); let go, it walks home over them too slowly (shut); out to
  the far plate and back the same way erases the loop and the trace skips a plate (test "the fly tower's rule").

#### The Trap Room (3,2), the Pattern
- Idea: Kiln (the Hookline latches onto an empty mark) + the Return's patience.
- Elements: every trapdoor open (rows 3-7) between the near side (rows 1-2), an island (x 8-10, row 5) and the far side
  (rows 8-9); two understudies on one rack (10,2) standing on their stands (marks) at (9,5) on the island and (10,8) on
  the far side; the Pattern chest (14,9) on the far side; their patience 7 s, with a ring round each empty stand
  unpicking (finding 38).
- Solution (test "the trap room"): the hook bounces off a puppet on its stand. Take the rack from (9,2) facing right,
  `LLL`: both step off their stands to the left; switch to the Hookline, face down from (9,2): reeled onto the island's
  empty stand (9,5); step right to (10,5), hook down: onto the far stand (10,8); the Pattern; the Rehearsal Room's east
  gate unbolts.
- At a person's pace (second test): let go, wait 2.5 s, change tools, aim: both stands are still empty.
- Blocked: stepped to the right instead, the island's understudy stands in the line to the far stand (test "stepped the
  wrong way"); fall in: home to the doorway. An understudy starting home as Wren is reeled onto its stand waits behind
  her, never on her tile (finding 38; test "whatever the timing").
- State: an old save that already had the Pattern gets 20 buttons here.

### Boss: the Great Marionette (1,0), the Dancing Knot, then Reveal 1
- Room: open stage, rows 1-9; the apron (rows 8-9) is past the end of its strings. Its marks are (7,5) and (12,5);
  its feet block; the stage trap at (11,6) holds a person or a puppet and drops open under anything heavy (a sandbag, its
  foot), then shuts once empty. `hp 3`: one per act, two knocks each. The rack (9,8) with two little Wrens (3,6), (9,6).
- Act I: it dances on its marks. Take the rack from (9,9) facing up; walk the two little Wrens right round its feet:
  test moves `URRR URRDDLLU`: both strings tangle, it falls; let go; knock its head from (8,8).
- Act II: a sandbag drops through the trap to show it (the little Wrens whisked home); it marches round its stage
  (rows 5-7) like a toy soldier, turning right at anything in its way (the wall, a puppet), stamping on Wren if she's on
  its beat (it turns at things, not people). A third little Wren (`gsWrenC`) on its own string comes down on the apron:
  take it from (16,9) facing up and walk it into the march where the turn takes a foot onto the trap: test `RUUU` to
  (17,5) (or `LLLLUUU` to (12,5); tracker also names (10,7) or (5,7) along the front, unverified). Down the trap: knock
  from (11,7).
- Act III: back on its marks, strings slack (a string wound round its feet slips off: the Act I trick does nothing);
  its control bar hangs low but out of reach (the Crossbar from the boards does nothing). Hookline from (11,7) facing
  up brings the bar down in front of Wren; the Crossbar (facing up) takes its strings like a rack's; walk it `LD` onto
  the trap: down; knock. Hooked and not taken, the bar is hauled back up; taken and let go, it walks home to its marks.
  On its strings it won't step into the trap while it's open, but the trap is shut until it's on it.
- Its blows: sandbags out of the flies where Wren stands, shadows first (one in act I, two in II, three in III; a hit
  makes her let go of the strings); act I its stick swept along the lit boards close in front of its feet; act II the
  stamp; act III battens along lit rows (never the row she's working its strings from). All a heart. Tells 24/22/19.
- Leaving mid-fight (Homeward to a Bedroll in the Wings): it waits; back on the stage it takes up the same act
  (test "leaving mid-fight"). A faint rebuilds it at act I.
- Pace: a scripted bot takes about 23 s of game time (tracker).
- Defeat and Reveal 1 (`src/64_reveal1.js`): it folds up; the curtain comes down on it in a red heap; "Oh, BOTHER."
  from the flies; Jory comes down in a bosun's chair; the other five Makers (Ives, Bram, Ambrose = Dad, Tess = Mum,
  Mallow) come out of the wings and line up across row 7. Goal: "hear each of them out (n of 6)": walk to each and talk,
  in any order. When all six are heard, Jory: the last part of a Wander is learning to make one; the Inn's Staff door is
  open. They all look up at once; Tess: "Tie your Knot, love." Flags `marionette_boss` and `reveal1`; the Makers leave;
  the hoop (15,6) and the Heartstitch (4,6) appear; toast "Hints (in Options) now come from the Makers themselves."
  Tying the Knot: `d6`; six faces peek down from the flies; goal "Hollowell: the Inn, and the door marked STAFF ONLY."
- Saves (`review_d6` 1, 1b): the hoop, the heart and the reveal are never lost by leaving or loading before the Knot.
  `marionette_boss` is only set when the reveal ends, so a reload in the middle of the curtain replays the fight
  ("the dance again"), not a lost reveal. Intended.

### Known accepted behaviour (House 6)
- The Crossbar racks' strings are drawn like every thread, fully only with the Crossbar in hand (finding 75).
- Multi-tile set pieces (the Auditorium's seats) are drawn centred over their tiles (finding 21); nothing to report.
- Jory's face behind the crossbar was fixed (finding 81); people in the reveal's line-up are clear of strings
  (finding 78).

---

## House 7: the Spoolworks (`spoolworks`)

### Overview
- The Guild's own works under the Guild Hall (Gundry's; umber thread). Not one of the Wander's Houses: no Knot.
  Seventh House, after Reveal 1 and the first trip to the Underside, before the Makings. Files:
  `src/67_spoolworks.js`, `src/67b_spool_foes.js` (Cog, the Tangle), `src/65_spool_kit.js` (the two layers, cords,
  knots, counterweights, the Needle). Tests: `tests/spoolworks.test.mjs`, `tests/spool_kit.test.mjs`,
  `tests/review_d7.test.mjs`, parts of `review_blind_a`, `review_blind_d`, `review_blind_cd`.
- Getting in: the big door north of the Guild Hall (Underside (29,0)), open after Reveal 1.
- Grammar: every room is two. The Works floor up top and, 33 rows below, the Under-works, joined by hatches (a trapdoor
  up top, a ladder below; something standing where you'd come out keeps the trapdoor shut). Each Under room is reached
  only through its own trapdoor (`review_d7` 1). Below, the room above shows through faintly, and a cord hangs under
  every **mark**: tap Action for a tug (whatever it holds snaps home; at home, it jumps); hold Action to tie it off
  ("Tied off: held fast up above.": no pushing, pulling, lifting, going home, stepping with a rack; the Hookline bites
  into it like a post); Action on a knot undoes it. Counterweights: heavy weights on plates below; what's above answers
  to the plate.
- Tool: the Needle, from Cog. Face a thing (or its cord from below); tool; walk the needle up to 4 tiles from the
  thing (four steps, round walls, never over a hole or onto Wren; every reachable tile stitched round faintly); tool:
  that's its place now, for good (kept when the place is rebuilt; its cord moves with it). Three stitches at a time; a
  fourth undoes the oldest (a notice says what and where); a stray can be given a place; the Needle on a stitched thing
  offers to unpick it. Too far off, it says so. The first thing in line within four tiles is marked at its corners.
- Gives: the Needle, the Pattern, the Plan, a Heartstitch, Gundry's mark and a Heart Patch, the apprenticeship (`d7`).

### Save states
- S35 (the Gatehouse).
- S36 (the Needle just got): loads at the Kennel's doorway (9,7)... the catalogue's "doorway Wren came into The Kennel
  by"; keys 0; the Plan held.
- S37 (before the boss): the Winding Hall, west doorway (1,5); Pattern held, the big door already open.
- S38 (after): the Guild Hall, Gundry has a job.

### Map
```
Works floor (up top)                                    Under-works (33 rows below each)
 0,0 Bobbin Loft   1,0 Heart (Tangle)  2,0 Gundry's Bench    0,3 U.Loft   1,3 U.Heart (hoist weight)  2,3 U.Bench
   | gate (out)       | big door          (ladder up only)      | lock (Ropewalk key)               | open
 0,1 Spool Store == gate == 1,1 Winding Hall == lock == 2,1 Kennel   0,4 U.Store  1,4 U.Winding (counterweight)  2,4 U.Kennel
   | gate (after Ropewalk key)  |                 | shutter + weight
 0,2 Ropewalk == gate == 1,2 Gatehouse == gate == 2,2 Practice Floor   0,5 U.Ropewalk  1,5 U.Gatehouse  2,5 U.Practice (rack)
                           | exit to the Underside
```
- Trapdoors (up top) / ladders (below): Gatehouse (16,7); Winding Hall (17,7); Spool Store (15,5) facing right;
  Kennel (9,7) and Under the Kennel (17,8) (Under the Kennel joins Under Gundry's Bench to the north, whose ladder
  (9,5) is the only way up to the Bench); Practice Floor (3,7); Ropewalk (15,7); Bobbin Loft (9,7) / Under the Loft
  (9,8); the Heart (2,7).
- Keys: the Spool Store's key and the Ropewalk's key. Locks: the Kennel (`swLockE`, any key) and Under the Spool
  Store, north (`usLock`), which takes only its own spare key, the Ropewalk's (`spare: 'rwKey'`; the Spool Store's
  key won't turn it and says so). Pattern: the Heart's big door.
- Order (the only one): Gatehouse → Winding Hall (Under: the counterweight) → Spool Store (key 1; the Plan below) →
  Kennel lock → Cog (Needle) → Practice Floor (through the weight in the doorway) → Gatehouse east door → Ropewalk
  door (key 2) → Spool Store's south door → Under the Spool Store → north lock → Under the Loft → the Loft (Pattern) →
  the Heart. Gundry's Bench is optional (after the Needle).
- Old saves (`review_blind_a`): one that spent the first key on the Loft's lock (it once took any key) gets the
  Kennel's lock let go instead when the Works is built, and can finish.

### Rooms

#### The Gatehouse (1,2) / Under the Gatehouse (1,5): the way in
- Idea: two layers; untie.
- Up top: a crate (13,3 home) sits in the passage's mouth at (9,3), tied off from below ("It won't budge. Not a quiver.
  Something is holding it fast from underneath."); side doors: east (19,5) to the Practice Floor (open while both its
  plates are down, then for good once passed), west (0,5) to the Ropewalk (opens once the Practice Floor's door has been
  passed: `paDone`).
- Solution (test): down the trapdoor (16,7); below, stand at (13,4) facing up (under the crate's mark) and press Action
  on the knot: untied, the crate goes home east out of the passage; back up; north to the Winding Hall.
- Below: the sign that teaches tug / hold to tie / Action on a knot to undo; a spoolmite.
- State: `untied:gaBlock`: an untied knot stays untied when the place is rebuilt (`review_d7` 9).

#### The Winding Hall (1,1) / Under (1,4): the Spool Store gate
- Idea: counterweights + a ring heard seven strides off (Belfry).
- Up top: west gate (0,5) to the Spool Store, open while its weight below is off its plate (`!hw1`; latched once passed);
  east lock to the Kennel; the big door north; the great winder; spoolmites.
- Below: the counterweight on its plate (12,5); a sleeping boulder lying across the room at (3,1) whose own place is
  (13,5), right beside the plate (it can't be pushed or pulled).
- Solution (test): push the weight east twice to (14,5), past the boulder's place; go across the room to (4,2), out of
  the weight's hearing, and ring the Bell: the boulder is home in a flash, in the weight's way home; the weight waits
  behind it; the gate above is open; up and through (it latches once passed: `door:swGateW`).
- Wrong order (test "rung awake first"): rung first, the boulder lies home beside the weight in nobody's way; the
  weight can't pass it (one push only to (12,5)... it stays); up and back down, the boulder sleeps again. Once it holds
  the weight off, it stays awake (`spool_cw`).

#### The Spool Store (0,1) / Under (0,4): key 1; the Plan
- Idea: tie off.
- Up top: a block (15,3) and the plate (15,6) that holds the gate (4,2) to the key chest (2,2); the south door (4,10)
  to the Ropewalk, shut from this side until the Ropewalk's key is taken (`rwOut`); the north door to the Bobbin Loft
  (opens from the Loft's side).
- Solution (test): push the block down three to the plate; down the trapdoor (15,5, facing right); below at (15,4)
  facing up, hold Action on its cord (under its mark (15,3)): tied off, it stays on the plate; the Plan chest is below at
  (5,8); back up; through the gate; key 1.
- Blocked: running for the gate is too slow, and the gate never shuts on Wren once she's through (`review_d7` 2).
  A thing with the Needle in it waits (doesn't go home mid-stitch) (`review_d7` 6).
- Below, north: the locked door (2,1) to Under the Loft ("Kept locked since the Tangle got into the Loft that time.
  The spare key's kept in the Ropewalk.").

#### The Kennel (2,1) / Under (2,4): mini-boss Cog, the Needle
- Elements: Cog's kennel (9,2) with his cord under it (his mark (9,4)); shutters west and south; the Needle chest (5,2)
  appears when he's beaten; the trapdoor (9,7).
- Fight (test "the Kennel"): he wakes only once Wren is well in (the west door slams behind her, shut when the line says
  it slams). Brass hide: the stick clangs off him. Go down the trapdoor: up top he sniffs, then trots home; below at
  (9,5) facing up, hold Action: tied off, he's held; back up and knock him from (9,5) facing up: he bolts. Twice.
- His move: a few strides off he crouches, tail whirring, and pounces on the spot she's on, its shadow first (tell at
  least 30 frames): a heart and a half.
- Defeat: he sits, topples clear of Wren, his thread runs off down the cracks, then the chest comes up (each when its
  line says so: `scenes`, `spoolworks` "Cog wakes only once you're inside"). `spool_cog`. A run-down Cog has no cord.

#### The Practice Floor's door (Kennel south doorway)
- The iron weight at Practice Floor (9,1), in the Kennel's south doorway: nobody can push it (said). Solution: face it,
  Needle, one step right: its new place is (10,1), its nook; the way's open (test "the Kennel's south door").

#### The Practice Floor (2,2) / Under (2,5): the Ropewalk opens
- Idea: the Crossbar from below; a knot and a stitch.
- Up top: two practice puppets on stands, the little wooden Wren (11,3) and the little wooden boy (13,3), their strings
  running down to a rack below; two runs, a plate in each at different depths: (11,8) and (13,6). The Gatehouse's east
  door is open while both plates are down.
- Below: the practice rack (12,3); the boards have gone round under the boy's stand, so his cord hangs down a hole, out
  of reach.
- Solution (test "the Practice Floor"): up top, face the boy from (13,2) and stitch his plate as his place (`DDD`); he
  goes there; down the trapdoor (3,7); take the rack from (12,4) facing up and walk `DDDDD`: the little Wren onto her
  plate, the boy on past his; tie the little Wren's cord at (11,4); let go: the boy walks home, onto his plate. Both
  down: the Gatehouse door opens. That door is out of sight from both floors, so the camera goes and looks at it with a
  chime (the first time at all, and the first time they stay with nobody at the rack). Through it, the Ropewalk's door
  across the Gatehouse opens with a chime.
- Alternative: stitch them both onto their plates (tracker; not separately tested).
- Blocked: let go without either fix, they walk home and the door shuts before anyone could get round (test). The rack
  can't be worked by hand up top (said: `review_blind_a`).

#### The Ropewalk (0,2) / Under (0,5): key 2
- Idea: the Needle through a cord + the Hookline.
- Up top: the floor's fallen in down the middle; an old crate (2,2) across the gap, out of the Hookline's reach and in
  line with nowhere Wren can stand; the key chest (2,8) on the far side; the far door north (4,0) to the Spool Store.
- Solution (test): down the trapdoor (15,7); below at (2,3) facing up, Needle through its cord, `RRRR`: the crate moves
  into line at (6,2) up top (its cord goes with it); tie it off at (6,3); back up; from (11,2) hook west: the hook bites
  into the tied crate and reels Wren over to (7,2); key 2; the Spool Store's south door opens (`rwOut`).
- Alternative (test "another way"): with the crate moved into line, hook it over to this side (11,2), push it aside, and
  hook its empty mark: reeled onto (6,2).

#### Under the Spool Store, north: the Loft's lock
- Only the Ropewalk's key turns it (test "under the Spool Store"; `review_blind_a`). Through it: Under the Bobbin Loft,
  ladder (9,8) up into the Loft.

#### The Bobbin Loft (0,0) / Under (0,3): the Pattern
- Idea: three stitches and a knot (the knot outlasts the stitch).
- Up top: four plates (3,3), (15,3), (3,8), (15,8) that only a bobbin works (`minWeight 3`; Wren is no bobbin); four
  full bobbins on iron cores (6,4), (12,4), (6,7), (12,7) that won't shift by hand; the Pattern chest (9,2) and the
  exit gate south (9,10) open once all four plates are held 5 s (`blHeld`, latched; a winch starts at the first moment
  and a notice says so).
- Solution (test): stitch the NW bobbin onto (3,3) (from (6,5) facing up, `LLLU`); down the trapdoor (9,7), tie its
  cord off at (3,4); back up; stitch the other three (`RRRU`, `LLLD`, `RRRD`): the fourth stitch lets go of the first,
  but the knot holds it where it is; five seconds: the Pattern.
- Blocked (`review_d7` 3): four stitches never hold four (the fourth lets the first go home), and all four must be down
  together for a moment, not a single frame.

#### Gundry's Bench (2,0) / Under (2,3): signature
- The trapdoor won't lift while the crate (9,6) sits on it (Wren stays below). From below at (9,7) facing up, Needle
  through its cord, `RR`: moved to (11,6); up the ladder: Gundry's mark (4,2) (`sig:spoolworks`, "G.G., and an old L."),
  Heart Patch (15,2). (Test "Gundry's Bench".)

### Boss: the Tangle (1,0, the Heart of the Works)
- Room: the Tangle at (9,5), its four bobbins on their first places N (9,2), W (6,5), E (12,5), S (9,8); trapdoor (2,7)
  to Under the Heart, where the hoist's counterweight sits on its plate (1,6). `hp 3`, three knocks a beat.
- Beat 1: all four bobbins off their first places and held there at once. Test: stitch N from (8,2) facing right `UL`,
  W from (6,4) facing down `LL`, E from (12,4) facing down `RR` (three stitches); push S right twice to (11,8); down the
  trapdoor; tie S's cord off at (9,7) facing down (under its mark); back up: it comes apart round its core; knock it
  from (9,6). A knock yanks every thread: knots slip; a stitched bobbin is at home, so it stays.
- Beat 2: it hangs itself on the Heart's old hoist in the rafters, out of reach (Wren can walk under it; spoolmites
  let down). Below, push the hoist weight off its plate (from (1,7) push up): down it comes, loose: knock it before the
  weight goes home (patience 6 s), or it's hauled back up.
- Beat 3: it tears the hoist down and winds the line round the trapdoor (it won't lift: no knots now); every couple of
  seconds it hauls every thread a tile, stitched bobbins off their new places too. Grip the south bobbin (from (10,8)
  facing left, hold Action, step right: held at (10,8)) and ring the Recall Bell with the other hand: everything goes
  home at once, home being where the Needle put it; it comes apart; let go and knock it while it's dazed.
- Every try answers (`review_blind_d`): struck whole, the stick thuds and its cords shrug (a line the first time);
  all four out with one only pushed off, a glint runs along that thread, and when it slips home: "Three of its threads
  stay drawn out. The fourth slips home, and the Tangle winds tight round it again." Rung without the fourth held out
  (or in beat 1 with one pushed off, not held), once what the ring sent home has settled: "Everything goes home at once,
  and with nothing held out of it, the Tangle winds tight again." (not said if the ring didn't send everything home).
  A loose bobbin is pulled back in; only held ones undo it (`review_d7` 4).
- Grip option (`review_blind_cd`): Options > Grip: toggle makes beat 3 a tap, a walk and the Bell (never two buttons at
  once); a cord whipped along her line knocks her off a toggled grip.
- Its blows (tells 22/20/18): yarn balls after it swells and glows (1, 2, 3; a heart); the lash, its reach drawn first
  (a heart and a half); a cord along its row or column, lit right across the hall (a heart and a half; both at once in
  beat 3); spoolmites in beat 2; nothing thrown while it gathers to haul.
- Defeat: forty years of loose ends slither away down the cracks; Gundry walks in and over to Wren ("You did it the
  right way, too."), a Heartstitch, the cot and a job. Flags `spool_boss`, `d7`; goal "Up to the Guild Hall, under the
  Inn: Gundry has a job for you." No Knot. Leave by the Heart's south door.
- Blocked: Homeward never flies through the floor between the layers (`review_d7` 5). Townsfolk won't take the Needle
  (`review_d7` 7).

### Known accepted behaviour (House 7)
- Beat 1 of the Tangle was deliberately left as it is (SPOILERS §5: no small change made it readable without priming
  beat 3 or mattering only by chance).
- Refusals are said (`review_blind_a`): a block tied off below won't be pushed or gripped up top ("held fast from
  underneath"); a wedged weight says so when pulled; the practice rack by hand; the Needle on a knot.
- The tie-off line is said every time, shortened after the first (finding 58).
- An older save with a stitch for the weight that used to stand under the Spool Store loads with that stitch let go
  (`spoolworks.test` "old saves").

---

## House 8: the Loom (`loom`)

### Overview
- The First Spinner's Loom in the Loomwood, silver and grey silk. Eighth House, after Reveal 2 and the north gate;
  before the Frayed Edge and the Drift. Not one of the Wander's Houses: no Knot. Files: `src/72_loom.js`,
  `src/72b_loom_foes.js` (the Shuttle, the Weaver, silk, anchors), `src/70_shears_kit.js`. Tests: `tests/loom.test.mjs`,
  `tests/shears_kit.test.mjs`, `tests/review_m.test.mjs` (2, 3, 8), `tests/review_blind_f.test.mjs`,
  `tests/review_blind_d.test.mjs`, `tests/review_opt.test.mjs` (new 5/6/7).
- Getting in: the Loom's doors (Loomwood 95,9) want the Guild's key, which Gundry gives after Reveal 2 (`gundry_r2`);
  the north gate opened early (S32) only opens the Loomwood (`review_m` 2). The warp of silk across the door must be
  lifted first (regions part).
- Grammar: permanence. Nothing has a thread but the Loom's own old weights and its silk. Blocks lying about are offcuts
  (strays, middling weight: silk holds them, the iron plate ignores them, a Hookline brings them over): pushed, they
  stay; into a pit, they fill it for good. Silk strung across a thing's way home catches it there (it waits, straining;
  a ring's hurry too). No nudges anywhere in the Loom (nobody watches).
- Tool: the Shears, from the Shuttle. Tool at a thing (or its cord from below) cuts its thread: a stray for good, kept
  where it's left even after a rebuild; silk walls fall; silk bridges drop; under iron, silk parts; a thread pulled
  tight (a thing on its way home) is cut anywhere along it; a slack thread (a tied-out thing) slides off the blades;
  people can be cut free; Wren's own thread, at the fog.
- Gives: the Shears, the Pattern, the Plan, a Heart Patch (the Spinner's Room), a Heartstitch, `d8`.
- Goal line (`LOOM_GOALS`, `review_blind_f`): the gate's counterweight, then "Through the north gate...", then
  "Inside the Loom: the First Spinner's Shears are somewhere in here", then the Shears line.

### Save states
- S46 (the Threshold).
- S47 (the Shears just got): the Shuttle Run, south doorway (9,9).
- S48 (before the boss): the Shuttle Run, south doorway; Pattern held, the big door north already open.
- S49 (outside). Note: the Weaver's Heartstitch was not picked up on the scripted route; it lies in the Web at (10,9)
  and still gives +1 heart (18 → 19) when walked over (checked headless). Not a bug.

### Map
```
                      1,0 The Web (Weaver)
                         | big door (Pattern)
 0,1 Spinner's Room =silk= 1,1 Shuttle Run ==shutter== 2,1 Bridge Room ---- 3,1 Warp Walk
                         | lock (Snag key)               | gate (plate)          | gate (Larder plate)
 0,2 The Snag ---------- 1,2 Warp Hall ==silk wall== 2,2 Weighing Room == lock == 3,2 Larder
                         |                                | (south)
                      1,3 Threshold (entrance)         2,3 Hanging Gallery
```
- The way (tracker): Threshold (Plan), Warp Hall, the Snag (key 1) → Warp Hall north lock, the Shuttle Run (Shears),
  [the Spinner's Room], back to the Warp Hall, cut the east silk wall, the Weighing Room (across the chasm), the Hanging
  Gallery (key 2) → the Weighing Room's east lock, the Larder, the Warp Walk, the Bridge Room (Pattern; its west way to
  the Run while the plate is held, its south gate for good), the Run's big door, the Web.

### Rooms

#### The Threshold (1,3), the Plan
- Idea: strays + the Hookline (Kiln).
- Elements: a two-deep trench (rows 4-5, x 1-17) between this side and the north side; offcuts across it (4,3) and
  (12,2); a chute (4,1) over there, worked by a lever this side (2,7), drops another offcut at (4,2); the Plan chest
  (16,2) across the trench; the north door (9,0).
- Solution (test "the Threshold"): nothing this side to push. From (4,6) hook north: the offcut (middling, so it's
  brought, not her to it) hangs on the line over the trench and drops into the hole in front of her (4,5), filling it.
  From (4,5) there's nothing more in line; pull the lever: another offcut drops at (4,2); from (4,5) hook it: it fills
  (4,4). Across; the Plan; north.
- QA: old saves made before the room was rebuilt keep the holes they filled that are still holes and forget those that
  are walls now (`LoomHouse.migrate`); the Threshold they crossed stays crossed (test "the Loom rebuilt").

#### The Warp Hall (1,2), hub
- West open (the Snag); east a silk wall (19,5) (the Shears); north a lock; the great loom frame (half a cloth).

#### The Snag (0,2), key 1
- Idea: whatever falls goes home at once (rule 5 as a way across).
- Elements: an old weight (marked, `oyW`) whose place is the iron plate (9,2) under its peg; it was dragged off and lies
  at (13,5), caught on its way home by a strand of silk (12,5): it strains there; a hole (x 9-11, rows 3-4) between it
  and its plate; the gate (2,4) to the key (2,2), opened by the plate.
- Solution (test "the Snag"): push the weight up from (13,6) to (13,4), then from (14,4) push it left twice: into the
  hole: home at once, on its plate; the gate opens; key 1.
- No effect: a ring makes it rush only till the silk stops it; its empty mark hooked sets Wren on the plate, which
  doesn't feel a girl; pushed off, it only comes back to the silk. After the Shears, cutting the silk lets it walk home
  (tracker).
- Old saves (`settle`): one that took the old Offcut Yard's key finds the Snag done (weight on its plate, gate open).

#### The Shuttle Run (1,1), mini-boss: the Shuttle; the Shears
- Elements: the Shuttle at the west end of its lane (rows 4-6 are its lane); a chute (8,9) beside the south door drops
  an offcut at (9,7); shutters south and east; silk across the west door (0,5); the big door north (9,0); the Shears
  chest (9,2) appears when it splits.
- Fight (test "the Shuttle Run"): it flies its lane through anything soft. Pick up the offcut... (the test presses Action
  facing down at (8,8) to drop one from the chute, then pushes it up from (9,8) twice into the lane); an offcut in the
  lane jams it: knock it while it's jammed (stand south of it, strike up). After the first knock it shakes the offcut
  out of the lane; push it back in. Twice.
- Its move: waiting at its end, its lane is lit wall to wall (a heart and a half if it finds her in it).
- Defeat: `loom_shuttle`; the Shears chest. Then cut the silk on the west door: the Spinner's Room.

#### The Spinner's Room (0,1), optional
- The tapestry (the First Spinner tying the valley in a hard winter); "L. CUT HER WAY OUT OF HERE. YOU CAN TOO."; Heart
  Patch (16,2).

#### The Weighing Room (2,2)
- Idea: Shears on weights: what hangs falls where it hangs.
- Elements: a chasm (x 8-10, all rows); five old weights hanging at home over it on their threads: (8,2), (8,6), (9,7),
  (10,7), (10,3); a chute (1,9) dropping spare weights at (2,8) (on their own threads); exits on the east side: south
  (14,10) to the Hanging Gallery, north (15,0) to the Bridge Room (gate), east lock (19,5) to the Larder.
- Solution (test "the Weighing Room"): no row has three weights; row 7 has two. Pushed in uncut, a weight only goes home
  (hanging where it hung). Cut where it hangs, one drops and fills the hole under it. So: pull the weight at (8,6) out
  onto the edge at (7,6) with the Gloves (hold Action facing it, step back), push it down to (7,7), cut it there, push it
  right into (8,7): filled; stand on it, cut (9,7) where it hangs: filled; from there cut (10,7): across.
- Alternatives: spares from the chute, cut, do too; the Needle can bring one out onto the edge instead of the Gloves
  (tracker).
- Old saves: the floor's old weights (wrW1-3) are gone; what they filled stays filled.

#### The Hanging Gallery (2,3), key 2
- Idea: cutting a thing in motion.
- Elements: a one-row trench (row 4, x 1-14) separating the north part from the south part where the key chest (9,8)
  is; two weights tied out over the trench at its west end, (3,4) and (2,4), their homes on the far south-east side
  (17,8), (16,8), out of the Hookline's line; a lever (17,2) that lets them go (and, pulled again, sets them out
  again).
- Solution (test): pull the lever: they come home along the trench, hanging, thread tight. Stand at (13,3) facing down
  (a trench tile ahead of a weight) and snip as one passes: it drops where it hangs (not where she cut) and fills that
  tile; walk over; key 2.
- No effect: a slack thread (tied out, before the lever) slides off the blades; the hook finds nothing to pull Wren
  over by. Missed, pull the lever to set them out again. The sign points to spare weights upstairs if both are wasted.

#### The Larder (3,2)
- Idea: Bell + blocking + a tight cut (Belfry, Tidyhouse, Loom).
- Elements: east of the Weighing Room (key 2); a one-wide gap (column 11) down the room; two wrapped weights asleep:
  one (`lrW1`) lying at (14,7) on the far side whose thread runs back over the gap, along this side and over again to
  its home (15,1); the other (`lrW2`) at (16,5) whose home is the plate (18,2) that opens the far gate (13,0); a warping
  post (9,7); cocoons.
- Solution (test "the Larder"): a ring from anywhere sends both home fast: `lrW2` onto its plate (the gate opens for
  good) and `lrW1` home over the gap and back, filling nothing; leave and it lies down again. Stand at the turn of its
  thread, (10,7), with the post at your back, and ring: it can't shove Wren, so it waits over the gap at (11,7), thread
  tight: cut it: it drops in and fills the gap. (Or block it at the top turn with the wall at your back, cut it there and
  push it in: tracker.) North through the gate.
- Help that's there (`review_blind_f`): the Hookline at a sleeper says it's asleep; with the Bell in hand, every sleeper
  a ring would reach shows the way it would go (beads of light along its thread); the sign says so.

#### The Warp Walk (3,1)
- Idea: Needle + Hookline + cut (Spoolworks, Kiln, Loom).
- Elements: a ledge (row 5) along the wall over a drop, one weight (7,5) across a gap from the near end, and one more
  gap at the far (west) end before the doorway (0,5) to the Bridge Room.
- Solution (test): hooked, the weight reels Wren to the tile in front of it: the gap (a fall, home to the doorway).
  From (9,5) facing west, Needle `LLL`: its place is now (4,5); hook it: Wren lands on the walk at (5,5); cut it (a
  stray now) and push it west into the last gap (marked, it would only go home); on to the Bridge Room.

#### The Bridge Room (2,1), the Pattern
- Idea: iron through silk; a thing going to its place hangs on its thread (Needle).
- Elements: the drop (column 9) with a silk bridge across it at (9,5) (Wren can cross silk); a nook in the drop's far
  wall holding the one weight (8,2), wedged (no hand shifts it), over a strand of silk (9,2); a heavy plate (12,2); the
  Pattern chest (16,2) shown while the plate is held; a chute (8,1) in the nook's ceiling (drops a wedged spare, only
  into an empty nook); an offcut chute (13,1) on this side; the south gate (15,10) and west gate (0,5), both opened by
  the plate. Sign: "Silk will hold a girl. Silk will not hold iron: under iron, it parts."
- Solution (test): from (12,2) facing west, stitch the weight `RRR` (from 2-4 tiles off along the row): it moves onto
  the strand, the silk parts under it, it hangs on its thread in the gap a moment ("Under the iron the silk parts...",
  said once), then goes on to (11,2); push it onto the plate (12,2) and cut it there (or stitch it onto the plate): the
  Pattern; the south gate for good, the west way to the Run while the plate is held (held for good by the cut weight).
- Blocked: the Needle won't give iron a place on the silk itself (no stitch); the strand cut first strands the weight
  (no stitch over a hole) until an offcut fills the gap (the offcut chute, pushed west four); the nook's chute drops a
  spare only into an empty nook (test).
- Old saves: the old weights (brW1, brW2) are gone; the new weight finishes it; one that spent a key on the old lock
  here keeps that way open (`loom.test` last test).

### Boss: the Weaver (1,0, the Web)
- Room: the First Spinner's loom across the north (its breast-beam, words under silk); its well a deep slot down the
  middle (x 9-10, rows 3-8); three posts with anchors: north-west (5,4), south-west (5,7), south-east (14,7); a fourth
  anchor up in the loom's cloth (10,1). It wakes as Wren comes in. `hp 3`, three knocks a beat.
- Beat 1: hung by four anchor threads, each held its own way (test "the Web" and "four anchors read four ways"):
  - south-west, tied plain: cut at the post (from (4,7) facing east);
  - north-west, its knot wound in a cocoon, asleep ("Wound round and round in grey silk, and fast asleep. The blades
    can't find the thread in there."): a ring of the Bell within its reach (seven strides, drawn) wakes it and the silk
    unwinds into the web; then cut (from (4,4) facing east); rung from too far, it sleeps on;
  - south-east, tied long and slack (snips slide off: "Hanging slack like that, it only slides off the blades."): when
    the Weaver rears back to spit it swings back in its web away from Wren and pulls it tight for about half a second:
    cut then (from (15,7) facing west), at the post or anywhere along it while tight;
  - the fourth, from its back up into the loom's cloth over the well's head: out of reach at the loom ("tied up on the
    loom, out of the blades' reach"), but drawn tight down over the well: cut it from the well's rim facing the well's
    head (from (8,3) facing east; either side).
  All four cut: it drops into the well, tangled: knock it (from (8,6) facing east). Not knocked in time, it climbs back
  and ties in again as it was (cocoon asleep, the long one slack).
- Beat 2: up on the breast-beam by one thread of its own, posts bare. It drops on Wren (its shadow first; lands hard:
  two hearts), crouches (thread slack: snips slide off), then hauls itself home up the well, thread tight: cut it while
  it's over the well (from (8,5) facing east): it drops in; knock it. Cut over the stone, it lands on its feet and runs
  back up.
- Beat 3: it clings to the breast-beam and won't come down. Hookline from (9,9) facing north: it's hauled down its own
  well toward Wren and hangs there, dazed, low over the well; cut it (facing north) at the thing, or its thread as it
  climbs home; it drops; knock it. Left alone, it climbs home.
- Its blows (tells 20/18/16): silk spat after it rears back, belly aglow (binds Wren: the tool button snips free whatever
  tool is in hand, said once when it isn't the Shears; caught again while bound, it tightens: a heart and a half; two at
  once in beat 3); the warp: Wren's column lit, a thread thrumming, then it snaps (a heart and a half; two columns from
  beat 2; a warp thread plucked while she's bound never lands on her); the drop (two hearts); beat 3 silk moths (beaten
  like any, gone with the Weaver).
- Help: with the Shears in hand, whatever in a snip's reach would cut right now glints, brightest where she faces: the
  plain post, a taut thread over the floor or its shadow, the strand into the loom from the well's rim at its head, the
  Weaver's own when low or taut; nothing glints with another tool in hand (`review_blind_d`; finding 59).
- Pace: the scripted fight takes well under a minute, walking included (`loom.test`).
- Defeat: it curls up in the well, a heap of grey silk; the web drifts down like snow; the breast-beam's silk falls away:
  "I MEANT TO UNPICK THEM IN THE SPRING. -THE FIRST SPINNER." A Heartstitch (where it can be picked up, not in the
  well). Flags `loom_boss`, `d8`; goal "The Shears can cut anyone free. The town, first? And then the fog at the Frayed
  Edge, and your own thread." Rebuilt later: the heap (`WeaverHeap`), the anchors in tatters.

### Known accepted behaviour (House 8)
- No nudges in the Loom: by design (nobody watches from underneath there).
- The first three rooms were rebuilt in round E (finding 62) so each is a different idea; old saves are migrated
  (`LoomHouse.migrate`, `settle`).
- A thread cut mid-step leaves no invisible wall; a thing cut over deep water sinks; tied things are slack to the
  Shears, a thread drawn tight is tight until it stops (`review_opt` new 5/6/7).
- Offcuts are middling: silk holds them and the iron plate ignores them (`review_m` 3).
