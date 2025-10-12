---
title: Prompt Context API
tags: [prompt, context, api, ai]
created: 2025-05-12
updated: 2025-06-08
---

# Prompt Context API

The AI needs to understand your world and character to generate good stories, but it can only process so much information at once. The prompt context system handles the tricky job of deciding what information to include and how to format it for the AI.

## Core Components

### ContextBuilder
Takes your world and character data and formats it into clean, structured markdown that AI models can understand easily.

```typescript
import { ContextBuilder } from '@/lib/promptContext/contextBuilder';

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
When you have more information than the AI can handle, this decides what to keep and what to drop. It uses importance weights to make smart choices.

```typescript
import { ContextPrioritizer } from '@/lib/promptContext/contextPrioritizer';

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
The main class you'll use - it brings together the builder and prioritizer to create the final context for AI prompts.

```typescript
import { PromptContextManager } from '@/lib/promptContext/promptContextManager';

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
import { PromptContextManager } from '@/lib/promptContext/promptContextManager';
import { PromptTemplateManager } from '@/lib/promptTemplates/promptTemplateManager';

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

The system outputs clean, structured markdown that AI models can parse easily:

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
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';

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

### buildInventoryContext(items: InventoryItem[], options?: InventoryContextOptions): InventoryContextResult

Takes a character's inventory and formats it for AI prompts. The system prioritizes items that matter to the story - equipped gear, quest artifacts, recently acquired items - and keeps the output within token limits so it doesn't overwhelm the AI with mundane junk.

```typescript
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';

const { context } = buildInventoryContext(characterInventoryItems, {
  equippedItemIds: ['item-sword'],
  tokenLimit: 160,
});

/* Produces:
## Inventory Summary
- [Equipped] Sword of Dawn (equipment, qty 1, acquired via quest on 2025-06-01) — Radiant blade that channels sunlight.
- Healing Potion (consumables, qty 3, acquired via purchase on 2025-06-02) — Restores moderate health.
+ 2 more items not shown to stay within token limits.
*/
```

The builder sorts items by importance: equipped status first, then category priority (quest items beat consumables), then recency of acquisition. Each line includes metadata about when and how the item was acquired, which helps the AI reference items naturally in narrative.

Defaults to 180 tokens and 8 items max. When it needs to truncate, it appends a summary line and removes lower-priority items to fit that summary within the token budget.

## Error Handling

The system is designed to fail gracefully:

- Missing world/character data: Returns partial context with what's available
- Invalid token limits: Defaults to 1000 tokens and keeps going
- Empty data structures: Returns empty strings without throwing errors

## Performance Notes

- Context generation is synchronous and lightweight
- Token estimation is O(n) based on content length
- No caching currently implemented (planned for future)
