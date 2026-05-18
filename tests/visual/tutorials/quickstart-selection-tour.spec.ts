import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [0, 1, 2];

test('QuickStart selection tour snapshots (steps 0-2)', async ({ page }) => {
  test.setTimeout(60000);

  await seedTestData(page);
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 999 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: false, skipped: true, lastStep: 0, quickStartCompleted: false },
    firstPlay: { completed: true, skipped: true },
  });

  await page.waitForSelector('[data-tutorial="quickstart-archetypes"]', { timeout: 15000 });

  for (const stepIndex of steps) {
    await startTourAt(page, 'quickStartSelection', stepIndex);
    await waitForTooltip(page);
    // Clip excludes the Joyride overlay phantom that absolute-positions
    // below the visible content; also avoids the per-iteration overlay
    // stacking that doubled the doc height each step. See PR #1233.
    await expect(page).toHaveScreenshot(`tutorial-quickstart-selection-step${zeroPad(stepIndex)}.png`, {
      clip: { x: 0, y: 0, width: 1280, height: 1080 },
    });
  }
});
