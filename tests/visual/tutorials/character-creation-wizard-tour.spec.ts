import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { waitForStoreReady, setTutorialProgress, startTourAt, stopTour, waitForTooltip, zeroPad } from '../utils/tutorial-helpers';

const steps = [0, 1, 2, 3, 4, 5];

test('Character creation wizard tour snapshots (steps 0-5)', async ({ page }) => {
  test.setTimeout(180000);

  await seedTestData(page);
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 999 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: false, skipped: true, lastStep: 0, quickStartCompleted: true },
    firstPlay: { completed: true, skipped: true },
  });

  const customizeButton = page.getByRole('button', { name: 'Create Custom Character' });
  await expect(customizeButton).toBeVisible({ timeout: 15000 });
  await customizeButton.click();
  await waitForContentStable(page);

  const wizardNext = page.locator('button:not([data-test-id]):has-text("Next")');

  for (const stepIndex of steps) {
    // Stop tour before moving wizard to avoid overlay interception
    await stopTour(page);

    if (stepIndex === 1) {
      // Step 0 -> Step 1 (Basic Info)
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 2) {
      // Step 1 -> Step 2 (Attributes)
      const nameInput = page.locator('input[placeholder*="Enter character name"]');
      await expect(nameInput).toBeVisible({ timeout: 15000 });
      await nameInput.fill('Test Character');
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 3) {
      // Step 2 -> Step 3 (Skills)
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 4) {
      // Step 3 -> Step 4 (Background)
      // Skill selection is required (at least 1)
      const skillToggle = page.locator('button:has-text("Excluded"), button:has-text("Not Selected")').first();
      await expect(skillToggle).toBeVisible({ timeout: 15000 });
      await skillToggle.click();
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 5) {
      // Step 4 -> Step 5 (Portrait)
      // Background history (50+) and personality (20+) are required
      const historyTextarea = page.locator('textarea[placeholder*="history"]');
      const personalityTextarea = page.locator('textarea[placeholder*="personality"]');
      await expect(historyTextarea).toBeVisible({ timeout: 15000 });
      await historyTextarea.fill('This is a long history of the test character. They grew up in the neon streets of the cyberpunk city, learning how to survive by their wits and quick reflexes.');
      await personalityTextarea.fill('Strong-willed and determined to succeed.');
      await wizardNext.click();
      await waitForContentStable(page);
    }

    await startTourAt(page, 'characterCreationWizard', stepIndex);
    await waitForTooltip(page);
    await expect(page).toHaveScreenshot(`tutorial-character-creation-step${zeroPad(stepIndex)}.png`, { fullPage: true });
  }
});