# AI Response Parser Improvements

## Overview
This document details the comprehensive improvements made to the AI response parsing system to handle malformed JSON responses and improve reliability.

## Problem Statement
The AI generation system was experiencing frequent failures due to malformed JSON responses from the AI service, particularly:
- Truncated JSON responses missing closing brackets
- Incomplete array/object structures
- Parsing errors causing complete feature failures

## Root Cause Analysis
1. **AI Response Truncation**: Large responses were being cut off mid-structure
2. **No Error Recovery**: Single parsing failure caused complete feature breakdown
3. **Insufficient Retry Logic**: No mechanism to request better-formed responses

## Solution Implementation

### 1. JSON Repair Functionality (`src/lib/utils/aiResponseParser.ts`)

#### Automatic Bracket Repair
```tsx
function attemptJsonRepair(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Remove any trailing commas before closing brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Count and balance brackets
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  
  // Add missing closing brackets
  const missingCloseBraces = openBraces - closeBraces;
  const missingCloseBrackets = openBrackets - closeBrackets;
  
  for (let i = 0; i < missingCloseBrackets; i++) {
    repaired += '}';
  }
  
  for (let i = 0; i < missingCloseBrackets; i++) {
    repaired += ']';
  }
  
  return repaired;
}
```

#### Enhanced Error Recovery
```tsx
export function parseAIResponse<T>(response: string, maxRetries = 3): T {
  let lastError: Error | null = null;
  
  // Attempt 1: Standard JSON parsing
  try {
    return JSON.parse(response.trim());
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('JSON parse failed');
  }
  
  // Attempt 2: JSON repair and retry
  try {
    const repairedJson = attemptJsonRepair(response);
    return JSON.parse(repairedJson);
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('JSON repair failed');
  }
  
  // Attempt 3: Extract first valid JSON object/array
  try {
    const extracted = extractFirstValidJson(response);
    if (extracted) {
      return JSON.parse(extracted);
    }
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('JSON extraction failed');
  }
  
  throw new Error(`Failed to parse AI response: ${lastError?.message}. Response: ${response.substring(0, 200)}...`);
}
```

#### First Valid JSON Extraction
```tsx
function extractFirstValidJson(text: string): string | null {
  // Look for first opening brace or bracket
  const objectStart = text.indexOf('{');
  const arrayStart = text.indexOf('[');
  
  if (objectStart === -1 && arrayStart === -1) {
    return null;
  }
  
  const startIndex = objectStart === -1 ? arrayStart : 
                    arrayStart === -1 ? objectStart : 
                    Math.min(objectStart, arrayStart);
  
  // Extract from start position and attempt repair
  const substring = text.substring(startIndex);
  return attemptJsonRepair(substring);
}
```

### 2. World Generator Retry Logic (`src/lib/generators/worldGenerator.ts`)

#### Enhanced Prompt Strategy
```tsx
export async function generateWorldConfiguration(prompt: string): Promise<WorldConfiguration> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Enhanced prompt for retry attempts
      const retryPrompt = attempt > 1 
        ? `${prompt}\n\nIMPORTANT: This is retry attempt ${attempt}/${MAX_RETRIES}. The previous attempt failed due to malformed JSON. Please ensure your response is valid, complete JSON with all brackets properly closed.`
        : prompt;
      
      const response = await generateContent(retryPrompt);
      
      // Use enhanced parser with repair capabilities
      return parseAIResponse<WorldConfiguration>(response.content);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < MAX_RETRIES) {
        console.warn(`World generation attempt ${attempt} failed:`, error);
        // Add exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }
  
  throw new Error(`Failed to generate world configuration after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
}
```

#### Exponential Backoff Implementation
```tsx
async function withRetryBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after all retries');
}
```

### 3. Character Archetype Generation Improvements

#### Robust Generation Pipeline
```tsx
export async function generateCharacterArchetypes(
  world: World, 
  existingNames: string[] = []
): Promise<CharacterArchetype[]> {
  try {
    const prompt = createArchetypePrompt(world, existingNames);
    
    return await withRetryBackoff(async () => {
      const response = await generateContent(prompt);
      const parsed = parseAIResponse<{ archetypes: CharacterArchetype[] }>(response.content);
      
      // Validate structure
      if (!parsed.archetypes || !Array.isArray(parsed.archetypes)) {
        throw new Error('Invalid archetype response structure');
      }
      
      return parsed.archetypes;
    }, 3, 1000);
    
  } catch (error) {
    console.error('Failed to generate character archetypes:', error);
    
    // Fallback to default archetypes based on world theme
    return generateFallbackArchetypes(world);
  }
}
```

#### Fallback Archetype System
```tsx
function generateFallbackArchetypes(world: World): CharacterArchetype[] {
  const themeArchetypes = {
    fantasy: [
      { name: 'Brave Warrior', class: 'Fighter', description: 'A skilled combatant...' },
      { name: 'Wise Mage', class: 'Wizard', description: 'A master of arcane arts...' },
      { name: 'Stealthy Rogue', class: 'Rogue', description: 'A cunning infiltrator...' }
    ],
    scifi: [
      { name: 'Space Marine', class: 'Soldier', description: 'A hardened military operative...' },
      { name: 'Tech Specialist', class: 'Engineer', description: 'A genius with technology...' },
      { name: 'Psionic Agent', class: 'Psion', description: 'A wielder of mental powers...' }
    ],
    modern: [
      { name: 'Detective', class: 'Investigator', description: 'A skilled problem solver...' },
      { name: 'Hacker', class: 'Technician', description: 'A master of digital systems...' },
      { name: 'Medic', class: 'Support', description: 'A life-saving professional...' }
    ]
  };
  
  const fallbacks = themeArchetypes[world.theme?.toLowerCase()] || themeArchetypes.fantasy;
  
  return fallbacks.map(archetype => ({
    ...archetype,
    id: `fallback-${archetype.name.toLowerCase().replace(/\s+/g, '-')}`,
    level: 1,
    attributes: generateDefaultAttributes(world),
    skills: generateDefaultSkills(world),
    background: generateDefaultBackground(archetype),
    worldId: world.id
  }));
}
```

## Error Handling Improvements

### 1. Graceful Degradation
```tsx
export class AIResponseError extends Error {
  constructor(
    message: string,
    public readonly originalResponse: string,
    public readonly attemptCount: number
  ) {
    super(message);
    this.name = 'AIResponseError';
  }
}

