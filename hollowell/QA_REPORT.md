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
