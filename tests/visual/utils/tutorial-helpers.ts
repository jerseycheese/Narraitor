import { Page, expect } from '@playwright/test';

export const waitForStoreReady = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () =>
      (window as any).__TEST_STORES_SEEDED__ === true &&
      !!(window as any).useSessionStore?.setState,
    { timeout: 15000 }
  );
};

export const setTutorialProgress = async (
  page: Page,
  phases: Record<
    string,
    {
      completed: boolean;
      skipped: boolean;
      lastStep?: number;
      quickStartCompleted?: boolean;
    }
  >
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

export const startTourAt = async (
  page: Page,
  tourId: string,
  stepIndex: number
): Promise<void> => {
  await waitForTestStartTour(page);
  await page.evaluate(
    ({ id, step }) => (window as any).__TEST_START_TOUR__(id, step),
    { id: tourId, step: stepIndex }
  );
};

export const stopTour = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    if (typeof (window as any).__TEST_STOP_TOUR__ === 'function') {
      (window as any).__TEST_STOP_TOUR__();
    }
  });
};

export const waitForTooltip = async (page: Page): Promise<void> => {
  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 10000 });
  await expect
    .poll(
      async () => {
        return page.evaluate(() => {
          const tooltipElement = document.querySelector(
            '.react-joyride__tooltip'
          );
          if (!(tooltipElement instanceof HTMLElement)) return false;

          const rect = tooltipElement.getBoundingClientRect();
          const viewportWidth =
            window.innerWidth || document.documentElement.clientWidth;
          const viewportHeight =
            window.innerHeight || document.documentElement.clientHeight;

          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.right <= viewportWidth &&
            rect.bottom <= viewportHeight
          );
        });
      },
      { timeout: 10000 }
    )
    .toBe(true);
};

/**
 * Hide the Joyride overlay and spotlight (but keep the tooltip) before a tour
 * screenshot. The spotlight currently drifts far below its target, so its
 * absolutely-positioned overlay paints a grey wash over any empty area below
 * short wizard steps. Hiding it keeps the baseline clean while still showing
 * the tooltip and the UI it points at.
 */
export const hideTourOverlay = async (page: Page): Promise<void> => {
  await page.addStyleTag({
    content: `
      .react-joyride__overlay,
      .react-joyride__spotlight,
      .react-joyride__beacon {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
};

export const getVisibleTutorialClip = async (
  page: Page
): Promise<{ x: number; y: number; width: number; height: number }> => {
  return page.evaluate(() => {
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const bodyBottom = document.body.getBoundingClientRect().bottom;
    const tooltipElement = document.querySelector('.react-joyride__tooltip');
    const tooltipBottom =
      tooltipElement instanceof HTMLElement
        ? tooltipElement.getBoundingClientRect().bottom
        : 0;

    return {
      x: 0,
      y: 0,
      width: viewportWidth,
      height: Math.max(
        1,
        Math.min(viewportHeight, Math.ceil(Math.max(bodyBottom, tooltipBottom)))
      ),
    };
  });
};

export const zeroPad = (value: number): string =>
  value.toString().padStart(2, '0');
