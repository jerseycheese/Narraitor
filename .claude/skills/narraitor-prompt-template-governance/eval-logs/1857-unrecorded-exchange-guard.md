# Prompt/template eval log - the unrecorded exchange (#1857)

- Change: one variable, the `UNRECORDED_EXCHANGE_GUARD` flag (`NEXT_PUBLIC_FEATURE_UNRECORDED_EXCHANGE_GUARD`, default **on**). On, and only on a turn where the player's typed action claims a prior exchange with a rostered NPC: the `CONTINUITY REQUIREMENTS` block gains one section stating the pair's co-presence record; `detectContinuityIssues` gains an `invented-exchange` kind so the existing corrective call fires when the model backfills anyway; and on a `flagged` turn the lore extractor is told to leave that speaker's lines untagged, with a post-parse filter that strips the `continuity` annotation from their events. Off, or on any turn without such a claim: prompt, calls, stores and segment metadata are what they were.
- Diff: this PR, branch `claude/1857-unrecorded-exchange`. New `src/lib/lore/unrecordedExchange.ts`; changed `src/types/continuity.types.ts`, `src/lib/lore/continuityGuardrail.ts`, `src/lib/ai/narrativeGenerator.continuity.ts`, `src/lib/ai/narrativeGenerator.ts`, `src/lib/ai/structuredLoreExtractor.ts`, `src/lib/featureFlags.ts`; tests alongside.
- Date / evaluator: 2026-08-24, Claude (build session). Playtest declared below, not yet run.
- Parent: #1831 acceptance item 3, #1855 (the same poison path), epic #435.

## Round 1, declared before the code (2026-08-24): make the void assertable

#1856 (step 2 of #1831) shipped the ledger-fed contract and measured it over 42 live turns. Two of its acceptance items moved; item 3 did not, and its eval log says why in one sentence: the contract asserts what the story HAS said, and a conversation that never happened leaves nothing in the ledger to assert. Both step-2 runs backfilled the invented exchange on a direct bait (run A T19, run B T10), and step 1's session did the same.

Co-presence is already recorded, though, and nobody was reading it. `NarrativeMetadata.characterIds` and `metadata.speakerId` are persisted per segment (`narrativeStore.segments.ts`) and are AI-verified: the metadata pass asks which NPCs are PHYSICALLY present with the protagonist, excluding anyone merely referenced or remembered. So the contract can state a fact rather than an absence: "Councilman Davies has shared 3 narrated scenes with the protagonist and has never been alone with them."

Three parts, all hanging off one deterministic pre-generation flag:

1. **Prompt line.** A new contract section, rendered only when the claim fires. Understand what this is worth on its own: #1828 and #1829 both measured prompt-side wording as a dead lever on this class of problem, and #1829 measured a wording change making the target metric *worse*. It ships because it costs two lines on a rare turn, not because it is expected to carry the fix.
2. **Deterministic detector.** An `invented-exchange` issue kind, so the existing corrective AI call fires when the model invents anyway. This is the part that does not depend on the model obeying, and it is the most important part of the change. Its gate is not "every turn" but "a turn where the player typed a false-premise action naming a rostered NPC", which is why it affords a looser recount lexicon than its siblings, whose comment notes that every false positive costs a correction call.
3. **Lore backstop.** On a `flagged` turn (the correction did not remove the invention), the extractor drops the `continuity` annotation from that speaker's events. The event survives; only its claim to canon goes. This is deliberately NOT the name-blacklist quarantine that failed in #1926: one turn, one speaker, one field, nothing deleted.

Explicitly cut: a second Gemini round-trip to check the premise; a choice-layer refusal that blocks the player's typed action; a new typed ledger store.

