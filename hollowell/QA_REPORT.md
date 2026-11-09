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

## Unresolved issues
_None yet._

## Verification history
| Date | What | Result |
|---|---|---|
| 2026-11-09 | Headless suite + browser smoke (title, town, Meadowfold, all D1 rooms) | pass |
