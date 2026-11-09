# HOLLOWELL: Dungeon Tracker

> Spoilers. Every dungeon, its grammar, rooms, secrets and status. Status keys:
> `planned` → `built` (playable) → `tested` (scripted solution passes in tests/) → `polished`.

| Id | Dungeon | Region | Grammar | Tool | Boss | Status |
|---|---|---|---|---|---|---|
| D1 | Tidyhouse | Meadowfold | The Return (timing, passing plates, ramming, path shape) | Gloves | Grand Housekeeper | tested |
| D2 | Kiln | Kilnridge | Shards retrace the carried path | Hookline | Kilnwyrm | tested |
| D3 | Millrace | Millwater | Currents vs the Return; rafts | Paddle | Old Grindle | tested |
| D4 | Belfry | Belfry Heights | Wind displaces; bells snap home; sleepers | Recall Bell | Tollgrim | tested |
| D5 | Slumberhouse | Hushwood | Your own mark; falls as travel; the trace remembers | Bedroll | Mother Sloth | tested |
| D6 | Marionette Hall | Larkspur Fair | Remote bodies: marching soldiers, flats, puppets at a distance, puppets in step | Crossbar | Great Marionette | tested |
| D7 | Spoolworks | Underside | Two layers: cords under marks (tug, tie off), hatches, counterweights; re-marking | Needle | The Tangle | tested |
| D8 | Loom | Loomwood | Permanence; warp threads; cutting | Shears | The Weaver | planned |
| F | Great Spool | under the Well | Six Knot-locks remixing every House | – | The Spool | planned |
| O1 | Stray House | Frayed Edge | Nothing returns | Twin Bedroll | The Pile | planned |
| O2 | Unfinished House | Hollowell hills | Finish chalk rooms with the Needle | Long Hook | – | planned |
| M | The Makings (×3) | Underside | Indirect control: Tuck | – | – | planned |

## Per-dungeon structure (every House)

1. Entrance hall: the grammar in a safe, curious encounter.
2. Experiment rooms (2–3).
3. Escalation rooms (2–3).
4. The tool (mid-dungeon), a room that teaches it, rooms that combine it with the House's grammar.
5. Combination rooms with earlier grammars.
6. Hidden Maker's signature room (S06) and at least one other secret.
7. The Pattern (big key) chest, the culminating puzzle.
8. Boss. Knot hoop. Heartstitch.

## D1 Tidyhouse (`src/42_tidyhouse.js`, tests `tests/tidy.test.mjs`) - tested

Cells are 20x11 rooms on a 4x4 grid; (cx,cy). Entry from Meadowfold (overworld 108,92) into the Foyer.

