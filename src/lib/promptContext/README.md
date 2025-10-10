# Prompt Context Module

This module provides structured world and character context for AI prompts in Narraitor. The basic problem it solves is making sure AI-generated content is consistent with the game world and character state - so if your character is a wizard in a fantasy world, the AI doesn't suddenly start talking about spaceships.

## Why This Exists

When you're generating narrative content with AI, context is everything. Without proper context, the AI might generate a story that completely ignores your character's abilities, the world's rules, or recent events. This module takes all that scattered information and formats it into something the AI can understand and use effectively.

## How It Works

The system has three main components that work together:

**ContextBuilder** - Takes raw data from your world and character objects and formats it into structured markdown that's easy for AI to parse.

**ContextPrioritizer** - Manages token limits by prioritizing different pieces of context. If you're hitting token limits, it'll keep the most important stuff (like character attributes) and drop less critical details.

**PromptContextManager** - The main orchestrator that brings everything together and generates the final context based on what type of prompt you're creating.

## Basic Usage

```typescript
import { PromptContextManager } from '@/lib/promptContext/promptContextManager';

const manager = new PromptContextManager();

// Generate context for a narrative prompt
const context = manager.generateContext({
  promptType: 'narrative',
  world: worldData,
  character: characterData,
  recentEvents: ['Defeated the dragon', 'Found treasure'],
  tokenLimit: 500
});
```

## Working with Individual Components

If you need more control, you can use the components directly:

```typescript
import { ContextBuilder } from '@/lib/promptContext/contextBuilder';

const builder = new ContextBuilder();

// Format just world data
const worldContext = builder.buildWorldContext(worldData);

// Format just character data  
const characterContext = builder.buildCharacterContext(characterData);

// Or combine both
const combined = builder.buildCombinedContext(worldData, characterData);
```

For prioritization with custom weights:

```typescript
import { ContextPrioritizer } from '@/lib/promptContext/contextPrioritizer';

const prioritizer = new ContextPrioritizer({
  'character.attributes': 5,    // High priority
  'world.description': 2        // Lower priority
});

const prioritized = prioritizer.prioritize(elements, tokenLimit);
```

## Context Format

The generated context uses markdown formatting that's designed to be clear for both humans and AI:

```markdown
# World: Eldoria
Genre: fantasy
A magical realm of wizards and dragons

## Attributes:
- Strength: Physical power
- Intelligence: Mental acuity

# Character: Gandalf
Level: 15
A wise and powerful wizard

## Attributes:
- Strength: 8
- Intelligence: 18

## Key Items:
- Staff of Power (equipped)
- Healing Potion x3
```

## Smart Prioritization

The system prioritizes different context elements based on what type of prompt you're creating:

- **Narrative prompts** - Recent events matter most for story continuity
- **Decision prompts** - Character attributes are crucial for determining available options
- **Summary prompts** - Events take priority over detailed world descriptions

Default priority weights:
- `character.current_state`: 5 (highest)
- `character.attributes`: 4
- `world.rules`: 4
- `event`: 3
- `world.description`: 2 (lowest)

## Integration with Templates

This works seamlessly with the existing prompt template system:

```typescript
// Generate context
const context = contextManager.generateContext(options);

// Use in template
const processed = templateManager.processTemplate('narrative-1', {
  context,
  situation: 'Entering dark forest'
});
```

So you can have templates that include `{{context}}` placeholders, and this module fills them with all the relevant world and character information.

## Token Management

The system includes token management to ensure generated context fits within AI service limits:

```typescript
import { PromptContextManager } from '@/lib/promptContext/promptContextManager';
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';

// Estimate tokens for any text
const text = "This is a sample text to estimate token count.";
const tokens = estimateTokenCount(text);

// Generate context with metrics
const result = await manager.generateContext({
  promptType: 'narrative',
  world: worldData,
  character: characterData,
  recentEvents: ['Defeated the dragon', 'Found treasure'],
  tokenLimit: 500
});

// Check how well it fit
console.log(`Estimated tokens: ${result.estimatedTokenCount}`);
console.log(`Final tokens: ${result.finalTokenCount}`);
console.log(`Retention percentage: ${result.contextRetentionPercentage}%`);
```

The token management provides:
- Token estimation for any text string
- Automatic prioritization to fit token limits
- Metrics on original vs. final token counts
- Percentage of context retained after prioritization

## Testing

Full test coverage is included:

```bash
npm test src/lib/promptContext
```

The tests cover unit tests for each component, integration tests for the complete flow, edge case handling for missing data, and token limit validation.

This system makes it much easier to generate consistent, contextually-appropriate AI content without having to manually format context for every request.
