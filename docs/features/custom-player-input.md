---
title: "Custom Player Input Feature"
type: feature
category: player-interaction
tags: [player-input, choices, interaction]
created: 2025-05-31
updated: 2025-06-08
---

# Custom Player Input Feature

## Overview

The Custom Player Input feature allows players to type their own custom actions instead of being limited to AI-generated choices. This enhances player agency and creativity while maintaining narrative coherence.

## User Experience

### Interface Design
- **Custom input field**: Large, prominent textarea at the top of the choice interface
- **No button barrier**: Input field is immediately visible without requiring a button click
- **Visual hierarchy**: Custom input is larger and more prominent than suggested actions
- **Clear labeling**: Suggested actions appear below with "Or choose a suggested action:" header

### Input Features
- **Character limit**: 250 characters by default (configurable)
- **Visual feedback**: Live character counter (e.g., "23/250")
- **Warning colors**: Counter turns amber near limit, red at limit
- **Validation**: Prevents empty or whitespace-only submissions
- **Multiple submission methods**: Submit button or Enter key
- **Auto-clear**: Input field clears after successful submission

## Technical Implementation

### Core Components

#### ChoiceSelector Component
**Location**: `src/components/shared/ChoiceSelector/ChoiceSelector.tsx`

**Key Props**:
```typescript
interface ChoiceSelectorProps {
  enableCustomInput?: boolean;           // Enable custom input functionality
  onCustomSubmit?: (text: string) => void; // Callback for custom input
  customInputPlaceholder?: string;       // Placeholder text
  maxCustomLength?: number;              // Character limit (default: 250)
}
```

**Features**:
- Always-visible custom input when enabled
- Character counting with visual feedback
- Input validation and sanitization
- Keyboard navigation support
- Accessibility compliance (ARIA labels)

#### ActiveGameSession Integration
**Location**: `src/components/GameSession/ActiveGameSession.tsx`

**Implementation**:
```typescript
const handleCustomSubmit = (customText: string) => {
  // Create custom decision option
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

### Narrative Integration

#### Choice Processing
**Location**: `src/components/Narrative/NarrativeController.tsx`

**Flow**:
1. Custom input creates a decision option with `isCustomInput: true`
2. Option is stored in narrative store alongside predefined choices
3. When narrative generates, custom text is retrieved and used
4. AI prompt receives: `Player chose: "custom text here"`

#### Choice Generation Timing
- **After predefined choice**: New choices appear in ~0.5 seconds
- **After custom input**: New choices appear in ~2 seconds (allows processing)
- **Prevents overwriting**: Delay ensures custom option isn't lost

#### Prompt Template Integration
**Location**: `src/lib/promptTemplates/templates/narrative/sceneTemplate.ts`

**Context Passing**:
```typescript
${narrativeContext?.currentSituation ? `PLAYER ACTION: ${narrativeContext.currentSituation}` : ''}
```

The current situation includes the exact custom text: `Player chose: "do a cartwheel"`

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

### Game Session Usage
```tsx
<ActiveGameSession
  worldId={worldId}
  sessionId={sessionId}
  onChoiceSelected={handleSelectChoice}
  // Custom input is automatically enabled in game sessions
