import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [23, 24, 25, 26, 27];

test('World creation tour step 5 snapshots (steps 23-27)', async ({ page }) => {
  test.setTimeout(120000);

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

  await page.locator('[data-tutorial="genre-picker"]').selectOption('Cyberpunk');
  await page.locator('[data-tutorial="world-name"]').fill('Test World');
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  await page.locator('[data-tutorial="world-description"]').fill('A neon-lit cyberpunk world where megacorporations rule the streets and hackers fight for survival in the digital shadows. The air is thick with smog and the glow of holographic advertisements.');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForSelector('[data-testid="processing-overlay"]', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await waitForContentStable(page);

  // Next on step 3 (AttributeReviewStep)
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  // Next on step 4 (SkillReviewStep)
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-step${zeroPad(stepIndex)}.png`, { fullPage: true });
  }
});
