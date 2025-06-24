# Testing Patterns Standard

## Overview

This document establishes standardized testing patterns for the Narraitor project, ensuring consistency, maintainability, and best practices across all test files.

## Mock Abstraction System

### Core Principle

Use the mock abstraction system for all React component tests that utilize custom hooks. This provides:
- Consistent mock behavior
- Reduced code duplication
- Easier maintenance
- Better error handling

### Standard Import Pattern

```typescript
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

## Testing Categories

### 1. Component Tests (React Components)

**Use Mock Abstraction**: ✅ YES

**Pattern:**
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

// Mock hooks using abstraction system
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static()
  });
});

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. Store Tests (Zustand Stores)

**Use Mock Abstraction**: ❌ NO

**Pattern:**
```typescript
import { useStoreName } from '../storeName';

describe('useStoreName', () => {
  beforeEach(() => {
    useStoreName.getState().reset();
  });

  test('initializes with default state', () => {
    const state = useStoreName.getState();
    expect(state.property).toBe(expectedValue);
  });

  test('updates state correctly', () => {
    const { action } = useStoreName.getState();
    action(parameter);
    
    const newState = useStoreName.getState();
    expect(newState.property).toBe(expectedNewValue);
  });
});
```

### 3. Utility Function Tests

**Use Mock Abstraction**: ❌ NO

**Pattern:**
```typescript
import { utilityFunction } from '../utilityFunction';

describe('utilityFunction', () => {
  test('handles normal input correctly', () => {
    const result = utilityFunction(input);
    expect(result).toBe(expectedOutput);
  });

  test('handles edge cases', () => {
    expect(utilityFunction(null)).toBe(expectedForNull);
    expect(utilityFunction('')).toBe(expectedForEmpty);
  });
});
```

### 4. Service/API Tests

**Use Mock Abstraction**: ❌ NO

**Pattern:**
```typescript
import { serviceFunction } from '../serviceFunction';

// Mock external dependencies
jest.mock('../externalDependency');

describe('serviceFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls external service correctly', async () => {
    const mockResponse = { data: 'test' };
    (externalDependency as jest.Mock).mockResolvedValue(mockResponse);

    const result = await serviceFunction(input);
    
    expect(externalDependency).toHaveBeenCalledWith(expectedParams);
    expect(result).toEqual(expectedResult);
  });
});
```

## Mock Preset Selection Guide

### FormState Presets

```typescript
// For components that don't change form data
formState: mockHookPresets.formState.static()

// For components that need working form state (toggles, inputs)
formState: mockHookPresets.formState.stateful()

// For components with custom initial data
formState: mockHookPresets.formState.stateful({ name: 'Initial Name' })

// For components that validate inputs
formState: mockHookPresets.formState.withValidation()
```

### AsyncState Presets

```typescript
// For components that don't use async operations
asyncState: mockHookPresets.asyncState.idle()

// For testing loading states
asyncState: mockHookPresets.asyncState.loading()

// For testing success states with data
asyncState: mockHookPresets.asyncState.success({ data: mockData })

// For testing error states
asyncState: mockHookPresets.asyncState.error('Error message')

// For components that call execute()
asyncState: mockHookPresets.asyncState.withExecution()
```

### Modal Presets

```typescript
// For components where modal is closed by default
modal: mockHookPresets.modal.closed()

// For components where modal is open by default
modal: mockHookPresets.modal.open()

// For components that need custom modal props
modal: mockHookPresets.modal.withProps()
```

### ErrorState Presets

```typescript
// For components with no errors
errorState: mockHookPresets.errorState.clean()

// For components with error states
errorState: mockHookPresets.errorState.withError('Error message')
```

## Store Mocking Patterns

### Simple Store Mock

```typescript
jest.mock('@/state/storeName', () => ({
  useStoreName: jest.fn(() => ({
    data: {},
    loading: false,
    error: null,
    action: jest.fn(),
  })),
}));
```

### Store with getState/setState

```typescript
const mockAction = jest.fn();

jest.mock('@/state/storeName', () => ({
  useStoreName: Object.assign(jest.fn(), {
    getState: () => ({
      action: mockAction,
    }),
  }),
}));
```

### Dynamic Store State

```typescript
import { useStoreName } from '@/state/storeName';

beforeEach(() => {
  (useStoreName as jest.Mock).mockReturnValue({
    data: testSpecificData,
    loading: false,
    error: null,
  });
});
```

## Test Organization

### File Structure

```
ComponentName/
  ├── ComponentName.tsx
  ├── ComponentName.stories.tsx
  └── __tests__/
      ├── ComponentName.test.tsx
      ├── ComponentName.integration.test.tsx (if needed)
      └── ComponentName.accessibility.test.tsx (if needed)
```

### Test Grouping

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    test('renders basic elements', () => {});
    test('renders with different props', () => {});
  });

  describe('User Interactions', () => {
    test('handles button clicks', () => {});
    test('handles form submissions', () => {});
  });

  describe('Error States', () => {
    test('displays error messages', () => {});
    test('recovers from errors', () => {});
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {});
    test('supports keyboard navigation', () => {});
  });
});
```

## Common Patterns

### Testing Async Operations

```typescript
test('handles async operation', async () => {
  render(<Component />);
  
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Testing Form Interactions

```typescript
test('updates form field', () => {
  render(<FormComponent />);
  
  const input = screen.getByLabelText('Field Name');
  fireEvent.change(input, { target: { value: 'New Value' } });
  
  expect(input).toHaveValue('New Value');
});
```

### Testing Modal Interactions

```typescript
test('opens and closes modal', () => {
  render(<ComponentWithModal />);
  
  fireEvent.click(screen.getByText('Open Modal'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('Close'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good: Tests what the user sees
expect(screen.getByText('World created successfully')).toBeInTheDocument();

// ❌ Bad: Tests implementation details
expect(mockCreateWorld).toHaveBeenCalledWith(expectedArgs);
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good: Clear intention
test('displays error message when world creation fails')

// ❌ Bad: Vague intention
test('handles error')
```

### 3. Keep Tests Focused

```typescript
// ✅ Good: Tests one thing
test('renders world name', () => {
  render(<WorldCard world={mockWorld} />);
  expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
});

// ❌ Bad: Tests multiple things
test('renders world card correctly', () => {
  // Tests name, description, actions, styling, etc.
});
```

### 4. Clean Up After Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any global state
});

afterEach(() => {
  // Clean up any side effects
});
```

### 5. Use Factory Functions for Test Data

```typescript
const createMockWorld = (overrides = {}) => ({
  id: 'world-1',
  name: 'Test World',
  description: 'A test world',
  ...overrides
});
```

## Anti-Patterns to Avoid

### ❌ Manual Hook Mocking

```typescript
// Don't do this anymore
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: {},
    updateField: jest.fn(),
    // ... 20 more lines
  }))
}));
```

### ❌ Testing Implementation Details

```typescript
// Don't test CSS classes or internal state
expect(element).toHaveClass('bg-blue-500');
expect(component.state.internalFlag).toBe(true);
```

### ❌ Overly Complex Test Setup

```typescript
// Don't create 50+ lines of setup for one test
// Use factory functions and abstractions instead
```

### ❌ Testing Third-Party Library Behavior

```typescript
// Don't test that React or Zustand work correctly
// Test that your code works correctly
```

---

This standard should be followed for all new tests and used as a guide when refactoring existing tests.