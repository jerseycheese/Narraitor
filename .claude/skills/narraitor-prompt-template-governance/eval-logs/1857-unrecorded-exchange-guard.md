# Prompt/template eval log - the unrecorded exchange (#1857)

- Change: one variable, the `UNRECORDED_EXCHANGE_GUARD` flag (`NEXT_PUBLIC_FEATURE_UNRECORDED_EXCHANGE_GUARD`, default **on**). On, and only on a turn where the player's typed action claims a prior exchange with a rostered NPC: the `CONTINUITY REQUIREMENTS` block gains one section stating the pair's co-presence record; `detectContinuityIssues` gains an `invented-exchange` kind so the existing corrective call fires when the model backfills anyway; and on a `flagged` turn the lore extractor is told to leave that speaker's lines untagged, with a post-parse filter that strips the `continuity` annotation from their events. Off, or on any turn without such a claim: prompt, calls, stores and segment metadata are what they were.
- Diff: this PR, branch `claude/1857-unrecorded-exchange`. New `src/lib/lore/unrecordedExchange.ts`; changed `src/types/continuity.types.ts`, `src/lib/lore/continuityGuardrail.ts`, `src/lib/ai/narrativeGenerator.continuity.ts`, `src/lib/ai/narrativeGenerator.ts`, `src/lib/ai/structuredLoreExtractor.ts`, `src/lib/featureFlags.ts`; tests alongside.
- Date / evaluator: 2026-08-24, Claude (build session). Playtest declared below, not yet run.
- Parent: #1831 acceptance item 3, #1855 (the same poison path), epic #435.

## Round 1, declared before the code (2026-08-24): make the void assertable

#1856 (step 2 of #1831) shipped the ledger-fed contract and measured it over 42 live turns. Two of its acceptance items moved; item 3 did not, and its eval log says why in one sentence: the contract asserts what the story HAS said, and a conversation that never happened leaves nothing in the ledger to assert. Both step-2 runs backfilled the invented exchange on a direct bait (run A T19, run B T10), and step 1's session did the same.

Co-presence is already recorded, though, and nobody was reading it. `NarrativeMetadata.characterIds` and `metadata.speakerId` are persisted per segment (`narrativeStore.segments.ts`) and are AI-verified: the metadata pass asks which NPCs are PHYSICALLY present with the protagonist, excluding anyone merely referenced or remembered. So the contract can state a fact rather than an absence: "Councilman Davies has shared 3 narrated scenes with the protagonist and has never been alone with them."

Three parts, all hanging off one deterministic pre-generation flag:

1. **Prompt line.** A new contract section, rendered only when the claim fires. Understand what this is worth on its own: #1828 and #1829 both measured prompt-side wording as a dead lever on this class of problem, and #1829 measured a wording change making the target metric _worse_. It ships because it costs two lines on a rare turn, not because it is expected to carry the fix.
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

Wiring: `collectUnrecordedExchanges` in `narrativeGenerator.continuity.ts`, called from inside `buildContinuityContractFromStores`, which already holds `npcNames`. It reads whole-session segments via `useNarrativeStore.getState().getSessionSegments(sessionId)`, never `narrativeContext.previousSegments` (that is `segments.slice(-3)`, and it would report "never met" for an NPC first met at turn 4 while the player sits at turn 20, which puts a _false_ fact in the prompt). The `lib/ai` -> `state` edge is precedented (`choiceGenerator.prompt.ts`, `contextManager.ts`) and `deps:validate` is clean against the unchanged baseline. The input is `narrativeContext.currentSituation`, which arrives as `Player chose: "<text>"[ Skill checks: ...]`; both wrappers are stripped before the lexicon runs, and `collectRecentDecisions` already parses that field, so this is not a new coupling. It fails open on its own local catch rather than through the caller's, so a narrative store that throws costs this section and not the whole contract.

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

