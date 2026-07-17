import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';

/**
 * Landing page rendering at the public root route (#1528; formerly /welcome).
 * A fresh Playwright context has no persisted app state, so / renders the
 * Landing front door without redirecting. Images are awaited because the hero
 * carries a visual. The baseline is element-scoped to .component-landing and
 * carried over unchanged from the /welcome-era spec.
 */

async function gotoLanding(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('.component-landing', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Landing page rendering', () => {
  test('landing renders consistently at the root route', async ({ page }) => {
    await gotoLanding(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-landing')).toHaveScreenshot('landing-ds3.png');
  });
});
