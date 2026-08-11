# Personalized Narrative Content Generation System

## Why This Matters

Some players love long conversations with NPCs; others just want to stab things and move on. Some want every detail described; others prefer to get straight to the action.

This system watches how players actually play and adapts the storytelling to match their style. Instead of manually calculating complex patterns, we send raw decision data to Gemini and let the LLM do what it's good at - recognizing patterns and adapting narratives.

## The Two Main Pieces

### personalizationEngine - The Data Formatter
`src/lib/ai/personalizationEngine.ts` takes player choices and formats them for the LLM to
analyze. It's a set of plain exported functions, not a class - there's nothing to instantiate.

The key things it does:
- **Aggregates basic choice data** (what types of choices are most common)
- **Creates personalized context** with raw decision history
- **Generates narrative enhancement** - simple instructions that include the actual decision data for Gemini to analyze

What makes it work:
- **Sends raw data to LLM** - lets Gemini infer patterns instead of pre-calculating them
- **Bulletproof input handling** - validates and sanitizes everything so malicious input can't break things
- **Simple aggregation** - tracks choice type counts but leaves pattern inference to the AI

### PlayerDecisionTracker - The Memory
This component remembers everything you do and organizes it in ways that are useful for personalization.

What it tracks:
- **Every choice you make** with full validation to prevent data corruption
- **Behavioral patterns** over time (are you becoming more aggressive? more cautious?)
- **Session and world context** so your fantasy character's choices don't affect your sci-fi character

Built-in protection:
- **XSS protection** because security matters even in single-player games
- **Storage limits** so the system doesn't eat all your disk space
- **Smart filtering** to get just the decisions that matter for analysis

## How It Works

### Simple Relevance Scoring
The system uses a straightforward recency-based approach instead of complex scoring:
- Filters decisions by world/session context
- Sorts by timestamp (most recent first)
- Takes top 10 decisions
- Lets the AI infer contextual relevance from chronological history

This approach is simpler and lets the LLM do what it's good at - recognizing patterns.

### LLM-Based Pattern Recognition
Instead of manually calculating complex heuristics, the system sends your raw decision history to Gemini and lets the AI figure out your preferences. This approach:

- **Reduces code complexity**: No need for dozens of threshold checks and pattern matching algorithms
- **Adapts naturally**: LLMs are good at recognizing patterns in human behavior
- **Stays flexible**: Adding new decision types or genres doesn't require rewriting detection logic

### What Gets Sent to the LLM
The personalization engine formats your recent decisions into a simple structure:

- **Decision text**: What you actually chose
- **Decision type**: Category (diplomatic, aggressive, stealthy, etc.)
- **Context**: Where you were and who was present
- **Active goals**: What your character is trying to achieve

Example of what Gemini sees:
```
RECENT PLAYER DECISIONS:
• Help the stranger at the tavern (with: Innkeeper, Guard) [helpful]
• Sneak past the guards at the city gates [stealthy]
• Confront the merchant about the stolen goods (with: Merchant) [aggressive]

Based on these decisions, adapt the narrative to match the player's style and reference past choices where relevant.
```

The AI uses this to tailor narrative descriptions, dialogue, and choice presentations to match how you actually play.

## Security Features

### Input Validation
All user inputs are validated and sanitized:

```typescript
// Removes XSS attack vectors
const sanitizeString = (str: string) => {
  return str.replace(/[<>'\"&]/g, '').substring(0, maxLength).trim();
};
```

### Length Limits
- Prompt: 500 characters
- Choice text: 300 characters
- Location: 100 characters
- Character names: 50 characters each (max 10)

### Validation Rules
- Required fields validation
- Choice type enum validation
- Context object sanitization
- Graceful error handling

## Usage Examples

