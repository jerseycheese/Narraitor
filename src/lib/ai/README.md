# AI Service Integration

This module handles all the AI integration for Narraitor, specifically with Google's Gemini for generating narrative content. The key challenge was keeping API keys secure while making AI calls fast and reliable, so we built a server-side proxy system with rate limiting and error handling.

## Why This Architecture

Initially, we were thinking about calling the AI service directly from the client, but that would expose API keys in the browser - which is a huge security risk. So instead, we built a proxy pattern where the client makes requests to our secure API routes, and those routes handle the actual AI calls on the server side.

This gives us a few benefits:
- API keys stay secure on the server
- We can implement rate limiting to control costs
- Better error handling and retry logic
- Request validation and sanitization

## How It Works

The system has a few key components:

**`ClientGeminiClient`** - This is what your React components use. It makes requests to our secure API routes instead of calling Google directly.

**`GeminiClient`** - The server-side client that actually talks to Google's API. This only runs on the server where the API keys are safe.

**`NarrativeGenerator`** - Handles prompt template processing and manages the AI requests.

**`ResponseFormatter`** - Takes the raw AI response and formats it with dialogue formatting, italics, etc.

Plus configuration utilities and error handling with retry logic.

## Basic Usage

For client-side components (which is most of the time):

```typescript
import { ClientGeminiClient } from '@/lib/ai/clientGeminiClient';

const client = new ClientGeminiClient();
const response = await client.generateContent('Tell me a story');
console.log(response.content);
```

For server-side code (API routes, etc.):

```typescript
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getAIConfig } from '@/lib/ai/config';

const config = getAIConfig(); // Reads GEMINI_API_KEY from env
const client = new GeminiClient(config);
const response = await client.generateContent('Tell me a story');
console.log(response.content);
```

## Template Processing

The real power comes when you combine this with the prompt template system:

```typescript
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

const generator = new NarrativeGenerator(createDefaultGeminiClient());

const initialScene = await generator.generateInitialScene('world-123', []);
console.log(initialScene.content);
```

## Secure API Routes

All AI requests go through these Next.js API endpoints:

- **`/api/narrative/generate`** - General narrative content generation
- **`/api/narrative/choices`** - Choice generation for interactive narratives
- **`/api/generate-portrait`** - Character portrait generation

These routes handle all the security stuff automatically - API key protection, rate limiting (50 requests per hour per IP), request validation, and error handling with fallback responses.

## Configuration

Set this environment variable on your server:

```env
GEMINI_API_KEY=your-gemini-api-key
```

**Important**: Never use `NEXT_PUBLIC_GEMINI_API_KEY` - that would expose your API key to the browser. Always keep it server-side only.

## Error Handling

The system includes smart retry logic for transient errors like network timeouts or rate limiting, but it won't retry things like authentication errors that need manual intervention.

When using `ClientGeminiClient`, errors from the API routes are handled automatically:
- Rate limit exceeded: Clear error message with retry guidance
- Server errors: Graceful fallback with user-friendly messages
- Network errors: Automatic retry with exponential backoff

## Response Formatting

The `ResponseFormatter` takes raw AI responses and makes them more readable:

- **Narrative templates**: Dialogue formatting + italics for actions
- **Dialogue templates**: Just dialogue formatting
- **Journal templates**: Just italics for emphasis

For example, a raw response like:
```
The hero said "I will save you!" and ran towards the dragon.
```

Gets formatted to:
```
The hero said "I will save you!" and *ran towards the dragon*.
```

## Rate Limiting

We limit requests to 50 per hour per IP address to prevent abuse and control API costs. When you hit the limit, you get an HTTP 429 response with clear messaging about when you can try again.

## Generation Configuration

You can tune the AI behavior:

```typescript
interface GenerationConfig {
  temperature?: number;  // 0.0-1.0 (default: 0.7) - creativity level
  topP?: number;        // 0.0-1.0 (default: 1.0) - nucleus sampling
  topK?: number;        // 1-40 (default: 40) - top-k sampling
  maxOutputTokens?: number; // (default: 2048) - response length limit
}
```

Lower temperature gives more consistent responses, higher temperature gives more creative/varied responses.

## Testing

The module has test coverage with mocked SDK interactions:

```bash
npm test src/lib/ai/__tests__/geminiClient.test.ts
npm test src/lib/ai/__tests__/responseFormatter.test.ts
npm test src/lib/ai/__tests__/aiPromptProcessor.test.ts
```

## Future Improvements

We're thinking about adding:
- Token usage tracking and reporting
- Response caching for improved performance
- Support for streaming responses
- Additional AI provider integrations

Adding a new provider or feature shouldn't require major changes elsewhere.
