---
title: "ADR-006: Google Gemini behind server-side API routes"
tags: [architecture, decision, adr, ai, gemini, security]
created: 2025-04-28
updated: 2026-08-01
---

# ADR-006: Google Gemini behind server-side API routes

**Status**: Accepted (key sourcing superseded by the bring-your-own-key model, #891/#892/#893)
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of an inception-era decision (the AI provider and the
> server-side proxy pattern). Reconstructed from the codebase and git history.

> **Note (2026-08-01):** The server-side proxy decision below still holds, and every AI call still
> goes through a route under `src/app/api/`. What changed is where the key comes from. Since the
> bring-your-own-key work (#891/#892/#893), the player supplies their own Gemini key, it's
> encrypted in the browser (`src/state/providerStore.ts`), and `src/lib/ai/aiFetch.ts` attaches it
> per request as the `x-provider-api-key` header. Server-side, `src/lib/ai/resolveApiKey.ts` takes
> that header key first and only falls back to `GEMINI_API_KEY` when there isn't one, which makes
> the env key a dev and local-testing convenience rather than the architecture. Read the "What We
> Decided" section below as the proxy decision, not as a description of key handling.

## The Situation

The whole point of Narraitor is AI-generated narrative that adapts to a specific world and
character, so an AI provider is load-bearing, not optional. Two things had to be decided early:
which provider, and how the browser talks to it without leaking the API key.

The key question is the sharp one. The app is client-side-only
([ADR-002](ADR-002-client-side-only-architecture.md)), but an AI key embedded in client
JavaScript is trivially extractable — anyone could lift it and run up the bill. So there has to
be *some* server-side hop, even in an otherwise serverless app.

## What We Decided

Use **Google Gemini** (via the `@google/genai` SDK) as the AI provider, and put every AI call
**behind server-side Next.js API routes**. The key lives in `GEMINI_API_KEY` on the server only
(never `NEXT_PUBLIC_`). Client code calls same-origin routes under `src/app/api/` —
`narrative/generate`, `narrative/choices`, `generate-character`, the image-generation routes, and
so on — which attach the key and call Gemini server-side. The client never sees the key or a
`googleapis.com` URL.

The default text model is `gemini-2.5-flash` (`src/lib/ai/config.ts`); image generation uses a
Gemini image model. A shared route wrapper (`withAIRoute` in `src/utils/apiHelpers.ts`) guards all
AI routes with in-memory per-IP rate limiting (`src/utils/rateLimiter.ts`, 50/hr in production),
a 64KB request body size cap (HTTP 413), and a server-enforced max output token ceiling (4096).

## Why This Made Sense

The server-side proxy is non-negotiable for key protection — it's the one piece of backend the
app keeps precisely because there's no safe way to call a paid AI API straight from the browser.
Routing through `src/app/api/` also gives a natural place for validation, rate limiting, and
error normalization.

Gemini specifically gave a good balance of generation quality, cost, and a clean SDK at the
time, and the `flash` tier is fast and cheap enough for interactive, turn-by-turn narrative
where latency is felt directly.

### What Else We Considered

- **Calling the AI directly from the browser**: simplest, and a non-starter — it exposes the key.
- **OpenAI / Anthropic as the provider**: all viable; Gemini won on the quality/cost/latency
  balance for this use case. Provider-agnosticism is explicitly deferred (Epic #878) rather than
  built up front — the app ships Gemini-only and can add an abstraction later.
- **A standalone proxy service** instead of Next API routes: unnecessary, since Next already
  provides the server layer (ADR-001).

## What This Means Going Forward

### Upsides

- All AI traffic is same-origin and server-mediated; the browser never calls `googleapis.com`.
- The server env key never reaches the client at all. (Under BYO-key the player's own key does
  live in the browser — see the 2026-08-01 note above and the Downsides below.)
- The API routes are a single choke point for validation, rate limiting, and error handling.
- `gemini-2.5-flash` keeps interactive generation fast and inexpensive.

### Downsides

- The integration is currently Gemini-shaped. Swapping providers means building the abstraction
  layer that #878 defers — prompt formats and response parsing assume Gemini today.
- The rate limiter is in-memory per instance, so it's best-effort under horizontal scaling
  rather than a globally accurate quota.
- BYO-key moves part of the threat model into the browser. The player's key is encrypted at rest
  (`src/lib/storage/encryption.ts`), decrypted just-in-time, and held in a closure for the
  duration of one request, but it is plaintext in client JavaScript at that moment. It's out of
  the static bundle and never sent to Google from the browser; it is not out of reach of script
  running in the page.

## Implementation Notes

- AI code lives in `src/lib/ai/` (`geminiClient.ts`, `defaultGeminiClient.ts`); model config in
  `src/lib/ai/config.ts`. Server routes are under `src/app/api/`.
- Never expose `GEMINI_API_KEY` to the client; never add a `NEXT_PUBLIC_` AI key.
- Response parsing/validation goes through `aiResponseParser` (`src/lib/utils/aiResponseParser.ts`);
  see the [prompt context API](../technical-guides/prompt-context-api.md) and
  [AI systems](../features/ai-systems.md) docs.

## Related Decisions

- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md) — the proxy is the one exception
- [ADR-001: Next.js App Router](ADR-001-nextjs-app-router-typescript.md) — provides the server routes
- [Security Overview](../security/README.md)
