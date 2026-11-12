## The Makings: Tuck's Little Wander (`making1` to `making9`)

### Overview
- What it is: after the Spoolworks, Gundry's job for his new apprentice. Eight Little Houses the Makers built for Tuck
  (six), run by Wren from underneath, then a ninth that Wren sets out herself. It is the game's turn from playing the
  Wander to making it (Jory said so on the Great Stage). It sits between House 7 and Reveal 2: finishing it opens the
  Way Down to the deep store.
- Files: `src/68_makings.js` (Tuck, the Little Houses 1-4, grading, the Making Floor, the act's end),
  `src/68b_makings_more.js` (5-8, Otto the Housekeeper, the doormat), `src/68c_makings_capstone.js` (the ninth). Tests:
  `tests/makings.test.mjs`, `tests/capstone.test.mjs`, `tests/review_m.test.mjs` (4, 5, 6, 9/10, 1/12),
  `tests/review_blind_f.test.mjs` (the Makings' words, Making 3's nibbler, the third Aha, the Bell below),
  `tests/review_opt.test.mjs` (new 4), `tests/scenes.test.mjs` (Tuck's lines, Aha notices, Otto's costume, Gundry's
  little House), `tests/review_blind_cd.test.mjs` (the ninth after a go).
- Getting in: talk to Gundry in the Guild Hall after the Spoolworks (`gundry_job`; goal "The Making Floor, east of the
  Guild Hall: run Tuck's Little Wander from underneath."). The Making Floor (Underside cell 2,0) opens with `d7`.
- Needs: the tools Wren has (Gloves, Hookline, Bell, Needle...); the Makings use tugs, knots and the Needle. The Shears
  do nothing in a Making (`review_m` 1/12); the Bell rung underneath does nothing above and says so, once
  (`review_blind_f`).
- Gives: 5 buttons per Little House the first time (the catalogue: 1 → 21 after four, 41 after eight, 46 after nine),
  Tuck's drawing (secret S30) for all three Ahas in all nine, `makings_done`, the Way Down.

### Save states
- T39 (Gundry has asked; none done): the Guild Hall.
- T40 (four of nine done): the Making Floor, by the fourth door.
- T41 (eight done; the ninth next): the Making Floor; the empty Little House handed over (`cap_given`).
- T42 (all done; the Way Down next): the Making Floor, by the ninth door.

### The Making Floor (Underside 2,0)
- A row of little doors along the north wall, one per Little House (map x 42, 44, ... 56 for 1-8, the ninth at 58),
  each with a sign ("MAKING n: NAME. (Maker) Opens when the ... is done."). Each opens once the one before is done;
  those not open yet have a plank nailed across (`makings.test` "a door for each Little House"). Done ones stay open
  to replay.
- Tuck stands on the floor (47,6) until the act ends; Otto (50,6) joins him once the fifth is done, dressed as the
  Housekeeper. After the eighth, Gundry walks over from the Guild Hall, an empty little House under his arm, to say his
  piece to Wren's face: "Your turn. Make one." (Tuck: "ANOTHER one? Who made it?"). After the ninth he walks over again
  and sends her for Tuck's fresh spool; the Way Down opens off the Making Floor at once (`Making.afterAll`).
- After each Little House Wren comes back out on the Making Floor by its door (row 2).
- A Making can be left by the pause menu: out to the Making Floor (`review_m` 6). Every run starts as the Makers set it
  out (a heavy thing untied last time is tied off again: `makings.test` "every run"); Making 4's gates start shut every
  time (`review_opt` new 4). Played again after the act, a Making doesn't rewind the story or pay the button twice
  (`review_m` 5).

### How a Little House works
- Layout: Tuck's rooms up top (rows 0-10); Wren's rooms underneath (rows 11-21), each directly under the one above.
  Wren can't go up ("You can't go up, love. It's his Wander. -I."). From underneath she sees the room above faintly, Tuck
  and Otto through the boards, and a cord under every mark (11 rows below it). Tug, tie and undo work as in the
  Spoolworks; the Needle works through a cord (not in the fifth).
- Tuck's rules (on the wall under the first House, in his spelling): 1. GO TO THE DOOR (the little hoop). 2. IF A THING
  JUMPS GO AND PUSH IT (a tug on the cord of a thing at home makes it jump; he pushes it away from himself, from
  whichever side he reaches first, only within eight tiles). 3. NOT NEAR BITEY THINGS (a nibbler not tied up; tied up
  it's harmless). 4. IF STUCK, SIT DOWN (as near the door as he can get, and sulks).
- He weighs on plates like a person, pushes what a person can (not heavy things), and a heavy thing going home (or
  anything tugged home hard) through him bowls him over: a bump ("Ow!"), back to his start. His own thread hangs under
  his start: a tug yanks him back ("Wheee!"); it can be tugged but not tied, and it's his own green (`review_m` 9/10).
  (A tug on it is counted: Gran quotes the number in Reveal 2.)
- Otto, from the sixth: plays the Housekeeper. His rules (sign in the sixth): 1. stand on my X (one in every room; he's
  always in the room Tuck's in, going round the back); 2. anything out of its place, trot to the side of it nearest the
  X (the next nearest if that's taken) and yank it home; 3. held fast, stand there tsking at it till it isn't; 4. back to
  the X. Something coming home through him bowls him over ("OOF!": he sits a while, and doors that open on the
  Housekeeper beaten open). His own thread puts him back on his X. A doormat feels only a person standing on it.
- The button: hidden under one thing per House (usually a pot). The first time Tuck is in its room he stops and peers
  at it ("Ooh... is that something shiny?", a ? over his head), and now and then it glints at its foot through the
  boards; his rules still only take him to it if it jumps (`review_blind_f` "the third Aha, found by looking").
- Grading: three Ahas per House. **cleared**: his own push got him nearer the door than he could get before;
  **found**: he had a go at the thing the button was under; **unhurt**: no bumps. Shown on a small tally up top; each
  kind named the first time, a pip after (`scenes`). At the hoop: Tuck's own line (his own in each House but the first
  and last), then "NAME: done. Ahas: n of 3. Bumps: n.", then the Maker's comment. The best per House is kept
  (`making<n>_ahas`).
- Help: every room underneath has a nudge (all but the fifth's Ballroom); it fires after a long while stuck
  (`makings.test` "every Little House has a nudge"). There are no nudges in the ninth (it's hers).

### The Little Houses
Coordinates are the Little House's own tiles; "tug X" means stand underneath at the cord under X's mark and tap Action;
"tie" means hold Action there; "untie" means Action on the knot. Every solution below is the test's, and every House is
tested for all three Ahas.

#### 1. The Little Tidyhouse (Ives): The Doorway, The Plate
- Idea: jolt to steer, then jolt and tie off.
- Elements: Tuck (3,5); a block (10,5) on the corner of an L-shaped doorway (left alone he sits by it at (10,6)); a pot
  (2,1) with the button; next room, a block (28,6) in a slot above a plate (28,7) that opens the gate (34,5); the hoop
  (37,5).
- Solution: tug the pot: he pushes it and finds the button (found). Tug the doorway block: he pushes it up into the
  alcove (cleared). He sits by the gate next door; tug the slot block: he pushes it down onto the plate; tie it off there
  before it goes home; through the gate to the hoop.
- First-room check: a tug on his own thread sends him back to (3,5) (test "Tuck by himself").

#### 2. Mind the Nibbler (Bram): The Nest, The Crossing
- Idea: creatures have cords; lure, then let go.
- Elements: Tuck (2,5); a nibbler nesting at (10,2) that chases him near its nest; the pot (5,8) in a nook (button);
  the corner block (16,5); a heavy block tied off at (29,1), its home the plate (29,9) that opens the gate (30,5); a crate
  (23,3) in the west nook. Signs: "NIBBLERS: they won't hurt YOU. Tied up, they won't hurt anybody." and "MIND THE BOY.
  Heavy things going home go straight through anything in the way."
- Solution: tug the pot (found). Tug the nibbler home and tie it up. He sits by the corner block; tug it (cleared). He
  sits at (29,5), right in the heavy block's lane at the gate. Tug the crate: he goes to see it and admires it; untie the
  heavy block: it crosses home onto the plate, the gate opens.
- Blocked: untie while he sits there and he's bowled over (a bump, back to his start). Lured, he stays away long enough
  to let the heavy one go without a rush (`review_m` 4).

#### 3. The Little Wander (Tess): The Heavy Door, The Guarded Plate
- Idea: the Needle on a heavy thing; everything at once.
- Elements: Tuck (3,5); a heavy block (10,5) in the corner of the doorway he can't shift; the pot (5,8) (button); a
  nibbler (25,3) by the plate; a block (28,6) above the plate (28,7); gate (34,5). Sign: "HEAVY THINGS: he can't shift
  them, bairn, however hard he pushes." (it names no tool: round E, finding 64).
- Solution: tug the pot (found). Needle through the heavy block's cord, one step up: its place is the alcove (10,4); he
  goes through. Tie the nibbler up first (tug, tie), then tug the slot block: he pushes it onto the plate (cleared); tie
  it off.
- QA: a nibbler that has him backed into a corner, scared, gives up after three seconds and keeps to the far side of its
  nest for five, every time (`NIB_BORED`, `NIB_AWAY`; `review_blind_f`; it once could pin him 95 s).

#### 4. The Long Sulk (Gundry): The Sulk, Two Plates, The Hoop
- Idea: rule 4 turned round: where he sits is yours to choose.
- Elements: Tuck (3,5); the pot (2,1) (button); a heavy block tied off in the passage at (11,5); a plate (10,5) that
  holds open the gate (11,4) on the heavy one's way home (its home up the shaft); next room, a plate by the gate (38,5)
  and a far plate (38,1), the gate (39,5) wanting both; a heavy block tied off at (38,8) whose home is the far plate; a
  crate (32,3); third room, a block (46,5) in the passage's mouth; the hoop (52,5).
- Solution: tug the pot (found). Stuck, he sulks on the plate (10,5) (the nearest he can get), holding the gate open:
  untie the heavy block (its cord is under its place up the shaft, (11,1)): it goes home, out of his way; he goes on. He
  sulks on the near plate (38,5), right in the second heavy one's way: tug the crate (he goes to see), untie the heavy
  one: it goes home onto the far plate; he comes back and sits on his; the gate opens and stays. In the passage, tug the
  block in its mouth (cleared).
- Blocked: let the far plate's heavy one go while he sits in its way: bowled over.

#### 5. The Tidyhouse, Underneath (Ives): The Foyer, The Hall of Busts, The Ballroom
- Idea: the first House's rooms from underneath: where he stands decides which way he pushes; a tug on a thing out of
  its place sends it home now; heavier shoves lighter. No Needle in Ives's rooms ("No Needle in my rooms, love: you
  didn't have one either."): the Needle stays on its hook.
- Wren comes in under the Foyer (56,16); Tuck starts in the Foyer (49,8) and goes west.
- Foyer: a block (46,5) a step nearer the plate (47,5) than it was on Wren's own Wander; the plate opens the way west
  (40,5). Tug the block while he sits by the west door (41,5): he pushes it east onto the plate (cleared); tie it off.
  Tugged while he walks in, he comes at it from below and pushes it north, the wrong way, and it comes home.
- Hall of Busts: the pot (22,1) (button: tug it while he sits by the hall's west door (21,5)); the middle bust set out
  up its lane at (29,3) and tied; a block (28,5) beside the lane; the plate (29,7) that opens the gate (20,5). Tug the
  block while he sits by the west door: he pushes it east into the lane (29,5). Untie the bust and tug it: it comes home
  down the lane, shoves the block onto the plate, and stands in the block's way home: the gate stays open.
- Ways it goes wrong: the bust let go before the block is in its lane comes home with nothing to shove; Ives's lever
  below (33,20) sets the Hall out again (bust back up its lane, tied). If the block is pushed west from the lane's side,
  he ends up standing in the bust's lane: let the bust go then and he's bowled over. Untied and simply left, the bust
  comes home after its patience, which also works (from the tracker; unverified. The note says a knot undone waits its
  while like anything let go, and a tug sends it home now).
- Ballroom: the hoop (3,5); both busts home. Below: the Grand Housekeeper's costume on a rail and Ives's notes from
  Wren's own Wander (real play time per room). The Ballroom's page says how Wren really tidied it on her own Wander, from
  her play: held one bust back and let the other by ("They never even touched..."), or let them jam and pulled one back
  out ("Bold. I had to sit down."); a save from before that was watched gets a page that claims neither
  (`capstone.test` "Ives's Ballroom page" x3).

#### 6. The Housekeeper (Jory): Otto's X, The Doormat
- Idea: the second child: Otto tidies what Tuck pushes; a knot only makes him tsk; he stands on his side.
- Elements: Tuck (3,5); Otto on his X (11,3); a block (10,5) in the passage's far mouth; the pot (2,8) (button; Otto
  says Tsk! but can't get to it); next room Otto's X (30,1), a block (30,5), the doormat (29,4) opening the gate (34,5)
  while somebody stands on it.
- Solution: tug the pot (found). Tug the passage block and tie it at once: Tuck pushes it out (cleared), Otto comes to
  tidy it and can only tsk at it from his side (11,4); Tuck walks round. Next room: tug the block while Tuck sits by the
  gate: he pushes it west to (29,5); tie it: Otto's side of it is the doormat (29,4); he stands on it tsking; the gate
  opens.
- Blocked: not held, Otto tidies the block straight back into the passage's mouth; a block stitched onto the mat does
  nothing (a block is no person).

#### 7. Tidy and Untidy (Mallow): Tidy for Good, Two Mats
- Idea: a stitch gives a thing a place, and Otto only minds places; both sets of rules at once.
- Elements: Tuck (3,8); Otto's X (9,6); a block (9,5) in the only junction; the pot (1,9) (button); next room Otto's X
  (26,1), a block (30,5) sitting on one mat (30,5), the other mat (34,5) by the gate (35,5), which wants somebody on each
  (and stays open); a crate (27,2).
- Solution (test): tug the pot (found). Tug the junction block and tie it: he pushes it aside (cleared), but Otto stands
  in the junction tsking, in the way; tug Otto's own thread: he's whisked to his X ("Hey! I was TIDYING!") and Tuck
  slips by. Two Mats: Tuck sits on the mat by the gate by himself. Tug the crate to draw him west of the block, then tug
  the block: he pushes it east to (31,5); tie it: Otto's side of it is its own place, the other mat (30,5): both mats
  held.
- Alternative (test): stitch the junction block two east into the stub (11,5) (before or after he pushes): it's in its
  place, Otto leaves it be.
- Blocked: tied in the junction and left, Otto stands in the way tsking for good; the block pushed west from the gate's
  side leaves Otto's side of it (29,4) off the mats.

#### 8. The Grand Hall (every Maker): The Antechamber, The Grand Hall, The Little Hoop
- Idea: counterweights (what the Pattern really did); the Housekeeper beaten by his own tidying (as in Wren's Wander).
- Wren comes in under the Antechamber (56,16); Tuck starts in the Antechamber (49,9) and goes west.
- Antechamber: four pots (44,3), (55,3), (44,7), (55,7), the button under (44,7); the big door (40,5) hangs on a weight
  on its plate underneath (42,16): push it off (from (43,16), push west) and the door is open till it goes home; he goes
  through.
- Grand Hall: Otto's cross (22,3) by the way west (20,5), which opens only when he's beaten (`ottoDown`); busts; a
  nibbler (25,7) watching the spot Tuck would push from; a block (26,5) in a slot between two busts. Tie the nibbler up.
  Tuck sits by the way west (21,5). Tug the block: he pushes it east to (27,5), straight away from Otto; tie it; once Tuck
  has gone back, Otto comes and stands at its side, which is its own place (26,5), tsking; untie it: his own yank brings
  it home through him: OOF, and the way west opens.
- Little Hoop: the last block (13,5) in the passage's mouth: tug it (cleared). Below: all six Makers on their knees
  under the hoop, watching.
- Blocked: with the nibbler loose, Tuck won't go and push; untied too soon, Otto tidies it from beside and stays up (the
  way stays shut). The nudge says "Hold it fast till he's standing there. Then undo the knot." (round E; it once said
  "let go").

### 9. Your Turn (Wren's own; `making9`, the capstone)
- Handed over after the eighth ("Your turn. Make one."; `cap_given`; goal "The Making Floor's last little door: set out
  a Little House of your own, hide the button, then let Tuck in."). The act isn't over until it's played once.
- Up top ("The House Upstairs"): two little rooms with a wall between them and a gap at each end (rows 2 and 8); Tuck's
  door in the west wall (he comes in at (1,5)); the hoop (17,5) in the east room; three of the Guild's things on their
  marks by the wall: a wooden block (7,2), a pot (7,5), a stone block (7,8) (heavy). A cord under each.
- Underneath ("Under the House"): Gundry's note (1,20); the button's tin (3,20): say which thing the button goes under
  (up its cord it goes, a paper tag on that cord); Gundry's lever (5,20): everything back on its mark, untied, unstitched,
  the button back in the tin (refused while Tuck's in: "Not while he's in"); the lever that lets him in (7,20) (pulled
  again while he's in: "Call him out?"); the six Makers sat along the wall (11-16,20), under the wall up top so no cord
  hangs where anyone sits.
- Wren sets it out with her own tools: stitches give places, knots hold, tugs send home. It stays as she left it between
  goes (places, knots, the button), and through a save and load (test "her House stays as she left it").
- A House worth three Ahas (test "set out well"): Needle on the wooden block `RRR` (to (10,2), just past the north
  gap); Needle on the stone block `RR` (to (9,8), into the south gap); the tin: under the wooden block; let him in. He
  sits at (8,5), as near the hoop as he can get; tug the wooden block: he goes round to the gap, pushes it east (found
  the button under it, cleared his way) and walks on to the hoop. "Ahas: 3 of 3. Bumps: 0."; the Makers each say one
  thing about what happened (Ives: "He moved that himself..."; Ambrose: "Under the block!"), and Jory the first time:
  "What did I tell you? On the stage? I SAID."
- Every run finishes (any finish completes the act):
  - at the hoop;
  - nothing set out: he walks straight through: one Aha (unhurt), a line about corridors, "No button?";
  - he can get nowhere: he sits with nothing moving or jumping; a word at 10 s ("Is this IT?"); after 25 s he gives up
    ("This one doesn't GO anywhere", "Every Maker builds one of those. Once."); a tug while he sits restarts the clock;
  - called out with the lever ("Is it tea?", "called in for his tea").
- Other behaviour pinned by tests: he won't come in over something in his doorway; a heavy thing let go back along its
  old way through where he sits bumps him and the Makers wince (Tess: "One bump."); the Makers' lines name what actually
  happened (a corridor, a block moved by himself, the button under the pot or still under it, a bump, his thread pulled,
  a long one).
- After the first run, Mother Ives says plainly that it can be set out again, and back in, the levers answer, the Needle
  moves what it stitches, and no stitch is kept for a thing that didn't go (`review_blind_cd`; finding 57).
- No nudges here (it's hers).

### What finishing opens
- `making9`, `makings_done`; if every House has three Ahas, `s30` and Tuck's drawing ("a stick figure under a floor,
  holding a lot of strings, smiling") at the ninth's hoop.
- Back on the Making Floor, Gundry walks over: "Eight Little Houses, and he never once saw your hands. You're a Maker,
  apprentice. Near enough." ("Eight": the Makers' eight; `MAKING_COUNT` is fixed before the ninth is added. It matches his
  job speech, "eight Little Houses", so it reads as meant.) He sends Wren for Tuck's fresh spool: goal "The Way Down, off the Making Floor: fetch Tuck's
  fresh spool from the deep store." The Way Down opens at once (a warp off the Making Floor into the deep store). Reveal
  2 follows (regions part).

### Old saves (tested)
- Partway through the act (three done): the rest open in turn and the act still ends; a save made in a room that no
  longer exists (the first Houses once had empty hoop rooms) puts Wren back in a room underneath, not in a wall.
- An act finished with four (an earlier version) leaves the new Houses open to play; nothing else changes.
- All eight done but the act never closed gets the hand-over on the Making Floor; an act already finished (eight and the
  Way Down) has her House to play.
- A save in the middle of a Making with Otto loads and plays on.
- On the Making Floor, anything a save from before still owes (the hand-over, the end of the act) is said as soon as
  Wren is back there.

### Known accepted behaviour
- Tuck's line at the hoop is his own in each House but the first and last (shared `TUCK_DONE`).
- Notices count the people seen through the floor (finding 81) but still prefer the box's side; a notice briefly over
  Tuck or Otto is cosmetic.
- "Tuck's line from the next room up" was decided against (the underside shows only the room overhead) (finding 78).
- The Makings' difficulty climb (2, 3, 2, 3, 4, 3, 4, 5) was judged right by blind solver F (finding 64); all three Ahas
  are earnable in every House.