| Room | Cell | Teaches / puzzle | Solution | Reward | Test |
|---|---|---|---|---|---|
| Foyer | 1,3 | Patience as a timer | Push the wood block (5,5) 2 right onto the plate (7,5) (standard patience), walk to the north gate before it goes home; gate stays open once passed | way north | yes |
| Kitchen | 0,3 | Lift/throw, shatter and reform, crystals | Throw a pot over the low counter at the crystal (4,1); key chest appears. Warm pie (S05) on the table | key 1 | yes |
| Gallery | 2,3 | "A thing at home blocks the way home" | Push the bust (9,5) up into the pocket, push the block (8,5) 2 right through the bust's home onto the plate (walls at (10,6),(11,5),(11,6) so it can't be taken off another way); the bust comes home behind it and holds it there. Standard patience: about a second to spare | Plan | yes |
| Hall of Busts | 1,2 | Heavier shoves lighter | Push the bust (9,6) up 3 (standing on the plate), push the block (8,4) into the lane; the bust coming home shoves the block onto the plate (9,7) and blocks its return. Pushing the block on alone isn't enough (tested) | way to the Ballroom | yes |
| Pantry | 0,2 | Thrown traces cross pits | Throw a crate from (8,5) west onto the island plate; the nook gate opens while it sits there. Staff Only door (S04): push the cupboard aside and stand where it lives | key 2 | yes |
| Parlor | 2,2 | Plates pressed in passing (pulse) | Push the block past the pulse plate; walk to the far door; the block going home over the plate opens it. Standing on the plate and running is too slow | way to the Linen Closets | yes |
| Conservatory | 3,2 | Parity: returns press plates too (toggle plates have a lamp: lit on, dark off) | Carry a crate up the corridor (toggle A on), step on B, throw it back, walk out (A off); the crate going home toggles A on | Heart Patch | yes |
| Linen Closets | 2,1 | Mini-boss: the Dust Monger (armored: only thrown things, shards and coming-home furniture hurt it) | Push the busts so their way home crosses it; throw pots | Gloves | yes (fight by helper) |
| Laundry | 3,1 | Pull (Gloves) | Pull the block out of the cubby 2 tiles, slip in round it, open the chest; push the block out of your way after | key 3 | yes |
| Ballroom | 1,1 | Finale: tidy up. Two busts set out (heavy: they shove Wren aside, so standing in the way does nothing) whose ways home run head-on through one corridor; B's way out of its corner floats over pits | Pull the lever; grip B with the Gloves over the pits (from (5,7) or (3,6)) while A goes through, let go; or after a jam, pull B back out of the corridor and up out of the line. The lever pulled again sets them out again | Pattern | yes (4 tests) |
| Library | 0,1 | Pull a heavy shelf | Pull the tall bookcase (9,1) out: a passage to the Attic. Once the Attic's been found, the bookcase stands aside at (10,2) for good | way to the Attic | yes |
| Attic | 0,0 | Maker's signature room (S06) | Teal M.I. monogram, sampler, a teapot and two cups set out | Heart Patch | yes |
| Antechamber | 2,0 | Rest | Pots (two drop hearts), big door with the Pattern | - | yes |
| The Grand Hall | 1,0 | Boss: the Grand Housekeeper | It guards its own mark; heavy furniture out of place in its hall makes it say "Tsk!" (a ! over it) and go and yank it home; push a bust out toward the wall so it stands on the bust's way home when it yanks: slammed, doors open, hit its heart (3x). Pots just bounce off it | Knot, Heartstitch | yes (real slam test) |

Nudges (Hints): every puzzle room has one (`nudge` in the room def), after 2-4 minutes stuck.
Secrets: S04 Staff Only (pantry), S05 pie (kitchen), S06 signature (attic), Heart Patches in the Conservatory and the Attic.
The shortcut lever by the Ballroom's east door opens the Linen Closets' west door from then on.

## D2 Kiln (`src/45_kiln.js`, `src/44_kiln_kit.js`, tests `tests/kiln.test.mjs`, `tests/kiln_kit.test.mjs`) - tested

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Kiln Door | 1,3 | Shards strike what they pass | Throw a pot through the charm over the pit (key nook); a thrown pot breaks the clay seal north | key 1, way on |
| Long Way Round | 0,3 | Carried path = shard path | Carry the pot under the pulse charm, through the door, to the gate; throw it there | optional, pots |
| Charm Hall | 1,2 | One flight rings many | Walk a pot under all three charms, smash it at the far end | way north |
| Crock Pen | 2,3 | Crocks (enemies) | - | - |
| Sun, Moon, Star | 2,2 | Order: the last walked rings first | Walk under them star-moon-sun | way on |
| Doubling Back | 0,2 | Loop erasure | Round the ring and finish in the spur (not back along the corridor) | key 2 |
| Glazing Room | 2,1 | Mini-boss: the Glazer (its own shot comes home through it) | Hit its shot back past it | Hookline |
| Chasm Gallery | 3,1 | Hookline over chasms | Hook across both | Heart Patch |
| Bridge of Cords | 3,2 | Shards follow reels | Carry a pot while reeling over the drop | way on |
| Furnace Hall | 1,1 | Hook empty marks | Knock the crate off its mark, hook the empty mark, reel over | way on |
| Drying Racks | 0,1 | Combination: four charms, a reel in the middle | One flight with a reel over the pit | Pattern; cracked wall to the Potting Shed |
| Potting Shed | 0,0 | Signature (S06) | Bram's thumbprint B | Heart Patch |
| Glaze Vats | 2,0 | Antechamber | - | - |
| Kiln's Heart | 1,0 | Boss: the Kilnwyrm (follows Wren's footsteps; only shards crack it) | Lay a path through its circuit carrying an urn and smash it so the shards come back along it | Knot, Heartstitch |

