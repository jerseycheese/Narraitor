import { test as base } from '@playwright/test';
import { seedTestData, seedBaseData } from './seedTestData';

/**
 * Custom Playwright fixtures for automatic test data seeding
 *
 * Usage:
 * ```typescript
 * import { test } from '@/tests/visual/utils/playwright-fixtures';
 *
 * // Automatically seeds test data before each test
 * test('character list', async ({ seededPage }) => {
 *   await seededPage.goto('/characters');
 *   // Data is already seeded
 * });
 *
 * // Test empty state
 * test('empty worlds list', async ({ emptyStatePage }) => {
 *   await emptyStatePage.goto('/worlds');
 *   // App starts with no data
 * });
 * ```
 */

export const test = base.extend({
  /**
   * Page fixture with full test data seeded
   * Use this for tests that require populated state
   */
  seededPage: async ({ page }, use) => {
    await seedTestData(page);
    await use(page);
  },

  /**
   * Page fixture with empty state
   * Use this for tests that require empty/initial state
   */
  emptyStatePage: async ({ page }, use) => {
    await seedBaseData(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
