## The endgame: from the Frayed Edge to the end, and after

**Overview.** After the eighth House (the Loom, `d8`, the Shears) the goal line reads "The Shears can cut anyone free.
The town, first? And then the fog at the Frayed Edge, and your own thread." Cutting townsfolk free first is optional. The
main path: cut Wren's own thread at the fog (`cut_self`) → the Drift, across its stream to Linnet's garden → meeting
Linnet starts the Great Pull (`great_pull`) → home east on foot through the fog → the town in the Pull (`pull_seen`) →
down the Well → the Great Spool, the last House (area `greatspool`): six Knot rooms round its foot, untied in any order
(`untie:<house>`, then `spool_all`), the Climb, the Top (six great threads, `great:<house>`, then `spool_cut`) → Gran's
hand → the Unwinding (`unwound`) → credits → the free valley ("The valley is yours. Carry on."). Files:
src/74_drift.js, 75_greatspool.js (+ 75b_spool_art.js), 76_ending.js, 80b_tally.js, 80c_fog_hand.js, 80d_after.js,
the Shears in 70_shears_kit.js. Tests: tests/ending.test.mjs, greatspool.test.mjs, spooltop.test.mjs, drift.test.mjs,
review_end.test.mjs, the leg `LEG9` in tests/legs.mjs (with `spoolTop`, `holdGransHand`), afterword.test.mjs.

**Save states**: T49 (outside the Loom), T50 (the Frayed Edge, just before the cut), T51 (the Drift, first steps), T52
(Linnet met, the Pull begun), T53 (home in the Pull), T54 (the seed planted, the Well next), T55 (the Foot of the Well),
T56 (the Climb, 4 of 6 untied), T57 (just before the Top; loads beside the Bedroll on the Night Ferry raft), T58 (after
the ending). From T51 on there are no hearts on screen (intended, see below).

### 1. The Frayed Edge: cutting Wren's own thread

- **Where and how**: the fog at the Frayed Edge (the Loomwood's north-west, hub tile x 65 and below around y 19; the
  test stands at 67,19 facing west). Shears in hand, facing the fog (or standing in it) with nothing cuttable in front:
  Wren's own red thread is drawn from her to the Well, and the question "Cut my thread / Not yet". The same offer comes at
  any fog tile with the Shears, but the Frayed Edge is where the goal sends her.
- **"Not yet"**: nothing happens; it's counted (`aft:no:self`, read after the ending).
- **"Cut my thread"**: `cut_self`; hearts set full, then the spool and the hearts come undone and drift away from the HUD
  over 2 s while a line is read; goal "Into the fog, at the Frayed Edge. Nothing will pull you back now."
