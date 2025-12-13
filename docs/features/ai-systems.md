---
title: AI Systems
tags: [ai, narrative, world-creation, choices, inventory]
created: 2025-06-26
updated: 2025-10-11
---

# AI Systems

This the AI integration here is pretty central to the whole experience. The key insight was that generic AI story generation produces bland results, but if you give the AI specific context about your world's rules and tone, it can generate content that feels authentic to that setting.

## What the AI Does

**Narrative Generation** - Creates story segments that adapt to your world's theme and tone. A noir detective story feels completely different from a space opera adventure.

**Choice Generation** - Provides contextual player options that make sense for the current situation and character abilities.

**World Building Assistance** - Suggests appropriate attributes and skills based on your world's genre and description.

**Smart Goal Tracking** - Automatically extracts and tracks player objectives from the narrative flow.

**Ending Detection** - Recognizes when a story arc has reached a natural conclusion point.

**Story Checkpoint Generation** - Creates AI-powered "story so far" summaries at major narrative beats to keep long sessions coherent. See `docs/features/story-checkpoints.md` for details.

## Security & Performance

The AI requests all go through secure server-side routes to keep API keys protected:

- **Rate limiting**: 50 requests/hour per IP to prevent abuse and control costs
- **Server-side keys**: `GEMINI_API_KEY` never reaches the browser
- **Proxy pattern**: Client-side code calls Next.js API routes, which handle the actual AI communication

## AI Service Integration

### Client-side Usage
```typescript
import { createDefaultGeminiClient } from '@/lib/ai/gemini-client';

const client = createDefaultGeminiClient();
const response = await client.generateContent('Generate a story about a cowboy');
```

### Server-side Usage (API Routes Only)
```typescript
import { GeminiClient } from '@/lib/ai/gemini-client';

const client = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash'
});
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
import { GameSessionActiveWithNarrative } from '@/components/GameSession';

<GameSessionActiveWithNarrative
  worldId="world-id"
  sessionId="session-id"
  onChoiceSelected={(choiceId) => {
    // Choice automatically processed with skill evaluation
  }}
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
  choices={aiGeneratedChoices}
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
import { WorldCreationWizard } from '@/components/World';

<WorldCreationWizard
  onWorldCreated={(world) => {
    // World created with AI suggestions
  }}
  enableAISuggestions={true}
/>
```

## Smart Templates

The AI can generate complete world templates in three ways: "Inspired By" takes your description and builds a template from it, "Genre Mixer" combines multiple genres for unique worlds, and "Surprise Me" generates unexpected concepts.

```tsx
import { SmartTemplates } from '@/components/World/SmartTemplates';

<SmartTemplates
  onTemplateGenerated={(template) => {
    // Use generated template
  }}
/>
```

Each template includes the world name and description, suggested attributes and skills, theme and genre info, and a preview modal so you can review before using it.

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
import { aiContextStore } from '@/state/aiContextStore';

const context = aiContextStore.buildContextForSession(sessionId, {
  includeGoals: true,
  maxTokens: 500,
  prioritizeRecent: true
});

// Returns formatted goal context for AI consumption
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

## AI Mocking System

This solves a pretty common development problem: you want to test how your code handles different AI response scenarios, but you don't want to burn through your API quota or deal with network issues while you're trying to debug something.

The mocking system basically intercepts AI requests when enabled and returns predefined responses instead of hitting the real API. This means you can test timeout scenarios, rate limit errors, or specific response patterns without depending on external services.

There are five built-in scenarios that cover the most common testing situations. The success scenario returns a standard AI response, while the others simulate various failure modes: timeouts (which happen more often than you'd think), rate limiting, API key issues, and network errors. The timeout scenario has a 2-second delay to simulate real network conditions.

You can also create custom scenarios if you need to test specific response patterns. So if you're working on horror-themed narrative generation, you could set up a mock response that returns appropriately dark content:

```typescript
{
  id: 'custom-horror-response',
  name: 'Horror Narrative Test',
  description: 'Tests dark/horror themed narrative generation',
  delay: 1500,
  shouldSucceed: true,
  response: {
    segments: [{
      content: 'The shadows whispered ancient secrets...',
      choices: [
        'Investigate the whispers',
        'Flee immediately',
        'Light a torch'
      ]
    }]
  }
}
```

The nice thing about the integration is that existing AI service calls don't need to change. When mocking is enabled, the system automatically returns mock responses instead of making real API calls:

```typescript
import { createDefaultGeminiClient } from '@/lib/ai/gemini-client';

const client = createDefaultGeminiClient();
// Returns mock response if mocking enabled, otherwise calls real API
const response = await client.generateContent(prompt);
```

All the mock configuration persists across browser sessions, so you can set up your testing scenarios once and they stick around. The responses include realistic delays with some variation (about ±20%), which helps catch timing-related bugs that only show up with actual network conditions.

## Testing & Development

### Manual Testing
There are several dev routes set up for testing different AI features:

- `/dev/world-creation-wizard` - Test AI world suggestions
- `/dev/game-session` - Test narrative and choice generation
- `/dev/devtools-test` - Test AI mocking functionality

### Test Scenarios
The testing harnesses let you try out different scenarios without having to set up complete game sessions. You can test narrative generation with various world themes, try different choice generation situations, experiment with genre combinations for world suggestions, and compare conclusive vs ongoing stories for ending detection. The AI mocking section is particularly useful for testing error scenarios and edge cases that are hard to reproduce with the real API.

## Error Handling

When AI service fails, the app continues without AI features. There's automatic retry logic with exponential backoff, and fallback content provides default options when AI is unavailable.

For network issues, there's a 15-second timeout on AI requests, clear error messages when rate limits are exceeded, and user-friendly error states for connection problems.

## Configuration

Environment variables are straightforward: `GEMINI_API_KEY` is required and server-side only (never use NEXT_PUBLIC_ prefix), `NEXT_PUBLIC_DEBUG_LOGGING=true` is optional for development debugging, and `ENABLE_TOKEN_BUDGET_MANAGER=true` is an opt-in switch for token-budget-based prompt truncation.

The model configuration uses gemini-2.0-flash as the primary model, temperature of 0.7 for creative content, and max tokens vary by use case (200 for choices, 500 for narrative).

## Best Practices

Keep API keys server-side only - never expose them to the client. Respect API limits and user quotas. Always provide fallback experiences when AI fails. Optimize prompt context for token efficiency since you're paying per token. Let users accept or reject AI suggestions rather than forcing them. Use the development harnesses for testing AI features.
