import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData, seedBaseData } from './utils/seedTestData';

/**
 * Worlds List Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Worlds List Visual Tests', () => {
  test('Worlds list page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster and more reliable
    await seedBaseData(page);
    
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - shows empty state with onboarding
    await expect(page).toHaveScreenshot('worlds-list-empty-state.png', { fullPage: true });
  });

  test('Worlds list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to worlds page to see populated data
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - should show populated worlds
    await expect(page).toHaveScreenshot('worlds-list.png', { fullPage: true });
  });

  test('Worlds list page should render consistently (dark mode)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('worlds-list-dark.png', { fullPage: true });
  });
});
