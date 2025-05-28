# Technical Specification: Fallback Content System

## Issue #301: Provide pre-written content during AI service unavailability

### Overview
Implement a robust fallback content system that provides context-appropriate narrative content when the AI service is unavailable, ensuring uninterrupted gameplay while maintaining narrative coherence.

### Technical Design

#### Architecture
```
┌─────────────────────┐
│ NarrativeGenerator  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Try AI Service    │
└──────────┬──────────┘
           │
         Fails?
           │
           ▼
┌─────────────────────┐
│ FallbackContentMgr  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Content Selection  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Return Content    │
│  (marked as fallback)│
└─────────────────────┘
```

#### Core Components

1. **Fallback Content Repository**
   - Organized by scene type and world theme
   - Tagged for context matching
   - Supports narrative continuity

2. **Content Selection Algorithm**
   - Matches current narrative context
   - Considers world theme and genre
   - Avoids repetition
   - Maintains coherence with previous content

3. **Service Monitor**
   - Tracks AI service availability
   - Implements retry logic
   - Manages automatic recovery

4. **User Indicators**
   - Clear visual indication of fallback content
   - Seamless transitions
   - Status notifications

### Implementation Plan

#### Phase 1: Core Infrastructure (Day 1-2)
1. Create fallback content types and interfaces
2. Implement basic content repository
3. Add error handling to NarrativeGenerator
4. Create unit tests for fallback activation

#### Phase 2: Content System (Day 2-3)
1. Build content selection algorithm
2. Create initial fallback content library
3. Implement context matching logic
4. Add Storybook stories for fallback UI

#### Phase 3: Integration & Polish (Day 3-4)
1. Integrate with existing narrative system
2. Add service monitoring and retry logic
3. Implement user indicators
4. Create test harness for manual testing

#### Phase 4: Testing & Refinement (Day 4-5)
1. Comprehensive integration testing
2. Performance optimization
3. Content quality review
4. Documentation updates

### Technical Requirements

#### Data Structures
```typescript
interface FallbackContent {
  id: string;
  type: 'scene' | 'transition' | 'choice' | 'initial';
  themes: string[]; // Compatible world themes
  tags: string[]; // Context tags for matching
  content: string;
  choices?: FallbackChoice[];
  weight: number; // Selection probability
  requirements?: ContentRequirements;
}

interface FallbackChoice {
  text: string;
  outcome: string;
  tags: string[]; // Tags added to context
}

interface ContentRequirements {
  includeTags?: string[]; // Must have these tags
  excludeTags?: string[]; // Must not have these tags
  minSegments?: number; // Minimum segments in session
}

interface FallbackMetadata {
  isAIGenerated: boolean;
  fallbackReason?: 'service_unavailable' | 'timeout' | 'error';
  retryAttempts?: number;
}
```

#### Key Files to Create
- `src/lib/narrative/fallback/FallbackContentManager.ts`
- `src/lib/narrative/fallback/ContentSelector.ts`
- `src/lib/narrative/fallback/content/index.ts`
- `src/lib/ai/ServiceMonitor.ts`
- `src/components/Narrative/FallbackIndicator.tsx`

#### Key Files to Modify
- `src/lib/ai/narrativeGenerator.ts` - Add fallback integration
- `src/components/Narrative/NarrativeDisplay.tsx` - Show indicators
- `src/state/narrativeStore.ts` - Track fallback metadata

### Testing Strategy

1. **Unit Tests**
   - Fallback activation on service failure
   - Content selection algorithm
   - Context matching logic
   - Retry mechanism

2. **Integration Tests**
   - Full narrative flow with fallbacks
   - Seamless AI recovery
   - Performance under failure conditions

3. **Storybook Stories**
   - Fallback content display
   - Status indicators
   - Different content types

4. **Manual Testing**
   - Test harness at `/dev/fallback-narrative`
   - Simulate various failure scenarios
   - Verify content quality and coherence

### Success Criteria
- ✓ Fallback content activates within 2 seconds of AI failure
- ✓ Content maintains narrative coherence
- ✓ Clear user indication of fallback mode
- ✓ Automatic recovery when AI available
- ✓ No gameplay interruption
- ✓ Diverse content prevents repetition

### Performance Considerations
- Lazy load fallback content
- Cache frequently used content
- Minimize bundle size impact
- Fast content selection (<100ms)

### Future Enhancements
- Community-contributed content
- Dynamic content generation
- Advanced matching algorithms
- Analytics for content usage