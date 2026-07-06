# Doctrine review (Reviewer 2) — Narraitor skill library

Scope: all 16 `narraitor-*` skills (SKILL.md + reference/templates/evals), README.md, the `_*` meta docs, repo CLAUDE.md, and the four pre-existing sibling skills' frontmatter. Focus: internal contradictions, contradictions with project rules, gate-bypass readings, single-generation overclaim leaks, overstated labels, append-only compliance, sibling-lane hygiene.
Date: 2026-07-04, against `develop` @ 4bec88e6.

## Summary

| Severity | Count |
|---|---|
| BLOCKING | 2 |
| IMPORTANT | 6 |
| MINOR | 7 |

The core doctrine (single generation = signal not evidence; unit-green != shippable; Storybook-green != app-truth; single world != general) is stated consistently and defended in traps sections across the library — no skill *directly* licenses a one-sample conclusion. The two blocking findings are places where the spine and a consumer state **different minimums for the same bar**, which is exactly the drift a weak model will exploit.

---

## BLOCKING

### B1. Two different minimum eval matrices for the same protocol (campaign vs ai-quality-discipline)

**Files:** `narraitor-hardest-problem-campaign/SKILL.md` (Phase 3) vs `narraitor-ai-quality-discipline/SKILL.md` (§5 protocol), also restated in `narraitor-prompt-template-governance` G4 and `_model_transfer_eval.md` T10.

**Conflicting texts:**
- ai-quality-discipline: "Coverage matrix: >= 2 contrasting worlds (different genre/tone) x >= 2 characters (one established with history, one fresh) — 3+ generations per cell." That is a 4-cell grid; §6 adds "A claim without a matrix is downgraded to 'single-sample impression' and may not drive a ship decision."
- hardest-problem-campaign Phase 3: "Protocol per `narraitor-ai-quality-discipline`, minimum:" followed by exactly three cells — Cell A (fresh world × fresh character), Cell B (second world × established character), Cell C (one session driven to an ending). The two off-diagonal world×character combinations are absent, and Phase 3's success criterion 1 is "Phase 3 matrix complete."

**Why it's a problem:** The campaign is the ship decision — the highest-stakes consumer of the matrix — and it imports the protocol *by name* and then specifies a smaller grid also labeled "minimum." A weak model will run A/B/C, write "matrix complete per ai-quality-discipline," and the evidence bar the other skill defines was never met. Whether the deviation is deliberate (10+ turn cells are deeper than 3 generations, so fewer cells may be a sane trade) is unstated, so every future session gets to re-argue it.

**Resolution:** `narraitor-ai-quality-discipline` owns the matrix definition — it should be the ONLY place the grid is specified. The campaign should either (a) instantiate the full 2×2 (add the two missing combinations, even at reduced turn depth), or (b) state explicitly: "Phase 3 deliberately trades cell count for cell depth (10+ turns vs 3 generations); this deviation from the ai-quality 2×2 grid is part of the campaign design" — one sentence ends the argument. Governance G4 and the transfer eval should reference the grid, not restate its dimensions (see I2).

### B2. change-control's class table lets a UI component be "done" at unit-green — contradicting the parity ladder it claims to enforce

**Files:** `narraitor-change-control/SKILL.md` (Step 1 table, Step 2 table) vs `narraitor-storybook-app-parity/SKILL.md` (§5 ladder).

**Conflicting texts:**
- change-control Step 1, Code (logic) row: minimum gate = "Quality gate (test, type-check, lint, lint:css) green locally + test added/updated + original failing case re-run if it's a fix." Step 2: "done" = "Class gate above met + issue acceptance criteria met."
- storybook-app-parity: "'Done' requires >= S2 with evidence; user-facing features require S3. S0/S1 are legitimate development states but BLOCK any done/integrated claim."

**Why it's a problem:** A new component is a "Code (logic)" change under the class table; nothing in that row requires the change to have rendered in the running app. change-control guards the word "integrated" (Step 2: "Storybook/unit green alone NEVER earns it") but not the word "done" for component work — so a weak model following the spine alone marks a component done at unit-green + self-assessed acceptance criteria. That is failure mode #2 from `_distillation_plan.md` ("Storybook-only or unit-test-only green treated as app-verified"), reproduced inside the library's own anti-overclaiming gate. The spine and the ladder disagree, and the spine wins by being the skill everyone is told to consult "before ANY status claim" (README).

**Resolution:** change-control owns status words; the class table needs the parity hook. Either add a row — "Component / user-facing UI | Code gate PLUS parity ladder >= S2 (S3 for user-facing features) per `narraitor-storybook-app-parity`" — or amend the Code (logic) row with "+ if the change is user-visible, parity ladder >= S2." Parity keeps the ladder mechanics; change-control keeps the words.

---

## IMPORTANT

