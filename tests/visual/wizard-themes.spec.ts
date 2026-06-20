import { test, expect, type Page } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  waitForNavigationHeading,
} from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

type ThemeId = 'ds1' | 'ds2' | 'ds3';

const themes: ThemeId[] = ['ds1', 'ds2', 'ds3'];

async function setTheme(page: Page, theme: ThemeId): Promise<void> {
  await page.evaluate((theme) => {
    localStorage.setItem('narraitor-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const windowWithStores = window as typeof window & {
      useSessionStore?: {
        getState?: () => {
          updateTutorialProgress?: (
            phase: 'worldCreation' | 'characterCreation',
            progress: { completed: boolean; skipped: boolean; lastStep: number }
          ) => void;
        };
      };
    };

    const sessionStore = windowWithStores.useSessionStore?.getState?.();
    sessionStore?.updateTutorialProgress?.('worldCreation', {
      completed: true,
      skipped: true,
      lastStep: 999,
    });
    sessionStore?.updateTutorialProgress?.('characterCreation', {
      completed: true,
      skipped: true,
      lastStep: 999,
    });
  }, theme);

  await page.waitForFunction(
    (theme) => document.documentElement.getAttribute('data-theme') === theme,
    theme
  );
  await page.evaluate(() => document.fonts.ready);
  await waitForContentStable(page);
  await hideDynamicContent(page);
}

async function captureStep(
  page: Page,
  theme: ThemeId,
  snapshotName: string
): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForContentStable(page);
  await setTheme(page, theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  // Soft so one run surfaces every stale step's diff instead of stopping at the
  // first — multi-step fullPage specs otherwise cascade one step per CI run.
  await expect.soft(page).toHaveScreenshot(snapshotName, { fullPage: true });
}

async function captureWidget(
  page: Page,
  locator: ReturnType<Page['locator']>,
  snapshotName: string
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await expect.soft(locator).toHaveScreenshot(snapshotName);
}

async function clickWizardNext(page: Page): Promise<void> {
  const nextButton = page
    .locator('.component-wizard-container')
    .getByRole('button', { name: 'Next' })
    .first();

  if (await nextButton.count()) {
    await nextButton.click();
    await waitForContentStable(page);
  }
}

async function openWorldWizard(page: Page, theme: ThemeId): Promise<void> {
  await seedTestData(page);
  // Opens on the Basic Info step (step 0). The template-choice entry screen was
  // removed in #1454, so there's no longer a step to skip past.
  await page.goto('/worlds/create');
  await page.waitForSelector('.component-world-creation-wizard', {
    timeout: 10000,
  });
  await setTheme(page, theme);
}

async function openCharacterWizard(page: Page, theme: ThemeId): Promise<void> {
  await seedTestData(page);
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');
  await page.waitForSelector('h1', { timeout: 10000 });
  await setTheme(page, theme);
}

async function fillCharacterAttributes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sliders = Array.from(
      document.querySelectorAll('[data-testid^="allocation-slider-"] input[type="range"]')
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
        document.querySelector('.component-attributes-step')?.textContent || '';
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
}

