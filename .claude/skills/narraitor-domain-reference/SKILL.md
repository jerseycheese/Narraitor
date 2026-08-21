---
name: narraitor-domain-reference
description: Applied domain knowledge a mid-level engineer lacks for Narraitor - the world/character/narrative/session data model, Zustand store and persistence conventions, Next.js 15 App Router pitfalls, streaming/latency realities of Gemini, and the single-design-system (ds3) theming model. Use when reasoning about how domains relate, what a store field means, why hydration/persistence behaves oddly, or how AI-provider quirks shape the code.
---

# Narraitor domain reference

## 1. Purpose
The project-specific mental model: what the domains mean, how data flows, and the platform quirks that shape the code. Catalog detail (per-store tables, route list) lives in [reference.md](reference.md).

## 2. When to use
Reasoning about domain relationships; interpreting store fields; explaining behavior to someone new; checking assumptions before a design.

## 3. When not to use
- Enforcing invariants → `narraitor-architecture-contract`. Authoring conventions → `narraitor-architecture`. Orientation → `narraitor-repo-orientation`.

## 4. Inputs required
None; pair with the specific source files for anything you'll assert.

## 5. Procedure — the mental model

**The domain graph.** A **World** defines the rules of fiction: theme/genre, attributes, skills, tone settings. **Characters** belong to a world and instantiate its attributes/skills. A **Session** binds one world + one character to a play run. The **Narrative** domain accumulates segments (AI prose) and decisions (player choices) per session. **Journal**, **Inventory**, **Lore** (extracted world facts with dedup/merge machinery), **NPCs**, and **Goals** hang off world/character/session ids. Deleting a world cascades to characters, NPCs, goals, lore via `WORLD_DELETED` events — referential integrity is event-driven, not foreign-keyed.

**State conventions.** One Zustand store per domain (`src/state/`), CRUD-style actions, entity maps keyed by `EntityID`. Most stores persist through IndexedDB (db `narraitor-state`, object store `narraitor-store`) via the resilient storage middleware — but NOT all (aiContextStore, calibrationStore, continuityStore are deliberately unpersisted); the provider store holds ENCRYPTED provider keys (crypto material in separate db `narraitor-secure`). Persist keys are mostly `narraitor-<domain>-store` with `lore-store` as the unprefixed odd one out — always read the store file for the exact key, never guess. Hydration is async: `_hasHydrated`-style flags exist where components must wait.

**Next.js 15 App Router pitfalls, as they bite here:**
- Server components can't touch stores/`window`/IndexedDB; `'use client'` components still render once before hydration completes — store-dependent UI needs hydration gating or you get mismatch warnings (narrativeStore's custom Date serialization exists for exactly this).
- API routes are the ONLY server-side compute (no database — the "backend" is stateless request→Gemini→response).
- Route handlers are thin, but bodies differ per route: `narrative/generate` and `narrative/choices` take `{prompt: string}` via `processGeminiTextRequest` (`src/utils/apiHelpers.ts`); ending/summarize/checkpoint/significance have their own contracts — read the handler before assuming.

**AI-provider reality (why the code looks like this):**
- BYO-key: player's Gemini key, encrypted client-side, sent per-request via header; `resolveApiKey` falls back to `GEMINI_API_KEY` env (dev). No server key storage.
- Latency: full narrative turns take seconds (prose pop-in after 5–8s is open UX debt, #1476). Timeouts are layered: `aiFetch` caps at 120s client-side; generate/choices use `makeGeminiRequest` server-side (30s, no retries); the other generators use `GeminiClient` (3 retries + backoff).
- Output is untrusted: dedicated parse/normalize layers (`narrativeGenerator.response.parse.ts`, `parseJSON.ts`) exist because malformed/partial JSON is NORMAL, not exceptional. Never bypass them with a raw `JSON.parse`.
- Tone settings flow into both prompts and per-request safety settings (`getSafetySettingsFromPrompt`); content rating is a player-facing feature, not boilerplate.
- Nothing budgets the assembled prompt. Components are bounded where they're built (the caller slices the segment window, lore caps at 20 facts, inventory trims to a `tokenLimit`); `src/lib/promptContext/promptCalibration.ts` and `src/lib/ai/narrativeGenerator.calibration.ts` only measure what a request weighed, for the DevTools panel. Context is a spend you watch, not one anything caps.

**Theming model.** ONE design system: ds3 "mechanical manuscript" (ADR-013 superseded ADR-011 and deleted ds1 "drafting table" and ds2 "warm earth"). It is not switchable — `data-theme="ds3"` is hardcoded on `<html>` in `src/app/layout.tsx`, and tokens live in `src/lib/theme/themes/{ds3,_shared-tokens}.css`. The only remaining axis is light/dark, selected by `:root.dark`. `.app-surface-*` rules style headings BY TAG, so changing an h2→h3 shifts sizes and visual baselines. A component is not theme-done until seen in both color schemes.

**Tutorial system.** react-joyride, pinned prerelease (see failure-archaeology E4); tours anchor to real DOM — renames/moves of anchor elements silently break tours; the tutorials Playwright project exists to catch that.

## 6. Evidence required
Any field/route/key you assert: read the source file first (reference.md rows carry the file paths).

## 7. Output artifact
Correct reasoning; when explaining to others, cite the source paths not this skill.

## 8. Common traps
- Bad behavior this prevents: treating sessions as server entities and designing a "load my save from the cloud" fix — there is no server persistence; saves live in the player's browser, full stop (clearing site data IS losing the save).
- Assuming store persist keys from the store's filename.
- Writing `JSON.parse(response.text)` on Gemini output.
- Judging theme work in one color scheme only (check light AND dark).

## 9. Related skills
`narraitor-architecture-contract` (invariants) · `narraitor-repo-orientation` (map) · `narraitor-ai-quality-discipline` (behavior evaluation) · `narraitor-failure-archaeology` (why the quirks exist).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `grep -rn "name: '" src/state/*.ts | grep -i store | head -20` (persist keys)
- `grep -n "StoreEventTypes" src/lib/state/storePubSub.ts` (event inventory)
- `grep -n "gemini-" src/lib/ai/config.ts`

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Per-store field lists in reference.md are representative, not exhaustive — the store file is always the contract.
- The `_hasHydrated` flag pattern was verified on narrativeStore; other stores may gate differently.
