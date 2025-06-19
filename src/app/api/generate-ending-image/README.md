# Ending Image Generation API

## Endpoint: `/api/generate-ending-image`

This API endpoint generates AI-powered image prompts for story ending visualizations.

### Method: POST

**Request Body:**
```json
{
  "ending": {
    "epilogue": "string (required)",
    "tone": "string (required)",
    "worldImpact": "string (required)", 
    "characterLegacy": "string (required)"
  }
}
```

**Response (200):**
```json
{
  "prompt": "AI-generated image prompt",
  "altText": "Accessibility description",
  "success": true,
  "usingFallback": false
}
```

**Fallback Response (200):**
```json
{
  "prompt": "Tone-appropriate fallback prompt",
  "altText": "Generic ending description",
  "success": false,
  "usingFallback": true
}
```

**Error Responses:**
- `400` - Missing ending data or malformed JSON
- `500` - Unexpected server error

## Features

- **AI-First Approach:** Uses Google Gemini to generate contextual image prompts
- **Graceful Degradation:** Falls back to tone-appropriate prompts when AI fails
- **Tone-Aware Fallbacks:** Different fallback prompts for each ending tone
- **Accessibility:** Always includes descriptive alt text

## Testing

Comprehensive testing through:

1. **Dev Test Harnesses:**
   - `/dev/ending-system` - Full ending generation with image prompts
   - `/dev/ending-screen` - Image prompt integration testing

2. **Manual Verification:**
   - AI generation success paths tested
   - Fallback mechanisms verified for all tones  
   - Error handling confirmed (missing data, AI failures)
   - JSON parsing robustness validated

3. **Coverage:**
   - All ending tones tested (triumphant, bittersweet, mysterious, tragic, hopeful)
   - Both AI success and fallback scenarios verified
   - Error conditions thoroughly exercised

The development harnesses provide complete testing coverage including edge cases and failure scenarios.