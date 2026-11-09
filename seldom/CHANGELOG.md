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
