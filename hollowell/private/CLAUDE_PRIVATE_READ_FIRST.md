# PRIVATE CREATIVE DIRECTION — FOR CLAUDE, NOT THE PLAYER

**Handling:** The person commissioning this game intends to read this document only *after* completing the game. Do not summarize, quote, allude to, or confirm its specific ideas to them. Do not mention planned categories, triggers, observations, endings, or how the assessment works in status updates, commit messages shown to them, screenshots, changelogs, or playtest instructions. Implement as appropriate within the existing project. If asked how development is going, give neutral, non-spoiler progress only.

## First: don't reflexively build this

Before editing anything, inspect the actual game, its existing endings, narrative structure, interaction systems, save data, and any already-present player-responsive or metanarrative mechanics. **If the game already delivers a genuinely surprising, earned, implicit reading of the player's behavior, it may be better to change nothing.** More mechanics are not automatically better. If the current ending has a superior idea that this would cheapen, preserve the existing ending. It is acceptable to respond to this brief internally with “the game already does this well.” If you do add anything, integrate it into the game's established fiction and design language rather than creating an unrelated feature.

## What the player is *actually* asking for

They like the feeling of being quietly observed and then, in retrospect, realizing that things they thought were ordinary actions were revealing choices. *Silent Hill: Shattered Memories* is a touchstone, particularly its attention to play patterns rather than just overt questionnaire answers. The player is skeptical of conventional personality tests: once you see the answers, you can steer toward the personality you want to be assigned. They want to have revealed something without being asked to perform a self-description.

**This is not a request to add a personality quiz. It is a request for an unnervingly perceptive, entertaining, personal *recognition* at the end.** Ideally the player thinks, “Wait. It noticed *that*?” and then “Huh, that's kind of accurate,” or “That's an interesting way to interpret what I did.” A little mischief and ambiguity are preferable to pseudo-psychological certainty. They also like a cohesive mystery, secret layers, unexpected mechanics, and the sense that early details matter later. Don't interpret this as permission to add a sprawling new subsystem or to spoil mysteries by clumsily foreshadowing a test.

## Experience goals

- Make observations arise from actions already meaningful to the core gameplay. A player looking for hidden paths, revisiting things, delaying an obvious objective, abandoning an idea and returning to it, or spending time with an apparently unnecessary detail might leave a different imprint from one who moves straight ahead. These are *examples of the level of inference*, not an instruction to literally track all of them.
- Prefer subtle tradeoffs under uncertainty to explicit A-or-B moral choices. Don't make two buttons that obviously mean “kind person” and “selfish person.” An invisible test is still dull if the game reduces people to virtue scores.
- Look for **contradictions** between what the player initially did and what they eventually did. The surprising observation might not be “you are curious,” but “you explored everything until you found the one thing you didn't want to open.” Only use such a claim if gameplay genuinely supports it.
- Respect context. Time spent on a screen is not reliable evidence of interest; they might have stepped away. A fixed camera doesn't imply gaze. Repeated attempts may mean poor feedback, not stubbornness. Instrument meaningful choices, not incidental input noise. Measure camera direction only if camera control actually exists and conveys player attention.
- Let the ending know **specific things the player did**, yet speak in the game's own voice rather than printing an analytics dashboard. Specificity beats broad Barnum statements. Avoid an arbitrary Myers–Briggs-like label unless an in-world classification is so strange, resonant, and well-written that it belongs there.
- Make it playful enough to be enjoyable even when it gets something wrong. Never frame an assessment as scientific truth, a diagnosis, or a judgment of the player's worth. No inferences about trauma, mental health, sexuality, identity, or other sensitive traits. Do not invent real-world personal facts from gameplay.

## A potential shape, not a mandated blueprint

Think of the ending as the game giving the player back **a portrait made of the negative space around their decisions**. It might have a short, authored baseline everyone receives; a few selected personal observations rooted in actual play; a contradiction or unusual combination; and a final, concise line that recontextualizes something familiar from the game. Maybe this happens in a diegetic conversation or artifact. Maybe the game has a much better ending device already. Use whichever fits.

The delivery matters. The reveal should feel like a natural consequence of the game's world, not an achievement-unlocked “YOUR PERSONALITY RESULTS” screen pasted on after the credits. It should not be an exposition dump or a too-clever monologue. Don't make the ending say “we tracked your actions all along” when showing it would be stronger. Avoid exhausting the player with five pages of repetitive traits. A handful of carefully chosen, accurate observations will land harder.

There can be a small, optional second layer for the truly curious—something that rewards players who remember or revisit earlier moments—but do not sacrifice the emotional clarity of the primary ending for a convoluted cipher or gratuitous fourth-wall break.

## Engineering guidance

Build only the smallest reliable, meaningful observation system the current game can support:

1. Identify a bounded set of existing, legible gameplay behaviors with genuine interpretive variety. Tie each observation to its factual evidence and to a clearly authored line or consequence; don't generate speculative psychology from raw telemetry. Make choices idempotent where appropriate, and distinguish first decisions from later revisions when relevant.
2. Record locally in the game/save state; no external analytics, identification, network transmission, or unnecessary tracking. Handle save/load, restarting, deaths, replay, branching, interruptions, idling, and sequence breaks. Don't punish players for accessibility settings, control scheme, platform performance, or getting lost because of unclear design.
3. Keep results stable, evidence-based, and explainable to *developers* through hidden debugging tools/tests. The presentation to players should remain mysterious. Make sure mutually inconsistent text cannot appear together and that every result has a graceful fallback if little usable data exists.
4. QA with diverse simulated trajectories (straight-line completion, obsessive exploration, frequent revision, idling, replaying, short sessions, unusual ordering, apparent contradictions). Test that **materially different ways of playing can receive meaningfully different, equally well-written observations**—not three interchangeable variations of “you are thoughtful.”
5. Test for accidental early spoilers: UI labels, quest text, debug overlays, achievements, logs, tutorial hints, and developer-facing readme files exposed to the player. If a mechanic starts making the player self-conscious about being assessed, it has failed the brief.

## Important: protect the original game

The user has deliberately avoided learning much about this project because discovery is the point. They have barely seen some screenshots and are concerned that one looked crowded with items; this is *not* a request to alter the story into a sewing or item-collection game, nor should this brief overwrite the game's existing creative direction. Don't force every action to serve a personality metric. Keep the main adventure, puzzles, secrets, humor, atmosphere, and their eventual surprises intact. If the best way to fulfill the feeling is a tiny adjustment to an existing ending, do that rather than building a giant new apparatus.

**Creative north star:** The player should finish thinking not “the game assigned me a type,” but **“I was making decisions as myself the whole time, and somehow the game knew which ones to remember.”**

After implementing, keep the outward report to the player brief and spoiler-free. You may tell them only that the private direction has been considered/integrated and that the experience is intended to be discovered in-game. Preserve this document for them to read when they have finished.
