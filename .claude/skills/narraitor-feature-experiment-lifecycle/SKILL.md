---
name: narraitor-feature-experiment-lifecycle
description: How a hunch becomes a shipped, held, or retired change in Narraitor - issue capture, acceptance criteria, experiment flagging for AI-behavior changes, the gate sequence, and ship/hold memos. Use when starting any feature or improvement idea, when someone says "let's try", "quick experiment", "I have an idea for the narrative", or when deciding whether in-flight work ships, holds, or gets retired.
---

# Feature & experiment lifecycle

## 1. Purpose
Give every idea one path from hunch to decision, so work is scoped before it starts and every ending (ship, hold, retire) leaves a record.

## 2. When to use
New feature/improvement work; prompt or AI-behavior experiments; resurrecting old ideas; deciding the fate of half-done work.

## 3. When not to use
- Pure bug fixes with a reproducer → change-control's fix loop directly.
- Already-scoped issue implementation → the owner's issue pipeline (analyze-issue → tdd-implement → post-merge; owner-personal skills — may be absent for other contributors, in which case: analyze the issue, TDD the fix, open the PR per change-control). This skill wraps AROUND that pipeline, not instead of it.

## 4. Inputs required
The idea in one sentence; which class it is (UI, mechanics, AI-behavior, infra).

## 5. Procedure

```text
P0 CAPTURE — file an issue with the matching template (.github/ISSUE_TEMPLATE/: bug_report,
   enhancement, epic, feature_request, user-story). Existing labels only. Check the epic map
   first — most ideas belong under an existing epic, and closed history may have already
   tried it (search closed issues before proposing).
P1 SCOPE — acceptance criteria written UP FRONT, evaluator-checkable ("player can X and it
   persists across reload"), plus explicit non-goals. v1.0-phase rule: polish and reliability
   only — net-new features default to post-MVP labels.
P2 PREDICT — state expected behavior BEFORE coding: what changes, what must not change,
   which stores/routes/templates it touches (blast radius from architecture-contract).
P3 FLAG AI EXPERIMENTS — any change to prompts/templates/generation config is an EXPERIMENT:
   declare the eval matrix per narraitor-ai-quality-discipline section 5 (the single home of
   the matrix minimums — name your worlds/characters) BEFORE writing code.
   Prompt work additionally follows prompt-template-governance gates.
P4 BUILD — smallest diff that can prove the criteria. TDD where a wrong behavior is pinnable.
P5 LOCAL PROOF — run it in the dev server (real flow, not only /dev/* harness or Storybook).
P6 PARITY — storybook-app-parity ladder to >= S2; cross-DS + dark mode for anything visual.
P7 GATE — quality gate green; class-specific gates per change-control; AI experiments: the
   full ai-quality-discipline matrix recorded.
P8 FRESH-STATE CHECK — brand-new world + character walk the feature end to end (catches
   assumptions your seasoned test data hides), plus a hard-refresh persistence check.
P9 DECIDE — write the ship/hold memo (templates/ship-hold-memo.md). Ship -> PR to develop
   per change-control. Hold -> memo names the failing gate and re-entry condition.
   Retire -> close the issue with the memo so the battle isn't re-fought (this feeds
   failure-archaeology).
```

## 6. Evidence required
P1 criteria in the issue; P3 matrix declared before building; P7 artifacts; P9 memo. An experiment with no declared matrix is a hunch wearing a lab coat — send it back to P3.

## 7. Output artifact
The issue (criteria + non-goals), the eval log (AI experiments), and the ship/hold memo. Retired ideas keep their memo in the closed issue.

## 8. Common traps
- Bad behavior this prevents: "quick experiment" edits a shared template inline, gets judged on one world's output, ships inside an unrelated PR, and permanently shifts tone everywhere — no issue, no matrix, no memo, unfindable in history.
- Scope creep mid-build: adjacent finds become NEW issues (honor explicit scope constraints; the diff stays pinned to P1).
- Resurrecting settled decisions as fresh ideas — search closed issues + `narraitor-failure-archaeology` first.
- Calling a hold a ship because the work is "mostly done" — the memo's failing gate is the status.
- Skipping P8 because "my world covers it": your world is old data with every migration applied; fresh state is where wizards and defaults break.

## 9. Related skills
`narraitor-change-control` (gates + status language) · `narraitor-ai-quality-discipline` (the matrix) · `narraitor-prompt-template-governance` (prompt experiments) · `narraitor-storybook-app-parity` (P6) · `narraitor-validation-and-qa` (which tests P7 means).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls .github/ISSUE_TEMPLATE/` (template inventory)
- `gh issue list --label epic --state open` (current epic map)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- The v1.0 "no net-new features" rule expires when 1.0 ships — re-check the roadmap phase before enforcing it.
- Whether the owner wants ship/hold memos for SMALL polish items too (owner-confirmation-needed; default: memo only when any gate was non-trivial).
