# Goal System Integration Guide

## Architecture Overview

The goal tracking system integrates with existing stores through well-defined interfaces, maintaining separation of concerns while enabling narrative consistency tracking.

### Store Integration Pattern
```
narrativeStore (segments) → goalStore (extraction) → aiContextStore (context building)
```

## Integration Points

### Narrative Store Integration
Goals are extracted from narrative segments automatically when content is processed.

```typescript
// In narrativeStore or segment processing
import { useGoalStore } from '@/state/goalStore';

const processNewSegment = async (segment: NarrativeSegment) => {
  // Process segment content for goals
  const goalStore = useGoalStore.getState();
  const result = await goalStore.processSegmentForGoals(
    segment.id,
    segment.characterId
  );
  
  // Log extraction results
  if (result.newGoalsCreated > 0) {
    console.log(`Extracted ${result.newGoalsCreated} new goals from segment`);
  }
};
```

### AI Context Integration
Goals are automatically included in AI prompts through the context building system.

```typescript
// In narrative generation or AI calls
import { aiContextStore } from '@/state/aiContextStore';

const generateNarrativeWithGoalContext = async (sessionId: string) => {
  // Build context including goals
  const context = aiContextStore.buildContextForSession(sessionId, {
    includeGoals: true,
    maxTokens: 800,
    prioritizeRecent: true
  });
  
  // Use in AI prompt
  const prompt = `
${context.goalContext}

Based on these active goals, continue the story...
`;
  
  // Save context for tracking
  aiContextStore.saveContextToHistory(sessionId, context);
  
  return await generateContent(prompt);
};
```

### Session Management Integration
Goals are tied to sessions and cleaned up when sessions end.

```typescript
// In session management
import { useGoalStore } from '@/state/goalStore';
import { useSessionStore } from '@/state/sessionStore';

const endGameSession = (sessionId: string) => {
  const goalStore = useGoalStore.getState();
  
  // Mark all active goals as abandoned or completed
  const activeGoals = goalStore.getActiveGoalsBySession(sessionId);
  activeGoals.forEach(goal => {
    goalStore.updateGoal(goal.id, {
      status: 'abandoned',
      completionMethod: 'superseded'
    });
  });
  
  // Or completely remove session goals
  // goalStore.clearSessionGoals(sessionId);
};
```

## Data Flow Patterns

### Goal Extraction Flow
```
1. New narrative segment created
2. goalStore.processSegmentForGoals() called
3. goalExtractor.extractGoalsFromNarrative() processes content
4. New goals created, existing goals updated
5. AI context automatically includes updated goals
```

### Context Building Flow
```
1. AI generation requested for session
2. aiContextStore.buildContextForSession() called
3. Goals fetched from goalStore
4. Goals prioritized and formatted within token budget
5. Context returned for AI prompt
6. Context saved to history for tracking
```

### Goal Lifecycle Flow
```
1. Goal extracted from narrative → status: 'active'
2. Goal mentioned in subsequent segments → mentionCount++
3. Goal progress tracked → progressNotes added
4. Goal completed/abandoned → status updated, completedAt set
```

## Persistence Integration

### IndexedDB Storage
Goals persist automatically through Zustand middleware.

```typescript
// goalStore.ts persistence configuration
export const useGoalStore = create<GoalStore>()(
  persist(
    // ... store implementation
    {
      name: 'narraitor-goal-store',
      storage: createIndexedDBStorage(),
      version: 1,
      partialize: (state) => ({
        goals: state.goals,
        sessionGoals: state.sessionGoals,
        activeGoalIds: state.activeGoalIds,
      }),
    }
  )
);
```

### State Hydration
Goals load automatically when the application starts.

