---
name: narraitor-debugging-playbook
description: Symptom-to-triage runbook for Narraitor failures - blank narrative, AI route 500/timeouts, hydration mismatch, state not persisting after reload, works-in-Storybook-but-broken-in-app, theming drift, flaky visual specs, mystery tsc errors. Use whenever something is broken and the cause isn't already proven, or when you're about to try a second fix for the same symptom.
---

# Narraitor debugging playbook

## 1. Purpose
Route a symptom to its first discriminating check so debugging converges instead of wandering. State the root-cause hypothesis BEFORE touching code; prove it by reproducing.

## 2. When to use
Any live failure; any time a first fix attempt didn't work; any time you catch yourself guessing.

## 3. When not to use
- Command fails before your code runs (install/port/browser) → `narraitor-build-test-env` first.
- Failure is a known settled battle → check `narraitor-failure-archaeology` before re-fighting it.
- AI output is *bad* rather than broken → `narraitor-ai-quality-discipline`.

## 4. Inputs required
The exact failing command or user flow, verbatim output/screenshot, and which checkout/port served it.

## 5. Procedure — symptom table

Run the **first check** before forming theories.

| Symptom | First discriminating check | Likely root causes | False friends |
|---|---|---|---|
| Blank/empty narrative in play | Browser network tab (or `preview_network`): did `/api/narrative/generate` fire? Status? | Missing provider key (`resolveApiKey` → null); response parse failure (`narrativeGenerator.response.parse.ts`); generation error held in `narrativeStore` error state | Restyling the component; blaming the prompt when the route never fired |
| AI route 500/4xx | `curl -s -X POST localhost:3000/api/narrative/generate -H 'Content-Type: application/json' -d '{}'` → expect 400 "prompt is required" (proves wiring, no key needed) | Body shape — `{prompt: string}` applies ONLY to generate/choices; ending/summarize/checkpoint have their own contracts (read the handler); key resolution; upstream Gemini error/outage; timeout (30s server-side on generate/choices, 120s client-side aiFetch) | "The AI is down" when it's a 400 from your own malformed body |
| Hydration mismatch warning | Does it reproduce on hard refresh with DevTools console open? Which component does React name? | Server/client boundary rendering store-dependent UI before `_hasHydrated`; Date serialization (narrativeStore has custom persistence); non-deterministic render (random/time) | Suppressing the warning; memoizing without finding the divergent value |
| State not persisting across reload | Browser devtools → IndexedDB → db `narraitor-state`, object store `narraitor-store`: is the persist key's blob updated? | Wrong/renamed persist key; shape change without `migrate` (loreStore is v3); action mutating outside `set()` | Blaming Zustand; adding a second storage path |
| Works in Storybook, broken in app | Diff the data: story's `withStores` seed vs real hydrated store (inspect IndexedDB blob) | Mock props/canned MSW responses hiding a real-shape mismatch; story seeds fields the app never populates | Tweaking CSS/props until Storybook AND app both look right-ish — fix the data contract |
| Theming drift (token resolves wrong) | Reproduce in Storybook toolbar across light + dark (one design system, ds3, since ADR-013); inspect computed style of the token (`getComputedStyle(el).getPropertyValue('--color-…')`) | Token defined in one theme file only; legacy `--primary` HSL tokens vs `--color-*` drift (#1474); selector specificity vs `.app-surface-*` heading rules | Hardcoding the "right" color (stylelint will block it — and it's wrong) |
| Visual spec diff/flake | Is the diff 0-pixels-but-timeout, or a real pixel region? Re-run the exact spec twice | Timeout → AI call escaping `isPlaywrightEnv()` gate or wrong worktree server; real diff in shared chrome → stale baseline cascade (rebase all affected at once) | Bumping timeouts; regenerating one baseline while siblings stay stale; regenerating on Linux |
| Mystery tsc errors after touching AI SDK usage | `cat src/types/@google/genai.d.ts` — the ambient file SHADOWS the real SDK types | New SDK field not declared in the ambient file | Casting to `any`; "upgrading" @google/genai to fix types |
| Console.log "not appearing" | Logger defaults suppress debug/info in dev | Output routed through `logger.debug` | Concluding the code path never runs |

## 6. Evidence required
- Root-cause hypothesis written down before the fix.
- The original failing command re-run green after the fix — pasted, not paraphrased.
- For "flake" verdicts: the exact check re-run at least twice, output shown.

## 7. Output artifact
A short debug log: symptom → first check + result → hypothesis → fix → original command green. This is what makes the fix reviewable.

## 8. Common traps
- Bad behavior this prevents: three successive CSS "band-aids" on a layout bug that was actually a store hydration race feeding empty data — inspect the constraint chain (DOM + state), don't iterate blind.
- 3 failed fix attempts on one symptom → STOP. Summarize the attempts and what each disproved; escalate or change approach. Do not spiral.
- Never edit a test to match broken behavior; never call something a flake without the re-run protocol above.
- A signal that pattern-matches a known failure may have a different cause — the first check exists to falsify, not confirm.

## 9. Related skills
`narraitor-build-test-env` (env-vs-code classification) · `narraitor-diagnostics-and-tooling` (the measurement commands) · `narraitor-failure-archaeology` (was this battle already fought?) · `narraitor-storybook-app-parity` (isolation-vs-integration divergence in depth).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `grep -rn "prompt is required" src/utils/apiHelpers.ts` (route body contract)
- `grep -n "dbName\|storeName" src/lib/storage/indexedDBAdapter.ts` (IndexedDB names)
- `ls src/types/@google/genai.d.ts` (ambient shadow still present?)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Logger default level claim comes from project memory (observed behavior), not re-verified in source this session — check `src/lib/utils/logger.ts` before relying on it.
- The symptom table covers recurring history, not all possible failures.
