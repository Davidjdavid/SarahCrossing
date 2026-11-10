# HOLLOWELL: Project State

_Last updated: 2026-11-10 (session 1, day 2)._

## Status
**The main adventure is complete from start to credits**: Acts I to IV, all eight Houses, the Makings, both reveals,
the Drift, the Great Pull, the Great Spool, the Unwinding, the epilogue, the credits and the changed title, and the
free valley after. Tests cover every room (328 headless tests); the scripted playthrough runs from a fresh game to
the credits in nine legs; solution tests cover every room, both optional dungeons and the secrets. Presets `afterDrift` and `afterEnding` start late games.

## Done
- Brief recorded verbatim (GAME_BRIEF.md).
- Design, spoilers, world map, dungeon plan.
- Four-hourly check-in scheduled (trigger `trig_01RDdWnsj7kTWV96cSykoTdq`, cron `7 */4 * * *` UTC, fires
  into this session).

## Done (engine and slice)
- Engine: fixed-step loop, input (keys, pad, virtual), canvas with whole-number scaling, bitmap font,
  sprites from pixel grids, painted tiles per theme with autotiling, areas from ASCII, the Return (marks,
  traces with loop erasure, patience, shoving by weight, snap home, falls/sinks, shards), the player (push,
  pull, grip, lift, throw, stick, falls and flights home along Wren's own trace, hops off ledges), camera with
  rooms, generator scripts, dialogue with choices, HUD, toasts, banners, title, naming, pause menu (satchel,
  map, journal, options, save), saves (3 slots + codes, migrate), chiptune synth and music, debug panel and
  the HW test API with an autopilot.
- Content: hub, 11 interiors, prologue, ceremony, townsfolk talk, Meadowfold, D1 complete; Kilnridge and D2
  complete (charms, seals, eyelets, the Hookline, the Glazer, the Kilnwyrm). Presets `afterD1`, `afterD2`
  (`src/79_presets.js`) start a game at those points; `afterD3`, `afterD4` too.

## In progress
- Nothing half-built. The optional dungeons' bug hunt (11 findings) is fixed (`tests/review_opt.test.mjs`, plus S01/S31
  in `tests/secrets2.test.mjs`); its "rooms solvable without their idea" notes are kept as accepted second ways (QA_REPORT).
- The design critique's "richer Loom": the Hanging Gallery added (cutting a thing in motion); and a fourth Making
  (Gundry's "The Long Sulk": rule 4 turned round, where Tuck sulks is up to you); visual variety (the Loom's floor worn
  four ways and small things on its walls; loose thread-ends drifting on the wind in the Drift). The critique's list is
  done.

## Next priorities
1. Both optional dungeons are built and tested: O1 the Stray House (Linnet's Trail opens it; the bracelet changes the
   ending) and O2 the Unfinished House (the Guild pin or the Loom; the Long Hook).
2. Secrets: all built but S17 and S21 (dropped, see SPOILERS.md). The final-act review's findings are fixed and the Great Spool is rebuilt (16 rooms).
3. Done: playthrough legs 8 and 9 (a fresh game to the credits, scripted, in nine legs). Next: a fresh-eyes review of
   the whole game's pacing and the two optional dungeons; a single continuous run with no presets between legs is done too (the last test in tests/playthrough.test.mjs).
4. Music and art passes (the Drift is plain; the epilogue could use more on screen); pacing and playtime review.

## Known bugs
- Busts look a little like chess pawns (art).
- A creature can stand where a block needs to go; the player has to shoo it (works, but worth watching).
- Enemies don't show their threads (by design for now).

## Definition of done checklist (from GAME_BRIEF.md §13)
- [x] Substantial, fully playable adventure (a fresh game plays through to the credits; scripted, continuous)
- [x] ≥ 7 overworld regions (Hollowell, Meadowfold, Kilnridge, Millwater, Belfry Heights, Hushwood, Larkspur Fair, the
  Loomwood and the Frayed Edge; and the Drift past the fog)
- [x] ≥ 8 fully developed main dungeons (Tidyhouse, Kiln, Millrace, Belfry, Slumberhouse, Marionette Hall, Spoolworks,
  Loom; and the Great Spool as the finale)
- [x] ≥ 2 optional dungeons (the Stray House, the Unfinished House)
- [x] Evolving hub (per act; the Pull; the free valley after)
- [x] Interconnected overworld
- [x] Abilities expand exploration
- [x] Distinct dungeon mechanics
- [x] Earlier mechanics recombined (the Makings; the Great Spool's antechambers; the Unfinished House)
- [x] Genre transformation (the Makings)
- [x] Meta narrative
- [x] Foreshadowed reveal
- [x] ≥ 25 optional discoveries (about 33 secrets, Linnet's Trail of 8, 16+ Heart Patches)
- [x] Satisfying conclusion (to be judged by a human; reviewed twice)
- [~] 10–14 h main (estimated from the scripted run: 68 game-minutes, 113 rooms; not yet timed by a person)
- [x] Substantial optional content
- [x] Tested start to finish (scripted; plus per-room tests, 328 in all)
- [x] No critical bugs or softlocks known (every dungeon, both optional ones and the late secrets reviewed by fresh eyes; all findings fixed)
- [x] Save/load reliable (save/load tests across acts, old-save migration)
- [x] Launches easily (double-click `hollowell/play.html`)

The fresh-eyes check of the newest content found 7 problems, all fixed. Still to do before calling it done: the final
full verification.
