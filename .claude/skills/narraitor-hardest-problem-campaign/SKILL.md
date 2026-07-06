---
name: narraitor-hardest-problem-campaign
description: Executable campaign for Narraitor's hardest live problem - closing the v1.0 release gate, whose un-automatable core is validating the live AI play loop (real Gemini, multi-turn, consequences, endings) that every automated suite deliberately gates off. Use when asked to "get v1.0 out", "close the release gate", "validate the play loop end to end", "is this shippable", or to run/resume the release campaign.
---

# Campaign: close the v1.0 gate (and prove the AI play loop)

## 1. Purpose
Drive the release gate to a decision with evidence. Everything automated is already strong (2399 unit tests, visual regression, boundary gates); the hard residue is the live AI loop, which only a disciplined manual campaign can validate. This skill is that campaign, resumable by any session.

## 2. When to use
Release-gate work; "is v1.0 shippable"; full play-loop validation; resuming a partially-run campaign (start at the phase whose evidence is missing).

## 3. When not to use
- A single bug inside the loop → `narraitor-debugging-playbook` + change-control fix loop.
- Post-1.0 ambitions → `narraitor-product-frontier`.

## 4. Inputs required
Local Mac (visual suites are macOS-only), ~2 focused hours for Phase 3, and a working Gemini key: for the dev server, set `GEMINI_API_KEY` in `.env.local` (server-side fallback via `resolveApiKey`); alternatively enter a key in the app at `/settings/providers` (BYO path — sent per-request as the `x-provider-api-key` header). Phase 3 must exercise the BYO path at least once, since that's what players use.

## 5. Procedure

**Phase 0 — preflight.**
```bash
git fetch && git status                      # on develop, clean, up to date — or stop
npm ci && npm test && npm run type-check && npm run lint && npm run lint:css
lsof -nP -iTCP:3000 -sTCP:LISTEN             # know who owns the port before starting
npm run dev                                  # then: curl -s localhost:3000 | head -1  -> HTML
```
Expected: all green (baseline 2026-07-04: 353 suites / 2399 tests). Branch: any red here is NOT campaign work — fix via debugging-playbook first.

**Phase 1 — confirm what the gate still contains.**
```bash
gh issue view 1417 --json title,state,body   # v1.0 QA tracking epic
gh issue view 1320 --json title,state        # release tracking
gh issue list --milestone "" --label MVP --state open
gh issue view 1434 --json state,title        # last open QA finding (character-creation DS/UX)
gh issue view 1477 --json state,title        # touch targets - launch-blocking? ASK OWNER
```
Expected (as of 2026-07-04): QA findings #1423–#1438 closed except #1434 and post-1.0 #1438. Branch: if new blockers appeared, list them, triage against the roadmap (`public_docs/development/mvp-roadmap.md`), and get owner sign-off on the blocking set before proceeding. #1477's launch status is owner-confirmation-needed — do not decide it yourself.

**Phase 2 — route smokes (minutes, no gameplay).**
Route bodies DIFFER: only `narrative/generate` and `narrative/choices` take `{prompt}` (400 "prompt is required" on empty body); ending/summarize/checkpoint/significance have their own contracts — read each handler under `src/app/api/narrative/` first, then run the empty-body check (expect a controlled 4xx naming the missing field, per-route) and one live smoke (curls: `narraitor-diagnostics-and-tooling`). Expected: controlled 4xx on bad body; 200 + sane payload live; validate-provider distinguishes key-vs-outage ONLY when called with the `x-provider-api-key` header (keyless → `NO_KEY`, proves nothing — see `narraitor-diagnostics-and-tooling`). Branch: any 5xx or an unhandled-shape crash → stop, root-cause (launch blocker by definition).

