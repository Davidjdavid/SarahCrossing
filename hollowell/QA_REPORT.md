# HOLLOWELL: QA Report

## Procedures
- `cd hollowell && npm test`: builds `play.html`, then runs the headless suite (Node `vm` running the real
  game code without a canvas): the Return rules, save/load round trips, every room's scripted solution,
  progression presets, and the scripted full playthrough when it exists.
- `npm run test:browser`: Playwright + Chromium opens `play.html`, starts a new game, plays scripted
  segments, checks for console errors and takes screenshots into `tests/shots/` for visual review.
- Debug: open `play.html?debug` → F1 opens the debug panel (warp, presets, give tools, flags, noclip, show
  traces and collision, fast forward). `window.HW` is the test API.

## Results
- 2026-11-09: `npm test` 27/27 pass (Return rules 8, Tidyhouse rooms 18, playthrough 1).
  The playthrough found and fixed: the Pantry nook softlock; walking into pickups mid-walk.
- `node tests/browser.mjs --shots town meadow tidy`: no page errors; screenshots reviewed.
- 2026-11-09 (later): `npm test` 51/51 pass (Return 8, kit 7, Tidyhouse 21, Kiln 15 including
  sequence and boss tests, two playthroughs: fresh game to Knot 1, and Knot 1 to Knot 2).
  A fresh-eyes reviewer played the slice from the code; its findings (a finale solvable without the
  dungeon's tool, a boss reacting to furniture in other rooms of the House, tight or non-standard timings,
  clues that gave too much away, a few UI overlaps) were fixed and re-tested. The playthrough also caught a
  creature standing where a block needed pushing (the route now whacks it first, as a player would).
- `node tests/browser.mjs --shots tidy meadow kiln`: no page errors; new plates, the building front and the
  bookcase checked in screenshots.

- 2026-11-09 (night): a fresh-eyes review of Dungeon 4 and the Heights found 12 issues, three of them
  softlocks: a ledge that dropped Wren inside the cliff; woken sleepers falling asleep again whenever the
  place was rebuilt (save/load, leaving); sleepers that could be pulled, gripped, lifted or hooked without a
  ring. Also the Hookline passing shut gates and swinging on chests, rings carrying through walls, a chest
  appearing under Wren, Windward solving itself, two puzzles beatable by doing things in another order, an
  easy final boss and Returnball keeping half-scores. All fixed with 11 regression tests
  (`tests/review_d4.test.mjs`, plus heights and belfry updates); `npm test` 129/129.

- 2026-11-09 (night, later): the fifth tool's kit (12 tests), Hushwood (7), the Slumberhouse (17 room and boss
  tests, including what happens when you get it wrong) and a fifth playthrough leg; `npm test` 166/166. The
  playthrough found a laundry layout that cut off a door (fixed) and the tests found boards that gave way under
  Wren when she wobbled on an edge (fixed). Browser shots of every new room and the region checked.
- Hints: rooms' "already solved" checks were mostly never true, so a hint could pop up after a room was done;
  fixed generically (chests, doors, gates and levers by id).

- 2026-11-09 (late night): the sixth tool's kit (5 tests), Larkspur (7), the Marionette Hall (9 room, mini-boss
  and boss tests) and a sixth playthrough leg; `npm test` 188/188. Found while building: puppets moving in step
  blocked one another (fixed: the leading ones move first and free their tiles), a door that shut on Wren while she
  held the strings (latches now), hint checks with house-prefixed ids that never resolved (fixed generically), and a
  boss drawn far too small (repainted). Browser shots of the fair and every room checked.

- 2026-11-09 (late night): the fresh-eyes review of D5 found 17 issues, 5 of them softlocks: Wren standing inside a
  block after a load or a far Homeward; a stray filling the playpen's only exit; the Study lost for good if the barrel
  was rung home without the Bedroll; the Bedroll laid on an island whose only way off is a fall (falls then always
  came back to it); a Bedroll laid on a float going stale when the place was rebuilt. Fixed generally: Wren is never
  left inside anything when placed; rolling the Bedroll up (or losing it) gives back the room's own mark; a Bedroll on a
  float follows its float home; every House's pause menu has "Back to the House's door". Also fixed: lamps and
  dreamcatchers that could be lit piecemeal, the toy block leaving its room, stale sleepers, the Sloth's ring, hooks on
  levers and bosses, the Bedroll on stairs, a repeated intro. 11 regression tests (`tests/review_d5.test.mjs`);
  `npm test` 199/199.

