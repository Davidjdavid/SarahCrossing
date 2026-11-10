# HOLLOWELL: Project State

_Last updated: 2026-11-10 (session 1, day 2)._

## Status
**The main adventure is complete from start to credits**: Acts I to IV, all eight Houses, the Makings, both reveals,
the Drift, the Great Pull, the Great Spool, the Unwinding, the epilogue, the credits and the changed title, and the
free valley after. Tests cover every room (274 headless tests); scripted playthrough legs run from a fresh game to
the end of D7, and solution tests cover everything after (the Makings, Reveal 2, the Loom, the fog, the Drift, the
Great Spool, the end). Presets `afterDrift` and `afterEnding` start late games.

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
- Nothing half-built. The Makings/Loom review's findings are all fixed (`tests/review_m.test.mjs`).

## Next priorities
1. Optional dungeon O2 (the Unfinished House: the Guild pin from S06, Mr Ives). O1, the Stray House, is built and
   tested (Linnet's Trail opens it; the bracelet changes the ending).
2. The remaining secrets: S01, S03, S07-S10, S14, S17, S21, S25, S26, S31.
3. Playthrough legs 8 (the Makings to the Loom) and 9 (the fog to the credits); a fresh-eyes review of the final
   act; a full-length QA playthrough.
4. Music and art passes (the Drift is plain; the epilogue could use more on screen); pacing and playtime review.

## Known bugs
- Busts look a little like chess pawns (art).
- A creature can stand where a block needs to go; the player has to shoo it (works, but worth watching).
- Enemies don't show their threads (by design for now).

## Definition of done checklist (from GAME_BRIEF.md §13)
- [ ] Substantial, fully playable adventure
- [ ] ≥ 7 overworld regions
- [ ] ≥ 8 fully developed main dungeons
- [ ] ≥ 2 optional dungeons
- [ ] Evolving hub
- [ ] Interconnected overworld
- [ ] Abilities expand exploration
- [ ] Distinct dungeon mechanics
- [ ] Earlier mechanics recombined
- [ ] Genre transformation
- [ ] Meta narrative
- [ ] Foreshadowed reveal
- [ ] ≥ 25 optional discoveries
- [ ] Satisfying conclusion
- [ ] 10–14 h main
- [ ] Substantial optional content
- [ ] Tested start to finish
- [ ] No critical bugs or softlocks
- [ ] Save/load reliable
- [ ] Launches easily (double-click `hollowell/play.html`)
