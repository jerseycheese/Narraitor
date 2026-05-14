import { test, expect, type Page, type Locator } from '@playwright/test';
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
 * The screenshot is scoped to the dashboard element rather than the
 * full page: it keeps the async header/hero (logo, world-switcher
 * thumbnail) out of the comparison, and document.fonts.ready is awaited
 * because the Getting Started step rows take their height from the
 * active theme's font metrics — an unloaded web font shifts every row.
 */

async function prepareDashboard(
  page: Page,
  theme?: { id: 'ds2' | 'ds3'; label: 'DS2' | 'DS3' }
): Promise<Locator> {
  if (theme) {
    await page.getByRole('radio', { name: theme.label }).click();
    await page.waitForFunction(
      (t) => document.documentElement.getAttribute('data-theme') === t,
      theme.id
    );
  }
  await waitForContentStable(page);
  await hideDynamicContent(page);
  // Theme fonts differ per DS and drive step-row heights — wait for the
  // active theme's fonts to finish loading before comparing pixels.
  await page.evaluate(() => document.fonts.ready);
  return page.locator('.component-dashboard-home');
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
    const dashboard = await prepareDashboard(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(dashboard).toHaveScreenshot('dashboard-ds1.png');
  });

  test('DS2 dashboard renders consistently', async ({ page }) => {
    const dashboard = await prepareDashboard(page, { id: 'ds2', label: 'DS2' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(dashboard).toHaveScreenshot('dashboard-ds2.png');
  });

  test('DS3 dashboard renders consistently', async ({ page }) => {
    const dashboard = await prepareDashboard(page, { id: 'ds3', label: 'DS3' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(dashboard).toHaveScreenshot('dashboard-ds3.png');
  });
});
