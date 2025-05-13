# AI Service Integration API

## Overview

The AI Service Integration provides a bridge between the Narraitor application and Google's Generative AI (Gemini) service for dynamic narrative generation.

## Core Components

### GeminiClient

Low-level client for direct communication with the Google Generative AI SDK.

```typescript
const client = new GeminiClient({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash',
  maxRetries: 3,
  timeout: 30000
});

const response = await client.generateContent('Generate a story');
```

### AIPromptProcessor

High-level integration that processes templates and manages AI requests.

```typescript
const processor = new AIPromptProcessor({
  templateManager,
  config: getAIConfig()
});
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key

### Default Configuration

```typescript
export const getAIConfig = (): AIConfig => {
  return {
    geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
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

## Usage Examples

### Basic Content Generation

```typescript
import { GeminiClient } from '@/lib/ai';

const config = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash',
  maxRetries: 3,
  timeout: 30000
};

const client = new GeminiClient(config);

try {
  const response = await client.generateContent('Tell me a story');
  console.log(response.content);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

### With Template Processing

```typescript
import { AIPromptProcessor, getAIConfig } from '@/lib/ai';
import { PromptTemplateManager, PromptType } from '@/lib/promptTemplates';

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
    location: 'Narraitor Castle'
  });
  console.log(response.content);
} catch (error) {
  console.error('AI generation failed:', error.message);
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
```

## API Reference

### Interfaces

```typescript
interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}

interface AIResponse {
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
}

interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

interface SafetySetting {
  category: string;
  threshold: string;
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
