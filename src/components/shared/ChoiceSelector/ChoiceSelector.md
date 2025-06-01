# ChoiceSelector Component

## Overview
The ChoiceSelector is a unified component for displaying player choices in the game. It handles both simple choice arrays and complex Decision objects from the narrative system, providing a consistent interface for all choice selection scenarios.

## Usage

```tsx
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';

// Simple choices
<ChoiceSelector
  choices={simpleChoices}
  onSelect={handleChoice}
/>

// Decision object with hints
<ChoiceSelector
  decision={decisionObject}
  onSelect={handleChoice}
  showHints={true}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| choices | SimpleChoice[] | No* | Array of simple choices |
| decision | Decision | No* | Complex decision object from narrative system |
| prompt | string | No | Override prompt text |
| onSelect | (choiceId: string) => void | Yes | Callback when a choice is selected |
| isDisabled | boolean | No | Disable all choices (default: false) |
| className | string | No | Additional CSS classes |
| showHints | boolean | No | Show hints when available (default: true) |

\* Either `choices` or `decision` must be provided

### Type Definitions

```typescript
interface SimpleChoice {
  id: string;
  text: string;
  isSelected?: boolean;
}

interface Decision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: string;
}

interface DecisionOption {
  id: string;
  text: string;
  hint?: string;
  requirements?: DecisionRequirement[];
}
```

## Features

- **Unified Interface**: Single component for both simple and complex choices
- **Flexible Data**: Accepts either simple choice arrays or Decision objects
- **Visual Feedback**: Selected state, hover effects, and disabled state
- **Hints Support**: Optional hints for decision options
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Responsive**: Works on all screen sizes

## Examples

### Simple Choices
```tsx
const choices = [
  { id: '1', text: 'Go north' },
  { id: '2', text: 'Go south' },
  { id: '3', text: 'Rest here', isSelected: true }
];

<ChoiceSelector
  choices={choices}
  onSelect={(id) => console.log('Selected:', id)}
/>
```

### Decision with Hints
```tsx
const decision = {
  id: 'decision-1',
  prompt: 'The door is locked. What do you do?',
  options: [
    { 
      id: 'opt-1', 
      text: 'Pick the lock',
      hint: 'Requires Lockpicking skill'
    },
    { 
      id: 'opt-2', 
      text: 'Break down the door',
      hint: 'Requires high Strength'
    }
  ]
};

<ChoiceSelector
  decision={decision}
  onSelect={handleChoice}
/>
```

### Custom Prompt
```tsx
<ChoiceSelector
  choices={choices}
  prompt="What is your next move?"
  onSelect={handleChoice}
/>
```

## Migration Guide

This component replaces both `PlayerChoices` and `PlayerChoiceSelector`:

```tsx
// Old PlayerChoices usage
<PlayerChoices
  choices={choices}
  onChoiceSelected={handler}
  isDisabled={disabled}
/>

// New ChoiceSelector usage
<ChoiceSelector
  choices={choices}
  onSelect={handler}
  isDisabled={disabled}
/>

// Old PlayerChoiceSelector usage
<PlayerChoiceSelector
  decision={decision}
  onSelect={handler}
/>

// New ChoiceSelector usage
<ChoiceSelector
  decision={decision}
  onSelect={handler}
/>
```

## Styling

The component uses Tailwind CSS with:
- Consistent button styling with hover and selected states
- Blue accent color for selected choices
- Subtle gray for hints
- Proper spacing and responsive design