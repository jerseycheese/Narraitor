# CharacterSummary Component

## Overview
The CharacterSummary component displays essential character identity information during gameplay sessions. It provides players with quick access to their character's name, level, description, background, and portrait.

## Usage

```tsx
import CharacterSummary from '@/components/GameSession/CharacterSummary';

// In your component
<CharacterSummary character={character} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| character | Character | Yes | The character object containing all character information |

### Character Type Structure

```typescript
interface Character {
  id: string;
  name: string;
  worldId: string;
  level: number;
  description?: string;
  background?: {
    description: string;
    personality: string;
    motivation: string;
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Features

- **Responsive Design**: Adapts to different screen sizes
- **Portrait Display**: Shows character portrait with fallback to placeholder
- **Graceful Degradation**: Handles missing optional fields (description, background)
- **Accessibility**: Includes proper ARIA labels and semantic HTML

## Example

```tsx
const character = {
  id: 'char-123',
  name: 'Aragorn',
  level: 10,
  description: 'A ranger from the north',
  background: {
    description: 'Heir to the throne of Gondor',
    personality: 'Noble and brave',
    motivation: 'Protect Middle-earth'
  },
  portrait: {
    type: 'ai-generated',
    url: 'https://example.com/portrait.jpg'
  },
  worldId: 'middle-earth',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

<CharacterSummary character={character} />
```

## Styling

The component uses Tailwind CSS classes and features:
- White background with subtle shadow
- Rounded corners and border
- Responsive flex layout
- Proper spacing between elements

## Integration

This component is integrated into the ActiveGameSession component and displays at the top of the game session interface, ensuring character information is always visible during gameplay.