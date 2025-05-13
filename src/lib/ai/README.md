# AI Service Integration

This module provides integration with Google's Generative AI (Gemini) for dynamic narrative generation in the Narraitor project.

## Overview

The AI service integration consists of several key components:
- `GeminiClient`: Handles direct communication with the Google Generative AI SDK
- `AIPromptProcessor`: Processes templates and manages AI requests
- Configuration utilities for managing API settings
- Comprehensive error handling with retry logic

## Installation

```bash
npm install @google/genai
```

## Configuration

Set the following environment variable:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

## Usage

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
const response = await client.generateContent('Tell me a story');
console.log(response.content);
```

### With Template Processing

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
```

## API Reference

### GeminiClient

#### Constructor
```typescript
constructor(config: AIServiceConfig)
```

#### Methods
```typescript
generateContent(prompt: string): Promise<AIResponse>
```

Generates content based on the provided prompt with automatic retry logic for transient errors.

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

## Error Handling

The service includes built-in retry logic with exponential backoff for transient errors:
- Network errors
- Timeout errors
- Rate limiting (429)

Non-retryable errors are thrown immediately:
- Authentication errors
- Invalid API key
- Invalid request format

## Testing

The module includes comprehensive test coverage with mocked SDK interactions:

```bash
npm test src/lib/ai/__tests__/geminiClient.test.ts
```

## Future Enhancements

- Token usage tracking and reporting
- Response caching for improved performance
- Support for streaming responses
- Additional AI provider integrations
