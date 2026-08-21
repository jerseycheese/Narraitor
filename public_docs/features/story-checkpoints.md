# Story Checkpoints

Story checkpoints are what fills the "Story So Far" recap. As major events pile up during a session, the AI writes a short narrative segment covering just those events, and the recap is built by concatenating every segment for the session in order.

Checkpoints are a display feature. Segments surface in the Story So Far panel during play and in the "Your Story" block on the ending screen, and that's it. The narrative generator doesn't read them, so a checkpoint has no effect on what the AI writes for the next turn. The one place a segment does get reused is the checkpoint prompt itself, which receives the last three segments as context so each new one continues the story instead of starting over.

## When a Checkpoint Gets Created

Automatically, with no button to press. `useStoryCheckpointManager` watches the session's major events in world state, and once at least one of them hasn't been summarized yet, a 3 second debounce fires and the request goes out. A failed attempt won't retry the same batch of events, so it stays quiet until genuinely new events show up.

Major events are what drive all of this, and they're gated two different ways:

- The first narrative segment of a session always records one, so the recap has something in it from the start.
- Every candidate after that goes through `POST /api/narrative/validate-event-significance`, and only the events the AI calls consequential get recorded. That check fails open: if the request errors or the response won't parse, the candidate is recorded anyway rather than dropped. So an event that looks insignificant in the recap may have arrived that way, not because the AI approved it.

The hook also listens for a `narraitor:finalize-checkpoint` window event so a session can capture one last checkpoint on the way out, though nothing in the app dispatches that event right now. Checkpoint generation is skipped entirely under Playwright (`isPlaywrightEnv`), because seeded E2E and visual pages have no AI key and the request would just hang.

Where the recap shows up depends on the progressive disclosure flag. With the flag off it sits in the support column below the narrative, and with it on it moves into the Story So Far drawer.

## What Gets Captured

Each checkpoint stores:

- The narrative segment, 50 to 75 words, covering only the events in that checkpoint
- Highlights distilled from the included events
- The ids of every major event and decision merged into the segment
- Metadata: included event and decision counts, the last event timestamp, the prompt version, and a model name

Treat that model name as a default rather than provenance. The route calls `generateStoryCheckpointSummary` without a model argument, so the value stored is whatever `getAIConfig().modelName` returns, not the model the resolved provider actually used. On Claude, Ollama, an OpenAI-compatible provider, or any non-default model, it will misattribute. The fallback path records the literal string `fallback` instead.

Because the system tracks which event IDs have already been summarized, you won't accidentally double-count the same moment in multiple checkpoints.

## API Endpoint

Server-side AI work happens through `POST /api/narrative/story-checkpoint`. The request body accepts:

```json
{
  "worldId": "world-123",
  "sessionId": "session-456",
  "characterId": "char-789",
  "events": [
    {
      "id": "event-1",
      "description": "Queen Maera dissolves the council",
      "timestamp": "2025-11-20T18:00:00Z",
      "characterId": "char-789",
      "characterName": "Maera",
      "sessionId": "session-456"
    }
  ],
  "decisions": [
    {
      "id": "decision-5",
      "text": "Demand Maera step down",
      "consequence": "Lost half the guard",
      "alignment": "chaotic"
    }
  ]
}
```

That's the minimum the route needs. It also takes `characterName`, `currentLocation`, `activeGoals`, `toneSettings`, and `previousSegments`, which carries the last three checkpoint segments and is the only reason consecutive segments read as one story. There's a `narrativeSummary` field too, but the prompt builder ignores it. The full shape lives in `src/types/story-checkpoint.types.ts`. Events are capped at 10 per request and decisions at 5.

The response:

```json
{
  "segment": "Maera dissolved the council and forced the player into open rebellion.",
  "highlights": ["Council disbanded", "Royal guard split"],
  "majorEvents": ["Maera dissolved the council"],
  "characterDevelopment": ["Player now leads a rebel cell"],
  "nextHooks": ["Secure funding", "Recruit officers"],
  "themes": ["Loyalty tested"],
  "includedEvents": 1,
  "includedDecisions": 1,
  "lastEventTimestamp": "2025-11-20T18:00:00Z",
  "model": "gemini-2.5-flash"
}
```

`segment` is the only field the UI renders. `highlights` is stored on the checkpoint but nothing displays it yet, and `characterDevelopment`, `nextHooks`, and `themes` get dropped on the way into the store.

The browser calls this endpoint directly, through `aiFetch` rather than a bare `fetch` (see
`useStoryCheckpointManager`). `aiFetch` attaches the player's key as a request header and the
route resolves it server-side.

## Troubleshooting

- **Recap still empty?** The panel waits for a major event, and the first narrative segment of a session records one, so an empty recap after a few turns means either the segment never landed or the checkpoint request failed. Until then you'll see "Your story will appear here once major events occur."
- **Segment reads like a flat list of event descriptions?** That's the fallback the generator uses when Gemini returns something that isn't valid JSON or leaves `segment` out. You can tell from the stored `aiModel`, which comes back as `fallback` instead of a real model name.
- **Need to re-run a checkpoint?** You can't. Segments are immutable, event IDs are only summarized once, and there's no per-checkpoint delete anywhere in the UI. Starting a fresh session is the clean way to try again; the devtools Test Data Generator has "Delete All Worlds" and "NUKE EVERYTHING" if you want the persisted state gone as well.
