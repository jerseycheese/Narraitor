import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * Privacy page rendering.
 */

async function gotoPrivacy(page: Page): Promise<void> {
  await page.goto('/privacy');
  await page.waitForSelector('.component-legal', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('Privacy page rendering', () => {
  test('privacy renders consistently', async ({ page }) => {
    await gotoPrivacy(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-legal')).toHaveScreenshot('privacy-ds3.png');
  });
});
