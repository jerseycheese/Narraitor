---
title: "ADR-005: Domain-driven code organization"
tags: [architecture, decision, adr, structure, domains]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-005: Domain-driven code organization

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of an inception-era decision, reconstructed from the
> codebase and git history.

## The Situation

The app spans several distinct problem areas — world building, character creation, narrative
generation, journaling, lore, inventory — and each is sizable on its own. How the code gets
organized shapes how easy it is to find related pieces and how cleanly the areas stay separated.

The common default is to organize by technical layer: all components in one folder, all stores
in another, all types in a third. That scatters any single feature across the tree, so working
on character creation means hopping between `components/`, `state/`, `types/`, and `hooks/` with
no locality.

## What We Decided

Organize **by domain, not by file type**. The major areas each own their slice across the layers
— `worldStore`/`characterStore`/`narrativeStore`/etc. in `src/state/`, matching domain folders
under `src/components/` (`world/`, `character/`, `Narrative/`, plus feature components like
`GameSession/` and `WorldCreationWizard/`), domain helpers under `src/lib/` (`lore/`,
`inventory/`, `narrative/`, `ai/`, `promptTemplates/`), and domain-specific types in
`src/types/`. The dependency boundaries between domains are explicit enough that they're checked
by dependency-cruiser.

## Why This Made Sense

Grouping by domain keeps related code together: a change to inventory touches the inventory
store, inventory components, and inventory types, and they're all in predictable, adjacent
places. It also makes the domain boundaries real rather than aspirational — you can see (and
lint) when one domain reaches into another's internals.

For a solo developer context-switching between areas, locality is the main win: less hunting,
fewer "where does this live" decisions, and a structure that mirrors how the product is actually
thought about.

### What Else We Considered

- **Layer-first organization** (`components/`, `hooks/`, `utils/`, `stores/` each holding
  everything): the conventional default, rejected because it scatters every feature and offers
  no domain boundaries to enforce.
- **A strict feature-folder/module structure** (each domain a fully self-contained module with
  its own public API): more isolation, but heavier ceremony than a solo app needs, and it fights
  Next.js's `src/app` routing conventions.

## What This Means Going Forward

### Upsides

- Related code is co-located, which speeds up the frequent context switches.
- Domain boundaries are explicit and machine-checkable via dependency-cruiser.
- New contributors (and agents) can find a feature's pieces by guessing the domain.

### Downsides

- Genuinely cross-cutting concerns (shared UI, utilities) need their own homes (`components/ui`,
  `components/shared`, `lib/utils`), and the line between "shared" and "domain-owned" needs
  occasional judgment.
- Casing is mixed in practice — feature components use PascalCase folders (`GameSession/`) while
  broader groupings are lowercase (`world/`, `shared/`) — which is a small wart.

## Implementation Notes

- Put new code with its domain, not in a generic layer bucket. Truly shared pieces go in
  `components/ui`, `components/shared`, or `lib/utils`.
- Architecture boundaries are enforced by `.dependency-cruiser.cjs` (`npm run deps:validate`);
  see the [dependency analysis guide](dependency-analysis.md).
- The full tree is documented in [Repository Structure](repository-structure.md).

## Related Decisions

- [ADR-003: Zustand domain stores](ADR-003-zustand-state-management.md) — state mirrors the same domains
- [Repository Structure](repository-structure.md)
- [Domain Integration](domain-integration-protocols.md)
