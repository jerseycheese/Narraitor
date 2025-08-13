# Personalized Narrative Content Generation System

## Why This Matters

Ever notice how some players love getting into long conversations with NPCs while others just want to stab things and move on? Or how some people want every tiny detail described while others prefer to get straight to the action? 

This system watches how players actually play and adapts the storytelling to match their style. If you're the type who always chooses diplomatic solutions, the AI will start generating more conversation-heavy scenarios. If you prefer action, you'll get more opportunities for combat and adventure. It's like having a DM who actually pays attention to what you enjoy.

## The Two Main Pieces

### PersonalizationEngine - The Brain
This is where the magic happens. The engine looks at all the choices a player has made and figures out what kind of experience they're probably looking for.

The key things it does:
- **Analyzes player behavior** to detect personality traits (are they aggressive? diplomatic? cautious?)
- **Creates personalized context** that gets fed to the AI
- **Generates narrative enhancement** - basically instructions for the AI about how to tell the story for this specific player

What makes it smart:
- **Dynamic preference detection** - it figures out if you like action, dialogue, or exploration without you having to set preferences
- **Bulletproof input handling** - validates and sanitizes everything so malicious input can't break things
- **Graceful degradation** - if the fancy AI analysis fails, it falls back to simpler pattern matching

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

## How It Figures Out What You Like

### Reading Your Play Style
The system is pretty good at detecting what kind of player you are just by watching your choices:

- **Action Junkie**: If more than 40% of your choices are aggressive or chaotic, you obviously like things fast-paced
- **People Person**: More than 40% diplomatic or helpful choices? You're here for the character interactions
- **The Thinker**: More than 30% stealthy or cautious choices means you like to plan and strategize
- **Conversation Lover**: If 30% of your choices happen in dialogue contexts, you want to talk things out
- **Explorer**: The default for everyone else - you like a mix of everything

### Detail Preferences
It also figures out how much description you actually want:

- **Detail Oriented**: If most of your choices (>60%) happen in rich contexts with location, situation, and character details, you want the full cinematic experience
- **Moderate**: You want some detail but not overwhelming amounts (30-60% rich contexts)
- **Get to the Point**: Less than 30% rich contexts means you prefer streamlined storytelling

### Action vs. Talk
The system tracks whether you prefer doing things or talking about things:

- **Action Focus**: Your action choices outnumber dialogue choices by more than 20%
- **Dialogue Focus**: You choose talking over doing by more than 20% 
- **Balanced**: You like a good mix of both

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

### Basic Personalization
```typescript
const engine = new PersonalizationEngine();
const tracker = new PlayerDecisionTracker();

// Record player decisions
tracker.recordDecision(
  'What do you do?',
  'Help the stranger',
  'helpful',
  'session-1',
  'world-1'
);

// Get personalized context
const decisions = tracker.getWorldDecisions('world-1');
const context = engine.createPersonalizedContext(
  character,
  world,
  decisions
);

// Generate narrative enhancement
const enhancement = engine.generateNarrativeEnhancement(context);
```

### Decision Pattern Analysis
```typescript
const tracker = new PlayerDecisionTracker();

// Analyze player behavior patterns
const patterns = tracker.analyzeChoicePatterns();
console.log(patterns.dominantChoiceTypes); // ['diplomatic', 'helpful']
console.log(patterns.patternStrength); // 75 (strong pattern)

// Get behavior analysis
const analysis = engine.analyzePlayerBehavior(character, world, decisions);
console.log(analysis.detectedTraits); // ['diplomatic', 'empathetic', 'logical']
console.log(analysis.preferences.narrativeStyle); // 'character-driven'
```

## Integration Points

### Narrative Generator Integration
The system integrates with `NarrativeGenerator` to enhance story generation:

```typescript
// In narrativeGenerator.ts
const personalizationEngine = new PersonalizationEngine();
const context = personalizationEngine.createPersonalizedContext(/* ... */);
const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

// Enhancement is used to inform AI narrative generation
const prompt = `${basePrompt}\n\nPersonalization:\n${enhancement}`;
```

### Data Flow
1. Player makes choices during gameplay
2. `PlayerDecisionTracker` records and validates decisions
3. `PersonalizationEngine` analyzes patterns and creates context
4. Enhanced context informs AI narrative generation
5. Resulting narrative reflects player preferences

## Performance Characteristics

### Complexity
- Decision analysis: O(n) where n = number of decisions
- Pattern detection: O(n) for statistical analysis
- Memory usage: Constant overhead with configurable limits

### Storage Limits
- Maximum decisions per session: 50 (configurable)
- Maximum total decisions: 500 (configurable)
- Automatic cleanup of old decisions

### Optimization Features
- Efficient filtering for session/world-specific decisions
- Lazy loading of decision history
- Sanitization with length limits to prevent memory issues

## Testing Coverage

### Test Categories
1. **Core Functionality Tests** (7 tests)
   - Narrative enhancement generation
   - Dynamic style inference
   - Input sanitization
   - Player behavior analysis

2. **Decision Tracking Tests** (12 tests)
   - Decision recording and retrieval
   - Pattern analysis algorithms
   - Input validation and sanitization
   - Edge case handling

3. **Integration Tests** (2 tests)
   - Engine-tracker integration
   - Decision pattern influence verification

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

### Personalization Thresholds
All thresholds are configurable in the engine implementation:
- Style detection percentages (40% for action/social, 30% for stealth)
- Detail level thresholds (60% detailed, 30% moderate)
- Content focus difference threshold (20%)

## Future Enhancements

### Planned Improvements
1. **Temporal Weighting**: Recent decisions have more influence
2. **Cross-Session Learning**: Learn preferences across multiple games
3. **Advanced Pattern Recognition**: ML-based preference detection
4. **Multi-Character Analysis**: Track preferences per character type

### Storage Abstraction
Currently uses client-side storage; planned abstractions for:
- Server-side persistence
- Cloud synchronization
- Multi-device preference sync

## API Reference

### PersonalizationEngine Methods

#### `analyzePlayerBehavior(character, world, decisions, relationships?, goals?): PersonalizationAnalysis`
Analyzes player behavior patterns to detect traits and preferences.

#### `createPersonalizedContext(character, world, decisions, relationships?, goals?, narrativeHistory?): PersonalizedNarrativeContext`
Creates comprehensive personalized context for narrative generation.

#### `generateNarrativeEnhancement(context): string`
Generates narrative enhancement text based on personalized context.

### PlayerDecisionTracker Methods

#### `recordDecision(prompt, choiceText, choiceType, sessionId, worldId, context?): PlayerDecision`
Records a player decision with full validation and sanitization.

#### `analyzeChoicePatterns(decisions?): ChoicePatternAnalysis`
Analyzes decision patterns to identify behavioral trends.

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

**Problem**: Pattern strength too low
**Solution**: Ensure sufficient decision history (>10 decisions for reliable patterns)

### Debug Helpers
```typescript
// Check decision recording
console.log(tracker.getRecentDecisions(1));

// Verify pattern analysis
const analysis = tracker.analyzeChoicePatterns();
console.log('Pattern strength:', analysis.patternStrength);

// Test personalization context
const context = engine.createPersonalizedContext(character, world, decisions);
console.log('Detected traits:', context.character.personality);
```