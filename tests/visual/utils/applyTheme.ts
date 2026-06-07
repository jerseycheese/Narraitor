import type { Page } from '@playwright/test';

export type ThemeId = 'ds1' | 'ds2' | 'ds3';

/**
 * Switch the active design system in a visual spec, deterministically.
 *
 * The theme control moved out of inline DS1/DS2/DS3 radios and into the
 * Appearance menu (a closed dropdown), so the old "click the radio" approach no
 * longer works. Instead seed the `narraitor-theme` key the ThemeProvider reads
 * on mount.
 *
 * seedTestData registers an addInitScript that calls `localStorage.clear()` on
 * every navigation, so we register OUR init script after it (in the test body)
 * and reload — init scripts run in registration order, so the theme is written
 * after the clear and survives. Mirrors the seeding in about-page.spec /
 * mobile-overflow.spec; the rendered output is identical to clicking, so the
 * committed baselines are unchanged.
 */
export async function applyTheme(page: Page, themeId: ThemeId): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('narraitor-theme', t);
  }, themeId);
  await page.reload();
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    themeId
  );
}
