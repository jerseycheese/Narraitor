---
title: Test Strategy
aliases: [Testing Strategy, Test Approach]
tags: [narraitor, testing, quality]
created: 2025-04-29
updated: 2025-04-29
---

# NarrAItor Testing Strategy

## Overview
This document outlines the comprehensive testing approach for NarrAItor, covering unit testing, integration testing, component testing, and end-to-end testing. It defines testing boundaries, responsibilities, and patterns for each domain.

## Core Testing Principles

### Test-Driven Development
- Tests are written before implementation code
- Tests define the expected behavior
- Implementation satisfies the test requirements
- Refactoring preserves test coverage

### KISS Testing
- Tests focus on behavior, not implementation
- Each test has a single assertion when possible
- Test setup is kept minimal and clear
- Mock only what's necessary

### Component-Driven Testing
- Components are tested in isolation
- Storybook stories complement component tests
- Visual and interactive testing through Storybook
- Integration tests verify component composition

## Testing Levels

### Unit Testing (Jest + React Testing Library)
- **Coverage Target**: 80%+ for all domains
- **Focus**: Individual functions, hooks, reducers
- **Isolation**: High (heavy use of mocks for dependencies)
- **Speed**: Fast (should run in seconds)

### Component Testing (React Testing Library + Storybook)
- **Coverage Target**: 90%+ for UI components
- **Focus**: Individual React components
- **Isolation**: Medium (mock external dependencies)
- **Speed**: Medium-fast

### Integration Testing (React Testing Library)
- **Coverage Target**: 70%+ for critical paths
- **Focus**: Component compositions, cross-domain interactions
- **Isolation**: Low (minimal mocking)
- **Speed**: Medium

### End-to-End Testing (Playwright)
- **Coverage Target**: 100% for critical user flows
- **Focus**: Complete user journeys
- **Isolation**: None (full application)
- **Speed**: Slow (minutes to run)

## Domain-Specific Testing Approaches

### World Configuration Domain

#### Unit Testing
- **State Management**: Test reducers for all action types
- **Model Validation**: Test validator functions
- **Format Conversion**: Test import/export functionality
- **Utilities**: Test helper functions

```typescript
// Example reducer test
describe('worldReducer', () => {
  it('should add a world correctly', () => {
    const initialState = { worlds: [], currentWorldId: null };
    const world = { id: '123', name: 'Test World', /* other props */ };
    
    const newState = worldReducer(initialState, { 
      type: 'ADD_WORLD', 
      payload: world 
    });
    
    expect(newState.worlds).toHaveLength(1);
    expect(newState.worlds[0]).toEqual(world);
  });
});
```

#### Component Testing
- **World Creation Wizard**: Test each step individually
- **Attribute Editor**: Test CRUD operations
- **Skill Manager**: Test relationship with attributes
- **World Selection**: Test filtering and selection

```typescript
// Example component test
describe('WorldCard', () => {
  it('displays world information correctly', () => {
    const world = { 
      id: '123', 
      name: 'Fantasy World', 
      description: 'A magical realm' 
    };
    
    const { getByText } = render(<WorldCard world={world} />);
    
    expect(getByText('Fantasy World')).toBeInTheDocument();
    expect(getByText('A magical realm')).toBeInTheDocument();
  });
});
```

#### Integration Testing
- **World Creation Flow**: Test complete wizard flow
- **World-Character Integration**: Test how world changes affect character creation
- **Theme Application**: Test world theme applies correctly to UI

### Character Domain

#### Unit Testing
- **State Management**: Test character reducer actions
- **Attribute Calculations**: Test derived attribute functions
- **Validation**: Test character data validation
- **Point Allocation**: Test point-buy mechanics

#### Component Testing
- **Character Creation Wizard**: Test each step isolation
- **Attribute Allocation**: Test point distribution UI
- **Character Card**: Test display of character info
- **Character List**: Test filtering and selection

#### Integration Testing
- **Character Creation Flow**: Test complete wizard flow
- **Character-Narrative Integration**: Test how character influences narrative
- **Skill Check Mechanics**: Test skill usage in narrative

### Narrative Domain

#### Unit Testing
- **State Management**: Test narrative reducer actions
- **Context Management**: Test narrative context building
- **AI Prompt Construction**: Test prompt template functions
- **Response Parsing**: Test AI response handling

#### Component Testing
- **Narrative Display**: Test text rendering with formatting
- **Choice Selector**: Test choice presentation and selection
- **Loading States**: Test AI generation indicators
- **Error Handling**: Test fallback content display

#### Integration Testing
- **Narrative Generation Flow**: Test complete narrative cycle
- **Decision Points**: Test choice selection and consequences
- **World-Narrative Integration**: Test world theme in narrative

### Journal Domain

#### Unit Testing
- **State Management**: Test journal reducer actions
- **Entry Categorization**: Test categorization functions
- **Filtering**: Test entry filtering logic
- **History Tracking**: Test sequential entry creation

#### Component Testing
- **Journal Viewer**: Test entry display formatting
- **Entry Detail**: Test detailed entry view
- **Filter Controls**: Test filtering UI
- **Entry Navigation**: Test chronological navigation

