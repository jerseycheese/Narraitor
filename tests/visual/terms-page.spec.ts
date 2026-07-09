import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, pinAppShell } from './utils/wait-helpers';

/**
 * Terms page — per-theme structural differentiation.
 *
 * Fills a previously-uncovered surface (visual-regression coverage audit): the
 * legal pages restructure per design system via `[data-theme="dsN"]
 * .component-legal*` overrides in src/app/legal.css, exactly as /about does, but
 * only /about had coverage. Mirrors about-page.spec.ts: seed the
 * `narraitor-theme` localStorage key before navigation (deterministic) rather
 * than racing the global theme-switcher radio under CI load.
 */

const THEME_STORAGE_KEY = 'narraitor-theme';

async function gotoTermsWithTheme(page: Page, themeId: 'ds1' | 'ds2' | 'ds3'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [THEME_STORAGE_KEY, themeId] as const
  );
  await page.goto('/terms');
  await page.waitForSelector('.component-legal', { timeout: 8000 });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    themeId
  );
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await pinAppShell(page);
}

test.describe('Terms page theme differentiation', () => {
  test('DS1 terms renders consistently', async ({ page }) => {
    await gotoTermsWithTheme(page, 'ds1');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds1');
    await expect(page.locator('.component-legal')).toHaveScreenshot('terms-ds1.png');
  });

  test('DS2 terms renders consistently', async ({ page }) => {
    await gotoTermsWithTheme(page, 'ds2');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds2');
    await expect(page.locator('.component-legal')).toHaveScreenshot('terms-ds2.png');
  });

  test('DS3 terms renders consistently', async ({ page }) => {
    await gotoTermsWithTheme(page, 'ds3');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('.component-legal')).toHaveScreenshot('terms-ds3.png');
  });
});
