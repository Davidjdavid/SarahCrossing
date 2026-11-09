# HOLLOWELL: Project State

_Last updated: 2026-11-09 (session 1, day 1, late)._

## Status
**Five of eight Houses done (Act II half-way).** Engine complete enough for the whole game; Hollowell (hub) with
its buildings, interiors and townsfolk; the prologue and ceremony; Meadowfold and the Tidyhouse (D1); Kilnridge
and the Kiln (D2); Millwater and the Millrace (D3); the lake crossing, Belfry Heights and the Belfry (D4); the
Knotting Festival; Hushwood and the Slumberhouse (D5, 11 rooms, the Bedroll: beds, Homeward, crumbling boards,
dreamcatchers, Snorelings, Matron Hush, Mother Sloth). All covered by tests (166), including scripted
playthroughs leg by leg from a fresh game to the fifth Knot. The D4 review's 12 findings are fixed.

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
- A fresh-eyes review of D5 and Hushwood.
- Act II: Larkspur Fair (block 0,1, below the Kilnridge high mesa: drop down with the Bedroll) and the
  Marionette Hall (D6, the Crossbar), Reveal 1.

## Next priorities
1. Larkspur + Marionette Hall (D6, Crossbar, Reveal 1).
2. Act III (the Underside, D7 Spoolworks, the three Makings with Tuck).
3. Act IV (the Loom D8, cutting, the Drift, the Great Spool, the ending).
4. Optional dungeons O1, O2; the remaining secrets (S11 Bedroll in the fog waits for the valley's edges).
5. Music and art passes; a full QA pass; reviews.

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
