---
title: Testing Guide
tags: [testing, development, best-practices, tdd, visual-testing]
created: 2025-06-26
updated: 2025-11-06
---

# Testing Guide

Testing approach: TDD with React Testing Library and component-driven development. Catch issues early, make refactoring safer.

## Testing Philosophy

I've found that focusing on user behavior over implementation details makes tests way more useful. Instead of testing internal state changes, test what users actually see and do. This makes tests resilient to refactoring and actually validates the user experience.

**Key principles**:
- **TDD**: Write tests before implementation: forces you to think about the API first
- **User-centric**: Test what users see, not how code works internally
- **Component isolation**: Test components independently before integration
- **One thing per test**: Clear, focused assertions that are easy to debug

**Testing pyramid**:
1. **Unit Tests**: Individual functions and hooks (fast, lots of these)
2. **Component Tests**: React components in isolation (medium speed, moderate quantity)
3. **Integration Tests**: Component + store interactions (slower, fewer needed)
4. **Visual Tests**: Screenshot-based regression testing (medium speed, selective coverage)
5. **E2E Tests**: Complete user flows (slowest, only for critical paths)

On top of the pyramid, **mutation testing** (Stryker, `stryker.config.json`) runs locally
against the state, storage, and narrative layers (`src/state/**`, `src/lib/storage/**`,
`src/lib/narrative/**`). It deliberately breaks the code in small ways and checks whether a test
fails — a good way to catch tests that pass without really asserting anything. It's not a CI
gate; run it when you've touched those layers.

## Visual Regression Testing

Visual testing catches issues that other test types miss - layout breaks, styling regressions, and cross-browser rendering differences. We use Playwright's built-in screenshot comparison to automatically detect visual changes.

**When to use visual tests:**
- **New UI components** with visual complexity
- **Layout changes** or responsive behavior
- **Cross-browser compatibility** requirements
- **Critical user interfaces** like navigation and forms

**When NOT to use visual tests:**
- **Simple text-only components** (test with unit/component tests)
- **Purely functional components** with no visual output
- **Frequently changing content** (use mocked stable data)

### Accessibility Testing Integration

Visual tests also verify accessibility implementation by capturing focus states, contrast ratios, and semantic structure. This is particularly important when implementing design system changes that affect accessibility compliance.

**Accessibility test scenarios:**
- **Focus states** for keyboard navigation
- **High contrast mode** appearance
- **Warning/alert styling** with proper semantic colors
- **Interactive element states** (expanded/collapsed, hover, active)

**Example accessibility visual test:**
```typescript
test('accessible warning component', async ({ page }) => {
  await page.goto('/devtools');

  // Test warning with proper semantic styling
  const warning = page.locator('[role="alert"]');
  await expect(warning).toHaveScreenshot('semantic-warning.png', {
    threshold: 0.2 // Strict threshold - accessibility styling should be stable
  });

  // Test keyboard focus state
  await page.locator('button').first().focus();
  await expect(page.locator('button').first()).toHaveScreenshot('focused-button.png');
});
```

### Visual Testing in the Testing Strategy

Visual tests complement other test types by focusing on the user experience:

```
┌─────────────────┬──────────────────┬───────────────────┐
│ Test Type       │ What It Catches  │ Visual Testing    │
├─────────────────┼──────────────────┼───────────────────┤
│ Unit Tests      │ Logic errors     │ N/A               │
│ Component Tests │ Rendering issues │ Basic structure   │
│ Integration     │ Data flow bugs   │ State changes     │
│ Visual Tests    │ Layout breaks    │ PRIMARY           │
│ E2E Tests       │ User workflows   │ Full journeys     │
└─────────────────┴──────────────────┴───────────────────┘
```

### Quick Visual Testing Commands

```bash
# Run visual tests (fast, Chromium only)
npm run test:visual

# Update baselines after intentional changes
npm run test:visual:update

# Debug visual failures
npm run test:visual:headed
```

### Basic Visual Test Pattern

```typescript
import { test, expect } from '@playwright/test';

// Helper for app stability
async function waitForAppReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForSelector('main', { timeout: 15000 });
  await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test('component visual test', async ({ page }) => {
  await page.goto('/component-page');
  await waitForAppReady(page);

  // Full page screenshot
  await expect(page).toHaveScreenshot('component-page.png');

  // Or component-specific screenshot
  const component = page.locator('[data-testid="my-component"]');
  await expect(component).toHaveScreenshot('my-component.png');
});
```