#### Integration Testing
- **Journal Creation Flow**: Test automatic entry creation
- **Journal-Narrative Integration**: Test narrative events in journal
- **Filter Application**: Test filtering across entry types

## Testing Tools and Utilities

### Jest Configuration
- Custom matchers for domain-specific assertions
- Mock implementations for external services
- Setup and teardown utilities

### React Testing Library Utilities
- Custom queries for domain-specific selectors
- User event simulation helpers
- Snapshot comparison utilities

### Storybook Integration
- Storybook tests with Component Story Format
- Visual regression testing with Chromatic
- Accessibility testing with a11y addon

### Playwright Setup
- Device emulation profiles
- Authentication utilities
- Test recording and playback

## Test Data Strategy

### Test Fixtures
- Domain-specific fixture factories
- JSON fixture files for complex structures
- Randomized data generation for edge cases

```typescript
// Example fixture factory
export function createTestWorld(overrides = {}) {
  return {
    id: 'test-world-1',
    name: 'Test World',
    description: 'A world for testing',
    attributes: [
      { id: 'str', name: 'Strength', minValue: 1, maxValue: 10, defaultValue: 5 },
      { id: 'dex', name: 'Dexterity', minValue: 1, maxValue: 10, defaultValue: 5 }
    ],
    skills: [
      { id: 'fight', name: 'Fighting', relatedAttributes: ['str'], minValue: 1, maxValue: 5, defaultValue: 1 },
      { id: 'dodge', name: 'Dodging', relatedAttributes: ['dex'], minValue: 1, maxValue: 5, defaultValue: 1 }
    ],
    createdAt: '2025-03-01T12:00:00Z',
    updatedAt: '2025-03-01T12:00:00Z',
    ...overrides
  };
}
```

### Mock Services
- AI service mocks with predetermined responses
- IndexedDB mocks for persistence testing
- Mock timers for time-dependent tests

## End-to-End Test Scenarios

### Critical User Flows
1. **World Creation and Setup**: Create world with attributes and skills
2. **Character Creation and Management**: Create and edit character
3. **Game Session Flow**: Start session, generate narrative, make choices
4. **Journal Review**: Access and filter journal entries

```typescript
// Example E2E test for world creation
test('user can create a new world', async ({ page }) => {
  // Navigate to world creation
  await page.goto('/worlds/create');
  
  // Step 1: Basic Information
  await page.fill('[data-testid="world-name-input"]', 'Fantasy Realm');
  await page.fill('[data-testid="world-description-input"]', 'A magical world of adventure');
  await page.selectOption('[data-testid="world-genre-select"]', 'fantasy');
  await page.click('[data-testid="next-button"]');
  
  // Step 2: Attributes
  await page.click('[data-testid="add-attribute-button"]');
  await page.fill('[data-testid="attribute-name-input"]', 'Strength');
  await page.fill('[data-testid="attribute-description-input"]', 'Physical power');
  await page.click('[data-testid="save-attribute-button"]');
  await page.click('[data-testid="next-button"]');
  
  // Step 3: Skills
  await page.click('[data-testid="add-skill-button"]');
  await page.fill('[data-testid="skill-name-input"]', 'Fighting');
  await page.fill('[data-testid="skill-description-input"]', 'Combat ability');
  await page.selectOption('[data-testid="related-attribute-select"]', 'Strength');
  await page.click('[data-testid="save-skill-button"]');
  await page.click('[data-testid="next-button"]');
  
  // Step 4: Theme
  await page.click('[data-testid="theme-option-fantasy"]');
  await page.click('[data-testid="finish-button"]');
  
  // Verify world created
  await expect(page).toHaveURL(/\/worlds\/[\w-]+$/);
  await expect(page.locator('[data-testid="world-title"]')).toHaveText('Fantasy Realm');
});
```

### Error and Edge Cases
1. **Network Failure**: AI service unavailable during narrative generation
2. **Data Loading Failure**: Corrupted data during session load
3. **Storage Limits**: IndexedDB storage quota exceeded
4. **API Rate Limiting**: AI service rate limit reached

## Continuous Integration Testing

### GitHub Actions Workflow
- Unit and component tests on PR
- Integration tests on merge to main
- E2E tests on scheduled basis
- Storybook visual testing on UI changes

### Test Reports
- Jest coverage reports
- Test result summaries
- Visual regression comparison

## Manual Testing Guidelines

### Exploratory Testing
- Focus areas for each release
- Structured exploratory testing sessions
- Bug reporting templates

### Acceptance Testing
- Criteria verification checklist
- Stakeholder review process
- Final validation steps

## Related Documents
- [Development Workflow](/users/jackhaas/projects/narraitor/docs/development/workflows/feature-development-workflow.md)
- [KISS Principles](/users/jackhaas/projects/narraitor/docs/development/workflows/kiss-principles-react.md)
- [TDD with KISS](/users/jackhaas/projects/narraitor/docs/development/workflows/tdd-with-kiss.md)
- [Storybook Workflow](/users/jackhaas/projects/narraitor/docs/development/workflows/storybook-workflow.md)