# Personalized Narrative Content Generation System

## Overview

The Personalized Narrative Content Generation System is an AI-driven feature that adapts storytelling based on player behavior patterns and preferences. This system analyzes player decisions in real-time to create unique, tailored narrative experiences.

## Core Components

### PersonalizationEngine (`src/lib/ai/personalizationEngine.ts`)
The main engine that processes player behavior and generates personalized narrative contexts.

**Key Methods:**
- `analyzePlayerBehavior()` - Analyzes decision patterns to detect personality traits
- `createPersonalizedContext()` - Creates comprehensive personalization context
- `generateNarrativeEnhancement()` - Generates narrative enhancement text

**Features:**
- Dynamic preference inference (narrative style, detail level, content focus)
- Secure input validation and sanitization
- Structured data parsing with fallback handling
- Personality trait detection and mapping

### PlayerDecisionTracker (`src/lib/ai/playerDecisionTracker.ts`)
Tracks and analyzes player decision patterns for personalization insights.

**Key Methods:**
- `recordDecision()` - Records player decisions with validation
- `analyzeChoicePatterns()` - Analyzes behavioral patterns
- `getSessionDecisions()` / `getWorldDecisions()` - Filtered decision retrieval

**Features:**
- Secure input validation (XSS protection)
- Persistent storage with configurable limits
- Statistical pattern analysis
- Session and world-based filtering

## Dynamic Preference Inference

### Narrative Style Detection
The system automatically detects player preferences from choice patterns:

- **Action-focused**: >40% aggressive/chaotic choices
- **Character-driven**: >40% diplomatic/helpful choices  
- **Strategic**: >30% stealthy/cautious choices
- **Dialogue-heavy**: >30% conversation contexts
- **Exploration**: Default fallback

### Detail Level Inference
Analyzes context richness to determine detail preferences:

- **Detailed**: >60% rich contexts (location + situation + characters)
- **Moderate**: >30% rich contexts
- **Minimal**: <30% rich contexts

### Content Focus Analysis
Compares action vs dialogue preferences:

- **Action**: Action choices exceed dialogue by >20%
- **Dialogue**: Dialogue choices exceed action by >20%
- **Balanced**: No significant difference

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