## D3 Millrace (`src/49_millrace.js`, `src/49b_millrace_foes.js`, `src/47_water_kit.js`, tests `tests/millrace.test.mjs`, `tests/water_kit.test.mjs`) - tested

Rules: floats (crates, wood, rafts, barrels) drift a tile at a time along currents; the trace grows as they go;
they come home the long way, half speed against the flow. A float whose mark is on a current runs by itself
like a ferry (waits at its mark, goes, waits at the end, comes back). Rafts carry Wren (and what Wren carries).
Wheels watch a water tile: `pulse` turns a while after a float passes, `hold` only while one sits there. The
Paddle: hold C on a float to steer it a tile at a time; paddling holds it (no drift, no return). Strays fill
water in. Deep water can be stepped into on purpose (lean on the edge): Wren sinks and flies home.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Wheel Hall | 1,3 | Drift; a pulse wheel | Push the crate into the race; as it floats past the wheel the north gate opens for a while (and again on its way back) | way north |
| Ferry Pool | 0,3 | A ferry: ride there and back | Board at the landing, ride out to the island, open the chest; it comes back for you on its next run | key 1 |
| Backwash | 2,3 | Hookline + current | Hook the raft over from the landing; it drifts home along the current with Wren aboard to the platform; hop down the ledge | Plan |
| The Carousel | 1,2 | A ring current (hub) | The raft goes round the millstone stopping at home; get on and off at the W, N, E landings. W and E doors locked | - |
| Shard Race | 0,2 | Kiln + rafts | Carry a pot on the ferry under three charms, smash it at the far landing: its shards ride back under them all at once | key 2 |
| Snapjaw's Race | 2,2 | Mini-boss: the Snapjaw (only what the race brings hurts it) | Push crates into the race when it's below and coming up: they drift into it (3x) | Paddle |
| Upstream | 1,1 | Paddle against the current | Paddle up the race to the ledge; to get down, lean into the water and fly home. Big door north; E door locked | key 3 |
| Overflow | 0,1 | Strays fill water | Push two pale stray millstones into the double race to make a crossing | way to the Workshop |
| The Two Wheels | 2,1 | Holding (Paddle or Gloves) | Ride to the first hold-wheel and keep the raft there (paddle, or grip it from the bank) while the sluice lets the crate down to the second; both turn: the Pattern | Pattern |
| Workshop | 0,0 | Signature (S06) | Blue A.R. on the floor; drafting table, model mill | Heart Patch |
| The Millpond | 1,0 | Boss: Old Grindle | Push both barrels into the currents; it gulps them and settles; ride the ferry up to its mouth and strike the gear-heart (3x). On its mouth while it's hungry, it bites you into the water | Knot, Heartstitch |

Keys: 3 keys (Ferry Pool, Shard Race, Upstream), 3 locks (Carousel W and E, Upstream E): any order works.

## Overworld secrets and Heart Patches

