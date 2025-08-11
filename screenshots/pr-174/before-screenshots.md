# Before Screenshots - Issue #174: Save Player Choices and Outcomes for Story Tracking

## Current State (Before Implementation)

### Journal System
- Journal entries support types: `character_event`, `world_event`, `relationship_change`, `achievement`, `discovery`, `combat`, `dialogue`
- **Missing**: `decision` type for player choices
- Current system creates journal entries for narrative events but not for player decisions

### Player Choice Handling
- `ActiveGameSession.tsx` has `handleChoiceSelected` method that:
  - Updates narrative store with selected decision option
  - Triggers narrative generation
  - **Missing**: Does not create journal entries for decisions made

### Current Journal Entry Flow
1. Player makes choice → `handleChoiceSelected` called
2. Narrative generated from choice → `handleNarrativeGenerated` called  
3. Journal entry created from narrative segment → `createJournalEntryFromSegment` called
4. **Gap**: No direct decision-to-journal entry creation

## What Needs to Change
1. Add `'decision'` to `JournalEntryType`
2. Modify `handleChoiceSelected` to create decision journal entries
3. Include decision context, choice made, and link to outcomes
4. Format decision entries for readability
5. Map decision weight to significance level

## Expected Impact
- Players will see their decisions recorded in the journal alongside other events
- Decision entries will include both what they chose and the context
- Journal will provide better story tracking and memory aid for players