**Phase 3 — the live play-loop matrix (the core).**
Protocol per `narraitor-ai-quality-discipline` §5 (the single home of the matrix minimums — its full 2x2 world-x-character grid applies; the cells below MAP onto it, they don't replace it):
```text
Cell A = (World 1, fresh character): fresh world (contrasting genre to your instinct -
        e.g. noir), FULL flow: onboarding -> world wizard -> character wizard -> 10+ turn session.
Cell B = (World 2, established character): different tone rating, 10+ turns including
        >=1 custom action, >=1 skill-influenced choice, inventory + journal use.
Cell C = (World 1, established character): drive one session to an ENDING; verify ending
        coherence + ending image + journal record. ("Established" = a character with prior
        session history and accumulated inventory/journal/lore, not one created this phase.)
Cell D = (World 2, fresh character): short run (3-5 turns) to complete the off-diagonal -
        catches world-2 assumptions baked into onboarding defaults.
Each cell: hard-refresh mid-session (persistence proof), check continuity vs loreStore facts,
verify all three themes once (narraitor-theme switch), dark mode once.
Failure drills (mechanism: DevTools AI mocking panel + network kill - see ai-quality-discipline
step 4): kill network mid-generation (error + retry path, #1478 machinery);
        invalid key (clear error, no hang); double-submit a choice.
```
Record every finding in one running log (screenshot + repro + severity), batch-file issues at the END (owner's preferred pattern), triaged: `launch-blocking` vs `post-1.0`.

**Phase 4 — fix loop.** For each launch-blocking finding: change-control fix cycle (root cause → minimal fix → test → original failing flow re-run green → PR to develop). Re-run the affected Phase 2/3 cell after each merge. Branch: >3 attempts on one finding → escalate with a summary, don't spiral.

**Phase 5 — full-gate verification.**
```bash
npm test && npm run type-check && npm run lint && npm run lint:css
npm run deps:validate && npm run knip && npm run skott:check && npm run build
npm run test:visual        # dev server running; macOS; expect green or DELIBERATE adoptions
```
Expected: all green; CI green on develop. Any baseline adoption follows change-control Step 4: enumerate ALL affected baselines, regenerate together on macOS, one-line written justification in the PR — no casual mass re-baselining at the finish line.

**Phase 6 — ship protocol.** Per `public_docs/development/release-process.md`, all four steps in order: (1) update `RELEASES.md` (version, date, scope, known-incomplete, what's next); (2) tag `develop` HEAD (`git tag -a vMAJOR.MINOR.PATCH[-suffix]` + `git push origin` the tag); (3) fast-forward `main` (`git merge --ff-only` the tag, then push — it must be a clean fast-forward or STOP); (4) publish the GitHub release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <notes-fragment>`. Do NOT stop at step 3 — an un-published tag is not a release. This is owner-visible and irreversible-ish: present the release notes + evidence bundle and get explicit go before tagging.

**Success criteria (all must hold):**
1. Phase 3 matrix complete with zero unfixed launch-blocking findings (log as proof).
2. Route smokes green; failure drills produce designed behavior (error UI + retry), not hangs.
3. Phase 5 fully green, including visual on macOS.
4. The blocking-set decision (#1434, #1477) has an explicit owner ruling recorded.
5. Release notes written; owner said "ship".

## 6. Evidence required
The running QA log, curl transcripts, the matrix table with per-cell verdicts, gate outputs, and the owner's blocking-set + ship decisions. No artifact → phase not done.

## 7. Output artifact
A campaign log (log location: the tracking issue #1417 or a PR-attached gist) with per-phase evidence, plus filed issues and the release notes draft.

## 8. Common traps — fenced wrong paths
- Do NOT run visual/e2e suites in cloud/Linux (baselines are macOS) — Phase 5 needs a Mac.
- Do NOT "quickly fix" polish findings mid-walkthrough — log, batch, triage; only launch-blockers enter Phase 4.
- Do NOT treat one clean cell as a validated loop — the matrix is the unit.
- Do NOT bump react-joyride, restyle DS surfaces, or refactor stores "while in there" (archaeology; scope discipline). Visual polish is explicitly deferred to 1.1 unless it blocks play.
- Do NOT tag/fast-forward main without the explicit go — Phase 6 is a proposal until then.
- Bad behavior this prevents: a session plays one happy-path fantasy session, declares the loop "QA-verified", and v1.0 ships with a choice-submit hang that any failure drill would have caught.

## 9. Related skills
`narraitor-ai-quality-discipline` (matrix), `narraitor-diagnostics-and-tooling` (smokes), `narraitor-validation-and-qa` (tiers), `narraitor-change-control` (fix loop + status), `narraitor-debugging-playbook` (triage). The owner's personal `narraitor-qa-walkthrough` skill covers similar ground interactively — this campaign is the committed, resumable version.

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `gh issue view 1417 --json state && gh issue view 1434 --json state && gh issue view 1477 --json state`
- `head -30 public_docs/development/mvp-roadmap.md` (gate definition drift)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Issue states WILL drift — Phase 1 re-derives the gate every run; the states quoted here are the 2026-07-04 snapshot.
- Whether roadmap Phase C items (#1365-#1367) are fully shipped is memory-supported but the roadmap doc may lag (stale-risk) — Phase 1 confirms.
- After v1.0 ships, this campaign should be retargeted at the next hardest problem (likely F1/F3 from product-frontier) — retire or rewrite, don't leave it stale.
