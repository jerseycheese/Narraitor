import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * About page — per-theme structural differentiation (#1135).
 *
 * The active design system is the `data-theme` attribute on <html>, applied by
 * ThemeProvider from the `narraitor-theme` localStorage key on mount. We seed
 * that key before navigation (deterministic) rather than clicking the global
 * theme-switcher radio, which races against hydration under CI load. The
 * rendered output is identical either way, so the baselines are unchanged.
 */

const THEME_STORAGE_KEY = 'narraitor-theme';

async function gotoAboutWithTheme(page: Page, themeId: 'ds1' | 'ds2' | 'ds3'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [THEME_STORAGE_KEY, themeId] as const
  );
  await page.goto('/about');
  await page.waitForSelector('.component-about', { timeout: 8000 });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    themeId
  );
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('About page theme differentiation', () => {
  test('DS1 about renders consistently', async ({ page }) => {
    await gotoAboutWithTheme(page, 'ds1');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds1.png');
  });

  test('DS2 about renders consistently', async ({ page }) => {
    await gotoAboutWithTheme(page, 'ds2');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds2.png');
  });

  test('DS3 about renders consistently', async ({ page }) => {
    await gotoAboutWithTheme(page, 'ds3');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-about')).toHaveScreenshot('about-ds3.png');
  });
});
