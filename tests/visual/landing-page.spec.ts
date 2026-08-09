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
    // #main-content holds the screenshot (see file banner for why), but
    // .component-landing is the locator #1383 asked this spec to exercise —
    // assert it directly too, rather than only through its ancestor.
    await expect(page.locator('.component-landing')).toBeVisible();
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

  // The accent mark under the selected plate is one rule that travels, so its
  // resting position is computed from a column width and a gap rather than
  // drawn on the element it belongs to. Geometry is the only thing that proves
  // it landed: the CSS can be present and correct-looking while the mark sits
  // under the wrong world. Screenshots can't catch it either, since a mark
  // under plate 2 and a mark under plate 3 are both just a blue bar.
  test('the selected plate mark lands on the plate it belongs to', async ({
    page,
  }) => {
    await gotoLanding(page);

    for (const world of [
      'port-city',
      'survey-ship',
      'normandy',
      'debt-court',
    ]) {
      await page.locator(`label[for="landing-world-${world}"]`).click();

      // The mark is a pseudo-element, so it has no box to measure and its
      // translate computes to a literal calc() string. A probe of the same
      // width carrying the same translate makes the browser resolve that calc
      // into a real position, which is the thing worth asserting.
      const measured = await page.evaluate(() => {
        const plates = document.querySelector('.component-landing-plates');
        if (!plates) throw new Error('plate strip missing');

        const mark = getComputedStyle(plates, '::after');
        const probe = document.createElement('div');
        probe.style.position = 'absolute';
        probe.style.insetInlineStart = '0';
        probe.style.insetBlockEnd = '0';
        probe.style.blockSize = '1px';
        probe.style.inlineSize = mark.inlineSize;
        probe.style.translate = mark.translate;
        plates.appendChild(probe);

        const stripLeft = plates.getBoundingClientRect().left;
        const probeBox = probe.getBoundingClientRect();
        const result = {
          markLeft: probeBox.left - stripLeft,
          markWidth: probeBox.width,
          selectedLabelLeft: 0,
          selectedLabelWidth: 0,
        };

        const selectedLabel = plates.querySelector(
          '.component-landing-plate-input:checked + .component-landing-plate-label'
        );
        if (!selectedLabel) throw new Error('no plate is selected');
        const labelBox = selectedLabel.getBoundingClientRect();
        result.selectedLabelLeft = labelBox.left - stripLeft;
        result.selectedLabelWidth = labelBox.width;

        probe.remove();
        return result;
      });

      expect(measured.markWidth).toBeCloseTo(measured.selectedLabelWidth, 0);
      expect(measured.markLeft).toBeCloseTo(measured.selectedLabelLeft, 0);
    }
  });
});
