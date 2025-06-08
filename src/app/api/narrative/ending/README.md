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
  "desiredTone": "triumphant | bittersweet | mysterious | tragic | hopeful (optional)",
  "customPrompt": "string (optional)"
}
```

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
- `503` - AI service unavailable 
- `500` - Internal server error

### Method: GET

Returns `405 Method Not Allowed` with guidance to use POST.

## Testing

The API endpoints are thoroughly tested through:

1. **Dev Test Harnesses:**
   - `/dev/ending-system` - Interactive ending generation testing
   - `/dev/ending-screen` - UI component testing

2. **Unit Tests:**
   - Core business logic tested in `endingGenerator.test.ts`
   - Type validation covered by TypeScript compiler
   - Error handling verified through dev harnesses

3. **Manual Testing:**
   - All endpoint variations tested via dev harnesses
   - Error conditions verified (missing fields, invalid types, AI failures)
   - Success paths confirmed with real AI responses

The development harnesses provide comprehensive coverage of the API functionality including error conditions, validation, and AI integration, which is more practical than complex Jest setup for Next.js API routes.