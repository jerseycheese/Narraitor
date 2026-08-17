# Prompt/template eval log - #1821 failed attempts must cost something

- Change: one variable - the failure-outcome guidance in `sceneTemplate.ts`. A new `FAILED ATTEMPT — THE WORLD STILL MOVES` block renders only when `skillResult` is `failure` or `critical-failure` (same derivation from `skill-*:` tags the SKILL CHECK RESULT block already uses); the old failure bullet ("show realistic consequences and setbacks") and the tail line ("failure = things go wrong or backfire") were rewritten so the weaker rule can't compete with the new one. Nothing else in the template moved.
- Diff: `src/lib/promptTemplates/templates/narrative/sceneTemplate.ts`, `.../__tests__/sceneTemplate.test.ts`, this log. Branch `claude/failed-turns-world-state-7f1422`.
- Date / evaluator: 2026-08-17, implementation session with a live Gemini key available for the matched run.

## Why this shape

Run 1 of the round-3 playtest (Camp Crystal Lake, cautious persona, 30 turns, live Gemini, two blind judges) resolved 18 turns as failed skill checks and rendered 13 of them as the player's action simply not occurring - world state at turn end identical to turn start. The one-bullet failure guidance is satisfiable by a reaction shot, and Gemini took the cheap satisfaction every time.

The block copies the shape of the PACING and FATAL blocks, which demonstrably fire: a checkable condition (only failure turns), an ALL-CAPS header, one-sentence imperative bullets, and one bullet that is a predicate the model can test its own draft against ("if every person, object, and advantage would stand exactly where it started, the outcome is wrong"). The choice-mix instruction that Gemini ignored had the opposite shape - always-on, policy-toned, nothing to check.

Deliberately absent: any quoted no-op imagery in the ban (no "words dying in throats", no "clumsy", no "no purchase"). Quoting the attractor feeds it at temperature 0.7, and that lexicon is the judges' no-op tell - putting it in the prompt would break the scoring instrument. Also absent: crit-scaling language (line 113 owns that) and any survival/"story continues" language, so the block co-renders cleanly with FATAL on critical-weight failures.

## Gates

