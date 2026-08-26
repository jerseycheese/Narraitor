# Prompt/template eval log — delivered commitments in prose baits and choices (#1963)

- Change: two coordinated additions to the continuity contract:
  1. Targeted prose bait detection: derive `isReconfirmationRequested` on a `ContinuityCommitment` when the player action uniquely asks to re-promise a delivered commitment; flag bare assent or oblique future delivery as `stale-promise` while keeping refusals, recaps, and unrelated promises clean.
  2. Choice prompt injection: feed delivered commitments into the live aligned-choice prompt as a short "already settled" block (max 6 items, < 150 tokens) under the feature flag `SETTLED_COMMITMENT_CHOICES` (`NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES`, default off).
- Diff: `src/types/continuity.types.ts`, `src/lib/promptTemplates/templates/narrative/context.ts`, `src/lib/lore/continuityLedger.ts`, `src/lib/lore/continuityGuardrail.ts`, `src/lib/ai/narrativeGenerator.continuity.ts`, `src/lib/featureFlags.ts`, `src/lib/promptTemplates/templates/narrative/choiceTypeTemplates.ts`, `src/lib/ai/choiceGenerator.prompt.ts`, plus tests.
- Date / evaluator: 2026-08-26, implementation session.
- Parent: #1831, #1856, #1857, issue #1963.

## Precommitted Protocol and Decision Rule

### Evaluated Matrix

Matched checkpoints containing one delivered commitment across:
- **Harrowgate Mills**: Fresh character (Wren Calloway) and Established character.
- **Camp Crystal Lake**: Fresh character and Established character.

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
