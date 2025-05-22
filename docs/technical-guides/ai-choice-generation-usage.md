# AI Choice Generation Usage Guide

This guide covers how to integrate and use the AI choice generation system in your Narraitor components.

## Quick Start

The easiest way to use AI choice generation is through the `GameSessionActiveWithNarrative` component:

```tsx
import { GameSessionActiveWithNarrative } from '@/components/GameSession';

function YourGameComponent() {
  return (
    <GameSessionActiveWithNarrative
      worldId="your-world-id"
      sessionId="your-session-id"
      onChoiceSelected={(choiceId) => {
        console.log('Player selected choice:', choiceId);
        // This automatically triggers new narrative generation
      }}
    />
  );
}
```

## Advanced Integration

### Manual Choice Generation

If you need more control over when choices are generated, use the `NarrativeController` directly:

```tsx
import { NarrativeController } from '@/components/Narrative';
import { Decision } from '@/types/narrative.types';

function CustomNarrativeComponent() {
  const [currentChoices, setCurrentChoices] = useState<Decision | null>(null);

  const handleChoicesGenerated = (decision: Decision) => {
    setCurrentChoices(decision);
    console.log('Generated choices:', decision.options);
  };

  return (
    <>
      <NarrativeController
        worldId="your-world-id"
        sessionId="your-session-id"
        generateChoices={true}
        onChoicesGenerated={handleChoicesGenerated}
      />
      
      {currentChoices && (
        <div>
          <h3>{currentChoices.prompt}</h3>
          {currentChoices.options.map((option) => (
            <button key={option.id} onClick={() => selectChoice(option.id)}>
              {option.text}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
```

### Using the Choice Generator Service Directly

For complete custom control, use the `ChoiceGenerator` service:

```tsx
import { ChoiceGenerator } from '@/lib/ai/choiceGenerator';
import { defaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { narrativeStore } from '@/state/narrativeStore';

async function generateCustomChoices(worldId: string, sessionId: string) {
  const choiceGenerator = new ChoiceGenerator(defaultGeminiClient);
  
  // Get recent narrative context
  const segments = narrativeStore.getState().getSessionSegments(sessionId);
  const recentSegments = segments.slice(-5); // Last 5 segments
  
  // Create narrative context
  const narrativeContext = {
    recentSegments,
    currentLocation: 'Custom Location',
    // Add more context as needed
  };
  
  try {
    const decision = await choiceGenerator.generateChoices({
      worldId,
      narrativeContext,
      characterIds: [], // Add character IDs if available
      maxOptions: 4,
      minOptions: 3
    });
    
    console.log('Generated decision:', decision);
    return decision;
  } catch (error) {
    console.error('Failed to generate choices:', error);
    // Handle error gracefully
    return null;
  }
}
```

## Configuration Options

### Choice Generation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `worldId` | string | required | ID of the world for context |
| `narrativeContext` | NarrativeContext | required | Recent story segments and context |
| `characterIds` | string[] | `[]` | Character IDs for personalization |
| `maxOptions` | number | `4` | Maximum number of choices to generate |
| `minOptions` | number | `3` | Minimum number of choices (fallbacks added if needed) |

### Narrative Context Structure

```typescript
interface NarrativeContext {
  recentSegments?: NarrativeSegment[];
  currentLocation?: string;
  world?: World;
  // Additional context properties
}
```

## Error Handling

The choice generation system includes comprehensive error handling:

### Automatic Fallbacks

If AI generation fails, the system provides default choices:

```typescript
// These fallback choices are automatically used when AI fails
const fallbackChoices = [
  { id: 'fallback-1', text: 'Investigate the area more carefully' },
  { id: 'fallback-2', text: 'Talk to someone nearby' },
  { id: 'fallback-3', text: 'Move to a different location' }
];
```

### Custom Error Handling

```tsx
const handleChoicesGenerated = (decision: Decision) => {
  if (!decision || decision.options.length === 0) {
    // Handle empty decision
    console.warn('No choices generated, using fallback system');
    return;
  }
  
  // Process valid decision
  setCurrentChoices(decision);
};
```

## Performance Optimization

### Context Management

Limit the narrative context to improve performance:

