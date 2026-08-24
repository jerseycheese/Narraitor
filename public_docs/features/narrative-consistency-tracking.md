# Narrative Consistency Tracking System

Here's what happens without this system: you're in the middle of a tense investigation, trying to find the murderer before they strike again, and suddenly the AI is asking if you want to go shopping for hats. The story has completely lost track of what was actually important.

This system solves that by automatically detecting and tracking goals throughout your narrative. It figures out what the player is supposed to be doing and makes sure the AI keeps those objectives front and center when generating new content.

## How It Works

**The AI Reads Between the Lines** - It's pretty smart about picking up both obvious goals ("Find the Sword of Light") and implied ones. When the wizard says "The dragon will attack at dawn," the system figures out that means "Stop the dragon attack" even though nobody explicitly said that. If the AI extraction fails for some reason, it falls back to pattern matching so you don't lose functionality.

**Goals Have Lives** - Every goal gets tracked from birth to death. Whether it gets completed, abandoned, or blocked by circumstances, the system keeps notes on progress, tracks how often it gets mentioned, and maintains a timeline. This helps the AI understand what's currently hot and what's gone cold.

**Context Budgeting** - When the AI is generating new content, this system feeds it a prioritized list of active goals within the token budget. Critical and high-priority goals are included first, so the ones driving the story don't get dropped when the budget runs short.

**No Story Mixing** - Goals stay locked to their game sessions, so your cyberpunk investigation doesn't accidentally bleed into your fantasy quest. Each storyline stays clean and focused.

## Goal Types and Priorities

### Goal Types
- **Immediate**: Right-now actions requiring immediate attention
- **Quest**: Specific objectives with clear completion criteria
- **Exploration**: Discovery-based goals for world exploration
- **Social**: Relationship and interaction objectives
- **Mystery**: Investigation and puzzle-solving goals
- **Survival**: Life-threatening situations requiring urgent action

### Priority Levels
- **Critical**: Urgent, life-threatening, or time-sensitive objectives
- **High**: Important story objectives and character goals
- **Medium**: Standard gameplay objectives and side quests
- **Low**: Optional objectives and minor tasks

## Usage Examples

### Basic Goal Tracking
```typescript
// Goals are automatically created from narrative content
const narrative = "The wizard warned me that the dragon will attack at dawn. I must find the Sword of Light before then.";

// System extracts:
// - Title: "Find the Sword of Light"
// - Type: "quest"
// - Priority: "critical" (time-sensitive)
// - Keywords: ["sword", "light", "dragon", "dawn"]
```

### AI Context Building
```typescript
// Goals are automatically included in AI prompts
const context = await useAiContextStore.getState().buildContextForSession(sessionId);

// Output format:
// ACTIVE GOALS:
// URGENT: Find the Sword of Light before dawn
// Investigate the mysterious tower ruins  
// Negotiate with the village elder
```

### Progress Tracking
```typescript
// System tracks goal mentions and progress
goalStore.addProgressNote(goalId, "Found the blacksmith who knows about the sword");
goalStore.incrementMentionCount(goalId); // Automatically tracked

// Goals are marked complete when achieved
goalStore.updateGoal(goalId, {
  status: 'completed',
  completionMethod: 'achieved'
});
```

## Configuration Options

### Token Budget Management
Control how much context space goals consume:
```typescript
const context = await useAiContextStore.getState().buildContextForSession(sessionId, {
  maxChars: 500,         // Cap the goal context by character count
  includeGoals: true,    // Enable/disable goal inclusion
  prioritizeRecent: true // Focus on recently mentioned goals
});
```

### Extraction Sensitivity
Configure goal extraction behavior:
```typescript
const config = {
  maxActiveGoals: 10,           // Limit active goals per session
  maxContextTokens: 1000,       // Token budget for context
  minConfidenceThreshold: 0.7,  // Minimum AI confidence
  priorityWeights: {            // Scoring weights
    critical: 100,
    high: 75,
    medium: 50,
    low: 25
  }
};
```

## Integration Points

### Narrative Generation
Goals are automatically included in AI prompts to maintain story consistency:
```typescript
// Before generating new content
const context = await useAiContextStore.getState().buildContextForSession(sessionId);
const prompt = `
${context.goalContext}

Continue the story, keeping these goals in mind...
`;
```

### Session Management
Goals are tied to game sessions and managed appropriately:
```typescript
// When ending a session
goalStore.clearSessionGoals(sessionId);

// Or mark goals as abandoned
const activeGoals = goalStore.getActiveGoalsBySession(sessionId);
activeGoals.forEach(goal => {
  goalStore.updateGoal(goal.id, { status: 'abandoned' });
});
```

### State Persistence
Goals persist across browser sessions using IndexedDB:
```typescript
// Goals automatically save and restore
// No manual persistence management required
```

## Performance Characteristics

### Memory Usage
- **Lazy Loading**: Goals loaded only when needed
- **Session Isolation**: Only active session goals kept in memory
- **Automatic Cleanup**: Completed/abandoned goals archived

### API Efficiency
- **Token Management**: Respects API limits and cost constraints
- **Batch Processing**: Groups operations for efficiency
- **Caching**: Reuses context when appropriate

### Error Handling
- **Fallback**: System continues without goals if needed
- **Fallback Mechanisms**: Pattern matching when AI fails
- **Validation**: Ensures data integrity throughout lifecycle

## Monitoring and Debugging

### Goal Analytics
Track goal system performance:
```typescript
// Check extraction results
const result = await goalStore.processSegmentForGoals(segment, sessionId);
console.log(`Created: ${result.newGoalsCreated}, Updated: ${result.goalsUpdated}`);

// Monitor context usage
const context = await useAiContextStore.getState().buildContextForSession(sessionId);
console.log(`Estimated tokens: ${context.tokenCount}`);
```

### Error Tracking
Monitor system health:
```typescript
// Check for extraction errors
if (result.error) {
  console.error('Goal extraction failed:', result.error);
}

// Check context building errors
if (context.error) {
  console.error('Context building failed:', context.error);
}
```

### Goal Lifecycle Analysis
Track goal completion patterns:
```typescript
// Analyze goal completion rates. There's no getGoalsByStatus - filter getAll() instead,
// or use getActiveGoalsBySession when you only care about one session.
const allGoals = goalStore.getAll();
const completedGoals = allGoals.filter((goal) => goal.status === 'completed');
const activeGoals = allGoals.filter((goal) => goal.status === 'active');
const completionRate = completedGoals.length / (completedGoals.length + activeGoals.length);
```

## Best Practices

### Goal Quality
- Write clear, specific goal titles
- Include relevant keywords for matching
- Provide context summaries for AI consumption
- Set appropriate priority levels

### Performance Optimization
- Use token budgets to control API costs
- Prioritize critical goals over low-priority ones
- Clean up completed goals periodically
- Monitor extraction confidence scores

### Error Resilience
- Always provide fallback behavior
- Validate goal data before processing
- Handle AI service failures instead of letting them crash the session
- Log errors for debugging without breaking UX

### Testing Strategy
- Test goal extraction with various narrative styles
- Verify context building stays within token limits
- Check goal lifecycle transitions
- Validate persistence across sessions