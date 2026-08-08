---
title: Custom Player Input
tags: [player-input, choices, interaction]
created: 2025-05-31
updated: 2025-06-08
---

# Custom Player Input

The problem with most AI narrative games is that you're stuck with whatever choices the AI dreams up. Want to try climbing through the window instead of going through the front door? Want to seduce the dragon instead of fighting it? Tough luck - you only get the three options the AI thought of.

This feature fixes that. Players can type whatever they want to try, and the AI will respond to it. It's basically "yes, and..." for AI storytelling.

## How This Actually Works

**The Input Field That's Always There** - There's a text area sitting right above the suggested actions where you can type whatever crazy idea you've got. We cap it at 250 characters to keep things focused - enough for creative freedom, but not so much that you're writing novels.

**Smart Enough to Stop You from Breaking Things** - It won't let you submit empty text, and it shows you a live character counter that turns amber when you're getting close to the limit and red when you hit it. Basically, it's got your back.

**Creativity First, Suggestions Second** - The custom input field is bigger and more prominent than the suggested actions. The AI's suggestions show up below under "Or choose a suggested action" - this way the game encourages you to think outside the box first, then fall back on the AI's ideas if you're stuck.

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