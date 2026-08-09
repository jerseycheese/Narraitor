import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { gotoTutorialPage, waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

// Smoke-level coverage of the in-play (firstPlay) tour, which now has 4 steps:
// 0-1 (narrative-display, player-choices) and 2-3 (session-character, session-tools)
// anchored to the always-present Character/Tools HUD buttons. This spec snapshots
// steps 0-1; steps 2-3 are reliably targetable now, but their frame includes the live
// save-indicator timestamp, so adding screenshots there needs dynamic content masked
// first (follow-up). See #1239.
const steps = [0, 1];

test('First play tour snapshots (steps 0-1)', async ({ page }) => {
  test.setTimeout(120000);

  await seedTestData(page);
  await gotoTutorialPage(page, '/worlds/world-cyberpunk-2077/play');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  // completed:false + skipped:true matches the sibling tour specs: skipped suppresses
  // the play page's 500ms auto-start so it can't reset the manual loop, while startTourAt
  // drives the tour directly via the test hook.
  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: false, skipped: true, lastStep: 0 },
  });

  await page.waitForSelector('[data-tutorial="narrative-display"]', { timeout: 30000 });
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'firstPlay', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect.soft(page).toHaveScreenshot(`tutorial-first-play-step${zeroPad(stepIndex)}.png`, { clip });
  }
});
