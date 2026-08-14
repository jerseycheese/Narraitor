# Trigger matrix — Narraitor skill library

How each skill is meant to fire, its likeliest sibling conflicts, and how its description avoids false positives. Per-skill eval queries live in `<skill>/evals/trigger_eval.json`. Manual invocation always works: `/<skill-name>` or "use the <skill-name> skill".

General disambiguation rules baked into the descriptions:
1. **Broken vs bad vs unproven:** erroring → `debugging-playbook`; AI output *bad* → `ai-quality-discipline`; claim *unproven* → `change-control`/`validation-and-qa`.
2. **Before vs after:** authoring conventions → pre-existing `narraitor-architecture`; invariants/blast radius → `architecture-contract`; post-edit check → pre-existing `narraitor-pattern-alignment-skill`.
3. **How vs whether:** measurement mechanics → `diagnostics-and-tooling`; which tier proves what → `validation-and-qa`.
4. Pre-existing repo skills keep their lanes: `style-port` (porting inline styles), `review` (PR review).

| Skill | Should trigger (examples) | Should NOT trigger (route to) | Anti-false-positive design |
|---|---|---|---|
| repo-orientation | "where do the stores live"; "how's this repo organized"; new session cold start | debugging a failure (debugging-playbook); writing a component (narraitor-architecture) | Scoped to *orientation/location* questions + "first action in a session"; defers all doing to siblings |
| build-test-env | "npm test is failing with OOM"; "playwright won't run locally"; "port 3000 taken"; fresh worktree setup | assertion failures in a healthy env (debugging-playbook / test-fix agent); choosing test tiers (validation-and-qa) | Keyed to environment/setup/command mechanics, explicitly excludes assertion-level failures |
| debugging-playbook | "story page blank after clicking begin"; "hydration mismatch warning"; "state gone after reload"; second failed fix attempt | env/install/port issues (build-test-env); bad-but-working AI prose (ai-quality-discipline); settled battles (failure-archaeology) | Symptom-driven table; description enumerates concrete symptoms rather than generic "debug" |
| architecture-contract | "can GameSession import from inventoryStore directly?"; "changing narrativeStore shape"; "deps:validate is failing" | naming/file-placement questions (narraitor-architecture); post-edit review (pattern-alignment) | Anchored to invariants/boundaries/persist-migrate vocabulary, not general design chat |
| change-control | "can I call this done?"; "I'll just re-baseline the snapshots"; "mark #N fixed"; correcting an earlier wrong claim | which tests to run (validation-and-qa); ship/hold product call (feature-experiment-lifecycle) | Fires on status LANGUAGE and baseline changes, not on doing the work itself |
| ai-quality-discipline | "the new prompt reads way better"; "AI handles empty inventory fine now"; "is one playthrough enough?" | pipeline errors/500s (debugging-playbook); where prompts live (prompt-template-governance) | Trigger phrases are QUALITY-claims ("reads better", "works on my world"), not error reports |
| prompt-template-governance | "add a template for dream sequences"; "can I tweak the prompt inline in the generator?"; reviewing a prompt PR | judging output quality (ai-quality-discipline); generation config changes (change-control + config.ts) | Scoped to template lifecycle/registry mechanics; hands eval work to its sibling explicitly |
| storybook-app-parity | "fine in Storybook, blank in the app"; "is a story enough to call it done?"; writing withStores seeds | pixel drift within one surface (debugging-playbook); shipping decision (feature-experiment-lifecycle) | Fires on ISOLATION-vs-INTEGRATION comparisons and promotion claims, not all Storybook work |
| feature-experiment-lifecycle | "I have an idea for endings"; "let's try a quick experiment"; "does this ship or hold?" | scoped-issue implementation (owner pipeline analyze-issue/tdd-implement); bug fixes (change-control) | Keyed to hunch→decision lifecycle words (idea/try/experiment/ship/hold), not build mechanics |
| validation-and-qa | "which tests does this need?"; "visual suite is green so we're good, right?"; release QA planning | running/fixing the env (build-test-env); AI matrix mechanics (ai-quality-discipline) | Scoped to evidence-tier reasoning; explicitly not the debugging path |
| failure-archaeology | "this storePubSub looks like pointless indirection, rip it out?"; "why is joyride pinned to a prerelease?"; "let's add Tailwind" | new failures (debugging-playbook); open frontier work (product-frontier) | Fires on remove/replace/why-is-it-built-this-way intents toward EXISTING deliberate choices |
| domain-reference | "what's the relationship between worlds and sessions?"; "why is parsing Gemini output so elaborate?"; "how does theming work here" | invariant enforcement (architecture-contract); orientation/paths (repo-orientation) | Conceptual "explain the model" questions, not location or enforcement questions |
| diagnostics-and-tooling | "how do I check what's actually in the store?"; "smoke the AI routes"; "prove the route is up" | interpreting what to measure (debugging-playbook); DS-work visual verification norms (validation-and-qa) | HOW-to-measure verbs (inspect/smoke/prove/check state), not what-went-wrong narratives |
| docs-and-writing | "update the testing guide"; "DESIGN.md contradicts the code"; "log a correction, my earlier claim was wrong" | verifying whether the claim is true (change-control); PR review (review) | Scoped to writing/marking/correcting prose, not truth-establishment |
| product-frontier | "what would make the story feel smarter long-term?"; "post-1.0, what's worth building?"; "add memory to the AI" | v1.0 gate (hardest-problem-campaign); delivery of a scoped idea (feature-experiment-lifecycle) | Future/ambition phrasing; hands delivery to the lifecycle skill |
| hardest-problem-campaign | "let's get v1.0 out"; "validate the whole play loop"; "is this shippable?"; resuming the release campaign | single bug fixes (debugging-playbook); post-1.0 ideas (product-frontier) | Release-gate/whole-loop phrasing only; single findings are fenced out in its own text |

**Highest-risk conflicts to watch in evals:**
- debugging-playbook ↔ build-test-env (failure vs environment) — resolved by "does it fail before your code runs?"
- ai-quality-discipline ↔ prompt-template-governance (judging vs lifecycle) — resolved by "quality claim vs template mechanics".
- change-control ↔ validation-and-qa (may-I-claim vs which-tier) — change-control owns the words, validation owns the tiers.
- storybook-app-parity ↔ debugging-playbook on "works in Storybook but…" — parity owns the comparison; the playbook's symptom row points there.
- New library ↔ pre-existing `narraitor-architecture`/`narraitor-pattern-alignment-skill` — pre/post-authoring lanes stated in both new skills' "When not to use".

`npm run skills:trigger-eval -- --pairs` scores exactly the skills named in that list, so if a pair moves here, update `CONFUSABLE_PAIR_SKILLS` in `scripts/run-trigger-eval.cjs` to match.

Last generated: 2026-07-04
