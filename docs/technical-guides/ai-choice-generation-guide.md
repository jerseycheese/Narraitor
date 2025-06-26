---
title: AI Choice Generation Guide
tags: [ai, choices, narrative, integration]
created: 2025-06-26
updated: 2025-06-26
---

# AI Choice Generation Guide

Generate contextual player choices using AI within the narrative system.

## Quick Start

Use the all-in-one component for automatic choice generation:

```tsx
import { GameSessionActiveWithNarrative } from '@/components/GameSession';

<GameSessionActiveWithNarrative
  worldId="world-id"
  sessionId="session-id"
  onChoiceSelected={(choiceId) => {
    // Choice automatically processed
  }}
/>
```

## Choice Types

### AI-Generated Choices
- 3-4 contextual options based on current narrative
- Generated automatically using world context
- Filtered for appropriate difficulty and tone

### Custom Player Input
- Free-text input for player actions
- Processed through same narrative pipeline
- Allows creative player expression

## Manual Integration

### Custom Choice Generation
```tsx
import { NarrativeController } from '@/components/Narrative';

const [choices, setChoices] = useState<Decision | null>(null);

<NarrativeController
  worldId="world-id"
  sessionId="session-id"
  generateChoices={true}
  onChoicesGenerated={(decision) => {
    setChoices(decision);
  }}
/>

{choices && (
  <div>
    <h3>{choices.prompt}</h3>
    {choices.options.map((option) => (
      <button key={option.id} onClick={() => selectChoice(option.id)}>
        {option.text}
      </button>
    ))}
  </div>
)}
```

### Direct Service Usage
```tsx
import { ChoiceGenerator } from '@/lib/ai/choice-generator';

const generator = new ChoiceGenerator();

// Generate choices
const choices = await generator.generateChoices({
  worldId: 'world-id',
  sessionId: 'session-id',
  context: narrativeContext,
  numChoices: 4
});

// Process custom input
const customChoice = await generator.processCustomInput({
  worldId: 'world-id',
  sessionId: 'session-id',
  playerInput: 'I examine the mysterious door'
});
```

## Configuration Options

### Choice Generation Settings
```typescript
interface ChoiceGenerationConfig {
  numChoices: number;        // 3-4 recommended
  difficulty: 'easy' | 'medium' | 'hard';
  tone: 'serious' | 'humorous' | 'dramatic';
  allowCustomInput: boolean; // Enable free-text input
  maxCustomLength: number;   // Character limit for custom input
}
```

### Context Configuration
```typescript
interface ChoiceContext {
  currentNarrative: string;
  characterState: CharacterState;
  worldState: WorldState;
  recentChoices: Choice[];   // Last 3-5 choices for context
}
```

## State Management

### Using Narrative Store
```tsx
import { useNarrativeStore } from '@/state/narrativeStore';

const {
  currentChoices,
  isGeneratingChoices,
  selectChoice,
  submitCustomInput,
  error
} = useNarrativeStore();

// Select AI-generated choice
const handleChoiceSelect = (choiceId: string) => {
  selectChoice(choiceId);
};

// Submit custom input
const handleCustomInput = (input: string) => {
  submitCustomInput(input);
};
```

### Manual State Handling
```tsx
const [choiceState, setChoiceState] = useState({
  choices: null,
  loading: false,
  error: null
});

const generateChoices = async () => {
  setChoiceState(prev => ({ ...prev, loading: true }));
  
  try {
    const choices = await ChoiceGenerator.generate(context);
    setChoiceState({ choices, loading: false, error: null });
  } catch (error) {
    setChoiceState({ choices: null, loading: false, error });
  }
};
```

## Best Practices

### Choice Quality
- Provide rich narrative context for better choices
- Include character attributes and skills in context
- Limit to 3-4 choices to avoid decision paralysis
- Ensure choices feel meaningful and distinct

### Performance
- Cache generated choices for short periods
- Generate choices asynchronously
- Show loading states during generation
- Handle generation failures gracefully

### User Experience
- Preview choice consequences when possible
- Allow players to cancel/back out of choices
- Provide clear feedback when choices are processed
- Maintain choice history for narrative continuity

## Error Handling

### Common Issues
```tsx
// Generation timeout
if (error?.code === 'GENERATION_TIMEOUT') {
  return <div>Choice generation taking longer than expected...</div>;
}

// API rate limit
if (error?.code === 'RATE_LIMIT') {
  return <div>Please wait before generating more choices.</div>;
}

// Invalid context
if (error?.code === 'INVALID_CONTEXT') {
  return <div>Unable to generate choices. Please check your session.</div>;
}
```

### Fallback Options
```tsx
const fallbackChoices = [
  { id: 'continue', text: 'Continue the story' },
  { id: 'examine', text: 'Look around carefully' },
  { id: 'wait', text: 'Wait and see what happens' }
];

// Use fallback if generation fails
const displayChoices = choices || fallbackChoices;
```

## Testing

### Mock Choice Generation
```typescript
// For testing/development
const mockChoices = {
  prompt: 'What do you do next?',
  options: [
    { id: 'choice1', text: 'Approach the stranger' },
    { id: 'choice2', text: 'Hide behind the building' },
    { id: 'choice3', text: 'Call out to them' }
  ]
};
```

### Test Harness
Create test page at `/dev/choice-generation` to:
- Test different narrative contexts
- Verify choice quality and variety
- Test custom input processing
- Validate error handling

## Related Components
- `/components/GameSession/GameSessionActiveWithNarrative`
- `/components/Narrative/NarrativeController`
- `/components/Narrative/ChoiceDisplay`
- `/lib/ai/choice-generator`