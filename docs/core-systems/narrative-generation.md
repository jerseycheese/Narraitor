# Narrative Generation System

The Narrative Generation System is a core component of Narraitor that provides AI-powered, dynamically generated narrative content that adapts to the world's theme, player choices, and game context.

## Overview

The system consists of several interconnected components:

1. **NarrativeGenerator Service**: Core service responsible for generating narrative content using AI
2. **Template Manager**: Provides prompt templates for different narrative segment types
3. **Context Management**: Maintains narrative continuity by tracking context
4. **Component System**: React components that manage and display narrative content
5. **State Management**: Persists narrative segments using Zustand stores

## Usage Guide

### Basic Usage

To generate and display narrative content in a game session:

```tsx
import { NarrativeController } from '@/components/Narrative/NarrativeController';

// In your GameSession component
<NarrativeController
  worldId={worldId}
  sessionId={sessionId}
  triggerGeneration={true}
/>
```

### Responding to Player Choices

When a player makes a choice, you can trigger a narrative response:

```tsx
// When a player makes a choice
const handleChoiceSelected = (choiceId: string) => {
  setSelectedChoiceId(choiceId);
  
  // The NarrativeController will generate a new segment based on this choice
  <NarrativeController
    worldId={worldId}
    sessionId={sessionId}
    choiceId={selectedChoiceId}
    onNarrativeGenerated={handleNarrativeGenerated}
  />
};
```

### Display-Only Mode

If you only want to display existing narrative without generating new content:

```tsx
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';

// Only displays existing narrative without generating new content
<NarrativeHistoryManager
  sessionId={sessionId}
/>
```

## Technical Implementation

### World-Specific Adaptation

The narrative generation system adapts content based on the world's properties:

1. **Theme-Based Content**: Different worlds (Fantasy, Western, Sci-Fi, etc.) get appropriate narrative styles
2. **Location Adaptation**: Starting locations are selected based on world theme:
   - Western worlds start in "Frontier Town"
   - Fantasy worlds start in "Enchanted Forest"
   - Sci-Fi worlds start in "Space Station"
3. **Tone Matching**: Narrative tone matches the world description
4. **Attribute Integration**: World attributes influence content and narrative possibilities

### Prompt Template System

The system uses different templates for different narrative needs:

1. **Initial Scene Template**: Generates the opening scene for a game session
2. **Scene Template**: Creates standard narrative scenes
3. **Transition Template**: Handles transitions between different narrative states

### Narrative Perspective

The narrative system consistently uses **second-person perspective** ("you") to create an immersive experience:

1. **Player as Character**: The AI understands that the player IS the named character
2. **Perspective Rules**: All narration uses "you" instead of the character name
3. **Character Names in Dialogue**: Character names only appear when NPCs address the player
4. **Immersive Storytelling**: Creates a direct, personal connection to the narrative

### Deduplication and Error Prevention

The system includes several safeguards:

1. **Initial Scene Deduplication**: Prevents multiple initial scenes from being generated
2. **Choice Tracking**: Prevents the same choice from triggering multiple generations
3. **Component Lifecycle Management**: Prevents state updates after component unmount
4. **Error Recovery**: Handles AI service failures gracefully
5. **JSON Parsing Fallbacks**: Handles different AI response formats

## Error Handling

The narrative system handles several types of errors:

1. **AI Service Errors**: When the AI service fails to generate content
2. **JSON Parsing Errors**: When the AI response format is unexpected
3. **Network Errors**: When communication with the AI service fails
4. **Session-Related Errors**: When there are issues with session management

Errors are displayed to users with appropriate messages, and the system attempts to recover when possible.

## Testing

### Manual Testing

The system includes a test harness at `/dev/narrative-system` for manual testing:

1. Generate initial narrative for different world themes
2. Make player choices to test narrative continuity
3. Create new sessions to test initialization
4. Test error handling by creating edge case scenarios

### Automated Testing

Unit tests are available for key components:

1. `narrativeGenerator.test.ts`: Tests core generation functionality
2. `NarrativeController.test.tsx`: Tests controller component behavior
3. `NarrativeDisplay.test.tsx`: Tests display component rendering

## Future Enhancements

Potential areas for future development:

1. **Enhanced Context Management**: More sophisticated context tracking for longer narratives
2. **Character Integration**: Better integration of player and NPC characters into narrative
3. **Memory Mechanisms**: Long-term narrative memory for persistent game worlds
4. **Branching Storylines**: More complex narrative branching based on player choices
5. **Customizable Narrative Style**: Allow players to select preferred narrative styles