| Secret | Where | How | Status |
|---|---|---|---|
| Heart Patch | Meadowfold, behind the windmill (84,84) | walk round behind it | built |
| Linnet note 2 | Meadowfold, under the stray hay bale (100,110) | push the bale: it doesn't come back | built |
| Linnet note 1, portrait (S02) | Gran's house | with the Gloves, Z at the turned picture | built |
| S01 budging | everyone in town | lean on them | built (lines for 17) |
| Heart Patch | Thimble's shop | 120 buttons | built |
| S12 Kids' Housekeeper | the town square, after Knot 1 (Otto's chalk X at hub 38,18) | push a crate straight away from his X and step aside: he comes at it from his side, which is the way it goes home, and his own yank bowls him over. Playground badge | built, tested |
| S19 Behind the falls | Millwater, (171,110) | ride a float down the east side of the river (Paddle): the current turns in behind the falls to a hidden pool; open the chest from the float | built |
| Basin below the falls | Millwater (172,114) | ride over the falls; a chest (50 buttons) and Linnet's bottle | built |
| Lake rafts | Millwater: Wick's pier (146,95) and the north shore (168,83) | two rafts, each homed on its own side: paddle over (needs the Paddle); each goes home | built, tested |
| Shrine boulder | Heights terrace 1 (140,29) | a boulder asleep on the stair; strike the shrine bell beside it | built, tested |
| Heights cave | Heights terrace 1 (158,29) | a boulder asleep in a cave mouth out of the shrine's reach; the Recall Bell | built, tested |
| S29 Returnball | Hollowell, east of the south road (100..107, 73..76), after Knot 4 | carry the ball through all five rings, throw it, step out of its way: it scores 5 on its way home | built, tested |
| Hushwood plateau | the far bank (164..166, 44..49) | over the log bridge; the bouncy moss at the path's end hops you up over the ledge | built, tested |
| S16 The giant's hollow | Hushwood, where Old Hummock slept (131,56) | wake the giant (the Recall Bell); lay the Bedroll up top; climb down: a round door, Linnet's note 6; Homeward back up (or climb the roots, the hard way) | built, tested |
| S18 Bell in flight | anywhere, flying home | ring the Recall Bell while flying home: Wren snaps home at once | built, tested |
| Larkspur's painted hedge | Larkspur, by the fortune teller's (10,47) | knock the flat: a nook with 50 buttons | built, tested |
| Larkspur pen (Heart Patch) | Larkspur, the fakir's pen (50..58, 43..49) | with the Crossbar: the puppet through the little hole, over the nails, onto the plate | built, tested |
| Linnet note 7 | Larkspur, under the carousel's wooden horse (31,62) | with the Crossbar: walk the horse off its spot | built, tested |
| S11 Bedroll in the fog | the valley's edge, e.g. Larkspur's west (x 0..2) | lay the Bedroll near the fog, walk in: pulled home, you come back with a Drift-bloom seed | built, tested (planting: later) |
| S13 The Wren puppet | Marionette Hall, the Rehearsal Room | with the Crossbar: walk the little wooden Wren onto its mark on the Tidyhouse set: a bow, a Heart Patch | built, tested |
| S22 The logbooks | the Underside's Workshops (0,0) | read all six: each Maker reports your real play in their House | built, tested |
| S23 Peepholes | the Seams, under the town | eight peepholes, eight private moments; all eight: a Heart Patch | built, tested |
| Gundry's Bench (Heart Patch) | the Spoolworks, 2,0 (above), up from 2,3 | the Needle through the cord of the crate on the trapdoor | built, tested |
| S28 Tidiness Trials | the Inn's attic, after Knot 1 (`src/53_trials.js`) | 1: block into a pocket, second block on its mouth (20 s); 2: a pot with a 112-tile way home: smash it or carry it back over its own path (15 s); 3: ring the bell, fall into the pit, fly home onto the plate (4 s). 20 + 30 buttons, a Heart Patch; Ives then gives the teal scarf | built, tested |

## D4 Belfry (`src/56_belfry.js`, `src/56b_belfry_foes.js`, kit `src/54_belfry_kit.js`; tests `tests/belfry.test.mjs`, `tests/belfry_kit.test.mjs`, `tests/heights.test.mjs`) - tested

