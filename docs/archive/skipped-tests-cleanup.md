# Skipped Tests Cleanup Summary

## Current State
- **Total test files**: 112
- **Skipped tests**: 23 test suites, 148 individual tests
- **Passing tests**: 90 test suites, 541 individual tests

## Categories of Skipped Tests

### 1. WorldCreationWizard Integration Tests (Should Remove)
- `integration.test.tsx` - Marked as "TO BE DELETED", outdated
- Multiple step tests that are skipped entirely
- These were written before refactoring and never updated

### 2. Narrative Controller Tests (Keep, Fix Later)
- Skipped due to Zustand mocking issues
- Has TODO comments indicating they need fixing in separate PR
- Core functionality that should have tests

### 3. Page Component Tests (Keep, Fix Later)
- `characters/page.test.tsx` - Needs proper setup
- `pages-tests/dev/world-list-screen/page.test.tsx` - Dev harness test

### 4. Template Selector Integration (Should Remove)
- Duplicate integration tests that test the wrong component
- Located in wrong directory

## Recommended Actions

### For This PR (Cleanup):
1. ✅ Remove `WorldCreationWizard/__tests__/integration.test.tsx` (already done)
2. Remove other clearly deprecated test files
3. Keep skipped tests that have clear TODOs for future work

### For Future PRs:
1. Fix NarrativeController tests with proper Zustand mocking
2. Update WorldCreationWizard step tests to match current implementation
3. Add proper page-level integration tests

## Why Keep Some Skipped Tests?
- They serve as documentation of what needs testing
- They have partial implementations that can be fixed
- They're placeholders for important test coverage

## Files to Remove Now:
- Deprecated integration tests marked for deletion
- Tests for components that no longer exist
- Duplicate test files