import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Worlds list — per-theme structural differentiation (#1224 / epic #1165).
 *
 * Captures /worlds at DS1 (Folio), DS2 (Bento), DS3 (Console). A regression
 * in the per-theme grid/layout overrides in workshop.css surfaces as a diff
 * here. Locator-scoped screenshots target the worlds screen rather than the
 * full page, dodging the sticky-shell artifact (see captureWizardStep notes).
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
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Worlds list theme differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto('/worlds');
    await page.waitForFunction(
      () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
      { timeout: 15000 }
    );
    await page.reload();
    await waitForContentStable(page);
    await page.waitForSelector('.worlds-screen', { timeout: 8000 });
  });

  test('DS1 worlds list renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.worlds-screen')).toHaveScreenshot('worlds-list-ds1.png');
  });

  test('DS2 worlds list renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.worlds-screen')).toHaveScreenshot('worlds-list-ds2.png');
  });

  test('DS3 worlds list renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.worlds-screen')).toHaveScreenshot('worlds-list-ds3.png');
  });
});
