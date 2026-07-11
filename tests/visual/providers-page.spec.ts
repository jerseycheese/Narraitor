import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';

/**
 * Providers settings page — empty state (default DS1).
 *
 * Fills a previously-uncovered surface (visual-regression coverage audit):
 * /settings/providers had zero visual coverage. This captures the zero-config
 * empty state a first-time user sees — no provider store seeding required, so
 * the render is deterministic. A seeded/populated-list and all-DS companion are
 * follow-ups (the provider store is not exposed on window for test seeding).
 *
 * Scoped to `.component-providers-page` rather than fullPage to avoid the
 * sticky-shell artifact, matching the newer theme specs.
 */

const THEME_STORAGE_KEY = 'narraitor-theme';

async function gotoProviders(page: Page): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [THEME_STORAGE_KEY, 'ds1'] as const
  );
  await page.goto('/settings/providers');
  await page.waitForSelector('.component-providers-page', { timeout: 8000 });
  // Confirm the deterministic empty state (no providers configured) rather than
  // a stale populated list from a persisted store.
  await page.waitForSelector('.providers-empty', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Providers settings page', () => {
  test('empty state renders consistently', async ({ page }) => {
    await gotoProviders(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-providers-page')).toHaveScreenshot(
      'providers-empty-ds1.png'
    );
  });
});
