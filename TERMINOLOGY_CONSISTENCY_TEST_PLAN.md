# Test Plan for Issue #534: Terminology Consistency

## Overview
This test plan verifies that "Learning Curve" terminology is standardized to "Difficulty" across all skill-related components, forms, and stories.

## Test Strategy

### TDD Approach (Red-Green-Refactor)
1. **Red Phase**: Tests currently FAIL because components display "Learning Curve" 
2. **Green Phase**: Tests will PASS after implementing terminology fixes
3. **Refactor Phase**: Verify no regression after terminology updates

## Test Files Created/Updated

### 1. SkillReviewStep Test Updates
**File**: `/src/components/WorldCreationWizard/steps/SkillReviewStep.test.tsx`

**Updated Test**: `displays Difficulty label (not Learning Curve)`
- **Purpose**: Verifies SkillReviewStep uses "Difficulty" instead of "Learning Curve"
- **Current Status**: ❌ FAILING (expects "Difficulty", finds "Learning Curve")
- **Verification**: Tests both positive assertion (finds "Difficulty") and negative assertion (doesn't find "Learning Curve")

### 2. Terminology Consistency Integration Tests  
**File**: `/src/components/WorldCreationWizard/__tests__/terminology-consistency.test.tsx`

**Test Scenarios**:
- `SkillReviewStep uses "Difficulty" terminology consistently`
- `terminology consistency maintained across all skill components`
- `skill difficulty labels are properly displayed in form`
- `multiple skills show consistent difficulty terminology`

**Current Status**: ❌ ALL FAILING (expects "Difficulty", finds "Learning Curve")

### 3. SkillDifficulty Stories Tests
**File**: `/src/components/ui/SkillDifficulty/__tests__/SkillDifficulty.stories.test.tsx`

**Test Scenarios**:
- `InContext story uses "Difficulty" terminology consistently`
- `story displays all required skill information with consistent terminology`

**Current Status**: ❌ FAILING (expects "Difficulty:", finds "Learning Curve:")

## Components Requiring Terminology Updates

Based on test failures, the following components need updates:

### 1. SkillReviewStep Component
**File**: `/src/components/WorldCreationWizard/steps/SkillReviewStep.tsx`
**Line**: 410 
**Change**: `<WizardFormGroup label="Learning Curve">` → `<WizardFormGroup label="Difficulty">`

### 2. SkillDifficulty Stories
**File**: `/src/components/ui/SkillDifficulty/SkillDifficulty.stories.tsx`
**Lines**: 73, 84, 95
**Change**: `Learning Curve:` → `Difficulty:` in InContext story examples

## Acceptance Criteria Verification

✅ **Test Coverage**: Tests verify all required acceptance criteria:
1. SkillReviewStep displays "Difficulty" label (not "Learning Curve")
2. Storybook stories use consistent "Difficulty" terminology  
3. Both wizard and editor use same terminology
4. No "Learning Curve" labels remain in UI

✅ **Test Approach**: Follows TDD principles:
- Tests WHAT not HOW (behavior over implementation)
- Focuses on acceptance criteria from spec
- Avoids testing style classes or implementation details
- Creates minimal, focused test files

✅ **MVP-Level Testing**: Tests align with issue requirements without testing trivial details

## Integration Test Scenarios

### Scenario 1: Wizard Flow Consistency
Tests verify that when a user goes through the skill creation wizard, all terminology is consistent throughout the flow.

### Scenario 2: Multi-Component Terminology
Tests verify that different skill-related components use the same terminology when displayed together.

### Scenario 3: Storybook Documentation Consistency  
Tests verify that Storybook stories, used for component documentation, demonstrate consistent terminology.

## Expected Outcomes After Fix

When the terminology is updated in the components:

1. **SkillReviewStep.test.tsx**: ✅ `displays Difficulty label (not Learning Curve)` will PASS
2. **terminology-consistency.test.tsx**: ✅ All 4 tests will PASS
3. **SkillDifficulty.stories.test.tsx**: ✅ Both tests will PASS

## Test Execution Commands

```bash
# Run specific component tests
npm test -- src/components/WorldCreationWizard/steps/SkillReviewStep.test.tsx

# Run terminology consistency tests  
npm test -- src/components/WorldCreationWizard/__tests__/terminology-consistency.test.tsx

# Run Storybook stories tests
npm test -- src/components/ui/SkillDifficulty/__tests__/SkillDifficulty.stories.test.tsx

# Run all related tests
npm test -- --testNamePattern="Learning Curve|Difficulty|terminology"
```

## Success Metrics

- ✅ All terminology-related tests pass
- ✅ No "Learning Curve" references in test output
- ✅ Consistent "Difficulty" terminology across all components
- ✅ Storybook examples demonstrate proper terminology
- ✅ No regression in existing functionality