import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';

/**
 * Design-system component showcase visual regression (issue #1276).
 *
 * The ds{1,2,3} component sections now render the real `@/components/ui/*`
 * primitives via the shared ComponentShowcase. These tests capture the
 * showcase container per theme so a primitive change moves the showcase
 * baseline (and surfaces drift) instead of slipping past a hand-built
 * look-alike.
 *
 * A locator screenshot (not fullPage) is used deliberately — it bounds the
 * capture to the showcase and stays stable between a local Mac and the CI
 * macOS runner.
 */

const VARIANTS = [
  { id: 'ds1', path: '/dev/design-system' },
  { id: 'ds2', path: '/dev/design-system/2' },
  { id: 'ds3', path: '/dev/design-system/3' },
] as const;

test.describe('Design system component showcase', () => {
  for (const { id, path } of VARIANTS) {
    test(`${id} renders the real ui primitives`, async ({ page }) => {
      await page.goto(path);
      await waitForContentStable(page);

      // Hide the fixed page chrome (variant toggle, section nav, theme
      // toggle) so it doesn't bleed over the showcase in the locator capture.
      await page.addStyleTag({
        content:
          '.ds-toggle, .ds1-nav, .ds2-nav, .ds3-nav, .ds1-theme-toggle, .ds2-theme-toggle, .ds3-theme-toggle { display: none !important; }',
      });

      const showcase = page.getByTestId('ds-components');
      await showcase.scrollIntoViewIfNeeded();
      await expect(showcase).toBeVisible();

      // Sanity-check that the real primitives (not look-alikes) are mounted.
      await expect(showcase.locator('.button').first()).toBeVisible();
      await expect(showcase.locator('.badge').first()).toBeVisible();
      await expect(showcase.locator('.alert').first()).toBeVisible();

      await expect(showcase).toHaveScreenshot(`ds-components-${id}.png`);
    });
  }
});
