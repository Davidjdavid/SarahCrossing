# Sarah Crossing: notes for working on it

A single-player cozy island game (in the spirit of Animal Crossing) made for Sarah, played online
at https://sarahcrossing.com. Vanilla JavaScript on a canvas, no framework, no bundler; a small
Node.js server (built-in modules only) keeps the islands. See README.md for the layout and
docs/DEPLOY.md for the server.

## The game code (game/src)

- The files are **one script**, joined in file-name order by `scripts/build.mjs` (`00_core.js` has
  the `'use strict'` that covers all of it). Everything is global: a top-level `const` in one file
  is used by others. A new file's name decides where it lands (`2a` sorts after `29`, `6x` after
  `6w`, `90_main.js` is last and boots the game).
- Match the existing style: 4-space indent, single quotes, compact lines, `/* lowercase comments */`
  that say why. Helpers to know: `el(tag, cls, text)`, `btn(label, cls, fn)`, `chip()`,
  `UI.open({title, phone, back, foot})`, `UI.say/ask`, `UI.toast`, `Save.touch()` after changing `S`.
- `S` is the save (the island's whole state). `newState()` and `migrate()` are in `11_save.js`.
- **Old saves must always load.** Sarah's island came from the one-page game and lives on the
  server; any change to the shape of `S` needs a step in `migrate()` that upgrades older saves.
  `tests/fixtures/` has saves made by the one-page game; the end-to-end tests import them.
- With `window.__DEBUG = true` set before the page loads, `window.__dbg` (quick start, teleport,
  give items, set the time...) and `window.__game` exist. The end-to-end tests use them.

## The HD-2D view (31_render3d.js, 32*_hd*.js)

- `R3` draws the island and rooms in 3D (three.js r128 in `game/vendor`): the ground as textures,
  everything standing as a card drawn by its usual 2D draw code. The edit modes and minigames use the
  flat view; without WebGL (or with "HD-2D graphics" off in Settings) everything is the classic view.
- In HD-2D, people and remastered props are drawn with three times the detail into cards with three
  canvas pixels to a world pixel. `HDSprite` (32_hd.js) shades filled parts per pixel. People are built
  from a skeleton in 32a_hd_people.js (any look, outfit, sewn design and accessory: `hdPersonFrame`);
  neighbors are `HD_NPC`, hair `HD_HAIR`, accessories `HD_ACC`, and any atlas sprite can get an HD
  version in `HD_SPR[name]` (exactly 3x the old frame and anchor): `spr()` uses it in HD cards.
- The classic 16x24 art stays the source for menus, icons, the classic view and the flat modes.

## Saving (11_save.js, 12_cloud.js, 6x_islands.js)

- `Save.write()` keeps a copy on the device (`localStorage`, marked pending) and sends the island to
  the server (at once when forced, otherwise at most every 20 s). The pending copy is sent on the
  next visit if the page closed first.
- Every save names the server rev it was based on; the server answers 409 if the island moved on
  (another device). The player then picks which to keep (`IslandList.conflict` / `IslandList.fork`).
- Switching islands, importing and restoring reload the page (`IslandList.leave()`), so nothing of
  one island carries over into another.
- Save codes (`SC1:` = deflate + base64, `SC0:` = base64, or raw JSON) are the one-page game's
  format and still what **Save a file** / **Make save code** produce.

## The server (server/)

- `islands.mjs`: one folder per island in `DATA_DIR/islands/<id>/`, `island.json` written atomically
  with `state` last (so the list can read the summary without parsing the save). Backups: hourly
  while playing, all kept 2 days, then one a day for 60 days; plus `before-import`,
  `before-restore` and `before-overwrite` copies (90 days).
- `server.mjs`: the password (cookie signed with `DATA_DIR/secret`), the JSON API (writes need the
  header `X-Sarah: 1`), the built game from `STATIC_DIR` (hashed asset names, cached forever).
  Problems in the browser are posted to `/api/log` and end up in the server log.

## Checks

`npm test` (fast) and `npm run test:e2e` (Chromium via Playwright, ~2 min). Run both before pushing;
CI and the deploy run them too. Pushes to `claude/serene-mendel-8428vr` deploy to the beta site
(https://beta.sarahcrossing.com, its own islands); the live site (Sarah's island) only changes when
the Deploy workflow is run by hand with target `live` (or on a push to `main`). Never deploy live
unless asked.
