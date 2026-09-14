import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { gotoTutorialPage, waitForStoreReady, setTutorialProgress, startTourAt, stopTour, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [8, 9, 10];

test('World creation tour: World Description (tour steps 8-10)', async ({ page }) => {
  test.setTimeout(90000);

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

  const genrePicker = page.locator('[data-tutorial="genre-picker"]');
  await expect(genrePicker).toBeVisible({ timeout: 15000 });
  await genrePicker.selectOption('Cyberpunk');

  const nameInput = page.locator('[data-tutorial="world-name"]');
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill('Test World');

  const nextButton = page.locator('.component-wizard-container').getByRole('button', { name: 'Next' });
  await expect(nextButton).toBeEnabled({ timeout: 15000 });
  await nextButton.click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-description-${zeroPad(stepIndex)}.png`, { clip });
  }
});
