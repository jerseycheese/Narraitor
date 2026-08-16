---
title: Architecture Decisions
tags: [architecture, decisions, adr]
created: 2025-04-28
updated: 2026-08-01
---

# Architecture Decisions

These are the key architectural decisions behind Narraitor — why certain technologies and
patterns won out over the alternatives. The sections below are a narrative summary; the numbered
**Architecture Decision Records (ADRs)** capture individual decisions in depth.

## Decision Records (ADRs)

ADRs 001–008 were backfilled to document the inception-era foundation (reconstructed from the
codebase and git history); 009 onward were written as the decisions were made.

- [ADR-001: Next.js App Router + TypeScript](ADR-001-nextjs-app-router-typescript.md) — framework and language foundation
- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md) — no backend database; serverless AI proxy only
- [ADR-003: Zustand domain stores](ADR-003-zustand-state-management.md) — state management
- [ADR-004: IndexedDB persistence](ADR-004-indexeddb-persistence.md) — client-side storage over localStorage
- [ADR-005: Domain-driven structure](ADR-005-domain-driven-structure.md) — organize by domain, not file type
- [ADR-006: Gemini behind server-side API routes](ADR-006-gemini-server-side-api.md) — AI provider and key protection (key sourcing since moved to bring-your-own-key)
- [ADR-007: Tailwind + shadcn/ui styling](ADR-007-tailwind-shadcn-styling.md) — original styling foundation (**superseded by ADR-011**)
- [ADR-008: Testing & verification strategy](ADR-008-testing-and-verification-strategy.md) — TDD, Storybook-first, Playwright visual
- [ADR-009: Guided onboarding system](ADR-009-guided-onboarding-system.md)
- [ADR-010: Decision relevance simplification](ADR-010-decision-relevance-simplification.md)
- [ADR-011: Three design systems (DS1/DS2/DS3)](ADR-011-three-design-systems.md) — structural differentiation across themes (**superseded by ADR-013**)
- [ADR-012: Storybook as the single canon surface](ADR-012-storybook-single-canon-surface.md) — retires the `/dev/design-system*` showcase routes
- [ADR-013: Collapse to a single design system (DS3)](ADR-013-collapse-to-single-design-system-ds3.md) — greenfield collapse back to one system
- [ADR-014: Browser-local until a named trigger](ADR-014-browser-local-until-named-trigger.md) — extends ADR-002 with the conditions that would reopen it

## Frontend Architecture

**Next.js 15 App Router**: Server/client components and nested layouts give better performance
and organization than the old Pages Router, and the routing is cleaner. Runs on React 19.

**Domain-Driven Design**: Code is organized by business domain (World, Character, Narrative,
and so on) rather than by technical layer (components, hooks, utils). Related functionality
sits together, which makes things easier to find.

**Zustand State Management**: React Context came first but got messy fast with all the
re-renders. Zustand is lightweight and allows domain-specific stores that don't trip over each
other.

**TypeScript**: Full type safety with strict mode, because catching errors at compile time
beats debugging runtime crashes.

## Data & Styling

**IndexedDB Persistence**: World and character data gets complex, and game sessions need to
survive a browser restart. LocalStorage maxes out too quickly, so IndexedDB handles the
structured, larger datasets.

**Plain CSS with design tokens (no Tailwind)**: Styling runs on hand-written CSS driven by
design-token custom properties (`var(--color-surface)`, `var(--space-4)`, `var(--radius-md)`
and friends), with `clsx` composing semantic class names like `badge badge-success`. Tailwind
was removed — there's no `tailwindcss` dependency, no `tailwind.config.ts`, and no `@tailwind`
directives. The token approach is what let three structurally-different design systems restyle
the same markup by swapping CSS variables rather than rewriting utility classes — the app has
since collapsed to one, DS3 (see [ADR-013](ADR-013-collapse-to-single-design-system-ds3.md)), but
the token architecture still works the same way for light/dark mode. See the design-system docs
for how tokens and themes are organized.

**shadcn/ui structure, de-Tailwinded**: The component library started from shadcn/ui (built on
Radix UI primitives, so accessibility is handled properly), but the components were taken
through a "clean slate" pass that stripped out `cva` and the Tailwind utility classes in favor
of semantic CSS classes wired to the token system. The Radix accessibility foundation stays;
the styling moved to CSS.

**One Design System (DS3)**: One look stopped being enough once worlds got more varied, and
token-only theming kept reading as the same app in different paint. The answer was three
structurally different design systems — Drafting Table, Warm Earth, Mechanical Manuscript — each
with its own token file, switched via a `data-theme` attribute on `<html>` (see
[ADR-011](ADR-011-three-design-systems.md) for the structural-differentiation principle and how
the theme files, showcase pages, and provider fit together). That stayed true for a while; the app
later collapsed back to one system, Mechanical Manuscript (`data-theme="ds3"`), once the
three-way surface area stopped paying for itself (see
[ADR-013](ADR-013-collapse-to-single-design-system-ds3.md)).

## Development Practices

**Storybook-First Development**: Building components in isolation catches issues early and forces
thinking through all the states a component has to handle.

**Test-Driven Development**: Jest and React Testing Library, focused on what users actually
experience rather than implementation details. There's no point testing CSS classes when the
behavior is what matters.

**Verification canon**: Storybook is the single canon frontend surface ([ADR-012](ADR-012-storybook-single-canon-surface.md))
— when production drifts from Storybook, production is wrong. The `/dev/design-system{,-2,-3}`
showcase routes that used to hold this role were deleted along with the living style guide.
Feature work still flows from component isolation (Storybook) to integration (the remaining
`/dev/*` harnesses) to the full app.

## Product Decisions

**Single Player Focus**: The MVP is single-player to keep things simple and nail the core
narrative experience. Multiplayer adds a pile of complexity that isn't needed yet.

**300-Line File Limit**: It looks arbitrary, but it forces breaking things down. A file that's
getting too big is usually doing too much.

**Google Gemini AI**: Every Gemini call (via `@google/genai`) goes through a server-side API route,
with rate limiting and validation. Gemini gave the best balance of quality and reliability among
the providers that got tested. Since the bring-your-own-key work (#891/#892/#893) the key itself
comes from the player rather than the server: it's encrypted in the browser and attached per
request as the `x-provider-api-key` header, with `GEMINI_API_KEY` left as a dev and local-testing
fallback. See [ADR-006](ADR-006-gemini-server-side-api.md).

**Security-First API Design**: no key is baked into the client bundle and the browser never
reaches `googleapis.com` directly, requests get sanitized, and nothing sensitive is logged. The
player's own key is a deliberate exception to "nothing sensitive in the browser": it's encrypted
at rest and decrypted just-in-time per request, which keeps it out of the bundle and out of
storage in plaintext, but it is client-side by design under BYO-key.