```tsx
// Use only the most recent segments for context
const contextSegments = allSegments.slice(-3); // Last 3 segments

// Or filter by relevance
const relevantSegments = allSegments.filter(segment => 
  segment.type === 'scene' || segment.type === 'dialogue'
);
```

### Caching Strategies

Consider implementing caching for repeated requests:

```typescript
const choiceCache = new Map<string, Decision>();

function getCachedChoices(contextKey: string): Decision | null {
  return choiceCache.get(contextKey) || null;
}

function setCachedChoices(contextKey: string, decision: Decision): void {
  choiceCache.set(contextKey, decision);
}
```

## Testing Your Integration

### Development Testing

1. **Use the dev harness**: Navigate to `/dev/narrative-system` to test choice generation
2. **Enable debug logging**: Temporarily add console.log statements to trace the generation flow
3. **Test error scenarios**: Disconnect internet to test fallback mechanisms

### Unit Testing Example

```typescript
import { ChoiceGenerator } from '@/lib/ai/choiceGenerator';
import { mockAIClient } from '@/lib/ai/__mocks__/geminiClient.mock';

describe('AI Choice Generation', () => {
  test('generates choices with valid context', async () => {
    const choiceGenerator = new ChoiceGenerator(mockAIClient);
    
    const result = await choiceGenerator.generateChoices({
      worldId: 'test-world',
      narrativeContext: {
        recentSegments: [
          { content: 'You enter a dark cave...', type: 'scene' }
        ]
      },
      characterIds: []
    });
    
    expect(result.options).toHaveLength(3);
    expect(result.prompt).toBeTruthy();
  });
});
```

## Best Practices

### 1. Context Quality

Provide rich, recent narrative context:

```tsx
// GOOD: Recent, relevant context
const context = {
  recentSegments: segments.slice(-5),
  currentLocation: currentLocation,
  world: worldData
};

// AVOID: Too much context or stale data
const context = {
  recentSegments: segments, // All segments - can be too much
  // Missing location and world data
};
```

### 2. Error Resilience

Always handle errors gracefully:

```tsx
const generateChoices = async () => {
  try {
    const choices = await choiceGenerator.generateChoices(params);
    if (choices && choices.options.length > 0) {
      setChoices(choices);
    } else {
      // Use fallback system
      setChoices(generateFallbackChoices());
    }
  } catch (error) {
    console.error('Choice generation failed:', error);
    setChoices(generateFallbackChoices());
  }
};
```

### 3. User Experience

Provide loading feedback:

```tsx
function ChoiceComponent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [choices, setChoices] = useState<Decision | null>(null);

  const generateChoices = async () => {
    setIsGenerating(true);
    try {
      const result = await choiceGenerator.generateChoices(params);
      setChoices(result);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {isGenerating ? (
        <div>Generating your choices...</div>
      ) : choices ? (
        <ChoiceSelector decision={choices} />
      ) : (
        <div>No choices available</div>
      )}
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Auto-Generation After Narrative

```tsx
const handleNarrativeGenerated = (segment: NarrativeSegment) => {
  // Automatically generate choices after narrative
  generatePlayerChoices();
};
```

### Pattern 2: Manual Choice Trigger

```tsx
const onPlayerAction = (action: string) => {
  if (action === 'need-choices') {
    generatePlayerChoices();
  }
};
```

### Pattern 3: Conditional Generation

```tsx
const shouldGenerateChoices = (segment: NarrativeSegment) => {
  return segment.type === 'scene' || segment.type === 'dialogue';
};
```

## Troubleshooting

### Common Issues

1. **No choices generated**: Check that narrative context is provided
2. **Slow generation**: Reduce context size or implement caching
3. **Irrelevant choices**: Ensure world data is included in context
4. **Crashes on errors**: Implement proper error boundaries

### Debug Checklist

- [ ] World ID is valid and world exists in store
- [ ] Narrative context contains recent segments
- [ ] AI client is properly configured
- [ ] Error handling is implemented
- [ ] Fallback mechanisms are working

---

This guide covers the core patterns for integrating AI choice generation. For more advanced scenarios, refer to the implementation files and test examples in the codebase.