# Mock Abstraction Migration Guide

## Overview

This guide covers the migration from manual hook mocking to the standardized mock abstraction system introduced in the Narraitor project. The mock abstraction system provides reusable, consistent mock patterns for custom React hooks.

## When to Use Mock Abstraction

### ✅ **USE MOCK ABSTRACTION FOR:**
- React component tests that use custom hooks (`useFormState`, `useAsyncState`, `useModal`, `useErrorState`)
- Integration tests involving multiple custom hooks
- Component tests with repetitive mock setup patterns
- Tests requiring consistent hook behavior across components

### ❌ **DO NOT USE MOCK ABSTRACTION FOR:**
- Pure utility function tests
- Zustand store tests (direct store testing)
- Service layer tests (AI modules, APIs)
- Tests requiring complex custom React state behavior
- Simple component tests without custom hooks

## Migration Steps

### 1. Identify Migration Candidates

Look for these patterns in test files:

```typescript
// OLD: Manual hook mocking
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: mockFormData,
    updateField: mockUpdateField,
    // ... 15+ lines of manual setup
  })),
  useAsyncState: jest.fn(() => ({
    // ... more manual setup
  }))
}));
```

### 2. Replace with Mock Abstraction

```typescript
// NEW: Mock abstraction system
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.idle(),
    modal: mockHookPresets.modal.closed(),
    errorState: mockHookPresets.errorState.clean()
  });
});
```

### 3. Choose Appropriate Presets

#### **FormState Presets:**
- `static()` - Static form data, no state changes
- `stateful(initialData?)` - Real React state behavior
- `withValidation()` - Includes validation support

#### **AsyncState Presets:**
- `idle()` - Not loading, no data
- `loading()` - Currently loading state
- `success(data?)` - Success with optional data
- `error(errorMessage?)` - Error state
- `withExecution()` - Supports execute function calls

#### **Modal Presets:**
- `closed()` - Modal closed by default
- `open()` - Modal open by default  
- `withProps()` - Supports custom modal props

#### **ErrorState Presets:**
- `clean()` - No errors
- `withError(message?)` - Has error state

## Migration Examples

### Example 1: Simple Component Test

**Before:**
```typescript
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: { name: '', description: '' },
    updateField: jest.fn(),
    updateData: jest.fn(),
    errors: [],
    hasErrors: false,
    // ... 10 more properties
  }))
}));
```

**After:**
```typescript
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static()
  });
});
```

### Example 2: Complex Component with Multiple Hooks

**Before (50+ lines):**
```typescript
// Complex manual setup with multiple hooks...
let mockFormData = { /* complex state */ };
let mockModalOpen = false;
// ... many more variables and functions
```

**After (6 lines):**
```typescript
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful(),
    asyncState: mockHookPresets.asyncState.withExecution(),
    modal: mockHookPresets.modal.withProps(),
    errorState: mockHookPresets.errorState.clean()
  });
});
```

### Example 3: Component Requiring State Changes

For components that need actual React state behavior (like toggles):

```typescript
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful({ isExpanded: true })
  });
});
```

## Special Cases

### Store Integration

When components use both custom hooks and Zustand stores:

```typescript
// Mock stores separately
jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(() => ({
    worlds: {},
    currentWorldId: null,
    deleteWorld: jest.fn(),
  })),
}));

// Mock hooks with abstraction
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    modal: mockHookPresets.modal.closed()
  });
});
```

### Store Methods (getState, setState)

For components calling `useStore.getState()`:

```typescript
const mockSetCurrentWorld = jest.fn();

jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(jest.fn(), {
    getState: () => ({
      setCurrentWorld: mockSetCurrentWorld,
    }),
  }),
}));
```

## Benefits

### Code Reduction
- **Before**: 30-50 lines of repetitive mock setup
- **After**: 3-8 lines using presets
- **Saved**: 200+ lines across migrated files

### Consistency
- Standardized mock behavior across all component tests
- Reduced variability in test setup
- Easier to understand and maintain

### Error Reduction
- Eliminated common mocking mistakes
- Consistent hook signatures
- Proper mock state management

## Migration Checklist

- [ ] Identify manual hook mocking patterns
- [ ] Choose appropriate mock presets for each hook
- [ ] Replace manual mocks with `createHookMockModule`
- [ ] Run tests to verify behavior
- [ ] Clean up old mock variables and functions
- [ ] Update test cases if needed for new mock behavior

## Troubleshooting

### Tests Failing After Migration

1. **Check preset choice**: Ensure you're using the right preset for your component's needs
2. **Verify hook usage**: Make sure the component actually uses the mocked hooks
3. **Consider custom logic**: Some components may need specific mock behavior not covered by presets

### Complex Interactive Components

Some components with complex state interactions may not work well with the abstraction system. In these cases:

1. Keep the manual mocking approach
2. Document why abstraction wasn't suitable
3. Consider creating custom presets for common patterns

## Files Successfully Migrated

- `src/components/QuickPlay/__tests__/QuickPlay.test.tsx`
- `src/components/GameSession/GameSession.test.tsx`
- `src/components/WorldCreationWizard/steps/AttributeReviewStep.test.tsx`
- `src/components/WorldCreationWizard/steps/SkillReviewStep.test.tsx`
- `src/components/world/AttributeEditor/__tests__/AttributeEditor.test.tsx`
- `src/components/QuickStartCharacters/__tests__/QuickStartCharacters.test.tsx`

## Best Practices

1. **Start with static presets** for simple components
2. **Use stateful presets** only when components need real state changes
3. **Combine multiple presets** for components using multiple hooks
4. **Test migration thoroughly** to ensure behavior is preserved
5. **Document special cases** where manual mocking is still needed

---

For questions or issues with migration, refer to the mock abstraction system documentation in `/src/lib/test-utils/mockHooks.ts`.