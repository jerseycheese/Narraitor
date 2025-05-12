# Prompt Context Module

This module provides structured world and character context for AI prompts in the Narraitor project. It ensures AI-generated content is consistent with the game world and character state.

## Overview

The prompt context system consists of three main components:

1. **ContextBuilder** - Formats raw data into structured markdown
2. **ContextPrioritizer** - Manages token limits and element prioritization
3. **PromptContextManager** - Orchestrates context generation

## Quick Start

```typescript
import { PromptContextManager } from '@/lib/promptContext';

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

## Components

### ContextBuilder

Formats world and character data into AI-readable markdown sections:

```typescript
const builder = new ContextBuilder();

// Format world data
const worldContext = builder.buildWorldContext(worldData);

// Format character data  
const characterContext = builder.buildCharacterContext(characterData);

// Or combine both
const combined = builder.buildCombinedContext(worldData, characterData);
```

### ContextPrioritizer

Manages token limits and prioritizes context elements:

```typescript
const prioritizer = new ContextPrioritizer();

// Use default weights
const prioritized = prioritizer.prioritize(elements, tokenLimit);

// Or provide custom weights
const customPrioritizer = new ContextPrioritizer({
  'character.attributes': 5,
  'world.description': 2
});
```

### PromptContextManager

Main entry point that coordinates context generation:

```typescript
const manager = new PromptContextManager();

const context = manager.generateContext({
  promptType: 'decision',    // Context varies by prompt type
  world: worldData,          // World configuration
  character: characterData,  // Character state
  currentSituation: 'Facing a dragon',
  tokenLimit: 300
});
```

## Context Format

The generated context uses markdown formatting:

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

## Prioritization

The system prioritizes different context elements based on prompt type:

- **Narrative prompts** - Prioritize recent events
- **Decision prompts** - Prioritize character attributes  
- **Summary prompts** - Prioritize events over world details

Default priority weights:
- `character.current_state`: 5
- `character.attributes`: 4
- `world.rules`: 4
- `event`: 3
- `world.description`: 2

## Integration

Integrates seamlessly with the existing prompt template system:

```typescript
// Generate context
const context = contextManager.generateContext(options);

// Use in template
const processed = templateManager.processTemplate('narrative-1', {
  context,
  situation: 'Entering dark forest'
});
```

## Testing

Full test coverage is provided:
- Unit tests for each component
- Integration tests for the complete flow
- Edge case handling for missing data
- Token limit validation

Run tests with:
```bash
npm test src/lib/promptContext
```

## API Documentation

For detailed API documentation, see [Prompt Context API Guide](/docs/technical-guides/prompt-context-api.md).
