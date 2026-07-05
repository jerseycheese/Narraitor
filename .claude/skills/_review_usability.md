# Usability review — Reviewer 3 (zero-context verifier)

Date: 2026-07-04 · Scope: the 16 distilled `narraitor-*` skills + README.md + _trigger_matrix.md · Method: full read of every SKILL.md, reference.md, template, and trigger_eval.json; verification of all cited npm scripts (22/22 exist) and file paths (31/31 exist); automated cross-file eval-query similarity scan; cold-read simulation of 3 skills; eval realism spot-check of 4 files.

## Summary

| Severity | Count |
|---|---|
| BLOCKING | 1 |
| IMPORTANT | 6 |
| MINOR | 9 |

Overall: this library is unusually well built for zero-context consumption. Every SKILL.md is 56–106 lines, uses the same 10-section skeleton, leads with imperative procedure, and — rare in skill libraries — every cited command and path actually exists in the tree. The findings below are mostly routing polish and two executability holes; nothing structural.

---

## BLOCKING

### B1. The mandated AI failure drill names no mechanism to execute it

**Files:** `narraitor-ai-quality-discipline/SKILL.md` (§5 step 4), `narraitor-prompt-template-governance/templates/eval-log.md` (Failure drill section), `narraitor-hardest-problem-campaign/SKILL.md` (Phase 3 failure drills).

**Issue:** The eval protocol's minimum bar requires exercising "empty/malformed response handling" and "a slow response" — but no skill says HOW to make Gemini return a malformed or empty response. The eval-log template even asks "Malformed/empty response path exercised how" and the library never answers its own question. The lever exists in-product (`src/components/devtools/AIMockingSection/` and `AITestingPanel/` — the diagnostics skill mentions "AI mock controls" in passing) but the skill that mandates the drill never points at it.

**Why it hurts:** A zero-context Sonnet session running the protocol hits step 4 and has no move. It either skips the drill (making the whole matrix non-compliant per the skill's own rules, so every quality claim gets downgraded) or invents something ad hoc (curling garbage at the route, which tests the route, not the app's handling). Since the v1.0 campaign gates the release on these drills, this is a hole in the library's centerpiece workflow.

**Fix:** One or two lines in ai-quality-discipline §5 step 4: name the DevTools AI mocking panel as the sanctioned lever for malformed/empty responses (with the component path), and network-throttle/offline in browser devtools for the slow path. Mirror the pointer in campaign Phase 3.

---

## IMPORTANT

### I1. Provider-key setup is half-documented — the one input two skills require

**Files:** `narraitor-hardest-problem-campaign/SKILL.md` (§4 Inputs), `narraitor-ai-quality-discipline/SKILL.md` (§4 Inputs), `narraitor-diagnostics-and-tooling/SKILL.md` (§5 curl comments).

**Issue:** Both the campaign and the eval protocol require "a working Gemini key" but nowhere does the library say where to PUT it. Diagnostics says "env `GEMINI_API_KEY` on the server, or the provider-key header" — which env file (`.env.local`? shell export before `npm run dev`?) is never stated, and the header's actual name is never given (it's a constant in `src/lib/ai/providerKeyHeader.ts`; the curl variant is unfillable as written). The in-app BYO-key flow (`/settings/providers`) appears only as a bare route in domain-reference's route list, never as "this is how you get the app playable."

**Why it hurts:** A zero-context session with a key in hand still can't wire it: the curl live-smoke and the browser play loop each need different plumbing, and neither is spelled out. This stalls Phase 2/3 of the campaign — the highest-value workflow in the library.

**Fix:** A 3–4 line "key setup" block in diagnostics-and-tooling (env file location for the server path, the `/settings/providers` UI flow for browser play, and a pointer to `providerKeyHeader.ts` for the header name), with ai-quality and campaign §4 pointing to it.

### I2. Eval cross-contamination: near-identical queries routed to different skills

