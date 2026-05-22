---
title: "ADR-001: Next.js App Router + TypeScript as the foundation"
tags: [architecture, decision, adr, nextjs, typescript]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-001: Next.js App Router + TypeScript as the foundation

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. This is a retroactive record of a decision made at project inception
> (the initial commit, `9865d840`, set up Next.js + TypeScript on 2025-04-28). It's
> reconstructed from the codebase and git history, so the "alternatives considered" reflect the
> reasoning the stack implies rather than a contemporaneous debate.

## The Situation

Narraitor is a from-scratch rebuild of an earlier project (BootHillGM). The goal was a
solo-play, AI-driven narrative RPG that runs in the browser, persists locally, and talks to an
AI provider for story generation. The first decision was the obvious one nobody writes down:
what framework and language is the whole thing built on.

The app needed server-side request handling for one specific reason — the AI API key can't ship
to the browser — but the bulk of the experience is client-side and stateful. So the framework
had to do double duty: a good React client app, plus a thin server layer for proxying AI calls.

## What We Decided

Build on **Next.js 15 with the App Router**, in **TypeScript with strict mode**, on React 19.

The App Router gives co-located layouts, server components, and file-based routing for both
pages (`src/app/**/page.tsx`) and the server-side API routes (`src/app/api/**/route.ts`) that
proxy AI calls. TypeScript is strict throughout, with a `@/*` path alias mapping to `src/`.

## Why This Made Sense

Next.js covers both halves of the app in one toolchain: a capable React client and a
serverless-style API layer for the AI proxy, without standing up a separate backend service.
The App Router (over the older Pages Router) was the forward-looking choice — nested layouts cut
duplication, and server components keep the initial payload sane.

TypeScript strict mode earns its keep on a project this stateful. Worlds, characters, narrative
segments, and AI response shapes are all complex and interrelated; catching mismatches at
compile time beats debugging them at runtime, and the types double as documentation.

### What Else We Considered

- **Vite + React SPA with a separate API service**: lighter client tooling, but it splits the
  app into two deployables and reintroduces the "where does the AI proxy live" problem that
  Next.js solves for free.
- **Remix**: a strong App-Router-style alternative, but Next.js had the larger ecosystem and the
  team already knew it.
- **Pages Router instead of App Router**: more familiar at the time, but the App Router's
  layouts and server components were the direction the framework was clearly heading.
- **Plain JavaScript**: rejected immediately — the domain is too type-heavy to go untyped.

## What This Means Going Forward

### Upsides

- One framework, one deploy target for both the client app and the AI proxy routes.
- Strict TypeScript makes the frequent refactors (this codebase refactors a lot) much safer.
- The `/dev/*` route convention gives free, real-data component harnesses.

### Downsides

- The App Router was still maturing when adopted, so some patterns (Storybook + App Router
  router mocking, for one) needed workarounds — see the now-superseded
  [mock-components-for-storybook ADR](mock-components-for-storybook.md).
- Server/client component boundaries are an ongoing source of "use client" papercuts.

## Implementation Notes

- Pages live in `src/app/**/page.tsx`; server-only AI proxying lives in `src/app/api/**/route.ts`.
- Import via the `@/` alias (`@/state/worldStore`), not relative `../../..` chains.
- Keep server-only code (anything touching the AI key) inside API routes, never in client components.

## Related Decisions

- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md) — why the server layer is intentionally thin
- [ADR-006: Gemini behind server-side API routes](ADR-006-gemini-server-side-api.md) — the one job the server layer does
- [Repository Structure](repository-structure.md) — the resulting directory layout
