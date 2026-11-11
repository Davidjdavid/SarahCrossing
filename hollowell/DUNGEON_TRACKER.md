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
| D8 | Loom | Loomwood | Permanence: offcuts (strays), the old weights cut free, silk walls and bridges, a thread pulled tight cut anywhere; no nudges | Shears | The Weaver | tested |
| F | Great Spool | under the Well | The Pull (out of place, things are wound north into the drum and laid back on their place); six Knot rooms, each a House's grammar under the Pull with another House's tool; a fair Climb | – | The Spool | tested |
| O1 | Stray House | Frayed Edge | Nothing returns: order, room, holes filled for good; the Needle gives a stray a place | Linnet's bracelet, Heartstitch | The Pile | tested |
| O2 | Unfinished House | Hollowell, east bank | Chalk planks sewn real with the Needle: three stitches at once, a fourth undoes the oldest | Long Hook | – (Mr Ives's walk) | tested |
| M | The Makings (×8, and Wren's own) | Underside | Indirect control: Tuck walks by four rules (and from the sixth, Otto the Housekeeper by his); you work from below; the last one you set out yourself | – | – | tested |

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
| Linen Closets | 2,1 | Mini-boss: the Dust Monger (armored: only thrown things, shards and coming-home furniture hurt it) | Push the busts so their way home crosses it; throw pots. Moves: its belly flop (crouches 40 frames, shivering; its shadow where Wren stood; a heart). Test: tidy.test.mjs (the flop dodged and not) | Gloves | yes (fight by helper) |
| Laundry | 3,1 | Pull (Gloves) | Pull the block out of the cubby 2 tiles, slip in round it, open the chest; push the block out of your way after | key 3 | yes |
| Ballroom | 1,1 | Finale: tidy up. Two busts set out (heavy: they shove Wren aside, so standing in the way does nothing) whose ways home run head-on through one corridor; B's way out of its corner floats over pits | Pull the lever; grip B with the Gloves over the pits (from (5,7) or (3,6)) while A goes through, let go; or after a jam, pull B back out of the corridor and up out of the line. The lever pulled again sets them out again | Pattern | yes (4 tests) |
| Library | 0,1 | Pull a heavy shelf | Pull the tall bookcase (9,1) out: a passage to the Attic. Once the Attic's been found, the bookcase stands aside at (10,2) for good | way to the Attic | yes |
| Attic | 0,0 | Maker's signature room (S06) | Teal M.I. monogram, sampler, a teapot and two cups set out | Heart Patch | yes |
| Antechamber | 2,0 | Rest | Pots (two drop hearts), big door with the Pattern | - | yes |
| The Grand Hall | 1,0 | Boss: the Grand Housekeeper | It guards its own mark; heavy furniture out of place in its hall makes it say "Tsk!" (a ! over it) and go and yank it home; push a bust out toward the wall so it stands on the bust's way home when it yanks: slammed, doors open, hit its heart (3x). Pots just bounce off it. Moves (tells 40/36/32 frames): the charge down its lit lane (beats 1-2, a heart), the stamp in a ring drawn round it (half a heart), and in beat 3 a coat-hanger flung along a lit line that lies on its thread and comes home (half a heart each way); a heart drops each beat; the hall's pots hold hearts. Tests: tidy.test.mjs (the win under its moves; each move dodged and not) | Knot, Heartstitch | yes (real slam test) |

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
| Sun, Moon, Star | 2,2 | Order: the last walked rings first | They must ring sun, moon, star (the mural), and each only rings a moment, so one at a time they die away before the next: one flight. Walk under them star-moon-sun and smash the pot | way on |
| Doubling Back | 0,2 | Loop erasure | Round the ring and finish in the spur (not back along the corridor) | key 2 |
| Glazing Room | 2,1 | Mini-boss: the Glazer (its own shot comes home through it) | Hit its shot back past it. Moves: its shot's line lit while it aims (36 frames); too close, it braces (shield up, "!", the tiles ahead lit) and barges (a heart) | Hookline |
| Chasm Gallery | 3,1 | Hookline over chasms | Hook across both | Heart Patch |
| Bridge of Cords | 3,2 | Shards follow reels | Carry a pot while reeling over the drop | way on |
| Furnace Hall | 1,1 | Hook empty marks | Knock the crate off its mark, hook the empty mark, reel over | way on |
| Drying Racks | 0,1 | Combination: four charms, a reel in the middle | One flight with a reel over the pit | Pattern; cracked wall to the Potting Shed |
| Potting Shed | 0,0 | Signature (S06) | Bram's thumbprint B | Heart Patch |
| Glaze Vats | 2,0 | Antechamber | - | - |
| Kiln's Heart | 1,0 | Boss: the Kilnwyrm (follows Wren's footsteps; only shards crack it) | Lay a path through its circuit carrying an urn and smash it so the shards come back along it. Moves (tells 36/32/29): beat 1 it rears and darts along her footprints (a heart); beat 2 a glaze glob where she stood (shadow first), its puddle burning a few seconds; beat 3 it sheds pieces round the pit (shadows first) that lie on their threads and fly home (half a heart each); a heart each beat. Tests: kiln.test.mjs | Knot, Heartstitch |

## D3 Millrace (`src/49_millrace.js`, `src/49b_millrace_foes.js`, `src/47_water_kit.js`, tests `tests/millrace.test.mjs`, `tests/water_kit.test.mjs`) - tested

Rules: floats (crates, wood, rafts, barrels) drift a tile at a time along currents; the trace grows as they go;
they come home the long way, half speed against the flow. A float whose mark is on a current runs by itself
like a ferry (waits at its mark, goes, waits at the end, comes back). Rafts carry Wren (and what Wren carries).
Wheels watch a water tile: `pulse` turns a while after a float passes, `hold` only while one sits there. The
Paddle: hold C on a float to steer it a tile at a time; paddling holds it (no drift, no return). Strays fill
water in. Deep water can be stepped into on purpose (lean on the edge): Wren sinks and flies home. A ferry bell
(a bell on a post by a landing): rung, its ferry stops waiting (at home it sets off now; at the far end it starts
home now). A float coming home onto the bank with Wren aboard sets her down beside it.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Wheel Hall | 1,3 | Drift; a pulse wheel | Push the crate into the race; as it floats past the wheel the north gate opens for a while (and again on its way back) | way north |
| Ferry Pool | 0,3 | A ferry: ride there and back | Board at the landing, ride out to the island, open the chest; it comes back for you, or ring the bell on the island (from aboard it starts home at once) | key 1 |
| Backwash | 2,3 | Hookline + current | Hook the raft over from the landing; it drifts home along the current with Wren aboard to the platform; hop down the ledge | Plan |
| The Carousel | 1,2 | A ring current (hub) | The raft goes round the millstone stopping at home; get on and off at the W, N, E landings. W door locked | - |
| Shard Race | 0,2 | Kiln + rafts (optional) | Carry a pot on the ferry under three charms, smash it at the far landing: its shards ride back under them all at once | Heart Patch |
| Snapjaw's Race | 2,2 | Mini-boss: the Snapjaw (only what the race brings hurts it; it ducks anything floating its way, but reared up at Wren on the bank it hunts along the bank a good while, its back to the race) | Bait it up beside a crate, step back out of its reach (the snap misses), push the crate down onto it (2x). Moves: its bite, the bank's edge beside it lit while its jaws are open (a heart) | Paddle |
| Upstream | 1,1 | Paddle against the current | Paddle up the race to the ledge (key); the ledge runs east onto the upper floor and the lock to the Two Wheels (the foot of the race doesn't reach it); to get down, lean into the water and fly home. Big door north | key 2 |
| Overflow | 0,1 | Strays fill water | Push two pale stray millstones into the double race to make a crossing | way to the Workshop |
| The Two Wheels | 2,1 | Holding (Paddle or Gloves) | Ride to the first hold-wheel and keep the raft there (paddle, or grip it from the bank) while the sluice lets the crate down to the second; both turn: the sluice north lifts | way north |
| The Lock | 2,0 | Synthesis (Tidyhouse: a thing at home blocks the way home, heavier shoves lighter; Kiln: the Hookline): a hold wheel kept turning with nobody holding | The keeper's wheel lifts the far gate only while something floats on its water, a dead end past the log's mooring. Hook the log (wood: medium, floats) away down the race (or paddle it), push the crate into the race behind it: the log coming home shoves the crate past its mooring onto the wheel's water, then sits in its way home for good | way east; big door W into the Millpond |
| The Bell Race | 3,0 | Synthesis (Kiln: order, loop erasure, shards follow reels; Millrace: the ferry's way home) | The bells must ring sun, moon, star (the carving), each before the last has died away (thrown at from the bank one at a time, they never do: one flight); the ferry passes them that way going out, so a pot ridden out rings them backwards, and out-and-back unpicks itself. Get a pot to the far end some other way (hook over to the island; or hook the ferry over from the bank while it waits there; or paddle round) and ride the ferry home past star, moon, sun; smash it on the landing | Pattern (buttons for a game that already held it) |
| Workshop | 0,0 | Signature (S06) | Blue A.R. on the floor; drafting table, model mill | Heart Patch |
| The Millpond | 1,0 | Boss: Old Grindle, three rounds. It swallows whatever float comes to rest in its open mouth (a rider is snapped off first); one fills it and it settles, heart showing. Struck, it sulks till Wren is wholly ashore, then turns the sluice (the races run another way). It spits at Wren on the bank, never on the water | 1: a barrel down a side race into its mouth; the ferry (rung off at once) to just below it; strike. 2: the side races run away from it and the ferry race into it: it eats the ferry; ride a barrel up beside it (the Paddle) and strike. 3: jaw shut (only shards: the stick and thrown things clang); one race runs past its teeth, the raft's landing still: push off with a pot aboard, smash it once past the teeth. Moves (at Wren on the bank only; tells 32/29/26): spit (1, 2, 3 blobs, half a heart); from round 2 a wash over the bank's edge near her, lit first (a heart; also while it's full); round 3 rivets along lit lines that come home along their threads (half a heart each way); a heart each round. Tests: millrace.test.mjs (the rounds under its blows; each blow dodged and not) | Knot, Heartstitch |

Keys: 2 keys (Ferry Pool, Upstream), 2 locks (Carousel W to the Shard Race, Upstream E on the upper floor): any order
works. The House's end (the Two Wheels, the Lock, the Bell Race, the Millpond's two big doors) starts from the top of
the race, so nobody meets Old Grindle without the Paddle.
Dressing: wet mossy flagstones; slatted boardwalks over channels (Wheel Hall, the Lock, the Bell Race, the Millpond's
landing); the Lock's lower basin; the Millpond's sluice wheel over the intake (it turns between rounds); ferry bells.
Tests: every room's solution; the Snapjaw's two knocks (no damage) and its duck and bite; each Grindle round, the
ferry eaten, the clang in round 3, ashore before the sluice turns, no spit on the water, the bite; the Lock (and the
crate alone or the log home: no); the Bell Race (two ways; ridden out wrong; the round trip unpicks; thrown at from the bank one at a time, they die away); the way to the
boss; the bells; an old save's Pattern; the upper floor. Scripted playthrough (LEG3) with no god mode; probe: clean.

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
| S30 Tuck's Ahas | the Makings | all three Ahas in all nine Makings (Wren's own too): Tuck's drawing | built, tested |
| S32 The gate counterweight | the Seams (east), 57,16 | the Needle on the north gate's counterweight before Reveal 2 (after it, it's the way on) | built, tested |
| S33 Fainting, knowing | anywhere after Reveal 2 | faint: a different waking | built, tested |
| S24 Old Arlo's walk | Hollowell, after the Shears | cut Arlo free and follow him to the river bank: a Heart Patch | built, tested |
| Loomwood clearing (Heart Patch) | Loomwood, east of the stream (57,10 in the block) | cut the silk strand across the gap (56,16) | built |
| The Spinner's Room (Heart Patch) | the Loom, west of the Shuttle Run | cut the silk across the west doorway | built, tested |
| S28 Tidiness Trials | the Inn's attic, after Knot 1 (`src/53_trials.js`) | 1: block into a pocket, second block on its mouth (20 s); 2: a pot with a 112-tile way home: smash it or carry it back over its own path (15 s); 3: ring the bell, fall into the pit, fly home onto the plate (4 s). 20 + 30 buttons, a Heart Patch; Ives then gives the teal scarf | built, tested |
| Kiln forecourt (on the road) | Kilnridge, the Kiln's gate (22,96) | set a pot in the wet mouth of the vent by the road (25,97) and let it fire into the hole in the rock (25,99): the gate opens for good. Shown on the road in: two old vents four steps apart (40/44,101) throw a pot back and forth, mouth to mouth | built, tested (LEG2) |
| The Firing Ground (Heart Patch) | Kilnridge, the pit (11–28, 108–114) | shove the crate off the row into the wet clay (it sticks there); throw a pot into the vent's mouth (14,111); stand on the plate (12,113) when it fires: through the gate into the kiln-charm. Bram's first pot (24,113) | built, tested |
| The sleeping vent (50 buttons) | Kilnridge (14,94), the Kiln Mesa's chimney (14,88) | the Recall Bell wakes the boulder asleep on the vent; a pot in its mouth fires up the chimney: the cache on the mesa (17,90) | built, tested |
| The clay dam (Heart Patch) | Kilnridge, the slot (60,96) | thrown pots only crack it; the Needle gives a pot its place in the vent's mouth below (60,100): fired, it breaks the dam; the patch at the slot's head (60,86) | built, tested |
| The Old Fold (the clapper) | Meadowfold (68–82, 90–98) | drive Nettle round the fold against the count and leave her: walking home she counts yan, tan, tethera; the tally box (81,91) | built, tested |
| Old Tup's bothy (Heart Patch) | Meadowfold (75,95) | the Recall Bell: the ram asleep in the doorway goes home | built, tested |
| S17 Lucky | Meadowfold, the east bank (119,112) | hook her over the river; the Needle gives her a place on this bank before she goes home: Pip's Heart Patch | built, tested |
| Heron Rock (Heart Patch) | Millwater (177–181, 91–95) | reel the barrel ashore from 179,98, lift it out of the line, hook its empty mark; back by the post (178,99) | built, tested |
| The Crags (Heart Patch, the Ringers' Stone) | Heights (131–152, 11–17) | the Hookline across four ways: eyelet, a mark the gust empties, a sleeper's empty mark, a pot's mark emptied by hand | built, tested |
| The Eyrie (Heart Patch) | Heights (183–188, 1–3) | the Shears on the crate the draught drops into the crevice: it fills it for good | built, tested |
| The ringers' old bell | Heights (161,32) | hang the clapper from the Old Fold; a strike wakes the cave's boulder before the Recall Bell | built, tested |
| Mallow's nursery (the way into the Slumberhouse) | Hushwood, the bank before the door (143–152, 54–56) | somebody asleep in each cradle (a lamp over the door for each, on a cord to it). Snorelings keep the House's rule: woken, they follow a while, then lie down in the nearest bed they can get to (their own spot, a cradle, the Bedroll). The one asleep in the road (136,60) wakes as Wren passes and, left behind, lies down in the cradle by the road (141,61) or, followed over the moss, in the first garden cradle. Rung from the north bank by the far cradles, two of Mallow's come and slip into the cradles under her and lie down there; the third woken by treading near and led to the last free one (or round to the far one, lured along the near bank). A puffball still puts one down at once | built, tested (LEG5) |
| The wooden one (30 buttons) | Hushwood, by the Slumberhouse (142,47) | with the three asleep, the Crossbar walks the wooden Snoreling through the hole in the hedge into the fourth cradle | built, tested |
| Lantern Pond (Heart Patch) | Hushwood (151–165, 65–73) | four lanterns lit while their plates hold the mossy stones: three stitches, the fourth stone pushed on and gripped; the isle's chest (158,68) | built, tested |
| The old loom weight | Hushwood, Lantern Pond's isle (159,69) | on the isle from the first raft trip; fits any Loomwood socket for good | built, tested |
| The parade gate (the way into the Hall) | Larkspur, the forecourt (29–33, 51–53) | trap each toy soldier on its drum pad with a pale stray crate from the west of the fair; the fair's own go home | built, tested (LEG6) |
| The balloon | Larkspur by the fog (5,70) → the Drift (58,6) | cut its thread; later, in the Drift, its basket: the whole Drift on the map; Linnet saw it | built, tested |
| The warp (the way into the Loom) | Loomwood, the Loom's door (94–96,10) | four sockets: three stitches and one pushed on by the door; or the Bedroll and Homeward; or the old weight. The four cords are strung over the birches, so the far one can be followed by eye from the door | built, tested (LEG8) |
| The old mill (50 buttons) | the Drift (37–48, 2–13) | the wheel turns only for a riderless float: the Needle gives a barrel its place by the wheel, or the stray boulder dams the race under it; the pond runs out for good: the old road, its milestone, a toll box (41,10) | built, tested |

## D4 Belfry (`src/56_belfry.js`, `src/56b_belfry_foes.js`, kit `src/54_belfry_kit.js`; tests `tests/belfry.test.mjs`, `tests/belfry_kit.test.mjs`, `tests/review_d4.test.mjs`, `tests/heights.test.mjs`) - tested

Rules: a bell (struck by the stick, a throw or shards) or the Recall Bell rings: every marked thing out of place
within 7 tiles snaps home at once (fast, force +1). Holding a thing (carry, grip, paddle) keeps it from
snapping; the Recall Bell can be rung while gripping. A ring wakes sleepers (things tied off where they lie: they
go home) and bats. Gusts blow loose light/medium things a tile at a time downwind (not things going home) and
push Wren (she walks at 1.3 a frame; a gust pushes 0.7-1.2); gripping something heavy holds her put. A thing on the
Hookline is held by the line (no wind moves it). A ring is heard, like a sleeper hears it, seven strides off: every ring
draws its reach, a dotted ring out to it that holds a moment (stopping at the room's walls), and the Bell's own text says
its snap shoves harder than a plain return (the blind solvers' round 2, `tests/review_blind_a.test.mjs`).

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| Bell Porch | 1,4 | A ring wakes a sleeper | Strike the bell: the boulder asleep in the doorway goes home. Two bats wake | way north |
| The Draught | 0,4 | Wind as a conveyor; strays fill pits | Push the two pale stray crates into the lane; the gust blows them into the two pits by the key | key 1 |
| Windward | 2,4 | Wind displaces, a ring recalls | A strong gust (nothing walks home through it) blows the crate off its plate toward the door; it never gets home by itself. Ring the bell early in a lull: it snaps home, the gate (upwind, so nobody slips through in a gust) opens | Plan |
| The Stair | 1,3 | Hub | Bats; north door and east door locked | - |
| Weathercock Walk | 0,3 | Hold on | Cross the walk between pits; when it blows, grip the bust above you | key 2 |
| The Rafters | 2,3 | Optional | Ring: the sleeping slab of wall goes home (and six bats wake) | Heart Patch |
| Clangor's Loft | 1,2 | Mini-boss: Clangor (its own ring snaps things home through it) | Push a bust out so Clangor stands on its way home when it rings: slammed, helm off, hit it (2x). Moves: its ring's reach drawn round it through the wind-up (a heart) | Recall Bell |
| The Reach | 0,2 | Ring from the right place | Ring near the far sleeper only: it goes home onto the plate and the gate opens while the other sleeps on; wake both and it stays shut (leave the room and they lie down again) | key 3 |
| Echo Room | 2,2 | S15, behind a sleeping slab | Strike the stones in Gran's lullaby: low, high, middle, high, low | Heart Patch, Linnet's note 4 |
| Bell Ropes | 1,1 | Holding beats ringing | Pick up (or grip) the right-hand crate off its plate and ring: the sleeper comes home to the left plate with the right one empty (it counts when it arrives; leave the room and it lies down again). The east gate opens with it; the bell stair north is barred from above until Tollgrim's beaten | Pattern, way east |
| Workshop | 0,1 | Signature, behind a sleeping slab | Brass T; bell moulds; tuning forks | Heart Patch |
| The Bell Frame | 2,1 | Synthesis (Tidyhouse: a thing at home blocks the way home; Kiln: a thing goes home the way it went, and a thread can't knot): the boulder home first holds the crate on the plate | The plate in the frame's narrow gap holds the north gate; the sleeping boulder's place is the gap's top. Carry the crate the long way round (up the east side), throw it down the gap (or carry it down through the boulder's place and the plate), ring: the boulder is home before the crate and it waits on the plate. Carried up the gap and back, the thread undoes itself; thrown up onto the plate after the boulder's home, it goes home long before Wren's at the gate | way north |
| The Cistern | 2,0 | Synthesis (Kiln: the Hookline, a returning thing hangs on its thread over a drop; Millrace: a float going home carries its rider; Belfry: nothing walks home through a strong wind, a snap does) | The floor's fallen in: a shaft between the near pool and the far channel. Hook the raft over from its mooring; the gale (it never lets up) pins it at the foot of the pool; step aboard, ring: it snaps home across the shaft with Wren on it. Waiting aboard, or paddled to the edge, it never goes; its empty mark hooked, Wren lands in the water. A lever on the far side lets the drawbridge down (down anyway once Tollgrim's beaten) | big door W (Pattern) |
| The Great Bell | 1,0 | Boss: Tollgrim (only the clapper coming home hard knocks him out of the bell's mouth), three beats | 1: the draught down through the bell blows the clapper out; he leans out to spit; ring: it slams home into him; he drops out dazed: hit him. 2: he heaves the bell round, the east shutters bang open and a gale blows along under it without a let-up (the vanes swing), laying the clapper by the west wall; and he listens: a ring within seven strides of him and he ducks before it's home. Ring from beside the clapper, out of his hearing, or strike the old bell in the west bay. 3: he watches Wren (his eyes in the bell's mouth go red when she's in reach of the clapper) and stays in while she could ring it: carry a pot under the old bell and off to the far side, smash it: its pieces fly home under the old bell and ring it from afar. About 30 s for a player who never hesitates (was 96). Moves (tells 28/25/22): gravel spat after his cheeks puff (one; a burst of three; a fan of three); from beat 2 he pounds the bell and mortar falls, shadows first (a heart); beat 3 he lunges at Wren under the mouth, the floor there lit (a heart); two knocks a beat; a heart each beat. Tests: belfry.test.mjs, review_d4.test.mjs | Knot, Heartstitch |

Keys: 3 keys (Draught, Weathercock, Reach), 3 locks (Stair N, Stair E to the Rafters, Loft N). The way up after the Pattern:
Bell Ropes E (opened by the Pattern's plates), the Bell Frame, the Cistern, the big door into the Great Bell from the east
(the old stair north from Bell Ropes opens from above once Tollgrim's beaten). A game that opened the big door when it was in
Bell Ropes finds it open (same id). No softlock: the frame's gate stays open once passed, its boulder lies down again while
it isn't; the Cistern's drawbridge lever is on the far side.
Dressing: broad oak boards laid across, nailed with brass (not the plank floor of the other Houses), a brass-bound ringers'
runner up the Porch and the Stair; the Bell Frame's beams with a
bell and bell-ropes; the Cistern's broken lip, trickles into the shaft, puddles, downpipe and hauled-up drawbridge; the Great
Bell's east shutters (open in the second and third beats).
Tests: every room's solution; Clangor's two knocks; each of Tollgrim's beats (the stick clangs, he doesn't duck in beat 1, he
ducks at a ring he hears in beat 2, the old bell, he stays in by the clapper in beat 3 and a thrown pot at the old bell does
nothing, the pot's pieces from afar); the Bell Frame (long way round, thrown from the mouth, the thread undoing itself, rung
first, Wren sandwiched lifts the crate); the Cistern (the ride, waiting and paddling never cross, the empty mark); the way up and
the stair; an old save's big door; saving and loading (the drawbridge stays down, a fight saved mid-way starts over); both new
rooms' nudges; the kit's hook-held and switched-off gusts. Scripted playthrough (LEG4); probe: clean.

## D5 Slumberhouse (`src/60_slumber.js`, `src/60b_slumber_foes.js`, kit `src/58_bedroll_kit.js`; tests `tests/slumber.test.mjs`, `tests/bedroll_kit.test.mjs`, `tests/review_d5.test.mjs`, `tests/hushwood.test.mjs`) - tested

Rules: lie in a bed and it is Wren's mark till she leaves the House or chooses another; rooms don't move it, and a
fall (or a doze in sleep spores) home onto your own bed costs nothing. Flights home follow Wren's trace (loops
erased), over anything that is gone now: crumbling boards give way after whatever stood on them steps off (they
mend when Wren lands from a flight home or leaves the room); dreamcatchers light when a flight passes through. The
Bedroll (from Matron Hush): tap C to lay it anywhere (on a float it goes where the float goes), hold C to fly
Homeward along the trace (from another place, straight to it); what Wren carries comes too, and its trace (so its
shards' way home) runs along the flight as along a reel. The Recall Bell rung in mid-flight snaps Wren home at once
(S18), round, not through: nothing the rest of the flight would have passed hears of it. Snorelings wake when someone
walks near them a while, shuffle after you, then go to the nearest bed they can get to (their own spot, a cradle nobody's
in, a Bedroll), the same in Hushwood. Rolled up, the Bedroll gives Wren back the room's own mark, the doorway she came in
by, her thread to it drawn straight (shown a moment), so a fall then flies her straight to it, through whatever's between
(Mallow's Study has no other way out). Bedsprings: indoor bouncy moss, sprung one way, three tiles.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Night Porch | 1,3 | Beds; boards that go; falls are travel | Lie in the bed; over the boards to the lever on the island; the boards are gone: fall home onto the bed, unhurt | the gate north |
| The Long Ward | 1,2 | Hub; Snorelings | Beds all along; W open, E (lock) and N (lock) | - |
| The Linen Cupboard | 0,2 | One walk over the boards | Light the three toggle lamps in one walk without treading a board twice; fall home | key A |
| The Laundry | 2,2 | The trace remembers a ride | Ride the basket round the current under all three dreamcatchers; step ashore before the loop comes round (or the trace folds up); dive in: flying home lights them all | Plan |
| Mallow's Study | 3,2 | Signature (S06) | Lay the Bedroll on the sleeping barrel by the grate, ring: it snaps home through the grate (riderless floats only); Homeward: you land on it in the study. No door out: the Bedroll's your place, so a fall only brings you back to it; rolled up, your place is the doorway you came into the laundry by, your thread drawn straight to it, and a drop in the water flies you there (the rule the Dreaming Door can also be done by) | Heart Patch, Maker's mark |
| The Drying Loft | 2,3 | Hookline + an empty mark; the Bell the wrong idea; falls | A boulder sleeps up top; its own place is out on the island, empty while it sleeps: hook over onto it, take the key, fall home. Rung awake, it goes home and fills its place (the hook then only drops you in the drop); leave and it lies down again | key B |
| The Landing | 1,1 | Mini-boss: Matron Hush | She follows your footsteps exactly: cross the boards, they give way under her, she falls and flies home dazed; hit her (2x). Moves: now and then she stops dead and puffs up (her "!", 26 frames), then comes on twice as fast for a second (a heart) | Bedroll |
| The Nursery | 0,1 | Homeward carries | Lay the Bedroll up top, drop into the playpen, pick up the stray toy block (too big to throw), Homeward with it, set it down in the pit under the north door | the way to the fort (lock C) |
| The Moonwalk | 2,1 | Homeward is quicker | Lay the Bedroll by the gate, push the block onto the far plate, Homeward, through the gate before the block goes home. North: lock D to the Milk Kitchen | key C |
| Pillow Fort | 0,0 | Bait | Lay the Bedroll on the plate; wake a Snoreling; it chases, gives up and goes to the nearest bed, the Bedroll, and holds the plate | key D |
| The Milk Kitchen | 2,0 | Synthesis (Kiln: a broken pot's pieces fly home the way it was carried, ringing a bell hung where only flying things reach; Slumber: Homeward carries, the Bedroll as the way back) | A gap the full height of the room; the old bedsprings go one way only, west, across it; the milk jug on the far side; the little bell hangs over the middle of the gap, five tiles from either side (no throw reaches it). Lay the Bedroll this side, spring across, take the jug, Homeward with it (its trace follows the flight back over the gap), smash it: its pieces fly home that way and ring the bell. Smashed or thrown on the far side, its way home never crosses; a fall drops it home | the gate E |
| The Dreaming Door | 3,0 | Synthesis (Belfry: the Recall Bell, rung in flight; Slumber: flights follow the trace and light dreamcatchers, boards remembered) | The door opens while the good dream is lit and the bad one dark. Old boards (they give way behind) run out round the room to an island, under the bad dreamcatcher near the start and the good one near the end. Lay the Bedroll by the door, walk out, fly home (Homeward or a fall): the good one lights first, the bad one last (the door blinks open mid-flight between them); ring the Bell after the good one lights: Wren snaps home before the bad one, through the door. Rung too soon, nothing lights | Pattern |
| Mother Sloth's Room | 1,0 | Boss: Mother Sloth (her arms catch you and reel you to her bed to be tucked in; an arm pulled out past the ring of stars snaps; both snapped, she slumps: knock her nightcap), three rounds, each taking the last one's way away | 1: lay the Bedroll out past the stars; caught, fly Homeward: snap. 2: she thumps the bed and the floor past the stars drops into the dark (a Bedroll lying there falls back into the pack), all but a row of old boards along the bottom: nowhere to lay it out of reach, but the flight follows the trace: out over the boards (they give way behind) and back in, then caught, Homeward goes back over them: snap. 3: the boards drop too; the old bedposts they lay across stand out in the dark, ringed with brass: caught in line with one, turn in her grip and hook it: the reel drags Wren out past the stars (snap) and she drops home onto the Bedroll, unhurt. Out of reach she throws pillows; flown out of the room the fight waits, its arms grown back. About 50 s for a player who never hesitates (was 102). Moves (tells 26/23/21): a hand rises and spreads its fingers before it reaches (tucked in: a heart); pillows lifted over her head first (one, two, three); round 3 the sheep: a row lit, then a flock along it (a heart); two knocks a round; a heart each round. Tests: slumber.test.mjs | Knot, Heartstitch |

Keys: 4 keys (Linen, Loft, Moonwalk, Fort), 4 locks (Ward E, Ward N, Nursery N, Moonwalk N). Pattern: the Dreaming Door,
for the Landing's north door. Any order works and none strands you (spent elsewhere, key C skips the Nursery and the Fort,
which are then optional). The way back from the Dreaming Door: the Milk Kitchen's east bank and its south door, the
Moonwalk, the Landing. A game that found the Pattern in Pillow Fort before these rooms were built finds key D there (a new
chest) and buttons in the Dreaming Door.
Dressing: Mother Sloth's four-poster with velvet curtains tied back with gold cord, a scalloped valance with tassels and a
draped back; nightstands with night-lights either side; night-lights along the walls of the Long Ward, the Milk Kitchen and
the Dreaming Door (their glow falls on the floor below, not on a drop); the Milk Kitchen's stove, table and milk jug; the
bedsprings; the Dreaming Door's dreamcatchers, the good and the bad, and the little pair either side of the door that light
with them. The House keeps its own soft starry carpet.
Tests: every room's solution; Matron's two knocks; each of Mother Sloth's rounds (her floor in each, the Bedroll lost with the
floor, Homeward in reach holds, over the boards and back snaps, the boards mend on landing, the bedposts, turning in her grip
and hooking out unhurt, the floor back after), an arm snaps only past the stars, the whole fight's time, waiting while Wren's
out of the room (arms regrown, floor restored and back again); the Milk Kitchen (the solution; thrown or smashed on the far
side, the springs one way, a fall); the Dreaming Door (both lit on a plain flight, the Bell between them, rung too soon); the
way through lock D; an old save's Pattern; the kit's carried trace along a flight. Scripted playthrough (LEG5); probe: clean.

## D6 Marionette Hall (`src/63_marionette.js`, `src/63b_marionette_foes.js`, kit `src/61_crossbar_kit.js`, the reveal `src/64_reveal1.js`; tests `tests/marionette.test.mjs`, `tests/crossbar_kit.test.mjs`, `tests/review_d6.test.mjs`, `tests/larkspur.test.mjs`) - tested

Rules: toy soldiers march straight on and turn at anything in their way (about-turn, or turn right); they weigh on
plates as they pass. Painted flats stand in for walls until knocked down (cardboard). The Crossbar: C at a puppet in
sight (8 tiles, the same room, the side Wren faces) takes its strings; Wren stands still and the arrows walk it a
tile at a time; C or Z lets go and it goes home after its patience. Puppets weigh on plates, fit through the little
holes in walls (tile kind `crawl`), don't mind spikes, won't walk off an edge. A rack holds several puppets: they step
together, the leading ones first, each that can. The stage trap (the Great Stage's hatch) holds a person or a puppet;
anything heavy (a sandbag, the Great Marionette's foot) drops it open, and it shuts again once it's empty.

| Room | Cell | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Foyer | 1,3 | Soldiers; flats | The east wall wobbles when soldiers pass: knock it down | the way to the Box Office |
| The Box Office | 2,3 | - | Behind the flat | Plan |
| The Auditorium | 1,2 | Hub | Seats; W open, E (lock) and N (lock) | - |
| The Orchestra Pit | 0,2 | Shape a soldier's beat | The drummer goes round the room's edge turning right; push the stray block into the top of his beat: he turns down early, across the plate (a pulse: the gate opens a moment per footfall), and Wren, waiting at the gate, slips through | key A |
| The Rehearsal Room | 2,2 | Bedroll | Lay it up top, drop through the trapdoor to the key, Homeward (or the hole in the under-stage floor, which hurts). S13 later | key B |
| The Wings | 1,1 | Mini-boss: Captain Tin | He marches between two flats; knock one as he comes and he marches on into the trapdoor behind it; dazed, hit him (2x). The flats spring back up; the east door opens when he falls. Moves: the baton twirled overhead ("!", its line lit), flung, home along its thread (a heart each way) | Crossbar |
| The Dressing Rooms | 0,1 | Crossbar | The puppet through three little holes and over the nails onto the plate | key C |
| The Prop Store | 2,1 | A rack | Three puppets on one rack in a column, three plates along the bottom of the store: hold right till the shelves stop the leading ones (two shelves, then the wall), hold down: all three on the plates (RRRRRRRR DDDD, the only shortest way) | the way east (gate, stays open) |
| Jory's Workshop | 2,0 | Signature | A lone puppet through the little hole in the Prop Store's north wall onto the plate inside: the door opens for good | Maker's mark, 50 buttons |
| The Fly Tower | 3,1 | Synthesis (Belfry: a ring snaps things home fast; Tidyhouse: plates pressed in passing; Kiln: the way home is the trace, loops erased) | A puppet (one-string rack, no sight needed) on a walled catwalk round the fly well; three timed plates on the catwalk (36 frames) and the fly door opens while all three are down at once. Walked, it's on one at a time; let go, it walks home over them too slowly. Walk it right round the catwalk to one short of its stand (a trace over all three; out and back the same way erases the loop and skips a plate), switch to the Bell and ring: it snaps home over all three at once | the way south (gate, stays open) |
| The Trap Room | 3,2 | Synthesis (Kiln: the Hookline latches onto an empty mark; the Return's patience) | Every trapdoor open between the near side, an island and the far side; two understudies on one rack stand on their stands (marks) on the island and the far side (the hook bounces off a puppet). Step them both off their stands to the left (to the right, the island's one stands in the line to the far stand), let go, hook the island's empty stand, step right, hook the far one, before they walk home (understudies wait 7 s, their rings unpicking: time to change hands and aim). One starting home as Wren's reeled onto its stand waits behind her (a tile she's coming down on is hers). Fall in: home to the doorway | Pattern (buttons for a game that already had it); the way west into the Rehearsal Room unbolts |
| The Great Stage | 1,0 | Boss: the Great Marionette, three acts (its hp 3, 2, 1). Its feet block; its marks are (7,5) and (12,5); the stage trap at (11,6); its stage, for marching and walking, is rows 5 to 7 (the apron's past the end of its strings) | I: it dances on its marks: two little Wrens on a rack, lined up against its feet, walked right round them: both strings tangle, it falls; knock its head. II (a sandbag drops through the trap to show it; the little Wrens are whisked home): it marches round its stage like a toy soldier, turning right at anything in its way (the wall; Wren it stamps past); a third little Wren on its own string comes down on the apron: walk it into the march where the turn takes a foot onto the trap (east along the back, a foot to the right of where its left foot lines up: (17,5) or (12,5); along the front (10,7) or (5,7)); down to the chin: knock its head. III: back on its marks, its strings slack (a string wound round its feet slips off) and its bar low over the stage, out of reach: the Hookline brings the bar down in front of Wren; the Crossbar takes its strings like a rack's; walk it onto the trap (it won't step into the trap open, but the trap's shut till it's on it): down; knock. Let go, the bar's hauled back up and it walks home along its way. Sandbags fall where you stand in I and II (a hit makes you let go). Moves (tells 24/22/19): sandbags (1, 2, 3, shadows first); act I its stick swept along the lit boards before its feet; act II the stamp; act III battens along lit rows (never the row she's working its strings from); all a heart; two knocks an act; a heart each act. Tests: marionette.test.mjs, review_d6.test.mjs | Knot, Heartstitch; Reveal 1 |

Keys: 3 keys (Pit, Rehearsal, Dressing), 2 locks (Auditorium E, Auditorium N): one spare whichever order. The late House:
the Wings (Tin falls: the gate east) to the Prop Store, the Fly Tower, the Trap Room (the Pattern), back west through the
Rehearsal Room (its east gate unbolts with the Pattern; a lock on the Auditorium side still opens with the spare key from
either side), the Auditorium, the Wings' north door (the Pattern). Dressing: stage boards laid up and down the stage, two
to a tile with butt joints and nails (the House's own floor); the Great Stage's footlights along its front and rigging up
its side walls (lines, sandbags, cleats); the fly tower's catwalk (slats over the dark, iron-edged) round the fly well, its
pin rail and sandbags; every trapdoor in the trap room open, lids hanging; the traps' winch. Tests: every room's
solution; the Fly Tower's walk and let-go (shut) and the out-and-back trace (shut); the Trap Room the wrong way round;
each act (the trap holds people and puppets and drops under a sandbag; the march turning at the wall and at a puppet;
Wren stamped; slack strings slip; the bar out of reach from the boards, hauled back up if not taken; let go it walks
home; on its strings it won't step into the open trap); leaving mid-fight (Homeward) and coming back to the same act;
the shortcut bolted till the Pattern; an old game's Pattern. Scripted playthrough (LEG6); probe: clean. The fight takes a
scripted bot 23 s of game time (it was 21 s for three of the same).

## D7 The Spoolworks (`src/67_spoolworks.js`, `src/67b_spool_foes.js`, kit `src/65_spool_kit.js`; tests `tests/spoolworks.test.mjs`, `tests/spool_kit.test.mjs`, `tests/review_d7.test.mjs`) - tested

Rules: every room is two, the Works floor and, 33 rows below, the Under-works, joined by hatches (a trapdoor up top,
a ladder below; something standing where you'd come out keeps the trapdoor shut). Below, what's up above shows through
faintly (its walls over open floor as their plan, hatched and dashed round; a hole up there as light coming down), and a
cord hangs under every mark: tap Z for a tug (whatever it holds snaps home; at home, it jumps), hold Z to tie it off
(held exactly where it is: no pushing, pulling, lifting, drifting, going home, stepping with a rack; and fixed, so the
Hookline bites into it like a post), Z on a knot to undo it. Counterweights are heavy weights on plates below; what's up
above answers to the plate. The Needle (from Cog): face a thing, or its cord from below; C; walk the needle up to 4
tiles from where the thing is now; C: its place now, for good (kept when the place is built afresh; its cord moves with
it). Three stitches at a time, a fourth undoes the oldest (the notice says what and where); a stray can be given a
place; the Needle on a stitched thing offers to unpick it. With the Needle in hand, what it would take (the first thing
in line, four tiles at most) is marked at its corners; while a new place is chosen, every tile it could go to (four
steps, round walls, never over a hole or onto Wren) is stitched round faintly; faced at something further off, it
says it's too far. Refusals are said: a thing tied off below won't be pushed or gripped up there ("held fast from
underneath"); a thing no hand can shift says so when pulled; the practice rack by hand. Its own floors: oiled wood
blocks laid basket-weave up top, thread-dusted flagstones below.

| Room (above / below) | Cells | Teaches / puzzle | Solution | Reward |
|---|---|---|---|---|
| The Gatehouse / Under the Gatehouse | 1,2 / 1,5 | Two layers; untie | The crate at the passage's mouth is tied off from below: down the trapdoor, undo its knot, and it goes home. Side doors: east (the Practice Floor's), west (the Ropewalk's), shut till later | the way in |
| The Winding Hall / Under | 1,1 / 1,4 | Counterweights; a ring heard seven strides off (Belfry) | The Spool Store gate is shut while its weight sits on its plate below. A boulder sleeps across the room, its place just east of the plate. Push the weight off east, past the boulder's place; ring from across the room, out of the weight's hearing: the boulder is home in a flash, in the weight's way home; up the far hatch and through (it latches once passed). Rung first, the boulder lies home beside the weight in nobody's way (leave and it sleeps again; once it holds the weight off, it stays awake) | the Spool Store |
| The Spool Store / Under | 0,1 / 0,4 | Tie off | Push the block onto the plate, down the hatch, tie its cord off before its patience runs out: the gate stays open. Its south door (from the Ropewalk) is shut from this side | key 1; the Plan (below) |
| The Kennel / Under | 2,1 / 2,4 | Mini-boss: Cog | Brass hide (the stick clangs); his cord hangs under his kennel. Go below (he sniffs, then trots home), tie him off, come up and knock him: he bolts; twice. He wakes once Wren's well in (the door slams behind her); run down, he sits and topples, then his thread runs off, then the chest comes up. Moves: he crouches a few strides off, tail whirring, and pounces on the spot she's on, its shadow first (a heart and a half) | the Needle |
| The Practice Floor's door | 2,2 (north) | The Needle | The weight in the Kennel's south doorway can't be pushed by anyone: give it a new place in its nook | the way on |
| The Practice Floor / Under | 2,2 / 2,5 | Synthesis: the Crossbar from below; a knot and a stitch | The apprentices' rack is below, its strings up through the floor to two puppets on stands; two runs, a plate in each at different depths; the Gatehouse door is open while both plates are down (and for good once through). That door is out of sight from both floors, so when it opens the camera goes and looks at it, with a chime (the first time at all, and the first time the puppets stay on their plates with nobody at the rack); once through, the Ropewalk's door across the Gatehouse opens with a chime. Let go and they walk home. The boy's cord hangs down a hole below, out of reach: from up top, stitch his plate as his place (the Needle); from the rack, walk the little Wren down onto hers (the boy goes on past his) and tie her cord; let go, and the boy walks home: onto his plate. (Or stitch them both) | the Ropewalk opens |
| The Ropewalk / Under | 0,2 / 0,5 | Synthesis: the Needle through a cord; the Hookline | The floor's fallen in down the middle; the crate across is out of the Hookline's reach and in line with nowhere. Below, the Needle through its cord moves it into line (its cord goes with it); tie it off: the hook bites into a thing held fast and reels Wren over. (Or hook it across to this side, push it aside, and hook its empty mark.) The key; out by the far door into the Spool Store | key 2 |
| Under the Spool Store, north | 0,4 | Locked | The Loft's own lock: only its spare key turns in it (key 2, the Ropewalk's, past the Needle's rooms); the Spool Store's key won't, and it says so. An older save that spent the first key here (it once took any key, which stranded the run) has the Kennel's lock let go instead when the Works is built | the way to the Loft |
| The Bobbin Loft / Under | 0,0 / 0,3 | Three stitches and a knot (the knot outlasts the stitch) | Four plates that only an iron-cored bobbin works; the bobbins won't shift by hand, and three stitches hold three. Stitch one onto its plate (4 tiles each) and tie its cord off below; stitch the other three: the fourth stitch lets go of the first, but the knot holds it where it is | Pattern; the way out to the Store latches |
| Gundry's Bench / Under | 2,0 / 2,3 | The Needle through a cord | The crate on the trapdoor's far side keeps it shut: from below, the Needle through its cord moves it off | Maker's mark (G.G., and an old L.), Heart Patch |
| The Heart of the Works / Under | 1,0 / 1,3 | Boss: the Tangle (three phases) | 1: four bobbins tie it together; all four off their first places and held there at once (three stitched away, the fourth pushed off and tied below) and it comes apart round its core: knock it. A knock: it yanks every thread (knots slip; a stitched bobbin's at home, so it stays). 2: it hangs itself on the Heart's old hoist, out of reach (Wren walks under it; yarn rains down); the hoist answers to its counterweight below: push the weight off its plate and down it comes, loose: knock it. 3: it tears the hoist down, winds the line round the trapdoor (no knots now) and on its beat hauls every thread in a tile, stitched bobbins off their new places too: grip the fourth and pull it out, ring the Recall Bell with the other hand: everything goes home at once, home being where the Needle put it; it comes apart; let go and knock it while it's dazed. Moves (tells 22/20/18): yarn balls after it swells (1, 2, 3: a heart); the lash, its reach drawn first (a heart and a half); a cord along its row or column, lit right across the hall (a heart and a half; both at once in beat 3); spoolmites let down in beat 2; nothing thrown while it gathers to haul; three knocks a beat; a heart each beat. Tests: spoolworks.test.mjs | Heartstitch; apprenticeship (d7) |

Keys: two keys (Spool Store, Ropewalk) for two locks (the Kennel; under the Spool Store, north, which takes only its own
spare, the Ropewalk's, so no order of doors strands the run). Pattern: the Heart's big door.

## The Makings: Tuck's Little Wander (`src/68_makings.js`, `src/68b_makings_more.js`, `src/68c_makings_capstone.js`; tests `tests/makings.test.mjs`, `tests/capstone.test.mjs`) - tested

Eight Little Houses the Makers built, then one Wren sets out herself (the ninth), each opening once the one before is done (a door each on the Making Floor, a plank across the ones
not open yet). Wren works from underneath only (no hatches up: it's his Wander). Tuck's rules (on the wall below, in
his spelling): 1. he goes for the door (the little hoop); 2. anything that jumps (a tug on a home thing's cord), he goes
and pushes (away from himself, from whichever side he gets to first; only within eight tiles); 3. he won't go near
anything that bites (a nibbler not tied up; tied up it's harmless); 4. stuck, he goes as near the door as he can and
sits. He weighs on plates, pushes what a person can (not heavy), and a heavy thing going home (or anything tugged home
hard) bowls him over (a bump: back to his start). His own thread hangs under his start: a tug yanks him back ("Wheee!").
From the sixth, Otto comes too, playing the Housekeeper (`Keeper`): 1. he stands on his X (one in every room of his:
he's always in the room Tuck's in); 2. anything out of its place, he trots to the side of it nearest his X (the next
nearest if that one's taken) and yanks it home (a snap); 3. held fast, he stands there tsking at it till it isn't;
4. then back to his X. Something coming home through him bowls him over ("OOF!": he sits a while, and doors that open
on the Housekeeper beaten open). His own thread puts him back on his X. A doormat (`Mat`) feels only a person on it.
Ahas (S30: all three in all nine): cleared (his own push got him nearer the door), found (he had a go at the thing the
button was under), unhurt (no bumps). Every room underneath a puzzle has a nudge. The first three Houses lost their
empty hoop rooms (the hoop stands at the end of the second room); an old save left in one comes back in a room below.
Gundry's speeches (handing over the empty one after the eighth; the end of the act after the ninth) are said to Wren's
face: he walks over from the Guild Hall first. The act ends (the Way Down opens) with the ninth; on the Making Floor,
anything a save from before it still owes (the hand-over, the end of the act) is said as soon as Wren is back there.

| Making | Room | Idea | Solution |
|---|---|---|---|
| 1 The Little Tidyhouse (Ives) | The Doorway | Jolt to steer | The block on the corner of the L doorway: tug it; he pushes it up into the alcove (Aha). The pot in the corner: tug it, he finds the button |
| | The Plate | Jolt, then tie off | Tug the block in its slot; he pushes it down onto the plate; tie it off there before it goes home (60). The hoop past the gate |
| 2 Mind the Nibbler (Bram) | The Nest | Creatures have cords | The nibbler chases him near its nest: tug it home and tie it up; the pot in the nook (button); the corner block as before (Aha) |
| | The Crossing | Lure, then let go | He sits in the heavy block's lane at the gate: tug the crate in the west nook (he goes to see, and admires it), then untie the heavy block: it crosses home onto the plate and the gate opens. Untie while he sits there and he's bowled over |
| 3 The Little Wander (Tess) | The Heavy Door | The Needle | The corner block is heavy: stitch it up into the alcove through its cord; the pot (button) |
| | The Guarded Plate | Everything | Tie the nibbler up first, then tug the block in its slot onto the plate (he pushes) and tie it off |
| 4 The Long Sulk (Gundry) | The Sulk | Rule 4 turned round | A heavy block tied off in the passage; the nearest he can get is a plate, so he sulks on it and holds the gate on the heavy one's way home open: untie it (through its cord, under its place up the shaft) and it goes, out of his way. The pot (button) |
| | Two Plates | Where he sits, and when | He sulks on the plate by the gate, right in the way of a heavy one tied off below him whose home is the other plate. Tug the crate nearby (he goes to see), then untie the heavy one: it goes home onto its plate; he comes back and sits on his; the gate opens and stays. Untie while he sits there and he's bowled over |
| | The Hoop | Jolt to clear | The block in the passage's mouth: tug it; he pushes it out of the way (Aha) |
| 5 The Tidyhouse, Underneath (Ives; echoes D1's Foyer, Hall of Busts and Ballroom; no Needle in her rooms) | The Foyer | Where he stands decides which way he pushes | The block a step nearer the plate than Wren had it; the plate opens the way west. Tug it while he sits by the west door: he pushes it east onto the plate (Aha); tie it off. Tug it while he walks in and he pushes it north, the wrong way |
| | The Hall of Busts | A tug on a thing out of its place sends it home now (heavier shoves lighter) | The middle bust set out up its lane and tied. Tug the block by the lane while he sits by the west door: he pushes it east into the lane; untie the bust and tug it: it comes home down the lane, shoves the block onto the plate, and stands in its way home. The pot (button). The bust let go before the block's in its lane: Ives's lever below sets the Hall out again. The bust sent home through him bowls him over |
| | The Ballroom | (the hoop) | Both busts home, tidy; the hoop at the end of the corridor they jammed in. Below: the Grand Housekeeper's costume on a rail, and Ives's notes from Wren's own Wander (real play time per room; the Ballroom's page says which way she really tidied it, from her play: held one back and let the other by, or let them jam and pulled one back out; a save from before that was watched gets a page that claims neither) |
| 6 The Housekeeper (Jory; Otto introduced) | Otto's X | The second child: he tidies what Tuck pushes; a knot only makes him tsk | He sits in the passage, a block in its far mouth, Otto's X just beyond. Tug it: he pushes it out (Aha), and Otto tidies it straight back. Tug it and tie it at once: Otto stands beside it tsking, Tuck walks round. The pot (button): Otto says Tsk! but can't get there |
| | The Doormat | Where Otto stands (his side) | The way on opens while somebody stands on the doormat. Tug the block while Tuck sits by the gate: he pushes it west; tie it: Otto's side of it is the mat. A block stitched onto the mat does nothing |
| 7 Tidy and Untidy (Mallow) | Tidy for Good | A stitch gives a thing a place; Otto only minds places | A block in the only junction, Otto's X off it: pushed aside (Aha), Otto puts it back; tied there, Otto stands in the junction tsking, in the way. Stitch it into the stub (before or after he pushes): Otto leaves it be. Or tie it and tug Otto's own thread: he's whisked to his X and Tuck slips by. The pot (button) |
| | Two Mats | Both sets of rules at once | The gate wants somebody on each mat (and stays open). Tuck sits on the one by the gate by himself. The block sits in a slot on the other mat: pushed west (from the gate side) Otto's side of it is no mat; tug the crate to draw Tuck west, then the block: he pushes it east, tie it, and Otto's side of it is its own place, the mat |
| 8 The Grand Hall (every Maker; echoes D1's Antechamber and the boss's hall) | The Antechamber | Counterweights (what the Pattern really did) | Four pots (button under one); the big door hangs on a weight below: push it off its plate and he goes through |
| | The Grand Hall | The Housekeeper tidied by his own tidying | Otto's cross by the way west, which opens only when he's beaten. Tie the nibbler up (it watches the spot he'd push from). Tug the block in the slot between two busts while he sits by the way west: he pushes it east, straight away from Otto; tie it; Otto comes to its side (its own place) once Tuck's gone back; untie it: his own yank brings it home through him, OOF, and the way opens. Untied too soon, he tidies it from beside and stays up |
| | The Little Hoop | Jolt to clear | The last block in the passage's mouth (Aha). Below: all six Makers, on their knees under the hoop, watching |
| 9 Your Turn (Wren's own; Gundry hands it over: "Your turn. Make one.") | The House Upstairs / Under the House | Making, not solving: she sets it out, he walks it, the Makers grade it | Up top: two little rooms, a wall between them with a gap at each end (rows 2 and 8), Tuck's door in the west wall (he comes in at 1,5), the hoop in the east room (17,5); three of the Guild's things on their marks by the wall: a wooden block (7,2), a pot (7,5), a stone block (7,8). Underneath: Gundry's note, the button's tin (say which thing the button goes under: up its cord it goes, a paper tag on that cord), Gundry's lever (everything back on its mark, untied, unstitched, the button back in the tin; not while he's in), the lever that lets him in (pulled again while he's in: call him out), and the six Makers sat along the wall (under the wall up top, so no cord hangs where anyone stands). Set out with her own tools: stitches give places, knots hold, tugs send home; it stays as she left it between goes. A House worth all three Ahas: the wooden block stitched just past the north gap (10,2), the stone block in the south gap (9,8), the button under the block; he sits at 8,5; tug the block: he goes round to the gap, finds the button, pushes it east and walks on. Every run finishes: the hoop; or sat with nothing moving or jumping for 25 s (a word at 10 s), he gives up; or called out. Graded like the others, then a line each from up to three Makers about what happened (a corridor, a block moved by himself, where the button was or wasn't, a bump, his thread pulled, a long one) and Jory the first time. No nudges (it's hers). Tests: capstone.test.mjs; the scripted run's leg 8 |

## D8 The Loom (`src/72_loom.js`, `src/72b_loom_foes.js`, kit `src/70_shears_kit.js`; tests `tests/loom.test.mjs`, `tests/shears_kit.test.mjs`) - tested

Rules: nothing in the Loom has a thread but its own old weights and its silk; the blocks lying about are offcuts
(strays, middling weight: silk holds them and the iron plate ignores them): pushed, they stay; into a pit, they fill it
for good. Offcut chutes drop another when one's jammed; the Weighing and Bridge rooms' chutes drop spare weights (on
their own threads, to be cut like the rest). The Loom's doors want the Guild's key (Gundry gives it after Reveal 2), so
the north gate opened early (S32) only opens the Loomwood. No
nudges (nobody watches here). The Shears (from the Shuttle): C at a thing (or its cord from below) cuts its thread:
a stray for good, kept where it's left (even after the place is rebuilt); silk walls fall; silk bridges drop (and iron
goes through silk; no heavy thing can be given a place on silk); a thread pulled tight is cut anywhere along it;
people cut free; your own thread, at the fog. The way: Threshold, Warp Hall, Offcut Yard (key 1), the Run (the
Shears), the Weighing Room, the Hanging Gallery (key 2), the Weighing Room's east lock, the Larder, the Warp Walk, the
Bridge Room (Pattern; its south gate, a lock in older saves, opens for good once its plate is held), the Run's big
door, the Web. Tests also: `tests/review_m.test.mjs` (3, 8); the scripted run's leg 8.

| Room | Cell | Idea | Solution | Reward |
|---|---|---|---|---|
| The Threshold | 1,3 | Strays | A two-deep trench: one offcut into it, another pushed in on top of it, and across | the way in |
| The Warp Hall | 1,2 | Hub | West open; east a silk wall (Shears); north a lock | - |
| The Offcut Yard | 0,2 | Order | Three offcuts up one column of three pits to the key in its nook (chute for spares); the pits can't be filled from the side along the top row | key |
| The Shuttle Run | 1,1 | Mini-boss: the Shuttle | It flies its lane through anything soft; an offcut pushed into the lane jams it; knock it while jammed (it shakes the offcut out of the lane after the first); 2x. Moves: its lane lit wall to wall while it waits at its end (a heart and a half) | the Shears |
| The Spinner's Room | 0,1 | Shears on silk | Cut the silk across the Run's west door | the tapestry (lore), Heart Patch |
| The Weighing Room | 2,2 | Shears on weights | Three old weights: cut each free and push it into the chasm's middle row, one after another; the way on is the door in its floor | - |
| The Hanging Gallery | 2,3 | Cutting a thing in motion | Two weights hang tied out over a one-row trench, their homes on the far side (out of the Hookline's line). The lever lets them go: they come home along the trench, hanging. A thread pulled tight (a thing on its way home) can be cut anywhere along it, so face a trench tile ahead of a weight and snip: it drops where it hangs and fills that tile. A slack thread slides off the blades. Missed: pull the lever back to set them out again | key |
| The Larder | 3,2 | Bell + blocking + a tight cut (Belfry, Tidyhouse, Loom) | East of the Weighing Room (key 2). A wrapped weight sleeps beyond a one-wide gap; its thread runs back over the gap, along this side and over again to its home on the far side. Rung from anywhere it's home in a flash, both ways (and the other sleeper goes home onto the plate that opens the far gate, for good); leave and it lies down again. Stand at the turn of its thread with the warping post at your back and ring: it can't shove you, so it waits over the gap, pulled tight: cut it (at it, or along its thread) and it drops in and fills the gap (or block it at the top turn, the wall at your back, cut it there and push it in) | the way on |
| The Warp Walk | 3,1 | Needle + Hookline + cut (Spoolworks, Kiln, Loom) | A ledge along the wall over a drop, its one weight at the near edge across a gap, the way out beyond one more gap at the far end. Hooked, the weight reels you to the tile in front of it: the gap (a fall). The Needle reaches over the gap: give it a place further along the walk, hook over to it, cut it free and push it into the last gap (marked, it would only go home) | the way to the Bridge Room |
| The Bridge Room | 2,1 | Iron through silk; a thing going to its place hangs on its thread (Needle) | In from the Warp Walk (east). The one weight is wedged in a nook in the drop's far wall, over a strand of silk: no hand shifts it, and the Needle won't set iron on silk. Stitched past the strand (from 2-4 tiles off along the row), it tears the silk but hangs on its thread across and lands; push it onto the heavy plate and cut it (or stitch it on): the Pattern; the west way to the Run while the plate is held, its south gate for good. The strand cut first: fill its gap with an offcut (the chute this side), then stitch. The chute in the nook's ceiling (from the far side) drops a spare, wedged too, only into an empty nook. Older saves: the old weights (brW1, brW2) are gone; whatever was done with them, the new weight is there to finish it | Pattern |
| The Web | 1,0 | Boss: the Weaver | The First Spinner's loom across the north (the breast-beam, its words under silk), its well a deep slot down the middle, four great posts. Wakes as you come in. 1: hung by four anchor threads: cut each at its post (its silk binds: snip free; caught again while bound, it tightens); it drops into the well, tangled; knock it (left, it climbs back and ties in again). 2: up on the breast-beam by one thread of its own, the posts bare: it drops on you (its shadow first; lands hard), crouches (its thread slack: snips slide off), then hauls itself home up the well, thread tight: cut it ahead of it while it's over the well and it drops in (over the stone it lands on its feet and runs back up); knock it. 3: it hauls the warp out of the well and clings to the breast-beam and won't come down: hook it (the Hookline: it's hauled down its own well toward you and hangs there, dazed, low over the well), cut it at the thing (or its thread as it climbs home), knock it. At the end a heap of grey silk in the well, the web drifting down like snow, the words on the breast-beam. Moves (tells 20/18/16): silk after it rears back, belly aglow (bound again: a heart and a half; two at once in beat 3); the warp: Wren's column lit, then snapping (a heart and a half; two columns from beat 2); the drop costs two hearts; beat 3 silk moths; three knocks a beat; a heart each beat. Tests: loom.test.mjs | Heartstitch; d8 |


## F The Great Spool (`src/75_greatspool.js`, its look `src/75b_spool_art.js`; the Drift `src/74_drift.js`, the end `src/76_ending.js`; tests `tests/greatspool.test.mjs`, `tests/spooltop.test.mjs`, `tests/ending.test.mjs`, `tests/review_end.test.mjs`) - tested

Reached down the Well during the Great Pull (after the Drift). Wren's own thread is cut: nothing pulls her, a fall is
climbed out of on the side she went in from (unless her Bedroll lies in the place: then a fall takes her to it), hurts
only knock her about.

**The Pull**, the rule every room follows (`Pull`; shown at the Foot before it's needed: things tumble down the shaft
after you and slide away north into the wall, the first look says none stays where it lands, and the first thing wound
in tells you where it went). Every thread in the valley runs up to the drum, and the drum is winding:
- A thing on its own mark holds. Off it, once its patience runs out, it's wound in: not back along its trace but north,
  the way the threads on the floor run, a tile at a time, into the wall of thread at the head of the room (the drum's
  face); the drum drops it back onto its own place the moment that's clear (while Wren or anything else is on it, it
  hangs over it, waiting: every kind of thing, and the crates the top room's drum spits back onto their shelves too; as
  anywhere, nothing that pops home lands on Wren). Wound across its own place on the way, it catches there.
- The rest is the Return's: held things wait (carried, gripped, paddled, on the Crossbar); on the way it shoves lighter
  things a tile on, waits behind anything as heavy or fixed (a pillar, a post, a sleeper; Wren, unless it's heavy, which
  shoves her); it presses plates in passing; it hangs on its thread over holes and water; a float carries whoever's
  aboard; the river keeps a loose float (each drift starts its patience again) till something stops it, and can't have
  one that's being wound.
- Broken, a thing's pieces fly north from where it broke, striking what they pass; then it's whole on its mark.
- A ring winds everything out of place in its reach at once, fast, shoving one weight harder; a sleeper woken goes too.
- Every thread down here is too taut for the Shears or the Needle (the six great threads at the top, gone slack a
  moment, aside).
- The Bedroll is the one place that stays put (on a float it goes where the float goes).
- An arch over water is too low to ride under: a float goes under it on its own; whoever's aboard is scraped off into
  the water (and the Paddle won't take one under).
- Each Knot room has a brake (`Ratchet`, by its door): hauled, everything out of its place goes up into the drum and is
  laid back where it belongs, and the puzzle's sleepers lie down again where they lay.

A 3x4 grid: the column up the middle (the Foot of the Well, the Winding Room, the Climb, the Top) and a Knot room either
side of each of the lower three, each wound with its Maker's thread (walls, floor threads, Knot: Ives teal, Bram ochre,
Dad blue, Mum brass, Mallow lavender, Jory crimson); the rooms between are every colour at once. The look: walls of
wound thread on a brass rim; the head of every room the drum's face, turning, thread ends drawn up into it; the floor
the Spool's dark boards with the valley's threads running north over them, a fibre now and then travelling up each; a
thing being wound in drawn with its thread taut to the face, then rising into it; brass gates; the drum at the top in
brass flanges, turning till the sixth Knot is undone. Its own music (`SONGS.greatspool`). The Knots can be untied in
any order; the goal counts them; each Knot untied and each great thread cut is saved; gates latch once passed; every
room round the foot has a nudge (after 100-150 s, none once solved).

| Room | Cell | Idea | Solution |
|---|---|---|---|
| The Foot of the Well | 1,3 | The Pull, shown | Push the crate (8,7) 3 west: its patience out, it's wound north up the plate's column onto the plate (5,3), where the pillar (5,2) stops it: the north gate (latches). Pushed anywhere else, it goes into the face and drops back on its place. The doors west and east (two Knot rooms) are open from the start |
| The Airing Cupboard (the Tidyhouse's Knot) | 0,3 | Tidyhouse (a thing at home blocks the way; heavier and lighter; the Gloves) + Bell (sleepers; a ring shoves harder) + the Pull (laid back the moment its place is clear) | The slot's plate (14,7) at its foot, the slot open to the north; the old mangle (heavy) lives at the top of the slot (14,6) but sleeps across the room (9,3). Push the block (16,3) 2 west and 4 down into the slot onto the plate; stand on the mangle's place (the block can't shift Wren); grip the block and ring the Bell with the other hand: the mangle is wound into the drum and hangs over its place; let go, step off: it drops into place on top of the block, which waits under it: the gate. Or, the block in the slot, go across the room out of its hearing (the ring's reach is drawn) and ring before its patience runs out: it's patient (5 s), so there's time to walk it at a person's pace. Rung without the grip, the block snaps out and shoves Wren aside; rung first, the mangle caps an empty slot: the brake |
| The Glazing Gallery (the Kiln's Knot) | 2,3 | Kiln (shards strike what they pass; sun, moon, star in order; a cracked charm spoils it) + Crossbar + the Pull (pieces fly north from where it breaks; a thing hangs over a drop on its thread) | Charms over the drop: sun (5,4), moon (6,2), star (6,1), a cracked ember (6,5). Walk Bram's clay understudy (11,8) on the Crossbar to the drop's edge (7,7) and let go: wound north out over the drop, it hangs under the post (7,3). Throw the pot (2,8) east from the balcony (4,4): the sun struck in flight, it breaks against the puppet and its pieces fly north through moon and star: the gate. Without the puppet, only the sun |
| The Winding Room | 1,2 | Hub | The foot of the Great Spool, a drum as wide as a house; west, east, and north to the Climb |
| The Mill-Leat (the Millrace's Knot) | 0,2 | Millrace (currents carry loose floats; a hold wheel turns while something sits on its water) + Hookline + Paddle + the Pull | The raft (13,5) is out in the pool: hook it over from the bank (13,8) (left in the pool, it's wound north and catches on its own place). Ride it to the head of the leat (10,6) and step down onto the jetty: the river keeps the loose raft down to the leat's end (5,6); there its patience runs out and the Pull takes it north onto the wheel's water (5,3), where the post (5,2) holds it: the wheel turns and keeps turning: the gate |
| The Gale Loft (the Belfry's Knot) | 2,2 | Belfry (wind; sleepers; a bell's reach) + Hookline + the Pull | A gale (x 6-9) nobody walks east through: hook the boulder's empty place (12,6) from (5,6). The boulder sleeps at (14,8), below the iron plate (14,2) (only something heavy sinks it); an old bell sleeps on the frame above the plate (14,1). Ring from the far end (14,9): the boulder wakes and is wound north up its column onto the plate, and stops under the bell, which, out of reach, sleeps on: the gate. Rung within reach of both, both go round into the drum and home: the brake |
| The Climb | 1,1 | A test of hands, fair | Its gate north opens when all six Knots are undone; then the Pull flings things along four lanes (rows 2, 4, 6, 8), one way each, on one beat, staggered: a train of six nose to tail, then a clear spell. Every throw is told first (the lane lit end to end, blinking faster as it comes, a glow at the end it'll come from, a chirp for the lane in front of you). A hit knocks you back to the start of that lane (the row below it, a stitched line along its edge), never further, and dazes you till that train's gone by (never caught twice by one). Nothing shelters you in a lane: wait in a row between lanes for a train to pass and go behind it. Holding Up from the door is caught two to four times every time (`tests/review_blind_a.test.mjs`); watching, never |
| The Night Ferry (the Slumberhouse's Knot) | 0,1 | Slumberhouse (your own place; Homeward; a fall takes you to the Bedroll) + Paddle + the Pull (a float goes under an arch on its own) | The bedroom is through an arch (5,4) too low to ride under. Paddle the raft (12,7) to below the arch, lay the Bedroll on it, step ashore: the loose raft is wound north under the arch into the bedroom, the Bedroll aboard; Homeward (or being scraped off it into the water, and falling) takes you to it. Untie; the lever opens the way out east. Sent under with no Bedroll aboard, the raft is stranded in the bedroom: the brake. A reload in the bedroom west of the channel (where only the ferry reaches) starts Wren east of it, by the lever; one saved with the Bedroll on the ferry starts on the ferry, back at its landing (anywhere, a load in a House with the Bedroll on a float starts where the float is now) |
| The Prompt Box (the Marionette Hall's Knot) | 2,1 | Marionette Hall (puppets at a distance, through little doors) + Bell (a ring shoves harder) + the Pull | Walk the understudy (4,8) on the Crossbar through the little door (11,5) to under the painted rock (13,4) and let go: no heavier than it, it waits under it. Ring: it's wound north harder and shoves the rock off its place onto the plate (13,3), where the box's roof holds it: the gate (17,6) |
| The Top of the Spool | 1,0 | The Pull + Shears, in three pairs, Gran changing the room after each (`SpoolTop`) | Gran pulls everything; at the meeting she says her tally to Wren's face, once (`Tally.home()`: "Forty-one times this Wander I brought you home. I can't now."; a save that kept none: "Every time you fell..."). Six great threads hold the drum to the walls in three pairs, the lowest first; the ones still to come are wound round Gran's fists (held things wait: drag what you like along one, it won't give; cut, "It won't give"). A free one is too taut to cut until something out of its place is dragged along it (lying on it 24 frames, or wound north across it at once): it sags five seconds. **1, the crates** (Mallow's lavender and Jory's crimson, the lowest; four crates on the shelves below): throw a crate onto the thread, or leave one off its shelf in a column under it to be wound north across it; cut. **2, what she throws** (Dad's blue and Mum's brass): "No more of that." She takes the crates up into the drum and keeps them, lets the middle two run to the drum, and throws things off it at wherever Wren stands (the tile stitched red, a shadow growing, then it drops; 34 frames): stand on the thread, step off as it comes, and it lands on it and is dragged; or push, knock or throw one that's landed onto it. On Wren it only knocks her about and goes back up; left, Gran takes it back after 2.5 s (never while it's carried or held). **3, the dark** (Ives's teal and Bram's ochre): she lets the last two go to the drum and pulls the floor up from under them (the top two rows either side of the drum but the posts, a ledge below each post), and lets the crates down again; no more throwing ("There. Nothing can lie on them now."). Thrown onto the line, a crate falls into the dark and the drum has it back on its shelf; left off its shelf in a column under the line, it's wound north out over the dark, hanging on its thread (the Glazing Gallery's rule), across the line: it sags; cut from the ledge. Walked into, the dark is climbed out of where she went in. **Linnet's bracelet** (O1), shown to Gran any time before the end: the room goes quiet (nothing thrown, nothing off the walls) and she lets a pair go herself, the middle (or the last, if the middle's gone): from the first pair it's straight on to the dark; at the end she and Linnet walk up the north road into the mist. **The end**: Linnet comes in at the door ("Mum."), goes to her mother's side and takes one of her hands off the Spool; the other is Wren's to take: beside her or below, facing her, hold [act] (a tap only shows how; a button still down from the words before doesn't count). Gran tries twice to take it back to the Spool, then lets go; let go first and her hand goes back to it and waits. No menu | The Unwinding |

A save between the last cut and the Unwinding picks the end up again on entering the top room. Mid-fight a save keeps the threads cut (`great:<house>`) and how far Gran has changed the room (`gs_s1`: the crates up in the drum and her throwing; `gs_s2`: the dark and the crates back); one made after a pair's last cut but before she changed the room has her change it on the way in. A save from the room as it was before (threads cut in any order) goes on from the lowest pair still standing; one that showed the bracelet when it let three go has the middle pair let go too. A save made in the
first Great Spool (another map) starts again at the foot of the Well, its untied Knots kept (`Save.migrate`, flag `gs2`).

## O1 The Stray House (`src/77_strayhouse.js`; tests `tests/strayhouse.test.mjs`) - tested

Linnet's, at the Frayed Edge (door 72,6). It opens when Wren posts Linnet's seven notes through its slot (the Trail:
notes 1-7; the eighth is inside). Nothing in it has a thread: every block is a stray (pushed, it stays; into a hole or
water, it fills it and is gone for good; loose ones are back where they started when you come in again). Spare-stray
chutes in the rooms where holes are filled. No nudges. Music: Linnet's.

| Room | Cell | Idea | Solution | Reward |
|---|---|---|---|---|
| The Porch | 1,3 | Strays | Push the stray up into the row of holes and across (a spare by the wall); note 8 | the way in |
| The Parlour | 1,2 | Hub | West the Pantry, east the Garden; north a lock | - |
| The Pantry | 0,2 | Order and room | Three strays onto three plates: from the door the middle one can only go west; the north one comes out its shelf gap and goes west; the south one comes out and goes east; second gaps in each shelf let you walk round | key |
| The Bridge Garden | 2,2 | A trench | Three strays into the three holes in turn, each pushed over the last; the fourth over the filled trench onto the plate (spares from the chute) | key |
| The Stair Hall | 1,1 | Hub | Two strays up the column of holes to the chest (Heart Patch); the stairs open when both lanterns are lit (west and east levers) | Heart Patch |
| The Washhouse | 0,1 | Paddle, Hookline | Two stones into the water; from the second, the tub is just in Hookline reach: hook it over, paddle across; the lever | west lantern |
| The Mending Room | 2,1 | Needle | Strays on a pincushion you can't get behind: needle two straight onto plates; needle the third out, unpick it (a stray again), push it onto the last | east lantern |
| The Pile | 1,0 | Boss | It shoves after you (2x2); four corner nooks each with a slit too narrow for it: wait in one, slip out of the slit, and while it strains after you, push a stray across the nook's open side: boxed, it bursts and flings the strays about; 3x. Boxing it anywhere works too | Heartstitch |
| Linnet's Room | 0,0 | - | Her desk (diary), the window onto the Drift | Linnet's bracelet (the fuller ending) |

## O2 The Unfinished House (`src/78_unfinished.js`; tests `tests/unfinished.test.mjs`) - tested

Old Mr Ives's, up the bank east of the river in town (door 120,45; he stands outside from Reveal 1). He drew a whole
House in chalk forty years ago and never built it. In with the Needle and either the Guild pin (Gundry gives it for all
six Maker's marks: S06) or the Loom done. The Needle sews a chalk plank real: the nearest in line (reach 4); at a sewn
one it offers Unpick this one / Sew the next one along / Leave it. The Needle holds three stitches (planks and things
together): a fourth undoes the oldest, wherever it is, and whoever's on it drops through. The Shears snip a sewn plank.
A gap filled for good with a stray needs no plank. No nudges.

| Room | Cell | Idea | Solution | Reward |
|---|---|---|---|---|
| The Front Room | 1,3 | Sewing | Sew the two-tile chalk plank over the gap and cross; Mr Ives | the way in |
| The Drafting Hall | 1,2 | Hub | West the Long Gap, east the Loading Bay; the stairs open when both lamps are lit | - |
| The Long Gap | 0,2 | Three at once | Four separate gaps: sew two from the bank, the third from between, the fourth from between (the first comes undone behind you); the lever (west lamp) | west lamp |
| The Far Shelf | 0,1 | Mind where you stand | Four planks side by side: sew three from the bank, stand on the second, sew the fourth (the first goes); back: from the third, unpick the second and sew it again (newest now), stand on it, sew the first (the third goes, behind you). Or fall in and start again at the door | Heart Patch |
| The Loading Bay | 2,2 | You can't sew past what you push | Four planks side by side and a stray to push over them: you can't sew past it, and three is all you get, so fill one gap for good with the other stray, sew the other three, push it over onto the plate (east lamp); a chute drops spares | east lamp |
| The Gallery | 1,1 | Mr Ives's walk | From the walkway below, sew the five planks ahead of him as he walks to his chair (undo one under him and he drops back to the start) | the Long Hook (the Hookline reaches 10) |
