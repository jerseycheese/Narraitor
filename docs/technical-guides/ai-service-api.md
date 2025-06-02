# AI Service Integration API

## Overview

The AI Service Integration provides a secure bridge between the Narraitor application and Google's Generative AI (Gemini) service for dynamic narrative generation. All AI requests are processed through secure server-side API routes to protect API keys and implement rate limiting.

## Security Architecture

### Secure Proxy Pattern

All AI requests from the browser route through Next.js API endpoints:

- **Client-side**: Uses `ClientGeminiClient` proxy
- **Server-side**: Uses `GeminiClient` with secure API key
- **API Routes**: `/api/narrative/generate`, `/api/narrative/choices`, `/api/generate-portrait`

### Rate Limiting

- **Limit**: 50 requests per hour per IP address
- **Purpose**: Prevent abuse and control API costs
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Core Components

### ClientGeminiClient (Browser)

Secure client-side proxy that routes requests through API endpoints.

```typescript
const client = new ClientGeminiClient();
const response = await client.generateContent('Generate a story');
```

### GeminiClient (Server)

Low-level server-side client for direct communication with Google Gemini API.

```typescript
// Server-side only
const client = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY,  // Server-side only
  modelName: 'gemini-2.0-flash',
  maxRetries: 3,
  timeout: 30000
});
```

### Default Client Factory

Automatically selects the appropriate client based on environment:

```typescript
const client = createDefaultGeminiClient();
// Returns ClientGeminiClient in browser, GeminiClient on server, MockGeminiClient in tests
```

## Configuration

### Environment Variables

```bash
# Server-side only (secure)
GEMINI_API_KEY=your-api-key

# Never use this (security vulnerability)
# NEXT_PUBLIC_GEMINI_API_KEY=your-api-key  # ❌ Exposes to browser
```

### Secure Configuration

```typescript
export const getAIConfig = (): AIConfig => {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',  // Server-side only
    modelName: 'gemini-2.0-flash',
    maxRetries: 3,
    timeout: 30000
  };
};
```

### Generation Settings

```typescript
export const getGenerationConfig = (): GenerationConfig => {
  return {
    temperature: 0.7,
    topP: 1.0,
    topK: 40,
    maxOutputTokens: 2048
  };
};
```

### Safety Settings

All content filters are set to `BLOCK_NONE` for maximum creative freedom:
- HARM_CATEGORY_SEXUALLY_EXPLICIT
- HARM_CATEGORY_HATE_SPEECH  
- HARM_CATEGORY_HARASSMENT
- HARM_CATEGORY_DANGEROUS_CONTENT

## Text Formatting Integration

The AI service now includes automatic text formatting for improved readability of AI-generated content.

### ResponseFormatter

Formats AI responses based on template type with appropriate styling options.

```typescript
const formatter = new ResponseFormatter();
const formattedResponse = formatter.format(aiResponse, {
  formatDialogue: true,
  enableItalics: true
});
```

### Template-Specific Formatting

Different template types apply different formatting options:

- **Narrative**: Dialogue formatting + italics
- **Dialogue**: Dialogue formatting only  
- **Journal**: Italics only
- **Default**: No formatting

### Updated AIResponse Interface

```typescript
interface AIResponse {
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
  formattedContent?: string;
}
```

### Usage with AIPromptProcessor

Formatting is automatically applied based on template type:

```typescript
const response = await processor.processAndSend('narrative-scene', variables);
console.log(response.formattedContent); // Automatically formatted
```

### Formatting Options


## Error Handling

### Retry Logic

The system implements automatic retry with exponential backoff for transient errors:

**Retryable errors:**
- Network errors
- Timeout errors
- Rate limiting (429)

**Non-retryable errors:**
- Authentication errors (401)
- Invalid API key
- Invalid request format

### Error Types

```typescript
interface AIServiceError {
  code: string;
  message: string;
  retryable: boolean;
}
```

### User-Friendly Error Handling

The AI service includes a user-friendly error display system that maps technical errors to human-readable messages.

#### Error Display Component

The ErrorMessage component provides user-friendly error display:

```typescript
import ErrorMessage from '@/lib/components/ErrorMessage';

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleRetry = async () => {
    setError(null);
    // Retry logic
  };
  
  return (
    <div>
      <ErrorMessage 
        error={error}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
      />
      {/* Other content */}
    </div>
  );
}
```

#### Error Mapping

Technical errors are automatically mapped to user-friendly messages:

- Network errors → "Connection Problem"
- Timeout errors → "Request Timed Out"  
- Rate limit errors → "Too Many Requests"
- Authentication errors → "Authentication Error"
- Unknown errors → "Something Went Wrong"

#### Integration Example

```typescript
function NarrativeGenerator() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const generateNarrative = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await processor.processAndSend('narrative-scene', {
        scene: 'tavern',
        character: 'hero'
      });
      // Handle successful response
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <ErrorMessage 
        error={error}
        onRetry={generateNarrative}
        onDismiss={() => setError(null)}
      />
      <button onClick={generateNarrative} disabled={loading}>
        Generate Narrative
      </button>
    </div>
  );
}
```

## Usage Examples

### Basic Content Generation

```typescript
// ❌ OLD PATTERN (Security Vulnerability)
// Never use direct AI clients in browser code

// ✅ NEW SECURE PATTERN
// Use API endpoints for all AI operations

async function generateContent(prompt: string) {
  try {
    const response = await fetch('/api/narrative/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      throw new Error('Generation failed');
    }
    
    const data = await response.json();
    console.log(data.content);
    return data;
  } catch (error) {
    console.error('Generation failed:', error.message);
    throw error;
  }
}
```

### With Template Processing

```typescript
// ❌ OLD PATTERN (Security Vulnerability)
// Never use AIPromptProcessor directly in browser code

// ✅ NEW SECURE PATTERN  
// Templates are processed server-side via API endpoints

async function generateNarrative(characterName: string, location: string) {
  try {
    const response = await fetch('/api/narrative/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'narrative-intro',
        variables: {
          characterName: characterName,
          location: location
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Narrative generation failed');
    }
    
    const data = await response.json();
    console.log(data.content);          // Raw content
    console.log(data.formattedContent); // Formatted content
    return data;
  } catch (error) {
    console.error('AI generation failed:', error.message);
    throw error;
  }
}
```

## Testing

The integration includes comprehensive mock utilities for testing:

```typescript
import { createMockResponse, mockResponses } from '@/lib/ai/__mocks__/mockUtils';

// Use predefined mock responses
const successResponse = mockResponses.success;
const emptyResponse = mockResponses.empty;
```

### Running Tests

```bash
npm test src/lib/ai/__tests__/geminiClient.test.ts
npm test src/lib/ai/__tests__/responseFormatter.test.ts
npm test src/lib/ai/__tests__/aiPromptProcessor.test.ts
npm test src/lib/ai/__tests__/userFriendlyErrors.test.ts
```

## API Reference

### Interfaces

```typescript
interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
}
```

## Migration from Previous SDK

This implementation uses the new `@google/genai` SDK (currently in preview) which is recommended by Google. Key differences:

- Import: `import { GoogleGenAI } from '@google/genai'`
- Client initialization: `new GoogleGenAI({ apiKey })`
- Content generation: `genAI.models.generateContent()`

## Future Enhancements

- Token usage tracking and cost monitoring
- Response caching for improved performance
- Support for streaming responses
- Multiple AI provider support
- Advanced retry strategies
- Context window management