Rules: a bell (struck by the stick, a throw or shards) or the Recall Bell rings: every marked thing out of place
within 7 tiles snaps home at once (fast, force +1). Holding a thing (carry, grip, paddle) keeps it from
snapping; the Recall Bell can be rung while gripping. A ring wakes sleepers (things tied off where they lie: they
go home) and bats. Gusts blow loose light/medium things a tile at a time downwind (not things going home) and
push Wren (she walks at 1.3 a frame; a gust pushes 0.7-1.2); gripping something heavy holds her put.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Bell Porch | 1,4 | A ring wakes a sleeper | Strike the bell: the boulder asleep in the doorway goes home. Two bats wake | way north |
| The Draught | 0,4 | Wind as a conveyor; strays fill pits | Push the two pale stray crates into the lane; the gust blows them into the two pits by the key | key 1 |
| Windward | 2,4 | Wind displaces, a ring recalls | A strong gust (nothing walks home through it) blows the crate off its plate toward the door; it never gets home by itself. Ring the bell early in a lull: it snaps home, the gate (upwind, so nobody slips through in a gust) opens | Plan |
| The Stair | 1,3 | Hub | Bats; north door and east door locked | - |
| Weathercock Walk | 0,3 | Hold on | Cross the walk between pits; when it blows, grip the bust above you | key 2 |
| The Rafters | 2,3 | Optional | Ring: the sleeping slab of wall goes home (and six bats wake) | Heart Patch |
| Clangor's Loft | 1,2 | Mini-boss: Clangor (its own ring snaps things home through it) | Push a bust out so Clangor stands on its way home when it rings: slammed, helm off, hit it (3x) | Recall Bell |
| The Reach | 0,2 | Ring from the right place | Ring near the far sleeper only: it goes home onto the plate and the gate opens while the other sleeps on; wake both and it stays shut (leave the room and they lie down again) | key 3 |
| Echo Room | 2,2 | S15, behind a sleeping slab | Strike the stones in Gran's lullaby: low, high, middle, high, low | Heart Patch, Linnet's note 4 |
| Bell Ropes | 1,1 | Holding beats ringing | Pick up (or grip) the right-hand crate off its plate and ring: the sleeper comes home to the left plate with the right one empty (it counts when it arrives; leave the room and it lies down again) | Pattern |
| Workshop | 0,1 | Signature, behind a sleeping slab | Brass T; bell moulds; tuning forks | Heart Patch |
| The Great Bell | 1,0 | Boss: Tollgrim | The gust blows the clapper out; Tollgrim leans out of the mouth to spit; ring the Recall Bell: the clapper snaps home into him, he drops out dazed; hit him (3x) | Knot, Heartstitch |

Keys: 3 keys (Draught, Weathercock, Reach), 3 locks (Stair N, Stair E to the Rafters, Loft N).

## D5 Slumberhouse (`src/60_slumber.js`, `src/60b_slumber_foes.js`, kit `src/58_bedroll_kit.js`; tests `tests/slumber.test.mjs`, `tests/bedroll_kit.test.mjs`, `tests/hushwood.test.mjs`) - tested

