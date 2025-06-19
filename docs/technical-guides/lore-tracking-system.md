---
title: "Lore Tracking System"
type: guide
category: narrative
tags: [lore, tracking, ai, narrative-consistency]
created: 2025-05-28
updated: 2025-06-08
---

# Lore Tracking System

## Overview
The lore tracking system provides AI-driven narrative consistency by automatically extracting and storing key story facts during gameplay. This ensures narrative coherence and prevents contradictions in AI-generated content.

## Key Features
- **Automatic Fact Extraction**: AI-powered extraction of characters, locations, events, and rules from narrative segments
- **Session-Scoped Filtering**: View facts from current session or all-time for flexible context management
- **Category Organization**: Facts are organized into characters, locations, events, and rules
- **World-Scoped Storage**: Each world maintains its own independent lore database
- **Manual Fact Addition**: Players and developers can manually add important story elements

## Architecture

### Core Components
- **LoreStore** (`/src/state/loreStore.ts`): Zustand store managing fact storage and retrieval
- **LoreViewer** (`/src/components/LoreViewer/`): React component for displaying and filtering facts
- **StructuredLoreExtractor** (`/src/lib/ai/structuredLoreExtractor.ts`): AI service for extracting facts from narrative text

### Data Structure
```typescript
interface LoreFact {
  id: string;
  key: string;           // Unique identifier within category
  value: string;         // The actual fact content
  category: LoreCategory; // 'characters', 'locations', 'events', 'rules'
  source: 'narrative' | 'manual' | 'ai_extraction';
  worldId: EntityID;     // World scope
  sessionId?: EntityID;  // Optional session association
  timestamp: string;     // Creation timestamp
  metadata?: LoreMetadata; // Additional AI-extracted context
}
```

## Usage

### Integration with Narrative Generation
The lore system automatically integrates with the narrative generation process:

```typescript
import { getLoreContextForPrompt } from '@/state/loreStore';
import { narrativeGenerator } from '@/lib/ai/narrativeGenerator';

// Enhance prompts with relevant lore context
const prompt = "Continue the story...";
const loreContext = getLoreContextForPrompt(worldId);
const enhancedPrompt = prompt + loreContext;

const narrative = await narrativeGenerator.generateNarrative(enhancedPrompt, worldId);
```

### Manual Fact Addition
```typescript
import { useLoreStore } from '@/state/loreStore';

const { addFact } = useLoreStore();

// Add a manual fact
addFact(
  'hero_name',           // key
  'Marcus the Brave',    // value
  'characters',          // category
  'manual',             // source
  worldId,              // world scope
  sessionId             // optional session
);
```

### Session Filtering
```typescript
import { useLoreStore } from '@/state/loreStore';

const { getFacts } = useLoreStore();

// Get all facts for a world
const allFacts = getFacts({ worldId });

// Get only facts from current session
const sessionFacts = getFacts({ worldId, sessionId });
```

## AI Integration

### Structured Extraction
The system uses AI to extract structured lore from narrative text:

```typescript
import { extractStructuredLore } from '@/lib/ai/structuredLoreExtractor';

const narrative = "You meet Sir Gareth in the tavern of Goldenhaven...";
const structuredLore = await extractStructuredLore(narrative);

// Automatically adds facts with rich metadata:
// - Character: "Sir Gareth" (role: knight, importance: secondary)
// - Location: "tavern" (type: social, context: meeting place)
// - Location: "Goldenhaven" (type: settlement, scale: city)
```

### Error Handling
The system includes robust error handling for AI failures:
- Graceful degradation when AI services are unavailable
- Fallback to manual fact extraction
- No corrupt data - better no extraction than bad extraction

## Testing

### Test Harness
Use the lore viewer test harness at `/dev/lore-viewer` to:
- Test AI-powered fact extraction
- Verify session filtering functionality  
- Add sample facts for development
- Test error handling scenarios

### Unit Tests
```bash
npm test -- loreStore.test.ts
npm test -- structuredLoreExtractor.test.ts
```

## Performance Considerations

### Token Management
- Facts are prioritized by relevance and recency for AI context
- Token budget management prevents context overflow
- Only relevant facts included in narrative generation prompts

### Storage Efficiency
- IndexedDB persistence for client-side storage
- Efficient fact retrieval with world and session scoping
- Cleanup utilities for removing outdated facts

## Configuration

### Environment Variables
```env
# AI service configuration
GOOGLE_AI_API_KEY=your_api_key_here

# Development mode (uses mock extraction)
NODE_ENV=development
```

### Store Configuration
The lore store follows standard Zustand patterns with CRUD operations:
- `addFact()` - Add individual facts
- `addStructuredLore()` - Add AI-extracted facts in batch
- `getFacts()` - Retrieve facts with filtering
- `updateFact()` - Modify existing facts
- `deleteFact()` - Remove facts
- `clearFacts()` - Clear all facts for a world

## Future Enhancements
- Advanced contradiction detection
- Fact importance scoring
- Cross-reference validation
- Narrative coherence metrics
- Export/import functionality

## Related Documentation
- [AI Service Integration](./ai-service-api.md)
- [State Management Usage](./state-management-usage.md)
- [Narrative Generation Usage](./narrative-generator-usage.md)