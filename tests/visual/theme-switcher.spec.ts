import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { applyTheme } from './utils/applyTheme';

/**
 * Theme Switcher Visual Regression Tests
 *
 * The design-system skins and color-mode toggle now live inside the Appearance
 * menu (a palette-icon dropdown) rather than inline DS1/DS2/DS3 radios. These
 * tests verify the menu exposes both controls and that each theme / dark mode
 * renders correctly on the home page.
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original rationale.
 */

test.describe('Theme Switcher', () => {
  test('DS1 default renders correctly on home page', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');

    await expect(page).toHaveScreenshot('theme-ds1-home.png', {
      fullPage: true,
    });
  });

  test('Appearance menu exposes theme and color mode', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    const appearance = page.getByRole('button', { name: 'Appearance' });
    await expect(appearance).toBeVisible();

    await appearance.click();
    // Skins and the color-scheme toggle both live inside the one menu now.
    await expect(page.getByText('Warm Earth')).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Color scheme' })
    ).toBeVisible();
  });

  test('Switch to DS2 changes visual appearance', async ({ page }) => {
    await page.goto('/');
    await applyTheme(page, 'ds2');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page).toHaveScreenshot('theme-ds2-home.png', {
      fullPage: true,
    });
  });

  test('Switch to DS3 changes visual appearance', async ({ page }) => {
    await page.goto('/');
    await applyTheme(page, 'ds3');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page).toHaveScreenshot('theme-ds3-home.png', {
      fullPage: true,
    });
  });

  test('Dark mode renders within DS1', async ({ page }) => {
    // Seed the color scheme before load; ThemeProvider reads it on mount.
    await page.addInitScript(() =>
      localStorage.setItem('narraitor-color-scheme', 'dark')
    );
    await page.goto('/');
    await page.waitForFunction(() =>
      document.documentElement.classList.contains('dark')
    );
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page).toHaveScreenshot('theme-ds1-dark-home.png', {
      fullPage: true,
    });
  });

  test('Theme selected from the menu persists across navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForContentStable(page);

    // Select Warm Earth (ds2) through the real Appearance menu.
    await page.getByRole('button', { name: 'Appearance' }).click();
    await page.getByRole('menuitemradio', { name: /Warm Earth/ }).click();
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-theme') === 'ds2'
    );

    await page.goto('/worlds');
    await waitForContentStable(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
  });
});
