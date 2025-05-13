# AI Service Integration API

## Overview

The AI Service Integration provides a bridge between the PromptTemplateManager and Google Gemini AI service for dynamic narrative generation.

## Core Components

### AIPromptProcessor

Main integration class that processes templates and sends them to the AI service.

```typescript
const processor = new AIPromptProcessor({
  templateManager,
  config: getAIConfig()
});
```

### Configuration

Uses environment variables for API configuration:

- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key
- Model: `gemini-1.5-flash-latest` (default)
- Max Retries: 3
- Timeout: 30000ms

### Error Handling

The system categorizes errors as retryable or non-retryable:

**Retryable errors:**
- Network errors
- Timeout errors
- Rate limiting (429)

**Non-retryable errors:**
- Authentication errors (401)
- Invalid API key
- Invalid request format

## Usage Example

```typescript
import { AIPromptProcessor, getAIConfig } from '@/lib/ai';
import { PromptTemplateManager } from '@/lib/promptTemplates';

// Initialize template manager
const templateManager = new PromptTemplateManager();
templateManager.addTemplate({
  id: 'narrative-intro',
  type: PromptType.NARRATIVE,
  content: 'Create an introduction for {{characterName}} in {{location}}',
  variables: [
    { name: 'characterName', description: 'Character name' },
    { name: 'location', description: 'Story location' }
  ]
});

// Create processor
const processor = new AIPromptProcessor({
  templateManager,
  config: getAIConfig()
});

// Generate content
try {
  const response = await processor.processAndSend('narrative-intro', {
    characterName: 'John the Brave',
    location: 'Narraitor'
  });
  console.log(response.content);
} catch (error) {
  console.error('AI generation failed:', error.message);
}
```

## Error Types

### AIServiceError
```typescript
interface AIServiceError {
  code: string;
  message: string;
  retryable: boolean;
}
```

### Common Error Codes
- `NETWORK_ERROR` - Network connection issues
- `TIMEOUT` - Request exceeded timeout
- `RATE_LIMIT` - Too many requests
- `AUTH_ERROR` - Authentication failed
- `INVALID_REQUEST` - Invalid request format

## Testing

The integration includes comprehensive mock utilities for testing:

```typescript
import { createMockResponse, mockResponses } from '@/lib/ai/__mocks__/mockUtils';

// Use predefined mock responses
const successResponse = mockResponses.success;
const emptyResponse = mockResponses.empty;
```

## Future Enhancements

- Token usage tracking
- Response caching
- Multiple AI provider support
- Advanced retry strategies
