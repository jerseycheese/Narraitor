---
name: narraitor-diagnostics-and-tooling
description: How to MEASURE instead of eyeball in Narraitor - curl smokes for the AI/API routes, inspecting persisted Zustand state in IndexedDB, DOM/computed-style checks for layout and theming, visual tooling, and where reports land. Use when you need proof of runtime behavior - "is the route up", "what's actually in the store", "what computed style applies", "where is the playwright report" - or when a claim needs an artifact.
---

# Diagnostics & tooling

## 1. Purpose
Every claim needs a measurement. This is the toolbox: the exact command per question, and what each diagnostic can and cannot conclude.

## 2. When to use
Producing evidence for any claim; investigating runtime state; verifying a fix live.

## 3. When not to use
- Choosing WHAT to verify → `narraitor-validation-and-qa` / `narraitor-debugging-playbook`; this skill is the HOW.

## 4. Inputs required
A running dev server on the correct port for YOUR checkout (`lsof -nP -iTCP:3000 -sTCP:LISTEN` — worktrees use derived ports).

## 5. Procedure — the toolbox

**AI/API route smokes (curl):**
```bash
# Route wiring, NO key needed — expect HTTP 400 {"error":"...prompt is required..."}:
curl -s -X POST localhost:3000/api/narrative/generate -H 'Content-Type: application/json' -d '{}' -w '\nHTTP %{http_code}\n'

# Live generation smoke (burns tokens; needs a key — GEMINI_API_KEY in .env.local for the
# server fallback, or pass the BYO header: -H 'x-provider-api-key: <key>'):
curl -s -X POST localhost:3000/api/narrative/generate -H 'Content-Type: application/json' \
  -d '{"prompt":"One sentence of neutral test narration."}' -w '\nHTTP %{http_code}\n'

# Provider key validity vs upstream outage discrimination:
curl -s -X POST localhost:3000/api/ai/validate-provider -H 'Content-Type: application/json' -d '{}' -w '\nHTTP %{http_code}\n'
```
Interpretation: 400 on empty body = route up, handler wired. 200 with generated text = full path live. 5xx/timeout on a valid body = key, upstream, or timeout (generate/choices: 30s server-side via `makeGeminiRequest`, no retries; the 120s figure is the CLIENT-side aiFetch ceiling and doesn't apply to direct curls) — validate-provider splits key-vs-outage. NOTE: the `{prompt}` 400-contract applies to `narrative/generate` and `narrative/choices` only; other routes have their own body shapes — read the handler before smoking them.

**Persisted store state (ground truth of app data):** Browser devtools → Application → IndexedDB → db `narraitor-state` → object store `narraitor-store` → the persist key (e.g. `narraitor-narrative-store`). This is what hydration will produce — when UI and expectation disagree, read this first. (Provider keys sit encrypted in db `narraitor-secure`; there is nothing useful to eyeball there.)

**In-app DevTools panel:** dev builds render a DevTools surface (`src/components/devtools/` — decision console, AI mock controls, token budget panel); suppressed under automation (`ClientOnlyDevTools`). Use it for live narrative/decision state during manual play.

**DOM / computed styles (layout + theming truth — screenshots lie about color/size):** with the Claude preview tools use `preview_inspect` (specific CSS properties) over `preview_screenshot`; in a plain terminal session use browser devtools or the owner's `bdg` CLI (personal tooling — available locally, not a repo dependency). Check the resolved token: `getComputedStyle(el).getPropertyValue('--color-…')` at the element, per theme.

**Visual tooling:** `npm run test:visual` (needs server); failure artifacts → `test-results/` (diffs, traces) and `playwright-report/`; CI report via `scripts/download-playwright-report.sh`; prune orphaned baselines with `npm run test:visual:prune`.

**Static analysis on demand:** `npm run deps:validate:strict` (ALL boundary violations incl. baselined), `npm run skott:circular` (list cycles), `npm run knip` (dead exports), `npm run audit:css` (unused selectors — advisory, ~dozens of known-kept findings), `npm run validate:routes` (dangling Link/router.push targets).

**Logs:** app logging goes through the Logger utility (`no-console` is an ESLint error in product code); dev-visible output must be warn+ — don't conclude "code path never runs" from a silent `logger.debug`.

## 6. Evidence required
Paste the command AND its output. A diagnostic you ran but can't show didn't happen.

## 7. Output artifact
Command transcripts, screenshots/DOM excerpts, or report paths — attached to the claim they support.

## 8. Common traps
- Bad behavior this prevents: declaring "the AI routes are healthy" after `curl localhost:3000` returns HTML — that proves the dev server, not one of the 20 API routes; smoke the actual route with the 400-contract check.
- A diagnostic is insufficient when it can't distinguish your hypotheses: one green generation ≠ prompt reliability (ai-quality-discipline); route-up ≠ key-valid (use validate-provider); screenshot-looks-right ≠ token-correct (inspect computed styles).
- Running smokes against the wrong checkout's server (verify the port owner first).
- Live-generation smokes spend the owner's/player's tokens — prefer the 400-contract check unless generation itself is the question.

## 9. Related skills
`narraitor-debugging-playbook` (which measurement, when) · `narraitor-validation-and-qa` (tiers) · `narraitor-build-test-env` (ports/servers) · `narraitor-ai-quality-discipline` (when one measurement isn't enough).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `curl -s -X POST localhost:3000/api/narrative/generate -H 'Content-Type: application/json' -d '{}' -w '\n%{http_code}\n'` (route contract — expect 400)
- `grep -n "dbName\|storeName" src/lib/storage/indexedDBAdapter.ts` (IndexedDB names)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- The 400-contract smoke was derived from reading `src/utils/apiHelpers.ts`, not executed against a live server this session (no server was started, by policy).
- The in-app DevTools panel's exact feature set drifts; treat the panel list as indicative.
- Logger default-level claim is memory-derived (see debugging-playbook uncertainty).
