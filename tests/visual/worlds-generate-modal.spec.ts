import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

test.describe('Worlds Generate Modal - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
  });

  test('default state', async ({ page }) => {
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await page.getByRole('button', { name: 'Generate World' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('worlds-generate-modal-default.png');
  });

  test('Inspired By state', async ({ page }) => {
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await page.getByRole('button', { name: 'Generate World' }).click();
    const inspiredOption = page.locator('label', { hasText: 'Inspired By' }).first();
    await inspiredOption.click();
    await waitForContentStable(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveScreenshot('worlds-generate-modal-inspired.png');
  });

  test('Set Within state', async ({ page }) => {
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await page.getByRole('button', { name: 'Generate World' }).click();
    const setWithinOption = page.locator('label', { hasText: 'Set Within' }).first();
    await setWithinOption.click();
    await waitForContentStable(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveScreenshot('worlds-generate-modal-set-within.png');
  });
});
