# Narraitor skill library — capability-transfer system

A distilled, evidence-disciplined skill library that lets future sessions (weaker models and human engineers alike) carry Narraitor forward: how to navigate, debug, validate, evaluate AI behavior, avoid settled mistakes, and decide ship/hold. Authored 2026-07-04 against `develop` @ 4bec88e6; provenance and re-verification commands live inside each skill.

## Inventory

**Pre-existing skills (kept, referenced as siblings — not part of this pass):**
`narraitor-architecture` (authoring conventions) · `narraitor-pattern-alignment-skill` (post-edit check) · `review` (PR review) · `style-port` (inline-style porting).

**Added after the distillation pass:**
`narraitor-playtest-loop` (live multi-turn play sessions scored for story quality) — the taste instrument the distilled library had no answer for. Ships its own `rubric.md` and reusable world specs under `worlds/`.

**The distilled library (16 skills):**

| Skill | One line | Invoke when |
|---|---|---|
| narraitor-repo-orientation | The map: where things live, what not to trust | First action in a cold session; any "where is X" |
| narraitor-build-test-env | Install/run/verify + env-vs-code failure classification | Setup, command failures, ports, before claiming gates green |
| narraitor-debugging-playbook | Symptom → first discriminating check | Anything broken; before a second fix attempt |
| narraitor-architecture-contract | Invariants + blast-radius checklists | Store shape changes, boundary questions, deps:validate failures |
| narraitor-change-control | Evidence bar for every status word; re-baseline + correction rules | Before "done/fixed/verified"; before any baseline update |
| narraitor-ai-quality-discipline | The multi-world eval matrix for AI behavior claims | Any "the output is better/works" claim |
| narraitor-prompt-template-governance | Prompt registry lifecycle + leakage/eval gates | Any prompt/template change or review |
| narraitor-storybook-app-parity | Promotion ladder S0→S3; isolation-vs-integration checks | "Works in Storybook but…"; any "component done" claim |
| narraitor-feature-experiment-lifecycle | Hunch → issue → gates → ship/hold/retire memo | New ideas, experiments, fate of half-done work |
| narraitor-validation-and-qa | What each test tier proves and cannot prove | Choosing tests; interpreting green/red; release QA |
| narraitor-failure-archaeology | Settled battles — do not re-fight | Before removing/replacing anything that "looks wrong" |
| narraitor-domain-reference | The domain model + platform quirks (stores, App Router, Gemini) | Reasoning about how the system fits together |
| narraitor-diagnostics-and-tooling | Measure, don't eyeball: curls, IndexedDB, computed styles | Producing evidence for any runtime claim |
| narraitor-docs-and-writing | Docs of record, stale markers, append-only corrections, voice | Any doc/prose work; doc-vs-code contradictions |
| narraitor-product-frontier | Open problems (memory, consequences, streaming, evals) + first steps | Post-1.0 ambition; "what's next" |
| narraitor-hardest-problem-campaign | Executable v1.0 release-gate campaign (live AI-loop validation) | "Get v1.0 out"; whole-loop validation; resuming the campaign |

**Foundation & meta documents:** `_distillation_plan.md` (the contract) · `_repo_capability_map.md` (verified repo map) · `_expert_distillation_notes.md` (heuristics, red flags, decision trees, lessons) · `_trigger_matrix.md` (trigger engineering) · `_model_transfer_eval.md` (14-task transfer benchmark) · `_review_factual/_doctrine/_usability.md` + `_fixer_report.md` (Phase 6) · `_uncertainty_register.md` (honest gaps) · `_maintenance_plan.md` (drift control).

## Dependency map

```text
change-control  <- the spine; every skill's status claims route through it
  ├─ validation-and-qa ──── which tier proves what
  │    └─ storybook-app-parity ── the "integrated" bar
  ├─ ai-quality-discipline ── the AI evidence bar
  │    ├─ prompt-template-governance ── consumes the matrix as gate G4
  │    └─ playtest-loop ── one way to meet the bar for story quality specifically
  ├─ feature-experiment-lifecycle ── wraps delivery; emits ship/hold memos
  └─ docs-and-writing ── how verdicts get written down

repo-orientation -> build-test-env -> debugging-playbook -> diagnostics-and-tooling
  (locate -> run -> triage -> measure)

architecture-contract <-> domain-reference (invariants <-> meaning)
failure-archaeology ── consulted by architecture-contract, debugging-playbook, product-frontier
product-frontier -> feature-experiment-lifecycle (ambition ships through the lifecycle)
hardest-problem-campaign ── composes: ai-quality-discipline + diagnostics + validation + change-control
```

## Suggested first skills for a new session

1. `narraitor-repo-orientation` — always.
2. Then by intent: fixing something → `debugging-playbook`; building something → `narraitor-architecture` (conventions) + `architecture-contract` (invariants); touching AI behavior → `ai-quality-discipline`; asked to release → `hardest-problem-campaign`.
3. Before ANY status claim: `change-control`.

## Automatic vs manual invocation

**Safe for automatic model invocation** (procedural, read-mostly, self-limiting): repo-orientation, build-test-env, debugging-playbook, architecture-contract, change-control, ai-quality-discipline, prompt-template-governance, storybook-app-parity, validation-and-qa, failure-archaeology, domain-reference, diagnostics-and-tooling, docs-and-writing.

**Prefer deliberate/manual invocation** (long-running, owner-decision-heavy, or spends money/tokens): `hardest-problem-campaign` (hours of work + owner sign-offs + live generation costs), `playtest-loop` (hundreds of live Gemini calls per campaign, owner check-in between every run), `feature-experiment-lifecycle` P9 decisions, `product-frontier` (scoping conversations). Auto-triggering their *advice* is fine; executing their protocols is a deliberate act.

## Honesty contract

Every volatile claim in this library carries an evidence label (`known`/`observed`/`candidate`/`unverified`/`stale-risk`/`owner-confirmation-needed`) and each skill ends with re-verification commands and dated provenance. If a skill contradicts the tree, the tree wins — mark the skill per `narraitor-docs-and-writing` and fix it.

Last generated: 2026-07-04
