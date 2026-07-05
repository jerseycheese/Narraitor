---
name: narraitor-build-test-env
description: Recreate, run, and verify the Narraitor environment - install, dev server, Storybook, the full quality gate, and how to classify failures as environment vs data vs AI-provider vs code. Use when setting up from scratch, when "npm test / build / lint fails", when the dev server won't start or the port is taken, when Playwright can't run locally, when jest runs out of memory, or before claiming any gate is green.
---

# Narraitor build, test, and environment

## 1. Purpose
Make the environment a solved problem: exact commands, exact ports, and a triage order that tells environment failures apart from code failures before anyone edits source.

## 2. When to use
Fresh checkout/worktree setup; any command failing for unclear reasons; before reporting any gate green; before starting servers.

## 3. When not to use
- The gate runs fine and an assertion fails → `narraitor-debugging-playbook` / `test-fix`.
- Deciding WHICH tests a change needs → `narraitor-validation-and-qa`.

## 4. Inputs required
Repo checkout; know whether you are in the main checkout or a worktree (`git rev-parse --git-dir` — worktrees live under `.claude/worktrees/`).

## 5. Procedure

**Install** (node v24.x / npm 11.x known-good as of 2026-07-04):
```bash
npm ci
```
Each worktree has its OWN `node_modules` — after any lockfile change, `npm ci` in every worktree you touch ("Invalid hook call" render errors = mismatched React copies from a stale worktree install).

**Dev server** — check before starting; never kill a server mid-test-run:
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN   # who owns 3000? (another worktree/project may)
npm run dev                         # main checkout: 3000; worktrees: derived port via scripts/worktree-port.js
curl -s localhost:3000 | head -1    # proves HTML is served (use the actual port)
```
Storybook: `npm run storybook` → http://localhost:6006.

**The quality gate** (all four before any commit; all verified green on develop @ 4bec88e6):
```bash
npm test              # jest: ~353 suites / ~2399 tests / ~30s
npm run type-check
npm run lint
npm run lint:css      # run after ANY .css edit
```
Verify exit codes directly — never pipe through `tail`/`grep` in a way that swallows `$?`.
For CSS/visual changes the gate is not only lint: verify the change live in ALL THREE design systems (ds1/ds2/ds3 via the theme switcher or Storybook toolbar) AND dark mode before commit — the three systems differ structurally by design (ADR-011), and a change that looks right in ds1 can break ds3. (Class gates: `narraitor-change-control` Step 1.)

**Heavier gates** (CI-blocking; run when your change touches their domain):
| Command | Gate | Fails when |
|---|---|---|
| `npm run deps:validate` | domain boundaries | new cross-domain import not in `.dependency-cruiser-known-violations.json` |
| `npm run knip` | dead code | new unused export/dependency |
| `npm run skott:check` | circular deps | cycle count exceeds `.skott-baseline.json` (budget: 6) |
| `npm run lint:ds-canon` | Storybook canon | NEW in-scope component without a story (grandfathered via `.ds-canon-baseline.json`) |
| `npm run lint:layout-usage` | SSR safety | self-closing `<PageLayout />` |
| `npm run build` | prod build (includes Storybook build) | lint/type/build errors |

**Playwright (visual/e2e)** — local rules:
1. Dev server for THIS worktree must already be running (`webServer` autostart is CI-only).
2. Fresh worktree: `npx playwright install chromium` once.
3. `npm run test:visual` (chromium project) / `npm run test:visual:tutorials`.
4. Baselines are `*-chromium-darwin.png` — macOS-rendered. NEVER run or regenerate visual suites on Linux/cloud; pixel diffs are guaranteed.

**Memory issues:** local jest OOM → `npm run test:ci` (4GB heap).

## 6. Evidence required
A gate is "green" only with the command's own summary + exit 0 captured this session. "It passed earlier" or "CI will catch it" are not evidence.

## 7. Output artifact
Command transcript (command → summary line → exit code) for every gate you claim.

## 8. Common traps
- **Failure classification, in order:**
  1. *Environment*: module-not-found, "Invalid hook call", port in use, Playwright browser missing, SIGKILL/OOM → fix install/port/browser, don't touch source.
  2. *Data/state*: works empty but not with your seeded world, hydration-order errors, stale IndexedDB from an old shape → re-seed, hard-refresh, check persist `migrate`.
  3. *AI provider*: only live-generation paths fail → distinguish dead key (401/permission from `/api/ai/validate-provider`) vs upstream outage vs timeout (120s `aiFetch` ceiling). Different fixes; prove which with a curl (see `narraitor-diagnostics-and-tooling`).
  4. *Code*: only after 1–3 are excluded.
- Bad behavior this prevents: 30 minutes "fixing" a component because tests fail in a worktree that never got `npm ci` after a dependency bump.
- Don't start a second dev server on a port you didn't check; don't `npm run kill` while any test run is using a server.
- Cloud sessions: unit/type/lint/build fine; visual + e2e suites are macOS-only — don't run them there.

## 9. Related skills
`narraitor-debugging-playbook` (symptom triage once env is excluded) · `narraitor-validation-and-qa` (which tier proves what) · `narraitor-diagnostics-and-tooling` (curl smokes, runtime inspection).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `npm test > /tmp/nt.log 2>&1; echo "exit=$?"; tail -5 /tmp/nt.log` (suite counts drift; capture the exit code BEFORE tail — piping into tail would report tail's exit, the exact anti-pattern §5 forbids)
- `node -e "console.log(require('./package.json').scripts)"` (script names)
- `cat .skott-baseline.json` (cycle budget)

Last generated: 2026-07-04 (develop @ 4bec88e6; test/type-check/lint/lint:css all run this session, exit 0)
Known uncertainty:
- `npm run build`, `deps:validate`, `knip`, `skott:check`, visual suites: config-verified but not executed this session.
- Node v24 is the session's version, not a documented minimum (owner-confirmation-needed for the supported range).
