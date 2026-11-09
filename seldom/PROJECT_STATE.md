# Seldom: project state

> Contains spoilers. Read this first when resuming (then `CLAUDE.md`, then `DESIGN_NOTES.md`). Never restart the project.

- Branch: `claude/exciting-rubin-25jcjf` (SarahCrossing repo, folder `seldom/`).
- Four-hour check-in: scheduled task `trig_01MXeaWdKGDDdZD8EoZnHgbV` (fires into this session). Delete it once the game
  is finished and verified (definition of done in `GAME_BRIEF.md`).
- Deliverable: `seldom/seldom.html` (one file, opens from disk). To be published as a private claude.ai Artifact link too.

## Status (9 November 2026, first session)

**Phase:** full development done end to end; QA and refinement in progress.

Done:
- Engine: canvas renderer with a 16:9 letterboxed view, pixel font, art drawn in code, tiles, things, collision,
  doors and rooms, dialogue with voices, scenes as async functions, pathfinding, people's days, notebook, menu,
  settings, title, save/continue (localStorage), WebAudio synth with diegetic music (each song plays from a thing in the
  world, only while seen) and sound effects, gamepad and mouse (wheel zoom, right-drag look).
- The view and its laws: Still, Return, Hour, Bound (+ squeeze), Wrap (woods), Crowd, Tiny, Seam, the secret Away law.
- The whole island (100x80 tiles, painted in code) and every area: village and harbor (act one, Lamp Night), pasture,
  quarry (+ cave), woods, Hollow (+ chapel), cape (+ lamp room), act three (the Eye: pull-back, gathering the island,
  fire across the seam, the lit beam as the island's own view), the ending (last look, iris-out, credits over the last
  frame, the island going on after), post-ending continue ("N nights went by on Seldom").
- Curios (6 secrets): The Last Note (watch the band to the end), Golden Egg (**not yet implemented**), Ant Crown,
  Old Sandwich (Rover), Clockwork Feather (**not yet implemented**), Lost Marble (**not yet implemented**).
- Tests: `tests/laws.test.mjs` (13 passing), `tests/playthrough.mjs` (the bot finishes the game: about 11 minutes of game
  time for a bot that knows every answer).

## Next priorities

1. Implement the three missing curios (golden egg: 7th egg; feather: watch the Clock at midnight; marble: Leica squeezed
   into the walled garden).
2. A careful look at every screen (screenshots) and presentation polish: Dot glancing at the player when idle; the Eye
   act's intro wording; split-view affordance (which half moves); cape decoration; interior art.
3. Sound pass: check every song and effect for balance (can't be heard here: keep volumes conservative).
4. Agent playtest without spoilers (a fresh agent playing from screenshots) for clarity of hints and pacing.
5. Pacing review: hour rate (1 h per 30 s watched), hints, how long each area takes a first-timer.
6. Publish the Artifact; write the user-facing "how to play" line (spoiler-free).

## Known issues / risks

- Herding is the most physical puzzle; the bot only proves the drag-into-pen route (top edge). Players may find it fiddly.
- After un-splitting the view stays pinned; a hint appears after bumping the edge for a second.
- Act three's fire alignment is forgiving (lamp catches sparks within ~2 tiles) but still the trickiest aim in the game.