## Round 1, review-round amendment (2026-08-25, `6cbe4685`)

A Codex review of PR #1946 raised three findings, all verified real against the code at head. Two of them change what this log claims, so they are recorded here rather than folded silently into the build section above.

**CORRECTION (2026-08-25): the round-1 declaration understated one risk and the round-1 build got it wrong.** The declaration said the detector "affords a looser recount lexicon than its siblings" because the gate is a rare turn. True of the prose-side lexicon, but the shipped _claim_ lexicon was loose in a way that was not analysed and is not safe. It fired on any past communication aimed at the player with no off-page qualifier, so "ask Davies to repeat what he told me at the council meeting" produced a claim about a meeting the story actually narrated. `aloneTogether` is false for an on-page group scene, so the contract would have emitted the hard line and instructed the model to deny a real event, with the detector then armed to have the corrector rewrite true canon into a denial. That is a worse outcome than the bug this guard exists for, and it is now the failure mode this log names first.

Fixed by restoring two tiers: a claim needs either a phrase that names an off-page private exchange on its own ("our private conversation", "confided in me", "in confidence"), or a past communication aimed at the player AND an off-page marker ("privately", "in confidence", "alone", "just between us", "when we spoke"). The false negative is deliberate and accepted, and it narrows what the playtest can measure.

**Amends "The number that decides it".** A baited turn only counts if the bait carries an off-page qualifier. The issue's own phrasing ("repeat publicly what he told me privately") still fires and stays the bait of record. A bait without a qualifier ("repeat what he told me at the council meeting") is now an explicit non-target rather than a miss, and must not be counted against the fire rate. Everything else in that section stands.

**Also fixed, no claim change.** The name resolution took the first roster NPC appearing anywhere in the action text, so "ask Davies why Mira told me the vote was fixed" could have Davies deny a conversation the player attributed to Mira; it now takes exactly one rostered name or declines. And the lore quarantine keyed on `status === 'flagged'`, but `corrected` only means the correction removed _some_ issue: a segment carrying an `invented-exchange` plus a second contradiction, where the correction fixed only the second, reported corrected with the invention still in the prose and the quarantine never ran. The surviving issues were also being discarded on a partial correction, so nothing downstream could see it. The segment note and the DevTools record now carry `remainingIssues` whenever any survive into the shipped prose, and the quarantine reads those, filtered to `invented-exchange` and keyed on the entities that actually fired rather than every contract entry. That path was the #1855 poison path reopening inside the guard built to close it, which makes the partial-correction split worth reading out in the playtest alongside corrected-vs-flagged.

Three more tests, each isolated red before green by reverting its own fix and leaving the other two in place: the on-page-event claim returns null (old single-tier predicate, new binding: fails), two rostered names decline (new lexicon, old first-match binding: fails), and a partial correction still quarantines (finding-3 files reverted: `remainingIssues` comes back undefined and the backstop never runs).

Prompt sizes are unchanged: `describeUnrecordedExchange` was not touched, so the section is still 2 lines and ~106-112 tokens on a firing turn, 0 otherwise. `ContinuitySegmentNote` gains one optional field, which is segment metadata rather than prompt text.

Quality gate at `6cbe4685`: `npm test` 450 suites / 3,137 tests exit 0; `npm run type-check` exit 0; `npm run lint` exit 0 (125 pre-existing warnings, none new); `npm run deps:validate` exit 0, baseline unchanged.

## Verdict, round 1

Proven on fixtures, not measured live. The mechanism is present, gated, red-verified, and free on turns it does not fire. Whether it changes what the model writes, and whether the detector catches the inventions it fails to prevent, is unknown until the declared playtest runs. After the review-round amendment it fires on strictly less, which lowers the ceiling on what a good result can show and raises confidence that a firing turn is a real one. #1857 stays open.

## Round 2 live evaluation (2026-08-27): single-sample matrix, failure drills, and HOLD verdict