### Basic Usage
```typescript
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import {
  createPersonalizedContext,
  generateNarrativeEnhancement,
} from '@/lib/ai/personalizationEngine';

// Record player decisions
playerDecisionTracker.recordDecision(
  'What do you do?',
  'Help the stranger',
  'helpful',
  'session-1',
  'world-1'
);

// Get personalized context. The first argument is the current narrative context
// ({ worldId, sessionId? }); world/session filtering is the optional third argument.
const decisions = playerDecisionTracker.getRelevantDecisions(
  { worldId: 'world-1' },
  10
);
const context = createPersonalizedContext(character, world, decisions);

// Generate narrative enhancement (formatted for LLM)
const enhancement = generateNarrativeEnhancement(context);
// Returns formatted string with recent decisions for Gemini to analyze
```

### Simple Pattern Tracking
```typescript
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { analyzePlayerBehavior } from '@/lib/ai/personalizationEngine';

// Basic choice pattern aggregation
const patterns = playerDecisionTracker.analyzeChoicePatterns();
console.log(patterns.dominantChoiceTypes); // ['diplomatic', 'helpful']
console.log(patterns.patternStrength); // 75

// Lightweight behavior analysis (for UI display)
const analysis = analyzePlayerBehavior(character, decisions);
console.log(analysis.detectedTraits); // ['diplomatic', 'empathetic', 'logical']
console.log(analysis.preferences.preferredChoiceTypes); // ['diplomatic', 'helpful']
```

## Integration Points

### Narrative Generator Integration
The system integrates with `NarrativeGenerator` to enhance story generation:

```typescript
// In narrativeGenerator.ts
const context = createPersonalizedContext(/* ... */);
const enhancement = generateNarrativeEnhancement(context);

// Enhancement is used to inform AI narrative generation
const prompt = `${basePrompt}\n\nPersonalization:\n${enhancement}`;
```

### Choice Generator Integration
The choice generator uses decision history to personalize player options. Pass a sessionId and it automatically pulls relevant past decisions to shape the choices it generates.

```typescript
await choiceGenerator.generateChoices({
  worldId,
  narrativeContext,
  characterIds,
  sessionId, // Enables decision history
  includeDecisionHistory: true // Default
});
```

**How it works:**
The choice generator grabs your recent decision history (up to 10 decisions) and includes it in the prompt when generating new options. The system prioritizes decisions from your current session first, then falls back to world-wide decisions if the session is new. Decisions are sorted by recency and formatted for the AI, which uses them to generate choices that feel consistent with how you've been playing.

**Token budget:** ~500 tokens (10 decisions × ~50 tokens each) for choices.

**Example:** If you've been diplomatic (negotiating, talking down merchants), the generator offers options like "Try to negotiate with the dragon" instead of just "attack" or "flee." If you've been aggressive, choices acknowledge your reputation: "Attack before they recognize you" or "Draw your weapon and demand answers."

### Data Flow
1. Player makes choices during gameplay
2. `PlayerDecisionTracker` records and validates decisions
3. During narrative generation:
   - `personalizationEngine` analyzes patterns and creates context
   - Enhanced context informs AI narrative generation
4. During choice generation:
   - `simpleDecisionRelevance` filters decisions by recency and context
   - `simpleDecisionFormatter` creates token-efficient decision history
   - Enhanced prompt generates personalized player options
5. Resulting narrative AND choices reflect player preferences

## Performance Characteristics

### Simplicity Benefits
- Decision aggregation: O(n) where n = number of decisions
- No complex pattern algorithms: Pattern inference happens in the LLM, not in client code
- Memory usage: Minimal overhead with basic counting

### Storage Limits
- Maximum decisions per session: 50 (configurable)
- Maximum total decisions: 500 (configurable)
- Automatic cleanup of old decisions

### Efficiency Features
- Efficient filtering for session/world-specific decisions
- Only sends last 5-10 decisions to LLM (not entire history)
- Input sanitization prevents memory bloat

## Testing Coverage

### Test Categories
1. **Core Functionality Tests**
   - Narrative enhancement formatting
   - Decision data structuring for LLM
   - Input sanitization
   - Basic behavior aggregation

