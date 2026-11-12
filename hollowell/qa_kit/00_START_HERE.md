# Hollowell: QA package — start here

You have been asked to do an independent quality-assurance evaluation of **Hollowell**, a finished single-player
game that runs in a web browser. It was made for one person, who has not played it yet and wants to play it
**without spoilers**. That person will hand you this package and pass your detailed report on to the developer
without reading it. This file and files 01 and 02 contain no spoilers. Files marked CONFIDENTIAL contain all of
them.

## What's in the package

| File | What it is | Spoilers |
|---|---|---|
| `00_START_HERE.md` | This page. | none |
| `01_QA_INSTRUCTIONS.md` | What to test, how to judge what you find, and the two reports to write. | none |
| `02_HOW_TO_RUN.md` | Opening the game, the controls, saving and loading, the test saves, the debug options, and the limitations. | none |
| `03_SAVE_STATES_CONFIDENTIAL.md` | The test saves: what each one is, where it loads, and how each was checked. | **all** |
| `CONFIDENTIAL_GUIDE.md` | The reference guide: every system, area, puzzle and fight; solutions and why they work; what is meant to be blocked; the state each step sets; known accepted behaviour. | **all** |
| `hollowell_qa.html` | The whole game in one file, with a list of the test saves built in. Works offline. | none on screen |
| `saves/` | The test saves as data: `save_states.json` (all of them, with details) and `codes/TNN.txt` (one save code per file). | in `save_states.json` |

The same game is also online at the link in `02_HOW_TO_RUN.md`.

## How to go about it
1. Read `01_QA_INSTRUCTIONS.md` and `02_HOW_TO_RUN.md` in full.
2. Open the game and get comfortable with the controls on a new game for a few minutes.
3. Skim the contents of `CONFIDENTIAL_GUIDE.md` and its system chapter, then work through the game using the test
   saves (`03_SAVE_STATES_CONFIDENTIAL.md`) and the guide's sections for each area, as the instructions describe.
4. Keep a running log. Write both reports as you go, so nothing is lost if you run out of time.

## Three rules that matter most
- **Spoilers stay out of the summary for the person the game is for.** The short summary you write for them must
  not name or describe any place, person, thing, tool, mechanic, puzzle or story event (details in
  `01_QA_INSTRUCTIONS.md`). Everything else goes in the detailed developer report.
- **Hard is not broken.** Difficult puzzles, intentional ambiguity, unusual rules and unconventional design are
  deliberate. A defect is where the game does not do what it is designed to do (the guide says what that is), or
  where something goes wrong that no design would want (a crash, a softlock, lost progress, a contradiction). Your
  opinions on design are welcome, but report them separately, as observations.
- **Test the game as it is.** Don't change its files or its code. Debug options exist (see `02_HOW_TO_RUN.md`), but
  anything found with them must be reproduced without them, from a test save or normal play, before it counts.
