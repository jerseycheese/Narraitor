# Testing Best Practices

## Overview

This document establishes core testing best practices for the Narraitor project, ensuring consistency, maintainability, and reliability across all test files.

## General Testing Principles

### 1. Test What Users See

Focus on testing behavior and outcomes rather than implementation details.

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
// ✅ Good: Reusable test data factories
const createMockWorld = (overrides = {}) => ({
  id: 'test-world',
  name: 'Test World',
  description: 'A test world',
  genre: 'fantasy',
  ...overrides,
});

// Usage
const world = createMockWorld({ name: 'Custom World' });
```

## Testing Categories

### 1. Component Tests (React Components)

**Standard Pattern:**
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

// Mock external dependencies
jest.mock('@/state/storeName');

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

**Focus on state changes and actions:**
```typescript
import { useStoreName } from '../storeName';
import { act, renderHook } from '@testing-library/react';

describe('storeName', () => {
  test('updates state correctly', () => {
    const { result } = renderHook(() => useStoreName());
    
    act(() => {
      result.current.updateAction('new value');
    });
    
    expect(result.current.data).toBe('new value');
  });
});
```

### 3. Utility Function Tests

**Test pure functions directly:**
```typescript
import { utilityFunction } from '../utilityFunction';

describe('utilityFunction', () => {
  test('returns expected result for valid input', () => {
    const result = utilityFunction(validInput);
    expect(result).toEqual(expectedOutput);
  });

  test('handles edge cases gracefully', () => {
    expect(utilityFunction(null)).toBe(defaultValue);
    expect(utilityFunction(undefined)).toBe(defaultValue);
  });
});
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

### Store with Selector Pattern (Zustand)

```typescript
const mockState = {
  data: {},
  loading: false,
  action: jest.fn(),
};

jest.mock('@/state/storeName', () => ({
  useStoreName: jest.fn((selector) => {
    return selector ? selector(mockState) : mockState;
  }),
}));
```

### Dynamic Store State

```typescript
import { useStoreName } from '@/state/storeName';

beforeEach(() => {
  (useStoreName as jest.Mock).mockImplementation((selector) => {
    const mockState = {
      data: testSpecificData,
      loading: false,
      error: null,
    };
    return selector ? selector(mockState) : mockState;
  });
});
```

## Test Organization

### File Structure
```
src/
  components/
    ComponentName/
      ComponentName.tsx
      ComponentName.test.tsx
      __tests__/
        ComponentName.integration.test.tsx
        ComponentName.stories.test.tsx
```

### Test Grouping
```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    // Rendering tests
  });
  
  describe('user interactions', () => {
    // Event handling tests
  });
  
  describe('error states', () => {
    // Error handling tests
  });
});
```

## Configuration

### Jest Setup

Key improvements in `jest.config.cjs`:
- Use `jsx: 'react-jsx'` for modern React JSX transform
- Proper module name mapping for imports
- Test environment configured for jsdom

### ESLint for Tests

Allow necessary patterns in test files:
```javascript
{
  files: ["**/*.test.{js,jsx,ts,tsx}", "**/__tests__/**/*.{js,jsx,ts,tsx}"],
  rules: {
    "@typescript-eslint/no-require-imports": "off", // Allow require() in test files
  },
}
```

## Common Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```typescript
// Don't test CSS classes or internal state
expect(element).toHaveClass('bg-blue-500');
expect(component.state.internalValue).toBe(something);
```

### ❌ Overly Complex Test Setup

```typescript
// Don't create massive test setup that's hard to understand
beforeEach(() => {
  // 50 lines of complex setup
});
```

### ❌ Testing Everything at Once

```typescript
// Don't test multiple features in one test
test('component works', () => {
  // Tests rendering, interactions, state changes, side effects, etc.
});
```

## Quick Reference

### Essential Testing Library Queries (in order of preference)
1. `getByRole()` - Most accessible
2. `getByLabelText()` - Form elements
3. `getByText()` - Text content
4. `getByDisplayValue()` - Form values
5. `getByTestId()` - Last resort

### Mock Cleanup
```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Always clear mocks between tests
});
```

### Async Testing
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument();
});
```