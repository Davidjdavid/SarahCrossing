# A surprise game

**To play:** open `play.html` in a desktop web browser (Chrome, Firefox, Edge or Safari).
It's one self-contained file — no install, no internet connection, no server needed.
Keyboard is best; on a touch screen, on-screen buttons appear.

Your progress saves automatically in the browser (choose *Continue* on the title screen).
Sound is on; press the menu key in game to turn music or sounds off.

---

**Don't read further if you want to be surprised.** The folder `SPOILERS-dev-notes/` holds the
full design notes and walkthrough, and `tests/` plays the whole game through. Everything you
need to know is taught inside the game.

### For developers

- `npm run build` – joins `src/*.js` (in file-name order) into `play.html`
- `npm test` – checks the world data, the rules, a full scripted playthrough and random-play fuzzing
- `npm run e2e` – builds, then runs the game in headless Chromium (Playwright)
