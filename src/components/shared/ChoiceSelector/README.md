# ChoiceSelector Component

A unified choice selector component that handles both simple choices and complex decisions with optional custom player input functionality.

## Features

- **Unified Interface**: Handles both simple choices and Decision objects
- **Custom Player Input**: Optional textarea for custom player actions
- **Visual Hierarchy**: Custom input prominent at top, suggested actions below
- **Character Limits**: Configurable character counting with visual feedback
- **Accessibility**: Full keyboard navigation and screen reader support
- **Validation**: Prevents empty submissions and enforces character limits

## Basic Usage

### Simple Choices
```tsx
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';

const choices = [
  { id: 'choice-1', text: 'Go north' },
  { id: 'choice-2', text: 'Go south' },
  { id: 'choice-3', text: 'Rest here' },
];

<ChoiceSelector
  choices={choices}
  onSelect={(choiceId) => console.log('Selected:', choiceId)}
/>
```

### Decision with Hints
```tsx
const decision = {
  id: 'decision-1',
  prompt: 'You encounter a locked door. How do you proceed?',
  options: [
    { id: 'opt-1', text: 'Pick the lock', hint: 'Requires Lockpicking skill' },
    { id: 'opt-2', text: 'Force the door', hint: 'Requires high Strength' },
    { id: 'opt-3', text: 'Look for another way', hint: 'Safe but slow' },
  ],
};

<ChoiceSelector
  decision={decision}
  onSelect={(choiceId) => console.log('Selected:', choiceId)}
  showHints={true}
/>
```

## Custom Player Input

### Basic Custom Input
```tsx
<ChoiceSelector
  choices={choices}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={(customText) => console.log('Custom action:', customText)}
/>
```

### Advanced Custom Input
```tsx
<ChoiceSelector
  decision={decision}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomInput}
  customInputPlaceholder="Describe your creative solution..."
  maxCustomLength={150}
  showHints={true}
/>
```

## Props

### Core Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `choices` | `SimpleChoice[]` | `undefined` | Array of simple choice objects |
| `decision` | `Decision` | `undefined` | Decision object with options and hints |
| `onSelect` | `(choiceId: string) => void` | **Required** | Callback when choice is selected |
| `isDisabled` | `boolean` | `false` | Disable all interactions |
| `className` | `string` | `''` | Additional CSS classes |
| `showHints` | `boolean` | `true` | Show hint text for options |

### Custom Input Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableCustomInput` | `boolean` | `false` | Enable custom input functionality |
| `onCustomSubmit` | `(text: string) => void` | `undefined` | Callback for custom input submission |
| `customInputPlaceholder` | `string` | `'Type your custom response...'` | Placeholder text |
| `maxCustomLength` | `number` | `250` | Maximum character limit |

## Types

### SimpleChoice
```typescript
interface SimpleChoice {
  id: string;
  text: string;
  isSelected?: boolean;
}
```

### Decision (from narrative types)
```typescript
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
  isCustomInput?: boolean;  // Added for custom input support
  customText?: string;      // Added for custom input support
}
```

## Visual Design

### Layout Structure
```
┌─────────────────────────────────────┐
│ Custom Input Field (if enabled)     │
│ ┌─────────────────────────────────┐ │
│ │ Type your custom response...    │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ Character Count: 23/250    [Submit] │
└─────────────────────────────────────┘

Or choose a suggested action:

┌─────────────────────────────────────┐
│ ○ Pick the lock                     │
│   Requires Lockpicking skill       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ ○ Force the door open               │
│   Requires high Strength            │
└─────────────────────────────────────┘
```

### Visual Hierarchy
- **Custom Input**: Large, prominent gray box with padding
- **Suggested Actions**: Smaller buttons with less visual weight
- **Character Counter**: Small text with color coding
- **Hints**: Muted text below each option

## Accessibility

### Keyboard Navigation
- **Tab**: Cycles through custom input → submit button → choice options
- **Enter**: Submits custom input when focused
- **Space**: Selects choice option when focused
- **Arrow Keys**: Navigate between choice options

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Role Groups**: Proper radiogroup/radio roles for choices
- **Live Regions**: Character count announcements
- **Focus Management**: Logical focus order

