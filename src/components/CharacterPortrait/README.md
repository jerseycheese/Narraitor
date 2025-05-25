# CharacterPortrait Component

A reusable component for displaying character portraits throughout the Narraitor application.

## Features

- **Real AI-Generated Portraits**: Uses Google's Imagen 3.0 API for actual character portraits
- **Intelligent Fallbacks**: Character-specific SVG placeholders when API unavailable
- **Character Initials**: Shows meaningful initials when no portrait exists
- **Loading States**: Visual feedback during portrait generation
- **Error Handling**: Graceful display of generation errors with retry options
- **Multiple Sizes**: Small, medium, and large variants
- **Interactive**: Optional click handler for user interactions

## Usage

```tsx
import { CharacterPortrait } from '@/components/CharacterPortrait';

// Basic usage with placeholder
<CharacterPortrait
  portrait={{ type: 'placeholder', url: null }}
  characterName="Elara Moonshadow"
  size="medium"
/>

// With AI-generated portrait
<CharacterPortrait
  portrait={{
    type: 'ai-generated',
    url: 'data:image/png;base64,abc123...',
    generatedAt: '2024-01-01T00:00:00Z',
    prompt: 'A mystical elven mage'
  }}
  characterName="Elara Moonshadow"
  size="large"
  onClick={handlePortraitClick}
/>

// Loading state
<CharacterPortrait
  portrait={{ type: 'placeholder', url: null }}
  characterName="Elara Moonshadow"
  isGenerating={true}
/>

// Error state
<CharacterPortrait
  portrait={{ type: 'placeholder', url: null }}
  characterName="Elara Moonshadow"
  error="Failed to generate portrait"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `portrait` | `CharacterPortrait` | Yes | Portrait data object |
| `characterName` | `string` | Yes | Character name for alt text and initials |
| `size` | `'small' \| 'medium' \| 'large'` | No | Portrait size (default: 'medium') |
| `isGenerating` | `boolean` | No | Shows loading spinner when true |
| `error` | `string \| null` | No | Error message to display |
| `onClick` | `() => void` | No | Click handler for interactive portraits |

## Portrait Data Structure

```typescript
interface CharacterPortrait {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}
```

## Sizes

- **Small**: 32x32px (`w-8 h-8`) - Used in game sessions and compact lists
- **Medium**: 64x64px (`w-16 h-16`) - Used in character cards and forms
- **Large**: 96x96px (`w-24 h-24`) - Used in character creation and detailed views

## Integration Points

The CharacterPortrait component is integrated throughout the application:

1. **Character Creation Wizard**: Optional portrait generation step
2. **Character Cards**: Display on character selection pages
3. **Game Sessions**: Show current character during gameplay
4. **Character Lists**: Visual identification in character management

## Accessibility

- Proper alt text for screen readers
- ARIA attributes for loading states
- Keyboard navigation support when interactive
- High contrast placeholders for visibility

## Storybook Stories

The component includes comprehensive Storybook stories demonstrating:
- All size variations
- Loading and error states
- Different character name lengths
- Interactive variants
- AI-generated vs placeholder states

Run `npm run storybook` and navigate to "Components/CharacterPortrait" to view all examples.