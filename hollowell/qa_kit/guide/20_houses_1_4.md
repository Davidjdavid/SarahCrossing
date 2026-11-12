## Houses 1-4: the Tidyhouse, the Kiln, the Millrace, the Belfry

### Conventions for all four Houses

- **Coordinates.** A House is a grid of rooms ("cells"), each 20x11 tiles. Room-local tiles: x from the west wall (0-19), y from the north wall (0-10). Cell `cx,cy` starts at absolute tile (cx*20, cy*11); room keys in the code are `'cx,cy'`. The tests address rooms the same way (`at(room, x, y)`).
- **Built fresh.** A House is rebuilt every time Wren enters it (and on every load): everything marked is back on its place. What survives is kept as flags: area flags `door:<id>` (a lock opened, or a gate *latched*), `chest:<id>`, `lever:<id>`, `seal:<id>`, `charm:<id>`, `seq:<name>`, `woke:<id>` (a sleeper woken for good), `got:<id>` (a pickup), `fill:x,y` (a pit filled by a stray); story flags such as `tidy_<doorId>` / `kiln_<chestId>` (set when a door or chest of the Tidyhouse or Kiln is open), `<house>_boss`, `<house>_knot`, `d1`..`d4`.
- **Latching gates.** A gate with `passed: up/down/left/right` stays open for good once Wren walks through it in that direction (within 3 tiles of it). Before that it is open only while its signal holds. A gate never closes on Wren standing in it or on anything standing in it.
- **Wren's mark.** In a House her mark is the doorway she came into the current room by. Falling into a pit or stepping into deep water flies her home to it along her own trace (red thread). A load starts at the mark too.
- **Fainting** (hearts at zero) in a House: she comes to at the House's front door (its `entry` tile), hearts full, the House rebuilt. A boss not yet beaten is back at full strength. First time: a line; later times: a notice only ("You come to by the door of the House again.").
- **Damage units.** "A full heart" is 2 points, "half a heart" 1. Bosses' tells come from `tellFor(house, beat)`: House 1 40/36/32 frames by beat, House 2 36/32/29, House 3 32/29/26, House 4 28/25/22.
- **Keys** are counted per House (`Inv.keyCount[house]`). Leaving a House with one shows, once, "The small key in your pocket tugs back towards the House..." and the key stays counted for that House. The big door needs that House's Pattern.
- **Nudges (Options > Hints).** Each puzzle room has one (`nudge` in its cell), fired once (area flag `nudged:<roomKey>`) after 2-4 minutes in the room unsolved. The very first nudge of the game asks first (a voice behind the wall in the House's Maker's manner; "No" turns Hints off). Boss rooms have one nudge per beat (`BOSS_NUDGES`, src/41_house_kit.js), after 2.5 minutes in that beat. Options shows Hints as "ask first" until the game has asked.
- **Waiting.** The pause menu offers "Sit and wait for things to come home" in a House room with things out of place (runs the game fast until they're home; tests/polish2).
- **After a boss.** The Knot hoop and the boss's Heartstitch appear in the boss room. If Wren leaves before tying, both are rebuilt there whenever the House is built again (`HOUSE_AFTER`). Tying asks "Tie the Knot" / "Not yet"; then the threads pull in, the winch picture plays (a notch, no words), `<house>_knot` and `d1`..`d4` are set, the goal line changes, an exit door to the overworld opens in the boss room, and the game autosaves.
- **Old saves.** Several rooms keep compatibility code for saves from before a room moved (noted per House); a tester using the catalogue saves will not meet these paths.

---

### 1. The Tidyhouse (area `tidy`; src/42_tidyhouse.js; tests/tidy.test.mjs, review_blind_e.test.mjs, told_seen, live5, live3_ui)

**Overview.** The first House, in Meadowfold (door at overworld 108,92; out to 108,93). Mother Ives's (teal thread). Its grammar is the Return itself: patience as a timer, plates pressed by things in passing, heavier shoves lighter, a thing at home blocks the way home, carried and thrown traces; then (with the Gloves) pulling and gripping. Needs nothing to enter (the Wanderstaff from the ceremony). Gives the Gloves (from the Dust Monger, mid-House), 3 small keys, the Plan, the Pattern, 2 Heart Patches, the Heartstitch, the Tidy Knot. The Gloves are introduced by their item line ("Hold [act] against something to grip it... Step back while gripping to pull it") and first needed in the Laundry next door.

**Save states.** S04 (Foyer, just inside), S05 (entering the Hall of Busts), S06 (Linen Closets, just after the Gloves), S07 (Antechamber, before the boss), S08 (outside after the Knot).

**Map** (lock = small key; gate = signal; big = Pattern):

```
 y0   [Attic 0,0]        [Grand Hall 1,0] <-big- [Antechamber 2,0]
          | (bookcase)                                | lock lN
 y1   [Library 0,1] ---- [Ballroom 1,1] -gate lW- [Linen Closets 2,1] ---- [Laundry 3,1]
                              | gate hN                | gate pN
 y2   [Pantry 0,2] ----- [Hall of Busts 1,2] -lock hE- [Parlour 2,2] ---- [Conservatory 3,2]
                              | gate fN
 y3   [Kitchen 0,3] ---- [Foyer 1,3] -lock fE- [Gallery 2,3]
                              | out to Meadowfold
```

- Keys: Kitchen (`kKey`), Pantry (`pKey`), Laundry (`lKey`, needs the Gloves). Locks: Foyer east `fE` (Gallery), Hall east `hE` (Parlour), Linen north `lN` (Antechamber). Two keys and two locks are reachable before the Gloves; the third pair after. **Any order of spending keys finishes the House** (POLISH finding 66: the outside tester asked if spending key 1 on either door was a trap; it is not).
- The Linen Closets can be reached two ways: Parlour north gate `pN`, or the Ballroom's shortcut lever (18,4) which opens the Linen west gate `lW` for good (`tidy_shortcut`). The Ballroom is reached only through the Hall of Busts' north door, so **the Hall of Busts is mandatory** (the Pattern is in the Ballroom).
- Optional: Gallery (Plan), Conservatory (Heart Patch), Library/Attic (Heart Patch, signature), the pie (Kitchen), the Staff Only door (Pantry).

#### Foyer (1,3)
- **Idea:** patience as a timer.
- **Elements:** wood block `foyerBlock` (5,5); plate (7,5) signal `f1`; north gate `fN` (9,0) when `f1`, latches passed up; east lock `fE` (19,5); sign (11,9); the door out (9,10).
- **Solution:** 1. From (3,5) push the block east twice onto the plate. 2. Walk straight to the north gate and through before the block goes home (medium patience 2 s plus the walk).
- **Shortcuts blocked:** dawdling: the block goes home and the gate shuts (test "dawdling lets the gate close").
- **State:** `door:fN` once passed (open on every later build); `tidy_fN`.
- **Nudge** (2 min): "Somewhere in the walls, something ticks... like a block counting before it goes home."

#### Kitchen (0,3)
- **Idea:** lift and throw; pots shatter and re-form; crystals flip when struck.
- **Elements:** crystal `kCrystal` (4,1) behind the low counter (row 3, x1-7: low tiles don't stop a throw); three teal pots (12,5), (16,4), (11,7); hidden key chest `kKey` (13,2), appears on `kc`; the warm pie on the table (3,7).
- **Solution:** lift a pot, stand at (4,4) facing up, throw: it clears the counter and flips the crystal; the key chest appears (13,2).
- **Pie (secret S05):** Action at the pie: hearts refilled to full, flag `pie`, "For my favourite Wanderer. Don't tell."; afterwards an empty dish.
- **State:** `chest:kKey`; `pie`.

#### Gallery (2,3), optional (the Plan)
- **Idea:** "a thing at home blocks the way home". The closet wants two plates pressed together.
- **Elements:** bust `galBust` (9,5) on its own stiff **iron** plate (9,5) `g2` (only something heavy *at rest* on it sinks it: `minWeight: heavy`, `settled`); far plate (10,5) `g1` in a nook reached only through the bust's place (the nook's south side is a one-way step `v` at (10,6)); alcove above the bust (9,1)-(9,4); wood block `galBlock` (8,5); closet gate `gG` (16,4) when `g1&g2`, latches passed up; Plan chest (16,1); a dust bunny; sign: "Each one knows its place, and once it is back in it, nothing gets past."
- **Solution:** 1. From (9,6) push the bust up into the alcove (1 or 2 tiles). 2. From (7,5) push the block east twice, through the bust's place onto the far plate (10,5). 3. Stand clear. The bust comes home behind the block and sits in its way home: both plates held for good. About a second to spare at a normal pace (review_blind_e).
- **Shortcuts blocked (fix round E, finding 70):** the bust pushed onto the far plate lifts its own (Wren or the block on the iron plate are too light): the closet never opens however fast. The bust going home from the far plate never sinks both at once. Tested in review_blind_e.
- **QA notes:** Standing on the far plate with the bust home opens the closet (Wren can see what it wants) but it shuts as she steps off. If Wren is in the nook when the bust comes home she hops down the step at (10,6); nothing else can use the step.
- **State:** `door:gG`, `chest:gPlan`; the Plan (opens the House's map).

#### Hall of Busts (1,2): read this one carefully
- **Idea:** heavier shoves lighter: a returning heavy thing pushes a lighter thing one tile along its own way, and then, at home, blocks that thing's way home.
- **Elements:**
  - Middle bust `hallBust` at (9,6) (heavy, marble, patience 2.5 s).
  - Plate `hb` at (9,7), **directly south of the bust's place**, one step past it in the direction the bust comes home from the north.
  - Wooden block `hallBlock` at (8,5) (medium): right beside the bust's lane (the column x 9).
  - North door `hN` (3,0), gate when `hb`, latches passed up. It sits at the west end of a walkway along the top (rows 1-2) that is walled off from the hall below (row 3) except at its **far east end (18,3)**.
  - Two more busts at (2,8) and (17,8), a nibbler on the walkway (15,2), the east lock `hE` (19,5) to the Parlour, the west opening to the Pantry, the south door from the Foyer.
  - Sign (11,9): "THE HALL OF BUSTS. Solid marble, every one. They always go home, and anything lighter in the way gets moved along."
- **What the room asks:** the north door is a long walk from the plate (east to (18,4), up through (18,3), west along the walkway to (3,1): roughly 28 tiles). So the plate must be held **for good**, not for a few seconds. Nothing simply pushed onto the plate stays there: everything marked goes home.
- **How the player is meant to read it:** the sign gives the rule (busts go home, and move lighter things along). Pushing the middle bust off its place draws its teal thread on the floor, showing its way home runs straight down the column past the block's side. The plate sits exactly one step past the bust's own place on that way. The Gallery next door (if done first) shows that a thing at home blocks another's way home. The nudge (after 4 minutes, if Hints are on): "The bust in the middle looks restless. Anything it moves along on its way home ends up one step past its spot."
- **Intended solution (tests/tidy.test.mjs, review_blind_e "at a person's pace"):**
  1. Stand on the plate (9,7) facing up and push the bust up twice: it ends at (9,4) against the walkway's wall. Wren is now at (9,6).
  2. Walk round the block (via (8,6), (7,6)) to (7,5) and push the block east one tile, into (9,5): the bust's lane. Do this within the bust's patience: checked headless, a direct walk leaves 74 frames (about 1.2 s) of the bust's patience when the block arrives; review_blind_e still passes with a further second of pauses (DUNGEON_TRACKER says "about 1.5 s to spare").
  3. Step out of the lane and off the plate (the test goes to (6,7)).
  4. The bust comes home down the column and shoves the block down to (9,6), then onto the plate (9,7); the bust stops at home (9,6). The block's way home now runs back through the bust (equal or heavier: it waits behind it), so it stays on the plate for good. The north door stays open.
  5. Walk east along the hall, up through (18,3), west along the walkway, north through (3,0) into the Ballroom. The door is then latched.
- **Shortcuts that must not work:** the bust, or the block, pushed onto the plate and a dash for the door. The door is open under 180 frames (the bust's or block's patience and its walk home); the fastest possible dash, computed over every route at Wren's top speed, needs 300+ (314 measured). Test: review_blind_e "no dash at any speed gets there before it shuts"; tidy.test.mjs "just pushing the block onto the plate is not enough". Blocked by the walkway's entrance being at its far east end (fix round E, finding 70; earlier the race could be won by 13-25 frames).
- **Why testers stick here (by design):** the outside AI tester (finding 69) first read the busts as fixed scenery (they look like furniture), then raced the gate over and over with a bust or block on the plate. Neither is a bug: the room's own idea is the only way, and the rooms past it need the Gloves anyway. Getting the Gloves first (via the Parlour) does not change this room.
- **State:** `door:hN` once passed through northward; `tidy_hN`. Rebuilt on re-entry with the bust home and the block back at (8,5); the door stays open.
- **QA notes:** pushing the bust up only one tile leaves nothing in its lane to shove. If Wren stands on the plate when the bust returns, the block can't be shoved onto it (the bust strains behind it). If she stands in the lane she is shoved (a heavy returning thing shoves Wren).

#### Pantry (0,2)
- **Idea:** a thrown thing's trace crosses a pit; it stays while its patience lasts.
- **Elements:** plate `pt` (4,5) on an island in a ring of pits; crates (10,2), (15,3); nook gate `pG` (14,6) when `pt`, latches passed down; key chest `pKey` (16,8) in the nook; the cupboard (wood block `cupboard`, (16,1)) in front of the Staff Only door (16,0).
- **Solution:** lift the crate at (10,2) (from (10,3)), stand at (8,5) facing west, throw: a throw always lands 4 tiles away, on the plate. Go straight to the gate and through it (14,6) southward while the crate sits there (light patience, 1.5 s); open the chest from (15,8).
- **Staff Only (secret S04):** push the cupboard east from (15,1), stand where it lives (16,1), Action facing up: a dark space of ropes and pulleys, a crank turning by itself; the door slams and something is wedged under the handle. Flag `staffonly`. Afterwards "Locked tight." The cupboard can't come home onto Wren (it waits behind her).
- **State:** `door:pG`, `chest:pKey`, `staffonly`.
- **Nudge:** "A crate creaks. The little island looks just about one good throw away."

#### Parlour (2,2)
- **Idea:** a plate pressed in passing, including by a thing on its way home.
- **Elements:** wood block `parBlock` (2,7); pulse plate `pp` (4,7), `time 190` (it fires each time anything goes over it and runs down from the click, even with something sitting on it); north gate `pN` (16,0) when `pp`, latches passed up; the lower corridor (rows 7-8) walled off from the top (row 6, x1-12).
- **Solution:** from (1,7) push the block east 6 tiles, past the plate to (8,7). Walk to (16,1) under the gate. The block's way home crosses the plate; the gate opens for 190 frames; walk up through it.
- **Blocked:** standing on the plate and running: too slow (the plate runs down under her). Since fix round E the plate and the gate both show a ring of brass stitches unpicking as the time runs out; once passed, the gate is open with no ring (review_blind_e). The gate sits under the HUD's top-right corner; the HUD steps back from it (review_blind_e, review_blind_f).
- **State:** `door:pN`, `tidy_pN`.

#### Conservatory (3,2), optional (Heart Patch)
- **Idea:** parity: toggle plates flip on each press, and a thing going home presses them too.
- **Elements:** toggle plates `ca` (6,3) and `cb` (12,3) (a lamp in each: lit on, dark off) along a one-tile corridor (row 3, entered up the west side at x 1); crate (5,7); gate `cG` (16,4) when `ca&cb`, latches passed up; Heart Patch chest `consPatch` (17,1).
- **Solution (test):** carry the crate up the corridor (over A: on) to B (on); throw it back west down the corridor; walk out over A; the crate goes home over A. A has been pressed an odd number of times: both on; the gate opens.
- **Nudge:** "You count the clicks of the plates on the way in and on the way out. Odd. Even. Odd."

#### Linen Closets (2,1): mini-boss, the Dust Monger; the Gloves
- **Elements:** the Monger (9,4); busts (6,3), (13,7); teal pots (1,1), (18,1), (18,9); shutters south (16,10) and east (19,5) (group `monger`); north lock `lN`; west gate `lW` (open only with `tidy_shortcut`); hidden big chest (9,5) with the Gloves on `tidy_monger`.
- **Fight:** it wakes when Wren enters (shutters shut, boss music): "Your stick would just bounce off all that fluff. Something thrown might not..." 2 HP. Armoured: the stick bounces off; thrown things and shards hurt it, and the nudge says "so does anything heavy on its way home" (push a bust so its way home crosses the Monger). One big move every ~280 frames: it crouches 40 frames (shivering), its shadow on the spot where Wren stood, and comes down there (a full heart if she's still under it). Otherwise it hops toward her.
- **Defeat:** it bursts into dust bunnies that hop away under the four closets; the shutters open; the Gloves chest appears (Action from (9,6)). Flags `tidy_monger`, then `gotGloves`.
- **Tested:** the flop dodged and not (tidy.test.mjs); the win itself is driven by the test harness, not by real throws (no scripted real-input win; unverified as a full real fight, though legs.mjs plays the House through).
- **QA notes:** if Wren came in from the Ballroom through `lW`, that gate is not a fight shutter and stays open during the fight (by the code; untested).
- **Fainting here:** back at the Foyer; the Monger is there again at full strength.

#### Laundry (3,1)
- **Idea:** the Gloves pull.
- **Elements:** a cubby (12,4)-(13,4) opening east; key chest `lKey` (12,4) at its back; wood block `laundryBlock` (13,4) in its mouth; dust bunny, nibbler.
- **Solution:** from (14,4) facing west hold Action (grip) and step back east: the block follows; pull it out to (15,4). Step into the cubby, open the chest from (13,4). The block comes home behind her; push it east out of the way to leave.
- **Nudge:** "The block in the cubby can't be pushed in any further. It could come out, though."

#### Ballroom (1,1): the finale, "tidy up" (the Pattern)
- **Idea:** a deadlock: two heavy busts whose ways home run head-on through one corridor; one must be held while the other passes.
- **Elements:** corridor row 5, x 5-14 (walls above and below). Bust B `ballB` (home 17,3) set out at (1,8) in the south-west corner, its way home floating over pits (4,6)-(4,8), (2,8)-(3,8). Bust A `ballA` (home 2,5) set out at (17,8) on a ring of pits in the south-east. Both start tied off (`tiedOff`, set out). Lever `ballLever` (6,9) releases them; pulled again it sets them out again. Lever `shortcut` (18,4): opens the Linen west gate for good. Hidden big chest `pattern` (9,2) on `tidy_ballDone`. Sign (7,9): "Pull the lever and everything goes back where it belongs. Pull it again to set it all out again. (No pushing in the corridor.)"
- **Solutions (four tests):** (a) pull the lever, stand at (5,7) (or (3,6)) facing west, and grip B with the Gloves as it floats past over the pit at (4,7); hold on while A goes through the corridor and home; let go: B goes home. (b) After a jam, pull B back out of the corridor's west end with the Gloves, then pull it up out of the line (to row 4) so A passes beneath; let go.
- **Blocked:** standing in a bust's way only gets Wren shoved aside (they are heavy). Released together they deadlock in the corridor for good; the lever sets them out again. With both home, the lever says "Everything here is already where it belongs."
- **Outcome:** a chime, a shake and the line "Both busts home. Something clicks, and a big chest stands where nothing stood before." with the camera leaning to show the chest (review_blind_e finding 71; live3_ui). Flag `tidy_ballDone`.
- **Nudge:** "Two threads, one corridor. One of them will have to wait its turn. Something will have to hold it."

#### Library (0,1) and Attic (0,0), optional
- **Library:** a tall bookcase `secretShelf` (9,1) in front of the north doorway; it won't push ("very solidly against the wall"); with the Gloves, grip it from (9,2) facing up and step back: a passage north. Sign: "PLEASE DO NOT PULL THE BOOKSHELVES." Once the Attic has been entered (`tidy_attic`), the bookcase stands aside at (10,2) for good.
- **Attic (signature room):** teal M.I. sampler, armchair, a teapot and two cups set out; Heart Patch chest `atticPatch` (13,3); the signature (10,6): `sig:tidy`, "(Maker's marks found: n of 6.)".

#### Antechamber (2,0)
- Rest room before the boss. Pots (4,3) and (15,3) drop hearts. Big door `bossDoor` (0,5) west: the Pattern. Sign: "The Housekeeper is in. Please wipe your feet and do not touch the furniture."

#### The Grand Hall (1,0): boss, the Grand Housekeeper
- **Elements:** busts `gb1` (3,4), `gb2` (16,4), `gb3` (9,8), `gb4` (9,2); pots (1,1), (18,9) holding hearts; the Housekeeper on its teal cross (9,4); a shutter behind Wren (19,5).
- **Intro:** it steps off its spot (the teal cross shows), stamps back onto it, glares at the busts and at Wren (told_seen). 3 HP; three beats. Damage only while it is **stunned with its doors hanging open**: then the stick hits (one point, a heart drops, it recoils home). Pots just bounce off. It counts "mess": a heavy thing out of its place in this hall (not a pot, not carried). The first time it sees mess: "Tsk!" toast.
- **Beat 1:** it walks over to the mess and yanks it home from beside it. Push a bust toward the wall (the test: (3,4) one tile west) so that the Housekeeper, arriving from the room side, stands on the bust's way home: the yank slams the bust into it: stunned. Hit it.
- **Beat 2** (toast: it plants itself on its cross and yanks from there): the way home must cross its cross. Bait a charge (stand in line with it); while it's off its cross (after a charge in this beat it recoils 110 frames, long enough to reach a bust), push the top bust (9,2) down 3 across the cross to (9,5). Back home, it yanks the bust back up through itself: stunned.
- **Beat 3** (toast: it won't leave its cross, yanks at once): grip a bust with the Gloves, pull it out and hold on: the thread goes taut and the Housekeeper is dragged into the bust: stunned. Let go, hit it.
- **Moves (all with tells):** charge down a lane lit to the wall (beats 1-2; a full heart; out of the lane it misses); stamp, a ring drawn on the floor round it when Wren is close (half a heart); beat 3 only, a coat-hanger flung along a lit line (7 tiles) that lies on its thread then comes home along it (half a heart each way). Touching it costs half a heart (not while it's stunned or charging). Tested dodged and not (tidy.test.mjs).
- **Hearts:** one drops each time it's hit (not the last); the two hall pots hold hearts. No heart lands on a bust's head (live5).
- **Nudges per beat** (2.5 min): 1 "It always walks right up to the mess before it yanks it home. A bust coming home stops for nobody standing on its way." 2 "...Whatever's standing on a thread gets what's coming home along it." 3 "...A thing held fast won't come when it's yanked: whatever's yanking comes to it instead." The game's first nudge asks first, here too (review_blind_e).
- **Faint:** back at the Foyer, fight reset.
- **Defeat:** it unravels into teal yarn that runs across the floor down a little hole by the north wall (told while seen). `tidy_boss`; shutter opens; Hoop at (9,5), Heartstitch (`tidyHeart`) at (11,6).
- **Fair difficulty:** slow, telegraphed moves; each beat's idea uses only rules already taught (beats 1-2 the Hall of Busts' shove; beat 3 the Ballroom's grip).

#### After the Knot
- The Tidy Knot ("One Knot of six..."), flag `d1`, goal: "Go back to Hollowell and tell Gran. Next, the Kiln in Kilnridge: the canyon road west of Meadowfold." A doorway of daylight opens in the hall's south-east corner (17,9), told with the doorway in view (told_seen), to Meadowfold (108,93).
- Elsewhere: the Inn attic's Tidiness Trials open, the kids switch to "Housekeeper", town news lines (see 25_regions_early.md).

#### Tidyhouse QA notes and known accepted behaviour
- Key order is never a trap (finding 66).
- The Hall of Busts and the Gallery can't be dashed (finding 70); both have signs saying how busts behave, never what to do (review_blind_e checks the signs contain no step: no "plate/block/push/door/gate/closet").
- Every timed gate in the House shows its time as a ring of brass stitches (the Parlour's; finding 70).
- The exit door added after the Knot is part of the post-Knot script; after leaving, the House is walked through normally.

---

### 2. The Kiln (area `kiln`; src/45_kiln.js, src/44_kiln_kit.js; tests/kiln.test.mjs, kiln_kit.test.mjs, review_blind_e)

**Overview.** House 2, in the Kiln Mesa in Kilnridge (door 22,93; reached through the forecourt gate, see 25_regions_early.md). Bram's (ochre). Grammar: a broken pot's shards fly home back along the way it was **carried** and strike whatever hangs or stands on that way (charms ring, seals break, foes crack): Wren lays the shards' path by walking. One flight rings many charms; the last thing walked under rings first; doubling back erases a stretch (loop erasure); the path can run through doorways and over chasms (the Hookline). Gives the Hookline (mid-House, from the Glazer), 3 keys, the Plan, the Pattern, 2 Heart Patches, the Heartstitch, the Fired Knot.

**Charms** hang from the ceiling over floor; only flying things (thrown things, shards) reach them. Modes: `once` (stays rung), `pulse` (rung for a while, a ring of stitches shown at the gate it holds), `seq` (must be struck in order; with `fade`, each only rings a moment). Clay **seals** shatter when something thrown or shards hit them; the stick doesn't ("Hard clay. Something thrown might crack it."). **Hookline:** reach about 7 tiles; latches on eyelets, heavy or fixed things, and empty marks (reels Wren there); pulls light or medium things toward her (up to 8 tiles); a reeled thing hangs over pits; fetches pickups; never latches on a sleeper or a chest.

**Save states.** S10 (Kiln Door), S11 (Glazing Room with the Hookline), S12 (Glaze Vats), S13 (outside after the Knot).

**Map:**

```
 y0  [Potting Shed 0,0]      [Kiln's Heart 1,0] <-big kBoss- [Glaze Vats 2,0]
        | cracked wall                                         | lock gN
 y1  [Drying Racks 0,1] -lock fW- [Furnace Hall 1,1]          [Glazing Room 2,1] ---- [Chasm Gallery 3,1]
                                   | gate hN  ^ ledge (2,10), one way down   | gate smsN      | (S)
 y2  [Doubling Back 0,2] ------- [Charm Hall 1,2] -lock hE- [Sun, Moon, Star 2,2]   [Bridge of Cords 3,2]
                                   | seal eSeal
 y3  [Long Way Round 0,3] ------ [Kiln Door 1,3] ------ [Crock Pen 2,3]
                                   | out to Kilnridge (22,94)
```

- Keys: Kiln Door (`eKey`), Doubling Back (`dKey`), Bridge of Cords (`bKey`, needs the Hookline; no lock on the way to it). Locks: Charm Hall east `hE` (to the Hookline), Glazing Room north `gN` (Glaze Vats), Furnace Hall west `fW` (Drying Racks, across the pit: needs the Hookline). Two keys before the Hookline; any order finishes.
- Optional: Long Way Round (Heart Patch), Crock Pen (Plan), Chasm Gallery (Heart Patch), Potting Shed (signature).

#### Kiln Door (1,3)
- **Elements:** pit (x5-14, rows 4-6); `once` charm `eCharm` (9,5) over the pit, signal `ek`; gate `eGate` (17,3) when `ek` (latches up); key chest `eKey` (17,1); clay seal `eSeal` (9,0) in the north doorway; pots (2,8), (16,8); pulse charm `lwrCharm` (1,7) by the west door (200 frames, works the next room's gate).
- **Solution:** lift a pot, throw it north from (9,8): it flies through the charm and rings it; the key nook opens. Lift the other pot, throw it north from (9,2) at the seal: it breaks; the way north is open.
- **State:** `charm:eCharm`, `seal:eSeal`, `door:eGate`, `chest:eKey`.

#### Long Way Round (0,3), optional (Heart Patch)
- **Idea:** the carried path is the shard path, even through a doorway.
- **Elements:** gate `lwrGate` (3,4) when `lwr` (latches up); Heart Patch `lwrPatch` (3,2); a Crock; plaque: "Rung from next door. Be here when it rings."
- **Solution:** in the Kiln Door, lift a pot and walk under the charm at (1,7), west through the door to (3,5), throw it: its pieces fly home back under the charm next door; the gate opens while Wren waits beside it.

#### Crock Pen (2,3), optional (Plan)
- Three Crocks (walking pots: one knock shatters them; their pieces fly home the way they walked, and hurt; they re-form 4 s after). The shutter (0,4) shuts while any is alive and Wren's inside. Break all three before they re-form: `kiln_crocksDone`, the shutter opens, the Plan chest appears (17,5).

#### Charm Hall (1,2)
- **Idea:** one flight rings many.
- **Elements:** pulse charms `hA` (5,2), `hB` (14,2), `hC` (9,8) (about 2.7 s each); north gate `hN` (9,0) when all three (latches up); east lock `hE`; pots (2,8), (17,8); the one-way ledge from the Furnace Hall lands at (2,0).
- **Solution (test):** lift the pot at (2,8); walk (2,2), under A (5,2), under B (14,2), (17,2), (17,7), (16,8), under C (9,8), (8,8); throw west. The pieces retrace the walk under C, B, A at once: the gate opens.
- **Blocked:** one throw at a time: each dies away (test).
- **Nudge:** "Three charms, all to ring at once. One throw only rings what it flies through... but the pieces go back the whole way you came."

#### Sun, Moon, Star (2,2)
- **Idea:** order: the last walked under rings first.
- **Elements:** a ring corridor round a solid block; `seq` charms sun (9,9) order 0, moon (17,5) order 1, star (9,1) order 2, each rings 150 frames (`fade`); pot (1,8); gate `smsN` (16,0) (latches up); mural: sun, moon, star, "In that order, please. All in one breath."
- **Solution (test):** lift the pot; walk (1,1), (17,1) [under the star], (17,9) [under the moon], (4,9) [under the sun]; throw west. The pieces ring sun, moon, star, each before the last dies away.
- **Blocked:** walked sun-moon-star, they ring backwards and fall silent ("..."); thrown at one at a time, each has died away before the next (tests).
- **State:** `seq:sms` (stays rung), `door:smsN`.

#### Doubling Back (0,2)
- **Idea:** loop erasure: walking back over your own path unpicks it.
- **Elements:** pulse charms `dA` (5,5) on the main corridor (row 5) and `dB` (12,2) up a spur; pot (17,8); hidden key chest `dKey` (15,2) when both.
- **Solution (test):** lift the pot; west along row 8 to (1,8), up to (1,5), east along row 5 under A to (12,5), up the spur to (12,3); throw north. The pieces come back down the spur under B and along under A.
- **Blocked:** carried east along the corridor and back west under A: that stretch is erased, A never rings (test).
- **Nudge:** "Walking back the way you came unpicks the thread: the pieces would skip that bit. Finish where the charm is."

#### Glazing Room (2,1): mini-boss, the Glazer; the Hookline
- **Fight:** a clay knight with a glazed shield always turned to Wren. 2 HP. The stick bounces off. Only its own shot's pieces crack it, coming home into its **side**. It lines up with Wren, aims (its line lit, 36 frames), throws a clay shot up to 9 tiles; the shot breaks where it stops (on Wren: half a heart) and its pieces fly back along the same line through the thrower. Step off its line once it has thrown: it turns its shield to her, side on to its shot: the pieces crack it. Two of those and it crumbles.
- **Blocked (fix round E):** standing still in front of it, its shot comes home into its shield every time; it never cracks; a line says so once ("The pieces come home and clatter off its glazed shield. It never takes its shield off you.", flag `glazer_shield`).
- **Move:** too close (under ~2 tiles) it braces (shield up, "!", the 2-3 tiles ahead lit) and barges (a full heart).
- **Defeat:** cracks head to foot and crumbles into a heap of clay dust (told while seen). `kiln_glazer`; shutters (16,10), (19,5) open; big chest with the Hookline at (9,6). The north lock `gN` is a lock, not a shutter (a key can open it during the fight; the big door beyond needs the Pattern).
- **Nudge:** "Its shield turns to follow you wherever you go. Its shot, though, always comes home the way it went."

#### Chasm Gallery (3,1), optional (Heart Patch)
- Two chasms (x4-6, x11-13, all rows); eyelets (8,2), (15,7), and (2,8) for the way back; Heart Patch `cgPatch` (17,9). From (3,2) hook east to the eyelet: reeled to (7,2); from (10,7) hook east: to (14,7); open the chest from (17,8).

#### Bridge of Cords (3,2): key 3
- **Idea:** shards follow reels.
- **Elements:** pit across the room (rows 4-6); `once` charm `bCharm` (6,5) over the drop, out of reach of any throw from the edge; eyelets (6,1) north and (14,9) south; pot (3,8); key chest `bKey` (17,2) when it rings.
- **Solution (test):** from (14,3) hook south: reeled to (14,8). Lift the pot (3,8); from (6,7) hook north: reeled over the pit to (6,2), carrying it. Walk to (9,2), throw east: the pieces fly home back along the reel under the charm.

#### Furnace Hall (1,1)
- **Idea:** hook an empty mark.
- **Elements:** pit (x4-6, all rows) between the hall and a west strip (x1-3); crate `fCrate` (3,5) on its mark on the strip; pots (16,2), (16,8); west lock `fW` (0,5); the strip's step down at (2,10) into the Charm Hall (one way); sign: "No hooks over the furnace pit, please. Nothing over there to hook on to anyway."
- **Solution (test):** lift the pot at (16,2); from (7,5) throw west across the pit: it knocks the crate off its mark to (2,5). Hook west at once: the hook catches the empty mark (3,5) and reels Wren onto it. Unlock `fW`.
- **Way back east (fix round E):** step down through (2,10) into the Charm Hall; it only goes down; from below it's wall; nothing else passes it (review_blind_e). Before this, the Drying Racks could strand Wren west of the pit.
- **Nudge:** "Where the crate sits, there's a little stitched cross. Knock the crate off it and there'd be nothing on that cross at all..."

#### Drying Racks (0,1): the Pattern
- **Idea:** combination: four charms, one flight, a reel over the pit in the middle.
- **Elements:** pit (x7-11, rows 3-7); pulse charms `rA` (16,2), `rB` (16,8), `rC` (9,5) over the pit, `rD` (2,8), 220 frames each; eyelet (5,5) west of the pit; pot (18,6); hidden big chest `kPattern` (2,2) when all four; a hollow cracked wall `sigSeal` (9,0) to the Potting Shed.
- **Solution (test):** lift the pot; walk (18,2), (16,2) [A], (13,2), (13,8), (16,8) [B], (16,9), (12,9), (12,5); hook west: reeled over the pit under C to (6,5); walk to (2,8) [D], (2,9); throw east. All four ring at once: the Pattern chest appears.
- **Potting Shed (signature, optional):** a pot thrown north from (9,2) breaks the hollow wall; inside, Bram's mosaic, a turning wheel, half a sandwich, and the signature (`sig:kiln`). (DUNGEON_TRACKER lists a Heart Patch here; the room's code has no chest. The Kiln's two Heart Patches are the Long Way Round's and the Chasm Gallery's.)
- **Nudge:** "Four charms, one flight. The path will have to cross the pit... and you can only cross it on a line."

#### Glaze Vats (2,0)
- Antechamber. Pots (8,3), (11,3) drop hearts; (9,8). Big door `kBoss` (0,5). Sign: "Something long and glazed sleeps in there. It follows people."

#### The Kiln's Heart (1,0): boss, the Kilnwyrm
- **Elements:** four urns (pots that come home fast: patience 1 s) at (2,2), (17,2), (2,8), (17,8); the wyrm (9,2); shutter (19,5).
- **Rule:** 3 HP; glazed: only shards crack it (the stick and whole thrown things don't), wherever they meet it, head or coils. Each crack: it reels back, a heart rolls free (not on the last).
- **Beat 1:** it follows Wren's footprints exactly. Carry an urn along a path, smash it: the pieces fly home along the same footprints and meet it. Move: close behind her (between ~1.75 and 2.5 tiles) it rears up hissing, mouth aglow (36 frames), then darts along her footprints (a full heart; keep walking and it falls short).
- **Beat 2** (toast: it pours itself round the rim of the room, faster and faster): it runs a fixed loop round the room's edge. Carry an urn out across the rim and back in another way (not looping back over the same tiles, which erases the stretch) and smash it just as it comes round. Move: a glob of hot glaze where she stands (its shadow first; half a heart), leaving a puddle that burns a few seconds.
- **Beat 3** (toast: the floor cracks into a glowing pit, x7-11 rows 3-7; brass eyes, eyelets, at (5,5) and (13,5)): it coils in the pit, out of reach. Carry an urn across the pit on the Hookline (eyelet to eyelet) and smash it beyond: the pieces fly back over the pit through its coils. Move: it rattles and sheds four pieces round the pit's edge (shadows first), each lying on its thread to the pit, then flying home along it (half a heart each way).
- **Nudges per beat:** 1 "It follows your footprints exactly..." 2 "...A pot's pieces fly home the whole way it was carried, and hit whatever's on that way." 3 "...A pot's pieces fly home the way the pot went, over a pit or not."
- **Defeat:** it comes apart pot by pot; the pieces rattle across the floor down a crack by the west wall; the pit closes over. `kiln_boss`; Hoop (9,4), Heartstitch `kilnHeart` (9,7).
- **After the Knot:** the Fired Knot; `d2`, `tagStopped` (the town's kids stop playing tag); goal "Back to Hollowell. Then east: the broken bridge in Meadowfold, and Millwater beyond it. Your Hookline should get you over."; a door in the chamber's south-east corner (17,9) onto a ledge high on the mesa, out to Kilnridge (22,94) (told while seen, told_seen).

#### Kiln QA notes and known accepted behaviour
- The Glazer asks one thing (finding 70); "standing still wins" was removed.
- The Drying Racks no longer strand you (one-way ledge, finding 70).
- Threads drawn as long straight diagonals across pits and reels are by design: a thrown or flown stretch comes home in a straight line (finding 28).
- A crock's pieces hurt Wren on their way home; the shed pieces in beat 3 lie on their threads first: intended.

---

### 3. The Millrace (area `millrace`; src/49_millrace.js, src/49b_millrace_foes.js, src/47_water_kit.js; tests/millrace.test.mjs, water_kit.test.mjs, review_blind_e, told_seen, live5)

**Overview.** House 3, above the falls in Millwater, on the far bank (door 175,105; out to 175,106). Dad's (Ambrose, blue). Reached across the river on the Millwater ferry. Grammar: currents against the Return. Floating things (crates, wood, rafts, barrels) drift a tile at a time along currents; their trace grows as they go, so they come home the long way, at half speed against the flow. A float whose mark is on a current runs by itself like a ferry: waits at its mark, goes, waits at the end, comes back. Rafts carry Wren (and what she carries). Wheels watch a water tile: `pulse` wheels turn a while after a float passes, `hold` wheels (red ratchet hub) only while one sits there. **The Paddle:** stand on any float and hold [tool] with a direction to steer it a tile at a time; paddling holds it (no drift, no return). Strays fill water in. Deep water can be stepped into on purpose (lean on the edge): Wren sinks and flies home. A **ferry bell** on a post by a landing: rung, its ferry stops waiting (at home it sets off now; at the far end it starts home now). A float coming home onto the bank with Wren aboard sets her down beside it. Gives the Paddle (from the Snapjaw), 2 keys, the Plan, the Pattern, a Heart Patch (Shard Race), a Heart Patch (Workshop), the Heartstitch, the Running Knot. Its item line names the button to hold and steer (finding 71).

**Save states.** S15 (Wheel Hall), S16 (Snapjaw's Race with the Paddle), S17 (the Lock, before the boss), S18 (Millrace Falls after the Knot).

**Map:**

```
 y0  [Workshop 0,0]   [The Millpond 1,0] <-big lkBig- [The Lock 2,0] -gate lkGate-> [The Bell Race 3,0]
        |                ^ big upBig (S)                ^ gate twGate (S)
 y1  [Overflow 0,1] --- [Upstream 1,1] -lock upLockE (18,5, upper floor)- [The Two Wheels 2,1]
                          |
 y2  [Shard Race 0,2] -lock caLockW- [The Carousel 1,2] ---- [Snapjaw's Race 2,2]
                          | gate whGate
 y3  [Ferry Pool 0,3] --- [Wheel Hall 1,3] ---- [Backwash 2,3]
                          | out to Millrace Falls
```

- Keys: Ferry Pool (`fpKey`), Upstream (`upKey`, top of the race: needs the Paddle). Locks: Carousel west `caLockW` (Shard Race, optional), Upstream east `upLockE` (on the upper floor, reached only from the top of the race). **The way to the Paddle is never locked** (test "keys"), so no unlocking order strands you.
- The House's end (the Two Wheels, the Lock, the Bell Race, the Millpond's two big doors) starts from the top of the race: nobody meets Old Grindle without the Paddle.
- Optional: Shard Race (Heart Patch), Backwash (Plan), Overflow/Workshop (signature, Heart Patch).

#### Wheel Hall (1,3)
- **Idea:** drift; a pulse wheel turned by a float passing.
- **Elements:** a race along row 2 flowing east with a footbridge at (9,2); crate `whCrate` (3,3) on the bank; pulse wheel `whWheel` (12,1) watching the water below it, `time 360`; gate `whGate` (9,0) when `wh` (latches up); pots; sign: "What floats goes where the water goes. Then it comes home, the long way round."
- **Solution:** from (3,4) push the crate up into the race; as it floats past the wheel the gate opens a while (and again on its way back). Walk through.
- **Nudge** (2 min): "The crate sits right by the race. The wheel above the water creaks, as if it would like something to turn it."

#### Ferry Pool (0,3): key 1
- A ferry `fpFerry` runs between its landing (16,6) and an island (6,3). Board at (16,6), ride out, step off west, open the key chest from (4,3) facing west; board again at (6,3) when it comes back (or ring the island's ferry bell: at home it sets out now; rung from aboard at the island it starts home now; test "ferry bells").

#### Backwash (2,3), optional (the Plan)
- From the landing (2,4) hook the raft `bwRaft` over (reeled to (3,4)); step aboard; the current takes it home to its platform (9,4); step off; the Plan chest from (10,3); hop down the ledge at (11,5) to get back.

#### The Carousel (1,2): hub
- A raft `caRaft` on a ring current round the millstone; it goes all the way round and stops at home (9,7) again; get on and off at the west (5,5), north and east (14,5) landings. West lock `caLockW` (1,5) to the Shard Race; north to Upstream; east to Snapjaw's Race.
- **Review fix:** stepping at a raft as it pulls away does not drop Wren in the water (test).

#### Shard Race (0,2), optional (Heart Patch)
- **Idea:** Kiln + rafts: a pot's carried trace rides with the ferry.
- Lift the pot by the dock (from (18,5) facing up); board the ferry `srFerry` at (16,5); it carries her under three charms to the far landing (14,2); step off east, throw: the pieces ride back under all three at once; gate `srGate` (17,2) (latches right); Heart Patch from (17,2). Smashing a pot on the dock rings nothing (test).

#### Snapjaw's Race (2,2): mini-boss, the Snapjaw; the Paddle
- **Rule:** only what the race brings hurts it. While it swims it ducks anything floating its way (test: a crate sent down while it swims: it ducks, untouched). Reared up at Wren on the bank, it hunts along the bank a good while with its back to the race.
- **Solution (test):** stand at the bank's edge (11, row) to bait it up; step back one tile (10, row) out of its reach (the snap misses); then, while it hunts along the bank, push one of the two crates on the bank (`sjCrate1`, then `sjCrate2`) east into the race from (10, the crate's row): the current brings it down onto the Snapjaw. Two knocks (the test baits at (11,2), then (11,4)).
- **Move:** its bite: the bank's edge it can reach is lit while its jaws are open; staying there costs a full heart.
- **Defeat:** its ball of yarn bobs down the race under the floating crates (told while seen). `millrace_snapjaw`; the Paddle chest (4,5), opened from (4,6).
- **Nudge:** "It ducks anything floating its way, so long as it's watching the water. Reared up at you on the bank, it isn't."

#### Upstream (1,1): key 2
- **Idea:** paddle against the current.
- A raft `upRaft` at the foot of the race (9,8). Without the Paddle it just sits (test). With it: board, hold [tool] + up: up the race (slow: 32 frames a tile upstream) to (9,2); step off at the top; the key chest to the west. The raft drifts home. **To get down:** lean into the water from the edge: Wren sinks and flies home to her mark (test "jump in to go home").
- The top runs east onto the upper floor to the lock `upLockE` (18,5); from the foot of the race there is no way round to it (test). The big door `upBig` (9,0) north is at the top too.
- **Review fix:** the Hookline thrown from a raft leaves the raft alone (test).

#### Overflow (0,1) and Workshop (0,0), optional
- **Overflow:** two pale stray millstones; push them into the double race (x 8-9, row 2) to make a crossing: stray 1 from (13,2) west 4 into (9,2) (it sinks and fills the tile for good); stray 2 from (14,8) up 5 to (14,2), then from (15,2) west 6, over the filled tile into (8,2). Filled tiles are `fill:x,y` (permanent). Then north at (4,0).
- **Workshop:** blue A.R. on the floor (signature, Action from (10,6)): `sig:mill`; drafting table, model mill; Heart Patch chest from (16,8).

#### The Two Wheels (2,1)
- **Idea:** holding: the Paddle, or the Gloves from the bank.
- A raft `twRaft` homes at (2,2) and drifts east to the first hold wheel's water (12,2); the sluice `twSluice` (15,4) opens on `tw1` and lets a crate down to the second wheel. Both turning together sets `millrace_twoWheels`; the gate `twGate` (1,0) lifts (latches up).
- **Solutions (tests):** board from (1,2), ride to (12,2), hold [tool] (paddling holds it there) until both wheels turn; step off south. Or from the bank at (12,3) facing up, grip the raft with the Gloves when it arrives.
- **Blocked:** left alone, the raft heads home before the crate gets there (test).

#### The Lock (2,0)
- **Idea:** synthesis: a thing at home blocks the way home, heavier shoves lighter (Tidyhouse), the Hookline (Kiln), on water: a hold wheel kept turning with nobody holding.
- **Elements:** a race with a log `lkLog` (wood: medium, floats) at its mooring; crate `lkCrate` on the bank (8,2); the keeper's hold wheel watching (3,3), a dead end past the log's mooring; gate `lkGate` (19,5) when `lk` (latches right) to the Bell Race; big door `lkBig` (0,5) west to the Millpond.
- **Solution (test):** from (11,3) hook the log west: reeled down the race toward Wren (to (10,3)); from (8,1) push the crate down into the race; step back. The log comes home up the race and shoves the crate past its mooring onto the wheel's water (3,3), then sits at home in the crate's way home for good. The gate lifts and stays. (Paddling the log away also works per the tracker; not tested.)
- **Blocked:** the crate carried and set on the wheel's water heads home and the gate drops; the crate in the race with the log still home just floats down and back (tests).

#### The Bell Race (3,0): the Pattern
- **Idea:** synthesis: Kiln order (the last passed rings first), loop erasure and shards following a ride; the ferry passes the bells one way going out and the other coming home.
- **Elements:** a ferry `brFerry` from the west landing (4,2) east along row 2 to (14,2) and back; three bells (seq `brs`: sun, moon, star per the carving), each only rings a moment; a pot on the bank (lifted from (13,7)); an island east (17,3); the Pattern chest `brPattern` (2,4).
- **Solutions (tests):** get a pot to the far end without riding out: (a) from (17,6) hook north: reeled over to the island with the pot; board the ferry at its far end (14,2) and ride it home; or (b) from the bank at (14,6) hook the ferry over while it waits at the far end, board, ride home. Riding home it passes star, moon, sun; step off at the west landing and throw the pot west: its pieces fly back past sun, moon, star in order: `seq:brs`; open the chest from (2,5). (Paddling round is named in the tracker; untested.)
- **Blocked (tests):** ridden out with the pot and smashed at the far end: star, moon, sun: wrong, they fall silent. Out and back on the ferry: the thread unpicks itself (nothing of the ride left in it) and nothing rings. Pots thrown from the bank one bell at a time: each dies away before the next.
- **Old save:** a game that already held the Pattern (it used to be in the Two Wheels) finds 20 buttons in this chest (`millpattern`).

#### The Millpond (1,0): boss, Old Grindle
- **Entry:** from the Lock's big door (east side) or Upstream's (south); both doors shut behind (`group: 'boss'`).
- **Rule:** three rounds (3 HP). It swallows whatever float comes to rest in its open mouth (a rider is snapped off first); one fills it and it settles low, its gear-heart showing for the stick. Struck, it sulks till Wren is **wholly ashore** (a toe over the water still counts as on it), then turns the sluice: the races run another way (the great wheel in the wall is seen grinding, told_seen). It spits only at Wren on the bank, never while she's on the water.
- **Round 1 (test):** from (14,2) push the barrel down into a side race that runs into its mouth: it swallows it and settles. Board the ferry raft `gRaft` at its landing (9,7) from (9,8); ring the ferry bell beside the landing (facing west): it sets off at once up the ferry race; at (9,5), just below the mouth, strike up. Ride home, step off.
- **Round 2 (test):** the side races now run away from it and the ferry race runs into its mouth: it eats the ferry, raft and all. Push the west barrel `gbW` from (5,2) into the water, step onto it (the Paddle), paddle east to beside its mouth (x 8) and hold; when the ferry has filled it, strike from the barrel (facing east). Paddle back, step off.
- **Round 3 (test):** jaw shut. The stick and thrown things only clang ("Nothing whole gets between those teeth"); the turn's line says only a chink is left between its teeth, too fine for anything bigger than a chip (fix round E). One race runs past its teeth; the raft's landing is now still water. Lift a pot (from (7,8)), board at (9,7), push off with one stroke of the Paddle (up): the race takes the raft up past the mouth and on; once past the teeth (12,4) throw the pot east: its pieces fly home back between the teeth. Down.
- **Blocked (tests):** a pot smashed below its mouth (9,5) sends its pieces home down the race, away from it. On a float at its mouth while it's hungry, it bites.
- **Moves:** spit after it rears back, cheeks aglow (1, 2, 3 blobs by round; half a heart; a step aside and it flies past); from round 2 it slaps the pond: the bank's edge near Wren lit white, then a wave over it (a full heart; also while it's full); round 3, rivets from its sprung plates along lit lines that come home along their threads (half a heart each way). A heart each round.
- **Nudges per beat:** 1 "It swallows anything that floats to rest in its open mouth..." 2 "It eats the ferry now. Anything else that floats goes wherever it's paddled..." 3 "Clamped shut, it takes nothing whole between its teeth. Little pieces get in, and a pot's pieces fly home the whole way it was carried." (review_blind_e checks the round-3 nudge fires once, in the boss room.)
- **Defeat:** it sinks; `millrace_boss`; Hoop (17,9), Heartstitch `millHeart` (4,9).
- **After the Knot:** the Running Knot; `d3`; goal "Next, Belfry Heights: across the lake from Millwater, up the cliff stair. (The Paddle will get you over.)"; a hatch in the millpond wall's south-west corner (2,9) opens onto the falls, out to Millrace Falls (175,106).
- **Fair difficulty:** round 3 was unsolved by blind solver E in 16 tries; its rule is now said before it's needed and its nudge exists. It remains the hardest beat of the first four Houses; that is intended.

#### Millrace QA notes and known accepted behaviour
- Ferries wait at a landing for a set time; boarding a raft that is just about to set off home can carry Wren back; this is the Return, not a bug (the playthrough waits for a staying raft).
- A raft homing onto the bank sets Wren down beside it, never inside it (water_kit).
- A dive into the river from Millwater's far bank costs one heart and lands on dry ground (millrace test "review fixes").
- Drifting things move only every so often (a float bobs ~1.7 s at its own mark before the river takes it); slow is intended.

---

### 4. The Belfry (area `belfry`; src/56_belfry.js, src/56b_belfry_foes.js, src/54_belfry_kit.js; tests/belfry.test.mjs, belfry_kit.test.mjs, review_d4.test.mjs, review_blind_a/e/f, told_seen, live5)

**Overview.** House 4, at the top of Belfry Heights (door 158,7). Mum's (Tess, brass). Grammar: wind gusts displace light and medium things remotely (a tile at a time downwind; not things on their way home) and push Wren (she walks faster than a gust pushes, but gripping something heavy holds her put); a bell (struck by the stick, a throw or shards) or the Recall Bell rings: every displaced marked thing within 7 tiles snaps home at once, fast, shoving one weight harder than a plain return; held things (carried, gripped, paddled, on the Hookline) don't snap. A ring wakes **sleepers** (things tied off where they lie: they go home) and bats. A ring's reach is drawn as a dotted ring that holds a moment and stops at the room's walls (review_blind_a). Gives the Recall Bell (from Clangor), 3 keys, the Plan, the Pattern, 3 Heart Patches (Rafters, Echo Room, Workshop), Linnet's note 4 (Echo Room), the Heartstitch, the fourth Knot.

**Sleepers (review_d4):** can't be pulled, gripped, lifted or hooked (the Hookline bounces off with a "z"); only a ring moves them. A woken sleeper stays awake through leaving, re-entry, save and load (`woke:<id>`), except puzzle sleepers (`resetSleep`), which lie down again when Wren leaves the room unsolved (the Reach, Bell Ropes, the Bell Frame). Slabs of wall "a bit too clean, warm, like something asleep" are sleepers hiding doorways.

**Save states.** S20 (Bell Porch), S21 (Clangor's Loft with the Bell), S22 (the Cistern, before the boss), S23 (Hollowell after the Knot).

**Map:**

```
 y0  [The Great Bell 1,0] ---------------------------- [The Cistern 2,0] (big brBig on its west side)
        | gate brStair (barred from above until Tollgrim's beaten)   | (S) gate fbGate
 y1  [Workshop 0,1] =sleeping wall= [Bell Ropes 1,1] -gate brEast- [The Bell Frame 2,1]
                                       | lock clLockN
 y2  [The Reach 0,2] ------------ [Clangor's Loft 1,2] =sleeping wall= [Echo Room 2,2]
                                       | lock stLockN
 y3  [Weathercock Walk 0,3] ----- [The Stair 1,3] -lock stLockE- [The Rafters 2,3]
                                       |
 y4  [The Draught 0,4] ---------- [Bell Porch 1,4] ------------- [Windward 2,4]
                                       | out to the Heights
```

- Keys: the Draught (`drKey`), Weathercock Walk (`wcKey`), the Reach (`reKey`, needs the Recall Bell). Locks: Stair north `stLockN` (Clangor's Loft), Stair east `stLockE` (the Rafters, optional), Loft north `clLockN` (Bell Ropes). Any order finishes.
- **The way up after the Pattern:** Bell Ropes east gate `brEast` (opens with `belfry_ropes`), the Bell Frame, the Cistern, the big door `brBig` into the Great Bell from the east. The bell stair north from Bell Ropes (`brStair`) opens only once Tollgrim is beaten. A game that opened the big door when it was in Bell Ropes finds it open (same id, test "old saves"). No softlock: the frame's gate stays open once passed, its boulder lies down again while it isn't; the Cistern's drawbridge lever is on the far side.

#### Bell Porch (1,4)
- **Idea:** a ring wakes a sleeper.
- A boulder `bpBoulder` asleep in the doorway north (9,2) (home 10,2); a bell `bpBell` (6,4); two bats; sign: "Strike a bell, and listen. (Mind the bats.)" **Solution:** stand at (6,5), strike the bell (stick, facing up): the boulder wakes and goes home; the way north is open; the bats wake. Flag `woke:bpBoulder`.
- **Nudge** (2 min): "The bell by the door sways in the draught. The boulder in the doorway twitches, as if it were dreaming of bells."

#### The Draught (0,4): key 1
- **Idea:** wind as a conveyor; strays fill pits.
- A gust down a lane (row 5, blowing west); two pale stray crates; two pits by the key chest `drKey` (2,5). **Solution (test):** from (10,8) push one stray up 2 into the lane, from (13,2) the other down 2: the gust blows each into a pit, filling it for good. Wait for a lull, walk to (3,5), open the chest.
- **Blocked:** the Hookline won't reel Wren over the pits to the chest (review_d4: it never swings her to a chest).
- **Nudge:** "The pale crates don't belong anywhere. Whatever falls into a pit and doesn't come back fills it in."

#### Windward (2,4), optional (the Plan)
- **Idea:** wind displaces, a ring recalls.
- A crate on its plate `wp` (12,5); a strong gust blows it off toward the door and it never gets home by itself between gusts; bell `wwBell` (11,2); gate `wwGate` (16,5) upwind (so nobody slips through in a gust), latches passed east; Plan chest (18,5). **Solution (test):** stand at (11,3), wait for a gust to end, strike the bell at once: the crate snaps home onto its plate; walk through the gate.
- **Blocked (test):** waiting by the gate for the crate: the gate never opens in 40 s, and nobody slips through.

#### The Stair (1,3): hub
- Bats; a bell (9,4); north lock `stLockN`, east lock `stLockE`.

#### Weathercock Walk (0,3): key 2
- **Idea:** hold on.
- A walk between pits (row 5) under a gust blowing south (`wcGust`, hard: force 1.2); busts above the walk at x 13, 9, 5 (row 4); key chest (1,5). **Solution (test):** in each lull move to the next bust, and when it blows, face up and hold Action (grip the bust): Wren isn't moved. **Caught in the open:** blown into the pits and home (test).
- **Nudge:** "The busts don't shift an inch in the wind. Someone holding on to one wouldn't either."

#### The Rafters (2,3), optional (Heart Patch)
- A sleeping slab of wall `raWall` and a bell (13,4); strike it from (13,5): the slab goes home (and six bats wake); Heart Patch chest (18,1).

#### Clangor's Loft (1,2): mini-boss, Clangor; the Recall Bell
- **Elements:** Clangor (9,4), old armour that rings; busts `clB1` (4,3), `clB2` (15,3), `clB3` (4,7), `clB4` (15,7); shutters west (0,5) and south (9,10); north lock `clLockN`; a sleeping slab `clWall` in the east doorway (19,5) (the Echo Room); hidden big chest with the Recall Bell (9,6). Sign: "When the old armour rings, everything out of place up here goes home at once, and woe betide whatever stands on its way."
- **Fight:** 2 HP. The stick bounces off. It walks slowly at Wren and winds up (its ring's reach drawn on the floor round it, about 2 tiles, through a 41-frame wind-up) after about 3.3 s, sooner (1.5 s) when she's close; in the ring when it rings: a full heart. Its ring snaps everything out of place nearby home through whatever stands on the way. **Solution:** push a bust out so that Clangor stands on its way home when it rings (test: (4,3) east 3 to (7,3), Clangor on (5,3)): the bust slams it, its helm comes off: stunned; hit it. Twice. It is heavier than a medium thing's snap: only a bust (heavy) slams it.
- **Defeat:** `belfry_clangor`; pieces of armour (told while seen); the Recall Bell chest appears; opened from (9,7). The Bell's text says its snap shoves harder than a plain return (review_blind_a).
- **Nudge:** "When it rings, everything out of its place snaps home, through whatever's standing on the way. A thing being held doesn't."

#### The Reach (0,2): key 3
- **Idea:** ring from the right place (a ring is heard seven strides off and no further).
- Two sleeping busts set out far apart: `reS1` (asleep at (17,1), home on the top plate (2,2) `r1`), `reS2` (asleep at (17,9), home on the bottom plate (10,9) `r2`); gate `reGate` (3,8) when `r1&r2sleep` (the bottom sleeper still asleep), latches passed west; key chest `reKey` (1,8). Sign: "A bell is heard seven strides off, and no further. The gate goes by the top plate, and stays shut while the bottom sleeper is awake."
- **Solution (test):** with the Recall Bell, ring at (16,1), near the top sleeper only: it goes home onto the top plate; the bottom one sleeps on; the gate opens.
- **Blocked (tests):** ring where both hear (e.g. (17,5)): the bottom one wakes and the gate stays shut; shoving the woken bottom one off its plate doesn't open it either; leaving the room lets both lie down again where they slept (for another go).

#### Echo Room (2,2), optional (S15: Heart Patch, Linnet's note 4)
- Behind the Loft's sleeping slab (ring near it). Three stones: low (5,4), middle (9,4), high (13,4); chalked: "SING HER TO SLEEP." Strike them in Gran's bedtime tune (heard on the first morning, and kept in the Journal as "Gran's bedtime tune": "low... high... in between... high... and low again"): low, high, middle, high, low. The stones hum it together; a chest appears (9,2). Flag `belfry_echo`. (The Journal note was added in fix round E so the room doesn't rely on memory; older saves get it on loading.)

#### Bell Ropes (1,1): the Pattern
- **Idea:** holding beats ringing.
- Two plates, left `p1` (5,3) and right `p2` (17,3); a sleeping crate `brC1` (asleep at (15,6), home the left plate) and a second crate `brC2` on the right plate; hidden big chest (9,7) with the Pattern on `belfry_ropes`; east gate `brEast`; the bell stair `brStair` (9,0), "Barred from above"; a sleeping slab `brWall` in the west doorway (the Workshop). Sign: "The pattern shows when the left plate is pressed and the right one isn't."
- **Solution (test):** pick up (or grip) the right-hand crate off its plate and, holding it, ring the Recall Bell: the sleeper comes home to the left plate while the right one stays empty (it counts when it arrives): the Pattern chest appears and the east gate opens.
- **Blocked (tests):** ringing without holding brings both crates home; ringing first and then lifting the right crate gives no Pattern (review_d4). Leaving the room unsolved lets the sleeper lie down again.
- **Nudge:** "Ring here and both crates come running. Unless one of them is being held."

#### Workshop (0,1), optional (signature, Heart Patch)
- Behind the sleeping wall west of Bell Ropes (ring from (2,5)). Brass T, bell moulds, tuning forks; signature `sig:belfry` (Action from (9,6)); Heart Patch `bwPatch` (16,7).

#### The Bell Frame (2,1)
- **Idea:** synthesis: a thing at home blocks the way home (Tidyhouse); a thing goes home the way it went, and a thread can't knot (Kiln); a ring snaps.
- A plate `fb` (5,7) in the frame's narrow gap holds the north gate `fbGate` (14,0) (latches up). A boulder `fbRock` asleep beside the gap (4,5), its place the gap's top (5,6) right above the plate; too heavy to pull. A crate (lifted from below the frame); a bell `fbBell` (8,4). Sign: "The gate north keeps to the plate in the frame. (The boulder came down with the old bell, and has slept by the frame ever since.)"
- **Solutions (tests):** (a) carry the crate the long way round, up the east side ((12,9), (12,4)) to (5,3) above the gap, throw it down the gap onto the plate; ring: the boulder wakes and is home before the crate; the crate waits on the plate behind it. (b) Thrown from the gap's mouth (5,5) it lands below the plate; the ring brings it back up onto the plate (Wren, if in the way, is shoved aside). Walk to the gate.
- **Blocked (tests):** carried up the gap and thrown back down, the thread undoes itself and the crate goes home; rung first and the crate thrown up onto the plate from below, it goes home long before Wren is at the gate (and leaving, the boulder lies down again). Rung while standing in the gap: Wren is shoved down onto the plate with the crate waiting below her (never on top); she can lift it and go.
- **State:** `belfry_frame` (the boulder stays awake now), `door:fbGate`.
- **Nudge:** "The sleeping boulder's place is right above the plate. Woken, it would sit in the way of anything coming home up the gap."

#### The Cistern (2,0)
- **Idea:** synthesis: the Hookline and a thing hanging on its thread over a drop (Kiln); a float going home carries its rider (Millrace); nothing walks home through a strong wind, a snap does (Belfry).
- The floor has fallen in: a shaft (x 9-10) between the near pool and the far channel; a raft `csRaft` moored on the far side (home near (5,1)); a gale down the shaft that never lets up (`csGale`); a drawbridge hauled up, its lever on the far side (2,8); the big door `brBig` (0,5). Sign: "The draught down the old bell shaft never stops."
- **Solution (test):** from (11,1) hook the raft west: it comes over the shaft; the gale pins it at the foot of the pool (10,7); step aboard from (11,7); ring: it snaps home across the shaft with Wren on it (not a scratch). Step off west; pull the lever at (2,8) (facing down): the drawbridge comes down (the way back). The big door with the Pattern.
- **Blocked (tests):** waiting aboard, the gale never lets it go home; paddled to the edge of the shaft and let go, it's caught again; its empty mark hooked from the bank: Wren lands in the water (a ducking, one point) and flies home on the near side.
- **State:** `cs:over`; the drawbridge stays down through save and load (test); it is down anyway once Tollgrim is beaten.
- **Nudge:** "The raft keeps trying to go home, and the gale keeps blowing it back. Its home is just where you want to be."

#### The Great Bell (1,0): boss, Tollgrim
- **Elements:** the great bell (8,1) with Tollgrim inside; its clapper `clapper` (9,4); a draught down through the bell (`gbGust`, off until the fight); a gale along row 4 (`gbGale`, off until beat 2); vanes; the old tenor bell `gbTenor` (2,8) in the west bay; pots (1,9), (18,9); shutter (19,5).
- **Rule:** three beats, two stick knocks a beat. Only the clapper coming home hard (a snap) knocks him out of the bell's mouth; then he lies dazed on the floor for knocking. The stick on the bell just clangs.
- **Beat 1:** the draught blows the clapper straight down out of the mouth; he leans out to spit; ring (the Recall Bell, within reach of the clapper): it slams home into him; he drops out dazed: knock him twice. In this beat he doesn't duck at a ring (test).
- **Beat 2:** he heaves the bell round; the east shutters bang open and a gale blows west along under it without a let-up (the vanes swing), laying the clapper by the west wall; and he listens: a ring within seven strides of him and he ducks before it's home (test). Ring from beside the clapper, out of his hearing (test: from (1,6)), or strike the old bell in the west bay.
- **Beat 3:** he watches Wren; his eyes in the bell's mouth go red when she's in reach of the clapper, and he stays in while she could ring it (test: by the clapper neither the old bell nor the Recall Bell brings him out; a pot thrown at the old bell from as far as a throw reaches rings it, but he's in). **Solution:** lift a pot (1,9), carry it under the old bell ((1,8), (2,8)) and off to the far side ((10,8)), wait for him to lean out, smash it: its pieces fly home under the old bell and ring it from afar; the clapper slams home into him.
- **Moves (tells 28/25/22):** gravel spat as soon as he leans out, after his cheeks puff (one; a burst of three; a fan of three; each stone outlined, pale, shadowed and streaked since fix round E); from beat 2 he pounds the bell and mortar falls, shadows first (a full heart); beat 3 he lunges at Wren under the mouth, the floor there lit (a full heart). A heart each beat. About 30 s for a player who never hesitates.
- **Nudges per beat:** 1 "Only the clapper coming home hard knocks him out of the bell..." 2 "He hears a ring as far as a bell can reach, and no further. And not every bell in the tower is the one in your hand." 3 "He watches you now, not the clapper... A pot's pieces flying home ring any bell they pass."
- **Save/load mid-fight:** the fight starts over from the hall's doorway (test). Fainting: the Bell Porch, fight reset.
- **Defeat:** told while seen (a feather; the ball of yarn under the bell, told_seen); the hall falls still (both gusts off); `belfry_boss`; Hoop (15,6), Heartstitch `belfryHeart` (4,6); the bell stair to Bell Ropes opens, and the Bell Frame's gate and the drawbridge are open.
- **After the Knot:** "Every bell in the tower rings at once... the town bell answers." `d4`; goal "Home to Hollowell: it is the Knotting Festival."; an exit at (3,9) out to the Heights.

#### Belfry QA notes and known accepted behaviour
- A ring stops at the walls of the room it's rung in (review_d4).
- A chest that appears waits for its floor to be clear (review_d4).
- The HUD steps back from the Reach's top sleeper and the Bell Frame's gate (review_blind_f).
- Bats wake at every ring; they are a nuisance by design.
- The Recall Bell can be rung while gripping (it is the tool button, the grip is Action; Options > Grip toggle exists for one-thumb play).

---

### Cross-House regression checks worth running
- Every boss beat in these Houses has a nudge (review_blind_e test listing monger, housekeeper 1-3, glazer, kilnwyrm 1-3, snapjaw, grindle 1-3, clangor, tollgrim 1-3).
- Every boss intro and defeat is shown, not just told (told_seen "a beaten foe goes while its end is told").
- Dialogue boxes move to the side that hides least, away from the boss and from Wren (polish2).
- Leave a House mid-puzzle and re-enter: everything marked is home; latched gates, opened locks, opened chests, rung `once` charms, completed sequences, filled pits and woken (non-puzzle) sleepers persist.
- Save in a room, load: Wren starts at the doorway she came in by, with the room rebuilt.