- 2026-11-09 (late night): the fresh-eyes review of D6 found 9 problems: the reveal, Hoop and Heartstitch lost for
  good by leaving or loading between the boss and the Knot (true of every House: now each House puts its Hoop and heart
  back whenever it's built again until the Knot is tied, and the Marionette's flag is only set once the reveal is
  done); a key order that shut the Rehearsal Room (the Wings' east door now opens when Captain Tin falls); an Orchestra
  Pit Wren or a stray could solve alone (a pulse plate: only someone waiting at the gate gets through); rack puppets
  taken singly and through walls; Crossbar secrets done without the Crossbar (plates only puppets' feet work; the hook
  doesn't pull puppets); sandbags hidden behind the rack (drawn over everything now, the first one later); the lift
  boxing Wren in; returning puppets blocking each other (they find a way round or slip past); a soldier on the pen.
  Soldiers are tin now (a whack turns them round). 9 regression tests (`tests/review_d6.test.mjs`); with the seventh
  tool's kit (7), `npm test` 215/215.

- 2026-11-09 (night, late): the Underside (4 tests) and the Spoolworks (8 room, mini-boss and boss tests) and a seventh
  playthrough leg (afterD6 to d7); `npm test` 228/228. The playthrough found the road from the fair's gate into town
  blocked by a fence that never opened (fixed: drawing the bolt opens the town's side too). Browser shots of every new
  room checked (two layers read clearly: the room above faint over the boards, cords under every mark).

- 2026-11-10: the Makings (6 tests: each Little House solved for all three Ahas, a bump, S30) and Reveal 2 (4 tests:
  the Way Down to the Hall of Names and home, the north gate's counterweight, S32, S33); `npm test` 238/238. Found while
  building: a straight one-tile doorway can't be cleared by a push along it (the doorways became corners); a lure too
  short for a fair window (Tuck now admires what he pushed for a second); a Making with no way to earn one of its
  Ahas (a corner block added). Screenshots checked: Tuck and the nibblers show clearly through the boards.

- 2026-11-10: the fresh-eyes review of D7 found 12 problems: the Under-works' corridors made two rooms optional (each
  Under room now only through its own trapdoor); the Spool Store's key could be run for, and the gate could shut on
  you (the trapdoor beside the plate, a shorter patience, the gate latching once passed); the Bobbin Loft and the
  Tangle could be done without a knot (the Loft wants all four held a while; the Tangle pulls loose bobbins back in,
  only held ones undo it); Homeward flew through the floor between the layers; the Needle's path went stale; townsfolk
  took the Needle; yarn balls flew during talk; the Gatehouse crate re-knotted on every rebuild; a dead Cog's cord.
  7 regression tests (`tests/review_d7.test.mjs`).
- 2026-11-10: the Shears kit (4), the Loom and the Loomwood (7), cutting free (2); browser shots of the Loomwood and
  every Loom room.

- 2026-11-10: the end (`tests/ending.test.mjs`, 8): your own thread at the fog, the Drift and Linnet, the Great Pull
  (the town in an arc round the Well, its south side open), all six Knot rooms, the six great threads and the end, a
  save between the last cut and the Unwinding, the free valley after (save and load), S35 and S11. Found and fixed
  while writing them: the Millrace Knot's raft went home and stranded Wren on the far side (now a stray); the Kiln Knot
  had no way back over its gap (a second eyelet); the Great Pull dragged people from all over the valley (now the town
  only, in an arc that leaves the Well's south side open). Browser shots of the Drift, the Pull, every Great Spool
  room, the credits, the epilogue and the changed title.
- 2026-11-10: fresh-eyes review of the Makings, Reveal 2, the Shears, the Loomwood and the Loom: 12 findings. Fixed:
  cutting a nibbler crashed every frame (the Shears do nothing in a Making; nibblers can't be cut; an old save's flag is
  harmless); the north gate opened early (S32) let Wren into the Loom before Reveal 2 (the Loom's doors want the Guild's
  key, which Gundry gives after Reveal 2); offcuts did the Loom weights' job (offcuts are medium: silk holds them, the
  iron plate ignores them; the Weighing and Bridge rooms' chutes drop spare weights; the Bridge Room's west way opens
  only once its plate is held, so it's reached through the Weighing Room's lock); Making 2's lure window was under a
  second (Tuck admires a thing that jumped for 3.5 s; untying the heavy one before he arrives stays a valid second
  solution); replaying Making 3 rewound the goal and paid the button again; no way out of a Making (the menu's option
  goes out to the Making Floor); stranded east of a cut silk bridge (only reachable through the lock now, which stays
  open); the Weaver couldn't hurt Wren (wakes on entry, silk tightens if caught while bound, lands hard, in its well);
  Tuck's thread was Wren's red (his own green); Tuck could be tied off (refused: tug only). Kept: the Needle alone can
  finish Making 1 (a creative solution; the Ahas still reward the intended way). 8 regression tests
  (`tests/review_m.test.mjs`).

- 2026-11-10: the Stray House (`tests/strayhouse.test.mjs`, 11): the door wants all seven notes; notes 4 and 5 count;
  every room's solution; a stray that filled a hole stays gone; the Pile's first round played the way a person would
  (lure it into a corner nook, out by the slit, a stray across its mouth while it strains), the other two by setting
  strays round it; the bracelet in the ending. Found and fixed while writing them: the Pantry's shelf compartments had
  one gap each, so pushing their stray out shut you in behind it (second gaps); the Pile couldn't fairly be boxed by
  a person (corner nooks with slits, and it strains a while when it can't get nearer). Browser shots of every room.

- 2026-11-10: the Unfinished House (`tests/unfinished.test.mjs`, 9): its door and the Guild pin; every room's
  solution; sewing a fourth while standing on the oldest drops you; Mr Ives's walk with the planks sewn ahead of him,
  and dropping back when one's undone under him; sewn planks survive a save and load; the Long Hook's reach. Found and
  fixed while building: its first Hook Loft and Far Shelf didn't work with the Needle's reach of four (replaced: the
  Loading Bay; the Far Shelf's planks side by side); the Needle couldn't sew past a sewn plank or pick which to unpick
  (it now offers Unpick this one / Sew the next one along); long toasts ran off the screen (they wrap now, game-wide).

- 2026-11-10: the late secrets (`tests/secrets2.test.mjs`, 6): S01, S03, S07, S08, S09, S10, S14, S25, S31.

- 2026-11-10: fresh-eyes review of the final act: 18 findings. Fixed: cutting a sleeping thing left it asleep with no
  thread for the Bell to wake (the Belfry Knot's boulder: the end became impossible; the Heights' cave rock: a Heart
  Patch lost); a cut thing is now an awake, pushable stray. A cut puppet could be stranded out of reach (puppets keep
  their strings). With her own thread cut Wren could still faint and be pulled home (hearts stay full; a hurt only
  knocks her about). The Drift had no trees (it has the Hollow's woods now, so its stream must be crossed with a stray
  boulder) and climbing out of a fall could put her on the far bank (she comes out on the side she went in from).
  Gran at the Spool spoke an Act II line and could be "cut"; Linnet could be "cut" (neither now). Cutting someone in the
  Pull didn't free them; the Pull's narration said everyone was pulled when nobody was; folk indoors and the Makers
  below carried on as normal (the narration counts; interiors and the Underside are empty meanwhile; anyone holding on
  elsewhere says so). The Belfry Knot's sleeper had the doorway as its home (it's round the corner now). A hint for
  anyone down the Slumberhouse ledge with no Bedroll. Lines after the end only applied outdoors (everywhere now, and
  for nine more people); Gran's cellar after. Autosave after each Knot and each great thread; a goal that counts the
  Knots; the Drift's goal. S11's seed from Linnet's garden for anyone already cut; the Well's stones readable in the
  Pull (S35). The bracelet handed over. Rest stumps after the cut "remember" rather than tie off. Any fog lets a
  threadless Wren through to the Drift. The changed title is per save, not per browser. Linnet's question has its
  text. 7 regression tests (`tests/review_end.test.mjs`). Item 9 too: the Great Spool is sixteen rooms now (six
  antechambers pairing each House with a later tool; the Climb a gauntlet); still to do: some UI leftovers (hearts in the Satchel, the key counter in keyless Houses).

- 2026-11-10: playthrough legs 8 (from the seventh Knot: Gundry's job, the three Makings, the Way Down, the Hall of
  Names, the north gate, the Loomwood, every Loom room in order, the Weaver) and 9 (from the eighth Knot: the fog, the
  Drift, Linnet, the Pull, the whole Great Spool, the end, after), walking between rooms instead of warping. The
  scripted playthrough now runs from a fresh game to the credits in nine legs (each leg starts from the preset that
  matches where the one before ends; area-to-area hops that the leg before already walked are warps). Writing them
  found three real bugs, all fixed: a sign in front of Making 2's little door; the Way Down only appeared the next
  time the Underside was built (after Making 3 there was no way on until you left and came back); the Shuttle Run's
  chute stood in its own doorway, so it couldn't be walked into from the Warp Hall (the room test had warped in).

## Unresolved issues
- Boss tests place the boss for the scripted hit (a person lures it); the luring itself is only played by hand.

## Verification history
| Date | What | Result |
|---|---|---|
| 2026-11-09 | Headless suite + browser smoke (title, town, Meadowfold, all D1 rooms) | pass |
| 2026-11-09 | Slice review fixes; D2 and Kilnridge; 51 headless tests + browser smoke | pass |
| 2026-11-09 | Town extras (S12, S28): 13 new tests (64 in all); screenshots of both checked | pass |
| 2026-11-09 | Water kit, Millwater, the Millrace: 6 + 16 + 1 playthrough (87 in all); every room screenshotted | pass |
| 2026-11-09 | D3 review fixes (+5 regression tests); Belfry kit, Heights, Belfry, festival (120 in all); screenshots | pass |
| 2026-11-09 | D4 review fixes (12 issues, 3 softlocks; +11 regression tests, 129 in all); Belfry browser smoke | pass |
| 2026-11-09 | Bedroll kit, Hushwood, Slumberhouse, playthrough leg 5 (166 in all); browser shots of every new room | pass |
| 2026-11-09 | Crossbar kit, Larkspur, Marionette Hall, playthrough leg 6 (188 in all); browser shots | pass |
| 2026-11-09 | D5 review fixes (17 issues, 5 softlocks; +11 regression tests, 199 in all) | pass |
| 2026-11-09 | D6 review fixes (9 problems; +9 regression tests); the seventh tool's kit (+7); 215 in all; D6 browser shots | pass |
| 2026-11-09 | Underside, Spoolworks (D7), playthrough leg 7 (228 in all); browser shots of all 20 new rooms | pass |
| 2026-11-10 | The Makings, Reveal 2 (238 in all); screenshots of the Making Floor, the Little Houses, the Hall of Names | pass |
| 2026-11-10 | D7 review fixes (+7); Shears kit, Loomwood, the Loom, cutting free (258 in all); screenshots | pass |
| 2026-11-10 | The Drift, the Great Pull, the Great Spool, the end (+8); Makings/Loom review fixes (+8); 274 in all; screenshots | pass |
| 2026-11-10 | The Stray House (O1) and Linnet's Trail notes 4, 5, 8 (+11; 285 in all); screenshots | pass |
| 2026-11-10 | The Unfinished House (O2) (+9; 294 in all); screenshots | pass |
| 2026-11-10 | Late secrets (+6); final-act review fixes (+7); the Great Spool rebuilt to 16 rooms (+1); 308 in all; screenshots | pass |
| 2026-11-10 | Playthrough legs 8 and 9: fresh game to credits in nine legs (310 in all); three bugs found and fixed | pass |
