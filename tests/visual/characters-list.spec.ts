import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Characters List Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Characters List Visual Tests', () => {
  test('Characters list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of characters page - should show populated characters
    await expect(page).toHaveScreenshot('characters-list.png', { fullPage: true });
  });

  test('Characters list page should render consistently (dark mode)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('characters-list-dark.png', { fullPage: true });
  });
});