### Visual Accessibility
- **High Contrast**: Clear visual distinction between elements
- **Color + Text**: Character limit warnings use both color and text
- **Large Targets**: Touch-friendly button and input sizes
- **Responsive**: Works across all viewport sizes

## Custom Input Features

### Character Counting
- **Live Updates**: Counter updates as user types
- **Color Coding**: 
  - Gray: Normal state (0-80% of limit)
  - Amber: Warning state (80-99% of limit)  
  - Red: At limit (100% of limit)
- **Limit Enforcement**: Hard limit prevents typing beyond maximum

### Input Validation
- **Empty Prevention**: Submit button disabled for empty input
- **Whitespace Handling**: Trims whitespace, prevents space-only submissions
- **Character Limits**: Enforced during typing and submission
- **Sanitization**: Input escaped to prevent XSS

### Submission Methods
- **Submit Button**: Click to submit custom input
- **Enter Key**: Press Enter in textarea to submit
- **Shift+Enter**: Creates line break in textarea
- **Auto-clear**: Input field clears after successful submission

## Integration Examples

### Game Session Integration
```tsx
const handleCustomSubmit = (customText: string) => {
  // Create custom decision option
  const customOption = {
    id: generateUniqueId('custom'),
    text: customText,
    isCustomInput: true,
  };
  
  // Add to current decision and trigger narrative generation
  updateDecisionWithCustomOption(customOption);
  triggerNarrativeGeneration(customOption.id);
};

<ChoiceSelector
  decision={currentDecision}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomSubmit}
  isDisabled={isGeneratingNarrative}
/>
```

### Choice Generator Integration
```tsx
<ChoiceSelector
  choices={generatedChoices}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomAction}
  customInputPlaceholder="Or describe your own action..."
  maxCustomLength={200}
/>
```

## Styling

### CSS Classes
- `.choice-selector`: Main container
- `.choice-selector .custom-input`: Custom input section
- `.choice-selector .choices`: Choice options container
- `.choice-selector .choice-option`: Individual choice button

### Customization
The component uses Tailwind CSS classes and can be customized by:
1. Passing `className` prop for container styling
2. Overriding CSS classes in your stylesheet
3. Using CSS-in-JS for dynamic styling
4. Modifying the component's internal styles

## Performance

### Optimizations
- **Minimal Re-renders**: Uses useCallback for event handlers
- **Efficient Updates**: Character counting without debouncing
- **Memory Management**: Input state cleared after submission
- **Lazy Evaluation**: Options normalized on-demand

### Best Practices
- Provide stable `onSelect` and `onCustomSubmit` callbacks
- Use `React.memo` for parent components if needed
- Avoid creating new choice arrays on every render
- Keep character limits reasonable (250 characters default)

## Testing

### Test Coverage
- ✅ Renders with simple choices
- ✅ Renders with decision objects
- ✅ Custom input field visibility
- ✅ Character counting and limits
- ✅ Input validation
- ✅ Submission methods (button, Enter key)
- ✅ Disabled state behavior
- ✅ Accessibility attributes

### Testing Example
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoiceSelector from './ChoiceSelector';

test('enables custom input and submits text', async () => {
  const handleCustomSubmit = jest.fn();
  const user = userEvent.setup();
  
  render(
    <ChoiceSelector
      choices={choices}
      onSelect={jest.fn()}
      enableCustomInput={true}
      onCustomSubmit={handleCustomSubmit}
    />
  );
  
  const input = screen.getByPlaceholderText('Type your custom response...');
  await user.type(input, 'I examine the door');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(handleCustomSubmit).toHaveBeenCalledWith('I examine the door');
});
```

## Troubleshooting

### Common Issues

**Custom input not showing**:
- Verify `enableCustomInput={true}`
- Ensure `onCustomSubmit` callback is provided
- Check parent component isn't overriding visibility

**Submission not working**:
- Verify input has content (not empty/whitespace)
- Check `onCustomSubmit` callback is function
- Ensure component isn't disabled

**Character counter issues**:
- Verify `maxCustomLength` is reasonable number
- Check input length against limit
- Ensure counter element is rendering

**Accessibility issues**:
- Verify proper ARIA labels are present
- Check keyboard navigation works
- Test with screen reader if available

### Debug Tips
- Use React DevTools to inspect props and state
- Check console for JavaScript errors
- Verify callback functions are being called
- Test with different character limits and inputs