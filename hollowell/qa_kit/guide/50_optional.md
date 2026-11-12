## Optional content: Linnet's Trail, the two optional Houses, Heart Patches and secrets, the town's games and favours

Everything here is off the main path: nothing in it is needed to finish the game. It changes three things later: the
bracelet changes the finale and the ending, the Long Hook makes the Hookline reach 10 tiles everywhere, and the quilt
and Gran's epilogue count what was found. Test saves are written **Tnn** (the catalogue's T01-T58 and this part's T59-T74);
the design's secret numbers are written **secret Snn**.

### Test saves for this part (T59-T74)

Made by `tools/qa_tour.mjs` (segments E1-E7). Each segment starts from a catalogue save and plays on through the game's
own rules (walking, pushing, the tools; hops between places to save the walk; nothing set by hand; a game where nothing
can hurt Wren, so hearts are the game's own count). Every save was loaded from its code into a fresh game and checked:
right area and room, Wren free to move, the menu opens, she can walk, no errors.

| Save | What it is | Loads at | Hearts | Made from |
|---|---|---|---|---|
| T59 | After House 1: home, Gran told (the visit the goal line suggests) | town square by Gran (93,61) | 4 | T08 |
| T60 | The kids' game ready (secret S12): Otto on his chalk X, both crates home | square, beside the north-west crate (97,57) | 4 | T08 |
| T61 | The Tidiness Trials (secret S28), none tried | the Inn's attic, top of the stairs (2,9) | 4 | T08 |
| T62 | After House 5: the clinic visited (`mallow_d5`) | in the clinic (6,4) | 8 | T28 |
| T63 | After the festival: Returnball (secret S29), nothing thrown | court east of the south road, beside the ball (99,74) | 7 | T23 |
| T64 | Linnet's Trail done (notes 1-7), nothing posted | the Stray House's door at the Frayed Edge (72,7) | 11 | T49 |
| T65 | The Stray House: just inside (notes posted) | the Porch | 11 | T49 |
| T66 | The Stray House: both lamps lit, stairs to the Pile open; its Heart Patch taken | the Stair Hall (west doorway) | 11 | T49 |
| T67 | The Stray House done: the Pile beaten, the bracelet and the Pile's Heartstitch | the Pile's room (south doorway) | 12 | T49 |
| T68 | The Unfinished House: at Mr Ives's door, not yet in | town, below his door (120,46) | 12 | T49 |
| T69 | The Unfinished House: just inside, nothing sewn | the Front Room | 12 | T49 |
| T70 | The Unfinished House done: Mr Ives at his chair, the Long Hook | the Gallery (south doorway) | 12 | T49 |
| T71 | After the ending, with all eight notes, both optional Houses, the bracelet ending | the free valley, square (95,63) | 12 | T49 |
| T72 | House 5: the Bedroll laid by Mother Sloth's door (big door still shut, the Pattern in hand) | beside the Bedroll, the Landing (29,12) | 7 | T27 |
| T73 | House 6: the Bedroll laid by the Great Stage's door (same) | beside the Bedroll, the Wings (29,12) | 8 | T32 |
| T74 | The Great Spool: the Bedroll laid at the top of the Climb, by the way to the Top | beside the Bedroll, the Climb (29,12) | 11 | T57 |

T64-T71 have 1, 1, 2, 2, 2, 2, 3, 3 Heart Patches (the Echo Room's, the Stair Hall's, the Far Shelf's) and 96 buttons (the
basin's 50); no other patches. T72-T74 replace T27, T32 and T57 for boss testing (those load beside a Bedroll a room or more away). Other
starting points: the favours from the first save after each tool (Gloves T06/T08, Hookline T11/T13, Bell T21/T23,
Crossbar T31/T33, Needle T36/T38); the Unfinished House before the Loom only with the Guild pin (needs all six Maker's
marks, which no catalogue save has).

### When things open

| Content | Opens | Needs |
|---|---|---|
| Kids' game, Tidiness Trials | after Knot 1 (`d1`) | nothing (Trial Three's fall is the Return's own) |
| Favours 1-6 | each with its tool | Gloves, Hookline, (crates' string), Bell, Crossbar, Needle |
| Knotting Festival, Returnball | after Knot 4 (`d4`): the festival the first time Wren enters the square | carrying, the Return |
| Linnet's notes 1-7 | as their tools come: 1 Gloves; 2 nothing; 3 a pot; 4 the Recall Bell (House 4, after Clangor); 5 the Paddle, but see the findings (only safe with the Bedroll, after House 5); 6 the Bedroll and the giant gone home; 7 the Crossbar | see the Trail |
| The Stray House | its door is past the north gate (open from T45) | all seven notes (1-7) |
| The Unfinished House | Mr Ives stands outside from Reveal 1 | the Needle, and the Guild pin or the Loom done (`d8`) |
| The far isle (secret S31) | | the Long Hook (Unfinished House) |

### Linnet's Trail (notes 1-8)

Each note sets `linnetN` and adds a journal note; a reading ends "(Notes found: N.)" (all eight counted). Notes 2-8 are
`linnetnote` props (src/43_meadowfold.js `SPAWN.linnetnote`): carved L plus a note, hidden while a thing stands on it
(`under`), gone once read. Tests: tests/strayhouse.test.mjs (door, notes 4, 5, 8), kilnridge.test.mjs (3),
hushwood.test.mjs (6), larkspur.test.mjs (7), review_d6.test.mjs (7 not readable while the horse stands on it).

| Note | Where | How (checked in the headless game, T49 route) |
|---|---|---|
| 1 | Gran's house, the picture turned to the wall (interior 9,1) | Needs the Gloves: face it, act: Wren turns it, the note drops (`linnet1`, `portrait`); it swings back. Without the Gloves it only slides back |
| 2 | Meadowfold, under the stray hay bale (100,110) | Push the bale (from 99,110 push right): a stray, it stays; read the note at 100,110 |
| 3 | Kilnridge, the urn at the end of the crevice (3,111) | Lift the pot below 17,98, carry it to 7,111, throw left: the urn breaks (`hollow/seal:linnetUrn`); read from 4,111 |
| 4 | House 4, the Echo Room (cell 2,2; note at 56,30) | Behind a sleeping slab in Clangor's Loft's east doorway (`clWall`): ring the Recall Bell near it (from 35,27), it goes home. Strike the stones (stick) low, high, middle, high, low (stones at x 45, 53, 49 on row 26; strike from row 27): `belfry_echo`, chest with a Heart Patch (49,24). **The note only appears once the Belfry is built again** (leave and come back, or reload): see the findings |
| 5 | Below the falls, Millwater (171,115), a bottle | Ride the ferry (`mwFerry`, west landing 167,106) south with the Paddle: over the falls into the pool below, paddle east, step off onto the beach (170,113-115). Chest: 50 buttons (`mwBasin`). **Lay the Bedroll first**: see the findings (the beach is a trap) |
| 6 | Hushwood, the giant's hollow (secret S16) | After the giant has gone home: lay the Bedroll up top (134,58), act at the hollow (132,59, facing left), choose to climb down (`hummock_hollow`); walk right along the dark to the little round door; Homeward brings you back up (or climb the roots) |
| 7 | Larkspur, under the carousel's wooden horse (31,62) | Crossbar from 31,64 facing up, strings right twice: the horse walks off its spot; read from 31,63 |
| 8 | Inside the Stray House, the Porch (13,8) | Read from 13,9 facing up |

- Six notes (any six of 1-7) also unlock Biscuit's collar (secret S25) when you talk to the cat (secrets2.test.mjs).
- Note 5's text tells you to put your hand in the fog where the river meets it (src/80c_fog_hand.js): a clue, not a
  reward.

### The Stray House (O1, `src/77_strayhouse.js`, area `strayhouse`; tests/strayhouse.test.mjs, review_opt.test.mjs)

**Overview.** Linnet's House, at the Frayed Edge (door prop at 72,6; stand at 72,7). No lock: a slot. With all seven
notes, act on it: "Post them / Keep them". Posting sets `strayhouse_open` (and the secret count), and the door stays open
for good (later, act on it to go straight in). Six notes: only the description. Nothing in the House has a thread: every
block is a stray (pushed, it stays; into a hole or water, it fills it and is gone for good; a filled hole stays filled).
No nudges (`noNudges`). Music: Linnet's. Gives: note 8, a Heart Patch, a Heartstitch (+1 heart), Linnet's bracelet.

**The Return here.** A fall doesn't fly Wren home: she climbs out, scraped, on the side she fell in from (first time:
`sh_fell` and a notice "Nothing pulls you home in here..."). Exceptions: a doze (`fallWhy: 'doze'`), the Bedroll laid in
this House, and once her own thread is cut it's like this everywhere.

**Map** (cells; room-local tiles are 20x11):
```
 Linnet's Room (0,0) - The Pile (1,0)
                          | stairs (gate: both lamps)
 Washhouse (0,1) - Stair Hall (1,1) -[lock]- Mending Room (2,1)
                          | [lock]
 Pantry (0,2)  -  Parlour (1,2)  -  Bridge Garden (2,2)
                          |
                    Porch (1,3) - door out
```
Two keys (Pantry, Bridge Garden), two locks (the Parlour's north door, the Stair Hall's east door): either key opens
either lock. Order: Porch, then the Pantry and Bridge Garden in either order, then both locks; the Washhouse and the
Mending Room in either order; then the Pile, then Linnet's Room.

**The Porch (1,3).** Idea: a stray stays where it's pushed. A row of holes across the room (row 3). Push the stray
(9,5) up twice from 9,6: it fills hole 9,3; walk over. A spare stray by the west wall (4,7). Sign: "NOTHING IN HERE COMES
BACK". Note 8 at 13,8. A stray that filled a hole is gone for good, not back next time (test).

**The Parlour (1,2).** Hub; north lock `paLock`. Decorations only.

**The Pantry (0,2).** Idea: order and room. Three strays onto three plates (2,2; 16,2; 2,8) behind shelf walls with gaps.
Steps (test): S2 (11,5) west 9 from 12,5 then up 3 from 2,6 onto 2,2; S1 (8,2) down 3 from 8,1 (through the north gap),
west 6 from 9,5, down 3 from 2,4 onto 2,8; S3 (9,8) east 1 from 8,8, up 3 from 10,9 (south gap), east 6 from 9,5, up 3
from 16,6 onto 16,2. The key chest appears at 16,8 (open from 16,7). Every shelf compartment has two gaps, so pushing a
stray out never shuts you in (a fix, QA_REPORT 2026-11-10).

**The Bridge Garden (2,2).** Idea: a trench filled in order, one more carried over it. Holes at 9-11 on row 5. Steps:
S2 (6,4) down 1, east 3 into hole 9; S1 (3,2) down 3, east 7 into hole 10; S3 (3,7) up 2, east 8 into hole 11; S4 (5,8) up
3, east 11 over the filled trench, down 2 from 16,4 onto the plate 16,7. Key chest at 16,2 (open from 16,3). Pull the cord
in the corner (1,1; from 2,1 facing left) and a spare stray drops at 2,2 (a chute).

**The Stair Hall (1,1).** Hub. Heart Patch chest at 13,1 above a column of holes (13,3 and 12-14,2). Steps: S2 (15,7) west
2, up 4 from 13,8 (fills 13,3); S1 (6,7) east 7, up 5 from 13,8 (over 13,3, fills 13,2); open from 13,2. Stairs north
(`shStairs`, gate) open when both lanterns are lit: `shWash` (Washhouse lever) and `shMend` (Mending Room lever). A
lantern described while cold: its wick runs toward one side of the House.

**The Washhouse (0,1).** Idea: stones sink and stay sunk, tubs float. Water x 6-12. Push stone 1 (15,3) down 2 and west
3 (sinks at 12,5); stone 2 (15,7) up 2, west 4 (sinks at 11,5). From 11,5 the Hookline (reach 7) pulls the tub (5,5) over
to 10,5; step on, paddle west, step off at 5,5; lever at 2,3 (from 2,4). The tub is unmarked: it stays where you leave it,
so to go back you paddle it east again. Chute at 18,9 (spares at 17,8). Sign: "My hook is too short for the tub from the
doorway."

**The Mending Room (2,1).** Idea: the Needle gives a stray a place; a place can be unpicked. A pincushion (rows 3-8, x 4-13)
you can't get behind. Needle S1 (5,4) three left onto the plate 2,4 (from 1,4 facing right: steer L L L); S2 (12,4) three
right onto 15,4 (from 16,4 facing left: R R R); S3 (9,7) out to 11,9 (from 9,9 facing up: D R D R), then the Needle at it
again and unpick it (a stray again: pushed, a stitched thing would only go back to its place), push it 5 east onto 16,9.
The gate 17,2 opens; lever at 17,1 (from 17,2). Each stitch counts toward the Needle's three (a fourth undoes the
oldest, wherever it is: on the T49 route the two Loomwood weights' stitches were pushed out here; the route carried on
fine, nothing further checked).

**The Pile (1,0), the boss.** A 2x2 heap that wakes when Wren enters (shutters shut, boss music, goal "The Pile can't be
pushed... Box it in, all four sides."). Rules (class `Pile`): it can't be pushed; it moves only toward Wren, one tile per
34/44/54 frames (hp 3/2/1), the longer way first, else the other; when neither way toward her is open it strains for 150
frames; moving into her it shoves her (2 = a heart, `p.hurt`). Boxed (no side free: walls, holes or strays; checked even
while it strains) it heaves 70 frames and bursts, flinging the strays within 1.5 tiles to random spots (seeded `G.rng`),
then rests 60 frames. Three bursts and it comes apart (`sh_pile`, `Stats boss:pile`); shutters open; the west gate to
Linnet's Room opens (`flag:sh_pile`). Arena: four corner nooks, each with a pillar and a one-tile slit (too narrow for
it); six strays (3,4; 16,4; 3,6; 16,6; 7,2; 12,8).
1. Wait in a nook's corner (e.g. 1,1); it comes up to the nook's mouth (2,1).
2. Slip out through the slit (1,3 to 1,4); it follows into the nook and strains.
3. Push the nook's stray across its open side (3,4 up 2 from 3,5): boxed, it bursts.
4. Repeat twice. After a burst it stays where it is; standing west of its middle keeps it straining in the north-west
   nook, so a stray close by can be pushed into the open side (3,1/3,2) during a strain. Or lead it out to the middle and
   into another nook whose stray is still in place (watch for flung strays in its way: it doesn't path-find).
"Boxing it anywhere works too." Fair difficulty: slow, readable, one heart per shove; the challenge is the strays' random
scatter. The T49 route took a nook each round (north-west, south-east, south-west by way of the middle).
- Defeat: it comes apart into two strays (on its own tiles) and a Heartstitch on a free floor tile beside it
  (`pileHeart`; goal "West of the Pile's room: Linnet's own room."; autosave). If the Heartstitch isn't picked up, it
  waits in the middle of the room (9,3) whenever the House is built again (`got:pileHeart` records it).
- Faint during the fight: not checked (unverified). The fight's state isn't saved, only `sh_pile`: a reload starts it over.

**Linnet's Room (0,0).** Her desk (the diary), the window over the Drift, the bed. The big chest (9,7, open from 9,6):
Linnet's bracelet (`bracelet`, a quest item).

**State.** `strayhouse_open`, `linnet8`, `sh_fell`, `sh_pile`; area flags `chest:ptKey`, `chest:bgKey`, `chest:shPatch`,
`lever:whLever`, `lever:mdLever`, `door:paLock`/`door:shEastLock`, `got:pileHeart`, `fill:x,y` / `gone:<id>` for filled
holes and used strays. Loose strays are back where they began each time you come in; filled holes stay filled; the levers
keep the lamps lit.

**Accepted second ways (QA_REPORT 2026-11-10, kept: they follow the rules).** Wren standing on a plate herself in the
Pantry and the Bridge Garden; filling from the chutes; the Mending Room's pins walked over.

### The Unfinished House (O2, `src/78_unfinished.js`, area `unfinished`; tests/unfinished.test.mjs, review_opt.test.mjs)

**Overview.** Old Mr Ives's House, up the bank east of the river in town (door 120,45; stand at 120,46). He stands outside
from Reveal 1 until it's done. In with the Needle and either the Guild pin (Gundry gives it for all six Maker's marks:
secret S06, `s06`) or the Loom done (`d8`). Otherwise: "Bring me the Guild's pin. Or come back when you've done something
bigger" (with the Needle) or "nobody has a Needle any more" (without). First time in: `ives_in` and two lines. He drew the
House in chalk; the Needle sews a chalk plank real (`ChalkPiece`). Gives: a Heart Patch, the Long Hook. No nudges.

**The Needle on chalk.** It sews the nearest unsewn plank in line in front of Wren (reach 4; it stops at a thing or a wall
but sees across gaps). At a sewn plank it asks "Unpick this one / Sew the next one along / Leave it". The Needle holds
three stitches, planks and things together (`Inv.stitches`): a fourth undoes the oldest, wherever it is, and whoever's on
it drops through. The Shears snip a sewn plank. A gap filled for good with a stray needs no plank. First sewing:
`chalk_first` and a notice.

**Map.** Front Room (1,3) north to the Drafting Hall (1,2); west the Long Gap (0,2), with the Far Shelf (0,1) north of it;
east the Loading Bay (2,2); the Drafting Hall's stairs (gate `ufStairs`, `keep`) up to the Gallery (1,1) once both lamps
are lit: `ufW` (the Long Gap's lever) and `ufE` (the Loading Bay's plate).

**The Front Room (1,3).** A two-row gap across the room; a two-tile chalk plank (9,4-5). From 9,6 facing up, sew; cross.
Mr Ives stands at 13,7. Coming back out later, the plank's stitch will have gone: sew it again from 9,3 facing down.

**The Long Gap (0,2).** Idea: four gaps, three stitches. Planks at 13, 10, 7, 4 on row 5. From 14,5 sew left (13), then
"Sew the next one along" (10); walk to 11,5, next along (7); walk to 8,5, next along (4): the fourth undoes the first,
behind you. Lever at 2,8 (from 2,7, facing down): the west lamp. Coming back east, sew them again from the west the same
way. A stray at 16,8.

**The Far Shelf (0,1).** Idea: mind where you stand. Four planks side by side (10-13, row 5). From 9,5 sew three; stand on
the second (11,5); sew the fourth (the first goes). Heart Patch chest at 17,3 (from 17,4). Back: from 12,5 unpick the
second and sew it again (now the newest), step onto 11,5, sew the first (the third goes, behind you). Or fall in and start
again at the door. Sewing a fourth while standing on the oldest drops Wren (test).

**The Loading Bay (2,2).** Idea: you can't sew past what you're pushing. Four planks side by side (8-11, row 5) and a plate
at 15,5 (the east lamp). Push stray 1 (5,3) down 2 and east 3 into the first gap (8,5) for good; from 8,5 sew the other
three; push stray 2 (5,7) up 2 and east 10 over them onto the plate. Chute at 1,9 (spares at 2,8). A stray given its
place on a plank drops in and fills the gap when the plank goes (fixed; review_opt 5/11).

**The Gallery (1,1).** Mr Ives's walk (`IvesWalker`): he starts at 1,5 and walks right along row 5 to his chair, waiting
at each chalk gap (3, 6, 9, 12, 15). From the walkway below (row 7) sew each plank ahead of him, facing up (the Needle
sees across the open row 6). The three-stitch rule undoes the oldest plank behind him. Undo the plank he's on and he
drops, and his own old thread hauls him back to the start ("Whoops!", `ives_fell`, test). At his chair: `ives_done`,
lines, the Long Hook (`longhook`), the goal set to nothing, autosave. After: he sits by the window; in town his second
self stands outside (`mrivesTown2`).

**Shortcuts that must not work.** The Hookline at Mr Ives bounces off him (fixed weight); moved off his walk any way, he
is hauled back to the start (review_opt 3). The Shears on him: "His thread's his own business, he says."

**State.** `ives_in`, `chalk_first`, `ives_fell`, `ives_done`, `longhook`; area flags `lever:lgLever`, `chest:fsPatch`,
`door:ufStairs` (the stairs stay open once lit, through a reload: review_opt 8). Sewn planks are kept as stitches and
come back sewn after a save and load (test), until pushed out by later stitches.

**Accepted second ways (QA_REPORT).** The Long Gap's stray pushed into a gap; the Loading Bay filled from its chute.

### Heart Patches (38 in all; four make a heart)

`Inv.patches` counts them; every fourth stitches a new heart ("Four Heart Patches stitch together into a new heart!").
Hearts: 3 at the start, +1 per Heartstitch (the eight House bosses and the Pile), +1 per four patches: 21 at most.
tests/heartpatches.test.mjs checks the count (38) against DESIGN_DOCUMENT §5 and SPOILERS item 36. Ids in parentheses.
House rooms are covered room by room in the Houses' parts; here only where and how in a line.

**In the valley (14).** Meadowfold, behind the windmill (`meadowPatch`, pickup, 84,84). Old Tup's bothy (`bothyPatch`,
76,94: the Recall Bell sends the ram asleep in the doorway home). Kilnridge's Firing Ground (`fgPatch`, 27,112: the crate
shoved into the wet clay, a pot in the vent's mouth 14,111, stand on the plate 12,113 as it fires). The clay dam
(`slotPatch`, 60,86: the Needle gives a pot its place in the vent's mouth 60,100). Behind the falls (`mwCave`, 172,110,
secret S19: ride a float down the east side of the river; open the chest from the float). Heron Rock (`mwHeron`,
179,93: reel the barrel ashore from 179,98, lift it out of the line, hook its empty mark; back by the post 178,99). The far isle (`islePatch`, 142,89, secret S31: the Long Hook from the west shore 132,90). The Heights cave
(`hCave`, 157,28: the Recall Bell, or the ringers' old bell with the clapper). The Crags (`cragPatch`, 134,16: four
Hookline crossings). The Eyrie (`eyriePatch`, 187,2: the Shears on the crate the draught drops into the crevice).
Hushwood plateau (`hwPatch`, 164,44: the moss hops you up). Lantern Pond's isle (`lpIsle`, 158,68: four lanterns lit while their plates
hold the mossy stones; three stitches, the fourth stone pushed on and gripped). Larkspur's fakir's
pen (`larkPen`, 52,51: the Crossbar puppet through the hole onto the plate). The Loomwood clearing (`lwPatch`, 121,10:
cut the silk across the gap 120,16).

