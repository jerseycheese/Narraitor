# Expert distillation notes — Narraitor

Raw expert-judgment capture, written before skill authoring. Skills encode operational subsets of this; this file is the superset and the audit trail.
Date: 2026-07-04. Session baseline: `develop` @ 4bec88e6, clean tree, all four quality gates verified green this session (`npm test` 353 suites / 2399 tests, `type-check`, `lint`, `lint:css` — all exit 0).

Evidence labels used throughout: `known` (verified this session), `observed` (seen in repo/memory, re-verified), `candidate` (plausible, needs confirmation), `unverified`, `stale-risk`, `owner-confirmation-needed`.

## 1. Expert heuristics

Rules an expert applies automatically that a weaker session will miss:

- **Storybook/app disagreement is a data problem, not a CSS problem.** If a component looks right in Storybook and wrong in the app, do not restyle it. Storybook feeds it mock props/seeded stores; the app feeds it hydrated IndexedDB state. Find the state or data mismatch first. (known — Storybook uses a `withStores` decorator + MSW; the app hydrates from IndexedDB via `src/state/persistence.ts`.)
- **Store shape changes have a blast radius you must enumerate before editing.** Any change to a Zustand store's shape must be traced through: every selector reading it, the persisted slice (IndexedDB survives deploys — old shapes WILL arrive via rehydration), `migrate`/`version` in the persist config, the store's `__tests__`, e2e seeding helpers, and Storybook `withStores` seeds. (known — stores in `src/state/`, persistence seam `src/state/persistence.ts`.)
- **A single good AI generation is a signal, not evidence.** Gemini output varies per call, per world tone, per character sheet. A prompt change judged on one playthrough in one world is untested. Minimum bar: multiple worlds with different tones + at least one fresh character, and deliberately exercise the non-happy path (empty/malformed/slow responses).
- **Docs claiming "done" without a test, PR, or artifact are claims, not facts.** Downgrade to `stale-risk` and verify against the current tree before acting on them. This repo has documented cases of docs outliving the code they describe (Tailwind, ExportService, `/dev/design-system*`).
- **If you can't point at the template that produced an AI output, you can't reason about it.** Narrative prompts are registered generators (`src/lib/promptTemplates/narrativeTemplateManager.ts`, templates under `src/lib/promptTemplates/templates/`). Output quality analysis starts from the template + context builder, never from vibes about the output text.
- **Mock-data green does not survive real AI responses.** Real responses are sometimes empty, malformed JSON, slow (routes now have explicit timeouts — PR #1506), or refusals. A component is integrated only when it's been seen handling the real route's failure modes, not just MSW's happy path.
- **The failing command is the unit of proof.** Never report "fixed" without re-running the exact command that originally failed and showing it green. Never call a failure a flake without re-running it at least twice.
- **Memory and docs decay; the tree is truth.** Example from this very session: project memory said `src/lib/ai/middleware/streamResilience.ts` existed but was unwired — it has since been deleted entirely (no `resilientStream` hits in `src/`). Every remembered path gets re-verified before use.
- **When lint/stylelint blocks you, the fix is upstream, not an override.** A stylelint color failure means a raw value belongs in a token; a dependency-cruiser failure means a domain boundary is being crossed. Re-baselining or disabling the rule is a deliberate, owner-visible act, never a workaround.
- **Green visual baselines can be a coverage gap.** A visual test passing proves the seeded state renders identically — not that the feature works. Check what state the baseline actually covers before citing it as evidence.
- **One change, many baselines.** CSS touching shared chrome (sidebar, header, cards) shifts visual baselines across many specs. Regenerate all affected baselines deliberately and at once; a single-spec height diff usually means a stale base — rebase, don't chase.
- **Port and process hygiene before blame.** "App is broken" often means the wrong checkout is serving :3000. `lsof -nP -iTCP:3000 -sTCP:LISTEN` before debugging anything served.

## 2. Red-flag patterns

Phrases that must trigger a specific check before acceptance:

| Phrase | What must be checked |
|---|---|
| "works in Storybook" | Has it rendered in the running app with hydrated store data? Storybook = isolation tier only. |
| "tests pass" | Which tier? Unit green ≠ integrated ≠ QA-verified. Name the tier and what it can't prove. |
| "validated" | By what artifact? Command output, screenshot, PR, CI run — or it's a claim. |
| "the AI handles it" | Show the template + the parsing/normalization path (`src/lib/ai/*.parse.ts`, `*.normalize.ts`) that handles the failure case. |
| "just a copy tweak" | Copy lives in templates, components, and sometimes baselines. Does it shift visual snapshots? Is it in the project voice? No "AI" mentions in user-facing strings. |
| "fixed" | Was the original failing command re-run and shown green? |
| "small change" | Small diffs to stores, shared CSS, or templates have large blast radii. Enumerate the radius, then call it small. |
| "same component" | Same component renders differently in light vs dark, and `.app-surface-*` styles headings by tag. Check both schemes. |
| "reads fine" / "looks done" | One playthrough? One world? One color scheme? One viewport? Name the coverage. |
| "just a prompt change" | Prompt changes are behavior changes. They go through the template registry and multi-world evaluation, not inline string edits. |
| "works on my world" | Worlds differ in tone, attributes, skills. Test on a contrasting world + a fresh character before generalizing. |
| "transient flake" | Re-run the exact check twice, show output. Auth failure vs upstream outage vs real regression need different fixes. |
| "I'll just re-baseline" | Re-baselining (visual snapshots, dep-cruiser, skott) is accepting the new state as correct. Justify why it's correct first. |

## 3. Decision trees

### When a narrative or UI change looks done

```text
1. Coverage: exercised on how many worlds/characters? One → not done, run a contrasting world + fresh character.
2. Surface: seen only in Storybook/tests? → run it in the app (npm run dev, real hydrated state).
3. Failure path: does it hold across empty, malformed, and slow AI responses? (Routes time out — see abortTimeout.ts.)
4. Boundaries: does it respect domain boundaries and store contracts? (npm run deps:validate must stay green.)
5. Styling: design tokens only? (npm run lint:css must stay green — no hex/named/rgb colors outside theme files.)
6. Persistence: does state survive reload? (IndexedDB rehydration — test with a hard refresh, not just SPA nav.)
7. Themes: correct in both light and dark? (One design system, ds3, since ADR-013.)
8. Voice: copy in project voice, no "AI" in user-facing strings?
9. Proof: is there a test, screenshot, or command output — not just a claim?
10. Status: is the claimed status backed by artifacts (issue scope met, PR, CI green, QA log entry)?
Any "no" → the change is not done; the item names the next action.
```

### When a test fails

```text
1. Read the failure, don't re-run yet. Assertion failure, timeout, or environment error?
2. Environment error (module not found, port in use, SIGKILL) → env problem: node_modules per-worktree,
   dev server collisions, Playwright browser install. Fix env, not code.
3. Timeout in e2e/visual → is an AI call escaping the isPlaywrightEnv() gate? Is the dev server for THIS
   worktree running? Broad timeouts with 0-pixel diffs → flake protocol (re-run twice, show output).
4. Assertion failure → reproduce, state root-cause hypothesis BEFORE editing, prove by re-running.
5. 3+ failed fix attempts on the same failure → stop, summarize attempts, escalate. Do not spiral.
6. Never edit the test to match broken behavior. Fixing the test is only correct when the test
   encoded the old, wrong expectation — say so explicitly.
```

### When a prompt/template change is proposed

```text
1. Is it in the registry (src/lib/promptTemplates/) or inlined into a generator/route? Inlined → reject; register it.
2. What context does it receive? Only what the template context type allows — no reaching into state
   the narrative shouldn't know (player-hidden info, meta-state).
3. Evaluate: N runs across ≥2 contrasting worlds, ≥2 characters. Compare against prior outputs.
4. Regression: do existing good outputs still generate acceptably? (No golden corpus exists yet — candidate
   improvement; compare manually against excerpts saved in prior eval logs. NOTE: src/lib/promptTemplates/examples/
   is a few-shot library injected INTO prompts — editing it changes live behavior; it is not a regression corpus.)
5. Cost/latency: longer prompts cost tokens and time, and nothing trims the assembled prompt. Estimate with
   estimateTokenCount (src/lib/promptContext/tokenUtils.ts); confirm against a real request via the DevTools
   calibration panel (recordRequestCalibration, src/lib/ai/narrativeGenerator.calibration.ts).
6. Ship decision recorded with evidence, not "reads better".
```

### When docs and code disagree

```text
1. Code wins. Verify the code claim directly (read the file, run the command).
2. Mark the doc stale-risk; fix it in the same change if trivial, else file/flag it.
3. Never "fix" code to match a stale doc without independent evidence the doc is right.
```

## 4. Historical lessons

(Verified against git history and issue tracker; each is symptom → root cause → doctrine → where encoded. Full narratives with references live in `narraitor-failure-archaeology/reference.md`.)

- **Tailwind removal (#1097).** The repo migrated fully off Tailwind/cva/cn() to plain CSS + design tokens. Doctrine: any Tailwind-style utility class or `cn()` helper in new code is a regression; any doc mentioning Tailwind is stale. Encoded in: architecture-contract, docs-and-writing.
- **`eval(require())` eradication (#1206).** Dynamic store imports caused unanalyzable dependencies. Doctrine: static imports only; cross-store effects go through the `storeEvents` bus. Encoded in: architecture-contract.
- **react-joyride pinned at 3.0.0-7 (known — package.json).** Stable 3.x rewrote positioning on @floating-ui and breaks the build (~51 tsc errors reported at attempt time). Doctrine: don't bump without budgeting the migration; don't "fix" the pin as if it were an oversight. Encoded in: failure-archaeology, domain-reference.
- **ExportService removal.** Wrapper services around stores were removed on purpose. Doctrine: no wrapper-service layer; components call stores/lib services directly. Encoded in: architecture-contract.
- **`/dev/design-system*` retirement (ADR-012, #1484).** Storybook is the single canon design surface. Doctrine: don't resurrect living-style-guide routes; design docs point at Storybook. Encoded in: repo-orientation, storybook-app-parity.
- **StoreEventBus kept deliberately.** Pub-sub between stores looks like overengineering but exists to break a circular-import constraint for cascade deletes (WORLD_DELETED, completed in #1505). Doctrine: don't delete it in a simplification pass. Encoded in: architecture-contract, failure-archaeology.
- **streamResilience built, never wired, then deleted.** A resilience middleware shipped (#903) with no caller and was ultimately removed as dead code. Doctrine: infrastructure without a caller is dead on arrival — wire it or don't build it; also, memory/docs about it are now stale. Encoded in: failure-archaeology, change-control.
- **Visual-baseline cascade pain.** Shared-chrome CSS changes repeatedly diffed a dozen baselines across specs; chasing them one at a time wasted sessions. Doctrine: regenerate all affected baselines at once; prefer locator screenshots over fullPage; single-spec height diff = stale base. Encoded in: validation-and-qa, debugging-playbook.
- **Ambient Gemini types shadow the SDK.** `src/types/@google/genai.d.ts` REPLACES the real SDK types (known — file exists). New SDK fields must be added there or tsc fails in confusing ways. Encoded in: domain-reference, debugging-playbook.
- **gemini-2.0-flash retirement.** The model string went stale in code while docs still referenced it; the current model is gemini-2.5-flash (known — `src/lib/ai/config.ts`). `public_docs/features/ai-systems.md` was the stale consumer and is now corrected — it points at `config.ts` instead of naming a model inline. Doctrine: model names are volatile config; don't restate them in prose, verify with grep, smoke live via curl. Encoded in: build-test-env, diagnostics-and-tooling.
- **The hallucinated revert (meta-lesson from this pass).** A discovery agent reported a "personalizationEngine rollback at #1195"; the factual review proved #1195 is a merged DS wizard PR and no such revert exists. Doctrine: agent-mined history is `observed` at best; superlative claims ("the single X") get direct `git log`/`gh` verification before encoding. Encoded in: failure-archaeology E8.
- **`scripts/validate-prompt-templates.js` is a standalone demo, not a gate.** It defines its own toy `PromptTemplateManager` and never imports the real registry (known — read this session). Doctrine: don't cite it as prompt-template validation; the real registry is `src/lib/promptTemplates/narrativeTemplateManager.ts` and the real gate is its `__tests__` + the eval discipline. Encoded in: prompt-template-governance.

## 5. Missing expert checks (not yet automated)

- **No golden-output corpus for prompts.** Prompt regressions are caught by humans replaying flows. Candidate: a saved set of world/character fixtures + prior "good" generations to diff against. Until then, the discipline is manual multi-world replay (ai-quality-discipline).
- **No automated multi-world eval harness.** Prompt changes rely on manual playthroughs. The skills encode the manual protocol; automating it is a frontier item (product-frontier).
- **No runtime store-shape validator.** A persisted IndexedDB blob from an old shape can rehydrate into a new store silently. Persist `migrate` functions exist in some stores (verify per store); the check is manual: hard-refresh testing after any shape change.
- **AI-route contract tests are thin.** Routes are smoke-tested by hand via curl during QA. A route-contract check (shape of success + failure payloads) is a candidate gate.
- **Storybook↔app parity has no automated check.** The promotion ladder (isolation → integrated → QA-verified) is enforced by discipline, not tooling.
