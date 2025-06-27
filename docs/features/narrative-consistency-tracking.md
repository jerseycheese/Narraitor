# Narrative Consistency Tracking System

## Overview

The narrative consistency tracking system automatically extracts, tracks, and manages player goals throughout gameplay sessions. It ensures AI-generated content remains consistent with established objectives and story elements.

## Core Features

### Automatic Goal Extraction
- **AI-Powered Detection**: Uses Gemini AI to identify explicit and implicit goals from narrative content
- **Pattern Matching Fallback**: Provides reliable goal detection even when AI fails
- **Context-Aware Processing**: Considers existing goals when extracting new ones
- **Confidence Scoring**: Tracks extraction quality for reliability assessment

### Goal Lifecycle Management
- **Status Tracking**: Manages goals through active, completed, abandoned, and blocked states
- **Progress Monitoring**: Tracks mention counts, progress notes, and timeline data
- **Automatic Updates**: Updates goal status based on narrative developments
- **Session Isolation**: Keeps goals separated by game session

### AI Context Integration
- **Token Budget Management**: Respects API limits while maximizing context relevance
- **Priority-Based Inclusion**: Includes critical and high-priority goals first
- **Dynamic Formatting**: Optimizes goal text for AI consumption
- **History Tracking**: Maintains context evolution for debugging and analysis

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
const context = aiContextStore.buildContextForSession(sessionId);

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
const context = aiContextStore.buildContextForSession(sessionId, {
  maxTokens: 500,        // Limit total goal context
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
const context = aiContextStore.buildContextForSession(sessionId);
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
- **Graceful Degradation**: System continues without goals if needed
- **Fallback Mechanisms**: Pattern matching when AI fails
- **Validation**: Ensures data integrity throughout lifecycle

## Monitoring and Debugging

### Goal Analytics
Track goal system performance:
```typescript
// Check extraction results
const result = await goalStore.processSegmentForGoals(segmentId);
console.log(`Created: ${result.newGoalsCreated}, Updated: ${result.goalsUpdated}`);

// Monitor context usage
const context = aiContextStore.buildContextForSession(sessionId);
console.log(`Token usage: ${context.tokenCount}/${maxTokens}`);
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
// Analyze goal completion rates
const completedGoals = goalStore.getGoalsByStatus('completed');
const activeGoals = goalStore.getGoalsByStatus('active');
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
- Handle AI service failures gracefully
- Log errors for debugging without breaking UX

### Testing Strategy
- Test goal extraction with various narrative styles
- Verify context building stays within token limits
- Check goal lifecycle transitions
- Validate persistence across sessions