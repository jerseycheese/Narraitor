---
title: "Narrative Generation System"
type: architecture
category: narrative
tags: [narrative, ai, generation]
created: 2025-05-20
updated: 2025-06-08
---

# Narrative Generation System

This is the heart of what makes Narraitor special - AI that doesn't just generate random text, but actually creates coherent stories that feel like they belong in your world. Whether you're in a cyberpunk dystopia or a medieval fantasy realm, the AI adapts its language, tone, and content to match.

## Overview

The narrative system is built from several pieces that work together to create consistent, engaging stories:

1. **NarrativeGenerator Service**: The AI engine that actually creates the story content
2. **Template Manager**: Different prompt templates for different story moments (openings, transitions, etc.)
3. **Context Management**: Keeps track of what's happened so far so the story makes sense
4. **Component System**: React components that handle the UI side of storytelling
5. **State Management**: Stores all the narrative content using Zustand

## Usage Guide

### Basic Usage

The simplest way to add narrative generation to a game session:

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

This is where the magic happens - the AI actually understands what kind of world you've created and adapts accordingly:

1. **Theme-Based Content**: A Western world feels like the Wild West, not generic fantasy
2. **Smart Starting Locations**: No more starting in taverns when you're on a space station:
   - Western worlds start in "Frontier Town"
   - Fantasy worlds start in "Enchanted Forest"
   - Sci-Fi worlds start in "Space Station"
3. **Tone Settings Integration**: Whether you want family-friendly adventures or gritty noir stories
4. **Attribute Integration**: Your world's custom attributes actually matter in the narrative

### Prompt Template System

Different moments in the story need different approaches, so we have specialized templates:

1. **Initial Scene Template**: Sets the stage for a new adventure
2. **Scene Template**: Handles the main story beats
3. **Transition Template**: Smoothly connects different narrative moments

### Tone Settings System

The narrative generation system respects user-defined tone settings for consistent content:

1. **Content Rating Enforcement**: Supports G, PG, PG-13, R, and NC-17 ratings with appropriate content filtering
2. **Narrative Style Options**: Nine styles including serious, humorous, dramatic, mysterious, action-packed, and more
3. **Language Complexity Control**: Four levels from simple to literary with specific vocabulary and sentence structure guidance
4. **Custom Instructions**: Additional user-defined tone requirements
5. **AI Safety Integration**: Dynamic safety thresholds based on content rating
6. **Debug Logging**: Comprehensive logging for tone settings verification

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