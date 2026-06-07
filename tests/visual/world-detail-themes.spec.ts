import { test, expect, type Page } from '@playwright/test';
import { applyTheme } from './utils/applyTheme';
import { waitForContentStable, hideDynamicContent, expandAllCollapsibleSections, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * World detail + edit — per-theme structural differentiation (#1224).
 *
 * Captures /worlds/[id] and /worlds/[id]/edit at DS1 / DS2 / DS3. The
 * detail body and section grid restructure per theme:
 *   DS1 manuscript spread (margin rail), DS2 module stack (2-col),
 *   DS3 dense readout (3-col with corner brackets).
 */

const WORLD_ID = 'world-cyberpunk-2077';

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

async function gotoDetail(page: Page, route: string, anchor: string): Promise<void> {
  await seedTestData(page);
  await page.goto(route);
  await page.waitForFunction(
    () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
    { timeout: 15000 }
  );
  await page.reload();
  await waitForContentStable(page);
  await page.waitForSelector(anchor, { timeout: 8000 });
}

test.describe('World detail theme differentiation', () => {
  test('DS1 world detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}`, '.world-detail-body');
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.world-detail-body')).toHaveScreenshot('world-detail-ds1.png');
  });

  test('DS2 world detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}`, '.world-detail-body');
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.world-detail-body')).toHaveScreenshot('world-detail-ds2.png');
  });

  test('DS3 world detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}`, '.world-detail-body');
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.world-detail-body')).toHaveScreenshot('world-detail-ds3.png');
  });
});

test.describe('World edit theme differentiation', () => {
  test('DS1 world edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}/edit`, '.component-world-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-world-editor')).toHaveScreenshot('world-edit-ds1.png');
  });

  test('DS2 world edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}/edit`, '.component-world-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-world-editor')).toHaveScreenshot('world-edit-ds2.png');
  });

  test('DS3 world edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/worlds/${WORLD_ID}/edit`, '.component-world-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-world-editor')).toHaveScreenshot('world-edit-ds3.png');
  });
});
