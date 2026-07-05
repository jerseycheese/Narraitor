# Fixer report — Phase 6 remediation

Date: 2026-07-04. Inputs: `_review_factual.md` (2 BLOCKING / 6 IMPORTANT / 7 MINOR), `_review_doctrine.md` (2/6/7), `_review_usability.md` (1/6/9). Policy: all BLOCKING and IMPORTANT findings fixed; MINOR fixes applied where one edit covered them, otherwise deferred and documented below. Every factual correction was re-verified first-hand (grep/read) before editing — not taken on the reviewer's word.

## BLOCKING — all fixed

| Finding | Fix |
|---|---|
| Factual B1: persist keys wrong for 8/11 stores (agent-sourced) | domain-reference reference.md store table rewritten with grep-verified keys (`narraitor-<domain>-store`; odd one out is `lore-store`); SKILL.md inconsistency example corrected; unverified action-name column removed (five invented names were in it — Factual I4 fixed in the same stroke) |
| Factual B2: `{prompt}` contract claimed for all six narrative routes (true for two) | Corrected in domain-reference (both files), debugging-playbook symptom row, diagnostics interpretation, campaign Phase 2 (now: read each handler; per-route 4xx contract) |
| Doctrine B1: campaign Phase 3 matrix diverged from ai-quality's 2x2 grid | Cells A–C remapped onto the grid + Cell D (off-diagonal short run) added; ai-quality §5 declared the single home of matrix minimums |
| Doctrine B2: change-control let UI work be "done" at unit-green | New class row: Component/user-facing UI requires parity ≥S2 (S3 user-facing) |
| Usability B1: mandated AI failure drill named no mechanism | ai-quality step 4 now names the DevTools AI mocking panel (`src/components/devtools/AIMockingSection/`, `AITestingPanel/` — paths verified) + network-level fallbacks; campaign failure-drill line points there |

## IMPORTANT — all fixed

- **Factual I1 (invented "#1195 personalizationEngine revert")**: removed everywhere; rewritten as archaeology **E8 — the hallucinated revert**, a meta-lesson on agent-mediated history mining; expert notes + skill index updated; uncertainty-register process caveat strengthened with both concrete errors.
- **Factual I2 (retry/timeout conflation)**: corrected in domain-reference (30s `makeGeminiRequest` no-retry path for generate/choices vs `GeminiClient` 3-retry path; 120s = client aiFetch only), debugging-playbook, diagnostics, capability map, ai-quality step 4.
- **Factual I3 ("every store persists")**: softened in architecture-contract I6 + domain-reference (aiContext/calibration/continuity unpersisted).
- **Factual I4 (invented action names)**: action column removed from the store table; replaced with "read the store file before citing an action".
- **Factual I5 (examples/ mischaracterized as regression corpus)**: corrected in prompt-governance G5 (with a warning that editing examples/ changes live prompts), ai-quality uncertainty, expert notes, model-transfer T10 gold.
- **Factual I6 (test:visual == test:e2e:critical)**: validation-and-qa tier table merged into one row stating they're the same command.
- **Doctrine I1 (ratification footnotes as exit hatch)**: "BINDING until the owner explicitly relaxes it" added to ai-quality, prompt-governance, change-control uncertainties.
- **Doctrine I2 / Usability I5 (matrix restated in 5 places; one-home-per-fact)**: numbers removed from prompt-governance G4 and feature-lifecycle P3 (now cite ai-quality §5); campaign maps cells instead of restating; a **fact-homes table** added to `_maintenance_plan.md` naming the canonical owner of every high-restatement fact (timeout model, IndexedDB names, macOS rule, ladder, status table). Passing mentions of shared constants remain where removing them would strand a reader mid-procedure — the fact-homes table now arbitrates disagreements.
- **Doctrine I3 (rigging rule vs isPlaywrightEnv gate)**: explicit carve-out added to change-control (gate = documented tier boundary; rigging = hiding a REAL failure).
- **Doctrine I4 (sibling skills carry stale content)**: added to repo-orientation's do-not-trust list ("the contract wins") and to the uncertainty register as a recommended sibling-cleanup PR. The pre-existing skills themselves were deliberately NOT edited (owner's files, outside this pass's mandate).
- **Doctrine I5 (exit-code-swallowing re-verify commands)**: fixed in build-test-env §10 and `_maintenance_plan.md`.
- **Doctrine I6 (Phase 5 re-baseline hook)**: campaign Phase 5 now binds adoptions to change-control Step 4.
- **Usability I1 (provider-key setup undocumented)**: campaign Inputs now covers `.env.local` `GEMINI_API_KEY` + `/settings/providers` BYO path; diagnostics curl shows the real header `x-provider-api-key` (verified in `providerKeyHeader.ts`).
- **Usability I2/I4 (eval cross-contamination + body-only queries)**: six eval files repaired by a dedicated agent (entries re-routed or re-anchored to description-catchable language; all files re-validated as strict JSON, per-entry diffs in its report). Console.log symptom → debugging-playbook; knip → build-test-env; "where do prompts live" → governance; PR-evidence vs test-tiers queries disambiguated.
- **Usability I3 (doc-contradiction lane ambiguity)**: the three descriptions (repo-orientation / failure-archaeology / docs-and-writing) now carry explicit cross-routing clauses (trust-map vs history-why vs write-the-fix).
- **Usability I6 (owner-personal tooling unmarked)**: availability markers added for `kiss` (change-control) and the analyze-issue→tdd-implement→post-merge pipeline (feature-lifecycle); campaign already marked `narraitor-qa-walkthrough` as owner-personal.

## MINOR — fixed opportunistically

Story count 147→144 (capability map, 2 places); loreStore "9"→"10 concern files"; DESIGN.md staleness softened to "residual lines" (repo-orientation, capability map, uncertainty register); commit hash `#8e538a18`→`commit 8e538a18` (archaeology E11); campaign Cell C now defines "established character"; README's Phase 6 file references are now real (this file exists).

## MINOR — deferred, deliberately

- Factual: incomplete CI-workflow enumeration in the capability map (list is representative; ci.yml is the source); "always exit 0" nuance on audit:css; Storybook router-mock phrasing.
- Doctrine: the `review` skill's emoji mandate vs the no-emoji rule — belongs in the sibling-cleanup PR, not this pass.
- Usability: MSW acronym never expanded; repo-orientation/domain-reference "Output artifact" sections are soft by nature (orientation skills produce understanding); product-frontier prose density.

Rationale for deferrals: each requires either touching owner files outside this pass's mandate or trades scannability for pedantry. All are recorded here per the change-control rule that skipped work is stated, not hidden.
