import { test, expect, type Page } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  pinAppShell,
  waitForImagesLoadedIn,
} from './utils/wait-helpers';

/**
 * Homepage rendering at the public root route. A fresh Playwright context has
 * no persisted app state, so / renders the Landing front door without
 * ReturningUserRedirect firing.
 *
 * Scoped to #main-content, NOT .component-landing. The hero, the selector and
 * the closing band bleed past the content column with a negative inline
 * margin, and a locator screenshot captures the element's bounding box, which
 * is the un-bled column width. Every band would come out sliced off at both
 * edges. #main-content is the nearest ancestor wide enough to hold them and
 * carries no padding of its own.
 *
 * waitForImagesLoadedIn rather than the global waitForImagesLoaded: the hero
 * stacks four plates and shows one, so three carry loading="lazy", and the
 * plate strip adds four more. The global helper only tests img.complete, which
 * stays false for a lazy image that has not fetched, so it times out, swallows
 * the error, and the screenshot catches the page mid-load.
 */

async function gotoLanding(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('.component-landing', { timeout: 8000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoadedIn(page, '.component-landing');
  await pinAppShell(page);
}

test.describe('Landing page rendering', () => {
  test('landing renders consistently at the root route', async ({ page }) => {
    await gotoLanding(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ds3');
    await expect(page.locator('#main-content')).toHaveScreenshot(
      'landing-ds3.png'
    );
  });

  test('landing renders consistently at 375px', async ({ page }) => {
    // Set before navigating so the layout is never built at the desktop width
    // and then reflowed into the narrow-width rules.
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoLanding(page);
    await expect(page.locator('#main-content')).toHaveScreenshot(
      'landing-ds3-mobile.png'
    );
  });

  // The switcher is the treatment's whole justification: the image is the
  // selected world and changes when you pick a different one, and if that
  // connection is not obvious the treatment has failed. A baseline of a
  // non-default world is what catches the :has() chain silently degrading to
  // "always shows port-city".
  test('selecting a second world swaps the hero and the pane', async ({
    page,
  }) => {
    await gotoLanding(page);

    // Click the label: the input is a 1px, pointer-events none control, so
    // clicking it directly needs force and lands on the label regardless.
    await page.locator('label[for="landing-world-normandy"]').click();
    await expect(page.locator('#landing-world-normandy')).toBeChecked();
    await expect(
      page.locator('.component-landing-pane[data-world="normandy"]')
    ).toBeVisible();

    await expect(page.locator('#main-content')).toHaveScreenshot(
      'landing-ds3-normandy.png'
    );
  });
});
