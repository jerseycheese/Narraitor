---
title: "ADR-008: Testing and verification strategy"
tags: [architecture, decision, adr, testing, tdd, storybook, playwright]
created: 2025-04-28
updated: 2026-07-21
---

# ADR-008: Testing and verification strategy

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of the inception-era testing approach (Jest, RTL,
> Storybook, and Playwright were all set up in the initial commit). Reconstructed from the
> codebase and git history; later additions (Playwright visual regression, mutation testing) are
> noted as such.

## The Situation

Narraitor is heavily stateful and AI-driven, which makes it easy to break in non-obvious ways: a
store change ripples across domains, a CSS change quietly breaks a layout, an AI-response parser
silently mishandles a new shape. A solo developer can't manually re-check everything every time,
so the project needed a testing approach that catches regressions cheaply and builds confidence
to refactor aggressively (which this codebase does constantly).

## What We Decided

A layered strategy, set up from the start and extended over time:

- **Jest + React Testing Library** for unit and integration tests — the bulk of coverage,
  focused on behavior (what the user sees and does) over implementation details.
- **Storybook-first component development** — build components in isolation, with stories that
  exercise their states, before wiring them into the app.
- **Playwright** for end-to-end and, later, **visual-regression** tests (`tests/visual/`,
  self-seeding specs) that screenshot routes across the current design surface. Since ADR-013,
  that means DS3 across the relevant light/dark color modes, not a DS1/DS2/DS3 matrix.
- **A three-stage verification habit**: Storybook (component isolation), then the `/dev/*` test
  harnesses (integration with real data), then the full app.
- Later additions: **mutation testing** (Stryker) on the state/storage/narrative layers, and
  CI quality gates (knip, CSS audit, dependency-cruiser) covered in the
  [PR & testing workflow](../development/workflows/pr-and-testing-workflow.md).

## Why This Made Sense

Testing behavior with RTL keeps tests resilient to refactors — and this codebase refactors a lot,
so brittle implementation-coupled tests would be a constant tax. Storybook-first forces thinking
through a component's states up front and gives a place to eyeball them without booting the whole
app. Playwright visual regression catches the class of bug unit tests can't see at all: layout
and styling breakage, which became critical once three design systems multiplied the surface.

The three-stage habit exists because each layer catches different failures — isolation catches
component bugs, the harness catches integration bugs, the app catches the rest — and finding a
bug earlier is cheaper.

### What Else We Considered

- **Vitest instead of Jest**: a faster, modern runner; in fact a Vitest stack briefly existed and
  was later removed as redundant. Jest + ts-jest remained the single canonical runner.
- **Cypress instead of Playwright**: capable, but Playwright's screenshot/visual-comparison story
  and multi-project config fit the design-system matrix better.
- **High-coverage-number targets**: deliberately not chased. The aim is meaningful tests on
  critical paths (KISS, MVP-level coverage), not a coverage percentage for its own sake.

## What This Means Going Forward

### Upsides

- Behavior-focused tests make the frequent refactors safe.
- Visual regression guards the design system, where most "looks broken" bugs actually live.
- Mutation testing keeps the highest-risk layers (state/storage/narrative) honestly covered.

### Downsides

- Visual baselines are maintenance: intentional UI changes mean regenerating snapshots, and
  DS3 still needs the relevant light/dark and viewport coverage.
- Storybook-first and three-stage verification add up-front effort per component — accepted as
  worth it for the regression protection.

## Implementation Notes

- Run units with `npm run test` (Jest), visual with `npm run test:visual` (Playwright,
  self-seeding via `tests/visual/utils/seedTestData.ts`), mutation with the Stryker config when
  touching state/storage/narrative.
- New in-scope components get a Storybook story (enforced by `npm run lint:ds-canon`);
  verify visual changes in Storybook (the canon — ADR-012), then the app.
- Don't rig tests to pass, and don't add Vitest back — Jest is the one runner.
- See the [Testing Guide](../development/testing-guide.md) and
  [PR & testing workflow](../development/workflows/pr-and-testing-workflow.md).

## Related Decisions

- [ADR-011: Three design systems](ADR-011-three-design-systems.md) — why visual regression matters so much
- [ADR-005: Domain-driven structure](ADR-005-domain-driven-structure.md)
