# Uncertainty register — Narraitor skill library

Honest inventory of what this pass did NOT verify, suspects is stale, or needs the owner. Labels match the library convention. Date: 2026-07-04, develop @ 4bec88e6.

## Facts not verified this session (config-read only, not executed)

- `npm run build`, `deps:validate`, `knip`, `skott:check`, `lint:ds-canon`, `lint:layout-usage`, `audit:css` — scripts read, gates described from config + CI yml; none executed. (Executed and green: `npm test`, `type-check`, `lint`, `lint:css`.)
- Visual/e2e suites (`test:visual`, `test:e2e:critical`, tutorials) — config and baseline conventions verified by reading; no run (needs a dev server; none was started, by policy).
- The curl smokes in `narraitor-diagnostics-and-tooling` — derived from reading `src/utils/apiHelpers.ts` (400 "prompt is required" path), not fired at a live server.
- Storybook actually serving at 6006, dev server behavior on this machine — not started.
- Per-store persist `version`/`migrate` presence — verified for loreStore (v3) and narrativeStore (custom serialization); NOT enumerated for the other ~11 stores.
- Logger default level (debug/info suppressed in dev) — memory-derived, marked in debugging-playbook/diagnostics; verify `src/lib/utils/logger.ts` before relying.
- In-app DevTools panel feature list — directory-level verification only.
- The ~51 tsc-error figure for the react-joyride bump attempt (archaeology E4) — remembered, not reproduced; the doctrine stands independent of the number.

## Docs suspected stale (flagged, not fixed — deliberate: this pass writes only inside .claude/skills/)

- `DESIGN.md` + `public_docs/design-system/README.md`: residual `/dev/design-system*` references (pages retired per ADR-012; DESIGN.md largely names Storybook canon already — the staleness is residual lines). Candidate follow-up: a docs-only PR.
- ~~`public_docs/features/ai-systems.md`: names `gemini-2.0-flash`~~ — FIXED in the doc-rot sweep (model, timeout, and token-budget claims all corrected against `src/lib/ai/config.ts` and `src/lib/constants/aiTimeouts.ts`).
- `public_docs/development/mvp-roadmap.md`: Phase A/B/C items may lag actual completion (memory says Phase C shipped); the campaign skill re-derives gate state from issues instead.
- PRE-EXISTING skills carried stale content this pass deliberately did not edit. Largely resolved since: `style-port`'s dead token path is fixed (now `src/lib/theme/themes/`), and the `review` emoji mandate is gone. The doc-rot sweep additionally purged pre-ADR-013 DS1/DS2 content from nine skills. Still open: `narraitor-architecture`/`narraitor-pattern-alignment-skill` retain shadcn-era mentions — accurate as provenance for `src/components/ui/`, but they should not read as license to add `cva`/`cn()` (see `_review_doctrine.md` I4).
- Out-of-repo project memory: streamResilience claim confirmed stale this session (file deleted); other memory entries were spot-checked (joyride ✓, genai.d.ts ✓, model string ✓) but not exhaustively.

## Repo areas not inspected in depth

- `src/lib/generators/`, `src/lib/devtools/` internals; `src/components/devtools/` beyond a listing.
- `public_docs/security/` contents; CodeQL config details beyond workflow existence.
- The full `.dependency-cruiser.cjs` rule list (summarized by a discovery agent; not exercised against a violation).
- `endingTemplates.ts` context contract (flagged inside prompt-template-governance).
- Git history beyond ~400 commits; remote branch archaeology (30+ stale remotes noted, not mined).

## Historical claims needing owner confirmation (owner-confirmation-needed)

1. Is #1477 (44px touch targets) launch-blocking for v1.0?
2. Priority order of the frontier problems (F1–F5) — provisional order came from project memory.
3. Should the multi-world eval matrix (2×2×3 + arc + drills) be a HARD gate for every prompt change, or a strong default? (Encoded as the bar, per the distillation brief.)
4. Should the owner's personal QA-walkthrough skill be committed to the repo (the campaign skill encodes its evidence bar, not its full interactive script)?
5. Are the stale local branches (`feat/distill-*` — two hold uncommitted changes — and `claude/*`) safe to prune? Do NOT touch without an answer.
6. Node supported range (v24 is the session's version, not a documented minimum).

## Skills that need real weaker-model evals

RESOLVED for Sonnet (2026-07-05): the FULL 14-task benchmark was executed — combined treatment 27/28 vs descriptions-only baseline 21/28. Deltas land exclusively on evidence-discipline doctrine (leakage, eval matrix, append-only corrections, promotion ladder, red-first verification); zero delta where enforced gates, module docs, or memory already carry the doctrine; one negative delta (T9, skill tunnel vision) found and fixed in build-test-env. Scorecards: `_transfer_results/2026-07-05-sonnet-subset.md` and `_transfer_results/2026-07-05-sonnet-remaining9.md`.

Still open: a bare-clone zero-exposure control (in-session baselines had skill descriptions + project memory visible); a run on a genuinely weaker or other-vendor model (GPT-5.5).

NARROWED (2026-08-14): the trigger evals now have a harness. `npm run skills:trigger-eval` routes the labelled queries through a real Claude Code session and scores precision/recall per skill plus the sibling confusion matrix. What it measures is real - the model's own decision over the real descriptions - but it is not a clean measurement, and two caveats travel with every number it prints:

- Routing is nondeterministic, and the size of that noise is now measured rather than guessed. The same 96-query sample, same mode, same model, run twice, scored 89.6% and 85.4%. Treat anything under about five points as noise, and vote across repeats with `--runs` before calling a delta a regression.
- Both observation modes are biased, in opposite directions. `forced-choice` (the default) withholds every tool but Skill, so the model cannot answer by going and looking, which pushes the trigger rate up. `session` gives the normal toolset, where the model routinely opens with a context-gathering Bash call that the single-turn window scores as silence, which pushes it down. Truth sits somewhere between the two.

The harness has been run end to end against real queries from a local macOS checkout: 96 queries, forced-choice, sonnet, zero errored sessions, 82/96. A run that cannot reach the router no longer looks like a clean run. Errored cases are excluded from every number, listed with their cause, and the process exits 2 (or 1 if nothing scored at all), so a broken environment cannot be mistaken for a description regression.

Still unmeasured: mid-conversation triggering (the harness only ever sends a cold first message), and triggering under any model other than the one passed to `--model`.

## Process caveats

- Discovery was partially agent-mediated: claims labeled `observed` were read by a same-model discovery agent, not by the authoring session directly; `known` claims were verified first-hand. This distinction proved load-bearing: the factual review caught two BLOCKING agent-sourced errors that had been encoded as fact — a persist-key table wrong for 8 of 11 stores, and a wholly invented "personalizationEngine revert (#1195)". Both are corrected (see `_fixer_report.md`) and the second is now archaeology entry E8. Treat any surviving `observed` claim with proportional skepticism.
- The five Phase-1 owner questions were answered provisionally from project memory + repo evidence instead of blocking an autonomous session; items 1–6 above are the residue that genuinely needs the owner.

Last generated: 2026-07-04
