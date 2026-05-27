---
title: "Game Session"
type: architecture
category: gameplay
tags: [game-session, state-machine, session-store, accessibility]
created: 2026-05-26
updated: 2026-05-26
---

# Game Session

`GameSession` is the top-level component that owns a play session for a single world. Everything you see when you click "Play" on a world — loading, resume prompts, the active manuscript shell, error recovery — lives behind this one component.

## What it actually does

The component is small (~400 lines) but it sits at a junction where a lot of things meet:

- The **session store** holds the canonical state (status, current scene, player choices, errors, saved sessions).
- The **world store** answers "does this world exist?"
- The **character store** answers "is there a character for this world?"
- The **narrative store** holds the segments tied to a session ID so resumes don't blow away in-flight narrative.

`GameSession` reads from all of them via `useGameSessionState` (the heavy-lifting hook), then renders one of a handful of branches based on what it sees.

## Render branches (the state machine)

These are the branches you actually hit in the wild. Each is mutually exclusive — the component returns early.

| Branch | When | What renders |
|--------|------|--------------|
| **SSR fallback** | `!isClient` (first render only) | `<GameSessionLoading />` |
| **World not found** | `worldExists === false` | `ErrorDisplay` (variant=section) with retry/dismiss |
| **Resume prompt** | `status === 'initializing'`, no live session, `savedSession` exists | `<GameSessionResume />` |
| **No characters** | `status === 'initializing'`, no characters for the world | "Create Character" CTA |
| **Start CTA** | `status === 'initializing'`, character available | "Start Session" button |
| **Error** | `error` or `sessionState.error` is non-null | `<GameSessionError />` |
| **Active / paused / loading** | `status` ∈ {active, paused, loading} | `<ActiveGameSession />` |
| **Unknown** | everything else | a fallback `<div>` that names the unrecognized state |

A few things worth knowing about how the branches interact:

- `loading` status is mapped to `active` when rendering `ActiveGameSession`. The active shell shows its own coordinated skeleton — early returns on `loading` used to cause spinner lockups during fresh-session initialization, so the gate was loosened.
- The resume branch only fires when there's no live `sessionState.id` and a `savedSession` is present. If `?autoResume=true` is in the URL, the component skips the prompt and calls `handleResumeSession()` directly.
- World-not-found beats everything else once the world store has confirmed the absence — even an in-flight error is dropped in favor of the explicit "this world doesn't exist" message.

## GameSession ↔ SessionStore

`GameSession` is mostly a *consumer* of the session store. It reads `id`, `status`, `currentSceneId`, `playerChoices`, `error`, and `savedSessions`. Writes go through the actions the store exposes:

- `initializeSession(worldId, characterId, onSessionStart)` — kicked off by `startSession` (Start button) and `handleRetry` (retry after error).
- `endSession()` — called automatically on unmount in production (skipped in dev to survive Fast Refresh).
- `selectChoice(choiceId)` — wired to `handleSelectChoice` and passed down to `ActiveGameSession` as `onChoiceSelected`.
- `pauseSession()` / `resumeSession()` — surfaced by `ActiveGameSession`'s controls, not by `GameSession` itself.
- `setSessionId(id)` — `GameSession` calls this whenever it computes a new stable session ID, which keeps the store in sync with whichever session ID the UI is showing.

The component derives a `stableSessionId` from a four-priority chain so the ID stays the same across re-renders:

1. `disableAutoResume` set → use a freshly generated session ID (test/dev harness).
2. `sessionState.id` if the store already has one.
3. `useSessionStore.getState().id` if the store has an ID for this world.
4. `savedSession.id` if we're about to resume.
5. Any existing narrative segments belonging to this world.
6. A new generated ID as last resort.

On every change to that derived ID, an effect calls `setSessionId(stableSessionId)` and clears stale segments via `clearSessionSegments` if this is a brand new session.

## Accessibility

`GameSession` does two accessibility things directly (the active manuscript shell does the rest):

- **Live region for status announcements.** On mount it appends a `<div aria-live="polite" aria-atomic="true">` to `document.body` and writes short status messages into it: "Game session started. Scene loaded.", "Game session paused.", "Game session resumed.", "Error occurred: …". The region is removed on unmount.
- **Focus management on transitions.** When transitioning `loading → active`, focus moves to the first `[data-testid^="player-choice-"]`. When an error appears, focus moves to `[data-testid="game-session-error-retry"]`. Both run inside a 50ms `setTimeout` to let the new branch render before querying the DOM.

The render branches themselves have stable `data-testid`s (`game-session-error-container`, `game-session-no-characters`, `game-session-initializing`, `game-session-unknown`) for both screen readers (via the focus hooks) and the test suite.

## Error patterns

Two error sources flow through this component:

- **`error`** — surfaced by `useGameSessionState` when initialization or a retry threw. Has `.message`. Cleared by `handleDismissError` or by `handleRetry`.
- **`sessionState.error`** — set on the session store itself (e.g. by `initializeSession`). Cleared by the store's `setError(null)` via `handleDismissError`.

Both are merged in the render: whichever is present wins, and `<GameSessionError />` gets the message plus both handlers.

## Usage

```tsx
import GameSession from '@/components/GameSession/GameSession';

// Inside /worlds/[id]/play/page.tsx
<GameSession
  worldId={params.id}
  onSessionStart={() => track('session_started')}
  onSessionEnd={() => router.push(`/worlds/${params.id}`)}
  onStartNew={() => track('session_restarted')}
  onBack={() => router.push('/worlds')}
/>
```

The testing-only props (`_stores`, `_router`, `initialState`, `disableAutoResume`) exist for the `/dev/game-session` harness and the hook test suite. Production callers should never need them.

## Related

- `src/components/GameSession/GameSession.tsx` — the component itself.
- `src/components/GameSession/hooks/useGameSessionState.ts` — the state-machine hook.
- `src/components/GameSession/__tests__/GameSession.test.tsx` — render-branch and accessibility coverage.
- `src/components/GameSession/hooks/useGameSessionState.test.ts` — initialization, choice handling, retry coverage.
- `src/state/sessionStore.ts` — the canonical session state and actions.
- `narrative-generation.md` — sibling system, mounted by `ActiveGameSession`.