### I1. The owner-ratification footnotes soften the eval-matrix gate into an optional one

**Files:** `narraitor-ai-quality-discipline/SKILL.md` (§10), `narraitor-prompt-template-governance/SKILL.md` (§10), `narraitor-change-control/SKILL.md` (§10), `_uncertainty_register.md` (item 3).

**Conflicting texts:**
- Bodies state a hard bar: ai-quality "The evaluation protocol (minimum bar for any behavior claim)"; governance "G4 EVAL — run the narraitor-ai-quality-discipline matrix… Record in the eval log"; governance §6 "A prompt PR without these is not reviewable."
- Footnotes undercut it: governance "G4 matrix minimums are doctrine pending owner ratification (owner-confirmation-needed)"; ai-quality "The minimum matrix size (2x2x3) is expert-set doctrine, not owner-ratified policy (owner-confirmation-needed to harden or relax)"; change-control "Whether the owner wants the multi-world AI evidence bar as a HARD gate for every prompt tweak or a strong default (owner-confirmation-needed…)".

**Why it's a problem:** Honest uncertainty is the library's brand, but "pending ratification" reads to a weak model as "not yet in force." A session that wants to merge a prompt tweak has a quotable exit: the skill itself says the gate isn't ratified. Only change-control's footnote gestures at the right default ("encoded here as the bar per the distillation brief"); the governance footnote has no such clause.

**Resolution:** One sentence in each footnote: "Binding as written until the owner explicitly relaxes it — uncertainty about ratification is not permission to skip." change-control (the anti-overclaiming spine) should own the general rule that owner-confirmation-needed labels never suspend a gate.

### I2. One-home-per-fact violation on the matrix spec itself

**Files:** `narraitor-ai-quality-discipline/SKILL.md` (§5), `narraitor-prompt-template-governance/SKILL.md` (G4: ">=2 worlds x >=2 characters x 3 generations + arc check + failure drill"), `narraitor-feature-experiment-lifecycle/SKILL.md` (P3: "declare the eval matrix (which >=2 worlds, which >=2 characters)"), `_model_transfer_eval.md` (T10: "≥2 worlds × ≥2 characters × 3 runs + arc + failure drill"), `narraitor-prompt-template-governance/templates/eval-log.md` (4-row matrix table hard-codes the shape), plus the campaign's variant (B1).

