# CharacterPortrait Component

This component handles displaying character portraits throughout the app. The challenge was balancing AI-generated portrait features with reliable fallbacks, since AI image generation can be slow or fail entirely.

## What It Does

The component shows character portraits using actual AI-generated images when available, and covers the edge cases:

- **Real AI-Generated Portraits**: Uses Google's Imagen 3.0 API for actual character portraits
- **Intelligent Fallbacks**: Character-specific SVG placeholders when API unavailable
- **Character Initials**: Shows meaningful initials when no portrait exists
- **Loading States**: Visual feedback during portrait generation
- **Error Handling**: Renders the supplied `error` message in place of the portrait
- **Multiple Sizes**: Small, medium, and large variants
- **Interactive**: Optional click handler for user interactions

## Basic Usage

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

## Component Props

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

## Size Options

- **Small** (32x32px): Used in game sessions and compact lists
- **Medium** (64x64px): Used in character cards and forms  
- **Large** (96x96px): Used in character creation and detailed views

## Where It's Used

You'll see this component throughout the app:

1. **Character Creation Wizard**: Optional portrait generation step
2. **Character Cards**: Display on character selection pages
3. **Game Sessions**: Show current character during gameplay
4. **Character Lists**: Visual identification in character management

## Accessibility Features

- Proper alt text for screen readers
- ARIA attributes for loading states
- Keyboard navigation support when interactive
- High contrast placeholders for visibility

## Storybook Stories

The component includes Storybook stories showing all size variations, loading and error states, different character name lengths, interactive variants, and AI-generated vs placeholder states.

Run `npm run storybook` and navigate to "Components/CharacterPortrait" to see all the examples in action.