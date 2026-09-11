# Prompt/template eval log - decision-attributed world costs (#2020)

- Change: pass the chosen decision and its outcome into world cost extraction; gate prompt-side decision attribution and schema rule on `DECISION_ATTRIBUTED_WORLD_COSTS` (`NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS`); parse per-entry `causedByDecision: true`; record `decisionId` on segment metadata note when a cost was caused by the decision.
  - Treatment: `DECISION_ATTRIBUTED_WORLD_COSTS=true`. Renders the chosen decision when present and adds extraction rule: `- If a cost was directly caused by the player's chosen decision above, set "causedByDecision" to true on that cost entry; otherwise false.`
  - Control: `DECISION_ATTRIBUTED_WORLD_COSTS=false`. Omits decision context and rule, keeping prompt section byte-identical to baseline.
- Diff: `src/types/worldCost.types.ts`, `src/lib/featureFlags.ts`, `.env.example`, `src/lib/ai/worldCostExtraction.ts`, `src/lib/narrative/applyWorldClockUpdates.ts`, `src/lib/narrative/applyWorldCost.ts`, plus tests.
- Date / evaluator: 2026-09-10, live evaluation with Gemini 2.5 Flash.
- Parent: #1882, #1883, #1983, issue #2020.

## Precommitted Protocol and Decision Rule

### Evaluated Matrix

Paired decisions across two canonical story cells:
1. **Camp Crystal Lake** (horror / slasher):
   - Pair 1: Risky sprint into the storm toward radio tower vs Safe wedge pry bar and wait under cover.
   - Pair 3: Risky wade across flooded spillway vs Safe retreat to boat shed.
2. **Harrowgate Mills** (civic drama):
   - Pair 2: Risky public accusation on council chamber floor without proof vs Safe observe quietly from gallery and transcribe notes.

### Ship Criteria

1. Prompt isolation: with flag off, prompt remains byte-identical to pre-change baseline. With flag on and no decision, prompt omits decision block cleanly.
2. Risky decisions that result in injury, disgrace, or material loss have `causedByDecision: true` attributed to the resulting cost entry.
3. Safe choices produce zero false-positive decision-attributed costs.
4. Parsing integrity: parser keeps `causedByDecision: true` strictly on literal `true`, dropping strings, numbers, or false values.
5. Store & note integrity: `applyWorldCost` records `decisionId` on `note.imposed` only when `causedByDecision` is true.

### Rollout Decision Rule

- **Pass**: If treatment correctly attributes 100% of risky-decision costs to the decision while producing zero false-positive costs on safe choices, flip flag default to `true` with kill switch in `.env.example`.
- **Fail / Hold**: If model hallucinates attribution on safe choices, fails to attribute clear consequences, or regresses prompt parsing, retain default `false` and log failure mode.

---

## Live Evaluation Results (2026-09-10)

Run against live Gemini 2.5 Flash across 3 paired cases (6 runs per arm, 12 calls total).

### 1. Coverage Matrix & Results

| Case | Cell & Action | Risky? | Treatment Imposed (`causedByDecision`) | Control Imposed | Verdict |
|---|---|---|---|---|---|
| Pair 1 Risky | Camp Crystal Lake: Sprint into the dark toward radio tower (failure) | Yes | `[{"kind":"condition","detail":"wrenched right ankle","causedByDecision":true}]` | `[{"kind":"condition","detail":"deep slice on right arm"}]` | Pass |
| Pair 1 Safe | Camp Crystal Lake: Wedge pry bar and wait under cover (success) | No | `[]` | `[]` | Pass |
| Pair 2 Risky | Harrowgate Mills: Accuse Thorne on council floor without proof (failure) | Yes | `[{"kind":"condition","detail":"discredited before the council","causedByDecision":true}]` | `[{"kind":"condition","detail":"discredited before the council"}]` | Pass |
| Pair 2 Safe | Harrowgate Mills: Observe quietly from gallery and take notes (success) | No | `[]` | `[]` | Pass |
| Pair 3 Risky | Camp Crystal Lake: Wade across flooded spillway in dark (mixed) | Yes | `[{"kind":"condition","detail":"deep gash on left thigh","causedByDecision":true}]` | `[{"kind":"condition","detail":"deep gash on left thigh"}]` | Pass |
| Pair 3 Safe | Camp Crystal Lake: Retreat to boat shed and wait out flash flood (success) | No | `[]` | `[]` | Pass |

### 2. Attribution Accuracy & False Positive Checks

- **Risky Choice Attribution Rate**: 3 / 3 (100.0%) correctly set `causedByDecision: true`.
- **Safe Choice False-Positive Rate**: 0 / 3 (0.0%). Safe turns imposed zero unearned costs.
- **Control Arm Verification**: 0 / 3 in Control carried `causedByDecision` (field cleanly omitted by the parser when absent in model output).

### 3. Latency & Token Overhead

- **Token Delta**: ~25-35 input tokens for the decision block and schema instruction.
- **Latency**:
  - Treatment Average: 2,356 ms
  - Control Average: 2,482 ms
  - Delta: -126 ms (no latency penalty).

## Verdict

- **PASS**. All 3 risky choices accurately attributed the resulting condition to the decision (`causedByDecision: true`), while all 3 safe choices cleanly avoided imposing world costs.
- Feature flag `DECISION_ATTRIBUTED_WORLD_COSTS` defaults to `true` in `src/lib/featureFlags.ts`, with `# NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS=false` maintained as the kill switch in `.env.example`.