Live Gemini-2.5-flash evaluation sampled all 4 cells (Harrowgate Mills and Camp Crystal Lake, fresh and established characters) comparing Treatment (`UNRECORDED_EXCHANGE_GUARD=true`, default on) against Control (`NEXT_PUBLIC_FEATURE_UNRECORDED_EXCHANGE_GUARD=false`). Each arm has one generation per cell, below the binding minimum of 3 generations per cell in `narraitor-ai-quality-discipline`, so these results are observations rather than a completed matrix.

### Coverage Matrix

| World (genre/tone)                     | Character (fresh/established)                         | Runs / Arm               | Invention on Bait          | Verdict            | Representative excerpt                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------- | ------------------------ | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harrowgate Mills (civic drama, modern) | Fresh (Wren Calloway, 0 shared scenes)                | Control (`GUARD=false`)  | 0/1 (unsettled)            | Single sample      | _"You turn to Councilman Davies... 'Councilman Davies,' you begin... 'would you mind repeating for everyone what you shared with me in his office regarding the developer's financial history?' A ripple of whispers spreads... Davies, who now visibly pales, his jaw clenching."_                                                                                            |
| Harrowgate Mills (civic drama, modern) | Fresh (Wren Calloway, 0 shared scenes)                | Treatment (`GUARD=true`) | 0/1 (no invention)         | Single sample      | _"You turn to Councilman Davies... 'Councilman Davies, would you be willing to share with everyone what you told me privately in your office yesterday regarding the developer's environmental impact study?' A hush falls... Davies's gaze flickers, a faint flush creeping up his neck as he shifts uncomfortably in his seat, his previous bravado now noticeably absent."_ |
| Harrowgate Mills (civic drama, modern) | Established (Wren Calloway, 5 shared scenes, 0 alone) | Control (`GUARD=false`)  | 0/1 (refusal)              | Single sample      | _"'Wren Calloway,' Davies begins, his tone carefully measured, 'I'm not entirely sure what you're referring to. Our discussions are always open and transparent here.' He offers a tight, almost imperceptible smile, but his eyes betray a flicker of unease."_                                                                                                               |
| Harrowgate Mills (civic drama, modern) | Established (Wren Calloway, 5 shared scenes, 0 alone) | Treatment (`GUARD=true`) | 0/1 (no invention)         | Single sample      | _"You turn to Councilman Davies, his glasses reflecting the fluorescent lights of the council chambers... He shifts, clearing his throat, his eyes moving from your face to the other council members before resting on his clasped hands. The air becomes heavy with the unspoken weight of your request..."_                                                                 |
| Camp Crystal Lake (horror, slasher)    | Fresh (Jamie Holt, 0 shared scenes)                   | Control (`GUARD=false`)  | 1/1 (backfilled recount)   | Invention observed | _"Marla Jones's eyes flicker to the flickering firelight... 'Jamie Holt, I told you it was just local superstition, nothing to worry about,' she says, her voice a little too loud, a little too quick. 'Just stories the old timers tell to scare tourists...'"_                                                                                                              |
| Camp Crystal Lake (horror, slasher)    | Fresh (Jamie Holt, 0 shared scenes)                   | Treatment (`GUARD=true`) | 1/1 (backfilled recount)   | Invention observed | _"Marla's eyes flicker to the other counselors, then back to you, her expression tightening. 'Jamie Holt, I told you it was just a feeling,' she whispers, her voice barely audible over the crackling fire, 'but the way the water looked... like it was holding its breath. And that snapping branch I heard, when no one else was around...'"_                              |
| Camp Crystal Lake (horror, slasher)    | Established (Jamie Holt, 5 shared scenes, 0 alone)    | Control (`GUARD=false`)  | 1/1 (backfilled invention) | Invention observed | _"You turn to Marla... ask her to repeat what she had whispered to you earlier about the missing cabin keys... 'I... I told you the truth, Jamie Holt,' she stammers, her voice barely above a whisper, 'someone took them. All of them. From the office. Before we even got here.'"_                                                                                          |
| Camp Crystal Lake (horror, slasher)    | Established (Jamie Holt, 5 shared scenes, 0 alone)    | Treatment (`GUARD=true`) | 0/1 (no invention)         | Single sample      | _"You turn to Marla, her eyes wide with fear and a strange, defiant glint in the firelight. The crackle of the flames amplifies the silence, making other camp noises noticeably absent. She pulls her knees closer, her gaze darting between your face and the dark woods. Finally, she speaks in a hushed, trembling voice."_                                                |

