import { test, expect, type Page } from '@playwright/test';
import { applyTheme } from './utils/applyTheme';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Generate-character modal — per-theme coverage (#1434).
 *
 * All-DS companion to characters-generate-modal.spec.ts, which captures the
 * modal's content states in a single theme. This spec proves the modal surface
 * renders in DS1/DS2/DS3. The dialog is a Radix portal, which themes off the
 * `data-theme` attribute on <html>, so applyTheme carries through to the portal.
 * One representative state (default) per theme is enough for theme
 * differentiation; the content-state matrix stays in the base spec.
 */

const WORLD_QUERY = '/characters?worldId=world-cyberpunk-2077';

async function settleTheme(
  page: Page,
  theme?: { id: 'ds2' | 'ds3' }
): Promise<void> {
  if (theme) {
    await applyTheme(page, theme.id);
  }
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
}

async function openModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate Character' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('Generate-character modal theme differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto(WORLD_QUERY);
    await page.waitForFunction(
      () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
      { timeout: 15000 }
    );
    await page.reload();
    await waitForContentStable(page);
  });

  test('DS1 generate-character modal renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('characters-generate-modal-ds1.png');
  });

  test('DS2 generate-character modal renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('characters-generate-modal-ds2.png');
  });

  test('DS3 generate-character modal renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('characters-generate-modal-ds3.png');
  });
});
