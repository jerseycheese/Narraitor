import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [28, 29, 30, 31];

test('World creation tour quickstart snapshots (steps 28-31)', async ({ page }) => {
  test.setTimeout(180000);

  await seedTestData(page);
  await page.goto('/worlds/create');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: false, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0, quickStartCompleted: false },
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

  // Next on step 3
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  // Next on step 4
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  // Create World on step 5 (FinalizeStep)
  const createWorldButton = page.getByRole('button', { name: 'Create World' });
  await expect(createWorldButton).toBeVisible({ timeout: 15000 });
  await createWorldButton.click();
  await waitForContentStable(page);

  // Now on QuickStartStep (step 6)
  await page.waitForSelector('[data-tutorial="quickstart-archetypes"]', { timeout: 15000 });

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-step${zeroPad(stepIndex)}.png`, { fullPage: true });
  }
});
