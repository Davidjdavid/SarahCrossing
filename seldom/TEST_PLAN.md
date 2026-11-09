# Seldom: test plan (spoilers)

## Automated

- `node seldom/tests/run.mjs` runs everything: the build, the laws, the whole game.
- `tests/laws.test.mjs` (node:test + Playwright Chromium, debug mode): each law in isolation in the real game: Still
  (a ball holds still in the air), Return (an egg comes back), Hour (only while the Clock is seen), Bound (a sheep is
  dragged by the view's edge), Wrap (crossing a tree wall; never outside the woods), Crowd (a fifth figure flickers),
  Tiny (the ants' bridge only up close), Seam (crossing the gap), save/load round trip, resuming the last act.
- `tests/playthrough.mjs [shots]`: `Bot` (src/85_debug.js) plays the whole game with the player's buttons (walk by
  path, look, zoom, split, act), chapter by chapter, from the opening to the title after the credits. Each chapter checks
  its outcome; failures print where Dot is and why. Two shortcuts, both noted: the sheep are placed north of the pen
  before being dragged in (the drag itself is real), and in the last act the bot sets the view's position directly.

## By hand / by looking

- `tests/shot.mjs` for screenshots of any state; every area was looked at (title, harbor, village, pasture, quarry,
  woods, Hollow at night, cape, the Eye overview, the beam).

## Results

| Date | What | Result |
|---|---|---|
| 9 Nov | laws.test.mjs | 13/13 pass |
| 9 Nov | playthrough.mjs | completes: opening to title, game time ~11 min for the bot, no page errors |

## Softlock review (so far)

- Doors that lock (Lux's gate, the hourglass gate, woods gates) all have a way from the other side or open for good.
- Dot standing on a tiny bridge when it stops existing: put back on the nearest dry ground with a splash.
- Seam landing blocked: Dot stays on its side (never lost outside both halves).
- People tangled together can walk apart.
- Pinned view: always undone with C / tap X; a hint appears after bumping into the edge.
