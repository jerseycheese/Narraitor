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
  phases: Record<string, { completed: boolean; skipped: boolean; lastStep?: number }>
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

  test('Character creation tutorial overlays render consistently', async ({ page }) => {
    test.setTimeout(90000);

    await seedTestData(page);
    await page.goto('/characters/create?worldId=world-cyberpunk-2077');
    await waitForContentStable(page);
    await waitForStoreReady(page);

    const customizeButton = page.locator('button:has-text("Create Custom Character")');
    await expect(customizeButton).toBeVisible({ timeout: 15000 });
    await customizeButton.click();

    await waitForContentStable(page);

    await setTutorialProgress(page, {
      intro: { completed: true, skipped: false },
      worldCreation: { completed: true, skipped: false, lastStep: 999 },
      worldGeneration: { completed: true, skipped: false, lastStep: 0 },
      characterCreation: { completed: false, skipped: false, lastStep: 0 },
      firstPlay: { completed: true, skipped: false },
    });

    const tooltip = page.locator('.react-joyride__tooltip');
    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('character template');

    await expect(page).toHaveScreenshot('tutorial-character-creation-step0.png', { fullPage: true });

    await expect(tooltip).toBeVisible({ timeout: 10000 });
    await expect(tooltip).toContainText('Choose a character template');

    await expect(page).toHaveScreenshot('tutorial-character-creation-step0.png', { fullPage: true });
  });
});
