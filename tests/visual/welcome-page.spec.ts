import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell, waitForImagesLoaded } from './utils/wait-helpers';

/**
 * Welcome / landing page — per-theme structural differentiation.
 *
 * Fills a previously-uncovered surface (visual-regression coverage audit): the
 * landing page restructures per design system via `[data-theme="dsN"]
 * .component-landing*` overrides in src/app/landing.css. Mirrors
 * about-page.spec.ts: seed the `narraitor-theme` localStorage key before
 * navigation (deterministic) rather than racing the global theme-switcher radio
 * under CI load. Images are awaited because the hero carries a visual.
 */

const THEME_STORAGE_KEY = 'narraitor-theme';

async function gotoWelcomeWithTheme(page: Page, themeId: 'ds1' | 'ds2' | 'ds3'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [THEME_STORAGE_KEY, themeId] as const
  );
  await page.goto('/welcome');
  await page.waitForSelector('.component-landing', { timeout: 8000 });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    themeId
  );
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Welcome page theme differentiation', () => {
  test('DS1 welcome renders consistently', async ({ page }) => {
    await gotoWelcomeWithTheme(page, 'ds1');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-landing')).toHaveScreenshot('welcome-ds1.png');
  });

  test('DS2 welcome renders consistently', async ({ page }) => {
    await gotoWelcomeWithTheme(page, 'ds2');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-landing')).toHaveScreenshot('welcome-ds2.png');
  });

  test('DS3 welcome renders consistently', async ({ page }) => {
    await gotoWelcomeWithTheme(page, 'ds3');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-landing')).toHaveScreenshot('welcome-ds3.png');
  });
});
