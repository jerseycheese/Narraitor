import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';

/**
 * Design System Page Visual Regression Tests
 *
 * Tests the /dev/design-system page for visual consistency.
 * Covers light mode, dark mode, and navigation dropdown states.
 */

test.describe('Design System Page Visual Tests', () => {
  test('Design system page should render consistently (light mode)', async ({ page }) => {
    await page.goto('/dev/design-system');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    // Verify newly ported sections are present in the document
    await expect(page.locator('#philosophy')).toHaveCount(1);
    await expect(page.locator('#radius')).toHaveCount(1);
    await expect(page.locator('#elevation')).toHaveCount(1);
    await expect(page.locator('#icons')).toHaveCount(1);
    await expect(page.locator('#grid')).toHaveCount(1);

    // Verify page loaded
    await expect(page.locator('h2').first()).toContainText('Color Palette');

    // Take full page screenshot - light mode
    await expect(page).toHaveScreenshot('design-system-light.png', { fullPage: true });
  });

  test('Design system page should render consistently (dark mode)', async ({ page }) => {
    await page.goto('/dev/design-system');
    await waitForContentStable(page);

    // Click theme toggle to switch to dark mode
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();

    // Wait for theme to apply
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    await waitForContentStable(page);
    await hideDynamicContent(page);

    // Take full page screenshot - dark mode
    await expect(page).toHaveScreenshot('design-system-dark.png', { fullPage: true });
  });

  test('Design system navigation dropdown should render consistently', async ({ page }) => {
    await page.goto('/dev/design-system');
    await waitForContentStable(page);

    // Open navigation dropdown
    await page.getByRole('button', { name: 'Navigation menu' }).click();

    // Wait for dropdown animation
    await page.waitForTimeout(350);
    await hideDynamicContent(page);

    // Take screenshot with dropdown open
    await expect(page).toHaveScreenshot('design-system-nav-open.png', { fullPage: true });
  });

  test('Design system sections should be accessible via navigation', async ({ page }) => {
    await page.goto('/dev/design-system');
    await waitForContentStable(page);

    // Open navigation and click on Grid & Breakpoints
    await page.getByRole('button', { name: 'Navigation menu' }).click();
    await page.waitForTimeout(350);
    await page.getByRole('link', { name: 'GRID & BREAKPOINTS' }).click();

    // Verify navigation worked - Grid section should be visible
    await expect(page.locator('#grid')).toBeInViewport();
  });
});
