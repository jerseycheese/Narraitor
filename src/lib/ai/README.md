# AI Service Integration

This module provides secure integration with Google's Generative AI (Gemini) for dynamic narrative generation in the Narraitor project. All AI requests are processed through secure server-side API routes to protect API keys and implement rate limiting.

## Overview

The AI service integration consists of several key components:
- `ClientGeminiClient`: Client-side proxy that communicates with secure API routes
- `GeminiClient`: Server-side client for direct communication with Google Generative AI SDK
- `AIPromptProcessor`: Processes templates and manages AI requests
- `ResponseFormatter`: Formats AI responses with context-appropriate text styling
- Configuration utilities for managing API settings
- Comprehensive error handling with retry logic
- Rate limiting (50 requests per hour per IP)

## Installation

```bash
npm install @google/genai
```

## Configuration

Set the following environment variable (server-side only):

```env
GEMINI_API_KEY=your-gemini-api-key
```

**Important**: API keys are now server-side only for security. Never use `NEXT_PUBLIC_GEMINI_API_KEY` or expose API keys to the browser.

## Usage

### Client-Side Content Generation

```typescript
import { ClientGeminiClient } from '@/lib/ai';

// Client-side usage through secure API proxy
const client = new ClientGeminiClient();
const response = await client.generateContent('Tell me a story');
console.log(response.content);
```

### Server-Side Content Generation

```typescript
import { GeminiClient, getAIConfig } from '@/lib/ai';

// Server-side usage with direct API access
const config = getAIConfig(); // Automatically reads GEMINI_API_KEY
const client = new GeminiClient(config);
const response = await client.generateContent('Tell me a story');
console.log(response.content);
```

### With Template Processing and Formatting

```typescript
import { AIPromptProcessor, getAIConfig } from '@/lib/ai';
import { PromptTemplateManager } from '@/lib/promptTemplates';

const templateManager = new PromptTemplateManager();
const processor = new AIPromptProcessor({
  templateManager,
  config: getAIConfig()
});

const response = await processor.processAndSend('narrative-intro', {
  characterName: 'Hero',
  location: 'Castle'
});

// Access both raw and formatted content
console.log(response.content);          // Raw AI response
console.log(response.formattedContent); // Formatted with dialogue and italics
```

## Secure API Routes

All AI requests are routed through secure Next.js API endpoints:

- **`/api/narrative/generate`**: General narrative content generation
- **`/api/narrative/choices`**: Choice generation for interactive narratives
- **`/api/generate-portrait`**: Character portrait generation

These routes handle:
- API key security (server-side only)
- Rate limiting (50 requests per hour per IP)
- Request validation and sanitization
- Error handling and fallback responses

## API Reference

### ClientGeminiClient (Client-Side)

#### Constructor
```typescript
constructor()
```

#### Methods
```typescript
generateContent(prompt: string): Promise<AIResponse>
generateChoices(context: string, options?: ChoiceOptions): Promise<ChoiceResponse>
generatePortrait(characterData: CharacterData): Promise<PortraitResponse>
```

### GeminiClient (Server-Side)

#### Constructor
```typescript
constructor(config: AIServiceConfig)
```

#### Methods
```typescript
generateContent(prompt: string): Promise<AIResponse>
```

Generates content based on the provided prompt with automatic retry logic for transient errors.

### ResponseFormatter

#### Methods
```typescript
format(response: AIResponse, options?: FormattingOptions): AIResponse
getFormattingOptionsForTemplate(templateType: string): FormattingOptions
```

Formats AI responses based on template type:
- **Narrative**: Dialogue formatting + italics
- **Dialogue**: Dialogue formatting only
- **Journal**: Italics only

### Configuration Options

```typescript
interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}
```

### Generation Configuration

```typescript
interface GenerationConfig {
  temperature?: number;  // 0.0-1.0 (default: 0.7)
  topP?: number;        // 0.0-1.0 (default: 1.0)
  topK?: number;        // 1-40 (default: 40)
  maxOutputTokens?: number; // (default: 2048)
}
```

## Security Features

### Server-Side API Key Protection
- API keys are stored server-side only (`GEMINI_API_KEY`)
- No API keys are exposed to the browser or client-side code
- All requests are proxied through secure Next.js API routes

### Rate Limiting
- 50 requests per hour per IP address
- Prevents abuse and controls API costs
- Returns HTTP 429 when limits are exceeded
- Rate limit headers included in responses

### Request Validation
- Input sanitization for all prompts
- Content filtering for inappropriate requests
- Structured response validation

## Error Handling

The service includes built-in retry logic with exponential backoff for transient errors:
- Network errors
- Timeout errors
- Rate limiting (429)

Non-retryable errors are thrown immediately:
- Authentication errors
- Invalid API key
- Invalid request format

### Client-Side Error Handling
When using `ClientGeminiClient`, errors from API routes are automatically handled:
- Rate limit exceeded (429): Clear error message with retry guidance
- Server errors (500): Graceful fallback with user-friendly messages
- Network errors: Automatic retry with exponential backoff

## Testing

The module includes comprehensive test coverage with mocked SDK interactions:

```bash
npm test src/lib/ai/__tests__/geminiClient.test.ts
npm test src/lib/ai/__tests__/responseFormatter.test.ts
npm test src/lib/ai/__tests__/aiPromptProcessor.test.ts
```

## Future Enhancements

- Token usage tracking and reporting
- Response caching for improved performance
- Support for streaming responses
- Additional AI provider integrations