**In Houses (16).** Tidyhouse: Conservatory (`consPatch`), Attic (`atticPatch`). Kiln: Long Way Round (`lwrPatch`),
Chasm Gallery (`cgPatch`). Millrace: Shard Race (`srPatch`), Workshop (`wsPatch`). Belfry: the Rafters (`raPatch`: ring,
the sleeping slab goes home, six bats wake), Echo Room (`esPatch`, secret S15), Workshop (`bwPatch`, behind a sleeping
slab). Slumberhouse: Mallow's Study (`stPatch`). Marionette Hall: the Rehearsal Room (`rhPatch`, secret S13: the Wren
puppet walked onto its mark). Underside: the Seams (`seamsPatch`, secret S23: all eight peepholes). Spoolworks: Gundry's
Bench (`gbPatch`). The Loom: the Spinner's Room (`spPatch`: cut the silk across its west doorway). Stray House: the Stair
Hall (`shPatch`). Unfinished House: the Far Shelf (`fsPatch`).

**Elsewhere and given (8).** Trial Three's chest in the Inn's attic (`t3chest`). Pip for Lucky (`luckyPatch`, secret
S17: the Needle gives the lamb a place on this bank). Thimble's shop, 120 buttons, once (`shop_patch`). Pip for five rings
at Returnball (secret S29). Arlo after the Shears (`arloPatch`, secret S24: cut him free, follow him to the bank).
Biscuit's crawlspace (`biscuitPatch`, secret S03: look in with the cat close by). Every beaten boss patted asleep in its
hall (`napPatch`, secret S14: all seven). The hawk's nest, knocked out by a thrown pot's shards (`hawkPatch`, a pickup).

