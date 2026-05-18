import { test, expect } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  waitForNavigationHeading,
} from './utils/wait-helpers';
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

  await test.step('QuickStart screenshot', async () => {
    // Allow archetype generation to complete - this needs extra time
    await waitForContentStable(page);
    await page.waitForFunction(
      () => {
        const text = document.body.textContent ?? '';
        if (!text.includes('Creating archetypes')) {
          return true;
        }
        return Array.from(document.querySelectorAll('button')).some((button) =>
          button.textContent?.includes('Create Custom Character')
        );
      },
      { timeout: 10000 }
    );

    await hideDynamicContent(page);
    // Clip excludes the Joyride overlay phantom that absolute-positions
    // below the visible content (mis-measured spotlight). See PR #1233.
    await expect(page).toHaveScreenshot('character-creation-quickstart.png', {
      clip: { x: 0, y: 0, width: 1280, height: 1080 },
    });
  });

  await test.step('Step 0: Template Selection', async () => {
    // Click Create Custom Character if visible
    const customButton = page.locator('button:has-text("Create Custom Character")');
    if (await customButton.count() > 0) {
      await customButton.click();
      await waitForNavigationHeading(page, 'Choose a Starting Template', { timeout: 5000, exact: true });
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step0-template-selection.png', { fullPage: true });
  });

  await test.step('Step 1: Basic Info', async () => {
    // Skip template selection by clicking Next
    const skipTemplateBtn = page.locator('button:has-text("Next")');
    if (await skipTemplateBtn.count() > 0) {
      await skipTemplateBtn.click();
      await waitForNavigationHeading(page, 'Basic Information', { timeout: 5000, exact: true });
    }
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step1-basic-info.png', { fullPage: true });
  });

  await test.step('Step 2: Attributes', async () => {
    // Fill name if input exists, then go Next
    const nameInput = page.locator('input[placeholder*="Enter character name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Character');
      await expect(nameInput).toHaveValue('Test Character', { timeout: 2000 });
    }
    const nextBtn1 = page.locator('button:has-text("Next")');
    if (await nextBtn1.count() > 0) {
      await nextBtn1.click();
      await waitForNavigationHeading(page, 'Allocate Attribute Points', { timeout: 5000, exact: true });
    }

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step2-attributes.png', { fullPage: true });

    // Allocate required points so we can advance to the skills step.
    // Use the native value setter so React's onChange fires reliably.
    await page.evaluate(() => {
      const sliders = Array.from(
        document.querySelectorAll('[data-testid^="allocation-slider-"] input[type="range"]')
      ) as HTMLInputElement[];
      if (!sliders.length) return;

      const setValue = (input: HTMLInputElement, value: number) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(input, String(value));
        } else {
          input.value = String(value);
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const totalPoints = (() => {
        const text = document.querySelector('.component-attributes-step')?.textContent || '';
        const match = text.match(/Total:\s*(\d+)/);
        return match ? Number(match[1]) : 0;
      })();

      const mins = sliders.map((slider) => Number(slider.min));
      const maxes = sliders.map((slider) => Number(slider.max));
      const minSum = mins.reduce((sum, value) => sum + value, 0);
      let remaining = Math.max(0, totalPoints - minSum);

      sliders.forEach((slider, index) => {
        const capacity = maxes[index] - mins[index];
        const allocation = remaining > 0 ? Math.min(remaining, capacity) : 0;
        setValue(slider, mins[index] + allocation);
        remaining -= allocation;
      });
    });
    await waitForContentStable(page);

    const attributeRemaining = page.locator('.component-attributes-step').getByText(/Remaining:/);
    await expect(attributeRemaining).toContainText('Remaining: 0', { timeout: 10000 });

    const proceedToSkillsBtn = page.locator('button:has-text("Next")');
    if (await proceedToSkillsBtn.count() > 0) {
      await expect(proceedToSkillsBtn).toBeEnabled({ timeout: 10000 });
      await proceedToSkillsBtn.click();
      await waitForNavigationHeading(page, 'Allocate Skill Points', { timeout: 10000, exact: true });
    }
  });

  await test.step('Step 3: Skills', async () => {
    await page.locator('.component-skills-step').waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Allocate Skill Points' })).toBeVisible();

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
      await slider.evaluate((element) => {
        const input = element as HTMLInputElement;
        const max = Number(input.max);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(input, String(max));
        } else {
          input.value = String(max);
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    await waitForContentStable(page);

    const remainingBadge = page.locator('.component-skills-step').getByText(/Remaining:/);
    await expect(remainingBadge).toContainText('Remaining: 0', { timeout: 10000 });
    await expect(page.getByText(/^Allocated Points:/).first()).toBeVisible();

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step3-skills.png', { fullPage: true });

    const proceedToBackgroundBtn = page.locator('button:has-text("Next")');
    if (await proceedToBackgroundBtn.count() > 0) {
      await expect(proceedToBackgroundBtn).toBeEnabled();
      await proceedToBackgroundBtn.click();
      await waitForNavigationHeading(page, 'Character Background', { timeout: 5000, exact: true });
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

    const proceedToPortraitBtn = page.locator('button:has-text("Next")');
    if (await proceedToPortraitBtn.count() > 0) {
      await expect(proceedToPortraitBtn).toBeEnabled();
      await proceedToPortraitBtn.click();
      await waitForNavigationHeading(page, 'Character Portrait', { timeout: 5000, exact: true });
    }
  });

  await test.step('Step 5: Portrait', async () => {
    await expect(page.getByRole('heading', { name: 'Character Portrait' })).toBeVisible();

    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('character-creation-step5-portrait.png', { fullPage: true });
  });
});
