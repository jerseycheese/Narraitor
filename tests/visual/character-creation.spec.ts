import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/data-seeder';

/**
 * Character Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through QuickStart → Steps 1–5,
 * taking screenshots at each stage to reduce flakiness and runtime.
 */

test('Character creation wizard visual sequence (QuickStart → Steps 1–5)', async ({ page }) => {
  // Seed once and open worlds page so the app picks up state
  await seedTestData(page);
  await page.goto('/worlds');
  await waitForContentStable(page);

  // Navigate to character creation page with world context
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');

  // Ensure main structure is present
  await page.waitForSelector('h1', { timeout: 15000 });

  await test.step('QuickStart screenshot', async () => {
    // Allow archetype generation to complete
    await page.waitForTimeout(6000);
    const loadingCount = await page.locator('text=Creating archetypes').count();
    if (loadingCount > 0) await page.waitForTimeout(4000);

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-quickstart.png', { fullPage: true });
  });

  await test.step('Step 1: Basic Info', async () => {
    // Click Create Custom Character if visible
    const customButton = page.locator('button:has-text("Create Custom Character")');
    if (await customButton.count() > 0) {
      await customButton.click();
      await page.waitForTimeout(500);
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step1-basic-info.png', { fullPage: true });
  });

  await test.step('Step 2: Attributes', async () => {
    // Fill name if input exists, then go Next
    const nameInput = page.locator('input[placeholder*="Enter character name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Character');
      await page.waitForTimeout(300);
    }
    const nextBtn1 = page.locator('button:has-text("Next")');
    if (await nextBtn1.count() > 0) {
      await nextBtn1.click();
      await page.waitForTimeout(1000);
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step2-attributes.png', { fullPage: true });
  });

  await test.step('Step 3: Skills', async () => {
    // Set all attribute sliders to 0 then go next to skills
    const rangeInputs = page.locator('input[type="range"]');
    const count = await rangeInputs.count();
    for (let i = 0; i < count; i++) {
      await rangeInputs.nth(i).fill('0');
      await page.waitForTimeout(60);
    }
    const nextBtn2 = page.locator('button:has-text("Next")');
    if (await nextBtn2.count() > 0) {
      await nextBtn2.click();
      await page.waitForTimeout(800);
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step3-skills.png', { fullPage: true });
  });

  await test.step('Step 4: Background', async () => {
    // Select at least one skill and continue
    const skillOptions = page.locator('button:has-text("Not Selected"), input[type="checkbox"]:not(:checked)');
    if (await skillOptions.count() > 0) {
      await skillOptions.first().click();
      await page.waitForTimeout(300);
    }
    const nextBtn3 = page.locator('button:has-text("Next")');
    if (await nextBtn3.count() > 0) {
      await nextBtn3.click();
      await page.waitForTimeout(800);
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step4-background.png', { fullPage: true });
  });

  await test.step('Step 5: Portrait', async () => {
    // Fill background fields to enable Next
    const historyTextarea = page.locator('textarea[placeholder*="background"], textarea[placeholder*="history"]');
    if (await historyTextarea.count() > 0) {
      await historyTextarea.fill('Born in the neon-lit streets of Night City, this character learned to navigate the dangerous world of corporate espionage and underground hacking from an early age.');
      await page.waitForTimeout(150);
    }
    const personalityTextarea = page.locator('textarea[placeholder*="personality"]');
    if (await personalityTextarea.count() > 0) {
      await personalityTextarea.fill('Cynical but loyal, with a dry sense of humor and fierce independence.');
      await page.waitForTimeout(150);
    }
    const nextBtn4 = page.locator('button:has-text("Next")');
    if (await nextBtn4.count() > 0) {
      await nextBtn4.click();
      await page.waitForTimeout(800);
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step5-portrait.png', { fullPage: true });
  });
});
