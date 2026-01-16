import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Character Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through QuickStart → Steps 0–5,
 * taking screenshots at each stage to reduce flakiness and runtime.
 */

test('Character creation wizard visual sequence (QuickStart → Steps 0–5)', async ({ page }) => {
  test.setTimeout(90000); // Extended timeout for complex wizard
  // Seed once and open worlds page so the app picks up state
  await seedTestData(page);
  await page.goto('/worlds');
  await waitForContentStable(page);

  // Navigate to character creation page with world context
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');

  // Ensure main structure is present
  await page.waitForSelector('h1', { timeout: 10000 });
  await hideDynamicContent(page);

  await test.step('QuickStart screenshot', async () => {
    // Allow archetype generation to complete - this needs extra time
    await waitForContentStable(page);
    const loadingCount = await page.locator('text=Creating archetypes').count();
    if (loadingCount > 0) {
      await page.waitForTimeout(2000); // Give extra time for archetype generation
    }

    await expect(page).toHaveScreenshot('character-creation-quickstart.png', { fullPage: true });
  });

  await test.step('Step 0: Template Selection', async () => {
    // Click Create Custom Character if visible
    const customButton = page.locator('button:has-text("Create Custom Character")');
    if (await customButton.count() > 0) {
      await customButton.click();
      await page.waitForTimeout(500); // Allow UI transition
    }
    await expect(page).toHaveScreenshot('character-creation-step0-template-selection.png', { fullPage: true });
  });

  await test.step('Step 1: Basic Info', async () => {
    // Skip template selection by clicking Next
    const skipTemplateBtn = page.locator('button:has-text("Next"):not([data-test-id="button-primary"])');
    if (await skipTemplateBtn.count() > 0) {
      await skipTemplateBtn.click();
      await page.waitForTimeout(500); // Allow navigation
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step1-basic-info.png', { fullPage: true });
  });

  await test.step('Step 2: Attributes', async () => {
    // Fill name if input exists, then go Next
    const nameInput = page.locator('input[placeholder*="Enter character name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Character');
      await page.waitForTimeout(200); // Allow input to register
    }
    const nextBtn1 = page.locator('button:has-text("Next"):not([data-test-id="button-primary"])');
    if (await nextBtn1.count() > 0) {
      await nextBtn1.click();
      await page.waitForTimeout(800); // Allow navigation
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step2-attributes.png', { fullPage: true });

    // Allocate required points (10 + 10) so we can advance to the skills step
    const attributeSliders = page.locator('[data-testid^="allocation-slider-"] input[type="range"]');
    const sliderTotal = await attributeSliders.count();
    for (let i = 0; i < sliderTotal; i++) {
      const slider = attributeSliders.nth(i);
      await slider.focus();
      for (let j = 0; j < 10; j++) {
        await slider.press('ArrowRight');
        await page.waitForTimeout(30);
      }
    }
    await waitForContentStable(page);

    const proceedToSkillsBtn = page.locator('button:has-text("Next"):not([data-test-id="button-primary"])');
    if (await proceedToSkillsBtn.count() > 0) {
      await proceedToSkillsBtn.click();
      await page.waitForTimeout(800);
    }
  });

  await test.step('Step 3: Skills', async () => {
    // Select the first two skills to enable point allocation
    const skillToggles = page.locator('button:has-text("Excluded"), button:has-text("Not Selected")');
    let togglesClicked = 0;
    while (togglesClicked < 2) {
      const availableToggle = skillToggles.first();
      if ((await availableToggle.count()) === 0) {
        break;
      }
      await availableToggle.scrollIntoViewIfNeeded();
      await availableToggle.click({ timeout: 5000 });
      togglesClicked += 1;
      await waitForContentStable(page);
    }
    if (togglesClicked === 0) {
      throw new Error('No skill toggles available on Skills step.');
    }

    // Increase each selected skill to its maximum level to satisfy the pool
    const skillSliders = page.locator('[data-testid^="skill-level-slider"] input[type="range"]');
    const sliderCount = await skillSliders.count();
    for (let i = 0; i < sliderCount; i++) {
      const slider = skillSliders.nth(i);
      await slider.focus();
      for (let j = 0; j < 10; j++) {
        await slider.press('ArrowRight');
        await page.waitForTimeout(25);
      }
    }
    await waitForContentStable(page);

    await expect(page.getByText(/^Remaining:/)).toContainText('Remaining: 0');
    await expect(page.getByText(/^Allocated Points:/).first()).toBeVisible();

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step3-skills.png', { fullPage: true });

    const proceedToBackgroundBtn = page.locator('button:has-text("Next"):not([data-test-id="button-primary"])');
    if (await proceedToBackgroundBtn.count() > 0) {
      await expect(proceedToBackgroundBtn).toBeEnabled();
      await proceedToBackgroundBtn.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step('Step 4: Background', async () => {
    await expect(page.getByRole('heading', { name: 'Character Background' })).toBeVisible();

    await page.locator('#character-history').fill(
      'Raised amidst neon spires, your character escaped corporate oversight and now hacks for the underground movement.'
    );
    await page.locator('#character-personality').fill(
      'Clever, dry sense of humor, suspicious of authority but fiercely loyal to found family.'
    );
    await page.locator('#character-physical-description').fill('Augmented cybernetic eye, worn leather jacket, intricate data tattoos.');
    await page.locator('#character-motivation').fill('Keep the resistance supplied with intel and tech.');
    await page.locator('#character-goals').fill('Liberate grid districts\nProtect resistance safehouses');

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step4-background.png', { fullPage: true });

    const proceedToPortraitBtn = page.locator('button:has-text("Next"):not([data-test-id="button-primary"])');
    if (await proceedToPortraitBtn.count() > 0) {
      await expect(proceedToPortraitBtn).toBeEnabled();
      await proceedToPortraitBtn.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step('Step 5: Portrait', async () => {
    await expect(page.getByRole('heading', { name: 'Character Portrait' })).toBeVisible();

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step5-portrait.png', { fullPage: true });
  });
});
