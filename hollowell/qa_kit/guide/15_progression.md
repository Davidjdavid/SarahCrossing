## The shape of the whole game: order, gates and story stages

Use this to judge whether a state is consistent: the right gate open, the right people where they should be, the goal
line up to date. Flags are the story's own (`Progress.flags`); per-room flags (doors, chests, keys inside a House) are in
each House's section. The goal lines below were checked against a recorded game played from a new game to the credits.

### 1. The main path as a chain of gates

| # | Gate | What opens it | What it opens | Goal line set |
|---|---|---|---|---|
| 1 | Wren's room | a new game | Gran downstairs (`talkedGran`) | "Get up and go downstairs to see Gran." |
| 2 | The ceremony | stepping out of the house after Gran | the Wanderstaff (the stick); `ceremony` | "Go to the Well in the middle of town, where everyone is waiting." then "Find the Tidyhouse in Meadowfold, south of town, and tie its Knot." |
| 3 | Meadow road (south) | nothing | Meadowfold, House 1 the Tidyhouse | |
| 4 | House 1 | its own keys and Pattern | the Gloves (`gotGloves`), the Knot (`d1`) | "Go back to Hollowell and tell Gran. Next, the Kiln in Kilnridge: the canyon road west of Meadowfold." |
| 5 | Canyon boulder | the Gloves (pull it into its niche) | Kilnridge (`kilnPass` once through), House 2 the Kiln | |
| 6 | House 2 | | the Hookline, `d2` | "Back to Hollowell. Then east: the broken bridge in Meadowfold, and Millwater beyond it. Your Hookline should get you over." |
| 7 | Broken bridge | the Hookline (eyelets on the far piers) | Millwater, House 3 the Millrace | |
| 8 | House 3 | | the Paddle, `d3` | "Next, Belfry Heights: across the lake from Millwater, up the cliff stair. (The Paddle will get you over.)" |
| 9 | The lake | the Paddle | the cliff stair, Belfry Heights, House 4 the Belfry | |
| 10 | House 4 | | the Recall Bell, `d4` | "Home to Hollowell: it is the Knotting Festival." |
| 11 | The festival | entering the square after `d4` | `festival`; Gran points east | "The east road out of town: the sleeping giant. Ring the Recall Bell at it." |
| 12 | Sleeping giant | the Bell rung at him | `giant_awake`, `giant_home`; Hushwood | "Hushwood: find the Slumberhouse, over the stream." then, inside, "Inside the Slumberhouse: find its Knot, and tie it." |
| 13 | House 5 | | the Bedroll, `d5` | "Home to Hollowell. (Somebody at the clinic will want to hear all about it.)" |
| 14 | The high mesa | the Bedroll laid up top in Kilnridge, then a jump into the straw (`leapt`) | Larkspur Fair, House 6 the Marionette Hall | (unchanged, see 4.2) |
| 15 | House 6 | | the Crossbar; its boss and the first reveal (`reveal1`); `d6` | "Tie the Dancing Knot. Then: the Inn in Hollowell, the door marked STAFF ONLY." then "Hollowell: the Inn, and the door marked STAFF ONLY. The Makers are waiting below." |
| 16 | The Inn's Staff door | `reveal1` | the Underside (`underside_first`, `met_gundry_below`) | "The Spoolworks: through the big door in the Guild Hall, under the Inn." |
| 17 | House 7 | | the Needle; the Tangle; `d7` | "Up to the Guild Hall, under the Inn: Gundry has a job for you." |
| 18 | Gundry's job | talking to Gundry (`gundry_job`) | the Making Floor: Makings 1 to 8 (`making1`..`making8`), then the ninth, Wren's own (`making9`, `makings_done`) | "The Making Floor, east of the Guild Hall: run Tuck's Little Wander from underneath."; after the fifth: "...the sixth Little House is open. Otto is coming too, as the Housekeeper."; after the eighth: "The Making Floor's last little door: set out a Little House of your own, hide the button, then let Tuck in." |
| 19 | The Way Down | `makings_done` | the deep store; Tuck's spool; the Hall of Names; the second reveal (`reveal2`): Wren wakes in bed | "The Way Down, off the Making Floor: fetch Tuck's fresh spool from the deep store." then "Tuck's spool is in your satchel. (And there's a door east, into the old hall...)" then "Linnet cut herself loose with the First Spinner's Shears, from the old Loom. Gundry, under the Inn, may know where that is." |
| 20 | Gundry, again | talking to him (`gundry_r2`; he gives the Guild's key) | | "The north gate: its counterweight is in the Seams (east), under the town. Give it a new place." |
| 21 | The north stone gate | the Needle on its counterweight in the Seams (`north_gate`; done before `reveal2` it's secret S32) | the North Road, the Loomwood | "Through the north gate, up the Loomwood road to the Loom." |
| 22 | The warp across the Loom's door | four weights in its four sockets (the Loomwood) | House 8 the Loom (`loom_open`) | "Inside the Loom: the First Spinner's Shears are somewhere in here." |
| 23 | House 8 | (no nudges in it) | the Shears; the Weaver; `d8` | "The Shears are yours. The Loom goes on, past the big door by the Shuttle's lane, to the First Spinner's own loom." then "The Shears can cut anyone free. The town, first? And then the fog at the Frayed Edge, and your own thread." |
| 24 | The fog | the Shears on Wren's own thread (`cut_self`) | the Drift (`drift_first`) | "Into the fog, at the Frayed Edge. Nothing will pull you back now." then "Somewhere out here, west across the stream, a cottage with a garden, and someone in it." |
| 25 | The Drift's stream | a stray boulder pushed in | Linnet's garden; meeting her (`met_linnet`, `great_pull`) | "Back to Hollowell, on foot. Gran is pulling the whole valley down the Well." |
| 26 | The square in the Pull | coming near the Well (`pull_seen`) | the Well open | "Down the Well, to the Great Spool." |
| 27 | The Great Spool | the Well | six Knot rooms (`untie:<house>`), the Climb's gate (`spool_all`) | "Untie the Knots of the Wander, in the rooms round the Spool's foot (n of 6)." then "Up the Climb to the top of the Spool. Gran is there." |
| 28 | The Top | the Climb | six great threads (`great:<house>`, `spool_cut`), Gran's hand | "Cut the Spool's great threads, at their posts round the walls (n of 6). Too taut to cut, unless something knocks one slack." then "Take Gran's other hand." |
| 29 | The Unwinding | holding Gran's hand | `unwound`; credits; the free valley | "The valley is yours. Carry on." |

### 2. The story by stage (what a correct state looks like)

**Prologue** (S01-S02). Wren wakes on the morning of her Wander; Gran (the Warden of the Well) is downstairs, then at the
Well for the ceremony, where the Wanderstaff is given and Miss Quill reads the Rules of the Return. Gran stands by the Well
from then until the second reveal. Before the first Knot the children play tag, Fisher Hob walks the bank, Pudding chases
a ball, Biscuit the cat wanders. The valley map is drawn whole (faint); the fog turns Wren back at every edge.

**Act I, the Wander** (Houses 1-4; S03-S23). A House at a time, each with its Maker's thread colour; after each Knot a
wordless shot of the Well's winch turning a notch by itself. The town grows stiller as Knots are tied: after the first,
the Inn's attic (the Tidiness Trials) and the children's Housekeeper game; after the second the children stop playing tag
(`tagStopped`); after the third Hob stops walking his round; after the fourth, the Knotting Festival (bunting, the Makers
of Houses 1-4 arriving late from four directions with their House's dust on them), Returnball, and Pudding lies by his
ball and stops chasing it (until the Unwinding). After each House Gran has new lines naming the next place (the "visit
home" the goal line suggests).

**Act II, the Seams** (Houses 5-6; S24-S33). The giant woken and gone home; Hushwood; the Slumberhouse (Wren's own mark).
Then Larkspur Fair, reached by jumping off Kilnridge's high mesa (only with the Bedroll laid up top), and the Marionette
Hall: its boss falls and the toymaker Jory is caught at its controls: **the first reveal** (`reveal1`): the Houses are made
and run by the townsfolk, the Makers. From here: the Options' "Hints" are "Makers' nudges"; the Inn's Staff door stands
ajar; the Makers own up when talked to; the Well's motto has a scratched note under it.

**Act III, below** (House 7, the Makings, the second reveal; S34-S44). The Underside under the town (the Guild Hall,
Gundry, the Seams, the workshops); the Spoolworks (the Needle). Wren is made an apprentice and runs Tuck's Little Wander
from below (eight Little Houses the Makers built, then one she sets out herself). The Way Down: the deep store and the
Hall of Names, a spool for everyone in the valley; Gran's ledger; Gran comes down and pulls Wren's thread: Wren wakes in
bed (**the second reveal**, `reveal2`). From here: Gran has shut herself in the well cellar (`well_locked`; she is no
longer by the Well); everyone's thread is drawn; the town's lines are uneasy; fainting now wakes Wren with Gran's hand
felt on the thread (S33); the quilt's count is taken (`quiltR2`, a number).

**Act IV, loose ends** (the north gate, House 8, cutting free, the Drift, the Pull, the Great Spool; S45-S57). The north
gate open (Constable Burr: "Go on, then."), the Loomwood, the Loom (no nudges; the Shears). People cut free walk a round
of their own with new lines; the uncut talk about the Shears. Wren cuts her own thread at the Frayed Edge (no more hearts
on screen), crosses into the Drift, finds Aunt Linnet; Gran feels it and begins the Great Pull: in town, everyone with a
thread is dragged in an arc round the Well; indoors and below are empty of them; the Well's cap is off. Down the Well,
the Great Spool; at its top Gran at the drum.

**Epilogue and after** (S58). Every thread slack; everyone free on a round of their own with new lines; the Makers keep
their Houses' threads by choice; Gran and Linnet on the bench by Gran's gate; Linnet gone from the Drift; the Well
re-carved (one new word); the cellar open; the title changed ("Carry on").

**Contradictions worth reporting**: Gran by the Well after `reveal2` (she should be shut away, then at the Spool during
the Pull, then on the bench); anyone with a thread indoors during the Pull; someone cut free still dragged; a townsperson
on their old fixed spot after `unwound`; Linnet in the Drift after `unwound`; "Hints" not renamed after `reveal1`; hearts
on screen after `cut_self`; a goal line naming a place already done.

### 3. Optional content, and when each part opens (details: the optional-content section)

- From the start: S01 pushing townsfolk (all 24 for Arlo's scarf); S02 the turned portrait (the Gloves) and Linnet's
  Trail from it; S03 Biscuit's route; Heart Patches lying about (38 in all); the Well's motto (S35, read in every act).
- After Knot 1: the Tidiness Trials (S28), the children's Housekeeper game (S12), the town's favours begin (the Guild's
  crates, then the kite after Knot 2, Tuck's marble, Mabel's tin after Knot 4, Jory's back room after the first reveal,
  Rosa's saucer with the Needle), each House's Maker's signature room (S06) and secrets inside Houses.
- After Knot 4: Returnball (S29). Each region's own finds open with the tools (the Old Fold, the ringers' bell, the Crags,
  Kilnridge's vents, Heron Rock, Lantern Pond, the nursery, the parade gate, Millwater's later places...).
- After each boss: revisit the arena to pet the boss asleep (S14, all seven).
- Act III: the logbooks (S22), the peepholes (S23), Tuck's Ahas (S30, three in every Making), the north gate early (S32),
  the Unfinished House with the Guild pin (S26; or after the Loom).
- Act IV: cutting people free (S24 Arlo's walk), the fog-silk hollows, the Stray House (S27, with Linnet's eight notes),
  the balloon, the Drift's mill, the seed (S11).
- Can be skipped entirely: all of the above. The Makings can't (they open the Way Down).

### 4. Order, late visits and points of no return

**4.1 What can be done in another order**
- The Houses are a fixed chain (each needs the last one's tool to reach), and Knot order is fixed except inside the Great
  Spool, where the six Knot rooms can be untied in any order (the goal counts them).
- The visit home the goal line suggests after a House can be done late or never: Gran's lines are said whenever Wren next
  talks to her (the catalogue's route skips them, so S08-S12, S14-S17 and S29-S32 still show the "go back and tell Gran"
  goal while Wren is already further on; that is a valid path, not a stale state).
- Townsfolk can be cut free before or after Wren's own thread, during the Pull, or never (the Unwinding frees everyone).
- The north gate's counterweight can be re-threaded before the second reveal (S32).

**4.2 A goal line that doesn't move** (worth a look). After House 5 the goal reads "Home to Hollowell. (Somebody at the
clinic will want to hear all about it.)" and stays so until the first reveal. Checked from S28: visiting the clinic
(Doctor Mallow) and talking to Gran (who names Larkspur Fair, below the high mesa in Kilnridge) leave it unchanged, and the
map's flag stays on the clinic. Elsewhere the goal line names the next place.

**4.3 Points of no return and missables**
- Cutting Wren's own thread: no more fainting (S33 no longer possible), no hearts, the tally stops; the fog no longer
  pulls (S11's fog way gone; the seed is still at Linnet's gate).
- The Great Pull: until the Unwinding, the town is in the Pull (people dragged, interiors empty of the uncut). Everything
  else in the valley stays open meanwhile.
- The Unwinding: everyone is freed at once (the moment of cutting someone free and its line can't be had after it); the
  Great Spool can't be entered by the Well any more (only by Homeward if the Bedroll lies there); the Drift's Linnet is gone.
  Optional content in the valley stays open after the end (the free valley).
- The bracelet changes the top room only if it's shown before the end; otherwise it's given on the bench in the epilogue.
- Pre-Unwinding lines (the uncut's, the Pull's, Gran's at the Spool) are gone after it.

### 5. The story flags in the order a game sets them (main path)

Grouped by stage, in the order the recorded game set them; per-room House flags left out. (A flag only an optional path
sets is in brackets.)

- **Prologue**: `talkedGran` (spoke to Gran on the first morning), `ceremony` (the Wanderstaff given).
- **House 1**: `told:key`, `told:plan`, `told:pattern` (first-time explanations of a key, a Plan, a Pattern), `pie` (the
  warm pie, S05), `tidy_monger` (the mini-boss), `gotGloves`, `tidy_ballDone`, `tidy_boss`, `tidy_knot`, `d1`.
- **House 2**: `kilnPass` (through the canyon pass), `kiln_glazer` (mini-boss), `kiln_boss`, `kiln_knot`, `d2`,
  `tagStopped` (the children stop playing tag).
- **House 3**: `millrace_snapjaw` (mini-boss), `millrace_twoWheels`, `millrace_boss`, `mill_knot`, `d3`; leaving it with a
  key: `keys_tug`, `s08`.
- **House 4**: `cl_tip`, `belfry_clangor` (mini-boss), `belfry_reach`, `belfry_ropes`, `belfry_frame`, `belfry_tollAwake`,
  `belfry_boss`, `belfry_knot`, `d4`.
- **Festival and Hushwood**: `festival`, `giant_awake`, `giant_home`.
- **House 5**: `slumber_open`, `bed_first`, `told:bedmark`, `matron_met`, `slumber_matron` (mini-boss), `bedroll_laid`,
  `slumber_mwGate`, `slumber_longway` (the Pattern's chain), `slumber_slothAwake`, `slumber_boss`, `slumber_knot`, `d5`;
  [`mallow_d5` at the clinic].
- **Larkspur and House 6**: `leapt` (the jump into the straw), `hall_open`, `flat_first`, `marionette_tinAwake`,
  `marionette_tin` (mini-boss), `crossbar_first`, `marionette_gmAwake`, `marionette_boss`, `reveal1` (the first reveal),
  `marionette_knot`, `d6`.
- **The Underside and House 7**: `fair_gate` (the fair's bolt drawn), `inn_staffSeen`, `underside_first`,
  `met_gundry_below`, `hatch_down`, `hatch_up`, `spool_cw`, `knot_first` (first tie-off below), `spool_cog` (mini-boss),
  `needle_first`, `tangle_open`, `tangle_drop`, `spool_boss`, `d7`.
- **The Makings**: `gundry_job`; for each Little House `makingN` and `makingN_ahas`; `tug_first`; `cap_given`,
  `cap_seen`, `cap_letin` (the ninth: given, seen, Tuck let in); [`s30` for every Aha in all nine]; `makings_done`.
- **The second reveal**: [`hall_held` if Wren holds on at the lectern]; `reveal2`, `well_locked`, `quiltR2`;
  `gundry_r2` (the Guild's key).
- **Act IV**: `north_gate` [`s32` if before `reveal2`], `north_gate_seen`, `loom_open`, `shuttle_jam`, `loom_shuttle`
  (mini-boss), `cut_first` (first snip), `silk_parted`, `weaver_cocoon`, `silk_bound`, `weaver_down`, `loom_boss`, `d8`;
  [`cut:<who>` for each person cut free].
- **The fog, the Drift and the Pull**: `cut_self`, `drift_first`, [`s11` the seed], `met_linnet`, `great_pull`,
  `pull_seen`, [`seed_planted`].
- **The Great Spool**: `gs2` (version flag), `gs_entered`, `gs_foot_told`, `wound_first`, [`ratchet_told`,
  `arch_scraped`, `junk_hit`, `taut_told`], `untie:tidy`, `untie:kiln`, `untie:mill`, `untie:belfry`, `untie:slumber`,
  `untie:marionette` (any order), `spool_all`, `spool_met`, `slack_seen`, `great:slumber`, `great:marionette`, `gs_s1`,
  `great:mill`, `great:belfry`, `gs_s2`, `great:tidy`, `great:kiln`, `spool_cut`; [`bracelet_top`].
- **The end**: `aft:snap` (the evidence noted), `unwound`, `cut:<everyone>`; [`bracelet_given`, `motto:act4`, `s35`,
  `aft:sat`, `aft:ledger`].
