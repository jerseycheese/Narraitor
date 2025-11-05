---
title: "Refactor visual testing setup: consolidate fixtures and simplify data seeding"
labels: testing, refactoring, infrastructure
assignees: "@me"
---

## Plain Language Summary
<!-- A simple 1-2 sentence explanation of this enhancement for non-technical stakeholders -->

Simplify our visual testing data setup by organizing test data into centralized files and using modern patterns, reducing a 1,500-line file to under 300 lines while making tests more reliable and easier to maintain.

## Current Feature
<!-- Describe the current feature that you want to enhance -->

Our visual testing infrastructure uses Playwright for screenshot-based regression testing. Test data is currently managed through:
- A 1,500-line `data-seeder.ts` file with inline test data mixed with seeding logic
- Duplicate test data in `scripts/seed-visual-test-data.cjs`
- Three different seeding approaches (setState, IndexedDB, localStorage) in one file

## Domain
<!-- Select the domain this enhancement belongs to -->
- [ ] World Configuration
- [ ] Character System
- [ ] Decision Tracking System
- [ ] Decision Relevance System
- [ ] Narrative Engine
- [ ] Journal System
- [x] State Management
- [x] Other: Testing Infrastructure

## Enhancement Description
<!-- A clear and concise description of what you want to enhance and how -->

Refactor the visual testing setup to implement industry best practices for test data management:

### Problems to Solve
1. **1,500-line data-seeder.ts** - Lines 16-661 are just test data, violating separation of concerns
2. **Duplicate test data** across `data-seeder.ts` and `seed-visual-test-data.cjs`
3. **Complex seeding logic** with three different approaches making debugging difficult
4. **No centralized fixtures** - data hardcoded inline, no factory pattern for variations

### Proposed Solution

**New Directory Structure:**
```
tests/
├── fixtures/              # Centralized test data
│   ├── index.ts
│   ├── worlds.fixture.ts
│   ├── characters.fixture.ts
│   ├── sessions.fixture.ts
│   └── narrative.fixture.ts
├── factories/             # Type-safe data generators
│   ├── index.ts
│   ├── worldFactory.ts
│   ├── characterFactory.ts
│   └── sessionFactory.ts
└── visual/
    ├── utils/
    │   ├── seedTestData.ts        # ONLY seeding logic
    │   ├── mockApi.ts             # API mocking
    │   └── playwright-fixtures.ts # Custom Playwright fixtures
    └── *.spec.ts
```

**Implementation Phases:**

#### Phase 1: Extract Fixtures (1-2 hours)
- Create `tests/fixtures/` directory
- Extract SAMPLE_WORLDS → `worlds.fixture.ts`
- Extract SAMPLE_CHARACTERS → `characters.fixture.ts`
- Extract SAMPLE_GAME_SESSIONS → `sessions.fixture.ts`
- Extract SAMPLE_NARRATIVE_SEGMENTS/DECISIONS → `narrative.fixture.ts`
- Create barrel export `fixtures/index.ts`
- Delete duplicate data from `seed-visual-test-data.cjs`

#### Phase 2: Implement Factory Pattern (2-3 hours)
- Install `fishery` package for type-safe test data generation
- Implement factories for World, Character, Session entities
- Update tests to use factories for dynamic data
- Document factory usage

#### Phase 3: Simplify Seeding Logic (1-2 hours)
- Extract seeding into `tests/visual/utils/seedTestData.ts`
- Consolidate to single approach (IndexedDB + localStorage fallback)
- Create custom Playwright fixtures for automatic seeding
- Reduce data-seeder.ts from 1,500 → <300 lines

#### Phase 4: Add API Mocking (1 hour)
- Create `mockApi.ts` for deterministic test data
- Mock narrative generation endpoints
- Mock choice generation endpoints
- Ensure visual consistency across test runs

#### Phase 5: Cleanup & Documentation (1 hour)
- Update testing guide documentation
- Add fixture examples
- Delete deprecated `seed-visual-test-data.cjs`
- Validate all visual tests pass

## Reason for Enhancement
<!-- Why is this enhancement valuable? -->

### Immediate Benefits
- **Reduced complexity**: data-seeder.ts from 1,500 → <300 lines
- **No duplication**: Single source of truth for test fixtures
- **Better organization**: Clear separation between data and logic
- **Type safety**: Factory pattern provides compile-time validation

