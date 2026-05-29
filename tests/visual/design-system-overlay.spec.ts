import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';

/**
 * Design-system overlay showcase visual regression (issue #1276).
 *
 * The ds{1,2,3} overlay sections now render the real overlay compositions —
 * `SimpleModal` and `PreviewModal` — via the shared OverlayShowcase, instead
 * of a static token/class reference. These tests open each modal and capture
 * the portaled panel per theme so a change to the real modal moves the
 * showcase baseline (and surfaces drift) instead of slipping past a hand-built
 * look-alike.
 *
 * The panel is captured with a locator screenshot (not fullPage) so the
 * capture is bounded to the modal and stays stable between a local Mac and the
 * CI macOS runner. The DS pages force the global theme so the Radix portal
 * themes to the page.
 */

const VARIANTS = [
  { id: 'ds1', path: '/dev/design-system' },
  { id: 'ds2', path: '/dev/design-system/2' },
  { id: 'ds3', path: '/dev/design-system/3' },
] as const;

test.describe('Design system overlay showcase', () => {
  for (const { id, path } of VARIANTS) {
    test(`${id} renders the real overlay compositions`, async ({ page }) => {
      await page.goto(path);
      await waitForContentStable(page);

      const overlay = page.getByTestId('ds-overlay');
      await overlay.scrollIntoViewIfNeeded();
      await expect(overlay).toBeVisible();

      // SimpleModal — the app's standard modal wrapper.
      await overlay.getByRole('button', { name: 'Leave this scene?' }).click();
      const panel = page.locator('.dialog-content');
      await expect(panel).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Stay' })).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Leave' })).toBeVisible();
      await expect(panel).toHaveScreenshot(`ds-overlay-simplemodal-${id}.png`);

      // Dismiss and open the PreviewModal composition.
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();

      await overlay.getByRole('button', { name: 'Preview generated world' }).click();
      const preview = page.locator('.dialog-content');
      await expect(preview).toBeVisible();
      await expect(preview.getByText('Rain City Noir')).toBeVisible();
      await expect(preview.getByRole('button', { name: 'Use This World' })).toBeVisible();
    });
  }
});
