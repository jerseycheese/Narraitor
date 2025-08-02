---
title: Custom Player Input
tags: [player-input, choices, interaction]
created: 2025-05-31
updated: 2025-06-08
---

# Custom Player Input

This this feature addresses a key limitation of most AI narrative systems: being stuck with whatever choices the AI generates. Sometimes you want to try something completely different, and the AI should be able to respond to creative player input.

## How It Works

**Always Available Input** - There's a prominent text area above the suggested actions where you can type anything you want to try. 250 character limit keeps responses focused while allowing creative freedom.

**Smart Validation** - Prevents empty submissions and shows a live character counter with color feedback (amber when getting close to the limit, red when you hit it).

**Prioritized Display** - The custom input field is more prominent than the suggested actions, with suggested choices appearing below under "Or choose a suggested action." This encourages creativity while still providing fallback options.

## Technical Implementation

### ChoiceSelector Component
`src/components/shared/ChoiceSelector/ChoiceSelector.tsx`

```typescript
interface ChoiceSelectorProps {
  enableCustomInput?: boolean;
  onCustomSubmit?: (text: string) => void;
  customInputPlaceholder?: string;
  maxCustomLength?: number;              // Default: 250
}
```

**Features:**
- Always-visible custom input when enabled
- Character counting with visual feedback
- Input validation and sanitization
- Keyboard navigation and accessibility support

### Integration with ActiveGameSession
`src/components/GameSession/ActiveGameSession.tsx`

```typescript
const handleCustomSubmit = (customText: string) => {
  const customOption = {
    id: generateUniqueId('custom'),
    text: customText,
    isCustomInput: true,
    customText: customText
  };
  
  // Add to current decision and store in narrative store
  // Trigger narrative generation
}
```
### Processing Flow
1. Custom input creates decision option with `isCustomInput: true`
2. Option stored in narrative store alongside predefined choices
3. AI prompt receives: `Player chose: "custom text here"`
4. New choices appear after ~2 second delay (vs ~0.5s for predefined choices)

## Usage Examples

### Basic Implementation
```tsx
<ChoiceSelector
  choices={predefinedChoices}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomInput}
  customInputPlaceholder="Describe your action..."
  maxCustomLength={250}
/>
```

### Game Session
```tsx
<ActiveGameSession
  worldId={worldId}
  sessionId={sessionId}
  onChoiceSelected={handleSelectChoice}
  // Custom input automatically enabled
/>
```

## Configuration

### Character Limits
- Default: 250 characters (configurable via `maxCustomLength`)
- Visual feedback with live counter and color coding
- Hard limit enforcement

### Validation
- Empty/whitespace-only input prevented
- Special characters allowed for creative expression
- Input sanitized for XSS prevention

## Accessibility

- **Keyboard**: Tab order, Enter to submit, Escape to clear
- **Screen readers**: ARIA labels, live regions for character count
- **Visual**: High contrast, large targets, color + text for warnings

## Testing

Comprehensive test coverage includes:
- Unit tests for input validation and character limits
- Integration tests for narrative flow
- Manual scenarios: creative actions, combat, social interactions

## Troubleshooting

**Input not appearing**: Check `enableCustomInput={true}` and `onCustomSubmit` callback
**Actions not in narrative**: Verify option storage and choice ID matching
**Choices not regenerating**: Confirm 2-second delay and no generation errors