### Long-term Benefits
- **Easier maintenance**: Fixture changes in one place
- **Better test isolation**: Playwright fixtures ensure clean state per test
- **Reduced flakiness**: Mocked APIs eliminate data variability (the #1 cause of flaky visual tests)
- **Faster test writing**: Factories make generating test data variations trivial
- **Improved CI reliability**: Consistent, predictable test data means fewer false positives

### Research-Backed
Based on 2024-2025 industry best practices:
- **Factory Pattern Recommended**: TypeScript libraries like Fishery provide type-safe, reusable test data
- **Separation of Concerns**: Fixture data separate from seeding logic
- **Playwright Fixtures > beforeEach**: Better test isolation
- **API Mocking Critical**: Deterministic data prevents 60% of visual test failures

## Possible Implementation
<!-- If you have any ideas about how to implement this enhancement, describe them here -->

### Factory Pattern Example
```typescript
// tests/factories/worldFactory.ts
import { Factory } from 'fishery';
import type { World } from '@/types';

export const worldFactory = Factory.define<World>(({ sequence }) => ({
  id: `world-${sequence}`,
  name: `Test World ${sequence}`,
  description: 'A test world for testing',
  genre: 'cyberpunk',
  attributes: [],
  skills: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}));

// Usage: Generate unique test data on-demand
const cyberpunkWorld = worldFactory.build({
  name: 'Neo-Tokyo',
  genre: 'cyberpunk'
});
```

### Custom Playwright Fixture Example
```typescript
// tests/visual/utils/playwright-fixtures.ts
import { test as base } from '@playwright/test';
import { seedTestData } from './seedTestData';

export const test = base.extend({
  seededPage: async ({ page }, use) => {
    await seedTestData(page);
    await use(page);
  }
});

// Usage: Automatic data seeding
test('character list', async ({ seededPage }) => {
  await seededPage.goto('/characters');
  // Data automatically seeded before test runs
});
```

### Simplified Seeding Logic
```typescript
// Single unified approach instead of three separate methods
export async function seedTestData(page: Page) {
  await page.addInitScript(({ worlds, characters }) => {
    const seedStore = async (key: string, data: unknown) => {
      const storeData = { state: data, version: 1 };

      // IndexedDB (primary)
      await seedIndexedDB(key, storeData);

      // localStorage (fallback)
      localStorage.setItem(key, JSON.stringify(storeData));
    };

    await seedStore('narraitor-world-store', { worlds, ... });
  }, { worlds: SAMPLE_WORLDS, characters: SAMPLE_CHARACTERS });
}
```

## Alternatives Considered
<!-- Have you considered any alternative solutions? -->

### Alternative 1: Keep Current Structure, Just Clean Up
**Rejected** - Doesn't solve root problems (duplication, complexity, lack of factory pattern)

### Alternative 2: Use JSON files for fixtures
**Rejected** - JSON lacks type safety and doesn't support TypeScript types/constants

### Alternative 3: Use efate instead of Fishery
**Considered** - Both are good, but Fishery is more established (thoughtbot) and has better TypeScript support

### Alternative 4: Build custom factory system
**Rejected** - Reinventing the wheel when Fishery provides exactly what we need

## Additional Context
<!-- Add any other context or screenshots about the enhancement here -->

### Related Work
- #820 - Create typed mock factory functions (completed) ✅
- #822 - Migrate remaining tests to typed mock factories (completed) ✅
- #801 - Stabilize visual narrative seeding for Playwright (completed) ✅

These prior issues laid groundwork for this refactor by introducing typed mocks in unit tests. This issue extends that pattern to visual regression tests.

### Research References
- [Playwright Test Data Management Strategies](https://momentic.ai/resources/the-definitive-guide-to-playwright-test-data-management-strategies)
- [The Definitive Guide to Creating a DataFactory](https://playwrightsolutions.com/the-definitive-guide-to-api-testcreating-a-datafactory-to-manage-test-data/)
- [Fishery: Modern Test Fixture Library](https://github.com/thoughtbot/fishery)

### Estimated Effort
**Total: 6-9 hours** across 5 phases
- Phase 1 (Extract Fixtures): 1-2 hours
- Phase 2 (Factory Pattern): 2-3 hours
- Phase 3 (Simplify Seeding): 1-2 hours
- Phase 4 (API Mocking): 1 hour
- Phase 5 (Cleanup & Docs): 1 hour

### Acceptance Criteria
- [ ] All test fixtures extracted to `tests/fixtures/` directory
- [ ] Factory pattern implemented for dynamic test data generation
- [ ] Seeding logic simplified to single approach
- [ ] API mocking in place for all AI endpoints
- [ ] All existing visual tests passing with new structure
- [ ] data-seeder.ts reduced to <300 lines
- [ ] Documentation updated with new patterns
- [ ] No duplicate test data definitions
