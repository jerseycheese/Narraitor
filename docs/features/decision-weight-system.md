# Decision Weight System

## Overview

The Decision Weight System provides visual prominence indicators for player choices, guiding attention to more important narrative decisions through AI-determined importance levels and corresponding visual styling.

## Features

### Decision Weight Levels

**Minor Decisions**
- **Visual Style**: Subtle styling with minimal visual prominence
- **CSS Classes**: `border-0 bg-gray-500/5`
- **Use Cases**: Routine choices, casual conversations, basic exploration
- **Example**: "What will you have for breakfast?"

**Major Decisions**
- **Visual Style**: Amber borders with moderate shadows for enhanced visibility
- **CSS Classes**: `border-2 border-amber-400 bg-amber-50/60 shadow-md shadow-amber-200`
- **Use Cases**: Important story moments, character relationships, significant paths
- **Example**: "The dragon offers you a deal. How do you respond?"

**Critical Decisions**
- **Visual Style**: Red borders with strong shadows for maximum prominence
- **CSS Classes**: `border-4 border-red-500 bg-red-50/50 shadow-lg shadow-red-200`
- **Use Cases**: Life-changing moments, climactic choices, fate-determining decisions
- **Example**: "The kingdom's fate hangs in the balance. What is your final choice?"

### AI-Generated Context Summaries

Instead of retelling the story, the AI generates meaningful context that explains why a decision matters:

- **Focus on Stakes**: "Tension builds as you must choose how to respond to the merchant's accusation."
- **Relationship Impact**: "A critical moment where your response could determine if the alliance forms."
- **Consequence Preview**: "The stranger's offer seems too good to be true."

## Implementation

### Template Integration

The system integrates with narrative templates to instruct the AI on decision weight determination:

```typescript
FORMAT (REQUIRED - include alignment tags, decision weight, and context summary):
Decision Weight: [MINOR/MAJOR/CRITICAL]
Context Summary: [Brief explanation of why this decision matters]
Decision: What will you do?

Options:
1. [LAWFUL] [Choice following rules/authority]
2. [NEUTRAL] [Balanced/practical approach]
3. [NEUTRAL] [Alternative practical approach]
4. [CHAOTIC] [Wildly unexpected action]
```

### Component Usage

**ChoiceSelector Component**
```tsx
<ChoiceSelector
  decision={{
    id: 'decision-1',
    prompt: 'What will you do?',
    options: [...],
    decisionWeight: 'major', // AI-determined weight
    contextSummary: 'A pivotal moment in your quest...' // AI-generated context
  }}
  onSelect={handleChoice}
/>
```

### Visual Styling Function

```typescript
const getDecisionWeightStyling = (weight?: DecisionWeight) => {
  switch (weight) {
    case 'critical':
      return {
        container: 'border-4 border-red-500 bg-red-50/50 shadow-lg shadow-red-200',
        dot: 'bg-red-600',
        label: 'text-red-800'
      };
    case 'major':
      return {
        container: 'border-2 border-amber-400 bg-amber-50/60 shadow-md shadow-amber-200',
        dot: 'bg-amber-600',
        label: 'text-amber-800'
      };
    case 'minor':
    default:
      return {
        container: 'border-0 bg-gray-500/5',
        dot: 'bg-gray-600',
        label: 'text-gray-800'
      };
  }
};
```

## Type Definitions

```typescript
export type DecisionWeight = 'minor' | 'major' | 'critical';

export interface Decision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: string;
  decisionWeight?: DecisionWeight;
  contextSummary?: string;
}
```

## User Experience

### Visual Hierarchy
- **Progressive Disclosure**: More important decisions naturally draw attention
- **Accessibility**: Color-blind friendly with border thickness variations
- **Consistency**: Uniform styling across all narrative interfaces

### Player Guidance
- **Intuitive Understanding**: Visual cues immediately communicate decision importance
- **Strategic Thinking**: Players can quickly identify consequential moments
- **Immersion**: Seamless integration doesn't break narrative flow

## Development Guidelines

### AI Prompt Engineering
- Provide clear weight criteria in templates
- Include specific examples for each weight level
- Ensure context summaries focus on stakes, not story recap

### Testing
- Use Storybook stories for visual verification
- Test all weight levels with representative decisions
- Verify accessibility with screen readers

### Maintenance
- Monitor AI weight determination accuracy
- Adjust prompt templates based on user feedback
- Keep visual styling consistent across components

## Storybook Documentation

Access comprehensive visual examples at:
- `ChoiceSelector` → `MinorDecision`
- `ChoiceSelector` → `MajorDecision` 
- `ChoiceSelector` → `CriticalDecision`
- `ActiveGameSession` → `WithExistingSegments`

## Related Systems

- **Choice Alignment System**: Works alongside decision weights for comprehensive choice presentation
- **Narrative Generation**: Integrates with AI narrative templates for contextual weight determination
- **Loading States**: Provides feedback during choice generation with weight analysis