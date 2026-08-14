---
title: AI Systems
tags: [ai, narrative, world-creation, choices, inventory]
created: 2025-06-26
updated: 2026-07-21
---

# AI Systems

The AI integration is pretty central to the whole experience. Generic AI story generation produces bland results, but giving the AI specific context about a world's rules and tone gets you content that feels authentic to that setting.

## What the AI Does

**Narrative Generation** - Creates story segments that adapt to your world's theme and tone. A noir detective story feels completely different from a space opera adventure.

**Choice Generation** - Provides contextual player options that make sense for the current situation and character abilities.

**World Building Assistance** - Suggests appropriate attributes and skills based on your world's genre and description.

**Goal Tracking** - Automatically extracts and tracks player objectives from the narrative flow.

**Ending Detection** - Recognizes when a story arc has reached a natural conclusion point.

**Story Checkpoint Generation** - Creates AI-powered "story so far" summaries at major narrative beats to keep long sessions coherent. See `story-checkpoints.md` for details.

## Security & Performance

The AI requests all go through server-side routes, with player-owned provider keys handled per request:

- **Rate limiting**: 50 requests/hour per IP in production (500 in dev) on the narrative generation routes, via `src/utils/rateLimiter.ts`; over the limit returns 429 with `X-RateLimit-*` headers
- **Player provider keys**: saved through `/settings/providers`, encrypted in `useProviderStore`, decrypted just in time, and sent to Narraitor's same-origin API routes as `x-provider-api-key`
- **Server fallback**: `GEMINI_API_KEY` never reaches the browser and is used only when a request has no player provider key
- **Proxy pattern**: Client-side code calls Next.js API routes, which handle the actual AI communication

## AI Service Integration

### Client-side Usage
```typescript
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

const client = createDefaultGeminiClient();
const response = await client.generateContent('Generate a story about a cowboy');
```

### Server-side Usage (API Routes Only)
```typescript
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';

const apiKey = resolveApiKey(request);
const client = createDefaultGeminiClient(apiKey);
```

## Narrative Generation

### Inventory Integration

The narrative generator has access to character inventory and can naturally reference items in the story. The system prioritizes narratively significant items (quest items, equipment, recently acquired items) and includes the top 8 in the AI context. The AI is instructed to only mention items when contextually appropriate - no forced references - and to vary how it uses them to avoid repetition.

This means if you just picked up a magic sword, the AI might naturally reference it when generating combat scenarios, but won't awkwardly shoehorn it into every paragraph.

### Skill-Aware Narrative

The narrative generator handles skill checks through a tag system. When a player selects a choice with skill requirements, the system evaluates whether their character meets the requirement and adds a success or failure tag to the narrative context. The AI then uses these tags to generate appropriate story outcomes.

The key thing here is that the AI never sees the character's actual skill levels - just the success/failure tags. This prevents it from exposing game mechanics in the narrative. So instead of generating something like "Your Stealth skill of 3 isn't enough," it generates actual story consequences: "Your footstep echoes. Guards turn toward you."

```typescript
// Success tag
currentTags: ['skill-success:stealth']
// Generates: "You slip past unnoticed..."

// Failure tag
currentTags: ['skill-failure:stealth']
// Generates: "Your footstep echoes. Guards turn toward you..."
```

### Quick Start
```tsx
import ActiveGameSession from '@/components/GameSession/ActiveGameSession';

<ActiveGameSession
  worldId="world-id"
  sessionId="session-id"
  onChoiceSelected={handleChoiceSelected}
/>
```

### Manual Integration
```tsx
import { NarrativeController } from '@/components/Narrative';

<NarrativeController
  worldId="world-id"
  sessionId="session-id"
  triggerGeneration={true}
  onNarrativeGenerated={(segment) => {
    // Handle new narrative segment
  }}
/>
```

## Choice Generation

### AI-Generated Choices

The choice generator creates 3-4 contextual options based on the current narrative and world context. When adding skill requirements to choices, it only knows about the world's available skills - not the character's actual skill levels. This is intentional: the AI generates varied difficulty levels to create challenging choices without being able to "tune" them to the character's capabilities.

This means you'll see choices you might fail at, which is the point. The AI can't soften the difficulty just because your character has low skills.

### Custom Player Input

Players can type their own actions instead of picking from AI suggestions. These custom inputs go through the same narrative pipeline as generated choices, just with a 250-character limit and visual feedback as you type.

### Integration Example
```tsx
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';

<ChoiceSelector
  decision={currentDecision}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomInput}
  customInputPlaceholder="Describe your action..."
/>
```

## World Suggestions

The AI can suggest attributes and skills during world creation. You describe your world setting and themes, the system analyzes what you wrote and generates relevant suggestions, then you review and decide which ones to use. You're in full control - accept the ones that fit, ignore the rest.

For example, describe a fantasy world as "A mystical realm where ancient magic flows through crystalline ley lines" and the AI might suggest attributes like Arcane Power, Dragon Affinity, and Mystic Insight, along with skills like Spellcasting, Ley Line Navigation, and Crystal Resonance.

### Integration
```tsx
import WorldCreationWizard from '@/components/WorldCreationWizard/WorldCreationWizard';

<WorldCreationWizard
  onComplete={(worldId) => {
    // World created with reviewed suggestions
  }}
/>
```

## Goal Tracking System

The AI automatically extracts and tracks player objectives to keep the narrative consistent. It identifies goals from the story (both explicit and implicit), monitors progress and completion, and includes active goals in AI prompts so the narrative stays focused on what matters.