```typescript
// Application initialization
const initializeStores = async () => {
  // Goal store hydrates automatically via persist middleware
  const goalStore = useGoalStore.getState();
  
  // Verify goal data integrity after hydration
  const allGoals = Object.values(goalStore.goals);
  console.log(`Loaded ${allGoals.length} goals from storage`);
  
  // Clean up any corrupted data
  allGoals.forEach(goal => {
    if (!goal.title || !goal.sessionId) {
      goalStore.deleteGoal(goal.id);
    }
  });
};
```

## Error Handling Integration

### Graceful Degradation
The system continues to function even when goal operations fail.

```typescript
// In narrative generation
const generateWithFailsafes = async (sessionId: string) => {
  let goalContext = '';
  
  try {
    const context = aiContextStore.buildContextForSession(sessionId);
    goalContext = context.error ? '' : context.goalContext;
  } catch (error) {
    console.warn('Goal context building failed, continuing without goals:', error);
  }
  
  // Generate content with or without goal context
  return await generateNarrative({
    context: goalContext,
    sessionId
  });
};
```

### Error Propagation
Errors are captured and reported without breaking the user experience.

```typescript
// Goal extraction with error handling
const processSegmentSafely = async (segmentId: string) => {
  try {
    const result = await goalStore.processSegmentForGoals(segmentId);
    
    if (result.error) {
      // Log error but don't throw
      console.error('Goal processing error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected goal processing error:', error);
    return {
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      error: error.message
    };
  }
};
```

## Performance Considerations

### Lazy Loading
Goals are loaded on-demand to minimize memory usage.

```typescript
// Load goals only when needed
const getRelevantGoals = (sessionId: string) => {
  const goalStore = useGoalStore.getState();
  
  // Only fetch active goals for current session
  return goalStore.getActiveGoalsBySession(sessionId);
};
```

### Token Budget Management
Context building respects token limits to prevent API cost overruns.

```typescript
// Adaptive token budgeting
const getContextForAI = (sessionId: string, complexityLevel: 'simple' | 'complex') => {
  const maxTokens = complexityLevel === 'simple' ? 200 : 800;
  
  return aiContextStore.buildContextForSession(sessionId, {
    maxTokens,
    includeGoals: true,
    prioritizeRecent: complexityLevel === 'complex'
  });
};
```

### Batch Operations
Multiple goal operations can be batched for efficiency.

```typescript
// Batch goal updates
const updateMultipleGoals = (updates: Array<{id: string, updates: Partial<NarrativeGoal>}>) => {
  const goalStore = useGoalStore.getState();
  
  updates.forEach(({ id, updates }) => {
    try {
      goalStore.updateGoal(id, updates);
    } catch (error) {
      console.warn(`Failed to update goal ${id}:`, error);
    }
  });
};
```

## Testing Integration

### Mock Integration
Goals can be mocked for testing scenarios.

```typescript
// Test setup with mock goals
const setupTestGoals = (sessionId: string) => {
  const goalStore = useGoalStore.getState();
  
  const testGoals = [
    {
      sessionId,
      title: 'Test Goal 1',
      description: 'Test description',
      type: 'quest' as const,
      priority: 'high' as const,
      status: 'active' as const,
      mentionCount: 1
    }
  ];
  
  return testGoals.map(goal => goalStore.createGoal(goal));
};
```

### Integration Testing
Test the complete flow from narrative to goal extraction.

```typescript
// Integration test example
it('extracts goals from narrative segments', async () => {
  const sessionId = 'test-session';
  const segmentId = 'test-segment';
  
  // Create test segment
  const narrativeStore = useNarrativeStore.getState();
  narrativeStore.addSegment({
    sessionId,
    content: 'I must find the ancient sword to defeat the dragon.',
    type: 'narrative'
  });
  
  // Process for goals
  const goalStore = useGoalStore.getState();
  const result = await goalStore.processSegmentForGoals(segmentId);
  
  expect(result.newGoalsCreated).toBeGreaterThan(0);
  
  // Verify context building includes goals
  const context = aiContextStore.buildContextForSession(sessionId);
  expect(context.activeGoals.length).toBeGreaterThan(0);
});
```