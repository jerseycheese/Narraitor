import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

// Smoke-level coverage of the in-play (firstPlay) tour. The tour defines 7 steps,
// but only steps 0-1 target elements that are reliably present on the resting play
// surface (narrative-display, player-choices). Steps 2-6 point at elements behind the
// collapsed Tools menu / Character panel and conditionally-rendered Story/History
// sections, which aren't in the DOM at this viewport without driving those controls
// open — fragile to screenshot and out of scope for a smoke restore. See #1239.
const steps = [0, 1];

test('First play tour snapshots (steps 0-1)', async ({ page }) => {
  test.setTimeout(120000);

  await seedTestData(page);
  await page.goto('/worlds/world-cyberpunk-2077/play');
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
    await expect(page).toHaveScreenshot(`tutorial-first-play-step${zeroPad(stepIndex)}.png`, { clip });
  }
});
