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
 */

async function switchTheme(
  page: Page,
  theme: 'ds2' | 'ds3',
  label: 'DS2' | 'DS3'
): Promise<void> {
  await page.getByRole('radio', { name: label }).click();
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    theme
  );
  await waitForContentStable(page);
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
    await hideDynamicContent(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page).toHaveScreenshot('dashboard-ds1.png', { fullPage: true });
  });

  test('DS2 dashboard renders consistently', async ({ page }) => {
    await switchTheme(page, 'ds2', 'DS2');
    await hideDynamicContent(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page).toHaveScreenshot('dashboard-ds2.png', { fullPage: true });
  });

  test('DS3 dashboard renders consistently', async ({ page }) => {
    await switchTheme(page, 'ds3', 'DS3');
    await hideDynamicContent(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page).toHaveScreenshot('dashboard-ds3.png', { fullPage: true });
  });
});
