# Narrative Ending API

## Endpoint: `/api/narrative/ending`

This API endpoint generates AI-powered story endings for completed game sessions.

### Method: POST

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "characterId": "string (required)", 
  "worldId": "string (required)",
  "endingType": "player-choice | story-complete | session-limit | character-retirement (required)",
  "desiredTone": "triumphant | mysterious | tragic | hopeful (optional)",
  "customPrompt": "string (optional)"
}
```

`desiredTone` is advisory except for `tragic`, which forces explicit fatal-outcome framing (character death, past tense, no continuation language). For the other three values, the model chooses whichever tone actually fits the narrative content — the prompt text doesn't change based on what's requested, so the response's own `tone` field may differ from what was sent.

**Response (200):**
```json
{
  "epilogue": "AI-generated story conclusion",
  "characterLegacy": "Character's lasting impact",
  "worldImpact": "How the world changed",
  "tone": "emotional tone of the ending",
  "achievements": ["list", "of", "achievements"],
  "playTime": 3600
}
```

**Error Responses:**
- `400` - Missing required fields or invalid values
- `503` - Model provider unavailable 
- `500` - Internal server error

### Method: GET

Returns `405 Method Not Allowed` with guidance to use POST.

## Testing

The API endpoints are thoroughly tested through:

1. **Dev Test Harness:**
   - `/dev/ending-system` - Interactive ending generation testing (UI-only variants live in `EndingScreen.stories.tsx`)

2. **Unit Tests:**
   - Core business logic tested in `endingGenerator.test.ts`
   - Type validation covered by TypeScript compiler
   - Error handling verified through dev harnesses

3. **Manual Testing:**
   - All endpoint variations tested via dev harnesses
   - Error conditions verified (missing fields, invalid types, AI failures)
   - Success paths confirmed with real AI responses

The development harnesses cover the API functionality — error conditions, validation, and AI integration — which is more practical than complex Jest setup for Next.js API routes.