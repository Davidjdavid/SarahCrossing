# Game brief (the original project brief, as given)

PROJECT: CREATE AN ORIGINAL ADVENTURE GAME
You are acting as an independent game director, game designer, systems designer, programmer, and QA team.
Your assignment is to independently invent, develop, test, and polish an original video game for me.
I want to be surprised by what you create. I do not want to choose the genre, setting, characters, mechanics, puzzles, or story. Those decisions belong to you.
I want to play the finished game without knowing beforehand what you've created.
This is not a programming exercise or a collection of technical demonstrations. The result must be an actual, cohesive, entertaining video game.

## 1. UNDERSTAND THE PLAYER

Some of my favorite games include:

* Dragon Quest
* Classic Nintendo games
* EarthBound
* Undertale
* Outer Wilds
* Other games that reward exploration, experimentation, and discovery.

I particularly enjoy:
Discovery: Starting a game without understanding all its mechanics, secrets, possibilities, or underlying rules.
Exploration: Small, interesting worlds that are enjoyable to walk around. I like towns, hubs, interesting environments, hidden rooms, and discovering things off the main path.
Interconnected systems: I enjoy discovering that changing one seemingly insignificant property can have unexpected consequences throughout the game.
For example, a previous game you made allowed me to manipulate character properties. Setting weight to zero caused me to float over water. Changing the clock to an impossible time caused NPCs to disappear because their schedules no longer worked.
That was genuinely entertaining. Use that as an example of the kind of systemic discovery I enjoy, but do NOT simply recreate those mechanics.
Progression: I enjoy unlocking things, gaining new capabilities, discovering additional areas, and feeling like my understanding of the game is expanding.
Playfulness: I like Nintendo-style design where simple mechanics have surprising depth and interactions.
Meta gameplay: I enjoy games that play with their own rules, presentation, interface, genre conventions, or the player's expectations.

## 2. FIVE REQUIRED CREATIVE ELEMENTS

The game MUST meaningfully incorporate all five of the following.

A. An adventure with unusual underlying physics
Create an unusual system governing how the game world operates.
It could involve physics, object properties, causality, time, space, perception, interactions, or something you invent entirely.
It should be more interesting than assigning arbitrary numerical bonuses to objects.

B. A small explorable world
Create a cohesive, explorable environment.
I particularly enjoy the idea of an interesting central hub that connects different areas and evolves throughout the game.
The world should contain:

* Interesting objects to interact with.
* Optional discoveries.
* Secrets.
* Interesting environmental details.
* Places that become accessible through progression.
* Opportunities to experiment with the game's systems.

It should feel like a real little world rather than a collection of disconnected levels.

C. Manipulation of ordinary environmental rules
The player should be able to manipulate the rules of an otherwise recognizable environment.
The possibilities should be surprising and systemic.
Think about how objects, characters, environments, and game systems might respond when their underlying properties or rules are changed.
Do not limit this to conventional switches, keys, and doors.

D. A gradual genre transformation
The game should initially establish itself as one recognizable type of game.
As the player progresses, the experience should gradually evolve into something substantially different.
This transformation should be intentional, foreshadowed, and satisfying.
I want the player to eventually reconsider what kind of game they have been playing.
Do not simply add an unrelated minigame halfway through.

E. An entirely original core interaction
Invent at least one genuinely unusual gameplay mechanic.
Do not just combine recognizable mechanics from existing games.
Find an interesting interaction that you believe could sustain an entire game.
Build the game around it.
The mechanic should be understandable through experimentation, have consistent rules, and allow unexpected applications.

## 3. CREATIVE FREEDOM

You have complete creative control.
You may choose:

* The genre.
* The setting.
* The premise.
* The art direction.
* The characters.
* The core mechanics.
* The progression system.
* The world structure.
* The story.
* The ending.

You can combine genres or invent something that does not fit an existing genre.
Do not default to an RPG just because I like Dragon Quest.
Do not make another conventional JRPG, tactical RPG, platformer, farming simulator, or generic management game.
Do not make a clone of an existing commercial game.
Take inspiration from the qualities of my favorite games, not their specific designs.
I would rather play something unusual and original than a mediocre imitation of something familiar.

## 4. GAMEPLAY DESIGN

Prioritize actual gameplay over story, dialogue, and lore.
I enjoy:

* Experimenting with objects.
* Discovering unexpected interactions.
* Solving challenges through creative approaches.
* Exploring interesting environments.
* Unlocking new capabilities.
* Discovering hidden mechanics.
* Finding optional secrets.
* Seeing my actions change the game world.

Do not create puzzles that require guessing an arbitrary solution.
Prefer challenges where multiple solutions are possible because the underlying systems interact.
Avoid excessive tutorials. Let players learn through experimentation, environmental feedback, and increasingly interesting situations.
Give the world personality, but do not rely on hundreds of AI-generated dialogue lines or elaborate storytelling to carry the experience.
I want to PLAY the game.

## 5. SCOPE

Target approximately 45–75 minutes for a first-time playthrough.
I would rather have one excellent hour than a mediocre ten-hour game.
The game should have:

* A compelling opening.
* A satisfying gameplay progression.
* Several meaningful discoveries.
* A cohesive world.
* Optional secrets.
* A substantial middle section.
* A satisfying conclusion.
* Enough content to feel like a complete game.

