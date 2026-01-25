import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * World Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through Steps 1–6,
 * taking screenshots at each stage to reduce flakiness and runtime.
 */

test('World creation wizard visual sequence (Steps 1–6)', async ({ page }) => {
  test.setTimeout(45000); // Extended timeout for complex wizard
  await seedTestData(page);
  await page.goto('/worlds');
  await waitForContentStable(page);

  await page.goto('/worlds/create');
  await waitForContentStable(page);
  const dismissTutorialOverlay = async () => {
    const overlay = page.locator('[data-test-id="overlay"]');
    if (await overlay.count() === 0) return;

    const skipButton = page.locator('[data-test-id="button-skip"]');
    if (await skipButton.count() > 0) {
      await skipButton.first().click({ force: true });
    } else {
      const primaryButton = page.locator('[data-test-id="button-primary"], [data-test-id="button-pause"]');
      if (await primaryButton.count() > 0) {
        await primaryButton.first().click({ force: true });
      }
    }

    await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
  };

  await test.step('Step 1: Template', async () => {
    await dismissTutorialOverlay();
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step1-template.png', { fullPage: true });
  });

  await test.step('Step 2: Basic Info', async () => {
    const westernTemplateCard = page.locator('[data-testid="template-card-western"]');
    if (await westernTemplateCard.count() > 0) {
      await westernTemplateCard.click();
      await page.waitForTimeout(300);
      const useTemplateButton = page.locator('button:has-text("Use Selected Template")');
      if (await useTemplateButton.count() > 0) {
        await useTemplateButton.click();
        await page.waitForTimeout(600);
      }
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step2-basic-info.png', { fullPage: true });
  });

  await test.step('Step 3: Description', async () => {
    const nameInput = page.locator('input[placeholder*="world name"], input[name="name"], input[placeholder*="Enter name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test World');
      await page.waitForTimeout(150);
    }
    const genreSelect = page.locator('[data-testid="world-genre-select"]');
    if (await genreSelect.count() > 0) {
      await genreSelect.selectOption('Fantasy');
      await page.waitForTimeout(150);
    }
    const briefDescTextarea = page.locator('[data-testid="world-description-textarea"]');
    if (await briefDescTextarea.count() > 0) {
      await briefDescTextarea.fill('A test world created for visual regression testing.');
      await page.waitForTimeout(150);
    }
    const nextButton = page
      .locator('.component-wizard-container')
      .getByRole('button', { name: 'Next' });
    if (await nextButton.count() > 0) {
      await dismissTutorialOverlay();
      await nextButton.click();
      await page.waitForTimeout(700);
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step3-description.png', { fullPage: true });
  });

  await test.step('Step 4: Attributes Review', async () => {
    // Fill description and proceed
    const descriptionInput = page.locator('textarea[placeholder*="description"], textarea[name="description"]');
    if (await descriptionInput.count() > 0) {
      await descriptionInput.fill('A test world created for visual regression testing.');
      await page.waitForTimeout(150);
    }
    const nextButton2 = page
      .locator('.component-wizard-container')
      .getByRole('button', { name: 'Next' });
    if (await nextButton2.count() > 0) {
      await dismissTutorialOverlay();
      await nextButton2.click();
      await page.waitForTimeout(700);
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step4-attributes.png', { fullPage: true });
  });

  await test.step('Step 5: Skills Review', async () => {
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
    const nextButton3 = page
      .locator('.component-wizard-container')
      .getByRole('button', { name: 'Next' });
    if (await nextButton3.count() > 0) {
      await dismissTutorialOverlay();
      await nextButton3.click();
      await page.waitForTimeout(700);
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step5-skills.png', { fullPage: true });
  });

  await test.step('Step 6: Finalize', async () => {
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
        const testAttributeCheckbox = page.locator('input[type="checkbox"]:near(:text("Test Attribute"))');
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
    const nextButton4 = page.locator('button:has-text("Next")');
    if (await nextButton4.count() > 0) {
      await nextButton4.click();
      await page.waitForTimeout(700);
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('world-creation-step6-finalize.png', { fullPage: true });
  });
});
