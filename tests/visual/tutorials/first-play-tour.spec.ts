import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [0, 1, 2, 3, 4, 5, 6];

test('First Play tour snapshots (steps 0-6)', async ({ page }) => {
  test.setTimeout(180000);

  // Disable smooth scrolling and animations for visual stability
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        scroll-behavior: auto !important;
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  });

  await seedTestData(page);
  await mockApiEndpoints(page);
  
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.goto('/worlds/world-cyberpunk-2077/play');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 999 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: false, skipped: true, lastStep: 0 },
  });

  await page.waitForSelector('[data-tutorial="narrative-display"]', { timeout: 30000 });
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'firstPlay', stepIndex);
    await waitForTooltip(page);
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot(`tutorial-first-play-step${zeroPad(stepIndex)}.png`, { 
      animations: 'disabled',
      threshold: 0.2
    });
  }
});
