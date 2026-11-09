# HOLLOWELL: Dungeon Tracker

> Spoilers. Every dungeon, its grammar, rooms, secrets and status. Status keys:
> `planned` → `built` (playable) → `tested` (scripted solution passes in tests/) → `polished`.

| Id | Dungeon | Region | Grammar | Tool | Boss | Status |
|---|---|---|---|---|---|---|
| D1 | Tidyhouse | Meadowfold | The Return (timing, passing plates, ramming, path shape) | Gloves | Grand Housekeeper | tested |
| D2 | Kiln | Kilnridge | Shards retrace the carried path | Hookline | Kilnwyrm | tested |
| D3 | Millrace | Millwater | Currents vs the Return; rafts | Paddle | Old Grindle | tested |
| D4 | Belfry | Belfry Heights | Wind displaces; bells snap home; sleepers | Recall Bell | Tollgrim | planned |
| D5 | Slumberhouse | Hushwood | Your own mark; falls as travel | Bedroll | Mother Sloth | planned |
| D6 | Marionette Hall | Larkspur Fair | Remote bodies; synchronised puppets; flats | Crossbar | Great Marionette | planned |
| D7 | Spoolworks | Underside | Two layers; cords; counterweights; linking | Needle | The Tangle | planned |
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
| S28 Tidiness Trials | the Inn's attic, after Knot 1 (`src/53_trials.js`) | 1: block into a pocket, second block on its mouth (20 s); 2: a pot with a 112-tile way home: smash it or carry it back over its own path (15 s); 3: ring the bell, fall into the pit, fly home onto the plate (4 s). 20 + 30 buttons, a Heart Patch; Ives then gives the teal scarf | built, tested |

## D4 Belfry (planned: `src/56_belfry.js`, `src/56b_belfry_foes.js`, kit `src/54_belfry_kit.js`)

Rules (kit tested in `tests/belfry_kit.test.mjs`): a bell (struck by stick, throw or shards) or the Recall Bell
rings: every marked thing out of place within 7 tiles snaps home at once (fast, force +1: a snapped bust
shoves a stone block; a snapped crate shoves a crate). A ring wakes sleepers (things tied off where they lie:
they go home) and bats. Gusts blow loose light/medium things a tile at a time downwind and push Wren.

Grid 3x5 (a tower), entry at the bottom middle.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Bell Porch | 1,4 | A ring wakes sleepers | A boulder asleep across the stair north; strike the bell: it goes home. Two bats wake too | way north |
| The Draught | 0,4 | Wind as a conveyor; strays fill pits | Line up two pale stray crates in the gust's lanes; the gust blows them into the pits round the key's island, filling a way | key 1 |
| Hard Ringing | 2,4 | Snapped things shove harder | Push the bust out, push the stone onto its way home (it waits behind it); ring: the bust snaps home and shoves the stone onto the plate | Plan |
| The Stair | 1,3 | Hub | Doors W, E; north door locked; bats in the rafters | - |
| Rafters | 0,3 | Bells and wind together | A gust carries a crate along; ring the bell at the right moment to snap it home through a plate in passing (pulse) | key 2 |
| Weathercock Hall | 2,3 | Gust timing; sleepers on plates | Wake sleepers in order so they snap over a plate while the gust holds a gate... | way up E |
| Clangor's Loft | 1,2 | Mini-boss: Clangor (a bell-headed suit of armour; its own ring snaps things home through it) | Push busts out across its path; when it rings, they snap home through it | Recall Bell |
| Echo Room | 2,2 | S15: bell-stones in the order of Gran's lullaby | Ring the stones in the lullaby's order (hummed by Gran at bedtime) | Heart Patch, Linnet's note 4 |
| The Reach | 0,2 | Recall Bell: ring from the right place | Ring where only the right things are within reach | key 3 |
| Bell Ropes | 1,1 | Recall Bell + Hookline + paddle-less raft? | ... | Pattern |
| Workshop | 0,1 | Signature | Tess's brass T | Heart Patch |
| The Great Bell | 1,0 | Boss: Tollgrim | The gargoyle hides in the great bell; the gust blows its clapper out; ring the Recall Bell as the clapper swings back so it slams home into the gargoyle | Knot, Heartstitch |
