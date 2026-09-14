import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { gotoTutorialPage, waitForStoreReady, setTutorialProgress, startTourAt, stopTour, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [11, 12, 13, 14];

test('World creation tour: Review Attributes (tour steps 11-14)', async ({ page }) => {
  test.setTimeout(120000);

  await seedTestData(page);
  await mockApiEndpoints(page);
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

  await page.locator('[data-tutorial="genre-picker"]').selectOption('Cyberpunk');
  await page.locator('[data-tutorial="world-name"]').fill('Test World');
  await page.locator('.component-wizard-container').getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  await page.locator('[data-tutorial="world-description"]').fill('A neon-lit cyberpunk world where megacorporations rule the streets and hackers fight for survival in the digital shadows. The air is thick with smog and the glow of holographic advertisements.');
  
  // Wait for the Next button to be enabled (description length >= 50)
  const nextButton = page.locator('.component-wizard-container').getByRole('button', { name: 'Next' });
  await expect(nextButton).toBeEnabled({ timeout: 15000 });
  await nextButton.click();
  
  // Wait for AI analysis overlay to appear and then disappear
  await page.waitForSelector('[data-testid="processing-overlay"]', { state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForSelector('[data-testid="processing-overlay"]', { state: 'hidden', timeout: 30000 }).catch(() => {});
  
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-attributes-${zeroPad(stepIndex)}.png`, { clip });
  }
});
