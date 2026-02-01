import { Page, expect } from '@playwright/test';

export const waitForStoreReady = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => (window as any).__TEST_STORES_SEEDED__ === true && !!(window as any).useSessionStore?.setState,
    { timeout: 15000 }
  );
};

export const setTutorialProgress = async (
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

export const waitForTestStartTour = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => typeof (window as any).__TEST_START_TOUR__ === 'function',
    { timeout: 15000 }
  );
};

export const startTourAt = async (page: Page, tourId: string, stepIndex: number): Promise<void> => {
  await waitForTestStartTour(page);
  await page.evaluate(
    ({ id, step }) => (window as any).__TEST_START_TOUR__(id, step),
    { id: tourId, step: stepIndex }
  );
};

export const waitForTooltip = async (page: Page): Promise<void> => {
  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 10000 });
};

export const zeroPad = (value: number): string => value.toString().padStart(2, '0');
