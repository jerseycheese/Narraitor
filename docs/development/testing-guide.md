---
title: Testing Guide
tags: [testing, development, best-practices, tdd]
created: 2025-06-26
updated: 2025-06-26
---

# Testing Guide

Comprehensive testing approach using TDD, React Testing Library, and component-driven development.

## Testing Strategy

### Core Principles
- **Test-driven development**: Write tests before implementation
- **Behavior over implementation**: Test what users see and do
- **Component isolation**: Test components independently first
- **Focused tests**: One assertion per test when possible

### Testing Levels
1. **Unit Tests**: Individual functions and hooks
2. **Component Tests**: React components in isolation  
3. **Integration Tests**: Component compositions and flows
4. **E2E Tests**: Complete user journeys (critical paths only)

## Test Types & Tools

### Unit Testing (Jest + React Testing Library)
```typescript
// Test individual functions and hooks
import { calculateAttributeTotal } from '@/lib/character';

test('calculates attribute total correctly', () => {
  const attributes = { strength: 8, dexterity: 6 };
  expect(calculateAttributeTotal(attributes)).toBe(14);
});
```

### Component Testing
```typescript
// Test components in isolation
import { render, screen } from '@testing-library/react';
import { CharacterCard } from './CharacterCard';

test('displays character name', () => {
  const character = { id: '1', name: 'Test Character' };
  render(<CharacterCard character={character} />);
  expect(screen.getByText('Test Character')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
// Test component + store interactions
import { renderWithProviders } from '@/test-utils';

test('creates character and updates store', async () => {
  renderWithProviders(<CharacterCreator />);
  
  await user.type(screen.getByLabelText('Name'), 'New Character');
  await user.click(screen.getByText('Create'));
  
  expect(screen.getByText('Character created')).toBeInTheDocument();
});
```

## Best Practices

### Writing Good Tests
```typescript
// ✅ Good: Descriptive test name
test('displays error message when character creation fails', () => {
  // Test implementation
});

// ❌ Bad: Vague test name  
test('handles error', () => {
  // Test implementation
});
```

### Testing User Interactions
```typescript
// ✅ Good: Test user behavior
test('navigates to character detail when clicked', async () => {
  const user = userEvent.setup();
  render(<CharacterCard character={mockCharacter} />);
  
  await user.click(screen.getByText('View Details'));
  
  expect(mockRouter.push).toHaveBeenCalledWith('/characters/1');
});
```

### Mock Strategy
```typescript
// ✅ Good: Mock external dependencies only
const mockApiCall = jest.fn();
jest.mock('@/lib/api', () => ({
  createCharacter: mockApiCall
}));

// ❌ Bad: Over-mocking internal logic
const mockCalculateTotal = jest.fn();
jest.mock('./utils', () => ({
  calculateTotal: mockCalculateTotal
}));
```

### Error Testing
```typescript
// Test error scenarios
test('displays error when API call fails', async () => {
  mockApiCall.mockRejectedValue(new Error('Network error'));
  
  render(<CharacterForm />);
  await user.click(screen.getByText('Submit'));
  
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

## Component Testing Patterns

### Testing State Changes
```typescript
test('updates display when data changes', () => {
  const { rerender } = render(<Component data="initial" />);
  expect(screen.getByText('initial')).toBeInTheDocument();
  
  rerender(<Component data="updated" />);
  expect(screen.getByText('updated')).toBeInTheDocument();
});
```

### Testing Forms
```typescript
test('submits form with correct data', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  
  render(<CharacterForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText('Name'), 'Test Name');
  await user.selectOptions(screen.getByLabelText('Class'), 'warrior');
  await user.click(screen.getByText('Submit'));
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Test Name',
    class: 'warrior'
  });
});
```

### Testing Loading States
```typescript
test('shows loading spinner while saving', async () => {
  const slowApiCall = jest.fn(() => new Promise(resolve => 
    setTimeout(resolve, 100)
  ));
  
  render(<Component onSave={slowApiCall} />);
  
  user.click(screen.getByText('Save'));
  expect(screen.getByText(/saving/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });
});
```

## Testing Store Integration

### Zustand Store Testing
```typescript
// Test store actions
import { useCharacterStore } from '@/state/characterStore';

beforeEach(() => {
  useCharacterStore.getState().reset();
});

test('creates character in store', () => {
  const { createCharacter } = useCharacterStore.getState();
  
  const characterId = createCharacter({
    name: 'Test Character',
    worldId: 'world-1'
  });
  
  const characters = useCharacterStore.getState().characters;
  expect(characters[characterId]).toMatchObject({
    name: 'Test Character',
    worldId: 'world-1'
  });
});
```

### Component + Store Testing
```typescript
// Use test provider for store testing
const TestProvider = ({ children }) => (
  <CharacterStoreProvider>
    {children}
  </CharacterStoreProvider>
);

test('component updates when store changes', () => {
  render(<CharacterList />, { wrapper: TestProvider });
  
  act(() => {
    useCharacterStore.getState().createCharacter(mockCharacter);
  });
  
  expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
});
```

## Test Organization

### File Structure
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
├── ComponentName.stories.tsx
└── index.ts
```

### Test Setup
```typescript
// src/test-utils.tsx
import { render } from '@testing-library/react';
import { StoreProvider } from '@/providers/StoreProvider';

export const renderWithProviders = (
  ui: React.ReactElement,
  options = {}
) => {
  const Wrapper = ({ children }) => (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
```

## Running Tests

### Development Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- CharacterCard.test.tsx

# Run tests for specific pattern
npm run test -- --testNamePattern="character"
```

### CI/CD Requirements
- All tests must pass before merge
- Maintain 80%+ code coverage
- No console errors or warnings
- Tests run in under 30 seconds

## Storybook Integration

### Component Development Flow
1. **Create component interface** and basic implementation
2. **Write Storybook stories** for all variants
3. **Develop component** iteratively in Storybook
4. **Write unit tests** based on story scenarios
5. **Test integration** in test harness
6. **Integrate** into application

### Story Testing
```typescript
// Component.stories.tsx
import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

export const InteractiveTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Clicked')).toBeInTheDocument();
  }
};
```

## Common Testing Patterns

### API Integration Testing
```typescript
// Mock API responses
beforeEach(() => {
  fetchMock.resetMocks();
});

test('handles API success', async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: '1', name: 'Character' })
  });
  
  render(<ComponentWithAPI />);
  
  await waitFor(() => {
    expect(screen.getByText('Character')).toBeInTheDocument();
  });
});
```

### Router Testing
```typescript
import { MemoryRouter } from 'react-router-dom';

test('navigates correctly', () => {
  render(
    <MemoryRouter initialEntries={['/characters']}>
      <App />
    </MemoryRouter>
  );
  
  expect(screen.getByText('Character List')).toBeInTheDocument();
});
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Troubleshooting

### Common Issues

**Tests timeout**
- Check for unresolved promises
- Ensure all async operations are awaited
- Use `waitFor` for DOM updates

**Mock not working**
- Verify mock is set up before component renders
- Check mock import path matches exactly
- Clear mocks between tests

**Store state persists**
- Reset store state in `beforeEach`
- Use isolated test providers
- Avoid global state mutations

### Debug Techniques
```typescript
// Debug test output
screen.debug(); // Shows current DOM

// Log component props
console.log(screen.getByTestId('component').dataset);

// Check what queries are available
screen.getByRole(''); // Shows available roles in error
```

## Related
- Component Development Workflow
- Storybook Workflow Guide
- State Management Guide