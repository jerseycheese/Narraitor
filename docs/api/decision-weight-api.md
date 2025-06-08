# Decision Weight System API Documentation

## Overview

The Decision Weight System API provides developers with the tools to implement and customize visual prominence indicators for narrative choices based on AI-determined decision importance.

## Core Types

### DecisionWeight

```typescript
type DecisionWeight = 'minor' | 'major' | 'critical';
```

Represents the three levels of decision importance used throughout the system.

### Enhanced Decision Interface

```typescript
interface Decision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: string;
  decisionWeight?: DecisionWeight;
  contextSummary?: string;
}
```

**New Fields:**
- `decisionWeight`: AI-determined importance level
- `contextSummary`: AI-generated explanation of decision stakes

## Components

### ChoiceSelector

Enhanced component for displaying weighted choices with visual prominence.

#### Props

```typescript
interface ChoiceSelectorProps {
  decision?: Decision;
  choices?: SimpleChoice[];
  onSelect: (choiceId: string) => void;
  isDisabled?: boolean;
  className?: string;
  showHints?: boolean;
  enableCustomInput?: boolean;
  onCustomSubmit?: (customText: string) => void;
  customInputPlaceholder?: string;
  maxCustomLength?: number;
}
```

#### Usage

```tsx
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';

// With decision weights
<ChoiceSelector
  decision={{
    id: 'decision-1',
    prompt: 'A critical moment in your journey...',
    options: [...],
    decisionWeight: 'major',
    contextSummary: 'Your response will determine the alliance\'s fate.'
  }}
  onSelect={handleChoice}
  enableCustomInput={true}
/>
```

#### Visual Styling

The component automatically applies appropriate styling based on decision weight:

- **Minor**: Minimal visual prominence
- **Major**: Amber borders with moderate shadows  
- **Critical**: Red borders with strong shadows

### ActiveGameSession

Game session component with integrated decision weight support.

#### New Features

- **Ending Generation Loading**: Shows LoadingState during ending creation
- **Weight-Aware Choice Display**: Automatically renders decisions with appropriate prominence
- **Context Summary Display**: Shows AI-generated decision context when available

## Utility Functions

### getDecisionWeightStyling

```typescript
function getDecisionWeightStyling(weight?: DecisionWeight): {
  container: string;
  dot: string;
  label: string;
}
```

Returns Tailwind CSS classes for styling based on decision weight.

**Example:**
```typescript
const styling = getDecisionWeightStyling('major');
// Returns: {
//   container: 'border-2 border-amber-400 bg-amber-50/60 shadow-md shadow-amber-200',
//   dot: 'bg-amber-600',
//   label: 'text-amber-800'
// }
```

## AI Integration

### Choice Generation

The system integrates with AI choice generation through enhanced prompt templates:

#### Template Format

```
Decision Weight: [MINOR/MAJOR/CRITICAL]
Context Summary: [Brief explanation of decision stakes]
Decision: What will you do?

Options:
1. [LAWFUL] [First choice]
2. [NEUTRAL] [Second choice]
3. [NEUTRAL] [Third choice]
4. [CHAOTIC] [Fourth choice]
```

#### Weight Determination Criteria

**Minor Decisions:**
- Routine choices with limited consequences
- Casual conversations
- Basic exploration
- Everyday interactions

**Major Decisions:**
- Important choices that significantly impact story direction
- Meeting key characters
- Choosing major paths
- Using powerful abilities
- Moral choices

**Critical Decisions:**
- Life-changing decisions with major consequences
- Combat with deadly enemies
- Final confrontations
- Destiny-altering choices
- Life and death situations

### Context Summary Guidelines

Context summaries should:
- Focus on stakes and tension, not story recap
- Explain why the decision matters
- Be concise (1-2 sentences)
- Highlight immediate consequences or relationship impacts

**Good Examples:**
- "Tension builds as you must choose how to respond to the merchant's accusation."
- "A critical moment where your response could determine if the alliance forms."
- "The stranger's offer seems too good to be true."

**Poor Examples:**
- "You are standing in the marketplace talking to a merchant." (story recap)
- "This is a decision you need to make." (generic, unhelpful)

## Configuration

### Template Constraints

For realistic settings (modern, historical periods), the system automatically applies realism constraints:

```typescript
// Automatic detection for worlds containing:
// - Year references (1990s, 1980s, 1970s)
// - Modern/contemporary themes
// - Realistic genres

const shouldApplyRealismConstraints = 
  worldName.includes('1990') || 
  genre.includes('modern') || 
  genre.includes('realistic');
```

### Styling Customization

Decision weight styling can be customized by modifying the `getDecisionWeightStyling` function:

```typescript
// Custom styling example
const getCustomDecisionWeightStyling = (weight?: DecisionWeight) => {
  switch (weight) {
    case 'critical':
      return {
        container: 'border-4 border-purple-500 bg-purple-50/50 shadow-xl',
        dot: 'bg-purple-600',
        label: 'text-purple-800'
      };
    // ... other cases
  }
};
```

## Error Handling

### Fallback Behavior

The system provides robust fallback behavior:

1. **Missing Weight**: Defaults to 'minor' if AI doesn't provide weight
2. **Invalid Weight**: Falls back to 'minor' for unrecognized values
3. **Missing Context**: Uses simple fallback context summary
4. **Parsing Errors**: Gracefully handles malformed AI responses

### Debug Information

In development mode, the system provides console logging for:
- Weight extraction from AI responses
- Context summary parsing
- Fallback weight assignment logic

## Performance Considerations

### Optimization Strategies

- **Minimal Re-renders**: Weight styling uses pure functions with memoization
- **CSS-Only Effects**: Visual prominence achieved through Tailwind classes
- **Efficient Parsing**: Lightweight regex-based content extraction
- **Template Caching**: Reusable prompt templates reduce AI processing overhead

### Best Practices

1. **Consistent Weight Distribution**: Aim for varied but meaningful weight assignments
2. **Context Relevance**: Ensure context summaries add value, don't repeat information
3. **Visual Balance**: Avoid overusing critical weights to maintain impact
4. **Accessibility**: Always provide text alternatives for visual prominence indicators

## Testing

### Storybook Stories

Comprehensive visual testing available in Storybook:

```bash
npm run storybook
```

Navigate to:
- `ChoiceSelector` → `MinorDecision`
- `ChoiceSelector` → `MajorDecision`
- `ChoiceSelector` → `CriticalDecision`
- `ActiveGameSession` → `WithExistingSegments`

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ChoiceSelector } from './ChoiceSelector';

test('applies critical decision styling', () => {
  const decision = {
    id: 'test',
    prompt: 'Critical choice',
    options: [...],
    decisionWeight: 'critical' as const
  };
  
  render(<ChoiceSelector decision={decision} onSelect={jest.fn()} />);
  
  const container = screen.getByTestId('choice-selector');
  expect(container).toHaveClass('border-4', 'border-red-500');
});
```

## Migration Guide

### Upgrading Existing Components

1. **Update Decision Interface**: Add optional `decisionWeight` and `contextSummary` fields
2. **Enhance Choice Display**: Integrate `getDecisionWeightStyling` function
3. **Update AI Templates**: Add weight determination instructions
4. **Test Visual Changes**: Verify styling consistency across components

### Backward Compatibility

The system maintains full backward compatibility:
- Components without weight information render with default (minor) styling
- Existing choice generation continues to work without modification
- Progressive enhancement approach ensures no breaking changes