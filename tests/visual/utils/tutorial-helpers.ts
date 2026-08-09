import { Page, expect } from '@playwright/test';

/**
 * Navigate to a tutorial page without waiting for the `load` event.
 *
 * Written for `next dev`, which compiles client chunks on first request: `load`
 * waits for those chunks — app/layout.js alone measured ~12s on a cold CI dev
 * server — so a cold route could blow the 20s navigationTimeout even though the
 * document itself came back in 0.6-1.6s. That's what turned the Tutorial Visual
 * Tests job into timeout roulette (#1519).
 *
 * CI now serves these specs from a prebuilt server, so there's nothing left to
 * compile and this is belt-and-braces rather than load-bearing. It stays for
 * local runs, which still use whatever server the developer has up.
 *
 * Every caller follows this with waitForContentStable plus an explicit wait, so
 * dropping to domcontentloaded leaves nothing unsettled.
 */
export const gotoTutorialPage = async (
  page: Page,
  url: string
): Promise<void> => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
};

// Sized for `next dev`, where hydration can't finish until the client chunks
// have been compiled and served on first hit (app/layout.js alone has measured
// ~12s on a cold CI dev server) — so the budget covers compile + hydration, not
// hydration alone. CI's prebuilt server has no compile step left, but local runs
// still hit a dev server, so the headroom stays.
const STORE_READY_TIMEOUT_MS = 30000;

export const waitForStoreReady = async (page: Page): Promise<void> => {
  // waitForFunction signature is (fn, arg, options) — the timeout must go in
  // the third slot, or it's serialized as the (unused) page-function arg and
  // the call silently falls back to the default action timeout.
  await page.waitForFunction(
    () =>
      (window as any).__TEST_STORES_SEEDED__ === true &&
      !!(window as any).useSessionStore?.setState,
    undefined,
    { timeout: STORE_READY_TIMEOUT_MS }
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
    undefined,
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
  await expect(page.locator('.react-joyride__tooltip')).toBeHidden({
    timeout: 5000,
  });
};

export const waitForTooltip = async (page: Page): Promise<void> => {
  const tooltip = page.locator('.react-joyride__tooltip');
  // useTourTargetRetry gives the app exactly 10000ms to resolve a missing tour
  // target before it gives up. Waiting the same 10000ms here races that budget
  // with no slack to observe a resolution that lands near the app's own ceiling,
  // so this needs real headroom past it, not just enough time to see it happen.
  await expect(tooltip).toBeVisible({ timeout: 15000 });
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

          // getVisibleTutorialClip already clamps its clip height to
          // viewportHeight, so a tooltip anchored near the bottom of a tall
          // step (measured live: ~9.6px on the Skills step) doesn't need to
          // fit with zero overflow — it just can't be meaningfully cut off.
          // top/left stay strict: content scrolled above/left of the clip's
          // 0,0 origin is genuinely cropped, not just clamped.
          const OVERFLOW_TOLERANCE_PX = 20;
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.right <= viewportWidth + OVERFLOW_TOLERANCE_PX &&
            rect.bottom <= viewportHeight + OVERFLOW_TOLERANCE_PX
          );
        });
      },
      { timeout: 10000 }
    )
    .toBe(true);
};

/**
 * Hide only the Joyride beacon before a tour screenshot. The overlay and
 * spotlight used to drift far below their target (so the overlay washed grey
 * over empty space and had to be hidden) — that drift is fixed in #1431, so the
 * semi-transparent dim and the target highlight are now part of the intended
 * tour UI and are captured in the baselines.
 */
export const hideTourOverlay = async (page: Page): Promise<void> => {
  await page.addStyleTag({
    content: `
      .react-joyride__beacon {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
  // Joyride positions the tooltip via @floating-ui after it mounts; the visible
  // clip is measured off the tooltip's bottom edge, so capturing before it
  // settles yields a different clip height run-to-run. Let it settle first.
  await page.waitForTimeout(500);
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
