---
title: Prompt Context API
tags: [prompt, context, api, ai]
created: 2025-05-12
updated: 2025-06-08
---

# Prompt Context API

System for providing structured world and character information to AI prompts. Handles token limits and context prioritization for narrative generation.

## Core Components

### ContextBuilder
Formats world and character data into structured markdown for AI consumption.

```typescript
import { ContextBuilder } from '@/lib/promptContext';

const builder = new ContextBuilder();
const worldContext = builder.buildWorldContext(worldData);
const characterContext = builder.buildCharacterContext(characterData);
const combinedContext = builder.buildCombinedContext(worldData, characterData);
```

**Methods:**
- `buildWorldContext(world: WorldContext): string` - Formats world data
- `buildCharacterContext(character: CharacterContext): string` - Formats character data  
- `buildCombinedContext(world, character): string` - Creates combined context

### ContextPrioritizer
Manages token limits and prioritizes context elements by importance.

```typescript
import { ContextPrioritizer } from '@/lib/promptContext';

// Default weights
const prioritizer = new ContextPrioritizer();

// Custom weights for combat scenarios
const combatWeights = {
  'character.attributes': 5,
  'character.skills': 5,
  'character.inventory': 4,
  'world.rules': 3
};
const customPrioritizer = new ContextPrioritizer(combatWeights);

const prioritized = prioritizer.prioritize(contextElements, tokenLimit);
```

**Default Priority Weights:**
- `character.current_state`: 5 (highest)
- `character.attributes`: 4
- `world.rules`: 4
- `character.skills`: 3
- `character.inventory`: 3
- `world.genre`: 3
- `event`: 3
- `world.description`: 2
- `character.backstory`: 1
- `world.history`: 1 (lowest)

### PromptContextManager
Main entry point for context generation.

```typescript
import { PromptContextManager } from '@/lib/promptContext';

const manager = new PromptContextManager();

const context = manager.generateContext({
  promptType: 'narrative',
  world: worldData,
  character: characterData,
  recentEvents: ['Found magical artifact'],
  tokenLimit: 500
});
```

**Context Options:**
```typescript
interface ContextOptions {
  promptType?: string;        // 'narrative', 'decision', 'summary'
  world?: WorldContext;       
  character?: CharacterContext;
  recentEvents?: string[];    
  currentSituation?: string;  
  tokenLimit?: number;        // Default: 1000
}
```

## Usage Examples

### Basic Usage
```typescript
const manager = new PromptContextManager();

const result = await manager.generateContext({
  promptType: 'narrative',
  world: {
    id: 'world-1',
    name: 'Eldoria',
    genre: 'fantasy',
    description: 'A magical realm of wizards and dragons',
    attributes: [{ id: 'str', name: 'Strength', description: 'Physical power' }]
  },
  character: {
    id: 'char-1',
    name: 'Gandalf',
    level: 15,
    attributes: [{ attributeId: 'str', name: 'Strength', value: 8 }]
  },
  tokenLimit: 500
});
```

### Template Integration
```typescript
import { PromptTemplateManager, PromptContextManager } from '@/lib/promptContext';

const templateManager = new PromptTemplateManager();
const contextManager = new PromptContextManager();

// Generate context
const context = contextManager.generateContext({
  world: worldData,
  character: characterData
});

// Process template with context
const prompt = templateManager.processTemplate('narrative-1', {
  context,
  situation: 'Entering the dark forest'
});
```

## Context Format

Generated context uses structured markdown:

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

## Skills:
- Fire Magic: 5
- Staff Combat: 4

## Key Items:
- Staff of Power (equipped)
- Healing Potion x3
```

## API Reference

### estimateTokenCount(text: string): number
Estimates token count using simplified approach (1 token ≈ 4 characters).

```typescript
import { estimateTokenCount } from '@/lib/promptContext';

const text = "This is a sample text to estimate token count.";
const tokenCount = estimateTokenCount(text);
```

### generateContext(options: ContextOptions): Promise<GenerateResult>
Generates prioritized context based on token limits.

```typescript
const result = await manager.generateContext({
  promptType: 'narrative',
  world: worldData,
  character: characterData,
  recentEvents: ['Defeated dragon', 'Found treasure'],
  tokenLimit: 500
});

// Returns:
// {
//   context: string,
//   estimatedTokenCount: number,
//   finalTokenCount: number,
//   contextRetentionPercentage: number
// }
```

## Error Handling

- Missing world/character data: Returns partial context
- Invalid token limits: Defaults to 1000 tokens  
- Empty data structures: Returns empty strings without errors

## Performance Notes

- Context generation is synchronous and lightweight
- Token estimation is O(n) based on content length
- No caching currently implemented (planned for future)
