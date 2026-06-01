import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Generate-world modal — per-theme coverage (#1264).
 *
 * All-DS companion to worlds-generate-modal.spec.ts, which captures the modal's
 * default/inspired/set-within content states in a single theme. This spec proves
 * the modal surface itself renders in DS1/DS2/DS3 (the dialog is a Radix portal,
 * which themes off the `data-theme` attribute on <html>, so the page switcher
 * carries through to the portal). One representative state (default) per theme is
 * enough for theme differentiation; the content-state matrix stays in the base spec.
 *
 * /worlds renders the DS switcher, so theme is set via the radio (settleTheme),
 * matching worlds-themes.spec.ts. The theme is switched BEFORE opening the modal —
 * once the dialog is open its backdrop covers the page radios.
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
}

async function openModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate World' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('Generate-world modal theme differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
  });

  test('DS1 generate-world modal renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('worlds-generate-modal-ds1.png');
  });

  test('DS2 generate-world modal renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('worlds-generate-modal-ds2.png');
  });

  test('DS3 generate-world modal renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await openModal(page);
    await expect(page.getByRole('dialog')).toHaveScreenshot('worlds-generate-modal-ds3.png');
  });
});
