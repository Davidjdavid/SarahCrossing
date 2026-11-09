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

## As built: every puzzle and its solutions (tile coordinates on the island map)

**Act one (village, harbor).** Start on the pier (50,71). Ansel fishes; his fish bites after 14 s of being watched.
- Eggs: the hen run (58-62, 41-44) has one wild egg. Pocket it, walk away (12+ tiles) and back: it's there again. Three
  for Mrs. Crumb (bakery interior). The seventh egg picked is golden (curio).
- Cake: the oven bakes only while seen (24 s); leaving the bakery pauses it.
- Bridge: Bridget (64,42) builds only while seen (22 s). Opens the pasture.
- Drummer: Tilt is frozen mid-step on the west beach (37,60); seen, he walks back to the bandstand, only while seen.
  When he arrives the village song gets its drums.
- Night: the island's hour moves only while the Great Clock (49-50, 34-37) is seen (1 h per 30 s). The bench by the
  Clock (52,39) time-lapses everything in view 8x until night or morning. Lamp Night starts when all three errands are
  done, it's night, and Dot is in the square. Reward: the Spyglass (look / pin).
- Band: after 20 loops of being heard with drums, the song ends: "The Last Note" (curio).
- Midnight: the Clock's bird drops a brass feather by the tower if the Clock is seen at midnight (curio).
- Leica (Bound in the village) squeezed against the walled garden's hedge (42-46, 30-33) pops inside, digs, and brings
  out a marble when she comes back out (curio).

**Pasture.** Pan opens the pen (86-92, 44-50, gate on the north side 88-90). Sheep are Bound inside the pasture.
Ways: drag a sheep with the trailing edge (walk away from it), push it with a pinned view's edge (look/pan), squeeze it
against the pen's fence so it pops inside. All four penned: the Loupe (zoom in to 3x). Optional: the Ant Crown on the
pond's islet (91,56) over the ants' twig bridge, only there at 3x.

**Quarry.** Lux patrols (50-61, 30) and turns back anyone going north through the gate while he's seen. Ways: pin the view
away from him when he's at the far end (he holds still), or zoom in. After you come back south he gives up for good.
Hourglass gate (54-55, 22): the plate (44,24) opens it; the hourglass (41,24) runs only while seen (1.5 s). Ways: stand
on the plate, look right so the hourglass leaves the view, then walk (it holds); zoom in; set a rock (wild) on the plate.
The lever behind it (56,21) opens it for good. Stillfall: the falls come over only while the spring (44-45, 11) is seen;
look down (or zoom in) until the curtain drains, then walk into the cave (44-45, 15): the Wide Glass (zoom out to 0.5).
The chute: push the cut block at the top (59,7) down; it rolls only while seen. Ways: zoom out to see the whole chute,
or let it freeze and walk round to the foot and look up at it. It breaks the cracked wall (64, 17-20) to the ferry ledge.

**Woods (wrap zone 4-34 x 14-55).** Wall A (25-26): look left so the view's right edge is near Dot in the clearing, then
walk right: Dot comes in at the left edge, beyond the wall. Rope A (23,33) opens a gate for next time. Wall D (rows
40-52, thick): zoom out to 0.75 (not 0.5: you'd land in the stream), pin the view so its bottom edge is in the strip
below (rows 53-55), walk north out of the top. Rope D (15,53) opens the tunnel for next time. Optional: Rover frozen in
the far north (10,6) (cross the stream by wrapping vertically): the Old Sandwich (curio). Ruth wraps round with the view.

**Hollow.** The black brook (rows 60-61): the ants' twig bridge at x 28 exists only at 3x zoom. The Faded appear only at
night: night stays as long as the Clock isn't seen, so make it night in the village and walk down. The chapel door opens
only at night. Four Faded fill the yard's gateway (16-19, 70): with Dot pressing into their line there are five in one
band of the view; pin the view so Dot is the farthest from the middle and Dot flickers and walks through (or zoom out so
the bands are taller). Mrs. Sepia gives the Prism. Leaving: flicker again or split the view (Tab) and walk across the
seam to outside the yard. The rope by the east hedge (33,65) opens a gate to the harbor for next time.

**Cape.** From the ferry ledge (65-66, 17-20) split the view, move the other half so its edge is on the cape (71+),
walk across the seam. The lighthouse door (87,9) leads to the lamp room: set the four glasses.

**Act three (the Eye).** Arrows move the view; Q/E resize; Tab splits; X moves the other half. Goals: night (the Clock),
Ansel to the lighthouse (others optional: Iris, Pan, Flash), then a flame: the square's bonfire throws sparks east; split,
put the left half's right edge just east of the fire and the right half's left edge just west of the lamp (87,3) at the
matching height; a spark crossing the seam reaches the lamp. Walkers stop at the ledge ("How do we get across?") and
cross on a seam like Dot did. Lit: the beam is a view of its own (things in it go on), the Faded are restored. Last look:
Z closes the eye (iris-out), credits over that frame, then the island goes on in its light. Continue after the end: Dot
walks again; the title says how many nights passed while you were away.
