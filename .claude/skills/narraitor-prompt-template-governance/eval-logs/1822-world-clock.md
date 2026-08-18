# Prompt/template eval log - world clock (#1822)

- Change: one variable, the `WORLD_CLOCK` flag. On: the scene template renders `worldClockBlock` (and the pacing block stands down) and the goal-extraction call carries the `WORLD CLOCK LEDGER` section. Off: prompt, extraction call and segment metadata are what they were.
- Diff: PR #1869. Template files: `templates/narrative/worldClockBlock.ts` (new), `sceneTemplate.ts` (one import, one insertion, `isStale && !worldClock`), `context.ts` (`worldClock` field). Extraction: `src/lib/ai/worldThreadExtraction.ts` (new), `goalExtractor.ts` (composes the section only when the request carries it).
- Date / evaluator: 2026-08-18, Claude (build session), judged blind per `narraitor-playtest-loop`.

## Gates

- G1 input contract: `NarrativeTemplateNarrativeContext.worldClock?: WorldClockPromptContext` added deliberately (`context.ts`), fed from `NarrativeContext.worldClock` (`narrative.types.ts`) which the controller builds from `worldThreadStore` and the store's segment count. Nothing smuggled through `currentSituation`.
- G2 leakage: the block shows the model's own earlier thread summaries plus turn arithmetic (age, overdue, turns since moved). No ids, no store internals, no hidden NPC state. `toneSettings.customInstructions` is read only by the extraction seed (precedent: `toneSettingsGuidance.ts`, `storyCheckpointGenerator.ts`), never field-accessed by a template.
- G3 determinism: the scene response JSON is unchanged. The goal-extraction JSON gains one optional `worldThreads` member; the parser fails open to `undefined` (block absent) or empty arrays (junk), and a failed parse leaves the session unseeded so it retries next turn.
- G6 cost, measured (chars, ~4 per token), no new call: scene block 664 empty / 1,062 at 3 threads / 1,881 at the 8-thread cap; extraction section incl. the JSON skeleton 1,805 / 2,629 / 2,427 on the seed turn. Roughly 720 input tokens per turn at 3 threads, 1,130 at the cap. Spike estimate was 650-750. Live scene prompt at turn 3 was 24,700 chars with the clock on.
- G7 integration: live loop through `/worlds/[id]/play` on this worktree, both flag states (table in the PR); unit tests pin assembly.

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (civic drama, dramatic) | fresh, Wren Calloway | 30 turns flag on vs 30 turns flag off | pending | |
| Camp Crystal Lake (slasher) | established (session continued past turn 15) | flag on from the continuation | pending | |
| Harrowgate Mills | fresh | 3 turns, wiring only | seed 3 threads at t1; vote deadline advanced at t2 with a note; t3 stamp advanced 0 | t1 seed: "Town council vote on developer's offer" (deadline, due t30), "Out-of-state developer's offer" (actor), "Expectations from those who facilitated the player's council appointment" (consequence, due t10) |

## Arc check (>= 3 consecutive turns, one cell)
- Continuity vs loreStore facts / prior segments / inventory: pending the playtest round.
- Contradictions found: in the 3-turn wiring run the model wrote the vote as "scheduled for today" at t2 against the description's "six weeks"; the ledger note recorded it as advancement. Prose issue, not a wiring one; watch for it in the round.

## Failure drill
- Malformed/empty response path: `parseWorldThreadExtraction` unit-tested on absent block, non-object, junk entries, bad kinds/outcomes, non-numeric dueByTurn; goal extraction's own fail-open paths leave `worldThreads` undefined and the orchestrator returns no note (unit-tested).
- Slow-response/timeout behavior: extraction is fire-and-forget after `addSegment`; the turn never waits on it. If a second turn lands first, the prompt reads the ledger one turn stale and the seed is guarded by an in-flight set (unit-tested for the unseeded path).
- Missing/invalid key behavior: unchanged, the goal call already fails open with no key.

## Regression vs prior good outputs
- Compared against: round 4 (`45e7a7f`, Harrowgate fresh) block scores as context only; the one-variable control is flag off on this build.
- Old strengths preserved? Pending.

## Cost/latency
- Token delta: see G6. Latency: none added on the turn path (no new call).

## Verdict
- Pending the playtest round.
- Ship/hold decision recorded at: PR #1869 (memo linked there once written).