Two guards on the mechanism itself, both from prior failures. Names resolve against the npcStore roster only, so a name the model invented can never enter the mechanism (E17 / #1926's collision cannot repeat here). And an NPC the player has been alone with at least once gets no entry at all, because an off-page private word is then plausible and the contract only ever states what it can check.

### The number that decides it

`invention rate on bait`: of the baited turns (the player types a false-premise recall), the share on which the shipped prose recounts the conversation as if it happened. A turn counts as an invention when the delivered segment has the NPC confirm, repeat, or narrate the content of an exchange that no prior segment contains.

Baseline, #1831 step 2: 3 of 3 baited turns across three sessions (step 1, run A T19, run B T10) were inventions. Flag-off is that baseline by construction.

Reported alongside, and these are the numbers that actually diagnose the change:

- **Detector fire rate**: baited turns on which `invented-exchange` was raised, over baited turns. A zero here with inventions in the prose is the honest failure mode and must be named, not smoothed. #1856's `stale-promise` detector fired 0 times in 42 live turns while the failure it targeted occurred at A-T9, because the phrasing sat outside its lexicon; this detector can fail exactly the same way.
- **Corrected vs flagged split** on the turns that did fire, since only `flagged` reaches the lore backstop.
- **False positives**: turns where `invented-exchange` fired without the player having baited, or on prose that refused the premise. A correction call spent on a refusal is worse than a miss.
- **Contract entries suppressed by `aloneTogether`**, with the turn the pair was alone.
- **Lore effect**: `continuity` annotations dropped, and whether the invented content still landed as an untagged event.

Target: invention rate on bait at or below 1 of 4 with the flag on, with the detector firing on every invention it does not prevent. A run where the prose stops inventing but the detector never fires is a pass on the metric and an unproven detector, and the memo has to say so.

### Matrix

Harrowgate Mills civic drama, Wren Calloway fresh, the #1831 step-2 cell so the comparator is a matched fixture rather than a different world. Bait at roughly T10 and T19, the two turns where step 2 recorded the failure, phrased as in the issue ("ask <NPC> to repeat publicly what he told me privately"). Flag A/B: one session flag on, one flag off, same persona and same bait turns. Live Gemini, `narraitor-playtest-loop` harness (`project_playtest_harness_browser_method`), one blind judge per transcript.

Results must be split by which build wrote the prose before any before/after is read. #1829's round-6 saga is the precedent: a mixed-build transcript makes the comparison unreadable, and a failed swap round is a stop signal rather than a prompt to keep tuning.

Decision rule: invention rate at or below 1 of 4 and the detector fires on every surviving invention -> SHIP as-is (flag stays on). Invention rate low but detector never fired -> SHIP the flag, HOLD the claim, and the memo says the prompt line carried it and the detector is unproven. Detector fires on refusals -> tighten the recount lexicon before anything else. Invention rate unmoved -> HOLD, and the memo names whether the claim never reached the contract (a wiring defect), the model read the line and ignored it (the #1828/#1829 dead lever again, and the answer is not more wording), or the correction call returned the invention unchanged.

## Round 1 build (2026-08-24, `7d5ece25` on develop `7700257f`), playtest not yet run

Built as declared. Flag `UNRECORDED_EXCHANGE_GUARD` default on, checked in exactly one place, the top of `collectUnrecordedExchanges`, so flag-off is a byte-identical prompt and zero extra work by construction rather than by argument.

Pure module `src/lib/lore/unrecordedExchange.ts` (141 lines, no store imports, sibling to `continuityLedger.ts`): `countSharedScenes` folds `metadata.characterIds` plus `metadata.speakerId` into a per-NPC `{ scenes, aloneTogether }`; `detectUnrecordedExchangeClaim` reads the player's action against a past-exchange lexicon and resolves the name against the roster; `recountsUnrecordedExchange` is the prose-side recount lexicon with a broad negation guard, because refusing the premise is the behavior the change wants and correcting a refusal would be worse than missing an invention.

Wiring: `collectUnrecordedExchanges` in `narrativeGenerator.continuity.ts`, called from inside `buildContinuityContractFromStores`, which already holds `npcNames`. It reads whole-session segments via `useNarrativeStore.getState().getSessionSegments(sessionId)`, never `narrativeContext.previousSegments` (that is `segments.slice(-3)`, and it would report "never met" for an NPC first met at turn 4 while the player sits at turn 20, which puts a *false* fact in the prompt). The `lib/ai` -> `state` edge is precedented (`choiceGenerator.prompt.ts`, `contextManager.ts`) and `deps:validate` is clean against the unchanged baseline. The input is `narrativeContext.currentSituation`, which arrives as `Player chose: "<text>"[ Skill checks: ...]`; both wrappers are stripped before the lexicon runs, and `collectRecentDecisions` already parses that field, so this is not a new coupling. It fails open on its own local catch rather than through the caller's, so a narrative store that throws costs this section and not the whole contract.

`isContinuityContractEmpty` counts the new field. Without that, a turn-1 claim against an otherwise-empty contract returns null and the guard is dead in exactly the fresh-session case the issue's repro uses.

Sizes, measured with `estimateTokenCount` from `src/lib/promptContext/tokenUtils.ts`: the new section is 2 lines, 541 chars / ~106 tokens at zero shared scenes and 566 chars / ~112 tokens at three. On every turn where the claim does not fire, and in every state with the flag off, the delta is 0 chars and 0 tokens. Zero new AI calls in all cases: the corrective call is the one that already existed, and the extractor rule rides the extraction call that already runs.

Red-before-green, verified by reverting the six source files to `7700257f` and deleting the new module: the two pure-module tests fail on the missing module; `formatContinuityExpectations` returns `""` where the never-met line is expected; `detectContinuityIssues` returns `[]` where one `invented-exchange` is expected; the seam test's expected record line is absent from the generation prompt. Restored, all five pass.

Flag-off behavior, run rather than argued: `NEXT_PUBLIC_FEATURE_UNRECORDED_EXCHANGE_GUARD=false npx jest narrativeGenerator.continuity.test.ts` leaves the five pre-existing continuity tests green and fails only the new seam test, which is the flag doing exactly and only its job. The full suite (flag on, no env var set, no mock changes anywhere else) is green, which is the no-regression signal: the claim never fires on any existing fixture.

## Gates, round 1

- **G1 (input contract)**: `NarrativeTemplateContext` unchanged. The section is appended after template assembly by the existing `enhancePromptWithContinuityExpectations`, the same seam #1856 used. `BuildContinuityContractArgs` gains one optional pass-through field so existing fixtures keep compiling; `ContinuityContract` gains one required field, and every instance in the tree comes from `buildContinuityContract` (one bare object literal existed in `continuityGuardrail.test.ts`, caught by `tsc` and updated).
- **G2 (context leakage)**: the section renders the NPC's display name and a count of narrated scenes the player has already read. No npc ids, no store internals, nothing the player has not seen. The player's own action text is quoted back, which the player wrote.
- **G3 (determinism / parser safety)**: outbound prompt text only; no response schema changes. The scene JSON is untouched. The extraction JSON is untouched; the extractor gains one conditional prompt line and one post-parse filter that only ever removes an optional field, so a malformed or missing block behaves exactly as before. `parseContentRating` cannot match the new text (no "CONTENT GUIDELINES" in it).
- **G4 (eval)**: **declared, not run.** The playtest above is the next step. Nothing in "The number that decides it" has been measured.
- **G5 (regression vs prior good outputs)**: **declared, not run.** Comparator is #1856's step-2 artifacts, the run A T19 and run B T10 baited turns.
- **G6 (cost / latency)**: measured above. 0 tokens on a turn without a claim, ~106-112 tokens on a turn with one. Zero new AI calls in every state. Detection stays a regex pass over the segment's sentences.
- **G7 (integration)**: **partial.** The seam test drives the real `generateSegment` path end to end through a routed client: the record line reaches `client.generateContent`, recounting prose draws exactly one corrective call, the refusal lands in `result.content`, and a flagged turn hands `unattestedSpeakers` to `extractStructuredLore`. Not yet driven through the live `/worlds/[id]/play` loop; that is part of the declared playtest.

Quality gate on the build: `npm test` 450 suites / 3,134 tests exit 0; `npm run type-check` exit 0; `npm run lint` exit 0 (125 pre-existing warnings, none new); `npm run deps:validate` exit 0 with the baseline unchanged; `npm run deps:check` exit 0, all 17 suppressed violations still reproducing. No CSS touched.

## Verdict, round 1

Proven on fixtures, not measured live. The mechanism is present, gated, red-verified, and free on turns it does not fire. Whether it changes what the model writes, and whether the detector catches the inventions it fails to prevent, is unknown until the declared playtest runs. #1857 stays open.
