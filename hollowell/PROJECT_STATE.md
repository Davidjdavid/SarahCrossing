# HOLLOWELL: Project State

_Last updated: 2026-11-09 (session 1, day 1, evening)._

## Status
**Phase 4 (vertical slice) nearly done.** Engine complete enough for the whole game; Hollowell (hub) with
its buildings, interiors and townsfolk; the prologue and ceremony; Meadowfold; the Tidyhouse (D1, 14 rooms,
mini-boss, boss, Knot) all playable and covered by tests, including a scripted playthrough from a fresh game
to the first Knot and back out.

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
- Content: hub, 11 interiors, prologue, ceremony, townsfolk talk, Meadowfold, D1 complete.

## In progress
- Reviewer pass on the slice; D2 (Kilnridge + the Kiln).

## Next priorities
1. Fix what the slice review finds.
2. Kilnridge region and the Kiln (D2, Hookline); open the canyon road; Kids' pretend Wander (S12) and
   Tidiness Trials (S28) in town.
3. Millwater + Millrace (D3), Belfry Heights + Belfry (D4), the festival; Hushwood + Slumberhouse (D5);
   Larkspur + Marionette Hall (D6) and Reveal 1.
4. Act III (Underside, D7, Makings), Act IV (D8, cutting, Drift, final), optional dungeons, secrets.
5. Music for every region and House; art passes.

## Known bugs
- Busts look a little like chess pawns (art).
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
