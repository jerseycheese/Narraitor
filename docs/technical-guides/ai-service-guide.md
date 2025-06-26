---
title: AI Service Integration Guide
tags: [ai, api, gemini, integration, security]
created: 2025-06-26
updated: 2025-06-26
---

# AI Service Integration Guide

Secure integration with Google Gemini AI for narrative generation.

## Quick Start

### Client-side Usage
```typescript
import { createDefaultGeminiClient } from '@/lib/ai/gemini-client';

const client = createDefaultGeminiClient();
const response = await client.generateContent('Generate a story about a cowboy');
```

### Server-side Usage
```typescript
// In API routes only
import { GeminiClient } from '@/lib/ai/gemini-client';

const client = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash'
});
```

## Security Architecture

### Secure Proxy Pattern
- **Client**: Uses `ClientGeminiClient` (proxies to API routes)
- **Server**: Uses `GeminiClient` with secure API key
- **API Routes**: `/api/narrative/generate`, `/api/narrative/choices`, `/api/generate-portrait`

### Rate Limiting
- **50 requests/hour per IP**
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Configuration

### Environment Variables
```bash
# Required: Server-side only
GEMINI_API_KEY=your-api-key

# NEVER use client-side exposure
# NEXT_PUBLIC_GEMINI_API_KEY=your-api-key  # ❌ Security risk
```

### Generation Settings
```typescript
interface GenerationConfig {
  temperature: 0.7;     // Creativity (0-1)
  topP: 1.0;           // Nucleus sampling
  topK: 40;            // Top-k sampling
  maxOutputTokens: 2048; // Response length limit
}
```

## API Endpoints

### Generate Narrative
```typescript
// POST /api/narrative/generate
const response = await fetch('/api/narrative/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Continue the story...',
    context: narrativeContext,
    worldId: 'world-123'
  })
});
```

### Generate Choices
```typescript
// POST /api/narrative/choices
const response = await fetch('/api/narrative/choices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    narrativeText: 'The cowboy reached for his gun...',
    numChoices: 3,
    worldId: 'world-123'
  })
});
```

### Generate Portrait
```typescript
// POST /api/generate-portrait
const response = await fetch('/api/generate-portrait', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    character: characterData,
    world: worldData
  })
});
```

## Client Components

### ClientGeminiClient
Browser-safe proxy that routes through API endpoints:
```typescript
class ClientGeminiClient {
  async generateContent(prompt: string): Promise<string> {
    const response = await fetch('/api/narrative/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    return response.json();
  }
}
```

### GeminiClient (Server-only)
Direct API communication for server-side use:
```typescript
class GeminiClient {
  constructor(config: {
    apiKey: string;
    modelName?: string;
    maxRetries?: number;
    timeout?: number;
  });
  
  async generateContent(prompt: string): Promise<string>;
  async generateChoices(context: string, numChoices: number): Promise<Choice[]>;
}
```

## Error Handling

### Common Errors
```typescript
// Rate limit exceeded
if (error.status === 429) {
  throw new Error('Rate limit exceeded. Please wait before retrying.');
}

// Invalid API key
if (error.status === 401) {
  throw new Error('AI service authentication failed.');
}

// Content policy violation
if (error.message.includes('content_policy')) {
  throw new Error('Content violates AI service policies.');
}
```

### Retry Logic
```typescript
const client = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,        // Auto-retry failed requests
  timeout: 30000        // 30 second timeout
});
```

## Testing

### Mock Client
```typescript
// Automatically used in test environment
class MockGeminiClient {
  async generateContent(prompt: string): Promise<string> {
    return `Mock response for: ${prompt}`;
  }
}

// Test usage
const client = createDefaultGeminiClient(); // Returns MockGeminiClient in tests
```

### Test Helpers
```typescript
import { mockGeminiResponse } from '@/lib/ai/__mocks__/gemini-client';

beforeEach(() => {
  mockGeminiResponse.mockResolvedValue('Test narrative response');
});
```

## Performance

### Caching Strategy
- Cache generated content for 5 minutes
- Cache portrait generations for 24 hours
- Use React Query for client-side caching

### Optimization
```typescript
// Batch multiple requests when possible
const batchRequests = async (prompts: string[]) => {
  return Promise.allSettled(
    prompts.map(prompt => client.generateContent(prompt))
  );
};
```

## Monitoring

### Rate Limit Headers
```typescript
const checkRateLimit = (response: Response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining && parseInt(remaining) < 5) {
    console.warn('Approaching rate limit');
  }
};
```

### Error Tracking
```typescript
const logAIError = (error: Error, context: any) => {
  console.error('AI Service Error:', {
    message: error.message,
    context,
    timestamp: new Date().toISOString()
  });
};
```

## Best Practices

### Security
- Never expose API keys to client-side code
- Always use server-side API routes for AI requests
- Implement proper rate limiting
- Validate and sanitize all inputs

### Performance
- Cache responses when appropriate
- Implement request timeouts
- Use batch processing for multiple requests
- Monitor rate limit usage

### Error Handling
- Provide graceful fallbacks for AI failures
- Implement retry logic with exponential backoff
- Log errors for monitoring and debugging
- Show user-friendly error messages

## Related
- `/lib/ai/gemini-client.ts` - Client implementations
- `/api/narrative/` - API route handlers
- `/lib/ai/prompt-templates/` - Prompt management
- AI Choice Generation Guide