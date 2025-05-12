# Prompt Context API

The prompt context system provides structured world and character information for AI prompts, ensuring the AI has relevant context when generating narrative content, decisions, and other game elements.

## Overview

The prompt context system consists of three main components that work together to format, prioritize, and deliver context information to AI prompts:

- **ContextBuilder**: Formats world and character data into structured markdown sections
- **ContextPrioritizer**: Manages token limits and prioritizes context elements based on configurable weights
- **PromptContextManager**: Orchestrates context generation with integration to existing prompt templates

## Core Components

### ContextBuilder

The `ContextBuilder` class is responsible for formatting raw world and character data into structured, AI-readable context strings.

```typescript
import { ContextBuilder } from '@/lib/promptContext';

const builder = new ContextBuilder();

// Build world context
const worldContext = builder.buildWorldContext(worldData);

// Build character context
const characterContext = builder.buildCharacterContext(characterData);

// Build combined context
const combinedContext = builder.buildCombinedContext(worldData, characterData);
```

#### Methods

- `buildWorldContext(world: WorldContext): string` - Formats world data including genre, description, attributes, and skills
- `buildCharacterContext(character: CharacterContext): string` - Formats character data including name, level, attributes, skills, and inventory
- `buildCombinedContext(world: WorldContext, character: CharacterContext): string` - Creates a combined context with both world and character sections

### ContextPrioritizer

The `ContextPrioritizer` class manages token limits and prioritizes context elements based on their importance and relevance.

```typescript
import { ContextPrioritizer } from '@/lib/promptContext';

// Use default weights
const prioritizer = new ContextPrioritizer();

// Or provide custom weights
const customWeights = {
  'character.attributes': 5,
  'world.description': 2
};
const customPrioritizer = new ContextPrioritizer(customWeights);

// Prioritize context elements
const prioritized = prioritizer.prioritize(contextElements, tokenLimit);
```

#### Default Priority Weights

- `character.current_state`: 5
- `character.attributes`: 4
- `character.skills`: 3
- `character.inventory`: 3
- `character.backstory`: 1
- `world.rules`: 4
- `world.genre`: 3
- `world.description`: 2
- `world.history`: 1
- `event`: 3

#### Methods

- `prioritize(elements: ContextElement[], tokenLimit: number): ContextElement[]` - Prioritizes and filters elements based on token limit
- `calculatePriority(element: ContextElement): number` - Calculates priority score for an element
- `estimateTokens(content: string): number` - Estimates token count using chars/4 heuristic

### PromptContextManager

The `PromptContextManager` class is the main entry point for generating context, coordinating between the builder and prioritizer components.

```typescript
import { PromptContextManager } from '@/lib/promptContext';

const manager = new PromptContextManager();

// Generate context for narrative prompts
const context = manager.generateContext({
  promptType: 'narrative',
  world: worldData,
  character: characterData,
  recentEvents: ['Found magical artifact'],
  tokenLimit: 500
});
```

#### Context Options

```typescript
interface ContextOptions {
  promptType?: string;        // 'narrative', 'decision', 'summary'
  world?: WorldContext;       // World configuration data
  character?: CharacterContext; // Character data
  recentEvents?: string[];    // Recent game events
  currentSituation?: string;  // Current game situation
  tokenLimit?: number;        // Maximum tokens (default: 1000)
}
```

## Usage Examples

### Basic Usage

```typescript
import { PromptContextManager } from '@/lib/promptContext';

const manager = new PromptContextManager();

// Generate narrative context
const narrativeContext = manager.generateContext({
  promptType: 'narrative',
  world: {
    id: 'world-1',
    name: 'Eldoria',
    genre: 'fantasy',
    description: 'A magical realm of wizards and dragons',
    attributes: [
      { id: 'str', name: 'Strength', description: 'Physical power' }
    ]
  },
  character: {
    id: 'char-1',
    name: 'Gandalf',
    level: 15,
    attributes: [
      { attributeId: 'str', name: 'Strength', value: 8 }
    ]
  },
  tokenLimit: 500
});
```

### Integration with Prompt Templates

```typescript
import { PromptTemplateManager } from '@/lib/promptTemplates';
import { PromptContextManager } from '@/lib/promptContext';

const templateManager = new PromptTemplateManager();
const contextManager = new PromptContextManager();

// Create a narrative template
const template = {
  id: 'narrative-1',
  type: PromptType.NARRATIVE,
  content: '{{context}}\n\nGenerate narrative for: {{situation}}',
  variables: [
    { name: 'context', description: 'World and character context' },
    { name: 'situation', description: 'Current situation' }
  ]
};

templateManager.addTemplate(template);

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

### Custom Prioritization

```typescript
import { ContextPrioritizer, PromptContextManager } from '@/lib/promptContext';

// Create custom prioritizer for combat-focused prompts
const combatWeights = {
  'character.attributes': 5,
  'character.skills': 5,
  'character.inventory': 4,
  'world.rules': 3,
  'event': 2
};

const prioritizer = new ContextPrioritizer(combatWeights);

// Use in context generation
const manager = new PromptContextManager();
const context = manager.generateContext({
  promptType: 'combat',
  world: worldData,
  character: characterData,
  currentSituation: 'Facing a dragon',
  tokenLimit: 300
});
```

## Context Format

The generated context uses markdown formatting for clear structure:

```markdown
# World: Eldoria
Genre: fantasy
A magical realm of wizards and dragons

## Attributes:
- Strength: Physical power
- Intelligence: Mental acuity

## Skills:
- Swordsmanship: Mastery of blade combat
- Fire Magic: Control over flames

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

## Token Estimation

The system uses a simple MVP approach for token estimation:
- 1 token ≈ 4 characters
- This provides reasonable accuracy for planning context inclusion
- Future versions may implement more sophisticated tokenization

## Error Handling

The system gracefully handles missing or invalid data:
- Missing world or character data returns partial context
- Invalid token limits default to 1000 tokens
- Empty data structures return empty strings without errors

## Performance Considerations

- Context generation is synchronous and lightweight
- Token estimation is O(n) based on content length
- Prioritization sorts elements once per generation
- No caching is currently implemented (planned for future)

## Future Enhancements

Planned improvements include:
- More accurate token estimation
- Context caching for unchanged data
- Additional context types (location, quest, etc.)
- Configurable formatting options
- Performance optimizations for large contexts
