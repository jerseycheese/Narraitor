---
title: Lore Tracking System
tags: [lore, narrative, ai, consistency]
created: 2025-05-28
updated: 2025-06-26
---

# Lore Tracking System

So this system solves a major problem with AI storytelling: the AI forgetting important details from earlier in the story. You know how you're playing through a narrative and suddenly the AI forgets that your character's name is Marcus, or that the tavern you've been staying at is called The Prancing Pony? This tracks characters, locations, events, and world rules automatically so the AI can maintain consistency.

## What It Does

**Auto-extracts story facts** - When you play through narratives, the AI automatically identifies and stores important elements like "Sir Gareth" (character), "tavern" (location), "Goldenhaven" (location). It's basically reading along and taking notes.

**Filters by context** - You can view facts from just the current session or all-time, and each world keeps its own separate lore database. So your fantasy world facts don't get mixed up with your sci-fi world facts.

**Manual additions** - Players can manually add important story elements the AI might have missed. Sometimes you know something is important that the AI doesn't pick up on.

## Architecture

```typescript
interface LoreFact extends TimestampedEntity {
  id: EntityID;
  category: LoreCategory;   // 'characters' | 'locations' | 'events' | 'rules'
  key: string;              // human-readable key, e.g. "world-123:character_lady_seraphina"
  value: string;            // the canonical name
  aliases: string[];        // other names this entity gets called
  source: LoreSource;       // 'narrative' | 'manual'
  sessionId?: EntityID;
  worldId: EntityID;
  visibility: 'session-private' | 'world-shared';
  metadata?: {
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    type?: string;
    tags?: string[];
    relatedEntities?: string[];
  };
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

The lore system plugs into several places to maintain consistency:

**Narrative Generation** - Lore context automatically enhances AI prompts so it remembers what happened before.

**Choice Generation** - Lore facts are included in choice generation prompts for context-aware options. So if you met Sir Gareth earlier, the AI can offer choices that reference him.

**Goal System** - Works alongside goal tracking for narrative consistency. Goals track what you're trying to do, lore tracks what's happened.

**Session Scoping** - Facts can be filtered by session or world-wide, depending on what context you need.

**Error Handling** - The story continues even if lore extraction fails or AI services are unavailable.

### AI Prompt Enhancement
The lore system integrates with both narrative and choice generation:

**NarrativeGenerator** includes lore in `generateSegment()` and `generateInitialScene()` so the AI knows what's happened before.

**ChoiceGenerator** includes lore in `generateChoices()` for context-aware player options - choices that make sense given what's already established.

**Context Formatting** formats facts as "Established World Facts:" for AI consumption. This gives the AI a clear section to reference.

### Relationship with Goal Tracking
The lore tracking system complements the goal tracking system in a way that makes sense:

**Lore Facts** track world state, characters, locations, and events - basically what exists and what's happened.

**Goals** track player objectives and story progression - what you're trying to achieve.

**Combined Context** means both systems contribute to AI prompt context for maximum consistency. The AI knows both what's happened and what you're trying to do.

```typescript
// Combined context includes both lore facts and active goals
// getLoreContextForPrompt returns the prompt-ready string. (useLoreStore also has a
// getLoreContext, but that returns a fact-count/id object, not text.)
const loreContext = getLoreContextForPrompt(worldId, sessionId);
const goalContext = await useAiContextStore.getState().buildContextForSession(sessionId);

const fullContext = `
${loreContext}

${goalContext.goalContext}

Continue the story...
`;
```

## Testing

**Development harness** - Visit `/dev/lore-viewer` to see the lore system in action and test different scenarios.

**Unit tests** cover the key functionality:
- `npm test -- loreStore.test.ts` - Core lore storage functionality
- `npm test -- loreContextHelper.test.ts` - AI prompt context formatting  
- `npm test -- choiceGenerator.loreContext.test.ts` - Choice generation integration
- `npm test -- narrativeGenerator.loreContext.test.ts` - Narrative generation integration

This gives you confidence that the lore extraction and context building actually works as expected.