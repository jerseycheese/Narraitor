import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';

/**
 * Welcome / landing page rendering. Images are awaited because the hero carries a visual.
 */

async function gotoWelcome(page: Page): Promise<void> {
  await page.goto('/welcome');
  await page.waitForSelector('.component-landing', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Welcome page rendering', () => {
  test('welcome renders consistently', async ({ page }) => {
    await gotoWelcome(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-landing')).toHaveScreenshot('welcome-ds3.png');
  });
});
