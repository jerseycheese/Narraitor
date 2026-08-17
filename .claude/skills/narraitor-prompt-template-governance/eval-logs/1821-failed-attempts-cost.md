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
| Camp Crystal Lake (1984 slasher / tense) | Jamie Holt, fresh | 1 x 30 turns | pending - filled after the matched run below | |
| Camp Crystal Lake | established | 0 | not run - milestone round 5 (#1834) | |
| Harrowgate | fresh | 0 | not run - milestone round 5 (#1834) | |
| Harrowgate | established | 0 | not run - milestone round 5 (#1834) | |

Scope decision: one matched cell, honestly filled. This closes #1821's acceptance criterion (a matched 30-turn re-run with the no-op count materially below 13/18); it does not close the eval matrix, which round 5 owns.

Cross-build caveat: run 1 predates #1825 (typed actions now roll checks, so the population of failure turns changed), #1826, #1827, and #1836. The re-run against run 1 is a matched-method comparison, not a controlled A/B on a single variable.

## Arc check (>= 3 consecutive turns, one cell)
- Pending the matched run: 30 consecutive turns; five planted facts checked at turn 30 (dirt road 40 min, dead radio, Jamie knows which doors don't lock, kids not arrived, summer 1984).
- Contradictions found: pending.

## Failure drill
- Malformed/empty response path: unaffected - this change alters outbound prompt text only. Template renders with absent and empty `currentTags` (unit tests: no block on `[]`, no block on success-only tags).
- Slow-response/timeout behavior: unaffected - no new AI round trip.
- Missing/invalid key behavior: unaffected - template assembly runs before the client is touched.
- Discovered while reading, filed as follow-ups, not fixed here: `NarrativeController.tsx` merges the previous segment's `metadata.tags` into this turn's `currentTags`, so a failure tag survives one extra turn and the failure guidance (and the FATAL gate) re-fires on the turn after a failure. Scoring below uses `segment.metadata.decisionOutcome`, not tags, so the stale carryover can't contaminate the failure-turn set.

## Regression vs prior good outputs
- Compared against: the run-1 transcript excerpts in #1821 (the no-op turns) and the run-1 success/no-check turns (the contamination guard - success prose must not start imposing costs).
- Old strengths preserved? Pending the run. The success bullet, the mechanics-hiding bullet, and the crit-severity bullet are byte-identical.

## Cost/latency
- Token delta: roughly +125-140 tokens on failure turns only, zero on success and no-check turns. While the stale-tag carryover stands, the block also fires on the turn after each failure, so per-session cost is about twice the failure count. No new AI round-trip; no latency change.

## Verdict
- Pending the matched run. No behavioral claim is made from the wiring tests - they prove the block assembles on the right turns and only those, nothing about what Gemini does with it.
- Ship/hold decision recorded at: PR for #1821 (to be linked).
