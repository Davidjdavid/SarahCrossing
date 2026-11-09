# HOLLOWELL: Project State

_Last updated: 2026-11-09 (session 1, day 1)._

## Status
**Phase 2 → 3.** Concept chosen (12+ candidates considered privately), full design written
(DESIGN_DOCUMENT.md, SPOILERS.md, WORLD_MAP.md, DUNGEON_TRACKER.md). Technical foundation starting.

## Done
- Brief recorded verbatim (GAME_BRIEF.md).
- Design, spoilers, world map, dungeon plan.
- Four-hourly check-in scheduled (trigger `trig_01RDdWnsj7kTWV96cSykoTdq`, cron `7 */4 * * *` UTC, fires
  into this session).

## In progress
- Engine foundation (src/): loop, input, renderer, tiles, sprites, font, text boxes, maps, entities,
  collision, the Return, player, save/load, menus, audio, debug tools, headless test harness.

## Next priorities
1. Engine foundation + headless tests of the Return rules.
2. Vertical slice: Hollowell (hub), Meadowfold, D1 Tidyhouse complete with boss, secrets, Gloves.
3. Fresh-context review of the slice; fix.
4. Regions and dungeons in order (D2…D6), then Act III (Underside, D7, Makings), Act IV (D8, cutting,
   Drift, final), optional dungeons, secrets, polish.

## Known bugs
None yet.

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