export function handleAIError(error: unknown, context: string): never {
  if (error instanceof AIResponseError) {
    console.error(`AI Response Error in ${context}:`, {
      message: error.message,
      attempts: error.attemptCount,
      response: error.originalResponse.substring(0, 200)
    });
  } else {
    console.error(`Unexpected error in ${context}:`, error);
  }
  
  throw error;
}
```

### 2. Monitoring and Debugging
```tsx
export function logParsingAttempt(
  attempt: number,
  response: string,
  error: Error
): void {
  console.warn(`JSON parsing attempt ${attempt} failed:`, {
    error: error.message,
    responseLength: response.length,
    responseStart: response.substring(0, 100),
    responseEnd: response.substring(Math.max(0, response.length - 100))
  });
}
```

## Performance Optimizations

### 1. Response Caching
```tsx
const responseCache = new Map<string, any>();

export function parseAIResponseCached<T>(
  response: string,
  cacheKey?: string
): T {
  if (cacheKey && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  const parsed = parseAIResponse<T>(response);
  
  if (cacheKey) {
    responseCache.set(cacheKey, parsed);
  }
  
  return parsed;
}
```

### 2. Efficient JSON Repair
```tsx
// Optimized bracket counting using single pass
function countBrackets(text: string): {
  openBraces: number;
  closeBraces: number;
  openBrackets: number;
  closeBrackets: number;
} {
  let openBraces = 0, closeBraces = 0, openBrackets = 0, closeBrackets = 0;
  
  for (let i = 0; i < text.length; i++) {
    switch (text[i]) {
      case '{': openBraces++; break;
      case '}': closeBraces++; break;
      case '[': openBrackets++; break;
      case ']': closeBrackets++; break;
    }
  }
  
  return { openBraces, closeBraces, openBrackets, closeBrackets };
}
```

## Usage Examples

### Basic Parsing
```tsx
import { parseAIResponse } from '@/lib/utils/aiResponseParser';

try {
  const worldData = parseAIResponse<WorldConfiguration>(aiResponse);
  console.log('Successfully parsed world:', worldData.name);
} catch (error) {
  console.error('Failed to parse AI response:', error);
}
```

### With Retry Logic
```tsx
import { withRetryBackoff } from '@/lib/utils/aiResponseParser';

const archetypes = await withRetryBackoff(async () => {
  const response = await generateContent(prompt);
  return parseAIResponse<CharacterArchetype[]>(response.content);
}, 3, 1000);
```

### Error Handling
```tsx
try {
  const result = parseAIResponse<MyType>(response);
  return result;
} catch (error) {
  if (error instanceof AIResponseError) {
    // Use fallback data
    return getFallbackData();
  }
  throw error;
}
```

## Testing Strategies

### Unit Tests
```tsx
describe('parseAIResponse', () => {
  test('handles malformed JSON with missing brackets', () => {
    const malformed = '{"name": "Test", "items": [{"id": 1}';
    const result = parseAIResponse(malformed);
    expect(result.items).toHaveLength(1);
  });
  
  test('retries with exponential backoff', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First fail'))
      .mockRejectedValueOnce(new Error('Second fail'))
      .mockResolvedValueOnce('success');
    
    const result = await withRetryBackoff(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
```

### Integration Tests
```tsx
describe('World Generation with Parser', () => {
  test('recovers from malformed AI responses', async () => {
    // Mock AI service to return malformed JSON
    mockAIService.mockResolvedValueOnce({
      content: '{"name": "Test World", "attributes": [{"id": 1, "name": "Strength"'
    });
    
    const world = await generateWorldConfiguration('Create a fantasy world');
    expect(world.name).toBe('Test World');
    expect(world.attributes).toHaveLength(1);
  });
});
```

## Browser Compatibility

### Supported Features
- JSON.parse (ES5+)
- String methods (substring, indexOf, etc.)
- RegExp support
- Promise/async-await (ES2017+)

### Polyfills Not Required
- Uses only native JavaScript APIs
- No external dependencies
- Compatible with all modern browsers

## Future Enhancements

### Potential Improvements
1. **Schema Validation**: Add JSON schema validation for AI responses
2. **Response Streaming**: Handle partial JSON responses from streaming APIs
3. **AI Model Tuning**: Provide feedback to improve AI JSON formatting
4. **Advanced Repair**: Handle more complex JSON corruption scenarios
5. **Performance Monitoring**: Track parsing success rates and performance metrics