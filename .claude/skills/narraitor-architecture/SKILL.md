---
name: narraitor-architecture
description: >
  Automatically invoke when creating new components, stores, API routes, or planning a feature in Narraitor.
  Triggers on: new file creation under src/, architecture questions, feature design discussions, or any structural decision.
  Applies domain boundaries, naming conventions, state management patterns, and AI integration conventions.
  Do NOT wait for user to ask — invoke before writing new structural code.
---

## When to invoke (auto-trigger)

Invoke automatically whenever:
- A new component, store, API route, or type file is about to be created
- The user asks how to structure, design, or plan a feature in this repo
- A refactor touches domain boundaries or moves code between domains

Do NOT invoke for: small bug fixes, copy changes, config tweaks, or test-only changes.

# Narraitor Architecture

> **Migration in progress**: Component organization and styling patterns are actively migrating to a design system. Verify component structure and styling conventions against current code rather than relying solely on this skill.

## Place code in the right module
- Put routes and API handlers in `src/app/` and `src/app/api/` (Next.js 15 App Router).
- Put UI in `src/components/`, grouped by domain/feature; use `src/components/shared` for cross-domain UI.
- Put state in `src/state/` with domain stores; use persistence helpers in `src/state/persistence.ts` when needed.
- Put types in `src/types/*.types.ts`; keep `src/types/index.ts` type-only (no runtime imports).
- Put hooks in `src/hooks/` and services in `src/services/` unless an existing `src/lib/*` module already owns the behavior.
- Put shared logic and domain services in `src/lib/` (AI, services, generators, utils, and domain-specific modules like `narrative/`, `lore/`, `inventory/`, `world/`, `journal/`, `tutorial/`). Use `src/utils/` for general helpers already used there.

## Enforce domain boundaries
- Keep domain logic inside its domain folders and store; coordinate cross-domain behavior at pages or feature orchestrators.
- Share data across domains via typed IDs/DTOs instead of direct store or component imports.
- Follow the domain names in `src/types/` and existing `src/state/*Store.ts` files.

## Follow state patterns
- Use the `CrudStore` type when building standard CRUD stores.
- Use `persist` + `createIndexedDBStorage` for stores that must survive reloads.
- Store only source-of-truth data; compute derived values in selectors.

## Keep AI server-side
- Route AI calls through API routes and `src/lib/ai` (uses `@google/genai`).
- Never expose API keys or AI clients in client components.

## Use design tokens
- Avoid hardcoded colors; use `var(--color-*)` design tokens directly (already complete colors, never wrap in `hsl()`). Status/domain tokens (`--success`, `--warning`, `--ending-*`, `--alignment-*`, etc.) are raw HSL channels and DO need `hsl(var(--success))` — see `public_docs/design-system/design-tokens.md` for the full split.
- Style components with plain CSS + design tokens (removed: Tailwind, shadcn/ui, cva); use `clsx` for conditional classes.

## Validate with tests and dev harnesses
- Add tests in `__tests__/` or `*.test.ts(x)`; add stories in `src/stories/`.
- Use `/dev/*` routes for interactive feature verification when relevant.

## Target the right branch
- Branch off `develop` and target `develop` in PRs. Never push to `main` or open a PR against it.
- `main` holds tagged releases only; the maintainer fast-forwards it manually following [public_docs/development/release-process.md](public_docs/development/release-process.md).
- Release notes live in `RELEASES.md` at the repo root.

## References
- `resources/domain-boundaries.md`
- `resources/state-management-patterns.md`
- `resources/component-patterns.md`
