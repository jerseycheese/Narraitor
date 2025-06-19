---
title: "Choice Alignment System"
type: feature
category: narrative
tags: [choice, alignment, narrative, personality]
created: 2025-06-01
updated: 2025-06-08
---

# Choice Alignment System

## Overview

The Choice Alignment System adds personality-driven narrative variety to player choices by generating options that reflect different character alignments: **Lawful**, **Neutral**, and **Chaotic**.

## Key Features

- **AI-Generated Aligned Choices**: Uses character personality and world context to generate thematically appropriate options
- **Visual Distinction**: Different styling for each alignment type
- **Custom Input Integration**: Players can still provide custom responses alongside generated choices
- **Context-Aware Generation**: Choices reflect the current narrative situation and character background

## Alignment Types

### Lawful
- **Philosophy**: Rule-following, honor-bound, methodical approaches
- **Visual Style**: Blue accent with structured appearance
- **Example Behaviors**: Following protocols, seeking official help, respecting authority

### Neutral
- **Philosophy**: Balanced, pragmatic, situational responses
- **Visual Style**: Gray accent with standard appearance  
- **Example Behaviors**: Investigating, gathering information, practical solutions

### Chaotic
- **Philosophy**: Unpredictable, creative, rule-breaking approaches
- **Visual Style**: Red accent with dynamic appearance
- **Example Behaviors**: Unconventional tactics, creative solutions, dramatic actions

## Implementation

### Type Definitions

```typescript
// Choice alignment types
export type ChoiceAlignment = 'lawful' | 'chaotic' | 'neutral';

// Extended decision option with alignment
interface DecisionOption {
  id: EntityID;
  text: string;
  alignment?: ChoiceAlignment;
  isCustomInput?: boolean;
  customText?: string;
}
```

### AI Integration

The system uses enhanced prompt templates that:
- Analyze character personality traits
- Consider current narrative context
- Generate 3-4 choices across different alignments
- Ensure each choice feels authentic to the character and situation

### UI Components

**ChoiceSelector Component** (`/src/components/shared/ChoiceSelector/`)
- Displays choices with alignment-based styling
- Handles custom input integration
- Provides accessibility features and keyboard navigation

## Usage

### For Developers

```typescript
// Generate aligned choices
const decision = await narrativeGenerator.generatePlayerChoices(
  worldId,
  narrativeContext,
  characterIds,
  { useAlignedChoices: true } // Enable alignment system
);

// Render with ChoiceSelector
<ChoiceSelector
  decision={decision}
  onSelect={handleChoiceSelected}
  onCustomSubmit={handleCustomSubmit}
  enableCustomInput={true}
/>
```

### For Content Creators

When designing worlds and characters:
- **Character Personalities**: Define clear personality traits that influence choice generation
- **World Themes**: Establish genre conventions that guide alignment interpretations
- **Narrative Context**: Provide rich scene descriptions for better choice relevance

## Technical Architecture

### Files Modified/Added

- `src/types/narrative.types.ts` - Core type definitions
- `src/lib/promptTemplates/templates/narrative/choiceTypeTemplates.ts` - AI prompt templates
- `src/components/shared/ChoiceSelector/ChoiceSelector.tsx` - UI component
- `src/lib/ai/choiceGenerator.ts` - Choice generation logic
- `src/components/Narrative/NarrativeController.tsx` - Integration layer

### State Management

Choices are managed through the narrative store:
- Decisions stored with full alignment metadata
- Custom input properly integrated with generated options
- Persistent across game sessions

## Testing

The system includes comprehensive tests:
- **Storybook Stories**: Visual testing of all alignment types
- **Unit Tests**: Choice generation and parsing logic
- **Integration Tests**: End-to-end choice flow with custom input

## Configuration

### Enabling/Disabling

```typescript
// In narrative generation
const params: ChoiceGenerationParams = {
  worldId,
  narrativeContext,
  characterIds,
  useAlignedChoices: true // Set to false for standard choices
};
```

### Customizing Alignments

Modify `choiceTypeTemplates.ts` to adjust:
- Alignment definitions and examples
- Context-specific behavior patterns
- Character trait interpretations

## Best Practices

1. **Balance**: Ensure all alignment types feel viable and interesting
2. **Context**: Ground choices in the current narrative situation
3. **Character Voice**: Maintain consistency with established character personality
4. **Accessibility**: Provide clear visual and text indicators for choice types
5. **Fallbacks**: Always provide meaningful fallback choices if AI generation fails

## Future Enhancements

- **Custom Alignments**: Support for user-defined alignment systems
- **Alignment History**: Track player alignment preferences over time
- **Dynamic Scaling**: Adjust choice complexity based on narrative tension
- **Multi-Character**: Handle party-based scenarios with multiple character alignments