2. **Decision Tracking Tests**
   - Decision recording and retrieval
   - Simple pattern counting
   - Input validation and sanitization
   - Edge case handling

3. **Integration Tests**
   - Engine-tracker integration
   - Decision formatting verification

### Security Testing
- XSS prevention validation
- Input length limit enforcement
- Malicious input sanitization
- Error boundary testing

## Configuration Options

### PlayerDecisionTracker Config
```typescript
interface DecisionTrackerConfig {
  maxDecisionsPerSession: number; // Default: 50
  maxTotalDecisions: number;      // Default: 500
  storageKey: string;             // Default: 'narraitor_player_decisions'
}
```

### Personalization Settings
The engine uses minimal configuration:
- Recent decision limit: 5-10 decisions sent to LLM
- Trait detection: Top 3 most common traits from choice type mapping
- Confidence scaling: Based on decision count (decisions * 15, max 85)

## Future Enhancements

### Potential Improvements
1. **Temporal Weighting**: Recent decisions have more influence on LLM context
2. **Cross-Session Learning**: Aggregate preferences across multiple playthroughs
3. **Genre-Specific Context**: Include genre-specific decision patterns in LLM prompt
4. **Dynamic Confidence**: Adjust LLM instructions based on decision history depth

### Storage Abstraction
Currently uses client-side storage; planned abstractions for:
- Server-side persistence
- Cloud synchronization
- Multi-device preference sync

## API Reference

### personalizationEngine functions

These are module-level exports from `src/lib/ai/personalizationEngine.ts`. Import them by name.

#### `analyzePlayerBehavior(character, decisions, relationships?, goals?): PersonalizationAnalysis`
Performs basic aggregation of player decisions and detects top 3 personality traits.

#### `createPersonalizedContext(character, world, decisions, relationships?, goals?, narrativeHistory?): PersonalizedNarrativeContext`
Creates structured context object containing recent decisions and basic preferences.

#### `generateNarrativeEnhancement(context): string`
Formats decision history into LLM-ready text with instructions for pattern inference.

### PlayerDecisionTracker methods

`PlayerDecisionTracker` is a class, but you almost always want the shared `playerDecisionTracker`
singleton exported from the same module rather than a fresh instance.

#### `recordDecision(prompt, choiceText, choiceType, sessionId, worldId, context?): PlayerDecision`
Records a player decision with full validation and sanitization.

#### `analyzeChoicePatterns(decisions?): ChoicePatternAnalysis`
Simple aggregation of choice types to identify most common patterns.

#### `getSessionDecisions(sessionId): PlayerDecision[]`
Retrieves all decisions for a specific session.

#### `getWorldDecisions(worldId): PlayerDecision[]`
Retrieves all decisions for a specific world.

#### `getRecentDecisions(dayCount): PlayerDecision[]`
Retrieves recent decisions within specified time frame.

## Troubleshooting

### Common Issues

**Problem**: Personalization not reflecting recent choices
**Solution**: Check if decisions are being recorded properly with `tracker.getRecentDecisions()`

**Problem**: XSS validation errors
**Solution**: Ensure all text inputs are properly sanitized; check console for validation messages

**Problem**: Storage limits exceeded
**Solution**: Adjust `maxTotalDecisions` configuration or implement decision cleanup

**Problem**: Not enough context for LLM
**Solution**: Ensure at least 5-10 decisions exist before expecting personalized narratives

### Debug Helpers
```typescript
// Check decision recording
console.log(tracker.getRecentDecisions(1));

// Verify pattern aggregation
const analysis = tracker.analyzeChoicePatterns();
console.log('Dominant types:', analysis.dominantChoiceTypes);

// Test LLM enhancement formatting
const context = engine.createPersonalizedContext(character, world, decisions);
const enhancement = engine.generateNarrativeEnhancement(context);
console.log('LLM context:', enhancement);
```