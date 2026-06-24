import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * World creation wizard — full sequential flow, single-theme (default DS1).
 *
 * DS coverage (#1264): all three design systems for the world wizard are covered
 * by the "World creation wizard steps render <DS> structure" tests in
 * tests/visual/wizard-themes.spec.ts. Tripling this full five-step flow would
 * duplicate that coverage at much higher runtime/flake cost.
 */

/** Capture a stable, full-page wizard screenshot with the app shell intact. */
const captureWizardStep = async (page: Page, name: string): Promise<void> => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForContentStable(page);
  await page.evaluate(() => document.fonts.ready);
  await hideDynamicContent(page);
  // Chromium's full-page screenshot mis-places the app shell on pages taller than
  // the viewport: the sticky header/progress rail and the 100vh, own-scrolling
  // sidebar render at an offset, leaving the page title floating above a displaced
  // shell. Pin them into normal flow for the capture — at scroll 0 the result is
  // identical to the live layout, minus the artifact.
  await page.addStyleTag({
    content: `
      .workshop-sidebar {
        position: static !important;
        height: auto !important;
        min-height: 100vh !important;
        max-height: none !important;
        overflow: visible !important;
      }
      header,
      .component-wizard-progress {
        position: static !important;
      }
    `,
  });
  await page.waitForTimeout(50);
  // Soft so a single run surfaces a diff at every step; a hard assertion
  // aborts the sequence at the first diff and leaks the rest one run at a time.
  await expect.soft(page).toHaveScreenshot(name, { fullPage: true });
};

/**
 * World Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through Steps 1–5,
 * taking screenshots at each stage to reduce flakiness and runtime.
 */

test('World creation wizard visual sequence (Steps 1–5)', async ({ page }) => {
  test.setTimeout(45000); // Extended timeout for complex wizard
  // Deterministic AI: Step 3 (description -> attributes) calls
  // /api/ai/analyze-world, which has no key in CI and throws — leaving the
  // attributes panel mid-render when the capture fires, so the full-page
  // screenshot comes back short and the diff fails (a develop-wide flake).
  // Mocking the AI routes makes the analysis resolve instantly and stably.
  await mockApiEndpoints(page);
  await seedTestData(page);
  await page.goto('/worlds');
  await waitForContentStable(page);

  await page.goto('/worlds/create');
  await waitForContentStable(page);
  const dismissTutorialOverlay = async () => {
    const overlay = page.locator('[data-test-id="overlay"]');
    if (await overlay.count() === 0) return;

    // Try to find and click skip button
    const skipButton = page.locator('[data-test-id="button-skip"]');
    if (await skipButton.count() > 0) {
      // Wait for button to be visible before clicking
      const isVisible = await skipButton.first().isVisible().catch(() => false);
      if (isVisible) {
        await skipButton.first().click({ force: true });
        await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
        return;
      }
    }

    // If skip button not visible, try primary button
    const primaryButton = page.locator('[data-test-id="button-primary"], [data-test-id="button-pause"]');
    if (await primaryButton.count() > 0) {
      const isVisible = await primaryButton.first().isVisible().catch(() => false);
      if (isVisible) {
        await primaryButton.first().click({ force: true });
        await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
        return;
      }
    }

    // If no buttons are visible, try pressing Escape as fallback
    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
  };

  await test.step('Step 1: Basic Info', async () => {
    await dismissTutorialOverlay();
    await captureWizardStep(page, 'world-creation-step1-basic-info.png');
  });

  await test.step('Step 2: Description', async () => {
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
    await captureWizardStep(page, 'world-creation-step2-description.png');
  });

  await test.step('Step 3: Attributes Review', async () => {
    // Full Description requires at least 50 characters before Next is enabled.
    const descriptionInput = page.locator('[data-testid="world-full-description"]');
    await descriptionInput.fill(
      'A dusty frontier town on the edge of the territory, where law is scarce and every stranger hides a past worth burying.'
    );
    await page.waitForTimeout(150);
    const nextButton2 = page
      .locator('.component-wizard-container')
      .getByRole('button', { name: 'Next' });
    if (await nextButton2.count() > 0) {
      await dismissTutorialOverlay();
      await nextButton2.click();
      await page.waitForTimeout(700);
    }
    await captureWizardStep(page, 'world-creation-step3-attributes.png');
  });

  await test.step('Step 4: Skills Review', async () => {
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
    await captureWizardStep(page, 'world-creation-step4-skills.png');
  });

  await test.step('Step 5: Finalize', async () => {
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
    const nextButton4 = page
      .locator('.component-wizard-container')
      .getByRole('button', { name: 'Next' });
    if (await nextButton4.count() > 0) {
      await dismissTutorialOverlay();
      await nextButton4.click();
      await page.waitForTimeout(700);
    }
    await captureWizardStep(page, 'world-creation-step5-finalize.png');
  });
});
