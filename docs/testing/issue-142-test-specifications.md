# Issue #142 Test Specifications: PlayerDecisionTracker Integration

## Overview

This document outlines the comprehensive test suite created for Issue #142, which integrates PlayerDecisionTracker with `narrativeStore.selectDecisionOption()` to enable automatic decision tracking for narrative personalization.

## Test Architecture

### Test-Driven Development Approach

The tests have been created following strict TDD principles:
- **Red Phase**: Tests are designed to fail initially until the integration is implemented
- **Focus on Behavior**: Tests verify WHAT the system should do, not HOW it's implemented
- **User-Centric**: Tests validate acceptance criteria and real user scenarios
- **Non-Trivial**: Tests enforce quality and meaningful functionality, not just basic existence

### Anti-Trivial Testing Principles

These tests explicitly avoid common testing pitfalls:
- ❌ No tests that just check if functions exist
- ❌ No snapshot tests without business value
- ❌ No testing of implementation details (CSS classes, internal state)
- ❌ No trivial getter/setter tests
- ✅ Tests validate USER-FACING BEHAVIOR
- ✅ Tests enforce business logic and acceptance criteria
- ✅ Tests verify error handling and edge cases
- ✅ Tests ensure integration quality

## Test Files Created

### 1. Integration Tests
**File**: `/src/state/__tests__/narrativeStore.decisionTracking.integration.test.ts`

**Purpose**: Tests the core integration between narrativeStore and PlayerDecisionTracker

**Key Test Scenarios**:
- **Automatic Decision Tracking**: Verifies that when players select options via `narrativeStore.selectDecisionOption()`, decisions are automatically recorded in PlayerDecisionTracker
- **Choice Type Inference**: Tests that choice types are intelligently categorized (aggressive, diplomatic, helpful, etc.)
- **Context Extraction**: Validates that relevant narrative context is extracted from game segments
- **Error Handling**: Ensures tracking failures don't break core game functionality
- **Edge Cases**: Tests scenarios with missing character IDs, missing world context, etc.
- **Integration Quality**: Verifies consistency across multiple sessions and choice categorization

**Current Status**: 🔴 **FAILING (Expected)** - Tests fail until integration is implemented

### 2. Choice Type Inference Tests  
**File**: `/src/lib/ai/__tests__/choiceTypeInference.test.ts`

**Purpose**: Tests the logic that categorizes player choices into ChoiceTypePreference types

**Key Test Scenarios**:
- **Basic Recognition**: Tests identification of all choice types (aggressive, diplomatic, stealthy, helpful, selfish, lawful, chaotic, neutral)
- **Context Awareness**: Validates that prompt context influences categorization
- **Edge Cases**: Tests empty input, case insensitivity, special characters, long text
- **Integration Requirements**: Ensures only valid ChoiceTypePreference values are returned
- **Consistency**: Verifies deterministic results for identical inputs

**Current Status**: 🟡 **MOSTLY PASSING** - Basic implementation works, some edge cases need refinement

### 3. Context Extraction Tests
**File**: `/src/lib/utils/__tests__/narrativeContextExtractor.test.ts`

**Purpose**: Tests extraction of decision context from narrative segments

**Key Test Scenarios**:
- **Location Extraction**: Tests extracting location from segment metadata
- **Situation Analysis**: Tests identifying different types of narrative situations
- **Character Presence**: Tests extracting characters present in the scene
- **Robustness**: Tests handling of empty data, malformed input, consistency

**Current Status**: ✅ **PASSING** - Placeholder implementation provides solid foundation

### 4. End-to-End Integration Tests
**File**: `/src/state/__tests__/integration/narrativeStore.playerDecisionTracker.integration.test.ts`

**Purpose**: Tests complete user journey and system integration

**Key Test Scenarios**:
- **Complete User Journey**: Full game session with multiple decisions and pattern building
- **Multi-Character Scenarios**: Complex party-based decision making
- **Integration Robustness**: System resilience during tracking failures
- **Cross-Session Patterns**: Long-term personalization data accumulation
- **Performance**: Rapid successive decisions without data loss

**Current Status**: 🔴 **FAILING (Expected)** - Tests comprehensive integration not yet implemented

## Storybook Integration

### 5. Visual Integration Testing
**File**: `/src/stories/integration/DecisionTrackingIntegration.stories.tsx`

**Purpose**: Visual demonstration and manual testing of the integration

**Features**:
- **Interactive Demo**: Shows decision tracking in action
- **Multiple Scenarios**: Combat, social, exploration scenarios for testing different contexts
- **Pattern Visualization**: Real-time display of choice pattern accumulation
- **Integration Status**: Clear indication of tracking success/failure
- **Testing Modes**: Both simulated and real tracking for different testing needs

**Current Status**: 📝 **CREATED** - Ready for visual testing once integration is implemented