Rules: lie in a bed and it is Wren's mark till she leaves the House or chooses another; rooms don't move it, and a
fall (or a doze in sleep spores) home onto your own bed costs nothing. Flights home follow Wren's trace (loops
erased), over anything that is gone now: crumbling boards give way after whatever stood on them steps off (they
mend when Wren lands from a flight home or leaves the room); dreamcatchers light when a flight passes through. The
Bedroll (from Matron Hush): tap C to lay it anywhere (on a float it goes where the float goes), hold C to fly
Homeward along the trace (from another place, straight to it); what Wren carries comes too. Snorelings wake when
someone walks near them a while, shuffle after you, then go to the nearest bed (a Bedroll counts).

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Night Porch | 1,3 | Beds; boards that go; falls are travel | Lie in the bed; over the boards to the lever on the island; the boards are gone: fall home onto the bed, unhurt | the gate north |
| The Long Ward | 1,2 | Hub; Snorelings | Beds all along; W open, E (lock) and N (lock) | - |
| The Linen Cupboard | 0,2 | One walk over the boards | Light the three toggle lamps in one walk without treading a board twice; fall home | key A |
| The Laundry | 2,2 | The trace remembers a ride | Ride the basket round the current under all three dreamcatchers; step ashore before the loop comes round (or the trace folds up); dive in: flying home lights them all | Plan |
| Mallow's Study | 3,2 | Signature (S06) | Lay the Bedroll on the sleeping barrel by the grate, ring: it snaps home through the grate (riderless floats only); Homeward: you land on it in the study | Heart Patch, Maker's mark |
| The Drying Loft | 2,3 | Bell + Hookline + falls | The hook bounces off the boulder asleep on the pillar; ring it home (and the Snorelings wake); hook over to the island; fall home | key B |
| The Landing | 1,1 | Mini-boss: Matron Hush | She follows your footsteps exactly: cross the boards, they give way under her, she falls and flies home dazed; hit her (3x) | Bedroll |
| The Nursery | 0,1 | Homeward carries | Lay the Bedroll up top, drop into the playpen, pick up the stray toy block (too big to throw), Homeward with it, set it down in the pit under the north door | the way to the fort (lock C) |
| The Moonwalk | 2,1 | Homeward is quicker | Lay the Bedroll by the gate, push the block onto the far plate, Homeward, through the gate before the block goes home | key C |
| Pillow Fort | 0,0 | Bait | Lay the Bedroll on the plate; wake a Snoreling; it chases, gives up and goes to the nearest bed, the Bedroll, and holds the plate | Pattern |
| Mother Sloth's Room | 1,0 | Boss: Mother Sloth | Her arms catch you and reel you to her bed; lay the Bedroll out of reach (the star ring); caught, fly Homeward: too far, the arm snaps; both snapped, she slumps: knock her nightcap (3x). Out of reach she throws pillows | Knot, Heartstitch |

Keys: 3 keys (Linen, Loft, Moonwalk), 3 locks (Ward E, Ward N, Nursery N). Pattern: the Landing's north door.

## D6 Marionette Hall (`src/63_marionette.js`, `src/63b_marionette_foes.js`, kit `src/61_crossbar_kit.js`, the reveal `src/64_reveal1.js`; tests `tests/marionette.test.mjs`, `tests/crossbar_kit.test.mjs`, `tests/larkspur.test.mjs`) - tested

Rules: toy soldiers march straight on and turn at anything in their way (about-turn, or turn right); they weigh on
plates as they pass. Painted flats stand in for walls until knocked down (cardboard). The Crossbar: C at a puppet in
sight (8 tiles, the same room, the side Wren faces) takes its strings; Wren stands still and the arrows walk it a
tile at a time; C or Z lets go and it goes home after its patience. Puppets weigh on plates, fit through the little
holes in walls (tile kind `crawl`), don't mind spikes, won't walk off an edge. A rack holds several puppets: they step
together, the leading ones first, each that can.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Foyer | 1,3 | Soldiers; flats | The east wall wobbles when soldiers pass: knock it down | the way to the Box Office |
| The Box Office | 2,3 | - | Behind the flat | Plan |
| The Auditorium | 1,2 | Hub | Seats; W open, E (lock) and N (lock) | - |
| The Orchestra Pit | 0,2 | Shape a soldier's beat | The drummer goes round the room's edge turning right; push the stray block into the top of his beat: he turns down early, across the plate (a pulse: the gate opens a moment per footfall), and Wren, waiting at the gate, slips through | key A |
| The Rehearsal Room | 2,2 | Bedroll | Lay it up top, drop through the trapdoor to the key, Homeward (or the hole in the under-stage floor, which hurts). S13 later | key B |
| The Wings | 1,1 | Mini-boss: Captain Tin | He marches between two flats; knock one as he comes and he marches on into the trapdoor behind it; dazed, hit him (3x). The flats spring back up; the east door opens when he falls | Crossbar |
| The Dressing Rooms | 0,1 | Crossbar | The puppet through three little holes and over the nails onto the plate | key C |
| The Prop Store | 2,1 | A rack | Three puppets on one rack, walls holding some back: DRDRDRRDRURUR puts all three on the plates | Pattern |
| Jory's Workshop | 2,0 | Signature | A lone puppet through the little hole in the Prop Store's north wall onto the plate inside: the door opens for good | Maker's mark, 50 buttons |
| The Great Stage | 1,0 | Boss: the Great Marionette | Two little Wrens on a rack: line them up against its feet (walk them so the feet stop them), then walk them all the way round: both strings tangle, it falls; knock its head (3x). Sandbags fall where you stand (a hit makes you let go) | Knot, Heartstitch; Reveal 1 |

