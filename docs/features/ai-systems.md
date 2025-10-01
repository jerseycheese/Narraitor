---
title: AI Systems
tags: [ai, narrative, world-creation, choices]
created: 2025-06-26
updated: 2025-06-26
---

# AI Systems

This the AI integration here is pretty central to the whole experience. The key insight was that generic AI story generation produces bland results, but if you give the AI specific context about your world's rules and tone, it can generate content that feels authentic to that setting.

## What the AI Does

**Narrative Generation** - Creates story segments that adapt to your world's theme and tone. A noir detective story feels completely different from a space opera adventure.

**Choice Generation** - Provides contextual player options that make sense for the current situation and character abilities.

**World Building Assistance** - Suggests appropriate attributes and skills based on your world's genre and description.

**Smart Goal Tracking** - Automatically extracts and tracks player objectives from the narrative flow.

**Ending Detection** - Recognizes when a story arc has reached a natural conclusion point.

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

### Skill-Aware Narrative

The narrative generator uses skill check tags to generate appropriate success/failure outcomes:

```typescript
// When player selects a choice with skill requirements:
// 1. System evaluates skill check
// 2. Adds skill-success:skillId or skill-failure:skillId tag
// 3. AI uses tags to generate narrative

// Success tag guidance:
currentTags: ['skill-success:stealth']
// AI generates: "You slip past unnoticed..."

// Failure tag guidance:
currentTags: ['skill-failure:stealth']
// AI generates: "Your footstep echoes. Guards turn toward you..."
```

**Important**: AI never receives character skill levels, only success/failure tags. This prevents exposing game mechanics in the narrative.

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
- 3-4 contextual options based on current narrative
- Generated automatically using world context
- Skill requirements added based on world skills (not character skills)
- AI generates varied difficulty levels to create challenging choices
- No access to character skill levels prevents AI from "tuning" difficulty

### Custom Player Input
- Free-text input for player actions
- Processed through same narrative pipeline
- 250-character limit with visual feedback

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

AI-powered attribute and skill suggestions during world creation.

### How It Works
1. **Describe Your World**: Provide detailed description of setting and themes
2. **AI Analysis**: System analyzes themes and generates suggestions
3. **Review Suggestions**: AI presents relevant attributes and skills
4. **Accept/Reject**: Full control over which suggestions to use

### Example Usage
For a fantasy world description:
> "A mystical realm where ancient magic flows through crystalline ley lines..."

**AI Suggestions:**
- **Attributes**: Arcane Power, Dragon Affinity, Mystic Insight
- **Skills**: Spellcasting, Ley Line Navigation, Crystal Resonance

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

AI-powered world template generation with three modes:

### Generation Modes
1. **Inspired By**: Generate templates based on user descriptions
2. **Genre Mixer**: Combine multiple genres for unique worlds
3. **Surprise Me**: Generate unexpected world concepts

### Components
```tsx
import { SmartTemplates } from '@/components/World/SmartTemplates';

<SmartTemplates
  onTemplateGenerated={(template) => {
    // Use generated template
  }}
/>
```

### Template Preview
Generated templates include:
- World name and description
- Suggested attributes and skills
- Theme and genre information
- Template preview modal before selection

## Goal Tracking System

AI-powered extraction and tracking of player objectives for narrative consistency.

### Key Features
- **Automatic Extraction**: AI identifies explicit and implicit goals from narrative content
- **Progress Tracking**: Monitors goal mentions, status, and completion
- **Context Integration**: Goals automatically included in AI prompts for consistency
- **Priority Management**: Critical, high, medium, and low priority classification
- **Session Isolation**: Goals organized by game session

### Goal Types
- **Immediate**: Right-now actions requiring immediate attention
- **Quest**: Specific objectives with clear completion criteria
- **Exploration**: Discovery-based goals for world exploration
- **Social**: Relationship and interaction objectives
- **Mystery**: Investigation and puzzle-solving goals
- **Survival**: Life-threatening situations requiring urgent action

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

AI-powered detection of natural story conclusion points.

### Key Features
- **Pure AI Analysis**: No keyword matching: understands narrative structure
- **Context-Aware**: Analyzes recent segments and broader story context
- **Confidence-Based**: Only suggests endings with medium/high confidence
- **Multiple Types**: story-complete, character-retirement, session-limit

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
- **Recent Context**: Last 5 narrative segments for immediate analysis
- **Broader Context**: Earlier story summary for overall understanding
- **Minimum Requirements**: At least 3 narrative segments before analysis

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

- `/dev/ai-ending-detection` - Test ending detection scenarios
- `/dev/world-creation-wizard` - Test AI world suggestions  
- `/dev/game-session` - Test narrative and choice generation
- `/dev/devtools-test` - Test AI mocking functionality

### Test Scenarios
The testing harnesses let you try out different scenarios without having to set up complete game sessions. You can test narrative generation with various world themes, try different choice generation situations, experiment with genre combinations for world suggestions, and compare conclusive vs ongoing stories for ending detection. The AI mocking section is particularly useful for testing error scenarios and edge cases that are hard to reproduce with the real API.

## Error Handling

### AI Service Failures
- **Graceful degradation**: System continues without AI features
- **Retry logic**: Automatic retries with exponential backoff
- **Fallback content**: Default options when AI unavailable

### Network Issues
- **Timeout handling**: 15-second timeout on AI requests
- **Rate limit responses**: Clear error messages when limits exceeded
- **Connection errors**: User-friendly error states

## Configuration

### Environment Variables
```bash
# Required: Server-side only
GEMINI_API_KEY=your-api-key

# Optional: Development debugging
NEXT_PUBLIC_DEBUG_LOGGING=true
```

### Model Configuration
- **Primary Model**: gemini-2.0-flash
- **Temperature**: 0.7 for creative content
- **Max Tokens**: Varies by use case (choices: 200, narrative: 500)

## Best Practices

1. **Server-side Only**: Never expose API keys to client
2. **Rate Limiting**: Respect API limits and user quotas
3. **Error Handling**: Always provide fallback experiences
4. **Context Management**: Optimize prompt context for token efficiency
5. **User Control**: Allow users to accept/reject AI suggestions
6. **Testing**: Use development harnesses for AI feature testing