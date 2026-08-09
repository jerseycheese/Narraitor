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

/** Root test id of each wizard step, in walk order. */
const STEP_ROOTS = {
  basicInfo: 'basic-info-step',
  description: 'description-step',
  attributes: 'attribute-review-step',
  skills: 'skill-review-step',
  finalize: 'finalize-step',
} as const;

/** Capture a stable, full-page wizard screenshot with the app shell intact. */
const captureWizardStep = async (page: Page, name: string): Promise<void> => {
  // Park the cursor before scrolling. Playwright leaves the pointer wherever the
  // last click landed, and after the step transition + scroll-to-top that lands
  // on whatever card happens to sit at those viewport coordinates — which then
  // renders its :hover background. Which card that is depends on the previous
  // page's height, so it changes with content. (0, 0) is the header's own
  // padding, which has no hover state.
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForContentStable(page);
  await page.evaluate(() => document.fonts.ready);
  await hideDynamicContent(page);
  // Chromium's full-page screenshot mis-places the app shell on pages taller than
  // the viewport: the sticky header and progress rail render at an offset, leaving
  // the page title floating above a displaced shell. Pin them into normal flow for
  // the capture — at scroll 0 the result is identical to the live layout, minus
  // the artifact.
  await page.addStyleTag({
    content: `
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
 * Click Next and wait for the destination step to actually be on screen.
 *
 * The wizard's handleNext is async — leaving the Description step awaits the
 * attribute/skill generation before it advances — so any fixed sleep is a race:
 * lose it and the capture fires on the step you were leaving, which is what made
 * this spec's heights bounce run to run. Waiting on the destination step's root
 * makes the walk position deterministic regardless of how slow the runner is.
 */
const advanceTo = async (
  page: Page,
  destination: (typeof STEP_ROOTS)[keyof typeof STEP_ROOTS]
): Promise<void> => {
  await page
    .locator('.component-wizard-container')
    .getByRole('button', { name: 'Next' })
    .click();
  // Generation blocks the transition behind a processing overlay; it has to be
  // gone before the destination is real rather than mid-mount.
  await page
    .locator('[data-testid="processing-overlay"]')
    .waitFor({ state: 'detached', timeout: 15000 })
    .catch(() => {});
  await expect(page.locator(`[data-testid="${destination}"]`)).toBeVisible({
    timeout: 15000,
  });
};

/**
 * World Creation Wizard Visual Regression Test (Sequential)
 *
 * Single initialization that walks through Steps 1–5,
 * taking screenshots at each stage to reduce flakiness and runtime.
 */

test('World creation wizard visual sequence (Steps 1–5)', async ({ page }) => {
  test.setTimeout(60000);
  // Deterministic AI: leaving the Description step calls /api/ai/analyze-world,
  // which has no key in CI and throws, dropping the wizard into its local
  // fallback suggestions. Mocking the route pins the attribute and skill counts
  // — and therefore every downstream page height — to fixed values.
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
    await expect(page.locator(`[data-testid="${STEP_ROOTS.basicInfo}"]`)).toBeVisible();
    await captureWizardStep(page, 'world-creation-step1-basic-info.png');
  });

  await test.step('Step 2: Description', async () => {
    await page.locator('[data-testid="world-genre-select"]').selectOption('Fantasy');
    await dismissTutorialOverlay();
    await advanceTo(page, STEP_ROOTS.description);
    await captureWizardStep(page, 'world-creation-step2-description.png');
  });

  await test.step('Step 3: Attributes Review', async () => {
    // Full Description requires at least 50 characters before Next is enabled.
    await page.locator('[data-testid="world-full-description"]').fill(
      'A dusty frontier town on the edge of the territory, where law is scarce and every stranger hides a past worth burying.'
    );
    await dismissTutorialOverlay();
    await advanceTo(page, STEP_ROOTS.attributes);
    await captureWizardStep(page, 'world-creation-step3-attributes.png');
  });

  await test.step('Step 4: Skills Review', async () => {
    // Add a minimal custom attribute to satisfy requirement and advance
    await page.locator('[data-testid="add-custom-attribute-button"]').click();
    await page.getByRole('textbox', { name: 'Attribute Name *' }).fill('Test Attribute');
    await page.getByRole('button', { name: 'Create Attribute' }).click();
    await expect(page.getByText('Test Attribute').first()).toBeVisible();
    await dismissTutorialOverlay();
    await advanceTo(page, STEP_ROOTS.skills);
    await captureWizardStep(page, 'world-creation-step4-skills.png');
  });

  await test.step('Step 5: Finalize', async () => {
    // Add a minimal custom skill and advance
    await page.locator('button:has-text("Add Custom Skill")').click();
    await page.getByRole('textbox', { name: /skill name/i }).first().fill('Test Skill');
    await page
      .locator('textarea[placeholder*="Describe what this skill represents"]')
      .fill('A test skill for visual regression testing.');
    // The SkillEditor lists one checkbox per world attribute (ids start with
    // "attribute-"). Checking the first satisfies the "at least one attribute"
    // rule the editor requires before "Create Skill" enables.
    await page.locator('input[id^="attribute-"]').first().check();
    await page.getByRole('button', { name: /create skill/i }).click();
    await expect(page.getByText('Test Skill').first()).toBeVisible();
    await dismissTutorialOverlay();
    await advanceTo(page, STEP_ROOTS.finalize);
    await captureWizardStep(page, 'world-creation-step5-finalize.png');
  });
});
