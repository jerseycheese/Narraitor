# Test File Refactoring Strategy - Issue #818

## Overview
This document outlines the systematic approach to refactoring 48 test files that exceed the 300-line limit.

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

### IndexedDB Adapter (736 → 3 files)
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

## Test Files Requiring Refactoring

### Critical Priority (700+ lines)
None remaining ✓

### High Priority (600-700 lines)
1. `narrativeGenerator.decision-consequences.test.ts` (613 lines)
   - Split into: integration, mapping, errors
   - Extract: mock decision factory

### Medium Priority (500-600 lines)
1. `characterStore.test.ts` (541 lines)
   - Split into: CRUD, relationships, validation

2. `SessionBoundaryLogging.integration.test.tsx` (533 lines)
   - Split by: logging scenarios, boundary conditions

3. `narrativeStore.playerDecisionTracker.integration.test.ts` (519 lines)
   - Split by: tracker functionality, integration tests

4. `loreStore.test.ts` (518 lines)
   - Split into: CRUD, categorization, filtering

5. `narrativeContextExtractor.test.ts` (513 lines)
   - Split by: extraction types, context scenarios

6. `endingGenerator.test.ts` (500 lines)
   - Split by: ending types, generation scenarios

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

1. Complete narrativeGenerator.decision-consequences refactoring
2. Move through priority tiers systematically
3. Run full test suite after each batch
4. Document any patterns that emerge
5. Create PR when complete
