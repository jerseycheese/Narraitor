import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedBarelyStartedData } from './utils/seedTestData';

/**
 * Dashboard Theme Differentiation Visual Tests
 *
 * Epic #1165 requires each DS theme to read as a structurally distinct
 * design language, not a recolor. The existing home-route visual specs
 * don't cover this: theme-switcher.spec.ts screenshots the first-time
 * experience (unseeded /), and main-pages.spec.ts seeds an active
 * session so the Getting Started step list never renders.
 *
 * These tests seed the barely-started dashboard state — one world, no
 * characters or sessions — so the Getting Started step checklist and
 * the section interiors are on screen, then capture the dashboard at
 * DS1, DS2, and DS3. A regression in the per-theme structural overrides
 * (dashboard.css) shows up as a diff here.
 *
 * document.fonts.ready is awaited before each screenshot because the
 * theme fonts differ per DS; pixel comparison needs the active theme's
 * fonts fully loaded.
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

test.describe('Dashboard Theme Differentiation', () => {
  test.beforeEach(async ({ page }) => {
    await seedBarelyStartedData(page);
    await page.goto('/');
    await waitForContentStable(page);
    // Confirm the dashboard rendered rather than the first-time experience
    await page.waitForSelector('.component-dashboard-getting-started', { timeout: 8000 });
  });

  test('DS1 dashboard renders consistently', async ({ page }) => {
    await settleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page).toHaveScreenshot('dashboard-ds1.png', { fullPage: true });
  });

  test('DS2 dashboard renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page).toHaveScreenshot('dashboard-ds2.png', { fullPage: true });
  });

  test('DS3 dashboard renders consistently', async ({ page }) => {
    await settleTheme(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page).toHaveScreenshot('dashboard-ds3.png', { fullPage: true });
  });
});
