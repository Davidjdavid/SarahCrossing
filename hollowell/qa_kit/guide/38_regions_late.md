## The middle and late regions: from the festival to the Loomwood (main path)

The overworld is one map (`hollow`, 200x150 tiles); coordinates below are the map's own tiles unless a room is named.
Regions are blocks of it: Hushwood (block 2,1: x 128-167, y 40-79, `src/59_hushwood.js`), Larkspur Fair (block 0,1:
x 0-63, y 40-79, `src/62_larkspur.js`), the Loomwood (block 1,0: x 64-127, y 0-39, `src/71_loomwood.js`). The Underside
is its own area (`underside`, 60x22, `src/66_underside.js`), and so are the deep store (`deep`, `src/69_reveal2.js`)
and the Giant's Hollow (`hummock_hollow`). Outdoors, Wren's mark is the last place she rested (a "rest" spot), a laid
Bedroll overrides it; a fall flies her home to it.

Order on the main path: the festival (after Knot 4) → the giant on the east road → Hushwood and the Slumberhouse
(House 5) → Kilnridge's high mesa → Larkspur Fair and the Marionette Hall (House 6, Reveal 1) → the Inn's Staff door
and the Underside → the Spoolworks (House 7) → the Makings → the Way Down, the deep store and Reveal 2 → Gundry, the
Guild's key, the north gate's counterweight → the Loomwood → the Loom (House 8).

---

### The Knotting Festival (after Knot 4; `src/57_festival.js`)
- Save states: S23 (Hollowell, the festival about to start), S24 (after it and the giant: the east road open).
- Trigger: with `d4` set, the first time Wren stands in the town square (map x 85-106, y 53-66) the scene plays
  (`festival`). No puzzle.
- What happens: Gran meets her ("Four Knots! Only two to go, love."); Bram, Dad (Ambrose), Mum (Tess) and Ives arrive
  late from four directions, out of breath, with clay, river water, brass dust and a feather duster on them; everyone
  dances; Gran points her at the east road and the sleeping giant. Goal: "The east road out of town: the sleeping giant.
  Ring the Recall Bell at it." Pip mentions Returnball by the bakery.
- QA: the four latecomers stand still and turn to Wren when they speak, even one held up on the way (`scenes`).
- Optional, passed here: Returnball by the bakery (S29: five rings in one throw, a Heart Patch from Pip).

### The giant on the east road (Old Hummock)
- Idea: the Recall Bell wakes sleepers.
- Elements: Old Hummock asleep across the Sleeping Road where it leaves town, filling five tiles by four (from about
  (129,58)); no way past him.
- Solution (`tests/hushwood.test.mjs` "the sleeping giant"): ring the Bell within reach of him (the test rings from the
  town side at (125,60); the reach is the Bell's 7 tiles plus one from his middle). He sits up (a squirrel slides off),
  apologises and strides home to his own bed in the north-west of Hushwood. Flags `giant_awake`, `giant_home`; goal
  "Hushwood: find the Slumberhouse, over the stream." A deep hollow is left in the middle of where he lay (131,59).
- State: permanent; he stays in his bed (a talking spot) for the rest of the game.
- QA: his shadow is flat once he's up (finding 81, `live5`).
- Optional: the Giant's Hollow (S16), the hole where he lay: only with the Bedroll laid up top ("You'd want your
  Bedroll laid somewhere up here first"); down there, one of Linnet's notes; Homeward brings Wren back up (or the roots
  can be climbed the hard way). Details in the optional-content part.

### Hushwood
Regions: the Sleeping Road (south-west, in from town), the Slumberhouse (north), the Slumberhouse Garden (the strip
along the stream, y 54-57), Puffball Hollow (south-west), Lantern Pond (south-east), the Far Bank (east), the Cliff
Stair (walled off from Hushwood). Music `hush`. Save states: S24 (arrival), S28 (outside the Slumberhouse after its
Knot).

