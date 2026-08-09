import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Generate-character modal content states — single-theme (default DS1).
 *
 * Character-side companion to worlds-generate-modal.spec.ts (#1434). Covers the
 * modal's content states: default (generation-type options) and the "specific"
 * state, which reveals the character-name field. The modal surface across
 * DS1/DS2/DS3 is covered by tests/visual/characters-generate-modal-themes.spec.ts.
 */

const WORLD_QUERY = '/characters?worldId=world-cyberpunk-2077';
const RANDOM_DEFAULT_RADIO_MAX_DIFF_PIXELS = 400;

test.describe('Characters Generate Modal - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto(WORLD_QUERY);
    await page.waitForFunction(
      () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
      { timeout: 15000 }
    );
    await page.reload();
    await waitForContentStable(page);
    await hideDynamicContent(page);
  });

  test('default state', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Character' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // The characters page picks the initial generation type at random between
    // "known" and "original", so which radio reads as selected flips run to
    // run. Measured floor across three runs: 114 pixels, the two radio dots.
    await expect(dialog).toHaveScreenshot('characters-generate-modal-default.png', {
      maxDiffPixels: RANDOM_DEFAULT_RADIO_MAX_DIFF_PIXELS,
    });
  });

  test('specific figure state', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Character' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.locator('label', { hasText: 'Specific Known Figure' }).first().click();
    await waitForContentStable(page);
    await expect(dialog).toHaveScreenshot('characters-generate-modal-specific.png');
  });
});
