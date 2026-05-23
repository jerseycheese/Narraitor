import { test, expect } from '@playwright/test';
import { hideNextDevOverlay, waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, zeroPad } from '../utils/tutorial-helpers';

test('Guided first-time experience snapshots (steps 0-2)', async ({ page }) => {
  test.setTimeout(60000);

  await seedTestData(page);
  await page.goto('/dev/guided-first-time-experience');
  await hideNextDevOverlay(page);
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: false, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: true, skipped: true },
  });

  // Step 0: Welcome
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(0)}.png`, {
    fullPage: false,
  });

  const nextButton = page.getByRole('button', { name: 'Next' });

  // Step 1: Concept
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(1)}.png`, {
    fullPage: false,
  });

  // Step 2: Details
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(2)}.png`, {
    fullPage: false,
  });
});
