# Goal System API Reference

## Core Components

### goalStore.ts
Zustand store managing narrative goals with session tracking and persistence.

#### State Interface
```typescript
interface GoalStore {
  goals: Record<EntityID, NarrativeGoal>;
  sessionGoals: Record<EntityID, EntityID[]>; // Session -> Goal IDs
  activeGoalIds: EntityID[];
  error: string | null;
  loading: boolean;
}
```

#### Core Actions
```typescript
// Create goal with validation
createGoal(goalData: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>): EntityID

// Update goal with status transitions
updateGoal(goalId: EntityID, updates: Partial<NarrativeGoal>): void

// Delete goal and clean up references
deleteGoal(goalId: EntityID): void
```

#### Query Actions
```typescript
// Get active goals for specific session
getActiveGoalsBySession(sessionId: EntityID): NarrativeGoal[]

// Filter goals by priority level
getGoalsByPriority(priority: GoalPriority): NarrativeGoal[]

// Get recently mentioned goals (within time window)
getRecentlyMentionedGoals(withinMs: number): NarrativeGoal[]
```

#### Goal Management
```typescript
// Increment mention count and update timestamp
incrementMentionCount(goalId: EntityID): void

// Add progress note to goal
addProgressNote(goalId: EntityID, note: string): void

// Remove all goals for session
clearSessionGoals(sessionId: EntityID): void
```

#### AI Integration
```typescript
// Process narrative segment for goal extraction
processSegmentForGoals(segmentId: EntityID, characterId?: EntityID): Promise<ProcessSegmentResult>

interface ProcessSegmentResult {
  newGoalsCreated: number;
  goalsUpdated: number;
  goalsCompleted: number;
  error?: string;
}
```

### goalExtractor.ts
AI-powered goal extraction and analysis service.

#### Core Methods
```typescript
// Extract goals from narrative content
extractGoalsFromNarrative(request: GoalExtractionRequest): Promise<GoalExtractionResult>

// Detect if specific goal has been completed
detectGoalCompletion(goal: NarrativeGoal, narrativeContent: string): Promise<boolean>

// Build context for AI prompts with token management
buildGoalContext(goals: NarrativeGoal[], maxTokens: number): GoalContext
```

#### Configuration
- Supports fallback pattern matching when AI fails
- Validates and cleans AI responses
- Handles token budget constraints
- Provides confidence scoring

### aiContextStore.ts Goal Integration
AI context building with goal integration features.

#### Goal Context Building
```typescript
// Build complete context for session including goals
buildContextForSession(sessionId: EntityID, options?: ContextBuildOptions): AISessionContext

interface ContextBuildOptions {
  includeGoals?: boolean; // Default: true
  maxTokens?: number; // Default: 1000
  prioritizeRecent?: boolean; // Default: false
}

interface AISessionContext {
  goalContext: string; // Formatted goal text for AI
  activeGoals: NarrativeGoal[];
  criticalGoals: NarrativeGoal[];
  recentGoals: NarrativeGoal[];
  tokenCount: number;
  error: string | null;
}
```

#### Context Management
```typescript
// Save context snapshot to history
saveContextToHistory(sessionId: EntityID, context: AISessionContext): void

// Retrieve context history for session
getContextHistory(sessionId: EntityID): AISessionContext[]
```

## Type Definitions

### Core Types
```typescript
type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
type GoalStatus = 'active' | 'completed' | 'abandoned' | 'blocked';
type GoalType = 'immediate' | 'quest' | 'exploration' | 'social' | 'mystery' | 'survival';
```

### NarrativeGoal Interface
```typescript
interface NarrativeGoal extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  characterId?: EntityID;
  worldId?: EntityID;
  
  // Goal details
  title: string;
  description: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  
  // Context tracking
  originSegmentId?: EntityID;
  targetLocation?: string;
  involvedCharacters?: EntityID[];
  mentionCount: number;
  lastMentionedAt?: Date;
  progressNotes?: string[];
  
  // AI optimization
  contextSummary?: string;
  keywords?: string[];
}
```

### Extraction Types
```typescript
interface GoalExtractionRequest {
  content: string;
  sessionId: EntityID;
  segmentId: EntityID;
  characterId?: EntityID;
  worldId?: EntityID;
  existingGoals?: NarrativeGoal[];
}

interface GoalExtractionResult {
  newGoals: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>[];
  updatedGoals: Array<{
    goalId: EntityID;
    updates: Partial<NarrativeGoal>;
  }>;
  completedGoals: EntityID[];
  confidence: number; // 0-1 confidence score
}
```

## Error Handling

### Validation
- Goal creation requires title, description, and sessionId
- Status transitions tracked automatically
- Corrupted goals filtered from context building

### Fallback Mechanisms
- Pattern matching when AI extraction fails
- Graceful degradation for missing data
- Silent failures for non-critical operations

### Error States
- Store-level error tracking with `error` state
- Detailed error messages in processing results
- Context building errors isolated per session