Goals get prioritized as critical, high, medium, or low, and they're organized by game session so each playthrough maintains its own focus. There are six types: Immediate (right-now actions), Quest (specific objectives with clear completion), Exploration (discovery-based), Social (relationship and interaction), Mystery (investigation and puzzles), and Survival (life-threatening situations).

### Integration Example
```typescript
// Goals are automatically extracted from narrative
const narrative = "The wizard warned me that the dragon will attack at dawn. I must find the Sword of Light before then.";

// System extracts: "Find the Sword of Light" (critical priority, quest type)
// Goals automatically included in subsequent AI prompts:
// "ACTIVE GOALS: URGENT: Find the Sword of Light before dawn"
```

### Context Building
```typescript
import { useAiContextStore } from '@/state/aiContextStore';

const context = await useAiContextStore.getState().buildContextForSession(sessionId, {
  includeGoals: true,
  maxChars: 500,
  prioritizeRecent: true
});

// Returns formatted goal context for AI consumption (async)
```

### Detailed Documentation
- **API Reference**: [Goal System API](../api/goal-system-api.md)
- **Usage Guide**: [Goal Tracking Usage](../technical-guides/goal-tracking-usage.md)
- **Integration Guide**: [Goal System Integration](../technical-guides/goal-system-integration.md)
- **Feature Overview**: [Narrative Consistency Tracking](./narrative-consistency-tracking.md)

## Ending Detection

The AI detects when the story reaches a natural conclusion point. It uses pure AI analysis instead of keyword matching, so it actually understands narrative structure. The system looks at recent segments and the broader story context, then only suggests endings when it has medium or high confidence. Types include story-complete, character-retirement, and session-limit.

### Response Format
```json
{
  "suggestEnding": true/false,
  "confidence": "high" | "medium" | "low",
  "endingType": "story-complete" | "character-retirement" | "session-limit" | "none",
  "reason": "Clear explanation of why this is/isn't a good ending point"
}
```

### Integration
```tsx
interface NarrativeControllerProps {
  onEndingSuggested?: (reason: string, endingType: EndingType) => void;
}

// Automatically runs after each narrative segment
await checkForEndingIndicators(newSegment);
```

### Context Analysis

The system looks at the last 5 narrative segments for immediate analysis and earlier story summary for overall understanding. It needs at least 3 segments before it starts analyzing for potential endings.

## Mocking AI Responses

There's no in-app mock toggle. Mocking happens at the network boundary instead, which keeps the app on one code path whether or not you're mocking.

For Playwright specs, `tests/visual/utils/mockApi.ts` routes the AI endpoints to fixed responses and takes per-endpoint delays, so you can reproduce a slow generation without waiting on the real thing:

```typescript
import { mockApiEndpoints } from '../utils/mockApi';

await mockApiEndpoints(page, { narrativeDelayMs: 3000 });
await page.goto('/game-session');
```

For unit tests, mock the wrapper under `src/lib/api/` that the component calls, or hand the parse layer a `Response` whose `.json()` throws — that's the only way to reach the malformed-body path, since a routed mock still returns well-formed bytes.

To exercise a missing or invalid key, omit or corrupt the provider key rather than simulating the failure. The routes already return their own fallbacks when no key resolves — portraits come back as Dicebear placeholders, for instance — so a keyless dev environment is itself a useful mock.

## Testing & Development

### Manual Testing
There are several dev routes set up for testing different AI features:

- `/dev/world-generation` - Test AI world suggestions
- `/dev/game-session` - Test narrative and choice generation
- `/dev/test-world-generation` - Test generated world data

### Test Scenarios
The testing harnesses let you try out different scenarios without having to set up complete game sessions. You can test narrative generation with various world themes, try different choice generation situations, experiment with genre combinations for world suggestions, and compare conclusive vs ongoing stories for ending detection. For error scenarios and edge cases that are hard to reproduce against the real API, mock at the network boundary as described above.

## Error Handling

When AI service fails, the app continues without AI features. There's automatic retry logic with exponential backoff, and fallback content provides default options when AI is unavailable.

For network issues, AI requests run against explicit timeout budgets (see `src/lib/constants/aiTimeouts.ts`), with clear error messages when rate limits are exceeded and user-friendly error states for connection problems.

## Configuration

Environment variables are straightforward: `GEMINI_API_KEY` is an optional server-side fallback (never use a `NEXT_PUBLIC_` provider key), and `NEXT_PUBLIC_DEBUG_LOGGING=true` is optional for development debugging.

The model configuration (`src/lib/ai/config.ts`) uses gemini-2.5-flash as the primary model and gemini-3.1-flash-image for image generation, temperature of 0.7 for creative content, and a 2048-token default output budget that individual callers can tighten (the significance validator caps at 200, for instance). Gemini's dynamic "thinking" is disabled by default — it burns latency and output-token budget on interactive game requests.

Timeout budgets live in `src/lib/constants/aiTimeouts.ts`, deliberately derived from each other so client and server can't drift: 30s for a single server-side Gemini attempt, 45s as the browser ceiling for single-attempt text routes, and 120s for routes that run the retry loop server-side or generate images.

## Best Practices

Keep API keys server-side only - never expose them to the client. Respect API limits and user quotas. Always provide fallback experiences when AI fails. Optimize prompt context for token efficiency since you're paying per token. Let users accept or reject AI suggestions rather than forcing them. Use the development harnesses for testing AI features.