/>
```

## Configuration Options

### Character Limits
- **Default**: 250 characters
- **Configurable**: Pass `maxCustomLength` prop
- **Visual feedback**: Live counter with color coding
- **Enforcement**: Hard limit prevents typing beyond maximum

### Placeholder Text
- **Default**: "Type your custom response..."
- **Customizable**: Pass `customInputPlaceholder` prop
- **Context-aware**: Different placeholders for different scenarios

### Validation Rules
- **Empty input**: Prevented from submission
- **Whitespace only**: Stripped and prevented if empty
- **Character limit**: Enforced during typing
- **Special characters**: Allowed (for creative expression)

## Accessibility Features

### Keyboard Navigation
- **Tab order**: Custom input -> Submit button -> Predefined choices
- **Enter key**: Submits custom input (Shift+Enter for line breaks)
- **Escape key**: Clears input field
- **Arrow keys**: Navigate between predefined choices

### Screen Reader Support
- **ARIA labels**: "Custom response input"
- **Role definitions**: Proper radiogroup and radio roles
- **Live regions**: Character count announcements
- **Focus management**: Logical tab order

### Visual Accessibility
- **High contrast**: Clear distinction between input and choices
- **Large target areas**: Easy-to-click submit button
- **Color coding**: Character limit warnings use color + text
- **Font sizing**: Readable text throughout interface

## Testing

### Unit Tests
**Location**: `src/components/shared/ChoiceSelector/ChoiceSelector.test.tsx`

**Coverage**:
- ✅ Custom input field visibility
- ✅ Character counting and limits
- ✅ Input validation (empty, whitespace)
- ✅ Submission methods (button, Enter key)
- ✅ Field clearing after submission
- ✅ Disabled state behavior
- ✅ Accessibility attributes

### Integration Tests
- ✅ Custom input with game session flow
- ✅ Narrative incorporation of custom actions
- ✅ Choice regeneration after custom input
- ✅ Mixed usage (custom + predefined choices)

### Manual Testing Scenarios
1. **Creative Actions**: "I examine the door for traps"
2. **Combat Actions**: "I draw my sword and charge"
3. **Social Actions**: "I attempt to bribe the guard"
4. **Long Input**: Test 250+ character limit enforcement
5. **Edge Cases**: Empty input, whitespace only, special characters

## Performance Considerations

### Debouncing
- **Character counting**: Updates on every keystroke (no debouncing needed)
- **Validation**: Real-time feedback without performance impact
- **Submission**: Single API call per submission

### Memory Management
- **Input state**: Cleared after submission to prevent memory leaks
- **Decision storage**: Custom options added to existing decisions
- **Cleanup**: Old decisions cleaned up by narrative store

### Network Optimization
- **Batch operations**: Custom option added to existing decision
- **Minimal payload**: Only text and metadata sent
- **Caching**: Decisions cached in narrative store

## Error Handling

### User Input Errors
- **Empty submission**: Visual feedback, submission prevented
- **Network errors**: Graceful degradation, retry options
- **Character limit**: Soft enforcement with visual warnings

### System Errors
- **Store failures**: Fallback to local state
- **Generation failures**: Error messages with retry options
- **Invalid responses**: Sanitization and validation

## Future Enhancements

### Potential Features
- **Input history**: Arrow keys to cycle through previous inputs
- **Autocomplete**: Suggest completions based on context
- **Rich text**: Basic formatting options (bold, italic)
- **Voice input**: Speech-to-text integration
- **Collaborative**: Multiple players contributing to custom actions

### Performance Improvements
- **Smart caching**: Cache common custom actions
- **Predictive loading**: Pre-generate likely continuations
- **Compression**: Optimize storage of custom text

## Migration Guide

### Enabling for Existing Components
1. Add `enableCustomInput={true}` prop to ChoiceSelector
2. Provide `onCustomSubmit` callback handler
3. Update parent component to handle custom choice IDs
4. Test integration with narrative generation

### Upgrading from Previous Versions
- **Breaking changes**: None (feature is additive)
- **New dependencies**: None (uses existing infrastructure)
- **Configuration**: All options have sensible defaults

## Troubleshooting

### Common Issues

**Custom input not appearing**:
- ✅ Verify `enableCustomInput={true}` prop
- ✅ Check that `onCustomSubmit` callback is provided
- ✅ Ensure parent component is not overriding visibility

**Custom actions not in narrative**:
- ✅ Check that custom option is being stored in narrative store
- ✅ Verify choice ID matching in narrative generation
- ✅ Confirm AI prompt includes custom action text

**Choices not regenerating**:
- ✅ Verify 2-second delay after custom input
- ✅ Check that choice generation is enabled
- ✅ Confirm no errors in narrative generation

### Debug Information
Enable console logging in development to see:
- Custom option creation and storage
- Choice ID matching during narrative generation
- Timing of choice regeneration cycles

## Security Considerations

### Input Sanitization
- **XSS Prevention**: All user input escaped before rendering
- **Length Limits**: Hard character limits prevent abuse
- **Content Filtering**: Future enhancement for inappropriate content

### Data Storage
- **Local Storage**: Custom actions stored locally only
- **No Persistence**: Custom text not sent to external services
- **Privacy**: User actions remain private to their session