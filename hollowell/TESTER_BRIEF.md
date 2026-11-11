# Brief for an outside tester (an AI or a person)

You are play-testing an unreleased single-player browser game, made for one person who hasn't played it yet. They
want to know whether it can be finished and what goes wrong along the way, **without learning anything about the game
themselves**. Please read all of this before you start.

## The rules
- The game runs in a web page (the link or file you were given): click the game or its Play button, then use the
  keyboard. It doesn't pause while you think, so give each keypress a moment to take effect.
- Play the game as a player would: from a new game, with no outside help.
- Don't read the game's source code, its files or any repository it came from: they contain the answers. Don't add
  anything to its address (such as `?debug`) and don't use the browser's developer tools to change the game.
- The title screen shows the controls, and Options can change them (keyboard or a controller). The game saves in the
  browser: use Save in its menu now and then, so a crash or a closed tab doesn't cost you the run.
- Take your time. If you're stuck somewhere for a long while, note it (where, for how long, what you tried) and keep
  trying other things; that note is one of the most useful things you can give.
- If a fight beats you over and over, note how many tries it took and what kept going wrong.
- Keep a running log as you go, so the report holds everything even if you run out of time.

## What to report
1. **Bugs**: anything that looks or behaves wrong (something drawn in the wrong place, something you can walk
   through or get stuck in, a sound that cuts out, an error, a freeze, text that runs off its box). For each: where
   you were, what you did, what happened, and what you expected.
2. **Stuck points**: where you didn't know what to do next or how a puzzle worked, how long it took, what you tried,
   and what finally worked (or that nothing did).
3. **Unfair or confusing moments**: a puzzle you solved without understanding why, a fight that felt unreadable, a
   line that gives too much away or not enough.
4. **Text**: typos, awkward lines, a line that doesn't match what's on screen.
5. **Performance**: stutters, slow moments, anything that felt sluggish.
6. **Overall**: how far you got, about how long it took, what was best, what was weakest.

## Two reports, please
- **A short summary for the person it's made for**, with no spoilers at all: no names of places, people, things or
  tools, nothing about the story, the puzzles or how anything works. Just how far you got (as a rough fraction of the
  game, if you can tell), how many bugs and stuck points you found, how serious they seemed, and how you'd rate the
  experience overall.
- **The full report for the developer**, with every detail, spoilers and all. If you can, put it in a downloadable
  file (`developer-report.md`) rather than in the chat, so it can be passed on without being read; if you can't, put
  it at the very end, in a separate block clearly headed "FOR THE DEVELOPER: FULL SPOILERS", after the summary.
