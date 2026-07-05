# Model-transfer eval — does the skill library actually transfer capability?

Benchmark for testing whether weaker future sessions (GPT 5.5, Opus 4.8, Sonnet-class) perform better WITH the skills than from CLAUDE.md alone. Run each task twice — control (skills disabled/hidden) vs treatment (skills available) — and score against "minimum acceptable" and "gold standard". The interesting metric is the delta, and whether the treatment session cites/loads the expected skill unprompted.

Scoring per task: 0 = red-flag behavior; 1 = minimum acceptable; 2 = gold standard. A useful library shows treatment >= 1 on all tasks and >= 2 where control scores 0.

---

## T1 — Debug a 500 from an AI route off a pasted log
**Prompt:** "Players report story generation dying. Log shows POST /api/narrative/generate 500 after ~120s. Fix it."
**Expected skills:** debugging-playbook, diagnostics-and-tooling, domain-reference.
**Minimum:** Recognizes 120s = the `aiFetch` timeout ceiling; runs/proposes the 400-contract curl and validate-provider to split route-wiring vs key vs upstream BEFORE editing code; states a hypothesis first.
**Red flags:** Immediately edits the route handler; blames "the AI being down" with no discrimination; increases the timeout as the fix.
**Gold:** Full discrimination tree (wiring→key→upstream→timeout), names `abortTimeout.ts`/`aiFetch.ts`, proposes reproduction, fix scoped to root cause, original failing flow re-run in the plan.
**Weaker models usually miss:** that the timeout value itself is a clue; the key-vs-outage distinction.

## T2 — Is this component actually integrated?
**Prompt:** "The new EndingRecap component has a Storybook story with withStores seeds and its unit tests pass. Marking #NNNN done — anything else?"
**Expected:** storybook-app-parity, change-control.
**Minimum:** Refuses "done" at S1; names the ladder; requires a real-app check with hydrated IndexedDB state + error/loading paths.
**Red flags:** "Looks good, ship it"; adding MORE stories as the fix.
**Gold:** Full parity checklist run-through incl. store-seed-shape vs hydrated-shape diff, MSW-happy-path warning, and exact promotion evidence to collect.

## T3 — Review a prompt-template change for leakage/hardcoding
**Prompt:** Show a diff adding `"The player secretly plans to betray Kira"` into `sceneTemplate.ts` via a new context field `playerSecretPlan`, plus an inline prompt string added to `choiceGenerator.ts`.
**Expected:** prompt-template-governance, ai-quality-discipline.
**Minimum:** Flags BOTH: context-leakage (player-hidden state fed to the narrator) and the inline string (registry violation, hard rule).
**Red flags:** Reviews only prose quality; approves with style nits.
**Gold:** Cites G1/G2, demands the eval matrix before any merge, notes every-field-optional contract, checks parser impact.

## T4 — Store shape vs selector contradiction
**Prompt:** "I renamed `characterAttributes` to `attributes` in characterStore, tests pass, but the editor shows blanks for existing users. Why?"
**Expected:** architecture-contract, domain-reference, debugging-playbook.
**Minimum:** Persisted IndexedDB blob still has the old shape; no `migrate` was written; unit tests seed the new shape so they lie. Fix = persist version bump + migrate, not UI patching.
**Red flags:** Adds `?? []` fallbacks in the component; tells users to clear site data.
**Gold:** Full blast-radius checklist; hard-refresh test with pre-change data; cites loreStore v3 as the migrate pattern.

## T5 — Rough notes → scoped experiment
**Prompt:** "Idea: endings should reference the player's three biggest choices. Make it happen."
**Expected:** feature-experiment-lifecycle, prompt-template-governance, ai-quality-discipline.
**Minimum:** Issue with acceptance criteria + non-goals first; flags as AI experiment; declares the eval matrix before coding; routes prompt work through the registry (endingTemplates.ts).
**Red flags:** Starts editing templates immediately; single-world validation plan.
**Gold:** P0–P9 walk incl. fresh-state check and ship/hold memo; notes decisions-with-metadata as the existing asset (F2).

## T6 — Domain-boundary violation review
**Prompt:** Diff where `GameSession/` imports `useInventoryStore` and calls `inventoryStore.setState({items: ...})` directly to clear items on session end.
**Expected:** architecture-contract, failure-archaeology.
**Minimum:** Flags direct foreign-store `setState` (I1) and points to the event bus (`SESSION_FRESH_START`/`SESSION_ENDED` wiring) as the sanctioned channel.
**Red flags:** Approves because "it works"; suggests adding to the dep-cruiser violations baseline.
**Gold:** Explains WHY the bus exists (circular imports, E3), names `storeEventWiring.ts`, requires `deps:validate` output.

## T7 — Identify stale docs
**Prompt:** "New contributor read public_docs/features/ai-systems.md and DESIGN.md — what should they NOT trust?"
**Expected:** repo-orientation, docs-and-writing.
**Minimum:** Names gemini-2.0-flash staleness and the retired `/dev/design-system*` canon refs; says code/config wins.
**Red flags:** Summarizes the docs as accurate; "fixes" config.ts toward the doc.
**Gold:** Full do-not-trust list, stale-marker procedure, offers verification greps.

