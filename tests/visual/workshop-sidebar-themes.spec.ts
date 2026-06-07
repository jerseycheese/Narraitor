import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { applyTheme } from './utils/applyTheme';

/**
 * Workshop Sidebar Theme Differentiation Visual Tests
 *
 * Epic #1165 / #1232 require the workshop rail to read as a structurally
 * distinct design language per theme, not a recolor. The existing specs
 * only capture the rail incidentally in the default theme (main-pages,
 * world-creation, etc. screenshot full pages at DS1), so DS2 and DS3 had
 * no regression guard.
 *
 * These tests seed a populated workshop (multiple worlds, one active, with
 * characters) so the world switcher renders, navigate to /worlds, then
 * capture the `.workshop-sidebar` rail at DS1, DS2, and DS3. A regression
 * in the per-theme structural overrides (workshop.css) shows up as a diff
 * here. The rail element is captured directly rather than the full page so
 * the screenshot is focused on the rail and immune to main-content churn.
 *
 * document.fonts.ready is awaited before each screenshot because the theme
 * fonts differ per DS; pixel comparison needs the active theme's fonts
 * fully loaded.
 *
 * NOTE: the committed baselines are the CI runner's render, not a local
 * one. Text rows take their height from OS-rendered font metrics, which
 * differ between a dev machine and the CI macOS image, so a locally
 * generated baseline drifts against CI. To refresh these snapshots, take
 * the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally.
 */

const SIDEBAR = '.workshop-sidebar';

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
}

test.describe('Workshop Sidebar Theme Differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
    // The world switcher only renders once the worlds store has hydrated.
    await page.waitForSelector('.workshop-sidebar-worlds-section', { timeout: 8000 });
  });

  test('DS1 sidebar renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator(SIDEBAR)).toHaveScreenshot('workshop-sidebar-ds1.png');
  });

  test('DS2 sidebar renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator(SIDEBAR)).toHaveScreenshot('workshop-sidebar-ds2.png');
  });

  test('DS3 sidebar renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator(SIDEBAR)).toHaveScreenshot('workshop-sidebar-ds3.png');
  });
});
