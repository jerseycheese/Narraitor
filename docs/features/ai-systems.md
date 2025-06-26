---
title: AI Systems
tags: [ai, narrative, world-creation, choices]
created: 2025-06-26
updated: 2025-06-26
---

# AI Systems

Comprehensive guide to AI-powered features in Narraitor using Google Gemini.

## Overview

Narraitor uses Google Gemini AI for multiple systems:
- **Narrative Generation**: Dynamic story creation and progression
- **Choice Generation**: Context-aware player options
- **World Suggestions**: AI-assisted world attribute and skill recommendations
- **Smart Templates**: Automated world template generation
- **Ending Detection**: Intelligent story conclusion point detection

## Security Architecture

### Secure Proxy Pattern
- **Client**: Uses `ClientGeminiClient` (proxies to API routes)
- **Server**: Uses `GeminiClient` with secure API key
- **API Routes**: `/api/narrative/generate`, `/api/narrative/choices`, `/api/generate-portrait`

### Rate Limiting & Protection
- **50 requests/hour per IP**
- Server-side API key protection (`GEMINI_API_KEY`)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

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

### Quick Start
```tsx
import { GameSessionActiveWithNarrative } from '@/components/GameSession';

<GameSessionActiveWithNarrative
  worldId="world-id"
  sessionId="session-id"
  onChoiceSelected={(choiceId) => {
    // Choice automatically processed
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
- Filtered for appropriate difficulty and tone

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

## Ending Detection

AI-powered detection of natural story conclusion points.

### Key Features
- **Pure AI Analysis**: No keyword matching - understands narrative structure
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

## Testing & Development

### Manual Testing
- `/dev/ai-ending-detection` - Test ending detection scenarios
- `/dev/world-creation-wizard` - Test AI world suggestions
- `/dev/game-session` - Test narrative and choice generation

### Test Scenarios
1. **Narrative Generation**: Various world themes and contexts
2. **Choice Generation**: Different narrative situations
3. **World Suggestions**: Multiple genre combinations
4. **Ending Detection**: Conclusive vs ongoing stories

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