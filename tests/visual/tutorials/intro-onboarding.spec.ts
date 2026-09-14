import { test, expect } from '@playwright/test';
import { hideNextDevOverlay, waitForContentStable } from '../utils/wait-helpers';
import { seedBaseData } from '../utils/seedTestData';
import { gotoTutorialPage, zeroPad } from '../utils/tutorial-helpers';

test('Guided first-time experience snapshots (steps 0-2)', async ({ page }) => {
  test.setTimeout(60000);

  await seedBaseData(page);
  // The guided first-time experience lives on the app home, which moved from
  // / to /dashboard when the landing page took over the root route (#1528).
  await gotoTutorialPage(page, '/dashboard');
  await hideNextDevOverlay(page);
  await waitForContentStable(page);
  // The onboarding UI mounts inside SSRClientOnly, so this heading can't exist
  // until the client chunks land and hydrate. seedBaseData sets no store flag,
  // so unlike its sibling specs this one has no waitForStoreReady to gate on —
  // the assertion itself has to carry the cold-compile budget (#1519). The 5s
  // default clears by ~120ms warm and fails outright once a chunk stalls.
  await expect(page.getByRole('heading', { name: 'First time?' })).toBeVisible({
    timeout: 30000,
  });
  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBe(true);
  // The "First time?" title renders in the italic Newsreader webfont
  // (--font-narrative, next/font with display: 'swap'). Without waiting for
  // the swap, an occasional slow font fetch (cold CI dev-server compile)
  // leaves the fallback-font glyphs painted at screenshot time, producing
  // thousands of pixels of diff — the same wait other specs already do
  // (e.g. world-creation.spec.ts, landing-page.spec.ts).
  await page.evaluate(() => document.fonts.ready);

  // Step 0: Welcome
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(0)}.png`, {
    fullPage: false,
  });

  const nextButton = page.getByRole('button', { name: 'Next' });

  // Step 1: Concept
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(1)}.png`, {
    fullPage: false,
  });

  // Step 2: Details
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(2)}.png`, {
    fullPage: false,
  });
});
