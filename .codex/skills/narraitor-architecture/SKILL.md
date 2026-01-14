---
name: narraitor-architecture
description: Apply Narraitor repository architecture patterns, domain boundaries, and conventions when designing or changing features in this codebase (components, stores, API routes, AI integration, types, tests). Use for new code, refactors, reviews, or planning within Narraitor.
---

# Narraitor Architecture

## Place code in the right module
- Put routes and API handlers in `src/app/` and `src/app/api/` (Next.js 15 App Router).
- Put UI in `src/components/`, grouped by domain/feature; use `src/components/ui` for shadcn primitives and `src/components/shared` for cross-domain UI.
- Put state in `src/state/` with domain stores; use persistence helpers in `src/state/persistence.ts` when needed.
- Put types in `src/types/*.types.ts`; keep `src/types/index.ts` type-only (no runtime imports).
- Put hooks in `src/hooks/` and services in `src/services/` unless an existing `src/lib/*` module already owns the behavior.
- Put shared logic in `src/lib/` (AI, services, generators, utils) and `src/utils/` for general helpers already used.

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
- Avoid hardcoded colors; use Tailwind tokens or `hsl(var(--...))` variables.
- Prefer shadcn/ui components for form controls and primitives.

## Validate with tests and dev harnesses
- Add tests in `__tests__/` or `*.test.ts(x)`; add stories in `src/stories/`.
- Use `/dev/*` routes for interactive feature verification when relevant.

## References
- `resources/domain-boundaries.md`
- `resources/state-management-patterns.md`
- `resources/component-patterns.md`
