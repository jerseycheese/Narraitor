import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * About page rendering (#1135).
 */

async function gotoAbout(page: Page): Promise<void> {
  await page.goto('/about');
  await page.waitForSelector('.component-about', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('About page rendering', () => {
  test('about renders consistently', async ({ page }) => {
    await gotoAbout(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds3.png');
  });

  test('about renders consistently in dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await gotoAbout(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds3-dark.png');
  });

  test('about renders consistently at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAbout(page);
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds3-mobile.png');
  });
});
