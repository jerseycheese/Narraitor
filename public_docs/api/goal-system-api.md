# Goal System API Reference

The goal system is what makes our AI storytelling actually smart about tracking narrative threads. Instead of just generating random content, it remembers what your character is trying to accomplish and weaves those objectives into the story naturally.

Think of it like having a really good dungeon master who never forgets that you're looking for your missing sister, trying to earn enough gold for new armor, and investigating those weird disappearances in town. The system tracks all of that automatically.

## Core Components

### goalStore.ts
The main Zustand store that handles all goal management. This is where goals live, get updated, and connect to game sessions.

#### State Interface
```typescript
interface GoalStore {
  goals: Record<EntityID, NarrativeGoal>;
  sessionGoals: Record<EntityID, EntityID[]>; // Session -> Goal IDs
  activeGoalIds: EntityID[];
  error: UserFriendlyError | null;
  loading: boolean;
}
```

#### Core Actions
The basic CRUD operations, with validation and cleanup built in:

```typescript
// Create goal with validation
createGoal(goalData: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>): EntityID

// Update goal with status transitions
updateGoal(goalId: EntityID, updates: Partial<NarrativeGoal>): void

// Delete goal and clean up references
deleteGoal(goalId: EntityID): void
```

#### Query Actions
These are the methods you'll use most often to get goals for AI context building:

```typescript
// Get active goals for specific session
getActiveGoalsBySession(sessionId: EntityID): NarrativeGoal[]

// Filter goals by priority level
getGoalsByPriority(priority: GoalPriority): NarrativeGoal[]

// Get recently mentioned goals (within time window)
getRecentlyMentionedGoals(withinMs: number): NarrativeGoal[]
```

#### Goal Management
These help track goal relevance and progress over time:

```typescript
// Increment mention count and update timestamp
incrementMentionCount(goalId: EntityID): void

// Add progress note to goal
addProgressNote(goalId: EntityID, note: string): void

// Remove all goals for session
clearSessionGoals(sessionId: EntityID): void
```

#### AI Integration
Automatically detects goals from narrative content:

```typescript
// Process narrative segment for goal extraction. Takes the segment object, not its ID,
// and sessionId is required.
processSegmentForGoals(
  segment: NarrativeSegment,
  sessionId: EntityID,
  characterId?: EntityID
): Promise<ProcessSegmentResult>

interface ProcessSegmentResult {
  newGoalsCreated: number;
  goalsUpdated: number;
  goalsCompleted: number;
  error?: UserFriendlyError;
}
```

### goalExtractor.ts
The AI service that reads narrative content and figures out what goals the character might have. It's pretty good at detecting when someone mentions wanting to find something, kill someone, or solve a mystery.

#### Core Methods
```typescript
// Extract goals from narrative content
extractGoalsFromNarrative(request: GoalExtractionRequest): Promise<GoalExtractionResult>
```

#### Configuration
The extractor is built to be resilient because AI can be unpredictable:

- Supports fallback pattern matching when AI fails
- Validates and cleans AI responses
- Provides confidence scoring

### aiContextStore.ts Goal Integration
This is how goals get fed into the AI system. When generating new narrative content, the AI needs to know what the character is trying to accomplish so it can create relevant story beats.

#### Goal Context Building
```typescript
// Build complete context for session including goals
buildContextForSession(sessionId: EntityID, options?: ContextBuildOptions): Promise<AISessionContext>

interface ContextBuildOptions {
  includeGoals?: boolean; // Default: true
  maxChars?: number; // Default: 5000
  prioritizeRecent?: boolean; // Default: false
}

interface AISessionContext {
  sessionId: EntityID;
  goalContext: string; // Formatted goal text for AI
  contextText: string;
  activeGoals: NarrativeGoal[];
  criticalGoals: NarrativeGoal[];
  recentGoals: NarrativeGoal[];
  tokenCount: number;
  error: string | null;
  timestamp: string;
}
```

#### Context Management
`buildContextForSession` recomputes from current state on every call; nothing is snapshotted or
replayed. The store's other actions:

```typescript
reset(): void
setError(error: string | null): void
clearError(): void
setLoading(loading: boolean): void
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

The goal system is designed to keep working when things go wrong, because we're dealing with AI that can be unpredictable and user content that can be messy.

### Validation
- Goal creation requires title, description, and sessionId
- Status transitions tracked automatically
- Corrupted goals filtered from context building

### Fallback Mechanisms
When the AI fails to extract goals properly, we fall back to pattern matching. It's not as smart, but it's reliable:

- Pattern matching when AI extraction fails
- Falls back to a default when data is missing
- Silent failures for non-critical operations

### Error States
Errors are tracked at multiple levels so you can debug issues:

- Store-level error tracking with `error` state
- Detailed error messages in processing results
- Context building errors isolated per session
