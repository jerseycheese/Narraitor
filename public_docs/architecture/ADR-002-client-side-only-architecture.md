---
title: "ADR-002: Client-side-only architecture (no backend database)"
tags: [architecture, decision, adr, persistence, serverless]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-002: Client-side-only architecture (no backend database)

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of an inception-era decision, reconstructed from the
> codebase and git history.

> **Note (2026-08-15):** Everything below still stands. What it was missing was a reopen condition,
> since "an accepted trade-off for now" never said for how long.
> [ADR-014](ADR-014-browser-local-until-named-trigger.md) names the three things that would reopen
> this decision, and until one of them happens, accounts and server persistence stay off the
> roadmap.

## The Situation

Narraitor is a single-player tool built primarily for personal use. There's no multi-user
account system, no shared data, and no server-side game state to coordinate. The only thing that
genuinely *has* to run on a server is the AI call, because the provider API key can't be exposed
to the browser.

The question was how much backend to build. A traditional web app reaches for a database, an
auth layer, and a set of CRUD endpoints almost reflexively. For a solo narrative app, most of
that is overhead with no payoff.

## What We Decided

Keep it **client-side-only**. All user data — worlds, characters, narrative, lore, inventory,
journal — lives in the browser (see [ADR-004](ADR-004-indexeddb-persistence.md) for the storage
layer). The only server-side code is a set of **Next.js API routes that proxy AI and image
generation** (`src/app/api/**`). There's no application database, no user accounts, and no
session backend.

Every API route under `src/app/api/` is an AI/generation or AI-adjacent data-processing proxy
(`narrative/generate`, `generate-character`, `inventory/categorize`, `inventory/check-similarity`,
and so on). None of them read or write a server-side store.

## Why This Made Sense

The product is solo and local-first, so the data has exactly one owner sitting at exactly one
browser. Putting that data in a server database would add infrastructure, deployment cost, and a
sync problem to solve, all to support a use case that doesn't exist. Client-side storage means
the app works offline for everything except AI generation, and there's no backend to operate or
secure beyond the thin proxy.

The proxy exists only because of the API key. That's a real constraint (see ADR-006), but it's a
small, stateless surface — request in, AI response out — not a backend in the usual sense.

### What Else We Considered

- **Full backend with a database (Postgres/Supabase) and auth**: the conventional architecture.
  Rejected as overkill for a single-user, local-first tool — it adds hosting, migrations, and an
  auth surface for zero product benefit today.
- **Serverless functions + a hosted KV/document store**: lighter than a full backend, but still
  introduces a remote data store and the sync questions that come with it.
- **Pure static site, AI called directly from the browser**: simplest, but it would leak the API
  key to the client, which is a non-starter.

## What This Means Going Forward

### Upsides

- Almost nothing to operate: a static-ish Next.js app plus stateless AI proxy routes.
- The app keeps working offline for browsing and editing; only generation needs the network.
- No user-data-at-rest on a server means a much smaller privacy and security surface.

### Downsides

- Data is bound to one browser. No cross-device sync, no cloud backup — losing the browser
  profile loses the saves. That's an accepted trade-off for now (see the storage-resilience work
  for how the app guards against accidental loss).
- Anything genuinely multi-user (shared worlds, accounts) would require revisiting this from the
  ground up. It's explicitly out of scope.

## Implementation Notes

- User data goes through the Zustand stores and IndexedDB — never to a server.
- API routes under `src/app/api/` should stay stateless AI/generation proxies. If something
  wants to persist server-side state, that's a signal to reopen this ADR, not to quietly add a
  database.

## Related Decisions

- [ADR-004: IndexedDB for client-side persistence](ADR-004-indexeddb-persistence.md)
- [ADR-006: Gemini behind server-side API routes](ADR-006-gemini-server-side-api.md)
- [ADR-003: Zustand domain stores](ADR-003-zustand-state-management.md)
