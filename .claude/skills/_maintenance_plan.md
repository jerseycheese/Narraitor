# Maintenance plan — Narraitor skill library

The library is a snapshot (2026-07-04, develop @ 4bec88e6). Code moves; skills must be re-anchored or they become the stale docs they warn about.

## Re-verification schedule

- **On every major merge that touches** `src/state/`, `src/lib/ai/`, `src/lib/promptTemplates/`, `playwright.config.ts`, `.github/workflows/`, or any baseline file: run the affected skills' "Re-verify volatile claims" commands (each SKILL.md, section 10).
- **Monthly (or each release):** run the full drift check below; update `Last generated` dates only on skills actually re-verified.
- **After v1.0 ships:** retire or retarget `narraitor-hardest-problem-campaign` (its own provenance section says so) and refresh `narraitor-product-frontier` priorities.

## Drift check (copy-paste)

```bash
cd "$(git rev-parse --show-toplevel)" && git fetch && git status
git log --oneline -20                                  # arcs newer than skill provenance dates?
grep -rn "Last generated" .claude/skills/narraitor-*/SKILL.md | sort -t: -k3
grep -n "gemini-" src/lib/ai/config.ts                 # model strings vs domain-reference/diagnostics
grep '"react-joyride"' package.json                    # archaeology E4 pin
ls src/lib/state/storePubSub.ts src/state/storeEventWiring.ts src/types/@google/genai.d.ts
npm run skills:trigger-eval -- --dry-run             # fixtures parse; prints the query counts
npm test > /tmp/nt.log 2>&1; echo "exit=$?"; tail -3 /tmp/nt.log   # suite-count claims (capture exit BEFORE tail)
```
Anything that moved → update the owning skill first (fact-homes table below), then fix pointers.

## Fact homes (canonical owner per volatile fact)

When two files disagree about one of these, the HOME wins; everything else is a pointer to update.

| Fact | Home |
|---|---|
| Eval-matrix minimums (2x2x3 + arc + drills) | narraitor-ai-quality-discipline §5 |
| Model strings + generation config | narraitor-domain-reference reference.md "Key seams" (source: `src/lib/ai/config.ts`) |
| Timeout/retry model (30s server / 120s client / GeminiClient retries) | narraitor-domain-reference reference.md "Key seams" |
| IndexedDB db/store names + persist keys | narraitor-domain-reference reference.md store table |
| Route body contracts | narraitor-domain-reference reference.md routes section |
| macOS-baseline + regenerate-together rule | narraitor-validation-and-qa (doctrine) / failure-archaeology E9 (history) |
| Promotion ladder S0-S3 | narraitor-storybook-app-parity |
| Status-word evidence table | narraitor-change-control Step 2 |
| Settled-battle doctrines | narraitor-failure-archaeology reference.md |
| Gate commands + what fails means | narraitor-build-test-env §5 |

## Adding a new skill

1. Confirm it isn't a new section of an existing skill (prefer depth over sprawl; 16 + 4 pre-existing is already a large surface).
2. Follow the house format: trigger-rich frontmatter description; the 10 sections; provenance block with re-verify commands, date, uncertainties; long material into `reference.md`/`templates/`.
3. Add `evals/trigger_eval.json` (≥20 realistic queries incl. sibling near-misses), a row in `_trigger_matrix.md`, and an entry in `README.md` (inventory + dependency map).
4. Cross-link "Related skills" in BOTH directions.

## Retiring a stale skill

1. Confirm staleness against the tree (the skill's own re-verify commands).
2. Move any still-true doctrine to the surviving owner skill; add an archaeology entry if the retirement itself is a lesson.
3. Delete the folder, remove its README/trigger-matrix rows, and grep the library for `[[links]]`/mentions of it.
4. Note the retirement in `_fixer_report.md` style (date, why, where content went) — append to `_uncertainty_register.md`'s changelog if no better home.

## Updating trigger evals

When a skill's description changes, regenerate its near-miss negatives (they encode sibling boundaries) — don't just append positives. Re-run the confusable pairs listed at the bottom of `_trigger_matrix.md` after ANY description edit in those pairs. The command for that:

```bash
npm run skills:trigger-eval -- --pairs --model sonnet     # the confusable pairs
npm run skills:trigger-eval -- --skill narraitor-change-control --runs 3
npm run skills:trigger-eval -- --dry-run                  # plan and query counts, no model calls
```

Every query is a live `claude -p` session, so a full sweep of all 376 queries costs real money and a good half hour. Scope it to the skills whose descriptions actually moved. Pass `--out <file>` to keep the raw observations, then `--from <file>` rescores them for free.

Read the numbers with the register's caveats in hand: routing is nondeterministic, and the two `--tools-mode` settings bracket the true rate rather than pinning it. The same sample run twice came out 89.6% and 85.4%, so a swing of a few points is noise. A skill that drops from firing every time to firing never is a regression worth chasing.

Check the exit code before you read the report. 0 means every case was scored. 2 means some cases errored and were excluded, which usually means the environment, not the descriptions. 1 means nothing scored at all.

## Re-running the model-transfer benchmark

Per `_model_transfer_eval.md` §Running: control (library hidden) vs treatment, score 0/1/2, results into `.claude/skills/_transfer_results/<date>-<model>.md`. Run it: (a) once against a Sonnet-class model to validate the library at all (still pending — see uncertainty register), (b) after any major library revision, (c) when a new model generation becomes the default driver.

Last generated: 2026-07-04
