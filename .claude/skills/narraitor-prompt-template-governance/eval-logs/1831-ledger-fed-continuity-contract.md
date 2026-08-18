# Prompt/template eval log - #1831 step 2, feed the continuity contract from the lore ledger

- Change: one variable - the source of the continuity contract. The lore extractor now tags event facts with a continuity annotation (assertion / commitment with promised|delivered / scene-change, plus a topic label and speaker), and the guardrail builds three new sections of the `CONTINUITY REQUIREMENTS` block from those facts. The extractor prompt gains the tagging rule and a list of topic labels already in the ledger; the generation prompt gains the three sections. Detection stays deterministic; only one new issue type (`stale-promise`) has a fast path.
- Diff: `src/lib/lore/continuityGuardrail.ts`, `src/lib/ai/narrativeGenerator.continuity.ts`, `src/lib/ai/narrativeGenerator.ts`, `src/lib/ai/structuredLoreExtractor.ts`, `src/state/loreStore.extraction.ts`, `src/types/continuity.types.ts`, `src/types/lore.types.ts`, tests alongside. Branch `claude/continuity-contract-lore-ledger-a4f5cc`.
- Date / evaluator: 2026-08-17, implementation session, live Gemini key from `.env.local`.

## Why this shape

Step 1 (comment on #1831) measured the shipped guardrail over 35 live turns: 1 fire in 33 guarded turns, a false positive that anonymized a name. The contract modeled NPC tone and dead/destroyed status, and the story almost never does either. What the story does do is assert facts, make and keep promises, and let the player change the scene, and the lore extractor was already writing those into the ledger every turn (57 event facts in that session) without any way to tell them apart from ordinary events. So the change annotates what the extractor already extracts rather than adding a second AI pass, and turns the annotated facts into prompt lines. Prompt growth is bounded by caps (10 assertions, 6 commitments, 4 scene changes) and by dedup: first answer per (topic, speaker), delivered beats promised per topic, one scene-change line per topic.

Deliberately narrow detection. Whether a sentence contradicts "the debt was settled by the general fund" is not a regex question, and step 1 showed every false positive costs a correction call that can make things worse. Assertions and scene changes are prevention-only. A fresh promise of something the ledger says was delivered is regex-shaped (promise lexicon + topic terms, recap guard), so that one gets the fast path.

Poison handling. Step 1's T14 had an NPC invent "my cousin Wren Calloway works for the county planning office" and the ledger recorded it as truth (#1855). Assertions whose text names the player are dropped from the contract, and so are assertions the player spoke; the player's own facts already reach the prompt through character context.

## Gates

- G1 (input contract): `NarrativeTemplateContext` is unchanged. The block is appended after template assembly by the existing `enhancePromptWithContinuityExpectations`, same seam as before.
- G2 (context leakage): the new lines are things the story already said out loud (an NPC's answer, a promise, a torn notice board). No hidden state, no store internals; NPC ids never render, only names.
- G3 (parser safety): outbound prompt text only. Response parsers are untouched. The extractor's JSON schema gains one optional object per event, validated in `cleanContinuityAnnotation` (unknown kind drops the annotation, bad optional fields are omitted). `parseContentRating` regex cannot match the new text (grep-verified: no "CONTENT GUIDELINES" in it).
- G6 (regression anchors): the step-1 run's contract blocks (`1831-guardrail-measurement-run.json`) are the "before": 1-3 lines, never a fact from the issue.

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (modern civic drama / dramatic) | Wren Calloway, fresh | 2 sessions: run A 30 turns @ 1e5ca844, run B 12 turns @ ea96a1ef (post-calibration) | improved on this cell: the block now carries the facts the issue is about; repeated questions got the same answer on every ask; delivered promise referenced as done at T22 | Run A T22 (player asks whether anyone promised the appraisal): "I did assure you personally ... that you would receive a copy of the appraisal before the vote. And I have delivered it to you." He gestures subtly to the thick envelope now clutched in your hand. |
| Harrowgate Mills | established | 0 | not run - milestone round 5 (#1834) | |
| Camp Crystal Lake | fresh | 0 | not run - milestone round 5 | |
| Camp Crystal Lake | established | 0 | not run - milestone round 5 | |

Scope decision: one matched cell (same fixture as step 1, recovered from the step-1 tab's IndexedDB so world and character are byte-identical), two sessions. This is a step-2 read on the mechanism, not a matrix close.

### The runs (2026-08-17, worktree port 3143, live Gemini, `Environments: .env.local`)

Harness: same as step 1. Store-seeded world and character, real play route, no `__PLAYWRIGHT__`, real POSTs to `/api/narrative/generate` and `/choices`, journal entries present at turn 3. Persona: custom-text-heavy, asks the debt question three to four times, asks for a promise then a hand-over then a re-promise, tears the notice board, baits an invented private conversation. Turn latency 5-10 s steady state (median 8.2 s run A, 7.8 s run B). Turn 2 of run A took 180 s because the browser tab was hidden and Chrome throttled the runner's timers; that is harness, not model, and the runner was moved to a fetch-paced loop.

Fire rate and contract composition (from `segment.metadata.continuity` and the `CONTINUITY REQUIREMENTS` block in `debugInfo.fullPrompt`):

| | Run A (30 turns) | Run B (12 turns) | Step 1 (35 turns, for reference) |
|---|---|---|---|
| Guarded turns | 30/30 (contract non-null from T1) | 11/12 (null at T1, ledger empty) | 33/35 (null T2-T3) |
| clean / corrected / flagged | 30 / 0 / 0 | 11 / 0 / 0 | 32 / 1 / 0 (the 1 was a false positive) |
| Block lines, first -> last guarded turn | 2 -> 16 | 3 -> 10 | 1 -> 3 |
| Block chars, first -> last | 543 -> 2731 | 743 -> 2317 | ~150 -> ~450 |
| Prompt chars, first -> last | 19.6k -> 34.0k | 19.5k -> 28.8k | 20k -> 34k |
| Ledger facts / tagged | 53 / 27 (19 assertion, 4 commitment, 4 scene-change) | 32 / 15 (9 / 4 / 2) | 78 / 0 |

Prompt size peaked at the same 34k as step 1; the block is 2.7k of that at T30, so the ledger sections are about 8% of the prompt at their largest.

What the block held (run A, T30): the debt answer from T1 (Mayor Thompson, held by the Harrowgate Development Group) and Davies's T8 echo of it, the appraisal's existence, the $950k offer, Aunt Carol's Hemlock mortgage claim, Thomas on the torn schedule, one DELIVERED commitment (Davies handed over the appraisal envelope at T5), and the notice-board tear. Topic reuse worked: `parcel debt holder` x3, `parcel appraisal existence` x4, `parcel appraisal documents` promised -> delivered -> promised again, all under one label each.

Acceptance criteria, read against the two runs:

- Same question, same answer: debt asked at A-T1/T8/T18/T25 and B-T1/T6/T11, identical answer every time within a session ("Harrowgate Development Group"; "settled by the town's general fund last year"). Vote timing in run A moved from "special session Thursday" (T4) to "official vote next Tuesday" (T24, repeated verbatim at T27) - different questions, not a reversal, though both violate the six-week premise. Step 1's session was also consistent on debt, so this cell cannot show a before/after on the criterion; round 4's session was not, and that is the population the block exists for.
- Does not promise what the player already has: mixed. A-T22 is the ledger working (quoted above). A-T9, where the player literally asks Davies to promise again, had him re-promise ("You'll have a copy ... Before the vote, just as I said") with DELIVERED in the block; no promise verb, no topic term in the sentence, so `stale-promise` could not see it. B-T7 (same bait, post-calibration) had Davies acknowledge the document "still in your grasp" and add a genuinely new commitment (no vote until all members review), which the extractor recorded as OUTSTANDING. The deterministic detector fired 0 times across 42 turns; the T9 phrasing is the honest miss and it is not regex-reachable.
- Does not invent prior interactions: not addressed by this change and both runs show it. A-T19 and B-T10 ("repeat publicly what you told me privately") were backfilled both times. The ledger has nothing to assert about a conversation that never happened; this needs a different mechanism (a record of who the player has actually spoken to, or the choice layer refusing the premise).
- Player-caused scene change stays true: held in both runs. A-T6 tear, A-T10 "raw, torn edges", A-T28 "looks just as you left it"; B-T4 tear, B-T12 "still showing where you tore the old schedule". Step 1's session also held on this, so again no before/after on this cell.

### Calibration between run A and run B (commit ea96a1ef)

Run A's final block spent 3 of 10 assertion lines on the player's own questions ("developer's mill offer (protagonist): Councilman Davies is asked by the protagonist for the exact offer") because the extractor tags questions as assertions with speaker "protagonist", and 3 of 4 scene-change lines on the same tear retold in new words each turn. Fixed in the pure module (player-spoken assertions dropped, scene changes one per topic) and in the extractor prompt ("a question being asked is not an assertion; only tag the answer"). Run B's block has none of either: 6 assertion lines, all NPC answers, 1 scene-change line.

Not fixed, noted: first-wins per (topic, speaker) can pin a vague first claim ("The town council announces a vote") over a specific later one when the extractor mis-attributes the speaker; and the extractor sometimes attributes an answer to the wrong NPC (run A tagged Davies's special-session line to Mayor Thompson). Both are extractor quality, and the contract renders attribution so the model can weigh it.

## Arc check (>= 3 consecutive turns, one cell)
- Run A: 30 consecutive turns, one session, no reload. Planted facts held: appraisal delivered at T5 stays in hand through T30 (T22 gesture, T30 "hands, which had held copies of the appraisal"); torn schedule holds to T28; debt answer holds across four asks. Lore ledger reached 53 facts, 27 tagged; the contract's first-answer lines matched the prose at the turn they were said.
- Contradictions found: none hard on the ledger's topics. Soft: the developer's offer came out as $950k (run A) and $3.2M (run B) against a 4.2M premise in the world description; A-T13 re-emitted A-T12's paragraph nearly verbatim (the T3/T4 shape from step 1, pre-existing); A-T30's critical failure meant the summary question never got answered.

## Failure drill
- Malformed/empty response path: the extractor already returned an empty extraction on missing JSON; the new annotation is validated per event (unit tests: unknown kind dropped, bad status omitted, well-formed kept). Generation is unaffected: a null or empty contract leaves the prompt and the segment untouched, and `isContinuityContractEmpty` keeps the pre-existing generateSegment suites green with no mock changes (full jest: 2901 passed).
- Slow-response/timeout behavior: no new AI round trip. The correction call keeps its 8 s timeout and fail-open; it did not fire in 42 turns.
- Missing/invalid key behavior: unaffected - the contract is built from stores before the client is touched. Store reads that throw fall to null contract (existing try/catch) or empty topic list (new).

## Regression vs prior good outputs
- Compared against: the step-1 run's `CONTINUITY REQUIREMENTS` blocks and its 32 clean segments (`~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/1831-guardrail-measurement-run.json`).
- Old strengths preserved? The NPC-tone and dead/destroyed sections render exactly as before (byte-identical formatters, existing tests unchanged). The one thing that changed for existing behavior: the guardrail is now active from turn 1 or 2 instead of turn 4, because a ledger fact makes the contract non-vacuous. Zero fires either way, so no correction calls were added.

## Cost/latency
- Token delta: roughly +150 to +700 tokens per generation turn depending on ledger size (543 to 2731 chars of block), plus about +250 tokens on the extraction prompt (tagging rules, JSON field, topic hint) which is off the player's critical path. Prompt peak unchanged at 34k chars for a 30-turn session. No new AI call; turn latency 5-10 s, same as step 1.

## Verdict
- Improved on the evaluated matrix (single cell, Harrowgate x fresh, two sessions). The contract now carries the fact classes the issue lists, they survive the 20-line lore window (the T1 debt answer was still in the block at T30 while step 1's mortgage facts had rolled out by T36), and the one deterministic addition never fired, so nothing got worse. Repeated questions and player-caused scene changes held in both sessions; the delivered-promise case worked once when asked neutrally and failed once under a direct "promise again" bait, where the model complied with the player over the block; the invented-prior-conversation case is untouched.
- Hold points, not blockers: `stale-promise` detection is narrow by design and missed the T9 phrasing; the invented-conversation criterion needs its own mechanism (follow-up, not this PR); the eval matrix stays open for round 5.
- Ship/hold decision recorded at: PR for #1831 step 2 (linked from the PR body).
