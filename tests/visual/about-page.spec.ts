import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * About page — per-theme structural differentiation (#1135).
 * The /about page needs no seeded data, so we just navigate and switch
 * theme via the global theme-switcher radios (reachable in the header).
 */

async function settleTheme(
  page: Page,
  theme?: { id: 'ds2' | 'ds3'; label: 'DS2' | 'DS3' }
): Promise<void> {
  if (theme) {
    await page.getByRole('radio', { name: theme.label }).click();
    await page.waitForFunction(
      (t) => document.documentElement.getAttribute('data-theme') === t,
      theme.id
    );
  }
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

async function gotoAbout(page: Page): Promise<void> {
  await page.goto('/about');
  await waitForContentStable(page);
  await page.waitForSelector('.component-about', { timeout: 8000 });
}

test.describe('About page theme differentiation', () => {
  test('DS1 about renders consistently', async ({ page }) => {
    await gotoAbout(page);
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds1.png');
  });

  test('DS2 about renders consistently', async ({ page }) => {
    await gotoAbout(page);
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds2.png');
  });

  test('DS3 about renders consistently', async ({ page }) => {
    await gotoAbout(page);
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds3.png');
  });
});
