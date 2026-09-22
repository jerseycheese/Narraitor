import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { waitForStoreReady } from './utils/tutorial-helpers';

/**
 * Detail Pages Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Detail Pages Visual Tests', () => {
  test('World detail page should render consistently', async ({ page }) => {
    await seedTestData(page);

    // Navigate to the cyberpunk world detail page
    await page.goto('/worlds/world-cyberpunk-2077');
    // Block on the seed flushing and the world actually rendering before
    // capture - without this the IndexedDB seed loses the race in CI and the
    // page paints empty (chrome only). See #1198.
    await waitForStoreReady(page);
    // getByText matched the header's own "Cyberpunk Neo-Tokyo" copies too, and
    // .first() isn't guaranteed to land on a visible one - the page now
    // carries a mobile breadcrumb hidden by media query ahead of the visible
    // ones in DOM order. The heading is the one instance of the name this
    // page guarantees.
    await expect(
      page.getByRole('heading', { name: 'Cyberpunk Neo-Tokyo' })
    ).toBeVisible({ timeout: 15000 });
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await pinAppShell(page);

    // Take screenshot of world detail page - should show world info, characters, and actions
    await expect(page).toHaveScreenshot('world-detail.png', { fullPage: true });
  });

  test('Character detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to Nova character detail page
    await page.goto('/characters/char-cyberpunk-hacker');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await pinAppShell(page);

    // Take screenshot of character detail page - should show character sheet, attributes, skills
    await expect(page).toHaveScreenshot('character-detail.png', { fullPage: true });
  });
});
