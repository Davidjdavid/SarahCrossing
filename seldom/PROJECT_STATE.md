# Seldom: project state

> Contains spoilers. Read this first when resuming (then `CLAUDE.md`, then `DESIGN_NOTES.md`). Never restart the project.

- Branch: `claude/exciting-rubin-25jcjf` (SarahCrossing repo, folder `seldom/`).
- Four-hour check-in: scheduled task `trig_01MXeaWdKGDDdZD8EoZnHgbV`, deleted when the game was finished (9 November).
- Deliverables: `seldom/seldom.html` (one file, opens from disk) and the private claude.ai Artifact
  https://claude.ai/artifact/S9EUh2jjQ5MwP4zPJfV29v (built from `seldom/artifact.html`: rebuild, then publish that same
  file path to update it in place).

## Status (9 November 2026, first session; first check-in 08:20 UTC)

**Phase: done.** Complete, tested end to end (bot and four blind agent playtests covering every part), published.

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
- Curios (6 secrets, all in): The Last Note (the band's song to its end), Golden Egg (7th egg), Ant Crown, Old Sandwich
  (Rover), Clockwork Feather (the Clock seen at midnight), Lost Marble (Leica squeezed into the walled garden).
- Touch controls (pad and buttons drawn over the game on touch screens), gamepad, mouse wheel / right-drag.
- `artifact.html`: the same build as an Artifact page (the host adds the document skeleton).
- Playtesting: `tests/playserver.mjs` holds the game in a headless browser for blind agent playtests over HTTP
  (`/do?k=`, `/shot`, `/text`); `Debug.afterLampNight()` sets up a game just after act one.
- Tests: `tests/laws.test.mjs` (16 passing), `tests/playthrough.mjs` (the bot finishes the game: about 11 minutes of game
  time for a bot that knows every answer).

## Next priorities

The game meets the brief's definition of done; the four-hour check-in task was deleted. If David asks for more:
- A sound pass by ear (levels were measured by rendering each song offline, not listened to).
- More decoration in the larger open areas (the cape, the pasture's south).
- Possible extra secrets; keep them consistent with the laws.

## Known issues / risks

- Herding is the most physical puzzle (drag with the trailing edge, push with a pinned view, or squeeze through the fence);
  tests prove the drag and the pinned push. Blind testers found it the most fiddly part before the view could go past the coast.
- After un-splitting the view stays pinned; a hint appears after bumping the edge for a second.
- Act three's fire alignment is forgiving (lamp catches sparks within ~2 tiles) but still the trickiest aim in the game.
