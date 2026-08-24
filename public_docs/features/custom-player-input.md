---
title: Custom Player Input
tags: [player-input, choices, interaction]
created: 2025-05-31
updated: 2025-06-08
---

# Custom Player Input

Most AI narrative games limit you to the choices the model generated. Climbing through the window instead of using the front door, or talking the dragon down instead of fighting it, isn't an option unless the AI happened to offer it.

This feature adds one. Players type what they want to try and the AI responds to it, alongside the suggested actions rather than instead of them.

## How It Works

**The Input Field** - A text area sits above the suggested actions, capped at 250 characters. The cap keeps a submission to an action rather than a paragraph of stage direction.

**Input Validation** - Empty submissions are blocked, and a live character counter turns amber as you approach the limit and red once you hit it.

**Creativity First, Suggestions Second** - The custom input field is bigger and more prominent than the suggested actions, which sit below under "Or choose a suggested action". The ordering is deliberate: it asks for your own idea before offering the model's.

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
  decision={currentDecision}
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

Test coverage includes:
- Unit tests for input validation and character limits
- Integration tests for narrative flow
- Manual scenarios: creative actions, combat, social interactions

## Troubleshooting

**Input not appearing**: Check `enableCustomInput={true}` and `onCustomSubmit` callback
**Actions not in narrative**: Verify option storage and choice ID matching
**Choices not regenerating**: Confirm 2-second delay and no generation errors