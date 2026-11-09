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

## Unresolved issues
- D6 and Larkspur: fresh-eyes review running.
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
