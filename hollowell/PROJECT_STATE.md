# HOLLOWELL: Project State

_Last updated: 2026-11-09 (session 1, day 1, late)._

## Status
**Seven Houses done: Acts I and II complete, Act III under way.** Hollowell (hub); Meadowfold and the Tidyhouse (D1);
Kilnridge and the Kiln (D2); Millwater and the Millrace (D3); Belfry Heights and the Belfry (D4); the festival;
Hushwood and the Slumberhouse (D5, the Bedroll); Larkspur Fair and the Marionette Hall (D6, the Crossbar; Reveal 1);
the Underside under the town (Gundry, the logbooks S22, the peepholes S23) and the Spoolworks (D7, two layers: cords,
knots, hatches, counterweights; Cog; the Needle; the Tangle). Tests cover every room and a scripted playthrough leg
by leg from a fresh game to the end of D7.

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
- A fresh-eyes review of D7 and the Underside.
- The Makings (src/68_makings.js): Tuck's Little Wander, run from below (the genre turn); then the Hall of Names
  (Reveal 2).

## Next priorities
1. The Makings with Tuck (3), Reveal 2.
2. Act IV (the north gate, Loomwood, the Loom D8, the Shears, cutting, the Drift, Linnet, the Great Spool, the ending).
3. Optional dungeons O1, O2; the remaining secrets; S11's seed planted in Gran's garden.
4. Music and art passes; a full QA pass; reviews.

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
