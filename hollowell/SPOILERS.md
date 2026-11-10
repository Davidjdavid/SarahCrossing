# HOLLOWELL: Spoilers

> Every reveal, every secret's solution, the ending. Never quote any of this in updates to David.

## 1. The truth, in layers

### Layer 0 (what the player is told)
The valley (the Hollow) was tied down long ago by the First Spinner so nothing would ever be lost again.
Everything has its place and returns to it. Lately the Return is "getting weak": strays turn up. Each
generation a child goes on the Wander through the Houses ("old places from the First Spinner's time") to
tie Knots that keep the valley's marks strong. This year it's Wren.

### Layer 1: the Houses are made (Reveal 1, end of D6)
The Houses are built, rebuilt and *run live* for each Wanderer by the town's **Makers**, as a gift: Mother
Ives (Tidyhouse), Bram (Kiln), Dad/Ambrose (Millrace), Mum/Tess (Belfry), Dr Mallow (Slumberhouse), Jory
(Marionette Hall). They watch from the **Underside** through peepholes, reset puzzles behind you, nudge you
when you're stuck (the "Hints" option), work the bosses (costumes, automata, puppets). The Return is not
nature: every mark is a little brass grommet with a thread running down into the Underside, wound on a
spool with a counterweight; the Makers keep it all running. The Makers did this for every Wanderer; it's
the town's oldest tradition and its best secret. The Wanderer's last trial is to *make*.

### Layer 2: the Return holds people (Reveal 2, Act III)
In the Hall of Names deep in the Underside, there is a spool for every person in the valley: townsfolk are
marked too, which is why they stand on the same spot all day and why Wren is pulled back after falls and
faints. All the threads run to the **Great Spool** under the Well, held by Gran Hesper, the **Spinner**.
Hesper's daughter **Linnet** (Wren's aunt) was the Wanderer 25 years ago; on her Wander she found the
Hall of Names, cut her own thread with the First Spinner's Shears and walked into the fog. She never came
back. Since then Hesper has tightened the Return, year by year: the townsfolk used to walk about (Old Arlo
remembers), now they don't. The **Knots** of the Wander were Hesper's addition: each one tightens her hold.
Hesper's ledger: "Tightened again. They mustn't leave. Wren mustn't." Her plan: after the six Knots, Wren
ties the seventh at the Well (the "Wanderer's Knot", the empty pedestal in the Inn) and becomes the next
Spinner, bound below, so the valley never loses anyone again. When Wren confronts her, she simply pulls:
Wren is yanked home to bed.

### Layer 3: the fog is threads; beyond is just the world (Act IV)
The fog at the valley's edge is the Return's tension made visible: millions of fine threads pulled taut at
the limit of their reach. Beyond it, the **Drift**, is no wasteland: it is the wider world, where nothing
returns because nothing is tied. Linnet lives there in a cottage with a garden, happy, and for years has
been cutting stray threads at the edge from outside, trying to loosen the valley (the strays that turned up
near the edge, each with a scratched "L"). She never came back because she was afraid her mother would tie
her again. The cat Biscuit was hers; it crossed back of its own accord years ago and lives in Hollowell as
the only free creature: proof that a thing can come back by choice.

