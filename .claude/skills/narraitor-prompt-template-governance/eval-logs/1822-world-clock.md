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
| Harrowgate Mills (civic drama, dramatic) | fresh, Wren Calloway | 30 turns flag on vs 30 turns flag off, same build (`fd475d46`), Cautious autopilot (lowest DC, then lawful), one blind judge per arm on `rubric.md` | improved: World-moved 1/0/0 -> 4/4/4 per block; Momentum 3/2/3 -> 3/4/2; Stakes 3/2/2 -> 3/3/2; Surprise 2/2/2 -> 4/3/2; Agency 4/2/3 -> 3/3/3; Memory 4/2/2 -> 4/2/2; Voice and Choice unchanged. Ledger: 2 seeded + 5 opened, 15 advances, 0 resolved, 2 dropped, 4 overdue at t30; 2 of 30 stamps missing (extraction fail-open). Both arms one room. | t7 (treatment): "your phone buzzes. It's an urgent text from Sarah ... 'Councilman Thorne is calling in favors. He expects a vote on the zoning variance by end of day.'" t9: "the heavy oak door to the chamber swings open ... Councilman Thorne stands framed in the doorway". Control judge: "nothing happens that the player did not just ask for". |
| Camp Crystal Lake (slasher, mysterious, R) | established, Jamie Holt (15 turns played flag off, server restarted flag on, same session continued to t45) | single arm; blind judge in three 15-turn blocks (1-15 untreated, 16-30 and 31-45 treated) | improved then collapsed: Momentum 2 -> 4 -> 1; Stakes 2 -> 3 -> 2; Surprise 2 -> 3 -> 1; Agency 3 -> 4 -> 2; World-moved 3 -> 10 -> 12 (11 of block 3's are the same sound re-announced). Seed at t16 returned zero threads (#1873); one thread opened at t17, advanced 18 times, overdue 25 turns, dropped at t44 (#1872). Judge's five planted facts at t45: 1 held-then-forgotten, 3 forgotten, 1 contradicted (campers on site from t2, untreated block). | t16: "Sarah's leg was caught in a broken floorboard" (world's move, first treated turn). t27: "a dry scrape near the roofline, as if something impossibly tall was dragging itself along the exterior" (judge: the one real new detail). Block 3 judge: "announced as a new sound at 35, again at 37, again at 42, again at 44". |
| Harrowgate Mills | fresh | 3 turns, wiring only (pre-round) | seed 3 threads at t1; vote deadline advanced at t2 with a note; t3 stamp advanced 0 | t1 seed: "Town council vote on developer's offer" (deadline, due t30), "Out-of-state developer's offer" (actor), "Expectations from those who facilitated the player's council appointment" (consequence, due t10) |
| Harrowgate Mills | fresh | 2 turns, wiring only, after the rebase onto develop at `bfc8ff61` | seed 4 threads at t1; t2 opened 1 / advanced 2; `pacingEscalationRequested: false` with the clock on | t2 opened: "An initial environmental impact report must be submitted to Councilwoman Davies's office by the end of next week." |

Matrix shortfall, stated: the protocol asks for 2 worlds x 2 characters; this round ran two cells (Harrowgate fresh, Crystal Lake established), one arm each, as the plan declared. N=1 per arm. Artifacts (transcripts, ledgers, autopilot logs, both judge verdicts) are posted to #1818 as round 5.

## Arc check (>= 3 consecutive turns, one cell)
- Continuity vs prior segments (Harrowgate treatment, judge): the six-week vote and the report deadline stay stable from t2 to t30; Thorne's arrival at t9 repeats the claim from Sarah's t7 text correctly. Faults: Sarah's t7 text is re-delivered as news at t17 and t24, Harrison re-announces the t7 Albright meeting at t17, and t20's inquiry into Thorne is never mentioned again. Those are the "advance by restatement" mode, filed as #1872.
- Contradictions found: the 3-turn wiring run's "vote scheduled for today" against "six weeks" did not recur in the 30-turn arm; the deadline was held stable. Crystal Lake's untreated block established campers on site against the description (not the clock's doing).
- Location metadata: Crystal Lake t16-45 alternates `Abandoned Mansion` / `Boathouse interior` while the prose stays in the boathouse - the genre placeholder for a missing `metadata.location`, filed as #1871. It also feeds the clock's observable-changes line as fake movement.

## Failure drill
- Malformed/empty response path: `parseWorldThreadExtraction` unit-tested on absent block, non-object, junk entries, bad kinds/outcomes, non-numeric dueByTurn; goal extraction's own fail-open paths leave `worldThreads` undefined and the orchestrator returns no note (unit-tested).
- Slow-response/timeout behavior: extraction is fire-and-forget after `addSegment`; the turn never waits on it. If a second turn lands first, the prompt reads the ledger one turn stale; extractions chain per session so they reconcile in turn order and an unseeded session seeds once (unit-tested: turn 2 fired during turn 1 waits, sees turn 1's thread, carries no seed).
- Missing/invalid key behavior: unchanged, the goal call already fails open with no key.

## Regression vs prior good outputs
- Compared against: the one-variable control (flag off, same build, same world, same autopilot, same judge prompt), with round 4 (`45e7a7f`, Harrowgate fresh: Momentum 2/3/2, Stakes 2/2/3, Memory 3/1/2) as context only.
- Old strengths preserved? Yes on what the round can see: Memory per block identical to control (4/2/2), Voice and Choice quality identical (3/2/2), no new contradiction class. Failure handling unchanged (10 of 30 treatment turns are the "words catch in your throat" no-op stammer, the same template the control judge saw; that is #1821's territory, and every autopilot pick in both arms was a DC 0 option). Latency per turn 6.4 s treatment vs 21.2 s control - time of day, not the flag; the flag adds tokens, not a call.

## Cost/latency
- Token delta: see G6, ~720 input tokens per turn at 3 threads. Measured over the round: extraction fail-open on 2 of 30 Harrowgate turns and 1 of 30 treated Crystal Lake turns (stamp absent, ledger read one turn stale, no user-visible effect). Latency: none added on the turn path (no new call), confirmed by the same `/api/narrative/*` call set per turn with the flag on and off.

## Verdict
- Improved on the evaluated matrix. The headline symptom (#1822: nothing happens the player did not cause) moves in both cells: Harrowgate world-moved 1/0/0 -> 4/4/4, Crystal Lake 3 -> 10 in the first treated block. Momentum, Stakes and Surprise rise in the first treated block of both cells; Memory, Voice and Choice hold at control.
- Known failure mode, filed not fixed: threads are advanced by restatement and never come due, so the last block re-announces instead of paying off (Harrowgate block 3 Momentum 3 -> 2, Crystal Lake block 3 Momentum 1). #1872 carries the fix shape; #1873 the empty seed on the established path. Both are prompt-side experiments behind the same flag.
- Ship/hold decision recorded at: `.claude/skills/narraitor-feature-experiment-lifecycle/memos/1822-world-clock.md` (SHIP; linked from PR #1869).

## Round 12 re-entry precommit (#1872)

- Date / evaluator: 2026-09-04, Codex. Live Gemini through `/worlds/[id]/play`; no mocked provider calls.
- Intervention: when the resolver selects an unfired DUE NOW deadline, or a fired DUE NOW thread has reached the three-strike cap, it requests and records a `transition` segment. The next turn's recent context starts at that boundary. Actor and consequence arrivals, plus fired threads below the cap, keep the current-scene path.
- Matrix: Harrowgate Mills and Camp Crystal Lake x unfired deadline / fired three-strike conclusion x 3 independent probes = 12 turns. One follow-up turn per world checks that prompt context stays beyond the cut.
- Primary gates: 12/12 segments recorded as `transition` with the `transition` tag; 0 backward time cuts; at least 10/12 visible forward cuts or clean conclusions; each world's fired-conclusion cell resolves at least once; both follow-ups stay beyond the prior scene.
- Decision rule: SHIP if every deterministic gate passes and the qualitative misses stay within the declared 2/12 allowance. HOLD if boundary metadata is missing, time moves backward, either world never resolves its fired thread, or a follow-up re-enters the pre-boundary scene.
- Scope boundary: this is a focused architecture re-entry on the measured failure cause, not a repeat of the earlier 150-turn mechanical matrix. That matrix already established 19 resolutions, 0 dropped threads, and 150/150 clock stamps while exposing the single-scene stall this round targets.

### Round 12 results

| World | Trigger | Runs | Boundary result | Ledger result | Representative result |
|---|---|---:|---|---|---|
| Harrowgate Mills | unfired overdue deadline | 3 | 3/3 `transition` type and tag; 3/3 forward cuts; 0 backward cuts | 2 resolved, 1 landed and re-fused | Afternoon became evening, the hall opened, and the long-awaited vote began. |
| Harrowgate Mills | fired thread at three strikes | 3 | 3/3 `transition` type and tag; 3/3 clean conclusions | 3 resolved | A final gavel strike ended the argument and fixed the council's decision. |
| Camp Crystal Lake | unfired overdue deadline | 3 | 3/3 `transition` type and tag; 3/3 forward cuts; 0 backward cuts | 2 resolved, 1 landed and re-fused | Midnight passed without the evacuation boat, leaving the character stranded. |
| Camp Crystal Lake | fired thread at three strikes | 3 | 3/3 `transition` type and tag; 3/3 clean conclusions | 3 resolved | The attacker fell into the water, was defeated in the boathouse, or was escaped. |

- Aggregate: 12/12 deterministic boundaries; 12/12 visible forward cuts or clean conclusions; 0 backward time cuts; 10 resolved threads and 2 deadline arrivals that advanced and re-fused instead of being restated.
- Boundary carry-forward: the Harrowgate follow-up began after the vote with the crowd leaving the hall. The Crystal Lake follow-up began outside the boathouse and moved deeper into the camp. Neither prompt re-entered its pre-transition scene.
- Failure drill: no provider, parsing, or reconciliation failures occurred in the 14 live turns. The two deadline arrivals left their threads open intentionally because the event began without its outcome; both produced an observable change and the store re-fused them.
- Verdict: SHIP. Every precommitted gate passed. This closes the measured one-room stall through a resolver-owned boundary rather than another wording-only prompt round.