## Test Scenarios Coverage

### Core Integration Behaviors ✅
- [x] Automatic decision tracking when player selects options
- [x] Choice type inference from option text and context  
- [x] Context extraction from narrative segments
- [x] Graceful error handling without breaking game flow
- [x] Decision tracking without character IDs
- [x] Handling missing world context
- [x] Cross-session decision tracking
- [x] Consistent choice type categorization

### Choice Type Recognition ✅
- [x] Aggressive choices (attack, fight, strike, destroy)
- [x] Diplomatic choices (negotiate, talk, discuss, convince)
- [x] Stealthy choices (sneak, hide, quietly, avoid)
- [x] Helpful choices (help, assist, aid, support, heal)
- [x] Selfish choices (take for myself, ignore, abandon)
- [x] Lawful choices (report to authorities, follow law)
- [x] Chaotic choices (break rules, defy, rebel)
- [x] Neutral choices (ambiguous or balanced options)

### Context Extraction ✅
- [x] Location from segment metadata
- [x] Situation analysis (merchant interaction, combat, exploration, etc.)
- [x] Character presence detection
- [x] Recent segment prioritization
- [x] Malformed data handling

### Error Handling & Edge Cases ✅
- [x] Empty/invalid input handling
- [x] Missing context scenarios
- [x] Tracking system failures
- [x] Rapid successive decisions
- [x] Case insensitivity
- [x] Special characters and punctuation
- [x] Very long choice text

### User Experience Validation ✅
- [x] Pattern building over time
- [x] Personalization readiness
- [x] Multi-character decision scenarios
- [x] Visual feedback and status indication
- [x] System resilience and reliability

## Implementation Guidance

### Integration Points

The tests provide clear guidance for implementation:

1. **narrativeStore.selectDecisionOption() Enhancement**:
   ```typescript
   selectDecisionOption: (decisionId, optionId, characterId) => {
     // Existing logic...
     
     // NEW: Integration with PlayerDecisionTracker
     try {
       const decision = state.decisions[decisionId];
       const selectedOption = decision.options.find(opt => opt.id === optionId);
       const context = extractDecisionContext(sessionSegments, sessionId, characterId);
       const choiceType = inferChoiceType(selectedOption.text, decision.prompt, context);
       
       playerDecisionTracker.recordDecision(
         decision.prompt,
         selectedOption.text, 
         choiceType,
         sessionId,
         worldId,
         context
       );
     } catch (error) {
       // Fail gracefully - don't break core functionality
       logger.warn('Decision tracking failed:', error);
     }
     
     // Existing logic continues...
   }
   ```

2. **Choice Type Inference Implementation**:
   - Implement `inferChoiceType()` function with sophisticated text analysis
   - Include context awareness for ambiguous choices
   - Ensure deterministic and consistent results

3. **Context Extraction Implementation**:
   - Implement `extractDecisionContext()` function
   - Extract location, situation, and character presence from narrative segments
   - Focus on recent segments for relevance

## Success Criteria

The integration will be considered successful when:

1. ✅ All integration tests pass
2. ✅ Choice type inference achieves >90% accuracy on test scenarios
3. ✅ Context extraction provides meaningful data for personalization
4. ✅ Error handling maintains game stability
5. ✅ Visual demos work smoothly in Storybook
6. ✅ Performance remains acceptable under normal load

## Next Steps

1. **Implement Core Integration**: Modify `narrativeStore.selectDecisionOption()` to call PlayerDecisionTracker
2. **Create Choice Type Inference Logic**: Implement sophisticated text analysis for choice categorization
3. **Create Context Extraction Logic**: Implement narrative context extraction from segments
4. **Run Tests**: Execute test suite and iterate on implementation
5. **Visual Testing**: Use Storybook stories to validate user experience
6. **Performance Testing**: Ensure integration doesn't impact game performance

## Testing Commands

```bash
# Run all Issue #142 related tests
npm test -- --testPathPattern="decisionTracking|choiceTypeInference|narrativeContextExtractor"

# Run specific integration tests
npm test -- --testPathPattern="narrativeStore.decisionTracking.integration.test.ts"

# Run choice type inference tests
npm test -- --testPathPattern="choiceTypeInference.test.ts"

# Run context extraction tests  
npm test -- --testPathPattern="narrativeContextExtractor.test.ts"

# Run end-to-end integration tests
npm test -- --testPathPattern="narrativeStore.playerDecisionTracker.integration.test.ts"

# Launch Storybook for visual testing
npm run storybook
# Navigate to: Integration > Decision Tracking
```

---

**Document Status**: ✅ Complete
**Last Updated**: January 2025
**Tests Created**: 4 test files + 1 Storybook story
**Total Test Cases**: 50+ comprehensive test scenarios
**Current Phase**: 🔴 Red Phase (TDD) - Ready for implementation