**Why it's a problem:** `_maintenance_plan.md` declares "one home per fact," and this — the library's most load-bearing doctrine number — is substantively restated in five places plus a template. When the owner ratifies or adjusts the minimum (the registered uncertainty says that's expected), at least four files must change in lockstep or the library argues with itself, exactly the drift the plan warns about.

**Resolution:** ai-quality-discipline owns the dimensions. Governance G4 becomes "run the narraitor-ai-quality-discipline matrix (its §5 defines the minimums)"; lifecycle P3 and the transfer eval likewise cite without numbers. The eval-log template's row count is fine as scaffolding, but add a note "row count follows ai-quality-discipline §5."

### I3. "Gating a feature off in tests = rigging. Never." vs the sanctioned `isPlaywrightEnv()` gate

**Files:** `narraitor-change-control/SKILL.md` (§8) vs `narraitor-failure-archaeology/reference.md` (E11) and `narraitor-validation-and-qa/SKILL.md` (§5 tier table).

**Conflicting texts:**
- change-control: "Deleting a red test, loosening an assertion, or gating a feature off in tests to get green = rigging. Never."
- E11 doctrine: "Any render-path AI call must be gated on `isPlaywrightEnv()`… New on-mount fetches get a gate review." validation-and-qa: the AI loop is "deliberately mocked/gated" in e2e and "gated off via isPlaywrightEnv()" in visual.

**Why it's a problem:** Both texts are right in context, but neither draws the line between them. A literal-minded weak model either refuses to add a required `isPlaywrightEnv()` gate ("that's rigging"), or — worse — cites E11 as precedent for gating its own broken feature off in a spec to get green. The distinction (AI is out of automated scope *by declared design*, with the gap named in validation-and-qa rule 3, vs. hiding a failure to fake a pass) exists in the library's logic but nowhere in its words.

**Resolution:** change-control owns the rigging definition; add one clause: "Exception: the `isPlaywrightEnv()` AI gate is a designed scope boundary, not rigging — it is legitimate precisely because validation-and-qa declares the resulting coverage gap out loud. Gating anything to *hide* a failure remains rigging."

### I4. The library defers to sibling skills that contradict its own doctrine, without stale-marking them

**Files:** `narraitor-architecture/SKILL.md` (pre-existing: "use `src/components/ui` for shadcn primitives"), `narraitor-pattern-alignment-skill/SKILL.md` (pre-existing: alignment area "shadcn/ui usage"), `style-port/SKILL.md` (pre-existing: "Token definitions live in `src/lib/theme/design-tokens.css`") vs `narraitor-repo-orientation/SKILL.md` (do-not-trust list; "Theming / tokens | src/lib/theme/themes/{_shared-tokens,ds1,ds2,ds3}.css"), `narraitor-architecture-contract` I9, archaeology E1 ("Any Tailwind/cva/cn() suggestion is a regression").

**Why it's a problem:** Verified this review: `src/lib/theme/design-tokens.css` does not exist in the tree; tokens live under `src/lib/theme/themes/`. So style-port — the skill the new library names as "the only sanctioned way" to port styles — carries a dead load-bearing path. And the two auto-triggering siblings still speak shadcn, which travels with cva/cn() in a weak model's training prior — the exact regression E1 forbids. The new library's whole posture is "mark stale claims where you find them" (docs-and-writing), and its do-not-trust list covers DESIGN.md and ai-systems.md but is silent about the siblings it explicitly routes work to. Deference without a warning label is how the contradiction reaches a weak model with authority attached.

**Resolution:** Two homes: (1) repo-orientation's do-not-trust list gains a row: "Pre-existing sibling skills carry pre-#1097/#1484 residue — `style-port`'s `design-tokens.css` path is dead (tokens: `src/lib/theme/themes/_shared-tokens.css`); shadcn references in `narraitor-architecture`/`narraitor-pattern-alignment-skill` describe the `src/components/ui` primitives' origin, not license to add cva/cn()." (2) Better: fix the siblings themselves in a small follow-up PR — the plan says siblings are out of this pass's scope, but the contradiction shouldn't outlive the review.

### I5. build-test-env's own re-verify command swallows the exit code it preaches about

**Files:** `narraitor-build-test-env/SKILL.md` (§5 vs §10); same pattern in `_maintenance_plan.md` drift check.

**Conflicting texts:**
- §5: "Verify exit codes directly — never pipe through `tail`/`grep` in a way that swallows `$?`."
- §10 re-verify: "`npm test 2>&1 | tail -5; echo "exit=$?"`" — `$?` there is tail's exit status, not npm's. `_maintenance_plan.md`: "`npm test 2>&1 | tail -3`".

**Why it's a problem:** This is also a verbatim contradiction of the global CLAUDE.md rule ("Don't pipe build or test output through `tail`… capture and show `$?` separately"). Re-verify commands are the most-copied lines in each skill; a weak model running this after a failing suite prints `exit=0` and reports the gate green — a false-green on the exact gate the skill exists to keep honest.

**Resolution:** build-test-env owns command hygiene. Replace with a form that preserves the code, e.g. `npm test > /tmp/t.log 2>&1; echo "exit=$?"; tail -5 /tmp/t.log` (or `set -o pipefail` in an explicit bash block). Fix the maintenance-plan copy the same way.

### I6. Campaign Phase 5 "DELIBERATE adoptions" lacks the re-baseline justification hook

**Files:** `narraitor-hardest-problem-campaign/SKILL.md` (Phase 5) vs `narraitor-change-control/SKILL.md` (Step 4).

**Conflicting texts:**
- Campaign Phase 5: "`npm run test:visual` # dev server running; macOS; expect green or DELIBERATE adoptions."
- change-control Step 4: "re-baselining is a decision, not a fix… Required: one written sentence of justification… visible in the PR."

**Why it's a problem:** "Deliberate" is doing all the work with no definition at the single most tempting moment to re-baseline casually — end of a long campaign, a dozen diffs between the session and "all green." A weak model adopts them wholesale and writes "deliberate adoption," satisfying Phase 5's letter while bypassing Step 4's evidence requirement. The task brief's re-baseline concern lands squarely here.

**Resolution:** change-control owns re-baseline rules; the campaign should consume them by reference: "…or deliberate adoptions per change-control Step 4 (written justification, all affected specs together)."

---

## MINOR

### M1. Status-word and correction-format drift between change-control and docs-and-writing
docs-and-writing §5 lists "done / fixed / verified / validated / integrated / reliable / **complete**" — "complete" has no row in change-control's Step 2 table, which docs-and-writing claims to be following. Also change-control Step 5 gives a one-line inline correction format while `templates/correction-append.md` has five fields (including Follow-ups); both present themselves as the format. Resolution: change-control owns the word table (docs-and-writing should point, not re-enumerate); the template owns the correction format (Step 5 should show no competing inline schema, just link it).

### M2. Snapshot numbers stated with substance in 3+ homes (drift seeds)
- 120s aiFetch timeout: ai-quality-discipline, debugging-playbook, diagnostics-and-tooling, domain-reference (SKILL + reference.md), storybook-app-parity, `_repo_capability_map.md` — six homes.
- 353 suites / 2399 tests: `_expert_distillation_notes.md`, build-test-env, hardest-problem-campaign Phase 0, validation-and-qa (§8 trap), capability map — five homes, all dated but all needing sync on drift.
- IndexedDB names `narraitor-state`/`narraitor-store`: repo-orientation, debugging-playbook, diagnostics, domain-reference, parity, capability map.
- skott cycle budget "6": build-test-env, architecture-contract I3, capability map. "20 API routes": repo-orientation, diagnostics, capability map.

None currently disagree; all are drift-likely. Resolution: pick an owner per `_maintenance_plan.md`'s own rule (suggest domain-reference/reference.md for the runtime constants, build-test-env for suite counts) and have the others name the fact without the number ("the aiFetch timeout ceiling — see domain-reference") or accept the sync cost knowingly and say so in the maintenance plan.

### M3. README overstatements
- "Foundation & meta documents: … `_review_factual/_doctrine/_usability.md` + `_fixer_report.md` (Phase 6)" — listed as inventory before existing (none were on disk when this review started). Mark them "(Phase 6 — pending)" until written; the library's own docs rule is that docs describe verified state.
- "Every volatile claim in this library carries an evidence label" — literally false; most body claims are covered by the skill-level provenance block, not per-claim labels. Reword: "…carries an evidence label or is covered by its skill's dated provenance block."
- README calls `_repo_capability_map.md` a "verified repo map" while the map itself distinguishes first-hand `known` from agent-mediated `observed`. "Verified" flattens that honest distinction.

### M4. Sibling `review` skill mandates emojis; docs-and-writing (and global CLAUDE.md) forbid them
`review/SKILL.md`: "Present findings as: 🔴 Blocking, 🟡 Suggestions, 🟢 Praise" vs docs-and-writing §5 "No emojis" (and the global no-emoji rule). A model invoking the review lane cannot satisfy both. Resolution: fix the sibling (BLOCKING/SUGGESTION/PRAISE words) — not a new-library edit, but worth the same follow-up PR as I4.

### M5. "change-control's fix loop" is cited but never defined there
feature-experiment-lifecycle §3 ("Pure bug fixes with a reproducer → change-control's fix loop directly") and campaign Phase 4 ("change-control fix cycle (root cause → minimal fix → test → original failing flow re-run green → PR)") both reference a named procedure that change-control never lays out as a sequence — its pieces exist (Step 2 "fixed", Step 6 ship mechanics) but the loop lives only in its citers. Resolution: add a five-word fix-loop line to change-control §5, or have the citers spell it inline as the campaign already does.

### M6. Maintenance plan doesn't carve out archaeology's append-only rule
`_maintenance_plan.md` "Anything that moved → update the owning skill" is correct for procedures, but `narraitor-failure-archaeology/reference.md` is declared append-only ("never rewrite existing ones"). A drift-fix session pointed at archaeology by the maintenance plan could "update" an entry in place. Resolution: one clause in the drift-check section: "for failure-archaeology entries, corrections append per change-control Step 5 — never edit in place."

### M7. Two walkthrough procedures for one release gate
validation-and-qa §10 says the manual walkthrough "exists as an owner-level personal skill, not a committed repo artifact" while hardest-problem-campaign §9 presents itself as "the committed, resumable version" of that same ground. Both statements are individually true, but the pair means the gate's script now has two homes (personal `narraitor-qa-walkthrough` + the committed campaign) that can drift on matrix shape (see B1), severity triage, and gate definitions. The campaign at least names the overlap. Resolution: the campaign owns the committed procedure; validation-and-qa's uncertainty note should point at the campaign as the committed encoding and reframe the open question as "whether the personal skill's *interactive script details* should also be committed."

---

## Doctrine coherence verdict

This library holds together better than most first passes — the four core axioms (one generation = signal, unit-green != shippable, Storybook != app-truth, one world != general) are stated once each with a clear owner and defended by traps sections in every consumer, and I found no text that licenses a single good generation to become a conclusion, no instruction to rewrite history, and no direct contradiction of the repo's develop-targeting, KISS-tests, token, or no-Tailwind rules. The problems are all at the seams: the two blocking findings are the spine (change-control) and the flagship consumer (the campaign) each quietly stating a *smaller* minimum than the skill that owns the bar, which is precisely the gap a weak model under deadline pressure will walk through while citing the library as cover. The important findings are one recurring shape — a correct rule stated in one home and softened, duplicated, or left unhooked in another (ratification footnotes, the matrix spec's five homes, the rigging/gate carve-out, "deliberate adoptions") — plus the sibling skills, which the library defers to with authority but hasn't stale-marked despite carrying a dead token path and shadcn-era guidance. All of it is fixable with sentence-level edits and one small sibling-cleanup PR; nothing requires restructuring. Fix B1/B2 and the ratification clause (I1) before treating the library as a load-bearing gate for weaker sessions; the rest can ride the first maintenance pass.
