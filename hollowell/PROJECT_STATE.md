# HOLLOWELL: Project State

_Last updated: 2026-11-09 (session 1, day 1, late)._

## Status
**Act I done: 4 of 8 Houses, the festival.** Engine complete enough for the whole
game; Hollowell (hub) with its buildings, interiors and townsfolk; the prologue and ceremony; Meadowfold; the
Tidyhouse (D1, 14 rooms); Kilnridge and the Kiln (D2, 13 rooms, the Hookline); Millwater and the Millrace (D3,
11 rooms, water: currents, rafts, wheels, the Paddle); the lake crossing, the cliff stair, Belfry Heights and the
Belfry (D4, 12 rooms: bells, wind, sleepers, the Recall Bell); the Knotting Festival with Returnball. All covered
by tests (120), including scripted playthroughs leg by leg from a fresh game to the fourth Knot.
The fresh-eyes review of the slice is fixed (see QA_REPORT.md).

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
- Act II: Hushwood (the rest of block 2,1: the sleeping giant on the east road, woken by the Recall Bell) and
  the Slumberhouse (D5, the Bedroll).

## Next priorities
1. Hushwood + Slumberhouse (D5, Bedroll).
2. Larkspur Fair + Marionette Hall (D6, Crossbar, Reveal 1).
3. A fresh-eyes review of D4 and the Heights.
3. Millwater + Millrace (D3), Belfry Heights + Belfry (D4), the festival; Hushwood + Slumberhouse (D5);
   Larkspur + Marionette Hall (D6) and Reveal 1.
4. Act III (Underside, D7, Makings), Act IV (D8, cutting, Drift, final), optional dungeons, secrets.
5. Music for every region and House; art passes.

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
