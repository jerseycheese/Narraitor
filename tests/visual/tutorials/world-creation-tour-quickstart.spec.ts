import { test, expect } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import { mockApiEndpoints } from '../utils/mockApi';
import { waitForStoreReady, setTutorialProgress, startTourAt, stopTour, waitForTooltip, getVisibleTutorialClip, hideTourOverlay, zeroPad } from '../utils/tutorial-helpers';

const steps = [24, 25, 26, 27];

test('World creation tour: Quick Start (tour steps 24-27)', async ({ page }) => {
  test.setTimeout(180000);

  await seedTestData(page);
  await mockApiEndpoints(page);
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
  await page.locator('.component-wizard-container').getByRole('button', { name: 'Next' }).click();
  await page.waitForSelector('[data-testid="processing-overlay"]', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await waitForContentStable(page);

  // Next on step 2 (AttributeReviewStep)
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
  await page.locator('.component-wizard-container').getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  // Next on step 3 (SkillReviewStep)
  // Add a minimal custom skill and advance
  const addCustomSkillBtn = page.locator('button:has-text("Add Custom Skill")');
  if (await addCustomSkillBtn.count() > 0) {
    await addCustomSkillBtn.click();
    await page.waitForTimeout(300);
    const skillNameInput = page.getByRole('textbox', { name: /skill name/i }).first();
    if (await skillNameInput.count() > 0) {
      await skillNameInput.fill('Test Skill');
      await page.waitForTimeout(150);
      const descriptionInput = page.locator('textarea[placeholder*="Describe what this skill represents"]');
      if (await descriptionInput.count() > 0) {
        await descriptionInput.fill('A test skill for visual regression testing.');
        await page.waitForTimeout(150);
      }
      const testAttributeCheckbox = page.getByTestId('custom-skill-editor').getByRole('checkbox', { name: 'Test Attribute' });
      if (await testAttributeCheckbox.count() > 0) {
        await testAttributeCheckbox.check();
        await page.waitForTimeout(150);
      }
      const createSkillBtn = page.getByRole('button', { name: /create skill/i });
      if (await createSkillBtn.count() > 0) {
        await createSkillBtn.click();
        await page.waitForTimeout(300);
      }
    }
  }
  await page.locator('.component-wizard-container').getByRole('button', { name: 'Next' }).click();
  await waitForContentStable(page);

  // Create World on step 4 (FinalizeStep)
  const createWorldButton = page.getByRole('button', { name: 'Create World' });
  await expect(createWorldButton).toBeVisible({ timeout: 15000 });
  await createWorldButton.click();
  await waitForContentStable(page);

  // Now on QuickStartStep (step 5)
  await page.waitForSelector('[data-tutorial="quickstart-archetypes"]', { timeout: 15000 });

  // The three quickstart archetype cards are seeded off the freshly-created
  // world's random UUID, so their names/stats/personality differ every run and
  // can't be pinned without seeding crypto.randomUUID app-wide. Two things make
  // the capture deterministic: pin the card height so variable-length text
  // doesn't reflow the buttons below them, and mask the card content itself so
  // the comparison covers the stable tour tooltip, headings, and action buttons.
  await page.addStyleTag({
    content: `[data-testid="archetype-card"] { height: 360px !important; overflow: hidden !important; }`,
  });
  const archetypeCards = page.locator('[data-testid="archetype-card"]');

  for (const stepIndex of steps) {
    await startTourAt(page, 'worldCreation', stepIndex);
    await waitForTooltip(page);
    await hideTourOverlay(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(`tutorial-world-creation-quickstart-${zeroPad(stepIndex)}.png`, {
      clip,
      mask: [archetypeCards],
    });
  }
});