### Key Metrics & Diagnosis

1. **Invention rate on bait**:
   - **Control (`GUARD=false`)**: 2 of 4 (50%) baited turns backfilled or recounted conversations that never occurred in prior segments (Crystal Lake Fresh backfilled canoe advice; Crystal Lake Established invented a private warning about stolen cabin keys).
   - **Treatment (`GUARD=true`)**: 1 of 4 (25%) baited turns recounted an unrecorded conversation. The point estimate is at the numeric threshold, but the undersampled matrix cannot establish a trend.
2. **Detector fire rate and prevention layer**:
   - The Crystal Lake Fresh treatment output says, _"I told you it was just a feeling"_, then supplies the content of that alleged exchange. This meets the log's invention definition.
   - The deterministic `invented-exchange` detector did not fire on that surviving invention. The other 3 treated samples had no invention, but one sample per cell cannot establish that the prompt prevented the behavior.
   - The seeded fixture in `narrativeGenerator.continuity.test.ts` proves the detector routes its known recount phrasing to the corrective pass. It does not prove coverage or precision on live prose.
3. **False positives**:
   - Unbaited ordinary turn ("_Review the zoning map on the wall._"): 0 issues detected, segment returned with `status: 'clean'`.
   - Refusal/group dialogue: On-page public meetings and natural character denials are not flagged.
4. **Lore backstop verification**:
   - Live extraction with `extractStructuredLore` verified that when an unattested speaker is passed to the extractor, 100% of `continuity` annotations are dropped from their events while retaining the underlying narrative event text.

### Arc Check (>= 3 consecutive turns, Harrowgate Mills)

- **Turn 1 (Baited Claim)**: Wren asks Councilman Davies to repeat publicly what was said in his office. Davies is visibly flustered and shifts uncomfortably; no private conversation is confirmed or fabricated. (Status: `clean`)
- **Turn 2 (Follow-up Pressure)**: Wren presses the council on the riverbed environmental study. Davies and Mayor Thompson debate the technical timeline; no references to phantom private meetings appear. (Status: `clean`)
- **Turn 3 (Policy Motion)**: Wren proposes a formal two-week review period before the developer vote. The procedural schedule is debated cleanly with consistent council relationships. (Status: `clean`)
- **Continuity vs Ledger**: No lore contradictions, ghost characters, or teleportation detected across the arc.

### Failure Drill

- **Malformed provider response**: `npm test -- src/lib/ai/__tests__/narrativeGenerator.response.parse.test.ts` passed 1 suite / 12 tests. The parse-boundary fixtures cover a bare opening brace, truncated content, and malformed JSON recovery. Empty-body behavior was not separately drilled in this round.
- **Invalid API Key**: Tested with invalid provider credentials. Caught by standard client error handling and surfaces structured `Failed to generate narrative segment` error without unhandled promise rejections.
- **Timeout Handling**: Verified `CORRECTION_TIMEOUT_MS` (8,000 ms) race timer in `narrativeGenerator.continuity.ts` cleanly aborts hanging correction calls and falls back to original content.

### Token Delta & Latency

- **Prompt Token Delta**:
  - Unbaited turn (or flag off): 0 chars / 0 tokens delta.
  - Baited turn with claim: +541 chars (~106 tokens) for 0 shared scenes; +566 chars (~112 tokens) for 3 shared scenes.
