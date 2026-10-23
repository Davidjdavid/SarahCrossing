# Sarah Crossing

A cozy island game that runs on Sarah time, online at **https://sarahcrossing.com**.

It started as a one-page game (`Sarah_Crossing2.html`); this repository is that game split into
real source files, with a server around it, so the islands are kept online and follow Sarah from
device to device. Saves from the one-page game come straight in (**Import a save** on the title
screen).

- **Putting it online / connecting the server and the domain:** [docs/DEPLOY.md](docs/DEPLOY.md)
- **Notes for working on the code (also read by Claude):** [CLAUDE.md](CLAUDE.md)

## Playing it on a computer

Node.js 22 or newer.

```
npm install
npm run dev          # builds the game, then serves it at http://127.0.0.1:8090 (no password)
```

Islands made this way are kept in `data/` (not in git).

## What's where

```
game/
  index.html           the page
  style.css            the look
  src/*.js             the game, one file per part, joined in file-name order by the build
                       (00_core ... 90_main; 11_save + 12_cloud are saving, 6x_islands the island list)
  assets/              sprites (atlas.png + atlas.json), the island ground (ground.png, recolored
                       per season by ground-palettes.json), world.json (the map), gamedata.json
                       (items, furniture, recipes...)
server/
  server.mjs           the game server: password, the islands API, the game's files
  islands.mjs          islands on disk: saves, revs, backups, trash, photos
scripts/build.mjs      builds dist/ (what the server serves)
deploy/                server setup and release install, run by .github/workflows/deploy.yml
tests/                 npm test (server, storage, build, deploy scripts); npm run test:e2e (the game
                       in Chromium, importing saves made by the one-page game)
tools/split-html.mjs   how the one-page game was split into game/ (kept for reference)
```

## Checks

```
npm test             # quick: server, storage, build, deploy scripts
npm run test:e2e     # the game in a real browser (first: npx playwright install chromium)
npm run check        # both (what CI and the deploy run)
```
