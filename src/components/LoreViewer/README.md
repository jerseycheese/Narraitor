# LoreViewer Component

This handles displaying the lore that builds up as players explore their world. The challenge was creating something that feels like a living reference guide, not just a static data dump.

## What It Does

**Living world reference** - Shows the facts and knowledge that accumulate during gameplay. Characters you've met, places you've been, rules you've discovered. It's like having a campaign journal that writes itself.

**Category grouping** - Groups everything into logical categories (Characters, Locations, Events, Rules) so you can actually find what you're looking for instead of scrolling through a wall of text.

## Basic Usage

```tsx
import { LoreViewer } from '@/components/LoreViewer';

// In a game session - shows facts from this specific adventure
<LoreViewer worldId={worldId} sessionId={sessionId} />

// In world details view - shows all accumulated knowledge
<LoreViewer worldId={worldId} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `worldId` | `string` | Yes | Which world's lore to display |
| `sessionId` | `string` | No | Filter to specific session facts (optional) |
| `className` | `string` | No | Additional styling classes |

## How It Works

**Automatic fact extraction** - The system watches narrative generation and pulls out key information automatically. When the AI mentions "The tavern keeper, Marcus" for the first time, that becomes a character fact.

**Manual additions** - Players can also add their own notes and observations. Sometimes you want to remember something the AI didn't think was important.

**Context for generation** - All this accumulated lore feeds back into the AI system, helping it maintain consistency. Marcus the tavern keeper stays Marcus, and he remembers what you talked about last time.

## Visual Design

Each category gets its own color-coded section, and key-value pairs are formatted for easy scanning. The empty state encourages exploration: "Start your adventure to begin discovering lore about this world."

## Integration Notes

The component is read-only by design - it displays what the lore store contains but doesn't modify anything. Changes happen through narrative generation and explicit lore management interfaces.

Hooks into the lore store's automatic extraction system, which runs whenever new narrative segments are generated. The extraction looks for patterns like character introductions, location descriptions, and rule explanations.