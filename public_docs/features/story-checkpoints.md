# Story Checkpoints

The story checkpoint system keeps long sessions coherent by letting players capture "story so far" summaries whenever the narrative hits a major beat. Checkpoints combine the AI-detected major events with the player's most recent decisions so future prompts can keep context without replaying the entire session history.

## When to Create a Checkpoint

Manual checkpoints live at the bottom of the active Game Session view (under the inventory block). The Story So Far panel stays collapsed by default; expanding it shows the latest AI-generated summary, pending major events, and a `Create Checkpoint` button. The button lights up whenever the current session records at least one new major event that hasn't been summarized yet. This makes it easy to capture summaries after boss fights, big reveals, or any turning point the AI tagged as critical.

## What Gets Captured

Each checkpoint stores:

- The AI-generated summary (2–3 sentences)
- Bulleted highlights from the included events
- References to every major event and decision merged into the summary
- Metadata like the Gemini model/version and last event timestamp

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

The response mirrors what the UI displays:

```json
{
  "summary": "Maera dissolved the council and forced the player into open rebellion.",
  "highlights": ["Council disbanded", "Royal guard split"],
  "majorEvents": ["Maera dissolved the council"],
  "characterDevelopment": ["Player now leads a rebel cell"],
  "nextHooks": ["Secure funding", "Recruit officers"],
  "includedEvents": 1,
  "includedDecisions": 1,
  "lastEventTimestamp": "2025-11-20T18:00:00Z",
  "model": "gemini-2.5-flash"
}
```

The browser calls this endpoint directly, through `aiFetch` rather than a bare `fetch` (see
`useStoryCheckpointManager`). That's how the key stays private: `aiFetch` attaches the player's
own key as a request header and the route resolves it server-side, so the key never ends up in
client JavaScript and the browser never talks to `googleapis.com`.

## Troubleshooting

- **Button disabled?** The UI waits for at least one unsummarized major event in the active session. Keep playing until the Major Event detector fires again.  
- **Empty summary returned?** The API falls back to a simple joined string of event descriptions when Gemini can't return valid JSON. You can retry immediately—failures usually happen when the events list is extremely short.
- **Need to re-run a checkpoint?** Delete the IndexedDB entry for that world or clear storage via the devtools panel, then replay the moment with new events before creating another checkpoint.
