import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { waitForStoreReady, setTutorialProgress, startTourAt, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [19, 20, 21, 22];

test('World creation tour step 4 snapshots (steps 19-22)', async ({ page }) => {
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
  
  // Wait for processing overlay
  await page.waitForSelector('[data-testid="processing-overlay"]', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await waitForContentStable(page);

  // Now on step 3 (AttributeReviewStep).
  // Add a minimal custom attribute to satisfy requirement and advance
  const addCustomAttributeBtn = page.locator('[data-testid="add-custom-attribute-button"]');
  if (await addCustomAttributeBtn.count() > 0) {
    await addCustomAttributeBtn.click();
    await page.waitForTimeout(300);
    const attributeNameInput = page.getByRole('textbox', { name: 'Attribute Name *' });
    if (await attributeNameInput.count() > 0) {
      await attributeNameInput.fill('Test Attribute');
      await page.waitForTimeout(150);
      const createAttributeBtn = page.getByRole('button', { name: 'Create Attribute' });
      if (await createAttributeBtn.count() > 0) {
        await createAttributeBtn.click();
        await page.waitForTimeout(300);
      }
    }
  }
  
  await page.getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-step${zeroPad(stepIndex)}.png`, { clip });
  }
});
