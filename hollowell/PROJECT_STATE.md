# HOLLOWELL: Project State

_Last updated: 2026-11-12 (session 1, day 4)._

## Status
**Polish campaign complete (10-12 November, POLISH.md).** David asked for a long, thorough polish pass; every exit
criterion is met. Every House reworked (bosses in three beats, mini-bosses two hits, rooms that combine earlier rules,
floors and set pieces), the Makings grown to eight Little Houses with a second child, the Great Spool rebuilt, all music
lengthened (a fight tune per House), the story's big scenes staged, a full dialogue and audio pass, every main-path room
played blind by reviewers, and fix rounds A-H from five full live playthroughs in Chromium and their picture reviews.
The last of them (live run 5) came back clean; with David's rule (one clean run is enough) the campaign ended there.
Final state: 851 headless tests, the browser checks, the placement audit (0 findings) and a live run of all nine legs
(0 probe issues, 0 errors) all pass.

**Outside QA package ready (12 November, qa_kit/; CLAUDE.md says how it's built).** 74 test saves, every one tested; a
confidential guide (about 61,000 words); spoiler-free instructions and how to run it; the QA copy of the page (the
tester's link). Preparing it found POLISH.md findings 82-89 (one softlock below the falls), left unfixed while the
outside tester works and listed for it. The tester's report came back (13 November: 6 findings, 0 Blocker, 2 Critical,
1 Major, 2 Minor, 1 Cosmetic, four of them already listed) and **fix round I fixed all of them and 82-89** (POLISH.md
82-95; QA_REPORT.md). David's page and the tester's link carry the fixed version.

**Version 1.0.0 (13 November):** the release David plays: his main page and a download (`hollowell-1.0.0.zip`; CLAUDE.md
says how it's made). David has called testing done; next is his own play (fixes on request, spoiler-free). 1.0.1 (13 November): the
first two things he found (POLISH.md 96-97); 1.0.2 (13 November): stuck in a wall at the first House's boss, two more
ways in found by a whole-game check, and the Houses' maps showing whole rooms (POLISH.md 98-101). David has frozen copies of the 12 November version (commit b217800) to compare
with later ones: the artifact https://claude.ai/artifact/CQ43nkNPyugBTyQbXsmDKV and a Linux folder (CLAUDE.md).

**COMPLETE (2026-11-10).** Every item of GAME_BRIEF.md §13 is met (checklist below); final verification passed: 328
headless tests including one continuous scripted game from the title to the credits, every browser scenario (the game
opened from `play.html` as a double-click would), and two rounds of fresh-eyes bug hunts over the newest content with
every finding fixed. The four-hourly check-in has been stopped. One thing no tool here can do: time a person playing
it (the 10 to 14 hour target is designed for and estimated, see the checklist).

**The main adventure is complete from start to credits**: Acts I to IV, all eight Houses, the Makings, both reveals,
the Drift, the Great Pull, the Great Spool, the Unwinding, the epilogue, the credits and the changed title, and the
free valley after. Tests cover every room (328 headless tests); the scripted playthrough runs from a fresh game to
the credits in nine legs; solution tests cover every room, both optional dungeons and the secrets. Presets `afterDrift` and `afterEnding` start late games.

## Done
- Brief recorded verbatim (GAME_BRIEF.md).
- Design, spoilers, world map, dungeon plan.
- Four-hourly check-in was scheduled (trigger `trig_01RDdWnsj7kTWV96cSykoTdq`, cron `7 */4 * * *` UTC; deleted at completion; it fired
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
- [x] ≥ 25 optional discoveries (about 60 secrets and finds, Linnet's Trail of 8, 38 Heart Patches: counted by tests/heartpatches.test.mjs)
- [x] Satisfying conclusion (to be judged by a human; reviewed twice)
- [x] 10–14 h main targeted (designed for it; estimated at roughly 10 to 13 hours for a first-time player from the
  room count, now about 117 rooms including the four Makings, at 3 to 5 minutes a room plus travel, reading and secrets;
  the scripted run, which never hesitates, takes 68 game-minutes; not timed by a person, which this setup can't do)
- [x] Substantial optional content
- [x] Tested start to finish (scripted; plus per-room tests, 328 in all)
- [x] No critical bugs or softlocks known (every dungeon, both optional ones and the late secrets reviewed by fresh eyes; all findings fixed)
- [x] Save/load reliable (save/load tests across acts, old-save migration)
- [x] Launches easily (double-click `hollowell/play.html`)

Done. The fresh-eyes check of the newest content found 7 problems, all fixed; the final full verification passed.
