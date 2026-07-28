# Domain reference — catalogs

Snapshot of 2026-07-04 (develop @ 4bec88e6). Labels: known = read this session, observed = discovery-agent read. The source file is always the contract; these tables are for orientation.

## Stores (src/state/)

Persist keys verified by `grep -rh "name: '" src/state/*.ts` on 2026-07-04. Note the naming: most keys are `narraitor-<domain>-store`; `lore-store` is the unprefixed odd one out. Action names below are verified only where stated — read the store file before citing an action.

| Store file | Hook | Persist key | Notable state |
|---|---|---|---|
| worldStore.ts | useWorldStore | `narraitor-world-store` | worlds, currentWorldId, worldStates |
| characterStore.ts | useCharacterStore | `narraitor-character-store` | characters, currentCharacterId |
| narrativeStore.ts (+ .segments/.decisions/.endings/.persistence/.state/.types/.worldStateImpacts) | useNarrativeStore | `narraitor-narrative-store` (v1, custom Date serialization) | segments, sessionSegments, decisions, currentEnding, `_hasHydrated`, generation error state |
| sessionStore.ts | useSessionStore | `narraitor-session-store` | id, status, worldId, characterId, playerChoices, savedSessions, tutorialProgress |
| inventoryStore.ts (~1,100 lines, split pending #1415) | useInventoryStore | `narraitor-inventory-store` | items, characterInventories, imageGeneration state |
| journalStore.ts | useJournalStore | `narraitor-journal-store` | entries, sessionEntries (session wiring via SESSION_STARTED/ENDED) |
| loreStore.ts (+ 10 concern files) | useLoreStore | `lore-store` (v3 + migrate) | facts, factHistory, mergeAuditLog |
| npcStore.ts | useNPCStore | `narraitor-npc-store` | NPCs per world (WORLD_DELETED cascade) |
| goalStore.ts | useGoalStore | `narraitor-goal-store` | goals, activeGoalIds |
| navigationStore.ts | useNavigationStore | `narraitor-navigation-store` | nav/loading state |
| providerStore.ts | useProviderStore | `narraitor-provider-store` (encrypted keys) | providers, activeProviderId, validationStatus |
| aiContextStore / calibrationStore / continuityStore | use\* | NOT persisted (calibration/continuity say so in their headers) | AI context override, calibration, continuity guardrail state |

Event bus: `src/lib/state/storePubSub.ts` — `storeEvents.subscribe/subscribeOnce/emit`; events `world:deleted`, `character:deleted`, `session:fresh-start`, `session:started`, `session:ended`; wiring in `src/state/storeEventWiring.ts` (observed).

## API routes (src/app/api/, all verified known)

Narrative routes — request bodies DIFFER per route (read the handler before curling): `narrative/generate` (1024 tok) and `narrative/choices` (2048 tok) take `{prompt: string}` via `processGeminiTextRequest`; `narrative/ending` takes session/character/world ids + optional desiredTone/customPrompt; `narrative/summarize` takes `{content, ...}`; `story-checkpoint` and `validate-event-significance` have their own shapes.
Generation: `generate-world`, `generate-character`, `generate-portrait`, `generate-world-image`, `generate-item-image`, `generate-journal-image`, `generate-ending-image`.
AI meta: `ai/analyze-world`, `ai/validate-provider`.
Data assists: `inventory/categorize`, `inventory/check-similarity`, `lore/check-similarity`.
Utility: `delete-image`, `debug` (GET, dev).

## User-facing routes (observed)

`/` landing · `/welcome` · `/worlds` (+ `/worlds/create`, `/worlds/[id]`, `/worlds/[id]/edit`, `/worlds/[id]/play`, `/worlds/[id]/play/journal`) · `/characters` (+ create/[id]/edit) · `/play` · `/settings`, `/settings/providers` · `/about`, `/privacy`, `/terms` · `/dev/*` harnesses (~20, knip-exempt, non-canon).

## Key seams (known)

- `src/lib/ai/aiFetch.ts` — client fetch + provider-key header (`x-provider-api-key`, from `src/lib/ai/providerKeyHeader.ts`) + 120s CLIENT-side timeout (`AI_REQUEST_TIMEOUT_MS`).
- Two server-side Gemini paths (do not conflate): `narrative/generate` + `narrative/choices` go through `makeGeminiRequest` in `src/utils/apiHelpers.ts` — 30s default timeout, NO retries; other generators (summarize, ending, images, similarity) use `GeminiClient` (`src/lib/ai/geminiClient.ts`) — 3 retries with exponential backoff.
- `src/lib/ai/resolveApiKey.ts` — server: header → `GEMINI_API_KEY` env → null.
- `src/lib/ai/config.ts` — `gemini-2.5-flash`, `gemini-2.5-flash-image`, temperature 0.7, maxOutputTokens 2048, thinkingBudget 0.
- `src/lib/api/*` — component-facing services (worldApi, characterApi, image APIs) — the only sanctioned `/api` callers.
- `src/lib/utils/isPlaywrightEnv.ts` — automation gate (UA contains "Playwright" or `window.__PLAYWRIGHT__`).
- `src/lib/theme/` — ThemeProvider, `themeInitScript.ts` (FOUC prevention), themes/{_shared-tokens,ds3}.css (ADR-013 deleted ds1/ds2); localStorage `narraitor-color-scheme` only; sessionStorage `generated-world-data` (wizard handoff).
- IndexedDB: app state db `narraitor-state` / store `narraitor-store`; crypto keys db `narraitor-secure` / store `keys`.
- Feature flags: `src/lib/featureFlags.ts` — `BUFFERED_STREAMING` (env `NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING`), `PROGRESSIVE_DISCLOSURE` (default true).