#### The Sleeping Road: the rule shown before it matters
- Elements: a sign ("HUSHWOOD. Please do not wake anything."), a rest spot (138,56), a Snoreling asleep in the road
  (136,60) and a cradle beside the road (141,61).
- What it does (test "the road in"): walking past wakes it; it follows a while, then lies down in the nearest bed it can
  get to, a bed that isn't its own: the roadside cradle; led on over the moss instead, it lies down in the first garden
  cradle, which counts for the door.
- Snorelings everywhere follow one rule (finding 37): woken by treading near them a while, they shuffle after Wren,
  then lie down in the nearest bed they can walk to (their own spot, a cradle nobody's in, a Bedroll).

#### The stream and the bouncy moss
- Moss at (140,55), sprung north, hops Wren four tiles over the stream to (140,51); moss at (138,51), sprung south, hops
  her back to (138,55) (test "bouncy moss"). Sign: "MIND THE MOSS. It is VERY bouncy."

#### The Slumberhouse Garden: the door to House 5
- Idea: the House's own rule, outdoors: sleepers go to the nearest bed.
- Elements: the Slumberhouse door (147,48) on the north side of the stream, round and lavender, with three little lamps
  over it, each on a cord to one of three cradles in the hedge on the south bank (144,54), (148,54), (152,54); a puffball
  beside each cradle (143/147/151,54); three Snorelings asleep on the green below (136,56), (144,56), (148,56). The door
  opens while somebody sleeps in each cradle (`nuA&nuB&nuC`), and for good once she has been in (`slumber_open`) or the
  House is done (`d5`). The lamps light one by one as each cradle fills (test "the door's three lamps").
- Solution A (test "the garden: rung awake"): hop north over the moss; from the north bank by the far cradles
  (148,51), ring the Bell: the two Snorelings in hearing wake and come toward her, the only way over the water being
  into the cradles under her; done chasing, each lies down in the cradle it's standing in. The third, too far off to
  hear, is woken by treading near it on the south side and led round to the first cradle, where it gives up and lies
  down. In at the door.
- Solution B (test "the other way"): wake them one at a time by treading near and lead each to a free cradle, then let
  it give up there.
- Solution C (test "the puffballs"): a puffball's spores put whoever is in reach to sleep where they stand; one awake in
  a cradle can be put down at once (the test bursts the puffball with the Hookline).
- Blocked: a cradle feels whoever is in it, Wren too, and lets nobody else in (test "a cradle feels whoever").
- QA: nobody gives the step away: Hettie's lines and the House's signs say how things are, not what to do
  (`hushwood` "nobody gives the step away"; finding 39). Decided against: the ford in the Garden is drawn the river's
  blue though shallow (cosmetic; finding 81). Sleep puffs on the way: breathe one and Wren dozes off and flies home to
  her mark, unhurt (`bedroll_kit`).
- Optional passed here: a fourth cradle behind a little round hole in the hedge by the house (142,47) and a wooden
  Snoreling puppet (145,50): with the Crossbar, and the three garden Snorelings asleep, walk it through the hole into its
  cradle: 30 buttons (141,49).

#### Elsewhere in Hushwood (optional; one line each)
- Puffball Hollow: puffballs, Snorelings, Hettie's camp (134,73) (the forager stuck since the giant lay down).
- Lantern Pond: the weir's winch (153,71) lets a raft run down the channel into Millwater's lake (`hush_weir`; from the
  lake the channel is shut until wound); four lanterns lit while their heavy stone plates are held (four mossy stones, the
  Needle) give the isle's Heart Patch (158,68); an old loom weight lies on the isle (159,69) and later fits a Loomwood
  socket for good.
- The Far Bank: over the log bridge, moss up onto the plateau (Heart Patch (164,44)), a ledge back down.
- The Giant's Hollow (S16): see above.

### Kilnridge's high mesa and the leap into Larkspur Fair
- Save states: S29 (just after the leap: the Straw). In S29 the Bedroll is laid on the mesa beside the edge (15,83).
- Idea: falls as travel, outdoors: the Bedroll as the way back.
- Elements: the edge of the high mesa in Kilnridge's north-west (12,83), the fairground far below, straw bales under the
  cliff.
- Solution (`tests/larkspur.test.mjs` "off the high mesa"): lay the Bedroll (the test lays it at (15,83)); Action at the
  edge: "A fairground, far below... Jump?" → Jump: Wren lands in the Straw at (12,74) ("You land by the haystacks with a
  whump, and lie there a moment...", flag `leapt`). Homeward flies her back up to the Bedroll.
- Blocked: without the Bedroll at all: "It's a long way down, and no way back up."; with it rolled up (or laid in
  another area): "You'd want your Bedroll laid somewhere first, to come home to." Note: the check is only that the
  Bedroll is laid somewhere on the valley map (`Inv.bedroll.area === 'hollow'`), not on the mesa itself; a Bedroll laid in
  town also allows the jump, and Homeward then goes to town (follows the rules; not reported as a defect).
- Ways back up later: the bolt on the fair's east gate (a road home to town), and the lift (below).
- Decided against: the jump drawn as going up a cliff (every cliff shows its south face; finding 78).

### Larkspur Fair
Regions: the Straw (south, where the leap lands), the Edge (the fog close on the west; no further), the Midway (the
middle: carousel, tents, Madame Rook, the big wheel), the Marionette Hall (north: the parade forecourt). Music `fair`.
Save states: S29 (the Straw), S30 (inside the Hall), S33 (outside after House 6).

#### The parade forecourt and the portcullis: the door to House 6
- Idea: Marionette grammar outdoors: shape a soldier's march.
- Elements: the Marionette Hall's door (31,49) behind a portcullis (31,51), wound up only while two drum pads are both
  held, (29,52) and (33,52); a toy soldier marches over each pad in its own little pen (`pgSolA` at (29,53), `pgSolB` at
  (33,52)), touching it only in passing; the fair's own crates (25,52), (37,54), marked, go home; two pale stray crates
  far out west, (4,54) and (4,73), unmarked, light, not throwable, stay wherever they're put. Pell the barker (36,52).
- Solution (test "the forecourt", helper `paradeGate`): carry one pale crate to the pen's gap beside each soldier
  ((28,53) facing east for the west soldier; (34,53) facing west for the east one) and set it down while the soldier is
  on its pad's row: it boxes the soldier onto its pad. Both pads held: the portcullis winds up (a second or two); in at
  the door; `hall_open` keeps it open (also `d6`).
- Blocked (test "one soldier boxed in is not enough"): one soldier boxed and the other only touching its pad in passing
  never winds it fully up; a fair crate set in a pen goes home and frees its soldier.

#### The fair gate (the way home)
- Elements: the east gate to the town's west road (61,59-60), bolted on the fair's side; the bolt (59,58).
- Solution (test): Action on the bolt from (58,58) facing east: `fair_gate`; the gate opens and the town's side of the
  West Gate opens too; the road runs both ways. From town it's bolted on the far side until drawn (test "from town").
- QA: the gate's leaves stand open with the bolt drawn out to them (`told_seen` "the fair gate").

#### The lift (a shortcut up and down the cliff; needs the Crossbar)
- Elements: the lift at the cliff foot (25,75); on the mesa top in Kilnridge, the stagehand puppet (24,83) beside the
  winch's crank (25,83), which feels only puppets; the lift's top (22,83).
- Solution (test "the lift"): from the cliff foot (24,75), face south and take the stagehand's strings with the Crossbar
  (it's far up the cliff, in sight); walk it one step east onto the crank: `fair_lift`; Action on the lift rides it up
  (lands at (21,83) on the mesa, clear of the stagehand) and down again.
- Blocked: Wren standing on the winch does nothing (`review_d6` 5).

#### Optional in the fair (one line each)
- The painted hedge by the fortune teller's (10,47): a flat; one knock and a nook behind it, 50 buttons (10,44).
- The fakir's pen: with the Crossbar, walk the puppet fakir (56,51) through the hole and over the nails onto the plate
  (54,44): Heart Patch (52,51).
- The carousel's wooden horse (31,62): walked off its spot with the Crossbar, Linnet's seventh note under it.
- The Edge (S11): lay the Bedroll by the fog and walk in: the fog pulls Wren home to it, holding a Drift-bloom seed (kept
  from the moment the fog lets go: `review_d6` S11).
- Madame Rook's wheel of fortune (14-17, 50-53; the Needle) and the balloon by the fog (5,70; the Shears): see the
  optional-content part.

### The Inn's Staff door and the Underside (after Reveal 1)
- Save states: S33 (outside the Marionette Hall; goal "Hollowell: the Inn, and the door marked STAFF ONLY."), S34 (the
  Staff Stairs, first time down), S38/S39 (the Guild Hall after the Spoolworks), S44 (the Guild Hall after Reveal 2).
- The door: at the back of the Inn (interior `inn`: stand at (13,3) and face north). Before Reveal 1: "A narrow door: STAFF ONLY. Locked.
  Something hums on the other side." After: "STAFF ONLY. The door is open for you now." The first time Wren walks into
  the Inn after the reveal, a notice points it out, standing ajar (`inn_staffSeen`). Through it: the Staff Stairs,
  arriving at Underside (29,19); the stairs back up at (29,20) (test "the Inn's Staff door").
- Rooms (cells of 20x11):
  - The Staff Stairs (1,1): the way in; west and east into the Seams; north to the Guild Hall.
  - The Guild Hall (1,0): Gundry at his table; the big door north to the Spoolworks (open, no key); east, the gate to
    the Making Floor, open once the Spoolworks is done (`d7`); after the Spoolworks, an apprentice cot (1,1) in the
    corner, a bed: lie in it and it is Wren's mark down here.
  - The Workshops (0,0): each Maker at their bench with their logbook (S22: read all six).
  - The Seams (0,1) and (2,1): tunnels under the town with peepholes in the walls (S23: all eight, then a lid clicks
    open at the east end: Heart Patch, Action from (58,13) facing north); at the east end the north gate's
    counterweight (57,16).
  - The Making Floor (2,0): Tuck's Little Wander (the Makings part); later, the Way Down off it.
- Gundry (`UNDER_TALK.gundry`): the first talk tells how a House is worked from below and sends Wren through the big
  door (`met_gundry_below`; goal "The Spoolworks: through the big door in the Guild Hall, under the Inn."). After the
  Spoolworks: the job (`gundry_job`; the Makings). After Reveal 2: the Guild's key (below).
- QA: Gundry has a touch of grey at the temples (`told_seen`); townsfolk below won't take the Needle (`review_d7` 7).

### The Way Down, the deep store and Reveal 2 (after the Makings; `src/69_reveal2.js`)
- Save states: S42 (the Making Floor, all Makings done), S43 (the deep store, first time), S44 (after: the Guild Hall).
- The errand: Gundry's goal "The Way Down, off the Making Floor: fetch Tuck's fresh spool from the deep store." The Way
  Down is a warp off the Making Floor (the test walks to (57,8) and steps south) into the deep store (`deep`).
- The Deep Store (0,0): racks of spare spools ("FOR NEXT YEAR"); Tuck's fresh spool on a little stand (9,6), bright
  green, labelled TUCK; Action: into the satchel (`tuckspool`); a sound like a winch from the old hall; goal "Tuck's
  spool is in your satchel. (And there's a door east, into the old hall...)". Sign: "THE OLD HALL. Warden only. (The
  door is not locked. It has never needed to be.)" The way back up: (2,9).
- The Hall of Names (1,0), east: a spool for everybody, every thread running down to the Spool under the Well. Things
  to read (each Action): Wren's own spool (red, wound tighter than any, still turning, with a tally card under it in
  Gran's hand: every time Wren was brought home without choosing it, five strokes to a gate, by place; `src/80b_tally.js`);
  Tuck's (as many turns pulled snug as Wren tugged his thread in the Makings); Linnet's, cut clean; others (Arlo's,
  Biscuit's empty peg, Hesper's empty). Gran's ledger on its lectern (17,3): Layer 2 (Linnet cut herself loose with the
  First Spinner's Shears from the old Loom; the Knots are turns of Gran's winch; the seventh Knot would make Wren the
  next Spinner), its last page the tally in rows.
- Reveal 2: reading the ledger brings Gran down the hall to an arm's length off. She doesn't argue; one question with
  three answers ("Where is Linnet?", "Let them go, Gran.", "...": each gets its own reply); then "Go home now..." and she
  takes Wren's red thread and pulls.
  - Holding on (intended, a rule not an exploit; `hall_held`): beside the lectern, take hold with the Gloves' grip (hold
    Action, or the toggle grip). Held things wait, Wren included: Gran tries twice, then "I can wait, love." and waits
    for as long as Wren holds. Let go (or never take hold within three seconds, or only tap) and she is yanked home.
  - After the pull: `reveal2`, `well_locked`; Wren wakes in her own bed in the morning; downstairs Gran's chair is
    empty, a cup of tea gone cold, the well cellar door locked from the inside; Wren can see her own thread, and
    everyone's, from now on. Goal: "Linnet cut herself loose with the First Spinner's Shears, from the old Loom. Gundry,
    under the Inn, may know where that is." (`tests/reveal2.test.mjs` "the Way Down").
- After it: talk to Gundry in the Guild Hall: `gundry_r2`, the Guild's key ("iron, as long as your forearm, with a spool
  for a bow"; it opens the Loom), and the north gate's counterweight in the Seams; goal "The north gate: its
  counterweight is in the Seams (east), under the town. Give it a new place." (or the road goal if the gate is already
  open).
