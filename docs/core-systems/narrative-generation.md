---
title: "Narrative Generation System"
type: architecture
category: narrative
tags: [narrative, ai, generation, inventory]
created: 2025-05-20
updated: 2025-10-11
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

The narrative generator respects user-defined tone settings to keep the content consistent with what you want. The system actually enforces these settings instead of just suggesting them to the AI, which matters for maintaining consistent story quality.

Key settings include:

- **Content Rating**: G to NC-17 with appropriate filtering - stricter for G-rated content, more permissive for mature ratings
- **Narrative Style**: Nine options (serious, humorous, dramatic, mysterious, action-packed, etc.) so a noir detective story feels genuinely different from a lighthearted fantasy adventure
- **Language Complexity**: Four levels from simple to literary, affecting vocabulary and sentence structure - matters because stories for younger readers need different phrasing than adult content
- **Custom Instructions**: Additional tone requirements that the standard options don't cover
- **AI Safety Integration**: Dynamically adjusts safety thresholds based on content rating
- **Debug Logging**: Available for verifying tone settings are actually being applied to prompts

### Inventory Integration

The narrative generator can reference items from the character's inventory when it makes sense for the story. The system doesn't force item mentions into every paragraph - instead, it provides context about what the player is carrying and lets the AI naturally weave that into the narrative when appropriate.

The prioritization algorithm ranks items by narrative significance. Quest items and equipment score highest since they're most likely to matter in the story. Recently acquired items (picked up in the last 24-72 hours) get a priority boost because they're fresh and relevant. Unique items are preferred over common ones, and items with detailed descriptions are considered more significant than generic ones.

To avoid overwhelming the AI prompt with too much inventory data, the system limits context to the top 8 most significant items. This gives the AI enough to work with without cluttering the prompt. The AI is explicitly instructed to only mention items when they're contextually relevant and to vary how it references them to prevent repetition.

Inventory context gets added to initial scene generation (so the AI knows what you start with), ongoing narrative segments (for natural references during the story), and skill acknowledgment narratives (so the AI can reference tools or items you're using).

### Item Usage Integration

When players use items during gameplay, the system generates dedicated narrative segments describing what happens. This creates a direct narrative response to item usage that feels immediate and contextual rather than just updating inventory numbers.

The item usage flow works through the narrative generator with specific instructions. The AI gets told to describe the physical action of using the item, show sensory details, and demonstrate how it affects the current situation. The generator also receives context about whether the item was consumed and how many remain if it's stackable.

For stackable items with multiple units, the AI naturally incorporates remaining quantity into the narrative. Use one healing potion from a stack of five and the narrative might say "You down one of your healing potions, the familiar warmth spreading through your body. Four more vials clink reassuringly in your pack." Use the last one and it emphasizes scarcity: "You uncork your final healing potion, knowing this is all you have left."

The system creates these narratives as "action" type segments with `item-usage` tags, which helps track item usage moments in the narrative history. Significant items (quest items, equipment, documents, valuables) also generate journal entries so players have a permanent record of important usage moments.

When AI generation fails or context is unavailable, the system falls back to simple descriptive text that still communicates what happened. This ensures players always get feedback about item usage even if the fancy AI-generated narrative isn't available.

The narrative generation respects all the usual context - world tone settings, current location, recent story events - so item usage feels integrated into the ongoing story rather than disconnected game mechanic text.

### Narrative Perspective

The narrative system consistently uses second-person perspective ("you") to create an immersive experience. The AI understands that the player IS the named character, so all narration uses "you" instead of the character name. Character names only appear when NPCs are addressing the player in dialogue, which creates a direct, personal connection to the story instead of reading about someone else's adventure.

### Deduplication and Error Prevention

The system includes several safeguards to prevent common issues. Initial scene deduplication ensures you don't get multiple opening scenes generated for the same session - it happened during early testing and was confusing. Choice tracking prevents the same choice from triggering multiple narrative generations, which could happen if a player clicked quickly or if the UI re-rendered.

Component lifecycle management prevents state updates after a component unmounts, which React will complain about loudly. Error recovery handles AI service failures gracefully instead of crashing, and JSON parsing includes fallbacks for different response formats since the AI doesn't always return perfectly structured JSON.

## Error Handling

The narrative system handles several types of errors that can come up during generation. When errors occur, the system displays appropriate messages to users instead of showing raw error text or crashing, and attempts recovery when possible.

Error types handled:

- **AI Service Errors**: When the AI service fails to generate content - maybe overloaded or having issues
- **JSON Parsing Errors**: AI response format is unexpected, which happens more often than you'd think since AI responses can be inconsistent
- **Network Errors**: Straightforward communication failures between client and server
- **Session-Related Errors**: Issues with session management or data retrieval from stores

Recovery strategies include retrying failed requests with exponential backoff and falling back to default content if the AI is unavailable.

## Testing

### Manual Testing

The system includes a test harness at `/dev/narrative-system` for manual testing. You can generate initial narrative for different world themes to see how genre adaptation works, make player choices to verify narrative continuity, create new sessions to test initialization, and deliberately create edge case scenarios to test error handling. It's useful for catching issues that automated tests miss, particularly around the AI's actual output quality.

### Automated Testing

Unit tests cover the key components:

- **narrativeGenerator.test.ts**: Core generation functionality including prompt building and response parsing
- **NarrativeController.test.tsx**: Controller component behavior around state management and lifecycle
- **NarrativeDisplay.test.tsx**: Display component rendering of narrative segments

## Future Enhancements

There are several areas where the narrative system could be extended. Enhanced context management would allow more sophisticated tracking for longer narratives - right now the context window is pretty limited. Better character integration would improve how player and NPC characters interact in the narrative, making relationships and character development feel more natural.

Long-term narrative memory for persistent game worlds would be useful for players who want to continue stories across multiple sessions. More complex branching storylines based on player choices could create more meaningful consequences for decisions. Allowing players to select their preferred narrative style (beyond just tone settings) would let them customize the storytelling experience even further.