Avoid unnecessary grinding, repetitive activities, empty exploration, and feature padding.
A small game with excellent mechanics is preferable to a large game with generic content.

## 6. TECHNICAL IMPLEMENTATION

Inspect the available development environment and choose the most appropriate technology.
Prefer Godot 4 if it is a good fit for the game. You may choose another engine if there is a compelling technical reason.
Use cohesive custom graphics, animation, sound, and presentation.
Do not spend excessive time building elaborate assets when simpler graphics would allow you to spend more time on gameplay.
Prioritize:

* Responsive controls.
* Consistent physics and interactions.
* Clear visual feedback.
* Smooth transitions.
* Readable interfaces.
* Reliable saving and loading.
* Stable performance.
* An easy launch process.

## 7. DEVELOPMENT PROCESS

Work independently through the entire development process.
Do not ask me to approve the creative direction or individual mechanics.

Phase 1: Private concept development
Generate at least 8 substantially different concepts.
Evaluate them based on originality, gameplay potential, suitability for my tastes, technical feasibility, and ability to deliver a satisfying complete experience.
Choose the strongest concept yourself.
Keep the alternatives and final design spoilers private.
Do not show me the concepts.

Phase 2: Prototype
Build a prototype of the core mechanic.
Test whether the underlying interactions are interesting and whether the mechanic can support meaningful gameplay.
If the prototype is boring, rethink the mechanic before building the entire game around it.

Phase 3: Full development
Build the complete game.
Implement the world, interactions, progression, secrets, challenges, presentation, and ending.
Prioritize a functioning complete experience over expanding the feature count.

Phase 4: Quality assurance
Perform several independent testing passes.
Check:

* Whether the game can be completed from beginning to end.
* Whether all critical mechanics function correctly.
* Whether physics and interactions behave consistently.
* Whether unintended solutions create problems.
* Whether progression works correctly.
* Whether the player can become permanently stuck.
* Whether saving and loading work.
* Whether the difficulty is reasonable.
* Whether optional areas and secrets work.
* Whether the ending triggers correctly.

Use automated tests, scripted playthroughs, and agent-based testing wherever practical.
Run the actual game and inspect its presentation, not just the source code.
Do not confuse passing tests with having a fun game.

Phase 5: Refinement
Perform at least three refinement passes:

1. Functionality, bugs, and broken interactions.
2. Gameplay balance, progression, and pacing.
3. Visual polish, animation, sound, and presentation.

Do not keep inventing features indefinitely.
Once the game is complete, prioritize refinement over new content.

## 8. AUTONOMOUS DEVELOPMENT AND PERSISTENT STATE

I want you to work with minimal input from me.
Create these project documents:

* GAME_BRIEF.md — This original project brief.
* DESIGN_NOTES.md — Your complete design decisions and spoilers.
* PROJECT_STATE.md — Current development status, completed work, unfinished work, problems, and next priorities.
* TEST_PLAN.md — Testing strategy and verification results.
* CHANGELOG.md — Significant development changes.

Also create or update CLAUDE.md with important project-specific instructions.
These files must allow you to resume development even if the conversation context is lost or a new session starts.
Maintain the project state after meaningful development sessions.
Use Git checkpoints if available.
When resuming, inspect the existing project and read the project state before making decisions.
NEVER restart the entire project just because a new session or scheduled check-in begins.

## 9. FOUR-HOUR CHECKPOINTS

I want the development process to include recurring four-hour check-ins.
Use Claude Code's scheduling capabilities if available.
Every four hours:

1. Review the existing project and PROJECT_STATE.md.
2. Evaluate what has been accomplished.
3. Identify unfinished work and weaknesses.
4. Continue implementing the highest-priority unfinished work.
5. Run relevant tests.
6. Update PROJECT_STATE.md and CHANGELOG.md.
7. Give me a brief, spoiler-free progress update.

Do not use these check-ins merely to write status reports. Continue actually developing the game.
Do not restart the planning process or discard working implementations.
Continue this process until the game meets the completion criteria.
Once the game is finished, verified, and ready to play, stop the recurring task.

## 10. SECRECY

I want to discover the game myself.
Do not reveal:

* The selected concept.
* The genre.
* The core mechanic.
* The setting.
* Major characters.
* Important secrets.
* Puzzle solutions.
* The genre transformation.
* The ending.

Keep spoilers in the development documentation.
Progress updates must be spoiler-free.
Do not ask me to make creative decisions.

## 11. DEFINITION OF DONE

The project is not finished when a prototype works.
It is finished when:

* There is a complete, playable game.
* The central gameplay mechanic is implemented and functional.
* All five required creative elements are meaningfully incorporated.
* The world is explorable.
* Progression works.
* The game has a satisfying ending.
* The first-time experience is approximately one hour.
* The game has been tested from beginning to end.
* Critical bugs and softlocks have been resolved.
* The game launches reliably.
* I can start playing without configuring development tools or reading technical documentation.

Do not declare completion prematurely.

FINAL INSTRUCTIONS
Make creative decisions independently.
Take risks with the concept.
Prioritize interesting mechanics and delightful discoveries.
Do not settle for the first generic idea that comes to mind.
I am deliberately giving you creative freedom because I want to experience something I wouldn't have thought to ask you to build.
Make something worth discovering.
Begin.
