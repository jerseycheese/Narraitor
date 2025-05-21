# Narrative Generator Usage Guide

The `NarrativeGenerator` class is responsible for generating AI-powered narrative content for the game. It handles interactions with the AI service and formats responses appropriately.

## Basic Usage

```typescript
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

// Create a new instance with the Gemini client
const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());

// Generate an initial scene
const initialScene = await narrativeGenerator.generateInitialScene(
  'world-123', // worldId
  []  // characterIds (empty array for now)
);

// Generate a subsequent narrative segment
const nextSegment = await narrativeGenerator.generateSegment({
  worldId: 'world-123',
  sessionId: 'session-456',
  characterIds: [],
  narrativeContext: {
    recentSegments: [], // Array of previous segments for context
    currentSituation: 'Player chose to enter the cave'
  },
  generationParameters: {
    segmentType: 'scene',
    includedTopics: ['danger', 'exploration']
  }
});

// Generate a transition between scenes
const transition = await narrativeGenerator.generateTransition(
  previousSegment, // The last segment
  {
    worldId: 'world-123',
    sessionId: 'session-456',
    narrativeContext: {
      currentLocation: 'Mountain Peak'
    }
  }
);
```

## API Reference

### `generateInitialScene(worldId: string, characterIds: string[]): Promise<NarrativeGenerationResult>`

Generates the initial narrative scene to start a game session.

**Parameters:**
- `worldId`: The ID of the world to generate content for
- `characterIds`: Array of character IDs involved in the scene

**Returns:**
- A Promise that resolves to a `NarrativeGenerationResult` object

### `generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult>`

Generates a narrative segment based on the specified request parameters.

**Parameters:**
- `request`: A `NarrativeGenerationRequest` object with the following properties:
  - `worldId`: The ID of the world
  - `sessionId`: The ID of the current game session
  - `characterIds`: Array of character IDs involved
  - `narrativeContext`: Context information for generation
    - `recentSegments`: Previous narrative segments for context
    - `currentSituation`: Description of the current game state
    - `currentLocation`: (optional) The current location
  - `generationParameters`: Parameters to control generation
    - `segmentType`: Type of segment to generate ('scene', 'dialogue', etc.)
    - `includedTopics`: Topics to include in the generated content

**Returns:**
- A Promise that resolves to a `NarrativeGenerationResult` object

### `generateTransition(from: NarrativeSegment, to: NarrativeGenerationRequest): Promise<NarrativeGenerationResult>`

Generates a transition between narrative segments.

**Parameters:**
- `from`: The source segment to transition from
- `to`: A `NarrativeGenerationRequest` with details about the target state

**Returns:**
- A Promise that resolves to a `NarrativeGenerationResult` object

## Response Format

All generator methods return a `NarrativeGenerationResult` with the following structure:

```typescript
interface NarrativeGenerationResult {
  content: string;  // The generated narrative text
  segmentType: 'scene' | 'dialogue' | 'action' | 'transition';  // The type of segment
  metadata: {  // Additional metadata about the segment
    characterIds: string[];  // Characters involved
    location?: string;       // Location where the narrative takes place
    mood?: string;           // Emotional tone of the segment
    tags?: string[];         // Descriptive tags
  };
  tokenUsage?: number;  // Amount of tokens used in generation (if available)
}
```

## Error Handling

The narrative generator includes error handling for common scenarios:

1. **World Not Found**: If the specified `worldId` doesn't exist, an error is thrown
2. **Generation Failure**: If AI content generation fails, errors are propagated with context
3. **Template Not Found**: If a prompt template for the requested segment type is missing, an error is thrown

Example error handling:

```typescript
try {
  const result = await narrativeGenerator.generateInitialScene(worldId, []);
  // Handle successful generation
} catch (error) {
  console.error('Failed to generate narrative:', error);
  // Handle error (show user-friendly message, retry, etc.)
}
```

## Customization

The narrative generator adapts to world themes automatically, providing genre-appropriate content. For example:
- Fantasy worlds get mystical forest locations
- Science fiction worlds take place on space stations
- Western worlds are set in frontier towns

This theming happens automatically based on the world configuration.