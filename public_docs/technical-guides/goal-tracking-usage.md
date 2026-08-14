# Goal Tracking System Usage Guide

The goal tracking system keeps track of what your character is trying to accomplish, so the AI can weave those objectives into the story naturally. Here's how to use it effectively.

## Basic Usage

### Creating Goals
```typescript
import { useGoalStore } from '@/state/goalStore';

const goalStore = useGoalStore();

// Create a new goal
const goalId = goalStore.createGoal({
  sessionId: 'session-123',
  characterId: 'char-456',
  title: 'Find the Ancient Artifact',
  description: 'Locate the artifact hidden in the temple ruins',
  type: 'quest',
  priority: 'high',
  status: 'active',
  keywords: ['artifact', 'temple', 'ruins'],
  contextSummary: 'Player must find ancient artifact in temple'
});
```

### Querying Goals
```typescript
// Get active goals for current session
const activeGoals = goalStore.getActiveGoalsBySession(sessionId);

// Get high priority goals
const urgentGoals = goalStore.getGoalsByPriority('high');

// Get recently mentioned goals (last 30 minutes)
const recentGoals = goalStore.getRecentlyMentionedGoals(30 * 60 * 1000);
```

### Updating Goals
```typescript
// Update goal progress
goalStore.updateGoal(goalId, {
  status: 'completed',
  progressNotes: ['Found temple entrance', 'Solved puzzle lock']
});

// Increment mention count when goal is referenced
goalStore.incrementMentionCount(goalId);

// Add progress note
goalStore.addProgressNote(goalId, 'Discovered secret passage');
```

## AI Integration

### Automatic Goal Extraction
Goals are detected automatically when the AI reads narrative content:
```typescript
import { extractGoalsFromNarrative } from '@/lib/ai/goalExtractor';

// Extract goals from narrative content
const extractionResult = await extractGoalsFromNarrative({
  content: 'The wizard told me I must find the Crystal of Power before the moon sets.',
  sessionId: 'session-123',
  segmentId: 'segment-456',
  characterId: 'char-789',
  existingGoals: activeGoals
});

// Process extraction results
for (const newGoalData of extractionResult.newGoals) {
  goalStore.createGoal(newGoalData);
}

for (const update of extractionResult.updatedGoals) {
  goalStore.updateGoal(update.goalId, update.updates);
}
```

### Context Building for AI
When generating new narrative content, the AI needs to know what goals are active:
```typescript
import { useAiContextStore } from '@/state/aiContextStore';

// Build goal context for AI prompt. buildContextForSession is async.
const context = await useAiContextStore.getState().buildContextForSession(sessionId, {
  includeGoals: true,
  maxChars: 500,
  prioritizeRecent: true
});

console.log(context.goalContext);
// Output:
// ACTIVE GOALS:
// URGENT: Find the Crystal of Power before moonset
// Investigate the mysterious tower ruins
// Negotiate with the village elder
```

### Goal Completion Detection
```typescript
// Goal completion is handled by processSegmentForGoals() as part of segment processing.
await goalStore.processSegmentForGoals(segment, sessionId, characterId);
```

## Integration with Narrative Generation

### Processing Narrative Segments
```typescript
// Automatically process new narrative content for goals. Takes the segment
// object and a required sessionId, not a segment ID.
const result = await goalStore.processSegmentForGoals(segment, sessionId, characterId);

console.log(`Created ${result.newGoalsCreated} new goals`);
console.log(`Updated ${result.goalsUpdated} existing goals`);
console.log(`Completed ${result.goalsCompleted} goals`);
```

### Real-time Goal Tracking
```typescript
// Hook into narrative store updates
import { useNarrativeStore } from '@/state/narrativeStore';

const narrativeStore = useNarrativeStore();

// Listen for new segments and process goals
useEffect(() => {
  const unsubscribe = narrativeStore.subscribe((state) => {
    const latestSegment = state.segments[state.currentSegmentId];
    if (latestSegment) {
      goalStore.processSegmentForGoals(latestSegment, sessionId, characterId);
    }
  });

  return unsubscribe;
}, []);
```

## Goal Lifecycle Management

### Status Transitions
```typescript
// Valid status transitions
const statusTransitions = {
  active: ['completed', 'abandoned', 'blocked'],
  blocked: ['active', 'abandoned'],
  completed: [], // Terminal state
  abandoned: [] // Terminal state
};

// Update with automatic timestamp
goalStore.updateGoal(goalId, { status: 'completed' });
// Automatically sets completedAt timestamp
```

### Session Management
```typescript
// Clean up goals when ending session
goalStore.clearSessionGoals(sessionId);

// Or mark goals as abandoned
const activeGoals = goalStore.getActiveGoalsBySession(sessionId);
activeGoals.forEach(goal => {
  goalStore.updateGoal(goal.id, {
    status: 'abandoned',
    completionMethod: 'superseded'
  });
});
```

### Priority Management
```typescript
// Escalate goal priority based on urgency
goalStore.updateGoal(goalId, {
  priority: 'critical',
  contextSummary: 'URGENT: Time-sensitive quest: moon setting soon!'
});
```

## Performance Optimization

### Token Budget Management
AI tokens cost money, so manage them carefully:
```typescript
// Build context with strict token limits
const lightweightContext = await useAiContextStore.getState().buildContextForSession(sessionId, {
  maxChars: 200, // Conservative limit
  includeGoals: true
});

// Prioritize critical goals only
const criticalOnlyContext = await useAiContextStore.getState().buildContextForSession(sessionId, {
  maxChars: 100,
  prioritizeRecent: false // Focus on priority over recency
});
```

### Goal Filtering
```typescript
// Filter by multiple criteria
const relevantGoals = activeGoals.filter(goal =>
  goal.priority !== 'low' &&
  goal.mentionCount > 0 &&
  goal.keywords?.some(keyword => 
    narrativeContent.toLowerCase().includes(keyword.toLowerCase())
  )
);
```

## Error Handling

### Safe Goal Operations
```typescript
try {
  const goalId = goalStore.createGoal(goalData);
  return goalId;
} catch (error) {
  console.error('Goal creation failed:', error.message);
  // Continue without goal tracking
}
```

### Fallback Context
```typescript
// Always provide fallback context
const context = await useAiContextStore.getState().buildContextForSession(sessionId);
const safeGoalContext = context.error ? '' : context.goalContext;

// Use in AI prompt with fallback
const prompt = `
${safeGoalContext}

Continue the story...
`;
```

### Validation Helpers
```typescript
const isValidGoal = (goal: Partial<NarrativeGoal>): boolean => {
  return !!(
    goal.title?.trim() &&
    goal.description?.trim() &&
    goal.sessionId &&
    ['low', 'medium', 'high', 'critical'].includes(goal.priority)
  );
};
```
