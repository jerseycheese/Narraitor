import { test, expect, type Page } from '@playwright/test';
import { applyTheme } from './utils/applyTheme';
import { waitForContentStable, hideDynamicContent, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Characters list — per-theme structural differentiation (#1224 / epic #1165).
 *
 * Captures /characters at DS1 (Folio), DS2 (Bento), DS3 (Console). Locator-
 * scoped screenshots target the characters body region.
 */

async function settleTheme(
  page: Page,
  theme?: { id: 'ds2' | 'ds3'; label: 'DS2' | 'DS3' }
): Promise<void> {
  if (theme) {
    await applyTheme(page, theme.id);
  }
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Characters list theme differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto('/characters?worldId=world-cyberpunk-2077');
    await page.waitForFunction(
      () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
      { timeout: 15000 }
    );
    await page.reload();
    await waitForContentStable(page);
    await page.waitForSelector('.characters-body', { timeout: 8000 });
  });

  test('DS1 characters list renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.characters-body')).toHaveScreenshot('characters-list-ds1.png');
  });

  test('DS2 characters list renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.characters-body')).toHaveScreenshot('characters-list-ds2.png');
  });

  test('DS3 characters list renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.characters-body')).toHaveScreenshot('characters-list-ds3.png');
  });
});
