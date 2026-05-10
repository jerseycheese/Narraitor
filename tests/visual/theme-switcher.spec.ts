import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';

/**
 * Theme Switcher Visual Regression Tests
 *
 * Tests that the design system switcher and dark mode toggle
 * work correctly across theme combinations.
 */

test.describe('Theme Switcher', () => {
  test('DS1 default renders correctly on home page', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    // Verify DS1 is the default
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');

    await expect(page).toHaveScreenshot('theme-ds1-home.png', { fullPage: true });
  });

  test('Theme switcher visible in header nav', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    const themeSwitcher = page.getByRole('radiogroup', { name: 'Design system theme' });
    await expect(themeSwitcher).toBeVisible();

    const darkModeToggle = page.getByRole('radiogroup', { name: 'Color scheme' });
    await expect(darkModeToggle).toBeVisible();
  });

  test('Switch to DS2 changes visual appearance', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    // Click DS2 button
    await page.getByRole('radio', { name: 'DS2' }).click();
    await page.waitForFunction(() =>
      document.documentElement.getAttribute('data-theme') === 'ds2'
    );
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page).toHaveScreenshot('theme-ds2-home.png', { fullPage: true });
  });

  test('Switch to DS3 changes visual appearance', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    // Click DS3 button
    await page.getByRole('radio', { name: 'DS3' }).click();
    await page.waitForFunction(() =>
      document.documentElement.getAttribute('data-theme') === 'ds3'
    );
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page).toHaveScreenshot('theme-ds3-home.png', { fullPage: true });
  });

  test('Dark mode toggle works within DS1', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    // Click dark mode button
    await page.getByRole('radio', { name: 'Dark' }).click();
    await page.waitForFunction(() =>
      document.documentElement.classList.contains('dark')
    );
    await waitForContentStable(page);
    await hideDynamicContent(page);

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page).toHaveScreenshot('theme-ds1-dark-home.png', { fullPage: true });
  });

  test('Theme persists across page navigation', async ({ page }) => {
    await page.goto('/');
    await waitForContentStable(page);

    // Switch to DS2
    await page.getByRole('radio', { name: 'DS2' }).click();
    await page.waitForFunction(() =>
      document.documentElement.getAttribute('data-theme') === 'ds2'
    );

    // Navigate to worlds page
    await page.goto('/worlds');
    await waitForContentStable(page);

    // Verify DS2 persisted
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
  });
});