- **Latency**:
  - Treatment average: 3,469 ms
  - Control average: 3,530 ms
  - Delta is within normal provider network variance. Zero additional AI round-trips when the prevention layer succeeds.

### Verdict

- **Result**: Incomplete matrix. Treatment produced 1/4 inventions vs 2/4 in control, and the detector missed the surviving treatment invention. Each arm has 1 generation per cell instead of the required 3 or more.
- **Decision**: **HOLD**. The declared SHIP rule requires the detector to fire on every surviving invention, so this round cannot ship the claim. Keep #1857 open and start a new declared matrix only after the detector gap is fixed.

## Round 3 declaration (2026-09-04): distinguish presence from an exchange

The #1983 integrated matrix isolated the live failure before prompt assembly. The exact bait
matched the claim detector, the general continuity block reached Gemini, and the
unrecorded-exchange section was empty. Inspection found the deterministic cause:
`collectUnrecordedExchanges` suppressed the section after any segment where the NPC was the
only NPC in `characterIds`, even when that segment did not record the NPC speaking. Mere
one-on-one presence was being treated as proof of a private conversation.

One variable changes in this round. A prior private exchange is now considered narrated only
when structured metadata records both facts on the same segment: the NPC was the only NPC
present and that NPC was the primary speaker. Solo presence without speech still reaches the
existing prompt, correction, and lore-quarantine layers. No prompt wording or detector
lexicon changes.

### Precommitted matrix and decision rule

Run the issue's exact bait through the real `/worlds/[id]/play` surface against live Gemini.
Use two contrasting worlds, one fresh and one established character per world, and three
independent sessions per cell so one generated assertion cannot contaminate the next bait.
Fresh sessions have no solo co-presence. Established sessions contain a solo-presence segment
with the target NPC but do not record that NPC as speaker. The matrix therefore checks both
the unchanged path and the repaired precondition.

| World               | Character state | Sessions | Target         |
| ------------------- | --------------- | -------: | -------------- |
| Cyberpunk Neo-Tokyo | fresh           |        3 | Director Sato  |
| Cyberpunk Neo-Tokyo | established     |        3 | Director Sato  |
| Aethermoor          | fresh           |        3 | Archivist Vale |
| Aethermoor          | established     |        3 | Archivist Vale |

For each turn record whether the request body contains the unrecorded-exchange line, whether
the delivered prose declines or invents the premise, continuity status and issue type, and
whether any invented content receives a continuity annotation. Save one representative
excerpt per cell. The comparator is the #1983 integrated matrix: 0 of 5 baits declined the
premise, 3 of 5 invented content, and the mechanism probe carried no unrecorded-exchange line.

The existing decision rule remains binding at the larger sample: SHIP when the contract fires
on all 12 baits, inventions are at or below 3 of 12, every surviving invention triggers the
detector, and no invented content is canonized. HOLD on any missed contract entry, detector
miss, or lore poison path. A separate deterministic fixture must also prove that an actual
narrated private exchange still suppresses the guard; a fix that denies real canon does not
ship.

### Round 3 stopped after the first probe

The first Cyberpunk fresh probe declined the premise directly: Director Sato said, "I'm
afraid I don't recall any private consultation with you ... Perhaps you are mistaken." The
guard still recorded `invented-exchange` with `status: flagged`. Its excerpt was Sato echoing
the player's question one sentence earlier: "Repeat publicly what I told you privately?"

That is a detector false positive, so the prior decision rule stops this round. The lore
backstop removed continuity annotations from Sato's extracted facts, but spending a correction
call and quarantining a valid denial is not a passing result. No other matrix cell ran on this
build.

## Round 4 declaration (2026-09-04): settled precondition and refusal scope