async function fillCharacterSkills(page: Page): Promise<void> {
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

  const skillSliders = page.locator(
    '[data-testid^="skill-level-slider"] input[type="range"]'
  );
  const sliderCount = await skillSliders.count();
  for (let i = 0; i < sliderCount; i++) {
    await skillSliders.nth(i).evaluate((element) => {
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
}

test.describe('Wizard Theme Differentiation', () => {
  for (const theme of themes) {
    test(`World creation wizard steps render ${theme.toUpperCase()} structure`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await openWorldWizard(page, theme);

      await captureStep(
        page,
        theme,
        `wizard-world-${theme}-step1-basic-info.png`
      );

      const nameInput = page.locator(
        'input[placeholder*="world name"], input[name="name"], input[placeholder*="Enter name"]'
      );
      if (await nameInput.count()) {
        await nameInput.fill(`Test World ${theme.toUpperCase()}`);
      }
      const genreSelect = page.locator('[data-testid="world-genre-select"]');
      if (await genreSelect.count()) {
        await genreSelect.selectOption('Fantasy');
      }
      const briefDescription = page.locator(
        '[data-testid="world-description-textarea"]'
      );
      if (await briefDescription.count()) {
        await briefDescription.fill(
          'A test world created for all-theme visual regression testing.'
        );
      }
      await clickWizardNext(page);
      await captureStep(
        page,
        theme,
        `wizard-world-${theme}-step2-description.png`
      );

      const descriptionInput = page.locator(
        'textarea[placeholder*="Describe your world"], textarea[placeholder*="description"], textarea[name="description"]'
      );
      if (await descriptionInput.count()) {
        await descriptionInput.fill(
          'A test world created for all-theme visual regression testing.'
        );
      }
      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Review Attributes', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-world-${theme}-step3-attributes.png`
      );

      const addCustomAttributeButton = page.locator(
        '[data-testid="add-custom-attribute-button"]'
      );
      if (await addCustomAttributeButton.count()) {
        await addCustomAttributeButton.click();
        await page.getByRole('textbox', { name: 'Attribute Name *' }).fill(
          `Test Attribute ${theme.toUpperCase()}`
        );
        // Internal widget: custom attribute editor (open state)
        await captureWidget(
          page,
          page.locator('[data-testid="custom-attribute-editor"]'),
          `wizard-world-${theme}-internal-custom-attribute-editor.png`
        );
        await page.getByRole('button', { name: 'Create Attribute' }).click();
        await waitForContentStable(page);
      }

      // Internal widget: attribute slot meter / count summary
      const attributeSummary = page.locator(
        '[data-testid="attribute-count-summary"]'
      );
      if (await attributeSummary.count()) {
        await captureWidget(
          page,
          attributeSummary,
          `wizard-world-${theme}-internal-attribute-slot-meter.png`
        );
      }
      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Review Skills', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-world-${theme}-step4-skills.png`
      );

      const addCustomSkillButton = page.getByRole('button', {
        name: 'Add Custom Skill',
      });
      if (await addCustomSkillButton.count()) {
        await addCustomSkillButton.click();
        await page.getByRole('textbox', { name: /skill name/i }).first().fill(
          `Test Skill ${theme.toUpperCase()}`
        );
        const skillDescription = page.locator(
          'textarea[placeholder*="Describe what this skill represents"]'
        );
        if (await skillDescription.count()) {
          await skillDescription.fill(
            'A test skill for all-theme visual regression testing.'
          );
        }
        const firstAttributeCheckbox = page
          .locator('form input[type="checkbox"]')
          .first();
        if (await firstAttributeCheckbox.count()) {
          await firstAttributeCheckbox.check();
        }
        // Internal widget: custom skill editor (open state)
        await captureWidget(
          page,
          page.locator('[data-testid="custom-skill-editor"]'),
          `wizard-world-${theme}-internal-custom-skill-editor.png`
        );
        const createSkillButton = page.getByRole('button', {
          name: /create skill/i,
        });
        if (await createSkillButton.count()) {
          await createSkillButton.click();
          await waitForContentStable(page);
        }
      }
      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Review Your World', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-world-${theme}-step5-finalize.png`
      );
    });

    test(`Character creation wizard steps render ${theme.toUpperCase()} structure`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await openCharacterWizard(page, theme);

      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-quickstart.png`
      );

      const customButton = page.getByRole('button', {
        name: 'Create Custom Character',
      });
      if (await customButton.count()) {
        await customButton.click();
        await waitForNavigationHeading(page, 'Choose a Starting Template', {
          timeout: 10000,
          exact: true,
        });
      }
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step0-template-selection.png`
      );

      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Basic Information', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step1-basic-info.png`
      );

      const nameInput = page.locator('input[placeholder*="Enter character name"]');
      if (await nameInput.count()) {
        await nameInput.fill(`Test Character ${theme.toUpperCase()}`);
      }
      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Allocate Attribute Points', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step2-attributes.png`
      );

      // Internal widget: point-pool allocation manager
      const pointPool = page.locator('.component-point-pool-manager');
      if (await pointPool.count()) {
        await captureWidget(
          page,
          pointPool,
          `wizard-character-${theme}-internal-point-pool.png`
        );
      }

      await fillCharacterAttributes(page);
      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Allocate Skill Points', {
        timeout: 10000,
        exact: true,
      });
      await fillCharacterSkills(page);
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step3-skills.png`
      );

      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Character Background', {
        timeout: 10000,
        exact: true,
      });
      await page.locator('#character-history').fill(
        'Raised amidst neon spires, this character escaped corporate oversight and now hacks for the underground movement.'
      );
      await page.locator('#character-personality').fill(
        'Clever, dry sense of humor, suspicious of authority but fiercely loyal to found family.'
      );
      await page.locator('#character-physical-description').fill(
        'Augmented cybernetic eye, worn leather jacket, intricate data tattoos.'
      );
      await page.locator('#character-motivation').fill(
        'Keep the resistance supplied with intel and tech.'
      );
      await page.locator('#character-goals').fill(
        'Liberate grid districts\nProtect resistance safehouses'
      );
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step4-background.png`
      );

      await clickWizardNext(page);
      await waitForNavigationHeading(page, 'Character Portrait', {
        timeout: 10000,
        exact: true,
      });
      await captureStep(
        page,
        theme,
        `wizard-character-${theme}-step5-portrait.png`
      );

      // Internal widget: portrait controls + frame
      const portraitControls = page.locator('.component-portrait-step');
      if (await portraitControls.count()) {
        await captureWidget(
          page,
          portraitControls,
          `wizard-character-${theme}-internal-portrait-controls.png`
        );
      }
    });
  }
});
