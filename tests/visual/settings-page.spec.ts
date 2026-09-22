import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Settings Page Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Settings Page Visual Tests', () => {
  test('Settings page should render consistently', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test to handle resource contention
    
    await seedTestData(page);
    
    await page.goto('/settings');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of settings page
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });
});
