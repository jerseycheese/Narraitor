# LoreViewer Component

A simple read-only component that displays established lore facts to players during gameplay.

## Usage

```tsx
import { LoreViewer } from '@/components/LoreViewer';

// In a game session
<LoreViewer worldId={worldId} sessionId={sessionId} />

// In world details view  
<LoreViewer worldId={worldId} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `worldId` | `string` | Yes | The ID of the world to display lore facts for |
| `sessionId` | `string` | No | Optional session ID to filter facts to a specific game session |
| `className` | `string` | No | Additional CSS classes for styling |

## Features

- Displays facts grouped by category (Characters, Locations, Events, Rules)
- Shows key-value pairs in a simple, readable format
- Empty state when no facts are recorded
- Responsive design with colored category sections

## Integration

The component reads from the lore store which:
- Tracks facts automatically extracted from narratives
- Stores manually added facts by players
- Provides context for AI narrative generation