- G1 (input contract): reads only the existing `narrativeContext.currentTags`; `NarrativeTemplateContext` is unchanged.
- G2 (context leakage): no new state is fed to the model; tone settings, roster, background untouched.
- G3 (parser safety): no structural change to the parsed output - the response format block is untouched. The only code that reads prompt text back is `parseContentRating` (`src/lib/ai/safety/contentRatingGuidance.ts`), regex `/((?:PG-13|NC-17|[A-Z]{1,5}))(?:-RATED)? CONTENT GUIDELINES/i`; the new block never contains the phrase "CONTENT GUIDELINES" (grep-verified). Response parsers read model JSON, not the prompt.
- G6 (regression anchors): the run-1 no-op excerpts quoted in #1821 are the "before"; `1681-phrase-variety.md` is the format precedent for an honest partial log.

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Camp Crystal Lake (1984 slasher / tense) | Jamie Holt, fresh | 1 x 54 turns (matched 30 + 24 extension) | improved on this cell: no-op 1-2/6 in the matched 30, 4/11 over the full session, vs 13/18 in run 1 | Turn 19 (failure): "Your boot slides on something greasy ... You catch yourself on the edge of the stainless steel, the impact echoing sharply through the quiet kitchen. The glint ... now vanishes into the deeper shadows." Turn 55 (critical failure): "The blade snags on a particularly tough root, wrenching your wrist ... scraping your palm on rough bark and twisting your ankle." (pocketknife lost) |
| Camp Crystal Lake | established | 0 | not run - milestone round 5 (#1834) | |
| Harrowgate | fresh | 0 | not run - milestone round 5 (#1834) | |
| Harrowgate | established | 0 | not run - milestone round 5 (#1834) | |

Scope decision: one matched cell, honestly filled. This closes #1821's acceptance criterion (a matched 30-turn re-run with the no-op count materially below 13/18); it does not close the eval matrix, which round 5 owns.

Cross-build caveat: run 1 predates #1825 (typed actions now roll checks, so the population of failure turns changed), #1826, #1827, and #1836. The re-run against run 1 is a matched-method comparison, not a controlled A/B on a single variable. The same-build A/B was not run.

### The matched run (2026-08-17, build 3760b3b3, live Gemini, cautious persona)

Setup and harness: worktree on the branch, `.env.local` synced from the main checkout (startup log `Environments: .env.local`), dev server on this worktree's port 3302, world and character built through the real wizards to the fixture in `narraitor-playtest-loop/worlds/camp-crystal-lake.md` (attributes renamed to the targets, skills trimmed to the seven targets, Jamie Holt with Stealth/Athletics/First Aid at 5). Harness checkpoint at turn 3 passed: no `__PLAYWRIGHT__`, no Playwright UA, real POSTs to `/api/narrative/generate`, `/choices` and `/summarize`, 4 distinct segments, journal entries present. Turn latency 4.8-8.8 s throughout.

Failure-turn population: the matched 30 player turns produced only 6 failed checks (run 1 produced 18). Jamie's build clears most DCs, and typed actions get model-inferred difficulties of 1-5 (DC 2-10), so a roll of 2 still passes on a Stealth 5 action. Because 6 is a thin denominator, the session was extended past the ending prompt to 54 player turns and 11 failed checks (segments 4, 9, 11, 19, 26, 27, 32, 45, 49, 54, 55; two critical). Both strata are reported. The failure set was taken from `segment.metadata.decisionOutcome`; the tag-derived set matched it exactly, and no `mixed` outcomes occurred.

Scoring: two independent blind judges (fresh subagents, different models, no world spec, no knowledge of the change, inputs = attempted action + resulting prose only) answered per failure turn: does the attempt occur, name the cost as a state delta (feelings and atmosphere excluded), lexicon check, verdict no-op vs world-moved.

| Stratum | Failure turns | Judge A no-op | Judge B no-op | Unanimous no-op | Judge agreement |
|---|---|---|---|---|---|
| Matched first 30 turns | 6 | 2/6 (turns 4, 11) | 1/6 (turn 11) | 1/6 | 5/6 |
| Full 54-turn session | 11 | 4/11 (4, 11, 32, 54) | 4/11 (11, 32, 45, 54) | 3/11 | 9/11 |
| Run 1 baseline (for reference) | 18 | 13/18 | | | |

The attempt was rendered as not happening on 1/11 failure turns (turn 11, "the words catch in your throat", both judges), against 13/18 in run 1. Run-1 canned lexicon recurred twice: turn 11's throat line, and "clumsy" twice on turn 27. The surviving no-ops (11, 32, 54) are the same shape: a listening or reading action where the world answers with silence and "the stillness intensifies" - atmosphere standing in for cost.

Mechanical store tally, kept separate from the blind call: 8/11 failure turns set `majorEvent`; itemsLost fired on 2 (turn 54's map, turn 55's pocketknife); no location changes on failure turns except 55. Store stasis on the others is consistent with the judges' costs being positional, social, or noise, which touch no store.

Contamination check (over-firing guard): a third blind judge read 13 success or no-check turns and rated 9 as reading like success with no imposed cost. The other 4 (turns 10, 33, 46 neutral; turn 50 read as failure - "the deadbolt gouges the frame" on a roll of 19) are exactly the four turns that immediately follow a failure turn. Every non-adjacent success turn read clean. This is the stale-tag carryover defect (below) showing a real cost now that the failure block is stronger.

Interaction with the PACING signal: 8/11 failure turns set `majorEvent`, so costly failures do count as complications for the escalation guard. That is #1680's problem and it stays untouched here.

Observations for follow-up (not fixed here): the play surface stopped auto-following at around segment 18 and showed "Jump to latest" for three turns until clicked; the ending prompt fired at turn 30 ("secured in a safe location") while a threat was still outside; the story loops in a room once the group is secured (repeated "check the windows/exits" offers).

## Arc check (>= 3 consecutive turns, one cell)
- 54 consecutive turns, one session, no reload. Planted facts at the end: dead radio held (Chad's handheld stays dead; the walkie-talkie found at turn 34 is a separate object); Jamie knowing which doors don't lock was used at turn 13 and the narrative ran with it (staff cabins have unreliable latches, mess hall has a deadbolt); summer 1984 held (beige landline "relic", walkie-talkie, no anachronisms); dirt road / forty minutes never resurfaced (silence, not contradiction); kids not arrived never contradicted at Crystal Lake (turn 40's "the kids are terrified" is Counselor Davies at a different camp).
- Contradictions found: none hard. Soft: turn 24 has fluorescent lights humming in a mess hall the group had entered dark; turn 55 has Jamie clearing brush outside alone from an office that was barricaded two turns earlier.

## Failure drill
- Malformed/empty response path: unaffected - this change alters outbound prompt text only. Template renders with absent and empty `currentTags` (unit tests: no block on `[]`, no block on success-only tags).
- Slow-response/timeout behavior: unaffected - no new AI round trip.
- Missing/invalid key behavior: unaffected - template assembly runs before the client is touched.
- Discovered while reading, filed as follow-ups, not fixed here: `NarrativeController.tsx` merges the previous segment's `metadata.tags` into this turn's `currentTags`, so a failure tag survives one extra turn and the failure guidance (and the FATAL gate) re-fires on the turn after a failure. Scoring below uses `segment.metadata.decisionOutcome`, not tags, so the stale carryover can't contaminate the failure-turn set.

## Regression vs prior good outputs
- Compared against: the run-1 transcript excerpts in #1821 (the no-op turns) and the run-1 success/no-check turns (the contamination guard - success prose must not start imposing costs).
- Old strengths preserved? Yes on the turns the block doesn't touch: 9/9 non-adjacent success turns read as success with no imposed cost. The success bullet, the mechanics-hiding bullet, and the crit-severity bullet are byte-identical. Weakened: the turn after a failure, via the pre-existing tag carryover (see contamination check).

## Cost/latency
- Token delta: roughly +125-140 tokens on failure turns only, zero on success and no-check turns. While the stale-tag carryover stands, the block also fires on the turn after each failure, so per-session cost is about twice the failure count. No new AI round-trip; no latency change.

## Verdict
- Improved on the evaluated matrix (single cell: Camp Crystal Lake x fresh). No-op failures went from 13/18 in run 1 to 1-2/6 in the matched 30 turns and 4/11 across the full 54-turn session, with the attempt itself rendered as not happening on 1/11 instead of 13/18. Both judges independently landed on 4/11 with 9/11 per-turn agreement. That is materially below the baseline; it is not "reliable", and it is not the milestone's 80% bar under the strict unanimous count (6/11 unanimous world-moved, 8/11 by either judge). Sample is thin (11 failure turns) and the comparison is matched-method, not same-build A/B.
- Hold points, not blockers: the residual no-op shape is the "listen and hear nothing" turn (atmosphere as cost), and the turn after a failure inherits the block through the tag carryover and sometimes reads as a second failure. Both are filed as follow-ups.
- Ship/hold decision recorded at: PR for #1821 (linked from the PR body).
