# LoreViewer Component

A comprehensive React component for displaying and managing lore facts in the Narraitor application. Provides a complete interface for tracking narrative consistency with established facts.

## Features

- **CRUD Operations**: Create, read, update, and delete lore facts
- **Advanced Filtering**: Filter by category, source, canonical status, and text search
- **Category Organization**: Organize facts by characters, locations, events, rules, items, organizations
- **Source Tracking**: Track fact origins (narrative, manual, AI-generated, imported)
- **Responsive Design**: Adapts to different screen sizes with proper grid layouts
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

```tsx
import { LoreViewer } from '@/components/LoreViewer';

function WorldDetailsPage() {
  return (
    <div>
      <h1>World Lore</h1>
      <LoreViewer worldId="world-123" />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `worldId` | `string` | Yes | The ID of the world to display lore facts for |
| `className` | `string` | No | Additional CSS classes for styling |

## Integration with AI System

The LoreViewer integrates with the lore management system to:

1. **Display AI-extracted facts** from narrative text
2. **Allow manual fact curation** by users
3. **Provide context for AI generation** through the lore store
4. **Maintain narrative consistency** across game sessions

## Fact Categories

- **Characters**: People, creatures, NPCs in the world
- **Locations**: Places, buildings, geographical features
- **Events**: Historical events, recent happenings
- **Rules**: World mechanics, magic systems, laws
- **Items**: Important objects, artifacts, equipment
- **Organizations**: Guilds, factions, governments

## Search and Filtering

The component provides multiple ways to find relevant facts:

- **Text Search**: Search across titles, content, and tags
- **Category Filter**: Filter by specific fact categories
- **Source Filter**: Filter by how facts were created
- **Canonical Filter**: Show only confirmed/official facts

## State Management

Uses the `useLoreStore` Zustand store for:
- Persistent storage of facts using IndexedDB
- Real-time updates across component instances
- Integration with AI narrative generation
- Search and filtering operations

## Accessibility Features

- Proper ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatible
- Focus management for modal dialogs
- Color contrast compliance

## Example Integration

```tsx
// In a game session page
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';

function GameSessionPage({ worldId }: { worldId: string }) {
  const { getLoreContext } = useLoreStore();
  
  // Get lore context for AI narrative generation
  const loreContext = getLoreContext(worldId, ['current-scene']);
  
  return (
    <div className="game-layout">
      <div className="narrative-panel">
        {/* Narrative content */}
      </div>
      <div className="lore-panel">
        <LoreViewer worldId={worldId} />
      </div>
    </div>
  );
}
```

## Testing

The component includes comprehensive tests for:
- Basic rendering and fact display
- Search and filtering functionality
- CRUD operations through the UI
- Loading and error states
- Accessibility compliance
- Responsive behavior

Run tests with:
```bash
npm test -- src/components/LoreViewer/__tests__/LoreViewer.test.tsx
```