### Secrets (the design's S01-S35, SPOILERS.md "Secrets"; src/78b_secrets.js; tests/secrets2.test.mjs)

| Secret | What | Flag / reward |
|---|---|---|
| S01 | Lean on (budge) every townsperson once | `s01`, Arlo's line, the Frayed Ribbon |
| S02 | Gran's portrait (Linnet's note 1) | `linnet1`, `portrait` |
| S03 | Biscuit's crawlspace under the bakery's back step (act at 105,67 from 106,67, facing left) with the cat close by (its route stops there) | `s03`, Heart Patch |
| S04-S05 | Staff Only door and the warm pie (House 1) | `staffonly`, `pie` (House 1's part) |
| S06 | The six Maker's marks (one per House 1-6) | Gundry: the Guild pin, `s06` |
| S07 | The tailor's back window after the Kiln (from 102,43 facing down) | `s07` (seen, not counted) |
| S08 | A House's key carried out flies back in at the door | `s08`, a journal note |
| S09/S10 | The Recall Bell rung at the Well; the Hookline thrown at it | `s09`, `s10` (seen) |
| S11 | The Bedroll laid near the fog, walk in, pulled home: a Drift-bloom seed | `s11` |
| S12 | The kids' game | `s12`, Playground badge |
| S13 | The Wren puppet (House 6) | `s13`, Heart Patch |
| S14 | Beaten bosses asleep in their halls, patted | `pet:<house>`, `s14`; all seven `s14_all`, Heart Patch |
| S15 | The Echo Room | `belfry_echo`, Heart Patch, note 4 |
| S16 | The giant's hollow | note 6 |
| S17 | Lucky over the river | `s17`, Heart Patch |
| S18 | The Bell rung while flying Homeward: home at once | (a move, not counted) |
| S19 | Behind the falls | `chest:mwCave`, Heart Patch |
| S20 | The hawk's nest | Heart Patch (`got:hawkPatch`) |
| S22 | The six logbooks (the Underside's Workshops) | `s22` |
| S23 | The eight peepholes | `s23`, Heart Patch |
| S24 | Arlo's walk | `s24`, Heart Patch |
| S25 | Biscuit's collar: talk to the cat with six of Linnet's notes (Act IV per SPOILERS; the test does it after House 8) | `s25` |
| S26/S27 | The two optional Houses | `ives_done` / `sh_pile` |
| S28 | The Tidiness Trials | `trial1-3`, `s28`, buttons, Heart Patch, the teal scarf |
| S29 | Returnball | `s29`, Heart Patch |
| S30 | All three Ahas in all nine Makings | `s30`, Tuck's drawing (shown in the ending) |
| S31 | The far isle | `s31`, Heart Patch |
| S32 | The north gate's counterweight given a place early | `s32` |
| S33 | Fainting after Reveal 2 | a different waking |
| S34/S35 | Hints off; the Well's motto in each act | (seen) |

S21 was never built. Fog-silk hollows (three, shut until the Shears: Meadowfold 75,116, Kilnridge 21,117, Millwater
144,116) count in the quilt (`silk:<id>`; secrets2 test). Scripted tests: secrets2.test.mjs (S01, S03, S07-S10, S14, S25,
S31), the region and House tests (S13, S15, S16, S17, S20), hub.test.mjs (S12, S28, S29). S19 (behind the falls) has no
scripted test ("built" in DUNGEON_TRACKER.md): unverified.

### The town: favours, the kids' game, the trials, the festival

**Favours** (src/51c_town_favours.js; tests/town.test.mjs). Six things wrong in town from the start, each put right with a
newer tool; nobody says how. A favour is noted in the journal only once someone has asked in person (`fav_<x>Told`), until
it's done. Rewards are buttons and keepsakes (no Heart Patches).
1. **The Guild's crates** (Gloves): two crates nose to nose in the lane by Thimble's (hub 22,27-30), each on the other's
   way home; pushing gets nowhere. Pull one out into the gap in the fence (only the Gloves pull) and hold it: the other
   goes by; let go, it follows home. `fav_cratesHome` (a notice), then talk to Thimble: `fav_crates`, 30 buttons, a ball
   of string.
2. **The kite** (Hookline): caught in the tree by the Inn; its way home runs up through the branches. Hooked down and left,
   it flies home and catches again. Carry it back over its own thread below the tree (the loop drops out), or throw it in
   the river (anything that sinks is home at once): `fav_kiteHome`. Nell needs string: give Thimble's: `fav_kite`, the odd
   marble (a stray) and 15 buttons. Before the Hookline the stick only rustles it.
3. **Tuck's marble**: give him the marble: `fav_marble`, 11 buttons; he puts it somewhere new in town after each stage
   (`MARBLE_SPOTS`).
4. **Mabel's sewing tin** (Recall Bell), in the Lost & Found: everything on her floor is a stray but the tin, which is
   asleep. Ring it: it snaps home, stops at the heavy stray on its thread; move that off: `fav_tin`, an odd sock, 40
   buttons. Rung but left, it lies down again.
5. **Jory's back room** (Crossbar), in the toy shop: the parcel strains at the locked door; walk the shop's puppet through
   the little hole onto the latch plate: the door opens, the parcel flies home to Tuck (`fav_stick`); the chest (50
   buttons). Tuck and Rosa mention it.
6. **Rosa's saucer** (Needle): set out on the back step, it walks itself home round the front. Give it a place on the back
   step: `fav_saucerPlaced`, Biscuit licks it; talk to Rosa: `fav_saucer`, 20 buttons, and a free bun (full hearts) any
   time.
- QA: a save mid-favour loads as it stood (test); a thank-you still owed is said after the Unwinding (test).

**The kids' game, Housekeeper** (secret S12; src/52_kidgame.js; hub.test.mjs). After Knot 1 Otto stands on a chalk X in the
square (102,58), two crates (99,57 and 105,60). Move a crate and he says Tsk, trots to the side of it facing his X and
yanks it home. He always comes from his side; he won't go round you (stand where he wants and he picks another side).
Push a crate straight away from his X and step aside: he stands on its way home when he yanks, and is bowled over:
`s12`, the Playground badge (`kidbadge`). Before Knot 1 the kids play tag. Start from T60.

**The Tidiness Trials** (secret S28; src/53_trials.js; hub.test.mjs). The Inn's attic stairs are roped off until Knot 1.
Three timed rooms; each starts on its plate (Trial Three at its bell), everything in the room put back for a fair start;
too slow and "Brrring!", everything goes back.
1. Two at Once (20 s): push one block up into the pocket (8,2) through its mouth, then the other onto the mouth (8,3):
   both plates down. 20 buttons; the way on.
2. The Long Way Home (15 s): a pot whose way home snakes round the room. Left to walk it's too slow; break it (the
   pieces fly home in time) or carry it back over its own path (each row walked over is cut off it). 30 buttons.
3. Home Time (4 s): ring the bell at the far end (stick), then be on the plate by the door (41,5) before it stops: walking
   is too slow; step into the pit by the bell and fly home along the way you came. `trial3`, `s28`, Heart Patch chest.
- All three, then talk to Ives downstairs: the teal scarf (`tealscarf`). Start from T61.

**The Knotting Festival and Returnball** (secret S29; src/57_festival.js; hub.test.mjs). After Knot 4 the square is
decorated; the first time Wren steps into the square the festival plays once (`festival`): Gran, four people arriving
late with clay, water, brass dust and a duster on them, music, then the goal turns to the giant and Pip points at
Returnball. Returnball: the ball (100,74), five rings (102,73; 105,73; 107,75; 104,76; 101,76). Carry the ball through
the rings, throw it, step out of its way: every ring it passes on its way home scores. Five in one go: Pip, a Heart Patch,
once. Fewer: a toast with the count. A fresh ball (the place built again) carries no half-score (an old fix: QA_REPORT
"Returnball keeping half-scores"). The ball is there from Knot 4 even before the festival (T23 starts outside the
Belfry: go home first). Start from T63.

**Home visits after a House.** After House 1 the goal says tell Gran: talking to her gives her after-Knot lines
(`granTalk` counts; no flag; the goal doesn't change until the Kiln's Knot). After House 5 the goal mentions the clinic:
Doctor Mallow's lines (`mallow_d5`, full hearts); the goal doesn't change either. T59, T62.

### The quilt and the tally

- **The Wander quilt** (src/78c_polish.js `QUILT`, on the chair by Wren's bed, gran_room 7,5): a count of everything found,
  by kind: "Secrets of the valley: N" (no total, on purpose), then "Linnet's notes N of 8", "The Makers' marks N of 6",
  "Old foes, asleep and patted N of 7", "Hollows in the fog-silk N of 3", "Good turns done in town N of 6", "The two Houses
  nobody has to visit N of 2". While Gran is shut in under the Well it says how many are new since. Everything found:
  a red thread round the border, left loose. Seen-only secrets (S07-S10, S18, S33, S35) aren't counted (intended).
  Tests: secrets2.test.mjs (the quilt reads the tally; counts the late finds and the favours).
- **The tally** (src/80b_tally.js): every time Wren was brought home without choosing it (falls, sinks, dozes flown home,
  faints, the fog, Gran's pull), by place; shown in the Hall of Names and by Gran. Homeward flights and Stray House falls
  don't count. A save from a preset has no tally (`Stats.c.tally`), and then it's said without a number (intended).

### What optional content changes later

- **The bracelet.** At the Spool's Top, talk to Gran with it (after she's met, before all six great threads are cut):
  "Show it to Gran?" Shown (`bracelet_top`): she stops throwing, the room goes quiet, and she lets a pair of great threads
  go herself (the middle pair, or the last if the middle's gone): two fewer to cut; the ending adds Gran and Linnet walking
  up the north road. Not shown: at the bench in the ending Wren gives it to Linnet, who gives it to Gran. Either way
  `bracelet_given` and it leaves the satchel (T71: given at the bench). The strayhouse test checks the bench version.
- **The Long Hook**: the Hookline reaches 10 tiles, everywhere. Needed for the far isle (secret S31). Checked in the
  headless game: in the Stray House's Washhouse it hooks the tub from the east bank (13,5) straight over to 12,5, so the
  two stones aren't needed if the Unfinished House was done first (the room's sign says the plain hook is too short from
  the doorway). It follows the rules and skips no reward; whether it's wanted is for David. Other places where 7 was the
  limit are worth probing the same way.
- **Six notes**: Biscuit's collar (secret S25). **All Ahas** (secret S30): Tuck's drawing on Gran's dresser in the ending.
- **The epilogue's evidence** (src/80d_after.js) counts Linnet's notes found, among much else, for Gran's lines and the
  ledger.

### Known accepted behaviour (optional content)

- The Stray House: falls climb out where you fell in (no flight home); loose strays reset on entry; filled holes stay.
- The quilt never gives the valley's secrets a total; seen-only secrets aren't sewn on.
- The goal line after House 1 still says "tell Gran" after you have (it names the next House too, and moves on at the
  Kiln's Knot); after House 5 the clinic hint stays likewise.
- Second ways listed under each House above (QA_REPORT 2026-11-10).
- Mabel's tin rung but left lies down again: no favour done behind your back (test).

### Found while making the saves (for the tester to confirm; nothing was changed)

1. **The beach below the falls is a trap (likely softlock).** Ride the ferry over the falls and step ashore: entering the
   beach's region makes it Wren's mark (src/16_world.js, region marks), the beach is shut in (11 tiles), a fall into the
   river flies her straight back to it, the ferry goes home, and the overworld's Save tab has only "Save here" and "Save and
   go to the title". Reproduce: T18 (no Bedroll yet): board the ferry (it crosses the river on row 106; the west landing
   is 166,106), paddle south over the falls, paddle east, step onto 170,115; walk into the water: back on the beach,
   for good. Way out only if the Bedroll was laid elsewhere first (Homeward). (The bottle's old text, replaced by note 5
   in src/77_strayhouse.js, said "I fell in on purpose and went home the quick way": the intent was a way home.)
2. **The Pile's Heartstitch can be walled in.** Beaten in a corner nook, it comes apart into two strays on its own tiles
   and the Heartstitch lands on the tile between them, closed in by walls (seen twice: north-east and south-west nooks).
   Leaving the House and coming back puts it in the middle of the room (the build hook), so it isn't lost.
3. **Linnet's note 4 doesn't appear until the Belfry is entered again.** Its `if: 'belfry_echo'` is read when the House
   is built: sing the lullaby, and the note isn't there until you leave and come back (or reload). The chest is.
4. **The goal line after the optional Houses.** After the Pile it says "West of the Pile's room: Linnet's own room." and
   still does outside, in town, and inside the Unfinished House (T67-T69); Mr Ives's chair sets it to nothing, so the menu
   shows "Wander." (T70) until the story sets another. The main goal (the fog at the Frayed Edge) isn't restored. Done
   before the Loom (from T45), the Pile's goal would replace the Loom's (unverified).
5. **Notes 4, 5 and 8 use the outdoor wording**: "carved a little L into the ground... Tucked into the grass beside it, a
   folded note" for a note pinned in a tower room, a bottle on a beach and a note on floorboards (cosmetic).
