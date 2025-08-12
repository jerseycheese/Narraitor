---
title: Lore Tracking System
tags: [lore, narrative, ai, consistency]
created: 2025-05-28
updated: 2025-06-26
---

# Lore Tracking System

This this system solves a major problem with AI storytelling: the AI forgetting important details from earlier in the story. It automatically tracks characters, locations, events, and world rules so the AI can maintain consistency.

## What It Does

**Auto-extracts story facts** - When you play through narratives, the AI automatically identifies and stores important elements like "Sir Gareth" (character), "tavern" (location), "Goldenhaven" (location).

**Filters by context** - You can view facts from just the current session or all-time, and each world keeps its own separate lore database.

**Manual additions** - Players can manually add important story elements the AI might have missed.

## Architecture

```typescript
interface LoreFact {
  id: string;
  key: string;
  value: string;
  category: 'characters' | 'locations' | 'events' | 'rules';
  source: 'narrative' | 'manual' | 'ai_extraction';
  worldId: EntityID;
  sessionId?: EntityID;
  timestamp: string;
}
```

## Usage

```typescript
// Add facts manually
const { addFact } = useLoreStore();
addFact('hero_name', 'Marcus the Brave', 'characters', 'manual', worldId);

// Get facts with filtering
const { getFacts } = useLoreStore();
const allFacts = getFacts({ worldId });
const sessionFacts = getFacts({ worldId, sessionId });

// AI extraction from narrative
const narrative = "You meet Sir Gareth in the tavern of Goldenhaven...";
const facts = await extractStructuredLore(narrative);
// Automatically extracts: Sir Gareth (character), tavern (location), Goldenhaven (location)
```

## Integration

**Narrative Generation**: Lore context automatically enhances AI prompts for consistency
**Choice Generation**: Lore facts are included in choice generation prompts for context-aware options
**Goal System**: Works alongside goal tracking for comprehensive narrative consistency
**Session Scoping**: Facts can be filtered by session or world-wide
**Error Handling**: Graceful degradation when AI services unavailable

### AI Prompt Enhancement
The lore system integrates with both narrative and choice generation:

- **NarrativeGenerator**: Includes lore in `generateSegment()` and `generateInitialScene()`
- **ChoiceGenerator**: Includes lore in `generateChoices()` for context-aware player options
- **Context Formatting**: Facts are formatted as "Established World Facts:" for AI consumption

### Relationship with Goal Tracking
The lore tracking system complements the goal tracking system:
- **Lore Facts**: Track world state, characters, locations, and events
- **Goals**: Track player objectives and story progression
- **Combined Context**: Both systems contribute to AI prompt context for maximum consistency

```typescript
// Combined context includes both lore facts and active goals
const loreContext = getLoreContext(worldId, sessionId);
const goalContext = aiContextStore.buildContextForSession(sessionId);

const fullContext = `
${loreContext}

${goalContext.goalContext}

Continue the story...
`;
```

## Testing

**Development harness**: `/dev/lore-viewer`  
**Unit tests**:
- `npm test -- loreStore.test.ts` - Core lore storage functionality
- `npm test -- loreContextHelper.test.ts` - AI prompt context formatting
- `npm test -- choiceGenerator.loreContext.test.ts` - Choice generation integration
- `npm test -- narrativeGenerator.loreContext.test.ts` - Narrative generation integration