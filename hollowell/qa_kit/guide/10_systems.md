## How the game works: the systems, rule by rule

This part is the rulebook the rest of the guide leans on. Every puzzle is meant to follow from these rules; nothing is
special-cased (the developers' own rule). If something behaves differently from what is written here, it is worth a
report. Numbers are in game frames: the game steps exactly 60 times a second, so 60 frames = 1 second. Tiles are 16x16
pixels; a House room is 20x11 tiles.

### 1. Controls and input

| Button | Keyboard (default) | Controller (standard layout) |
|---|---|---|
| Move (8 ways) | Arrows / WASD | D-pad / left stick |
| Act | Z / J / Space | A |
| Stick (swing) | X / K | X |
| Use the tool in hand | C / L | B or Y |
| Tool before / after | Q / E | LB / RB |
| Menu | Enter / Esc | Start |
| Map (opens the menu on its Map tab) | Tab / M | Back/Select |

What each button does depends on the moment:
- **Act**: talk, read a sign, open a chest, lift a light thing (pot, crate) when standing still in front of it, throw what's
  carried (4 tiles straight ahead, measured from the middle of Wren's tile, so a throw always lands the same distance),
  set down what's too big to throw ("No room to put it down there." if the tile is blocked), grip with the Gloves (hold
  Act), take Gran's hand at the very end (hold), advance and choose in dialogue. Something across a counter can be
  talked to.
- **Stick**: a 16-frame swing (it can hit on frames 4 to 12 of it), a 16x16 box in front of Wren. 1 damage to creatures;
  flips crystals; knocks a light loose thing one tile (which displaces it); thuds on marked or fixed things. Not while
  carrying or gripping. Available once the Wanderstaff is given at the opening ceremony.
- **Tool**: uses whatever is in hand (shown top right). Some tools work on a hold: the Bedroll (hold 20 frames for
  Homeward), the Paddle (hold and steer). A tool pressed while Wren is in the air (hopping off a ledge) or while the
  camera is moving into the next room counts as soon as she lands, if still held (so Homeward straight after a drop
  works). The Bell can be rung while gripping with the Gloves (the one combination of two hands).
- **Tool before/after**: cycles tools in hand; also works in mid-flight home (to change to the Bell, see 4.4).
- **Menu / Map**: only when Wren is standing normally and no scene, dialogue or camera move is running.
- **Pushing** is walking: walk straight (not diagonally) into a thing on the grid, roughly lined up (within 7 px), for 12
  frames (18 for a heavy thing): it slides one tile (16 frames, 20 if heavy). Walking into a locked door with a key
  unlocks it (a knock every 40 frames otherwise, with "Locked. A small key would fit.").
- **Deep water**: leaning into the edge of deep water from dry land for 40 frames steps in (a small splash at 16 frames
  warns); she sinks and is flown home. From a float you can't step off into deep water at all.
- **Ledges**: walking down off a ledge hops down to the first open ground below (up to 5 tiles). If something stands on
  the landing tile the ledge acts as a wall; if there's nothing to land on it's a fall.
- Walking speed 1.3 px a frame; 0.92x while carrying, 0.6x on slow ground, diagonals x0.707. Wren slides round corners.

**Options > Controls** (title screen or pause menu) rebinds every button on the keyboard and the controller. Rules:
binding a key to a button removes that button's other keys; the arrows and Escape are always kept for moving and the
menu (trying to bind them elsewhere says "X is kept for ..."); the d-pad and left stick always move; binding a controller
button takes it off whatever had it; "Put them all back as they were" resets both; Escape while waiting leaves a binding
as it was. The game's own words name the button currently bound ("press [tool]" shows C, or B with a controller in
hand: whichever was used last). Bindings are kept per browser with the other settings, not per save.

