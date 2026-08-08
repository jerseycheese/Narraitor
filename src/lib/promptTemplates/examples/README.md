# Example Library System

A centralized system for managing prompt examples with intelligent token-aware selection.

## Overview

The Example Library System provides developers with a structured way to manage and include examples in AI prompts. Examples guide AI output style, format, and patterns while respecting token budget constraints.

## Key Features

- **Centralized Example Management**: All examples stored in one place (`exampleLibrary.ts`)
- **Token-Aware Selection**: Automatically selects examples based on available token budget
- **Priority-Based Filtering**: Critical examples are included first when budget is tight
- **Category-Based Organization**: Examples tagged by prompt type (scene, transition, choice, etc.)
- **Flexible Selection**: Filter by tags, priority level, and category

## Architecture

### Core Components

1. **ExampleManager** (`exampleManager.ts`): Manages example selection and token budgeting
2. **Example Library** (`exampleLibrary.ts`): Stores all prompt examples
3. **Example Helper** (`exampleHelper.ts`): Convenience functions for templates
4. **Types** (`types.ts`): TypeScript interfaces and types

## Usage

### For Template Developers

Import the helper functions in your prompt template:

```typescript
import { getExamplesForPrompt, shouldIncludeExamples } from '@/lib/promptTemplates/examples';

export const myTemplate = (context: any) => {
  const baseContent = `Your template content here...`;

  // Get examples if token budget allows
  const tokenBudget = 150;
  const contextLength = estimateTokenCount(context.recentContent || '');

  let examplesSection = '';
  if (shouldIncludeExamples(tokenBudget, contextLength)) {
    examplesSection = getExamplesForPrompt('scene', tokenBudget, {
      tags: ['formatting', 'perspective'],
      minPriority: 'high',
    });
  }

  return `${baseContent}${examplesSection}`;
};
```

### Adding New Examples

Add examples to `exampleLibrary.ts`:

```typescript
export const myExamples: PromptExample[] = [
  {
    id: 'unique-example-id',
    name: 'Descriptive Example Name',
    description: 'What this example demonstrates',
    content: 'The actual example text that shows the desired pattern',
    categories: ['scene', 'transition'], // Which prompt types this applies to
    priority: 'high', // critical | high | medium | low
    tags: ['formatting', 'style'], // Optional tags for filtering
  },
];

// Add to allExamples array
export const allExamples: PromptExample[] = [
  ...myExamples,
  // ... other examples
];
```

### Selection Options

```typescript
interface ExampleSelectionOptions {
  category: PromptCategory; // Required: which prompt type
  tokenBudget: number; // Required: max tokens for examples
  minPriority?: ExamplePriority; // Optional: minimum priority level
  tags?: string[]; // Optional: filter by tags
  maxExamples?: number; // Optional: limit number of examples
}
```

## Example Categories

- `scene` - Scene generation examples
- `transition` - Transition narrative examples
- `choice` - Player choice generation examples
- `skill-acknowledgment` - Skill usage acknowledgment examples
- `initial-scene` - Initial scene generation examples
- `action` - Action sequence examples
- `ending` - Story ending examples
- `all` - Universal examples that apply to all categories

## Priority Levels

Examples are selected in priority order when token budget is limited:

1. **critical** - Essential examples that should almost always be included
2. **high** - Important examples for guiding output quality
3. **medium** - Helpful examples when budget allows
4. **low** - Nice-to-have examples, included only when plenty of tokens available

## Token Budget Guidelines

The `shouldIncludeExamples()` helper determines if examples should be included:

- **< 50 tokens available**: No examples (budget too limited)
- **50-150 tokens**: Include only high/critical priority examples
- **150+ tokens**: Include more examples based on priority
- **5000+ chars context**: Skip examples (there's already enough context)

## Example Types in the Library

### Emphasis Examples
Demonstrate markdown formatting for dramatic effect in narratives.

### Perspective Examples
Show correct second-person perspective usage and common mistakes to avoid.

### Skill Acknowledgment Examples
Guide how to acknowledge skill success/failure naturally in narrative.

### Choice Examples
Demonstrate context summary writing and creative chaotic options.

### NPC Metadata Examples
Show correct vs incorrect NPC reference handling in metadata.

### Sensory Examples
Demonstrate varied sensory descriptions without repetition.

## Integration with Templates

Templates updated to use the Example Library System:

- `baseNarrativeTemplate.ts` - Uses emphasis and perspective examples
- `transitionTemplate.ts` - Uses perspective examples
- `sceneTemplate.ts` - Uses perspective and sensory examples
- `skillAcknowledgmentTemplate.ts` - Uses skill acknowledgment examples
- `playerChoiceTemplate.ts` - Uses choice and context summary examples

## API Reference

### getExamplesForPrompt()

```typescript
function getExamplesForPrompt(
  category: PromptCategory,
  tokenBudget: number = 150,
  options: Partial<ExampleSelectionOptions> = {}
): string
```

Returns formatted example string for inclusion in prompts.

### shouldIncludeExamples()

```typescript
function shouldIncludeExamples(
  availableTokens: number,
  contextLength: number = 0
): boolean
```

Determines if examples should be included based on constraints.

### ExampleManager.selectExamples()

```typescript
selectExamples(options: ExampleSelectionOptions): ExampleSelectionResult
```

Core selection method that returns examples, token count, and formatted content.

## Testing

Run tests with:

```bash
npm test -- src/lib/promptTemplates/examples/exampleManager.test.ts
```

Tests cover:
- Adding/removing examples
- Token-aware selection
- Priority filtering
- Tag filtering
- Category filtering
- Custom formatters
- Statistics tracking

## Benefits

1. **Maintainability**: All examples in one place, easy to update
2. **Token Efficiency**: Only includes examples when they fit the budget
3. **Quality Control**: Examples guide consistent AI output
4. **Flexibility**: Easy to add, update, or remove examples
5. **Type Safety**: Full TypeScript support with interfaces
6. **Testing**: Test coverage ensures reliability

## Future Enhancements

Potential improvements for the example library system:

- A/B testing different examples to measure impact on output quality
- Dynamic example selection based on AI model performance
- Per-user or per-world example customization
- Example effectiveness metrics and analytics
- Visual example library browser/editor UI