## T8 — Write an append-only correction
**Prompt:** "Yesterday's log says 'streaming resilience middleware verified working'. That's false — it was deleted months ago. Clean this up."
**Expected:** docs-and-writing, change-control.
**Minimum:** Appends a CORRECTION block (date, why wrong, actual state, evidence) instead of rewriting/deleting the claim.
**Red flags:** Silently rewrites history; deletes the log line.
**Gold:** Uses the template, adds the grep evidence, flags other places repeating the claim (memory decay note from E7).

## T9 — Reconstruct the workflow from scratch
**Prompt:** "Fresh laptop, fresh clone. Get me to the point where I can safely commit a change to a component's CSS."
**Expected:** build-test-env, validation-and-qa.
**Minimum:** npm ci → port check → dev server → quality gate incl. lint:css after CSS edits; three-theme + dark check for styling.
**Red flags:** Skips lint:css; starts a server without a port check; runs visual suites on the wrong OS.
**Gold:** Adds worktree caveats, baseline-cascade warning if shared chrome moved, exit-code discipline.

## T10 — "Reads better" prompt tweak
**Prompt:** "I tweaked the scene template and the output is clearly more atmospheric now. Merging."
**Expected:** ai-quality-discipline, prompt-template-governance, change-control.
**Minimum:** Blocks the merge on evidence: demands the matrix (≥2 worlds × ≥2 characters × 3 runs + arc + failure drill), downgrades the claim to single-sample impression.
**Red flags:** Agrees it reads better and merges; asks for ONE more sample.
**Gold:** Sets up the eval log, checks G5 regression against excerpts in prior eval logs (and knows `src/lib/promptTemplates/examples/` is a few-shot library feeding INTO prompts, not a regression corpus), cost note (G6), verdict language "improved on the evaluated matrix".

## T11 — Ship/hold memo
**Prompt:** "Inventory image generation works for most items but fails on ~1 in 5 with a parse error we swallow silently. v1.0 is close. Ship it?"
**Expected:** feature-experiment-lifecycle, change-control, hardest-problem-campaign (context).
**Minimum:** Produces a structured ship/hold memo; a silent 20% failure is at minimum HOLD-or-fix-the-silence; states residual risk honestly.
**Red flags:** "Ship, it's an edge case" with no memo; hides the failure rate.
**Gold:** Distinguishes failure (maybe tolerable) from silence (not — error surface per #1478 pattern), proposes the minimal fix path, defers polish per v1.0 doctrine.

## T12 — Forensic re-verification of a claimed fix
**Prompt:** "PR #NNNN claims it fixed the blank-narrative-on-reload bug. Verify."
**Expected:** change-control, debugging-playbook, diagnostics-and-tooling.
**Minimum:** Re-runs the ORIGINAL failing flow (reload mid-session, check IndexedDB + UI), not just the test suite; demands the repro before trusting the diff.
**Red flags:** "Tests pass and the diff looks right, verified."
**Gold:** Reproduces on pre-fix commit first (red), then post-fix (green), checks the persistence blob, flake protocol if intermittent.

## T13 — Settled-battle resurrection (bonus)
**Prompt:** "package.json pins react-joyride to a prerelease from years ago. I'll bump it to latest stable as part of dependency hygiene."
**Expected:** failure-archaeology.
**Minimum:** Stops the bump; explains the @floating-ui rewrite history; requires a scoped migration issue with tutorial-spec proof to overturn.
**Red flags:** Bumps it; "prereleases are bad practice" as the whole analysis.
**Gold:** Cites E4 + the React-19 overrides as evidence of deliberateness, offers the doctrine-overturn evidence bar.

## T14 — Single-world generalization trap (bonus)
**Prompt:** "Tested the new skill-check acknowledgment on my fantasy world, 5 generations, all great. Rolling it out."
**Expected:** ai-quality-discipline.
**Minimum:** 5 samples in ONE cell ≠ the matrix; requires a contrasting world + fresh character + failure drill.
**Red flags:** Accepts 5 samples as thorough.
**Gold:** Points at the tonal-assumption failure mode (fantasy phrasing leaking into noir), sets up the remaining cells.

---

## Running the benchmark
1. Control run: fresh session, CLAUDE.md only (temporarily move `.claude/skills/narraitor-*` aside or run in a clone without them).
2. Treatment run: fresh session with the library present. Note which skills auto-trigger (compare against `_trigger_matrix.md`).
3. Score 0/1/2 per task per run; record deltas in a dated results file under `.claude/skills/_transfer_results/` (create on first run).
4. Any task where treatment ≤ control → fix that skill's description or content, re-run.

Last generated: 2026-07-04. Not yet executed against any weaker model (see `_uncertainty_register.md`).
