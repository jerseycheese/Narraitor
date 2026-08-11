# ChoiceSelector Component

This handles player choice selection in all its forms - from simple "go left or right" decisions to complex scenarios with custom player input. The challenge was creating one component that works for both AI-generated choices and player creativity without feeling cluttered.

## What It Handles

**Multiple choice types** - Works with simple choice lists ("Go north", "Go south") and complex decision objects with hints and requirements.

**Inventory-aware gating** - Surfaces required items and disables locked choices with clear feedback about missing gear.

**Custom player input** - Optional text area where players can type their own creative responses instead of picking from suggested options.

**Smart visual hierarchy** - Custom input gets prominent placement at the top, suggested choices appear below with less visual weight.

**Character counting** - Live character counter with color-coded warnings as you approach the limit.

**Full accessibility** - Keyboard navigation, screen reader support, proper ARIA labels throughout.

**Input validation** - Prevents empty submissions, enforces character limits, and covers edge cases.

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

## Custom Input Examples

**Basic setup** - Enable custom input alongside regular choices:
```tsx
<ChoiceSelector
  choices={choices}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={(customText) => console.log('Custom action:', customText)}
/>
```

**Advanced configuration** - Customize the experience with hints, length limits, and placeholder text:
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

### Requirement Context Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `worldSkills` | `WorldSkill[]` | `[]` | Skill definitions used to label and interpret skill-based requirements. |
| `characterSkills` | `CharacterSkill[]` | `[]` | Player character skills used to evaluate skill requirements. |
| `inventoryItems` | `InventoryItem[]` | `[]` | Inventory snapshot used to evaluate item requirements and quantities. |

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
  requiredItems?: DecisionItemRequirements;
  isCustomInput?: boolean;  // Added for custom input support
  customText?: string;      // Added for custom input support
}

`DecisionItemRequirements` supports straightforward arrays (defaults to "all" logic) or grouped objects where you can specify `logic: 'any' | 'all'` for more complex inventory gating.
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
- **Tab**: Cycles through custom input, then the submit button, then the choice options
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

## Custom Input Details

**Live character counting** - Updates as you type with color-coded warnings. Gray for normal, amber when you're getting close to the limit, red when you hit the maximum.

**Smart validation** - Submit button stays disabled for empty input. Trims whitespace so you can't submit just spaces. Hard character limit prevents typing beyond the maximum.

**Multiple submission methods** - Click the submit button, press Enter in the text area, or use Shift+Enter for line breaks. Input clears automatically after successful submission.

**Security built-in** - Input is properly escaped to prevent XSS attacks, so players can't inject malicious content through custom responses.

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
The component is styled with CSS classes wired to design tokens and can be customized by:
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
- Renders with simple choices
- Renders with decision objects
- Custom input field visibility
- Character counting and limits
- Input validation
- Submission methods (button, Enter key)
- Disabled state behavior
- Accessibility attributes

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
