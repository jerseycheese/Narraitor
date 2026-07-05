---
name: narraitor-validation-and-qa
description: What counts as evidence in Narraitor - the test tiers (unit, Storybook, visual regression, e2e, manual QA walkthrough), what each can and cannot prove, acceptance thresholds, how to add tests, and how to read failures. Use when deciding which tests a change needs, interpreting a red or suspiciously green run, planning QA before a release, or when someone cites "tests pass" as proof.
---

# Validation & QA — what counts as evidence

## 1. Purpose
Map every verification tier to what it actually proves, so claims ride on the right tier and gaps are named instead of papered over.

## 2. When to use
Choosing tests for a change; interpreting failures; assessing a "tests pass" claim; planning release QA.

## 3. When not to use
- Environment-level failures → `narraitor-build-test-env`.
- AI output quality → `narraitor-ai-quality-discipline` (its matrix is the tier for generation behavior).

## 4. Inputs required
The change class (per change-control) and the diff.

## 5. Procedure — the tier table

| Tier | Command / surface | Proves | CANNOT prove |
|---|---|---|---|
| Unit/integration (Jest, jsdom) | `npm test` — co-located `src/**/__tests__`, `*.test.*` | Logic, parsing, template assembly, store actions | Rendering in a real browser, hydration, visual truth, AI prose quality |
| Storybook | `npm run storybook` + `lint:ds-canon` | Design intent, isolated render states, a11y addon checks | App integration, real data shapes, route/network behavior (S0/S1 on the parity ladder) |
| Visual regression / e2e critical (Playwright — NOTE: `test:visual` and `test:e2e:critical` are the SAME command, `playwright test --project=chromium`; two script names, one tier) | `npm run test:visual` (dev server running; macOS baselines `*-chromium-darwin.png`, threshold 0.2 / maxDiffPixels 10k; post-`hasHydrated` store seeding) | Pixel stability of the SEEDED states + wired flows the specs exercise | Anything the seeds don't cover; correctness of behavior; live AI generation (gated off via `isPlaywrightEnv()`); cross-world generality |
| Manual QA walkthrough | Human/agent plays the real app: onboarding → world + character creation → live story loop (real key) → consequences → endings → theming; smoke AI routes via curl | The product actually works, including the AI loop | Regression protection over time (it's a point-in-time gate) |

**Rules of evidence:**
1. A claim may only cite tiers that cover it. "Tests pass" (unit) says nothing about a layout bug; "visual suite green" says nothing about a prompt change (AI is gated off there).
2. Green-but-irrelevant is a coverage gap, not evidence — check what state a baseline actually seeds before citing it.
3. The AI play loop has NO automated tier by design. Claims about it require the manual walkthrough or the ai-quality-discipline matrix. This is the project's largest standing gap — say so rather than implying coverage.

**Adding tests (MVP-level, never rigged):**
- New logic → co-located Jest test pinning the acceptance criteria (not implementation details).
- New in-scope component → story (CI requires it) + promotion evidence per parity ladder.
- New stable visual state worth pinning → visual spec: prefer locator screenshots over fullPage (sticky-shell artifacts, cascade blast radius); seed stores post-hydration; seed `narraitor-theme` for DS variants; regenerate affected baselines together, on macOS only; `npm run test:visual:prune` for orphans.
- Trivial one-line CSS/copy fixes: verify live instead of pinning a spec (test debt costs more than it protects).

**Reading failures:** assertion vs timeout vs pixel-diff triage lives in `narraitor-debugging-playbook`; the flake protocol (re-run twice, show output) applies before any "flake" verdict. Failing CI outside your diff → check whether develop already has an in-flight fix before "fixing" it yourself.

## 6. Evidence required
Per claim: the tier name + the run output (exit code shown). For release gates: the walkthrough log with findings triaged.

## 7. Output artifact
A coverage statement in the PR: which tiers ran, which apply-but-didn't-run and why, and what remains unproven.

## 8. Common traps
- Bad behavior this prevents: shipping a narrative-loop change with "all 2399 tests green" as the headline — none of those tests generate a single AI turn; the claim smells like coverage and proves none.
- Rigging in any form (deleting red tests, loosening assertions, `.skip`, gating features off in tests to pass) — the eslint-jest guards catch some of it; discipline catches the rest.
- Vacuous tests (no meaningful `expect`) add maintenance without protection — `jest/expect-expect` warns; don't ship them.
- Writing comprehensive test suites for MVP features — KISS applies to tests too.

## 9. Related skills
`narraitor-change-control` (status language) · `narraitor-storybook-app-parity` (ladder) · `narraitor-ai-quality-discipline` (the AI tier) · `narraitor-debugging-playbook` (failure triage) · `narraitor-hardest-problem-campaign` (the release-gate walkthrough as a campaign).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `grep -n "maxDiffPixels\|threshold" playwright.config.ts`
- `ls tests/visual/*.spec.ts | wc -l && find tests/visual -name "*-chromium-darwin.png" | wc -l` (spec/baseline counts)

Last generated: 2026-07-04 (develop @ 4bec88e6; unit tier run green this session)
Known uncertainty:
- Visual/e2e suites not executed this session (config-verified only).
- The manual walkthrough exists as an owner-level personal skill, not a committed repo artifact — this skill encodes its evidence bar, not its full script (owner-confirmation-needed whether to commit the full script).
