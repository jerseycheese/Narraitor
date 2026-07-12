import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * Terms page rendering.
 */

async function gotoTerms(page: Page): Promise<void> {
  await page.goto('/terms');
  await page.waitForSelector('.component-legal', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('Terms page rendering', () => {
  test('terms renders consistently', async ({ page }) => {
    await gotoTerms(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-legal')).toHaveScreenshot('terms-ds3.png');
  });
});
