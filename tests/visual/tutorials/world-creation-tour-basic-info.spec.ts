import { test, expect, Page } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { gotoTutorialPage, waitForStoreReady, setTutorialProgress, startTourAt, stopTour, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [0, 1, 2, 3, 4, 5, 6, 7];

// These worldCreation tour steps all live on the tall BasicInfoStep form. The
// reference + tone targets sit below the 1024px fold, so a `placement: 'top'`
// tooltip lands partly off-screen and waitForTooltip's in-viewport poll never
// settles. Scroll the active step's target to centre first (same approach as
// character-creation-wizard-tour.spec.ts) so the tooltip renders fully in view.
const stepTargets: Record<number, string> = {
  0: '[data-tutorial="world-name"]',
  1: '[data-tutorial="genre-picker"]',
  2: '[data-tutorial="world-type"]',
  3: '[data-tutorial="world-reference"]',
  4: '[data-tutorial="tone-content-rating"]',
  5: '[data-tutorial="tone-narrative-style"]',
  6: '[data-tutorial="tone-language-complexity"]',
  7: '[data-tutorial="tone-custom-instructions"]',
};

async function scrollStepTargetIntoView(page: Page, stepIndex: number): Promise<void> {
  const target = stepTargets[stepIndex];
  if (!target) return;
  await page.evaluate((selector) => {
    document.querySelector(selector)?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, target);
  await page.waitForTimeout(100);
}

test('World creation tour: Basic Information (tour steps 0-7)', async ({ page }) => {
  test.setTimeout(90000);

  await seedTestData(page);
  await gotoTutorialPage(page, '/worlds/create');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: false, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: true, skipped: true },
  });

  // The wizard arms a 500ms timer on mount to auto-start the worldCreation tour;
  // its Joyride tooltip 'Next'/'Continue' button otherwise collides with the
  // wizard's own controls during setup. Marking the phase skipped (above) keeps
  // shouldAutoStartTour false so it never re-arms; stop any tour started in the
  // race window, then drive it explicitly via startTourAt below.
  await page.waitForTimeout(600);
  await stopTour(page);

  // Tour step 3 targets [data-tutorial="world-reference"], which only renders
  // when a referenced world type is chosen ({worldData.relationship && ...} in
  // BasicInfoStep). Pick "Inspired By" so the target exists and its tooltip can
  // settle — otherwise waitForTooltip never resolves on a missing target.
  await page.locator('[data-testid="relationship-based-on-radio"]').check({ force: true });
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await scrollStepTargetIntoView(page, stepIndex);
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-basic-info-${zeroPad(stepIndex)}.png`, { clip });
  }
});
