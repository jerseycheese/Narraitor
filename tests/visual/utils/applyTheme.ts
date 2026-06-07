import type { Page } from '@playwright/test';

export type ThemeId = 'ds1' | 'ds2' | 'ds3';

/**
 * Switch the active design system in a visual spec, in place.
 *
 * The theme control moved out of inline DS1/DS2/DS3 radios and into the
 * Appearance menu, so the old "click the radio" approach no longer works. We
 * replicate what the radio click did — flip the design system without a reload
 * — by setting `data-theme` directly (the attribute ThemeProvider's effect
 * writes) plus the `narraitor-theme` key it reads on mount.
 *
 * NB: this must NOT reload. A reload re-races store hydration against
 * seedTestData's IndexedDB writes, so data-dependent routes (e.g. the character
 * editor) come back empty and the snapshot height collapses. Setting the
 * attribute in place keeps the already-rendered, seeded page intact.
 */
export async function applyTheme(page: Page, themeId: ThemeId): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem('narraitor-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, themeId);
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    themeId
  );
}
