import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [4, 5, 6, 7, 8, 9, 10, 11];

// Skipped pending #1198 — tour overlay/spotlight state is non-deterministic at
// capture time (height swings between 1669px and 13352px between retries).
test.skip('World creation tour step 1 snapshots (steps 4-11)', async ({ page }) => {
  test.setTimeout(90000);

  await seedTestData(page);
  await page.goto('/worlds/create');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: false, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: true, skipped: true },
  });

  const createOwnButton = page.locator('[data-tutorial="create-own-world-btn"]');
  await expect(createOwnButton).toBeVisible({ timeout: 15000 });
  await createOwnButton.click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-step${zeroPad(stepIndex)}.png`, { fullPage: true });
  }
});
