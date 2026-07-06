---
name: narraitor-change-control
description: How changes are classified, gated, evidenced, and shipped in Narraitor - and what may never be claimed without proof. Use before declaring anything "done", "fixed", "validated", or "verified", before re-baselining any gate (visual snapshots, dep-cruiser, skott, ds-canon), when correcting an earlier wrong claim, or when deciding what evidence a PR needs. This is the anti-overclaiming gate for every other skill.
---

# Narraitor change control

## 1. Purpose
Keep status honest. Every claim about a change has a required evidence tier; corrections append rather than overwrite; no gate gets routed around. This skill is load-bearing for all others — when in doubt about whether you may say "done", the answer is here.

## 2. When to use
Before any status claim; before opening/merging a PR; before re-baselining anything; after discovering a prior claim (yours or a doc's) was wrong.

## 3. When not to use
- Choosing which tests to run → `narraitor-validation-and-qa`.
- Deciding ship vs hold on product grounds → `narraitor-feature-experiment-lifecycle`.

## 4. Inputs required
The diff (or planned diff), its classification (below), and the artifacts you already have.

## 5. Procedure

**Step 1 — classify the change.** The class sets the minimum gate:

| Class | Minimum gate before "done" |
|---|---|
| Docs-only | Claims in the doc verified against the tree; stale refs not propagated |
| Code (logic) | Quality gate (test, type-check, lint, lint:css) green locally + test added/updated + original failing case re-run if it's a fix |
| Component / user-facing UI | Code gate PLUS parity ladder >= S2 per `narraitor-storybook-app-parity` (S3 for user-facing features) — unit-green + story alone NEVER earns "done" for UI |
| Test-only | The test fails without the fix / passes with it — shown, not asserted |
| AI-route / AI-behavior | Code gate PLUS multi-world evidence per `narraitor-ai-quality-discipline`; prompt changes per `narraitor-prompt-template-governance` |
| Design-system / CSS | Code gate PLUS `lint:css`, all three DS themes + dark mode checked, visual baselines regenerated together if shared chrome moved |
| Store-shape | Code gate PLUS the blast-radius checklist in `narraitor-architecture-contract` (persist migrate!) |
| Content/copy | Project voice, no "AI" in user-facing strings, baseline impact checked |

**Step 2 — status language is earned, not decorative:**

| Word | May be used only when |
|---|---|
| "fixed" | Original failing command/flow re-run green, output shown |
| "done" | Class gate above met + issue acceptance criteria met |
| "verified" / "validated" | Named artifact exists (command output, screenshot, CI run, QA log) and is cited |
| "integrated" | Seen working in the running app with real hydrated state — Storybook/unit green alone NEVER earns it |
| "reliable" (AI behavior) | Multi-world/character evidence recorded — one good generation NEVER earns it |
| Anything else | Say what you actually observed: "renders in Storybook", "unit-green", "smoke-tested on one world" |

**Step 3 — no silent promotion.** A change's status only moves up when new evidence is produced. CI green promotes "locally green" → "CI green"; it does not promote "unit-tested" → "QA-verified".

**Step 4 — re-baselining is a decision, not a fix.** Visual snapshots, `.dependency-cruiser-known-violations.json`, `.skott-baseline.json`, `.ds-canon-baseline.json`: updating any of these accepts new debt or new truth. Required: one written sentence of justification ("baselines regenerated because the card footer legitimately changed in #NNNN — all 12 affected specs adopted together"), visible in the PR. Adding to a violations baseline to make a NEW violation pass is prohibited.

**Step 5 — corrections are append-only.** When a prior claim turns out wrong (in a log, issue, doc, or memory): do not rewrite history to look right. Append: `CORRECTION (date): earlier claim X was wrong because Y; actual state is Z; evidence: <artifact>`. Template: `templates/correction-append.md` in `narraitor-docs-and-writing`.

**Step 6 — ship mechanics.** PRs target `develop` (`main` is release-only — `public_docs/development/release-process.md`). Fill the repo PR template (`.github/PULL_REQUEST_TEMPLATE.md`) — every applicable section, checkboxes ticked only when actually true. "Closes #N" does not auto-close on merge to `develop` — close manually. Scope stays pinned to the issue; adjacent finds become follow-up issues, not diff growth.

## 6. Evidence required
Whatever Step 2 demands for the words you intend to use. If you can't produce it, use weaker words.

## 7. Output artifact
A status block in the PR/log: classification, gates run (command → exit), evidence per claim, any baseline changes + justification.

## 8. Common traps
- Bad behavior this prevents: a session marks #NNNN "fixed and verified" because unit tests pass, the owner plays one turn that evening and hits the same bug — the original failing flow was never re-run.
- "Small change" is a classification error more often than a fact — classify first, then size.
- Deleting a red test, loosening an assertion, or hiding a REAL failure behind a test-env gate to get green = rigging. Never. (The sanctioned `isPlaywrightEnv()` gate on live AI calls is NOT rigging — it's a documented tier boundary keeping nondeterministic generation out of deterministic suites; the AI tier is covered elsewhere and the gap is stated, not hidden.)
- Don't pad a fix with drive-by refactors; don't let a refactor silently change behavior ("while I'm here" is a follow-up issue).

## 9. Related skills
`narraitor-validation-and-qa` (what each tier proves) · `narraitor-ai-quality-discipline` (the AI evidence bar) · `narraitor-storybook-app-parity` (the "integrated" bar) · `narraitor-docs-and-writing` (correction mechanics) · the repo `review` skill for PR review, and the owner's personal `kiss` skill for scope trimming (owner-personal — may be absent for other contributors; the scope rule stands regardless).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls .github/PULL_REQUEST_TEMPLATE.md .dependency-cruiser-known-violations.json .skott-baseline.json .ds-canon-baseline.json`
- `head -20 public_docs/development/release-process.md` (release model unchanged?)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Whether the owner wants the multi-world AI evidence bar as a HARD gate for every prompt tweak or a strong default — it is BINDING as written until the owner explicitly relaxes it; pending ratification is not an exemption.
