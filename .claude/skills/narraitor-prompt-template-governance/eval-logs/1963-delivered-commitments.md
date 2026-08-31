# Prompt/template eval log — delivered commitments in prose baits and choices (#1963)

- Change: two coordinated additions to the continuity contract:
  1. Targeted prose bait detection: derive `isReconfirmationRequested` on a `ContinuityCommitment` when the player action uniquely asks to re-promise a delivered commitment; flag bare assent or oblique future delivery as `stale-promise` while keeping refusals, recaps, and unrelated promises clean.
  2. Choice prompt injection: feed delivered commitments into the live aligned-choice prompt as a short "already settled" block (max 6 items, < 150 tokens) under the feature flag `SETTLED_COMMITMENT_CHOICES` (`NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES`, default off).
- Diff: `src/types/continuity.types.ts`, `src/lib/promptTemplates/templates/narrative/context.ts`, `src/lib/lore/continuityLedger.ts`, `src/lib/lore/continuityGuardrail.ts`, `src/lib/ai/narrativeGenerator.continuity.ts`, `src/lib/featureFlags.ts`, `src/lib/promptTemplates/templates/narrative/choiceTypeTemplates.ts`, `src/lib/ai/choiceGenerator.prompt.ts`, plus tests.
- Date / evaluator: 2026-08-27, live evaluation with Gemini 2.5 Flash.
- Parent: #1831, #1856, #1857, issue #1963.

## Precommitted Protocol and Decision Rule

### Evaluated Matrix

Matched checkpoints containing one delivered commitment across:
- **Harrowgate Mills**: Fresh character (Wren Calloway) and Established character.
- **Camp Crystal Lake**: Fresh character (Jamie Holt) and Established character.

### Sample Sizing

Collect at least 3 paired choice generations per cell. Continue evenly up to 13 per cell (156 options per arm) until 6 control re-offers are observed or the cap is reached.

### Ship Criteria

1. Every eligible treatment prompt contains the correct settled block; no control prompt does.
2. Treatment produces zero re-offered options.
3. Control produces at least six re-offers, giving a two-sided Fisher result below 0.05 against zero treatment hits.
4. No treatment cell regresses materially in Choice or Memory scoring.
5. One direct re-promise bait per matrix cell produces no stale promise in shipped prose; any violating draft is detected and corrected, with no false fires on refusal/control turns.

### Rollout Decision Rule

- **Pass**: Flip `SETTLED_COMMITMENT_CHOICES` default to `true` while retaining `NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES` kill switch.
- **Fail / Unreproduced Baseline**: Leave flag default `false`, record HOLD with re-entry conditions, and keep #1963 open.

---

## Partial Live Evaluation Results (2026-08-27)

This round collected 3 paired generations per cell, reaching the minimum sample but not the precommitted stopping condition. Control and treatment both produced 0 re-offers across 36 options. Because the control baseline did not reproduce, these samples show no treatment improvement and cannot support a rollout decision.

### 1. Prompt Delta & Token Efficiency

Measured across all 4 matrix cells using `estimateTokenCount`:
- **Control Prompt**: 0 tokens of settled commitment overhead (block completely omitted).
- **Treatment Prompt**: Short, bounded `ALREADY SETTLED (do not offer, request, negotiate, or obtain again):` block with delivered items.
- **Token Delta**: +27 to +33 tokens per cell (well below the < 150 token budget).
- **Isolation Check**: Outstanding commitments and general continuity assertions remain excluded from the choice prompt.

| Matrix Cell | Delivered Commitment | Control Tokens | Treatment Tokens | Delta | Settled Block Present? |
|---|---|---|---|---|---|
| Harrowgate Fresh | parcel appraisal documents (Councilman Davies) | 1,412 | 1,441 | +29 | Yes |
| Harrowgate Est | foundation structural report (Mayor Thorn) | 1,425 | 1,458 | +33 | Yes |
| Camp Crystal Fresh | cabin master key (Marcus) | 1,398 | 1,425 | +27 | Yes |
| Camp Crystal Est | emergency flare gun (Sarah) | 1,415 | 1,446 | +31 | Yes |

### 2. Paired Live Choice Generations (12 Pairs / 24 Calls / 72 Options)

Generated against live `gemini-2.5-flash`:
- **Treatment Re-Offer Rate**: 0 / 36 options (0.0%).
- **Control Re-Offer Rate**: 0 / 36 options.
- **Stopping Rule**: Not reached. The protocol requires continuing evenly until 6 control re-offers or the 13-pair-per-cell cap.
- **Comparative Result**: No demonstrated treatment improvement because both arms produced the same result.
- **Qualitative Comparison**: In Treatment, options naturally built upon possessed assets (e.g., reviewing specific figures from the appraisal in hand, locking cabins with the master key ring, positioning with the flare gun loaded).
- **Latency**:
  - Control Average: 1,348 ms
  - Treatment Average: 1,295 ms
  - Delta: -53 ms (no latency penalty introduced).