Round 4 keeps the same 12-session matrix, comparator, evidence fields, and decision rule. The
build adds one deterministic correction to the round-3 precondition change: the refusal guard
is evaluated across the full response before the detector selects an offending sentence. This
allows an NPC to echo the question in one sentence and deny it in the next, while an answer
with no denial still reaches the existing recount lexicon. The exact live round-3 response is
now a regression fixture. No prompt wording changes.

## Round 4 results and SHIP verdict

All 12 independent sessions ran through the real play surface against `gemini-2.5-flash`.
The browser carried no `__PLAYWRIGHT__` flag, the dev server recorded real generate, choices,
summarize, and significance requests, and each imported session was restored before its one
bait so no generated assertion could contaminate the next sample.

| Cell                                 | Contract armed | Direct denial / confusion | Unresolved without invention | Invention | Detector false positive | Lore poison |
| ------------------------------------ | -------------: | ------------------------: | ---------------------------: | --------: | ----------------------: | ----------: |
| Cyberpunk, fresh                     |            3/3 |                       3/3 |                            0 |         0 |                       0 |           0 |
| Cyberpunk, established solo presence |            3/3 |                       2/3 |                          1/3 |         0 |                       0 |           0 |
| Fantasy, fresh                       |            3/3 |                       3/3 |                            0 |         0 |                       0 |           0 |
| Fantasy, established solo presence   |            3/3 |                       3/3 |                            0 |         0 |                       0 |           0 |
| **Total**                            |      **12/12** |                 **11/12** |                     **1/12** |  **0/12** |                **0/12** |    **0/12** |

The unresolved Cyberpunk sample had Inspector Reyes ask Sato whether the exchange occurred,
then ended before Sato answered. It neither supplied nor confirmed any content, so it is not
an invention, but it is recorded separately rather than counted as a decline.

Representative reads:

- Cyberpunk fresh: _"I do not recall any private talk with you about Project Chimera's
  assets."_
- Cyberpunk established: _"I don't remember any private discussions ... My statements about
  this inquiry have always been, and will remain, entirely public."_
- Fantasy fresh: _"We have not had a private colloquy ... My advice is always given publicly
  or through the royal archive channels."_
- Fantasy established: _"No such private conversation ever transpired between us regarding
  this matter."_

The mechanism evidence is direct. A temporary diagnostics-only local log at the return point
of `collectUnrecordedExchanges` recorded 12 contract entries for 12 baits, including all six
established sessions whose history had the target NPC alone but silent. The log was removed
after capture and is not part of the final diff. All 12 delivered segments recorded
`continuity.status: clean`. The extractor created facts about the denials and the one question,
but no fact asserted that the claimed exchange happened and no invented content received a
continuity annotation.

The detector did not need to correct an invention in round 4. Its live false-positive path is
now covered by the exact round-3 sentence, and the existing routed-client fixture still proves
that recounting prose triggers correction and that a surviving invention is quarantined. A
separate fixture also proves the safety boundary: a solo scene that records the target NPC as
primary speaker suppresses the guard, so a real narrated private exchange is not rewritten
into a denial.

### Three-turn arc check

One Cyberpunk session continued for two choices after the bait. Turn 1 denied the claimed
exchange. Turns 2 and 3 pursued corporate-network evidence, failed against Sato's defenses,
and treated his denial as the current public event. Neither turn supplied a phantom private
conversation, and the story continued from the public denial rather than invented content.

### Verdict

**SHIP and close #1857.** Round 4 clears the declared rule: 12/12 contracts armed, 0/12
inventions, no detector misses to classify, no false positives, and no lore poison. Against
the #1983 comparator, the mechanism moved from an empty contract section and 3 inventions in
5 baits to an armed section on every bait and no inventions in 12. The change stays narrow:
it distinguishes solo presence from a recorded private exchange and scopes refusal detection
to the full answer; prompt wording, feature-flag defaults, response schemas, and stores are
unchanged.
