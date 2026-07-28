---
name: narraitor-storybook-app-parity
description: Isolation-vs-integration parity reasoning and the component promotion ladder for Narraitor. Use when something "works in Storybook" but not the app (or vice versa), before calling any component done/integrated, when writing stories with withStores or MSW, or when deciding whether Storybook-green is enough evidence. Storybook is the canon DESIGN surface, never proof of app behavior.
---

# Storybook <-> app parity

## 1. Purpose
Storybook (ADR-012) is the canonical surface for what components should look like — and simultaneously the most common source of false confidence about how they behave. This skill defines the promotion ladder and the parity checks between tiers.

## 2. When to use
Storybook/app disagreements; authoring stories; reviewing "component is done" claims; promoting a component into a real route.

## 3. When not to use
- Pure visual-token drift within one surface → `narraitor-debugging-playbook` theming row.
- Deciding to ship a feature → `narraitor-feature-experiment-lifecycle` (parity is one of its gates).

## 4. Inputs required
The component, its stories (`src/stories/`), its real usage site(s), and the store slices it reads.

## 5. Procedure

**The promotion ladder — a component holds exactly one status:**
```text
S0 renders-in-isolation-only   (story exists, mock props)        <- BLOCKING status
S1 mock-data-only              (story seeds stores via withStores; MSW answers /api) <- BLOCKING status
S2 integrated                  (works in the running app with real hydrated IndexedDB state)
S3 QA-verified                 (exercised in a real flow incl. failure paths; evidence recorded)
```
"Done" requires >= S2 with evidence; user-facing features require S3. S0/S1 are legitimate development states but BLOCK any done/integrated claim.

**Parity checklist (run when promoting or when tiers disagree):**
1. **Prop/data parity** — story args vs what the app actually passes. Diff the real call site, not the README.
2. **State parity** — `withStores` seed shape vs real store shape after hydration. Stores are NOT auto-reset between stories; a story can pass by leeching a previous story's seed. Seed every dependency explicitly.
3. **Render parity** — same state → same output. If not: environment differences (Next Image, fonts, `themeInitScript`, missing provider/context in the app tree).
4. **Interaction parity** — events update real stores in the app, not just Storybook actions. Click it in the app; watch the store slice change (IndexedDB db `narraitor-state`).
5. **Network parity** — MSW canned responses (`.storybook/msw/handlers.ts`) are happy-path only. The real route can return errors, malformed payloads, or take seconds (timeout ceiling 120s). Exercise loading/error/empty in the APP, not only as story variants.
6. **Runtime semantics** — hydration (component renders pre-hydration in the app; Storybook seeds synchronously so it never sees that window), App Router navigation (Storybook mocks the router as a logger), and multi-second AI latency.
7. **Perf parity** — no re-render storm in the app that Storybook's isolated tree hides (React DevTools profiler on the real route when the component subscribes to hot stores like narrativeStore).
8. **Cross-context** — light and dark (`colorScheme` toolbar in Storybook, `narraitor-color-scheme` in the app) + mobile viewport; for data components, >= 2 worlds/characters. There's one design system since ADR-013, so light/dark is the whole matrix.

**Diagnosis rule:** when tiers disagree, the divergence is in DATA or ENVIRONMENT, not in the component's paint logic. Find the input diff first (compare story seed to the real hydrated blob), then touch code.

## 6. Evidence required
Status claims name the ladder rung + the artifact: story link for S0/S1; app screenshot/log + state description for S2; QA-log entry with failure paths for S3.

## 7. Output artifact
A promotion note in the PR: "S1 → S2: verified on /worlds/[id]/play with persisted world 'X', hydration + error path exercised; screenshots attached."

## 8. Common traps
- Bad behavior this prevents: a character sheet is pixel-perfect in Storybook, ships, and renders blank in the app — the story seeded `characterAttributes` in a shape the hydrated store never produces; nobody ran the app.
- Writing a story to match a broken component "so the canon is consistent" — the canon documents intent, not bugs.
- `lint:ds-canon` (CI) requires stories for NEW in-scope components — a story is the floor, not the finish line.
- Storybook builds into `public/storybook-static` and needs HTTP to serve (base href `/storybook/`); opening it via `file://` shows a blank page — that's not a bug.

## 9. Related skills
`narraitor-validation-and-qa` (tier definitions and thresholds) · `narraitor-change-control` ("integrated" is earned) · `narraitor-debugging-playbook` (the Storybook-vs-app symptom row) · `narraitor-diagnostics-and-tooling` (inspecting the hydrated state).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls .storybook/decorators/withStores.tsx .storybook/msw/handlers.ts`
- `npm run lint:ds-canon` (canon guard behavior)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Whether withStores gained auto-reset since authoring (re-read the decorator before relying on the leeching warning).
- Perf-parity guidance is expert doctrine; no profiler baseline exists in-repo.