### Visual Testing Best Practices

**Focus on user-critical interfaces:**
- Landing pages and navigation
- Form layouts and validation states
- Game session interfaces
- Modal dialogs and overlays

**Keep tests stable:**
- Use `waitForAppReady()` to ensure content is fully loaded
- Wait for fonts to load before taking screenshots
- Mock dynamic content (dates, random data) for consistency

**Organize by interface area:**
```
tests/visual/
├── main-pages.spec.ts          # Navigation, homepage
├── character-creation.spec.ts  # Character forms
├── game-session.spec.ts       # Game interfaces
└── journal-page.spec.ts       # Journal page snapshots
```

**Handle visual failures appropriately:**
1. **If it's a bug**: fix the code, don't update the baseline
2. **If it's intentional**: update the baseline with `npm run test:visual:update`
3. **If it's environmental**: check CI artifacts and adjust thresholds

For complete visual testing guidance, see the [Visual Regression Testing Guide](./visual-regression-testing.md).

## Practical Testing Patterns

**Unit Tests** - Test individual functions and hooks. These are fast and catch logic errors early:

```typescript
import { calculateDerivedStat } from '@/lib/utils/derivedStatCalculator';

test('calculates a simple multiplier formula', () => {
  const formula = {
    id: 'vitality-pool',
    name: 'Vitality Pool',
    worldId: 'world-1',
    description: 'Health pool',
    attributeMultipliers: { constitution: 10 },
  };
  const attributes = [
    { id: 'attr-1', characterId: 'char-1', worldAttributeId: 'constitution',
      name: 'constitution', baseValue: 15, modifiedValue: 15, category: 'test' },
  ];

  expect(calculateDerivedStat(formula, attributes)).toBe(150);
});
```

**Component Tests** - Test components in isolation. Focus on what users see, not internal implementation:

```typescript
import { render, screen } from '@testing-library/react';
import { CharacterCard } from './CharacterCard';

test('displays character name', () => {
  const character = { id: '1', name: 'Test Character' };
  render(<CharacterCard character={character} />);
  expect(screen.getByText('Test Character')).toBeInTheDocument();
});
```

**Integration Tests** - Test components with their data sources. This catches issues with state management:

```typescript
import { render, screen } from '@testing-library/react';
import { mockZustandStore, createMockCharacterStore } from '@/lib/test-utils';
import { useCharacterStore } from '@/state/characterStore';

test('creates character and updates store', async () => {
  const mockStore = createMockCharacterStore();
  mockZustandStore(useCharacterStore, mockStore);

  render(<CharacterCreator />);

  await user.type(screen.getByLabelText('Name'), 'New Character');
  await user.click(screen.getByText('Create'));

  expect(screen.getByText('Character created')).toBeInTheDocument();
});
```

## Test-Writing Habits

**Descriptive test names** save so much debugging time. When a test fails, you should immediately know what broke:

```typescript
// Good: Clear: tells you exactly what failed
test('displays error message when character creation fails', () => {
  // Test implementation
});

// Avoid: Vague: have to read the test to understand what it does
test('handles error', () => {
  // Test implementation
});
```

**Test user interactions, not implementation details**. Focus on what users actually do:

```typescript
// Good: Tests the user experience
test('navigates to character detail when clicked', async () => {
  const user = userEvent.setup();
  render(<CharacterCard character={mockCharacter} />);

  await user.click(screen.getByText('View Details'));

  expect(mockRouter.push).toHaveBeenCalledWith('/characters/1');
});
```

**Mock sparingly**. Only mock external dependencies, not your own logic:

```typescript
// Good: Mock API calls and external services
const mockApiCall = jest.fn();
jest.mock('@/lib/api', () => ({
  createCharacter: mockApiCall
}));

// Avoid: Don't mock your own functions: test them instead
const mockCalculateTotal = jest.fn();
jest.mock('./utils', () => ({
  calculateTotal: mockCalculateTotal  // This defeats the purpose of testing
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

## Test Utilities

The codebase has test utilities to make writing tests faster and more consistent. Use them instead of manually creating mocks.

### Test Data Factory

Use `createMock*` functions to create test objects with sensible defaults:

```typescript
import { createMockCharacter, createMockWorld, createMockInventoryItem } from '@/lib/test-utils';

// Only specify what matters for your test
const character = createMockCharacter({
  name: 'Test Character',
  worldId: 'world-1'
});

