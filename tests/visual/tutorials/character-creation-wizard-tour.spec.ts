import { test, expect, Page } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import {
  gotoTutorialPage,
  waitForStoreReady,
  setTutorialProgress,
  startTourAt,
  stopTour,
  getVisibleTutorialClip,
  waitForTooltip,
  zeroPad,
} from '../utils/tutorial-helpers';

const steps = [0, 1, 2, 3, 4];

const tutorialScrollTargets = [
  '[data-tutorial="basic-info"]',
  '[data-tutorial="attribute-allocation"]',
  '[data-tutorial="skill-selection"]',
  '[data-tutorial="background-editor"]',
  '[data-tutorial="portrait-generator"]',
];

async function scrollTutorialTargetIntoView(
  page: Page,
  stepIndex: number
): Promise<void> {
  const target = tutorialScrollTargets[stepIndex];
  if (!target) return;

  await page.evaluate((selector) => {
    document
      .querySelector(selector)
      ?.scrollIntoView({ block: 'start', inline: 'nearest' });
  }, target);
  await page.waitForTimeout(100);
}

test('Character creation wizard tour snapshots (steps 0-4)', async ({
  page,
}) => {
  test.setTimeout(180000);

  await seedTestData(page);
  await gotoTutorialPage(page, '/characters/create?worldId=world-cyberpunk-2077');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: true, skipped: true, lastStep: 999 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: {
      completed: false,
      skipped: true,
      lastStep: 0,
      quickStartCompleted: true,
    },
    firstPlay: { completed: true, skipped: true },
  });

  // The create page now lands directly on the wizard's Basic Info step —
  // QuickStart was removed for 1.0 (#1455), so there's no "Create Custom
  // Character" gate to click through.
  const basicInfoName = page.locator(
    'input[placeholder*="Enter character name"]'
  );
  await expect(basicInfoName).toBeVisible({ timeout: 15000 });
  await waitForContentStable(page);

  const wizardNext = page
    .locator('.component-wizard-container')
    .getByRole('button', { name: 'Next' });

  for (const stepIndex of steps) {
    // Stop tour before moving wizard to avoid overlay interception
    await stopTour(page);

    if (stepIndex === 1) {
      // Step 0 (Basic Info) -> Step 1 (Attributes): name is required
      const nameInput = page.locator(
        'input[placeholder*="Enter character name"]'
      );
      await expect(nameInput).toBeVisible({ timeout: 15000 });
      await nameInput.fill('Test Character');
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 2) {
      // Step 1 (Attributes) -> Step 2 (Skills)
      // Allocate required points so we can advance to the skills step.
      await page.evaluate(() => {
        const sliders = Array.from(
          document.querySelectorAll(
            '[data-testid^="allocation-slider-"] input[type="range"]'
          )
        ) as HTMLInputElement[];
        if (!sliders.length) return;

        const setValue = (input: HTMLInputElement, value: number) => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (setter) {
            setter.call(input, String(value));
          } else {
            input.value = String(value);
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const totalPoints = (() => {
          const text =
            document.querySelector('.component-attributes-step')?.textContent ||
            '';
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
      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 3) {
      // Step 2 (Skills) -> Step 3 (Background)
      // Skill selection is required (at least 2 and points allocated)
      const skillToggles = page.locator(
        'button:has-text("Excluded"), button:has-text("Not Selected")'
      );
      let togglesClicked = 0;
      while (togglesClicked < 2) {
        const availableToggle = skillToggles.first();
        if ((await availableToggle.count()) === 0) break;
        await availableToggle.scrollIntoViewIfNeeded();
        await availableToggle.click({ timeout: 5000 });
        togglesClicked += 1;
        await waitForContentStable(page);
      }
      await expect(page.getByText('Selected: 2')).toBeVisible();

      // Increase each selected skill to its maximum level to satisfy the pool
      const skillSliders = page.locator(
        '[data-testid^="skill-level-slider"] input[type="range"]'
      );
      const sliderCount = await skillSliders.count();
      for (let i = 0; i < sliderCount; i++) {
        const slider = skillSliders.nth(i);
        await slider.evaluate((element) => {
          const input = element as HTMLInputElement;
          const max = Number(input.max);
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
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

      await wizardNext.click();
      await waitForContentStable(page);
    } else if (stepIndex === 4) {
      // Step 3 (Background) -> Step 4 (Portrait)
      // Background history (50+) and personality (20+) are required
      const historyTextarea = page.locator('textarea[placeholder*="history"]');
      const personalityTextarea = page.locator(
        'textarea[placeholder*="personality"]'
      );
      await expect(historyTextarea).toBeVisible({ timeout: 15000 });
      await historyTextarea.fill(
        'This is a long history of the test character. They grew up in the neon streets of the cyberpunk city, learning how to survive by their wits and quick reflexes.'
      );
      await personalityTextarea.fill(
        'Strong-willed and determined to succeed.'
      );
      await wizardNext.click();
      await waitForContentStable(page);
    }

    await scrollTutorialTargetIntoView(page, stepIndex);
    await startTourAt(page, 'characterCreationWizard', stepIndex);
    await waitForTooltip(page);
    const clip = await getVisibleTutorialClip(page);
    await expect(page).toHaveScreenshot(
      `tutorial-character-creation-step${zeroPad(stepIndex)}.png`,
      {
        clip,
      }
    );
  }
});
