# Goal System Integration Guide

So the goal tracking system was built to solve the problem of AI narratives that wander aimlessly. Players would start with clear objectives, but the AI would gradually drift away from them because it had no memory of what the player was trying to achieve.

## Architecture Overview

The goal tracking system integrates with existing stores through well-defined interfaces, maintaining separation of concerns while enabling narrative consistency tracking. The idea is that each store handles what it's good at, but they work together to maintain story coherence.

### Store Integration Pattern
The flow runs from `narrativeStore` (segments) to `goalStore` (extraction) to `aiContextStore` (context building).

Basically, as new story segments are created, the goal store processes them to extract and update goals, then the AI context store includes those goals in future prompts.

## Integration Points

### Narrative Store Integration
Goals are extracted from narrative segments automatically when content is processed. This happens behind the scenes - when a new narrative segment gets created, the goal system reads it and looks for mentions of objectives, completed tasks, new quests, etc.

```typescript
// In narrativeStore or segment processing
import { useGoalStore } from '@/state/goalStore';

const processNewSegment = async (segment: NarrativeSegment) => {
  // Process segment content for goals
  const goalStore = useGoalStore.getState();
  const result = await goalStore.processSegmentForGoals(
    segment,
    segment.sessionId,
    segment.characterId
  );
  
  // Log extraction results
  if (result.newGoalsCreated > 0) {
    console.log(`Extracted ${result.newGoalsCreated} new goals from segment`);
  }
};
```

### AI Context Integration
Goals are automatically included in AI prompts through the context building system. The AI gets a summary of active goals along with the regular prompt, so it can generate content that's actually relevant to what the player is trying to achieve.

```typescript
// In narrative generation or AI calls
import { useAiContextStore } from '@/state/aiContextStore';

const generateNarrativeWithGoalContext = async (sessionId: string) => {
  // Build context including goals. buildContextForSession is async.
  const context = await useAiContextStore.getState().buildContextForSession(sessionId, {
    includeGoals: true,
    maxChars: 800,
    prioritizeRecent: true
  });

  // Use in AI prompt
  const prompt = `
${context.goalContext}

Based on these active goals, continue the story...
`;

  return await generateContent(prompt);
};
```

### Session Management Integration
Goals are tied to sessions and cleaned up when sessions end. When a game session ends, the system marks active goals as either completed or abandoned, depending on the context. This keeps the goal database from getting cluttered with stale objectives.

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
Here's what happens when new content is generated:

1. New narrative segment created
2. `goalStore.processSegmentForGoals()` called automatically
3. `goalExtractor.extractGoalsFromNarrative()` processes the content
4. New goals created, existing goals updated
5. AI context automatically includes updated goals for next generation

### Context Building Flow
When the AI needs to generate new content:

1. AI generation requested for session
2. `useAiContextStore.getState().buildContextForSession()` called (async)
3. Goals fetched from goalStore
4. Goals prioritized and formatted within token budget
5. Context returned for AI prompt
6. Context saved to history for tracking

### Goal Lifecycle Flow
A goal's journey through the system:

1. Goal extracted from narrative, set to status `active`
2. Goal mentioned in subsequent segments, so `mentionCount` increments
3. Goal progress tracked, so `progressNotes` get added
4. Goal completed or abandoned, so `status` updates and `completedAt` is set

## Persistence Integration

### IndexedDB Storage
Goals persist automatically through Zustand middleware. This means your goals survive browser refreshes and are available when you come back to the app later.

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
Goals load automatically when the application starts. The persistence middleware handles this seamlessly, but you can add integrity checks to clean up any corrupted data.

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

### Failing Without Breaking the Session
The system continues to function even when goal operations fail. The philosophy is that goal tracking enhances the experience but shouldn't break it if something goes wrong.

```typescript
// In narrative generation
const generateWithFailsafes = async (sessionId: string) => {
  let goalContext = '';
  
  try {
    const context = await useAiContextStore.getState().buildContextForSession(sessionId);
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
Errors are captured and reported without breaking the user experience. The goal is to log what went wrong for debugging purposes while keeping the story flowing for the user.

```typescript
// Goal extraction with error handling
const processSegmentSafely = async (segment: NarrativeSegment, sessionId: string) => {
  try {
    const result = await goalStore.processSegmentForGoals(segment, sessionId);
    
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
Goals are loaded on-demand to minimize memory usage. No point in loading all goals from all sessions if you're only working with the current one.

```typescript
// Load goals only when needed
const getRelevantGoals = (sessionId: string) => {
  const goalStore = useGoalStore.getState();
  
  // Only fetch active goals for current session
  return goalStore.getActiveGoalsBySession(sessionId);
};
```

### Token Budget Management
Context building respects token limits to prevent API cost overruns. The system is smart about prioritizing recent or important goals when it hits the token budget limit.

```typescript
// Adaptive token budgeting
const getContextForAI = (sessionId: string, complexityLevel: 'simple' | 'complex') => {
  const maxChars = complexityLevel === 'simple' ? 200 : 800;
  
  return useAiContextStore.getState().buildContextForSession(sessionId, {
    maxChars,
    includeGoals: true,
    prioritizeRecent: complexityLevel === 'complex'
  });
};
```

### Batch Operations
Multiple goal operations can be batched for efficiency. When you need to update several goals at once, it's better to batch them instead of triggering multiple re-renders.

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
  const segment = useNarrativeStore.getState().segments[segmentId];
  const result = await goalStore.processSegmentForGoals(segment, sessionId);

  expect(result.newGoalsCreated).toBeGreaterThan(0);
  
  // Verify context building includes goals
  const context = await useAiContextStore.getState().buildContextForSession(sessionId);
  expect(context.activeGoals.length).toBeGreaterThan(0);
});
```