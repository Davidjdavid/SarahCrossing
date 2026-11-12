# Hollowell: QA instructions

## The goal
An independent evaluation of whether the game works: whether every part of it does what it is designed to do,
whether it can be broken, and whether anything stands between a player and the end. The game is finished and has
been through the developer's own testing (an automated test suite of several hundred checks, scripted
playthroughs, and full playthroughs in a real browser). Your job is to find what those missed: especially what a
person playing freely would run into, and what only shows up in an unusual order, after a save and a load, or at
the edges of the rules.

The design is deliberate. The person this game is for asked that its difficulty, surprises, mysteries and
unconventional ideas be kept. **Do not report "this is hard", "this is unclear" or "this is unusual" as a defect.**
If you think something is unfair or unclear, report it as an observation, with your reasons; that is useful too.

## What a defect is
Something the game does that differs from what it is designed to do (the guide describes the design: where it says
what is expected, compare against that), or something no design would want:
- a crash, an error, a freeze, or the game stopping responding;
- a softlock: a state from which progress is impossible (and whether the game's own ways out help: the guide's
  systems chapter lists them);
- lost or corrupted progress: something earned that disappears, a save that won't load, a load that puts you
  somewhere wrong or changes what you have;
- a contradictory state: two things true that can't both be (a door both open and in your way, someone in two
  places, a line that refers to something that hasn't happened yet, a reward given twice or never);
- a puzzle solvable in a way the guide says must be blocked, or not solvable the way the guide says it is;
- something drawn wrongly (in the wrong place, over or under the wrong thing, clipped, flickering, a gap between
  tiles), text that overflows or is cut off, interface elements covering what matters, unreadable contrast;
- inconsistency: the same thing behaving differently in two places without a reason the guide gives;
- poor performance (stutter, slowdown) in a normal browser.

## What to test
Cover every area. The test saves let you start anywhere; the guide tells you what each place is for.

1. **Follow the design.** For each area, room and fight, check that it behaves as the guide says: the intended
   solution works, the expected outcome happens, the state it should set is set (doors stay open, things stay
   collected, the goal line moves on).
2. **Alternative solutions.** Where the guide lists other valid ways, check they work. Try your own. A new working
   solution is not a defect unless it skips the idea the room is about (the guide's "Idea" line says what that is)
   or contradicts the guide's list of what must be blocked.
3. **Prohibited shortcuts.** The guide lists shortcuts each puzzle must block and how. Try each, and try to find
   others: racing, standing in doorways, throwing or pushing things where they shouldn't go, using later tools in
   earlier places, leaving mid-puzzle.
4. **Unusual orders.** Do things out of the expected order: skip optional visits, do optional things early or late,
   come back to finished places, take things in a different order than the guide's, return to earlier places with
   what you gained later.
5. **Save and load.** Save (and load) mid-puzzle, mid-fight, right after a reward, during and after scenes where the
   menu allows it, in every kind of place. Check that what you load is what you saved, by the rules the guide's
   systems chapter gives (some things reset on purpose). Use save codes to carry a state; load the same code twice and
   compare.
6. **Softlocks.** Try to get trapped: shut doors behind you, strand movable things, fall or get pushed into places,
   use up resources. For each trap, note whether the game's own ways out work.
7. **Edge cases.** Walls, corners, doorways, room edges, the screen's edges; many things moving at once; pressing
   buttons during transitions, scenes and dialogue; pausing at odd moments; holding two directions; extremely long
   play in one place; the longest player name allowed; every option in Options.
8. **Graphics and interface.** Text fits its box; the dialogue box, notices and on-screen indicators never hide
   what you need to see; sprites are drawn in front of and behind the right things; nothing floats or sinks into the
   floor; consistent art style; the map and menus are correct and readable; the screen scales cleanly in different
   window sizes; full screen.
9. **Consistency of the story's state.** At each stage, people are where they should be and say what fits; signs,
   the goal line and the journal agree with what has happened.

## How to work
- Use the test saves to reach each area, and play it through with its guide section beside you. Where you can, try a
  room before reading its solution: if you find it hard, that is an observation, not a defect; if the guide's
  solution then doesn't work, that is a defect.
- Prefer playing as a person would: the keyboard (or a controller), in real time. The game doesn't pause while you
  think: open the menu (Enter) when you need a moment.
- When you find something, reproduce it once more before reporting it, and save the state just before it
  (`02_HOW_TO_RUN.md` explains how to copy a save code). A save code that reproduces a bug is the most useful evidence
  there is.
- Keep a log as you go: what you tested, where, what happened. Untested areas should be listed as untested, not
  left out.
- Debug options (`02_HOW_TO_RUN.md`) are for investigating, not for finding: anything you find with them must be
  reproduced without them before you report it as a defect.

## Severity
- **Blocker**: the game can't be continued or finished: a crash, an unrecoverable softlock, a save that can't be
  loaded, progress lost.
- **Critical**: a serious fault with a workaround: a softlock only one of the game's escape options or reloading gets
  you out of, a reward or story step that can be missed for good, a state contradiction that confuses progress.
- **Major**: a puzzle or fight not behaving as designed (a blocked shortcut that works, a solution that doesn't), a
  wrong state after a load, a visual or interface fault that hides something needed.
- **Minor**: something wrong that doesn't get in the way: a small inconsistency, a misplaced sprite, a text glitch.
- **Cosmetic**: a small visual or wording blemish.
- **Observation**: not a defect: a design opinion, a clarity concern, a suggestion. Keep these in their own section.

## The two reports

### 1. The developer report (detailed, confidential)
A file named **`developer-report.md`** (or, if you can't make a file, the last part of your answer, under a heading
"FOR THE DEVELOPER — FULL SPOILERS", after the summary). It holds everything, spoilers included:
- What you tested: areas and save states covered, how long, in which browser; what you didn't get to.
- Each finding: an ID (F1, F2...), severity, the area and room, the save state you started from, exact steps to
  reproduce, what happened, what was expected (cite the guide section), how often it happens, the save code at the
  moment (or just before), and whether the game's own ways out help.
- Observations, separately: what you found hard, unclear or unfair, and why.
- A short overall assessment.

### 2. The summary for the person the game is for (no spoilers at all)
A few short paragraphs they can read safely. It must **not** name or describe any place, person, creature, item,
tool, mechanic, puzzle, event or anything about the story or how the game works, and must not hint at any of it.
Allowed:
- how much of the game you covered (as fractions or "the early, middle and late parts", "after the ending"), roughly
  how long you spent;
- how many findings at each severity; the test save IDs (T01, T02, ...) where they happen, which are only numbers;
- whether you think the game can be finished, and how solid it seemed overall;
- general, content-free remarks ("text sometimes overlaps", "a crash in the late part").

When in doubt, leave it out of the summary and put it in the developer report.