### The ending
Wren comes back from the Drift on foot (cut, Wren can't be pulled anywhere). Hesper, feeling Wren's thread
gone, panics and pulls everything: the **Great Pull** (the valley's marked things fly toward the Well;
townsfolk are dragged along). Wren goes down the Well into the Great Spool and unties the six Knots (each
with its own House's grammar plus everything since) and climbs to Hesper. Linnet comes down after Wren
("Mum."). Wren holds out a hand; Hesper lets go of the Spool. The Unwinding: every thread goes slack. Then
silence, then birds flying *away* for the first time, then townsfolk walking wherever they like. The
Makers keep their Houses' threads by choice, for play. The fog thins to an open road. Hesper and Linnet
in the garden. Credits: "Made by the Makers of Hollowell", then "Wanderer: <name>". The title screen
changes: no fog, people walking, "Carry on".

With the bracelet from Linnet's Trail (secret chain), the ending adds Linnet giving Hesper the bracelet and Hesper
putting it on (the post-game bridge over the Drift is still to build with O1). With Tuck's drawing (S30) it's on
Gran's dresser. Either way, a week later somebody re-carves the Well's motto: "EVERYTHING IN ITS PLACE, AND EVERYONE IN
THEIRS. WHEREVER THAT IS." (S35 reads it in each act.)

As built (`src/74_drift.js`, `75_greatspool.js`, `76_ending.js`): the Shears at the fog ask to cut Wren's own thread
(hearts come undone: nothing left to unravel; falls are climbed out of where they happen). Into the fog, out in the
Drift (map blank until walked). Linnet in her garden tells her story; Hesper feels it and the Great Pull begins
(townsfolk in town are dragged in an arc round the Well, threads streaming into it; the Well's cap is off). Down the
Well: the Great Spool (DUNGEON_TRACKER.md: the Foot, six Knot rooms round the Winding Room, the Climb and the top; under
the Pull, whatever is off its place is wound north into the turning drum, a tile at a time, and dropped back on its
place once that's clear (the Return's other rules still hold on the way: held things wait, heavier shoves lighter,
plates pressed in passing); the Shears and Needle are refused down there (too taut); the Bedroll is the one place
that stays put; each Knot room is its House's grammar with another House's tool, several steps and an aha, a ratchet
by its door to lay it back; the Climb sends a hit back to the start of its lane only). At the top Hesper pulls everything else (junk flies at the Spool); the six great threads are
too taut to cut until something the Pull is dragging is dragged along one (Wren lays a crate under a thread near its post;
the thread sags a moment); with Linnet's bracelet, shown to Hesper, she lets three go herself; six
great threads cut; Linnet comes down ("Mum."); a choice of words (Let go / Come home), the same result; the Unwinding
(the birds fly away and come back, people walk where they like, the Makers keep their Houses by choice, the fog thins
to a road; Gran and Linnet in the garden; the Drift-bloom by the gate if S11's seed was planted); credits (the Makers,
the Loom and the First Spinner, "Wanderer: <name>", Linnet, Hesper, Biscuit); then the free valley: everyone on a
round of their own with new lines (`AFTER_LINES`), Gran and Linnet by Gran's house, the goal "The valley is yours.
Carry on." The title (localStorage `hollowell-ended`): no mist, a road out over the hills with people walking it,
birds, "a Wander (and after)", Continue becomes "Carry on". The Loom itself is opened by the Guild's key, which Gundry
gives after Reveal 2.

## 2. The convention ledger (what each convention really was)

| Convention | First seen as | Truth |
|---|---|---|
| Puzzle rooms reset | Physics quirk of the Return | Makers below reel everything back; nudges reset it |
| Pots/grass/things come back | The Return | Threads into grommets, spools, counterweights |
| Enemies respawn | The Return (yarn re-forms) | Makers re-wind them; cut, they stop |
| Townsfolk stand on one spot, say the same thing | Normal NPCs | They're tied, short; Hesper tightened it |
| Respawn at the room's door after a fall | Normal | Wren's own thread; the doorway is a mark the Makers set |
| Fainting → wake in bed | Normal "game over" | Hesper's thread pulls Wren home |
| Invisible wall at the world's edge (fog pushes back) | Normal | The Return's limit; the fog is threads |
| Dungeon keys can't leave the dungeon | Normal | Keys are marked to their House |
| A map showing places you haven't been | Normal | The Makers drew the map (the Drift's is blank) |
| Hint system (Options: Hints) | Normal | The Makers' nudges (logged in their logbooks) |
| Big locked doors with the dungeon's key | Normal | Makers' "Patterns" |
| Boss defeated stays defeated | Normal | Makers cut its thread after (costume/automaton) |
| Save points | "Tie off here?" | Re-tying your thread at a mark |
| Hearts | Health | Thread strength; they unravel when Wren is cut |

## 3. Hub timeline (flags → changes)

| After | Changes in Hollowell |
|---|---|
| Start | Ceremony. Kids play tag (they move). Fisher Hob walks the bank. Pudding the dog chases a ball. Biscuit wanders. |
| D1 | Inn attic open: Tidiness Trials. Kids' pretend Tidyhouse in the playground (micro-puzzle). Mother Ives slips ("mind the second step in the linen closet"). Knot chime: threads flash toward the Well. |
| D2 | Kids stop playing tag ("don't feel like running"). Tailor's back room shows the Kilnwyrm costume through the window. Thimble sells the Hook pouch. |
| D3 | Dad comes to town, damp. Fisher Hob only stands now. |
| D4 | **Knotting Festival**: bunting, music, dance in place, Returnball. Mum in town. Pudding stops chasing. |
| D5 | Tuck asks about Wanders. Gran tired. Constable Burr moves his posts in ("the fog's closer"). |
| D6 (Reveal 1) | Makers come clean; workshop doors open; the Inn's Staff door → the Underside; Options "Hints" becomes "Makers' nudges"; Jory's shop opens. |
| D7 | Wren's apprentice room in the Guild Hall; peepholes; Tuck's Little Wander announced. |
| Reveal 2 | Gran shuts herself in the well cellar; townsfolk's threads now drawn (Wren can see them); unease. |
| D8 (Shears) | Cutting townsfolk frees them one by one: schedules, new lines, new activities (Arlo's walk to the lake, Hob in a boat, tag again, a market). |
| Ending | The Unwinding festival; the road out is open; Linnet visits; Tuck's Wander posters. |

## 4. Secrets and optional discoveries (with solutions)

Numbering is stable; DUNGEON_TRACKER.md and tests refer to these ids.

1. **S01 Tugging the town**: push any townsperson for a second: they slide off their spot showing a thread
   and shuffle back with a unique line. Push all of them (24): Old Arlo: "You've felt everyone's thread.
   Ever felt your own?" + the Frayed Ribbon (cosmetic scarf). *Unusual interaction / NPC.*
2. **S02 The turned portrait** (Gran's study): pull it with the Gloves and grip it: Linnet's face. Talk to
   Gran meanwhile for her line. Starts Linnet's Trail (note 1 is behind the frame). *Hub / chain start.*
3. **S03 Biscuit's route**: follow the cat; one of its stops is a gap under the bakery's back step (hub 105,67);
   interact there while Biscuit sits by it: it fetches out a Heart Patch. *Hub / environmental.*
4. **S04 Staff Only** (D1): the door in the Tidyhouse's pantry; hold the returning cupboard with a block on
   its trace, slip through: Mother Ives below, "Nothing to see! Shoo!" (door slams; Underside glimpse).
5. **S05 The warm pie** (D1 kitchen): heals all; note "for my favourite Wanderer, don't tell".
6. **S06 Maker signature rooms** (one per House D1–D6): each hidden behind a mechanic used cleverly; each
   holds the Maker's monogram stitch. All six: Guild pin (opens O2 early in Act III, Maker lore).
7. **S07 Kiln costume** (hub, after D2): look in the tailor's back window.
8. **S08 Keys go home**: carry a small key out of a House: at the door it flies back in. Gives a journal note.
9. **S09 Bell at the Well**: ring the Recall Bell at the Well: the Spool groans below, Gran: "Don't do that, love."
10. **S10 Hook the Well**: hook the great X on the Well's cap: Wren is reeled, the cap rattles, a glimpse of threads.
11. **S11 Bedroll in the fog**: lay the Bedroll at the fog, walk in until pulled, Homeward: Wren comes back
    holding a Drift-bloom seed (plant it in Gran's garden; blooms in the epilogue).
12. **S12 Kids' Housekeeper** (after D1): the kids re-enact the Tidyhouse boss in the square; Otto tidies any crate moved, coming at it from his side; push one straight away from him and step aside, and his own yank bowls him over: the Playground badge.
13. **S13 The Wren puppet** (D6): walk it through the stage set of the Tidyhouse foyer.
14. **S14 Bosses come back** (after each boss, revisit its arena): the boss re-formed, asleep; pet it (all seven: a Heart Patch).
15. **S15 Echo room** (D4): ring bell-stones in the order of Gran's lullaby (hummed by Gran at bedtime,
    Linnet's theme): hidden room with a Heart Patch and Linnet's note 4.
16. **S16 The sleeping giant's cave** (Hushwood): after Old Hummock goes home (the Recall Bell), the hollow he slept
    in leads down; only with the Bedroll laid up top (or climb the roots back out, the hard way). Below: a small round
    door painted the colour of the rock, a red X over the keyhole, somebody sawing and humming behind it (the
    Underside); Linnet's note 6 across crumbling boards.
17. **S17 Lucky over the river** (Meadowfold; the Hookline, then the Needle): Pip's lamb is stranded on the far bank; hooked
    over, she only goes home again; given a place on this bank with the Needle (from where she lands), she stays: Pip's Heart Patch.
18. **S18 Bell-and-bedroll**: ring the Bell while flying Homeward: Wren snaps home instantly (speed tech).
19. **S19 Behind the falls** (Millwater): ride a float down the east side of the outlet river (needs the
    Paddle to get onto it): the current turns in behind the falls to a hidden pool with a Heart Patch chest;
    the float takes you back upstream when it goes home. Below the falls, a beach with Linnet's bottle.
20. **S20 Shard sniper** (Kilnridge): carry a pot along the cliff path past the hawk's nest, shatter it
    at the bottom: the shards go back up the path and knock the Heart Patch out of the nest.
21. **S21 The Lost & Found**: not built (it would be a fetch list; Linnet's Trail and the Stray House tell her story).
22. **S22 The logbooks** (Act III): each Maker's workshop logbook reports Wren's real play.
23. **S23 Underside peepholes** (Act III): eight peepholes in the hub's Underside; private moments.
24. **S24 Old Arlo's walk** (Act IV): cut Arlo free; follow him to the lake.
25. **S25 Biscuit's collar** (Act IV, with Linnet's Trail ≥ 6): the tag reads "L.R."; the cat follows Wren
    into the Drift and leads to the cottage's back way.
26. **S26 The Unfinished House** (O2, optional dungeon): Mr Ives's chalk House, sewn real with the Needle (DUNGEON_TRACKER.md "O2"). His walk to his chair at the end; the Long Hook. The Guild pin (S06) opens it before the Loom.
27. **S27 The Stray House** (O1, optional dungeon).
28. **S28 Tidiness Trials** (Inn attic, after D1): three timed rooms (two at once; the long way home; home time: falling flies you home), prize: buttons, a Heart Patch and Ives' teal scarf (every stitch the same size: a quiet clue).
29. **S29 Returnball** (festival and after): carry the ball through the five rings and let it go; each ring it goes back through scores; five in one go: a Heart Patch from Pip.
30. **S30 Tuck's Aha!s** (Act III): get three Ahas in every Making: Tuck's drawing of Wren (Gran's fridge,
    shows in the epilogue).
31. **S31 The far isle** (Millwater lake, with the Long Hook from O2): an eyelet on a tiny island ten tiles off the west shore (THE ISLE OF NOWHERE sign); hook over, a Heart Patch, and an eyelet on the shore for the way back. (Was: the Moth Matron's silk; the Long Hook took its place.)
32. **S32 The gate counterweight** (Act III): from the Underside, re-thread the north gate early.
33. **S33 Fainting on purpose in Act III**: get pulled home by Gran while Wren *knows*: different wake-up scene.
34. **S34 Hints off**: play Act I–II with Hints off: the logbooks say "The Wanderer asked us not to help.
    We respected that. (We were proud.)"
35. **S35 The motto**: read the Well's motto in each act (four texts: before Reveal 1; after it, with Bram's scratched
    note; after Reveal 2, tighter; after the Unwinding, re-carved); all four read: the secret.
37. **Fog-silk hollows** (Act IV, the Shears): three nooks by the southern fog in Meadowfold (cut from the side), Kilnridge
    and Millwater (cut from above), grown shut with the fog's own thread; buttons and a keepsake each.
38. **The Wander quilt** (Wren's room, by the bed): a tally of everything found, by kind, never where (secrets, Linnet's
    notes, Makers' marks, old foes patted, fog-silk hollows, the two optional houses).
39. **Nothing returns, Wren included** (the Stray House): a fall in there leaves her where she fell.
36. **Heart Patches** (16 total) placements are listed in DUNGEON_TRACKER.md "Overworld secrets".
40. **The Old Fold** (Meadowfold): the counting stones count a sheep walking home, not one driven: drive Nettle round the
    fold the opposite way and leave her; she counts herself home yan, tan, tethera: Grandad's tally box, the ringers'
    clapper. Old Tup asleep in the bothy door: the Recall Bell, the bothy's Heart Patch.
41. **The ringers' old bell** (the Heights, 161,32): dumb; hang the clapper (from the Old Fold) and strike it: it wakes the
    cave's boulder long before the Recall Bell (found early, used later).
42. **The Crags** (the Heights): four crossings on the Hookline (an eyelet; the gust empties a crate's mark; a boulder asleep
    elsewhere leaves its mark empty; empty a pot's mark yourself); the Ringers' Stone (carve your initial above H. and L.)
    and a Heart Patch. **The Eyrie**: cut the crate the draught blows into the crevice loose (the Shears): it fills it for
    good: a Heart Patch.
43. **Kilnridge's vents**: the Firing Ground (the crate shoved off the line into the wet clay; a pot fired through a gate held open by Wren on
    the plate: Heart Patch, and
    Bram's first pot, age 9); the sleeping vent (the Recall Bell wakes the boulder off it; a pot fired up the Kiln Mesa's
    chimney: 50 buttons); the clay dam (a pot given its place in the vent's mouth with the Needle breaks it: Heart Patch).
44. **Heron Rock** (Millwater): reel the barrel ashore, set it out of the line, hook its empty mark: a Heart Patch; the
    eel-catcher's post brings you back.

### Linnet's Trail (the major secret chain)
Eight notes from Linnet's own Wander, each by a carved "L.", each needing a different mechanic:
1. Behind Gran's portrait (Gloves, grip). "Gran won't talk about why I turned the picture round. I'll turn it back."
2. Meadowfold, under a hay bale that is a stray (it doesn't come back once moved).
3. Kilnridge, in a cracked urn reached by shard routing.
4. Belfry, the echo room (lullaby).
5. Millwater, behind the falls (raft secret channel).
6. Hushwood, the sleeping giant's hollow (Bell, then Bedroll to climb back).
7. Larkspur, inside the carousel's horse (Crossbar).
8. The Frayed Edge, at the Stray House's door (opens it).
The notes tell, in order: her Wander; finding the Makers; finding the Hall of Names; her mother's ledger;
the Shears; the fog is thread; "I'm going. I'll cut a little at a time from outside, until she can let go.";
"If you're reading this, you're a Wanderer too. The Stray House is for you. Nothing in it comes back. Don't
be frightened of that." The Stray House's last room: Linnet's bracelet (for the full ending).

As built: notes 4 and 5 were scenery first (the Echo Room's pinned note, the bottle below the falls) and are trail
notes now. The Stray House's door takes the seven notes through its slot ("Post them") and opens; note 8 lies in the
Porch. The Stray House: DUNGEON_TRACKER.md "O1". Its reward is the bracelet (the ending: Linnet gives it to Hesper)
and a Heartstitch; the Twin Bedroll was dropped (one Bedroll is enough for everything in the game).

## 5. Boss solutions
Every boss has three beats (polish campaign, 10 November): the first applies the House's lesson; the second changes
the arena or the boss's rule; the third wants something learnt earlier too. Nothing has to be set up again between
beats, and each change is told by a line or a notice and a visible change. Every mini-boss falls in two hits.
DUNGEON_TRACKER.md has the full details and the tests.

- **Grand Housekeeper (D1)**: (1) push a bust out toward the wall: it walks over to yank it home and stands in its
  own yank's way: slammed, its doors swing open, hit its heart; (2) it plants itself on its cross and yanks from
  there: bait a charge (stand in line with it), and while it's away push the top bust down across its cross: home
  again, it yanks the bust back the way it came, through itself; (3) it never leaves its cross and yanks the moment
  anything's out of place: grip a bust with the Gloves and hold on: the yank drags the Housekeeper into the bust.
  The Dust Monger (mini-boss): two hits from coming-home furniture or thrown things.
- **Kilnwyrm (D2)**: (1) it follows Wren's footprints, so an urn's shards carried home along them meet it; (2) it
  runs the room's rim: carry an urn out across the rim and back in another way (no loop: loop erasure would cut the
  crossing out) and throw as it comes round; (3) it coils in a pit opened at the Kiln's heart: carry an urn and reel
  over the pit on the Hookline; the shards fly home over the pit, through its coils. The Glazer: two hits.
- **Old Grindle (D3)**: (1) push a barrel into a side current; it gulps it and settles with its gear-heart showing;
  ride the ferry (the ferry bell sends it at once) to below its mouth and strike; (2) the sluice turns the currents:
  barrels drift away and the ferry would carry Wren into its bite: stand on a barrel with the Paddle, paddle up
  beside the mouth, strike; (3) its jaw clamps shut: carry a pot aboard, push off with the Paddle and smash it past
  the teeth: the pieces fly home along the ride, between them, to the heart. The Snapjaw: two hits; step back from
  its bite on the bank and push a crate down the current while it hunts with its back to the water.
- **Tollgrim (D4)**: only the clapper coming home on a bell's snap knocks him out, dazed. (1) the gust blows the
  clapper out, he leans out to spit, ring: the clapper slams home into him; (2) the wind turns (east shutters open,
  a gale under the bell, the clapper pinned to the west wall) and he ducks back in at any ring within seven strides:
  ring from beside the clapper but out of his hearing, or strike the old bell in the west bay; (3) he watches Wren
  and stays in while she's near the clapper: carry a pot under the old bell and away, then smash it: the pieces fly
  home under the bell and ring it from afar. Clangor: two hits (a bust's way home through him when he rings).
- **Mother Sloth (D5)**: an arm snaps only when pulled outside her ring of stars. (1) lay the Bedroll outside the
  stars; caught, fly Homeward: the arm snaps; both snapped, knock her nightcap; (2) the floor outside the stars drops
  into the dark but for a row of old boards: walk out over them (they give way behind her) and back in, get caught,
  fly Homeward: the flight follows the way Wren walked, over the missing boards; (3) the boards drop too and only the
  brass-ringed bedposts stand in the dark: caught in line with one, hook it: the reel drags Wren out past the stars.
  Out of reach she lobs pillows. Matron Hush (mini-boss): two hits; she puts her feet where Wren put hers, so lead
  her over the crumbling boards. The Bedroll.
- **Great Marionette (D6)**: (1) walk the two little Wrens on the rack round its feet: the strings tangle, it falls,
  knock its head; (2) it marches round the stage like the toy soldiers, turning right at whatever's in its way; a
  third little Wren comes down on its own string: put it in the march so the turn brings a foot onto the stage trap;
  (3) its strings go slack and its control bar hangs out of reach: pull the bar down with the Hookline, take its
  strings with the Crossbar and walk it onto the trap yourself. Then the curtain comes down on it in a red heap and
  Reveal 1 (`src/64_reveal1.js`): Jory lowered from the flies in a bosun's chair, the Makers out of the wings into a
  line, then heard out one by one (Ives, Bram, Dad, Mum, Mallow, Jory: their Houses, built for every Wanderer and
  worked from underneath; the last part of a Wander is learning to make); the Inn's Staff door is open; they all
  look up at once (Gran: Reveal 2). Captain Tin (mini-boss): two hits; knock a flat as he comes and he marches into
  the trapdoor behind it. The Crossbar.
- **The Tangle (D7)**: four bobbins' threads hold it together. (1) all four off their first places at once (three
  stitched with the Needle, the fourth pushed off and tied below): it comes apart; knock the core; (2) it hooks
  itself on the Heart's old hoist up in the rafters: below, push the hoist's counterweight off its plate and it
  drops, loose; knock it; (3) it hauls every loose bobbin a tile toward its first place every two seconds, and no
  knot holds: grip the fourth bobbin out and ring the Recall Bell with the other hand: everything snaps home at once,
  and home is where the Needle put it. Gundry: "That's all a Maker is. Somebody who knows where the threads go."
  Cog (mini-boss): two knocks, with his cord tied off from below; he sits, topples and unravels. The Needle.
- **The Weaver (D8)**: (1) hung by four anchor threads over the First Spinner's loom: cut them all (snip free of its
  binding silk) and it drops into the well of the loom; knock it; (2) it hangs by one thread of its own from the
  breast-beam and drops onto Wren (its shadow first): a slack thread slides off the blades, so cut it ahead of the
  Weaver while it climbs home over the well with the thread pulled tight; (3) it clings to the breast-beam out of
  reach: the Hookline drags it down its own well, where it hangs low and dazed: cut or knock it. It ends a heap of
  grey silk in the well, the web drifting down like snow, and the breast-beam's words show: I MEANT TO UNPICK THEM
  IN THE SPRING. -THE FIRST SPINNER. The Shuttle (mini-boss): two knocks, jammed by an offcut in its lane. The Shears.
- **The Spool (Final)**: see DUNGEON_TRACKER.md.

## The Knotting Festival (after Knot 4, `src/57_festival.js`)
The square in bunting; Gran's speech; Ives, Bram, Dad and Mum arrive late from four directions, out of breath,
with clay, river water, brass dust and a feather duster on them (the first strong clue to Reveal 1). Gran points
Wren at the east road and the sleeping giant. Returnball stays up afterwards.

## Hushwood and the Slumberhouse (Knot 5, `src/59_hushwood.js`, `src/60_slumber.js`)
Old Hummock, a giant asleep across the east road "since before Gran was born", wakes at the Recall Bell, apologises
and lumbers home to his own bed. Hettie the forager has been camped by Lantern Pond ever since, unable to get home.
The Slumberhouse is Doctor Mallow's: his case book in the study ("The Wanderer... Wakes where we put her", the last
words crossed out hard), his monogram in the rug. Back in town he knows things about it he shouldn't ("How do I know
it's comfy? One hears things"). The schoolhouse rules gained, faintly, "6. You have a place too" after Knot 4: the
Bedroll is the first thing in the game that lets Wren choose where home is (it matters at the ending). Gran, after
Knot 5: "Mind you always roll it up and bring it home. A Wanderer's place is at home."

## Larkspur Fair and the Marionette Hall (Knot 6, `src/62_larkspur.js`, `src/63_marionette.js`)
The way in is a jump off Kilnridge's high mesa into a straw heap (only with a Bedroll laid up top); the way out is
the bolt on the east gate, or later the lift (work the stagehand puppet on the mesa onto the winch with the
Crossbar). Madame Rook the fortune teller hints; Pell the barker sells the show: "THE WANDERER, starring... well, you".
The box office ledger: "Cast: one. Crew: six. Audience: the crew"; years of playbills, one with a girl in green
ribbons (Linnet). The prompter's script has lines Wren hasn't said yet. Jory's bench: a half-carved face that looks
like Gran, "FOR THE LAST ACT. (NOT YET.)", and puppets of every boss. Linnet's note 7 under the carousel horse: she
followed the strings down (the Makers; the Underside).
## The Underside and the Spoolworks (Act III, `src/66_underside.js`, `src/67_spoolworks.js`)
Gundry, who oils the Well's winch up top ("turns by itself some nights"), is the Guild's master below. The Spool
racks by the stairs: TIDYHOUSE, SPARE... WREN, SPARE (RED). The Guild Hall's table has an L carved among the
initials; Gundry's bench says L. WAS HERE TOO (Linnet came down here on her Wander). The Seams' counterweight is
tagged NORTH GATE. DO NOT TOUCH. BY ORDER OF THE WARDEN. The peepholes (S23): Rosa's cream for Biscuit; Miss Quill
pinning Tuck's drawing beside an old one of a girl in green ribbons; Arlo practising walking; Mabel shelving a
stray with an L; Seam sewing Tuck's scarf (a list: 3. BRAVE); Burr saying "Go on, then" to nobody; Mallow asleep on
his plans; Gran writing in a heavy book, looking at the turned portrait, not turning it round.
## The Makings and Reveal 2 (`src/68_makings.js`, `src/68b_makings_more.js`, `src/69_reveal2.js`)
Tuck's Little Wander: eight Little Houses the Makers built for him, run by Wren from underneath (see DUNGEON_TRACKER).
The fifth is Ives's own Tidyhouse rooms built again (the Foyer, the Hall of Busts, the Ballroom): from underneath Wren
finds the cords under the busts she pushed, the Grand Housekeeper's costume on a rail (it was Ives inside), and Ives's
notes on how long Wren took in each room. From the sixth Otto (from the square's Housekeeper game) comes along to play
the Housekeeper, tidying whatever Tuck pushes; the eighth is the Grand Hall, where Otto, as the Housekeeper, is beaten
the way the real one always was: standing on a thing's way home as he tidies it. Its big door hangs on a counterweight
(what the Pattern really did), and all six Makers are crouched under the last hoop. Gundry walks over from the Guild
Hall to say his piece to Wren's face. Tuck's own thread hangs under his start like anybody's (the first hint of
Reveal 2); tugging it, Ives: "Not the boy's own thread, love!" The Makers grade in Ahas; all of them, three in every
House: Tuck's drawing of "a Maker, whoever helped" (S30).
Then Gundry sends Wren for Tuck's fresh spool down the Way Down: the deep store, and past it the Hall of Names: a spool
for everybody (Arlo's with "Walked to the lake again. Tightened."; Biscuit's peg empty, a snipped end; Hesper's empty,
in her own hand; Linnet's cut clean; Wren's wound tightest and still turning). Gran's ledger (Layer 2): Linnet cut
herself loose with the First Spinner's Shears from the old Loom; Gran pulled every spool tight; the Knots are turns of
her winch; the seventh Knot, the Wanderer's own at the Well, would make Wren the next Spinner. Gran comes down. She
doesn't argue; a choice of three words; she pulls Wren's thread and Wren wakes in bed. After: everyone's thread shows
(a short line from each townsperson), the well cellar is locked, Gundry tells of the Shears in the Loom past the north
gate and the gate's counterweight in the Seams (the Needle gives it a new place: S32 if before Reveal 2); a faint now
wakes with Gran's hand felt on the thread (S33).
## Act IV so far: the north gate, the Loomwood, the Loom, cutting free (`src/71_loomwood.js`, `src/72_loom.js`, `src/73_freed.js`)
The north gate opens when its counterweight in the Seams takes a new place from the Needle. Burr, after: "Go on, then."
The Loomwood: silver birches, moths that go for movement, silk strands, the Frayed Edge (strays; the Stray House's
door with a slot for a folded note: Linnet's note 8, O1). The Loom: the First Spinner's; its tapestry tells she tied
the valley in a hard winter and meant to unpick it in spring; L. cut her way out of here. With the Shears, townsfolk
cut free say something new and walk a little round of their own (CUT_LINES); Old Arlo walks to the river (S24).

