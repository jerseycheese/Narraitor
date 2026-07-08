import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { gotoTutorialPage, waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [0, 1, 2, 3];

test('World generation tour snapshots (steps 0-3)', async ({ page }) => {
  test.setTimeout(60000);

  await seedTestData(page);
  await gotoTutorialPage(page, '/worlds');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 0 },
    worldGeneration: { completed: false, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: true, skipped: true },
  });

  const generateButton = page.getByRole('button', { name: 'Generate World' });
  await expect(generateButton).toBeVisible({ timeout: 15000 });
  await generateButton.click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldGeneration', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-generation-step${zeroPad(stepIndex)}.png`, { clip });
  }
});
