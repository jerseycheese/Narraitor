import { test, expect, Page } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

const waitForStoreReady = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => (window as any).__TEST_STORES_SEEDED__ === true && !!(window as any).useSessionStore?.setState,
    { timeout: 15000 }
  );
};

const setTutorialProgress = async (
  page: Page,
  phases: Record<string, { completed: boolean; skipped: boolean; lastStep?: number; quickStartCompleted?: boolean }>
): Promise<void> => {
  await page.evaluate((phasesState) => {
    const store = (window as any).useSessionStore;
    if (!store?.setState) return;
    store.setState((state: any) => ({
      ...state,
      tutorialProgress: {
        ...state.tutorialProgress,
        phases: {
          ...state.tutorialProgress.phases,
          ...phasesState,
        },
        dismissedHints: [],
        lastActiveStep: null,
      },
    }));
  }, phases);
};

test.describe('Tutorial visual coverage', () => {
  test('World generation tutorial overlay renders consistently', async ({ page }) => {
    test.setTimeout(60000);

    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
    await waitForStoreReady(page);

    await setTutorialProgress(page, {
      intro: { completed: true, skipped: false },
      worldCreation: { completed: true, skipped: false, lastStep: 999 },
      worldGeneration: { completed: false, skipped: false, lastStep: 0 },
      characterCreation: { completed: true, skipped: false, lastStep: 5 },
      firstPlay: { completed: true, skipped: false },
    });

    const generateButton = page.getByRole('button', { name: 'Generate World' });
    await expect(generateButton).toBeVisible({ timeout: 15000 });
    await generateButton.click();
    await waitForContentStable(page);

    const tooltip = page.locator('.react-joyride__tooltip');
    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('instantly generate a complete world setup');

    await expect(page).toHaveScreenshot('tutorial-world-generation-step0.png', { fullPage: true });
  });

  test('World creation tutorial overlays render consistently', async ({ page }) => {
    test.setTimeout(60000);

    await seedTestData(page);
    await page.goto('/worlds/create');
    await waitForContentStable(page);
    await waitForStoreReady(page);

    await setTutorialProgress(page, {
      intro: { completed: true, skipped: false },
      worldCreation: { completed: false, skipped: false, lastStep: 0 },
      worldGeneration: { completed: true, skipped: false, lastStep: 0 },
      characterCreation: { completed: true, skipped: false, lastStep: 5 },
      firstPlay: { completed: true, skipped: false },
    });

    const tooltip = page.locator('.react-joyride__tooltip');
    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('World Creation Wizard');

    await expect(page).toHaveScreenshot('tutorial-world-creation-step0.png', { fullPage: true });

    const tourNext = page.locator('[data-test-id="button-primary"]');
    await tourNext.click({ force: true });
    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('Start from scratch');

    await expect(page).toHaveScreenshot('tutorial-world-creation-step1.png', { fullPage: true });
  });

  test('Character creation wizard tutorial overlay renders consistently', async ({ page }) => {
    test.setTimeout(90000);

    await seedTestData(page);

    // Navigate directly to wizard by going to page and clicking through
    await page.goto('/characters/create?worldId=world-cyberpunk-2077');
    await waitForContentStable(page);
    await waitForStoreReady(page);

    // Set all tutorials as completed to prevent ANY auto-start interference
    // We'll manually control the wizard tour start via test API
    await setTutorialProgress(page, {
      intro: { completed: true, skipped: false },
      worldCreation: { completed: true, skipped: false, lastStep: 999 },
      worldGeneration: { completed: true, skipped: false, lastStep: 0 },
      characterCreation: { completed: true, skipped: false, lastStep: 0 },
      firstPlay: { completed: true, skipped: false },
    });

    // Click to enter wizard (no tutorial interference)
    const customizeButton = page.locator('button:has-text("Create Custom Character")');
    await expect(customizeButton).toBeVisible({ timeout: 15000 });
    await customizeButton.click();

    await waitForContentStable(page);

    // Wait for wizard's first target element to be ready
    const templateSelector = page.locator('[data-tutorial="template-selector"]');
    await expect(templateSelector).toBeVisible({ timeout: 15000 });

    // Wait for test API and tutorial context to be fully initialized
    await page.waitForFunction(() => typeof (window as any).__TEST_START_TOUR__ === 'function', { timeout: 5000 });

    // Give the wizard time to sync its current step with TutorialProvider
    await page.waitForTimeout(500);

    // Manually start the wizard tour using the test API
    const result = await page.evaluate(() => {
      const startTour = (window as any).__TEST_START_TOUR__;
      if (typeof startTour === 'function') {
        try {
          startTour('characterCreationWizard', 0);
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: '__TEST_START_TOUR__ not available' };
    });

    if (!result.success) {
      throw new Error(`Failed to start tour: ${result.error}`);
    }

    // Wait for Joyride to render and position the tooltip
    await page.waitForTimeout(1000);

    const tooltip = page.locator('.react-joyride__tooltip');
    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('character template');

    await expect(page).toHaveScreenshot('tutorial-character-creation-step0.png', { fullPage: true });

    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('Choose a character template');

    await expect(page).toHaveScreenshot('tutorial-character-creation-step0.png', { fullPage: true });
  });
});
