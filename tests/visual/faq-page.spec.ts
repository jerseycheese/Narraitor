import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * FAQ page rendering.
 */

async function gotoFaq(page: Page): Promise<void> {
  await page.goto('/faq');
  await page.waitForSelector('.component-faq', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('FAQ page rendering', () => {
  test('faq renders consistently', async ({ page }) => {
    await gotoFaq(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-faq')).toHaveScreenshot('faq-ds3.png');
  });

  test('faq renders consistently in dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await gotoFaq(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-faq')).toHaveScreenshot('faq-ds3-dark.png');
  });

  test('faq renders consistently at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoFaq(page);
    await expect(page.locator('.component-faq')).toHaveScreenshot('faq-ds3-mobile.png');
  });
});