- **What changes for good** (tests/ending.test.mjs, review_end.test.mjs 3):
  - no hearts or spool on screen; hurts still knock Wren back but change nothing; nothing makes her faint;
  - falls: she climbs out on the side she went in from (the tile behind her if it's ground), unless the Bedroll lies in
    that area, when the fall flies her to it without harm;
  - the fog no longer turns her round: stepping into any fog tile of the valley takes her through to the Drift's east edge
    (first time: "Through the fog, the threads in it parting round you like a bead curtain, and out.", `drift_first`);
  - nothing more is added to the tally of times brought home (src/80b_tally.js).
- **QA notes**: cut before or after cutting townsfolk; the number cut before is kept (`aft:cutsAtSelf`). Try the Shears
  at fog away from the Frayed Edge (the south of Meadowfold, Kilnridge, Millwater): the offer and the fog pass should work
  the same. After the cut, a deliberate faint (secret S33's kind) is no longer possible: expected.

### 2. The Drift (area `drift`, src/74_drift.js, tests/drift.test.mjs)

- **What**: the wild country past the fog, 60x40 tiles, its own look and music (`drift`). Nothing out here has a thread:
  barrels and boulders are strays; nothing comes back. The map is blank until walked ("you draw it as you go"). Entered
  from the fog at its east edge (x 58); walking east past x 60 goes home (hub 67,19/20).
- **The stream** (x 40, north to south): the way west to Linnet. Push one of the stray boulders (43,16 or 46,21) west
  into it: it fills the stream for good (`fill:40,16`, `gone:drBoulder` in the recorded game). Stepping into the stream
  climbs Wren out on the bank she came from (review_end 4). The woods are solid.
- **Linnet's garden** (region "Linnet's Garden", 10-26 x 11-27): Linnet at 18,21. Talk: she recognises Wren (by the
  name the player chose), asks "How does it feel?" (Light. / Frightening. / Come home.; only her answer changes), tells
  her story briefly; a rumble; the Great Pull begins: `met_linnet`, `great_pull`; goal "Back to Hollowell, on foot. Gran
  is pulling the whole valley down the Well."; music `pull`; autosave. Talked to again she says one of a few short lines,
  or remarks on the old mill (`linnet_mill`) or a balloon (`linnet_balloon`) if those were done.
- **The Drift-bloom seed** (secret S11): the tall flower by her gate (13,22): Act takes a seed (`s11`, item `driftseed`), unless
  one was already got the other way (the Bedroll at the fog, before the cut) or planted.
- **Optional here**: the old mill up the stream (its wheel lifts the mill pond's sluice only while something floats past
  on its own; a barrel given a place by the wheel with the Needle keeps coming back, or the race dammed with the stray
  boulder (47,7) keeps a barrel in front of the wheel; a barrel paddled there and held does not count; the pond runs out
  (`drift_millpond`): the drowned road, a milestone, a toll box of 50 buttons); the balloon in the lone rowan by the old
  wall (only if it was cut loose at the fair: from its basket the whole Drift is drawn on the map, `drift_balloon`); three
  things Linnet cut loose over the years, each with an L, to read; an old marker stone. Details: the optional section.
- **QA notes**: going back east before meeting Linnet is allowed (home on foot, the Pull not started). After the ending
  Linnet is gone from the Drift and her sign says she's gone home (tests/ending.test.mjs).

### 3. The Great Pull and the walk home

- Started by meeting Linnet; it lasts until the Unwinding. Walk east out of the Drift (any time), through the fog, and
  south down the North Road into town.
- **In town** (hub x 64-127, y 40-79): everyone with a thread (not cut free, not Gran or Linnet) is dragged into an arc
  round the Well (95,59), its south side left open, walking backwards, faces turned from the Well, each with a thread
  streaming into it (tests/ending.test.mjs: at least 8 dragged, only those in town). Cut people stand free ("We're all
  right!"). Talked to, the dragged say they can't stop walking; anyone with a thread elsewhere is "holding on" to
  something. Nobody with a thread is indoors or in the Underside meanwhile (only people already cut free are there).
  Someone cut free during the Pull comes out of it at once (review_end 6/7).
- **First time within 14 tiles of the Well**: the camera goes to the square, two lines, goal "Down the Well, to the
  Great Spool." (`pull_seen`).
- **The Well**: Act: "Down the Well / Read the stones / Not yet". "Read the stones" reads the motto as it is in this act
  (`motto:act3`).
- **The seed** (optional, secret S11): Gran's garden plot by her gate (hub 73,51, Act from 74,51 facing west): "Plant it / Not
  yet" → `seed_planted` (T54 is just after). A shoot shows until the end; the flower blooms in the epilogue and after.
  Without a seed: a line about a bare patch.
- **Accepted**: the Pull's scene with dozens of threads ran at 45-50 frames a second in a software-rendered browser (no
  play during it).

### 4. The Great Spool (area `greatspool`; src/75_greatspool.js; tests/greatspool.test.mjs, spooltop.test.mjs)

**Overview.** The last House, under the Well. Its one new rule is the Pull; each Knot room is a House's own idea played
under the Pull with another House's tool. No tool is found here. The Knots can be untied in any order; the goal counts
them ("(n of 6)"). Every Knot untied and every great thread cut is saved (autosave). Gates latch once passed. Every room
round the foot has a nudge (hints on) after 100-150 s unsolved, none once solved. Its own music.

**The Pull** (the rule every room follows; shown at the Foot before it's needed: on the first look, "Things come
tumbling down the shaft after you... none of them stays where it lands", `gs_foot_told`):
- A thing on its own mark holds. Off it, once its patience runs out, it's wound in: not back along its trace but north,
  the way the threads on the floor run, a tile at a time, into the turning wall of thread at the head of the room; the drum
  then drops it back on its own mark as soon as that's clear (while anything is on it, or landing would wall Wren in, it
  hangs over its mark). Wound across its own mark on the way, it catches there. First time: a notice explains (`wound_first`).
- The rest is the Return's: held things wait (carried, gripped, paddled, on the Crossbar); a thing wound in shoves
  lighter things a tile on, waits behind anything as heavy or fixed (a pillar, a post, a sleeper) and shoves Wren only
  if heavy; plates are pressed in passing; it hangs on its thread over holes and water; a float carries whoever's aboard;
  the river keeps a loose float (each drift restarts its patience) till something stops it, but can't take one being
  wound.
- Broken, a thing's pieces fly north from where it broke, striking what they pass; then it's whole on its mark.
- A ring of the Bell winds in everything out of place in its reach at once, fast, shoving one weight harder; a sleeper
  woken goes too.
- Every thread is too taut for the Shears or the Needle ("Too taut: ... The Shears skid right off it." / "The Needle won't
  take a stitch."), except the six great threads at the top when slack. A sleeper's thread can't be cut down here either
  (review_end 1).
- Wren's thread is cut: nothing pulls her; a fall is climbed out of where she went in, unless the Bedroll lies in the
  Great Spool: then the fall flies her to it (see QA notes at the Top).
- An arch over water is too low to ride under: a float goes under on its own; whoever's aboard is scraped off into the
  water (`arch_scraped`), and the Paddle won't take a float under ("The arch is too low to get under, riding.").
- Each Knot room has a brake (a ratchet on the wall by its door): Act hauls it; everything in the room out of its place
  goes up into the drum and is laid back where it belongs, and the room's puzzle sleepers lie down again where they lay
  (first time a notice, `ratchet_told`; nothing to do: "Everything in here is already in its place.").

**Map** (3 columns x 4 rows of rooms; each room 20x11; room-local coordinates below):

```
                     [Top of the Spool 1,0]
                              | gate: all six Knots
[Night Ferry 0,1] ---- [The Climb 1,1] ---- [Prompt Box 2,1]
                              |
[Mill-Leat 0,2] ----- [Winding Room 1,2] ---- [Gale Loft 2,2]
                              | gate: the Foot's plate
[Airing Cupboard 0,3] - [Foot of the Well 1,3] - [Glazing Gallery 2,3]
                              |
                     (stairs up to the Well: back to town)
```
The Foot's west and east doors are open from the start, so its two Knot rooms can be done before its own puzzle. Each
Knot room's Knot sits behind that room's own gate. Rooms are wound in their Maker's thread colour (teal, ochre, blue,
brass, lavender, crimson); the rooms up the middle in every colour. Stepping back onto the stairs at the Foot (just south
of the entry, 29,42 in area tiles) returns to the square; the Pull is still on up there.

#### The Foot of the Well (1,3)
- **Idea**: the Pull, shown: off its place, a thing goes north, not home.
- **Elements**: a crate (8,7), a plate (5,3) with a pillar just north of it (5,2), the north gate (9,0), a sign (13,9)
  about six Knots and "a seventh place... an empty peg".
- **Solution**: push the crate 3 west (to 5,7). When its patience runs out it's wound north up that column onto the
  plate, where the pillar stops it: the gate opens, and latches once Wren goes through north (`door:gsFGate`).
- **Other outcomes**: pushed anywhere else it goes into the wall and drops back on its place. A light crate can't shove
  Wren: standing in its column stops it.
- **Nudge** after 100 s: a thread twitches over the plate, "in the lee of the pillar".

#### The Airing Cupboard (0,3), the Tidyhouse's Knot
- **Idea**: a thing at home blocks the way (the Tidyhouse), heavier and lighter, the Gloves; the Bell's ring; under the
  Pull, laid back the moment its place is clear.
- **Elements**: a wooden block (16,3; medium, patient: 5 s); a slot along column 14 with a plate at its foot (14,7) and an
  iron plate at its top (14,6, heavy things only); the old mangle (heavy), whose place is the top of the slot (14,6) but
  which sleeps across the room (9,3); the gate (4,2) wants both plates down; the Knot (2,1); the brake (18,4); Ives's
  laundry ticket (17,9).
- **Solution** (greatspool.test.mjs; LEG9): push the block 2 west and 4 south into the slot, onto its plate (14,7). Stand
  on the mangle's place (14,6) facing the block; grip it (Gloves) and, still holding, ring the Bell: the mangle wakes, is
  wound into the drum and hangs over its place because Wren is on it; let go, step off north: it drops onto its place on
  top of the block, which waits under it. Both plates down: the gate. Untie the Knot.
- **Alternative that's fine**: with the block in the slot, go across the room out of the block's hearing (the ring's
  reach is drawn) and ring within the block's 5 s, so only the mangle hears; it comes down on its place over the block.
- **Blocked**: a dash for the gate with only the block on its plate, or after holding it there a while, finds the gate
  shut (it needs the iron plate too; POLISH finding 60). Rung without the grip within reach of both, the block snaps out
  (a medium thing snapped shoves like a heavy one) and shoves Wren aside. Rung before the block's in, the mangle caps an
  empty slot: use the brake. Ringing from inside the slot: the mangle waits over its place rather than walling her in
  (finding 61).
- **State**: `door:gsTGate`, `untie:tidy`; the mangle lies down again when the room is built (until its Knot is untied).
- **Nudge** after 150 s at the top of the slot.

#### The Glazing Gallery (2,3), the Kiln's Knot
- **Idea**: shards strike what they pass, in order (the Kiln); the Crossbar; under the Pull, pieces fly north from where
  the pot breaks, and a thing hangs over a drop on its thread.
- **Elements**: a drop (most of the room's north part); charms hung over it: sun (5,4), moon (6,2), star (6,1), a cracked
  ember (6,5) that spoils the order; a post in the drop (7,3); a pot (2,8); Bram's clay understudy, a puppet (11,8); the
  balcony (4,4); the gate east (15,8); the Knot (17,8); the brake (1,7); Bram's chalked "SUN. MOON. STAR."
- **Solution** (greatspool.test.mjs; LEG9): take the understudy on the Crossbar and walk it to the drop's edge (7,7);
  let go: when its patience runs out it's wound north out over the drop, hanging on its thread, until the post stops it
  (at 7,4). Carry the pot to the balcony (4,4) and throw east: it strikes the sun in flight, breaks against the puppet,
  and its pieces fly north through moon and star: in order, the gate.
- **Blocked**: without the puppet the pot flies its full four tiles and breaks beyond, so only the sun is struck. A charm
  struck out of order, or the cracked one, puts them all out (a sun starts it again). Once the sequence is done it's kept
  (`seq:gsKs`).
- **Nudge** after 150 s over the drop under the post.

#### The Winding Room (1,2)
The hub: the foot of the drum (a deco six tiles wide, just east of the way up, so the way north is in plain sight from
every door: finding 60); doors west, east and north.

#### The Mill-Leat (0,2), the Millrace's Knot
- **Idea**: currents carry loose floats; a hold wheel turns while something sits on its water (the Millrace); the
  Hookline and the Paddle; under the Pull, the river keeps a loose float till it stops, then the drum takes it north.
- **Elements**: a raft (13,5) out in the pool; the leat (a current west along row 6, x 5-10); the wheel (4,3) and a post
  (5,2); the gate (4,8); the Knot (2,8); the brake (18,8); Dad's board "THE LEAT RUNS TILL SOMETHING STOPS IT".
- **Solution** (LEG9): from the bank (13,8) hook the raft over; step onto it; paddle to the head of the leat (10,6) and
  step down onto the jetty (south). The loose raft goes with the current to the leat's end (5,6); there its patience runs
  out and the Pull takes it north onto the wheel's water (5,3), where the post holds it: the wheel turns and keeps turning:
  the gate.
- **Note**: left in the pool after the hook, the raft is wound north and catches on its own place.
- **Nudge** after 150 s at the head of the leat.

#### The Gale Loft (2,2), the Belfry's Knot
- **Idea**: wind; sleepers; a bell's reach (the Belfry); the Hookline; under the Pull, a woken thing goes north.
- **Elements**: a gale blowing west across x 6-9 that nobody walks east through; a vane; a boulder asleep in the far
  corner (14,8) whose place is out by the middle (12,6); an old bell asleep on the frame (14,1) whose place is 11,1; an
  iron plate (14,2) under the frame; the gate (15,3); the Knot (17,2); the brake (1,7); Mum's ringing card.
- **Solution** (greatspool.test.mjs; LEG9): from (5,6) hook the boulder's empty place (12,6) and be reeled over the
  gale. Ring the Bell from the far end (14,9): the boulder wakes and is wound north up column 14 onto the iron plate and
  stops under the old bell, which was out of reach and sleeps on: the gate. Going back west, the gale carries Wren.
- **Blocked**: rung within reach of both, both wake and both go into the drum and home: use the brake (it lays both
  down asleep again).
- **Nudge** after 150 s at the boulder's empty place.

#### The Climb (1,1)
- **Idea**: a test of hands, fair.
- **Before all six Knots**: a quiet room with doors west (the Night Ferry) and east (the Prompt Box) and the north gate
  shut ("UP: THE SPOOL. (The way opens when every Knot is undone.)").
- **After** (`spool_all`): the gate opens and the Pull flings junk along four lanes (rows 2, 4, 6, 8; rows 2 and 6 from
  the east, 4 and 8 from the west), on one beat (96 frames), staggered: a train of six nose to tail, then a clear spell.
  Every throw is told first: the lane lit end to end, blinking faster as it comes, a glow at the end it comes from, a chirp
  for the lane in front of Wren. A hit knocks her back to the start of that lane (the row below it, marked by a stitched
  line), never further, and she's dazed (can't walk) until that train has gone by; never caught twice by one train.
  First hit: a notice (`junk_hit`). The rows between lanes are safe; nothing shelters her inside a lane.
- **Expected**: holding Up from the door gets caught two to four times every time (tests/review_blind_a.test.mjs);
  watching each lane and crossing behind a train is never caught (the leg's `climbWatching`). Fair difficulty here means
  that.

#### The Night Ferry (0,1), the Slumberhouse's Knot
- **Idea**: your own place, Homeward, a fall takes you to the Bedroll (the Slumberhouse); the Paddle; under the Pull, a
  float goes under an arch on its own.
- **Elements**: a raft (12,7); the water across the room's south and west; an arch (5,4) too low to ride under; the
  bedroom beyond it (north-west) with Mallow's spare bed, the Knot (6,3), a lever (9,3) and a gate (10,2) out east; the
  brake (18,6); Mallow's card ("NO RIDING THE FERRY TO BED").
- **Solution** (greatspool.test.mjs; LEG9): paddle the raft to just below the arch (5,5); lay the Bedroll on it; step
  ashore (east). When its patience runs out, the loose raft is wound north under the arch into the bedroom, the Bedroll
  aboard. Homeward: Wren lands on it. Step ashore east of the channel, untie the Knot, pull the lever: the way out east.
- **Alternative that's fine**: stay aboard with the Bedroll laid on the raft: the arch scrapes Wren off into the water,
  and the fall takes her to the Bedroll, on the raft in the bedroom.
- **Blocked**: paddling under the arch is refused; riding under without the Bedroll scrapes her off and she climbs out on
  the near side; sent under with no Bedroll aboard, the raft is stranded in the bedroom: use the brake.
- **Loads**: a save in the bedroom west of the channel (where only the ferry reaches) starts east of the channel by the
  lever; one saved with the Bedroll on the ferry starts on the ferry, back at its landing (T57 does exactly this).
- **Nudge** after 150 s under the arch.

#### The Prompt Box (2,1), the Marionette Hall's Knot
- **Idea**: puppets at a distance, through little doors (the Marionette Hall); the Bell's harder shove; the Pull.
- **Elements**: the understudy puppet (4,8); a little door (11,5) into the prompt box; a painted rock (13,4; a wooden
  block, medium, on its own place) with a plate north of it (13,3) under the box's roof; the gate (17,6); the Knot (18,2,
  reached up the east passage); the brake (1,7); Jory's pencilled note.
- **Solution** (greatspool.test.mjs; LEG9): walk the understudy on the Crossbar (keeping it in reach and in sight) through
  the little door to under the rock (13,5) and let go: wound north, no heavier than the rock, it waits under it. Ring the
  Bell: snapped, it's wound north harder and shoves the rock off its place onto the plate, where the roof holds it: the
  gate.
- **Nudge** after 150 s inside the prompt box.

#### The Top of the Spool (1,0): the climax
- **Elements**: the drum (8,1, 4x2 tiles); six great posts, three a side: rows 8 (Mallow's lavender west, Jory's crimson
  east), 5 (Dad's blue west, Mum's brass east), 2 (Ives's teal west, Bram's ochre east); four crates on shelves along the
  south (4,9), (6,9), (13,9), (15,9); Gran at the Spool. High on the drum, an empty peg on bare wood with a blank tag, in
  view throughout and never filled.
- **Meeting** (on entering, `spool_met`): Gran speaks; Wren: "You can't pull me, Gran."; Gran says the tally to her face,
  once: "<N> times this Wander I brought you home. I can't now." (N = every fall, sink or doze flown home, every faint,
  every fog turning, and Gran's own pull in the Hall of Names; not Homeward flights); "Not once..." for none; "Every time
  you fell this Wander..." without a number for a save that didn't keep the count from a new game (presets; older saves).
  Goal: "Cut the Spool's great threads, at their posts round the walls (0 of 6). Too taut to cut, unless something knocks
  one slack."
- **The rule**: a great thread still wound round Gran's fist won't give ("Gran has this one wound round her hand. It won't
  give."). A free one is too taut to cut ("Too taut", in full the first time) until something out of its place is dragged
  along it: lying on one of its tiles for 24 frames, or wound north across it. Then it sags for 5 s (first time a notice,
  `slack_seen`): cut it beside its post (facing the post; from below or above where the floor's gone). Each cut: a notice
  "(n of 6)", the goal updated, autosave.
- **Stage 1, the crates** (the lowest pair free, the four higher in her hands): throw a crate so it lands on the thread
  (a throw lands 4 tiles on), or leave one off its shelf in a column under the thread to be wound north across it; cut.
  Both cut: Gran: "No. No more of that."
- **Stage 2, what she throws** (`gs_s1`): she takes the crates up into the drum and keeps them, lets the middle pair run
  free, and throws things off the drum at wherever Wren stands: the tile stitched red and a shadow growing for 34 frames,
  then it drops. On Wren it only knocks her about and goes back up. Left lying, she takes it back after 2.5 s (never while
  it's carried or held). Stand on a free thread, step off as it comes: it lands on the thread and is dragged: cut. Or push,
  knock or throw one that's landed onto a free thread. On a held thread nothing happens.
- **Stage 3, the dark** (`gs_s2`): she lets the last pair go and pulls the floor up from under them (the top two rows
  either side of the drum, all but the posts; a ledge below each post), lets the crates down again, and stops throwing
  ("There. Nothing can lie on them now."). A crate thrown onto the line falls into the dark and is back on its shelf. A
  crate left off its shelf in a column under the line is wound north out over the dark, hanging on its thread, across the
  line: it sags; cut from the ledge.
- **Linnet's bracelet** (from the Stray House; optional): talk to Gran any time before all six are cut: "Show her / Not
  now".
  Shown (`bracelet_top`): she lets a pair go herself, the middle (or the last if the middle's gone), and the room goes quiet
  (no throwing, nothing coming off the walls). Shown at stage 1: after Wren cuts the lowest pair it's straight on to the
  dark. At the end Gran and Linnet walk up the north road together in the epilogue.
- **The end** (all six, `spool_cut`): Gran takes hold of the Spool itself ("Don't, love..."); Linnet comes in at the door
  ("Mum."), goes to her mother's side and takes one of her hands off the Spool. Goal: "Take Gran's other hand." No menu.
  Stand beside Gran on the side away from Linnet (or below her), facing her: a notice "Hold [act] to take her hand." (Tap,
  with Grip on toggle). Hold Act: a button still held from the last words doesn't count, and a tap only shows how. Held, a
  ring of 16 stitches is sewn on the floor under the clasped hands (160 frames in all); Gran tries twice to take the hand
  back to the Spool (at about a quarter and two thirds), then lets go. Let go first and her hand goes back and waits, the
  ring unpicking slowly (a stitch every half second); taken again it goes on from there. Then the three stand in a row,
  hands held, and the Unwinding begins.
- **Saves** (spooltop.test.mjs, ending.test.mjs): each stage comes back as it was (the crates up in the drum and her
  throwing; the dark and the crates back); a save made just after a pair's last cut, before she changed the room, has her
  change it on the way in; threads cut in another order in an older save go on from the lowest pair still standing; a save
  between the last cut and the Unwinding picks the end up again on entering the top room (Linnet comes in again).
- **QA notes**:
  - With the Bedroll laid anywhere in the Great Spool, a step into the dark flies Wren back along her trace to the Bedroll,
    unhurt, which may be far below (checked headless from T57: back to the Night Ferry). That is the Pull's stated rule ("a
    fall takes her to it"), not a defect; roll the Bedroll up or lay it at the top to avoid the walk back up the Climb.
  - Gran and Linnet don't budge when leant on; Gran can't be cut ("Her own isn't one the Shears can reach."); Linnet can't
    ("Nothing to cut."); puppets' strings can't (review_end 2/5).
  - Past bug fixed (finding 75, a picture review): the climax had Wren facing the wall after the last cut: she now turns
    and comes a few steps in toward Gran. A stray "Too taut" line that nearly gave the answer was rewritten (finding 36).

### 5. The Unwinding, the epilogue and the credits (src/76_ending.js)

Triggered by Gran letting go. Played as a run of shots with no HUD (HUD hidden, no saving in between). At its start:
`unwound`, and `cut:<who>` for every person (so the whole valley is free); the note of evidence for the after-scenes is
frozen into the save (`aft:snap`). In order: the square as the Pull left it, every thread going slack and falling; the
birds flying off over the edge of the valley and, a long while later, back; everyone stepping off their spot (Arlo walks
to the river, Hob is out in a boat); Mother Ives's line for the Makers; the road north through what's left of the fog (with
`bracelet_top`: Gran and Linnet walking up it, the bracelet given); Gran and Linnet on the bench by her gate with Biscuit
between them; the bloom by the gate if `seed_planted`; if the bracelet is still in the satchel, Wren gives it to Linnet,
who gives it to Gran (`bracelet_given`); with secret S30's drawing (`s30`), Tuck's drawing on Gran's dresser; a week later, the
Well re-carved; Wren walking up the new road; fade.

**Credits**: six pages, about 4 s each (Act or the stick moves on after the first 2/3 s): the title; "Made by the Makers
of Hollowell" with each Maker and House; the Loom and the First Spinner; "Wanderer:" and the player's chosen name (with
Wren drawn); Linnet, Hesper and Biscuit; "The End. (Carry on.)". Then the goal "The valley is yours. Carry on.", Wren in
the square (hub 95,63), the HUD back (no hearts), autosave.

**The changed title** (any save slot holding a finished game, i.e. `unwound` in that save; tests/review_end 11): no mist,
a road out over the hills with three people walking it, birds, the subtitle "a Wander (and after)", and "Continue" reads
"Carry on". Erase or overwrite every finished slot and the title is as before (expected). (SPOILERS.md mentions a
storage key `hollowell-ended`; the code reads the slots, not that key.)

### 6. The free valley, after the ending (src/76_ending.js, 73_freed.js, 80d_after.js; T58)

- **Everyone free**: every townsperson walks a small round of their own near their old spot (no thread, never dragged)
  and has new lines (`AFTER_LINES`), indoors too (tests/ending.test.mjs, review_end 11). Gran and Linnet sit on the bench
  by Gran's gate (hub 78,53 and 80,53). Linnet is gone from the Drift (her sign: gone home). Pudding the dog runs
  about again (he lay by his ball from the festival till now). The fog is still there, drawn slack; with Wren's thread cut it still leads into the Drift.
- **The Well**: Act reads the last motto (`motto:act4`; reading all four acts' mottos is secret S35, `s35`). There's no way down
  any more.
- **The bench**: after Gran's or Linnet's own after-line, "Between them, the middle of the bench is free." Sit down / Not
  now (Not now keeps it for later). Sat (`aft:sat`, once): Gran mentions a thing or two she felt during the Wander, Linnet
  answering where there's room, and a short closing exchange. What she mentions comes only from what the save recorded of
  play (the evidence frozen at the Unwinding: the fog turning her, "not yet" with the Shears, who she cut and in what order,
  leaning on people, holding on in the Hall of Names, Tuck's thread, the north gate early, Linnet's notes, the Bell at the
  Well, sitting to wait, Homeward), at most four lines; never a count of times home. With nothing recorded (a preset or an
  old save), a plain fallback line. If the two are ever not side by side on the bench, the same words are said standing.
- **The cellar** (Gran's house; locked since the second reveal, `well_locked`): after the ending, "Go down the steps? Go
  down / Leave it" → her ledger (`aft:ledger`): a few lines written at the time, in the order they happened, a line about
  the fog, an empty page, and one line at the bottom with the same count Gran gave at the Spool.
- **What the player can still do**: everything optional that's left; the Drift (through any fog). The Bedroll still works:
  Homeward flies to wherever it was last laid, even down into the Great Spool (checked headless from T58: it lands on the
  Night Ferry's raft; the Pull is off there now, Gran isn't at the top, and the Foot's stairs lead back up to the square
  with no errors). That's the only way into the Great Spool after the end.
- **Expected flags**: `unwound`, `aft:snap`, `cut:<everyone>`, the goal "The valley is yours. Carry on."; `aft:sat` and
  `aft:ledger` once seen. `HW.afterword()` (debug or headless only) explains what a save's bench and ledger would say and
  why (tests/afterword.test.mjs plays seven different trajectories through it).
- **QA notes**: the lines after the ending depend on how the game was played, so two playthroughs legitimately differ; a
  save that never cut anyone, never leant on anyone, etc. gets fewer lines. Report a line that claims something that didn't
  happen in the tester's own play (that's the rule the code keeps: "a thing is said only if it happened"), not one that's
  missing. Never judge these from a preset or a warped state.

### 7. Known accepted behaviour (this part of the game)

- No hearts on screen from the self-cut on; hurts do nothing; no fainting: intended (nothing left to unravel).
- No quick retry anywhere, the Spool's top included (there's nothing to faint from there anyway).
- The Climb catches a player who walks straight up without watching: intended (finding 34 made it so).
- The Spool's top is six cuts of the same action in three changing situations; the bracelet saves two of them: as
  designed (a design audit agreed the shape and kept it).
- Every thread in the Great Spool refuses the Shears and the Needle: intended (the six great threads, slack, aside).
- In the Night Ferry a load can put Wren somewhere else than she saved (by the lever, or on the ferry at its landing):
  intended, so nobody is stranded where only the ferry reaches.
- The Great Pull scene's lower frame rate in software rendering: accepted (no play during it).
- The Guild's key, given by Gundry after the second reveal, describes itself as opening the Loom; the Loom's door is
  actually opened by the silk warp across it (the Loomwood's four socket weights). Flagged for the Loom section to
  confirm; not part of the endgame.
