# SELDOM: design notes (FULL SPOILERS)

> Spoilers. This file is the design bible for the developer (Claude). The player should not read it.

## Phase 1: concepts considered (private)

Ten concepts were sketched and scored (originality / gameplay potential / fit for the player's tastes / feasibility / arc):

1. **The Frame** (chosen). Things exist and time passes only inside the camera's view. The player first plays a
   classic top-down adventure, gains control of the camera, and finally plays *as* the camera. 5/4/5/5/5.
2. **Ordinances.** Posted signs are laws of nature within their reach ("KEEP OFF THE GRASS" is a wall); uproot and
   replant them. Strong on "ordinary rules", but too close to rule-word games and to the earlier property-editing game. 3/4/4/5/3.
3. **Hindsight.** Stamp an outcome on a thing (BROKEN, WET, OPEN) and the world summons the nearest cause to make it
   happen, with side effects. Very original; risk of unpredictability; weaker genre turn. 5/4/4/3/3.
4. **Initiative.** The whole world is a turn-based battle; reorder the world's turn queue (the river, the sun, doors).
   JRPG start is a perfect "recognizable genre", but the core verb is abstract UI dragging. 4/3/4/5/4.
5. **Hearsay.** Consensus belief is reality; whispered rumors mutate through villagers' quirks. Text-heavy, effect
   explosion. 5/3/3/2/3.
6. **Echo Jar.** Things react to sounds, not events; record, reverse (undo), speed up sounds. 4/3/3/3/3.
7. **Far and Wide.** Size depends on distance from a movable Center Stone. 3/3/2/3/2.
8. **Wake.** The path you walk leaves a conductive thread carrying qualities between things. 3/3/3/3/2.
9. Local time per tile, spreading like heat (rejected: too close to the earlier clock game).
10. Mass equals market price (rejected: management-game drift).

The Frame won: it plays with presentation and interface (meta), it is built on classic console conventions the
player grew up with (off-screen freezing, respawning when the screen scrolls back, screen-edge walls, sprite flicker,
screen wrap), each convention becomes a law of nature with real consequences, and the genre turn ("I was never the
hero, I was the camera") reframes the whole game.

## The game in one paragraph

*Seldom* is a little island that is seldom seen. It looks like a cozy 16-bit top-down adventure: a kid named **Dot**,
a village with a clock tower and a band, a dark lighthouse to relight. But on Seldom, **only what is on screen is
alive**. Off screen, everything holds perfectly still. Wild things that leave the view return to where they began when
that place is seen again. The island's hour only moves while the Great Clock is watched. The player gradually gains the
lighthouse's four lost glasses (Spyglass, Loupe, Wide Glass, Prism), which let them move, zoom and split the view, and
each area of the island has its own way the view bends reality. In the last act the view pulls back: the island is a
little board, the "screen" was always a small rectangle on it, and the player plays the Eye itself, gathering the island
for Lamp Night and giving Seldom an eye of its own, so it can go on living after the player leaves.

## The laws (the unusual physics)

Each law is recorded in Dot's **Notebook** the first time the player sees it happen (never before).

1. **Still** — Whatever is outside the view holds perfectly still: walkers mid-step, a ball mid-air, water mid-fall,
   the band mid-note (the music is in the world: it stops when the band is off screen, and resumes on the same note).
2. **Return** — Wild things (critters, eggs, fruit, flowers, loose boulders, ghosts) that leave the view are gone; when
   the place they began comes into view again, they are back there, as new. Pocketed or eaten wild things count as gone,
   so renewables regrow (and duplicate). Made things (tools, crates, people) remember where they are.
3. **Bound** — Some creatures can't bear to be unseen (sheep, moths, the dog): they can't leave the view, and its
   edges push them along. Squeezed between an edge and a wall, they pop through to the nearest open spot inside the view.
4. **Hour** — The Great Clock keeps the island's hour, and only turns while it is seen. Schedules, shops, the tide, the
   lamplighter and the ghosts all follow it. Indoors, or anywhere away from the square, the hour stands still.
5. **Wrap** — In the Turnabout Woods the edges of the view meet: anything that leaves one edge comes in at the other.
6. **Crowd** — The view can only hold so many figures in one line across it. The ones farthest from the middle of the
   view flicker, and while flickering they pass through other figures and are passed through. Zooming out makes the
   lines taller, so crowds flicker sooner.
7. **Tiny** — Things too small to see aren't there. Tiny things (ants, their twig bridges, cracks, tiny writing) exist
   only when the view is zoomed in close (the Loupe).
8. **Seam** — With the Prism the view splits in two; where the two halves meet, the two places are one: walk (or flow,
   or burn) across the seam from one to the other.
9. (secret) **Away** — When the player looks away from the game itself (the browser tab hidden), the whole island holds
   still and the game says so when they come back.

## Controls

- Arrows / WASD: walk (and pan in look mode; move the Eye in the last act).
- Z / Space / Enter: talk, pick up, put down, throw (while walking), use.
- X / Shift (hold): look. Arrows pan the view; Dot stands still. Released, the view stays put (pinned): its edges are
  walls for Dot. C: let the view follow Dot again. (Spyglass.)
- Q / E, - / +, mouse wheel: zoom out / in (Wide Glass out, Loupe in).
- Tab: split view on/off (Prism). With the split, look mode pans the right half.
- N: Notebook. Esc: menu (save, settings).
- Gamepad: left stick walk, right stick look, shoulders zoom, A action, Y notebook, Start menu.

## World

One continuous island map (Seldom), with small interiors. Center: the village (hub). East: Pan's Pasture. North: the
Stillfall Quarry. West: the Turnabout Woods. South-west, through the woods: the Hollow. North-east cape: the lighthouse.
The hub changes as the player watches it: Bridget's bridge, the bakery, the drummer's return, the band's song, the
traveller who arrives, lamps at night, the night market, the festival.

## Progression (critical path)

See `PROJECT_STATE.md` for what is built. The intended path:

- **Act I, "The Seen One"** (village): Dot is asked to get the village ready for Lamp Night, which never comes because
  it is always morning. The player learns Still (a ball hangs in the air, the band stops mid-note), Return (eggs), the
  watched-work of Bridget's bridge and the oven, and finally the Hour (night comes only by watching the Great Clock).
  Lamp Night: Iris gives Dot the **Spyglass** (look and pin the view).
- **Act II, "The Glasses"**: the Spyglass, the Loupe, the Wide Glass and the Prism were the lighthouse's lens.
  - Pasture (Bound, Return): herd Pan's sheep with the view's edges (squeeze them through fences). The **Loupe**.
  - Quarry (Still mastery: freeze the far half of a mechanism, act on the near half): the north gate's watchman, the
    hourglass gate, Stillfall's curtain, the rockslide. The **Wide Glass**.
  - Woods (Wrap): cross tree walls by framing them; bigger jumps with the Wide Glass. The way to the Hollow.
  - Hollow (Crowd, Hour: ghosts only at night): pass the line of ghosts by joining their line at the edge of the view.
    The **Prism**.
- **Act III, "The Eye"**: the Prism's Seam crosses the chasm to the cape. In the lighthouse Dot sets the four glasses in
  the lamp: the view pulls back over the whole island and the player plays the Eye (no Dot): gather the island for Lamp
  Night, bring fire from the bakery's oven to the lamp across the Seam, light it. The lighthouse beam becomes the island's
  own eye (time passes where it sweeps). Dot asks the player for one last look; the player frames whatever they like and
  closes the eye (an iris-out). That frame is the credits' picture. After the credits the island keeps living in the beam.

## Names (foreshadowing)

Camera and film words hidden as ordinary names: **Iris** (the astronomer), **Pan** (the shepherd), **Dolly** (a sheep),
**Ansel** (the old keeper), **Bridget** (Muybridge, the carpenter who only moves while watched), **Flash** (the fast kid),
**Leica** (the dog), **Tilt** (the drummer who wandered off).