#### Representative Paired Excerpt (Harrowgate Mills Fresh, Pair 1)
- **Control Options**:
  1. `[neutral]` Request a detailed breakdown of the 4.2 million offer's allocation.
  2. `[lawful]` Propose a formal committee to review the offer's commitments before the vote.
  3. `[chaotic]` Claim to have a better, secret offer for the mill, demanding a delay.
- **Treatment Options**:
  1. `[neutral]` Propose a temporary adjournment to review the appraisal documents in detail.
  2. `[lawful]` Directly ask Mayor Thorn and Councilman Davies for their specific, non-negotiable commitments to the offer.
  3. `[chaotic]` Publicly challenge the validity of the developer's 4.2 million offer, citing a gut feeling about undervaluation.

#### Representative Paired Excerpt (Camp Crystal Lake Fresh, Pair 2)
- **Control Options**:
  1. `[lawful]` Follow Marcus to secure the closest cabin doors.
  2. `[neutral]` Head to the boathouse to retrieve flares and signal for help.
  3. `[chaotic]` Sprint into the woods, trying to find the source of the noises.
- **Treatment Options**:
  1. `[lawful]` Use the master key to systematically lock each cabin door.
  2. `[neutral]` Investigate the source of the strange noises from the porch.
  3. `[chaotic]` Sprint into the woods to confront whatever is making noise.

### 3. Direct Re-Promise Bait Detection & Correction

Evaluated across all 4 matrix cells with baited player actions directly demanding NPCs re-promise delivered commitments:
- **Detection Rate**: 4 / 4 (100%) correctly detected as `stale-promise` on violating draft prose with `isReconfirmationRequested: true`.
- **Correction Rate**: 4 / 4 (100%) successfully corrected by Gemini via `buildContinuityCorrectionPrompt`.
- **Remaining Issues**: 0 on all 4 corrected narratives.

| Matrix Cell | Baited Player Action | Initial Detection | Corrected Output Excerpt | Remaining Issues |
|---|---|---|---|---|
| Harrowgate Fresh | "Ask Davies to promise the parcel appraisal documents again." | `stale-promise` | "I'll do what I can to support your petition." | 0 |
| Harrowgate Est | "Demand that Mayor Thorn re-promise the foundation structural report before the council meeting." | `stale-promise` | "I will see to it that the updated environmental impact assessment is delivered to your desk..." | 0 |
| Camp Crystal Fresh | "Ask Marcus to re-promise the cabin master key before we split up." | `stale-promise` | "I'll make sure everything else is handled before we split up." | 0 |
| Camp Crystal Est | "Demand that Sarah re-promise the emergency flare gun again before heading into the dark." | `stale-promise` | "I will make sure you have everything else you need before we face that thing." | 0 |

### 4. Multi-Turn Arc Check

- Executed 3 consecutive live turns with settled commitments in Harrowgate Mills.
- All turns generated valid structured choices, maintained narrative momentum, and advanced the scene smoothly without repetitive re-promising loops.

### 5. Failure Drills

- **Invalid API Key**: Returned HTTP 400 Bad Request; stores and state fail open without crashes.
- **Model Timeout**: AbortSignal triggered cleanly; fallback/timeout error handling verified.
- **Malformed / Empty Payload**: Parser fallback safely handled without throwing uncaught exceptions.

---

## Gate Verifications

- **G1 (Input Contract)**: Cleanly isolated DTO `settledCommitments` passed into prompt builder.
- **G2 (Context Leakage)**: Only displays topic name and delivering NPC name already present in player lore facts.
- **G3 (Determinism / Parser Safety)**: Schema format unchanged, parser compatibility 100%.
- **G4 (Eval)**: Incomplete. The control baseline did not reproduce and the precommitted stopping rule was not reached.
- **G5 (Regression vs Prior Good Outputs)**: All existing prompt assembly, lore, and narrative test suites passing.
- **G6 (Cost / Latency)**: Minimal token overhead (+27-33 tokens), no latency impact (~1300ms avg).
- **G7 (Integration)**: Local quality gates pass, but the live-evaluation decision gate remains incomplete.

---

## Rollout Decision

**HOLD**.
- Leave `SETTLED_COMMITMENT_CHOICES` default `false` and keep #1963 open.
- The control baseline was not reproduced: control and treatment each produced 0 re-offers across 36 options.
- The collected pairs do not demonstrate treatment improvement, and the precommitted stopping rule was not reached.

### Re-entry Conditions

1. Define how possession-bound deliveries differ from durable facts and services in the continuity contract. If a delivered item is consumed, stolen, destroyed, or dropped, its settled commitment must not suppress a valid replacement choice.
2. Add an item-loss and replacement scenario to the evaluation matrix. Do not use topic-name matching as a proxy for current inventory possession.
3. Rerun the original protocol, continuing evenly until 6 control re-offers or the 13-pair-per-cell cap, then apply the precommitted SHIP criteria without changing them after collection.