Keys: 3 keys (Pit, Rehearsal, Dressing), 2 locks (Auditorium E, Auditorium N): one spare whichever order. Pattern: the Wings' north door.

## D7 The Spoolworks (`src/67_spoolworks.js`, `src/67b_spool_foes.js`, kit `src/65_spool_kit.js`; tests `tests/spoolworks.test.mjs`, `tests/spool_kit.test.mjs`) - tested

Rules: every room is two, the Works floor and, 33 rows below, the Under-works, joined by hatches (a trapdoor up top,
a ladder below; something standing where you'd come out keeps the trapdoor shut). Below, what's up above shows
through faintly, and a cord hangs under every mark: tap Z for a tug (whatever it holds snaps home; at home, it jumps),
hold Z to tie it off (held exactly where it is: no pushing, pulling, lifting, drifting, going home), Z on a knot to
undo it. Counterweights are heavy weights on plates below; what's up above answers to the plate. The Needle (from
Cog): face a thing, or its cord from below; C; walk the needle up to 4 tiles; C: its place now, for good (kept when the
place is built afresh). Three stitches at a time, a fourth undoes the oldest; a stray can be given a place; the Needle
on a stitched thing offers to unpick it.

| Room (above / below) | Cells | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Gatehouse / Under the Gatehouse | 1,2 / 1,5 | Two layers; untie | The crate in the passage is tied off from below: down the trapdoor, undo its knot, and it goes home | the way in |
| The Winding Hall / Under | 1,1 / 1,4 | Counterweights | The Spool Store gate is shut while its weight sits on its plate below: push the weight off, push the stray stone into its way home (one push), up the far hatch and through (it latches once passed) | the Spool Store |
| The Spool Store / Under | 0,1 / 0,4 | Tie off | Push the block onto the plate, down the hatch, tie its cord off before its patience runs out: the gate stays open | key; the Plan (below) |
| The Kennel / Under | 2,1 / 2,4 | Mini-boss: Cog | Brass hide (the stick clangs); his cord hangs under his kennel. Go below (he sniffs, then trots home), tie him off, come up and knock him: he bolts; 3x | the Needle |
| Under the Spool Store, north | 0,4 | The Needle | The weight in the passage can't be pushed by anyone: give it a new place in the alcove | the way to the Loft |
| The Bobbin Loft / Under | 0,0 / 0,3 | Three stitches and a knot | Four plates that only an iron-cored bobbin works: stitch three bobbins onto three plates (4 tiles each), push the fourth on and tie it off from below | Pattern; the way out to the Store latches |
| Gundry's Bench / Under | 2,0 / 2,3 | The Needle through a cord | The crate on the trapdoor's far side keeps it shut: from below, the Needle through its cord moves it off | Maker's mark (G.G., and an old L.), Heart Patch |
| The Heart of the Works / Under | 1,0 / 1,3 | Boss: the Tangle | Four bobbins tie it together: all four off their first places at once (for a moment) and it comes apart round its core: three stitched away, the fourth pushed off and tied below; knock the core; it yanks every thread back (stitches undone, knots slipped); 3x. Yarn balls and lashes meanwhile | Heartstitch; apprenticeship (d7) |

Keys: one key (Spool Store) for one lock (the Kennel). Pattern: the Heart's big door.

