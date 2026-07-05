# Distillation plan — Narraitor capability-transfer skill library

Status: contract for the authoring pass. Written before any skill authoring, per the distillation brief.
Date: 2026-07-04. Author: Fable 5 session on `develop` @ 4bec88e6.

## 1. Intended future users

- **Model sessions weaker than the author**: GPT 5.5, Opus 4.8, Sonnet-class coding sessions running in this repo with `CLAUDE.md` + these skills as their only project context.
- **Junior/mid-level human engineers** picking up Narraitor cold — competent at React/TS generally, missing the project-specific judgment (what to distrust, where the bodies are buried).
- **The project owner** (Jack) reviewing high-stakes product and AI-behavior decisions — needs the skills to force evidence-backed claims so review is fast.

## 2. Capability types to preserve

| Capability | Primary skill home |
|---|---|
| Repo navigation | narraitor-repo-orientation |
| Architecture reasoning (domains, stores, App Router) | narraitor-architecture-contract |
| Debugging without wandering | narraitor-debugging-playbook |
| Test/build/Storybook execution | narraitor-build-test-env |
| AI narrative quality discipline | narraitor-ai-quality-discipline |
| Storybook-vs-app / isolation-vs-integration parity | narraitor-storybook-app-parity |
| Design-system + prompt-template governance | narraitor-prompt-template-governance (+ existing style-port, ds rules) |
| Evidence review / claim skepticism | narraitor-validation-and-qa + narraitor-change-control |
| Forensic failure archaeology | narraitor-failure-archaeology |
| Documentation maintenance | narraitor-docs-and-writing |
| Skeptic/adversarial review | narraitor-change-control + evals |
| Ship/hold decisions | narraitor-feature-experiment-lifecycle |
| Domain knowledge a mid-level lacks | narraitor-domain-reference |
| Measurement over eyeballing | narraitor-diagnostics-and-tooling |
| Frontier / open problems | narraitor-product-frontier |
| The hardest live problem, as an executable campaign | narraitor-hardest-problem-campaign |

## 3. Failure modes the skills must prevent

1. Hallucinated paths, props, commands, routes, or store fields (e.g. inventing a `narrativeStore` field instead of reading `src/state/narrativeStore.ts`).
2. Storybook-only or unit-test-only green treated as app-verified ("works in Storybook" ≠ integrated).
3. Testing on a single world/character and calling it general.
4. One good AI generation treated as a reliable prompt.
5. A component that only works with mock data called "integrated".
6. Hydration/persistence bugs hidden because only the happy path was tried (IndexedDB rehydration races are a known repo trap).
7. Reaching across domain boundaries or mutating a Zustand store outside its actions (dependency-cruiser gates exist; skills must say why).
8. Overwriting history instead of appending corrections.
9. Stale docs overriding current repo evidence (Tailwind refs, deleted `/dev/design-system*` guide, removed ExportService are known stale-doc risks).
10. "Claude rewrote the design" with hardcoded values instead of governed design tokens (stylelint enforces; skills must route to tokens/style-port).
11. Re-fighting settled battles (react-joyride bump, pub-sub removal, dead-code re-addition).
12. Calling a failure a "transient flake" without re-running the exact check.

## 4. Expected final artifact inventory

- `_distillation_plan.md` (this file), `_repo_capability_map.md`, `_expert_distillation_notes.md` — foundations.
- 16 skill folders `narraitor-*/SKILL.md`, each with `evals/trigger_eval.json` (≥20 queries), `reference.md` where depth is needed, `templates/` where an output schema helps.
- `_trigger_matrix.md` — trigger engineering across the library.
- `_model_transfer_eval.md` — ≥12 transfer benchmark tasks.
- `_review_factual.md`, `_review_doctrine.md`, `_review_usability.md`, `_fixer_report.md` — Phase 6 outputs.
- `README.md` — index, dependency map, invocation guidance.
- `_uncertainty_register.md` — honest gaps.
- `_maintenance_plan.md` — drift checks and re-verification schedule.

## 5. Ground rules for authoring (binding)

- Every command/path/field verified against the repo this session, or labeled `unverified` / `stale-risk` / `owner-confirmation-needed`.
- Repo-relative paths only as load-bearing references.
- No skill routes around change-control, design-token governance, or the test/QA gates.
- SKILL.md stays concise and procedural; archaeology and catalogs go to `reference.md`.
- Existing skills (`narraitor-architecture`, `narraitor-pattern-alignment-skill`, `style-port`, `review`) and repo agents are referenced as siblings, never duplicated or replaced.
- Project memory (`~/.claude/projects/.../memory/`) is a source of distilled lessons, but every memory-derived claim gets re-verified against the current tree before it is encoded here; personal/machine paths are not copied in as load-bearing.