- Optional (S33): a faint after Reveal 2 wakes Wren in bed knowing who pulled ("There you are, love.").
- QA: the reveal's morning line says the cellar door is "locked from the inside" (fixed, finding 78); Gran's count
  (`Tally.home()`) is said once at the Spool's top later; a save from before the tally (or a preset) gets the same words
  without numbers.

### The north gate and its counterweight
- Save states: S44 (before), S45 (after: the north gate open, the Loomwood ahead).
- Idea: the Needle on a thing nobody can shift.
- Elements: the counterweight at the east end of the Seams, Underside (57,16): heavy, not pushable ("The north gate's
  counterweight. Far too heavy to shift. TAGGED: DO NOT TOUCH. BY ORDER OF THE WARDEN."); a sign beside it; the stone
  gate on the North Road (map x 94-97, row 37), shut; Burr at his post.
- Solution (`reveal2.test` "after it"): stand at (56,16) facing east; Needle; one step (the test steps south); confirm:
  the counterweight has a new place: `north_gate`; "Far away north, something huge and stone grinds, and stops, and
  stays open." The first time Wren comes near the gate afterwards, the camera looks (`north_gate_seen`); Burr: "Go on,
  then." Goal "Through the north gate, up the Loomwood road to the Loom."
- Early (S32, optional): the same done before Reveal 2 (any time after the Spoolworks) also opens the gate and sets
  `s32`, but the Loom's doors still want the Guild's key, so it only opens the Loomwood (`review_m` 2).
- State: the gate's flag is permanent. A later fourth stitch elsewhere lets go of the counterweight's stitch (the notice
  names "the iron weight in the Seams"), and the gate stays open (`review_blind_f` "the Needle's let-go notice").
- QA: an older save with the gate long open and the counterweight's goal still up is put right as it next goes anywhere
  (`review_blind_f` "the Loom's goal"). The HUD steps back from the Needle's reach here (same file).

### The Loomwood
Regions: the North Gate (south, x 90-101, y 34-39), the Loom (north, its door at (95,9)), the Frayed Edge (west, x
67-78). Silver birches with silk between them, moths that go for movement, frayed thread-ends by the fog. Music
`loomwood`. A rest spot by the gate (92,33). Save states: S45 (the gate open), S46 (inside the Loom), S49 (outside after).

#### The warp across the Loom's door
- Idea: the Return's patience plus the Needle's three stitches.
- Elements: a warp of silk across the Loom's door (94-96,10) that lifts while all four sockets hold a weight
  (`lgS1..4`); four cords from it strung over the birches to the sockets, with a glint running along each so the far one
  can be followed by eye from the door (finding 40): sockets (90,12) by the door, (100,11), (88,17), and one far east
  (121,17); a loom weight lying near each, (90,14), (102,11), (88,19), (119,17). The weights are marked: pushed onto a
  socket, one goes home after its patience.
- Solution (`tests/loomwood.test.mjs` "the warp"): Needle three of them onto their sockets, the far one among them (from
  (118,17) facing east, two steps; from (103,11) facing west, two; from (88,20) facing north, two); then push the one by
  the door north twice onto its socket (from (90,15)): all four held; the warp lifts; walk through to the door before it
  goes home. Through once, `loom_open` keeps it lifted.
- Alternatives (tested): the Bedroll laid by the door, the far weight pushed on by hand, Homeward, and through; the old
  loom weight from Lantern Pond's isle fits any socket for good, so the Needle's three are enough; after the Shears, the
  warp is silk and can be cut for good.
- Blocked: the far weight pushed on by hand is home again long before Wren is back at the door (test).
- QA: the counterweight's stitch is the oldest of Wren's stitches by now: the third stitch here lets it go (see above;
  the gate stays open).

#### The Loom's doors
- The warp leads to the doors (95,9), which want the Guild's key: before `gundry_r2`: "The great doors are locked: an
  old lock, older than the Houses, with a keyhole as big as your hand..." With the key, in (S46). Goal lines move on as
  the gate opens, as Wren goes in, and as she finds the Shears (`LOOM_GOALS`).

#### Optional in the Loomwood (one line each)
- A strand of silk (120,16) hides a clearing with a Heart Patch (121,10) (the Shears).
- The Frayed Edge: strays lying about, and the Stray House (O1), its door (72,6) with a slot for a folded note
  (Linnet's note 8).
- The high path between the Loomwood and Belfry Heights (Hookline eyelets).

### Main-path gates in these regions, summed up
| Gate | Where | Needs | Flag |
|---|---|---|---|
| The giant | the east road, (129,58) | the Recall Bell rung in reach | `giant_awake`, `giant_home` |
| The stream | Hushwood | the bouncy moss (no tool) | - |
| The Slumberhouse door | (147,48) | a Snoreling asleep in each garden cradle | `slumber_open` |
| The high mesa | Kilnridge (12,83) | a Bedroll laid on the valley map | `leapt` |
| The portcullis | Larkspur (31,51) | both drum pads held (soldiers boxed in with the pale crates) | `hall_open` |
| The fair gate | Larkspur (61,59-60) | its bolt (59,58), from the fair's side | `fair_gate` |
| The Staff door | the Inn | Reveal 1 | `reveal1`, `inn_staffSeen` |
| The Spoolworks | Guild Hall north | (open) | - |
| The Making Floor | Guild Hall east | the Spoolworks done | `d7` |
| The Way Down | the Making Floor | all nine Makings | `makings_done` |
| The north gate | North Road (94-97,37) | the Needle on its counterweight in the Seams | `north_gate` (`s32` if early) |
| The warp | the Loom's door | four sockets held at once | `loom_open` |
| The Loom's doors | (95,9) | the Guild's key from Gundry after Reveal 2 | `gundry_r2` |
