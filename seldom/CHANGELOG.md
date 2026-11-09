# Seldom: changelog (spoilers)

## 9 November 2026

- Brief saved; ten concepts weighed; the Frame chosen (design notes).
- Prototype: the engine and all view laws on a test ground (`?test`); judged worth building on.
- Full build: the island painted in code; village and harbor with act one (Lamp Night); pasture; quarry and cave; the
  Turnabout Woods; the Hollow and chapel; the cape, lamp room, act three (the Eye) and the ending; rooms; songs; save
  and continue; title; notebook; menu; hints through Iris.
- QA: a bot that plays the whole game; law tests. Fixes found by them: the interaction reach (across counters, at tile
  edges), the hour rate (1 h per 30 s) and the bench time-lapse, the bench moved into view of the Clock, everyone sent
  home after Lamp Night, the hourglass gate's gap in the wall, the pasture brook moved off the bridge's landing, the
  ant bridge moved clear of the chapel, Dot rescued when a tiny bridge vanishes under them, the Hollow walled off from the
  harbor (with a gate that opens from the Hollow's side), signs moved out of a narrow cut, the seam made forgiving
  (reach and landing), sparks fly over water, wrapping only inside the woods, tangled people separate.

## 9 November 2026 (first check-in)

- All six secrets in (golden egg, tower bird at midnight, Leica and the walled garden, plus the three before).
- Presentation: rooms framed closer, Dot glances up at the player when left standing, split-view cue (which half moves),
  ghostly Mrs. Sepia, the great lens drawn properly, decorations at the bakery, harbor and cape, wider controls panel.
- Touch controls for phones and tablets; ambient sound from what's in view; autosave every 30 s and on every door.
- `artifact.html` build for publishing; blind agent playtests set up (`tests/playserver.mjs`).
- Fixes: nested scenes no longer cut each other short (found by the bot), resuming the last act keeps the walkers'
  progress, the band's song can't end during the last act, squeezing is noted only when something pops through a wall.

## 9 November 2026 (blind playtests and finish)

- Four blind playtests by fresh agents (act one; act two in two halves; act three and the ending), each finished, and
  everything they found fixed (see TEST_PLAN.md): the view goes out over the sea at the island's edge, Dot can never be
  lost out of view, creatures keep to their home ground, clearer notices, dialogue and hints, the last act's map made
  readable (marks, joined edges, a close-up of what the view sees), steadier steering, slower credits, a lit title after
  the end, rope posts and gates that read, a day/night mark on the clock, slimmer collisions, a little more walking pace.
- Published as a private claude.ai link (artifact.html); the four-hour check-in task deleted: done.

## 9 November 2026 (David's first play)

- David got stuck at the first woods wall: "look the wrong way" read as turning Dot round. Ruth now adds, once the
  Spyglass is in hand, that it's the view that moves (hold X, look past the trees as far as it goes, let go, walk away
  from the trees out of the view's edge); Iris's hint says the same.
- From David's screenshot: the red X (where Dot can't come in at the far edge) was drawn under the trees and hidden in
  just the spot where it mattered. Dot's edge marks (the see-through copy and the X) are now drawn over everything, the
  X bolder, outlined, blinking and kept inside the view.
