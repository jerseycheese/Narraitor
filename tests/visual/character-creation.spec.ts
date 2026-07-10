import { test, expect, type Page } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  waitForNavigationHeading,
} from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/** Capture a stable, full-page wizard screenshot with the app shell intact. */
const captureFullStep = async (page: Page, name: string): Promise<void> => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForContentStable(page);
  await page.evaluate(() => document.fonts.ready);
  await hideDynamicContent(page);
  // Chromium's full-page screenshot mis-places the app shell on pages taller
  // than the viewport: the sticky header and the 100vh, own-scrolling sidebar
  // render at the current scroll offset, leaving the page title floating above
  // a displaced shell. Pin them into normal flow for the capture — at scroll 0
  // the result matches the live layout, minus the artifact. (Same approach as
  // world-creation.spec's captureWizardStep.)
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
  await expect(page).toHaveScreenshot(name, { fullPage: true });
};

/**
 * Character Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through the wizard Steps 1–5,
 * taking screenshots at each stage to reduce flakiness and runtime.
 *
 * DS coverage (#1264): single-theme (default DS1) by design. All three design
 * systems for the character wizard are already covered by the "Character creation
 * wizard steps render <DS> structure" tests in tests/visual/wizard-themes.spec.ts.
 * Tripling this full Step1→Step5 sequence would duplicate that coverage at
 * much higher runtime/flake cost.
 */

test('Character creation wizard visual sequence (Steps 1–5)', async ({ page }) => {
  test.setTimeout(90000); // Extended timeout for complex wizard
  // Seed once and open worlds page so the app picks up state
  await seedTestData(page);
  await page.goto('/worlds');
  await waitForContentStable(page);

  // Navigate to character creation page with world context
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');

  // Ensure main structure is present
  await page.waitForSelector('h1', { timeout: 10000 });

  await test.step('Step 1: Basic Info', async () => {
    // The create page now lands directly on the wizard's Basic Info step —
    // QuickStart and the template-selection step were removed for 1.0 (#1455).
    await waitForNavigationHeading(page, 'Basic Information', { timeout: 10000, exact: true });
    await captureFullStep(page, 'character-creation-step1-basic-info.png');
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

    await captureFullStep(page, 'character-creation-step2-attributes.png');

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

    await captureFullStep(page, 'character-creation-step3-skills.png');

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
    await page.locator('#character-motivation').fill('Keep the resistance supplied with intel and tech.');
    await page.locator('#character-goals').fill('Liberate grid districts\nProtect resistance safehouses');

    await captureFullStep(page, 'character-creation-step4-background.png');

    const proceedToPortraitBtn = page.locator('button:has-text("Next")');
    if (await proceedToPortraitBtn.count() > 0) {
      await expect(proceedToPortraitBtn).toBeEnabled();
      await proceedToPortraitBtn.click();
      await waitForNavigationHeading(page, 'Character Portrait', { timeout: 5000, exact: true });
    }
  });

  await test.step('Step 5: Portrait', async () => {
    await expect(page.getByRole('heading', { name: 'Character Portrait' })).toBeVisible();

    await captureFullStep(page, 'character-creation-step5-portrait.png');
  });
});