const item = createMockInventoryItem({
  stackable: true,
  quantity: 5
});
```

Available factories (`src/lib/test-utils/testDataFactory.ts`):
- `createMockWorld`, `createMockWorldAttribute`, `createMockWorldSkill`
- `createMockCharacter`
- `createMockInventoryItem`
- `createMockNarrativeSegment`
- `createMockJournalEntry`

**When to use:**
- Creating domain objects for tests
- You only care about a few specific fields
- Avoiding verbose manual object creation

**When NOT to use:**
- Testing validation (intentionally invalid data)
- The defaults would be confusing for your specific test

### Mock Store Factories

Use store factories instead of manually mocking Zustand stores:

```typescript
import { mockZustandStore, createMockCharacterStore } from '@/lib/test-utils';
import { useCharacterStore } from '@/state/characterStore';

jest.mock('@/state/characterStore');

beforeEach(() => {
  const mockStore = createMockCharacterStore({
    characters: { 'char-1': mockCharacter },
    currentCharacterId: 'char-1'
  });

  mockZustandStore(useCharacterStore, mockStore);
});
```

Available factories (`src/lib/test-utils/mockStoreFactories/`):
- `createMockCharacterStore`, `createMockWorldStore`, `createMockSessionStore`
- `createMockInventoryStore`, `createMockJournalStore`, `createMockNarrativeStore`
- `createMockNPCStore`

There's no factory for the goal or lore stores; mock those by hand.

Each factory provides:
- Empty collections for state
- All methods as `jest.fn()` mocks
- Sensible return values

**Override specific methods:**
```typescript
const mockStore = createMockInventoryStore({
  items: { 'item-1': mockItem },
  removeItem: jest.fn(), // Track calls to this method
  getCharacterItems: jest.fn(() => [mockItem, mockItem2])
});
```

**Testing selectors:**
```typescript
// Component uses selector
function MyComponent() {
  const currentChar = useCharacterStore(state =>
    state.characters[state.currentCharacterId]
  );
  return <div>{currentChar.name}</div>;
}

// Test works automatically
const mockStore = createMockCharacterStore({
  characters: { 'char-1': mockCharacter },
  currentCharacterId: 'char-1'
});

mockZustandStore(useCharacterStore, mockStore);
render(<MyComponent />);
expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
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

### Test Utilities
Test helpers live in `src/lib/test-utils/` and are exported from `src/lib/test-utils/index.ts`:

```typescript
import { createMockCharacter, mockZustandStore } from '@/lib/test-utils';
```

## Running Tests

### Development Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- CharacterCard.test.tsx

# Run tests for specific pattern
npm run test -- --testNamePattern="character"
```

### CI/CD Requirements

The CI pipeline enforces a few quality gates before code can merge. These aren't arbitrary - they're things that have caught real bugs in the past.

**All tests must pass** - Obvious, but worth stating. If tests fail in CI, something's wrong. Don't bypass this by skipping tests.

**Coverage is a habit, not a gate** - `jest.config.cjs` sets no `coverageThreshold` and nothing in CI fails on coverage, so treat `npm run test:coverage` as a way to spot untested critical paths rather than a number to clear. A visible drop usually means code landed without tests.

**No console errors or warnings** - Clean console output matters. Warnings about deprecated APIs or prop type mismatches often indicate real issues.

**Tests run fast** - If tests take too long, people stop running them locally. Keep the full suite under 30 seconds so there's no excuse to skip them.

## Component Development Workflow

The process I've found that works well:

1. **Start with the interface** - define props and basic component structure
2. **Build stories first** - create Storybook stories for all the variants you need
3. **Develop in isolation** - get the component working in Storybook before integrating
4. **Write tests based on stories** - the stories show you what needs testing
5. **Test integration** - use test harnesses to verify it works with real data
6. **Integrate into the app** - by this point, most issues are already caught

### Story Testing
```typescript
// Component.stories.tsx
import { expect, within, userEvent } from '@storybook/test';

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

## When Things Go Wrong

**Tests timing out** - Usually unresolved promises. Make sure you're awaiting all async operations and using `waitFor` for DOM updates. If you're testing user interactions, don't forget to await the user events.

**Mocks not working** - Check that the mock is set up before the component renders, and that the import path matches exactly. Also, clear mocks between tests or you'll get weird cross-test pollution.

**Store state bleeding between tests** - Reset store state in `beforeEach`, use isolated test providers, and avoid mutating global state in tests. Each test should start with a clean slate.

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
