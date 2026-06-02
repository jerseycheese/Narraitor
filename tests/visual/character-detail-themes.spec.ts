import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, expandAllCollapsibleSections, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Character detail + edit — per-theme structural differentiation (#1224).
 */

const CHARACTER_ID = 'char-cyberpunk-hacker';

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

test.describe('Character detail theme differentiation', () => {
  test('DS1 character detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}`, '.character-detail-body');
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.character-detail-body')).toHaveScreenshot('character-detail-ds1.png');
  });

  test('DS2 character detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}`, '.character-detail-body');
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.character-detail-body')).toHaveScreenshot('character-detail-ds2.png');
  });

  test('DS3 character detail renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}`, '.character-detail-body');
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.character-detail-body')).toHaveScreenshot('character-detail-ds3.png');
  });
});

test.describe('Character edit theme differentiation', () => {
  test('DS1 character edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}/edit`, '.component-character-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-character-editor')).toHaveScreenshot('character-edit-ds1.png');
  });

  test('DS2 character edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}/edit`, '.component-character-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-character-editor')).toHaveScreenshot('character-edit-ds2.png');
  });

  test('DS3 character edit renders consistently', async ({ page }) => {
    await gotoDetail(page, `/characters/${CHARACTER_ID}/edit`, '.component-character-editor');
    await expandAllCollapsibleSections(page);
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-character-editor')).toHaveScreenshot('character-edit-ds3.png');
  });
});