**Name entry**: type up to 10 characters (letters, digits, space, ' and -), Enter to finish; with a controller, a letter
grid (Act picks, Stick deletes, Menu finishes). Empty becomes "Wren". The name is used in lines ("{name}") and the credits.

**Title screen**: Continue (only when a slot has a save), New Wander, Options. Starting a new Wander on an occupied slot
asks for a second press of Act ("Start over in this slot?"). Each slot shows the name, Knots, play time and place.

### 2. The Return: the core law (src/07_return.js; DESIGN_DOCUMENT.md section 4)

**Marks and traces.** A marked thing has a home tile, its mark (a small stitched X, shown on the floor only while the
thing is away). Moved off it, the thing lays a trace: the tiles it passed through, in order, with loops erased (stepping
back onto a tile it already passed cuts the trace back to that tile). States: home, away (waiting), returning.

**Patience.** Left alone, an away thing waits its patience, then returns. Defaults: light 90 frames (1.5 s), medium 120
(2 s), heavy 150 (2.5 s); some things set their own (e.g. the Airing Cupboard's block 300). Any touch (pushed, pulled,
knocked, let go) restarts the full wait. Tells: a ring of 16 stitches round the empty mark unpicks as patience runs
down (full and faint while the thing is held); in the last half-second the thing shivers and its thread is drawn
lighter (taut); a thing straining against something in its way shakes.

**Back the way it came.** Returning, it steps back along its trace, one tile per 10 frames (more slowly against a
current, see the Paddle). Where the trace jumps (a throw, a hook pull's start, a flight) it flies straight to the next
point at half speed. Reaching its mark it clicks home with a sparkle and a sound.

**Held things wait.** Carried, gripped (Gloves), ridden while paddled, tied off from below, walked on the Crossbar,
mid-throw or mid-Needle: no return; patience restarts on release.

**Heavier shoves lighter.** Weights: light 1 (pots, crates, keys, critters), medium 2 (wooden blocks, barrels, puppets,
Wren, townsfolk, most creatures), heavy 3 (stone blocks, boulders, busts, statues), fixed. A returning thing's force is
its weight, plus 1 when snapped by a bell. It shoves one tile along its way anything on the grid lighter than its force
that has room to move; knocks a lighter creature (2 damage from a heavy thing, 1 otherwise); shoves Wren only when its
force is heavy or more (so a heavy thing, or a medium one snapped by a bell), and it may shove her into a pit or deep
water (never into a wall). Anything as heavy or heavier, fixed, asleep, or with nowhere to go: it waits behind it.

**Plates are pressed in passing.** A moving thing occupies both tiles for the length of its step, so plates feel it as
it goes by (whether pushed or returning). Exceptions are per plate (see 3).

**Falls and sinks go home at once.** A marked thing that ends a push or throw on a pit, or (not floating) on deep
water, pops back onto its mark at once (a poof). A returning thing does not fall: it hangs on its thread over holes and
water. A thing being reeled by the Hookline doesn't fall either while reeled.

**Never onto Wren, never walling her in.** A thing popping home (from a fall, a sink, reassembling, or wound in by the
Great Spool's drum) waits over its mark, its mark glinting with motes of thread rising, while Wren (or anything) is on
the mark, and also while landing would leave Wren no tile to step to or cut her off from every way out of her room she
could otherwise walk to (a doorway, stairs, a hatch) (`Return.wallsIn`). It comes down the moment that's no longer so.
A thing at home may still block a way; it never shuts her in a dead end.

**Breaking doesn't stop it.** A pot that lands from a throw breaks. Marked, its pieces fly home along its trace
reversed from where it broke (4 frames a tile, starting after 10 frames), striking whatever is at each tile at head
height: crystals, charms (hung clay bells), creatures and bosses (1 damage, counted as a "shard" hit, which gets past
armour), anything with a strike rule; then it is whole on its mark (waiting if the mark is covered). An unmarked pot just
breaks. Some pots drop a pickup when they break. Clay creatures' pieces can hurt Wren.

**Strays stay put.** Unmarked things (pale green blocks and crates) never return. A stray pushed or thrown into a pit
fills it for good (the tile becomes floor; area flag `fill:x,y`; a stray stone in deep water fills it too); a stray that
filled a hole is gone for good (`gone:<key>`).

**Across rooms and areas.** A House is one area: things left away in one room go on returning (along traces that can
run through doorways) while Wren is in another room of the same House. Leaving an area (any door to another map)
drops what's carried, and the area is built afresh next time: everything in it back home, except what area flags record
(see 7.4). A carried thing records Wren's steps as its trace, so its way home is the way she carried it.

**Wren's own mark and trace.**
- Wren has a mark too, and a trace (loop-erased like any thing's; at most 600 tiles kept).
- In a House her mark is the doorway she came into the current room by: set on entering the room, moved one step into
  the room so it's never on a door tile, and never on deep water, a pit, fog, a solid tile or a float. Outdoors it is
  where she arrived in the area, reset each time she crosses into a new region.
- A bed she lies down in (Act on a bed: "This bed is your mark now.") or the Bedroll laid (4.5) overrides that and stays
  her mark while she's in that area (rooms don't move it). The doorway mark is remembered underneath it: rolling the
  Bedroll up returns her mark to the doorway of the room she came in by (her thread is shown straight to it a moment).
- **Falls** (most of her feet over a pit) and **sinks**: a 26-frame fall, then half a heart lost (none if the mark is a
  bed or the Bedroll in this area, none for a doze), then she flies home along her trace, her red thread drawn, to her
  mark (or the nearest open tile within 5 of it). Quick within one room; through several rooms it takes a moment in each
  (up to about 2 s a room). On landing: 40 frames of grace. Hearts at zero: she faints instead (below).
- **Dozing** (Hushwood's sleep puffs): the same flight home, no damage.
- **The fog** at the valley's edge (before her thread is cut): 40 frames standing in fog and she is flown home along
  her trace, with a line (three different, then the notice "The fog turns you round again."). Counted (`fogTries`).
- **Fainting** (hearts at 0): what's carried drops (and goes home); fade; full hearts. In a House with an entrance she
  comes to at the House's door (its entry tile), not the room she fell in: the first time with a line ("You come to by
  the door of the House..."), after that a notice. Anywhere else she wakes in her bed at Gran's (the room `gran_room`),
  three different lines, then the notice "Your own bed again." The House is rebuilt from its flags: every thing home,
  every creature back, and a boss room as it starts (how much of a fight is kept is per boss: each House's section).
- **After her own thread is cut** (`cut_self`, the endgame): no hearts are shown and hurts change nothing (she can't
  faint); falls are climbed out of on the side she went in from, unless the Bedroll lies in that area, in which case the
  fall flies her to the Bedroll (no damage); the fog no longer turns her round (it leads to the Drift).

**Creatures keep the law.** Each creature has a nest (its mark) and walks home along its own trail, drawn as a faint
dotted thread (not for the big ones). Knocked or lured away, it goes back; beaten, it unravels into a yarn ball that rolls
home along its trail and is a creature again the next time the place is built.

### 3. Things (src/08_things.js and the kits)

- **Blocks**: stone, marble and clay are heavy; wood is medium and floats; a stray block is pale green and unmarked.
- **Pots** (light, liftable, break when thrown) and **crates** (light, liftable, float); stray crates are pale.
- **Busts and statues**: heavy. **Barrels, rafts, logs, lily pads**: floats (see the Paddle).
- **Pressure plates**: a brass pad that sinks when weighed. Wren counts as medium; creatures by their weight; carried or
  flying things don't weigh. Kinds: hold (on while weighed), toggle (each press flips it; a lamp in the pad shows on or
  off), timed (stays on a while after it's left, `time`, default 300 frames: a ring of brass stitches round it unpicks as
  it runs down), pulse (runs down from the moment it clicks, whatever sits on it). Per plate: a minimum weight (iron
  plates: heavy things only), "settled" (feels only a thing at rest on it, not one passing or setting off), or puppets
  only. A thing already on a plate when the room is built gives no click.
- **Crystal switches**: struck by the stick, a thrown thing or flying pieces they flip (blue/pink); 20 frames between
  flips.
- **Doors**: a gate opens on its signal (a plate, crystal, charm, wheel...) and shuts when the signal stops, but never
  on someone standing in it; a gate marked to stay (`passed`) stays open for good once Wren has gone through it the
  marked way (area flag `door:<id>`); a gate held open by something that runs down shows the brass stitch ring round the
  doorway. A locked door takes one small key of its House. The big door takes the House's Pattern (its master key). A
  shutter opens when a room is cleared.
- **Chests**: fixed. Act opens (area flag `chest:<id>`), Wren holds up what's found. A hidden chest appears on its
  signal, but only once its tile is clear of Wren, things and creatures.
- **Small keys**: counted per House (`Inv.keyCount`); the HUD shows the count in a House that has keys or locks. They
  are kept when Wren leaves the House: at the door the key "tugs back towards the House" (a notice; the journal note
  "Keys", flag `s08`) and works only in its own House.
- **The Pattern and the Plan**: each House's big key and its map (the map tab then shows the whole House, faint where
  unseen).
- **Signs**: Act reads. Signs describe how things work, never the step (a polish decision).
- **Pickups**: heart (+1 heart), buttons (1, 5, 20), small keys, Heart Patches. Placed ones are remembered once taken
  (`got:<id>`); ones dropped by creatures or pots vanish after 8 or 10 s (blinking for the last second). Gathered by
  walking over them; the Hookline fetches them.
- **Hearts**: Wren starts with 3. +1 for each boss's Heartstitch, +1 for every 4 Heart Patches (the optional-content
  chapter lists every patch). Shown in half hearts, up to 10 a row. Expected count at any point = 3 + Heartstitches
  taken + patches / 4. (The catalogue's main saves hold exactly that: the run that made them took each beaten boss's
  Heartstitch and no Heart Patches, so S01-S58 have 3 + bosses beaten, 11 at the end; it took no damage, so their
  hearts are full.)
- **Buttons**: money (shops, favours).
- **Sleepers**: things "tied off where they lie": they can't be pushed, gripped, lifted, hooked or stitched (each says it
  is asleep). A ring of a bell in reach wakes them and they go home. Woken once, they stay awake for good (`woke:<id>`),
  except puzzle sleepers (`resetSleep`), which lie down again when the room is built.
- **Warps** (doors and stairs to another map) fire only after Wren has stepped off them once (arriving on one never
  sends her straight back).
- **The Knot and the Hoop**: after a House's boss, its Hoop. Tying the Knot: a scene, the Knot added (`<house>_knot`,
  `d1`..`d8`), a wordless shot of the Well's winch turning a notch, then an autosave. If Wren leaves after the boss
  without tying it, the Hoop and the boss's Heartstitch are there whenever the House is built again (`HOUSE_AFTER`).

