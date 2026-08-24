# Narrative Generator Usage Guide

The `NarrativeGenerator` class handles generating AI-powered narrative content for the game. It's the main interface between your app and the AI service, handling all the prompt building and response formatting.

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

## Key Methods

### generateInitialScene()

Generates the opening narrative scene to start a game session. This is typically the first thing you call when starting a new game.

```typescript
generateInitialScene(worldId: string, characterIds: string[]): Promise<NarrativeGenerationResult>
```

**Parameters:**
- `worldId` - The ID of the world to generate content for
- `characterIds` - Array of character IDs involved in the scene

**Returns:** A Promise that resolves to a `NarrativeGenerationResult` object

### generateSegment()

This is the workhorse method - generates narrative segments based on your current game state and what the player just did.

```typescript
generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult>
```

**Parameters:**
The `request` object needs these properties:
- `worldId` - The ID of the world
- `sessionId` - The ID of the current game session
- `characterIds` - Array of character IDs involved
- `narrativeContext` - Context information for generation:
  - `recentSegments` - Previous narrative segments for context
  - `currentSituation` - Description of what just happened
  - `currentLocation` - (optional) Where this is taking place
- `generationParameters` - Parameters to control generation:
  - `segmentType` - Type of segment ('scene', 'dialogue', etc.)
  - `includedTopics` - Topics to include in the generated content

**Returns:** A Promise that resolves to a `NarrativeGenerationResult` object

### generateTransition()

Generates smooth transitions between narrative segments. Useful when you need to move the story from one scene to another.

```typescript
generateTransition(from: NarrativeSegment, to: NarrativeGenerationRequest): Promise<NarrativeGenerationResult>
```

**Parameters:**
- `from` - The source segment to transition from
- `to` - A `NarrativeGenerationRequest` with details about where you're going

**Returns:** A Promise that resolves to a `NarrativeGenerationResult` object

## Response Format

All generator methods return a `NarrativeGenerationResult` with this structure:

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

You get the narrative text plus metadata about what kind of content was generated and which characters were involved.

## Error Handling

The narrative generator includes error handling for common scenarios:

**World Not Found**: If the specified `worldId` doesn't exist, an error is thrown
**Generation Failure**: If AI content generation fails, errors are propagated with context
**Template Not Found**: If a prompt template for the requested segment type is missing, an error is thrown

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

## World Theme Adaptation

One of the cool things about the narrative generator is that it automatically adapts to world themes. You don't need to do anything special - just provide the world ID and it handles the rest.

For example:
- Fantasy worlds get mystical forest locations and magical elements
- Science fiction worlds take place on space stations with futuristic technology
- Western worlds are set in frontier towns with period-appropriate language
- Horror worlds emphasize tension and atmospheric descriptions

This theming happens automatically based on the world configuration, so the same generation code works for any genre.