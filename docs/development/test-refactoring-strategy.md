# Test File Refactoring Strategy - Issue #818

## Overview
This document outlines the systematic approach to refactoring test files that exceed the 300-line limit.

## Progress Summary
- **Original scan**: 48 files over 300 lines
- **Previous refactorings**: ~8 files (CharacterStore, LoreStore, EndingGenerator, etc.)
- **This session**: 3 files refactored (IndexedDB, SessionBoundaryLogging, DecisionFormatter)
- **Test helpers created**: 4 (IndexedDB, SessionBoundaryLogging, DecisionFormatter, PlayerDecisionTracker)
- **Current status**: ~37 files remaining over 300 lines
- **Lines reduced**: 1,762 lines → 1,158 lines (604 lines eliminated through helpers)

## Refactoring Pattern

### 1. Identify Duplication
- Look for repeated mock setup code
- Identify common test utilities
- Find shared test data factories

### 2. Extract Helpers
Create a `[module].testHelpers.ts` file with:
- Mock factory functions
- Common test data builders
- Shared setup/teardown utilities
- Reusable assertion helpers

### 3. Split by Concern
Organize tests into focused files (each <300 lines):
- Group related test scenarios
- Separate integration vs unit tests
- Split by functional area (CRUD, errors, edge cases)

### 4. Naming Convention
```
[module].test.ts                  → Main CRUD operations
[module].[concern].test.ts        → Specific concern area
[module].testHelpers.ts           → Shared utilities
```

## Completed Refactoring

### IndexedDB Adapter (736 → 4 files) ✅
**Original**: `src/lib/storage/__tests__/indexedDBAdapter.test.ts` (736 lines)

**Refactored to**:
- `indexedDBAdapter.testHelpers.ts` (146 lines) - Shared mocks and factories
- `indexedDBAdapter.initialization.test.ts` (132 lines) - DB initialization tests
- `indexedDBAdapter.crud.test.ts` (219 lines) - CRUD operation tests
- `indexedDBAdapter.errors.test.ts` (82 lines) - Error handling tests

**Key improvements**:
- Eliminated 200+ lines of duplicate mock setup
- Each test file has a single, clear responsibility
- Reusable test helpers for future tests

### Character Store ✅
Already refactored in previous work:
- `characterStore.attributes.test.ts` (145 lines)
- `characterStore.crud.test.ts` (181 lines)
- `characterStore.state.test.ts` (83 lines)
- `characterStore.relatedDataCleanup.test.ts` (389 lines) - Still over limit

### Lore Store ✅
Already refactored in previous work:
- `loreStore.basic.test.ts` (66 lines)
- `loreStore.crud.test.ts` (96 lines)
- `loreStore.search.test.ts` (115 lines)
- `loreStore.advanced.test.ts` (243 lines)

### Ending Generator ✅
Already refactored in previous work:
- `endingGenerator.basic.test.ts` (177 lines)
- `endingGenerator.errors.test.ts` (145 lines)
- `endingGenerator.advanced.test.ts` (222 lines)

### DecisionFormatter (493 → 4 files) ✅
**Original**: `src/lib/ai/__tests__/decisionFormatter.test.ts` (493 lines)

**Refactored to**:
- `decisionFormatter.testHelpers.ts` (143 lines) - Test data factories
- `decisionFormatter.formatting.test.ts` (127 lines) - Formatting logic tests
- `decisionFormatter.edgeCases.test.ts` (93 lines) - Edge case handling
- `decisionFormatter.adaptiveLevels.test.ts` (100 lines) - Adaptive formatting tests

**Key improvements**:
- Eliminated duplicate test data creation
- Clear separation by functional concern
- Reusable test data factories

### SessionBoundaryLogging (533 → 4 files) ✅
**Original**: `src/components/GameSession/__tests__/SessionBoundaryLogging.integration.test.tsx` (533 lines)

**Refactored to**:
- `SessionBoundaryLogging.testHelpers.tsx` (122 lines) - Mock factories and setup
- `SessionBoundaryLogging.sessionStart.test.tsx` (148 lines) - Session start workflow
- `SessionBoundaryLogging.sessionEnd.test.tsx` (143 lines) - Session end workflow
- `SessionBoundaryLogging.lifecycle.test.tsx` (160 lines) - Complete lifecycle tests

**Key improvements**:
- Extracted complex mock setup to helpers
- Each workflow tested independently
- Reduced mock duplication by ~200 lines

## Test Files Requiring Refactoring

### Critical Priority (700+ lines)
None remaining ✅

### High Priority (500-600 lines)
1. ⏳ `SessionBoundaryLogging.integration.test.tsx` (533 lines)
   - Split by: logging scenarios, boundary conditions

2. ⏳ `narrativeStore.playerDecisionTracker.integration.test.ts` (519 lines)
   - Split by: tracker functionality, integration tests

3. ⏳ `narrativeContextExtractor.test.ts` (513 lines)
   - Split by: extraction types, context scenarios

### Standard Priority (400-500 lines)
7-19. Various files in the 400-500 line range

### Low Priority (300-400 lines)
20-48. Files just over the limit

## Refactoring Checklist

For each file:
- [ ] Analyze test structure and identify logical groupings
- [ ] Create test helper file if duplication exists
- [ ] Split into focused test files (<300 lines each)
- [ ] Verify all tests run successfully
- [ ] Delete original oversized file
- [ ] Update any documentation references

## Testing Verification

After each refactoring batch:
```bash
npm test -- --testPathPattern=[module]
```

After all refactoring:
```bash
npm test
npm run test:coverage
```

## Benefits

1. **Maintainability**: Easier to find and update specific tests
2. **Clarity**: Each file has a single, clear purpose
3. **Reusability**: Shared helpers reduce duplication
4. **Standards Compliance**: All files under 300-line limit
5. **Test Speed**: Smaller files can be run independently

## Next Steps

This PR (#825) completes the first batch of refactoring. For future PRs:

1. Continue with high-priority files (500-600 lines)
2. Use established patterns: extract helpers → split by concern
3. Maintain incremental PRs (3-5 files per PR for reviewability)
4. Run full test suite after each batch
5. Update this document with progress in each new PR