### 4. The tools, in order (src/18_tools.js and each House's kit)

Each tool is found in its House, around the middle. Later rooms combine it with the House's own idea and with earlier
tools; the per-House sections list each room's combination.

**4.1 Gloves** (House 1, the Tidyhouse). Through Act, not the tool button. Hold Act against a thing on the grid: Wren
grips it (a click). Held, it waits (no return). Step straight back: it follows one tile (18 frames); push into it: it
moves on. Let go (release Act; or, with Options > Grip: toggle, a second tap) and its patience restarts. Can't grip
fixed things or sleepers. A hurt, a fall or the thing moving away lets go. With Grip on toggle, two little glove marks
show on what's held, so a tool can be used with no button held.

**4.2 Hookline** (House 2, the Kiln). Throws a hook straight ahead about 7 tiles (10 with the Long Hook from the
Unfinished House). On an eyelet, a fixed hookable thing or anything heavy: reels Wren to the tile in front of it. On an
empty mark (where something belongs but isn't): reels Wren onto the mark. On a light or medium thing: pulls it toward
Wren up to 8 tiles (displacing it: its trace starts there). Fetches pickups. Bounces off walls (not low walls), shut
gates, sleepers ("z"), puppets ("only strings move a puppet") and chests; stuns creatures briefly. Wren can't walk while
it's out. Reeling, Wren is in the air: pits and water under the line don't matter. Leans on: empty marks emptied by
the Return (a thing displaced leaves a mark to hook), eyelets over gaps.

**4.3 Paddle** (House 3, the Millrace). With it, Wren can stand on anything floating (without it, only rafts). Hold the
tool and an arrow: the float moves one tile (18 frames; 32 against the current, 12 with it). Paddling counts as holding:
the float doesn't drift or go home; let go and its patience restarts. Pressed on the bank facing a float, it nudges the
float a tile. Floats drift with currents a tile at a time (a float at its own mark bobs a while first); a returning float
beats the current; a drifting float's trace grows the long way round, so it comes home the long way, slower upstream.
Waterwheels turn while something floats past or sits on their water.

**4.4 Recall Bell** (House 4, the Belfry). Ring (40 frames between rings): every displaced marked thing within 7 tiles of
Wren, in the room her feet are in (walls stop it), snaps home at once: 3 frames a tile, force +1 (so a medium thing
shoves like a heavy one, Wren included). The reach is drawn as a ring for half a second. Wakes sleepers in reach. Rung
while flying home after a fall, Wren herself snaps home at once (secret S18). Bells and bell-stones in the world, struck
with the stick or a throw, ring the same way.

**4.5 Bedroll** (House 5, the Slumberhouse). Tap the tool: lay it on the tile Wren stands on (flat, dry ground; not on
a warp; some places refuse: "It won't lie flat here."); it is now her mark in that area, one Bedroll at a time. Tap
again within a tile of it: roll it up (mark back to the room's doorway). Hold the tool 20 frames (a ring of stitches fills
over her head): Homeward, a flight back along her trace to the Bedroll, over anything she crossed even if it's gone
since (straight to it if a bed had been her mark meanwhile). From another area: up and away, and down at the Bedroll
(what's carried is pulled from her hands and goes home). Refused between the Underside's two layers ("The floor is in
the way") and where an area forbids it. Falls home onto her own Bedroll or bed don't hurt, so falls become travel. Laid
on a float, it goes where the float goes; if the float sinks or a board gives way under it, it turns up rolled in her pack.
Snorelings count it as a bed. The Bedroll stays where it was last laid, across areas and acts (in the catalogue it lies
in the Marionette Hall from S31 to S56, then on the Great Spool's Night Ferry raft).

**4.6 Crossbar** (House 6, the Marionette Hall). Press the tool at a puppet in sight (within 8 tiles; indoors in the same
room with a clear line, little holes in walls allowed; outdoors any line) to take its strings. Wren stands still; the
arrows walk the puppet a tile at a time (12 frames). Press the tool or Act again to let go: the puppet walks home along
its trace. A rack holds several puppets' strings: taken, they all step together, each that can. Puppets weigh as a
person (they press plates), fit through little holes, don't mind spikes, won't step into a pit or deep water, nudge
light things aside, can't be pushed by Wren, and can't be cut or hooked.

**4.7 Needle** (House 7, the Spoolworks). Face a thing (the first thing up to 4 tiles ahead in a straight line, before a
wall) or, from underneath, its cord, and press the tool. The arrows walk the needle up to 4 tiles (every reachable tile
is outlined, the steps left are counted); the tool again: that tile is its place now (it goes there at once and stays;
its thread turns Wren's red). Act or the stick cancels. Three stitches at a time: a fourth undoes the oldest (that thing
gets its old place back, and a notice says which). A stitched thing offers "Stitch it somewhere new / Unpick it / Leave
it". A stray can be given a place. Refused: fixed things, sleepers, people, carried things, things tied off below ("Undo
the knot first"), things too far ("Too far off"), things in motion ("Wait till it's still"). Stitches are saved and
reapplied whenever the place is built.

**4.8 Shears** (House 8, the Loom). Face a thing with a thread (or its cord from underneath, or any tile of a thread
drawn taut, i.e. one whose thing is returning or about to) and press the tool: snip, it's a stray for good, wherever it
stands (remembered per place: `cut:<key>` = its tile, kept across loads; filling a pit afterwards, `gone:<key>`). A
slack thread "only slides off the blades". Silk warp threads: a wall falls, a bridge drops. People: "Cut <name>'s
thread? (There's no tying it again.)" Snip / Not yet (flag `cut:<who>`; they get a little round and new lines). Refused:
Gran, Linnet, puppets' strings, a Knot, anything in a Making ("Not in a Making"), and every thread in the Great Spool but
its six great threads when slack. With the Shears in hand (from the Loom on), anything a snip would cut right now
glints. At the fog with nothing in front: the offer to cut Wren's own thread (endgame section).

Combinations later puzzles lean on (examples; rooms are listed in each House's section): the Gloves and the Bell together
(grip one thing, ring the rest home: the Great Spool's Airing Cupboard); the Hookline on a mark the Return has emptied
(Belfry Heights' crags, Heron Rock, the Gale Loft); the Paddle and the Bedroll (send the Bedroll somewhere on a float,
then Homeward: the old mill pond, the Night Ferry); the Crossbar and flying pieces (a puppet as the thing pieces break
against: the Glazing Gallery); the Crossbar and the Bell (a puppet snapped hard enough to shove a medium thing: the Prompt
Box); the Needle and anything that "always goes back" (give it a new home: counterweights, the north gate, Madame Rook's
wheel, the Drift's mill); the Shears and the Pull (the Spool's top).

### 5. Combat

- **Hurt**: damage is in half hearts. Most creatures do half a heart on contact. On a hurt: a white/red flash, knockback,
  70 frames invulnerable (blinking), a small hit-stop and shake; a grip is let go.
- **Creatures** (src/20_enemies.js) wander near their nests on a leash, chase within reach, and keep the Return (above).
  Each has a set HP (1 for a Nibbler, 2 for a dust bunny...). Some are armoured: the stick bounces off; only flying
  pieces or a thing on the grid hurts them. A creature that walks into a pit or deep water (one that doesn't fly or swim)
  unravels. A creature beaten drops something about a third of the time (heart, 1 or 5 buttons). **Every creature
  holds still while a line is on screen or a scene runs**: nobody is bitten while reading (tests/hold_still.test.mjs).
- **Bosses** (each House's section has the details): three beats each; the first applies the House's lesson, the second
  changes the arena or the rule, the third wants something learnt earlier. Between and during beats each boss has two to
  four blows, each told first (a pose, a flash, a two-note warning, red stitches on the floor where it will land: a lane,
  a row, a ring, a shadow), 40 frames of warning in House 1 down to 20 in House 8. A blow lands only on Wren's own tiles,
  so stepping out of the marked place always avoids it. Damage climbs from half a heart to one heart early, a heart in
  Houses 3-6, a heart and a half in 7-8 (two for the Weaver's drop). From House 4 a downed boss needs 2 knocks (Houses
  4-6) or 3 (7-8) to topple. A heart drops each time a boss is knocked into its next beat. Mini-bosses fall in two hits.
  Things a boss flings obey the Return (they lie on their thread, shiver, and fly home along it, hitting what's in the way).
- **No quick retry** (David's decision, kept over a reviewer's doubt; POLISH.md): fainting in a boss fight works as
  anywhere in a House: Wren comes to at the House's door and walks back. This is intended; don't report it as a defect.
  Judge fairness by whether each blow is told and avoidable, not by how many tries it takes: some fights are meant to
  take a few tries (David asked for real challenge in the bosses).

### 6. The screen

**HUD** (hidden during scenes):
- Top left: a little red spool (Wren's thread; it spins during a flight home) and the hearts, on a soft dark backing.
  After her thread is cut (`cut_self`), the spool and the hearts come undone and drift away while she's told so, and are
  never shown again: from S51 on, and after the ending, there are no hearts on screen. Intended, not a defect.
- Top right: the buttons; the tool in hand in a box with its key under it; in a House with keys or locks, the key count
  (and the Pattern's icon once owned). With the Needle, its three stitch slots.
- Each corner fades when Wren or anything that matters (a thing, a chest, a creature) is under it.

**Notices** (toasts): two at most at a time, the rest wait their turn; each goes top or bottom, wherever it hides least
of Wren, of what it is about, and of bosses and creatures; they wait while a scene's words are up. A refusal that comes
up again and again is said in full the first few times, then shortened (e.g. "Locked.").

**The place's name** (banner) shows coming into a place from outside it (not coming back out into it from a door inside
it); outdoors, region by region (not again for 90 s when re-crossing the same border); it waits rather than sit on Wren,
and never shows over a black screen.

**The dialogue box**: stitched panel, top or bottom of the screen, whichever hides least (Wren may be hidden at most 15%,
her feet). In a scene the camera may lean up to 48 px so Wren and the line's subject both clear the box. Lines are paged
three at a time, broken at sentence ends where possible. The speaker's name tag is in their thread colour, at their end of
the box; main characters have a portrait with expressions; a choice list sits in or beside the box. Act advances. Words
floating in the world (a creature's "!", "z z z", a child's "Ooh!") keep clear of panels.

**The pause menu** (Menu; tabs turned with Tool before/after, or left/right outside the Satchel):
- **Satchel**: the tools row (8 slots in order, "?" for those not found; Act puts the picked one in hand; a red pip marks
  the one in hand); the Knots tied (top right); things (12 a row, 2 rows shown, scrolling, with an arrow when there are
  more), the picked thing's name and description; the foot: Hearts, Heart Patches n/4, Buttons (after the self-cut "No
  hearts: nothing to unravel").
- **Map**: the area Wren is in. The valley is drawn whole from the start (faint where not yet visited: the Makers drew
  it), region names once visited, each House's door in its Maker's colour once seen (a gold dot once its Knot is tied),
  the Well, and a red flag where the goal line points (the first place it names). A House shows only the 4x4-tile blocks
  Wren has walked, unless she has its Plan (then all of it, faint where unseen). The Drift is blank until walked ("you draw
  it as you go"). What counts as seen is every 4x4 block Wren has stood in. In the catalogue's route saves the map can
  show stretches as unexplored that a player would have walked (the script that made them hops between places to save
  time): not a defect of the map.
- **Journal**: "Now", the goal line (up to four lines); "Also in town:" new things to do in town until each is done; the
  notes found (pick one to read it, paged); time played.
- **Options** (also on the title): Music 0-10 and Sound 0-10 (defaults 6 and 8); Text speed (slow, normal, fast);
  Screen shake on/off; Hints (renamed "Makers' nudges" after the first reveal): off, "ask first" (the default until a
  House has asked), on; Screen filter (off, soft, strong); Grip (hold or toggle); Controls. Settings belong to the browser
  (`hollowell-settings`), not to a save; whether the House has asked about hints is per save (`hintsAsked`).
- **Save**: see 7.

**The goal line** (`Progress.goal`) always says where next; it's read in the Journal and pinned on the map.

**Hints: the Makers' nudges** (opt-in; src/41_house_kit.js `Nudges`). Only in Houses. The first time a nudge would
fire, a voice behind the walls asks if the House should give nudges (before the first reveal unnamed, talking the way that
House's Maker talks; after it, "one of the Makers"). Yes: on, and this nudge fires. No: hints off (Options can turn them
on). A room's nudge comes after a set time spent in it unsolved (3 minutes by default; the Great Spool's rooms 100-150 s),
once per room (`nudged:<room>`): a sparkle at a spot or a thing and a short notice. In a boss room, one nudge for each beat
that needs an idea, after 2.5 minutes in that beat. No nudges at all in the Loom (House 8, by design: "nobody helps"), the
Stray House, the Unfinished House and the ninth Little House. Every nudge is counted for the Makers' logbooks.

**Sit and wait** (pause menu > Save, in a House): the game runs four times as fast until everything out of its place in
the room is home (a minute of game time at most). Offered only with nothing dangerous awake in the room, nothing out of
place that would never come home by itself (tied off, asleep, held), and Wren standing (not carrying, not riding).

### 7. Saving and loading (src/17_save.js and the hooks named below)

**7.1 Where.** Three slots in the browser's storage (`hollowell-slot-1` to `-3`), plus the settings. If the browser won't
store anything (a private window), the game keeps a copy in memory only: saves are lost when the page closes.

**7.2 When the game saves by itself** (the slot last chosen on the title):
- every time Wren goes through a door between maps (`World.enter`: entering or leaving a House, a building, the
  Underside, the Drift; not moving between rooms of one House), except scripted moves that say not to;
- after tying a Knot; at points in the prologue; after each Making and the ninth; after the second reveal; after the
  Tangle and the Weaver; on meeting Linnet; in the Great Spool after each Knot untied, each change Gran makes at the top and
  each great thread cut; after the credits; in the two optional Houses at their ends;
- when the page is closed or reloaded while playing (`beforeunload`).
- The menu: "Save here"; "Save and go to the title". The Save tab says "Your Wander is also kept whenever you go through a
  door."

**7.3 What a save holds**: the name; the satchel (hearts, max hearts, buttons, tools and the one in hand, keys per House,
Patterns, Plans, Knots, patches, things, where the Bedroll lies, the Needle's stitches); every story flag and every
per-place flag; the notes and the goal line; the counters the logbooks and the ending read; play time; tiles seen (the
map); Wren's area, position, facing and mark. It does not hold where loose things, creatures or bosses were.

**7.4 What a load rebuilds and what resets.** The area is built afresh: every marked thing at home, every creature in
its nest. What persists is what flags record: doors and gates that stay (`door:<id>`), chests opened, pickups taken, pits
filled by strays (`fill:x,y`), sleepers woken for good (`woke:<id>`), levers, charms that stay lit, things cut free
(`cut:<key>` = the tile they were left on: they come back there, unless something else stands on that tile when the place
is built, in which case they stay on their own home tile; e.g. after the ending a townsperson can stand where a freed thing
was dragged in the Pull), the Needle's stitches, the Knots untied and great threads cut in the Great Spool.
- A gate that was held open by a pushed thing (a block on a plate) is shut after a load, because the thing is home again;
  a gate with `passed` stays open once Wren has been through it. So loading in a room entered through a held gate can leave
  that gate shut behind her: the way out is the room's own puzzle, another exit, or the pause menu's "Back to the
  House's door", which every House has (`PauseMenu.backToDoor`; in a Making, "Out to the Making Floor").

**7.5 Where a load starts.**
- Outdoors and in buildings: exactly where it was saved.
- In a House: at Wren's mark, i.e. the doorway she came into that room by, nudged out of anything standing there. If her
  mark was a bed she lay down in, at the bed. If the Bedroll lay in that House as her mark, beside the Bedroll, which may
  be another room (the catalogue says so: S26, S27, S31, S32, S57). A Bedroll laid on a float goes back with the float to
  the float's home when the place is rebuilt: the load starts on the float there, not where it was when saved
  (src/58_bedroll_kit.js). The Great Spool's Night Ferry: a save in the bedroom west of the channel (where only the ferry
  reaches) starts east of the channel by the lever (src/75_greatspool.js).
- Saves made in the Great Spool as it was first built (an older map) start again at the Foot of the Well, the Knots they
  had untied still untied, everything else down there back in place; a load adds the version flag `gs2` to any save that
  lacks it, harmless for saves from before the last House (`Save.migrate` in src/75_greatspool.js).
- Older save shapes are upgraded by `Save.migrate` (missing fields filled in; Gran's tune note added to the Journal).

**7.6 Save codes.** `HW1:` followed by base64 of the save's JSON. The menu's save is a slot; the playable page's "Save
code" box shows the game's place at that moment as a code (mid-game it's taken live, not from the slot), with Copy, and a
second box to paste a code and "Load this code". A loaded code is played in the current slot and written to it at the next
save, which is usually the next door: so loading a code and walking through a door overwrites that slot. A code the game
can't read says "That isn't a save code this game can read."

**7.7 What to expect saving mid-something.**
- Mid-puzzle in a House: the load starts at the room's doorway (or Bedroll/bed) with every thing home; anything held open
  by a thing is shut again; stitches, cuts, fills and passed gates are kept.
- Mid-fight: the boss room is rebuilt; what's kept depends on the boss's own flags (each House's section; at the Spool's
  top, threads cut and Gran's stage are kept, see the endgame section).
- Mid-scene: the menu can't be opened during a scene, so only the page-close autosave can land mid-scene. The load
  starts from the flags set so far; worth probing (close the tab during a long scene and reload).

### 8. Sound, music and performance

- A small chiptune synthesizer (two pulse voices, a triangle, noise) through WebAudio; silent until the first key press or
  click (browsers require it). Every place has its own tune (each House a tune and a fight tune; the town, the Underside,
  the Drift, the Pull, the Great Spool; Gran's lullaby); a change of music crossfades briefly. Loops are long (58 to 82 s
  in the Houses). The mix (src/40e_mix.js) puts every tune at about the same loudness, a few deliberately quieter (the
  lullaby, the Slumberhouse, Hushwood, the Loom, the Unfinished House); effects sit over or under the tune by what they
  mean (a find or a Knot over, menus and talk blips under). A tune or effect that's much louder than the rest, a clip, or
  music restarting at every door is worth reporting.
- 60 steps a second, fixed. The game paces steps to the screen's refreshes (`Pace` in src/90_main.js): at 60 Hz exactly one
  step per refresh, at 120 Hz one every other refresh; a long pause (tab hidden) costs one step, not a burst. Entering a
  place for the first time paints its tiles behind the fade (12-22 ms once). Accepted: the Great Pull scene (dozens of
  threads) dropped to 45-50 frames a second in a software-rendered test browser; nothing is playable during it.
- Visible stutter while walking, a hitch on entering a room, or any frame-time spike in normal play is worth reporting with
  the place and the browser.

### 9. Debug tools (for reference only)

- `play.html?debug` enables F1, a panel with: Warp (any area, to its entry), Presets (`afterD1` ... `afterD8`,
  `afterMakings`, `afterReveal2`, `afterDrift`, `afterEnding`), All tools, Heal +10 hearts, God mode, Noclip, +100 buttons,
  Give keys (this House), Give Pattern + plan, Show tile grid. `?debug&notitle` skips the title into a new game.
  `window.HW` is the test API (`newGame`, `warp`, `preset`, `give`, `step`, `press`, `hold`, `walkTo`, `push`, `skipTalk`,
  `find`, `ents`, `player`, `Progress`, `Inv`, `Save`, `global(name)`).
- Noclip doesn't change collision (only the developers' probe reads it): it isn't a way through walls.
- **A state reached with these is not a legitimate state.** Warps skip the story's setup; presets set flags directly and
  skip the play before them (so the counts read at the Hall of Names, at the Spool's top and after the ending are said
  without numbers, by design, for a save that didn't keep them). Anything found only after using them must be re-checked
  from a catalogue save or real play before it's reported.
