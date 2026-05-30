import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [12, 13, 14];

test('World creation tour step 2 snapshots (steps 12-14)', async ({ page }) => {
  test.setTimeout(90000);

  await seedTestData(page);
  await mockApiEndpoints(page);
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

  const genrePicker = page.locator('[data-tutorial="genre-picker"]');
  await expect(genrePicker).toBeVisible({ timeout: 15000 });
  await genrePicker.selectOption('Cyberpunk');

  const nameInput = page.locator('[data-tutorial="world-name"]');
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill('Test World');

  const nextButton = page.getByRole('button', { name: 'Next' });
  await expect(nextButton).toBeEnabled({ timeout: 15000 });
  await nextButton.click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-step${zeroPad(stepIndex)}.png`, { clip });
  }
});
