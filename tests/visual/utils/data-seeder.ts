/**
 * Data Seeder for Visual Regression Tests
 *
 * This file provides backward compatibility for existing tests while they migrate
 * to the new fixture system.
 *
 * ## Migration Guide
 *
 * **Old approach:**
 * ```typescript
 * import { SAMPLE_WORLDS, seedTestData } from './utils/data-seeder';
 * ```
 *
 * **New approach:**
 * ```typescript
 * import { SAMPLE_WORLDS } from '@/tests/fixtures';
 * import { seedTestData } from '@/tests/visual/utils/seedTestData';
 * // OR use custom Playwright fixtures:
 * import { test } from '@/tests/visual/utils/playwright-fixtures';
 * test('my test', async ({ seededPage }) => { ... });
 * ```
 *
 * @deprecated Use `@/tests/fixtures` for test data and `seedTestData` utility
 */

// Re-export test data from centralized fixtures
export {
  SAMPLE_WORLDS,
  SAMPLE_CHARACTERS,
  SAMPLE_GAME_SESSIONS,
  SAMPLE_NARRATIVE_SEGMENTS,
  SAMPLE_DECISIONS,
} from '@/tests/fixtures';

// Re-export seeding functions
export { seedTestData, seedBaseData } from './seedTestData';

// Re-export API mocking utilities
export { mockApiEndpoints } from './mockApi';

// Legacy helper - use mockApiEndpoints instead
export const fillQuickPlayForm = async (page: any) => {
  console.warn('fillQuickPlayForm is deprecated - use mockApiEndpoints instead');
  try {
    const conceptInput = page
      .locator(
        'input[placeholder*="character"], textarea[placeholder*="character"]'
      )
      .first();
    if ((await conceptInput.count()) > 0) {
      await conceptInput.fill('A mysterious wizard seeking ancient knowledge');
    }

    const settingInput = page
      .locator('input[placeholder*="setting"], input[placeholder*="world"]')
      .first();
    if ((await settingInput.count()) > 0) {
      await settingInput.fill('Mystical Academy of Arcane Arts');
    }
  } catch (error) {
    console.log('Could not fill QuickPlay form:', error);
  }
};