**Files:** `narraitor-debugging-playbook/evals/trigger_eval.json` (#9) vs `narraitor-diagnostics-and-tooling/evals/trigger_eval.json` (#13); `narraitor-change-control/evals` (#6) vs `narraitor-validation-and-qa/evals` (#2); `narraitor-prompt-template-governance/evals` (#3) vs `narraitor-repo-orientation`'s description.

**Issue:** Confirmed by token-overlap scan. "console.log shows nothing even though I'm positive that code path runs" must trigger debugging-playbook, while "console.log shows nothing in dev so i guess that code path never runs?" must trigger diagnostics — the discriminating signal is nearly zero. Same with "what evidence does this PR actually need" (change-control) vs "what tests does this loreStore change actually need before i open the PR" (validation-and-qa). And "where do prompts live in this repo?" must hit governance while repo-orientation's description explicitly claims every "where does X live" question.

**Why it hurts:** A description-only router (which is what skill triggering IS) will coin-flip these; the eval suites as written cannot all pass simultaneously. The library will look flaky in its own benchmarks, and a maintainer chasing eval failures will churn descriptions for what is actually an unwinnable case design.

**Fix:** Either make the paired queries genuinely discriminating (the debugging one should describe a broken outcome, the diagnostics one should ask for a measurement command), or accept dual-routing: mark these cases as accepting either skill in the eval format. For "where do prompts live," carve the exception into repo-orientation's description ("…except prompts — that's prompt-template-governance").

### I3. Doc-vs-code contradictions are claimed by three descriptions

**Files:** `narraitor-repo-orientation/SKILL.md`, `narraitor-failure-archaeology/SKILL.md`, `narraitor-docs-and-writing/SKILL.md` (frontmatter descriptions).

**Issue:** Three descriptions claim the same trigger: repo-orientation "before trusting any doc's claim," failure-archaeology "when a doc/memory claim contradicts the tree," docs-and-writing "when a doc contradicts the code." The trust/why/write disambiguation exists — but only in `_trigger_matrix.md`, which a router never sees.

**Why it hurts:** "DESIGN.md says X but the code says Y" is one of the most common zero-context moments in this repo (the library itself says so), and it's a three-way toss-up. Wrong pick isn't catastrophic (all three eventually converge) but it's exactly the friction that trains a session to stop trusting auto-triggering.

**Fix:** Encode the lane in each description: repo-orientation "…to check WHICH docs are trustworthy," archaeology "…to learn WHY the tree is right," docs-and-writing "…to MARK or FIX the doc (not to establish truth)."

### I4. Several eval queries test body-only knowledge the description can never catch

**Files/cases:** `narraitor-change-control/evals` #11 ("does 'Closes #N' auto-close…") — nothing in the description covers merge/issue mechanics; `narraitor-docs-and-writing/evals` #11 (code-comment fix) and #15 (app UI toast copy) — description says docs/PR/issue text, not code comments or user-facing copy; `narraitor-diagnostics-and-tooling/evals` #14 ("run knip…") — description enumerates curl/IndexedDB/DOM/visual, static analysis is body-only and collides with build-test-env's gate table; `narraitor-storybook-app-parity/evals` #15 (file:// blank page) — reads as an env bug, not a parity question.

**Why it hurts:** These positives will fail against any honest description-matching router, producing noise that masks real trigger regressions. Worse, a zero-context user typing exactly these queries won't get the skill that holds the answer.

**Fix:** For each: either add the trigger term to the description (docs-and-writing should say "code comments and user-facing copy"; diagnostics should say "static-analysis runs") or move the query to another skill's eval where it's honestly catchable.

### I5. One-home-per-fact violations: the same volatile facts restated in 4–7 skills

**Traced (grep-verified):**
- 120s aiFetch timeout — 7 files (ai-quality, debugging-playbook, build-test-env, diagnostics, domain-reference SKILL + reference, storybook-app-parity).
- IndexedDB db/store names (`narraitor-state`/`narraitor-store`) — 6 files.
- macOS-only visual baselines rule — 6 files.
- eval-matrix minimums (>=2 worlds x >=2 characters x 3) — 5 files (ai-quality is home; governance G4, lifecycle P3, parity §5.8, campaign Phase 3 restate the numbers).
- `lsof -nP -iTCP:3000 -sTCP:LISTEN` verbatim — 4 files.
- gemini model strings — 4 files.

**Why it hurts:** When the timeout changes or the matrix minimums get owner-ratified at different numbers, six or seven files go stale at once — precisely the drift the library's own honesty contract warns about. A zero-context reader who finds two files disagreeing has no way to know which is home.

**Fix:** Pick the home per fact (timeout + IndexedDB names → domain-reference/reference.md; macOS rule → build-test-env; matrix numbers → ai-quality-discipline; port check → build-test-env) and convert the rest to pointers ("120s ceiling — see domain-reference"). Inline numbers can stay where they're load-bearing for a copy-paste command, but restated rule-statements should become pointers.

### I6. References to owner-personal tooling without availability markers

**Files:** `narraitor-change-control/SKILL.md` §9 ("owner skills `review`/`kiss`" — `kiss` is not in this repo), `narraitor-feature-experiment-lifecycle/SKILL.md` §3 ("the owner's issue pipeline (analyze-issue → tdd-implement → post-merge)"), `narraitor-hardest-problem-campaign/SKILL.md` §9 ("the owner's personal `narraitor-qa-walkthrough` skill").

**Issue:** These route a zero-context session (or a human contributor) toward skills that only exist in the owner's global setup. Diagnostics-and-tooling models the right pattern for `bdg` ("personal tooling — available locally, not a repo dependency") — the others don't.

**Why it hurts:** A fresh session told "already-scoped issues go to the owner's pipeline" will hunt for skills it can't invoke, or worse, assume it's blocked from implementing.

**Fix:** Copy the bdg-style parenthetical everywhere an owner-personal skill is named, plus the fallback ("if unavailable, implement normally per change-control").

---

## MINOR

1. **`narraitor-repo-orientation/SKILL.md` §7** — "An oriented session" isn't a checkable artifact. The second sentence (the "where I'll look and why" note) is; make it the primary output.
2. **`narraitor-domain-reference/SKILL.md` §7** — "Correct reasoning" is even less checkable. Suggest: "claims annotated with source paths."
3. **MSW is never expanded** (Mock Service Worker) anywhere in the library — one parenthetical in storybook-app-parity §5.5 fixes it for non-frontend readers.
4. **`README.md`** cites `_review_factual/_doctrine/_usability.md` + `_fixer_report.md` as existing foundation docs; they didn't exist at review time (Phase 6 in flight). Mark "(in progress)" until they land, or a cold reader hunts for missing files.
5. **eval-log template location** — the protocol home (ai-quality-discipline) mandates an artifact whose template lives under a sibling (`narraitor-prompt-template-governance/templates/eval-log.md`). The cross-pointer is correct and resolvable, but the template arguably belongs with the protocol; governance can point the other way.
6. **`narraitor-hardest-problem-campaign` Phase 3 Cell B** — "established character" is undefined for a fresh campaign run (a clean checkout has none). Say "the Cell A character, continued" or "any character with >=1 prior session."
7. **`narraitor-product-frontier/SKILL.md` §5** — F1–F5 are dense run-on paragraphs with inline italic markers; the hardest section in the library to scan. Break falls-short/assets/first-steps/result-when into line items.
8. **`narraitor-feature-experiment-lifecycle/evals` #21** — "deleting a world leaves orphan NPCs — i have a reproducer, lets fix the bug" expects change-control; debugging-playbook is at least as defensible (root cause not yet proven). Grader ambiguity.
9. **Description-echo eval queries** — a few positives are verbatim description echoes ("validate the play loop end to end with a real gemini key"). Fine as smoke tests, but they inflate apparent trigger accuracy; don't count them as realism coverage.

---

## Per-check notes

**1. Trigger quality:** Strong overall. Every description leads with a domain noun phrase then "Use when…" with realistic quoted user language; the negative-lane fencing (each skill's "When not to use" naming the sibling) is the best disambiguation device here. Weak spots are I2/I3/I4 — all cluster where two skills share a vocabulary ("evidence"/"tests", doc contradictions, measurement-vs-triage).

**2. Size & scannability:** Excellent. 56–106 lines per SKILL.md, consistent 10-section skeleton, symptom/gate/tier tables, copy-pasteable code blocks. Nothing needs to move to reference.md that hasn't already (failure-archaeology and domain-reference both use the index-plus-reference split correctly, and the SKILL/reference boundary doesn't duplicate). The per-skill "Known uncertainty" blocks are a standout honesty feature.

**3. Duplication:** See I5. The "Encoded in:" cross-references in failure-archaeology reference.md are the right pattern; the library just doesn't apply it consistently for hot facts.

**4. Clear outputs:** 14/16 concrete and reviewer-checkable (command transcripts, eval logs, checklists, memos, promotion notes). The two vague ones are MINOR 1–2.

**5. Concrete commands:** All verified runnable as written — 22/22 npm scripts exist in package.json, 31/31 cited paths exist in the tree, `gh issue list --milestone "" --label MVP --state open` executes successfully. The only placeholder in the library is `<term>` in failure-archaeology's gh search (fillable from context). The one unfillable command variant is the provider-key-header curl (I1).

**6. Zero-context cold reads (build-test-env, ai-quality-discipline, hardest-problem-campaign):** build-test-env is clean — every term defined before use, failure-classification order is genuinely followable. ai-quality-discipline fails at step 4 (B1) and inputs (I1); "cell" and "matrix" are defined before use, axioms before protocol — good. Campaign is followable phase by phase (issue numbers resolvable via gh, release-process doc exists) with B1/I1/M6 as the gaps. No blocking circular references anywhere: ai-quality ↔ governance is mutual but each hop resolves (protocol one side, log template the other); the locate→run→triage→measure chain is linear.

**7. Eval realism spot-check (repo-orientation, debugging-playbook, feature-experiment-lifecycle, docs-and-writing):** These are genuinely messy — typos ("agian", "storybok", "expirement", "baselnes"), rambling frustrated multi-sentence queries, lowercase mumbles, sibling-negative cases with expected routes, and off-repo nulls (MealPlanShop, Drupal, generic scripting). Well above the textbook-clean norm. All 16 files parse as valid JSON with a consistent ~14–15 pos / 9–10 neg split. The flaws are cross-file contradictions (I2), not cleanliness.

---

## Verdict: would a Sonnet-class session be materially better with this library than with CLAUDE.md alone?

Yes — clearly, and the margin is biggest exactly where weaker models fail worst. CLAUDE.md tells a session what the rules are; this library tells it what to do next and what evidence to hand back. The debugging symptom table, the env-vs-data-vs-provider-vs-code triage order, the exact 400-contract curls, and the store-shape blast-radius checklist convert judgment calls (where Sonnet-class models wander) into lookups (where they're reliable). The failure-archaeology index is the single highest-value piece: a Sonnet session with only CLAUDE.md would plausibly "simplify away" the event bus, bump the joyride pin, or rebuild the deleted style-guide routes — all real, documented failure modes this library fences off by name. And the change-control status-language table directly counters the overclaiming reflex ("done", "verified") that weaker models exhibit under completion pressure. The caveats: the trigger layer has enough sibling ambiguity (I2–I4) that auto-invocation will misroute some of the time — though misroutes land on adjacent skills that cross-link correctly, so the cost is a hop, not a dead end — and the two executability holes (B1, I1) sit in the library's flagship workflow, so a zero-context release campaign stalls at key setup and the failure drill until someone fixes ~10 lines. Fix those two and this is about as good as a repo skill library gets; even unfixed, a session with this library plus CLAUDE.md strictly dominates CLAUDE.md alone, because nothing here misleads — the gaps are omissions, and the library's own honesty labels tell the reader where the floor is.
