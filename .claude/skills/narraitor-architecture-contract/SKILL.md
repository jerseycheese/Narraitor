---
name: narraitor-architecture-contract
description: The load-bearing architecture invariants of Narraitor - domain boundaries, Zustand store contracts, the event bus, persistence rules, Next.js 15 server/client boundaries, and what may never be bypassed. Use before changing a store's shape, adding cross-domain imports, touching src/lib/api or src/lib/ai seams, moving logic between server and client, or whenever deps:validate / skott / boundary questions come up.
---

# Narraitor architecture contract

## 1. Purpose
State the invariants that keep this codebase coherent, and the blast-radius checks required before touching them. The sibling `narraitor-architecture` skill covers authoring conventions (naming, file placement); THIS skill covers what must remain true.

## 2. When to use
Store shape changes; new imports that cross domain folders; anything touching `src/lib/api/`, `src/lib/ai/`, `src/state/persistence.ts`, or `storeEventWiring`; server/client component decisions; `deps:validate`/`skott:check` failures.

## 3. When not to use
- Greenfield component/store authoring → `narraitor-architecture` first (conventions), then return here for the invariant checklist.
- Pure styling → design-token rules (`style-port`, stylelint).

## 4. Inputs required
The intended diff (files + shape changes), and the output of `npm run deps:validate` on your branch if imports moved.

## 5. Procedure — the invariants

**I1. One store per domain; stores own their data.** All app data lives in `src/state/*Store.ts`, mutated only through the store's own actions (CRUD-style). No component or foreign store writes another store's slice directly.

**I2. Cross-store effects go through the event bus.** `src/lib/state/storePubSub.ts` events (`WORLD_DELETED`, `CHARACTER_DELETED`, `SESSION_FRESH_START`, `SESSION_STARTED`, `SESSION_ENDED`) wired in `src/state/storeEventWiring.ts`. The bus exists to break a circular-import constraint for cascade deletes — it is deliberate (do NOT "simplify" it away; see failure-archaeology). Deleting a parent entity must cascade via an event, never via direct foreign-store calls.

**I3. Static imports only.** No dynamic `require`/`eval` store access (eradicated in #1206). dependency-cruiser + skott guard the graph; the cycle budget is 6 (`.skott-baseline.json`).

**I4. Components reach the server through `src/lib/api/` services** (enforced by dependency-cruiser since #1508), which use `aiFetch` internally for the BYO-key header. No raw `fetch('/api/…')` in components.

**I5. AI logic lives in `src/lib/ai/`; prompts live in the template registry** (`src/lib/promptTemplates/`). Routes are thin wrappers (see `src/app/api/narrative/generate/route.ts` — ~10 lines delegating to `processGeminiTextRequest`). No prompt strings inlined in routes/components.

**I6. Persistence is survivable.** Most stores persist via `createIndexedDBStorage()` (`src/state/persistence.ts`) — exceptions exist (aiContextStore, calibrationStore, continuityStore are deliberately unpersisted); check the store's persist config before assuming. A persisted shape is a public contract with every existing player browser: shape changes require bumping `version` + `migrate` in the persist config (loreStore is at v3 — use it as the pattern) and a hard-refresh test against pre-change data.

**I7. Server/client split.** API routes and `resolveApiKey` are server-only; stores, `aiFetch`, and anything touching `window`/IndexedDB are client-only. A module imported by both must be isomorphic. `'use client'` components render before hydration completes — gate store-dependent UI on hydration where mismatch is possible.

**I8. No wrapper-service layer.** Components use stores + lib services directly (ExportService was removed on purpose). Don't reintroduce pass-through service classes.

**I9. Styling through tokens.** Plain CSS + `var(--token)` + `clsx`. Three design systems (ds1/ds2/ds3) differ structurally by design (ADR-011); Storybook is the canon surface (ADR-012).

**May not be bypassed, ever:** stylelint color rules, `deps:validate`, `knip`, `skott:check`, `lint:ds-canon`, the persist `migrate` requirement, and the change-control evidence bar. Re-baselining any of these is an owner-visible decision with a written justification, not a fix.

**Blast-radius checklist for store-shape changes:**
```text
1. grep every selector/consumer of the changed fields (components, hooks, services, tests).
2. persist config: version bumped? migrate written? old-shape blob tested via hard refresh?
3. e2e seeding helpers + Storybook withStores seeds updated?
4. events: does the change alter what cascade subscribers expect?
5. npm run deps:validate && npm test green.
```

## 6. Evidence required
`deps:validate` output for boundary claims; the blast-radius checklist filled in for shape changes; a hard-refresh persistence test described (what old data, what happened).

## 7. Output artifact
The completed checklist inline in the PR description or work log — reviewers should see the radius, not discover it.

## 8. Common traps
- Bad behavior this prevents: renaming a store field, shipping green unit tests (they seed the new shape), and silently corrupting every existing player's IndexedDB on next load because no `migrate` was written.
- Known weak points (open, don't "discover" them again): `inventoryStore.ts` is a ~1,100-line god-file (#1415); dual accent token drift `--primary` vs `--color-*` (#1474). Improvements there are welcome but are scoped issues, not drive-by refactors.
- `.dependency-cruiser-known-violations.json` is grandfathered debt, not permission — never add to it to make a new violation pass.

## 9. Related skills
`narraitor-architecture` (authoring conventions — run it before writing new structural code) · `narraitor-domain-reference` (what the domains mean) · `narraitor-change-control` (re-baseline rules) · `narraitor-failure-archaeology` (why the bus/pins exist).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `npm run deps:validate && npm run skott:check` (boundary + cycle state)
- `grep -n "version\|migrate" src/state/loreStore.ts | head` (migrate pattern still current)
- `grep -rn "StoreEventTypes" src/lib/state/storePubSub.ts` (event inventory)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Which stores besides loreStore carry persist `version`/`migrate` was not enumerated store-by-store — check the specific store before editing it.
- The exact dependency-cruiser rule set was summarized from config, not exercised against a violation this session.
